import os

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlalchemy.exc import OperationalError

import app.models as app_models  # noqa: F401  (registers all models with Base)
from app.core.auth import create_access_token, get_current_user, get_admin_user
from app.db.base import Base
from app.db.session import engine, SessionLocal
from app.main import app
from app.middleware import _counters
from app.models.user import User

TEST_USER_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
TEST_USER_EMAIL = "test@jothidam.test"


def _assert_safe_reset_target() -> None:
    db_name = (engine.url.database or "").lower()
    db_host = (engine.url.host or "").lower()
    db_port = engine.url.port
    protected_db_names = {"vinaadi_dev", "vinaadi", "postgres", "production", "prod"}
    if db_name in protected_db_names:
        raise RuntimeError(
            "Refusing to reset a protected database. "
            f"Current database is '{engine.url.database}'. "
            "Point JOTHIDAM_DATABASE_URL to a dedicated test DB (example: vinaadi_test)."
        )

    looks_like_test_db = any(token in db_name for token in ("test", "pytest"))
    if not looks_like_test_db:
        raise RuntimeError(
            "Refusing to reset non-test database. "
            f"Current database is '{engine.url.database}'. "
            "Use a test database name containing 'test' (example: vinaadi_test)."
        )

    if db_name != "vinaadi_test":
        raise RuntimeError(
            "Refusing to reset unexpected test database. "
            f"Current database is '{engine.url.database}'. "
            "Use the dedicated Docker test DB name 'vinaadi_test'."
        )

    if db_port != 5433 or db_host not in {"localhost", "127.0.0.1"}:
        raise RuntimeError(
            "Refusing to reset database outside dedicated Docker test endpoint. "
            f"Current endpoint is '{engine.url.host}:{engine.url.port}'. "
            "Use localhost:5433 for tests."
        )

    # Secondary explicit acknowledgement to reduce accidental data loss.
    reset_ack = os.getenv("JOTHIDAM_TEST_DB_RESET_ACK", "")
    if reset_ack != "I_UNDERSTAND_THIS_WIPES_TEST_DB":
        raise RuntimeError(
            "Test DB reset acknowledgement missing. Set "
            "JOTHIDAM_TEST_DB_RESET_ACK=I_UNDERSTAND_THIS_WIPES_TEST_DB "
            "before running pytest."
        )


def _db_is_reachable() -> bool:
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except OperationalError:
        return False


@pytest.fixture(autouse=True, scope="session")
def require_db() -> None:
    _assert_safe_reset_target()
    if not _db_is_reachable():
        pytest.skip("Local Docker Postgres not reachable - start with: docker compose up -d")


def _reset_db() -> None:
    """Drop and recreate all tables — fast on local Docker, full isolation."""
    _assert_safe_reset_target()
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def _make_test_user(session) -> User:
    from uuid import UUID
    uid = UUID(TEST_USER_ID)
    user = User(user_id=uid, email=TEST_USER_EMAIL)
    session.add(user)
    session.flush()
    return user


@pytest.fixture()
def client() -> TestClient:
    """Authenticated test client — fresh DB schema for every test."""
    _reset_db()

    with SessionLocal() as session:
        with session.begin():
            _make_test_user(session)

    from uuid import UUID
    stub_user = User(user_id=UUID(TEST_USER_ID), email=TEST_USER_EMAIL)

    app.dependency_overrides[get_current_user] = lambda: stub_user
    app.dependency_overrides[get_admin_user] = lambda: stub_user
    _counters.clear()

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()
    _counters.clear()


@pytest.fixture()
def token() -> str:
    """A valid signed JWT for the test user (UUID subject)."""
    return create_access_token(subject=TEST_USER_ID)


@pytest.fixture()
def raw_client() -> TestClient:
    """Unauthenticated client — resets DB so auth provisioning tests start clean."""
    _reset_db()
    with TestClient(app, raise_server_exceptions=False) as test_client:
        yield test_client
