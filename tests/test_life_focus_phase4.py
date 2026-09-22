"""Life Focus Phase 4 measurement gates.

The PATCH event is the durable source for adoption, first-run Skip and change
rate.  Interaction taps stay in the consent-gated client analytics paths.
"""
from __future__ import annotations

from datetime import UTC, datetime
from uuid import uuid4

import pytest
from sqlalchemy import text

from app.core.auth import create_access_token
from app.db.session import SessionLocal
from app.models.life_focus_event import LifeFocusEvent
from app.models.user import User
from app.models.user_preference import UserPreference

LIFE_MODE = "/api/v1/settings/life-mode"
METRICS = "/api/v1/admin/analytics/life-focus"


def _events() -> list[dict]:
    with SessionLocal() as session:
        rows = session.execute(
            text(
                """
                SELECT intent, previous_mode, new_mode, is_first_run, surface
                FROM life_focus_events
                ORDER BY created_at, event_id
                """
            )
        ).mappings()
        return [dict(row) for row in rows]


def _patch(client, mode: str, intent: str, surface: str | None = "FIRST_RUN_PICKER"):
    body = {"mode": mode, "intent": intent}
    if surface is not None:
        body["surface"] = surface
    return client.patch(LIFE_MODE, json=body)


def _add_reader(*, life_mode: str, is_admin: bool = False, deleted: bool = False) -> None:
    """A second synthetic account with a saved focus and one first-run event."""
    user_id = uuid4()
    with SessionLocal() as session, session.begin():
        session.add(
            User(
                user_id=user_id,
                email=f"reader-{user_id.hex[:8]}@example.invalid",
                is_admin=is_admin,
                deleted_at=datetime.now(UTC) if deleted else None,
            )
        )
        session.flush()
        session.add(
            UserPreference(
                preference_id=uuid4(),
                owner_user_id=user_id,
                life_mode=life_mode,
                show_life_mode_picker=False,
            )
        )
        session.add(
            LifeFocusEvent(
                user_id=user_id,
                intent="SKIP",
                previous_mode="BALANCED",
                new_mode="BALANCED",
                is_first_run=True,
                surface="FIRST_RUN_PICKER",
            )
        )


# ── Recording ────────────────────────────────────────────────────────────────


def test_first_run_skip_is_distinct_from_choosing_balanced(client):
    assert _patch(client, "BALANCED", "SKIP").status_code == 200
    assert _events() == [
        {
            "intent": "SKIP",
            "previous_mode": "BALANCED",
            "new_mode": "BALANCED",
            "is_first_run": True,
            "surface": "FIRST_RUN_PICKER",
        }
    ]


def test_first_run_balanced_selection_is_not_recorded_as_skip(client):
    assert _patch(client, "BALANCED", "SELECT").status_code == 200
    event = _events()[0]
    assert event["intent"] == "SELECT"
    assert event["is_first_run"] is True


def test_an_old_client_without_intent_or_surface_is_still_accepted(client):
    response = client.patch(LIFE_MODE, json={"mode": "CAREER"})
    assert response.status_code == 200
    assert _events()[0]["intent"] == "SELECT"
    assert _events()[0]["surface"] is None


# ── Rejections: the rules that keep Skip and Keep honest ─────────────────────


def test_skip_after_onboarding_is_rejected_and_records_nothing(client):
    assert _patch(client, "CAREER", "SELECT").status_code == 200
    response = _patch(client, "BALANCED", "SKIP")
    assert response.status_code == 422
    # A stale second tab must not overwrite the real choice either.
    assert client.get(LIFE_MODE).json()["mode"] == "CAREER"
    assert len(_events()) == 1


def test_skip_with_a_non_balanced_mode_is_rejected(client):
    assert _patch(client, "CAREER", "SKIP").status_code == 422
    assert _events() == []


@pytest.mark.parametrize("surface", ["WEB", "MOBILE", None])
def test_skip_from_anywhere_but_the_first_run_picker_is_rejected(client, surface):
    assert _patch(client, "BALANCED", "SKIP", surface=surface).status_code == 422
    assert _events() == []


def test_keep_must_confirm_the_current_focus(client):
    assert _patch(client, "CAREER", "SELECT").status_code == 200
    # KEEP with a different mode would silently change focus without counting.
    assert _patch(client, "STUDY", "KEEP", surface="WEB").status_code == 422
    assert client.get(LIFE_MODE).json()["mode"] == "CAREER"
    assert _patch(client, "CAREER", "KEEP", surface="WEB").status_code == 200


# ── Metrics ──────────────────────────────────────────────────────────────────


def test_admin_metrics_count_adoption_skip_and_real_changes(client):
    # First-run choice establishes the preference; it is not a later change.
    _patch(client, "CAREER", "SELECT")
    # Refreshing the nudge is an interaction but not a focus change.
    _patch(client, "CAREER", "KEEP", surface="WEB")
    # A subsequent selection of a different focus is the measured change.
    _patch(client, "STUDY", "SELECT", surface="WEB")

    response = client.get(METRICS)
    assert response.status_code == 200
    body = response.json()
    assert body["total_users"] == 1
    assert body["non_balanced_users"] == 1
    assert body["non_balanced_share"] == 1.0
    assert body["first_run_decisions"] == 1
    assert body["first_run_picker_decisions"] == 1
    assert body["first_run_skips"] == 0
    assert body["first_run_skip_rate"] == 0.0
    assert body["focus_change_count"] == 1
    assert body["focus_returning_users"] == 1
    assert body["focus_changes_per_returning_user"] == 1.0
    assert body["mode_counts"]["STUDY"] == 1
    assert body["adoption_as_of"]


def test_a_mobile_first_choice_does_not_dilute_the_skip_rate(client):
    # Mobile has no first-run modal, so its first write can never be a Skip.
    _patch(client, "CAREER", "SELECT", surface="MOBILE")
    _add_reader(life_mode="BALANCED")  # one first-run-picker Skip

    body = client.get(METRICS).json()
    assert body["first_run_decisions"] == 2
    assert body["first_run_picker_decisions"] == 1
    assert body["first_run_skips"] == 1
    assert body["first_run_skip_rate"] == 1.0


def test_a_first_choice_alone_is_not_in_the_change_rate_base(client):
    _patch(client, "CAREER", "SELECT")
    body = client.get(METRICS).json()
    assert body["focus_returning_users"] == 0
    assert body["focus_changes_per_returning_user"] is None


def test_deleted_and_admin_accounts_are_outside_every_measure(client):
    _patch(client, "CAREER", "SELECT")
    _add_reader(life_mode="LOVE", deleted=True)
    _add_reader(life_mode="WEALTH", is_admin=True)

    body = client.get(METRICS).json()
    assert body["total_users"] == 1
    assert body["non_balanced_users"] == 1
    assert "LOVE" not in body["mode_counts"]
    assert "WEALTH" not in body["mode_counts"]
    assert body["mode_counts"]["BALANCED"] == 0
    # Their Skip events are excluded as well.
    assert body["first_run_skips"] == 0
    assert body["first_run_decisions"] == 1


def test_admin_metrics_reject_an_invalid_month(client):
    assert client.get(f"{METRICS}?month=2026-13").status_code == 422


def test_life_focus_metrics_is_not_reachable_by_a_normal_user(raw_client):
    user_id = uuid4()
    with SessionLocal() as session, session.begin():
        session.add(User(user_id=user_id, email="ordinary-reader@example.invalid"))

    response = raw_client.get(
        METRICS,
        headers={"Authorization": f"Bearer {create_access_token(subject=str(user_id))}"},
    )
    assert response.status_code == 403
