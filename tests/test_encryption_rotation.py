"""P2-1 — journal encryption at rest, and key versioning.

Two things are being pinned here. That journal text is genuinely ciphertext in
the database, asserted against the raw column rather than against the ORM (the
ORM would decrypt it and the test would pass no matter what was stored). And
that a key rotation works end to end, because a rotation that only half works is
discovered when the old key is dropped and the data is already unreadable.
"""
from __future__ import annotations

import uuid

import pytest
import sqlalchemy as sa
from cryptography.fernet import Fernet, InvalidToken, MultiFernet

from app.core import encryption as core_encryption
from app.db.session import SessionLocal
from app.services.encryption import EncryptedString

OLD_KEY = Fernet.generate_key().decode()
NEW_KEY = Fernet.generate_key().decode()


@pytest.fixture
def keys(monkeypatch):
    """Swap the process key list, and put it back. Yields a setter."""
    from app.core.config import get_settings

    settings = get_settings()

    def _set(*key_list: str) -> None:
        monkeypatch.setattr(settings, "encryption_keys", ",".join(key_list), raising=False)
        if not key_list:
            # .env sets JOTHIDAM_ENCRYPTION_KEY for every other test in this
            # suite, so simulating "no key configured" has to clear the
            # singular fallback too, or configured_keys() quietly finds it.
            monkeypatch.setattr(settings, "encryption_key", "", raising=False)
        core_encryption.reset_fernet_cache()

    yield _set
    monkeypatch.undo()
    core_encryption.reset_fernet_cache()


# ---------------------------------------------------------------------------
# Key configuration
# ---------------------------------------------------------------------------

def test_single_key_setting_still_works(monkeypatch):
    """The pre-rotation form stays supported — most deployments use only this."""
    from app.core.config import get_settings

    settings = get_settings()
    monkeypatch.setattr(settings, "encryption_keys", "", raising=False)
    monkeypatch.setattr(settings, "encryption_key", OLD_KEY, raising=False)
    core_encryption.reset_fernet_cache()
    try:
        assert core_encryption.configured_keys() == [OLD_KEY]
        assert core_encryption.decrypt_bytes(core_encryption.encrypt_bytes(b"hi")) == b"hi"
    finally:
        core_encryption.reset_fernet_cache()


def test_plural_setting_wins_over_singular(keys, monkeypatch):
    from app.core.config import get_settings

    monkeypatch.setattr(get_settings(), "encryption_key", OLD_KEY, raising=False)
    keys(NEW_KEY, OLD_KEY)

    assert core_encryption.configured_keys() == [NEW_KEY, OLD_KEY]


def test_missing_key_names_the_setting_not_the_value(keys):
    keys()

    with pytest.raises(RuntimeError, match="JOTHIDAM_ENCRYPTION_KEYS"):
        core_encryption.get_fernet()


def test_malformed_key_fails_at_boot_without_leaking_the_key(keys):
    keys("this-is-not-a-fernet-key")

    with pytest.raises(RuntimeError) as excinfo:
        core_encryption.get_fernet()
    assert "this-is-not-a-fernet-key" not in str(excinfo.value)


# ---------------------------------------------------------------------------
# Rotation
# ---------------------------------------------------------------------------

def test_old_ciphertext_still_reads_after_adding_a_new_key(keys):
    """Step 1 of a rotation must not need a data migration to be usable."""
    keys(OLD_KEY)
    ciphertext = core_encryption.encrypt_bytes("என் குறிப்பு".encode())

    keys(NEW_KEY, OLD_KEY)

    assert core_encryption.decrypt_bytes(ciphertext).decode() == "என் குறிப்பு"


def test_new_writes_use_the_newest_key(keys):
    keys(NEW_KEY, OLD_KEY)
    ciphertext = core_encryption.encrypt_bytes(b"written after rotation")

    # Readable by the new key alone; the old key is no longer load-bearing.
    assert MultiFernet([Fernet(NEW_KEY.encode())]).decrypt(ciphertext) == b"written after rotation"


def test_rotate_bytes_makes_the_old_key_droppable(keys):
    """The point of step 2: after it, step 3 is safe."""
    keys(OLD_KEY)
    ciphertext = core_encryption.encrypt_bytes(b"secret")

    keys(NEW_KEY, OLD_KEY)
    rotated = core_encryption.rotate_bytes(ciphertext)

    keys(NEW_KEY)
    assert core_encryption.decrypt_bytes(rotated) == b"secret"
    # And the un-rotated original is exactly what dropping the key too early
    # costs you — unreadable, with no way to identify which rows are affected.
    with pytest.raises(InvalidToken):
        core_encryption.decrypt_bytes(ciphertext)


# ---------------------------------------------------------------------------
# Stage 4 — the verify census
# ---------------------------------------------------------------------------

