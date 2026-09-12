"""Re-encrypt every encrypted column under the newest key, and prove it worked.

Stages 3 and 4 of the four-stage rotation in docs/SEC1_SECRET_CUSTODY_RULING.md
§8 (the three-step version in `app/core/encryption.py` is the same process with
ADD and SWITCH counted as one deploy):

1. ADD — the new key joins ``JOTHIDAM_ENCRYPTION_KEYS``, old key still present.
2. SWITCH — new writes use it (automatic: the list is newest-first).
3. RE-ENCRYPT — **this script**, no flags. Rewrites existing rows.
4. VERIFY + RETIRE — **this script, ``--verify``**. Then back up, then drop the
   old key.

Running step 4's retirement before step 3 finishes makes every row still holding
old ciphertext permanently unreadable. Fernet cannot tell you which key a token
needs — only whether the ones you offered worked — so there is no way to find
them afterwards.

Usage:

    python -m scripts.rotate_encryption_key --dry-run    # counts, writes nothing
    python -m scripts.rotate_encryption_key              # stage 3
    python -m scripts.rotate_encryption_key --verify     # stage 4, read-only

``--verify`` is the answer to "is it actually safe to drop the old key". It
decrypts every stored value with the newest key **alone** and counts what fails,
which is the only question that matters and the one the re-encryption pass
cannot answer: ``MultiFernet.rotate`` succeeds under any configured key, so a
clean run of stage 3 proves nothing about which key a row now needs. Exits 0
only when no row requires an older key.

Safe to interrupt and safe to re-run. ``MultiFernet.rotate`` accepts ciphertext
already written under the newest key and simply re-wraps it, so a second pass
over an already-rotated row is a no-op in effect. It is *not* safe to run while
a deploy has only the new key configured — see step 4.

Retiring a key is not destroying it. A database backup taken before the rotation
still contains old-key ciphertext; restore it after the key is gone and the
restore is useless. Keep the old key in archival escrow for at least as long as
the backups that might need it. See docs/DATA_PROTECTION.md.

Every column is listed explicitly rather than discovered by reflection. A column
that gets encrypted later and is not added here would be silently skipped, and
the failure would appear as unreadable data at step 3 rather than as an error
now — so `test_encryption_rotation.py` asserts this list matches the model
metadata, and fails when a new encrypted column appears.
"""
from __future__ import annotations

import argparse
import logging
import sys
from dataclasses import dataclass

import sqlalchemy as sa
from cryptography.fernet import Fernet, InvalidToken

from app.core.encryption import configured_keys, rotate_bytes
from app.db.session import SessionLocal

logger = logging.getLogger("rotate_encryption_key")

# (table, primary key column, [encrypted columns]). Keep in step with the models;
# tests/test_encryption_rotation.py enforces that.
ENCRYPTED_COLUMNS: tuple[tuple[str, str, tuple[str, ...]], ...] = (
    (
        "birth_profiles",
        "birth_profile_id",
        (
            "birth_date_local",
            "birth_time_local",
            "birth_latitude",
            "birth_longitude",
            # Plain LargeBinary in the model, encrypted by hand in
            # app/services/_chart_persist.py rather than by a TypeDecorator. It
            # therefore does not look encrypted to the metadata scan in
            # tests/test_encryption_rotation.py — which is exactly why that test
            # keeps its own list of hand-encrypted columns instead of trusting
            # the scan to be complete.
            "encrypted_birth_payload",
        ),
    ),
    ("journal_entries", "journal_id", ("note_text",)),
)

_BATCH = 500


@dataclass
class Census:
    """What a pass found. Field names are what gets printed, near enough."""

    scanned: int = 0
    already_newest: int = 0
    rewritten: int = 0
    needs_older_key: int = 0
    unreadable: int = 0

    def __iadd__(self, other: Census) -> Census:
        self.scanned += other.scanned
        self.already_newest += other.already_newest
        self.rewritten += other.rewritten
        self.needs_older_key += other.needs_older_key
        self.unreadable += other.unreadable
        return self


def _newest_only() -> Fernet:
    """A Fernet holding the encrypting key alone.

    The whole point of the verify pass. ``get_fernet()`` returns a MultiFernet
    that decrypts under *any* configured key, so asking it whether a row is
    readable answers a question nobody needs. Retirement turns on whether the
    row is readable once the older keys are gone, which only this can answer.
    """
    keys = configured_keys()
    if not keys:
        raise RuntimeError("No encryption key configured.")
    return Fernet(keys[0].encode())


