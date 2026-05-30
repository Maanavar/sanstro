from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, date, datetime
from typing import Literal

from app.calculations.astro import utc_datetime_to_julian_day
from app.calculations.chart_strength import SIGN_LORD
from app.calculations.dasha import calculate_vimshottari_timeline
from app.calculations.ephemeris import calculate_sidereal_planets
from app.calculations.transits import get_jupiter_aspects

EventType = Literal["MARRIAGE", "CAREER", "FINANCE"]


@dataclass(frozen=True, slots=True)
class ChartData:
    lagna_rasi: int
    moon_longitude: float
    birth_jd: float


@dataclass(frozen=True, slots=True)
class EventWindow:
    event: str
    start_date: date
    end_date: date
    score: int
    reasons: list[str]


def _seventh_house_rasi(lagna_rasi: int) -> int:
    return ((lagna_rasi + 7 - 2) % 12) + 1


def _seventh_lord(lagna_rasi: int) -> str:
    return SIGN_LORD[_seventh_house_rasi(lagna_rasi)]


def find_marriage_windows(
    chart: ChartData,
    from_year: int,
    to_year: int,
) -> list[EventWindow]:
    windows: list[EventWindow] = []
    seventh_house_rasi = _seventh_house_rasi(chart.lagna_rasi)
    seventh_lord = _seventh_lord(chart.lagna_rasi)

    for year in range(from_year, to_year + 1):
        anchor = datetime(year, 7, 1, 12, 0, tzinfo=UTC)
        anchor_jd = utc_datetime_to_julian_day(anchor)
        timeline = calculate_vimshottari_timeline(chart.birth_jd, chart.moon_longitude, anchor_jd)
        active_lords = {timeline.current_mahadasha.lord, timeline.current_antardasha.lord}
        dasha_support = seventh_lord in active_lords or "VENUS" in active_lords

        transit = calculate_sidereal_planets(anchor_jd)
        jupiter_rasi = transit.bodies["JUPITER"].rasi
        venus_rasi = transit.bodies["VENUS"].rasi
        jupiter_support = seventh_house_rasi in get_jupiter_aspects(jupiter_rasi) or jupiter_rasi == seventh_house_rasi
        venus_support = venus_rasi == seventh_house_rasi
        transit_support = jupiter_support or venus_support

        if not (dasha_support and transit_support):
            continue

        score = 70
        reasons: list[str] = []
        if seventh_lord in active_lords:
            score += 15
            reasons.append("7th_lord_dasha_active")
        if "VENUS" in active_lords:
            score += 10
            reasons.append("venus_dasha_active")
        if jupiter_support:
            score += 10
            reasons.append("jupiter_supports_7th")
        if venus_support:
            score += 10
            reasons.append("venus_transits_7th")

        windows.append(
            EventWindow(
                event="MARRIAGE",
                start_date=date(year, 7, 1),
                end_date=date(year, 12, 31),
                score=min(100, score),
                reasons=reasons,
            )
        )

    return sorted(windows, key=lambda item: item.score, reverse=True)


def _tenth_house_rasi(lagna_rasi: int) -> int:
    return ((lagna_rasi + 10 - 2) % 12) + 1


def _tenth_lord(lagna_rasi: int) -> str:
    return SIGN_LORD[_tenth_house_rasi(lagna_rasi)]


def find_career_windows(
    chart: ChartData,
    from_year: int,
    to_year: int,
) -> list[EventWindow]:
    """
    Career advancement windows.

    Criteria (both required):
    - Dasha support: 10th lord, Sun, or Mercury active in maha or antardasha.
    - Transit support: Jupiter transiting or aspecting the 10th house.
    """
    windows: list[EventWindow] = []
    tenth_house_rasi = _tenth_house_rasi(chart.lagna_rasi)
    tenth_lord = _tenth_lord(chart.lagna_rasi)

    for year in range(from_year, to_year + 1):
        anchor = datetime(year, 7, 1, 12, 0, tzinfo=UTC)
        anchor_jd = utc_datetime_to_julian_day(anchor)
        timeline = calculate_vimshottari_timeline(chart.birth_jd, chart.moon_longitude, anchor_jd)
        active_lords = {timeline.current_mahadasha.lord, timeline.current_antardasha.lord}
        dasha_support = bool(active_lords & {tenth_lord, "SUN", "MERCURY"})

        transit = calculate_sidereal_planets(anchor_jd)
        jupiter_rasi = transit.bodies["JUPITER"].rasi
        sun_rasi = transit.bodies["SUN"].rasi
        jupiter_support = (
            tenth_house_rasi in get_jupiter_aspects(jupiter_rasi)
            or jupiter_rasi == tenth_house_rasi
        )
        sun_support = sun_rasi == tenth_house_rasi
        transit_support = jupiter_support or sun_support

        if not (dasha_support and transit_support):
            continue

        score = 70
        reasons: list[str] = []
        if tenth_lord in active_lords:
            score += 15
            reasons.append("10th_lord_dasha_active")
        if "SUN" in active_lords:
            score += 8
            reasons.append("sun_dasha_active")
        if "MERCURY" in active_lords:
            score += 5
            reasons.append("mercury_dasha_active")
        if jupiter_support:
            score += 10
            reasons.append("jupiter_supports_10th")
        if sun_support:
            score += 5
            reasons.append("sun_transits_10th")

        windows.append(
            EventWindow(
                event="CAREER",
                start_date=date(year, 7, 1),
                end_date=date(year, 12, 31),
                score=min(100, score),
                reasons=reasons,
            )
        )

    return sorted(windows, key=lambda item: item.score, reverse=True)


