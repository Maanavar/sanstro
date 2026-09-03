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


def test_feedback_reward_toggle_round_trips(client):
    submit = client.post(
        "/api/v1/feedback",
        json={"category": "review", "message": "Loved the daily guidance", "rating": 5, "is_review": True},
    )
    assert submit.status_code == 200

    listed = client.get("/api/v1/feedback").json()
    feedback_id = listed["items"][0]["id"]
    assert listed["items"][0]["reward_qualified"] is False

    marked = client.patch(f"/api/v1/feedback/{feedback_id}/reward", json={"reward_qualified": True})
    assert marked.status_code == 200
    assert marked.json()["reward_qualified"] is True

    unmarked = client.patch(f"/api/v1/feedback/{feedback_id}/reward", json={"reward_qualified": False})
    assert unmarked.status_code == 200
    assert unmarked.json()["reward_qualified"] is False


def test_feedback_reward_toggle_unknown_id_returns_404(client):
    response = client.patch(
        "/api/v1/feedback/00000000-0000-0000-0000-000000000000/reward",
        json={"reward_qualified": True},
    )
    assert response.status_code == 404
