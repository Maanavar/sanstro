from __future__ import annotations

from datetime import date
from uuid import UUID

from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.session import get_db
from app.models import BirthProfile, Chart
from app.models.user import User
from app.calculations.astro import NAKSHATRA_NAME_TO_NUMBER, resolve_rasi
from app.calculations.jaimini_dasha import calculate_chara_dasha, current_chara_dasha
from app.calculations.tajaka import calculate_tajaka_chart
from app.calculations.event_windows import ChartData, EventType, find_event_windows
from app.models.chart_planet import ChartPlanet
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
from app.schemas.chart_explanation import ChartExplanationResponse
from app.schemas.dasha import DashaTimelineResponse
from app.services.chart_service import (
    calculate_chart as calculate_chart_snapshot,
    get_chart_summary,
    get_jadhagam_report,
    load_persisted_chart_response,
)
from app.services.chart_explanation_service import build_chart_explanation
from app.services.dasha_service import get_chart_dasha
from app.services.pdf_export_service import generate_chart_pdf
from app.services.tajaka_service import get_varshaphala

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
    as_of: date = Query(alias="asOf"),
    level: str = Query(default="pratyantar"),
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DashaTimelineResponse:
    _assert_chart_owner(session, chart_id, current_user)
    return get_chart_dasha(session, chart_id, as_of, level=level)


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
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="fromYear must be <= toYear.")
    if to_year - from_year > 20:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Range must not exceed 20 years.")

    moon_row = session.execute(
        select(ChartPlanet).where(
            ChartPlanet.chart_id == chart_id,
            ChartPlanet.graha == "MOON",
        )
    ).scalar_one_or_none()
    if moon_row is None:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Chart is missing Moon position.")

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
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    _assert_chart_owner(session, chart_id, current_user)
    report_date = as_of or datetime.now(tz=UTC).date()
    pdf_bytes = generate_chart_pdf(session, chart_id, report_date)
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

    return {
        "success": True,
        "data": {
            "chartId": str(chart_id),
            "lagnaRasi": lagna_rasi,
            "currentPeriod": current,
            "periods": periods,
        },
    }


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
