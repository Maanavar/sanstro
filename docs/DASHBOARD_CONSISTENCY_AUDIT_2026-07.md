# Dashboard Consistency & Wiring Audit — 2026-07-11

Full code-level audit of the Nova dashboard: API↔frontend wiring, presentation-vs-reasoning
conflicts, Thirukanitham calculation fidelity, and 2026+ future-readiness.
Method: all ~140 backend routes cross-referenced against `web/`, `packages/shared/`, and
`mobile/` consumers; scoring/reasoning services read end-to-end; calculation tables checked
against classical Tamil rules **in code**, not from prior audit docs.

**Verdict:** wiring is near-complete and the calculation core is classically faithful and
fully ephemeris-driven. Three genuine presentation-vs-reasoning conflicts exist on the Today
tab, plus dead code and a hard January-2027 data cliff on the curated almanac side.

---

## Part 1 — Findings

### F1 (P0) · Chandrashtama days can headline as green "Good day"

**Where:** `web/components/dashboard-today-tab-nova.tsx:413,424` → `getScoreVerdict(score)`
in `web/lib/format.ts:91`; backend rule at `app/services/daily_guidance_service.py:490-493`.

**Explanation:** The engine encodes a real Thirukanitham prohibition — *no day with the Moon
in ashtama (8th from janma rasi) may be labelled positively* — by demoting the backend
`label` to `BALANCED` whenever `chandrashtama` is true. But the Today dial's headline verdict
is computed **from the raw `score` only**. A chandrashtama day can still total 65–70 when
dasha/transit/panchangam components are strong, so the dial shows a green "நல்ல நாள் / Good
day" while the reasons text below says rest day. The frontend silently defeats a doctrinal
rule the backend deliberately enforces.

**Data already available:** `DailyGuidanceData` exposes both `label` and `isChandrashtama`
(`packages/shared/src/types/index.ts:393,424`) — no backend change needed.

### F2 (P1) · Today-glance dasha sentiment uses the wrong doctrine (natural split, not functional nature)

**Where:** `web/components/dashboard-today-glance-nova.tsx:28-39` (`_DASHA_BENEFIC`,
`_DASHA_CHALLENGING`, `dashaSentiment()`), called at line 290 with
`personalChartSummary.currentAntardasha`.

**Explanation:** The glance hardcodes Jupiter/Venus → "supportive period" and
Saturn/Mars/Rahu/Ketu → "testing period · go gently" regardless of Lagna. The backend
everywhere else (dasha service, daily-guidance modifiers, remedies, adhipathi report) uses
**Lagna-dependent functional nature**: Saturn is YOGAKARAKA for Rishaba/Thulam lagnas, Mars
for Kadagam/Simmam, Venus is MARAKA for Mesha lagna, etc. A Thula-lagna user in Saturn
antardasha sees a red "testing period" one-liner on the same page where the Dasha panel and
daily-guidance reasons (correctly) describe a supportive Yogakaraka period.

This is the **only remaining frontend astrology fork** in the codebase, and the correct data
is already in the very prop the component reads:
`ChartSummaryData.functionalNature?: Record<string, string>`
(`packages/shared/src/types/index.ts:347`), built by
`app/services/_chart_summary.py:91-101` with uppercase-English planet keys and
Rahu/Ketu dispositor logic included.

### F3 (P1) · Score-band thresholds disagree between backend label and frontend verdict

**Where:** backend `_score_label` in `app/services/_dg_scoring.py:149-158`
(STRONG_SUPPORT ≥80 · GOOD ≥65 · BALANCED ≥50 · CAUTION ≥35 · RESTORATIVE <35) vs frontend
`getScoreVerdict` in `web/lib/format.ts:91-96` ("Good day" ≥60 · "okay" ≥50 · "take care" <50)
and `getScoreBand` (`format.ts:70-76`, strong ≥70 · supportive ≥60 · steady ≥50 · soft
caution ≥40).

