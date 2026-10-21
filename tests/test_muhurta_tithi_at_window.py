"""D4 — the muhurta window is elected and judged on the tithi in force *at it*.

The defect: `score_day` judges the tithi at sunrise, which is what names the day,
while the picker could return a window hours later in the next tithi. Measured
at Tiruppur over 2026-10-01 + 182 days across the 30 sourced activities, 595
offered windows were judged on a tithi that was not running during them and 40
sat inside a tithi the activity's own text vetoes.

The question that surfaced it was a family's, about a tonsure on Mon 26 Oct
2026: "the Pournami ends at 9:42 — why not do it after?" The honest answer is
that the next tithi, Prathamai, is on the same avoid list, so the engine's
morning window stands; the product now says so on the card.

What these tests cannot see, stated beside the gate as CLAUDE.md asks:
* the rendered card — they assert the API factor list, not the web/mobile UI;
* Tamil quality — they check script and period-words, not a native review;
* the paksha filter — `paksha=` still selects days by their sunrise fortnight,
  so a window may be elected in the other fortnight on a Pournami/Amavasai
  transition day.
"""
from __future__ import annotations

import re
from datetime import date, timedelta

import pytest

from app.calculations import muhurta_engine as eng
from app.calculations.muhurta_engine import TITHI_FAMILY, Verdict
from app.services.muhurta_service import (
    _best_time_window,
    _judge_moment,
    _rejudged_at_window,
    _Window,
    _window_candidates,
    find_best_muhurta_slots,
)
from app.services.panchangam_cache import calculate_daily_panchangam

pytestmark = pytest.mark.no_db

# Tiruppur — a city, not a person. LAGNA_RASI is an arbitrary fixed sign so the
# hora path is exercised; it is not anyone's chart.
LAT, LON, TZ = 11.1085, 77.3411, "Asia/Kolkata"
LAGNA_RASI = 5
SWEEP_START = date(2026, 10, 1)
SWEEP_DAYS = 45
ACTIVITIES = ("TONSURE", "MARRIAGE", "EAR_BORING", "NAMING_CEREMONY", "GOLD", "PURCHASE")


@pytest.fixture(scope="module")
def snapshots() -> list:
    return [calculate_daily_panchangam(SWEEP_START + timedelta(days=i), LAT, LON, TZ) for i in range(SWEEP_DAYS)]


def _cells(snapshots):
    for snapshot in snapshots:
        for activity in ACTIVITIES:
            day = eng.score_day(snapshot, activity, None)
            yield snapshot, activity, day, _best_time_window(snapshot, activity, LAGNA_RASI)


def _midpoint(window):
    return window.start + (window.end - window.start) / 2


def _shape(factors):
    return [(f.factor, f.verdict, f.contribution) for f in factors]


# ── the engine half ─────────────────────────────────────────────────────────

def test_tithi_factors_is_exactly_what_score_day_emits(snapshots):
    """One definition of the family; the window answer can only differ from the
    day answer by the tithi, never by a second copy of the rules drifting."""
    for snapshot in snapshots:
        for activity in ACTIVITIES:
            day = eng.score_day(snapshot, activity, None)
            listed = [f for f in day.factors if f.factor in TITHI_FAMILY]
            assert _shape(listed) == _shape(eng.tithi_factors(snapshot, activity))


def test_inside_the_sunrise_span_the_window_answer_is_the_day_answer(snapshots):
    for snapshot in snapshots:
        first = snapshot.tithi_spans[0]
        moment = first.start + (first.end - first.start) / 2
        assert first.number == snapshot.tithi_number
        for activity in ACTIVITIES:
            assert _shape(eng.tithi_factors_at(snapshot, moment, activity)) == _shape(
                eng.tithi_factors(snapshot, activity)
            )


def test_no_span_means_no_guess(snapshots):
    """A pre-v43 cache record has no spans; the window must then keep the day's
    sunrise-judged tithi rather than fabricate one."""
    from dataclasses import replace

    bare = replace(snapshots[0], tithi_spans=())
    assert eng.tithi_factors_at(bare, bare.sunrise, "TONSURE") is None
    day = eng.score_day(bare, "TONSURE", None)
    window = _Window(bare.sunrise, bare.sunrise, 0.0, None, _judge_moment(bare, "TONSURE", bare.sunrise))
    assert _rejudged_at_window(day, window) is day


