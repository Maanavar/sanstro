"""The admin key must not work from a browser, and privileged acts must name a person (P1-4).

Two halves of the same problem. The console held a long-lived shared admin key
in sessionStorage and sent it as `X-Admin-Key` — readable by any XSS on that
origin, any browser extension, anyone on a shared machine. And because it is one
secret shared by everybody, an action taken with it is anonymous by
construction: the audit log recorded that a user was deleted and could not
record by whom.

Session-based admin authority already existed server-side (`User.is_admin`, the
bootstrap admin-email list). What was missing was shutting the header off for
browsers, and writing down who acted.
"""
from __future__ import annotations

from uuid import uuid4

import pytest

from app.core.config import get_settings
from app.db.session import SessionLocal
from app.models.admin_audit_log import AdminAuditLog
from app.models.user import User
from app.services.audit_service import log_admin_action


@pytest.fixture()
def admin_key(monkeypatch):
    key = "synthetic-admin-key-for-tests"
    settings = get_settings()
    monkeypatch.setattr(settings, "admin_api_key", key, raising=False)
    return key


@pytest.fixture()
def non_admin_client(raw_client, monkeypatch):
    """A signed-in user who is NOT an admin, so only the key path can let them
    through — which is exactly the path under test."""
    from app.core.auth import get_current_user
    from app.main import app

    user_id = uuid4()
    email = f"plain-{uuid4().hex}@example.invalid"
    with SessionLocal() as session, session.begin():
        session.add(User(user_id=user_id, email=email))
    # Built from plain values, not from the persisted instance: that one is
    # detached once its session closes, and touching an attribute on it raises.
    stub = User(user_id=user_id, email=email)
    app.dependency_overrides[get_current_user] = lambda: stub
    yield raw_client
    app.dependency_overrides.pop(get_current_user, None)


# --------------------------------------------------------------------------- #
# The header must not be usable from a browser                                #
# --------------------------------------------------------------------------- #

@pytest.mark.parametrize("browser_header", ["origin", "referer"])
def test_admin_key_is_refused_when_the_request_came_from_a_browser(
    non_admin_client, admin_key, browser_header
):
    response = non_admin_client.get(
        "/api/v1/admin/stats",
        headers={"X-Admin-Key": admin_key, browser_header: "https://vinaadi.example"},
    )

    assert response.status_code == 403, response.text


def test_admin_key_still_works_for_a_server_to_server_caller(non_admin_client, admin_key):
    """The header is retained on purpose for callers that are not browsers.
    Removing it entirely was not the ask; making it unreachable from a page was."""
    response = non_admin_client.get(
        "/api/v1/admin/stats", headers={"X-Admin-Key": admin_key}
    )

    assert response.status_code == 200, response.text


def test_a_wrong_key_is_refused_from_anywhere(non_admin_client, admin_key):
    response = non_admin_client.get(
        "/api/v1/admin/stats", headers={"X-Admin-Key": "not-the-key"}
    )

    assert response.status_code == 403


# --------------------------------------------------------------------------- #
# Privileged actions must name the person who took them                       #
# --------------------------------------------------------------------------- #

def test_a_privileged_action_records_who_performed_it(client):
    """`client` is signed in as the test user. Flipping a feature flag is the
    cheapest privileged action that writes an audit row."""
    flags = client.get("/api/v1/admin/flags")
    assert flags.status_code == 200, flags.text
    flag_name = flags.json()[0]["name"]

    reset = client.delete(f"/api/v1/admin/flags/{flag_name}/reset")
    assert reset.status_code == 200, reset.text

    with SessionLocal() as session:
        entry = (
            session.query(AdminAuditLog)
            .filter(AdminAuditLog.action == "reset_flag")
            .order_by(AdminAuditLog.created_at.desc())
            .first()
        )

    assert entry is not None, "the action was not audited at all"
    assert entry.actor_user_id is not None, (
        "the audit row does not say who did it — which is the first question an "
        "incident review asks"
    )


def test_deleting_the_actor_does_not_erase_what_they_did(client):
    """ON DELETE SET NULL, not CASCADE. An admin deleting their own account must
    not take their audit trail with them — a trail that silently loses rows is
    worse than none, because it still looks intact."""
    actor_id = uuid4()
    with SessionLocal() as session, session.begin():
        session.add(User(user_id=actor_id, email=f"leaving-{uuid4().hex}@example.invalid"))

    log_admin_action("suspend_user", target_type="user", target_id="someone",
                     actor_user_id=actor_id)

    with SessionLocal() as session, session.begin():
        session.delete(session.get(User, actor_id))

    with SessionLocal() as session:
        rows = (
            session.query(AdminAuditLog)
            .filter(AdminAuditLog.target_id == "someone")
            .all()
        )

    assert len(rows) == 1, "the audit row was deleted along with the user"
    assert rows[0].actor_user_id is None
    assert rows[0].action == "suspend_user"


def test_an_unattributed_action_is_still_recordable(client):
    """Nullable on purpose: a genuine server-to-server caller has no user to
    name, and pre-existing rows have none either."""
    log_admin_action("trigger_job", target_type="job", target_id="nightly")

    with SessionLocal() as session:
        entry = (
            session.query(AdminAuditLog)
            .filter(AdminAuditLog.target_id == "nightly")
            .first()
        )

    assert entry is not None
    assert entry.actor_user_id is None
