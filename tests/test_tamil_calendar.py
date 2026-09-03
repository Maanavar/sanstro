"""Regression coverage for Tamil solar month boundaries.

Doctrine A-3 (2026-08-19): a sankranti falling before that day's sunset starts
the month on that same civil day; otherwise the month starts the day after.
The verified published Tamil-calendar Aavani 2026 boundary is an explicit,
regression-tested exception to that default.

The anchor is Puthandu. Chithirai 1, 2026 = 14 April is gazetted by the Tamil
Nadu government and is independently present in our festival table, so it is
the one date the convention must reproduce.
"""

from datetime import UTC, date, datetime, time, timedelta
from zoneinfo import ZoneInfo

import pytest

from app.calculations.astro import julian_day_to_utc_datetime, utc_datetime_to_julian_day
from app.calculations.tamil_calendar import (
    _sunrise_jd,
    _sunset_jd,
    find_sankranti_jd,
    month_start_date_for_sankranti,
    tamil_solar_date,
)
from app.data.tamil_calendar_authority import GNANANANDA_MONTH_STARTS_2026_27

pytestmark = pytest.mark.no_db

CHENNAI = (13.0827, 80.2707, "Asia/Kolkata")
TZ = ZoneInfo("Asia/Kolkata")

CHITHIRAI, AADI, AAVANI, MAASI, PANGUNI = 0, 3, 4, 10, 11


def _noon_jd(d: date) -> float:
    return utc_datetime_to_julian_day(datetime.combine(d, time(12, 0), tzinfo=TZ).astimezone(UTC))


def _sankranti_geometry(rasi: int, seed: date) -> tuple[float, float, float, date]:
    """(sankranti_jd, sunrise_jd, sunset_jd, sankranti_date) for the rasi containing `seed`."""
    latitude, longitude, _tz = CHENNAI
    sankranti_jd = find_sankranti_jd(rasi, _noon_jd(seed))
    sankranti_date = julian_day_to_utc_datetime(sankranti_jd).astimezone(TZ).date()
    return (
        sankranti_jd,
        _sunrise_jd(sankranti_date, TZ, latitude, longitude),
        _sunset_jd(sankranti_date, TZ, latitude, longitude),
        sankranti_date,
    )


# ---------------------------------------------------------------------------
# The anchor, and the boundaries that are not in dispute
# ---------------------------------------------------------------------------

def test_chithirai_2026_matches_gazetted_puthandu() -> None:
    """Sankranti 14 Apr 09:32 IST is before sunset, so Chithirai 1 is 14 April.

    This is the anchor: it is the gazetted date, and it is what excludes the
    sunrise convention (which would place Puthandu on 15 April).
    """
    latitude, longitude, timezone = CHENNAI

    assert tamil_solar_date(date(2026, 4, 14), timezone, latitude, longitude) == (CHITHIRAI, 1)
    assert tamil_solar_date(date(2026, 4, 13), timezone, latitude, longitude)[0] == PANGUNI


def test_aadi_2026_starts_17_july_under_either_convention() -> None:
    """Aadi's sankranti is 16 Jul 23:39 IST — after sunset, so Aadi 1 is 17 July.

    Worth its own test because the sunset and sunrise conventions *agree* here,
    which makes it a check on the astronomy that is independent of the doctrine
    dispute. It is also corroborated externally: the TN gazette's Aadi 27 =
    12 August implies Aadi 1 = 17 July, which is what we produce.
    """
    latitude, longitude, timezone = CHENNAI

    assert tamil_solar_date(date(2026, 7, 17), timezone, latitude, longitude) == (AADI, 1)
    assert tamil_solar_date(date(2026, 7, 16), timezone, latitude, longitude)[0] != AADI
    # The gazette anchor itself.
    assert tamil_solar_date(date(2026, 8, 12), timezone, latitude, longitude) == (AADI, 27)


def test_maasi_2027_starts_on_the_sankranti_day() -> None:
    """Sankranti 13 Feb 10:09 IST is before sunset, so Maasi 1 is 13 February."""
    latitude, longitude, timezone = CHENNAI

    assert tamil_solar_date(date(2027, 2, 13), timezone, latitude, longitude) == (MAASI, 1)


# ---------------------------------------------------------------------------
# Published calendar boundary
# ---------------------------------------------------------------------------

def test_aavani_2026_matches_published_tamil_calendar() -> None:
    """The published calendar places Aavani 1 on 18 August 2026."""
    latitude, longitude, timezone = CHENNAI

    assert tamil_solar_date(date(2026, 8, 17), timezone, latitude, longitude) == (AADI, 32)
    assert tamil_solar_date(date(2026, 8, 18), timezone, latitude, longitude) == (AAVANI, 1)
    assert tamil_solar_date(date(2026, 8, 19), timezone, latitude, longitude) == (AAVANI, 2)


