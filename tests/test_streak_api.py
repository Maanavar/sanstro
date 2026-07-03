from __future__ import annotations

from datetime import timedelta
from uuid import UUID

from app.db.session import SessionLocal
from app.models.user_streak import UserStreak

TEST_USER_ID = UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")


def _shift_last_active(days_back: int) -> None:
    """Move the test user's last_active_date into the past to simulate elapsed days."""
    with SessionLocal() as session:
        with session.begin():
            row = session.get(UserStreak, TEST_USER_ID)
            assert row is not None
            row.last_active_date = row.last_active_date - timedelta(days=days_back)


def test_streak_requires_auth(raw_client):
    assert raw_client.get("/api/v1/streak").status_code == 401
    assert raw_client.post("/api/v1/streak/ping", json={}).status_code == 401


def test_get_streak_without_row_reports_zero(client):
    response = client.get("/api/v1/streak")
    assert response.status_code == 200
    body = response.json()
    assert body["data"]["days"] == 0
    assert body["data"]["lastActiveDate"] is None


def test_first_ping_starts_at_one_and_is_idempotent(client):
    response = client.post("/api/v1/streak/ping", json={})
    assert response.status_code == 200
    assert response.json()["data"]["days"] == 1

    again = client.post("/api/v1/streak/ping", json={})
    assert again.json()["data"]["days"] == 1

    current = client.get("/api/v1/streak")
    assert current.json()["data"]["days"] == 1
    assert current.json()["data"]["longestDays"] == 1


def test_consecutive_day_increments(client):
    client.post("/api/v1/streak/ping", json={})
    _shift_last_active(1)
    response = client.post("/api/v1/streak/ping", json={})
    assert response.json()["data"]["days"] == 2
    assert response.json()["data"]["longestDays"] == 2


def test_gap_resets_to_one(client):
    client.post("/api/v1/streak/ping", json={})
    _shift_last_active(1)
    client.post("/api/v1/streak/ping", json={})
    _shift_last_active(3)
    response = client.post("/api/v1/streak/ping", json={})
    assert response.json()["data"]["days"] == 1
    # longest survives the reset
    assert response.json()["data"]["longestDays"] == 2


def test_stale_row_reads_zero_without_ping(client):
    client.post("/api/v1/streak/ping", json={})
    _shift_last_active(3)
    response = client.get("/api/v1/streak")
    assert response.json()["data"]["days"] == 0
    assert response.json()["data"]["longestDays"] == 1


def test_local_seed_honored_only_on_first_ping(client):
    first = client.post("/api/v1/streak/ping", json={"localDays": 12})
    assert first.json()["data"]["days"] == 12
    assert first.json()["data"]["longestDays"] == 12

    again = client.post("/api/v1/streak/ping", json={"localDays": 99})
    assert again.json()["data"]["days"] == 12


def test_local_seed_out_of_range_rejected(client):
    response = client.post("/api/v1/streak/ping", json={"localDays": 9999})
    assert response.status_code == 422
