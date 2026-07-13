# Prediction Taxonomy — Domain → Topic → Evidence Spec

**Version:** v1 &nbsp;·&nbsp; **As of:** 2026-07-13 &nbsp;·&nbsp; **Status:** P2-1 (docs/PREDICTION_DOCTRINE_AND_ROADMAP.md)

## Purpose

A single, versioned map from **Domain** (a life area) to **Topic** (a specific claim served
to a user) to its **evidence spec** (houses consulted, karaka planets, varga chart, dasha-lord
affinity) — so future propensity/scenario tranches get built against a documented contract
instead of ad hoc additions. Every row below is transcribed from data that already exists in
code — `life_areas_service._AREA_ROUTING`, `whatif_service._SCENARIO_KARAKA` /
`_SCENARIO_NATAL_HOUSES`, `propensity_service._REGISTRY`, `prediction_log_service._SCENARIO_TO_AREA`
— nothing here is new structure. Where the doctrine roadmap calls for a topic that doesn't
exist in code yet, it is marked **PLANNED**; everything else is **LIVE**.

Bump the version whenever a Domain or Topic is added, removed, or re-scoped. This is v1,
covering the registry state immediately after P0-4 (contradiction voice + chart signature) and
P1-3 (Ask Vinaadi alignment), and immediately before the P2-2 tranche.

## How to read this

| Column | Meaning |
|---|---|
| Domain | Top-level grouping — a `life_areas_service._AREA_ROUTING` key, or a `PropensityCategory` |
| Topic | The specific claim a user sees — a life area *is* its own domain+topic; a propensity card or whatif scenario is one topic inside a domain |
| Houses | Bhava(s) consulted for natal promise |
| Karaka | Significator planet(s) whose dignity/strength the evidence weighs |
| Varga | Divisional chart consulted, if the topic uses one beyond D1 |
| Dasha evidence | Whether a dasha-lord affinity table exists for this topic (whatif) or a `_TimingSpec` timing window exists (propensities) |
| Surface | Which serving surface currently emits this topic |
| Status | LIVE (served today) or PLANNED (documented target, not yet built) |

---

## Section 1 — Life Areas (source: `life_areas_service._AREA_ROUTING`)

The 12 top-level areas served by `GET /charts/{id}/life-areas`. Each area is both the Domain
and the Topic — there is no sub-topic split here yet (that's what Section 3's propensity cards
and P2-3 add on top).

| Domain / Topic | Houses | Karaka | Varga | Surface | Status |
|---|---|---|---|---|---|
| CAREER | 10, 6, 2, 11 | SUN, SATURN | D10 | life_areas | LIVE |
| RELATIONSHIPS | 7, 2, 4, 8 | VENUS, JUPITER | D9 | life_areas | LIVE |
| HEALTH | 1, 6, 8, 12 | SUN, MOON | D30 | life_areas (maraka-guarded) | LIVE |
| MONEY | 2, 5, 9, 11 | JUPITER, VENUS | D2 | life_areas | LIVE |
| WEALTH | 2, 5, 9, 11 | JUPITER, VENUS | D2 | life_areas (alias of MONEY) | LIVE |
| EDUCATION | 2, 4, 5, 9 | MERCURY, JUPITER | D24 | life_areas | LIVE |
| CHILDREN | 5, 9 | JUPITER | D7 | life_areas | LIVE |
| PROPERTY | 4, 11 | MARS, VENUS | D4 | life_areas | LIVE |
| FOREIGN | 3, 9, 12 | RAHU | D9 | life_areas | LIVE |
| LITIGATION | 6, 7, 8 | MARS, SATURN | D30 | life_areas | LIVE |
| SPIRITUAL | 5, 9, 12 | KETU, JUPITER | D20 | life_areas | LIVE |
| SPIRITUALITY | 5, 9, 12 | KETU, JUPITER | D20 | life_areas (alias of SPIRITUAL) | LIVE |

Age-phase relevance (`_PHASE_RELEVANT_AREAS`) additionally gates which of these show per life
stage (INFANT/CHILD/TEEN/YOUNG_ADULT/MID/ELDER) — see `life_areas_service.py:322-329`. That's a
display filter on top of this evidence spec, not a separate taxonomy.

**Correction vs earlier roadmap drafts:** FOREIGN, LITIGATION, and CHILDREN already exist as
full top-level areas here — they are not missing. What P2-3 actually adds is *sub-topic*
granularity underneath FOREIGN and LITIGATION (see Section 5).

---

## Section 2 — What-If Scenarios (source: `whatif_service._SCENARIO_KARAKA` / `_SCENARIO_NATAL_HOUSES` / `_DASHA_SCENARIO_SCORE`)