**Explanation:** The backend `label` is rendered verbatim in several places
(`dashboard-today-deepdive-extras-nova.tsx:240` chip, `dashboard-personal-hero.tsx:137,178`,
`dashboard-family-member-nova.tsx:345`, `dashboard/daily-score/page.tsx:170`,
`dashboard-daily-snapshot.tsx:131`). A score of 60–64 therefore shows a green "Good day"
dial next to a "BALANCED" chip on the same screen. Mixed messaging on one screen; users who
compare notice.

**Note:** F1 and F3 share one root cause — the headline verdict ignores the backend `label`,
which already encodes both the canonical thresholds *and* the chandrashtama cap. One fix
closes both.

### F4 (P2) · Dead endpoint: `GET /charts/{id}/transits/major`

**Where:** `app/api/transits.py:58-66`; service fn `get_major_transits`
(`app/services/transit_service.py:102`); test
`tests/test_transits_api.py:102`.

**Explanation:** Zero callers in `web/`, `packages/shared/`, and `mobile/`. It returns the
same `TransitSnapshotResponse` shape as `gochar/current`, which *is* consumed. Dead surface
area = maintenance cost + a second code path that can silently drift from the wired one.

### F5 (P2) · Dead field: Jadhagam report `upcomingPeriods` is always `[]`

**Where:** `app/services/_chart_summary.py:444` (`upcoming_periods=[]` hardcoded);
schema `app/schemas/charts.py:319`; zero renders in `web/` (grep: no `upcomingPeriods`
usage outside types).

**Explanation:** Schema promises a list of upcoming periods; the service never populates it;
the panel never renders it. Either populate from the dasha timeline (which already computes
future maha/antar periods — `calculate_vimshottari_timeline` generates 240 years) or remove
the field. An always-empty field invites a future consumer to trust it and show an empty
section.

### F6 (P3) · Dead helpers with contradictory thresholds in the workspace

**Where:** `web/components/dashboard-workspace.tsx:224-233` — `formatScoreLabel()` and
`memberScoreColor()`.

**Explanation:** Both are defined and never called (Classic-removal leftovers).
`memberScoreColor` uses 65/45 thresholds that contradict the canonical four-band palette
(`scoreBandColor`, 70/60/50). Harmless today, but the first person to "reuse the existing
helper" reintroduces a third banding scheme.

### F7 (P1, time-boxed) · January-2027 cliff in curated almanac data + hardcoded YEAR

**Where:**
- `app/data/panchangam_events_2026.py` — only year in `EVENTS_BY_YEAR`
  (`app/services/panchangam_events_service.py:18-19`); any 2027 query → 404
  ("No calendar published for 2027").
- `app/data/calendar_categories_2026.py` — same single-year situation
  (`app/services/calendar_category_service.py:7`).
- `web/app/tamil-calendar/page.tsx:6`, `web/app/tamil-calendar/[event]/page.tsx:9`,
  `web/app/tamil-calendar/calendar-category-api.ts:4` — `YEAR/CALENDAR_CATEGORY_YEAR = 2026`
  hardcoded.
- SEO keyword strings bake "2026" into event metadata
  (`app/services/panchangam_events_service.py:53-170`).
- `app/data/muhurtham_naals.py` covers 2026 (55 dates) + 2027 (74 dates) — runway to Jan 2028.

**Explanation:** Everything *computed* (daily/monthly panchangam, dashas, peyarchi,
varshaphala) is ephemeris-driven and valid indefinitely — the dashboard Calendar tab's
monthly grid does not break. The cliff hits the **public tamil-calendar pages** (SEO traffic)
and any event-date lookups: on 2027-01-01 they 404. Needs the 2027 almanac dataset curated
**and** the year made dynamic, by ~Q4 2026.

### F8 (tracked, not new) · Known doctrine items awaiting astrologer sign-off

- Two functional-nature cells are internal contradictions pinned in code
  (`app/calculations/functional_nature.py:66-71`): Lagna 6 Jupiter vs Lagna 12 Mercury
  (both own {4,7}); Lagna 3 Jupiter vs Lagna 9 Mercury (both own {7,10}).
- Kalachakra dasha remains experimental (source text has a pada mislabel; code trusts the
  table).

