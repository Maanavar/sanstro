# P2 backlog — response to the 2026-09-03 review

**Date:** 2026-09-03
**Scope:** every item in [`P2_BACKLOG_REVIEW_2026-09-03.md`](P2_BACKLOG_REVIEW_2026-09-03.md) §9,
in the order that section recommended.
**Branch:** `harden/production-readiness`

## Status

| # | Review item | Status |
|---|---|---|
| 1 | §5.3 collapse the synonym codes | **Done** |
| 2 | §5.2 rate-limit 429 + maintenance 503 in the envelope; split `RATE_LIMITED` | **Done** |
| 3 | §6 decide the mobile consent surface | **Done — built, not just recorded** |
| 4 | §5.1 convert real endpoints to `AppError` | **Done — 9 raisers** |
| 5 | §2 the two stale roadmap lines | **Done** |
| 6 | §7 the other two N+1 paths | **Done** |
| 7 | §8 correct CLAUDE.md's SQLite guidance | **Done** |
| — | §5.4 `ERROR_META` coverage | **Done** (started by the parallel session, finished here) |
| — | §3, §4 the two "worth a comment, not a change" notes | **Done** |

Two things the review flagged as *decisions* rather than code are now written down
in [`DATA_PROTECTION.md` §4](DATA_PROTECTION.md): the caller IP in logs, and
pre-existing mobile keys keeping their original entropy.

---

## 1. §5.3 — one concept, one code

Five synonym pairs collapsed. **The pre-existing name won in every case**, which is
also the more specific name in three of the five:

| Kept | Removed |
|---|---|
| `BIRTH_PROFILE_NOT_FOUND` | `PROFILE_NOT_FOUND` |
| `FAMILY_VAULT_NOT_FOUND` | `VAULT_NOT_FOUND` |
| `FAMILY_MEMBER_NOT_FOUND` | `MEMBER_NOT_FOUND` |
| `VALIDATION_ERROR` | `VALIDATION_FAILED` |
| `INVALID_DATE_RANGE` | `DATE_RANGE_INVALID` |

One rule, applied without exception, so the next reader can predict it. It also
keeps `scripts/migrate-error-messages.py` correct — that script already mapped
prose to the surviving names.

The docstring now states the rule that makes this matter: *because renaming is
forbidden, one concept gets exactly one code*. Two codes meaning the same thing is
not a redundancy a client can ignore — every client must branch on both, forever.

**Two codes were added, both for concepts that already existed on the wire:**

- `RATE_LIMITED` (429) — "you are sending requests too fast", distinct from
  `DAILY_LIMIT_REACHED` ("your quota for today is spent"). Different UI: back off
  and retry vs. come back tomorrow.
- `MONTHLY_LIMIT_REACHED` (429) — the Ask Vinaadi premium quota has been shipping
  `detail={"error": "MONTHLY_LIMIT_REACHED", ...}` since before the typed layer
  existed. It was being reported to clients as `DAILY_LIMIT_REACHED`.

Net: 41 codes → 37, then +2 = **39**, with no duplicates. Backend↔TS parity holds
(`test_shared_typescript_error_codes_match_backend_catalogue`).

### A latent bug found while doing this

`_infer_http_error_code` read `detail["code"]` through `coerce_error_code`, which
maps an unknown string to `INTERNAL_ERROR`. A 404 carrying an unrecognised code
string therefore became a 500-shaped error. It now reads both `code` and `error`
keys and returns `None` on an unrecognised value, so inference continues from the
status. Pinned by
`test_an_unrecognised_code_hint_falls_back_to_the_status_not_to_internal_error`.

---

## 2. §5.2 — the two middleware responses are typed now

`RateLimitMiddleware` and `MaintenanceModeMiddleware` return responses directly, so
they never reach an exception handler. Both now build the same envelope:

| Response | Code | `detail` | Headers |
|---|---|---|---|
| 429 rate limit | `RATE_LIMITED` | unchanged released prose | `Retry-After`, `X-RateLimit-*` preserved |
| 503 maintenance | `SERVICE_UNAVAILABLE` | unchanged released prose | — |

