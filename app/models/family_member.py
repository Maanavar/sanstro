from __future__ import annotations

from datetime import date
from uuid import UUID, uuid4

from sqlalchemy import Boolean, Date, ForeignKey, Index, Numeric, String, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class FamilyMember(TimestampMixin, Base):
    __tablename__ = "family_members"
    __table_args__ = (
        Index("idx_family_members_vault", "family_vault_id"),
        Index("idx_family_members_owner", "owner_user_id"),
    )

    family_member_id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    owner_user_id: Mapped[UUID] = mapped_column(ForeignKey("users.user_id"), nullable=False)
    family_vault_id: Mapped[UUID | None] = mapped_column(ForeignKey("family_vaults.family_vault_id"), nullable=True)
    relationship_to_owner: Mapped[str] = mapped_column("relationship", String(32), nullable=False, default="other")
    display_name: Mapped[str] = mapped_column(String(255), nullable=False)
    gender_for_traditional_rules: Mapped[str] = mapped_column(
        String(32), nullable=False, default="not_specified", server_default=text("'not_specified'")
    )
    date_of_birth_local: Mapped[date | None] = mapped_column(Date, nullable=True)
    is_minor: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default=text("false"))
    managed_by_user_id: Mapped[UUID | None] = mapped_column(ForeignKey("users.user_id"), nullable=True)
    consent_status: Mapped[str] = mapped_column(
        String(32), nullable=False, default="owner_managed", server_default=text("'owner_managed'")
    )
    member_weight: Mapped[float] = mapped_column(
        Numeric(5, 2), nullable=False, default=1.0, server_default=text("1.00")
    )

    family_vault = relationship("FamilyVault", back_populates="family_members")
    owner_user = relationship("User", back_populates="family_members", foreign_keys=[owner_user_id])
    managed_by_user = relationship("User", foreign_keys=[managed_by_user_id])
    birth_profiles = relationship("BirthProfile", back_populates="family_member")
    relationship_alerts = relationship("RelationshipAlert", back_populates="member")