No code action — keep gated/flagged until astrologer review. Listed here so this audit is
complete.

---

## Part 2 — Verified clean (checked in code, no action)

| Area | What was verified |
|---|---|
| Vimshottari | Opening balance from Moon-nakshatra fraction; subperiods proportional over 120; **unclipped opening-antardasha reconstruction** (`app/calculations/dasha.py:99-135`) — correct |
| Rahu kalam / Yamagandam / Kuligai | Weekday slot tables (`app/calculations/panchangam.py:106-108`) match classical Pambu Panchangam segment-by-segment |
| Gowri panchangam | 8-kala cycle + good/bad sets match frozen spec, cross-checked source noted in code |
| Porutham | Gana table, hostile yoni pairs, zigzag (non-contiguous) nadi cycle, Rajju/Vedha as absolute vetoes — all classical (`app/calculations/porutham.py`) |
| Chandrashtama | 8th from janma rasi, inclusive count (`app/calculations/astro.py:115-122`) |
| Aspects | Single consolidated Parashari table (`app/calculations/aspects.py`) imported by all consumers — old cross-module inconsistency is gone |
| Natural friendship | `_dg_scoring.py` friend/enemy tables match Parashari |
| Scoring engine | Today / range / week-ahead all delegate to one `get_daily_guidance` with shared cache — no cross-tab score divergence; reasons are built from the same computed components as the score |
| Peyarchi | Fully ephemeris-computed, bisection search + 90-day retrograde guard — never goes stale |
| Predictions | Life-areas and marriage/career/wealth/health share `app/calculations/` + `app/reasoning/` — no forks |
| Wiring | All services consumed (3 apparent orphans are scheduler crons in `app/scheduler.py`); chara/yogini/ashtottari/kalachakra dashas all have panels; adhipathi report + primary concerns flow backend → shared types → Jadhagam panel |
| IA / flow | 6 rail tabs + Explore-depth screens with normalized hub→list→detail back-nav; member selectors on Today/Life-Areas/Transits; remedies cleared on member switch; owner's family-strip score reconciled to live daily guidance |

---

## Part 3 — Fix plan

Order: FIX-1 → FIX-2 → FIX-3 → FIX-4 → FIX-5. Each step lists the change, the wiring
check (all four contract surfaces where relevant: `app/api` · `packages/shared` · `mobile` ·
`web`), and the no-new-conflict check.

### FIX-1 · Verdict derives from backend `label` (closes F1 + F3 together)

**Change (web only — backend already correct):**
1. In `web/lib/format.ts`, add:
   ```ts
   /** Headline verdict from the backend label — the label already encodes the
    *  canonical thresholds AND the chandrashtama cap, so word/colour can never
    *  contradict the engine. Falls back to score-only when label is absent
    *  (e.g. tomorrow-preview rows from older cached payloads). */
   export function getScoreVerdictFromGuidance(
     label: string | null | undefined,
     score: number,
     lang: "ta" | "en",
   ): ScoreVerdict
   ```
   Mapping: `STRONG_SUPPORT`/`GOOD` → high/"Good day"; `BALANCED` → mid/"An okay day";
   `CAUTION`/`RESTORATIVE` → low/"Take care"; unknown/missing label → existing
   `getScoreVerdict(score, lang)` fallback. Colour comes from the tone
   (high → `SCORE_GOOD`/`SCORE_STRONG` by score, mid → `SCORE_FAIR`, low → `SCORE_WEAK`)
   so the dial's word and colour still agree — this preserves the documented invariant.
2. Swap both call sites in `dashboard-today-tab-nova.tsx` (lines ~413 and ~424) to pass
   `tomorrowGuidance.label` / `personalDailyGuidance.label` alongside the score.

**Deliberate non-goals:** week-strip/calendar dots keep `scoreBandColor(score)` — they are
relative visual indicators, not verdicts; changing them is scope creep. `getScoreBand`'s
70/60/50 palette is a product colour decision and stays.

