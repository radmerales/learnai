from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_DATABASE_URL = f"sqlite:///{REPO_ROOT / 'learnai.db'}"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="LEARN_AI_",
        env_file=REPO_ROOT / ".env",
        extra="ignore",
    )

    database_url: str = DEFAULT_DATABASE_URL
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
