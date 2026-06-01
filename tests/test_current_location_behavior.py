from __future__ import annotations

from datetime import date, time
from types import SimpleNamespace
from unittest.mock import MagicMock, patch
from uuid import uuid4

from app.schemas.birth_profiles import BirthProfileUpdate
from app.services.birth_profile_service import update_birth_profile
from app.services.location_service import resolve_effective_daily_location


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


def test_update_birth_profile_current_only_update_does_not_recalculate():
    session = MagicMock()
    profile = SimpleNamespace(
        birth_profile_id=uuid4(),
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
