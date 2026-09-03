"""Service layer for the conditional nakshatra dasha family
(app/calculations/conditional_dashas.py).

Consolidates all seven conditional dashas (Shodashottari, Dwadashottari,
Panchottari, Shatabdika, Chaturashiti-sama, Dwisaptati-sama, Shashtihayani)
plus the informational applicability selector into ONE response, served by a
single route — deliberately not seven near-duplicate routes/services, since
they share one engine and one UI panel. Additive to the primary Vimshottari
timeline (`dasha_service.py`); experimental/display-only, not used in scoring.
"""
from __future__ import annotations

import logging
from datetime import date, datetime, time
from uuid import UUID

from sqlalchemy.orm import Session

from app.calculations.astro import (
    local_datetime_to_utc,
    navamsa_rasi_from_degree,
    normalize_longitude,
    utc_datetime_to_julian_day,
)
from app.calculations.conditional_dashas import (
    CONDITIONAL_DASHA_SYSTEMS,
    ConditionalDashaTimeline,
    calculate_timeline,
    evaluate_applicability,
)
from app.calculations.dasha import DashaPeriod
from app.calculations.divisional_charts import compute_d12
from app.calculations.ephemeris import calculate_rise_transit_jd
from app.services.chart_service import load_persisted_chart_response
from app.services.location_service import local_midnight_as_jd_for_profile

logger = logging.getLogger(__name__)


def derive_day_night_birth(data, sun_house: int | None) -> tuple[bool | None, bool]:
    """Return (is_day_birth, is_approximate) for the birth moment.

    Precise path (EC-5.2): a day birth is one where the birth instant falls
    between that day's true sunrise and sunset at the *birth* place — i.e. the
    Sun is above the horizon. Computed from the birth-time ephemeris rise/set.

    Fallback path: if the birth location/date is incomplete, or the ephemeris
    rise/set cannot be resolved (e.g. polar latitudes with no sunrise that
    day), fall back to the whole-sign approximation from the Sun's house
    (7-12 = above the horizon) and flag it approximate.
    """
    profile = data.birth_profile
    lat = getattr(profile, "birth_latitude", None)
    lon = getattr(profile, "birth_longitude", None)
    tz = getattr(profile, "birth_timezone", None)
    birth_date = getattr(profile, "birth_date_local", None)

    if lat is not None and lon is not None and tz and birth_date is not None:
        try:
            local_midnight = datetime.combine(birth_date, time.min)
            jd_start = utc_datetime_to_julian_day(local_datetime_to_utc(local_midnight, tz))
            sunrise_jd = calculate_rise_transit_jd(jd_start, float(lat), float(lon), rise=True)
            sunset_jd = calculate_rise_transit_jd(jd_start, float(lat), float(lon), rise=False)
            return (sunrise_jd <= data.julian_day < sunset_jd, False)
        except Exception:  # noqa: BLE001 — ephemeris rise/set unavailable; degrade gracefully
            logger.warning(
                "conditional-dashas: true sunrise/sunset unavailable for chart %s; "
                "falling back to whole-sign day/night approximation",
                getattr(data, "chart_id", "?"),
            )

    is_day = None if sun_house is None else 7 <= sun_house <= 12
    return (is_day, True)


def _serialize_period(system_key: str, period: DashaPeriod) -> dict[str, object]:
    system = CONDITIONAL_DASHA_SYSTEMS[system_key]
    return {
        "level": period.level,
        "lord": period.lord,
        "years": system.years[period.lord],
        "startDate": period.start_date,
        "endDate": period.end_date,
    }


def _serialize_timeline(timeline: ConditionalDashaTimeline) -> dict[str, object]:
    key = timeline.system_key
    system = CONDITIONAL_DASHA_SYSTEMS[key]
    return {
        "key": key,
        "nameEn": system.name_en,
        "nameTa": system.name_ta,
        "totalYears": system.total_years,
        "applicabilityEn": system.applicability_en,
        "applicabilityTa": system.applicability_ta,
        "openingLord": {
            "lord": timeline.opening_lord,
            "balanceYearsAtBirth": round(timeline.balance_years_at_birth, 4),
        },
        "current": {
            "mahadasha": _serialize_period(key, timeline.current_mahadasha),
            "antardasha": _serialize_period(key, timeline.current_antardasha),
        },
        "mahadashas": [_serialize_period(key, p) for p in timeline.mahadashas],
        "antardashas": [_serialize_period(key, p) for p in timeline.antardashas],
    }


def build_conditional_dashas_response(session: Session, chart_id: UUID, as_of: date | None = None) -> dict:
    chart_snapshot = load_persisted_chart_response(session, chart_id)
    data = chart_snapshot.data
    if as_of is None:
        as_of = date.today()

    planets = {planet.graha: planet for planet in data.planets}
    moon = planets["MOON"]
    sun = planets["SUN"]
    birth_jd = data.julian_day
    as_of_jd = local_midnight_as_jd_for_profile(as_of, data.birth_profile)

    timelines = {
        key: calculate_timeline(key, birth_jd, moon.absolute_longitude, as_of_jd)
        for key in CONDITIONAL_DASHA_SYSTEMS
    }

    # --- Applicability inputs, derived from the persisted chart snapshot ---
    lagna_rasi = data.lagna.rasi
    lagna_long = data.lagna.absolute_longitude
    d9_lagna_rasi = navamsa_rasi_from_degree(lagna_long)
    d12_lagna_rasi = compute_d12({"LAGNA": lagna_long})["LAGNA"]
    planet_house = {graha: p.house_from_lagna for graha, p in planets.items()}

    # Paksha from Sun-Moon elongation (Shukla: waxing 0-180°, Krishna: 180-360°).
    elongation = normalize_longitude(moon.absolute_longitude - sun.absolute_longitude)
    paksha = "SHUKLA" if elongation < 180.0 else "KRISHNA"

    # Day/night birth: computed precisely from the birth-time true sunrise/
    # sunset at the birth place (EC-5.2). Degrades to the whole-sign house
    # approximation (Sun in houses 7-12 = above the horizon) only when the
    # ephemeris rise/set can't be resolved — `is_day_birth_approximate` says which.
    sun_house = planet_house.get("SUN")
    is_day_birth, is_day_birth_approximate = derive_day_night_birth(data, sun_house)

    applicability = evaluate_applicability(
        lagna_rasi=lagna_rasi,
        d9_lagna_rasi=d9_lagna_rasi,
        d12_lagna_rasi=d12_lagna_rasi,
        planet_house=planet_house,
        paksha=paksha,
        is_day_birth=is_day_birth,
    )

    return {
        "chartId": str(data.chart_id),
        "asOf": as_of,
        "dashas": [_serialize_timeline(timelines[key]) for key in CONDITIONAL_DASHA_SYSTEMS],
        "applicability": {
            "paksha": paksha,
            "isDayBirth": is_day_birth,
            "isDayBirthApproximate": is_day_birth_approximate,
            "results": [
                {"key": r.key, "applicable": r.applicable, "reason": r.reason}
                for r in applicability.values()
            ],
        },
    }
