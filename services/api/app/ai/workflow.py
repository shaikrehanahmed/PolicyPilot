import logging
from datetime import datetime
from typing import Any, Dict, List, Optional, TypedDict

from langgraph.graph import END, StateGraph

from app.demo.repository import get_demo_repo
from app.rules.evaluator import evaluate_scheme_eligibility

from .explanation import generate_explanation

logger = logging.getLogger("policypilot.ai.workflow")


class WorkflowState(TypedDict, total=False):
    raw_profile: Dict[str, Any]
    goal: Optional[str]
    selected_scheme_slug: Optional[str]
    normalized_profile: Dict[str, Any]
    discovered_schemes: List[Dict[str, Any]]
    evaluations: List[Dict[str, Any]]
    missing_fields: List[str]
    evidence_chunks: List[Dict[str, Any]]
    action_plan: Dict[str, Any]
    explanation: Dict[str, Any]
    steps_log: List[Dict[str, Any]]
    error: Optional[str]


def _normalize_profile_data(raw: Dict[str, Any]) -> Dict[str, Any]:
    norm: Dict[str, Any] = {}
    if "state" in raw and raw["state"]:
        norm["state"] = str(raw["state"]).strip().upper()
    if "age" in raw and raw["age"] is not None:
        try:
            norm["age"] = int(raw["age"])
        except (ValueError, TypeError):
            pass
    if "annual_income_inr" in raw and raw["annual_income_inr"] is not None:
        try:
            cleaned = str(raw["annual_income_inr"]).replace(",", "").replace("₹", "").strip()
            norm["annual_income_inr"] = float(cleaned)
        except (ValueError, TypeError):
            pass
    if "occupation" in raw and raw["occupation"]:
        norm["occupation"] = str(raw["occupation"]).strip().lower()
    if "category" in raw and raw["category"]:
        norm["category"] = str(raw["category"]).strip().upper()
    if "gender" in raw and raw["gender"]:
        norm["gender"] = str(raw["gender"]).strip().lower()
    if "landholding_acres" in raw and raw["landholding_acres"] is not None:
        try:
            norm["landholding_acres"] = float(raw["landholding_acres"])
        except (ValueError, TypeError):
            pass
    if "disability_percent" in raw and raw["disability_percent"] is not None:
        try:
            norm["disability_percent"] = float(raw["disability_percent"])
        except (ValueError, TypeError):
            pass
    if "education_level" in raw and raw["education_level"]:
        norm["education_level"] = str(raw["education_level"]).strip()
    if "is_minority" in raw and raw["is_minority"] is not None:
        norm["is_minority"] = bool(raw["is_minority"])
    if "is_institutional_landholder" in raw and raw["is_institutional_landholder"] is not None:
        val = raw["is_institutional_landholder"]
        norm["is_institutional_landholder"] = str(val).lower() in ("true", "1", "yes") if isinstance(val, (str, int)) else bool(val)
    if "is_government_employee" in raw and raw["is_government_employee"] is not None:
        val = raw["is_government_employee"]
        norm["is_government_employee"] = str(val).lower() in ("true", "1", "yes") if isinstance(val, (str, int)) else bool(val)
    if "is_income_tax_payee" in raw and raw["is_income_tax_payee"] is not None:
        val = raw["is_income_tax_payee"]
        norm["is_income_tax_payee"] = str(val).lower() in ("true", "1", "yes") if isinstance(val, (str, int)) else bool(val)
    if "residence_area" in raw and raw["residence_area"]:
        norm["residence_area"] = str(raw["residence_area"]).strip().lower()
    if "owns_pucca_house" in raw and raw["owns_pucca_house"] is not None:
        val = raw["owns_pucca_house"]
        norm["owns_pucca_house"] = str(val).lower() in ("true", "1", "yes") if isinstance(val, (str, int)) else bool(val)
    if "has_motorized_vehicle" in raw and raw["has_motorized_vehicle"] is not None:
        val = raw["has_motorized_vehicle"]
        norm["has_motorized_vehicle"] = str(val).lower() in ("true", "1", "yes") if isinstance(val, (str, int)) else bool(val)
    if "has_kcc_above_50k" in raw and raw["has_kcc_above_50k"] is not None:
        val = raw["has_kcc_above_50k"]
        norm["has_kcc_above_50k"] = str(val).lower() in ("true", "1", "yes") if isinstance(val, (str, int)) else bool(val)
    if "goal" in raw and raw["goal"]:
        norm["goal"] = str(raw["goal"]).strip()
    return norm


