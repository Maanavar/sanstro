"""`erase_user` and `export_user`: the one path for each, over the registry (spec L5).

`DELETE /auth/me` and the console's erasure route both call `erase_user`, so
self-deletion and admin erasure have the same effect (decision 10). The audit
row is the caller's to write: the admin route through `audited(...)`, the
self route through `log_admin_action`, both with the result's counts.

Erasure is one transaction on the caller's session: every count is taken
first, then each store is deleted or detached in registry order, then the
account row goes. A failure anywhere rolls all of it back.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any, Literal
from uuid import UUID

from fastapi.encoders import jsonable_encoder
from sqlalchemy import select, text
from sqlalchemy.orm import Session

from app.core.auth import admin_role_of
from app.core.error_codes import ErrorCode
from app.db.base import Base
from app.models.erasure_tombstone import ErasureTombstone
from app.models.subscription import Subscription
from app.models.user import User
from app.privacy.registry import EXTERNAL_STORES, TABLE_STORES, TableStore
from app.services.audit_service import log_admin_action

EXPORT_FORMAT_VERSION = 1

_PARAM = re.compile(r"(?<!:):(\w+)")


class ErasureRefused(Exception):
    """Erasure would do harm the person did not ask for. Routes answer `AppError(code)`,
    whose catalogue entry carries the bilingual message the person sees."""

    def __init__(self, code: ErrorCode) -> None:
        super().__init__(code.value)
        self.code = code


@dataclass
class ErasureResult:
    erasure_id: UUID
    erased_at: datetime
    #: Registry key -> rows deleted, detached or (for `keep`) seen.
    counts: dict[str, int] = field(default_factory=dict)
    #: External stores whose manual step is now due.
    external_followups: list[str] = field(default_factory=list)

    @property
    def pseudonym(self) -> str:
        return pseudonym_for(self.erasure_id)

    def audit_details(self) -> dict[str, Any]:
        return {"via_registry": self.counts, "external_followups": self.external_followups}


def pseudonym_for(erasure_id: UUID) -> str:
    """How the audit log names an erased person: the only rewrite its trigger allows."""
    return f"erased:{erasure_id}"


def _params(sql: str, values: dict[str, Any]) -> dict[str, Any]:
    return {name: values[name] for name in set(_PARAM.findall(sql))}


def _refusal(session: Session, user: User) -> ErasureRefused | None:
    if admin_role_of(user) is not None:
        return ErasureRefused(ErrorCode.ERASURE_BLOCKED_BY_ADMIN_ROLE)
    renewing = session.execute(
        select(Subscription.subscription_id).where(
            Subscription.user_id == user.user_id,
            Subscription.provider == "razorpay",
            Subscription.status == "active",
            Subscription.cancel_at_period_end.is_(False),
        )
    ).first()
    if renewing is not None:
        return ErasureRefused(ErrorCode.ERASURE_BLOCKED_BY_SUBSCRIPTION)
    return None


def _erase_rows(session: Session, user_id: UUID, pseudonym: str) -> dict[str, int]:
    # Every SQL fragment below is a registry constant; the person's id and the
    # pseudonym travel only as bound parameters.
    values = {"uid": user_id, "uid_text": str(user_id), "pseudonym": pseudonym}
    counts = {
        store.key: int(
            session.execute(
                text(f"SELECT count(*) FROM {store.table} WHERE {store.where}"),  # noqa: S608 — registry constants
                _params(store.where, values),
            ).scalar_one()
        )
        for store in TABLE_STORES
    }
    for store in TABLE_STORES:
        if store.erase == "delete":
            sql = f"DELETE FROM {store.table} WHERE {store.where}"  # noqa: S608 — registry constants
        elif store.erase == "detach":
            sql = f"UPDATE {store.table} SET {store.detach_set} WHERE {store.where}"  # noqa: S608 — registry constants
        else:
            continue
        session.execute(text(sql), _params(sql, values))
    return counts


def erase_user(session: Session, user_id: UUID, *, via: Literal["self", "admin"]) -> ErasureResult:
    """Erase the account and everything the registry says is the person's.

    Raises `LookupError` when there is no such account and `ErasureRefused`
    when erasing it now would harm the person (a renewing subscription) or the
    service (an admin role). Leaves the commit to the caller.
    """
    user = session.get(User, user_id, with_for_update=True)
    if user is None:
        raise LookupError(str(user_id))
    refusal = _refusal(session, user)
    if refusal is not None:
        raise refusal

    tombstone = ErasureTombstone(user_id=user_id, via=via)
    session.add(tombstone)
    session.flush()
    # The account row is about to go under the ORM's feet.
    session.expunge(user)
    counts = _erase_rows(session, user_id, pseudonym_for(tombstone.id))
    session.flush()
    return ErasureResult(
        erasure_id=tombstone.id,
        erased_at=datetime.now(UTC),
        counts=counts,
        external_followups=[store.key for store in EXTERNAL_STORES],
    )


def erase_own_account(session: Session, user_id: UUID) -> ErasureResult:
    """`DELETE /auth/me`: erase, commit, then write the audit row.

    The row names the person only by the pseudonym and carries no IP or user
    agent: those would be the erased person's. Written after the commit, so it
    never records an erasure the database then lost (ARC-20's rule).
    """
    result = erase_user(session, user_id, via="self")
    session.commit()
    log_admin_action(
        "erase_account",
        target_type="user",
        target_id=result.pseudonym,
        actor_role="self",
        details=result.audit_details(),
    )
    return result


def replay_erasure(session: Session, tombstone: ErasureTombstone) -> dict[str, int] | None:
    """Erase a tombstoned account that a restored backup brought back.

    None when the account is not there. No refusal checks: the person was
    already erased once, and a restore must not undo that.
    """
    if session.get(User, tombstone.user_id) is None:
        return None
    counts = _erase_rows(session, tombstone.user_id, pseudonym_for(tombstone.id))
    session.flush()
    return counts


# ── Export ───────────────────────────────────────────────────────────────────


def _model_for(table: str) -> Any:
    for mapper in Base.registry.mappers:
        if mapper.local_table.name == table:
            return mapper
    raise LookupError(f"no model for table {table}")


def _export_rows(session: Session, store: TableStore, user_id: UUID) -> list[dict[str, Any]]:
    mapper = _model_for(store.table)
    values = {"uid": user_id, "uid_text": str(user_id)}
    rows = session.execute(
        select(mapper.class_).where(text(store.where)), _params(store.where, values)
    ).scalars().all()
    keys = store.export_only or tuple(
        attr.key for attr in mapper.column_attrs if attr.key not in store.export_exclude
    )
    # Through the ORM, so encrypted columns come out decrypted.
    return [jsonable_encoder({key: getattr(row, key) for key in keys}) for row in rows]


def export_user(session: Session, user_id: UUID) -> dict[str, Any]:
    """Everything the registry exports for the account, as JSON-ready data.

    Raises `LookupError` when there is no such account.
    """
    if session.get(User, user_id) is None:
        raise LookupError(str(user_id))
    return {
        "format_version": EXPORT_FORMAT_VERSION,
        "exported_at": datetime.now(UTC).isoformat(),
        "account_id": str(user_id),
        "stores": {
            store.key: {"holds": store.holds, "retention": store.retention, "rows": _export_rows(session, store, user_id)}
            for store in TABLE_STORES
            if store.export
        },
        "elsewhere": [
            {"store": store.key, "holds": store.holds, "retention": store.retention} for store in EXTERNAL_STORES
        ],
    }
