"""Tests for P1-F rectification assistant."""
from __future__ import annotations

import pytest


# ── Unit tests ────────────────────────────────────────────────────────────────


def test_lagna_supports_marriage_for_house_7():
    from app.services.rectification_service import _lagna_supports_event

    assert _lagna_supports_event(7, "MARRIAGE") is True


def test_lagna_does_not_support_marriage_for_house_3():
    from app.services.rectification_service import _lagna_supports_event

    assert _lagna_supports_event(3, "MARRIAGE") is False


def test_lagna_supports_relocation_for_house_12():
    from app.services.rectification_service import _lagna_supports_event

    assert _lagna_supports_event(12, "RELOCATION") is True


def test_lagna_supports_health_for_house_6():
    from app.services.rectification_service import _lagna_supports_event

    assert _lagna_supports_event(6, "HEALTH_MAJOR") is True


def test_lagna_supports_parent_for_house_9():
    from app.services.rectification_service import _lagna_supports_event

    assert _lagna_supports_event(9, "PARENT_BIRTH") is True


# ── Integration tests ─────────────────────────────────────────────────────────


def _create_test_profile(client) -> str:
    bp = client.post("/api/v1/birth-profiles", json={
        "ownerUserId": "11111111-1111-1111-1111-111111111111",
        "displayName": "Rectify Test",
        "birthDateLocal": "1988-09-10",
        "birthTimeLocal": None,
        "birthPlace": "Chennai, India",
        "birthLatitude": 13.0827,
        "birthLongitude": 80.2707,
        "birthTimezone": "Asia/Kolkata",
        "birthTimeSource": "unknown",
        "calculateNow": False,
    })
    assert bp.status_code == 200, bp.text
    return bp.json()["data"]["birthProfileId"]


def test_rectify_endpoint_returns_candidates(client):
    profile_id = _create_test_profile(client)
    resp = client.post(
        f"/api/v1/birth-profiles/{profile_id}/rectify",
        json={
            "events": [
                {"eventType": "MARRIAGE", "eventYear": 2015},
                {"eventType": "RELOCATION", "eventYear": 2018},
            ]
        },
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["success"] is True
    data = body["data"]
    assert len(data["candidates"]) > 0
    assert "recommendedTime" in data
    assert "disclaimer" in data
    assert "Approximate" in data["disclaimer"]


def test_rectify_candidates_have_required_fields(client):
    profile_id = _create_test_profile(client)
    resp = client.post(
        f"/api/v1/birth-profiles/{profile_id}/rectify",
        json={
            "events": [{"eventType": "CAREER_BREAK", "eventYear": 2010}],
        },
    )
    assert resp.status_code == 200
    for cand in resp.json()["data"]["candidates"]:
        assert "timeLocal" in cand
        assert "lagnaRasi" in cand
        assert "lagnaRasiName" in cand
        assert "probabilityWeight" in cand
        assert "matchingEvents" in cand


def test_rectify_empty_events_returns_422(client):
    profile_id = _create_test_profile(client)
    resp = client.post(
        f"/api/v1/birth-profiles/{profile_id}/rectify",
        json={"events": []},
    )
    assert resp.status_code == 422


def test_rectify_apply_updates_birth_time(client):
    profile_id = _create_test_profile(client)

    # First estimate
    est_resp = client.post(
        f"/api/v1/birth-profiles/{profile_id}/rectify",
        json={"events": [{"eventType": "MARRIAGE", "eventYear": 2015}]},
    )
    assert est_resp.status_code == 200
    recommended = est_resp.json()["data"]["recommendedTime"]

    # Apply
    apply_resp = client.patch(
        f"/api/v1/birth-profiles/{profile_id}/rectify/apply",
        json={"selectedTime": recommended},
    )
    assert apply_resp.status_code == 200
    body = apply_resp.json()
    assert "birthProfileId" in body
    assert "appliedOffsetMinutes" in body
    assert "newBirthTimeLocal" in body


def test_rectify_apply_invalid_time_returns_422(client):
    profile_id = _create_test_profile(client)
    resp = client.patch(
        f"/api/v1/birth-profiles/{profile_id}/rectify/apply",
        json={"selectedTime": "not-a-time"},
    )
    assert resp.status_code == 422
