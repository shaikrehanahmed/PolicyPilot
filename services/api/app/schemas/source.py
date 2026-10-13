from datetime import datetime
from typing import Optional, Union
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from .common import VerificationStatus


class SourceBase(BaseModel):
    url: str = Field(description="Canonical URL of the official government publication")
    title: str = Field(description="Official title of the gazette notification or guideline")
    publisher: str = Field(description="Issuing government body or ministry")
    source_tier: int = Field(
        default=1,
        ge=1,
        le=5,
        description="1=Gazette/Primary, 2=Dept Guideline, 3=State Notification, etc.",
    )
    department: Optional[str] = None
    state: Optional[str] = None
    doc_type: str = Field(
        default="guideline", description="gazette | guideline | circular | notification"
    )
    source_updated_at: Optional[datetime] = None
    last_verified_at: Optional[datetime] = None
    content_hash: Optional[str] = None
    verification_status: VerificationStatus = Field(default=VerificationStatus.VERIFIED)


class SourceOut(SourceBase):
    id: Union[UUID, str]
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class EvidenceChunkOut(BaseModel):
    chunk_id: Union[UUID, str]
    source_id: Union[UUID, str]
    source_title: str
    source_url: str
    source_tier: int
    quote: str
    page_ref: Optional[str] = None
    section_ref: Optional[str] = None
    last_verified_at: Optional[datetime] = None
    verification_status: VerificationStatus = VerificationStatus.VERIFIED
