from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.goals import GoalCreate, GoalDeactivateResponse, GoalListResponse, GoalResponse
from app.services.goals_service import create_goal, deactivate_goal, list_goals

router = APIRouter()


@router.post("/goals", response_model=GoalResponse, tags=["goals"])
def create_user_goal(
    payload: GoalCreate,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> GoalResponse:
    return create_goal(
        session,
        owner_user_id=current_user.user_id,
        chart_id=payload.chart_id,
        goal_type=payload.goal_type,
        description=payload.description,
        language_preference=payload.language_preference,
    )


@router.get("/goals", response_model=GoalListResponse, tags=["goals"])
def list_user_goals(
    chart_id: UUID = Query(alias="chartId"),
    active_only: bool = Query(default=True, alias="activeOnly"),
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> GoalListResponse:
    return list_goals(session, current_user.user_id, chart_id, active_only)


@router.delete("/goals/{goal_id}", response_model=GoalDeactivateResponse, tags=["goals"])
def deactivate_user_goal(
    goal_id: UUID,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> GoalDeactivateResponse:
    return deactivate_goal(session, current_user.user_id, goal_id)
