# Thirukanitham Depth Expansion Plan

Companion to the 2026-07-03 methodology audit (see chat/artifact). Goal: close the
gaps between the current engine and full classical Thirukanitham practice —
Gulika as a chart point, the missing Shodasavarga members, full classical
Shadbala/Bhava Bala, Jaimini Atmakaraka/Karakamsa, and the three missing dasha
systems (Ashtottari, Yogini, Kalachakra) — plus one real bug found during the
audit (aspect rules disagree across modules).

**How to read this doc:** each item has what it is, the formula to use (cited
from this repo's own frozen spec where it already exists), exactly which files
to touch, which of the four API-contract surfaces it affects
(`app/api/` → `packages/shared/src/api/` → `mobile/src/api/` → `web/`, per
`CLAUDE.md`), and how to validate it before merge (per the project's own rule:
domain calc bugs are silent, so nothing here ships on "does it run" tests
alone — see `feedback_astrology_calc_accuracy` precedent:
Gowri table, Rikta tithi, Amirdhadhi Yogam).

This is a big scope. It is phased so each phase ships independently and the
riskiest, least-specified items (Kalachakra Dasha) are last and flagged for
explicit astrologer sign-off rather than guessed.

---

## Guiding principles (carried over from the July audit)

1. **Cite a classical source per formula.** Where this repo's own frozen spec
   (`docs/Jothidam_AI_Formula_Engine_Specification_v1_Thirukanitham_2026.md`)
   already has the formula, use it verbatim and cite the section. Where it
   doesn't (Ashtottari, Yogini, Kalachakra, Atmakaraka — none of these appear
   in the spec at all), the formula must be written down with its source
   (BPHS / Phaladeepika / etc.) in a code comment before it's implemented —
   the exact failure mode this project has already been burned by twice
   (Gowri table names, Jeevan/Nethiram) is "plausible-looking code, no
   citation, wrong output, tests pass anyway."
2. **New tables get golden test cases, not just unit tests.** Follow the
   existing pattern in `tests/test_golden_validation.py` /
   `docs/Jothidam_AI_QA_Golden_Test_Cases_v1_Thirukanitham_2026.md`. A new
   varga or dasha system isn't done until it has 3-5 hand-checked cases
   (cross-checked against a second source such as Jagannatha Hora,
   drikpanchang.com, or a printed panchangam) locked into that suite.
3. **Don't touch already-audited tables.** BAV tables, Vimshottari, navamsa,
   Gowri, Vedha, etc. are out of scope here — they were independently
   verified 2026-07-02. This plan only adds new code paths.
4. **Respect the 4-surface API contract.** Any new field reaching a chart
   response needs updates in `app/api/`, `packages/shared/src/api/`,
   `mobile/src/api/`, and `web/` in the same change — grep all four before
   editing any one (`CLAUDE.md` rule).
