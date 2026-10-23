# Architecture and design-pattern audit — 7 October 2026

Audited revision: `3ed90e076dc9e418d78e0d7297024e8e3885ab7d`.

## Executive assessment

Vinaadi's overall technology choice and monorepo structure are appropriate for the product. A modular monolith remains the recommended architecture. The highest-value work is strengthening identity, transaction, deployment, and asynchronous-delivery boundaries inside the existing system.

There are material defects in those boundaries. Six findings below are high priority: the supplied production Compose configuration misroutes backend traffic; mobile account changes do not isolate cached data or purchase identity; refresh-token replay revocation rolls back; billing events can overwrite newer subscription state; and Redis failure disables application rate limits. These findings prevent a clean readiness recommendation for the affected deployment, account-switching, and paid-subscription flows.

The codebase has substantial defensive engineering: ownership helpers, token versions, conditional refresh-token rotation, atomic quota reservations, encryption key rotation, database safety checks, doctrine tests, API-contract guards, and deployment checks. Several weaknesses recorded in older audits have already been addressed. This review credits those improvements and identifies what remains.

**Scope and assurance:** repository-wide inventory and structural analysis, with detailed source tracing of security, sessions, billing, calculations, dashboard composition, persistence, notifications, deployment, and test infrastructure. This is not a claim that every line was manually read. It is not a penetration test, native-device certification, visual accessibility audit, production load test, or independent astrology validation. No production or development database was queried or changed. No live purchases, notifications, provider requests, or deployments were made. Application code was not changed.

## Inventory and current architecture

Tracked `.py`, `.ts`, `.tsx`, and `.css` files were counted. These are physical lines including comments, content tables, styles, and tests; they are not executable-code counts or a quality score.

| Area | Files | Lines |
|---|---:|---:|
| Backend `app/` | 359 | 116,599 |
| Web `web/` | 688 | 164,897 |
| Mobile `mobile/` | 202 | 29,064 |
| Shared packages | 66 | 9,254 |
| Backend tests | 267 | 63,443 |
| Migrations | 58 | 3,325 |
| Total in these groups | 1,640 | 386,582 |

Static AST enumeration found 221 HTTP route decorators in `app/api/`; this is a source count, not a count of mounted OpenAPI operations. Of these, 37 do not explicitly supply `response_model`. Some legitimately return no content, files, or inferred types; the actionable contract gaps are established by the skipped checks below.

```text
Browser → Next.js pages / API proxy ─┐
                                    ├→ FastAPI routes → services → calculations / reasoning
Expo mobile → shared API wrappers ──┘                     ├→ PostgreSQL
                                                         ├→ Redis
Scheduler (API leader or dedicated worker) → services     └→ external providers
```

Shared TypeScript packages provide client wrappers, domain types, localisation helpers, and design tokens. Most API routes are synchronous, matching the synchronous SQLAlchemy stack. The existing separation is useful, but several dependency and lifecycle rules remain conventions rather than enforced boundaries.

## Findings

P1 means high impact in the stated scenario, suitable for a release gate for that flow. P2 means a material correctness, reliability, or maintainability problem to address in planned work. Severity is based on consequences, not file size. “Reproduced” means an isolated local probe against current source; it does not mean the issue was observed in production.

| ID | Priority | Finding | Evidence level |
|---|---|---|---|
| A01 | P1 | Production Compose supplies the wrong backend URL variable | Configuration probe |
| A02 | P1 | Mobile account changes retain another account's query data | Isolated source/library reproduction |
| A03 | P1 | Refresh-token replay revocation is rolled back on the 401 path | Actual route + dependency, mocked session |
| A04 | P1 | RevenueCat identity is bound only during app bootstrap | Traced lifecycle; native purchase untested |
| A05 | P1 | Subscription events have no ordering/deduplication boundary | Actual handler, mocked session |
| A06 | P1 | Runtime Redis failure permits every application rate-limit check | Actual backend, injected outage |
| A07 | P2 | Sensitive-query persistence filter reads the wrong object shape | Actual persister + library dehydration |
| A08 | P2 | Mobile 401 handling has no refresh/retry ceiling | Actual client, mocked network |
| A09 | P2 | Scheduler leadership has neither takeover nor loss detection | Source trace |
| A10 | P2 | Notification delivery is not durably coordinated with persistence | Source trace |
| A11 | P2 | Dashboard section isolation does not isolate DB transaction failure | Source trace |
| A12 | P2 | Plain derived timestamp defeats birth-date/time field confidentiality | Schema and write-path trace |
| A13 | P2 | Large orchestration units and inverted dependencies weaken modularity | AST metrics + source trace |
| A14 | P2 | API contracts remain partly handwritten and unverifiable | Existing guards: 9 skips |
| A15 | P2 | CI misses mobile tests and full deployment integration | Workflow inspection |
| A16 | P2 | Canonical instructions contradict current doctrine and implementation | Cross-checked current source |

