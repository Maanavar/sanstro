# Reasoning Depth Audit — 2026-07-17

**Question audited:** when Vinaadi predicts (marriage, career, finance, any life area), does it reason from a single condition (e.g. "is the 7th lord in dasha?") or does it weigh the full classical picture — aspects, occupancy, dispositors, vargas, hemming, transits — the way a practising Thirukanitham astrologer would?

**Verdict:** the six-layer life-areas engine was genuinely multi-factor and classically ordered (promise-as-veto before timing). But the platform had **two engines of unequal depth answering the same questions**, and **dasha activation was identity-match-only in every path** — the single biggest predictive-accuracy gap. Both were fixed the same day; see the remediation log.

---

## 1. Per-path factor matrix (before → after)

| Factor | life_areas (6-layer) | marriage_service | career_service | event_windows |
|---|---|---|---|---|
| Bhava lord placement (dusthana etc.) | ✅ | ✅ | ✅ | — |
| Karaka dignity D1 + varga | ✅ (gate) | ✅ (gate) | ❌ | — |
| Natal planet strength incl. drik bala | ✅ | ❌ | ❌ | ❌ |
| Bhava bala (occupants + drishti on house) | ✅ | ❌ | ❌ | ❌ |
| **Named malefic drishti on bhava/lord/karaka** | ❌ → ✅ | ❌ → ✅ | ❌ → ✅ | — |
| **Papa/shubha kartari (hemming)** | ❌ → ✅ | ❌ → ✅ | ❌ → ✅ | — |
| Functional nature of dasha lords | ✅ | ❌ | ❌ | ❌ |
| **Dasha connection-match** (occupies/aspects bhava, related-house lordship, dispositor, node agency) | ❌ → ✅ | ❌ → ✅ | ❌ → ✅ | ❌ → ✅ |
| Varga confirmation (area-routed) | ✅ | D9 Venus only → **+ 7L navamsa dignity** | ❌ | — |
| Double transit (Jupiter+Saturn) | ✅ | ❌ | ❌ | ❌ → ✅ |
| Sade Sati / Ashtama Sani / Kandaka | ✅ | ❌ | ✅ (kandaka) | — |
| Ashtakavarga (BAV/SAV) | ✅ | ❌ | ❌ | — |
| Sevvai/Rahu-Ketu dosham inputs | via routing | ✅ | — | — |
| Window honesty (antardasha-clamped spans) | n/a | n/a | n/a | ❌ → ✅ |

---

## 2. Findings

### F-1 (architectural): engine fork
`app/api/predictions.py` marriage/career endpoints run their own shallow additive engines (`marriage_service.py`, `career_service.py`) — zero natal drishti, no double transit, no ashtakavarga — while `/life-areas` runs the six-layer engine. Same chart, two verdicts of different quality.
**Status: depth fork closed** by wiring both services to the same shared factor modules. A full delegation to `compute_prediction_score` remains a worthwhile follow-up but is no longer urgent — the shallow engines now see the same classical signals.

### F-2 (highest accuracy impact): identity-only dasha activation
Every path asked only "is the dasha lord literally the bhava lord or karaka?" Classical timing (Parashara dasha-phala) also activates through: occupancy of the bhava, drishti on the bhava, lordship of related houses (2/7/11 for marriage), dispositorship of the bhava lord, and Rahu/Ketu acting as agents of their dispositor/co-tenants. Most real event-giving dashas were invisible.
**Status: FIXED** via shared `app/calculations/dasha_activation.py`, wired into all four paths.

### F-3: malefic affliction averaged, never named
Saturn's drishti on the 7th (delay signature), papa kartari (hemming), multiple malefics on the karaka — all previously reduced to a ±0.15 inside drik bala, never surfaced as reasons, never able to qualify the promise.
**Status: FIXED** via shared `app/calculations/bhava_afflictions.py`:
- named `AstroFactor`/challenge strings on marriage (7th) and career (10th);
- named blocking/supporting factor keys in life-areas chain scoring;
- feeds the promise gate as an **area-specific dosham** in `_score_area` (was hardcoded `NONE`), with shubha kartari as the cancellation channel;
- 2+ malefics on the 7th lord now count as "lord afflicted" in the marriage promise gate (BLOCKED still requires the karaka afflicted in D1+D9 — conservative by doctrine D3).

### F-4: D9 used only as Venus dignity
**Status: partially fixed** — the 7th lord's own navamsa dignity is now read (support/caution factor). D9-lagna and 7th-from-navamsa-lagna need the D9 ascendant, which the marriage payload does not carry → **OPEN (needs API field)**.

### F-5: event windows over-claimed and under-detected
One anchor per year, identity-only dasha, no Saturn confirmation, and every window claimed anchor→Dec 31.
**Status: FIXED** — connection-match activation (fewer missed windows), `score_double_transit` bonus/penalty (`double_transit_confirms`, `saturn_pressure_on_house`), and windows clamped to the qualifying antardasha span within the year.

---

## 3. New shared modules

