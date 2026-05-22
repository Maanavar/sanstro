from __future__ import annotations

from uuid import UUID, uuid4

from sqlalchemy import ForeignKey, Index, String, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class FamilyVault(TimestampMixin, Base):
    __tablename__ = "family_vaults"
    __table_args__ = (Index("idx_family_vault_owner", "owner_user_id"),)

    family_vault_id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    owner_user_id: Mapped[UUID] = mapped_column(ForeignKey("users.user_id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    default_language: Mapped[str] = mapped_column(
        String(16), nullable=False, default="ta-en", server_default=text("'ta-en'")
    )

    owner_user = relationship("User", back_populates="family_vaults")
    family_members = relationship("FamilyMember", back_populates="family_vault")
    family_daily_scores = relationship("FamilyDailyScore", back_populates="family_vault")
