from __future__ import annotations

from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.life_events import LifeEventsResponse
from app.services.life_event_service import get_life_event_windows

router = APIRouter()


@router.get("/charts/{chart_id}/life-events", response_model=LifeEventsResponse, tags=["life-events"])
def get_chart_life_events(
    chart_id: UUID,
    as_of: date = Query(default=None, alias="asOf"),
    years_ahead: int = Query(default=5, alias="yearsAhead", ge=1, le=10),
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> LifeEventsResponse:
    on_date = as_of or date.today()
    return get_life_event_windows(
        session,
        chart_id,
        on_date,
        years_ahead,
        owner_user_id=current_user.user_id,
    )
