"""The admin audit log (admin spec L4).

Acceptance, as the spec words it: every non-GET route behind an admin guard
writes an audit row with a non-null actor (the test enumerates the routes); the
application's DB connection cannot UPDATE or DELETE audit rows.

Five layers, each closing a gap the one before cannot see:

1. Structural. Read off the live app: every mutating admin route, and each
   console read of a person's data, takes exactly one `audited(...)`
   dependency, resolved before the elevation guard (or elevation refusals
   would go unrecorded). The routes that must demand a reason are pinned. No
   route module calls `log_admin_action` itself, so nothing writes twice.
2. Coverage. Every mutating admin route, called for real by an elevated owner
   with a junk body, leaves exactly one row naming that owner. Junk on purpose:
   the row must exist for refusals too, and junk is the one input every route
   refuses without side effects.
3. Outcome and reason. A success, a refusal, a crash and a missing reason each
   land as what they were; the console's first, tokenless try at a destructive
   route does not.
4. Append-only. UPDATE, DELETE and TRUNCATE are refused at the database, except
   the narrow changes erasure and the actor FK need.
5. The read API filters and returns the new columns. The migration installs the
   same guard SQL as the model.

BLIND SPOTS (CLAUDE.md "a gate proves its own check"):
- Layer 2 proves a row per request, not that the row's target and details are
  right for every route; layer 3 checks those for a sample.
- A permission refusal (support calling an owner-only route) resolves before
  the audit dependency and is not recorded. Nor is a non-admin's 403.
- ARC-20 (commit before "success") is not provoked here: no test makes the
  handler's commit fail. The code path is the dependency's `db.commit()`.
- Layer 4 runs as the app's own DB role, which owns the table and could still
  drop the trigger. Taking DDL away from that role is ARC-19's hosting step.
"""
from __future__ import annotations

import ast
import importlib.util
from datetime import UTC, datetime, timedelta
from pathlib import Path
from uuid import UUID, uuid4

import pytest
from sqlalchemy import text
from sqlalchemy.exc import DBAPIError

from app.core.auth import (
    ADMIN_ELEVATION_HEADER,
    create_admin_elevation_token,
    get_admin_user,
    get_admin_user_without_mfa,
    get_current_user,
    get_elevated_admin_user,
)
from app.db.session import SessionLocal
from app.main import app
from app.models import admin_audit_log as audit_model
from app.models.admin_audit_log import AdminAuditLog
from app.models.admin_mfa import AdminMfaCredential
from app.models.user import User
from app.services.audit_service import log_admin_action

REPO = Path(__file__).resolve().parent.parent

_ADMIN_GUARDS = {get_admin_user, get_admin_user_without_mfa, get_elevated_admin_user}
_MUTATING = {"POST", "PUT", "PATCH", "DELETE"}

#: GET routes that show the console a person's data, so they are audited too.
_AUDITED_READS = {
    ("GET", "/api/v1/admin/users"),
    ("GET", "/api/v1/admin/users/{user_id}"),
    ("GET", "/api/v1/admin/users/{owner_user_id}/export"),
    # Reads one person's email and whole payment history (L9).
    ("GET", "/api/v1/admin/users/{user_id}/support"),
}

#: Routes that always need a reason (spec L4: destructive actions). The
#: destructive half of `jobs/{job_id}/trigger` needs one too; that is checked
#: in the handler (the job is a path parameter) and tested in layer 3.
_REASON_REQUIRED = {
    ("PUT", "/api/v1/admin/users/{user_id}/role"),
    ("DELETE", "/api/v1/admin/users/{user_id}/role"),
    ("DELETE", "/api/v1/admin/users/{user_id}/mfa"),
    ("DELETE", "/api/v1/admin/users/{owner_user_id}/data"),
    ("GET", "/api/v1/admin/users/{owner_user_id}/export"),
    ("PATCH", "/api/v1/admin/users/{user_id}/suspend"),
    ("PATCH", "/api/v1/admin/flags/{flag_name}"),
    ("DELETE", "/api/v1/admin/flags/{flag_name}/reset"),
    ("POST", "/api/v1/admin/flags/changes/{change_id}/rollback"),
    ("DELETE", "/api/v1/qa/regressions"),
    # L9 support console, 2026-11-04. Each one answers "an agent touched this
    # account", the question the audit log exists for, so all four need a reason.
    ("POST", "/api/v1/admin/users/{user_id}/reset-link"),
    ("POST", "/api/v1/admin/users/{user_id}/force-logout"),
    ("POST", "/api/v1/admin/users/{user_id}/entitlements"),
    ("POST", "/api/v1/admin/users/{user_id}/entitlements/{entitlement_id}/revoke"),
}

