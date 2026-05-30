"""Tests for P1-B confidence layer on daily guidance and life areas."""
from __future__ import annotations

from datetime import date


def _create_test_chart(client) -> str:
    bp = client.post("/api/v1/birth-profiles", json={
        "ownerUserId": "11111111-1111-1111-1111-111111111111",
        "displayName": "Confidence Test",
        "birthDateLocal": "1985-03-20",
        "birthTimeLocal": "07:45:00",
        "birthPlace": "Chennai, India",
        "birthLatitude": 13.0827,
        "birthLongitude": 80.2707,
        "birthTimezone": "Asia/Kolkata",
        "calculateNow": True,
    })
    assert bp.status_code == 200
    chart = client.post("/api/v1/charts/calculate", json={
        "birthProfileId": bp.json()["data"]["birthProfileId"],
        "calculationVersion": "thirukanitham-2026-v1",
        "forceRecalculate": False,
    })
    assert chart.status_code == 200
    return chart.json()["data"]["chartId"]


def test_daily_guidance_has_confidence_field(client):
    chart_id = _create_test_chart(client)
    resp = client.get(
        f"/api/v1/charts/{chart_id}/daily-guidance",
        params={"date": date.today().isoformat()},
    )
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert "confidence" in data
    assert data["confidence"] in ("HIGH", "MEDIUM", "LOW")


def test_daily_guidance_has_confidence_reason(client):
    chart_id = _create_test_chart(client)
    resp = client.get(
        f"/api/v1/charts/{chart_id}/daily-guidance",
        params={"date": date.today().isoformat()},
    )
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert "confidenceReason" in data
    assert "en" in data["confidenceReason"]
    assert "ta" in data["confidenceReason"]
    assert len(data["confidenceReason"]["en"]) > 0


def test_life_areas_has_confidence_per_area(client):
    chart_id = _create_test_chart(client)
    resp = client.get(
        f"/api/v1/charts/{chart_id}/life-areas",
        params={"asOf": date.today().isoformat()},
    )
    assert resp.status_code == 200
    areas = resp.json()["data"]["areas"]
    assert len(areas) > 0
    for area in areas:
        assert "confidence" in area, f"Missing confidence in area {area.get('area')}"
        assert area["confidence"] in ("HIGH", "MEDIUM", "LOW")
        assert "confidenceReason" in area
        assert "en" in area["confidenceReason"]
        assert "ta" in area["confidenceReason"]
