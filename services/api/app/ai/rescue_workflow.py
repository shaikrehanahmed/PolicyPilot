"""LangGraph Stateful Orchestration for PolicyPilot Rescue Mode.

Mirrors the exact structure and step-logging pattern of services/api/app/ai/workflow.py.
"""
from __future__ import annotations

import logging
from datetime import datetime
from typing import Any, Dict, List, Optional, TypedDict

from langgraph.graph import END, StateGraph

from ..demo.repository import get_demo_repo
from ..rules.rescue_evaluator import (
    DEFECT_RULES_REGISTRY,
    find_no_dead_end_alternatives,
    format_guardrail_citation,
    match_symptom_code_lexically,
    scrub_sensitive_input,
)
from ..schemas.rescue import (
    ClarificationQuestion,
    EpistemicBreakdown,
    ExecutionDestination,
    GuardrailCitationOut,
    RemediationStep,
    TriageVerdictType,
)
from .workflow import _normalize_profile_data

logger = logging.getLogger("policypilot.ai.rescue_workflow")


class RescueWorkflowState(TypedDict, total=False):
    raw_status_text: str
    scrubbed_input_echo: str
    scheme_slug: Optional[str]
    selected_symptom_code: Optional[str]
    matched_symptom_code: Optional[str]
    matched_scheme_slug: Optional[str]
    matched_scheme_name: Optional[str]
    supplied_facts: Dict[str, str]
    raw_profile: Dict[str, Any]
    normalized_profile: Dict[str, Any]
    verdict: TriageVerdictType
    critical_trap_warning: Optional[str]
    clarification_questions: List[ClarificationQuestion]
    epistemic_state: EpistemicBreakdown
    remediation_steps: List[RemediationStep]
    citations: List[GuardrailCitationOut]
    alternative_schemes: List[Any]
    draft_grievance_text: Optional[str]
    steps_log: List[Dict[str, Any]]


async def scrub_and_normalize_node(state: RescueWorkflowState) -> RescueWorkflowState:
    raw_text = state.get("raw_status_text", "")
    scrubbed = scrub_sensitive_input(raw_text)
    norm_profile = _normalize_profile_data(state.get("raw_profile", {}))

    step = {
        "step_name": "PII SHIELD & NORMALIZATION",
        "detail": "Scrubbed sensitive numeric patterns and normalized citizen profile context.",
        "status": "COMPLETED",
        "timestamp": datetime.now().isoformat(),
    }
    return {
        **state,
        "scrubbed_input_echo": scrubbed,
        "normalized_profile": norm_profile,
        "steps_log": state.get("steps_log", []) + [step],
    }


async def classify_symptom_node(state: RescueWorkflowState) -> RescueWorkflowState:
    explicit_code = state.get("selected_symptom_code")
    scrubbed = state.get("scrubbed_input_echo", "")
    scheme_hint = state.get("scheme_slug")

    code = (
        explicit_code
        if explicit_code in DEFECT_RULES_REGISTRY
        else match_symptom_code_lexically(scrubbed, scheme_slug=scheme_hint)
    )

    repo = get_demo_repo()
    matched_slug = DEFECT_RULES_REGISTRY[code]["scheme_slug"] if code else scheme_hint
    scheme_obj = repo.get_scheme(matched_slug) if matched_slug else None
    scheme_name = scheme_obj["name"] if scheme_obj else None

    step = {
        "step_name": "SYMPTOM CLASSIFICATION",
        "detail": (
            f"Mapped portal status to deterministic defect rule '{code}' ({matched_slug})."
            if code
            else "Status string did not match any configured defect pattern; routing to safe unrecognized fallback."
        ),
        "status": "COMPLETED",
        "timestamp": datetime.now().isoformat(),
    }
    return {
        **state,
        "matched_symptom_code": code,
        "matched_scheme_slug": matched_slug,
        "matched_scheme_name": scheme_name,
        "steps_log": state.get("steps_log", []) + [step],
    }


