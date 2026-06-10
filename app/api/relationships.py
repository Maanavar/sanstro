from __future__ import annotations

import re
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.relationships import CompatibilityIntelligenceResponse, DirectCompareRequest, DirectPoruthamResponse, PorutthamResponse, RelationshipAlertsResponse, SynastryResponse
from app.services.synastry_service import compare_charts_direct, get_compatibility_intelligence_for_member, get_porutham_for_member, get_synastry_for_member, list_relationship_alerts

router = APIRouter()


def _validate_compatibility_context(value: str) -> str:
    from app.schemas.relationships import VALID_COMPATIBILITY_CONTEXTS

    if value not in VALID_COMPATIBILITY_CONTEXTS:
        raise HTTPException(
            status_code=422,
            detail=f"compatibilityContext must be one of: {sorted(VALID_COMPATIBILITY_CONTEXTS)}",
        )
    return value


def _safe_name(raw: str, fallback: str) -> str:
    cleaned = re.sub(r"[^A-Za-z0-9_-]+", "_", raw).strip("_")
    return cleaned or fallback


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
    return get_porutham_for_member(
        session,
        current_user.user_id,
        family_vault_id,
        member_id,
        compatibility_context=_validate_compatibility_context(compatibility_context),
    )


@router.get(
    "/relationships/{member_id}/compatibility-intelligence",
    response_model=CompatibilityIntelligenceResponse,
    tags=["relationships"],
)
def relationship_compatibility_intelligence(
    member_id: UUID,
    family_vault_id: UUID = Query(alias="familyVaultId"),
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CompatibilityIntelligenceResponse:
    """Full 8-level Compatibility Intelligence Report for marriage matching (signed users)."""
    return get_compatibility_intelligence_for_member(
        session,
        current_user.user_id,
        family_vault_id,
        member_id,
    )


@router.post("/relationships/compare", response_model=DirectPoruthamResponse, tags=["relationships"])
def compare_charts(
    payload: DirectCompareRequest,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DirectPoruthamResponse:
    return compare_charts_direct(
        session,
        current_user.user_id,
        payload.chart_id_a,
        payload.chart_id_b,
        compatibility_context=_validate_compatibility_context(payload.compatibility_context),
    )


@router.post("/relationships/compare/pdf", tags=["relationships"])
def compare_charts_pdf(
    payload: DirectCompareRequest,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    from app.services.chart_service import load_persisted_chart_response
    from app.services.pdf_export_service import generate_porutham_pdf

    result = compare_charts_direct(
        session,
        current_user.user_id,
        payload.chart_id_a,
        payload.chart_id_b,
        compatibility_context=_validate_compatibility_context(payload.compatibility_context),
    )

    name_a = "Person_A"
    name_b = "Person_B"
    try:
        snap_a = load_persisted_chart_response(session, payload.chart_id_a)
        name_a = snap_a.data.birth_profile.display_name
    except Exception:
        pass
    try:
        snap_b = load_persisted_chart_response(session, payload.chart_id_b)
        name_b = snap_b.data.birth_profile.display_name
    except Exception:
        pass

    pdf_bytes = generate_porutham_pdf(result.data, name_a, name_b)
    safe_a = _safe_name(name_a, "A")
    safe_b = _safe_name(name_b, "B")
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="porutham_{safe_a}_{safe_b}.pdf"'},
    )

