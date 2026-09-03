"""End-to-end API test for GET /charts/{id}/conditional-dashas.

Exercises the full stack (route -> service -> engine -> selector) against a
real persisted chart, so the response contract the shared client / web panel /
mobile depend on is verified, not just the pure calc.
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

_EXPECTED = {
    "shodashottari": 116,
    "dwadashottari": 112,
    "panchottari": 105,
    "shatabdika": 100,
    "chaturashiti_sama": 84,
    "dwisaptati_sama": 72,
    "shashtihayani": 60,
}

_PLANETS = {"SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN", "RAHU", "KETU"}


def _create_chart(client) -> str:
    return client.post("/api/v1/birth-profiles", json=_SYNTHETIC_PROFILE).json()["data"]["chartId"]


def test_conditional_dashas_endpoint_returns_all_seven(client):
    chart_id = _create_chart(client)
    response = client.get(f"/api/v1/charts/{chart_id}/conditional-dashas", params={"asOf": "2026-05-21"})

    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    data = body["data"]
    assert data["chartId"] == chart_id

    dashas = {d["key"]: d for d in data["dashas"]}
    assert set(dashas) == set(_EXPECTED)

    for key, total in _EXPECTED.items():
        d = dashas[key]
        assert d["totalYears"] == total
        assert d["nameEn"] and d["nameTa"]
        assert d["applicabilityEn"] and d["applicabilityTa"]
        # Current maha/antar resolve to real lords and dates.
        assert d["current"]["mahadasha"]["lord"] in _PLANETS
        assert d["current"]["antardasha"]["lord"] in _PLANETS
        assert d["current"]["mahadasha"]["startDate"] <= "2026-05-21" <= d["current"]["mahadasha"]["endDate"]
        assert len(d["mahadashas"]) >= len(d["antardashas"]) >= 2
        # The opening antardasha of the running mahadasha is that maha's own lord.
        assert d["antardashas"][0]["lord"] == d["current"]["mahadasha"]["lord"]


def test_conditional_dashas_applicability_report(client):
    chart_id = _create_chart(client)
    data = client.get(f"/api/v1/charts/{chart_id}/conditional-dashas").json()["data"]

    appl = data["applicability"]
    assert appl["paksha"] in {"SHUKLA", "KRISHNA"}
    assert isinstance(appl["isDayBirthApproximate"], bool)
    assert appl["isDayBirth"] in {True, False, None}

    # EC-5.2: 06:30 IST in Chennai (sunrise ~05:50) is a day birth. When the
    # ephemeris resolves true sunrise/sunset, the precise (non-approximate)
    # path is used and the birth is above the horizon.
    if not appl["isDayBirthApproximate"]:
        assert appl["isDayBirth"] is True

    results = {r["key"]: r for r in appl["results"]}
    assert set(results) == set(_EXPECTED)
    for r in results.values():
        # Never silently drops a system; applicability is a tri-state.
        assert r["applicable"] in {True, False, None}
        assert isinstance(r["reason"], str) and r["reason"]


def test_conditional_dashas_day_night_from_true_horizon(client):
    """EC-5.2: day/night is derived from the birth-time true sunrise/sunset,
    so a night birth at the same place flips isDayBirth to False."""
    night_profile = {**_SYNTHETIC_PROFILE, "birthTimeLocal": "23:30:00"}
    chart_id = client.post("/api/v1/birth-profiles", json=night_profile).json()["data"]["chartId"]
    appl = client.get(f"/api/v1/charts/{chart_id}/conditional-dashas").json()["data"]["applicability"]

    # 23:30 IST in Chennai is well after sunset — a night birth. Only assert the
    # flip on the precise path; the whole-sign fallback can't be relied on here.
    if not appl["isDayBirthApproximate"]:
        assert appl["isDayBirth"] is False


def test_conditional_dashas_defaults_to_today(client):
    chart_id = _create_chart(client)
    response = client.get(f"/api/v1/charts/{chart_id}/conditional-dashas")
    assert response.status_code == 200
    assert response.json()["data"]["asOf"]
