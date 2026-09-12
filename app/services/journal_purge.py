"""Hard-delete of archived journal entries (P2-1).

Journal deletion has always been an archive: `delete_journal_entry` and
`apply_journal_retention_window` both set `deleted_at` and nothing ever removes
the row. So a user who deleted an entry still has their text in the database
indefinitely, and application-level encryption does not change that — a key that
is present decrypts a row that was never deleted.

This is the mechanism that makes the retention policy in
`docs/DATA_PROTECTION.md` true rather than stated.

## It is off by default, and stays off until someone chooses a number

`journal_purge_after_days` defaults to `0`, meaning never purge. This is not
timidity — it is that the correct window is a product and legal decision, not a
default an engineer should pick on someone's behalf, and the failure mode of
guessing is permanent deletion of a user's writing.

Turning it on deletes rows for real, with no undo. The grace period is measured
from `deleted_at`, so nothing is purged that the user has not already deleted or
that their own retention window has not already archived.
"""
from __future__ import annotations

import logging
from datetime import UTC, datetime, timedelta

from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.session import SessionLocal
from app.models.journal_entry import JournalEntry

logger = logging.getLogger(__name__)


def purge_archived_journal_entries(
    session: Session,
    *,
    older_than_days: int,
    as_of: datetime | None = None,
    dry_run: bool = False,
) -> int:
    """Permanently delete entries archived more than ``older_than_days`` ago.

    Returns the number of rows deleted (or that would be, when ``dry_run``).
    ``older_than_days <= 0`` deletes nothing and is the configured default —
    guarded here as well as at the caller, because this function is importable
    and a future caller must not be able to purge by passing a stray 0.
    """
    if older_than_days <= 0:
        return 0

    now = as_of or datetime.now(tz=UTC)
    threshold = now - timedelta(days=older_than_days)

    # deleted_at IS NOT NULL is the load-bearing half: only rows the user or
    # their retention window already archived are eligible. A live entry is
    # never in scope however old it is.
    condition = (JournalEntry.deleted_at.is_not(None)) & (JournalEntry.deleted_at < threshold)

    if dry_run:
        return int(
            session.execute(select(func.count()).select_from(JournalEntry).where(condition)).scalar_one()
        )

    result = session.execute(delete(JournalEntry).where(condition))
    deleted = int(result.rowcount or 0)
    session.commit()
    return deleted


def run_journal_purge_cron() -> None:
    """Scheduled entry point. A no-op unless a retention window is configured."""
    settings = get_settings()
    days = int(getattr(settings, "journal_purge_after_days", 0) or 0)
    if days <= 0:
        logger.info("journal_purge_skipped: no retention window configured")
        return

    with SessionLocal() as session:
        deleted = purge_archived_journal_entries(session, older_than_days=days)

    # Logged at INFO with a count and no content: this is an irreversible
    # deletion and an operator needs to be able to see that it ran and how much
    # it took. No journal text, no user ids — see P1-3.
    logger.info("journal_purge_complete: deleted=%d older_than_days=%d", deleted, days)
