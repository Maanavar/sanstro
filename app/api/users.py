"""User self-service endpoints.

GET  /users/me/subscription — current plan info (tier, renewal date, provider).

Account deletion lives at `DELETE /auth/me` (app/api/auth.py) — a hard delete
that cascades through every FK-owned table at the DB level. An earlier
"anonymise and retain the row" variant used to live here as `DELETE /users/me`;
it was never wired to any client and was removed 2026-07-04 after an audit
(see docs/API_FRONTEND_WIRING_AUDIT_2026-07.md WIRE-2) found it left
`interpretation_outputs` PII orphaned and didn't revoke mobile refresh tokens.
Do not re-add an anonymise-on-delete path without fixing both first.
"""
from __future__ import annotations

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
    provider: str | None = None
    current_period_end: str | None = None


class SubscriptionInfoResponse(BaseModel):
    success: bool = True
    data: SubscriptionInfo | None = None


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
