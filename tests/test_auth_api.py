from __future__ import annotations

from datetime import date, time
from decimal import Decimal
from uuid import UUID

from fastapi.testclient import TestClient

from app.db.session import SessionLocal
from app.main import app
from app.models.birth_profile import BirthProfile
from app.models.chart import Chart
from app.models.daily_score import DailyScore
from app.models.family_member import FamilyMember
from app.models.user import User

CSRF_HEADERS = {"X-Vinaadi-CSRF": "1"}


def assert_response(response, status=200, required_keys=()):
    assert response.status_code == status
    data = response.json() if response.content else {}
    for key in required_keys:
        assert key in data, f"Missing key '{key}' in response"
    return data


def test_register_sets_cookie_and_returns_user(raw_client):
    response = raw_client.post(
        "/api/v1/auth/register",
        json={"email": "authuser@example.com", "password": "password123"},
    )
    payload = assert_response(response, status=200, required_keys=("detail",))
    assert payload["detail"]

    login = raw_client.post(
        "/api/v1/auth/login",
        json={"email": "authuser@example.com", "password": "password123"},
    )
    login_payload = assert_response(login, status=200, required_keys=("email", "userId"))
    assert login_payload["email"] == "authuser@example.com"
    assert login_payload["userId"]
    assert "vinaadi_token" in login.headers.get("set-cookie", "")

    me_response = raw_client.get("/api/v1/auth/me")
    me_payload = assert_response(me_response, status=200, required_keys=("email", "userId"))
    assert me_payload["email"] == "authuser@example.com"
    assert me_payload["userId"] == login_payload["userId"]


def test_register_duplicate_email_returns_neutral_response(raw_client):
    first = raw_client.post(
        "/api/v1/auth/register",
        json={"email": "duplicate@example.com", "password": "password123"},
    )
    assert first.status_code == 200

    # Hardened endpoint: duplicate registration returns neutral 200 (no email enumeration)
    second = raw_client.post(
        "/api/v1/auth/register",
        json={"email": "duplicate@example.com", "password": "password123"},
    )
    assert second.status_code == 200
    assert second.json()["detail"]


def test_login_rejects_wrong_password_with_generic_message(raw_client):
    register = raw_client.post(
        "/api/v1/auth/register",
        json={"email": "loginuser@example.com", "password": "password123"},
    )
    assert register.status_code == 200

    login = raw_client.post(
        "/api/v1/auth/login",
        json={"email": "loginuser@example.com", "password": "not-the-right-password"},
    )
    assert login.status_code == 401
    assert login.json()["detail"] == "Invalid email or password."


def test_logout_clears_cookie(raw_client):
    register = raw_client.post(
        "/api/v1/auth/register",
        json={"email": "logoutuser@example.com", "password": "password123"},
    )
    assert register.status_code == 200

    logout = raw_client.post("/api/v1/auth/logout", headers=CSRF_HEADERS)
    assert logout.status_code == 204

    me = raw_client.get("/api/v1/auth/me")
    assert me.status_code == 401


def test_forgot_password_returns_generic_message(raw_client):
    response = raw_client.post(
        "/api/v1/auth/forgot-password",
        json={"email": "missing@example.com"},
    )
    assert response.status_code == 200
    assert "If an account exists for this email" in response.json()["detail"]


def test_delete_me_handles_daily_scores_linked_by_birth_profile(raw_client):
    register = raw_client.post(
        "/api/v1/auth/register",
        json={"email": "deleteuser@example.com", "password": "password123"},
    )
    assert register.status_code == 200
    login = raw_client.post(
        "/api/v1/auth/login",
        json={"email": "deleteuser@example.com", "password": "password123"},
    )
    assert login.status_code == 200
    user_id = UUID(login.json()["userId"])

    with SessionLocal() as session:
        member = FamilyMember(
            owner_user_id=user_id,
            display_name="Family Member",
        )
        session.add(member)
        session.flush()

        profile = BirthProfile(
            owner_user_id=user_id,
            family_member_id=member.family_member_id,
            display_name="Delete User",
            birth_date_local=date(1991, 7, 22),
            birth_time_local=time(6, 30),
            birth_place="Chennai, Tamil Nadu, India",
            birth_latitude=Decimal("13.082700"),
            birth_longitude=Decimal("80.270700"),
            birth_timezone="Asia/Kolkata",
        )
        session.add(profile)
        session.flush()

        chart = Chart(
            birth_profile_id=profile.birth_profile_id,
            calculation_version="test-v1",
            julian_day=Decimal("2451545.00000000"),
            lagna_rasi="Mesha",
            lagna_longitude=Decimal("15.25000000"),
            moon_rasi="Rishabha",
            janma_nakshatra="Ashwini",
            janma_pada=1,
        )
        session.add(chart)

        daily_score = DailyScore(
            birth_profile_id=profile.birth_profile_id,
            score_date=date(2026, 5, 31),
            score=74,
            label="Good",
            data={"test": True},
        )
        session.add(daily_score)
        profile_id = profile.birth_profile_id
        session.commit()

    delete_response = raw_client.delete("/api/v1/auth/me", headers=CSRF_HEADERS)
    assert delete_response.status_code == 200
    assert delete_response.json()["detail"] == "Account permanently deleted."

    with SessionLocal() as session:
        assert session.get(User, user_id) is None
        remaining_scores = session.query(DailyScore).filter(DailyScore.birth_profile_id == profile_id).all()
        assert len(remaining_scores) == 0