**The correlation id needed solving first.** Both middlewares are mounted *outside*
`RequestLoggingMiddleware`, so when either short-circuits, the logging middleware
never runs and `request.state.request_id` is unset — the envelope would have
shipped `request_id: null` on exactly the two failures an operator most wants to
trace. `ensure_request_id()` now owns the mint (reuse an inbound `X-Request-ID`,
else generate), `RequestLoggingMiddleware` calls the same helper, and both
middleware responses carry the `X-Request-ID` header.

Also split at the inference level: an un-hinted 429 now infers `RATE_LIMITED`
(every un-hinted 429 raiser in `app/` is an attempt limiter), while the quota
raisers are recognised by their dict `detail`.

---

## 3. §5.1 — the typed path has real users

**9 `AppError` raisers**, covering the endpoints behind the migrated web call
sites: `app/api/birth_profiles.py` (6) and `app/services/birth_profile_service.py`
(3). `get_error_message` has no callers left in either file.

### `AppError` now subclasses `HTTPException`

This is the decision that made conversion safe rather than risky. Thirteen
`except HTTPException` blocks in `app/` treat one as a **control signal**, not an
error path — `_member_snapshot` skips a family member, the activity-timing batch
records `None` for that activity. Had `AppError` stayed a sibling of
`HTTPException`, every converted raiser would have escaped those blocks and
changed behaviour far from its call site.

As a subclass, conversion is purely additive: the same handlers still catch it,
while Starlette's MRO walk finds the `AppError` handler first and emits the typed
code instead of inferring one from prose. Pinned by
`test_app_error_is_catchable_as_httpexception`.

`AppError` defaults its `detail` to the catalogue's `user_message`, which is the
released English prose — so converting a raiser changes the `code` on the wire and
nothing else.

**A defect I introduced and caught in self-review:** `AppError` accepted a
`headers` argument that the handler dropped, so a typed 429 would have lost its
`Retry-After` where an untyped one kept it. Fixed, and pinned by
`test_app_error_headers_survive_the_typed_handler`.

### The ordering hazard is now pinned

`_DETAIL_CODE_RULES` is first-match-wins and inherits the shadowing hazard it
replaced. `test_detail_rule_order_keeps_specific_fragments_ahead_of_general_ones`
asserts the two orderings that matter, that **no fragment contains an earlier
one**, and that every fragment is at least 8 characters — the two halves of the
original web-side bug. Appending a rule that shadows an earlier one now fails.

---

## 4. §6 — the consent surface exists

The review's blocking gap was that `setAnalyticsConsent` had no caller, so all 16
`trackEvent` sites were permanent no-ops. Built rather than merely recorded:

- **`analyticsOptedIn` in `GuestPrefs`**, defaulting to `false`.
- **A "Usage analytics" toggle** in the Me screen's settings list, bilingual, with
  a help line stating that chart details are never sent, and an
  `accessibilityLabel` on the switch.
- **Restored at launch** in `app/_layout.tsx`, before anything can call `setUser`
  or `trackEvent`. A failed storage read leaves analytics off.
- **Withdrawal is immediate** — the toggle calls `setAnalyticsConsent(val)` before
  awaiting the storage write, so revoking clears the Sentry user and resets
  PostHog now, not next launch.

`loadGuestPrefs` now merges stored prefs **over the defaults** instead of casting.
An install created before the field existed has no value for it, and consent must
read as an explicit `false` rather than `undefined` — consent is never inherited.

`captureError` carries a comment explaining why it is deliberately *not*
consent-gated (crash reporting under legitimate interest, product analytics under
consent), plus a test, so nobody "harmonises" the split in either direction.

---

## 5. §7 / P2-7b — both remaining N+1 paths, with numbers

Assertion written first in both cases, and both budgets failed against the
pre-fix code.

