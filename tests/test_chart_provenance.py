"""A chart's version records WHICH ENGINE made it. It is not its identity, and it
is not the client's to choose. And nothing about a chart may be reconstructed by
lining two lists up by position.

Both halves are regressions with a shipped symptom:

  * ``birth_profile_service.get_birth_profile`` filtered its chart lookup on
    ``Chart.calculation_version``. The API handed it a frozen literal while
    ``family_vault_service`` wrote the engine constant, so a family member's
    chart existed and the endpoint answered ``chartId: null`` for it. The same
    filter in ``calculate_chart_for_persisted_profile`` created a duplicate row
    beside the chart it could not see.
  * ``_chart_response_from_record`` built ``equal_bhava`` by zipping the rebuilt
    ``planet_positions`` against the stored rows *by position*. Maandhi is
    rederived on that path — deliberately, because the 2026-09-29 ruling moved it
    and no column distinguishes the old definition from the new — and the zip
    then either dropped it (lists of different length) or welded the old
    eighth-part Gulika bhava house onto the new proportional Maandhi.

Each test names the revert that makes it fail.
"""
from __future__ import annotations

import ast
from pathlib import Path
from uuid import UUID

from sqlalchemy import select

from app.constants.versions import API_RESPONSE_VERSION, CHART_CALCULATION_VERSION
from app.db.session import SessionLocal
from app.models.chart import Chart
from app.models.chart_planet import ChartPlanet

#: What a chart stamped by some other caller, or by an older build, looks like.
#: Deliberately not either live constant: the point is that the lookup does not
#: care what the string says.
FOREIGN_VERSION = "some-other-engine-v0-2019"


def _create_profile(client, birth_profile_payload_factory) -> str:
    created = client.post("/api/v1/birth-profiles", json=birth_profile_payload_factory()).json()
    assert created["data"]["chartId"] is not None
    return created["data"]["birthProfileId"]


def _restamp_charts(birth_profile_id: str, version: str) -> None:
    """Make the profile's charts look as though another caller wrote them."""
    with SessionLocal() as session, session.begin():
        for chart in session.execute(
            select(Chart).where(Chart.birth_profile_id == UUID(birth_profile_id))
        ).scalars():
            chart.calculation_version = version


# ── version is provenance, not identity ───────────────────────────────────────

def test_profile_read_finds_a_chart_stamped_by_another_caller(client, birth_profile_payload_factory):
    """The `chartId: null` bug, reproduced at the boundary that showed it.

    A family-vault member's chart was written with the engine constant; this
    endpoint queried with the frozen literal; the row was invisible and the
    caller had nothing to load on a profile that was fully calculated.

    Restore ``.where(Chart.calculation_version == calculation_version)`` in
    ``get_birth_profile`` and this asserts on ``None``.
    """
    birth_profile_id = _create_profile(client, birth_profile_payload_factory)
    _restamp_charts(birth_profile_id, FOREIGN_VERSION)

    body = client.get(f"/api/v1/birth-profiles/{birth_profile_id}").json()
    assert body["data"]["chartId"] is not None


def test_a_foreign_stamped_chart_is_reused_not_duplicated(client, birth_profile_payload_factory):
    """The other half of the same filter: it also wrote a second chart.

    ``calculate_chart_for_persisted_profile`` looked for an existing chart *with
    a matching version*, found none, and inserted a duplicate beside the one
    already there — so the row count grew every time a caller arrived with a
    different literal.

    Restore that filter and the count below is 2.
    """
    birth_profile_id = _create_profile(client, birth_profile_payload_factory)
    _restamp_charts(birth_profile_id, FOREIGN_VERSION)

    response = client.post(
        "/api/v1/charts/calculate",
        json={"birthProfileId": birth_profile_id, "forceRecalculate": False},
    )
    assert response.status_code == 200

    with SessionLocal() as session:
        charts = session.execute(
            select(Chart).where(Chart.birth_profile_id == UUID(birth_profile_id))
        ).scalars().all()
    assert len(charts) == 1, "a version mismatch must not fork the profile's chart history"
    assert str(charts[0].chart_id) == response.json()["data"]["chartId"]


def test_the_client_cannot_choose_the_engine_version(client, birth_profile_payload_factory):
    """web/hooks/usePersonalData.ts posted "thirukanitham-2026-v1" on every
    dashboard load, and the backend stamped it onto the stored chart — so the
    recorded provenance named a build two revisions behind the one that had
    actually run. The field stays accepted (the request model is extra="forbid",
    so rejecting it would 400 deployed clients) and inert.

    Restore ``calculation_version=payload.calculation_version`` in
    ``calculate_chart`` and both assertions below fail.
    """
    birth_profile_id = _create_profile(client, birth_profile_payload_factory)

    body = client.post(
        "/api/v1/charts/calculate",
        json={
            "birthProfileId": birth_profile_id,
            "calculationVersion": "client-picked-nonsense-v9",
            "forceRecalculate": True,
        },
    ).json()

    assert body["data"]["calculationVersion"] == CHART_CALCULATION_VERSION
    with SessionLocal() as session:
        stored = session.execute(
            select(Chart.calculation_version).where(Chart.birth_profile_id == UUID(birth_profile_id))
        ).scalars().all()
    assert set(stored) == {CHART_CALCULATION_VERSION}


