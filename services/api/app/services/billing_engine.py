"""Deterministic SaaS Billing, Metering, Organization RBAC, and Razorpay HMAC Engine.

Enforces Parts D, E, F, and G:
1. Every new user gets exactly 2 free successful analyses (`FREE_LIMIT = 2`).
2. Failed, incomplete, or duplicate (retried) requests NEVER consume a free analysis.
3. Introductory Individual price = ₹19/month (`1900` paise). Admin can update future pricing
   with effective dates; existing subscribers keep their locked price snapshot until explicit consent.
4. Organization bulk seat formula uses integer paise & Decimal (zero floating-point drift):
   - Original total = current_individual_price × seats
   - Discount amount = Original total × 25%
   - Final monthly price = Original total × 75%
   - Verified at 100 seats @ ₹19: Original = ₹1,900, Discount = ₹475, Final = ₹1,425.
5. Razorpay orders and webhooks verify HMAC-SHA256 signatures and enforce webhook idempotency.
"""
from __future__ import annotations

import hashlib
import hmac
import os
import uuid
from datetime import datetime, timedelta, timezone
from decimal import ROUND_HALF_UP, Decimal
from typing import Any, Dict, List, Optional

from fastapi import HTTPException

from ..schemas.billing import (
    AdminPriceUpdateRequest,
    AuditLogEntryOut,
    CheckoutOrderOut,
    OrganizationDashboardOut,
    OrganizationQuoteOut,
    OrganizationSeatOut,
    PlanType,
    PricingSnapshotOut,
    SeatStatus,
    SubscriptionStatus,
    UserAccountSummaryOut,
)


