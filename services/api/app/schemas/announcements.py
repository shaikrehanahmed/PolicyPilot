from typing import List, Optional

from pydantic import BaseModel, Field

from .common import SchemeLevel, VerificationStatus


class AnnouncementItemOut(BaseModel):
    id: str
    scheme_slug: Optional[str] = None
    official_scheme_name: str = Field(
        description="Official scheme name preserved in canonical form"
    )
    title: str
    summary: str
    benefits_summary: Optional[str] = Field(
        default=None, description="Populated ONLY when verification_status == VERIFIED"
    )
    eligibility_summary: Optional[str] = Field(
        default=None, description="Populated ONLY when verification_status == VERIFIED"
    )
    deadline_info: Optional[str] = Field(
        default=None, description="Official deadline or 'Rolling / Check Portal'"
    )
    level: SchemeLevel = SchemeLevel.CENTRAL
    state: Optional[str] = None
    department: str
    source_id: str
    source_title: str
    source_url: str
    application_url: Optional[str] = Field(
        default=None, description="Shown ONLY when verification_status == VERIFIED"
    )
    published_date: Optional[str] = None
    last_verified_at: str
    verification_status: VerificationStatus
    content_hash: str
    is_new_or_updated: bool = True
    review_note: Optional[str] = None


class SourceChangeCheckResult(BaseModel):
    checked_at: str
    monitoring_mode: str = Field(
        default="on_demand_hash_audit",
        description="Truthful disclosure: on_demand_hash_audit vs active_cron",
    )
    scheduler_active: bool = False
    external_requirements_note: str
    total_sources_checked: int
    verified_announcements_count: int
    awaiting_review_count: int
    duplicates_prevented: int
    detected_changes: List[str] = Field(default_factory=list)
    announcements: List[AnnouncementItemOut]
