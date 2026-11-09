"""Deferred-checks plan, item 7: Dasa Sandhi, engine only (owner ruling 2026-11-09).

Synthetic timelines only. Bhukti and pratyantara boundaries are checked against
an independent closed form (a sub-period lasts parent x lord / 120 years), not
against the code under test. Jagannatha Hora comparison of the dates is still
owed: it needs the desktop program, which this suite cannot run.
"""
from __future__ import annotations

import inspect
import random
import re
from datetime import UTC, date, datetime
from pathlib import Path

import pytest

from app.calculations import dasa_sandhi as ds
from app.calculations.astro import utc_datetime_to_julian_day
from app.calculations.dasha import (
    DASHA_YEARS,
    JULIAN_YEAR_DAYS,
    SEQUENCE,
    DashaPeriod,
    calculate_vimshottari_timeline,
)

pytestmark = pytest.mark.no_db

_BIRTH_JD = 2447892.5  # 1990-01-01 00:00 UT, synthetic


def _timeline(moon: float, birth_jd: float = _BIRTH_JD) -> tuple[DashaPeriod, ...]:
    return calculate_vimshottari_timeline(birth_jd, moon).mahadashas


def _prev(lord: str) -> str:
    return SEQUENCE[(SEQUENCE.index(lord) - 1) % 9]


def test_transitions_are_every_handover_and_never_the_birth() -> None:
    mahas = _timeline(100.0)
    ts = ds.transitions(mahas)
    assert len(ts) == len(mahas) - 1
    assert ts[0].at_jd == mahas[0].end_jd and ts[0].outgoing == mahas[0].lord
    assert all(t.at_jd > _BIRTH_JD for t in ts)
    for t in ts:
        assert SEQUENCE[(SEQUENCE.index(t.outgoing) + 1) % 9] == t.incoming


def test_mahadasa_dates_match_the_closed_form() -> None:
    """Moon at 0 deg Ashwini: Ketu's full 7 years remain, then the sequence."""
    mahas = _timeline(0.0)
    expected = _BIRTH_JD
    for i, period in enumerate(mahas[:9]):
        expected += DASHA_YEARS[period.lord] * JULIAN_YEAR_DAYS
        assert period.end_jd == pytest.approx(expected, abs=1e-6), i
    # 7 x 365.25 = 2556.75 days after 1990-01-01 00:00 UT is 1996-12-31 18:00 UT.
    assert ds.transitions(mahas)[0].at == date(1996, 12, 31)


@pytest.mark.parametrize("moon", [0.0, 47.3, 133.0, 250.9, 359.5])
def test_option_b_is_the_last_bhukti_out_and_the_first_bhukti_in(moon: float) -> None:
    mahas = _timeline(moon)
    for w in ds.sandhi_windows(mahas, "B_BHUKTI", fixed_months=6):
        out, inc = w.transition.outgoing, w.transition.incoming
        last = DASHA_YEARS[out] * DASHA_YEARS[_prev(out)] / 120 * JULIAN_YEAR_DAYS
        first = DASHA_YEARS[inc] * DASHA_YEARS[inc] / 120 * JULIAN_YEAR_DAYS
        assert w.transition.at_jd - w.start_jd == pytest.approx(last, abs=1e-6)
        assert w.end_jd - w.transition.at_jd == pytest.approx(first, abs=1e-6)


@pytest.mark.parametrize("moon", [0.0, 47.3, 250.9])
def test_option_c_is_the_last_pratyantara_out_and_the_first_in(moon: float) -> None:
    mahas = _timeline(moon)
    for w in ds.sandhi_windows(mahas, "C_PRATYANTARA", fixed_months=6):
        out, inc = w.transition.outgoing, w.transition.incoming
        last_antar = _prev(out)
        last = DASHA_YEARS[out] * DASHA_YEARS[last_antar] * DASHA_YEARS[_prev(last_antar)] / 120**2
        first = DASHA_YEARS[inc] ** 3 / 120**2
        assert w.transition.at_jd - w.start_jd == pytest.approx(last * JULIAN_YEAR_DAYS, abs=1e-6)
        assert w.end_jd - w.transition.at_jd == pytest.approx(first * JULIAN_YEAR_DAYS, abs=1e-6)


def test_option_a_spans_the_months_it_is_given() -> None:
    mahas = _timeline(47.3)
    for months in (6, 12):
        for w in ds.sandhi_windows(mahas, "A_FIXED", fixed_months=months):
            assert w.end_jd - w.start_jd == pytest.approx(2 * ds.months_to_days(months))


def test_windows_nest_c_inside_b_for_every_transition() -> None:
    mahas = _timeline(201.7)
    for b, c in zip(
        ds.sandhi_windows(mahas, "B_BHUKTI", fixed_months=6),
        ds.sandhi_windows(mahas, "C_PRATYANTARA", fixed_months=6),
        strict=True,
    ):
        assert b.start_jd <= c.start_jd < b.transition.at_jd < c.end_jd <= b.end_jd


def test_no_definition_has_a_default() -> None:
    """Owner ruling 2026-11-09: no astrologically authoritative default. The
    window option, its span, the tolerance and the horizon are all required."""
    required = {
        ds.sandhi_windows: {"option", "fixed_months"},
        ds.couple_transitions_within: {"from_jd", "horizon_years", "tolerance_days"},
        ds.couple_window_overlaps: {"option", "fixed_months", "from_jd", "horizon_years"},
    }
    for fn, names in required.items():
        params = inspect.signature(fn).parameters
        for name in names:
            assert params[name].default is inspect.Parameter.empty, (fn.__name__, name)
    assert ds.TIER == "engine_inference" and ds.RATIFIED is False


