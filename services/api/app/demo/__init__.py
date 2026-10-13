"""Demo mode in-memory repository.

Provides a fully functional, database-free backend when DATABASE_URL is not
connected or when DEMO_MODE=true. Uses the same scheme/criteria data as the
YAML seed file but keeps it in Python structures — no pgvector, no asyncpg.
"""
from .repository import DemoRepository, get_demo_repo

__all__ = ["DemoRepository", "get_demo_repo"]
