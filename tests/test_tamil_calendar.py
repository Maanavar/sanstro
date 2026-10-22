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


# ---------------------------------------------------------------------------
# Month *spans* — the boundaries as a client consumes them
# ---------------------------------------------------------------------------

def test_month_spans_tile_the_calendar_without_gap_or_overlap() -> None:
    """Consecutive spans must abut exactly.

    `end` is derived by subtracting a day from the *next* month's start rather
    than by adding a nominal length, and that is not a stylistic choice: a
    published-authority start (doctrine A-3) moves a boundary without moving
    the sankranti, so it lengthens one month and shortens the next. A nominal
    length would leave a hole or a double-counted day there — and the picker
    hands these dates straight to the muhurta search as `dateFrom`/`dateTo`.
    """
    from app.calculations.tamil_calendar import tamil_month_spans

    latitude, longitude, tz_name = CHENNAI
    spans = tamil_month_spans(date(2026, 9, 4), 13, tz_name, latitude, longitude)

    assert len(spans) == 13
    for earlier, later in zip(spans, spans[1:], strict=False):
        assert later.start == earlier.end + timedelta(days=1)
        assert later.rasi == (earlier.rasi + 1) % 12
        # A solar month is 29-32 civil days; anything outside that is a bug in
        # the sankranti walk, not an unusual year.
        assert 29 <= (earlier.end - earlier.start).days + 1 <= 32


def test_first_span_covers_the_requested_date_from_its_own_first_day() -> None:
    """The span starts where the Tamil month starts, not where the caller asked.

    "Search Aavani" means the whole month; clamping it to today is the caller's
    decision, and the UI shows the clamped window separately.
    """
    from app.calculations.tamil_calendar import tamil_month_spans

    latitude, longitude, tz_name = CHENNAI
    asked = date(2026, 9, 4)
    first = tamil_month_spans(asked, 1, tz_name, latitude, longitude)[0]

    assert first.rasi == AAVANI
    assert first.start <= asked <= first.end
    # The published Gnanananda boundary, which the default sunset rule alone
    # does not produce — proof the spans go through the same doctrine step as
    # `tamil_solar_date` rather than around it.
    assert first.start == GNANANANDA_MONTH_STARTS_2026_27[(2026, AAVANI)]


def test_spans_agree_with_the_per_day_conversion_at_every_boundary() -> None:
    """A span's first day is day 1, and its last day is the month's last day.

    The list and the per-date `tamilDate` printed on each result come from two
    different call paths; a reader who sees "Purattasi · 18 Sep - 17 Oct" and
    then a result card dated 17 Oct labelled "Aippasi 1" has been shown two
    different calendars.
    """
    from app.calculations.tamil_calendar import tamil_month_spans

    latitude, longitude, tz_name = CHENNAI
    for span in tamil_month_spans(date(2026, 9, 4), 4, tz_name, latitude, longitude):
        start_rasi, start_day = tamil_solar_date(span.start, tz_name, latitude, longitude)
        end_rasi, _end_day = tamil_solar_date(span.end, tz_name, latitude, longitude)
        assert (start_rasi, start_day) == (span.rasi, 1)
        assert end_rasi == span.rasi


def test_zero_or_negative_count_returns_no_spans() -> None:
    from app.calculations.tamil_calendar import tamil_month_spans

    latitude, longitude, tz_name = CHENNAI
    assert tamil_month_spans(date(2026, 9, 4), 0, tz_name, latitude, longitude) == []


# ── FCA-02 — published coverage, its cliff, and disclosure ──────────────────
#
# docs/FULL_CODEBASE_AUDIT_2026-10-22.md. The published month starts covered
# one Tamil year; outside it every date silently fell back to a rule that
# already misses published boundaries. These hold the coverage open, and make
# the fallback visible instead of silent.

# The next edition must be in before today + this many days runs past the
# last published boundary — long enough to source and validate a new almanac.
_COVERAGE_LEAD_DAYS = 120


def _coverage_gap(today: date, covers_through: date) -> int:
    """Days by which today + lead runs past published coverage (<= 0 is fine)."""
    return (today + timedelta(days=_COVERAGE_LEAD_DAYS) - covers_through).days


def test_published_tamil_calendar_covers_the_next_120_days() -> None:
    """Fails ~four months before the cliff. Fix: import the next edition into
    app/data/tamil_calendar_authority.py — never extend the rule instead."""
    from app.calculations.tamil_calendar import published_tamil_calendar_covers_through

    covers_through = published_tamil_calendar_covers_through()
    gap = _coverage_gap(date.today(), covers_through)
    assert gap <= 0, (
        f"Published Tamil month starts end {covers_through}; today + {_COVERAGE_LEAD_DAYS} days "
        f"is {gap} day(s) past that. Import the next almanac edition."
    )


