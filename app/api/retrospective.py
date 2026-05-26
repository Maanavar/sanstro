from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.retrospective import RetrospectiveListResponse, RetrospectiveRequest, RetrospectiveResponse
from app.services.retrospective_service import analyse_and_save_retrospective, list_retrospectives

router = APIRouter()


@router.post("/retrospective", response_model=RetrospectiveResponse, tags=["retrospective"])
def create_retrospective(
    payload: RetrospectiveRequest,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RetrospectiveResponse:
    return analyse_and_save_retrospective(
        session,
        current_user.user_id,
        chart_id=payload.chart_id,
        event_date=payload.event_date,
        event_description=payload.event_description,
        event_type=payload.event_type,
    )


@router.get("/retrospective", response_model=RetrospectiveListResponse, tags=["retrospective"])
def get_retrospectives(
    chart_id: UUID = Query(alias="chartId"),
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RetrospectiveListResponse:
    return list_retrospectives(session, current_user.user_id, chart_id)

