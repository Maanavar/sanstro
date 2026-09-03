# Thirukanitham Engine Audit — 21-Level Reasoning Coverage & Conflicts

**Date:** 2026-07-23
**Reviewer role:** Full-stack engineer + Tamil Thirukanitham astrologer
**Scope:** Every calculation/service module in `app/` mapped against the 21-level
expert-reasoning framework. Code read, not just docs. Focus per the ask:
(1) is each method implemented, (2) anything calculated wrong, (3) anything
under-cared, (4) anything missing, (5) do we score *everything*, (6) conflicts
where the same thing is computed in more than one place.

**Headline verdict:** This is **not** a beginner "planet-in-house = score" engine.
It already implements the expert model the framework describes — a **promise gate
that vetoes, then a timing vote that never averages promise back in**
(`app/reasoning/`), connection-match dasha activation, named afflictions, graded
combustion, functional nature with a derivation oracle, ~20 yogas + ~8 doshas
with cancellation, D2–D60 vargas, Ashtakavarga, and the full Saturn cycle. The
gaps are at the **edges** (compound friendship, conjunction orb, true day/night)
and — more importantly — in **six concrete places where the same quantity is
computed twice and can disagree.** Those conflicts are the real risk, and are
listed first.

---

## Part A — Conflicts: the same thing computed in ≥2 places (the priority findings)

### C1 — Holistic strength synthesis runs on only ONE of the two build paths ⚠️ live
- **Where:** `app/services/_chart_build.py`. `_chart_response_from_record`
  applies `apply_holistic_synthesis` (lines ~668–704); `_chart_response_from_profile`
  does **not** (no `get_flag("holistic_strength_synthesis")` block at all).
- **Why it bites:** the flag is **ON in production** (shipped 2026-07-23). The
  profile path feeds every public/guest calculator and compatibility snapshot:
  `public_tools.py`, `relationships.py` (synastry), `porutham_share_service.py`,
  and — critically — `calculate_chart_for_persisted_profile` **returns the
  profile-path response on first calculation** (`_chart_persist.py:218`), only
  switching to the record path (with synthesis) on subsequent loads
  (`load_persisted_chart_response` → `_chart_response_from_record`).
- **Observable effect:** a user's **first** chart view shows base
  `strength_score`s; reload the same chart and the numbers move (functional
  lordship / yuti / neecha-bhanga / weighted-drishti deltas appear). The same
  person read through a public compatibility tool gets base scores; read through
  their saved chart gets synthesized scores. Yogas and prediction layers that
  consume `strength_score` inherit the divergence.
- **Fix:** hoist the flag-gated synthesis block into a shared helper and call it
  from **both** build paths (or from the single point where `planet_positions`
  is finalized). Add a test asserting profile-path and record-path scores are
  identical for the same inputs.

### C2 — Two Neecha-Bhanga detectors with materially different rules ⚠️
- **Where:** `app/calculations/_yoga_detect.py::detect_neecha_bhanga` (drives the
  yoga card) vs `app/calculations/chart_strength.py::_neecha_bhanga_planets`
  (drives the +14 synthesis strength bonus).
- **Divergences:**
  1. The **synthesis version omits** the yoga version's condition
     *"lord of the sign where the planet exalts casts drishti on the debilitated
     planet"* (`exaltation_sign_lord_aspects_debilitated`).
  2. **Different D9 test:** synthesis uses *dignity* (planet in own/exaltation
     sign in D9, `_has_d9_dignity`); the yoga card uses *house* (planet in a
     kendra/trikona counted from the **D9 lagna**). These can disagree.
  3. The yoga card treats a lone **retrograde** debilitated planet as cancelled
     (`present = len(conditions) > 1`, retrograde appends a condition); the
     synthesis does not.
- **Effect:** the yoga panel can display "Neecha Bhanga Raja Yoga — present"
  while the planet's strength number gives **no** bhanga lift, or vice-versa.
  Number and card contradict each other on the same chart.
- **Note:** the strength spec (§8 "Follow-on") already flags "unify the
  neecha-bhanga helper with `_yoga_detect`" — this is that unification, now with
  the exact divergences enumerated. Extract one detector, consume it from both.

