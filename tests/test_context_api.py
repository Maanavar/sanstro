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


def test_context_upsert_and_get_merge(client):
    chart_id = _create_chart(client)

    first = client.post(
        "/api/v1/context",
        json={
            "chartId": chart_id,
            "lifeSituation": {"job": "stressed", "health": "ok"},
            "activeEvents": [{"type": "big_meeting", "date": "2026-05-24", "note": "3pm"}],
            "reactionHistory": [{"date": "2026-05-23", "guidanceScore": 72, "userFelt": "accurate"}],
        },
    )
    assert first.status_code == 200
    first_body = first.json()["data"]
    assert first_body["chartId"] == chart_id
    assert first_body["lifeSituation"]["job"] == "stressed"
    assert len(first_body["activeEvents"]) == 1
    assert len(first_body["reactionHistory"]) == 1

    second = client.post(
        "/api/v1/context",
        json={
            "chartId": chart_id,
            "lifeSituation": {"relationship": "married"},
            "activeEvents": [{"type": "travel", "date": "2026-05-25", "note": "early flight"}],
        },
    )
    assert second.status_code == 200
    second_body = second.json()["data"]
    assert second_body["lifeSituation"]["job"] == "stressed"
    assert second_body["lifeSituation"]["relationship"] == "married"
    assert len(second_body["activeEvents"]) == 2
    assert second_body["activeEvents"][0]["type"] == "big_meeting"
    assert second_body["activeEvents"][1]["type"] == "travel"

    fetched = client.get("/api/v1/context", params={"chartId": chart_id})
    assert fetched.status_code == 200
    fetched_body = fetched.json()["data"]
    assert fetched_body["contextId"] == second_body["contextId"]
    assert fetched_body["lifeSituation"]["health"] == "ok"
    assert len(fetched_body["activeEvents"]) == 2

