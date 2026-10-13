from pathlib import Path
from typing import Any, List

from dotenv import load_dotenv
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_BASE_DIR = Path(__file__).resolve().parent.parent.parent  # services/api
_ROOT_DIR = _BASE_DIR.parent  # repository root

# Ensure .env is loaded into process environment regardless of CWD
load_dotenv(_BASE_DIR / ".env")
load_dotenv(_ROOT_DIR / ".env")


class Settings(BaseSettings):
    app_name: str = "PolicyPilot API"
    app_version: str = "0.1.0"
    environment: str = "local"
    debug: bool = True

    # Database
    database_url: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/policypilot",
        description="Async PostgreSQL connection URL",
    )

    # Security & Encryption
    app_secret_key: str = Field(
        default="policypilot-default-development-key-32b!",
        description="32-byte secret key for profile encryption and token signing",
    )
    cors_origins: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "https://policy-pilot-pi.vercel.app",
    ]

    @field_validator("cors_origins", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Any) -> List[str]:
        if isinstance(v, str):
            if v.startswith("["):
                import json
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    # AI & Embedding Providers (Updated to current active non-deprecated models)
    llm_provider: str = "gemini"
    llm_model: str = "gemini-3.8-flash"
    embedding_model: str = "gemini-embedding-2"
    embedding_dim: int = 768  # Native flexible dimension supported by gemini-embedding-2

    google_api_key: str | None = None
    gemini_api_key: str | None = None
    anthropic_api_key: str | None = None

    @property
    def effective_gemini_api_key(self) -> str | None:
        import os
        return self.gemini_api_key or self.google_api_key or os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")

    # Demo & Rate Limiting
    demo_mode: bool = True
    rate_limit_per_minute: int = 60

    model_config = SettingsConfigDict(
        env_file=(_BASE_DIR / ".env", _ROOT_DIR / ".env", ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
