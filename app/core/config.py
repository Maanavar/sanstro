import logging
import os
import secrets
from functools import lru_cache
from pathlib import Path

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_logger = logging.getLogger(__name__)

_ENV_PREFIX = "JOTHIDAM_"

# Process roles. Only "api" serves HTTP, so only "api" needs the secrets that
# exist to authenticate a request. See _require_strong_secrets_in_production.
_ROLE_API = "api"
_ROLE_WORKER = "worker"
_ROLES = (_ROLE_API, _ROLE_WORKER)


def _config_error(message: str) -> RuntimeError:
    """Raise a configuration failure WITHOUT pydantic echoing the input.

    Not a stylistic choice. Pydantic converts ValueError and AssertionError
    raised inside a validator into a ValidationError, and that carries
    ``input_value=`` — the whole settings dict. So a validator that raised
    ValueError printed every secret it had been given, into the boot log, at
    precisely the moment it fires: a misconfigured production start. Verified
    against pydantic 2.13; `test_production_secret_error_does_not_echo_the_values`
    pins it.

    Any exception that is not ValueError/AssertionError propagates untouched.
    """
    return RuntimeError(message)


_WEB_HOPS_ENV = "TRUSTED_PROXY_HOPS_BEFORE_WEB"


def _check_proxy_hops_agree(api_count: int, enforce: bool) -> None:
    """Cross-check ``JOTHIDAM_TRUSTED_PROXY_COUNT`` against the web tier's twin.

    The two describe the same deployment from opposite ends and were coupled by
    comments alone. Get them out of step and one of two things happens, neither
    visible in a log line: the API reads an ``X-Forwarded-For`` entry no trusted
    hop wrote (a caller names any address it likes and walks around every
    IP-keyed rate limit), or it ignores the only entry that *was* written and
    attributes every anonymous request to one address.

    **The rule is equality**, and the docs used to say otherwise — they claimed
    the API's count stays 1 behind a CDN because "Next forwards exactly one
    entry". Next does not. ``trustedForwardedFor`` in
    ``web/app/api/backend/[...path]/route.ts`` forwards the rightmost
    ``TRUSTED_PROXY_HOPS_BEFORE_WEB`` entries — ``hops.slice(-N)``, pinned by
    "keeps two hops when two are declared" in ``proxy-forwarding.test.ts``. So
    at web=2/api=1 the API steps back one entry from the right and reads the
    CDN's own address for every request, which is the shared-bucket failure the
    setting exists to prevent.

    The variable carries no ``JOTHIDAM_`` prefix on purpose: it belongs to the
    Next process, and one value has to serve both. Read from the environment
    rather than declared as a field for the same reason — it is not this
    process's configuration, it is a claim about a sibling's. ``APP_ENV`` is
    read the same way a few lines below.

    Unset means the check cannot run: a hand-rolled deployment that never passed
    it to this container is not thereby misconfigured. Say so once, in the
    environments where it matters, rather than failing or staying silent.
    """
    raw = os.getenv(_WEB_HOPS_ENV)
    if raw is None or not raw.strip():
        if enforce:
            _logger.warning(
                "%s is not set for this process, so the proxy-hop cross-check is "
                "inactive. It must equal JOTHIDAM_TRUSTED_PROXY_COUNT (%d).",
                _WEB_HOPS_ENV,
                api_count,
            )
        return

    try:
        web_hops = int(raw.strip())
    except ValueError:
        raise _config_error(f"{_WEB_HOPS_ENV} must be an integer; got {raw.strip()!r}") from None

    if web_hops == api_count:
        return

    message = (
        f"Proxy-hop counts disagree: {_WEB_HOPS_ENV}={web_hops} but "
        f"JOTHIDAM_TRUSTED_PROXY_COUNT={api_count}. They must be equal — the Next "
        f"proxy forwards the rightmost {_WEB_HOPS_ENV} entries of X-Forwarded-For, "
        "so the API must step back exactly that many to reach the address the "
        "outermost trusted hop observed. Set both to 0 with no edge, 1 for the "
        "`edge` profile, 2 for an edge behind a CDN. See docs/PRODUCTION_EDGE.md."
    )
    if enforce:
        raise _config_error(message)
    _logger.warning(message)


