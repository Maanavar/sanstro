from __future__ import annotations

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class User(TimestampMixin, Base):
    __tablename__ = "users"

    user_id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)

    birth_profiles = relationship("BirthProfile", back_populates="owner_user")
    family_members = relationship("FamilyMember", back_populates="owner_user", foreign_keys="FamilyMember.owner_user_id")
    family_vaults = relationship("FamilyVault", back_populates="owner_user")
