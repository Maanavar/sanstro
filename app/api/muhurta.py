from __future__ import annotations

from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.core.chart_access import assert_chart_owner
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
    current_user: User = Depends(get_current_user),
) -> MuhurtaResponse:
    # `current_user` was `_current_user` — authenticated, deliberately unused,
    # and `find_best_muhurta_slots` takes no `user_id`, so nothing downstream
    # re-checked. Any signed-in user with a chart UUID could read this. See
    # `app.core.chart_access` for why a rule kept in six copies grows a seventh
    # hole rather than a seventh copy.
    assert_chart_owner(session, chart_id, current_user)
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
    current_user: User = Depends(get_current_user),
) -> MuhurthamNaalMatchResponse:
    """Curated almanac muhurtham naals ranked for this chart.

    Uses Tara Bala (9-fold star strength from the chart's birth star) plus
    Chandrashtama avoidance to surface the best wedding dates from the
    published list for the given year.

    The response is derived from the chart's birth star, so it discloses a
    placement — the ownership check is not a formality here.
    """
    assert_chart_owner(session, chart_id, current_user)
    matches, context = match_muhurtham_naals(
        chart_id, year, session, recommended_only=recommended_only,
    )
    return MuhurthamNaalMatchResponse(
        year=year,
        chart_id=str(chart_id),
        context=context_from_dict(context),
        matches=[item_from_match(m) for m in matches],
    )
