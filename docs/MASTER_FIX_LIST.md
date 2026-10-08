# Vinaadi AI Master Fix List

Last updated: 2026-06-26

Scope: Security, resilience, astrology accuracy, and follow-up verification work from the consolidated review list.

## Calendar Monthly — 2026-09-15

- [~] Owner-approved reference redesign using Nova fonts/colors, compact
  observance sidebar, selected-day summary and responsive grid. See
  [design and verification notes](CALENDAR_MONTHLY_REDESIGN_2026-09-15.md).

This document is written as an agent handoff. A coding agent should be able to pick one task ID, inspect the listed files, implement the fix, add or update tests, and report the result without relying on the original review chat.

## Before Starting

1. Read [CLAUDE.md](CLAUDE.md) and [AGENTS.md](AGENTS.md).
2. Work from repo root `D:\sanstro`.
3. Use PowerShell unless explicitly told otherwise.
4. Preserve existing user changes. Do not revert unrelated work.
5. For backend tests, use the test DB or SQLite test setup from `CLAUDE.md`; never point tests at `vinaadi_dev`.
6. For security fixes, add regression tests or explicit verification notes before marking done.

## Status Legend

- `[ ]` Not started
- `[~]` In progress
- `[x]` Done
- `[?]` Needs product, infrastructure, or external verification

## Suggested Execution Order