### A01 — Production Compose misroutes API traffic

**Evidence:** [docker-compose.app.yml](../docker-compose.app.yml), line 154, sets `API_BASE_URL`. The [Next proxy](../web/app/api/backend/[...path]/route.ts), line 3, reads `BACKEND_URL`, defaulting to `http://127.0.0.1:8000`. Admin and several server-rendered public pages also read `BACKEND_URL`. No mapping between these two variables was found in the web configuration.

**Failure:** starting the supplied stack sends proxied requests to port 8000 inside the web container, while FastAPI lives in the separate `api` container. The homepage can respond successfully while login, dashboard data, and backend-dependent server pages fail or fall back.

**Recommendation:** standardise the server-only setting and validate it at startup. Exercise the built web container through `/api/backend/health/ready` against the built API container. Then run a synthetic login/read flow against an isolated database.

**Acceptance:** a real Compose integration job passes through the web proxy; changing the configured key back to the mismatched name makes that job fail. Existing CI only boots the web image and curls `/`; it cannot prove API connectivity. The audit confirmed the configuration mismatch without starting production Compose.

### A02 — Mobile cache is not scoped to an authenticated identity

**Evidence:** [mobile query client](../mobile/src/lib/queryClient.ts) is a process singleton. [Root layout](../mobile/app/_layout.tsx), line 184, mounts the persistent provider above the session provider. [Session context](../mobile/src/state/sessionContext.tsx), line 57, clears React session state only. [Me screen](../mobile/app/(tabs)/me.tsx), line 102, clears tokens and primary-selection preferences but does not clear/cancel queries or remove the persisted client. [Family vault](../mobile/app/family-vault.tsx), line 505, uses the account-independent key `["family-vaults"]` with five minutes of freshness.

**Failure:** A signs out, B signs in during the same app lifetime, and a fresh account-independent query returns A's cached family data. The isolated probe returned A's value after the session transition and made zero requests for B. Encryption on disk does not provide account isolation within the running application.

**Recommendation:** establish a single session-transition operation that cancels in-flight work, clears private memory and persisted state, updates credentials, and resets dependent SDK identities. Include the authenticated user ID in private query keys and in the persistence namespace/buster. Prevent an old in-flight request or delayed persistence write from restoring A's data after the transition.

**Acceptance:** test A→logout→B and expired-token→login transitions, both online and after restart/offline hydration. Neither cache values nor in-flight completions from A may appear for B. The current probe uses actual query-cache behaviour and the current session function with mocked React; it does not render a native screen.

### A03 — Refresh-token replay detection undoes its revocation

**Evidence:** [mobile_auth.py](../app/api/mobile_auth.py), lines 239 and 244, updates all active refresh tokens for the user when a revoked token is reused, then raises `HTTPException(401)`. [get_db](../app/db/session.py), line 33, rolls the transaction back on that exception.

**Failure:** the endpoint rejects the replay and logs a theft signal, but the intended revocation of other active refresh tokens is not committed. The probe observed one revocation update, zero commits, and one rollback through the actual route and dependency generator.

**Recommendation:** make revocation a deliberately committed security operation before returning the rejection. Keep its transaction narrow and explicit. Decide whether the incident should also increment `token_version` to revoke existing access tokens, rather than silently changing that policy during a refactor.

