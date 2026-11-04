"""`job_runs` — one row per background job execution (admin spec L10).

The defect these pin: a scheduled run left nothing in the database, so "did last
night's reconciliation run, and did it finish?" could only be answered from
whichever worker's log happened to survive. A manual run left an audit row
saying it was *triggered*, which is not the same claim.

Four properties, each one a different way the history can lie:

1. A run is recorded whichever way it ends — success, failure, or a worker
   killed mid-job (the row is open and `running` while the body executes).
2. A scheduled firing is recorded with no actor; a manual one names the admin.
3. Recording is never what breaks a job: if the history table cannot be
   written, the job still runs.
4. The read side — the list, the last run per job, and the Health tab — reports
   what the rows say, including "nothing has run".

BLIND SPOTS (CLAUDE.md "a gate proves its own check"):
- These drive `recorded(...)`, not APScheduler. That the scheduler is handed the
  wrapped callable is pinned structurally below by reading the add_job
  arguments; an APScheduler upgrade that swallowed the wrapper's return value
  would not be caught here.
- A stuck `running` row is simulated by writing one, not by killing a worker.
- Nothing here proves the Health tab is rendered; it checks the response.

NEGATIVE CONTROL (CLAUDE.md "a gate proves its own check"): with the
`recorded(...)` wrap removed from `schedule_all_jobs`,
`test_the_schedule_is_built_from_wrapped_callables` fails and names all seven
jobs as unrecorded (run 2026-11-04). The wrap was then restored and the file
re-run green.
"""
from __future__ import annotations

from datetime import UTC, datetime, timedelta
from uuid import UUID

import pytest

from app.db.session import SessionLocal
from app.models.job_run import JobRun
from app.scheduler import SCHEDULED_JOBS, schedule_all_jobs
from app.services import feature_flags, job_run_service
from app.services.job_run_service import (
    TRIGGER_MANUAL,
    TRIGGER_SCHEDULE,
    record_job_run,
    recorded,
)
from tests.conftest import TEST_USER_EMAIL, TEST_USER_ID

ACTOR = UUID(TEST_USER_ID)


def _rows(job_id: str | None = None) -> list[JobRun]:
    with SessionLocal() as session:
        query = session.query(JobRun).order_by(JobRun.started_at)
        if job_id is not None:
            query = query.filter(JobRun.job_id == job_id)
        return query.all()


def _raise(message: str):
    def _fn() -> None:
        raise RuntimeError(message)

    return _fn


# ── 1. A run is recorded whichever way it ends ───────────────────────────────


def test_a_successful_run_is_recorded_with_its_summary(client):
    recorded("synthetic_ok", lambda: {"charts": 3, "skipped": 0})()

    (row,) = _rows("synthetic_ok")
    assert (row.trigger, row.outcome) == (TRIGGER_SCHEDULE, "success")
    assert row.summary == "charts=3, skipped=0"
    assert row.finished_at is not None and row.finished_at >= row.started_at


def test_a_failed_run_still_leaves_a_row_and_the_error_reaches_the_caller(client):
    with pytest.raises(RuntimeError, match="ephemeris unavailable"):
        recorded("synthetic_boom", _raise("ephemeris unavailable"))()

    (row,) = _rows("synthetic_boom")
    assert row.outcome == "error"
    assert row.summary == "RuntimeError: ephemeris unavailable"
    assert row.finished_at is not None


def test_the_row_is_open_and_running_while_the_job_body_executes(client):
    """The reason the recorder commits twice: a worker killed here leaves a row.

    With a single commit at the end there would be nothing to find — the job
    would look as if it had never started.
    """
    seen: list[tuple[str, object]] = []

    def _look_at_my_own_row() -> None:
        (row,) = _rows("synthetic_open")
        seen.append((row.outcome, row.finished_at))

    recorded("synthetic_open", _look_at_my_own_row)()

    assert seen == [("running", None)]


def test_a_summary_cannot_grow_without_bound(client):
    with pytest.raises(RuntimeError):
        recorded("synthetic_long", _raise("x" * 5_000))()

    (row,) = _rows("synthetic_long")
    assert len(row.summary or "") <= 500


# ── 2. Who and what fired it ─────────────────────────────────────────────────


