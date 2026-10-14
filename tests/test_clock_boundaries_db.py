"""Clock policy driven through the real quota and invalidation paths (Phase 4 C).

`tests/test_clock_policy.py` pins the helpers in `app/core/clock.py`. These pin
the call sites: a frozen `Clock` is passed into `reserve_chip` and
`apply_birth_profile_changes`, which then read and write real rows.

Each case says which wrong implementation it would catch, and which it would
not — a case that passes under both the old and new behaviour is recorded as
such rather than counted as coverage (CLAUDE.md, "A gate proves its own check").

All profiles here are synthetic; the places are chosen for their UTC offsets.
"""
from __future__ import annotations

from datetime import UTC, date, datetime
from uuid import UUID, uuid4

import pytest
from fastapi import HTTPException
from sqlalchemy import select

from app.constants.versions import CHART_CALCULATION_VERSION
from app.core.tier_limits import ask_vinaadi_limit_for_tier
from app.db.session import SessionLocal
from app.models.ask_vinaadi_usage import AskVinaadiUsage
from app.models.birth_profile import BirthProfile
from app.models.daily_score import DailyScore
from app.models.user import User
from app.services.ask_vinaadi_usage_service import reserve_chip
from app.services.birth_profile_service import apply_birth_profile_changes

REGISTERED_DAILY_LIMIT = ask_vinaadi_limit_for_tier("registered")[0]

# UTC-10 all year / UTC+14 all year: the same instant is two different days.
ADAK = {"place": "Synthetic Adak", "lat": 51.88, "lng": -176.66, "tz": "America/Adak"}
KIRITIMATI = {"place": "Synthetic Kiritimati", "lat": 1.87, "lng": -157.40, "tz": "Pacific/Kiritimati"}
NEW_YORK = {"place": "Synthetic New York", "lat": 40.71, "lng": -74.01, "tz": "America/New_York"}


class _FrozenClock:
    def __init__(self, iso_utc: str) -> None:
        self._instant = datetime.fromisoformat(iso_utc).replace(tzinfo=UTC)

    def now_utc(self) -> datetime:
        return self._instant


# --------------------------------------------------------------------------- #
# Quota day                                                                   #
# --------------------------------------------------------------------------- #

@pytest.fixture()
def registered_user_id(client):
    with SessionLocal() as session, session.begin():
        user = User(user_id=uuid4(), email=f"clock-{uuid4().hex}@example.invalid")
        session.add(user)
        session.flush()
        return user.user_id


def test_an_exhausted_quota_resets_at_kolkata_midnight(registered_user_id):
    """Catches: a host-date or UTC-date quota day (UTC is still Jan 31 at 18:30Z).
    Does not catch: a wrong accounting zone that happens to share IST's offset."""
    before = _FrozenClock("2026-01-31T18:29:59")
    after = _FrozenClock("2026-01-31T18:30:00")
    with SessionLocal() as session, session.begin():
        session.add(AskVinaadiUsage(
            id=uuid4(), user_id=registered_user_id,
            usage_date=date(2026, 1, 31), chip_count=REGISTERED_DAILY_LIMIT,
        ))

    with SessionLocal() as session:
        with pytest.raises(HTTPException) as excinfo:
            reserve_chip(session, registered_user_id, clock=before)
        session.rollback()
    assert excinfo.value.status_code == 429

    with SessionLocal() as session, session.begin():
        remaining = reserve_chip(session, registered_user_id, clock=after)
    assert remaining == REGISTERED_DAILY_LIMIT - 1

    with SessionLocal() as session:
        rows = {
            row.usage_date: row.chip_count
            for row in session.execute(
                select(AskVinaadiUsage).where(AskVinaadiUsage.user_id == registered_user_id)
            ).scalars()
        }
    assert rows == {date(2026, 1, 31): REGISTERED_DAILY_LIMIT, date(2026, 2, 1): 1}


# --------------------------------------------------------------------------- #
# DailyScore invalidation                                                     #
# --------------------------------------------------------------------------- #

