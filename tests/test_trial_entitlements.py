"""Trial and entitlement access through `limits_for_user` (admin spec L1, ARC-03).

`limits_for_user` is the one reader every cap and feature gate asks. These
tests pin its order — premium (subscription, purchase, grant), then trial, then
open beta, then registered — against real rows, plus the trial's own rules:
seven days, once per account, never during the beta.

BLIND SPOT: `limits_for_user` is checked directly and through `/auth/me`. A
route that reads `is_premium` instead of `limits_for_user` would ignore the
trial and is not seen here; tests/test_entitlements.py's feature-gate tests
and the grep in this file's last test cover the routes known today.
"""
from __future__ import annotations

import dataclasses
from datetime import UTC, datetime, timedelta
from pathlib import Path
from uuid import uuid4

import pytest
from sqlalchemy.exc import IntegrityError

from app.core.config import get_settings
from app.core.subscription import access_for_user, limits_for_user
from app.core.tier_limits import OPEN_BETA_LIMITS, TIER_LIMITS, TRIAL_LIMITS
from app.db.session import SessionLocal
from app.models.entitlement import Entitlement
from app.models.subscription import Subscription
from app.models.user import User
from app.services.entitlement_service import TRIAL_LENGTH, start_trial_if_eligible


@pytest.fixture()
def beta(monkeypatch):
    def _set(on: bool) -> None:
        monkeypatch.setattr(get_settings(), "open_beta", on)

    return _set


def _user() -> object:
    user_id = uuid4()
    with SessionLocal() as session, session.begin():
        session.add(User(user_id=user_id, email=f"trial-{uuid4().hex}@example.invalid"))
    return user_id


def _add(user_id, **fields) -> None:
    now = datetime.now(UTC)
    row = {"key": "premium", "source": "trial", "starts_at": now, "ends_at": now + TRIAL_LENGTH} | fields
    with SessionLocal() as session, session.begin():
        session.add(Entitlement(user_id=user_id, **row))


def _limits(user_id):
    with SessionLocal() as session:
        return limits_for_user(user_id, session)


def _state(user_id) -> str:
    with SessionLocal() as session:
        return access_for_user(user_id, session).state


# ── The trial's allowance ────────────────────────────────────────────────────


@pytest.mark.no_db
def test_trial_is_premium_features_with_a_smaller_paid_allowance():
    differing = {
        f.name
        for f in dataclasses.fields(TRIAL_LIMITS)
        if getattr(TRIAL_LIMITS, f.name) != getattr(TIER_LIMITS["premium"], f.name)
    }
    assert differing == {
        "ask_vinaadi_daily_limit",
        "ask_vinaadi_topup_enabled",
        "detailed_reports_monthly_included",
        "porutham_reports_monthly_included",
    }
    assert TRIAL_LIMITS.ask_vinaadi_daily_limit == 3
    assert TRIAL_LIMITS.ask_vinaadi_monthly_limit is None
    assert TRIAL_LIMITS.ask_vinaadi_topup_enabled is False
    assert TRIAL_LIMITS.detailed_reports_monthly_included == 0
    assert TRIAL_LIMITS.porutham_reports_monthly_included == 0


# ── Resolution order ─────────────────────────────────────────────────────────


def test_an_active_trial_gets_trial_limits(raw_client, beta):
    beta(False)
    user_id = _user()
    _add(user_id)
    assert _limits(user_id) is TRIAL_LIMITS
    assert _state(user_id) == "trial"


def test_a_trial_outranks_the_open_beta(raw_client, beta):
    beta(True)
    user_id = _user()
    _add(user_id)
    assert _limits(user_id) is TRIAL_LIMITS


def test_an_ended_trial_falls_back_to_registered_or_beta(raw_client, beta):
    user_id = _user()
    past = datetime.now(UTC) - timedelta(days=10)
    _add(user_id, starts_at=past, ends_at=past + TRIAL_LENGTH)
    beta(False)
    assert _limits(user_id) is TIER_LIMITS["registered"]
    assert _state(user_id) == "free"
    beta(True)
    assert _limits(user_id) is OPEN_BETA_LIMITS


