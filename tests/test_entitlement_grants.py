"""The ARC-43 class of bug: a configured grant that grants nothing (ruled 2026-11-04).

`products.entitlement_keys` was declared and never read, so a one-time SKU
configured with one granted nothing — silently. The fix is in
`app/services/payment_service.py` and its acceptance tests live in
`tests/test_razorpay_payments.py`. This file gates the *class* rather than the
instance: every path that can write an `entitlements` row is held to the set of
keys a reader actually branches on, so the next key someone invents cannot
repeat the silence one layer along.

BLIND SPOT: these tests prove a key outside `GRANTABLE_KEYS` grants no *access
state*. They do not prove the row is useless — a future reader could branch on
`entitlements.key` without being added here, and these tests would still pass
while the set went stale in the other direction. Only the key-by-key behaviour
below, plus a reviewer reading `entitlement_access`, covers that.
"""
from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import get_args
from uuid import uuid4

import pytest
from sqlalchemy.exc import IntegrityError

from app.api.admin_support import GrantRequest
from app.core.entitlement_access import GRANTABLE_KEYS, entitlement_access
from app.db.session import SessionLocal
from app.models.entitlement import Entitlement
from app.models.payment import Product
from app.models.user import User

#: Keys the product catalogue or an admin might plausibly be configured with
#: that no reader knows about. Each must leave access untouched.
_UNREAD_KEYS = ("varshaphala", "vargas", "reports", "premium_plus")


def _user() -> object:
    user_id = uuid4()
    with SessionLocal() as session, session.begin():
        session.add(User(user_id=user_id, email=f"grant-{uuid4().hex}@example.invalid"))
    return user_id


def _grant(user_id, key: str) -> None:
    now = datetime.now(UTC)
    with SessionLocal() as session, session.begin():
        session.add(
            Entitlement(
                user_id=user_id,
                key=key,
                source="purchase",
                source_id=str(uuid4()),
                starts_at=now,
                ends_at=now + timedelta(days=30),
            )
        )


def _state(user_id) -> str:
    with SessionLocal() as session:
        return entitlement_access(session, user_id).state


# ── The grantable set is the set some reader acts on ─────────────────────────


@pytest.mark.parametrize("key", sorted(GRANTABLE_KEYS))
def test_every_grantable_key_changes_what_a_reader_reports(raw_client, key: str) -> None:
    """A key in the set must *do* something. This is the gate ARC-43 lacked."""
    user_id = _user()
    assert _state(user_id) == "free"
    _grant(user_id, key)
    assert _state(user_id) != "free", f"{key!r} is grantable but no reader acts on it"


@pytest.mark.parametrize("key", _UNREAD_KEYS)
def test_a_key_outside_the_set_grants_nothing(raw_client, key: str) -> None:
    """Why the writers validate: this row looks right and hands over nothing."""
    assert key not in GRANTABLE_KEYS
    user_id = _user()
    _grant(user_id, key)
    assert _state(user_id) == "free"


@pytest.mark.no_db
def test_the_courtesy_grant_accepts_exactly_the_grantable_keys() -> None:
    """The admin console cannot grant a key the purchase path would refuse."""
    allowed = set(get_args(GrantRequest.model_fields["key"].annotation))
    assert allowed == set(GRANTABLE_KEYS)


# ── A subscription SKU can never mint an entitlement (ARC-13) ────────────────


def test_the_database_refuses_entitlement_grants_on_a_subscription_sku(raw_client) -> None:
    """One owner for subscription access, enforced rather than documented.

    A subscription's period end is the provider's fact and `subscriptions` is
    where it lives. A product row that also minted an entitlement would give
    "does this user have access" two answers that drift on every renewal.
    """
    with pytest.raises(IntegrityError), SessionLocal() as session, session.begin():
        session.add(
            Product(
                sku=f"sub-{uuid4().hex[:8]}",
                kind="subscription",
                name_en="Premium, monthly",
                name_ta="பிரீமியம்",
                price_inr_paise=14900,
                billing_period="month",
                entitlement_grants={"premium": 30},
                credit_grants={},
                active=False,
            )
        )


def test_a_one_time_sku_may_carry_grants(raw_client) -> None:
    sku = f"pass-{uuid4().hex[:8]}"
    with SessionLocal() as session, session.begin():
        session.add(
            Product(
                sku=sku,
                kind="one_time",
                name_en="Premium, 30-day pass",
                name_ta="பிரீமியம் — 30 நாள் அனுமதி",
                price_inr_paise=19900,
                entitlement_grants={"premium": 30},
                credit_grants={},
                active=False,
            )
        )
    with SessionLocal() as session:
        assert session.get(Product, sku).entitlement_grants == {"premium": 30}
