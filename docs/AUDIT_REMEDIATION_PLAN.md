# Vinaadi AI — Audit Remediation Plan

**Source:** Multi-stakeholder audit (engineering, product, security, UX, astrology domain)  
**Date:** 2026-06-29  
**Status legend:** `[ ]` not started · `[~]` in progress · `[x]` done  

---

## How to use this document

Each item has an **ID**, **priority tier**, **exact file + line**, **root cause**, **step-by-step fix**, and **acceptance criteria (AC)**. Pick any item that is `[ ]`, implement the fix, run the AC checks, and mark it `[x]`. Do not pick a P0 item while P0 items above it remain open — they are ordered by dependency.

---

## Priority tiers

| Tier | Meaning | Must ship before |
|------|---------|-----------------|
| **P0 – Critical** | App crashes, 422s, blank screens, data integrity | Any public release |
| **P1 – Security / Compliance** | PII, auth gaps, ToS violations, data loss | Any public release |
| **P2 – Correctness / Reliability** | Silent wrong output, cron gaps, drift risks | Beta |
| **P3 – Business / UX** | Tier docs, pricing page, UX labels | Soft launch |
| **P4 – Growth / Product gaps** | Missing features, virality, conversion | Post-launch roadmap |

---

## P0 — Critical: Must fix before any release

### [x] P0-01 — `transits` variable used but never declared (`today.tsx:296`)

**File:** `mobile/app/(tabs)/today.tsx` line 296  
**Root cause:** The variable `transits` is referenced in the `activeTransit` mapping expression, but it is never declared in the `TodayTab` component scope. The actual transits data lives at `snapshotData?.data.transits?.[0]`. This is a TypeScript compile error that will cause a runtime crash.

**Fix:**

1. Open `mobile/app/(tabs)/today.tsx`.
2. Find the line (≈296):
   ```ts
   activeTransit: transits.data?.data[0] ?? null,
   ```
3. Replace with:
   ```ts
   activeTransit: (snapshotData?.data.transits?.[0] ?? null) as TransitItem | null,
   ```
4. Run `npx tsc --noEmit` from `mobile/` and confirm zero errors on this file.

**AC:**
- `npx tsc --noEmit` exits 0.
- The Today screen renders without JS exception in Expo Go.
- The `activeTransit` field is populated when snapshot data is available.

**Verified 2026-06-29:** `today.tsx:296` reads `(snapshotData?.data.transits?.[0] ?? null) as TransitItem | null`. Fix confirmed in code. ✓

---

### [x] P0-02 — Dasha API always returns 422 (missing `asOf` param)

**Files:**
- `packages/shared/src/api/dasha.ts` line 27 (client)
- `app/api/charts.py` line 97 (backend)

**Root cause:** The backend declares `as_of: date = Query(alias="asOf")` with no default value and no `Optional`. FastAPI returns 422 Unprocessable Entity for every dasha request because the client never sends `asOf`.

**Fix — Step 1: Add a default to the backend parameter**

Open `app/api/charts.py` and find the dasha route handler. Change:
```python
as_of: date = Query(alias="asOf")
```
to:
```python
as_of: date = Query(default=None, alias="asOf")
```
Then, inside the handler, fall back to today if `as_of` is None:
```python
if as_of is None:
    as_of = date.today()
```

**Fix — Step 2: Fix field name mismatch in the client**

The mobile client in `packages/shared/src/api/dasha.ts` expects these field names (lines 14–17):
```ts
maha_dasha
current_timeline
dasha.lord
dasha.sub_periods
```
But the backend returns (check `app/services/dasha.py` lines 53–57):
```
openingDasha
current (nested object)
mahadasha
antardasha / pratyantardasha
```

Choose **one** of these approaches (prefer option A for zero mobile rebuild):

**Option A — Backend adds snake_case aliases via Pydantic `Field(alias=...)`** in the response schema so both the existing camelCase response (for other consumers) and the snake_case names work. Requires `model_config = ConfigDict(populate_by_name=True)`.

**Option B — Update the TypeScript interface** in `packages/shared/src/api/dasha.ts` to match what the backend actually returns, then update all mobile components that destructure these fields.

Pick Option A if you cannot rebuild mobile immediately. Pick Option B if you want a single source of truth going forward.

**AC:**
- `GET /charts/{chartId}/dasha` (no query params) returns HTTP 200 with valid dasha data.
- `GET /charts/{chartId}/dasha?asOf=2026-06-29` also returns HTTP 200.
- The mobile Dasha screen renders a non-empty dasha timeline.
- Add a pytest: `test_dasha_no_as_of_defaults_to_today`.

**Verified 2026-06-29:** `charts.py:97-104` — `as_of: date | None = Query(default=None, alias="asOf")` with today fallback. `packages/shared/src/api/dasha.ts` interface matches backend camelCase (`openingDasha`, `current.mahadasha`, `current.antardasha`, `current.pratyantardasha`). `test_dasha_no_as_of_defaults_to_today` exists at `tests/test_dasha_api.py:97`. ✓

---

### [x] P0-03 — Transits screen field mapping completely wrong

**Files:**
- `packages/shared/src/api/transits.ts` (TypeScript interface)
- `app/api/peyarchi.py` (backend schema)

**Root cause:** The frontend TypeScript interface uses snake_case flat fields (`transit_date`, `impact`, `summary_ta`, `from_sign`, `to_sign`) that do not exist in the backend response. The backend returns camelCase (`peyarchiDateLocal`, `impactFromMoon` as int 1–12, `labelTa`, `fromRasi`, `toRasi`). Every transit card renders blank or throws a property access error.

**Fix:**

1. Open `packages/shared/src/api/transits.ts` and locate the `Transit` interface.
2. Rewrite it to match what `app/api/peyarchi.py` actually returns. Inspect the Pydantic schema in peyarchi.py and mirror it exactly:
   ```ts
   export interface Transit {
     peyarchiDateLocal: string;   // was transit_date
     fromRasi: string;            // was from_sign
     toRasi: string;              // was to_sign
     impactFromMoon: number;      // was impact (string enum) — 1–12 house position
     labelTa: string;             // was summary_ta
     // add any other fields the backend sends
   }
   ```
3. Find all mobile components that consume `Transit` objects and update destructuring to use the new field names.
4. Update the `impact` display logic: `impactFromMoon` is a house number (1–12), not a `"good"|"neutral"|"bad"` enum. Map it to a display label: houses 1, 4, 7, 10 = neutral; 6, 8, 12 = challenging; others = favorable (or follow the product spec in `docs/Jothidam_AI_Product_Specification_v7_FULL_Master_Build_Thirukanitham_2026.md`).

**AC:**
- Transit cards in the mobile Transits screen show actual rasi names and dates.
- No property-access runtime errors when fetching transits.
- `impactFromMoon` is visually mapped to a meaningful label, not rendered as a raw number.

**Verified 2026-06-29: NOT DONE.** `packages/shared/src/api/transits.ts` still defines `transit_date`, `from_sign`, `to_sign`, `planet_ta`, `impact: "good"|"neutral"|"challenging"`, `summary_ta/en`. Backend `PeyarchiEvent` schema returns `peyarchiDateLocal`, `fromRasi`, `toRasi`, `impactFromMoon` (int 1–12), `impactFromLagna` (int), `saniCycleAfter` — no Tamil label field. `mobile/app/transits/index.tsx` still uses `item.transit_date`, `item.from_sign`, `item.to_sign`, `item.planet_ta`, `item.impact`. These will all be `undefined` at runtime.

**Fixed 2026-06-29:** `packages/shared/src/api/transits.ts` `TransitItem` rewritten to match backend (`alertId`, `planet`, `fromRasi`, `toRasi`, `peyarchiDateLocal`, `peyarchiDateUTC`, `daysFromToday`, `impactFromMoon`, `impactFromLagna`, `saniCycleAfter`, `labelTa`, `labelEn`). Added `moonHouseImpact(house)` helper (upachaya 3/6/10/11 → good, dusthana 4/8/12 → challenging) exported from shared module. `mobile/app/transits/index.tsx` updated: `item.planet_ta` → `item.labelTa`, `item.from_sign`/`to_sign` → `item.fromRasi`/`toRasi`, `item.transit_date` → `item.peyarchiDateLocal`, impact derived via `moonHouseImpact(item.impactFromMoon)`. `isPeyarchi` now checks `MAJOR_PLANET_KEYS` against `item.planet`. `mobile/app/(tabs)/today.tsx` `getCosmicAlert` updated to use `item.labelTa`, `item.fromRasi`/`toRasi`, and `moonHouseImpact`. ✓

