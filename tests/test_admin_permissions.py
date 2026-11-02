"""Who may call which admin route (admin spec L3 and §6).

Three layers, each closing a gap the one before cannot see:

1. Structural. Every admin route declares exactly one `require_permission`,
   read off the live app — so route N+1 fails here until someone decides who
   may call it. A route with no permission would answer every role.
2. The matrix. route × role → allow/deny, generated from the app and compared
   with a committed snapshot (tests/golden/admin_permission_matrix.json). A
   change to ROLE_PERMISSIONS or to a route's permission shows up as a diff a
   reviewer reads, instead of a silent widening.
3. Behavioural. A real support account, with real TOTP, against the real
   dependency chain (no `get_admin_role` override) is refused every owner-only
   route — so the snapshot cannot agree with itself while the server disagrees.

Also here: the two other L3 acceptance items — registering an address listed in
JOTHIDAM_ADMIN_EMAILS grants nothing, and the env seed makes an owner once and
only from a verified account.

BLIND SPOT (recorded per CLAUDE.md "a gate proves its own check"): layer 1 sees
permissions declared as dependencies. A handler that calls `role_has` itself and
branches is invisible to it, and so is a permission check that is declared but
whose dependency is overridden at runtime.
"""
from __future__ import annotations

import json
from datetime import UTC, datetime
from pathlib import Path
from uuid import uuid4

import pytest

from app.core import totp
from app.core.auth import (
    get_admin_user,
    get_admin_user_without_mfa,
    get_current_user,
    get_elevated_admin_user,
)
from app.core.config import get_settings
from app.core.permissions import ROLE_PERMISSIONS, ROLES, get_admin_role
from app.db.session import SessionLocal
from app.main import app
from app.models.admin_mfa import AdminMfaCredential
from app.models.user import User
from app.services.admin_roles_service import seed_owner_from_env

GOLDEN = Path(__file__).parent / "golden" / "admin_permission_matrix.json"

_ADMIN_GUARDS = {get_admin_user, get_admin_user_without_mfa, get_elevated_admin_user, get_admin_role}

#: Admin routes every role may call, so they declare no permission. Each is about
#: the caller's own admin identity, not about anyone else's data.
_SELF_SERVICE: dict[tuple[str, str], str] = {
    ("POST", "/api/v1/admin/elevate"): "Proving your own second factor.",
    ("GET", "/api/v1/admin/me"): "Your own role and MFA state; answers before MFA so the console can offer set-up.",
    ("POST", "/api/v1/admin/mfa/enroll"): "Setting up your own second factor.",
    ("POST", "/api/v1/admin/mfa/confirm"): "Finishing your own set-up.",
    ("POST", "/api/v1/admin/mfa/recovery-codes"): "Replacing your own recovery codes (elevated).",
}

#: The only routes that may skip the TOTP requirement. Without them an admin
#: could never reach the route that satisfies it; with more, the requirement leaks.
_WITHOUT_MFA = {
    ("GET", "/api/v1/admin/me"),
    ("POST", "/api/v1/admin/mfa/enroll"),
    ("POST", "/api/v1/admin/mfa/confirm"),
}

_SECRET = "JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP"  # noqa: S105 — synthetic test value


def _calls(dependant):
    for dep in dependant.dependencies:
        yield dep.call
        yield from _calls(dep)


def _admin_routes() -> dict[tuple[str, str], list]:
    """(method, path) -> every dependency callable, for routes behind an admin guard."""
    found: dict[tuple[str, str], list] = {}
    for route in app.routes:
        dependant = getattr(route, "dependant", None)
        if dependant is None:
            continue
        calls = list(_calls(dependant))
        if not any(call in _ADMIN_GUARDS for call in calls):
            continue
        for method in sorted(getattr(route, "methods", None) or ()):
            if method in {"HEAD", "OPTIONS"}:
                continue
            found[(method, route.path)] = calls
    return found


def _permissions(calls: list) -> list[str]:
    # A dependency object reached twice (e.g. via two sub-dependencies) is one declaration.
    seen = {id(call): call for call in calls if hasattr(call, "required_permission")}
    return sorted(call.required_permission for call in seen.values())


def _matrix() -> dict[str, dict]:
    matrix: dict[str, dict] = {}
    for (method, path), calls in sorted(_admin_routes().items()):
        perms = _permissions(calls)
        if not perms:
            continue
        (permission,) = perms
        matrix[f"{method} {path}"] = {
            "permission": permission,
            "allowed": sorted(role for role in ROLES if permission in ROLE_PERMISSIONS[role]),
        }
    return matrix


# ── 1. Structural ────────────────────────────────────────────────────────────


