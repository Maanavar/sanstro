"""Open beta (owner ruling 2026-09-26, GRW-05).

While `settings.open_beta` is on, every signed-in account is held to premium's
limits — /beta promises "every feature is unlocked", and before this the server
still capped a free account at 3 profiles, 1 vault member and 3 goals. Ask
Vinaadi is the one exception: it costs money per answer, so it keeps the
registered daily cap as a fair-use limit.

`tier` on /auth/me stays the subscription fact; `openBeta` rides beside it.
"""
from __future__ import annotations

import dataclasses
import math
from types import SimpleNamespace
from unittest.mock import MagicMock
from uuid import UUID

import pytest

from app.core import subscription
from app.core.config import get_settings
from app.core.subscription import limits_for_user
from app.core.tier_limits import OPEN_BETA_LIMITS, TIER_LIMITS

USER_ID = UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")
_ASK_FIELDS = {"ask_vinaadi_daily_limit", "ask_vinaadi_monthly_limit", "ask_vinaadi_topup_enabled"}


def _beta(monkeypatch: pytest.MonkeyPatch, on: bool) -> None:
    monkeypatch.setattr(subscription, "get_settings", lambda: SimpleNamespace(open_beta=on))


def _premium(monkeypatch: pytest.MonkeyPatch, premium: bool) -> None:
    monkeypatch.setattr(subscription, "is_premium", lambda _uid, _db: premium)


# ── Limit resolution ─────────────────────────────────────────────────────────


@pytest.mark.no_db
def test_beta_account_gets_premium_limits(monkeypatch: pytest.MonkeyPatch) -> None:
    _beta(monkeypatch, True)
    _premium(monkeypatch, False)
    lim = limits_for_user(USER_ID, MagicMock())
    assert lim is OPEN_BETA_LIMITS
    assert math.isinf(lim.birth_profiles_max)
    assert lim.family_vault_profiles_max == TIER_LIMITS["premium"].family_vault_profiles_max
    assert math.isinf(lim.goals_max)


@pytest.mark.no_db
def test_beta_off_restores_the_registered_caps(monkeypatch: pytest.MonkeyPatch) -> None:
    _beta(monkeypatch, False)
    _premium(monkeypatch, False)
    assert limits_for_user(USER_ID, MagicMock()) is TIER_LIMITS["registered"]


@pytest.mark.no_db
def test_a_subscriber_gets_premium_whether_or_not_the_beta_runs(monkeypatch: pytest.MonkeyPatch) -> None:
    _premium(monkeypatch, True)
    for on in (True, False):
        _beta(monkeypatch, on)
        assert limits_for_user(USER_ID, MagicMock()) is TIER_LIMITS["premium"]


@pytest.mark.no_db
def test_beta_differs_from_premium_only_in_ask_vinaadi() -> None:
    """Every feature premium unlocks, the beta unlocks — the only departure is
    the per-call-cost feature, and a new TierLimits field defaults to premium's."""
    differing = {
        f.name
        for f in dataclasses.fields(OPEN_BETA_LIMITS)
        if getattr(OPEN_BETA_LIMITS, f.name) != getattr(TIER_LIMITS["premium"], f.name)
    }
    assert differing <= _ASK_FIELDS


@pytest.mark.no_db
def test_beta_ask_cap_costs_no_more_than_the_free_tier_did() -> None:
    assert OPEN_BETA_LIMITS.ask_vinaadi_daily_limit == TIER_LIMITS["registered"].ask_vinaadi_daily_limit
    assert OPEN_BETA_LIMITS.ask_vinaadi_monthly_limit is None
    assert OPEN_BETA_LIMITS.ask_vinaadi_topup_enabled is False


@pytest.mark.no_db
def test_beta_is_not_a_tier() -> None:
    """TIER_LIMITS is pinned to tiers.ts by test_tier_parity; the beta is not sold."""
    assert set(TIER_LIMITS) == {"guest", "registered", "premium"}


# ── What the clients are told ────────────────────────────────────────────────


def _register_and_login(raw_client, email: str) -> str:
    assert raw_client.post(
        "/api/v1/auth/register", json={"email": email, "password": "password123", "consentGiven": True}
    ).status_code == 200
    login = raw_client.post("/api/v1/auth/login", json={"email": email, "password": "password123"})
    assert login.status_code == 200
    return login.json()["userId"]


def test_auth_me_reports_the_beta_beside_the_true_tier(raw_client) -> None:
    _register_and_login(raw_client, "openbeta-me@example.com")
    me = raw_client.get("/api/v1/auth/me").json()
    assert me["openBeta"] is True
    # The beta unlocks limits; it does not make anyone a subscriber.
    assert me["tier"] == "registered"


def test_auth_me_reports_no_beta_once_it_ends(raw_client, monkeypatch: pytest.MonkeyPatch) -> None:
    _register_and_login(raw_client, "openbeta-off@example.com")
    monkeypatch.setattr(get_settings(), "open_beta", False)
    assert raw_client.get("/api/v1/auth/me").json()["openBeta"] is False


def test_ask_status_marks_the_cap_as_fair_use_not_a_paywall(raw_client) -> None:
    _register_and_login(raw_client, "openbeta-ask@example.com")
    status = raw_client.get("/api/v1/ask-vinaadi/daily-status").json()
    assert status["openBeta"] is True
    assert status["isPremium"] is False
    assert status["dailyLimit"] == OPEN_BETA_LIMITS.ask_vinaadi_daily_limit
    assert status["chipsRemaining"] == OPEN_BETA_LIMITS.ask_vinaadi_daily_limit


def test_ask_status_keys_match_the_shared_interface(raw_client) -> None:
    """The route has no response_model, so test_api_wrapper_field_contract skips
    it — and `AskVinaadiDailyStatus` declared a field it never sent, which hid
    mobile's limit bar. This pins the keys to packages/shared/src/api/askVinaadi.ts."""
    _register_and_login(raw_client, "openbeta-keys@example.com")
    status = raw_client.get("/api/v1/ask-vinaadi/daily-status").json()
    assert set(status) == {"chipsUsed", "chipsRemaining", "isPremium", "openBeta", "dailyLimit", "monthlyLimit"}
