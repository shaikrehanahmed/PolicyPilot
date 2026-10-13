import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter
from pydantic import BaseModel, Field

from ..ai.workflow import get_workflow

logger = logging.getLogger("policypilot.api.workflow")
router = APIRouter(prefix="/workflow", tags=["Agentic Workflow"])


class WorkflowRunRequest(BaseModel):
    profile: Dict[str, Any] = Field(description="Raw citizen profile demographics")
    goal: Optional[str] = Field(default=None, description="Optional citizen search goal or assistance query")
    selected_scheme_slug: Optional[str] = Field(default=None, description="Optional target scheme slug or ID")


class WorkflowStepLog(BaseModel):
    step_name: str
    detail: str
    status: str
    timestamp: str


class WorkflowRunResponse(BaseModel):
    status: str
    steps_log: List[WorkflowStepLog]
    normalized_profile: Dict[str, Any]
    discovered_schemes: List[Dict[str, Any]]
    evaluations: List[Dict[str, Any]]
    missing_fields: List[str]
    evidence_chunks: List[Dict[str, Any]]
    action_plan: Optional[Dict[str, Any]] = None
    explanation: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


@router.post("/run", response_model=WorkflowRunResponse)
async def run_workflow(payload: WorkflowRunRequest) -> WorkflowRunResponse:
    """Executes the full PolicyPilot LangGraph agentic workflow:
    1. NORMALIZING PROFILE
    2. DISCOVERING SCHEMES
    3. EVALUATING RULES (Deterministic Python engine, zero LLM)
    4. CHECKING DOCUMENTS & DEADLINES
    5. VERIFYING SOURCES (Lexical/Gazette evidence retrieval)
    6. PREPARING ACTION PLAN (Step roadmap + Grounded explanation)
    """
    workflow = get_workflow()

    initial_state: Dict[str, Any] = {
        "raw_profile": payload.profile,
        "goal": payload.goal,
        "selected_scheme_slug": payload.selected_scheme_slug,
        "steps_log": [],
    }

    try:
        final_state = await workflow.ainvoke(initial_state)

        steps = [
            WorkflowStepLog(
                step_name=s.get("step_name", ""),
                detail=s.get("detail", ""),
                status=s.get("status", "COMPLETED"),
                timestamp=s.get("timestamp", ""),
            )
            for s in final_state.get("steps_log", [])
        ]

        return WorkflowRunResponse(
            status="SUCCESS",
            steps_log=steps,
            normalized_profile=final_state.get("normalized_profile", {}),
            discovered_schemes=final_state.get("discovered_schemes", []),
            evaluations=final_state.get("evaluations", []),
            missing_fields=final_state.get("missing_fields", []),
            evidence_chunks=final_state.get("evidence_chunks", []),
            action_plan=final_state.get("action_plan"),
            explanation=final_state.get("explanation"),
        )
    except Exception as e:
        logger.error(f"Workflow execution failed: {e}", exc_info=True)
        return WorkflowRunResponse(
            status="ERROR",
            steps_log=[],
            normalized_profile={},
            discovered_schemes=[],
            evaluations=[],
            missing_fields=[],
            evidence_chunks=[],
            error=str(e),
        )
