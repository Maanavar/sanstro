from __future__ import annotations

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import DateTime, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin


class WebhookEvent(Base, TimestampMixin):
    """A durable record of one received provider event — the A05 inbox.

    The RevenueCat handler read an event's type and expiry and applied them
    straight to a subscription row. It recorded no event identity and no event
    timestamp, so it had nothing to decide with: a renewal followed by a
    late-arriving older expiration marked a renewed subscription inactive.

    The provider documents both of the facts needed to stop that, and
    documents that they survive a retry:

        id                  unique per event; REUSED on redelivery
        event_timestamp_ms  the time the event describes; also reused

    So duplicate delivery is a contract guarantee to design for, not an edge
    case, and `(provider, event_id)` is the natural idempotency key. The unique
    constraint is what enforces it — not a prior SELECT, which two concurrent
    deliveries would both pass.

    This table is an inbox, not an audit log of everything: it holds what is
    needed to decide whether an event has been seen, whether it was applied,
    and — for an event whose account could not be resolved — enough to
    reconcile later instead of discarding it.
    """

    __tablename__ = "webhook_events"
    __table_args__ = (
        # The idempotency guarantee, held by the database.
        UniqueConstraint("provider", "event_id", name="uq_webhook_events_provider_event_id"),
    )

    webhook_event_id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)

    #: The integration this event came from, so two providers cannot collide on
    #: an opaque id that happens to match.
    provider: Mapped[str] = mapped_column(String(64), nullable=False)
    #: The provider's own event id. Opaque; never parsed.
    event_id: Mapped[str] = mapped_column(Text, nullable=False)
    event_type: Mapped[str] = mapped_column(String(64), nullable=False)
    #: When the event says it happened, not when we received it. Ordering is
    #: decided on this; nullable because a provider that omits it must still be
    #: recorded rather than rejected.
    event_timestamp: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    #: The provider's id for the account, as sent. Text, not a UUID column: an
    #: anonymous id such as `$RCAnonymousID:abc123` is not a UUID, and an event
    #: we cannot resolve is exactly the one worth keeping.
    provider_app_user_id: Mapped[str | None] = mapped_column(Text, nullable=True)
    #: The account this event was resolved to, once resolved. No FK: an
    #: unresolved event must survive, and deleting a user must not delete the
    #: billing record of why they had access.
    resolved_user_id: Mapped[UUID | None] = mapped_column(nullable=True, index=True)

    #: ok | duplicate | unresolved | stale | ignored — the disposition, so an
    #: operator can ask "what did we do with this and why".
    status: Mapped[str] = mapped_column(String(32), nullable=False)
    processed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    #: The minimum needed to reconcile: identity, type, timing, product. NOT
    #: the whole payload, and never the Authorization header — the module that
    #: writes this picks the fields explicitly rather than storing what arrived.
    payload: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
