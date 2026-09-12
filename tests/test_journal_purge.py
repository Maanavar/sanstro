"""P2-1 — hard deletion of archived journal entries.

The audit's observation was that journal deletion is an archive: `deleted_at`
gets set and nothing ever removes the row. These tests pin the two halves of the
fix — that the purge only ever touches already-archived rows, and that it does
nothing at all until an operator has chosen a retention window.
"""
from __future__ import annotations

import uuid
from datetime import UTC, date, datetime, timedelta

import pytest
import sqlalchemy as sa

from app.db.session import SessionLocal
from app.models.journal_entry import JournalEntry
from app.services.journal_purge import purge_archived_journal_entries, run_journal_purge_cron

NOW = datetime(2026, 9, 3, 12, 0, tzinfo=UTC)


def _entry(session, *, owner_id, chart_id, deleted_at, note="note text") -> uuid.UUID:
    entry = JournalEntry(
        journal_id=uuid.uuid4(),
        owner_user_id=owner_id,
        chart_id=chart_id,
        entry_date=date(2026, 1, 1),
        life_area="general",
        note_text=note,
        tags=[],
        anchor_payload={},
        deleted_at=deleted_at,
    )
    session.add(entry)
    session.flush()
    return entry.journal_id


@pytest.fixture
def journal_rows(client, birth_profile_payload_factory):
    """Four entries: live, freshly archived, long archived, and long archived.

    Built through the API so owner and chart are real rows, then manipulated
    directly — `deleted_at` in the past is not something the API can produce.
    """
    profile = client.post(
        "/api/v1/birth-profiles",
        json=birth_profile_payload_factory(display_name=f"Purge {uuid.uuid4()}"),
    )
    assert profile.status_code == 200
    chart = client.post(
        "/api/v1/charts/calculate",
        json={
            "birthProfileId": profile.json()["data"]["birthProfileId"],
            "calculationVersion": "thirukanitham-2026-v1",
            "forceRecalculate": False,
        },
    )
    assert chart.status_code == 200
    chart_id = uuid.UUID(chart.json()["data"]["chartId"])

    seed = client.post(
        "/api/v1/journal",
        json={
            "chartId": str(chart_id),
            "entryDate": "2026-01-01",
            "lifeArea": "general",
            "noteText": "seed entry to resolve the owner",
        },
    )
    assert seed.status_code == 200, seed.text
    seed_id = uuid.UUID(seed.json()["data"]["journalId"])

    with SessionLocal() as session:
        owner_id = session.get(JournalEntry, seed_id).owner_user_id
        ids = {
            "live": _entry(session, owner_id=owner_id, chart_id=chart_id, deleted_at=None),
            "recent": _entry(
                session, owner_id=owner_id, chart_id=chart_id,
                deleted_at=NOW - timedelta(days=10),
            ),
            "old": _entry(
                session, owner_id=owner_id, chart_id=chart_id,
                deleted_at=NOW - timedelta(days=40),
            ),
            "older": _entry(
                session, owner_id=owner_id, chart_id=chart_id,
                deleted_at=NOW - timedelta(days=400),
            ),
        }
        session.commit()

    return ids


def _exists(journal_id: uuid.UUID) -> bool:
    with SessionLocal() as session:
        return session.get(JournalEntry, journal_id) is not None


def test_purges_only_entries_archived_beyond_the_window(journal_rows):
    with SessionLocal() as session:
        deleted = purge_archived_journal_entries(session, older_than_days=30, as_of=NOW)

    assert deleted == 2
    assert _exists(journal_rows["live"]), "a live entry must never be purged"
    assert _exists(journal_rows["recent"]), "inside the window, must survive"
    assert not _exists(journal_rows["old"])
    assert not _exists(journal_rows["older"])


def test_a_live_entry_is_never_in_scope_however_old(journal_rows):
    """Age alone is not deletion. Only `deleted_at` puts a row in scope."""
    with SessionLocal() as session:
        purge_archived_journal_entries(session, older_than_days=1, as_of=NOW)

    assert _exists(journal_rows["live"])


def test_zero_days_deletes_nothing(journal_rows):
    """The default. Also guarded inside the function, not only at the caller."""
    with SessionLocal() as session:
        assert purge_archived_journal_entries(session, older_than_days=0, as_of=NOW) == 0
        assert purge_archived_journal_entries(session, older_than_days=-5, as_of=NOW) == 0

    assert all(_exists(journal_id) for journal_id in journal_rows.values())


def test_dry_run_counts_without_deleting(journal_rows):
    with SessionLocal() as session:
        count = purge_archived_journal_entries(
            session, older_than_days=30, as_of=NOW, dry_run=True
        )

    assert count == 2
    assert all(_exists(journal_id) for journal_id in journal_rows.values())


def test_cron_is_a_noop_until_a_window_is_configured(journal_rows, monkeypatch):
    """Irreversible deletion must not start happening because a job was added."""
    from app.core.config import get_settings

    monkeypatch.setattr(get_settings(), "journal_purge_after_days", 0, raising=False)

    run_journal_purge_cron()

    assert all(_exists(journal_id) for journal_id in journal_rows.values())


def test_cron_purges_once_a_window_is_configured(journal_rows, monkeypatch):
    from app.core.config import get_settings

    monkeypatch.setattr(get_settings(), "journal_purge_after_days", 30, raising=False)

    run_journal_purge_cron()

    # NOW is in the past relative to the real clock the cron uses, so both the
    # 40- and 400-day rows are well beyond a 30-day window either way.
    assert _exists(journal_rows["live"])
    assert not _exists(journal_rows["old"])


def test_purge_is_registered_as_a_scheduled_job():
    from app.scheduler import SCHEDULED_JOBS

    job = next((j for j in SCHEDULED_JOBS if j.id == "journal_purge"), None)
    assert job is not None, "the policy needs an enforcer, not just a function"


def test_purge_leaves_no_orphan_rows(journal_rows):
    """A hard delete has to actually remove the row, not blank its columns."""
    with SessionLocal() as session:
        purge_archived_journal_entries(session, older_than_days=30, as_of=NOW)

    with SessionLocal() as session:
        found = session.execute(
            sa.text("SELECT count(*) FROM journal_entries WHERE journal_id = :id"),
            {"id": journal_rows["older"]},
        ).scalar_one()
    assert found == 0
