from __future__ import annotations

from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.session import get_db
from app.models import BirthProfile, Chart
from app.models.user import User
from app.schemas.daily_guidance import (
    ActivityTimingResponse,
    DailyGuidanceRangeResponse,
    DailyGuidanceResponse,
    DashaStoryResponse,
    JournalCorrelationResponse,
    PeyarchiReportResponse,
    WeekAheadResponse,
)
from app.services.daily_guidance_service import (
    get_activity_timing,
    get_daily_guidance,
    get_daily_guidance_range,
    get_dasha_story,
    get_journal_correlations,
    get_peyarchi_report,
    get_week_ahead,
    get_week_ahead_by_chart,
)

router = APIRouter()


def _assert_chart_owner(session: Session, chart_id: UUID, current_user: User) -> None:
    chart = session.get(Chart, chart_id)
    if chart is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chart not found.")
    profile = session.get(BirthProfile, chart.birth_profile_id)
    if profile is None or profile.owner_user_id != current_user.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")


def _assert_profile_owner(session: Session, profile_id: UUID, current_user: User) -> None:
    profile = session.get(BirthProfile, profile_id)
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Birth profile not found.")
    if profile.owner_user_id != current_user.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")


@router.get("/charts/{chart_id}/daily-guidance", response_model=DailyGuidanceResponse, tags=["daily-guidance"])
def daily_guidance(
    chart_id: UUID,
    date: date = Query(..., alias="date"),
    language: str = Query(default="ta-en", alias="language"),
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DailyGuidanceResponse:
    _assert_chart_owner(session, chart_id, current_user)
    return get_daily_guidance(session, chart_id, date, language)


@router.get("/daily-guidance/week-ahead", response_model=WeekAheadResponse, tags=["daily-guidance"])
def week_ahead(
    profile_id: UUID = Query(alias="profileId"),
    week_start: date = Query(alias="weekStart"),
    language: str = Query(default="ta-en", alias="language"),
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> WeekAheadResponse:
    _assert_profile_owner(session, profile_id, current_user)
    return get_week_ahead(session, profile_id, week_start, language)


@router.get("/charts/{chart_id}/week-ahead", response_model=WeekAheadResponse, tags=["daily-guidance"])
def week_ahead_by_chart(
    chart_id: UUID,
    week_start: date = Query(alias="weekStart"),
    language: str = Query(default="ta-en", alias="language"),
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> WeekAheadResponse:
    _assert_chart_owner(session, chart_id, current_user)
    return get_week_ahead_by_chart(session, chart_id, week_start, language)


@router.get("/daily-guidance/range", response_model=DailyGuidanceRangeResponse, tags=["daily-guidance"])
def daily_guidance_range(
    profile_id: UUID = Query(alias="profileId"),
    from_date: date = Query(alias="from"),
    to_date: date = Query(alias="to"),
    language: str = Query(default="ta-en", alias="language"),
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DailyGuidanceRangeResponse:
    _assert_profile_owner(session, profile_id, current_user)
    return get_daily_guidance_range(session, profile_id, from_date, to_date, language)


@router.get("/activity-timing", response_model=ActivityTimingResponse, tags=["daily-guidance"])
def activity_timing(
    chart_id: UUID = Query(alias="chartId"),
    activity: str = Query(alias="activity"),
    month: str = Query(alias="month", description="Format: YYYY-MM"),
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ActivityTimingResponse:
    _assert_chart_owner(session, chart_id, current_user)
    return get_activity_timing(session, chart_id, activity, month)


@router.get("/charts/{chart_id}/dasha/timeline", response_model=DashaStoryResponse, tags=["daily-guidance"])
def dasha_story_timeline(
    chart_id: UUID,
    as_of: date = Query(alias="asOf"),
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DashaStoryResponse:
    _assert_chart_owner(session, chart_id, current_user)
    return get_dasha_story(session, chart_id, as_of)


@router.get("/transits/peyarchi-report/{chart_id}", response_model=PeyarchiReportResponse, tags=["daily-guidance"])
def peyarchi_report(
    chart_id: UUID,
    planet: str = Query(alias="planet"),
    as_of: date = Query(alias="asOf"),
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PeyarchiReportResponse:
    _assert_chart_owner(session, chart_id, current_user)
    return get_peyarchi_report(session, chart_id, planet, as_of)


@router.get("/journal/{chart_id}/correlations", response_model=JournalCorrelationResponse, tags=["daily-guidance"])
def journal_correlations(
    chart_id: UUID,
    lookback_days: int = Query(default=90, alias="lookbackDays", ge=30, le=365),
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> JournalCorrelationResponse:
    _assert_chart_owner(session, chart_id, current_user)
    return get_journal_correlations(session, chart_id, lookback_days)
