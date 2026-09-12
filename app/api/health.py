"""Liveness and readiness probes.

The two are different questions and a single ``/health`` cannot answer both:

* **Liveness** — is this process alive? A failure means *restart me*. It must not
  touch the database, or a database outage restart-loops every instance and the
  fleet is gone the moment it is needed most.
* **Readiness** — can this process serve a correct response right now? A failure
  means *stop sending me traffic*, and it necessarily touches dependencies.

``/health`` predates both, is what the container healthcheck and a good number of
tests call, and keeps its exact shape.
"""
from __future__ import annotations

import logging
from time import perf_counter

from fastapi import APIRouter, Response, status
from sqlalchemy import text

from app.core.config import get_settings
from app.schemas.health import HealthResponse, ReadinessCheck, ReadinessResponse

logger = logging.getLogger(__name__)

router = APIRouter()

# A probe that can hang is worse than one that fails: the orchestrator waits on
# its own timeout instead of acting, and the readiness endpoint becomes a way to
# tie up a worker. Both checks are bounded below.
_DB_PROBE_TIMEOUT_MS = 2000


def _health_payload() -> HealthResponse:
    settings = get_settings()
    return HealthResponse(
        status="ok",
        service=settings.app_name,
        version=settings.app_version,
        environment=settings.environment,
    )


@router.get("/health", response_model=HealthResponse, tags=["health"])
def health_check() -> HealthResponse:
    return _health_payload()


@router.get("/health/live", response_model=HealthResponse, tags=["health"])
def liveness_check() -> HealthResponse:
    """Process-only. Touches no dependency, on purpose — see the module docstring."""
    return _health_payload()


def _check_database() -> ReadinessCheck:
    from app.db.session import engine

    start = perf_counter()
    try:
        with engine.connect() as conn:
            # pool_pre_ping already proves the socket; this bounds the query so a
            # wedged-but-connected database cannot hold the probe open.
            if conn.dialect.name == "postgresql":
                conn.execute(text(f"SET statement_timeout = {_DB_PROBE_TIMEOUT_MS}"))
            conn.execute(text("SELECT 1"))
    except Exception as exc:  # pragma: no cover - infra dependent
        logger.warning("readiness_database_down: %s", exc.__class__.__name__)
        return ReadinessCheck(status="down", required=True)
    return ReadinessCheck(
        status="ok", required=True, latency_ms=round((perf_counter() - start) * 1000, 1)
    )


def _cache_is_required() -> bool:
    """Whether losing Redis should take this instance out of rotation.

    Default: only when the rate limiter is configured to use it. Redis backs two
    very different things here. As a *cache* it is an optimisation and the
    in-process fallback is correct, just colder. As the *rate-limit* backend it
    is a security control, and falling back to per-process counters multiplies
    every limit by the worker count — the exact condition ``app.main`` refuses to
    boot into. Serving traffic with silently-loosened limits is the thing worth
    refusing.

    Set ``JOTHIDAM_READINESS_REQUIRE_CACHE`` to override in either direction. The
    override exists because the failure mode of requiring it is correlated: a
    Redis outage marks the *whole* fleet not-ready at once, and an ingress that
    does not fail open on all-unhealthy would then serve nothing at all.
    """
    settings = get_settings()
    if settings.readiness_require_cache is not None:
        return settings.readiness_require_cache
    return settings.rate_limit_backend.strip().lower() == "redis"


def _check_cache() -> ReadinessCheck:
    from app.core.redis_client import get_redis

    settings = get_settings()
    required = _cache_is_required()
    uses_redis = "redis" in {
        settings.cache_backend.strip().lower(),
        settings.rate_limit_backend.strip().lower(),
    }
    if not uses_redis:
        return ReadinessCheck(status="disabled", required=required)

    start = perf_counter()
    client = get_redis()
    if client is None:
        # get_redis caches its result for the process lifetime, so a Redis that
        # was unreachable at boot reports down here until the process restarts.
        # That is the truth about this instance: it is running on the in-process
        # fallback and a restart is what changes it.
        return ReadinessCheck(status="down", required=required)
    try:
        client.ping()
    except Exception as exc:  # pragma: no cover - infra dependent
        logger.warning("readiness_cache_down: %s", exc.__class__.__name__)
        return ReadinessCheck(status="down", required=required)
    return ReadinessCheck(
        status="ok", required=required, latency_ms=round((perf_counter() - start) * 1000, 1)
    )


@router.get(
    "/health/ready",
    response_model=ReadinessResponse,
    tags=["health"],
    responses={503: {"model": ReadinessResponse}},
)
def readiness_check(response: Response) -> ReadinessResponse:
    checks = {"database": _check_database(), "cache": _check_cache()}
    ready = all(not c.required or c.status != "down" for c in checks.values())
    if not ready:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    return ReadinessResponse(status="ready" if ready else "not_ready", checks=checks)
