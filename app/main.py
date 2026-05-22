import logging
import logging.config

from fastapi import FastAPI

from app.api.admin import router as admin_router
from app.api.birth_profiles import router as birth_profiles_router
from app.api.feedback import router as feedback_router
from app.api.daily_guidance import router as daily_guidance_router
from app.api.charts import router as charts_router
from app.api.family_vaults import router as family_vaults_router
from app.api.health import router as health_router
from app.api.panchangam import router as panchangam_router
from app.api.qa import router as qa_router
from app.api.transits import router as transits_router
from app.core.config import get_settings
from app.middleware import RateLimitMiddleware, RequestLoggingMiddleware, SecurityHeadersMiddleware

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


def create_app() -> FastAPI:
    logging.config.dictConfig(_LOGGING_CONFIG)
    settings = get_settings()
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        docs_url="/docs",
        redoc_url="/redoc",
    )
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(RequestLoggingMiddleware)
    app.add_middleware(RateLimitMiddleware)
    app.include_router(health_router)
    app.include_router(birth_profiles_router, prefix=settings.api_v1_prefix)
    app.include_router(charts_router, prefix=settings.api_v1_prefix)
    app.include_router(daily_guidance_router, prefix=settings.api_v1_prefix)
    app.include_router(family_vaults_router, prefix=settings.api_v1_prefix)
    app.include_router(transits_router, prefix=settings.api_v1_prefix)
    app.include_router(panchangam_router, prefix=settings.api_v1_prefix)
    app.include_router(qa_router, prefix=settings.api_v1_prefix)
    app.include_router(admin_router, prefix=settings.api_v1_prefix)
    app.include_router(feedback_router, prefix=settings.api_v1_prefix)
    return app


app = create_app()
