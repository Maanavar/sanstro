"""Time numerology tests (NUM-40..45, Phase 4).

Two things are being pinned here, and only one of them is arithmetic:

* **The numbers** — personal year/month/day across all three D1 epochs, worked
  by hand in the test rather than copied from the implementation.
* **The doctrine guard** — that numerology can never lift an astrologically
  flagged date above a clean one. ``test_numerology_can_never_promote_a_flagged_date``
  and ``test_an_unrecommended_naal_can_never_outrank_a_recommended_one`` are the
  point of the whole phase; if either fails, the panchangam has stopped being
  authoritative and the product is recommending dates it shouldn't.

No DB and no ephemeris: the Chithirai branch is driven through an injected
resolver, which is exactly why the pure engine takes one instead of importing
swisseph.
"""
from __future__ import annotations

from datetime import date, timedelta

import pytest

from app.calculations.numerology import score_text
from app.calculations.numerology_alignment import favourable_numbers_for
from app.calculations.numerology_timing import (
    NUMEROLOGY_ADJUSTMENT_BOUND,
    PersonalYearEpoch,
    business_launch_score,
    date_number,
    personal_cycle,
    personal_day,
    personal_month,
    personal_year,
    resolve_epoch,
    score_date,
)
from app.services import numerology_timing_service as svc
from app.services.numerology_content import BANNED_FEAR_TERMS

pytestmark = pytest.mark.no_db

#: Clearly synthetic native: 17 May 1990. Used throughout so the hand-worked
#: arithmetic in each test refers to one set of digits.
NATIVE_DOB = date(1990, 5, 17)

#: Puthandu for the years these tests touch. Injected rather than computed —
#: the real dates come from the ephemeris and are asserted separately in
#: test_chithirai_resolver_agrees_with_the_almanac.
_PUTHANDU = {y: date(y, 4, 14) for y in range(1988, 2032)}


def _puthandu(year: int) -> date:
    return _PUTHANDU[year]


def _days_of(year: int):
    day = date(year, 1, 1)
    while day.year == year:
        yield day
        day += timedelta(days=1)


def _first_day_with_root(root: int, year: int = 2026) -> date:
    return next(d for d in _days_of(year) if date_number(d).root == root)


# ---------------------------------------------------------------------------
# NUM-40 — personal year, all three D1 epochs
# ---------------------------------------------------------------------------
def test_personal_year_birthday_epoch_after_the_birthday() -> None:
    """17 May 1990, read on 27 July 2026.

    Birthday has passed, so the governing year is 2026:
    day 17 -> 1+7 = 8, month 5 -> 5, year 2026 -> 2+0+2+6 = 10. Total 23.
    """
    py = personal_year(NATIVE_DOB, date(2026, 7, 27), epoch=PersonalYearEpoch.BIRTHDAY)
    assert py.governing_year == 2026
    assert py.reading.total == 23
    assert py.reading.compound == 23, "the compound outranks the root and is never dropped"
    assert py.root == 5
    assert py.reading.graha == "MERCURY"
    assert (py.cycle_start, py.cycle_end) == (date(2026, 5, 17), date(2027, 5, 16))


def test_personal_year_birthday_epoch_before_the_birthday_uses_the_previous_year() -> None:
    """The day before the birthday still belongs to the previous personal year.

    Governing year 2025: 8 + 5 + (2+0+2+5) = 22.
    """
    py = personal_year(NATIVE_DOB, date(2026, 5, 16), epoch=PersonalYearEpoch.BIRTHDAY)
    assert py.governing_year == 2025
    assert py.reading.total == 22
    assert py.root == 4
    assert py.cycle_end == date(2026, 5, 16)
    assert py.contains(date(2026, 5, 16))
    assert not py.contains(date(2026, 5, 17))


def test_the_birthday_itself_starts_the_new_cycle() -> None:
    before = personal_year(NATIVE_DOB, date(2026, 5, 16), epoch=PersonalYearEpoch.BIRTHDAY)
    on = personal_year(NATIVE_DOB, date(2026, 5, 17), epoch=PersonalYearEpoch.BIRTHDAY)
    assert before.governing_year + 1 == on.governing_year
    assert before.cycle_end + timedelta(days=1) == on.cycle_start