async def normalize_profile_node(state: WorkflowState) -> WorkflowState:
    raw = state.get("raw_profile", {})
    norm = _normalize_profile_data(raw)
    step = {
        "step_name": "NORMALIZING PROFILE",
        "detail": "Validated and coerced demographic data, income floats, and category tokens.",
        "status": "COMPLETED",
        "timestamp": datetime.now().isoformat(),
    }
    steps = state.get("steps_log", []) + [step]
    return {**state, "normalized_profile": norm, "steps_log": steps}


async def discover_schemes_node(state: WorkflowState) -> WorkflowState:
    repo = get_demo_repo()
    norm = state.get("normalized_profile", {})
    goal = state.get("goal") or norm.get("goal")

    discovered = repo.discover_schemes(norm, goal=goal)
    step = {
        "step_name": "DISCOVERING SCHEMES",
        "detail": f"Matched {len(discovered)} relevant scheme(s) based on category, state, and demographic criteria.",
        "status": "COMPLETED",
        "timestamp": datetime.now().isoformat(),
    }
    steps = state.get("steps_log", []) + [step]
    return {**state, "discovered_schemes": discovered, "steps_log": steps}


async def evaluate_rules_node(state: WorkflowState) -> WorkflowState:
    repo = get_demo_repo()
    norm = state.get("normalized_profile", {})
    schemes = state.get("discovered_schemes", [])
    selected_slug = state.get("selected_scheme_slug")

    evaluations: List[Dict[str, Any]] = []
    all_missing_fields: List[str] = []

    target_schemes = schemes
    if selected_slug:
        target_schemes = [s for s in schemes if s.get("slug") == selected_slug or s.get("id") == selected_slug]
        if not target_schemes:
            # Try fetching directly from repo
            s = repo.get_scheme(selected_slug)
            if s:
                target_schemes = [s]

    for s in target_schemes:
        criteria = repo.get_scheme_criteria(s["id"])
        assessment = evaluate_scheme_eligibility(s, criteria, norm)
        eval_dict = assessment.model_dump()
        eval_dict["scheme_slug"] = s.get("slug")
        eval_dict["scheme_name"] = s.get("name")
        eval_dict["documents"] = s.get("documents", [])
        eval_dict["source"] = s.get("source")
        evaluations.append(eval_dict)

        for mf in assessment.missing_profile_fields:
            if mf not in all_missing_fields:
                all_missing_fields.append(mf)

    step = {
        "step_name": "EVALUATING RULES",
        "detail": f"Deterministic Python rule engine evaluated {len(evaluations)} scheme(s) (Zero LLM reliance).",
        "status": "COMPLETED",
        "timestamp": datetime.now().isoformat(),
    }
    steps = state.get("steps_log", []) + [step]
    return {
        **state,
        "evaluations": evaluations,
        "missing_fields": all_missing_fields,
        "steps_log": steps,
    }


async def check_missing_info_node(state: WorkflowState) -> WorkflowState:
    missing = state.get("missing_fields", [])
    detail = (
        f"Detected {len(missing)} missing field(s): {', '.join(missing)}."
        if missing
        else "All necessary demographic fields are present for decisive evaluation."
    )
    step = {
        "step_name": "CHECKING DOCUMENTS & DEADLINES",
        "detail": detail,
        "status": "COMPLETED",
        "timestamp": datetime.now().isoformat(),
    }
    steps = state.get("steps_log", []) + [step]
    return {**state, "steps_log": steps}


