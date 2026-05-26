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


def test_retrospective_create_and_list(client):
    chart_id = _create_chart(client)

    created = client.post(
        "/api/v1/retrospective",
        json={
            "chartId": chart_id,
            "eventDate": "2019-07-15",
            "eventDescription": "lost my job and changed role",
            "eventType": "career",
        },
    )
    assert created.status_code == 200
    body = created.json()["data"]
    assert body["chartId"] == chart_id
    assert body["eventType"] == "career"
    assert body["activeDasha"]
    assert len(body["keyTransits"]) >= 1
    assert len(body["futureRecurrences"]) >= 1
    assert "possible window" in body["caution"]["en"].lower() or "similar quality" in body["caution"]["en"].lower()

    listed = client.get("/api/v1/retrospective", params={"chartId": chart_id})
    assert listed.status_code == 200
    items = listed.json()["data"]["items"]
    assert len(items) == 1
    assert items[0]["retrospectiveId"] == body["retrospectiveId"]


def test_retrospective_rejects_invalid_event_type(client):
    chart_id = _create_chart(client)
    response = client.post(
        "/api/v1/retrospective",
        json={
            "chartId": chart_id,
            "eventDate": "2019-07-15",
            "eventDescription": "some event",
            "eventType": "unknown",
        },
    )
    assert response.status_code == 422

