"""Auth layer tests — JWT validation and protected endpoint enforcement."""
from __future__ import annotations

from datetime import timedelta

from app.core.auth import create_access_token

# ── Token creation / decode ───────────────────────────────────────────────────


def test_create_access_token_is_string():
    token = create_access_token(subject="user@test.com")
    assert isinstance(token, str)
    assert len(token) > 20


def test_create_access_token_with_custom_expiry():
    token = create_access_token(subject="user@test.com", expires_delta=timedelta(minutes=5))
    assert isinstance(token, str)


# ── Protected endpoint: no token → 403 ────────────────────────────────────────


def test_birth_profiles_post_requires_auth(raw_client):
    resp = raw_client.post("/api/v1/birth-profiles", json={
        "ownerUserId": "11111111-1111-1111-1111-111111111111",
        "displayName": "Test",
        "birthDateLocal": "1990-01-01",
        "birthTimeLocal": "06:00:00",
        "birthPlace": "Chennai, Tamil Nadu, India",
        "birthLatitude": 13.0827,
        "birthLongitude": 80.2707,
        "birthTimezone": "Asia/Kolkata",
        "calculateNow": False,
    })
    assert resp.status_code in (401, 403)


def test_family_vaults_requires_auth(raw_client):
    resp = raw_client.get("/api/v1/family-vaults")
    assert resp.status_code in (401, 403)


def test_panchangam_requires_auth(raw_client):
    resp = raw_client.get("/api/v1/panchangam/daily", params={
        "date": "2025-05-20", "lat": 13.08, "lng": 80.27, "tz": "Asia/Kolkata",
    })
    assert resp.status_code in (401, 403)


# ── Invalid token → 401 ───────────────────────────────────────────────────────


def test_invalid_token_rejected(raw_client):
    resp = raw_client.get("/api/v1/family-vaults", headers={"Authorization": "Bearer this.is.garbage"})
    assert resp.status_code == 401


def test_expired_token_rejected(raw_client):
    expired = create_access_token(subject="user@test.com", expires_delta=timedelta(seconds=-1))
    resp = raw_client.get("/api/v1/family-vaults", headers={"Authorization": f"Bearer {expired}"})
    assert resp.status_code == 401


# ── Valid token → auto-provision user, request succeeds ──────────────────────


def test_valid_token_accepted_and_provisions_user(raw_client):
    token = create_access_token(subject="newuser@jothidam.test")
    resp = raw_client.get("/api/v1/family-vaults", headers={"Authorization": f"Bearer {token}"})
    # 200 because the user is provisioned on first hit and has no vaults yet
    assert resp.status_code == 200
    body = resp.json()
    assert body["data"]["totalCount"] == 0


def test_valid_uuid_subject_token(raw_client):
    token = create_access_token(subject="bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")
    resp = raw_client.get("/api/v1/family-vaults", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200


# ── Admin endpoint requires admin key ─────────────────────────────────────────


def test_admin_stats_requires_admin_key(raw_client):
    token = create_access_token(subject="user@test.com")
    # Valid JWT but no X-Admin-Key header
    resp = raw_client.get("/api/v1/admin/stats", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 403


def test_admin_stats_wrong_key_rejected(raw_client):
    token = create_access_token(subject="user@test.com")
    resp = raw_client.get(
        "/api/v1/admin/stats",
        headers={"Authorization": f"Bearer {token}", "X-Admin-Key": "wrong_key"},
    )
    assert resp.status_code == 403
