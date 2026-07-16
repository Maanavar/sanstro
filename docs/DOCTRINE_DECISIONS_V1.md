# Vinaadi — Doctrine Decisions (v1.0)

**Status:** Ratified reference. Every computational convention below was reviewed by two independent Tamil Thirukanitham assessments, which reached the same verdicts. Code must conform to this document; deviations require a documented amendment here first.

---

## Priority Summary

| # | Item | Decision | Priority |
|---|------|----------|----------|
| 1 | Sunrise definition | Hindu sunrise (disc center, no refraction) | 🔴 Critical — fix before launch |
| 2 | Rahu/Ketu node | Mean node (default); true node as toggle | ✅ Keep as-is, document |
| 3 | Ezharai Sani Murthi | Ingress-Moon-from-janma-rasi (default); pada rule as labeled variant | 🔴 Critical — change default |
| 4 | Jaimini Rahu degree | 30° − advancement (BPHS/JHora standard) | 🔴 Critical — fix before launch |
| 5 | Chara Dasha | Full K.N. Rao / BPHS rule set | 🔴 Critical — replace before interpretive use |
| 6 | `bhava_chalit.py` | Rename to equal-house or implement Sripati | 🔴 Critical — trust issue |
| 7 | Jeevan / Nethiram | ~~Remains UNVERIFIED / gated~~ → **Confirmed by astrologer review; display restored 2026-07-16** | ✅ Live (provenance not recorded in-repo) |
| 8 | Ekadashi & festivals | Compute algorithmically; delete 2026 hardcode | 🔴 Critical — silent 2027 failure |
| 9 | Tajaka Ithasala/Isarafa | Keep, labeled "Simplified"; display-only | 🟡 Acceptable, deprioritized |
| 10 | Moon–Moon emotional harmony table (CI Level 7) | Reconciled symmetric table — EXCELLENT only for trikona (5/9); TENSE only for shadashtaka (6/8); GOOD for same/upachaya/kendra/samasaptama (1, 3/11, 4/10, 7); MIXED for dwirdwadasa (2/12) | 🟡 Important — Compatibility Intelligence report |
| 11 | `_graha_relation` compound friendship rule (CI Level 6) | Enemy in either direction → enemy; friend in both directions → friend; else neutral | 🟡 Important — Compatibility Intelligence report |
| 12 | Rajju/Vedha veto on CI overall label | Hard-cap the headline label at CAUTION when Rajju or Vedha fails, regardless of the 0–100 weighted score | 🟡 Important — Compatibility Intelligence report; consistency with the shipped porutham-label veto |

---

## 1. Sunrise Definition

**Decision:** Use **Hindu sunrise** — geometric rise of the Sun's **disc center**, **no atmospheric refraction** — as the default anchor for all sunrise-dependent calculations.

**Rationale:** Every siddhantic definition of udaya (சூரிய உதயம்) is the geometric rise of the Sun's center. All major printed Tamil panchangams (Thirukanitham editions, Vakya, Manimekalai, Arcot, Sri Sankara) use this convention. The Swiss Ephemeris default (upper limb + refraction) shifts sunrise ~3 minutes earlier, causing visible mismatches with the panchangam on the user's wall. "Drik" in Thirukanitham refers to accuracy of planetary positions, not adoption of the observational horizon.

**Scope — inherits this anchor:** Rahu kalam, Yamagandam, Gulikai, Horai, Udaya tithi, sunrise lagna, all eight kalam divisions, and Ekadashi observance logic (see §8).

**Implementation notes:**
- Swiss Ephemeris flags: disable refraction, use disc center (`SE_BIT_NO_REFRACTION | SE_BIT_DISC_CENTER` with `swe.rise_trans`).
- Optionally expose "observed sunrise" (refracted upper limb) as a labeled advanced toggle.
- **Verification:** validate Rahu kalam and udaya tithi against at least two printed panchangams (e.g. Thirukanitham + Manimekalai or Arcot) across a spread of dates and latitudes.

---

## 2. Rahu/Ketu Node Type

**Decision:** **Mean node**, as currently implemented (`ephemeris.py`). Retain.

