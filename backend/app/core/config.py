"""
Application configuration using pydantic-settings.
Loads from environment variables and .env file.
"""

from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Application
    APP_NAME: str = "Rahal API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    SECRET_KEY: str = "change-me-in-production-minimum-32-characters"

    # Server
    BACKEND_HOST: str = "0.0.0.0"
    BACKEND_PORT: int = 8000

    # Database (Direct PostgreSQL connection)
    DATABASE_URL: str = "postgresql://postgres:postgres@127.0.0.1:54322/postgres"
    DATABASE_URL_ASYNC: str = "postgresql+asyncpg://postgres:postgres@127.0.0.1:54322/postgres"

    # Supabase (Auth only - FastAPI connects directly to DB, not via PostgREST)
    SUPABASE_URL: str = "http://127.0.0.1:54321"
    SUPABASE_ANON_KEY: str = ""  # For client-side API calls
    SUPABASE_SERVICE_ROLE_KEY: str = ""  # For server-side admin operations
    SUPABASE_JWT_SECRET: str = "super-secret-jwt-token-with-at-least-32-characters-long"  # For JWT verification
    ADMIN_USER_IDS: str = ""

    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"

    # Redis (optional)
    REDIS_URL: str | None = None

    # Strapi CMS (optional)
    STRAPI_URL: str | None = None
    STRAPI_API_TOKEN: str | None = None

    @property
    def allowed_origins_list(self) -> list[str]:
        """Parse allowed origins from comma-separated string."""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]

    @property
    def admin_user_ids_list(self) -> list[str]:
        """Parse admin UUID allowlist from comma-separated string."""
        if not self.ADMIN_USER_IDS.strip():
            return []
        return [user_id.strip() for user_id in self.ADMIN_USER_IDS.split(",") if user_id.strip()]


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


settings = get_settings()