1. [SEC-1](#sec-1-auth-credential-abuse-throttling-high)
2. [SEC-3](#sec-3-mobile-persists-sensitive-data-in-plaintext-asyncstorage-med-high)
3. [RES-1](#res-1-public-panchangam-can-500-on-cache-or-db-failure-high) and [SEC-2](#sec-2-public-compute-heavy-endpoints-lack-endpoint-level-abuse-limits-high)
4. [AST-1](#ast-1-porutham-is-relabeled-ashtakoota-not-true-tamil-10-porutham-high)
5. [SEC-4](#sec-4-password-reset-token-is-an-unscoped-full-access-token-med) and [SEC-5](#sec-5-stateless-web-jwt-has-no-revocation-med)
6. [SEC-6](#sec-6-user-enumeration-via-registration-med) and [SEC-7](#sec-7-forgot-password-sends-smtp-synchronously-low-med)
7. [AST-3](#ast-3-draft-or-unverified-panchangam-tables-are-live-med) and [AST-4](#ast-4-nalla-neram-summary-uses-fixed-clock-times-med)
8. [AST-5](#ast-5-mean-node-vs-true-node-is-not-disclosed-low) and [AST-6](#ast-6-ayanamsa-edition-is-not-disclosed-low)
9. [FUP-1](#fup-1-web-token-handling-and-next-proxy), [FUP-2](#fup-2-production-cdn-or-waf-rate-limiting), [FUP-3](#fup-3-admin-destructive-route-authorization)

## Security

### SEC-1 Auth Credential-Abuse Throttling [HIGH]

Status: `[ ]`

Problem:
Authentication paths do not have tight per-account, per-IP throttling, lockout, or reset-throttling. The current global `120/min/IP` limiter is in-memory and per worker, so it is not cluster-wide.

Primary files:

- [app/api/auth.py](app/api/auth.py) - web register, login, forgot-password
- [app/api/mobile_auth.py](app/api/mobile_auth.py) - mobile register/login flows
- [app/middleware.py](app/middleware.py) - request IP and rate-limit plumbing
- [app/core/rate_limit.py](app/core/rate_limit.py) - limiter backend
- [app/core/redis_client.py](app/core/redis_client.py) - Redis integration
- [tests/test_auth_api.py](tests/test_auth_api.py)
- [tests/test_auth.py](tests/test_auth.py)
- [tests/test_cache_and_rate_limit.py](tests/test_cache_and_rate_limit.py)

Evidence:

- `app/api/auth.py`: login and forgot-password paths.
- `app/api/mobile_auth.py`: mobile auth paths.
- `app/middleware.py`: current rate-limit implementation.

Required fix:

- Add Redis-backed throttles for login, register, and forgot-password.
- Enforce both per-account and per-IP keys.
- Use a tight budget, around 5 to 10 attempts per minute per key.
- Add exponential backoff or short lockouts after repeated failures.
- Ensure the limiter is cluster-wide in production.
- Keep responses neutral where possible so throttling does not create a new enumeration oracle.

Done when:

- Repeated bad login attempts against one account are blocked even if IP changes are simulated.
- Repeated attempts from one IP against many accounts are blocked.
- Forgot-password requests are throttled by email and IP.
- Tests cover allowed, blocked, and reset-after-window behavior.

Suggested verification:

```powershell
pytest tests/test_auth_api.py tests/test_auth.py tests/test_cache_and_rate_limit.py
```

### SEC-2 Public Compute-Heavy Endpoints Lack Endpoint-Level Abuse Limits [HIGH]

Status: `[ ]`

Problem:
Unauthenticated chart, compare, PDF, panchangam, and muhurta endpoints perform expensive ephemeris and PDF work. The code appears to assume an infrastructure WAF or CDN limiter that may not exist.

Primary files:

- [app/api/public_tools.py](app/api/public_tools.py)
- [app/services/pdf_export_service.py](app/services/pdf_export_service.py)
- [app/services/panchangam_service.py](app/services/panchangam_service.py)
- [app/calculations/panchangam.py](app/calculations/panchangam.py)
- [app/core/rate_limit.py](app/core/rate_limit.py)
- [tests/test_public_tools_api.py](tests/test_public_tools_api.py)
- [tests/test_muhurta_api.py](tests/test_muhurta_api.py)

Evidence:

- `app/api/public_tools.py`: public chart, compare, compare PDF, panchangam, monthly panchangam, and muhurta endpoints.
- `app/api/public_tools.py`: public muhurta scans date ranges and computes panchangam snapshots.

Required fix:

- Add explicit endpoint-level per-IP quotas below the global limiter.
- Add a global concurrency cap for expensive `/public/*` operations.
- Add bot friction where appropriate for public form endpoints.
- Tighten the allowed muhurta date range.
- Add or strengthen aggressive cache keys for repeated `(date, lat, lng)` panchangam work.
- Confirm production CDN/WAF rate limiting exists; track that separately in [FUP-2](#fup-2-production-cdn-or-waf-rate-limiting).

Done when:

- Each expensive public endpoint has an application-level abuse limit.
- Public muhurta cannot be used to scan arbitrarily large ranges.
- Tests prove limits return the intended status and do not execute expensive work after blocking.
- Production WAF assumptions are documented or removed.

Suggested verification:

```powershell
pytest tests/test_public_tools_api.py tests/test_muhurta_api.py tests/test_cache_and_rate_limit.py
```

### SEC-3 Mobile Persists Sensitive Data in Plaintext AsyncStorage [MED-HIGH]

Status: `[ ]`

Problem:
React Query cache data including jadhagam, profile, dasha, guidance, and transits can be persisted in plaintext for 30 days. Private quick journal notes are also stored in plaintext AsyncStorage.

Primary files:

- [mobile/src/lib/queryClient.ts](mobile/src/lib/queryClient.ts)
- [mobile/app/_layout.tsx](mobile/app/_layout.tsx)
- [mobile/src/features/journal/journalStore.ts](mobile/src/features/journal/journalStore.ts)
- [mobile/src/lib/secureStore.ts](mobile/src/lib/secureStore.ts)
- [mobile/src/api/charts.ts](mobile/src/api/charts.ts)
- [mobile/src/api/dasha.ts](mobile/src/api/dasha.ts)
- [mobile/src/api/guidance.ts](mobile/src/api/guidance.ts)
- [mobile/src/api/transits.ts](mobile/src/api/transits.ts)

Evidence:

- `mobile/src/lib/queryClient.ts`: AsyncStorage persister and 30-day garbage collection.
- `mobile/src/features/journal/journalStore.ts`: quick journal entries stored via AsyncStorage.

Required fix:

- Replace plaintext persisted cache with an encrypted persister, such as encrypted MMKV with an Expo SecureStore-backed key.
- Add `shouldDehydrateQuery` allowlist or denylist logic so sensitive query keys are excluded from disk persistence.
- Exclude at minimum jadhagam, profile, chart, dasha, guidance, transits, and journal data from plaintext disk persistence.
- Move quick journal drafts and unsynced notes to encrypted storage.
- Preserve existing non-sensitive preferences where plaintext storage is acceptable.

Done when:

- Sensitive API responses are not written to AsyncStorage.
- Quick journal data at rest is encrypted or excluded from local disk persistence.
- App restart still preserves only approved non-sensitive cache/preferences.
- Tests or a documented manual storage inspection prove the sensitive keys are absent from AsyncStorage.

Suggested verification:

```powershell
npm run typecheck --workspace mobile
```

### SEC-4 Password Reset Token Is an Unscoped Full Access Token [MED]

Status: `[x]` — resolved 2026-07-04 (fix already existed in code, was untested; tests added, status corrected)

Problem:
Password reset links use a normal access JWT with only `sub`, `iat`, and `exp`. If leaked, the token grants full API access during its lifetime and is not single-use.

**Resolution note:** This status marker was stale — the underlying fix (typed `pwreset` claim, single-use `password_reset_tokens` table with `jti_hash`, 15-minute TTL, refresh-token revocation on reset) was already implemented in `app/api/auth.py` before this pass, but had zero test coverage and this doc still said `[ ]`. Added 5 regression tests in `tests/test_auth_api.py` covering every "Done when" line below, then flipped this status. See docs/API_FRONTEND_WIRING_AUDIT_2026-07.md WIRE-1 (this fix shipped together with the web/mobile password-reset completion UI, per that doc's sequencing note).

Primary files:

- [app/api/auth.py](app/api/auth.py)
- [app/core/auth.py](app/core/auth.py)
- [app/models/user.py](app/models/user.py)
- [migrations/versions](migrations/versions)
- [tests/test_auth_api.py](tests/test_auth_api.py)
- [tests/test_auth.py](tests/test_auth.py)

Evidence:

- `app/api/auth.py`: forgot-password creates an access token for reset.
- `app/core/auth.py`: current user dependency accepts normal JWTs.

Required fix:

- Add a token purpose claim, for example `typ: "pwreset"`.
- Ensure `get_current_user` and any normal auth dependency reject `typ: "pwreset"` tokens.
- Make reset tokens single-use using a persisted `jti` hash, token version, or reset-token table.
- Shorten reset token TTL if product allows.
- Invalidate existing reset tokens after successful password change.

Done when:

- A password-reset token cannot access authenticated APIs.
- A reset token works once for password reset and fails on replay.
- Expired reset tokens fail.
- Tests cover normal access token, reset token, replay, and expiry paths.

Suggested verification:

```powershell
pytest tests/test_auth_api.py tests/test_auth.py
```

### SEC-5 Stateless Web JWT Has No Revocation [MED]

Status: `[ ]`

Problem:
Web logout clears the cookie, but the JWT remains valid until expiry. Mobile token rotation exists, but the web session model is still effectively stateless.

Primary files:

- [app/api/auth.py](app/api/auth.py)
- [app/core/auth.py](app/core/auth.py)
- [web/hooks/useSession.ts](web/hooks/useSession.ts)
- [web/app/login/page.tsx](web/app/login/page.tsx)
- [tests/test_auth_api.py](tests/test_auth_api.py)
- [tests/test_auth.py](tests/test_auth.py)

Evidence:

- `app/api/auth.py`: logout path clears cookie.
- `app/core/auth.py`: JWT validation does not appear to check a token version or denylist.

Required fix:

- Choose one revocation model:
  - Short-lived web access JWT plus refresh token rotation, or
  - User token-version checked by `get_current_user`, or
  - Server-side denylist keyed by token `jti`.
- Ensure logout invalidates the current web session server-side.
- Ensure password change invalidates existing sessions.

Done when:

- After logout, replaying the old web JWT fails.
- After password change, previous web JWTs fail.
- Tests cover logout revocation and active-session preservation for unaffected sessions if applicable.

Suggested verification:

```powershell
pytest tests/test_auth_api.py tests/test_auth.py
```

### SEC-6 User Enumeration via Registration [MED]

Status: `[ ]`

Problem:
Registration returns an explicit conflict when an email is already registered, allowing attackers to enumerate accounts. This affects web and mobile registration.

Primary files:

- [app/api/auth.py](app/api/auth.py)
- [app/api/mobile_auth.py](app/api/mobile_auth.py)
- [app/services/email_service.py](app/services/email_service.py)
- [tests/test_auth_api.py](tests/test_auth_api.py)

Evidence:

- `app/api/auth.py`: web register returns account-exists behavior.
- `app/api/mobile_auth.py`: mobile register returns account-exists behavior.

Required fix:

- Return a neutral response for registration attempts using an existing email.
- Send an out-of-band email such as "you already have an account" where appropriate.
- Keep timing uniform enough to avoid obvious timing enumeration.
- Ensure mobile and web behavior match.

Done when:

- Existing and new email registration attempts do not reveal account existence in the API response.
- Tests verify response shape and status are neutral.
- Product copy is clear and does not mislead legitimate users.

Suggested verification:

```powershell
pytest tests/test_auth_api.py
```

### SEC-7 Forgot Password Sends SMTP Synchronously [LOW-MED]

Status: `[ ]`

Problem:
Forgot-password sends SMTP in the request path. That can become a timing oracle and ties up API workers for slow SMTP calls.

Primary files:

- [app/api/auth.py](app/api/auth.py)
- [app/services/email_service.py](app/services/email_service.py)
- [app/worker.py](app/worker.py)
- [app/scheduler.py](app/scheduler.py)
- [tests/test_auth_api.py](tests/test_auth_api.py)

Evidence:

- `app/api/auth.py`: password reset email is sent directly from the request handler.

Required fix:

- Move password reset email sending to a background queue, worker, or task abstraction.
- Return the same response regardless of whether the email exists.
- Log email enqueue/send failures without exposing them to the requester.

Done when:

- Forgot-password response does not wait on SMTP.
- Missing SMTP configuration still produces a neutral response.
- Tests mock the enqueue path and verify no synchronous SMTP call happens in the request handler.

Suggested verification:

```powershell
pytest tests/test_auth_api.py
```

### SEC-8 CORS Allowlist Depends on Environment Value [MED - VERIFY]

Status: `[?]`

Problem:
The code appears to avoid wildcard credentials, but production safety depends on `JOTHIDAM_CORS_ALLOW_ORIGINS` being configured as an exact allowlist.

Primary files:

- [app/main.py](app/main.py)
- [app/core/config.py](app/core/config.py)
- Deployment environment and CI secrets

Evidence:

- `app/main.py`: CORS middleware setup.

Required fix:

- Confirm production `JOTHIDAM_CORS_ALLOW_ORIGINS` is an exact origin list.
- Ensure it is never `*`, reflected dynamically, or broader than required when credentials are enabled.
- Document the expected production values in deployment notes, without committing secrets.

Done when:

- Production and preview CORS values are confirmed.
- A short note in the relevant deployment doc records the safe configuration.

Suggested verification:

```powershell
pytest tests/test_config.py
```

### SEC-9 Password Policy Minimal or Inconsistent [LOW-MED]

Status: `[ ]`

Problem:
Mobile enforces a minimum password length of 8. Web policy should be confirmed, and the system does not appear to reject common or breached passwords.

Primary files:

- [app/api/auth.py](app/api/auth.py)
- [app/api/mobile_auth.py](app/api/mobile_auth.py)
- [app/schemas/auth.py](app/schemas/auth.py)
- [mobile/app/(auth)/register.tsx](<mobile/app/(auth)/register.tsx>)
- [web/app/login/page.tsx](web/app/login/page.tsx)
- [tests/test_auth_api.py](tests/test_auth_api.py)

Evidence:

- `app/api/mobile_auth.py`: mobile password rule.

Required fix:

- Centralize password policy on the backend.
- Ensure web and mobile show matching policy copy.
- Reject common passwords.
- Consider adding breach-list checks if product accepts the dependency and latency tradeoff.

Done when:

- Web, mobile, and backend enforce the same policy.
- Common passwords are rejected.
- Tests cover weak, common, and valid passwords.

Suggested verification:

```powershell
pytest tests/test_auth_api.py
```

### SEC-10 X-Forwarded-For Trust Depends on Proxy Count [LOW - VERIFY]

Status: `[?]`

Problem:
Rate-limit IP extraction can be bypassed if `JOTHIDAM_TRUSTED_PROXY_COUNT` is wrong for the production proxy topology.

Primary files:

- [app/middleware.py](app/middleware.py)
- [app/core/config.py](app/core/config.py)
- Deployment environment
- [tests/test_cache_and_rate_limit.py](tests/test_cache_and_rate_limit.py)

Evidence:

- `app/middleware.py`: client IP resolution and X-Forwarded-For handling.

Required fix:

- Confirm the deployed proxy chain count.
- Set `JOTHIDAM_TRUSTED_PROXY_COUNT` to match the real topology.
- Add tests for spoofed X-Forwarded-For values and trusted proxy counts.

Done when:

- Spoofed X-Forwarded-For does not bypass rate limits.
- Production proxy count is documented.

Suggested verification:

```powershell
pytest tests/test_cache_and_rate_limit.py
```

### SEC-11 LLM Prompt-Injection Surface [LOW]

Status: `[ ]`

Problem:
User questions and own-chart context are sent to Claude. There is no cross-user data leak indicated, but user-supplied text can steer output.

Primary files:

- [app/services/ask_vinaadi_service.py](app/services/ask_vinaadi_service.py)
- [app/api/ask_vinaadi.py](app/api/ask_vinaadi.py)
- [tests/test_ask_vinaadi.py](tests/test_ask_vinaadi.py)

Evidence:

- `app/services/ask_vinaadi_service.py`: prompt assembly includes user question and chart context.

Required fix:

- Keep or add output validation.
- Escape, quote, or delimit user-supplied question text.
- Strip or downrank instruction-like content where possible.
- Add tests for prompt-injection attempts that try to override system behavior.

Done when:

- Prompt-injection test cases cannot override safety, privacy, or astrology-method constraints.
- Output still answers normal user questions.

Suggested verification:

```powershell
pytest tests/test_ask_vinaadi.py
```

### SEC-12 Webhook Lacks Idempotency and Replay Protection [LOW/INFO]

Status: `[ ]`

Problem:
RevenueCat webhook is secret-gated but lacks event-id dedupe and relies on body `app_user_id`. Payload signature validation should be used if available.

Primary files:

- [app/api/webhooks.py](app/api/webhooks.py)
- [app/core/config.py](app/core/config.py)
- [app/models/subscription.py](app/models/subscription.py)
- [migrations/versions](migrations/versions)
- Webhook tests, if present; otherwise add new backend tests

Evidence:

- `app/api/webhooks.py`: RevenueCat webhook validates shared secret.

Required fix:

- Persist processed webhook event IDs and reject duplicates idempotently.
- Add replay protection if RevenueCat provides event timestamp/signature material.
- Validate payload fields before mutating subscriptions.
- Keep idempotent behavior for repeated legitimate deliveries.

Done when:

- Replayed webhook event IDs do not duplicate or regress subscription state.
- Invalid signatures or stale events are rejected if signature support is implemented.
- Tests cover first delivery, retry delivery, invalid secret, and malformed body.

Suggested verification:

```powershell
pytest tests/test_auth_api.py tests/test_database_models.py
```

## Resilience

### RES-1 Public Panchangam Can 500 on Cache or DB Failure [HIGH]

Status: `[ ]`

Problem:
Public panchangam read paths can fail hard if cache reads, expired-row purge writes, schema-versioned selects, or DB availability degrade. A public unauthenticated GET should fall back to computation when cache is unhealthy.

Primary files:

- [app/api/public_tools.py](app/api/public_tools.py)
- [app/api/panchangam.py](app/api/panchangam.py)
- [app/services/panchangam_service.py](app/services/panchangam_service.py)
- [app/calculations/panchangam.py](app/calculations/panchangam.py)
- [app/services/panchangam_prewarm.py](app/services/panchangam_prewarm.py)
- [tests/test_panchangam_api.py](tests/test_panchangam_api.py)
- [tests/test_public_tools_api.py](tests/test_public_tools_api.py)
- [tests/test_panchangam.py](tests/test_panchangam.py)

Evidence:

- `app/api/public_tools.py`: public panchangam endpoint calls the panchangam service.
- `app/calculations/panchangam.py`: cache purge and cache load happen on read path.
- `app/calculations/panchangam.py`: range path also purges expired cache rows.

Required fix:

- Wrap cache read and purge failures in `try/except`.
- On cache-layer failure, compute with `use_cache=False` rather than returning 500.
- Move expired-row purge out of the hot read path into scheduled prewarm/maintenance jobs.
- Ensure authenticated and public panchangam paths share the same resilience behavior.
- Log cache failures with enough context but no noisy per-request stack floods.

Done when:

- Public panchangam returns computed data if cache table is missing, stale, locked, or temporarily unavailable.
- Expired cache purge does not run on every unauthenticated GET.
- Tests simulate cache-layer failure and assert a successful fallback response.

Suggested verification:

```powershell
pytest tests/test_panchangam_api.py tests/test_public_tools_api.py tests/test_panchangam.py
```

## Astrology Accuracy and Authenticity

### AST-1 Porutham Is Relabeled Ashtakoota, Not True Tamil 10-Porutham [HIGH]

Status: `[ ]`

Problem:
The current Porutham score uses Ashtakoota-style point weights totaling 36 under Tamil kuta labels. Authentic Tamil 10-porutham is generally presented as a 10-match pass/fail system, not a 36-point guna sum. This can mislead users.

Primary files:

- [app/calculations/porutham.py](app/calculations/porutham.py)
- [app/services/synastry_service.py](app/services/synastry_service.py)
- [app/api/relationships.py](app/api/relationships.py)
- [app/api/public_tools.py](app/api/public_tools.py)
- [mobile/app/(tabs)/tools/porutham.tsx](<mobile/app/(tabs)/tools/porutham.tsx>)
- [web/components/porutham-panel.tsx](web/components/porutham-panel.tsx)
- [web/app/tools/marriage-porutham-calculator/PoruthamTool.tsx](web/app/tools/marriage-porutham-calculator/PoruthamTool.tsx)
- [tests/test_porutham.py](tests/test_porutham.py)

Evidence:

- `app/calculations/porutham.py`: weights such as Dinam 3, Ganam 6, Yoni 4, Rasi 7, Graha Maitri 5, Vasya 2, Mahendra 4, Stree Dirgha 5.

Required fix:

- Choose one product direction:
  - Implement and present true Tamil 10-porutham match count, or
  - Clearly relabel the current score as "Ashtakoota guna score" and do not call it Tamil 10-porutham.
- If implementing Tamil 10-porutham, define each porutham as pass/fail and expose count plus critical exclusions.
- Update API schemas, web UI, mobile UI, and tests.
- Add source citations in code comments or methodology docs for each rule.

Done when:

- Users are not shown a 36-point score labeled as Tamil 10-porutham.
- API response fields and UI labels are internally consistent.
- Golden tests cover known compatible and incompatible nakshatra pairs.

Suggested verification:

```powershell
pytest tests/test_porutham.py tests/test_relationships_api.py tests/test_public_tools_api.py
```

### AST-2 Porutham Direction Conventions Are Simplified [MED]

Status: `[ ]`

Problem:
Dina, Mahendra, Stree Dirgha, and Vasya conventions appear simplified. The Vasya table is overridden by a table selected because tests exercise it, rather than because the source is documented.

Primary files:

- [app/calculations/porutham.py](app/calculations/porutham.py)
- [tests/test_porutham.py](tests/test_porutham.py)
- Methodology docs, likely [web/app/trust/methodology/page.tsx](web/app/trust/methodology/page.tsx)

Evidence:

- `app/calculations/porutham.py`: Vasya table override and simplified direction logic.

Required fix:

- Anchor each kuta rule to a named classical Tamil source or accepted panchangam convention.
- Add citations in concise code comments and methodology copy.
- Reconcile tests with the cited rules rather than preserving test-shaped logic.

Done when:

- Rule direction and good-remainder sets are documented by source.
- Tests reflect cited source behavior.
- UI can explain the method honestly.

Suggested verification:

```powershell
pytest tests/test_porutham.py
```

### AST-3 Draft or Unverified Panchangam Tables Are Live [MED]

Status: `[ ]`

Problem:
Soolam directions, Amirdhadhi Yogam, and generic Chandrashtamam offsets are marked as draft or unverified in code comments but are exposed in user-facing panchangam output.

Primary files:

- [app/calculations/panchangam.py](app/calculations/panchangam.py)
- [app/services/panchangam_service.py](app/services/panchangam_service.py)
- [app/schemas/panchangam.py](app/schemas/panchangam.py)
- [mobile/app/(tabs)/panchangam/index.tsx](<mobile/app/(tabs)/panchangam/index.tsx>)
- [mobile/app/(tabs)/panchangam/calendar.tsx](<mobile/app/(tabs)/panchangam/calendar.tsx>)
- [web/app/tools/daily-panchangam-planner/PanchangamTool.tsx](web/app/tools/daily-panchangam-planner/PanchangamTool.tsx)
- [tests/test_panchangam.py](tests/test_panchangam.py)
- [tests/test_panchangam_api.py](tests/test_panchangam_api.py)

Evidence:

- `app/calculations/panchangam.py`: Soolam, Amirdhadhi Yogam, and Chandrashtamam comments indicate draft or generic status.

Required fix:

- Verify each table against two or three named Tamil panchangam sources, or
- Label fields as preliminary or variant in API metadata and UI.
- Add cited source notes to the methodology page.
- Add tests for representative dates/nakshatras once verified.

Done when:

- No user-facing field is silently powered by a table marked draft or unverified.
- The app either shows verified data or clearly labels variants/preliminary data.
- Tests lock the verified table behavior.

Suggested verification:

```powershell
pytest tests/test_panchangam.py tests/test_panchangam_api.py
```

### AST-4 Nalla Neram Summary Uses Fixed Clock Times [MED]

Status: `[ ]`

Problem:
Nalla Neram summary slots use fixed IST-style clock tables instead of sunrise-relative computation. This drifts for users outside the assumed Tamil Nadu default, and it can drift by season and longitude. The full Gowri engine is already proportioned.

Primary files:

- [app/calculations/panchangam.py](app/calculations/panchangam.py)
- [app/services/panchangam_service.py](app/services/panchangam_service.py)
- [mobile/app/(tabs)/panchangam/index.tsx](<mobile/app/(tabs)/panchangam/index.tsx>)
- [web/app/tools/daily-panchangam-planner/PanchangamTool.tsx](web/app/tools/daily-panchangam-planner/PanchangamTool.tsx)
- [tests/test_panchangam.py](tests/test_panchangam.py)

Evidence:

- `app/calculations/panchangam.py`: summary tables are hardcoded while Gowri slots are computed from sunrise/sunset.

Required fix:

- Derive Nalla Neram summary from computed Gowri slots, or
- Explicitly restrict fixed tables to the Tamil Nadu default and compute dynamically elsewhere.
- Update API response and UI labels if behavior differs by location.

Done when:

- Nalla Neram responds to latitude, longitude, timezone, sunrise, and sunset where appropriate.
- Chennai fallback still matches expected Tamil Nadu defaults.
- Tests cover at least Chennai and one non-Chennai location/date.

Suggested verification:

```powershell
pytest tests/test_panchangam.py tests/test_panchangam_api.py
```

### AST-5 Mean Node vs True Node Is Not Disclosed [LOW]

Status: `[ ]`

Problem:
The app uses the mean node for Rahu/Ketu. This is defensible, but true-node Drik panchangams can differ by roughly 1.5 degrees and may flip nakshatra or pada near boundaries. Users should be told the methodology.

Primary files:

- [app/calculations/ephemeris.py](app/calculations/ephemeris.py)
- [app/services/chart_service.py](app/services/chart_service.py)
- [web/app/trust/methodology/page.tsx](web/app/trust/methodology/page.tsx)
- Mobile methodology or learn screens if applicable

Evidence:

- `app/calculations/ephemeris.py`: Rahu uses mean node.
- `app/models/chart.py`: node type defaults to mean node.

Required fix:

- Document that the app uses mean node for Rahu/Ketu.
- Explain that near-boundary nakshatra or pada differences can happen compared with true-node systems.
- Optionally make node type configurable later; do not silently change calculation semantics without migration and tests.

Done when:

- Methodology page clearly states mean node usage.
- User-facing chart methodology is accurate.

Suggested verification:

```powershell
pytest tests/test_ephemeris.py tests/test_charts_api.py
```

### AST-6 Ayanamsa Edition Is Not Disclosed [LOW]

Status: `[ ]`

Problem:
The app uses Lahiri, also known as Chitra-paksha, which is mainstream and defensible. It should be disclosed in the methodology.

Primary files:

- [app/calculations/ephemeris.py](app/calculations/ephemeris.py)
- [web/app/trust/methodology/page.tsx](web/app/trust/methodology/page.tsx)
- Mobile methodology or learn screens if applicable

Evidence:

- `app/calculations/ephemeris.py`: sidereal mode is Lahiri.

Required fix:

- State "Lahiri (Chitra-paksha)" on the methodology page.
- Use the same wording across web and mobile if mobile exposes methodology.

Done when:

- Methodology page discloses the ayanamsa.
- Tests remain green; no calculation behavior changes are needed.

Suggested verification:

```powershell
pytest tests/test_ephemeris.py
```

## Follow-Up Passes

### FUP-1 Web Token Handling and Next Proxy

Status: `[?]`

Question:
Does the web app ever expose JWTs to client JavaScript, or does it keep them in HTTP-only cookies and forward through the Next proxy safely?

Primary files:

- `web/app/api/backend/[...path]/route.ts`
- [web/middleware.ts](web/middleware.ts)
- [web/hooks/useSession.ts](web/hooks/useSession.ts)
- [web/lib/api.ts](web/lib/api.ts)
- [app/api/auth.py](app/api/auth.py)
- [app/core/auth.py](app/core/auth.py)

Required follow-up:

- Trace login, refresh, logout, and backend proxy flows.
- Confirm whether JWTs are readable by client JS.
- Confirm CSRF strategy for cookie-authenticated calls.
- Record findings and create specific fix tasks if gaps exist.

Done when:

- There is a written finding with the exact token storage model.
- Any discovered issues are filed as concrete SEC tasks.

### FUP-2 Production CDN or WAF Rate Limiting

Status: `[?]`

Question:
Does production actually enforce the WAF/CDN rate limiting assumed by public endpoints?

Primary files:

- Infrastructure configuration outside the repo
- [app/api/public_tools.py](app/api/public_tools.py)
- [app/core/rate_limit.py](app/core/rate_limit.py)

Required follow-up:

- Confirm deployed CDN/WAF vendor and rules.
- Confirm exact limits for public chart, compare, PDF, panchangam, and muhurta endpoints.
- Document what protection exists outside the app.
- If no external limiter exists, prioritize [SEC-2](#sec-2-public-compute-heavy-endpoints-lack-endpoint-level-abuse-limits-high).

Done when:

- Production public endpoint abuse controls are documented.
- Any missing protection is converted into implementation tasks.

### FUP-3 Admin Destructive Route Authorization

Status: `[?]`

Question:
Are destructive admin routes correctly gated by `enable_admin_data_delete` and strong admin authorization?

Primary files:

- [app/api/admin.py](app/api/admin.py)
- [app/core/config.py](app/core/config.py)
- [app/models/user.py](app/models/user.py)
- [tests/test_admin_api.py](tests/test_admin_api.py)

Required follow-up:

- Enumerate every admin route that deletes, resets, purges, impersonates, exports, or mutates sensitive data.
- Confirm each route requires admin auth and the correct feature flag where destructive.
- Add tests for unauthorized user, normal user, admin without flag, and admin with flag.

Done when:

- Admin destructive surface is inventoried.
- Missing authorization or flag checks are fixed.
- Tests cover the inventory.

## Architecture remediation A01–A16 — 2026-10-07

Evidence: [Architecture audit](ARCHITECTURE_AUDIT_2026-10-07.md). Implementation
guide, phase order and definition of done:
[Findings and solutions](ARCHITECTURE_FINDINGS_AND_SOLUTIONS_2026-10-07.md) §6.

Every finding below was re-verified against current source before any edit; all
sixteen still described the code exactly as written, with no line-number drift
worth recording.

### Phase 1

- [x] **A01 — production Compose misroutes API traffic.** `docker-compose.app.yml`
  handed the web service `API_BASE_URL`; every reader in `web/` reads
  `BACKEND_URL` and fell back to loopback *inside the web container*. Fixed by
  naming the canonical variable in Compose and routing all seven readers through
  `web/lib/backend-url.ts`, which validates format, accepts the old name as a
  warned transitional alias, and refuses the development default in production
  at request time (never at module scope, so `next build` is unaffected).
  Gate: `web/lib/backend-url.test.ts` (15 cases). Baseline recorded: against the
  unfixed tree it failed 5 of them, naming `API_BASE_URL` in the web service and
  all seven direct readers.
  **Blind spot:** static. It cannot resolve `api`, open a socket, or run the
  proxy. `scripts/compose-proxy-smoke.ps1` + the `compose-proxy-smoke` CI job
  cover that half — see A01-b, which is NOT yet green.
- [x] **A01-b — end-to-end Compose smoke, and the api image that blocked it.**
  Running the smoke surfaced a separate defect: **the api image did not build at
  all, from any machine.** `Dockerfile` used `python:3.12-slim`,
  `requirements.txt:85` pins `pyswisseph==2.10.3.2` for
  `python_version < '3.14'`, and pyswisseph publishes **no cp312 wheel in any
  release** — so pip fell back to the sdist and died on
  `[Errno 2] No such file or directory: 'gcc'`. The Dockerfile's own comment
  ("wheels exist for psycopg2-binary / pyswisseph / cryptography") was false for
  that base image. Two things hid it: no CI job builds this file, and the
  backend test job installs the same requirements successfully because
  `ubuntu-latest` ships gcc.

  **Owner decision 2026-10-07:** compile in a throwaway `wheels` stage and keep
  the runtime slim — rather than adding gcc to the shipped image, or moving to
  `python:3.14-slim` and the `swisseph-ffi` binding, which would put production
  on a backend CI does not test (`docs/vinaadi-fix-spec.md` requires both
  bindings to be verified).
  **Verified:** image builds, 554MB, `import swisseph` → `2.10.03`, and `gcc` is
  absent from the runtime image.

  **Smoke executed, with its negative control:** `scripts/compose-proxy-smoke.ps1`
  brings up db + redis + api + web from the real compose file under an isolated
  project name and asserts six claims through the Next proxy — `/`,
  `/api/backend/health/ready`, synthetic register → login → `auth/me` (Bearer,
  so a Secure cookie over plain HTTP cannot confound it), and a bounded 502 on
  backend outage. All six PASS. With `-BreakBackendUrl` (loopback, the address
  A01's fallback produced) the proxy claims FAIL, as required.

  **Blind spots:**
  - The web image **cannot be built on this machine**: `pnpm install` exhausts
    the Dockerfile's 3 × 480s retry budget, the condition `web/Dockerfile`
    already documents. The smoke therefore ran against `vinaadi-web:local`, an
    image built four weeks ago that **predates `web/lib/backend-url.ts`**. It
    reads `process.env.BACKEND_URL` directly, so the run proves the *compose
    configuration* half end to end — container DNS, the proxy, POST bodies and
    the Authorization header — but **not** the new resolver, which is covered
    only by the unit gate. CI builds both images and runs the same script.
  - An earlier version of the script fired its probes while the api container
    was still running Alembic, reporting 502 on a correct stack. Worse, the
    negative control would then have "passed" because the backend had not
    finished booting rather than because the URL was wrong — a gate that cannot
    fail. It now waits for the api healthcheck before making any claim.
  - It reads the compose file in the repo, not whatever `-f` overlay or
    `env_file` an operator actually deploys with.
- [x] **A03 — replay revocation rolled back.** The theft-signal branch revoked
  the user's active refresh tokens and raised 401; `get_db` rolled the
  transaction back on that exception, discarding the revocation. The endpoint
  answered "revoked", logged a theft signal, and left every successor usable.
  Fixed with a narrow `db.commit()` before the raise — safe here because the
  only prior database work in the handler is one SELECT, so no unrelated pending
  state can ride along. A failed commit now logs
  `refresh_token_theft_revocation_failed` and returns 503 instead of recording a
  theft signal that never persisted.
  **Owner ruling 2026-10-07:** the incident also advances `token_version`, so
  access tokens already issued die immediately. Policy, not an implementation
  detail: a legitimate client replaying a stale token is signed out everywhere.
  Gate: `tests/test_refresh_replay_revocation.py` (5 cases). Baseline recorded:
  4 of 5 failed against the unfixed tree; the fifth (ordinary rotation must not
  advance `token_version`) passed before and after, by design.
  **Blind spot:** sequential. A bulk `UPDATE ... WHERE revoked_at IS NULL`
  cannot revoke a row inserted after it runs, so a successor issued *during*
  replay handling is outside these tests. Closing that needs issuance and
  revocation to share a generation check (A03 step 7), which this change does
  not attempt. The suite also says nothing about the mobile client's reaction to
  the 401, or about whether the theft signal reaches an operator.
- [x] **A02 / A07 / A08 — mobile identity, cache and refresh lifecycle.**
  Done as one work package, because the three findings are one defect seen from
  three places: no component owned "the session changed".

  **A02.** `src/state/sessionTransition.ts` is now the single owner of a session
  starting or ending, with `src/lib/sessionIdentity.ts` holding the account and
  a *generation* — a number that makes work started before a transition
  unpublishable after it. Order is the design: the generation advances first, so
  everything in flight is obsolete before anything is torn down. Call sites
  converted: `app/_layout.tsx` (bootstrap + terminal 401),
  `app/(auth)/login.tsx`, `app/(tabs)/me.tsx` (sign-out).
  Defence in depth: `src/lib/queryKeys.ts::accountKey()` namespaces the five
  account-independent private keys (`family-vaults`, `notification-prefs`,
  `notification-inbox`, `my-subscription`, `ask-vinaadi-status`) across seven
  call sites.
  **Baseline recorded:** driving the pre-A02 sign-out sequence (`logout()`,
  `clearTokens()`, `clearUserPrefs()`) against the real cache served B
  `{"items":[{"familyVaultId":"A-vault"}]}` with **0 requests issued**.

  **A07.** `encryptedQueryPersister.ts` now uses the installed library's real
  `Persister`/`PersistedClient` types instead of a hand-written `any`, which is
  what let the wrong shape compile: the filter was checking `clientState.queries`
  *on the envelope*, so it returned its input untouched. Policy is now an
  allowlist (`src/lib/queryCachePolicy.ts`) — the denylist was unsafe by
  default, matching none of a dozen private surfaces, and repairing only the
  envelope bug would have *started* persisting them. Namespaced per account,
  version-busted, and validated on restore (schema, envelope age, per-key age,
  shape), re-filtering inbound so a cache written by an older build is still
  policed.
  **Owner ruling 2026-10-07:** persist the user's own chart summary, current
  dasha, and a short-lived today snapshot. **Family-vault data is NOT persisted
  in V1.** Everything unlisted is memory-only.
  **Baseline recorded:** against the installed library's own `dehydrate` output
  the pre-fix persister wrote `["profile","family-vaults"]` — and `profile` is
  pattern #2 of its own denylist.

  **A08.** `fetchWithAuth` is now one refresh and one replay, then terminal;
  single-flight refresh preserved; refreshed credentials are not written if the
  generation moved; a terminal 401 routes through A02's full teardown instead of
  clearing tokens alone.
  **Baseline recorded:** the pre-fix client against a persistently-401 resource
  ends in `FATAL ERROR: Ineffective mark-compacts near heap limit — JavaScript
  heap out of memory`. The audit's probe looked bounded only because the probe
  failed its own fifth refresh on purpose.

  **Gates:** `__tests__/encryptedQueryPersister.test.ts` (12),
  `__tests__/sessionTransition.test.ts` (10), `__tests__/apiClientRefresh.test.ts`
  (7), `__tests__/queryKeyScoping.test.ts` (4 — ratchet, verified to fail in both
  directions when one call site is reverted). Full mobile suite 151/151, tsc and
  lint clean.

  **A gap these tests did not catch, found by reading the library:**
  `PersistQueryClientProvider` restores exactly once, in a mount effect that runs
  before bootstrap knows who is signed in — so with per-call identity resolution
  the persisted cache would have been written forever and never read, and every
  cold start would have had no offline data. The coordinator now restores
  explicitly once the identity is live. Two tests cover it, confirmed to fail
  with that call removed.

  **Blind spots:**
  - No component is rendered. The coordinator is proven correct when called;
    that `me.tsx`'s button reaches it is ordinary source a reviewer must check.
  - `fetch` is a mock resolving immediately, so A08 proves retry *structure*, not
    behaviour on a slow or flapping link. **Request deadlines and cancellation
    (A08 step 7) are NOT implemented and not claimed.**
  - The query-key ratchet is a source match on literal keys; a key built at
    runtime or via another helper is invisible to it.
  - Error classification (A08 step 8) is not implemented: a failed refresh is
    still treated as terminal, so a network outage during refresh signs the user
    out. Pre-existing behaviour, deliberately unchanged here.
  - A user id in a cache key is isolation metadata, never an access check; the
    backend must still refuse A's data to B.
  - Purchase-SDK identity is explicitly out of scope here and is A04.
  - The mobile suite now reports 151/151 where the audit saw 117 passed + 1
    five-second screen-test timeout. That test was not touched; its passing here
    is not evidence the open-handle warning is resolved.
- [x] **A04 / A05 — purchase identity and billing event consistency.**

  **Owner decision 2026-10-07:** block purchase and restore until the purchase
  SDK confirms it is bound to the signed-in UUID; **no automatic transfer** of
  existing purchases. Mismatched historical receipts are reconciled by hand
  against provider evidence.

  **The provider contract was read, not remembered.** RevenueCat's webhook
  field reference confirms `id` (unique, **reused on retries**),
  `event_timestamp_ms` (also reused), `app_user_id` /
  `original_app_user_id` / `aliases`, `product_id`, `transaction_id` /
  `original_transaction_id`, `expiration_at_ms`, `store`. The installed SDK
  (`react-native-purchases` 8.12.0) was checked the same way: `logIn`,
  `logOut`, `isAnonymous`, `getAppUserID` all exist, and `logOut()` on an
  already-anonymous user is an error rather than a no-op — which is why the
  adapter asks first, as the guide instructed.

  **A05 (backend).** New `webhook_events` inbox with a unique
  `(provider, event_id)`; the constraint is the idempotency guarantee, because
  a prior SELECT would let two concurrent deliveries both pass. Account
  resolution now walks `app_user_id` → `original_app_user_id` → `aliases`, so a
  purchase made under an anonymous id still reaches the right account. An
  unresolvable event is recorded as `unresolved` instead of being dropped.
  Ordering guard: `subscriptions.provider_event_timestamp` holds the last
  applied event's time, and an older event is recorded `stale` and changes
  nothing. `provider_subscription_id` now holds `original_transaction_id` (what
  its name always claimed) and the SKU moved to the new `provider_product_id`.
  Migration `ss2c3d4e5f6a`, additive, reversible, **round-trip verified**
  (upgrade → downgrade → upgrade on `vinaadi_test`).
  **No backfill was needed, and that was checked rather than assumed:**
  `subscriptions` held 0 rows and 0 duplicate `user_id`s, so there was nothing
  to deduplicate and no stored value being redefined. The guide's caution about
  a uniqueness migration presumes rows exist.

  **A04 (mobile).** `src/lib/purchaseIdentity.ts` is an adapter with explicit
  states (`unavailable` | `signed-out` | `syncing` | `ready` | `failed`), so an
  absent SDK in Expo Go is distinguishable from a real billing error — the old
  code swallowed both into one silent `catch`. Generation-guarded, so a slow
  bind for A cannot publish readiness after a switch to B, and single-flighted,
  so the coordinator and bootstrap share one `logIn`. Wired into A02's
  coordinator on both edges. `app/premium.tsx` now calls `assertPurchaseReady`
  before `purchasePackage` and `restorePurchases`, and takes the tier from the
  **server** (`getMySubscription`, the existing shared wrapper) instead of
  writing a local `setSession(user, "premium")` on the store's reply — with a
  bounded pending message when the webhook has not landed yet.
  The mount-only `purchases.logIn(me.userId)` in `app/_layout.tsx` is gone.

  **Gates:** `tests/test_webhook_inbox.py` (15), `mobile/__tests__/purchaseIdentity.test.ts`
  (15, including a source ratchet that the screen actually consults the gate —
  verified to fail when one `assertPurchaseReady` is removed).
  **Baseline:** the pre-fix handler was driven directly — renewal → `active`,
  then an hour-older expiration → **`inactive`**, with
  `provider_subscription_id == 'premium_monthly'`, a SKU in a column named
  subscription id. Both defects reproduced before any edit.
  **Existing suites:** 43 pass across `test_revenuecat_webhook`,
  `test_subscription`, `test_tier_parity`, `test_webhook_inbox`. Contract guards
  unchanged at **288 passed / 9 skipped** — the audit's own figures. mypy, ruff
  and mobile tsc/lint clean.

  **A regression I caused and caught:** requiring `id` and returning 400 broke
  8 existing webhook tests, whose fixtures omit it because the old handler never
  read the field. A 400 would also make RevenueCat drop such an event
  permanently (they retry 5xx, not 4xx). Replaced with a deterministic
  content-derived key, so a redelivery still dedupes and no event is lost —
  which left all 8 fixtures untouched and still asserting what they asserted.

  **Blind spots:**
  - **No store transaction, sandbox account or receipt was involved.** The SDK
    is a stub. Whether a correctly-identified purchase is *attributed* as
    intended is a RevenueCat dashboard question, and **the project's
    alias/transfer settings were never inspected** — which is also why no
    transfer behaviour is implemented.
  - **No reconciliation against provider state (A05 step 7).** Entitlement is
    still derived from the event stream alone, so a permanently lost event is
    not recovered by anything here.
  - Concurrent delivery of two initial events is not raced in a test; the
    index on `(provider, provider_subscription_id)` is deliberately **not
    unique**, because a store can reissue an `original_transaction_id` across
    sandbox and production and rejecting real events at the database layer
    would be worse than the duplicate.
  - The purchase-gate ratchet is a source match: it proves the call precedes
    the transaction in the file, not that it covers every reachable path. No
    screen test renders the real premium component.
  - `mobile/__tests__/birth-details.screen.test.tsx` ("bundled place search
    B-006") still flakes under full-suite load at ~15s and passes 5/5 in
    isolation. That is the test the audit already recorded timing out; it was
    not touched and is **not** fixed.
- [x] **A06 — Redis outages no longer grant unlimited authentication attempts.**
  `RedisRateLimitBackend.check` caught every Redis error and returned
  `allowed=True`, and `AuthThrottler` used that same backend, so during an
  outage a five-logins-per-minute throttle became unlimited. `allowed=True` was
  carrying two incompatible meanings — "within budget" and "could not check" —
  with no way for a caller to tell them apart.

  `RateLimitResult` now reports `available`, and the policy for acting on it
  lives with the protected operation. The global per-IP middleware
  **deliberately still fails open** (an aggregate control; locking everyone out
  over infrastructure is the worse trade) and is unchanged — one test pins that
  an unavailable result still reads as `allowed` for exactly that reason.

  **Owner decision 2026-10-07:** auth endpoints return a bounded **503** with
  `Retry-After`. Not 401 — the credentials have not been proven invalid, and a
  client reading 401 as "signed out" would log users out over a Redis fault.
  Not 429 — reserved for a limit genuinely exceeded. The availability cost is
  the point of the ruling, not an oversight. The rejected alternative was a
  per-process fallback limiter, which keeps sign-in working while silently
  multiplying the effective limit by the worker and replica count.

  `AuthThrottler.check()` is replaced by `evaluate()` (reports) + `enforce()`
  (applies the policy, raises). All **8** protected call sites across
  `app/api/auth.py`, `mobile_auth.py` and `admin.py` were converted — each had
  carried its own five-line `raise HTTPException(429, …)` block, which is how
  one policy came to be stated eight times and changeable in seven of them
  without the eighth. Net −80 lines in `app/api/`. Per-action messages moved
  into a typed `_Budget` record; the heterogeneous dict it replaced inferred as
  `object` and needed casts mypy could not check.

  Operations: [`docs/runbooks/REDIS_OUTAGE.md`](runbooks/REDIS_OUTAGE.md),
  including the trap that `ADMIN_ELEVATION` is itself throttled — so during an
  outage an operator cannot elevate, and recovery must not route through the
  admin console.

  **Gate:** `tests/test_auth_throttle_outage.py` (17). **Baseline:** 15 of 16
  failed against the unfixed tree; the one that passed is the middleware
  behaviour being deliberately preserved. Existing `test_auth_throttle.py`
  migrated to `evaluate()` and still green. mypy and ruff clean.

  **Blind spots:**
  - **A06 step 6 is NOT done.** `/health/ready` reports Redis as required, but
    the supplied nginx config proxies everything to `web`, so readiness still
    does not control traffic. What happens when every instance is unready is
    undecided. This is unimplemented infrastructure work.
  - **No metric is exported.** The degradation signal is a named log line
    (`auth_throttle_limiter_unavailable`), not the `limiter_unavailable_total`
    counter the audit's observability table calls for.
  - The outage is injected by making the Redis client raise — the failure mode
    the backend catches, not a partition, a timeout, or a half-open socket.
  - Tested at the application boundary, **not through the real ingress**, which
    is what the audit's acceptance criterion actually names.
  - Startup asymmetry, recorded rather than fixed: `get_rate_limit_backend()` is
    `lru_cache`d, so a process that *starts* with Redis unreachable falls back
    to the in-memory limiter and stays there until restarted. Runtime recovery
    needs no restart and is tested; restarting during an outage makes
    enforcement weaker, not stronger.
  - Mobile is tested not to sign out on a 503; the user-facing message is still
    the generic client error rather than the server's detail. Not changed —
    step 4 asks only that it not sign out.

### Phase 2

- [x] **A09 / A10 — scheduler ownership and durable notification delivery.**
  Done as one package per the guide's own instruction to address them together
  "enough to prevent duplicate ownership from becoming duplicate delivery."

  **Owner decision 2026-10-08 (A09): DEDICATED WORKER ONLY.** `worker` in
  `docker-compose.app.yml` is no longer behind `profiles: ["scaled"]` — it is
  the sole production scheduler, always started. `app/core/config.py` refuses
  to boot a production/staging API with `run_scheduler_in_web=true`; the
  default flipped from `true` to `false`. `app/core/leader_lock.py` gained
  `SchedulerLease.check()`, which re-verifies the advisory lock by pinned
  `pg_backend_pid()` rather than trusting SQLAlchemy not to have silently
  reconnected the held connection. `app/worker.py` calls `check()` every
  `JOTHIDAM_SCHEDULER_HEARTBEAT_INTERVAL_SECONDS` and raises (terminating the
  process for supervised restart) the moment it fails, recording a durable
  heartbeat (`scheduler_heartbeats`, new table) on every successful cycle.
  `app/worker_health.py` is the container healthcheck, reading that heartbeat's
  freshness rather than merely the process existing.

  **Owner decision 2026-10-08 (A10): PER-NOTIFICATION EXPIRY, DROP SILENTLY
  PAST IT.** `notification_dispatch_service.py` was rewritten around a
  transactional outbox: `dispatch_notification()` now only persists intent
  (`notifications`, gained `logical_key` unique + `expires_at`) and per-channel
  work (`notification_deliveries`, new table) — it never calls a provider.
  `process_notification_outbox()` (scheduled every minute) atomically claims
  due work with `FOR UPDATE SKIP LOCKED` in bounded batches, commits the claim
  before any provider call, and only then performs the push/email I/O in a
  second transaction. Claims carry a 5-minute expiry and a fencing token so a
  crashed worker's claim is recoverable without a resurrected worker
  overwriting a newer owner's result. Push and email advance independently;
  transient failures get bounded exponential backoff with jitter, capped at 5
  attempts before `exhausted`. Expired work is marked `expired` and never sent
  — the in-app inbox still shows it (`_due_status_filter` in
  `app/api/notifications.py` now includes `expired`/`failed`, not just
  `sent`). `app/services/birth_profile_service.py`'s D+1 onboarding nudge now
  goes through `dispatch_notification()` too, closing a pre-existing
  check-then-insert race (a duplicate send was possible between the SELECT and
  the INSERT); the new unique `logical_key` makes that an
  `on_conflict_do_nothing` instead.

  Migration `tt3d4e5f6a7b`, additive, reversible, **round-trip verified**
  (`DROP SCHEMA public CASCADE` → upgrade head → downgrade -1 → upgrade head
  on `vinaadi_test`, confirmed both new tables exist after the second
  upgrade). Existing `notifications` rows keep NULL `logical_key`/`expires_at`
  and get no delivery rows — replaying historical queued/failed rows was
  explicitly rejected as turning an infra rollout into a user-visible resend.

  **Gates:** `tests/test_notification_outbox.py` (7: committed-intent
  delivery, expiry before send, future-dated inbox-only expiry, partial
  channel success with independent retry, two-worker claim exclusivity,
  claim-expiry fencing, provider-accepted-but-commit-failed at-least-once),
  `tests/test_scheduler_worker_resilience.py` (4: real `pg_terminate_backend`
  leadership loss, healthy-leadership confirmation + mutual exclusion,
  heartbeat freshness/aging, compose ownership shape),
  `tests/test_architecture_a09_a10_baseline.py` (3: production API refuses
  scheduler ownership, worker fails rather than idles without leadership,
  provider never called before intent commit).

  **Every gate verified to fail with its fix removed, not just assumed:**
  - Dropping `.with_for_update(skip_locked=True)` from the outbox claim query:
    `test_two_workers_cannot_claim_the_same_delivery` **did not catch this** in
    its first form — the two claims ran sequentially (first commits, then
    second starts), so the `WHERE status NOT IN ('claimed', ...)` clause alone
    passed the assertion with no row lock involved at all, proving nothing
    about concurrent workers. Rewritten to keep worker-a's transaction open
    (uncommitted) while worker-b claims, so only `SKIP LOCKED` can keep
    worker-b off the row. Confirmed: fails (both workers claim the same
    delivery) with the fix removed, passes with it restored.
  - Stubbing `SchedulerLease.check()` to `return self.is_leader` (no real
    `pg_locks` query): `test_lease_detects_terminated_postgresql_session`
    correctly fails. The classid/objid split of the 64-bit advisory-lock key
    was also verified by hand against real PostgreSQL (not just inferred from
    the killed-connection path, which never exercises the comparison).
  - Sharing one request session across dashboard-bundle sections again (A11,
    see below) was verified the same way.

  **Blind spots:**
  - FCM/SMTP expose no idempotency key the outbox can hand back on retry; if a
    provider accepts a request and the worker dies before the outcome commits,
    a retry can still send a real duplicate. Documented in
    `docs/NOTIFICATION_DELIVERY.md`, not solved — the guide says this is a
    residual limit of any outbox over these providers, not a defect here.
  - No replicated-worker scenario was run (single worker is the entire
    production topology per the owner decision); A09 step 4's bounded-backoff
    follower retry is therefore not implemented, correctly, since there are no
    followers to retry.
  - `test_two_workers_cannot_claim_the_same_delivery` proves row-level mutual
    exclusion for the claim query specifically. It says nothing about the
    `_complete_claim` write path's own `with_for_update()` (line ~489),
    which was not independently fault-injected.
  - The smart-silence suppression check (pre-existing logic, relocated to
    delivery time rather than dispatch time) was not re-audited against the
    Sani-cycle tagging itself — only its new position in the pipeline.

- [x] **A11 — transaction ownership and dashboard isolation.**
  `app/services/dashboard_bundle_service.py`'s `safe_db()` helper now opens an
  independent `SessionLocal.begin()` per optional, DB-backed section
  (`dailyGuidance`, `dailyGuidanceRange`, `transit`, `sani`,
  `peyarchiUpcoming`, `explanation`, `panchangam`, `panchangamTimings`,
  `lifeAreas`, `weekAhead`) instead of sharing the request-scoped session —
  per the guide's explicit warning (step 5), **not** via `begin_nested()`,
  since `Session.begin_nested()` flushes unconditionally and `app/db/session.py`
  disables autoflush on purpose. A `DBAPIError` with `connection_invalidated`
  still aborts the whole request (a lost connection is a hard dependency, not
  an isolatable section); every other DB exception is caught, recorded in
  `errors[section]`, and returns `None` for that section only. Pure-calculation
  sections (`summary`, `dasha`, `nakshatraCard`) keep the cheap in-process
  `safe()` path — no DB session, nothing to isolate.

  **Gate:** `tests/test_dashboard_bundle_api.py::test_dashboard_bundle_recovers_after_real_postgres_statement_failure`
  — a real `SELECT * FROM a11_table_that_must_not_exist` (genuine
  `ProgrammingError`, not a mocked exception) injected into one section, then
  asserts the immediately-following section **and** a later one both still
  return data. **Verified to fail with the fix removed:** reverting `safe_db`
  to run on the shared session reproduces exactly the finding's predicted
  failure mode — `psycopg2.errors.InFailedSqlTransaction: current transaction
  is aborted` cascades into `lifeAreas` and `weekAhead`, which have nothing to
  do with the section that actually broke.

  **Blind spots:**
  - Each optional section now opens and closes its own connection-pool
    checkout; sequential within one request (dict-literal field order), so no
    extra concurrent pool pressure, but more round-trip checkouts per request
    than before. Not benchmarked.
  - `_chart_persist.py` and other write paths with their own internal commits
    (A03's durable security operation, A05's webhook inbox) were deliberately
    left alone per step 8's explicit exception — this item only touched the
    read-mostly dashboard composition, not every service that still decides
    its own commit timing.
  - No test forces a genuinely **unavailable** connection (vs. a statement
    error) through this path to confirm the whole-request failure branch;
    `connection_invalidated` is exercised by inspection of the SQLAlchemy
    `DBAPIError` contract, not by a fault-injected dropped socket.

- [x] **A12 — birth-data consumer inventory (assessment only, as ruled).**
  **Owner decision 2026-10-08: INVESTIGATE CONSUMERS FIRST, DECIDE AFTER.** No
  model, column, migration, row, or key was touched — `vinaadi_dev` has real
  birth-profile rows and stayed out of scope entirely.
  [`docs/A12_BIRTH_DATA_CONSUMER_INVENTORY_2026-10-08.md`](A12_BIRTH_DATA_CONSUMER_INVENTORY_2026-10-08.md)
  found zero database-side filter/order/join/uniqueness consumers of
  `birth_profiles.birth_datetime_utc` in current source — every read is
  application-side. It also names what an isolated migration on that one
  column would miss: `charts.julian_day` is a plaintext, reversible encoding
  of the same instant; `family_members.date_of_birth_local` is a plaintext
  duplicate with a real SQL equality consumer
  (`family_vault_service.py:222`); mobile's A07 cache persists full
  `chart-full` responses (exact UTC instant, Julian day, natal positions) for
  up to 30 days; Jadhagam PDF exports print birth date/time/place outside any
  database control. Line citations spot-checked against current source and
  confirmed accurate. Four options laid out (derive post-decrypt, encrypt the
  column too, protect the full natal-input/derivative set, or retain plaintext
  with a narrower documented claim) with the recommendation that an isolated
  `birth_datetime_utc` migration not be approved as "birth-data
  confidentiality" without first ruling on `julian_day` and the family DOB
  duplicate. **No implementation decision was made; none was asked for.**

  **Owner ruling 2026-10-08:** narrow public copy now, then Option C including
  natal derivatives (`julian_day`, lagna/planet longitudes, dasha JDs) and the
  family DOB duplicate (Python comparison, no blind index); mobile cache and
  PDFs out of scope. Full table and two still-open questions (birth place /
  timezone, backup-key policy) in the A12 memo's "Owner ruling" section.

- [x] **A12a — public "encrypted at rest" claim narrowed.** Six surfaces, EN+TA:
  privacy page, beta page, family page, home trust strip, family-setup note,
  `packages/shared/src/data/legal.ts` (which claimed *all* data encrypted at
  rest). Wording now says only what is true (HTTPS, restricted access, never
  sold, deletable). **Gate:** `web/lib/encryption-claim-copy.test.ts` —
  baseline before the copy change: failed naming all 6 files with both the
  English and Tamil claim on each. **Blind spots:** source-text scan only;
  backend-served or runtime-assembled copy, mobile `app/`/`src/` screens (none
  found by hand on 2026-10-08) and the generated
  `docs/dashboard-i18n-catalog.json` are outside it. **Tamil:** six strings
  (four reworded, two deletions) reviewed via a user-supplied review on
  2026-10-08; its changes applied — privacy access sentence simplified, home
  "ஒருபோதும் விற்கப்படாது" for "never sold", family-setup "kept private" as
  "தனிப்பட்டவையாகவே வைக்கப்படுகின்றன" (was "stored safely"), and `legal.ts`
  gained the missing authorised-access sentence. Still open: family-setup Tamil
  says "not sold to anyone" where English says "never sold or shared".

- [x] **A12b — Option C: encrypt the natal-input and derivative set.** Migration
  `uu4e5f6a7b8c`: 14 columns to Fernet — `birth_profiles` UTC instant, birth
  place/timezone, current place/lat/lon/timezone; `charts.julian_day`,
  `lagna_longitude`; `chart_planets.absolute_longitude`, `degree_in_rasi`,
  `speed_deg_per_day`, `raw_payload`; `family_members.date_of_birth_local`. New
  `EncryptedDateTime` (refuses naive values) and `EncryptedJSON` types. Both
  duplicate checks now compare place/timezone/DOB decrypted in Python. Input
  schemas gained `max_length` 255/64 (12 fields) — the DB no longer caps them.
  Rotation script and restore drill list every new column.
  **Gate:** `tests/test_birth_data_at_rest.py`. Baseline on unfixed code:
  14 of 14 columns not `bytea`, and 11 of 11 synthetic birth facts (place,
  current place/tz, birth tz, UTC date, current lon, JD, lagna, Moon longitude
  and degree, family DOB) readable in `row_to_json` dumps.
  **Migration round trip on `vinaadi_test`:** seeded plaintext at `tt3d4e5f6a7b`
  (incl. NULLs and a Tamil JSON payload) → upgrade (all 14 `bytea`, ORM reads
  every value back) → downgrade (snapshot identical, byte for byte) → upgrade.
  The first round trip failed on the Tamil row — re-serialising JSON `\u`-escaped
  it — fixed by encrypting `raw_payload::text` verbatim.
  **Blind spots:** the dormant-table assertion (dasha/varga) has never been seen
  to fail, since no writer exists to add; coarse rasi/nakshatra keys still
  reveal the birth date (by ruling — copy stays narrowed); pre-migration
  backups hold plaintext (forward-only policy, `DATA_PROTECTION.md` §3).
  **Applied to `vinaadi_dev` 2026-10-08** (`ss2c3d4e5f6a` → `tt3d4e5f6a7b` →
  `uu4e5f6a7b8c`) after `backups/backup_pre_uu4e5f6a7b8c_20261008_1106.sql`;
  every row read back through the ORM (4 profiles, 5 charts, 46 planets,
  2 family DOBs). That backup is itself a plaintext copy — see
  `DATA_PROTECTION.md` §3.
  **Full backend suite** (first end-to-end run since Phase 1): 5943 passed,
  16 skipped, 1 failed — `test_duplicate_birth_profile_create_is_rejected`
  filtered on `BirthProfile.birth_place` in SQL to count rows; the 409 itself
  passed. Fixed to compare after decryption; no other test filters on an
  encrypted column (grep).

### Phase 3 — started 2026-10-08 (owner: "proceed with phase 3")

Order per the guide's §6: A16 first (documents other work is read against),
then A14, A15, A13.

- [x] **A16 — contradictory authoritative documentation.** The three cited
  contradictions in `docs/AGENT_INSTRUCTIONS.md` were still present and are
  fixed: repo root was `C:\Users\senth\OneDrive\…` (now `D:\sanstro`, matching
  CLAUDE.md and AGENTS.md); "No Shadbala" (it is computed —
  `app/calculations/shadbala.py` — but the daily score does not read it);
  "Kandaka Sani from Lagna Rasi" (doctrine A-1, 2026-08-19: Janma Rasi over
  4/7/10, labelled, overlapping Ardhashtama by design, one penalty). The §8
  feature recipe — new state in `dashboard-workspace.tsx` ending in
  `.catch(() => {})` — is replaced by shared wrapper → `useApiQuery` →
  `AsyncSection` with every state rendered. Also corrected, each checked
  against source: the calculation-version rule (a bump recomputes nothing —
  `app/constants/versions.py`); panchangam cache invalidation (bump
  `PANCHANGAM_CACHE_DATA_VERSION`, never `DELETE` by hand); the backend-URL
  default (A01's resolver; production refuses the loopback); config env names
  (all `JOTHIDAM_`); Ashtakavarga (the daily score reads BAV); UI primitives
  (Nova kit in `web/components/ui/`); i18n catalogs; `docs/FRONTEND.md` →
  `docs/archive/`; the test-run command now points at the test-DB variables.
  Copied inventories that had drifted — the 22-row router table, four TS
  response shapes, the model field table (dasha "start_date", long since JD),
  the dashboard prop list — are replaced with pointers to the code that owns
  them. §7 and §14 status sections are kept, labelled *historical,
  superseded*; §14's "90-min fixed slots" kalam line is struck through as
  contradicting §2. A "Which document wins" hierarchy now heads the file:
  CLAUDE.md for workspace, ratified doctrine + later dated rulings for
  astrology, MASTER_FIX_LIST for status. CLAUDE.md and AGENTS.md said the UX
  harness walks English top-level tabs only and never ran in Tamil; it has
  `overlays` and `ta` phases now, and both say what is still outside it.
  `docs/INDEX.md` misdescribed AGENTS.md and ranked the v1 specs above later
  rulings.

  **Gate:** `tests/test_authoritative_docs.py` over the six "Start Here" docs —
  relative links resolve, backticked repo paths exist, every "Repo root"
  statement agrees. **Baseline / fix-removed run** (doc edits stashed, test
  kept): 3 failed — CLAUDE.md's `scripts/ux-audit-core.mjs` (really under
  `web/`), AGENT_INSTRUCTIONS' `docs/FRONTEND.md`, and three conflicting repo
  roots. After: 13 passed.
  **Blind spots:** the gate proves paths exist, not that the sentence around
  them is true — every doctrine/behaviour correction above was checked by hand
  against source, and that is the only check on them. Paths inside fenced code
  blocks and paths without a known top-level prefix are not checked. Only the
  six docs are covered; the ~200 other Markdown files in `docs/` were not reviewed.
  Unverified and left as written: §1/§2 "Jupiter/Saturn from Lagna are
  secondary adjustments", the §15 tables. No architecture-decision records
  were added (guide step 5).

  **Found while verifying — FIXED in a follow-up commit (owner gave Claude
  ownership of next steps, 2026-10-08; applies the existing A-1 ruling, no
  new doctrine):** `transit_service.build_sani_cycle_response` computed its
  Lagna cross-check (`lagnaBasedCycle`) with `classify_kandaka_cycle`, which
  stamps `KANDAKA_SANI` — rendered "Kantaka Sani · from Janma Rasi"
  (`web/lib/family-flags.ts`) for a house counted from the **Lagna**. Worse,
  `family_vault_service` took its *only* Kandaka from that cross-check (member
  tags and the owner/member day cards), so family members were flagged by the
  reckoning A-1 replaced and never by the one it chose.
  Fix: the cross-check keeps its slot and limb wording but carries the
  reference-free `KANTAKA_SANI` (plain "Kantaka Sani", under the card's
  existing "Sani · from Lagna" heading); family tags and day-card types now
  come from `_sani_cycle_tags` — the Moon cycle, then Kandaka from the Janma
  Rasi over 4/7/10, layered as A-1 says. No response field, param or tag
  vocabulary changed (both tags already existed and are localised on web;
  mobile renders neither), so no client change was needed beyond a comment.
  **Who sees a difference:** a member with Saturn 4/7/10 from the Lagna but
  not the Moon loses the family Kandaka chip; one with Saturn 7/10 from the
  Moon gains it (4th was already flagged as Ardhashtama).
  **Gate:** `tests/test_kandaka_reference_a1.py` — scans 2000–2040 for the
  synthetic member to find a Lagna-only and a Moon-only year, then checks the
  real sani-cycle, daily-aggregate and today endpoints. Fix-removed controls:
  both service files stashed → fails on the label (`'KANDAKA_SANI' !=
  'KANDAKA_SANI'`); only the family file stashed → fails because a Moon-7/10
  member carried only `['NORMAL_DAY']`. After: passes; 440 passed across the 28
  related suites. **Blind spots:** the owner's own tile shares the helper but
  is not exercised; the Tamil/English chip copy was not re-reviewed.
- [~] **A14 — contract completeness. Steps 1–2 done (the nine schema gaps);
  steps 3–8 (generated transport contracts) not started.** The nine operations
  the field guard skipped now declare concrete `response_model`s that describe
  the payload each already sent: Chara, Yogini, Ashtottari, Kalachakra and
  conditional dashas (`app/schemas/secondary_dashas.py`), Shadbala
  (`app/schemas/shadbala.py`), remedy plan (`app/schemas/remedies.py`),
  Varshaphala (its model already existed; the route returned `model_dump` and
  never declared it), and Ask Vinaadi daily-status (`AskVinaadiDailyStatus`, a
  bare object — no envelope, as deployed clients read it). No route, param,
  verb or payload changed, so no web/mobile/shared edit was needed.
  **Gate:** `tests/test_a14_response_contracts.py`, two tests per operation.
  (1) A concrete 200 schema exists (and a concrete `data` for enveloped
  routes) — baseline 9 of 9 failed: eight "no 200 JSON response schema", and
  daily-status "not a concrete object" (`-> dict`). (2) The model is lossless:
  the route function's raw return, encoded as FastAPI encodes a model-less
  route, must equal the HTTP body — so a model that drops, adds or alters a
  value fails, and so does the next builder change that adds a field and
  forgets the model. Fix-removed control: deleting `note` from
  `ShadbalaData` failed it, naming the missing key. After: 18 passed. The
  field guard now runs all nine (288 passed / 9 skipped → 297 passed /
  0 skipped); none of the nine TS interfaces had drifted.
  Existing suites for the nine routes: 310 passed.
  **Blind spots:** the lossless check sees only branches the synthetic chart
  reaches — not a chart with no running Chara period, a monthly-quota user's
  daily status, or an unknown birth time. It compares JSON values, so `5` →
  `5.0` passes (identical to every JSON client). The field guard still checks
  names only, not value types or nullability; that is what generation (steps
  3–8) is for. Remedy `caution_ta/en` are nullable in the model but typed
  `string` in `RemedyItem` (tools.ts) — a nullability gap the guard cannot see.
  **A14 steps 3–6, first endpoint group (2026-10-08, second pass).**
  Toolchain check: no OpenAPI→TS generator was installed (only `zod` in web),
  and a new npm dependency means a `pnpm install` on the machine where
  installs have stalled before — so `scripts/generate_api_types.py` is a small
  dependency-free generator over `app.openapi()`. It raises on any schema
  shape it does not support rather than guessing. It writes
  `packages/shared/src/generated/api-types.ts` for the nine operations above.
  `packages/shared/src/api/__contracts__/generated-fit.ts` asks `tsc` whether
  each generated server `…Data` type is assignable to the hand-written type
  its wrapper casts to — value types and nullability, which the field guard
  cannot see. Its first run failed 6 of 9:
  - **Real client drift, fixed in `packages/shared`:** `CharaDashaData.lagnaRasi`
    was `string`, but the route has always sent a number (no consumer read it).
    `RemedyItem.caution_ta/en` were `string`; the server sends `null` when the
    gemstone policy has no caution (web already coalesced it; mobile does not
    render it). Web and mobile `tsc` stay clean after both changes.
  - **Server models looser than the payload, tightened:** `level` →
    `Literal["maha","antar"]`, `paksha` → `Literal["SHUKLA","KRISHNA"]`, and
    `charKarakas` → a fixed eight-key `CharaKarakas` model (the route always
    passes all eight candidate grahas; the calculation refuses the Rahu-less
    shape).
  **Gates:** `tsc` on the fit file (runs in mobile CI's shared type-check) —
  fix-removed control: restoring `caution_ta: string` fails it at the remedy
  line. `tests/test_generated_api_types.py` regenerates in-process and fails if
  the committed file is stale. The lossless test above re-runs against the
  tightened models.
  **Blind spots:** nine operations only; the fit is one-directional (a field
  the wrapper declares but the server omits is still only the field guard's
  check); generated types are not yet consumed by any wrapper — they verify,
  they do not replace. **Not started:** wrapper migration onto generated types
  (step 7) and runtime validation of consequential inputs (step 8).
  **A14 step 7, first group (2026-10-08, third pass): the nine wrappers now
  export aliases of the generated types.** A `tsc` probe compared all 20
  exported hand-written types with their generated twins: 14 identical, 6
  where the server type was narrower — Varshaphala (the client omitted
  `tajakaPlanets`/`itthasalaPairs`/`isarafaPairs`), Chara (`charKarakas`
  `| null`, never sent null), Ashtottari (`applicability?`, always sent),
  daily-status (`chipsRemaining | null`; both service branches clamp at 0, so
  the server model is right), remedy plan and item. All 20 became
  `export type X = Server.Y`, exported names unchanged; shared, web and
  mobile `tsc` 0 errors — no consumer or fixture relied on the looser shapes.
  Type aliases are erased at runtime, so no JS changed.
  `generated-fit.ts` was one-directional (server assignable to client), which
  aliasing makes trivially true; it now requires mutual assignability for all
  20 pairs, so a re-hand-written type that drifts fails. Fix-removed control:
  HEAD's hand-written `charaDasha.ts` restored → fails at the `CharaDashaData`
  line (the old check passed it).
  **The field guard silently lost seven of the nine.**
  `tests/test_api_wrapper_field_contract.py` parsed only `export interface`,
  so an aliased cast dropped out (84 → 77 casts, 3611 → 3472 fields) under
  floors (65 / 2400) that did not notice — and Chara and Varshaphala fell back
  to stale same-named interfaces in `src/types/index.ts`, which the wrappers
  no longer use. It now parses the generated file under a `Server.` prefix
  (nested references qualified) and resolves `export type X = Server.Y`
  aliases: 346 interfaces, 84 casts, 3701 fields. Floors raised to 330 / 82 /
  3600, and `test_aliased_wrapper_types_stay_in_the_guard` names any aliased
  cast that leaves. Control (alias resolution disabled): 4 failed, naming the
  seven missing casts; the Varshaphala cast, resolved to the stale
  `src/types` duplicate, also failed against the route.
  **Found, not fixed:** `src/types/index.ts` holds a parallel, hand-written
  copy of two of these server shapes — `CharaDashaData` (+ `CharaKarakaMap`,
  still `| null`) and `VarshaphalaData` (+ `VarshaphalaAreaOutlook`; no
  `chartId`) — and they are live: web's grandfathered direct `apiFetchJson`
  calls cast to them (`dashboard-family-charts-hybrid.tsx:909`,
  `dashboard-workspace.tsx:588`). Neither the aliases nor the field guard
  (which reads only shared-wrapper casts) covers that path. Aliasing those
  two to the generated types is the obvious follow-up; not done here. (The
  camelCase `RemedyPlanItem` there is different: a web view model that
  `dashboard-workspace.tsx:540` maps the snake_case rows into — not a copy.)
  **Fixed 2026-10-08 (fifth pass).** Re-verified: both direct fetches still
  at the cited lines. The copies were wider than the entry said: the
  nested `CharaDashaPeriod`, `TajakaPlanetPosition` and `TajakaAspect` are
  copies too, re-exported by `web/lib/types.ts`, and the hand-written
  `TajakaPlanetPosition` was **wrong**: `{planet, rasi, rasiName, house,
  longitude}` where the route sends `{planet, rasi, degreeInRasi}`. Nothing
  read those fields (web renders only the itthasala/isarafa pairs), so it was
  latent. All seven are now `export type X = Server.Y` in `src/types/index.ts`;
  `RemedyPlanItem` untouched. **Gate:** seven `Types.*` lines in
  `generated-fit.ts`, mutual assignability with the generated type. Baseline
  (lines added, copies unchanged): 3 of 7 failed — `CharaDashaData`
  (`charKarakas | null`), `VarshaphalaData` (no `chartId`, wrong planet shape),
  `TajakaPlanetPosition`; that run is also the fix-removed control. After:
  shared, web and mobile `tsc` 0 errors; field guard 95 passed; mobile
  `contracts.test.ts` 21 passed. **Blind spots:** compile-time only — the two
  direct fetches still cast unvalidated JSON; other hand-written copies in
  `src/types` that no wrapper aliases are not detected (this entry found
  three by name, not by search).
  **Blind spots:** nine operations only; the guard follows only the exact
  `export type X = Server.Y;` form.
  **Next group tried and stopped — chart numerology GETs (2026-10-08).** The
  six `/charts/{id}/numerology/*` GETs are the most coherent next group (one
  wrapper, concrete schemas; the generator rendered all of them, +367 lines).
  But a `tsc` probe of the 9 same-named types found 1 identical, 7 where the
  *server* is looser than the client, and `LuckyDatesResponse` incompatible —
  so the old one-directional fit would have failed on 8 of 9. Two classes,
  neither an alias job; the generator change was reverted, nothing half-done
  is committed:
  1. **`X | null | undefined` vs `X | null`** (`reading.compound`, `who`,
     `label`, `targetRasiEn`, …): the generator marks a defaulted Pydantic
     field optional because OpenAPI's `required` omits fields with defaults —
     yet FastAPI always serializes them. Same root as the envelope's
     `success?`. Fix belongs in the generator (output-mode schemas, or
     treating defaulted response fields as present), decided once for all
     groups.
  2. **`string` vs literal unions** (`epoch` → `PersonalYearEpoch`,
     `functionalNature` → `FunctionalNature`, …): closing it means
     `Literal[...]` on the Pydantic models, which changes server-side
     validation — every producer must be checked first, or an unexpected
     value becomes a 500 instead of a looser client type.
  Do class 1 first: it is mechanical and shrinks class 2 to the real
  value-set questions.
  **Class 1 fixed — generator precision (2026-10-08, fourth pass).**
  Re-verified the premise first: FastAPI 0.136.1 builds response schemas in
  Pydantic 2.13 serialization mode, whose `field_is_required` leaves a
  defaulted field out of `required` unless `json_schema_serialization_defaults_required`
  is set (it is not, anywhere). Nothing in `app/` drops fields on the way out:
  no route sets `response_model_exclude*`/`include`, and no model uses
  `exclude_if`, `exclude=True`, or a model/field serializer. So every
  property of a serialization schema is written on every response.
  The generator now takes each listed route's `response_model` and builds its
  schema with Pydantic's public `models_json_schema(..., "serialization")`
  and a `GenerateJsonSchema` subclass that marks model/dataclass fields
  present (TypedDict `NotRequired` keys keep Pydantic's answer, because they
  can really be absent). It **refuses** a route with any field-dropping
  `response_model_*` option rather than emitting a false "present". A probe
  over the nine operations plus the six numerology GETs showed identical
  component names, root refs and property sets to `app.openapi()`; only
  `required` grew (the full numerology list, e.g. `BabyNameCandidateOut` +17
  fields, `who`, `label`, `compound`). For the nine committed operations the
  regenerated file changed one line: `VarshaphalaResponse.success?` →
  `success`.
  **Gate:** `tests/test_generated_api_types.py` gained a probe app whose
  defaulted fields (`None`, `default_factory=list`, `True`, nested model,
  TypedDict) are fetched over HTTP; every key the body carries must be
  non-optional in the rendered TS, and the TypedDict's absent `NotRequired`
  key must stay `?`. Baseline (throwaway test, current generator over
  `probe_app.openapi()`): failed, 6 of 6 sent keys generated optional
  (`inner listDefault loose note nullableDefault plainDefault`). Plus 5
  parametrised refusals, one per dropping option. Fix-removed control
  (override and refusal disabled): 7 of 8 failed — staleness, the probe, and
  all 5 refusals. After: 8 passed; field guard 87 passed;
  `test_a14_response_contracts.py` passed; shared, web and mobile `tsc`
  0 errors.
  **Blind spots:** a handler returning a `Response`/`JSONResponse` directly
  bypasses the model, so the generated "present" would be unchecked for it
  (none of the listed routes do); Pydantic's `exclude_if` is honoured but not
  exercised (nothing uses it); the generated file no longer reads
  `app.openapi()`, so a FastAPI-only schema transform (none today) would not
  reach it.
  **Numerology group, class 2 — inventoried and STOPPED (2026-10-08,
  owner's "stop and report if this grows large").** With class 1 fixed the
  six GETs were added to `OPERATIONS` and a type-level deep diff run over the
  9 same-named pairs: `NallaNeramWindow` is identical; the other 8 fail
  server → client **only** on `str` vs a client literal union; the 3
  client → server failures are client `?:`/`undefined` (alias would remove
  them). Generator change reverted again; nothing committed but this entry.
  The 17 `str` fields, by producer:
  - **Enum `.value`, value set equal to the client union** (verified by
    importing each enum): `NumberReadingOut.compoundTone` (`CompoundTone`),
    `NodeBasisOut.kind`, `AlignmentBasisOut.strengthRule`,
    `NumberAlignmentOut.functionalNature`/`.verdict`, `VerdictBandOut.verdict`,
    `PersonalYearOut`/`LuckyDatesResponse`/`MarriageDatesResponse.epoch`,
    `BabyNamesResponse.mode`, `BabyNameCandidateOut.relation`
    (`AksharaRelation`), `BabyNamesResponse.emptyReasonCode`,
    `MuhurtaFactor.verdict` (`muhurta_engine.Verdict`).
  - **Enum with a value the client union lacks — a real value-set question:**
    `BabyNameCandidateOut.confidence` (`MatchConfidence.NO_MATCH = "no_match"`,
    assigned at `numerology_naming.py:311/564/658`) and
    `BabyNamesResponse.relaxationsApplied` (`Relaxation.NONE = "none"`).
    Either the value is filtered before the response (then the Literal can
    omit it) or the client union is incomplete (then the client is wrong).
    Not yet traced.
  - **Not an enum:** `MuhurthamNaalReading`/`MuhurthamNaalMatchItem.taraQuality`
    (`TARA_QUALITY[tara]` table, `muhurtham_naal_service.py:460`) and
    `BabyNameCandidateOut.gender` (naming data rows).
  Saved name sessions are safe for a Literal: they store only the name and
  are re-scored through the same converters (`numerology_name_session_service`).
  **Why stopped:** `app/schemas/muhurta.py` and `muhurtham_naal.py` also
  serve the muhurta and muhurtham-naal routes, so tightening them changes
  validation outside this group; and two value sets above are unresolved.
  **Proposed next step:** a `Literal` per field with a no_db test pinning
  each `get_args(Literal)` to its enum's values (the guard against a new
  member becoming a 500), the two open value sets resolved first, then
  alias the 9 types and extend `generated-fit.ts`.
  **The two value sets, traced 2026-10-08 (owner handed over the decision) —
  one was a live web crash.** `Relaxation.NONE`: never emitted — `applied`
  only ever receives named rungs, and a sweep of all 108 paadhams × 4 modes
  over the real corpus saw sibling/rasi/any-akshara/single-script, never
  `none`; no code references it. `MatchConfidence.NO_MATCH`: the corpus sweep
  never produces it (every corpus name opens some paadham), but a **parent's
  own shortlist name** is scored by `evaluate_against_target`, which returns
  it whenever the opening letter opens no paadham — probed: "Zara", "Xavier",
  "Quinn", "Fiona" → `no_match` / `no_paadham`. The client union lacked it,
  and both baby-name surfaces (dashboard tool, public `/tools/baby-name-finder`)
  render `pick(CONFIDENCE_CHIP[c.confidence])` → `pick(undefined)` →
  `TypeError`. Web already had copy for the *relation* `no_paadham`, not the
  *confidence*. **Fixed:** `"no_match"` added to the shared union (doc
  comment says when it is sent) and to `CONFIDENCE_LABEL`/`CHIP`/`TONE`
  (neutral tone; Tamil reuses the existing "not one of the 108 paadham
  letters" wording — **unreviewed by a native reader**). **Gate:**
  `web/lib/baby-name-copy.test.ts` renders chip/label/tone in both languages
  for every value the server enum can send. Baseline (copy unchanged): 1 of 5
  failed, `TypeError: Cannot read properties of undefined (reading 'en')`
  for `no_match`. After: 5 passed; shared, web, mobile `tsc` 0 errors; web
  lint clean. **Blind spots:** the test's list of server values is
  hand-copied until the Literal/fit step below ties it to the server; the
  crash was found by reading code and probing the engine, not reproduced in
  a browser.
  **Numerology group closed (2026-10-08).** Every producer of the 17 fields
  re-traced before any `Literal`: all are engine-enum `.value`s or values
  already stored as those strings (`ChartBabyNames` holds `.value`s), except
  `taraQuality` (`TARA_QUALITY`, three values) and candidate `gender` (corpus:
  f 115 / m 91 / n 9; user names carry none); the three hand-written
  `MuhurtaFactor(verdict="BONUS"|"NEUTRAL"|"PENALTY")` in `muhurta_service`
  are inside the set (and mypy now checks them); no route takes these models
  as input; nothing rebuilds them from stored JSON (name sessions store the
  name and re-score). `Relaxation.NONE` deleted from the enum (dead).
  Changes: `Literal` vocabularies in `app/schemas/numerology.py` (12 aliases,
  15 fields), `TaraQuality` in `muhurtham_naal.py` (2 fields), the five-state
  verdict on `MuhurtaFactor`. The six GETs are in the generator. The client
  numerology types stay hand-written (their field notes carry doctrine —
  D3, D6, the review gate — that an alias would drop); instead
  `generated-fit.ts` requires mutual assignability for the nine response
  types plus `NumberReading`, `NumberAlignment`, `BabyNameCandidate` and the
  shared `MuhurtaSlot`/`MuhurtaFactor`. Getting there tightened the client to
  what the server always sends: 21 `?:` removed (`MuhurtaSlot` ×8 — e.g.
  `almanacMuhurtham`, whose comment said "absent" for non-weddings; it is
  `null` — `MuhurtaFactor` ×4, `MuhurtaCitation` ×5, `pirai`, marriage-dates
  `partnerChartId`/`partnerFavourableNumbers`/`subjectWho`/`partner`/`readings`),
  and **`MuhurthamNaalContext.dailyLocation` added — the server sent it and the
  client type did not have it.** Two web test fixtures that built shapes the
  server never sends now carry the fields. No runtime code changed on any
  client.
  **Gates:** `tests/test_numerology_wire_literals.py` (18) pins each Literal to
  its producing enum / the Tara table / the corpus genders. Baseline: 18 of 18
  failed (all `str`). Control (`"no_match"` dropped from the server Literal):
  the pin test fails 1, and after regeneration the fit fails on
  `BabyNamesResponse` and `BabyNameCandidate` — the two gates chain, so the
  web copy test's hand-written value list is now tied to the engine.
  **Found while gating:** the type-level deep diff used in the inventory cannot
  see a field the server sends and the client lacks (an object with extra
  fields is assignable); `Same<>` caught `dailyLocation` that the probe had
  passed. After: backend pin 18 passed; generator + field guard + A14
  contracts and every numerology/muhurta test file (63 files): 1831 passed;
  shared/web/mobile `tsc` 0; web vitest 141 files / 1456; mobile Jest 175;
  web lint, ruff, mypy clean.
  **Blind spots:** a future producer that builds one of these models from a
  string not taken from the pinned source; the fit is compile-time — nothing
  validates the bytes a client receives; other muhurta/numerology routes (the
  POSTs) are still outside the generator.
  **A14 step 8 — runtime validation, first two targets (2026-10-08).** The
  guide names categories, not endpoints ("unstable provider responses,
  persisted payloads, consequential inputs"; §4.7 adds "parse and validate
  provider output, test malformed/partial responses") — so the targets were
  chosen, not given: the two places where an unchecked shape does the most
  damage. Not every fetch is wrapped.
  - **Mobile credentials.** `rotateTokens` cast the refresh JSON and wrote it
    to SecureStore; login and register wrote server tokens the same way. The
    two keys are written separately, so a 200 with one bad half stores the
    good half beside a stale other half — for refresh, a refresh token the
    server has just rotated (revoked), and presenting it later is what A03's
    replay detection answers by revoking every session. Now `isTokenPair`
    (`mobile/src/lib/tokenPair.ts`, pure) is checked in `rotateTokens` and in
    the sink, `setTokens`, before either key is written; a malformed refresh
    is a failed refresh (session ends cleanly), a malformed login an ordinary
    sign-in error (both screens already catch). Baselines: refresh suite 4 of
    4 new cases failed (`setTokens` called with the bad body); secureStore 3
    of 3 failed (keys written). After: 18 passed; full mobile Jest 175/175;
    tsc clean; lint still 14 warnings. **Blind spots:** mocked SecureStore and
    fetch — no device keychain; `expiresIn` is not checked (nothing reads it).
  - **AI provider output.** `_call_claude` returned `json.loads(raw)` as-is
    and `answer_question` read it with `.get`, list concatenation and
    `BiText(...)`, so a wrong-shaped body — a JSON list or number, a nested
    object where answer text belongs, a string where the signal list belongs —
    was an unhandled exception: an opaque 500 (the API layer's except clause
    did refund the reserved chip). `_parse_provider_payload` now checks it:
    not JSON or a bare JSON string → that text is the answer (the old
    fallback); not an object, or `ta`/`en` present but not text → a 502
    "unusable answer", chip refunded; `signals_used` not a list → no provider
    signals, non-string entries dropped. Missing `ta`/`en` and unknown
    confidence/verdict keep their existing defaults. Baseline: 6 of 6 new
    tests failed with unhandled `AttributeError`s. After: Ask Vinaadi files 23
    passed; ruff and mypy clean. **Blind spots:** mocked Anthropic client; a
    model reply wrapped in a ```json fence still falls to the plain-text path
    and shows the fence — unchanged, and not new.
- [x] **A15 — CI coverage (config side; not yet observed on a runner).**
  Re-verified: mobile CI type-checked and linted only, its path filter was
  `mobile/**` + `packages/shared/**`, and mobile lint covered `app/` only.
  Changes: mobile CI runs Jest (`pnpm -F mobile test --ci`); triggers on
  `packages/**`, root `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`,
  `.npmrc` and the workflow file; mobile lint covers `src/` with
  `--max-warnings 14` (the measured baseline: 0 errors, 3 warnings in `app/`,
  11 in `src/` — require-imports ×6, unused-vars ×2, exhaustive-deps ×2,
  array-type ×1); every job in both workflows now has `timeout-minutes`, set at
  about twice the durations measured on this branch's runs of 2026-10-02/07
  (pytest 13–14 min → 30; web 2–3 → 20; e2e never ran → 30, labelled a guess).
  The mobile job keeps its display name "Type-check + lint" so a check made
  required under that name is not orphaned.
  **Step 7 (cold screen-test timeout):** did not reproduce. 4 of 4 local runs
  green, 167/167, 13–21 s, including `--maxWorkers=2`; slowest test 1.2 s
  against Jest's 5 s default; no open-handle warning. So no `--forceExit` and
  no raised timeout. Step 5's full-stack smoke already exists (A01's
  `compose-proxy-smoke` with its negative control).
  **Gate:** `tests/test_ci_workflow_coverage.py` reads the workflow files.
  Fix removed (workflows + package.json stashed): 6 of 7 failed, naming the 8
  unbounded jobs, the missing Jest step, the 5 ignored root files per event,
  and the app-only lint script. After: 7 passed. Lint ratchet control: a
  one-warning probe in `src/` passed the old script and failed the new one
  ("too many warnings (maximum: 14)").
  **Blind spots / not done:**
  - **Nothing has run on GitHub.** The branch could not be pushed from this
    session, so the Jest step and the new triggers are unobserved on a runner.
  - **`main` has no branch protection** (`gh api …/branches/main/protection` →
    404, 2026-10-08). No check is required, so a red run blocks nothing — the
    "required check" half of step 4 has nothing to attach to. Turning it on
    is an owner action in GitHub settings.
  - ~~Web coverage thresholds (20% lines / 15% branches) are unchanged.~~
    **Raised 2026-10-08 from a measurement:** the full web suite (140 files,
    1451 tests, `vitest run --coverage`) measured statements/lines 54.7%,
    branches 76.5%, functions 56.3%. Thresholds now 50/50/72/50 (lines,
    functions, branches, statements) — ~4-6 points under, room for churn but
    not for losing a test batch; the old 20/15 would have passed a two-thirds
    drop. Control: `lines: 60` → "Coverage for lines (54.7%) does not meet
    global threshold (60%)", exit 1. **Blind spot:** one local measurement;
    the include set is `lib/hooks/components` only — `app/**` pages are
    outside it. The e2e job's 30-minute timeout is still a guess: e2e has
    never run (no base URL configured).
  - The gate proves the config says these things, not that a job passes.
  - The two most recent CI runs on origin (2026-10-06/07) failed on Web and
    Backend lint; both predate commits not yet pushed, and were not re-run.
- [~] **A13 — module boundaries. Step 7 (dependency-direction gate) and all
  three cited inversions done (the panchangam cache on 2026-10-08, below);
  every large extraction (steps 1–6) not started.**
  The audit's three dependency findings, re-verified then handled:
  - `app/models/*` (5 files) imported their column types from
    `app.services.encryption` → the module moved, content unchanged
    (`git mv`), to `app/db/encrypted_types.py`, the persistence layer. All
    in-repo importers updated, including historical migration
    `dd3e4f5a6b7c` (import path only) and `test_encryption_rotation.py`.
  - `app/calculations/propensities.py` imported `AstroFactor`/`BiText` from
    `app.services.life_area_prediction_models` → that module (four dataclasses
    plus a helper depending only on `calculations`) moved to
    `app/calculations/life_area_prediction_models.py`; 10 importers updated.
  - `app/calculations/panchangam.py` cache SQL — left as an explicit
    baseline entry in the first pass; **moved 2026-10-08**, see the entry
    after the gate below.
  **Gate:** `tests/test_dependency_direction.py` — `ast`-parsed imports
  (top-level, in-function and `TYPE_CHECKING` alike) against five rules:
  calculations ↛ models/services/api/db/sqlalchemy/fastapi; models ↛
  services/api; db ↛ services/api/models; core ↛ services/api; services ↛
  api. Baseline is the four panchangam imports, self-cleaning (a stale entry
  fails). Fix removed (moves stashed): failed naming exactly the six cited
  imports (5 models + propensities). After: 3 passed. **Full backend suite
  after the moves: 5994 passed, 7 skipped, 0 failed** (56 min, local).
  **Blind spots:** `importlib`/`__import__` by name; coupling passed in at
  runtime (a `Session` argument to a calculation is DB coupling the import
  graph cannot see — panchangam would still be coupled after an import-only
  fix); `core → models` is allowed by design (auth needs `User`); schemas →
  services (numerology, dashboard bundle) is the API boundary depending on
  application, which is the permitted direction, so it is not ruled.
  **Panchangam cache moved out of the calculation (2026-10-08).**
  Re-verified first: the cache was `_load_cached_snapshot`,
  `_load_cached_snapshots_in_range`, `purge_expired_panchangam_cache`,
  `_store_cached_snapshot` and three session-taking entry points
  (`calculate_daily_panchangam`, `…_range`, `with_daylight_lagna_schedule`),
  with 13 app modules, 1 script and 17 test files importing them. **The
  handoff's "tests reach private cache helpers 33 times in test_panchangam.py"
  was wrong:** those 33 are `calculate_daily_panchangam(` calls with no
  session (pure computation); no test referenced a cache helper. Every
  panchangam monkeypatch targets either a consumer-module name
  (`pdf_export_service`/`daily_push_cron`/`muhurtham_naal_service`
  `.calculate_daily_panchangam[_range]`) or a compute dependency inside
  `app.calculations.panchangam` (`calculate_rise_transit_jd`,
  `calculate_sidereal_planets`) — both keep intercepting if consumers keep
  the same imported name and the computation stays put.
  Now: `app/calculations/panchangam.py` is pure — `compute_daily_panchangam`,
  `compute_daily_panchangam_range`, `attach_daylight_lagna_schedule`,
  snapshot (de)serialization and `PANCHANGAM_CACHE_DATA_VERSION` (it versions
  the serialized shape, so it stays with the serializer). The cache helpers,
  `PANCHANGAM_CACHE_TTL_HOURS` and the three entry points — same names, same
  signatures, same queries, log lines and fallbacks — are in
  `app/services/panchangam_cache.py`. Consumers changed only the import path
  (script-driven, then `ruff --fix --select I`). `_date_range` became public
  `date_range` (no other user). AGENT_INSTRUCTIONS' cache line names the new
  module.
  **Gate:** all four BASELINE entries deleted (the list is now empty), and a
  new check refuses any `session`/`db` parameter in `app/calculations` — the
  runtime coupling the import graph could not see. Baseline before the move:
  2 failed, naming the 4 imports and 7 session-taking functions. After: 4
  passed. **Cache-path control:** with the service's two cache reads forced
  to miss, `test_daily_panchangam_endpoint_reuses_cached_row` and
  `test_monthly_panchangam_uses_cached_dominant_values` both fail, the
  traceback running service → `compute_daily_panchangam` → the patched
  `calculate_rise_transit_jd` — so the patches intercept through the move.
  Targeted suites (every file importing or patching panchangam, perf budget
  included): 375 passed, 6 skipped. ruff, mypy (368 files) clean.
  **Full backend suite after the move: 6009 passed, 7 skipped, 0 failed**
  (64 min, local, 2026-10-08).
  **Before/after equivalence:** HEAD's `panchangam.py` loaded from git as a
  separate module, then old `calculate_daily_panchangam(session=None)` vs new
  `compute_daily_panchangam`, serialized snapshot compared key by key — 4
  synthetic places (Chennai, Madurai, London, Sydney) × 13 dates through
  2026, the sparse-`only` range path and the lagna-schedule path: 56
  snapshots, 0 differ. Control: shifting one date by a day → 4 differ.
  **Blind spots:** the session check knows two parameter names; a session
  under another name, or reached through another object, passes it. The
  equivalence run covers the computation; the cache's own SQL was moved
  verbatim and is covered by the cache-path tests, not by that comparison.
  **Steps 1–6, first unit — `build_daily_guidance_response` (2026-10-08).**
  Golden first, committed on its own (`tests/test_daily_guidance_golden.py`):
  four synthetic profiles × four 2026 dates, built with no database
  (`_chart_response_from_profile` + `session=None`). Normalised because CI's
  pyswisseph and local swisseph-ffi have already disagreed at a rounding
  edge: floats to 2 places, clock times and ISO datetimes masked, everything
  else exact. Control: one score weight 0.28 → 0.27 fails 11 of 16.
  Then three pure stages moved, verbatim, into `app/services/_dg_scoring.py`
  (already the home of `weighted_moon_score`/`weighted_panchangam_score`):
  `transit_component` (gochara + Ashtakavarga + Vedha + the Moon-Jupiter /
  Lagna-Saturn adjustments; returns the score and the house-from-Moon map the
  palan reads), `personal_safety_component` (the Sade Sati murthi grade needs
  the ephemeris, so the builder computes it — only when the cycle calls for
  it, as before — and passes it in), and `composite_day_score` (weights,
  label with the Chandrashtama demotion, confidence band and reason). The
  duplicate `is_combust` call is now one. The builder calls them in the same
  order: 885 → 808 lines. No doctrine changed.
  **Proof:** golden unchanged (17 passed); HEAD's builder loaded from git and
  run beside the new one on the same 16 cases, compared exactly (raw JSON,
  `generatedAt` removed): 0 differ — control (one profile's dates shifted):
  4 differ. New `tests/test_dg_stages.py`: 20 direct tests of the stages'
  rules with plain values (each caution's cost, murthi grading, Kandaka
  scored once under A-1, component rounding, the Chandrashtama demotion, the
  exact 100 maximum, the three confidence bands). The 18 test files touching
  daily guidance: 357 passed. ruff and mypy clean. Six imports the builder no
  longer used were removed after checking no module or test reaches them
  through `daily_guidance_service` (by import or by patch string).
  **Blind spots:** the golden masks clock times and covers only
  `session=None` and `ta-en`; the exact comparison covers the same 16 cases.
  The fixture is 594 KB (mostly Tamil copy), the largest test file in the
  repo. **Not started:** the rest of the builder (dasha strength,
  briefing, palan assembly), `get_life_areas` (689), `assess_marriage_prediction`
  (648), `dashboard-workspace.tsx` (2,415).
  **Dasha-strength stage extracted (2026-10-08, second unit pass).** Patch
  targets re-checked first, by import and by string path: tests patch only
  `build_daily_guidance_response`, `get_daily_guidance` and
  `_enrich_action_with_goal_track` on this module, nothing inside the stage
  (`test_service_priority_m11`'s `calculate_vimshottari_timeline` patch is on
  `dasha_transition_service`). `dasha_component` in `_dg_scoring.py` takes
  the chart's planets, the three running lords, lagna, natal Moon rasi, the
  day's transit bodies, `natal_rasi_by_graha`, `is_daytime` and age, and
  returns the score plus the natal-strength map the pratyantar narrative
  reads. The vimshottari timeline stays in the builder (its lords and end date
  are read later), and so does `resolve_daytime_birth_for_profile` (a
  sunrise computation), passed in like the murthi grade. The three copies of
  the "strength_score, else compute from placement" block are one inner
  function; order of insertion into the strength map is unchanged
  (maha, antar, pratyantar). The stage's `is_daytime` is `bool | None`, as
  the resolver returns for an unknown birth time (mypy caught the first
  annotation). Six imports the builder no longer used were removed after
  checking nothing reaches them through this module. 808 → 726 lines. No
  doctrine changed.
  **Proof:** golden unchanged (17 passed; fixture file untouched). Exact
  same-process comparison, HEAD's module from `git show` beside the new one,
  raw JSON minus `generatedAt`: 7 synthetic profiles (the golden four plus
  Coimbatore, Sydney, Trichy) × 14 dates (2026–2040) × {strength as built,
  `strength_score` zeroed so the placement path runs} × {briefing flag off,
  on}, plus 3 profiles with the birth time nulled on the snapshot
  (`is_daytime=None`): **560 cases, 0 differ**; 21 maha/antar pairs seen, 12
  with a lord that has no scored transit (Sun/Mercury/Venus), 5 maha = antar.
  Controls: one profile's dates shifted → 40 differ; the stage's maha weight
  0.45 → 0.44 → differences reported. New `TestDasha` in
  `tests/test_dg_stages.py` (7 tests: generic score for an absent lord, own
  strength kept without a transit, transit house from the natal Moon,
  strength computed from placement when absent, pratyantar reported but not
  scored, 10–95 clamp at both ends). Controls: weight 0.44 → 5 of 7 fail;
  pratyantar not recorded → 1 fails. The 21 test files that touch daily
  guidance: 434 passed. ruff and mypy (368 files) clean.
  **Blind spots:** maha lords seen were 6 of 9 (no Mercury, Saturn or Ketu
  maha in the matrix — the stage is lord-agnostic, but that is argued, not
  observed); the
  "lord absent from the chart" branch is unreachable from a real chart and is
  covered only by the direct test.
  **Briefing and palan assembly extracted (2026-10-08, third unit pass).**
  Two module-level functions in `daily_guidance_service.py` (not a new
  module: both are response composition, not scoring, and keeping them here
  leaves every name the builder resolves where it was): `_daily_briefing`
  (the Track A synthesis, inputs explicit; the `daily_briefing_synth` flag
  check stays in the builder) and `_personal_palan_response` (the
  `build_personal_palan` result → `PersonalPalan` schema). The palan's
  `build_personal_palan` call and both `run_safety_pass` calls stay in the
  builder, in the same order. 726 → 632 lines (885 at the start of A13). mypy
  caught two wrong first annotations (`moon_score` is `int`;
  `personal_caution` is the narrative `BiText`), both fixed before commit.
  **Proof:** golden 17 passed, unchanged; exact same-process comparison against
  `a3afc72`: **560 cases, 0 differ**. Controls: dates shifted → 40 differ;
  palan adapter mutated (`dashaAreas` emptied) → 560 differ, all in
  `personalPalan`; briefing mutated (`ta`/`en` swapped) → exactly the 280
  flag-on cases differ, all in `briefing`. (A first briefing mutation, the
  synthesizer's `seed`, changed no visible output — the seed picks among
  variants and those cases did not move; it is not a usable probe.)
  **Blind spots:** no direct tests for the two adapters — they are field
  mapping, covered by the golden and the comparison; nested
  `_build_tithi_card` / `_build_activity_board` are still inside the builder.
  **Second unit, golden first — `get_life_areas` (2026-10-08).**
  `tests/test_life_areas_golden.py`, committed before any extraction: the
  daily golden's four synthetic profiles × four 2026 dates and its
  normalisation (imported, not copied). `get_life_areas` touches the database
  in five places; each is replaced at the service module's own names — owner
  check passes, `load_persisted_chart_response` returns the synthetic chart, no
  active goals, a session whose life-events query is empty, and
  `log_prediction` records its calls, which are **part of the golden** (which
  areas get logged as HIGH-confidence claims is behaviour). Flags are pinned to
  their shipped defaults so an override elsewhere cannot move it. Reach,
  asserted by `test_golden_matrix_reaches_the_branches_that_matter`: 192 areas
  with all three confidences (LOW 139 / MEDIUM 44 / HIGH 9), 4 with
  Chandrashtama applied, 4 readings, 9 logged claims across 5 of 16 cases.
  Control: the chain blend 0.65/0.35 → 0.64/0.36 fails 16 of 16. After: 17
  passed. **Blind spots:** as the daily golden (masked clock times, float
  drift < 0.005), plus: no active goals, no life events (so
  `chartValidationStatus` is always null and `validate_chart_against_events`
  never runs), default flags only, and the real owner check and persistence
  are stubbed. The fixture is 1.39 MB — the largest test file, over twice the
  daily golden.
  **First `get_life_areas` stage — per-area scoring (2026-10-08).** Patch
  targets re-checked: `test_life_areas_service.py` patches `svc._score_area`,
  which the moved code still looks up as a module global, so it keeps
  intercepting; `test_daily_snapshot_sections` patches `get_life_areas` on its
  own module. `_score_life_area` (module-level, beside `get_life_areas`)
  takes the area plus 18 explicit chart/transit/request inputs and returns an
  `_AreaScore`: `_score_area`, the karaka chain blended 65/35, the promise-gate
  reading (classified from the score **before** the blend — now pinned by a
  test), the area remedy, the maha/antar area scores, the karaka's transit
  house and driver line, and the three-signal confidence tier. Moved verbatim
  by script (inputs renamed, nothing reordered); the chain dict is handed back
  as the same object because the loop prepends BAV-derived factors to it.
  Narration, phase gating, the married framing, maraka guard, prediction log
  and projections stay in the loop. 689 → 620 lines.
  **Proof:** life-areas golden 17 passed, unchanged. Exact same-process
  comparison, HEAD's module from `git show` beside the new one under the
  golden's stubs, raw JSON minus `generatedAt` plus every `log_prediction`
  call: 8 synthetic profiles (golden four + Coimbatore 1979, Sydney 2001,
  Trichy 1956, Chennai 2016 — a child) × {as built, married, retired,
  student} × 9 dates × flags {defaults, all off}: **576 cases, 0 differ**.
  Controls: one profile's dates shifted → 64 differ; the confidence threshold
  60 → 61 inside the stage → 220 differ. New
  `tests/test_life_area_score_stage.py` (8 tests, fakes for `_score_area` and
  the chain): the 65/35 blend, the reading from the pre-blend score, no gate →
  no reading, BLOCKED ignores timing, HIGH/MEDIUM/LOW, a karaka with no
  transit reads house 1 at 50, a signal of exactly 60 counts. Controls:
  reading from the blended score → that test fails (`MIXED` vs
  `PROMISED_AND_TIMED`); 64/36 blend → 2 fail; threshold 61 → the boundary
  test fails (it was added after the first threshold run passed all seven —
  the fixtures sat far from 60). The 18 test files touching life areas: 277
  passed. mypy (368 files) and ruff clean.
  **Blind spots:** no active goals or life events in either the golden or the
  comparison; `get_life_areas` is still 620 lines — the narration half of the
  loop (≈250 lines of bundle edits) is the next stage and is not started.
  `assess_marriage_prediction` and `dashboard-workspace.tsx`: not started.
  **Third unit, golden first — `assess_marriage_prediction` (2026-10-08) —
  and a live defect it exposed.** The function is already pure (a
  `MarriageAssessmentInput`), so `tests/test_marriage_prediction_golden.py`
  builds that input from a synthetic chart exactly as
  `app/api/predictions.py` does from a persisted one; 6 profiles (the golden
  four + a child and an elder for the age gates) × 4 dates × {as built,
  married, parent, promise gate off}: 96 cases + a matrix test (both gates
  named, ≥2 confidences, ≥3 bands, ≥8 distinct predictions). **The first
  write and the first test run disagreed on 12 cases** — all `chart_signature`.
  Cause: `_compute_chart_signature` took `list(payload.active_dasha_lords)[0]`
  as the maha lord; the field is a `set`, string hashing is seeded per
  process, so one chart was framed "revolves around the Moon" in one web
  worker and "around Jupiter" in another (`PYTHONHASHSEED=0` vs 1–2:
  reproduced). Fix: `MarriageAssessmentInput` gains `maha_lord`/`antar_lord`
  (optional, ordered); the route passes the timeline's; the signature reads
  them, and without them uses no dasha signal unless maha = antar (the set
  can say that much) — never a guess. Same family, latent: the propensities
  endpoint set `maha_lord=sorted(lords)[0]` (alphabetical — a Saturn maha
  with a Jupiter antar recorded as Jupiter); nothing reads those two fields
  today; now from the timeline. Health/career/wealth use the set only for
  membership or `sorted()` lists — order-free, unchanged. **Who sees a
  difference:** a marriage reading whose dominant graha depended on the dasha
  points now always credits the real maha lord.
  **Gates:** `tests/test_marriage_signature_determinism.py` — the prediction
  computed in 4 subprocesses under hash seeds 0–3 must agree. Baseline: 2
  distinct outputs (`…MOON…` vs `…JUPITER…` for Madurai). After: 4 passed
  (plus: the signature credits the given maha lord either way round; no lords
  → no dasha signal). Golden: 97 passed under each of seeds 0–3. Golden
  control: the STRONG-dasha bonus 10 → 9 fails **only 1 of 97** — the
  prediction exposes no raw score, so an internal change shows only where it
  crosses a confidence/verdict boundary. **Any extraction from this unit
  needs the exact old-vs-new comparison, not the golden alone.** The 76 test
  files touching marriage, predictions or propensities: 2116 passed, 1
  skipped. ruff, mypy clean. **Blind spots:** the golden does not cover the route's wrapping
  (`age_gated`, `alternative_framing`, the prediction log) or a caller that
  builds the input without lords; no extraction from this unit yet.
  **Previously not started:** steps 1–6 — `build_daily_guidance_response` (883 lines),
  `get_life_areas` (689), `assess_marriage_prediction` (648) and
  `dashboard-workspace.tsx` (2,415 lines now, 2,574 at audit) need golden
  fixtures before any extraction.
  **Found (pre-existing), fixed in a separate commit:** `mypy app` reported 4
  errors at HEAD with CI's pinned mypy 2.3.1 — `narrative_engine.py` (Optional
  `gochara_grade` result used as a key) and `_yoga_dosham.py` (invariant
  `list[Literal]`) — so CI's backend-lint job could not pass. Annotation-level
  fixes, no behaviour change; mypy now clean on 367 files.

#### First CI on a runner after the Phase 3 push (2026-10-08)

The 20 Phase 3 commits were pushed on 2026-10-08 (owner: "you push it now").
Runs 37751457301 (CI, pull_request), 37751457502 (Mobile CI, pull_request) and
37751452397 (Mobile CI, push) on `17c1e6b`. Five reds; each fixed in its own
commit. Only the varshaphala one touches a Phase 3 test:

- [x] **Web — `lib/css-surface-boundary.test.ts` (red since 2026-10-07).**
  `bef9714` gave `/notifications` the dashboard chrome
  (`DashboardAuxiliaryShell`) and its layout imports the three dashboard
  stylesheets. The gate knew three load contexts and treated everything in
  `app/(marketing)/` as marketing-only, so it reported 125 dashboard classes
  as unreachable — classes that route does load. A false positive, not a
  styling defect. Fix: `css-inventory.mjs --emit-boundary` splits marketing
  routes by the extra route-level CSS their own nested layouts import and
  emits each as a `nested` context; the test checks each against exactly
  marketing + those sheets, requires the inbox context to exist with >100
  classes (no vacuous pass), and the loader test now scans every `layout.*`
  under `app/` and names the inbox layout as a deliberate second loader of
  `dashboard-globals.css` (it scanned three files and so could not see it).
  **Controls:** inbox layout without `dashboard-nova.css` → the nested check
  and the loads assertion fail; a plain marketing page importing the
  dashboard shell → the plain-marketing check fails with the same 125. Web
  vitest 140 files / 1451 passed; web lint clean.
  **Blind spots:** nested-layout CSS is detected only for static
  `import "x.css"` in a `layout.*` file inside `app/(marketing)/`; a sheet
  imported by a page or a component is not a load context. Whether
  marketing.css and the dashboard sheets cascade cleanly together on
  `/notifications` is untested — that route loads both.
- [x] **Backend lint — pip-audit: python-jose 3.5.0, CVE-2026-85394
  (GHSA-3qf3-8w2g-rqmx), no fixed release.** HMAC key setup accepts a
  DER-encoded public key, so a holder of the service's public key can forge
  HS256 tokens when decode does not restrict `algorithms`. Both preconditions
  are absent: one symmetric secret, and both jose decode sites
  (`app/core/auth.py`, `app/middleware.py`) pass `algorithms=[...]`. But the
  first was only a comment — `jwt_algorithm` was a free `str` from
  `JOTHIDAM_JWT_ALGORITHM`. Fix: `jwt_algorithm` is typed
  `Literal["HS256","HS384","HS512"]` (boot refuses anything else; nothing in
  the repo, `.env`, compose or workflows sets it), and the advisory is ignored
  in `ci.yml` under both IDs with its premise written verbatim.
  **Gate:** `tests/test_jwt_hmac_only.py` (no_db). Baseline before the config
  change: 6 failed (RS256, ES256, PS256, EdDSA, none, hs256 all accepted), 5
  passed. After: 11 passed; with test_config + CI-coverage, 42 passed.
  pip-audit with the ignore exits 0; mypy and ruff clean.
  **Blind spots:** the AST scan sees only `<name>.decode` where `<name>` is
  imported `from jose import jwt`; `import jose` + `jose.jwt.decode` is not
  matched. **The real fix is leaving python-jose for PyJWT** (REFACTOR_PLAN
  1.2), which retires this ignore and the ecdsa one together — not done.
  **Done 2026-10-08 (owner handed over the decision): python-jose → PyJWT,
  and every pip-audit ignore is gone.** Surface re-verified first: jose was
  used only in `app/core/auth.py` (encode/decode/`JWTError`), the rate
  limiter's subject read in `app/middleware.py`, and `tests/test_auth.py`.
  Now `import jwt` / `jwt.PyJWTError` there; the middleware's
  optional-import guard is gone (PyJWT is a hard dependency). Lock: removed
  `python-jose`, `ecdsa`, `rsa`, `pyasn1`, `six` (each needed only by jose or
  ecdsa — `pip show`; `pip check` clean after uninstalling them and
  refreshing the stale editable metadata); `pyproject` names `PyJWT>=2.15,<3.0`
  (`cryptography` is its own direct dependency, so dropping jose's
  `[cryptography]` extra loses nothing). **Found on the way:** redis 5.3
  already depended on PyJWT and the lock never pinned it — this venv held
  2.13.0, which has 14 advisories (PYSEC-2026-4140…4183, fixed by 2.15.0);
  pinned `PyJWT==2.15.1` (latest). `pip-audit -r requirements.txt` with **no
  ignores**: "No known vulnerabilities found". CI's four `--ignore-vuln`
  lines and their premise paragraphs are removed.
  **Gate:** `tests/test_jwt_library.py` (11). Two tokens minted by
  python-jose 3.5.0 through `create_access_token`'s exact claim set (HS256
  access, HS512 pwreset; synthetic secret/subject; exp 2099) must decode to
  the same claims — the first request after the deploy is a token PyJWT
  never issued. Expired, tampered, other-algorithm, `alg: none` and
  wrong-secret tokens are refused with 401; a new token round-trips with
  integer `iat`/`exp`. Ratchets: nothing in app/tests/scripts imports `jose`;
  the lock pins PyJWT and none of the removed five. **Baseline (under jose):**
  the 9 equivalence tests passed — the behaviour to keep — and both ratchets
  failed. After: 11 passed on 2.13.0 and on 2.15.1. `test_jwt_hmac_only.py`
  now scans PyJWT decode calls (still requires `algorithms=[...]` at both
  sites). The 32 auth-related test files: 428 passed on 2.13.0, and with
  the new file 439 passed on 2.15.1. ruff, mypy clean.
  **Blind spots / notes:** PyJWT ≥ 2.10 emits `InsecureKeyLengthWarning` for an
  HMAC key shorter than the hash (32 bytes for HS256); jose never warned. The
  dev default secret is 64 chars; if production's `JOTHIDAM_JWT_SECRET` is
  shorter, the log will say so once per process — rotating it logs everyone
  out, so that is an owner decision, not done here. The decode scan misses
  `from jwt import decode`. Dated reference docs (2026-08-25, 2026-10-06)
  still say python-jose; `HOW_TO_USE_CODEBASE.md` and REFACTOR_PLAN 1.2 are
  updated.
- [x] **Mobile — Jest cold-start timeout (A15 step 7; it did reproduce).**
  The push-triggered run failed `birth-details`' first test at 5 s; the
  pull_request run of the same commit passed. Measured: local cold
  (`--no-cache`, as CI always is) — first test per screen file 11.5–18.4 s
  (2 of 4 files failed), later tests 0.15–4.7 s; local warm in-band — reading's
  first test still over 5 s. The cost is React Native's lazily-required modules
  on first render, not the screen. Fix: `jest.setTimeout(30_000)` in
  `jest.setup.screens.js`, so it applies to the screens project only (~1.6x
  the worst measured). After, cold: 167/167, first tests 9.3–11.6 s.
  **Control:** the cold run before the change is the baseline (2 failed).
  **Not fixed:** "A worker process has failed to exit gracefully" still
  prints on full runs; `--detectOpenHandles` on the screens project reported
  no open handle, so the leak's owner is unidentified. No `--forceExit` added.
  The reading screen logs act() warnings on its first test.
  **Owner identified 2026-10-08 (investigated, not fixed — owner asked for a
  report first).** By project: utils (147) and react (16) never print it;
  screens (12) does. Every pair of the four screen files run with
  `--maxWorkers=2` (a single file runs in-band and cannot show it): the three
  pairs containing `reading.screen.test.tsx` warn, the three without it do
  not. That file is the only screen test that builds a `QueryClient`, one per
  render, with the default `gcTime` and no `clear()`; after RNTL unmounts, React
  Query schedules a 5-minute cache-collection `setTimeout` per query, which
  holds the worker open. **Confirmed by control, file restored after:** the
  same pair with `gcTime: Infinity` → 0 of 2 runs warn; unchanged → 2 of 2 warn.
  **Proposed fix (one test file):** `gcTime: Infinity` in that client's
  defaults, or keep the clients and `clear()` them in `afterEach`. No product
  code is involved. Not explained: why `--detectOpenHandles` did not report
  the timer.
  **Fixed 2026-10-08 (owner handed over the decision):** `gcTime: Infinity` in
  that test's `QueryClient`. Full mobile Jest 175/175 in 2 of 2 runs with no
  worker warning (every earlier full run printed it); lint clean. **Blind
  spot:** a future screen test that builds its own client can reintroduce it;
  nothing enforces the setting.
- [x] **Backend tests — `test_response_model_is_lossless[varshaphala]`
  (5996 passed, 1 failed).** The only difference: one `tajakaPlanets`
  `degreeInRasi`, 11.2445 (HTTP) vs 11.2446 (direct call). The test compared
  the HTTP body with a *second, separate computation*, so it measured the
  calculation's reproducibility, not the model. **Cause not found.** Ruled
  out locally: `calculate_sidereal_planets` is bit-identical for the same JD
  after interleaved lagna/ayanamsa/Sun-Moon calls, on swisseph-ffi with the
  data files and on Moshier (60 JDs × 3 shuffled rounds, 0 differences); no
  code outside `ephemeris.py` touches Swiss global state and every call is
  under `_SWISS_LOCK`; requests do not share a DB session and
  `EncryptedFloat` round-trips exactly. Not ruled out: CI runs Python 3.12 +
  **pyswisseph**, which this machine (Python 3.14 only) cannot run. Fix to the
  *gate*: the route function runs once, and that value goes through FastAPI's
  own `serialize_response` with the route's own response field and flags;
  the HTTP body must match in shape (keys, value kinds). 18 passed. Control:
  `note` removed from `ShadbalaData` → fails naming `note`.
  **Blind spots:** the HTTP comparison is shape-only. **Open:** whether
  varshaphala (or any route) is non-reproducible across calls on pyswisseph —
  a 3.12 environment is needed to answer it. A user-visible effect, if real,
  is a 4th-decimal flip of a displayed degree.
  **Investigated 2026-10-08 — the calculation is reproducible on CI's
  runtime; not fixed, nothing to fix there.** `python:3.12-slim` (3.12.14)
  with `requirements.txt` (pyswisseph 2.10.03 built from source — the slim
  image needs `gcc g++`; it has no wheel) and the repo's `ephe/` files. A
  script ran `calculate_tajaka_chart` for 40 synthetic natal-Sun/year inputs,
  then 3 more times each in shuffled order with 0–3 unrelated
  `calculate_sidereal_planets`/lagna calls interleaved: **240 repeats over two
  processes, 0 exact differences** in any planet longitude or the solar-return
  JD; the two processes' first passes are bit-identical (360 values). Against
  local swisseph-ffi on 3.14: 1 of 360 values differs, by 7.1e-15 (an ulp),
  0 at the route's 4-place rounding. The path has no cache: the solar return
  is a 70-step bisection over `sun_longitude_at_jd`. So the 11.2445/11.2446
  flip needed an input ~1e-5° apart, not a library difference. The only input
  that can differ between that test's two calls is the natal Sun read from
  `ChartPlanet` (`EncryptedFloat` round-trips exactly; sessions use the
  default `expire_on_commit=True`). Not tested: the DB-backed path on 3.12
  (the test DB's guard requires localhost:5433 from the host). The test no
  longer compares two computations, so it cannot recur as a test failure;
  whether a user can see two degrees for one chart is still open, and if so
  the cause is upstream of the calculation.
- [x] **Compose stack — "backend outage is a bounded 502" got a 502 and
  failed.** The proxy returns `{"detail":"Backend unreachable"}`; the claim
  also requires "unreachable" in the body, and the body read as `""`.
  `Invoke-Probe` read error bodies via `GetResponseStream()`, which exists on
  Windows PowerShell 5.1's `WebResponse` but not on PowerShell 7's
  `HttpResponseMessage` — and CI runs the script under `pwsh` on Linux, so
  every error body was empty there. The A01-b local PASS was under 5.1. Fix:
  `-SkipHttpErrorCheck` on 7+. Verified on 5.1 against a local 502 server
  (status 502, body read, match True). **Verified on 7 in CI** (run
  37759598560, re-run of the failed job): all six claims PASS under `pwsh`,
  and the `-BreakBackendUrl` negative control still FAILs — now printing the
  `{"detail":"Backend unreachable"}` body it used to read as empty.
  **Separate flake seen on the first attempt of that run:** the smoke's web
  image build died in `next/font` (`Cannot read properties of null (reading
  '1')`, google `loader.js:122` — Google Fonts returned a font URL without a
  file extension), while the run's own "Web Docker image" job built the same
  layout fine. The web build depends on Google Fonts answering consistently
  at build time; self-hosting the faces (`next/font/local`) would remove that
  dependency. **Not done** — recorded here, not fixed.

**CI on `f939b77` (2026-10-08, after the cache move, A14 steps 7–8, A15
coverage and the first guidance extraction):** all green on the first
attempt — pytest 6053 passed / 7 skipped (+45 = exactly the new tests: daily-
guidance golden 17, stage tests 20, Ask Vinaadi provider 6, aliased-guard 1,
session-parameter gate 1; skips unchanged, so the golden ran and passed on
CI's pyswisseph despite the platform difference it was normalised for), web
with the new coverage thresholds, backend lint, Alembic, token ratchet, web
image, compose smoke, Mobile CI on push and pull_request.

**CI on `297778f` (pushed by the owner, 2026-10-08):** all green — pytest 6091
passed / 7 skipped (same as local; both goldens pass on pyswisseph), web 1451,
Mobile CI on push and pull_request.

**Local, after the 2026-10-08 continuation (`264f36c`, 8 commits ahead of
origin, not pushed):** full backend suite 6091 passed / 7 skipped, coverage
92.81% (58 min) — CI's 6053 plus exactly the 38 new tests (generator 6,
dasha stage 7, life-areas golden 17, life-area stage 8); mobile Jest 175/175
(the reading-screen worker warning still prints, as reported above); web
vitest 140 files / 1451 with coverage thresholds met; web lint clean; mypy
and ruff clean. Not yet observed on a CI runner.

**CI after these fixes (`3f90de4`, 2026-10-08):** all green — pytest 6008
passed / 7 skipped (14 min), web, backend lint (ruff, mypy, pip-audit),
Alembic round-trip, design-token ratchet, web image, compose smoke (on
re-run, see above), Mobile CI on both push and pull_request. Playwright e2e
skipped (no external base URL configured), so its 30-minute timeout is still
a guess.

## Agent Completion Checklist

For every task completed from this file:

- Update the task status in this document if the user asked you to maintain tracking.
- Mention changed files in the final response.
- Run the narrowest relevant tests listed under the task.
- If a test cannot run, document why and what remains unverified.
- For external verification tasks, record the exact environment value or dashboard evidence outside secrets.
- For astrology-rule changes, include source notes or methodology text so future agents do not reverse the decision by accident.