**Rationale:** Classical computation, the Vakya tradition, and the majority of Tamil practice use the mean node. Doctrinally, Rahu is always vakri; the true node's occasional direct motion is awkward within the tradition. True node is a modern preference (KP practitioners, some Western software).

**Documentation caveat (important):** **JHora defaults to the TRUE node**, not mean. Do not cite JHora as supporting the mean-node choice. Users comparing against out-of-box JHora will see Rahu/Ketu differ by up to ~1.5°+, occasionally flipping nakshatra pada. Add a FAQ/doc line explaining this expected divergence.

**Implementation notes:**
- Offer true node as a settings toggle.
- Where feasible, warn when mean vs. true disagree on nakshatra pada assignment (boundary cases affect Vimshottari dasha start).

---

## 3. Ezharai Sani — Murthi Nirnaya

**Decision:** Default to the **ingress-Moon method**: at the moment Saturn enters the new rasi, count the **transiting Moon's rasi from the native's janma rasi**:

| Count from janma rasi | Murthi |
|---|---|
| 1, 6, 11 | Swarna (gold) |
| 2, 5, 9 | Rajata (silver) |
| 3, 7, 10 | Tamra (copper) |
| 4, 8, 12 | Loha (iron) |

**Rationale:** This is what printed panchangams publish and what users expect. The natal-Moon-pada variant (currently in `transits.py:193`) is authentic but minority Tamil practice — family lineages, some temple astrologers, some Nadi traditions.

**Implementation notes:**
- Requires computing Saturn's exact ingress moment and the Moon's rasi at that instant.
- Retain the pada rule as an explicitly labeled advanced option ("Traditional Pada Murthi — regional variant"), never as the unlabeled default.

---

## 4. Jaimini Rahu Degree

**Decision:** For Chara Karaka ranking, Rahu's effective degree = **30° − (degrees traversed in its rasi)**.

**Rationale:** Rahu's perpetual retrograde motion is the doctrinal basis for the reversal. BPHS commentarial tradition, K.N. Rao, Sanjay Rath, and JHora all use it. The current forward-counting (`jaimini_karakas.py:11-13`) is a minority reading that silently produces different Atmakaraka/Amatyakaraka assignments from every reference chart a knowledgeable user checks — which cascades through all Jaimini interpretation.

**Companion decision required:** Karaka scheme — **7-karaka (planets only)** vs **8-karaka (including Rahu)**. This choice matters as much as the degree rule. Default to the 8-karaka scheme (Rao/Rath mainstream for Chara Karakas); document explicitly.

**Migration note:** If any stored charts used forward counting, karakas must be recomputed.

---

## 5. Chara Dasha Year Formula

**Decision:** Replace the current simplified formula (`jaimini_dasha.py:49-67`) with the **standard K.N. Rao / BPHS rule set**:

1. **Direction:** determined by sign parity (savya/apasavya groups).
2. **Length:** count from the dasha rasi to the rasi occupied by its **lord**, in the appropriate direction, **minus one**.
3. **Own sign:** if the lord occupies its own sign, dasha = **12 years**.
4. **Dual lordship:** Scorpio (Mars/Ketu) and Aquarius (Saturn/Rahu) — resolve by comparing the two lords' **strength** per the standard rules (co-tenancy, degrees, placement); this comparison is the genuinely fiddly part and must be implemented, not skipped.

**Rationale:** Without the parity direction, own-sign rule, and Scorpio/Aquarius exceptions, the output is a different system, not a simplification. Jaimini timing errors compound across the whole life span, and results will not match JHora / Parashara Light.

**Interim policy:** Until the standard rules ship, the existing formula is labeled **"Experimental — non-standard school"** and no interpretive layer may consume its output.

---

## 6. `bhava_chalit.py` Naming

**Decision:** The file computes equal houses, not chalit. Either **rename to `equal_bhava.py`** or **implement true Sripati** (Porphyry-style trisection between quadrant cusps, with bhava madhya and sandhi). A module named "chalit" that returns equal houses destroys credibility the moment a knowledgeable user inspects it.

**Doctrinal note:** Regardless of this fix, the **primary interpretive engine remains whole-sign (rasi-as-bhava)** — that is how Tamil practice reads charts. Chalit/Sripati is a secondary lens for bhava-strength questions, not the foundation.

---