def _second_house_rasi(lagna_rasi: int) -> int:
    return ((lagna_rasi + 2 - 2) % 12) + 1


def _eleventh_house_rasi(lagna_rasi: int) -> int:
    return ((lagna_rasi + 11 - 2) % 12) + 1


def find_finance_windows(
    chart: ChartData,
    from_year: int,
    to_year: int,
) -> list[EventWindow]:
    """
    Finance / wealth accumulation windows.

    Criteria (both required):
    - Dasha support: 2nd lord, 11th lord, Jupiter, or Venus active.
    - Transit support: Jupiter transiting or aspecting the 2nd or 11th house.
    """
    windows: list[EventWindow] = []
    second_house_rasi   = _second_house_rasi(chart.lagna_rasi)
    eleventh_house_rasi = _eleventh_house_rasi(chart.lagna_rasi)
    second_lord  = SIGN_LORD[second_house_rasi]
    eleventh_lord = SIGN_LORD[eleventh_house_rasi]

    for year in range(from_year, to_year + 1):
        anchor = datetime(year, 7, 1, 12, 0, tzinfo=UTC)
        anchor_jd = utc_datetime_to_julian_day(anchor)
        timeline = calculate_vimshottari_timeline(chart.birth_jd, chart.moon_longitude, anchor_jd)
        active_lords = {timeline.current_mahadasha.lord, timeline.current_antardasha.lord}
        dasha_support = bool(active_lords & {second_lord, eleventh_lord, "JUPITER", "VENUS"})

        transit = calculate_sidereal_planets(anchor_jd)
        jupiter_rasi = transit.bodies["JUPITER"].rasi
        jupiter_aspects = get_jupiter_aspects(jupiter_rasi)
        j2 = jupiter_rasi == second_house_rasi or second_house_rasi in jupiter_aspects
        j11 = jupiter_rasi == eleventh_house_rasi or eleventh_house_rasi in jupiter_aspects
        transit_support = j2 or j11

        if not (dasha_support and transit_support):
            continue

        score = 70
        reasons: list[str] = []
        if second_lord in active_lords:
            score += 12
            reasons.append("2nd_lord_dasha_active")
        if eleventh_lord in active_lords:
            score += 12
            reasons.append("11th_lord_dasha_active")
        if "JUPITER" in active_lords:
            score += 10
            reasons.append("jupiter_dasha_active")
        if "VENUS" in active_lords:
            score += 8
            reasons.append("venus_dasha_active")
        if j2:
            score += 8
            reasons.append("jupiter_supports_2nd")
        if j11:
            score += 8
            reasons.append("jupiter_supports_11th")

        windows.append(
            EventWindow(
                event="FINANCE",
                start_date=date(year, 7, 1),
                end_date=date(year, 12, 31),
                score=min(100, score),
                reasons=reasons,
            )
        )

    return sorted(windows, key=lambda item: item.score, reverse=True)


def find_event_windows(
    chart: ChartData,
    event: EventType,
    from_year: int,
    to_year: int,
) -> list[EventWindow]:
    """Unified dispatcher — routes to the appropriate finder by event type."""
    if event == "MARRIAGE":
        return find_marriage_windows(chart, from_year, to_year)
    if event == "CAREER":
        return find_career_windows(chart, from_year, to_year)
    if event == "FINANCE":
        return find_finance_windows(chart, from_year, to_year)
    raise ValueError(f"Unknown event type: {event}")
