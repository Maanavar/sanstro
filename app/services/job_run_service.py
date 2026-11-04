"""Write and read `job_runs` — one row per background job execution (spec L10).

Two properties decide the shape of this module.

**A failed run must leave a row.** So the row is written in its own session,
committed before the job body starts, and closed in a second commit — the same
reason `log_admin_action` and `persist_flag` keep their own sessions. A job that
raises, or a worker that is killed, still leaves its history behind; a killed
run stays `running`, which is the honest state and the one worth alerting on.

**Recording must never be what breaks a job.** Every write here is wrapped: if
the history table is unreachable, the job still runs and the failure is logged.
A reconciliation that is skipped because its bookkeeping row could not be
written would be a worse outcome than a gap in the history.
"""
from __future__ import annotations

import asyncio
import functools
import logging
from collections.abc import Callable, Iterator
from contextlib import contextmanager
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.job_run import JobRun

logger = logging.getLogger(__name__)

#: Long enough for a real traceback's last line, short enough that a pathological
#: exception message cannot fill the table.
_SUMMARY_LIMIT = 500

TRIGGER_SCHEDULE = "schedule"
TRIGGER_MANUAL = "manual"


@dataclass
class JobRunRecord:
    """Handle on the open row: the caller sets `summary`, the recorder closes it."""

    run_id: UUID | None
    started_at: datetime
    summary: str | None = None
    outcome: str = "running"
    finished_at: datetime | None = None


def summarise_result(result: Any) -> str | None:
    """One line for whatever a job returned. Dicts become `key=value, key=value`."""
    if result is None:
        return None
    if isinstance(result, dict):
        return ", ".join(f"{key}={value}" for key, value in result.items())[:_SUMMARY_LIMIT] or None
    return str(result)[:_SUMMARY_LIMIT]


def _describe_error(exc: BaseException) -> str:
    message = str(exc).strip()
    described = f"{type(exc).__name__}: {message}" if message else type(exc).__name__
    return described[:_SUMMARY_LIMIT]


def _open_run(
    job_id: str,
    *,
    trigger: str,
    actor_user_id: UUID | None,
    actor_email: str | None,
    started_at: datetime,
) -> UUID | None:
    from app.db.session import SessionLocal

    run_id = uuid4()
    try:
        with SessionLocal() as session, session.begin():
            session.add(
                JobRun(
                    id=run_id,
                    job_id=job_id,
                    trigger=trigger,
                    actor_user_id=actor_user_id,
                    actor_email=actor_email,
                    started_at=started_at,
                    outcome="running",
                )
            )
    except Exception as exc:  # noqa: BLE001 - never block the job on its own bookkeeping
        logger.warning("job_run_open_failed job_id=%s error=%s", job_id, type(exc).__name__)
        return None
    return run_id


def _close_run(run_id: UUID | None, *, outcome: str, summary: str | None, finished_at: datetime) -> None:
    if run_id is None:
        return
    from app.db.session import SessionLocal

    try:
        with SessionLocal() as session, session.begin():
            row = session.get(JobRun, run_id)
            if row is None:  # pragma: no cover - only if someone pruned mid-run
                return
            row.outcome = outcome
            row.summary = summary
            row.finished_at = finished_at
    except Exception as exc:  # noqa: BLE001
        logger.warning("job_run_close_failed run_id=%s error=%s", run_id, type(exc).__name__)


def _safe_close(record: JobRunRecord) -> None:
    try:
        _close_run(
            record.run_id,
            outcome=record.outcome,
            summary=record.summary,
            finished_at=record.finished_at or datetime.now(UTC),
        )
    except Exception as exc:  # noqa: BLE001
        logger.warning("job_run_close_failed run_id=%s error=%s", record.run_id, type(exc).__name__)


@contextmanager
def record_job_run(
    job_id: str,
    *,
    trigger: str,
    actor_user_id: UUID | None = None,
    actor_email: str | None = None,
) -> Iterator[JobRunRecord]:
    """Record one execution of `job_id`, however it ends.

    The caller sets `record.summary` for a successful run; a raised exception is
    summarised here and re-raised unchanged, so callers keep their own error
    handling (the admin route still answers 500 with the job's message).
    """
    started_at = datetime.now(UTC)
    run_id: UUID | None = None
    # Belt and braces over `_open_run`'s own guard: nothing in this module,
    # including a bug in it, may be the reason a job does not run. The same
    # applies on the way out — a close that raised inside the `except` below
    # would replace the job's exception with a bookkeeping one.
    try:
        run_id = _open_run(
            job_id,
            trigger=trigger,
            actor_user_id=actor_user_id,
            actor_email=actor_email,
            started_at=started_at,
        )
    except Exception as exc:  # noqa: BLE001
        logger.warning("job_run_open_failed job_id=%s error=%s", job_id, type(exc).__name__)

    record = JobRunRecord(run_id=run_id, started_at=started_at)
    try:
        yield record
    except BaseException as exc:
        record.outcome = "error"
        record.summary = _describe_error(exc)
        record.finished_at = datetime.now(UTC)
        _safe_close(record)
        raise
    record.outcome = "success"
    record.finished_at = datetime.now(UTC)
    _safe_close(record)


def recorded(job_id: str, func: Callable[[], Any]) -> Callable[[], Any]:
    """Wrap a scheduled job so every cron firing writes its `job_runs` row.

    Applied where the schedule is built, not where jobs are registered: the
    admin trigger path records its own run with the actor who pressed the
    button, and a job wrapped twice would write two rows for one execution.
    """
    if asyncio.iscoroutinefunction(func):

        @functools.wraps(func)
        async def _async_wrapper() -> Any:
            with record_job_run(job_id, trigger=TRIGGER_SCHEDULE) as record:
                result = await func()
                record.summary = summarise_result(result)
            return result

        return _async_wrapper

    @functools.wraps(func)
    def _wrapper() -> Any:
        with record_job_run(job_id, trigger=TRIGGER_SCHEDULE) as record:
            result = func()
            record.summary = summarise_result(result)
        return result

    return _wrapper


# ── Reads (the admin console and the health tab) ─────────────────────────────


def recent_job_runs(
    session: Session,
    *,
    job_id: str | None = None,
    outcome: str | None = None,
    limit: int = 50,
) -> list[JobRun]:
    query = select(JobRun).order_by(JobRun.started_at.desc()).limit(max(1, min(limit, 500)))
    if job_id is not None:
        query = query.where(JobRun.job_id == job_id)
    if outcome is not None:
        query = query.where(JobRun.outcome == outcome)
    return list(session.execute(query).scalars().all())


def last_run_per_job(session: Session) -> dict[str, JobRun]:
    """The newest run of every job that has ever run, keyed by `job_id`."""
    query = select(JobRun).order_by(JobRun.job_id, JobRun.started_at.desc()).distinct(JobRun.job_id)
    return {row.job_id: row for row in session.execute(query).scalars().all()}