async def check_clarification_node(state: RescueWorkflowState) -> RescueWorkflowState:
    code = state.get("matched_symptom_code")
    if not code or code not in DEFECT_RULES_REGISTRY:
        return {**state, "clarification_questions": []}

    rule = DEFECT_RULES_REGISTRY[code]
    supplied = state.get("supplied_facts", {})
    missing_q: List[ClarificationQuestion] = [
        q for q in rule.get("questions", []) if q.fact_key not in supplied
    ]

    if missing_q:
        cit = format_guardrail_citation(**rule["citation"])
        step = {
            "step_name": "MISSING CONTEXT CHECK",
            "detail": f"Requesting {len(missing_q)} targeted clarification question(s) before issuing recovery verdict.",
            "status": "COMPLETED",
            "timestamp": datetime.now().isoformat(),
        }
        return {
            **state,
            "verdict": TriageVerdictType.NEEDS_CLARIFICATION,
            "clarification_questions": missing_q[:3],
            "epistemic_state": EpistemicBreakdown(
                known_facts=[f"Detected portal defect pattern: {code}"],
                unknown_to_verify=[q.question_text for q in missing_q[:3]],
                unverified_boundaries=[
                    "Remediation steps depend on your answers above to avoid procedural mistakes."
                ],
            ),
            "citations": [cit],
            "steps_log": state.get("steps_log", []) + [step],
        }

    return {**state, "clarification_questions": []}


def route_after_clarification(state: RescueWorkflowState) -> str:
    if state.get("verdict") == TriageVerdictType.NEEDS_CLARIFICATION:
        return "needs_clarification"
    return "ready_to_evaluate"


