# Vinaadi AI — Mobile App Implementation Blueprint

**Status:** Planning
**Owner:** _you_
**Target:** Production-grade Expo (React Native) app for iOS + Android, Tamil-first
**Last updated:** 2026-06-14

This is the concrete, repo-specific plan. It supersedes the high-level outline. Every
backend change, folder, and screen here is mapped to real code in this repository.

---

## 0. Guiding principles

1. **Native app, not a web wrapper.** Reuse the *backend* and *type contracts* aggressively;
   do not force Next.js components into React Native.
2. **Mobile talks to FastAPI directly.** Never go through the Next proxy
   (`web/app/api/backend/[...path]/route.ts`) and never rely on cookie behaviour from
   `web/lib/api.ts`.
3. **Bearer + refresh token auth.** Cookies are a browser concept; mobile uses tokens in
   secure storage.
4. **React Query owns server state.** No Redux. No Zustand for MVP.
5. **Tamil rendering is a first-class risk**, validated in Week 1, not Week 7.
6. **Ship the smallest lovable app.** MVP = login → onboarding → daily guidance →
   panchangam → notifications → settings. Everything else is Phase 2.

---

## 1. The honest starting point (audit results)

### What genuinely helps
- ~35 FastAPI routers covering the whole product (`app/api/*.py`).
- `get_current_user` already accepts `Authorization: Bearer` (`app/core/auth.py:59`).
- Bilingual `BiText { ta, en }` baked into every API type (`web/lib/types.ts:6`).
- Production-grade FCM sender already written (`app/services/fcm_service.py`).
- A complete TypeScript contract surface in `web/lib/types.ts` to seed the shared package.

### What is actually missing or wrong for mobile (verified in code)
| Gap | Evidence | Severity |
|-----|----------|----------|
| Login does not return a token to a non-browser client | `app/api/auth.py:123` sets cookie only; `AuthUserResponse` has no token field | **Blocker** |
| `/me`, `PATCH /me`, `DELETE /me` read the cookie directly, ignore Bearer | `app/api/auth.py:138,171,208` use `Cookie()`, not `get_current_user` | **Blocker** |
| No refresh token / rotation / revoke | nothing in `app/core/auth.py` or `app/models/user.py` | **Blocker** |
| One push token per user | single `fcm_device_token`; multi-device login overwrites | **High** |
| No Tamil font/render validation for Android | n/a — must test on device | **High** |
| No mobile app, secure storage, deep links, analytics, crash reporting | greenfield | expected |

---

## 2. Repository structure (monorepo)

Keep one repo. Introduce a shared package so contracts live in exactly one place.

```
sanstro/
├─ app/                      # FastAPI backend (unchanged location)
├─ web/                      # Next.js web (unchanged)
├─ mobile/                   # NEW — Expo app
│  ├─ app/                   # Expo Router routes (file-based)
│  ├─ src/
│  │  ├─ api/                # generated/handwritten API client + react-query hooks
│  │  ├─ components/         # shared RN UI primitives
│  │  ├─ features/           # feature folders (auth, onboarding, home, notifications…)
│  │  ├─ hooks/
│  │  ├─ lib/                # config, fonts, i18n, secure storage, query client
│  │  ├─ state/              # minimal context (auth/session, language)
│  │  └─ theme/              # tokens, typography (Tamil-aware)
│  ├─ assets/                # icons, splash, fonts (bundled Tamil font)
│  ├─ app.config.ts          # Expo config (envs, bundle ids)
│  ├─ eas.json               # EAS build profiles dev/staging/prod
│  └─ package.json
└─ packages/
   └─ shared/                # NEW — pure TS, no DOM, no RN, no Next
      ├─ src/
      │  ├─ types/           # moved from web/lib/types.ts
      │  ├─ format/          # date/score formatters (DOM-free parts of web/lib/format)
      │  ├─ i18n/            # language keys + UI-agnostic helpers
      │  └─ constants/       # enums, life-event types, channels
      └─ package.json
```

