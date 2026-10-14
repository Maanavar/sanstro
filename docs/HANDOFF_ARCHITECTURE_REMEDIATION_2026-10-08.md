# Handoff — architecture remediation A01–A16

Written for: the next coding agent picking this up. Paste the block in
[§ The prompt](#the-prompt) as its opening instruction.

Phase 1 is complete and committed. Phase 2 is next, and its owner decisions are
already made — they are recorded below so nobody re-asks them.

---

## The prompt

```text
# Continue the Vinaadi AI architecture remediation (A01–A16) — Phase 2

## Read first, in this order
1. D:\sanstro\CLAUDE.md — hard, non-negotiable workspace rules. Windows +
   PowerShell only, exact DB topology, never touch vinaadi_dev destructively,
   migration safety, API-contract coordination across 4 surfaces, UTF-8 for
   Tamil, no real personal data in fixtures. Everything below is subordinate
   to it.
2. docs/ARCHITECTURE_AUDIT_2026-10-07.md — evidence for the 16 findings.
3. docs/ARCHITECTURE_FINDINGS_AND_SOLUTIONS_2026-10-07.md — the implementation
   guide. §6 has the phase order and the definition of done. Follow its steps;
   they were written by someone who traced the real code paths.
4. docs/MASTER_FIX_LIST.md, section "Architecture remediation A01–A16" — what
   is actually done, with each item's recorded baseline and blind spots.
5. docs/HANDOFF_ARCHITECTURE_REMEDIATION_2026-10-08.md — this file. The
   "Environment facts" section will save you hours; several of those cost
   real time to discover.

## Status: Phase 1 is DONE and committed (7 commits on harden/production-readiness)

b129f6c  api image was unbuildable (found while running A01's smoke)
f8e328f  A01  backend URL misrouted to loopback inside the web container
216f7bd  A03  replay revocation rolled back with the 401
3958dc6  A02/A07/A08  mobile session, cache isolation, bounded refresh
776b557  docs  tracker + the two governing documents
654ef8d  A06  auth limiter refuses instead of failing open on Redis outage
dca2d8a  A04/A05  purchase identity gate + webhook inbox and ordering

Do not revisit these. If you believe one is wrong, say so before changing it.

## Your scope: Phase 2, in this order

1. A09 + A10 together — scheduler ownership and durable notification delivery.
   The guide says to address them together "enough to prevent duplicate
   ownership from becoming duplicate delivery".
2. A11 — transaction ownership / dashboard isolation. Needs REAL PostgreSQL
   constraint or statement failures, not `raise ValueError()` mocks. Note
   `app/db/session.py` sets autoflush=False deliberately, and
   `Session.begin_nested()` flushes unconditionally regardless — so do not
   blanket-wrap helpers in savepoints (guide A11 step 5 explains why).
3. A12 — ASSESSMENT ONLY. See the owner decision below. Produce a consumer
   inventory and options memo. Do not write a migration, do not change a
   column, do not touch data.

Stop and ask before starting Phase 3.

## Owner decisions already made — do NOT re-ask these

Phase 2:
- A09 scheduler ownership: DEDICATED WORKER ONLY. The `worker` container is the
  sole scheduler; production default becomes
  JOTHIDAM_RUN_SCHEDULER_IN_WEB=false. Add a heartbeat (last successful cycle)
  and fail the worker on lost leadership so supervision restarts it. The API
  must never schedule in production. Single-box dev may still opt in via the
  env var.
- A10 notification expiry: PER-NOTIFICATION EXPIRY, DROP SILENTLY PAST IT.
  Each intent carries an expiry (a daily guidance push expires at the end of
  its local day). Past expiry it is marked expired and never sent — yesterday's
  "your day ahead" arriving today is worse than nothing. The in-app inbox still
  shows it. At-least-once while live; no late pushes. Do NOT implement
  catch-up-whatever-the-delay.
- A12 birth-data confidentiality: INVESTIGATE CONSUMERS FIRST, DECIDE AFTER.
  Deliver an inventory of every read/write of birth_datetime_utc, saying which
  need database-side filtering/ordering versus only application access, plus
  what else leaks the same information (location, generated narratives, cached
  rows, exports). No schema change until the owner has seen it. NOTE:
  vinaadi_dev HAS real rows in birth_profiles — any eventual migration is a
  real data migration.

Already implemented in Phase 1, for context (do not change them):
- A03: the replay theft signal also advances token_version, so already-issued
  access tokens die immediately. Deliberate policy.
- A06: auth endpoints return a bounded 503 when the limiter is unevaluable.
  Not 401, not 429. The global per-IP middleware still fails open on purpose.
- A07: persist only the user's own chart summary, current dasha and a
  short-lived today snapshot. Family-vault data is NOT persisted in V1.
- A04: block purchase and restore until the SDK is bound to the signed-in
  UUID. No automatic transfer of existing purchases.
- A01-b: compile Python wheels in a throwaway Docker stage; do not ship a
  compiler and do not move the image to python:3.14 / swisseph-ffi.

## How to work (this is how Phase 1 was done; match it)

For each finding, per the guide's §6 definition of done:

1. RE-VERIFY the cited file/line evidence against CURRENT source before
   touching anything. All 16 findings were accurate at 2026-10-07, but code
   moves. If what you find differs from the doc, STOP and report the
   discrepancy instead of silently adjusting scope.
2. WRITE THE REGRESSION TEST FIRST and record it FAILING against the unfixed
   code. A "module not found" failure is NOT a baseline — make it fail
   behaviourally. Phase 1's baselines, for the standard to match:
     A01  5 of 15 failed, naming API_BASE_URL and all 7 direct readers
     A03  4 of 5 failed through the real HTTP endpoint on real PostgreSQL
     A02  B was served {"familyVaultId":"A-vault"} with 0 requests issued
     A07  the pre-fix persister wrote ["profile","family-vaults"]
     A08  the pre-fix client ended in JavaScript heap out of memory
     A06  15 of 16 failed
     A05  renewal -> active, then an hour-older expiration -> inactive
   Throwaway baseline tests are fine; delete them once the number is recorded
   in the commit message.
3. Implement per the finding's own "Implementation steps".
4. Confirm the test passes.
5. RUN EVERY NEW GATE ONCE WITH THE FIX REMOVED and confirm it fails. Record
   what it still cannot see, in the commit message. A tick whose scope is not
   written down is inherited as "this item is clean".
6. Run the relevant EXISTING suites. A fix that passes its own test and breaks
   an existing one is not done. (In Phase 1, A05 broke 8 existing webhook
   tests; the right answer was to change the fix, not the tests.)
7. Update docs/MASTER_FIX_LIST.md honestly. Do not mark anything done that is
   not actually tested.
8. One finding (or one explicitly-grouped package) per commit. No bundling, no
   "while I'm in here" edits outside the finding's scope.
9. Do not introduce speculative abstractions — no generic repositories, event
   buses or service splits beyond what the finding's own solution calls for.
   §5 of the guide warns about this explicitly.

## Environment facts (each of these cost time to find)

- Tests: set JOTHIDAM_DATABASE_URL to
  postgresql://slw_admin:slw_dev_password@localhost:5433/vinaadi_test and
  JOTHIDAM_TEST_DB_RESET_ACK=I_UNDERSTAND_THIS_WIPES_TEST_DB. Also
  PYTHONUTF8=1, PYTHONIOENCODING=utf-8, PYTHONDONTWRITEBYTECODE=1.
  Use --no-cov for targeted runs: the suite is coverage-gated at 88% and a
  subset always "fails" on coverage otherwise.
- pytest-timeout is NOT installed. `--timeout=N` is an unrecognised argument
  and makes the whole run exit 4 without running anything.
- A dev stack may be running on ports 3000 (next dev) and 8000 (uvicorn),
  owned by another session. Do not kill it; trace the parent chain first
  (CLAUDE.md). The compose smoke script already remaps to 13000/18000.
- Before believing a local pytest failure, check for a competing run — a second
  pytest calls conftest's DROP SCHEMA public CASCADE and destroys the first
  one's schema mid-test.
- The test DB's schema is normally built by conftest's create_all, NOT alembic,
  so `alembic upgrade head` fails with "relation users already exists". To test
  a migration round-trip: DROP SCHEMA public CASCADE; CREATE SCHEMA public on
  vinaadi_test (sanctioned — it is the wipe-freely DB), then upgrade ->
  downgrade -> upgrade.
- THE WEB DOCKER IMAGE CANNOT BE BUILT ON THIS MACHINE. pnpm install exhausts
  web/Dockerfile's own 3 x 480s retry budget. That is a known documented
  condition, not a new bug. The api image builds fine (~5 min) after b129f6c.
- scripts/compose-proxy-smoke.ps1 runs the A01 end-to-end check. With
  -SkipBuild it reuses tagged images; with -BreakBackendUrl it is the negative
  control. Compose MERGES `ports` across -f overlays, so the script uses the
  `!override` YAML tag — a plain list appends and collides with the base.
- docker-compose.app.yml's opt-in `edge` service declares ${VINAADI_DOMAIN:?},
  and compose interpolates every service at load time regardless of profile,
  so even `docker compose down` fails without that variable set.
- NEVER round-trip source through PowerShell. `Set-Content -Encoding UTF8`
  writes a BOM in PS 5.1 and `>` redirection does too (it broke a JSON.parse
  during Phase 1). For mechanical multi-file edits, write a small Node script
  that uses writeFileSync(..., {encoding:"utf-8"}) — Node never adds a BOM.
- PS 5.1 wraps any native command's stderr in a NativeCommandError that looks
  like a failure. Check $LASTEXITCODE, and prefer
  `cmd /c "pnpm --filter <pkg> run <script> 2>&1"`.
- jest `expect` takes NO message argument (that is vitest, which web/ uses).
  Collect failures into an array and assert on that instead.
- A jest.mock factory is hoisted above the module body, so a factory returning
  `{ router: someConst }` captures undefined. Build the mock inside the factory
  and read it back, or dereference lazily inside a function.
- mobile/__tests__/birth-details.screen.test.tsx ("bundled place search B-006")
  flakes under full-suite load at ~15s and passes 5/5 alone. This is the test
  the audit already recorded timing out. It is NOT fixed and is not yours.

## Phase 1 verification still outstanding

Be aware, and do not claim otherwise:
- The FULL backend suite has not been confirmed green end to end in one run.
  Targeted suites were: auth + admin 106 passed; webhooks + subscriptions +
  tier 43 passed; contract guards 288 passed / 9 skipped (the audit's own
  figures); migration round-trip verified. Run `pytest tests/` once and fix or
  report anything it surfaces before starting Phase 2 work.
- A01's compose smoke was executed against a web image built four weeks ago
  that predates web/lib/backend-url.ts. It proves the compose configuration
  half end to end; the new resolver is covered only by the unit gate. CI builds
  both images and runs the same script.
- A06 step 6 is NOT done: readiness still does not control traffic, because
  the supplied nginx config proxies everything to web. Unimplemented
  infrastructure work.
- No RevenueCat sandbox transaction, receipt or dashboard setting was ever
  exercised or inspected (A04/A05).
```

---

## Why this file exists

Phase 1 surfaced two things worth more than the code changes:

**A defect nobody was looking for.** The api Docker image could not be built at
all, from any machine, because `pyswisseph` publishes no cp312 wheel and
`python:3.12-slim` ships no compiler. It survived because no CI job builds that
file, and because the backend test job installs the same `requirements.txt`
successfully on a runner that *does* have gcc. It was found only by trying to
run A01's acceptance check rather than reasoning about it.

**A gate that would not have failed.** An early version of the compose smoke
fired its probes while the api container was still running Alembic. It reported
502 on a correctly configured stack — and, worse, its negative control would
then have "passed" because the backend had not finished booting rather than
because the URL was wrong. Both halves of that gate were green for the wrong
reason until it waited on the healthcheck.

Those are the two habits to carry into Phase 2: run the acceptance check rather
than arguing from the source, and prove each gate can fail before trusting that
it passed.
