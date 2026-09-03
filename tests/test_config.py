from __future__ import annotations

import pytest

from app.core.config import Settings

pytestmark = pytest.mark.no_db


@pytest.fixture(autouse=True, scope="session")
def require_db():  # noqa: F811 - shadows conftest require_db; no DB needed
    return


def test_development_generates_ephemeral_auth_secrets(monkeypatch):
    monkeypatch.delenv("APP_ENV", raising=False)

    settings = Settings(database_url="postgresql://example/test", _env_file=None)

    assert settings.jwt_secret
    assert settings.admin_api_key


def test_staging_requires_auth_secrets(monkeypatch):
    monkeypatch.delenv("APP_ENV", raising=False)

    with pytest.raises(ValueError, match="JOTHIDAM_JWT_SECRET"):
        Settings(
            database_url="postgresql://example/test",
            environment="staging",
            encryption_key="configured",
            cookie_secure=True,
            _env_file=None,
        )
