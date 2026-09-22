from __future__ import annotations

from datetime import date
from typing import Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_user, get_optional_user
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

SubjectRole = Literal["BRIDE", "GROOM", "PERSON"]

# The partner of a couple, as a query parameter on every muhurta route that reads
# a saved chart. Query rather than path: it is an optional filter on an existing
# contract, and a path segment would have been a new route on four surfaces.
_PARTNER_QUERY = Query(
    default=None,
    alias="partnerChartId",
    description=(
        "A second saved chart, for a couple. Both charts are read and the weaker "
        "side governs each personal check. Must belong to the same user."
    ),
)
_ROLE_QUERY = Query(
    default="PERSON",
    alias="subjectRole",
    description=(
        "What the first chart is: BRIDE, GROOM, or PERSON when unstated. The "
        "partner takes the complement. Ch. XIV p.79's Jupiter rule is read from the "
        "bride's chart, so it only applies once a role is named."
    ),
)


def _roles(subject_role: SubjectRole, partner_chart_id: UUID | None) -> tuple[str | None, str | None]:
    """(role of the chart, role of the partner) — the same rule as the public tool.

    The partner's role is derived rather than sent: two fields that must disagree
    are two fields that will eventually agree.
    """
    primary = subject_role if subject_role in ("BRIDE", "GROOM") else None
    if partner_chart_id is None:
        return primary, None
    partner = {"BRIDE": "GROOM", "GROOM": "BRIDE"}.get(primary or "")
    return primary, partner


def _authorize_partner(
    session: Session, chart_id: UUID, partner_chart_id: UUID | None, current_user: User
) -> None:
    """The partner chart is read exactly as the first one is — by its owner only.

    Without this a couple request would be a way round the ownership guard: the
    partner's birth star and dasha surface in every factor sentence.
    """
    if partner_chart_id is None:
        return
    if partner_chart_id == chart_id:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="A couple is two different charts — choose the partner's chart, not this one.",
        )
    assert_chart_owner(session, partner_chart_id, current_user)


# §3 of docs/HOME_CALENDAR_CHARTS_PROPOSALS_2026-09-22.md. Shared by both
# routes so the two cannot describe the same filter differently.
_ALMANAC_ONLY_DESC = (
    "MARRIAGE only. Restrict results to days on the sourced printed almanac's "
    "wedding list. Every slot already carries `almanacMuhurtham` regardless."
)


