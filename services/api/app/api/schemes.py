import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from ..demo.repository import get_demo_repo

logger = logging.getLogger("policypilot.api.schemes")
router = APIRouter(prefix="/schemes", tags=["Schemes"])


class SchemeListItem(BaseModel):
    id: str
    slug: str
    name: str
    category: str
    level: str
    state: Optional[str] = None
    department: Optional[str] = None
    description: str
    active: bool
    source_title: Optional[str] = None
    source_url: Optional[str] = None
    verification_status: str = "VERIFIED"
    criteria_count: int = 0
    documents_count: int = 0


class SchemeDetail(BaseModel):
    id: str
    slug: str
    name: str
    category: str
    level: str
    state: Optional[str] = None
    department: Optional[str] = None
    description: str
    active: bool
    criteria: List[Dict[str, Any]] = Field(default_factory=list)
    documents: List[Dict[str, Any]] = Field(default_factory=list)
    evidence_chunks: List[Dict[str, Any]] = Field(default_factory=list)
    source: Optional[Dict[str, Any]] = None


class DiscoverRequest(BaseModel):
    profile: Dict[str, Any] = Field(description="Citizen profile demographic attributes")
    goal: Optional[str] = Field(default=None, description="Optional citizen search goal or assistance need")


class DiscoverResultItem(BaseModel):
    id: str
    slug: str
    name: str
    category: str
    level: str
    state: Optional[str] = None
    department: Optional[str] = None
    description: str
    active: bool
    relevance_score: int
    relevance_rationale: str
    retrieval_mode: str
    source: Optional[Dict[str, Any]] = None
    verification_status: str = "VERIFIED"
    criteria_count: int = 0
    documents_count: int = 0


@router.get("", response_model=List[SchemeListItem])
async def list_schemes(
    category: Optional[str] = Query(None, description="Filter by category (e.g. agriculture, healthcare, housing, education)"),
    level: Optional[str] = Query(None, description="Filter by level (CENTRAL or STATE)"),
    state: Optional[str] = Query(None, description="Filter by 2-letter state code (e.g. TS)"),
    search: Optional[str] = Query(None, description="Free text keyword search over scheme name/description"),
) -> List[SchemeListItem]:
    """Lists available schemes with optional category, level, state, and keyword filtering."""
    repo = get_demo_repo()
    raw_schemes = repo.list_schemes(category=category, level=level, state=state, active_only=True)

    results = []
    search_lower = search.lower().strip() if search else None

    for s in raw_schemes:
        if search_lower:
            text_corpus = f"{s.get('name', '')} {s.get('description', '')} {s.get('category', '')}".lower()
            if search_lower not in text_corpus:
                continue

        source = s.get("source", {})
        results.append(
            SchemeListItem(
                id=str(s.get("id")),
                slug=s.get("slug", ""),
                name=s.get("name", ""),
                category=s.get("category", ""),
                level=str(s.get("level", "CENTRAL")),
                state=s.get("state"),
                department=s.get("department"),
                description=s.get("description", ""),
                active=s.get("active", True),
                source_title=source.get("title"),
                source_url=source.get("url"),
                verification_status=source.get("verification_status", "VERIFIED"),
                criteria_count=len(s.get("criteria", [])),
                documents_count=len(s.get("documents", [])),
            )
        )
    return results


@router.get("/{id_or_slug}", response_model=SchemeDetail)
async def get_scheme(id_or_slug: str) -> SchemeDetail:
    """Retrieves full scheme details including official criteria, required documents, and verified evidence."""
    repo = get_demo_repo()
    scheme = repo.get_scheme(id_or_slug)
    if not scheme:
        raise HTTPException(status_code=404, detail=f"Scheme '{id_or_slug}' not found.")

    return SchemeDetail(
        id=str(scheme.get("id")),
        slug=scheme.get("slug", ""),
        name=scheme.get("name", ""),
        category=scheme.get("category", ""),
        level=str(scheme.get("level", "CENTRAL")),
        state=scheme.get("state"),
        department=scheme.get("department"),
        description=scheme.get("description", ""),
        active=scheme.get("active", True),
        criteria=scheme.get("criteria", []),
        documents=scheme.get("documents", []),
        evidence_chunks=scheme.get("evidence_chunks", []),
        source=scheme.get("source"),
    )


@router.post("/discover", response_model=List[DiscoverResultItem])
async def discover_schemes(payload: DiscoverRequest) -> List[DiscoverResultItem]:
    """Matches potentially relevant schemes to the citizen's profile and goal.
    Uses category and demographic rule alignment in demo mode (clearly labelled).
    """
    repo = get_demo_repo()
    discovered = repo.discover_schemes(payload.profile, goal=payload.goal)

    results = []
    for d in discovered:
        results.append(
            DiscoverResultItem(
                id=str(d.get("id")),
                slug=d.get("slug", ""),
                name=d.get("name", ""),
                category=d.get("category", ""),
                level=str(d.get("level", "CENTRAL")),
                state=d.get("state"),
                department=d.get("department"),
                description=d.get("description", ""),
                active=d.get("active", True),
                relevance_score=d.get("relevance_score", 0),
                relevance_rationale=d.get("relevance_rationale", ""),
                retrieval_mode=d.get("retrieval_mode", "lexical_category_match"),
                source=d.get("source"),
                verification_status=(
                    d.get("source", {}).get("verification_status", "VERIFIED")
                    if isinstance(d.get("source"), dict)
                    else "VERIFIED"
                ),
                criteria_count=len(d.get("criteria", [])),
                documents_count=len(d.get("documents", [])),
            )
        )
    return results
