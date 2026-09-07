from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.core.chart_access import assert_chart_owner
from app.db.session import get_db
from app.models.user import User
from app.schemas.panchangam import (
    PanchangamDailyQuery,
    PanchangamDailyResponse,
    PanchangamMonthlyQuery,
    PanchangamMonthlyResponse,
    PanchangamTimingsResponse,
    TamilMonthsResponse,
)
from app.services.panchangam_service import (
    DEFAULT_TAMIL_MONTH_COUNT,
    MAX_TAMIL_MONTH_COUNT,
    build_monthly_panchangam,
    build_tamil_months,
    calculate_panchangam,
    calculate_panchangam_timings,
)

router = APIRouter()


@router.get("/panchangam/daily", response_model=PanchangamDailyResponse, tags=["panchangam"])
def get_daily_panchangam(
    query: PanchangamDailyQuery = Depends(),
    session: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> PanchangamDailyResponse:
    return calculate_panchangam(query, session)


@router.get("/panchangam/timings", response_model=PanchangamTimingsResponse, tags=["panchangam"])
def get_panchangam_timings(
    query: PanchangamDailyQuery = Depends(),
    session: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> PanchangamTimingsResponse:
    return calculate_panchangam_timings(query, session)


@router.get("/panchangam/monthly", response_model=PanchangamMonthlyResponse, tags=["panchangam"])
def get_monthly_panchangam(
    query: PanchangamMonthlyQuery = Depends(),
    session: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> PanchangamMonthlyResponse:
    return build_monthly_panchangam(query, session)


@router.get("/panchangam/tamil-months", response_model=TamilMonthsResponse, tags=["panchangam"])
def get_tamil_months(
    date_from: date = Query(alias="dateFrom", description="First civil date the month list must cover"),
    count: int = Query(default=DEFAULT_TAMIL_MONTH_COUNT, ge=1, le=MAX_TAMIL_MONTH_COUNT),
    chart_id: UUID | None = Query(default=None, alias="chartId"),
    lat: float | None = Query(default=None, ge=-90, le=90),
    lng: float | None = Query(default=None, ge=-180, le=180),
    timezone: str | None = Query(default=None, min_length=1, max_length=64),
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TamilMonthsResponse:
    """Tamil solar months with their civil start/end dates.

    Exists so a client can offer "search a Tamil month" without approximating
    the boundary. The web calendar's own month-start table is already a day off
    the engine for three months of 2026 and is kept private for exactly that
    reason; this route is the supported way to get the real answer.

    `chartId` is optional and, when given, is ownership-checked: the location it
    resolves is a placement of that chart's profile, not a public fact.
    """
    if chart_id is not None:
        assert_chart_owner(session, chart_id, current_user)
    return build_tamil_months(
        session,
        start=date_from,
        count=count,
        chart_id=chart_id,
        lat=lat,
        lng=lng,
        timezone_name=timezone,
    )
