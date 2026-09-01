from __future__ import annotations

import re
from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.relationships import (
    CompatibilityIntelligenceResponse,
    DirectCompareRequest,
    DirectPoruthamResponse,
    DirectSynastryRequest,
    DirectSynastryResponse,
    PorutthamResponse,
    RelationshipAlertsResponse,
    SynastryResponse,
)
from app.services.chart_service import _chart_response_from_profile  # noqa: PLC2701
from app.services.synastry_service import (
    compare_charts_direct,
    compare_synastry_direct,
    get_compatibility_intelligence_for_member,
    get_compatibility_intelligence_for_member_with_snapshot,
    get_porutham_for_member,
    get_synastry_for_member,
    list_relationship_alerts,
)

router = APIRouter()


class DirectBirthInput(BaseModel):
    display_name: str = Field(alias="displayName", default="")
    birth_date_local: date = Field(alias="birthDateLocal")
    birth_time_local: str | None = Field(alias="birthTimeLocal", default=None)
    birth_latitude: float = Field(alias="birthLatitude")
    birth_longitude: float = Field(alias="birthLongitude")
    birth_timezone: str = Field(alias="birthTimezone", default="Asia/Kolkata")
    birth_place: str = Field(alias="birthPlace", default="")

    model_config = ConfigDict(populate_by_name=True)


class DirectCompatibilityIntelligenceRequest(BaseModel):
    person_a: DirectBirthInput = Field(alias="personA")

    model_config = ConfigDict(populate_by_name=True)


class _TransientProfile:
    def __init__(self, payload: DirectBirthInput) -> None:
        from datetime import time
        from uuid import uuid4

        self.birth_profile_id = uuid4()
        self.display_name = payload.display_name or "Anonymous"
        self.birth_date_local = payload.birth_date_local
        self.birth_time_local = time.fromisoformat(payload.birth_time_local) if payload.birth_time_local else None
        self.birth_latitude = payload.birth_latitude
        self.birth_longitude = payload.birth_longitude
        self.birth_timezone = payload.birth_timezone
        self.birth_place = payload.birth_place
        self.gender_for_traditional_rules = "UNKNOWN"
        self.relationship_to_owner = "other"
        self.deleted_at = None


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
    chart_id_a: UUID | None = Query(default=None, alias="chartIdA"),
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CompatibilityIntelligenceResponse:
    """Full 8-level Compatibility Intelligence Report for marriage matching (signed users).

    ``chartIdA`` optionally pins Person A to a specific chart the caller already
    has (the Porutham tool passes its Person-1 chart) so the report compares the
    two people the user actually entered rather than defaulting Person A to the
    vault owner.
    """
    return get_compatibility_intelligence_for_member(
        session,
        current_user.user_id,
        family_vault_id,
        member_id,
        person_a_chart_id=chart_id_a,
    )