@router.get("/charts/{chart_id}/muhurta", response_model=MuhurtaResponse, tags=["muhurta"])
def get_muhurta(
    chart_id: UUID,
    activity: str = Query(description="JOB_START | MARRIAGE | EXAM | TRAVEL | INVESTMENT | MEDICAL | PURCHASE | SPIRITUAL | NAMING_CEREMONY | ANNAPRASANA | EAR_BORING | TREASURE_STORE | GOLD | GEMS | GRAIN | LAND_POSSESSION | LAND_PURCHASE | CATTLE_PURCHASE"),
    date_from: date = Query(alias="dateFrom"),
    date_to: date = Query(alias="dateTo"),
    lat: float | None = Query(default=None, ge=-90, le=90),
    lon: float | None = Query(default=None, ge=-180, le=180),
    tz: str | None = Query(default=None, min_length=1, max_length=64),
    # Display label only — the calculation uses lat/lon/tz. Without it the
    # response would echo "Selected activity location" back at a user who just
    # typed "Coimbatore", so the card names a place the reader chose.
    place: str | None = Query(default=None, min_length=1, max_length=120),
    paksha: str | None = Query(default=None, pattern="^(SHUKLA|KRISHNA)$"),
    almanac_only: bool = Query(default=False, alias="almanacOnly", description=_ALMANAC_ONLY_DESC),
    include_excluded: bool = Query(default=False, alias="includeExcluded"),
    partner_chart_id: UUID | None = _PARTNER_QUERY,
    subject_role: SubjectRole = _ROLE_QUERY,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MuhurtaResponse:
    # `current_user` was `_current_user` — authenticated, deliberately unused,
    # and `find_best_muhurta_slots` takes no `user_id`, so nothing downstream
    # re-checked. Any signed-in user with a chart UUID could read this. See
    # `app.core.chart_access` for why a rule kept in six copies grows a seventh
    # hole rather than a seventh copy.
    assert_chart_owner(session, chart_id, current_user)
    _authorize_partner(session, chart_id, partner_chart_id, current_user)
    primary_role, partner_role = _roles(subject_role, partner_chart_id)
    return find_best_muhurta_slots(
        chart_id, activity, date_from, date_to, session,
        activity_latitude=lat,
        activity_longitude=lon,
        activity_timezone=tz,
        activity_place=place,
        paksha=paksha,
        almanac_only=almanac_only,
        include_excluded=include_excluded,
        co_chart_id=partner_chart_id,
        subject_role=primary_role,
        co_subject_role=partner_role,
    )


@router.get("/muhurta", response_model=MuhurtaResponse, tags=["muhurta"])
def get_muhurta_for_activity_location(
    activity: str = Query(description="Muhurta activity identifier"),
    date_from: date = Query(alias="dateFrom"),
    date_to: date = Query(alias="dateTo"),
    lat: float | None = Query(default=None, ge=-90, le=90),
    lon: float | None = Query(default=None, ge=-180, le=180),
    tz: str | None = Query(default=None, min_length=1, max_length=64),
    # Display label only — the calculation uses lat/lon/tz. Without it the
    # response would echo "Selected activity location" back at a user who just
    # typed "Coimbatore", so the card names a place the reader chose.
    place: str | None = Query(default=None, min_length=1, max_length=120),
    paksha: str | None = Query(default=None, pattern="^(SHUKLA|KRISHNA)$"),
    almanac_only: bool = Query(default=False, alias="almanacOnly", description=_ALMANAC_ONLY_DESC),
    chart_id: UUID | None = Query(default=None, alias="chartId"),
    include_excluded: bool = Query(default=False, alias="includeExcluded"),
    partner_chart_id: UUID | None = _PARTNER_QUERY,
    subject_role: SubjectRole = _ROLE_QUERY,
    session: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
) -> MuhurtaResponse:
    """Location-aware muhurta, optionally personalised to an owned chart.

    A chart id is deliberately a query parameter here so general and personal
    requests share one contract. The legacy chart-path route remains for current
    callers and applies the identical ownership and location rules.
    """
    if partner_chart_id is not None and chart_id is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="partnerChartId requires chartId — a couple is two charts, not one.",
        )
    if chart_id is not None:
        if current_user is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
        assert_chart_owner(session, chart_id, current_user)
        _authorize_partner(session, chart_id, partner_chart_id, current_user)
    primary_role, partner_role = _roles(subject_role, partner_chart_id)
    return find_best_muhurta_slots(
        chart_id, activity, date_from, date_to, session,
        activity_latitude=lat,
        activity_longitude=lon,
        activity_timezone=tz,
        activity_place=place,
        paksha=paksha,
        almanac_only=almanac_only,
        include_excluded=include_excluded,
        co_chart_id=partner_chart_id,
        # A role with no chart is dead state; general mode has no subject to label.
        subject_role=primary_role if chart_id is not None else None,
        co_subject_role=partner_role,
    )


@router.get(
    "/charts/{chart_id}/muhurtham-naals",
    response_model=MuhurthamNaalMatchResponse,
    tags=["muhurta"],
)
def get_muhurtham_naals_for_chart(
    chart_id: UUID,
    year: int = Query(default=2027, description="Calendar year of the muhurtham sheet"),
    recommended_only: bool = Query(default=False, alias="recommendedOnly"),
    partner_chart_id: UUID | None = _PARTNER_QUERY,
    subject_role: SubjectRole = _ROLE_QUERY,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MuhurthamNaalMatchResponse:
    """Curated almanac muhurtham naals ranked for this chart — or for a couple.

    Uses Tara Bala (9-fold star strength from the chart's birth star) plus
    Chandrashtama avoidance to surface the best wedding dates from the
    published list for the given year. With `partnerChartId` both charts are
    read and the weaker side governs each check.

    The response is derived from the chart's birth star, so it discloses a
    placement — the ownership check is not a formality here, and it applies to
    the partner's chart exactly as it does to the first.
    """
    assert_chart_owner(session, chart_id, current_user)
    _authorize_partner(session, chart_id, partner_chart_id, current_user)
    primary_role, _ = _roles(subject_role, partner_chart_id)
    matches, context = match_muhurtham_naals(
        chart_id, year, session,
        recommended_only=recommended_only,
        partner_chart_id=partner_chart_id,
        subject_role=primary_role,
    )
    return MuhurthamNaalMatchResponse(
        year=year,
        chart_id=str(chart_id),
        partner_chart_id=str(partner_chart_id) if partner_chart_id is not None else None,
        context=context_from_dict(context),
        matches=[item_from_match(m) for m in matches],
    )
