def test_daily_panchangam_endpoint_returns_structured_daily_data(client):
    response = client.get(
        "/api/v1/panchangam/daily",
        params={
            "date": "2026-05-21",
            "lat": 9.9252,
            "lng": 78.1198,
            "timezone": "Asia/Kolkata",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["data"]["vara"]["weekday"] == "THURSDAY"
    assert body["data"]["vara"]["lord"] == "GURU"
    assert body["data"]["tithi"]["number"] == 5
    assert body["data"]["kalam"]["rahuKalam"]["slot"] == 6
    assert body["data"]["kalam"]["yamagandam"]["slot"] == 1
    assert body["data"]["kalam"]["kuligai"]["slot"] == 7
    assert len(body["data"]["hora"]) == 24


def test_panchangam_timings_endpoint_returns_timing_windows(client):
    response = client.get(
        "/api/v1/panchangam/timings",
        params={
            "date": "2026-05-21",
            "lat": 9.9252,
            "lng": 78.1198,
            "timezone": "Asia/Kolkata",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["data"]["kalam"]["rahuKalam"]["slot"] == 6
    assert body["data"]["abhijit"]["isRestrictedByWeekday"] is False
    assert len(body["data"]["hora"]) == 24
