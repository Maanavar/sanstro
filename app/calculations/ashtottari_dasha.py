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

What is genuinely contested (checked amatyakaraka.com, astrosutras.in, and
others): the *exact* nakshatra-to-lord table. Sources agree the count starts
from Krittika ("Krittikadi", the default/unconditional variant — the named
alternative "Ardradi" starts from Ardra but is explicitly conditional on
Rahu's placement relative to the lagna lord, which this project's product
decision below deliberately does not evaluate) but no source found gives the
full 27-row table with a citable chapter/verse, and one source describes a
28-pada sub-structure that looks like a different granularity of the same
system rather than a simple whole-nakshatra table.

Documented project convention (analogous to `dasha.py`'s own genuinely
verified mechanism — Vimshottari's nakshatra-lord assignment is exactly
`SEQUENCE[(n - 1) % 9]`, confirmed by Ashwini/Magha/Moola, exactly 9 apart,
all three belonging to Ketu): this module derives the Ashtottari
nakshatra-lord table the same way, `SEQUENCE[(n - 3) % 8]` — offsetting the
mod-9 Vimshottari mechanism to start the 8-lord cycle at Krittika (n=3, per
the Krittikadi convention) instead of Ashwini (n=1). This is this project's
own reasoned derivation, not a directly-quoted classical table — flag for a
second-pass cross-check against a live Jagannatha Hora chart before treating
as more than "display-only secondary dasha," the same posture Phase 1 took
for D27/D40/D45.

Product decision (per the Depth Expansion Plan's own recommendation): run
unconditionally for every chart and label as a secondary/comparison dasha
rather than implying classical applicability conditions (Rahu-kendra-from-
lagna-lord, or day/night+paksha rules — sources disagree on which) have been
evaluated. This sidesteps the applicability debate without hiding it.
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

# Krittikadi convention: nakshatra 3 (Krittika) opens the 8-lord cycle.
# See module docstring for the derivation and its documented uncertainty.
NAK_LORD: Final[dict[int, str]] = {
    n: ASHTOTTARI_SEQUENCE[(n - 3) % 8] for n in range(1, 28)
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
