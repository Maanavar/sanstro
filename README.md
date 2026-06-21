# Vinaadi AI

Tamil-first bilingual astrology daily companion. Backend: FastAPI + PostgreSQL. Frontend: Next.js 15. Mobile: Expo (React Native).

---

## Prerequisites

| Tool | Required for |
|------|-------------|
| Python 3.11+ | Backend |
| Docker Desktop | Postgres + MailHog |
| Node.js 20+ | Web app |
| pnpm 9+ | Workspace package manager |
| Expo CLI (`npm i -g @expo/cli`) | Mobile local dev |
| EAS CLI (`npm i -g eas-cli`) | Mobile cloud builds |

---

## 1. Infrastructure (Docker)

Start the databases and mail server before anything else.

```powershell
Set-Location D:\sanstro
docker-compose up -d
```

| Container | Purpose | Port |
|-----------|---------|------|
| `slw-postgres` | Dev database (`vinaadi_dev`) | 5432 |
| `slw-postgres-test` | Test database (`vinaadi_test`) | 5433 |
| `slw-adminer` | DB browser UI | 8081 |
| `slw-mailhog` | Local email catcher | SMTP 1025 / UI 8025 |

Stop everything: `docker-compose down`

---

## 2. Backend API (FastAPI)

### First-time setup

```powershell
Set-Location D:\sanstro
cp .env.example .env          # then fill in secrets (see below)
.\dev.ps1 -Setup              # creates .venv and installs all deps
```

### Daily start

```powershell
Set-Location D:\sanstro
.\dev.ps1
```

`dev.ps1` automatically:
1. Creates `.venv` if missing
2. Installs backend dependencies if not present
3. Runs `alembic upgrade head` (applies any pending migrations)
4. Starts `uvicorn` on **http://localhost:8000** with hot-reload

### Key backend URLs

| URL | What it is |
|-----|-----------|
| http://localhost:8000/docs | Swagger / interactive API docs |
| http://localhost:8000/health | Health check |
| http://localhost:8081 | Adminer (DB browser) |
| http://localhost:8025 | MailHog (caught dev emails) |

### Environment variables

All vars use the `JOTHIDAM_` prefix. Copy `.env.example` → `.env` and fill in:

```env
JOTHIDAM_DATABASE_URL=postgresql://slw_admin:slw_dev_password@localhost:5432/vinaadi_dev
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
| `JOTHIDAM_JWT_SECRET` | **Required in staging/production** — ephemeral in dev |
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

### Web commands

```powershell
pnpm build          # production build check
pnpm start          # serve the production build locally
pnpm test           # run Vitest unit tests
pnpm lint           # ESLint (0 warnings allowed)
```

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
Terminal 1  →  docker-compose up -d          (databases)
Terminal 2  →  .\dev.ps1                     (backend API on :8000)
Terminal 3  →  cd web && pnpm dev            (web on :3000)
Terminal 4  →  cd mobile && pnpm start       (Expo Metro on :8081)
```

---

## 7. Quick Reference

| Command | What it does |
|---------|-------------|
| `docker-compose up -d` | Start all containers |
| `.\dev.ps1` | Start backend (auto-migrates) |
| `.\dev.ps1 -Setup` | First-time backend install |
| `cd web && pnpm dev` | Start web dev server |
| `cd web && pnpm test` | Run web unit tests |
| `cd mobile && pnpm start` | Start Expo Metro bundler |
| `eas build --profile development` | Cloud build (dev client) |
| `eas build --profile production` | Cloud build (production) |
