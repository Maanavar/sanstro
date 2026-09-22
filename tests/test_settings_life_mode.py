"""Life focus settings (docs/LIFE_FOCUS_PLAN_2026-09-22.md, Phase 0).

The pure-function tests need no database; the API tests use the Postgres
test DB through the ``client`` fixture.
"""
from __future__ import annotations

from datetime import UTC, datetime, timedelta
from uuid import UUID

import pytest

from app.core.life_mode import (
    DEFAULT_LIFE_MODE,
    LIFE_MODE_STALE_DAYS,
    effective_life_mode,
    is_focus_nudge_due,
)

_NOW = datetime(2026, 9, 22, 6, 0, tzinfo=UTC)


# ── Pure functions ────────────────────────────────────────────────────────────

@pytest.mark.no_db
def test_stale_cadence_is_the_owner_ruled_sixty_days():
    assert LIFE_MODE_STALE_DAYS == 60


@pytest.mark.no_db
@pytest.mark.parametrize(
    ("age_days", "due"),
    [(0, False), (30, False), (59, False), (60, True), (400, True)],
)
def test_nudge_due_only_after_the_stale_window(age_days, due):
    set_at = _NOW - timedelta(days=age_days)
    assert is_focus_nudge_due(show_picker=False, set_at=set_at, now=_NOW) is due


@pytest.mark.no_db
def test_nudge_never_competes_with_the_first_run_picker():
    old = _NOW - timedelta(days=365)
    assert is_focus_nudge_due(show_picker=True, set_at=old, now=_NOW) is False
    assert is_focus_nudge_due(show_picker=False, set_at=None, now=_NOW) is False


@pytest.mark.no_db
def test_nudge_treats_a_naive_timestamp_as_utc():
    naive = (_NOW - timedelta(days=61)).replace(tzinfo=None)
    assert is_focus_nudge_due(show_picker=False, set_at=naive, now=_NOW) is True


@pytest.mark.no_db
def test_effective_mode_falls_back_when_saved_focus_is_blocked():
    # D5: a profile edit can block a focus that was valid when it was saved.
    assert effective_life_mode("LOVE", frozenset({"LOVE", "MARRIAGE"})) == DEFAULT_LIFE_MODE
    assert effective_life_mode("CAREER", frozenset({"LOVE"})) == "CAREER"
    assert effective_life_mode(None, frozenset()) == DEFAULT_LIFE_MODE
    assert effective_life_mode("NOT_A_MODE", frozenset()) == DEFAULT_LIFE_MODE


# ── API ───────────────────────────────────────────────────────────────────────

def test_first_run_owes_the_picker_and_not_the_nudge(client):
    body = client.get("/api/v1/settings/life-mode").json()
    assert body["mode"] == "BALANCED"
    assert body["showLifeModePicker"] is True
    assert body["focusNudgeDue"] is False


def test_skip_saves_balanced_and_retires_the_picker(client):
    # "Skip for now" on web is a background PATCH of BALANCED.
    patched = client.patch("/api/v1/settings/life-mode", json={"mode": "BALANCED"})
    assert patched.status_code == 200
    body = client.get("/api/v1/settings/life-mode").json()
    assert body["mode"] == "BALANCED"
    assert body["showLifeModePicker"] is False
    assert body["lifeModeSetAt"] is not None
    assert body["focusNudgeDue"] is False


def test_old_focus_is_nudged_and_keep_refreshes_it(client):
    from app.db.session import SessionLocal
    from app.models.user_preference import UserPreference
    from tests.conftest import TEST_USER_ID

    client.patch("/api/v1/settings/life-mode", json={"mode": "CAREER"})
    with SessionLocal() as session, session.begin():
        pref = session.query(UserPreference).filter_by(owner_user_id=UUID(TEST_USER_ID)).one()
        pref.life_mode_set_at = datetime.now(tz=UTC) - timedelta(days=LIFE_MODE_STALE_DAYS + 1)

    stale = client.get("/api/v1/settings/life-mode").json()
    assert stale["mode"] == "CAREER"
    assert stale["showLifeModePicker"] is False
    assert stale["focusNudgeDue"] is True

    # "Yes, keep" re-sends the same focus, which restamps it.
    kept = client.patch("/api/v1/settings/life-mode", json={"mode": "CAREER"}).json()
    assert kept["mode"] == "CAREER"
    assert kept["focusNudgeDue"] is False


def test_blocked_saved_focus_reads_back_as_balanced(client, monkeypatch):
    import app.api.settings as settings_api

    client.patch("/api/v1/settings/life-mode", json={"mode": "LOVE"})
    # The profile is edited to married after LOVE was saved.
    monkeypatch.setattr(
        settings_api, "_user_blocked_modes", lambda _s, _u: frozenset({"LOVE", "MARRIAGE"})
    )
    body = client.get("/api/v1/settings/life-mode").json()
    assert body["mode"] == "BALANCED"
    assert "LOVE" in body["blockedModes"]

    refused = client.patch("/api/v1/settings/life-mode", json={"mode": "MARRIAGE"})
    assert refused.status_code == 403
