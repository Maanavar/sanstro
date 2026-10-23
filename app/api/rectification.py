from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.core.entitlements import require_feature
from app.db.session import get_db
from app.models.birth_profile import BirthProfile
from app.models.user import User
from app.schemas.rectification import (
    RectificationApplyRequest,
    RectificationApplyResponse,
    RectificationRequest,
    RectificationResponse,
)
from app.services.rectification_service import apply_rectified_time, estimate_birth_time

router = APIRouter(dependencies=[Depends(require_feature("birth_time_rectification_enabled"))])


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
    # Read only what the owner may see; the service raises 404/403 below.
    before_instant = (
        existing.birth_datetime_utc
        if existing is not None
        and existing.owner_user_id == current_user.user_id
        and existing.birth_time_local is not None
        else None
    )
    updated = apply_rectified_time(
        session,
        birth_profile_id,
        payload.selected_time,
        owner_user_id=current_user.user_id,
    )
    # The shift of the birth *instant*. Candidates are swept across the recorded
    # birth date and the date is never changed, so 23:50 -> 00:10 really does
    # move the birth back 1420 minutes; computing on UTC instants also keeps a
    # DST-day birth honest.
    after_instant = updated.birth_datetime_utc
    if before_instant is None or after_instant is None:
        offset_minutes = 0
    else:
        offset_minutes = int((after_instant - before_instant).total_seconds() // 60)

    return RectificationApplyResponse(
        birthProfileId=updated.birth_profile_id,
        appliedOffsetMinutes=offset_minutes,
        newBirthTimeLocal=updated.birth_time_local.strftime("%H:%M") if updated.birth_time_local else payload.selected_time,
    )
