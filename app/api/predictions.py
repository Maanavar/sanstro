from __future__ import annotations

from datetime import UTC, date, datetime, time
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session

from app.calculations.ashtakavarga import compute_bhinnashtakavarga, compute_sarvashtakavarga
from app.calculations.astro import house_from_reference, resolve_timezone, utc_datetime_to_julian_day
from app.calculations.dasha import calculate_vimshottari_timeline
from app.calculations.ephemeris import calculate_sidereal_planets
from app.core.age_gate import is_married_settled, is_minor_age, is_past_prime_marriage_age
from app.core.auth import get_current_user
from app.db.session import get_db
from app.models import BirthProfile, Chart
from app.models.family_member import FamilyMember
from app.models.user import User
from app.reasoning.verdict import legacy_confidence_to_band
from app.services.career_service import CareerAssessmentInput, assess_career_prediction
from app.services.chart_service import load_persisted_chart_response
from app.services.feature_flags import get_flag
from app.services.health_service import HealthAssessmentInput, assess_health_prediction
from app.services.life_area_prediction_models import LifeAreaPrediction
from app.services.location_service import resolve_effective_daily_timezone
from app.services.marriage_service import MarriageAssessmentInput, assess_marriage_prediction
from app.services.context_service import get_context_row
from app.services.prediction_log_service import log_prediction
from app.services.propensity_service import assess_propensities, build_chart_input
from app.services.wealth_service import WealthAssessmentInput, assess_wealth_prediction

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


class ChartSignatureOut(BaseModel):
    """Dominant-graha framing for the whole chart (plan Phase 5)."""
    dominant: str
    framing: BiTextOut
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
    # Ordinal reasoning band (STRONG/LIKELY/MIXED/WEAK/BLOCKED/SILENT).
    # Additive — populated only when the reasoning_gate flag is on (Phase 1).
    band: str | None = None
    challenges: list[BiTextOut]
    supports: list[BiTextOut]
    # Additive — populated only when reasoning_chart_signature is on (Phase 5, P0-4).
    chart_signature: ChartSignatureOut | None = Field(default=None, alias="chartSignature")
    causal_chain: BiTextOut | None = Field(default=None, alias="causalChain")
    model_config = ConfigDict(populate_by_name=True)


class PredictionResponse(BaseModel):
    success: bool = True
    data: LifeAreaPredictionOut
    age_gated: bool = Field(default=False, alias="ageGated")
    alternative_framing: str | None = Field(default=None, alias="alternativeFraming")
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
        band=pred.band,
        challenges=[BiTextOut(ta=c.ta, en=c.en) for c in pred.challenges],
        supports=[BiTextOut(ta=s.ta, en=s.en) for s in pred.supports],
        chartSignature=(
            ChartSignatureOut(
                dominant=pred.chart_signature.dominant,
                framing=BiTextOut(ta=pred.chart_signature.framing.ta, en=pred.chart_signature.framing.en),
            )
            if pred.chart_signature is not None
            else None
        ),
        causalChain=(
            BiTextOut(ta=pred.causal_chain.ta, en=pred.causal_chain.en)
            if pred.causal_chain is not None
            else None
        ),
    )


# ── Shared: load chart + live transit data ────────────────────────────────────

def _derive_life_stage(age: int, employment_type: str | None) -> str:
    emp = (employment_type or "").strip().lower()
    if emp == "retired":
        return "senior"
    if age < 22 or emp == "student":
        return "student"
    if age <= 35:
        return "young_adult"
    if age <= 55:
        return "mid_life"
    return "senior"


