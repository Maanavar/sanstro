from __future__ import annotations

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import CheckConstraint, DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class ErasureTombstone(Base):
    """One erased account (spec L5). Restoring a backup replays these.

    `user_id` has no foreign key on purpose: the row exists to outlive the
    account, and a restored backup that still holds the account is exactly the
    case it is for (`app.privacy.tombstones replay`). `id` is the pseudonym the
    audit log uses for the person afterwards (`erased:<id>`).
    """

    __tablename__ = "erasure_tombstones"
    __table_args__ = (CheckConstraint("via IN ('self', 'admin')", name="via"),)

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(nullable=False, unique=True)
    #: self = DELETE /auth/me; admin = the console's erasure route.
    via: Mapped[str] = mapped_column(String(8), nullable=False)
    erased_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