@router.post(
    "/relationships/{member_id}/compatibility-intelligence/direct",
    response_model=CompatibilityIntelligenceResponse,
    tags=["relationships"],
)
def relationship_compatibility_intelligence_direct(
    member_id: UUID,
    payload: DirectCompatibilityIntelligenceRequest,
    family_vault_id: UUID = Query(alias="familyVaultId"),
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CompatibilityIntelligenceResponse:
    try:
        snap_a = _chart_response_from_profile(_TransientProfile(payload.person_a), "thirukanitham-2026-v1")
    except (ValueError, HTTPException) as exc:
        msg = exc.detail if isinstance(exc, HTTPException) else str(exc)
        raise HTTPException(status_code=422, detail=msg) from exc

    return get_compatibility_intelligence_for_member_with_snapshot(
        session,
        current_user.user_id,
        family_vault_id,
        member_id,
        person_a_snapshot=snap_a,
    )


@router.post("/relationships/compare-synastry", response_model=DirectSynastryResponse, tags=["relationships"])
def compare_synastry(
    payload: DirectSynastryRequest,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DirectSynastryResponse:
    """General (non-marriage) synastry for any two charts the current user owns —
    used for family-bond pairs where neither person is the vault owner."""
    return compare_synastry_direct(session, current_user.user_id, payload.chart_id_a, payload.chart_id_b)


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
    lang: str = Query(default="en", pattern="^(en|ta)$"),
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    from app.services.chart_service import load_persisted_chart_response
    from app.services.dasha_service import get_chart_dasha_from_snapshot
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
    chart_a = chart_b = dasha_a = dasha_b = None
    try:
        snap_a = load_persisted_chart_response(session, payload.chart_id_a)
        name_a = snap_a.data.birth_profile.display_name
        chart_a = snap_a.data
        dasha_a = get_chart_dasha_from_snapshot(snap_a, date.today(), level="antar").data
    except Exception:  # noqa: S110 — best-effort name/identity lookup; falls back to "Person_A"
        pass
    try:
        snap_b = load_persisted_chart_response(session, payload.chart_id_b)
        name_b = snap_b.data.birth_profile.display_name
        chart_b = snap_b.data
        dasha_b = get_chart_dasha_from_snapshot(snap_b, date.today(), level="antar").data
    except Exception:  # noqa: S110 — best-effort name/identity lookup; falls back to "Person_B"
        pass

    pdf_bytes = generate_porutham_pdf(
        result.data, name_a, name_b, lang=lang,
        chart_a=chart_a, chart_b=chart_b, dasha_a=dasha_a, dasha_b=dasha_b,
    )
    safe_a = _safe_name(name_a, "A")
    safe_b = _safe_name(name_b, "B")
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="porutham_{safe_a}_{safe_b}.pdf"'},
    )


@router.get(
    "/relationships/{member_id}/compatibility-intelligence/pdf",
    tags=["relationships"],
)
def relationship_compatibility_intelligence_pdf(
    member_id: UUID,
    family_vault_id: UUID = Query(alias="familyVaultId"),
    chart_id_a: UUID | None = Query(default=None, alias="chartIdA"),
    lang: str = Query(default="en", pattern="^(en|ta)$"),
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    from app.services.pdf_export_service import generate_compatibility_intelligence_pdf

    result = get_compatibility_intelligence_for_member(
        session,
        current_user.user_id,
        family_vault_id,
        member_id,
        person_a_chart_id=chart_id_a,
    )
    name_a = result.data.person_a_name or "Person_A"
    name_b = result.data.person_b_name or "Person_B"
    pdf_bytes = generate_compatibility_intelligence_pdf(result.data, name_a, name_b, lang=lang)
    safe_a = _safe_name(name_a, "A")
    safe_b = _safe_name(name_b, "B")
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": (
                f'attachment; filename="compatibility_intelligence_{safe_a}_{safe_b}.pdf"'
            )
        },
    )


@router.post(
    "/relationships/{member_id}/compatibility-intelligence/direct/pdf",
    tags=["relationships"],
)
def relationship_compatibility_intelligence_direct_pdf(
    member_id: UUID,
    payload: DirectCompatibilityIntelligenceRequest,
    family_vault_id: UUID = Query(alias="familyVaultId"),
    lang: str = Query(default="en", pattern="^(en|ta)$"),
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    from app.services.pdf_export_service import generate_compatibility_intelligence_pdf

    try:
        snap_a = _chart_response_from_profile(_TransientProfile(payload.person_a), "thirukanitham-2026-v1")
    except (ValueError, HTTPException) as exc:
        msg = exc.detail if isinstance(exc, HTTPException) else str(exc)
        raise HTTPException(status_code=422, detail=msg) from exc

    result = get_compatibility_intelligence_for_member_with_snapshot(
        session,
        current_user.user_id,
        family_vault_id,
        member_id,
        person_a_snapshot=snap_a,
    )
    name_a = result.data.person_a_name or payload.person_a.display_name or "Person_A"
    name_b = result.data.person_b_name or "Person_B"
    pdf_bytes = generate_compatibility_intelligence_pdf(result.data, name_a, name_b, lang=lang)
    safe_a = _safe_name(name_a, "A")
    safe_b = _safe_name(name_b, "B")
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": (
                f'attachment; filename="compatibility_intelligence_{safe_a}_{safe_b}.pdf"'
            )
        },
    )
