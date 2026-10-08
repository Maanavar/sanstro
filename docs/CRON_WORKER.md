# Cron Worker — Deployment Guide

## What it does

`run_daily_push_cron` (in `app/services/daily_push_cron.py`) sends three types of
push notifications:

| Alert type | Trigger |
|---|---|
| `MORNING_NALLA_NERAM` | Daily; user's preferred local time ± 30 min |
| `DASHA_TRANSITION` | When a major/minor dasha transition is within 90 days |
| `PIRANTHA_NAAL` | On the user's birth star day each month |

The job is scheduled every hour on the hour (`minute=0`).  Per-user timing is
decided inside `_morning_alert_due`, so notifications land in each user's
chosen time window rather than all firing simultaneously.

## Job registry

All scheduled jobs live in `app/scheduler.py` (`SCHEDULED_JOBS`).  The same
list is consumed by both the in-web scheduler and `app.worker`, so the two
modes can never drift.

```
daily_push_cron           – every hour :00
daily_peyarchi_refresh    – 02:00 UTC daily
daily_relationship_alert_refresh – 02:05 UTC daily
panchangam_prewarm        – 02:10 UTC daily
```

## Run modes

### Single-box development (explicit opt-in)

Development may run APScheduler inside the FastAPI lifespan by explicitly
setting `JOTHIDAM_RUN_SCHEDULER_IN_WEB=true`. Production and staging APIs refuse
that setting so deployment ownership cannot silently become mixed.

```
uvicorn app.main:app --workers 4
```

No extra process needed.  The advisory lock (`app/core/leader_lock.py`) ensures
exactly one of the four Uvicorn workers fires each job.

### Dedicated worker (production default)

1. Set `JOTHIDAM_RUN_SCHEDULER_IN_WEB=false` on every API container.
2. Start the supervised scheduler container:

```bash
python -m app.worker
```

Docker Compose example:

```yaml
services:
  api:
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2
    environment:
      JOTHIDAM_RUN_SCHEDULER_IN_WEB: "false"

  worker:
    command: python -m app.worker
    environment:
      JOTHIDAM_RUN_SCHEDULER_IN_WEB: "false"  # no-op in worker, but harmless
      JOTHIDAM_PROCESS_ROLE: worker
```

### Which secrets the worker needs

`JOTHIDAM_PROCESS_ROLE: worker` is not cosmetic. It tells `app/core/config.py`
that this process serves no HTTP, which changes what it must be given:

| | Needs it | Why |
|---|---|---|
| `JOTHIDAM_DATABASE_URL` | yes | jobs read and write |
| `JOTHIDAM_ENCRYPTION_KEY` (or `..._KEYS`) | **yes** | the morning push reads birth profiles, which are encrypted at rest |
| `JOTHIDAM_JWT_SECRET` | no | authenticates nothing |
| `JOTHIDAM_ADMIN_API_KEY` | no | serves no admin route |
| `JOTHIDAM_COOKIE_SECURE` | no | sets no cookies |

Without the role set, the default is `api` and the production checks demand all
of the above — which is why the `scaled` profile previously could not start in
production at all: the worker image carries no `.env`, so `cookie_secure`
defaulted false and a cookie setting blocked a process that serves no cookies.
See `docs/SEC1_SECRET_CUSTODY_RULING.md` §5.2.

The default errs toward demanding more, deliberately: an unset or misspelled
role must never let an HTTP process boot without a JWT secret.

The supplied production Compose stack starts one worker. A worker that cannot
acquire leadership, or later loses the lock-owning PostgreSQL session, exits
non-zero so supervision restarts it. It never idles as a healthy follower.

## Leader election

`app/core/leader_lock.py` — `SchedulerLease` acquires a session-level
PostgreSQL advisory lock (`pg_try_advisory_lock`) at startup.

- **Wins the lock** → starts APScheduler, runs jobs.
- **Worker loses the lock or its original DB session** → exits non-zero; container
  supervision restarts it.
- **Leader crashes** → the DB connection releases the lock automatically; the
  restarted worker reacquires it.

Every successful leadership-check cycle updates `scheduler_heartbeats`. The
worker health probe requires a fresh leader heartbeat; its age is bounded by
`JOTHIDAM_SCHEDULER_HEARTBEAT_MAX_AGE_SECONDS`.

On SQLite (tests / offline dev) advisory locks do not exist; `SchedulerLease`
always returns `True` (single process, always leader).

## Manual trigger

The admin API exposes a manual trigger for any registered job:

```
POST /api/v1/admin/jobs/{job_id}/trigger
Authorization: Bearer <admin-token>
```

Example:

```bash
curl -X POST http://localhost:8000/api/v1/admin/jobs/daily_push_cron/trigger \
     -H "Authorization: Bearer $ADMIN_TOKEN"
```

This works regardless of which process owns the scheduler because
`register_all_jobs()` populates the in-process job registry on every startup.

## Crash behaviour

| Scenario | Outcome |
|---|---|
| Leader worker crashes | Advisory lock releases; supervision restarts and reacquires it |
| DB lock connection is lost | Leadership monitor fails the worker; supervision restarts it |
| APScheduler not installed | Worker exits non-zero; health remains failed |
| `_dispatch_for_user` raises per-user exception | Caught; `errors` counter incremented; other users unaffected |

## Relevant files

| File | Role |
|---|---|
| `app/services/daily_push_cron.py` | Job implementation |
| `app/scheduler.py` | Job registry + APScheduler wiring |
| `app/core/leader_lock.py` | PostgreSQL advisory lock |
| `app/worker.py` | Standalone worker entrypoint |
| `app/main.py` | In-web scheduler (lifespan) |
| `app/worker_health.py` | Durable-heartbeat worker health probe |
