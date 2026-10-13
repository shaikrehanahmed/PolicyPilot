from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


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
    ]

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
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
