# Thirukanitham Engine Audit — Adhipathi Coverage & Degree Handling

**Date:** 2026-07-11
**Branch:** harden/production-readiness
**Scope:** (1) Does the engine take care of all classical அதிபதி (house-lordship) roles? (2) Is planetary-degree (exact longitude) strength applied correctly to yogams, doshams, and other predictions?
**Mode:** Audit only — no code changed while producing this report.

---

## 0. TL;DR

- **Degree foundation is solid.** Ephemeris precision, nakshatra/pada/navamsa boundaries (epsilon-guarded), combustion (per-planet orbs, retrograde-aware), planetary war (1° separation), gandanta, avastha, vargas, and Shadbala all use exact longitude correctly.
- **One CONFIRMED bug (P0).** The composite degree-based `strength_score` is **silently dropped at the yoga/dosham engine boundary** — it becomes a uniform `50` in production. This kills/degrades four strength-gated rules (Lakshmi, Daridra, Putra-Sarpa, Badhaka).
- **Adhipathi classification: complete. Adhipathi *identity/significations*: collapsed into 8 coarse buckets.** Every planet gets a functional nature, and Badhaka is correctly computed — but the engine never emits a named per-house-lord placement report (Dhana/Bhagya/Labha/Vyaya/Roga/Ashtama/Ayush).

**Scores:** Overall completeness **72/100** · Degree-handling **84/100** · Prediction-accuracy risk **LOW–MEDIUM** (risk is *under-differentiation*, not wrong output).

---

## 0.5 Implementation status — 2026-07-11

Everything through P2 is **built, wired, and tested**; only the domain-gated P3 items remain (they require an astrologer worked example first).

| Task | Status | Where |
|---|---|---|
| **T1** — strength-score drop fix (P0) | ✅ Done | `yogas.py` new `planet_scores_in` param; threaded from `_chart_build.py:_build_yoga_dosham_insights` |
| **T2** — integration golden test | ✅ Done | `tests/test_yoga_strength_integration.py` (5 tests: Lakshmi + Badhaka seam, real `_chart_build` guard) |
| **T4** — derive functional-nature table + golden-test 108 cells | ✅ Done | `functional_nature.py` `derive_functional_nature` + `KNOWN_FUNCTIONAL_NATURE_OVERRIDES` (3 expert cells; 2 flagged as internal contradictions); `tests/test_functional_nature_derivation.py` |
| **T5** — Rahu/Ketu nature by dispositor + occupied house | ✅ Done | `functional_nature.py` `_node_functional_nature`; optional `node_rasi_map` kwarg wired into yogas, `_chart_summary`, `chart_explanation_service`, `life_areas_service` (backward-compatible) |
| **T3** — bhava-lord (adhipathi) report + all 4 surfaces | ✅ Done | new `app/calculations/house_lords.py`; `AdhipathiReading` schema on `ChartSummaryData` + `JadhagamReportData`; shared types; web `JadhagamReportPanel` section; mobile via shared client; `tests/test_house_lords.py` |
| **T6** — strength-gate the sign-only yogas | ✅ Done | `_yoga_helpers.gate_yoga_strength` fed into Gaja Kesari, Raja, Dhana, Pancha Mahapurusha, Chandra-Mangala (presence stays whole-sign); `tests/test_yoga_strength_gate.py` |
| **T7 / T8** — degree-orb aspect strength · Sripati bhava lens | ⏳ Not started (P2 depth, optional) | — |
| **T9 / T10** — Ayurdaya engine · Amirdhadhi/Jeevan-Nethiram | ⛔ Gated on astrologer sign-off (do not code yet) | — |

