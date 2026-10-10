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

A05 — WHY THERE IS AN INBOX
---------------------------
This handler used to read an event's type and expiry and apply them straight to
"the first subscription row for this user". It recorded no event identity and
no event timestamp, so it had nothing to decide with, and two failures followed
directly:

  - a renewal followed by a late-arriving OLDER expiration deactivated a
    renewed subscription. Measured against this handler before the fix:
    renewal -> active, then an hour-older expiration -> inactive.
  - a redelivered event was reprocessed as if new.

Both are properties of the provider's documented contract rather than bad luck.
RevenueCat sends `id` and `event_timestamp_ms`, and documents that a retry
REUSES both. So duplicate delivery is a guarantee to design for, and the event
carries the information needed to order it.

Three rules now hold, in this order:

  1. ACCEPT DURABLY, ONCE. The event is inserted into `webhook_events` with a
     unique `(provider, event_id)`. A conflict means "already seen" and returns
     200 — the provider has delivered successfully and must not keep retrying.
     The constraint, not a prior SELECT, is what arbitrates: two concurrent
     deliveries would both pass a check.
  2. RESOLVE THE ACCOUNT, OR SAY SO. `app_user_id`, then
     `original_app_user_id`, then `aliases` — the chain the provider documents,
     and the reason a purchase made under an anonymous id can still reach the
     right account. An event that resolves to nobody is recorded as
     `unresolved` rather than discarded, so it can be reconciled instead of
     being a silent loss.
  3. APPLY ONLY IF NOT SUPERSEDED. `subscriptions.provider_event_timestamp`
     holds the timestamp of the last applied event. An event describing an
     earlier moment is recorded as `stale` and changes nothing.

