"""Populated-data drill for the A12 encryption migration (Phase 4 D).

`migrations/versions/uu4e5f6a7b8c_encrypt_natal_inputs_and_derivatives.py`
encrypts 14 columns in place and has a real `downgrade()` that decrypts. Until
this drill it had only ever run against near-empty databases, so nobody could
say how long a production maintenance window it needs, or whether the
downgrade restores what was there.

What it does, on **vinaadi_test only**, with synthetic rows only:

    0. reset the schema, migrate to A12, seed N synthetic users through the ORM
       (so every encrypted column the A12 migration does NOT touch is valid
       ciphertext), and fingerprint the 14 A12 columns as the application
       reads them;
    1. downgrade A12           -> the populated plaintext database production
                                  would hold just before A12. Verify plaintext.
    2. upgrade A12   (timed)   -> verify ciphertext at rest, one layer deep,
                                  and the application reads the same values.
    3. downgrade A12 (timed)   -> verify plaintext is restored, row counts equal.
    4. upgrade A12   (timed)   -> verify it did not double-encrypt.

Every check compares a SHA-256 fingerprint of canonicalised values, never the
values themselves; nothing decrypted is printed.

Run it through the wrapper, which supplies the container, the network and the
same concurrency guard as test-docker.ps1:

    .\\scripts\\a12-migration-drill.ps1 -Users 10000

The encryption key is a throwaway Fernet key generated per run. The dev key in
`.env` is never used: the data is synthetic and the test DB is wiped by the next
pytest run anyway.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import random
import sys
import time
from collections.abc import Callable, Iterable
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any
from urllib.parse import urlparse
from uuid import UUID, uuid4

from cryptography.fernet import Fernet

A12_REVISION = "uu4e5f6a7b8c"
PRE_A12_REVISION = "tt3d4e5f6a7b"
REPO_ROOT = Path(__file__).resolve().parent.parent
_RESET_ACK = "I_UNDERSTAND_THIS_WIPES_TEST_DB"
_FERNET_PREFIX = b"gAAAAA"  # base64 of Fernet's 0x80 version byte + timestamp high bytes

# column -> canonical kind. "nN" = numeric at N decimal places (the plaintext
# column's scale), so a value survives Decimal <-> float <-> text unchanged.
A12_COLUMNS: dict[str, tuple[str, dict[str, str]]] = {
    "birth_profiles": ("birth_profile_id", {
        "birth_datetime_utc": "datetime",
        "birth_place": "text",
        "birth_timezone": "text",
        "current_place": "text",
        "current_latitude": "n6",
        "current_longitude": "n6",
        "current_timezone": "text",
    }),
    "charts": ("chart_id", {"julian_day": "n8", "lagna_longitude": "n8"}),
    "chart_planets": ("chart_planet_id", {
        "absolute_longitude": "n8",
        "degree_in_rasi": "n8",
        "speed_deg_per_day": "n8",
        "raw_payload": "json",
    }),
    "family_members": ("family_member_id", {"date_of_birth_local": "date"}),
}
if sum(len(cols) for _, cols in A12_COLUMNS.values()) != 14:
    raise RuntimeError("A12_COLUMNS must list exactly the migration's 14 columns")

GRAHAS = ("SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN", "RAHU", "KETU")
ZONES = ("Asia/Kolkata", "Asia/Singapore", "Europe/London", "America/New_York", "Australia/Sydney")


class DrillError(RuntimeError):
    """A failed check. Carries counts and column names, never values."""


# --------------------------------------------------------------------------- #
# Guards                                                                       #
# --------------------------------------------------------------------------- #

def assert_test_database(url: str) -> None:
    """The same target conftest.py insists on, checked before anything connects."""
    parsed = urlparse(url)
    name = (parsed.path or "").lstrip("/")
    if name != "vinaadi_test" or parsed.port != 5433 or parsed.hostname not in {"localhost", "127.0.0.1"}:
        raise DrillError(
            "Refusing: this drill drops the public schema and runs only against "
            "vinaadi_test on localhost:5433."
        )
    if os.getenv("JOTHIDAM_TEST_DB_RESET_ACK") != _RESET_ACK:
        raise DrillError(f"Refusing: set JOTHIDAM_TEST_DB_RESET_ACK={_RESET_ACK}.")


def install_throwaway_key() -> None:
    # Set before the first get_settings() call; the environment beats `.env`.
    key = Fernet.generate_key().decode()
    os.environ["JOTHIDAM_ENCRYPTION_KEYS"] = key
    os.environ["JOTHIDAM_ENCRYPTION_KEY"] = key


# --------------------------------------------------------------------------- #
# Canonical fingerprints                                                       #
# --------------------------------------------------------------------------- #

def canon(value: Any, kind: str) -> str:
    if value is None:
        return "<null>"
    if kind == "datetime":
        return value.astimezone(UTC).isoformat()
    if kind == "date":
        return value.isoformat()
    if kind == "json":
        obj = json.loads(value) if isinstance(value, (str, bytes)) else value
        return json.dumps(obj, sort_keys=True, ensure_ascii=False)
    if kind.startswith("n"):
        return f"{float(value):.{int(kind[1:])}f}"
    return str(value)


def fingerprint(rows: Iterable[tuple[Any, ...]], kinds: list[str]) -> tuple[int, str]:
    digest = hashlib.sha256()
    count = 0
    for row in rows:
        pk, values = row[0], row[1:]
        line = "|".join([str(pk), *(canon(v, k) for v, k in zip(values, kinds, strict=True))])
        digest.update(line.encode("utf-8") + b"\n")
        count += 1
    return count, digest.hexdigest()


def plaintext_fingerprints(conn: Any) -> dict[str, tuple[int, str]]:
    import sqlalchemy as sa

    out = {}
    for table, (pk, cols) in A12_COLUMNS.items():
        rows = conn.execute(sa.text(
            f"SELECT {pk}, {', '.join(cols)} FROM {table} ORDER BY {pk}"  # noqa: S608 - module constants
        ))
        out[table] = fingerprint(rows, list(cols.values()))
    return out


def application_fingerprints(session: Any) -> dict[str, tuple[int, str]]:
    """Read through the ORM's encrypted types: what the application would see."""
    import sqlalchemy as sa

    from app.models import BirthProfile, Chart, ChartPlanet, FamilyMember

    models = {"birth_profiles": BirthProfile, "charts": Chart, "chart_planets": ChartPlanet, "family_members": FamilyMember}
    out = {}
    for table, (pk, cols) in A12_COLUMNS.items():
        model = models[table]
        stmt = sa.select(getattr(model, pk), *(getattr(model, c) for c in cols)).order_by(getattr(model, pk))
        out[table] = fingerprint(session.execute(stmt), list(cols.values()))
    return out


