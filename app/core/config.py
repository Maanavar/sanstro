from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Vinaadi AI API"
    app_version: str = "0.1.0"
    environment: str = "development"
    debug: bool = False
    host: str = "127.0.0.1"
    port: int = 8000
    api_v1_prefix: str = "/api/v1"
    database_url: str = Field(...)
    rate_limit_enabled: bool = True
    rate_limit_window_seconds: int = 60
    rate_limit_max_requests: int = 120
    rate_limit_exempt_loopback_in_non_prod: bool = True

    # Auth
    jwt_secret: str = Field(default="CHANGE_ME_IN_PRODUCTION_USE_STRONG_SECRET")
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24  # 1 day
    admin_api_key: str = Field(default="CHANGE_ME_ADMIN_KEY")
    enable_admin_data_delete: bool = Field(default=False)
    encryption_key: str = Field(default="")

    # Email / SMTP — leave unset to disable email delivery (stub mode)
    smtp_host: str | None = Field(default=None)
    smtp_port: int = Field(default=587)
    smtp_user: str | None = Field(default=None)
    smtp_pass: str | None = Field(default=None)
    notification_from_email: str | None = Field(default=None)
    notification_from_name: str = Field(default="Vinaadi AI")

    # FCM push — leave unset to disable push delivery (stub mode)
    # Set JOTHIDAM_FCM_PROJECT_ID and JOTHIDAM_FCM_SERVICE_ACCOUNT_JSON in .env
    fcm_project_id: str | None = Field(default=None)
    fcm_service_account_json: str | None = Field(default=None)

    # Ask Vinaadi — Claude API key. If unset, endpoint returns 503.
    anthropic_api_key: str | None = Field(default=None)
    ask_vinaadi_daily_limit: int = Field(default=10)

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
