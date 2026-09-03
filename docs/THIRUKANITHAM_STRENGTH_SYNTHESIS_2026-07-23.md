# Holistic Planet Strength Synthesis — Thirukanitham Doctrine & Implementation Spec

**Date:** 2026-07-23
**Author role:** Tamil Thirukanitham astrologer + engine owner
**Trigger:** User (the astrologer) observed that a planet's strength number is read too much like "it's in the 8th → weak," when a real reading synthesises *many* factors together: who it sits **with**, whose sign it is **in / owns**, whether it is **lagnadhipathi**, who **aspects** it, whether a debilitation is **cancelled**, and so on. This spec makes that synthesis explicit, computes it, and rolls it across every surface that consumes strength.

---

## 1. The core principle (the user's ask, stated as doctrine)

> A graha's strength is not a property of *one* placement. It is the net of **its own dignity**, **its house**, **its functional role for this lagna**, **the company it keeps (yuti)**, **the aspects it receives (drishti)**, and any **cancellations (bhanga)** — weighed together, then reduced to a single verdict.

Concretely, for the user's own Mars (Sevvai) in the 8th from Mesha lagna, an honest reading weighs, at minimum:

1. It is in **Vrischika — its own sign** (strong dignity).
2. It is in the **8th — a dusthana** (weak house).
3. It is the **Lagnadhipathi** (1st lord) — a functional benefic for Mesha.
4. It is **8th lord sitting in the 8th** (lord in own house — bhava stability).
5. It sits **with the Sun** (yuti — company, and possible combustion).
6. It is **aspected by Jupiter** from the 4th (5th-aspect benefic relief).

The single number must be the *synthesis* of all six, not any one of them.

---

## 2. Current state — what the engine already computes

There are **two** strength engines in the codebase today:

| Engine | File | Scale | Wired to the dashboard? |
| --- | --- | --- | --- |
| **Product score** (practical Shadbala blend) | `app/calculations/chart_strength.py` → `compute_natal_planet_score` | 10–95 | **Yes** — this is `planet.strength_score`, consumed by the Adhipathi report, chart explanation, Life Areas, daily guidance, and dasha weighting. |
| **Full classical Shadbala** (virupas/rupas) | `app/calculations/shadbala.py` → `compute_shadbala` | virupas | **No** — only on the experimental `GET /charts/{id}/shadbala` endpoint. Marked "additive to the product strength score." |

### 2.1 What the *product score* already weighs (and does well)

`compute_natal_planet_score` is a 6-component blend, **not** naive:

- **Sthana bala (30%)** — dignity (exalt / own / moolatrikona / friend / neutral / enemy / debilitated via `_dignity_score`) × Baladi avastha, blended with a house band (kendra/trikona strong, **dusthana 8/12 = 25**, weak). *This already captures "in own sign" and "in the 8th" — and is why Mars nets 44, not ~20.*
- **Dik bala (15%)** — directional strength.
- **Kala bala (15%)** — day/night (nathonnatha), paksha, a D9-dignity tweak.
- **Chesta bala (15%)** — retrograde / speed (retrogression rewarded here, *once* — the old double-count was removed 2026-07-18).
- **Naisargika bala (10%)** — natural hierarchy.
- **Drik bala (15%)** — **aspects received**, as a raw benefic-minus-malefic **count** (`_aspect_counts` + `_drik_bala_score`). *This already captures "Jupiter aspects Mars" — but only as a flat ±, blind to Jupiter's own strength.*
- **Modifiers** — combustion/cazimi (vs Sun), graha yuddha (within 1°), vargottama, gandanta, rasi-sandhi, D9 debilitation tier.

### 2.2 What the *full Shadbala* additionally has (stranded, unused by the number)

`shadbala.py` computes the classical sub-balas the product score approximates or omits: **Uchcha, Saptavargaja** (dignity across 7 vargas, not just D1+D9), **Oja-Yugma, Kendradi, Drekkana** (full Sthana); **Tribhaga, Vara, Hora, Ayana** (full Kala); a **virupa-based Drik**. These are real and tested, but do not feed `strength_score`.

