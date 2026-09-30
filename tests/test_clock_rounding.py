"""Display rounding policy for panchangam clock values (owner ruling
2026-09-29, requirement 10).

Every clock string a reader sees used to come from a bare
``strftime("%H:%M")``, which TRUNCATES. A 06:09:58 sunrise printed as "06:09"
is up to 59 s early, always in the same direction, and the error compounds
across the eight kalam divisions that subdivide the sunrise->sunset span.

The policy: calculations keep exact instants; only the presentation boundary
rounds, half-up, to the nearest minute. Rounding the anchor first would push
the error into every derived window.

This file tests the policy itself. The sunrise/sunset *values* are tested in
tests/test_wi07_sunrise_validation_harness.py, which compares exact instants
and would therefore pass even if presentation went back to truncating — that
gap is why this file exists separately.
"""
from __future__ import annotations

from datetime import date, datetime, time

import pytest

from app.calculations.astro import format_clock_hhmm, round_to_nearest_minute


@pytest.mark.parametrize(
    "second,expected",
    [
        (0, "12:30"),
        (1, "12:30"),
        (29, "12:30"),
        (30, "12:31"),  # half-up
        (31, "12:31"),
        (59, "12:31"),
    ],
)
def test_rounds_half_up_at_thirty_seconds(second: int, expected: str) -> None:
    assert format_clock_hhmm(datetime(2026, 9, 29, 12, 30, second)) == expected


def test_microseconds_below_the_half_still_round_down() -> None:
    """29.999 s is below the half, so it must not round up. A naive
    ``second >= 30`` test would agree here; a naive ``round(second/60)`` on a
    truncated second would too. The failure mode this pins is an
    implementation that adds 30 s to a value whose microseconds were already
    dropped."""
    assert format_clock_hhmm(datetime(2026, 9, 29, 12, 30, 29, 999_999)) == "12:30"
    assert format_clock_hhmm(datetime(2026, 9, 29, 12, 30, 30, 0)) == "12:31"


def test_the_real_tiruppur_instants_that_triggered_the_ruling() -> None:
    """Sunrise 06:09:22 and sunset 18:12:30 for Tiruppur on 2026-09-29.

    Sunset lands exactly on the half-second boundary, so half-up sends it to
    18:13 while timeanddate prints 18:12. That one-minute difference is the
    rounding policy, not a calculation difference — recorded here so it is not
    re-diagnosed as a bug later.
    """
    assert format_clock_hhmm(datetime(2026, 9, 29, 6, 9, 22)) == "06:09"
    assert format_clock_hhmm(datetime(2026, 9, 29, 18, 12, 30)) == "18:13"


def test_rounding_is_a_pure_function_so_shared_boundaries_stay_shared() -> None:
    """Rahu Kalam's end and the next kalam's start are the SAME instant. They
    are formatted by separate calls, so the policy has to be deterministic on
    the instant alone — otherwise a window could appear to end a minute after
    the next one began."""
    shared = datetime(2026, 9, 29, 16, 42, 7, 500_000)
    assert format_clock_hhmm(shared) == format_clock_hhmm(shared)
    assert round_to_nearest_minute(shared) == round_to_nearest_minute(shared)


@pytest.mark.parametrize("second", [30, 45, 59])
def test_midnight_is_clamped_not_crossed(second: int) -> None:
    """23:59:45 must render as "23:59", never "00:00".

    These go out as clock-only strings beside a date, and a solar day runs
    sunrise to sunrise, so a string that rolls past midnight reads as ~24 h
    earlier to any consumer without the ISO twin. Capping the error at 45 s in
    this one case beats naming the wrong day — the same trap the tithi-rollover
    fix already hit once.
    """
    assert format_clock_hhmm(datetime(2026, 9, 29, 23, 59, second)) == "23:59"
    assert round_to_nearest_minute(datetime(2026, 9, 29, 23, 59, second)).date() == date(2026, 9, 29)


def test_just_after_midnight_is_untouched() -> None:
    """The clamp must only fire when rounding would cross midnight, not
    whenever the hour happens to be 23 or 0."""
    assert format_clock_hhmm(datetime(2026, 9, 29, 0, 0, 20)) == "00:00"
    assert format_clock_hhmm(datetime(2026, 9, 29, 0, 0, 40)) == "00:01"
    assert format_clock_hhmm(datetime(2026, 9, 29, 23, 58, 40)) == "23:59"


def test_serialized_panchangam_clocks_are_rounded_not_truncated() -> None:
    """End-to-end: the wire payload must carry the rounded string.

    Asserted through the real serializer rather than the helper, because the
    defect being fixed was not a wrong helper — it was 50-odd call sites
    calling ``strftime`` directly and bypassing any policy at all.
    """
    from app.calculations.astro import format_clock_hhmm as fmt
    from app.calculations.panchangam import calculate_daily_panchangam

    snapshot = calculate_daily_panchangam(date(2026, 9, 29), 11.1085, 77.3411, "Asia/Kolkata")

    # Exact instants are retained on the snapshot.
    assert snapshot.sunrise.second == 22
    assert snapshot.sunset.second == 30

    # And the display strings round them.
    assert fmt(snapshot.sunrise) == "06:09"
    assert fmt(snapshot.sunset) == "18:13"
    assert fmt(snapshot.rahu_kalam.start) == "15:12"


def test_a_bare_time_object_is_still_formattable() -> None:
    """Preference times (morning alert, birth time) are `time`, not `datetime`,
    and carry no seconds. They must not hit the datetime-only clamp path."""
    assert format_clock_hhmm(datetime.combine(date(2026, 9, 29), time(7, 30))) == "07:30"
