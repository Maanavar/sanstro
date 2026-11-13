"""Dasa Sandhi (தசா சந்தி): the junction where one mahadasa hands over to the next.

**Surface ratified by the owner 2026-11-12** (spec §0.4 / D4). One configuration
reaches a reader, through `couple_reading` and nothing else:

* Mahadasa level, window `A_FIXED` +/- 6 months (`FIXED_MONTHS_RULED`).
* The **primary** measure is the change-point gap: the days between the two
  mahadasa changes. Under 6 months = `CLOSE`, 6-12 months = `NEAR`, over
  12 months is **not flagged** and never reaches the reading.
* The **supplementary** measure is the window gap, shown beside it. It never
  decides a band (spec §0.2: the vendor sample's own couple has a 5.8-month
  window gap and is rated Satisfactory).
* Horizon 10 years (`HORIZON_YEARS_RULED`) from the planned marriage date when
  one is given, else the reference date. No CI field carries a planned marriage
  date yet, so CI passes the reference date.

It **describes and times, and never grades**: no score, no dosham, no parihara,
no veto, no mortality claim (EC-RULING-06). The thresholds are a vendor-documented
practice (`PROKERALA_PORUTHAM_P17`), not the astrologer's, so the reading ships
at `engine_inference` and says whose practice it is.

Everything below `couple_reading` stays measurement groundwork for
`scripts/audit/deferred_checks_measurements.py`. **No default definition there,
on purpose**: those functions take the window option, tolerance and horizon as
required arguments, so no caller inherits a span it did not choose. The three
candidate windows are the ones the plan lists, none preferred:

* ``A_FIXED``: a fixed span either side of the change (the plan's 6 months;
  `fixed_months` is a parameter, not a ruling).
* ``B_BHUKTI``: the last bhukti of the outgoing mahadasa and the first bhukti
  of the incoming one.
* ``C_PRATYANTARA``: the last pratyantara of the outgoing mahadasa and the
  first pratyantara of the incoming one.

Two couple-level readings, kept apart because they are different claims:

* `couple_transitions_within`: both partners' mahadasas change within
  `tolerance_days` of each other inside the horizon (the matching use).
* `couple_window_overlaps`: the two partners' sandhi windows, under one option,
  overlap inside the horizon.

The "same mahadasa lord for both" observation is a separate rule and is
deliberately not built here; it must never be folded into the sandhi.

Still unratified by a practitioner: the owner ruled the surface, not the
doctrine. A later step, not v1, may read the outgoing and incoming lords'
placement and strength (spec §0.4).
"""
from __future__ import annotations

from collections.abc import Sequence
from dataclasses import dataclass
from datetime import UTC, date, datetime
from typing import Literal

from app.calculations.astro import julian_day_to_utc_datetime, utc_datetime_to_julian_day
from app.calculations.dasha import JULIAN_YEAR_DAYS, DashaPeriod, _build_subperiods

SandhiOption = Literal["A_FIXED", "B_BHUKTI", "C_PRATYANTARA"]
SANDHI_OPTIONS: tuple[SandhiOption, ...] = ("A_FIXED", "B_BHUKTI", "C_PRATYANTARA")

TIER = "engine_inference"
#: The doctrine is still unratified by a practitioner; the owner ratified the
#: surface only (2026-11-12).
RATIFIED = False

#: The ruled configuration (spec §0.4). Only `couple_reading` uses these.
RULED_OPTION: SandhiOption = "A_FIXED"
FIXED_MONTHS_RULED = 6.0
HORIZON_YEARS_RULED = 10
#: Change-point gap bands, in months. At or over `BAND_NEAR_MONTHS`: not flagged.
BAND_CLOSE_MONTHS = 6.0
BAND_NEAR_MONTHS = 12.0
#: The reading cites the practice it came from, not doctrine.
RULE_SOURCE_ID = "PROKERALA_PORUTHAM_P17"

#: A month as a fixed fraction of the Julian year the dasa system uses, so a
#: tolerance in months converts to days the same way everywhere.
DAYS_PER_MONTH = JULIAN_YEAR_DAYS / 12.0


