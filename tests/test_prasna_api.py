def test_prasna_endpoint_returns_structured_payload(client):
    response = client.post(
        "/api/v1/prasna",
        json={
            "questionArea": "MARRIAGE",
            "timezoneName": "Asia/Kolkata",
            "latitude": 13.0827,
            "longitude": 80.2707,
            "questionDateTimeLocal": "2026-06-01T10:30:00",
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["questionArea"] == "MARRIAGE"
    assert body["outlook"] in {"FAVOURABLE", "UNFAVOURABLE", "MIXED", "DELAY"}
    assert "positiveIndicators" in body
