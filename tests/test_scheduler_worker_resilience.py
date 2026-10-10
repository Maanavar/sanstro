"""A09 scheduler ownership, leadership-loss and heartbeat gates."""
from __future__ import annotations

from datetime import UTC, datetime, timedelta
from pathlib import Path
from uuid import uuid4

from sqlalchemy import text

from app.core.leader_lock import SchedulerLease
from app.db.session import SessionLocal, engine
from app.services.scheduler_heartbeat_service import (
    record_scheduler_heartbeat,
    scheduler_is_healthy,
)


def test_lease_check_confirms_healthy_leadership_and_blocks_a_second_lease(client) -> None:
    """`check()` must say True while the lease is intact, not just False once killed.

    Without this, a `check()` that always returned False would still make
    ``test_lease_detects_terminated_postgresql_session`` pass for the wrong
    reason. This also confirms the advisory lock's classid/objid split
    (derived from the 64-bit key) actually matches what PostgreSQL records in
    `pg_locks`, and that a second lease on the same key cannot acquire it.
    """
    key = uuid4().int % (2**63 - 1)
    lease = SchedulerLease(engine, key=key)
    other = SchedulerLease(engine, key=key)
    try:
        assert lease.acquire() is True
        assert lease.check() is True
        assert lease.is_leader is True
        assert other.acquire() is False
        assert other.is_leader is False
    finally:
        other.release()
        lease.release()


def test_lease_detects_terminated_postgresql_session(client) -> None:
    lease = SchedulerLease(engine, key=uuid4().int % (2**63 - 1))
    assert lease.acquire() is True
    assert lease.backend_pid is not None
    try:
        with engine.connect() as killer:
            assert killer.execute(
                text("SELECT pg_terminate_backend(:pid)"),
                {"pid": lease.backend_pid},
            ).scalar_one() is True
            killer.commit()
        assert lease.check() is False
        assert lease.is_leader is False
    finally:
        lease.release()


def test_scheduler_heartbeat_records_fresh_leadership_and_ages_out(client) -> None:
    now = datetime.now(UTC)
    with SessionLocal.begin() as session:
        record_scheduler_heartbeat(
            session,
            instance_id=uuid4(),
            is_leader=True,
            backend_pid=12345,
            now=now,
            started_at=now - timedelta(minutes=1),
        )
    with SessionLocal() as session:
        assert scheduler_is_healthy(session, max_age_seconds=60, now=now) is True
        assert scheduler_is_healthy(
            session,
            max_age_seconds=60,
            now=now + timedelta(seconds=61),
        ) is False


def test_production_compose_has_one_supervised_scheduler_owner() -> None:
    compose = Path("docker-compose.app.yml").read_text(encoding="utf-8")
    api_block, worker_block = compose.split("  worker:", 1)
    worker_block = worker_block.split("  web:", 1)[0]

    assert 'JOTHIDAM_RUN_SCHEDULER_IN_WEB: "false"' in api_block
    assert "profiles:" not in worker_block
    assert "restart: unless-stopped" in worker_block
    assert 'test: ["CMD", "python", "-m", "app.worker_health"]' in worker_block