def months_to_days(months: float) -> float:
    return months * DAYS_PER_MONTH


def _date(jd: float) -> date:
    return julian_day_to_utc_datetime(jd).date()


@dataclass(frozen=True, slots=True)
class Transition:
    """One mahadasa change: `outgoing` ends and `incoming` begins at `at_jd`."""

    outgoing: str
    incoming: str
    at_jd: float
    at: date
    #: Index of the incoming mahadasa in the timeline it came from.
    index: int


@dataclass(frozen=True, slots=True)
class SandhiWindow:
    transition: Transition
    option: SandhiOption
    start_jd: float
    end_jd: float
    start: date
    end: date


def transitions(mahadashas: Sequence[DashaPeriod]) -> tuple[Transition, ...]:
    """Every handover between consecutive mahadasas.

    The opening mahadasa's start is the birth moment, not a handover, so it is
    never a transition. Consecutive periods are contiguous by construction
    (`dasha._build_periods`); a gap would be a timeline bug and is refused.
    """
    out: list[Transition] = []
    for i in range(1, len(mahadashas)):
        prev, cur = mahadashas[i - 1], mahadashas[i]
        if abs(prev.end_jd - cur.start_jd) > 1e-6:
            raise ValueError(f"Mahadasas {i - 1} and {i} are not contiguous")
        out.append(Transition(prev.lord, cur.lord, cur.start_jd, _date(cur.start_jd), i))
    return tuple(out)


def _window_bounds(
    mahadashas: Sequence[DashaPeriod], t: Transition, option: SandhiOption, fixed_months: float
) -> tuple[float, float]:
    outgoing, incoming = mahadashas[t.index - 1], mahadashas[t.index]
    if option == "A_FIXED":
        span = months_to_days(fixed_months)
        return t.at_jd - span, t.at_jd + span
    last_bhukti = _build_subperiods(outgoing, "antar")[-1]
    first_bhukti = _build_subperiods(incoming, "antar")[0]
    if option == "B_BHUKTI":
        return last_bhukti.start_jd, first_bhukti.end_jd
    if option == "C_PRATYANTARA":
        return (
            _build_subperiods(last_bhukti, "pratyantar")[-1].start_jd,
            _build_subperiods(first_bhukti, "pratyantar")[0].end_jd,
        )
    raise ValueError(f"Unknown sandhi option {option!r}")


def sandhi_windows(
    mahadashas: Sequence[DashaPeriod],
    option: SandhiOption,
    *,
    fixed_months: float,
    from_jd: float | None = None,
    to_jd: float | None = None,
) -> tuple[SandhiWindow, ...]:
    """One window per transition, under `option`; filtered to those that
    touch [from_jd, to_jd] when given. `fixed_months` is read by A only but is
    required, so no caller inherits a span it did not choose."""
    if option not in SANDHI_OPTIONS:
        raise ValueError(f"Unknown sandhi option {option!r}")
    out: list[SandhiWindow] = []
    for t in transitions(mahadashas):
        start, end = _window_bounds(mahadashas, t, option, fixed_months)
        if from_jd is not None and end < from_jd:
            continue
        if to_jd is not None and start > to_jd:
            continue
        out.append(SandhiWindow(t, option, start, end, _date(start), _date(end)))
    return tuple(out)


@dataclass(frozen=True, slots=True)
class TransitionPair:
    a: Transition
    b: Transition
    #: |a.at - b.at| in days.
    gap_days: float


@dataclass(frozen=True, slots=True)
class CoupleSandhi:
    from_jd: float
    to_jd: float
    tolerance_days: float
    transitions_a: tuple[Transition, ...]
    transitions_b: tuple[Transition, ...]
    pairs: tuple[TransitionPair, ...]

    @property
    def flagged(self) -> bool:
        return bool(self.pairs)

    def swapped(self) -> CoupleSandhi:
        return CoupleSandhi(
            self.from_jd, self.to_jd, self.tolerance_days, self.transitions_b, self.transitions_a,
            tuple(sorted((TransitionPair(p.b, p.a, p.gap_days) for p in self.pairs), key=_pair_key)),
        )


