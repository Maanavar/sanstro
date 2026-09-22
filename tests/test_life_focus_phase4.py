"""Life Focus Phase 4 measurement gates.

The PATCH event is the durable source for adoption, first-run Skip and change
rate.  Interaction taps stay in the consent-gated client analytics paths.
"""
from __future__ import annotations

from uuid import uuid4

from sqlalchemy import text

from app.core.auth import create_access_token
from app.db.session import SessionLocal
from app.models.user import User


def _events() -> list[dict]:
    with SessionLocal() as session:
        rows = session.execute(
            text(
                """
                SELECT intent, previous_mode, new_mode, is_first_run
                FROM life_focus_events
                ORDER BY created_at, event_id
                """
            )
        ).mappings()
        return [dict(row) for row in rows]


def test_first_run_skip_is_distinct_from_choosing_balanced(client):
    response = client.patch(
        "/api/v1/settings/life-mode",
        json={"mode": "BALANCED", "intent": "SKIP"},
    )
    assert response.status_code == 200
    assert _events() == [
        {
            "intent": "SKIP",
            "previous_mode": "BALANCED",
            "new_mode": "BALANCED",
            "is_first_run": True,
        }
    ]


def test_first_run_balanced_selection_is_not_recorded_as_skip(client):
    response = client.patch(
        "/api/v1/settings/life-mode",
        json={"mode": "BALANCED", "intent": "SELECT"},
    )
    assert response.status_code == 200
    assert _events()[0]["intent"] == "SELECT"
    assert _events()[0]["is_first_run"] is True


def test_admin_metrics_count_adoption_skip_and_real_changes(client):
    # First-run choice establishes the preference; it is not a later change.
    client.patch(
        "/api/v1/settings/life-mode",
        json={"mode": "CAREER", "intent": "SELECT"},
    )
    # Refreshing the nudge is an interaction but not a focus change.
    client.patch(
        "/api/v1/settings/life-mode",
        json={"mode": "CAREER", "intent": "KEEP"},
    )
    # A subsequent selection of a different focus is the measured change.
    client.patch(
        "/api/v1/settings/life-mode",
        json={"mode": "STUDY", "intent": "SELECT"},
    )

    response = client.get("/api/v1/admin/analytics/life-focus")
    assert response.status_code == 200
    body = response.json()
    assert body["total_users"] == 1
    assert body["non_balanced_users"] == 1
    assert body["non_balanced_share"] == 1.0
    assert body["first_run_decisions"] == 1
    assert body["first_run_skips"] == 0
    assert body["first_run_skip_rate"] == 0.0
    assert body["focus_change_count"] == 1
    assert body["focus_active_users"] == 1
    assert body["focus_changes_per_active_user"] == 1.0
    assert body["mode_counts"]["STUDY"] == 1


def test_admin_metrics_reject_an_invalid_month(client):
    response = client.get("/api/v1/admin/analytics/life-focus?month=2026-13")
    assert response.status_code == 422


def test_life_focus_metrics_is_not_reachable_by_a_normal_user(raw_client):
    user_id = uuid4()
    with SessionLocal() as session, session.begin():
        session.add(User(user_id=user_id, email="ordinary-reader@example.invalid"))

    response = raw_client.get(
        "/api/v1/admin/analytics/life-focus",
        headers={"Authorization": f"Bearer {create_access_token(subject=str(user_id))}"},
    )
    assert response.status_code == 403
