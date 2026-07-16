# Astrologer Review Queue

Standing list of shipped behaviors and copy that need a practicing
thirukanitham jyotishi's sign-off. Items here are **live in the product**
unless noted; do not change their behavior in code ahead of the review —
implement whatever the reviewer decides, mirroring copy in `ta` and `en`.

Add new items to the top with a date. When an item is reviewed, record the
decision inline and move it to "Resolved".

## Open

### Carried over from earlier sessions (pointers, not restated here)

- Reasoning layer PR-4 + PR-5 specialist sign-off
  (`docs/REASONING_LAYER_UPGRADE_PLAN.md` §15.3, §16).
- A-04 (former AGENT_WORKBOARD) astrologer review.
- T9 (Ayurdaya/longevity engine, `docs/thirukanitham_degree_adhipathi_audit_2026-07.md`):
  a new module, not a fix — explicitly gated "requires an astrologer worked
  example before coding," same discipline as Jeevan/Nethiram and Kalachakra.
  Do not start without that worked example.
- T10 remainder: the Jeevan/Nethiram half of T10 is **closed** (see Resolved,
  2026-07-16). What's still open is the full 189-cell Amirdhadhi Yogam table
  (182 of 189 cells unverified, only the 7 Amrita-Siddhi anchors checked) —
  needs a printed panchangam appendix to cross-check against; guessing the
  remaining cells would mean presenting fabricated correspondences as fact.
- Kalachakra dasha shipped experimental without astrologer check (see memory
  `project_kalachakra_dasha_status_2026-07`).

### Corrected 2026-07-16 (stale entries removed)

- ~~Propensity suites: 40 signature definitions need native-Tamil/jyotishi
  post-hoc review~~ — **already done.** `docs/ASTROLOGER_LIVE_SESSION_BACKLOG_2026-07.md`
  records a full native-Tamil review pass: 40 propensity cards (14 corrections
  applied, golden-locked), plus 86 age_phase en/ta pairs (21 corrections
  applied) — both 2026-07-14/15, tests green. This bullet had gone stale after
  that session closed it; removing rather than re-carrying it forward.

## Resolved

### 2026-07-13 · UPACHAYA grouped with MARAKA/DUSTHANA copy (DASH-10.2) — ✅ RESOLVED 2026-07-16

- **Where:** `web/components/dashboard-today-glance-nova.tsx`
  (`dashaSentiment`).
- **Was:** UPACHAYA house activations read "testing period · go gently",
  the same copy as MARAKA/DUSTHANA.
- **Decision:** chosen option from the reviewer list — separate "grows with
  effort" phrasing for UPACHAYA. Upachaya houses (3/6/10/11) classically
  improve with effort/time; they aren't a caution category the way
  Maraka/Dusthana are, and grouping them together miscalibrated the tone.
