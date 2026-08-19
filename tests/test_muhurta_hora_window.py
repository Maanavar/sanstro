"""D1/D2 regression — the muhurta window and the hora it names must agree.

D1: `_score_hora` located a favoured hora and wrote its clock range into
`horaSupport`, while `_best_time_window` independently returned a Nalla Neram or
Abhijit slot. Nothing tied the two together, so the slot on the card and the
reason printed beside it routinely named different hours.

D2: the hora scan returned on the *first* favoured lord found in the first
twelve entries, so a lagna-lord hora later in the day lost to a generic one
earlier.

These assert over a sweep of days rather than one, because both defects are
day-shape dependent — the old code happened to agree with itself on some days.
"""
from __future__ import annotations

import re
from datetime import date, datetime, timedelta

import pytest

from app.calculations.panchangam import best_gowri_slot, calculate_daily_panchangam
from app.data.kuligai_polarity import rejects as kuligai_rejects
from app.services.muhurta_service import (
    _MIN_WINDOW,
    _SANDHYA_DURATION,
    _SIGN_LORDS,
    _activity_hora_lords,
    _best_time_window,
    _clear_good_day_kalas,
    _norm,
    _overlaps,
)

# Chennai — a location, not a person; no synthetic identity is needed here.
LATITUDE, LONGITUDE, TIMEZONE = 13.0827, 80.2707, "Asia/Kolkata"
SWEEP_START = date(2026, 6, 1)
SWEEP_DAYS = 60
ACTIVITIES = ("PURCHASE", "MARRIAGE", "JOB_START", "SPIRITUAL")
LAGNA_RASI = 5  # Simha — arbitrary, fixed so the sweep is deterministic

_HORA_RANGE = re.compile(r"\((\d{1,2}:\d{2} [ap]m)-(\d{1,2}:\d{2} [ap]m)\)")

pytestmark = pytest.mark.no_db


@pytest.fixture(scope="module")
def snapshots() -> list:
    """One panchangam per day. Computed once — this is the expensive part."""
    return [
        calculate_daily_panchangam(SWEEP_START + timedelta(days=i), LATITUDE, LONGITUDE, TIMEZONE)
        for i in range(SWEEP_DAYS)
    ]


def _named_hora_range(snapshot, text: str) -> tuple[datetime, datetime]:
    """The clock range the reason string itself prints, as datetimes on that day."""
    match = _HORA_RANGE.search(text)
    assert match, f"hora reason names no clock range: {text!r}"
    parsed = []
    for piece in match.groups():
        clock = datetime.strptime(piece, "%I:%M %p").time()
        parsed.append(datetime.combine(snapshot.date_local, clock, tzinfo=snapshot.sunrise.tzinfo))
    start, end = parsed
    if end <= start:  # a hora that crosses midnight
        end += timedelta(days=1)
    return start, end


def _cases(snapshots):
    for snapshot in snapshots:
        for activity in ACTIVITIES:
            yield snapshot, activity, _best_time_window(snapshot, activity, LAGNA_RASI)


def test_window_lies_inside_the_hora_its_own_reason_names(snapshots):
    """The D1 invariant, stated over the rendered string the user actually reads."""
    checked = 0
    for snapshot, _activity, window in _cases(snapshots):
        if window.hora_support is None:
            continue
        hora_start, hora_end = _named_hora_range(snapshot, window.hora_support.en)
        # Printed labels are minute-truncated, so allow the boundary minute.
        assert hora_start - timedelta(minutes=1) <= window.start
        assert window.end <= hora_end + timedelta(minutes=1)
        checked += 1
    assert checked > 0, "sweep never produced a hora-backed window — test is vacuous"


def test_old_algorithm_would_have_contradicted_itself(snapshots):
    """Proof the defect was live: reproduce the old pairing and catch it disagreeing.

    Old code named the first favoured hora in `snapshot.hora[:12]` and returned a
    window from `nalla_neram`, chosen independently. If those never diverged this
    whole fix would be theoretical — they diverge constantly.
    """
    contradictions = 0
    for snapshot in snapshots:
        for activity in ACTIVITIES:
            target_lords = _activity_hora_lords(activity, LAGNA_RASI)
            named = next((h for h in snapshot.hora[:12] if _norm(h.lord) in target_lords), None)
            old_slot = best_gowri_slot(snapshot.nalla_neram)
            if named is None or old_slot is None:
                continue
            if not (named.start <= old_slot.start and old_slot.end <= named.end):
                contradictions += 1
    assert contradictions > 0, "old pairing never disagreed — re-check the reproduction"


