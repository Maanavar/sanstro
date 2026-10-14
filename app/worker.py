"""Standalone scheduler worker (no FastAPI app).

Run this as its own process/container in a scaled deployment so the API stops
scheduling cron and just serves requests::

    python -m app.worker

Set ``JOTHIDAM_RUN_SCHEDULER_IN_WEB=false`` on the API processes so only this
worker owns the schedule. The advisory leader lock is still acquired, so even a
replicated worker fires each job once. The job definitions come from
``app.scheduler`` — the same source the in-web scheduler uses. See REFACTOR_PLAN 3.3.
"""
from __future__ import annotations

import asyncio
import logging
import signal
from datetime import UTC, datetime
from uuid import UUID, uuid4

from app.scheduler import register_all_jobs, schedule_all_jobs

logger = logging.getLogger(__name__)


def _heartbeat_cycle(lease, instance_id: UUID, started_at: datetime) -> None:
    """Verify leadership, then publish one committed worker heartbeat."""
    if not lease.check():
        raise RuntimeError("scheduler leadership lost; terminating worker for supervised restart")

    from app.db.session import SessionLocal
    from app.services.scheduler_heartbeat_service import record_scheduler_heartbeat

    with SessionLocal.begin() as session:
        record_scheduler_heartbeat(
            session,
            instance_id=instance_id,
            is_leader=True,
            backend_pid=lease.backend_pid,
            started_at=started_at,
        )


async def _monitor_leadership(lease, instance_id: UUID, started_at: datetime) -> None:
    from app.core.config import get_settings

    interval = get_settings().scheduler_heartbeat_interval_seconds
    while True:
        await asyncio.to_thread(_heartbeat_cycle, lease, instance_id, started_at)
        await asyncio.sleep(interval)


async def _run() -> None:
    try:
        from apscheduler.schedulers.asyncio import AsyncIOScheduler
    except ModuleNotFoundError as exc:
        raise RuntimeError(
            "APScheduler not installed; dedicated scheduler worker cannot start."
        ) from exc

    register_all_jobs()

    from app.core.leader_lock import SchedulerLease
    from app.db.session import engine

    lease = SchedulerLease(engine)
    if not lease.acquire():
        raise RuntimeError("scheduler leadership unavailable; refusing to idle without owning scheduled work")

    scheduler = AsyncIOScheduler(timezone="UTC")
    schedule_all_jobs(scheduler)
    scheduler.start()
    instance_id = uuid4()
    started_at = datetime.now(UTC)
    logger.info("worker scheduler started instance_id=%s", instance_id)
    try:
        stop_task = asyncio.create_task(_wait_forever(), name="scheduler-stop-wait")
        monitor_task = asyncio.create_task(
            _monitor_leadership(lease, instance_id, started_at),
            name="scheduler-leadership-monitor",
        )
        done, pending = await asyncio.wait(
            {stop_task, monitor_task},
            return_when=asyncio.FIRST_COMPLETED,
        )
        for task in pending:
            task.cancel()
        await asyncio.gather(*pending, return_exceptions=True)
        for task in done:
            task.result()
    finally:
        if scheduler.running:
            scheduler.shutdown(wait=False)
        lease.release()
        logger.info("worker scheduler stopped")


async def _wait_forever() -> None:
    """Block until SIGINT/SIGTERM, resolving to a clean shutdown."""
    stop = asyncio.Event()
    loop = asyncio.get_running_loop()
    for sig in (signal.SIGINT, signal.SIGTERM):
        try:
            loop.add_signal_handler(sig, stop.set)
        except NotImplementedError:  # pragma: no cover - Windows lacks add_signal_handler
            pass
    await stop.wait()


def main() -> None:
    logging.basicConfig(level=logging.INFO)
    try:
        asyncio.run(_run())
    except (KeyboardInterrupt, SystemExit):  # pragma: no cover - signal path
        pass


if __name__ == "__main__":
    main()
