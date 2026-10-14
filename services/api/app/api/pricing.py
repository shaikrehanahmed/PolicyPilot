"""Pricing & Organization Seat Calculator API for PolicyPilot.

Enforces Requirements:
1. Clear Individual and Organization plans.
2. The ₹19 introductory monthly individual price.
3. Two free successful analyses for all new users.
4. Interactive organization seat calculator applying exact 25% discount.
5. Honest disclosure: Payment gateway is in sandbox demonstration mode.
"""
from typing import List

from fastapi import APIRouter

from ..schemas.pricing import (
    OrganizationCalculatorRequest,
    OrganizationCalculatorResponse,
    PlanFeature,
    PlanSummary,
    PricingCatalogResponse,
)

router = APIRouter(prefix="/pricing", tags=["Pricing & Subscription Plans"])

BASE_SEAT_PRICE = 99.0
ORG_DISCOUNT_PCT = 25.0
INDIVIDUAL_INTRO_PRICE = 19.0
FREE_ANALYSES_COUNT = 2

PLANS: List[PlanSummary] = [
    PlanSummary(
        id="free",
        name="Citizen Free Tier",
        tagline="Essential scheme discovery and deterministic criteria evaluation for every citizen.",
        monthly_price_inr=0.0,
        free_analyses=FREE_ANALYSES_COUNT,
        features=[
            PlanFeature(title="2 Free detailed policy evaluations", included=True, highlight=True),
            PlanFeature(title="Browse all active Central & State schemes", included=True),
            PlanFeature(title="Standard Gazette evidence excerpts", included=True),
            PlanFeature(title="Multi-language UI (English, Telugu, Hindi, Urdu)", included=True),
            PlanFeature(title="Printable action checklists", included=True),
            PlanFeature(title="Unlimited AI synthesis", included=False),
            PlanFeature(title="Multi-seat team dashboard", included=False),
        ],
        badge="Zero Cost",
        popular=False,
    ),
    PlanSummary(
        id="individual",
        name="Citizen Pro",
        tagline="Comprehensive policy navigation for individual applicants and families.",
        monthly_price_inr=49.0,
        introductory_price_inr=INDIVIDUAL_INTRO_PRICE,
        free_analyses=FREE_ANALYSES_COUNT,
        features=[
            PlanFeature(title="Unlimited deterministic scheme evaluations", included=True, highlight=True),
            PlanFeature(title="₹19 Introductory First Month Price", included=True, highlight=True),
            PlanFeature(title="Unlimited Scholarship & Benefit Rescue Mode diagnosis", included=True),
            PlanFeature(title="Grounded AI policy explanations with official citations", included=True),
            PlanFeature(title="Multi-turn voice assistant in your preferred language", included=True),
            PlanFeature(title="Verified government scheme update notifications", included=True),
            PlanFeature(title="Priority ticket drafting for college INO desks", included=True),
        ],
        badge="Most Popular",
        popular=True,
    ),
    PlanSummary(
        id="organization",
        name="Welfare Organization & MeeSeva",
        tagline="For CSC centres, MeeSeva kiosks, educational institutions, and NGO field officers.",
        monthly_price_inr=BASE_SEAT_PRICE,
        introductory_price_inr=None,
        free_analyses=FREE_ANALYSES_COUNT,
        features=[
            PlanFeature(title="Interactive bulk seat pricing with exact 25% discount", included=True, highlight=True),
            PlanFeature(title="Centralized operator and field-officer seat management", included=True),
            PlanFeature(title="Batch citizen profile evaluation and batch PDF export", included=True),
            PlanFeature(title="Official INO defect resolution templates with ministry tracking", included=True),
            PlanFeature(title="Audit logs and verification history per applicant", included=True),
            PlanFeature(title="Dedicated onboarding and WhatsApp/desk support", included=True),
        ],
        badge="25% Bulk Discount",
        popular=False,
    ),
]


@router.get("/catalog", response_model=PricingCatalogResponse)
async def get_pricing_catalog() -> PricingCatalogResponse:
    """Returns the available subscription tiers, introductory prices, and honest gateway status."""
    return PricingCatalogResponse(
        plans=PLANS,
        individual_intro_price_inr=INDIVIDUAL_INTRO_PRICE,
        free_analyses_new_user=FREE_ANALYSES_COUNT,
        org_base_seat_price_inr=BASE_SEAT_PRICE,
        org_bulk_discount_percentage=ORG_DISCOUNT_PCT,
        payment_gateway_status="sandbox_demonstration",
        honesty_note=(
            "HONESTY DISCLOSURE: Payment processing is currently running in sandbox demonstration mode. "
            "No real credit card or UPI charges are processed at this stage."
        ),
    )


@router.post("/calculate-organization", response_model=OrganizationCalculatorResponse)
async def calculate_organization_pricing(
    payload: OrganizationCalculatorRequest,
) -> OrganizationCalculatorResponse:
    """Calculates organization pricing applying the exact 25% bulk discount."""
    seats = max(1, min(payload.seats, 1000))
    gross_total = round(seats * BASE_SEAT_PRICE, 2)
    discount_amount = round(gross_total * (ORG_DISCOUNT_PCT / 100.0), 2)
    net_total = round(gross_total - discount_amount, 2)
    effective_per_seat = round(net_total / seats, 2)

    return OrganizationCalculatorResponse(
        seats=seats,
        billing_cycle=payload.billing_cycle,
        base_price_per_seat_inr=BASE_SEAT_PRICE,
        discount_percentage=ORG_DISCOUNT_PCT,
        gross_total_inr=gross_total,
        discount_amount_inr=discount_amount,
        net_total_inr=net_total,
        effective_per_seat_price_inr=effective_per_seat,
        free_analyses_per_seat=FREE_ANALYSES_COUNT,
        payment_gateway_status="sandbox_demonstration",
        honesty_note=(
            "HONESTY DISCLOSURE: Organization plan calculator applies exact 25% bulk discount. "
            "Payment gateway is in demonstration sandbox mode."
        ),
    )
