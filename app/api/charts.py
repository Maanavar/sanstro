from __future__ import annotations

from datetime import UTC, date, datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.calculations.astro import RASI_NAMES, resolve_rasi
from app.calculations.event_windows import ChartData, EventType, find_event_windows
from app.calculations.jaimini_dasha import calculate_chara_dasha, current_chara_dasha
from app.calculations.jaimini_karakas import compute_char_karakas, compute_karakamsa
from app.calculations.tajaka import calculate_tajaka_chart
from app.core.age_gate import is_married_settled, is_minor, is_past_prime_marriage_age
from app.core.auth import get_current_user
from app.db.session import get_db
from app.models import BirthProfile, Chart
from app.models.chart_planet import ChartPlanet
from app.models.family_member import FamilyMember
from app.models.user import User
from app.schemas.chart_explanation import ChartExplanationResponse
from app.schemas.charts import (
    ChartCalculateRequest,
    ChartCalculateResponse,
    ChartSummaryResponse,
    EventWindowItem,
    EventWindowsData,
    EventWindowsResponse,
    JadhagamReportResponse,
    ResponseMeta,
)
from app.schemas.dashboard_bundle import ChartDashboardBundleResponse
from app.schemas.dasha import DashaTimelineResponse
from app.services.chart_explanation_service import build_chart_explanation
from app.services.dashboard_bundle_service import get_chart_dashboard_bundle
from app.services.chart_service import (
    calculate_chart as calculate_chart_snapshot,
)
from app.services.chart_service import (
    get_chart_summary,
    get_jadhagam_report,
    load_persisted_chart_response,
)
from app.services.dasha_service import get_chart_dasha
from app.services.pdf_export_service import generate_chart_pdf
from app.services.shadbala_service import build_shadbala_response
from app.services.tajaka_service import get_varshaphala
from app.services.ashtottari_dasha_service import build_ashtottari_dasha_response
from app.services.yogini_dasha_service import build_yogini_dasha_response
from app.services.kalachakra_dasha_service import build_kalachakra_dasha_response
from app.services.conditional_dashas_service import build_conditional_dashas_response

router = APIRouter()


def _assert_chart_owner(session: Session, chart_id: UUID, current_user: User) -> Chart:
    chart = session.get(Chart, chart_id)
    if chart is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chart not found.")
    profile = session.get(BirthProfile, chart.birth_profile_id)
    if profile is None or profile.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Birth profile not found.")
    if profile.owner_user_id != current_user.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
    return chart


def _load_chart_and_profile(session: Session, owner_user_id: UUID, chart_id: UUID) -> tuple[Chart | None, BirthProfile | None]:
    chart = session.get(Chart, chart_id)
    if chart is None:
        return None, None
    profile = session.get(BirthProfile, chart.birth_profile_id)
    if profile is None or profile.deleted_at is not None or profile.owner_user_id != owner_user_id:
        return None, None
    return chart, profile