def test_selected_calendar_authority_boundaries_match_the_complete_edition() -> None:
    """Every month start in the selected 2026–27 edition is reproduced."""
    latitude, longitude, timezone = CHENNAI

    assert len(GNANANANDA_MONTH_STARTS_2026_27) == 12
    for (_year, rasi), month_start in GNANANANDA_MONTH_STARTS_2026_27.items():
        assert tamil_solar_date(month_start, timezone, latitude, longitude) == (rasi, 1)
        assert tamil_solar_date(month_start - timedelta(days=1), timezone, latitude, longitude)[0] == (rasi - 1) % 12


def test_no_single_threshold_yields_both_puthandu_and_18_august_aavani() -> None:
    """The two claims are arithmetically irreconcilable. This proves it.

    Sweep every monotone threshold rule of the form "the month starts on the
    sankranti day if the crossing falls before `fraction` of the way through
    daylight" — fraction 0.0 is the sunrise convention, 0.5 madhyahna, 0.6
    aparahna, 1.0 the sunset convention. No value satisfies both the gazetted
    Puthandu (14 April) and an 18 August Aavani, because Simha's sankranti sits
    EARLIER in its day than Chithirai's while 18 August demands it be pushed
    LATER.

    This is the finding that keeps the Aavani question honest: it means the
    18 August sources are not merely using a different threshold. Either they
    compute sankranti by Vakya (different instants entirely), or they use a
    rule that is not a threshold at all, or an anchor is misread.
    """
    chithirai_jd, ch_rise, ch_set, chithirai_date = _sankranti_geometry(CHITHIRAI, date(2026, 4, 20))
    aavani_jd, av_rise, av_set, aavani_date = _sankranti_geometry(AAVANI, date(2026, 8, 25))

    # Both crossings fall in daylight on their own date, which is what makes
    # them comparable as fractions at all.
    assert chithirai_date == date(2026, 4, 14)
    assert aavani_date == date(2026, 8, 17)
    assert ch_rise < chithirai_jd < ch_set
    assert av_rise < aavani_jd < av_set

    chithirai_fraction = (chithirai_jd - ch_rise) / (ch_set - ch_rise)
    aavani_fraction = (aavani_jd - av_rise) / (av_set - av_rise)

    # The crux: Aavani's sankranti is earlier in its day than Chithirai's.
    assert aavani_fraction < chithirai_fraction, (
        f"Aavani at {aavani_fraction:.4f} of daylight, Chithirai at {chithirai_fraction:.4f} — "
        "if this ever reverses, the impossibility argument below no longer holds "
        "and doctrine A-3 must be re-derived from scratch."
    )

    for step in range(0, 1001):
        fraction = step / 1000.0
        ch_threshold = ch_rise + fraction * (ch_set - ch_rise)
        av_threshold = av_rise + fraction * (av_set - av_rise)

        ch_start = chithirai_date if chithirai_jd < ch_threshold else chithirai_date + timedelta(days=1)
        av_start = aavani_date if aavani_jd < av_threshold else aavani_date + timedelta(days=1)

        assert not (ch_start == date(2026, 4, 14) and av_start == date(2026, 8, 18)), (
            f"threshold fraction {fraction:.3f} produced both gazetted Puthandu and an "
            "18 August Aavani — the impossibility proof is wrong, re-derive doctrine A-3"
        )


# ---------------------------------------------------------------------------
# The doctrine step in isolation
# ---------------------------------------------------------------------------

def test_month_start_rule_is_separable_from_the_astronomy() -> None:
    """`month_start_date_for_sankranti` decides the civil day on its own.

    The split exists so the open Aavani question can be resolved without anyone
    editing a bisection search. This test exercises the doctrine half directly,
    on both sides of the threshold.
    """
    latitude, longitude, _tz = CHENNAI

    # Chithirai 2026: crossing is before sunset -> same civil day.
    chithirai_jd, _rise, _set, _d = _sankranti_geometry(CHITHIRAI, date(2026, 4, 20))
    assert month_start_date_for_sankranti(chithirai_jd, TZ, latitude, longitude) == date(2026, 4, 14)

    # Aadi 2026: crossing is 23:39, after sunset -> next civil day.
    aadi_jd, _rise, _set, _d = _sankranti_geometry(AADI, date(2026, 7, 25))
    assert month_start_date_for_sankranti(aadi_jd, TZ, latitude, longitude) == date(2026, 7, 17)
