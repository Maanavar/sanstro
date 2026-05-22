from __future__ import annotations

from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.session import get_db
from app.models import FamilyVault
from app.models.user import User
from app.schemas.family_vaults import (
    FamilyCalendarResponse,
    FamilyAggregateResponse,
    FamilyMemberCreate,
    FamilyMemberCreateResponse,
    FamilyMemberListResponse,
    FamilyMemberResponse,
    FamilyMemberUpdate,
    FamilyVaultDetailResponse,
    FamilyVaultCreate,
    FamilyVaultCreateResponse,
    FamilyVaultListResponse,
    FamilySummaryResponse,
)
from app.services.family_vault_service import (
    add_family_member,
    create_family_vault,
    delete_family_member,
    get_family_calendar,
    get_family_daily_aggregate,
    get_family_member,
    get_family_summary,
    get_family_vault_detail,
    list_family_members,
    list_family_vaults,
    update_family_member,
)

router = APIRouter()


def _assert_vault_owner(session: Session, family_vault_id: UUID, current_user: User) -> FamilyVault:
    vault = session.get(FamilyVault, family_vault_id)
    if vault is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Family vault not found.")
    if vault.owner_user_id != current_user.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
    return vault


@router.post("/family-vaults", response_model=FamilyVaultCreateResponse, tags=["family-vaults"])
def create_family_vault_endpoint(
    payload: FamilyVaultCreate,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FamilyVaultCreateResponse:
    payload = payload.model_copy(update={"owner_user_id": current_user.user_id})
    with session.begin():
        return create_family_vault(session, payload)


@router.get("/family-vaults", response_model=FamilyVaultListResponse, tags=["family-vaults"])
def family_vault_list_endpoint(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FamilyVaultListResponse:
    with session.begin():
        return list_family_vaults(session, current_user.user_id, limit=limit, offset=offset)


@router.get("/family-vaults/{family_vault_id}", response_model=FamilyVaultDetailResponse, tags=["family-vaults"])
def family_vault_detail_endpoint(
    family_vault_id: UUID,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FamilyVaultDetailResponse:
    with session.begin():
        _assert_vault_owner(session, family_vault_id, current_user)
        return get_family_vault_detail(session, family_vault_id)


@router.get(
    "/family-vaults/{family_vault_id}/members",
    response_model=FamilyMemberListResponse,
    tags=["family-vaults"],
    summary="List all members in a family vault",
)
def list_family_members_endpoint(
    family_vault_id: UUID,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FamilyMemberListResponse:
    with session.begin():
        _assert_vault_owner(session, family_vault_id, current_user)
        return list_family_members(session, family_vault_id)


@router.post(
    "/family-vaults/{family_vault_id}/members",
    response_model=FamilyMemberCreateResponse,
    tags=["family-vaults"],
)
def add_family_member_endpoint(
    family_vault_id: UUID,
    payload: FamilyMemberCreate,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FamilyMemberCreateResponse:
    payload = payload.model_copy(update={"owner_user_id": current_user.user_id})
    with session.begin():
        _assert_vault_owner(session, family_vault_id, current_user)
        return add_family_member(session, family_vault_id, payload)


@router.get(
    "/family-vaults/{family_vault_id}/members/{family_member_id}",
    response_model=FamilyMemberResponse,
    tags=["family-vaults"],
    summary="Get a single family member",
)
def get_family_member_endpoint(
    family_vault_id: UUID,
    family_member_id: UUID,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FamilyMemberResponse:
    with session.begin():
        _assert_vault_owner(session, family_vault_id, current_user)
        return get_family_member(session, family_vault_id, family_member_id)


@router.patch(
    "/family-vaults/{family_vault_id}/members/{family_member_id}",
    response_model=FamilyMemberResponse,
    tags=["family-vaults"],
    summary="Update a family member's details",
)
def update_family_member_endpoint(
    family_vault_id: UUID,
    family_member_id: UUID,
    payload: FamilyMemberUpdate,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FamilyMemberResponse:
    with session.begin():
        _assert_vault_owner(session, family_vault_id, current_user)
        return update_family_member(session, family_vault_id, family_member_id, payload)


@router.delete(
    "/family-vaults/{family_vault_id}/members/{family_member_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["family-vaults"],
    summary="Remove a member from a family vault",
)
def delete_family_member_endpoint(
    family_vault_id: UUID,
    family_member_id: UUID,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    with session.begin():
        _assert_vault_owner(session, family_vault_id, current_user)
        delete_family_member(session, family_vault_id, family_member_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get(
    "/family-vaults/{family_vault_id}/daily-aggregate",
    response_model=FamilyAggregateResponse,
    tags=["family-vaults"],
)
def family_daily_aggregate_endpoint(
    family_vault_id: UUID,
    date: date = Query(alias="date"),
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FamilyAggregateResponse:
    with session.begin():
        _assert_vault_owner(session, family_vault_id, current_user)
        return get_family_daily_aggregate(session, family_vault_id, date)


@router.get(
    "/family-vaults/{family_vault_id}/summary",
    response_model=FamilySummaryResponse,
    tags=["family-vaults"],
)
def family_summary_endpoint(
    family_vault_id: UUID,
    date: date = Query(alias="date"),
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FamilySummaryResponse:
    with session.begin():
        _assert_vault_owner(session, family_vault_id, current_user)
        return get_family_summary(session, family_vault_id, date)


@router.get("/family-vaults/{family_vault_id}/calendar", response_model=FamilyCalendarResponse, tags=["family-vaults"])
def family_calendar_endpoint(
    family_vault_id: UUID,
    from_date: date = Query(alias="from"),
    to_date: date = Query(alias="to"),
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FamilyCalendarResponse:
    with session.begin():
        _assert_vault_owner(session, family_vault_id, current_user)
        return get_family_calendar(session, family_vault_id, from_date, to_date)


@router.delete(
    "/family-vaults/{family_vault_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["family-vaults"],
    summary="Delete a family vault and all member data",
)
def delete_family_vault_endpoint(
    family_vault_id: UUID,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    """Permanently delete a family vault and all its members."""
    with session.begin():
        vault = _assert_vault_owner(session, family_vault_id, current_user)
        session.delete(vault)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
