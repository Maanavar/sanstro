from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.relationships import DirectCompareRequest, DirectPoruthamResponse, PorutthamResponse, RelationshipAlertsResponse, SynastryResponse
from app.services.synastry_service import compare_charts_direct, get_porutham_for_member, get_synastry_for_member, list_relationship_alerts

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


@router.get("/relationships/{member_id}/porutham", response_model=PorutthamResponse, tags=["relationships"])
def relationship_porutham(
    member_id: UUID,
    family_vault_id: UUID = Query(alias="familyVaultId"),
    compatibility_context: str = Query(default="GENERAL", alias="compatibilityContext"),
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PorutthamResponse:
    from app.schemas.relationships import VALID_COMPATIBILITY_CONTEXTS
    from fastapi import HTTPException
    if compatibility_context not in VALID_COMPATIBILITY_CONTEXTS:
        raise HTTPException(status_code=422, detail=f"compatibilityContext must be one of: {sorted(VALID_COMPATIBILITY_CONTEXTS)}")
    return get_porutham_for_member(session, current_user.user_id, family_vault_id, member_id, compatibility_context=compatibility_context)


@router.post("/relationships/compare", response_model=DirectPoruthamResponse, tags=["relationships"])
def compare_charts(
    payload: DirectCompareRequest,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DirectPoruthamResponse:
    from app.schemas.relationships import VALID_COMPATIBILITY_CONTEXTS
    if payload.compatibility_context not in VALID_COMPATIBILITY_CONTEXTS:
        raise HTTPException(status_code=422, detail=f"compatibilityContext must be one of: {sorted(VALID_COMPATIBILITY_CONTEXTS)}")
    return compare_charts_direct(
        session,
        current_user.user_id,
        payload.chart_id_a,
        payload.chart_id_b,
        compatibility_context=payload.compatibility_context,
    )

