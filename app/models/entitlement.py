from __future__ import annotations

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, String, Text, func, text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base

#: Where an entitlement row came from. `subscription` is deliberately absent:
#: subscription access is computed live from `subscriptions` (its period end is
#: the provider's fact), and copying it here would give two rows to keep in
#: step (ARC-13).
ENTITLEMENT_SOURCES = ("trial", "purchase", "grant")


class Entitlement(Base):
    """A time-ranged right to something (admin spec L1, D-05).

    Effective access is the union of rows that are unrevoked and active now,
    plus an active subscription (`app.core.subscription`). Quantities — a
    top-up's ten questions, a purchased report — are not rows here; they are
    credits (ARC-02).
    """

    __tablename__ = "entitlements"
    __table_args__ = (
        CheckConstraint(
            "source IN ('trial', 'purchase', 'grant')", name="source"
        ),
        Index("ix_entitlements_user_id_key", "user_id", "key"),
        # One trial per account, ever — revoked or expired rows still count.
        # Enforced here, not only in the service, so two concurrent
        # verifications cannot both start one.
        Index(
            "uq_entitlements_one_trial_per_user",
            "user_id",
            unique=True,
            postgresql_where=text("source = 'trial'"),
        ),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False
    )
    #: What it grants, e.g. "premium".
    key: Mapped[str] = mapped_column(String(48), nullable=False)
    source: Mapped[str] = mapped_column(String(16), nullable=False)
    #: The order, grant note or other origin, when there is one.
    source_id: Mapped[str | None] = mapped_column(String(120), nullable=True)
    starts_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    #: NULL = no end.
    ends_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    revoked_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    #: The admin who granted it (source = grant).
    granted_by: Mapped[UUID | None] = mapped_column(
        ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
