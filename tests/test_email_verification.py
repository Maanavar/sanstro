"""Email verification and the trial it starts (admin spec L1/L3, D-07, ARC-08).

Every way an address gets proven runs through `account_lifecycle`, and the
trial hangs off it. These tests drive each way in — web register + link,
mobile register, Google — and check the consequence through `/auth/me`,
which is what the clients read.

BLIND SPOT: the Google callback itself is not driven (it needs Google); its
two lifecycle calls are exercised directly, so a third call site added to the
callback and wired differently would not be seen here.
"""
from __future__ import annotations

from datetime import UTC, datetime, timedelta
from uuid import uuid4

import pytest

from app.api import auth as auth_api
from app.core.auth import create_access_token
from app.core.config import get_settings
from app.db.session import SessionLocal
from app.models.entitlement import Entitlement
from app.models.user import User
from app.services import account_lifecycle
from app.services.email_verification_service import issue_verification_token

_PASSWORD = "password123"  # noqa: S105 — synthetic test value


@pytest.fixture()
def sent(monkeypatch) -> list[tuple[str, str]]:
    """(address, token) for every verification email the lifecycle enqueues."""
    outbox: list[tuple[str, str]] = []

    def _capture(_tasks, address, token):
        outbox.append((address, token))

    # Both importers: registration sends through account_lifecycle, the resend
    # route through its own module-level import.
    monkeypatch.setattr(account_lifecycle, "enqueue_verification_email", _capture)
    monkeypatch.setattr(auth_api, "enqueue_verification_email", _capture)
    return outbox


@pytest.fixture()
def beta_off(monkeypatch):
    monkeypatch.setattr(get_settings(), "open_beta", False)


def _register(client, email: str) -> None:
    response = client.post(
        "/api/v1/auth/register", json={"email": email, "password": _PASSWORD, "consentGiven": True, "adultConfirmed": True}
    )
    assert response.status_code == 200, response.text


def _login(client, email: str) -> dict:
    response = client.post("/api/v1/auth/login", json={"email": email, "password": _PASSWORD})
    assert response.status_code == 200, response.text
    return response.json()


def _email() -> str:
    return f"verify-{uuid4().hex}@example.invalid"


def _trials(email: str) -> int:
    with SessionLocal() as session:
        user = session.query(User).filter(User.email == email).one()
        return session.query(Entitlement).filter(Entitlement.user_id == user.user_id, Entitlement.source == "trial").count()


# ── Web register → link → trial ──────────────────────────────────────────────


def test_web_registration_sends_a_link_and_the_account_starts_unverified(raw_client, sent):
    email = _email()
    _register(raw_client, email)
    assert [address for address, _ in sent] == [email]
    me = _login(raw_client, email)
    assert me["emailVerified"] is False
    assert me["accessState"] == "free"
    assert me["trialEndsAt"] is None


def test_following_the_link_verifies_and_starts_the_seven_day_trial(raw_client, sent, beta_off):
    email = _email()
    _register(raw_client, email)
    (_, token) = sent[0]

    before = datetime.now(UTC)
    response = raw_client.post("/api/v1/auth/verify-email", json={"token": token})
    assert response.status_code == 200, response.text
    assert response.json()["verified"] is True

    me = _login(raw_client, email)
    assert me["emailVerified"] is True
    assert me["accessState"] == "trial"
    assert me["tier"] == "registered"  # the subscription fact is unchanged
    ends = datetime.fromisoformat(me["trialEndsAt"].replace("Z", "+00:00"))
    assert timedelta(days=7) - timedelta(minutes=1) <= ends - before <= timedelta(days=7) + timedelta(minutes=1)


def test_the_link_works_twice_but_the_trial_starts_once(raw_client, sent, beta_off):
    email = _email()
    _register(raw_client, email)
    (_, token) = sent[0]
    assert raw_client.post("/api/v1/auth/verify-email", json={"token": token}).status_code == 200
    again = raw_client.post("/api/v1/auth/verify-email", json={"token": token})
    assert again.status_code == 200
    assert "already" in again.json()["detail"].lower()
    assert _trials(email) == 1


