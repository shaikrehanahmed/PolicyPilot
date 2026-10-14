from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

from .common import EligibilityStatus


class UserApplicationStatus(str, Enum):
    """Personal application status manually confirmed by the user (C2)."""

    NOT_APPLIED = "NOT_APPLIED"
    BOOKMARKED = "BOOKMARKED"
    PREPARING_DOCUMENTS = "PREPARING_DOCUMENTS"
    APPLIED = "APPLIED"
    MARKED_DEFECTIVE = "MARKED_DEFECTIVE"
    BENEFIT_RECEIVED = "BENEFIT_RECEIVED"


class OfficialLifecycleStatus(str, Enum):
    """Explicit official scheme lifecycle statuses required by Part C3."""

    ACTIVE = "Active"
    DEADLINE_EXTENDED = "Deadline Extended"
    APPLICATION_CLOSED = "Application Closed"
    RESULTS_ANNOUNCED = "Results Announced"
    STATUS_UNVERIFIED = "Status Unverified"


class NotificationPreferences(BaseModel):
    scheme_updates_enabled: bool = True
    deadline_warnings_enabled: bool = True
    results_announcements_enabled: bool = True
    defect_recovery_tips_enabled: bool = True
    in_app_channel_enabled: bool = True
    email_channel_requested: bool = False
    preferred_lang: str = "en"


class ResultsGuidanceOut(BaseModel):
    """Structured results guidance required by Part C5."""

    has_published_results: bool = False
    announcement_date: Optional[str] = None
    how_to_check: str
    official_results_portal_url: Optional[str] = None
    official_next_steps: List[str] = Field(default_factory=list)
    distinction_disclaimer: str = Field(
        default=(
            "A published scheme results announcement indicates that official beneficiary lists or "
            "verification batches have been released on the portal—it does NOT confirm individual "
            "application approval until verified with your acknowledgement ID."
        )
    )


class EvidenceMetadataOut(BaseModel):
    evidence_quote: Optional[str] = None
    source_title: Optional[str] = None
    source_url: Optional[str] = None
    last_verified_at: Optional[str] = None
    last_attempted_check_at: Optional[str] = None
    is_evidence_sufficient: bool = False


class TrackedSchemeRecordOut(BaseModel):
    scheme_id: str
    scheme_slug: str
    scheme_name: str
    category: str
    level: str
    official_application_url: Optional[str] = None
    user_confirmed_status: UserApplicationStatus = UserApplicationStatus.NOT_APPLIED
    applied_at: Optional[str] = None
    user_status_updated_at: Optional[str] = None
    external_submission_disclaimer: str = Field(
        default=(
            "PolicyPilot records your self-reported 'Applied' status for personal tracking only and "
            "cannot independently verify submission or approval on external government portals."
        )
    )
    official_lifecycle_status: OfficialLifecycleStatus = OfficialLifecycleStatus.STATUS_UNVERIFIED
    evidence: EvidenceMetadataOut
    results_guidance: ResultsGuidanceOut
    last_visited_at: Optional[str] = None
    visit_count: int = 0


class PersonalizedNotificationOut(BaseModel):
    notification_id: str
    dedup_hash: str
    scheme_slug: str
    scheme_name: str
    event_type: str = Field(
        description="NEW_ANNOUNCEMENT | DEADLINE_EXTENDED | PORTAL_CLOSED | RESULTS_ANNOUNCED | MATERIAL_CORRECTION"
    )
    title: str
    message: str
    official_lifecycle_status: OfficialLifecycleStatus
    user_confirmed_status: UserApplicationStatus
    source_url: Optional[str] = None
    evidence_quote: Optional[str] = None
    last_verified_at: Optional[str] = None
    delivery_channel: str = "IN_APP"
    created_at: str
    read: bool = False


class RecordVisitRequest(BaseModel):
    scheme_slug: str = Field(..., min_length=1, max_length=120)


class UpdateUserSchemeStatusRequest(BaseModel):
    scheme_slug: str = Field(..., min_length=1, max_length=120)
    user_confirmed_status: UserApplicationStatus
    notes: Optional[str] = Field(default=None, max_length=400)


class TrackingCenterResponse(BaseModel):
    user_id: str
    persistence_mode: str
    account_persistence_verified: bool = False
    external_monitoring_active: bool = False
    email_provider_configured: bool = False
    last_successful_verification_at: str
    last_attempted_check_at: str
    persistence_disclosure: str
    preferences: NotificationPreferences
    recently_visited: List[TrackedSchemeRecordOut] = Field(default_factory=list)
    my_applications: List[TrackedSchemeRecordOut] = Field(default_factory=list)
    tracked_schemes: List[TrackedSchemeRecordOut] = Field(default_factory=list)
    notifications: List[PersonalizedNotificationOut] = Field(default_factory=list)
    duplicates_suppressed: int = 0


class RankedSchemeDiscoveryItem(BaseModel):
    scheme: Dict[str, Any]
    discovery_bucket: str = Field(
        description="MATCHED_TO_PROFILE | INSUFFICIENT_INFORMATION | NOT_MATCHED"
    )
    eligibility_status: EligibilityStatus
    completeness: str
    met_count: int
    not_met_count: int
    unknown_count: int
    missing_profile_fields: List[str] = Field(default_factory=list)
    why_this_result: str
    results_guidance: str
    official_lifecycle_status: OfficialLifecycleStatus
    last_verified_at: Optional[str] = None
    source_url: Optional[str] = None