# --------------------------------------------------------------------------- #
# State checks                                                                 #
# --------------------------------------------------------------------------- #

def column_types(conn: Any) -> dict[str, str]:
    import sqlalchemy as sa

    rows = conn.execute(sa.text(
        "SELECT table_name, column_name, data_type FROM information_schema.columns "
        "WHERE table_schema = 'public' AND table_name = ANY(:tables)"
    ), {"tables": list(A12_COLUMNS)})
    wanted = {(t, c) for t, (_, cols) in A12_COLUMNS.items() for c in cols}
    return {f"{t}.{c}": d for t, c, d in rows if (t, c) in wanted}


def assert_plaintext(conn: Any) -> None:
    types = column_types(conn)
    if len(types) != 14:
        raise DrillError(f"expected 14 A12 columns, found {len(types)}")
    still_binary = sorted(k for k, v in types.items() if v == "bytea")
    if still_binary:
        raise DrillError(f"columns still bytea after downgrade: {still_binary}")


def assert_ciphertext_one_layer(conn: Any) -> dict[str, int]:
    """Every non-null value is a Fernet token, and decrypting it once yields
    plaintext — not another token. That second half is the double-encryption check."""
    import sqlalchemy as sa

    from app.core.encryption import decrypt_bytes

    types = column_types(conn)
    not_binary = sorted(k for k, v in types.items() if v != "bytea")
    if len(types) != 14 or not_binary:
        raise DrillError(f"columns not bytea after upgrade: {not_binary} (found {len(types)})")

    checked: dict[str, int] = {}
    for table, (_, cols) in A12_COLUMNS.items():
        for col in cols:
            n = 0
            for (raw,) in conn.execute(sa.text(f"SELECT {col} FROM {table} WHERE {col} IS NOT NULL")):  # noqa: S608
                raw = bytes(raw)
                if not raw.startswith(_FERNET_PREFIX):
                    raise DrillError(f"{table}.{col}: a value at rest is not a Fernet token")
                if decrypt_bytes(raw).startswith(_FERNET_PREFIX):
                    raise DrillError(f"{table}.{col}: a value decrypts to another token (double-encrypted)")
                n += 1
            checked[f"{table}.{col}"] = n
    return checked


