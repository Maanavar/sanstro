"""Dasa Sandhi (தசா சந்தி): the junction where one mahadasa hands over to the next.

ENGINE ONLY (owner ruling 2026-11-09, deferred-checks plan item 7). Nothing here
reaches a reader: no API field, no card, no score, no dosham, no parihara, no
warning. It is computational groundwork for the astrologer's ruling, measured by
`scripts/audit/deferred_checks_measurements.py`.

**No default definition, on purpose.** Every function takes the window option,
tolerance and horizon as required arguments. The three candidate windows are
the ones the plan lists, none preferred:

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

Tier: `engine_inference`, unratified. When the astrologer rules the window,
tolerance, horizon and interpretation, the chosen configuration is promoted
with provenance and Tamil wording; until then these stay internal.
"""
from __future__ import annotations

from collections.abc import Sequence
from dataclasses import dataclass
from datetime import date
from typing import Literal

from app.calculations.astro import julian_day_to_utc_datetime
from app.calculations.dasha import JULIAN_YEAR_DAYS, DashaPeriod, _build_subperiods

SandhiOption = Literal["A_FIXED", "B_BHUKTI", "C_PRATYANTARA"]
SANDHI_OPTIONS: tuple[SandhiOption, ...] = ("A_FIXED", "B_BHUKTI", "C_PRATYANTARA")

TIER = "engine_inference"
RATIFIED = False

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