## 7. Jeevan / Nethiram

**Decision (superseded 2026-07-16):** **Confirmed by the project's astrologer; display restored** on the public panchangam page, the dashboard calendar, and the daily-panchangam planner. The formula and thresholds in `panchangam.py` are unchanged, so the confirmation covers them as written — including the symmetric ring distance the audit had flagged as suspect by analogy with the directional tara counts elsewhere.

**Original decision (2026-07-15):** Remains UNVERIFIED and gated.

**Original unlock criteria:** Verify tables against at least **two independent printed panchangam sources**. Publisher appendix tables disagree and there is no computational derivation to fall back on; honesty flags that stay honest are a feature.

**How the unlock actually happened — read this before re-litigating:** the release was authorised by the project owner on the astrologer's confirmation. The specific printed sources were **not recorded in-repo**, so the two-independent-sources criterion above is *not reproducible from this repository alone*. This is a deliberate, owner-approved departure from the stated criteria, not an oversight — but it means the correct status is "confirmed by review", not "independently verified". If this is ever questioned, the sources must be re-obtained rather than inferred from the code.

**C-2 resolved (2026-07-16), astrologer ruling:** the labels stay the classical terms verbatim — Nethiram "குருடு" (Blind), Jeevan "இல்லை" (None) — **unchanged, in both languages.** These are standard Jeevan-Nethiram muhurtham-grid vocabulary, printed as-is in real Tamil almanacs; a knowledgeable reader expects to see exactly this word, and substituting a euphemism would be a fidelity break independent of the formula question A-3 already closed. What was genuinely missing was *context*, not softer wording: on a single daily-briefing card (unlike a printed almanac page dense with other technical terms), the label has no surrounding cue that it's a muhurtham-suitability grade rather than a personal claim. Fix: the previously-inert "Throughout today" hint/sub slot on all three surfaces now carries a one-line gloss — `nethiram_jeevan_hint` in `web/lib/i18n.ts` — clarifying it's a muhurtham marker, not a personal reading, without touching the classical term itself. This is new copy and is self-declared first-draft pending the C-4 native-Tamil pass, same as other recent additions.

---

## 8. Ekadashi and Yearly Festivals

**Decision:** Delete the hardcoded 2026 list (`festivals.py:106`). Compute **all recurring observances algorithmically**, using the same tithi machinery as Pradhosham/Sashti:

- **Ekadashi** = tithi 11 of each paksha, **plus observance logic**: Smarta reckoning takes the tithi prevailing at (Hindu) sunrise with the **dashami-viddha rejection** rule.
- Same treatment for Amavasya, Pournami, Sankatahara Chaturthi, and any other tithi-anchored observance still hardcoded.
- Yearly festivals need a small **rules engine** (solar month + tithi/nakshatra conditions) — this is the real fix behind FIX-4; the Ekadashi list is its most visible symptom.

**Dependencies and options:**
- §1 (sunrise) must be settled **first** — a 3-minute sunrise shift can flip an Ekadashi date.
- **Smarta vs. Vaishnava** Ekadashi reckoning differs; expose as a user setting if serving both communities (default: Smarta).

**Rationale:** Silent disappearance of festivals in 2027 is worse than "feature unavailable."

---

## 9. Tajaka Ithasala / Isarafa

**Decision:** Keep the current same-rasi ±5° approximation, **prominently labeled "Simplified"**, **display-only** — no interpretive layer consumes it. Never present as complete Tajika.

**What "real" Tajika would require (deferred):** applying vs. separating determined by relative speed ordering, deeptamsa orbs (Sun 15°, Moon 12°, Mars 8°, Mercury 7°, Jupiter 9°, Venus 7°, Saturn 9°), aspect typology, and perfection logic.

**Priority note:** Varshaphal is a North Indian specialty; Tamil Thirukanitham annual work leans on dasha-bhukti, gochara, and Ashtakavarga. Legitimate to keep this module below the fold indefinitely.

---

## 10. Moon–Moon Emotional Harmony Table (Compatibility Intelligence, Level 7)

**Decision:** Replace `_MOON_HARMONY_TABLE` in `compatibility_intelligence.py` with the reconciled, symmetric table below, keyed on the (order-independent) rasi distance between the two people's Moon signs:

