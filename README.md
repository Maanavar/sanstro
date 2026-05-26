# Vinaadi AI Backend Foundation

Sprint 0 backend starter for Vinaadi AI MVP 1.

## What is included

- FastAPI app entrypoint
- `/health` health check
- Environment-based settings
- Pytest setup
- Starter package layout for future calculation work

## Local setup

1. Create and activate a virtual environment.

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

2. Install the backend dependencies.

```powershell
pip install -e .[dev]
```

3. Create or refresh the database schema.

```powershell
python -m alembic upgrade head
```

4. Run the API locally.

```powershell
uvicorn app.main:app --reload
```


run the script
.\dev.ps1

5. Run the tests.

```powershell
.\run-tests-safe.ps1 -StartTestDb
```

Important: tests reset the database schema (drop + recreate tables). Always run them on a dedicated test database.
The repository now enforces two safety checks before any reset:
- DB name must include `test` (example: `vinaadi_test`)
- `JOTHIDAM_TEST_DB_RESET_ACK` must be set to `I_UNDERSTAND_THIS_WIPES_TEST_DB`
- DB must be exactly `vinaadi_test` on `localhost:5433`

By default, `run-tests-safe.ps1` also creates a backup of `vinaadi_dev` before tests run.
It also provisions a dedicated `slw_test_runner` role inside the test DB and runs tests through that role.

Restore dev data from a backup file:

```powershell
.\restore-dev-db.ps1 -BackupFile .\backups\vinaadi_dev_YYYYMMDD_HHMMSS.sql
```

Do not run `pytest` directly against your dev DB.

## Environment variables

The starter app reads settings from environment variables or a local `.env` file.

All variables use the `JOTHIDAM_` prefix to avoid collisions with system settings.

- `JOTHIDAM_APP_NAME`
- `JOTHIDAM_APP_VERSION`
- `JOTHIDAM_ENVIRONMENT`
- `JOTHIDAM_DEBUG`
- `JOTHIDAM_HOST`
- `JOTHIDAM_PORT`
- `JOTHIDAM_API_V1_PREFIX`
- `JOTHIDAM_DATABASE_URL`
- `JOTHIDAM_DEBUG`

## Notes

- Astrology calculation modules are intentionally not implemented yet.
- The backend structure is prepared for the MVP 1 calculation engine work.

## Web MVP

The Sprint 8 frontend lives in `web/`.

```powershell
cd web
npm install
npm run dev
```

For a production check:

```powershell
cd web
npm run build
```
