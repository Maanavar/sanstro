"""Being admin is authority to look. Destroying things needs a fresher proof (P1-4 step 2).

Steps 1, 3 and 4 of P1-4 moved admin authority onto the session, shut the
`X-Admin-Key` header off for browser origins, and made every privileged action
name its actor. All three answer "is this account allowed to do admin things".

None of them answers the question that matters once a session is stolen, an
extension is malicious, or a laptop is left open: **is the person issuing this
request still the person who owns the account?** A session is long-lived by
design, so on its own it cannot say. Elevation asks the account holder to prove
it again, with their password, and issues a token good for minutes.

Two halves, and the structural half is the one that lasts. The behavioural tests
prove elevation works on the five routes that have it today. The structural test
makes a *sixth* destructive route that forgets it a test failure rather than
something a reviewer has to notice — which is exactly how `muhurta.py` and
`share_card.py` shipped without an ownership guard (see
tests/test_chart_access_guard.py, the same shape of bug one layer down).
"""
from __future__ import annotations

import inspect
from uuid import uuid4

import bcrypt
import pytest
from fastapi.params import Depends as DependsParam

from app.core.auth import (
    ADMIN_ELEVATION_HEADER,
    TOKEN_TYPE_ACCESS,
    create_access_token,
    create_admin_elevation_token,
    get_admin_user,
    get_current_user,
    get_elevated_admin_user,
)
from app.db.session import SessionLocal
from app.main import app
from app.models.user import User

# A synthetic credential for a synthetic account. Never a real one.
ADMIN_PASSWORD = "synthetic-elevation-password-9f2c"  # noqa: S105 — test fixture value


# ── The structural half ──────────────────────────────────────────────────────
#
# EVERY MUTATING ROUTE BEHIND AN ADMIN GUARD MUST APPEAR IN EXACTLY ONE OF THESE
# TWO SETS. A new one fails `test_every_mutating_admin_route_declares_whether_it
# _needs_elevation` until a person decides which it is, because "destructive but
# nobody classified it" and "deliberately not destructive" are indistinguishable
# from the outside — and the first is a security hole while the second is fine.

_ELEVATION_REQUIRED: dict[tuple[str, str], str] = {
    ("DELETE", "/api/v1/admin/users/{owner_user_id}/data"):
        "GDPR erasure. Irreversible destruction of a real person's data.",
    ("PATCH", "/api/v1/admin/users/{user_id}/suspend"):
        "Locks a user out of their account.",
    ("POST", "/api/v1/admin/notify/broadcast"):
        "Sends a push to users. Outward-facing and unrecallable once sent.",
    ("PATCH", "/api/v1/admin/flags/{flag_name}"):
        "Changes production behaviour for everyone, instantly.",
    ("DELETE", "/api/v1/admin/flags/{flag_name}/reset"):
        "Same as setting a flag: moves production behaviour for everyone.",
}

_ELEVATION_NOT_REQUIRED: dict[tuple[str, str], str] = {
    ("POST", "/api/v1/admin/elevate"):
        "This IS the elevation endpoint. Requiring elevation to elevate is a "
        "deadlock — it is guarded by get_admin_user plus the password itself.",
    ("POST", "/api/v1/admin/jobs/{job_id}/trigger"):
        "No longer true of every job: `journal_purge` (P2-1) permanently deletes "
        "journal entries. Because which job runs is a path parameter, the gate "
        "cannot be a route dependency — the route still depends on "
        "get_admin_user, which is why this stays here — so trigger_job calls "
        "get_elevated_admin_user itself for any job flagged `destructive`. "
        "test_destructive_job_cannot_be_triggered_without_elevation is what "
        "actually holds that, and test_every_destructive_job_is_flagged is what "
        "stops the next destructive job from slipping through unflagged.",
    ("PATCH", "/api/v1/feedback/{feedback_id}/reward"):
        "Toggles an internal 'this reviewer may qualify for extended access' "
        "flag. Reversible, affects no user data, promises nothing to the user.",
    ("DELETE", "/api/v1/qa/regressions"):
        "Clears an in-memory QA regression store. No user data, no persistence.",
}

_MUTATING = {"POST", "PATCH", "PUT", "DELETE"}


