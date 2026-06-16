"""
Panchangam cache pre-warm cron.

The panchangam for any (date, location) is computed from the Swiss Ephemeris and
then cached in ``panchangam_cache`` (see ``app.calculations.panchangam``). The
first request for a cold (date, location) pays the full ephemeris cost — and a
monthly calendar load multiplies that by ~30 days, which is what makes the first
dashboard/calendar load after signup feel slow.

This job runs nightly (wired in ``main.py`` behind the scheduler leader lock) and
pre-computes the next ``PREWARM_DAYS`` days for a small set of popular locations,
so by the time a user opens the calendar every day is a warm cache hit (a single
bulk SELECT, zero ephemeris work).

It is intentionally a plain, side-effect-only function so APScheduler can invoke
it directly, and so it can be called from a management script or a test.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import UTC, date, datetime, timedelta

from sqlalchemy.orm import Session

from app.calculations.panchangam import calculate_daily_panchangam_range
from app.db.session import SessionLocal

logger = logging.getLogger(__name__)

# How many days forward to pre-compute (today through today + PREWARM_DAYS - 1).
# A calendar view shows the current month plus look-ahead, so ~45 days keeps the
# whole visible window warm regardless of which day of the month a user signs up.
PREWARM_DAYS = 45


@dataclass(frozen=True)
class PrewarmLocation:
    name: str
    latitude: float
    longitude: float
    timezone: str


# Popular locations to keep warm. These are the city centroids the app uses for
# the common case (Tamil Nadu cities plus the metros where most users sign up).
# A user whose exact GPS differs still computes their own day once, then it is
# cached too — this list just removes the cold path for the bulk of signups.
DEFAULT_PREWARM_LOCATIONS: tuple[PrewarmLocation, ...] = (
    PrewarmLocation("Chennai", 13.0827, 80.2707, "Asia/Kolkata"),
    PrewarmLocation("Coimbatore", 11.0168, 76.9558, "Asia/Kolkata"),
    PrewarmLocation("Madurai", 9.9252, 78.1198, "Asia/Kolkata"),
    PrewarmLocation("Tiruchirappalli", 10.7905, 78.7047, "Asia/Kolkata"),
    PrewarmLocation("Salem", 11.6643, 78.1460, "Asia/Kolkata"),
    PrewarmLocation("Tirunelveli", 8.7139, 77.7567, "Asia/Kolkata"),
    PrewarmLocation("Bengaluru", 12.9716, 77.5946, "Asia/Kolkata"),
    PrewarmLocation("Mumbai", 19.0760, 72.8777, "Asia/Kolkata"),
    PrewarmLocation("Delhi", 28.6139, 77.2090, "Asia/Kolkata"),
)


def prewarm_panchangam_cache(
    session: Session,
    *,
    start_date: date | None = None,
    days: int = PREWARM_DAYS,
    locations: tuple[PrewarmLocation, ...] = DEFAULT_PREWARM_LOCATIONS,
) -> dict[str, int]:
    """Compute and cache panchangam for ``days`` days at each location.

    Relies on ``calculate_daily_panchangam_range``, which only computes (and
    stores) the days that are not already cached, so re-running this is cheap.

    Returns a summary: ``{locations, days, warmed, errors}`` where ``warmed`` is
    the number of (location, day) snapshots computed or read this run.
    """
    first_day = start_date or datetime.now(tz=UTC).date()
    last_day = first_day + timedelta(days=max(1, days) - 1)

    warmed = 0
    errors = 0
    for location in locations:
        try:
            snapshots = calculate_daily_panchangam_range(
                first_day,
                last_day,
                location.latitude,
                location.longitude,
                location.timezone,
                session=session,
            )
            session.commit()
            warmed += len(snapshots)
        except Exception as exc:  # pragma: no cover - defensive; logged and skipped
            session.rollback()
            errors += 1
            logger.error("panchangam_prewarm_error location=%s exc=%s", location.name, exc)

    logger.info(
        "panchangam_prewarm_done locations=%s days=%s warmed=%s errors=%s",
        len(locations),
        days,
        warmed,
        errors,
    )
    return {"locations": len(locations), "days": days, "warmed": warmed, "errors": errors}


def run_panchangam_prewarm_cron() -> dict[str, int]:
    """Scheduler entry point — opens its own session and pre-warms popular locations."""
    with SessionLocal() as session:
        return prewarm_panchangam_cache(session)
