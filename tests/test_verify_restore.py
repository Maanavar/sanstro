"""Guards for the restore-drill script (SEC-1 item 2).

The script itself needs a real dump and a real database, so what is tested here
is everything that must be right *before* it touches either: the refusal to
restore over a live database, key loading that works when the app's own config
does not, and the shape checks that decide whether decrypted plaintext is
actually the value it should be rather than merely bytes.
"""
from __future__ import annotations

import json
from datetime import date, time

import pytest
from cryptography.fernet import Fernet

from scripts import verify_restore as vr

pytestmark = pytest.mark.no_db


@pytest.fixture(autouse=True, scope="session")
def require_db():  # noqa: F811 - shadows conftest require_db; no DB needed
    return


@pytest.fixture(autouse=True)
def _clear_key_env(monkeypatch):
    for name in ("JOTHIDAM_ENCRYPTION_KEYS", "JOTHIDAM_ENCRYPTION_KEY"):
        monkeypatch.delenv(name, raising=False)
        monkeypatch.delenv(f"{name}_FILE", raising=False)


# ---------------------------------------------------------------------------
# The scratch-database guard. Restoring drops what is already there.
# ---------------------------------------------------------------------------

@pytest.mark.parametrize(
    "database",
    ["vinaadi", "vinaadi_dev", "vinaadi_prod", "vinaadi_test", "postgres"],
)
def test_refuses_to_restore_over_a_real_database(database):
    with pytest.raises(vr.VerifyError, match="Refusing to touch"):
        vr.guard_scratch_url(f"postgresql://u:p@localhost:5432/{database}")


def test_refuses_a_name_that_does_not_announce_itself_as_scratch():
    """The check is on the name, not on the operator.

    This runs during a drill, often out of hours, usually by copy-paste from a
    runbook, and it restores over whatever it is pointed at. A host typo should
    not be able to reach production.
    """
    with pytest.raises(vr.VerifyError, match="must contain"):
        vr.guard_scratch_url("postgresql://u:p@localhost:5432/analytics")


def test_accepts_a_scratch_name():
    assert vr.guard_scratch_url("postgresql://u:p@localhost:5432/vinaadi_restore_check") == (
        "vinaadi_restore_check"
    )


def test_a_url_naming_no_database_is_rejected():
    with pytest.raises(vr.VerifyError, match="names no database"):
        vr.guard_scratch_url("postgresql://u:p@localhost:5432")


# ---------------------------------------------------------------------------
# Key loading. This must work when the application's config does not.
# ---------------------------------------------------------------------------

def test_reads_the_plural_setting_newest_first(monkeypatch):
    monkeypatch.setenv("JOTHIDAM_ENCRYPTION_KEYS", " new , old ")

    assert vr.load_keys() == ["new", "old"]


def test_falls_back_to_the_single_key_setting(monkeypatch):
    monkeypatch.setenv("JOTHIDAM_ENCRYPTION_KEY", "only-one")

    assert vr.load_keys() == ["only-one"]


def test_reads_a_key_from_a_file(tmp_path, monkeypatch):
    """The escrowed copy arrives as a file far more often than as an env var."""
    key_file = tmp_path / "escrowed_key"
    key_file.write_text("from-escrow\n", encoding="utf-8")
    monkeypatch.setenv("JOTHIDAM_ENCRYPTION_KEYS_FILE", str(key_file))

    assert vr.load_keys() == ["from-escrow"]


def test_no_key_says_what_to_set(monkeypatch):
    with pytest.raises(vr.VerifyError, match="JOTHIDAM_ENCRYPTION_KEYS"):
        vr.load_keys()


def test_a_malformed_key_names_its_position_and_not_its_value():
    with pytest.raises(vr.VerifyError) as excinfo:
        vr.build_fernets([Fernet.generate_key().decode(), "not-a-fernet-key"])

    message = str(excinfo.value)
    assert "position 1" in message
    assert "not-a-fernet-key" not in message


# ---------------------------------------------------------------------------
# Which key read it. The whole reason keys are held individually.
# ---------------------------------------------------------------------------

def test_reports_that_an_older_key_was_the_one_that_worked():
    """A MultiFernet would say "it decrypted" and stop there.

    "Which key" is the difference between a rotation that finished and one that
    only looked like it did, and it is what makes an old-key recovery drill mean
    anything.
    """
    new_key, old_key = Fernet.generate_key().decode(), Fernet.generate_key().decode()
    written_under_old = Fernet(old_key.encode()).encrypt(b"pre-rotation row")

    plaintext, index = vr.decrypt_with_any(vr.build_fernets([new_key, old_key]), written_under_old)

    assert plaintext == b"pre-rotation row"
    assert index == 1


def test_reports_the_newest_key_when_that_is_what_wrote_it():
    new_key = Fernet.generate_key().decode()
    blob = Fernet(new_key.encode()).encrypt(b"current row")

    assert vr.decrypt_with_any(vr.build_fernets([new_key]), blob) == (b"current row", 0)


# ---------------------------------------------------------------------------
# Shape checks. Decrypting to bytes is not the same as decrypting to a value.
# ---------------------------------------------------------------------------

def test_shape_checks_accept_what_the_column_types_actually_write():
    """Formats come from app/services/encryption.py, not from guesswork."""
    assert "1990" in vr._check_date(date(1990, 4, 17).isoformat().encode())
    vr._check_time(time(6, 12).isoformat().encode())
    # str(float(x)) is exactly what EncryptedFloat.process_bind_param writes.
    latitude, longitude = 13.0827, 80.2707
    vr._check_latitude(str(float(latitude)).encode())
    vr._check_longitude(str(float(longitude)).encode())
    assert "2 key(s)" in vr._check_json(json.dumps({"a": 1, "b": 2}).encode("utf-8"))
    assert "valid UTF-8" in vr._check_text("என் குறிப்பு".encode())


@pytest.mark.parametrize(
    ("check", "payload"),
    [
        (vr._check_date, b"not-a-date"),
        (vr._check_time, b"25:99"),
        (vr._check_latitude, b"91.0"),
        (vr._check_longitude, b"181.0"),
        (vr._check_json, b"[]"),
        (vr._check_text, b"   "),
    ],
)
def test_shape_checks_reject_plausible_garbage(check, payload):
    """Fernet authenticates, so a wrong key raises rather than yielding rubbish.

    These cover the other way a restore can be quietly wrong: the right key on
    the wrong data, or a column that was written by something that has since
    changed shape.
    """
    with pytest.raises((ValueError, UnicodeDecodeError)):
        check(payload)


def test_no_shape_check_returns_the_plaintext():
    """This output gets pasted into tickets. It must describe, never reveal."""
    secret_note = "Meeting my sister at the temple on the 4th"
    described = vr._check_text(secret_note.encode())

    assert secret_note not in described
    assert "temple" not in described


def test_every_encrypted_column_in_the_rotation_script_is_verified_here():
    """The two lists drift apart silently otherwise.

    A column added to the rotation script but not here would be re-encrypted on
    rotation and never once checked by a restore drill -- readable in theory,
    unproven in practice, and nobody would notice until it mattered.
    """
    from scripts.rotate_encryption_key import ENCRYPTED_COLUMNS

    rotated = {(table, column) for table, _pk, columns in ENCRYPTED_COLUMNS for column in columns}
    verified = {(table, column) for table, _pk, columns in vr.CHECKS for column, _check in columns}

    assert rotated == verified
