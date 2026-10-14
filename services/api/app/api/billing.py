"""FastAPI Endpoints for Individual & Organization Subscriptions, Admin Pricing & Razorpay Security."""
from __future__ import annotations

import json
import os
from typing import Any, Dict, Optional

from fastapi import APIRouter, Header, HTTPException, Query, Request

from ..schemas.billing import (
    AdminPriceUpdateRequest,
    CheckoutOrderOut,
    CreateCheckoutOrderRequest,
    CreateOrganizationRequest,
    OrganizationDashboardOut,
    OrganizationQuoteOut,
    PricingSnapshotOut,
    SeatMemberActionRequest,
    SubscriptionStatus,
    UserAccountSummaryOut,
    VerifyPaymentSignatureRequest,
)
from ..services.billing_engine import (
    calculate_organization_seat_quote,
    get_billing_store,
)

router = APIRouter(prefix="/billing", tags=["Subscriptions, Pricing & Organizations"])


@router.get("/pricing", response_model=PricingSnapshotOut)
async def get_current_pricing() -> PricingSnapshotOut:
    """Returns currently effective Individual price (default ₹19/mo) and 25% Organization discount."""
    return get_billing_store().get_pricing_snapshot()


@router.put("/admin/pricing", response_model=PricingSnapshotOut)
async def update_admin_pricing(
    payload: AdminPriceUpdateRequest,
    x_admin_key: Optional[str] = Header(default=None, alias="X-Admin-Key"),
) -> PricingSnapshotOut:
    """Protected endpoint for authorized admin to update current subscription price and effective date."""
    return get_billing_store().admin_update_pricing(x_admin_key, payload)


@router.get("/quote/organization", response_model=OrganizationQuoteOut)
async def get_organization_seat_quote(
    seats: int = Query(default=100, ge=1, le=100000),
) -> OrganizationQuoteOut:
    """Dynamic Organization seat calculator (e.g. 100 seats @ ₹19 = ₹1,900 -> 25% off ₹475 -> ₹1,425)."""
    store = get_billing_store()
    p = store.current_pricing
    return calculate_organization_seat_quote(
        seats=seats,
        unit_price_paise=p["individual_price_paise"],
        discount_percent=p["org_discount_percent"],
    )


@router.get("/account", response_model=UserAccountSummaryOut)
async def get_my_billing_account(
    x_user_id: Optional[str] = Header(default=None, alias="X-User-ID"),
    x_user_email: Optional[str] = Header(default=None, alias="X-User-Email"),
) -> UserAccountSummaryOut:
    return get_billing_store().get_user_summary(x_user_id or "", email=x_user_email)


@router.post("/account/consent-price-change", response_model=UserAccountSummaryOut)
async def consent_to_updated_renewal_price(
    x_user_id: Optional[str] = Header(default=None, alias="X-User-ID"),
) -> UserAccountSummaryOut:
    store = get_billing_store()
    u = store.ensure_user(x_user_id or "")
    if u.get("pending_price_change_paise") is not None:
        u["locked_subscription_price_paise"] = u["pending_price_change_paise"]
        u["pending_price_change_paise"] = None
        u["price_change_consent_granted"] = True
    return store.get_user_summary(u["user_id"])


@router.post("/account/cancel", response_model=UserAccountSummaryOut)
async def cancel_individual_subscription(
    x_user_id: Optional[str] = Header(default=None, alias="X-User-ID"),
) -> UserAccountSummaryOut:
    store = get_billing_store()
    u = store.ensure_user(x_user_id or "")
    u["subscription_status"] = SubscriptionStatus.CANCELLED
    return store.get_user_summary(u["user_id"])


@router.post("/checkout/create-order", response_model=CheckoutOrderOut)
async def create_checkout_order(
    payload: CreateCheckoutOrderRequest,
    x_user_id: Optional[str] = Header(default=None, alias="X-User-ID"),
) -> CheckoutOrderOut:
    store = get_billing_store()
    return store.create_checkout_order(
        user_id=x_user_id or "",
        plan_type=payload.plan_type,
        seats=payload.seats,
        org_id=payload.org_id,
    )


