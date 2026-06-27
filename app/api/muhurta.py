from __future__ import annotations

from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.muhurta import MuhurtaResponse
from app.schemas.muhurtham_naal import (
    MuhurthamNaalMatchResponse,
    context_from_dict,
    item_from_match,
)
from app.services.muhurta_service import find_best_muhurta_slots
from app.services.muhurtham_naal_service import match_muhurtham_naals

router = APIRouter()


@router.get("/charts/{chart_id}/muhurta", response_model=MuhurtaResponse, tags=["muhurta"])
def get_muhurta(
    chart_id: UUID,
    activity: str = Query(description="JOB_START | MARRIAGE | EXAM | TRAVEL | INVESTMENT | MEDICAL | PURCHASE | SPIRITUAL"),
    date_from: date = Query(alias="dateFrom"),
    date_to: date = Query(alias="dateTo"),
    session: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
) -> MuhurtaResponse:
    return find_best_muhurta_slots(chart_id, activity, date_from, date_to, session)


@router.get(
    "/charts/{chart_id}/muhurtham-naals",
    response_model=MuhurthamNaalMatchResponse,
    tags=["muhurta"],
)
def get_muhurtham_naals_for_chart(
    chart_id: UUID,
    year: int = Query(default=2027, description="Calendar year of the muhurtham sheet"),
    recommended_only: bool = Query(default=False, alias="recommendedOnly"),
    session: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
) -> MuhurthamNaalMatchResponse:
    """Curated almanac muhurtham naals ranked for this chart.

    Uses Tara Bala (9-fold star strength from the chart's birth star) plus
    Chandrashtama avoidance to surface the best wedding dates from the
    published list for the given year.
    """
    matches, context = match_muhurtham_naals(
        chart_id, year, session, recommended_only=recommended_only,
    )
    return MuhurthamNaalMatchResponse(
        year=year,
        chart_id=str(chart_id),
        context=context_from_dict(context),
        matches=[item_from_match(m) for m in matches],
    )