def test_the_historical_literal_survives_only_as_a_named_constant():
    """A ratchet, because this is how thirty copies of one string happened.

    The literal was hand-copied to every call site; the engine constant then moved
    and none of the copies did. Parsed with ``ast`` rather than grepped, so the
    prose that explains the history in comments and docstrings does not trip it —
    only a real string constant in code does.
    """
    app_root = Path(__file__).resolve().parents[1] / "app"
    allowed = app_root / "constants" / "versions.py"

    offenders: list[str] = []
    for path in app_root.rglob("*.py"):
        if path == allowed:
            continue
        tree = ast.parse(path.read_text(encoding="utf-8"), filename=str(path))
        for node in ast.walk(tree):
            if isinstance(node, ast.Constant) and node.value == API_RESPONSE_VERSION:
                offenders.append(f"{path.relative_to(app_root.parent)}:{node.lineno}")

    assert not offenders, (
        "Import API_RESPONSE_VERSION (non-chart surfaces) or CHART_CALCULATION_VERSION "
        f"(charts) from app.constants.versions instead of the literal: {offenders}"
    )


# ── equal bhava is derived, never zipped ──────────────────────────────────────

def _chart_id_for(birth_profile_id: str) -> str:
    with SessionLocal() as session:
        chart = session.execute(
            select(Chart).where(Chart.birth_profile_id == UUID(birth_profile_id))
        ).scalars().one()
        return str(chart.chart_id)


def _mandhi_row(session, chart_id: str) -> ChartPlanet:
    return session.execute(
        select(ChartPlanet).where(
            ChartPlanet.chart_id == UUID(chart_id), ChartPlanet.graha == "MANDHI"
        )
    ).scalars().one()


def test_a_stale_stored_bhava_house_cannot_reattach_to_maandhi(client, birth_profile_payload_factory):
    """Maandhi is rederived on the persisted path; its stored row is not trusted.

    Rows written before the 2026-09-29 ruling hold Saturn's-eighth-part Gulika —
    routinely a different rasi, up to ~20 deg away — and nothing on the row says
    which definition it is. The zip handed that stale house straight back to the
    newly derived point, defeating the rederivation entirely. Simulated here by
    corrupting the stored house, which is indistinguishable from the real case.

    Restore the zip and ``equalBhava.MANDHI`` comes back as the corrupted value.
    """
    birth_profile_id = _create_profile(client, birth_profile_payload_factory)
    chart_id = _chart_id_for(birth_profile_id)

    with SessionLocal() as session, session.begin():
        row = _mandhi_row(session, chart_id)
        honest_house = int(row.bhava_house)
        stale_house = (honest_house + 5 - 1) % 12 + 1
        row.bhava_house = stale_house

    body = client.get(f"/api/v1/charts/{chart_id}").json()
    assert body["data"]["equalBhava"]["MANDHI"] == honest_house
    assert body["data"]["equalBhava"]["MANDHI"] != stale_house


def test_a_nine_graha_chart_still_places_maandhi_in_a_bhava(client, birth_profile_payload_factory):
    """Charts written before Maandhi was published carry nine rows, not ten.

    The zip then ran off the end — ``strict=False``, so it silently produced nine
    pairs and no Maandhi entry at all. The guard beside it could not catch that:
    it checked that every value present was a house in 1..12, and all nine were.
    A missing key is not an invalid value.

    Restore the zip and ``MANDHI`` is absent from ``equalBhava``.
    """
    birth_profile_id = _create_profile(client, birth_profile_payload_factory)
    chart_id = _chart_id_for(birth_profile_id)

    with SessionLocal() as session, session.begin():
        session.delete(_mandhi_row(session, chart_id))

    body = client.get(f"/api/v1/charts/{chart_id}").json()
    equal_bhava = body["data"]["equalBhava"]
    assert "MANDHI" in equal_bhava
    assert equal_bhava["MANDHI"] in range(1, 13)
    # The nine grahas must be unaffected — this path recomputes from the same
    # inputs that wrote the column, so it owes identical houses, not merely
    # plausible ones.
    assert len(equal_bhava) == 10
    assert {p["graha"] for p in body["data"]["planets"]} == set(equal_bhava)


def test_recomputed_bhava_matches_the_stored_column_for_the_nine_grahas(
    client, birth_profile_payload_factory
):
    """The guard against the fix over-reaching.

    ``compute_equal_bhava`` is ``(longitude - lagna) // 30`` over exactly the
    inputs that wrote ``chart_planets.bhava_house``, so replacing the stored read
    with a recompute must be bit-identical for every real graha. If this drifts,
    the two are no longer the same calculation and the recompute is changing
    answers rather than repairing one.
    """
    birth_profile_id = _create_profile(client, birth_profile_payload_factory)
    chart_id = _chart_id_for(birth_profile_id)

    with SessionLocal() as session:
        stored = {
            row.graha: int(row.bhava_house)
            for row in session.execute(
                select(ChartPlanet).where(ChartPlanet.chart_id == UUID(chart_id))
            ).scalars()
            if row.graha != "MANDHI" and row.bhava_house is not None
        }

    equal_bhava = client.get(f"/api/v1/charts/{chart_id}").json()["data"]["equalBhava"]
    assert stored, "fixture chart stored no bhava houses; the comparison would be vacuous"
    assert {g: equal_bhava[g] for g in stored} == stored
