"""Shared Redis connection helper.

A single, lazily-created connection pool is reused by the cache (``app.core.cache``)
and the rate limiter (``app.core.rate_limit``). Redis is an *optional* runtime
dependency: when ``JOTHIDAM_REDIS_URL`` is unset, the ``redis`` package is not
installed, or the server is unreachable at startup, ``get_redis`` returns ``None``
and callers fall back to their in-process implementations (fail-open on infra).
"""
from __future__ import annotations

import logging
from functools import lru_cache
from typing import Any

from app.core.config import get_settings

logger = logging.getLogger(__name__)


@lru_cache
def get_redis() -> Any | None:
    """Return a connected Redis client, or ``None`` when Redis is unavailable.

    The result is cached for the process lifetime. A ``None`` result is also
    cached, so a missing/broken Redis at boot does not retry on every request —
    callers fall back to memory. Restart the process after provisioning Redis.
    """
    settings = get_settings()
    url = (settings.redis_url or "").strip()
    if not url:
        return None

    try:
        import redis  # type: ignore[import-untyped]
    except ImportError:
        logger.warning("redis_url is set but the 'redis' package is not installed; using in-process fallback.")
        return None

    try:
        client = redis.Redis.from_url(url, decode_responses=True)
        client.ping()
    except Exception as exc:  # pragma: no cover - infra dependent
        logger.warning("Redis unreachable at %s (%s); using in-process fallback.", url, exc)
        return None

    logger.info("Redis connected: %s", url)
    return client
