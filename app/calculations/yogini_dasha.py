"""Yogini Dasha — 36-year secondary/comparison dasha system (Thirukanitham
Depth Expansion Plan, Phase 4.1).

Not present in this project's frozen spec
(`docs/Jothidam_AI_Formula_Engine_Specification_v1_Thirukanitham_2026.md`);
sourced from the classical Devi Bhagavata / Muhurta Chintamani tradition and
cross-checked against multiple independent modern references (AstroSight,
ShubhDivas, Vedicastro.com, K.N. Rao's applied method) which all agree on
this exact formula with no disagreement found:

    remainder = (janma_nakshatra_number + 3) mod 8    # Ashwini = 1
    remainder 0 -> treated as 8

remainder -> Yogini (fixed order, always Mangala..Sankata, never reversed):
    1 Mangala (Moon, 1yr), 2 Pingala (Sun, 2yr), 3 Dhanya (Jupiter, 3yr),
    4 Bhramari (Mars, 4yr), 5 Bhadrika (Mercury, 5yr), 6 Ulka (Saturn, 6yr),
    7 Siddha (Venus, 7yr), 8 Sankata (Rahu, 8yr) — total 36 years/cycle.

Documented convention: unlike Ashtottari/Kalachakra, no source found applies
a gender- or odd/even-nakshatra-based direction reversal to Yogini Dasha —
every reference checked (including K.N. Rao's applied method) runs the same
fixed forward sequence for every chart. This module does the same.

Balance-at-birth and antardasha nesting follow the same proportional logic
as Vimshottari (`app/calculations/dasha.py`), rescaled to a 36-year cycle
instead of 120. `DashaPeriod` and `_find_period` are reused verbatim from
`dasha.py` since they are cycle-length-agnostic.
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

YOGINI_SEQUENCE: Final[list[str]] = [
    "MANGALA", "PINGALA", "DHANYA", "BHRAMARI",
    "BHADRIKA", "ULKA", "SIDDHA", "SANKATA",
]

YOGINI_YEARS: Final[dict[str, int]] = {
    "MANGALA": 1, "PINGALA": 2, "DHANYA": 3, "BHRAMARI": 4,
    "BHADRIKA": 5, "ULKA": 6, "SIDDHA": 7, "SANKATA": 8,
}

YOGINI_RULING_PLANET: Final[dict[str, str]] = {
    "MANGALA": "MOON", "PINGALA": "SUN", "DHANYA": "JUPITER", "BHRAMARI": "MARS",
    "BHADRIKA": "MERCURY", "ULKA": "SATURN", "SIDDHA": "VENUS", "SANKATA": "RAHU",
}

TOTAL_CYCLE_YEARS: Final[float] = 36.0

# 4 cycles (144 years) gives generous margin past any human lifespan for
# _find_period to resolve a running Mahadasha at any as_of date.
_MAHADASHA_CYCLES: Final[int] = 4


@dataclass(frozen=True, slots=True)
class YoginiTimeline:
    opening_yogini: str
    balance_years_at_birth: float
    opening_end_jd: float
    mahadashas: tuple[DashaPeriod, ...]
    current_mahadasha: DashaPeriod
    current_antardasha: DashaPeriod
    antardashas: tuple[DashaPeriod, ...]


def _yogini_sequence_from(start_yogini: str) -> list[str]:
    start_index = YOGINI_SEQUENCE.index(start_yogini)
    n = len(YOGINI_SEQUENCE)
    return [YOGINI_SEQUENCE[(start_index + offset) % n] for offset in range(n)]


def _build_yogini_periods(
    start_jd: float, sequence_start_yogini: str, first_duration_years: float
) -> tuple[DashaPeriod, ...]:
    periods: list[DashaPeriod] = []
    sequence = _yogini_sequence_from(sequence_start_yogini)
    current_start = start_jd

    for cycle in range(_MAHADASHA_CYCLES):
        for index, yogini in enumerate(sequence):
            duration_years = (
                first_duration_years if (cycle == 0 and index == 0) else float(YOGINI_YEARS[yogini])
            )
            end_jd = current_start + duration_years * JULIAN_YEAR_DAYS
            start_date, end_date = _period_dates(current_start, end_jd)
            periods.append(
                DashaPeriod(
                    level="maha",
                    lord=yogini,
                    start_jd=current_start,
                    end_jd=end_jd,
                    start_date=start_date,
                    end_date=end_date,
                    sequence_index=cycle * len(YOGINI_SEQUENCE) + index,
                )
            )
            current_start = end_jd

    return tuple(periods)


def _build_yogini_subperiods(parent: DashaPeriod) -> tuple[DashaPeriod, ...]:
    """Antardashas within a Yogini Mahadasha. Same true-span reconstruction
    as `dasha.py: _build_subperiods` (see that function's docstring) — the
    opening Mahadasha is stored clipped to the balance at birth, so its
    antardashas are rebuilt over the full unclipped span to resume from the
    bhukti actually running at birth."""
    periods: list[DashaPeriod] = []
    sequence = _yogini_sequence_from(parent.lord)
    parent_years = float(YOGINI_YEARS[parent.lord])
    true_start = parent.end_jd - parent_years * JULIAN_YEAR_DAYS
    current_start = true_start

    for index, yogini in enumerate(sequence):
        duration_years = parent_years * YOGINI_YEARS[yogini] / TOTAL_CYCLE_YEARS
        end_jd = current_start + duration_years * JULIAN_YEAR_DAYS
        start_date, end_date = _period_dates(current_start, end_jd)
        periods.append(
            DashaPeriod(
                level="antar",
                lord=yogini,
                start_jd=current_start,
                end_jd=end_jd,
                start_date=start_date,
                end_date=end_date,
                sequence_index=index,
            )
        )
        current_start = end_jd

    return tuple(periods)


def calculate_opening_yogini(moon_longitude: float, birth_jd: float) -> tuple[str, float, float]:
    normalized_moon = normalize_longitude(moon_longitude)
    moon_nakshatra = int((normalized_moon + EPSILON_DEGREES) // NAKSHATRA_SIZE_DEGREES) + 1

    remainder = (moon_nakshatra + 3) % 8
    yogini_index = 8 if remainder == 0 else remainder
    opening_yogini = YOGINI_SEQUENCE[yogini_index - 1]

    nak_start = (moon_nakshatra - 1) * NAKSHATRA_SIZE_DEGREES
    fraction_elapsed = (normalized_moon - nak_start) / NAKSHATRA_SIZE_DEGREES
    balance_years = (1.0 - fraction_elapsed) * YOGINI_YEARS[opening_yogini]
    opening_end_jd = birth_jd + balance_years * JULIAN_YEAR_DAYS
    return opening_yogini, balance_years, opening_end_jd


def calculate_yogini_timeline(
    birth_jd: float, moon_longitude: float, as_of_jd: float | None = None
) -> YoginiTimeline:
    if as_of_jd is None:
        as_of_jd = birth_jd

    opening_yogini, balance_years_at_birth, opening_end_jd = calculate_opening_yogini(moon_longitude, birth_jd)
    mahadashas = _build_yogini_periods(birth_jd, opening_yogini, balance_years_at_birth)
    current_mahadasha = _find_period(mahadashas, as_of_jd)
    antardashas = _build_yogini_subperiods(current_mahadasha)
    current_antardasha = _find_period(antardashas, as_of_jd)

    return YoginiTimeline(
        opening_yogini=opening_yogini,
        balance_years_at_birth=balance_years_at_birth,
        opening_end_jd=opening_end_jd,
        mahadashas=mahadashas,
        current_mahadasha=current_mahadasha,
        current_antardasha=current_antardasha,
        antardashas=antardashas,
    )
