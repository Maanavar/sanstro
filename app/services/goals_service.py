"""
Astro Memory — user goal tracking service.

Goals are user-declared focus areas (job change, marriage, education, etc.)
attached to a specific chart. They are used to personalise daily guidance
narrative by emphasising astrological periods relevant to the declared goal.

Rules (from agents.md):
- Goals never change calculation results — only which aspects are highlighted.
- Language stays supportive and tendency-based, never deterministic.
- A user may have multiple active goals; up to 3 are used for narrative enrichment.
"""
from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Chart, UserGoal
from app.models.user_goal import VALID_GOAL_TYPES
from app.schemas.dasha import ResponseMeta
from app.schemas.goals import (
    GoalData,
    GoalDeactivateResponse,
    GoalListData,
    GoalListResponse,
    GoalResponse,
)

_CALC_VERSION = "jothidam-formula-engine-v1.0-2026"


def _meta() -> ResponseMeta:
    return ResponseMeta(calculation_version=_CALC_VERSION, generated_at=datetime.now(tz=UTC))


def _to_data(g: UserGoal) -> GoalData:
    return GoalData(
        goalId=g.goal_id,
        chartId=g.chart_id,
        goalType=g.goal_type,
        description=g.description,
        isActive=g.is_active,
        languagePreference=g.language_preference,
        createdAt=g.created_at,
    )


def _assert_chart_owner(session: Session, chart_id: UUID, owner_user_id: UUID) -> None:
    chart = session.get(Chart, chart_id)
    if chart is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chart not found.")
    from app.models import BirthProfile
    profile = session.get(BirthProfile, chart.birth_profile_id)
    if profile is None or profile.owner_user_id != owner_user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")


def create_goal(
    session: Session,
    owner_user_id: UUID,
    chart_id: UUID,
    goal_type: str,
    description: str | None,
    language_preference: str,
) -> GoalResponse:
    _assert_chart_owner(session, chart_id, owner_user_id)

    goal = UserGoal(
        owner_user_id=owner_user_id,
        chart_id=chart_id,
        goal_type=goal_type,
        description=description,
        is_active=True,
        language_preference=language_preference,
    )
    session.add(goal)
    session.flush()
    return GoalResponse(data=_to_data(goal), meta=_meta())


def list_goals(
    session: Session,
    owner_user_id: UUID,
    chart_id: UUID,
    active_only: bool = True,
) -> GoalListResponse:
    _assert_chart_owner(session, chart_id, owner_user_id)

    q = select(UserGoal).where(
        UserGoal.chart_id == chart_id,
        UserGoal.owner_user_id == owner_user_id,
        UserGoal.deleted_at.is_(None),
    )
    if active_only:
        q = q.where(UserGoal.is_active.is_(True))
    q = q.order_by(UserGoal.created_at.desc())
    goals = list(session.scalars(q))
    return GoalListResponse(
        data=GoalListData(chartId=chart_id, goals=[_to_data(g) for g in goals]),
        meta=_meta(),
    )


def deactivate_goal(
    session: Session,
    owner_user_id: UUID,
    goal_id: UUID,
) -> GoalDeactivateResponse:
    goal = session.get(UserGoal, goal_id)
    if goal is None or goal.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found.")
    if goal.owner_user_id != owner_user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
    goal.is_active = False
    return GoalDeactivateResponse(meta=_meta())


def get_active_goals_for_chart(session: Session, chart_id: UUID) -> list[UserGoal]:
    """Return up to 3 active goals for a chart — used by narrative enrichment."""
    q = (
        select(UserGoal)
        .where(
            UserGoal.chart_id == chart_id,
            UserGoal.is_active.is_(True),
            UserGoal.deleted_at.is_(None),
        )
        .order_by(UserGoal.created_at.desc())
        .limit(3)
    )
    return list(session.scalars(q))
