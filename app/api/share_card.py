from __future__ import annotations

from datetime import UTC, date, datetime
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.core.chart_access import assert_chart_owner
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
    # The SECOND router found with an authenticated-but-unused user, and it was
    # found by auditing the rest after `muhurta.py` — `generate_card_data` takes
    # no owner argument at all, so a signed-in user with any chart UUID could
    # read that chart's daily score, best windows and placements. Two independent
    # instances is the argument for `app.core.chart_access` existing: the failure
    # is not a bad copy of the rule, it is a router that never got one.
    assert_chart_owner(session, chart_id, current_user)
    resolved_date = on_date or datetime.now(UTC).date()
    return generate_card_data(session, chart_id, card_type, resolved_date)
