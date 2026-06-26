# Vinaadi AI Master Fix List

Last updated: 2026-06-26

Scope: Security, resilience, astrology accuracy, and follow-up verification work from the consolidated review list.

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

Status: `[ ]`

Problem:
Password reset links use a normal access JWT with only `sub`, `iat`, and `exp`. If leaked, the token grants full API access during its lifetime and is not single-use.

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

## Agent Completion Checklist

For every task completed from this file:

- Update the task status in this document if the user asked you to maintain tracking.
- Mention changed files in the final response.
- Run the narrowest relevant tests listed under the task.
- If a test cannot run, document why and what remains unverified.
- For external verification tasks, record the exact environment value or dashboard evidence outside secrets.
- For astrology-rule changes, include source notes or methodology text so future agents do not reverse the decision by accident.