def test_january_epoch_ignores_the_birthday() -> None:
    """The dominant published convention: the calendar year is the governing year.

    Read on 1 January 2026, before the May birthday, the number is still 2026's.
    """
    early = personal_year(NATIVE_DOB, date(2026, 1, 1), epoch=PersonalYearEpoch.JANUARY)
    late = personal_year(NATIVE_DOB, date(2026, 12, 31), epoch=PersonalYearEpoch.JANUARY)
    assert early.governing_year == late.governing_year == 2026
    assert early.reading.total == late.reading.total == 23
    assert (early.cycle_start, early.cycle_end) == (date(2026, 1, 1), date(2026, 12, 31))


def test_the_two_default_epochs_genuinely_disagree() -> None:
    """If they always agreed, the flag would be decoration.

    January and birthday differ for every date between 1 January and the
    birthday — which for this native is over a third of the year.
    """
    disagreements = sum(
        1
        for d in _days_of(2026)
        if personal_year(NATIVE_DOB, d, epoch=PersonalYearEpoch.JANUARY).root
        != personal_year(NATIVE_DOB, d, epoch=PersonalYearEpoch.BIRTHDAY).root
    )
    assert disagreements == 136, "1 Jan .. 16 May inclusive"


def test_chithirai_epoch_rolls_at_puthandu() -> None:
    before = personal_year(
        NATIVE_DOB, date(2026, 4, 13),
        epoch=PersonalYearEpoch.CHITHIRAI, chithirai_start_for=_puthandu,
    )
    on = personal_year(
        NATIVE_DOB, date(2026, 4, 14),
        epoch=PersonalYearEpoch.CHITHIRAI, chithirai_start_for=_puthandu,
    )
    assert before.governing_year == 2025
    assert on.governing_year == 2026
    assert (on.cycle_start, on.cycle_end) == (date(2026, 4, 14), date(2027, 4, 13))


def test_chithirai_epoch_refuses_to_guess_puthandu() -> None:
    """The date moves 13-15 April. Assuming it would be a silent wrong answer."""
    with pytest.raises(ValueError, match="Puthandu resolver"):
        personal_year(NATIVE_DOB, date(2026, 7, 27), epoch=PersonalYearEpoch.CHITHIRAI)


def test_all_three_epochs_are_reachable_and_the_flag_parser_refuses_typos() -> None:
    for value in ("birthday", "january", "chithirai"):
        assert resolve_epoch(value).value == value
    assert resolve_epoch(" JANUARY ") is PersonalYearEpoch.JANUARY
    with pytest.raises(ValueError, match="unknown personal-year epoch"):
        resolve_epoch("gregorian")


def test_leap_day_birth_rolls_to_1_march_in_a_common_year() -> None:
    leap_born = date(1992, 2, 29)
    on_feb_29_year = personal_year(leap_born, date(2024, 2, 29), epoch=PersonalYearEpoch.BIRTHDAY)
    assert on_feb_29_year.cycle_start == date(2024, 2, 29)

    # 2025 is common: 28 Feb is still the old cycle, 1 March starts the new one.
    assert personal_year(leap_born, date(2025, 2, 28), epoch=PersonalYearEpoch.BIRTHDAY).governing_year == 2024
    assert personal_year(leap_born, date(2025, 3, 1), epoch=PersonalYearEpoch.BIRTHDAY).governing_year == 2025


# ---------------------------------------------------------------------------
# NUM-41 — personal month and day
# ---------------------------------------------------------------------------
def test_personal_month_and_day_are_worked_by_hand() -> None:
    """Personal year 5, July 2026, 27th.

    month: 5 + 7 = 12 -> compound 12, root 3.
    day:   3 + 27 = 30 -> compound 30, root 3.
    """
    cycle = personal_cycle(NATIVE_DOB, date(2026, 7, 27), epoch=PersonalYearEpoch.BIRTHDAY)
    assert cycle.year.root == 5
    assert (cycle.month.total, cycle.month.compound, cycle.month.root) == (12, 12, 3)
    assert (cycle.day.total, cycle.day.compound, cycle.day.root) == (30, 30, 3)