def _page(session, table: str, pk: str, selected: str, last_id):
    """One keyset page. Both passes paginate identically; only the work differs."""
    if last_id is None:
        sql = f"SELECT {pk}, {selected} FROM {table} ORDER BY {pk} LIMIT :limit"  # noqa: S608
        params: dict[str, object] = {"limit": _BATCH}
    else:
        sql = (
            f"SELECT {pk}, {selected} FROM {table} "  # noqa: S608
            f"WHERE {pk} > :last ORDER BY {pk} LIMIT :limit"
        )
        params = {"last": last_id, "limit": _BATCH}
    return session.execute(sa.text(sql), params).fetchall()


def _iter_rows(session, table: str, pk: str, columns: tuple[str, ...]):
    """Keyset-paginate one table, yielding (row_id, column, value) per value."""
    selected = ", ".join(columns)
    last_id = None
    while True:
        rows = _page(session, table, pk, selected, last_id)
        if not rows:
            return
        for row in rows:
            for offset, column in enumerate(columns, start=1):
                if row[offset] is not None:
                    yield row[0], column, bytes(row[offset])
        last_id = rows[-1][0]


def verify_table(session, table: str, pk: str, columns: tuple[str, ...]) -> Census:
    """Stage 4. Read-only: can the newest key alone read every stored value?

    Three outcomes per value, and only one of them permits retiring a key:
    readable by the newest key (fine), readable only by an older one (rotation
    is incomplete — retiring now destroys this row), readable by nothing we hold
    (already broken, and worth knowing before a restore discovers it).
    """
    newest = _newest_only()
    from app.core.encryption import get_fernet

    every_key = get_fernet()
    census = Census()

    for row_id, column, value in _iter_rows(session, table, pk, columns):
        census.scanned += 1
        try:
            newest.decrypt(value)
            census.already_newest += 1
            continue
        except InvalidToken:
            pass
        try:
            every_key.decrypt(value)
            census.needs_older_key += 1
            # Identify the row so it can be looked at, never the plaintext.
            logger.warning("%s.%s id=%s still requires an older key", table, column, row_id)
        except InvalidToken:
            census.unreadable += 1
            logger.error("%s.%s id=%s is readable by NO configured key", table, column, row_id)
    return census


def rotate_table(session, table: str, pk: str, columns: tuple[str, ...], dry_run: bool) -> Census:
    """Stage 3. Re-encrypt one table under the newest key."""
    selected = ", ".join(columns)
    census = Census()
    newest = _newest_only()
    last_id = None

    while True:
        rows = _page(session, table, pk, selected, last_id)
        if not rows:
            break

        for row in rows:
            row_id = row[0]
            updates: dict[str, object] = {}
            for offset, column in enumerate(columns, start=1):
                value = row[offset]
                if value is None:
                    continue
                census.scanned += 1
                # Already under the newest key: skip the write entirely. Makes a
                # re-run after an interruption cost reads instead of rewriting
                # every row again, and it is what separates "already newest" from
                # "migrated" in the summary — a distinction the caller needs and
                # MultiFernet.rotate cannot provide, since it succeeds silently
                # under any configured key.
                try:
                    newest.decrypt(bytes(value))
                    census.already_newest += 1
                    continue
                except InvalidToken:
                    pass
                # Raw bytes on purpose: this reads through the SQL layer, not the
                # ORM, so the EncryptedX TypeDecorators never run. Rotation must
                # not decrypt to a Python date/float and re-serialise it — that
                # would risk changing the stored value's formatting, and it is
                # not what rotation means.
                updates[column] = rotate_bytes(bytes(value))
                census.rewritten += 1
            if updates and not dry_run:
                assignments = ", ".join(f"{c} = :{c}" for c in updates)
                session.execute(
                    sa.text(f"UPDATE {table} SET {assignments} WHERE {pk} = :__id"),  # noqa: S608
                    {**updates, "__id": row_id},
                )
        last_id = rows[-1][0]
        if not dry_run:
            # Commit per batch so an interruption keeps the work already done.
            # Re-running is a no-op on rotated rows, so partial progress is fine.
            session.commit()

    return census


