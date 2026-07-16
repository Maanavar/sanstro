# Astrologer Review Queue

Standing list of shipped behaviors and copy that need a practicing
thirukanitham jyotishi's sign-off. Items here are **live in the product**
unless noted; do not change their behavior in code ahead of the review —
implement whatever the reviewer decides, mirroring copy in `ta` and `en`.

Add new items to the top with a date. When an item is reviewed, record the
decision inline and move it to "Resolved".

## Open

### 2026-07-14 · Sevvai "extended_manglik" mode has no verified differentiation (audit A-5)

- **Where:** `app/calculations/_yoga_helpers.py` (`TAMIL_SEVVAI_HOUSES`,
  `EXTENDED_SEVVAI_HOUSES`), `docs/SEVVAIRAGU.MD` §4.1.
- **Behavior:** both constants are currently the identical set
  `{1,2,4,7,8,12}`. `TAMIL_SEVVAI_HOUSES` is now confirmed correct against
  mainstream Kuja/Chevvai Dosham references (house 1 included in the
  standard set, not just "extended"). No authentic source was found
  describing what should make `extended_manglik` wider or otherwise
  different — the frozen spec doc's implied version (adding just house 1)
  no longer holds once house 1 is confirmed part of the standard set.
- **Options for reviewer:** confirm the two modes are genuinely redundant and
  the API parameter should be removed (checking `app/api`, `packages/shared`,
  `mobile` callers first per the API-contract rule) · supply a real
  differentiated house/chart-reference list for `extended_manglik`.

### 2026-07-13 · Abhijit demotion in the Today hero (DASH-10.1)

- **Where:** `web/lib/today-windows.ts` (`pickFeaturedWindow`; moved from
  `dashboard-today-tab-nova.tsx` during DASH-01).
- **Behavior:** the hero's featured best-window never shows the Abhijit
  window when any PERSONAL_HORA window exists. Classically Abhijit is the
  universal daily auspicious window; hiding it entirely is a doctrine
  deviation made for UX variety (it sat at ~12:02–12:50 every day).
- **Options for reviewer:** keep as-is · show Abhijit as a secondary chip ·
  feature it on days with no strong personal hora.

### 2026-07-13 · UPACHAYA grouped with MARAKA/DUSTHANA copy (DASH-10.2)

- **Where:** `web/components/dashboard-today-glance-nova.tsx`
  (`dashaSentiment`).
- **Behavior:** UPACHAYA house activations read "testing period · go gently",
  same as MARAKA/DUSTHANA. Upachaya houses (3/6/10/11) classically improve
  with effort — "go gently" may be miscalibrated.
- **Options for reviewer:** keep · separate "grows with effort" phrasing for
  UPACHAYA (needs `ta` + `en` wording from the reviewer).

### Carried over from earlier sessions (pointers, not restated here)

- Propensity suites: 40 signature definitions need native-Tamil/jyotishi
  post-hoc review (see memory `project_propensity_insights_2026-07`).
- Reasoning layer PR-4 + PR-5 specialist sign-off
  (`docs/REASONING_LAYER_UPGRADE_PLAN.md` §15.3, §16).
- A-04 (former AGENT_WORKBOARD) astrologer review.
- Degree/adhipathi audit: T9/T10 astrologer-gated items remain open; the 2
  functional-nature table cells flagged there are the same ones resolved
  below under 2026-07-14 (audit A-2) (see memory
  `project_thirukanitham_degree_adhipathi_audit_2026-07`).
- Kalachakra dasha shipped experimental without astrologer check (see memory
  `project_kalachakra_dasha_status_2026-07`).

## Resolved

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
