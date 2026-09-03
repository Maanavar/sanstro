"""Re-encrypt every encrypted column under the newest key.

Step 2 of the three-step rotation described in `app/core/encryption.py`:

1. Prepend the new key to ``JOTHIDAM_ENCRYPTION_KEYS`` (newest first) and
   deploy. New writes use it; old rows still decrypt under the old key.
2. **This script.** Re-encrypts existing rows.
3. Drop the old key from the list.

Running step 3 before this finishes makes every row still holding old ciphertext
permanently unreadable. Fernet cannot tell you which key a token needs — only
whether the ones you offered worked — so there is no way to find them
afterwards.

Usage:

    python -m scripts.rotate_encryption_key --dry-run    # counts, writes nothing
    python -m scripts.rotate_encryption_key

Safe to interrupt and safe to re-run. ``MultiFernet.rotate`` accepts ciphertext
already written under the newest key and simply re-wraps it, so a second pass
over an already-rotated row is a no-op in effect. It is *not* safe to run while
a deploy has only the new key configured — see step 3.

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

import sqlalchemy as sa

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


def rotate_table(session, table: str, pk: str, columns: tuple[str, ...], dry_run: bool) -> int:
    """Re-encrypt one table. Returns the number of values rewritten."""
    selected = ", ".join(columns)
    rewritten = 0
    last_id = None

    while True:
        if last_id is None:
            sql = f"SELECT {pk}, {selected} FROM {table} ORDER BY {pk} LIMIT :limit"  # noqa: S608
            params: dict[str, object] = {"limit": _BATCH}
        else:
            sql = (
                f"SELECT {pk}, {selected} FROM {table} "  # noqa: S608
                f"WHERE {pk} > :last ORDER BY {pk} LIMIT :limit"
            )
            params = {"last": last_id, "limit": _BATCH}
        rows = session.execute(sa.text(sql), params).fetchall()
        if not rows:
            break

        for row in rows:
            row_id = row[0]
            updates: dict[str, object] = {}
            for offset, column in enumerate(columns, start=1):
                value = row[offset]
                if value is None:
                    continue
                # Raw bytes on purpose: this reads through the SQL layer, not the
                # ORM, so the EncryptedX TypeDecorators never run. Rotation must
                # not decrypt to a Python date/float and re-serialise it — that
                # would risk changing the stored value's formatting, and it is
                # not what rotation means.
                updates[column] = rotate_bytes(bytes(value))
                rewritten += 1
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

    return rewritten


def main(argv: list[str] | None = None) -> int:
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Report what would be rewritten without writing anything.",
    )
    args = parser.parse_args(argv)

    keys = configured_keys()
    if not keys:
        logger.error(
            "No encryption key configured. Set JOTHIDAM_ENCRYPTION_KEYS "
            "(newest first) or JOTHIDAM_ENCRYPTION_KEY."
        )
        return 2
    if len(keys) == 1:
        # Not an error — re-wrapping under the same key is harmless — but it is
        # almost certainly not what the operator meant, and saying so here is
        # cheaper than them discovering it at step 3.
        logger.warning(
            "Only one key is configured, so this will re-encrypt every row under "
            "the key it already uses. A rotation needs the new key FIRST and the "
            "old key still present: JOTHIDAM_ENCRYPTION_KEYS=<new>,<old>"
        )

    total = 0
    session = SessionLocal()
    try:
        for table, pk, columns in ENCRYPTED_COLUMNS:
            count = rotate_table(session, table, pk, columns, args.dry_run)
            total += count
            logger.info("%-16s %6d values%s", table, count, " (dry run)" if args.dry_run else "")
    except Exception:
        session.rollback()
        logger.exception("Rotation failed. Already-committed batches are rotated and valid.")
        return 1
    finally:
        session.close()

    if args.dry_run:
        logger.info("Dry run: %d values would be re-encrypted. Nothing written.", total)
    else:
        logger.info(
            "Re-encrypted %d values. It is now safe to drop the old key from "
            "JOTHIDAM_ENCRYPTION_KEYS.",
            total,
        )
    return 0


if __name__ == "__main__":
    sys.exit(main())
