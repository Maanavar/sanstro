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

- [ ] A12 derived birth timestamp — **data-migration scope not yet decided.**

### Phase 3 and later — not started

- [ ] A13 module boundaries. [ ] A14 contract completeness.
- [ ] A15 CI coverage (partially advanced by A01's new job).
- [ ] A16 contradictory authoritative documentation.

## Agent Completion Checklist

For every task completed from this file:

- Update the task status in this document if the user asked you to maintain tracking.
- Mention changed files in the final response.
- Run the narrowest relevant tests listed under the task.
- If a test cannot run, document why and what remains unverified.
- For external verification tasks, record the exact environment value or dashboard evidence outside secrets.
- For astrology-rule changes, include source notes or methodology text so future agents do not reverse the decision by accident.
