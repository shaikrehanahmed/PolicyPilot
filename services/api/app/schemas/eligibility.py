from typing import Any, List, Optional

from pydantic import BaseModel, Field

from .common import CriterionResultState, EligibilityStatus, EvaluationCompleteness
from .source import EvidenceChunkOut, SourceOut


class CriterionEvaluationResult(BaseModel):
    """Evaluation result for an individual scheme criterion.
    The status MUST be explicitly 'met', 'not_met', or 'unknown'.
    """

    criterion_id: Optional[str] = None
    criterion_key: str = Field(description="Attribute name evaluated from profile")
    operator: str = Field(description="Operator used, e.g. <=, ==, IN")
    rule_target_value: Any = Field(
        description="Threshold or allowed values defined in official scheme rule"
    )
    user_provided_value: Any = Field(
        default=None, description="Citizen attribute value supplied in profile"
    )
    status: CriterionResultState = Field(
        description="Explicit result state: 'met', 'not_met', or 'unknown'"
    )
    reason: str = Field(
        description="Auditable explanation of why the criterion evaluated to this state"
    )
    source_ref: Optional[str] = Field(
        default=None, description="Official government clause or section citation"
    )
    required: bool = Field(
        default=True, description="Whether this criterion is mandatory for scheme eligibility"
    )
    pathway: Optional[str] = Field(
        default=None, description="Eligibility pathway name this criterion belongs to"
    )
    evidence: List[EvidenceChunkOut] = Field(
        default_factory=list, description="Retrieved official document chunks citing this rule"
    )


class EvaluationAssessment(BaseModel):
    """Aggregate assessment produced by the deterministic eligibility rule engine.
    Independent of LLM output or vector similarity scores.
    """

    scheme_id: str
    scheme_name: str
    overall_status: EligibilityStatus = Field(
        description="Aggregate eligibility outcome: ELIGIBLE, PARTIALLY_ELIGIBLE, NOT_ELIGIBLE, or UNDETERMINED"
    )
    completeness: EvaluationCompleteness = Field(
        description="COMPLETE if all required criteria were decisively evaluated; INCOMPLETE if any are unknown"
    )
    criteria_results: List[CriterionEvaluationResult] = Field(
        default_factory=list, description="Granular evaluation results for every scheme criterion"
    )
    met_count: int = 0
    not_met_count: int = 0
    unknown_count: int = 0
    missing_profile_fields: List[str] = Field(
        default_factory=list,
        description="Profile fields required by the scheme but missing in the citizen profile",
    )
    why_this_result: str = Field(
        description="Deterministic plain-English breakdown of why the scheme evaluated to this status"
    )


class EligibilityOut(BaseModel):
    """External API response contract matching the Architecture specification."""

    scheme_id: str
    scheme_name: str
    status: EligibilityStatus
    completeness: EvaluationCompleteness
    criteria: List[CriterionEvaluationResult]
    why_this_scheme: Optional[str] = None
    why_this_result: str
    missing_information: List[str] = Field(default_factory=list)
    sources: List[SourceOut] = Field(default_factory=list)
    disclaimer: str = Field(
        default="Preliminary assessment does not guarantee government approval. Official eligibility is subject to physical document verification and administrative determination by the implementing government authority."
    )
