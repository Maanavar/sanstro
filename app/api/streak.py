from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.streak import StreakPingRequest, StreakResponse
from app.services.streak_service import get_streak, record_ping

router = APIRouter()


@router.get("/streak", response_model=StreakResponse, tags=["streak"])
def read_streak(
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> StreakResponse:
    return get_streak(session, current_user.user_id)


@router.post("/streak/ping", response_model=StreakResponse, tags=["streak"])
def ping_streak(
    payload: StreakPingRequest | None = None,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> StreakResponse:
    local_days = payload.local_days if payload is not None else None
    return record_ping(session, current_user.user_id, local_days=local_days)
