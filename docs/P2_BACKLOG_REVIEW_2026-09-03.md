# P2 backlog — implementation review

**Date:** 2026-09-03
**Reviewer scope:** the six commits `2683dc4 … 406b2b2` on `harden/production-readiness`,
against the conditions in [`P2_BACKLOG_HANDOFF.md`](P2_BACKLOG_HANDOFF.md).

## Verdict at a glance

| Item | Status | Quality | Blocking gap |
|---|---|---|---|
| **P2-4** docs | Done | Good | 2 stale claims left in a live doc (§2) |
| **P2-5** newsletter ORM | Done | **Strong** | none |
| **P2-7a** structured logs | Done | **Strong** | none |
| **P2-3** typed errors | **Architecture done, adoption 0%** | Mixed | 3 issues, one permanent if shipped (§5) |
| **P2-6** mobile storage | Done | **Strong** | consent flag has no caller — analytics is dead (§6) |
| **P2-7b** N+1 | 1 of 3 paths | Strong | 2 paths untouched |
| **P2-7c/d**, **P2-8**, **SEC-1** | Not started | — | as designed |

Test runs I completed: **web 6/6 pass**, **mobile 20/20 pass**. Backend could not be
run cleanly — see §8.

---

## 1. What is genuinely good

Three of these are better than the spec asked for, and the reasoning in the code
comments is the reason they will survive contact with the next reader:

- **P2-7a actually fixes the bug**, rather than papering it. `JsonLogFormatter`
  serialises through `json.dumps` with `ensure_ascii=False` (respecting the repo's
  Tamil-bytes rule) and `default=str` (so a non-serialisable `extra` value cannot
  crash the logger), and redacts bearer tokens and emails from **both** the message
  and the formatted exception text ([`app/core/json_logging.py:59-74`](../app/core/json_logging.py#L59-L74)).
  Deriving `_STANDARD_LOG_RECORD_FIELDS` from a live `makeLogRecord({})` rather than
  a hardcoded list is the right call — it will not rot across Python versions.
- **P2-6's v2→v3 migration follows the spec exactly**, including the part most
  implementations get wrong: a failed re-encrypt write is caught and the successfully
  decrypted plaintext is still returned ([`encryptedStorage.ts:124-129`](../mobile/src/lib/encryptedStorage.ts#L124-L129)),
  so a transient write error cannot make a user's data vanish. The `guestStore`
  migration writes the encrypted copy **before** removing the plaintext
  ([`guestStore.ts:40-56`](../mobile/src/features/guest/guestStore.ts#L40-L56)) — an
  interrupted migration loses nothing.
- **P2-7b put the assertion first**, as required, and the test says so in a comment
  that names what it would catch ([`tests/test_query_budgets.py`](../tests/test_query_budgets.py)).
  The budget is a number (`<= 4`), not a vague "fewer queries".

`app/core/error_codes.py` kept `get_error_message` as a legacy adapter, so the two
pre-existing consumers (`app/api/birth_profiles.py`, `app/services/birth_profile_service.py`)
were not broken by the rewrite. That was careful.

---

## 2. P2-4 — done, but two stale claims survive

`docs/AGENT_INSTRUCTIONS.md` is fixed correctly: the count is replaced with
"see CI", the instruction is reworded to "it must be green", and the `Last updated`
stamp was bumped. That is exactly right.

**Missed — and it is my spec's fault, not the implementation's.** Two live
(non-archived) stale claims remain:

| File | Line | Text |
|---|---|---|
| `docs/VINAADI_ENHANCEMENT_ROADMAP_v1.md` | 907 | `Integration test pass + all 233+ tests green` |
| `docs/VINAADI_ENHANCEMENT_ROADMAP_v1.md` | 1001 | `All green. Count must be ≥ 233 (grows as new tests are added — never shrinks).` |

My handoff doc listed only three files because I grepped `233 passing|233 tests|233 test`,
which matches neither `233+ tests` nor `≥ 233`. The implementation fixed the files it
was given.

Line 1001 is worse than a stale number: **"never shrinks" forbids deleting a
redundant or wrong test**, which is a rule nobody should inherit. Delete both lines.

---

## 3. P2-5 — strong, no gaps

Every condition met, including the one that was the point of the item.

- Model mirrors the migration; registered in `app/models/__init__.py` (import **and**
  `__all__`). Verified by import, not by eye:
  `'newsletter_subscribers' in Base.metadata.tables` → `True`.
- **The portability criterion was met the right way.** `test_newsletter_subscriber_table_is_portable_to_sqlite`
  builds its own `create_engine("sqlite://")` and calls `create_all` on the table
  ([`tests/test_newsletter.py:27-34`](../tests/test_newsletter.py#L27-L34)). This is
  better than what I specified — routing the whole suite through SQLite is impossible
  here (§8), and an in-test engine proves the same property without fighting conftest.
- Idempotency preserved via `IntegrityError` → rollback → success, with a comment
  explaining that an existing address must stay indistinguishable from a fresh one
  ([`app/api/newsletter.py`](../app/api/newsletter.py)). Correctly ordered before the
  broad `except Exception`.
- All seven required test cases present, including the forced-failure case asserting
  rollback, no exception text in the body, and the log event.
- Test data is synthetic (`query-budget-N@example.test`, "Synthetic Test City").

**One thing worth a comment, not a change:** the model uses client-side
`default=uuid4` where the migration uses `server_default=gen_random_uuid()`. That
divergence is deliberate and correct — `gen_random_uuid()` does not exist on SQLite,
so a server default would defeat the portability test. Add one line to the model
docstring saying so, or the next reader will "fix" it back.

---

## 4. P2-7a — strong

Confirmed the original defect is gone: every non-standard `record.__dict__` key is
now emitted, so `request_id`, `path`, `status`, `duration_ms` and `client` reach the
output, and the hand-assembled-JSON quoting bug is gone.

**Minor, non-blocking:** `_SENSITIVE_KEY_PARTS` does not include `client`, so the
caller IP is logged in full. That is defensible (it is operationally necessary and
IP-keyed rate limiting depends on it) but it is the one piece of personal data still
going to logs after P1-3 removed coordinates. Worth a deliberate line in
`DATA_PROTECTION.md` rather than a silent default.

---

## 5. P2-3 — the architecture is right; almost nothing uses it

The envelope, the handlers, the shared TS mirror, the web rewrite and the tests are
all good work. The web rewrite in particular is better than the spec: it is bilingual,
it narrows the legacy fallback to two cases with a dev-only warning, and **both**
regression tests I asked for exist and pass — "birth time is required" resolves to
`BIRTH_TIME_REQUIRED`, and "sunrise unavailable" no longer resolves to the Sun-data
message ([`web/lib/error-messages.test.tsx`](../web/lib/error-messages.test.tsx)).
The backend tests are strong too: enum↔TS parity, `ta != en` on every code, and a
no-leak test that asserts `traceback`/`select private`/`secret.py`/`workspace` are
absent from the body.

Then there are three problems.

### 5.1 Zero adoption — the prose matching moved, it did not go away

```
raise AppError      in app/ :   0
raise HTTPException in app/ : 305
```

Every code a client sees is therefore produced by `_infer_http_error_code`, which
**substring-matches English detail prose on the backend**
([`app/core/errors.py:13-25`](../app/core/errors.py#L13-L25),
[`:73-100`](../app/core/errors.py#L73-L100)). The mechanism P2-3 exists to delete is
still the load-bearing one; it has been relocated from `web/` to `app/`.

This is not wrong as a *transition* — my spec explicitly sanctioned incremental
migration, and centralising the guesswork in one reviewed table is far better than
30 patterns scattered across the frontend. Two things make it incomplete:

- The spec said **"convert the endpoints the web dashboard actually surfaces errors
  from first."** None were converted. Without at least one real `AppError` raiser,
  nothing proves the intended path works end to end.
- `_DETAIL_CODE_RULES` inherits the ordering hazard it replaced. It is currently
  ordered correctly (`"birth time"` precedes `"birth profile"`), and it has no
  3–4 character patterns, so today it is safe — but nothing *keeps* it safe. Add a
  test that pins the two orderings that matter, or the next person appending a rule
  reintroduces the original bug.

**Recommended next step:** convert the ~10 endpoints behind the five migrated web
call sites to `raise AppError`, and add one test asserting an `AppError` raiser
produces its exact code without passing through inference.

### 5.2 Middleware-generated responses bypass the envelope entirely

Two of the most user-visible failures in the product never reach the exception
handlers, because they are returned directly from middleware:

| Response | Location | Body today |
|---|---|---|
| Rate limit | [`app/middleware.py:200-207`](../app/middleware.py#L200-L207) | `{"detail": "Rate limit exceeded. Please slow down."}` |
| Maintenance | [`app/middleware.py:231-232`](../app/middleware.py#L231-L232) | `{"detail": ...}` |

No `code`, no bilingual `message`, no `request_id`. A rate-limited Tamil user gets an
English string the frontend must substring-match — the exact situation P2-3 was
built to end, on two of the few errors where the client genuinely needs to branch
(back off and retry vs. show a maintenance screen).

Fix: have both call `error_envelope(...)` with `RATE_LIMITED` / `SERVICE_UNAVAILABLE`.
Note the rate-limit response also needs its `Retry-After` and `X-RateLimit-*` headers
preserved.

Related: `_infer_http_error_code` maps **every** 429 to `DAILY_LIMIT_REACHED`
([`errors.py:96-97`](../app/core/errors.py#L96-L97)), conflating "you are sending
requests too fast" with "you have used your quota for today". Those need different
codes and different UI. Add `RATE_LIMITED` and split them.

### 5.3 Synonym code pairs — fix before this reaches a client

The enum ships five pairs of codes that mean the same thing:

| | |
|---|---|
| `RESOURCE_NOT_FOUND` / `PROFILE_NOT_FOUND` / `BIRTH_PROFILE_NOT_FOUND` | `VAULT_NOT_FOUND` / `FAMILY_VAULT_NOT_FOUND` |
| `MEMBER_NOT_FOUND` / `FAMILY_MEMBER_NOT_FOUND` | `VALIDATION_FAILED` / `VALIDATION_ERROR` |
| `DATE_RANGE_INVALID` / `INVALID_DATE_RANGE` | |

The file's own docstring says: *"never rename or reuse a value that has reached a
client."* By that rule, every client must branch on both members of each pair
**forever**. `web/lib/error-messages.ts` already does — lines 28/29, 31/32, 33/34,
48/49, 50/51 are duplicated entries whose only purpose is covering a synonym.

**This is my spec's fault**, and it is worth stating so it is not repeated: my
handoff doc asserted "no error-code enum anywhere in `app/`". That was wrong — I
never verified it. `app/core/error_codes.py` already existed (259 lines, consumed by
`birth_profiles.py` and `birth_profile_service.py`), and the implementation correctly
preserved its names while also adding the different names I invented. The duplication
is the seam between the two lists.

It is cheap to fix now and permanent after the first client ships. Pick one name per
concept, delete the other, and keep the parity test green.

### 5.4 14 of 41 codes have no frontend title

`ERROR_META` covers 27 of 41. The other 14 fall back to "Something went wrong":

```
ACCOUNT_SUSPENDED, CONFIGURATION_ERROR, DUPLICATE_RESOURCE, FEEDBACK_NOT_FOUND,
INVALID_FORMAT, MISSING_DATA, MISSING_MOON_DATA, MISSING_REQUIRED_FIELD,
MISSING_SUN_DATA, PERMISSION_DENIED, RESOURCE_NOT_FOUND, TOKEN_REVOKED,
USER_NOT_FOUND, VALUE_OUT_OF_RANGE
```

This degrades gracefully — the *message* still comes from the backend's bilingual
copy, so only the title is generic — and `ACCOUNT_SUSPENDED` in particular deserves
its own title. Add the missing entries and a test asserting `ERROR_META` covers every
`ApiErrorCode`, so the next added code cannot silently regress to the generic title.

**Also verify by hand before merging:** `activeLanguage()` reads
`document.documentElement.lang` ([`error-messages.ts:57-60`](../web/lib/error-messages.ts#L57-L60)).
That is set by `dashboard-workspace.tsx:745` and `lang-toggle.tsx:16` — both
client-side. On a server-rendered or pre-hydration error, `lang` may still be the
document default, and a Tamil user would get the English message. Worth one manual
check with the language set to Tamil on a hard reload.

---

## 6. P2-6 — strong work, but analytics is now switched off with no way to switch it on

The three storage items are done well (§1). `hexToBytes` requires 64 hex chars, which
old `Math.random()` keys also satisfy, so existing installs keep working — the right
compatibility call. 20/20 mobile tests pass.

**The blocking gap:** `setAnalyticsConsent` is exported and gates both `trackEvent`
and `setUser`, but **nothing in `mobile/` ever calls it**, and `_analyticsConsent`
defaults to `false`. Every one of the 16 `trackEvent` call sites is now a permanent
no-op.

Failing closed is the correct default and I would not change it. But the item is not
finished until a consent surface exists that calls `setAnalyticsConsent(true)` —
otherwise this reads, to the next person, as "analytics is broken" and gets reverted.
Either build the consent toggle or write the gap down in
`docs/DATA_PROTECTION.md` as a deliberate pre-launch state.

**A validated win worth recording:** the property allowlist is not theoretical. Two
call sites were sending an astrological identifier to PostHog —
`jadhagam-teaser.tsx:138` (`{ rasi }`) and `rasi-picker.tsx:44`
(`{ step, rasi: selectedRasi }`). `rasi` is not in `ALLOWED_EVENT_PROPERTIES`, so it
is now stripped. That is exactly the leak the item was written to stop.

**Two smaller things:**

- `captureError` (Sentry) is **not** consent-gated, while `setUser` is. That is a
  defensible split — crash reporting under legitimate interest, product analytics
  under consent — but it is currently silent. One comment would prevent someone
  "fixing" the inconsistency in either direction.
- Installs created before this commit keep their `Math.random()`-derived key forever.
  Since 6b's whole point is key entropy, those users are still weak. Options: version
  the key (`v2` key → regenerate → re-encrypt), or accept it and record the decision.
  Given the pre-launch install base, accepting is reasonable — but it should be a
  decision, not an oversight.

---

## 7. P2-7b — good, and 1 of 3

The admin path is fixed properly: two grouped aggregate queries replace 2×N, results
default to `0` for users with no rows, and the budget test pins it at `<= 4`.

Not started, from the same item:

- Family-member profile retrieval
- Notification user lookups

The `query_counter` fixture ([`tests/conftest.py`](../tests/conftest.py)) is reusable
for both, so the remaining two should be cheap. **P2-7c** (contract tests) and
**P2-7d** (coverage) are untouched.

---

## 8. Environment findings — these change the handoff doc

Two things I asserted in `P2_BACKLOG_HANDOFF.md` §0.2 are wrong, and both come from
CLAUDE.md being stale rather than from anyone's change:

1. **Pytest cannot run against SQLite at all.** `tests/conftest.py:90` refuses any
   database whose name is not exactly `vinaadi_test`:
   `RuntimeError: Refusing to reset unexpected test database. Current database is './pytest_local_test.db'.`
2. **The app's engine cannot even be constructed for SQLite.**
   `app/db/session.py:13` passes `max_overflow`, which SQLite's dialect rejects at
   import time: `TypeError: Invalid argument(s) 'max_overflow' sent to create_engine()`.

CLAUDE.md's "Or use SQLite for offline tests: `sqlite:///./pytest_local_test.db`" has
therefore been non-functional for some time. This is the "a stale conclusion outlives
its check" pattern the repo already documents. **CLAUDE.md should be corrected** —
the SQLite escape hatch does not exist; per-test engines (as `test_newsletter.py`
does) are the working substitute.

**I could not get a clean backend test run.** Two `python -m pytest -q` processes are
running concurrently, owned by another agent:

```
PID 23844: python.exe <- powershell.exe <- codex.exe <- Code.exe
PID 21816: python.exe <- python.exe(23844) <- powershell.exe <- codex.exe <- Code.exe
```

My runs failed with `relation "newsletter_subscribers" does not exist` — the exact
signature CLAUDE.md describes for a competing `_reset_db()` (`DROP SCHEMA public
CASCADE`) landing mid-run. Per the repo rule I did **not** kill them; that is
`codex.exe`'s work, not mine, and killing it would destroy it.

I verified the newsletter table statically instead, which is contention-immune:
the model is in `Base.metadata.tables`, `_reset_db()` calls `Base.metadata.create_all`
([`conftest.py:145`](../tests/conftest.py#L145)), and `raw_client` calls `_reset_db()`
([`:200-202`](../tests/conftest.py#L200-L202)). The table is created unless something
external drops it, and something external is dropping it.

**Backend green/red is therefore still unconfirmed. Re-run once `codex.exe`'s pytest
finishes, and treat CI as authoritative.**

---

## 9. Recommended order from here

1. **P2-3 §5.3 — collapse the synonym codes.** Cheap now, permanent once a client
   ships. Do this before anything else in P2-3.
2. **P2-3 §5.2 — put the rate-limit 429 and maintenance 503 in the envelope**, and
   split `RATE_LIMITED` from `DAILY_LIMIT_REACHED`.
3. **P2-6 §6 — decide the consent surface.** Either build it or record the
   fail-closed state deliberately. Right now analytics is off by accident-shaped design.
4. **P2-3 §5.1 — convert ~10 real endpoints to `AppError`**, so the typed path has at
   least one non-inferred user.
5. **P2-4 §2** — delete the two roadmap lines (5 minutes).
6. **P2-7b** — the other two N+1 paths, using the existing `query_counter`.
7. Correct CLAUDE.md's SQLite guidance (§8).
