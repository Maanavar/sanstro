"""End-to-end API test for GET /charts/{id}/ashtottari-dasha.

Exercises the full stack (route -> service -> engine -> applicability evaluator)
against a real persisted chart, so the response contract the shared client /
web panel / mobile depend on is verified — in particular the informational
applicability verdict added in the EC-6 follow-up (never gates the timeline).
"""
from __future__ import annotations

_SYNTHETIC_PROFILE = {
    "ownerUserId": "33333333-3333-3333-3333-333333333333",
    "displayName": "Arjun Kumar",
    "birthDateLocal": "1991-07-22",
    "birthTimeLocal": "06:30:00",
    "birthPlace": "Chennai, Tamil Nadu, India",
    "birthLatitude": 13.0827,
    "birthLongitude": 80.2707,
    "birthTimezone": "Asia/Kolkata",
    "calculateNow": True,
}

_PLANETS = {"SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN", "RAHU"}


def _create_chart(client) -> str:
    return client.post("/api/v1/birth-profiles", json=_SYNTHETIC_PROFILE).json()["data"]["chartId"]


def test_ashtottari_endpoint_returns_timeline_and_applicability(client):
    chart_id = _create_chart(client)
    response = client.get(f"/api/v1/charts/{chart_id}/ashtottari-dasha", params={"asOf": "2026-05-21"})

    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    data = body["data"]
    assert data["chartId"] == chart_id

    # Timeline still renders unconditionally (never gated on applicability).
    assert data["current"]["mahadasha"]["lord"] in _PLANETS
    assert data["current"]["antardasha"]["lord"] in _PLANETS
    assert len(data["mahadashas"]) >= 8

    # Informational applicability verdict (EC-6 follow-up).
    appl = data["applicability"]
    assert appl["ruleEn"] and appl["ruleTa"]
    # Primary positional rule is a tri-state, never a silent drop.
    assert appl["applicable"] in {True, False, None}
    assert isinstance(appl["reason"], str) and appl["reason"]
    # Secondary paksha/day-night condition is surfaced separately, also tri-state.
    assert appl["paksha"] in {"SHUKLA", "KRISHNA"}
    assert appl["pakshaSupports"] in {True, False, None}
    assert isinstance(appl["pakshaReason"], str) and appl["pakshaReason"]
    assert isinstance(appl["isDayBirthApproximate"], bool)
    assert appl["isDayBirth"] in {True, False, None}


def test_ashtottari_applicability_day_birth_from_true_horizon(client):
    """06:30 IST in Chennai (sunrise ~05:50) is a day birth; when the ephemeris
    resolves true sunrise/sunset the precise path reports it above the horizon,
    which drives the secondary paksha condition."""
    chart_id = _create_chart(client)
    appl = client.get(f"/api/v1/charts/{chart_id}/ashtottari-dasha").json()["data"]["applicability"]

    if not appl["isDayBirthApproximate"]:
        assert appl["isDayBirth"] is True
        # Secondary condition = day+Krishna OR night+Shukla. For this day birth it
        # supports iff the paksha is Krishna — assert the two stay consistent.
        assert appl["pakshaSupports"] is (appl["paksha"] == "KRISHNA")
