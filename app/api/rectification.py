from __future__ import annotations

from datetime import date, datetime
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.rectification import (
    RectificationApplyResponse,
    RectificationApplyRequest,
    RectificationRequest,
    RectificationResponse,
)
from app.models.birth_profile import BirthProfile
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
    response_model=RectificationApplyResponse,
    tags=["rectification"],
)
def apply_rectification(
    birth_profile_id: UUID,
    payload: RectificationApplyRequest,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RectificationApplyResponse:
    existing = session.get(BirthProfile, birth_profile_id)
    before_time = existing.birth_time_local if existing is not None else None
    updated = apply_rectified_time(
        session,
        birth_profile_id,
        payload.selected_time,
        owner_user_id=current_user.user_id,
    )
    if before_time is None or updated.birth_time_local is None:
        offset_minutes = 0
    else:
        before_dt = datetime.combine(date.today(), before_time)
        after_dt = datetime.combine(date.today(), updated.birth_time_local)
        offset_minutes = int((after_dt - before_dt).total_seconds() // 60)

    return RectificationApplyResponse(
        birthProfileId=updated.birth_profile_id,
        appliedOffsetMinutes=offset_minutes,
        newBirthTimeLocal=updated.birth_time_local.strftime("%H:%M") if updated.birth_time_local else payload.selected_time,
    )