@pytest.mark.no_db
def test_the_route_walk_finds_the_admin_routes():
    """Everything below is vacuous if this finds nothing."""
    routes = _admin_routes()
    # 35 on 2026-11-01 (30 in the matrix + 5 self-service). A floor, not an
    # exact count: the snapshot below already pins the exact set.
    assert len(routes) >= 35, f"found only {len(routes)} admin routes"
    assert ("GET", "/api/v1/admin/stats") in routes
    assert ("GET", "/api/v1/admin/analytics/daily") in routes
    assert ("GET", "/api/v1/feedback") in routes
    assert ("DELETE", "/api/v1/qa/regressions") in routes


@pytest.mark.no_db
def test_every_admin_route_declares_exactly_one_permission():
    offenders = {}
    for key, calls in _admin_routes().items():
        perms = _permissions(calls)
        if key in _SELF_SERVICE:
            if perms:
                offenders[key] = f"listed as self-service but declares {perms}"
            continue
        if len(perms) != 1:
            offenders[key] = perms
    assert not offenders, (
        "admin routes must declare exactly one "
        "`dependencies=[Depends(require_permission(...))]` (or be listed in "
        f"_SELF_SERVICE with a reason): {offenders}"
    )
    stale = set(_SELF_SERVICE) - set(_admin_routes())
    assert not stale, f"_SELF_SERVICE names routes that no longer exist: {sorted(stale)}"


@pytest.mark.no_db
def test_only_me_and_mfa_setup_skip_the_totp_requirement():
    users = {key for key, calls in _admin_routes().items() if get_admin_user_without_mfa in calls}
    assert users == _WITHOUT_MFA


# ── 2. The matrix against its snapshot ───────────────────────────────────────


@pytest.mark.no_db
def test_permission_matrix_matches_the_committed_snapshot():
    generated = _matrix()
    rendered = json.dumps(generated, indent=2, sort_keys=True) + "\n"
    assert GOLDEN.exists(), (
        f"{GOLDEN} is missing. The test container mounts the repo read-only, so "
        "copy the generated matrix below into it, review it, and commit it:\n" + rendered
    )
    committed = json.loads(GOLDEN.read_text(encoding="utf-8"))
    if committed != generated:
        changed = sorted(
            key for key in set(committed) | set(generated) if committed.get(key) != generated.get(key)
        )
        raise AssertionError(
            f"admin permission matrix changed for {changed}. If the change is intended, "
            f"replace {GOLDEN.name} with the generated matrix below:\n" + rendered
        )


@pytest.mark.no_db
def test_support_holds_no_owner_only_permission_from_spec_section_6():
    owner_only = {
        "entitlements.revoke",
        "users.suspend",
        "privacy.export",
        "privacy.erase",
        "audit.read",
        "audit.export",
        "flags.write",
        "jobs.trigger",
        "roles.grant",
        "ask.review",
    }
    assert not owner_only & ROLE_PERMISSIONS["support"]
    assert owner_only <= ROLE_PERMISSIONS["owner"]


# ── 3. Behavioural: a real support account ───────────────────────────────────


def _make_admin(role: str) -> User:
    user_id = uuid4()
    with SessionLocal() as session, session.begin():
        session.add(
            User(
                user_id=user_id,
                email=f"{role}-{uuid4().hex}@example.invalid",
                is_admin=True,
                admin_role=role,
                email_verified_at=datetime.now(UTC),
            )
        )
        session.flush()
        session.add(AdminMfaCredential(user_id=user_id, totp_secret=_SECRET, confirmed_at=datetime.now(UTC)))
    return User(user_id=user_id, email="x@example.invalid", is_admin=True, admin_role=role, token_version=0)


@pytest.fixture()
def as_role(raw_client):
    """`raw_client` acting as a fresh admin of the given role. Only the session
    is stubbed; the role, MFA and permission checks are all real."""

    def _use(role: str):
        stub = _make_admin(role)
        app.dependency_overrides[get_current_user] = lambda: stub
        return raw_client

    yield _use
    app.dependency_overrides.pop(get_current_user, None)


def _fill(path: str) -> str:
    return (
        path.replace("{user_id}", str(uuid4()))
        .replace("{owner_user_id}", str(uuid4()))
        .replace("{feedback_id}", str(uuid4()))
        .replace("{change_id}", str(uuid4()))
        .replace("{flag_name}", "maintenance_mode")
        .replace("{job_id}", "synthetic_job")
    )


def _owner_only_routes() -> list[tuple[str, str]]:
    return sorted(
        tuple(key.split(" ", 1))  # type: ignore[misc]
        for key, row in _matrix().items()
        if "owner" in row["allowed"] and "support" not in row["allowed"]
    )


