"""Prove a database backup can actually be read back: restore it, then decrypt.

SEC-1 item 2 (docs/SEC1_SECRET_CUSTODY_RULING.md §10-11), made executable. It
turns four of the S0 checklist lines from claims into a command with an exit
code:

    [ ] Restore procedure has been tested end to end
    [ ] A restored encrypted birth profile decrypts successfully
    [ ] A restored journal entry decrypts successfully
    [ ] Old-key recovery has been tested after a rotation

A backup that has never been restored is an assumption, not a backup. And a
restored backup nobody decrypted proves only that Postgres accepted the bytes:
every encrypted column would still be unreadable if the key in escrow were the
wrong one, and you would find out during the incident.

Usage:

    # Restore a dump into a scratch database and verify it
    python -m scripts.verify_restore --scratch-url postgresql://.../vinaadi_restore_check \\
        --dump backup_20260903.sql

    # Same, when Postgres runs in a container and psql is not on this host
    python -m scripts.verify_restore --scratch-url ... --dump backup.sql \\
        --docker-container slw-postgres

    # Verify a database somebody already restored by hand
    python -m scripts.verify_restore --scratch-url postgresql://.../vinaadi_restore_check

Testing OLD-KEY RECOVERY, which is the fourth checklist line and the one people
skip: point it at a backup taken BEFORE a rotation with only the retired key
configured.

    JOTHIDAM_ENCRYPTION_KEYS=<old key only> python -m scripts.verify_restore \\
        --scratch-url ... --dump backup_from_before_the_rotation.sql

If that fails, the old key has already been destroyed too early and those
backups are decoration. See "Retiring a key is not destroying it" in
docs/DATA_PROTECTION.md.

WHAT THIS DELIBERATELY DOES NOT DO

It never prints a decrypted value. It reports that a value decrypted, which key
index read it, and whether the plaintext has the right *shape* — a date that
parses, coordinates in range, JSON that loads, text that is valid UTF-8. The
operator running a restore drill does not need to see anybody's birth time, and
this output is exactly the sort of thing that gets pasted into a ticket.

It also does not read the application's settings. `get_settings()` would run the
production config validator, so a disaster-recovery tool built on it would refuse
to start in precisely the situation it exists for — a host whose configuration is
broken. Keys are read straight from the environment here, including the
``*_FILE`` convention, and nothing else about the app is imported.
"""
from __future__ import annotations

import argparse
import json
import logging
import os
import subprocess
import sys
from collections.abc import Callable
from datetime import date, time
from pathlib import Path
from urllib.parse import urlparse

import sqlalchemy as sa
from cryptography.fernet import Fernet, InvalidToken

logging.basicConfig(level=logging.INFO, format="%(message)s")
logger = logging.getLogger("verify_restore")

_KEYS_ENV = "JOTHIDAM_ENCRYPTION_KEYS"
_KEY_ENV = "JOTHIDAM_ENCRYPTION_KEY"

# A scratch database must look like one. Two independent guards rather than one,
# because the cost of getting this wrong is running a restore over live data.
_REQUIRED_IN_NAME = "restore"
_FORBIDDEN_NAMES = {"vinaadi", "vinaadi_dev", "vinaadi_prod", "vinaadi_test", "postgres", "template1"}


class VerifyError(RuntimeError):
    """A failure the operator has to act on. Never carries key or plaintext."""


# ---------------------------------------------------------------------------
# Keys
# ---------------------------------------------------------------------------

def _env_or_file(name: str) -> str:
    """Read JOTHIDAM_X, or JOTHIDAM_X_FILE's contents. Same rule as Settings."""
    path_value = os.getenv(f"{name}_FILE", "").strip()
    if path_value:
        try:
            return Path(path_value).read_text(encoding="utf-8").strip()
        except OSError as exc:
            raise VerifyError(f"{name}_FILE points at {path_value}, which could not be read: {exc}") from exc
    return (os.getenv(name) or "").strip()


def load_keys() -> list[str]:
    """Every key we can decrypt with, newest first. Mirrors configured_keys()."""
    raw = _env_or_file(_KEYS_ENV)
    if raw:
        keys = [k.strip() for k in raw.split(",") if k.strip()]
    else:
        single = _env_or_file(_KEY_ENV)
        keys = [single] if single else []
    if not keys:
        raise VerifyError(
            f"No encryption key configured. Set {_KEYS_ENV} (comma-separated, newest "
            f"first) or {_KEY_ENV} to the key from escrow, then run this again."
        )
    return keys


