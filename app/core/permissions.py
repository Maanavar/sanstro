"""Admin roles and permissions (admin spec L3 and §6).

Every admin route declares exactly one permission with
`dependencies=[Depends(require_permission("..."))]`. The route keeps its
`get_admin_user` / `get_elevated_admin_user` parameter: that is the
authentication and step-up gate, this is the authorisation one.
tests/test_admin_permissions.py fails on an admin route that declares no
permission, and pins the whole route × role matrix to a committed snapshot.

At launch only `owner` and `support` are assigned (D-14). The other four are
defined so granting one later is a data change, not a code change.
"""
from __future__ import annotations

from collections.abc import Callable

from fastapi import Depends, HTTPException, Request, status

from app.core.auth import ADMIN_ROLES, admin_role_of, get_admin_user
from app.models.user import User

ROLES: tuple[str, ...] = ADMIN_ROLES

_SUPPORT = frozenset(
    {
        "overview.read",
        "users.search",
        "users.read_masked",
        "users.reveal_birth_data",
        "users.reset_link",
        "users.force_logout",
        "users.note",
        "entitlements.grant",
        "payments.read",
        "privacy.requests.read",
        "feedback.review",
        "flags.read",
    }
)

ROLE_PERMISSIONS: dict[str, frozenset[str]] = {
    "owner": _SUPPORT
    | {
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
        "qa.read",
        "qa.write",
        "messaging.broadcast",
    },
    "support": _SUPPORT,
    "ops": frozenset({"overview.read", "flags.read", "jobs.trigger", "payments.read"}),
    "privacy": frozenset(
        {
            "overview.read",
            "users.search",
            "users.read_masked",
            "privacy.requests.read",
            "privacy.export",
            "audit.read",
        }
    ),
    "viewer": frozenset({"overview.read"}),
    "astrologer": frozenset({"overview.read", "ask.review", "qa.read"}),
}

if set(ROLE_PERMISSIONS) != set(ROLES):  # pragma: no cover - import-time contract
    raise RuntimeError("ROLE_PERMISSIONS must define exactly the roles in ADMIN_ROLES")

#: Every permission any role can hold; `require_permission` refuses others at import.
PERMISSIONS: frozenset[str] = frozenset().union(*ROLE_PERMISSIONS.values())

#: Support may grant courtesy access for at most this long (spec §6).
SUPPORT_GRANT_MAX_DAYS = 30


def get_admin_role(request: Request, admin_user: User = Depends(get_admin_user)) -> str:
    """The acting role for this admin request.

    A server-to-server caller on the retained X-Admin-Key path names no person
    and holds no role; it keeps the owner-level access it always had (see
    `get_admin_user`). That is P1-4 step 3's recorded trade-off, not new.
    """
    if getattr(request.state, "admin_via_key", False):
        return "owner"
    role = admin_role_of(admin_user)
    if role is None:  # get_admin_user already refused non-admins; belt and braces
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required.")
    return role


def role_has(role: str, permission: str) -> bool:
    return permission in ROLE_PERMISSIONS.get(role, frozenset())


def require_permission(permission: str) -> Callable[..., None]:
    """Route dependency: 403 unless the acting admin's role holds `permission`."""
    if permission not in PERMISSIONS:
        raise ValueError(f"{permission!r} is not a defined permission")

    def _dependency(role: str = Depends(get_admin_role)) -> None:
        if not role_has(role, permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Your admin role ({role}) does not include {permission}.",
            )

    _dependency.required_permission = permission  # type: ignore[attr-defined]
    return _dependency
