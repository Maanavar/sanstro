from __future__ import annotations

from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.session import get_db
from app.models import BirthProfile, Chart
from app.models.user import User
from app.schemas.daily_guidance import DailyGuidanceRangeResponse, DailyGuidanceResponse
from app.services.daily_guidance_service import get_daily_guidance, get_daily_guidance_range

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
    with session.begin():
        _assert_chart_owner(session, chart_id, current_user)
        return get_daily_guidance(session, chart_id, date, language)


@router.get("/daily-guidance/range", response_model=DailyGuidanceRangeResponse, tags=["daily-guidance"])
def daily_guidance_range(
    profile_id: UUID = Query(alias="profileId"),
    from_date: date = Query(alias="from"),
    to_date: date = Query(alias="to"),
    language: str = Query(default="ta-en", alias="language"),
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DailyGuidanceRangeResponse:
    with session.begin():
        _assert_profile_owner(session, profile_id, current_user)
        return get_daily_guidance_range(session, profile_id, from_date, to_date, language)
