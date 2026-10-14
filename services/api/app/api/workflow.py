import hashlib
import json
import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Header
from pydantic import BaseModel, Field

from ..ai.workflow import get_workflow
from ..services.billing_engine import get_billing_store

logger = logging.getLogger("policypilot.api.workflow")
router = APIRouter(prefix="/workflow", tags=["Policy Analysis Workflow"])


class WorkflowRunRequest(BaseModel):
    profile: Dict[str, Any] = Field(description="Raw citizen profile demographics")
    goal: Optional[str] = Field(default=None, description="Optional citizen search goal or assistance query")
    selected_scheme_slug: Optional[str] = Field(default=None, description="Optional target scheme slug or ID")
    simulate_failure: bool = Field(
        default=False,
        description="Test flag: simulates an upstream failure to verify failed runs never consume free quota.",
    )


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
    usage_summary: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


@router.post("/run", response_model=WorkflowRunResponse)
async def run_workflow(
    payload: WorkflowRunRequest,
    x_user_id: Optional[str] = Header(default="demo-default-citizen", alias="X-User-ID"),
    idempotency_key: Optional[str] = Header(default=None, alias="Idempotency-Key"),
) -> WorkflowRunResponse:
    """Executes the full PolicyPilot Policy Analysis workflow.

    Enforces Part D1:
    - Checks server-side entitlement (2 free successful analyses per user) before execution.
    - Deduplicates retries via Idempotency-Key.
    - Increments usage counter ONLY after the workflow completes with status == 'SUCCESS'.
    """
    uid = (x_user_id or "demo-default-citizen").strip()
    billing = get_billing_store()

    # Build deterministic idempotency key if header not explicitly passed
    idem_key = idempotency_key or hashlib.sha256(
        json.dumps(
            {
                "u": uid,
                "p": payload.profile,
                "g": payload.goal,
                "s": payload.selected_scheme_slug,
            },
            sort_keys=True,
        ).encode("utf-8")
    ).hexdigest()[:24]

    # 1. Enforce server-side usage limit (raises 402 Payment Required if 2 free used & no subscription)
    billing.assert_can_run_billable_analysis(uid, idem_key)

    if payload.simulate_failure:
        return WorkflowRunResponse(
            status="ERROR",
            steps_log=[],
            normalized_profile={},
            discovered_schemes=[],
            evaluations=[],
            missing_fields=[],
            evidence_chunks=[],
            error="Simulated analysis failure: Free analysis quota was NOT consumed.",
        )

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

        # 2. Count analysis ONLY after successful completion
        account_summary = billing.record_successful_analysis(uid, idem_key)

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
            usage_summary=account_summary.model_dump(mode="json"),
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