async def retrieve_evidence_node(state: WorkflowState) -> WorkflowState:
    repo = get_demo_repo()
    evaluations = state.get("evaluations", [])
    chunks: List[Dict[str, Any]] = []

    for ev in evaluations[:3]:
        slug = ev.get("scheme_slug")
        evidence = repo.search_evidence(query=ev.get("scheme_name", ""), scheme_id=slug, top_k=3)
        chunks.extend(evidence)

    step = {
        "step_name": "VERIFYING SOURCES",
        "detail": f"Retrieved {len(chunks)} official evidence excerpt(s) with tier metadata and Gazette citations.",
        "status": "COMPLETED",
        "timestamp": datetime.now().isoformat(),
    }
    steps = state.get("steps_log", []) + [step]
    return {**state, "evidence_chunks": chunks, "steps_log": steps}


async def generate_action_plan_node(state: WorkflowState) -> WorkflowState:
    evaluations = state.get("evaluations", [])
    primary_eval = evaluations[0] if evaluations else {}
    evidence = state.get("evidence_chunks", [])

    scheme_name = primary_eval.get("scheme_name", "Target Scheme")
    status = primary_eval.get("overall_status", "UNDETERMINED")
    met_count = primary_eval.get("met_count", 0)
    not_met_count = primary_eval.get("not_met_count", 0)
    unknown_count = primary_eval.get("unknown_count", 0)
    missing = primary_eval.get("missing_profile_fields", [])
    criteria = primary_eval.get("criteria_results", [])
    source = primary_eval.get("source")
    sources = [source] if source else []
    quotes = [c.get("quote", "") for c in evidence[:3] if c.get("quote")]

    # Call AI explanation with honest deterministic fallback
    explanation_res = await generate_explanation(
        scheme_name=scheme_name,
        status=status,
        met_count=met_count,
        not_met_count=not_met_count,
        unknown_count=unknown_count,
        missing_fields=missing,
        criteria_results=criteria,
        sources=sources,
        evidence_quotes=quotes,
    )

    # Build chronological action roadmap
    steps_roadmap: List[Dict[str, Any]] = []

    if missing:
        steps_roadmap.append({
            "order": 1,
            "title": "Complete Missing Profile Information",
            "action": f"Provide your {', '.join(missing)} so all eligibility conditions can be conclusively verified.",
            "status": "PENDING_USER_INPUT",
            "critical": True,
        })

    docs = primary_eval.get("documents", [])
    if docs:
        doc_names = [d.get("name", "Document") for d in docs]
        steps_roadmap.append({
            "order": len(steps_roadmap) + 1,
            "title": "Prepare Required Official Documents",
            "action": f"Assemble the following verified documents: {', '.join(doc_names)}.",
            "documents": docs,
            "status": "READY_FOR_PREPARATION",
            "critical": True,
        })

    portal_url = (source or {}).get("url") or "https://india.gov.in"
    steps_roadmap.append({
        "order": len(steps_roadmap) + 1,
        "title": "Submit Application via Official Portal",
        "action": f"Visit the official government scheme portal ({portal_url}) and submit your application.",
        "portal_url": portal_url,
        "status": "NEXT_ACTION" if status in ["ELIGIBLE", "PARTIALLY_ELIGIBLE"] else "BLOCKED",
        "critical": False,
    })

    steps_roadmap.append({
        "order": len(steps_roadmap) + 1,
        "title": "Track Verification & Acknowledgement",
        "action": "Retain the official application acknowledgement number and verify status at the local nodal office or portal.",
        "status": "UPCOMING",
        "critical": False,
    })

    action_plan = {
        "scheme_name": scheme_name,
        "overall_status": status,
        "roadmap": steps_roadmap,
        "official_portal_url": portal_url,
        "required_documents": docs,
        "disclaimer": "This is an evidence-grounded preliminary assessment based on available official rules. It does not constitute government approval.",
    }

    step = {
        "step_name": "PREPARING ACTION PLAN",
        "detail": f"Synthesized personalized {len(steps_roadmap)}-step action roadmap and official document checklist.",
        "status": "COMPLETED",
        "timestamp": datetime.now().isoformat(),
    }
    steps = state.get("steps_log", []) + [step]
    return {
        **state,
        "action_plan": action_plan,
        "explanation": explanation_res,
        "steps_log": steps,
    }


