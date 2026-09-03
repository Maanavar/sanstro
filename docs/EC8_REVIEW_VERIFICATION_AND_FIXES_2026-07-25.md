# EC-8 — External review: verification and fixes

**Date:** 2026-07-25
**Trigger:** A four-way external review (Gemini / Claude / ChatGPT / meta-review) of a
Family & Charts screenshot, delivered as "EC-8 — Consolidated Review Corrections &
Narration Layer Spec".
**Scope of this document:** what the review got right, what it got wrong, and what was
built in response.

The review's central claim — *"the calculation engine is correct; all defects are in the
detection → narration bridge"* — is **correct**, and is the same conclusion the
2026-07-18 astrologer review reached. This engine consistently runs ahead of its UI, and
reviewers working from screenshots keep reporting "missing" for things that are computed
but unrendered. Three of the review's five P0s are that mistake.

---

## 1. Verification results

| Item | Review's claim | Verdict | Evidence |
|---|---|---|---|
| **P0-1** transit conjunction undetected | Bug | ✅ **Confirmed** | `_planet_transit_contacts` detected conjunctions correctly but opened with `if source == natal_planet.graha: continue`, deleting every *return* (Guru-over-Guru, Sani-over-Sani, Rahu-over-Rahu). No ranking ladder either — non-conjunctions fell back to `contacts[0]`, i.e. source order, i.e. Mars. |
| **P0-2** graha yuddham undetected | Bug | ❌ **Wrong** | `chart_strength.detect_planetary_wars()` — 1° orb, Sun/Moon/nodes/Mandhi excluded, −15 to the loser, called from three build paths, 5 tests, signed off in two audit docs. **Real defect: it is score-only and was never narrated.** Also: the review's proposed winner rule (*lower longitude wins*) is the **inverse** of the code's, which was deliberately fixed as OQ-1 on 2026-07-16 to stop a sign-boundary flip. Adopting it would have re-opened that bug. |
| **P0-3** natal yuti absent | Bug | ❌ **Mostly wrong** | `_build_conjunctions()` builds same-sign clusters with full pairwise maitri and renders as its own section, which *is* on the Family & Charts page. True sub-claims: no per-card "shares its house with" line, and no conjunction line in the chart summary. |
| **P0-4** age gating not applied to planet cards | Bug | ✅ **Confirmed** | `chart_explanation_service` imported nothing from `age_phase_service`. The quoted "re-read an important message before sending it" is verbatim `planet_conditions.py` (Mercury combustion), with no age branch. The service *is* wired into `_chart_summary`, `life_areas`, `career`, `marriage`, `wealth`, `primary_concern` — the planet-card path was the one that missed it. |
| **P0-5** remedy keyed to transit | Bug | ⚠️ **Half already fixed** | Real on the planet card: `_TRANSIT_REMEDY[transiting_source]` shipped as the `remedy` facet labelled "Traditional support". But the "Remedies this week" card already did the review's recommended Option A — `deriveWeeklyRemedies` explicitly refuses that facet, with a comment documenting the same bug found 2026-07-22. |
| **P1-1** conditional narration ignored | Gap | ⚠️ **Partly** | Dignity (7 states) and D9 were already always-on separate facets. The real gap was narrower: `_condition_facet_value` was a **single-winner priority chain**, so a combust *and* retrograde Mercury reported only combustion. Sandhi was scored (−8) but never narrated. Neecha bhanga *is* computed — the review's "Phase 3 if not yet computed" was stale. |
| **P1-2** contradiction template | Gap | ✅ **Confirmed** at planet altitude | The doctrine already exists as `app/reasoning/contradiction.py` ("disagreement is investigated, never averaged") but operates on promise-vs-timing for Life Areas, not dignity-vs-affliction per graha. |
| **P1-3** score explainability | Gap | ✅ **Confirmed — highest value** | No breakdown field anywhere. `_SCORE_SCALE_NOTE` explained the scale globally, never the per-planet contributors. |
| **P1-4** lord-in-house synthesis | Gap | ⚠️ **Exists, wrong surface** | `house_lords.compute_house_lord_report` produces exactly this reading and ships live in the Jadhagam Report panel (audit T3). It simply never reached the planet card. A wiring job, not a build. |
| **P1-5** combustion threshold table | Suspect | ❌ **Already correct** | `COMBUST_ORBS` matches the review's own table exactly (Me 14/12, Ve 10/8, Ma 17, Gu 11, Sa 15) and `angular_distance` uses normalised absolute longitude. Combustion is also a **gradient** (`combustion_severity`), not a hard cutoff, so the "10.21° vs 10.0° boundary" premise does not apply. Only boundary *tests* were missing. |
| **P2-1** `vakra_uccha_mode` | Stance | ⚠️ **Built on stale code** | The flat +8 retrograde bonus was removed 2026-07-18 as a double-count; Chesta Bala alone carries retrogression now. Any "why is Jupiter 64" derivation must be redone against current weights. |
| **P3** yoga synthesis | "Build it" | ❌ **Already built** | Raja Yoga, Vipareeta, Parivartana, Neecha Bhanga and Gaja Kesari are all in `yogas.py` / `_yoga_detect.py` and render in `dashboard-yoga-dosham-panel.tsx`. |
| **Cosmetic** node retrograde badge | Bug | ✅ **Confirmed**, frontend-only | The backend already excluded nodes (`PlanetPosition.show_retrograde_badge`); the web read raw `isRetrograde`. |