def test_rotate_pass_cannot_tell_you_a_key_is_droppable(keys):
    """Why --verify exists at all, stated as a test.

    MultiFernet.rotate succeeds under ANY configured key. So a stage-3 run that
    completes without an exception is not evidence that a row now needs only the
    newest key — the script used to end by saying it was safe to drop the old
    key, and it could not know that.
    """
    keys(OLD_KEY)
    old_ciphertext = core_encryption.encrypt_bytes(b"never rotated")

    keys(NEW_KEY, OLD_KEY)
    # rotate_bytes on a value we never fetched: the row is untouched, exactly as
    # if the pass had skipped it. Nothing about the pass's success says otherwise.
    assert core_encryption.rotate_bytes(old_ciphertext)

    # The census question, asked directly: can the newest key alone read it?
    with pytest.raises(InvalidToken):
        Fernet(NEW_KEY.encode()).decrypt(old_ciphertext)


def test_verify_counts_a_value_still_under_the_old_key(keys, monkeypatch):
    from scripts import rotate_encryption_key as script

    keys(OLD_KEY)
    stale = core_encryption.encrypt_bytes(b"written before the rotation")
    keys(NEW_KEY, OLD_KEY)
    fresh = core_encryption.encrypt_bytes(b"written after")

    monkeypatch.setattr(
        script,
        "_iter_rows",
        lambda *_args: iter([(1, "note_text", stale), (2, "note_text", fresh)]),
    )
    census = script.verify_table(None, "journal_entries", "journal_id", ("note_text",))

    assert census.scanned == 2
    assert census.already_newest == 1
    assert census.needs_older_key == 1
    assert census.unreadable == 0


def test_verify_counts_a_value_no_configured_key_can_read(keys, monkeypatch):
    """The alarming outcome: a key is missing from the config, or the row is
    corrupt. Either way retirement is not the next move."""
    from scripts import rotate_encryption_key as script

    orphan_key = Fernet.generate_key().decode()
    keys(orphan_key)
    orphaned = core_encryption.encrypt_bytes(b"encrypted under a key nobody kept")

    keys(NEW_KEY, OLD_KEY)
    monkeypatch.setattr(script, "_iter_rows", lambda *_args: iter([(7, "note_text", orphaned)]))
    census = script.verify_table(None, "journal_entries", "journal_id", ("note_text",))

    assert census.unreadable == 1
    assert census.needs_older_key == 0


def test_verify_never_logs_the_plaintext(keys, monkeypatch, caplog):
    from scripts import rotate_encryption_key as script

    keys(OLD_KEY)
    stale = core_encryption.encrypt_bytes("என் ரகசியம்".encode())
    keys(NEW_KEY, OLD_KEY)

    monkeypatch.setattr(script, "_iter_rows", lambda *_args: iter([(42, "note_text", stale)]))
    with caplog.at_level("WARNING"):
        script.verify_table(None, "journal_entries", "journal_id", ("note_text",))

    assert "என் ரகசியம்" not in caplog.text
    # It does say which row, so the operator can go and look.
    assert "42" in caplog.text


def test_rotate_skips_a_value_already_under_the_newest_key(keys, monkeypatch):
    """Not just an optimisation — it is what separates `already newest` from
    `rewritten` in the summary, and it makes a re-run cost reads not writes."""
    from scripts import rotate_encryption_key as script

    keys(NEW_KEY, OLD_KEY)
    fresh = core_encryption.encrypt_bytes(b"already current")

    executed: list[str] = []

    class _Session:
        def execute(self, statement, params=None):
            sql = str(statement)
            executed.append(sql)
            if params and params.get("last") is not None:
                return _Result([])
            if sql.strip().upper().startswith("SELECT"):
                return _Result([(1, fresh)])
            return _Result([])

        def commit(self):
            pass

    class _Result:
        def __init__(self, rows):
            self._rows = rows

        def fetchall(self):
            return self._rows

    census = script.rotate_table(_Session(), "journal_entries", "journal_id", ("note_text",), False)

    assert census.scanned == 1
    assert census.already_newest == 1
    assert census.rewritten == 0
    assert not any(sql.strip().upper().startswith("UPDATE") for sql in executed)


# Columns encrypted by hand rather than by a TypeDecorator, so the metadata scan
# below cannot see them — they are plain LargeBinary in the model. Listed here so
# the guard is honest about its own blind spot instead of quietly having one.
_HAND_ENCRYPTED = {("birth_profiles", "encrypted_birth_payload")}


