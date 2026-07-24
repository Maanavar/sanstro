"""Pure planet-position calculation helpers — no DB, no HTTP, no service imports."""
from __future__ import annotations

from datetime import UTC, date, datetime, time, timedelta

from app.calculations.aspects import aspects_house
from app.calculations.astro import (
    degree_in_rasi,
    house_from_reference,
    local_datetime_to_utc,
    nakshatra_from_degree,
    navamsa_rasi_from_degree,
    pada_from_degree,
    resolve_timezone,
    utc_datetime_to_julian_day,
)
from app.calculations.chart_strength import (
    compute_natal_planet_score,
    compute_strength_breakdown,
    detect_planetary_wars,
)
from app.calculations.divisional_charts import get_varga
from app.calculations.ephemeris import calculate_lagna_degree, calculate_rise_transit_jd
from app.calculations.nakshatra_analysis import build_dispositor_chain, gandanta_detail, pushkara_check
from app.calculations.panchangam import NAKSHATRA_NAMES
from app.calculations.transits import RASI_NAMES, is_cazimi, is_combust
from app.schemas.charts import PlanetPosition

# Maandhi (Mandhi/Gulika) slot rules for chart longitude computation.
#
# Day birth: the traditional Tamil Panchangam Kuligai order DESCENDS from
# Sunday=7th eighth-of-the-day down to Saturday=1st: Sun=7, Mon=6, Tue=5,
# Wed=4, Thu=3, Fri=2, Sat=1 — this is exactly panchangam.py's own
# KULIGAI_SLOT table (used for muhurtham exclusions), already verified in
# the 2026-07 audit. (Phase 1.2 finding: the table previously coded *here*
# had Mon..Sat ASCENDING (1..6) instead, disagreeing with panchangam.py's
# own already-correct table for the same classical rule. Independently
# re-verified against drikpanchang.com published Gulika Kaal windows for
# three weekdays: Thu 2026-01-01 New Delhi 09:49-11:07 AM (=3rd eighth of a
# 621min day from 07:14 sunrise), Fri 2026-07-03 New Delhi 07:12-08:56 AM
# (=2nd eighth of a 835min day from 05:28 sunrise), Sat 2026-07-04 New Delhi
# 05:28-07:12 AM (=1st eighth) — all three confirm the descending order.
# See tests/test_gulika.py.)
MANDHI_DAY_SLOT = {6: 7, 0: 6, 1: 5, 2: 4, 3: 3, 4: 2, 5: 1}
# Night birth: day_slot + 4 (wrapping within 1-8), recomputed from the
# corrected MANDHI_DAY_SLOT above. Sun=3, Mon=2, Tue=1, Wed=8, Thu=7, Fri=6, Sat=5.
MANDHI_NIGHT_SLOT = {6: 3, 0: 2, 1: 1, 2: 8, 3: 7, 4: 6, 5: 5}

_PLANET_MEAN_DAILY_SPEED: dict[str, float] = {
    "MOON": 13.176,
    "MERCURY": 1.20,
    "VENUS": 1.20,
    "SUN": 0.9856,
    "MARS": 0.524,
    "JUPITER": 0.083,
    "SATURN": 0.033,
    "RAHU": 0.053,
    "KETU": 0.053,
}
_NATAL_GRAHAS = frozenset({"SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN", "RAHU", "KETU"})
_VARGA_DIVISIONS = (2, 3, 4, 7, 10, 12, 16, 20, 24, 27, 30, 40, 45, 60)
# Spec section 3.13: D60 requires exact birth time; >2 min uncertainty is unreliable.
_LOW_RELIABILITY_VARGAS = frozenset({"D60"})
# Classical Deva/Manushya/Rakshasa assignment — must match app.calculations.porutham._GANA.
_NAKSHATRA_GANA = {
    1: "Deva", 2: "Manushya", 3: "Rakshasa", 4: "Manushya", 5: "Deva", 6: "Manushya",
    7: "Deva", 8: "Deva", 9: "Rakshasa", 10: "Rakshasa", 11: "Manushya", 12: "Manushya",
    13: "Deva", 14: "Rakshasa", 15: "Deva", 16: "Rakshasa", 17: "Deva", 18: "Rakshasa",
    19: "Rakshasa", 20: "Manushya", 21: "Manushya", 22: "Deva", 23: "Rakshasa", 24: "Rakshasa",
    25: "Manushya", 26: "Manushya", 27: "Deva",
}