# ── Couple-level ──────────────────────────────────────────────────────────────

def _maha(lord: str, start: float, end: float) -> DashaPeriod:
    return DashaPeriod("maha", lord, start, end, date(2000, 1, 1), date(2000, 1, 1), 0)


def _two(change_jd: float) -> tuple[DashaPeriod, ...]:
    return (_maha("MARS", change_jd - 2000, change_jd), _maha("RAHU", change_jd, change_jd + 6000))


def test_the_tolerance_edge_is_exact() -> None:
    start = 2460000.5
    a = _two(start + 400)
    tol = ds.months_to_days(12)
    inside = ds.couple_transitions_within(a, _two(start + 400 + tol - 1), from_jd=start, horizon_years=7, tolerance_days=tol)
    outside = ds.couple_transitions_within(a, _two(start + 400 + tol + 1), from_jd=start, horizon_years=7, tolerance_days=tol)
    assert inside.flagged and not outside.flagged
    assert inside.pairs[0].gap_days == pytest.approx(tol - 1)


def test_zero_tolerance_stops_a_near_pair_from_flagging() -> None:
    """The plan's negative run: a pair 10 days apart flags at 12 months and
    must not at 0."""
    start = 2460000.5
    a, b = _two(start + 400), _two(start + 410)
    assert ds.couple_transitions_within(a, b, from_jd=start, horizon_years=7, tolerance_days=ds.months_to_days(12)).flagged
    assert not ds.couple_transitions_within(a, b, from_jd=start, horizon_years=7, tolerance_days=0).flagged


def test_a_change_outside_the_horizon_does_not_count() -> None:
    start = 2460000.5
    late = start + 7 * JULIAN_YEAR_DAYS + 30
    result = ds.couple_transitions_within(_two(late), _two(late), from_jd=start, horizon_years=7, tolerance_days=365)
    assert not result.flagged and result.transitions_a == ()


def test_swapping_partners_gives_the_same_result() -> None:
    rng = random.Random(5)
    for _ in range(300):
        a = _timeline(rng.uniform(0, 360), rng.uniform(2436934.5, 2451544.5))
        b = _timeline(rng.uniform(0, 360), rng.uniform(2436934.5, 2451544.5))
        start = rng.uniform(2455197.5, 2462502.5)
        tol = rng.choice([0, 182.6, 365.25])
        ab = ds.couple_transitions_within(a, b, from_jd=start, horizon_years=7, tolerance_days=tol)
        ba = ds.couple_transitions_within(b, a, from_jd=start, horizon_years=7, tolerance_days=tol)
        assert ab.swapped() == ba
        for option in ds.SANDHI_OPTIONS:
            o_ab = ds.couple_window_overlaps(a, b, option, fixed_months=6, from_jd=start, horizon_years=7)
            o_ba = ds.couple_window_overlaps(b, a, option, fixed_months=6, from_jd=start, horizon_years=7)
            assert sorted(o.overlap_days for o in o_ab) == pytest.approx(sorted(o.overlap_days for o in o_ba))


def test_window_overlap_is_clipped_to_the_horizon() -> None:
    start = 2460000.5
    a, b = _two(start + 10), _two(start + 20)
    overlaps = ds.couple_window_overlaps(a, b, "A_FIXED", fixed_months=6, from_jd=start, horizon_years=7)
    assert len(overlaps) == 1
    # A: [t-182.6, t+182.6] each; shared span is [start+20-182.6, start+10+182.6], clipped at start.
    assert overlaps[0].overlap_days == pytest.approx(10 + ds.months_to_days(6))


def test_a_real_timeline_pair_round_trips_through_dates() -> None:
    birth = utc_datetime_to_julian_day(datetime(1992, 6, 3, 4, 30, tzinfo=UTC))
    for w in ds.sandhi_windows(_timeline(77.7, birth), "B_BHUKTI", fixed_months=6):
        assert w.start < w.transition.at < w.end


# ── The ruling's other half: nothing reaches a reader ───────────────────────────

_SURFACES = ("app/api", "app/schemas", "app/services", "packages/shared/src", "web/app", "web/components", "web/lib", "mobile/app", "mobile/src")
_MENTION = re.compile(r"dasa_sandhi|dasaSandhi|DasaSandhi|couple_transitions_within|couple_window_overlaps")


def test_no_reader_surface_imports_or_names_dasa_sandhi() -> None:
    """Owner ruling 2026-11-09: no API field, card, score, dosham, parihara or
    warning until the astrologer rules. Comments that say it is not built are
    allowed; code that imports or emits it is not.
    Blind spot: a surface that recomputes a sandhi by hand under another name."""
    root = Path(__file__).resolve().parents[1]
    hits = []
    for rel in _SURFACES:
        for path in (root / rel).rglob("*"):
            if path.suffix not in {".py", ".ts", ".tsx"} or "node_modules" in path.parts:
                continue
            for n, line in enumerate(path.read_text(encoding="utf-8", errors="ignore").splitlines(), 1):
                code = line.split("#", 1)[0] if path.suffix == ".py" else line.split("//", 1)[0]
                if _MENTION.search(code) and not code.strip().startswith(("*", "/*", "{/*")):
                    hits.append(f"{path.relative_to(root)}:{n}")
    assert not hits, hits
