"""A12 Option C — a readable database dump must not carry the birth facts.

Asserted against raw rows (``row_to_json``), never through the ORM: the column
types decrypt on read, so an ORM-level check passes whatever is stored.

Scope, owner ruling 2026-10-08: the birth inputs (UTC instant, place, timezone),
the current location, and the derivatives that reconstruct the instant
(Julian day, lagna/planet longitudes, the planet payload) plus the family DOB
duplicate. Rasi/nakshatra/pada keys stay plaintext by ruling — they narrow the
birth date and a ~2-hour window, which is why public copy still makes no
"encrypted at rest" claim (see web/lib/encryption-claim-copy.test.ts).
"""
from __future__ import annotations

import math
import uuid

import sqlalchemy as sa

from app.db.session import SessionLocal

ENCRYPTED = (
    ("birth_profiles", "birth_datetime_utc"),
    ("birth_profiles", "birth_place"),
    ("birth_profiles", "birth_timezone"),
    ("birth_profiles", "current_place"),
    ("birth_profiles", "current_latitude"),
    ("birth_profiles", "current_longitude"),
    ("birth_profiles", "current_timezone"),
    ("charts", "julian_day"),
    ("charts", "lagna_longitude"),
    ("chart_planets", "absolute_longitude"),
    ("chart_planets", "degree_in_rasi"),
    ("chart_planets", "speed_deg_per_day"),
    ("chart_planets", "raw_payload"),
    ("family_members", "date_of_birth_local"),
)

BIRTH_PLACE = "Synthetic Testpur, Nowhere"
CURRENT_PLACE = "Synthetic Currentville"
CURRENT_TZ = "Asia/Singapore"


def _truncated(value: float) -> str:
    # Postgres prints NUMERIC at its own scale and Python prints a float at
    # another; two truncated decimals is a substring of both. The '.' cannot
    # occur in bytea's hex rendering, so a match is never a ciphertext accident.
    return f"{math.floor(value * 100) / 100:.2f}"


def test_every_birth_instant_column_is_ciphertext_in_the_schema(client):
    # `client` rebuilds the schema from the models; without it this reads
    # whatever the previous run left behind.
    with SessionLocal() as session:
        wrong = []
        for table, column in ENCRYPTED:
            data_type = session.execute(
                sa.text(
                    "SELECT data_type FROM information_schema.columns "
                    "WHERE table_name = :t AND column_name = :c"
                ),
                {"t": table, "c": column},
            ).scalar_one()
            if data_type != "bytea":
                wrong.append(f"{table}.{column} is {data_type}")
    assert not wrong, f"{len(wrong)} plaintext column(s):\n" + "\n".join(wrong)


def test_a_readable_dump_does_not_carry_the_birth_facts(
    client, family_vault_payload_factory, family_member_payload_factory
):
    vault = client.post("/api/v1/family-vaults", json=family_vault_payload_factory(f"At Rest {uuid.uuid4()}"))
    assert vault.status_code == 200, vault.text
    payload = family_member_payload_factory(display_name=f"Synthetic Member {uuid.uuid4()}")
    payload.update(
        birthPlace=BIRTH_PLACE,
        currentPlace=CURRENT_PLACE,
        currentLatitude=1.3521,
        currentLongitude=103.8198,
        currentTimezone=CURRENT_TZ,
    )
    member = client.post(f"/api/v1/family-vaults/{vault.json()['data']['familyVaultId']}/members", json=payload)
    assert member.status_code == 200, member.text
    member_id = uuid.UUID(member.json()["data"]["familyMemberId"])
    chart_id = member.json()["data"]["chartId"]

    chart = client.get(f"/api/v1/charts/{chart_id}")
    assert chart.status_code == 200, chart.text
    data = chart.json()["data"]
    moon = next(p for p in data["planets"] if p["graha"] == "MOON")

    with SessionLocal() as session:
        def dump(sql: str, **params) -> str:
            rows = session.execute(sa.text(sql), params).scalars().all()
            assert rows, sql
            return "\n".join(rows)

        profile_row = dump(
            "SELECT row_to_json(t)::text FROM birth_profiles t WHERE family_member_id = :m", m=member_id
        )
        chart_row = dump("SELECT row_to_json(t)::text FROM charts t WHERE chart_id = :c", c=uuid.UUID(chart_id))
        planet_rows = dump(
            "SELECT row_to_json(t)::text FROM chart_planets t WHERE chart_id = :c", c=uuid.UUID(chart_id)
        )
        member_row = dump("SELECT row_to_json(t)::text FROM family_members t WHERE family_member_id = :m", m=member_id)

        # dasha_periods (start/end JD) and varga_positions (raw_payload) are still
        # plaintext NUMERIC/JSONB and have no writer. A new writer on the chart
        # path must encrypt those columns first; this is where it would show up.
        for dormant in ("dasha_periods", "varga_positions"):
            written = session.execute(
                sa.text(f"SELECT count(*) FROM {dormant} WHERE chart_id = :c"),  # noqa: S608 - fixed names
                {"c": uuid.UUID(chart_id)},
            ).scalar_one()
            assert written == 0, f"{dormant} gained a writer; encrypt its JD/payload columns before persisting"

    leaks = []
    for label, haystack, needles in (
        ("birth_profiles", profile_row, (BIRTH_PLACE, CURRENT_PLACE, CURRENT_TZ, "Asia/Kolkata", "1991-07-2", "103.81")),
        ("charts", chart_row, (_truncated(data["julianDay"]), _truncated(data["lagna"]["absoluteLongitude"]))),
        ("chart_planets", planet_rows, (_truncated(moon["absoluteLongitude"]), _truncated(moon["degreeInRasi"]))),
        ("family_members", member_row, ("1991-07-22",)),
    ):
        leaks += [f"{label}: {needle!r}" for needle in needles if needle in haystack]
    assert not leaks, f"{len(leaks)} plaintext birth fact(s) in raw rows:\n" + "\n".join(leaks)

    # Still the user's data through the API.
    profile = client.get(f"/api/v1/charts/{chart_id}").json()["data"]
    assert profile["julianDay"] == data["julianDay"]
    assert moon["absoluteLongitude"] == next(p for p in profile["planets"] if p["graha"] == "MOON")["absoluteLongitude"]
