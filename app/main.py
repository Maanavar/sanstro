import logging
import logging.config
from contextlib import asynccontextmanager

from fastapi import FastAPI

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
from app.api.decisions import router as decisions_router
from app.api.family_vaults import router as family_vaults_router
from app.api.feedback import router as feedback_router
from app.api.goals import router as goals_router
from app.api.health import router as health_router
from app.api.journal import router as journal_router
from app.api.life_areas import router as life_areas_router
from app.api.life_event_log import router as life_event_log_router
from app.api.life_events import router as life_events_router
from app.api.muhurta import router as muhurta_router
from app.api.notification_preferences import router as notification_preferences_router
from app.api.notifications import router as notifications_router
from app.api.panchangam import router as panchangam_router
from app.api.prasna import router as prasna_router
from app.api.predictions import router as predictions_router
from app.api.public_tools import router as public_tools_router
from app.api.qa import router as qa_router
from app.api.rectification import router as rectification_router
from app.api.relationships import router as relationships_router
from app.api.remedies import router as remedies_router
from app.api.retrospective import router as retrospective_router
from app.api.settings import router as settings_router
from app.api.share_card import router as share_card_router
from app.api.transits import router as transits_router
from app.api.whatif import router as whatif_router
from app.core.config import get_settings
from app.middleware import MaintenanceModeMiddleware, RateLimitMiddleware, RequestLoggingMiddleware, SecurityHeadersMiddleware
from app.services.daily_push_cron import run_daily_push_cron
from app.services.panchangam_prewarm import run_panchangam_prewarm_cron
from app.services.peyarchi_alert_service import daily_peyarchi_refresh
from app.services.job_registry import register_job
from app.services.synastry_service import daily_relationship_alert_refresh

try:
    from apscheduler.schedulers.asyncio import AsyncIOScheduler
except ModuleNotFoundError:  # pragma: no cover - optional dependency
    AsyncIOScheduler = None  # type: ignore[assignment]

