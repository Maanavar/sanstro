from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.core.error_codes import ErrorCode, get_error_message
from app.db.session import get_db
from app.models import BirthProfile
from app.models.user import User
from app.schemas.birth_profiles import (
    BirthProfileCreate,
    BirthProfileCreateResponse,
    BirthProfileGetResponse,
    BirthProfileResponseMeta,
    BirthProfileUpdate,
    BirthProfileListResponse,
)
from app.services.birth_profile_service import (
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
        error_info = get_error_message(ErrorCode.BIRTH_PROFILE_NOT_FOUND)
        raise HTTPException(status_code=error_info["status"], detail=error_info["user_message"])
    if profile.owner_user_id != current_user.user_id:
        error_info = get_error_message(ErrorCode.ACCESS_DENIED)
        raise HTTPException(status_code=error_info["status"], detail=error_info["user_message"])
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
        error_info = get_error_message(ErrorCode.BIRTH_PROFILE_NOT_FOUND)
        raise HTTPException(status_code=error_info["status"], detail=error_info["user_message"])
    if profile.owner_user_id != current_user.user_id:
        error_info = get_error_message(ErrorCode.ACCESS_DENIED)
        raise HTTPException(status_code=error_info["status"], detail=error_info["user_message"])
    return update_birth_profile(session, profile, payload, calculation_version="thirukanitham-2026-v1")


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
        error_info = get_error_message(ErrorCode.BIRTH_PROFILE_NOT_FOUND)
        raise HTTPException(status_code=error_info["status"], detail=error_info["user_message"])
    if profile.owner_user_id != current_user.user_id:
        error_info = get_error_message(ErrorCode.ACCESS_DENIED)
        raise HTTPException(status_code=error_info["status"], detail=error_info["user_message"])
    soft_delete_birth_profile(session, profile)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