def test_delete_me_does_not_delete_other_users_profiles_or_charts(raw_client):
    with TestClient(app, raise_server_exceptions=False) as user_a_client, TestClient(app, raise_server_exceptions=False) as user_b_client:
        reg_a = user_a_client.post(
            "/api/v1/auth/register",
            json={"email": "delete-a@example.com", "password": "password123"},
        )
        assert reg_a.status_code == 200
        login_a = user_a_client.post(
            "/api/v1/auth/login",
            json={"email": "delete-a@example.com", "password": "password123"},
        )
        assert login_a.status_code == 200
        user_a_id = UUID(login_a.json()["userId"])

        reg_b = user_b_client.post(
            "/api/v1/auth/register",
            json={"email": "delete-b@example.com", "password": "password123"},
        )
        assert reg_b.status_code == 200
        login_b = user_b_client.post(
            "/api/v1/auth/login",
            json={"email": "delete-b@example.com", "password": "password123"},
        )
        assert login_b.status_code == 200
        user_b_id = UUID(login_b.json()["userId"])

        with SessionLocal() as session:
            profile_a = BirthProfile(
                owner_user_id=user_a_id,
                display_name="User A Profile",
                birth_date_local=date(1990, 1, 1),
                birth_time_local=time(6, 30),
                birth_place="Chennai, Tamil Nadu, India",
                birth_latitude=Decimal("13.082700"),
                birth_longitude=Decimal("80.270700"),
                birth_timezone="Asia/Kolkata",
            )
            session.add(profile_a)
            session.flush()

            chart_a = Chart(
                birth_profile_id=profile_a.birth_profile_id,
                calculation_version="test-v1",
                julian_day=Decimal("2451545.00000000"),
                lagna_rasi="Mesha",
                lagna_longitude=Decimal("15.25000000"),
                moon_rasi="Rishabha",
                janma_nakshatra="Ashwini",
                janma_pada=1,
            )
            session.add(chart_a)
            session.flush()

            profile_b = BirthProfile(
                owner_user_id=user_b_id,
                display_name="User B Profile",
                birth_date_local=date(1992, 2, 2),
                birth_time_local=time(7, 0),
                birth_place="Madurai, Tamil Nadu, India",
                birth_latitude=Decimal("9.925200"),
                birth_longitude=Decimal("78.119800"),
                birth_timezone="Asia/Kolkata",
            )
            session.add(profile_b)
            session.flush()

            chart_b = Chart(
                birth_profile_id=profile_b.birth_profile_id,
                calculation_version="test-v1",
                julian_day=Decimal("2451546.00000000"),
                lagna_rasi="Rishabha",
                lagna_longitude=Decimal("10.50000000"),
                moon_rasi="Mithuna",
                janma_nakshatra="Rohini",
                janma_pada=2,
            )
            session.add(chart_b)
            session.commit()

            profile_a_id = profile_a.birth_profile_id
            chart_a_id = chart_a.chart_id
            profile_b_id = profile_b.birth_profile_id
            chart_b_id = chart_b.chart_id

        delete_response = user_a_client.delete("/api/v1/auth/me", headers=CSRF_HEADERS)
        assert delete_response.status_code == 200

        with SessionLocal() as session:
            assert session.get(User, user_a_id) is None
            assert session.get(User, user_b_id) is not None
            assert session.get(BirthProfile, profile_a_id) is None
            assert session.get(Chart, chart_a_id) is None
            assert session.get(BirthProfile, profile_b_id) is not None
            assert session.get(Chart, chart_b_id) is not None


