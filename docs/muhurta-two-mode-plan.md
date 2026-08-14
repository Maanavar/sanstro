# Muhurta: two modes everywhere, and closing the Thirukanitham gaps

Date: 2026-08-14
Status: PLAN — nothing implemented yet
Branch: `harden/production-readiness`

## 1. The decision

Every surface that answers "when should I do X" must offer **two modes**:

| Mode | Input | Who it is for |
| --- | --- | --- |
| **Personal** | a `chart_id` — the signed-in user **or any family-vault member** | family users, the paid path |
| **General** | location + date range only, no chart | guests, marketing tools, and signed-in users asking on behalf of someone whose chart we do not hold |

Today the modes exist but are **split across separate endpoints with separate scoring code**
(`/charts/{id}/muhurta` vs `/public/muhurta`), and the personal one is hardwired to
`personal.chartId` — family members cannot be asked about at all.

Target: **one engine, one scoring path, one response shape**, with personalisation as an
optional layer that is added when a chart is supplied and skipped when it is not.

## 2. The astrologer's checklist vs. what we actually compute

The astrologer named eight factors. Scoring our engine against them:

| # | Factor | Status | Where |
| --- | --- | --- | --- |
| 1 | **Sunrise for the exact activity location** | ⚠️ **Partial — wrong location** | `muhurta_service.py:298` uses `resolve_effective_daily_location(bp)` — the *birth profile's* location. There is no way to say "I am buying in Coimbatore". |
| 2 | **Tithi** (rikta avoidance, waxing preference) | ✅ Have | `muhurta_service.py:161`, `activity_timing_rules.py:255` |
| 3 | **Nakshatra + Pada** | ⚠️ **Partial, and absent from the month picker** | `muhurta_service.py:197` uses a flat `SUBHA_NAKSHATRAS` set. `assess_activity_timing()` — which ranks the "top 5 dates this month" — takes **only tithi, paksha, weekday**. No nakshatra at all. |
| 4 | **Tara Bala** | ⚠️ **Exists but siloed** | `muhurtham_naal_service.py:211` `_tara_number()` — private, used only for the curated wedding-date sheet. Not reachable from the muhurta picker or activity timing. |
| 4b | **Chandra Bala** | ❌ **Missing entirely** | No implementation anywhere. Chandrashtama (`muhurta_service.py:168`) is the 8th-house case only — not the full 12-fold Moon-from-Janma-Rasi strength. |
| 5 | **Jupiter / Venus condition for wealth timing** | ❌ **Missing** | `_ACTIVITY_LORDS` (`muhurta_service.py:47`) names Jupiter/Venus as *dasha* lords for `PURCHASE`, but their **transit dignity on the candidate day** is never examined. |
| 6 | **Rahu Kalam / Yamagandam / Kuligai** | ✅ Have | `muhurta_service.py:345-350`, `_dg_hora.py:111` |
| 6b | **Durmuhurtham** | ❌ **Missing entirely** | No occurrence of the term anywhere in `app/`. |
| 7 | **Hora** | ⚠️ **Computed, then discarded** | See §3 — the personal hora is scored but never becomes the recommended clock time. |
| 8 | **Muhurta Lagna, 2nd & 11th house strength at the proposed moment** | ❌ **Missing** | Lagna is computed **only at sunrise** (`panchangam.py:1848`) — one rasi for the whole day. There is no lagna schedule across the day, so we cannot say what is rising at 10:42 AM. `calculate_lagna_degree()` (`ephemeris.py:239`) makes it buildable. |

**Verdict on the astrologer's method:** it is sound and it is a strict superset of what we
ship. Of eight factors we fully satisfy two (tithi, kalam avoidance). His worked example —
"even if Rahu Kalam does not fall in 10:00–11:30, I may reject it because the Moon is 8th from
the buyer's Janma Rasi or the Tara Bala is poor" — is exactly the judgment our picker cannot
currently make, because Tara Bala never reaches it.

## 3. Three defects in the existing code (independent of this plan)