def test_window_never_intersects_rahu_kalam_or_yamagandam(snapshots):
    for snapshot, _activity, window in _cases(snapshots):
        for kalam in (snapshot.rahu_kalam, snapshot.yamagandam):
            if kalam is None:
                continue
            assert not _overlaps(window.start, window.end, kalam.start, kalam.end)


def test_kuligai_is_cut_only_for_the_activities_it_harms(snapshots):
    """EC-RULING-07 — Kuligai's sign follows the activity, so its exclusion must too.

    Kuligai repeats whatever is begun in it. A window for an act nobody wants
    repeated must still clear it; the blanket cut this replaces was the defect.
    """
    for snapshot, activity, window in _cases(snapshots):
        if snapshot.kuligai is None or not kuligai_rejects(activity):
            continue
        assert not _overlaps(window.start, window.end, snapshot.kuligai.start, snapshot.kuligai.end)


def test_the_kuligai_relaxation_actually_widens_the_candidate_set(snapshots):
    """Or the ruling shipped as a no-op nobody would notice.

    A favourable activity must see every kala an adverse one sees, plus the
    Kuligai-touched ones — asserted as containment, and required to be strict on
    at least one day of the sweep so the test cannot pass vacuously.
    """
    widened = 0
    for snapshot in snapshots:
        adverse = {(k.start, k.end) for k in _clear_good_day_kalas(snapshot, "MARRIAGE")}
        favourable = {(k.start, k.end) for k in _clear_good_day_kalas(snapshot, "GOLD")}
        assert adverse <= favourable
        if favourable > adverse:
            widened += 1
    assert widened > 0, "Kuligai never touched a good Gowri kala in the sweep — test is vacuous"


def test_window_excludes_sandhya_and_never_crosses_its_local_date(snapshots):
    for snapshot, _activity, window in _cases(snapshots):
        assert window.start >= snapshot.sunrise + _SANDHYA_DURATION
        assert window.end <= snapshot.sunset - _SANDHYA_DURATION
        assert window.start.date() == snapshot.date_local
        assert window.end.date() == snapshot.date_local


def test_window_sits_inside_a_good_gowri_kala(snapshots):
    for snapshot, activity, window in _cases(snapshots):
        kalas = _clear_good_day_kalas(snapshot, activity)
        if not kalas:  # Abhijit fallback — not drawn from the Gowri table
            continue
        assert any(k.start <= window.start and window.end <= k.end for k in kalas)


def test_lagna_lord_hora_wins_whenever_it_is_usable(snapshots):
    """D2 — best match, not first match, wherever the day offers the choice."""
    exercised = 0
    for snapshot, activity, window in _cases(snapshots):
        lagna_lord = _norm(_SIGN_LORDS[LAGNA_RASI])
        if lagna_lord not in _activity_hora_lords(activity, LAGNA_RASI):
            continue
        usable = any(
            min(hora.end, kala.end) - max(hora.start, kala.start) >= _MIN_WINDOW
            for hora in snapshot.hora
            if _norm(hora.lord) == lagna_lord
            for kala in _clear_good_day_kalas(snapshot, activity)
        )
        if not usable:
            continue
        assert window.hora_support is not None
        assert "Lagna lord" in window.hora_support.en
        assert window.hora_bonus == 13.0
        exercised += 1
    assert exercised > 0, "sweep never offered a usable lagna-lord hora — test is vacuous"


def test_hora_bonus_is_earned_only_by_a_window_we_can_name(snapshots):
    for _snapshot, _activity, window in _cases(snapshots):
        assert (window.hora_support is None) == (window.hora_bonus == 0.0)
        assert window.end - window.start >= _MIN_WINDOW or window.hora_support is None


def test_window_is_bilingual_and_names_the_planet_in_tamil(snapshots):
    for _snapshot, _activity, window in _cases(snapshots):
        if window.hora_support is None:
            continue
        assert window.hora_support.ta and window.hora_support.en
        # The Tamil string must not fall back to the English planet name.
        assert not re.search(r"[A-Za-z]{3,}", window.hora_support.ta)