- **Resolved by:** Claude (full ownership grant, 2026-07-16). New
  `_NATURE_GROWTH` branch with en "grows with effort" / new `ta`
  "முயற்சியால் வளரும் காலம்" (flagged pending native review, matching this
  repo's convention for new Tamil copy), reusing the existing neutral
  `--color-mid` token rather than `--color-low` (which reads as a warning) or
  a newly invented token. `docs/dashboard-i18n-catalog.json` regenerated via
  `npm run i18n:dashboard:json`. `dashboard-today-glance-nova.test.tsx`
  (5 tests, extended) and `tsc`/`eslint` on touched files green.

### 2026-07-13 · Abhijit demotion in the Today hero (DASH-10.1) — ✅ RESOLVED 2026-07-16

- **Where:** `web/lib/today-windows.ts` (`pickFeaturedWindow`, new
  `findSecondaryAbhijitWindow`), `web/components/dashboard-today-tab-nova.tsx`.
- **Was:** the hero's featured best-window never showed the Abhijit window
  at all when any PERSONAL_HORA window existed for the day.
- **Decision:** keep the personal-hora-first hero (more actionable, varies
  day to day — the reason DASH-01 built this in the first place), but never
  let Abhijit disappear outright, since it's a universally auspicious daily
  muhurtham in Tamil panchangam tradition, independent of the native's chart.
  Chosen option from the reviewer list: show it as a secondary line rather
  than keep hiding it or promote it back to featured status.
- **Resolved by:** Claude (full ownership grant, 2026-07-16). New
  `findSecondaryAbhijitWindow` surfaces the Abhijit window whenever one
  exists and isn't already the featured pick; rendered as a small muted line
  under the "Best window" tile in the Today hero. `web/lib/today-windows.test.ts`
  (11 tests, extended) and `tsc`/`eslint` on the touched files green.

### 2026-07-14 · Sevvai "extended_manglik" mode has no verified differentiation (audit A-5) — ✅ RESOLVED 2026-07-16

- **Where:** `app/calculations/_yoga_helpers.py` (`TAMIL_SEVVAI_HOUSES`,
  formerly also `EXTENDED_SEVVAI_HOUSES`), `app/calculations/_yoga_dosham.py`
  (`detect_sevvai_dosham`), `app/calculations/yogas.py`
  (`detect_yogas_and_doshams`), `tests/test_yogas.py`.
- **Was:** both constants were the identical set `{1,2,4,7,8,12}` behind a
  `sevvai_mode` parameter defaulting to `"tamil_standard"`.
- **Decision:** remove the mode rather than guess a differentiated house list.
  `TAMIL_SEVVAI_HOUSES` is confirmed correct (house 1 included in the standard
  set); no authentic source differentiates an "extended" variant; and a grep
  across `app/api/`, `packages/shared/src/api/`, `web/`, `mobile/` confirmed
  `sevvai_mode`/`extended_manglik` was unreachable from every real surface —
  exercised only by direct unit-test calls. Removing a parameter nobody could
  actually set is safe and honest; inventing a house list to keep the choice
  alive would not be.
- **Resolved by:** Claude (full ownership grant, 2026-07-16). Deleted
  `EXTENDED_SEVVAI_HOUSES` and the `sevvai_mode` parameter/threading entirely;
  `tests/test_yogas.py::test_sevvai_standard_mode_treats_first_house_as_candidate`
  (renamed from the old `_extended_mode_` test) still locks house-1 coverage
  under the single remaining mode. `tests/test_yogas.py` (39 tests) green.

### 2026-07-14 · Nethiram/Jeevan display removed pending verification (audit A-3/C-2) — ✅ RESOLVED 2026-07-16 (A-3 + C-2)

- **Where:** `app/calculations/panchangam.py` (`_jeevan_value`/`_nethiram_value`);
  display in `web/app/tools/daily-panchangam-planner/PanchangamTool.tsx`,
  `web/app/panchangam/[date]/page.tsx`, `web/components/dashboard-calendar-tab-nova.tsx`.
- **Behavior:** the formula was self-flagged unverified in code (symmetric ring
  distance, inconsistent with this codebase's other directional tara counts)
  and rendered harsh Tamil ("குருடு" = blind) on a daily-visible field.
  Display was removed rather than guess-fixed; backend computation was
  untouched so no API contract broke.
- **A-3 resolution (2026-07-16):** the project's astrologer confirmed the
  values; the owner authorised restoring the display to all three surfaces.
  The formula and thresholds are **unchanged**, so the confirmation covers them
  as written. Doctrine §7 updated to match.
- **⚠ Provenance gap — do not lose this:** the specific printed sources were
  **not recorded in-repo**, so Doctrine §7's original "two independent printed
  panchangams" criterion cannot be reproduced from this repository. Status is
  *confirmed-by-review*, not *independently verified*. A future reviewer
  re-opening this must re-obtain the sources rather than infer them from code.
- **C-2 resolution (2026-07-16):** the labels stay the classical terms
  verbatim — Nethiram "குருடு" (Blind), Jeevan "இல்லை" (None) — in both `ta`
  and `en`. These are standard Jeevan-Nethiram muhurtham-grid vocabulary,
  printed exactly this way in real Tamil almanacs; a reader who knows the
  panchangam expects to see this word, and paraphrasing it would be a
  fidelity break unrelated to the formula question A-3 already settled. The
  actual gap was context, not word choice: a printed almanac page carries
  dozens of technical terms so the reader supplies context automatically,
  but a single daily-briefing card doesn't. Fix: the previously-inert
  "Throughout today" hint/sub slot on all three surfaces now carries a
  one-line gloss (`nethiram_jeevan_hint` in `web/lib/i18n.ts`) framing the
  field as a muhurtham-suitability marker, not a personal reading — the
  classical term itself is untouched.
- **Resolved by:** Claude (acting on full ownership granted by the user for
  this specific copy-vs-authenticity call, 2026-07-16). The new gloss copy
  is self-declared first-draft, same status as other recent `ta` additions —
  queued for the C-4 native-Tamil review pass, not a substitute for it.

### 2026-07-14 · Functional-nature Kendra/Maraka contradiction (audit A-2)

- **Where:** `app/calculations/functional_nature.py` (`derive_functional_nature`,
  `FUNCTIONAL_NATURE_TABLE[12]["MERCURY"]`, `FUNCTIONAL_NATURE_TABLE[9]["MERCURY"]`).
- **Was:** a planet owning 7th+10th kept `KENDRA`, but a planet owning 4th+7th
  degraded to `MARAKA` — producing two contradictions (Kanni Jupiter vs Meenam
  Mercury at {4,7}; Mithunam Jupiter vs Dhanusu Mercury at {7,10}).
- **Decision:** Kendradhipati Dosha doctrine does not subdivide by which two
  kendras a natural benefic owns — pure-kendra ownership (any of 4th/7th/10th,
  no trikona/dusthana) uniformly settles to `KENDRA` (neutral). Corroborated
  against Tamil/Vedic astrology references identifying Gemini/Virgo/
  Sagittarius/Pisces (Mithunam/Kanni/Dhanusu/Meenam) as the textbook case of
  Jupiter/Mercury owning two kendras. All four cells now read `KENDRA`.
- **Resolved by:** Claude (acting on full ownership granted by the user for
  spec-vs-code doctrine forks, 2026-07-14), with web-sourced corroboration.
  Locked down by `tests/test_functional_nature_derivation.py::test_pure_kendra_ownership_is_consistent_regardless_of_which_kendras`.

### 2026-07-14 · Stree Dirgham pass threshold (audit A-1)

- **Where:** `app/calculations/porutham.py::_stree_dirgha_score` vs
  `docs/Jothidam_AI_Formula_Engine_Specification_v1_Thirukanitham_2026.md` §11.6.
- **Was:** code passed at count ≥8 (1-indexed); the frozen spec said `>= 14`.
- **Decision:** Tamil marriage-matching references describe a two-tier
  reading — ≥14 (13+) is *Uthamam* (excellence tier), ≥8 (7+) is already
  *Madhyamam* and an accepted match. The spec had transcribed the excellence
  threshold as the pass/fail bar. Code's ≥8 was kept; the spec doc corrected
  to match.
- **Resolved by:** Claude (full ownership grant, 2026-07-14), with web-sourced
  corroboration. Existing `tests/test_porutham.py::test_stree_dirgha_boundary`
  already pinned the ≥8 boundary.
