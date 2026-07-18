"""Long-range event window heuristics.

These windows combine Vimshottari dasha activation with transit checkpoints.
The birth chart, dasha, houses, and transits use the app's Thirukanitham
calculation foundation, but the 0-100 score and thresholding are product
heuristics for planning support, not a direct verse/table from a printed
Thirukanitham panchangam. Fast transits such as Sun/Venus are treated as
triggers inside the wider window.

Dasha support uses connection-match activation (dasha_activation.py): a
dasha lord qualifies a window not only by *being* the bhava lord or the
karaka, but by occupying/aspecting the bhava, lording a related house,
disposing the bhava lord, or (for Rahu/Ketu) acting as another planet's
agent. Jupiter+Saturn double-transit confirmation (double_transit.py)
adjusts the score, and each window is clamped to the qualifying
antardasha span instead of claiming the whole calendar year.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, date, datetime
from typing import Literal

from app.calculations.astro import utc_datetime_to_julian_day
from app.calculations.chart_strength import SIGN_LORD
from app.calculations.dasha import calculate_vimshottari_timeline
from app.calculations.dasha_activation import assess_dasha_activation
from app.calculations.double_transit import score_double_transit
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


def _house_rasi(lagna_rasi: int, house: int) -> int:
    return ((lagna_rasi + house - 2) % 12) + 1


def _seventh_house_rasi(lagna_rasi: int) -> int:
    return _house_rasi(lagna_rasi, 7)


def _seventh_lord(lagna_rasi: int) -> str:
    return SIGN_LORD[_seventh_house_rasi(lagna_rasi)]


def _tenth_house_rasi(lagna_rasi: int) -> int:
    return _house_rasi(lagna_rasi, 10)


def _tenth_lord(lagna_rasi: int) -> str:
    return SIGN_LORD[_tenth_house_rasi(lagna_rasi)]


def _second_house_rasi(lagna_rasi: int) -> int:
    return _house_rasi(lagna_rasi, 2)


def _eleventh_house_rasi(lagna_rasi: int) -> int:
    return _house_rasi(lagna_rasi, 11)


def _natal_planet_rasis(chart: ChartData) -> dict[str, int]:
    """Natal placements for connection-match activation, computed once."""
    natal = calculate_sidereal_planets(chart.birth_jd)
    return {graha: body.rasi for graha, body in natal.bodies.items()}


def _year_anchor(year: int, today: date) -> tuple[date, float]:
    # For the current year use today as anchor so the dasha assessment
    # matches what the live prediction services see (both use "now").
    # Future years use July 1 as a representative mid-year point.
    anchor_date = today if year == today.year else date(year, 7, 1)
    anchor = datetime(anchor_date.year, anchor_date.month, anchor_date.day, 12, 0, tzinfo=UTC)
    return anchor_date, utc_datetime_to_julian_day(anchor)


def _window_span(year: int, anchor_date: date, timeline) -> tuple[date, date]:
    """Clamp the window to the qualifying antardasha within the year.

    The old behaviour claimed anchor→Dec 31 even when the supporting
    antardasha ended in, say, May. Falls back to the full-year span when
    the timeline object carries no period dates (e.g. test doubles).
    """
    start = anchor_date
    end = date(year, 12, 31)
    antar = timeline.current_antardasha
    antar_start = getattr(antar, "start_date", None)
    antar_end = getattr(antar, "end_date", None)
    if antar_start is not None and antar_start > start:
        start = antar_start
    if antar_end is not None and antar_end < end:
        end = antar_end
    if end < start:
        return anchor_date, date(year, 12, 31)
    return start, end


def _double_transit_adjustment(
    transit_bodies: dict,
    house_rasi: int,
    natal_lord_rasi: int,
) -> tuple[int, list[str]]:
    """Jupiter+Saturn double-transit confirmation on the event house.

    Skipped (0, no reasons) when Saturn/Rahu positions are unavailable.
    """
    jupiter = transit_bodies.get("JUPITER")
    saturn = transit_bodies.get("SATURN")
    rahu = transit_bodies.get("RAHU")
    if jupiter is None or saturn is None or rahu is None:
        return 0, []
    dt_score = score_double_transit(
        relevant_house_rasi=house_rasi,
        jupiter_transit_rasi=jupiter.rasi,
        saturn_transit_rasi=saturn.rasi,
        rahu_transit_rasi=rahu.rasi,
        natal_house_lord_rasi=natal_lord_rasi,
    )
    if dt_score >= 15:
        return 8, ["double_transit_confirms"]
    if dt_score <= -10:
        return -8, ["saturn_rahu_pressure_on_house"]
    if dt_score <= -5:
        return -5, ["saturn_pressure_on_house"]
    return 0, []


def find_marriage_windows(
    chart: ChartData,
    from_year: int,
    to_year: int,
) -> list[EventWindow]:
    windows: list[EventWindow] = []
    seventh_house_rasi = _seventh_house_rasi(chart.lagna_rasi)
    seventh_lord = _seventh_lord(chart.lagna_rasi)
    natal_rasis = _natal_planet_rasis(chart)
    natal_lord_rasi = natal_rasis.get(seventh_lord, chart.lagna_rasi)
    today = date.today()

    for year in range(from_year, to_year + 1):
        anchor_date, anchor_jd = _year_anchor(year, today)
        timeline = calculate_vimshottari_timeline(chart.birth_jd, chart.moon_longitude, anchor_jd)
        active_lords = {timeline.current_mahadasha.lord, timeline.current_antardasha.lord}
        activation = assess_dasha_activation(
            lagna_rasi=chart.lagna_rasi,
            bhava_house=7,
            dasha_lords=[timeline.current_mahadasha.lord, timeline.current_antardasha.lord],
            natal_planet_rasis=natal_rasis,
            karakas=("VENUS",),
            related_houses=(2, 11),
        )

        transit = calculate_sidereal_planets(anchor_jd)
        jupiter_rasi = transit.bodies["JUPITER"].rasi
        venus_rasi = transit.bodies["VENUS"].rasi
        jupiter_support = seventh_house_rasi in get_jupiter_aspects(jupiter_rasi) or jupiter_rasi == seventh_house_rasi
        venus_support = venus_rasi == seventh_house_rasi
        transit_support = jupiter_support or venus_support

        if not (activation.activated and transit_support):
            continue

        score = 70
        reasons: list[str] = []
        if seventh_lord in active_lords:
            score += 15
            reasons.append("7th_lord_dasha_active")
        if "VENUS" in active_lords:
            score += 10
            reasons.append("venus_dasha_active")
        if not reasons:
            # Connection-match qualified the window (occupancy/aspect/
            # dispositor/node agency) without an identity hit.
            score += 8 if activation.strength == "STRONG" else 4
            reasons.append("dasha_connects_7th_house")
        if jupiter_support:
            score += 10
            reasons.append("jupiter_supports_7th")
        if venus_support:
            score += 10
            reasons.append("venus_transits_7th")
        dt_adj, dt_reasons = _double_transit_adjustment(
            transit.bodies, seventh_house_rasi, natal_lord_rasi
        )
        score += dt_adj
        reasons.extend(dt_reasons)

        start_date, end_date = _window_span(year, anchor_date, timeline)
        windows.append(
            EventWindow(
                event="MARRIAGE",
                start_date=start_date,
                end_date=end_date,
                score=max(0, min(100, score)),
                reasons=reasons,
            )
        )

    return sorted(windows, key=lambda item: item.score, reverse=True)


def find_career_windows(
    chart: ChartData,
    from_year: int,
    to_year: int,
) -> list[EventWindow]:
    """
    Career advancement windows.

    Criteria (both required):
    - Dasha support: a maha/antar lord connected to the 10th house complex
      (identity, occupancy, aspect, 2/6/11 lordship, dispositor, node agency,
      or Sun/Mercury/Saturn karaka).
    - Transit support: Jupiter transiting or aspecting the 10th house.
    """
    windows: list[EventWindow] = []
    tenth_house_rasi = _tenth_house_rasi(chart.lagna_rasi)
    tenth_lord = _tenth_lord(chart.lagna_rasi)
    natal_rasis = _natal_planet_rasis(chart)
    natal_lord_rasi = natal_rasis.get(tenth_lord, chart.lagna_rasi)
    today = date.today()

    for year in range(from_year, to_year + 1):
        anchor_date, anchor_jd = _year_anchor(year, today)
        timeline = calculate_vimshottari_timeline(chart.birth_jd, chart.moon_longitude, anchor_jd)
        active_lords = {timeline.current_mahadasha.lord, timeline.current_antardasha.lord}
        activation = assess_dasha_activation(
            lagna_rasi=chart.lagna_rasi,
            bhava_house=10,
            dasha_lords=[timeline.current_mahadasha.lord, timeline.current_antardasha.lord],
            natal_planet_rasis=natal_rasis,
            karakas=("SUN", "MERCURY", "SATURN"),
            related_houses=(2, 6, 11),
        )

        transit = calculate_sidereal_planets(anchor_jd)
        jupiter_rasi = transit.bodies["JUPITER"].rasi
        sun_rasi = transit.bodies["SUN"].rasi
        jupiter_support = (
            tenth_house_rasi in get_jupiter_aspects(jupiter_rasi)
            or jupiter_rasi == tenth_house_rasi
        )
        sun_support = sun_rasi == tenth_house_rasi
        transit_support = jupiter_support or sun_support

        if not (activation.activated and transit_support):
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
        if not reasons:
            score += 8 if activation.strength == "STRONG" else 4
            reasons.append("dasha_connects_10th_house")
        if jupiter_support:
            score += 10
            reasons.append("jupiter_supports_10th")
        if sun_support:
            score += 5
            reasons.append("sun_transits_10th")
        dt_adj, dt_reasons = _double_transit_adjustment(
            transit.bodies, tenth_house_rasi, natal_lord_rasi
        )
        score += dt_adj
        reasons.extend(dt_reasons)

        start_date, end_date = _window_span(year, anchor_date, timeline)
        windows.append(
            EventWindow(
                event="CAREER",
                start_date=start_date,
                end_date=end_date,
                score=max(0, min(100, score)),
                reasons=reasons,
            )
        )

    return sorted(windows, key=lambda item: item.score, reverse=True)


def find_finance_windows(
    chart: ChartData,
    from_year: int,
    to_year: int,
) -> list[EventWindow]:
    """
    Finance / wealth accumulation windows.

    Criteria (both required):
    - Dasha support: a maha/antar lord connected to the 2nd house complex
      (identity, occupancy, aspect, 11/5 lordship, dispositor, node agency,
      or Jupiter/Venus karaka).
    - Transit support: Jupiter transiting or aspecting the 2nd or 11th house.
    """
    windows: list[EventWindow] = []
    second_house_rasi = _second_house_rasi(chart.lagna_rasi)
    eleventh_house_rasi = _eleventh_house_rasi(chart.lagna_rasi)
    second_lord = SIGN_LORD[second_house_rasi]
    eleventh_lord = SIGN_LORD[eleventh_house_rasi]
    natal_rasis = _natal_planet_rasis(chart)
    natal_lord_rasi = natal_rasis.get(second_lord, chart.lagna_rasi)
    today = date.today()

    for year in range(from_year, to_year + 1):
        anchor_date, anchor_jd = _year_anchor(year, today)
        timeline = calculate_vimshottari_timeline(chart.birth_jd, chart.moon_longitude, anchor_jd)
        active_lords = {timeline.current_mahadasha.lord, timeline.current_antardasha.lord}
        activation = assess_dasha_activation(
            lagna_rasi=chart.lagna_rasi,
            bhava_house=2,
            dasha_lords=[timeline.current_mahadasha.lord, timeline.current_antardasha.lord],
            natal_planet_rasis=natal_rasis,
            karakas=("JUPITER", "VENUS"),
            related_houses=(11, 5),
        )

        transit = calculate_sidereal_planets(anchor_jd)
        jupiter_rasi = transit.bodies["JUPITER"].rasi
        jupiter_aspects = get_jupiter_aspects(jupiter_rasi)
        j2 = jupiter_rasi == second_house_rasi or second_house_rasi in jupiter_aspects
        j11 = jupiter_rasi == eleventh_house_rasi or eleventh_house_rasi in jupiter_aspects
        transit_support = j2 or j11

        if not (activation.activated and transit_support):
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
        if not reasons:
            score += 8 if activation.strength == "STRONG" else 4
            reasons.append("dasha_connects_2nd_house")
        if j2:
            score += 8
            reasons.append("jupiter_supports_2nd")
        if j11:
            score += 8
            reasons.append("jupiter_supports_11th")
        dt_adj, dt_reasons = _double_transit_adjustment(
            transit.bodies, second_house_rasi, natal_lord_rasi
        )
        score += dt_adj
        reasons.extend(dt_reasons)

        start_date, end_date = _window_span(year, anchor_date, timeline)
        windows.append(
            EventWindow(
                event="FINANCE",
                start_date=start_date,
                end_date=end_date,
                score=max(0, min(100, score)),
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