---

## 3. Astrologer gap-analysis — what is *missing* from the number

Ranked by how much a Tamil reading actually leans on it.

| # | Missing measure | Classical name | Present in code? | In the product score? | Priority |
| --- | --- | --- | --- | --- | --- |
| G1 | **Functional benefic/malefic for this lagna** (lagnadhipathi, yogakaraka, dusthana-lord…) | Tatastha / kaarakatva bala | ✅ `functional_nature.py` (already used for **dasha & transit** scoring) | ❌ **not applied to natal strength** | **P0** |
| G2 | **Company kept — conjunction/association**, graded by the co-tenant's *nature and strength* | Yuti / kartari sambandha | ❌ (only within-1° war + Sun combustion) | ❌ | **P0** |
| G3 | **Debilitation cancellation** — a neecha planet whose neecha is broken reads *strong* | Neecha Bhanga (Raja Yoga) | ✅ `_yoga_detect.detect_neecha_bhanga` (for yogas only) | ❌ (debilitation is a flat 15) | **P0** |
| G4 | **Aspect relief weighted by the aspecting planet's own strength** | Drik bala (virupa) | ✅ in `shadbala.py`; ❌ in product (flat count) | ❌ (flat count) | **P1** |
| G5 | Dignity across **divisional charts** (D1,D2,D3,D7,D9,D12,D30), not just D1+D9 | Saptavargaja / Vimsopaka bala | ✅ `shadbala.py` | ❌ | P2 |
| G6 | **Ashtakavarga bindus** in the occupied sign | Bhinna/Sarva Ashtakavarga | ✅ `ashtakavarga.py` | ❌ | P2 |
| G7 | Full **Kala bala** (ayana/tribhaga/hora/vara) | — | ✅ `shadbala.py` | ❌ | P3 |
| G8 | **Ishta/Kashta phala** (benefic vs malefic *result potential*) | — | ⚠️ derivable from uchcha+chesta | ❌ | P3 |

**This spec implements G1–G4** (the four a Tamil astrologer would call non-negotiable for a defensible verdict, and exactly the ones the user named). G5–G8 are logged as a follow-on tranche — they largely already exist in `shadbala.py` and become a *convergence* job (merge the full Shadbala into the product path), not new doctrine.

---

## 4. The enhanced model — "Holistic Strength Synthesis"

### 4.1 Architecture: one number, computed in two passes, refined not replaced

- **Pass 1 — Base Shadbala (unchanged).** `compute_natal_planet_score` runs exactly as today, producing a base 10–95 per graha. Nothing about the existing six balas changes. *This is critical: it preserves all validated behaviour and avoids the historical double-count trap.*
- **Pass 2 — Relational synthesis.** A **new pure function** `apply_holistic_synthesis` reads the **base scores of all grahas** and applies **bounded deltas** for the four missing measures. Relational terms (yuti, weighted drishti) *need* the other planets' base scores, which is why this is a second pass — a single-pass loop cannot see a co-tenant's strength before it is computed.

**Guardrail — the synthesis refines, never dominates.** Every planet's total synthesis delta is clamped to **±22** on the 0–100 scale, and each sub-term is individually capped. A planet weak on real Shadbala cannot be inflated to "strong" by relationship bonuses alone; a strong one cannot be crushed to nothing. The final is re-clamped to 10–95.

### 4.2 The four terms (proposed weights — **doctrine, needs the astrologer's sign-off**)

All deltas are additive points on the 0–100 scale.

**G1 · Functional lordship** — `FUNCTIONAL_STRENGTH_DELTA[nature]`, from `get_functional_nature(lagna, planet)`:

| Nature | Δ | Rationale |
| --- | ---: | --- |
| YOGAKARAKA | **+7** | Most powerful functional benefic (owns kendra + trikona). |
| LAGNA_LORD | **+5** | Always benefic; carries the self. |
| TRIKONA | **+4** | Trine lord — dharma/fortune. |
| KENDRA | **−1** | Kendradhipati dosha (mild, for natural benefics). |
| UPACHAYA | **−2** | 3rd/11th growing-house lord — mild malefic. |
| MARAKA | **−3** | 2nd/7th lord — transition/caution. |
| DUSTHANA | **−6** | 6/8/12 lord — functional malefic. |
| NEUTRAL | 0 | — |