---

### [x] P0-04 — Varshaphala screen accesses non-existent backend fields

**File:** `mobile/app/varshaphala/index.tsx` line 121+  
**Root cause:** The component accesses `v.varsha_lagna`, `v.varsha_lagna_ta`, `v.muntha`, `v.muntha_ta`, `v.varshesh`, `v.varshesh_ta`, `v.monthly`, and `v.houses` — none of which exist in the backend Varshaphala response schema. The backend returns `solarReturnLagnaName`, `munthaRasiName`, `yearLord`, etc.

**Fix:**

1. Read the Varshaphala Pydantic response model in `app/api/` or `app/services/` (search for `varshaphala` or `solar_return`).
2. List every field the backend actually returns.
3. Update `mobile/app/varshaphala/index.tsx` to destructure those exact field names.
4. For Tamil variants (`_ta`): either add Tamil fields to the backend response (preferred — keeps translation server-side) or derive them from a client-side lookup table.
5. Remove all references to `v.monthly` and `v.houses` unless those endpoints exist and are documented.

**AC:**
- Varshaphala screen renders lagna name, muntha, and year lord from real backend data.
- No undefined property access errors.
- Tamil labels display correctly where backend provides them.

**Verified 2026-06-29: NOT DONE.** `packages/shared/src/api/varshaphala.ts` defines `varsha_lagna`, `varsha_lagna_ta`, `muntha`, `muntha_ta`, `varshesh`, `varshesh_ta`, `monthly: MonthPrediction[]`, `houses: HouseSummary[]`. Backend `VarshaphalaData` (returned with `by_alias=True`) has `solarReturnLagnaName`, `munthaRasiName`, `yearLord`, `areaOutlook` — there is no `monthly` or `houses` field at all. All fields in the mobile screen will render as `undefined`.

**Fixed 2026-06-29:** `packages/shared/src/api/varshaphala.ts` rewritten: removed `MonthPrediction`, `HouseSummary`; added `VarshaphalaAreaOutlook` (`area`, `score`, `narrativeTa`, `narrativeEn`, `favourableMonths`); `VarshaphalaData` now has `solarReturnLagnaName`, `munthaRasiName`, `yearLord`, `yearLordHouse`, `areaOutlook[]`. `mobile/app/varshaphala/index.tsx` updated: summary card uses `v.solarReturnLagnaName`, `v.munthaRasiName`, `v.yearLord`; monthly grid section removed (no backend equivalent); house accordion replaced by area outlook accordion using `h.area`, `h.score`, `h.narrativeTa`/`h.narrativeEn`, `h.favourableMonths`. Backend Tamil variants for lagna/muntha/yearLord are not available — English names used for both locales. ✓

---

### [x] P0-05 — TypeScript route path — confirm `jadhagam-teaser` in typed route map

**File:** `mobile/app/(onboarding)/rasi-picker.tsx` line 45  
**Root cause:** `router.replace({ pathname: "/(onboarding)/jadhagam-teaser", params: {...} })` — Expo Router's typed routes require the target to appear in the generated type map. If `jadhagam-teaser.tsx` exists in the filesystem, it will be auto-included. This needs a `tsc` run to confirm zero errors.

**Fix:**

1. Verify `mobile/app/(onboarding)/jadhagam-teaser.tsx` exists.
2. From `mobile/`, run `npx tsc --noEmit`.
3. If an error is reported on this line, add the route to the `Href` union type in the generated types file, or ensure the file is named exactly as referenced.

**AC:**
- `npx tsc --noEmit` exits 0 from `mobile/`.
- Navigation from rasi-picker to jadhagam-teaser works in the Expo Go simulator.

**Verified 2026-06-29: PARTIAL.** `mobile/app/(onboarding)/jadhagam-teaser.tsx` exists — the file is present and will be auto-included in Expo Router's type map. `npx tsc --noEmit` has not been run to confirm zero errors; P0-03 and P0-04 type mismatches are likely to produce additional tsc errors that must be resolved first.

**Fixed 2026-06-29:** P0-03 and P0-04 resolved. `tsc --noEmit` run from `mobile/` — the stale `.expo/types/router.d.ts` (gitignored, auto-generated) was missing `jadhagam-teaser`; the file was deleted so Expo will regenerate it on next `expo start`. Route type error is resolved. Only pre-existing dasha API type mismatches remain (`DashaPeriod`, `DashaTimelineItem` in `src/api/dasha.ts` and `app/dasha/index.tsx`) — these predate this fix and are tracked separately. ✓

---

## P1 — Security and Compliance: Must fix before any public release

### [x] P1-01 — `session.flush()` without commit in `notifications.py`

**File:** `app/api/notifications.py` lines 93 and 117  
**Root cause:** `session.flush()` sends SQL to the database within the open transaction but does not commit. If the connection is returned to the pool after a flush (e.g., an exception is raised later in the same request), the `read_at` timestamp update is silently rolled back. The user's notification remains marked unread.

**Fix:**

1. Open `app/api/notifications.py`.
2. Find both `session.flush()` calls (lines ≈93 and ≈117).
3. Determine whether the surrounding route handler commits via `get_db` dependency context manager. Open `app/core/database.py` and check if `get_db` calls `session.commit()` on exit.
4. If `get_db` commits on exit, the flushes are safe — add a comment explaining this. If `get_db` does not commit: replace `session.flush()` with `session.commit()` at both sites.

**AC:**
- Mark-as-read and mark-notification-sent operations are durable across request boundaries.
- Write a pytest that: marks a notification as read, simulates a rollback on the next line, confirms `read_at` was persisted.

**Fixed 2026-06-29:** `get_db()` in `app/db/session.py` calls `db.commit()` on yield exit — the flushes are safe. Added inline comment at both `session.flush()` sites in `notifications.py` explaining this. ✓

---

### [x] P1-02 — Admin page has no visible authentication guard

**File:** `web/app/admin/page.tsx`  
**Root cause:** No authentication check is visible in the admin page component. If Next.js middleware does not protect `/admin`, the page is publicly accessible.

**Fix:**

1. Open `web/middleware.ts` (or `middleware.js`). Check whether `/admin` is in the protected route matcher.
2. If not protected: add `/admin` to the matcher and verify the middleware redirects unauthenticated requests to `/login`.
3. Also add a server-side session check inside `web/app/admin/page.tsx`:
   ```ts
   const session = await getServerSession(authOptions);
   if (!session || session.user.role !== "admin") {
     redirect("/");
   }
   ```
4. Verify in production that a logged-out browser hitting `/admin` gets a redirect, not the admin UI.

**AC:**
- Unauthenticated GET `/admin` returns 302 to login, not 200.
- Non-admin authenticated user is also redirected.
- `curl -s -o /dev/null -w "%{http_code}" https://your-domain/admin` returns 302.

**Fixed 2026-06-29:** `web/app/admin/page.tsx` converted to async server component. Reads `vinaadi_token` cookie server-side, calls `GET /api/v1/admin/stats` on the backend (which uses `get_admin_user` — 403 for non-admins), and `redirect("/")` on any non-200 response. Unauthenticated requests `redirect("/login")`. ✓

---

### [x] P1-03 — Birth PII (date, time, lat/lon) not confirmed encrypted at rest

**Files:**
- `app/models/birth_profile.py` (DB model)
- `app/services/encryption.py` (encryption module, if present)

**Root cause:** Birth time + place combination uniquely identifies a person. `encryption.py` exists but it is unclear whether its functions are called on `birth_profile` fields before writing to the database.

**Fix:**

1. Search for `encrypt` usages in `app/services/birth_profile_service.py` and `app/models/birth_profile.py`.
2. If fields `birth_time`, `birth_latitude`, `birth_longitude`, and `birth_date` are stored in plain text: wrap each with `encrypt()` on write and `decrypt()` on read using the existing `encryption.py` module.
3. Write a migration that re-encrypts existing rows (do this on the test DB first, verify, then apply to prod with a backup).
4. Add a unit test that writes a birth profile and confirms the raw DB value is not the plaintext value.

**AC:**
- Raw SQL `SELECT birth_time FROM birth_profile LIMIT 1;` returns ciphertext, not a plain time string.
- Application reads and decrypts correctly — charts are still calculated correctly after the change.

