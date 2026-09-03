from __future__ import annotations

from datetime import UTC, date, datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.calculations.astro import utc_datetime_to_julian_day
from app.calculations.dasha import calculate_vimshottari_timeline
from app.calculations.functional_nature import get_functional_nature
from app.calculations.remedies import active_dosham_planet, get_remedy, remedy_disclaimer, select_remedy_focus
from app.core.auth import get_current_user
from app.core.chart_access import assert_chart_owner as _assert_chart_owner
from app.db.session import get_db
from app.models.user import User
from app.services.chart_service import load_persisted_chart_response

router = APIRouter()


@router.get("/charts/{chart_id}/gemstone-advice", tags=["remedies"])
def gemstone_advice(
    chart_id: UUID,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _, profile = _assert_chart_owner(session, chart_id, current_user)
    lagna_rasi = load_persisted_chart_response(session, chart_id).data.lagna.rasi
    planets = ("SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN", "RAHU", "KETU")
    rows = []
    for planet in planets:
        fn = get_functional_nature(lagna_rasi, planet)
        remedy = get_remedy(planet, fn, "MODERATE")
        rows.append(
            {
                "planet": planet,
                "functional_nature": fn.value,
                "is_gemstone_prescribed": remedy["is_gemstone_prescribed"],
                "gemstone_name_ta": remedy["gemstone_ta"],
                "gemstone_name_en": remedy["gemstone_en"],
                "reason_ta": remedy["reason_ta"],
                "reason_en": remedy["reason_en"],
                "caution_ta": remedy["caution_ta"],
                "caution_en": remedy["caution_en"],
            }
        )
    return {
        "success": True,
        "data": {
            "chartId": str(chart_id),
            "asOf": date.today().isoformat(),
            "advice": rows,
            "profileName": profile.display_name,
            "disclaimer": remedy_disclaimer(),
        },
    }


@router.get("/charts/{chart_id}/remedy-plan", tags=["remedies"])
def remedy_plan(
    chart_id: UUID,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _assert_chart_owner(session, chart_id, current_user)
    snapshot = load_persisted_chart_response(session, chart_id)
    lagna_rasi = snapshot.data.lagna.rasi
    moon = next((p for p in snapshot.data.planets if p.graha == "MOON"), None)
    if moon is None:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="Moon not present in chart.")

    now_jd = utc_datetime_to_julian_day(datetime.now(tz=UTC))
    timeline = calculate_vimshottari_timeline(snapshot.data.julian_day, moon.absolute_longitude, now_jd)
    current_maha_lord = timeline.current_mahadasha.lord

    dosham_planet = active_dosham_planet(snapshot.data.doshams, lagna_rasi)

    focus = select_remedy_focus(
        lagna_rasi=lagna_rasi,
        planet_strengths=[(p.graha, int(getattr(p, "strength_score", 0) or 50)) for p in snapshot.data.planets],
        current_maha_lord=current_maha_lord,
        active_dosham_planet=dosham_planet,
    )
    weakest = list(focus.weakest)
    ordered_planets = list(focus.ordered)

    rows = []
    for i, planet in enumerate(ordered_planets, start=1):
        fn = get_functional_nature(lagna_rasi, planet)
        row = get_remedy(planet, fn, "SEVERE")
        row["priority"] = i
        row["reason_en"] = row.get("reason_en") or f"Priority {i} planet for current chart period"
        row["reason_ta"] = row.get("reason_ta") or f"முன்னுரிமை {i} கிரகம்"
        rows.append(row)

    return {
        "success": True,
        "data": {
            "chartId": str(chart_id),
            "currentMahaLord": current_maha_lord,
            "weakestPlanets": weakest,
            "activeDoshamPlanet": dosham_planet,
            "items": rows,
            "disclaimer": remedy_disclaimer(),
        },
    }