def test_support_is_refused_every_owner_only_route(as_role):
    client = as_role("support")
    routes = _owner_only_routes()
    assert len(routes) >= 10, routes
    allowed_through = {}
    for method, path in routes:
        response = client.request(method, _fill(path), json={})
        if response.status_code != 403:
            allowed_through[(method, path)] = response.status_code
    assert not allowed_through, f"support reached owner-only routes: {allowed_through}"


def test_support_is_told_which_permission_it_lacks(as_role):
    response = as_role("support").get("/api/v1/admin/audit-log")
    assert response.status_code == 403
    assert "audit.read" in response.json()["detail"]


def test_support_can_use_the_support_routes(as_role):
    client = as_role("support")
    assert client.get("/api/v1/admin/stats").status_code == 200
    assert client.get("/api/v1/admin/users").status_code == 200
    me = client.get("/api/v1/admin/me").json()
    assert me["role"] == "support"
    assert "audit.read" not in me["permissions"]


def test_an_owner_passes_the_same_gate(as_role):
    """The refusals above are about the role, not a broken chain."""
    assert as_role("owner").get("/api/v1/admin/audit-log").status_code == 200


# ── JOTHIDAM_ADMIN_EMAILS grants nothing at request time ─────────────────────


def test_registering_a_listed_admin_email_grants_nothing(raw_client, monkeypatch):
    email = f"listed-{uuid4().hex}@example.invalid"
    monkeypatch.setattr(get_settings(), "admin_emails", email)
    assert raw_client.post(
        "/api/v1/auth/register", json={"email": email, "password": "password123", "consentGiven": True, "adultConfirmed": True}
    ).status_code == 200
    assert raw_client.post("/api/v1/auth/login", json={"email": email, "password": "password123"}).status_code == 200

    assert raw_client.get("/api/v1/admin/me").status_code == 403
    assert raw_client.get("/api/v1/admin/stats").status_code == 403
    with SessionLocal() as session:
        row = session.query(User).filter(User.email == email).one()
        assert row.admin_role is None
        assert row.is_admin is not True


# ── The one-time owner seed ──────────────────────────────────────────────────


def _add_user(email: str, *, verified: bool) -> None:
    with SessionLocal() as session, session.begin():
        session.add(
            User(
                user_id=uuid4(),
                email=email,
                email_verified_at=datetime.now(UTC) if verified else None,
            )
        )


def _role_of(email: str) -> str | None:
    with SessionLocal() as session:
        return session.query(User).filter(User.email == email).one().admin_role


def test_seed_skips_an_unverified_account_outside_development(raw_client, monkeypatch):
    email = f"seed-{uuid4().hex}@example.invalid"
    _add_user(email, verified=False)
    monkeypatch.setattr(get_settings(), "admin_emails", email)
    monkeypatch.setattr(get_settings(), "environment", "production")
    with SessionLocal() as session, session.begin():
        assert seed_owner_from_env(session) is None
    assert _role_of(email) is None


def test_seed_makes_a_verified_account_owner_once_and_then_does_nothing(raw_client, monkeypatch):
    first = f"seed-a-{uuid4().hex}@example.invalid"
    second = f"seed-b-{uuid4().hex}@example.invalid"
    _add_user(first, verified=True)
    monkeypatch.setattr(get_settings(), "admin_emails", first)
    monkeypatch.setattr(get_settings(), "environment", "production")
    with SessionLocal() as session, session.begin():
        assert seed_owner_from_env(session) is not None
    assert _role_of(first) == "owner"

    # An owner now exists: listing another verified address changes nothing.
    _add_user(second, verified=True)
    monkeypatch.setattr(get_settings(), "admin_emails", f"{first},{second}")
    with SessionLocal() as session, session.begin():
        assert seed_owner_from_env(session) is None
    assert _role_of(second) is None


def test_seed_ignores_a_listed_address_with_no_account(raw_client, monkeypatch):
    monkeypatch.setattr(get_settings(), "admin_emails", f"nobody-{uuid4().hex}@example.invalid")
    with SessionLocal() as session, session.begin():
        assert seed_owner_from_env(session) is None


@pytest.mark.no_db
def test_totp_matches_the_rfc_6238_sha1_vector():
    """RFC 6238 Appendix B, T=59s, SHA-1, secret "12345678901234567890":
    94287082 at 8 digits, so 287082 at our 6."""
    import base64

    secret = base64.b32encode(b"12345678901234567890").decode("ascii")
    assert totp.code_at_step(secret, totp.current_step(59)) == "287082"
