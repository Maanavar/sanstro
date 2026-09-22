from __future__ import annotations

from datetime import UTC, date, datetime, time, timedelta
from types import SimpleNamespace
from unittest.mock import MagicMock, patch
from uuid import uuid4

from app.schemas.birth_profiles import BirthProfileUpdate
from app.services.birth_profile_service import update_birth_profile
from app.services.location_service import (
    LOCATION_CHECK_DUE_DAYS,
    is_location_check_due,
    resolve_effective_daily_location,
    resolve_effective_daily_location_or_none,
)


def test_resolve_effective_daily_location_uses_current_when_complete():
    profile = SimpleNamespace(
        birth_place="Chennai",
        birth_latitude=13.0827,
        birth_longitude=80.2707,
        birth_timezone="Asia/Kolkata",
        current_place="San Francisco",
        current_latitude=37.7749,
        current_longitude=-122.4194,
        current_timezone="America/Los_Angeles",
    )

    resolved = resolve_effective_daily_location(profile)

    assert resolved.source == "current"
    assert resolved.place == "San Francisco"
    assert resolved.latitude == 37.7749
    assert resolved.longitude == -122.4194
    assert resolved.timezone == "America/Los_Angeles"


def test_resolve_effective_daily_location_falls_back_to_birth_when_current_incomplete():
    profile = SimpleNamespace(
        birth_place="Chennai",
        birth_latitude=13.0827,
        birth_longitude=80.2707,
        birth_timezone="Asia/Kolkata",
        current_place="San Francisco",
        current_latitude=37.7749,
        current_longitude=-122.4194,
        current_timezone=None,
    )

    resolved = resolve_effective_daily_location(profile)

    assert resolved.source == "birth"
    assert resolved.place == "Chennai"
    assert resolved.latitude == 13.0827
    assert resolved.longitude == 80.2707
    assert resolved.timezone == "Asia/Kolkata"


def test_resolve_or_none_answers_none_instead_of_raising_on_a_partial_profile():
    """The dashboard bundle used to carry its own copy of the current-vs-birth
    rule purely so it could tolerate this case. Folding it onto the shared
    resolver only works if the shared resolver has an answer for it."""
    profile = SimpleNamespace(
        birth_place="",
        birth_latitude=None,
        birth_longitude=None,
        birth_timezone=None,
        current_place=None,
        current_latitude=None,
        current_longitude=None,
        current_timezone=None,
    )

    assert resolve_effective_daily_location_or_none(profile) is None


def test_resolve_or_none_agrees_with_the_resolver_whenever_one_exists():
    profile = SimpleNamespace(
        birth_place="Chennai",
        birth_latitude=13.0827,
        birth_longitude=80.2707,
        birth_timezone="Asia/Kolkata",
        current_place=None,
        current_latitude=None,
        current_longitude=None,
        current_timezone=None,
    )

    assert resolve_effective_daily_location_or_none(profile) == resolve_effective_daily_location(profile)


def test_location_check_is_due_for_a_profile_that_never_confirmed_one():
    """Null is the state of every reader who has only ever had a birth location
    — the group most likely to be seeing timings for a place they left."""
    assert is_location_check_due(None) is True


def test_location_check_turns_due_on_the_ruled_day_and_not_before():
    now = datetime(2026, 9, 22, 12, 0, tzinfo=UTC)
    just_inside = now - timedelta(days=LOCATION_CHECK_DUE_DAYS - 1)
    exactly_due = now - timedelta(days=LOCATION_CHECK_DUE_DAYS)

    assert is_location_check_due(just_inside, now=now) is False
    assert is_location_check_due(exactly_due, now=now) is True


def test_location_check_reads_a_naive_stamp_as_utc_rather_than_crashing():
    # Postgres hands back tz-aware values, but a fixture or an older row can be
    # naive; subtracting a naive from an aware datetime raises.
    now = datetime(2026, 9, 22, 12, 0, tzinfo=UTC)
    assert is_location_check_due(datetime(2026, 9, 21, 12, 0), now=now) is False


def test_the_ruled_backstop_is_45_days():
    # R2 (2026-09-22). The constant is the ruling; a drift here silently changes
    # how often every reader is asked.
    assert LOCATION_CHECK_DUE_DAYS == 45


def test_update_birth_profile_current_only_update_does_not_recalculate():
    session = MagicMock()
    profile = SimpleNamespace(
        birth_profile_id=uuid4(),
        owner_user_id=uuid4(),
        display_name="Test Profile",
        birth_date_local=date(1991, 7, 22),
        birth_time_local=time(6, 30),
        birth_place="Chennai",
        birth_latitude=13.0827,
        birth_longitude=80.2707,
        birth_timezone="Asia/Kolkata",
        current_place=None,
        current_latitude=None,
        current_longitude=None,
        current_timezone=None,
        current_location_updated_at=None,
    )
    payload = BirthProfileUpdate(
        currentPlace="Coimbatore",
        currentLatitude=11.0168,
        currentLongitude=76.9558,
        currentTimezone="Asia/Kolkata",
        recalculate=True,
    )

    with (
        patch("app.services.birth_profile_service.calculate_chart_for_persisted_profile") as recalc,
        patch("app.services.birth_profile_service._find_duplicate_birth_profile", return_value=None),
        patch("app.services.birth_profile_service.get_birth_profile", return_value=SimpleNamespace(success=True)) as get_profile,
    ):
        result = update_birth_profile(
            session,
            profile,
            payload,
            calculation_version="thirukanitham-2026-v1",
        )

    assert recalc.call_count == 0
    assert profile.current_place == "Coimbatore"
    assert profile.current_latitude == 11.0168
    assert profile.current_longitude == 76.9558
    assert profile.current_timezone == "Asia/Kolkata"
    assert profile.current_location_updated_at is not None
    session.flush.assert_called_once()
    session.commit.assert_called_once()
    get_profile.assert_called_once()
    assert result.success is True
