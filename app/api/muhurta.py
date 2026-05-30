from __future__ import annotations

from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.muhurta import MuhurtaResponse
from app.services.muhurta_service import find_best_muhurta_slots

router = APIRouter()


@router.get("/charts/{chart_id}/muhurta", response_model=MuhurtaResponse, tags=["muhurta"])
def get_muhurta(
    chart_id: UUID,
    activity: str = Query(description="JOB_START | MARRIAGE | EXAM | TRAVEL | INVESTMENT | MEDICAL | PURCHASE"),
    date_from: date = Query(alias="dateFrom"),
    date_to: date = Query(alias="dateTo"),
    session: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
) -> MuhurtaResponse:
    return find_best_muhurta_slots(chart_id, activity, date_from, date_to, session)