### C3 — Special-aspect (drishti) table re-duplicated after it was consolidated ⚠️
- **Where:** `app/calculations/aspects.py::ASPECT_HOUSES` is the deliberately
  shared table (its docstring documents killing the old duplication). But
  `app/services/_chart_planets.py::_ASPECT_OFFSETS` **re-hardcodes** the same
  Mars 4/7/8, Jupiter 5/7/9, Saturn 3/7/10, Rahu/Ketu 5/7/9, and `_does_aspect`
  uses that **local copy** for the natal drik-bala aspect counts.
- **Effect:** they agree today, but nothing binds them. The node aspect (5/7/9)
  is explicitly flagged in `aspects.py` as a **contested school choice an
  astrologer may change**. If it's ever changed there, the whole system flips
  except the natal strength drik-count, which silently keeps 5/7/9.
- **Fix:** delete `_ASPECT_OFFSETS`/`_does_aspect`; call `aspects.aspects_house`.
  (Dignity tables `EXALTATION_RASI`/`DEBILITATION_RASI`/`SIGN_LORD`/`OWN_SIGN_RASI`
  are already correctly single-sourced from `chart_strength.py` — this is the one
  table that regressed.)

### C4 — Node functional nature resolved differently by different consumers ⚠️
- **Where:** `_chart_build.py` and `house_lords.py` pass `node_rasi_map` to
  `get_functional_nature`, so Rahu/Ketu resolve via **dispositor + occupied
  house**. But `life_areas_service.py:1220–1221` calls
  `get_functional_nature(lagna_rasi, maha_lord)` **without** `node_rasi_map`.
- **Effect:** when the mahadasha/antardasha lord is Rahu or Ketu, life-area
  scoring uses the table default **NEUTRAL** (dasha score 10) instead of the
  dispositor-derived nature the rest of the app uses. Career/wealth/health/
  whatif callers should be swept for the same omission.
- **Fix:** thread `node_rasi_map=natal_planet_rasis` into these calls.

### C5 — Four parallel encodings of "functional nature → weight" (maintenance risk)
- `functional_nature.FUNCTIONAL_DASHA_MODIFIER` (multiplier 1.40…0.60),
  `functional_nature.FUNCTIONAL_TRANSIT_MODIFIER` (1.35…0.65),
  `prediction_score._FN_DASHA_SCORE` (additive 25…3),
  `chart_strength.FUNCTIONAL_STRENGTH_DELTA` (additive +7…−6).
- Not a live bug — they're directionally aligned by hand — but there is **no
  cross-check test** binding their ordering. A future edit to one can silently
  desync the "how good is this planet functionally" signal across strength vs
  dasha vs transit vs prediction. Add a monotonicity test over the shared order
  (YOGAKARAKA ≥ LAGNA_LORD ≥ TRIKONA ≥ … ≥ DUSTHANA).

---

## Part B — Calculation concerns & under-cared areas

### G1 — Production dignity uses natural friendship only (no Panchadha/temporary) ✎
`chart_strength._dignity_score` scores "friend sign / enemy sign" from the
**naisargika** (permanent) friendship of the sign lord only. The classical
five-fold **compound** relationship (naisargika + tatkalika/temporary → adhi-
mitra … adhi-shatru) *is* implemented — but only in the **stranded** `shadbala.py`
(`# Compound (five-fold / Panchadha)…`), which does not feed `strength_score`.
So Level-2 friend/enemy strength is coarser than classical practice. Wiring the
compound relationship into `_dignity_score` is the single highest-value depth
upgrade.

### G2 — Conjunction/yuti is whole-sign; orb is ignored ✎
The yuti term (`chart_strength.apply_holistic_synthesis`) and every "same rasi =
conjunct" check treat two planets 0.5° apart identically to 28° apart. Graha
yuddha (1° orb) and combustion (real orb) are the only orb-aware conjunction
rules. The framework explicitly names "exact orb of conjunctions" as a common
miss — currently accurate for us. Consider grading the yuti weight by degree
separation.

### G3 — Day/night is clock-based (06:00–18:00), not sunrise/sunset ✎
`_chart_planets._is_daytime_birth` returns `6 <= hour < 18` and feeds Kala Bala
(nathonnatha day/night strength). Yet the birth panchangam computes **true**
sunrise/sunset, and Mandhi already uses true sunrise. So a dawn/dusk or high-
latitude birth gets the wrong nathonnatha half — and Mandhi (true) and Kala Bala
(clock) disagree on "was this a day birth" for the same chart. Route the real
sunrise/sunset already computed in `_birth_panchangam_signature` into the day/
night flag.