async def evaluate_defect_rules_node(state: RescueWorkflowState) -> RescueWorkflowState:
    code = state.get("matched_symptom_code")
    facts = state.get("supplied_facts", {})

    if not code or code not in DEFECT_RULES_REGISTRY:
        step = {
            "step_name": "DETERMINISTIC DEFECT ENGINE",
            "detail": "Unmapped status code; returning safe Nodal Desk verification checklist without guessing.",
            "status": "COMPLETED",
            "timestamp": datetime.now().isoformat(),
        }
        return {
            **state,
            "verdict": TriageVerdictType.UNRECOGNIZED_STATUS,
            "epistemic_state": EpistemicBreakdown(
                known_facts=["Sensitive digit strings were scrubbed prior to evaluation."],
                unknown_to_verify=["Exact portal error string is not in the current 5-scheme rulebook."],
                unverified_boundaries=[
                    "PolicyPilot never fabricates government portal steps for unrecognized status codes."
                ],
            ),
            "remediation_steps": [
                RemediationStep(
                    step_number=1,
                    destination=ExecutionDestination.INSTITUTE_NODAL_OFFICER,
                    action_title="Present Portal Status Screenshot at Official Helpdesk / CSC",
                    detailed_instruction=(
                        "Do not withdraw your application based on unverified advice. Bring your portal "
                        "Application ID and status screenshot to your Nodal Officer or MeeSeva/CSC counter."
                    ),
                    required_items_to_carry=["Application Acknowledgement Slip", "Screenshot of Portal Error"],
                )
            ],
            "citations": [],
            "steps_log": state.get("steps_log", []) + [step],
        }

    rule = DEFECT_RULES_REGISTRY[code]
    citation = format_guardrail_citation(**rule["citation"])
    trap_warning: Optional[str] = None
    grievance_draft: Optional[str] = None

    if code == "NSP_DEFECT_BASIC_INFO_MISMATCH":
        app_type = facts.get("application_type", "FRESH")
        app_count = facts.get("active_applications_count", "ONE")
        if app_type == "FRESH":
            verdict = TriageVerdictType.PROCEDURAL_TRAP_WARNING
            trap_warning = (
                "DO NOT WITHDRAW THIS APPLICATION: Because yours is a FRESH application, NSP User Manual v2.2 "
                "(Page 4) strictly prohibits revoking a Fresh application once withdrawn. Only Renewal "
                "applications can be revoked after withdrawal."
            )
        else:
            verdict = TriageVerdictType.CORRECTABLE_DEFECT
            trap_warning = (
                "Renewal Safeguard: Although Renewal applications can be revoked once if withdrawn, you should "
                "NOT withdraw if you only have 1 active application—update via OTR Refresh instead."
            )

        steps_list = [
            RemediationStep(
                step_number=1,
                destination=ExecutionDestination.ONLINE_PORTAL_SELF,
                action_title="Update Mismatched Details in NSP OTR Module First",
                detailed_instruction=(
                    "Log into the NSP One-Time Registration (OTR) module using your OTR ID and update the "
                    "mismatched basic/eKYC detail there first (fields cannot be edited directly inside the form)."
                ),
                required_items_to_carry=["OTR Reference ID", "Income/Caste Certificate for exact spelling check"],
            ),
            RemediationStep(
                step_number=2,
                destination=ExecutionDestination.ONLINE_PORTAL_SELF,
                action_title="Click 'Refresh Applicant Details from OTR' in My Profile",
                detailed_instruction=(
                    "Log into your NSP Applicant Dashboard -> Navigate to 'My Profile' -> Click 'Refresh Applicant "
                    "Details from OTR' so the corrected OTR record syncs into your defective scholarship form."
                    if app_count == "ONE"
                    else "Because you indicated multiple active applications, withdraw only duplicate drafts first so a single active form remains, then click 'Refresh Applicant Details from OTR'."
                ),
                required_items_to_carry=["Registered Mobile Number for OTP"],
            ),
            RemediationStep(
                step_number=3,
                destination=ExecutionDestination.INSTITUTE_NODAL_OFFICER,
                action_title="Re-Submit Defective Form to College Institute Nodal Officer (INO)",
                detailed_instruction=(
                    "Verify the refreshed fields match your certificate, submit the corrected form on NSP, "
                    "and present this Counter Slip to your college scholarship clerk for Level-1 re-verification."
                ),
                required_items_to_carry=["Printed Counter Action Slip", "Original Income & Caste Certificate"],
            ),
        ]
        epistemic = EpistemicBreakdown(
            known_facts=[
                "Basic details cannot be edited directly inside the NSP Application Form.",
                f"Application is {app_type} ({app_count} active application).",
            ],
            unknown_to_verify=[
                "Whether your college Institute Nodal Officer (INO) verification window is still open."
            ],
            unverified_boundaries=[
                "PolicyPilot cannot access your live NSP dashboard or guarantee INO approval timelines."
            ],
        )
        grievance_draft = (
            "To: The Institute Nodal Officer (INO)\n"
            "Subject: Request for Level-1 Re-Verification of NSP Post-Matric Scholarship Form after OTR Sync\n\n"
            "Respected Sir/Madam,\n"
            "My scholarship application was flagged as Defective due to a Basic Information mismatch. "
            "In compliance with NSP Application Manual v2.2 (Page 4), I have updated my record in the NSP OTR "
            "module and executed 'Refresh Applicant Details from OTR' without withdrawing my application. "
            "I kindly request you to re-verify my updated application at the Institute Nodal level."
        )

    elif code == "PMKISAN_PFMS_BANK_MAPPER_INACTIVE":
        ekyc_done = facts.get("ekyc_completed", "YES")
        verdict = TriageVerdictType.CORRECTABLE_DEFECT
        steps_list = [
            RemediationStep(
                step_number=1,
                destination=ExecutionDestination.BANK_BRANCH_NPCI_DESK,
                action_title="Request 'NPCI DBT Mapper Seeding' at Bank Branch or IPPB",
                detailed_instruction=(
                    "Visit your bank branch (or India Post Payments Bank counter) and specifically ask the officer "
                    "to link your account on the 'NPCI DBT Mapper'. Regular KYC or ATM deposits working is not sufficient."
                ),
                required_items_to_carry=["Bank Passbook", "NPCI DBT Seeding Consent Form"],
            ),
        ]
        if ekyc_done == "NO":
            steps_list.insert(
                0,
                RemediationStep(
                    step_number=1,
                    destination=ExecutionDestination.MEESEVA_OR_CSC_CENTRE,
                    action_title="Complete Mandatory PM-KISAN eKYC First",
                    detailed_instruction="Complete OTP-based eKYC on pmkisan.gov.in or biometric eKYC at your nearest CSC.",
                    required_items_to_carry=["Registered Mobile or CSC Biometric Auth"],
                ),
            )
            steps_list[1].step_number = 2

        epistemic = EpistemicBreakdown(
            known_facts=[
                "FTO Processed = Yes confirms state agricultural verification already succeeded.",
                "Payment rejection occurred at the PFMS-to-NPCI bank routing layer.",
            ],
            unknown_to_verify=["Which bank account currently holds your active NPCI mapper link."],
            unverified_boundaries=[
                "NPCI mapper propagation takes 3–7 working days after the bank branch submits it."
            ],
        )

    elif code == "PMKISAN_PFMS_RESPONSE_PENDING":
        days = facts.get("working_days_elapsed", "UNDER_5_DAYS")
        if days == "UNDER_5_DAYS":
            verdict = TriageVerdictType.QUEUE_WAIT_NO_ACTION
            steps_list = [
                RemediationStep(
                    step_number=1,
                    destination=ExecutionDestination.NO_ACTION_WAIT,
                    action_title="Wait 3–5 Working Days (Automated PFMS Batch Validation Running)",
                    detailed_instruction=(
                        "Do not pay a CSC operator or visit the agriculture office yet. Your FTO is generated and "
                        "PFMS is performing routine batch validation with your bank."
                    ),
                    required_items_to_carry=[],
                )
            ]
        else:
            verdict = TriageVerdictType.CORRECTABLE_DEFECT
            steps_list = [
                RemediationStep(
                    step_number=1,
                    destination=ExecutionDestination.BANK_BRANCH_NPCI_DESK,
                    action_title="Verify NPCI DBT Active Status at Your Bank Branch",
                    detailed_instruction=(
                        "Because PFMS Response Pending has exceeded 10 working days, check with your bank branch "
                        "that your account is not dormant/frozen and remains active on the NPCI DBT mapper."
                    ),
                    required_items_to_carry=["Bank Passbook"],
                )
            ]
        epistemic = EpistemicBreakdown(
            known_facts=["FTO is already generated; your application has NOT been rejected."],
            unknown_to_verify=["Exact date when the current state PFMS batch settles."],
            unverified_boundaries=["PolicyPilot cannot view internal PFMS batch queue timestamps."],
        )

    elif code == "RYTHU_PASSBOOK_NAME_MISMATCH":
        verdict = TriageVerdictType.CORRECTABLE_DEFECT
        steps_list = [
            RemediationStep(
                step_number=1,
                destination=ExecutionDestination.MEESEVA_OR_CSC_CENTRE,
                action_title="File Passbook Data Correction on Telangana Dharani / CCLA Portal via MeeSeva",
                detailed_instruction=(
                    "Visit a Telangana MeeSeva centre with your digital Pattadar Passbook and bank passbook to "
                    "align the recorded Pattadar name spelling with your core banking record."
                ),
                required_items_to_carry=["Telangana Pattadar Passbook", "Bank Account Passbook"],
            ),
            RemediationStep(
                step_number=2,
                destination=ExecutionDestination.AGRICULTURE_OR_TEHSIL_OFFICE,
                action_title="Confirm Updated Passbook Sync with Mandal Agriculture Officer (MAO)",
                detailed_instruction=(
                    "Once CCLA/Dharani name correction is approved by the Tahsildar, notify your Mandal Agriculture "
                    "Officer (MAO) to re-trigger the seasonal Rythu Bharosa DBT batch."
                ),
                required_items_to_carry=["MeeSeva Correction Receipt", "Updated Pattadar Passbook"],
            ),
        ]
        epistemic = EpistemicBreakdown(
            known_facts=["Rythu Bharosa DBT requires exact name alignment with digital Pattadar Passbook."],
            unknown_to_verify=["Whether the spelling discrepancy is in the bank record or the CCLA land record."],
            unverified_boundaries=["Tahsildar approval timelines for land record corrections vary by Mandal."],
        )

    else:
        # PMKISAN_SUBSTANTIVE_LAND_EXCLUSION
        verdict = TriageVerdictType.SUBSTANTIVE_EXCLUSION
        steps_list = [
            RemediationStep(
                step_number=1,
                destination=ExecutionDestination.MEESEVA_OR_CSC_CENTRE,
                action_title="Substantive Exclusion Confirmed — Pivot to Verified Alternative Schemes Below",
                detailed_instruction=(
                    "PM-KISAN strictly requires cultivable agricultural land recorded in state revenue records. "
                    "Unless your land title was omitted due to a revenue clerical error, an appeal will not succeed. "
                    "Review the verified non-landholding schemes below evaluated for your profile."
                ),
                required_items_to_carry=["Ration Card / Household Entitlement Proof for Alternative Schemes"],
            )
        ]
        epistemic = EpistemicBreakdown(
            known_facts=[
                "PM-KISAN Clause 2.1 & 2.2 mandate ownership of cultivable land in state revenue records."
            ],
            unknown_to_verify=[
                "Whether you hold unmutated ancestral land that has not yet been updated in revenue records."
            ],
            unverified_boundaries=[
                "PolicyPilot never promises an appeal will succeed when a statutory criterion is not met."
            ],
        )

    step = {
        "step_name": "DETERMINISTIC DEFECT ENGINE",
        "detail": f"Evaluated rule '{code}' -> Verdict: {verdict.value} (Zero LLM reliance).",
        "status": "COMPLETED",
        "timestamp": datetime.now().isoformat(),
    }
    return {
        **state,
        "verdict": verdict,
        "critical_trap_warning": trap_warning,
        "epistemic_state": epistemic,
        "remediation_steps": steps_list,
        "citations": [citation],
        "draft_grievance_text": grievance_draft,
        "steps_log": state.get("steps_log", []) + [step],
    }


