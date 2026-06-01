from __future__ import annotations


def assert_response(response, status=200, required_keys=()):
    assert response.status_code == status
    data = response.json()
    for key in required_keys:
        assert key in data, f"Missing key '{key}' in response"
    return data


def test_journal_settings_default_and_update(client):
    default_resp = client.get("/api/v1/settings/journal")
    default_payload = assert_response(default_resp, status=200, required_keys=("data",))
    default_data = default_payload["data"]
    assert default_data["journalRetentionDays"] == 365
    assert default_data["lastUpdatedAt"] is not None
    assert default_data["lastRetentionReviewedAt"] is None
    assert default_data["nextRecommendedReviewDate"] is not None

    updated = client.patch(
        "/api/v1/settings/journal",
        json={"journalRetentionDays": 90},
    )
    updated_data = assert_response(updated, status=200, required_keys=("data",))["data"]
    assert updated_data["journalRetentionDays"] == 90
    assert updated_data["lastUpdatedAt"] is not None
    assert updated_data["nextRecommendedReviewDate"] is not None

    fetch_again = client.get("/api/v1/settings/journal")
    fetch_data = assert_response(fetch_again, status=200, required_keys=("data",))["data"]
    assert fetch_data["journalRetentionDays"] == 90
    assert fetch_data["lastUpdatedAt"] is not None
    assert fetch_data["nextRecommendedReviewDate"] is not None


def test_journal_settings_reminder_acknowledgement_updates_review_timestamp(client):
    before = client.get("/api/v1/settings/journal")
    before_data = assert_response(before, status=200, required_keys=("data",))["data"]
    assert before_data["lastRetentionReviewedAt"] is None

    acknowledged = client.patch(
        "/api/v1/settings/journal",
        json={
            "journalRetentionDays": before_data["journalRetentionDays"],
            "acknowledgeReminder": True,
        },
    )
    ack_data = assert_response(acknowledged, status=200, required_keys=("data",))["data"]
    assert ack_data["lastRetentionReviewedAt"] is not None
    assert ack_data["nextRecommendedReviewDate"] is not None
