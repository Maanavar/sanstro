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
    # Whether GET /health/ready reports not-ready when Redis is unreachable.
    # None (the default) derives it: required only when the rate limiter uses
    # Redis, because that fallback loosens a security control rather than merely
    # cooling a cache. See app.api.health._cache_is_required for the full reason
    # and for why an explicit override is worth having.
    readiness_require_cache: bool | None = Field(default=None)
    # Bounds on every Redis call, not just the readiness probe. redis-py defaults
    # both to None — an unbounded wait — and Redis sits in the request path of the
    # rate limiter, so a Redis that accepts connections and then stops answering
    # would hang requests rather than fall back. Seconds.
    redis_socket_timeout_seconds: float = Field(default=2.0)
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
    # Minutes an admin elevation token stays valid. Being admin is not enough to
    # run a destructive operation: the operator re-enters their password and gets
    # a short-lived, single-user token scoped to those endpoints. Short on
    # purpose — this window is how long a stolen elevation token is useful, and
    # unlike the session it cannot be silently refreshed.
    admin_elevation_minutes: int = Field(default=10)
    frontend_url: str = Field(default="http://localhost:3000")
    cookie_secure: bool = Field(default=False)
    # Single-key form. Still supported and still the right choice for a
    # deployment that has never rotated.
    encryption_key: str = Field(default="")
    # Rotation form: comma-separated Fernet keys, NEWEST FIRST. The first
    # encrypts; all of them decrypt. Takes precedence over encryption_key when
    # set. Removing a key before scripts/rotate_encryption_key.py has finished
    # makes every row still written under it permanently unreadable — see
    # app/core/encryption.py and docs/DATA_PROTECTION.md.
    encryption_keys: str = Field(default="")
    # Days after a journal entry is ARCHIVED (deleted_at set) before it is
    # permanently deleted. 0 = never, which is the default: the right window is a
    # product and legal decision, and the cost of an engineer guessing it is a
    # user's writing being destroyed. See app/services/journal_purge.py and
    # docs/DATA_PROTECTION.md.
    journal_purge_after_days: int = Field(default=0)

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

    # Google SSO — from a Google Cloud Console OAuth 2.0 Client ID (Web application).
    # Leave unset to disable: GET /auth/oauth/providers reports it unavailable and the
    # frontend hides the "Continue with Google" button. Register the authorized redirect
    # URI as "{public backend URL}/api/v1/auth/oauth/google/callback" (through the Next.js
    # proxy in production, e.g. "https://app.vinaadi.ai/api/backend/api/v1/auth/oauth/google/callback").
    google_client_id: str | None = Field(default=None)
    google_client_secret: str | None = Field(default=None)
    # Override only if the callback isn't reachable at {frontend_url}/api/backend/api/v1/auth/oauth/google/callback.
    google_oauth_redirect_uri: str | None = Field(default=None)

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
        # Either form satisfies this. A production deployment mid-rotation sets
        # only JOTHIDAM_ENCRYPTION_KEYS, and refusing to boot on that would make
        # rotating the key an outage.
        if not self.encryption_key.strip() and not self.encryption_keys.strip():
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
