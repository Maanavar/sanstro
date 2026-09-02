# Refactor Plan — Production Readiness Findings

Status: proposed · Owner: TBD · Created 2026-06-20

Each item below is grounded in verified code locations. Effort is rough dev-days for
one engineer. Phases are ordered so security/correctness lands before scale work, and
nothing blocks the daily shipping cadence.

---

## Phase 0 — Security correctness (do first, small, high payoff)

> **Status (2026-06-20): DONE.** All four items shipped:
> - **0.0** `test_salaried_employment_records_info_factor` now looks up `key == "employment_salaried"` and asserts `"salaried" in factor.detail.en.lower()` — matches the actual service output.
> - **0.1** `jwt_secret`/`admin_api_key` are `str | None = Field(default=None)`; the `_require_strong_secrets_in_production` validator raises on prod/staging if either is missing, and generates a per-boot `secrets.token_urlsafe(48)` ephemeral value for dev/test with a `_logger.warning`. No literal secret in source.
> - **0.2** `me`, `patch_me`, and `delete_my_account` all use `user: User = Depends(get_current_user)` — the suspended-check and token resolution are handled centrally in `app/core/auth.py:65`.
> - **0.3** `require_csrf_header` (`app/core/auth.py:159`) is applied to all mutating cookie-auth endpoints (`logout`, `patch_me`, `delete_my_account`); `web/lib/api.ts:buildHeaders` sets `X-Vinaadi-CSRF: 1` on every POST/PATCH/PUT/DELETE.
> - **0.4** `web/middleware.ts` matcher includes `/admin/:path*`; `is_admin_user()` (`app/core/auth.py:121`) grants admin via session `is_admin` column or `JOTHIDAM_ADMIN_EMAILS` bootstrap list, so the browser no longer needs to store a long-lived admin secret. The `X-Admin-Key` fallback is retained only for server-to-server callers.

### 0.0 Fix failing career-service test (P0 regression) — `tests/test_career_service.py:126`
**Problem:** `pytest -m no_db` has one red test. `test_salaried_employment_records_info_factor`
looks for an astrological factor with `key == "employment_type"` whose detail contains
`"employed_salaried"`. But `career_service.py:255-262` emits `key="employment_salaried"` with
detail text "Salaried employee — evaluating promotion prospects…" (no `employed_salaried`
substring), so `factor` is `None` and `assert factor is not None` fails.

**Target:** Green `pytest -m no_db` (121/121).

**Decision:** The test is wrong, not the code. Sibling factors use the `employment_<type>`
convention (`employment_retired`, `employment_seventh_house`), so the code is consistent;
the test asserts a key/text that never existed.

**Steps:**
1. In `test_salaried_employment_records_info_factor`, change the lookup to `key == "employment_salaried"` and assert on the actual detail text (e.g. `"salaried" in factor.detail.en.lower()`).
2. Re-run `pytest -m no_db` in the user env / Docker `vinaadi_test` (swisseph DLL is WDAC-blocked in the sandbox — see guardrails).

**Effort:** 0.1d. **Risk:** none. **Do this first** — it's a one-line fix and unblocks a green baseline for everything below.

---

### 0.1 Remove committed default secrets — `app/core/config.py:7-8`
**Problem:** `_DEFAULT_JWT_SECRET` and `_DEFAULT_ADMIN_API_KEY` are real, publicly-known
values used whenever `environment != "production"`. Any staging/misconfigured box signs
JWTs with a known key.

**Target:** No usable secret literal in source. Hard fail if unset in any env that serves
real users; ephemeral per-boot secret only for local dev/tests.

**Steps:**
1. Change `jwt_secret`/`admin_api_key` defaults from the literal to `None` (type `str | None`).
2. In the existing `model_validator`, require both when `environment in {"production", "staging"}`; raise `ValueError` if missing.
3. For `development`/`test`: if unset, generate a per-process random secret via `secrets.token_urlsafe(48)` and log a warning ("ephemeral dev secret — tokens won't survive restart").
4. Add the two keys to `.env.example` with placeholder text and document in README.
5. Grep for any test that hardcodes the old default and inject via env/fixture instead.

**Effort:** 0.5d. **Risk:** low. **Blast radius:** auth only; covered by login tests.

---

### 0.2 Collapse duplicated auth boilerplate — `app/api/auth.py:144-243`
**Problem:** `me`, `patch_me`, `delete_my_account` each re-implement cookie → `decode_token`
→ `UUID()` → `session.get(User)` → suspended check. `get_current_user` (`app/core/auth.py:59`)
already does this. Divergence risk on a future security fix.

**Target:** All three depend on `get_current_user`.

