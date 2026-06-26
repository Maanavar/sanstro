"""Tests for auth endpoint throttling.

Covers per-IP and per-account rate limiting for login, register, and forgot-password.
"""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.core.auth_throttle import AuthThrottleAction, AuthThrottler
from app.core.rate_limit import reset_rate_limit_backend
from app.main import app

pytestmark = pytest.mark.no_db


class TestAuthThrottler:
    """Unit tests for the AuthThrottler class (no DB needed)."""

    def setup_method(self):
        """Reset rate limit backend before each test method."""
        reset_rate_limit_backend()

    def test_throttler_allows_requests_within_budget(self):
        throttler = AuthThrottler()
        ip = "1.2.3.4"
        email = "user@example.com"

        for i in range(5):  # Login allows 5 per minute
            allowed, retry_after = throttler.check(AuthThrottleAction.LOGIN, ip=ip, account_identifier=email)
            assert allowed is True, f"Request {i + 1} should be allowed"
            assert retry_after == 0

    def test_throttler_blocks_after_ip_budget_exceeded(self):
        throttler = AuthThrottler()
        ip = "1.2.3.4"
        email = "user@example.com"

        # Exhaust IP budget
        for _ in range(5):
            throttler.check(AuthThrottleAction.LOGIN, ip=ip, account_identifier=email)

        # 6th request should be blocked
        allowed, retry_after = throttler.check(AuthThrottleAction.LOGIN, ip=ip, account_identifier=email)
        assert allowed is False
        assert retry_after >= 1

    def test_throttler_blocks_after_account_budget_exceeded(self):
        throttler = AuthThrottler()
        email = "user@example.com"

        # Exhaust account budget using different IPs
        for i in range(5):
            ip = f"1.2.3.{i}"
            throttler.check(AuthThrottleAction.LOGIN, ip=ip, account_identifier=email)

        # 6th request from yet another IP should be blocked (account budget exhausted)
        allowed, retry_after = throttler.check(AuthThrottleAction.LOGIN, ip="1.2.3.99", account_identifier=email)
        assert allowed is False
        assert retry_after >= 1

    def test_throttler_different_actions_have_separate_budgets(self):
        throttler = AuthThrottler()
        ip = "1.2.3.4"

        # Exhaust LOGIN budget (5 per minute)
        for _ in range(5):
            throttler.check(AuthThrottleAction.LOGIN, ip=ip, account_identifier="user1@example.com")

        # LOGIN should be blocked
        allowed, _ = throttler.check(AuthThrottleAction.LOGIN, ip=ip, account_identifier="user2@example.com")
        assert allowed is False

        # But REGISTER should still work (separate budget)
        allowed, _ = throttler.check(AuthThrottleAction.REGISTER, ip=ip, account_identifier="user3@example.com")
        assert allowed is True

    def test_throttler_register_has_tighter_budget_than_login(self):
        throttler = AuthThrottler()
        ip = "1.2.3.4"

        # Register allows 3 per minute
        for _ in range(3):
            allowed, _ = throttler.check(AuthThrottleAction.REGISTER, ip=ip, account_identifier=f"user{_}@example.com")
            assert allowed is True

        # 4th register should be blocked
        allowed, _ = throttler.check(AuthThrottleAction.REGISTER, ip=ip, account_identifier="user4@example.com")
        assert allowed is False

    def test_throttler_no_account_identifier_only_checks_ip(self):
        throttler = AuthThrottler()
        ip = "1.2.3.4"

        # Without account identifier, only IP is checked
        for _ in range(5):
            allowed, _ = throttler.check(AuthThrottleAction.LOGIN, ip=ip)
            assert allowed is True

        # 6th should be blocked (IP budget)
        allowed, _ = throttler.check(AuthThrottleAction.LOGIN, ip=ip)
        assert allowed is False


