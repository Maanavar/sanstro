# Command sheet

Day-to-day commands for running, migrating, testing and building Vinaadi locally.
PowerShell 5.1, starting from the repo root unless a section says otherwise:

```powershell
Set-Location 'D:\sanstro'
```

Set these first in any window that runs Python which prints Tamil:

```powershell
$env:PYTHONIOENCODING = "utf-8"; $env:PYTHONUTF8 = "1"
```

## Daily startup

```powershell
Set-Location 'D:\sanstro'
.\.venv\Scripts\python.exe -m alembic upgrade head   # only when new migrations came in (see Database)
.\dev-docker.ps1                                     # backend on http://127.0.0.1:8000
Set-Location web; pnpm dev                           # web on http://localhost:3000
```

`dev-docker.ps1` does **not** apply migrations. It overrides the image entrypoint and
mounts only `app/`, so the container never sees new files in `migrations/`. Run alembic
on the host first, or the API will expect tables the database does not have.

## Backend

| Task | Command |
|---|---|
| Start (hot reload) | `.\dev-docker.ps1` |
| Start without the file watcher (~6% less idle CPU) | `.\dev-docker.ps1 -NoReload` |
| Rebuild the image first (after `requirements*.txt` changes) | `.\dev-docker.ps1 -Build` |
| Stop | `.\dev-docker.ps1 -Stop` |
| Different port | `.\dev-docker.ps1 -Port 8001` |
| Logs | `docker logs -f vinaadi-dev-api` |
| Health check | `Invoke-WebRequest -UseBasicParsing http://127.0.0.1:8000/health` |

Do not use `.\dev.ps1`. It applies migrations, then dies starting uvicorn because Smart
App Control blocks `swe.dll` in the host venv. Its `-Migrate` switch is never referenced
and does the same.

## Database

Dev data lives in `vinaadi-postgres` (:5434, `vinaadi_dev`). Never point Vinaadi at
`slw-postgres` (:5432), which belongs to another project.

| Task | Command |
|---|---|
| Revision the DB is at | `.\.venv\Scripts\python.exe -m alembic current` |
| Latest revision in code | `.\.venv\Scripts\python.exe -m alembic heads` |
| What is pending | `.\.venv\Scripts\python.exe -m alembic history -r current:head` |
| Apply migrations | `.\.venv\Scripts\python.exe -m alembic upgrade head` |
| Undo the last migration | `.\.venv\Scripts\python.exe -m alembic downgrade -1` |
| New migration | `.\.venv\Scripts\python.exe -m alembic revision -m "short description"` |
| Back up dev | `docker exec vinaadi-postgres pg_dump -U slw_admin vinaadi_dev > backup_$(Get-Date -Format 'yyyyMMdd_HHmm').sql` |
| Restore dev | `.\restore-dev-db.ps1 -BackupFile backup_20261101_1745.sql` |
| psql shell | `docker exec -it vinaadi-postgres psql -U slw_admin -d vinaadi_dev` |
| Start the containers | `docker compose up -d postgres` |

Before `upgrade head` on dev: back up, read each new file in `migrations\versions\`, and
confirm it has a real `downgrade()`. Alembic targets `JOTHIDAM_DATABASE_URL` from `.env`
(`localhost:5434/vinaadi_dev`). A value set in the shell overrides it, so check that the
variable is unset in that window. Backups match `backup_*.sql` and are gitignored.
Details: `docs/agent/database.md`.

## Backend tests

Tests always run on the test DB (`slw-postgres-test`, :5433, `vinaadi_test`), which they wipe.

| Task | Command |
|---|---|
| Full suite in a container (~80 min locally; CI ~14 min) | `.\test-docker.ps1` |
| Some files only | `.\test-docker.ps1 -Paths tests\test_x.py,tests\test_y.py` |
| Rebuild the test image first | `.\test-docker.ps1 -Build` |
| Python 3.14 / ffi binding | `.\test-docker.ps1 -Binding ffi` |
| Include the test that stalls locally | `.\test-docker.ps1 -IncludeStalled` |

`run-tests-safe.ps1` is the older host-venv runner. It imports the app, so it hits the
same `swe.dll` block. Local runs are not authoritative: CI decides, and a second pytest
run in another window wipes the shared test schema mid-run. More:
`docs/agent/testing-and-debugging.md`.

## Web (`web\`)

Run inside `web\`, or from the root as `pnpm --filter jothidam-ai-web <script>`.

| Task | Command |
|---|---|
| Dev server | `pnpm dev` |
| Production build | `pnpm build` |
| Serve the build | `pnpm start` |
| Lint | `pnpm lint` |
| Unit tests (Vitest) | `pnpm test` |
| E2E (Playwright; starts its own backend) | `pnpm test:e2e` |
| Visual regression | `pnpm test:visual` |
| Update visual baselines | `pnpm test:visual:baseline` |
| Theme contrast matrix | `pnpm test:contrast` |
| Screenshots | `pnpm screenshots` |

`pnpm build` fetches calendar data, so start the backend and let it warm up first. A
`--reload` restart empties its cache. Do not run `pnpm dev` while a build or E2E run is
using `.next`, because `next dev` wipes that directory.

## Mobile (`mobile\`)

| Task | Command |
|---|---|
| Expo dev server | `pnpm start` |
| Android / iOS build | `pnpm android` / `pnpm ios` |
| Type check | `pnpm tsc` |
| Lint | `pnpm lint` |
| Unit tests (Jest) | `pnpm test` |
| Maestro flows | `pnpm qa:maestro` |
| Touch-target audit | `pnpm qa:touch-targets` |

## Repo-wide QA (root)

| Task | Command |
|---|---|
| Colour-literal audit | `pnpm qa:colors` |
| Update its baseline | `pnpm qa:colors:update` |
| Colours + touch targets + visual | `pnpm qa:phase7` |
| Dashboard i18n catalogue | `pnpm i18n:dashboard` |

## Specialised scripts (`scripts\`)

| Script | Purpose |
|---|---|
| `scripts\e2e-backend.ps1` | Backend for Playwright, against the test DB. `pnpm test:e2e` starts it. |
| `scripts\ux-audit-stack.ps1` | Full stack for UX audits |
| `scripts\compose-proxy-smoke.ps1` | Smoke test of the compose proxy |
| `scripts\a12-migration-drill.ps1` | Encryption-migration drill (A12) |

## Containers

| Container | Port | Whose |
|---|---|---|
| `vinaadi-dev-api` | 8000 | Vinaadi backend (`dev-docker.ps1`) |
| `vinaadi-postgres` | 5434 | Vinaadi dev DB: real data |
| `slw-postgres-test` | 5433 | Vinaadi test DB: wiped by tests |
| `slw-mailhog` | 1025 / 8025 | Vinaadi mail catcher: SMTP on 1025, read sent mail at http://localhost:8025 |
| `slw-postgres`, `slw-adminer` | 5432, 8081 | Another project: do not touch |

`docker ps --format "{{.Names}}\t{{.Status}}\t{{.Ports}}"` lists what is running.