**Steps:**
1. Confirm `get_current_user` returns the `User` and enforces the suspended/`email is None` checks (extend it if not, so behaviour is identical).
2. Replace the three handlers' manual blocks with `user: User = Depends(get_current_user)`; drop the `vinaadi_token: Cookie` params.
3. Keep `delete_my_account`'s `Response` param (cookie clearing) untouched.
4. Tests: existing auth tests should pass unchanged; add one asserting suspended user gets 401/403 on all three.

**Effort:** 0.5d. **Risk:** low. Do this alongside 0.1 (same file/test surface).

---

### 0.3 Add CSRF defense for cookie-auth state-changing endpoints
**Problem:** `SameSite=Lax` blocks most but not all cross-site writes.

**Target:** Double-submit token or a required custom header on all non-idempotent
cookie-authenticated routes.

**Steps (recommend the header approach — least code):**
1. Add a `RequireCsrfHeader` dependency: for `POST/PATCH/PUT/DELETE` that authenticate via `vinaadi_token` cookie, require header `X-Vinaadi-CSRF: 1` (a value browsers can't set cross-site without CORS preflight, which we don't grant).
2. Apply it through the shared router-level dependencies, not per-handler.
3. Set the header in the Next.js API client (`web/lib/` fetch wrapper) for all mutating calls.
4. Exempt Bearer-token / server-to-server paths (no cookie → no CSRF surface).
5. Tests: a mutating request without the header → 403; with header → 200.

**Effort:** 1d (incl. web client wiring). **Risk:** medium — verify every mutating call in `web/` sends the header before merging, or you 403 real users.

---

### 0.4 Harden admin access — route protection + key handling — `web/middleware.ts`, `web/components/admin-console.tsx:137`
**Problem:** `web/middleware.ts` only redirects `/dashboard` when `vinaadi_token` is missing;
`/admin` has no edge protection and relies on client-side checks + backend `X-Admin-Key`. The
admin UI also holds the admin key in browser storage (`ADMIN_KEY_STORAGE = "vinaadi:admin-key"`),
which is XSS-exfiltratable and never expires.

**Target:** `/admin` is unreachable without auth at the edge, and the admin key is not a
long-lived secret sitting in browser storage.

**Steps:**
1. Add `/admin` (and `/admin/:path*`) to the `web/middleware.ts` matcher; redirect to `/login` when `vinaadi_token` is absent (defense in depth — backend `X-Admin-Key` still authoritative).
2. Short term: keep the key flow but scope/shorten it — prefer a server-side admin role/claim on the session over a static `X-Admin-Key` the browser must store.
3. Long term: move to a server-side admin role + short-lived elevated session; the browser holds no admin secret. Backend issues the elevation after re-auth, expires it server-side.
4. Tests: unauthenticated `/admin` request redirects; admin API rejects requests without a valid elevated session.

**Effort:** 0.5d edge guard now; 1–1.5d for server-side role/elevation later. **Risk:** low for the edge guard, medium for the session rework. Do the matcher change in the Phase 0 timeframe — it's one line.

---

## Phase 1 — Data integrity & supply chain

> **Status (2026-06-20): DONE.**
> - **1.1** Migration `z1a2b3c4d5e6_user_delete_cascades` adds `ON DELETE CASCADE` to the full user → birth_profile → chart / family-vault FK subtree (34 constraints, idempotent, Postgres-only; SQLite test schemas already carry these rules via `create_all`). `delete_my_account` now does one explicit `interpretation_outputs` DELETE (because those FKs are `SET NULL`) then `session.delete(user)` — the 25-statement manual chain is gone. The migration has a reversible `downgrade()` and has been verified via the `migrations` CI job (upgrade → downgrade → upgrade round-trip).
> - **1.2** `pip-audit` step in the `backend-lint` CI job audits `requirements.txt` on every push/PR, failing on any advisory except the ecdsa Minerva timing issue (GHSA-wj6h-64fc-37mp / CVE-2024-23342), which has no upstream fix and is off our HS256 signing path.

### 1.1 Replace hand-ordered cascade delete with schema cascades — `app/api/auth.py:248-328`
**Problem:** 25 manually-ordered `DELETE FROM` statements (some `noqa: S608` f-strings).
A new FK silently breaks GDPR erasure.

**Target:** `ON DELETE CASCADE` at the schema level so deleting the `users` row erases
everything; the endpoint shrinks to one delete + audit log.

**Steps:**
1. Inventory the FK graph for the 25 tables (chart_id, user_id, owner_user_id chains).
2. Write an Alembic migration adding `ondelete="CASCADE"` to each FK (drop + recreate constraint). Follow CLAUDE.md migration rules: reversible `downgrade()`, test on `vinaadi_test` first (apply → verify → downgrade → verify), never on `vinaadi_dev` without backup.
3. Update SQLAlchemy model relationships with `cascade="all, delete-orphan"` / `passive_deletes=True` to match the DB.
4. Rewrite `delete_my_account` to `session.delete(user)` (+ keep the audit/erasure-receipt log).
5. Add a regression test: seed a user with rows in every dependent table, delete, assert zero orphans across all tables. **This test is the guard against the original brittleness** — it must enumerate tables dynamically (reflect FKs) so new tables are auto-covered.