def test_personal_month_and_day_reject_out_of_range_inputs() -> None:
    with pytest.raises(ValueError):
        personal_month(5, 13)
    with pytest.raises(ValueError):
        personal_month(0, 7)
    with pytest.raises(ValueError):
        personal_day(3, 32)


def test_every_personal_day_of_a_year_is_a_valid_reading() -> None:
    """Property: no date produces a zero root or a missing graha."""
    for day in _days_of(2026):
        cycle = personal_cycle(NATIVE_DOB, day, epoch=PersonalYearEpoch.BIRTHDAY)
        assert 1 <= cycle.day.root <= 9
        assert cycle.day.graha
        assert cycle.day.reduction_chain[-1] == cycle.day.root


# ---------------------------------------------------------------------------
# NUM-42 / NUM-44 — date scoring and the doctrine guard
# ---------------------------------------------------------------------------
def test_date_number_sums_every_digit() -> None:
    """27 July 2026 -> (2+7) + 7 + (2+0+2+6) = 9 + 7 + 10 = 26."""
    reading = date_number(date(2026, 7, 27))
    assert reading.total == 26
    assert reading.compound == 26
    assert reading.root == 8
    assert reading.graha == "SATURN"


def test_adjustment_is_bounded_and_symmetric_across_the_ranking() -> None:
    favourable = favourable_numbers_for(7)  # Thula lagna
    best, worst = favourable[0], favourable[-1]

    best_day = _first_day_with_root(best)
    worst_day = _first_day_with_root(worst)

    high = score_date(best_day, favourable_numbers=favourable)
    low = score_date(worst_day, favourable_numbers=favourable)
    assert high.adjustment == NUMEROLOGY_ADJUSTMENT_BOUND
    assert low.adjustment == -NUMEROLOGY_ADJUSTMENT_BOUND
    assert high.favourability_rank == 1
    assert low.favourability_rank == 9


def test_no_chart_means_no_opinion() -> None:
    scored = score_date(date(2026, 7, 27))
    assert scored.adjustment == 0
    assert scored.favourability_rank is None
    assert "No chart was supplied" in scored.note_en


def test_numerology_can_never_promote_a_flagged_date() -> None:
    """Plan §7: a numerologically ideal date that is astrologically inauspicious
    must never be recommended. The clamp is in the engine, not in the caller."""
    favourable = favourable_numbers_for(7)
    ideal_day = _first_day_with_root(favourable[0])

    clean = score_date(ideal_day, favourable_numbers=favourable, has_astrological_caution=False)
    flagged = score_date(ideal_day, favourable_numbers=favourable, has_astrological_caution=True)

    assert clean.adjustment > 0
    assert flagged.adjustment == 0
    assert flagged.clamped_by_astrology is True
    assert "flagged this day" in flagged.note_en


def test_a_flagged_date_may_still_be_pushed_down() -> None:
    """The clamp is one-directional. Numerology may lower a flagged date's
    ranking; it may only never raise it."""
    favourable = favourable_numbers_for(7)
    poor_day = _first_day_with_root(favourable[-1])
    flagged = score_date(poor_day, favourable_numbers=favourable, has_astrological_caution=True)
    assert flagged.adjustment == -NUMEROLOGY_ADJUSTMENT_BOUND
    assert flagged.clamped_by_astrology is False


def test_the_same_date_reads_differently_for_two_charts() -> None:
    """The whole moat in one assertion: a date is not lucky or unlucky in
    itself, it is lucky or unlucky *for a chart*."""
    day = date(2026, 7, 27)  # root 8 -> Sani
    ranks = {
        lagna: score_date(day, favourable_numbers=favourable_numbers_for(lagna)).favourability_rank
        for lagna in range(1, 13)
    }
    assert len(set(ranks.values())) > 1, "a chart-blind engine would return one rank for all lagnas"


