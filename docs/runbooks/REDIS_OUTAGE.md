# Runbook — Redis outage

Owner: backend on call. Last reviewed: 2026-10-07 (A06).

Redis does two unrelated jobs in this system, and an outage affects them
differently on purpose. Read that distinction first; most of the confusion
during an incident comes from treating them as one dependency.

| Job | On a Redis failure | Why |
|---|---|---|
| Shared counters behind the **auth** throttle | **Enforced by refusing**: affected endpoints answer `503` | "I cannot check the limit" is not "no limit applies" |
| The **global per-IP** request limiter (middleware) | **Fails open**: requests continue | An aggregate control; locking every user out over infrastructure is the worse trade |
| Cache backend, when `JOTHIDAM_CACHE_BACKEND=redis` | Falls back / recomputes | A cache miss is a cost, not a correctness problem |

## Symptoms

- Users cannot sign in, register, or reset a password. The response is
  `503` with `Retry-After`, body
  `"Sign-in is temporarily unavailable. Please try again shortly."`
- Logs carry `auth_throttle_limiter_unavailable action=<action>` at ERROR.
  This is the alertable signal: it means a security control is not being
  enforced, and the request was refused rather than waved through.
- `rate_limit.py` logs `redis rate-limit check failed … limiter unavailable`
  at WARNING for each affected check.
- `GET /health/ready` reports Redis as required and not ready.

Signed-in users are **not** signed out. A `503` is not a rejected credential,
and both clients were checked and tested for this
(`mobile/__tests__/apiClientRefresh.test.ts`). If you see mass sign-outs during
a Redis outage, that is a separate bug — do not assume it is this.

## Immediate checks

```powershell
Set-Location 'D:\sanstro'
docker compose -f docker-compose.app.yml ps redis
docker compose -f docker-compose.app.yml logs --tail 100 redis
docker compose -f docker-compose.app.yml exec redis redis-cli ping
```

Then confirm the API's own view, which is what actually matters:

```powershell
curl -fsS http://127.0.0.1:8000/health/ready
```

## Recovery

Restoring Redis is sufficient. **No API restart is required and none should be
performed as a first step.** Each throttle check attempts the connection
afresh, so the very next request after Redis returns is enforced normally —
pinned by `TestRecovery` in `tests/test_auth_throttle_outage.py`.

```powershell
docker compose -f docker-compose.app.yml restart redis
```

One asymmetry to know before reaching for a restart: `get_rate_limit_backend()`
is `lru_cache`d, so a process that **starts** while Redis is unreachable falls
back to the per-process in-memory limiter and stays there until it is
restarted. Restarting the API during an outage therefore makes enforcement
*weaker*, not stronger — the limits become per-worker and roughly N× the
configured value. Restart the API only after Redis is healthy.

## Trap: admin elevation is also gated

`ADMIN_ELEVATION` is one of the throttled actions, so during a Redis outage an
operator **cannot elevate to an admin session either**. Any recovery procedure
that depends on the admin console is unavailable at exactly the moment it is
wanted. Recover Redis through infrastructure access, not through the
application.

## What is NOT covered by this change

- **Readiness does not control traffic.** `/health/ready` correctly reports
  Redis as required, but the supplied nginx configuration proxies everything to
  `web`, and an unhealthy container is not thereby withdrawn from that route.
  A06 step 6 remains open: wiring readiness into actual routing, and deciding
  what should happen when *every* instance is unready, is unimplemented
  infrastructure work.
- **No metric is exported.** The degradation signal is a named log line, not a
  counter. Alerting on `auth_throttle_limiter_unavailable` is the current
  mechanism; `limiter_unavailable_total` from the audit's observability table
  does not exist yet.
- **No tested behaviour through the real ingress.** The policy is tested at the
  application boundary. The acceptance criterion in the audit names the whole
  nginx → web → api route, and that has not been exercised.

## Decision record

The availability cost here is deliberate, not an oversight.

> **Owner decision, 2026-10-07:** auth endpoints return a bounded 503 when
> their authoritative limiter cannot be evaluated. Ordinary cache misses keep
> degrading gracefully.

The alternative considered and rejected was a per-process fallback limiter,
which keeps sign-in working but silently multiplies the effective limit by the
number of workers and replicas — enforcement that looks intact and is not.
