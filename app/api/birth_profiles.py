from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.session import get_db
from app.models import BirthProfile
from app.models.user import User
from app.schemas.birth_profiles import BirthProfileCreate, BirthProfileCreateResponse, BirthProfileResponseMeta, BirthProfileGetResponse
from app.services.birth_profile_service import create_birth_profile, get_birth_profile

router = APIRouter()


@router.post("/birth-profiles", response_model=BirthProfileCreateResponse, tags=["birth-profiles"])
def create_birth_profile_endpoint(
    payload: BirthProfileCreate,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BirthProfileCreateResponse:
    # Ensure the profile is created under the authenticated user's identity
    payload = payload.model_copy(update={"owner_user_id": current_user.user_id})
    with session.begin():
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
    with session.begin():
        profile = session.get(BirthProfile, birth_profile_id)
        if profile is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Birth profile not found.")
        if profile.owner_user_id != current_user.user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
        return get_birth_profile(session, birth_profile_id, calculation_version="thirukanitham-2026-v1")


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
    """Permanently delete a birth profile and all calculated chart records."""
    with session.begin():
        profile = session.get(BirthProfile, birth_profile_id)
        if profile is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Birth profile not found.")
        if profile.owner_user_id != current_user.user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
        session.delete(profile)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
