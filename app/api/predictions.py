from __future__ import annotations

from dataclasses import asdict
from datetime import UTC, date, datetime, time
from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session

from app.calculations.astro import resolve_timezone, utc_datetime_to_julian_day
from app.calculations.dasha import calculate_vimshottari_timeline
from app.calculations.ephemeris import calculate_sidereal_planets
from app.core.auth import get_current_user
from app.db.session import get_db
from app.models import BirthProfile, Chart
from app.models.user import User
from app.services.career_service import CareerAssessmentInput, assess_career_prediction
from app.services.chart_service import load_persisted_chart_response
from app.services.health_service import HealthAssessmentInput, assess_health_prediction
from app.services.life_area_prediction_models import LifeAreaPrediction
from app.services.marriage_service import MarriageAssessmentInput, assess_marriage_prediction
from app.services.wealth_service import WealthAssessmentInput, assess_wealth_prediction
from app.services.chart_service import get_jadhagam_report as _get_jadhagam_report

router = APIRouter()


# ── Pydantic response models ──────────────────────────────────────────────────

class BiTextOut(BaseModel):
    ta: str
    en: str
    model_config = ConfigDict(populate_by_name=True)


class AstroFactorOut(BaseModel):
    key: str
    status: str
    detail: BiTextOut
    model_config = ConfigDict(populate_by_name=True)


class LifeAreaPredictionOut(BaseModel):
    life_area: str = Field(alias="lifeArea")
    main_prediction_ta: str = Field(alias="mainPredictionTa")
    main_prediction_en: str = Field(alias="mainPredictionEn")
    astrological_factors: list[AstroFactorOut] = Field(alias="astrologicalFactors")
    dasha_support: str = Field(alias="dashaSupport")
    transit_support: str = Field(alias="transitSupport")
    timing_window_start: date | None = Field(alias="timingWindowStart")
    timing_window_end: date | None = Field(alias="timingWindowEnd")
    confidence: str
    challenges: list[BiTextOut]
    supports: list[BiTextOut]
    model_config = ConfigDict(populate_by_name=True)


class PredictionResponse(BaseModel):
    success: bool = True
    data: LifeAreaPredictionOut
    model_config = ConfigDict(populate_by_name=True)


# ── Helper: convert LifeAreaPrediction dataclass → Pydantic out ───────────────

def _to_out(pred: LifeAreaPrediction) -> LifeAreaPredictionOut:
    return LifeAreaPredictionOut(
        lifeArea=pred.life_area,
        mainPredictionTa=pred.main_prediction_ta,
        mainPredictionEn=pred.main_prediction_en,
        astrologicalFactors=[
            AstroFactorOut(
                key=f.key,
                status=f.status,
                detail=BiTextOut(ta=f.detail.ta, en=f.detail.en),
            )
            for f in pred.astrological_factors
        ],
        dashaSupport=pred.dasha_support,
        transitSupport=pred.transit_support,
        timingWindowStart=pred.timing_window_start,
        timingWindowEnd=pred.timing_window_end,
        confidence=pred.confidence,
        challenges=[BiTextOut(ta=c.ta, en=c.en) for c in pred.challenges],
        supports=[BiTextOut(ta=s.ta, en=s.en) for s in pred.supports],
    )


# ── Shared: load chart + live transit data ────────────────────────────────────

