# Login was slow because one pure computation ran 8 times, then 10 more

**Reported:** 2026-09-09 by the owner. "Login is taking too much time to go in."

**Status:** fixed the same day. Dashboard bundle **10.6 s → 1.4 s**; the four
charts a login fetches, **28.1 s → 5.5 s**. No behaviour change — both memos
verified to return values identical to a fresh computation.

---

## 1. It was not the cache-version bump

The obvious suspect, given §12 of `CHANDRASHTAMA_SURFACE_DIVERGENCE_2026-09-09.md`
had just traced a 502 to exactly that. Measured first:

| Chart | Cold | Warm |
|---|---|---|
| 5ec46dc5 | 5.79 s | 4.51 s |
| f1e21cca | 6.31 s | **10.55 s** |
| ee058e40 | 7.61 s | 9.86 s |
| 63c2b6d8 | 8.36 s | 4.67 s |

**Warm was not faster than cold, and twice it was slower.** That rules out a
cache miss immediately — whatever dominates is recomputed on every request no
matter what is cached. A second measurement that contradicts the leading theory
is worth more than a third that confirms it.

## 2. What the profiler said

One bundle, steady state:

```
  1    10.643s  get_chart_dashboard_bundle
  8     8.044s    load_persisted_chart_response      <- EIGHT times
  8     7.794s      _birth_panchangam_signature
32338  7.412s  ephemeris._calc_ut                    <- 70% of the request
```

**The chart snapshot is loaded eight times per bundle** — once by the bundle and
again by each sub-service that re-loads it independently — and every load
recomputed `_birth_panchangam_signature` from the ephemeris, ~1 s each.

That signature is a pure function of four values — birth date, timezone,
latitude, longitude — **none of which can change for a chart**. It was being
computed eight times per request, and again on every subsequent request, forever.

It also passes `session=None, use_cache=False` deliberately, so the panchangam
row cache never helped it. That flag is correct and stays: a birth date is a
one-off lookup that would only pollute a cache keyed for daily-guidance reads.
The memo belongs at this layer, not that one.

### Fix 1

`_birth_panchangam_signature_items`, `lru_cache(maxsize=1024)`, keyed on the four
scalars. The public wrapper builds a fresh `dict` from the cached items so no
caller can mutate what the next one receives.

**10.6 s → 3.07 s.** Swisseph calls 32,338 → 4,274.

## 3. The same bug again, one layer down

With the first fix in, 58% of what remained was a single function:

```
 10    1.790s  life_areas_service._find_next_improvement_date
256    0.666s    calculate_vimshottari_timeline
443    1.170s    calculate_sidereal_planets
```

`_find_next_improvement_date` scans 26 weekly dates looking for when an area's
score recovers. It is called **once per life area**, and all ten areas scan the
**same 26 dates** — recomputing the identical transit snapshot and dasha timeline
each time. Only `_score_area(area, …)` differs. 260 computations where 26 do.

The comment forty lines below it already states the correct principle, for the
forecast horizons:

> The two future transit snapshots are computed once per request and reused
> across all areas, so the added cost is two ephemeris calls, not two-per-area.

The insight was applied there and not here.

### Fix 2

`_improvement_scan_at(birth_jd, moon_longitude, check_jd)`, `lru_cache`, returning
the transit bodies and the two dasha lords. Checked before sharing that nothing
in the module writes to the bodies mapping — `_score_area` and its callees only
read — and said so at the definition so it stays true.

**3.07 s → 1.4 s.**

## 4. Result

| | Before | After |
|---|---|---|
| One dashboard bundle | 10.6 s | **1.4 s** |
| Four charts (one login) | 28.1 s | **5.5 s** |
| Swisseph calls per bundle | 32,338 | ~1,500 |

## 5. Verified

Tests alone cannot prove a memo faithful — they prove the suite still passes.
So both memos were checked directly against fresh computation:

```
birth signature:   4 profiles,              0 mismatches
improvement scan:  100 (chart, date) pairs, 0 mismatches
```

Suites: `test_charts_api`, `test_chart_access_guard`, `test_dashboard_bundle_api`,
`test_chart_explanation_bhavas`, `test_chart_explanation_edge_conditions`,
`test_chart_strength`, `test_calculations` — **178 passed**.
`test_life_areas_service`, `test_life_areas_api`, `test_dasha`,
`test_dasha_activation`, `test_dashboard_bundle_api` — **41 passed**. Ruff clean
apart from the pre-existing `notification_dispatch_service` I001.

Local runs are not authoritative; CI is.

## 6. The rule

**A pure function called once per consumer is called once per consumer.** Both
defects are the same shape: an expensive deterministic computation sitting inside
a loop or a re-load, with nothing about the call site making the repetition
visible. Neither showed up as a slow query or a hot loop — they showed up as one
number, `_calc_ut`, 70% of the request, attributable only by profiling.

Two working notes worth keeping:

- **Warm-vs-cold is a free bisection.** If warm is not faster, stop thinking
  about caches. It took one measurement to discard the leading theory.
- **The fix for the second defect was already written down beside it.** When a
  file explains why it shares an expensive value across areas, check whether
  everything in that file actually does.

## 7. Left open

`_find_next_improvement_date` still scans 26 dates linearly per area and stops at
the first week the score clears its target. Now that the per-date work is shared
the scan itself is cheap, but a coarse-to-fine search would cut it further if
this surface ever needs it again. Not done: it changes which date is returned at
the margins, which is a product question, not a performance one.
