from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.relationships import RelationshipAlertsResponse, SynastryResponse
from app.services.synastry_service import get_synastry_for_member, list_relationship_alerts

router = APIRouter()


@router.get("/relationships/alerts", response_model=RelationshipAlertsResponse, tags=["relationships"])
def relationship_alerts(
    family_vault_id: UUID = Query(alias="familyVaultId"),
    unread_only: bool = Query(default=True, alias="unreadOnly"),
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RelationshipAlertsResponse:
    return list_relationship_alerts(
        session,
        current_user.user_id,
        family_vault_id,
        unread_only=unread_only,
    )


@router.get("/relationships/{member_id}/synastry", response_model=SynastryResponse, tags=["relationships"])
def relationship_synastry(
    member_id: UUID,
    family_vault_id: UUID = Query(alias="familyVaultId"),
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SynastryResponse:
    return get_synastry_for_member(session, current_user.user_id, family_vault_id, member_id)

