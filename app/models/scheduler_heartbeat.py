from __future__ import annotations

from datetime import datetime
from uuid import UUID

from sqlalchemy import Boolean, DateTime, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class SchedulerHeartbeat(Base):
    """Observable liveness/leadership record for the dedicated scheduler."""

    __tablename__ = "scheduler_heartbeats"

    scheduler_name: Mapped[str] = mapped_column(String(64), primary_key=True)
    instance_id: Mapped[UUID] = mapped_column(nullable=False)
    is_leader: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    leader_backend_pid: Mapped[int | None] = mapped_column(Integer, nullable=True)
    last_successful_cycle_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    last_error: Mapped[str | None] = mapped_column(Text, nullable=True)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
