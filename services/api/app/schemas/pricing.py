from typing import List, Optional

from pydantic import BaseModel, Field


class PlanFeature(BaseModel):
    title: str
    included: bool = True
    highlight: bool = False


class PlanSummary(BaseModel):
    id: str
    name: str
    tagline: str
    monthly_price_inr: float
    introductory_price_inr: Optional[float] = None
    free_analyses: int
    features: List[PlanFeature]
    badge: Optional[str] = None
    popular: bool = False


class OrganizationCalculatorRequest(BaseModel):
    seats: int = Field(default=10, ge=1, le=1000, description="Number of organization seats")
    billing_cycle: str = Field(default="monthly", description="'monthly' or 'annual'")


class OrganizationCalculatorResponse(BaseModel):
    seats: int
    billing_cycle: str
    base_price_per_seat_inr: float = 99.0
    discount_percentage: float = 25.0
    gross_total_inr: float
    discount_amount_inr: float
    net_total_inr: float
    effective_per_seat_price_inr: float
    free_analyses_per_seat: int = 2
    payment_gateway_status: str = "sandbox_demonstration"
    honesty_note: str = (
        "HONESTY DISCLOSURE: Payment processing is currently running in sandbox demonstration mode. "
        "No real bank card or UPI charges are collected at this stage."
    )


class PricingCatalogResponse(BaseModel):
    plans: List[PlanSummary]
    individual_intro_price_inr: float = 19.0
    free_analyses_new_user: int = 2
    org_base_seat_price_inr: float = 99.0
    org_bulk_discount_percentage: float = 25.0
    payment_gateway_status: str = "sandbox_demonstration"
    honesty_note: str
