"""First-touch attribution and referral codes (GRW-03, GRW-13).

The web records where a visitor first came from in the `vinaadi_ft` cookie
(web/lib/acquisition.ts); account creation copies it onto the user row, and
the admin report groups signups by it. Before this, no user row said where it
came from, so "which page or channel brings people who stay" had no answer.
"""
from __future__ import annotations

import json
import urllib.parse
from uuid import uuid4

import pytest

from app.api.admin_analytics import acquisition_channel
from app.core.auth import get_admin_user
from app.db.session import SessionLocal
from app.main import app
from app.models.user import User
from app.services.acquisition_service import FIRST_TOUCH_COOKIE, parse_first_touch


def _cookie(**fields: str) -> str:
    return urllib.parse.quote(json.dumps(fields))


# ── Parsing hostile input ────────────────────────────────────────────────────


@pytest.mark.no_db
def test_parses_every_recorded_field() -> None:
    raw = _cookie(s="instagram", m="reel", c="porutham-oct", r="ab23cd45", h="L.Instagram.com", p="/tools/jadhagam-generator")
    assert parse_first_touch(raw) == {
        "acquisition_source": "instagram",
        "acquisition_medium": "reel",
        "acquisition_campaign": "porutham-oct",
        "acquisition_ref": "ab23cd45",
        "acquisition_referrer_host": "l.instagram.com",
        "acquisition_landing_path": "/tools/jadhagam-generator",
    }


@pytest.mark.no_db
@pytest.mark.parametrize("raw", [None, "", "not-json", urllib.parse.quote("[1,2]"), urllib.parse.quote('"x"')])
def test_a_missing_or_malformed_cookie_records_nothing(raw: str | None) -> None:
    assert parse_first_touch(raw) == {}


@pytest.mark.no_db
def test_refuses_values_outside_the_allowed_shape_instead_of_storing_them() -> None:
    raw = _cookie(
        s="<script>alert(1)</script>",
        h="evil.com/path?q=1",
        p="https://evil.com/x",
        r="ab",  # too short to be a code
        c="ok-campaign",
    )
    assert parse_first_touch(raw) == {"acquisition_campaign": "ok-campaign"}


@pytest.mark.no_db
def test_caps_lengths_to_the_columns() -> None:
    parsed = parse_first_touch(_cookie(s="a" * 500))
    assert len(parsed["acquisition_source"]) == 64


@pytest.mark.no_db
def test_channel_buckets_most_specific_first() -> None:
    assert acquisition_channel("Instagram", "ab23cd45", "x.com") == "instagram"
    assert acquisition_channel(None, "ab23cd45", "wa.me") == "referral"
    assert acquisition_channel(None, None, "www.google.com") == "google.com"
    assert acquisition_channel(None, None, None) == "unknown"


# ── Account creation ─────────────────────────────────────────────────────────


def _register(raw_client, email: str, cookie: str | None = None) -> None:
    if cookie is not None:
        raw_client.cookies.set(FIRST_TOUCH_COOKIE, cookie)
    assert raw_client.post(
        "/api/v1/auth/register", json={"email": email, "password": "password123", "consentGiven": True}
    ).status_code == 200


def _user(email: str) -> User:
    with SessionLocal() as session:
        user = session.query(User).filter(User.email == email).one()
        session.expunge(user)
        return user


def test_registration_records_the_first_touch(raw_client) -> None:
    _register(raw_client, "ft-reg@example.com", _cookie(s="google", m="cpc", p="/tools/marriage-porutham-calculator"))
    user = _user("ft-reg@example.com")
    assert user.acquisition_source == "google"
    assert user.acquisition_medium == "cpc"
    assert user.acquisition_landing_path == "/tools/marriage-porutham-calculator"


def test_registration_without_a_cookie_leaves_the_source_unknown(raw_client) -> None:
    _register(raw_client, "ft-none@example.com")
    user = _user("ft-none@example.com")
    assert user.acquisition_source is None
    assert user.acquisition_landing_path is None


# ── Referral codes ───────────────────────────────────────────────────────────


def _login(raw_client, email: str) -> None:
    assert raw_client.post("/api/v1/auth/login", json={"email": email, "password": "password123"}).status_code == 200


def test_referral_code_is_minted_once_and_counts_who_it_brought(raw_client) -> None:
    _register(raw_client, "ref-owner@example.com")
    _login(raw_client, "ref-owner@example.com")
    first = raw_client.get("/api/v1/users/me/referral").json()["data"]
    again = raw_client.get("/api/v1/users/me/referral").json()["data"]
    assert first["code"] == again["code"]
    assert first["shareUrl"].endswith(f"/?ref={first['code']}")
    assert first["referredCount"] == 0

    # Someone arrives through that link and signs up.
    raw_client.cookies.clear()
    _register(raw_client, "ref-friend@example.com", _cookie(r=first["code"], p="/"))
    raw_client.cookies.clear()
    _login(raw_client, "ref-owner@example.com")
    assert raw_client.get("/api/v1/users/me/referral").json()["data"]["referredCount"] == 1


def test_referral_code_is_not_derived_from_the_user_id(raw_client) -> None:
    _register(raw_client, "ref-opaque@example.com")
    _login(raw_client, "ref-opaque@example.com")
    code = raw_client.get("/api/v1/users/me/referral").json()["data"]["code"]
    user_id = str(_user("ref-opaque@example.com").user_id).replace("-", "")
    assert code not in user_id


# ── Admin report ─────────────────────────────────────────────────────────────


def test_admin_report_groups_signups_by_channel_and_landing_page(raw_client) -> None:
    # Seeded directly: four registrations from one test IP trip the auth
    # throttle, and registration's own stamping is covered above.
    porutham = "/tools/marriage-porutham-calculator"
    with SessionLocal() as session, session.begin():
        session.add_all([
            User(user_id=uuid4(), email="ch-a@example.com", acquisition_source="instagram", acquisition_landing_path=porutham),
            User(user_id=uuid4(), email="ch-b@example.com", acquisition_source="instagram", acquisition_landing_path=porutham),
            User(user_id=uuid4(), email="ch-c@example.com", acquisition_referrer_host="www.google.com", acquisition_landing_path="/panchangam/today"),
            User(user_id=uuid4(), email="ch-d@example.com"),
        ])

    app.dependency_overrides[get_admin_user] = lambda: User(user_id=uuid4(), email="admin@example.invalid", is_admin=True)
    try:
        report = raw_client.get("/api/v1/admin/analytics/acquisition?days=30").json()
    finally:
        app.dependency_overrides.pop(get_admin_user, None)

    channels = {c["channel"]: c["signups"] for c in report["channels"]}
    assert channels == {"instagram": 2, "google.com": 1, "unknown": 1}
    assert report["landing_pages"][0] == {
        "channel": "/tools/marriage-porutham-calculator", "signups": 2, "activated": 0,
    }


# BLIND SPOT: the Google callback's new-account branch also calls
# apply_first_touch, but exercising it needs Google's token and userinfo
# endpoints stubbed; that path is covered by reading, not by this file.
