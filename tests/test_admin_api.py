from __future__ import annotations

from uuid import UUID, uuid4

from app.core.auth import create_access_token
from app.core.config import get_settings
from app.db.session import SessionLocal
from app.models.user import User


def _create_user(email: str) -> str:
    user_id = uuid4()
    with SessionLocal() as session:
        with session.begin():
            session.add(User(user_id=user_id, email=email))
    return str(user_id)


def _admin_headers(user_id: str, admin_key: str) -> dict[str, str]:
    return {
        "Authorization": f"Bearer {create_access_token(subject=user_id)}",
        "X-Admin-Key": admin_key,
    }


def test_admin_delete_is_disabled_by_default(raw_client, monkeypatch):
    monkeypatch.setenv("JOTHIDAM_ADMIN_API_KEY", "test-admin-key")
    monkeypatch.delenv("JOTHIDAM_ENABLE_ADMIN_DATA_DELETE", raising=False)
    get_settings.cache_clear()

    user_id = _create_user("admin-delete-default@example.com")
    response = raw_client.delete(
        f"/api/v1/admin/users/{user_id}/data",
        headers=_admin_headers(user_id, "test-admin-key"),
    )

    assert response.status_code == 403
    assert "disabled" in response.json()["detail"].lower()

    get_settings.cache_clear()


def test_admin_delete_requires_explicit_enable_flag(raw_client, monkeypatch):
    monkeypatch.setenv("JOTHIDAM_ADMIN_API_KEY", "test-admin-key")
    monkeypatch.setenv("JOTHIDAM_ENABLE_ADMIN_DATA_DELETE", "1")
    get_settings.cache_clear()

    user_id = _create_user("admin-delete-enabled@example.com")
    response = raw_client.delete(
        f"/api/v1/admin/users/{user_id}/data",
        headers=_admin_headers(user_id, "test-admin-key"),
    )

    assert response.status_code == 200
    body = response.json()
    assert body["owner_user_id"] == user_id
    assert body["birth_profiles_deleted"] == 0
    assert body["charts_deleted"] == 0
    assert body["family_vaults_deleted"] == 0
    assert body["family_members_deleted"] == 0
    assert body["family_daily_scores_deleted"] == 0

    with SessionLocal() as session:
        assert session.get(User, UUID(user_id)) is not None

    get_settings.cache_clear()
