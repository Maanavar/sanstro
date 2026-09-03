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

from app.scheduler import register_all_jobs, schedule_all_jobs

logger = logging.getLogger(__name__)


async def _run() -> None:
    try:
        from apscheduler.schedulers.asyncio import AsyncIOScheduler
    except ModuleNotFoundError:
        logger.error("APScheduler not installed; cannot run the worker. Install apscheduler.")
        return

    register_all_jobs()

    from app.core.leader_lock import SchedulerLease
    from app.db.session import engine

    lease = SchedulerLease(engine)
    if not lease.acquire():
        logger.info("Scheduler lock held by another worker; this replica idles as a follower.")
        # Idle so the container stays up (a leader failover can promote it on restart).
        await _wait_forever()
        return

    scheduler = AsyncIOScheduler(timezone="UTC")
    schedule_all_jobs(scheduler)
    scheduler.start()
    logger.info("worker scheduler started")
    try:
        await _wait_forever()
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