def test_a_scheduled_run_names_nobody(client):
    recorded("synthetic_cron", lambda: None)()

    (row,) = _rows("synthetic_cron")
    assert (row.trigger, row.actor_user_id, row.actor_email) == (TRIGGER_SCHEDULE, None, None)
    assert row.summary is None


def test_a_manual_trigger_records_the_admin_who_pressed_it(client, monkeypatch):
    monkeypatch.setattr(
        "app.api.admin.get_job",
        lambda job_id: {
            "job_id": job_id,
            "label": "Synthetic",
            "description": "Synthetic",
            "fn": lambda: {"ok": 1},
        },
    )
    response = client.post("/api/v1/admin/jobs/synthetic_manual/trigger")
    assert response.status_code == 200, response.text
    body = response.json()

    (row,) = _rows("synthetic_manual")
    assert (row.trigger, row.outcome) == (TRIGGER_MANUAL, "success")
    assert (row.actor_user_id, row.actor_email) == (ACTOR, TEST_USER_EMAIL)
    assert row.summary == "ok=1"
    # The trigger answer points at the row it wrote, so the console can link to it.
    assert body["run_id"] == str(row.id) and body["outcome"] == "success"


def test_a_failed_manual_trigger_records_the_jobs_own_error_not_the_http_one(client, monkeypatch):
    """A 500 is what the operator sees; `RuntimeError: ...` is what happened."""
    monkeypatch.setattr(
        "app.api.admin.get_job",
        lambda job_id: {
            "job_id": job_id,
            "label": "x",
            "description": "x",
            "fn": _raise("provider refused"),
        },
    )
    response = client.post("/api/v1/admin/jobs/synthetic_fail/trigger")
    assert response.status_code == 500

    (row,) = _rows("synthetic_fail")
    assert row.outcome == "error"
    assert row.summary == "RuntimeError: provider refused"


def test_the_schedule_is_built_from_wrapped_callables(client):
    """Structural: every job APScheduler is handed records its firing.

    A job added straight from `SCHEDULED_JOBS` would run and leave no row, and
    no behavioural test here would notice — the schedule is never fired in the
    suite.
    """
    added: list[tuple[str, object]] = []

    class _FakeScheduler:
        def add_job(self, func, _trigger, *, id, replace_existing, **_kwargs):  # noqa: A002
            added.append((id, func))

    schedule_all_jobs(_FakeScheduler())

    assert [job_id for job_id, _ in added] == [job.id for job in SCHEDULED_JOBS]
    raw = {job.id: job.func for job in SCHEDULED_JOBS}
    unwrapped = [job_id for job_id, func in added if func is raw[job_id]]
    assert not unwrapped, f"these jobs would run unrecorded: {unwrapped}"


# ── 3. Bookkeeping never breaks the job ──────────────────────────────────────


def test_a_job_still_runs_when_its_history_cannot_be_written(client, monkeypatch):
    def _refuse(*_args, **_kwargs):
        raise RuntimeError("job_runs is unreachable")

    monkeypatch.setattr(job_run_service, "_open_run", _refuse)
    ran: list[bool] = []

    with record_job_run("synthetic_unreachable", trigger=TRIGGER_SCHEDULE) as record:
        ran.append(True)
        record.summary = "did the work anyway"

    assert ran == [True]


def test_a_close_that_fails_leaves_the_open_row_rather_than_losing_the_run(client, monkeypatch):
    monkeypatch.setattr(job_run_service, "_close_run", lambda *a, **k: None)

    recorded("synthetic_halfwritten", lambda: None)()

    (row,) = _rows("synthetic_halfwritten")
    assert (row.outcome, row.finished_at) == ("running", None)


# ── 4. The read side ─────────────────────────────────────────────────────────


def test_the_run_list_is_newest_first_and_filters(client):
    recorded("job_a", lambda: {"n": 1})()
    recorded("job_b", lambda: {"n": 2})()
    with pytest.raises(RuntimeError):
        recorded("job_a", _raise("no"))()

    everything = client.get("/api/v1/admin/job-runs").json()
    assert [row["job_id"] for row in everything] == ["job_a", "job_b", "job_a"][::-1]

    by_job = client.get("/api/v1/admin/job-runs", params={"job_id": "job_a"}).json()
    assert {row["job_id"] for row in by_job} == {"job_a"} and len(by_job) == 2

    failed = client.get("/api/v1/admin/job-runs", params={"outcome": "error"}).json()
    assert [(row["job_id"], row["outcome"]) for row in failed] == [("job_a", "error")]