_LOGGING_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "json": {
            "format": '{"time":"%(asctime)s","level":"%(levelname)s","logger":"%(name)s","message":"%(message)s"}',
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

def _build_lifespan():
    @asynccontextmanager
    async def lifespan(_app: FastAPI):
        register_job(
            "daily_peyarchi_refresh",
            "Peyarchi Refresh",
            "Refresh transit alerts for all charts (daily, 02:00 UTC)",
            daily_peyarchi_refresh,
        )
        register_job(
            "daily_relationship_alert_refresh",
            "Relationship Alerts",
            "Refresh synastry alerts (daily, 02:05 UTC)",
            daily_relationship_alert_refresh,
        )
        register_job(
            "daily_push_cron",
            "Daily Push Notifications",
            "Send morning guidance push (hourly, per-user timezone window)",
            run_daily_push_cron,
        )
        register_job(
            "panchangam_prewarm",
            "Panchangam Prewarm",
            "Pre-warm panchangam cache for popular locations (daily, 02:10 UTC)",
            run_panchangam_prewarm_cron,
        )

        scheduler = AsyncIOScheduler(timezone="UTC") if AsyncIOScheduler is not None else None
        if scheduler is None:
            logging.getLogger(__name__).warning("APScheduler not installed; peyarchi background scheduler disabled.")
            yield
            return

        # Only the worker that wins the advisory lock runs the cron jobs, so that
        # with multiple workers the daily push fires once — not once per worker.
        from app.core.leader_lock import SchedulerLease
        from app.db.session import engine

        lease = SchedulerLease(engine)
        if not lease.acquire():
            logging.getLogger(__name__).info("Scheduler lock held by another worker; running as follower.")
            yield
            return

        scheduler.add_job(daily_peyarchi_refresh, "cron", hour=2, minute=0, id="daily_peyarchi_refresh", replace_existing=True)
        scheduler.add_job(
            daily_relationship_alert_refresh,
            "cron",
            hour=2,
            minute=5,
            id="daily_relationship_alert_refresh",
            replace_existing=True,
        )
        scheduler.add_job(
            run_daily_push_cron,
            "cron",
            minute=0,  # every hour on the hour — morning window check is done inside per user timezone
            id="daily_push_cron",
            replace_existing=True,
        )
        # Pre-warm the panchangam cache for popular locations so the calendar and
        # daily panchangam load as warm cache hits (no cold ephemeris on first view).
        scheduler.add_job(
            run_panchangam_prewarm_cron,
            "cron",
            hour=2,
            minute=10,
            id="panchangam_prewarm",
            replace_existing=True,
        )
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

    exc_logger = logging.getLogger("jothidam.error")

    @app.exception_handler(Exception)
    async def _unhandled_exception_handler(request: Request, exc: Exception):
        request_id = getattr(request.state, "request_id", None)
        exc_logger.exception(
            "unhandled_exception",
            extra={"path": request.url.path, "method": request.method, "request_id": request_id},
        )
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error.", "request_id": request_id},
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
    app.include_router(health_router)
    app.include_router(auth_router, prefix=f"{settings.api_v1_prefix}/auth", tags=["auth"])
    app.include_router(alerts_router, prefix=settings.api_v1_prefix)
    app.include_router(birth_profiles_router, prefix=settings.api_v1_prefix)
    app.include_router(charts_router, prefix=settings.api_v1_prefix)
    app.include_router(daily_guidance_router, prefix=settings.api_v1_prefix)
    app.include_router(context_router, prefix=settings.api_v1_prefix)
    app.include_router(decisions_router, prefix=settings.api_v1_prefix)
    app.include_router(family_vaults_router, prefix=settings.api_v1_prefix)
    app.include_router(transits_router, prefix=settings.api_v1_prefix)
    app.include_router(goals_router, prefix=settings.api_v1_prefix)
    app.include_router(journal_router, prefix=settings.api_v1_prefix)
    app.include_router(life_areas_router, prefix=settings.api_v1_prefix)
    app.include_router(life_events_router, prefix=settings.api_v1_prefix)
    app.include_router(ask_vinaadi_router, prefix=settings.api_v1_prefix)
    app.include_router(life_event_log_router, prefix=settings.api_v1_prefix)
    app.include_router(muhurta_router, prefix=settings.api_v1_prefix)
    app.include_router(annual_wrapped_router, prefix=settings.api_v1_prefix)
    app.include_router(share_card_router, prefix=settings.api_v1_prefix)
    app.include_router(rectification_router, prefix=settings.api_v1_prefix)
    app.include_router(panchangam_router, prefix=settings.api_v1_prefix)
    app.include_router(qa_router, prefix=settings.api_v1_prefix)
    app.include_router(relationships_router, prefix=settings.api_v1_prefix)
    app.include_router(retrospective_router, prefix=settings.api_v1_prefix)
    app.include_router(settings_router, prefix=settings.api_v1_prefix)
    app.include_router(admin_router, prefix=settings.api_v1_prefix)
    app.include_router(admin_analytics_router, prefix=settings.api_v1_prefix)
    app.include_router(feedback_router, prefix=settings.api_v1_prefix)
    app.include_router(whatif_router, prefix=settings.api_v1_prefix)
    app.include_router(content_router, prefix=settings.api_v1_prefix)
    app.include_router(notification_preferences_router, prefix=settings.api_v1_prefix)
    app.include_router(notifications_router, prefix=settings.api_v1_prefix)
    app.include_router(predictions_router, prefix=settings.api_v1_prefix)
    app.include_router(prasna_router, prefix=settings.api_v1_prefix)
    app.include_router(remedies_router, prefix=settings.api_v1_prefix)
    app.include_router(public_tools_router, prefix=settings.api_v1_prefix)
    return app


app = create_app()
