"""Per-section outcome reporting on /daily-snapshot (P1-1).

The endpoint assembles five independent sections and used to wrap each one in
`except Exception: pass`. A section that failed came back absent — which is
exactly what a section you never asked for looks like, and what a section you
are not entitled to looks like. So the user got an incomplete reading presented
as a complete one, and the operator got nothing at all: no log line, no counter,
no 500. Given this codebase's history of silent astrology regressions, that is
the failure mode that hides them.

These pin both halves of the fix — the client can tell "failed" from "not asked
for", and every failure leaves a log record — and, most importantly, that one
failing section still does not take the other four down with it.
"""
from __future__ import annotations

import logging

import pytest

from app.api import daily_snapshot as snapshot_module
from app.core.auth import get_optional_user
from app.main import app

CHENNAI = {"lat": 13.0827, "lng": 80.2707, "tz": "Asia/Kolkata"}


def _create_chart(client) -> str:
    created = client.post(
        "/api/v1/birth-profiles",
        json={
            "ownerUserId": "11111111-1111-1111-1111-111111111111",
            "displayName": "Daily Snapshot Test",
            "birthDateLocal": "1991-07-22",
            "birthTimeLocal": "06:30:00",
            "birthPlace": "Chennai, Tamil Nadu, India",
            "birthLatitude": 13.0827,
            "birthLongitude": 80.2707,
            "birthTimezone": "Asia/Kolkata",
            "calculateNow": True,
        },
    )
    assert created.status_code == 200, created.text
    chart = client.post(
        "/api/v1/charts/calculate",
        json={
            "birthProfileId": created.json()["data"]["birthProfileId"],
            "calculationVersion": "thirukanitham-2026-v1",
            "forceRecalculate": False,
        },
    )
    assert chart.status_code == 200, chart.text
    return chart.json()["data"]["chartId"]


@pytest.fixture()
def signed_in_client(client):
    """`client` overrides get_current_user; this endpoint takes the optional
    dependency instead, so it needs its own override to be seen as signed in."""
    from uuid import UUID

    from app.models.user import User
    from tests.conftest import TEST_USER_EMAIL, TEST_USER_ID

    # Must be the same user `client` signs in as: birth-profiles overwrites the
    # posted ownerUserId with the authenticated user, so a different stub here
    # makes every chart section come back not_requested on an ownership check
    # rather than exercising the failure path under test.
    stub = User(user_id=UUID(TEST_USER_ID), email=TEST_USER_EMAIL)
    app.dependency_overrides[get_optional_user] = lambda: stub
    yield client
    app.dependency_overrides.pop(get_optional_user, None)


def _sections(response) -> dict[str, str]:
    assert response.status_code == 200, response.text
    return response.json()["data"]["sections"]


def _boom(*_args, **_kwargs):
    raise RuntimeError("synthetic failure")


# --------------------------------------------------------------------------- #
# Not requested is not a failure                                              #
# --------------------------------------------------------------------------- #

def test_sections_absent_from_the_request_are_marked_not_requested(raw_client):
    sections = _sections(raw_client.get("/api/v1/daily-snapshot"))

    assert sections == {
        "panchangam": "not_requested",
        "rasi_palan": "not_requested",
        "guidance": "not_requested",
        "life_areas": "not_requested",
        "life_events": "not_requested",
    }


def test_chart_sections_are_not_requested_for_an_anonymous_caller(raw_client):
    sections = _sections(
        raw_client.get("/api/v1/daily-snapshot", params={**CHENNAI, "rasi": "mesham"})
    )

    assert sections["panchangam"] == "ok"
    assert sections["rasi_palan"] == "ok"
    # Not entitled is not broken. The client must not show these as errors.
    assert sections["guidance"] == "not_requested"
    assert sections["life_areas"] == "not_requested"
    assert sections["life_events"] == "not_requested"


# --------------------------------------------------------------------------- #
# A failing section says so, and says so in the log                           #
# --------------------------------------------------------------------------- #

def test_panchangam_failure_is_reported_and_logged(raw_client, monkeypatch, caplog):
    monkeypatch.setattr(snapshot_module, "calculate_panchangam", _boom)

    with caplog.at_level(logging.ERROR, logger="app.api.daily_snapshot"):
        sections = _sections(raw_client.get("/api/v1/daily-snapshot", params=CHENNAI))

    assert sections["panchangam"] == "unavailable"
    assert any("daily_snapshot_panchangam_failed" in r.message for r in caplog.records)
    # logger.exception, not logger.error: the traceback is the point.
    assert any(r.exc_info for r in caplog.records)


def test_rasi_palan_failure_is_reported_and_logged(raw_client, monkeypatch, caplog):
    monkeypatch.setattr(snapshot_module, "_resolve_rasi_number", _boom)

    with caplog.at_level(logging.ERROR, logger="app.api.daily_snapshot"):
        sections = _sections(
            raw_client.get("/api/v1/daily-snapshot", params={**CHENNAI, "rasi": "mesham"})
        )

    assert sections["rasi_palan"] == "unavailable"
    assert any("daily_snapshot_rasi_palan_failed" in r.message for r in caplog.records)


def test_bad_rasi_is_invalid_input_not_a_server_failure(raw_client, caplog):
    """`_resolve_rasi_number` raises ValueError, and only ValueError, for a rasi
    it cannot parse. That is the caller's parameter being wrong, and it must not
    be counted or alerted on as this service breaking."""
    with caplog.at_level(logging.ERROR, logger="app.api.daily_snapshot"):
        sections = _sections(
            raw_client.get("/api/v1/daily-snapshot", params={**CHENNAI, "rasi": "notarasi"})
        )

    assert sections["rasi_palan"] == "invalid_input"
    assert not any("daily_snapshot_rasi_palan_failed" in r.message for r in caplog.records)


@pytest.mark.parametrize(
    ("attr", "section", "event"),
    [
        ("get_daily_guidance", "guidance", "daily_snapshot_guidance_failed"),
        ("get_life_areas", "life_areas", "daily_snapshot_life_areas_failed"),
        ("get_life_event_windows", "life_events", "daily_snapshot_life_events_failed"),
    ],
)
def test_each_chart_section_reports_its_own_failure(
    signed_in_client, monkeypatch, caplog, attr, section, event
):
    chart_id = _create_chart(signed_in_client)
    monkeypatch.setattr(snapshot_module, attr, _boom)

    with caplog.at_level(logging.ERROR, logger="app.api.daily_snapshot"):
        sections = _sections(
            signed_in_client.get(
                "/api/v1/daily-snapshot", params={**CHENNAI, "chartId": chart_id}
            )
        )

    assert sections[section] == "unavailable"
    assert any(event in r.message for r in caplog.records)


# --------------------------------------------------------------------------- #
# The point of the whole design                                               #
# --------------------------------------------------------------------------- #

def test_one_failing_section_does_not_take_the_others_down(
    signed_in_client, monkeypatch
):
    chart_id = _create_chart(signed_in_client)
    monkeypatch.setattr(snapshot_module, "get_life_areas", _boom)

    response = signed_in_client.get(
        "/api/v1/daily-snapshot",
        params={**CHENNAI, "rasi": "mesham", "chartId": chart_id},
    )
    body = response.json()["data"]

    assert response.status_code == 200
    assert body["sections"]["life_areas"] == "unavailable"
    assert body["life_areas"] is None
    # The four healthy sections still arrive, with data.
    for section in ("panchangam", "rasi_palan", "guidance", "life_events"):
        assert body["sections"][section] == "ok", body["sections"]
        assert body[section] is not None