Served by `POST /charts/{id}/whatif`. Each scenario also maps to a canonical life area for
calibration-log joining (`prediction_log_service._SCENARIO_TO_AREA`) — that mapping is the
"Maps to Domain" column below, and it is deliberately not always a 1:1 name match (e.g.
`marriage` → `MARRIAGE`, not `RELATIONSHIPS`; see the note under Section 4).

| Topic (scenario key) | Houses | Karaka | Dasha affinity table | Maps to Domain (Section 1/4) | Status |
|---|---|---|---|---|---|
| job_change | 10, 6, 2 | SATURN, SUN | yes | CAREER | LIVE |
| business_start | 10, 7, 3 | SATURN, MERCURY | yes | CAREER | LIVE |
| marriage | 7, 2, 11 | VENUS, JUPITER | yes | MARRIAGE | LIVE |
| education | 4, 5, 9 | MERCURY, JUPITER | yes | EDUCATION | LIVE |
| property | 4, 2, 12 | SATURN, MARS | yes | PROPERTY | LIVE |
| health | 1, 6, 8 | SUN, MARS | yes | HEALTH | LIVE |
| travel_abroad | 12, 9, 3 | RAHU, JUPITER | yes | FOREIGN | LIVE |
| spiritual | 9, 12, 5 | JUPITER, KETU | yes | SPIRITUAL | LIVE |
| family_harmony | 4, 2, 7 | MOON, JUPITER | yes | FAMILY_HARMONY | LIVE |
| money | 2, 11, 5 | JUPITER, VENUS | yes | MONEY | LIVE |
| child_birth | 5, 2, 9 | JUPITER, MOON | yes | CHILDREN | LIVE |
| foreign_settlement *(P2-3)* | 12, 9, 3 | RAHU, SATURN | yes | FOREIGN | LIVE |
| litigation *(P2-3)* | 6, 8, 7 | MARS, SATURN | yes | LITIGATION | LIVE |
| other | 9, 5, 1 | JUPITER, SUN | yes | OTHER (ungraded, no calibration join) | LIVE |

**P2-3 closed 2026-07-13:** whatif now has `foreign_settlement`/`litigation` scenarios distinct
from `travel_abroad` — `_SCENARIO_KARAKA`/`_SCENARIO_NATAL_HOUSES`/`_DASHA_SCENARIO_SCORE`/
`_SCENARIO_LABEL_TA`/`EN` in `whatif_service.py` all extended, plus `decisions_service.py`'s
downstream scenario classifier/karaka lookup (it calls `evaluate_whatif` with these same keys)
and the `WHATIF_OPTIONS` dropdown in `web/components/dashboard-plan-shared.tsx`. Deliberately
**not** added to `app/models/user_goal.py`'s `VALID_GOAL_TYPES` — that constant doubles as the
onboarding "what's your focus" goal-track picker (`User.goal_track`), where "litigation" would
be a nonsensical option; `app/schemas/whatif.py`'s `VALID_SCENARIOS` is now its own superset
instead of a bare alias.

---

## Section 3 — Propensity Cards, "Chances & Cautions" (source: `propensity_service._REGISTRY`)

