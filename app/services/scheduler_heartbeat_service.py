"""Durable heartbeat for the dedicated scheduler worker."""
from __future__ import annotations

from datetime import UTC, datetime, timedelta
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.orm import Session

from app.models.scheduler_heartbeat import SchedulerHeartbeat

SCHEDULER_NAME = "primary"


def record_scheduler_heartbeat(
    session: Session,
    *,
    instance_id: UUID,
    is_leader: bool,
    backend_pid: int | None,
    now: datetime | None = None,
    started_at: datetime | None = None,
    last_error: str | None = None,
) -> None:
    """Upsert the worker's latest successful leadership-check cycle."""
    cycle_at = now or datetime.now(UTC)
    began_at = started_at or cycle_at
    values = {
        "scheduler_name": SCHEDULER_NAME,
        "instance_id": instance_id,
        "is_leader": is_leader,
        "leader_backend_pid": backend_pid,
        "last_successful_cycle_at": cycle_at,
        "last_error": last_error,
        "started_at": began_at,
        "updated_at": cycle_at,
    }

    if session.bind is not None and session.bind.dialect.name == "postgresql":
        statement = pg_insert(SchedulerHeartbeat).values(**values)
        statement = statement.on_conflict_do_update(
            index_elements=[SchedulerHeartbeat.scheduler_name],
            set_={key: value for key, value in values.items() if key != "scheduler_name"},
        )
        session.execute(statement)
        return

    row = session.get(SchedulerHeartbeat, SCHEDULER_NAME)
    if row is None:
        session.add(SchedulerHeartbeat(**values))
        return
    for key, value in values.items():
        if key != "scheduler_name":
            setattr(row, key, value)


def scheduler_is_healthy(
    session: Session,
    *,
    max_age_seconds: float,
    now: datetime | None = None,
) -> bool:
    """True only for a fresh heartbeat that still claims leadership."""
    checked_at = now or datetime.now(UTC)
    row = session.execute(
        select(SchedulerHeartbeat).where(SchedulerHeartbeat.scheduler_name == SCHEDULER_NAME)
    ).scalar_one_or_none()
    if row is None or not row.is_leader:
        return False
    cycle_at = row.last_successful_cycle_at
    if cycle_at.tzinfo is None:
        cycle_at = cycle_at.replace(tzinfo=UTC)
    return cycle_at >= checked_at - timedelta(seconds=max_age_seconds)