| Distance | Relationship | Tier |
|---|---|---|
| 1 | Same rasi | GOOD |
| 2, 12 | Dwirdwadasa | MIXED |
| 3, 11 | Upachaya | GOOD |
| 4, 10 | Kendra | GOOD |
| 5, 9 | Trikona | EXCELLENT |
| 6, 8 | Shadashtaka | TENSE |
| 7 | Samasaptama | GOOD |

**Rationale:** Two independent Thirukanitham reviews agreed the pre-existing table had two doctrinal errors (2/12 rated EXCELLENT; the lookup was direction-dependent) and reconciled three disputed cells before ratification:
- **Same rasi (1) = GOOD, not EXCELLENT.** Identical Moon signs give identical temperament and identical instincts — comfortable, but with no complementary strength, and shared weaknesses go unbalanced rather than corrected. EXCELLENT is reserved strictly for trikona, where the affinity is both natural and mutually reinforcing without doubling the blind spots.
- **Kendra (4/10) = GOOD, not MIXED.** Angular positions represent genuine structural stability, not friction — the original MIXED rating conflated "different life-domain focus" (home vs. career axis) with actual disharmony. There is no strong classical basis to demote angular relationships below upachaya (3/11).
- **Samasaptama (7) = GOOD, not EXCELLENT or TENSE.** Opposition-axis, mutual-kendra placement is genuinely complementary and attraction-generating — respected for marriage compatibility broadly — but it also carries an inherent see-saw quality (the full-moon/new-moon dynamic) that trikona doesn't have. GOOD, alongside the other angular/cooperative positions, is the conservative and more broadly defensible read.

EXCELLENT is now reserved exclusively for trikona (5/9) — the tightest, least ambiguous top tier. TENSE is reserved exclusively for shadashtaka (6/8). Everything else sits in GOOD or MIXED depending on whether it's angular/cooperative (GOOD) or the one weak non-angular, non-trikona spot (MIXED, dwirdwadasa).

**Implementation notes:**
- The lookup must be **symmetric** — `harmony(moon_a_rasi, moon_b_rasi) == harmony(moon_b_rasi, moon_a_rasi)` — enforce this structurally, not by convention. Fold the two possible sign-distances to the smaller before mapping to the table above. Caution: folding on the 1-based count directly (e.g. `min(count, 13-count)`) collapses samasaptama (7) into the shadashtaka (6/8) bucket, which is wrong — fold on the 0-indexed difference instead (`d = (rasi_a - rasi_b) % 12`; normalized `= min(d, 12-d)`) and verify all 7 tiers land correctly with a parametrized test before trusting any specific formula.
- Add a regression test asserting `harmony(a, b) == harmony(b, a)` for all 144 rasi pairs, plus the 7 golden distance→tier mappings above.
- Consistency check: any Moon pair that already fails porutham's own `_rasi_score` (6th/8th position, Shashtashtaka veto) must not grade above TENSE here — the two engines must agree on which positions are adverse.
- Supersedes the first-pass draft table that circulated before reconciliation (that draft had 2/12 → TENSE and 4/10 → MIXED; both cells are corrected above). See `docs/CALC_AUDIT_REMEDIATION_PLAN_2026-07.md` WI-05 for the tracked work item.
- Scope: this table feeds only the paid Compatibility Intelligence report's Level 7 (Emotional Compatibility) section. It does not touch the core 10-porutham score or the free/public porutham tools.

---

## 11. `_graha_relation` Compound Friendship Rule (Compatibility Intelligence, Level 6 — Dasha Harmony)

**Decision:** Replace the "friend if either direction is a friend" logic in `compatibility_intelligence._graha_relation` with the standard compound-relationship rule, unanimous across both reviews:
- **Enemy in either direction → enemy**
- **Friend in both directions → friend**
- **Anything else** (one-way friend/neutral, one-way friend/enemy, etc.) **→ neutral**

**Rationale:** The existing function checked friendship with `or` *before* checking enmity, so a one-way-friend pairing was labelled "friend" outright, even when the other direction was an enemy — e.g. Moon regards Mercury as a friend, but Mercury regards Moon as an enemy, and the function returned "friend." This is the same asymmetric-relationship problem the porutham engine's own `_graha_maitri_kuta` already solves correctly (FAIL if either lord treats the other as an enemy). This decision brings `_graha_relation` into agreement with that existing, correct logic rather than maintaining two different compound rules for the same relationship concept in one codebase.

