from datetime import date, datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from .common import SchemeLevel


class SchemeCriterionBase(BaseModel):
    criterion_key: str = Field(
        description="Attribute key evaluated in profile (e.g. annual_income_inr, state)"
    )
    operator: str = Field(
        description="Deterministic operator: <=, >=, ==, !=, IN, NOT_IN, RANGE, CONTAINS"
    )
    value: Dict[str, Any] = Field(
        description="Target threshold or allowed values, e.g. {'v': 800000} or {'v': ['farmer']}"
    )
    required: bool = Field(
        default=True, description="Whether this criterion is mandatory for scheme eligibility"
    )
    source_ref: Optional[str] = Field(
        default=None, description="Official clause/section reference citation"
    )
    description: Optional[str] = Field(
        default=None, description="Human-readable explanation of the rule"
    )
    pathway: Optional[str] = Field(
        default=None,
        description="Optional eligibility pathway name for multi-route schemes (e.g. 'senior_70_plus' vs 'vulnerable_household')",
    )
    version: int = Field(default=1)
    effective_from: Optional[date] = None


class SchemeCriterionOut(SchemeCriterionBase):
    id: UUID
    scheme_id: UUID
    source_id: Optional[UUID] = None

    model_config = ConfigDict(from_attributes=True)


class SchemeDocumentBase(BaseModel):
    kind: str = Field(
        description="Document category: identity, income, land_record, educational, caste"
    )
    name: str = Field(description="Official name of the required document")
    required: bool = Field(default=True)
    deadline: Optional[date] = None
    route: Optional[str] = None
    apply_url: Optional[str] = None


class SchemeDocumentOut(SchemeDocumentBase):
    id: UUID
    scheme_id: UUID
    source_id: Optional[UUID] = None

    model_config = ConfigDict(from_attributes=True)


class SchemeBase(BaseModel):
    slug: str = Field(description="Unique human-readable scheme slug")
    name: str = Field(description="Official full title of the scheme")
    category: str = Field(
        description="Domain category: agriculture, healthcare, housing, education, enterprise"
    )
    level: SchemeLevel = Field(default=SchemeLevel.CENTRAL)
    state: Optional[str] = Field(
        default=None, description="State code if state-level scheme, or null if Central"
    )
    department: Optional[str] = Field(default=None, description="Nodal Ministry or Department")
    description: str = Field(description="Official description of benefits and scope")
    active: bool = Field(default=True)


class SchemeCreate(SchemeBase):
    criteria: List[SchemeCriterionBase] = Field(default_factory=list)
    documents: List[SchemeDocumentBase] = Field(default_factory=list)


class SchemeOut(SchemeBase):
    id: UUID
    criteria: List[SchemeCriterionOut] = Field(default_factory=list)
    documents: List[SchemeDocumentOut] = Field(default_factory=list)
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