**Wiring check:** `label` is already in `DailyGuidanceData` for web and mobile via shared
types — no backend, shared, or mobile change. Confirm mobile's Today screen verdict (if it
renders one) for the same raw-score pattern; file a follow-up if found.

**Conflict check:** after the change, on any payload the dial word must equal the
plain-language rendering of the chip label. Add a unit test: for each backend label +
boundary scores {34,35,49,50,64,65,79,80}, `getScoreVerdictFromGuidance` tone matches the
label band; and with `label="BALANCED", score=72` (chandrashtama case) the verdict must be
mid, never "Good day".

### FIX-2 · `dashaSentiment` uses functional nature with natural-split fallback (closes F2)

**Change (web only — data already delivered):**
1. In `dashboard-today-glance-nova.tsx`, extend `dashaSentiment(antardashaLord, lang)` to
   `dashaSentiment(antardashaLord, functionalNature, lang)` where `functionalNature` is
   `personalChartSummary.functionalNature?.[antardashaLord]`:
   - `YOGAKARAKA` / `LAGNA_LORD` / `TRIKONA` → supportive (high)
   - `KENDRA` / `NEUTRAL` → steady, mixed (mid)
   - `MARAKA` / `DUSTHANA` / `UPACHAYA` → testing · go gently (low)
   - value missing (older cached summaries) → current natural benefic/malefic split,
     unchanged.
2. Update the call at line ~290. Keep the weather-framed, never-fatalist copy.

**Wiring check:** `functionalNature` is produced by `_chart_summary.py:91-101` (uppercase
English keys incl. RAHU/KETU with dispositor logic) and typed in shared
(`ChartSummaryData.functionalNature`). `currentAntardasha` is the uppercase timeline lord —
key formats already match. No backend/shared/mobile change.

**Conflict check:** with this fix the glance one-liner, the Dasha panel text
(`dasha_service.py` — functional-nature-driven), and daily-guidance `dashaSupport` reason all
derive from the same doctrine. Test: Thula lagna + Saturn antardasha → supportive; Mesha
lagna + Venus antardasha → testing (MARAKA); missing table → Jupiter supportive (fallback).
Component test file already exists as a pattern (`dashboard-explore-*.test.tsx`) — add
`dashboard-today-glance-nova.test.tsx`.

### FIX-3 · Delete dead code (closes F4, F5, F6)

1. **`transits/major`:** remove route (`app/api/transits.py:58-66`), service fn
   `get_major_transits` (`app/services/transit_service.py:102`), and its test
   (`tests/test_transits_api.py:102-…`).
   *Wiring check before delete (per CLAUDE.md contract rule):* re-grep all four surfaces for
   `transits/major` — web: 0, shared: 0, mobile: 0 (verified 2026-07-11). No shared wrapper
   exists for it, so nothing to delete there.
2. **`upcomingPeriods`:** remove `upcoming_periods` from `JadhagamReportData`
   (`app/schemas/charts.py:319`) and the `upcoming_periods=[]` line
   (`_chart_summary.py:444`). Grep `upcomingPeriods` in shared/mobile/web types first —
   currently only the schema and service line exist; if a shared type mirrors it, remove in
   the same commit. (Alternative — populating it from the dasha timeline — is a product
   decision; default to removal, revisit if the panel wants a "next periods" section.)
3. **Workspace helpers:** delete `formatScoreLabel` and `memberScoreColor`
   (`dashboard-workspace.tsx:224-233`). Verify `getScoreBand` import is still used by the
   remaining code in that file; drop the import if orphaned.

**Conflict check:** full test suite + `tsc` — a compile error here would reveal a hidden
consumer; none expected.

### FIX-4 · 2027 almanac + dynamic year (closes F7) — schedule by Q4 2026

1. Curate `app/data/panchangam_events_2027.py` and `app/data/calendar_categories_2027.py`
   from the 2027 almanac sheet (same AUTO-GENERATED format; source noted in header).
2. Register in the year maps (`panchangam_events_service.py:EVENTS_BY_YEAR`,
   `calendar_category_service.py`) — the services already 404 gracefully per year, so data
   registration is the only backend change.