def build_fernets(keys: list[str]) -> list[Fernet]:
    """One Fernet per key, kept separate on purpose.

    A MultiFernet would answer "did this decrypt", which is the easy half. Keys
    held individually also answer "which one read it" — the difference between a
    rotation that finished and one that only appeared to.
    """
    out = []
    for index, key in enumerate(keys):
        try:
            out.append(Fernet(key.encode()))
        except (ValueError, TypeError) as exc:
            raise VerifyError(
                f"Key at position {index} is not a valid Fernet key: {exc}. "
                "Keys are url-safe base64-encoded 32-byte values."
            ) from exc
    return out


def decrypt_with_any(fernets: list[Fernet], blob: bytes) -> tuple[bytes, int]:
    """Return (plaintext, index of the key that read it)."""
    for index, fernet in enumerate(fernets):
        try:
            return fernet.decrypt(blob), index
        except InvalidToken:
            continue
    raise InvalidToken


# ---------------------------------------------------------------------------
# Shape checks. Each returns a description of the plaintext, never the plaintext.
# ---------------------------------------------------------------------------

def _check_date(raw: bytes) -> str:
    value = date.fromisoformat(raw.decode())
    return f"a valid date in {value.year}"


def _check_time(raw: bytes) -> str:
    time.fromisoformat(raw.decode())
    return "a valid time"


def _check_latitude(raw: bytes) -> str:
    value = float(raw.decode())
    if not -90.0 <= value <= 90.0:
        raise ValueError(f"latitude out of range: {value}")
    return "a latitude in range"


def _check_longitude(raw: bytes) -> str:
    value = float(raw.decode())
    if not -180.0 <= value <= 180.0:
        raise ValueError(f"longitude out of range: {value}")
    return "a longitude in range"


def _check_json(raw: bytes) -> str:
    payload = json.loads(raw.decode("utf-8"))
    if not isinstance(payload, dict):
        raise ValueError(f"expected a JSON object, got {type(payload).__name__}")
    return f"a JSON object with {len(payload)} key(s)"


def _check_text(raw: bytes) -> str:
    text = raw.decode("utf-8")
    if not text.strip():
        raise ValueError("decrypted to empty text")
    return f"{len(text)} characters of valid UTF-8"


ShapeCheck = Callable[[bytes], str]

# (table, primary key, [(column, shape check)]). Kept in step with
# ENCRYPTED_COLUMNS in scripts/rotate_encryption_key.py --
# test_every_encrypted_column_in_the_rotation_script_is_verified_here enforces it.
CHECKS: tuple[tuple[str, str, tuple[tuple[str, ShapeCheck], ...]], ...] = (
    (
        "birth_profiles",
        "birth_profile_id",
        (
            ("birth_date_local", _check_date),
            ("birth_time_local", _check_time),
            ("birth_latitude", _check_latitude),
            ("birth_longitude", _check_longitude),
            ("encrypted_birth_payload", _check_json),
        ),
    ),
    ("journal_entries", "journal_id", (("note_text", _check_text),)),
)


# ---------------------------------------------------------------------------
# Scratch database
# ---------------------------------------------------------------------------

def guard_scratch_url(url: str) -> str:
    """Refuse anything that does not obviously name a throwaway database.

    Restoring a dump means dropping and recreating what is already there. This
    runs during a drill, often out of hours, frequently by copy-paste from a
    runbook — so the check is on the name rather than on the operator.
    """
    name = (urlparse(url).path or "").lstrip("/")
    if not name:
        raise VerifyError(f"--scratch-url names no database: {url}")
    if name in _FORBIDDEN_NAMES:
        raise VerifyError(
            f"Refusing to touch database {name!r}. This restores over whatever is "
            "there. Point --scratch-url at a throwaway database."
        )
    if _REQUIRED_IN_NAME not in name.lower():
        raise VerifyError(
            f"Refusing to touch database {name!r}: a scratch database's name must "
            f"contain {_REQUIRED_IN_NAME!r}, so a restore cannot land on real data "
            "by a mistyped host. Try 'vinaadi_restore_check'."
        )
    return name


