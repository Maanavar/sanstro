from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.core.error_codes import ErrorCode
from app.core.errors import AppError
from app.db.session import get_db
from app.models import BirthProfile
from app.models.user import User
from app.schemas.birth_profiles import (
    BirthProfileCreate,
    BirthProfileCreateResponse,
    BirthProfileGetResponse,
    BirthProfileListResponse,
    BirthProfileResponseMeta,
    BirthProfileUpdate,
)
from app.services.birth_profile_service import (
    confirm_current_location,
    create_birth_profile,
    get_birth_profile,
    get_latest_birth_profile_for_owner,
    list_birth_profiles_for_owner,
    soft_delete_birth_profile,
    update_birth_profile,
)

router = APIRouter()


@router.get("/birth-profiles", response_model=BirthProfileListResponse, tags=["birth-profiles"])
def list_birth_profiles_endpoint(
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BirthProfileListResponse:
    """List all birth profiles for the current user."""
    profiles = list_birth_profiles_for_owner(
        session,
        current_user.user_id,
        calculation_version="thirukanitham-2026-v1",
    )
    return BirthProfileListResponse(
        data=profiles,
        meta=BirthProfileResponseMeta(
            calculation_version="thirukanitham-2026-v1",
            generated_at=datetime.now(tz=UTC),
        ),
    )


@router.post("/birth-profiles", response_model=BirthProfileCreateResponse, tags=["birth-profiles"])
def create_birth_profile_endpoint(
    payload: BirthProfileCreate,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BirthProfileCreateResponse:
    # Ensure the profile is created under the authenticated user's identity
    payload = payload.model_copy(update={"owner_user_id": current_user.user_id})
    result = create_birth_profile(session, payload, calculation_version="thirukanitham-2026-v1")
    return BirthProfileCreateResponse(
        data=result,
        meta=BirthProfileResponseMeta(
            calculation_version="thirukanitham-2026-v1",
            generated_at=datetime.now(tz=UTC),
        ),
    )


@router.get("/birth-profiles/{birth_profile_id}", response_model=BirthProfileGetResponse, tags=["birth-profiles"])
def get_birth_profile_endpoint(
    birth_profile_id: UUID,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BirthProfileGetResponse:
    profile = session.get(BirthProfile, birth_profile_id)
    if profile is None or profile.deleted_at is not None:
        raise AppError(ErrorCode.BIRTH_PROFILE_NOT_FOUND)
    if profile.owner_user_id != current_user.user_id:
        raise AppError(ErrorCode.ACCESS_DENIED)
    return get_birth_profile(session, birth_profile_id, calculation_version="thirukanitham-2026-v1")


@router.get("/birth-profiles/me/latest", response_model=BirthProfileGetResponse, tags=["birth-profiles"])
def get_latest_birth_profile_for_current_user_endpoint(
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BirthProfileGetResponse:
    return get_latest_birth_profile_for_owner(
        session,
        current_user.user_id,
        calculation_version="thirukanitham-2026-v1",
    )


@router.patch("/birth-profiles/{birth_profile_id}", response_model=BirthProfileGetResponse, tags=["birth-profiles"])
def update_birth_profile_endpoint(
    birth_profile_id: UUID,
    payload: BirthProfileUpdate,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BirthProfileGetResponse:
    profile = session.get(BirthProfile, birth_profile_id)
    if profile is None or profile.deleted_at is not None:
        raise AppError(ErrorCode.BIRTH_PROFILE_NOT_FOUND)
    if profile.owner_user_id != current_user.user_id:
        raise AppError(ErrorCode.ACCESS_DENIED)
    return update_birth_profile(session, profile, payload, calculation_version="thirukanitham-2026-v1")


@router.post(
    "/birth-profiles/{birth_profile_id}/confirm-location",
    response_model=BirthProfileGetResponse,
    tags=["birth-profiles"],
    summary="Record that the saved location is still correct, without changing it",
)
def confirm_birth_profile_location_endpoint(
    birth_profile_id: UUID,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BirthProfileGetResponse:
    """The "Keep Chennai" half of the §2 location check.

    A reader who declines the prompt has answered it just as much as one who
    accepts, so the confirmation stamp has to move on both. Without this the
    PATCH route would be the only thing that stamps, the backstop would come
    back on the reader's next visit, and declining would be indistinguishable
    from ignoring.
    """
    profile = session.get(BirthProfile, birth_profile_id)
    if profile is None or profile.deleted_at is not None:
        raise AppError(ErrorCode.BIRTH_PROFILE_NOT_FOUND)
    if profile.owner_user_id != current_user.user_id:
        raise AppError(ErrorCode.ACCESS_DENIED)
    return confirm_current_location(session, profile)


@router.delete(
    "/birth-profiles/{birth_profile_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["birth-profiles"],
    summary="Delete a birth profile and all associated chart data",
)
def delete_birth_profile_endpoint(
    birth_profile_id: UUID,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    """Soft-delete a birth profile and retire any orphaned family-member link."""
    profile = session.get(BirthProfile, birth_profile_id)
    if profile is None or profile.deleted_at is not None:
        raise AppError(ErrorCode.BIRTH_PROFILE_NOT_FOUND)
    if profile.owner_user_id != current_user.user_id:
        raise AppError(ErrorCode.ACCESS_DENIED)
    soft_delete_birth_profile(session, profile)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