**Effort:** 2–3d (FK audit + migration is the bulk). **Risk:** medium-high — migration touches many constraints; staged rollout + the orphan test are mandatory. Sequence after 0.x.

---

### 1.2 Confirm/patch `python-jose` + `ecdsa` CVEs; plan `pyjwt` migration
**Current pins:** `python-jose==3.5.0`, `ecdsa==0.19.2` (`requirements.txt:22,43`).

**Steps:**
1. Run `pip-audit` (add to CI) and check both pins against advisories. 3.5.0 is current; `ecdsa` has the known timing-side-channel (Minerva) with no upstream fix — we only use HS256 (HMAC), so ecdsa isn't on the signing path; document that.
2. Short term: add `pip-audit`/Dependabot to the backend CI job and fail on High.
3. Long term (separate ticket, ~1d): swap to `pyjwt` — we only use HS256 encode/decode in `app/core/auth.py`, a contained change. Drop `python-jose`+`ecdsa` entirely.

**Effort:** 0.5d audit now, 1d migration later. **Risk:** low.

---

### 1.3 Bump `starlette` off 1.0.0 — **DONE 2026-09-02**

**Pins now:** `fastapi==0.136.1` (unchanged), `starlette==1.3.1`
(`requirements.txt`). The five advisories are cleared and their `--ignore-vuln`
flags are gone from CI.

**The premise that deferred this was false, and it cost the delay.** This entry
said `fastapi` constrained the starlette range, making it a two-package bump and
therefore risky enough to hold behind a suppression. `fastapi==0.136.1` requires
`starlette>=0.46.0` — **no upper bound.** Starlette moved alone, FastAPI was
never touched, and the blast radius was one package.

Both of this entry's blocking claims turned out to be wrong on inspection (see
the correction below for the other). The advisories sat suppressed on a
production-readiness branch behind an assumption nobody had re-read. The general
lesson is cheap and worth the line: **when a task is deferred because of a
constraint, record the constraint verbatim, because the next reader will inherit
the conclusion and not the check.**

**Why 1.3.1 and not latest.** 1.3.1 is the highest fix version among the five
(-161 → 1.0.1, -2280/-2281 → 1.1.0, -248 → 1.3.0, -249 → 1.3.1, confirmed
against OSV). The known route-shape breakage is FastAPI 0.141.1 with Starlette
1.6.0; 1.3.1 stops short of both, so this takes the security fix without taking
the change that has bitten here before.

**Why it needs care.** This combination has already produced a route-shape
change here. Under FastAPI 0.141.1 / Starlette 1.6.0, `route.path` changed shape
and `_chart_id_routes()` in `tests/test_chart_access_guard.py` matched **0 routes
instead of 53**. Everything in that file asserts over that enumeration, so the
blast radius is the whole chart-ownership guard.

**Corrected 2026-09-02.** An earlier revision of this entry said the suite
"stayed green while covering nothing", and step 1 below asked for a zero-match
guard to be written. Checked before acting on: that guard already existed, and
had since the file was created in `e4ce594` —
`test_there_are_chart_id_routes_to_check` asserted `len(...) > 40`, which fails
at zero, and the `stale` half of
`test_every_chart_id_route_declares_how_it_checks_ownership` fails as soon as any
declared module stops appearing. A total collapse was caught.

The real gap was narrower and the floor was the wrong shape for it: `> 40`
tolerated **53 routes becoming 41** — a quarter of the coverage gone, suite
green. That is the plausible partial outcome of a route-shape change, not the
total one. Now pinned to an exact `EXPECTED_CHART_ID_ROUTES = 53`, verified
against the live app on the current pins (53 routes across 13 modules).

**Steps:**
1. ~~Rewrite `_chart_id_routes()` so it fails when it matches zero routes, and
   assert the expected route count explicitly.~~ **Done 2026-09-02.** Exact count
   pinned at 53; `tests/test_chart_access_guard.py` passes 25/25 on the current
   pins. This is now the tripwire for step 2: if the bump changes route shape,
   this test names the number it changed to instead of quietly covering less.
2. ~~Bump `starlette` and `fastapi` together to a compatible pair at or above
   starlette 1.3.1.~~ **Done 2026-09-02, as `starlette` alone → 1.3.1.** The
   tripwire from step 1 held immediately: still 53 routes across 13 modules,
   `tests/test_chart_access_guard.py` 25/25 on the new pin. No route-shape drift
   at 1.3.1.
3. ~~Run the full suite and drop the five `--ignore-vuln` flags plus the note
   above `starlette`.~~ **Done 2026-09-02.** `pip-audit -r requirements.txt`
   with the starlette suppressions removed reports **no known vulnerabilities**.