#: The only routes whose audit dependency resolves an actor without TOTP.
_BEFORE_MFA = {("POST", "/api/v1/admin/mfa/enroll"), ("POST", "/api/v1/admin/mfa/confirm")}

_SECRET = "JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP"  # noqa: S105 — synthetic test value


def _calls(dependant):
    for dep in dependant.dependencies:
        yield dep.call
        yield from _calls(dep)


def _admin_routes() -> dict[tuple[str, str], object]:
    """(method, path) -> dependant, for every route behind an admin guard."""
    found: dict[tuple[str, str], object] = {}
    for route in app.routes:
        dependant = getattr(route, "dependant", None)
        if dependant is None or not any(call in _ADMIN_GUARDS for call in _calls(dependant)):
            continue
        for method in sorted(getattr(route, "methods", None) or ()):
            if method not in {"HEAD", "OPTIONS"}:
                found[(method, route.path)] = dependant
    return found


def _audit_deps(dependant) -> list:
    return [dep.call for dep in dependant.dependencies if hasattr(dep.call, "audit_action")]


def _must_audit() -> dict[tuple[str, str], object]:
    return {
        key: dependant
        for key, dependant in _admin_routes().items()
        if key[0] in _MUTATING or key in _AUDITED_READS
    }


# ── 1. Structural ────────────────────────────────────────────────────────────


@pytest.mark.no_db
def test_the_route_walk_finds_the_mutating_admin_routes():
    """Everything below is vacuous if this finds nothing. 16 on 2026-11-01, and
    20 once L9 added its four support actions (2026-11-04); the same set
    tests/test_admin_elevation.py classifies."""
    mutating = [key for key in _admin_routes() if key[0] in _MUTATING]
    assert len(mutating) == 20, sorted(mutating)
    assert _AUDITED_READS <= set(_admin_routes())


@pytest.mark.no_db
def test_every_mutating_admin_route_and_personal_read_is_audited_exactly_once():
    offenders = {key: len(_audit_deps(dep)) for key, dep in _must_audit().items() if len(_audit_deps(dep)) != 1}
    assert not offenders, (
        "each of these must take exactly one `audit: Annotated[AuditEntry, audited(...)]` "
        f"parameter (route -> how many it has): {offenders}"
    )


@pytest.mark.no_db
def test_the_audit_dependency_resolves_before_the_elevation_guard():
    """Resolution follows the signature. An elevation refusal raised before the
    audit dependency is entered would never reach it, so it would go unrecorded."""
    late = []
    for key, dependant in _must_audit().items():
        calls = [dep.call for dep in dependant.dependencies]
        audit_at = next(i for i, call in enumerate(calls) if hasattr(call, "audit_action"))
        if get_elevated_admin_user in calls and calls.index(get_elevated_admin_user) < audit_at:
            late.append(key)
    assert not late, f"put the audit parameter first in these handlers: {late}"


@pytest.mark.no_db
def test_the_routes_that_need_a_reason_say_so():
    declared = {key for key, dep in _must_audit().items() if _audit_deps(dep)[0].reason_required}
    assert declared == _REASON_REQUIRED, (
        f"missing: {sorted(_REASON_REQUIRED - declared)}; unexpected: {sorted(declared - _REASON_REQUIRED)}"
    )


@pytest.mark.no_db
def test_only_the_mfa_set_up_routes_audit_before_mfa():
    early = {key for key, dep in _must_audit().items() if _audit_deps(dep)[0].before_mfa}
    assert early == _BEFORE_MFA


@pytest.mark.no_db
def test_no_route_module_writes_audit_rows_itself():
    """A direct call beside the dependency would write a second row, or, alone,
    a row only on the success path. Services may still call it (the env seed)."""
    offenders = []
    for path in sorted((REPO / "app" / "api").rglob("*.py")):
        tree = ast.parse(path.read_text(encoding="utf-8"))
        for node in ast.walk(tree):
            if isinstance(node, ast.Name) and node.id == "log_admin_action":
                offenders.append(f"{path.relative_to(REPO).as_posix()}:{node.lineno}")
    assert not offenders, offenders


# ── Fixtures ─────────────────────────────────────────────────────────────────