@router.post("/charts/calculate", response_model=ChartCalculateResponse, tags=["charts"])
def calculate_chart(
    payload: ChartCalculateRequest,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ChartCalculateResponse:
    # Verify the birth profile belongs to the current user
    profile = session.get(BirthProfile, payload.birth_profile_id)
    if profile is None or profile.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Birth profile not found.")
    if profile.owner_user_id != current_user.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
    return calculate_chart_snapshot(payload, session)


@router.get("/charts/{chart_id}", response_model=ChartCalculateResponse, tags=["charts"])
def get_chart(
    chart_id: UUID,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ChartCalculateResponse:
    _assert_chart_owner(session, chart_id, current_user)
    return load_persisted_chart_response(session, chart_id)


@router.get("/charts/{chart_id}/dasha", response_model=DashaTimelineResponse, tags=["charts"])
def get_dasha(
    chart_id: UUID,
    as_of: date | None = Query(default=None, alias="asOf"),
    level: str = Query(default="pratyantar"),
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DashaTimelineResponse:
    _assert_chart_owner(session, chart_id, current_user)
    if as_of is None:
        as_of = date.today()
    return get_chart_dasha(session, chart_id, as_of, level=level)


@router.get(
    "/charts/{chart_id}/dashboard-bundle",
    response_model=ChartDashboardBundleResponse,
    tags=["charts"],
    summary="Everything the dashboard needs for one chart+date in a single response (DASH-04)",
)
def get_dashboard_bundle(
    chart_id: UUID,
    date_value: date | None = Query(default=None, alias="date"),
    language: str = Query(default="ta-en"),
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ChartDashboardBundleResponse:
    _assert_chart_owner(session, chart_id, current_user)
    return get_chart_dashboard_bundle(
        session,
        chart_id,
        date_value or date.today(),
        owner_user_id=current_user.user_id,
        language=language,
    )


@router.get("/charts/{chart_id}/summary", response_model=ChartSummaryResponse, tags=["charts"])
def get_summary(
    chart_id: UUID,
    language: str = Query(default="ta-en"),
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ChartSummaryResponse:
    _assert_chart_owner(session, chart_id, current_user)
    return get_chart_summary(session, chart_id, language=language)


@router.get("/charts/{chart_id}/jadhagam-report", response_model=JadhagamReportResponse, tags=["charts"])
def get_report(
    chart_id: UUID,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> JadhagamReportResponse:
    _assert_chart_owner(session, chart_id, current_user)
    return get_jadhagam_report(session, chart_id)


@router.get("/charts/{chart_id}/explanation", response_model=ChartExplanationResponse, tags=["charts"])
def get_explanation(
    chart_id: UUID,
    as_of: date | None = Query(default=None, alias="asOf"),
    peyarchi_window_days: int = Query(default=700, alias="peyarchiWindowDays", ge=1, le=1200),
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ChartExplanationResponse:
    _assert_chart_owner(session, chart_id, current_user)
    return build_chart_explanation(
        session,
        chart_id,
        as_of=as_of or date.today(),
        peyarchi_window_days=peyarchi_window_days,
    )


@router.get("/charts/{chart_id}/event-windows", response_model=EventWindowsResponse, tags=["charts"])
def get_event_windows(
    chart_id: UUID,
    event: EventType = Query(description="Event type: MARRIAGE, CAREER, or FINANCE"),
    from_year: int = Query(alias="fromYear", ge=2020, le=2060),
    to_year: int = Query(alias="toYear", ge=2020, le=2060),
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> EventWindowsResponse:
    chart = _assert_chart_owner(session, chart_id, current_user)

    if from_year > to_year:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="fromYear must be <= toYear.")
    if to_year - from_year > 20:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="Range must not exceed 20 years.")

    # Marriage-timing windows are subject to the same age/relationship gating
    # as every other marriage surface (predictions.py, life_events.py) — this
    # endpoint previously had none.
    age_gated = False
    alternative_framing: str | None = None
    hard_blocked = False
    if event == "MARRIAGE":
        profile = session.get(BirthProfile, chart.birth_profile_id)
        birth_age = date.today().year - profile.birth_date_local.year - (
            (date.today().month, date.today().day) < (profile.birth_date_local.month, profile.birth_date_local.day)
        )
        relationship_to_owner = "self"
        if profile.family_member_id is not None:
            member = session.get(FamilyMember, profile.family_member_id)
            if member is not None:
                relationship_to_owner = member.relationship_to_owner or "self"

        is_parental = relationship_to_owner in {"parent", "grandparent"}
        if is_minor(profile.birth_date_local) or is_past_prime_marriage_age(birth_age) or is_parental:
            hard_blocked = True
            age_gated = True
        elif is_married_settled(profile.marital_status):
            age_gated = True
            alternative_framing = "RELATIONSHIP_HARMONY"

    if hard_blocked:
        return EventWindowsResponse(
            data=EventWindowsData(
                chart_id=chart_id,
                event=event,
                from_year=from_year,
                to_year=to_year,
                windows=[],
                age_gated=age_gated,
                alternative_framing=alternative_framing,
            ),
            meta=ResponseMeta(
                calculation_version="event-windows-v1.0-2026",
                generated_at=datetime.now(tz=UTC),
            ),
        )

    moon_row = session.execute(
        select(ChartPlanet).where(
            ChartPlanet.chart_id == chart_id,
            ChartPlanet.graha == "MOON",
        )
    ).scalar_one_or_none()
    if moon_row is None:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="Chart is missing Moon position.")

    lagna_rasi = resolve_rasi(chart.lagna_rasi)
    chart_data = ChartData(
        lagna_rasi=lagna_rasi,
        moon_longitude=float(moon_row.absolute_longitude),
        birth_jd=float(chart.julian_day),
    )

    windows = find_event_windows(chart_data, event, from_year, to_year)

    items = [
        EventWindowItem(
            event=w.event,
            start_date=w.start_date,
            end_date=w.end_date,
            score=w.score,
            reasons=w.reasons,
        )
        for w in windows
    ]

    return EventWindowsResponse(
        data=EventWindowsData(
            chart_id=chart_id,
            event=event,
            from_year=from_year,
            to_year=to_year,
            windows=items,
            age_gated=age_gated,
            alternative_framing=alternative_framing,
        ),
        meta=ResponseMeta(
            calculation_version="event-windows-v1.0-2026",
            generated_at=datetime.now(tz=UTC),
        ),
    )


@router.get(
    "/charts/{chart_id}/export/pdf",
    tags=["charts"],
    summary="Download a PDF snapshot of the chart, dasha, and daily guidance",
    response_class=Response,
)
def export_chart_pdf(
    chart_id: UUID,
    as_of: date = Query(default=None, alias="asOf"),
    lang: str = Query(default="en", pattern="^(en|ta)$"),
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    _assert_chart_owner(session, chart_id, current_user)
    report_date = as_of or datetime.now(tz=UTC).date()
    pdf_bytes = generate_chart_pdf(session, chart_id, report_date, lang=lang)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="jadhagam-{chart_id}.pdf"'},
    )


@router.get("/charts/{chart_id}/chara-dasha", tags=["charts"])
def get_chara_dasha(
    chart_id: UUID,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    chart, birth_profile = _load_chart_and_profile(session, current_user.user_id, chart_id)
    if chart is None or birth_profile is None:
        raise HTTPException(status_code=404, detail="Chart not found.")

    planets = session.execute(select(ChartPlanet).where(ChartPlanet.chart_id == chart_id)).scalars().all()
    planet_rasi_map = {p.graha: resolve_rasi(p.rasi) for p in planets if p.rasi}
    lagna_rasi = resolve_rasi(chart.lagna_rasi)
    birth_date = birth_profile.birth_date_local

    periods = calculate_chara_dasha(lagna_rasi, planet_rasi_map, birth_date)
    current = current_chara_dasha(lagna_rasi, planet_rasi_map, birth_date)

    # Jaimini Chara Karakas + Karakamsa (BPHS Ch. 32) — see jaimini_karakas.py for
    # the documented Rahu/tie-break conventions. Naturally pairs with Chara Dasha.
    planet_longitudes = {p.graha: float(p.absolute_longitude) for p in planets}
    d9_rasi_map = {p.graha: resolve_rasi(p.d9_rasi) for p in planets if p.d9_rasi}
    char_karakas = compute_char_karakas(planet_longitudes)
    atmakaraka = char_karakas.get("ATMAKARAKA")
    karakamsa_rasi = compute_karakamsa(atmakaraka, d9_rasi_map) if atmakaraka and atmakaraka in d9_rasi_map else None

    return {
        "success": True,
        "data": {
            "chartId": str(chart_id),
            "lagnaRasi": lagna_rasi,
            "currentPeriod": current,
            "periods": periods,
            "charKarakas": char_karakas,
            "atmakaraka": atmakaraka,
            "karakamsaRasi": karakamsa_rasi,
            "karakamsaRasiName": RASI_NAMES.get(karakamsa_rasi) if karakamsa_rasi else None,
        },
    }


@router.get("/charts/{chart_id}/yogini-dasha", tags=["charts"])
def get_yogini_dasha(
    chart_id: UUID,
    as_of: date | None = Query(default=None, alias="asOf"),
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Yogini Dasha — 36-year secondary/comparison dasha (BPHS-adjacent,
    Devi Bhagavata/Muhurta Chintamani tradition). See yogini_dasha.py for
    the cited starting-offset convention. Advanced/additive, not a
    replacement for the primary Vimshottari timeline."""
    _assert_chart_owner(session, chart_id, current_user)
    try:
        data = build_yogini_dasha_response(session, chart_id, as_of)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return {"success": True, "data": data}


@router.get("/charts/{chart_id}/ashtottari-dasha", tags=["charts"])
def get_ashtottari_dasha(
    chart_id: UUID,
    as_of: date | None = Query(default=None, alias="asOf"),
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Ashtottari Dasha — 108-year secondary/comparison dasha (no Ketu, 8
    lords). See ashtottari_dasha.py for the cited Krittikadi nakshatra-lord
    convention and its documented uncertainty. Advanced/additive, display
    only — not a replacement for the primary Vimshottari timeline, and not
    used in any scoring path."""
    _assert_chart_owner(session, chart_id, current_user)
    try:
        data = build_ashtottari_dasha_response(session, chart_id, as_of)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return {"success": True, "data": data}


@router.get("/charts/{chart_id}/kalachakra-dasha", tags=["charts"])
def get_kalachakra_dasha(
    chart_id: UUID,
    as_of: date | None = Query(default=None, alias="asOf"),
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Kalachakra Dasha — rasi-based Navamsa-Nakshatra dasha, non-uniform
    period lengths (4-21 years). See kalachakra_dasha.py for the cited
    Saravali source (itself citing Parasara's Hora Shastra and Vaidhyanatha
    Dikshita's Jataka Parijata), the documented Portion-Zero cycle
    convention, and a discovered inconsistency in the source's own worked
    example. Experimental / display only — no independent second-source
    cross-check has been done yet, not used in any scoring path."""
    _assert_chart_owner(session, chart_id, current_user)
    try:
        data = build_kalachakra_dasha_response(session, chart_id, as_of)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return {"success": True, "data": data}


@router.get("/charts/{chart_id}/conditional-dashas", tags=["charts"])
def get_conditional_dashas(
    chart_id: UUID,
    as_of: date | None = Query(default=None, alias="asOf"),
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Conditional nakshatra dashas — the seven Parashari *conditional* udu
    dashas (Shodashottari 116y, Dwadashottari 112y, Panchottari 105y,
    Shatabdika 100y, Chaturashiti-sama 84y, Dwisaptati-sama 72y, Shashtihayani
    60y), each a Vimshottari variant selected classically by a birth condition,
    plus an INFORMATIONAL applicability report. Tables anchored to a single
    cited source (satyori/Santhanam BPHS); see conditional_dashas.py for the
    documented single-source posture and the divergences logged for the
    astrologer pass. Advanced/additive, display only — not used in any scoring
    path, and the applicability report never auto-hides a system."""
    _assert_chart_owner(session, chart_id, current_user)
    try:
        data = build_conditional_dashas_response(session, chart_id, as_of)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return {"success": True, "data": data}


@router.get("/charts/{chart_id}/solar-return", tags=["charts"])
def get_solar_return(
    chart_id: UUID,
    year: int | None = Query(default=None, description="Return year. Defaults to current year."),
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    chart, birth_profile = _load_chart_and_profile(session, current_user.user_id, chart_id)
    if chart is None or birth_profile is None:
        raise HTTPException(status_code=404, detail="Chart not found.")

    return_year = year or date.today().year
    birth_year = birth_profile.birth_date_local.year

    sun_row = session.execute(
        select(ChartPlanet).where(
            ChartPlanet.chart_id == chart_id,
            ChartPlanet.graha == "SUN",
        )
    ).scalar_one_or_none()
    if sun_row is None:
        raise HTTPException(status_code=422, detail="Chart has no Sun position stored.")

    natal_sun_lon = float(sun_row.absolute_longitude)
    natal_lagna_rasi = resolve_rasi(chart.lagna_rasi)

    result = calculate_tajaka_chart(
        natal_sun_longitude=natal_sun_lon,
        natal_lagna_rasi=natal_lagna_rasi,
        birth_year=birth_year,
        return_year=return_year,
        birth_latitude=float(birth_profile.birth_latitude),
        birth_longitude=float(birth_profile.birth_longitude),
        ayanamsa_type="LAHIRI",
    )

    return {
        "success": True,
        "data": {
            "chartId": str(chart_id),
            "returnYear": result["return_year"],
            "srLagnaRasi": result["sr_lagna_rasi"],
            "srLagnaRasiName": result["sr_lagna_rasi_name"],
            "munthaRasi": result["muntha_rasi"],
            "munthaRasiName": result["muntha_rasi_name"],
            "lagnaMatchesNatal": result["lagna_matches_natal"],
            "sunLongAtReturn": round(result["sun_longitude_at_return"], 4),
            "itthasalaPairs": result.get("itthasala_pairs", []),
            "isarafaPairs": result.get("isarafa_pairs", []),
        },
    }


@router.get("/charts/{chart_id}/varshaphala", tags=["charts"])
def get_varshaphala_endpoint(
    chart_id: UUID,
    year: int = Query(..., ge=1900, le=2100),
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _assert_chart_owner(session, chart_id, current_user)
    try:
        response = get_varshaphala(session, chart_id, year)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return response.model_dump(mode="json", by_alias=True)


@router.get("/charts/{chart_id}/shadbala", tags=["charts"])
def get_shadbala(
    chart_id: UUID,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Full classical six-component Shadbala (Rupas) — advanced/experimental,
    additive to the product strength score. See shadbala_service."""
    _assert_chart_owner(session, chart_id, current_user)
    try:
        data = build_shadbala_response(session, chart_id)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return {"success": True, "data": data}


