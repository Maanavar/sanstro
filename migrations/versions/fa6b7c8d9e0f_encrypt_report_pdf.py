"""Encrypt `reports.pdf` at rest (A12 Option C).

The delivered document repeats the birth place, the birth date and the planet
longitudes -- every one of them a column that is ciphertext in
`birth_profiles`, `charts` and `chart_planets` by owner ruling. Storing the PDF
as a plain blob put all of them back into a readable dump through a new table,
which is the finding A12 Option C exists to close.

The PDF's own compression is not protection, and this was measured rather than
assumed: reportlab writes `/Filter [ /ASCII85Decode /FlateDecode ]`, so an
ASCII85-decode and an inflate -- two standard transforms, no key -- recover the
birth place as a substring.

**No column type change.** Every encrypted type in `app/db/encrypted_types.py`
stores `LargeBinary`, and `reports.pdf` is already `bytea`, so this migration
only converts the *contents* of existing rows. `byte_size` and `sha256`
describe the plaintext document and are deliberately left alone: they are what
proves a re-download is byte-identical, and the ciphertext's length is not a
fact about the document anyone wants.

Reversible, and safe to re-run in either direction: a Fernet token begins with
`gAAAAA` and a PDF with `%PDF-`, so each direction skips rows that are already
in the target state rather than double-encrypting or failing.

**Requires the encryption key.** Without one it refuses, rather than leaving
every row in plaintext while reporting success.

Revision ID: fa6b7c8d9e0f
Revises: de4f5a6b7c8d
Create Date: 2026-11-05 10:05:00.000000
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "fa6b7c8d9e0f"
down_revision = "de4f5a6b7c8d"
branch_labels = None
depends_on = None

_BATCH = 50  # PDFs are far larger than the scalar columns the A12 migration moved.

#: A Fernet token is base64url of a payload whose first byte is 0x80, which
#: always renders as this prefix. A PDF starts with `%PDF-`. Neither can be
#: mistaken for the other, so the direction of each row is unambiguous.
_FERNET_PREFIX = b"gAAAAA"
_PDF_PREFIX = b"%PDF-"


def _require_key() -> None:
    from app.core.encryption import configured_keys

    if not configured_keys():
        raise RuntimeError(
            "JOTHIDAM_ENCRYPTION_KEY (or JOTHIDAM_ENCRYPTION_KEYS) must be set before "
            "running this migration: it encrypts delivered report documents, and "
            "without a key it would leave every row in plaintext while reporting success."
        )


def _convert(*, to_ciphertext: bool) -> None:
    """Rewrite every `reports.pdf` that is not already in the target state."""
    _require_key()
    from app.core.encryption import decrypt_bytes, encrypt_bytes

    connection = op.get_bind()
    select_first = sa.text("SELECT id, pdf FROM reports ORDER BY id LIMIT :limit")
    select_after = sa.text(
        "SELECT id, pdf FROM reports WHERE id > :last ORDER BY id LIMIT :limit"
    )
    update = sa.text("UPDATE reports SET pdf = :pdf WHERE id = :id")

    skip_prefix = _FERNET_PREFIX if to_ciphertext else _PDF_PREFIX
    last = None
    while True:
        statement = select_first if last is None else select_after
        params = {"limit": _BATCH} if last is None else {"last": last, "limit": _BATCH}
        rows = connection.execute(statement, params).fetchall()
        if not rows:
            return
        for row_id, blob in rows:
            last = row_id
            if blob is None:
                continue
            raw = bytes(blob)
            if raw.startswith(skip_prefix):
                # Already converted; re-running must be a no-op, not a
                # double-encrypt or an InvalidToken.
                continue
            converted = encrypt_bytes(raw) if to_ciphertext else decrypt_bytes(raw)
            connection.execute(update, {"pdf": converted, "id": row_id})


def upgrade() -> None:
    _convert(to_ciphertext=True)


def downgrade() -> None:
    _convert(to_ciphertext=False)
