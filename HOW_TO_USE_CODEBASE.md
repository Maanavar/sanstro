# How to Use This Codebase — Vinaadi AI

A comprehensive guide to tech stacks, third-party integrations, and how to run all apps locally.

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Third-Party Integrations & API Keys](#third-party-integrations--api-keys)
4. [Prerequisites & Setup](#prerequisites--setup)
5. [Running the Backend API](#running-the-backend-api)
6. [Running the Web App](#running-the-web-app)
7. [Running the Mobile App](#running-the-mobile-app)
8. [Running Unhosted Mobile App (Expo Go)](#running-unhosted-mobile-app-expo-go)
9. [Typical Dev Workflow](#typical-dev-workflow)

---

## Project Overview

**Vinaadi AI** is a Tamil-first bilingual astrology daily companion with three integrated apps:

- **Backend API** — FastAPI + PostgreSQL, astronomical calculations, subscription management
- **Web App** — Next.js 15 (desktop/laptop/web browser)
- **Mobile App** — Expo + React Native (iOS/Android, App Store/Play Store)

All code shares a single repository with a **pnpm workspace** for unified dependency management.

---

## Tech Stack

### Backend (Python)
| Component | Technology | Purpose |
|-----------|-----------|---------|
| Framework | **FastAPI** 0.115+ | REST API, async request handling |
| Database | **PostgreSQL** 16 | Persistent data storage (Docker) |
| ORM | **SQLAlchemy** 2.0+ | Database models + migrations |
| Migrations | **Alembic** 1.13+ | Version-controlled schema changes |
| Auth | **python-jose** + **bcrypt** | JWT tokens, password hashing |
| Encryption | **cryptography** + **Fernet** | Birth data encryption at rest |
| Scheduler | **APScheduler** 3.10+ | Cron jobs (dasha calculations, notifications) |
| PDF/Reports | **ReportLab** 4.0+ | Dynamic PDF generation |
| AI Integration | **Anthropic SDK** 0.40+ | Claude API for Ask Vinaadi (chat) |

### Web Frontend (TypeScript/JavaScript)
| Component | Technology | Purpose |
|-----------|-----------|---------|
| Framework | **Next.js** 15 | React, SSR, file-based routing |
| UI Library | **React** 19 | Component framework |
| Styling | **CSS/Tailwind** | Responsive design |
| Forms | **React Hook Form** 7.80+ | Form state management |
| Validation | **Zod** 4.4+ | Runtime schema validation |
| API | **fetch** + **TanStack Query** | Data fetching, caching |
| Motion | **Framer Motion** 12.40+ | Animations |
| Testing | **Vitest** 2.0+ | Unit tests, fast feedback |
| E2E Testing | **Playwright** 1.60+ | Browser automation tests |
| Linting | **ESLint** 8.57+ | Code quality (0 warnings enforced) |

### Mobile App (TypeScript/React Native)
| Component | Technology | Purpose |
|-----------|-----------|---------|
| Framework | **Expo** 54.0+ | React Native build tooling |
| Router | **Expo Router** 6.0+ | File-based navigation (like Next.js) |
| UI Library | **React** 19.1.0 | Component framework |
| React Native | **React Native** 0.81.5 | Cross-platform mobile runtime |
| Icons | **Lucide React Native** | SVG icon library |
| Storage | **Expo Secure Store** | Encrypted local storage |
| Notifications | **Expo Notifications** | Push notifications setup |
| Location | **Expo Location** | GPS/device location |
| Updates | **Expo Updates** | Over-the-air app updates |
| Analytics | **PostHog React Native** | Event tracking |
| Error Tracking | **Sentry React Native** | Crash reporting |
| Monetization | **RevenueCat** (IAP + subs) | In-app purchases, subscriptions |
| Ads | **Google Mobile Ads** | AdMob integration |
| Share | **React Native Share** | Native share dialogs |

### Shared Package (`@vinaadi/shared`)
- Shared TypeScript types and utilities used by both web and mobile
- No publish step — workspace-level sharing

### Infrastructure & DevOps
| Component | Technology | Purpose |
|-----------|-----------|---------|
| Package Manager | **pnpm** 11.8+ | Workspace orchestration, monorepo |
| Container Runtime | **Docker Desktop** | Local dev databases + mail server |
| DB Container | **postgres:16-alpine** | PostgreSQL dev/test databases |
| Email Dev | **MailHog** | Local email capture (SMTP + web UI) |
| DB Browser | **Adminer** | Web UI to inspect dev DB |
| Version Control | **Git** | Code history, branching |
| Cloud Builds | **EAS (Expo Application Services)** | Mobile CI/CD, cloud builds |
| Cloud Deployment | **TBD** | Backend (AWS/GCP/Heroku), Web (Vercel), Mobile (App Store/Play Store) |

---

## Third-Party Integrations & API Keys

### 1. **Anthropic (Claude API)** — Ask Vinaadi (AI Chat)
**What it does:** Enables AI-powered answers to user questions about astrology.

**Environment Variable:**
```env
JOTHIDAM_ANTHROPIC_API_KEY=sk-ant-...
```

**Where to get keys:**
- Sign up at https://console.anthropic.com
- Go to Settings → API Keys → Create Key
- Copy and paste into `.env`

**Usage:**
- Backend only; set in `app/core/config.py`
- If unset, POST `/api/v1/ask-vinaadi` returns 503 (feature disabled)

**Cost:** Pay-as-you-go, ~$0.0001 per question (Claude 3.5 Haiku)

---

### 2. **Firebase / Google Cloud** — Authentication & Realtime DB
**What it does:** Optional auth backend, data sync, storage.

**Status:** Referenced in web/mobile but not fully integrated yet
**Where to set up:** https://console.firebase.google.com

---

### 3. **RevenueCat** — Subscriptions & In-App Purchases (IAP)
**What it does:** Cross-platform subscription management (iOS/Android) without backend IAP logic.

**Environment Variables (Backend):**
```env
JOTHIDAM_REVENUECAT_WEBHOOK_SECRET=rck_live_...
```

**Environment Variables (Mobile):**
```env
# iOS sandbox key
REVENUECAT_PUBLIC_KEY=test_fbhUywZuBejYrSNxANSpQKfdMVD

# Android sandbox key (TODO in current setup)
REVENUECAT_ANDROID_KEY=apk_...
```

**Where to get keys:**
1. Sign up at https://www.revenuecat.com
2. Create a project for Vinaadi
3. **iOS:** Settings → Products → Copy Public Key
4. **Android:** Settings → Google Play → Copy Public Key (requires Google Play developer account)
5. **Webhooks:** Platform Settings → Webhooks → Copy Shared Secret
6. Paste into `.env` and `mobile/.env.local`

**Usage:**
- Mobile app uses RevenueCat SDK for purchases
- Backend listens for webhooks (subscription events) at POST `/api/v1/webhooks/revenuecat`
- If webhook secret is unset, webhook endpoint returns 503

**Cost:** Free tier up to 10K active subscribers

---

### 4. **Google Mobile Ads (AdMob)** — Mobile In-App Advertising
**What it does:** Display ads in the mobile app, earn revenue.

**Environment Variables (Mobile):**
```env
# Get from AdMob dashboard → App Details
ADMOB_ANDROID_APP_ID=ca-app-pub-...~...
ADMOB_IOS_APP_ID=ca-app-pub-...~...
```

**Where to get IDs:**
1. Sign up at https://admob.google.com
2. Create an app for each platform (iOS + Android)
3. Copy the App IDs into `mobile/.env.local`

**Usage:**
- Mobile app uses `react-native-google-mobile-ads`
- Integrated into ad slots throughout the app

**Cost:** Free; you earn from clicks/impressions

---

### 5. **Sentry** — Error & Crash Reporting
**What it does:** Tracks errors, crashes, and performance issues in production.

**Environment Variables (Mobile):**
```env
# Full ingest DSN (not the project URL)
SENTRY_DSN=https://<key>@o<orgId>.ingest.sentry.io/<projectId>
```

**Where to get DSN:**
1. Sign up at https://sentry.io
2. Create a project for Vinaadi (React Native for mobile)
3. Go to Project Settings → Client Keys (DSN)
4. Copy the full ingest URL

**Usage:**
- Mobile app: `@sentry/react-native` captures crashes
- Set as EAS secret for cloud builds: `eas secret:create --scope project --name SENTRY_DSN --value "..."`

**Cost:** Free tier (5K errors/month), paid plans for more

---

### 6. **PostHog** — Analytics & Feature Flags
**What it does:** Event tracking, user behavior analytics, A/B testing.

**Environment Variables (Mobile):**
```env
POSTHOG_API_KEY=phc_n9oXWq6Ln6ZRc44NEwmweXkYpBQNWdR7uvEzUGEhjatd
```

**Where to get key:**
1. Sign up at https://posthog.com
2. Create a project for Vinaadi
3. Copy the API Key from settings

**Usage:**
- Mobile app: `posthog-react-native` tracks events
- Set as EAS secret for cloud builds: `eas secret:create --scope project --name POSTHOG_API_KEY --value "phc_..."`

**Cost:** Free tier (1M events/month), paid for more

---

### 7. **FCM (Firebase Cloud Messaging)** — Push Notifications
**What it does:** Send push notifications to iOS/Android devices.

**Environment Variables (Backend):**
```env
JOTHIDAM_FCM_PROJECT_ID=vinaadi-...
JOTHIDAM_FCM_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

**Status:** Optional; if unset, push notifications are disabled (stub mode)

**Where to set up:**
1. Go to https://console.firebase.google.com
2. Create a project
3. Enable Cloud Messaging
4. Download service account JSON
5. Set env vars

---

## Prerequisites & Setup

### System Requirements
| Tool | Version | Required For | How to Install |
|------|---------|-------------|---|
| **Python** | 3.11+ | Backend | https://python.org |
| **Docker Desktop** | Latest | Postgres + MailHog | https://docker.com/products/docker-desktop |
| **Node.js** | 20+ | Web + Mobile | https://nodejs.org |
| **pnpm** | 9+ | Workspace manager | `npm install -g pnpm@11` |
| **Expo CLI** | Latest | Mobile local dev | `npm install -g @expo/cli` |
| **EAS CLI** | Latest | Mobile cloud builds | `npm install -g eas-cli` |

### Windows PowerShell Setup
The project uses **PowerShell** as the primary shell. Verify you have PowerShell 5.1+ (comes with Windows 10+):

```powershell
$PSVersionTable.PSVersion
# Should output: Major=5, Minor=1 or higher
```

---

## Running the Backend API

### 1. Start Docker Infrastructure
Before running anything, start the databases and mail server:

```powershell
Set-Location 'D:\sanstro'
docker-compose up -d
```

Verify containers are healthy:
```powershell
docker ps
```

| Container | Port | Purpose |
|-----------|------|---------|
| `slw-postgres` | 5432 | Dev database (`vinaadi_dev`) |
| `slw-postgres-test` | 5433 | Test database (`vinaadi_test`) |
| `slw-mailhog` | SMTP 1025 / UI 8025 | Local email catcher |
| `slw-adminer` | 8081 | Database browser |

### 2. First-Time Backend Setup

```powershell
Set-Location 'D:\sanstro'
cp .env.example .env
# Edit .env and fill in required secrets (see below)
.\dev.ps1 -Setup
```

This will:
1. Create Python `.venv` if missing
2. Install backend dependencies (`pip install -e .[dev]`)
3. Apply database migrations (`alembic upgrade head`)
4. Print success message

### 3. Daily Startup

```powershell
Set-Location 'D:\sanstro'
.\dev.ps1
```

This will:
1. Ensure venv exists
2. Apply any new migrations
3. Start `uvicorn` with hot-reload on **http://localhost:8000**

**Keep this terminal running** — the backend must be available for web/mobile apps.

### 4. Fill in `.env` Secrets

Edit `D:\sanstro\.env` with your API keys:

```env
# Database (required)
JOTHIDAM_DATABASE_URL=postgresql://slw_admin:slw_dev_password@localhost:5432/vinaadi_dev

# Auth (required for production, ephemeral in dev)
JOTHIDAM_JWT_SECRET=<generate: python -c "import secrets; print(secrets.token_urlsafe(48))">
JOTHIDAM_ADMIN_API_KEY=<generate: python -c "import secrets; print(secrets.token_urlsafe(32))">
JOTHIDAM_ENCRYPTION_KEY=<generate: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())">

# Optional: Anthropic (Ask Vinaadi)
JOTHIDAM_ANTHROPIC_API_KEY=sk-ant-...

# Optional: RevenueCat (subscription webhooks)
JOTHIDAM_REVENUECAT_WEBHOOK_SECRET=rck_live_...

# Optional: Email (leave as-is for MailHog in dev)
JOTHIDAM_SMTP_HOST=localhost
JOTHIDAM_SMTP_PORT=1025
JOTHIDAM_NOTIFICATION_FROM_EMAIL=noreply@vinaadi.local
```

### 5. Access Backend Tools

Once `dev.ps1` is running:

| URL | What it is |
|-----|-----------|
| **http://localhost:8000/docs** | Swagger/OpenAPI interactive docs |
| **http://localhost:8000/health** | Health check endpoint |
| **http://localhost:8081** | Adminer (database browser) — user: `slw_admin`, password: `slw_dev_password` |
| **http://localhost:8025** | MailHog (captured dev emails) |

### 6. Run Backend Tests

```powershell
Set-Location 'D:\sanstro'
$env:JOTHIDAM_DATABASE_URL = "postgresql://slw_admin:slw_dev_password@localhost:5433/vinaadi_test"
$env:JOTHIDAM_TEST_DB_RESET_ACK = "I_UNDERSTAND_THIS_WIPES_TEST_DB"
.\run-tests-safe.ps1 -StartTestDb
```

**Safety features:**
- Tests only run against `vinaadi_test` (separate container)
- Requires `JOTHIDAM_TEST_DB_RESET_ACK` env var (prevents accidents)
- Backs up `vinaadi_dev` before running
- Restore from backup: `.\restore-dev-db.ps1 -BackupFile .\backups\vinaadi_dev_YYYYMMDD_HHMMSS.sql`

---

## Running the Web App

### 1. Install Dependencies (First-Time Only)

```powershell
Set-Location 'D:\sanstro'
pnpm install
```

This installs all workspace packages: web, mobile, and shared.

### 2. Start Web Dev Server

```powershell
Set-Location 'D:\sanstro\web'
pnpm dev
```

Opens at **http://localhost:3000**

The web app automatically proxies API calls to `http://localhost:8000` (the backend).

### 3. Web Commands

```powershell
pnpm build      # Production build (validates everything builds)
pnpm start      # Serve production build locally
pnpm test       # Vitest unit tests (watch mode)
pnpm lint       # ESLint (0 warnings allowed)
```

### 4. Environment Variables (Optional)

Create `web/.env.local` to override the backend API URL:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

Leave unset if running locally on same machine (default is `localhost:8000`).

---

## Running the Mobile App

### **Quick Start — Expo Go on iPhone**

**Step 1: Install Expo Go on iPhone**
- Open App Store on your iPhone
- Search "Expo Go"
- Tap Install

**Step 2: Start the Metro Bundler on Your Laptop**

Terminal 1 — Keep backend running:
```powershell
(.venv) PS D:\sanstro> .\dev.ps1
```

Terminal 2 — Start mobile dev server:
```powershell
(.venv) PS D:\sanstro\mobile> pnpm start
```

You should see output like:
```
✔ Ready on http://localhost:8081
Use Expo Go to scan the following QR code:

[QR CODE DISPLAYED]

Press 'w' to open web, 'a' for Android, 'i' for iOS, 'j' for debugger
```

**Step 3: Scan QR Code from Your iPhone**

1. Ensure your **iPhone and laptop are on the SAME Wi-Fi network**
2. Open **Expo Go** app on your iPhone
3. Tap **Scan QR Code** (bottom right camera icon)
4. Point camera at the QR code in your laptop terminal
5. Wait 5–10 seconds for app to load
6. **App is now running on your iPhone!** 🎉

**Step 4: Make Changes & See Them Instantly**

- Edit any `.tsx` file in `D:\sanstro\mobile/`
- Save the file
- App reloads automatically on your iPhone (hot reload)
- No rebuild needed!

---

### **Setup for Web Browser (on Laptop)**

**Step 1: Start Backend & Metro (same as above)**

Terminal 1:
```powershell
(.venv) PS D:\sanstro> .\dev.ps1
```

Terminal 2:
```powershell
(.venv) PS D:\sanstro\mobile> pnpm start
```

**Step 2: Open in Web Browser**

In the Metro terminal, press **w** (for web):

```
Press 'w' to open web, 'a' for Android, 'i' for iOS, 'j' for debugger
> w
```

Your default browser opens automatically to **http://localhost:8081**

App now runs in web browser on your laptop! 🌐

**Step 3: Edit & Hot Reload**

Same as with iPhone:
- Edit `.tsx` file
- Save
- Browser refreshes instantly

---

### **Using Both Simultaneously (iPhone + Laptop Web)**

Want to test on both at the same time?

Terminal 1:
```powershell
(.venv) PS D:\sanstro> .\dev.ps1
```

Terminal 2:
```powershell
(.venv) PS D:\sanstro\mobile> pnpm start
```

Then:
1. Press **w** in terminal 2 → Opens web browser (http://localhost:8081)
2. Open **Expo Go** on iPhone → Scan QR code

Now you have both running! Changes sync to both instantly.

---

### **Configure API URL (iPhone on Different Network)**

If your iPhone can't reach `localhost:8000` (e.g., on different Wi-Fi), create `mobile/.env.local`:

```env
API_BASE_URL=http://<your-laptop-ip>:8000
```

Find your laptop's IP:
```powershell
ipconfig | Select-String "IPv4 Address"
```

Example output:
```
IPv4 Address . . . . . . . . . . : 192.168.1.50
```

So your `.env.local` would be:
```env
API_BASE_URL=http://192.168.1.50:8000
```

Save and restart `pnpm start` in mobile terminal.

---

### **More Mobile Options**

**Android Emulator (Windows)**
```powershell
(.venv) PS D:\sanstro\mobile> pnpm android
```
Launches Android emulator and installs app. Press 'r' to reload in terminal.

**All Available Commands**
```powershell
pnpm start       # Metro bundler + Expo dev server (press w/a/i/j)
pnpm android     # Build and run on Android emulator
pnpm ios         # Build and run on iOS simulator (macOS only)
pnpm tsc         # TypeScript type-check
pnpm lint        # ESLint on src/ and app/
```

---

### **Mobile Environment Variables**

Create `mobile/.env.local` for optional integrations:

```env
# Backend API (required if different from localhost:8000)
API_BASE_URL=http://192.168.1.50:8000

# AdMob (optional)
ADMOB_ANDROID_APP_ID=ca-app-pub-...~...
ADMOB_IOS_APP_ID=ca-app-pub-...~...

# RevenueCat (optional)
REVENUECAT_PUBLIC_KEY=test_fbhUywZuBejYrSNxANSpQKfdMVD
REVENUECAT_ANDROID_KEY=                 # TODO: Android key

# Sentry (optional, for crash reporting)
SENTRY_DSN=https://...@....ingest.sentry.io/...

# PostHog (analytics)
POSTHOG_API_KEY=phc_n9oXWq6Ln6ZRc44NEwmweXkYpBQNWdR7uvEzUGEhjatd
```

---

## Running Unhosted Mobile App (Expo Go)

**Expo Go** is a pre-built Expo client app that can run your unhosted app without building a native binary. Perfect for quick testing during development.

### How It Works

1. Run `pnpm start` in `mobile/`
2. Metro bundler generates JavaScript bundle + assets
3. Expo Go app downloads and runs the bundle
4. You can iterate instantly — no rebuild needed

### Getting Expo Go

**iOS (App Store):**
- Search "Expo Go" in App Store
- Install

**Android (Google Play):**
- Search "Expo Go" in Play Store
- Install

### Using Expo Go with Your Dev Server

**Same Wi-Fi (Recommended for Fast Testing):**

1. Ensure laptop and phone are on same Wi-Fi
2. Terminal in `D:\sanstro\mobile`, run:
   ```powershell
   pnpm start
   ```
3. In your laptop terminal, press **w** to see web browser option or **j** for emulator
4. Or: on your phone, open Expo Go → Scan QR code shown in terminal
5. App loads in ~5–10 seconds
6. Change code → save → see changes instantly (hot reload)

**Local USB (Android Only):**

1. Enable USB debugging on phone
2. Connect via USB
3. `adb reverse tcp:8081 tcp:8081` (so Expo runs locally)
4. Same workflow as Wi-Fi

**Remote (Not Recommended for Dev):**

Expo Go can tunnel to your dev server over the internet, but it's slower. Skip this unless testing from afar.

### Limitations of Expo Go

Expo Go runs most Expo APIs but does **not** run native modules that require compilation:
- Custom native code (Objective-C, Swift, Kotlin, Java)
- Libraries not in the Expo SDK that have native code

If you hit this, use **EAS Build** (below) to build a custom binary.

### Key Commands

```powershell
Set-Location 'D:\sanstro\mobile'
pnpm start            # Start Metro + Expo dev server
# In terminal, press:
# - 'a' for Android emulator
# - 'i' for iOS simulator (macOS)
# - 'w' for web browser
# - 'j' for debugger
# - 'r' to reload app
# - 's' to switch environment
```

---

## Cloud Builds with EAS (Expo Application Services)

### Purpose

EAS Build compiles your app in the cloud, producing App Store/Play Store-ready binaries.

### Prerequisites

```powershell
npm install -g eas-cli
eas login
```

Log in with your Expo account (same one as Expo Go).

### Build Profiles

`eas.json` defines build profiles:

| Profile | API | Use | Command |
|---------|-----|-----|---------|
| `development` | `http://192.168.1.7:8000` | Dev-client builds | `eas build --profile development` |
| `staging` | `https://staging.vinaadi.app` | Internal testing | `eas build --profile staging` |
| `production` | `https://api.vinaadi.app` | App Store / Play Store | `eas build --profile production` |

### Build for Android (Google Play Store)

```powershell
Set-Location 'D:\sanstro'

# First time: set EAS secrets for production build
eas secret:create --scope project --name SENTRY_DSN      --value "https://<key>@..."
eas secret:create --scope project --name POSTHOG_API_KEY --value "phc_..."

# Build production Android binary
eas build --profile production --platform android

# Submit to Play Store
eas submit --profile production --platform android
```

### Build for iOS (App Store)

```powershell
# Build production iOS binary
eas build --profile production --platform ios

# Submit to App Store
eas submit --profile production --platform ios
```

Note: iOS builds require Xcode and a Mac, or you can use EAS Build infrastructure.

### Build for Both Platforms at Once

```powershell
eas build --profile production --platform all
```

### View Build Logs

```powershell
eas build:list
# Copy build ID from list
eas build:view <build-id>
```

---

## Typical Dev Workflow

### **Option A: All Three Apps (Backend + Web + Mobile)**

Run in **4 separate PowerShell terminals:**

**Terminal 1 — Start Docker (once per session)**
```powershell
Set-Location 'D:\sanstro'
docker-compose up -d
```

**Terminal 2 — Backend API (keep running)**
```powershell
(.venv) PS D:\sanstro> .\dev.ps1
```
Listens on `http://localhost:8000` — Swagger at `http://localhost:8000/docs`

**Terminal 3 — Web App**
```powershell
(.venv) PS D:\sanstro\web> pnpm dev
```
Opens `http://localhost:3000` automatically

**Terminal 4 — Mobile App**
```powershell
(.venv) PS D:\sanstro\mobile> pnpm start
```
Press **w** for web browser or scan QR code with Expo Go on iPhone

**Result:**
- Web app: http://localhost:3000
- Mobile web: http://localhost:8081
- Mobile (iPhone): Scan QR code in Expo Go
- Backend: http://localhost:8000/docs

All changes hot-reload instantly! ⚡

---

### **Option B: Backend + Mobile Only (No Web)**

If you just want to test mobile:

**Terminal 1 — Backend**
```powershell
(.venv) PS D:\sanstro> .\dev.ps1
```

**Terminal 2 — Mobile**
```powershell
(.venv) PS D:\sanstro\mobile> pnpm start
```

Then scan QR code on iPhone with Expo Go.

---

### **Option C: Just Web App (Skip Mobile)**

If mobile isn't relevant:

**Terminal 1 — Backend**
```powershell
(.venv) PS D:\sanstro> .\dev.ps1
```

**Terminal 2 — Web**
```powershell
(.venv) PS D:\sanstro\web> pnpm dev
```

Opens `http://localhost:3000`

---

## Directory Structure

```
D:\sanstro/
├── app/                      # Backend (FastAPI)
│   ├── core/                 # Config, auth, encryption
│   ├── api/                  # REST endpoints
│   ├── services/             # Business logic
│   ├── models/               # SQLAlchemy ORM models
│   └── main.py               # FastAPI app
├── web/                      # Web app (Next.js 15)
│   ├── app/                  # File-based routes
│   ├── components/           # React components
│   ├── src/                  # Utilities, hooks
│   └── package.json
├── mobile/                   # Mobile app (Expo + React Native)
│   ├── app/                  # Expo Router file-based routes
│   ├── src/                  # Components, screens, hooks
│   ├── app.json              # Expo config
│   ├── eas.json              # EAS build profiles
│   └── package.json
├── packages/shared/          # Shared types & utilities
│   └── src/                  # TS shared code
├── migrations/               # Alembic DB migrations
├── docker-compose.yml        # Docker services (Postgres, MailHog)
├── .env.example              # Backend env template
├── dev.ps1                   # Backend dev server script
├── pnpm-workspace.yaml       # Workspace config
└── README.md                 # Main readme
```

---

## Common Issues & Troubleshooting

### Backend API won't start
**Problem:** `poetry.lock` or `requirements.txt` issues
**Solution:**
```powershell
rm -r .venv
.\dev.ps1 -Setup
```

### Mobile app can't connect to backend
**Problem:** App says "Failed to fetch from localhost:8000"
**Solution:**
1. Check your laptop IP: `ipconfig | Select-String "IPv4 Address"`
2. Set in `mobile/.env.local`:
   ```env
   API_BASE_URL=http://<your-ip>:8000
   ```
3. Ensure Wi-Fi is the same on both devices
4. Ensure backend API is running: `.\dev.ps1`

### Tests fail with "database is in use"
**Problem:** Test runner can't wipe the test DB
**Solution:**
1. Ensure you're pointing to `vinaadi_test` (port 5433), not `vinaadi_dev`
2. Stop any other pytest processes
3. Restart test container: `docker-compose down; docker-compose up -d`

### Migrations fail
**Problem:** Alembic won't apply a migration
**Solution:**
1. Check the migration file in `migrations/versions/`
2. Run manually to see the error: `.\.venv\Scripts\python.exe -m alembic upgrade head`
3. Fix the migration, then retry

### TypeScript errors in mobile
**Problem:** `pnpm tsc` shows errors
**Solution:**
```powershell
pnpm install          # Ensure dependencies are installed
pnpm tsc              # Check what's failing
```

---

## References

- **Backend:** FastAPI docs at http://localhost:8000/docs
- **Expo Docs:** https://docs.expo.dev
- **React Native Docs:** https://reactnative.dev
- **Next.js Docs:** https://nextjs.org/docs
- **SQLAlchemy:** https://docs.sqlalchemy.org
- **Anthropic API:** https://docs.anthropic.com

---

**Last Updated:** 2026-06-24
**Main Branch:** `main`
**Dev Branch:** `harden/production-readiness`