def assert_same(label: str, got: dict[str, tuple[int, str]], baseline: dict[str, tuple[int, str]]) -> None:
    for table, (count, digest) in baseline.items():
        g_count, g_digest = got[table]
        if g_count != count:
            raise DrillError(f"{label}: {table} has {g_count} rows, baseline {count}")
        if g_digest != digest:
            raise DrillError(f"{label}: {table} values differ from the baseline fingerprint")


# --------------------------------------------------------------------------- #
# Seed                                                                         #
# --------------------------------------------------------------------------- #

def seed(session: Any, users: int, rng: random.Random, chunk: int = 2_000) -> dict[str, int]:
    """Synthetic population: every user has a self profile; one in four also has
    a family vault with three members, each with a profile. One chart per
    profile, nine planets per chart. Names and emails say "synthetic"."""
    import sqlalchemy as sa

    from app.models import BirthProfile, Chart, ChartPlanet, FamilyMember, FamilyVault, User

    def n(lo: float, hi: float, places: int) -> float:
        return round(rng.uniform(lo, hi), places)

    batches: dict[Any, list[dict[str, Any]]] = {m: [] for m in (User, FamilyVault, FamilyMember, BirthProfile, Chart, ChartPlanet)}
    epoch = datetime(1960, 1, 1, tzinfo=UTC)

    def add_profile(owner: UUID, label: str, member_id: UUID | None) -> None:
        profile_id, chart_id = uuid4(), uuid4()
        born = epoch + timedelta(seconds=rng.randrange(0, 60 * 365 * 86_400))
        moved = rng.random() < 0.4
        batches[BirthProfile].append({
            "birth_profile_id": profile_id, "owner_user_id": owner, "family_member_id": member_id,
            "display_name": label, "birth_date_local": born.date(), "birth_time_local": born.time(),
            "birth_datetime_utc": born, "birth_place": f"Synthetic Town {rng.randrange(500)}",
            "birth_latitude": n(8, 13, 6), "birth_longitude": n(76, 80, 6), "birth_timezone": "Asia/Kolkata",
            "current_place": f"Synthetic City {rng.randrange(200)}" if moved else None,
            "current_latitude": n(-35, 55, 6) if moved else None,
            "current_longitude": n(-120, 150, 6) if moved else None,
            "current_timezone": rng.choice(ZONES) if moved else None,
        })
        batches[Chart].append({
            "chart_id": chart_id, "birth_profile_id": profile_id, "calculation_version": "drill-synthetic",
            "julian_day": n(2_436_935, 2_458_849, 8), "lagna_rasi": "MESHAM", "lagna_longitude": n(0, 360, 8),
            "moon_rasi": "RISHABAM", "janma_nakshatra": "ROHINI", "janma_pada": rng.randint(1, 4),
        })
        for graha in GRAHAS:
            batches[ChartPlanet].append({
                "chart_planet_id": uuid4(), "chart_id": chart_id, "graha": graha,
                "absolute_longitude": n(0, 360, 8), "degree_in_rasi": n(0, 30, 8),
                "speed_deg_per_day": n(-1, 15, 8) if graha not in {"RAHU", "KETU"} else None,
                "rasi": "MESHAM", "nakshatra": "ASWINI", "pada": 1, "house_from_lagna": rng.randint(1, 12),
                # Tamil text proves the JSON round trip does not re-escape (_enc_json).
                "raw_payload": {"graha": graha, "note": "செயற்கை தரவு", "rank": rng.randint(1, 9)},
            })

    for i in range(users):
        user_id = uuid4()
        batches[User].append({"user_id": user_id, "email": f"drill-synthetic-{i:06d}@example.invalid"})
        add_profile(user_id, f"Drill Synthetic {i:06d}", None)
        if i % 4 == 0:
            vault_id = uuid4()
            batches[FamilyVault].append({"family_vault_id": vault_id, "owner_user_id": user_id, "name": "Synthetic Family"})
            for m in range(3):
                member_id = uuid4()
                batches[FamilyMember].append({
                    "family_member_id": member_id, "owner_user_id": user_id, "family_vault_id": vault_id,
                    "display_name": f"Drill Synthetic {i:06d}-{m}",
                    "date_of_birth_local": (epoch + timedelta(days=rng.randrange(0, 60 * 365))).date(),
                })
                add_profile(user_id, f"Drill Synthetic {i:06d}-{m}", member_id)

    for model, rows in batches.items():
        for start in range(0, len(rows), chunk):
            session.execute(sa.insert(model), rows[start:start + chunk])
    session.commit()
    return {model.__tablename__: len(rows) for model, rows in batches.items()}


