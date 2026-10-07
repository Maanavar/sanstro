"""Inbound webhooks from third-party services.

RevenueCat webhook
------------------
RevenueCat sends a shared-secret bearer token in the Authorization header.
Set JOTHIDAM_REVENUECAT_WEBHOOK_SECRET in the environment. If unset, the
endpoint returns 503 (Phase A — not wired yet).

Supported event types that update the subscription table:
  INITIAL_PURCHASE, RENEWAL, PRODUCT_CHANGE,
  UNCANCELLATION                       → upsert active subscription, period end = expiration_at_ms
  CANCELLATION, BILLING_ISSUE          → access runs to the period end; only the end is updated
  EXPIRATION                           → mark subscription inactive now
  anything else (SUBSCRIBER_ALIAS,
  NON_RENEWING_PURCHASE, TRANSFER, …)  → ignored

Why CANCELLATION does not deactivate: RevenueCat sends it when the user turns
off auto-renew (and on refunds). Turning off auto-renew leaves the paid period
running; ending premium on the event cut paying users off early. A refund
carries an `expiration_at_ms` at the refund time, so writing the event's
expiration handles both cases. BILLING_ISSUE is the same shape: the store's
grace period keeps access until `expiration_at_ms`. `current_subscription_filter`
(app/core/subscription.py) stops granting premium once that time passes, so a
lost EXPIRATION webhook cannot leave a lapsed user on premium.

`tier` is written as "premium" for every active event because every
auto-renewing product in the catalogue is a premium plan; pay-per-use
products are consumables, which RevenueCat reports as NON_RENEWING_PURCHASE
and which never reach the subscription row.
"""
from __future__ import annotations

import logging
from datetime import UTC, datetime
from hmac import compare_digest
from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.session import get_db
from app.models.subscription import Subscription
from app.models.user import User

router = APIRouter(prefix="/webhooks", tags=["webhooks"])
_logger = logging.getLogger(__name__)

_ACTIVE_EVENTS = {"INITIAL_PURCHASE", "RENEWAL", "PRODUCT_CHANGE", "UNCANCELLATION"}
_ENDS_AT_PERIOD_END_EVENTS = {"CANCELLATION", "BILLING_ISSUE"}
_INACTIVE_EVENTS = {"EXPIRATION"}
_HANDLED_EVENTS = _ACTIVE_EVENTS | _ENDS_AT_PERIOD_END_EVENTS | _INACTIVE_EVENTS


def _require_revenuecat_secret(authorization: str | None = Header(default=None)) -> None:
    settings = get_settings()
    secret: str | None = getattr(settings, "revenuecat_webhook_secret", None)
    if not secret:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="RevenueCat webhook not configured.")
    expected = f"Bearer {secret}"
    if not authorization or not compare_digest(authorization, expected):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid webhook secret.")


@router.post(
    "/revenuecat",
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(_require_revenuecat_secret)],
)
async def revenuecat_webhook(request: Request, db: Session = Depends(get_db)) -> dict[str, str]:
    try:
        body: dict[str, Any] = await request.json()
    except Exception:
        # A provider sending us a body we cannot parse is an operational signal,
        # not a client error to discard silently. `from None`: the parse error is
        # recorded here and must not reach the caller.
        _logger.warning("revenuecat_unparseable_body")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid JSON body."
        ) from None

    event: dict[str, Any] = body.get("event", {})
    event_type: str = event.get("type", "")
    app_user_id: str | None = event.get("app_user_id")
    product_id: str | None = event.get("product_id")
    expiration_at_ms: int | None = event.get("expiration_at_ms")

    _logger.info("revenuecat_event type=%s app_user_id=%s", event_type, app_user_id)

    if event_type not in _HANDLED_EVENTS:
        return {"status": "ignored"}

    if not app_user_id:
        return {"status": "ignored"}

    # app_user_id is the user_id UUID we set when creating the RevenueCat customer
    try:
        user_id = UUID(app_user_id)
    except ValueError:
        _logger.warning("revenuecat_bad_app_user_id value=%s", app_user_id)
        return {"status": "ignored"}

    user = db.get(User, user_id)
    if user is None:
        _logger.warning("revenuecat_unknown_user user_id=%s", user_id)
        return {"status": "ignored"}

    sub = db.query(Subscription).filter(Subscription.user_id == user_id).first()
    expiry = (
        datetime.fromtimestamp(expiration_at_ms / 1000, tz=UTC) if expiration_at_ms else None
    )

    if event_type in _ENDS_AT_PERIOD_END_EVENTS:
        # Status stays as it is: access continues until `expiry`. With no
        # expiry on the event there is nothing to record, and nothing changes.
        if sub is not None and expiry is not None:
            sub.current_period_end = expiry
    elif event_type in _ACTIVE_EVENTS:
        if sub is None:
            sub = Subscription(
                user_id=user_id,
                tier="premium",
                provider="revenuecat",
                provider_subscription_id=product_id,
                status="active",
                current_period_end=expiry,
            )
            db.add(sub)
        else:
            sub.status = "active"
            sub.tier = "premium"
            sub.provider_subscription_id = product_id
            sub.current_period_end = expiry
    else:
        if sub is not None:
            sub.status = "inactive"

    return {"status": "ok"}