def test_krishna_prathamai_is_paksha_exempt_but_still_tithi_avoided_for_tonsure():
    """Two statements at two levels, both kept as printed (Ch. V p.37-39): the
    first five dark-fortnight tithis escape the *fortnight* penalty, but p.39's
    tithi list still names Prathamai. Krishna 1-5 does not lift it."""
    snapshot = calculate_daily_panchangam(date(2026, 10, 26), LAT, LON, TZ)
    prathamai = next(s for s in snapshot.tithi_spans if s.number == 16)
    family = {f.factor: f for f in eng.tithi_factors_at(snapshot, prathamai.start, "TONSURE")}
    assert family["PAKSHA"].verdict is Verdict.NEUTRAL
    assert family["TITHI"].verdict is Verdict.PENALTY


# ── the picker half: invariants over a sweep ────────────────────────────────

def test_the_old_defect_was_live_in_this_sweep(snapshots):
    """Proof the invariants below are not vacuous: windows really do fall in a
    tithi other than the sunrise one, with a different verdict."""
    diverged = 0
    for snapshot, activity, _day, window in _cells(snapshots):
        at_window = eng.tithi_factors_at(snapshot, _midpoint(window), activity)
        if at_window is not None and _shape(at_window) != _shape(eng.tithi_factors(snapshot, activity)):
            diverged += 1
    assert diverged > 0


def test_offered_window_is_judged_on_the_tithi_running_in_it(snapshots):
    """The D4 invariant, stated on the factor list the card renders."""
    checked = 0
    for snapshot, activity, day, window in _cells(snapshots):
        rejudged = _rejudged_at_window(day, window)
        if rejudged.vetoed:
            continue
        listed = [f for f in rejudged.factors if f.factor in TITHI_FAMILY]
        assert _shape(listed) == _shape(eng.tithi_factors_at(snapshot, _midpoint(window), activity))
        assert rejudged.score - day.score == pytest.approx(
            sum(f.contribution for f in listed) - sum(f.contribution for f in day.factors if f.factor in TITHI_FAMILY)
        )
        checked += 1
    assert checked > 0


def test_a_vetoed_moment_is_never_elected_while_an_electable_one_exists(snapshots):
    for snapshot, activity, _day, window in _cells(snapshots):
        if not window.moment.vetoed:
            continue
        assert all(w.moment.vetoed for w in _window_candidates(snapshot, activity, LAGNA_RASI))


def test_no_window_straddles_a_change_in_its_own_judgement(snapshots):
    """A window is never half in an avoided tithi: every instant inside it
    judges the same as the midpoint it is reported by."""
    for snapshot, activity, _day, _window in _cells(snapshots):
        for window in _window_candidates(snapshot, activity, LAGNA_RASI):
            for k in range(1, 8):
                probe = window.start + (window.end - window.start) * (k / 8)
                judged = _judge_moment(snapshot, activity, probe)
                assert (judged.vetoed, judged.score) == (window.moment.vetoed, window.moment.score)


def test_a_day_vetoed_only_by_its_sunrise_tithi_can_be_rescued():
    """EAR_BORING's tithi list is closed ("other Thithis are not to be
    considered"), so a sunrise tithi outside it vetoes the day — but only the
    moment matters. Searched rather than hard-coded so the case survives an
    ephemeris refresh; required to occur so the test cannot pass vacuously."""
    rescued = 0
    for i in range(120):
        snapshot = calculate_daily_panchangam(SWEEP_START + timedelta(days=i), LAT, LON, TZ)
        for activity in ("EAR_BORING", "NEW_ORNAMENT", "TONSURE", "NAMING_CEREMONY"):
            day = eng.score_day(snapshot, activity, None)
            vetoes = [f for f in day.factors if f.verdict is Verdict.VETO]
            if not vetoes or any(f.factor not in TITHI_FAMILY for f in vetoes):
                continue
            window = _best_time_window(snapshot, activity, LAGNA_RASI)
            rejudged = _rejudged_at_window(day, window)
            if rejudged.vetoed:
                continue
            assert not any(f.verdict is Verdict.VETO for f in window.moment.tithi_factors)
            assert eng.tithi_span_at(snapshot, _midpoint(window)).number != snapshot.tithi_number
            rescued += 1
    assert rescued > 0