**Not verified here:** the review's ephemeris claims (padas, D9 sign assignments, transit
longitudes). Those need a Swiss Ephemeris cross-run, not a code read.

---

## 2. What was built

### P0-1 · Transit contact ladder
`chart_explanation_service._planet_transit_contacts`

- Self-contact no longer skipped. A graha back on its own natal sign is emitted as a new
  top-ranked `TRANSIT_RETURN` signal, described as a cycle closing and reopening.
- Explicit ranking ladder replaces `contacts[0]`: return → conjunction → Guru/Sani special
  drishti → Sevvai special → 7th → nodal.
- **Nodal suppression is narrow by design.** Only the *trivially redundant* case is dropped:
  a transiting node opposing the OTHER natal node, which fires exactly when that node's own
  return fires (the axis is 180° in both frames) and adds nothing. A node physically
  *conjunct* a natal graha keeps conjunction rank — nodal gochara over a planet is a
  first-order transit in Tamil practice, and demoting it would have replaced one silent
  omission with another. Pinned by `test_nodal_drishti_ranks_last_but_a_nodal_conjunction_does_not`.
- Top 2 contacts reported instead of 1.

### P0-2 · Graha yuddham narration
Detection untouched — the winner rule stays as OQ-1 fixed it. Added:
- `isPlanetaryWar` / `warOpponent` / `warOutcome` on the planet payload.
- A condition line naming the separation, the opponent, and which graha leads, that
  explicitly points at the −15 now visible in the breakdown.
- A chart-summary caution.
- A "Graha yuddham" chip on the card.

Both the sentence and the −15 read `detect_planetary_wars`, so they cannot disagree.

