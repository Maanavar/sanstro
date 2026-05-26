from __future__ import annotations


def test_register_sets_cookie_and_returns_user(raw_client):
    response = raw_client.post(
        "/api/v1/auth/register",
        json={"email": "authuser@example.com", "password": "password123"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["email"] == "authuser@example.com"
    assert payload["userId"]
    assert "vinaadi_token" in response.headers.get("set-cookie", "")

    me_response = raw_client.get("/api/v1/auth/me")
    assert me_response.status_code == 200
    me_payload = me_response.json()
    assert me_payload["email"] == "authuser@example.com"
    assert me_payload["userId"] == payload["userId"]


def test_register_duplicate_email_returns_409(raw_client):
    first = raw_client.post(
        "/api/v1/auth/register",
        json={"email": "duplicate@example.com", "password": "password123"},
    )
    assert first.status_code == 200

    second = raw_client.post(
        "/api/v1/auth/register",
        json={"email": "duplicate@example.com", "password": "password123"},
    )
    assert second.status_code == 409


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

    logout = raw_client.post("/api/v1/auth/logout")
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
