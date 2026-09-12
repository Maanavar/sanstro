"""DPDP Act 2023 §6 consent — the record, the ask, and what it deliberately is not.

Section 6 requires a specific, informed, unambiguous consent *action* before
personal data is collected. Three things follow, and each is tested here:

- the action cannot be inferred (a missing field is not consent),
- what was consented to must be recorded, not just when (informed is a claim
  about the text), and
- accounts that predate the record are asked, not assumed and not locked out.
"""
from __future__ import annotations

from datetime import UTC, datetime

import pytest

from app.core.privacy_policy import (
    CURRENT_POLICY_VERSION,
    consent_is_current,
    consent_required_for,
)
from app.db.session import SessionLocal
from app.models.user import User

CSRF_HEADERS = {"X-Vinaadi-CSRF": "1"}


# ---------------------------------------------------------------------------
# The rule itself, with no database in the way.
# ---------------------------------------------------------------------------

class _FakeUser:
    def __init__(self, at=None, version=None):
        self.consent_given_at = at
        self.consent_policy_version = version


@pytest.mark.no_db
def test_never_consented_is_not_current():
    assert consent_is_current(None, None) is False


@pytest.mark.no_db
def test_a_timestamp_without_the_live_version_is_not_current():
    """The reason both columns exist.

    A user who agreed to the June policy has a real, dated consent action — and
    has not seen the clause added since. Treating that as consent to the current
    text is exactly the inference §6 forbids.
    """
    assert consent_is_current(datetime.now(UTC), "2026-06") is False


@pytest.mark.no_db
def test_the_live_version_with_a_timestamp_is_current():
    assert consent_is_current(datetime.now(UTC), CURRENT_POLICY_VERSION) is True


@pytest.mark.no_db
def test_a_version_without_a_timestamp_is_not_current():
    """Half a record is not a record. Should not occur — both are written
    together — but the guard costs nothing and the failure is silent."""
    assert consent_is_current(None, CURRENT_POLICY_VERSION) is False


@pytest.mark.no_db
def test_an_object_missing_the_attributes_is_asked_not_skipped():
    """The fail-safe direction, stated. A user object without these attributes
    reads as not consented, so the worst outcome is asking someone twice."""
    assert consent_required_for(object()) is True


@pytest.mark.no_db
def test_consent_required_is_the_inverse_of_current():
    assert consent_required_for(_FakeUser(datetime.now(UTC), CURRENT_POLICY_VERSION)) is False
    assert consent_required_for(_FakeUser(datetime.now(UTC), "2026-06")) is True
    assert consent_required_for(_FakeUser()) is True


# ---------------------------------------------------------------------------
# Registration
# ---------------------------------------------------------------------------

def _register(client, email, **extra):
    body = {"email": email, "password": "password123"}
    body.update(extra)
    return client.post("/api/v1/auth/register", json=body)


def _user_row(email: str) -> User:
    with SessionLocal() as session:
        user = session.query(User).filter(User.email == email).one()
        session.expunge(user)
        return user


def test_registration_without_the_consent_field_is_rejected(raw_client):
    """Omission is not consent.

    The field has no default for exactly this reason: a client that forgets to
    send it must fail loudly rather than create an account with a consent record
    nobody produced.
    """
    response = _register(raw_client, "no-consent-field@example.com")

    assert response.status_code == 422, response.text


def test_registration_with_consent_declined_is_rejected(raw_client):
    response = _register(raw_client, "declined@example.com", consentGiven=False)

    assert response.status_code == 422, response.text


def test_registration_stamps_both_the_time_and_the_version(raw_client):
    email = "consented@example.com"

    assert _register(raw_client, email, consentGiven=True).status_code == 200

    user = _user_row(email)
    assert user.consent_given_at is not None
    assert user.consent_policy_version == CURRENT_POLICY_VERSION


def test_a_declined_registration_creates_no_user_at_all(raw_client):
    """Validation runs before the row is written, so there is no account left
    behind holding an email address nobody consented to give."""
    email = "declined-no-row@example.com"

    _register(raw_client, email, consentGiven=False)

    with SessionLocal() as session:
        assert session.query(User).filter(User.email == email).first() is None


def test_a_freshly_registered_user_is_not_asked_again(raw_client):
    email = "fresh@example.com"
    _register(raw_client, email, consentGiven=True)

    login = raw_client.post("/api/v1/auth/login", json={"email": email, "password": "password123"})

    assert login.status_code == 200, login.text
    assert login.json()["consentRequired"] is False


# ---------------------------------------------------------------------------
# Existing accounts — the population this whole mechanism exists for.
# ---------------------------------------------------------------------------

def _make_legacy_user(raw_client, email: str, *, version=None) -> None:
    """Register normally, then blank the consent record.

    Simulates an account created before consent was captured. Done by clearing
    the columns rather than by inserting a User by hand so the row is otherwise
    exactly what registration produces.
    """
    _register(raw_client, email, consentGiven=True)
    with SessionLocal() as session:
        user = session.query(User).filter(User.email == email).one()
        user.consent_given_at = datetime.now(UTC) if version else None
        user.consent_policy_version = version
        session.commit()


