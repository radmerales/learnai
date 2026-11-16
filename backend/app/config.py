"""Application settings loaded from environment variables or a .env file.

If you know Python's `os.getenv`, this is the typed version. Pydantic Settings
reads variables such as `LEARN_AI_DATABASE_URL` and converts them into typed
attributes. The web-specific idea is that deployment configuration (database
location, allowed browser origins) belongs in the environment, not in code.
"""

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_DATABASE_URL = f"sqlite:///{REPO_ROOT / 'learnai.db'}"


class Settings(BaseSettings):
    # The prefix means `database_url` is read from LEARN_AI_DATABASE_URL.
    model_config = SettingsConfigDict(
        env_prefix="LEARN_AI_",
        env_file=REPO_ROOT / ".env",
        extra="ignore",
    )

    # SQLite is a single-file database. For local development the default path
    # is <repo>/learnai.db; the dev container overrides it through the env var.
    database_url: str = DEFAULT_DATABASE_URL

    # A browser may only call this API if its origin appears in this list.
    # Vite's /api proxy avoids CORS in development, but direct calls need it.
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    """Parse the environment once and reuse the result for the whole process."""
    return Settings()