**Left behind deliberately.** One suppression remains: `ecdsa` PYSEC-2026-1325
(the Minerva timing issue), which has **no fix version** upstream and is off our
signing path — HS256/HMAC only. It is listed in CI under two IDs,
`GHSA-wj6h-64fc-37mp` and `CVE-2024-23342`; those plus `PYSEC-2026-1325` are
aliases of **one** advisory and each alone suppresses it. Both are kept because
which alias the database reports under has changed before. It is the only finding
pip-audit still reports.

**Actual effort:** ~1h, not the estimated 0.5d — the estimate was sized against
the two-package bump that was never required.

---

## Phase 2 — Type/lint gate hardening (cheap ratchet)

> **Status (2026-06-20): DONE.** ruff `S` rules enabled and pinned (`ruff==0.15.17`
> in CI + pyproject) so version drift can't silently re-red the gate; `ruff check
> app tests` is green (the ~170 pre-existing findings from a newer ruff were cleared
> — safe codes auto-fixed, deliberate ones carry inline `# noqa: <code> — reason`,
> and one real `B023` loop-binding bug was fixed). mypy ratcheted via a per-module
> override (`app.core.*`, `app.api.*`: `check_untyped_defs=true`,
> `follow_imports=normal`) — **config landed but unverified locally** (no mypy in the
> Windows venv; py3.14 + WDAC-blocked swisseph), so CI must confirm it's green. The
> 6 web lint warnings are cleared and `npm run lint` now enforces `--max-warnings=0`.
> pip-audit was already wired in CI (Phase 1.2).

### 2.1 Strengthen mypy & ruff — `pyproject.toml:60-90`
**Problem:** `follow_imports=skip`, `check_untyped_defs=false`, tests excluded; ruff has no
`S` (bandit) rules; `eslint.ignoreDuringBuilds=true`.

**Target:** Meaningful gates without a flag-day of failures. Ratchet, don't boil the ocean.

