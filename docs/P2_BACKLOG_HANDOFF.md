# P2 backlog — implementation handoff

**Date:** 2026-09-03
**Branch at time of writing:** `harden/production-readiness`
**Source:** [`AUDIT_TRIAGE_2026-08-31.md`](AUDIT_TRIAGE_2026-08-31.md) §P2, plus a fresh
read of the tree on 2026-09-03. Where this document and the triage doc disagree,
**this one is newer** — the triage entries were written before P1-1/P1-5 landed and
several of them describe a tree that no longer exists.

This file is written so that a coding agent can pick **one** item, read only that
item plus §0, and finish it without further instruction.

---

## 0. Read this before touching anything

### 0.1 Environment

```powershell
Set-Location 'D:\sanstro'
```

- **PowerShell only** unless the task says otherwise. Chain with `;`, never `&&`.
  No `head` — use `Select-Object -First N`.
- Set `$env:PYTHONUTF8 = "1"` and `$env:PYTHONIOENCODING = "utf-8"` before any
  Python command that may print Tamil.
- Never write a source file through `Out-File` (UTF-16) or round-trip it through
  PowerShell string handling (adds a BOM, mojibakes Tamil). Use the Write/Edit tools.

### 0.2 Database

| | Container | Port | DB | Safe to wipe |
|---|---|---|---|---|
| Dev — **real data** | `slw-postgres` | 5432 | `vinaadi_dev` | **NO** |
| Test | `slw-postgres-test` | 5433 | `vinaadi_test` | Yes |

Before running pytest:

```powershell
$env:JOTHIDAM_DATABASE_URL = "postgresql://slw_admin:slw_dev_password@localhost:5433/vinaadi_test"
$env:JOTHIDAM_TEST_DB_RESET_ACK = "I_UNDERSTAND_THIS_WIPES_TEST_DB"
```

**Pytest cannot run against SQLite at all** (verified 2026-09-03 — CLAUDE.md's
`sqlite:///./pytest_local_test.db` escape hatch is stale and non-functional):
`tests/conftest.py:90` refuses any database not named exactly `vinaadi_test`, and
`app/db/session.py:13` passes `max_overflow`, which SQLite's dialect rejects at import.
To prove a model is metadata-portable, build a per-test engine instead — see
`tests/test_newsletter.py:27-34`.

If a run produces a burst of `UndefinedTable` / `relation "..." does not
exist` setup errors, that is almost certainly a **second pytest process** on this
machine calling `_reset_db()` (`DROP SCHEMA public CASCADE`) mid-run, not a code bug.
Check before believing it:

```powershell
Get-CimInstance Win32_Process -Filter "Name='python.exe'" |
  Where-Object { $_.CommandLine -like "*pytest*" } | Select-Object ProcessId, CommandLine
```

Trace the parent chain before killing anything; another agent session may own it.

### 0.3 The four-surface API contract

Any change to a **route path, query/path param name, HTTP verb, or response shape**
must be applied in the same change across:

1. `app/api/` — backend (source of truth)
2. `packages/shared/src/api/` — typed shared client
3. `mobile/src/api/`
4. `web/` — mostly direct `apiFetchJson(...)` calls with hardcoded paths

Nothing checks this boundary at compile time. Two shared wrappers have already
drifted silently (`getDailyGuidance` used a query param where the backend wanted a
path param; `registerFcmToken` sent PATCH where the backend only accepts PUT).

**Forward policy:** any *new* endpoint gets a typed wrapper in
`packages/shared/src/api/`, and new web/mobile code must consume that wrapper. Do
not grow the direct-fetch bypass. Do not clean up existing direct-fetch call sites
as drive-by work.

### 0.4 Bilingual rule

Every user-facing string carries both `ta` and `en`. This is enforced by review, not
by types. Display shows the **active language only** — no bilingual echo (e.g. never
`"தமிழ் / Tamil"` in one label). Almanac terms use Tamil naming, not Sanskrit.

### 0.5 Test data

Never hardcode real personal data — real birth profiles, real names, exact real
coordinates — in tests, fixtures, seeds, docs or example payloads. Use an obviously
synthetic identity.

### 0.6 Standard verification block

Every item below ends with its own verification. This is the baseline all of them
share:

```powershell
Set-Location 'D:\sanstro'
python -m ruff check app tests
python -m mypy app
$env:PYTHONUTF8 = "1"
$env:JOTHIDAM_DATABASE_URL = "postgresql://slw_admin:slw_dev_password@localhost:5433/vinaadi_test"
$env:JOTHIDAM_TEST_DB_RESET_ACK = "I_UNDERSTAND_THIS_WIPES_TEST_DB"
python -m pytest -q
```

Frontend:

```powershell
Set-Location 'D:\sanstro\web'
pnpm lint ; pnpm typecheck ; pnpm test
```

