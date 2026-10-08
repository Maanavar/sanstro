from __future__ import annotations

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, String, Text, text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin


class Subscription(TimestampMixin, Base):
    __tablename__ = "subscriptions"

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
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="active", server_default=text("'active'"))
    current_period_start: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    current_period_end: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
