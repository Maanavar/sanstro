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
    assert body["data"]["openingDasha"]["lord"] == "SATURN"
    assert body["data"]["current"]["mahadasha"]["lord"] in {"SATURN", "MERCURY", "KETU", "VENUS", "SUN", "MOON", "MARS", "RAHU", "JUPITER"}
    assert body["data"]["current"]["antardasha"]["lord"] in {"SATURN", "MERCURY", "KETU", "VENUS", "SUN", "MOON", "MARS", "RAHU", "JUPITER"}
    assert body["data"]["current"]["pratyantardasha"]["lord"] in {"SATURN", "MERCURY", "KETU", "VENUS", "SUN", "MOON", "MARS", "RAHU", "JUPITER"}


def test_chart_dasha_sookshma_and_prana_implemented(client):
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

    # Sookshma (level 4) must now return 200 with 9 sub-periods
    response = client.get(f"/api/v1/charts/{chart_id}/dasha", params={"asOf": "2026-05-21", "level": "sookshma"})
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert len(body["data"]["timeline"]) == 9

    # Prana (level 5) must also return 200 with 9 sub-periods
    response = client.get(f"/api/v1/charts/{chart_id}/dasha", params={"asOf": "2026-05-21", "level": "prana"})
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert len(body["data"]["timeline"]) == 9

    # Invalid level must return 422 (not 501)
    response = client.get(f"/api/v1/charts/{chart_id}/dasha", params={"asOf": "2026-05-21", "level": "invalid"})
    assert response.status_code == 422
    detail = response.json()["detail"]
    assert isinstance(detail, dict)
    assert isinstance(detail.get("ta"), str) and detail["ta"].strip()
    assert isinstance(detail.get("en"), str) and detail["en"].strip()
