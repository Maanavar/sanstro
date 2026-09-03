import logging
import logging.config
import os
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI

from app.api.admin import router as admin_router
from app.api.admin_analytics import router as admin_analytics_router
from app.api.alerts import router as alerts_router
from app.api.annual_wrapped import router as annual_wrapped_router
from app.api.ask_vinaadi import router as ask_vinaadi_router
from app.api.auth import router as auth_router
from app.api.birth_profiles import router as birth_profiles_router
from app.api.charts import router as charts_router
from app.api.content import router as content_router
from app.api.context import router as context_router
from app.api.daily_guidance import router as daily_guidance_router
from app.api.daily_snapshot import router as daily_snapshot_router
from app.api.decisions import router as decisions_router
from app.api.family_vaults import router as family_vaults_router
from app.api.feedback import router as feedback_router
from app.api.geo import router as geo_router
from app.api.goals import router as goals_router
from app.api.health import router as health_router
from app.api.journal import router as journal_router
from app.api.life_areas import router as life_areas_router
from app.api.life_event_log import router as life_event_log_router
from app.api.life_events import router as life_events_router
from app.api.mobile_auth import router as mobile_auth_router
from app.api.muhurta import router as muhurta_router
from app.api.newsletter import router as newsletter_router
from app.api.notification_preferences import router as notification_preferences_router
from app.api.notifications import router as notifications_router
from app.api.numerology import router as numerology_router
from app.api.panchangam import router as panchangam_router
from app.api.places import router as places_router
from app.api.porutham_shares import router as porutham_shares_router
from app.api.prasna import router as prasna_router
from app.api.predictions import router as predictions_router
from app.api.public_tools import router as public_tools_router
from app.api.qa import router as qa_router
from app.api.rectification import router as rectification_router
from app.api.relationships import router as relationships_router
from app.api.remedies import router as remedies_router
from app.api.reports import router as reports_router
from app.api.retrospective import router as retrospective_router
from app.api.settings import router as settings_router
from app.api.share_card import router as share_card_router
from app.api.stats import router as stats_router
from app.api.streak import router as streak_router
from app.api.transits import router as transits_router
from app.api.users import router as users_router
from app.api.webhooks import router as webhooks_router
from app.api.whatif import router as whatif_router
from app.core.auth import require_csrf_header
from app.core.config import get_settings
from app.middleware import (
    MaintenanceModeMiddleware,
    RateLimitMiddleware,
    RequestLoggingMiddleware,
    SecurityHeadersMiddleware,
)
from app.scheduler import register_all_jobs, schedule_all_jobs

try:
    from apscheduler.schedulers.asyncio import AsyncIOScheduler
except ModuleNotFoundError:  # pragma: no cover - optional dependency
    AsyncIOScheduler = None  # type: ignore[assignment]

_LOGGING_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "json": {
            "()": "app.core.json_logging.JsonLogFormatter",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "json",
        },
    },
    "root": {"level": "INFO", "handlers": ["console"]},
}

def _assert_rate_limiter_matches_worker_count() -> None:
    """Refuse to serve a worker pool whose rate limits are silently multiplied.

    The in-memory limiter keeps its counters per process. Run it under
    ``--workers N`` and a documented limit of "5 attempts per minute" becomes up
    to 5N, with which counter a request hits decided by whichever worker
    happened to accept it. Nothing logs, nothing fails, and login throttling and
    the public-endpoint abuse controls are the things quietly weakened.

    The effective backend is what matters, not the setting: ``redis`` falls back
    to memory when Redis is unreachable, so a deploy can be configured correctly
    and still be running multiplied limits.
    """
    from app.core.rate_limit import InMemoryRateLimitBackend, get_rate_limit_backend

    log = logging.getLogger(__name__)
    settings = get_settings()
    if not settings.rate_limit_enabled:
        return

    try:
        workers = int(os.getenv("WEB_CONCURRENCY", "1"))
    except ValueError:
        workers = 1
    if workers <= 1:
        return

    if not isinstance(get_rate_limit_backend(), InMemoryRateLimitBackend):
        return

    message = (
        f"Rate limits are silently up to {workers}x looser than configured: "
        f"WEB_CONCURRENCY={workers} with a per-process in-memory rate limiter. "
        "Set JOTHIDAM_RATE_LIMIT_BACKEND=redis with a reachable "
        "JOTHIDAM_REDIS_URL, or set WEB_CONCURRENCY=1."
    )
    if settings.debug:
        log.warning("rate_limit_worker_mismatch: %s", message)
        return
    # A crash on boot is recoverable and visible. A 2x rate limit is neither.
    raise RuntimeError(message)