def main(argv: list[str] | None = None) -> int:
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Report what would be rewritten without writing anything.",
    )
    parser.add_argument(
        "--verify",
        action="store_true",
        help=(
            "Stage 4. Read-only census: decrypt every stored value with the "
            "NEWEST key alone and report what still needs an older one. Exits "
            "non-zero unless nothing does. Run this before retiring a key."
        ),
    )
    args = parser.parse_args(argv)

    if args.verify and args.dry_run:
        # --verify never writes, so --dry-run alongside it is either a
        # misunderstanding of one flag or the other. Say so rather than picking.
        parser.error("--verify is already read-only; drop --dry-run.")

    keys = configured_keys()
    if not keys:
        logger.error(
            "No encryption key configured. Set JOTHIDAM_ENCRYPTION_KEYS "
            "(newest first) or JOTHIDAM_ENCRYPTION_KEY."
        )
        return 2
    if args.verify:
        return _verify(keys)
    if len(keys) == 1:
        # Not an error — re-wrapping under the same key is harmless — but it is
        # almost certainly not what the operator meant, and saying so here is
        # cheaper than them discovering it at step 3.
        logger.warning(
            "Only one key is configured, so this will re-encrypt every row under "
            "the key it already uses. A rotation needs the new key FIRST and the "
            "old key still present: JOTHIDAM_ENCRYPTION_KEYS=<new>,<old>"
        )

    total = Census()
    session = SessionLocal()
    try:
        for table, pk, columns in ENCRYPTED_COLUMNS:
            found = rotate_table(session, table, pk, columns, args.dry_run)
            total += found
            logger.info(
                "%-16s %6d scanned  %6d already newest  %6d rewritten%s",
                table,
                found.scanned,
                found.already_newest,
                found.rewritten,
                " (dry run)" if args.dry_run else "",
            )
    except Exception:
        session.rollback()
        logger.exception("Rotation failed. Already-committed batches are rotated and valid.")
        return 1
    finally:
        session.close()

    if args.dry_run:
        logger.info("Dry run: %d values would be re-encrypted. Nothing written.", total.rewritten)
    else:
        # Deliberately does NOT say the old key is safe to drop. This pass
        # cannot know: MultiFernet.rotate succeeds under any configured key, so
        # finishing without an exception is not evidence about which key a row
        # needs. --verify is what answers that.
        logger.info(
            "Re-encrypted %d values (%d were already under the newest key). "
            "Now run --verify; do not drop the old key until it passes.",
            total.rewritten,
            total.already_newest,
        )
    return 0


def _verify(keys: list[str]) -> int:
    """Stage 4. Census every stored value against the newest key alone."""
    if len(keys) == 1:
        logger.info(
            "Only one key is configured, so this verifies that every row reads "
            "under it — which is the right check after a completed rotation."
        )

    total = Census()
    session = SessionLocal()
    try:
        for table, pk, columns in ENCRYPTED_COLUMNS:
            found = verify_table(session, table, pk, columns)
            total += found
            logger.info(
                "%-16s %6d scanned  %6d newest  %6d need older  %6d unreadable",
                table,
                found.scanned,
                found.already_newest,
                found.needs_older_key,
                found.unreadable,
            )
    except Exception:
        logger.exception("Verification failed; treat the result as unknown, not as a pass.")
        return 1
    finally:
        session.close()

    logger.info("")
    logger.info("Total encrypted fields scanned: %10d", total.scanned)
    logger.info("Readable by newest key:         %10d", total.already_newest)
    logger.info("Still requiring an older key:   %10d", total.needs_older_key)
    logger.info("Unreadable by any key:          %10d", total.unreadable)
    logger.info("")

    if total.unreadable:
        logger.error(
            "%d value(s) cannot be read by ANY configured key. A key is missing "
            "from JOTHIDAM_ENCRYPTION_KEYS, or the data is corrupt. Do not retire "
            "anything; restore from backup is the recovery path here.",
            total.unreadable,
        )
        return 1
    if total.needs_older_key:
        logger.error(
            "%d value(s) still require an older key. Rotation is INCOMPLETE — run "
            "this script with no flags, then verify again. Retiring the old key "
            "now makes those values permanently unreadable.",
            total.needs_older_key,
        )
        return 1

    logger.info(
        "No value requires an older key. Take a backup, then the old key may be "
        "dropped from JOTHIDAM_ENCRYPTION_KEYS. Retiring it from active use is "
        "NOT the same as destroying it: keep it in escrow at least as long as "
        "the backups that might still need it. See docs/DATA_PROTECTION.md."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