CI is authoritative. A green local run is evidence; a red one is a hypothesis.

### 0.7 Definition of done (applies to every item)

1. The change is in the tree and the standard verification block passes.
2. New behaviour has a test that **fails without the change**. Assert this by
   reverting the change locally and watching the test go red — a test that passes
   both ways is not a test.
3. If the change touches an API contract, all four surfaces in §0.3 are updated.
4. If the change makes a claim in a doc false, that doc is updated in the same commit.
5. Commit message names the item ID: `feat(P2-5): ...`, `fix(P2-4): ...`.

---

## 1. Order of work

| Item | Size | Depends on | Recommendation |
|---|---|---|---|
| **P2-4** stale docs | Trivial (~20 min) | nothing | Do first. Zero risk. |
| **P2-5** newsletter ORM | Small (~1–2 h) | nothing | Do second. Self-contained, closes a real testability gap. |
| **P2-6** mobile storage | Small–medium | nothing | Independent of the others. |
| **P2-3** typed errors | **Large** | P1-1 (done) | The big one. Groundwork is fresh — good time. |
| **P2-7** observability etc. | Needs sizing | nothing | Split into 7a–7d; 7a is now a confirmed bug, not an investigation. |
| **P2-8** cleanup | Unscoped | all gates green | Last, by definition. |
| **SEC-1** secret manager | Decision, not code | deployment target | Blocked on a human choice. See §8. |

P2-4 and P2-5 do not touch each other and can be done in either order or together.
P2-3 and P2-7a both touch the error/logging path — if both are being done, do **7a
first**, because P2-3's request-ID story depends on request IDs actually reaching the
logs, and right now they do not (§7.1).

---

## 2. P2-3 · Typed error and empty-state system

**Size:** Large. **Risk:** Medium — touches the error path on every surface.
**Status:** Not started. Unblocked; P1-1 established the per-section status vocabulary.

### 2.1 Why

