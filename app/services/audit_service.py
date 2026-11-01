"""The admin audit log: the one writer, and the route dependency (spec L4).

Every mutating admin route, and every console read of a person's data, takes
`audit: AuditEntry = audited("<action>", ...)` as its FIRST parameter. The
dependency writes exactly one row per request, whatever happens:

- success — the handler returned and its session committed;
- refused — an HTTPException below 500 (elevation, 404, 409, a missing reason)
  or a request that failed validation;
- error   — a 5xx or an unhandled exception.

The handler fills in what only it knows (target id, details, the reason) on the
entry it receives. Routes never call `log_admin_action` themselves, so a route
cannot forget to audit, or audit twice; tests/test_admin_audit.py enforces both.

The dependency runs with `scope="function"`: its exit runs after the handler and
before the response is sent. It commits the handler's session first and writes
"success" only once that commit has worked, so the log never records a change
the database then lost (ARC-20). `get_db` alone commits after the response.

Rows go through their own session, so a refused or failed action is still
recorded after the handler's session rolls back.
"""
from __future__ import annotations

import logging
from collections.abc import Generator
from dataclasses import dataclass, field
from typing import Any
from uuid import UUID

from fastapi import Depends, HTTPException, Request, status
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from sqlalchemy.orm import Session
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.auth import (
    ADMIN_ELEVATION_HEADER,
    ADMIN_ELEVATION_REQUIRED_DETAIL,
    admin_role_of,
    get_admin_user,
    get_admin_user_without_mfa,
)
from app.core.config import get_settings
from app.db.session import SessionLocal, get_db
from app.middleware import resolve_client_ip
from app.models.admin_audit_log import AdminAuditLog
from app.models.user import User

logger = logging.getLogger(__name__)

OUTCOME_SUCCESS = "success"
OUTCOME_REFUSED = "refused"
OUTCOME_ERROR = "error"

#: actor_role for the retained X-Admin-Key path, which names no person.
SERVICE_KEY_ROLE = "service_key"

#: Shortest reason accepted where one is required. Matches the role and flag routes.
MIN_REASON_LENGTH = 3

_MAX_ERROR_TEXT = 300
_MAX_USER_AGENT = 512


def log_admin_action(
    action: str,
    target_type: str | None = None,
    target_id: str | None = None,
    payload_summary: str | None = None,
    ip_address: str | None = None,
    actor_user_id: UUID | None = None,
    *,
    actor_email: str | None = None,
    actor_role: str | None = None,
    reason: str | None = None,
    user_agent: str | None = None,
    outcome: str = OUTCOME_SUCCESS,
    details: dict[str, Any] | None = None,
) -> None:
    """Record one privileged action. Commits in its own session.

    Routes do not call this: they take `audited(...)`, which calls it. It stays
    public for the callers that are not a request — the one-time owner seed —
    and for tests. `actor_user_id` stays optional only because those callers
    have no user to name, never because a call site did not bother.
    """
    with SessionLocal() as session:
        session.add(
            AdminAuditLog(
                action=action,
                target_type=target_type,
                target_id=target_id,
                payload_summary=payload_summary,
                ip_address=ip_address,
                actor_user_id=actor_user_id,
                actor_email=actor_email,
                actor_role=actor_role,
                reason=reason,
                user_agent=user_agent,
                outcome=outcome,
                details=jsonable_encoder(details) if details else None,
            )
        )
        session.commit()


@dataclass
class AuditEntry:
    """What the handler knows about its own action. Written when the request ends."""

    action: str
    target_type: str | None = None
    target_id: str | None = None
    reason: str | None = None
    details: dict[str, Any] = field(default_factory=dict)

    def require_reason(self, raw: str | None) -> str:
        """The cleaned reason, recorded on the entry; 422 when it is missing.

        Call it before the handler changes or even looks anything up, so a
        request without a reason is refused the same way for every target.
        """
        cleaned = (raw or "").strip()
        if len(cleaned) < MIN_REASON_LENGTH:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="A reason is required.")
        self.reason = cleaned
        return cleaned

    def note_reason(self, raw: str | None) -> None:
        """Record an optional reason as given, without requiring one."""
        cleaned = (raw or "").strip()
        self.reason = cleaned or None


def _is_elevation_prompt(request: Request, exc: StarletteHTTPException) -> bool:
    """The console's first try at a destructive route, before it asks for a code.

    Not recorded: it carries no elevation token, so it is the normal prompt
    flow, not an attempt, and logging it would put a refused row before every
    real action. A request that sends a token which fails is still recorded.
    """
    return (
        exc.status_code == status.HTTP_403_FORBIDDEN
        and exc.detail == ADMIN_ELEVATION_REQUIRED_DETAIL
        and not request.headers.get(ADMIN_ELEVATION_HEADER)
    )


def _write(
    entry: AuditEntry,
    request: Request,
    actor: User,
    *,
    outcome: str,
    error: dict[str, Any] | None = None,
) -> None:
    via_key = bool(getattr(request.state, "admin_via_key", False))
    details = dict(entry.details)
    if error:
        details["error"] = error
    log_admin_action(
        entry.action,
        target_type=entry.target_type,
        target_id=entry.target_id,
        ip_address=resolve_client_ip(request, max(0, int(get_settings().trusted_proxy_count))),
        actor_user_id=actor.user_id,
        actor_email=actor.email,
        actor_role=SERVICE_KEY_ROLE if via_key else admin_role_of(actor),
        reason=entry.reason,
        user_agent=(request.headers.get("user-agent") or "")[:_MAX_USER_AGENT] or None,
        outcome=outcome,
        details=details,
    )


def audited(
    action: str,
    *,
    target_type: str | None = None,
    reason_required: bool = False,
    before_mfa: bool = False,
) -> Any:
    """Route parameter default that audits the request: `audit: AuditEntry = audited(...)`.

    `reason_required` declares that the route always needs a reason; the handler
    still calls `audit.require_reason(...)` with wherever its reason arrives
    (body or query). The declaration is what the coverage test reads.

    `before_mfa` is for the two set-up routes that answer before a second factor
    exists (`get_admin_user_without_mfa`). Anywhere else it would let the audit
    dependency resolve an actor the route itself refuses.
    """
    actor_guard = get_admin_user_without_mfa if before_mfa else get_admin_user

    def _audit(
        request: Request,
        db: Session = Depends(get_db),
        actor: User = Depends(actor_guard),
    ) -> Generator[AuditEntry, None, None]:
        entry = AuditEntry(action=action, target_type=target_type)
        try:
            yield entry
            db.commit()
        except StarletteHTTPException as exc:
            if not _is_elevation_prompt(request, exc):
                _write(
                    entry,
                    request,
                    actor,
                    outcome=OUTCOME_REFUSED if exc.status_code < 500 else OUTCOME_ERROR,
                    error={"status": exc.status_code, "detail": str(exc.detail)[:_MAX_ERROR_TEXT]},
                )
            raise
        except RequestValidationError:
            _write(entry, request, actor, outcome=OUTCOME_REFUSED, error={"status": 422, "detail": "invalid request"})
            raise
        except Exception as exc:
            _write(entry, request, actor, outcome=OUTCOME_ERROR, error={"status": 500, "detail": type(exc).__name__})
            raise
        _write(entry, request, actor, outcome=OUTCOME_SUCCESS)

    _audit.audit_action = action  # type: ignore[attr-defined]
    _audit.reason_required = reason_required  # type: ignore[attr-defined]
    _audit.before_mfa = before_mfa  # type: ignore[attr-defined]
    return Depends(_audit, scope="function")