### G4 — Varga strength (Level 19) judged from the D1 lagna, coarsely ✎
`life_areas_service` L4 varga-confirmation takes the house-lord's **divisional**
rasi and counts its house **from the natal D1 lagna** (`house_from_reference(
lagna_rasi, varga_lord_rasi)`), scoring ±10/−5 on one planet. Classically a
divisional chart has its **own** lagna; judging a D10 position from the D1 lagna
is a frame mix. It's a defensible rough proxy (and area→varga routing D9/D10 is
correct), but it is not true varga-lagna house analysis and only checks the lord,
not the karaka.

### G5 — Full classical Shadbala remains stranded (Level 20) ✎
`shadbala.py` computes Saptavargaja/Vimsopaka (dignity across 7 vargas), full
Kala Bala (ayana/hora/tribhaga/vara), Oja-Yugma/Kendradi/Drekkana, and a virupa
Drik — all tested, none feeding `strength_score` (only the experimental
`GET /charts/{id}/shadbala`). The product blend approximates these; the
convergence job (spec G5–G8) is still owed.

### G6 — Lone-retrograde neecha-bhanga (school-dependent, minor)
As in C2.3, `_yoga_detect` flags a debilitated **retrograde** planet as bhanga
with no other cancellation. Some schools do hold "neecha + vakra = bhanga," so
this is defensible — but it should be a *labelled* condition, not silently
tipping `is_present` to true. Decide and document.

---

## Part C — 21-Level coverage matrix

| # | Level | Status | Where / notes |
|---|-------|--------|---------------|
| 1 | Lagna | ◑ Good | rasi/nakshatra/pada; bhava-bala house-1 (occupant+aspect+lord); kartari on LAGNA. No single "ascendant strength" score, but its constituents are all computed. |
| 2 | Planet strength | ● Strong | `compute_natal_planet_score` (6-bala blend) + holistic synthesis. Gaps G1 (compound friendship), G5 (full shadbala). |
| 3 | House strength | ● | `compute_bhava_bala` (lord 50 / occupant 25 / drishti 25) + `bhava_afflictions`. |
| 4 | House-lord analysis | ● | `house_lords.compute_house_lord_report` — all 12, placement+strength+nature+significations. |
| 5 | Conjunction | ◑ | yuti (nature+strength graded), graha yuddha, combustion, cazimi. Gap G2 (orb). |
| 6 | Aspects (drishti) | ● | shared table; count → drik bala; synthesis grades by source strength. Whole-sign (no orb taper); node aspect = disclosed school choice. Conflict C3. |
| 7 | Aggregate | ● Strong | `prediction_score` 6-layer + `reasoning/` gate→vote (no averaging). |
| 8 | Yogas | ● | ~20 yogas + `yoga_activation` (dasha-gated intensity). |
| 9 | Doshas | ● | Sevvai, Rahu/Ketu, Pitru, Kalasarpa (named nagas), Kalathra, Marana Karaka, Badhaka, Kemadruma… + cancellation. |
| 10 | Nakshatra | ● | dispositor chain, pushkara (navamsa+bhaga), gandanta, gana/nadi, nakshatra-lord dynamics. |
| 11 | House karakas | ● | `_AREA_ROUTING` karakas per area + `jaimini_karakas` (Darakaraka etc.). |
| 12 | Functional benefic/malefic | ● Strong | `functional_nature` table + `derive_functional_nature` oracle + pinned tests. Conflict C4/C5. |
| 13 | Dasha | ● Strong | Vimshottari + `dasha_activation` connection-match + maturation; also ashtottari/yogini/kalachakra/jaimini/conditional. |
| 14 | Transit (Gochara) | ● | transit positions, vedha (+exempt pairs), double transit. |
| 15 | Saturn cycle | ● Strong | Sade Sati 3-phase, Ashtama, Ardha-Ashtama, Kandaka, murthi grading (ingress default + pada variant). |
| 16 | Jupiter transit | ● | double-transit Jupiter, guru peyarchi surfaces. |
| 17 | Rahu/Ketu transit | ● | in transit engine + double-transit rahu. |
| 18 | Degrees | ● | avastha (baladi/jagradadi/deeptadi), sandhi penalty, gandanta, dik bala. Gap G2 (conjunction orb). |
| 19 | Divisional charts | ◑ | D2–D60 computed; area→varga routing D9/D10 correct. Gap G4 (D1-frame, lord-only, coarse). |
| 20 | Special strength (Shadbala) | ◑ | full classical exists but stranded (G5). Product blend approximates. |
| 21 | Topic synthesis | ● Strong | per-area gated scoring: marriage/career/wealth/health/education/relationships/foreign. |

