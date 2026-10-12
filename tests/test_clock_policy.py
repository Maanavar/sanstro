"""Infrastructure civil-day policy and injected-clock regression tests."""
from __future__ import annotations

from datetime import UTC, datetime

import pytest

from app.services import ask_vinaadi_usage_service as usage

pytestmark = pytest.mark.no_db


class _FrozenClock:
    def __init__(self, instant: datetime) -> None:
        self.instant = instant

    def now_utc(self) -> datetime:
        return self.instant


def _at(value: str) -> _FrozenClock:
    return _FrozenClock(datetime.fromisoformat(value).replace(tzinfo=UTC))


def test_quota_day_changes_at_kolkata_midnight_not_server_utc_midnight():
    assert usage._quota_day(clock=_at("2026-01-31T18:29:59")).isoformat() == "2026-01-31"
    assert usage._quota_day(clock=_at("2026-01-31T18:30:00")).isoformat() == "2026-02-01"


def test_quota_month_uses_the_same_accounting_day_boundary():
    assert usage._month_start(clock=_at("2026-01-31T18:29:59")).isoformat() == "2026-01-01"
    assert usage._month_start(clock=_at("2026-01-31T18:30:00")).isoformat() == "2026-02-01"


def test_saved_location_timezone_does_not_change_the_quota_period():
    from app.core.clock import local_date

    clock = _at("2026-06-30T19:00:00")
    # The same instant is a different civil day in the two saved locations.
    assert local_date("Pacific/Kiritimati", clock=clock).isoformat() == "2026-07-01"
    assert local_date("America/Adak", clock=clock).isoformat() == "2026-06-30"
    # Location is intentionally not an input to the stable account quota policy.
    assert usage._quota_day(clock=clock) == datetime(2026, 7, 1, tzinfo=UTC).date()


def test_local_day_helper_handles_the_23_hour_dst_day():
    from app.core.clock import local_date

    # New York's 2026-03-08 civil day starts at 05:00 UTC and the next one at
    # 04:00 UTC because the spring transition makes this a 23-hour day.
    assert local_date("America/New_York", clock=_at("2026-03-08T04:59:59")).isoformat() == "2026-03-07"
    assert local_date("America/New_York", clock=_at("2026-03-08T05:00:00")).isoformat() == "2026-03-08"
    assert local_date("America/New_York", clock=_at("2026-03-09T03:59:59")).isoformat() == "2026-03-08"
    assert local_date("America/New_York", clock=_at("2026-03-09T04:00:00")).isoformat() == "2026-03-09"


def test_location_change_invalidation_starts_at_the_earliest_local_day():
    from app.core.clock import earliest_local_date

    clock = _at("2026-01-01T10:30:00")
    assert earliest_local_date(
        ("Pacific/Kiritimati", "America/Adak"), clock=clock
    ).isoformat() == "2026-01-01"
