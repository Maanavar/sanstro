"""Last-seen stamping (admin spec L6, §8 "active user").

These tests drive the real `get_current_user` through `raw_client` and a signed
token, not the `client` fixture — `client` overrides the dependency, so the
stamp never runs there and a test written against it would pass with the
feature deleted.
"""
from __future__ import annotations

from datetime import UTC, date, datetime, timedelta
from uuid import UUID

import pytest

from app.core import presence
from app.models.user import User
from tests.conftest import TEST_USER_ID, SessionLocal, _make_test_user

UID = UUID(TEST_USER_ID)


@pytest.fixture()
def account(raw_client):
    """The test account, created after `raw_client` has reset the schema.

    `client` would provide one, but it also overrides `get_current_user` — the
    very dependency under test. `raw_client` drops and recreates the schema and
    inserts nothing, so the row has to be made here, after its reset.
    """
    with SessionLocal() as session, session.begin():
        _make_test_user(session)
    return UID


class _FixedClock:
    """A clock that answers one instant, so "today" is a fact the test states."""

    def __init__(self, at: datetime) -> None:
        self._at = at

    def now_utc(self) -> datetime:
        return self._at


def _at(day: date, hour: int = 9) -> _FixedClock:
    return _FixedClock(datetime(day.year, day.month, day.day, hour, tzinfo=UTC))


def _read(field: str = "last_seen_on"):
    with SessionLocal() as session:
        return getattr(session.get(User, UID), field)


def _auth(token: str, **extra: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}", **extra}


# ── Through the real dependency ───────────────────────────────────────────────


def test_an_authenticated_request_stamps_today(account, raw_client, token):
    assert _read() is None

    response = raw_client.get("/api/v1/auth/me", headers=_auth(token))

    assert response.status_code == 200, response.text
    assert _read() == presence.accounting_date()


def test_the_client_and_language_headers_are_recorded(account, raw_client, token):
    raw_client.get(
        "/api/v1/auth/me",
        headers=_auth(token, **{"X-Vinaadi-Client": "ios", "X-Client-Language": "ta"}),
    )

    assert _read("last_platform") == "ios"
    assert _read("last_language") == "ta"


def test_an_unrecognised_platform_is_not_stored(account, raw_client, token):
    # The header is client-controlled and these columns are grouped over in
    # metrics queries, so free text would turn one bad client into fake groups.
    raw_client.get(
        "/api/v1/auth/me",
        headers=_auth(token, **{"X-Vinaadi-Client": "'; DROP TABLE users; --"}),
    )

    assert _read("last_platform") is None
    assert _read() == presence.accounting_date()


def test_a_suspended_account_is_not_counted_as_active(account, raw_client, token):
    with SessionLocal() as session, session.begin():
        session.get(User, UID).is_suspended = True

    response = raw_client.get("/api/v1/auth/me", headers=_auth(token))

    assert response.status_code == 403
    assert _read() is None


# ── The once-a-day property ───────────────────────────────────────────────────


def test_the_second_request_of_the_day_writes_nothing(account, raw_client, token):
    today = presence.accounting_date()

    assert presence.touch_last_seen(UID, platform="web", clock=_at(today)) is True
    # False is the whole point: `get_current_user` runs on every authenticated
    # request, so without this guard a busy account is thousands of UPDATEs a
    # day on `users`, each one a dead row to vacuum, to store a date that did
    # not change.
    assert presence.touch_last_seen(UID, platform="web", clock=_at(today)) is False
    assert presence.touch_last_seen(UID, platform="web", clock=_at(today)) is False


def test_the_next_day_writes_again(account, raw_client, token):
    today = presence.accounting_date()

    assert presence.touch_last_seen(UID, clock=_at(today)) is True
    assert presence.touch_last_seen(UID, clock=_at(today + timedelta(days=1))) is True
    assert _read() == today + timedelta(days=1)


def test_a_day_held_open_keeps_the_platform_it_was_told_last(account, raw_client, token):
    today = presence.accounting_date()
    presence.touch_last_seen(UID, platform="ios", language="ta", clock=_at(today))

    # Same day, so no write happens at all — the platform stays as it was
    # rather than following a later request from another device. That is the
    # documented cost of one write a day, recorded here so the trade-off is
    # visible if a future metric needs per-session platform instead.
    presence.touch_last_seen(UID, platform="web", language="en", clock=_at(today))

    assert _read("last_platform") == "ios"
    assert _read("last_language") == "ta"


def test_a_missing_header_leaves_the_stored_value_alone(account, raw_client, token):
    today = presence.accounting_date()
    presence.touch_last_seen(UID, platform="android", language="en", clock=_at(today))

    # A new day with no headers (a cron job, an old build, a script) must not
    # blank what the last real session reported.
    presence.touch_last_seen(UID, clock=_at(today + timedelta(days=1)))

    assert _read("last_platform") == "android"
    assert _read("last_language") == "en"


# ── It is telemetry, not the request ──────────────────────────────────────────


def test_a_failed_stamp_does_not_fail_the_request(account, raw_client, token, monkeypatch):
    def explode(*_args, **_kwargs):
        raise RuntimeError("synthetic database failure")

    monkeypatch.setattr(presence, "SessionLocal", explode)

    response = raw_client.get("/api/v1/auth/me", headers=_auth(token))

    assert response.status_code == 200, response.text
    assert _read() is None


def test_an_unknown_user_id_is_a_no_op(account, raw_client):
    assert presence.touch_last_seen(UUID(int=0)) is False


# ── The §8 definition ─────────────────────────────────────────────────────────


@pytest.mark.parametrize("value", ["WEB", " web ", "Web"])
def test_the_platform_is_normalised_rather_than_rejected(value):
    assert presence.normalize_platform(value) == "web"


@pytest.mark.parametrize("value", ["", None, "windows-phone", "ta"])
def test_an_unknown_platform_reads_as_not_stated(value):
    assert presence.normalize_platform(value) is None


@pytest.mark.parametrize(("value", "expected"), [("ta", "ta"), ("EN", "en"), ("ta-IN", "ta")])
def test_language_normalisation_accepts_a_locale_tag(value, expected):
    assert presence.normalize_language(value) == expected


def test_active_user_ids_is_the_spec_definition(account, raw_client, token):
    today = presence.accounting_date()
    presence.touch_last_seen(UID, clock=_at(today))

    with SessionLocal() as session:
        assert presence.active_user_ids(today, session) == [UID]
        assert presence.active_user_ids(today - timedelta(days=1), session) == []