def _nakshatra_gana(nakshatra_number: int) -> str:
    return _NAKSHATRA_GANA.get(nakshatra_number, "Deva")


def _nakshatra_nadi(nakshatra_number: int) -> str:
    mod = (nakshatra_number - 1) % 9
    if mod < 3:
        return "Aadhi"
    if mod < 6:
        return "Madhya"
    return "Anthya"


def _compute_vargas(planet_longitudes: dict[str, float]) -> dict[str, dict[str, int]]:
    return {
        f"D{division}": get_varga(division, planet_longitudes)
        for division in _VARGA_DIVISIONS
    }


def _varga_reliability(confidence_minutes: int) -> dict[str, str]:
    if confidence_minutes > 2:
        return {varga: "LOW" for varga in _LOW_RELIABILITY_VARGAS}
    return {}


def _compute_nakshatra_analysis(planet_longitudes: dict[str, float]) -> dict[str, object]:
    return {
        "dispositor_chain": build_dispositor_chain(planet_longitudes),
        "pushkara": pushkara_check(planet_longitudes),
        "gandanta": gandanta_detail(planet_longitudes),
    }


def _speed_ratio(graha: str, speed_deg_per_day: float) -> float | None:
    mean = _PLANET_MEAN_DAILY_SPEED.get(graha)
    if mean is None or mean <= 0:
        return None
    return abs(speed_deg_per_day) / mean


def _aspect_counts(
    target_graha: str,
    planet_rasi_map: dict[str, int],
    combust_planets: set[str],
    *,
    paksha_is_shukla: bool,
) -> tuple[int, int]:
    target_rasi = planet_rasi_map.get(target_graha)
    if target_rasi is None:
        return 0, 0

    benefics = {"JUPITER", "VENUS"}
    malefics = {"SUN", "MARS", "SATURN", "RAHU", "KETU"}
    if paksha_is_shukla:
        benefics.add("MOON")
    else:
        malefics.add("MOON")
    if "MERCURY" in combust_planets:
        malefics.add("MERCURY")
    else:
        benefics.add("MERCURY")

    benefic_count = 0
    malefic_count = 0
    for source_graha, source_rasi in planet_rasi_map.items():
        if source_graha == target_graha:
            continue
        if source_graha not in _NATAL_GRAHAS:
            continue
        # Shared classical special-aspect table (aspects.py) — the single source
        # of drishti geometry, so the natal drik count can never drift from the
        # rest of the engine (audit C3).
        if not aspects_house(source_graha, source_rasi, target_rasi):
            continue
        if source_graha in benefics:
            benefic_count += 1
        elif source_graha in malefics:
            malefic_count += 1
    return benefic_count, malefic_count


def _is_daytime_birth(birth_time_local: time | None) -> bool:
    if birth_time_local is None:
        return True
    return 6 <= birth_time_local.hour < 18


def _paksha_is_shukla(moon_longitude: float, sun_longitude: float) -> bool:
    phase = (moon_longitude - sun_longitude) % 360.0
    return phase < 180.0


