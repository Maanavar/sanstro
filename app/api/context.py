from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.context import ContextResponse, ContextUpsertRequest
from app.services.context_service import get_context, upsert_context

router = APIRouter()


@router.post("/context", response_model=ContextResponse, tags=["context"])
def upsert_user_context(
    payload: ContextUpsertRequest,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ContextResponse:
    return upsert_context(
        session,
        current_user.user_id,
        payload.chart_id,
        life_situation=payload.life_situation,
        active_events=[item.model_dump(mode="json") for item in (payload.active_events or [])],
        reaction_history=[item.model_dump(mode="json", by_alias=True) for item in (payload.reaction_history or [])],
    )


@router.get("/context", response_model=ContextResponse, tags=["context"])
def get_user_context(
    chart_id: UUID = Query(alias="chartId"),
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ContextResponse:
    return get_context(session, current_user.user_id, chart_id)

