def test_birth_profile_create_returns_profile_and_chart_ids(client):
    response = client.post(
        "/api/v1/birth-profiles",
        json={
            "ownerUserId": "22222222-2222-2222-2222-222222222222",
            "displayName": "Arjun Kumar",
            "birthDateLocal": "1991-07-22",
            "birthTimeLocal": "06:30:00",
            "birthPlace": "Chennai, Tamil Nadu, India",
            "birthLatitude": 13.0827,
            "birthLongitude": 80.2707,
            "birthTimezone": "Asia/Kolkata",
            "calculateNow": True,
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["data"]["birthProfileId"] is not None
    assert body["data"]["chartId"] is not None
    assert body["data"]["calculationStatus"] == "completed"


def test_birth_profile_get_endpoint_returns_full_profile(client):
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
    )
    birth_profile_id = created.json()["data"]["birthProfileId"]

    response = client.get(f"/api/v1/birth-profiles/{birth_profile_id}")

    assert response.status_code == 200
    body = response.json()["data"]
    assert body["birthProfileId"] == birth_profile_id
    assert body["displayName"] == "Arjun Kumar"
    assert body["birthTimeLocal"] == "06:30:00"
    assert body["calculationStatus"] == "completed"


def test_birth_profile_without_time_can_be_saved_without_chart(client):
    response = client.post(
        "/api/v1/birth-profiles",
        json={
            "ownerUserId": "33333333-3333-3333-3333-333333333333",
            "displayName": "Unknown Time",
            "birthDateLocal": "1991-07-22",
            "birthTimeLocal": None,
            "birthPlace": "Chennai, Tamil Nadu, India",
            "birthLatitude": 13.0827,
            "birthLongitude": 80.2707,
            "birthTimezone": "Asia/Kolkata",
            "calculateNow": True,
        },
    )

    assert response.status_code == 200
    body = response.json()["data"]
    assert body["chartId"] is None
    assert body["calculationStatus"] == "pending"