def test_a_revoked_trial_grants_nothing(raw_client, beta):
    beta(False)
    user_id = _user()
    _add(user_id, revoked_at=datetime.now(UTC), revoked_reason="test")
    assert _limits(user_id) is TIER_LIMITS["registered"]


def test_a_premium_grant_outranks_a_trial(raw_client, beta):
    beta(False)
    user_id = _user()
    _add(user_id)
    _add(user_id, source="grant", ends_at=datetime.now(UTC) + timedelta(days=30))
    assert _limits(user_id) is TIER_LIMITS["premium"]
    assert _state(user_id) == "premium"


def test_a_subscription_outranks_a_trial(raw_client, beta):
    beta(False)
    user_id = _user()
    _add(user_id)
    with SessionLocal() as session, session.begin():
        session.add(
            Subscription(
                user_id=user_id,
                tier="premium",
                status="active",
                current_period_end=datetime.now(UTC) + timedelta(days=30),
            )
        )
    assert _limits(user_id) is TIER_LIMITS["premium"]
    assert _state(user_id) == "premium"


def test_a_future_grant_is_not_active_yet(raw_client, beta):
    beta(False)
    user_id = _user()
    soon = datetime.now(UTC) + timedelta(days=1)
    _add(user_id, source="grant", starts_at=soon, ends_at=soon + timedelta(days=30))
    assert _limits(user_id) is TIER_LIMITS["registered"]


# ── start_trial_if_eligible ──────────────────────────────────────────────────


def _start(user_id):
    with SessionLocal() as session, session.begin():
        return start_trial_if_eligible(session, session.get(User, user_id)) is not None


def test_a_trial_starts_once_per_account_even_after_it_ends(raw_client, beta):
    beta(False)
    user_id = _user()
    assert _start(user_id) is True
    with SessionLocal() as session, session.begin():
        row = session.query(Entitlement).filter(Entitlement.user_id == user_id).one()
        row.ends_at = datetime.now(UTC) - timedelta(seconds=1)
    assert _start(user_id) is False
    assert _state(user_id) == "free"


def test_the_database_refuses_a_second_trial_row(raw_client):
    """The partial unique index, not only the service, holds 'once per account'."""
    user_id = _user()
    _add(user_id)
    with pytest.raises(IntegrityError):
        _add(user_id)


def test_no_trial_during_the_open_beta(raw_client, beta):
    beta(True)
    user_id = _user()
    assert _start(user_id) is False


def test_no_trial_for_an_account_that_already_has_premium(raw_client, beta):
    beta(False)
    user_id = _user()
    _add(user_id, source="grant", ends_at=datetime.now(UTC) + timedelta(days=30))
    assert _start(user_id) is False


def test_the_database_refuses_an_unknown_source(raw_client):
    user_id = _user()
    with pytest.raises(IntegrityError):
        _add(user_id, source="subscription")


# ── Nobody gates on the subscription fact alone ──────────────────────────────


@pytest.mark.no_db
def test_no_route_or_service_decides_access_from_is_premium_alone():
    """`is_premium` ignores trials and grants. Its callers are pinned so a new
    one has to be looked at: a gate built on it would lock out a trial user."""
    root = Path(__file__).resolve().parents[1] / "app"
    callers = sorted(
        str(path.relative_to(root.parent)).replace("\\", "/")
        for path in root.rglob("*.py")
        if any(
            "is_premium(" in line and not line.lstrip().startswith("#")
            for line in path.read_text(encoding="utf-8").splitlines()
        )
    )
    assert callers == [
        "app/core/subscription.py",
        "app/schemas/auth.py",
        "app/services/ask_vinaadi_usage_service.py",
        "app/services/entitlement_service.py",
        # Refuses a second subscription: a question about subscriptions, not access.
        "app/services/payment_service.py",
    ], callers
