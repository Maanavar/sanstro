"""Pluggable sliding-window rate-limit backends.

The middleware (``app.middleware.RateLimitMiddleware``) delegates the actual
counting to a backend so the same limiting policy works either per-process or
cluster-wide:

* ``InMemoryRateLimitBackend`` — per-worker counters (exact on one worker, ~N x
  the limit across N workers). The default; fine for a single-box deploy.
* ``RedisRateLimitBackend`` — a sorted-set sliding window shared across all
  workers/boxes, so the limit is enforced cluster-wide.

``get_rate_limit_backend()`` chooses from settings and falls back to memory when
Redis is requested but unavailable (fail-open on infra, never fail-open on the
limit itself).
"""
from __future__ import annotations

import logging
import math
import time
import uuid
from collections import defaultdict
from dataclasses import dataclass
from functools import lru_cache
from threading import Lock
from typing import Any, Protocol

from app.core.config import get_settings
from app.core.redis_client import get_redis

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class RateLimitResult:
    allowed: bool
    remaining: int
    retry_after: int  # seconds; meaningful only when ``allowed`` is False


class RateLimitBackend(Protocol):
    def check(self, client_ip: str, max_requests: int, window_seconds: int) -> RateLimitResult: ...


class InMemoryRateLimitBackend:
    """Per-process sliding window keyed by client IP. Thread-safe."""

    def __init__(self) -> None:
        self._counters: dict[str, list[float]] = defaultdict(list)
        self._lock = Lock()

    def reset(self) -> None:
        with self._lock:
            self._counters.clear()

    def check(self, client_ip: str, max_requests: int, window_seconds: int) -> RateLimitResult:
        now = time.monotonic()
        window_start = now - window_seconds
        with self._lock:
            timestamps = [t for t in self._counters[client_ip] if t > window_start]
            if len(timestamps) >= max_requests:
                oldest = timestamps[0]
                retry_after = max(1, int(math.ceil((oldest + window_seconds) - now)))
                self._counters[client_ip] = timestamps
                return RateLimitResult(allowed=False, remaining=0, retry_after=retry_after)
            timestamps.append(now)
            self._counters[client_ip] = timestamps
            remaining = max(0, max_requests - len(timestamps))
            return RateLimitResult(allowed=True, remaining=remaining, retry_after=0)


class RedisRateLimitBackend:
    """Cluster-wide sliding window using one sorted set per client IP.

    Each request adds a uniquely-tagged member scored by its epoch timestamp;
    stale members outside the window are trimmed, then the set is counted. On
    any Redis error we fail open (allow) rather than locking users out on infra.
    """

    def __init__(self, client: Any, *, namespace: str = "ratelimit") -> None:
        self._client = client
        self._namespace = namespace

    def _key(self, client_ip: str) -> str:
        return f"{self._namespace}:{client_ip}"

    def check(self, client_ip: str, max_requests: int, window_seconds: int) -> RateLimitResult:
        key = self._key(client_ip)
        now = time.time()
        window_start = now - window_seconds
        member = f"{now:.6f}:{uuid.uuid4().hex}"
        try:
            pipe = self._client.pipeline()
            pipe.zremrangebyscore(key, 0, window_start)
            pipe.zadd(key, {member: now})
            pipe.zcard(key)
            pipe.expire(key, window_seconds)
            results = pipe.execute()
            count = int(results[2])
        except Exception as exc:  # pragma: no cover - infra dependent
            logger.warning("redis rate-limit check failed ip=%s exc=%s; failing open", client_ip, exc)
            return RateLimitResult(allowed=True, remaining=max_requests, retry_after=0)

        if count > max_requests:
            # Drop the member we just added so a rejected request doesn't keep the
            # window saturated, then compute retry_after from the oldest member.
            try:
                self._client.zrem(key, member)
                oldest = self._client.zrange(key, 0, 0, withscores=True)
            except Exception:  # noqa: S110 — best-effort; fall back to full-window retry below
                oldest = None
            if oldest:
                oldest_score = float(oldest[0][1])
                retry_after = max(1, int(math.ceil((oldest_score + window_seconds) - now)))
            else:
                retry_after = window_seconds
            return RateLimitResult(allowed=False, remaining=0, retry_after=retry_after)

        remaining = max(0, max_requests - count)
        return RateLimitResult(allowed=True, remaining=remaining, retry_after=0)


def reset_rate_limit_backend() -> None:
    """Clear the active in-memory limiter's counters (used by tests to isolate state).

    Clears the *current* cached backend in place so the live middleware — which
    captured the same singleton at construction — sees the reset. A no-op for the
    Redis backend (clearing the shared store across a test suite is undesirable).
    """
    backend = get_rate_limit_backend()
    reset = getattr(backend, "reset", None)
    if callable(reset):
        reset()


@lru_cache
def get_rate_limit_backend() -> RateLimitBackend:
    """Return the configured rate-limit backend (memory unless redis is selected and reachable)."""
    settings = get_settings()
    if settings.rate_limit_backend.strip().lower() == "redis":
        client = get_redis()
        if client is not None:
            logger.info("rate-limit backend: redis")
            return RedisRateLimitBackend(client)
        logger.warning("rate_limit_backend=redis but Redis is unavailable; using in-memory limiter.")
    return InMemoryRateLimitBackend()
