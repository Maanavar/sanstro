from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, date, datetime

from app.calculations.astro import utc_datetime_to_julian_day
from app.calculations.chart_strength import SIGN_LORD
from app.calculations.dasha import calculate_vimshottari_timeline
from app.calculations.ephemeris import calculate_sidereal_planets
from app.calculations.transits import get_jupiter_aspects


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
