# Production edge baseline

**Task:** P1-5 in `docs/AUDIT_TRIAGE_2026-08-31.md`.
**Date:** 2026-09-03.

What the audit asked for: terminate TLS at an ingress, stop exposing the raw API
and database ports, add response headers and a CSP, move secrets to a secret
manager, and add a readiness probe distinct from liveness.

Five of those six are in the tree now. The sixth — a secret manager — is a
deployment-target decision and is written up here rather than implemented,
because implementing it against no chosen target would be guesswork.

---

## 1. The shape of the deployment

```
browser --TLS--> nginx (edge) --> web: Next --> api: FastAPI --> db / redis
   443              :443/:80        :3000         :8000
```

Only nginx publishes a public port. `web` and `api` bind to `127.0.0.1` on the
host so they stay reachable for debugging and unreachable from anywhere else;
`db` and `redis` publish nothing at all.

Bring the edge up with its profile:

```bash
docker compose -f docker-compose.app.yml --profile edge up -d
```

It is opt-in, not the default, and the reason is worth stating: an edge that
refuses to start without a real certificate and a real domain would send people
straight back to running the stack on plain HTTP. A default that fails closed
into the insecure configuration is not a safe default.

### Certificates: one bootstrap, then it renews itself

The `edge` profile carries a `certbot` service that runs `certbot renew` twice a
day, and the edge reloads every six hours. Both halves are needed and neither is
obvious:

- `certbot renew` writes the new certificate to disk and knows nothing about
  nginx. nginx re-reads certificates on **SIGHUP only**, so without the reload a
  renewal lands on disk and the expiring certificate keeps being served until
  someone restarts the container by hand — ninety days after go-live, as a total
  site outage.
- The reload loop lives in the edge's `entrypoint`, not its `command`, and that
  is not a style choice. `/docker-entrypoint.sh` runs the envsubst template step
  **only when its first argument is `nginx`**. The recipe everyone copies —
  `command: /bin/sh -c "…loop… & nginx -g 'daemon off;'"` — therefore skips it
  silently, and nginx comes up with a literal `${VINAADI_DOMAIN}` for its
  `server_name` and a certificate path that does not exist.

`certbot renew` is a no-op when there is nothing to renew, so **it does not issue
the first certificate**. Issuance needs port 80, which the edge holds. Do it once,
before the edge starts:

```bash
# 1. Point the DNS A/AAAA record at this host and let it propagate.
# 2. With the edge NOT running, so port 80 is free:
docker compose -f docker-compose.app.yml --profile edge run --rm \
  -p 80:80 --entrypoint certbot certbot certonly --standalone \
  -d "$VINAADI_DOMAIN" --email you@example.com --agree-tos --no-eff-email
# 3. Then bring the stack up. Renewal is automatic from here.
docker compose -f docker-compose.app.yml --profile edge up -d
```

`--standalone` rather than `--webroot` for this one command only: the webroot
challenge is served by nginx, and nginx cannot start until the certificate it is
bootstrapping exists. Renewals use `--webroot` through the running edge, which
already serves `/.well-known/acme-challenge/`.

Add `--dry-run` to rehearse against the staging ACME server. Let's Encrypt's
rate limits are per-domain and unforgiving; a failed real issuance costs hours.

### The two proxy-hop counts

These are the settings most likely to be got wrong, because they describe the
same deployment from two ends.

**They are equal. Always.**

| | `TRUSTED_PROXY_HOPS_BEFORE_WEB` | `JOTHIDAM_TRUSTED_PROXY_COUNT` |
|---|---|---|
| No edge (default) | `0` | `0` |
| `--profile edge` | `1` | `1` |
| Edge behind a CDN | `2` | `2` |

Next does not *append* to `X-Forwarded-For` — it deletes whatever the client
sent and writes back only the rightmost entries a hop we control actually
produced. But "the rightmost entries" is `hops.slice(-N)` where N is
`TRUSTED_PROXY_HOPS_BEFORE_WEB` (`web/app/api/backend/[...path]/route.ts`), so
the API receives **N entries, not one**, and must step back N to reach the
address the outermost trusted hop observed.

Set one without the other and the API either reads an address no trusted hop
wrote, or ignores the only one that was. `app/core/config.py` cross-checks the
pair at boot: a mismatch is a hard failure in production and staging, a warning
elsewhere. The `api` service is passed `TRUSTED_PROXY_HOPS_BEFORE_WEB` for that
purpose alone.

