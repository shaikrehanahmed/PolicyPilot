import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from ..demo.repository import get_demo_repo
from ..rules.evaluator import evaluate_scheme_eligibility
from ..schemas.eligibility import EligibilityOut
from ..schemas.source import EvidenceChunkOut, SourceOut

logger = logging.getLogger("policypilot.api.eligibility")
router = APIRouter(prefix="/eligibility", tags=["Eligibility"])


class EvaluateSchemeRequest(BaseModel):
    scheme_id: str = Field(description="Scheme UUID or slug (e.g. 'pm-kisan', 'b1000000-0000-0000-0000-000000000001')")
    profile: Dict[str, Any] = Field(description="Citizen demographic profile values")


class BatchEvaluateRequest(BaseModel):
    profile: Dict[str, Any] = Field(description="Citizen demographic profile values")
    scheme_ids: Optional[List[str]] = Field(default=None, description="Optional list of specific scheme IDs/slugs")


@router.post("/evaluate", response_model=EligibilityOut)
async def evaluate_scheme(payload: EvaluateSchemeRequest) -> EligibilityOut:
    """Evaluates scheme eligibility criterion-by-criterion using the deterministic Python engine.
    GUARANTEES:
    - Status is explicitly ELIGIBLE, PARTIALLY_ELIGIBLE, or NOT_ELIGIBLE.
    - Zero LLM output dictates eligibility status.
    - Missing required data results in INCOMPLETE / PARTIALLY_ELIGIBLE status with missing fields identified.
    """
    repo = get_demo_repo()
    scheme = repo.get_scheme(payload.scheme_id)
    if not scheme:
        raise HTTPException(status_code=404, detail=f"Scheme '{payload.scheme_id}' not found.")

    criteria = repo.get_scheme_criteria(scheme["id"])
    assessment = evaluate_scheme_eligibility(scheme, criteria, payload.profile)

    # Attach evidence chunks from repository to criteria
    evidence_chunks = repo.search_evidence(query=scheme["name"], scheme_id=scheme["id"], top_k=3)
    if evidence_chunks and assessment.criteria_results:
        for crit in assessment.criteria_results:
            crit.evidence = [
                EvidenceChunkOut(
                    chunk_id=e["id"],
                    source_id=e["source_id"],
                    source_title=e.get("source_title", ""),
                    source_url=e.get("source_url", ""),
                    source_tier=int(e.get("source_tier", 1)),
                    quote=e["quote"],
                    page_ref=e.get("page_ref"),
                    section_ref=e.get("section_ref"),
                )
                for e in evidence_chunks[:1]
            ]

    # Convert source dict to SourceOut if available
    sources: List[SourceOut] = []
    source_dict = scheme.get("source")
    if source_dict:
        try:
            sources.append(SourceOut.model_validate(source_dict))
        except Exception:
            pass

    return EligibilityOut(
        scheme_id=str(scheme["id"]),
        scheme_name=scheme["name"],
        status=assessment.overall_status,
        completeness=assessment.completeness,
        criteria=assessment.criteria_results,
        why_this_scheme=f"Central or State initiative under {scheme.get('department', 'Government of India')}",
        why_this_result=assessment.why_this_result,
        missing_information=assessment.missing_profile_fields,
        sources=sources,
        disclaimer="Deterministic eligibility assessment based on official Gazetted criteria. Does not constitute government approval.",
    )


@router.post("/evaluate-batch", response_model=List[EligibilityOut])
async def evaluate_batch(payload: BatchEvaluateRequest) -> List[EligibilityOut]:
    """Evaluates multiple schemes against the provided citizen profile in one call."""
    repo = get_demo_repo()
    all_schemes = repo.list_schemes(active_only=True)

    if payload.scheme_ids:
        target_ids = set(payload.scheme_ids)
        target_schemes = [s for s in all_schemes if s["id"] in target_ids or s["slug"] in target_ids]
    else:
        target_schemes = all_schemes

    results: List[EligibilityOut] = []
    for s in target_schemes:
        criteria = repo.get_scheme_criteria(s["id"])
        assessment = evaluate_scheme_eligibility(s, criteria, payload.profile)

        sources: List[SourceOut] = []
        source_dict = s.get("source")
        if source_dict:
            try:
                sources.append(SourceOut.model_validate(source_dict))
            except Exception:
                pass

        results.append(
            EligibilityOut(
                scheme_id=str(s["id"]),
                scheme_name=s["name"],
                status=assessment.overall_status,
                completeness=assessment.completeness,
                criteria=assessment.criteria_results,
                why_this_scheme=f"Scheme under {s.get('department', 'Government of India')}",
                why_this_result=assessment.why_this_result,
                missing_information=assessment.missing_profile_fields,
                sources=sources,
            )
        )
    return results
