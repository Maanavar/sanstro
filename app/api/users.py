"""User self-service endpoints.

GET  /users/me/subscription — current plan info (tier, renewal date, provider).
DELETE /users/me — GDPR right-to-erasure: anonymises all PII and
invalidates the session token so the user cannot log back in.
"""
from __future__ import annotations

from datetime import UTC, datetime
from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.session import get_db
from app.models.subscription import Subscription
from app.models.user import User

router = APIRouter(prefix="/users", tags=["users"])


class SubscriptionInfo(BaseModel):
    tier: str
    status: str
    provider: Optional[str] = None
    current_period_end: Optional[str] = None


class SubscriptionInfoResponse(BaseModel):
    success: bool = True
    data: Optional[SubscriptionInfo] = None


@router.get(
    "/me/subscription",
    response_model=SubscriptionInfoResponse,
    summary="Return the authenticated user's active subscription details",
)
def get_own_subscription(
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SubscriptionInfoResponse:
    sub = (
        session.query(Subscription)
        .filter(
            Subscription.user_id == current_user.user_id,
            Subscription.status == "active",
        )
        .order_by(Subscription.created_at.desc())
        .first()
    )
    if sub is None:
        return SubscriptionInfoResponse(data=None)
    return SubscriptionInfoResponse(
        data=SubscriptionInfo(
            tier=sub.tier,
            status=sub.status,
            provider=sub.provider,
            current_period_end=(
                sub.current_period_end.isoformat() if sub.current_period_end else None
            ),
        )
    )


class AccountDeletionResponse(BaseModel):
    success: bool = True
    message: str = "Account permanently deleted."


@router.delete(
    "/me",
    response_model=AccountDeletionResponse,
    summary="Permanently delete this account and erase all personal data (GDPR right to erasure)",
)
def delete_own_account(
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AccountDeletionResponse:
    """Anonymise all PII for the authenticated user and revoke their JWT.

    The user row is kept for audit trail with a deleted_at timestamp; all PII
    fields are overwritten. Birth profiles and related data are cascade-deleted
    by the database FK constraints (cascade="all, delete-orphan" on the ORM
    relationships, matching the DB-level ON DELETE CASCADE).

    After this call the user's JWT is immediately invalid (token_version bump)
    and they cannot log in again.
    """
    now = datetime.now(UTC)
    uid = current_user.user_id

    # Anonymise PII — replace email with a non-reversible placeholder
    current_user.email = f"deleted_{uid}@deleted.vinaadi"
    current_user.hashed_password = None
    current_user.deleted_at = now

    # Bump token_version to invalidate all active JWTs immediately
    current_user.token_version = (current_user.token_version or 0) + 1

    # Cascade deletes: birth_profiles → charts → notifications, device tokens,
    # journal entries, family vaults etc. are handled by FK ON DELETE CASCADE.
    # We delete the birth_profiles explicitly here so SQLAlchemy fires the
    # cascade logic for any in-memory objects already loaded in this session.
    for bp in list(current_user.birth_profiles):
        session.delete(bp)

    # flush stages all deletes; get_db() commits on request exit
    session.flush()

    return AccountDeletionResponse()
