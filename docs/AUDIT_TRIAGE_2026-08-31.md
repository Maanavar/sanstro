# Production-readiness audit — triage and implementation plan

**Date:** 2026-08-31
**Branch at time of writing:** `harden/production-readiness`
**Source:** external full-code audit (20 items, P0–P2). This document is the
*verified* version of that audit: every claim below was reproduced against the
working tree before being written down. Claims that did not survive checking are
recorded in [Section 5](#5-rejected-corrected-or-deferred) with the reason.

## How to use this document

Each task has the same shape:

- **Why** — what breaks today, in user or operator terms.
- **Evidence** — the file and line I verified it at. Re-check before editing; the
  line numbers drift.
- **Change** — what to do, specifically.
- **Verify** — the command or observation that proves it is done.
- **Risk** — what this change could break, and how to not break it.

Do the tasks **in the order given**. The ordering is not cosmetic: P0-2 (CI) makes
every later task verifiable, and P0-3 (lint) is the task most likely to cause a
silent regression if attempted casually.

Do **one task per commit**. Do not bundle. If a task turns out to be bigger than
described, stop and write down what you found rather than expanding scope.

---

## 1. Non-negotiable safety rules

Read this section before touching anything. Most of it exists because the listed
failure has already happened in this repo at least once.

### 1.1 Never run a blanket `ruff --fix`

`ruff check app tests --fix` will delete working code here. It has done so before.

`app/calculations/yogas.py` is a **facade module**. Its own header says:

```
# ── Re-export everything from sub-modules so callers don't need to change ──────
```

It has no `__all__`, so Ruff sees 20+ re-exported names as `F401 unused-import`.
Deleting them breaks, at minimum:

- `app/calculations/remedies.py:8` — `from app.calculations.yogas import get_badhaka_lord`
- `app/services/_chart_build.py:37` — `detect_yogas_and_doshams`
- `tests/test_yogas.py`, `tests/test_yoga_strength_gate.py`,
  `tests/test_yoga_strength_integration.py`, `tests/test_drishti_yoga_golden.py`,
  `tests/test_astrology_shared_rules.py`, `tests/test_perf_budget.py`

The same facade pattern applies to `app/calculations/_yoga_helpers.py`,
`app/calculations/_yoga_dosham.py`, `app/services/_chart_persist.py`,
`app/services/_chart_planets.py`, `app/services/_chart_summary.py`.

**Rule:** fix F401 **one file at a time**, and for each one first answer *"is this
name re-exported for someone else?"* by grepping for it. Facade files get an
`__all__` or a `per-file-ignores` entry. They do not get their imports deleted.

### 1.2 Never mechanically "fix" `UP042` (str-Enum → StrEnum)

Ruff reports 6 classes inheriting from both `str` and `Enum`, and offers to
convert them to `enum.StrEnum`. **This changes runtime behaviour.**

With `class Band(str, Enum)`, `str(Band.GOOD)` returns `"Band.GOOD"`.
With `class Band(StrEnum)`, `str(Band.GOOD)` returns `"GOOD"`.

The affected classes are on the verdict path:

| File | Class |
|---|---|
| `app/calculations/verdict_lexicon.py:36` | `VerdictRung` |
| `app/reasoning/verdict.py:18` | `Band` |
| `app/reasoning/promise_gate.py:37` | `GateGrade` |
| `app/reasoning/contradiction.py:24` | `Reading` |
| `app/core/error_codes.py:12` | `ErrorCode` |
| `app/core/auth_throttle.py:20` | `AuthThrottleAction` |

Any of these reaching an f-string, a log line, a JSON body or a template would
change what a user reads. **Do not convert them as part of a lint cleanup.** Add
`UP042` to the `ignore` list in `pyproject.toml` with a comment pointing at this
section. If someone wants the migration later it is its own task, one enum per
PR, with a grep for every interpolation site.

### 1.3 Astrology calculation changes require golden output

Any edit inside `app/calculations/**` or `app/reasoning/**` — *including a lint
fix* — must be preceded by capturing golden output and followed by comparing it.

Existing golden tests to lean on:

- `tests/test_drishti_yoga_golden.py`
- `tests/reasoning/test_life_areas_golden.py`

If the module you are touching has no golden test, write a throwaway script that
runs the affected function over a fixed set of synthetic charts, dump the result
to the scratchpad **before** the edit, and diff **after**. A lint fix that changes
a single output value is not a lint fix, it is a regression.

This repo's recorded failure mode is not loud crashes. It is a correct rule made
unreachable, a dropped default that silently emptied three consumers, a mis-keyed
table that capped nine yogas at dormant for months. None of those failed a test.
Diff the outputs.

### 1.4 `B905` (`zip(..., strict=)`) is a behaviour change in calculation code

Adding `strict=True` makes a length mismatch **raise** where it previously
truncated silently. Four of the five hits are in tests and are safe. The fifth is
not:

- `app/calculations/jaimini_karakas.py:60` — **decide deliberately.** If the two
  sequences are invariantly the same length, `strict=True` is correct and turns a
  silent bug into a loud one. If they can legitimately differ, use
  `strict=False` explicitly and comment why. Do not guess.

### 1.5 Test database

Never point pytest at the dev database. Before running the suite:

```powershell
$env:JOTHIDAM_DATABASE_URL = "postgresql://slw_admin:slw_dev_password@localhost:5433/vinaadi_test"
$env:JOTHIDAM_TEST_DB_RESET_ACK = "I_UNDERSTAND_THIS_WIPES_TEST_DB"
$env:PYTHONUTF8 = "1"
$env:PYTHONIOENCODING = "utf-8"
```

`vinaadi_dev` on port **5432** is real data. `vinaadi_test` on port **5433** is
disposable. The conftest guard refuses `vinaadi_dev` — do not bypass it.

### 1.6 API contracts span four surfaces

`app/api/`, `packages/shared/src/api/`, `mobile/src/api/`, `web/`. There is no
compile-time check across this boundary. Before changing any route path, query
param or response field, grep all four. Any **new** endpoint gets a typed wrapper
in `packages/shared/src/api/` and new consumers use the wrapper.

### 1.7 Other standing rules

- **PowerShell**, not Bash. Chain with `;` not `&&`. No `head` — use
  `Select-Object -First N`.
- Never round-trip source files through PowerShell redirection — it adds a BOM and
  mojibakes Tamil. Use the editor's write tool or `Set-Content -Encoding utf8`.
- No real personal data in tests, fixtures, docs or example payloads. Synthetic
  identities only.
- Display copy follows the reader's active language. No bilingual echo.

---

## 2. P0 — do these first

### P0-1 · Homepage newsletter form posts to a route that does not exist

**Why.** A visitor types their email on the homepage and gets an error. The
backend endpoint works; the frontend cannot reach it. This is the only item in
this document that is losing something right now.

**Evidence.**

- `web/components/home-content.tsx:633` — `fetch("/api/v1/newsletter", …)`
- The only Next route handler in the app is
  `web/app/api/backend/[...path]/route.ts`. There is no `/api/v1/*` route, so this
  request 404s at the Next layer and never reaches FastAPI.
- The backend endpoint is real: `app/api/newsletter.py:25`, mounted at
  `app/main.py:250` under `settings.api_v1_prefix` (`/api/v1`).

**Change.** Route the call through the existing helper, which prefixes
`/api/backend` and normalises the `/api/v1` segment
(`web/lib/api.ts:41`, `normalizeApiPath` at `web/lib/api.ts:18`):

```ts
import { apiFetchJson } from "@/lib/api";

await apiFetchJson("/newsletter", {
  method: "POST",
  body: JSON.stringify({ email: email.trim(), source: "web_home" }),
});
```

`apiFetchJson` throws on non-2xx, so replace `setStatus(res.ok ? "done" : "error")`
with a try/catch that sets `"done"` on success and `"error"` in the catch. It also
sets `Content-Type`, `X-Request-ID` and the `X-Vinaadi-CSRF` header the mutating
path expects — the current hand-rolled `fetch` sets none of those.

**Also.** `app/api/newsletter.py:46` raises inside an `except` without `from` —
fix it in the same commit (`raise HTTPException(...) from None`; `from None` is
right here because the internal error is already logged and must not surface).

**Verify.** Submit the form against a running dev stack; confirm a row lands in
`newsletter_subscribers`. Add a test that asserts the posted URL is
`/api/backend/api/v1/newsletter`.

**Risk.** Low. Isolated to one component.

**Note.** The audit claimed the table has no migration. That is wrong — it exists
at `migrations/versions/ee4f5a6b7c8d_add_newsletter_subscribers.py`. The real gap
is that `app/api/newsletter.py` uses raw `text()` SQL with no ORM model, so no
test fixture creates the table. That is a P2, listed at [§4.5](#p2-5--newsletter-orm-model).

---

### P0-2 · The web CI job has never run

**Why.** This is the most important item in the document. `web` lint, unit tests
and build are all inside one CI job that cannot get past dependency install. So
every claim of "the web tests pass" is unverified, and every later task in this
document is unverifiable until it is fixed.

**Evidence.**

- `.github/workflows/ci.yml:117-121` — `cache-dependency-path: web/package-lock.json`
  then `npm ci`.
- **`web/package-lock.json` does not exist.** Neither does a root
  `package-lock.json`. The repo uses pnpm: `pnpm-lock.yaml` at root,
  `pnpm-workspace.yaml`, `"packageManager": "pnpm@11.8.0"`.
- Even with a lockfile, `npm ci` inside `web/` would fail: `web/package.json`
  depends on `@vinaadi/shared: "workspace:*"` and
  `@vinaadi/design-tokens: "workspace:*"`, which npm cannot resolve.
- The `e2e` job at `.github/workflows/ci.yml:157-161` has the identical defect.

**Change.** Convert both jobs to pnpm, installing from the repo root and filtering
to the web package:

```yaml
- uses: pnpm/action-setup@v4
  with:
    version: 11
- uses: actions/setup-node@v4
  with:
    node-version: "20"
    cache: pnpm
- name: Install
  run: pnpm install --frozen-lockfile
- name: Lint
  run: pnpm --filter jothidam-ai-web lint
- name: Unit tests
  run: pnpm --filter jothidam-ai-web test -- --coverage
- name: Build
  run: pnpm --filter jothidam-ai-web build
```

Remove the `defaults.run.working-directory: web` block — the install now happens
at root. `mobile.yml` already uses `cache: pnpm` and can serve as the reference.

**Verify.** Push and watch the job go green. If `pnpm install --frozen-lockfile`
fails, the lockfile is stale relative to the manifests — regenerate it in its own
commit and say so, do not switch to `--no-frozen-lockfile`.

**Expect the job to be red on its first successful install.** That is the point:
you will be seeing web lint and test results for the first time. Fix what it
reports as follow-up tasks, and record them here. Do not weaken the gate to make
it green.

**Risk.** CI-only. Cannot affect runtime behaviour.

---

### P0-3 · Ruff gate is red — 121 violations

**Why.** `.github/workflows/ci.yml:59` runs `ruff check app tests` as a blocking
step. It currently reports **121 errors**, so the backend-lint job fails on every
push. A permanently-red gate is the same as no gate: nobody reads it, and a real
finding cannot be distinguished from the noise.

**Evidence.** `python -m ruff check app tests --statistics`:

| Count | Rule | Handling |
|---|---|---|
| 50 | `F401` unused-import | **Split — see below. Do not bulk-fix.** |
| 30 | `I001` unsorted-imports | Safe autofix |
| 8 | `S105` hardcoded-password-string | All false positives → `# noqa` |
| 6 | `UP042` replace-str-enum | **Do not fix** — see [§1.2](#12-never-mechanically-fix-up042-str-enum--strenum) |
| 6 | `W292` missing-newline-at-eof | Safe autofix |
| 5 | `B905` zip-without-strict | 4 tests safe; 1 calc file needs a decision — [§1.4](#14-b905-zipstrict-is-a-behaviour-change-in-calculation-code) |
| 5 | `S110` try-except-pass | **Do not `noqa`.** Fixed by [P1-1](#p1-1--daily-snapshot-swallows-five-classes-of-failure) |
| 3 | `UP045` non-pep604-optional | Safe autofix |
| 2 | `B904` raise-without-from | Manual, 2 sites |
| 2 | `UP035` deprecated-import | Safe autofix |
| 1 | `E731` lambda-assignment | Manual, in `_yoga_detect.py` |
| 1 | `F811` redefined-while-unused | Benign — see below |
| 1 | `S101` assert | Inspect |
| 1 | `UP037` quoted-annotation | Safe autofix |

**Change — in this order, as separate commits.**

1. **Mechanical, no behaviour change.** `I001`, `W292`, `UP045`, `UP035`, `UP037`.
   Run `ruff check app tests --select I001,W292,UP045,UP035,UP037 --fix`. Read the
   diff. These are safe.

2. **`S105` — 8 false positives.** Every one is a constant *name* that contains a
   password-ish word, not a secret:
   `app/api/auth.py:58` (`_GOOGLE_TOKEN_URL`), `app/core/auth.py:31-32`
   (`TOKEN_TYPE_ACCESS`, `TOKEN_TYPE_PASSWORD_RESET`),
   `app/core/auth_throttle.py:24` (`FORGOT_PASSWORD`),
   `app/core/error_codes.py:33-35` (`TOKEN_EXPIRED`, `TOKEN_INVALID`,
   `TOKEN_REVOKED`), `app/reasoning/promise_gate.py:38` (`PASS`).
   Follow the convention `pyproject.toml:68` already states — an inline
   `# noqa: S105 — <reason>`. Do not disable the rule globally; `S` is deliberately
   on as a security ratchet.

3. **`F401` — 50 hits, two populations.** Handle separately.

   **(a) Facade re-exports — add `__all__`, do not delete.** These files import
   names purely to re-export them:
   `app/calculations/yogas.py` (~20 hits), `app/calculations/_yoga_helpers.py`,
   `app/calculations/_yoga_dosham.py`, `app/services/_chart_persist.py`,
   `app/services/_chart_planets.py`, `app/services/_chart_summary.py`.

   Preferred fix is an explicit `__all__` listing the public surface — it satisfies
   Ruff *and* documents the facade. Alternative, if `__all__` is unwieldy: a
   `per-file-ignores` entry in `pyproject.toml` with a comment. Either way,
   **grep each name before touching it.**

   **(b) Genuinely unused — delete.** `app/api/daily_snapshot.py:3` (`UTC`,
   `datetime`, `timedelta`), `app/core/auth_throttle.py:13,15`,
   `app/core/public_endpoint_limiter.py:13,16`, `app/core/tier_limits.py:9`,
   `app/services/_dg_goals.py:11`, `app/services/_dg_peyarchi.py:7`,
   and the test-file hits in `tests/`.

   **Check individually before deleting:**
   `app/services/encryption.py:12` (`InvalidToken` — may be re-exported for
   callers to catch; grep first) and `app/services/synastry_service.py:1053-1055`
   (function-local imports — confirm they are not there to break an import cycle).

4. **`B904` — 2 sites.** `app/api/newsletter.py:46` (done in P0-1) and
   `app/api/webhooks.py:56`. Add `from err` or `from None`. Prefer `from None`
   where the original exception is already logged and must not leak to the client.

5. **`E731`** — `app/calculations/_yoga_detect.py:616`, lambda → `def`. This is a
   calculation file: [§1.3](#13-astrology-calculation-changes-require-golden-output)
   applies. Capture golden output first.

6. **`B905`** — tests are safe; `app/calculations/jaimini_karakas.py:60` needs the
   deliberate decision in [§1.4](#14-b905-zipstrict-is-a-behaviour-change-in-calculation-code).

7. **`UP042`** — add to `ignore` in `pyproject.toml` with a comment referencing
   [§1.2](#12-never-mechanically-fix-up042-str-enum--strenum). Do not convert.

8. **`S101`** — one `assert` outside `tests/`. Read it. If it is an invariant
   check on a real code path, convert it to a raised exception (asserts vanish
   under `python -O`). If it is test-adjacent, `noqa` with a reason.

**Already investigated — do not re-open.** `F811` at
`app/calculations/_yoga_dosham.py:23`: `SIGN_LORD` is imported twice, from
`chart_strength` (line 8) and from `_yoga_helpers` (line 23). `_yoga_helpers`
itself imports `SIGN_LORD` from `chart_strength`, so **both names bind the same
object**. It is benign shadowing, not a calculation defect. Fix it by dropping the
redundant name from one import list; expect no output change.

**Also install mypy locally** — `pip install -e .[dev]` includes it, but it is
currently missing from `.venv`, so `mypy app` only ever runs in CI where nobody
sees it until after push.

**Verify.** `python -m ruff check app tests` exits 0. `python -m mypy app` runs.
Full pytest suite passes against the test DB. Golden outputs unchanged.

**Risk.** Medium-high if done carelessly, low if done as described. The entire
risk is concentrated in step 3(a) and in anything under `app/calculations/`.

---

### P0-4 · Rate limits are silently 2× looser in production

**Why.** Production runs two uvicorn workers with an **in-memory** rate limiter.
Each worker keeps its own counters, so a limit of "5 attempts per minute" is
actually up to 10, and which counter a request hits depends on which worker
accepted it. Login throttling and public-endpoint abuse controls are the things
being weakened.

**Evidence.**

- `docker-compose.app.yml:41` — `WEB_CONCURRENCY: ${WEB_CONCURRENCY:-2}`
- `docker/entrypoint.sh:14,17` — `--workers "${WORKERS}"`
- `app/core/config.py:30-31` — `rate_limit_backend: str = "memory"`,
  `cache_backend: str = "memory"`

**Change.** Either is acceptable; pick one and record why.

- **Simple:** default `WEB_CONCURRENCY` to `1` in `docker-compose.app.yml`.
- **Correct at scale:** keep 2 workers and set
  `JOTHIDAM_RATE_LIMIT_BACKEND=redis`. The Redis extra already exists
  (`pyproject.toml:43-45`) and the code imports redis lazily with an in-memory
  fallback.

Then **make the mismatch impossible to ship again**: at startup, if
`WEB_CONCURRENCY > 1` and `rate_limit_backend == "memory"`, log a loud warning —
or refuse to boot when not in debug. A silent 2× is worse than a crash.

**Verify.** With the fix in place, exceed a known limit and confirm you are
throttled at the configured number, not roughly double it.

**Risk.** Dropping to one worker halves request concurrency. Fine at current
traffic; note it so it is a deliberate choice, not an accident.

---

### P0-5 · The web Docker image cannot build

**Why.** Two independent stoppers. If the deployment path is this image, there is
no deployment path.

**Evidence.**

- `web/Dockerfile:5` — `COPY package.json package-lock.json ./` then `npm ci`.
  Same missing-lockfile and `workspace:*` problems as [P0-2](#p0-2--the-web-ci-job-has-never-run).
- `web/Dockerfile:30` — `COPY --from=builder /app/.next/standalone ./`, but
  `web/next.config.mjs` has **no `output: "standalone"`**, so that directory is
  never produced. The final `CMD ["node", "server.js"]` has no `server.js` to run.

**Change.**

1. Add `output: "standalone"` to the config object in `web/next.config.mjs`.
2. Rewrite the deps stage for pnpm and a monorepo build context. The build context
   must be the **repo root**, not `web/`, because the image needs
   `pnpm-lock.yaml`, `pnpm-workspace.yaml` and `packages/*`. Update whatever
   invokes the build accordingly.

**Verify.** `docker build` succeeds and the container serves the app on 3000.
Actually run it — a build that succeeds and a container that boots are two claims.

**Risk.** Build-time only. Do it after P0-2 so the pnpm invocation is already
proven in CI.

---

## 3. P1 — correctness, privacy and secret handling

### P1-1 · Daily snapshot swallows five classes of failure

**Why.** Five bare `except Exception: pass` blocks. When a section of the daily
snapshot fails, the endpoint returns 200 with that section quietly missing. The
user sees an incomplete reading and no error; the operator sees nothing at all.
Given this repo's history of silent astrology regressions, this is the highest-
value observability fix available.

**Evidence.** `app/api/daily_snapshot.py` lines **80, 112, 132, 138, 146**
(also reported by Ruff as the 5 `S110` hits).

**Change.** For each block:

1. `logger.exception(...)` with a stable event name, so failures are countable.
2. Give the response a per-section status the client can distinguish —
   `ok` / `unavailable` — rather than an absent key. "Missing" and "failed" must
   not look identical to the frontend.
3. Narrow the caught exception type where the failure mode is known.

Check what the web and mobile clients do with a missing section before changing
the response shape — [§1.6](#16-api-contracts-span-four-surfaces) applies.

**Verify.** Force each section to raise (monkeypatch in a test) and assert the
response marks that section unavailable and emits a log record.

**Risk.** Response-shape change. Additive if you add a status field rather than
altering existing keys. Do it additively.

---

### P1-2 · The Next proxy forwards client-supplied `X-Forwarded-For`

**Why.** Not currently exploitable — it is a landmine. The proxy copies **every**
client header verbatim to the backend. The backend trusts the last
`trusted_proxy_count` entries of `X-Forwarded-For` to identify the client IP. That
setting defaults to `0` today, so the header is ignored and nothing is wrong. The
day anyone sets it to `1` for a real edge — which is exactly what
[P1-5](#p1-5--production-edge-baseline) involves — clients can spoof their IP and
walk around every IP-keyed rate limit.

**Evidence.**

- `web/app/api/backend/[...path]/route.ts:11-13` — deletes only `host` and
  `content-length`.
- `app/middleware.py:147-165` — `resolve_client_ip`.
- `app/core/config.py:40` — `trusted_proxy_count: int = 0`.

**Change.** In the proxy, `headers.delete("x-forwarded-for")` alongside the
existing deletes, then set it explicitly from the connection Next actually
observed. Add a comment tying the value of `trusted_proxy_count` to the number of
hops in front of the backend, so the two are changed together.

**Verify.** Send a request with a forged `X-Forwarded-For`; confirm the backend
does not attribute the request to the forged address at any `trusted_proxy_count`.

**Risk.** Low. Do this **before** anyone configures a real edge, not after.

---

### P1-3 · Geocoding logs search queries and precise coordinates

**Why.** `geocode_ok` logs at INFO on every successful lookup, including the raw
user-typed query and lat/lon to 4 decimal places — roughly 11 metres. A birthplace
search is personal data, and this ships it into log aggregation, retention and
whatever has read access there.

**Evidence.** `app/api/geo.py:198` (INFO) and `:178` (WARNING, also logs the raw
query).

**Change.** Drop the raw query and the coordinates from both lines. Log what is
operationally useful — result count, country code, timezone, latency, cache
hit/miss. If a query string is genuinely needed for debugging, put it behind DEBUG
and confirm DEBUG is off in production.

**Verify.** Grep the log output of a geocode round-trip for the query text and for
a coordinate; find neither.

**Risk.** None.

---

### P1-4 · Admin key lives in the browser

**Why.** The admin console holds a long-lived shared admin key in
`sessionStorage` and sends it as `X-Admin-Key` on roughly ten endpoints. Any XSS
on that origin, any browser extension, any shared machine reads it. It does not
expire, it is not per-user, and its use is not attributable to a person.

**Evidence.**

- `web/components/admin-console.tsx:156` — `const ADMIN_KEY_STORAGE = "vinaadi:admin-key"`
- `:180` — `headers.set("X-Admin-Key", adminKey)`
- `:631` — `sessionStorage.setItem(...)`
- `app/core/auth.py:226-233` — the backend fallback, documented as retained for
  server-to-server use.

**Change.** This is a design change, not a patch, and it is the one P1 that will
take more than an afternoon. Sequence it:

1. Move admin authorisation onto the **normal authenticated session** with a
   server-side role check. The console stops holding a credential at all.
2. For destructive operations, require a short-lived elevation — re-enter password,
   get a token valid for minutes, scoped to admin actions.
3. Keep the `X-Admin-Key` path **only** for genuine server-to-server callers, and
   make it unreachable from a browser origin.
4. Audit-log every privileged operation with the acting user, and test that.

**Verify.** With `sessionStorage` empty and a valid admin session, the console
works. With a stolen key and no session, browser-origin admin calls are refused.

**Risk.** Highest-touch item in P1. Do it after P0 is stable. Do not start it as a
drive-by.

---

### P1-5 · Production edge baseline

**Why.** No TLS ingress, security headers, HSTS or CSP is defined for the app
beyond the widget-specific `frame-ancestors *` rule at `web/next.config.mjs:11-18`.

**Change.** Terminate TLS at an ingress; do not expose the raw API or database
management ports publicly; add the standard response headers and a CSP; move
secrets to a secret manager. Add a **readiness** probe that checks the database
and cache, distinct from a liveness probe.

**Order dependency.** Do [P1-2](#p1-2--the-next-proxy-forwards-client-supplied-x-forwarded-for)
first. Putting a proxy in front while the XFF passthrough exists is precisely the
configuration that makes the spoof live.

---

### P1-6 · Refresh-token and quota concurrency (**investigate before implementing**)

**Status: unverified.** The audit claims refresh-token rotation and Ask Vinaadi
quota reservation are not atomic. I confirmed rotation exists
(`app/api/mobile_auth.py:219`, documented at `:7`) but did **not** verify the race.

**Do this first:** write a test that fires N concurrent refreshes with the same
token and N concurrent quota-consuming requests, and see whether the invariant
holds. If it holds, close this item and record that. If it does not, fix with a
conditional update (`UPDATE … WHERE revoked_at IS NULL` and check rowcount) or a
row lock, and reserve quota **before** the provider call, settling or refunding
explicitly afterwards.

Do not implement a fix for a race you have not reproduced.

---

## 4. P2 — worth doing, not before launch

### P2-1 · Encrypt journal text and other sensitive fields

Encryption today is selective: birth date, time and coordinates use
`EncryptedDate` / `EncryptedTime` / `EncryptedFloat`
(`app/models/birth_profile.py:10`), but `JournalEntry.note_text` is a plaintext
`String(2000)` (`app/models/journal_entry.py:26`) — free text a user wrote about
their own life.

Be honest about the benefit: application-level encryption with one Fernet key in
the environment protects against a **leaked database dump**. It does not protect
against a compromised application host, because the key is right there. Worth
doing for the dump case; do not describe it as more than that. Key versioning and
rotation should land in the same change or the migration path gets painful.

Also define hard-delete and backup-expiry policy — journal retention currently
archives via `deleted_at` and never removes. And only after the implementation
matches should the privacy policy claim it.

### P2-2 · pnpm overrides are in a location pnpm ignores

Root `package.json` carries `pnpm.overrides` pinning `@types/react` to `19.2.17`
and `@types/react-dom` to `19.2.3`. But `pnpm-workspace.yaml` already carries its
own `overrides:` block and an `allowBuilds:` key — the newer configuration
location. With `"packageManager": "pnpm@11.8.0"`, the `package.json` block is very
likely being **ignored**, meaning the React types pin is not applied.

Confirm by running `pnpm why @types/react` and checking the resolved version. If
ignored, move both entries into `pnpm-workspace.yaml`. Also delete the root
`"workspaces"` array — that is npm syntax and inert under pnpm, where
`pnpm-workspace.yaml` is authoritative. It is pure confusion for the next reader.

### P2-3 · Typed error and empty-state system

Stable error code + bilingual message + request ID from the backend; code matching
rather than substring matching on the frontend; shared components that make
loading, failure, empty, gated, unavailable and retry visually distinguishable.
Tamil/English parity tests, and a test that no technical detail leaks to the user.

This is a genuinely good idea and a large one. It becomes much cheaper once
[P1-1](#p1-1--daily-snapshot-swallows-five-classes-of-failure) has established
what a per-section status looks like. Do it after, not before.

### P2-4 · Stale documentation

`docs/AGENT_INSTRUCTIONS.md` claims "233 passing tests"; `docs/archive/FRONTEND.md`
and `docs/archive/IMPLEMENTATION_GUIDE.md` repeat it. Backend coverage floor is
`--cov-fail-under=40` (`pyproject.toml:55`).

Replace the hardcoded number with generated output, or delete the claim. A number
that was true once and is now decoration teaches readers to distrust the docs. The
archived copies can simply be left alone or marked archived — do not spend time
there.

### P2-5 · Newsletter ORM model

`app/api/newsletter.py` uses raw `text()` SQL against `newsletter_subscribers`.
The migration exists (`ee4f5a6b7c8d`), but with no ORM model no test fixture
creates the table, so the endpoint is untestable without a migrated database. Add
the model, then add API, duplicate-submission, validation and failure-state tests.

### P2-6 · Mobile storage hardening

Narrower than the audit claimed. Tokens are correctly in `expo-secure-store`
(`mobile/src/lib/secureStore.ts:16-33`), and the AES key is generated into
SecureStore too (`:42-46`). Two real, small items:

- `mobile/src/lib/encryptedStorage.ts:8` uses `CryptoJS.AES` — unauthenticated CBC,
  no MAC, so ciphertext is malleable. Prefer platform-backed authenticated
  encryption.
- `mobile/src/features/guest/guestStore.ts:49,65` writes guest location and
  preferences to **plain** AsyncStorage.

Analytics consent, opt-out and an event allowlist belong here too: confirm no
astrological segment or identifier is sent before consent.

### P2-7 · Observability, N+1 queries, contract tests, coverage

Grouped because each needs measurement before it needs code.

- **Logging formatter** — confirm request ID, route, status and duration are
  actually emitted (`app/middleware.py:97`), and redact token prefixes, location,
  email and notification content.
- **N+1 paths** — admin user profile/chart counts, family-member profile
  retrieval, notification user lookups. Add a query-count assertion to a test
  **first**, so the fix has a number attached.
- **Contract tests** — validate `packages/shared/src/api/` wrappers against the
  FastAPI/OpenAPI schema in CI. Two wrappers have already silently drifted
  (`getDailyGuidance` query-vs-path param; `registerFcmToken` PATCH-vs-PUT). This
  is the guard that would have caught both.
- **Coverage** — raise from the 40% floor deliberately, prioritising auth,
  payments, access control and calculations. Raise the floor only after the real
  number clears it, so the gate never has to be lowered.

### P2-8 · Cleanup, last

Mobile lint warnings, UTF-8 BOMs, and consolidating duplicate web/mobile UI
mappings. Do these only once the gates above are stable — cleanup against a red
CI is unverifiable by definition.

---

## 5. Rejected, corrected or deferred

Recorded so nobody re-raises them from the original audit without the context.

| Audit item | Verdict |
|---|---|
| "No newsletter migration" | **Wrong.** `migrations/versions/ee4f5a6b7c8d_add_newsletter_subscribers.py` exists. The real gap is the missing ORM model — [P2-5](#p2-5--newsletter-orm-model). |
| "Custom CryptoJS/password-key storage" on mobile | **Half wrong.** Tokens are in SecureStore; the key is in SecureStore. The valid, narrower points are in [P2-6](#p2-6--mobile-storage-hardening). |
| "Refresh rotation is not atomic" | **Unverified.** Rotation exists. Reproduce the race before fixing — [P1-6](#p1-6--refresh-token-and-quota-concurrency-investigate-before-implementing). |
| "Create one data inventory/classification policy" | **Deferred.** Compliance-shaped work for an org with an ops team. Not a release blocker for a pre-launch product. |
| "Document Anthropic as a processor, vendor governance" | **Deferred**, except one concrete part worth doing early: minimise the chart context sent per question, and keep journal free-text out of prompts unless deliberately consented. |
| "Traces, metrics, dashboards, alerts, SLOs" | **Deferred.** Start with the logging formatter in [P2-7](#p2-7--observability-n1-queries-contract-tests-coverage). |
| **"Decompose oversized modules"** | **Deferred, and the riskiest item in the audit for this repo.** The recorded failure history is silent astrology regressions that no test caught. Do not start a decomposition programme until CI actually runs and golden coverage exists for the target module. When it happens: one module per PR, golden outputs captured before each extraction, stable facade preserved — the `yogas.py` split is the model to copy. |
| "Constrained enums / schema governance" | **Deferred.** Overlaps [§1.2](#12-never-mechanically-fix-up042-str-enum--strenum) — changing enum types on the verdict path changes user-visible strings. Not a cleanup. |

### What the audit could not see

It is a generic architecture review, so it is blind to this product's actual risk
surface: calculation and doctrine correctness. Nothing in its 20 items touches the
fact that the porutham re-weighting moved every couple's composite by up to ±15
points against verdict bands that have never been re-cut, or that the Madhyama
grade is missing from four surfaces. Those are tracked separately in
[`ASTROLOGER_QUESTIONS_2026-08-31_BANDS_AND_SURFACES.md`](ASTROLOGER_QUESTIONS_2026-08-31_BANDS_AND_SURFACES.md)
and matter more to this product's credibility than most of what is above.

---

## 6. Verification commands

```powershell
Set-Location 'D:\sanstro'

# Lint and types
python -m ruff check app tests
python -m ruff check app tests --statistics
python -m mypy app

# Backend tests (TEST DB — never vinaadi_dev)
$env:JOTHIDAM_DATABASE_URL = "postgresql://slw_admin:slw_dev_password@localhost:5433/vinaadi_test"
$env:JOTHIDAM_TEST_DB_RESET_ACK = "I_UNDERSTAND_THIS_WIPES_TEST_DB"
$env:PYTHONUTF8 = "1"; $env:PYTHONIOENCODING = "utf-8"
pytest -q

# Web
pnpm install --frozen-lockfile
pnpm --filter jothidam-ai-web lint
pnpm --filter jothidam-ai-web test
pnpm --filter jothidam-ai-web build

# Design token ratchet
node scripts/audit-color-literals.mjs

# Dependency resolution check for P2-2
pnpm why @types/react
```

## 7. Definition of done

A task is done when its **Verify** step has been run and the output observed —
not when the edit compiles. If a step was skipped, say so in the commit message.
If a check fails, report the failure with its output rather than working around
it. Partial completion stated plainly is more useful than completion claimed
loosely.