@router.post("/checkout/sandbox-test-signature")
async def generate_sandbox_test_signature(
    order_id: str = Query(...),
    x_user_id: Optional[str] = Header(default=None, alias="X-User-ID"),
) -> Dict[str, str]:
    """Helper available ONLY in sandbox/test mode so local review can test full HMAC verification."""
    from ..core.config import settings

    rzp_key = os.getenv("RAZORPAY_KEY_ID", "").strip()
    if rzp_key.startswith("rzp_live") or (settings.environment.lower() == "production" and not settings.demo_mode):
        raise HTTPException(
            status_code=403,
            detail="Sandbox signature generation is strictly forbidden in production mode. Live payment verification must come directly from Razorpay.",
        )
    store = get_billing_store()
    store.ensure_user(x_user_id or "")
    payment_id = f"pay_sandbox_{order_id[-8:]}"
    sig = store.compute_checkout_signature(order_id, payment_id)
    return {
        "razorpay_order_id": order_id,
        "razorpay_payment_id": payment_id,
        "razorpay_signature": sig,
    }


@router.post("/checkout/verify", response_model=UserAccountSummaryOut)
async def verify_checkout_payment(
    payload: VerifyPaymentSignatureRequest,
    x_user_id: Optional[str] = Header(default=None, alias="X-User-ID"),
) -> UserAccountSummaryOut:
    store = get_billing_store()
    store.verify_and_activate_order(
        user_id=x_user_id or "",
        order_id=payload.razorpay_order_id,
        payment_id=payload.razorpay_payment_id,
        signature=payload.razorpay_signature,
    )
    return store.get_user_summary(x_user_id or "")


@router.post("/webhooks/razorpay")
async def razorpay_webhook_handler(
    request: Request,
    x_razorpay_signature: Optional[str] = Header(default=None, alias="X-Razorpay-Signature"),
) -> Dict[str, Any]:
    raw_body = await request.body()
    payload = json.loads(raw_body.decode("utf-8"))
    return get_billing_store().process_webhook(raw_body, x_razorpay_signature, payload)


# --- Organization Endpoints (Part E3) ---
@router.post("/organizations", response_model=OrganizationDashboardOut)
async def create_organization(
    payload: CreateOrganizationRequest,
    x_user_id: Optional[str] = Header(default=None, alias="X-User-ID"),
) -> OrganizationDashboardOut:
    return get_billing_store().create_organization(
        admin_user_id=x_user_id or "",
        name=payload.name,
        initial_seats=payload.initial_seats,
    )


@router.get("/organizations/{org_id}", response_model=OrganizationDashboardOut)
async def get_organization(
    org_id: str,
    x_user_id: Optional[str] = Header(default=None, alias="X-User-ID"),
) -> OrganizationDashboardOut:
    return get_billing_store().get_organization_dashboard(
        org_id=org_id,
        requesting_user_id=x_user_id or "",
    )


@router.post("/organizations/{org_id}/seats/invite", response_model=OrganizationDashboardOut)
async def invite_organization_member(
    org_id: str,
    payload: SeatMemberActionRequest,
    x_user_id: Optional[str] = Header(default=None, alias="X-User-ID"),
) -> OrganizationDashboardOut:
    return get_billing_store().invite_or_assign_seat(
        org_id=org_id,
        requesting_user_id=x_user_id or "",
        member_email=payload.member_email,
        member_user_id=payload.member_user_id,
        assign_immediately=False,
    )


@router.post("/organizations/{org_id}/seats/assign", response_model=OrganizationDashboardOut)
async def assign_organization_seat(
    org_id: str,
    payload: SeatMemberActionRequest,
    x_user_id: Optional[str] = Header(default=None, alias="X-User-ID"),
) -> OrganizationDashboardOut:
    return get_billing_store().invite_or_assign_seat(
        org_id=org_id,
        requesting_user_id=x_user_id or "",
        member_email=payload.member_email,
        member_user_id=payload.member_user_id,
        assign_immediately=True,
    )


@router.post(
    "/organizations/{org_id}/seats/{seat_id}/revoke",
    response_model=OrganizationDashboardOut,
)
async def revoke_organization_seat(
    org_id: str,
    seat_id: str,
    x_user_id: Optional[str] = Header(default=None, alias="X-User-ID"),
) -> OrganizationDashboardOut:
    return get_billing_store().revoke_seat(
        org_id=org_id,
        requesting_user_id=x_user_id or "",
        seat_id=seat_id,
    )
