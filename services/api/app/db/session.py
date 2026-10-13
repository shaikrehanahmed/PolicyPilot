from typing import AsyncGenerator, Tuple

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base

from ..core.config import settings

Base = declarative_base()

# Async PostgreSQL Engine
# Note: uses asyncpg driver. Connection pool pre-configured for stability.
engine = create_async_engine(
    settings.database_url,
    echo=False,
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for injecting database sessions into FastAPI routes."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def check_db_health() -> Tuple[bool, bool, str]:
    """Probes the database connection and pgvector extension availability.

    Returns:
        Tuple[db_connected: bool, vector_available: bool, message: str]
    """
    try:
        async with engine.connect() as conn:
            # 1. Test basic connectivity
            await conn.execute(text("SELECT 1;"))

            # 2. Test pgvector extension availability
            vec_res = await conn.execute(
                text("SELECT 1 FROM pg_extension WHERE extname = 'vector';")
            )
            has_vector = vec_res.scalar() is not None

            return True, has_vector, "Database reachable"
    except Exception as e:
        return False, False, f"Database unreachable: {type(e).__name__}: {str(e)}"
