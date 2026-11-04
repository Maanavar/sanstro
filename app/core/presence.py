"""Last-seen tracking, the base of every business metric in spec §8 (L6).

D-11 computes the core metrics server-side from Vinaadi's own database rather
than from PostHog, because they have to be right whether or not the account
granted product analytics. This module is that source: one row per account per
IST day, written off the authenticated request path.

Three properties are deliberate, and all three matter if this is ever changed:

**At most one write per account per day.** `get_current_user` runs on every
authenticated request, so the naive version is a write per request — tens of
thousands of UPDATEs on `users` a day, each one a row version Postgres must
vacuum, all to store a date that did not change. The guard is the `last_seen_on
IS DISTINCT FROM :today` predicate in SQL, not a Python read-then-write: two
concurrent requests from the same account both read "yesterday", and letting
the database settle it means the loser updates nothing instead of racing.

**Its own session, committed on its own.** It must not join the request's
transaction. A handler that later raises would roll this back (losing the day),
and worse, committing the caller's session here would flush half-built handler
state early. `app/services/ask_cost_service.py` does the same for the same
reason.

**Never fatal.** Presence is telemetry. A metrics write that fails must not turn
a working request into a 500, so everything is swallowed and logged.

In `app/core` rather than `app/services` because `get_current_user` is its only
writer and `tests/test_dependency_direction.py` forbids core from importing the
service layer. It earns the place: a clock, a closed enum and one UPDATE, with
no domain logic — the same shape as `app/core/clock.py`.
"""
from __future__ import annotations

import logging
from datetime import date
from uuid import UUID

from sqlalchemy import text

from app.core.clock import SYSTEM_CLOCK, Clock, accounting_date
from app.db.session import SessionLocal

logger = logging.getLogger(__name__)

# Closed sets. A header is attacker-controlled, so an unrecognised value is
# dropped rather than stored: these columns are grouped over in metrics
# queries, and free text would turn one bad client into a hundred fake groups.
# The same three platforms as `app.privacy.consent.Channel`, read off the same
# `X-Vinaadi-Client` header.
PLATFORMS = frozenset({"web", "ios", "android"})
LANGUAGES = frozenset({"ta", "en"})


def normalize_platform(value: str | None) -> str | None:
    """The client, or None when the header is absent or unrecognised.

    `consent_channel` reads a missing header as "web" because a consent record
    needs a channel and the web is the only client that used to send none. A
    metric must not invent one: a cron job, a test or an old build would be
    counted as web traffic. Null here means "not stated", and the web sends the
    header explicitly (`web/lib/api.ts`).
    """
    if not value:
        return None
    candidate = value.strip().lower()
    return candidate if candidate in PLATFORMS else None


def normalize_language(value: str | None) -> str | None:
    if not value:
        return None
    candidate = value.strip().lower()[:2]
    return candidate if candidate in LANGUAGES else None


def touch_last_seen(
    user_id: UUID,
    *,
    platform: str | None = None,
    language: str | None = None,
    clock: Clock = SYSTEM_CLOCK,
) -> bool:
    """Record that this account was active today. True when a row was written.

    Returns False on the overwhelmingly common path — already seen today — so
    callers and tests can assert the once-a-day property directly.
    """
    today = accounting_date(clock=clock)
    try:
        with SessionLocal() as session, session.begin():
            result = session.execute(
                text(
                    """
                    UPDATE users
                       SET last_seen_on = :today,
                           last_platform = COALESCE(:platform, last_platform),
                           last_language = COALESCE(:language, last_language)
                     WHERE user_id = :uid
                       AND (last_seen_on IS DISTINCT FROM :today)
                    """
                ),
                {
                    "today": today,
                    "platform": normalize_platform(platform),
                    "language": normalize_language(language),
                    "uid": user_id,
                },
            )
            return bool(result.rowcount)
    except Exception:  # noqa: BLE001 - telemetry must never fail a request
        logger.warning("last_seen write failed for %s", user_id, exc_info=True)
        return False


def active_user_ids(day: date, session) -> list[UUID]:  # type: ignore[no-untyped-def]
    """Accounts active on one IST day — the §8 "active user (day)" definition.

    Here rather than in a query helper so the definition has one home; the
    rollup job (deferred to L+30) and any admin tile both read it.
    """
    rows = session.execute(
        text("SELECT user_id FROM users WHERE last_seen_on = :day"), {"day": day}
    )
    return [row[0] for row in rows]
