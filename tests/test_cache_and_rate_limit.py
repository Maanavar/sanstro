"""Unit tests for the cache and rate-limit backends (REFACTOR_PLAN 3.1 / 3.4).

Pure in-process logic — no DB or ephemeris needed, so marked ``no_db``.
"""
import logging
import time

import pytest

from app.core.cache import InMemoryCache
from app.core.config import get_settings
from app.core.rate_limit import InMemoryRateLimitBackend, reset_rate_limit_backend
from app.main import _assert_rate_limiter_matches_worker_count

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


# --------------------------------------------------------------------------- #
# WEB_CONCURRENCY vs the in-memory limiter (P0-4)                              #
# --------------------------------------------------------------------------- #
#
# Production ran two uvicorn workers against a per-process limiter, so every
# documented limit was really up to 2x, and which counter a request hit depended
# on which worker accepted it. Nothing logged and nothing failed — the whole
# defect was that it was silent. The guard turns that specific combination into
# a refusal to boot, and these pin it, because the combination is one env var
# away from returning.


def _clear_caches():
    get_settings.cache_clear()
    reset_rate_limit_backend()


@pytest.fixture(autouse=True)
def _isolate_settings():
    _clear_caches()
    yield
    _clear_caches()


def test_multiple_workers_with_memory_limiter_refuses_to_boot(monkeypatch):
    monkeypatch.setenv("WEB_CONCURRENCY", "2")
    monkeypatch.setenv("JOTHIDAM_RATE_LIMIT_BACKEND", "memory")
    monkeypatch.setenv("JOTHIDAM_DEBUG", "false")
    _clear_caches()

    with pytest.raises(RuntimeError) as excinfo:
        _assert_rate_limiter_matches_worker_count()

    # The message has to name the multiplier and both ways out, or the operator
    # who hits it at 3am has to read this file to know what to do.
    message = str(excinfo.value)
    assert "2x" in message
    assert "JOTHIDAM_RATE_LIMIT_BACKEND=redis" in message
    assert "WEB_CONCURRENCY=1" in message


def test_single_worker_with_memory_limiter_is_fine(monkeypatch):
    monkeypatch.setenv("WEB_CONCURRENCY", "1")
    monkeypatch.setenv("JOTHIDAM_RATE_LIMIT_BACKEND", "memory")
    _clear_caches()

    _assert_rate_limiter_matches_worker_count()


def test_unset_worker_count_is_treated_as_one(monkeypatch):
    monkeypatch.delenv("WEB_CONCURRENCY", raising=False)
    monkeypatch.setenv("JOTHIDAM_RATE_LIMIT_BACKEND", "memory")
    _clear_caches()

    _assert_rate_limiter_matches_worker_count()


def test_unparseable_worker_count_does_not_crash_boot(monkeypatch):
    monkeypatch.setenv("WEB_CONCURRENCY", "not-a-number")
    monkeypatch.setenv("JOTHIDAM_RATE_LIMIT_BACKEND", "memory")
    _clear_caches()

    _assert_rate_limiter_matches_worker_count()


def test_debug_downgrades_the_refusal_to_a_warning(monkeypatch, caplog):
    monkeypatch.setenv("WEB_CONCURRENCY", "4")
    monkeypatch.setenv("JOTHIDAM_RATE_LIMIT_BACKEND", "memory")
    monkeypatch.setenv("JOTHIDAM_DEBUG", "true")
    _clear_caches()

    with caplog.at_level(logging.WARNING, logger="app.main"):
        _assert_rate_limiter_matches_worker_count()

    assert any("rate_limit_worker_mismatch" in r.message for r in caplog.records)


def test_disabled_rate_limiting_is_not_second_guessed(monkeypatch):
    # Nothing is being multiplied if nothing is being limited.
    monkeypatch.setenv("WEB_CONCURRENCY", "8")
    monkeypatch.setenv("JOTHIDAM_RATE_LIMIT_BACKEND", "memory")
    monkeypatch.setenv("JOTHIDAM_RATE_LIMIT_ENABLED", "false")
    _clear_caches()

    _assert_rate_limiter_matches_worker_count()


def test_guard_checks_the_effective_backend_not_the_setting(monkeypatch):
    """redis falls back to memory when Redis is unreachable.

    That is the dangerous case: the deploy looks correctly configured and is
    still running multiplied limits. The guard resolves the backend rather than
    trusting the setting string, so it catches it.
    """
    monkeypatch.setenv("WEB_CONCURRENCY", "2")
    monkeypatch.setenv("JOTHIDAM_RATE_LIMIT_BACKEND", "redis")
    monkeypatch.setenv("JOTHIDAM_REDIS_URL", "redis://127.0.0.1:6390/0")
    monkeypatch.setenv("JOTHIDAM_DEBUG", "false")
    _clear_caches()

    with pytest.raises(RuntimeError):
        _assert_rate_limiter_matches_worker_count()


# ---------------------------------------------------------------------------
# Why the two proxy-hop counts must be EQUAL, demonstrated rather than asserted.
#
# docs/PRODUCTION_EDGE.md used to recommend BEFORE_WEB=2 / PROXY_COUNT=1 behind
# a CDN, reasoning that Next forwards exactly one entry. It forwards N -- see
# `keeps two hops when two are declared` in
# web/app/api/backend/proxy-forwarding.test.ts. These two tests are the
# consequence, in the code that actually reads the header.
# ---------------------------------------------------------------------------

class _Peer:
    host = "10.0.0.9"


class _Request:
    """The two attributes resolve_client_ip touches. Not a real Request."""

    def __init__(self, xff: str):
        self.client = _Peer()
        self.headers = {"x-forwarded-for": xff}


# Next forwarded the rightmost two entries: the client as the CDN reported it,
# then the address our own nginx observed -- which is the CDN.
_CDN_CHAIN = "203.0.113.7, 198.51.100.4"


def test_the_documented_cdn_pair_attributes_every_request_to_the_cdn():
    from app.middleware import resolve_client_ip

    assert resolve_client_ip(_Request(_CDN_CHAIN), 1) == "198.51.100.4"


def test_equal_counts_recover_the_real_client():
    from app.middleware import resolve_client_ip

    assert resolve_client_ip(_Request(_CDN_CHAIN), 2) == "203.0.113.7"