def test_score_date_rejects_a_malformed_ranking() -> None:
    with pytest.raises(ValueError, match="ranking of all nine numbers"):
        score_date(date(2026, 7, 27), favourable_numbers=(1, 2, 3))


def test_date_notes_carry_no_fear_framing() -> None:
    """Plan §9.3. A quiet number gets a quiet word, never a warning."""
    favourable = favourable_numbers_for(7)
    for day in (date(2026, m, 1) for m in range(1, 13)):
        for flagged in (False, True):
            scored = score_date(
                day, favourable_numbers=favourable, has_astrological_caution=flagged
            )
            lowered = scored.note_en.lower()
            for term in BANNED_FEAR_TERMS:
                assert term not in lowered, f"{term!r} in {scored.note_en!r}"
            assert scored.note_ta, "Tamil is not optional"


# ---------------------------------------------------------------------------
# NUM-45 — business launch
# ---------------------------------------------------------------------------
def test_business_launch_blends_date_name_and_personal_year() -> None:
    launch = date(2026, 9, 14)
    name = score_text("Vinaadi Labs")
    result = business_launch_score(
        launch,
        lagna_rasi=7,
        name_number=name,
        scored_name="Vinaadi Labs",
        owner_birth_date=NATIVE_DOB,
    )
    assert 0 <= result.score <= 100
    assert {label for label, _ in result.components} == {"date", "name", "personal_year"}
    assert result.scored_name == "Vinaadi Labs"
    assert result.personal_year_number is not None


def test_business_launch_works_from_the_date_alone() -> None:
    result = business_launch_score(date(2026, 9, 14), lagna_rasi=7)
    assert {label for label, _ in result.components} == {"date"}
    assert result.name_number is None
    assert result.personal_year_number is None
    assert 0 <= result.score <= 100


def test_business_launch_never_clears_a_date_on_its_own() -> None:
    """Numerology ranks launch dates. Muhurta decides whether a date is fit to
    act on at all, and the reading has to say so out loud."""
    result = business_launch_score(date(2026, 9, 14), lagna_rasi=7)
    assert result.requires_muhurta_confirmation is True
    assert any("muhurta" in reason.lower() for reason in result.reasons_en)
    assert any("முகூர்த்த" in reason for reason in result.reasons_ta)


def test_business_launch_reasons_carry_no_fear_framing() -> None:
    for lagna in range(1, 13):
        result = business_launch_score(
            date(2026, 9, 14), lagna_rasi=lagna, owner_birth_date=NATIVE_DOB
        )
        blob = " ".join(result.reasons_en).lower()
        for term in BANNED_FEAR_TERMS:
            assert term not in blob, f"{term!r} in launch reasons for lagna {lagna}"


# ---------------------------------------------------------------------------
# Service layer — layering, without a database
# ---------------------------------------------------------------------------
class _FakeSlot:
    """Minimal stand-in for MuhurtaSlot: only date/score/cautions are read."""

    def __init__(self, day: date, score: float, cautions: list[str] | None = None):
        self.date = day
        self.score = score
        self.cautions = cautions or []


class _FakeNaal:
    def __init__(self, day: date):
        self.date = day.isoformat()


class _FakeMatch:
    def __init__(self, day: date, score: int, recommended: bool):
        self.naal = _FakeNaal(day)
        self.match_score = score
        self.is_recommended = recommended


def test_layering_never_adds_or_drops_a_muhurta_slot() -> None:
    favourable = favourable_numbers_for(7)
    slots = [_FakeSlot(d, 70.0) for d in (date(2026, 8, n) for n in (3, 11, 19, 27))]
    layered = svc.layer_onto_muhurta_slots(slots, favourable_numbers=favourable)
    assert {row.slot.date for row in layered} == {s.date for s in slots}
    assert len(layered) == len(slots)