def _mandhi_longitude(
    birth_date: date,
    birth_time_local: time | None,
    birth_lat: float,
    birth_lng: float,
    birth_timezone: str,
) -> float | None:
    """Return Mandhi's sidereal zodiac longitude at birth (degree of the rising sign at Mandhi-kalam start)."""
    try:
        if birth_time_local is None:
            return None
        tz = resolve_timezone(birth_timezone)
        local_midnight = datetime.combine(birth_date, datetime.min.time(), tzinfo=tz)
        jd_start = utc_datetime_to_julian_day(local_midnight.astimezone(UTC))
        sunrise_jd = calculate_rise_transit_jd(jd_start, birth_lat, birth_lng, rise=True)
        sunset_jd = calculate_rise_transit_jd(jd_start, birth_lat, birth_lng, rise=False)

        birth_local_dt = datetime.combine(birth_date, birth_time_local, tzinfo=tz)
        birth_jd = utc_datetime_to_julian_day(birth_local_dt.astimezone(UTC))
        weekday = birth_date.weekday()

        if sunrise_jd <= birth_jd < sunset_jd:
            slot_duration_days = (sunset_jd - sunrise_jd) / 8
            mandhi_slot = MANDHI_DAY_SLOT[weekday]
            mandhi_start_jd = sunrise_jd + slot_duration_days * (mandhi_slot - 1)
        else:
            mandhi_slot = MANDHI_NIGHT_SLOT[weekday]
            if birth_jd < sunrise_jd:
                prev_midnight = local_midnight - timedelta(days=1)
                prev_start_jd = utc_datetime_to_julian_day(prev_midnight.astimezone(UTC))
                prev_sunset_jd = calculate_rise_transit_jd(prev_start_jd, birth_lat, birth_lng, rise=False)
                slot_duration_days = (sunrise_jd - prev_sunset_jd) / 8
                mandhi_start_jd = prev_sunset_jd + slot_duration_days * (mandhi_slot - 1)
            else:
                next_midnight = local_midnight + timedelta(days=1)
                next_start_jd = utc_datetime_to_julian_day(next_midnight.astimezone(UTC))
                next_sunrise_jd = calculate_rise_transit_jd(next_start_jd, birth_lat, birth_lng, rise=True)
                slot_duration_days = (next_sunrise_jd - sunset_jd) / 8
                mandhi_start_jd = sunset_jd + slot_duration_days * (mandhi_slot - 1)

        return calculate_lagna_degree(mandhi_start_jd, birth_lat, birth_lng)
    except Exception:
        return None


