from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from typing import Final, Literal

from app.calculations.astro import julian_day_to_utc_datetime, normalize_longitude

DASHA_YEARS: Final[dict[str, int]] = {
    "KETU": 7,
    "VENUS": 20,
    "SUN": 6,
    "MOON": 10,
    "MARS": 7,
    "RAHU": 18,
    "JUPITER": 16,
    "SATURN": 19,
    "MERCURY": 17,
}

SEQUENCE: Final[list[str]] = [
    "KETU",
    "VENUS",
    "SUN",
    "MOON",
    "MARS",
    "RAHU",
    "JUPITER",
    "SATURN",
    "MERCURY",
]

NAK_LORD: Final[dict[int, str]] = {n: SEQUENCE[(n - 1) % 9] for n in range(1, 28)}
NAKSHATRA_SIZE_DEGREES: Final[float] = 40.0 / 3.0
EPSILON_DEGREES: Final[float] = 1e-9
JULIAN_YEAR_DAYS: Final[float] = 365.25


@dataclass(frozen=True, slots=True)
class DashaPeriod:
    level: Literal["maha", "antar", "pratyantar", "sookshma", "prana"]
    lord: str
    start_jd: float
    end_jd: float
    start_date: date
    end_date: date
    sequence_index: int


@dataclass(frozen=True, slots=True)
class VimshottariTimeline:
    opening_lord: str
    balance_years_at_birth: float
    opening_end_jd: float
    mahadashas: tuple[DashaPeriod, ...]
    current_mahadasha: DashaPeriod
    current_antardasha: DashaPeriod
    current_pratyantardasha: DashaPeriod
    current_sookshmadasha: DashaPeriod
    current_pranadasha: DashaPeriod


def _sequence_from(start_lord: str) -> list[str]:
    start_index = SEQUENCE.index(start_lord)
    return [SEQUENCE[(start_index + offset) % len(SEQUENCE)] for offset in range(len(SEQUENCE))]


def _period_dates(start_jd: float, end_jd: float) -> tuple[date, date]:
    return julian_day_to_utc_datetime(start_jd).date(), julian_day_to_utc_datetime(end_jd).date()


def _build_periods(start_jd: float, sequence_start_lord: str, first_duration_years: float) -> tuple[DashaPeriod, ...]:
    periods: list[DashaPeriod] = []
    sequence = _sequence_from(sequence_start_lord)
    current_start = start_jd

    # Generate 2 full cycles (18 periods = ~240 years) so _find_period works for long-range projections
    for cycle in range(2):
        for index, lord in enumerate(sequence):
            duration_years = first_duration_years if (cycle == 0 and index == 0) else DASHA_YEARS[lord]
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
                    sequence_index=cycle * 9 + index,
                )
            )
            current_start = end_jd

    return tuple(periods)


def _build_subperiods(parent: DashaPeriod, level: Literal["antar", "pratyantar", "sookshma", "prana"]) -> tuple[DashaPeriod, ...]:
    periods: list[DashaPeriod] = []
    sequence = _sequence_from(parent.lord)
    parent_years = (parent.end_jd - parent.start_jd) / JULIAN_YEAR_DAYS
    current_start = parent.start_jd

    for index, lord in enumerate(sequence):
        duration_years = parent_years * DASHA_YEARS[lord] / 120.0
        end_jd = current_start + duration_years * JULIAN_YEAR_DAYS
        start_date, end_date = _period_dates(current_start, end_jd)
        periods.append(
            DashaPeriod(
                level=level,
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


def _find_period(periods: tuple[DashaPeriod, ...], as_of_jd: float) -> DashaPeriod:
    if not periods:
        raise ValueError("No periods were generated.")

    adjusted = as_of_jd + EPSILON_DEGREES
    for period in periods:
        if period.start_jd <= adjusted < period.end_jd:
            return period
    return periods[-1]


def calculate_opening_dasha(moon_longitude: float, birth_jd: float) -> tuple[str, float, float]:
    normalized_moon = normalize_longitude(moon_longitude)
    moon_nakshatra = int((normalized_moon + EPSILON_DEGREES) // NAKSHATRA_SIZE_DEGREES) + 1
    opening_lord = NAK_LORD[moon_nakshatra]
    nak_start = (moon_nakshatra - 1) * NAKSHATRA_SIZE_DEGREES
    fraction_elapsed = (normalized_moon - nak_start) / NAKSHATRA_SIZE_DEGREES
    balance_years = (1.0 - fraction_elapsed) * DASHA_YEARS[opening_lord]
    opening_end_jd = birth_jd + balance_years * JULIAN_YEAR_DAYS
    return opening_lord, balance_years, opening_end_jd


def calculate_vimshottari_timeline(birth_jd: float, moon_longitude: float, as_of_jd: float | None = None) -> VimshottariTimeline:
    if as_of_jd is None:
        as_of_jd = birth_jd

    opening_lord, balance_years_at_birth, opening_end_jd = calculate_opening_dasha(moon_longitude, birth_jd)
    mahadashas = _build_periods(birth_jd, opening_lord, balance_years_at_birth)
    current_mahadasha = _find_period(mahadashas, as_of_jd)
    antardashas = _build_subperiods(current_mahadasha, "antar")
    current_antardasha = _find_period(antardashas, as_of_jd)
    pratyantardashas = _build_subperiods(current_antardasha, "pratyantar")
    current_pratyantardasha = _find_period(pratyantardashas, as_of_jd)
    sookshmadashas = _build_subperiods(current_pratyantardasha, "sookshma")
    current_sookshmadasha = _find_period(sookshmadashas, as_of_jd)
    pranadashas = _build_subperiods(current_sookshmadasha, "prana")
    current_pranadasha = _find_period(pranadashas, as_of_jd)

    return VimshottariTimeline(
        opening_lord=opening_lord,
        balance_years_at_birth=balance_years_at_birth,
        opening_end_jd=opening_end_jd,
        mahadashas=mahadashas,
        current_mahadasha=current_mahadasha,
        current_antardasha=current_antardasha,
        current_pratyantardasha=current_pratyantardasha,
        current_sookshmadasha=current_sookshmadasha,
        current_pranadasha=current_pranadasha,
    )
