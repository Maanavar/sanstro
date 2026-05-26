def test_health_endpoint(client):
    response = client.get("/health")

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ok"
    assert payload["service"] == "Vinaadi AI API"
    assert payload["version"] == "0.1.0"
    assert payload["environment"] == "development"
    assert "default-src 'self'" in response.headers["content-security-policy"]
    assert response.headers["strict-transport-security"] == "max-age=31536000; includeSubDomains"