def _mandhi_planet_position(longitude: float, lagna_rasi: int) -> PlanetPosition:
    rasi = int((longitude % 360) // 30) + 1
    nakshatra_number = nakshatra_from_degree(longitude)
    d9_rasi = navamsa_rasi_from_degree(longitude)
    return PlanetPosition(
        graha="MANDHI",
        rasi_name=RASI_NAMES[rasi],
        absolute_longitude=longitude,
        rasi=rasi,
        degree_in_rasi=degree_in_rasi(longitude),
        nakshatra=nakshatra_number,
        nakshatra_name=NAKSHATRA_NAMES[nakshatra_number - 1],
        pada=pada_from_degree(longitude),
        house_from_lagna=house_from_reference(lagna_rasi, rasi),
        speed_deg_per_day=0.0,
        is_retrograde=False,
        is_combust=False,
        is_cazimi=False,
        d9_rasi=d9_rasi,
        is_vargottama=rasi == d9_rasi,
        show_retrograde_badge=False,
        strength_score=0,
        strength_breakdown={
            "sthana": "NEUTRAL",
            "dik": "NEUTRAL",
            "kala": "NEUTRAL",
            "chesta": "NEUTRAL",
            "naisargika": "NEUTRAL",
            "drik": "NEUTRAL",
            # Mandhi is a shadow upagraha, not a real graha — it has no
            # classical Shadbala/avastha of its own, so these stay neutral.
            "baladi": "NEUTRAL",
            "jagradadi": "NEUTRAL",
            "deeptadi": "NEUTRAL",
        },
    )


def _planet_position_from_snapshot(
    body: object,
    *,
    lagna_rasi: int,
    sun_degree: float,
    is_daytime: bool,
    paksha_is_shukla: bool,
    benefic_aspect_count: int = 0,
    malefic_aspect_count: int = 0,
    planetary_wars: dict[str, str] | None = None,
) -> PlanetPosition:
    rasi_name = RASI_NAMES[body.rasi]  # type: ignore[attr-defined]
    nakshatra_number = nakshatra_from_degree(body.absolute_longitude)  # type: ignore[attr-defined]
    d9_rasi = navamsa_rasi_from_degree(body.absolute_longitude)  # type: ignore[attr-defined]
    is_vargottama = body.rasi == d9_rasi  # type: ignore[attr-defined]
    speed_ratio = _speed_ratio(body.graha, body.speed_deg_per_day)  # type: ignore[attr-defined]
    strength_score = compute_natal_planet_score(
        body.graha,  # type: ignore[attr-defined]
        body.rasi,  # type: ignore[attr-defined]
        body.absolute_longitude,  # type: ignore[attr-defined]
        lagna_rasi,
        sun_degree,
        body.is_retrograde,  # type: ignore[attr-defined]
        is_vargottama=is_vargottama,
        d9_rasi=d9_rasi,
        is_daytime=is_daytime,
        paksha_is_shukla=paksha_is_shukla,
        speed_ratio=speed_ratio,
        benefic_aspect_count=benefic_aspect_count,
        malefic_aspect_count=malefic_aspect_count,
        planetary_wars=planetary_wars,
    )
    return PlanetPosition(
        graha=body.graha,  # type: ignore[attr-defined]
        rasi_name=rasi_name,
        absolute_longitude=body.absolute_longitude,  # type: ignore[attr-defined]
        rasi=body.rasi,  # type: ignore[attr-defined]
        degree_in_rasi=body.degree_in_rasi,  # type: ignore[attr-defined]
        nakshatra=nakshatra_number,
        nakshatra_name=NAKSHATRA_NAMES[nakshatra_number - 1],
        pada=pada_from_degree(body.absolute_longitude),  # type: ignore[attr-defined]
        house_from_lagna=house_from_reference(lagna_rasi, body.rasi),  # type: ignore[attr-defined]
        speed_deg_per_day=body.speed_deg_per_day,  # type: ignore[attr-defined]
        is_retrograde=body.is_retrograde,  # type: ignore[attr-defined]
        # Cazimi and combust are mutually exclusive: a planet in the heart of the
        # Sun is empowered, not burnt, so it must not read as combust to yoga
        # detection or the combust badge even though it sits inside the orb.
        is_combust=(
            is_combust(body.graha, body.absolute_longitude, sun_degree, body.is_retrograde)  # type: ignore[attr-defined]
            and not is_cazimi(body.graha, body.absolute_longitude, sun_degree)  # type: ignore[attr-defined]
        ),
        is_cazimi=is_cazimi(body.graha, body.absolute_longitude, sun_degree),  # type: ignore[attr-defined]
        d9_rasi=d9_rasi,
        is_vargottama=is_vargottama,
        show_retrograde_badge=body.show_retrograde_badge and body.graha not in {"RAHU", "KETU"},  # type: ignore[attr-defined]
        strength_score=strength_score,
        strength_breakdown=compute_strength_breakdown(
            body.graha,  # type: ignore[attr-defined]
            body.rasi,  # type: ignore[attr-defined]
            body.absolute_longitude,  # type: ignore[attr-defined]
            lagna_rasi,
            body.is_retrograde,  # type: ignore[attr-defined]
            is_vargottama=is_vargottama,
            d9_rasi=d9_rasi,
            is_daytime=is_daytime,
            paksha_is_shukla=paksha_is_shukla,
            benefic_aspect_count=benefic_aspect_count,
            malefic_aspect_count=malefic_aspect_count,
            speed_ratio=speed_ratio,
        ),
    )
