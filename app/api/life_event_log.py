from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.life_event_log import LifeEventLogCreate, LifeEventLogCreateResponse, LifeEventLogResponse
from app.services.life_event_log_service import get_life_event_log, log_life_event

router = APIRouter()


@router.get("/charts/{chart_id}/life-event-log", response_model=LifeEventLogResponse, tags=["life-event-log"])
def list_life_events(
    chart_id: UUID,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> LifeEventLogResponse:
    return get_life_event_log(session, chart_id, current_user.user_id)


@router.post("/charts/{chart_id}/life-event-log", response_model=LifeEventLogCreateResponse, tags=["life-event-log"])
def create_life_event(
    chart_id: UUID,
    payload: LifeEventLogCreate,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> LifeEventLogCreateResponse:
    return log_life_event(session, chart_id, payload, current_user.user_id)
