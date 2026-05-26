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


def test_decision_brief_prefers_stable_option_when_other_is_high_risk(client):
    chart_id = _create_chart(client)
    response = client.post(
        "/api/v1/decisions/brief",
        json={
            "chartId": chart_id,
            "optionA": {
                "label": "Stay in current role",
                "description": "Continue in current company and same city for steady career growth.",
            },
            "optionB": {
                "label": "Relocate for startup",
                "description": "Resign and relocate abroad for a new startup with loan pressure.",
            },
            "priority": "career",
            "targetDate": "2026-06-15",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["data"]["chartId"] == chart_id
    assert body["data"]["scenarioUsed"] == "job_change"
    assert body["data"]["recommended"] == "A"
    assert 0 <= body["data"]["confidence"] <= 100
    assert body["data"]["optionA"]["score"] > body["data"]["optionB"]["score"]
    assert len(body["data"]["optionA"]["alignmentNotes"]) == 3
    assert body["data"]["reasoning"]["en"]


def test_decision_brief_rejects_invalid_priority(client):
    chart_id = _create_chart(client)
    response = client.post(
        "/api/v1/decisions/brief",
        json={
            "chartId": chart_id,
            "optionA": {"label": "A", "description": "First option"},
            "optionB": {"label": "B", "description": "Second option"},
            "priority": "invalid-priority",
            "targetDate": "2026-06-15",
        },
    )
    assert response.status_code == 422

