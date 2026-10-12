# Codex brief — Phase 4, the owner-independent subset (2026-10-12)

You are working in the `Vinaadi AI` repository on Windows. Read this whole file
before running anything. Section 1 will save you hours; it is not boilerplate.

Branch: `harden/production-readiness` (PR #5, green at `7c3510e`). Work on that
branch. Do not open a new one unless asked.

---

## 1. Environment facts you cannot discover by trying

### 1.1 The host Python venv cannot run this application. Do not try to fix it.

`.\.venv\Scripts\python.exe -m uvicorn app.main:app` fails with:

```
ModuleNotFoundError: No module named 'swisseph'        <- EXPECTED, not the failure
...
OSError: [WinError 4551] An Application Control policy has blocked this file
```

Windows **Smart App Control** blocks the unsigned
`.venv\Lib\site-packages\swisseph_ffi\libs\windows-x64\swe.dll`. The
`ModuleNotFoundError` above it is the *designed* path — `requirements.txt`
carries markers (`pyswisseph` below Python 3.14, `swisseph-ffi` at 3.14+) and
this host runs 3.14. Read past it to the real error.

`tests/conftest.py` line 30 does `from app.main import app`, so this blocks
**all 278 test files**, not just ephemeris ones. It is not transient: it
recurred against a byte-identical DLL, and the same class of block on mypy's
DLL survived 12 retries. **Do not** reinstall, rebuild the venv, bisect
dependencies, retry in a loop, or disable Smart App Control.

Use the containers instead:

```powershell
Set-Location 'D:\sanstro'

.\dev-docker.ps1                 # dev API on http://127.0.0.1:8000, hot reload
.\dev-docker.ps1 -NoReload       # same, no watcher (~0.3% CPU vs ~6.5%)
.\dev-docker.ps1 -Stop

.\test-docker.ps1                                   # full suite, pyswisseph/3.12
.\test-docker.ps1 -Paths @('tests/test_foo.py')     # focused (adds --no-cov)
.\test-docker.ps1 -Binding ffi -Paths @('tests/test_ephemeris.py')
.\test-docker.ps1 -Build                            # rebuild after a deps change
```

Read the header comments in those two scripts before changing them. Each
non-obvious line records a specific failure it exists to prevent.

### 1.2 Things that will mislead you if you do not know them

- **Alembic works on the host.** It imports no ephemeris code. Run migrations
  with `.\.venv\Scripts\python.exe -m alembic ...`, not in a container.
- **A local full suite takes ~80 min** (CI does it in 13–14). `test-docker.ps1`
  has a 7200 s ceiling using `timeout -s ABRT` plus `PYTHONFAULTHANDLER=1`, so
  a hang prints every thread's stack. If it fires, read that stack before
  theorising.
- **One test is deselected locally by default:**
  `tests/test_admin_elevation.py::test_a_recompute_job_still_needs_no_elevation`
  stalls in this container only. CI runs it and is green. `-IncludeStalled`
  re-includes it. Do not "fix" it by changing product code — the cause is not
  localised, and the astrology under it is fast (all 9 prewarm locations × 45
  days = 15.7 s total).
- **Local runs are not authoritative; CI is.** Two concurrent pytest runs each
  call conftest's `DROP SCHEMA public CASCADE` and destroy each other. One local
  run produced 150 phantom `UndefinedTable` errors while CI was green on the
  same commit. `test-docker.ps1` refuses to start if another run holds
  connections to `vinaadi_test`.

### 1.3 Shell and file rules

- PowerShell, not Bash. Chain with `;` — PS 5.1 has **no** `&&`.
- No `head`; use `Select-Object -First N`. No `2>&1` on native executables — it
  wraps stdout in `NativeCommandError` and loses the real message.
- Never pass source code as a native-exe argument or inside an expandable
  here-string: PS 5.1 mangles embedded quotes, and a mangled script can exit in
  a way that reads as success. Put scripts in files. Prior art:
  `docker/check-dep-drift.py`, `docker/check-db-reachable.py`.
- PowerShell prepends a UTF-8 BOM when piping to a native exe, which silently
  corrupts the first line. Strip it on the receiving side.
- Files containing Tamil text are UTF-8 **without BOM**. Do not use `Out-File`
  (defaults to UTF-16). Never round-trip source through PowerShell.
- Keep line endings consistent per file; check before anchoring an edit.

### 1.4 Database safety — absolute

- **Dev DB** `vinaadi_dev`, container `slw-postgres`, port **5432** — real data.
- **Test DB** `vinaadi_test`, container `slw-postgres-test`, port **5433** —
  wipe freely.
- Never run `DROP TABLE`, `DROP SCHEMA` or `drop_all()` against `vinaadi_dev`.
- Never point `JOTHIDAM_DATABASE_URL` at `vinaadi_dev` for tests. `conftest.py`
  refuses any DB not named exactly `vinaadi_test` on `localhost:5433`. Satisfy
  that guard; never weaken or bypass it.
- There is **no SQLite option** and no offline fallback. Do not add one.
- Back up before risky work:
  `docker exec slw-postgres pg_dump -U slw_admin vinaadi_dev > backup_<ts>.sql`

---

## 2. How this project judges work

Standing rules. Violating them is how previous items were recorded "done" while
still broken.

1. **A gate proves its own check, not the item.** Before claiming a test passes,
   run it **with your fix removed** and confirm it fails. Then write down what
   the check *cannot* see, beside the pass. Three items here were recorded green
   by gates that could not fail.
2. **Suspect your own inputs before the environment.** A flag or setting you
   wrote and have not verified is the first suspect, not a footnote.
3. **Measure before explaining.** Do not record a cause you have not
   demonstrated with a number. Four confident explanations for one recent stall
   were each killed by measurement.
4. **Bound every unbounded wait.** Anything that can hang gets a timeout and a
   readable log.
5. **A stale conclusion outlives its check.** Re-verify any "blocked by" note
   before acting on it.
6. **Never hardcode real personal data** in tests, fixtures, seeds, docs or
   example payloads. Use clearly-synthetic identities.
7. **API contracts span four surfaces** — `app/api/`,
   `packages/shared/src/api/`, `mobile/src/api/`, `web/`. Nothing checks across
   that boundary at compile time. Changing a route path, query param or response
   shape means grepping and updating all four in the same change. Any **new**
   endpoint gets a typed wrapper in `packages/shared/src/api/`, and new
   consumers must use it rather than a fresh direct fetch.
8. **Display boundary — never render a name the server chose.** The backend
   sends astrology terms twice: a language-free key and a pre-rendered English
   name. Render the **key** through the localiser; never the name field.

   | Read this | Not this | Through |
   |---|---|---|
   | `rasi` (number) | `rasiName`, `rasiCode`, `lagnaRasiName` | `rasiDisplayName(rasi, lang)` |
   | `graha`, `lord` | the bare string | `tPlanetLord(key, lang)` |
   | `nakshatraName`, tithi, yoga, karana | the bare string | `tNakshatra` / `tTithi` / `tYoga` / `tKarana` |

   A name field is English-only, so rendering it prints `Mithunam` at a Tamil
   reader. `title=` and `aria-label=` **count as rendering**, and no visible-text
   probe can see them — `innerText` does not include attributes.
9. Every migration is reversible — fill in `downgrade()`.

---

## 3. The work

Four independent packages. Do them in this order. Commit each separately, with a
message explaining the *why*, ending with:

```
Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
```

### Package A — Tamil, attribute and accessibility audit

**Source:** `docs/ARCHITECTURE_FINDINGS_AND_SOLUTIONS_2026-10-07.md` §4.6.
Source inspection has never established a rendered accessibility pass, and the
existing audit cannot see attributes at all.

**Start by confirming or killing this specific lead.** In
`web/app/(marketing)/tools/jadhagam-generator/JadhagamTool.tsx:662`:

```ts
const fmtStar = (v: string) => (en ? tamilizeAstroEnglish(v) : v);
```

`tamilizeAstroEnglish` (`web/lib/tamil-astro.ts:126`) maps English nakshatra
names to **romanised Tamil**. So the English branch is localised and the Tamil
branch returns the raw backend `nakshatraName`. It is used at lines 875, 876,
951 and 973, inside a block that is bilingual (`en ? "Lagna" : "லக்னம்"`). That
reads as an inverted ternary.

Its own two neighbours make the shape suspicious:

```ts
const RASI_NAMES    = en ? RASI_NAMES_EN    : RASI_NAMES_TA;     // line 660
const PLANET_LABELS = en ? PLANET_LABELS_EN : PLANET_LABELS_TA;  // line 661
const fmtStar = (v: string) => (en ? tamilizeAstroEnglish(v) : v);
```

Both neighbours select a language-appropriate value on each branch. Only
`fmtStar` leaves the non-English branch as a passthrough.

This is **a lead, not a confirmed defect.** Nobody has checked what casing the
API returns for `nakshatraName`, or rendered that block in Tamil to see the
output. Confirm it by rendering, or kill it — and state which. Note that
`web/lib/nakshatra-display-boundary.test.ts:36` lists `tamilizeAstroEnglish`
among accepted localisers, so the existing ratchet treats this as clean: a gate
that cannot see a localiser used in the wrong branch.

Then the audit proper:

1. Sweep `web/` for rendered `*Name` / `*Code` fields and bare `lord` / `graha`,
   **including inside `title=` and `aria-label=`**. Correct usage is the table in
   §2.8: `tNakshatra(x.nakshatraName, lang)` is *correct*; a bare
   `{x.nakshatraName}` is not. Do not file the correct ones as findings.
2. Extend the ratchets. `web/lib/rasi-display-boundary.test.ts` covers the rasi
   case. Nothing covers attributes, and nothing covers a localiser called in the
   wrong branch. Add tests that fail on today's code wherever a real defect
   exists.
3. Run a real browser accessibility pass on key flows in **both** languages,
   including overlays, error states and loading states.
   `web/scripts/ux-audit-core.mjs` has `overlays` (five named overlays) and `ta`
   (top-level tabs, desktop and phone) phases; sub-tools, reports,
   overlays-in-Tamil and every attribute are outside it by construction. Record
   what you added and what remains uncovered.

**Known gate blind spots, so you do not inherit them as "clean":** axe checks
text contrast but not non-text contrast; it measures mid-animation pixels unless
fades are settled first; every harness phase except `ta` runs the audit account
in English, so an English pass proves nothing about Tamil; and the `ta` phase
reads visible text only, so it cannot see `title=` or `aria-label=` either.

**Owner rulings that override any tool or skill suggestion:** no accent
left-border on cards; active language only, with no bilingual echo; Tamil
almanac naming over Sanskrit; Tamil clock period-words, never "pm". Colour and
type come from Nova (`web/app/dashboard/dashboard-nova.css`, 239 custom
properties) — this repo uses hand-written CSS, with no Tailwind, shadcn or Radix.
Do not add them.

### Package B — Bound the in-memory cache

**Source:** §4.2. `app/core/cache.py` (144 lines). `InMemoryCache._store`
(line 52) is a plain `dict[str, tuple[float, Any]]`. Expired entries are dropped
**only when that key is read again**, and there is no global size limit — so a
workload producing many unique keys retains expired entries forever.

Deliver a documented size policy and cleanup mechanism, with the eviction
behaviour chosen explicitly: what is evicted, in what order, and why. Give each
cache a documented purpose, key, owner, TTL, capacity, invalidation dependency
and fallback behaviour.

Constraints:

- `RedisCache` in the same file uses native TTL and is shared across workers. Do
  not let the two implementations diverge in observable behaviour.
- Do **not** introduce a distributed lock. Bounded request coalescing for
  expensive concurrent misses is acceptable, but only with its failure and
  timeout behaviour analysed in the commit message.
- A version constant can invalidate a formula change; it does **not** represent
  every user-input dependency. Test profile, location and focus edits against
  their dependent caches.

Gate: a test that drives the cache past its bound and asserts memory is
reclaimed. Run it against the unbounded code first and confirm it fails.

### Package C — Named clock policy and injected clock

**Source:** §4.5. `app/services/ask_vinaadi_usage_service.py` uses bare
`date.today()` — the **server's** local date — at lines 30, 74, 99, 120 and 176,
while the product describes a *local* reset boundary. `_month_start()`
(line 29) derives the month from the same server date, so it has the same issue.
`date.today()` appears elsewhere in `app/api/` too (`charts.py`, `admin.py`,
`admin_analytics.py`); decide deliberately which of those are quota/expiry
semantics that belong on the injected clock and which are astrology inputs that
do not, rather than replacing every call site mechanically.

First decide and write down **which timezone defines a quota day and a quota
month.** Then make the code say it: a named policy plus an injected clock for
quotas, notifications, current-day caches and expiry calculations.

Constraints:

- Date-only values, UTC instants and local civil days are three different domain
  types. Do **not** convert every date-only field into a UTC timestamp — that
  can shift a calendar date.
- Keep astrology doctrine and location-specific sunrise rules **separate** from
  infrastructure clock choices. Do not touch the sunrise convention (apparent
  upper-limb with refraction, owner-ruled).
- Preserve user/date semantics across travel and saved-location changes.

Gate: tests at midnight, month boundaries, a timezone change and a DST
transition, driving the injected clock. They must fail against the current
`date.today()` behaviour wherever behaviour actually changes. If a case passes
both before and after, say so rather than counting it as coverage.

### Package D — Populated-data migration drill

**Source:** the A12 encryption migration,
`migrations/versions/uu4e5f6a7b8c_encrypt_natal_inputs_and_derivatives.py`
(14 columns; it has a real `downgrade()` that decrypts rather than restoring).

That migration has never been exercised against a database holding realistic
**volumes** of data. Do it on the **test** DB, with synthetic rows only:

1. Seed `vinaadi_test` with clearly-synthetic profiles at a realistic row count.
2. `upgrade` — verify each of the 14 columns is encrypted at rest and still
   readable through the application. Time the run.
3. `downgrade` — verify plaintext is restored and row counts are identical.
4. `upgrade` again — confirm it does not double-encrypt.
5. Record the timings against the row count, so a production maintenance window
   can be estimated from a measurement rather than a guess.

Notes: `DROP TABLE` alone does not remove Postgres composite/enum types tied to
a table's columns, and a leftover type collides on recreation the second time a
suite resets schema state in one session — use `DROP SCHEMA ... CASCADE` plus
`CREATE SCHEMA`. This only reproduces against real Postgres.
`scripts/verify_restore.py` already performs a restore verification and is worth
reading as prior art.

---

## 4. Explicitly out of scope

Do not attempt these. They are blocked on the owner, not on you:

- Deleting the three pre-A12 plaintext dumps — irreversible local destruction,
  and the owner runs those commands.
- Setting concurrency, RPO, RTO or latency **budgets**. You may measure; you may
  not choose the targets.
- Anything needing a deployed URL, domain, DNS or provider keys.
- Capacity benchmarking against production.
- Turning off Smart App Control (it is permanent and cannot be re-enabled
  without reinstalling Windows).
- Reformatting, dependency bumps, or drive-by cleanup of `web/`'s existing
  direct-fetch call sites — those are grandfathered.

---

## 5. Definition of done, per package

1. The failure scenario and who it affects are written down.
2. The design and any policy decision are explicit — especially the timezone in
   Package C and the eviction order in Package B.
3. All affected surfaces are updated together if a contract changed (§2.7).
4. The new test **fails against the unfixed behaviour** — demonstrated by
   running it, not asserted.
5. It passes after the fix, **with its blind spots recorded beside it**.
6. Existing tests, ruff, mypy, migrations and CI gates pass. Use
   `.\test-docker.ps1` for the suite. Smart App Control blocks mypy on the host
   too, so run ruff and mypy in a `python:3.12-slim` container with only
   `ruff==0.15.17` and `mypy==2.3.1` installed, matching CI.
7. Deployment/data compatibility and rollback behaviour are reviewed.
8. A runbook note is added where the failure is operational.
9. `docs/MASTER_FIX_LIST.md` reflects the actual implemented status.

## 6. How to report back

Per package: what you changed and why; the gate you added, with the output of
running it **with the fix removed**; what that gate cannot see; and what you did
not do, with the reason.

If you could not finish a package, say exactly where you stopped and what you
ruled out, with the evidence. A disproven theory recorded with its evidence
saves the next reader from re-deriving it; a bare "didn't work" does not.

If anything here contradicts the code, trust the code and say so. This brief was
written from the repository on 2026-10-12 and can go stale.