def _pair_key(p: TransitionPair) -> tuple[float, float]:
    return (p.a.at_jd, p.b.at_jd)


def _horizon(from_jd: float, horizon_years: float) -> float:
    if horizon_years <= 0:
        raise ValueError("horizon_years must be positive")
    return from_jd + horizon_years * JULIAN_YEAR_DAYS


def couple_transitions_within(
    mahadashas_a: Sequence[DashaPeriod],
    mahadashas_b: Sequence[DashaPeriod],
    *,
    from_jd: float,
    horizon_years: float,
    tolerance_days: float,
) -> CoupleSandhi:
    """Both partners' mahadasas change within `tolerance_days` of each other.

    Only transitions inside [from_jd, from_jd + horizon] count, for each
    partner. The comparison is closed: a gap equal to the tolerance pairs.
    Symmetric by construction: swapping the partners swaps `a` and `b` in
    every pair and changes nothing else.
    """
    if tolerance_days < 0:
        raise ValueError("tolerance_days must not be negative")
    to_jd = _horizon(from_jd, horizon_years)

    def inside(ts: tuple[Transition, ...]) -> tuple[Transition, ...]:
        return tuple(t for t in ts if from_jd <= t.at_jd <= to_jd)

    ta, tb = inside(transitions(mahadashas_a)), inside(transitions(mahadashas_b))
    pairs = sorted(
        (
            TransitionPair(a, b, abs(a.at_jd - b.at_jd))
            for a in ta for b in tb
            if abs(a.at_jd - b.at_jd) <= tolerance_days
        ),
        key=_pair_key,
    )
    return CoupleSandhi(from_jd, to_jd, tolerance_days, ta, tb, tuple(pairs))


@dataclass(frozen=True, slots=True)
class WindowOverlap:
    a: SandhiWindow
    b: SandhiWindow
    #: Days the two windows share.
    overlap_days: float


def couple_window_overlaps(
    mahadashas_a: Sequence[DashaPeriod],
    mahadashas_b: Sequence[DashaPeriod],
    option: SandhiOption,
    *,
    fixed_months: float,
    from_jd: float,
    horizon_years: float,
) -> tuple[WindowOverlap, ...]:
    """Pairs of sandhi windows, one per partner, that share time inside the
    horizon. Windows are clipped to the horizon before the overlap is taken."""
    to_jd = _horizon(from_jd, horizon_years)
    wa = sandhi_windows(mahadashas_a, option, fixed_months=fixed_months, from_jd=from_jd, to_jd=to_jd)
    wb = sandhi_windows(mahadashas_b, option, fixed_months=fixed_months, from_jd=from_jd, to_jd=to_jd)
    out: list[WindowOverlap] = []
    for a in wa:
        for b in wb:
            start = max(a.start_jd, b.start_jd, from_jd)
            end = min(a.end_jd, b.end_jd, to_jd)
            if end > start:
                out.append(WindowOverlap(a, b, end - start))
    return tuple(out)


# ---------------------------------------------------------------------------
# The ruled reading (owner 2026-11-12, spec §0.4). This is the only part of
# this module that reaches a reader.
# ---------------------------------------------------------------------------

SandhiBand = Literal["CLOSE", "NEAR"]


@dataclass(frozen=True, slots=True)
class SandhiPair:
    """Two mahadasa changes, one per partner, inside the horizon.

    `band` is decided by `change_gap_days` alone. `window_gap_days` is the
    supplementary measure: the days between the two sandhi windows, negative
    when they overlap. It is reported, never banded.
    """

    a: Transition
    b: Transition
    window_a: SandhiWindow
    window_b: SandhiWindow
    #: |a.at - b.at| in days. The primary measure.
    change_gap_days: float
    #: Days between the two windows; negative = they overlap by that many days.
    window_gap_days: float
    band: SandhiBand

    @property
    def windows_overlap(self) -> bool:
        return self.window_gap_days < 0.0