# ── the case that started it ────────────────────────────────────────────────

@pytest.fixture(scope="module")
def tonsure_october():
    return find_best_muhurta_slots(
        None, "TONSURE", date(2026, 10, 13), date(2026, 10, 31), None,
        activity_latitude=LAT, activity_longitude=LON, activity_timezone=TZ,
        activity_place="Tiruppur",
    )


def test_26_oct_keeps_its_morning_window_and_says_why(tonsure_october):
    slot = next(s for s in tonsure_october.data.slots if s.date == date(2026, 10, 26))
    # Thulam rising, Aswini, Pournami: the joint best of the day. Moving past
    # 09:42 trades Pournami for Prathamai — same avoid list — and gives up Thulam.
    assert (slot.time_start, slot.time_end) == ("06:35", "07:39")
    names = [f.factor for f in slot.factors]
    tithi = slot.factors[names.index("TITHI")]
    assert tithi.verdict == "PENALTY" and "Pournami" in tithi.reason.en

    note = slot.factors[names.index("TITHI_AT_WINDOW")]
    assert names.index("TITHI_AT_WINDOW") == max(i for i, n in enumerate(names) if n in TITHI_FAMILY) + 1
    assert note.verdict == "NEUTRAL" and note.contribution == 0.0
    assert "9:42 am" in note.reason.en
    assert "also a tithi to avoid" in note.reason.en
    assert "later start does not escape" in note.reason.en
    # Tamil: period-word before the time, never a Latin am/pm (owner ruling 2026-09-17).
    assert "காலை 9:42" in note.reason.ta
    assert not re.search(r"\b(am|pm)\b", note.reason.ta, re.IGNORECASE)
    assert "பிரதமை" in note.reason.ta


def test_a_window_in_a_later_tithi_says_which_tithi_it_is_judged_on(tonsure_october):
    """Every slot whose window runs in a tithi other than the day's sunrise one
    carries the disclosure, so the card cannot contradict the almanac header."""
    seen = 0
    for slot in tonsure_october.data.slots:
        snapshot = calculate_daily_panchangam(slot.date, LAT, LON, TZ)
        start, end = (
            snapshot.sunrise.replace(hour=int(t[:2]), minute=int(t[3:5]), second=0, microsecond=0)
            for t in (slot.time_start, slot.time_end)
        )
        # The midpoint is the instant the note is defined on: a window may span
        # two tithis that judge alike, and is then named by the one at its middle.
        span = eng.tithi_span_at(snapshot, start + (end - start) / 2)
        if span is None or span.number == snapshot.tithi_number:
            continue
        note = next(f for f in slot.factors if f.factor == "TITHI_AT_WINDOW")
        assert "the tithi at sunrise" in note.reason.en
        assert "உதயத் திதி" in note.reason.ta
        seen += 1
    assert seen > 0, "no slot in the range ran in a later tithi — pick a range that has one"


def test_an_avoided_tithi_day_no_longer_outranks_a_favoured_window(tonsure_october):
    """19 Oct was offered on Ashtami (avoided); 23 Oct has a window in Thrayodasi
    (favoured) that the sunrise-only picker could not find, since that day is
    named for Dvadasi."""
    dates = [s.date for s in tonsure_october.data.slots]
    assert date(2026, 10, 23) in dates
    slot = next(s for s in tonsure_october.data.slots if s.date == date(2026, 10, 23))
    tithi = next(f for f in slot.factors if f.factor == "TITHI")
    assert tithi.verdict == "BONUS" and "Thrayodasi" in tithi.reason.en
