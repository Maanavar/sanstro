from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.panchangam import PanchangamDailyQuery, PanchangamDailyResponse, PanchangamTimingsResponse
from app.services.panchangam_service import calculate_panchangam, calculate_panchangam_timings

router = APIRouter()


@router.get("/panchangam/daily", response_model=PanchangamDailyResponse, tags=["panchangam"])
def get_daily_panchangam(
    query: PanchangamDailyQuery = Depends(),
    _: User = Depends(get_current_user),
) -> PanchangamDailyResponse:
    return calculate_panchangam(query)


@router.get("/panchangam/timings", response_model=PanchangamTimingsResponse, tags=["panchangam"])
def get_panchangam_timings(
    query: PanchangamDailyQuery = Depends(),
    _: User = Depends(get_current_user),
) -> PanchangamTimingsResponse:
    return calculate_panchangam_timings(query)
