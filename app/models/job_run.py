from __future__ import annotations

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, Index, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class JobRun(Base):
    """One execution of a registered background job (spec L10: `job_runs`).

    Before this, a scheduled run left nothing behind but log lines on whichever
    worker happened to own the schedule, and a manual run left an audit row that
    said it was triggered — not whether it finished. "Did last night's
    reconciliation run?" was unanswerable from the database.

    A row is written when the run starts and closed when it ends, in a session
    of its own, so a process killed mid-run leaves a visible `running` row
    rather than no row at all. `actor_email` is copied rather than joined: the
    history has to stay readable after an erasure nulls `actor_user_id`.
    """

    __tablename__ = "job_runs"
    __table_args__ = (Index("ix_job_runs_job_id_started_at", "job_id", "started_at"),)

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    job_id: Mapped[str] = mapped_column(String(120), nullable=False)
    #: "schedule" (the cron fired it) or "manual" (an admin pressed Run now).
    trigger: Mapped[str] = mapped_column(String(16), nullable=False)
    actor_user_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True
    )
    actor_email: Mapped[str | None] = mapped_column(String(320), nullable=True)
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    #: "running" until the run ends, then "success" or "error".
    outcome: Mapped[str] = mapped_column(String(16), nullable=False, default="running")
    #: What the job returned, or the failure, as one short line. Never a payload.
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
