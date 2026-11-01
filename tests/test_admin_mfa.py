"""Admin two-step sign-in: enrolment, replay, recovery codes, reset (spec L3, D-15).

Driven through the routes with the real `get_admin_user` chain (raw_client;
only the session user is stubbed), so "an admin without TOTP gets 403" is
tested against the dependency that enforces it, not a mock of it.

BLIND SPOT: the TOTP clock is the real one. A run that straddles a 30-second
step boundary between minting a code and sending it still passes (DRIFT_STEPS
accepts the neighbour), but a test that needs two DIFFERENT valid codes would
have to wait a step; none here does.
"""
from __future__ import annotations

from datetime import UTC, datetime, timedelta
from uuid import uuid4

import pytest
from sqlalchemy import text

from app.core import auth as auth_module
from app.core import totp
from app.core.auth import create_access_token, get_current_user
from app.db.session import SessionLocal
from app.main import app
from app.models.admin_mfa import AdminMfaCredential, AdminRecoveryCode
from app.models.user import User
from app.services import admin_mfa_service

_SECRET = "JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP"  # noqa: S105 — synthetic test value


def _add_admin(*, enrolled: bool, role: str = "owner") -> User:
    user_id = uuid4()
    email = f"mfa-{uuid4().hex}@example.invalid"
    with SessionLocal() as session, session.begin():
        session.add(
            User(user_id=user_id, email=email, is_admin=True, admin_role=role, email_verified_at=datetime.now(UTC))
        )
        session.flush()
        if enrolled:
            session.add(AdminMfaCredential(user_id=user_id, totp_secret=_SECRET, confirmed_at=datetime.now(UTC)))
    return User(user_id=user_id, email=email, is_admin=True, admin_role=role, token_version=0)


@pytest.fixture()
def acting(raw_client):
    def _act(user: User):
        app.dependency_overrides[get_current_user] = lambda: user
        return raw_client

    yield _act
    app.dependency_overrides.pop(get_current_user, None)


def _code(secret: str = _SECRET, offset: int = 0) -> str:
    return totp.code_at_step(secret, totp.current_step() + offset)


# ── The requirement itself ───────────────────────────────────────────────────


def test_an_admin_without_totp_is_refused_with_mfa_required(acting):
    client = acting(_add_admin(enrolled=False))
    response = client.get("/api/v1/admin/stats")
    assert response.status_code == 403
    assert response.json()["detail"] == "mfa_required"


def test_an_admin_without_totp_can_still_reach_me_and_enrolment(acting):
    client = acting(_add_admin(enrolled=False))
    me = client.get("/api/v1/admin/me")
    assert me.status_code == 200
    assert me.json()["mfa_enrolled"] is False
    assert client.post("/api/v1/admin/mfa/enroll").status_code == 200


def test_an_unconfirmed_secret_does_not_satisfy_the_requirement(acting):
    client = acting(_add_admin(enrolled=False))
    assert client.post("/api/v1/admin/mfa/enroll").status_code == 200
    assert client.get("/api/v1/admin/stats").json()["detail"] == "mfa_required"


def test_a_non_admin_cannot_reach_enrolment(acting):
    user_id = uuid4()
    with SessionLocal() as session, session.begin():
        session.add(User(user_id=user_id, email=f"plain-{uuid4().hex}@example.invalid"))
    client = acting(User(user_id=user_id, email="plain@example.invalid", token_version=0))
    assert client.post("/api/v1/admin/mfa/enroll").status_code == 403
    assert client.get("/api/v1/admin/me").status_code == 403


# ── Enrol and confirm ────────────────────────────────────────────────────────


def test_enrol_confirm_then_the_console_opens(acting):
    client = acting(_add_admin(enrolled=False))
    enrolment = client.post("/api/v1/admin/mfa/enroll").json()
    assert enrolment["otpauth_uri"].startswith("otpauth://totp/")
    assert enrolment["secret"] in enrolment["otpauth_uri"]

    confirmed = client.post("/api/v1/admin/mfa/confirm", json={"code": _code(enrolment["secret"])})
    assert confirmed.status_code == 200, confirmed.text
    codes = confirmed.json()["recovery_codes"]
    assert len(codes) == 10
    assert len(set(codes)) == 10

    assert client.get("/api/v1/admin/stats").status_code == 200
    assert client.get("/api/v1/admin/me").json()["recovery_codes_remaining"] == 10


def test_confirm_refuses_a_wrong_code_and_stays_unenrolled(acting):
    client = acting(_add_admin(enrolled=False))
    secret = client.post("/api/v1/admin/mfa/enroll").json()["secret"]
    wrong = _code(secret, offset=-50)
    assert client.post("/api/v1/admin/mfa/confirm", json={"code": wrong}).status_code == 422
    assert client.get("/api/v1/admin/me").json()["mfa_enrolled"] is False


def test_a_confirmed_second_factor_cannot_be_replaced_by_enrolling_again(acting):
    """Otherwise a stolen session could swap in the thief's phone."""
    client = acting(_add_admin(enrolled=True))
    assert client.post("/api/v1/admin/mfa/enroll").status_code == 409


def test_secret_is_encrypted_and_recovery_codes_are_hashed_at_rest(acting):
    admin = _add_admin(enrolled=False)
    client = acting(admin)
    secret = client.post("/api/v1/admin/mfa/enroll").json()["secret"]
    codes = client.post("/api/v1/admin/mfa/confirm", json={"code": _code(secret)}).json()["recovery_codes"]

    with SessionLocal() as session:
        raw_secret = session.execute(
            text("SELECT totp_secret FROM admin_mfa_credentials WHERE user_id = :u"), {"u": admin.user_id}
        ).scalar_one()
        stored = {
            row[0]
            for row in session.execute(
                text("SELECT code_hash FROM admin_recovery_codes WHERE user_id = :u"), {"u": admin.user_id}
            )
        }
    assert secret.encode() not in bytes(raw_secret)
    assert len(stored) == 10
    plain = {code.replace("-", "") for code in codes} | set(codes)
    assert not plain & stored


