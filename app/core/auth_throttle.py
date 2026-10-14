"""Auth-specific request throttling.

Provides per-account and per-IP throttling for authentication endpoints (login, register,
forgot-password) to prevent credential abuse and brute-force attacks.

Uses the same pluggable backend as the global rate limiter, delegating to Redis for
cluster-wide enforcement when available.

A06 — WHAT HAPPENS WHEN THE LIMITER CANNOT BE EVALUATED
-------------------------------------------------------
``RedisRateLimitBackend`` catches every Redis error and returns ``allowed=True``.
That is right for the global IP middleware, which is an aggregate control where
locking everyone out over an infrastructure fault is the worse trade. It was
wrong here: during an outage the configured five-logins-per-minute became
unlimited, and the audit watched three probe requests pass against a limit of
one.

Redis is doing two jobs. As a cache, recomputing on failure is correct. As the
shared counter behind a security rule, "I cannot check the limit" is not "no
limit applies".

So the limiter now *reports* three outcomes — allowed, denied, unavailable —
and this module owns the policy for the operations it protects.

OWNER DECISION (2026-10-07): a bounded 503 when the authoritative limiter is
unavailable.

  - not 401: the user's credentials have not been proven invalid, and a client
    that reads 401 as "signed out" would log people out over a Redis fault;
  - not 429: that is reserved for a limit genuinely exceeded, and reporting it
    here would tell an operator the opposite of what happened.

The availability cost is deliberate and is the point of the ruling: sign-in is
unavailable during a Redis outage, rather than unlimited.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass
from enum import Enum

from fastapi import HTTPException, status

from app.core.rate_limit import get_rate_limit_backend

logger = logging.getLogger(__name__)

#: How long a caller should wait before retrying a temporarily unenforceable
#: control. Short, because a Redis outage is usually brief and a long value
#: invites clients to give up on the account entirely.
UNAVAILABLE_RETRY_AFTER_SECONDS = 15


class AuthThrottleAction(str, Enum):
    """Auth endpoints that have throttle protection."""
    LOGIN = "login"
    REGISTER = "register"
    FORGOT_PASSWORD = "forgot_password"  # noqa: S105 — an endpoint name, not a credential
    OAUTH = "oauth"
    ADMIN_ELEVATION = "admin_elevation"


@dataclass(frozen=True)
class _Budget:
    """One action's limit and the message for exceeding it.

    A typed record rather than a `dict[str, int | str]`: the heterogeneous dict
    this replaced inferred as `object`, so every read needed an `int(...)` or
    `str(...)` cast that mypy could not check and a reader could not trust.
    """

    max_requests: int
    window_seconds: int
    too_many_detail: str


@dataclass(frozen=True)
class AuthThrottleDecision:
    """What the limiter found. The policy for acting on it lives in `enforce`."""

    allowed: bool
    retry_after: int
    #: False when a backend error meant no limit could be evaluated.
    available: bool = True


class AuthThrottler:
    """Enforces per-account and per-IP throttling for auth endpoints.

    Each auth action has two throttle keys:
    - IP-level: ``auth:IP:<action>:<ip>`` — blocks repeated attempts from one IP across accounts
    - Account-level: ``auth:account:<action>:<email>`` — blocks repeated attempts on one account from any IP

    Both must pass for the request to be allowed. Failure returns HTTP 429; an
    unevaluable limiter returns HTTP 503 (see the module docstring).
    """

    # Throttle budgets per minute (tight for auth endpoints), and the message
    # for an exceeded budget.
    #
    # The message lives here because it is a property of the action, not of the
    # call site: all nine endpoints that throttle were raising their own
    # identical `HTTPException(429, …)` block, five lines each, which is how a
    # single policy came to be stated nine times and changeable in eight of them
    # without the ninth.
    _THROTTLE_CONFIG: dict[AuthThrottleAction, _Budget] = {
        AuthThrottleAction.LOGIN: _Budget(
            5, 60, "Too many login attempts. Please try again later."
        ),
        AuthThrottleAction.REGISTER: _Budget(
            3, 60, "Too many registration attempts. Please try again later."
        ),
        AuthThrottleAction.FORGOT_PASSWORD: _Budget(
            3, 60, "Too many password reset attempts. Please try again later."
        ),
        AuthThrottleAction.OAUTH: _Budget(
            10, 60, "Too many sign-in attempts. Please try again later."
        ),
        # Tighter than LOGIN. The caller is already an authenticated admin, so a
        # legitimate operator needs one attempt and a typo needs two; anything
        # approaching five is someone with a stolen session guessing the password
        # that stands between them and the destructive endpoints.
        AuthThrottleAction.ADMIN_ELEVATION: _Budget(
            3, 60, "Too many elevation attempts. Please try again later."
        ),
    }

    def __init__(self) -> None:
        self._backend = get_rate_limit_backend()

    def evaluate(
        self,
        action: AuthThrottleAction,
        ip: str,
        account_identifier: str | None = None,
    ) -> AuthThrottleDecision:
        """Measure the limits for this request without deciding what to do.

        Args:
            action: The auth action being throttled.
            ip: The client IP address.
            account_identifier: Email or user ID for account-level throttling. If None, only IP-level is checked.
        """
        budget = self._THROTTLE_CONFIG[action]
        max_requests = budget.max_requests
        window_seconds = budget.window_seconds

        # Check IP-level throttle
        ip_key = f"auth:IP:{action.value}:{ip}"
        ip_result = self._backend.check(ip_key, max_requests, window_seconds)
        if not getattr(ip_result, "available", True):
            return AuthThrottleDecision(
                allowed=False, retry_after=UNAVAILABLE_RETRY_AFTER_SECONDS, available=False
            )
        if not ip_result.allowed:
            logger.warning("auth_ip_throttle action=%s ip=%s", action.value, ip)
            return AuthThrottleDecision(allowed=False, retry_after=ip_result.retry_after)

        # Check account-level throttle (if identifier provided)
        if account_identifier:
            account_key = f"auth:account:{action.value}:{account_identifier}"
            account_result = self._backend.check(account_key, max_requests, window_seconds)
            if not getattr(account_result, "available", True):
                return AuthThrottleDecision(
                    allowed=False, retry_after=UNAVAILABLE_RETRY_AFTER_SECONDS, available=False
                )
            if not account_result.allowed:
                logger.warning("auth_account_throttle action=%s account=%s", action.value, account_identifier)
                return AuthThrottleDecision(allowed=False, retry_after=account_result.retry_after)

        return AuthThrottleDecision(allowed=True, retry_after=0)

    def enforce(
        self,
        action: AuthThrottleAction,
        ip: str,
        account_identifier: str | None = None,
    ) -> None:
        """Apply the failure policy. Raises, or returns having allowed the request.

        Replaces the ``check()`` + hand-rolled ``raise HTTPException(429, …)``
        pair that every protected endpoint carried. That shape is why A06 is a
        single finding with nine call sites: the policy for an unevaluable
        limiter has to exist in one place, or eight endpoints get it and the
        ninth quietly keeps failing open.
        """
        decision = self.evaluate(action, ip=ip, account_identifier=account_identifier)

        if not decision.available:
            # A named, stable event: this is the signal that the control is not
            # being enforced, which is the thing an operator must be paged on.
            # No account identifier — an alertable signal does not need to carry
            # the email of whoever happened to be signing in.
            logger.error(
                "auth_throttle_limiter_unavailable action=%s; refusing the request", action.value
            )
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Sign-in is temporarily unavailable. Please try again shortly.",
                headers={"Retry-After": str(decision.retry_after)},
            )

        if not decision.allowed:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=self._THROTTLE_CONFIG[action].too_many_detail,
                headers={"Retry-After": str(decision.retry_after)},
            )


def get_auth_throttler() -> AuthThrottler:
    """Return a shared AuthThrottler instance."""
    return AuthThrottler()