**Tooling decision:** use a workspace manager (pnpm workspaces or npm workspaces). `web/`
and `mobile/` both depend on `@vinaadi/shared`. Do **not** publish to npm — local workspace
link only.

**Do NOT move into shared (yet):** anything importing `window`/`document`, `web/lib/api.ts`
(cookie + Next proxy), firebase *web* messaging, CSS, Next components.

---

## 3. Backend changes (Phase 1 — must land before any screen)

These are additive and backwards-compatible. Web keeps working on cookies; mobile gets tokens.

### 3.1 New token model
Add a refresh-token table and rotation.

```
app/models/refresh_token.py     # token_id, user_id, token_hash, device_id,
                                 # expires_at, revoked_at, created_at, last_used_at
```
- Store only a **hash** of the refresh token (never plaintext).
- Access token: 15–30 min. Refresh token: 30–60 days, **rotated** on every use.
- Revoke on logout and on rotation reuse detection (security).

Migration: new table only — backwards-safe. Fill in `downgrade()` (drop table). Test on
`vinaadi_test` first per CLAUDE.md.

### 3.2 New mobile auth endpoints (`app/api/auth.py`, additive)
```
POST /auth/mobile/login      → { accessToken, refreshToken, expiresIn, user }
POST /auth/mobile/register   → same shape
POST /auth/mobile/refresh    → { accessToken, refreshToken, expiresIn }  (rotates)
POST /auth/mobile/logout     → 204  (revokes the presented refresh token)
```
Reuse `_verify_password` / `_hash_password` and `create_access_token`. The only difference
from web login is the response body carries the tokens instead of `Set-Cookie`.