# --------------------------------------------------------------------------- #
# Drill                                                                        #
# --------------------------------------------------------------------------- #

@dataclass
class Step:
    name: str
    seconds: float


def timed(fn: Callable[[], None]) -> float:
    start = time.perf_counter()
    fn()
    return time.perf_counter() - start


def run(users: int, seed_value: int) -> dict[str, Any]:
    url = os.getenv("JOTHIDAM_DATABASE_URL", "")
    assert_test_database(url)
    install_throwaway_key()

    import sqlalchemy as sa
    from alembic import command
    from alembic.config import Config
    from alembic.script import ScriptDirectory

    from app.db.session import SessionLocal, engine

    cfg = Config(str(REPO_ROOT / "alembic.ini"))
    cfg.set_main_option("script_location", str(REPO_ROOT / "migrations"))
    head = ScriptDirectory.from_config(cfg).get_current_head()
    if head != A12_REVISION:
        # The ORM models describe head. Past A12 they may not match the A12
        # schema, so the application-read check would be measuring the wrong thing.
        raise DrillError(f"head is {head}, not {A12_REVISION}: extend the drill to migrate past A12 before ORM reads")

    with engine.connect() as conn:
        conn.execute(sa.text("DROP SCHEMA public CASCADE"))
        conn.execute(sa.text("CREATE SCHEMA public"))
        conn.execute(sa.text("GRANT ALL ON SCHEMA public TO PUBLIC"))
        conn.commit()

    steps: list[Step] = []
    steps.append(Step("migrate empty schema to A12", timed(lambda: command.upgrade(cfg, A12_REVISION))))

    with SessionLocal() as session:
        start = time.perf_counter()
        # Reproducible synthetic data, not a secret: S311 does not apply.
        counts = seed(session, users, random.Random(seed_value))  # noqa: S311
        steps.append(Step("seed synthetic rows (ORM, encrypted)", time.perf_counter() - start))
    with SessionLocal() as session:
        baseline = application_fingerprints(session)

    steps.append(Step("downgrade A12 (prepare plaintext baseline)", timed(lambda: command.downgrade(cfg, PRE_A12_REVISION))))
    with engine.connect() as conn:
        assert_plaintext(conn)
        assert_same("plaintext baseline", plaintext_fingerprints(conn), baseline)

    timings: dict[str, float] = {}
    tokens: dict[str, int] = {}
    for label, verb, target in (
        ("upgrade #1", command.upgrade, A12_REVISION),
        ("downgrade", command.downgrade, PRE_A12_REVISION),
        ("upgrade #2", command.upgrade, A12_REVISION),
    ):
        seconds = timed(lambda verb=verb, target=target: verb(cfg, target))
        timings[label] = seconds
        steps.append(Step(f"{label} (timed)", seconds))
        if target == A12_REVISION:
            with engine.connect() as conn:
                tokens = assert_ciphertext_one_layer(conn)
            with SessionLocal() as session:
                assert_same(f"after {label}, read through the application", application_fingerprints(session), baseline)
        else:
            with engine.connect() as conn:
                assert_plaintext(conn)
                assert_same(f"after {label}", plaintext_fingerprints(conn), baseline)

    rewritten = sum(baseline[t][0] for t in A12_COLUMNS)
    return {
        "users": users,
        "rows": counts,
        "a12_rows_rewritten": rewritten,
        "encrypted_values_checked": sum(tokens.values()),
        "timings_seconds": {k: round(v, 2) for k, v in timings.items()},
        "rows_per_second": {k: round(rewritten / v) for k, v in timings.items()},
        "steps": [(s.name, round(s.seconds, 2)) for s in steps],
        "result": "PASS",
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--users", type=int, default=1_000, help="synthetic users to seed (default 1000)")
    parser.add_argument("--seed", type=int, default=20261012, help="RNG seed for reproducible data")
    args = parser.parse_args()
    try:
        report = run(args.users, args.seed)
    except DrillError as exc:
        print(f"DRILL FAILED: {exc}", file=sys.stderr)
        return 1
    print(json.dumps(report, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
