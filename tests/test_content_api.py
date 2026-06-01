from __future__ import annotations


def test_content_nakshatra_happy_path(client):
    response = client.get("/api/v1/content/nakshatra/1")
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["data"]["number"] == 1


def test_content_nakshatra_out_of_range_returns_422(client):
    response = client.get("/api/v1/content/nakshatra/99")
    assert response.status_code == 422


def test_content_unknown_path_returns_404(client):
    response = client.get("/api/v1/content/nakshatrax/1")
    assert response.status_code == 404
