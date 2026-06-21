import logging
import os
import secrets
from functools import lru_cache

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_logger = logging.getLogger(__name__)


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
    # Rate-limit / cache backends. "memory" keeps per-process state (exact on a
    # single worker, ~N x limit across N workers); "redis" shares state across
    # workers/boxes. Default memory so a single-box dev/prod deploy is unchanged;
    # set "redis" + JOTHIDAM_REDIS_URL when running more than one worker. See
    # REFACTOR_PLAN 3.1/3.4.
    rate_limit_backend: str = "memory"
    cache_backend: str = "memory"
    redis_url: str | None = Field(default=None)
    # When true (single-box default), the API process also runs the APScheduler
    # cron jobs (behind the advisory leader lock). Set false in a scaled deploy
    # where a dedicated `app.worker` process owns scheduling. See REFACTOR_PLAN 3.3.
    run_scheduler_in_web: bool = True
    # Number of trusted reverse-proxy hops in front of the app. When > 0 the rate
    # limiter resolves the real client IP from the right-most-but-N entry of
    # X-Forwarded-For instead of the immediate peer. Leave 0 when there is no proxy.
    trusted_proxy_count: int = 0

    # CORS — comma-separated list of allowed origins (e.g. "https://app.vinaadi.ai").
    # Empty disables CORS middleware (fine for server-to-server Next proxy).
    cors_allow_origins: str = Field(default="")

    # Auth
    jwt_secret: str | None = Field(default=None)
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24  # 1 day
    admin_api_key: str | None = Field(default=None)
    # Comma-separated list of emails granted admin access via their session, so the
    # browser never has to hold the admin key. Bootstraps the server-side admin role.
    admin_emails: str = Field(default="")
    enable_admin_data_delete: bool = Field(default=False)
    frontend_url: str = Field(default="http://localhost:3000")
    cookie_secure: bool = Field(default=False)
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

    # RevenueCat webhook — shared secret set in RevenueCat dashboard → Platform Settings → Webhooks.
    # If unset, POST /webhooks/revenuecat returns 503.
    revenuecat_webhook_secret: str | None = Field(default=None)

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
        env_prefix="JOTHIDAM_",
    )

    @property
    def admin_email_set(self) -> set[str]:
        """Normalised set of bootstrap admin emails (lower-cased, trimmed)."""
        return {e.strip().lower() for e in self.admin_emails.split(",") if e.strip()}

    @model_validator(mode="after")
    def _require_strong_secrets_in_production(self) -> "Settings":
        app_env = os.getenv("APP_ENV", self.environment).strip().lower()
        real_user_envs = {"production", "staging"}

        missing: list[str] = []
        if not self.jwt_secret:
            missing.append("JOTHIDAM_JWT_SECRET")
        if not self.admin_api_key:
            missing.append("JOTHIDAM_ADMIN_API_KEY")

        if app_env not in real_user_envs:
            if not self.jwt_secret:
                self.jwt_secret = secrets.token_urlsafe(48)
                _logger.warning("ephemeral dev secret - JWT tokens won't survive restart")
            if not self.admin_api_key:
                self.admin_api_key = secrets.token_urlsafe(48)
                _logger.warning("ephemeral dev secret - admin API key won't survive restart")
            return self

        # Birth data is encrypted at rest with this key. Without it the app boots
        # fine and only 500s the first time it touches encrypted data — fail now.
        if not self.encryption_key.strip():
            missing.append("JOTHIDAM_ENCRYPTION_KEY")
        if missing:
            raise ValueError(f"Production requires these secrets to be set: {', '.join(missing)}")

        insecure: list[str] = []
        if not self.cookie_secure:
            insecure.append("JOTHIDAM_COOKIE_SECURE must be true (JWT cookie over HTTPS only)")
        if self.debug:
            insecure.append("JOTHIDAM_DEBUG must be false in production")
        if insecure:
            raise ValueError("Insecure production configuration: " + "; ".join(insecure))
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
