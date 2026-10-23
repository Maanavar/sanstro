"""A06 — a Redis outage must not grant unlimited authentication attempts (P1).

`RedisRateLimitBackend.check` catches every Redis error and returns
`allowed=True`. `AuthThrottler` uses that same backend for login, registration,
password reset, OAuth and admin elevation, so during an outage the configured
"5 login attempts per minute" became unlimited. The audit injected a failure
and watched all three probe requests pass against a limit of one.

Redis is doing two different jobs here, and the fail-open policy was written
for only one of them. As a cache, recomputing on failure is correct. As the
shared counter behind a security rule, "I cannot check the limit" does not mean
"unlimited attempts are safe".

The startup worker-count guard covers a real configuration case and not this
one: it fires when the process boots with the wrong backend, not when Redis
dies an hour later. `/health/ready` does report Redis as required, but the
supplied nginx configuration proxies everything to web, and an unhealthy
container is not thereby withdrawn from that route.

OWNER DECISION (2026-10-07): auth endpoints return a bounded 503 when their
authoritative limiter cannot be evaluated. Not 401 — the credentials have not
been proven invalid. Not 429 — no limit was actually exceeded. Ordinary cache
misses keep degrading gracefully, and the outer IP limiter keeps failing open,
because it is a different control with a different purpose.

WHAT THIS SUITE CANNOT SEE:
  - the ingress. The acceptance criterion names the whole nginx -> web -> api
    route; these tests drive the API directly, so they prove the application's
    policy and say nothing about whether an unready container still receives
    traffic.
  - a real Redis process dying. The outage is injected by making the client
    raise, which is the failure mode the backend catches, not a partition, a
    timeout, or a half-open socket.
  - recovery. Nothing here asserts the limiter resumes enforcing once Redis
    returns (A06 step 7).
  - the mobile and web clients' reaction to a 503, which must not be a sign-out
    (A06 step 4). That is client-side and is not covered here.
"""
from __future__ import annotations

import logging

import pytest
from fastapi import HTTPException

from app.core.auth_throttle import AuthThrottleAction, AuthThrottler
from app.core.rate_limit import RedisRateLimitBackend, reset_rate_limit_backend

pytestmark = pytest.mark.no_db


class _DeadRedis:
    """A client that fails the way an outage does: every call raises."""

    def pipeline(self):  # noqa: ANN201
        raise ConnectionError("redis is down")

    def zrem(self, *_args, **_kwargs):  # noqa: ANN201
        raise ConnectionError("redis is down")

    def zrange(self, *_args, **_kwargs):  # noqa: ANN201
        raise ConnectionError("redis is down")


def _throttler_with_dead_redis() -> AuthThrottler:
    throttler = AuthThrottler()
    throttler._backend = RedisRateLimitBackend(_DeadRedis())  # noqa: SLF001 — failure injection
    return throttler


class TestBackendReportsUnavailability:
    def setup_method(self):
        reset_rate_limit_backend()

    def test_a_redis_error_is_reported_as_unavailable(self):
        result = RedisRateLimitBackend(_DeadRedis()).check("1.2.3.4", max_requests=1, window_seconds=60)
        assert result.available is False, "the caller cannot choose a policy it cannot see"

    def test_an_unavailable_result_still_reads_as_allowed(self):
        # Deliberate: the global IP middleware is a different control with a
        # different purpose, and it must keep failing open on infrastructure.
        # Only the auth throttler treats `available=False` as a refusal, so the
        # middleware's behaviour is unchanged by this fix.
        result = RedisRateLimitBackend(_DeadRedis()).check("1.2.3.4", max_requests=1, window_seconds=60)
        assert result.allowed is True

    def test_a_healthy_backend_reports_available(self):
        assert AuthThrottler().evaluate(AuthThrottleAction.LOGIN, ip="1.2.3.4").available is True


class TestThrottlerPropagatesUnavailability:
    def setup_method(self):
        reset_rate_limit_backend()

    def test_evaluate_reports_unavailable(self):
        decision = _throttler_with_dead_redis().evaluate(
            AuthThrottleAction.LOGIN, ip="1.2.3.4", account_identifier="probe@example.invalid"
        )
        assert decision.available is False

    def test_the_outage_does_not_silently_allow_repeated_attempts(self):
        # The shape of the original defect: a limit of five, and an outage, and
        # every attempt passing. Ten here, so an off-by-one cannot pass it.
        throttler = _throttler_with_dead_redis()
        refusals = 0
        for _ in range(10):
            try:
                throttler.enforce(
                    AuthThrottleAction.LOGIN, ip="1.2.3.4", account_identifier="probe@example.invalid"
                )
            except HTTPException:
                refusals += 1
        assert refusals == 10