async def no_schemes_fallback_node(state: WorkflowState) -> WorkflowState:
    step = {
        "step_name": "DISCOVERY FALLBACK",
        "detail": "No eligible or active government schemes matched current demographic profile filters. Recommending profile adjustment.",
        "status": "COMPLETED",
        "timestamp": datetime.now().isoformat(),
    }
    action_plan = {
        "scheme_name": "No Matching Scheme",
        "overall_status": "NOT_ELIGIBLE",
        "roadmap": [
            {
                "order": 1,
                "title": "Review Demographic Profile",
                "action": "Ensure state, income, and category are accurately configured in your Citizen Profile.",
                "status": "NEXT_ACTION",
                "critical": True,
            },
            {
                "order": 2,
                "title": "Explore Universal Public Portals",
                "action": "Visit India.gov.in or myScheme.gov.in for broad central and state public benefit announcements.",
                "portal_url": "https://www.myscheme.gov.in",
                "status": "UPCOMING",
                "critical": False,
            },
        ],
        "official_portal_url": "https://www.myscheme.gov.in",
        "required_documents": [],
        "disclaimer": "No matching schemes found based on current profile inputs.",
    }
    explanation = {
        "summary": "No active government welfare schemes in the repository match your current demographic criteria.",
        "strengths": [],
        "bottlenecks": ["Profile demographics do not align with current targeted central or state welfare programmes."],
        "recommended_action": "Broaden profile criteria or explore national portals like myScheme.gov.in.",
        "is_ai_generated": False,
        "model_used": "deterministic_fallback",
    }
    steps = state.get("steps_log", []) + [step]
    return {
        **state,
        "evaluations": [],
        "missing_fields": [],
        "evidence_chunks": [],
        "action_plan": action_plan,
        "explanation": explanation,
        "steps_log": steps,
    }


def route_after_discovery(state: WorkflowState) -> str:
    schemes = state.get("discovered_schemes", [])
    if not schemes:
        return "no_schemes"
    return "has_schemes"


def build_policypilot_workflow():
    builder = StateGraph(WorkflowState)
    builder.add_node("normalize_profile", normalize_profile_node)
    builder.add_node("discover_schemes", discover_schemes_node)
    builder.add_node("no_schemes_fallback", no_schemes_fallback_node)
    builder.add_node("evaluate_rules", evaluate_rules_node)
    builder.add_node("check_missing_info", check_missing_info_node)
    builder.add_node("retrieve_evidence", retrieve_evidence_node)
    builder.add_node("generate_action_plan", generate_action_plan_node)

    builder.set_entry_point("normalize_profile")
    builder.add_edge("normalize_profile", "discover_schemes")
    builder.add_conditional_edges(
        "discover_schemes",
        route_after_discovery,
        {
            "has_schemes": "evaluate_rules",
            "no_schemes": "no_schemes_fallback",
        },
    )
    builder.add_edge("no_schemes_fallback", END)
    builder.add_edge("evaluate_rules", "check_missing_info")
    builder.add_edge("check_missing_info", "retrieve_evidence")
    builder.add_edge("retrieve_evidence", "generate_action_plan")
    builder.add_edge("generate_action_plan", END)

    return builder.compile()


_compiled_workflow = None


def get_workflow():
    global _compiled_workflow
    if _compiled_workflow is None:
        _compiled_workflow = build_policypilot_workflow()
    return _compiled_workflow