What this still does NOT do: reconcile against RevenueCat's current state. The
entitlement is derived from the event stream alone, so a permanently lost event
is not recovered by anything here (A05 step 7).
"""
from __future__ import annotations

import hashlib
import logging
from datetime import UTC, datetime
from hmac import compare_digest
from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.session import get_db
from app.models.subscription import Subscription
from app.models.user import User
from app.models.webhook_event import WebhookEvent

router = APIRouter(prefix="/webhooks", tags=["webhooks"])
_logger = logging.getLogger(__name__)

_PROVIDER = "revenuecat"

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


def _as_datetime(value: Any) -> datetime | None:
    """A provider millisecond timestamp, or None if absent/unusable."""
    if value is None:
        return None
    try:
        return datetime.fromtimestamp(int(value) / 1000, tz=UTC)
    except (TypeError, ValueError, OSError, OverflowError):
        return None


def _candidate_user_ids(event: dict[str, Any]) -> list[str]:
    """Provider identities for this subscriber, most specific first.

    `aliases` is why this is a list. A purchase made while the SDK still held
    an anonymous id arrives with that id as `app_user_id`, and the backend UUID
    only in `aliases` — the exact shape A04 describes from the client side.
    Resolving the chain is what stops that purchase being unattributable.
    """
    candidates: list[str] = []
    for key in ("app_user_id", "original_app_user_id"):
        value = event.get(key)
        if isinstance(value, str) and value:
            candidates.append(value)

    aliases = event.get("aliases")
    if isinstance(aliases, list):
        candidates.extend(alias for alias in aliases if isinstance(alias, str) and alias)

    # Preserve order, drop repeats. `dict.fromkeys` rather than a set, because
    # order is the priority: `app_user_id` must be tried before an alias.
    return list(dict.fromkeys(candidates))


def _resolve_user(db: Session, event: dict[str, Any]) -> User | None:
    for candidate in _candidate_user_ids(event):
        try:
            user_id = UUID(candidate)
        except ValueError:
            # An anonymous id such as `$RCAnonymousID:abc123` is not a UUID.
            # Not an error — just not this candidate.
            continue
        user = db.get(User, user_id)
        if user is not None:
            return user
    return None


def _idempotency_key(event: dict[str, Any]) -> str:
    """The provider's event id, or a deterministic key derived from the event.

    RevenueCat documents `id` as always present, so the fallback should never
    fire in production. It exists because of what the alternatives cost:

      - rejecting the event with 400 drops it permanently. RevenueCat retries
        5xx, not 4xx, so a contract violation on their side would become
        silent entitlement loss on ours — the failure mode A05 exists to stop.
      - minting a fresh UUID would make every redelivery look new, which is the
        deduplication anti-pattern the guide calls out by name.

    A content hash is neither: a retry carries the same fields and therefore
    the same key, so idempotency still holds. Two genuinely distinct events
    would have to agree on type, subscriber, timestamp, product, transaction
    and expiry to collide, and two such events are not meaningfully different.
    """
    event_id = event.get("id")
    if isinstance(event_id, str) and event_id:
        return event_id

    material = "|".join(
        str(event.get(key, ""))
        for key in (
            "type",
            "app_user_id",
            "event_timestamp_ms",
            "product_id",
            "original_transaction_id",
            "expiration_at_ms",
        )
    )
    digest = hashlib.sha256(material.encode("utf-8")).hexdigest()
    _logger.warning("revenuecat_event_missing_id derived_key=%s", digest[:16])
    return f"derived:{digest}"


def _minimal_payload(event: dict[str, Any]) -> dict[str, Any]:
    """The fields reconciliation needs, chosen explicitly.

    Never the whole body: it is provider-shaped, may grow fields we have not
    reviewed, and the request also carried a shared secret. An inbox row is not
    a place to park unexamined input.
    """
    keys = (
        "id",
        "type",
        "event_timestamp_ms",
        "app_user_id",
        "original_app_user_id",
        "aliases",
        "product_id",
        "transaction_id",
        "original_transaction_id",
        "expiration_at_ms",
        "store",
    )
    return {key: event[key] for key in keys if key in event}


def _record(
    db: Session,
    event: dict[str, Any],
    *,
    status_value: str,
    resolved_user_id: UUID | None,
) -> bool:
    """Insert the inbox row. False means this event was already accepted.

    The IntegrityError is the mechanism, not a surprise: `(provider, event_id)`
    is unique, and a retry reuses the id by design.
    """
    db.add(
        WebhookEvent(
            provider=_PROVIDER,
            event_id=_idempotency_key(event),
            event_type=str(event.get("type") or ""),
            event_timestamp=_as_datetime(event.get("event_timestamp_ms")),
            provider_app_user_id=event.get("app_user_id"),
            resolved_user_id=resolved_user_id,
            status=status_value,
            processed_at=datetime.now(UTC),
            payload=_minimal_payload(event),
        )
    )
    try:
        db.flush()
    except IntegrityError:
        db.rollback()
        return False
    return True


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
    event_id: Any = event.get("id")
    app_user_id: str | None = event.get("app_user_id")
    product_id: str | None = event.get("product_id")
    original_transaction_id: str | None = event.get("original_transaction_id")
    expiration_at_ms: int | None = event.get("expiration_at_ms")
    event_at = _as_datetime(event.get("event_timestamp_ms"))

    _logger.info("revenuecat_event type=%s id=%s", event_type, event_id)

    # Unhandled types are not recorded. SUBSCRIBER_ALIAS and friends arrive in
    # volume, say nothing about entitlement, and an inbox that accumulates them
    # is harder to read for the events that matter.
    if event_type not in _HANDLED_EVENTS:
        return {"status": "ignored"}

    if not app_user_id:
        return {"status": "ignored"}

    user = _resolve_user(db, event)
    if user is None:
        # Explicit, observable disposition. The old handler logged and returned
        # "ignored", keeping nothing — so a purchase the backend could not
        # attribute left no trace to reconcile from.
        _logger.warning("revenuecat_unresolved_subscriber event_id=%s", event_id)
        if not _record(db, event, status_value="unresolved", resolved_user_id=None):
            return {"status": "duplicate"}
        return {"status": "unresolved"}

    # Accept once. Everything below runs only for an event we have not seen.
    if not _record(db, event, status_value="ok", resolved_user_id=user.user_id):
        return {"status": "duplicate"}

    # Prefer the store's subscription identity; fall back to the owning account
    # when the event does not carry one.
    sub: Subscription | None = None
    if original_transaction_id:
        sub = (
            db.query(Subscription)
            .filter(
                Subscription.provider == _PROVIDER,
                Subscription.provider_subscription_id == original_transaction_id,
            )
            .first()
        )
    if sub is None:
        sub = db.query(Subscription).filter(Subscription.user_id == user.user_id).first()

    # THE ORDERING GUARD. An event describing a moment at or before the one
    # already applied cannot move the projection. `>=` on the applied timestamp
    # would drop a legitimate second event inside the same millisecond, so the
    # comparison is strict.
    if sub is not None and event_at is not None and sub.provider_event_timestamp is not None:
        applied = sub.provider_event_timestamp
        if applied.tzinfo is None:
            applied = applied.replace(tzinfo=UTC)
        if event_at < applied:
            _logger.info(
                "revenuecat_stale_event event_id=%s event_at=%s applied=%s",
                event_id,
                event_at.isoformat(),
                applied.isoformat(),
            )
            db.query(WebhookEvent).filter(
                WebhookEvent.provider == _PROVIDER,
                WebhookEvent.event_id == _idempotency_key(event),
            ).update({"status": "stale"}, synchronize_session=False)
            return {"status": "stale"}

    expiry = _as_datetime(expiration_at_ms)

    if event_type in _ENDS_AT_PERIOD_END_EVENTS:
        # Status stays as it is: access continues until `expiry`. With no
        # expiry on the event there is nothing to record, and nothing changes.
        if sub is not None and expiry is not None:
            sub.current_period_end = expiry
    elif event_type in _ACTIVE_EVENTS:
        if sub is None:
            sub = Subscription(
                user_id=user.user_id,
                tier="premium",
                provider=_PROVIDER,
                provider_subscription_id=original_transaction_id,
                provider_product_id=product_id,
                status="active",
                current_period_end=expiry,
            )
            db.add(sub)
        else:
            sub.status = "active"
            sub.tier = "premium"
            sub.provider = _PROVIDER
            if original_transaction_id:
                sub.provider_subscription_id = original_transaction_id
            sub.provider_product_id = product_id
            sub.current_period_end = expiry
    else:
        if sub is not None:
            sub.status = "inactive"

    # Record what the projection has now seen, so a later older event is
    # recognisable as older.
    if sub is not None and event_at is not None:
        sub.provider_event_timestamp = event_at

    return {"status": "ok"}
