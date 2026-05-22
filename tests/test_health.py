def test_health_endpoint(client):
    response = client.get("/health")

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ok"
    assert payload["service"] == "Jothidam.AI API"
    assert payload["version"] == "0.1.0"
    assert payload["environment"] == "development"
