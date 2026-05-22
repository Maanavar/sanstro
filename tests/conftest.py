import pytest
from fastapi.testclient import TestClient

import app.models as app_models  # noqa: F401  (registers all models with Base)
from app.core.auth import create_access_token, get_current_user, get_admin_user
from app.db.base import Base
from app.db.session import engine, get_db
from app.main import app
from app.models.user import User

# ── Test user identity ────────────────────────────────────────────────────────
TEST_USER_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
TEST_USER_EMAIL = "test@jothidam.test"


def _make_test_user(session) -> User:
    """Return (creating if needed) the canonical test user in the given session."""
    from uuid import UUID
    uid = UUID(TEST_USER_ID)
    user = session.get(User, uid)
    if user is None:
        from app.models.user import User as UserModel
        user = UserModel(user_id=uid, email=TEST_USER_EMAIL)
        session.add(user)
        session.flush()
    return user


# ── Fixtures ──────────────────────────────────────────────────────────────────


@pytest.fixture()
def client() -> TestClient:
    """Authenticated test client.

    The `get_current_user` and `get_admin_user` FastAPI dependencies are
    overridden to return a fixed test user, so every existing API test gets
    auth for free without changing test code.
    """
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    # Pre-create the test user so the override can return it
    with next(get_db()) as session:
        with session.begin():
            _make_test_user(session)

    # Build a fixed test user object (detached from any session) to return from overrides
    from uuid import UUID
    stub_user = User(user_id=UUID(TEST_USER_ID), email=TEST_USER_EMAIL)

    def _override_current_user():
        return stub_user

    def _override_admin_user():
        return stub_user

    app.dependency_overrides[get_current_user] = _override_current_user
    app.dependency_overrides[get_admin_user] = _override_admin_user

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


@pytest.fixture()
def token() -> str:
    """A valid signed JWT for the test user (for raw auth tests)."""
    return create_access_token(subject=TEST_USER_ID)


@pytest.fixture()
def raw_client() -> TestClient:
    """Unauthenticated client with no dependency overrides — used by auth tests."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    with TestClient(app, raise_server_exceptions=False) as test_client:
        yield test_client
