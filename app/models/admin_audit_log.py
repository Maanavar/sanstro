from __future__ import annotations

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, Index, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class AdminAuditLog(Base):
    __tablename__ = "admin_audit_log"
    __table_args__ = (
        Index("idx_audit_created_at", "created_at"),
        Index("idx_audit_action", "action"),
        Index("idx_audit_actor", "actor_user_id"),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    # Who did it. Without this the log records that a user was deleted and not
    # by whom, which is the question an incident review opens with.
    #
    # Nullable, and ON DELETE SET NULL rather than CASCADE: rows written before
    # this column existed have no actor, a server-to-server caller has no user,
    # and — the important one — deleting a user must never erase the record of
    # what that user did. CASCADE would let an admin delete their own account
    # and take their audit trail with it.
    actor_user_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True
    )
    action: Mapped[str] = mapped_column(String(120), nullable=False)
    target_type: Mapped[str | None] = mapped_column(String(60), nullable=True)
    target_id: Mapped[str | None] = mapped_column(String(120), nullable=True)
    payload_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