### P0-3 · Yuti on the card and in the summary
- `coTenants` per planet + a "Shares its house with" facet.
- A conjunctions line in the chart summary ("Sun and Venus in the 11th; Mars and Mercury
  in the 12th…").
The existing chart-level section is unchanged.

### P0-4 · Age-phase gating
New focused API in `age_phase_service`: `life_stage()`, `is_minor()`,
`house_theme_for_stage()`, `remedy_lead_in_for_stage()`.
- House themes remapped for infants/children/teens — house 10 becomes "what naturally
  draws them, early aptitude", house 2 loses "money base".
- `planet_conditions` gained `COMBUST_MEANING_MINOR` / `RETROGRADE_MEANING_MINOR`:
  the same astrological claim about the graha, described as a developmental tendency
  addressed to a parent. Nothing is softened — only the recipient changes.
- Remedies for minors are prefixed "Parents may offer:".
- Unknown birth date falls back to ADULT, so this only ever narrows the failure that
  already shipped.

### P0-5 · Remedy re-keyed to the natal graha
The `remedy` facet now reads `PLANET_REMEDY_CATALOG[natal_graha]` — the existing
canonical catalog, not a new table. Stable across dates, correct by construction, and
now agrees with what the weekly-remedies card has done since 2026-07-22.

### P1-1 / P1-2 · Composition and contradiction
- `_planet_condition_states` returns **every** applicable condition instead of the first
  match. Cazimi still suppresses combustion — those two are mutually exclusive by
  definition, not merely co-occurring.
- Sandhi is narrated for the first time.
- New `synthesis` facet applies the template *[dignity], but [restraint], [outlet]* with a
  D9-aware closing clause. Live output on the fixture chart:

  > *Jupiter is exalted and fundamentally very strong, but the sign-edge placement turns
  > that force inward — it expresses through depth, endurance and transformation rather
  > than open action. The Navamsa backs it, so the strength is real and matures with time.*

  It stays silent when nothing is in tension, rather than manufacturing a contradiction.

### P1-3 · Score explainability
`chart_strength.explain_natal_planet_score()` returns `(score, contributions)`;
`compute_natal_planet_score` is now a thin wrapper over it, so **there is one arithmetic
path** and the number cannot drift from its explanation.

- Terms are weighted point contributions (sthana already carries its 0.30), so the column
  is directly addable.
- A `clamp` term absorbs rounding and the 10/95 limit, making "the rows sum to the score"
  true **by construction**, not by hope.
- Details are structured (`detail_key` + language-neutral `detail_value`) rather than
  pre-formatted English, so Tamil renders properly.
- **`holistic_strength_synthesis` is ON in production** and overwrites `strength_score`
  after the base pass. Its four relational deltas are appended and the residual
  recomputed, or every breakdown would silently stop matching the number beside it.
  Pinned by an end-to-end test through the real build path.
- UI: a collapsed "Why this score?" disclosure per planet with a visible total.

### P1-4 · Lord-in-house
A `lordship` facet joins what the card previously stated as two separate facts.
The swakshetra case is handled separately — "matters of rest and retreat pass through rest
and retreat" is circular, which is what the first draft emitted. Nodes get no line: they
own no rasi, and asserting a lordship Parashari does not grant them is the same error the
functional-nature copy was corrected for on 2026-07-18.

### Cosmetic
Vakra badge suppressed on Rahu/Ketu in both web call sites.

### Adjacent fix
`tests/test_admin_api.py::test_feature_flags_round_trip` asserts exact set equality over
feature flags and had been **red since `bc2cf32`**, which shipped
`holistic_strength_synthesis` without updating it. Corrected.

---

## 3. Gates

| Gate | Result |
|---|---|
| `pytest tests/` (Postgres test DB) | green |
| `tests/test_ec8_narration_layer.py` | 30 new tests, green |
| web `tsc --noEmit` | clean |
| web `eslint --max-warnings=0` | clean |
| web `vitest` | 215 passed |
| mobile `tsc --noEmit` | clean |
| `ruff` on touched files | no new findings (3 pre-existing) |

---

## 4. Open / deliberately not done

- **`vakra_uccha_mode`, `graha_yuddham_mode`, `remedy_keying_mode` reconciliation entries.**
  The behaviour is implemented and documented in code; the formal one-page doctrine entries
  are an astrologer call, not an engineering one. `remedy_keying_mode` is effectively
  settled as Option A by this change.
- **Avastha policy (P2-4).** Untouched. Baladi avastha already feeds `_avastha_multiplier`;
  whether to surface it as narration with a ±3–5 visible weight needs a weight decision.
- **Bhava scoring (P3).** Correctly gated behind explainability by the review; explainability
  now exists for planets, so this is unblocked but not started.
- **Per-graha voice identity (P3).** Copywriting pass, not started.
- **Transit-vs-transit graha yuddham** (ladder rung 2 in the review). The transit contact
  model is sign-based; orb-aware transit-to-transit war needs longitudes threaded through
  and was left out rather than faked.
- **Tamil copy review.** All new Tamil strings are author-written first drafts, consistent
  with the existing `planet_conditions` status note. They need the native-Tamil pass.
- **Browser pass.** Not run — no test credentials for an authenticated session.
