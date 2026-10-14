# Vinaadi AI — detailed architecture findings and solutions

Date: 7 October 2026  
Baseline reviewed: `3ed90e076dc9e418d78e0d7297024e8e3885ab7d`  
Companion evidence report: [Architecture audit](ARCHITECTURE_AUDIT_2026-10-07.md)

This is the standalone explanation and implementation guide for all 16 findings from the architecture audit. It also expands the audit's observations about performance, security, privacy, testing, internationalisation, AI integration, and operations.

**Status: proposed remediation.** The solutions below have not been implemented or validated as fixes. The audit's demonstrations establish specific existing behaviours; they do not prove the proposed replacement designs. No application code, database, provider configuration, or deployment was changed while preparing this guide.

## Contents

- [1. Overall architectural assessment](#1-overall-architectural-assessment)
- [2. Priorities and evidence](#2-priorities-and-evidence)
- [3. Detailed findings and solutions](#3-detailed-findings-and-solutions)
  - [A01: Deployment configuration mismatch](#a01-deployment-configuration-mismatch)
  - [A02: Mobile account cache isolation](#a02-mobile-account-cache-isolation)
  - [A03: Refresh-token replay revocation](#a03-refresh-token-replay-revocation)
  - [A04: Purchase identity lifecycle](#a04-purchase-identity-lifecycle)
  - [A05: Subscription webhook consistency](#a05-subscription-webhook-consistency)
  - [A06: Rate limiting during Redis failure](#a06-rate-limiting-during-redis-failure)
  - [A07: Persisted-query filtering](#a07-persisted-query-filtering)
  - [A08: Unbounded mobile refresh retries](#a08-unbounded-mobile-refresh-retries)
  - [A09: Scheduler leadership and failover](#a09-scheduler-leadership-and-failover)
  - [A10: Durable notification delivery](#a10-durable-notification-delivery)
  - [A11: Transaction ownership and dashboard isolation](#a11-transaction-ownership-and-dashboard-isolation)
  - [A12: Sensitive information in derived fields](#a12-sensitive-information-in-derived-fields)
  - [A13: Module boundaries and large orchestration units](#a13-module-boundaries-and-large-orchestration-units)
  - [A14: API contract completeness](#a14-api-contract-completeness)
  - [A15: CI and integration-test coverage](#a15-ci-and-integration-test-coverage)
  - [A16: Conflicting authoritative documentation](#a16-conflicting-authoritative-documentation)
- [4. Cross-cutting improvements and remaining assurance work](#4-cross-cutting-improvements-and-remaining-assurance-work)
- [5. Recommended target architecture](#5-recommended-target-architecture)
- [6. Implementation sequence and completion checklist](#6-implementation-sequence-and-completion-checklist)
- [7. Verification record and limitations](#7-verification-record-and-limitations)
- [8. Glossary and references](#8-glossary-and-references)

## 1. Overall architectural assessment

### What is appropriate today

The fundamental stack fits the application: FastAPI and PostgreSQL for authenticated services and durable records, Next.js for the website, Expo for mobile, and shared TypeScript packages for common contracts and presentation logic. A single backend deployment is a reasonable choice for this product.

There are useful existing boundaries and safeguards:

- Astrology calculation and reasoning code are largely separated from HTTP routing.
- Shared authentication and chart-ownership helpers reduce duplicated access checks.
- Token versions support revocation; refresh rotation uses a conditional database update.
- Quota reservation uses database operations instead of a process-local counter.
- Encryption and key rotation are implemented, including encrypted mobile storage.
- Backend dependency versions and the JavaScript workspace dependency graph are locked.
- Migration round-trips, doctrine/golden tests, display-boundary tests, and API-contract guards already exist.
- Design tokens, localisation helpers, and browser audit phases provide a foundation for consistent presentation.

The problems are concentrated where two components must agree: the deployment and its application configuration; the session and its cache; the application user and purchase SDK user; the HTTP response and database commit; the database and an external notification provider.

### What needs to change

The architectural objective should be to make each of those agreements explicit, testable, and owned by one component. Directory separation alone does not ensure that a rule is enforced.

For example, “sign out” should be an application operation with a defined end state. It currently appears in several places as smaller actions such as clearing tokens, changing React state, and navigating. Those actions do not collectively guarantee that cached private data, pending requests, and purchase identity belong to the next account.

Likewise, “notification sent” should describe a durable delivery state. Calling a provider and subsequently updating a database row leaves a failure window between the two actions.

The recommended direction is a **modular monolith**: retain one backend, organise it around clear business capabilities, and enforce dependency and transaction rules. Introduce specialised infrastructure only when a measured requirement justifies it.

### Size and interpretation

The audit inventoried 1,640 tracked Python, TypeScript, TSX, and CSS files across application, client, shared-package, test, and migration directories: 386,582 physical lines. These counts include comments, static content, styles, and tests. They do not imply that every line is complex or that every line was manually inspected.

Large static translation or doctrine tables can be entirely appropriate. Large functions that combine database access, business decisions, formatting, and side effects are more concerning because one edit affects several responsibilities.

## 2. Priorities and evidence

### Priority definitions

**P1 — high priority:** a significant correctness, confidentiality, security, or deployment issue in the affected flow. Resolve before relying on that flow in a release. A billing finding matters when the relevant purchase integration is enabled; it is not evidence that every current user has been charged incorrectly.

**P2 — planned remediation:** a material reliability, data-protection, or maintainability weakness. These deserve scheduled work and explicit acceptance criteria, even when no production incident was observed.

### Evidence definitions

**Demonstrated:** an isolated probe executed current application functions or library behaviour, with database/network/native boundaries mocked or blocked as described. It establishes the narrow behaviour exercised.

**Source-confirmed:** the relevant paths and configuration were inspected. The consequence follows from those paths, but the full production/device scenario was not executed.

**Requires measurement:** a plausible capacity, performance, operational, or assurance concern. It must not be reported as a measured outage or a proven user-capacity limit.

| ID | Priority | Main issue | Evidence |
|---|---|---|---|
| A01 | P1 | Web deployment passes the wrong configuration variable | Configuration probe |
| A02 | P1 | Private mobile query data survives an account transition | Isolated source/library demonstration |
| A03 | P1 | Replay-triggered refresh-token revocation rolls back | Actual handler/dependency with mocked session |
| A04 | P1 | Purchase SDK identity does not follow every login/logout | Source-confirmed lifecycle gap |
| A05 | P1 | Old webhook events can overwrite newer subscription state | Actual handler with mocked session |
| A06 | P1 | Redis errors cause rate-limit checks to allow requests | Actual limiter with injected outage |
| A07 | P2 | Persistence filter checks the wrong envelope level | Actual persister/library demonstration |
| A08 | P2 | Resource 401 responses can cause repeated refresh loops | Actual client with mocked fetch |
| A09 | P2 | Scheduler election lacks takeover and loss detection | Source-confirmed failure paths |
| A10 | P2 | Provider delivery and database state are not coordinated | Source-confirmed failure window |
| A11 | P2 | Per-section exception handling shares one fallible transaction | Source-confirmed transaction structure |
| A12 | P2 | Plain derived timestamp reveals encrypted birth date/time | Schema/write-path analysis |
| A13 | P2 | Dependency inversions and large orchestration units | Structural analysis and source review |
| A14 | P2 | Handwritten contracts leave response-schema gaps | Existing checks: nine skips |
| A15 | P2 | CI omits important mobile and deployment behaviours | Workflow inspection |
| A16 | P2 | Current instructions contradict implementation and rulings | Cross-checked documentation/source |

## 3. Detailed findings and solutions

## A01: Deployment configuration mismatch

**Priority:** P1. **Area:** deployment and availability.

### Problem and evidence

[docker-compose.app.yml](../docker-compose.app.yml), line 154, configures the web service with `API_BASE_URL`. The [Next.js backend proxy](../web/app/api/backend/[...path]/route.ts), line 3, reads `BACKEND_URL`. Its fallback is `http://127.0.0.1:8000`.

Several server-rendered pages also use `BACKEND_URL`. The reviewed web configuration does not translate `API_BASE_URL` into `BACKEND_URL`.

A container has its own network context. Localhost inside the web container means the web container itself. FastAPI is running in the separate `api` container, so the fallback is not a route to FastAPI.

### Example failure

The stack starts, and the homepage returns HTTP 200. A user then attempts to log in. The request reaches Next.js, which tries to contact port 8000 in its own container. The backend connection fails even though the API container may be healthy.

This explains why “the image builds” and “the homepage loads” are insufficient deployment checks.

### Recommended solution

Use one server-only configuration name consistently. Retaining `BACKEND_URL` is the smallest change because existing web consumers already read it.

Proposed Compose setting:

```yaml
environment:
  BACKEND_URL: ${BACKEND_URL:-http://api:8000}
```

This is a proposed edit, not a change already applied. It should remain server-only; a `NEXT_PUBLIC_*` variable is not needed for communication between Next.js and FastAPI.

### Implementation steps

1. Enumerate every backend-base-URL reader in the web app and every setting supplied by local development, Compose, CI, and hosting configuration.
2. Align those settings around one name. If compatibility with a deployed alternate name is needed, make the transitional alias explicit and warn on conflicting values.
3. Validate the configured URL's format when the runtime starts. Production should not silently substitute a development default for a missing required setting.
4. Keep build-time and runtime validation distinct: building static assets should not unnecessarily require a live production API.
5. Add a full-stack smoke that reaches `/api/backend/health/ready` through the built web service.
6. Exercise a synthetic authenticated read against isolated test infrastructure.

### Tests and completion criteria

The smoke must fail when the configuration mismatch is reintroduced. It must exercise DNS/container networking and the proxy, rather than mocking `fetch` or inspecting an environment object alone.

Also test a backend outage: the web app should return a bounded, recognisable error. Do not treat a successful homepage check as proof of backend connectivity.

**Rollout:** small application/configuration change with a large availability impact. Record the previous environment settings for rollback, but do not restore the broken combination. No database migration is needed.

## A02: Mobile account cache isolation

**Priority:** P1. **Area:** privacy and session correctness. **Related:** A04, A07, A08.

### Problem and evidence

The [mobile query client](../mobile/src/lib/queryClient.ts) is shared for the app process. The [root layout](../mobile/app/_layout.tsx) mounts the persistent query provider above the session provider. [clearSession](../mobile/src/state/sessionContext.tsx) changes React session state, and the [Me screen](../mobile/app/(tabs)/me.tsx) clears credentials and selected-profile preferences. These paths do not clear the query cache or persisted query client.

The [family-vault screen](../mobile/app/family-vault.tsx), line 505, uses `["family-vaults"]` as a key. It does not include the account ID and considers the result fresh for five minutes.

### Why this matters

A query key is the identity of cached data. If A and B use the same key, the cache treats their responses as the same resource unless something explicitly resets or partitions it.

An isolated probe populated the family-vault key for synthetic account A, invoked the current session transition functions, and requested that key for B. The cache returned A's value without executing B's query function. The probe did not render the native screen; source inspection supplies the connection to the actual UI lifecycle.

Encrypting the cache on disk protects stored bytes. It does not tell the running app which account may read the decrypted data.

### Recommended solution

Create one session-lifecycle coordinator. It should own login completion, explicit logout, terminal token expiry, account deletion, and switching accounts. Every entry point should use the same coordinator.

The invariant is:

> Private state created under identity A must never be readable or writable under identity B, including delayed asynchronous work.

### Implementation steps

1. Give each active session an identity and generation number. Increase the generation immediately when ending or replacing a session.
2. Mark the app as transitioning and prevent new private queries or mutations from starting.
3. Cancel account-owned queries and abort requests where possible. A request that cannot be physically cancelled must still be prevented from publishing results after its generation becomes obsolete.
4. Stop or detach old persistence subscriptions, account for queued writes, and remove old private memory and persisted data. Clearing storage once is insufficient if an earlier asynchronous write can repopulate it afterward.
5. Clear credentials under the same lifecycle coordination used by refresh. A late refresh must not restore credentials after logout.
6. Reset account-dependent SDK state through adapters, including purchases and analytics. Remote revocation or SDK failure must not prevent local private-state removal.
7. For the new account, establish credentials and identity before restoring its private cache or enabling queries.
8. Include the authenticated user ID in private query keys, for example `["user", userId, "family-vaults"]`.
9. Use an account-specific persistence namespace and a schema/version buster. Keep genuinely public cache data explicitly separate.

Illustrative lifecycle:

```text
authenticated(A, generation 8)
    → transitioning(generation 9; old work cannot publish)
    → private state removed; credentials cleared
    → signed out
    → authenticating B
    → authenticated(B, generation 10; B-scoped cache enabled)
```

### Tests and completion criteria

Test A→logout→B within five minutes, app restart with persisted A data, logout while offline, logout during a delayed query, and logout during refresh. Verify visible data, cache contents, stored state, and request completion handlers.

Also test failed login: it must not restore a previous account's private state. An authenticated UUID in a query key is isolation metadata, not an authorization substitute; the server must continue checking ownership.

**Rollout:** deploy with a persistence-version change that discards the unsafe legacy cache. This loses cached convenience, not server records. Document the temporary offline-data impact. Do not migrate old account-ambiguous data into a new user's namespace.

## A03: Refresh-token replay revocation

**Priority:** P1. **Area:** authentication security and transactions.

### Problem and evidence

In [mobile_auth.py](../app/api/mobile_auth.py), the revoked-token branch updates the user's active refresh tokens and raises HTTP 401. The [database dependency](../app/db/session.py) rolls back on exceptions.

The intended behaviour is to reject the reused token and persist the protective revocation. The implemented transaction treats the entire request as unsuccessful, so it also discards the revocation.

The audit invoked the actual handler and dependency with a mocked session. It observed one revocation update, zero commits, and one rollback. Persistence must still be verified with a real PostgreSQL integration test.

### Example failure

An old refresh token has already been rotated. It is presented again, which triggers the theft-detection branch. The caller gets 401 and the log records a theft signal. However, successor refresh tokens that should have been revoked remain usable because the transaction was rolled back.

The returned error and the durable security state disagree.

### Recommended solution

Treat incident revocation as a successful security operation whose durable result must survive the rejected request.

Define an explicit transaction boundary around that operation. Commit only the intended revocation and any associated incident record before returning the 401. Do not add a generic “commit on HTTP errors” rule to `get_db`; other failed requests rely on rollback to prevent partial writes.

### Implementation steps

1. Isolate the replay-revocation operation so its transaction cannot accidentally include unrelated pending changes.
2. Decide whether the operation uses the handler's narrowly scoped session or its own dedicated unit of work. Document that choice. Verified for `mobile_auth.py`'s current refresh handler specifically: the only prior database activity before the replay branch is a read, so a plain `db.commit()` immediately after the revocation update and before raising `HTTPException(401)` is sufficient there — nothing unrelated is pending to leak into that commit. The "dedicated unit of work" alternative is a hedge for a call site that does have earlier pending writes in the same session, not a requirement for this endpoint; do not add that heavier structure here by default.
3. Persist revocation, confirm commit success, then emit the rejection response.
4. If the security write fails, report an operational failure rather than logging that revocation succeeded.
5. Preserve the existing conditional refresh-token claim. The benign concurrent-refresh loser and a later replay are intentionally different cases.
6. Define the security policy for already issued access tokens. Incrementing `token_version` would extend revocation to those tokens; that is a policy change, not an incidental implementation detail.
7. Review issuance/revocation concurrency. For a stronger “no valid successor after replay handling” invariant, use shared user/token-generation coordination across issuance and revocation, rather than assuming a bulk update sees future inserts.

### Tests and completion criteria

On `vinaadi_test`, use the real HTTP endpoint to rotate a synthetic token, replay the old token, and attempt refresh with the successor. Read the token rows from a new database session to verify committed state.

Include a simulated revocation-commit failure and a concurrent-refresh test. The existing conditional-update race tests remain valuable but do not prove the replay branch's transaction outcome.

**Rollout:** narrow security fix with no required new table unless a token-family/generation policy is adopted. Add structured incident metrics without recording raw tokens. Explain intentional additional sign-outs if the revocation policy is expanded.

## A04: Purchase identity lifecycle

**Priority:** P1 when purchases are enabled. **Area:** billing and identity. **Related:** A02, A05.

### Problem and evidence

The [root layout](../mobile/app/_layout.tsx), line 102, binds RevenueCat to the backend user during a mount-only startup effect. [Interactive login](../mobile/app/(auth)/login.tsx) updates the app session without making that binding. Sign-out does not clear the purchase SDK identity. The [premium screen](../mobile/app/premium.tsx) purchases using whatever identity the SDK currently holds.

The backend webhook expects a UUID corresponding to an application user. Anonymous or unresolved provider IDs are ignored by the current handler.

### Example failure scenarios

On a fresh launch while signed out, the SDK can start anonymously. The user then signs in and purchases without restarting the app. If the SDK still uses that anonymous ID, the webhook cannot map the purchase to the backend account.

Alternatively, the app launches as A, then switches to B. The backend session belongs to B, but the SDK may still belong to A. A local premium UI update does not repair this identity mismatch.

These are source-supported scenarios. Actual receipt ownership and transfer behaviour depend on RevenueCat configuration and platform rules; no native purchase was performed during the audit.

### Recommended solution

Make billing identity a managed part of the session lifecycle. Permit purchase and restore only when the purchase adapter confirms it is ready for the current authenticated UUID.

Keep three concepts distinct:

| Concept | Owner |
|---|---|
| Who is signed in | Application authentication |
| Who the provider SDK is acting for | Purchase adapter |
| What server capabilities the account has | Backend entitlement projection |

### Implementation steps

1. Move purchase identity transitions behind a small adapter used by the coordinator from A02.
2. Serialize or generation-guard SDK transitions so a slow login for A cannot overwrite a later transition to B.
3. Track explicit states such as unavailable, syncing, ready-for-user, and failed. SDK absence in an unsupported development environment should remain distinguishable from a real identity error.
4. On logout, clear billing readiness immediately and perform the SDK's supported transition away from the identified user. Verify anonymous-state behaviour against the installed SDK before invoking logout blindly.
5. Before purchase/restore, verify that billing readiness still belongs to the active user.
6. After provider success, reconcile server entitlements. If processing is delayed, show a bounded pending state instead of presenting a local premium flag as proof of backend access.
7. If reconciliation requires a new endpoint, add its shared wrapper and update backend, shared, web, and mobile contracts together.

### Tests and completion criteria

Use mocked lifecycle tests plus RevenueCat sandbox scenarios: fresh-install login→purchase, A→B switch, restore, SDK offline, identity-sync failure, and delayed webhooks. Assert app UUID, SDK identity, and backend entitlement ownership together.

**Rollout:** review configured alias/transfer rules first. Do not perform an automatic bulk transfer of existing purchases based only on this code review. Reconcile affected accounts through provider-backed evidence.

## A05: Subscription webhook consistency

**Priority:** P1 when billing events affect access. **Area:** event processing and data integrity.

### Problem and evidence

[webhooks.py](../app/api/webhooks.py) applies incoming event types directly to the first subscription row found for the user. It does not persist event IDs or use event timestamps to detect stale processing. The [subscription model](../app/models/subscription.py) does not enforce uniqueness for a defined logical provider-subscription or user-entitlement projection.

The audit delivered a newer renewal and then an older expiration to the actual handler with a mocked database session. The subscription changed from active to inactive even though both payloads contained timestamps.

The current write also stores `product_id` in a field named `provider_subscription_id`. A product/SKU is not sufficient by itself to identify a user's distinct subscription history. A corrected identity model must be defined from the provider's actual guarantees.

### Root cause

A webhook is a delivered message about something that happened. Delivery order is not a reliable substitute for authoritative subscription state. Retries can also deliver the same message more than once.

The handler currently combines receiving a message, deciding entitlement, and updating the application state without recording enough information to safely repeat or reconcile that work.

### Recommended solution

Use a **webhook inbox** and an **idempotent entitlement projection**. The inbox durably records authenticated events. A processor updates the application's entitlement view according to a documented policy, preferably reconciling current provider state where that simplifies event semantics.

Proposed logical records, requiring schema design before implementation:

| Record | Essential responsibilities |
|---|---|
| Webhook inbox | Unique event identity within its integration source; receipt time; processing state; retry information; minimal necessary payload |
| Provider subscription | Correct provider/store subscription identity; owning account; product; paid period; provider status |
| Account entitlement | The effective capabilities derived from all relevant subscriptions and product rules |

### Implementation steps

1. Define identity and uniqueness. Distinguish provider project/source, event ID, app user UUID, product SKU, and subscription identity.
2. Authenticate and validate the event before accepting it. Existing constant-time secret comparison is worth preserving.
3. Insert into the inbox atomically. A duplicate event ID should not create duplicate work. Return success only after durable acceptance; if acceptance fails, let the provider retry.
4. Resolve account ownership. Unknown users or transfers should have an explicit observable disposition, including a reconciliation path where appropriate.
5. Reconcile current provider state or apply a carefully specified event state machine. Handle cancellation, expiry, refunds, product changes, trials, aliases, and transfers explicitly.
6. Serialize updates for the same logical subscription/account. Avoid holding a database transaction open across slow provider calls; use bounded work claims and version/generation checks when publishing a fetched result.
7. Add periodic or on-demand reconciliation to recover from missed events.
8. Add a uniqueness migration only after inspecting and resolving duplicate existing rows with a deterministic, reviewed policy.

A single `event_timestamp > last_timestamp` check is not a complete solution: timestamps and event meanings must be interpreted consistently, and multiple underlying subscriptions can contribute to one account's access.

### Tests and completion criteria

Exercise duplicate events, expiry-before-renewal delivery, renewal-before-old-expiry delivery, two concurrent initial events, process interruption after inbox commit, and interruption during projection update. Test more than one subscription/product where supported.

Observe duplicate count, unresolved events, processor delay, reconciliation failures, and entitlement discrepancies. Do not log raw receipt or authentication material.

**Rollout:** use additive tables/fields, backfill or reconcile existing state, and compare the proposed projection before making it authoritative. Preserve the existing paid-period cancellation semantics. Historical events must not unexpectedly revoke a currently verified entitlement.

## A06: Rate limiting during Redis failure

**Priority:** P1. **Area:** abuse prevention and availability.

### Problem and evidence

[RedisRateLimitBackend.check](../app/core/rate_limit.py) returns `allowed=True` after a Redis exception. [AuthThrottler](../app/core/auth_throttle.py) uses that backend for login, registration, password reset, and admin elevation.

An injected Redis failure allowed all three probe requests despite a limit of one. The startup worker-count guard covers an important configuration case, but not this runtime failure path.

Readiness detects a required Redis failure. However, marking a container unhealthy does not by itself remove it from the reviewed nginx→web→API request path.

### Why the design is problematic

Redis serves two different purposes here: improving performance through caching, and enforcing a security rule through shared counters. A cache failure can reasonably trigger recomputation. A security-counter failure cannot automatically mean that unlimited attempts are safe.

### Recommended solution

Represent limiter outcomes as allowed, denied, or unavailable. Let the protected operation choose a documented unavailable policy.

For authentication and privileged actions, the recommended policy is a bounded temporary-unavailability response when the authoritative control cannot be evaluated. A carefully designed degraded limiter is an alternative, but per-process fallback must not silently multiply limits across replicas.

### Implementation steps

1. Separate the limiter result from the endpoint's failure policy.
2. Return a distinct unavailable outcome for Redis errors and record a bounded metric/log entry.
3. Map unavailable security controls to an appropriate temporary failure, typically 503 with retry guidance. Do not use 401: the user's credentials have not been proven invalid. Reserve 429 for an actual exceeded limit.
4. Ensure mobile/web error handling does not sign the user out on this temporary response.
5. Retain a bounded outer edge rate limit, but treat it as a separate protection with a different purpose.
6. Wire readiness into actual traffic routing where the hosting platform supports it. Document the behaviour when every instance is unready.
7. Test Redis recovery and ensure the process does not remain permanently degraded without an intentional recovery/restart policy.

### Tests and completion criteria

Test an outage after healthy startup through the public ingress. Attempt repeated login and admin-elevation requests, and verify enforcement or temporary rejection. Test that ordinary cache misses still degrade as designed.

**Tradeoff:** rejecting protected operations during a Redis outage reduces availability. Allowing unlimited authentication attempts reduces security. This decision should be deliberate and operation-specific, with alerting and a recovery procedure.

**Rollout:** expose enforcement-degraded metrics first, then deploy the policy and client error handling together. Include a runbook for a Redis outage; do not rely only on a health endpoint.

## A07: Persisted-query filtering

**Priority:** P2. **Area:** device data retention. **Related:** A02.

### Problem and evidence

[encryptedQueryPersister.ts](../mobile/src/lib/encryptedQueryPersister.ts), line 33, checks `clientState.queries` on the argument it receives. The real argument is a persisted-client envelope:

```text
PersistedClient
    timestamp
    buster
    clientState
        queries
        mutations
```

The filter is inspecting the envelope as if it were its nested `clientState`. It therefore returns the original value without filtering. The audit used the installed query library's dehydration output and confirmed that a sensitive profile query remained.

The use of `any` at the boundary allowed the incorrect shape to compile. The denylist's substring matching also makes retention depend on query naming conventions.

### Impact

Data intended to be excluded is retained in encrypted device storage. This is a retention-policy defect, not evidence that the encryption algorithm stores plaintext. Account isolation is a separate requirement addressed by A02.

### Recommended solution

Type the boundary using the installed library's actual persister/persisted-client types. Define persistence as an explicit opt-in policy, preferably before serialisation through supported dehydration options, with defensive validation during restore.

### Implementation steps

1. Replace the custom `any` interface with the appropriate library types, verifying their export location in the installed package version.
2. Either filter `envelope.clientState.queries` correctly or use the provider's supported dehydration filter. Avoid two competing policy implementations.
3. Add explicit metadata indicating whether a query may persist. Default unknown queries and mutations to not persisted.
4. Classify public data separately from account-scoped private data. Persist private data only where offline behaviour and retention are intentionally specified.
5. Validate restored envelope shape, schema version, account scope, age, and allowed query categories.
6. Align persistence maximum age, in-memory collection timing, and query freshness. These settings answer different questions.
7. Bump the persistence schema/version and discard the old cache so already-retained data is not silently carried forward.

### Tests and completion criteria

Use actual dehydration and restore shapes. Include public queries, private queries, unknown names, malformed data, obsolete versions, another account's namespace, and mutation state. Inspect the decoded persisted payload rather than merely verifying that encryption was called.

**Rollout:** cache invalidation should cause a controlled refetch and a clear offline-empty state. Do not delete credentials or unrelated device preferences as part of a query-cache migration.

## A08: Unbounded mobile refresh retries

**Priority:** P2. **Area:** networking and session stability. **Related:** A02, A03.

### Problem and evidence

[fetchWithAuth](../mobile/src/api/client.ts), line 100, calls itself after successful token refresh. There is no marker indicating that this request has already retried. A persistent resource 401 can therefore trigger repeated token rotations.

The probe allowed four refresh successes, then deliberately failed the fifth refresh. It observed five protected-resource requests and five refresh attempts. That stopping condition came from the probe, not the client.

### Recommended solution

Use a bounded request state machine: make the request, optionally refresh once, replay once, then return a terminal outcome. Preserve the existing single-flight mechanism so simultaneous requests can share one refresh.

### Implementation steps

1. Track whether the request has consumed its single refresh opportunity. Keep that marker internal to the client.
2. Capture the session generation and token used for the first request.
3. On 401, check whether another request already rotated that token. Where safe, replay with the newer token without starting another refresh.
4. Otherwise join or initiate the single refresh for that session generation.
5. Before storing refreshed credentials or replaying, verify that the session generation still matches.
6. If the replay still returns 401, stop. Route the terminal authentication result through the complete session cleanup from A02.
7. Add deadlines and cancellation for both refresh and resource requests. A deadline must include retry behaviour rather than quietly restarting on every attempt.
8. Distinguish rejected credentials from network failure or service unavailability. A temporary outage does not prove that a refresh token is invalid.

Proposed decision flow:

```text
request → success/error other than 401 → return
        → 401 → already retried? → terminal auth outcome
              → session changed? → discard obsolete work
              → refresh once → replay once → return or terminal auth outcome
```

### Tests and completion criteria

Test persistent 401, expired refresh, refresh service 503, offline mode, a hung refresh, several simultaneous 401s, and logout while refresh is pending.

Verify call counts, token writes, final session state, and visible retry messages. For mutating requests, assess whether replay is safe: retrying a request with an uncertain outcome may need an idempotency key rather than automatic replay. A server-rejected authentication attempt and a network timeout after execution are different cases.

**Rollout:** no backend schema change is required for bounded auth replay. Any new operation-idempotency contract must be implemented across clients and backend together.

## A09: Scheduler leadership and failover

**Priority:** P2. **Area:** background-work availability.

### Problem and evidence

[worker.py](../app/worker.py) attempts leader acquisition once. A follower then waits indefinitely. [SchedulerLease](../app/core/leader_lock.py) retains a PostgreSQL connection holding a session-level advisory lock, but does not subsequently check whether it still holds leadership. The API-hosted scheduler follows a similar startup-only pattern.

The lock prevents competing schedulers at acquisition time. It does not, by itself, provide promotion, failure detection, or recovery of missed work.

### Failure scenarios

- The leader exits, while a follower remains running. The follower never retries acquisition.
- The database connection holding the lock disappears, but the process continues scheduling jobs. Another process can acquire the released lock while the old scheduler still runs.
- A process is unavailable during a scheduled window. Starting later does not automatically define whether that work should be caught up or skipped.

These are source-derived scenarios. The audit did not interrupt a real deployment.

### Recommended solution

At the current scale, assign scheduling to one explicitly supervised worker process and make health/leadership observable. Add replicated failover only if the operational requirement warrants it.

### Implementation steps

1. Pick and document the deployment mode: scheduler in API for a single-box configuration, or dedicated worker for the intended production configuration. Avoid ambiguous mixed ownership.
2. Add a heartbeat indicating the last successful scheduler cycle and the actual leader state.
3. Detect loss of the lock-owning connection. Stop scheduling new work and fail the worker so supervision can recover it.
4. If followers are deployed, retry acquisition with bounded backoff and jitter rather than idling forever.
5. Make individual jobs claim durable logical work, using unique keys or transactional claims. Scheduler leadership alone is insufficient protection for outward effects.
6. Define catch-up and expiry semantics per job. Yesterday's time-sensitive notification may be inappropriate to send today even if it was missed.
7. Give worker health a worker-specific probe. An HTTP API health check cannot establish that a scheduler is making progress.

### Tests and completion criteria

In isolated infrastructure, stop the leader, break its DB connection, restart PostgreSQL, and start two candidate workers. Verify recovery within the agreed bound, no simultaneous ownership of the same logical job, and correct handling of missed windows.

A heartbeat check can detect a lost connection after a delay. It cannot cancel an already accepted external provider request. Durable work claims and A10's delivery model are still required.

**Rollout:** establish one owner first; then add failure detection and recovery. Do not enable extra scheduler replicas before job idempotency is tested.

## A10: Durable notification delivery

**Priority:** P2. **Area:** asynchronous consistency and user experience.

### Problem and evidence

[notification_dispatch_service.py](../app/services/notification_dispatch_service.py) calls push/email providers before the final notification outcome is committed. [daily_push_cron.py](../app/services/daily_push_cron.py) commits afterward. The queued onboarding selection reads `queued` rows without an atomic work claim, and rows marked failed are outside that selection on the next cycle.

This creates both duplicate-delivery and lost-retry risks.

### Example failure

The provider accepts a push. The application then crashes before recording success. On restart, the database still says the work has not completed. Sending it again may produce a duplicate.

For a two-channel notification, push can succeed and email can fail. A single overall status cannot fully describe which channel needs retrying.

### Recommended solution

Use a PostgreSQL **transactional outbox** and per-channel delivery records. A new message broker is not necessary to implement the initial design.

The outbox records the intent to deliver in a committed transaction. A worker claims that work, performs external I/O, and records the outcome with retry information.

### Proposed logical model

| Entity | Purpose |
|---|---|
| Notification intent | Stable message identity, recipient, content reference, logical event/date, expiry, preference policy |
| Channel delivery | One push/email delivery for an intent; unique intent/channel pair; state, attempt count, next attempt, claim owner/expiry |
| Delivery attempt | Optional bounded history of provider outcome, timing, and safe diagnostic classification |

Keep in-app inbox visibility, push acceptance, email acceptance, and actual user reading as separate concepts. Provider acceptance does not prove that a user saw a message.

### Implementation steps

1. Choose a unique logical notification key, such as recipient + event identity + relevant local date. Do not use a random new UUID as the only deduplication rule for repeated job runs.
2. Persist intent transactionally with the event or schedule decision that creates it.
3. Claim eligible deliveries atomically in small batches. Commit the claim before external calls so DB locks are not held during network waits.
4. Record per-channel outcomes and provider references where safe.
5. Retry transient failures with bounded exponential backoff and jitter. Treat invalid device tokens and permanent rejections separately.
6. Use claim expiry to recover work from a crashed worker, and ensure a stale worker cannot overwrite a newer claim's result.
7. Apply notification expiry, opt-out/preferences, and smart-silence policy at explicitly documented stages, including before delayed delivery.
8. Expose exhausted attempts for review and controlled replay.

### Guarantees and limits

An outbox makes delivery intent durable. It does not create exactly-once delivery across a database and an arbitrary provider. If the provider has accepted a request and the response is lost, retrying can still duplicate it unless the provider supports a suitable idempotency mechanism.

Document that residual ambiguity and use stable provider idempotency keys where available. Do not promise exactly-once delivery solely because a row is unique locally.

### Tests and completion criteria

Inject interruption before send, after provider acceptance, before outcome commit, and after claim expiry. Test two workers, partial channel success, expired notifications, user opt-out, and invalid device tokens.

**Rollout:** add the new model alongside existing records and establish a delivery cutoff. Do not reinterpret every historical failed/queued row as new work or resend historical successful messages during migration. Test reversibility and preserve audit history.

## A11: Transaction ownership and dashboard isolation

**Priority:** P2. **Area:** consistency and graceful degradation.

### Problem and evidence

The dashboard's [safe helper](../app/services/dashboard_bundle_service.py), line 73, catches exceptions and returns `None` for the failed section. All sections share one database session, including cache-writing operations. The request dependency commits at the end.

Some other services, including [birth_profile_service.py](../app/services/birth_profile_service.py), commit internally. Transaction ownership therefore varies across entry points and service functions.

### Why catching an exception is insufficient

A pure calculation error can be contained by returning an unavailable section. A database error can leave the transaction in an aborted or rollback-required state. Catching the Python exception does not repair that transaction.

The next section may then fail because of the previous error, and final request completion can fail as well. A helper intended to isolate one card cannot guarantee that behaviour while all cards share an unrecovered database transaction.

### Recommended solution

Define a **unit of work** for each application use case. That boundary owns commit/rollback. Lower-level services should normally add, query, and flush within that boundary rather than deciding when unrelated work becomes permanent.

For the dashboard, separate the required data snapshot, deterministic section computation, and optional cache persistence.

### Implementation steps

1. Classify sections and dependencies as required or optional. A failure to load the owned chart is different from a failure to cache a derived result.
2. Load a coherent authorised input snapshot at the use-case boundary.
3. Run computations over explicit inputs where feasible, without hidden DB side effects.
4. Isolate optional cache writes in deliberate savepoints or separate short units of work, according to required consistency.
5. Do not blindly wrap the current shared session in `begin_nested()` around every helper: beginning a savepoint always flushes pending state first, so unrelated pending changes must be understood. This collision is direct, not theoretical, in this codebase: `app/db/session.py` configures the sessionmaker with `autoflush=False` specifically so writes do not hit the database until the application chooses. `Session.begin_nested()` flushes unconditionally regardless of that setting, so wrapping a helper in it silently reintroduces the autoflush-like behaviour the team turned off and can commit-adjacent state the surrounding code still expects to stay pending.
6. Treat connection loss/required-database failure as an unavailable request where appropriate. A savepoint cannot repair an unavailable connection.
7. Return structured section failure information for legitimate partial results, preserving the existing envelope or coordinating contract changes across all consumers.
8. Gradually remove internal service commits from composable paths, with explicit exceptions such as A03's durable security operation.

### Tests and completion criteria

Use real PostgreSQL constraint/statement failures, not only `raise ValueError()` mocks. Verify that an optional cache failure leaves the intended other sections usable, that required DB failure returns the chosen whole-request error, and that no partial business mutation was committed unexpectedly.

**Rollout:** refactor one use case at a time. Before moving a commit, document what previously depended on its timing, including background work and response construction. Preserve authorization checks and snapshot consistency.

## A12: Sensitive information in derived fields

**Priority:** P2. **Area:** privacy and encryption design.

### Problem and evidence

[BirthProfile](../app/models/birth_profile.py) encrypts local birth date/time but stores `birth_datetime_utc` as a plaintext timestamp and the timezone as a plaintext string. [Chart persistence](../app/services/_chart_persist.py) writes those values together.

For a profile with known birth time, converting the UTC timestamp using that timezone reconstructs the original local birth date/time without decrypting the encrypted columns.

### Threat model

The application's field-encryption design names a leaked database dump as a threat it addresses. A reader of such a dump can still learn the protected date/time from these derived fields.

This finding does not prove that the hosting disks or backups are unencrypted. Infrastructure encryption and application field encryption protect against different access paths. It also does not show that an attacker has obtained a dump.

### Recommended solution

Classify information by what can be inferred from the complete record. Then decide whether to remove the redundant timestamp, encrypt it, or explicitly accept and document the remaining exposure.

| Option | Benefit | Cost/constraint |
|---|---|---|
| Derive UTC timestamp after decrypting local fields | Removes a redundant representation | Requires checking all consumers and performance assumptions |
| Encrypt the UTC timestamp too | Preserves convenient application access | Removes useful SQL ordering/filtering on the plaintext timestamp; needs migration and rotation support |
| Retain plaintext with an explicit narrower claim | Preserves query behaviour | Does not meet a goal of hiding exact birth date/time from a readable DB dump |

The implementation choice depends on actual consumers. Do not encrypt a field before checking whether SQL filters, ordering, indexes, or operational tools depend on it.

### Implementation steps

1. Inventory direct, derived, cached, and exported copies of birth date/time and location. Include generated narratives and backups in the review scope.
2. Search all reads/writes of the UTC timestamp and record whether each needs database-side computation or only application access.
3. Choose the minimal representation that meets the agreed confidentiality requirement.
4. If changing storage, use an additive compatible migration, validate conversion with synthetic rows, and plan a controlled backfill before retiring legacy data.
5. Preserve null/unknown birth-time semantics. Do not fabricate precision while converting records.
6. Include the field in encryption rotation and restore verification where appropriate.
7. Review legacy snapshots/backups: changing today's schema does not erase plaintext from already-created backups.

### Tests and completion criteria

Inspect raw rows for a synthetic profile and document what can be reconstructed without keys. Test old/new application compatibility, migration upgrade/downgrade, missing/wrong keys, known/unknown times, and a restored encrypted backup.

**Rollout:** this is a data migration with recovery implications. Test it on the dedicated test DB, back up before risky real-data work, keep required historical keys available, and obtain the required scope approval before removing live columns/data. No such mutation is authorised by this document itself.

## A13: Module boundaries and large orchestration units

**Priority:** P2. **Area:** maintainability, testability, and change risk.

### Problem and evidence

At the audited revision:

| Unit | Measured size/structure |
|---|---|
| `build_daily_guidance_response` | 883 physical lines |
| `get_life_areas` | 689 physical lines |
| `assess_marriage_prediction` | 648 physical lines |
| `dashboard-workspace.tsx` | 2,574 lines; 44 state hooks; 23 effects |

There are also concrete dependency-direction problems:

- [calculations/panchangam.py](../app/calculations/panchangam.py) imports an ORM cache model and performs cache SQL.
- [calculations/propensities.py](../app/calculations/propensities.py) imports types from a service module.
- [models/birth_profile.py](../app/models/birth_profile.py) imports storage column types from `services`.

The issue is responsibility coupling, not a rule that every file must be short. Extracted dashboard hooks and chart/daily-guidance helpers already improve the design and should be retained.

### Recommended backend design

Use a **functional core and imperative shell**:

| Layer | Owns | Should not own |
|---|---|---|
| Domain types/calculations | Deterministic inputs, rules, result structures | HTTP responses, ORM sessions, provider clients |
| Application use cases | Authorization context, orchestration, transaction decisions | Low-level provider formats or presentation-specific labels |
| Infrastructure adapters | PostgreSQL, caches, encryption storage types, external clients | Astrology policy decisions |
| API boundary | Validation, status/envelope mapping, dependencies | Large business algorithms |

Infrastructure types can move to a clearly named persistence module; domain result types can move below service orchestration. Physical folder moves should follow a dependency plan, not merely rename the existing coupling.

### Recommended frontend design

Keep server data in feature query hooks. Keep short-lived UI state close to the feature that uses it. Use a reducer or explicit state model for interdependent transitions such as route, selected chart, active overlay, and return destination.

Avoid duplicating query results into manually synchronised component state unless there is a concrete editing or snapshot requirement. A form draft is different from the server's current profile and should be named/handled accordingly.

### Implementation steps

1. Identify responsibilities and invariants in one large function/component before extracting it.
2. Establish representative golden output fixtures and interaction tests. Preserve existing doctrine and product decisions.
3. Extract pure calculation stages with explicit inputs and named outputs. Keep the public function as an orchestration facade initially.
4. Move cache/database access into application/infrastructure adapters without changing numerical outputs.
5. Move shared types downward in the dependency graph; avoid circular import workarounds that merely conceal the inversion.
6. For the dashboard, extract a feature's state, rendering, and mutation invalidation together. Splitting JSX into files without reducing the shared state coupling has limited value.
7. Add a small dependency-direction check with a temporary, explicit baseline for existing violations.
8. Measure testability and change scope, not just line-count reduction.

### Tests and completion criteria

Pure calculations run without a database, request, or provider. Golden results remain unchanged. A profile mutation invalidates documented dependent queries. Navigation/overlay tests cover valid and invalid transitions without requiring unrelated feature state.

Run each new architectural gate against a deliberately restored violation and verify that it fails. Document limitations such as dynamic imports or exceptions in the baseline.

**Rollout:** incremental refactoring after urgent correctness fixes. Keep stable facades while moving internals. Do not combine doctrine changes, API changes, and a large structural extraction in one review unless necessary.

## A14: API contract completeness

**Priority:** P2. **Area:** cross-platform compatibility.

### Problem and evidence

The [shared API client](../packages/shared/src/api/client.ts) transports `unknown`, while wrappers assert their response types. The [web helper](../web/lib/api.ts) casts parsed JSON to a caller-selected generic type. These assertions do not validate the server payload.

The existing contract guards are valuable: 288 checks passed in the targeted run. Nine field-check cases skipped because the OpenAPI response was absent or not concrete. Approximately 99 direct web `apiFetchJson` calls also remain alongside shared wrappers.

Skipped response contracts covered Ashtottari, Chara, conditional dashas, Kalachakra, remedy plan, Shadbala, Varshaphala, Yogini, and daily-status. The first eight lacked a discoverable response schema in the guard; daily-status had no concrete object shape to compare.

### Why this matters

TypeScript can compile a statement that asserts an incorrect payload shape. The app may then render `undefined`, use a wrong enum branch, or misinterpret a nullable field while both client and backend compile independently.

Field-name checks reduce that risk but do not prove every value type, nullability rule, request shape, error response, or runtime semantic.

### Recommended solution

Make the backend's explicit request/response schemas the transport source of truth. Generate client transport types and operations from the actual OpenAPI output. Retain platform-specific web cookie/proxy and mobile bearer/refresh adapters.

### Implementation steps

1. Add accurate concrete response models to the nine skipped operations, preserving their current observable payloads.
2. Verify request aliases, query/path parameters, HTTP verbs, nullable fields, enums, and status codes against actual handlers.
3. Produce a deterministic schema artifact from the application in a controlled build/test environment. Production interactive OpenAPI exposure is not required.
4. Select a generator only after checking the installed toolchain and required transport features; this guide does not prescribe an unverified package/version.
5. Generate into a clearly marked directory. CI should regenerate and fail on unexplained differences.
6. Keep curated domain/display helpers separate from generated transport code.
7. Migrate wrappers and consumers incrementally, following the repository's forward policy for new endpoints.
8. Add runtime validation for unstable provider responses, persisted payloads, and especially consequential inputs. Generated compile-time types alone do not validate bytes received over the network.

### Compatibility and deployment

Mobile clients can remain installed after the backend changes. Prefer additive, compatible changes and explicit deprecation windows. A backend and web deploy occurring together does not update every mobile installation.

Preserve existing endpoints/envelopes while generated wrappers are adopted. Coordinate all four contract surfaces: backend, shared package, mobile, and web.

### Tests and completion criteria

Mutate a field type, enum, nullability, method, and parameter location in controlled negative tests and verify the appropriate failure. Require explicit review for schemas that still cannot be generated/validated.

**Rollout:** close the known schema gaps first. Introduce generation for a small coherent endpoint group, then expand. Do not replace every existing fetch call as unrelated cleanup.

## A15: CI and integration-test coverage

**Priority:** P2. **Area:** release confidence. **Supports:** every other remediation.

### Problem and evidence

The [mobile workflow](../.github/workflows/mobile.yml) performs type checks and linting but does not run Jest. Its path filters omit root lockfile/package-manager and design-token-only changes. The mobile lint script targets `app/`, leaving `src/` outside that script.

The [web-image workflow](../.github/workflows/ci.yml) builds the image and tests the homepage without an API. E2E depends on a configured external base URL. Web coverage thresholds are 20% for lines/functions/statements and 15% for branches.

These are coverage boundaries, not a claim that the existing tests are useless. The missing cross-component checks directly explain how A01 and mobile lifecycle defects can escape.

### Local test evidence

The audit's full mobile run had 117 passing tests and one five-second screen-test timeout. The affected screen suite passed all five tests when rerun with a diagnostic 15-second limit; its first case took 13.6 seconds. The full run also warned about unfinished asynchronous work before exiting.

The diagnostic rerun used `--forceExit`; it cannot establish that the original open-handle problem is solved. Permanently forcing exit would conceal cleanup problems.

### Recommended solution

Create a required validation chain that covers code checks, behavioural tests, and the deployed system's essential connections. Keep optional staging/device exercises as additional assurance, not the only integration evidence.

### Implementation steps

1. Run mobile utility, React-context, and screen suites in CI.
2. Lint `src/` as well as `app/`, with explicit, reviewed handling for existing findings.
3. Include root lockfile, workspace/package configuration, relevant shared packages, design tokens, and workflow configuration in triggering rules.
4. Ensure required-check behaviour is compatible with path filtering: a skipped workflow must not silently remove necessary validation or leave a required status indefinitely pending.
5. Add an isolated full-stack smoke using the built web and API images plus test infrastructure. Exercise the proxy and synthetic authenticated flow.
6. Add the critical multi-step tests described in A02–A08. Static pattern checks are useful ratchets, but they cannot replace the lifecycle tests.
7. Diagnose cold screen-test startup, fake/real timer use, and asynchronous cleanup. Set time budgets from measured stable runs; do not infer a product bug solely from one timeout.
8. Preserve the existing migration round-trip, doctrine checks, dependency audits, and API-contract guards.

### Tests and completion criteria

For every new regression gate, run it once with the fix removed and confirm failure. Record what the gate cannot see. Examples: a mocked proxy test cannot prove container DNS; an encrypted-storage test cannot prove account separation; a schema test cannot prove subscription event ordering.

Track meaningful behaviours and failure paths rather than trying to make one coverage percentage stand for release quality.

**Rollout:** add deterministic jobs and resolve existing instability before marking them required. Give CI jobs bounded timeouts and upload diagnostics on failure. Do not point test automation at `vinaadi_dev`.

## A16: Conflicting authoritative documentation

**Priority:** P2. **Area:** engineering governance and domain-regression prevention.

### Problem and evidence

[AGENT_INSTRUCTIONS.md](AGENT_INSTRUCTIONS.md) gives an obsolete workspace path, says Shadbala is absent, and specifies Kandaka from Lagna. Current code implements Shadbala and the later Moon-based Kandaka ruling. The document's feature recipe also recommends swallowing errors and conflicts with the newer shared-wrapper policy.

Root instructions describe an English/top-level-only UX harness, while the current [harness](../web/scripts/ux-audit-core.mjs) has explicit Tamil and overlay phases.

### Why this is architectural

Documentation labelled authoritative is an input to future design decisions. A contributor or coding agent can follow it precisely and reintroduce a retired doctrine, expand a deprecated pattern, or claim that a completed improvement is missing.

The risk is increased by historical status statements being mixed into active instructions without clear supersession markers.

### Recommended solution

Maintain a short, current engineering reference and a clear decision hierarchy. Keep historical decisions and investigations as dated records linked from that reference.

### Implementation steps

1. Inventory documents designated authoritative and list their conflicting statements.
2. Resolve engineering facts against current source and governing workspace rules. Resolve doctrine against the ratified owner/practitioner decisions; do not infer new doctrine from a refactor.
3. Update current guidance while preserving historical context in dated records or explicit superseded sections.
4. Replace copied route/model/state inventories with generated artifacts or links to current ownership locations where practical.
5. Give major architecture decisions a concise record: context, decision, consequences, superseded decision, and validation evidence.
6. Remove unsafe or obsolete examples from the active feature recipes, including unobservable error swallowing.
7. Review documentation as part of changes to contracts, doctrine, infrastructure, and supported test coverage.

### Tests and completion criteria

A new contributor should be able to determine the current workspace, doctrine, API pattern, and test coverage without resolving contradictory “must follow” statements.

Automate checks for facts that are cheaply verifiable, such as broken local links or generated inventories. Use human review for policy interpretation. A test that merely searches for a replacement sentence does not establish that the underlying contradiction was resolved everywhere.

**Rollout:** documentation-only corrections can be delivered independently. Preserve genuine historical evidence, clearly label superseded conclusions, and avoid changing numerical/domain policy as part of documentation cleanup.

## 4. Cross-cutting improvements and remaining assurance work

The following observations were included in the original audit but are not additional demonstrated P1/P2 incidents. They explain what a complete improvement programme should measure or verify after the concrete fixes.

### 4.1 Performance and capacity

The backend performs significant synchronous astronomical and narrative computation. The dashboard composes several sections sequentially, and daily/range/week operations can overlap in their inputs and work. Swiss Ephemeris access is protected by a lock, which is important for correctness but can affect concurrency.

The database engine is configured for 20 pooled connections plus 10 overflow connections per process. With N independently pooled processes, the configured upper bound is approximately `30 × N`, before other services and operational connections. This is a capacity-planning bound, not a measurement that every process uses all 30 connections.

Recommended work:

1. Benchmark cold and warm requests separately using synthetic representative profiles, dates, household sizes, and locations.
2. Record p50/p95/p99 latency, request concurrency, SQL counts, CPU time, cache hit/miss rates, ephemeris lock wait, and connection-pool occupancy.
3. Trace repeated computation before optimising it. Reuse an immutable request-local snapshot where semantics permit.
4. Establish endpoint-specific budgets and concurrency limits, especially for costly public calculations and provider-backed requests.
5. Tune pools against actual PostgreSQL limits and expected replicas. Increasing worker count alone can worsen database pressure.
6. Consider job-based processing for genuinely long operations only after defining user-visible progress, idempotency, cancellation, and result retention.

No maximum user count or production latency guarantee is supported by the audit. A static code review cannot supply those numbers.

### 4.2 Cache lifetime, capacity, and invalidation

Versioned daily-score and panchangam caches, range reads, and bulk operations are strengths. The generic in-memory cache removes expired entries when they are read but has no global size limit. A workload producing many unique keys may retain expired entries that are never read again.

Give each cache a documented purpose, key, owner, TTL, capacity, invalidation dependencies, and fallback behaviour. Bound memory with a size policy and cleanup mechanism. Consider bounded request coalescing for expensive concurrent misses; avoid introducing a distributed lock without analysing its failure and timeout behaviour.

Test profile/location/focus edits against their dependent caches. A version constant can invalidate a formula change, but it does not automatically represent every user-input dependency.

### 4.3 Authorization and privacy beyond the named defects

Shared auth and ownership checks are valuable. Remaining inline checks and body/query-supplied resource IDs should be reviewed behaviourally using two synthetic users, including soft-deleted profiles, family membership changes, and archived resources.

Do not infer that checking authentication proves authorization to a specific chart. Likewise, a UUID being hard to guess is not an access-control rule.

Extend the privacy inventory to exports, generated reports, notifications, analytics properties, logs, cache rows, and restored backups. Record purpose and retention for each category. This guide is a software-design review, not a legal-compliance certification.

### 4.4 Observability and incident diagnosis

Structured logs, request IDs, central redaction, and health endpoints exist. Build on them with a small, actionable operational signal set:

| Signal | What it helps answer |
|---|---|
| Proxy upstream errors and latency | Can web reach the API reliably? |
| Auth revocation failures | Did a security action actually persist? |
| Limiter unavailable count | Are security controls enforcing their policy? |
| Billing unresolved events and reconciliation lag | Are paid entitlements current? |
| Scheduler heartbeat age | Is scheduled work progressing? |
| Oldest pending delivery and exhausted attempts | Are notifications stuck or repeatedly failing? |
| Dashboard section failure counts | Are partial responses hiding a systemic failure? |
| Pool wait/provider latency | Are slow external operations exhausting request capacity? |

Use bounded-cardinality labels. Raw user IDs, full URLs with personal parameters, tokens, and provider payloads should not become unbounded metric labels or leak into logs. Route templates and classified error codes are generally more useful for aggregate metrics.

Every alert needs an owner, a threshold justified by observed behaviour, a runbook, and a recovery check. Instrumentation that nobody receives or understands is not an operational control.

### 4.5 Date, timezone, and clock semantics

Date-only values, UTC instants, and local civil days are different domain types. Usage accounting currently uses server `date.today()` while describing a local reset boundary. Clarify which timezone actually defines a quota day or month before changing behaviour.

Use named policies and an injected clock for quotas, notifications, current-day caches, and expiry calculations. Preserve user/date semantics across travel and saved-location changes. Test midnight, month boundaries, timezone changes, and DST transitions where applicable.

Do not convert every date-only field into a UTC timestamp: that can shift a calendar date unnecessarily. Keep astrology doctrine and location-specific sunrise rules separate from infrastructure clock choices.

### 4.6 UI design, accessibility, and localisation

The repository has design tokens, primitives, localisation helpers, static guards, and Tamil/overlay browser audit phases. This provides a useful base, but source inspection does not establish a rendered accessibility pass.

Plan visual and interaction checks for key flows in English and Tamil, supported themes, small screens, keyboard navigation, focus handling, reduced motion, and screen-reader labels. Include overlays, error states, loading states, exported reports, and title/ARIA attributes, which visible-text probes can miss.

Preserve the project's design system and owner rulings. Use language-free server keys through the existing localisers. API fields ending in `Name` or `Code` need particular review under the documented display rules.

A13's state refactoring should improve interaction predictability while keeping the existing visual language. No UI redesign is implied by this guide.

### 4.7 AI-provider integration

Existing quota reservation, provider timeout/retry settings, age/life-stage redirects, and output safety handling are strengths. The provider request is synchronous within a database-backed request flow, so provider delays can extend transaction and connection occupancy.

Measure that occupancy before changing the quota model. If reservation is moved into a short committed transaction, create an explicit reservation identity/state and settlement/refund process. A simple decrement in an exception handler is no longer enough if the process can crash after the reservation commits.

Define an overall request budget covering retries, parse and validate provider output, and test malformed/partial responses. Evaluate adversarial prompts and safety behaviour in both supported languages. Do not assume that prompt instructions or keyword filters alone prove the safety policy.

### 4.8 Database migrations and disaster recovery

The test environment is PostgreSQL `vinaadi_test` on port 5433. `vinaadi_dev` on port 5432 contains real data. Respect the existing guards; do not substitute SQLite or point resetting tests at the development database.

CI's upgrade→downgrade→upgrade migration test is useful. Expand assurance for data-changing migrations with populated synthetic rows, relevant old/new application versions, encryption keys, and invariant checks. An empty-schema round-trip does not prove a populated encryption backfill preserves data.

Existing restore verification scripts should become part of a demonstrated recovery exercise. Define RPO (acceptable data loss) and RTO (acceptable recovery time), verify restored encrypted records, and store required historical keys through an appropriately protected recovery process.

A backup command completing successfully is not proof that the backup can be restored or decrypted. Record recovery evidence and the limitations of each drill.

### 4.9 Dependencies and release reproducibility

Pinned runtime requirements and the workspace lockfile are positives. Continue checking the actual production dependency set, including images and native build inputs. Review ignored advisories periodically against their exact remaining justification.

Use deliberate version/digest ownership for release images where appropriate, and document build-time versus runtime settings. Generated code, schema artifacts, and design-token outputs should be reproducible from reviewed inputs.

The audit did not perform a complete fresh vulnerability scan or inspect deployed secrets. Do not infer a clean security posture from lockfiles alone.

## 5. Recommended target architecture

### Business capabilities

Keep the following as clear modules within the existing backend unless measured needs justify separation:

| Module | Owns |
|---|---|
| Identity and access | Sessions, credential lifecycle, revocation, permission policies |
| Profiles and households | Profile/family ownership, edits, deletion and location context |
| Astrology domain | Pure calculations, doctrine constants, versioned results |
| Guidance | Composition of domain results into user-relevant guidance |
| Billing | Provider identity mapping, event inbox, subscription/entitlement reconciliation |
| Notifications | Message intent, channel delivery, preferences, retry policy |

Give each module an explicit application interface. Sharing a PostgreSQL database does not require every service to edit every other module's records directly.

### Patterns worth adopting

| Pattern | Meaning here | Main findings addressed |
|---|---|---|
| Session coordinator | One owner for account transitions and dependent state | A02, A04, A07, A08 |
| Unit of work | Explicit owner of a coherent database transaction | A03, A11 |
| Provider adapter | Translate provider-specific identities/errors/payloads at one boundary | A04, A05, A10 |
| Inbox + projection | Accept events durably, derive current entitlement safely | A05 |
| Transactional outbox | Persist delivery intent and process it with retries | A09, A10 |
| Functional core | Deterministic domain rules with explicit inputs | A13 |
| Generated transport contracts | Derive client operations/types from backend schemas | A14 |
| Explicit UI state transitions | Model valid navigation/session/overlay combinations | A02, A08, A13 |

These patterns should resolve an identified responsibility. Do not create generic repositories, event buses, or service abstractions solely to make the code look architectural. A small direct function is often the clearest interface for a stable capability.

### Boundary rules to enforce

- Domain calculations cannot import ORM sessions/models, HTTP handlers, or application services.
- Infrastructure code cannot choose doctrine or presentation wording.
- Application use cases own normal transaction completion.
- The authentication lifecycle owns private client-state transitions.
- Provider identity cannot be inferred from the current screen alone.
- An HTTP acknowledgement of an event must correspond to durable acceptance.
- A successful external side effect must not be confused with a committed local record.
- Shared API types must reflect validated backend contracts and deployed-client compatibility.

## 6. Implementation sequence and completion checklist

### Phase 1: repair high-impact behaviour

| Work package | Findings | Suggested owner | Dependency / release condition |
|---|---|---|---|
| Deployment URL and real proxy smoke | A01, relevant A15 checks | Web/backend infrastructure | Before relying on the supplied production stack |
| Mobile identity/cache/refresh lifecycle | A02, A07, A08 | Mobile | Before trusting account switching and persisted private state |
| Durable replay revocation | A03 | Backend security | Verify through HTTP and a new PostgreSQL session |
| Purchase identity and entitlement consistency | A04, A05 | Mobile + backend billing | Before paid purchase/restore flows are relied on |
| Explicit limiter outage policy | A06 | Backend + infrastructure | Test runtime outage through actual ingress |

Each package should have a narrowly reviewable implementation and tests. Shared concepts can be designed together without requiring all changes to land in one large commit.

### Phase 2: make failure recovery explicit

Address scheduler ownership and notifications together enough to prevent duplicate ownership from becoming duplicate delivery: A09 and A10. Define recovery, retry, expiry, and observation semantics.

Then address A11's transaction boundaries using real database failure tests. Assess A12's data-protection requirement and consumer dependencies before designing its migration.

### Phase 3: strengthen long-term change safety

Close A14's missing schemas and introduce generated contracts incrementally. Extract the highest-risk orchestration units from A13 while preserving golden behaviour. Expand A15's required checks as the relevant tests become stable. Resolve A16's current-document contradictions early, then keep them corrected through the implementation work.

### Phase 4: establish measured operating limits

Run the capacity, failure-injection, visual/device, provider-sandbox, and restore exercises from section 4. Set operational budgets from those results. Only then decide whether particular workloads need separate services or additional infrastructure.

### Definition of done for an individual finding

1. The failure scenario and affected users/deployment conditions are written down.
2. The chosen design and any policy decision are explicit.
3. All affected backend/shared/web/mobile contracts are updated together where needed.
4. The behavioural regression test fails against the unfixed behaviour.
5. The same test passes after the fix, with its blind spots recorded.
6. Relevant existing tests, type checks, migrations, and CI gates pass.
7. Deployment/data compatibility and rollback behaviour are reviewed.
8. Operational signals and a runbook are added where the failure is operational.
9. Documentation and the project's issue trackers reflect the actual implemented status.

Track implementation work in `docs/MASTER_FIX_LIST.md` and `docs/ROADMAP_TASKS.md` using the existing project conventions. This document's proposed work does not mark those items complete or modify the trackers.

### Work that requires a decision before implementation

| Decision | Why it affects the design |
|---|---|
| Replay revocation scope | Determines whether access tokens and all devices/token families are revoked |
| Which private data should work offline | Determines persistence allowlists and retention rather than merely query names |
| Billing identity/transfer policy | Determines account reconciliation and restore semantics |
| Rate-limiter outage policy | Establishes availability versus enforcement behaviour for each protected operation |
| Birth-data confidentiality goal | Determines whether derived plaintext fields must be removed/encrypted |
| Notification retry/expiry guarantee | Determines how stale, ambiguous, and partially delivered work is handled |
| Recovery targets and expected concurrency | Determines capacity budgets and operational architecture |

Routine implementation details can be resolved by engineers within the agreed behaviour. These decisions should not be hidden inside a refactor because they change what users experience or what the system promises.

## 7. Verification record and limitations

This guide expands the existing audit; it does not report a new complete test run or newly implemented fixes.

### What was done in the audit

- Repository-wide tracked-source inventory and AST/source scans.
- Detailed source tracing across deployment, authentication, mobile sessions, billing, cache persistence, workers, notifications, encryption, dashboard composition, and CI.
- Four [backend probes](../artifacts/architecture-audit-2026-10-07/probe_backend.py): configuration mismatch, replay rollback, stale billing event overwrite, and Redis fail-open.
- Three [mobile probes](../artifacts/architecture-audit-2026-10-07/probe_mobile.cjs): persistence shape, cache reuse across the current session functions, and repeated refresh recursion.
- Existing database-free contract checks: 288 passed, nine skipped.
- Mobile Jest: 117 passed and one timeout; targeted diagnostic rerun: five passed.

The diagnostic probes execute current source with database/network/native boundaries mocked or blocked. Their successful exit means that the described defect was observed. They are not regression gates demonstrating a repaired application.

### What remains unverified

- A complete manual review of every line.
- Full backend suite and a fresh authoritative CI result for remediation changes.
- A live Compose build/deployment demonstration of A01.
- Native purchase/restore behaviour and provider project transfer settings.
- Real multi-process scheduler failover and delivery interruption behaviour.
- A PostgreSQL persistence reproduction of A03 and DB-failure isolation test for A11.
- Production load, latency, connection usage, and cache capacity.
- Rendered accessibility, native-device behaviour, and all English/Tamil surfaces.
- Complete current vulnerability/image scans, deployed monitoring configuration, and a restore drill.
- Independent practitioner validation of every astrology rule or generated narrative.

These limits qualify the assurance level. They do not negate the concrete source and isolated-probe evidence, and they should remain visible when converting this guide into implementation tasks.

## 8. Glossary and references

### Plain-language glossary

| Term | Meaning |
|---|---|
| Modular monolith | One deployed application organised into business modules with enforced boundaries |
| Invariant | A property that must stay true across all valid states and failures |
| Session generation | A number/token identifying which login lifecycle an asynchronous operation belongs to |
| Idempotency | Repeating an operation produces the same intended effect instead of applying it twice |
| Unit of work | The application boundary that decides which database changes commit or roll back together |
| Inbox | A durable record of received external events before processing |
| Projection | The application's current view derived from events or authoritative provider state |
| Outbox | A durable record of work intended for an external system |
| Work claim | An atomic record that a worker owns a job for a bounded period |
| Fencing | A way to prevent an obsolete worker/owner from applying changes after ownership moves |
| Fail-open | Allowing an operation when its protective dependency cannot be checked |
| Readiness | Whether an instance should receive traffic now |
| Liveness | Whether a process is alive; failure usually signals restart |
| RPO / RTO | Acceptable data loss / acceptable recovery time |

### Supporting references

- [Original audit and source evidence](ARCHITECTURE_AUDIT_2026-10-07.md).
- [Workspace rules](../CLAUDE.md), [agent reference](AGENT_INSTRUCTIONS.md), and [documentation index](INDEX.md). Apply the governing hierarchy and the documentation-drift caveat in A16.
- [RevenueCat webhook guidance](https://www.revenuecat.com/docs/integrations/webhooks): duplicate delivery and subscription reconciliation considerations used in A05.
- [TanStack Query persistence contract](https://tanstack.com/query/latest/docs/framework/react/plugins/persistQueryClient): persisted-client envelope and persistence lifecycle used in A07.
- [SQLAlchemy session guidance](https://docs.sqlalchemy.org/en/20/orm/session_basics.html): transaction and failed-flush recovery considerations used in A11.

Provider/framework references were consulted for the original audit on 7 October 2026. Verify installed versions and current provider contracts before implementing concrete SDK or generator integrations.
