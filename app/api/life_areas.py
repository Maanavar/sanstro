from __future__ import annotations

from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.life_areas import LifeAreasResponse
from app.services.life_areas_service import get_life_areas

router = APIRouter()


@router.get("/charts/{chart_id}/life-areas", response_model=LifeAreasResponse, tags=["life-areas"])
def get_chart_life_areas(
    chart_id: UUID,
    as_of: date = Query(default=None, alias="asOf"),
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> LifeAreasResponse:
    on_date = as_of or date.today()
    return get_life_areas(session, chart_id, on_date, owner_user_id=current_user.user_id)