*Mirrors the direction of the already-shipped `FUNCTIONAL_DASHA_MODIFIER` (Yogakaraka 1.40 … Dusthana 0.60), converted from a multiplier to conservative additive points so it composes with the other terms on one scale.*

**G2 · Yuti (company kept)** — for each co-tenant in the same rasi:
`Σ  sign(co_tenant) × (base[co_tenant] − 50) / 50 × W_YUTI`, where `sign = +1` if the co-tenant is a **contextual benefic**, `−1` if malefic (same paksha-/combustion-aware classification the drik counter already uses). `W_YUTI = 6`, term capped **±10**.
→ A **strong benefic companion lifts**; a **strong malefic companion drags**; a weak companion barely moves it. *This is exactly "Mars with the Sun reads differently from Mars alone."*

**G3 · Neecha Bhanga** — if a planet is in its debilitation rasi **and** a cancellation condition holds (debilitation-sign lord in a kendra from lagna/Moon; the exalter of that sign in a kendra; or the planet strong in D9), add **+14**. This lifts a cancelled neecha from "flat 15 floor" up toward neutral/strong — the classic "neecha bhanga raja yoga" reversal. Detection reuses the same four conditions as `_yoga_detect.detect_neecha_bhanga`, implemented over `chart_strength`'s own exaltation/debilitation tables (their doctrine home).

**G4 · Weighted drishti (quality layer)** — the base already counted aspect *presence*; this adds a *quality* refinement graded by the aspecting planet's strength:
`Σ  sign(source) × (base[source] − 50) / 50 × W_DRISHTI` over every graha that casts a real drishti (whole-sign special aspects: Mars 4/8, Jupiter 5/9, Saturn 3/10, nodes 5/9, all 7th). `W_DRISHTI = 5`, term capped **±10**.
→ A **strong Guru's** grace on Mars now counts for more than a weak one's — the nuance the flat count missed.

### 4.3 Worked example — the user's Mars (illustrative, pending live run)

Base ≈ 44. Synthesis: **+5** (Lagna lord) **+ yuti(Sun)** graded by the Sun's strength (Sun is a malefic → small −, scaled by how strong the Sun is) **+ drishti(Jupiter@61)** ≈ `+1 × (61−50)/50 × 5 ≈ +1.1` benefic quality **+ 0** bhanga (not debilitated). Net a few points up from 44 — Mars reads as a *functionally benefic own-sign lagna lord that Guru protects*, not merely "8th-house = weak." The exact number comes from the live run (§6).

---

## 5. Propagation — "everywhere we compute and predict"

Because every consumer reads the **one** `strength_score` (or calls `compute_natal_planet_score`), the synthesis propagates by enhancing the **single natal build path**:

- **Primary wiring:** `app/services/_chart_build.py` — after the per-planet loop computes base scores, run `apply_holistic_synthesis` (flag-gated) and overwrite `planet.strength_score`. Every downstream surface (Adhipathi report, chart explanation, Life Areas, daily guidance, Vimshottari dasha weighting, propensities) inherits it with **zero further changes**.
- **Consistency law (unchanged):** no surface recomputes strength; they all read the synthesised number. The prose layer (`chart_explanation_service.py`) keeps deriving its words from `strengthScore`, so the sentence and the number can never disagree.
- **Transparency:** the per-term deltas are returned and stored on `strength_breakdown` so the UI (and tests) can show *why* a number moved ("Lagna lord +5, Guru's aspect +1").

Call sites that pass fewer args (`narrative_engine`, daily-guidance fallback) keep working — they compute the base score exactly as before; only the primary natal build applies the synthesis.

---

## 6. Rollout & validation (safety-first — this changes every prediction)