● implemented well · ◑ implemented with a real gap · ○ missing (none are fully missing)

---

## Part D — Recommended order of work

1. **C1** (dual-path synthesis) — live user-visible inconsistency; highest priority.
2. **C2** (unify neecha bhanga) — number vs card can contradict.
3. **C3** (delete `_ASPECT_OFFSETS`, use shared table) — cheap, removes a latent trap.
4. **C4** (thread `node_rasi_map` into life-area/career/wealth/health/whatif dasha nature).
5. **G1** (compound friendship into `_dignity_score`) — biggest accuracy upgrade.
6. **G3** (true sunrise day/night), **C5** (functional-weight monotonicity test), **G4/G5** (varga-lagna frame + shadbala convergence) as a depth tranche.

None of C1–C4 change doctrine — they make one already-chosen rule fire in one
place instead of two. G1/G4/G5 are depth upgrades that need the usual astrologer
weight sign-off before flipping on.

---

## Part E — Resolution log (2026-07-23, same day)

**C1–C5 implemented and tested.** Conflict elimination only — no new doctrine
introduced. `DAILY_SCORE_ENGINE_VERSION` bumped `v6 → v7` so cached daily rows
regenerate (C2/C4 shift scoring output).

| ID | Resolution |
|----|------------|
| **C1** ✅ | Extracted `_apply_holistic_strength_synthesis` in `_chart_build.py`; called from **both** `_chart_response_from_profile` and `_chart_response_from_record` (before yoga detection in each). Also aligned the profile-path combust set to exclude cazimi, matching the record path. First-view / public-tools / compatibility now equal the persisted-read numbers. |
| **C2** ✅ | New canonical `chart_strength.neecha_bhanga_cancelled` — the single predicate now consumed by **both** `_yoga_detect.detect_neecha_bhanga` (card) and `chart_strength._neecha_bhanga_planets` (strength +14). Four substantive conditions; D9 uses house-from-D9-lagna when known (both production paths pass it), dignity fallback otherwise. Lone-retrograde over-detection (G6) closed in the same stroke. |
| **C3** ✅ | Deleted `_ASPECT_OFFSETS`/`_does_aspect`/`_house_distance` from `_chart_planets.py`; natal drik count now calls the shared `aspects.aspects_house`. One drishti table for the whole engine again. |
| **C4** ✅ | Threaded `node_rasi_map` into the functional-nature calls in `life_areas_service` (prediction-score input + maraka safety check) and `chart_explanation_service` (dasha-timeline). A Rahu/Ketu dasha lord now resolves via dispositor+house everywhere, not NEUTRAL-in-some-places. |
| **C5** ✅ | Added `tests/test_functional_nature_consistency.py` pinning the ranking all four functional-weight tables agree on. |

**New sub-finding surfaced by C5 — OPEN, needs astrologer sign-off (does NOT
change output):** the four weight tables **disagree today on KENDRA vs NEUTRAL**.
`prediction_score._FN_DASHA_SCORE` ranks a Kendradhipati (KENDRA) *above* NEUTRAL
(12 vs 10), while `FUNCTIONAL_DASHA_MODIFIER`, `FUNCTIONAL_TRANSIT_MODIFIER`, and
`FUNCTIONAL_STRENGTH_DELTA` rank NEUTRAL *above* KENDRA (kendradhipati dosha —
a benefic kendra-lord is mildly malefic). MARAKA vs UPACHAYA is a near-tie
(equal in the transit table). The guard test deliberately does **not** pin
either pair, leaving the doctrinal call to the astrologer. Resolving KENDRA/NEUTRAL
one way is a one-line edit once the direction is chosen.

**Verification:** targeted suites all green — holistic synthesis (11), yogas incl.
neecha (51), functional-nature consistency (53), chart/aspect/strength/dasha/
explanation (115), life-areas/career/wealth/health/daily (51), profile-path
consumers public-tools/relationships/porutham/compatibility (170). No failures.
