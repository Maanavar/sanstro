from __future__ import annotations


def test_feedback_submit_requires_auth(raw_client):
    response = raw_client.post(
        "/api/v1/feedback",
        json={"category": "other", "message": "Anonymous feedback"},
    )
    assert response.status_code == 401


def test_feedback_submit_and_list(client):
    submit = client.post(
        "/api/v1/feedback",
        json={"category": "suggestion", "message": "Great work", "rating": 5},
    )
    assert submit.status_code == 200
    body = submit.json()
    assert body["received"] is True
    assert body["submitted_at"]

    listed = client.get("/api/v1/feedback")
    assert listed.status_code == 200
    data = listed.json()
    assert data["total"] >= 1
    assert isinstance(data["items"], list)


def test_feedback_unknown_path_returns_404(client):
    response = client.get("/api/v1/feedback/unknown")
    assert response.status_code == 404