def test_an_account_predating_consent_is_asked(raw_client):
    email = "legacy@example.com"
    _make_legacy_user(raw_client, email)

    login = raw_client.post("/api/v1/auth/login", json={"email": email, "password": "password123"})

    assert login.json()["consentRequired"] is True


def test_an_account_on_an_older_policy_version_is_asked(raw_client):
    email = "stale-version@example.com"
    _make_legacy_user(raw_client, email, version="2026-06")

    login = raw_client.post("/api/v1/auth/login", json={"email": email, "password": "password123"})

    assert login.json()["consentRequired"] is True


def test_consent_is_not_a_gate(raw_client):
    """Deliberate, and the decision is recorded in the go-live checklist.

    An outstanding consent must not lock a user out of birth profiles and
    journal entries they already own. The ask is non-blocking; this pins that so
    a later change cannot quietly turn it into a wall.
    """
    email = "not-gated@example.com"
    _make_legacy_user(raw_client, email)
    raw_client.post("/api/v1/auth/login", json={"email": email, "password": "password123"})

    me = raw_client.get("/api/v1/auth/me")

    assert me.status_code == 200, me.text
    assert me.json()["consentRequired"] is True


def test_recording_consent_clears_the_ask(raw_client):
    email = "catches-up@example.com"
    _make_legacy_user(raw_client, email)
    raw_client.post("/api/v1/auth/login", json={"email": email, "password": "password123"})

    response = raw_client.post(
        "/api/v1/auth/consent", json={"consentGiven": True}, headers=CSRF_HEADERS
    )

    assert response.status_code == 200, response.text
    assert response.json()["consentRequired"] is False

    user = _user_row(email)
    assert user.consent_given_at is not None
    assert user.consent_policy_version == CURRENT_POLICY_VERSION


def test_the_consent_endpoint_refuses_a_declined_body(raw_client):
    email = "declines-later@example.com"
    _make_legacy_user(raw_client, email)
    raw_client.post("/api/v1/auth/login", json={"email": email, "password": "password123"})

    response = raw_client.post(
        "/api/v1/auth/consent", json={"consentGiven": False}, headers=CSRF_HEADERS
    )

    assert response.status_code == 422, response.text
    assert _user_row(email).consent_given_at is None


def test_consent_records_the_servers_version_not_the_clients(raw_client):
    """The endpoint accepts no version from the caller, and this is why.

    A client running older code must not be able to record consent against a
    policy revision the user was never shown. The stored version is always the
    one live on the server at the moment of the write.
    """
    email = "old-client@example.com"
    _make_legacy_user(raw_client, email, version="2026-06")
    raw_client.post("/api/v1/auth/login", json={"email": email, "password": "password123"})

    raw_client.post(
        "/api/v1/auth/consent",
        json={"consentGiven": True, "policyVersion": "2026-06"},
        headers=CSRF_HEADERS,
    )

    assert _user_row(email).consent_policy_version == CURRENT_POLICY_VERSION


def test_consenting_twice_is_allowed(raw_client):
    """Two tabs answer the panel. Returning an error to the second one would be
    an error shown to a user who did exactly what was asked."""
    email = "double-consent@example.com"
    _make_legacy_user(raw_client, email)
    raw_client.post("/api/v1/auth/login", json={"email": email, "password": "password123"})

    first = raw_client.post("/api/v1/auth/consent", json={"consentGiven": True}, headers=CSRF_HEADERS)
    second = raw_client.post("/api/v1/auth/consent", json={"consentGiven": True}, headers=CSRF_HEADERS)

    assert first.status_code == 200
    assert second.status_code == 200
    assert second.json()["consentRequired"] is False


def test_the_consent_endpoint_requires_authentication(raw_client):
    response = raw_client.post(
        "/api/v1/auth/consent", json={"consentGiven": True}, headers=CSRF_HEADERS
    )

    assert response.status_code == 401, response.text


# ---------------------------------------------------------------------------
# Mobile registers through a different route with a different schema.
# ---------------------------------------------------------------------------

def test_mobile_registration_requires_consent_too(raw_client):
    """Separate route, separate schema, same law.

    `MobileRegisterRequest` lives in app/api/mobile_auth.py and shares only the
    `ConsentGiven` type with the web schema — which is the point of that type
    existing.
    """
    response = raw_client.post(
        "/api/v1/auth/mobile/register",
        json={"email": "mobile-no-consent@example.com", "password": "password123"},
    )

    assert response.status_code == 422, response.text


def test_mobile_registration_stamps_consent(raw_client):
    email = "mobile-consented@example.com"

    response = raw_client.post(
        "/api/v1/auth/mobile/register",
        json={"email": email, "password": "password123", "consentGiven": True},
    )

    assert response.status_code == 200, response.text
    assert _user_row(email).consent_policy_version == CURRENT_POLICY_VERSION
