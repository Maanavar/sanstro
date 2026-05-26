from __future__ import annotations


def test_journal_settings_default_and_update(client):
    default_resp = client.get("/api/v1/settings/journal")
    assert default_resp.status_code == 200
    default_data = default_resp.json()["data"]
    assert default_data["journalRetentionDays"] == 365
    assert default_data["lastUpdatedAt"] is not None
    assert default_data["lastRetentionReviewedAt"] is None
    assert default_data["nextRecommendedReviewDate"] is not None

    updated = client.patch(
        "/api/v1/settings/journal",
        json={"journalRetentionDays": 90},
    )
    assert updated.status_code == 200
    updated_data = updated.json()["data"]
    assert updated_data["journalRetentionDays"] == 90
    assert updated_data["lastUpdatedAt"] is not None
    assert updated_data["nextRecommendedReviewDate"] is not None

    fetch_again = client.get("/api/v1/settings/journal")
    assert fetch_again.status_code == 200
    fetch_data = fetch_again.json()["data"]
    assert fetch_data["journalRetentionDays"] == 90
    assert fetch_data["lastUpdatedAt"] is not None
    assert fetch_data["nextRecommendedReviewDate"] is not None


def test_journal_settings_reminder_acknowledgement_updates_review_timestamp(client):
    before = client.get("/api/v1/settings/journal")
    assert before.status_code == 200
    before_data = before.json()["data"]
    assert before_data["lastRetentionReviewedAt"] is None

    acknowledged = client.patch(
        "/api/v1/settings/journal",
        json={
            "journalRetentionDays": before_data["journalRetentionDays"],
            "acknowledgeReminder": True,
        },
    )
    assert acknowledged.status_code == 200
    ack_data = acknowledged.json()["data"]
    assert ack_data["lastRetentionReviewedAt"] is not None
    assert ack_data["nextRecommendedReviewDate"] is not None
