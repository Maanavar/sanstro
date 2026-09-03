"""Service layer for Ashtottari Dasha (app/calculations/ashtottari_dasha.py).

Secondary/comparison dasha system — additive to the primary Vimshottari
timeline (`dasha_service.py`), gated behind its own route per the plan's
precedent for advanced/secondary dasha features (Chara Dasha, Yogini Dasha,
Shadbala).
"""
from __future__ import annotations

from datetime import date
from uuid import UUID

from sqlalchemy.orm import Session

from app.calculations.ashtottari_dasha import (
    ASHTOTTARI_YEARS,
    calculate_ashtottari_timeline,
    evaluate_ashtottari_applicability,
)
from app.calculations.astro import normalize_longitude
from app.calculations.dasha import DashaPeriod
from app.services.chart_service import load_persisted_chart_response
from app.services.conditional_dashas_service import derive_day_night_birth
from app.services.location_service import local_midnight_as_jd_for_profile


def _serialize_period(period: DashaPeriod) -> dict[str, object]:
    return {
        "level": period.level,
        "lord": period.lord,
        "years": ASHTOTTARI_YEARS[period.lord],
        "startDate": period.start_date,
        "endDate": period.end_date,
    }


def build_ashtottari_dasha_response(session: Session, chart_id: UUID, as_of: date | None = None) -> dict:
    chart_snapshot = load_persisted_chart_response(session, chart_id)
    if as_of is None:
        as_of = date.today()

    data = chart_snapshot.data
    planets = {planet.graha: planet for planet in data.planets}
    moon = planets["MOON"]
    sun = planets["SUN"]
    birth_jd = data.julian_day
    as_of_jd = local_midnight_as_jd_for_profile(as_of, data.birth_profile)

    timeline = calculate_ashtottari_timeline(birth_jd, moon.absolute_longitude, as_of_jd)

    # --- Informational applicability verdict (never gates the timeline; EC-6) ---
    planet_house = {graha: p.house_from_lagna for graha, p in planets.items()}
    # Paksha from Sun-Moon elongation (Shukla: waxing 0-180°, Krishna: 180-360°).
    elongation = normalize_longitude(moon.absolute_longitude - sun.absolute_longitude)
    paksha = "SHUKLA" if elongation < 180.0 else "KRISHNA"
    is_day_birth, is_day_birth_approximate = derive_day_night_birth(data, planet_house.get("SUN"))

    applicability = evaluate_ashtottari_applicability(
        lagna_rasi=data.lagna.rasi,
        planet_house=planet_house,
        paksha=paksha,
        is_day_birth=is_day_birth,
    )

    return {
        "chartId": str(data.chart_id),
        "openingLord": {
            "lord": timeline.opening_lord,
            "balanceYearsAtBirth": round(timeline.balance_years_at_birth, 4),
        },
        "current": {
            "mahadasha": _serialize_period(timeline.current_mahadasha),
            "antardasha": _serialize_period(timeline.current_antardasha),
        },
        "mahadashas": [_serialize_period(period) for period in timeline.mahadashas],
        "antardashas": [_serialize_period(period) for period in timeline.antardashas],
        "applicability": {
            "ruleEn": applicability.rule_en,
            "ruleTa": applicability.rule_ta,
            "applicable": applicability.applicable,
            "reason": applicability.reason,
            "paksha": paksha,
            "isDayBirth": is_day_birth,
            "isDayBirthApproximate": is_day_birth_approximate,
            "pakshaSupports": applicability.paksha_supports,
            "pakshaReason": applicability.paksha_reason,
        },
    }
