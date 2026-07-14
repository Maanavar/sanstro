"""Ashtottari Dasha — 108-year secondary/comparison dasha system
(Thirukanitham Depth Expansion Plan, Phase 4.2).

Not present in this project's frozen spec
(`docs/Jothidam_AI_Formula_Engine_Specification_v1_Thirukanitham_2026.md`).
Two things are consistently agreed across every classical/software source
checked (Satyori, AstroSight, Astro121, ModernAstro, astrosutras.in):

    1. Eight lords, no Ketu, fixed cycle order and years, total 108:
       Sun 6, Moon 15, Mars 8, Mercury 17, Saturn 10, Jupiter 19, Rahu 12,
       Venus 21.
    2. The system is reckoned from the Moon's birth nakshatra the same
       structural way Vimshottari is: each of the 27 nakshatras has an
       assigned Ashtottari lord, the birth nakshatra's lord opens the
       sequence, and the balance-at-birth/antardasha nesting is proportional
       — identical machinery to `dasha.py`, just an 8-lord cycle over a
       108-year total instead of 9 over 120.

The *exact* nakshatra-to-lord table was the genuinely contested piece. It is
now the authoritative **Ardra-adi grouping** (classical Jataka Parijata /
B.V. Raman lineage), supplied by the astrologer in the live review session
(2026-07-14, EC-6). Unlike Vimshottari's even 9-apart cycle, this is a
*non-uniform* grouping — runs of 3/3/3/4/3/4/3/4 nakshatras per lord — so it
is encoded as an explicit 27-row table (`NAK_LORD` below), not a modulo of the
run-order sequence. Anchor: the reckoning starts at Ardra (n=6 → Sun).
Ashwini (1), Bharani (2), and Revati (27) all → **Rahu**, which is stable
across every Ardra-adi source; the prior `SEQUENCE[(n - 3) % 8]` Krittikadi
derivation was wrong (it gave Bharani → Venus, and only coincidentally matched
Rahu at Ashwini).

Still worth a JHora cross-check: the internal group *boundaries* (Krittika,
Ashlesha, Hasta, Revati…) can vary between commentaries — validate all 27 rows
against a live Jagannatha Hora Ashtottari chart before treating this as more
than a "display-only secondary dasha." Ashwini/Bharani/Revati → Rahu are the
locked anchors regardless.

Product decision (per the Depth Expansion Plan's own recommendation): run
unconditionally for every chart and label as a secondary/comparison dasha
rather than implying classical applicability conditions (Rahu-kendra-from-
lagna-lord, or day/night+paksha rules — sources disagree on which) have been
evaluated. This sidesteps the applicability debate without hiding it.
NOTE (EC-6 follow-up): the Ardra-adi grouping is classically *conditional* on
Rahu's placement relative to the lagna lord; the reference recommends gating
the whole system on applicability. That gate is deliberately still deferred
here (unconditional, display-only) — flagged for a separate product call.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Final

from app.calculations.astro import normalize_longitude
from app.calculations.dasha import (
    EPSILON_DEGREES,
    JULIAN_YEAR_DAYS,
    NAKSHATRA_SIZE_DEGREES,
    DashaPeriod,
    _find_period,
    _period_dates,
)

ASHTOTTARI_SEQUENCE: Final[list[str]] = [
    "SUN", "MOON", "MARS", "MERCURY", "SATURN", "JUPITER", "RAHU", "VENUS",
]

ASHTOTTARI_YEARS: Final[dict[str, int]] = {
    "SUN": 6, "MOON": 15, "MARS": 8, "MERCURY": 17,
    "SATURN": 10, "JUPITER": 19, "RAHU": 12, "VENUS": 21,
}

TOTAL_CYCLE_YEARS: Final[float] = 108.0

# Ardra-adi grouping (authoritative, live session 2026-07-14 — EC-6). Explicit
# 27-row table because the grouping is non-uniform (runs of 3/3/3/4/3/4/3/4):
#   Rahu {1,2,27} · Venus {3-5} · Sun {6-8} · Moon {9-12} · Mars {13-15} ·
#   Mercury {16-19} · Saturn {20-22} · Jupiter {23-26}.
# Ashwini/Bharani/Revati → Rahu are stable anchors; interior boundaries pending
# a Jagannatha Hora cross-check (see module docstring).
NAK_LORD: Final[dict[int, str]] = {
    1: "RAHU", 2: "RAHU", 3: "VENUS", 4: "VENUS", 5: "VENUS",
    6: "SUN", 7: "SUN", 8: "SUN", 9: "MOON", 10: "MOON",
    11: "MOON", 12: "MOON", 13: "MARS", 14: "MARS", 15: "MARS",
    16: "MERCURY", 17: "MERCURY", 18: "MERCURY", 19: "MERCURY", 20: "SATURN",
    21: "SATURN", 22: "SATURN", 23: "JUPITER", 24: "JUPITER", 25: "JUPITER",
    26: "JUPITER", 27: "RAHU",
}

# 3 cycles (324 years) gives generous margin past any human lifespan for
# _find_period to resolve a running Mahadasha at any as_of date.
_MAHADASHA_CYCLES: Final[int] = 3


@dataclass(frozen=True, slots=True)
class AshtottariTimeline:
    opening_lord: str
    balance_years_at_birth: float
    opening_end_jd: float
    mahadashas: tuple[DashaPeriod, ...]
    current_mahadasha: DashaPeriod
    current_antardasha: DashaPeriod
    antardashas: tuple[DashaPeriod, ...]


def _sequence_from(start_lord: str) -> list[str]:
    start_index = ASHTOTTARI_SEQUENCE.index(start_lord)
    n = len(ASHTOTTARI_SEQUENCE)
    return [ASHTOTTARI_SEQUENCE[(start_index + offset) % n] for offset in range(n)]


def _build_ashtottari_periods(
    start_jd: float, sequence_start_lord: str, first_duration_years: float
) -> tuple[DashaPeriod, ...]:
    periods: list[DashaPeriod] = []
    sequence = _sequence_from(sequence_start_lord)
    current_start = start_jd

    for cycle in range(_MAHADASHA_CYCLES):
        for index, lord in enumerate(sequence):
            duration_years = (
                first_duration_years if (cycle == 0 and index == 0) else float(ASHTOTTARI_YEARS[lord])
            )
            end_jd = current_start + duration_years * JULIAN_YEAR_DAYS
            start_date, end_date = _period_dates(current_start, end_jd)
            periods.append(
                DashaPeriod(
                    level="maha",
                    lord=lord,
                    start_jd=current_start,
                    end_jd=end_jd,
                    start_date=start_date,
                    end_date=end_date,
                    sequence_index=cycle * len(ASHTOTTARI_SEQUENCE) + index,
                )
            )
            current_start = end_jd

    return tuple(periods)


def _build_ashtottari_subperiods(parent: DashaPeriod) -> tuple[DashaPeriod, ...]:
    """Antardashas within an Ashtottari Mahadasha. Same true-span
    reconstruction as `dasha.py: _build_subperiods` — the opening Mahadasha
    is stored clipped to the balance at birth, so its antardashas are
    rebuilt over the full unclipped span to resume from the bhukti actually
    running at birth."""
    periods: list[DashaPeriod] = []
    sequence = _sequence_from(parent.lord)
    parent_years = float(ASHTOTTARI_YEARS[parent.lord])
    true_start = parent.end_jd - parent_years * JULIAN_YEAR_DAYS
    current_start = true_start

    for index, lord in enumerate(sequence):
        duration_years = parent_years * ASHTOTTARI_YEARS[lord] / TOTAL_CYCLE_YEARS
        end_jd = current_start + duration_years * JULIAN_YEAR_DAYS
        start_date, end_date = _period_dates(current_start, end_jd)
        periods.append(
            DashaPeriod(
                level="antar",
                lord=lord,
                start_jd=current_start,
                end_jd=end_jd,
                start_date=start_date,
                end_date=end_date,
                sequence_index=index,
            )
        )
        current_start = end_jd

    return tuple(periods)


def calculate_opening_ashtottari(moon_longitude: float, birth_jd: float) -> tuple[str, float, float]:
    normalized_moon = normalize_longitude(moon_longitude)
    moon_nakshatra = int((normalized_moon + EPSILON_DEGREES) // NAKSHATRA_SIZE_DEGREES) + 1
    opening_lord = NAK_LORD[moon_nakshatra]

    nak_start = (moon_nakshatra - 1) * NAKSHATRA_SIZE_DEGREES
    fraction_elapsed = (normalized_moon - nak_start) / NAKSHATRA_SIZE_DEGREES
    balance_years = (1.0 - fraction_elapsed) * ASHTOTTARI_YEARS[opening_lord]
    opening_end_jd = birth_jd + balance_years * JULIAN_YEAR_DAYS
    return opening_lord, balance_years, opening_end_jd


def calculate_ashtottari_timeline(
    birth_jd: float, moon_longitude: float, as_of_jd: float | None = None
) -> AshtottariTimeline:
    if as_of_jd is None:
        as_of_jd = birth_jd

    opening_lord, balance_years_at_birth, opening_end_jd = calculate_opening_ashtottari(moon_longitude, birth_jd)
    mahadashas = _build_ashtottari_periods(birth_jd, opening_lord, balance_years_at_birth)
    current_mahadasha = _find_period(mahadashas, as_of_jd)
    antardashas = _build_ashtottari_subperiods(current_mahadasha)
    current_antardasha = _find_period(antardashas, as_of_jd)

    return AshtottariTimeline(
        opening_lord=opening_lord,
        balance_years_at_birth=balance_years_at_birth,
        opening_end_jd=opening_end_jd,
        mahadashas=mahadashas,
        current_mahadasha=current_mahadasha,
        current_antardasha=current_antardasha,
        antardashas=antardashas,
    )