def paise_to_inr(paise: int) -> Decimal:
    return (Decimal(paise) / Decimal(100)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def inr_to_paise(inr: Decimal) -> int:
    return int((inr * Decimal(100)).quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def calculate_organization_seat_quote(
    seats: int,
    unit_price_paise: int,
    discount_percent: int = 25,
) -> OrganizationQuoteOut:
    """Exact Decimal / integer-paise calculation for Organization bulk seats."""
    if seats < 1:
        raise ValueError("Seat count must be at least 1.")
    if unit_price_paise < 0:
        raise ValueError("Unit price cannot be negative.")
    if not (0 <= discount_percent <= 90):
        raise ValueError("Discount percentage must be between 0 and 90.")

    original_total_paise = unit_price_paise * seats
    # Exact Decimal math rounded to nearest paisa
    discount_paise = int(
        (Decimal(original_total_paise) * Decimal(discount_percent) / Decimal(100)).quantize(
            Decimal("1"), rounding=ROUND_HALF_UP
        )
    )
    final_monthly_paise = original_total_paise - discount_paise
    effective_per_seat_paise = int(
        (Decimal(final_monthly_paise) / Decimal(seats)).quantize(
            Decimal("1"), rounding=ROUND_HALF_UP
        )
    )

    unit_inr = paise_to_inr(unit_price_paise)
    orig_inr = paise_to_inr(original_total_paise)
    disc_inr = paise_to_inr(discount_paise)
    final_inr = paise_to_inr(final_monthly_paise)
    per_seat_inr = paise_to_inr(effective_per_seat_paise)

    return OrganizationQuoteOut(
        seats=seats,
        unit_price_paise=unit_price_paise,
        unit_price_inr=unit_inr,
        discount_percent=discount_percent,
        original_total_paise=original_total_paise,
        original_total_inr=orig_inr,
        discount_amount_paise=discount_paise,
        discount_amount_inr=disc_inr,
        final_monthly_paise=final_monthly_paise,
        final_monthly_inr=final_inr,
        effective_per_seat_paise=effective_per_seat_paise,
        effective_per_seat_inr=per_seat_inr,
        formula_explanation=(
            f"{seats} seats × ₹{unit_inr} = ₹{orig_inr} original monthly total. "
            f"{discount_percent}% discount = ₹{disc_inr}. "
            f"Final monthly total = ₹{final_inr} (₹{per_seat_inr}/seat)."
        ),
    )


class BillingAndEntitlementStore:
    def __init__(self) -> None:
        self.reset_state()

    def reset_state(self) -> None:
        now_iso = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
        self.current_pricing = {
            "individual_price_paise": int(os.getenv("DEFAULT_INDIVIDUAL_PRICE_PAISE", "1900")),
            "org_discount_percent": int(os.getenv("DEFAULT_ORG_DISCOUNT_PERCENT", "25")),
            "free_successful_analyses_limit": int(
                os.getenv("FREE_SUCCESSFUL_ANALYSES_LIMIT", "2")
            ),
            "effective_from": now_iso,
            "changed_by_admin": "system_seed",
            "change_note": "Initial introductory pricing ₹19/month with 25% organization seat discount.",
        }
        self.pricing_history: List[Dict[str, Any]] = [dict(self.current_pricing)]
        self.users: Dict[str, Dict[str, Any]] = {}
        self.organizations: Dict[str, Dict[str, Any]] = {}
        self.orders: Dict[str, Dict[str, Any]] = {}
        self.processed_webhook_events: set[str] = set()
        self.audit_logs: List[AuditLogEntryOut] = []

    def _log_audit(
        self, actor_user_id: str, action: str, detail: str, org_id: Optional[str] = None
    ) -> None:
        entry = AuditLogEntryOut(
            id=f"audit-{uuid.uuid4().hex[:10]}",
            actor_user_id=actor_user_id,
            org_id=org_id,
            action=action,
            detail=detail,
            created_at=datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        )
        self.audit_logs.insert(0, entry)

    def ensure_user(self, user_id: str, email: Optional[str] = None) -> Dict[str, Any]:
        if not user_id or not user_id.strip():
            raise HTTPException(
                status_code=401,
                detail="Authentication required: Missing X-User-ID header.",
            )
        uid = user_id.strip()
        if uid not in self.users:
            self.users[uid] = {
                "user_id": uid,
                "email": (email or f"{uid}@policypilot.local").lower().strip(),
                "full_name": f"Citizen {uid[:12]}",
                "free_analyses_limit": self.current_pricing["free_successful_analyses_limit"],
                "successful_analyses_used": 0,
                "completed_analysis_keys": set(),
                "subscription_status": SubscriptionStatus.NONE,
                "locked_subscription_price_paise": None,
                "pending_price_change_paise": None,
                "price_change_consent_granted": False,
                "current_period_end": None,
                "invoices": [],
            }
        elif email:
            self.users[uid]["email"] = email.lower().strip()
        return self.users[uid]

    def get_pricing_snapshot(self) -> PricingSnapshotOut:
        p = self.current_pricing
        return PricingSnapshotOut(
            individual_price_paise=p["individual_price_paise"],
            individual_price_inr=paise_to_inr(p["individual_price_paise"]),
            org_discount_percent=p["org_discount_percent"],
            free_successful_analyses_limit=p["free_successful_analyses_limit"],
            effective_from=p["effective_from"],
            changed_by_admin=p["changed_by_admin"],
            change_note=p.get("change_note"),
        )

    def admin_update_pricing(
        self, admin_key_header: Optional[str], payload: AdminPriceUpdateRequest
    ) -> PricingSnapshotOut:
        expected_key = os.getenv("ADMIN_API_KEY", "policypilot-admin-dev-key").strip()
        if not admin_key_header or admin_key_header.strip() != expected_key:
            raise HTTPException(
                status_code=403,
                detail="Forbidden: Valid X-Admin-Key is required to modify subscription pricing.",
            )
        new_paise = inr_to_paise(payload.new_individual_price_inr)
        eff_date = payload.effective_from or (
            datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
        )
        self.current_pricing = {
            "individual_price_paise": new_paise,
            "org_discount_percent": payload.org_discount_percent,
            "free_successful_analyses_limit": self.current_pricing[
                "free_successful_analyses_limit"
            ],
            "effective_from": eff_date,
            "changed_by_admin": "authorized_admin",
            "change_note": payload.change_note,
        }
        self.pricing_history.append(dict(self.current_pricing))

        # Notify existing active subscribers without silently increasing their locked price
        for u in self.users.values():
            if (
                u["subscription_status"] == SubscriptionStatus.ACTIVE
                and u["locked_subscription_price_paise"] is not None
                and u["locked_subscription_price_paise"] != new_paise
            ):
                u["pending_price_change_paise"] = new_paise
                u["price_change_consent_granted"] = False

        self._log_audit(
            "authorized_admin",
            "ADMIN_PRICE_UPDATE",
            f"Updated individual price to ₹{paise_to_inr(new_paise)} ({new_paise} paise), discount={payload.org_discount_percent}%, effective={eff_date}",
        )
        return self.get_pricing_snapshot()

    def _find_active_org_for_user(self, user: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        uid = user["user_id"]
        u_email = user["email"].lower()
        for org in self.organizations.values():
            if org["subscription_status"] != SubscriptionStatus.ACTIVE:
                continue
            for seat in org["seats"].values():
                if seat["status"] == SeatStatus.ASSIGNED and (
                    seat["member_user_id"] == uid or seat["member_email"].lower() == u_email
                ):
                    return org
        return None

    def get_user_summary(self, user_id: str, email: Optional[str] = None) -> UserAccountSummaryOut:
        u = self.ensure_user(user_id, email=email)
        active_org = self._find_active_org_for_user(u)
        has_ind_sub = u["subscription_status"] == SubscriptionStatus.ACTIVE
        has_unlimited = has_ind_sub or (active_org is not None)

        used = u["successful_analyses_used"]
        limit = u["free_analyses_limit"]
        remaining = max(0, limit - used)
        requires_sub = (remaining == 0) and (not has_unlimited)

        locked_inr = (
            paise_to_inr(u["locked_subscription_price_paise"])
            if u["locked_subscription_price_paise"] is not None
            else None
        )
        pending_inr = (
            paise_to_inr(u["pending_price_change_paise"])
            if u["pending_price_change_paise"] is not None
            else None
        )
        notice = None
        if pending_inr is not None and locked_inr is not None:
            notice = (
                f"Advance Price Notice: New subscriber pricing is now ₹{pending_inr}/month. "
                f"Your existing subscription remains locked at ₹{locked_inr}/month unless you "
                "explicitly consent to the updated renewal rate."
            )

        return UserAccountSummaryOut(
            user_id=u["user_id"],
            email=u["email"],
            full_name=u["full_name"],
            free_analyses_limit=limit,
            successful_analyses_used=used,
            free_analyses_remaining=remaining,
            requires_subscription_for_next_analysis=requires_sub,
            individual_subscription_status=u["subscription_status"],
            locked_subscription_price_inr=locked_inr,
            pending_price_change_inr=pending_inr,
            pending_price_notice=notice,
            price_change_consent_granted=u["price_change_consent_granted"],
            current_period_end=u["current_period_end"],
            active_org_seat_org_id=active_org["org_id"] if active_org else None,
            active_org_name=active_org["name"] if active_org else None,
            has_unlimited_analysis_entitlement=has_unlimited,
            invoices=list(u["invoices"]),
        )

    def assert_can_run_billable_analysis(self, user_id: str, idempotency_key: str) -> None:
        """Server-side gate before running a billable policy analysis."""
        u = self.ensure_user(user_id)
        # If this exact idempotency_key already succeeded, allow replay without blocking
        if idempotency_key in u["completed_analysis_keys"]:
            return

        summary = self.get_user_summary(user_id)
        if summary.requires_subscription_for_next_analysis:
            curr_price = paise_to_inr(self.current_pricing["individual_price_paise"])
            raise HTTPException(
                status_code=402,
                detail={
                    "error": "SubscriptionRequired",
                    "message": (
                        f"You have consumed all {summary.free_analyses_limit} free successful "
                        f"analyses. Subscribe to the Individual Plan (₹{curr_price}/month) or "
                        "join an Organization seat to run unlimited analyses."
                    ),
                    "free_analyses_used": summary.successful_analyses_used,
                    "free_analyses_limit": summary.free_analyses_limit,
                    "current_individual_price_inr": str(curr_price),
                    "upgrade_url": "/pricing",
                },
            )

    def record_successful_analysis(self, user_id: str, idempotency_key: str) -> UserAccountSummaryOut:
        """Increments analysis counter ONLY after the operation completes with SUCCESS."""
        u = self.ensure_user(user_id)
        if idempotency_key not in u["completed_analysis_keys"]:
            u["completed_analysis_keys"].add(idempotency_key)
            u["successful_analyses_used"] += 1
            self._log_audit(
                user_id,
                "ANALYSIS_CONSUMED",
                f"Recorded successful analysis (used={u['successful_analyses_used']}/{u['free_analyses_limit']}, key={idempotency_key[:16]})",
            )
        return self.get_user_summary(user_id)

    # ------------------------------------------------------------------
    # Checkout & Razorpay HMAC Verification (Part F)
    # ------------------------------------------------------------------
    def _get_webhook_or_key_secret(self, is_webhook: bool = False) -> str:
        env_var = "RAZORPAY_WEBHOOK_SECRET" if is_webhook else "RAZORPAY_KEY_SECRET"
        raw = os.getenv(env_var, "").strip()
        if not raw or "placeholder" in raw.lower():
            return "policypilot_sandbox_hmac_secret_2026"
        return raw

    def compute_checkout_signature(self, order_id: str, payment_id: str) -> str:
        secret = self._get_webhook_or_key_secret(is_webhook=False)
        msg = f"{order_id}|{payment_id}".encode("utf-8")
        return hmac.new(secret.encode("utf-8"), msg, hashlib.sha256).hexdigest()

    def compute_webhook_signature(self, raw_body: bytes) -> str:
        secret = self._get_webhook_or_key_secret(is_webhook=True)
        return hmac.new(secret.encode("utf-8"), raw_body, hashlib.sha256).hexdigest()

    def create_checkout_order(
        self,
        user_id: str,
        plan_type: PlanType,
        seats: int = 1,
        org_id: Optional[str] = None,
    ) -> CheckoutOrderOut:
        self.ensure_user(user_id)
        unit_paise = self.current_pricing["individual_price_paise"]
        disc_pct = self.current_pricing["org_discount_percent"]

        if plan_type == PlanType.INDIVIDUAL:
            seats = 1
            orig_paise = unit_paise
            disc_paise = 0
            final_paise = unit_paise
        else:
            if not org_id or org_id not in self.organizations:
                raise HTTPException(
                    status_code=400,
                    detail="Valid org_id is required for Organization Plan checkout.",
                )
            org = self.organizations[org_id]
            if org["admin_user_id"] != user_id:
                raise HTTPException(
                    status_code=403,
                    detail="Forbidden: Only the Organization Administrator can purchase seats.",
                )
            quote = calculate_organization_seat_quote(seats, unit_paise, disc_pct)
            orig_paise = quote.original_total_paise
            disc_paise = quote.discount_amount_paise
            final_paise = quote.final_monthly_paise

        order_id = f"order_{uuid.uuid4().hex[:14]}"
        now_iso = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
        self.orders[order_id] = {
            "order_id": order_id,
            "user_id": user_id,
            "org_id": org_id,
            "plan_type": plan_type,
            "seats": seats,
            "unit_price_paise": unit_paise,
            "discount_percent": disc_pct,
            "original_total_paise": orig_paise,
            "discount_paise": disc_paise,
            "final_amount_paise": final_paise,
            "status": "CREATED",
            "provider_payment_id": None,
            "created_at": now_iso,
        }

        rzp_key = os.getenv("RAZORPAY_KEY_ID", "rzp_test_sandbox_placeholder").strip()
        is_sandbox = "placeholder" in rzp_key or rzp_key.startswith("rzp_test")

        return CheckoutOrderOut(
            order_id=order_id,
            razorpay_key_id=rzp_key,
            plan_type=plan_type,
            seats=seats,
            unit_price_paise=unit_paise,
            original_total_paise=orig_paise,
            discount_paise=disc_paise,
            final_amount_paise=final_paise,
            final_amount_inr=paise_to_inr(final_paise),
            status="CREATED",
            sandbox_mode=is_sandbox,
            checkout_disclosure=(
                f"You will be charged ₹{paise_to_inr(final_paise)}/month. Subscription activates "
                "ONLY after cryptographic HMAC-SHA256 payment signature verification."
            ),
        )

    def verify_and_activate_order(
        self,
        user_id: str,
        order_id: str,
        payment_id: str,
        signature: str,
    ) -> Dict[str, Any]:
        if order_id not in self.orders:
            raise HTTPException(status_code=404, detail="Order not found.")
        order = self.orders[order_id]
        if order["user_id"] != user_id:
            raise HTTPException(
                status_code=403,
                detail="Forbidden: Cannot verify a payment order belonging to another user.",
            )

        expected_sig = self.compute_checkout_signature(order_id, payment_id)
        if not hmac.compare_digest(expected_sig, signature.strip()):
            order["status"] = "FAILED"
            self._log_audit(
                user_id,
                "PAYMENT_SIGNATURE_INVALID",
                f"Rejected invalid signature for order {order_id}",
                org_id=order.get("org_id"),
            )
            raise HTTPException(
                status_code=400,
                detail="Payment verification failed: Invalid cryptographic HMAC-SHA256 signature.",
            )

        return self._activate_paid_order(order, payment_id)

    def _activate_paid_order(self, order: Dict[str, Any], payment_id: str) -> Dict[str, Any]:
        if order["status"] == "PAID":
            return order  # Idempotent no-op if already activated

        order["status"] = "PAID"
        order["provider_payment_id"] = payment_id
        now = datetime.now(timezone.utc)
        period_end = (now + timedelta(days=30)).isoformat().replace("+00:00", "Z")
        uid = order["user_id"]
        user = self.ensure_user(uid)

        invoice_record = {
            "invoice_id": f"INV-{order['order_id'][-8:].upper()}",
            "order_id": order["order_id"],
            "payment_id": payment_id,
            "plan_type": order["plan_type"].value
            if isinstance(order["plan_type"], PlanType)
            else order["plan_type"],
            "seats": order["seats"],
            "amount_inr": str(paise_to_inr(order["final_amount_paise"])),
            "status": "PAID",
            "paid_at": now.isoformat().replace("+00:00", "Z"),
        }

        if order["plan_type"] == PlanType.INDIVIDUAL:
            user["subscription_status"] = SubscriptionStatus.ACTIVE
            user["locked_subscription_price_paise"] = order["unit_price_paise"]
            user["current_period_end"] = period_end
            user["invoices"].insert(0, invoice_record)
            self._log_audit(
                uid,
                "INDIVIDUAL_SUBSCRIPTION_ACTIVATED",
                f"Activated Individual Plan at locked rate ₹{paise_to_inr(order['unit_price_paise'])}/mo (order={order['order_id']})",
            )
        else:
            org_id = order["org_id"]
            org = self.organizations[org_id]
            org["purchased_seats"] = order["seats"]
            org["subscription_status"] = SubscriptionStatus.ACTIVE
            org["locked_unit_price_paise"] = order["unit_price_paise"]
            org["locked_discount_percent"] = order["discount_percent"]
            org["current_period_end"] = period_end
            org["invoices"].insert(0, invoice_record)
            self._log_audit(
                uid,
                "ORG_SUBSCRIPTION_ACTIVATED",
                f"Activated Organization Plan for {order['seats']} seats (₹{paise_to_inr(order['final_amount_paise'])}/mo)",
                org_id=org_id,
            )

        return order

    def process_webhook(
        self,
        raw_body: bytes,
        signature_header: Optional[str],
        payload: Dict[str, Any],
    ) -> Dict[str, Any]:
        if not signature_header:
            raise HTTPException(status_code=401, detail="Missing X-Razorpay-Signature header.")
        expected = self.compute_webhook_signature(raw_body)
        if not hmac.compare_digest(expected, signature_header.strip()):
            raise HTTPException(status_code=400, detail="Invalid webhook HMAC signature.")

        event_id = str(payload.get("event_id") or "").strip()
        if not event_id:
            raise HTTPException(status_code=400, detail="Missing webhook event_id.")
        if event_id in self.processed_webhook_events:
            return {"status": "IGNORED_DUPLICATE", "event_id": event_id}

        self.processed_webhook_events.add(event_id)
        event_type = payload.get("event", "")
        order_id = payload.get("order_id", "")
        payment_id = payload.get("payment_id", f"pay_wh_{event_id[:8]}")

        if order_id in self.orders:
            order = self.orders[order_id]
            if event_type in ("payment.captured", "subscription.charged"):
                self._activate_paid_order(order, payment_id)
            elif event_type == "payment.failed":
                order["status"] = "FAILED"
            elif event_type == "refund.processed":
                order["status"] = "REFUNDED"
                if order["plan_type"] == PlanType.INDIVIDUAL:
                    u = self.ensure_user(order["user_id"])
                    u["subscription_status"] = SubscriptionStatus.CANCELLED
                elif order.get("org_id") in self.organizations:
                    self.organizations[order["org_id"]]["subscription_status"] = (
                        SubscriptionStatus.CANCELLED
                    )

        return {"status": "PROCESSED", "event_id": event_id, "event": event_type}

    # ------------------------------------------------------------------
    # Organization Creation, Seat Limits & RBAC Isolation (Part E3)
    # ------------------------------------------------------------------
    def create_organization(
        self, admin_user_id: str, name: str, initial_seats: int
    ) -> OrganizationDashboardOut:
        self.ensure_user(admin_user_id)
        org_id = f"org-{uuid.uuid4().hex[:10]}"
        self.organizations[org_id] = {
            "org_id": org_id,
            "name": name.strip(),
            "admin_user_id": admin_user_id,
            "subscription_status": SubscriptionStatus.NONE,
            "purchased_seats": initial_seats,
            "locked_unit_price_paise": self.current_pricing["individual_price_paise"],
            "locked_discount_percent": self.current_pricing["org_discount_percent"],
            "current_period_end": None,
            "seats": {},
            "invoices": [],
        }
        self._log_audit(
            admin_user_id,
            "ORGANIZATION_CREATED",
            f"Created organization '{name.strip()}' with target capacity of {initial_seats} seats.",
            org_id=org_id,
        )
        return self.get_organization_dashboard(org_id, requesting_user_id=admin_user_id)

    def _assert_org_admin(self, org_id: str, requesting_user_id: str) -> Dict[str, Any]:
        if org_id not in self.organizations:
            raise HTTPException(status_code=404, detail="Organization not found.")
        org = self.organizations[org_id]
        if org["admin_user_id"] != requesting_user_id:
            raise HTTPException(
                status_code=403,
                detail="Forbidden: Cross-organization access or non-admin privilege escalation denied.",
            )
        return org

    def invite_or_assign_seat(
        self,
        org_id: str,
        requesting_user_id: str,
        member_email: str,
        member_user_id: Optional[str],
        assign_immediately: bool = True,
    ) -> OrganizationDashboardOut:
        org = self._assert_org_admin(org_id, requesting_user_id)
        clean_email = member_email.lower().strip()

        active_seats = [
            s
            for s in org["seats"].values()
            if s["status"] in (SeatStatus.INVITED, SeatStatus.ASSIGNED)
        ]
        # Check if already has an active seat
        existing = next(
            (s for s in active_seats if s["member_email"].lower() == clean_email), None
        )
        if not existing and len(active_seats) >= org["purchased_seats"]:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Seat limit reached: All {org['purchased_seats']} purchased seats are "
                    "currently invited or assigned. Purchase additional seats or revoke an existing seat first."
                ),
            )

        now_iso = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
        seat_id = existing["seat_id"] if existing else f"seat-{uuid.uuid4().hex[:8]}"
        new_status = SeatStatus.ASSIGNED if assign_immediately else SeatStatus.INVITED

        org["seats"][seat_id] = {
            "seat_id": seat_id,
            "org_id": org_id,
            "member_email": clean_email,
            "member_user_id": member_user_id,
            "status": new_status,
            "assigned_at": now_iso,
            "revoked_at": None,
        }
        self._log_audit(
            requesting_user_id,
            f"SEAT_{new_status.value}",
            f"{new_status.value} seat for {clean_email} (user_id={member_user_id})",
            org_id=org_id,
        )
        return self.get_organization_dashboard(org_id, requesting_user_id)

    def revoke_seat(
        self, org_id: str, requesting_user_id: str, seat_id: str
    ) -> OrganizationDashboardOut:
        org = self._assert_org_admin(org_id, requesting_user_id)
        if seat_id not in org["seats"]:
            raise HTTPException(status_code=404, detail="Seat record not found in this organization.")
        seat = org["seats"][seat_id]
        seat["status"] = SeatStatus.REVOKED
        seat["revoked_at"] = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
        self._log_audit(
            requesting_user_id,
            "SEAT_REVOKED",
            f"Revoked seat {seat_id} ({seat['member_email']})",
            org_id=org_id,
        )
        return self.get_organization_dashboard(org_id, requesting_user_id)

    def get_organization_dashboard(
        self, org_id: str, requesting_user_id: str
    ) -> OrganizationDashboardOut:
        org = self._assert_org_admin(org_id, requesting_user_id)
        active_count = sum(
            1
            for s in org["seats"].values()
            if s["status"] in (SeatStatus.INVITED, SeatStatus.ASSIGNED)
        )
        purchased = org["purchased_seats"]
        available = max(0, purchased - active_count)

        quote = calculate_organization_seat_quote(
            seats=max(1, purchased),
            unit_price_paise=org["locked_unit_price_paise"],
            discount_percent=org["locked_discount_percent"],
        )
        org_logs = [log for log in self.audit_logs if log.org_id == org_id]

        return OrganizationDashboardOut(
            org_id=org["org_id"],
            name=org["name"],
            admin_user_id=org["admin_user_id"],
            subscription_status=org["subscription_status"],
            purchased_seats=purchased,
            assigned_or_invited_seats=active_count,
            available_seats=available,
            locked_unit_price_inr=paise_to_inr(org["locked_unit_price_paise"]),
            locked_discount_percent=org["locked_discount_percent"],
            current_quote=quote,
            current_period_end=org["current_period_end"],
            seats_roster=[OrganizationSeatOut(**s) for s in org["seats"].values()],
            invoices=list(org["invoices"]),
            audit_logs=org_logs,
        )


_billing_store = BillingAndEntitlementStore()


def get_billing_store() -> BillingAndEntitlementStore:
    return _billing_store