**Acceptance:** through the real HTTP endpoint on isolated PostgreSQL, rotate a token, replay the old token, then attempt to use the previously active successor. Assert its revocation from a new session. [Existing race tests](../tests/test_refresh_token_rotation_race.py) prove the conditional rotation claim; they do not run this HTTP error/commit path. The audit probe verifies control flow with a mocked session, not persistence against PostgreSQL.

### A04 — Mobile purchase identity does not follow login/logout

**Evidence:** [root layout](../mobile/app/_layout.tsx), line 102, calls `purchases.logIn(me.userId)` inside the mount-only bootstrap effect. [Interactive login](../mobile/app/(auth)/login.tsx), line 39, updates application session state without binding RevenueCat. Sign-out has no RevenueCat logout. [Premium screen](../mobile/app/premium.tsx), line 74, purchases using the SDK's current identity. The webhook expects `app_user_id` to be the backend user UUID and ignores IDs that cannot be parsed or resolved.

**Failure scenario:** launch signed out, then log in and purchase: the SDK may still have its anonymous identity, so the webhook cannot resolve the backend user. Launch as A, sign out and sign in as B: the SDK can remain attached to A while the screen grants B a local premium state. The exact purchase/transfer outcome depends on RevenueCat project settings; no store transaction was performed.

**Recommendation:** centralise purchase identity synchronisation with every session transition. Block purchase/restore until the SDK identity matches the authenticated UUID. Reconcile the backend entitlement after purchase instead of treating a local state update as completion.

**Acceptance:** RevenueCat sandbox tests for fresh-install login→purchase, A→B switch→purchase, logout, restore, and delayed webhook delivery. Verify the app user, SDK app-user ID, and backend subscription all refer to the same synthetic account.

### A05 — Billing webhook processing lacks an event state machine

**Evidence:** [webhooks.py](../app/api/webhooks.py), line 83 onward, reads event type and expiry but does not record event ID or timestamp. Line 109 selects the first subscription for a user. [Subscription model](../app/models/subscription.py) has no unique constraint for the logical provider subscription/user projection.

**Failure:** a renewal followed by an older expiration marks a renewed subscription inactive. The current handler reproduced that transition even when both payloads included event timestamps. Concurrent initial events can also race the select-then-insert path; this latter case was not exercised against PostgreSQL.

**Recommendation:** add a webhook inbox with unique provider event IDs, an explicit subscription identity, atomic projection updates, and reconciliation with provider state. Define how old events, product changes, refunds, aliases, and transfers affect that projection. A timestamp comparison alone needs care around event semantics.

