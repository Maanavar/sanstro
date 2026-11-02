"""Admin spec L2: the consent ledger, the 18+ declaration, and what each purpose gates.

Acceptance (spec L2) and where each is proven here:
- No birth details stored before a service (P1) record exists for the account:
  `test_birth_profile_refused_without_service_consent`, `..._family_member_...`.
- Toggling P3 off stops identified analytics on the next request: the server
  half is `test_withdrawal_applies_on_the_next_request`; the client half is
  `applyAnalyticsConsent` (web/lib/analytics.ts), not exercised here.
- A minor family member never appears in a segment query: no segment query
  exists yet (broadcast is off until L+30, D-17). What is tested is the flag
  itself: `is_minor` from the date of birth.
- Guest data retention: guests are stateless (ARC-01); nothing to purge.

Blind spots: the web and mobile clients are not driven (their form state and the
panel are covered only by type checks); `forget_consents` is called directly,
not through the Google callback; the backfill is run as SQL against a schema
built by `create_all`, not through Alembic (CI's round-trip job runs the
migration itself).
"""
from __future__ import annotations

import importlib.util
from datetime import UTC, date, datetime
from pathlib import Path
from typing import get_args
from uuid import UUID, uuid4

import pytest
from sqlalchemy import delete, select, text
from sqlalchemy.exc import DBAPIError

from app.core.age_gate import family_member_is_minor
from app.core.privacy_policy import CURRENT_POLICY_VERSION
from app.db.session import SessionLocal
from app.models import ConsentRecord, FamilyMember, User
from app.models import consent_record as consent_model
from app.privacy.consent import current_consents, forget_consents, record_consents
from app.services import notification_dispatch_service as dispatch
from tests.conftest import TEST_USER_ID

CSRF = {"X-Vinaadi-CSRF": "1"}
PASSWORD = "password123"


def _register(raw_client, email: str, **extra) -> int:
    body = {"email": email, "password": PASSWORD, "consentGiven": True, "adultConfirmed": True}
    body.update(extra)
    return raw_client.post("/api/v1/auth/register", json=body).status_code


def _login(raw_client, email: str) -> dict:
    response = raw_client.post("/api/v1/auth/login", json={"email": email, "password": PASSWORD})
    assert response.status_code == 200, response.text
    return response.json()


def _rows(user_id) -> list[ConsentRecord]:
    with SessionLocal() as session:
        rows = session.execute(
            select(ConsentRecord).where(ConsentRecord.user_id == UUID(str(user_id))).order_by(ConsentRecord.created_at)
        ).scalars().all()
        for row in rows:
            session.expunge(row)
        return list(rows)


def _user(email: str) -> User:
    with SessionLocal() as session:
        user = session.query(User).filter(User.email == email).one()
        session.expunge(user)
        return user


# ── Registration ──────────────────────────────────────────────────────────────


def test_registration_records_every_purpose_as_answered(raw_client):
    email = "ledger-signup@example.test"
    assert _register(raw_client, email, consents={"updates": True, "analytics": False, "askImprove": False}, lang="ta") == 200

    user = _user(email)
    rows = {row.purpose: row for row in _rows(user.user_id)}
    assert set(rows) == {"service", "updates", "analytics", "ask_improve"}
    assert rows["service"].granted is True
    assert rows["updates"].granted is True
    assert rows["analytics"].granted is False
    assert rows["ask_improve"].granted is False
    for row in rows.values():
        assert row.notice_version == CURRENT_POLICY_VERSION
        assert row.language == "ta"
        assert row.channel == "web"
        assert row.ip
    assert user.adult_declared_at is not None
    assert user.consent_policy_version == CURRENT_POLICY_VERSION


def test_optional_purposes_default_off(raw_client):
    email = "ledger-defaults@example.test"
    assert _register(raw_client, email) == 200
    me = _login(raw_client, email)
    assert me["consents"] == {"service": True, "updates": False, "analytics": False, "askImprove": False}
    assert me["adultDeclared"] is True
    assert me["consentRequired"] is False


@pytest.mark.parametrize("adult", [None, False])
def test_registration_without_the_adult_declaration_is_refused(raw_client, adult):
    email = f"no-adult-{adult}@example.test"
    body = {"email": email, "password": PASSWORD, "consentGiven": True}
    if adult is not None:
        body["adultConfirmed"] = adult
    assert raw_client.post("/api/v1/auth/register", json=body).status_code == 422
    with SessionLocal() as session:
        assert session.query(User).filter(User.email == email).first() is None


def test_mobile_registration_records_the_platform(raw_client):
    email = "ledger-mobile@example.test"
    response = raw_client.post(
        "/api/v1/auth/mobile/register",
        json={"email": email, "password": PASSWORD, "consentGiven": True, "adultConfirmed": True},
        headers={"X-Vinaadi-Client": "ios"},
    )
    assert response.status_code == 200, response.text
    assert {row.channel for row in _rows(_user(email).user_id)} == {"ios"}


