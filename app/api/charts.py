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
)
from app.schemas.dasha import DashaTimelineResponse, ResponseMeta
from app.services.chart_service import calculate_chart as calculate_chart_snapshot, get_chart_summary, get_jadhagam_report
from app.services.dasha_service import get_chart_dasha
from app.services.pdf_export_service import generate_chart_pdf

router = APIRouter()


def _assert_chart_owner(session: Session, chart_id: UUID, current_user: User) -> Chart:
    chart = session.get(Chart, chart_id)
    if chart is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chart not found.")
    profile = session.get(BirthProfile, chart.birth_profile_id)
    if profile is None or profile.owner_user_id != current_user.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
    return chart


@router.post("/charts/calculate", response_model=ChartCalculateResponse, tags=["charts"])
def calculate_chart(
    payload: ChartCalculateRequest,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ChartCalculateResponse:
    # Verify the birth profile belongs to the current user
    profile = session.get(BirthProfile, payload.birth_profile_id)
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Birth profile not found.")
    if profile.owner_user_id != current_user.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
    return calculate_chart_snapshot(payload, session)


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
