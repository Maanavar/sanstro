"""User self-service endpoints.

GET  /users/me/subscription — current plan info (tier, renewal date, provider).
GET  /users/me/referral     — this account's referral code and share link (GRW-13).

Account deletion lives at `DELETE /auth/me` (app/api/auth.py) — a hard delete
that cascades through every FK-owned table at the DB level. An earlier
"anonymise and retain the row" variant used to live here as `DELETE /users/me`;
it was never wired to any client and was removed 2026-07-04 after an audit
(see docs/API_FRONTEND_WIRING_AUDIT_2026-07.md WIRE-2) found it left
`interpretation_outputs` PII orphaned and didn't revoke mobile refresh tokens.
Do not re-add an anonymise-on-delete path without fixing both first.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.core.config import get_settings
from app.core.subscription import current_subscription_filter
from app.db.session import get_db
from app.models.subscription import Subscription
from app.models.user import User
from app.services.acquisition_service import referral_code_for

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
        .filter(*current_subscription_filter(current_user.user_id))
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


class ReferralInfo(BaseModel):
    code: str
    #: The site root carrying the code — a link anyone can open.
    share_url: str = Field(alias="shareUrl")
    #: Accounts whose first visit arrived through this code.
    referred_count: int = Field(alias="referredCount")

    model_config = ConfigDict(populate_by_name=True)


class ReferralInfoResponse(BaseModel):
    success: bool = True
    data: ReferralInfo


@router.get(
    "/me/referral",
    response_model=ReferralInfoResponse,
    summary="Return (minting on first call) the authenticated user's referral code",
)
def get_own_referral(
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ReferralInfoResponse:
    # Re-read in this session: the code is written here on first request.
    user = session.get(User, current_user.user_id) or current_user
    code = referral_code_for(session, user)
    referred = session.execute(
        select(func.count(User.user_id)).where(User.acquisition_ref == code)
    ).scalar_one()
    site = get_settings().public_site_url.rstrip("/")
    return ReferralInfoResponse(
        data=ReferralInfo(code=code, shareUrl=f"{site}/?ref={code}", referredCount=int(referred))
    )
