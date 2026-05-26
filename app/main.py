import logging
import logging.config
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.alerts import router as alerts_router
from app.api.admin import router as admin_router
from app.api.auth import router as auth_router
from app.api.birth_profiles import router as birth_profiles_router
from app.api.context import router as context_router
from app.api.decisions import router as decisions_router
from app.api.feedback import router as feedback_router
from app.api.whatif import router as whatif_router
from app.api.daily_guidance import router as daily_guidance_router
from app.api.charts import router as charts_router
from app.api.family_vaults import router as family_vaults_router
from app.api.health import router as health_router
from app.api.goals import router as goals_router
from app.api.journal import router as journal_router
from app.api.life_areas import router as life_areas_router
from app.api.panchangam import router as panchangam_router
from app.api.qa import router as qa_router
from app.api.relationships import router as relationships_router
from app.api.retrospective import router as retrospective_router
from app.api.settings import router as settings_router
from app.api.transits import router as transits_router
from app.api.content import router as content_router
from app.api.notification_preferences import router as notification_preferences_router
from app.api.predictions import router as predictions_router
from app.core.config import get_settings
from app.middleware import RateLimitMiddleware, RequestLoggingMiddleware, SecurityHeadersMiddleware
from app.services.peyarchi_alert_service import daily_peyarchi_refresh
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
        scheduler = AsyncIOScheduler(timezone="UTC") if AsyncIOScheduler is not None else None
        if scheduler is None:
            logging.getLogger(__name__).warning("APScheduler not installed; peyarchi background scheduler disabled.")
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
        scheduler.start()
        try:
            yield
        finally:
            if scheduler.running:
                scheduler.shutdown(wait=False)

    return lifespan


def create_app() -> FastAPI:
    logging.config.dictConfig(_LOGGING_CONFIG)
    settings = get_settings()
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=_build_lifespan(),
    )
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(RequestLoggingMiddleware)
    app.add_middleware(RateLimitMiddleware)
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
    app.include_router(panchangam_router, prefix=settings.api_v1_prefix)
    app.include_router(qa_router, prefix=settings.api_v1_prefix)
    app.include_router(relationships_router, prefix=settings.api_v1_prefix)
    app.include_router(retrospective_router, prefix=settings.api_v1_prefix)
    app.include_router(settings_router, prefix=settings.api_v1_prefix)
    app.include_router(admin_router, prefix=settings.api_v1_prefix)
    app.include_router(feedback_router, prefix=settings.api_v1_prefix)
    app.include_router(whatif_router, prefix=settings.api_v1_prefix)
    app.include_router(content_router, prefix=settings.api_v1_prefix)
    app.include_router(notification_preferences_router, prefix=settings.api_v1_prefix)
    app.include_router(predictions_router, prefix=settings.api_v1_prefix)
    return app


app = create_app()
