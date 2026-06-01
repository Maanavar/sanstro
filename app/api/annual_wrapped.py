from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.annual_wrapped import AnnualWrappedResponse
from app.services.annual_wrapped_service import compute_annual_wrapped

router = APIRouter()


@router.get("/charts/{chart_id}/annual-wrapped", response_model=AnnualWrappedResponse, tags=["wrapped"])
def get_annual_wrapped(
    chart_id: UUID,
    year: int | None = Query(default=None),
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AnnualWrappedResponse:
    resolved_year = year or datetime.now(UTC).year
    return compute_annual_wrapped(session, chart_id, current_user.user_id, resolved_year)
