from __future__ import annotations


def test_personalized_muhurta_uses_a_transient_birth_chart_and_never_persists(client):
    response = client.post(
        "/api/v1/public/muhurta/personalized",
        json={
            "birth": {
                "displayName": "Test Reader",
                "birthDateLocal": "1992-04-18",
                "birthTimeLocal": "09:15:00",
                "birthLatitude": 12.9716,
                "birthLongitude": 77.5946,
                "birthTimezone": "Asia/Kolkata",
                "birthPlace": "Bengaluru, Karnataka, India",
            },
            "eventType": "JOB_START",
            "dateFrom": "2026-09-01",
            "dateTo": "2026-09-07",
            "lat": 12.9716,
            "lng": 77.5946,
            "timezone": "Asia/Kolkata",
            "place": "Bengaluru, Karnataka, India",
        },
    )

    assert response.status_code == 200
    payload = response.json()["data"]
    assert payload["chartId"] is None
    assert payload["activityLocation"]["place"] == "Bengaluru, Karnataka, India"
    assert payload["slots"]
    assert payload["slots"][0]["dashaSupport"] is not None
    assert payload["slots"][0]["factors"]


def test_personalized_muhurta_requires_birth_time(client):
    response = client.post(
        "/api/v1/public/muhurta/personalized",
        json={
            "birth": {
                "birthDateLocal": "1992-04-18",
                "birthLatitude": 12.9716,
                "birthLongitude": 77.5946,
                "birthTimezone": "Asia/Kolkata",
                "birthPlace": "Bengaluru, Karnataka, India",
            },
            "eventType": "JOB_START",
            "dateFrom": "2026-09-01",
            "dateTo": "2026-09-01",
            "lat": 12.9716,
            "lng": 77.5946,
            "timezone": "Asia/Kolkata",
        },
    )

    assert response.status_code == 422
    assert "Birth time is required" in response.json()["detail"]
