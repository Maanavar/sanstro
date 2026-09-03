from __future__ import annotations

from datetime import date, datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.core.chart_access import assert_chart_owner as _assert_chart_owner
from app.db.session import get_db
from app.models.user import User
from app.schemas.peyarchi import PeyarchiSummaryResponse
from app.schemas.transits import SaniCycleResponse, TransitSnapshotResponse
from app.services.peyarchi_service import get_peyarchi_summary
from app.services.transit_service import get_gochar_current, get_sani_cycle

router = APIRouter()


@router.get("/charts/{chart_id}/gochar/current", response_model=TransitSnapshotResponse, tags=["transits"])
def gochar_current(
    chart_id: UUID,
    datetime_value: datetime | None = Query(default=None, alias="datetime"),
    date_value: date | None = Query(default=None, alias="date"),
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TransitSnapshotResponse:
    # Ownership BEFORE parameter validation, matching `sani_cycle` below. The
    # order was the other way round, so a non-owner probing this route got a
    # helpful 422 about the parameters instead of a 403 — not a data leak, but it
    # is the route telling somebody who may not read this chart how to ask again.
    _assert_chart_owner(session, chart_id, current_user)
    as_of = datetime_value if datetime_value is not None else date_value
    if as_of is None:
        raise HTTPException(status_code=422, detail="Either datetime or date must be provided.")
    return get_gochar_current(session, chart_id, as_of)


@router.get("/charts/{chart_id}/sani-cycle", response_model=SaniCycleResponse, tags=["transits"])
def sani_cycle(
    chart_id: UUID,
    date: date = Query(alias="date"),
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SaniCycleResponse:
    _assert_chart_owner(session, chart_id, current_user)
    return get_sani_cycle(session, chart_id, date)


@router.get(
    "/charts/{chart_id}/peyarchi",
    response_model=PeyarchiSummaryResponse,
    tags=["transits"],
    include_in_schema=False,
)
def peyarchi_summary(
    chart_id: UUID,
    as_of: date = Query(alias="as_of"),
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PeyarchiSummaryResponse:
    _assert_chart_owner(session, chart_id, current_user)
    return get_peyarchi_summary(session, chart_id, as_of=as_of)


@router.get("/charts/{chart_id}/peyarchi/upcoming", response_model=PeyarchiSummaryResponse, tags=["transits"])
def peyarchi_upcoming(
    chart_id: UUID,
    as_of: date = Query(alias="as_of"),
    window_days: int = Query(default=30, alias="window_days", ge=1, le=120),
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PeyarchiSummaryResponse:
    _assert_chart_owner(session, chart_id, current_user)
    return get_peyarchi_summary(session, chart_id, as_of=as_of, window_days=window_days)