# ── Settings toggles ──────────────────────────────────────────────────────────


def test_withdrawal_applies_on_the_next_request(raw_client):
    email = "ledger-toggle@example.test"
    assert _register(raw_client, email, consents={"updates": False, "analytics": True, "askImprove": False}) == 200
    _login(raw_client, email)

    off = raw_client.put("/api/v1/auth/me/consents", json={"analytics": False}, headers=CSRF)
    assert off.status_code == 200, off.text
    assert off.json()["analytics"] is False
    assert raw_client.get("/api/v1/auth/me").json()["consents"]["analytics"] is False

    on = raw_client.put("/api/v1/auth/me/consents", json={"analytics": True, "updates": True}, headers=CSRF)
    assert on.json() == {"service": True, "updates": True, "analytics": True, "askImprove": False}

    # Append-only: every answer is a row; the latest one is the state.
    analytics = [row.granted for row in _rows(_user(email).user_id) if row.purpose == "analytics"]
    assert analytics == [True, False, True]


def test_the_service_consent_cannot_be_withdrawn_by_toggle(raw_client):
    email = "ledger-no-service-toggle@example.test"
    assert _register(raw_client, email) == 200
    _login(raw_client, email)
    response = raw_client.put("/api/v1/auth/me/consents", json={"service": False}, headers=CSRF)
    assert response.status_code == 422
    assert current_consents_for(email)["service"] is True


def test_toggles_require_a_session(raw_client):
    assert raw_client.put("/api/v1/auth/me/consents", json={"analytics": True}, headers=CSRF).status_code == 401


def current_consents_for(email: str) -> dict:
    with SessionLocal() as session:
        return current_consents(session, _user(email).user_id)


# ── The consent panel ─────────────────────────────────────────────────────────


def test_the_panel_asks_for_the_adult_declaration_once(raw_client):
    email = "ledger-panel@example.test"
    assert _register(raw_client, email) == 200
    with SessionLocal.begin() as session:
        session.query(User).filter(User.email == email).update({"adult_declared_at": None})
    me = _login(raw_client, email)
    assert me["consentRequired"] is True
    assert me["adultDeclared"] is False

    refused = raw_client.post("/api/v1/auth/consent", json={"consentGiven": True}, headers=CSRF)
    assert refused.status_code == 422

    answered = raw_client.post(
        "/api/v1/auth/consent",
        json={"consentGiven": True, "adultConfirmed": True, "consents": {"updates": True, "analytics": False, "askImprove": False}},
        headers=CSRF,
    )
    assert answered.status_code == 200, answered.text
    body = answered.json()
    assert body["consentRequired"] is False
    assert body["adultDeclared"] is True
    assert body["consents"]["updates"] is True


# ── P1 gates storing birth details ────────────────────────────────────────────


def _drop_consents(user_id: str) -> None:
    with SessionLocal.begin() as session:
        session.execute(delete(ConsentRecord).where(ConsentRecord.user_id == UUID(user_id)))


def test_birth_profile_refused_without_service_consent(client, birth_profile_payload_factory):
    _drop_consents(TEST_USER_ID)

    response = client.post("/api/v1/birth-profiles", json=birth_profile_payload_factory(calculate_now=False))

    assert response.status_code == 403, response.text
    assert response.json()["error"]["code"] == "CONSENT_REQUIRED"
    with SessionLocal() as session:
        assert session.execute(text("SELECT count(*) FROM birth_profiles")).scalar_one() == 0


def test_birth_profile_allowed_with_service_consent(client, birth_profile_payload_factory):
    response = client.post("/api/v1/birth-profiles", json=birth_profile_payload_factory(calculate_now=False))
    assert response.status_code == 200, response.text


def test_family_member_refused_without_service_consent(
    client, family_vault_payload_factory, family_member_payload_factory
):
    vault = client.post("/api/v1/family-vaults", json=family_vault_payload_factory())
    assert vault.status_code in (200, 201), vault.text
    vault_id = vault.json()["data"]["familyVaultId"]
    _drop_consents(TEST_USER_ID)

    response = client.post(
        f"/api/v1/family-vaults/{vault_id}/members",
        json=family_member_payload_factory(display_name="Synthetic Spouse", owner_user_id=TEST_USER_ID),
    )

    assert response.status_code == 403, response.text
    with SessionLocal() as session:
        assert session.execute(select(FamilyMember)).first() is None


def test_an_older_service_consent_still_lets_the_account_add_details(client, birth_profile_payload_factory):
    """Asked again by the panel, not locked out (app/api/auth.py::record_consent)."""
    _drop_consents(TEST_USER_ID)
    with SessionLocal.begin() as session:
        session.add(
            ConsentRecord(
                user_id=UUID(TEST_USER_ID), purpose="service", granted=True,
                notice_version="2026-09", language="en", channel="legacy",
            )
        )
    response = client.post("/api/v1/birth-profiles", json=birth_profile_payload_factory(calculate_now=False))
    assert response.status_code == 200, response.text


