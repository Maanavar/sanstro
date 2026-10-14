"""Cross-process leader election for the background scheduler.

When the app runs with multiple workers (e.g. ``uvicorn --workers N``) every
worker executes the same lifespan and would otherwise start its own scheduler —
firing the daily push cron N times and sending duplicate notifications to every
user. We avoid that with a PostgreSQL *session-level advisory lock*: only the
worker that wins the lock starts the scheduler; the rest stay followers.

On SQLite (tests / offline) advisory locks do not exist, so we always grant
leadership — there is only ever one process there anyway.
"""
from __future__ import annotations

import logging
from typing import Any

from sqlalchemy.engine import Engine

logger = logging.getLogger("jothidam.leader")

# Arbitrary but stable 63-bit key identifying the "scheduler" lock namespace.
SCHEDULER_LOCK_KEY = 0x5641_4E41_4144_4900 - (1 << 63)  # "VANAADI\0" folded into int8 range


class SchedulerLease:
    """Holds a leader lease for the scheduler. Use as a context manager."""

    def __init__(self, engine: Engine, key: int = SCHEDULER_LOCK_KEY) -> None:
        self._engine = engine
        self._key = key
        self._conn: Any | None = None
        self._backend_pid: int | None = None
        self.is_leader = False

    @property
    def backend_pid(self) -> int | None:
        return self._backend_pid

    def acquire(self) -> bool:
        dialect = self._engine.dialect.name
        if dialect != "postgresql":
            # No advisory locks outside Postgres — single process, always leader.
            self.is_leader = True
            return True

        from sqlalchemy import text

        # A dedicated connection must stay open for the whole app lifetime; the
        # session-level lock is released automatically if that connection drops.
        conn = self._engine.connect()
        try:
            acquired = bool(conn.execute(text("SELECT pg_try_advisory_lock(:k)"), {"k": self._key}).scalar())
            backend_pid = int(conn.execute(text("SELECT pg_backend_pid()")).scalar_one())
            conn.commit()
        except Exception:  # pragma: no cover - defensive
            conn.close()
            raise
        if acquired:
            self._conn = conn
            self._backend_pid = backend_pid
            self.is_leader = True
        else:
            conn.close()
            self.is_leader = False
        return self.is_leader

    def check(self) -> bool:
        """Return whether the original PostgreSQL session still owns the lock.

        SQLAlchemy may reconnect an invalidated ``Connection``. Merely running
        ``SELECT 1`` would then bless a new database session after the original
        advisory lock had been released. Pinning and re-checking the backend PID
        makes a reconnect a leadership loss, which the supervised worker treats
        as fatal instead of continuing alongside a new leader.
        """
        if not self.is_leader:
            return False
        if self._engine.dialect.name != "postgresql":
            return True
        if self._conn is None or self._backend_pid is None:
            self.is_leader = False
            return False

        from sqlalchemy import text

        unsigned_key = self._key & ((1 << 64) - 1)
        class_id = unsigned_key >> 32
        object_id = unsigned_key & 0xFFFF_FFFF
        try:
            row = self._conn.execute(
                text(
                    """
                    SELECT
                        pg_backend_pid() AS backend_pid,
                        EXISTS (
                            SELECT 1
                            FROM pg_locks
                            WHERE locktype = 'advisory'
                              AND pid = pg_backend_pid()
                              AND granted
                              AND classid = :class_id
                              AND objid = :object_id
                              AND objsubid = 1
                        ) AS owns_lock
                    """
                ),
                {"class_id": class_id, "object_id": object_id},
            ).one()
            self._conn.commit()
        except Exception:
            logger.exception("Scheduler leadership check failed.")
            self.is_leader = False
            return False

        if int(row.backend_pid) != self._backend_pid or not bool(row.owns_lock):
            logger.error(
                "Scheduler leadership was lost (expected backend pid=%s, observed=%s, owns_lock=%s).",
                self._backend_pid,
                row.backend_pid,
                row.owns_lock,
            )
            self.is_leader = False
        return self.is_leader

    def release(self) -> None:
        if self._conn is None:
            self._backend_pid = None
            self.is_leader = False
            return
        from sqlalchemy import text

        try:
            self._conn.execute(text("SELECT pg_advisory_unlock(:k)"), {"k": self._key})
        except Exception:  # pragma: no cover - best effort on shutdown
            logger.warning("Failed to release scheduler advisory lock cleanly.")
        finally:
            self._conn.close()
            self._conn = None
            self._backend_pid = None
            self.is_leader = False

    def __enter__(self) -> SchedulerLease:
        self.acquire()
        return self

    def __exit__(self, *exc) -> None:
        self.release()