5. **Keep the existing product score.** `chart_strength.py`'s "practical
   six-component Shadbala blend" stays as-is — it's cheap, already tuned into
   `prediction_score.py`'s L2/L3 layers, and used across daily-guidance
   features. Full classical Shadbala (Phase 2 below) is an **additive**
   deep-view module, not a replacement — the spec says as much itself
   (§7.6: *"This is not full classical Shadbala... The system can launch
   with product strength score, but if M20 says Shadbala, then this
   contract must be implemented"* — §8 is that contract, still unbuilt).

---

## Phase 0 — Fix the aspect-rule inconsistency (bug, not a feature)

**What:** `chart_explanation_service.py` has the correct classical special
aspects (Mars 4/7/8, Jupiter 5/7/9, Saturn 3/7/10, Rahu/Ketu 5/7/9). The yoga
engine and Bhava Bala only use the plain 7th aspect (+ Jupiter 5/9 in Bhava
Bala only). Transit aspects have Jupiter/Saturn right but no Mars 4/8 at all.
Same astrological question, three different answers depending which module
you hit.

**Fix — consolidate into one shared aspect module:**

1. Create `app/calculations/aspects.py`:
   ```python
   ASPECT_HOUSES: dict[str, frozenset[int]] = {
       "MARS": frozenset({4, 7, 8}),
       "JUPITER": frozenset({5, 7, 9}),
       "SATURN": frozenset({3, 7, 10}),
       "RAHU": frozenset({5, 7, 9}),
       "KETU": frozenset({5, 7, 9}),
   }

   def aspect_houses(planet: str) -> frozenset[int]:
       return ASPECT_HOUSES.get(planet, frozenset({7}))

   def aspects_house(planet: str, source_rasi: int, target_rasi: int) -> bool:
       return house_from_reference(source_rasi, target_rasi) in aspect_houses(planet)
   ```
   (Move `_ASPECT_HOUSES`/`_aspect_houses` out of `chart_explanation_service.py`
   verbatim — it's already correct, just import it from the new shared module
   instead of re-declaring locally.)
2. `_yoga_helpers.py`: replace `_is_seventh_aspect` call sites with
   `aspects_house(...)` from the new module wherever a yoga rule cares about
   "does planet X aspect house/planet Y" generically. Keep any yoga that
   *specifically* means the plain 7th (e.g. Gaja Kesari's mutual-kendra check
   is about placement, not drishti — read each call site, don't blanket-replace).
3. `chart_strength.py: compute_bhava_bala` — replace the inline
   `distance == 7 or (planet == "JUPITER" and distance in {5, 9})` with
   `aspects_house(planet, rasi, house_rasi)`.
4. `transits.py: get_jupiter_aspects` / `get_saturn_aspects` — keep for
   backward compatibility of call sites, but add `get_mars_aspects` using the
   shared table, and have all three delegate to `aspects.py` rather than
   duplicating the offset arithmetic.
5. Bump whatever cache/version constant governs yoga/dosham output (check
   `PANCHANGAM_CACHE_DATA_VERSION`-style versioning in `_yoga_dosham.py` if
   one exists) since this changes yoga detection results for real charts.

**Validation:** existing `tests/test_dasha.py`-style suites won't catch this —
add explicit cases in a new `tests/test_aspects.py`: Mars at Aries aspecting
its 4th (Cancer)/7th (Libra)/8th (Scorpio) houses, confirm yoga detection
picks up a Mars aspect on the 10th lord that it currently misses. Re-run full
regression suite (`test_golden_validation.py`, `test_chart_strength.py`) —
expect some yoga/dosham output to change for charts with Mars/Saturn special
aspects; review each diff manually before accepting.

**Surfaces touched:** backend-only if yoga/dosham *labels* don't change shape
(same schema, different boolean outcomes) — verify `app/schemas/*` for
yogas/doshams doesn't need a new field. No shared/mobile/web change expected
unless the aspect list itself becomes user-visible (it already is, via
`chart_explanation_service` — no schema change there either, same shape).

**Effort:** small, ~1 day incl. tests. **Risk:** low (consolidation of
already-correct code), but changes real chart output — do not merge without
manually reviewing which existing charts flip yoga/dosham status.

---

## Phase 1 — Foundational additions (well-specified, low ambiguity)

### 1.1 D60 Shashtiamsa (and D27, D40, D45)

**What:** the finest classical varga; Parashara treats it as decisive for
close calls. Spec already has the formula.

**Formula (from spec §3.13, cite this section in the code comment):**
```python
def compute_d60(planet_longitudes: dict[str, float]) -> dict[str, int]:
    def _d60(lon: float) -> int:
        rasi, deg = _norm(lon)
        index = int(deg // 0.5)  # 60 divisions of 0°30' each
        if rasi in {1, 3, 5, 7, 9, 11}:  # odd (movable-style) signs
            return ((rasi + index - 1) % 12) + 1
        return ((rasi - index - 1) % 12) + 1
    return _map_divisional(planet_longitudes, _d60)
```
Note the spec flags birth-time sensitivity explicitly: *"Birth time must be
exact; if uncertainty exceeds 2 minutes, mark D60 as unreliable."* — surface
that caveat in the API response (a `reliability: "LOW"` flag when
`birth_time_confidence` is anything but exact-known — check whatever field
`BirthProfile` already uses for this, e.g. from `rectification_service.py`'s
output).

**D27 (Nakshatramsa / Bhamsa), D40 (Khavedamsa), D45 (Akshavedamsa):** not in
this project's spec at all — use the standard Parashari rules (same
movable/fixed/dual starting-sign pattern already used for D16/D20/D24 in
`divisional_charts.py`, so match that code's existing style):
- D27: 12 equal parts of 1°06'40" each; starting sign cycles Aries→Sagittarius
  repeating every sign (fire signs start Aries, earth start Cancer, air start
  Libra, water start Capricorn — verify against a second source before
  shipping, this is the one sub-item in Phase 1 that needs a cross-check).
- D40: 0°45' segments; odd signs start from Aries, even signs start from Libra.
- D45: 0°40' segments; movable start Aries, fixed start Leo, dual start
  Sagittarius.

**Where:** add `compute_d27`, `compute_d40`, `compute_d45`, `compute_d60` to
`app/calculations/divisional_charts.py`, following the exact pattern already
used by `compute_d16`/`compute_d20`/`compute_d24` in that file (same file,
same style — don't create a new module for this).

**Surfaces:** `divisional_charts.py` output already feeds
`ChartCalculateResponse` per the P2-05 TODO note in that file — check
`app/schemas/charts.py` for the varga list shape, add the 4 new keys, then
propagate to `packages/shared/src/api/`, `mobile/src/api/vargas.ts`, and
`web/components/dashboard-vargas-panel.tsx` (all four already exist and
already list D2 through D30 — this is a mechanical extension of an existing
pattern, not new plumbing).

**Validation:** 3-5 golden cases per varga against a second tool (Jagannatha
Hora is free and standard for this cross-check). D60 especially — this is
the varga most likely to have an off-by-one in the odd/even starting-index
direction, verify against known example charts before trusting it in
production scoring.

**Effort:** ~2-3 days (4 vargas + tests + 4-surface plumbing).
**Risk:** low for D60 (spec-sourced), medium for D27/D40/D45 (sourced from
general classical texts, not this project's own spec — flag clearly in the
PR that these three need a second pass of astrologer confirmation before
they're used in any *scoring* path, display-only is fine to ship first).

### 1.2 Gulika / Kulikai as a natal chart point

**What:** currently Kuligai only exists as a *time window*
(`panchangam.py: KULIGAI_SLOT`, used for muhurtham exclusions). Classical
Tamil practice also wants it as a **chart point** — a longitude/rasi that
gets a house placement and gets read/aspected like a graha.

**Formula:** Gulika's longitude = the ascendant (lagna) degree at the exact
moment the Kuligai Kalam window *begins* for that day/night. The window
start time is already computed in `panchangam.py` (`kuligai.start`,
a `PanchangamSlot`). To get the point:
```python
# app/calculations/gulika.py
def compute_gulika_longitude(kuligai_start_jd: float, latitude: float, longitude: float) -> float:
    """Gulika = the Lagna (ascendant) degree at Kuligai Kalam's start moment."""
    return calculate_lagna_degree(kuligai_start_jd, latitude, longitude)
```
This reuses `ephemeris.py: calculate_lagna_degree`, the same function
`rectification_service.py` already calls — no new astronomical primitive
needed, just a new caller. Note some traditions compute Mandi with a slightly
different sub-slot offset than Gulika — document this project's choice (they
are being treated as the same point, "common Tamil Thirukanitham practice")
the same way `ashtakavarga.py` already documents its Rahu/Ketu-via-Saturn
convention, so a future audit can find the decision.

**Where:**
- New `app/calculations/gulika.py` for the point computation.
- Wire into chart build (`app/services/_chart_build.py`, same place
  `bhava_chalit.py` and `ashtakavarga.py` get called) so Gulika's rasi/house
  becomes part of the standard chart payload — treat it as an 8th "pseudo-
  planet" entry, same shape as Rahu/Ketu already get.
- Extend `app/calculations/aspects.py` (Phase 0) — decide whether Gulika
  *casts* aspects (classical practice: it does, like a malefic, via the 7th)
  or only *receives* them; document the choice.
- Yoga engine: add Gulika to the malefic set anywhere `_BHAVA_BALA_MALEFICS`-
  style sets are used, so its occupancy/aspect correctly darkens house
  strength like Rahu/Ketu already do.

**Surfaces:** new field on the planets/points list in `app/schemas/charts.py`
→ `packages/shared/src/types/index.ts` → `mobile/src/api/vargas.ts` (or
wherever the jadhagam planet list type lives) → the Jadhagam chart display
component in `web/`. This is a new user-visible chart point, so all four
surfaces need it, not just backend.

**Validation:** cross-check Gulika's house placement for 3-5 known charts
against drikpanchang.com or a printed panchangam (both publish Gulika
Lagna/Kalam and its rasi placement).

**Effort:** ~2 days. **Risk:** low — reuses existing, already-verified
astronomical primitives; the only judgment call is the Mandi-vs-Gulika
convention, which just needs documenting, not resolving.

### 1.3 Full Avastha (Jagradadi + Deeptadi)

**What:** `chart_strength.py` only has Baladi avastha (5-stage,
infant→old). Two more classical avastha systems exist and are
straightforward to add:

- **Jagradadi avastha** (3-stage: awake/dreaming/sleeping) — determined by
  whether the planet is in an odd/even navamsa combined with benefic/malefic
  nature; standard rule: benefics in odd navamsa + malefics in even navamsa →
  Jagrat (awake, strong); the reverse → Sushupti (asleep, weak); mixed → Swapna
  (dreaming, medium).
- **Deeptadi avastha** (10-stage, purely dignity-driven — deterministic once
  you have the existing `_dignity_score`): Deepta (exalted) → Swastha (own
  sign) → Mudita (friendly sign, high degree) → Shanta (neutral sign) →
  Deena (enemy sign) → Dukhita (debilitated) → ... down through Kopa/Sushupta/
  Mrita. This can be built almost entirely from the dignity table already in
  `chart_strength.py` — it's a relabeling of existing dignity bands into the
  10 classical names, so it's cheap to add.

**Where:** add `_jagradadi_avastha(planet, navamsa_rasi, is_benefic)` and
`_deeptadi_avastha(dignity_score)` next to the existing `_avastha_multiplier`
in `chart_strength.py`. Surface all three avastha labels (Baladi, Jagradadi,
Deeptadi) in `compute_strength_breakdown`'s return dict.

**Surfaces:** additive fields on the existing per-planet strength breakdown
already returned to `app/api/charts.py` — extend the same schema path used
for the current `sthana/dik/kala/chesta/naisargika/drik` breakdown.

**Effort:** ~1 day (Deeptadi is nearly free given existing dignity scoring;
Jagradadi needs the D9 navamsa parity check, which `divisional_charts.py`
already computes).
**Risk:** low — deterministic, no new astronomical input needed.

---

## Phase 2 — Full classical Shadbala + Bhava Bala (the spec's own unbuilt contract)

> **Status (2026-07-03): per-planet Shadbala BUILT (experimental).**
> `app/calculations/shadbala.py` implements all six components in Virupas →
> Rupas vs. the spec §8 required-Rupas table, with each sub-formula cited to
> BPHS/B.V. Raman inline: Sthana (Uchcha, Saptavargaja over the 7 vargas,
> Oja-Yugma, Kendradi, Drekkana), Dig (spec §8.1), Kala (Nathonnatha, Paksha,
> Tribhaga, Vara, Hora, Ayana via computed declination), Chesta (Sun=Ayana,
> Moon=Paksha, else speed-vs-mean), Naisargika, Drik. Wired behind
> `GET /charts/{id}/shadbala` (`shadbala_service.py`) + all 4 surfaces
> (shared `shadbala.ts`, mobile `app/shadbala`, web `dashboard-shadbala-panel`).
> Golden/unit tests in `tests/test_shadbala.py` (hand-checked sub-components).
> **Deliberately deferred** (documented, not guessed): Abda/Masa Bala (need
> ahargana year/month lords), Yuddha Bala (needs disc diameters), and the
> full epicyclic 8-fold Chesta (uses a documented speed approximation).
> **Still TODO before removing the experimental label:** (1) classical
> `compute_bhava_bala_classical` on top of this module (below), and (2)
> Jagannatha Hora cross-validation of the Rupa totals for all 7 planets.


**What:** the spec's §8 "Full Shadbala Engine Contract" is written but never
implemented — Shashtiamsa-unit scoring with minimum-required Rupas per
planet. Build it as a genuinely separate, additive module (per guiding
principle #5 — do not replace the product score).

**Where:** new `app/calculations/shadbala.py` implementing all six components
in Shashtiamsa units per spec §8/§8.1, converting to Rupas
(`rupas = total_shashtiamsa / 60`), and comparing against the required-Rupas
table (Sun 6.5, Moon 6.0, Mars 5.0, Mercury 7.0, Jupiter 6.5, Venus 5.5,
Saturn 5.0) to produce a pass/fail "is this planet classically strong"
verdict distinct from the 0-100 product score.

This is real work — Sthana Bala alone classically has 5 sub-components
(Ochcha Bala, Saptavargaja Bala, Ojayugmarasyamsa Bala, Kendradi Bala,
Drekkana Bala) that the current product score collapses into one dignity
number. Sequence sub-components in order of how independently verifiable
each is:
1. Dig Bala (spec has the exact formula, §8.1 — do first, cheapest).
2. Naisargika Bala (already have the natural-strength ordering in
   `chart_strength.py: NAISARGIKA_BALA` — just needs Shashtiamsa rescaling).
3. Kendradi Bala + house-based sub-components of Sthana Bala.
4. Ochcha Bala (exaltation-distance based, deterministic from existing
   `EXALTATION_RASI`/`DEBILITATION_RASI` tables).
5. Saptavargaja Bala (needs all 7 of the "Saptavarga" divisional charts —
   this is why Phase 1's varga expansion should land first).
6. Kala Bala's remaining sub-components (Ayana, Yuddha, Tribhaga, Abda/Masa/
   Vara/Hora Bala) — most fiddly, do last within this phase.

**Bhava Bala (classical, 4-component):** once full Shadbala exists,
Bhavadhipati Bala becomes "house lord's classical Shadbala" instead of the
current product score proxy — build `compute_bhava_bala_classical` in the
new `shadbala.py` reusing Phase 0's shared `aspects.py` for Bhava Drishti
Bala (this is exactly the module that most needed Phase 0's fix — building
classical Bhava Bala on top of the *inconsistent* aspect model would just
bake the bug in deeper).

**Surfaces:** this is an advanced/deep-dive feature — recommend gating it
behind a new API route (e.g. `GET /charts/{id}/shadbala`) rather than
folding it into the main chart response, so it doesn't force every mobile/
web consumer to handle a new heavy payload. Still needs the 4-surface
contract check once the route is designed (new files in all four locations,
but additive, not a breaking change to existing chart response shape).

**Validation:** this is the highest-stakes item for silent wrong-output risk
in the whole plan — six independently-computed sub-scores, each with its own
classical formula, combining into a single Rupa number that (per spec) is
meant to be compared against a hard pass/fail threshold. Needs golden test
cases for all seven planets against a second Shadbala calculator (Jagannatha
Hora reports full Shadbala in Rupas) before this is trusted for anything
user-facing beyond "advanced/experimental" labeling.

**Effort:** ~2-3 weeks (largest single item in this plan).
**Risk:** high for correctness (many sub-formulas, easy to get one sign-
convention wrong and have it silently degrade the total), low for product
risk if shipped behind an explicit "Advanced" flag rather than replacing the
existing product score anywhere.

---

## Phase 3 — Jaimini Atmakaraka & Karakamsa

**What:** the Char Karaka scheme (Atmakaraka = soul significator,
Amatyakaraka, Bhratrukaraka, Matrukaraka, Pitrukaraka, Putrakaraka,
Gnatikaraka, Daarakaraka) ranks the 7 classical planets (+ Rahu, by most
Tamil-tradition conventions; Ketu excluded) by descending degree-within-sign.
Karakamsa = the navamsa (D9) sign occupied by the Atmakaraka — used
classically for career/spiritual-purpose reading, and normally paired with
the Chara Dasha this project already has (`jaimini_dasha.py`).

**Formula (not in this project's spec — cite BPHS Ch. 32 in the code
comment when implementing):**
```python
# app/calculations/jaimini_karakas.py
CHARA_KARAKA_ORDER = [
    "ATMAKARAKA", "AMATYAKARAKA", "BHRATRUKARAKA", "MATRUKARAKA",
    "PITRUKARAKA", "PUTRAKARAKA", "GNATIKARAKA", "DAARAKARAKA",
]

def compute_char_karakas(planet_longitudes: dict[str, float]) -> dict[str, str]:
    """Rank SUN..SATURN + RAHU by descending degree-within-sign (0-30°).
    Ketu is excluded per standard 8-karaka scheme. Rahu's degree is counted
    forward (not reversed) per Tamil Jaimini convention — document this choice."""
    candidates = {p: lon % 30.0 for p, lon in planet_longitudes.items() if p != "KETU"}
    ranked = sorted(candidates.items(), key=lambda kv: kv[1], reverse=True)
    return {karaka: planet for karaka, (planet, _) in zip(CHARA_KARAKA_ORDER, ranked)}

def compute_karakamsa(atmakaraka: str, d9_rasi_map: dict[str, int]) -> int:
    return d9_rasi_map[atmakaraka]
```
Note: some traditions use only 7 karakas (dropping Daarakaraka and merging),
and some resolve degree-ties differently — document whichever convention is
chosen, the same way `ashtakavarga.py` documents its Rahu/Ketu proxy choice.

**Where:** new `app/calculations/jaimini_karakas.py`. Feeds naturally into
`jaimini_dasha.py`'s existing Chara Dasha output (the file already has a
`# TODO(product): decide fate` comment about a mobile Chara Dasha tab —
Karakamsa is the natural companion feature to ship alongside that decision).

**Surfaces:** new fields (Atmakaraka planet, Karakamsa rasi) on whatever
schema backs the existing Chara Dasha API route
(`GET /charts/{id}/chara-dasha`, referenced in `jaimini_dasha.py`'s TODO) —
extend that route's response rather than creating a new one. Propagate
through `packages/shared/src/api/charaDasha.ts` → mobile → web.

**Validation:** 3-5 golden cases; Atmakaraka is simple enough (just a
degree-sort) that disagreement with a second source almost always means a
longitude bug, not a methodology bug — good first target for a golden test.

**Effort:** ~3-4 days. **Risk:** low-medium (the ranking math is trivial;
the risk is entirely in which of several documented conventions to pick —
resolve that with a product/astrologer decision before writing code, not
after).

---

## Phase 4 — Alternate dasha systems (Ashtottari, Yogini, Kalachakra)

These are the least-specified items in this plan — none appear in this
project's frozen spec, and unlike the varga/karaka formulas above, dasha
systems have real scope for *conditional applicability* disagreements
between traditions (see Ashtottari below). Do not treat the pseudocode here
as final — each needs a named classical source and a product decision before
implementation, following this project's own precedent of leaving
Jeevan/Nethiram deliberately unfixed rather than shipping a guessed formula.

### 4.1 Yogini Dasha (do first — most mechanical of the three)

36-year total cycle, 8 Yoginis, period lengths 1/2/3/4/5/6/7/8 years.
Starting Yogini is derived from the Moon's nakshatra number:
`yogini_index = (nakshatra_number + offset) % 8` (the exact offset and
male/female-chart directional rule vary by source — Muhurta Chintamani vs.
other texts disagree on the offset constant; pick one, cite it, document the
choice in code exactly like `MOOLATRIKONA_ZONE`'s BPHS-vs-code convention
note already does).

**Where:** new `app/calculations/yogini_dasha.py`, structurally parallel to
`dasha.py`'s Vimshottari builder (reuse the same `DashaPeriod`-style dataclass
pattern) — sub-periods (Antardasha) follow the same nested-cycle logic
already proven out in `dasha.py: _build_subperiods`.

**Effort:** ~1 week incl. golden validation. **Risk:** medium (mechanical
once the starting-offset convention is picked, but that convention pick
needs a citation, not a guess).

### 4.2 Ashtottari Dasha (108-year cycle)

Nakshatra-lord-based like Vimshottari but different lord sequence and
period lengths. **Important scope decision needed before coding:** classical
texts apply Ashtottari only under specific chart conditions (commonly: Moon
in Simha, or per Rahu's placement relative to certain grahas — sources
disagree on the exact triggering condition), while most modern software just
runs it unconditionally alongside Vimshottari for comparison. Recommend the
product decision be: **run it unconditionally, but label it clearly as a
secondary/comparison dasha rather than implying it's always classically
applicable** — this sidesteps the conditional-applicability disagreement
without hiding it.

**Where:** `app/calculations/ashtottari_dasha.py`, same structural pattern as
`dasha.py`.

**Effort:** ~1 week. **Risk:** medium — same mechanical risk as Yogini, plus
the applicability-condition question above needs an explicit product answer
recorded in the PR description before merge.

### 4.3 Kalachakra Dasha (do last, flag for astrologer review before coding)

The most structurally different of the three — rasi- and nakshatra-pada-
based with non-uniform, direction-dependent period assignment (savya/apasavya
groups depend on which of nine nakshatra groups the Moon falls in, and the
period sequence isn't a simple fixed-order cycle like Vimshottari/Yogini/
Ashtottari). Multiple published references disagree on group boundaries.

**Recommendation:** do not implement from a single web/text source. This is
the one item in the whole plan where the guiding-principle-1 citation
requirement is hardest to satisfy confidently — treat it the same way the
July audit treated Jeevan/Nethiram (item 14): get an astrologer's worked
example (a known chart with its correct Kalachakra sequence) *before* writing
the algorithm, so there's a golden case to validate against from day one
instead of writing code first and hoping it matches later.

**Effort:** ~2 weeks + astrologer consultation time (not just engineering
time — this is the one item on this plan gated on getting domain input
first). **Risk:** high if built without that consultation — this is exactly
the failure mode ("plausible code, wrong output, tests pass because they
assert against the same wrong logic") this project has hit twice already.

---

## Suggested sequencing

| Phase | Item | Effort | Risk | Blocks / needs before starting |
|---|---|---|---|---|
| 0 | Aspect-rule consolidation (bug fix) | ~1 day | Low | None — do this first, everything downstream should build on the shared `aspects.py` |
| 1.1 | D27/D40/D45/D60 vargas | ~2-3 days | Low (D60), Medium (D27/40/45) | None |
| 1.2 | Gulika/Kulikai chart point | ~2 days | Low | None |
| 1.3 | Jagradadi + Deeptadi avastha | ~1 day | Low | None |
| 2 | Full classical Shadbala + Bhava Bala | ~2-3 weeks | High (correctness), Low (product, if gated) | Phase 0 (aspects), Phase 1.1 (Saptavargaja needs the vargas) |
| 3 | Atmakaraka / Karakamsa | ~3-4 days | Low-Medium | A product decision on karaka-count/tie convention |
| 4.1 | Yogini Dasha | ~1 week | Medium | A cited offset convention |
| 4.2 | Ashtottari Dasha | ~1 week | Medium | A product decision on applicability-condition labeling |
| 4.3 | Kalachakra Dasha | ~2 weeks + consult | High if unconsulted | Astrologer-provided worked example (get this *before* coding) |

Total rough engineering effort: **6-8 weeks** of focused work across all
phases, not counting the Kalachakra consultation lead time. Phases 0-1 are
low-risk and ship value fast (~1 week combined); Phase 2 is the single
biggest and riskiest lift; Phase 4.3 is explicitly gated on getting domain
expert input rather than a coding task at all.

Recommend starting with **Phase 0 + Phase 1** as a single PR-able batch
(bug fix plus the three well-specified additions), then treating Phases 2-4
as separate, independently-scheduled efforts — each is large enough to
deserve its own review cycle, and Phase 4.3 specifically should not start
until an astrologer-provided worked example exists.
