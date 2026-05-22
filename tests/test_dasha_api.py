def test_chart_dasha_endpoint_returns_vimshottari_timeline(client):
    created = client.post(
        "/api/v1/birth-profiles",
        json={
            "ownerUserId": "33333333-3333-3333-3333-333333333333",
            "displayName": "Arjun Kumar",
            "birthDateLocal": "1991-07-22",
            "birthTimeLocal": "06:30:00",
            "birthPlace": "Chennai, Tamil Nadu, India",
            "birthLatitude": 13.0827,
            "birthLongitude": 80.2707,
            "birthTimezone": "Asia/Kolkata",
            "calculateNow": True,
        },
    ).json()["data"]

    chart_id = created["chartId"]
    response = client.get(f"/api/v1/charts/{chart_id}/dasha", params={"asOf": "2026-05-21", "level": "pratyantar"})

    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["data"]["chartId"] == chart_id
    assert body["data"]["openingDasha"]["lord"] == "KETU"
    assert body["data"]["current"]["mahadasha"]["lord"] == "MOON"
    assert body["data"]["current"]["antardasha"]["lord"] == "MOON"
    assert body["data"]["current"]["pratyantardasha"]["lord"] == "RAHU"