The frontend decides what to show the user by **substring-matching the backend's
English prose**. `web/lib/error-messages.ts` holds a 30-entry pattern map and does
`normalized.includes(pattern)` against the raw error string
([`error-messages.ts:183-201`](../web/lib/error-messages.ts#L183-L201)).

This is not a theoretical complaint. Three defects are live in that file today:

1. **Precedence is insertion order, not specificity.** Patterns longer than 5 chars
   are scanned first, in `Object.entries` order. `"required"` is declared at
   [line 118](../web/lib/error-messages.ts#L118), `"birth time"` at
   [line 133](../web/lib/error-messages.ts#L133). So the message *"birth time is
   required"* matches `"required"` and renders **"Missing Information — Some required
   information is missing"**, never the correct and much more useful "Birth Time
   Required — Please provide your birth time".
2. **Three-and-four-character patterns match inside unrelated words.** `"sun"`
   ([line 128](../web/lib/error-messages.ts#L128)) matches *sunrise*, *sunset*,
   *Sunday* — all of which appear in panchangam error text. Any such error renders
   **"Sun Data Missing — Your profile may need a more accurate birth time"**, which is
   both wrong and actively misleading. `"moon"`, `"uuid"`, `"token"` have the same
   shape.
3. **The whole file is English-only.** There is not one `ta` string in it, in a
   product whose stated rule is that every user-facing string is bilingual and whose
   default language is Tamil. Tamil users currently get English errors.

Rewording a backend `detail` string — a change no reviewer would flag — silently
changes which message the user sees on every surface. There is no compile-time link
and no test that would catch it.

### 2.2 What exists already (do not rebuild)

- **Request IDs work.** `RequestLoggingMiddleware` mints or reuses `X-Request-ID`
  and sets `request.state.request_id`
  ([`app/middleware.py:80-100`](../app/middleware.py#L80-L100)). It is echoed on the
  response header and in the 500 envelope
  ([`app/main.py:195-211`](../app/main.py#L195-L211)).
  Caveat: it is **not** currently reaching the log output — see §7.1.
- **A per-section status vocabulary exists**, from P1-1
  ([`app/api/daily_snapshot.py:33-45`](../app/api/daily_snapshot.py#L33-L45)):
  `ok` / `unavailable` / `not_requested` / `invalid_input`, returned additively as
  `data.sections[name]`. **Reuse these four names.** Do not invent a parallel
  vocabulary; if the typed-error system needs a fifth state (`gated`), add it to that
  same module's constants so there is one list.

### 2.3 What does not exist

- **No `HTTPException` handler.** Only `RiseTransitUndefinedError` and bare
  `Exception` are handled ([`app/main.py:178-211`](../app/main.py#L178-L211)).
  Every 4xx raised as `HTTPException` returns FastAPI's default
  `{"detail": "<english prose>"}` — no code, no request ID, no Tamil.
- ~~No error-code enum anywhere in `app/`.~~ **Correction (2026-09-03): wrong, and I
  never verified it.** `app/core/error_codes.py` already existed (259 lines), consumed
  by `app/api/birth_profiles.py` and `app/services/birth_profile_service.py`. **Extend
  those names; do not invent a parallel list** — doing so shipped five synonym code
  pairs. See [`P2_BACKLOG_REVIEW_2026-09-03.md` §5.3](P2_BACKLOG_REVIEW_2026-09-03.md).
- No shared empty/error/loading state component in `web/`. `EmptyState` appears only
  as CSS class names in the Nova stylesheets, not as a component.

### 2.4 Scope — build this

**Backend**

1. `app/core/error_codes.py` — a `StrEnum` (or plain `str` constants) of stable,
   `SCREAMING_SNAKE` codes. **A code is an API contract: once shipped it is never
   renamed or reused.** Start from the cases the pattern map already covers, deduped:
   `PROFILE_NOT_FOUND`, `CHART_NOT_FOUND`, `VAULT_NOT_FOUND`, `MEMBER_NOT_FOUND`,
   `JOURNAL_ENTRY_NOT_FOUND`, `GOAL_NOT_FOUND`, `ACCESS_DENIED`, `NOT_AUTHENTICATED`,
   `SESSION_INVALID`, `PROFILE_LIMIT_REACHED`, `EMAIL_ALREADY_EXISTS`,
   `DAILY_LIMIT_REACHED`, `VALIDATION_FAILED`, `BIRTH_TIME_REQUIRED`,
   `DATE_RANGE_INVALID`, `SERVICE_UNAVAILABLE`, `INTERNAL_ERROR`.
2. `app/core/errors.py` — an `AppError(Exception)` carrying `code`, `http_status`,
   and a bilingual `message: dict[str, str]` with **both** `ta` and `en` keys.
3. An exception handler for `AppError`, for `HTTPException`, and for
   `RequestValidationError`, all returning **one envelope**:

   ```json
   {
     "success": false,
     "error": {
       "code": "BIRTH_TIME_REQUIRED",
       "message": { "ta": "…", "en": "…" },
       "request_id": "…",
       "field": "birth_time"
     },
     "detail": "…"
   }
   ```

   `detail` is kept, populated with the English message, **for backward
   compatibility** — see §2.6. `field` is optional and only set for validation errors.

4. **Migrate raisers incrementally.** Do not attempt to convert every
   `raise HTTPException` in `app/api/` in one commit. Convert the endpoints the web
   dashboard actually surfaces errors from first; the `HTTPException` handler gives
   every unconverted site a `code` of `VALIDATION_FAILED`/`INTERNAL_ERROR` plus a
   request ID in the meantime, so nothing regresses.

**Shared**

5. Mirror the code enum in `packages/shared/src/api/` as a TS union type, plus a
   `parseApiError(response): ApiError` helper. **Both web and mobile consume this
   one helper.** Add a test asserting the TS union and the Python enum have identical
   members — the same class of guard as the existing TS↔OpenAPI field-parity guard.

**Frontend**

6. Rewrite `web/lib/error-messages.ts` to switch on `error.code`. Keep
   `getFriendlyErrorMessage` / `getErrorTitle` / `getErrorDescription` /
   `getTechnicalDetail` **exported with their current signatures** — they have call
   sites across the dashboard. Retain the substring map behind a clearly-named
   `legacyFallbackMessage()` for responses that arrive without a `code` (old cached
   clients, third-party failures, network errors), and log a console warning in dev
   when the fallback fires so the remaining gaps are discoverable.
7. Bilingual copy: one `{ta, en}` entry per code, selected by the active language.
   Active language only — no echo.
8. Shared state components in `web/components/ui/`, visually distinguishable from one
   another (not four shades of the same grey box):
   `<LoadingState/>`, `<ErrorState/>` (with retry), `<EmptyState/>`,
   `<GatedState/>` (upgrade/permission), `<UnavailableState/>` (mapped from P1-1's
   `unavailable`). No accent left-border on these cards — that is a rejected pattern
   in this repo.

### 2.5 Acceptance criteria

- [ ] Every error response from `app/api/` carries `error.code` and
      `error.request_id`; asserted by a test that walks the FastAPI route table,
      triggers a representative failure per router, and checks the envelope.
- [ ] A test asserts the Python enum and the TS union have **identical** members.
- [ ] A test asserts every code has a **non-empty `ta` and `en`** message, and that
      the two are not byte-identical (catches copy-paste of English into `ta`).
- [ ] **No technical detail leaks.** A test triggers an unhandled exception and
      asserts the response body contains no stack frame, no SQL, no file path, no
      module name, and no `sqlalchemy`/`psycopg`/`Traceback` substring.
- [ ] `web/lib/error-messages.ts` contains no call to `.includes()` on the error
      **outside** `legacyFallbackMessage()`.
- [ ] The two live defects in §2.1 have regression tests: "birth time is required"
      resolves to `BIRTH_TIME_REQUIRED`, and an error mentioning "sunrise" does not
      resolve to the Sun-data message.
- [ ] A11y: each state component has an accessible name; `ErrorState`'s retry is a
      real `<button>`, reachable by keyboard, with a visible focus ring. Assert the
      accessible name **by hand** in a test — the axe gate in this repo only checks
      contrast.

### 2.6 Backward-compatibility conditions (read before shipping)

- The envelope is **additive**. `detail` stays and keeps its current meaning, because
  live web code parses the `"404: /path: message"` wire string
  ([`web/hooks/useFamilyData.ts:303`](../web/hooks/useFamilyData.ts#L303),
  [`web/hooks/usePersonalData.ts:576`](../web/hooks/usePersonalData.ts#L576),
  [`web/hooks/usePlanData.ts:45`](../web/hooks/usePlanData.ts#L45),
  [`web/components/dashboard-ask-vinaadi.tsx:165`](../web/components/dashboard-ask-vinaadi.tsx#L165),
  [`web/components/admin-console.tsx:241`](../web/components/admin-console.tsx#L241)).
  **Migrate those five call sites to `error.code` in the same change** — they are the
  reason this item exists — but do not remove `detail` for the released mobile app,
  which cannot be updated in lockstep.
- `admin-console.tsx:241` matching `detail.toLowerCase().includes("elevation")` gates
  the P1-4 elevation flow. Give it a real code (`ELEVATION_REQUIRED`) and verify the
  admin re-auth prompt still triggers, by hand, before merging.
- Confirm the Next proxy forwards the error body and the `X-Request-ID` header
  unmodified: [`web/app/api/backend/[...path]/route.ts`](../web/app/api/backend/%5B...path%5D/route.ts).

---

## 3. P2-4 · Stale documentation

**Size:** Trivial. **Risk:** None. **Do this first.**

### 3.1 Why

`docs/AGENT_INSTRUCTIONS.md` states a test count that was true once and is now
decoration. A number that is confidently wrong teaches every future reader — human or
agent — to distrust the rest of the file.

### 3.2 Evidence

| File | Line | Text |
|---|---|---|
| `docs/AGENT_INSTRUCTIONS.md` | 3 | `**Test suite:** 233 passing` |
| `docs/AGENT_INSTRUCTIONS.md` | 61 | `Run the full test suite before marking any task done. All 233 tests must pass.` |
| `docs/archive/FRONTEND.md` | 43 | `All 233 tests must still pass when done.` |
| `docs/archive/IMPLEMENTATION_GUIDE.md` | 53 | `**Test suite: 233 tests passing as of 2026-05-26.**` |
| `docs/VINAADI_ENHANCEMENT_ROADMAP_v1.md` | 907 | `all 233+ tests green` — **added 2026-09-03** |
| `docs/VINAADI_ENHANCEMENT_ROADMAP_v1.md` | 1001 | `Count must be ≥ 233 (… never shrinks)` — **added 2026-09-03** |

The last two were missed on the first pass because the grep `233 passing|233 tests`
matches neither `233+ tests` nor `≥ 233`. Line 1001 is the worse one: "never shrinks"
forbids deleting a redundant or wrong test. Delete both lines.

The real backend coverage floor is `--cov-fail-under=88`
([`pyproject.toml:55`](../pyproject.toml#L55)) — raised from 40 by P2-7d once a
measured number existed to justify it (§6.4).

### 3.3 Scope

- `docs/AGENT_INSTRUCTIONS.md:3` — delete the `Test suite:` line, or replace with
  "Test suite: see CI." Do **not** substitute today's number; it will be stale next
  week and this task will recur.
- `docs/AGENT_INSTRUCTIONS.md:61` — reword to *"Run the full test suite before marking
  any task done; it must be green."* The instruction is right, the number is the bug.
- `docs/AGENT_INSTRUCTIONS.md:2` — `Last updated: 2026-06-07` is also stale. Bump it.
- **`docs/archive/*` — leave the text alone.** They are archived. If anything, add a
  one-line banner at the top: `> Archived. Superseded; numbers here are historical.`
  Do not spend more time there.

### 3.4 Out of scope

Raising the coverage floor. That is P2-7d and has its own conditions.

### 3.5 Acceptance criteria

- [ ] `grep -rn "233" docs/` returns hits only inside `docs/archive/` and inside the
      triage/handoff docs that quote the problem.
- [ ] No new hardcoded test count is introduced anywhere.

---

## 4. P2-5 · Newsletter ORM model

**Size:** Small. **Risk:** Low. **Self-contained.**

### 4.1 Why

[`app/api/newsletter.py:35-41`](../app/api/newsletter.py#L35-L41) executes raw
`text()` SQL against `newsletter_subscribers`. The migration exists
([`migrations/versions/ee4f5a6b7c8d_add_newsletter_subscribers.py`](../migrations/versions/ee4f5a6b7c8d_add_newsletter_subscribers.py))
— the triage doc's original claim that it was missing is **wrong** — but no ORM model
means no `Base.metadata` entry, which means **no test fixture creates the table**.
The endpoint therefore cannot be tested without a fully migrated database, and has
zero tests today.

### 4.2 Scope

1. **`app/models/newsletter_subscriber.py`** — mirror the migration exactly:

   | Column | Type | Constraints |
   |---|---|---|
   | `id` | `UUID` | PK, `default=uuid4` |
   | `email` | `String(320)` | not null, **unique** |
   | `source` | `String(64)` | not null, default `"web_home"` |
   | `created_at` | `DateTime(timezone=True)` | not null, server default `now()` |

   Follow the house style in [`app/models/feedback.py`](../app/models/feedback.py):
   `from __future__ import annotations`, `Mapped[...]` / `mapped_column`, a docstring
   that says *why* the table exists, `__tablename__` and `__table_args__` explicit.
   Note `Feedback` uses `TimestampMixin` — **check whether that mixin's `created_at`
   matches this migration's column exactly** (type, timezone, server default). If it
   does, use the mixin; if it differs in any way, declare `created_at` explicitly
   rather than bending the migration to the mixin.

2. Register it in [`app/models/__init__.py`](../app/models/__init__.py) — both the
   import block and `__all__`, keeping alphabetical order.

3. Rewrite the endpoint body to use the ORM. Preserve **all** existing behaviour:
   - lowercase + strip the email ([`newsletter.py:30`](../app/api/newsletter.py#L30));
   - 422 on regex failure ([`:31-32`](../app/api/newsletter.py#L31-L32));
   - `source` truncated to 64 chars ([`:40`](../app/api/newsletter.py#L40));
   - **idempotent duplicate handling** — the current `ON CONFLICT (email) DO NOTHING`
     returns `{"success": True}` for a repeat submission and must continue to. Use
     `postgresql.insert(...).on_conflict_do_nothing(index_elements=["email"])`, **or**
     a `SELECT`-then-`INSERT` wrapped so an `IntegrityError` from the race is caught
     and still returns success. Do not turn a duplicate into a 409 — that would leak
     whether an address is subscribed;
   - rollback + `log.exception("newsletter_subscribe_error")` + 500 with a generic
     detail and `from None`, so the original exception never reaches the client
     ([`:43-50`](../app/api/newsletter.py#L43-L50)).

4. **Do not change the route path, request schema, or response shape.** It is called
   from [`web/components/home-content.tsx`](../web/components/home-content.tsx) and
   covered by `web/components/home-content.test.tsx`. This item is a refactor with
   tests, not a redesign.

5. **No new migration.** The table already matches. If you find the model and the
   migration disagree, fix the *model* to match the migration and note the discrepancy
   — do not write an `ALTER`.

### 4.3 Tests to add

`tests/api/test_newsletter.py` (match the existing test-module layout):

- [ ] valid email → 200, `{"success": true}`, exactly one row persisted
- [ ] the same email submitted twice → 200 both times, still exactly one row
- [ ] email differing only in case/whitespace → treated as the same subscriber
- [ ] `"not-an-email"`, `""`, `"a@b"`, `"a b@c.com"` → 422, no row written
- [ ] `source` longer than 64 chars → truncated, not an error
- [ ] a forced DB failure (monkeypatch the session's `execute`/`add` to raise) → 500,
      the response body contains **no** exception text, the session is rolled back,
      and `newsletter_subscribe_error` is logged

### 4.4 Acceptance criteria

- [ ] Tests pass against **SQLite** as well as Postgres, i.e. the table is created by
      `Base.metadata` and the fixture needs no migration run. This is the entire point
      of the item — if the tests still require a migrated DB, it is not done.
      (If `on_conflict_do_nothing` forces a Postgres-only path, use the
      catch-`IntegrityError` form instead so the test stays portable.)
- [ ] `python -m mypy app` clean.
- [ ] The endpoint's observable behaviour is byte-identical to before.

---

## 5. P2-6 · Mobile storage hardening

**Size:** Small–medium. **Risk:** Medium — touches an encryption format with existing
data on real devices. **Read §5.4 before writing code.**

### 5.1 What is already correct (do not "fix")

The original audit overstated this. Tokens **are** in `expo-secure-store`
([`mobile/src/lib/secureStore.ts:14-35`](../mobile/src/lib/secureStore.ts#L14-L35)),
and the AES key **is** stored in SecureStore too
([`:41-51`](../mobile/src/lib/secureStore.ts#L41-L51)). Leave both alone.

### 5.2 The four real defects

**6a — Unauthenticated encryption.**
[`encryptedStorage.ts:8`](../mobile/src/lib/encryptedStorage.ts#L8) uses
`CryptoJS.AES.encrypt` — AES-CBC with no MAC. Ciphertext is malleable: anything with
write access to AsyncStorage can flip bits and the app will decrypt the result without
noticing. `aesDecrypt` returns `null` only on a UTF-8 decode failure
([`:13-24`](../mobile/src/lib/encryptedStorage.ts#L13-L24)), which is not integrity
checking.

**6b — The master key is generated with `Math.random()`.**
[`secureStore.ts:37-39`](../mobile/src/lib/secureStore.ts#L37-L39):

```ts
Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")
```

`Math.random()` is not a CSPRNG. This is the more serious of the two crypto issues —
authenticated encryption over a guessable key buys nothing — and it is **not** in the
triage doc. Replace with `expo-crypto`'s `getRandomBytesAsync`, or
`Crypto.randomUUID()`-derived material, or platform-generated key material.

**6c — Guest data in plain AsyncStorage.**
[`guestStore.ts:49,65`](../mobile/src/features/guest/guestStore.ts#L49-L65) writes
`GuestPrefs` — including `city`, `lat`, `lon`, `rasi`, `nakshatra` and a
device-derived `anonymousId` — as plaintext JSON. Location and birth-star are personal
data by the same standard that motivated P1-3 (which stripped coordinates from
backend logs). Note `makeAnonymousId` ([`:19-24`](../mobile/src/features/guest/guestStore.ts#L19-L24))
mixes in `Device.osInternalBuildId`, making the id device-linkable.

**6d — Analytics has no consent gate.**
[`analytics.ts:81-83`](../mobile/src/lib/analytics.ts#L81-L83) — `trackEvent` forwards
to PostHog unconditionally, and `setUser` ([`:72-79`](../mobile/src/lib/analytics.ts#L72-L79))
identifies by user id. There is no consent check, no opt-out, and no allowlist of
event names or properties, so any caller can put a rasi, nakshatra or city into an
event payload and it ships.

### 5.3 Scope

- [ ] **6b first** — it is the smallest change and the largest gain. Swap
      `generateRandomKey` for CSPRNG bytes. Existing installs already hold a key in
      SecureStore; the new generator only affects fresh installs and keys that failed
      to persist. No migration needed.
- [ ] **6a** — move to authenticated encryption (AES-GCM). Bump the version prefix to
      `v3:` and follow §5.4.
- [ ] **6c** — route `guestStore` through `encryptedStorage` instead of raw
      `AsyncStorage`. `encryptedStorage` already exposes the same
      `getItem`/`setItem`/`removeItem` surface, so this is a small change — but it
      makes guest prefs unreadable if the key is lost, so `_doLoad` must treat a
      `null` decrypt as "corrupt entry — reset", exactly as the existing `try/catch`
      at [`:42-47`](../mobile/src/features/guest/guestStore.ts#L42-L47) does. Also
      strip `Device.osInternalBuildId` from `makeAnonymousId` unless there is a stated
      product reason for a device-linkable id; random bytes serve the same purpose.
- [ ] **6d** — add a consent flag (default **off**), gate `trackEvent`/`setUser` on it,
      and add an explicit allowlist of permitted event names and property keys. Assert
      by test that no astrological identifier (`rasi`, `nakshatra`, `lat`, `lon`,
      `city`, `dob`, `birthTime`, email) can be sent, before or after consent.

### 5.4 Migration conditions — mandatory for 6a

There is live `v2:` ciphertext on real devices. The format tag exists
([`:9`](../mobile/src/lib/encryptedStorage.ts#L9),
[`:15`](../mobile/src/lib/encryptedStorage.ts#L15)) precisely so this is possible —
use it.

1. **Write `v3:` only. Read both `v2:` and `v3:`.**
2. On a successful `v2:` read, **re-encrypt to `v3:` and write it back** (lazy
   migration), so the old format drains without a migration script.
3. Keep the `v2:` read path for at least two releases. Removing it early silently logs
   out or blanks data for anyone who skipped a version.
4. A decrypt failure must return `null` and **never throw** — `getItem`'s current
   contract ([`:36-49`](../mobile/src/lib/encryptedStorage.ts#L36-L49)) is that callers
   treat `null` as "not present". Preserve it.

### 5.5 Acceptance criteria

- [ ] Round-trip test: `setItem` → `getItem` returns the original, including a
      Tamil-text value and a value containing `:`.
- [ ] **Tamper test:** flip a byte in stored `v3:` ciphertext; `getItem` returns
      `null`. This test must fail against the current `v2:` implementation — that is
      the proof the item did something.
- [ ] Backward-compat test: a `v2:` blob written by the old code still decrypts, and
      is rewritten as `v3:` afterwards.
- [ ] Key-generation test asserts the CSPRNG source is used and the key is 256 bits of
      entropy, not 64 hex chars from `Math.random()`.
- [ ] Guest prefs written by the new code are not readable as plaintext JSON from
      AsyncStorage.
- [ ] Analytics test: with consent off, `trackEvent` is a no-op; with consent on, a
      disallowed property key is dropped rather than sent.
- [ ] `cd mobile ; pnpm test` green. Note the local gotcha: Reanimated v4's Jest mock
      is broken here — mock the RN component, not the library.

---

## 6. P2-7 · Observability, N+1, contract tests, coverage

**Size:** Was "unscoped". It is now four separately-shippable sub-items. **7a is a
confirmed bug** and is the one to do first.

### 6.1 7a — The structured request log discards every field it collects

**This is not an investigation. It is broken right now, and it is small.**

`RequestLoggingMiddleware` builds a rich record
([`app/middleware.py:88-100`](../app/middleware.py#L88-L100)):

```python
logger.info("request", extra={
    "request_id": ..., "method": ..., "path": ...,
    "status": ..., "duration_ms": ..., "client": ...,
})
```

But the configured formatter is a fixed `%`-style string that references **none** of
them ([`app/main.py:71-86`](../app/main.py#L71-L86)):

```python
"format": '{"time":"%(asctime)s","level":"%(levelname)s","logger":"%(name)s","message":"%(message)s"}',
```

`logging`'s `extra=` fields only appear in output if the format string names them.
Every production request therefore logs the literal line
`{"time":"…","level":"INFO","logger":"app.middleware","message":"request"}` — no
route, no status, no duration, no request ID. The correlation ID that P2-3 wants to
show the user is not, today, findable in the logs it is supposed to correlate to.

A second defect in the same three lines: the format string is **hand-assembled JSON**.
Any log message containing a `"`, a backslash or a newline produces malformed JSON and
breaks the log parser — and `log.exception(...)` messages routinely contain all three.

**Scope**

- [ ] Replace the format-string formatter with a real `logging.Formatter` subclass
      that serialises via `json.dumps`, emitting the standard fields plus any `extra`
      keys present on the record. No new dependency is required; if one is preferred,
      `python-json-logger` is the conventional choice — decide, don't do both.
- [ ] Redact before emitting: bearer/token values (log a prefix or a hash, never the
      token), email addresses, lat/lon, and notification body text. P1-3 already set
      this precedent for `app/api/geo.py` — apply the same rule centrally so it is not
      re-litigated per call site.
- [ ] Test: capture the handler's output for one request and assert it is
      `json.loads`-able and contains `request_id`, `path`, `status`, `duration_ms`.
- [ ] Test: log a message containing `"` and a newline; assert the output still parses.

### 6.2 7b — N+1 queries

**Condition: write the assertion before the fix.** Add a query-counter fixture
(SQLAlchemy `before_cursor_execute` event, or `assert_num_queries`-style helper) and
land a test that records **today's** count for each suspect path. Only then optimise,
so the improvement has a number attached and a regression has a tripwire.

Suspect paths, in the order the triage recorded them:

1. Admin user profile/chart counts
2. Family-member profile retrieval
3. Notification user lookups

Fix with `selectinload`/`joinedload` or an aggregate query — whichever keeps the
response shape identical. Do not change response shapes here; that is P2-3's business.

### 6.3 7c — Contract tests for `packages/shared/src/api/`

Validate every wrapper's path, HTTP verb and param style against the FastAPI OpenAPI
schema in CI. This is the guard that would have caught both known drifts
(`getDailyGuidance` query-vs-path; `registerFcmToken` PATCH-vs-PUT).

- Generate the schema from the app (`app.openapi()`), do not check in a stale copy.
- Fail on: unknown path, path-template mismatch, verb mismatch, a required param the
  wrapper never sends.
- A repo precedent exists — the TS↔OpenAPI field-parity guard. Extend that harness if
  it fits rather than starting a second one.

### 6.4 7d — Coverage

**Done (2026-09-03).** Floor is now `--cov-fail-under=88`
([`pyproject.toml:55`](../pyproject.toml#L55)), raised from 40.

**The condition was: raise the floor only after the real number already clears it.**
It was met rather than waived. The measured number is **90.53%** (32296 statements,
3058 missed) from the clean full run recorded in
[`P2_BACKLOG_REVIEW_RESPONSE_2026-09-03.md` §9](P2_BACKLOG_REVIEW_RESPONSE_2026-09-03.md) —
4741 passed, 22 skipped, 0 failed, exit 0. No tests were added to reach it; the
coverage was already there and the floor was simply 50 points stale.

**One trap for whoever moves this next:** coverage.py compares the total *rounded to
the configured precision*, which defaults to 0. At 90.53% actual, a `fail-under` of
**91 still passes** (90.53 rounds to 91) and only 92 fails. If you want the floor to
mean the literal number, set `--cov-precision` too. 88 was chosen to sit clear of that
ambiguity with ~3 points of headroom, so an unrelated refactor does not trip the gate.

Note also that a raised floor makes *targeted* runs fail on coverage — use
`--no-cov` when running a single test file.

---

## 7. P2-8 · Cleanup

**Do last.** Cleanup verified against a red or unstable CI is unverifiable by
definition.

Known items:

- Mobile lint warnings.
- UTF-8 BOMs. **Care required:** a BOM previously hid the 38 heaviest files from a
  bundle-analysis tool here. Removing BOMs is right, but do it with a tool that
  preserves content byte-for-byte otherwise, and never by round-tripping through
  PowerShell.
- Consolidating duplicated web/mobile UI mappings (name maps, enum→label tables).
  Precedent: the panchangam name-map consolidation, where mobile was rendering raw
  enum values because it had its own partial copy.

**Conditions:** one concern per commit; no behaviour change; if a "cleanup" changes a
user-visible string, it is not cleanup — stop and raise it.

---

## 8. SEC-1 · Secret manager (P1-5 loose end)

**Status: a decision, not a build. Do not start coding this without a chosen
deployment target.** Full write-up: [`PRODUCTION_EDGE.md` §4](PRODUCTION_EDGE.md).

Five of P1-5's six parts shipped on 2026-09-03 (TLS ingress, port exposure, response
headers, nonce CSP, readiness probe). The sixth was deliberately left as a written
decision because the correct implementation is entirely determined by where this
deploys, and building against no target means building the wrong thing.

**Current state:** secrets are environment variables from a `.env` file beside the
compose file. `app/core/config.py` already refuses to boot in production without
`JOTHIDAM_JWT_SECRET`, `JOTHIDAM_ADMIN_API_KEY` and `JOTHIDAM_ENCRYPTION_KEY`, so they
cannot be *missing* — they are, however, plaintext on disk, readable by anything
running as that user, and rotated by editing a file.

**Constraints that hold for any target:**

- `JOTHIDAM_ENCRYPTION_KEY` is the one that matters. It decrypts birth dates, times,
  coordinates and — since P2-1 — journal text. Lose it and the data is gone; leak it
  and the at-rest encryption is decorative.
- Prefer injection at process start over a file on disk. **Keep the env-var
  interface** — `Settings` then needs no change, and a compromised host reads the
  value out of `/proc` either way, so this is about breadth of exposure, not about
  defeating host compromise.
- Rotation must be a supported operation before it is an emergency. For the encryption
  key that already means `JOTHIDAM_ENCRYPTION_KEYS` plus
  `scripts/rotate_encryption_key.py` — see [`DATA_PROTECTION.md`](DATA_PROTECTION.md).

**What to ask the owner before starting:** which target — a cloud provider's secret
manager (AWS/GCP/Azure), HashiCorp Vault, or Docker/Kubernetes secrets on the existing
compose deployment? The answer picks the implementation; nothing else is blocking.

**Two smaller open items recorded alongside it** (`PRODUCTION_EDGE.md` §5), neither
blocked on anything:

- Certificate **renewal** is not wired up. The `edge` compose service expects certs
  mounted at `${CERTBOT_CONF_DIR}` and the `/.well-known/acme-challenge/` webroot
  exists, but no certbot sidecar or ACME-native proxy renews them.
- **Nothing checks that the two proxy-hop counts agree.** `TRUSTED_PROXY_HOPS_BEFORE_WEB`
  and `JOTHIDAM_TRUSTED_PROXY_COUNT` describe the same deployment from two ends and are
  coupled by documentation only. A boot-time assertion would be better, and is a small
  standalone task.

---

## 9. Corrections to the triage document

Recorded so the next reader does not inherit a stale premise. A recorded conclusion
outlives the check that produced it — re-verify before planning around any "blocked
by" note, including the ones in this file.

| Triage said | Actually |
|---|---|
| P2-5: "no newsletter migration" | Wrong — migration `ee4f5a6b7c8d` exists. The gap is the ORM model, which is what §4 builds. |
| P2-6: "custom CryptoJS/password-key storage" | Half wrong — tokens and the key are both in SecureStore. The real defects are §5.2, and one of them (`Math.random()` key generation, 6b) is not in the triage doc at all. |
| P2-7: "confirm request ID … is actually emitted" | Confirmed **absent**. The formatter drops every `extra` field. It is a bug with a fix, not an investigation — §6.1. |
| P2-3: "much cheaper once P1-1 has established what a per-section status looks like" | Correct, and P1-1 landed (`28e5728`). The vocabulary to reuse is at `daily_snapshot.py:33-45`. |