> **Corrected 2026-09-03.** This table used to say the API's count stays `1`
> behind a CDN, on the reasoning that Next forwards exactly one entry. It does
> not — `proxy-forwarding.test.ts` has pinned the two-entry behaviour ("keeps
> two hops when two are declared") the whole time. Deployed as written, the API
> would have read the CDN's own address for every request and put all anonymous
> traffic in one rate-limit bucket: the exact failure the setting exists to
> prevent. The boot assertion exists so a wrong pair cannot be silent again.

### Anonymous rate limiting only works with the edge

Worth knowing before choosing to run without one.

`RateLimitMiddleware` keys on `_extract_user_id(request) or client_ip`
(`app/middleware.py:196`). Authenticated traffic keys by user, so it is
unaffected by any of this. **Anonymous** traffic keys by IP — and with no edge,
Next forwards no `X-Forwarded-For`, so the API's peer is the `web` container for
every browser request and every anonymous caller lands in one bucket.

The endpoints that reach: login, register, password reset, geocoding, the public
tools, newsletter. Which is to say, precisely the ones where per-IP limiting is
the abuse control. One caller can exhaust the limit for everybody, and per-IP
brute-force protection cannot tell two callers apart.

This is not a new defect and nothing here introduced it — it is the state the
`trusted_proxy_count: int = 0` default has always described. The edge profile is
what fixes it, by putting a hop in place that observes the real client. **Run
without the edge and anonymous rate limiting is a single shared bucket.**

---

## 2. Probes

Three endpoints, all under `/health`, all exempt from rate limiting.

| Endpoint | Question | Failure means | Touches |
|---|---|---|---|
| `GET /health` | unchanged, pre-existing | — | nothing |
| `GET /health/live` | is the process alive? | **restart me** | nothing |
| `GET /health/ready` | can it serve correctly? | **stop sending traffic** | db, redis |

Liveness deliberately touches no dependency. A liveness probe that consulted the
database would turn a database outage into an orchestrator killing every
instance in the fleet — converting a recoverable dependency failure into a total
one, at the worst possible moment. `tests/test_health.py` asserts this rather
than trusting the comment.

`/health/ready` returns `200` with `{"status": "ready"}` or `503` with
`{"status": "not_ready"}`, plus a per-dependency breakdown:

```json
{
  "status": "ready",
  "checks": {
    "database": {"status": "ok", "required": true, "latency_ms": 1.4},
    "cache":    {"status": "disabled", "required": false, "latency_ms": null}
  }
}
```

**Database** is always required. **Redis** is required only when
`JOTHIDAM_RATE_LIMIT_BACKEND=redis`, because that is when losing it stops being
a cold cache and starts being a loosened security control — the same condition
`app.main` refuses to boot into. Override with
`JOTHIDAM_READINESS_REQUIRE_CACHE`.

That override earns its place: requiring Redis makes the failure *correlated*.
One Redis outage marks the entire fleet not-ready simultaneously, and an ingress
that does not fail open on all-backends-unhealthy would then serve nothing. Know
which behaviour your ingress has before leaving the default on.

Both checks are bounded — a 2s `statement_timeout` on the database probe, and
`socket_timeout` / `socket_connect_timeout` on the Redis client. The Redis
timeouts apply to *every* call, not just the probe: redis-py defaults both to
"wait forever", and Redis sits in the request path of the rate limiter, so a
server that accepts connections and then stops answering would have hung
requests instead of falling back.

Orchestrator wiring:

```yaml
livenessProbe:
  httpGet: {path: /health/live, port: 8000}
  periodSeconds: 10
  failureThreshold: 3
readinessProbe:
  httpGet: {path: /health/ready, port: 8000}
  periodSeconds: 10
  failureThreshold: 2
```

---

## 3. Response headers and CSP

Set by `web/middleware.ts` from `web/lib/security-headers.ts`, on every document
response. The backend has had its own set since Sprint 10
(`app/middleware.py`); that only ever covered JSON, and the Next origin — which
holds the session cookie, renders the admin console and displays journal text —
had none.

```
Content-Security-Policy      (per-request nonce; see below)
X-Frame-Options              DENY          (omitted on /widget/*)
X-Content-Type-Options       nosniff       (next.config.mjs — covers static assets too)
Referrer-Policy              strict-origin-when-cross-origin
Permissions-Policy           camera=(), microphone=(), payment=(), usb=(), geolocation=(self)
Cross-Origin-Opener-Policy   same-origin
Strict-Transport-Security    max-age=31536000; includeSubDomains   (https only)
```

**The CSP uses a real nonce, not `'unsafe-inline'`.** Two things usually make
that impractical in an App Router codebase and neither applies here:

- Reading the nonce needs `headers()`, which forces dynamic rendering. Already
  paid: the root layout awaits `cookies()` for `<html lang>`, so nearly every
  route was dynamic before this change (`web/lib/server-lang.ts`).
- Inline scripts have to be found and nonced. There is exactly **one** in the
  codebase — the pre-paint theme resolver in `app/layout.tsx`. The other 119
  `dangerouslySetInnerHTML` sites are `type="application/ld+json"`, which
  browsers never execute and CSP therefore never gates.

`style-src` keeps `'unsafe-inline'`, deliberately: framer-motion writes inline
styles every frame and `next/font` emits an inline `<style>`. Inline style
injection is a much weaker primitive than script execution, and this is the
honest trade rather than a strict-looking policy that gets switched off in a
week. `web/lib/security-headers.test.ts` pins it so removing it is a decision.

### Two traps, both already sprung and defused

1. **Never set a second CSP.** Browsers enforce multiple `Content-Security-Policy`
   headers as their *intersection*. The widget's `frame-ancestors *` used to live
   in `next.config.mjs`; had it stayed there while middleware also set a policy,
   `*` would have resolved against `'none'` and silently blocked the embed the
   rule exists to permit. All CSP now comes from one place. The nginx config sets
   no security headers for the same reason.
2. **`X-Frame-Options` cannot say "any origin".** Setting `DENY` globally would
   override `frame-ancestors *` on `/widget/*` in browsers that honour it, so it
   is omitted there and only there.

### Verifying it

The nonce in the CSP header must match the nonce on the script tags **in the
same response** — checking with two separate `curl` calls compares two different
requests and always fails.

```bash
curl -s -D h.txt -o b.txt http://localhost:3000/
grep -i '^content-security-policy:' h.txt | grep -oE 'nonce-[A-Za-z0-9+/=]+'
grep -oE 'nonce="[^"]+"' b.txt | sort -u      # expect exactly one, matching
```

Verified 2026-09-03 against a production build on `/`, `/pricing`, `/login`,
`/widget/panchangam` and the SSG `/temples/*` and `/yogam/*` routes: one unique
nonce per response, matching the header, on all 26–41 script tags Next emits.
`/widget/*` kept `frame-ancestors *` and no `X-Frame-Options`; every other route
got `'none'` and `DENY`.

---

## 4. Secrets — not done, and what to do

> **Superseded 2026-09-03** by
> [`SEC1_SECRET_CUSTODY_RULING.md`](SEC1_SECRET_CUSTODY_RULING.md). Two claims
> below are overturned there: keeping the env-var interface is **not** a design
> requirement (`*_FILE` sources are preferred, because re-exporting a mounted
> secret puts it back in `/proc/<pid>/environ`), and this is **not** wholly
> blocked on a deployment target — only the Stage 2 migration is. The rest of
> this section stands.

Secrets are environment variables read from a `.env` file next to the compose
file. `app/core/config.py` already refuses to boot in production without
`JOTHIDAM_JWT_SECRET`, `JOTHIDAM_ADMIN_API_KEY` and `JOTHIDAM_ENCRYPTION_KEY`,
so they cannot be *missing*. They are, however, on disk in plaintext, readable
by anything running as that user, and rotated by editing a file.

This is not implemented because the right implementation is entirely determined
by where this deploys, and picking one now would mean building the wrong one.
Whichever target:

- `JOTHIDAM_ENCRYPTION_KEY` is the one that matters most. It decrypts birth
  dates, times, coordinates and — since P2-1 — journal text. Losing it loses the
  data; leaking it makes the at-rest encryption decorative.
- Prefer injection at process start over a file on disk. Keep the env-var
  interface: `Settings` needs no change, and a compromised host still reads the
  value out of `/proc` either way, so file-vs-env is about breadth of exposure,
  not about defeating host compromise.
- Rotation has to be a supported operation before it is an emergency. For the
  encryption key that means `JOTHIDAM_ENCRYPTION_KEYS` and
  `scripts/rotate_encryption_key.py` — see `docs/DATA_PROTECTION.md`.

---

## 5. What is still open

- **Secret custody** — §4. Ruled 2026-09-03; Stage 1 is not blocked on the
  deployment target and carries an S0 pre-launch blocker (encryption-key escrow
  plus a tested restore). See [`SEC1_SECRET_CUSTODY_RULING.md`](SEC1_SECRET_CUSTODY_RULING.md).
- ~~**Certificate issuance**~~ — **closed 2026-09-03.** A `certbot` sidecar
  renews twice a day and the edge reloads every six hours; §1 has the one-time
  issuance command. First issuance stays manual on purpose: it needs DNS to have
  propagated and port 80 to be free, and a service that retried it on every boot
  would burn Let's Encrypt's per-domain rate limit.
- ~~**No automated check that the two proxy-hop counts agree**~~ — **closed
  2026-09-03.** `_check_proxy_hops_agree` in `app/core/config.py` refuses to boot
  in production on a mismatch. Writing it found that the rule the docs recorded
  was wrong; see the correction note in §1.