@dataclass(frozen=True, slots=True)
class CoupleSandhiReading:
    """What a reader sees. Pairs are chronological; `band` is the couple's
    closest pair, as the prevalence in spec §0.4 was measured."""

    pairs: tuple[SandhiPair, ...]
    horizon_years: int
    horizon_start: date
    horizon_end: date
    option: SandhiOption
    fixed_months: float
    rule: str = RULE_SOURCE_ID
    tier: str = TIER

    @property
    def band(self) -> SandhiBand | None:
        """`CLOSE` when any pair is close, else `NEAR`, else None."""
        if any(p.band == "CLOSE" for p in self.pairs):
            return "CLOSE"
        return "NEAR" if self.pairs else None

    def swapped(self) -> CoupleSandhiReading:
        """The same reading with the partners exchanged. Used by the symmetry
        test: a reading must not depend on which chart was passed first."""
        pairs = tuple(
            sorted(
                (
                    SandhiPair(p.b, p.a, p.window_b, p.window_a, p.change_gap_days, p.window_gap_days, p.band)
                    for p in self.pairs
                ),
                key=_reading_pair_key,
            )
        )
        return CoupleSandhiReading(
            pairs, self.horizon_years, self.horizon_start, self.horizon_end,
            self.option, self.fixed_months, self.rule, self.tier,
        )


def _reading_pair_key(p: SandhiPair) -> tuple[float, float]:
    return (p.a.at_jd, p.b.at_jd)


def band_of(change_gap_days: float) -> SandhiBand | None:
    """The ruled band for a change-point gap. None = not flagged.

    Closed at the bottom of each band and open at the top, so a gap of exactly
    6 months reads NEAR and exactly 12 months is not flagged at all.
    """
    if change_gap_days < months_to_days(BAND_CLOSE_MONTHS):
        return "CLOSE"
    if change_gap_days < months_to_days(BAND_NEAR_MONTHS):
        return "NEAR"
    return None


def date_to_jd(d: date) -> float:
    """Midnight UTC on `d`, the convention the horizon is measured in."""
    return utc_datetime_to_julian_day(datetime(d.year, d.month, d.day, tzinfo=UTC))


def couple_reading(
    mahadashas_a: Sequence[DashaPeriod],
    mahadashas_b: Sequence[DashaPeriod],
    *,
    from_date: date,
    horizon_years: int = HORIZON_YEARS_RULED,
    option: SandhiOption = RULED_OPTION,
    fixed_months: float = FIXED_MONTHS_RULED,
) -> CoupleSandhiReading:
    """The ruled reading: mahadasa changes that fall within 12 months of each
    other inside the horizon, banded by the change-point gap.

    `from_date` is the planned marriage date when the caller has one, else the
    reference date (spec §0.4). Pairs over `BAND_NEAR_MONTHS` apart are not
    returned: the ruling does not flag them, so they must not reach the wire
    where a surface could render them.
    """
    if horizon_years <= 0:
        raise ValueError("horizon_years must be positive")
    from_jd = date_to_jd(from_date)
    found = couple_transitions_within(
        mahadashas_a, mahadashas_b,
        from_jd=from_jd, horizon_years=horizon_years,
        tolerance_days=months_to_days(BAND_NEAR_MONTHS),
    )
    windows_a = {w.transition.index: w for w in sandhi_windows(mahadashas_a, option, fixed_months=fixed_months)}
    windows_b = {w.transition.index: w for w in sandhi_windows(mahadashas_b, option, fixed_months=fixed_months)}

    pairs: list[SandhiPair] = []
    for pair in found.pairs:
        band = band_of(pair.gap_days)
        if band is None:  # the tolerance is closed, the band is open at 12 months
            continue
        wa, wb = windows_a[pair.a.index], windows_b[pair.b.index]
        gap = max(wa.start_jd, wb.start_jd) - min(wa.end_jd, wb.end_jd)
        pairs.append(SandhiPair(pair.a, pair.b, wa, wb, pair.gap_days, gap, band))

    return CoupleSandhiReading(
        tuple(sorted(pairs, key=_reading_pair_key)),
        horizon_years,
        from_date,
        _date(_horizon(from_jd, horizon_years)),
        option,
        fixed_months,
    )