class TestFailurePolicy:
    def setup_method(self):
        reset_rate_limit_backend()

    def test_an_unavailable_limiter_is_a_503_with_retry_guidance(self):
        with pytest.raises(HTTPException) as raised:
            _throttler_with_dead_redis().enforce(AuthThrottleAction.LOGIN, ip="1.2.3.4")

        assert raised.value.status_code == 503
        assert "Retry-After" in (raised.value.headers or {})

    def test_it_is_not_a_401(self):
        # The user's credentials have not been proven invalid, and a client that
        # reads 401 as "signed out" would log them out over an infrastructure
        # failure.
        with pytest.raises(HTTPException) as raised:
            _throttler_with_dead_redis().enforce(AuthThrottleAction.LOGIN, ip="1.2.3.4")
        assert raised.value.status_code != 401

    def test_it_is_not_a_429(self):
        # 429 is reserved for a limit that was actually exceeded. Reporting one
        # here would tell an operator the opposite of what happened.
        with pytest.raises(HTTPException) as raised:
            _throttler_with_dead_redis().enforce(AuthThrottleAction.LOGIN, ip="1.2.3.4")
        assert raised.value.status_code != 429

    def test_an_exceeded_limit_is_still_a_429(self):
        throttler = AuthThrottler()
        for _ in range(3):
            throttler.enforce(AuthThrottleAction.REGISTER, ip="9.9.9.9")

        with pytest.raises(HTTPException) as raised:
            throttler.enforce(AuthThrottleAction.REGISTER, ip="9.9.9.9")

        assert raised.value.status_code == 429
        assert raised.value.detail == "Too many registration attempts. Please try again later."

    def test_a_request_within_budget_raises_nothing(self):
        AuthThrottler().enforce(AuthThrottleAction.LOGIN, ip="8.8.8.8", account_identifier="ok@example.invalid")

    @pytest.mark.parametrize(
        "action",
        [
            AuthThrottleAction.LOGIN,
            AuthThrottleAction.REGISTER,
            AuthThrottleAction.FORGOT_PASSWORD,
            AuthThrottleAction.OAUTH,
            AuthThrottleAction.ADMIN_ELEVATION,
        ],
    )
    def test_every_protected_action_refuses_during_an_outage(self, action):
        # All five, not just login: the finding is about the control, and an
        # action added later with no policy would be the same bug again.
        with pytest.raises(HTTPException) as raised:
            _throttler_with_dead_redis().enforce(action, ip="1.2.3.4")
        assert raised.value.status_code == 503


class TestRecovery:
    def setup_method(self):
        reset_rate_limit_backend()

    def test_enforcement_resumes_when_redis_returns(self):
        """A06 step 7: the process must not stay degraded after recovery.

        Each check attempts the pipeline afresh, so a backend that failed once
        is not poisoned — which is worth pinning, because the sibling path has
        the opposite property: `get_rate_limit_backend` is `lru_cache`d, so a
        process that *starts* with Redis unreachable falls back to the
        in-memory limiter and stays there until it is restarted. That is a
        startup decision, not this one, and it is recorded here so the
        difference is not rediscovered during an incident.
        """

        class _FlakyRedis:
            def __init__(self) -> None:
                self.healthy = False
                self._zset: dict[str, float] = {}

            def pipeline(self):  # noqa: ANN202
                if not self.healthy:
                    raise ConnectionError("redis is down")
                outer = self

                class _Pipe:
                    def __init__(self) -> None:
                        self._added = 0

                    def zremrangebyscore(self, *_a, **_k) -> None: ...
                    def zadd(self, _key, mapping) -> None:  # noqa: ANN001
                        outer._zset.update(mapping)
                        self._added = len(outer._zset)

                    def zcard(self, *_a, **_k) -> None: ...
                    def expire(self, *_a, **_k) -> None: ...
                    def execute(self):  # noqa: ANN202
                        return [0, 1, self._added, True]

                return _Pipe()

        client = _FlakyRedis()
        throttler = AuthThrottler()
        throttler._backend = RedisRateLimitBackend(client)  # noqa: SLF001 — failure injection

        with pytest.raises(HTTPException) as raised:
            throttler.enforce(AuthThrottleAction.LOGIN, ip="1.2.3.4")
        assert raised.value.status_code == 503

        client.healthy = True

        # No restart, no cache reset: the very next request is enforced again.
        throttler.enforce(AuthThrottleAction.LOGIN, ip="1.2.3.4")
        assert throttler.evaluate(AuthThrottleAction.LOGIN, ip="1.2.3.4").available is True


class TestDegradationIsObservable:
    def setup_method(self):
        reset_rate_limit_backend()

    def test_the_outage_is_logged_as_enforcement_degradation(self, caplog):
        # "Instrumentation that nobody receives is not an operational control",
        # so at minimum the event has a stable name to alert on.
        with caplog.at_level(logging.ERROR, logger="app.core.auth_throttle"):
            with pytest.raises(HTTPException):
                _throttler_with_dead_redis().enforce(AuthThrottleAction.LOGIN, ip="1.2.3.4")

        assert "auth_throttle_limiter_unavailable" in " ".join(r.message for r in caplog.records)
