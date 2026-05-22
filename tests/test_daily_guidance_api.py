def _birth_profile_payload():
    return {
        "ownerUserId": "11111111-1111-1111-1111-111111111111",
        "displayName": "Arjun Kumar",
        "birthDateLocal": "1991-07-22",
        "birthTimeLocal": "06:30:00",
        "birthPlace": "Chennai, Tamil Nadu, India",
        "birthLatitude": 13.0827,
        "birthLongitude": 80.2707,
        "birthTimezone": "Asia/Kolkata",
        "calculateNow": True,
    }


def _create_chart(client):
    created = client.post("/api/v1/birth-profiles", json=_birth_profile_payload())
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


def test_daily_guidance_endpoint_returns_daily_card(client):
    chart_id = _create_chart(client)

    response = client.get(
        f"/api/v1/charts/{chart_id}/daily-guidance",
        params={"date": "2026-05-21", "language": "ta-en"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["data"]["dateLocal"] == "2026-05-21"
    assert 0 <= body["data"]["score"] <= 100
    assert body["data"]["label"] in {"STRONG_SUPPORT", "GOOD", "BALANCED", "CAUTION", "RESTORATIVE"}
    assert set(body["data"]["scoreBreakdown"].keys()) == {
        "moonTransit",
        "dashaSupport",
        "panchangam",
        "gocharSupport",
        "personalCautions",
        "remedialActionSupport",
    }
    assert body["data"]["bestWindows"][0]["type"] == "ABHIJIT"
    assert body["data"]["cautionWindows"][0]["type"] == "RAHU_KALAM"
    # caution suggestion always references Rahu Kalam regardless of day label
    assert "Rahu" in body["data"]["cautionSuggestion"]["en"] or "Rahu" in body["data"]["cautionSuggestion"]["ta"]
    assert body["data"]["actionSuggestion"]["en"]
    assert body["data"]["cautionSuggestion"]["en"]
    assert body["data"]["text"]["en"]
    assert body["data"]["text"]["ta"]


def test_daily_guidance_range_endpoint_returns_multiple_days(client):
    created = client.post("/api/v1/birth-profiles", json=_birth_profile_payload()).json()
    birth_profile_id = created["data"]["birthProfileId"]

    response = client.post(
        "/api/v1/charts/calculate",
        json={
            "birthProfileId": birth_profile_id,
            "calculationVersion": "thirukanitham-2026-v1",
            "forceRecalculate": False,
        },
    )
    chart_id = response.json()["data"]["chartId"]

    range_response = client.get(
        "/api/v1/daily-guidance/range",
        params={"profileId": birth_profile_id, "from": "2026-05-21", "to": "2026-05-23", "language": "ta-en"},
    )

    assert range_response.status_code == 200
    body = range_response.json()["data"]
    assert body["profileId"] == birth_profile_id
    assert body["chartId"] == chart_id
    assert body["fromDate"] == "2026-05-21"
    assert body["toDate"] == "2026-05-23"
    assert len(body["items"]) == 3
