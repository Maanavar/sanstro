from __future__ import annotations

from datetime import UTC, date, datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.calculations.astro import utc_datetime_to_julian_day
from app.calculations.chart_strength import SIGN_LORD
from app.calculations.dasha import calculate_vimshottari_timeline
from app.calculations.functional_nature import FunctionalNature, get_functional_nature
from app.calculations.remedies import get_remedy
from app.calculations.yogas import get_badhaka_lord
from app.core.auth import get_current_user
from app.db.session import get_db
from app.models import BirthProfile, Chart
from app.models.user import User
from app.services.chart_service import load_persisted_chart_response

router = APIRouter()


def _assert_chart_owner(session: Session, chart_id: UUID, current_user: User) -> tuple[Chart, BirthProfile]:
    chart = session.get(Chart, chart_id)
    if chart is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chart not found.")
    profile = session.get(BirthProfile, chart.birth_profile_id)
    if profile is None or profile.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Birth profile not found.")
    if profile.owner_user_id != current_user.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
    return chart, profile


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

    strengths = sorted(
        (
            (
                p.graha,
                int(getattr(p, "strength_score", 0) or 50),
            )
            for p in snapshot.data.planets
            if p.graha in {"SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN", "RAHU", "KETU"}
        ),
        key=lambda item: item[1],
    )
    weakest = [planet for planet, _ in strengths[:3]]

    now_jd = utc_datetime_to_julian_day(datetime.now(tz=UTC))
    timeline = calculate_vimshottari_timeline(snapshot.data.julian_day, moon.absolute_longitude, now_jd)
    current_maha_lord = timeline.current_mahadasha.lord

    active_dosham_planet = None
    for dosham in snapshot.data.doshams:
        if not dosham.is_present:
            continue
        if dosham.name in {"SEVVAI_DOSHAM", "KALATHRA_DOSHAM"}:
            active_dosham_planet = "MARS"
        elif dosham.name in {"RAHU_KETU_DOSHAM", "KALASARPA", "PUTRA_SARPA_DOSHAM"}:
            active_dosham_planet = "RAHU"
        elif dosham.name == "PITRU_DOSHAM":
            active_dosham_planet = "SUN"
        elif dosham.name == "BADHAKA_DOSHAM":
            active_dosham_planet = get_badhaka_lord(lagna_rasi, SIGN_LORD)
        if active_dosham_planet:
            break

    benefic_candidates = [
        planet
        for planet in weakest
        if get_functional_nature(lagna_rasi, planet) in {
            FunctionalNature.YOGAKARAKA,
            FunctionalNature.TRIKONA,
            FunctionalNature.LAGNA_LORD,
            FunctionalNature.KENDRA,
        }
    ]
    weakest_benefic = benefic_candidates[0] if benefic_candidates else (weakest[0] if weakest else current_maha_lord)
    ordered_planets: list[str] = []
    for candidate in (current_maha_lord, weakest_benefic, active_dosham_planet):
        if candidate and candidate not in ordered_planets:
            ordered_planets.append(candidate)

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
            "activeDoshamPlanet": active_dosham_planet,
            "items": rows,
        },
    }
