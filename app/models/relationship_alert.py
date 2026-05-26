from __future__ import annotations

from datetime import date
from uuid import UUID, uuid4

from sqlalchemy import Boolean, Date, ForeignKey, Index, String, UniqueConstraint, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class RelationshipAlert(TimestampMixin, Base):
    __tablename__ = "relationship_alerts"
    __table_args__ = (
        UniqueConstraint(
            "vault_id",
            "member_id",
            "trigger_planet",
            "trigger_type",
            "alert_date",
            name="uq_relationship_alerts_unique_trigger",
        ),
        Index("idx_relationship_alerts_vault_date", "vault_id", "alert_date"),
        Index("idx_relationship_alerts_member", "member_id"),
    )

    alert_id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    vault_id: Mapped[UUID] = mapped_column(ForeignKey("family_vaults.family_vault_id"), nullable=False)
    member_id: Mapped[UUID] = mapped_column(ForeignKey("family_members.family_member_id"), nullable=False)
    trigger_planet: Mapped[str] = mapped_column(String(16), nullable=False)
    trigger_type: Mapped[str] = mapped_column(String(64), nullable=False)
    message_en: Mapped[str] = mapped_column(String(500), nullable=False)
    message_ta: Mapped[str] = mapped_column(String(500), nullable=False)
    alert_date: Mapped[date] = mapped_column(Date, nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default=text("false"))

    vault = relationship("FamilyVault", back_populates="relationship_alerts")
    member = relationship("FamilyMember", back_populates="relationship_alerts")