def _make_owner() -> User:
    user_id = uuid4()
    email = f"owner-{uuid4().hex}@example.invalid"
    with SessionLocal() as session, session.begin():
        session.add(
            User(user_id=user_id, email=email, is_admin=True, admin_role="owner", email_verified_at=datetime.now(UTC))
        )
        session.flush()
        session.add(AdminMfaCredential(user_id=user_id, totp_secret=_SECRET, confirmed_at=datetime.now(UTC)))
    return User(user_id=user_id, email=email, is_admin=True, admin_role="owner", token_version=0)


@pytest.fixture()
def owner(raw_client):
    stub = _make_owner()
    app.dependency_overrides[get_current_user] = lambda: stub
    yield stub
    app.dependency_overrides.pop(get_current_user, None)


def _elevated(user: User) -> dict[str, str]:
    token, _ = create_admin_elevation_token(user)
    return {ADMIN_ELEVATION_HEADER: token, "User-Agent": "audit-test/1.0"}


def _rows_by(user_id: UUID) -> list[AdminAuditLog]:
    with SessionLocal() as session:
        return (
            session.query(AdminAuditLog)
            .filter(AdminAuditLog.actor_user_id == user_id)
            .order_by(AdminAuditLog.created_at)
            .all()
        )


def _fill(path: str) -> str:
    return (
        path.replace("{user_id}", str(uuid4()))
        .replace("{owner_user_id}", str(uuid4()))
        .replace("{feedback_id}", str(uuid4()))
        .replace("{change_id}", str(uuid4()))
        .replace("{flag_name}", "maintenance_mode")
        .replace("{job_id}", "synthetic_job")
        .replace("{entitlement_id}", str(uuid4()))
    )


def _make_user() -> str:
    user_id = uuid4()
    with SessionLocal() as session, session.begin():
        session.add(User(user_id=user_id, email=f"target-{uuid4().hex}@example.invalid"))
    return str(user_id)


# ── 2. Coverage: one row per request, naming the actor ───────────────────────


def test_every_mutating_admin_route_writes_one_row_naming_the_actor(raw_client, owner):
    routes = sorted(key for key in _must_audit() if key[0] in _MUTATING)
    assert len(routes) == 20
    missing, wrong = {}, {}
    for method, path in routes:
        before = len(_rows_by(owner.user_id))
        response = raw_client.request(method, _fill(path), json={}, headers=_elevated(owner))
        rows = _rows_by(owner.user_id)[before:]
        if len(rows) != 1:
            missing[(method, path)] = (response.status_code, len(rows))
            continue
        row = rows[0]
        if row.actor_role != "owner" or row.actor_email != owner.email or not row.ip_address:
            wrong[(method, path)] = (row.actor_role, row.actor_email, row.ip_address)
    assert not missing, f"route -> (status, rows written), expected exactly one row: {missing}"
    assert not wrong, f"rows that do not name the actor fully: {wrong}"


# ── 3. Outcome and reason ────────────────────────────────────────────────────


def test_a_success_records_actor_reason_target_and_agent(raw_client, owner):
    target = _make_user()
    response = raw_client.patch(
        f"/api/v1/admin/users/{target}/suspend",
        json={"suspend": True, "reason": "synthetic abuse report"},
        headers=_elevated(owner),
    )
    assert response.status_code == 200, response.text
    (row,) = _rows_by(owner.user_id)
    assert (row.action, row.outcome, row.target_type, row.target_id) == ("suspend_user", "success", "user", target)
    assert row.reason == "synthetic abuse report"
    assert row.user_agent == "audit-test/1.0"


def test_reinstating_is_its_own_action_and_needs_a_reason_too(raw_client, owner):
    target = _make_user()
    refused = raw_client.patch(f"/api/v1/admin/users/{target}/suspend", json={"suspend": False}, headers=_elevated(owner))
    assert refused.status_code == 422
    done = raw_client.patch(
        f"/api/v1/admin/users/{target}/suspend",
        json={"suspend": False, "reason": "appeal upheld"},
        headers=_elevated(owner),
    )
    assert done.status_code == 200, done.text
    assert [(r.action, r.outcome) for r in _rows_by(owner.user_id)] == [
        ("reinstate_user", "refused"),
        ("reinstate_user", "success"),
    ]


