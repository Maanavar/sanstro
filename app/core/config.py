from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Jothidam.AI API"
    app_version: str = "0.1.0"
    environment: str = "development"
    debug: bool = False
    host: str = "127.0.0.1"
    port: int = 8000
    api_v1_prefix: str = "/api/v1"
    database_url: str = Field(default="sqlite:///./jothidam_ai.db")

    # Auth
    jwt_secret: str = Field(default="CHANGE_ME_IN_PRODUCTION_USE_STRONG_SECRET")
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24 * 7  # 7 days
    admin_api_key: str = Field(default="CHANGE_ME_ADMIN_KEY")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
        env_prefix="JOTHIDAM_",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
