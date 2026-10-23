"""F-MUH-01 and F-MUH-02 — the two Tamil-calendar gaps in the muhurta picker.

From the ground-truth audit of 2026-10-13:

* **F-MUH-02** Karinaal was a hand-entered 2026 list, so `is_karinaal` returned
  a silent `False` for every other year, and `muhurta_engine` never consulted
  it at all.
* **F-MUH-01** Aadi / Purattasi / Margazhi weddings were ranked like any other
  date, with only a notice saying the months "do not change this muhurta's
  score or recommendation".
"""
from __future__ import annotations

from datetime import date, timedelta

import pytest

from app.calculations import muhurta_engine as engine
from app.calculations.karinaal import (
    KARINAAL_TAMIL_DAYS,
    is_karinaal,
    karinaal_days_for_year,
    karinaal_rows_for_year,
)
from app.calculations.muhurta_engine import _W, NO_WEDDING_TAMIL_MONTHS, score_day
from app.calculations.panchangam import compute_daily_panchangam
from app.calculations.tamil_calendar import tamil_solar_date

pytestmark = pytest.mark.no_db

TZ, LAT, LON = "Asia/Kolkata", 13.0827, 80.2707


# ── F-MUH-02: Karinaal is derived, so there is no year it goes dark ─────────

@pytest.mark.parametrize("year", [2025, 2026, 2027, 2028, 2031])
def test_every_year_has_the_full_karinaal_set(year: int) -> None:
    """The cliff: the old lookup held 2026 only and returned False elsewhere,
    so from 1 Jan 2027 every calendar surface would have shown no Karinaal."""
    expected = sum(len(days) for days in KARINAAL_TAMIL_DAYS.values())
    assert len(karinaal_days_for_year(year)) == expected
    assert len(karinaal_rows_for_year(year)) == expected


def test_2027_is_not_empty() -> None:
    """The specific date the audit named. Stated on its own because the
    parametrised test above would still pass if the rule table were emptied."""
    assert karinaal_days_for_year(2027), "Karinaal went dark on 1 Jan 2027"
    assert is_karinaal(date(2027, 3, 20))  # Panguni 6


@pytest.mark.parametrize("year", [2026, 2027])
def test_every_derived_date_lands_on_its_rule_day(year: int) -> None:
    """The derivation and the Tamil-date engine must agree — the hand list's
    stored `tamilDay` labels had drifted from what `tamil_solar_date` says for
    the same civil date, so the two halves described the same day differently."""
    for row in karinaal_rows_for_year(year):
        d = date.fromisoformat(row["date"])
        month_index, day_of_month = tamil_solar_date(d, TZ, LAT, LON)
        assert month_index == row["tamilMonthIndex"]
        assert day_of_month == row["tamilDay"]
        assert day_of_month in KARINAAL_TAMIL_DAYS[month_index]


def test_the_two_2026_corrections_the_audit_found() -> None:
    """Margazhi 11 was missing from the hand list, and is now present — the
    2026-10-13 ruling confirmed it against published tables.

    Karthigai 7 was the audit's other correction and the ruling **reverted it**:
    published Karthigai lists disagree on day 7, so it must not be dropped on the
    strength of our derived table alone. Karinaal is an avoid-day, so the
    fail-safe direction is to keep showing it. This assertion was
    `assert not is_karinaal(...)` until that ruling; it is flipped deliberately,
    not relaxed, and it must not be flipped back without a printed almanac.
    """
    assert is_karinaal(date(2026, 12, 26)), "Margazhi 11 — absent from the hand list"
    assert is_karinaal(date(2026, 11, 23)), "Karthigai 7 — restored, disputed, fail-safe"


def test_karinaal_reaches_the_muhurta_picker() -> None:
    """The picker consulted no Karinaal at all, so it could rank one top."""
    clear = compute_daily_panchangam(date(2026, 12, 25), LAT, LON, TZ)
    karinaal = compute_daily_panchangam(date(2026, 12, 26), LAT, LON, TZ)
    factors = {f.factor: f for f in score_day(karinaal, "GRIHAPRAVESAM").factors}
    assert "ALMANAC_KARINAAL" in factors
    # Asserted as a real cost, not as `== _W.ALMANAC_KARINAAL`: that form is
    # true even when the weight is zeroed, so it could not fail.
    assert factors["ALMANAC_KARINAAL"].contribution < 0
    assert score_day(karinaal, "GRIHAPRAVESAM").score < score_day(clear, "GRIHAPRAVESAM").score