def _load_chart_context(session: Session, chart_id: UUID, current_user: User, as_of: date):
    chart = session.get(Chart, chart_id)
    if chart is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chart not found.")
    profile = session.get(BirthProfile, chart.birth_profile_id)
    if profile is None or profile.owner_user_id != current_user.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    snapshot = load_persisted_chart_response(session, chart_id)
    natal_moon = next(p for p in snapshot.data.planets if p.graha == "MOON")

    tz = resolve_timezone(profile.birth_timezone)
    local_noon = datetime.combine(as_of, time(12, 0), tzinfo=tz)
    current_jd = utc_datetime_to_julian_day(local_noon.astimezone(UTC))

    transit = calculate_sidereal_planets(current_jd)
    timeline = calculate_vimshottari_timeline(snapshot.data.julian_day, natal_moon.absolute_longitude, current_jd)

    planets_rasi = {p.graha: p.rasi for p in snapshot.data.planets}
    active_dasha_lords = {timeline.current_mahadasha.lord, timeline.current_antardasha.lord}

    today = as_of
    birth_date_local = profile.birth_date_local
    age = today.year - birth_date_local.year - (
        (today.month, today.day) < (birth_date_local.month, birth_date_local.day)
    )

    return snapshot, planets_rasi, active_dasha_lords, transit, age


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get(
    "/charts/{chart_id}/predictions/marriage",
    response_model=PredictionResponse,
    tags=["predictions"],
)
def get_marriage_prediction(
    chart_id: UUID,
    as_of: date = Query(default=None, alias="asOf"),
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PredictionResponse:
    on_date = as_of or date.today()
    snapshot, planets_rasi, active_dasha_lords, transit, age = _load_chart_context(
        session, chart_id, current_user, on_date
    )

    doshams_by_name = {d.name.upper(): d for d in snapshot.data.doshams}
    sevvai = doshams_by_name.get("SEVVAI_DOSHAM")
    rahu_ketu = doshams_by_name.get("RAHU_KETU_DOSHAM")
    sevvai_cancelled = bool(sevvai and sevvai.is_cancelled)
    d9_rasi_by_planet = {p.graha: p.d9_rasi for p in snapshot.data.planets}

    payload = MarriageAssessmentInput(
        as_of=on_date,
        lagna_rasi=snapshot.data.lagna.rasi,
        planets_rasi=planets_rasi,
        active_dasha_lords=active_dasha_lords,
        transit_jupiter_rasi=transit.bodies["JUPITER"].rasi,
        transit_venus_rasi=transit.bodies["VENUS"].rasi,
        age=age,
        sevvai_dosham_cancelled=sevvai_cancelled,
        rahu_ketu_label=rahu_ketu.label if rahu_ketu else None,
        d9_rasi_by_planet=d9_rasi_by_planet,
    )
    return PredictionResponse(data=_to_out(assess_marriage_prediction(payload)))


@router.get(
    "/charts/{chart_id}/predictions/career",
    response_model=PredictionResponse,
    tags=["predictions"],
)
def get_career_prediction(
    chart_id: UUID,
    as_of: date = Query(default=None, alias="asOf"),
    career_track: str = Query(default="general", alias="careerTrack"),
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PredictionResponse:
    on_date = as_of or date.today()
    snapshot, planets_rasi, active_dasha_lords, transit, age = _load_chart_context(
        session, chart_id, current_user, on_date
    )

    payload = CareerAssessmentInput(
        as_of=on_date,
        lagna_rasi=snapshot.data.lagna.rasi,
        planets_rasi=planets_rasi,
        active_dasha_lords=active_dasha_lords,
        transit_saturn_rasi=transit.bodies["SATURN"].rasi,
        age=age,
        career_track=career_track,
    )
    return PredictionResponse(data=_to_out(assess_career_prediction(payload)))


@router.get(
    "/charts/{chart_id}/predictions/wealth",
    response_model=PredictionResponse,
    tags=["predictions"],
)
def get_wealth_prediction(
    chart_id: UUID,
    as_of: date = Query(default=None, alias="asOf"),
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PredictionResponse:
    on_date = as_of or date.today()
    snapshot, planets_rasi, active_dasha_lords, transit, age = _load_chart_context(
        session, chart_id, current_user, on_date
    )

    has_dhana_yoga = any(y.name.upper() == "DHANA_YOGA" and y.is_present for y in snapshot.data.yogas)
    doshams_by_name = {d.name.upper(): d for d in snapshot.data.doshams}
    pitru = doshams_by_name.get("PITRU_DOSHAM")
    rahu_ketu = doshams_by_name.get("RAHU_KETU_DOSHAM")

    payload = WealthAssessmentInput(
        as_of=on_date,
        lagna_rasi=snapshot.data.lagna.rasi,
        planets_rasi=planets_rasi,
        active_dasha_lords=active_dasha_lords,
        transit_jupiter_rasi=transit.bodies["JUPITER"].rasi,
        has_dhana_yoga=has_dhana_yoga,
        age=age,
        pitru_dosham_label=pitru.label if pitru else None,
        rahu_ketu_label=rahu_ketu.label if rahu_ketu else None,
    )
    return PredictionResponse(data=_to_out(assess_wealth_prediction(payload)))


@router.get(
    "/charts/{chart_id}/predictions/health",
    response_model=PredictionResponse,
    tags=["predictions"],
)
def get_health_prediction(
    chart_id: UUID,
    as_of: date = Query(default=None, alias="asOf"),
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PredictionResponse:
    on_date = as_of or date.today()
    snapshot, planets_rasi, active_dasha_lords, transit, age = _load_chart_context(
        session, chart_id, current_user, on_date
    )

    # Use lagna strength from chart strength calculation
    from app.calculations.chart_strength import compute_natal_planet_score
    lagna_scores = [
        compute_natal_planet_score(
            planet=p.graha,
            natal_rasi=p.rasi,
            natal_longitude=p.absolute_longitude,
            natal_lagna_rasi=snapshot.data.lagna.rasi,
            sun_longitude=next(x.absolute_longitude for x in snapshot.data.planets if x.graha == "SUN"),
            is_retrograde=p.is_retrograde,
            is_vargottama=p.is_vargottama,
            d9_rasi=p.d9_rasi,
        )
        for p in snapshot.data.planets
        if p.graha not in ("RAHU", "KETU")
    ]
    lagna_strength = round(sum(lagna_scores) / len(lagna_scores)) if lagna_scores else 50

    doshams_by_name = {d.name.upper(): d for d in snapshot.data.doshams}
    pitru = doshams_by_name.get("PITRU_DOSHAM")
    rahu_ketu = doshams_by_name.get("RAHU_KETU_DOSHAM")

    payload = HealthAssessmentInput(
        as_of=on_date,
        lagna_rasi=snapshot.data.lagna.rasi,
        planets_rasi=planets_rasi,
        active_dasha_lords=active_dasha_lords,
        age=age,
        lagna_strength_score=lagna_strength,
        pitru_dosham_label=pitru.label if pitru else None,
        rahu_ketu_label=rahu_ketu.label if rahu_ketu else None,
    )
    return PredictionResponse(data=_to_out(assess_health_prediction(payload)))
