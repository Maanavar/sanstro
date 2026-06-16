"""Write admin audit log entries from explicit admin endpoints."""
from __future__ import annotations

from app.db.session import SessionLocal
from app.models.admin_audit_log import AdminAuditLog


def log_admin_action(
    action: str,
    target_type: str | None = None,
    target_id: str | None = None,
    payload_summary: str | None = None,
    ip_address: str | None = None,
) -> None:
    with SessionLocal() as session:
        entry = AdminAuditLog(
            action=action,
            target_type=target_type,
            target_id=target_id,
            payload_summary=payload_summary,
            ip_address=ip_address,
        )
        session.add(entry)
        session.commit()
