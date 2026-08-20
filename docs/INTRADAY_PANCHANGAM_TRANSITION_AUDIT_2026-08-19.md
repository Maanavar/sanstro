# Intra-day Panchangam Transition Audit — 2026-08-19

**Question asked:** a civil day routinely carries two nakshatras, two tithis, two yogas and
three karanas. Did we handle that everywhere — in scoring, in prediction, in display? The
Today hero says "Swathi" when Visakam runs the day.

**Answer:** the observation is correct, and today is close to the worst possible example.
The engine computes the transition boundaries correctly and the API ships them. What is
missing is that almost every *consumer* collapses the day to the value at sunrise, one
consumer collapses it to the value at solar noon, and the two are never reconciled. There
is exactly one surface in the product that renders the limb actually in effect.

---

## 1. Today, verified

`calculate_daily_panchangam(2026-08-19, Chennai)`:

| Limb | Sunrise value | Ends | Then |
|---|---|---|---|
| Nakshatra | **SWATHI** | **06:47** | VISAKAM |
| Karana | GARAJA | 06:31 | VANIJA |
| Tithi | SAPTAMI | 19:20 | ASHTAMI |
| Yoga | BRAHMA | 03:44 (+1) | INDRA |

Sunrise is 06:00:32. Swathi holds the day for **15 minutes**, or **3.2 %** of the solar
day. Visakam holds the other 96.8 % — and the engine's own `dominant_nakshatra_number`
field says `16` (Visakam) for this date. The Today hero prints "Swathi" for all 24 hours.

---

## 2. The root cause: three different epochs, none of them agreed