def _build_lifespan():
    @asynccontextmanager
    async def lifespan(_app: FastAPI):
        _assert_rate_limiter_matches_worker_count()

        # Register job metadata regardless of who schedules them, so the admin
        # trigger endpoints work even when a dedicated worker owns the scheduler.
        register_all_jobs()

        log = logging.getLogger(__name__)

        # In a scaled deploy a dedicated `app.worker` process owns scheduling and
        # the API only serves requests. Default true keeps single-box behaviour.
        if not get_settings().run_scheduler_in_web:
            log.info("run_scheduler_in_web is false; cron runs in the dedicated worker process.")
            yield
            return

        scheduler = AsyncIOScheduler(timezone="UTC") if AsyncIOScheduler is not None else None
        if scheduler is None:
            log.warning("APScheduler not installed; background scheduler disabled.")
            yield
            return

        # Only the worker that wins the advisory lock runs the cron jobs, so that
        # with multiple workers the daily push fires once — not once per worker.
        from app.core.leader_lock import SchedulerLease
        from app.db.session import engine

        lease = SchedulerLease(engine)
        if not lease.acquire():
            log.info("Scheduler lock held by another worker; running as follower.")
            yield
            return

        schedule_all_jobs(scheduler)
        scheduler.start()
        try:
            yield
        finally:
            if scheduler.running:
                scheduler.shutdown(wait=False)
            lease.release()

    return lifespan


def _register_exception_handlers(app: FastAPI) -> None:
    """Catch otherwise-unhandled exceptions and return a consistent JSON envelope
    instead of leaking a raw stack trace. The request id (set by
    RequestLoggingMiddleware) is echoed back so a 500 can be traced in the logs.
    """
    from fastapi import Request
    from fastapi.responses import JSONResponse

    from app.calculations.ephemeris import RiseTransitUndefinedError
    from app.core.error_codes import ErrorCode
    from app.core.errors import error_envelope, register_error_handlers

    exc_logger = logging.getLogger("jothidam.error")
    register_error_handlers(app)

    @app.exception_handler(RiseTransitUndefinedError)
    async def _rise_transit_undefined_handler(request: Request, exc: RiseTransitUndefinedError):
        # Polar day/night: the Sun is circumpolar, so sunrise-anchored panchangam
        # fields are undefined for this location/date. A user-fixable input
        # condition, not a server fault — return 422, not 500.
        return JSONResponse(
            status_code=422,
            content=error_envelope(
                code=ErrorCode.VALIDATION_ERROR,
                request=request,
                detail=str(exc),
            ),
        )

    @app.exception_handler(Exception)
    async def _unhandled_exception_handler(request: Request, exc: Exception):
        request_id = getattr(request.state, "request_id", None)
        exc_logger.exception(
            "unhandled_exception",
            extra={"path": request.url.path, "method": request.method, "request_id": request_id},
        )
        return JSONResponse(
            status_code=500,
            headers={"X-Request-ID": request_id} if request_id else None,
            content=error_envelope(
                code=ErrorCode.INTERNAL_ERROR,
                request=request,
                detail="Internal server error.",
            ),
        )


