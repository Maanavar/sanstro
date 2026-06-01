from __future__ import annotations

from uuid import uuid4


def _create_chart(client) -> str:
    created = client.post(
        "/api/v1/birth-profiles",
        json={
            "ownerUserId": "11111111-1111-1111-1111-111111111111",
            "displayName": "Muhurta Test",
            "birthDateLocal": "1991-07-22",
            "birthTimeLocal": "06:30:00",
            "birthPlace": "Chennai, Tamil Nadu, India",
            "birthLatitude": 13.0827,
            "birthLongitude": 80.2707,
            "birthTimezone": "Asia/Kolkata",
            "calculateNow": True,
        },
    )
    assert created.status_code == 200
    birth_profile_id = created.json()["data"]["birthProfileId"]

    chart = client.post(
        "/api/v1/charts/calculate",
        json={
            "birthProfileId": birth_profile_id,
            "calculationVersion": "thirukanitham-2026-v1",
            "forceRecalculate": False,
        },
    )
    assert chart.status_code == 200
    return chart.json()["data"]["chartId"]


def test_muhurta_happy_path(client):
    chart_id = _create_chart(client)
    response = client.get(
        f"/api/v1/charts/{chart_id}/muhurta",
        params={"activity": "SPIRITUAL", "dateFrom": "2026-06-01", "dateTo": "2026-06-03"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["data"]["activity"] == "SPIRITUAL"
    assert isinstance(body["data"]["slots"], list)


def test_muhurta_requires_auth(raw_client):
    response = raw_client.get(
        f"/api/v1/charts/{uuid4()}/muhurta",
        params={"activity": "SPIRITUAL", "dateFrom": "2026-06-01", "dateTo": "2026-06-03"},
    )
    assert response.status_code == 401


def test_muhurta_not_found_for_missing_chart(client):
    response = client.get(
        f"/api/v1/charts/{uuid4()}/muhurta",
        params={"activity": "SPIRITUAL", "dateFrom": "2026-06-01", "dateTo": "2026-06-03"},
    )
    assert response.status_code == 404