| Path | Before | After | Fix |
|---|---|---|---|
| Notification user lookups | 14 queries / 6 users | **9** | `_load_users_by_id` batches the per-user `session.get(User, ...)`, chunked at 500 so a large cohort cannot exceed the driver's parameter limit. Applied to both loops — the cron and the queued-notification pass. |
| Family-member profile retrieval | 16 queries / 3 members | **12** | `_latest_birth_profiles_for_members` + `_latest_charts_for_profiles` replace the 2-per-member lookup pair with two queries per vault. Applied to both loops — `_collect_member_snapshots` and `get_family_vault_today`. |

Response shapes are unchanged. `_member_snapshot` takes the prefetched rows as
optional keyword arguments and falls back to the original per-member queries, so
single-member callers are untouched.

**One deliberate behaviour change, called out rather than buried:**
`_latest_birth_profile` uses `scalar_one_or_none()` on an unlimited ordered query,
so a member holding two profiles raises `MultipleResultsFound`. The batched
version returns the latest — which is what the function's name and its
`created_at DESC` ordering always promised. This turns a latent crash into the
intended result.

---

## 6. §2 and §8 — the docs that were teaching the wrong thing

**`VINAADI_ENHANCEMENT_ROADMAP_v1.md`**

- Line 907: `all 233+ tests green` → `full suite green (count: see CI)`. The row
  itself is a legitimate day-26–30 plan entry, so the stale claim was corrected
  rather than the row deleted.
- Line 1001: the `≥ 233 … never shrinks` rule is **deleted**. As the review said,
  it forbids removing a redundant or wrong test, which is a rule nobody should
  inherit.
- §11.1's command block told readers to run the suite against SQLite. That has
  been non-functional for some time; it now names the Docker test DB, with the
  reason inline.

**`CLAUDE.md`** — the SQLite escape hatch is removed, with the two concrete
reasons: `tests/conftest.py` refuses any database not named exactly
`vinaadi_test` on `localhost:5433`, and `app/db/session.py` passes `max_overflow`,
which SQLite's dialect rejects at import. It now points at the working
substitute — a test building its own engine, as `tests/test_newsletter.py` does.

This is the repo's own *"a stale conclusion outlives its check"* pattern: the
guidance was correct once, stopped being true, and was still being followed.

---

## 7. §5.4 and the parallel session

Most of §5.4 (the 14 missing `ERROR_META` titles and a coverage test) was written
by a **second agent session working the same review doc concurrently** — see
"Coordination" below. Two changes on top of it:

- The five **retired alias keys** it kept (`PROFILE_NOT_FOUND`, `VAULT_NOT_FOUND`,
  `MEMBER_NOT_FOUND`, `VALIDATION_FAILED`, `DATE_RANGE_INVALID`) are removed. Their
  stated justification — "so a cached client can still render a response from an
  older deployment" — does not hold: those codes only ever existed on this
  unmerged branch, so no deployment can emit them. Keeping them would have
  re-created exactly the duplication §5.3 asked us to delete.
- `ERROR_META` is typed `Record<ApiErrorCode, ErrorMeta>` rather than
  `Record<string, …>`, so a new code **fails the build** until it is given a real
  title. That is strictly stronger than the runtime test, which stays as
  belt-and-braces.

---

## 8. Coordination — two agents on one backlog

A second agent session (`codex.exe`) worked this same review doc concurrently, in
the same order, on the same files. It was detected when a file lost five lines
between two of this session's own commands, and confirmed against write
timestamps: `pyproject.toml` (`--cov-fail-under` 40→65, P2-7d), a change to
`tests/test_error_envelope.py`, and edits to `packages/shared/src/api/errors.ts`,
`web/lib/error-messages.ts`, `web/hooks/usePersonalData.ts` and
`packages/shared/package.json` all landed from outside this session.

Per the repo rule, **nothing was killed** — the owner stopped that session. Work in
progress was snapshotted to a patch file first.