1. **Feature flag `holistic_strength_synthesis`, default OFF.** Zero production drift until the astrologer signs off the weights. Flip via the existing `PATCH /admin/flags/{name}` mechanism, exactly like `daily_briefing_synth`.
2. **Golden cases.** `tests/test_holistic_strength_synthesis.py` pins: (a) each term in isolation on a synthetic chart; (b) the ±22 clamp; (c) flag-OFF ⇒ byte-identical to today; (d) the user's Mars-in-8 case reads as expected. **Never** use real birth data — synthetic identities only.
3. **Live diff.** Before flipping ON, run the real chart and print the base-vs-synthesised number **and the per-term deltas** for all nine grahas, for the astrologer to inspect and re-weight.
4. **Version bump.** When flipped ON, bump `DAILY_SCORE_ENGINE_VERSION` so cached rows regenerate.

---

## 7. Doctrine sign-off (resolved 2026-07-23)

The §6.3 live diff was run on a real Dhanus-lagna chart before flipping. Every
delta came in bounded and conservative (max ±6.6 against a ±22 clamp), the
arithmetic was verified by hand, and the served path matched the pure function
exactly. On that evidence the astrologer signed off:

1. **Weights (§4.2).** ✅ Approved as-is — the magnitudes refine without
   dominating (no planet changed strength band). Revisit only if a future chart
   shows a runaway term.
2. **Yuti scope.** ✅ Same-sign co-tenancy only for now; `kartari` (hemming)
   deferred to the G5–G8 tranche.
3. **Node functional nature.** ✅ **RESOLVED — nodes carry NO functional-lordship
   delta.** Grounded in classical doctrine, not just caution: Parashara holds
   Rahu/Ketu own no rasi, so they are **not "functional" at all — only natural
   malefics** (ராகு லக்னாதிபதி அல்ல). A node gives results of (i) the house it
   occupies, (ii) its dispositor, and (iii) the planet it associates with — all
   three of which the engine already models WITHOUT a lordship delta: (i) is in
   the base house-band, (ii) the dispositor gets its own delta (awarding it to
   the node too would double-count), and (iii) is the yuti/drishti terms. Even
   the classical "node in a kendra aspected by / joined to a kona-lord becomes
   yogakaraka" rule is **conditional on association/aspect, never ownership** — so
   it correctly emerges from the strength-weighted drishti/yuti terms, not from a
   lordship bonus. Treating the nodes as malefics in the yuti/drishti *sign* is
   likewise doctrinally correct. On the test chart this dropped Rahu from a
   spurious +5 "lagna lord" to +0.8 drishti-only. Implemented via
   `_SYNTHESIS_NODES` in `chart_strength.py`. (Refs: BPHS; functional-nature
   literature — vedicplanet.com, planetarypositions.com.)
4. **Convergence (G5–G8).** Deferred — a later convergence job, not blocking.

---

## 8. Status

- **Spec:** this file. Gap-analysis G1–G8 logged; G1–G4 built.
- **Implementation:** `apply_holistic_synthesis` in `chart_strength.py` (pure,
  bounded, per-term deltas; nodes muted on the functional term), wired
  flag-gated in `_chart_build.py`, which now also surfaces the per-term deltas on
  `strength_breakdown` (`synthesis_*` keys) for UI transparency. Golden tests
  (11) cover each term, the clamps, identity-under-no-signal, and the node mute.
- **Rollout:** **Flag `holistic_strength_synthesis` flipped ON 2026-07-23** after
  the live-diff validation + §7 sign-off. `DAILY_SCORE_ENGINE_VERSION` bumped to
  `2026-07-23-v6` so cached rows regenerate. Reversible via
  `PATCH /admin/flags/{name}`.
- **Follow-on:** G5–G8 convergence with `shadbala.py`; ~~unify the neecha-bhanga
  helper with `_yoga_detect`~~ **DONE 2026-07-23** — both now share
  `chart_strength.neecha_bhanga_cancelled` (audit C2,
  docs/THIRUKANITHAM_ENGINE_AUDIT_2026-07-23.md); the synthesis now also runs on
  the fresh-calc build path (audit C1); surface the `synthesis_*` breakdown in
  the Adhipathi UI ("Lagna lord +5, Guru +1").
