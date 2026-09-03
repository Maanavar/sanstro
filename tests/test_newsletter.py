from __future__ import annotations

from collections.abc import Generator

import pytest
from sqlalchemy import create_engine, func, inspect, select
from sqlalchemy.orm import Session

from app.db.base import Base
from app.db.session import SessionLocal, get_db
from app.main import app
from app.models.newsletter_subscriber import NewsletterSubscriber


def _subscriber_count() -> int:
    with SessionLocal() as session:
        return session.scalar(select(func.count()).select_from(NewsletterSubscriber)) or 0


def _subscriber_for(email: str) -> NewsletterSubscriber | None:
    with SessionLocal() as session:
        return session.scalar(
            select(NewsletterSubscriber).where(NewsletterSubscriber.email == email)
        )


def test_newsletter_subscriber_table_is_portable_to_sqlite():
    """The model must let metadata-based SQLite fixtures create this table."""
    engine = create_engine("sqlite://")
    try:
        Base.metadata.create_all(engine, tables=[NewsletterSubscriber.__table__])
        assert "newsletter_subscribers" in inspect(engine).get_table_names()
    finally:
        engine.dispose()


def test_newsletter_subscribe_persists_normalized_email(raw_client):
    response = raw_client.post(
        "/api/v1/newsletter",
        json={"email": "  TEST@EXAMPLE.TEST  ", "source": "landing_page"},
    )

    assert response.status_code == 200
    assert response.json() == {"success": True}
    assert _subscriber_count() == 1
    subscriber = _subscriber_for("test@example.test")
    assert subscriber is not None
    assert subscriber.source == "landing_page"


def test_newsletter_subscribe_is_idempotent_for_normalized_email(raw_client):
    first = raw_client.post("/api/v1/newsletter", json={"email": "Test@Example.test"})
    second = raw_client.post("/api/v1/newsletter", json={"email": " test@example.test "})

    assert first.status_code == 200
    assert second.status_code == 200
    assert first.json() == second.json() == {"success": True}
    assert _subscriber_count() == 1


@pytest.mark.parametrize("email", ["not-an-email", "", "a@b", "a b@c.com"])
def test_newsletter_rejects_invalid_email_without_persisting(raw_client, email: str):
    response = raw_client.post("/api/v1/newsletter", json={"email": email})

    assert response.status_code == 422
    assert _subscriber_count() == 0


def test_newsletter_truncates_source_to_database_limit(raw_client):
    response = raw_client.post(
        "/api/v1/newsletter",
        json={"email": "limit@example.test", "source": "s" * 100},
    )

    assert response.status_code == 200
    subscriber = _subscriber_for("limit@example.test")
    assert subscriber is not None
    assert subscriber.source == "s" * 64


def test_newsletter_rolls_back_and_hides_database_failure(raw_client, caplog):
    session = SessionLocal()
    rollback_called = False

    def broken_commit() -> None:
        raise RuntimeError("synthetic newsletter database failure")

    def rollback() -> None:
        nonlocal rollback_called
        rollback_called = True
        original_rollback()

    def override_get_db() -> Generator[Session, None, None]:
        try:
            yield session
        finally:
            session.close()

    original_commit = session.commit
    original_rollback = session.rollback
    session.commit = broken_commit  # type: ignore[method-assign]
    session.rollback = rollback  # type: ignore[method-assign]
    app.dependency_overrides[get_db] = override_get_db
    try:
        response = raw_client.post("/api/v1/newsletter", json={"email": "failure@example.test"})
    finally:
        session.commit = original_commit  # type: ignore[method-assign]
        session.rollback = original_rollback  # type: ignore[method-assign]
        app.dependency_overrides.pop(get_db, None)

    assert response.status_code == 500
    assert "synthetic newsletter database failure" not in response.text
    assert rollback_called
    assert "newsletter_subscribe_error" in caplog.text