def _admin_guarded_mutating_routes() -> dict[tuple[str, str], str]:
    """(method, path) -> "elevated" | "admin", read off the live app.

    Read from the app rather than a hand-kept list, which is the only way a route
    added tomorrow reaches this test. Keyed on the dependency *object*, not its
    name, so re-growing a local look-alike guard does not satisfy it.
    """
    found: dict[tuple[str, str], str] = {}
    for route in app.routes:
        endpoint = getattr(route, "endpoint", None)
        if endpoint is None:
            continue
        guard: str | None = None
        for parameter in inspect.signature(endpoint).parameters.values():
            default = parameter.default
            if not isinstance(default, DependsParam):
                continue
            if default.dependency is get_elevated_admin_user:
                guard = "elevated"
            elif default.dependency is get_admin_user and guard is None:
                guard = "admin"
        if guard is None:
            continue
        for method in sorted((getattr(route, "methods", None) or set()) & _MUTATING):
            found[(method, getattr(route, "path", ""))] = guard
    return found


def test_the_admin_route_enumeration_finds_routes():
    """Every assertion below is vacuous if this returns {}.

    The same lesson as EXPECTED_CHART_ID_ROUTES: an exact count, not a floor, so
    a partial drop fails instead of quietly shrinking what is checked.
    """
    found = _admin_guarded_mutating_routes()
    expected = len(_ELEVATION_REQUIRED) + len(_ELEVATION_NOT_REQUIRED)
    assert len(found) == expected, (
        f"enumerated {len(found)} mutating admin-guarded routes, expected {expected}. "
        "If you added or removed one, classify it in this file and update nothing "
        "else — the count is derived from the two registries."
    )


def test_every_mutating_admin_route_declares_whether_it_needs_elevation():
    """Route N+1 fails this until a person decides which set it belongs in."""
    found = set(_admin_guarded_mutating_routes())
    declared = set(_ELEVATION_REQUIRED) | set(_ELEVATION_NOT_REQUIRED)

    undeclared = found - declared
    assert not undeclared, (
        f"{sorted(undeclared)} are mutating routes behind an admin guard that do not "
        "say whether they need elevation. Add each to _ELEVATION_REQUIRED or to "
        "_ELEVATION_NOT_REQUIRED in this file, with a reason that is true."
    )

    stale = declared - found
    assert not stale, f"declared routes that no longer exist: {sorted(stale)}"

    overlap = set(_ELEVATION_REQUIRED) & set(_ELEVATION_NOT_REQUIRED)
    assert not overlap, f"routes declared both ways: {sorted(overlap)}"


def test_routes_declared_destructive_actually_use_the_elevated_guard():
    """A declaration nobody implements is worse than no declaration."""
    found = _admin_guarded_mutating_routes()
    wrong = {
        route: found[route]
        for route in _ELEVATION_REQUIRED
        if found.get(route) != "elevated"
    }
    assert not wrong, (
        f"{sorted(wrong)} are declared as needing elevation but do not depend on "
        "get_elevated_admin_user. The declaration is a comment; the dependency is "
        "the enforcement."
    )


# ── The behavioural half ─────────────────────────────────────────────────────


