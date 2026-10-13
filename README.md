# Vinaadi AI

Tamil-first bilingual astrology daily companion. Backend: FastAPI + PostgreSQL. Frontend: Next.js 15. Mobile: Expo (React Native).

---

## Read this first (two rules that trip up every new dev)

1. **Use `pnpm`, never `npm`, for project scripts.** This is a pnpm workspace
   (`workspace:*` dependencies, a single `pnpm-lock.yaml`). `npm install` /
   `npm run ...` **cannot resolve the workspace** and will break it. Wherever an
   older doc says `npm run build` / `npm test`, read it as `pnpm build` /
   `pnpm test`. (The only legitimate `npm` use is installing global CLIs like
   `npm i -g pnpm` / `@expo/cli` / `eas-cli`.)

2. **On this Windows machine the backend runs in Docker, not the host venv.**
   Smart App Control blocks the unsigned ephemeris DLL (`swe.dll`, WinError 4551),
   so `.\dev.ps1` installs fine but **crashes the moment it launches uvicorn**.
   Start the API with **`.\dev-docker.ps1`** instead. Migrations still run on the
   host (they don't touch that DLL). Details in `dev-docker.ps1`'s header comment.

Repo root is always `D:\sanstro`. Use **PowerShell**; chain with `;`, not `&&`.

---

## Prerequisites

| Tool | Required for |
|------|-------------|
| Python 3.11+ | Backend migrations on the host (venv) |
| Docker Desktop | Postgres, MailHog, **and the backend API** (see "Read this first") |
| Node.js 20+ | Web app |
| pnpm 11 (`npm i -g pnpm@11`) | Workspace package manager |
| Expo CLI (`npm i -g @expo/cli`) | Mobile local dev |
| EAS CLI (`npm i -g eas-cli`) | Mobile cloud builds |

---

## 1. Infrastructure (Docker)

Start the databases and mail server before anything else.

**One-time, ever** — create the external volume that holds the real dev data
(this is why `docker compose down -v` can never wipe it):

```powershell
Set-Location D:\sanstro
docker volume create vinaadi_dev_pgdata
```

**Every time** — start the containers:

```powershell
Set-Location D:\sanstro
docker compose up -d        # postgres + test DB + mailhog
docker compose ps           # confirm they're up
```

| Container | Purpose | Port |
|-----------|---------|------|
| `vinaadi-postgres` | Dev database (`vinaadi_dev`, real data) | 5434 (loopback only) |
| `slw-postgres-test` | Test database (`vinaadi_test`) | 5433 |
| `slw-mailhog` | Local email catcher | SMTP 1025 / UI 8025 |

`slw-postgres` (:5432) and `slw-adminer` (:8081), if you see them running, belong to
a different project. They are not part of Vinaadi.

Stop everything: `docker compose down` — **never** `docker compose down -v`.

---

## 2. Backend API (FastAPI)

> On this machine the API runs **inside a Linux container** via `dev-docker.ps1`,
> because the host venv is blocked by WinError 4551 (see "Read this first").
> `dev.ps1` is used only for the one-time dependency install.

### First-time setup

```powershell
Set-Location D:\sanstro
cp .env.example .env          # then fill in secrets (see below)
.\dev.ps1 -Setup              # creates .venv + installs backend deps (for migrations)
.\dev-docker.ps1 -Build       # builds the backend Docker image
```

Note: `.\dev.ps1 -Setup` installs the deps correctly, then tries to launch uvicorn
and **crashes on the WinError 4551 DLL block**. That crash is expected and harmless —
the venv is fully set up by then. Use `dev-docker.ps1` for the actual server.

### Daily start

```powershell
Set-Location D:\sanstro
.\.venv\Scripts\python.exe -m alembic upgrade head   # apply pending migrations (host)
.\dev-docker.ps1                                     # start the API container
```

`dev-docker.ps1` automatically:
1. Checks that `vinaadi-postgres` is running (fails by name if not)
2. Builds the image on first run (or when you pass `-Build`)
3. Starts `uvicorn` in the container on **http://localhost:8000** with hot-reload on `app\`
4. Waits for `/health`, warns if the image's deps have drifted from `requirements.txt`

Stop it: `.\dev-docker.ps1 -Stop`. Logs: `docker logs -f vinaadi-dev-api`.

> Run migrations on the **host** with `alembic` directly, as shown — **not**
> `.\dev.ps1 -Migrate` (that switch is declared but unwired; it runs the whole
> script and dies on uvicorn). Rebuild the image with `.\dev-docker.ps1 -Build`
> only when `requirements.txt` or `Dockerfile` changed.

### Key backend URLs

| URL | What it is |
|-----|-----------|
| http://localhost:8000/docs | Swagger / interactive API docs |
| http://localhost:8000/health | Health check |
| http://localhost:8025 | MailHog (caught dev emails) |

### Environment variables

All vars use the `JOTHIDAM_` prefix. Copy `.env.example` → `.env` and fill in:

```env
JOTHIDAM_DATABASE_URL=postgresql://slw_admin:slw_dev_password@localhost:5434/vinaadi_dev
JOTHIDAM_ENVIRONMENT=development
JOTHIDAM_JWT_SECRET=<64-char random string>
JOTHIDAM_ADMIN_API_KEY=<strong key>
JOTHIDAM_ENCRYPTION_KEY=<Fernet key>
```

Full variable reference:

| Variable | Notes |
|----------|-------|
| `JOTHIDAM_APP_NAME` | Display name |
| `JOTHIDAM_APP_VERSION` | Semver |
| `JOTHIDAM_ENVIRONMENT` | `development` / `staging` / `production` |
| `JOTHIDAM_DEBUG` | Boolean |
| `JOTHIDAM_HOST` / `JOTHIDAM_PORT` | Uvicorn bind |
| `JOTHIDAM_API_V1_PREFIX` | Route prefix (default `/api/v1`) |
| `JOTHIDAM_DATABASE_URL` | PostgreSQL connection string |
| `JOTHIDAM_JWT_SECRET` | **Required in staging/production** — ephemeral in dev. Must be at least as long as the signing hash (32 bytes for HS256) or production refuses to boot |
| `JOTHIDAM_JWT_SECRETS` | Rotation only: comma-separated, newest first. First signs, all verify, so a rotation signs nobody out. `docs/DATA_PROTECTION.md` §2a |
| `JOTHIDAM_ADMIN_API_KEY` | **Required in staging/production** |
| `JOTHIDAM_COOKIE_SECURE` | Set `true` in production (HTTPS only) |
| `JOTHIDAM_ANTHROPIC_API_KEY` | Enables Ask Vinaadi (AI chat) |
| `JOTHIDAM_REVENUECAT_WEBHOOK_SECRET` | Enables subscription webhooks |
| `JOTHIDAM_REDIS_URL` | Needed only for multi-worker / multi-box deploys |

`JOTHIDAM_JWT_SECRET` and `JOTHIDAM_ADMIN_API_KEY` are required for staging and production. Local development generates per-process ephemeral values when unset — tokens won't survive a restart.

### Running backend tests

```powershell
Set-Location D:\sanstro
$env:JOTHIDAM_DATABASE_URL = "postgresql://slw_admin:slw_dev_password@localhost:5433/vinaadi_test"
$env:JOTHIDAM_TEST_DB_RESET_ACK = "I_UNDERSTAND_THIS_WIPES_TEST_DB"
.\run-tests-safe.ps1 -StartTestDb
```

**Never run tests against `vinaadi_dev`.** The test suite wipes and recreates the schema. Two safety guards are enforced:
- DB name must contain `test` (e.g. `vinaadi_test`)
- `JOTHIDAM_TEST_DB_RESET_ACK` must be set exactly as shown
- DB must be `vinaadi_test` on `localhost:5433`

`run-tests-safe.ps1` also backs up `vinaadi_dev` before running tests. Restore from a backup:

```powershell
.\restore-dev-db.ps1 -BackupFile .\backups\vinaadi_dev_YYYYMMDD_HHMMSS.sql
```

---

## 3. Web App (Next.js)

### First-time setup

```powershell
Set-Location D:\sanstro
pnpm install          # installs all workspace packages (web + mobile + shared)
```

### Start dev server

```powershell
Set-Location D:\sanstro\web
pnpm dev
```

Opens at **http://localhost:3000**. The web app proxies to the backend at `http://localhost:8000` — keep `dev.ps1` running alongside it.

### Web commands (run from `D:\sanstro\web`)

```powershell
pnpm dev            # daily: dev server with hot-reload (http://localhost:3000)
pnpm build          # occasional: production build — a "does it compile for prod?" check
pnpm start          # serve the production build locally (needs a prior `pnpm build`)
pnpm test           # run Vitest unit tests
pnpm lint           # ESLint (0 warnings allowed)
```

**When to use which:** `pnpm dev` is your default, all day — no build step needed.
Use `pnpm build` only as a pre-ship sanity check (it catches type errors, bad
imports, and prerender failures that `pnpm dev` tolerates) or to reproduce a
production-only bug. Actual deploys build inside Docker (see §7) — you don't run
`pnpm build` by hand to deploy.

Create `web/.env.local` if you need to override the API base URL:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

---

## 4. Mobile App (Expo / React Native)

The mobile app lives in `mobile/` and is part of the pnpm workspace.

`mobile/.env.local` holds AdMob IDs, RevenueCat key, Sentry DSN, and PostHog key — edit as needed.

### Local development

```powershell
Set-Location D:\sanstro\mobile
pnpm start            # starts Metro bundler + Expo dev server
```

- Press **a** — Android emulator
- Press **i** — iOS simulator (macOS only)
- Scan QR code in **Expo Go** on a physical device

For a physical device on the same Wi-Fi, set in `mobile/.env.local`:

```env
API_BASE_URL=http://<your-local-ip>:8000
```

```powershell
pnpm android      # Android emulator directly
pnpm ios          # iOS simulator directly
pnpm tsc          # TypeScript check
pnpm lint         # ESLint on src/ and app/
```

### Cloud builds (EAS)

| Profile | API | Use for |
|---------|-----|---------|
| `development` | `http://192.168.1.7:8000` | dev-client builds |
| `staging` | `https://staging.vinaadi.app` | internal testing |
| `production` | `https://api.vinaadi.app` | App Store / Play Store |

```powershell
eas login
eas build --profile development --platform android
eas build --profile production  --platform all
eas submit --profile production --platform ios
eas submit --profile production --platform android
```

`mobile/.env.local` is gitignored and never sent to EAS. Set Sentry and PostHog keys as EAS secrets (once):

```powershell
eas secret:create --scope project --name SENTRY_DSN      --value "https://<key>@..."
eas secret:create --scope project --name POSTHOG_API_KEY --value "phc_..."
```

---

## 5. Shared Package

`packages/shared` is the `@vinaadi/shared` workspace package used by both web and mobile. Changes there are picked up immediately — no publish step needed.

---

## 6. Typical Dev Workflow

```
Terminal 1  →  docker compose up -d                              (databases)
Terminal 2  →  .\.venv\Scripts\python.exe -m alembic upgrade head  (migrations, host)
               .\dev-docker.ps1                                   (backend API on :8000)
Terminal 3  →  cd web ; pnpm dev                                  (web on :3000)
Terminal 4  →  cd mobile ; pnpm start                             (Expo Metro on :8081)
```

---

## 7. Quick Reference

| Command | What it does | When |
|---------|-------------|------|
| `docker compose up -d` | Start all containers | After a reboot |
| `.\.venv\Scripts\python.exe -m alembic upgrade head` | Apply DB migrations (host) | Daily start / after pull with a new migration |
| `.\dev-docker.ps1` | Start backend API (container, :8000) | Every day |
| `.\dev-docker.ps1 -Stop` | Stop backend API | End of session |
| `.\dev-docker.ps1 -Build` | Rebuild backend image | Only when `requirements.txt`/`Dockerfile` changed |
| `.\dev.ps1 -Setup` | First-time venv + backend deps | Once, ever |
| `docker volume create vinaadi_dev_pgdata` | Create the dev-DB volume | Once, ever |
| `pnpm install` | Install all JS workspace deps | First time / after lockfile change |
| `cd web ; pnpm dev` | Start web dev server (:3000) | Every day |
| `cd web ; pnpm build` | Production build check | Pre-ship sanity check |
| `cd web ; pnpm test` | Run web unit tests | After web changes |
| `.\run-tests-safe.ps1 -StartTestDb` | Run backend tests safely | After backend changes |
| `cd mobile ; pnpm start` | Start Expo Metro bundler | Mobile work |
| `eas build --profile development` | Cloud build (dev client) | Mobile cloud build |
| `eas build --profile production` | Cloud build (production) | Release |
