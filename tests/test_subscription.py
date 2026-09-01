"""Unit tests for app.core.subscription.is_premium().

These tests use the no_db marker — they bypass the DB and mock the ORM
query directly so they run offline (SQLite/no container required).
"""
from unittest.mock import MagicMock, patch
from uuid import UUID

import pytest

from app.core.subscription import is_premium
from app.models.subscription import Subscription

USER_ID = UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")


def _make_sub(tier: str, status: str = "active") -> Subscription:
    sub = MagicMock(spec=Subscription)
    sub.tier = tier
    sub.status = status
    return sub


def _db_returning(sub: Subscription | None) -> MagicMock:
    """Return a mock Session whose .query(...).filter(...).first() returns sub."""
    db = MagicMock()
    db.query.return_value.filter.return_value.first.return_value = sub
    return db


# ── Premium tiers ────────────────────────────────────────────────────────────


@pytest.mark.no_db
def test_premium_tier_grants_access():
    db = _db_returning(_make_sub("premium"))
    assert is_premium(USER_ID, db) is True


@pytest.mark.no_db
def test_trial_tier_grants_access():
    """Active trial subscription should be treated as premium."""
    db = _db_returning(_make_sub("trial"))
    assert is_premium(USER_ID, db) is True


# ── Non-premium tiers ────────────────────────────────────────────────────────


@pytest.mark.no_db
@pytest.mark.parametrize("tier", ["free", "none", "trial_expired", "cancelled"])
def test_non_premium_tiers_deny_access(tier: str):
    db = _db_returning(_make_sub(tier))
    assert is_premium(USER_ID, db) is False


@pytest.mark.no_db
def test_no_subscription_row_denies_access():
    db = _db_returning(None)
    assert is_premium(USER_ID, db) is False


@pytest.mark.no_db
def test_inactive_premium_row_denies_access():
    """status='inactive' rows are filtered out by the query; is_premium returns False."""
    # The real query filters WHERE status='active', so an inactive row returns None.
    db = _db_returning(None)
    assert is_premium(USER_ID, db) is False


@pytest.mark.no_db
def test_whitespace_tier_is_handled():
    """Tier value with surrounding whitespace should still be checked correctly."""
    db = _db_returning(_make_sub("  cancelled  "))
    assert is_premium(USER_ID, db) is False


@pytest.mark.no_db
def test_empty_tier_denies_access():
    db = _db_returning(_make_sub(""))
    assert is_premium(USER_ID, db) is False
