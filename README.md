# Jothidam.AI Backend Foundation

Sprint 0 backend starter for Jothidam.AI MVP 1.

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

5. Run the tests.

```powershell
pytest
```

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