def _load_chart_context(session: Session, chart_id: UUID, current_user: User, as_of: date):
    chart = session.get(Chart, chart_id)
    if chart is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chart not found.")
    profile = session.get(BirthProfile, chart.birth_profile_id)
    if profile is None or profile.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Birth profile not found.")
    if profile.owner_user_id != current_user.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    snapshot = load_persisted_chart_response(session, chart_id)
    natal_moon = next(p for p in snapshot.data.planets if p.graha == "MOON")

    tz = resolve_timezone(resolve_effective_daily_timezone(profile))
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
    life_stage = _derive_life_stage(age, getattr(profile, "employment_type", None))

    relationship_to_owner = "self"
    if profile.family_member_id is not None:
        member = session.get(FamilyMember, profile.family_member_id)
        if member is not None:
            relationship_to_owner = member.relationship_to_owner or "self"

    return (
        snapshot,
        planets_rasi,
        active_dasha_lords,
        transit,
        age,
        life_stage,
        getattr(profile, "employment_type", None),
        getattr(profile, "marital_status", None),
        relationship_to_owner,
        timeline,
    )


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
    snapshot, planets_rasi, active_dasha_lords, transit, age, life_stage, _employment_type, marital_status, relationship_to_owner, _timeline = _load_chart_context(
        session, chart_id, current_user, on_date
    )

    doshams_by_name = {d.name.upper(): d for d in snapshot.data.doshams}
    sevvai = doshams_by_name.get("SEVVAI_DOSHAM")
    rahu_ketu = doshams_by_name.get("RAHU_KETU_DOSHAM")
    sevvai_cancelled = bool(sevvai and sevvai.is_cancelled)
    d9_rasi_by_planet = {p.graha: p.d9_rasi for p in snapshot.data.planets}
    planet_longitudes = {
        p.graha: p.absolute_longitude
        for p in snapshot.data.planets
        if p.graha in {"SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN", "RAHU"}
    }

    payload = MarriageAssessmentInput(
        as_of=on_date,
        lagna_rasi=snapshot.data.lagna.rasi,
        planets_rasi=planets_rasi,
        active_dasha_lords=active_dasha_lords,
        transit_jupiter_rasi=transit.bodies["JUPITER"].rasi,
        transit_venus_rasi=transit.bodies["VENUS"].rasi,
        age=age,
        life_stage=life_stage,
        marital_status=marital_status,
        sevvai_dosham_cancelled=sevvai_cancelled,
        rahu_ketu_label=rahu_ketu.label if rahu_ketu else None,
        d9_rasi_by_planet=d9_rasi_by_planet,
        relationship_to_owner=relationship_to_owner,
        planet_longitudes=planet_longitudes,
    )
    result = assess_marriage_prediction(payload)
    is_parental = relationship_to_owner in {"parent", "grandparent"}
    gated = age < 18 or is_past_prime_marriage_age(age) or is_married_settled(marital_status) or is_parental
    alt = "Relationship Harmony" if is_married_settled(marital_status) else None
    if not gated:
        # D5 accountability (plan Phase 4): age-gated responses claim nothing
        # material, so only genuine timing calls are logged.
        log_prediction(
            session,
            chart_id=chart_id,
            source="marriage",
            life_area="MARRIAGE",
            band=result.band or legacy_confidence_to_band(result.confidence).value,
            calc_version=snapshot.meta.calculation_version,
            window_start=result.timing_window_start,
            window_end=result.timing_window_end,
        )
    return PredictionResponse(
        data=_to_out(result),
        age_gated=gated,
        alternative_framing=alt,
    )


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
    snapshot, planets_rasi, active_dasha_lords, transit, age, life_stage, employment_type, _marital_status, _rel, _timeline = _load_chart_context(
        session, chart_id, current_user, on_date
    )

    payload = CareerAssessmentInput(
        as_of=on_date,
        lagna_rasi=snapshot.data.lagna.rasi,
        planets_rasi=planets_rasi,
        active_dasha_lords=active_dasha_lords,
        transit_saturn_rasi=transit.bodies["SATURN"].rasi,
        age=age,
        life_stage=life_stage,
        employment_type=employment_type,
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
    snapshot, planets_rasi, active_dasha_lords, transit, age, life_stage, _employment_type, _marital_status, _rel, _timeline = _load_chart_context(
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
        life_stage=life_stage,
        pitru_dosham_label=pitru.label if pitru else None,
        rahu_ketu_label=rahu_ketu.label if rahu_ketu else None,
    )
    # Feature 5 — for minors, wealth/investment framing is replaced with an
    # education/savings framing flag the client uses to reframe the section.
    minor = age < 18
    return PredictionResponse(
        data=_to_out(assess_wealth_prediction(payload)),
        age_gated=minor,
        alternative_framing="education" if minor else None,
    )


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
    snapshot, planets_rasi, active_dasha_lords, transit, age, life_stage, _employment_type, _marital_status, _rel, _timeline = _load_chart_context(
        session, chart_id, current_user, on_date
    )

    # Use already-computed natal strength scores from chart response.
    lagna_scores = [
        int(getattr(p, "strength_score", 0) or 50)
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
        life_stage=life_stage,
        lagna_strength_score=lagna_strength,
        pitru_dosham_label=pitru.label if pitru else None,
        rahu_ketu_label=rahu_ketu.label if rahu_ketu else None,
    )
    return PredictionResponse(data=_to_out(assess_health_prediction(payload)))


# ── Propensities ("Chances & Cautions") ──────────────────────────────────────

class PropensityCardOut(BaseModel):
    key: str
    category: str
    tier: str
    title: BiTextOut
    level: str
    summary: BiTextOut
    factors: list[AstroFactorOut]
    what_helps: list[BiTextOut] = Field(alias="whatHelps")
    window_note: BiTextOut | None = Field(default=None, alias="windowNote")
    # Phase 2 — concrete dates for window_note, narrowed from the currently
    # running antardasha by a gochara + Sarvashtakavarga-bindu gate (see
    # propensity_service._TimingSpec). Additive; None unless both the prose
    # window fired and the two extra classical gates cleared.
    timing_window_start: date | None = Field(default=None, alias="timingWindowStart")
    timing_window_end: date | None = Field(default=None, alias="timingWindowEnd")
    disclaimer: BiTextOut | None = None
    show_support_resources: bool = Field(default=False, alias="showSupportResources")
    deferred: bool = False
    deferred_reason: BiTextOut | None = Field(default=None, alias="deferredReason")
    band: str | None = None
    model_config = ConfigDict(populate_by_name=True)


class PropensityBundleOut(BaseModel):
    success: bool = True
    generated_for: str = Field(alias="generatedFor")
    life_stage: str = Field(alias="lifeStage")
    results: list[PropensityCardOut]
    model_config = ConfigDict(populate_by_name=True)


def _bi(bt) -> BiTextOut | None:
    return BiTextOut(ta=bt.ta, en=bt.en) if bt is not None else None


@router.get(
    "/charts/{chart_id}/propensities",
    response_model=PropensityBundleOut,
    tags=["predictions"],
)
def get_propensities(
    chart_id: UUID,
    as_of: date = Query(default=None, alias="asOf"),
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PropensityBundleOut:
    if not bool(get_flag("propensity_insights")):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not available.")

    on_date = as_of or date.today()
    snapshot, _planets_rasi, active_dasha_lords, transit, age, life_stage, employment_type, marital_status, relationship, timeline = _load_chart_context(
        session, chart_id, current_user, on_date
    )

    natal_moon_rasi = next(p.rasi for p in snapshot.data.planets if p.graha == "MOON")
    yogas_present = {y.name.upper() for y in snapshot.data.yogas if y.is_present}
    doshams_active = {
        d.name.upper() for d in snapshot.data.doshams if d.is_present and not d.is_cancelled
    }
    lords = sorted(active_dasha_lords)

    # Phase 2 — real timing evidence: each planet's current transiting house
    # from Lagna (gochara gate), the Sarvashtakavarga bindu count per rasi
    # (zero-bindu gate), and the currently-running antardasha's real dates.
    transit_house_by_planet = {
        graha: house_from_reference(snapshot.data.lagna.rasi, body.rasi)
        for graha, body in transit.bodies.items()
    }
    natal_rasi_map = {p.graha: p.rasi for p in snapshot.data.planets if p.graha != "MANDHI"}
    natal_rasi_map["LAGNA"] = snapshot.data.lagna.rasi
    sav_bindus = compute_sarvashtakavarga(compute_bhinnashtakavarga(natal_rasi_map))

    chart_input = build_chart_input(
        lagna_rasi=snapshot.data.lagna.rasi,
        planets=snapshot.data.planets,
        active_dasha_lords=active_dasha_lords,
        maha_lord=lords[0] if lords else "",
        antar_lord=lords[-1] if lords else "",
        yogas_present=yogas_present,
        doshams_active=doshams_active,
        age=age,
        natal_moon_rasi=natal_moon_rasi,
        transit_saturn_rasi=transit.bodies["SATURN"].rasi,
        vargas=snapshot.data.vargas,
        transit_house_by_planet=transit_house_by_planet,
        sav_bindus=sav_bindus,
        current_antardasha_start=timeline.current_antardasha.start_date,
        current_antardasha_end=timeline.current_antardasha.end_date,
    )

    # P1-2 (D11 hard gate): minors and viewers who've opted into reduced
    # sensitive content get the WELLBEING/CAUTION cards hard-suppressed
    # rather than merely soft-deferred (see propensity_service._is_sensitive_card).
    context_row = get_context_row(session, current_user.user_id, chart_id)
    prefers_reduced_sensitive_content = bool(
        (context_row.life_situation or {}).get("prefers_reduced_sensitive_content", False)
        if context_row is not None
        else False
    )

    bundle = assess_propensities(
        chart_input,
        relationship_to_owner=relationship,
        life_stage=life_stage,
        as_of=on_date,
        is_minor=is_minor_age(age),
        prefers_reduced_sensitive_content=prefers_reduced_sensitive_content,
        marital_status=marital_status,
        employment_type=employment_type,
    )

    return PropensityBundleOut(
        generatedFor=bundle.generated_for,
        lifeStage=bundle.life_stage,
        results=[
            PropensityCardOut(
                key=r.key,
                category=r.category.value,
                tier=r.tier.value,
                title=BiTextOut(ta=r.title.ta, en=r.title.en),
                level=r.level,
                summary=BiTextOut(ta=r.summary.ta, en=r.summary.en),
                factors=[
                    AstroFactorOut(key=f.key, status=f.status, detail=BiTextOut(ta=f.detail.ta, en=f.detail.en))
                    for f in r.factors
                ],
                whatHelps=[BiTextOut(ta=h.ta, en=h.en) for h in r.what_helps],
                windowNote=_bi(r.window_note),
                timingWindowStart=r.timing_window_start,
                timingWindowEnd=r.timing_window_end,
                disclaimer=_bi(r.disclaimer),
                showSupportResources=r.show_support_resources,
                deferred=r.deferred,
                deferredReason=_bi(r.deferred_reason),
                band=r.band,
            )
            for r in bundle.results
        ],
    )
