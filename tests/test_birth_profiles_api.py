import json
from datetime import UTC, datetime, timedelta
from uuid import UUID

from sqlalchemy import select

from app.core.encryption import decrypt_bytes
from app.db.session import SessionLocal
from app.models.birth_profile import BirthProfile
from app.models.notification import Notification


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


def test_duplicate_birth_profile_create_is_rejected(client):
    payload = {
        "ownerUserId": "22222222-2222-2222-2222-222222222222",
        "displayName": "Arjun Kumar",
        "birthDateLocal": "1991-07-22",
        "birthTimeLocal": "06:30:00",
        "birthPlace": "Chennai, Tamil Nadu, India",
        "birthLatitude": 13.0827,
        "birthLongitude": 80.2707,
        "birthTimezone": "Asia/Kolkata",
        "calculateNow": True,
    }

    first = client.post("/api/v1/birth-profiles", json=payload)
    duplicate = client.post("/api/v1/birth-profiles", json=payload)

    assert first.status_code == 200
    assert duplicate.status_code == 409
    assert "matching birth profile already exists" in duplicate.json()["detail"].lower()

    with SessionLocal() as session:
        rows = session.execute(
            select(BirthProfile).where(
                BirthProfile.deleted_at.is_(None),
                BirthProfile.display_name == "Arjun Kumar",
                BirthProfile.birth_place == "Chennai, Tamil Nadu, India",
            )
        ).scalars().all()
        assert len(rows) == 1


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


def test_birth_profile_me_latest_returns_oldest_onboarding_profile_for_current_user(client):
    # /me/latest deliberately returns the OLDEST standalone profile so the user's real
    # onboarding profile wins over ephemeral temp profiles created later by tools. The
    # first profile is backdated below to stand in as the onboarding profile.
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
    assert body["birthProfileId"] == first_birth_profile_id
    assert body["displayName"] == "First Profile"
    assert body["birthTimeLocal"] == "06:30:00"
    assert body["relationshipToOwner"] == "self"
    assert body["birthProfileId"] != second["data"]["birthProfileId"]


def test_birth_profile_me_latest_returns_404_when_no_profile_exists(client):
    response = client.get("/api/v1/birth-profiles/me/latest")

    assert response.status_code == 404
    assert response.json()["detail"] == "Birth profile not found. Please create one to get started."


def test_updating_birth_profile_to_duplicate_is_rejected(client):
    first = client.post(
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
    ).json()
    second = client.post(
        "/api/v1/birth-profiles",
        json={
            "ownerUserId": "22222222-2222-2222-2222-222222222222",
            "displayName": "Anitha Kumar",
            "birthDateLocal": "1990-07-22",
            "birthTimeLocal": "07:00:00",
            "birthPlace": "Madurai, Tamil Nadu, India",
            "birthLatitude": 9.9252,
            "birthLongitude": 78.1198,
            "birthTimezone": "Asia/Kolkata",
            "calculateNow": True,
        },
    ).json()

    response = client.patch(
        f"/api/v1/birth-profiles/{second['data']['birthProfileId']}",
        json={
            "displayName": "Arjun Kumar",
            "birthDateLocal": "1991-07-22",
            "birthTimeLocal": "06:30:00",
            "birthPlace": "Chennai, Tamil Nadu, India",
            "birthLatitude": 13.0827,
            "birthLongitude": 80.2707,
            "birthTimezone": "Asia/Kolkata",
        },
    )

    assert first['data']['birthProfileId'] != second['data']['birthProfileId']
    assert response.status_code == 409
    assert "matching birth profile already exists" in response.json()["detail"].lower()


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

def test_birth_profile_create_schedules_d1_jadhagam_nudge(client):
    created = client.post(
        "/api/v1/birth-profiles",
        json={
            "ownerUserId": "22222222-2222-2222-2222-222222222222",
            "displayName": "D1 Nudge Profile",
            "birthDateLocal": "1991-07-22",
            "birthTimeLocal": "06:30:00",
            "birthPlace": "Chennai, Tamil Nadu, India",
            "birthLatitude": 13.0827,
            "birthLongitude": 80.2707,
            "birthTimezone": "Asia/Kolkata",
            "calculateNow": True,
        },
    )

    assert created.status_code == 200
    chart_id = UUID(created.json()["data"]["chartId"])

    with SessionLocal() as session:
        notification = session.execute(
            select(Notification).where(
                Notification.chart_id == chart_id,
                Notification.type == "JADHAGAM_D1_NUDGE",
            )
        ).scalar_one()

        assert notification.status == "queued"
        assert notification.send_at > datetime.now(UTC) + timedelta(hours=23)
        assert notification.payload["deepLink"] == "/dasha"
        assert notification.payload["source"] == "onboarding_d1_nudge"