def _create_profile_at(client, place: dict, **extra) -> UUID:
    response = client.post("/api/v1/birth-profiles", json={
        "displayName": "Clock Boundary Synthetic",
        "birthDateLocal": "1990-01-01",
        "birthTimeLocal": "06:00:00",
        "birthPlace": "Synthetic Birthplace",
        "birthLatitude": 10.0,
        "birthLongitude": 78.0,
        "birthTimezone": "Asia/Kolkata",
        "currentPlace": place["place"],
        "currentLatitude": place["lat"],
        "currentLongitude": place["lng"],
        "currentTimezone": place["tz"],
        "calculateNow": False,
        **extra,
    })
    assert response.status_code == 200, response.text
    return UUID(response.json()["data"]["birthProfileId"])


def _seed(profile_id: UUID, *days: date) -> None:
    with SessionLocal() as session, session.begin():
        for day in days:
            session.add(DailyScore(
                score_id=uuid4(), birth_profile_id=profile_id, score_date=day,
                score=50, label="MIXED", data={"stale": True},
            ))


def _apply(profile_id: UUID, update: dict, clock: _FrozenClock) -> list[date]:
    with SessionLocal() as session, session.begin():
        profile = session.get(BirthProfile, profile_id)
        apply_birth_profile_changes(
            session, profile, update,
            recalculate=False, calculation_version=CHART_CALCULATION_VERSION, clock=clock,
        )
    with SessionLocal() as session:
        return sorted(session.execute(
            select(DailyScore.score_date).where(DailyScore.birth_profile_id == profile_id)
        ).scalars())


def _move_to(place: dict) -> dict:
    return {
        "current_place": place["place"],
        "current_latitude": place["lat"],
        "current_longitude": place["lng"],
        "current_timezone": place["tz"],
    }


def test_a_move_across_the_date_line_invalidates_from_the_earlier_local_day(client):
    """At 10:30Z on Jan 1 it is Jan 1 in Adak and Jan 2 in Kiritimati.

    Catches: a cutoff from the host date (Oct 2026 here, so nothing is dropped)
    and a cutoff from the *new* place only (Jan 2, which would keep the Jan 1
    row computed for Adak's sunrise)."""
    profile_id = _create_profile_at(client, ADAK)
    _seed(profile_id, date(2025, 12, 31), date(2026, 1, 1), date(2026, 1, 2))

    remaining = _apply(profile_id, _move_to(KIRITIMATI), _FrozenClock("2026-01-01T10:30:00"))

    assert remaining == [date(2025, 12, 31)]


def test_an_audience_change_invalidates_from_the_profiles_own_local_day(client):
    """At 10:30Z on Jan 1 it is already Jan 2 in Kiritimati.

    Catches: a UTC/host-date cutoff (Jan 1), which would also drop yesterday's
    row — history the reader lived under the old audience."""
    profile_id = _create_profile_at(client, KIRITIMATI, maritalStatus="single")
    _seed(profile_id, date(2026, 1, 1), date(2026, 1, 2))

    remaining = _apply(profile_id, {"marital_status": "married"}, _FrozenClock("2026-01-01T10:30:00"))

    assert remaining == [date(2026, 1, 1)]


def test_an_audience_change_after_spring_forward_uses_the_dst_offset(client):
    """At 04:30Z on Mar 9 2026 New York is on EDT (UTC-4): 00:30 on Mar 9.

    Catches: a fixed standard offset (EST, UTC-5 → still Mar 8), which would
    drop the Mar 8 row. Does NOT discriminate a UTC-date implementation — UTC
    is also Mar 9 at this instant — so this case is DST coverage only."""
    profile_id = _create_profile_at(client, NEW_YORK, maritalStatus="single")
    _seed(profile_id, date(2026, 3, 8), date(2026, 3, 9))

    remaining = _apply(profile_id, {"marital_status": "married"}, _FrozenClock("2026-03-09T04:30:00"))

    assert remaining == [date(2026, 3, 8)]


def test_re_sending_the_same_audience_keeps_every_row(client):
    profile_id = _create_profile_at(client, KIRITIMATI, maritalStatus="single")
    _seed(profile_id, date(2026, 1, 1), date(2026, 1, 2))

    remaining = _apply(profile_id, {"marital_status": "single"}, _FrozenClock("2026-01-01T10:30:00"))

    assert remaining == [date(2026, 1, 1), date(2026, 1, 2)]
