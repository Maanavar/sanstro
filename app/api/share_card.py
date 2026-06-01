from __future__ import annotations

from datetime import UTC, datetime, date
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.share_card import ShareCardResponse
from app.services.share_card_service import generate_card_data

router = APIRouter()


@router.get("/charts/{chart_id}/share-card", response_model=ShareCardResponse, tags=["share"])
def get_share_card(
    chart_id: UUID,
    card_type: str = Query(alias="type", default="DAILY_VIBE"),
    on_date: date | None = Query(alias="date", default=None),
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ShareCardResponse:
    resolved_date = on_date or datetime.now(UTC).date()
    return generate_card_data(session, chart_id, card_type, resolved_date)