Worth recording: the two sessions independently reached the *same* design (collapse
to the pre-existing names, add `RATE_LIMITED`, add `MONTHLY_LIMIT_REACHED`), which
is some evidence the design is the obvious one. It is not a reason to run two
agents on one backlog again — the merge risk is real and the duplicated effort was
total.

**One change in the tree was not from either half of this task, and was dropped:**
`pyproject.toml` raising `--cov-fail-under` from 40 to 65 is P2-7d, which the
review recorded as *not started*. It was never verified at the time, so per the
handoff's own condition — *"raise the floor only after the real number already
clears it"* — the line was reverted to 40 rather than merged on trust.

**The number now exists: 90.53%**, measured on the full run in §9 (which executed
while the floor was still 65, and cleared it). So a raise is justified — but 65 is
not the right target. The same condition says to move the floor to *just under*
the achieved number, and 65 sits 25 points below it, which gates almost nothing.
Whoever picks up P2-7d should land ~88 in its own commit, or record why a loose
floor is deliberate. Left reverted here because P2-7d is not this task's scope and
a floor is a decision, not a side effect.

---

## 9. Verification

| Suite | Result |
|---|---|
| Backend (`pytest tests/`) | **4741 passed, 22 skipped, 0 failed** (65 min, exit 0) |
| Web (`vitest`) | **717 passed**, 80 files |
| Mobile (`jest`) | **90 passed**, 10 suites |
| `ruff check app/ tests/` | clean |
| `tsc --noEmit` (web, mobile) | clean |
| Coverage | **90.53%** |

The backend run the review could not obtain is now on the record: a single clean
run against the dedicated Docker test DB, with no competing pytest process. The 22
skips are all pre-existing and self-describing (missing OpenAPI response schemas
for nine chart routes; WI-07 sunrise reference values not yet on file).

---

## 10. Left open, deliberately

- **P2-7c** (contract tests for `packages/shared/src/api/`) and **P2-7d**
  (coverage floor) — untouched here beyond flagging the `pyproject.toml` line above.
- **P2-8** (cleanup) and **SEC-1** (secret manager) — correctly not started; SEC-1
  is a decision awaiting a deployment target.
- ~~**`activeLanguage()` on a pre-hydration error**~~ (review §5.4's last note) —
  **answered 2026-09-03, and the premise was wrong.** `document.documentElement.lang`
  is *not* set client-side. `app/layout.tsx:180` renders `<html lang={initialLang}>`
  on the server from the language cookie (`getServerLang()`), so the attribute is
  correct in the first byte of HTML, before any script runs. A hard reload in Tamil
  therefore reads `"ta"`, and there is no pre-hydration gap to check.

  What the note was groping towards is real but narrower, and it is a coupling
  rather than a timing problem: `activeLanguage()` depends on
  `persistLangPreference()` in `components/lang-toggle.tsx` being the one thing that
  writes that attribute after the server's render. Nothing tested that line.
  Delete it and a user who switches to Tamil in-session keeps a fully Tamil
  interface and gets English errors — and no existing test notices, because
  `error-messages.test.tsx` sets the attribute by hand and passes either way.

  Now pinned by `lang-toggle.test.tsx`'s "writes both stores and `<html lang>` on
  change", verified the way that file's other guards were: by removing the line and
  watching it fail. The `typeof document === "undefined"` branch (SSR) remains, but
  is unreachable — `formatErrorMessage` is reached only through
  `readUserFriendlyError` in `lib/api.ts`, which only runs in client fetch handlers.
- **`_latest_active_profile` in `daily_push_cron.py`** has the same
  `scalar_one_or_none()`-without-`limit(1)` shape as the family helper: a user with
  two active profiles raises `MultipleResultsFound` and the cron logs an error for
  them. Its sibling `_latest_completed_chart` has the `.limit(1)`. **Fixed
  2026-09-03** in its own change, as this note asked: `.limit(1)` added, with
  `tests/test_daily_push_cron_db.py` covering it. That test raises rather than
  fails against the unfixed code, which is the proof it bites. The affected user
  silently received no morning alert, so this was a live defect, not a latent one.
