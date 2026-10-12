"""A small, backend-agnostic cache abstraction.

Two implementations sit behind one ``Cache`` protocol:

* ``InMemoryCache`` — a bounded process-local LRU with per-key TTL. Exact on a
  single worker; not shared across workers. The dev/test default and the
  fallback when Redis is unreachable. Policy: ``docs/CACHE_POLICY.md``.
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
from collections import OrderedDict
from collections.abc import Callable
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
    """Bounded process-local TTL cache with least-recently-used eviction.

    Two mechanisms, each with one job:

    * **Capacity** (``max_entries``) bounds memory at all times. A write that
      takes the store over the cap evicts the least recently read or written
      entry, expired or not. This is O(1).
    * **Sweep** reclaims expired entries that nobody reads again. It is a full
      O(n) scan, so it runs on a write at most once per
      ``sweep_interval_seconds`` rather than on every write — the cap already
      guarantees the bound, so the sweep only shortens how long dead entries
      hold slots.

    A read of an expired key also drops it. Eviction is an ordinary miss to
    callers, matching Redis expiry or max-memory eviction: values are
    recomputed, never returned stale.
    """

    def __init__(
        self,
        *,
        max_entries: int = 1024,
        sweep_interval_seconds: float = 60.0,
        clock: Callable[[], float] = time.monotonic,
    ) -> None:
        if max_entries < 1:
            raise ValueError("max_entries must be at least 1")
        if sweep_interval_seconds < 0:
            raise ValueError("sweep_interval_seconds must not be negative")
        self._max_entries = max_entries
        self._sweep_interval = sweep_interval_seconds
        self._clock = clock
        self._next_sweep = clock() + sweep_interval_seconds
        self._store: OrderedDict[str, tuple[float, Any]] = OrderedDict()
        self._lock = Lock()

    def __len__(self) -> int:
        """Entries currently held, live or not yet swept."""
        with self._lock:
            return len(self._store)

    def _sweep_if_due(self, now: float) -> None:
        if now < self._next_sweep:
            return
        expired = [key for key, (expires_at, _) in self._store.items() if expires_at <= now]
        for key in expired:
            del self._store[key]
        self._next_sweep = now + self._sweep_interval

    def get(self, key: str) -> Any | None:
        now = self._clock()
        with self._lock:
            entry = self._store.get(key)
            if entry is None:
                return None
            expires_at, value = entry
            if expires_at <= now:
                self._store.pop(key, None)
                return None
            self._store.move_to_end(key)
            return value

    def set(self, key: str, value: Any, ttl_seconds: int) -> None:
        now = self._clock()
        expires_at = now + max(1, ttl_seconds)
        with self._lock:
            self._sweep_if_due(now)
            self._store[key] = (expires_at, value)
            self._store.move_to_end(key)
            while len(self._store) > self._max_entries:
                self._store.popitem(last=False)

    def delete(self, key: str) -> None:
        with self._lock:
            self._store.pop(key, None)

    def clear(self) -> None:
        """Drop all process-local entries (primarily for lifecycle/test reset)."""
        with self._lock:
            self._store.clear()

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