# ── Replay and recovery codes ────────────────────────────────────────────────


def test_the_confirming_code_cannot_then_elevate(acting):
    """The step accepted at confirmation is spent; replaying it is refused."""
    client = acting(_add_admin(enrolled=False))
    secret = client.post("/api/v1/admin/mfa/enroll").json()["secret"]
    code = _code(secret)
    assert client.post("/api/v1/admin/mfa/confirm", json={"code": code}).status_code == 200
    assert client.post("/api/v1/admin/elevate", json={"code": code}).status_code == 403


def test_a_recovery_code_elevates_exactly_once(acting):
    client = acting(_add_admin(enrolled=False))
    secret = client.post("/api/v1/admin/mfa/enroll").json()["secret"]
    codes = client.post("/api/v1/admin/mfa/confirm", json={"code": _code(secret)}).json()["recovery_codes"]

    first = client.post("/api/v1/admin/elevate", json={"code": codes[0]})
    assert first.status_code == 200, first.text
    assert client.post("/api/v1/admin/elevate", json={"code": codes[0]}).status_code == 403
    # Formatting is forgiving; the code is still spent.
    assert client.post("/api/v1/admin/elevate", json={"code": codes[0].lower().replace("-", "")}).status_code == 403
    assert client.get("/api/v1/admin/me").json()["recovery_codes_remaining"] == 9


def test_replacing_recovery_codes_kills_the_old_ones(acting):
    client = acting(_add_admin(enrolled=False))
    secret = client.post("/api/v1/admin/mfa/enroll").json()["secret"]
    old = client.post("/api/v1/admin/mfa/confirm", json={"code": _code(secret)}).json()["recovery_codes"]

    elevation = client.post("/api/v1/admin/elevate", json={"code": old[0]}).json()["token"]
    replaced = client.post(
        "/api/v1/admin/mfa/recovery-codes", headers={auth_module.ADMIN_ELEVATION_HEADER: elevation}
    )
    assert replaced.status_code == 200, replaced.text
    new = replaced.json()["recovery_codes"]
    assert not set(old) & set(new)
    assert client.post("/api/v1/admin/elevate", json={"code": old[1]}).status_code == 403
    assert client.post("/api/v1/admin/elevate", json={"code": new[0]}).status_code == 200


def test_replacing_recovery_codes_needs_elevation(acting):
    client = acting(_add_admin(enrolled=True))
    assert client.post("/api/v1/admin/mfa/recovery-codes").status_code == 403


# ── Owner reset ──────────────────────────────────────────────────────────────


def _elevated(client) -> dict[str, str]:
    token = client.post("/api/v1/admin/elevate", json={"code": _code()}).json()["token"]
    return {auth_module.ADMIN_ELEVATION_HEADER: token}


def test_an_owner_resets_another_admins_second_factor(acting):
    target = _add_admin(enrolled=True, role="support")
    client = acting(_add_admin(enrolled=True))
    response = client.delete(
        f"/api/v1/admin/users/{target.user_id}/mfa", params={"reason": "lost phone"}, headers=_elevated(client)
    )
    assert response.status_code == 200, response.text
    assert response.json()["reset"] is True
    with SessionLocal() as session:
        assert session.get(AdminMfaCredential, target.user_id) is None
        assert session.query(AdminRecoveryCode).filter(AdminRecoveryCode.user_id == target.user_id).count() == 0
        # Their live sessions end now.
        assert session.get(User, target.user_id).token_version == 1


def test_an_owner_cannot_reset_their_own_second_factor(acting):
    owner = _add_admin(enrolled=True)
    client = acting(owner)
    response = client.delete(
        f"/api/v1/admin/users/{owner.user_id}/mfa", params={"reason": "testing"}, headers=_elevated(client)
    )
    assert response.status_code == 409


def test_reset_needs_a_reason(acting):
    target = _add_admin(enrolled=True, role="support")
    client = acting(_add_admin(enrolled=True))
    response = client.delete(f"/api/v1/admin/users/{target.user_id}/mfa", headers=_elevated(client))
    assert response.status_code == 422


# ── Admin session age (8 h absolute) ─────────────────────────────────────────


def _bearer(user: User) -> dict[str, str]:
    return {"Authorization": f"Bearer {create_access_token(subject=str(user.user_id), token_version=0)}"}


def test_a_fresh_admin_session_is_accepted(raw_client):
    admin = _add_admin(enrolled=True)
    assert raw_client.get("/api/v1/admin/stats", headers=_bearer(admin)).status_code == 200


def test_an_admin_session_older_than_the_limit_must_sign_in_again(raw_client, monkeypatch):
    admin = _add_admin(enrolled=True)
    # Equivalent to a token issued 8 h + 1 s ago, without touching the clock.
    monkeypatch.setattr(auth_module, "ADMIN_SESSION_MAX_AGE", timedelta(seconds=-1))
    response = raw_client.get("/api/v1/admin/stats", headers=_bearer(admin))
    assert response.status_code == 401
    assert "sign in again" in response.json()["detail"].lower()


# ── Service-level ────────────────────────────────────────────────────────────


def test_verify_second_factor_refuses_an_unenrolled_account(raw_client):
    admin = _add_admin(enrolled=False)
    with SessionLocal() as session, session.begin():
        user = session.get(User, admin.user_id)
        assert admin_mfa_service.verify_second_factor(session, user, _code()) is None
