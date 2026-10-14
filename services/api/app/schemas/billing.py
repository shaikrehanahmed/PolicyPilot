from decimal import Decimal
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class PlanType(str, Enum):
    INDIVIDUAL = "INDIVIDUAL"
    ORGANIZATION = "ORGANIZATION"


class SubscriptionStatus(str, Enum):
    NONE = "NONE"
    ACTIVE = "ACTIVE"
    CANCELLED = "CANCELLED"
    PAST_DUE = "PAST_DUE"


class SeatStatus(str, Enum):
    INVITED = "INVITED"
    ASSIGNED = "ASSIGNED"
    REVOKED = "REVOKED"


class PricingSnapshotOut(BaseModel):
    individual_price_paise: int = Field(description="Current price in integer paise (1900 = ₹19)")
    individual_price_inr: Decimal = Field(description="Current price in INR (e.g. 19.00)")
    org_discount_percent: int = Field(default=25, description="Bulk seat discount percentage")
    free_successful_analyses_limit: int = Field(default=2)
    effective_from: str
    changed_by_admin: str
    change_note: Optional[str] = None


class AdminPriceUpdateRequest(BaseModel):
    new_individual_price_inr: Decimal = Field(..., ge=Decimal("0.00"), le=Decimal("100000.00"))
    org_discount_percent: int = Field(default=25, ge=0, le=90)
    effective_from: Optional[str] = None
    change_note: str = Field(default="Updated via authorized Admin Pricing Setting", max_length=300)


class OrganizationQuoteRequest(BaseModel):
    seats: int = Field(..., ge=1, le=100000, description="Number of organization seats")


class OrganizationQuoteOut(BaseModel):
    seats: int
    unit_price_paise: int
    unit_price_inr: Decimal
    discount_percent: int
    original_total_paise: int
    original_total_inr: Decimal
    discount_amount_paise: int
    discount_amount_inr: Decimal
    final_monthly_paise: int
    final_monthly_inr: Decimal
    effective_per_seat_paise: int
    effective_per_seat_inr: Decimal
    formula_explanation: str


class UserAccountSummaryOut(BaseModel):
    user_id: str
    email: str
    full_name: str
    free_analyses_limit: int = 2
    successful_analyses_used: int = 0
    free_analyses_remaining: int = 2
    requires_subscription_for_next_analysis: bool = False
    individual_subscription_status: SubscriptionStatus = SubscriptionStatus.NONE
    locked_subscription_price_inr: Optional[Decimal] = None
    pending_price_change_inr: Optional[Decimal] = None
    pending_price_notice: Optional[str] = None
    price_change_consent_granted: bool = False
    current_period_end: Optional[str] = None
    active_org_seat_org_id: Optional[str] = None
    active_org_name: Optional[str] = None
    has_unlimited_analysis_entitlement: bool = False
    invoices: List[Dict[str, Any]] = Field(default_factory=list)
    persistence_mode: str = "ephemeral_server_memory"
    auth_mode: str = "client_header_prototype"
    auth_verified: bool = False
    persistence_disclosure: str = Field(
        default=(
            "Prototype Sandbox Mode: Session routing uses client-provided X-User-ID header in ephemeral "
            "server memory. Server-side identity verification (OAuth/OIDC/JWT) and persistent PostgreSQL "
            "storage are required before live subscription enforcement or legal billing."
        )
    )


class CreateCheckoutOrderRequest(BaseModel):
    plan_type: PlanType
    seats: int = Field(default=1, ge=1, le=100000)
    org_id: Optional[str] = None


class CheckoutOrderOut(BaseModel):
    order_id: str
    provider: str = "razorpay"
    razorpay_key_id: str
    plan_type: PlanType
    seats: int
    unit_price_paise: int
    original_total_paise: int
    discount_paise: int
    final_amount_paise: int
    final_amount_inr: Decimal
    currency: str = "INR"
    status: str = "CREATED"
    sandbox_mode: bool = True
    checkout_disclosure: str


class VerifyPaymentSignatureRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


class CreateOrganizationRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    initial_seats: int = Field(default=10, ge=1, le=100000)


class SeatMemberActionRequest(BaseModel):
    member_email: str = Field(..., min_length=3, max_length=255)
    member_user_id: Optional[str] = None


class OrganizationSeatOut(BaseModel):
    seat_id: str
    org_id: str
    member_email: str
    member_user_id: Optional[str] = None
    status: SeatStatus
    assigned_at: str
    revoked_at: Optional[str] = None


class AuditLogEntryOut(BaseModel):
    id: str
    actor_user_id: str
    org_id: Optional[str] = None
    action: str
    detail: str
    created_at: str


class OrganizationDashboardOut(BaseModel):
    org_id: str
    name: str
    admin_user_id: str
    subscription_status: SubscriptionStatus
    purchased_seats: int
    assigned_or_invited_seats: int
    available_seats: int
    locked_unit_price_inr: Decimal
    locked_discount_percent: int
    current_quote: OrganizationQuoteOut
    current_period_end: Optional[str] = None
    seats_roster: List[OrganizationSeatOut] = Field(default_factory=list)
    invoices: List[Dict[str, Any]] = Field(default_factory=list)
    audit_logs: List[AuditLogEntryOut] = Field(default_factory=list)
