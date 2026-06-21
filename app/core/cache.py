"""A small, backend-agnostic cache abstraction.

Two implementations sit behind one ``Cache`` protocol:

* ``InMemoryCache`` — a process-local dict with per-key TTL. Exact on a single
  worker; not shared across workers. The dev/test default.
* ``RedisCache`` — JSON values in Redis with native TTL, shared across workers
  and boxes. Selected with ``JOTHIDAM_CACHE_BACKEND=redis`` + ``JOTHIDAM_REDIS_URL``.

``get_cache()`` picks the backend from settings and falls back to memory when
Redis is requested but unavailable (see ``app.core.redis_client``). Callers use
``get_or_compute`` so the caching policy lives in one place. Values must be
JSON-serialisable so the same call works against either backend.
"""
from __future__ import annotations

import json
import logging
import time
from functools import lru_cache
from threading import Lock
from typing import Any, Protocol, TypeVar, runtime_checkable

from app.core.config import get_settings
from app.core.redis_client import get_redis

logger = logging.getLogger(__name__)

T = TypeVar("T")

# Sentinel distinguishing "missing key" from a cached ``None`` value.
_MISSING = object()


@runtime_checkable
class Cache(Protocol):
    """Minimal cache interface shared by the in-memory and Redis backends."""

    def get(self, key: str) -> Any | None: ...

    def set(self, key: str, value: Any, ttl_seconds: int) -> None: ...

    def delete(self, key: str) -> None: ...

    def get_or_compute(self, key: str, compute: Any, ttl_seconds: int) -> Any: ...


class InMemoryCache:
    """Process-local cache with per-key expiry. Thread-safe."""

    def __init__(self) -> None:
        self._store: dict[str, tuple[float, Any]] = {}
        self._lock = Lock()

    def get(self, key: str) -> Any | None:
        now = time.monotonic()
        with self._lock:
            entry = self._store.get(key)
            if entry is None:
                return None
            expires_at, value = entry
            if expires_at < now:
                self._store.pop(key, None)
                return None
            return value

    def set(self, key: str, value: Any, ttl_seconds: int) -> None:
        expires_at = time.monotonic() + max(1, ttl_seconds)
        with self._lock:
            self._store[key] = (expires_at, value)

    def delete(self, key: str) -> None:
        with self._lock:
            self._store.pop(key, None)

    def get_or_compute(self, key: str, compute: Any, ttl_seconds: int) -> Any:
        cached = self.get(key)
        if cached is not None:
            return cached
        value = compute()
        self.set(key, value, ttl_seconds)
        return value


class RedisCache:
    """Redis-backed cache. Values are JSON-encoded; reads fail open to a miss."""

    def __init__(self, client: Any, *, namespace: str = "cache") -> None:
        self._client = client
        self._namespace = namespace

    def _full_key(self, key: str) -> str:
        return f"{self._namespace}:{key}"

    def get(self, key: str) -> Any | None:
        try:
            raw = self._client.get(self._full_key(key))
        except Exception as exc:  # pragma: no cover - infra dependent
            logger.warning("redis cache get failed key=%s exc=%s", key, exc)
            return None
        if raw is None:
            return None
        try:
            return json.loads(raw)
        except (ValueError, TypeError):
            return None

    def set(self, key: str, value: Any, ttl_seconds: int) -> None:
        try:
            payload = json.dumps(value)
        except (TypeError, ValueError) as exc:
            logger.warning("redis cache set skipped (non-JSON value) key=%s exc=%s", key, exc)
            return
        try:
            self._client.set(self._full_key(key), payload, ex=max(1, ttl_seconds))
        except Exception as exc:  # pragma: no cover - infra dependent
            logger.warning("redis cache set failed key=%s exc=%s", key, exc)

    def delete(self, key: str) -> None:
        try:
            self._client.delete(self._full_key(key))
        except Exception as exc:  # pragma: no cover - infra dependent
            logger.warning("redis cache delete failed key=%s exc=%s", key, exc)

    def get_or_compute(self, key: str, compute: Any, ttl_seconds: int) -> Any:
        cached = self.get(key)
        if cached is not None:
            return cached
        value = compute()
        self.set(key, value, ttl_seconds)
        return value


@lru_cache
def get_cache() -> Cache:
    """Return the configured cache backend (memory unless redis is selected and reachable)."""
    settings = get_settings()
    if settings.cache_backend.strip().lower() == "redis":
        client = get_redis()
        if client is not None:
            logger.info("cache backend: redis")
            return RedisCache(client)
        logger.warning("cache_backend=redis but Redis is unavailable; using in-memory cache.")
    return InMemoryCache()
