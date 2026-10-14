import logging
from typing import List

from fastapi import APIRouter

from ..ai.rescue_workflow import get_rescue_workflow
from ..rules.rescue_evaluator import RESCUE_PRESETS
from ..schemas.rescue import (
    EpistemicBreakdown,
    RescueDiagnoseRequest,
    RescueDiagnoseResponse,
    RescuePresetOut,
    RescueWorkflowStepLog,
    TriageVerdictType,
)

logger = logging.getLogger("policypilot.api.rescue")
router = APIRouter(prefix="/rescue", tags=["Rescue Mode"])


@router.get("/presets", response_model=List[RescuePresetOut])
async def get_rescue_presets() -> List[RescuePresetOut]:
    """Returns curated 1-click portal defect scenarios for citizens and hackathon judges."""
    return RESCUE_PRESETS


@router.post("/diagnose", response_model=RescueDiagnoseResponse)
async def diagnose_application_status(payload: RescueDiagnoseRequest) -> RescueDiagnoseResponse:
    """Executes the PolicyPilot Rescue Mode LangGraph pipeline:
    1. PII SHIELD & NORMALIZATION
    2. SYMPTOM CLASSIFICATION
    3. MISSING CONTEXT CHECK (1-3 clarification radio questions if needed)
    4. DETERMINISTIC DEFECT ENGINE (Zero LLM reliance)
    5. NO-DEAD-END ALTERNATIVE ROUTING (Evaluates remaining verified schemes on substantive exclusion)
    """
    workflow = get_rescue_workflow()
    initial_state = {
        "raw_status_text": payload.raw_status_text,
        "scheme_slug": payload.scheme_slug,
        "selected_symptom_code": payload.selected_symptom_code,
        "supplied_facts": payload.supplied_facts,
        "raw_profile": payload.profile,
        "steps_log": [],
    }

    final_state = await workflow.ainvoke(initial_state)
    steps = [
        RescueWorkflowStepLog(
            step_name=s.get("step_name", ""),
            detail=s.get("detail", ""),
            status=s.get("status", "COMPLETED"),
            timestamp=s.get("timestamp", ""),
        )
        for s in final_state.get("steps_log", [])
    ]

    remediation_steps = final_state.get("remediation_steps", [])
    actor_key = "STUDENT_APPLICANT"
    if remediation_steps:
        dest_val = getattr(remediation_steps[0].destination, "value", str(remediation_steps[0].destination))
        if "BANK" in dest_val:
            actor_key = "BANK_OR_NPCI_DESK"
        elif "INSTITUTE" in dest_val:
            actor_key = "INSTITUTE_NODAL_OFFICER"
        elif "MEESEVA" in dest_val:
            actor_key = "MEESEVA_OR_CSC_CENTRE"
        elif "WAIT" in dest_val:
            actor_key = "NO_ACTION_REQUIRED_WAIT"

    from ..ai.i18n import get_actor_explanation, get_disclaimer

    lang_code = payload.lang.value if hasattr(payload.lang, "value") else str(payload.lang)
    actor_exp = get_actor_explanation(actor_key, lang=lang_code)
    simple_exp = (
        final_state.get("simple_explanation")
        or (
            "Application marked Defective: Details mismatch must be updated in NSP OTR module first."
            if final_state.get("matched_symptom_code") == "NSP_DEFECT_BASIC_INFO_MISMATCH"
            else (remediation_steps[0].action_title if remediation_steps else "Application status evaluated.")
        )
    )
    polite_draft = final_state.get("draft_grievance_text")

    return RescueDiagnoseResponse(
        status="SUCCESS",
        scrubbed_input_echo=final_state.get("scrubbed_input_echo", ""),
        matched_scheme_slug=final_state.get("matched_scheme_slug"),
        matched_scheme_name=final_state.get("matched_scheme_name"),
        matched_symptom_code=final_state.get("matched_symptom_code"),
        verdict=final_state.get("verdict", TriageVerdictType.UNRECOGNIZED_STATUS),
        critical_trap_warning=final_state.get("critical_trap_warning"),
        actor_explanation=actor_exp,
        simple_explanation=simple_exp,
        polite_office_draft=polite_draft,
        clarification_questions=final_state.get("clarification_questions", []),
        epistemic_state=final_state.get("epistemic_state", EpistemicBreakdown()),
        remediation_steps=remediation_steps,
        citations=final_state.get("citations", []),
        alternative_schemes=final_state.get("alternative_schemes", []),
        draft_grievance_text=polite_draft,
        steps_log=steps,
        disclaimer=get_disclaimer(lang=lang_code),
    )