3. Make the web year dynamic: replace the three hardcoded constants with a resolver —
   default to the current year when published, else the latest available year (the
   `available_years()` list is already exposed via the 404 detail; add a proper
   `GET /public/panchangam-events/years` or include `availableYears` in the list response,
   and add a year switcher on the page so 2026 pages stay live for SEO).
4. Regenerate SEO keyword strings per-year (template `f"pournami {year}"` instead of baked
   literals) — keep the Tamil variants.
5. Muhurtham naals: covered through 2027; add 2028 dates in the same pass (cheap while the
   almanac sheet is open).

**Wiring check:** panchangam-events/calendar-categories are consumed only by the public
tamil-calendar pages (verified — dashboard Calendar tab uses computed monthly panchangam +
muhurtham-naals). If a `years` endpoint is added, add its typed wrapper to
`packages/shared/src/api/` per the forward policy — re-read the route decorator before
wiring (path/verb drift has bitten twice before).

**Conflict check:** event dates for 2027 must be validated against the almanac source before
publish (domain-calc bugs are silent — golden-case validation, not just unit tests). Spot
check: first pournami/amavasai of 2027 against tamildailycalendar.com.

### FIX-5 · No-action items to keep visible

- Two functional-nature contradiction cells + Kalachakra pada question → astrologer review
  queue (existing backlog).
- Mobile Today screen: verify whether it has its own raw-score verdict (F1-pattern) — audit
  scoped web; one grep + visual check.

---

## Part 4 — Verification protocol (after FIX-1..3)

1. `tsc` + eslint + vitest in `web/` (component tests from FIX-1/FIX-2 included).
2. Backend: pytest against the **test DB** (`JOTHIDAM_DATABASE_URL` → port 5433 or SQLite,
   per CLAUDE.md) — expect the removed `transits/major` test gone, everything else green.
3. Live browser pass on Today tab: pick a date where the profile is chandrashtama (the
   calendar's chandrashtama windows make this findable) and confirm dial ≠ green, dial word
   == chip word; check the dasa-chapter glance sentiment against the Dasha panel text for
   the same person.
4. Confirm no consumer breaks on the removed schema field (Jadhagam panel renders
   unchanged).

---

## TODO

- [x] **FIX-1a** Add `getScoreVerdictFromGuidance(label, score, lang)` to `web/lib/format.ts` + unit tests (boundary scores × labels; chandrashtama case)
- [x] **FIX-1b** Swap both verdict call sites in `dashboard-today-tab-nova.tsx` to the label-aware verdict
- [x] **FIX-2a** Rework `dashaSentiment` in `dashboard-today-glance-nova.tsx` to use `personalChartSummary.functionalNature` with natural-split fallback
- [x] **FIX-2b** Add `dashboard-today-glance-nova.test.tsx` (Thula+Saturn supportive; Mesha+Venus testing; fallback path)
- [x] **FIX-3a** Delete `transits/major` route + `get_major_transits` + its test
- [x] **FIX-3b** Remove `upcoming_periods` from schema + service (grep shared/mobile first)
- [x] **FIX-3c** Delete `formatScoreLabel` / `memberScoreColor` from `dashboard-workspace.tsx`
- [x] **FIX-V** Run verification protocol (tsc/eslint/vitest, pytest on test DB) — all green (tsc clean, vitest 96/96, pytest 19+33 relevant tests passed). Live browser Today-tab pass on a chandrashtama date still pending (needs manual/browser verification, not done in this pass).
- [ ] **FIX-4** (by Q4 2026) Curate 2027 panchangam-events + calendar-categories data; dynamic year on tamil-calendar pages (+ shared wrapper if a years endpoint is added); templated SEO keywords; 2028 muhurtham naals
- [x] **FIX-5** Grep mobile Today screen for a raw-score verdict (F1 pattern) — confirmed clean: `mobile/src/api/guidance.ts` is a thin API wrapper only, no screen renders a score-to-verdict word yet, so no F1-pattern fix needed on mobile. Astrologer queue (2 functional-nature cells + Kalachakra pada) remains open, unrelated to this pass.
