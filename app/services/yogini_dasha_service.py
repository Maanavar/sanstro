"""Service layer for Yogini Dasha (app/calculations/yogini_dasha.py).

Secondary/comparison dasha system — additive to the primary Vimshottari
timeline (`dasha_service.py`), gated behind its own route per the plan's
precedent for advanced/secondary dasha features (Chara Dasha, Shadbala).
"""
from __future__ import annotations

from datetime import date
from uuid import UUID

from sqlalchemy.orm import Session

from app.calculations.dasha import DashaPeriod
from app.calculations.yogini_dasha import (
    YOGINI_RULING_PLANET,
    YOGINI_YEARS,
    calculate_yogini_timeline,
)
from app.services.chart_service import load_persisted_chart_response
from app.services.location_service import local_midnight_as_jd_for_profile


def _serialize_period(period: DashaPeriod) -> dict[str, object]:
    return {
        "level": period.level,
        "yogini": period.lord,
        "rulingPlanet": YOGINI_RULING_PLANET[period.lord],
        "years": YOGINI_YEARS[period.lord],
        "startDate": period.start_date,
        "endDate": period.end_date,
    }


def build_yogini_dasha_response(session: Session, chart_id: UUID, as_of: date | None = None) -> dict:
    chart_snapshot = load_persisted_chart_response(session, chart_id)
    if as_of is None:
        as_of = date.today()

    moon = next(planet for planet in chart_snapshot.data.planets if planet.graha == "MOON")
    birth_jd = chart_snapshot.data.julian_day
    as_of_jd = local_midnight_as_jd_for_profile(as_of, chart_snapshot.data.birth_profile)

    timeline = calculate_yogini_timeline(birth_jd, moon.absolute_longitude, as_of_jd)

    return {
        "chartId": str(chart_snapshot.data.chart_id),
        "openingYogini": {
            "yogini": timeline.opening_yogini,
            "rulingPlanet": YOGINI_RULING_PLANET[timeline.opening_yogini],
            "balanceYearsAtBirth": round(timeline.balance_years_at_birth, 4),
        },
        "current": {
            "mahadasha": _serialize_period(timeline.current_mahadasha),
            "antardasha": _serialize_period(timeline.current_antardasha),
        },
        "mahadashas": [_serialize_period(period) for period in timeline.mahadashas],
        "antardashas": [_serialize_period(period) for period in timeline.antardashas],
    }
