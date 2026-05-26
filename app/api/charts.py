from __future__ import annotations

from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.session import get_db
from app.models import BirthProfile, Chart
from app.models.user import User
from app.schemas.charts import ChartCalculateRequest, ChartCalculateResponse, ChartSummaryResponse, JadhagamReportResponse
from app.schemas.dasha import DashaTimelineResponse
from app.services.chart_service import calculate_chart as calculate_chart_snapshot, get_chart_summary, get_jadhagam_report
from app.services.dasha_service import get_chart_dasha

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
