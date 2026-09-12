"""Encrypt journal_entries.note_text at rest

P2-1. Birth date, time and coordinates have been encrypted since the birth
profile model was written; `note_text` was a plaintext `String(2000)` — free
text a user wrote about their own life, and the most sensitive column in the
table.

This is a *data* migration, not a type change. Every existing row has to be read
as text and written back as Fernet ciphertext, so unlike the recent
metadata-only migrations here, this one rewrites the table and holds a lock for
the length of it. On a large `journal_entries` take the maintenance window.

**It requires the encryption key to be configured.** That is deliberate: the
alternative is a migration that silently leaves rows in plaintext when the key
is missing, which would then be indistinguishable from a completed one. It fails
early and says so instead.

The column is renamed rather than converted in place — add, backfill, drop —
because an in-place `ALTER TYPE ... USING` cannot express "run Python on every
value". The two-column form is also what makes `downgrade()` real: it reverses
by decrypting, and it is tested.

Note the new column is `nullable=True` during backfill and only then made
`NOT NULL`, so the intermediate state is valid at every point.

Revision ID: oo8e9f0a1b2c
Revises: nn7d8e9f0a1b
Create Date: 2026-09-03 10:40:00.000000

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "oo8e9f0a1b2c"
down_revision: str | Sequence[str] | None = "nn7d8e9f0a1b"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

# Rows per round trip. Journal notes are at most 2000 characters, so 500 of them
# is a few megabytes — small enough to hold, large enough that a big table does
# not turn into a per-row chatter storm.
_BATCH = 500


def _require_key() -> None:
    from app.core.encryption import configured_keys

    if not configured_keys():
        raise RuntimeError(
            "JOTHIDAM_ENCRYPTION_KEY (or JOTHIDAM_ENCRYPTION_KEYS) must be set "
            "before running this migration: it encrypts existing journal text, "
            "and without a key it would leave every row in plaintext while "
            "reporting success."
        )


def upgrade() -> None:
    from app.core.encryption import encrypt_bytes

    _require_key()
    conn = op.get_bind()

    with op.batch_alter_table("journal_entries") as batch_op:
        batch_op.add_column(sa.Column("note_text_enc", sa.LargeBinary(), nullable=True))

    # Keyed by primary key rather than OFFSET: OFFSET re-scans the rows it skips
    # and, worse, shifts under any concurrent insert.
    last_id = None
    while True:
        if last_id is None:
            rows = conn.execute(
                sa.text(
                    "SELECT journal_id, note_text FROM journal_entries "
                    "ORDER BY journal_id LIMIT :limit"
                ),
                {"limit": _BATCH},
            ).fetchall()
        else:
            rows = conn.execute(
                sa.text(
                    "SELECT journal_id, note_text FROM journal_entries "
                    "WHERE journal_id > :last ORDER BY journal_id LIMIT :limit"
                ),
                {"last": last_id, "limit": _BATCH},
            ).fetchall()
        if not rows:
            break
        for journal_id, note_text in rows:
            conn.execute(
                sa.text(
                    "UPDATE journal_entries SET note_text_enc = :enc "
                    "WHERE journal_id = :id"
                ),
                {"enc": encrypt_bytes((note_text or "").encode("utf-8")), "id": journal_id},
            )
        last_id = rows[-1][0]

    with op.batch_alter_table("journal_entries") as batch_op:
        batch_op.drop_column("note_text")
    with op.batch_alter_table("journal_entries") as batch_op:
        batch_op.alter_column("note_text_enc", new_column_name="note_text", nullable=False)


def downgrade() -> None:
    """Decrypt back to plaintext.

    Real, and it has to be: an irreversible encryption migration means the only
    way back from a bad deploy is a restore from backup.

    A note longer than 2000 characters cannot exist — the Pydantic schema caps
    it at 2000 and the column it is going back into is `String(2000)` — but if
    one somehow did, this would fail loudly on the constraint rather than
    truncate somebody's writing.
    """
    from app.core.encryption import decrypt_bytes

    _require_key()
    conn = op.get_bind()

    with op.batch_alter_table("journal_entries") as batch_op:
        batch_op.add_column(sa.Column("note_text_plain", sa.String(length=2000), nullable=True))

    last_id = None
    while True:
        if last_id is None:
            rows = conn.execute(
                sa.text(
                    "SELECT journal_id, note_text FROM journal_entries "
                    "ORDER BY journal_id LIMIT :limit"
                ),
                {"limit": _BATCH},
            ).fetchall()
        else:
            rows = conn.execute(
                sa.text(
                    "SELECT journal_id, note_text FROM journal_entries "
                    "WHERE journal_id > :last ORDER BY journal_id LIMIT :limit"
                ),
                {"last": last_id, "limit": _BATCH},
            ).fetchall()
        if not rows:
            break
        for journal_id, blob in rows:
            plain = decrypt_bytes(bytes(blob)).decode("utf-8") if blob is not None else ""
            conn.execute(
                sa.text(
                    "UPDATE journal_entries SET note_text_plain = :plain "
                    "WHERE journal_id = :id"
                ),
                {"plain": plain, "id": journal_id},
            )
        last_id = rows[-1][0]

    with op.batch_alter_table("journal_entries") as batch_op:
        batch_op.drop_column("note_text")
    with op.batch_alter_table("journal_entries") as batch_op:
        batch_op.alter_column("note_text_plain", new_column_name="note_text", nullable=False)
