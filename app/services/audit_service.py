"""Write admin audit log entries from explicit admin endpoints."""
from __future__ import annotations

from uuid import UUID

from app.db.session import SessionLocal
from app.models.admin_audit_log import AdminAuditLog


def log_admin_action(
    action: str,
    target_type: str | None = None,
    target_id: str | None = None,
    payload_summary: str | None = None,
    ip_address: str | None = None,
    actor_user_id: UUID | None = None,
) -> None:
    """Record one privileged action.

    `actor_user_id` is who did it. Pass it from the `get_admin_user` dependency
    at every call site: without it the log can say a user was deleted but not by
    whom, which is the first question an incident review asks. It stays optional
    only because a genuine server-to-server caller on the retained X-Admin-Key
    path has no user to name — never because a call site did not bother.
    """
    with SessionLocal() as session:
        entry = AdminAuditLog(
            action=action,
            target_type=target_type,
            target_id=target_id,
            payload_summary=payload_summary,
            ip_address=ip_address,
            actor_user_id=actor_user_id,
        )
        session.add(entry)
        session.commit()