**Known follow-ups:**
- ~~dasha-interpretation *text* for a node mahadasha still reads NEUTRAL (the dasha-lord text path in `dasha_service` wasn't threaded a `node_rasi_map`).~~ **✅ Fixed 2026-07-11.** `get_chart_dasha_from_snapshot` now builds a `node_rasi_map` from the chart's Rahu/Ketu placements and threads it through `_build_dasha_interpretation`, `_dasha_transition_note`, and `_timeline_for_level`. A node maha/antar dasha now renders its dispositor-derived (or dusthana-malefic) nature instead of the table-default NEUTRAL. Backward-compatible (param optional); pinned by `tests/test_dasha_node_functional_nature.py` (5 tests). DB-backed dasha suite still green.
- Two functional-nature cells (Lagna 6 Jupiter vs Lagna 12 Mercury on `{4,7}`; Lagna 3 Jupiter vs Lagna 9 Mercury on `{7,10}`) are genuine table contradictions awaiting astrologer reconciliation — pinned, not silently changed.

---

## 1. Adhipathi (அதிபதி) coverage

Two systems do this work:
- **Functional nature** — [`app/calculations/functional_nature.py`](../app/calculations/functional_nature.py) — hardcoded 12-lagna × 9-planet table → one of `YOGAKARAKA / LAGNA_LORD / TRIKONA / KENDRA / MARAKA / DUSTHANA / UPACHAYA / NEUTRAL`. Feeds transit scoring, dasha scoring, remedies, and prediction-score L3.
- **Badhaka lord** — [`app/calculations/_yoga_dosham.py:620`](../app/calculations/_yoga_dosham.py) — computed separately (correctly) and drives `BADHAKA_DOSHAM`.

| # | Tamil adhipathi | Status | Location |
|---|---|---|---|
| 1 | லக்னாதிபதி (Lagna lord) | ✅ Explicit | `LAGNA_LORD` |
| 2 | மாரகாதிபதி (Maraka, 2/7) | ✅ Explicit | `MARAKA` |
| 3 | பாதகாதிபதி (Badhaka) | ✅ Correctly computed — movable→11th, fixed→9th, dual→7th | `_yoga_dosham.py:620-628` |
| 4 | யோககாரகன் (Yogakaraka) | ✅ Explicit (Kendra+Trikona) | `YOGAKARAKA` |
| 5 | கேந்திராதிபதி (Kendra) | ✅ Explicit | `KENDRA` |
| 6 | திரிகோணாதிபதி (Trikona) | ✅ Explicit | `TRIKONA` |
| 7 | துஷ்டானாதிபதி (6/8/12) | ✅ Explicit | `DUSTHANA` |
| 8 | ஆயுஷாதிபதி (8th / longevity) | ⚠️ Folded into DUSTHANA — no longevity (Ayurdaya/Balarishta) engine | — |
| 9 | தனாதிபதி (2nd / wealth) | ⚠️ Folded into MARAKA — wealth/speech not separated | — |
| 10 | பாக்கியாதிபதி (9th / fortune) | ⚠️ Folded into TRIKONA — not surfaced as "fortune lord" | — |
| 11 | லாபாதிபதி (11th / gains) | ⚠️ Folded into UPACHAYA | — |
| 12 | வியயாதிபதி (12th / loss) | ⚠️ Folded into DUSTHANA | — |
| 13 | சத்ரு/ரோகாதிபதி (6th) | ⚠️ Folded into DUSTHANA | — |
| 14 | அஷ்டமாதிபதி (8th) | ⚠️ Folded into DUSTHANA | — |

**Gap:** the engine never produces the named per-house-lord placement reading a real jathaga uses (e.g. *"உங்கள் பாக்கியாதிபதி குரு 5-ல் இருக்கிறார்"*). The primitives exist (`SIGN_LORD`, `house_from_reference`, `strength_score`); the assembly/presentation layer does not. See **T3**.

### Two correctness notes inside the classifier
1. **Rahu/Ketu = `NEUTRAL` for every lagna** (`functional_nature.py:79-80`). Classically the nodes inherit their **dispositor's** nature + occupied house. The table's own comment promises "caller may use dispositor logic" — no caller does. See **T5**.
2. **The 108-cell table is hardcoded**, headed *"Verify against a Tamil Jyothidam reference before production use."* ~8 cells spot-verified correct; tests only assert minimum checks, not all 108. One wrong cell silently corrupts every prediction for that lagna. See **T4**.

---

## 2. Degree-handling audit

### 2.1 Precision foundation — ✅ solid
- [`ephemeris.py:86-94`](../app/calculations/ephemeris.py): every body stores full-precision `absolute_longitude` (0–360), `speed_deg_per_day`, `rasi`, `degree_in_rasi`. Lahiri sidereal + speed flags; retrograde from speed sign.
- [`astro.py:48-67`](../app/calculations/astro.py): `nakshatra_from_degree` / `pada_from_degree` / `rasi_from_degree` share `_normalized_index` with `EPSILON_DEGREES = 1e-9` — boundary-safe at 0.00° / 29.999°.
- [`astro.py:203-219`](../app/calculations/astro.py): navamsa uses exact degree-in-sign with epsilon + correct movable/fixed/dual starts (preserves vargottama).

### 2.2 Degree-critical rules correctly using exact longitude — ✅
| Rule | Evidence | Verdict |
|---|---|---|
| Combustion | `transits.py:83-92` — `angular_distance`, per-planet orbs (Mer 14/12, Ven 10/8, Mars 17, Jup 11, Sat 15), retrograde-aware, Moon exempt | ✅ Correct & classical |
| Planetary war | `chart_strength.py:274-309` — real angular sep ≤ 1°, loser = lower degree-in-sign; nodes/luminaries/Mandhi excluded | ✅ Correct |
| Gandanta | `transits.py:48-97` — 3°20′ junction zones | ✅ Correct |
| Uchcha/Dig/Chesta Bala | `shadbala.py` — exact exaltation-degree distance & cusp degrees | ✅ Correct |
| Avastha (Baladi) | degree-in-sign thirds, odd/even reversal | ✅ Correct |
| Atmakaraka / Chara karakas | ranked by exact degree-in-sign | ✅ Correct |

### 2.3 Deliberately sign-based (whole-sign Parashari — defensible, but degree-blind)
Not bugs — these are the whole-sign tradition — but they are where *"Mercury 2° vs 29°"* yields identical output:
1. **Aspects/drishti** — [`aspects.py`](../app/calculations/aspects.py) is 100% rasi-to-rasi (Mars 4/7/8, Jup 5/7/9, Sat 3/7/10). No orb, no full/partial strength.
2. **Yoga "conjunction" = same rasi** — Budha-Aditya `mercury_rasi == sun_rasi` (`_yoga_detect.py:277`), Chandra-Mangala `moon_rasi == mars_rasi` (`:392`), Chandala `jupiter_rasi == rahu_rasi` (`:567`). (Budha-Aditya *does* down-grade on combustion.)
3. **Bhava placement = whole-sign** — house = rasi everywhere in the prediction path. `bhava_chalit.py` (Sripati) exists but does not feed functional nature / yogas / prediction score → bhava-sandhi cases invisible.

---

## 3. Is degree-based strength applied to yogam / dosham / other predictions?

**Three tiers, very different outcomes:**

### ✅ Tier 1 — Works
- **`strength_score` → prediction score L2**: `prediction_score.py:133` consumes `key_planet_strengths`; the composite (combustion −20, war −15, gandanta −10, sandhi −8, dignity/avastha by longitude — `chart_strength.py:486-503`) flows into the final score.
- **Combustion / retrograde / navamsa** reach the yoga engine via **separate** params (`combust_planets`, `retrograde_planets`, `d9_rasi_map` — `_chart_build.py:194-198`) → Budha-Aditya, Sevvai, Rahu/Ketu, Neecha-Bhanga, Kalathra see degree-derived flags.

### ❌ Tier 2 — CONFIRMED BUG: composite strength dropped at the boundary
- Production call site passes a **rasi-only map**: `_chart_build.py:187` → `planet_map = {graha: rasi_int}`, handed to `detect_yogas_and_doshams` at `:199`.
- Inside the engine, `yogas.py:114-119` extracts `strength_score` **only when `isinstance(value, Mapping)`**. Values are `int` → False → **`planet_scores` is uniform `50` for every planet.**
- The real scores computed at `_chart_build.py:193` feed `yoga_activation_score` but are **never threaded into the detector**.

**Concrete dead/degraded logic (all four see 50):**

| Consumer | Gate | With score stuck at 50 |
|---|---|---|
| Lakshmi Yoga | 9th-lord ≥60 **and** lagna-lord ≥60 (`_yoga_detect.py:649-651`) | **Can never fire in production** |
| Daridra Yoga | `weak = score < 40` (`:628`) | Strength branch dead; only house-placement survives |
| Putra Sarpa Dosham | cancel if ≥65; STRONG if <40 (`_yoga_dosham.py:897,904`) | Never STRONG, never strength-cancelled |
| Badhaka Dosham | `badhaka_lord ≥65` cancellation (`:953`) | `badhaka_lord_strong` nivarthi can never trigger |

**Why it wasn't caught:** unit tests call the detectors directly with a proper `planet_scores` dict, so they pass. Only the integration seam is broken — the silent-integration failure mode from `feedback-astrology-calc-accuracy`.

### ⚠️ Tier 3 — Sign-only by design
Gaja Kesari, Raja, Dhana, Pancha Mahapurusha, Chandra-Mangala take no strength at all — a combust / war-defeated planet still yields a "full" yoga.

---

## 4. Master TODO

### 🔴 P0 — Correctness bug (ship first)

**T1. Fix the strength-score drop at the yoga/dosham boundary**
- Add optional `planet_scores_in: Mapping[str, int] | None = None` to `detect_yogas_and_doshams` (`yogas.py:114`); prefer it over the internal `isinstance(Mapping)` fallback. Pass `{p.graha: p.strength_score for p in planets}` (already built at `_chart_build.py:193`) from the call site `_chart_build.py:199`.
- Suggested shape:
  ```python
  planet_scores = dict(planet_scores_in) if planet_scores_in is not None else {
      planet: int(value.get("strength_score", 50)) if isinstance(value, Mapping) else 50
      for planet, value in planets.items()
  }
  ```
- Effort ~1 hr · risk low (additive).

**T2. Integration golden test at the `_chart_build` boundary**
- Drive a full chart through `_chart_build`; assert (a) Lakshmi Yoga *can* be present for a qualifying chart, (b) a strong badhaka lord produces `badhaka_lord_strong`. Effort ~2 hr · gate for T1.

### 🟠 P1 — Adhipathi coverage

**T3. R1 — Bhava-lord ("adhipathi") report** ← closes #8–#14
- New `app/calculations/house_lords.py`: each of 12 houses → lord planet → its house placement + `strength_score` + functional nature, with Tamil significations (Dhana 2, Roga/Shatru 6, Ashtama/Ayush 8, Bhagya 9, Labha 11, Vyaya 12). Emit named readings. Wire into `_chart_summary` + all 4 API surfaces (`feedback-api-contract-coordination`).
- Effort ~2–3 days · depends on T1.

**T4. R2 — Derive the functional-nature table + golden-test all 108 cells**
- Compute from house ownership (`house_from` over `SIGN_LORD`) applying documented overrides; keep the current table only as the test oracle. Effort ~1 day · risk low-medium.

**T5. R3 — Rahu/Ketu functional nature by dispositor + occupied house**
- Replace hardcoded `NEUTRAL` at `functional_nature.py:79`. Effort ~0.5 day · depends on T4.

### 🟡 P2 — Degree-sensitivity depth

**T6. Strength-gate the sign-only yogas** — feed combustion/war/`strength_score` as a strength modifier into Pancha Mahapurusha, Chandra-Mangala, Raja, Dhana, Gaja Kesari (keep whole-sign for presence). Effort ~1–2 days · unblocked by T1.

**T7. R4 — Degree-orb aspect/conjunction *strength* layer (experimental)** — keep whole-sign for presence; add orb-based full/partial drishti strength + degree-proximity modifier for yoga conjunctions. Effort ~3–4 days · flag experimental.

**T8. Wire Sripati bhava (`bhava_chalit`) into the prediction path as an optional lens** — surface bhava-sandhi planets; whole-sign stays default. Effort ~2 days · low within P2.

### 🔵 P3 — New technique modules (gated)

**T9. R5 — Ayurdaya / longevity engine (true #8 Ayushadhipathi)** — Balarishta + Ayurdaya. **Gate: requires an astrologer worked example before coding** (same discipline as Jeevan/Nethiram, Kalachakra). Effort ~1–2 weeks after sign-off.

**T10. Carryover known-open items** — full 189-cell Amirdhadhi Yogam table beyond the 7 verified anchors; Jeevan/Nethiram directional-count formula. Both still UNVERIFIED, need astrologer input.

### Suggested execution order
T1 → T2 → T4 → T5 → T3 → T6 → T7/T8 → (T9/T10 gated on domain sign-off).

---

## 5. Verified-correct (do not touch)
Combustion, planetary war, gandanta, nakshatra/pada/navamsa boundaries, ephemeris precision, Badhaka lord derivation, Shadbala degree inputs, prediction-score L2 use of `strength_score`.
