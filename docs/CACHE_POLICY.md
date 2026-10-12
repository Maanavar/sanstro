# Cache policy and operations

**Status:** current as of 2026-10-12. This document owns cache purpose,
identity, lifetime, capacity, invalidation and fallback policy. It does not set
a production memory or latency budget; those require measured traffic.

## Shared process/Redis cache policy

`app.core.cache.Cache` is a best-effort performance boundary. A miss, expiry,
LRU eviction or Redis outage may cause recomputation but must not change the
returned business value. Callers must therefore cache only JSON-serialisable
values and must never rely on a cached write for durable state.

The memory implementation is process-local and capped at **1,024 entries** by
default. Two mechanisms, each with one job:

- **Capacity bounds memory.** A write that takes the store over the cap evicts
  the least recently read or written entry, expired or not — O(1). LRU is used
  because repeated hot keys keep their computation benefit while one-off unique
  keys cannot grow the worker forever.
- **A sweep reclaims dead slots.** Expired entries that nobody reads again are
  removed by a full scan that runs on a write **at most once per 60 seconds**
  (`sweep_interval_seconds`). The first Phase 4 cut scanned on *every* write,
  under the lock — an O(n) cost per `set()` that the cap had already made
  unnecessary for the memory bound.

Reads also remove the addressed entry when it has expired, so an expired value
is never returned. All operations remain lock-protected.

Redis remains shared across workers and uses Redis-native TTL plus the
operator's Redis `maxmemory`/eviction configuration. The implementations have
the same application-visible contract: expiry or eviction is a miss, reads and
writes fail open, TTLs have a one-second minimum, and a miss recomputes. The
different capacity mechanisms are deliberately not exposed to callers.

No request coalescing or distributed lock is introduced. Concurrent misses may
compute the same value more than once, as before; one slow or failed computation
cannot strand waiters behind an application-owned lock.

| Purpose / owner | Key | TTL | Capacity | Invalidation dependencies | Miss / failure fallback |
|---|---|---:|---:|---|---|
| Public chart count (`app.api.stats`) | `stats:public` | 1 hour | Memory shares 1,024-entry default; Redis operator policy | TTL, explicit delete, process restart | Count PostgreSQL rows |
| Pre-auth geocoding (`app.api.geo`) | normalised lowercase query | 30 days | **4,096 entries per worker**, LRU | TTL/process restart; provider-policy changes require an explicit key/version change | Call Nominatim; return the existing `network`/`not_found` response shapes |

The geocoder has its own larger cap because its 30-day key space is naturally
broader than the one-key statistics cache. The cap bounds retained user-typed
place strings; it is an entry bound, not a byte claim.

## Pure calculation caches

These `functools.lru_cache` instances hold deterministic scalar inputs and have
no TTL. A deploy/process restart clears them. Formula changes invalidate them
by deploying new code; exceptions are not cached. Their fallback is the same
pure calculation.

| Owner | Purpose / key | Capacity |
|---|---|---:|
| `calculations.ephemeris` | Sun longitude by Julian day; Saturn longitude by Julian day | 256 each |
| `calculations.transits` | Saturn ingress/egress boundary by rasi and anchor Julian day | 64 each |
| `services._chart_build` | Birth-day Panchangam signature by date, timezone and coordinates | 1,024 |
| `services._chart_planets` | Sunrise/sunset Julian days by civil date, timezone and coordinates | 4,096 |
| `services.life_areas_service` | Moon-rasi spans by date/place; improvement scan by natal/check instants | 4,096 each |
| `services.numerology_timing_service` | Chithirai 1 by year, timezone and coordinates | 256 |

`fcm_service` separately holds at most one OAuth access token until ten minutes
before provider expiry. Configuration, encryption-key, Redis-client and
rate-limiter `lru_cache` functions are process singletons, not variable response
caches. Family snapshot dictionaries are request-scoped and die with the
request; their key space is the requested members/dates rather than global
traffic.

## PostgreSQL-backed derived caches

| Purpose / owner | Key | Lifetime / capacity | Invalidation dependencies | Miss / failure fallback |
|---|---|---|---|---|
| Panchangam snapshots (`panchangam_cache`) | civil date + coordinates rounded to 6 decimals + ayanamsa | Reads accept rows for 24 hours; `expires_at` purges physical rows after 90 days. Capacity is PostgreSQL, not process memory. | Coordinates are in the key; serialized formula/shape changes bump `PANCHANGAM_CACHE_DATA_VERSION` | Compute the same date/place snapshot; DB cache errors fail open |
| Daily guidance (`daily_scores`) | birth profile + civil date, one row by unique constraint | Persistent until profile deletion or dependency invalidation; at most one row per profile/date | Formula + chart calculation version tag; goal-track tag; mutation rules below | Rebuild guidance and upsert |
| Family daily aggregate (`family_daily_scores`) | vault + civil date + timezone | Persistent derived history, one row per key | Recomputed and overwritten whenever the aggregate runs; it is not currently used as a read-through response cache | Recompute from member snapshots |

Do not manually delete Panchangam rows for a formula change. Bump the version so
old rows are ignored safely and overwritten. The 24-hour read freshness and
90-day physical retention are distinct policies.

## User-input dependency rules

A formula version does not represent mutable user input:

- Corrected natal inputs (birth date, time, place, coordinates or timezone)
  invalidate **all** `DailyScore` rows for that profile. The natal basis was
  wrong for past and future dates alike.
- A changed effective current location invalidates today and future rows only.
  Past rows describe days lived at the former place. Re-sending the same place
  is confirmation, not invalidation.
- Gender, marital-status or employment changes invalidate today and future
  rows because the activity audience changes; past rows remain historical.
- A life-focus change does not delete rows. Each row carries `_goalTrack`; a
  different track is a miss and overwrites that profile/date row. Trackless
  legacy rows remain valid only for trackless users.
- Panchangam location changes miss naturally because coordinates are part of
  the key.

Regression evidence lives in `tests/test_birth_profiles_api.py` (birth and
location edits), `tests/test_clock_boundaries_db.py` (audience edits and the
date-line/DST cutoffs, driven by an injected clock),
`tests/test_life_focus_phase1.py` (focus changes) and
`tests/test_cache_and_rate_limit.py` (capacity, unique-key growth, sweep and
LRU order).

## Operations runbook

1. Confirm `JOTHIDAM_CACHE_BACKEND` and Redis readiness before attributing a hit
   rate change to product code. Redis unavailability deliberately falls back to
   the bounded per-worker memory cache.
2. A process restart safely clears all process caches. Expect temporary extra
   PostgreSQL/provider/ephemeris work, not data loss.
3. If memory growth persists after the caps, measure value sizes and identify
   the owning table above; the caps bound entry count, not bytes. Do not choose a
   smaller production limit without that measurement.
4. For a bad deterministic calculation, deploy the fix. Bump the relevant
   persisted cache version when serialized/output values changed; process LRUs
   clear on restart.
5. For a suspected stale user result, identify whether the dependency is natal,
   current location, audience or focus. Verify the mutation rule above before
   deleting rows. Never operate on `vinaadi_dev` from a test or drill command.

**Known limits:** the repository cannot see production Redis `maxmemory`, value
size distribution, hit rates or concurrency. The limits above prevent
unbounded process entry counts; they are not a production capacity benchmark.