def test_a_clear_day_still_reports_the_karinaal_check() -> None:
    """Reported on clear days too: a factor that only appears when it fires
    leaves the reader unable to tell "we looked" from "we did not"."""
    snapshot = compute_daily_panchangam(date(2026, 4, 22), LAT, LON, TZ)
    factors = {f.factor: f for f in score_day(snapshot, "GRIHAPRAVESAM").factors}
    assert "ALMANAC_KARINAAL" in factors
    assert factors["ALMANAC_KARINAAL"].contribution == 0.0


# ── F-MUH-01: Aadi / Purattasi / Margazhi cannot top a wedding ranking ──────

def test_the_demotion_outweighs_any_reachable_score() -> None:
    """The bound, re-derived from `_W` rather than trusted as a constant.

    A demotion sized to the *measured* score floor would hold today and stop
    holding the first time a penalty was added, silently. This fails instead.
    """
    weights = {k: v for k, v in vars(_W).items() if isinstance(v, float)}
    ceiling = sum(v for v in weights.values() if v > 0)          # best conceivable day
    floor = sum(                                                  # worst conceivable day
        v for k, v in weights.items()
        if v < 0 and k != "MARRIAGE_NO_WEDDING_MONTH"
    )
    assert abs(_W.MARRIAGE_NO_WEDDING_MONTH) > ceiling - floor


@pytest.mark.parametrize(
    ("label", "day"),
    [("Aadi", date(2026, 8, 1)), ("Purattasi", date(2026, 9, 25)), ("Margazhi", date(2026, 12, 21))],
)
def test_no_wedding_month_demotes_a_marriage_date(label: str, day: date) -> None:
    snapshot = compute_daily_panchangam(day, LAT, LON, TZ)
    month_index, _ = tamil_solar_date(day, TZ, LAT, LON)
    assert month_index in NO_WEDDING_TAMIL_MONTHS, f"{label} fixture is in the wrong month"

    marriage = score_day(snapshot, "MARRIAGE")
    fired = [f for f in marriage.factors if f.factor == "MARRIAGE_NO_WEDDING_MONTH"]
    assert fired and fired[0].contribution == _W.MARRIAGE_NO_WEDDING_MONTH
    # Demoted, not vetoed: the day keeps its factors so the reader can see why.
    assert not any(f.factor == "MARRIAGE_NO_WEDDING_MONTH" and f.verdict is engine.Verdict.VETO
                   for f in marriage.factors)
    assert marriage.score < 0


@pytest.mark.parametrize("activity", ["GRIHAPRAVESAM", "TRAVEL", "EDUCATION_START"])
def test_the_month_rule_is_marriage_only(activity: str) -> None:
    """Aadi carries no such rule for a housewarming or an exam."""
    snapshot = compute_daily_panchangam(date(2026, 8, 1), LAT, LON, TZ)
    factors = {f.factor for f in score_day(snapshot, activity).factors}
    assert "MARRIAGE_NO_WEDDING_MONTH" not in factors


def test_a_wedding_month_date_cannot_outrank_one_outside_it() -> None:
    """The outcome the fix exists for, measured end to end rather than
    inferred from the weight: over a stretch spanning Aadi and the month
    after it, no in-month date beats any out-of-month date."""
    start = date(2026, 7, 17)  # Aadi 1
    scores: list[tuple[bool, float]] = []
    for offset in range(0, 70, 3):
        day = start + timedelta(days=offset)
        snapshot = compute_daily_panchangam(day, LAT, LON, TZ)
        month_index, _ = tamil_solar_date(day, TZ, LAT, LON)
        result = score_day(snapshot, "MARRIAGE")
        scores.append((month_index in NO_WEDDING_TAMIL_MONTHS, result.score))

    in_month = [s for flagged, s in scores if flagged]
    out_month = [s for flagged, s in scores if not flagged]
    assert in_month and out_month, "the sweep must cover both sides of the boundary"
    assert max(in_month) < min(out_month)
