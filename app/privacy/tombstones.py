"""Erasure must survive a backup restore (spec L5).

A backup taken before an erasure still holds the account, and the restored
database's own `erasure_tombstones` predates it. So the tombstones are carried
across the restore and replayed:

    # 1. Against the database being replaced, before restoring:
    python -m app.privacy.tombstones export tombstones.json
    # 2. Restore the backup.
    # 3. Against the restored database:
    python -m app.privacy.tombstones replay tombstones.json

Replay adds the tombstones the restored database lacks, then erases every
tombstoned account it finds, under the same pseudonym as the first time. It is
idempotent: a second run finds nothing to erase. Runbook:
docs/agent/database.md, "Restore".
"""
from __future__ import annotations

import json
import sys
from datetime import datetime
from pathlib import Path
from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.erasure_tombstone import ErasureTombstone
from app.privacy.erasure import replay_erasure
from app.services.audit_service import log_admin_action


def export_tombstones(session: Session) -> list[dict[str, Any]]:
    rows = session.execute(select(ErasureTombstone).order_by(ErasureTombstone.erased_at)).scalars().all()
    return [
        {"id": str(row.id), "user_id": str(row.user_id), "via": row.via, "erased_at": row.erased_at.isoformat()}
        for row in rows
    ]


def replay(session: Session, entries: list[dict[str, Any]]) -> dict[str, int]:
    """Add missing tombstones, erase every tombstoned account present. Leaves the commit to the caller."""
    known = set(session.execute(select(ErasureTombstone.user_id)).scalars().all())
    added = 0
    for entry in entries:
        user_id = UUID(entry["user_id"])
        if user_id in known:
            continue
        session.add(
            ErasureTombstone(
                id=UUID(entry["id"]),
                user_id=user_id,
                via=entry["via"],
                erased_at=datetime.fromisoformat(entry["erased_at"]),
            )
        )
        known.add(user_id)
        added += 1
    session.flush()

    erased = 0
    for tombstone in session.execute(select(ErasureTombstone)).scalars().all():
        if replay_erasure(session, tombstone) is not None:
            erased += 1
    return {"tombstones_added": added, "accounts_erased": erased}


def main(argv: list[str]) -> int:
    if len(argv) != 2 or argv[0] not in {"export", "replay"}:
        print("usage: python -m app.privacy.tombstones export|replay FILE", file=sys.stderr)
        return 2
    command, path = argv[0], Path(argv[1])
    with SessionLocal() as session:
        if command == "export":
            entries = export_tombstones(session)
            path.write_text(json.dumps(entries, indent=2), encoding="utf-8")
            print(f"exported {len(entries)} tombstones to {path}")
            return 0
        result = replay(session, json.loads(path.read_text(encoding="utf-8")))
        session.commit()
    log_admin_action("replay_erasure_tombstones", target_type="erasure", actor_role="service", details=result)
    print(f"replayed: {result}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
