#!/usr/bin/env bash
# Backend container entrypoint: apply forward-only migrations, then serve.
# Migrations run once per container start; the scheduler leader-lock ensures only
# one worker runs cron jobs even with WEB_CONCURRENCY > 1.
set -euo pipefail

if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  echo "[entrypoint] Applying database migrations (alembic upgrade head)..."
  alembic upgrade head
fi

HOST="${HOST:-0.0.0.0}"
PORT="${PORT:-8000}"
WORKERS="${WEB_CONCURRENCY:-1}"

echo "[entrypoint] Starting uvicorn on ${HOST}:${PORT} with ${WORKERS} worker(s)..."
exec uvicorn app.main:app --host "${HOST}" --port "${PORT}" --workers "${WORKERS}"