async def no_dead_end_alternatives_node(state: RescueWorkflowState) -> RescueWorkflowState:
    if state.get("verdict") != TriageVerdictType.SUBSTANTIVE_EXCLUSION:
        return {**state, "alternative_schemes": []}

    excluded_slug = state.get("matched_scheme_slug") or ""
    norm_profile = state.get("normalized_profile", {})
    alternatives = find_no_dead_end_alternatives(excluded_slug, norm_profile)

    step = {
        "step_name": "NO-DEAD-END ALTERNATIVE ROUTING",
        "detail": (
            f"Ran deterministic evaluate_scheme_eligibility() across remaining verified schemes; "
            f"found {len(alternatives)} viable alternative pathway(s)."
        ),
        "status": "COMPLETED",
        "timestamp": datetime.now().isoformat(),
    }
    return {
        **state,
        "alternative_schemes": alternatives,
        "steps_log": state.get("steps_log", []) + [step],
    }


def build_rescue_workflow():
    builder = StateGraph(RescueWorkflowState)
    builder.add_node("scrub_and_normalize", scrub_and_normalize_node)
    builder.add_node("classify_symptom", classify_symptom_node)
    builder.add_node("check_clarification", check_clarification_node)
    builder.add_node("evaluate_defect_rules", evaluate_defect_rules_node)
    builder.add_node("no_dead_end_alternatives", no_dead_end_alternatives_node)

    builder.set_entry_point("scrub_and_normalize")
    builder.add_edge("scrub_and_normalize", "classify_symptom")
    builder.add_edge("classify_symptom", "check_clarification")
    builder.add_conditional_edges(
        "check_clarification",
        route_after_clarification,
        {
            "needs_clarification": END,
            "ready_to_evaluate": "evaluate_defect_rules",
        },
    )
    builder.add_edge("evaluate_defect_rules", "no_dead_end_alternatives")
    builder.add_edge("no_dead_end_alternatives", END)

    return builder.compile()


_compiled_rescue_workflow = None


def get_rescue_workflow():
    global _compiled_rescue_workflow
    if _compiled_rescue_workflow is None:
        _compiled_rescue_workflow = build_rescue_workflow()
    return _compiled_rescue_workflow
