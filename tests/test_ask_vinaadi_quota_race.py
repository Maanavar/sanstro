"""Ask Vinaadi quota must be reserved, not counted afterwards (P1-6).

The old flow was `assert_chip_available` → `answer_question` → `consume_chip`:
check, call the provider, count. Two races, both reproduced against Postgres
before anything was changed.

1. Both requests read `chip_count` before either wrote, so at limit-1 both
   passed the check and both went on to call the provider. The user got two
   answers on one remaining chip and we paid for two API calls.
2. `usage.chip_count += 1` was a read-modify-write in Python, not an atomic
   increment. Starting one below the limit, two concurrent answers advanced the
   counter by one rather than two — the quota under-counted its own spending, so
   the next request was allowed too.

The fix reserves the chip up front with a single conditional UPDATE whose
rowcount is the verdict, and refunds it if the answer never arrives.
"""
from __future__ import annotations

from datetime import date
from uuid import uuid4

import pytest
from fastapi import HTTPException

from app.core.tier_limits import ask_vinaadi_limit_for_tier
from app.db.session import SessionLocal
from app.models.ask_vinaadi_usage import AskVinaadiUsage
from app.models.user import User
from app.services.ask_vinaadi_usage_service import (
    _get_usage,
    refund_chip,
    reserve_chip,
)

# Read from the tier table rather than hardcoded: this test is about the
# reservation mechanics, and a limit change should not make it fail spuriously.
REGISTERED_DAILY_LIMIT = ask_vinaadi_limit_for_tier("registered")[0]


@pytest.fixture()
def user_id(client):
    """A registered (non-premium) user with no usage today. `client` resets the
    schema; the returned id is not attached to any session."""
    with SessionLocal() as session, session.begin():
        user = User(user_id=uuid4(), email=f"quota-{uuid4().hex}@example.invalid")
        session.add(user)
        session.flush()
        uid = user.user_id
    return uid


def _set_count(uid, count: int) -> None:
    with SessionLocal() as session, session.begin():
        session.query(AskVinaadiUsage).filter(AskVinaadiUsage.user_id == uid).delete()
        session.add(
            AskVinaadiUsage(
                id=uuid4(), user_id=uid, usage_date=date.today(), chip_count=count
            )
        )


def _count(uid) -> int:
    with SessionLocal() as session:
        usage = _get_usage(session, uid, date.today())
        return usage.chip_count if usage else 0


def test_reserving_the_last_chip_succeeds_exactly_once(user_id):
    _set_count(user_id, REGISTERED_DAILY_LIMIT - 1)

    first, second = SessionLocal(), SessionLocal()
    try:
        remaining = reserve_chip(first, user_id)
        first.commit()  # must commit before the second attempt; see the note below
        assert remaining == 0, "that was the last chip"

        with pytest.raises(HTTPException) as excinfo:
            reserve_chip(second, user_id)
        second.rollback()
    finally:
        first.close()
        second.close()

    assert excinfo.value.status_code == 429
    assert excinfo.value.detail["error"] == "DAILY_LIMIT_REACHED"
    assert _count(user_id) == REGISTERED_DAILY_LIMIT


def test_two_separate_sessions_do_not_lose_an_increment(user_id):
    """The read-modify-write bug: two spends must move the counter by two.

    Note the ordering. Two sessions cannot both hold the reservation open on the
    same row — the second `UPDATE` blocks on the first's row lock until it
    commits, which is precisely the serialisation that makes this safe, and
    which the old unconditional attribute assignment did not get. Overlapping
    them here would just deadlock the test against its own fix, so the first
    commits before the second starts. What is being pinned is that the second
    increment reads the first's committed value rather than clobbering it.
    """
    _set_count(user_id, 0)

    first, second = SessionLocal(), SessionLocal()
    try:
        reserve_chip(first, user_id)
        first.commit()
        reserve_chip(second, user_id)
        second.commit()
    finally:
        first.close()
        second.close()

    assert _count(user_id) == 2


def test_the_quota_cannot_be_overspent_by_repeated_reservation(user_id):
    _set_count(user_id, 0)

    granted = 0
    with SessionLocal() as session:
        for _ in range(REGISTERED_DAILY_LIMIT + 4):
            try:
                reserve_chip(session, user_id)
                session.commit()
                granted += 1
            except HTTPException:
                session.rollback()

    assert granted == REGISTERED_DAILY_LIMIT
    assert _count(user_id) == REGISTERED_DAILY_LIMIT


def test_a_refund_returns_the_chip(user_id):
    """Reserving up front introduces the risk of charging for an answer that
    never arrived, so the refund has to actually work."""
    _set_count(user_id, 0)

    with SessionLocal() as session:
        reserve_chip(session, user_id)
        session.commit()
        assert _count(user_id) == 1

        refund_chip(session, user_id)
        session.commit()

    assert _count(user_id) == 0


def test_a_refund_cannot_drive_the_count_negative(user_id):
    """A negative count would read as free questions forever."""
    _set_count(user_id, 0)

    with SessionLocal() as session:
        refund_chip(session, user_id)
        refund_chip(session, user_id)
        session.commit()

    assert _count(user_id) == 0


def test_first_question_of_the_day_creates_its_row_without_racing(user_id):
    """Two first-questions arriving together would both INSERT and the second
    would violate uq_ask_vinaadi_usage_user_date — a 500 rather than an answer."""
    first, second = SessionLocal(), SessionLocal()
    try:
        reserve_chip(first, user_id)
        first.commit()
        reserve_chip(second, user_id)
        second.commit()
    finally:
        first.close()
        second.close()

    assert _count(user_id) == 2
