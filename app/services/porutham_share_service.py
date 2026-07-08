from __future__ import annotations

import hashlib
import secrets
from datetime import UTC, datetime, timedelta
from uuid import UUID, uuid4

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.porutham_share import PoruthamShare
from app.schemas.dasha import ResponseMeta
from app.schemas.porutham_shares import (
    CreatePoruthamShareData,
    CreatePoruthamShareResponse,
    PoruthamShareBirthInput,
    PoruthamShareViewData,
    PoruthamShareViewResponse,
    RevokePoruthamShareData,
    RevokePoruthamShareResponse,
)
from app.schemas.relationships import VALID_COMPATIBILITY_CONTEXTS
from app.services.chart_service import _chart_response_from_profile  # noqa: PLC2701 (internal use)
from app.services.synastry_service import compare_chart_snapshots_direct

_SHARE_LIFETIME = timedelta(days=30)


class _ShareSourceProfile:
    """Ephemeral profile-shaped object for _chart_response_from_profile.

    Deliberately carries no real display name — public share content must
    never expose a stored family member's name (only the opt-in labelA/
    labelB the sharing user types at creation time).
    """

    def __init__(self, inp: PoruthamShareBirthInput) -> None:
        self.birth_profile_id = uuid4()
        self.display_name = "Anonymous"
        self.birth_date_local = inp.birth_date_local
        self.birth_time_local = inp.birth_time_local
        self.birth_latitude = inp.birth_latitude
        self.birth_longitude = inp.birth_longitude
        self.birth_timezone = inp.birth_timezone
        self.birth_place = inp.birth_place
        self.gender_for_traditional_rules = "UNKNOWN"
        self.relationship_to_owner = "other"
        self.deleted_at = None


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def create_porutham_share(
    session: Session,
    *,
    owner_user_id: UUID,
    person_a: PoruthamShareBirthInput,
    person_b: PoruthamShareBirthInput,
    compatibility_context: str,
    label_a: str | None,
    label_b: str | None,
) -> CreatePoruthamShareResponse:
    if compatibility_context not in VALID_COMPATIBILITY_CONTEXTS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=f"compatibilityContext must be one of: {sorted(VALID_COMPATIBILITY_CONTEXTS)}",
        )

    try:
        chart_a = _chart_response_from_profile(_ShareSourceProfile(person_a), "thirukanitham-2026-v1")
        chart_b = _chart_response_from_profile(_ShareSourceProfile(person_b), "thirukanitham-2026-v1")
    except (ValueError, HTTPException) as exc:
        msg = exc.detail if isinstance(exc, HTTPException) else str(exc)
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=msg) from exc

    porutham = compare_chart_snapshots_direct(chart_a, chart_b, compatibility_context=compatibility_context).data

    snapshot = {
        "boyNakshatra": porutham.boy_nakshatra,
        "boyNakshatraName": porutham.boy_nakshatra_name,
        "girlNakshatra": porutham.girl_nakshatra,
        "girlNakshatraName": porutham.girl_nakshatra_name,
        "kutas": [k.model_dump(by_alias=True) for k in porutham.kutas],
        "totalScore": porutham.total_score,
        "maxScore": porutham.max_score,
        "percentage": porutham.percentage,
        "label": porutham.label,
        "rajjuDosha": porutham.rajju_dosha,
        "vedhaDosha": porutham.vedha_dosha,
        "nadiDosha": porutham.nadi_dosha.model_dump(by_alias=True),
        "summary": porutham.summary.model_dump(),
        "compatibilityContext": porutham.compatibility_context,
        "contextNote": porutham.context_note.model_dump() if porutham.context_note else None,
    }

    token = secrets.token_urlsafe(32)
    now = datetime.now(UTC)
    share = PoruthamShare(
        owner_user_id=owner_user_id,
        token_hash=_hash_token(token),
        label_a=label_a,
        label_b=label_b,
        snapshot=snapshot,
        created_at=now,
        expires_at=now + _SHARE_LIFETIME,
    )
    session.add(share)
    session.flush()

    settings = get_settings()
    url = f"{settings.frontend_url}/share/porutham/{token}"

    return CreatePoruthamShareResponse(
        data=CreatePoruthamShareData(
            share_id=str(share.porutham_share_id),
            token=token,
            url=url,
            expires_at=share.expires_at,
            label_a=share.label_a,
            label_b=share.label_b,
        ),
        meta=ResponseMeta(calculation_version="thirukanitham-2026-v1", generated_at=now),
    )


def get_porutham_share_by_token(session: Session, token: str) -> PoruthamShareViewResponse:
    token_hash = _hash_token(token)
    share = (
        session.query(PoruthamShare)
        .filter(PoruthamShare.token_hash == token_hash)
        .one_or_none()
    )
    now = datetime.now(UTC)
    if share is None or share.revoked_at is not None or share.expires_at < now:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="This link is no longer available.")

    share.view_count += 1
    share.last_viewed_at = now
    session.flush()

    snapshot = share.snapshot
    return PoruthamShareViewResponse(
        data=PoruthamShareViewData(
            label_a=share.label_a,
            label_b=share.label_b,
            boy_nakshatra=snapshot["boyNakshatra"],
            boy_nakshatra_name=snapshot["boyNakshatraName"],
            girl_nakshatra=snapshot["girlNakshatra"],
            girl_nakshatra_name=snapshot["girlNakshatraName"],
            kutas=snapshot["kutas"],
            total_score=snapshot["totalScore"],
            max_score=snapshot["maxScore"],
            percentage=snapshot["percentage"],
            label=snapshot["label"],
            rajju_dosha=snapshot["rajjuDosha"],
            vedha_dosha=snapshot["vedhaDosha"],
            nadi_dosha=snapshot["nadiDosha"],
            summary=snapshot["summary"],
            compatibility_context=snapshot["compatibilityContext"],
            context_note=snapshot["contextNote"],
            created_at=share.created_at,
            expires_at=share.expires_at,
        )
    )


def revoke_porutham_share(session: Session, *, owner_user_id: UUID, share_id: UUID) -> RevokePoruthamShareResponse:
    share = session.query(PoruthamShare).filter(PoruthamShare.porutham_share_id == share_id).one_or_none()
    if share is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Share link not found.")
    if share.owner_user_id != owner_user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not own this share link.")

    if share.revoked_at is None:
        share.revoked_at = datetime.now(UTC)
        session.flush()

    return RevokePoruthamShareResponse(
        data=RevokePoruthamShareData(share_id=str(share.porutham_share_id), revoked_at=share.revoked_at)
    )