### `app/calculations/dasha_activation.py`
`assess_dasha_activation(lagna_rasi, bhava_house, dasha_lords, natal_planet_rasis, karakas, related_houses)` → `DashaActivation(activated, strength STRONG/MODERATE/NONE, connections)`. Connection kinds: `lords_bhava`, `lords_related_house`, `is_karaka`, `occupies_bhava`, `aspects_bhava`, `dispositor_of_bhava_lord`, `node_agent_of_<planet>`. Maha primary connection (or maha+antar both connected) → STRONG; any other connection → MODERATE.

### `app/calculations/bhava_afflictions.py`
`assess_bhava_afflictions(lagna_rasi, bhava_house, planet_rasis, karaka)` → occupying/aspecting malefics, lord/karaka afflictors, papa/shubha kartari, severity. Conventions: malefics = Saturn/Mars/Rahu/Ketu (Sun counted only for kartari); a malefic owning the bhava is exempt from afflicting it. `affliction_dosham_strength(severity)`: ≥3 MILD, ≥5 MODERATE, ≥7 STRONG — calibrated so ordinary malefic scatter (severity 1–2) stays background.

---

## 4. Consumers updated

| File | Change |
|---|---|
| `app/services/life_areas_service.py` | `_karaka_chain_score`: connection-match activation (graded +15/+8 bonus), named affliction blocking factors, severity penalty. `_score_area`: broader maha/antar connection booleans; afflictions feed the promise gate's dosham channel. |
| `app/services/marriage_service.py` | Named 7th-house affliction factors + kartari; connection-match dasha (STRONG/PARTIAL/WEAK); 7L navamsa dignity; gate lord-affliction extended. |
| `app/services/career_service.py` | Named 10th-house affliction factors; connection-match dasha replacing the identity + flat-karaka bonus (removes a double-count). |
| `app/calculations/event_windows.py` | All three finders: connection-match qualification, double-transit adjustment, antardasha-clamped spans (graceful fallback when period dates absent). |
| `app/services/whatif_service.py` | `_assess_dasha_support` was chart-blind (generic planet→scenario affinity table — it could not know Saturn is *this* lagna's 7th lord). Now blends a connection-match adjustment (+8 STRONG / +4 MODERATE) using the scenario's house set and karakas. |
| `app/services/wealth_service.py` | Identity-only 2nd/11th-lord dasha check → connection-match on the 2nd complex (2/11/5, Jupiter/Venus karakas) with a new PARTIAL tier. |
| `app/services/health_service.py` | Caution-direction connection-match: a dasha lording/occupying the 6th–8th complex (or node agent of one) flags a care period; aspect-only contact deliberately excluded as too broad. |

Deliberately **unchanged**: `yoga_activation.py` and `propensities.py` identity checks — a yoga classically fires in the dashas of its *own* participating planets, so identity is the correct rule there.

API contract: **no response-shape changes** — only additive factor/reason strings; web/mobile/shared untouched.

## 5. Tests

- `tests/test_dasha_activation.py` — 9 hand-worked cases (identity, occupancy, aspect, dispositor, node agency, related-house, antar-only, none).
- `tests/test_bhava_afflictions.py` — 5 cases incl. own-house exemption, kartari both ways, background-noise threshold. (One expectation was corrected *by the module*: Rahu/Ketu aspects on Venus the author missed by eye — the "script-diff, never eyeball" lesson again.)
- `tests/test_reasoning_depth_upgrades.py` — 6 service-level pins (named factors surface; PARTIAL support; D9 7L dignity).
- Two `event_windows` fixtures updated: their "no dasha support" lords (Venus = 2nd lord; Sun = 5th lord) are *connected* under classical rules — the old tests encoded the identity-only bug as an invariant.
- Golden case `delayed_marriage` updated: its "unsupportive" Saturn dasha is, for Aries lagna, the 11th lord aspecting Libra from Capricorn — classically a timing supporter. The case's intent (promised-not-now) is preserved with a genuinely unconnected Mercury dasha; the JSON annotation records the change and rationale.
- Affected-area regression: 56 passed (career/dashboard/life-areas/predictions/prediction-score suites, Postgres); reasoning package 137 passed.
- **Full suite vs Postgres (`vinaadi_test`), post-change: 1876 passed, 12 skipped, 0 failed** (run in three sequential chunks on 2026-07-17; the 12 skips are the pre-existing WI-07 sunrise-reference gates, unrelated).

## 6. Open items

| ID | Item | Blocked on |
|---|---|---|
| O-1 | D9 lagna + 7th-from-navamsa-lagna in marriage payload | API field addition (backend+shared+web+mobile per contract rule) |
| O-2 | Upapada Lagna / Dara Karaka overlay (Jaimini) behind AdvancedAstrologyGate | product decision; `jaimini_karakas.py` already exists |
| O-3 | Full delegation of marriage/career endpoints to the six-layer engine | larger refactor; depth fork already closed |
| O-4 | Golden charts with real (synthetic-identity) event dates validating window hit-rate | astrologer-supplied reference cases |
| O-5 | Native-Tamil review of new TA strings (marriage/career affliction copy) | Tamil reader session |
| O-6 | Weight calibration of affliction penalties / activation bonuses against known charts | O-4 data |