def test_a_flagged_slot_can_never_outrank_a_clean_one() -> None:
    """Even with a perfect number and a much higher raw score."""
    favourable = favourable_numbers_for(7)
    ideal = _first_day_with_root(favourable[0])
    poor = _first_day_with_root(favourable[-1])

    flagged_but_strong = _FakeSlot(ideal, 95.0, cautions=["Rahu Kalam overlaps this slot"])
    clean_but_weak = _FakeSlot(poor, 40.0)

    layered = svc.layer_onto_muhurta_slots(
        [flagged_but_strong, clean_but_weak], favourable_numbers=favourable
    )
    assert layered[0].slot is clean_but_weak
    assert layered[1].slot is flagged_but_strong
    assert layered[1].numerology.adjustment == 0, "the flagged slot got no numerological lift"


def test_an_unrecommended_naal_can_never_outrank_a_recommended_one() -> None:
    favourable = favourable_numbers_for(7)
    ideal = _first_day_with_root(favourable[0])
    poor = _first_day_with_root(favourable[-1])

    chandrashtama = _FakeMatch(ideal, 90, recommended=False)
    recommended = _FakeMatch(poor, 55, recommended=True)

    layered = svc.layer_onto_naal_matches(
        [chandrashtama, recommended], favourable_numbers=favourable
    )
    assert layered[0].match is recommended
    assert layered[1].match is chandrashtama
    # is_recommended is read, never written.
    assert chandrashtama.is_recommended is False


def test_layering_reorders_within_a_band() -> None:
    """The adjustment has to actually do something, or the phase is decoration."""
    favourable = favourable_numbers_for(7)
    ideal = _first_day_with_root(favourable[0])
    poor = _first_day_with_root(favourable[-1])

    # Astrologically near-identical; numerology breaks the tie.
    slots = [_FakeSlot(poor, 71.0), _FakeSlot(ideal, 70.0)]
    layered = svc.layer_onto_muhurta_slots(slots, favourable_numbers=favourable)
    assert layered[0].slot.date == ideal
    assert layered[0].adjusted_score == 78.0  # 70 + 8
    assert layered[1].adjusted_score == 63.0  # 71 - 8
    assert layered[0].slot.score == 70.0, "the astrology's own score is never overwritten"


def test_configured_epoch_reads_the_flag() -> None:
    from app.services import feature_flags

    assert svc.configured_epoch() is PersonalYearEpoch.BIRTHDAY
    feature_flags.set_flag("numerology_personal_year_epoch", "january")
    try:
        assert svc.configured_epoch() is PersonalYearEpoch.JANUARY
    finally:
        feature_flags.reset_flag("numerology_personal_year_epoch")


def test_service_entry_points_are_dark_while_the_flag_is_off() -> None:
    from fastapi import HTTPException

    from app.services import feature_flags

    feature_flags.set_flag("numerology_engine", False)
    try:
        assert svc.numerology_enabled() is False
        with pytest.raises(HTTPException) as exc:
            svc.require_numerology_enabled()
        assert exc.value.status_code == 404
    finally:
        feature_flags.reset_flag("numerology_engine")


def test_chithirai_resolver_agrees_with_the_almanac() -> None:
    """The one test here that touches the ephemeris.

    Puthandu is published as 14 April for each of these years. Pinning them
    catches an ayanamsa or sunset-cutoff regression in ``tamil_calendar`` that
    would silently shift every Chithirai-epoch personal year by a year for
    anyone born in the first half of April.
    """
    for year in (2024, 2025, 2026, 2027):
        assert svc.chithirai_start(year) == date(year, 4, 14)


def test_puthandu_is_not_always_14_april() -> None:
    """Which is why the resolver scans instead of hardcoding.

    Measured across 1960-2060 at the Chennai reference point: 14 April in 83
    years, 13 April in 14, 15 April in 4.
    """
    landings = [svc.chithirai_start(y) for y in range(1960, 2061)]
    counts = {(d.month, d.day): 0 for d in landings}
    for d in landings:
        counts[(d.month, d.day)] += 1
    assert counts == {(4, 14): 83, (4, 13): 14, (4, 15): 4}
