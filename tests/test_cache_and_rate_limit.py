"""Unit tests for the cache and rate-limit backends (REFACTOR_PLAN 3.1 / 3.4).

Pure in-process logic — no DB or ephemeris needed, so marked ``no_db``.
"""
import time

import pytest

from app.core.cache import InMemoryCache
from app.core.rate_limit import InMemoryRateLimitBackend

pytestmark = pytest.mark.no_db


def test_in_memory_cache_get_set_delete():
    cache = InMemoryCache()
    assert cache.get("missing") is None
    cache.set("k", {"v": 1}, ttl_seconds=60)
    assert cache.get("k") == {"v": 1}
    cache.delete("k")
    assert cache.get("k") is None


def test_in_memory_cache_get_or_compute_runs_once():
    cache = InMemoryCache()
    calls = {"n": 0}

    def compute():
        calls["n"] += 1
        return [1, 2, 3]

    assert cache.get_or_compute("k", compute, ttl_seconds=60) == [1, 2, 3]
    assert cache.get_or_compute("k", compute, ttl_seconds=60) == [1, 2, 3]
    assert calls["n"] == 1


def test_in_memory_cache_expires():
    cache = InMemoryCache()
    cache.set("k", "v", ttl_seconds=1)
    # Force expiry without sleeping: rewrite the entry in the past.
    cache._store["k"] = (time.monotonic() - 1, "v")
    assert cache.get("k") is None


def test_rate_limit_blocks_after_max_requests():
    backend = InMemoryRateLimitBackend()
    results = [backend.check("1.2.3.4", max_requests=3, window_seconds=60) for _ in range(4)]
    assert [r.allowed for r in results] == [True, True, True, False]
    assert results[2].remaining == 0
    assert results[3].retry_after >= 1


def test_rate_limit_is_per_client_ip():
    backend = InMemoryRateLimitBackend()
    for _ in range(3):
        backend.check("1.1.1.1", max_requests=3, window_seconds=60)
    # A different IP is unaffected by the first IP's exhausted budget.
    assert backend.check("2.2.2.2", max_requests=3, window_seconds=60).allowed is True
    assert backend.check("1.1.1.1", max_requests=3, window_seconds=60).allowed is False


def test_rate_limit_reset_clears_counters():
    backend = InMemoryRateLimitBackend()
    for _ in range(3):
        backend.check("9.9.9.9", max_requests=3, window_seconds=60)
    assert backend.check("9.9.9.9", max_requests=3, window_seconds=60).allowed is False
    backend.reset()
    assert backend.check("9.9.9.9", max_requests=3, window_seconds=60).allowed is True
