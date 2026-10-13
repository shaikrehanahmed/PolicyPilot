from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

from .common import EligibilityStatus, VerificationStatus


class TriageVerdictType(str, Enum):
    """Deterministic post-application triage outcome."""

    NEEDS_CLARIFICATION = "NEEDS_CLARIFICATION"
    CORRECTABLE_DEFECT = "CORRECTABLE_DEFECT"
    PROCEDURAL_TRAP_WARNING = "PROCEDURAL_TRAP_WARNING"
    QUEUE_WAIT_NO_ACTION = "QUEUE_WAIT_NO_ACTION"
    SUBSTANTIVE_EXCLUSION = "SUBSTANTIVE_EXCLUSION"
    UNRECOGNIZED_STATUS = "UNRECOGNIZED_STATUS"


class ExecutionDestination(str, Enum):
    """Exact physical or digital counter where the citizen must act."""

    ONLINE_PORTAL_SELF = "ONLINE_PORTAL_SELF"
    BANK_BRANCH_NPCI_DESK = "BANK_BRANCH_NPCI_DESK"
    INSTITUTE_NODAL_OFFICER = "INSTITUTE_NODAL_OFFICER"
    MEESEVA_OR_CSC_CENTRE = "MEESEVA_OR_CSC_CENTRE"
    AGRICULTURE_OR_TEHSIL_OFFICE = "AGRICULTURE_OR_TEHSIL_OFFICE"
    NO_ACTION_WAIT = "NO_ACTION_WAIT"


class ClarificationOption(BaseModel):
    value: str
    label: str


class ClarificationQuestion(BaseModel):
    fact_key: str
    question_text: str
    options: List[ClarificationOption]
    why_this_matters: str


class EpistemicBreakdown(BaseModel):
    """Explicit separation of known facts, user checks, and system boundaries."""

    known_facts: List[str] = Field(default_factory=list)
    unknown_to_verify: List[str] = Field(default_factory=list)
    unverified_boundaries: List[str] = Field(default_factory=list)


class GuardrailCitationOut(BaseModel):
    """Matches .agents/skills/policypilot-guardrails/SKILL.md Section 2 & 3."""

    quote: str
    source_id: str
    source_title: str
    source_url: str
    source_tier: int = 1
    section_ref: Optional[str] = None
    last_verified_at: str
    freshness_status: VerificationStatus = VerificationStatus.VERIFIED
    xml_delimited_chunk: str


class RemediationStep(BaseModel):
    step_number: int
    destination: ExecutionDestination
    action_title: str
    detailed_instruction: str
    required_items_to_carry: List[str] = Field(default_factory=list)


class AlternativeSchemeOption(BaseModel):
    scheme_id: str
    scheme_slug: str
    scheme_name: str
    overall_status: EligibilityStatus
    why_this_result: str
    missing_profile_fields: List[str] = Field(default_factory=list)


class RescuePresetOut(BaseModel):
    preset_id: str
    label: str
    scheme_slug: str
    symptom_code: str
    sample_status_text: str
    suggested_profile: Dict[str, Any] = Field(default_factory=dict)


class RescueWorkflowStepLog(BaseModel):
    step_name: str
    detail: str
    status: str
    timestamp: str


class RescueDiagnoseRequest(BaseModel):
    scheme_slug: Optional[str] = Field(
        default=None, description="Optional scheme slug (e.g. nsp-post-matric, pm-kisan)"
    )
    raw_status_text: str = Field(
        ..., max_length=600, description="Portal status or defect string pasted by user"
    )
    selected_symptom_code: Optional[str] = Field(
        default=None, description="Optional explicit symptom code from preset chip"
    )
    supplied_facts: Dict[str, str] = Field(
        default_factory=dict,
        description="Answers to clarification radio questions (e.g. {'application_type': 'FRESH'})",
    )
    profile: Dict[str, Any] = Field(
        default_factory=dict,
        description="Optional citizen profile for No-Dead-End alternative scheme evaluation",
    )


class RescueDiagnoseResponse(BaseModel):
    status: str = "SUCCESS"
    scrubbed_input_echo: str
    matched_scheme_slug: Optional[str] = None
    matched_scheme_name: Optional[str] = None
    matched_symptom_code: Optional[str] = None
    verdict: TriageVerdictType
    critical_trap_warning: Optional[str] = None
    clarification_questions: List[ClarificationQuestion] = Field(default_factory=list)
    epistemic_state: EpistemicBreakdown
    remediation_steps: List[RemediationStep] = Field(default_factory=list)
    citations: List[GuardrailCitationOut] = Field(default_factory=list)
    alternative_schemes: List[AlternativeSchemeOption] = Field(default_factory=list)
    draft_grievance_text: Optional[str] = None
    steps_log: List[RescueWorkflowStepLog] = Field(default_factory=list)
    disclaimer: str = Field(
        default=(
            "Rescue Mode provides deterministic procedural guidance grounded in official portal "
            "manuals. It does not guarantee reversal of a government rejection or approval of a benefit."
        )
    )
