from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.decisions import DecisionBriefRequest, DecisionBriefResponse
from app.services.decisions_service import build_decision_brief

router = APIRouter()


@router.post("/decisions/brief", response_model=DecisionBriefResponse, tags=["decisions"])
def decision_brief(
    payload: DecisionBriefRequest,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DecisionBriefResponse:
    return build_decision_brief(
        session,
        owner_user_id=current_user.user_id,
        chart_id=payload.chart_id,
        option_a=payload.option_a,
        option_b=payload.option_b,
        priority=payload.priority,
        target_date=payload.target_date,
    )