def restore_dump(dump: Path, url: str, container: str | None) -> None:
    """Load a plain-SQL dump into the scratch database with psql."""
    if not dump.is_file():
        raise VerifyError(f"--dump {dump} does not exist.")

    if container:
        # psql reads the dump from this host's stdin; the client lives in the
        # container. Avoids needing a matching psql on the operator's machine.
        command = ["docker", "exec", "-i", container, "psql", "-v", "ON_ERROR_STOP=1", "-d", url]
    else:
        command = ["psql", "-v", "ON_ERROR_STOP=1", "-d", url, "-f", str(dump)]

    logger.info("Restoring %s ...", dump.name)
    with dump.open("rb") as handle:
        result = subprocess.run(  # noqa: S603
            command,
            stdin=handle if container else None,
            capture_output=True,
        )
    if result.returncode != 0:
        tail = result.stderr.decode("utf-8", errors="replace").strip().splitlines()[-15:]
        raise VerifyError("psql failed:\n  " + "\n  ".join(tail))
    logger.info("Restore completed without error.")


# ---------------------------------------------------------------------------
# Verification
# ---------------------------------------------------------------------------

def verify_table(
    connection,
    table: str,
    pk: str,
    columns: tuple[tuple[str, ShapeCheck], ...],
    fernets: list[Fernet],
) -> bool:
    """Decrypt one row of `table`. Returns True when every column checked out."""
    names = ", ".join(name for name, _ in columns)
    # The first column is the one that must be present for the row to be worth
    # sampling; a row with it null tells us nothing either way.
    first = columns[0][0]
    # Table and column names are module constants in CHECKS, never operator
    # input, and identifiers cannot be bound as parameters anyway. Same
    # construction and same reasoning as scripts/rotate_encryption_key.py.
    sql = f"SELECT {pk}, {names} FROM {table} WHERE {first} IS NOT NULL ORDER BY {pk} LIMIT 1"  # noqa: S608
    row = connection.execute(sa.text(sql)).fetchone()

    if row is None:
        logger.warning(
            "  %-16s NO ROWS. Nothing was proved about this table -- an empty restore "
            "passes every check there is.",
            table,
        )
        return False

    logger.info("  %s (%s=%s)", table, pk, row[0])
    ok = True
    for offset, (column, check) in enumerate(columns, start=1):
        value = row[offset]
        if value is None:
            logger.info("    %-26s null, skipped", column)
            continue
        try:
            plaintext, key_index = decrypt_with_any(fernets, bytes(value))
        except InvalidToken:
            logger.error("    %-26s COULD NOT BE DECRYPTED by any configured key", column)
            ok = False
            continue
        try:
            described = check(plaintext)
        except Exception as exc:  # noqa: BLE001 - any malformed plaintext is a failure
            logger.error("    %-26s decrypted, but is not what it should be: %s", column, exc)
            ok = False
            continue
        which = "newest key" if key_index == 0 else f"key #{key_index} (an OLDER key)"
        logger.info("    %-26s OK  -- %s, read by the %s", column, described, which)
    return ok


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--scratch-url", required=True, help="SQLAlchemy URL of a THROWAWAY database.")
    parser.add_argument("--dump", type=Path, help="Plain-SQL dump to restore first. Omit if already restored.")
    parser.add_argument("--docker-container", help="Run psql inside this container instead of on this host.")
    args = parser.parse_args(argv)

    try:
        name = guard_scratch_url(args.scratch_url)
        keys = load_keys()
        fernets = build_fernets(keys)
        logger.info("Scratch database: %s", name)
        logger.info("Keys configured:  %d (position 0 encrypts; all of them decrypt)", len(keys))

        if args.dump:
            restore_dump(args.dump, args.scratch_url, args.docker_container)
        else:
            logger.info("No --dump given; verifying the database as it stands.")

        logger.info("")
        logger.info("Decrypting one row per encrypted table:")
        engine = sa.create_engine(args.scratch_url)
        try:
            with engine.connect() as connection:
                results = [
                    verify_table(connection, table, pk, columns, fernets) for table, pk, columns in CHECKS
                ]
        finally:
            engine.dispose()
    except VerifyError as exc:
        logger.error("")
        logger.error("%s", exc)
        return 2

    logger.info("")
    if all(results):
        logger.info(
            "PASS. This backup restores and its encrypted data is readable with the key "
            "you supplied. Record the date against the S0 block in "
            "docs/launch/GO_LIVE_CHECKLIST.md; it is only true for this backup and this key."
        )
        return 0

    logger.error(
        "FAIL. Do not record this as a tested restore. If a column could not be decrypted, "
        "the key in escrow is not the key that wrote this backup -- find the right one "
        "BEFORE the next rotation retires anything. If a table had no rows, the dump is "
        "not the one you think it is."
    )
    return 1


if __name__ == "__main__":
    sys.exit(main())
