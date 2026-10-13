import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_health_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "version" in data
        assert "database" in data
        assert "pgvector" in data
        assert data["llm_model"] in ("gemini-2.5-flash", "gemini-2.0-flash")
        assert data["embedding_model"] == "gemini-embedding-2"
        assert data["embedding_dim"] == 768


@pytest.mark.asyncio
async def test_root_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "online"


def test_environment_configuration_resolution(monkeypatch):
    """Verify that ENVIRONMENT variable and RENDER auto-detection resolve accurately."""
    from app.core.config import Settings

    # Case 1: Explicit ENVIRONMENT=production
    s_prod = Settings(ENVIRONMENT="production")
    assert s_prod.environment == "production"

    # Case 2: Explicit ENV=staging
    s_stage = Settings(ENV="staging")
    assert s_stage.environment == "staging"

    # Case 3: RENDER environment auto-detection
    monkeypatch.setenv("RENDER", "true")
    monkeypatch.delenv("ENVIRONMENT", raising=False)
    monkeypatch.delenv("ENV", raising=False)
    s_render = Settings()
    assert s_render.environment == "production"