`PanchangamSnapshot` is built from `_calculate_positions_at_sunrise(sunrise_jd)`
([panchangam.py:1911](app/calculations/panchangam.py#L1911)). Every scalar field on it —
`nakshatra_number`, `tithi_number`, `yoga_number`, `karana_name`, `nethiram`, `jeevan`,
`amirdhadhi_yogam_name` — is therefore *the value at sunrise*, and the `*_ends_at` /
`*_next_name` fields beside them describe the first transition after that instant.

Three epochs are then in play across the codebase:

| Epoch | Where | Used for |
|---|---|---|
| **Sunrise** | every `snapshot.<limb>` scalar | panchangam score, activity board, muhurta factors, activity-timing rules, push, PDF, monthly grid, all display |
| **Solar noon** | [daily_guidance_service.py:390-402](app/services/daily_guidance_service.py#L390-L402) — `current_jd = solar_noon`, `current_nakshatra = nakshatra_from_degree(moon…)` | Tara Bala, chandrashtama, moon_score, the "Moon transit" narrative |
| **Live now** | `activeLimb()` in [dashboard-calendar-shared.tsx:140](web/components/dashboard-calendar-shared.tsx#L140) | the Calendar tab only |

The sunrise-governing (உதய) rule is a deliberate, documented doctrine decision — see the
comment at [panchangam_service.py:390-397](app/services/panchangam_service.py#L390-L397)
(issue #9), which explicitly rejected the longest-span/dominant reading for the monthly
grid. That decision is defensible and classical. **The problem is that it was never
applied consistently, and it was never made visible.**

---

## 3. Measured impact (Chennai, 365 days from 2026-08-01)

Computed by walking real ephemeris boundaries, not estimated:

| Limb | Mean span | Days the sunrise value holds **< 50 %** of the day | Spans/yr that contain **no sunrise at all** |
|---|---|---|---|
| Nakshatra | 24.24 h | **170 / 365 (46.6 %)** | 10 |
| Tithi | 23.58 h | **185 / 365 (50.7 %)** | 17 |
| Yoga | 22.56 h | **213 / 365 (58.4 %)** | 26 |
| Karana | 11.79 h | **356 / 365 (97.5 %)** | **377 / 747 (50.5 %)** |

Worst nakshatra case in the window: 2026-10-01, where the sunrise star (Rohini) holds
**0.1 %** of the day.

The right-hand column is the sharper problem. A span that contains no sunrise is
**invisible to every sunrise-keyed lookup in the codebase** — it never names a day, never
appears in a filter, never fires an alert.

### The two epochs disagree with each other

| Metric | Value |
|---|---|
| Days where the sunrise star ≠ the solar-noon star | **85 / 365 (23.3 %)** |
| …of which the two land on **opposite sides** of `AUSPICIOUS_DAILY_NAKSHATRAS` | **37 / 365** |

On those 37 days `moon_score` gains or loses **+10** on one star while the panchangam
card, the activity board and the activity-timing rules all reason about the *other* star,
inside the same response, on the same screen. 2026-08-19 is one of the 37.

### Vishti / Bhadra is missed two times out of three

`karana_name == "VISHTI"` costs −10 in both `daily_guidance_service` and `whatif_service`.
Against real karana spans:

| | Days |
|---|---|
| Penalised (Vishti at sunrise) | 49 |
| Vishti actually occurs, **not** at sunrise → penalty never applied | **100** |
| Total days Vishti touches | 149 |
| **Miss rate** | **67.1 %** |

Karana averages 11.79 h. A karana is structurally a *half-tithi*, not a day attribute.
Keying it to sunrise is not a simplification — it is the wrong granularity.

---

## 4. Full inventory — every site, classified

### A. Correct — intra-day aware today

| Site | What it does |
|---|---|
| [dashboard-calendar-tab-nova.tsx:809-815](web/components/dashboard-calendar-tab-nova.tsx#L809-L815) | `activeLimb()` promotes tithi / nakshatra / yoga / karana to the value in effect *now*, with "active since HH:MM" |
| [PanchangamTool.tsx:403-407](web/app/\(marketing\)/tools/daily-panchangam-planner/PanchangamTool.tsx#L403-L407) | same via `limbRolledOver()`, and correctly uses `endsAtIso` rather than clock-only comparison |
| [nokku.ts](web/lib/nokku.ts) + [calendar-tab:831](web/components/dashboard-calendar-tab-nova.tsx#L831) | Nokku is derived from `nakActive.activeName`, so it flips at the star boundary |
| `chandrashtamam_janma_nakshatra_windows` ([panchangam.py:1391](app/calculations/panchangam.py#L1391)) | ships a **tuple of timed windows**, not a scalar. This is the correct shape and the model to copy |
| `_karana_factor` ([muhurta_engine.py:1010](app/calculations/muhurta_engine.py#L1010)) | explicitly reasons over the transition *pair* and refuses to certify beyond it. The most honest handler in the tree |
| Amirdhadhi Yogam | carries `ends_at` + `next_name`, and [panchangam.py:2029](app/calculations/panchangam.py#L2029) even re-derives the weekday when the star boundary crosses midnight |
| Pradhosham / Nishita tithi | already split out to their own anchors (`pradhosham_tithi_number`, `nishita_tithi_number`) |

### B. Sunrise-governed by doctrine — defensible, but the boundary is invisible

| Site | Note |
|---|---|
| Monthly calendar grid ([panchangam_service.py:398-402](app/services/panchangam_service.py#L398-L402)) | deliberate per issue #9. A grid cell can only hold one name. Fine — but the cell gives no hint that the day splits |
| `festivals.py` dating | correct: festivals are sunrise/pradhosha/nishita-anchored by rule |
| `is_subha_muhurtham` / `_strict` | day-level verdicts by construction |

### C. Defects

**F-1 — The Today hero prints the sunrise star all day, with no boundary. (the reported bug)**
[dashboard-today-ribbon-nova.tsx:239](web/components/dashboard-today-ribbon-nova.tsx#L239)
renders `tNakshatra(panchangam.nakshatra.name)` and `tTithi(panchangam.tithi.name)` raw —
no `endsAt`, no `nextName`, no `activeLimb`. It is the top strip of the Today tab. The
Calendar tab, two clicks away, says Visakam. **The app contradicts itself.**
Same defect, same data available, at:
- [home-content.tsx:110-112](web/components/home-content.tsx#L110-L112) and `:300` — marketing hero
- [mobile/src/components/PanchangamGrid.tsx:24-38](mobile/src/components/PanchangamGrid.tsx#L24-L38) — all four limbs, raw

`activeLimb` already exists, is tested, and has **exactly one consumer**. This is an
adoption gap, not a missing capability.

**F-2 — Two nakshatra epochs inside a single score.**
[daily_guidance_service.py:402](app/services/daily_guidance_service.py#L402) uses the
solar-noon Moon for Tara Bala / chandrashtama / moon_score; lines 788-793, 933-937,
1032-1037 pass the *sunrise* star to the panchangam narrative, the activity board and
`assess_activity_timing`. `build_score_reasons` receives **both** `current_nakshatra` and
`panchangam_nakshatra` and renders them in adjacent cards
([narrative_engine.py:245](app/services/narrative_engine.py#L245) vs
[:508](app/services/narrative_engine.py#L508)). 23.3 % of days these are different stars.
Neither is labelled with its epoch, so the reader sees two star names and no explanation.

**F-3 — Vishti/Bhadra keyed to sunrise misses 67 % of its occurrences.**
[daily_guidance_service.py:597](app/services/daily_guidance_service.py#L597) and
[whatif_service.py:603](app/services/whatif_service.py#L603). Karana is the wrong
granularity for a day-level flag; it needs the day's karana *schedule*.

**F-4 — Sunrise-keyed lookups silently skip limbs that never touch a sunrise.**
- [pirantha_naal_service.py:61](app/services/pirantha_naal_service.py#L61) —
  `if panchang.nakshatra_number == janma_nakshatra`. 10 nakshatra spans/yr contain no
  sunrise, so a native whose janma star falls in one gets **no pirantha naal alert that
  month**; the 30-day scan silently returns the occurrence ~27 days later.
- [muhurtham_naal_service.py:255](app/services/muhurtham_naal_service.py#L255) — filtering
  the muhurtham-naal list by star drops those days entirely. A user searching "Visakam
  days" does not get 2026-08-19, on which Visakam runs from 06:47 to the next morning.

**F-5 — Nethiram / Jeevan are pinned to the sunrise star with no boundary exposed.**
Both are computed from `nakshatra_number` at
[panchangam.py:2011-2012](app/calculations/panchangam.py#L2011-L2012) and shipped as bare
strings ([schemas/panchangam.py:219](app/schemas/panchangam.py#L219)). They flip when the
star flips, but there is no `ends_at` on the wire, so no client can correct for it. They
render on [calendar-tab:897-898](web/components/dashboard-calendar-tab-nova.tsx#L897-L898)
— **directly beside Nokku, which does roll over**. Two adjacent chips, same input, one
live and one stale.

**F-6 — The muhurta picker mixes window-aware and day-fixed factors.**
`lagna_sign_factor_at_window` ([muhurta_engine.py:1172](app/calculations/muhurta_engine.py#L1172))
and the benefic-placement factor recompute at the **selected window's midpoint**, but
`_almanac_nakshatra_factor`, `_nakshatra_factor`, `_almanac_amirdhadhi_yogam_factor`,
`_almanac_tithi_factor` and `_yoga_factor` all read the sunrise snapshot. The engine can
therefore hand back a 16:00 window whose stated reason is "Swathi is on the general
auspicious-star list" on a day where Swathi ended at 06:47. This is the same class of
defect as the D1/D2/D3 hora-overlap bug fixed on 2026-08-16.

**F-7 — Three divergent copies of the auspicious/caution star table (found in the sweep).**
| Site | Auspicious | Caution |
|---|---|---|
| [_dg_scoring.py:39](app/services/_dg_scoring.py#L39) | `{1,4,5,7,8,13,14,15,17,22,27}` | — |
| [daily_push_cron.py:259-261](app/services/daily_push_cron.py#L259-L261) | same | `{2,9,10,14,19}` |
| [pdf_export_service.py:374-378](app/services/pdf_export_service.py#L374-L378) | same | `{2,9,10,19}` |

`14` (Chithirai) appears in **both** the auspicious and the caution set in `daily_push_cron`;
because the auspicious branch is tested first, the caution branch is dead for 14. And the
push and the PDF disagree with each other on whether 14 is a caution star. Independent of
the epoch issue, but it is the same "one rule, hand-copied three times" pattern the maitri
table already bit us with.

**F-8 — The wire format can only express one transition per limb.**
`PanchangamNakshatra` has no `number` and no `next_number`; no limb has a `starts_at`; and
karana — which has **three** spans on most days — ships only `name` + `next_name`. Even a
client that wanted to render the true intra-day timeline cannot. `muhurta_engine` already
documents this as the blocker for time-level karana exclusion.

**F-9 — `dominant_*` is computed on every cache miss and read by nobody.**
[panchangam.py:2048-2050](app/calculations/panchangam.py#L2048-L2050) computes
`dominant_tithi_number`, `dominant_nakshatra_number`, `dominant_yoga_number`; they are
serialised, cached, deserialised — and have **zero consumers** since issue #9 moved the
monthly grid to sunrise-governing. The field comment ("used by the monthly calendar grid")
is now false. Each one costs up to 6-8 ephemeris boundary searches per uncached day.
Note the irony: the engine already knew today's dominant star was Visakam and threw the
answer away.

---

## 5. Doctrine rulings — decided 2026-08-19

The owner ruled all three open questions in favour of the full fix:

| | Ruling |
|---|---|
| **R-1** | **Name by sunrise, score by duration.** உதய still decides what the day is *called* — the calendar grid, festivals and headings are untouched. Every scoring input is now duration-weighted over the solar day. |
| **R-2** | **Tara Bala, chandrashtama and the Moon score follow the same epoch as the almanac score.** The sunrise/solar-noon split is gone. |
| **R-3** | **A star that never holds a sunrise is still findable**, so a native does not lose a Pirantha Naal to a rounding convention. |

### The curated almanac independently confirms R-1's naming half

Before building, I checked the 129 curated muhurtham dates (2026 + 2027, sourced
from published tamildailycalendar.com sheets) against the real spans. The
almanac's own star label agrees with **our sunrise star on 127 of 129 dates** —
including dates where that star held almost none of the day (2027-04-18 is
labelled a Pooram muhurtham date; Pooram holds **0.5%** of it). Published Tamil
almanacs really do name days by உதய, and R-1 keeps that.

**Two curated records disagree with the pattern and are worth a look:**

| Date | Curated label | Our sunrise star | Curated star's share |
|---|---|---|---|
| 2026-01-28 | ROHINI | KARTHIGAI | 88.3% |
| 2026-11-20 | UTHIRATTATHI | POORATTATHI | 97.0% |

Both curated labels match the **dominant** star instead. Either the sheet used a
different convention on those two rows, our sunrise differs from theirs there, or
the enrichment was hand-corrected. Flagged, not silently "fixed" — it is sourced
data.

---

## 6. What was built

All backend changes sit behind a cache-version bump
(`PANCHANGAM_CACHE_DATA_VERSION` 42 → 43), so no warmed cache keeps serving the
old flat answer.

### Engine — the primitive everything else needed

`PanchangamLimbSpan` and `<limb>_spans` on the snapshot: every value each limb
takes across the **solar day** (sunrise → next sunrise), with its share of that
day. Sunrise-to-sunrise rather than midnight-to-midnight because every other
anchor on the snapshot — rahu kalam, the gowri slots, the hora chain — is already
measured from sunrise. Plus `moon_rasi_spans`, because chandrashtama is a rasi
test worth −25 and the Moon crosses a rasi boundary on two days in five.

New primitives: `limb_weighted`, `limb_fraction`, `dominant_from_spans`,
`dominant_span_name`. **On a day with no transition `limb_weighted` returns
exactly what the old scalar code returned** — that property is what confines the
score movement to the days that genuinely split.

**F-9 resolved by wiring, not deleting.** `dominant_*` is now derived from the
spans rather than from three separate midnight-to-midnight walks, so it costs
nothing extra and can no longer disagree with them.

### Scoring

`weighted_panchangam_score` and `weighted_moon_score` in `_dg_scoring`, consumed
by `daily_guidance_service` **and** `whatif_service` — which previously carried a
hand-copy of the whole block plus its own drifted constant sets.

- **F-2 closed.** One epoch. `day_nakshatra` / `day_tithi` / `day_yoga` /
  `day_moon_rasi` feed the score, the reasons, the tithi card, the activity board
  and the timing rules alike. Two unlabelled star names can no longer appear on
  one screen.
- **F-3 closed.** The karana term is weighted, so a Vishti stretch is charged in
  proportion to its length instead of being all-or-nothing on the sunrise value.
  The narrative names Vishti when it holds ≥25% of the day — below that the score
  still carries the penalty proportionally, but the copy would overstate it.
- The auspicious-star bonus is now an **interval intersection** of "auspicious
  star" and "clear of the 8th rasi", not a product of two fractions. Nakshatra
  boundaries fall every 13°20' and rasi boundaries every 30°, so they interleave;
  multiplying would claim an overlap on days where the two never coincide.
- The vara terms are deliberately **not** weighted. A weekday genuinely is a
  whole-day property — weighting it would apply the fix to something that never
  had the defect.

### Lookups

**F-4 closed for Pirantha Naal**, as a *rescue* rather than a rewrite: the
classical sunrise match is tried first and still wins, so nobody's existing
observance moves. Only when a star holds the majority of a day *and* does not
hold the following sunrise either — the genuinely skipped case — does the rescue
date it. The alert carries `matched_by_overlap` so a caller can say which rule
found it, and it reads the end time off the star's own span rather than off
`nakshatra_ends_at`, which on a rescued day belongs to a different star.

### Muhurta — F-6 closed

`limb_factors_at_window` finally does what `_karana_factor` documented it could
not: *"window selection needs a full karana schedule."* It exists now. The picker
already read the lagna and the planets at the selected window's midpoint while
every limb factor stayed pinned to sunrise, so it could return a 16:00 window
whose stated reason was "Swathi is on the general auspicious-star list" on a day
where Swathi ended at 06:47.

A prohibited karana at the elected moment is **VETO-class here** — stronger than
the day-level factor — because that is the source's own distinction: it forbids
the karana at the elected moment, and this is that moment. A star shift is
reported as a scored-at-zero disclosure, so the reason list cannot silently
attribute a window to a star that had ended, without double-charging what the
day-level factor already priced.

### Wire — F-8 and F-5

Each limb ships `spans[]` (number, name, both edges as clock **and** ISO,
fraction). Additive, so existing clients are untouched. Karana's third span is
expressible for the first time. Nethiram/Jeevan gained a `nethiramJeevan` object
carrying the boundary and the post-boundary values — they derive from the Moon's
star and so flip exactly when Nokku does, which is why the two sat side by side
on the calendar card with only one of them live.

### Display — F-1, the reported bug

`limbNow()` in `packages/shared` — not in the dashboard module, so the marketing
hero does not drag that whole module into its bundle. It walks the full span
list, clamps sensibly outside it, compares **instants not clock strings**, and
returns `sunriseName` alongside `activeName` because both are wanted on screen:
the almanac really does call today a Swathi day.

Adopted by the Today ribbon, the marketing hero, and `PanchangamGrid` in mobile.
The Today ribbon now reads **"Nakshatram Visakam (Swathi until 06:47)"** instead
of "Nakshatram Swathi" for twenty-four hours.

### F-7 — three star tables collapsed to one

`AUSPICIOUS_DAILY_NAKSHATRAS` and a new `CAUTION_DAILY_NAKSHATRAS` live once in
`_dg_scoring`; `daily_push_cron` and `pdf_export_service` import them. The
`14`-in-both-sets contradiction is gone. Both surfaces now key on the day's
dominant star, so an exported PDF and the app agree about which star ran the day.

---

## 7. Corrections to sections 1–4

Two claims in the original audit did not survive implementation:

1. **`muhurtham_naal_service`'s star filter is not a sunrise-keyed scan.** It
   filters a **curated 55-dates-a-year almanac list**, so it cannot lose a star to
   a sunrise convention the way Pirantha Naal could. Applying overlap matching
   there would have added dates the published almanac does not call by that star
   — contradicting the source rather than fixing it. R-3 was therefore applied to
   Pirantha Naal only. What that surface could still use is the *display* half:
   showing the day's real star window beside the curated label. Not built — it
   needs schema changes across all four API surfaces for cosmetic gain.

2. **`PanchangamGrid` has no callers.** It is fixed and correct now, but it is
   unwired in `mobile/` — the same category as `advanced-lens-note.tsx`. Section 4
   listed it as a shipped surface; it is not one.

---

## 8. Still open

- **The week-ahead strip** keeps sunrise naming for its day chips. That is a
  calendar-style listing, so naming by உதய is right — but the score beside each
  chip is now duration-weighted. Consistent under R-1, still worth seeing on
  screen.
- **A browser pass.** The Today ribbon's new parenthetical is verified by test,
  not by eye — in particular how it reads in Tamil and how it wraps on a narrow
  viewport.
- **The two curated muhurtham records** in section 5.
- **Tamil copy review** on the three new strings (the ribbon parenthetical and
  the two `limb_factors_at_window` reasons). Not marked as reviewed.

---

## 9. Verification

| Suite | Result |
|---|---|
| `tests/test_intraday_panchangam_spans.py` (new, 20 tests) | pass |
| **Full backend suite — 3525 tests, 13 skipped** (1h 16m) | **pass, 0 failures** |
| `web` vitest, full (441 tests, incl. 8 new `limbNow` tests) | pass |
| `web` + `mobile` `tsc --noEmit` | clean (1 pre-existing unrelated error, confirmed present before these changes) |
| `ruff` on every changed Python file | clean |

**The new tests caught a real defect in my own implementation.** The epsilon used
to step the boundary search past a transition was leaking into the reported span
start, leaving an **845-microsecond gap** between consecutive spans — small enough
to look like nothing, large enough that "these spans tile the day" was false and
every interval intersection built on them would have quietly lost time at each
boundary. Fixed by separating the search probe from the reported start.

*Measurements: `calculate_daily_panchangam` and raw boundary walks over
2026-08-01 → 2027-07-31 at Chennai (13.0827, 80.2707), Asia/Kolkata.*