Served by `GET /charts/{id}/propensities` (flag `propensity_insights`, ON since 2026-07-13).
40 cards across 6 `PropensityCategory` domains + 1 always-shown descriptive profile card
(23 from Phase 0-3, +14 from the P2-2 tranche, +3 from P2-3's Foreign/PR + Litigation
sub-topics — all landed 2026-07-13, see the *(P2-2)*/*(P2-3)* rows below). Tier
is CHANCE (positive/actionable), CAUTION ("be-mindful season", never doom), or PROFILE
(descriptive synthesis, no grading). "Timing evidence" is the `_TimingSpec` house/karaka a
card's real-date window (Phase 2 gochara + SAV-bindu gate) is judged against, where one exists.

### Domain: RELATIONSHIPS

| Topic (key) | Tier | Age band | Timing evidence | Disclaimer | Status |
|---|---|---|---|---|---|
| love | CHANCE | 15+ | house 5, VENUS | — | LIVE |
| relationship_strain | CAUTION | 15+ | — | DISCLAIMER_RELATIONSHIP_TENDENCY | LIVE |

### Domain: EDUCATION

| Topic (key) | Tier | Age band | Timing evidence | Disclaimer | Status |
|---|---|---|---|---|---|
| higher_education | CHANCE | all | house 9, JUPITER | — | LIVE |
| dropout_risk | CAUTION | ≤35 | — | DISCLAIMER_STUDY_CONTINUITY | LIVE |

### Domain: CAREER

| Topic (key) | Tier | Age band | Timing evidence | Disclaimer | Status |
|---|---|---|---|---|---|
| career_mode | CHANCE (directional) | 16+ | — | — | LIVE |
| government_job | CHANCE | 16+ | house 10, SUN | — | LIVE |
| job_disruption | CAUTION | 18+ | house 10, SATURN | DISCLAIMER_CAREER_FORESIGHT | LIVE |
| competitive_edge | CHANCE | 16+ | — | — | LIVE |
| promotion_recognition *(P2-2)* | CHANCE | 18+ | house 11, SUN | — | LIVE |
| entrepreneurial_timing *(P2-2)* | CHANCE | 18+ | house 3, MARS | — | LIVE |
| workplace_conflict *(P2-2)* | CAUTION | 18+ | house 6, MARS | DISCLAIMER_CAREER_FORESIGHT | LIVE |
| skill_mastery *(P2-2)* | CHANCE | 16+ | — | — | LIVE |
| career_networking_influence *(P2-2)* | CHANCE | 18+ | — | — | LIVE |
| career_change_success *(P2-2)* | CHANCE | 21+ | house 9, JUPITER | — | LIVE |

### Domain: WELLBEING

Five of these (marked *sensitive*) hard-suppress for minors and for the opt-in
`prefers_reduced_sensitive_content` preference (P1-2, D11).

| Topic (key) | Tier | Age band | Timing evidence | Disclaimer | Status |
|---|---|---|---|---|---|
| child_timing *(sensitive)* | CAUTION | 21–50 | house 5, JUPITER | DISCLAIMER_FERTILITY | LIVE |
| accident_care *(sensitive)* | CAUTION | all | house 8, MARS | DISCLAIMER_SAFETY | LIVE |
| emotional_load *(sensitive)* | CAUTION | all | — | DISCLAIMER_WELLBEING (+ support resources) | LIVE |
| loneliness *(sensitive)* | CAUTION | all | — | DISCLAIMER_WELLBEING (+ support resources) | LIVE |
| conviction | CHANCE | all | — | — | LIVE |
| resilience_watch *(sensitive)* | CAUTION | 18+ | house 8, SATURN | DISCLAIMER_LOSS | LIVE |
| swabhava_profile | PROFILE | all | — | — | LIVE |

### Domain: MARRIAGE

Bhava 7 (Kalatra) classically governs both marriage and business partnership, so both live
under one category per Phase 3's design note.

| Topic (key) | Tier | Age band | Timing evidence | Disclaimer | Status |
|---|---|---|---|---|---|
| marriage_harmony | CHANCE | 18+ | — | — | LIVE |
| business_partnership_fit | CHANCE | 18+ | — | — | LIVE |
| early_marriage_readiness *(P2-2)* | CHANCE | 18–49 | house 7, VENUS | — | LIVE |
| marriage_delay_watch *(P2-2)* | CAUTION | 18–49 | — | DISCLAIMER_RELATIONSHIP_TENDENCY | LIVE |
| spousal_support_strength *(P2-2)* | CHANCE | 18+ | — | — | LIVE |

### Domain: WEALTH

| Topic (key) | Tier | Age band | Timing evidence | Disclaimer | Status |
|---|---|---|---|---|---|
| income_growth | CHANCE | 18+ | house 11, JUPITER | — | LIVE |
| savings_capacity | CHANCE | 18+ | — | — | LIVE |
| inheritance_lean | CHANCE | 18+ | — | — | LIVE |
| property_acquisition *(P2-2)* | CHANCE | 18+ | house 4, MARS | — | LIVE |
| property_investment_timing *(P2-2)* | CHANCE | 18+ | house 11, VENUS | — | LIVE |
| ancestral_property_stability *(P2-2)* | CAUTION | 18+ | — | DISCLAIMER_LOSS | LIVE |
| windfall_gains *(P2-2)* | CHANCE | 18+ | house 11, RAHU | — | LIVE |
| speculative_risk *(P2-2)* | CAUTION | 18+ | — | DISCLAIMER_LOSS | LIVE |

### Domain: LIFE_PATH

Bhava 12 (foreign settlement) + the Bhava-6 suite (litigation, debt) — topics that don't fit
the four original categories, grouped here per Phase 3's design note.

| Topic (key) | Tier | Age band | Timing evidence | Disclaimer | Status |
|---|---|---|---|---|---|
| foreign_settlement | CHANCE | 16+ | house 12, RAHU | — | LIVE |
| litigation_season | CAUTION | 18+ | — | DISCLAIMER_LEGAL | LIVE |
| debt_watch | CAUTION | 18+ | — | DISCLAIMER_LOSS | LIVE |
| pr_immigration_prospects *(P2-3)* | CHANCE | 18+ | house 12, SATURN | — | LIVE |
| legal_outcome_favor *(P2-3)* | CHANCE | 18+ | — | — | LIVE |
| contract_dispute_risk *(P2-3)* | CAUTION | 18+ | — | DISCLAIMER_LEGAL | LIVE |

---

## Section 4 — Ask Vinaadi Calibration-Log Area Classifier (source: `ask_vinaadi_service._AREA_CLASSIFIER_KEYWORDS`)

Ask Vinaadi (`POST /charts/{id}/ask`) is conversational, not a scored claim — it has no
houses/karaka/varga evidence spec of its own. P1-3 added a lightweight keyword classifier that
routes a freeform question to one of these canonical Domains purely so its calibration-log rows
(`source="ask_vinaadi"`) join the same buckets as whatif/life-areas rows for the same area,
rather than living in an unjoinable parallel taxonomy. A question that matches no keyword is
not logged at all (skip, don't guess).

| Domain matched | Reuses keyword list from | Status |
|---|---|---|
| MARRIAGE | `age_gate.MINOR_REDIRECT_KEYWORDS` | LIVE |
| CAREER | `age_gate.CAREER_REDIRECT_KEYWORDS` | LIVE |
| EDUCATION | `age_gate.STUDY_REDIRECT_KEYWORDS` | LIVE |
| HEALTH | `ask_vinaadi_service._HEALTH_AREA_KEYWORDS` | LIVE |
| MONEY | `ask_vinaadi_service._MONEY_AREA_KEYWORDS` | LIVE |
| PROPERTY | `ask_vinaadi_service._PROPERTY_AREA_KEYWORDS` | LIVE |
| FOREIGN | `ask_vinaadi_service._FOREIGN_AREA_KEYWORDS` | LIVE |
| CHILDREN | `ask_vinaadi_service._CHILDREN_AREA_KEYWORDS` | LIVE |
| SPIRITUAL | `ask_vinaadi_service._SPIRITUAL_AREA_KEYWORDS` | LIVE |
| FAMILY_HARMONY | `ask_vinaadi_service._FAMILY_HARMONY_AREA_KEYWORDS` | LIVE |

**Note on MARRIAGE vs RELATIONSHIPS:** the calibration spine (`prediction_log_service.py`)
intentionally keeps these as two related-but-distinct Domains — `_EVENT_TO_AREAS` grades a
`RELATIONSHIP_START`/`RELATIONSHIP_END` life event against *both* buckets, since a real-world
relationship event can falsify or confirm either a life-areas RELATIONSHIPS reading or a whatif
MARRIAGE-scenario reading. This taxonomy preserves that existing distinction rather than
collapsing it.

---

## Section 5 — Planned Gaps (from the doctrine roadmap, not yet built as of v1)

Empty as of 2026-07-13 — every gap identified when this doc was first drafted (P2-2's
Career/Wealth/Property/Marriage-timing tranche, P2-3's Foreign/PR + Litigation sub-topics) has
landed. See the *(P2-2)*/*(P2-3)* rows in Sections 2 and 3 for what shipped, and the closure
notes below for the specialist calls made along the way. Future gaps get logged here the same
way: a row per Domain/Topic with the rationale and target milestone, removed in the same change
that ships the code.

**P2-2 closed 2026-07-13:** 14 new cards landed across CAREER (6), WEALTH (5), and MARRIAGE (3)
— see the *(P2-2)* rows in Section 3. Specialist call: shipped 14 rather than stretching to the
roadmap's "~15-18" ceiling — every additional candidate topic considered (e.g. a second
Sun/10th-house "authority" card alongside `promotion_recognition`) either overlapped an existing
card's evidence too closely or lacked genuine multi-factor grounding, and the roadmap's own
"never dilute D1/D2 for breadth" instruction takes priority over hitting the top of an
approximate range. Foreign/PR and Litigation sub-topics were deliberately left to P2-3 rather
than folded in here, to avoid two tranches racing on the same houses.

**P2-3 closed 2026-07-13:** whatif scenario parity landed (`foreign_settlement`/`litigation`,
Section 2), plus 3 new sub-topic propensity cards (`pr_immigration_prospects`,
`legal_outcome_favor`, `contract_dispute_risk`, Section 3 LIFE_PATH). Specialist call: shipped 3
rather than a longer list — `pr_immigration_prospects` earns its place as a genuinely distinct
9th-12th-lord/Saturn-permanence read from `foreign_settlement`'s Rahu-in-12th read;
`legal_outcome_favor` and `contract_dispute_risk` split "does a dispute arise" (already covered
by `litigation_season`) from "does it resolve well" and "is it specifically contractual" —
splitting further (e.g. property-dispute vs. criminal-dispute vs. family-dispute sub-types)
would start manufacturing near-duplicate cards against the same 6th/7th-house evidence rather
than reading a genuinely new classical signature.

This section should shrink (and Section 1-4 should grow) as each tranche lands — update the
Status column of the newly-built rows to LIVE and move the entry out of this table in the same
change that ships the code, rather than letting this doc drift stale again.
