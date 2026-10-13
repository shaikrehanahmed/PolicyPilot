import logging
from typing import Any, List, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from ..demo.repository import get_demo_repo

logger = logging.getLogger("policypilot.api.sources")
router = APIRouter(prefix="/sources", tags=["Sources & Evidence"])


class SourceDetail(BaseModel):
    id: str
    url: str
    title: str
    publisher: str
    source_tier: int
    doc_type: str
    verification_status: str
    last_verified_at: Optional[Any] = None
    content_hash: Optional[str] = None


class EvidenceChunkItem(BaseModel):
    id: str
    source_id: str
    source_title: str
    source_url: str
    source_tier: int
    quote: str
    page_ref: Optional[str] = None
    section_ref: Optional[str] = None
    last_verified_at: Optional[Any] = None
    verification_status: str


class SourcesStatusSummary(BaseModel):
    total_sources: int
    verified_sources: int
    tier_1_sources: int
    unverified_examples: int
    demo_mode: bool
    retrieval_mode: str
    sources: List[SourceDetail]


@router.get("", response_model=List[SourceDetail])
async def list_sources() -> List[SourceDetail]:
    """Lists all official government sources backing PolicyPilot criteria."""
    repo = get_demo_repo()
    raw_sources = repo.list_sources()
    return [
        SourceDetail(
            id=str(s.get("id")),
            url=s.get("url", ""),
            title=s.get("title", ""),
            publisher=s.get("publisher", ""),
            source_tier=s.get("source_tier", 1),
            doc_type=s.get("doc_type", "guideline"),
            verification_status=s.get("verification_status", "VERIFIED"),
            last_verified_at=s.get("last_verified_at"),
            content_hash=s.get("content_hash"),
        )
        for s in raw_sources
    ]


@router.get("/status", response_model=SourcesStatusSummary)
async def get_sources_status() -> SourcesStatusSummary:
    """Summary of official sources, trust tiers, and current retrieval mode."""
    repo = get_demo_repo()
    raw_sources = repo.list_sources()

    verified_count = sum(1 for s in raw_sources if s.get("verification_status") == "VERIFIED")
    tier_1_count = sum(1 for s in raw_sources if s.get("source_tier") == 1)

    source_details = [
        SourceDetail(
            id=str(s.get("id")),
            url=s.get("url", ""),
            title=s.get("title", ""),
            publisher=s.get("publisher", ""),
            source_tier=s.get("source_tier", 1),
            doc_type=s.get("doc_type", "guideline"),
            verification_status=s.get("verification_status", "VERIFIED"),
            last_verified_at=s.get("last_verified_at"),
            content_hash=s.get("content_hash"),
        )
        for s in raw_sources
    ]

    return SourcesStatusSummary(
        total_sources=len(raw_sources),
        verified_sources=verified_count,
        tier_1_sources=tier_1_count,
        unverified_examples=len(raw_sources) - verified_count,
        demo_mode=True,
        retrieval_mode="honest_lexical_fallback",
        sources=source_details,
    )


@router.get("/evidence", response_model=List[EvidenceChunkItem])
async def search_evidence(
    q: str = Query(..., description="Search query or keyword in guidelines"),
    scheme_id: Optional[str] = Query(None, description="Optional scheme ID or slug filter"),
    top_k: int = Query(5, ge=1, le=20, description="Max results to return"),
) -> List[EvidenceChunkItem]:
    """Searches official evidence text chunks.
    Uses lexical matching in demo mode with exact citations.
    """
    repo = get_demo_repo()
    results = repo.search_evidence(query=q, scheme_id=scheme_id, top_k=top_k)
    return [EvidenceChunkItem(**r) for r in results]


@router.get("/{source_id}", response_model=SourceDetail)
async def get_source(source_id: str) -> SourceDetail:
    """Retrieves metadata for a specific official source document."""
    repo = get_demo_repo()
    s = repo.get_source(source_id)
    if not s:
        raise HTTPException(status_code=404, detail=f"Source '{source_id}' not found.")
    return SourceDetail(
        id=str(s.get("id")),
        url=s.get("url", ""),
        title=s.get("title", ""),
        publisher=s.get("publisher", ""),
        source_tier=s.get("source_tier", 1),
        doc_type=s.get("doc_type", "guideline"),
        verification_status=s.get("verification_status", "VERIFIED"),
        last_verified_at=s.get("last_verified_at"),
        content_hash=s.get("content_hash"),
    )