# ── P2 gates the notification outbox ──────────────────────────────────────────


def test_every_notification_type_is_classified():
    assert set(dispatch.NEEDS_UPDATES_CONSENT) == set(get_args(dispatch.NotificationType))


def _dispatch(session) -> str:
    now = datetime.now(UTC)
    return dispatch.dispatch_notification(
        session=session,
        user_id=UUID(TEST_USER_ID),
        notification_type="DASHA_TRANSITION",
        title_ta="சோதனை",
        title_en="Synthetic",
        body_ta="சோதனை",
        body_en="Synthetic",
        logical_key=f"consent-test:{uuid4()}",
        send_at=now,
    )


def test_no_alert_without_the_updates_consent(client):
    with SessionLocal.begin() as session:
        assert _dispatch(session) == "no_consent"
    with SessionLocal() as session:
        assert session.execute(text("SELECT count(*) FROM notifications")).scalar_one() == 0


def test_alerts_follow_the_latest_answer(client):
    with SessionLocal.begin() as session:
        user = session.get(User, UUID(TEST_USER_ID))
        record_consents(session, user, {"updates": True}, language="en", channel="web", ip=None)
    with SessionLocal.begin() as session:
        assert _dispatch(session) != "no_consent"
    with SessionLocal.begin() as session:
        user = session.get(User, UUID(TEST_USER_ID))
        record_consents(session, user, {"updates": False}, language="en", channel="web", ip=None)
    with SessionLocal.begin() as session:
        assert _dispatch(session) == "no_consent"


# ── The ledger itself ─────────────────────────────────────────────────────────


def test_the_ledger_refuses_update(client):
    with pytest.raises(DBAPIError, match="append-only"):
        with SessionLocal.begin() as session:
            session.execute(text("UPDATE consent_records SET granted = false"))


def test_the_ledger_refuses_truncate(client):
    with pytest.raises(DBAPIError, match="append-only"):
        with SessionLocal.begin() as session:
            session.execute(text("TRUNCATE consent_records"))


def test_the_ledger_allows_delete_for_erasure(client):
    _drop_consents(TEST_USER_ID)
    assert _rows(TEST_USER_ID) == []


def test_service_cannot_be_recorded_as_withdrawn(client):
    with SessionLocal() as session:
        user = session.get(User, UUID(TEST_USER_ID))
        with pytest.raises(ValueError):
            record_consents(session, user, {"service": False}, language="en", channel="web", ip=None)


def test_forgetting_consents_asks_the_proven_owner_afresh(client):
    """ARC-17: what an unproven registrant agreed to is not the owner's answer."""
    with SessionLocal.begin() as session:
        forget_consents(session, session.get(User, UUID(TEST_USER_ID)))
    assert _rows(TEST_USER_ID) == []
    with SessionLocal() as session:
        user = session.get(User, UUID(TEST_USER_ID))
        assert user.consent_given_at is None
        assert user.adult_declared_at is None


def _migration():
    path = Path(__file__).resolve().parents[1] / "migrations" / "versions" / "cd2e3f4a5b6c_consent_ledger_l2.py"
    spec = importlib.util.spec_from_file_location("consent_ledger_migration", path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


@pytest.mark.no_db
def test_model_and_migration_install_the_same_guard():
    migration = _migration()
    assert migration._FUNCTION_SQL.strip() == consent_model.APPEND_ONLY_FUNCTION_SQL.strip()
    assert migration._TRIGGERS_SQL.strip() == consent_model.APPEND_ONLY_TRIGGERS_SQL.strip()


def test_backfill_carries_the_existing_stamp_and_nothing_else(client):
    stamped_at = datetime(2026, 9, 10, 6, 0, tzinfo=UTC)
    stamped, never = uuid4(), uuid4()
    with SessionLocal.begin() as session:
        session.add(User(user_id=stamped, email="stamped@example.test", consent_given_at=stamped_at, consent_policy_version="2026-09"))
        session.add(User(user_id=never, email="never@example.test"))
    with SessionLocal.begin() as session:
        session.execute(text(_migration()._BACKFILL_SQL))

    rows = _rows(stamped)
    assert [(r.purpose, r.granted, r.notice_version, r.channel) for r in rows] == [("service", True, "2026-09", "legacy")]
    assert rows[0].created_at == stamped_at
    assert _rows(never) == []


# ── is_minor ──────────────────────────────────────────────────────────────────


@pytest.mark.no_db
@pytest.mark.parametrize(
    ("relationship", "birth_date", "expected"),
    [
        ("sibling", date(2015, 1, 1), True),
        ("child", date(1990, 1, 1), False),
        ("child", None, True),
        ("parent", None, False),
        ("child", date(2008, 11, 3), True),
        ("child", date(2008, 11, 2), False),
    ],
)
def test_is_minor_follows_the_date_of_birth(relationship, birth_date, expected):
    assert family_member_is_minor(relationship, birth_date, as_of=date(2026, 11, 2)) is expected
