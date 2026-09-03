"""DASH-04 / DASH-02 / DASH-07 API tests.

Covers the composite dashboard-bundle endpoint (one round trip instead of ~13),
the comma-list dasha `level`, the activity-timing batch route, and the CSRF
gate on /reports/purchase. All birth data is the synthetic "Arjun Kumar"
fixture identity used across the suite.
"""
from __future__ import annotations

import pytest

BIRTH_PROFILE_PAYLOAD = {
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


@pytest.fixture()
def chart_id(client) -> str:
    created = client.post("/api/v1/birth-profiles", json=BIRTH_PROFILE_PAYLOAD).json()["data"]
    return created["chartId"]


def test_dasha_accepts_comma_separated_levels(client, chart_id):
    response = client.get(
        f"/api/v1/charts/{chart_id}/dasha",
        params={"asOf": "2026-07-13", "level": "maha,antar,pratyantar"},
    )
    assert response.status_code == 200
    timeline = response.json()["data"]["timeline"]
    levels = {item["level"] for item in timeline}
    assert levels == {"maha", "antar", "pratyantar"}
    # Single-level behavior is unchanged.
    single = client.get(
        f"/api/v1/charts/{chart_id}/dasha",
        params={"asOf": "2026-07-13", "level": "maha"},
    )
    assert single.status_code == 200
    assert {item["level"] for item in single.json()["data"]["timeline"]} == {"maha"}
    # An unknown level inside the list still 422s.
    bad = client.get(
        f"/api/v1/charts/{chart_id}/dasha",
        params={"asOf": "2026-07-13", "level": "maha,bogus"},
    )
    assert bad.status_code == 422


def test_dashboard_bundle_composes_sections(client, chart_id):
    response = client.get(
        f"/api/v1/charts/{chart_id}/dashboard-bundle",
        params={"date": "2026-07-13"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    data = body["data"]
    assert data["chartId"] == chart_id
    assert data["dateLocal"] == "2026-07-13"
    assert data["chart"]["chartId"] == chart_id
    assert data["summary"]["chartId"] == chart_id
    assert data["dailyGuidance"]["score"] is not None
    assert data["dailyGuidanceRange"]["items"] and len(data["dailyGuidanceRange"]["items"]) == 3
    # Combined dasha timeline carries all three levels the dashboard renders.
    assert {item["level"] for item in data["dasha"]["timeline"]} == {"maha", "antar", "pratyantar"}
    assert data["transit"] is not None
    assert data["sani"] is not None
    assert data["panchangam"] is not None
    assert data["panchangamTimings"] is not None
    assert data["lifeAreas"] is not None
    assert data["weekAhead"] is not None
    assert data["nakshatraCard"] is not None
    # Birth location only (no current location saved) — DASH-01 metadata.
    assert data["panchangamLocation"] == "birth"
    assert data["panchangamTimezone"] == "Asia/Kolkata"
    assert data["errors"] == {}


def test_dashboard_bundle_isolates_a_failing_section(client, chart_id, monkeypatch):
    """DASH-02: one broken calculation nulls its section, never the bundle."""
    import app.services.dashboard_bundle_service as bundle_service

    def boom(*args, **kwargs):
        raise RuntimeError("sani exploded")

    monkeypatch.setattr(bundle_service, "get_sani_cycle", boom)

    response = client.get(
        f"/api/v1/charts/{chart_id}/dashboard-bundle",
        params={"date": "2026-07-13"},
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["sani"] is None
    assert "sani" in data["errors"]
    # Neighboring sections are unaffected.
    assert data["dailyGuidance"] is not None
    assert data["panchangam"] is not None


def test_dashboard_bundle_unknown_chart_404s(client):
    response = client.get(
        "/api/v1/charts/00000000-0000-0000-0000-000000000000/dashboard-bundle",
        params={"date": "2026-07-13"},
    )
    assert response.status_code == 404


def test_activity_timing_batch(client, chart_id):
    response = client.get(
        "/api/v1/activity-timing/batch",
        params={
            "chartId": chart_id,
            "activities": "travel,property,definitely-not-an-activity",
            "month": "2026-07",
            "asOf": "2026-07-13",
        },
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["chartId"] == chart_id
    assert set(data["results"].keys()) == {"travel", "property", "definitely-not-an-activity"}
    assert data["results"]["travel"]["dateResult"]["dateLocal"] == "2026-07-13"
    assert data["results"]["property"]["topDates"]
    # Unknown activity nulls its own key instead of failing the batch.
    assert data["results"]["definitely-not-an-activity"] is None


def test_activity_timing_batch_rejects_empty_and_oversized(client, chart_id):
    empty = client.get(
        "/api/v1/activity-timing/batch",
        params={"chartId": chart_id, "activities": " , ,", "month": "2026-07"},
    )
    assert empty.status_code == 422
    oversized = client.get(
        "/api/v1/activity-timing/batch",
        params={"chartId": chart_id, "activities": ",".join(f"a{i}" for i in range(13)), "month": "2026-07"},
    )
    assert oversized.status_code == 422


def test_reports_purchase_requires_csrf_header(client):
    """DASH-07: the state-changing purchase POST enforces the same CSRF gate
    as logout / PATCH /me for cookie-authenticated callers."""
    client.cookies.set("vinaadi_token", "cookie-session")
    missing = client.post(
        "/api/v1/reports/purchase", json={"product_id": "vinaadi.ppu.report.1page"}
    )
    assert missing.status_code == 403

    with_header = client.post(
        "/api/v1/reports/purchase",
        json={"product_id": "vinaadi.ppu.report.1page"},
        headers={"X-Vinaadi-CSRF": "1"},
    )
    assert with_header.status_code == 200
    assert with_header.json()["status"] == "queued"
    client.cookies.delete("vinaadi_token")
