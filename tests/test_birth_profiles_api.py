import json
from datetime import UTC, date, datetime, timedelta
from uuid import UUID, uuid4

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


def _create_profile(client, **extra):
    payload = {
        "ownerUserId": "22222222-2222-2222-2222-222222222222",
        "displayName": "Nila Rajan",
        "birthDateLocal": "1988-03-14",
        "birthTimeLocal": "09:15:00",
        "birthPlace": "Madurai, Tamil Nadu, India",
        "birthLatitude": 9.9252,
        "birthLongitude": 78.1198,
        "birthTimezone": "Asia/Kolkata",
        "calculateNow": False,
    }
    payload.update(extra)
    response = client.post("/api/v1/birth-profiles", json=payload)
    assert response.status_code == 200, response.text
    return response.json()["data"]["birthProfileId"]


def test_children_status_round_trips_through_create(client):
    """_chart_persist.create_birth_profile_record lists its columns explicitly, so a
    new field is silently dropped on create unless it is added there too — which is
    what happened on the first pass of this change."""
    profile_id = _create_profile(client, children="has")
    fetched = client.get(f"/api/v1/birth-profiles/{profile_id}")
    assert fetched.status_code == 200
    assert fetched.json()["data"]["children"] == "has"


def test_children_status_round_trips_through_patch(client):
    profile_id = _create_profile(client)
    fetched = client.get(f"/api/v1/birth-profiles/{profile_id}")
    assert fetched.json()["data"]["children"] is None

    patched = client.patch(
        f"/api/v1/birth-profiles/{profile_id}",
        json={"children": "none", "recalculate": False},
    )
    assert patched.status_code == 200, patched.text
    fetched = client.get(f"/api/v1/birth-profiles/{profile_id}")
    assert fetched.json()["data"]["children"] == "none"


def test_children_status_rejects_a_value_outside_the_vocabulary(client):
    profile_id = _create_profile(client)
    response = client.patch(
        f"/api/v1/birth-profiles/{profile_id}",
        json={"children": "two", "recalculate": False},
    )
    assert response.status_code == 422


def test_confirm_location_stamps_the_date_without_moving_the_place(client):
    """§2 / R2: "Keep Chennai" is an answer. Only PATCH stamped
    currentLocationUpdatedAt, so declining the prompt left the backstop due and
    the reader would be asked again on the next visit."""
    profile_id = _create_profile(
        client,
        currentPlace="Chennai, Tamil Nadu, India",
        currentLatitude=13.0827,
        currentLongitude=80.2707,
        currentTimezone="Asia/Kolkata",
    )
    before = client.get(f"/api/v1/birth-profiles/{profile_id}").json()["data"]

    with SessionLocal() as session:
        profile = session.get(BirthProfile, UUID(profile_id))
        profile.current_location_updated_at = datetime.now(tz=UTC) - timedelta(days=90)
        session.commit()

    response = client.post(f"/api/v1/birth-profiles/{profile_id}/confirm-location")

    assert response.status_code == 200, response.text
    data = response.json()["data"]
    assert data["currentPlace"] == before["currentPlace"]
    assert data["currentLatitude"] == before["currentLatitude"]
    assert data["currentTimezone"] == before["currentTimezone"]
    stamped = datetime.fromisoformat(data["currentLocationUpdatedAt"])
    assert datetime.now(tz=UTC) - stamped < timedelta(minutes=5)


def _seed_daily_score(profile_id: str, score_date):
    from app.models.daily_score import DailyScore
    with SessionLocal() as session:
        session.add(DailyScore(
            score_id=uuid4(),
            birth_profile_id=UUID(profile_id),
            score_date=score_date,
            score=50,
            label="MIXED",
            data={"stale": True},
        ))
        session.commit()


def _daily_score_dates(profile_id: str):
    from app.models.daily_score import DailyScore
    with SessionLocal() as session:
        return sorted(
            row.score_date
            for row in session.execute(
                select(DailyScore).where(DailyScore.birth_profile_id == UUID(profile_id))
            ).scalars()
        )


def test_moving_drops_cached_daily_guidance_from_today_but_keeps_the_past(client):
    """DailyScore is keyed on (profile, date) and records nothing about the place
    it was computed for, unlike PanchangamCache which is keyed on the coordinates.
    Everything sunrise-derived in a row moves with the place, so a Chennai row
    must not be served to a reader who just told us they are in Singapore."""
    profile_id = _create_profile(
        client,
        currentPlace="Chennai, Tamil Nadu, India",
        currentLatitude=13.0827,
        currentLongitude=80.2707,
        currentTimezone="Asia/Kolkata",
    )
    today = date.today()
    yesterday = today - timedelta(days=1)
    tomorrow = today + timedelta(days=1)
    for day in (yesterday, today, tomorrow):
        _seed_daily_score(profile_id, day)

    moved = client.patch(
        f"/api/v1/birth-profiles/{profile_id}",
        json={
            "currentPlace": "Singapore",
            "currentLatitude": 1.3521,
            "currentLongitude": 103.8198,
            "currentTimezone": "Asia/Singapore",
            "recalculate": False,
        },
    )

    assert moved.status_code == 200, moved.text
    assert _daily_score_dates(profile_id) == [yesterday]


def test_re_sending_the_same_city_is_a_confirmation_and_keeps_warm_rows(client):
    # A PATCH that repeats the current values is the "Keep" answer arriving by
    # another route. Treating "the payload mentioned these fields" as a move
    # would throw away warm rows for nothing.
    profile_id = _create_profile(
        client,
        currentPlace="Chennai, Tamil Nadu, India",
        currentLatitude=13.0827,
        currentLongitude=80.2707,
        currentTimezone="Asia/Kolkata",
    )
    today = date.today()
    _seed_daily_score(profile_id, today)

    response = client.patch(
        f"/api/v1/birth-profiles/{profile_id}",
        json={
            "currentPlace": "Chennai, Tamil Nadu, India",
            "currentLatitude": 13.0827,
            "currentLongitude": 80.2707,
            "currentTimezone": "Asia/Kolkata",
            "recalculate": False,
        },
    )

    assert response.status_code == 200, response.text
    assert _daily_score_dates(profile_id) == [today]


def test_confirm_location_refuses_a_profile_that_is_gone(client):
    # The owner check beside this one is the same two lines as the PATCH route
    # above; reassigning owner_user_id here would need a second real user row,
    # since the column is a foreign key.
    profile_id = _create_profile(client)
    client.delete(f"/api/v1/birth-profiles/{profile_id}")

    response = client.post(f"/api/v1/birth-profiles/{profile_id}/confirm-location")

    assert response.status_code == 404