**Steps:**
1. mypy: flip `check_untyped_defs=true`, `follow_imports=normal` for `app/core` and `app/api` only first (per-module override), expand outward each week. Keep `ignore_missing_imports` for third-party.
2. ruff: add `S` to `select`, then triage — keep real findings, `# noqa` the deliberate ones (the cascade-delete f-strings already carry `noqa: S608`). Add `S` to `per-file-ignores` for `tests/*`.
3. Add `pip-audit` step (from 1.2) to the same CI job.
4. eslint: keep `ignoreDuringBuilds=true` (a deploy artifact shouldn't be blocked by a warning) **but** confirm the separate `npm run lint` CI step fails the pipeline on error — verify it exists and is `--max-warnings=0` for new code.
5. Clear the existing 6 lint warnings so `--max-warnings=0` can be turned on: the `<img>` usages (swap to `next/image` or justify with an inline `eslint-disable` + reason) and the admin hook-dependency warning at `web/components/admin-console.tsx:253` (fix the `useEffect`/`useCallback` deps array; don't silence it — a stale closure there is a real bug risk).

**Effort:** 1–2d (mostly triaging surfaced findings). **Risk:** low; incremental. Run after Phase 0/1 so new code already conforms.

---

## Phase 3 — Backend scale & decoupling

> **Status (2026-06-20): 3.1 / 3.3 / 3.4 DONE; 3.2 deferred.** The Redis-backed
> rate limiter, cache abstraction, and decoupled cron worker all landed behind
> settings flags that default to the existing single-box behaviour (memory backends,
> scheduler-in-web), so nothing changes until ops opts in. New code:
> `app/core/cache.py`, `app/core/rate_limit.py`, `app/core/redis_client.py`,
> `app/scheduler.py`, `app/worker.py`; new settings `redis_url`,
> `rate_limit_backend`, `cache_backend`, `run_scheduler_in_web`; `redis` is an
> optional extra (`pip install .[redis]`); a `worker` service was added to
> `docker-compose.app.yml` under the `scaled` profile. `tests/test_cache_and_rate_limit.py`
> covers the in-memory backends (`no_db`).
>
> **3.2 (god-file decomposition) is intentionally NOT done here.** It is explicitly
> an incremental, one-PR-per-file effort (2–3 d each) whose safety depends on
> golden-output snapshot tests captured before/after — which in turn need pytest,
> and pytest can't run in this environment (WDAC-blocked swisseph DLL). Splitting
> 100 KB scoring modules blind, without being able to prove output-identical
> behaviour, is exactly the behavioural-drift risk the plan warns against. It should
> be done file-by-file in an environment where the test suite runs.

### 3.1 Move rate limiter to Redis — `app/middleware.py:108`
**Problem:** `_counters` lives per-worker; multi-worker Gunicorn gives ~N×limit. The code
comment already flags this.

**Target:** Shared sliding-window in Redis; in-process fallback when Redis absent (dev).

**Steps:**
1. Introduce a Redis dependency (see 3.4 — do the caching abstraction first or together).
2. Implement sliding window with a Redis sorted set per client IP (`ZADD` timestamp, `ZREMRANGEBYSCORE` to trim, `ZCARD` to count) inside a `MULTI`/pipeline; or use `redis-cell`/Lua token bucket if available.
3. Keep `resolve_client_ip` (`middleware.py:121`) unchanged — it's correct.
4. Feature-flag via settings: `rate_limit_backend = "memory" | "redis"`, default memory in dev, redis in prod.
5. Fallback: if Redis unreachable, log + fall back to in-process (fail-open on infra, not on limit).
6. Tests: integration test against a Redis test container asserting cluster-wide count.

**Effort:** 2d. **Risk:** medium. **Prereq:** 3.4. Only needed before horizontal scaling — gate on "are we running >1 worker/box yet?"

---

### 3.2 Decompose god-files (services)
**Targets (verified sizes):**
- `daily_guidance_service.py` (101 KB)
- `life_areas_service.py` (95 KB)
- `narrative_engine.py` (66 KB)
- (also worth it: `chart_service.py` 57 KB, `family_vault_service.py` 52 KB, `app/calculations/yogas.py` 98 KB, `panchangam.py` 62 KB)

**Target:** Each split into a package by sub-domain behind a stable public facade so imports
don't churn.

**Approach (apply per file, one PR each):**
1. Convert `foo_service.py` → `foo_service/` package; keep `__init__.py` re-exporting the current public symbols so callers don't change (no big-bang import rewrite).
2. Identify natural seams — e.g. for `daily_guidance`: score computation / narrative assembly / templating / persistence. For `life_areas`: one module per life area or per stage (compute vs. render).
3. Move pure functions out first (easiest to test in isolation); leave the orchestrator thin.
4. Add focused unit tests **as you split** — decomposition is the moment to add the missing backend test coverage for these modules.
5. Bump `DAILY_SCORE_ENGINE_VERSION` if any scoring logic moves and output could shift (per project memory) — but pure refactors should be output-identical; add a golden-output test to prove it before/after.

**Effort:** 2–3d per file. **Risk:** medium (behavioural drift) — mitigate with golden-output snapshot tests captured before refactor. Do these **incrementally**, lowest-traffic file first, never all at once (merge-conflict magnet works both ways).

---

### 3.3 Decouple cron from the web process — `app/main.py:73-149`
**Problem:** `daily_peyarchi_refresh`, `run_daily_push_cron`, `run_panchangam_prewarm_cron`
run inside the API app's lifespan via APScheduler + advisory-lock leader election.

**Target:** A dedicated worker entrypoint that runs the scheduler; API process stops
scheduling. Jobs already centralised in `job_registry.py` — leverage that.

**Steps:**
1. Create `app/worker.py` — an entrypoint that builds the same APScheduler and runs the three jobs (reuse `register_job`/`get_all_jobs`). No FastAPI app.
2. Move the scheduler block out of `_build_lifespan`; keep a settings flag `run_scheduler_in_web = bool` (default `true` now for single-box, `false` in scaled prod) so behaviour is unchanged until ops opts in.
3. Keep the advisory-lock leader election (it already prevents double-runs) — still useful if the worker itself is replicated.
4. Add a `worker` service to docker-compose / Dockerfile target so it deploys as its own container.
5. Admin trigger endpoints keep working via `job_registry` regardless of where the scheduler runs.

**Effort:** 1.5d. **Risk:** low-medium (deployment topology). **Prereq for true queue:** none yet — this is the cheap intermediate step. A real broker (Celery/RQ + Redis) is a later ticket once jobs need retries/fan-out; don't build it now.

---

### 3.4 Formalize a caching abstraction (Redis) — supersedes ad-hoc `panchangam_prewarm`
> **Done with one deliberate deviation:** the `Cache` abstraction (`app/core/cache.py`,
> memory + Redis backends, `get_or_compute`) shipped, but `panchangam_prewarm` was
> **left on its existing DB-backed `panchangam_cache` table**. That cache is already
> shared across workers via Postgres (strictly better than per-process Redis for this
> read-path), so rewiring it onto Redis would be a behavioural change with no win on a
> single box. Migrate it through the abstraction only if/when the panchangam read-path
> itself needs a Redis tier. The premise that prewarm was an "ad-hoc cache with no
> shared abstraction" was not accurate — it writes through a proper DB cache.

**Problem:** `panchangam_prewarm.py` implies an ad-hoc cache with no shared abstraction.

**Target:** One `app/core/cache.py` interface (`get/set/get_or_compute` with TTL),
Redis-backed in prod, in-memory dict in dev/test.

**Steps:**
1. Define a small `Cache` protocol + `RedisCache` and `InMemoryCache` implementations.
2. Refactor `panchangam_prewarm` to write through this cache instead of its own store.
3. Wire the same Redis client used by 3.1 (single connection pool in settings).
4. Make the prewarm cron populate the cache; request path reads `get_or_compute`.

**Effort:** 1.5d. **Risk:** low. **Sequence:** do this with/just before 3.1 (shared Redis client). Both are "when traffic justifies it" — not urgent for one box.

---

## Phase 4 — Frontend bundle & architecture

### 4.1 Move SEO content pages to Server Components — biggest win
> **Status (2026-06-20): DEFERRED (planned, not started).** This is a multi-day, multi-file refactor (natchathiram pages, guide pages, marketing pages). Requires migrating ~50 `"use client"` page files to server components while extracting the interactive island into a small child — one wrong hydration boundary breaks the page silently. Gating conditions before starting: (a) component tests must cover the affected pages' data→render mapping so a hydration regression shows up as a test failure; (b) Playwright e2e must gate on the natchathiram representative page. Do file-by-file, one PR each, starting with a single natchathiram page as a proof of concept.

### 4.1 Move SEO content pages to Server Components — biggest win
**Problem:** 138/249 `.tsx` are `"use client"`. `natchathiram/*/visual/page.tsx` (50–57 KB
each) are client components importing `natchathiram-data.ts` (570 KB); `marketing-i18n.ts`
(497 KB) and `guide-detail-content.ts` (308 KB) are huge. These ship to the browser on the
exact pages meant to rank → poor TTI/CWV.

**Target:** Static content rendered on the server; only genuinely interactive leaves stay
client; large data files never enter the client bundle.

**Steps:**
1. Audit which `natchathiram/.../page.tsx` actually need interactivity. Make the `page.tsx` a Server Component; push the one interactive widget (chart visual, tab toggles) into a small `"use client"` child that receives already-narrowed props.
2. Import `natchathiram-data.ts` / `guide-detail-content.ts` **only in server files**; pass the single relevant record down as props (server reads 570 KB, ships ~2 KB).
3. For i18n (`marketing-i18n.ts` 497 KB, `i18n.ts` 112 KB): load locale/section slices server-side; ship only the active locale's needed strings. Consider splitting the mega-file by route/section so tree-shaking works.
4. Add a bundle-size budget: `@next/bundle-analyzer` in CI, fail if any route's first-load JS exceeds a threshold (e.g. 200 KB).
5. Verify with Lighthouse/PSI on a representative natchathiram page before/after.

**Effort:** 4–6d (high-value, touches many pages — do natchathiram first, then guide, then marketing). **Risk:** medium — hydration mismatches; migrate page-by-page, not en masse.

---

### 4.2 Split mega-components for code-splitting — `dashboard-yoga-dosham-panel.tsx` (117 KB) + 5 tabs >45 KB
> **Status (2026-06-20): DEFERRED (planned, not started).** Splitting 5 components each 45–117 KB. Safe to do only after component tests cover each panel's key render paths (added in 5.1 as they split), so a tab regression fails a test rather than silently breaking. Do one component per PR with `next/dynamic` for the tab content. Sequence: yoga-dosham panel first (largest), then calendar-tab, chart-explanation, workspace, personal-tab.

### 4.2 Split mega-components for code-splitting — `dashboard-yoga-dosham-panel.tsx` (117 KB) + 5 tabs >45 KB
**Verified:** yoga-dosham 117 KB, calendar-tab 93 KB, chart-explanation 84 KB,
workspace 80 KB, personal-tab 71 KB.

**Target:** Each tab split into sub-components; lazy-load below-the-fold/secondary tabs
via `next/dynamic`.

**Steps:**
1. Extract logical sections of each panel into co-located sub-components (`dashboard-yoga-dosham/` folder). Reviewability + reuse win immediately.
2. `next/dynamic(() => import(...), { ssr: false/true })` for tabs not visible on first paint, so switching tabs lazy-loads their JS.
3. Hoist shared formatting/data helpers into `web/lib` so they're not duplicated per tab.
4. Pair with 4.1: data the tab needs should arrive as server props where possible.

**Effort:** 1–1.5d per component (~5–6d total). **Risk:** low-medium. Do after/with 4.1 since they overlap on dashboard files.

---

### 4.3 Widget security check — `next.config.mjs:17` (`frame-ancestors *`)
> **Status (2026-06-20): DONE.** `web/app/widget/panchangam/page.tsx` calls only
> `/api/v1/public/panchangam` via bare `fetch()` — no `apiFetchJson`, no `useSession`,
> no `vinaadi_token` reference. Cookie is `SameSite=Lax+Secure` so it isn't sent in a
> cross-site iframe regardless. `web/lib/widget-security.test.ts` (vitest) enforces this
> statically: it scans every widget source file and fails if any authed pattern is added.

**Problem:** `/widget/*` intentionally allows any embedder; need to confirm no
authenticated surface is reachable from there.

**Steps:**
1. Enumerate routes/components served under `/widget` — confirm they're read-only, anonymous, no cookie-auth calls, no account mutations.
2. Add a test/assertion that `/widget` pages don't import the authed API client.
3. Confirm the cookie is `SameSite=Lax`+`Secure` so it isn't sent in the widget's cross-site iframe context anyway (defense in depth).

**Effort:** 0.5d. **Risk:** low but security-relevant — do it in Phase 0/1 timeframe, it's cheap.

---

### 4.4 Untangle `globals.css` + converge the design system — `web/app/globals.css`
> **Status (2026-06-20): DEFERRED.** Gated on Playwright visual-regression snapshots (5.4) — without snapshot tests, restyling a surface can silently break it. Start after 5.4 is in place. Do surfaces one-by-one; never a big-bang rewrite.

### 4.4 Untangle `globals.css` + converge the design system — `web/app/globals.css`
**Problem:** `globals.css` is very large and mixes four concerns: legacy dark-dashboard
styling, clarity public-site styling, dashboard utilities, and page-specific visuals. The
design system is split between older glass/card patterns and the newer clarity-shell
patterns, so the public site feels more polished than dashboard/admin. This slows every
future UI-consistency change.

**Target:** Scoped, layered CSS where shared tokens/primitives live in one place and
page-specific rules are co-located with their components; one design language, not two.

**Steps:**
1. Inventory `globals.css` into the four buckets above; move page-specific rules into CSS Modules / co-located styles next to the components that use them.
2. Keep only true globals (resets, tokens, Tamil-typography base, layout primitives) in `globals.css`; introduce CSS layers (`@layer base, components, utilities`) to make precedence explicit.
3. Pick clarity-shell as the canonical system; migrate dashboard/admin glass/card surfaces onto it incrementally (one surface per PR), deleting the legacy variant as each is moved.
4. No big-bang rewrite — gate on visual-regression snapshots (5.4) so restyling a surface can't silently break it.

**Effort:** 4–6d, incremental (mostly migration, not net-new CSS). **Risk:** medium (visual drift) — pair with 5.4 snapshots. Lower priority than 4.1/4.2; it's consistency, not correctness.

---

## Phase 5 — Test coverage (the biggest stated gap)

### 5.1 Frontend unit/component tests
> **Status (2026-06-20): IN PROGRESS.** Infrastructure shipped: `@testing-library/react`, `@testing-library/jest-dom`, and `jsdom` added to `package.json devDependencies`; `vitest.config.ts` configured with `environmentMatchGlobs` so `.test.tsx` files run in jsdom and `.test.ts` files run in node. `vitest.setup.ts` loads `@testing-library/jest-dom` matchers globally. New tests:
> - `web/lib/gowri.test.ts` — `gowriCategoryRank`, `gowriCategoryLabel`, `gowriPurposeLabel`, `gowriPeriodLabel`, `bestGowriSlot` (14 assertions)
> - `web/lib/birth-date.test.ts` — `isBirthDateWithinBounds` edge cases (7 assertions)
> - `web/lib/lunar.test.ts` — `lunarSpecialTithiMeta` for AMAVASAI/POURNAMI/null (6 assertions)
> - `web/components/collapsible-section.test.tsx` — toggle behaviour, aria-expanded, defaultOpen (4 assertions)
> - `web/components/mode-badge.test.tsx` — each mode renders correctly, aria-hidden icon (5 assertions)
>
> **Run `npm install` in `web/` first** to pull `@testing-library/react`, `jsdom`, and `@vitest/coverage-v8`. After that `npm test` covers both lib and component tests.
> Next: write component tests for `action-card.tsx`, `tool-card.tsx`, and the dashboard tabs as they're split in Phase 4.2.

### 5.1 Frontend unit/component tests — 5 vitest files for 249 components
**Target:** Cover the complex, untested surfaces first: dashboard tabs, share cards, tools.

**Steps:**
1. Set up React Testing Library + vitest component config (jsdom) if not already.
2. Prioritise: (a) share-card rendering (visual/data correctness), (b) each dashboard tab's data→render mapping, (c) tools input/output. Aim for behaviour, not snapshots.
3. **Write these as you do 3.2/4.1/4.2** — refactoring is when tests are cheapest to add and most needed as a safety net.
4. Target a concrete first milestone: every component >20 KB has at least one render + key-interaction test.

**Effort:** ongoing; budget ~6–8d for the first meaningful tranche. **Risk:** low.

---

### 5.2 Stand up Playwright e2e
> **Status (2026-06-20): DONE (infrastructure).** `web/playwright.config.ts` created with `webServer` auto-start for local use and `BASE_URL` override for CI / staging. `web/e2e/auth-and-chart.spec.ts` covers: home page load without JS errors, login page renders, unauthenticated `/dashboard` → `/login` redirect, unauthenticated `/admin` → `/login` redirect, panchangam widget data renders, and (skipped unless `TEST_USER_EMAIL`+`TEST_USER_PASSWORD` set) login → dashboard. `.github/workflows/ci.yml` has an `e2e` job that runs when `vars.E2E_BASE_URL` is set (staging / preview deploy); on PRs without a staging URL the job is automatically skipped.
>
> **To activate in CI:** set `E2E_BASE_URL` as a repository variable (Actions → Variables), and `E2E_TEST_USER_EMAIL` + `E2E_TEST_USER_PASSWORD` as secrets. Next: add a 2nd spec covering chart generation once a test-user seed script exists.

### 5.2 Stand up Playwright e2e — installed but unused
**Target:** One CI-gated happy path: guest → generate chart → dashboard renders; plus auth
login → /me.

**Steps:**
1. Create `web/e2e/` with a `auth-and-chart.spec.ts` covering signup/login → chart generate → dashboard tab loads.
2. Add a CI job (Linux) that boots the app (or runs against a preview) and runs Playwright.
3. Keep it to 2–3 critical journeys initially; expand later.

**Effort:** 2–3d. **Risk:** low. Depends on a runnable test environment in CI.

---

### 5.3 Enforce coverage thresholds
> **Status (2026-06-20): DONE.** `pytest-cov>=5.0` added to `[project.optional-dependencies] dev`; `pyproject.toml addopts` now includes `--cov=app --cov-report=term-missing --cov-fail-under=40` (40% floor — measure after first CI run and ratchet up). Web: `@vitest/coverage-v8` added to `package.json devDependencies`; `web/vitest.config.ts` sets `provider: "v8"` and thresholds (`lines/functions/statements: 20, branches: 15` — floor for current lib-only coverage; bump as component tests land). CI `npm test -- --coverage` activates the web thresholds.

### 5.3 Enforce coverage thresholds — CI has none (`.github/workflows/ci.yml`: only `pytest -q`)
**Steps:**
1. Backend: `pytest --cov=app --cov-report=term-missing --cov-fail-under=N`. Set `N` at current measured level, ratchet up — never let it drop.
2. Web: `vitest run --coverage` with a `lines`/`statements` threshold in `vitest.config`.
3. Add both as required CI checks.

**Effort:** 0.5d. **Risk:** low. Do early (Phase 2 timeframe) so subsequent work can't regress coverage.

---

### 5.4 A11y, load, visual-regression gates (lower priority)
**Steps:**
1. A11y: add `eslint-plugin-jsx-a11y` to the lint step; add `@axe-core/playwright` assertions to the e2e journeys (catches the public-content a11y/SEO risk).
2. Visual regression: Playwright screenshot snapshots on key SEO pages (optional).
3. Load/perf: Lighthouse-CI on the natchathiram/marketing pages, tied to the 4.1 bundle budget.

**Effort:** 2d. **Risk:** low. Schedule after e2e (5.2) exists to hang axe checks on.

---

## Suggested sequencing (dependency-aware)

0. **0.0** (fix failing career test) — hour 1. One-line fix; get a green `pytest -m no_db` baseline before touching anything else.
1. **Phase 0** (secrets, auth dedup, CSRF, **0.4** admin edge guard) — days 1–3. Small, security-critical, no deps.
2. **Phase 1** (cascade delete migration, dep audit) + **4.3** (widget check) — days 3–8.
3. **Phase 2** (mypy/ruff ratchet, clear the 6 lint warnings) + **5.3** (coverage gates) — days 6–10, runs alongside.
4. **Phase 4.1/4.2** (frontend bundle) + **5.1** (component tests written during refactor) — weeks 2–4. Highest user-facing payoff (CWV/SEO).
5. **Phase 3.2** (god-file decomposition with golden tests) — interleaved, lowest-traffic file first.
6. **Phase 4.4** (`globals.css` + design-system convergence) — interleaved with 4.x, gated on visual-regression snapshots (5.4). Consistency, not correctness — don't let it block the above.
7. **Phase 3.4 → 3.1 → 3.3** (cache → Redis limiter → cron worker) — only when moving past one box. Gate on actual scale need.
8. **Phase 5.2 / 5.4** (e2e, a11y/perf gates) — once a runnable CI env exists.
9. **0.4 (long-term)** server-side admin role/elevation — after the edge guard ships; sequence with the auth work in Phase 0/1.

## Guardrails carried from CLAUDE.md / project memory
- Migrations: reversible `downgrade()`, test on `vinaadi_test` (port 5433) first, never `vinaadi_dev` without backup. (1.1)
- pytest can't run in this sandbox (swisseph DLL WDAC-blocked) — run in user env or Docker `vinaadi_test`; CI covers Linux.
- Bump `DAILY_SCORE_ENGINE_VERSION` if scoring logic moves (3.2).
- PowerShell, `;` not `&&`; UTF-8 no BOM for Tamil-bearing files.
