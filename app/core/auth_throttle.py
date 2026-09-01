"""Auth-specific request throttling.

Provides per-account and per-IP throttling for authentication endpoints (login, register,
forgot-password) to prevent credential abuse and brute-force attacks.

Uses the same pluggable backend as the global rate limiter, delegating to Redis for
cluster-wide enforcement when available.
"""
from __future__ import annotations

import logging
from enum import Enum

from app.core.rate_limit import get_rate_limit_backend

logger = logging.getLogger(__name__)


class AuthThrottleAction(str, Enum):
    """Auth endpoints that have throttle protection."""
    LOGIN = "login"
    REGISTER = "register"
    FORGOT_PASSWORD = "forgot_password"  # noqa: S105 — an endpoint name, not a credential
    OAUTH = "oauth"


class AuthThrottler:
    """Enforces per-account and per-IP throttling for auth endpoints.

    Each auth action has two throttle keys:
    - IP-level: ``auth:IP:<action>:<ip>`` — blocks repeated attempts from one IP across accounts
    - Account-level: ``auth:account:<action>:<email>`` — blocks repeated attempts on one account from any IP

    Both must pass for the request to be allowed. Failure returns HTTP 429.
    """

    # Throttle budgets per minute (tight for auth endpoints)
    _THROTTLE_CONFIG = {
        AuthThrottleAction.LOGIN: {"max_requests": 5, "window_seconds": 60},
        AuthThrottleAction.REGISTER: {"max_requests": 3, "window_seconds": 60},
        AuthThrottleAction.FORGOT_PASSWORD: {"max_requests": 3, "window_seconds": 60},
        AuthThrottleAction.OAUTH: {"max_requests": 10, "window_seconds": 60},
    }

    def __init__(self) -> None:
        self._backend = get_rate_limit_backend()

    def check(self, action: AuthThrottleAction, ip: str, account_identifier: str | None = None) -> tuple[bool, int]:
        """Check if the request is allowed.

        Args:
            action: The auth action being throttled.
            ip: The client IP address.
            account_identifier: Email or user ID for account-level throttling. If None, only IP-level is checked.

        Returns:
            A tuple of (allowed: bool, retry_after: int in seconds).
        """
        config = self._THROTTLE_CONFIG[action]
        max_requests = config["max_requests"]
        window_seconds = config["window_seconds"]

        # Check IP-level throttle
        ip_key = f"auth:IP:{action.value}:{ip}"
        ip_result = self._backend.check(ip_key, max_requests, window_seconds)
        if not ip_result.allowed:
            logger.warning("auth_ip_throttle action=%s ip=%s", action.value, ip)
            return False, ip_result.retry_after

        # Check account-level throttle (if identifier provided)
        if account_identifier:
            account_key = f"auth:account:{action.value}:{account_identifier}"
            account_result = self._backend.check(account_key, max_requests, window_seconds)
            if not account_result.allowed:
                logger.warning("auth_account_throttle action=%s account=%s", action.value, account_identifier)
                return False, account_result.retry_after

        return True, 0


def get_auth_throttler() -> AuthThrottler:
    """Return a shared AuthThrottler instance."""
    return AuthThrottler()