def create_app() -> FastAPI:
    logging.config.dictConfig(_LOGGING_CONFIG)
    settings = get_settings()
    is_production = settings.environment.strip().lower() == "production"
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        # Do not expose the interactive docs / OpenAPI schema in production.
        docs_url=None if is_production else "/docs",
        redoc_url=None if is_production else "/redoc",
        openapi_url=None if is_production else "/openapi.json",
        lifespan=_build_lifespan(),
    )
    _register_exception_handlers(app)
    # Outermost middleware runs first on the way in / last on the way out.
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(RequestLoggingMiddleware)
    app.add_middleware(MaintenanceModeMiddleware)
    app.add_middleware(RateLimitMiddleware)

    cors_origins = [o.strip() for o in settings.cors_allow_origins.split(",") if o.strip()]
    if cors_origins:
        from fastapi.middleware.cors import CORSMiddleware

        app.add_middleware(
            CORSMiddleware,
            allow_origins=cors_origins,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
    csrf_dependencies = [Depends(require_csrf_header)]
    app.include_router(health_router)
    app.include_router(auth_router, prefix=f"{settings.api_v1_prefix}/auth", tags=["auth"])
    # Mobile-only: cookie-free Bearer + refresh-token auth (no CSRF needed — no cookies)
    app.include_router(mobile_auth_router, prefix=f"{settings.api_v1_prefix}/auth")
    # Geocoding proxy — public, no auth, no CSRF (GET/POST, no cookie auth). Kept
    # as the explicit opt-in fallback only — see app/api/places.py for the
    # bundled dataset that is now the default (B-006, owner ruling 2026-08-24).
    app.include_router(geo_router, prefix=settings.api_v1_prefix)
    # Bundled offline place search — public, no auth, no CSRF (GET only)
    app.include_router(places_router, prefix=settings.api_v1_prefix)
    # Third-party inbound webhooks (no cookie auth, validated by shared secret)
    app.include_router(webhooks_router, prefix=settings.api_v1_prefix)
    app.include_router(users_router, prefix=settings.api_v1_prefix, dependencies=csrf_dependencies)
    app.include_router(alerts_router, prefix=settings.api_v1_prefix, dependencies=csrf_dependencies)
    app.include_router(birth_profiles_router, prefix=settings.api_v1_prefix, dependencies=csrf_dependencies)
    app.include_router(charts_router, prefix=settings.api_v1_prefix, dependencies=csrf_dependencies)
    app.include_router(daily_guidance_router, prefix=settings.api_v1_prefix, dependencies=csrf_dependencies)
    app.include_router(daily_snapshot_router, prefix=settings.api_v1_prefix)
    app.include_router(context_router, prefix=settings.api_v1_prefix, dependencies=csrf_dependencies)
    app.include_router(decisions_router, prefix=settings.api_v1_prefix, dependencies=csrf_dependencies)
    app.include_router(family_vaults_router, prefix=settings.api_v1_prefix, dependencies=csrf_dependencies)
    app.include_router(transits_router, prefix=settings.api_v1_prefix, dependencies=csrf_dependencies)
    app.include_router(goals_router, prefix=settings.api_v1_prefix, dependencies=csrf_dependencies)
    app.include_router(streak_router, prefix=settings.api_v1_prefix, dependencies=csrf_dependencies)
    app.include_router(journal_router, prefix=settings.api_v1_prefix, dependencies=csrf_dependencies)
    app.include_router(life_areas_router, prefix=settings.api_v1_prefix, dependencies=csrf_dependencies)
    app.include_router(life_events_router, prefix=settings.api_v1_prefix, dependencies=csrf_dependencies)
    app.include_router(ask_vinaadi_router, prefix=settings.api_v1_prefix, dependencies=csrf_dependencies)
    app.include_router(life_event_log_router, prefix=settings.api_v1_prefix, dependencies=csrf_dependencies)
    app.include_router(muhurta_router, prefix=settings.api_v1_prefix, dependencies=csrf_dependencies)
    app.include_router(numerology_router, prefix=settings.api_v1_prefix, dependencies=csrf_dependencies)
    app.include_router(annual_wrapped_router, prefix=settings.api_v1_prefix, dependencies=csrf_dependencies)
    app.include_router(share_card_router, prefix=settings.api_v1_prefix, dependencies=csrf_dependencies)
    app.include_router(rectification_router, prefix=settings.api_v1_prefix, dependencies=csrf_dependencies)
    app.include_router(panchangam_router, prefix=settings.api_v1_prefix, dependencies=csrf_dependencies)
    app.include_router(qa_router, prefix=settings.api_v1_prefix, dependencies=csrf_dependencies)
    app.include_router(relationships_router, prefix=settings.api_v1_prefix, dependencies=csrf_dependencies)
    app.include_router(porutham_shares_router, prefix=settings.api_v1_prefix, dependencies=csrf_dependencies)
    app.include_router(retrospective_router, prefix=settings.api_v1_prefix, dependencies=csrf_dependencies)
    app.include_router(settings_router, prefix=settings.api_v1_prefix, dependencies=csrf_dependencies)
    app.include_router(admin_router, prefix=settings.api_v1_prefix, dependencies=csrf_dependencies)
    app.include_router(admin_analytics_router, prefix=settings.api_v1_prefix, dependencies=csrf_dependencies)
    app.include_router(feedback_router, prefix=settings.api_v1_prefix, dependencies=csrf_dependencies)
    app.include_router(whatif_router, prefix=settings.api_v1_prefix, dependencies=csrf_dependencies)
    app.include_router(content_router, prefix=settings.api_v1_prefix)
    app.include_router(notification_preferences_router, prefix=settings.api_v1_prefix, dependencies=csrf_dependencies)
    app.include_router(notifications_router, prefix=settings.api_v1_prefix, dependencies=csrf_dependencies)
    app.include_router(predictions_router, prefix=settings.api_v1_prefix, dependencies=csrf_dependencies)
    app.include_router(prasna_router, prefix=settings.api_v1_prefix, dependencies=csrf_dependencies)
    app.include_router(remedies_router, prefix=settings.api_v1_prefix, dependencies=csrf_dependencies)
    app.include_router(newsletter_router, prefix=settings.api_v1_prefix)
    app.include_router(public_tools_router, prefix=settings.api_v1_prefix)
    app.include_router(reports_router, prefix=settings.api_v1_prefix, dependencies=csrf_dependencies)
    app.include_router(stats_router, prefix=settings.api_v1_prefix)
    return app


app = create_app()
