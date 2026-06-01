def _create_chart(client, birth_profile_payload_factory):
    created = client.post("/api/v1/birth-profiles", json=birth_profile_payload_factory())
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


def test_retrospective_create_and_list(client, birth_profile_payload_factory):
    chart_id = _create_chart(client, birth_profile_payload_factory)

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


def test_retrospective_rejects_invalid_event_type(client, birth_profile_payload_factory):
    chart_id = _create_chart(client, birth_profile_payload_factory)
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