### 3.3 Make identity endpoints Bearer-capable
Refactor `/me`, `PATCH /me`, `DELETE /me` to depend on `get_current_user` instead of
reading the cookie inline. `get_current_user` already supports both header and cookie, so
**this keeps web working** while enabling mobile. (Today these three handlers parse the
cookie by hand — that's the bug.)

### 3.4 Multi-device push tokens
```
app/models/device_token.py     # device_id (client-generated), user_id, fcm_token,
                                 # platform (ios/android), app_version, updated_at
POST /devices/push-token       # upsert by (user_id, device_id)
DELETE /devices/push-token     # on logout / permission revoke
```
Migrate the dispatcher (`app/services/notification_dispatch_service.py`) to fan out to all
active device tokens for a user, not the single `fcm_device_token`. Keep the old field
during transition; backfill, then deprecate.

### 3.5 CORS / origins / versioning
- Allow the mobile origin model (native apps send no `Origin`; ensure bearer paths don't
  require CORS preflight assumptions).
- Pin a contract: prefix mobile-critical endpoints or add an `X-Client: mobile` header for
  analytics/version gating. Document the MVP endpoint set (section 6).

### 3.6 Definition of done for Phase 1
- [ ] Refresh-token table + migration applied to `vinaadi_test`, verified up+down.
- [ ] 4 mobile auth endpoints return tokens; covered by pytest.
- [ ] `/me` family uses `get_current_user`; web regression test green.
- [ ] Device-token table + upsert endpoint; dispatcher fans out to N devices.
- [ ] OpenAPI doc lists the mobile auth + device endpoints.

---

## 4. Shared package extraction (Phase 2, overlaps Phase 1)

1. Create `packages/shared`, move `web/lib/types.ts` → `packages/shared/src/types`.
2. Re-export from `web/lib/types.ts` so web imports don't churn:
   `export * from "@vinaadi/shared/types";`
3. Move DOM-free formatters from `web/lib/format.ts` (date/score helpers; leave anything
   touching `Intl` browser quirks or DOM behind).
4. Move language keys / UI-agnostic i18n helpers from `web/lib/i18n.ts`.
5. Add CI step: typecheck `packages/shared` standalone (no DOM lib) to guarantee purity.

**Acceptance:** `web` builds unchanged; `mobile` can `import type { DailyGuidanceData } from
"@vinaadi/shared"`.

---

## 5. Mobile foundation (Phase 3)

### Stack
- Expo SDK (latest), **dev client** (not Expo Go — `expo-secure-store` needs native build).
- Expo Router (file-based nav).
- TypeScript strict.
- `@tanstack/react-query` + `@tanstack/react-query-persist-client` (offline cache).
- `expo-secure-store` (tokens), `@react-native-async-storage/async-storage` (RQ cache,
  prefs, last-good dashboard).
- `expo-notifications`, `expo-linking`, `expo-localization`.
- Sentry (`@sentry/react-native`) + a lightweight analytics client.

### API client (`mobile/src/api/client.ts`)
- Base URL from env per profile (dev/staging/prod).
- Attach `Authorization: Bearer <access>` from secure store.
- **401 interceptor:** single-flight refresh → retry once → on failure, clear session and
  route to login. Queue concurrent 401s behind one refresh.
- Typed wrappers returning `@vinaadi/shared` types. Do **not** port `web/lib/api.ts`
  (it's cookie/Next-proxy bound); reuse only its error-parsing shape.

### Data layer rule
Do **not** port `web/hooks/usePersonalData.ts` (a 200+ line imperative ref/abort
orchestrator). On mobile, use **one `useQuery` per domain** (guidance, panchangam, chart,
profile) with explicit cache policy:

| Data | staleTime | persist offline |
|------|-----------|-----------------|
| Daily guidance | 1 h | yes (last day) |
| Panchangam | 12 h | yes |
| Profile / settings | 24 h | yes |
| Notifications inbox | 1 min | no |

### Env / config
`app.config.ts` reads `EAS`/`.env` per profile → `API_BASE_URL`, `SENTRY_DSN`,
`ENV`. Bundle id `ai.vinaadi.app` (or your chosen reverse-DNS); separate dev/staging ids.

### Tamil rendering (do this Week 1, before screens)
- Bundle a known-good Tamil font (e.g. Noto Sans Tamil) in `assets/fonts`, load via
  `expo-font`; never rely on system Tamil fonts on Android.
- Test the hard clusters (`ைி`, `ோ`, `ஸ்ரீ`, grantha) on **Android API 29 / 31 / 33** and
  iOS, in both light/dark, at large accessibility font sizes.
- Decide line-height / letter-spacing tokens for Tamil vs Latin in `theme/typography`.

---

## 6. MVP scope lock

**MVP (ship to beta):**
Login/Signup · Forgot password · Birth-profile onboarding · Personal dashboard (today's
score, best/caution windows, emotional weather, alerts) · Daily guidance · Panchangam
summary · Notification settings + native push permission · Notification inbox ·
Profile/settings (language toggle, sign out, account basics).

**Phase 2:** Family vault · Dasha/transits · Chart visualisation · Porutham/tools · Journal ·
Share/export · Annual wrapped.

**Web-only for now:** Admin · QA dashboard · SEO content/guide pages.

### MVP backend endpoint contract (mobile depends only on these)
```
POST /auth/mobile/login | register | refresh | logout
GET  /auth/me                                   (Bearer)
POST /birth-profiles                            (app/api/birth_profiles.py)
GET  /charts… (calc/summary as needed by home)  (app/api/charts.py)
GET  /daily-guidance                            (app/api/daily_guidance.py)
GET  /panchangam (daily summary)                (app/api/panchangam.py)
GET/PATCH /settings/notifications               (app/api/notification_preferences.py)
GET  /notifications  (inbox)                     (app/api/notifications.py)
POST/DELETE /devices/push-token                  (NEW)
```
Confirm each returns Bearer-auth-friendly responses before screen work starts.

---

## 7. Screen build order (Phase 4)

1. **Auth** — login, signup, forgot-password, **session restore on launch** (read secure
   store → validate/refresh → route). Loading/empty/error states from day one.
2. **Onboarding** — birth profile (date/time/place). Native date+time pickers; place
   search; timezone capture; validation. This is the highest-friction screen — invest here.
3. **Home/Personal** — today's guidance + score, best/caution windows, emotional weather,
   alerts, panchangam summary. Pull-to-refresh. Offline last-good render.
4. **Notifications** — settings (channel, morning alert time, dasha, pirantha-naal, smart
   silence), native permission prompt flow, register device push token, inbox list.
5. **Settings/Profile** — language toggle (Tamil/English), profile edit, sign out (revoke
   refresh token + clear secure store), delete account, app version.

---

## 8. Native capabilities (Phase 5)

Must-have: Expo push (token registration → `POST /devices/push-token`); deep linking
(`vinaadi://` + universal/app links for notification taps → screen); Sentry crash
reporting; analytics events (login, onboarding complete, daily view, notif opt-in);
network-state handling; loading/empty/error states everywhere; privacy permission strings;
store metadata + Tamil localisation.

Recommended: persist React Query cache for read-mostly screens; offline read of last
dashboard/panchangam; biometric app-lock (Phase 2, once chart data is stored locally);
Expo Updates (OTA) with Tamil "update available" copy.

---

## 9. Quality & release (Phase 6)

Real-device matrix (≥1 low-end Android + 1 iPhone) · slow-network (throttled) · push
delivery (foreground/background/killed) · session expiry + refresh + reuse-revoke ·
background/foreground resume · **Tamil rendering QA** · timezone QA (birth tz vs device tz)
· deep-link QA · crash monitoring verified live · beta via **TestFlight** + **Play internal
testing**.

---

## 10. Decisions locked

| Decision | Choice |
|----------|--------|
| Auth | Bearer access (15–30 min) + rotating refresh (30–60 d) in `expo-secure-store` |
| State | React Query first; minimal Context for session+language; **no Zustand for MVP** |
| Navigation | Expo Router (file-based) |
| Family vault | **Phase 2** |
| Chart visualisation | **Phase 2** |
| Languages day 1 | **Both Tamil + English** (contracts already bilingual; cheap to ship) |
| Data hook style | per-domain `useQuery`; do **not** port `usePersonalData.ts` |
| Client → API | direct FastAPI; never the Next proxy |

---

## 11. Roadmap (calibrate to team size)

> The 8-week version assumes ~2 focused engineers. **Solo → expect 11–13 weeks** to a
> quality internal beta. Phase 1 backend auth is the critical path; do it first and well.

| Wk | Backend | Mobile |
|----|---------|--------|
| 1 | Refresh-token + device-token schema design; **Tamil render spike** | Repo/workspace setup, shared pkg start, font validation on Android |
| 2 | Mobile auth endpoints + `/me` refactor (Bearer) + tests | Expo dev-client, API client, secure storage, session bootstrap, env, EAS |
| 3 | Device push-token endpoint + dispatcher fan-out | Auth screens + session restore |
| 4 | Endpoint contract freeze + OpenAPI | Onboarding / birth-profile flow |
| 5 | — | Home dashboard + daily guidance + panchangam, loading/error states |
| 6 | — | Notification settings + native push + inbox + deep links |
| 7 | — | Profile/settings, offline last-state, Sentry/analytics, polish |
| 8 | bug-fix support | Device QA, perf pass, TestFlight + Play internal, Phase-2 backlog |

---

## 12. Top risks

1. Shipping cookie-style auth to mobile → **do the token contract properly first**.
2. Porting web UI/`usePersonalData` → slows the project and imports web complexity.
3. Underestimating cross-platform push (iOS entitlements, Android channels, killed-state).
4. Tamil rendering discovered late on Android → validate Week 1.
5. Loose MVP scope → the lock in §6 is the contract; defer the rest.

---

## 13. Immediate next actions

- [ ] Approve MVP scope (§6) and decisions (§10).
- [ ] Create `packages/shared` + workspace config; re-export types from web.
- [ ] Spike Tamil font on Android API 29/31/33.
- [ ] Write Phase-1 backend design doc (refresh token + device token) and migrations
      against `vinaadi_test`.
- [ ] Scaffold `mobile/` (Expo dev client + Router + React Query + secure store).
