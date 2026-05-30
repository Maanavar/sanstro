from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.ask_vinaadi import AskVinaadiQuery, AskVinaadiResponse
from app.services.ask_vinaadi_service import answer_question

router = APIRouter()


@router.post("/charts/{chart_id}/ask", response_model=AskVinaadiResponse, tags=["ask-vinaadi"])
def ask_vinaadi(
    chart_id: UUID,
    payload: AskVinaadiQuery,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AskVinaadiResponse:
    return answer_question(
        session,
        chart_id,
        payload.question,
        owner_user_id=current_user.user_id,
    )