@pytest.fixture()
def admin_user_row(raw_client):
    """A real admin row with a known password, plus a detached-safe stub of it.

    Depends on `raw_client` even though it never uses it. That fixture is what
    calls `_reset_db()`, and this one INSERTs, so the edge is real and declaring
    it makes the ordering a fact rather than a property of where each name
    happens to sit in a test's argument list. Belt and braces, not a bug fix:
    pytest already resolved it correctly here (`--setup-show` confirms
    `raw_client` then `admin_user_row`), and the `relation "users" does not
    exist` failures that prompted the check turned out to be a second pytest
    process running against the same database and dropping its schema. Recorded
    so nobody later reads this edge as evidence of an ordering bug that was
    never real.

    The stub is built from plain values rather than reusing the persisted
    instance: that one is detached once its session closes, and touching an
    attribute on it raises.
    """
    user_id = uuid4()
    email = f"admin-{uuid4().hex}@example.invalid"
    hashed = bcrypt.hashpw(ADMIN_PASSWORD.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    with SessionLocal() as session, session.begin():
        session.add(User(user_id=user_id, email=email, is_admin=True, hashed_password=hashed))
    return User(
        user_id=user_id,
        email=email,
        is_admin=True,
        hashed_password=hashed,
        token_version=0,
    )


@pytest.fixture()
def admin_client(raw_client, admin_user_row):
    app.dependency_overrides[get_current_user] = lambda: admin_user_row
    yield raw_client
    app.dependency_overrides.pop(get_current_user, None)


def _elevate(client, password: str = ADMIN_PASSWORD):
    return client.post("/api/v1/admin/elevate", json={"password": password})


# A destructive route that is cheap to call and whose *authorisation* answer is
# what we are testing. A non-existent flag name is fine: if elevation is missing
# the request must die at the guard, before the handler ever looks at the name.
_DESTRUCTIVE_CALL = ("PATCH", "/api/v1/admin/flags/vinaadi_test_synthetic_flag", {"value": True})


def _call_destructive(client, headers=None):
    method, url, body = _DESTRUCTIVE_CALL
    return client.request(method, url, json=body, headers=headers or {})


def test_a_destructive_route_refuses_an_admin_who_has_not_elevated(admin_client):
    """The whole point: a valid admin session is not enough on its own."""
    response = _call_destructive(admin_client)
    assert response.status_code == 403
    assert "elevation" in response.json()["detail"].lower()


def test_elevation_with_the_right_password_opens_the_destructive_route(admin_client):
    granted = _elevate(admin_client)
    assert granted.status_code == 200, granted.text
    token = granted.json()["token"]

    response = _call_destructive(admin_client, {ADMIN_ELEVATION_HEADER: token})
    assert response.status_code != 403, response.text


def test_elevation_is_refused_when_the_password_is_wrong(admin_client):
    response = _elevate(admin_client, "not-the-password")
    assert response.status_code == 403
    assert "token" not in response.json()


def test_an_ordinary_access_token_is_not_an_elevation_token(admin_client, admin_user_row):
    """Otherwise 'elevation' would be satisfied by the very session it exists to
    be independent of — the session is what we assume is stolen."""
    session_token = create_access_token(
        str(admin_user_row.user_id),
        token_type=TOKEN_TYPE_ACCESS,
        token_version=0,
    )
    response = _call_destructive(admin_client, {ADMIN_ELEVATION_HEADER: session_token})
    assert response.status_code == 403


def test_one_admins_elevation_does_not_authorise_another_admins_request(admin_client):
    """Admin is not a shared capability. An elevation names one user."""
    other = User(user_id=uuid4(), email="other@example.invalid", is_admin=True, token_version=0)
    other_token, _ = create_admin_elevation_token(other)

    response = _call_destructive(admin_client, {ADMIN_ELEVATION_HEADER: other_token})
    assert response.status_code == 403


def test_bumping_token_version_revokes_a_live_elevation(admin_client, admin_user_row):
    """token_version is the existing 'log everyone out' lever — password change,
    suspension, forced logout. If it did not also kill elevations, revoking a
    compromised session would leave its elevation usable for the rest of the
    window, which is the worst few minutes to hand an attacker.
    """
    granted = _elevate(admin_client)
    assert granted.status_code == 200, granted.text
    token = granted.json()["token"]

    admin_user_row.token_version = 1

    response = _call_destructive(admin_client, {ADMIN_ELEVATION_HEADER: token})
    assert response.status_code == 403


def test_a_server_to_server_key_caller_does_not_need_elevation(raw_client, monkeypatch):
    """Machines have no password, so requiring one would close these routes to
    automation entirely — `/admin/elevate` refuses an account with no
    `hashed_password`, which every key caller is.

    Scoping, not a hole: elevation defends against a *browser session* used by
    someone who is not the account holder. A process holding a deployment secret
    is not that actor, and the test below pins that the key still cannot be used
    from a browser. The residual risk (key holder acts unnamed) is P1-4 step 3's
    known trade-off and is unchanged by elevation existing.
    """
    from app.core.config import get_settings

    key = "synthetic-server-to-server-key"  # noqa: S105 — test fixture value
    monkeypatch.setattr(get_settings(), "admin_api_key", key, raising=False)

    user_id = uuid4()
    with SessionLocal() as session, session.begin():
        session.add(User(user_id=user_id, email=f"svc-{uuid4().hex}@example.invalid"))

    method, url, body = _DESTRUCTIVE_CALL
    response = raw_client.request(
        method,
        url,
        json=body,
        headers={
            "Authorization": f"Bearer {create_access_token(subject=str(user_id))}",
            "X-Admin-Key": key,
        },
    )
    assert response.status_code != 403, response.text


@pytest.mark.parametrize("browser_header", ["origin", "referer"])
def test_the_key_still_cannot_reach_a_destructive_route_from_a_browser(
    raw_client, monkeypatch, browser_header
):
    """The bypass above must not become a way to spend a stolen key from a page.

    `Origin` and `Referer` are set by the browser itself and cannot be forged by
    page JavaScript, so their presence is reliable in the direction that matters.
    """
    from app.core.config import get_settings

    key = "synthetic-server-to-server-key"  # noqa: S105 — test fixture value
    monkeypatch.setattr(get_settings(), "admin_api_key", key, raising=False)

    user_id = uuid4()
    with SessionLocal() as session, session.begin():
        session.add(User(user_id=user_id, email=f"svc-{uuid4().hex}@example.invalid"))

    method, url, body = _DESTRUCTIVE_CALL
    response = raw_client.request(
        method,
        url,
        json=body,
        headers={
            "Authorization": f"Bearer {create_access_token(subject=str(user_id))}",
            "X-Admin-Key": key,
            browser_header: "https://vinaadi.example",
        },
    )
    assert response.status_code == 403


def test_an_admin_with_no_password_is_refused_rather_than_waved_through(admin_client, admin_user_row):
    """An OAuth admin has no password to re-enter, so there is no second proof
    available. Refusing is the fail-safe direction: the alternative is that the
    accounts hardest to re-verify are exactly the ones that skip verification.
    """
    admin_user_row.hashed_password = None

    response = _elevate(admin_client)
    assert response.status_code == 403
    assert "no password" in response.json()["detail"].lower()


# ── Destructive background jobs (P2-1) ───────────────────────────────────────
#
# `jobs/{job_id}/trigger` runs whichever job the path names, so the gate cannot
# be a route dependency the way the five destructive routes above have one. The
# route keeps `get_admin_user` and the handler calls `get_elevated_admin_user`
# itself when the job is flagged destructive. That means the structural test
# above cannot see this gate — these two tests are what hold it instead.

def test_every_destructive_job_is_flagged(admin_client):
    """Registration, not the endpoint: a job that deletes must say so.

    P1-4 step 2 left this endpoint unelevated on the explicit grounds that every
    scheduled job was an idempotent recompute, and pre-committed to revisiting it
    the moment one destroyed something. `journal_purge` is that job.
    """
    from app.scheduler import SCHEDULED_JOBS

    flagged = {job.id for job in SCHEDULED_JOBS if job.destructive}
    assert "journal_purge" in flagged, (
        "journal_purge permanently deletes journal entries and must be flagged "
        "destructive, or an admin session alone can trigger it."
    )


def test_a_recompute_job_still_needs_no_elevation(admin_client):
    """The flag must not quietly elevate everything — that would be a different
    change from the one intended, and a costlier one for operators."""
    response = admin_client.post("/api/v1/admin/jobs/panchangam_prewarm/trigger")

    assert response.status_code != 403, response.text


def test_destructive_job_cannot_be_triggered_without_elevation(admin_client):
    response = admin_client.post("/api/v1/admin/jobs/journal_purge/trigger")

    assert response.status_code == 403, response.text
    assert "elevation" in response.json()["detail"].lower()


def test_destructive_job_runs_once_elevated(admin_client):
    granted = _elevate(admin_client)
    assert granted.status_code == 200, granted.text

    response = admin_client.post(
        "/api/v1/admin/jobs/journal_purge/trigger",
        headers={ADMIN_ELEVATION_HEADER: granted.json()["token"]},
    )

    assert response.status_code == 200, response.text


def test_an_unknown_job_is_404_not_a_way_to_probe_elevation(admin_client):
    """404 before the elevation check would leak which job ids exist; 404 after
    it is fine. Either way an unregistered id must not run anything."""
    response = admin_client.post("/api/v1/admin/jobs/no_such_job/trigger")

    assert response.status_code == 404
