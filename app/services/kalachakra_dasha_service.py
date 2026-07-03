"""Service layer for Kalachakra Dasha (app/calculations/kalachakra_dasha.py).

Secondary/comparison dasha system — additive to the primary Vimshottari
timeline (`dasha_service.py`), gated behind its own route per the plan's
precedent for advanced/secondary dasha features (Chara Dasha, Yogini Dasha,
Ashtottari Dasha, Shadbala). **Experimental**: no independent second-source
cross-check has been done yet for this specific module — see the module
docstring in kalachakra_dasha.py for the full caveat.
"""
from __future__ import annotations

from datetime import date
from uuid import UUID

from sqlalchemy.orm import Session

from app.calculations.astro import RASI_NAMES
from app.calculations.kalachakra_dasha import (
    RASI_NUMBER,
    RASI_YEARS,
    KalachakraPeriod,
    calculate_kalachakra_timeline,
)
from app.services.chart_service import load_persisted_chart_response
from app.services.location_service import local_midnight_as_jd_for_profile


def _serialize_period(period: KalachakraPeriod) -> dict[str, object]:
    rasi_number = RASI_NUMBER[period.rasi]
    return {
        "level": period.level,
        "rasi": rasi_number,
        "rasiCode": period.rasi,
        "rasiName": RASI_NAMES.get(rasi_number),
        "years": RASI_YEARS[period.rasi],
        "startDate": period.start_date,
        "endDate": period.end_date,
    }


def build_kalachakra_dasha_response(session: Session, chart_id: UUID, as_of: date | None = None) -> dict:
    chart_snapshot = load_persisted_chart_response(session, chart_id)
    if as_of is None:
        as_of = date.today()

    moon = next(planet for planet in chart_snapshot.data.planets if planet.graha == "MOON")
    birth_jd = chart_snapshot.data.julian_day
    as_of_jd = local_midnight_as_jd_for_profile(as_of, chart_snapshot.data.birth_profile)

    timeline = calculate_kalachakra_timeline(birth_jd, moon.absolute_longitude, as_of_jd)

    return {
        "chartId": str(chart_snapshot.data.chart_id),
        "openingInfo": {
            "chakra": timeline.chakra,
            "direction": timeline.direction,
            "pada": timeline.pada,
            "paramayus": timeline.paramayus,
            "rasi": RASI_NUMBER[timeline.opening_rasi],
            "rasiCode": timeline.opening_rasi,
            "rasiName": RASI_NAMES.get(RASI_NUMBER[timeline.opening_rasi]),
            "balanceYearsAtBirth": round(timeline.balance_years_at_birth, 4),
        },
        "current": {
            "mahadasha": _serialize_period(timeline.current_mahadasha),
            "antardasha": _serialize_period(timeline.current_antardasha),
        },
        "mahadashas": [_serialize_period(period) for period in timeline.mahadashas],
        "antardashas": [_serialize_period(period) for period in timeline.antardashas],
    }