**Acceptance:** reordered, repeated, concurrent, and interrupted event-processing tests leave the correct entitlement. Unknown users/events are observable and recoverable where appropriate. RevenueCat explicitly recommends idempotent processing for duplicate deliveries: [provider webhook guidance](https://www.revenuecat.com/docs/integrations/webhooks).

### A06 — Redis outages disable application rate limits

**Evidence:** [RedisRateLimitBackend.check](../app/core/rate_limit.py) catches Redis errors and returns `allowed=True`. [AuthThrottler](../app/core/auth_throttle.py) uses this same backend for account and IP login, registration, password-reset, and admin-elevation limits.

**Failure:** during an outage, the configured one-request limit allowed all three probe requests. The startup worker-count guard is useful but does not cover a later outage. `/health/ready` correctly reports Redis as required, but the supplied nginx configuration proxies all requests to web; Compose health status alone does not withdraw a running container from that route. Edge throttling is an aggregate IP control and does not replace per-account auth limits.

**Recommendation:** use an explicit failure policy by control: reject or safely restrict security-sensitive auth attempts when their authoritative limiter is unavailable. Ordinary cache misses can continue degrading gracefully. Ensure deployment readiness actually controls traffic, and alert on enforcement degradation.

**Acceptance:** inject a runtime Redis outage after successful startup. Auth controls remain effective or return a documented temporary-unavailability response. Test the whole ingress route, not readiness in isolation.

### A07 — Sensitive-data filtering is a no-op for real persisted clients

**Evidence:** [encryptedQueryPersister.ts](../mobile/src/lib/encryptedQueryPersister.ts), line 33, checks top-level `queries`. The persistence API supplies `{ timestamp, buster, clientState: { queries, mutations } }`. The `any` interface hides that mismatch. The probe used the installed library's `dehydrate` output and retained a `profile` query the filter intends to discard.

**Impact:** unintended private data is retained in the encrypted device cache. This is not evidence of plaintext storage; the issue is retention policy and account scoping, compounded by A02. The substring denylist also leaves newly named private queries unclassified.

**Recommendation:** use the library's `Persister`/`PersistedClient` types and an explicit query metadata allowlist or correctly scoped dehydration policy. Partition by user and validate restored state. [TanStack persistence contract](https://tanstack.com/query/latest/docs/framework/react/plugins/persistQueryClient).

**Acceptance:** serialize a real persisted-client envelope containing public and private queries; inspect restored queries and verify policy. Include unknown/new query names and mutations.

### A08 — Mobile refresh recursion is unbounded

**Evidence:** [fetchWithAuth](../mobile/src/api/client.ts), line 100, recursively calls itself after refresh without a retry marker. Neither request nor refresh has an application timeout.

**Failure:** if refresh succeeds but the resource keeps returning 401, it repeatedly rotates tokens and retries. The probe allowed four successful rotations; it observed five protected requests and five refresh attempts before deliberately failing the fifth refresh to stop the loop.

**Recommendation:** permit one refresh-and-replay per request, preserve single-flight refresh, propagate cancellation, and define request deadlines. Route terminal auth failures through the same complete session cleanup as A02. Prevent an in-flight refresh from writing credentials after logout.

**Acceptance:** persistent 401, refresh timeout, offline failure, concurrent 401s, and logout-during-refresh have bounded calls and predictable session state. The probe proves retry recursion, not real network timing.

### A09 — Scheduler leader lock is not a complete failover protocol

**Evidence:** [worker.py](../app/worker.py), line 37, attempts acquisition once; a follower waits forever. [SchedulerLease](../app/core/leader_lock.py) holds a dedicated PostgreSQL connection but never checks it again before shutdown. The API lifespan has the same one-time election pattern.

**Failure scenarios:** if the leader dies, an already-running follower never attempts promotion. If the lock connection is lost while the process survives, the scheduler keeps running without detecting that its lock has disappeared; another process can acquire leadership. These are source-derived failure scenarios, not measured production incidents.

**Recommendation:** at current scale, explicitly own one supervised scheduler process with a heartbeat and fail on lost leadership. If multiple replicas are needed, add bounded reacquisition and fencing/durable job claims. Make each outward-effect job idempotent independently of scheduler election.

**Acceptance:** kill the leader, interrupt its DB connection, restart PostgreSQL, and resume connectivity; scheduled work must recover within a stated bound without concurrent delivery.

### A10 — Notifications have a send/commit crash window

**Evidence:** [dispatch service](../app/services/notification_dispatch_service.py), lines 237 and 247, calls external providers before persisting the final outcome. [Daily cron](../app/services/daily_push_cron.py), line 351, commits afterward. Queued onboarding notifications are selected as `queued` at line 470 without an atomic claim; failed rows are not included in that selection on the next run.

**Failure:** a process can successfully send and then crash or roll back before recording it, causing a later run to send again. A failed queued delivery becomes terminal in the current selection path. Multiple delivery channels share one overall row state, complicating retries after partial success. Provider-call retries do not resolve these transaction boundaries.

**Recommendation:** a PostgreSQL outbox is sufficient initially: persist intent with a unique logical notification key, claim bounded batches, record attempts per channel, retry with backoff, and expose exhausted attempts. Use provider idempotency where available. State an at-least-once delivery guarantee and residual duplication risk; an outbox alone cannot promise exactly-once external effects.

**Acceptance:** crash before send, after provider acceptance, and before commit; exercise partial push/email success and two competing workers. Inspect durable state and user-visible duplicate behaviour.

### A11 — Dashboard catch-all isolation shares a fallible transaction

**Evidence:** [dashboard bundle](../app/services/dashboard_bundle_service.py), line 73, catches all exceptions and returns `None` per section. Every section shares the same SQLAlchemy session, including functions that write caches. There is no savepoint or recovery boundary in `safe`. The outer dependency still commits once at the end. Other services also commit internally, e.g. [birth_profile_service.py](../app/services/birth_profile_service.py), line 442.

**Failure:** a database statement/flush error in one section can leave the transaction unusable, so subsequent sections fail too and the final commit cannot uphold the advertised partial-success behaviour. Broad catching helps for pure calculation errors; it is not transaction isolation. This distinction is consistent with [SQLAlchemy's session guidance](https://docs.sqlalchemy.org/en/20/orm/session_basics.html).

**Recommendation:** define transaction ownership at the application use-case boundary. Keep deterministic section computation separate from optional cache writes; isolate recoverable cache work with intentional savepoints or separate units of work. Classify errors so outages are not presented as an ordinary missing card. Avoid scattering additional commits into individual sections.

**Acceptance:** inject a real DB constraint/statement error in one cache-writing section on the test database and verify the intended partial-result or whole-request failure semantics. A mocked computation exception alone cannot prove this property.

### A12 — Derived birth timestamp bypasses field encryption

**Evidence:** [BirthProfile](../app/models/birth_profile.py), line 28, stores `birth_datetime_utc` as plaintext `DateTime`; line 32 stores the timezone. Local birth date/time are encrypted, but their original values can be reconstructed from the UTC timestamp and timezone for profiles with a known birth time. [Chart persistence](../app/services/_chart_persist.py) writes that timestamp alongside the encrypted fields.

**Impact:** field encryption does not hide date/time of birth from a database dump containing these columns. This does not establish whether infrastructure disk/backup encryption exists; that configuration was not audited. The application encryption module itself identifies leaked dumps as its intended threat model.

**Recommendation:** classify sensitive information by what can be derived, not only by field names. Encrypt or remove the redundant timestamp after examining its query/index consumers, or explicitly narrow the confidentiality claim and accept the residual exposure. Assess current location and generated narrative fields in the same inventory.

**Acceptance:** inspect raw stored rows for a synthetic profile and demonstrate which birth attributes remain derivable without an application key; verify migration, restore, and key-rotation paths if storage changes.

### A13 — Modularity is weaker than the directory names suggest

**Evidence:** AST analysis measured `build_daily_guidance_response` at lines 377–1259 (883 physical lines), `get_life_areas` at 689, and `assess_marriage_prediction` at 648. [Dashboard workspace](../web/components/dashboard-workspace.tsx) has 2,574 lines, 44 `useState` calls, and 23 `useEffect` calls. Feature hooks have already been extracted, but the workspace still coordinates navigation, forms, identity, chart selection, overlays, and cross-feature reloads.

Dependency inversions are concrete: [calculations/panchangam.py](../app/calculations/panchangam.py), line 34, imports an ORM cache model and owns cache SQL; [calculations/propensities.py](../app/calculations/propensities.py), line 28, imports service-level prediction types; [models/birth_profile.py](../app/models/birth_profile.py), line 10, imports storage types from `services`.

**Impact:** domain-rule changes, persistence changes, and presentation changes can affect one another unexpectedly. Large functions mix decisions with assembly and side effects, increasing the number of scenarios needed to change one rule safely. Line count alone does not establish a defect: long static content tables are not the same as large orchestration functions.

**Recommendation:** use a functional core with an imperative shell. Put pure domain types and calculations below use-case orchestration; put DB/cache/provider adapters outside that core. Extract coherent calculation stages and feature-owned UI state when touching those areas. Enforce a small set of dependency-direction rules. Apply a reducer/state machine to the dashboard's interdependent navigation/overlay transitions; keep server data owned by query hooks.

**Acceptance:** calculation modules import no ORM/session or application-service modules; selected domain functions can run with immutable inputs; one feature's mutation invalidates documented query keys without coordinating unrelated dashboard state. Preserve golden doctrine outputs throughout.

### A14 — Handwritten API contracts retain blind spots

**Evidence:** [shared client](../packages/shared/src/api/client.ts) returns `Promise<unknown>` and wrapper casts assert response types. [web/lib/api.ts](../web/lib/api.ts) casts parsed JSON to the caller's generic type. A source scan found approximately 99 direct `apiFetchJson` calls in non-test web TS/TSX, alongside shared wrappers. The existing field guard passed its covered cases but skipped nine operations.

Those skips were eight responses without a discoverable schema—Ashtottari, Chara, conditional dashas, Kalachakra, remedy plan, Shadbala, Varshaphala, and Yogini—and the non-concrete daily-status response. The guard documents that it checks declared field names, not complete runtime semantics.

**Recommendation:** first add concrete response schemas to the skipped operations. Then generate transport types and operation wrappers from the backend OpenAPI document, preserving intentional platform adapters and the repo's incremental shared-client policy. Add runtime validation at unstable external/provider boundaries and for high-risk persisted payloads. Avoid a wholesale caller migration in an unrelated feature change.

**Acceptance:** every first-party JSON operation used by clients has an explicit contract; response type/nullability/enum changes cause consumer failures or an explicit compatibility decision. Contract checks must continue to cover URLs, methods, request shapes, and error responses.

### A15 — CI does not exercise several important integration boundaries

**Evidence:** [mobile workflow](../.github/workflows/mobile.yml) runs shared/mobile type checking and a mobile lint script, then EAS builds on main. It does not invoke Jest. The lint script in `mobile/package.json` targets only `app/**/*`, leaving `src/` outside that script. Workflow path filters omit root lockfile/package-manager changes and design-token-only changes. [Web image CI](../.github/workflows/ci.yml) tests the homepage without an API; E2E is conditional on `E2E_BASE_URL`. [Web coverage thresholds](../web/vitest.config.ts) are 20% lines/functions/statements and 15% branches.

**Impact:** mobile session/cache defects can escape even with a green mobile workflow; a complete application wiring failure can pass image checks. Coverage percentages do not prove correctness of these paths. Local mobile-test results are recorded below, separately from CI status.

**Recommendation:** run mobile utility, context, and screen tests in CI; lint `src/` too; include shared build inputs in triggers. Add a required isolated Compose integration smoke and critical two-user lifecycle tests. Keep the existing database migration round-trip and API-contract guards. Increase coverage around risky flows, with explicit negative controls, instead of pursuing a single high percentage.

**Acceptance:** deliberately reintroducing A01, A02, A03, or A07 fails its appropriate gate. A change to the workspace lockfile triggers mobile validation. Record each gate's blind spots.

### A16 — Authoritative instructions can direct future work toward regressions

**Evidence:** [AGENT_INSTRUCTIONS.md](AGENT_INSTRUCTIONS.md), line 34, gives an obsolete repository root; line 28 says Shadbala is absent although its implementation and routes exist; line 49 specifies Kandaka from Lagna while [transits.py](../app/calculations/transits.py), line 438, implements the later ratified Moon reference. Its feature recipe recommends a swallowed `.catch(() => {})` and contradicts the newer shared-wrapper policy. Root instructions say the UX harness has never covered Tamil/overlays, but the current [UX harness](../web/scripts/ux-audit-core.mjs) has explicit `ta` and `overlays` phases.

**Impact:** new contributors can reintroduce an old doctrine, extend a deprecated client pattern, or repeat a closed audit finding while following documentation labelled canonical.

**Recommendation:** maintain one short current engineering/architecture reference, link to dated decision records, and mark superseded instructions explicitly. Generate inventories where possible. Keep historical investigations out of active instructions unless the still-applicable rule is clear.

**Acceptance:** a new contributor can determine current doctrine and dependency rules without resolving contradictory authoritative statements. Current route/schema/harness inventories match the code.

## Assessment across the remaining criteria

| Criterion | Assessment and next evidence needed |
|---|---|
| Technology fit | FastAPI/PostgreSQL, Next.js, Expo, and shared packages fit this product. There is no demonstrated requirement for a service split or a framework rewrite. |
| Authentication/authorization | Central auth, suspension checks, versioned tokens, CSRF protection, and chart ownership are meaningful strengths. A03 remains material. Some ownership checks remain inline; no blanket claim of IDOR-free coverage is made. |
| Data integrity and migrations | Reversible migrations, an isolated test-DB guard, and CI upgrade→downgrade→upgrade are present. Ordinary API tests construct ORM metadata; the separate migration job proves executability, not every production data transformation or exact ORM/schema equivalence. Add synthetic populated migration/restore cases where data changes. |
| Privacy | Field encryption/key rotation, encrypted mobile storage, and analytics opt-in controls exist. A02/A07/A12 limit the protection. Actual backup encryption, retention operations, incident access controls, and legal compliance were not certified. |
| Scalability/performance | CPU-heavy calculation, sequential dashboard sections, overlapping daily/range/week computation, and the Swiss Ephemeris lock deserve measurements. DB pools permit up to 30 connections per process (`pool_size=20`, `max_overflow=10`); capacity planning must account for every API/worker replica. No user-capacity or p95 claim is justified without representative load tests. |
| Cache design | Versioned DB caches and bulk range reads already exist. `InMemoryCache` removes expired entries on reads, without a global size bound; unique cold keys need a capacity policy. Evaluate misses/stampedes and invalidation dependencies using measured workloads. |
| Availability/recovery | Liveness/readiness separation is good. A01/A06/A09/A10 show that an individually correct health/lock component does not establish an end-to-end recovery guarantee. |
| Observability | JSON access logs, request IDs, central redaction, error envelopes, readiness, and mobile telemetry hooks exist. Section failures need correlated counters; scheduler heartbeat, outbox age, provider failures, and quota/limiter degradation need alertable signals. No deployed monitoring/alert routing was inspected. |
| UI/UX/accessibility | Shared design tokens/primitives, localisation helpers, visual tests, and Tamil/overlay audit phases exist. A13 explains maintainability risk; no rendered visual/WCAG pass is claimed. Run critical flows on device and at supported web sizes/themes/languages before release. |
| Internationalisation/time | Dedicated term localisers and display-boundary tests are strengths. Date-only, instant, and local civil-day handling remain cross-cutting: e.g. usage accounting uses server `date.today()` despite describing a local boundary. Establish a named quota timezone and injected clock; test midnight/DST scenarios. |
| Domain correctness | Golden tests, central version constants, ephemeris locking, and recorded rulings provide a useful base. A16 is a governance risk. This audit checks software architecture, not practitioner correctness of every astrological formula or narrative. |
| AI integration | Provider timeout/retry settings, quota reservation, age/life-stage redirects, and output safety handling are present. The external call is synchronous inside the request's DB unit of work; measure provider stalls and lock/pool occupancy. Evaluate multilingual prompt/safety bypasses separately. |
| Supply chain/deployment | Pinned Python runtime requirements, the pnpm lockfile, unprivileged image users, and a pip-audit CI step are positives. A current complete dependency/image vulnerability scan and deployed secret review were not performed. Mutable image tags and optional build paths need deliberate release ownership. |
| Disaster recovery | Restore/rotation scripts exist, including `scripts/verify_restore.py`. Their presence is not a successful restore drill. Establish and demonstrate RPO/RTO with synthetic restored data and the correct historical encryption keys. |

## Recommended target patterns and sequence

Keep one deployable backend with clear modules: identity/access, profiles/family, astrology calculations, guidance, billing, and notifications. Each should expose a small application interface. Separate pure calculation inputs/results from HTTP response models, and isolate provider-specific payloads behind adapters.

| Pattern | Where it earns its cost |
|---|---|
| Session lifecycle coordinator | Own login/logout/expiry, query cancellation and persistence, purchase identity, analytics identity, and token refresh generation. |
| Unit of work | Make the application use case own the commit; document exceptional security commits such as replay revocation. |
| Inbox and idempotent projection | Receive and reconcile billing events without overwriting newer entitlement state. |
| Transactional outbox | Persist notification intent, claim work, retry per channel, and observe exhausted delivery. |
| Functional core / adapters | Keep doctrine calculations testable without HTTP, ORM, caches, or provider SDKs. |
| Generated transport contracts | Link backend request/response schemas to the shared client; retain web/mobile transport adapters. |
| Reducer / explicit UI states | Consolidate interdependent dashboard navigation/overlay transitions and account-switch state. |

**First: repair correctness boundaries.** Address A01, A02/A07/A08 as a cohesive session/cache change, A03, A04/A05 before paid billing, and A06. Add behavioural regression tests that fail against the current implementation and pass after the repair. Keep each production change separately reviewable.

**Second: make failures recoverable.** Address scheduler ownership and delivery semantics (A09/A10), then transaction isolation (A11). Define readiness routing, heartbeat/dead-letter alerts, request deadlines, and failure-injection exercises.

**Third: improve change safety.** Close missing response schemas, generate contracts incrementally, enforce dependency direction, and extract coherent orchestration stages. Update canonical instructions and mobile CI in parallel with the relevant fixes. Preserve domain golden outputs and current owner rulings.

**Then: measure before scaling.** Establish cold/warm dashboard and calendar latency, SQL query counts, ephemeris compute time, provider occupancy, and queue age. Set budgets based on expected concurrency and deploy limits. Split a service only when measured workload or operational ownership warrants it. A general repository wrapper around every ORM model, CQRS/event sourcing, or a full state-management replacement is not justified by the evidence collected here.

## Verification performed and limitations

1. Read project instructions and document index; cross-checked key historical claims against current code.
2. Inventoried tracked source and used AST/source scans for route counts, long functions, layer imports, and frontend state/fetch patterns.
3. Ran [backend audit probes](../artifacts/architecture-audit-2026-10-07/probe_backend.py): refresh replay update→rollback, stale billing event overwrite, Redis fail-open, and Compose URL mismatch all reproduced. DB connections are explicitly blocked by the probe.
4. Ran [mobile audit probes](../artifacts/architecture-audit-2026-10-07/probe_mobile.cjs): wrong persistence-envelope shape, stale account cache after the session function transition, and unbounded refresh recursion all reproduced. Source is transpiled in memory; network/native APIs are mocked. These are diagnostic demonstrations, not production regression gates. A clean exit means the described defect was observed.
5. Ran existing database-free route, field, and serializer contract checks: **288 passed, 9 skipped** in 9.15 seconds. The skips are listed under A14. Local versions: FastAPI 0.136.1, Starlette 1.3.1, SQLAlchemy 2.0.49, pytest 8.4.2. Coverage was disabled for this targeted selection; no whole-backend coverage claim is made.
6. Ran all 16 mobile Jest suites: **117 tests passed, 1 failed**. The first bundled-place-search screen test exceeded its 5-second timeout; Jest also warned about unfinished asynchronous work before eventually exiting with status 1. Reran that screen suite with a diagnostic 15-second test timeout, open-handle detection, and `--forceExit`: **5/5 passed**, with the first case taking 13.6 seconds. This supports a timing-sensitive test diagnosis, not a confirmed product regression. The forced-exit rerun does not prove that the full suite's open-handle warning is resolved. No timeout or test configuration was changed in the repository.

Reproduction commands, from the repository root in PowerShell:

```powershell
$env:PYTHONUTF8 = '1'
$env:PYTHONIOENCODING = 'utf-8'
$env:PYTHONDONTWRITEBYTECODE = '1'
.\.venv\Scripts\python.exe artifacts/architecture-audit-2026-10-07/probe_backend.py
node artifacts/architecture-audit-2026-10-07/probe_mobile.cjs
```

The Python probe selects a synthetic test URL internally and blocks SQLAlchemy engine connections. The JavaScript probe mocks all fetch and native APIs. Neither command fixes the defects or contacts external services.

No full backend suite, production image build, production/staging CI run, native purchase flow, browser visual pass, load test, or restore drill was run for this review. No new release gate was added and no fixes were applied, so no fix-removal/mutation-gate claim is made. Follow-up regression gates must include that negative control and a written blind-spot statement.

The starting worktree was clean. Deliverables are this report and the isolated probes under `artifacts/architecture-audit-2026-10-07/` (the repository ignores artifacts by default).