_NO_REASON_BODIES = {
    ("PUT", "/api/v1/admin/users/{user_id}/role"): {"role": "support", "reason": ""},
    ("PATCH", "/api/v1/admin/users/{user_id}/suspend"): {"suspend": True},
    ("PATCH", "/api/v1/admin/flags/{flag_name}"): {"value": True},
    ("POST", "/api/v1/admin/flags/changes/{change_id}/rollback"): {"reason": " "},
    ("POST", "/api/v1/admin/users/{user_id}/reset-link"): {},
    ("POST", "/api/v1/admin/users/{user_id}/force-logout"): {},
    ("POST", "/api/v1/admin/users/{user_id}/entitlements"): {"days": 7},
    ("POST", "/api/v1/admin/users/{user_id}/entitlements/{entitlement_id}/revoke"): {"reason": " "},
}


def test_each_reason_required_route_refuses_and_records_a_missing_reason(raw_client, owner):
    """Bodies are otherwise valid, so the 422 is the reason check and not body
    validation; the detail proves which one answered."""
    let_through = {}
    for method, path in sorted(_REASON_REQUIRED):
        before = len(_rows_by(owner.user_id))
        response = raw_client.request(
            method, _fill(path), json=_NO_REASON_BODIES.get((method, path)), headers=_elevated(owner)
        )
        rows = _rows_by(owner.user_id)[before:]
        if response.status_code != 422 or response.json().get("detail") != "A reason is required.":
            let_through[(method, path)] = (response.status_code, response.text[:120])
        elif [r.outcome for r in rows] != ["refused"] or rows[0].details["error"]["status"] != 422:
            let_through[(method, path)] = "refusal not recorded"
    assert not let_through, let_through


def test_a_destructive_job_needs_a_reason_and_a_recompute_does_not(raw_client, owner):
    no_reason = raw_client.post("/api/v1/admin/jobs/journal_purge/trigger", headers=_elevated(owner))
    assert no_reason.status_code == 422
    with_reason = raw_client.post(
        "/api/v1/admin/jobs/journal_purge/trigger", params={"reason": "retention sweep"}, headers=_elevated(owner)
    )
    assert with_reason.status_code == 200, with_reason.text
    rows = _rows_by(owner.user_id)
    assert [(r.action, r.outcome) for r in rows] == [("trigger_job", "refused"), ("trigger_job", "success")]
    assert rows[1].reason == "retention sweep" and rows[1].details["destructive"] is True


def test_a_crash_is_recorded_as_an_error(raw_client, owner, monkeypatch):
    def _boom():
        raise RuntimeError("synthetic failure")

    monkeypatch.setattr(
        "app.api.admin.get_job",
        lambda job_id: {"job_id": job_id, "label": "x", "description": "x", "fn": _boom},
    )
    response = raw_client.post("/api/v1/admin/jobs/synthetic/trigger", headers=_elevated(owner))
    assert response.status_code == 500
    (row,) = _rows_by(owner.user_id)
    assert row.outcome == "error" and row.details["error"]["status"] == 500


def test_the_tokenless_elevation_prompt_is_not_recorded_but_a_bad_token_is(raw_client, owner):
    """The console's first try carries no token and is the normal prompt flow.
    A token that fails is an attempt, and is recorded."""
    url = "/api/v1/admin/flags/maintenance_mode/reset?reason=synthetic"
    assert raw_client.delete(url).status_code == 403
    assert _rows_by(owner.user_id) == []

    assert raw_client.delete(url, headers={ADMIN_ELEVATION_HEADER: "not-a-token"}).status_code == 403
    (row,) = _rows_by(owner.user_id)
    assert (row.action, row.outcome) == ("reset_flag", "refused")


def test_opening_a_user_record_is_audited(raw_client, owner):
    target = _make_user()
    assert raw_client.get(f"/api/v1/admin/users/{target}").status_code == 200
    (row,) = _rows_by(owner.user_id)
    assert (row.action, row.target_id, row.outcome) == ("view_user", target, "success")


def test_a_wrong_elevation_code_is_recorded_as_denied(raw_client, owner):
    response = raw_client.post("/api/v1/admin/elevate", json={"code": "000000"})
    assert response.status_code == 403
    (row,) = _rows_by(owner.user_id)
    assert (row.action, row.outcome) == ("admin_elevation_denied", "refused")


# ── 4. Append-only at the database ───────────────────────────────────────────


def _one_row(**fields) -> UUID:
    actor = uuid4()
    with SessionLocal() as session, session.begin():
        session.add(User(user_id=actor, email=f"actor-{uuid4().hex}@example.invalid"))
    log_admin_action("synthetic_action", target_type="user", target_id=str(uuid4()), actor_user_id=actor,
                     actor_email="actor@example.invalid", **fields)
    with SessionLocal() as session:
        return session.query(AdminAuditLog.id).filter(AdminAuditLog.actor_user_id == actor).scalar()