def test_coverage_guard_would_have_caught_the_2027_cliff() -> None:
    """The guard's own proof (CLAUDE.md: a gate must be seen to fail). With
    only the 2026-27 edition loaded, a clock at 2027-01-01 must trip it."""
    from app.calculations.tamil_calendar import _DAYS_CERTAIN_WITHOUT_NEXT_BOUNDARY

    gnanananda_only = max(GNANANANDA_MONTH_STARTS_2026_27.values()) + timedelta(
        days=_DAYS_CERTAIN_WITHOUT_NEXT_BOUNDARY - 1
    )
    assert _coverage_gap(date(2027, 1, 1), gnanananda_only) > 0
    assert _coverage_gap(date(2026, 10, 1), gnanananda_only) <= 0


def test_published_sources_agree_wherever_they_overlap() -> None:
    from app.data.tamil_calendar_authority import PUBLISHED_TAMIL_CALENDARS

    seen: dict[tuple[int, int], tuple[str, date]] = {}
    for calendar in PUBLISHED_TAMIL_CALENDARS:
        if calendar.complete:
            assert len(calendar.month_starts) == 12, f"{calendar.name}: import a complete twelve-boundary set"
        else:
            assert "ruling" in calendar.name.lower(), f"{calendar.name}: a partial source must cite its ruling"
        for key, start in calendar.month_starts.items():
            if key in seen:
                assert seen[key][1] == start, f"{key}: {seen[key][0]} says {seen[key][1]}, {calendar.name} says {start}"
            seen[key] = (calendar.name, start)


def test_every_published_boundary_is_what_the_calendar_returns() -> None:
    from app.data.tamil_calendar_authority import PUBLISHED_TAMIL_CALENDARS

    for calendar in PUBLISHED_TAMIL_CALENDARS:
        for (_year, rasi), start in calendar.month_starts.items():
            assert tamil_solar_date(start, CHENNAI[2], CHENNAI[0], CHENNAI[1]) == (rasi, 1), (calendar.name, start)


def test_published_start_earlier_than_the_sunset_rule_is_honoured() -> None:
    """Aani 2027: sankranti 18:55 IST on 15 Jun, after Chennai sunset, so the
    rule says 16 Jun; the almanac opens Aani on the 15th. Before the fix the
    15th read "Vaikasi 32"."""
    assert tamil_solar_date(date(2027, 6, 14), CHENNAI[2], CHENNAI[0], CHENNAI[1]) == (1, 31)
    assert tamil_solar_date(date(2027, 6, 15), CHENNAI[2], CHENNAI[0], CHENNAI[1]) == (2, 1)
    assert tamil_solar_date(date(2027, 7, 16), CHENNAI[2], CHENNAI[0], CHENNAI[1]) == (2, 32)


def test_tamil_date_source_says_when_a_date_is_the_rules_not_the_almanacs() -> None:
    from app.calculations.tamil_calendar import tamil_date_source

    lat, lon, tz = CHENNAI
    assert tamil_date_source(date(2027, 6, 15), tz, lat, lon) == "published"
    # Past the last published boundary's certain days.
    assert tamil_date_source(date(2028, 2, 1), tz, lat, lon) == "computed"
    # Maasi 2026 has no published start (only Thai 2026, by ruling, does).
    assert tamil_date_source(date(2026, 3, 1), tz, lat, lon) == "computed"


def test_published_dates_apply_in_every_timezone() -> None:
    """Owner ruling 2026-10-22. Singapore's sunset rule puts Aani 2027 on
    16 Jun; the published Aani 1 is 15 Jun, and a reader there gets that."""
    from app.calculations.tamil_calendar import tamil_date_source

    for tz, lat, lon in (("Asia/Singapore", 1.3521, 103.8198), ("America/Toronto", 43.6532, -79.3832)):
        assert tamil_solar_date(date(2027, 6, 15), tz, lat, lon) == (2, 1), tz
        assert tamil_date_source(date(2027, 6, 15), tz, lat, lon) == "published", tz


def test_thai_2026_is_the_owner_ruled_15_january() -> None:
    """FCA-08: the gazetted Pongal. The sunset rule says 14 Jan."""
    lat, lon, tz = CHENNAI
    assert tamil_solar_date(date(2026, 1, 14), tz, lat, lon) == (8, 30)
    assert tamil_solar_date(date(2026, 1, 15), tz, lat, lon) == (9, 1)
