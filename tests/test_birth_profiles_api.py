import json
from datetime import UTC, datetime, timedelta
from uuid import UUID

from app.core.encryption import decrypt_bytes
from app.db.session import SessionLocal
from app.models.birth_profile import BirthProfile


def test_birth_profile_create_returns_profile_and_chart_ids(client):
    response = client.post(
        "/api/v1/birth-profiles",
        json={
            "ownerUserId": "22222222-2222-2222-2222-222222222222",
            "displayName": "Arjun Kumar",
            "birthDateLocal": "1991-07-22",
            "birthTimeLocal": "06:30:00",
            "birthPlace": "Chennai, Tamil Nadu, India",
            "birthLatitude": 13.0827,
            "birthLongitude": 80.2707,
            "birthTimezone": "Asia/Kolkata",
            "calculateNow": True,
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["data"]["birthProfileId"] is not None
    assert body["data"]["chartId"] is not None
    assert body["data"]["calculationStatus"] == "completed"


def test_birth_profile_get_endpoint_returns_full_profile(client):
    created = client.post(
        "/api/v1/birth-profiles",
        json={
            "ownerUserId": "33333333-3333-3333-3333-333333333333",
            "displayName": "Arjun Kumar",
            "birthDateLocal": "1991-07-22",
            "birthTimeLocal": "06:30:00",
            "birthPlace": "Chennai, Tamil Nadu, India",
            "birthLatitude": 13.0827,
            "birthLongitude": 80.2707,
            "birthTimezone": "Asia/Kolkata",
            "calculateNow": True,
        },
    )
    birth_profile_id = created.json()["data"]["birthProfileId"]

    response = client.get(f"/api/v1/birth-profiles/{birth_profile_id}")

    assert response.status_code == 200
    body = response.json()["data"]
    assert body["birthProfileId"] == birth_profile_id
    assert body["displayName"] == "Arjun Kumar"
    assert body["birthTimeLocal"] == "06:30:00"
    assert body["calculationStatus"] == "completed"


def test_birth_profile_without_time_can_be_saved_without_chart(client):
    response = client.post(
        "/api/v1/birth-profiles",
        json={
            "ownerUserId": "33333333-3333-3333-3333-333333333333",
            "displayName": "Unknown Time",
            "birthDateLocal": "1991-07-22",
            "birthTimeLocal": None,
            "birthPlace": "Chennai, Tamil Nadu, India",
            "birthLatitude": 13.0827,
            "birthLongitude": 80.2707,
            "birthTimezone": "Asia/Kolkata",
            "calculateNow": True,
        },
    )

    assert response.status_code == 200
    body = response.json()["data"]
    assert body["chartId"] is None
    assert body["calculationStatus"] == "pending"


def test_birth_profile_me_latest_returns_latest_profile_for_current_user(client):
    first = client.post(
        "/api/v1/birth-profiles",
        json={
            "ownerUserId": "11111111-1111-1111-1111-111111111111",
            "displayName": "First Profile",
            "birthDateLocal": "1991-01-02",
            "birthTimeLocal": "06:30:00",
            "birthPlace": "Chennai, Tamil Nadu, India",
            "birthLatitude": 13.0827,
            "birthLongitude": 80.2707,
            "birthTimezone": "Asia/Kolkata",
            "calculateNow": True,
        },
    ).json()
    first_birth_profile_id = first["data"]["birthProfileId"]
    with SessionLocal() as session:
        profile = session.get(BirthProfile, UUID(first_birth_profile_id))
        assert profile is not None
        profile.created_at = datetime.now(UTC) - timedelta(days=1)
        session.commit()
    second = client.post(
        "/api/v1/birth-profiles",
        json={
            "ownerUserId": "44444444-4444-4444-4444-444444444444",
            "displayName": "Second Profile",
            "birthDateLocal": "1991-07-22",
            "birthTimeLocal": "06:30:00",
            "birthPlace": "Chennai, Tamil Nadu, India",
            "birthLatitude": 13.0827,
            "birthLongitude": 80.2707,
            "birthTimezone": "Asia/Kolkata",
            "calculateNow": True,
        },
    ).json()

    response = client.get("/api/v1/birth-profiles/me/latest")

    assert response.status_code == 200
    body = response.json()["data"]
    assert body["birthProfileId"] == second["data"]["birthProfileId"]
    assert body["displayName"] == "Second Profile"
    assert body["birthTimeLocal"] == "06:30:00"
    assert body["relationshipToOwner"] == "self"
    assert body["birthProfileId"] != first["data"]["birthProfileId"]


def test_birth_profile_me_latest_returns_404_when_no_profile_exists(client):
    response = client.get("/api/v1/birth-profiles/me/latest")

    assert response.status_code == 404
    assert response.json()["detail"] == "No birth profile found for the current user."


def test_birth_profile_create_persists_encrypted_payload(client):
    payload = {
        "ownerUserId": "22222222-2222-2222-2222-222222222222",
        "displayName": "Encrypted Profile",
        "birthDateLocal": "1991-07-22",
        "birthTimeLocal": "06:30:00",
        "birthPlace": "Chennai, Tamil Nadu, India",
        "birthLatitude": 13.0827,
        "birthLongitude": 80.2707,
        "birthTimezone": "Asia/Kolkata",
        "calculateNow": True,
    }
    created = client.post("/api/v1/birth-profiles", json=payload)
    birth_profile_id = UUID(created.json()["data"]["birthProfileId"])

    with SessionLocal() as session:
        record = session.get(BirthProfile, birth_profile_id)
        assert record is not None
        assert record.encrypted_birth_payload is not None
        decrypted = json.loads(decrypt_bytes(record.encrypted_birth_payload).decode("utf-8"))

    assert decrypted["birth_latitude"] == payload["birthLatitude"]
    assert decrypted["birth_longitude"] == payload["birthLongitude"]
    assert decrypted["birth_time_local"] == payload["birthTimeLocal"]
    assert decrypted["birth_date_local"] == payload["birthDateLocal"]
