"""Warm the panchangam cache by hand, at deploy, before users do it for you.

The nightly cron (``run_panchangam_prewarm_cron``, wired in ``app/scheduler.py``)
keeps the next 45 days warm for the popular locations. That is enough for steady
state and is **not** enough after a deploy that bumps
``PANCHANGAM_CACHE_DATA_VERSION``: a version bump invalidates every cached row at
once, so the first request for each (date, location) pays full ephemeris cost,
and every consumer goes cold at the same moment. That is a load test, not a
cache miss, and it has already produced one 502 here — the muhurtham-naals
endpoint at the proxy's 300 s limit on 2026-09-09, recorded as D10/§12 of
docs/CHANDRASHTAMA_SURFACE_DIVERGENCE_2026-09-09.md.

So: deploy, then run this, then let traffic in.

    python -m scripts.prewarm_panchangam                  # 45 days, all locations
    python -m scripts.prewarm_panchangam --days 90
    python -m scripts.prewarm_panchangam --locations Chennai,Madurai
    python -m scripts.prewarm_panchangam --list-locations

**What this does NOT warm.** Only the panchangam cache. A deploy that also bumps
``DAILY_SCORE_ENGINE_VERSION`` (as the 2026-09-10 one does: v13 -> v15) discards
every cached daily-guidance row as well, and those are per CHART, not per
location — there is no small set to pre-compute, and they warm on first read.
This script does not touch them. It removes the shared, expensive half of the
cold start; the per-chart half remains.

Safe to interrupt and safe to re-run: ``calculate_daily_panchangam_range`` reads
what is already cached in one bulk SELECT and computes only what is missing, so a
second pass over a warm range is a single query per location.

Exits non-zero if any location failed, so a deploy script can stop on it.
"""
from __future__ import annotations

import argparse
import logging
import sys
import time
from datetime import UTC, date, datetime

from app.db.session import SessionLocal
from app.services.panchangam_prewarm import (
    DEFAULT_PREWARM_LOCATIONS,
    PREWARM_DAYS,
    prewarm_panchangam_cache,
)

logger = logging.getLogger("prewarm_panchangam")


def _select_locations(names: str | None) -> tuple:
    if not names:
        return DEFAULT_PREWARM_LOCATIONS
    wanted = [n.strip().casefold() for n in names.split(",") if n.strip()]
    by_name = {loc.name.casefold(): loc for loc in DEFAULT_PREWARM_LOCATIONS}
    unknown = [n for n in wanted if n not in by_name]
    if unknown:
        raise SystemExit(
            f"unknown location(s): {', '.join(unknown)}. "
            f"Known: {', '.join(loc.name for loc in DEFAULT_PREWARM_LOCATIONS)}"
        )
    return tuple(by_name[n] for n in wanted)


def main(argv: list[str] | None = None) -> int:
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    parser = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--days",
        type=int,
        default=PREWARM_DAYS,
        help=f"Days forward to compute, starting at --start (default {PREWARM_DAYS}).",
    )
    parser.add_argument(
        "--start",
        type=date.fromisoformat,
        default=None,
        help="First day, YYYY-MM-DD (default: today, UTC).",
    )
    parser.add_argument(
        "--locations",
        default=None,
        help="Comma-separated subset of the default locations (default: all).",
    )
    parser.add_argument(
        "--list-locations",
        action="store_true",
        help="Print the known locations and exit without touching the database.",
    )
    args = parser.parse_args(argv)

    if args.list_locations:
        for loc in DEFAULT_PREWARM_LOCATIONS:
            print(f"{loc.name:18s} {loc.latitude:8.4f} {loc.longitude:9.4f}  {loc.timezone}")
        return 0

    if args.days < 1:
        raise SystemExit("--days must be at least 1")

    locations = _select_locations(args.locations)
    first_day = args.start or datetime.now(tz=UTC).date()

    logger.info(
        "prewarming %s location(s) x %s days from %s",
        len(locations), args.days, first_day.isoformat(),
    )
    started = time.time()
    with SessionLocal() as session:
        summary = prewarm_panchangam_cache(
            session,
            start_date=first_day,
            days=args.days,
            locations=locations,
        )
    elapsed = time.time() - started

    logger.info(
        "warmed=%s errors=%s in %.1fs (%.0f ms per location-day)",
        summary["warmed"],
        summary["errors"],
        elapsed,
        1000 * elapsed / max(1, summary["warmed"]),
    )
    if summary["errors"]:
        # Each failing location is logged with its exception by the service; a
        # partial warm is still worth keeping, so this reports rather than
        # rolls back.
        logger.error("prewarm incomplete: %s location(s) failed", summary["errors"])
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