**D1 — the personal hora never moves the clock.** `_score_hora()` (`muhurta_service.py:116`)
finds the lagna-lord hora and writes *"Lagna lord Venus hora (2:14 pm–3:16 pm) — strongest
personal window"* into `horaSupport`. But the returned `timeStart`/`timeEnd` come from
`_best_time_window()` (`muhurta_service.py:227`), which reads **only** Gowri nalla neram or
Abhijit. The slot shown and the reason printed beside it can be different times of day.

**D2 — `_score_hora` takes the first match, not the best.** It scans `snap.hora[:12]` and
returns on the first hit. A lagna-lord hora at index 9 loses to a generic Venus hora at index 2.
Daytime only — evening horas are never considered.

**D3 — `decisions_service._optimal_window()` is not astrology.** `decisions_service.py:128`
returns `target_date + 21 days` or `+ 45 days` by verdict string. It is presented to the user
as an optimal window. It should either consult the muhurta engine or stop claiming to be a
window.

D1 and D3 are user-visible contradictions and should be fixed regardless of scope decisions
below.

## 4. Surface inventory — every place that computes or presents a day/date/time

### Backend engines

| Engine | Today | Needs |
| --- | --- | --- |
| `muhurta_service.find_best_muhurta_slots` | personal only | + general mode, + location param, + factors 3/4/4b/5/6b/8 |
| `public_tools._score_public_muhurta` (`public_tools.py:781`) | general only, **duplicate scoring logic** | delete; call the unified engine with `chart=None` |
| `daily_guidance_service.get_activity_timing` | personal endpoint, **general engine** | + general mode, + nakshatra, + Tara Bala |
| `activity_timing_rules.assess_activity_timing` | tithi + paksha + weekday only | + nakshatra, + per-activity nakshatra table |
| `activity_timing_rules.daily_activity_board` | general + a passed-in chandrashtama flag | + optional chart layer |
| `muhurtham_naal_service.match_muhurtham_naals` | **both modes already** ✅ | reference implementation; but times are a static weekday table (`:141`) not computed |
| `_dg_hora._best_hours` / `_perfect_windows` | personal, with a pre-chart fallback (`:145`) | closest to correct; add durmuhurtham exclusion |
| `panchangam_service.calculate_panchangam` | general | unchanged — it is the almanac layer |
| `event_windows.find_event_windows` | personal only | year-scale, out of scope for now |
| `decisions_service._optimal_window` | neither — arithmetic | see D3 |

### Frontend surfaces

| Surface | Mode today |
| --- | --- |
| `dashboard-plan-muhurta-picker-nova.tsx:144` | personal, `personal.chartId` only |
| `dashboard-plan-muhurta-nova.tsx:98` | personal |
| `dashboard-activity-timing-card.tsx:108` | personal |
| `dashboard-plan-muhurtham-naal-nova.tsx:163` | **both already** ✅ — handles `chartId === null` |
| `dashboard-today-glance-nova.tsx` (best hours) | personal |
| `dashboard-today-activity-board-nova.tsx` | personal |
| `dashboard-calendar-tab-nova.tsx` | personal |
| `tools/muhurta-calculator/MuhurtaTool.tsx:126` | general |
| `tools/daily-panchangam-planner/`, `panchangam/[date]/` | general |
| `mobile/app/(tabs)/today.tsx` | personal |

**The chart plumbing already exists.** `dashboard-workspace.tsx:1021` resolves
`lifeAreasViewId → member?.chart.chartId ?? personal.chartId` for the Life Areas tab. That is
exactly the selector pattern the timing surfaces need — reuse it, do not invent a second one.

## 5. Proposed architecture

```
app/calculations/muhurta_engine.py        (new — pure, no DB)
    score_day(snapshot, activity, subject: Subject | None) -> DayScore
    rank_windows(snapshot, activity, subject: Subject | None) -> list[Window]

    Subject = frozen dataclass:
        janma_nakshatra, janma_rasi, lagna_rasi,
        maha_lord, antar_lord
    Subject is None  ->  general mode. Every personal rule short-circuits,
                         nothing else changes.
```

Layered scoring, general layer first:

1. **Almanac layer** (always): tithi, nakshatra, yoga, karana, weekday, kalams, durmuhurtham
2. **Activity layer** (always): per-activity nakshatra/tithi/weekday preference tables — this is where "Poosam for gold" lives
3. **Graha layer** (always): transit dignity of the activity's karaka grahas — Jupiter/Venus for wealth
4. **Personal layer** (only when `Subject` is present): Tara Bala, Chandra Bala, Chandrashtama, dasha support, lagna-lord hora
5. **Lagna layer** (only when a clock time is being proposed): rising sign at the candidate minute; 2nd/11th occupancy

Response carries a `mode: "PERSONAL" | "GENERAL"` discriminator and a per-factor breakdown so
the UI can render the astrologer's "why selected / why rejected" explanation, including the
**Avoid** band he described.

## 6. Work items

**Phase A — foundations (no user-visible change)**
- A1. Extract `_tara_number` from `muhurtham_naal_service.py` into `app/calculations/tara_bala.py`; add Chandra Bala alongside it. Keep the naal service calling the shared version.
- A2. Add durmuhurtham to the panchangam snapshot (weekday-indexed muhurta segments; needs a source table — **astrologer input required**).
- A3. Add a full-day lagna schedule to the panchangam snapshot — 12 rising windows via `calculate_lagna_degree`. Cache implications: this is the expensive one.
- A4. Per-activity nakshatra/tithi/weekday preference tables — **astrologer input required** (see §7).

**Phase B — unified engine**
- B1. Build `muhurta_engine.py` with the `Subject | None` contract.
- B2. Port `muhurta_service` onto it; fix D1 and D2 in the port (the recommended window becomes the intersection of hora, gowri, and kalam-free time).
- B3. Delete `_score_public_muhurta`; point `/public/muhurta` at the engine with `subject=None`.
- B4. Add nakshatra + Tara Bala to `assess_activity_timing`; re-weight the `alignment*100 + score` rank (`daily_guidance_service.py:1439`) so personalisation is not drowned by a 100× almanac term.

**Phase C — API surface**
- C1. `GET /muhurta` gains optional `chartId` + required `lat/lon/tz` (activity location, defaulting to the chart's daily location). One route serves both modes.
- C2. Same for `/activity-timing`.
- C3. Typed wrappers in `packages/shared/src/api/` per CLAUDE.md — re-read the route decorators when wiring.

**Phase D — UI, every surface**
- D1. A shared `<SubjectSelector>`: *General* + every family-vault member, reusing the `lifeAreasViewId` resolution pattern.
- D2. Mount it on all seven personal surfaces in §4.
- D3. An activity-location picker on the muhurta picker (defaults to the profile's daily location).
- D4. Render the three-band result the astrologer described — **Best / Second choice / Avoid** — with per-factor reasons.
- D5. Mobile parity.

**Phase E — validation**
- E1. Golden cases: gold purchase, Chennai, a known Akshaya Tritiya / Pushya day — verified against the astrologer's own answer. Per `feedback_astrology_calc_accuracy`, unit tests alone will not catch a wrong-but-plausible muhurta.
- E2. A general-mode and personal-mode run for the same date range must differ, and the difference must be attributable to named personal factors.

## 7. What I need from the astrologer before Phase A can finish

1. **Durmuhurtham table** — start offsets and durations per weekday, from sunrise.
2. **Per-activity nakshatra lists** — for each of our activity types, the favoured and forbidden nakshatras. He gave one data point (Pushya/Poosam for gold); we need the rest.
3. **Gold / valuables as its own activity?** Our current set has `PURCHASE`. Does gold buying warrant its own rule set distinct from general purchase?
4. **Tara Bala weighting** — how much should a poor Tara Bala count against an otherwise excellent almanac day? He says he "may reject" the period; we need that as a number or a hard veto.
5. **Chandra Bala** — which of the 12 positions from Janma Rasi are acceptable, and is the veto hard or soft?
6. **Muhurta Lagna** — for a wealth purchase, is a strong 2nd/11th a bonus or a requirement? What counts as "strong"?
