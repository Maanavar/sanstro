from __future__ import annotations

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, String, Text, text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin


class Subscription(TimestampMixin, Base):
    __tablename__ = "subscriptions"
    __table_args__ = (
        # Webhook lookup by the store's id. Not unique on purpose: see
        # migration ss2c3d4e5f6a.
        Index("ix_subscriptions_provider_subscription", "provider", "provider_subscription_id"),
    )

    subscription_id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    tier: Mapped[str] = mapped_column(String(32), nullable=False)
    provider: Mapped[str | None] = mapped_column(String(64), nullable=True)
    #: The store's identity for this subscription — RevenueCat's
    #: `original_transaction_id`.
    #:
    #: A05: the webhook handler used to write `product_id` here. A SKU
    #: identifies a product, not one account's distinct subscription history, so
    #: two subscriptions to the same plan were indistinguishable and the handler
    #: fell back to "the first row for this user". Corrected rather than
    #: migrated: the table held 0 rows when this changed, so there was nothing
    #: to reinterpret.
    provider_subscription_id: Mapped[str | None] = mapped_column(Text, nullable=True)
    #: The product/SKU, which is what `provider_subscription_id` wrongly held.
    provider_product_id: Mapped[str | None] = mapped_column(Text, nullable=True)
    #: `event_timestamp_ms` of the most recent event APPLIED to this row.
    #:
    #: The ordering guard. Webhook delivery order is not authoritative, and
    #: without this the handler had no way to know that the expiration it was
    #: processing described a moment before the renewal already applied.
    provider_event_timestamp: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    #: The ACCESS projection, not the provider's word: "active" grants access
    #: until `current_period_end` (app/core/subscription.py); anything else
    #: grants none. A Razorpay subscription that is cancelled or halted stays
    #: "active" here until its paid period runs out — `provider_status` says why.
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="active", server_default=text("'active'"))
    #: Razorpay's own state (created | authenticated | active | pending | halted
    #: | cancelled | completed | expired | paused), for support and
    #: reconciliation. `pending` (a renewal being retried) keeps access past the
    #: period end until the retries resolve (spec L1 flow 2).
    provider_status: Mapped[str | None] = mapped_column(String(32), nullable=True)
    #: products.sku this subscription is for (Razorpay rows).
    sku: Mapped[str | None] = mapped_column(String(64), nullable=True)
    #: The user cancelled; access runs to `current_period_end`, then stops.
    cancel_at_period_end: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default=text("false")
    )
    current_period_start: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    current_period_end: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