def test_the_job_list_carries_the_last_run_and_null_when_there_is_none(client):
    recorded("panchangam_prewarm", lambda: {"locations": 9})()

    jobs = {job["job_id"]: job for job in client.get("/api/v1/admin/jobs").json()}
    assert jobs["panchangam_prewarm"]["last_run"]["summary"] == "locations=9"
    assert jobs["panchangam_prewarm"]["last_run"]["trigger"] == TRIGGER_SCHEDULE
    never_run = [job_id for job_id, job in jobs.items() if job["last_run"] is None]
    assert "payment_reconciliation" in never_run


def test_the_last_run_is_the_newest_one_not_the_first(client):
    recorded("job_c", lambda: {"pass": 1})()
    recorded("job_c", lambda: {"pass": 2})()

    with SessionLocal() as session:
        runs = job_run_service.recent_job_runs(session, job_id="job_c")
        last = job_run_service.last_run_per_job(session)
    assert [row.summary for row in runs] == ["pass=2", "pass=1"]
    assert last["job_c"].summary == "pass=2"


def _health(client) -> dict[str, dict]:
    response = client.get("/api/v1/admin/health/detail")
    assert response.status_code == 200, response.text
    return {component["name"]: component for component in response.json()["components"]}


def test_the_health_tab_says_so_when_nothing_has_run(client):
    components = _health(client)
    assert components["job_runs"]["status"] == "warning"
    assert "No job run recorded" in components["job_runs"]["detail"]


def test_the_health_tab_reports_a_failed_run_as_an_error(client):
    recorded("job_ok", lambda: None)()
    with pytest.raises(RuntimeError):
        recorded("job_bad", _raise("no"))()

    components = _health(client)
    assert components["job_runs"]["status"] == "error"
    assert "job_bad" in components["job_runs"]["detail"]


def test_the_health_tab_flags_a_run_that_never_finished(client):
    with SessionLocal() as session, session.begin():
        session.add(
            JobRun(
                job_id="job_killed",
                trigger=TRIGGER_SCHEDULE,
                started_at=datetime.now(UTC) - timedelta(hours=30),
                outcome="running",
            )
        )

    components = _health(client)
    assert components["job_runs"]["status"] == "warning"
    assert "still marked running" in components["job_runs"]["detail"]


# ── The restore drill record (spec L10: date and result on the Health tab) ───


def test_the_health_tab_warns_until_a_restore_drill_is_recorded(client):
    component = _health(client)["restore_drill"]
    assert component["status"] == "warning"
    assert "KEY_ESCROW_AND_RESTORE" in component["detail"]


def _record_drill(*, when: str, passed: bool, note: str = "") -> None:
    feature_flags.persist_flag(
        "ops_last_restore_drill_at", when, reason="drill performed", actor_user_id=ACTOR
    )
    feature_flags.persist_flag(
        "ops_last_restore_drill_passed", passed, reason="drill performed", actor_user_id=ACTOR
    )
    if note:
        feature_flags.persist_flag(
            "ops_last_restore_drill_note", note, reason="drill performed", actor_user_id=ACTOR
        )


def test_a_recorded_drill_shows_its_date_and_result(client):
    today = datetime.now(UTC).date().isoformat()
    _record_drill(when=today, passed=True, note="dev dump into vinaadi_restore_check")

    component = _health(client)["restore_drill"]
    assert component["status"] == "ok"
    assert today in component["detail"] and "pass" in component["detail"]
    assert "vinaadi_restore_check" in component["detail"]


def test_a_drill_that_did_not_pass_is_not_a_green_row(client):
    """The failure this prevents: a dated drill with a note saying it failed,
    shown as ok because the date was recent."""
    today = datetime.now(UTC).date().isoformat()
    _record_drill(when=today, passed=False, note="admin_mfa_credentials had no rows")

    component = _health(client)["restore_drill"]
    assert component["status"] == "warning"
    assert "NOT a pass" in component["detail"]


def test_a_drill_older_than_the_quarterly_cadence_is_a_warning(client):
    stale = (datetime.now(UTC).date() - timedelta(days=120)).isoformat()
    _record_drill(when=stale, passed=True)

    component = _health(client)["restore_drill"]
    assert component["status"] == "warning"
    assert "120d ago" in component["detail"]