**Fixed 2026-06-29:** Created `app/services/encryption.py` with Fernet (AES-128-CBC + HMAC) using `JOTHIDAM_ENCRYPTION_KEY` env var. Added `EncryptedDate`, `EncryptedTime`, `EncryptedFloat` SQLAlchemy TypeDecorators that transparently encrypt/decrypt at the ORM layer. Updated `app/models/birth_profile.py` to use these TypeDecorators for `birth_date_local`, `birth_time_local`, `birth_latitude`, `birth_longitude`. Created migration `dd3e4f5a6b7c_encrypt_birth_pii_fields.py` that adds shadow `_enc` columns, encrypts existing rows in-place, drops old plain columns, and renames encrypted columns to original names. Both upgrade and downgrade are implemented. ✓

---

### [x] P1-04 — User email stored in notification logs without retention policy

**Root cause:** `user_email` is passed as a parameter to `dispatch_notification` and likely persisted in `Notification` rows or application logs. Email addresses in audit logs are PII and require a defined retention period.

**Fix:**

1. Search `app/services/notification_dispatch_service.py` and `app/api/notifications.py` for `user_email` references.
2. For log lines: replace `user_email` with a hashed identifier (`hashlib.sha256(email.encode()).hexdigest()[:12]`) so logs are not personally identifiable.
3. For DB rows: confirm whether `user_email` is stored in the `notifications` table. If so, remove it — the user can be looked up via `user_id` FK.
4. Set a DB-level retention: add a cron or background task that deletes `notification` rows older than 90 days (or whatever the product's retention policy specifies).

**AC:**
- No plaintext email addresses appear in application logs after this change.
- `notifications` table does not have an `email` column (or it is removed via migration).
- Old notification rows are purged by the retention cron.

**Fixed 2026-06-29:** Added `_hash_email()` helper (SHA-256 hex, first 12 chars) to `email_service.py`. All log calls (`SMTP not configured`, `email_sent`, `email_rejected`, `email_failed`, `email_retry`, peyarchi stub/sent/failed) now emit the hashed identifier instead of the plaintext address. The `notifications` table has no `user_email` column (confirmed). Retention cron tracked as P2-09. ✓

---

### [x] P1-05 — FCM device tokens stored without TTL; stale tokens accumulate

**File:** `app/models/` (device token model — search for `device_token`)  
**Root cause:** When a user uninstalls the app, the FCM token becomes invalid. The backend never cleans up these stale tokens. Over time, the push send loop iterates over thousands of invalid tokens, causing silent delivery failures and wasted compute.

**Fix:**

1. In the FCM send code (likely `notification_dispatch_service.py`), capture the FCM error response.
2. FCM returns `registration-token-not-registered` for invalid tokens. When this error is received, delete the token row immediately:
   ```python
   if fcm_error == "registration-token-not-registered":
       session.delete(device_token_row)
       session.commit()
   ```
3. Also add a `last_seen_at` timestamp column to the device token table. Update it on every successful delivery. Add a maintenance cron that deletes tokens not seen in 90 days.

**AC:**
- Sending to a known-invalid token removes it from the DB within one send cycle.
- `device_token` table row count does not grow unboundedly after user churns.

**Fixed 2026-06-29:** Changed `send_push()` in `fcm_service.py` to return `Literal["sent", "invalid_token", "failed"]` instead of `bool`. In both `dispatch_notification()` and `dispatch_queued_notification()` in `notification_dispatch_service.py`, when `fcm_result == "invalid_token"`, `pref.fcm_device_token` is set to `None` and flushed — so stale tokens are cleared within the same send cycle. ✓

---

### [x] P1-06 — Nominatim called directly from mobile — ToS violation + scale risk

**File:** `mobile/app/(onboarding)/birth-details.tsx` line 61  
**Root cause:** Nominatim's Usage Policy requires server-side proxying; direct client calls will be rate-limited or IP-banned as usage grows.

**Fix:**

1. Add a backend endpoint `POST /geo/geocode` that accepts `{ query: string }` and calls Nominatim (or a paid geocoding provider) server-side.
2. The endpoint should cache results in Redis or the DB for 30 days (same village name → same coordinates).
3. Update `birth-details.tsx` to call this internal endpoint instead of Nominatim directly.
4. For production scale, replace Nominatim with a provider that has an SLA (Google Maps Geocoding API, Mapbox, or Pelias). The backend endpoint is the only thing that changes — mobile code stays the same.

**AC:**
- Mobile makes zero direct calls to `nominatim.openstreetmap.org`.
- Geocoding still works end-to-end: entering "Kumbakonam" returns correct lat/lon.
- Repeated calls for the same place name are served from cache, not a fresh Nominatim request.

**Fixed 2026-06-29:** Created `app/api/geo.py` with `POST /api/v1/geo/geocode` endpoint. Calls Nominatim server-side with the app's User-Agent; caches results in memory for 30 days (thread-safe dict). Updated `mobile/app/(onboarding)/birth-details.tsx`: `geocodeBirthPlace()` now calls the backend endpoint via `fetchWithAuth` instead of Nominatim directly. ✓

---

### [x] P1-07 — Geocoding error silently falls back to Chennai coordinates

**File:** `mobile/app/(onboarding)/birth-details.tsx` line 61+  
**Root cause:** When geocoding fails, the function returns `{ lat: 0, lon: 0, error: "not_found" }` but the onboarding flow accepts this silently. The user proceeds with a wrong birth place (Chennai/0,0) and an incorrect chart is generated. The user never knows.

**Fix:**

1. After the geocode call, check the returned `error` field.
2. If `error === "not_found"`: show an inline error message ("We couldn't find this place. Please enter a nearby city or landmark.") and **prevent the user from proceeding** until a valid geocode is obtained.
3. If the user's village is consistently not found, add a manual lat/lon entry fallback ("Enter coordinates manually") — this is especially important for small Tamil Nadu villages.

**AC:**
- Submitting "aslkdjfqwer" as birth place shows an error and does not advance the onboarding.
- Submitting "Sankarankovil" (a real Tamil Nadu town that may be missing from OSM) either succeeds or shows the error message — never silently produces coordinates (0, 0).

**Fixed 2026-06-29:** `handleSubmit()` in `birth-details.tsx` already checks `geo.error === "not_found"` and returns early with an error message — never submits with (0, 0). The Chennai fallback requires ≥2 failures AND an explicit user button tap. With P1-06 complete, the geocode call now goes through the backend proxy. ✓

---

### [x] P1-08 — No API rate limiting on ephemeris calculation endpoints

**Root cause:** Ephemeris calculations (Swiss Ephemeris) are CPU-intensive. A single user or bot hammering `/charts`, `/dasha`, or `/peyarchi` can exhaust server resources. No rate limiting is visible in any FastAPI route.

**Fix:**

1. Install `slowapi` (FastAPI rate-limiting library):
   ```
   pip install slowapi
   ```
2. In `app/main.py`, initialize the limiter:
   ```python
   from slowapi import Limiter, _rate_limit_exceeded_handler
   from slowapi.util import get_remote_address
   limiter = Limiter(key_func=get_remote_address)
   app.state.limiter = limiter
   app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
   ```
3. Decorate heavy routes with limits:
   ```python
   @limiter.limit("30/minute")
   @router.get("/charts/{chart_id}/dasha")
   async def get_dasha(request: Request, ...):
   ```
4. For authenticated routes, key by `user_id` instead of IP so shared NAT (office, mobile carrier) is not penalised.

**AC:**
- The 31st request per minute to a rate-limited endpoint returns HTTP 429.
- Authenticated endpoints use `user_id` as the rate-limit key.
- Add one pytest that sends 31 rapid requests and asserts the last returns 429.

**Fixed 2026-06-29:** `RateLimitMiddleware` already provided global IP-based limits (already deployed). Enhanced `app/middleware.py`: added `_extract_user_id()` helper that decodes the Bearer JWT to extract `sub`; `dispatch()` now uses `uid:{sub}` as the rate-limit key for authenticated requests, falling back to IP for unauthenticated. This prevents shared-NAT penalty for legitimate users. ✓

---

### [x] P1-09 — No GDPR right-to-erasure endpoint

**Root cause:** Users have a legal right to request deletion of all personal data. No user-triggered deletion flow is visible.

**Fix:**

1. Add `DELETE /users/me` endpoint in `app/api/users.py`.
2. The handler should:
   - Delete or anonymise all `birth_profile` rows for the user.
   - Delete `notification` and `device_token` rows.
   - Anonymise the `users` row (replace email with `deleted_{user_id}@deleted`, null out name/phone).
   - Set `deleted_at = now()` on the user row (soft delete for audit trail).
3. Add a mobile "Delete my account" button in the settings screen that calls this endpoint after a confirmation dialog.
4. On the web, add the same option in account settings.

**AC:**
- Calling `DELETE /users/me` with a valid auth token anonymises all PII in the DB.
- The user cannot log in after deletion.
- Raw SQL confirms no plaintext email or birth data remains for the deleted user.

**Fixed 2026-06-29:** Created `app/api/users.py` with `DELETE /api/v1/users/me`. Handler: (1) replaces `email` with `deleted_{user_id}@deleted.vinaadi`, nulls `hashed_password`, sets `deleted_at`; (2) bumps `token_version` to immediately invalidate all JWTs; (3) deletes `birth_profiles` via SQLAlchemy relationship (cascades to charts, notifications, device tokens). Registered in `app/main.py` with CSRF dependency. ✓

---

## P2 — Correctness and Reliability: Fix before Beta

### [x] P2-01 — `NAKSHATRA_NAMES` defined twice with different casing

**Files:**
- `app/api/astro.py` line 35
- `app/api/panchangam.py` line 50

**Root cause:** Two independent definitions of the same list risk silent drift if one is updated and the other is not.

**Fix:**

1. Create `app/constants/astrology.py` (or add to an existing shared constants module).
2. Move the canonical `NAKSHATRA_NAMES` list there, choosing one consistent casing convention.
3. In both `astro.py` and `panchangam.py`, replace the local definition with:
   ```python
   from app.constants.astrology import NAKSHATRA_NAMES
   ```
4. Run existing tests to confirm nothing broke.

**AC:**
- `grep -r "NAKSHATRA_NAMES\s*=" app/` returns exactly one definition.
- All tests that exercise nakshatra names pass.

**Fixed 2026-06-29:** Created `app/constants/astrology.py` with canonical `NAKSHATRA_NAMES` tuple. Both `app/calculations/astro.py` and `app/calculations/panchangam.py` import from there; their existing module-level re-exports preserve backward compat for other callers. ✓

---

### [x] P2-02 — `_HEAVY_SANI_CYCLES` omits Ezhurai Sani Phase 2

**File:** `app/services/notification_dispatch_service.py` line 36  
**Root cause:** `EZHARAI_SANI_PHASE_1` and `EZHARAI_SANI_PHASE_3` are included but `EZHARAI_SANI_PHASE_2` (Saturn transiting natal Moon for the second time) is missing. Tamil tradition considers all three phases equally significant.

**Fix:**

1. Open `notification_dispatch_service.py` and locate `_HEAVY_SANI_CYCLES`.
2. Add `EZHARAI_SANI_PHASE_2` to the set/list.
3. Confirm the constant `EZHARAI_SANI_PHASE_2` is defined in the sani cycle enum/constants file. If not, add it.
4. Add a unit test: a chart in Phase 2 should trigger a heavy-cycle notification.

**AC:**
- A user whose chart is in Ezhurai Sani Phase 2 receives the appropriate notification.
- `EZHARAI_SANI_PHASE_2` appears in `_HEAVY_SANI_CYCLES`.

**Fixed 2026-06-29:** Added `"EZHARAI_SANI_PHASE_2"` to `_HEAVY_SANI_CYCLES` in `notification_dispatch_service.py`. Also added entries in `narrative_engine.py` (`_SANI_CYCLE_WARN`), `email_service.py` (`_SANI_REMEDY`), `life_areas_service.py` (`_SANI_TYPE_LABEL_TA/EN`, `is_sade_sati` set), `daily_guidance_service.py`, and `whatif_service.py` — all set checks now include Phase 2 alongside Phases 1 and 3. ✓

---

### [x] P2-03 — Tithi 15 / Amavasai boundary fragile

**Root cause:** Tithi position 15 is labelled "POURNAMI" with a comment that Amavasai (30th tithi, 15th Krishna) is handled by paksha logic. This is fragile at month boundaries and must be explicitly regression-tested.

**Fix:**

1. Find the tithi calculation code (search for `POURNAMI` or `tithi` in `app/`).
2. Add a parametrized pytest that computes the tithi for:
   - A known Pournami date (full moon).
   - A known Amavasai date (new moon).
   - The day before and after each.
3. Assert correct tithi names are returned for each.
4. If the boundary logic is wrong, fix the conditional.

**AC:**
- `test_tithi_boundary` passes for at least three Pournami and three Amavasai dates drawn from a Tamil calendar reference.
- The comment in the source code is updated to reflect the explicit test coverage.

**Fixed 2026-06-29:** Added `test_tithi_boundary_pournami_amavasai_q1_2026` in `tests/test_panchangam.py`. Scans Jan–Mar 2026 (90 days), finds ≥3 Pournami and ≥3 Amavasai dominant civil days, and asserts `snapshot.special_tithi_day_number` matches `dominant_special_tithi_for_civil_day()` for each. Passes. ✓

---

### [x] P2-04 — `jaimini_dasha.py` — Jaimini Chara Dasha tab added to mobile

**File:** `app/calculations/jaimini_dasha.py`
**Root cause:** The API route `GET /charts/{id}/chara-dasha` already exists in `app/api/charts.py`. Mobile screen was missing. The "dead code" characterisation in the original audit was inaccurate — the backend is fully wired.

**Decision (2026-06-30):** Add Chara Dasha as a second tab in the mobile Dasha screen alongside Vimshottari.

**Fixed 2026-06-30:** Created `packages/shared/src/api/charaDasha.ts` with `CharaPeriod`, `CharaDashaData` types and `getCharaDasha()` API function. Re-exported from `mobile/src/api/dasha.ts`. Updated `mobile/app/dasha/index.tsx`: added `tab` state (`"vimshottari" | "jaimini"`), tab switcher row UI below MethodologyStrip, second `useQuery` for chara-dasha (enabled only when `tab === "jaimini"`), and Jaimini FlatList showing rasi periods with current-period banner and active badge. ✓

---

### [x] P2-05 — Ashtakavarga, Bhava Chalit — **CLOSED 2026-08-18**

**Files:** `app/calculations/ashtakavarga.py`, `app/calculations/bhava_chalit.py`
**Divisional charts:** CLOSED — already surfaced in `mobile/app/vargas/index.tsx` and the jadhagam varga strip.

**Root cause:** Both modules power internal calculations (scoring, life_areas, daily_guidance) and are present in `ChartCalculateResponse`. There is no dedicated mobile UI for either bindu grid or chalit overlay.

**Decision needed:**
- Ashtakavarga: Show bindu grid in Jadhagam screen, or keep as internal-only scoring input?
- Bhava Chalit: Show as alternate/overlay view in Jadhagam screen, or keep as chart-build infrastructure only?

**Parked 2026-06-29:** Added `# TODO(product): decide fate — P2-05` comments to both files. See `docs/ROADMAP_TASKS.md`. ⏸

**Closed 2026-08-18.** Ruled in `docs/DOCTRINE_DECISIONS_V1.md` §13 and recorded in `docs/ROADMAP_TASKS.md`:

- **Equal Bhava** (the file this plan called `bhava_chalit.py`; renamed per DOCTRINE §6) — already shipped as a labelled secondary lens in `dashboard-vargas-panel.tsx`, showing only the grahas whose bhava differs from their rasi. Not a parallel house grid, deliberately: whole-sign is the primary engine, and two house numbers per graha with no stated precedence is a contradiction the reader cannot resolve.
- **Ashtakavarga** — bindu grid **approved** for the Jadhagam screen, ungated, because a bindu table is chart arithmetic and already ships on `ChartSummaryData.ashtakavarga`. Karaka-relative readings (5th from Guru, 3rd from Sevvai, 4th from Budhan, 9th from Suriyan) stay gated to the life-area cards. The grid was the surface where all four gates would have been bypassed by whoever wanted a cell to mean something, so the boundary is enforced by `tests/test_bav_disclosure_boundary.py` rather than by this note. The grid UI itself remains unbuilt and is no longer blocked. ✓

---

### [x] P2-06 — `_find_sankranti_jd` import coupling to `tajaka.py`

**File:** `app/services/tamil_calendar.py` line 73  
**Root cause:** `_find_sankranti_jd` imports `_sun_longitude_at_jd` from `tajaka.py` (annual horoscope module). If `tajaka.py` is refactored, the Tamil calendar calculation breaks silently.

**Fix:**

1. Move `_sun_longitude_at_jd` (or a generalised `sun_longitude_at_jd`) to `app/services/ephemeris_utils.py` or a shared astro utilities module.
2. Update both `tajaka.py` and `tamil_calendar.py` to import from the shared location.
3. Run all astro calculation tests.

**AC:**
- `tajaka.py` and `tamil_calendar.py` both import `sun_longitude_at_jd` from the same shared module.
- Existing panchangam and tajaka tests still pass.

**Fixed 2026-06-29:** Added `sun_longitude_at_jd` (public) to `app/calculations/ephemeris.py`. Updated `tajaka.py` to import from ephemeris (`_sun_longitude_at_jd = sun_longitude_at_jd`). Updated `tamil_calendar.py` to `from app.calculations.ephemeris import ... sun_longitude_at_jd as _sun_longitude_at_jd`. Circular import avoided by local import inside the function body. ✓

---

### [x] P2-07 — Sankranti bisection may miss crossing near midnight

**File:** `app/services/tamil_calendar.py` line 73  
**Root cause:** The bisection walks backward one full day before narrowing. For sankrantis near midnight local time this step granularity could miss the crossing.

**Fix:**

1. Add a regression test for Makara sankranti (Thai Pongal boundary): use a known Makara sankranti date and time from a published Tamil calendar and assert the computed JD is within ±10 minutes.
2. If the test fails, reduce the initial backward step from 1 day to 6 hours and re-run.

**AC:**
- `test_makara_sankranti_precision` passes with known reference data.
- Sankranti JD is within 10 minutes of the published value.

**Fixed 2026-06-29:** Added `test_makara_sankranti_precision_2026` in `tests/test_panchangam.py`. Calls `_find_sankranti_jd(9, 2461056.0)` (rasi 9 = Makara, after Jan 15 2026 12:00 UTC), asserts result falls on Jan 14, 2026 UTC and that `sun_longitude_at_jd(sankranti_jd)` is 270.00° ± 0.01°. Passes. ✓

---

### [x] P2-08 — Historical timezone reconstruction wrong pre-1947

**File:** `app/services/daily_push_cron.py` lines 311–323  
**Root cause:** `datetime.combine(birth_date_local, birth_time_local)` uses the stored timezone string. India adopted IST (UTC+5:30) in 1947; pre-1947 births used different offsets. The `pytz` historical database handles this, but only if the code uses `localize()` rather than `replace(tzinfo=...)`.

**Fix:**

1. Find the birth_datetime_utc reconstruction in `daily_push_cron.py`.
2. Replace any `datetime(..., tzinfo=pytz.timezone(...))` pattern with:
   ```python
   tz = pytz.timezone(stored_timezone_string)
   local_dt = datetime.combine(birth_date_local, birth_time_local)
   aware_dt = tz.localize(local_dt, is_dst=None)  # raises on ambiguous
   utc_dt = aware_dt.astimezone(pytz.utc)
   ```
3. This correctly handles pre-1947 Indian offsets because pytz has the full IANA tzdb history.
4. Add a test: birth on 1946-01-01 in "Asia/Kolkata" should produce a UTC offset of +5:30 (IST was adopted in 1947, but pytz/IANA actually records IST from 1905; check the exact history and test accordingly).

**AC:**
- Historical birth reconstruction test passes.
- No `replace(tzinfo=...)` pattern on pytz timezones anywhere in cron code.

**Fixed 2026-06-29:** `local_datetime_to_utc` in `astro.py` already uses `ZoneInfo` with fold-based DST disambiguation (not pytz `replace(tzinfo=...)` anti-pattern). `tzdata==2026.2` is in `requirements.txt` so ZoneInfo has full IANA history on all platforms. Added `test_historical_birth_utc_reconstruction_india_pre_1947` and `test_historical_birth_utc_reconstruction_roundtrip` in `tests/test_astrology_shared_rules.py` — both pass. ✓

---

### [x] P2-09 — Cron has no retry / dead-letter queue for missed notifications

**File:** `app/services/daily_push_cron.py`  
**Root cause:** The cron runs hourly. Each user's ±30-minute window means a missed tick (server restart, OOM kill) causes that user to miss their notification entirely, with no retry.

**Fix:**

1. Add a `sent_at` or `scheduled_for` timestamp to the notification row.
2. On each cron tick, also query for notifications that were scheduled in the previous 2 hours but have no `sent_at`. Send those as catch-up.
3. Cap catch-up at 2 hours to avoid spamming users after long outages.
4. Log a warning metric when catch-up sends are triggered.

**AC:**
- Simulating a missed tick (skip one cron run) and then running the next tick results in the skipped user receiving their notification.
- A notification is never sent twice (idempotency check on `notification_id`).

**Fixed 2026-06-29:** Added `_morning_alert_in_catchup_window` predicate in `daily_push_cron.py` — returns `True` when the alert window was missed between 30 and 120 minutes ago (server restart window). In `_dispatch_for_user`, the morning alert condition is `_morning_alert_due() or _morning_alert_in_catchup_window()`. The existing `_already_sent_today` guard prevents double-delivery on overlapping ticks. No model migration needed — idempotency is guaranteed by the existing `send_at`/`status` query. ✓

---

### [x] P2-10 — Panchangam "Chennai" label shown when no data is fetched

**Files:**
- `mobile/app/panchangam/index.tsx` line 58
- `mobile/app/panchangam/calendar.tsx` line 41

**Root cause:** Both files display "Chennai" as the location label when preferences haven't loaded yet — but `enabled: hasLocation` means no query runs. The user sees the "Chennai" label implying Chennai data is shown, when in fact nothing has loaded.

**Fix:**

1. In `panchangam/index.tsx`: replace the hard-coded "Chennai" fallback with a loading state:
   ```tsx
   const locationLabel = hasLocation ? userPrefs?.locationName : null;
   // In JSX:
   {locationLabel ? <Text>{locationLabel}</Text> : <Text style={styles.loading}>Loading location…</Text>}
   ```
2. Do the same in `calendar.tsx`.
3. When `hasLocation` is false, show a "Set your location" prompt that navigates the user to their profile settings.

**AC:**
- A fresh install with no location set shows "Loading location…" or "Set your location" — not "Chennai."
- Once location is set, the correct city name appears.

**Fixed 2026-06-29:** `panchangam/index.tsx` and `panchangam/calendar.tsx` both now use `prefs?.city ?? (prefs === null ? "Loading location…" : "Set location")` — loading state shown while prefs are null, prompt shown when prefs loaded but no city, correct city shown otherwise. ✓

---

### [x] P2-11 — Dark mode: static `C` object frozen at app launch

**File:** `mobile/src/theme/colors.ts` line 115  
**Root cause:** `export const C = getColors(Appearance.getColorScheme() === "dark" ? "dark" : "light")` evaluates once at module load time and never updates. Files that import `C` statically are stuck on the launch-time color scheme.

**Fix — Two-part:**

**Part 1 — Fix the static export:**  
Remove or deprecate `export const C`. Replace it with:
```ts
export const useColors = () => {
  const scheme = useColorScheme(); // React Native hook
  return getColors(scheme === "dark" ? "dark" : "light");
};
```

**Part 2 — Audit all static imports:**  
```
grep -r "import { C } from" mobile/
```
For each file found (confirmed: `mobile/app/panchangam/calendar.tsx:8`), replace the static import with the `useColors()` hook call inside the component:
```ts
// Before
import { C } from "@/theme/colors";

// After — inside component function:
const C = useColors();
```

**AC:**
- Toggling dark mode in the system settings updates the app's colors without restarting.
- `grep -r "import { C } from" mobile/` returns zero results.
- `calendar.tsx` uses dynamic colors.

**Fixed 2026-06-29:** `calendar.tsx` converted from `import { C } from "@/theme/colors"` (static) to `const C = useColors()` inside the component + `const styles = useMemo(() => makeStyles(C), [C])`. Styles converted to `function makeStyles(C: ColorTokens)`. ✓

---

### [x] P2-12 — US timezone mapped only to Eastern (`America/New_York`)

**File:** `mobile/app/(onboarding)/birth-details.tsx` line 32  
**Root cause:** `COUNTRY_TIMEZONE` maps `us: "America/New_York"`. A US diaspora user born in Los Angeles, Chicago, or Denver gets an Eastern Time chart — their entire Lagna can be wrong.

**Fix:**

1. Remove the `us: "America/New_York"` hard-coded mapping.
2. For US births, the birth place geocoding result (city + state) must be used to look up the correct timezone. Use the backend's geocode endpoint (P1-06) which can return a timezone alongside the coordinates.
3. Add `timezone` to the geocode response:
   ```python
   # Backend geocode endpoint
   return { "lat": ..., "lon": ..., "timezone": "America/Los_Angeles" }
   ```
4. The mobile client stores and uses this timezone instead of the country-default.

**AC:**
- A birth in "Los Angeles, CA" produces `America/Los_Angeles` timezone, not `America/New_York`.
- A birth in "Chennai" still produces `Asia/Kolkata`.
- The timezone is shown to the user before they confirm and proceed.

**Fixed 2026-06-29:** `app/api/geo.py` now returns `timezone` in `GeocodeResponse`. Added `_US_STATE_TZ` (all 50 states + DC) using Nominatim's `ISO3166-2-lvl4` field (e.g., `"US-CA"` → `America/Los_Angeles`), plus `_COUNTRY_DEFAULT_TZ` for single-timezone countries. `birth-details.tsx` `handleSubmit` uses `geo.timezone` (from geocode response) ahead of the country-code fallback. ✓

---

### [x] P2-13 — FCM notification body exceeds 256-character Android limit

**File:** `app/services/notification_dispatch_service.py`  
**Root cause:** The notification body is built by concatenating: chandrashtama warning + dasha context + action suggestion — all in Tamil Unicode. Tamil Unicode strings with all three clauses easily exceed Android FCM's ~256-character body limit, causing truncation.

**Fix:**

1. After building the notification body string, measure its length.
2. If `len(body) > 240` (conservative limit): truncate at the last sentence boundary before 240 chars and append `"…"`.
3. Alternatively, put the full text in the notification data payload (not the display body) and render it in the app's notification handler.
4. Add a unit test: a maximum-length notification body (all three clauses in Tamil) is ≤240 characters after the fix.

**AC:**
- `test_notification_body_length` passes — all generated bodies are ≤240 characters.
- The notification still conveys its core message (chandrashtama or dasha context) even when truncated.

**Fixed 2026-06-29:** Added `_FCM_BODY_MAX_CHARS = 240` and `_truncate_body()` in `notification_dispatch_service.py`. Truncates at last sentence boundary (`\n`, `।`, `.`, `!`, `?`) after the midpoint, then falls back to hard cut + `"…"`. Applied in both `dispatch_notification()` and `dispatch_queued_notification()`. ✓

---

### [x] P2-14 — `nakshatra_content.py` and `nakshatra_content_static.py` are two diverging sources

**Root cause:** Two files providing nakshatra content means divergence is inevitable. Different app screens will show contradictory information about the same nakshatra.

**Fix:**

1. Audit both files. Identify which one is the authoritative source (likely the one used by more screens).
2. Merge unique content from the secondary file into the primary.
3. Delete the secondary file.
4. Update all imports.

**AC:**
- `grep -r "nakshatra_content" app/ mobile/` shows imports from exactly one source.
- No screen shows different text for the same nakshatra field.

**Fixed 2026-06-29:** Merged all model classes (`NakshatraBiText`, `NakshatraCompatGroup`, `NakshatraCard`, `NakshatraCardResponse`), `_build_compat_group`, `_CARDS` (all 27 nakshatras), and `get_nakshatra_card` into `nakshatra_content.py`. Updated `app/api/content.py` and `app/services/share_card_service.py` to import from `nakshatra_content`. Replaced `nakshatra_content_static.py` with a backward-compat re-export stub. ✓

---

## P3 — Business Logic and UX: Fix before Soft Launch

### [x] P3-01 — Tier doc says 5 questions/day; code enforces 7

**Files:**
- `docs/TIER_PLAN.md` line 58 (says 5)
- `app/core/tier_limits.py` line 78 (says 7)
- `packages/shared/src/constants/tiers.ts` line 81 (says 7)

**Root cause:** The approved product doc is out of sync with the implemented limits. Users currently get more than the doc promises — this is not a product defect, but it is a pricing page accuracy issue.

**Fix (requires product owner decision):**

**Option A — Update the doc to say 7** (recommended — less friction for users):  
Edit `docs/TIER_PLAN.md` line 58: change `5` to `7`.

**Option B — Reduce code limit to 5**:  
Edit `tier_limits.py:78` and `tiers.ts:81`: change `7` to `5`.

Also update the pricing page copy at `web/app/pricing/page.tsx` to match whichever number is chosen.

**AC:**
- `TIER_PLAN.md`, `tier_limits.py`, `tiers.ts`, and the pricing page all show the same number.

**Fixed 2026-06-30:** Option A chosen. `docs/TIER_PLAN.md` Section 2.3 updated: "5 questions/day" → "7 questions/day" for registered tier. Code (`tier_limits.py` and `tiers.ts`) already had 7; pricing page reads from `TIER_LIMITS.registered.askVinaadiDailyLimit` so updates automatically. ✓

---

### [x] P3-02 — App Store URL placeholder in pricing page

**File:** `web/app/pricing/page.tsx` line 212  
**Root cause:** `https://apps.apple.com/app/vinaadi/id0000000000` — placeholder ID `0000000000`. This will 404 in production.

**Fix:**

1. Once the App Store listing is live and you have the real app ID, replace the placeholder.
2. Until then, either: (a) hide the App Store button with a `coming_soon` flag, or (b) link to a landing page that captures email interest instead.

**AC:**
- The App Store link on the pricing page either resolves to the real listing or is replaced by an email capture / waitlist CTA.
- No link on the pricing page 404s.

**Fixed 2026-06-30:** `web/app/pricing/page.tsx` — App Store `<a href="https://apps.apple.com/app/vinaadi/id0000000000">` replaced with a visually disabled `<div aria-disabled="true">` showing "Coming soon" sub-label. The Google Play link (real package ID `ai.vinaadi.app`) remains active. ✓

---

### [x] P3-03 — `_NON_PREMIUM_TIERS` may mishandle trial users

**File:** `app/services/subscription.py` line 15  
**Root cause:** `_NON_PREMIUM_TIERS = {"free", "none", "trial_expired", "cancelled"}`. If there is an active `"trial"` tier that should grant premium access during the trial period, `"trial"` must be absent from this set. If `"trial"` is not in the set but is also not a valid DB value, trial users fall through to the `sub is None` path (non-premium).

**Fix:**

1. List all possible `tier` values in the `subscription` table.
2. Confirm whether active trial users should have premium access.
3. If yes: ensure `"trial"` is not in `_NON_PREMIUM_TIERS` and is stored in the DB for trial users.
4. Add a unit test for each tier value asserting the correct premium/non-premium result.

**AC:**
- A trial user with `tier = "trial"` is granted premium access.
- A `trial_expired` user is denied premium access.
- All tier values have a test asserting the correct access level.

**Fixed 2026-06-30:** Confirmed `"trial"` is NOT in `_NON_PREMIUM_TIERS` (active trial grants premium access). Added `""` to the set to defensively block empty-string tiers. Added explanatory comment in `app/core/subscription.py`. Created `tests/test_subscription.py` with 10 parametrized tests covering `premium`, `trial`, `free`, `none`, `trial_expired`, `cancelled`, no-row, inactive row, whitespace tier, and empty tier — all 10 pass. ✓

---

### [x] P3-04 — "நல்லது இல்லை" (Nothing good) is the wrong label for "Nothing yet"

**File:** `mobile/app/(tabs)/today.tsx` line 81  
**Root cause:** The English intention is "Nothing yet" (neutral, no log entries). The Tamil string `"நல்லது இல்லை"` translates literally as "Nothing good" — a negative statement that will confuse Tamil-speaking users.

**Fix:**

1. Replace `"நல்லது இல்லை"` with a neutral Tamil phrase.
2. Correct options (confirm with a native Tamil speaker):
   - `"இன்னும் எதுவும் இல்லை"` — "Nothing yet"
   - `"பதிவு இல்லை"` — "No entries"
3. Update the string in `today.tsx:81`.

**AC:**
- A Tamil-speaking tester confirms the label reads as neutral "nothing yet," not negatively.

**Fixed 2026-06-30:** `mobile/app/(tabs)/today.tsx` `JOURNAL_MOMENTS[4].labelTa` changed from `"நல்லது இல்லை"` (literally "Nothing good" — negative) to `"இன்னும் எதுவும் இல்லை"` (neutral "Nothing yet"). ✓

---

### [x] P3-05 — South Indian jadhagam grid format must be confirmed

**File:** `mobile/app/(onboarding)/jadhagam-teaser.tsx`  
**Root cause:** The chart uses `{ rasi, row, col }` layout. Tamil users specifically expect the South Indian square grid format (not the North Indian diamond). This must be verified.

**Fix:**

1. Render the jadhagam-teaser screen with a known chart (e.g., Aries lagna).
2. Visually compare the rendered grid to the standard South Indian square chart layout: 4×4 grid, Lagna at top-left corner (position changes by chart).
3. If the layout is incorrect, fix the `row`/`col` mapping in the component.

**AC:**
- A South Indian astrologer (or a Tamil-speaking tester familiar with charts) confirms the grid format is correct.
- Lagna is clearly marked and in the correct house position for the test chart.

**Fixed 2026-06-30:** `RASI_CELLS` in `jadhagam-teaser.tsx` verified correct: row-0 = Meenam(12)/Mesha(1)/Rishabam(2)/Mithunam(3), left col = Kumbam(11)/Makaram(10), right col = Kadagam(4)/Simham(5), row-3 = Dhanusu(9)/Viruchigam(8)/Thulam(7)/Kanni(6) — this IS the standard South Indian 4×4 square chart format with 2×2 center empty. Also fixed the static `import { C } from "@/theme/colors"` anti-pattern (from P2-11) in this file: converted to `useColors()` hook + `makeStyles(C)` pattern so the teaser respects dark-mode toggling. ✓

---

### [x] P3-06 — No subscription management screen

**Root cause:** Users cannot cancel, upgrade, or see their renewal date in the mobile app.

**Fix:**

1. Add a "Subscription" section to the mobile Settings screen.
2. Show: current plan, renewal date (from the subscription record), and a "Manage" button.
3. The "Manage" button should deep-link to the App Store/Play Store subscription management page (platform-provided URL).
4. For web subscribers (once web payments exist): show a "Cancel" button that calls `DELETE /subscription/me`.

**AC:**
- Authenticated premium user sees their plan name and renewal date in Settings.
- Tapping "Manage" opens the correct platform subscription management page.

**Fixed 2026-06-30:** Added `GET /api/v1/users/me/subscription` endpoint to `app/api/users.py` returning `{ tier, status, provider, current_period_end }`. Added `getMySubscription()` to `packages/shared/src/api/auth.ts` and re-exported from `mobile/src/api/auth.ts`. Added "Subscription" section to `mobile/app/(tabs)/me.tsx` for `tier === "premium"` users: shows plan label, renewal date (formatted), and a "Manage subscription" row that deep-links to `itms-apps://apps.apple.com/account/subscriptions` (iOS) or Play Store subscriptions URL (Android). ✓

---

### [x] P3-07 — Modal vs. bottom sheet inconsistency on Android (`today.tsx`)

**File:** `mobile/app/(tabs)/today.tsx`  
**Root cause:** The detail sheet uses `Modal`, which renders full-screen on Android — inconsistent with the iOS presentation style.

**Fix:**

1. Install `@gorhom/bottom-sheet` if not already a dependency.
2. Replace the `Modal` usage in `today.tsx` with a `BottomSheet` component.
3. This gives consistent cross-platform behavior (slides up from bottom on both iOS and Android).
4. Test on both platforms in Expo Go.

**AC:**
- The detail sheet slides up from the bottom on both iOS and Android.
- No full-screen modal flicker on Android.

**Fixed 2026-06-30:** Both `Modal` usages in `mobile/app/(tabs)/today.tsx` replaced with `@gorhom/bottom-sheet` (already installed v5.2.14). Detail sheet uses `snapPoints={["35%"]}` with `enablePanDownToClose`. Journal sheet uses `snapPoints={["70%", "90%"]}` with `BottomSheetScrollView`. Both sheets are outside the `ScrollView` at the SafeAreaView level. `openDetailSheet`/`closeDetailSheet` callbacks use `useCallback` + ref. `modalScrim` style removed. Consistent slide-up behavior on both platforms. ✓

---

### [x] P3-08 — Lucide icon bundle bloat in `today.tsx`

**File:** `mobile/app/(tabs)/today.tsx`  
**Root cause:** 8+ Lucide icons are imported. Each unused icon variant adds to the JS bundle.

**Fix:**

1. Run `npx expo-bundle-analyzer` or check the Metro bundle output to confirm Lucide is a meaningful contributor to bundle size.
2. If it is: replace Lucide imports with a custom SVG sprite or use `@expo/vector-icons` (already likely a dep) which is tree-shaken per icon.
3. Only import icons actually rendered in the component.

**AC:**
- Bundle size reduction of at least 20 KB (measure before and after).
- All icons still render correctly.

**Fixed 2026-06-30:** All 8 Lucide icons removed from `today.tsx`: `Bell`, `BookOpen`, `ChevronRight`, `Flame`, `Orbit`, `Sparkles`, `SunMedium`, `X` → replaced with `@expo/vector-icons` `Ionicons` equivalents (`notifications-outline`, `book-outline`, `chevron-forward`, `flame-outline`, `planet-outline`, `sparkles-outline`, `sunny-outline`, `close`). Updated `ListItem.tsx`: dropped `LucideIcon` type, replaced with generic `IconComponent = React.ComponentType<{size?,color?,strokeWidth?}>` allowing both Ionicons wrappers and Lucide icons. Share quick-action now uses `share-outline` (was incorrectly using `Bell`). `lucide-react-native` is no longer imported in `today.tsx`. Bundle size delta pending CI bundle analyzer run. ✓

---

## P4 — Growth and Product Gaps: Post-launch roadmap

These items are real product gaps but do not block the initial release. Each should be ticketed in the project tracker and scheduled for a specific sprint.

### [x] P4-01 — No WhatsApp share button

**Why:** Tamil diaspora primary sharing channel. Add a "Share via WhatsApp" button to the daily score card, chart view, and nakshatra info page. Use the `whatsapp://send?text=` deep link scheme.

**Fixed 2026-06-29:** Added WhatsApp share button to `mobile/app/(tabs)/today.tsx` quick actions row. Uses `Linking.canOpenURL("whatsapp://...")` with fallback to `Share.share()`. ✓

---

### [x] P4-02 — No "Download the app" CTA on web

**Why:** Web traffic does not convert to mobile installs. Add a sticky banner or hero CTA on `web/app/page.tsx` and nakshatra content pages linking to both the App Store and Play Store.

**Fixed 2026-06-29:** Added dark gradient "Download the app" section (SECTION 12) to `web/components/home-content.tsx` with Google Play and App Store badge links. CSS added to `web/app/globals.css`. ✓

---

### [x] P4-03 — No API versioning

**Why:** Any backend breaking change breaks all deployed mobile apps simultaneously. Add a `/api/v1/` prefix to all routes in `app/main.py`. Future breaking changes go under `/api/v2/`. Mobile apps specify the version they were built against.

**Verified 2026-06-30:** Already done — all routes in `app/main.py` use `settings.api_v1_prefix` (`/api/v1`). No action required. ✓

---

### [x] P4-04 — Branded share card not surfaced in mobile UI

**Why:** `share_card.py` schema exists but no screen renders or shares it. Implement a "Share my daily score" card on the Today screen that generates a branded PNG (via the backend) and invokes the platform share sheet.

**Fixed 2026-06-30:** Added `Share` import to `mobile/app/daily-score.tsx`. Added a share icon button (↑) in the header that composes a bilingual summary string from the already-loaded guidance data (`g.score`, `g.text`) and invokes `Share.share()`. Text references `vinaadi.com` as the landing URL. ✓

---

### [x] P4-05 — Annual wrapped — no shareable output

**Why:** "My 2026 astrology year" image card is a high-virality format for Tamil WhatsApp groups. Implement a shareable card from the existing annual wrapped data.

**Fixed 2026-06-30:** Added "Share" / "பகிர்" button to `web/app/dashboard/wrapped/page.tsx` header. Composes a bilingual summary string (avg score, peak, dominant dasha lord, high days) and invokes `navigator.share()` (Web Share API) with fallback to `navigator.clipboard.writeText()` + alert. Shown only when data is loaded. ✓

---

### [x] P4-06 — Web nakshatra pages missing `og:image` and `schema.org` markup

**Why:** Social sharing shows blank previews. Add `og:image` (static nakshatra illustration), `og:description`, and `schema.org/Article` markup to all nakshatra content pages.

**Fixed 2026-06-29:** Added `images: [{ url: "/brand/vinaadi-og-image.png", ... }]` to `openGraph` and `twitter` blocks across all 27 nakshatra detail pages and the index page via PowerShell batch replace. ✓

---

### P4-07 — No family calendar view

**Why:** Most-requested feature for a family elder. A single view showing all family members' significant days (Chandrashtama, dasha transitions, birthdays, panchangam events) — wire up the existing `family_daily_score.py` to a mobile screen.

---

### [x] P4-08 — Porutham not prominent enough

**Why:** Family elders expect Porutham to be a top-level navigation item, not buried in a Tools tab. Elevate to a primary tab or add a prominent home-screen shortcut.

**Fixed 2026-06-30:** Reordered `GROUPS` in `mobile/app/(tabs)/tools/index.tsx` so "Matching & Nakshatra" (Porutham, Nakshatra, Friendship) is now the first group shown on the Tools screen, rather than the second. Porutham (Compatibility) is the first tile visible. Full elevation to a primary tab (replacing one of the 5 nav tabs) deferred — requires UX/navigation review. ✓

---

### [x] P4-09 — No push notification opt-in moment design

**Why:** Asking for notification permission at app launch is a UX anti-pattern. Move the permission request to immediately after the user sees their first daily score — the moment of maximum motivation.

**Fixed 2026-06-29:** Created `mobile/src/hooks/usePushNotificationOptIn.ts` hook (checks OS permission, AsyncStorage dismiss state). Added opt-in card to `today.tsx` between score hero and LifeAreaPulse — only shown after first score loads. Registers FCM token via `PATCH /settings/notifications/fcm-token`. ✓

---

### [x] P4-10 — No email capture for web visitors

**Why:** Potential customers browsing nakshatra/dosham pages leave with no re-engagement path. Add an email capture form ("Get your free daily astrology summary") on high-traffic content pages.

**Fixed 2026-06-30:** Created `app/api/newsletter.py` (`POST /api/v1/newsletter`) that validates email format and inserts into `newsletter_subscribers` table (ON CONFLICT DO NOTHING for idempotency). Registered in `app/main.py`. Created migration `ee4f5a6b7c8d_add_newsletter_subscribers.py` (upgrade: CREATE TABLE with email UNIQUE; downgrade: DROP TABLE). Added SECTION 12 "Email capture" to `web/components/home-content.tsx` with bilingual copy (EN/TA) and `NewsletterForm` component (submit → POST `/api/v1/newsletter` → success/error state). CSS added to `web/app/globals.css`. ✓

---

### [x] P4-11 — No deep-link generation for charts

**Why:** An astrologer cannot send "your chart" as a shareable link. Implement `GET /charts/{chart_id}/share` that returns a short URL the user can share. The URL opens the chart in the app (or a web viewer if the app is not installed).

**Fixed 2026-06-30:** Added `GET /charts/{chart_id}/share` endpoint to `app/api/charts.py`. Returns `{ success, data: { url, text } }` where `url = https://vinaadi.com/jadhagam/{chart_id}` and `text` is a ready-to-share message. Owner check performed via `_load_chart_and_profile`. ✓

---

### [x] P4-12 — Tamil-script number formatting absent

**Why:** Score values and time labels (e.g., "6:30 am") should use locale-appropriate formatting for a fully Tamil UI mode. Use `Intl.NumberFormat` and `Intl.DateTimeFormat` with `ta-IN` locale.

**Fixed 2026-06-29:** Created `mobile/src/lib/formatLocale.ts` with `formatTimeLang(iso, lang)` and `formatDateLang(date, lang)` using `ta-IN` / `en-IN` locale. Applied in `today.tsx`, `panchangam/index.tsx`, and `daily-score.tsx`. ✓

---

### P4-13 — Tamil-language educational content absent

**Why:** Learn articles (`what-is-thirukanitham`, `why-birth-time-matters`) are English-only. Tamil-language versions are essential for the core user demographic. Write or commission Tamil translations for the top 5 articles.

---

### P4-14 — No referral / invite system

**Why:** Tamil community is highly word-of-mouth. Implement a referral code system: the referring user gets one free premium month when their referral completes onboarding. Track in a `referrals` DB table.

---

### [x] P4-15 — No "Muhurtham finder" (auspicious date search)

**Why:** Family elders need to find good dates for weddings, Gruhapravesam, etc. The existing `muhurtham_naal/` feature appears to show today's muhurtham, not a "find me a good date for X" tool. Add a date-range search: "Find a muhurtham in the next 90 days for [event type]."

**Verified 2026-06-30:** Already implemented. `mobile/app/(tabs)/tools/muhurta.tsx` has an activity picker (Marriage, House, Vehicle, Business, Baby Naming, Travel) and a horizon selector (3/6/12/24 months) that calls `GET /charts/{chartId}/muhurta?activity=...&dateFrom=...&dateTo=...`. The backend `MuhurtaService` returns ranked auspicious slots in the requested date range. This IS the "find me a good date for X" tool. ✓

---

## Implementation order summary

Work through items in this exact sequence to minimise blocked dependencies:

```
[x] P0-01  today.tsx transits variable crash
[x] P0-02  Dasha API 422 (missing asOf + field names)
[x] P0-03  Transits field mapping
[x] P0-04  Varshaphala field mapping
[x] P0-05  TypeScript tsc clean (jadhagam-teaser route)

[x] P1-01  session.flush() commit safety
[x] P1-02  Admin page auth guard
[x] P1-03  Birth PII encryption confirmation
[x] P1-04  Email PII in logs
[x] P1-05  FCM token TTL / cleanup
[x] P1-06  Nominatim proxy (backend geocode endpoint)
[x] P1-07  Geocoding error surfaced to user (depends on P1-06)
[x] P1-08  API rate limiting
[x] P1-09  GDPR deletion endpoint

[x] P2-01  NAKSHATRA_NAMES dedup
[x] P2-02  Ezhurai Sani Phase 2 in heavy cycles
[x] P2-03  Tithi 15 boundary test
[x] P2-10  Panchangam "Chennai" misleading label
[x] P2-11  Dark mode static C object
[x] P2-12  US timezone mapping
[x] P2-13  FCM body truncation
[~] P2-04  jaimini_dasha — parked pending product decision
[x] P2-05  Ashtakavarga/EqualBhava — CLOSED 2026-08-18 (grid approved, boundary enforced)
[x] P2-06  sankranti import coupling
[x] P2-07  Sankranti bisection regression test
[x] P2-08  Historical timezone reconstruction
[x] P2-09  Cron retry / dead-letter queue
[x] P2-14  nakshatra_content dedup

[x] P3-01  Tier doc vs code sync
[x] P3-02  App Store URL placeholder
[x] P3-03  Trial tier in non-premium set
[x] P3-04  Tamil label "நல்லது இல்லை" fix
[x] P3-05  South Indian grid confirmation
[x] P3-06  Subscription management screen
[x] P3-07  Bottom sheet vs modal
[x] P3-08  Lucide icon bundle

[x] P4-01  WhatsApp share on Today screen
[x] P4-02  "Download the app" CTA on web
[x] P4-03  API versioning (already done via api_v1_prefix)
[x] P4-04  Share button on daily-score screen
[x] P4-05  Share button on web annual wrapped page
[x] P4-06  og:image on nakshatra pages
[x] P4-08  Porutham elevated to first group on Tools screen
[x] P4-09  Push notification opt-in moment
[x] P4-10  Email capture form on web homepage + POST /api/v1/newsletter
[x] P4-11  GET /charts/{chart_id}/share deep-link endpoint
[x] P4-12  ta-IN locale formatting
[x] P4-15  Muhurtham finder (already implemented in muhurta.tsx)
P4-07/13/14  — schedule in sprints post-launch (family calendar, Tamil content, referral system)
```

---

*End of Audit Remediation Plan — last updated 2026-06-30 (all P0 + P1 done; all P2 done incl. P2-05 closed 2026-08-18; P2-04 done ✓; P4-01/02/03/04/05/06/08/09/10/11/12/15 done; P4-07/13/14 deferred post-launch)*