def test_deleted_user_cannot_login_until_registering_again(raw_client):
    email = "recoverable-delete@example.com"
    password = "password123"

    first_register = raw_client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password},
    )
    assert first_register.status_code == 200
    first_login = raw_client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert first_login.status_code == 200
    first_user_id = first_login.json()["userId"]

    delete_response = raw_client.delete("/api/v1/auth/me", headers=CSRF_HEADERS)
    assert delete_response.status_code == 200

    login_after_delete = raw_client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    assert login_after_delete.status_code == 401
    assert login_after_delete.json()["detail"] == "Invalid email or password."

    second_register = raw_client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password},
    )
    assert second_register.status_code == 200
    second_login = raw_client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert second_login.status_code == 200
    assert second_login.json()["userId"] != first_user_id

    me_response = raw_client.get("/api/v1/auth/me")
    assert_response(me_response, status=200, required_keys=("email", "userId"))
    assert me_response.json()["email"] == email


def test_register_rejects_empty_email(raw_client):
    response = raw_client.post(
        "/api/v1/auth/register",
        json={"email": "", "password": "password123"},
    )
    assert response.status_code == 422


def test_register_rejects_invalid_email_format(raw_client):
    response = raw_client.post(
        "/api/v1/auth/register",
        json={"email": "not-an-email", "password": "password123"},
    )
    assert response.status_code == 422


def test_register_rejects_weak_password(raw_client):
    response = raw_client.post(
        "/api/v1/auth/register",
        json={"email": "weakpass@example.com", "password": "short"},
    )
    assert response.status_code == 422


def test_login_non_existent_email_returns_401(raw_client):
    response = raw_client.post(
        "/api/v1/auth/login",
        json={"email": "missinguser@example.com", "password": "password123"},
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password."


def test_suspended_user_cannot_log_in_or_load_me(raw_client):
    register = raw_client.post(
        "/api/v1/auth/register",
        json={"email": "suspended@example.com", "password": "password123"},
    )
    assert register.status_code == 200
    login = raw_client.post(
        "/api/v1/auth/login",
        json={"email": "suspended@example.com", "password": "password123"},
    )
    assert login.status_code == 200
    user_id = UUID(login.json()["userId"])

    with SessionLocal() as session:
        user = session.get(User, user_id)
        assert user is not None
        user.is_suspended = True
        user.suspension_reason = "support action"
        session.commit()

    me_response = raw_client.get("/api/v1/auth/me")
    assert me_response.status_code == 403
    assert me_response.json()["detail"] == "Account suspended. Contact support."

    logout = raw_client.post("/api/v1/auth/logout", headers=CSRF_HEADERS)
    assert logout.status_code == 204

    login_response = raw_client.post(
        "/api/v1/auth/login",
        json={"email": "suspended@example.com", "password": "password123"},
    )
    assert login_response.status_code == 403
    assert login_response.json()["detail"] == "Account suspended. Contact support."


def test_suspended_user_cannot_patch_or_delete_me(raw_client):
    register = raw_client.post(
        "/api/v1/auth/register",
        json={"email": "suspended-mutating@example.com", "password": "password123"},
    )
    assert register.status_code == 200
    login = raw_client.post(
        "/api/v1/auth/login",
        json={"email": "suspended-mutating@example.com", "password": "password123"},
    )
    assert login.status_code == 200
    user_id = UUID(login.json()["userId"])

    with SessionLocal() as session:
        user = session.get(User, user_id)
        assert user is not None
        user.is_suspended = True
        user.suspension_reason = "support action"
        session.commit()

    patch_response = raw_client.patch(
        "/api/v1/auth/me",
        headers=CSRF_HEADERS,
        json={"userMode": "TRADITIONAL"},
    )
    assert patch_response.status_code == 403
    assert patch_response.json()["detail"] == "Account suspended. Contact support."

    delete_response = raw_client.delete("/api/v1/auth/me", headers=CSRF_HEADERS)
    assert delete_response.status_code == 403
    assert delete_response.json()["detail"] == "Account suspended. Contact support."


def test_logout_when_already_logged_out_returns_204(raw_client):
    logout = raw_client.post("/api/v1/auth/logout")
    assert logout.status_code == 204


def test_cookie_auth_mutation_requires_csrf_header(raw_client):
    raw_client.post(
        "/api/v1/auth/register",
        json={"email": "csrf-user@example.com", "password": "password123"},
    )
    login = raw_client.post(
        "/api/v1/auth/login",
        json={"email": "csrf-user@example.com", "password": "password123"},
    )
    assert login.status_code == 200

    response = raw_client.patch("/api/v1/auth/me", json={"userMode": "TRADITIONAL"})
    assert response.status_code == 403
    assert response.json()["detail"] == "CSRF header required."

    ok = raw_client.patch(
        "/api/v1/auth/me",
        headers=CSRF_HEADERS,
        json={"userMode": "TRADITIONAL"},
    )
    assert ok.status_code == 200
    assert ok.json()["userMode"] == "TRADITIONAL"


def test_delete_me_requires_authentication(raw_client):
    response = raw_client.delete("/api/v1/auth/me")
    assert response.status_code == 401
