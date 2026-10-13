from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel

from ..ai.provider_health import check_gemini_provider_health
from ..core.config import settings
from ..db.session import check_db_health

router = APIRouter(tags=["Health & Status"])


class HealthResponse(BaseModel):
    status: str
    version: str
    environment: str
    demo_mode: bool
    database: str
    pgvector: str
    llm_status: str
    llm_model: str
    embedding_model: str
    embedding_dim: int
    retrieval_mode: str
    message: Optional[str] = None


@router.get("/health", response_model=HealthResponse)
async def get_health() -> HealthResponse:
    """System health and dependency readiness probe."""
    db_connected, vector_available, msg = await check_db_health()
    gemini_status, is_gemini_live = await check_gemini_provider_health()

    return HealthResponse(
        status="healthy",
        version=settings.app_version,
        environment=settings.environment,
        demo_mode=settings.demo_mode,
        database="connected" if db_connected else "disconnected",
        pgvector="available" if vector_available else "unavailable",
        llm_status=gemini_status,
        llm_model=settings.llm_model,
        embedding_model=settings.embedding_model,
        embedding_dim=settings.embedding_dim,
        retrieval_mode="hybrid_vector" if (vector_available and is_gemini_live) else "lexical",
        message=msg if not db_connected else None,
    )
