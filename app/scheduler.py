"""Single source of truth for the background cron jobs.

Both the API process (``app.main`` lifespan, when ``run_scheduler_in_web`` is
true) and the standalone worker (``app.worker``) build their schedule from
``SCHEDULED_JOBS`` here, so the two entrypoints can never drift. Job metadata is
also registered with ``job_registry`` so the admin trigger endpoints work no
matter which process owns the scheduler. See REFACTOR_PLAN 3.3.
"""
from __future__ import annotations

import logging
from collections.abc import Callable
from dataclasses import dataclass, field
from typing import Any

from app.services.daily_push_cron import run_daily_push_cron
from app.services.job_registry import register_job
from app.services.journal_purge import run_journal_purge_cron
from app.services.panchangam_prewarm import run_panchangam_prewarm_cron
from app.services.peyarchi_alert_service import daily_peyarchi_refresh
from app.services.synastry_service import daily_relationship_alert_refresh

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class ScheduledJob:
    id: str
    name: str
    description: str
    func: Callable[[], Any]
    # APScheduler cron trigger kwargs (e.g. hour=2, minute=0).
    trigger: dict[str, int] = field(default_factory=dict)
    # Deletes data, or sends something outward. Admin `jobs/{id}/trigger`
    # requires a short-lived elevation for these; an idempotent recompute needs
    # only the admin session. See P1-4 step 2 in docs/AUDIT_TRIAGE_2026-08-31.md,
    # which pre-committed to exactly this: "If a job that notifies or destroys is
    # registered, move it."
    destructive: bool = False


SCHEDULED_JOBS: tuple[ScheduledJob, ...] = (
    ScheduledJob(
        "daily_peyarchi_refresh",
        "Peyarchi Refresh",
        "Refresh transit alerts for all charts (daily, 02:00 UTC)",
        daily_peyarchi_refresh,
        {"hour": 2, "minute": 0},
    ),
    ScheduledJob(
        "daily_relationship_alert_refresh",
        "Relationship Alerts",
        "Refresh synastry alerts (daily, 02:05 UTC)",
        daily_relationship_alert_refresh,
        {"hour": 2, "minute": 5},
    ),
    ScheduledJob(
        "daily_push_cron",
        "Daily Push Notifications",
        "Send morning guidance push (hourly, per-user timezone window)",
        run_daily_push_cron,
        {"minute": 0},  # every hour on the hour; per-user window checked inside
    ),
    ScheduledJob(
        "panchangam_prewarm",
        "Panchangam Prewarm",
        "Pre-warm panchangam cache for popular locations (daily, 02:10 UTC)",
        run_panchangam_prewarm_cron,
        {"hour": 2, "minute": 10},
    ),
    # The only job here that DESTROYS data, and therefore the first `destructive`
    # one. P1-4 step 2 left `jobs/{id}/trigger` unelevated on the explicit
    # grounds that "every entry in scheduler.SCHEDULED_JOBS is an idempotent
    # recompute that sends nothing outward. If a job that notifies or destroys is
    # registered, move it." This is that job.
    #
    # It is a no-op unless an operator has configured a retention window, so on a
    # default deployment it destroys nothing either way — but relying on that
    # would make the safety of an access control depend on an unrelated setting.
    ScheduledJob(
        "journal_purge",
        "Journal Hard Delete",
        "Permanently delete journal entries archived beyond the retention window "
        "(daily, 03:00 UTC; disabled unless JOTHIDAM_JOURNAL_PURGE_AFTER_DAYS > 0)",
        run_journal_purge_cron,
        {"hour": 3, "minute": 0},
        destructive=True,
    ),
)


def register_all_jobs() -> None:
    """Register every job's metadata + callable with the job registry.

    Safe to call from any process; it only populates the in-process registry the
    admin trigger endpoints read from.
    """
    for job in SCHEDULED_JOBS:
        register_job(job.id, job.name, job.description, job.func, destructive=job.destructive)


def schedule_all_jobs(scheduler: Any) -> None:
    """Add every job to an APScheduler instance as a cron trigger."""
    for job in SCHEDULED_JOBS:
        scheduler.add_job(job.func, "cron", id=job.id, replace_existing=True, **job.trigger)
        logger.info("scheduled job=%s trigger=%s", job.id, job.trigger)