def test_no_trial_while_the_open_beta_runs(raw_client, sent, monkeypatch):
    """The beta already gives more (Ask 7/day); a trial would cut it to 3."""
    monkeypatch.setattr(get_settings(), "open_beta", True)
    email = _email()
    _register(raw_client, email)
    assert raw_client.post("/api/v1/auth/verify-email", json={"token": sent[0][1]}).status_code == 200
    me = _login(raw_client, email)
    assert me["emailVerified"] is True
    assert me["accessState"] == "free"
    assert _trials(email) == 0


# ── Bad links ────────────────────────────────────────────────────────────────


def test_a_link_for_an_address_the_account_no_longer_has_is_refused(raw_client, sent):
    email = _email()
    _register(raw_client, email)
    (_, token) = sent[0]
    with SessionLocal() as session, session.begin():
        session.query(User).filter(User.email == email).one().email = _email()
    assert raw_client.post("/api/v1/auth/verify-email", json={"token": token}).status_code == 400


def test_a_session_token_is_not_a_verification_link(raw_client, sent):
    email = _email()
    _register(raw_client, email)
    with SessionLocal() as session:
        user_id = session.query(User).filter(User.email == email).one().user_id
    session_token = create_access_token(subject=str(user_id))
    assert raw_client.post("/api/v1/auth/verify-email", json={"token": session_token}).status_code == 400


def test_garbage_is_refused(raw_client):
    assert raw_client.post("/api/v1/auth/verify-email", json={"token": "not-a-token-at-all"}).status_code == 400


# ── Resend ───────────────────────────────────────────────────────────────────


def test_resend_needs_a_session(raw_client):
    response = raw_client.post("/api/v1/auth/verify-email/resend", headers={"X-Vinaadi-CSRF": "1"})
    assert response.status_code == 401


def test_resend_sends_again_until_verified_then_sends_nothing(raw_client, sent):
    email = _email()
    _register(raw_client, email)
    _login(raw_client, email)
    response = raw_client.post("/api/v1/auth/verify-email/resend", headers={"X-Vinaadi-CSRF": "1"})
    assert response.status_code == 200, response.text
    assert len(sent) == 2

    assert raw_client.post("/api/v1/auth/verify-email", json={"token": sent[-1][1]}).status_code == 200
    raw_client.post("/api/v1/auth/verify-email/resend", headers={"X-Vinaadi-CSRF": "1"})
    assert len(sent) == 2


# ── The other two ways in ────────────────────────────────────────────────────


def test_mobile_registration_sends_a_link_too(raw_client, sent):
    email = _email()
    response = raw_client.post(
        "/api/v1/auth/mobile/register", json={"email": email, "password": _PASSWORD, "consentGiven": True, "adultConfirmed": True}
    )
    assert response.status_code == 200, response.text
    assert [address for address, _ in sent] == [email]


def test_google_sign_up_is_verified_at_once_and_starts_the_trial(raw_client, sent, beta_off):
    """The callback's own call: a new Google account, address already proven."""
    with SessionLocal() as session, session.begin():
        user = User(user_id=uuid4(), email=_email(), google_sub=f"g-{uuid4().hex}")
        session.add(user)
        session.flush()
        account_lifecycle.on_account_created(session, user, background_tasks=None, email_verified_by_provider=True)
        user_id = user.user_id
    assert sent == []
    with SessionLocal() as session:
        assert session.get(User, user_id).email_verified_at is not None
        rows = session.query(Entitlement).filter(Entitlement.user_id == user_id).all()
        assert [(row.key, row.source) for row in rows] == [("premium", "trial")]


def test_linking_google_to_a_verified_account_starts_nothing_new(raw_client, sent, beta_off):
    """The callback's second call (`verify_email` on every Google sign-in) is idempotent."""
    with SessionLocal() as session, session.begin():
        user = User(user_id=uuid4(), email=_email(), google_sub=f"g-{uuid4().hex}")
        session.add(user)
        session.flush()
        account_lifecycle.on_account_created(session, user, background_tasks=None, email_verified_by_provider=True)
        assert account_lifecycle.verify_email(session, user) is False
        assert session.query(Entitlement).filter(Entitlement.user_id == user.user_id).count() == 1


def test_a_token_names_the_address_it_was_sent_to(raw_client):
    """Unit check on the token itself: same user, different address, different token."""
    user = User(user_id=uuid4(), email="a@example.invalid")
    first = issue_verification_token(user)
    user.email = "b@example.invalid"
    assert issue_verification_token(user) != first
