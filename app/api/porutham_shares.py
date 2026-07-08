from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.core.public_endpoint_limiter import public_endpoint_rate_limit
from app.db.session import get_db
from app.models.user import User
from app.schemas.porutham_shares import (
    CreatePoruthamShareRequest,
    CreatePoruthamShareResponse,
    PoruthamShareViewResponse,
    RevokePoruthamShareResponse,
)
from app.services.porutham_share_service import (
    create_porutham_share,
    get_porutham_share_by_token,
    revoke_porutham_share,
)

router = APIRouter()


@router.post("/porutham-shares", response_model=CreatePoruthamShareResponse, tags=["porutham-shares"])
def create_share(
    payload: CreatePoruthamShareRequest,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CreatePoruthamShareResponse:
    return create_porutham_share(
        session,
        owner_user_id=current_user.user_id,
        person_a=payload.person_a,
        person_b=payload.person_b,
        compatibility_context=payload.compatibility_context,
        label_a=payload.label_a,
        label_b=payload.label_b,
    )


@router.get("/porutham-shares/{token}", response_model=PoruthamShareViewResponse, tags=["porutham-shares"])
@public_endpoint_rate_limit("porutham_share_view")
def view_share(token: str, request: Request, session: Session = Depends(get_db)) -> PoruthamShareViewResponse:
    return get_porutham_share_by_token(session, token)


@router.post(
    "/porutham-shares/{share_id}/revoke", response_model=RevokePoruthamShareResponse, tags=["porutham-shares"]
)
def revoke_share(
    share_id: UUID,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RevokePoruthamShareResponse:
    return revoke_porutham_share(session, owner_user_id=current_user.user_id, share_id=share_id)