def test_rotation_script_covers_every_encrypted_column():
    """A new encrypted column that nobody adds to the script is invisible.

    It would rotate cleanly, report success, and leave that column readable only
    by a key the operator is about to delete. Same guard shape as
    tests/test_admin_elevation.py: the next column fails this until a person
    classifies it.
    """
    import app.models  # noqa: F401  - register every mapper
    from app.db.base import Base
    from scripts.rotate_encryption_key import ENCRYPTED_COLUMNS

    listed = {(table, column) for table, _pk, columns in ENCRYPTED_COLUMNS for column in columns}

    encrypted_types = ("EncryptedDate", "EncryptedTime", "EncryptedFloat", "EncryptedString")
    actual = set(_HAND_ENCRYPTED)
    for table in Base.metadata.tables.values():
        for column in table.columns:
            if type(column.type).__name__ in encrypted_types:
                actual.add((table.name, column.name))

    missing = actual - listed
    assert not missing, (
        f"Encrypted columns missing from scripts/rotate_encryption_key.py: {sorted(missing)}. "
        "A column not listed there is skipped by rotation and becomes unreadable "
        "when the old key is dropped."
    )


def test_hand_encrypted_columns_are_still_hand_encrypted():
    """If one gains a TypeDecorator, _HAND_ENCRYPTED above becomes stale.

    Stale in the harmless direction — the column would then be found by the scan
    too — but a list of exceptions that nobody re-checks is how a guard rots.
    """
    import app.models  # noqa: F401
    from app.db.base import Base

    for table_name, column_name in _HAND_ENCRYPTED:
        column = Base.metadata.tables[table_name].columns[column_name]
        assert type(column.type).__name__ == "LargeBinary", (
            f"{table_name}.{column_name} is no longer hand-encrypted; "
            "drop it from _HAND_ENCRYPTED."
        )


def test_rotation_script_lists_no_column_that_does_not_exist():
    import app.models  # noqa: F401
    from app.db.base import Base
    from scripts.rotate_encryption_key import ENCRYPTED_COLUMNS

    for table_name, pk, columns in ENCRYPTED_COLUMNS:
        table = Base.metadata.tables.get(table_name)
        assert table is not None, f"{table_name} is not a mapped table"
        assert pk in table.columns, f"{table_name}.{pk} does not exist"
        for column in columns:
            assert column in table.columns, f"{table_name}.{column} does not exist"


# ---------------------------------------------------------------------------
# EncryptedString
# ---------------------------------------------------------------------------

def test_encrypted_string_round_trips_tamil():
    column = EncryptedString()
    stored = column.process_bind_param("வாழ்க்கை குறிப்பு", None)

    assert isinstance(stored, bytes)
    assert "வாழ்க்கை".encode() not in stored
    assert column.process_result_value(stored, None) == "வாழ்க்கை குறிப்பு"


def test_encrypted_string_passes_none_through():
    column = EncryptedString()

    assert column.process_bind_param(None, None) is None
    assert column.process_result_value(None, None) is None


def test_encrypted_string_rejects_non_string():
    with pytest.raises(TypeError):
        EncryptedString().process_bind_param(42, None)


def test_encrypted_string_detects_tampering():
    """Fernet is authenticated, so a flipped byte fails loudly, not quietly."""
    column = EncryptedString()
    stored = bytearray(column.process_bind_param("original", None))
    stored[-1] ^= 0x01

    with pytest.raises(InvalidToken):
        column.process_result_value(bytes(stored), None)


# ---------------------------------------------------------------------------
# The column, end to end
# ---------------------------------------------------------------------------

def test_journal_note_is_ciphertext_in_the_database(client, birth_profile_payload_factory):
    """Asserted against the raw column: through the ORM this would pass regardless."""
    from app.models.journal_entry import JournalEntry

    secret = f"A private note {uuid.uuid4()} about my life"

    profile = client.post(
        "/api/v1/birth-profiles",
        json=birth_profile_payload_factory(display_name=f"Journal Enc {uuid.uuid4()}"),
    )
    assert profile.status_code == 200
    chart = client.post(
        "/api/v1/charts/calculate",
        json={
            "birthProfileId": profile.json()["data"]["birthProfileId"],
            "calculationVersion": "thirukanitham-2026-v1",
            "forceRecalculate": False,
        },
    )
    assert chart.status_code == 200
    chart_id = chart.json()["data"]["chartId"]

    created = client.post(
        "/api/v1/journal",
        json={
            "chartId": chart_id,
            "entryDate": "2026-09-03",
            "lifeArea": "general",
            "noteText": secret,
        },
    )
    assert created.status_code == 200, created.text
    journal_id = created.json()["data"]["journalId"]

    with SessionLocal() as session:
        raw = session.execute(
            sa.text("SELECT note_text FROM journal_entries WHERE journal_id = :id"),
            {"id": uuid.UUID(journal_id)},
        ).scalar_one()
        assert secret.encode() not in bytes(raw), "journal text is stored in plaintext"

        # And it is still the user's note when read back through the model.
        entry = session.get(JournalEntry, uuid.UUID(journal_id))
        assert entry.note_text == secret

    # The API returns the plaintext to its owner, unchanged.
    listed = client.get(f"/api/v1/journal?chartId={chart_id}")
    assert listed.status_code == 200
    notes = [item["noteText"] for item in listed.json()["data"]["items"]]
    assert secret in notes
