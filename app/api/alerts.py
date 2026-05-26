from __future__ import annotations

from datetime import UTC, date, datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.ambient_alerts import AmbientAlertsResponse
from app.services.ambient_alerts_service import list_ambient_alerts

router = APIRouter()


@router.get("/alerts/ambient", response_model=AmbientAlertsResponse, tags=["alerts"])
def ambient_alerts(
    as_of_date: date | None = Query(default=None, alias="asOfDate"),
    min_significance: int = Query(default=70, alias="minSignificance", ge=0, le=100),
    unread_only: bool = Query(default=True, alias="unreadOnly"),
    limit: int = Query(default=20, ge=1, le=100),
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AmbientAlertsResponse:
    effective_date = as_of_date or datetime.now(tz=UTC).date()
    return list_ambient_alerts(
        session,
        current_user.user_id,
        as_of_date=effective_date,
        min_significance=min_significance,
        unread_only=unread_only,
        limit=limit,
    )