class Settings(BaseSettings):
    app_name: str = "Vinaadi AI API"
    app_version: str = "0.1.0"
    environment: str = "development"
    # Which process this is. "api" serves HTTP and needs every auth secret;
    # "worker" runs only the scheduler (app/worker.py) and needs none of them.
    #
    # Defaults to "api" deliberately. An unset or misspelled role must demand
    # MORE secrets rather than fewer — the failure mode of guessing "worker" is
    # an HTTP process booting in production with no JWT secret, which the
    # validator below exists to prevent.
    process_role: str = _ROLE_API
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
    #
    # Must EQUAL the web tier's TRUSTED_PROXY_HOPS_BEFORE_WEB — not "one less",
    # whatever the older docs said. _check_proxy_hops_agree enforces it at boot
    # and explains why.
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

    @model_validator(mode="before")
    @classmethod
    def _load_file_backed_secrets(cls, values):
        """Fill any field from ``JOTHIDAM_<FIELD>_FILE`` when that path is set.

        A secret delivered as a file — a Docker/Compose secret at
        ``/run/secrets/<name>``, a mounted Kubernetes secret — should be *read*
        as a file. Re-exporting it into the environment first (the obvious
        entrypoint shim) puts it straight back into ``/proc/<pid>/environ`` and
        into ``docker inspect``, discarding the containment that mounting it
        bought. See docs/SEC1_SECRET_CUSTODY_RULING.md §6.

        This lives here rather than in a free-standing ``get_secret()`` helper
        because a helper nothing calls does not reach ``settings.encryption_key``
        — every consumer reads the settings object, so the file has to be
        resolved as the object is built.
        """
        if not isinstance(values, dict):
            return values

        # Only the model's own fields. An arbitrary FOO_FILE in the environment
        # is not ours to interpret.
        for name in cls.model_fields:
            env_var = f"{_ENV_PREFIX}{name}_FILE".upper()
            path_value = os.getenv(env_var)
            if not path_value or not path_value.strip():
                continue
            path = Path(path_value.strip())
            try:
                # Trailing newline: files written by an editor or `echo` almost
                # always have one, and a Fernet key with "\n" on the end is not
                # a Fernet key. Strip whitespace at both ends, nothing else.
                file_value = path.read_text(encoding="utf-8").strip()
            except OSError as exc:
                # Name the variable and the path, never speculate about content.
                raise _config_error(f"{env_var} points at {path}, which could not be read: {exc}") from exc
            if not file_value:
                # A zero-byte secret file is a mount that did not work. Booting
                # with an empty secret defers the failure to first use, which for
                # the encryption key means writing data under a key nobody has.
                raise _config_error(f"{env_var} points at {path}, which is empty.")

            existing = values.get(name)
            if existing not in (None, "") and str(existing).strip() != file_value:
                # Two different values for one secret, and no rule anyone would
                # guess about which wins. For the encryption key, picking wrong
                # writes rows under a key the operator does not think is live.
                # Identical values are allowed — that happens mid-migration.
                raise _config_error(
                    f"{env_var} and {_ENV_PREFIX}{name}".upper()
                    + " are both set and disagree. Set one. (Values not shown.)"
                )
            values[name] = file_value
        return values

    @model_validator(mode="after")
    def _require_strong_secrets_in_production(self) -> "Settings":
        app_env = os.getenv("APP_ENV", self.environment).strip().lower()
        real_user_envs = {"production", "staging"}

        role = (self.process_role or "").strip().lower()
        if role not in _ROLES:
            raise _config_error(
                f"JOTHIDAM_PROCESS_ROLE must be one of {', '.join(_ROLES)}; got {self.process_role!r}"
            )
        # Least privilege, per docs/SEC1_SECRET_CUSTODY_RULING.md §5.2: the
        # scheduler process never authenticates a request, so it has no business
        # holding the secrets that do. Requiring them of every process is what
        # made per-service secret grants impossible before.
        serves_http = role == _ROLE_API

        # Before the early return below, so a developer running the edge locally
        # is told rather than silently mis-attributing every anonymous request.
        # Scoped to the HTTP role: the scheduler never resolves a client IP, and
        # its container is not given the web tier's variable.
        if serves_http:
            _check_proxy_hops_agree(
                max(0, int(self.trusted_proxy_count)),
                enforce=app_env in real_user_envs,
            )

        missing: list[str] = []
        if serves_http and not self.jwt_secret:
            missing.append("JOTHIDAM_JWT_SECRET")
        if serves_http and not self.admin_api_key:
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
        #
        # Required of BOTH roles, unlike the auth secrets above: the scheduler
        # reads birth profiles for the morning push, so it decrypts too.
        if not self.encryption_key.strip() and not self.encryption_keys.strip():
            missing.append("JOTHIDAM_ENCRYPTION_KEY")
        if missing:
            raise _config_error(f"Production requires these secrets to be set: {', '.join(missing)}")

        insecure: list[str] = []
        # An HTTP concern, so an HTTP-role concern. Enforcing it on the worker
        # meant the `scaled` compose profile could not boot in production at all:
        # the worker service sets JOTHIDAM_ENVIRONMENT=production and there is no
        # .env in the image, so cookie_secure defaulted false and this raised.
        if serves_http and not self.cookie_secure:
            insecure.append("JOTHIDAM_COOKIE_SECURE must be true (JWT cookie over HTTPS only)")
        if self.debug:
            insecure.append("JOTHIDAM_DEBUG must be false in production")
        if insecure:
            raise _config_error("Insecure production configuration: " + "; ".join(insecure))
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
