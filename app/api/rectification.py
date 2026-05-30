from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.rectification import (
    RectificationApplyRequest,
    RectificationRequest,
    RectificationResponse,
)
from app.schemas.birth_profiles import BirthProfileGetResponse, BirthProfileResponseMeta
from app.services.rectification_service import apply_rectified_time, estimate_birth_time

router = APIRouter()


@router.post(
    "/birth-profiles/{birth_profile_id}/rectify",
    response_model=RectificationResponse,
    tags=["rectification"],
)
def rectify_birth_time(
    birth_profile_id: UUID,
    payload: RectificationRequest,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RectificationResponse:
    result = estimate_birth_time(
        session,
        birth_profile_id,
        payload.events,
        owner_user_id=current_user.user_id,
    )
    return RectificationResponse(data=result)


@router.patch(
    "/birth-profiles/{birth_profile_id}/rectify/apply",
    tags=["rectification"],
)
def apply_rectification(
    birth_profile_id: UUID,
    payload: RectificationApplyRequest,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    apply_rectified_time(
        session,
        birth_profile_id,
        payload.selected_time,
        owner_user_id=current_user.user_id,
    )
    return {"success": True, "message": "Birth time updated to estimated value."}
