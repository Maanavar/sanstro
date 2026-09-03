from datetime import UTC, datetime, timedelta
from uuid import UUID

from app.core.auth import get_current_user
from app.db.session import SessionLocal
from app.main import app
from app.models.porutham_share import PoruthamShare
from app.models.user import User

_OTHER_USER_ID = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"


def _create_payload(*, label_a: str | None = None, label_b: str | None = None) -> dict:
    return {
        "personA": {
            "birthDateLocal": "1991-07-22",
            "birthTimeLocal": "06:30:00",
            "birthLatitude": 13.0827,
            "birthLongitude": 80.2707,
            "birthTimezone": "Asia/Kolkata",
            "birthPlace": "Chennai, Tamil Nadu, India",
        },
        "personB": {
            "birthDateLocal": "1993-03-14",
            "birthTimeLocal": "09:15:00",
            "birthLatitude": 11.0168,
            "birthLongitude": 76.9558,
            "birthTimezone": "Asia/Kolkata",
            "birthPlace": "Coimbatore, Tamil Nadu, India",
        },
        "compatibilityContext": "MARRIAGE",
        "labelA": label_a,
        "labelB": label_b,
    }


def test_porutham_share_create_and_view_returns_snapshot_and_increments_view_count(client):
    create_response = client.post("/api/v1/porutham-shares", json=_create_payload(label_a="Bride", label_b="Groom"))
    assert create_response.status_code == 200
    created = create_response.json()["data"]
    assert created["token"]
    assert created["url"].endswith(f"/share/porutham/{created['token']}")
    assert created["labelA"] == "Bride"
    assert created["labelB"] == "Groom"

    view_response_1 = client.get(f"/api/v1/porutham-shares/{created['token']}")
    assert view_response_1.status_code == 200
    body = view_response_1.json()["data"]
    assert body["labelA"] == "Bride"
    assert body["labelB"] == "Groom"
    assert 0 <= body["totalScore"] <= body["maxScore"]
    assert 0 <= body["percentage"] <= 100
    assert isinstance(body["kutas"], list) and len(body["kutas"]) > 0
    assert body["summary"]["en"]

    view_response_2 = client.get(f"/api/v1/porutham-shares/{created['token']}")
    assert view_response_2.status_code == 200

    with SessionLocal() as session:
        share = session.query(PoruthamShare).filter(PoruthamShare.porutham_share_id == UUID(created["shareId"])).one()
        assert share.view_count == 2
        assert share.last_viewed_at is not None


def test_porutham_share_revoke_then_view_returns_404(client):
    created = client.post("/api/v1/porutham-shares", json=_create_payload()).json()["data"]

    revoke_response = client.post(f"/api/v1/porutham-shares/{created['shareId']}/revoke")
    assert revoke_response.status_code == 200
    assert revoke_response.json()["data"]["revokedAt"]

    view_response = client.get(f"/api/v1/porutham-shares/{created['token']}")
    assert view_response.status_code == 404


def test_porutham_share_expired_returns_404(client):
    created = client.post("/api/v1/porutham-shares", json=_create_payload()).json()["data"]

    with SessionLocal() as session:
        session.query(PoruthamShare).filter(
            PoruthamShare.porutham_share_id == UUID(created["shareId"])
        ).update({"expires_at": datetime.now(UTC) - timedelta(minutes=1)})
        session.commit()

    view_response = client.get(f"/api/v1/porutham-shares/{created['token']}")
    assert view_response.status_code == 404


def test_porutham_share_revoke_by_non_owner_returns_403(client):
    created = client.post("/api/v1/porutham-shares", json=_create_payload()).json()["data"]

    with SessionLocal() as session:
        with session.begin():
            session.add(User(user_id=UUID(_OTHER_USER_ID), email="other@jothidam.test"))

    other_user = User(user_id=UUID(_OTHER_USER_ID), email="other@jothidam.test")
    app.dependency_overrides[get_current_user] = lambda: other_user
    try:
        revoke_response = client.post(f"/api/v1/porutham-shares/{created['shareId']}/revoke")
    finally:
        app.dependency_overrides[get_current_user] = lambda: User(
            user_id=UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"), email="test@jothidam.test"
        )

    assert revoke_response.status_code == 403

    view_response = client.get(f"/api/v1/porutham-shares/{created['token']}")
    assert view_response.status_code == 200