def _execute(sql: str, row_id: UUID) -> None:
    with SessionLocal() as session, session.begin():
        session.execute(text(sql), {"id": row_id})


@pytest.mark.parametrize(
    "sql",
    [
        "UPDATE admin_audit_log SET action = 'something_else' WHERE id = :id",
        "UPDATE admin_audit_log SET outcome = 'refused' WHERE id = :id",
        "UPDATE admin_audit_log SET actor_email = 'someone-else@example.invalid' WHERE id = :id",
        "UPDATE admin_audit_log SET target_id = 'another-target' WHERE id = :id",
        "UPDATE admin_audit_log SET actor_user_id = gen_random_uuid() WHERE id = :id",
        "DELETE FROM admin_audit_log WHERE id = :id",
    ],
)
def test_the_app_connection_cannot_rewrite_or_delete_a_row(raw_client, sql):
    row_id = _one_row()
    with pytest.raises(DBAPIError, match="append-only"):
        _execute(sql, row_id)


def test_truncate_is_refused(raw_client):
    _one_row()
    with pytest.raises(DBAPIError, match="append-only"), SessionLocal() as session, session.begin():
        session.execute(text("TRUNCATE admin_audit_log"))


@pytest.mark.parametrize(
    "sql",
    [
        "UPDATE admin_audit_log SET target_id = 'erased:3f9a' WHERE id = :id",
        "UPDATE admin_audit_log SET actor_email = NULL WHERE id = :id",
        "UPDATE admin_audit_log SET actor_user_id = NULL WHERE id = :id",
    ],
)
def test_erasure_may_pseudonymise_the_target_and_drop_the_actor(raw_client, sql):
    """Spec L5: erasure pseudonymises old rows instead of deleting them, and
    deleting an admin's account nulls the FK (ON DELETE SET NULL)."""
    row_id = _one_row()
    _execute(sql, row_id)


def test_deleting_the_actor_account_still_works(raw_client):
    """The FK's SET NULL is an UPDATE the guard must allow, or no admin account
    could ever be deleted."""
    row_id = _one_row()
    with SessionLocal() as session:
        actor_id = session.get(AdminAuditLog, row_id).actor_user_id
    with SessionLocal() as session, session.begin():
        session.delete(session.get(User, actor_id))
    with SessionLocal() as session:
        assert session.get(AdminAuditLog, row_id).actor_user_id is None


# ── 5. The read API, and the migration's copy of the guard ───────────────────


def test_the_audit_log_filters_and_returns_the_new_columns(raw_client, owner):
    target = _make_user()
    raw_client.patch(
        f"/api/v1/admin/users/{target}/suspend", json={"suspend": True, "reason": "filter test"}, headers=_elevated(owner)
    )
    raw_client.patch(f"/api/v1/admin/users/{target}/suspend", json={"suspend": True}, headers=_elevated(owner))

    def _get(**params):
        response = raw_client.get("/api/v1/admin/audit-log", params=params)
        assert response.status_code == 200, response.text
        return response.json()

    mine = _get(actor=owner.email.split("@")[0])
    assert mine["total"] == 2
    entry = _get(actor=str(owner.user_id), outcome="success")["items"]
    assert len(entry) == 1
    assert entry[0]["actor_email"] == owner.email
    assert entry[0]["actor_role"] == "owner"
    assert entry[0]["reason"] == "filter test"
    assert entry[0]["outcome"] == "success"
    assert entry[0]["user_agent"] == "audit-test/1.0"
    assert _get(target_id=target, outcome="refused")["total"] == 1
    assert _get(action="suspend_user", target_type="user", target_id=target)["total"] == 2
    assert _get(target_id=target, since=(datetime.now(UTC) + timedelta(minutes=5)).isoformat())["total"] == 0
    assert raw_client.get("/api/v1/admin/audit-log", params={"outcome": "maybe"}).status_code == 422


@pytest.mark.no_db
def test_the_migration_installs_the_same_guard_as_the_model():
    """The model's copy builds the test DB (create_all); the migration's builds
    dev and production. Drift would mean CI tests a guard production lacks."""
    path = REPO / "migrations" / "versions" / "ab0f1a2b3c4d_admin_audit_log_l4.py"
    spec = importlib.util.spec_from_file_location("audit_l4_migration", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)  # type: ignore[union-attr]
    assert module._FUNCTION_SQL == audit_model.APPEND_ONLY_FUNCTION_SQL
    assert module._TRIGGERS_SQL == audit_model.APPEND_ONLY_TRIGGERS_SQL