**Implementation notes:**
- Implement as a single shared helper consumed by both call sites (Level 6 Dasha Harmony, and cross-checked against `_graha_maitri_kuta`'s enemy-only logic in `porutham.py`) so the two modules cannot silently diverge again.
- Concrete regression case: Moon × Mercury dasha lords must resolve to **neutral**, not friend, regardless of argument order.
- Scope: affects only the Level 6 Dasha Harmony section of the paid Compatibility Intelligence report.

---

## 12. Rajju/Vedha Veto Caps the Compatibility Intelligence Overall Label

**Decision:** When Rajju or Vedha dosha is present (per the core 10-porutham engine), the Compatibility Intelligence report's **headline label** (the weighted 0–100 aggregate across all 8 levels) is hard-capped at **CAUTION**, regardless of the numeric score. School A (traditional veto governs the headline) over School B (modern holistic offset) — unanimous across both reviews.

**Rationale:** Porutham is only 20 of the CI report's 100 weighted points, so a couple can lose the entire Porutham allocation to a Rajju dosha and still accumulate 65+ from the other seven levels (7th house, Navamsa, Dasha, Sevvai, Emotional, Synastry), landing on GOOD or even EXCELLENT overall — with the dosha demoted to a single bullet in "Areas to Watch" rather than shaping the headline verdict. In a Tamil Thirukanitham-branded product, "Rajju illayel porutham illai" governs user expectation of the headline verdict; a green EXCELLENT/GOOD banner next to a visibly flagged Rajju dosha reads as the software being wrong, not as a nuanced holistic take. This is the same principle already ratified and shipped for the core 10-porutham label (the 2026-07 label-veto fix) — applying it one layer up, at the CI aggregate, keeps one doctrine across both levels of the report instead of two competing philosophies a layer apart.

**Implementation notes:**
- Keep the 0–100 weighted score and the full 8-level breakdown displayed as-is — informative, not discarded.
- Add a hard cap on the label only: `if rajju_dosha or vedha_dosha: overall_label = "CAUTION"`. `overall_score` itself is unaffected.
- Surface both clearly: numeric score shown normally, then a distinct governing line — e.g. **"Traditional Verdict: CAUTION (Rajju Dosha)"** — with a short note that other factors remain strong but do not override the dosha.
- Scope: `compute_compatibility_intelligence`'s overall label only. The core 10-porutham label already applies this veto; no change needed there.

---

## Launch Gate Checklist

Before claiming traditional accuracy:

- [ ] §1 Hindu sunrise implemented and validated against ≥2 printed panchangams
- [ ] §3 Murthi default switched to ingress-Moon method
- [ ] §4 Jaimini Rahu reversed degree + karaka scheme documented
- [ ] §5 Standard Chara Dasha (parity, minus-one, own-sign 12, Scorpio/Aquarius strength resolution)
- [ ] §6 Chalit module renamed or Sripati implemented
- [ ] §8 Festival rules engine replaces all hardcoded year lists

Already compliant: §2 mean node (add JHora-divergence doc note), §7 Jeevan/Nethiram gating, §9 Tajaka labeling.

**Compatibility Intelligence (premium report) gates — not core-launch-blocking, but required before the CI report can be called doctrine-compliant:**

- [ ] §10 Moon–Moon harmony table replaced with the ratified symmetric table, symmetry test passing
- [ ] §11 `_graha_relation` compound rule fixed (enemy-either-direction, friend-both-directions, else neutral)
- [ ] §12 CI overall label hard-capped at CAUTION on a Rajju/Vedha veto

---

*Amendments to this document require: the doctrinal rationale, affected modules, migration impact on stored charts, and sign-off recorded in the repo history.*

*§10–12 ratified 2026-07-16 — two independent Thirukanitham reviews reconciled by the astrologer, following the same process as §1–9. Tracked implementation: `docs/CALC_AUDIT_REMEDIATION_PLAN_2026-07.md` WI-05 (updated), WI-20, WI-21.*
