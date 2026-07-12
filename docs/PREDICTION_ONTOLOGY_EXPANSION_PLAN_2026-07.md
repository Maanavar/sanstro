# Prediction Ontology Expansion Plan — Thirukanitham Bhava Grid

**Authored 2026-07-12.** Companion to the "Chances & Cautions" propensity feature
(`app/calculations/propensities.py`, `app/services/propensity_service.py`,
flag `propensity_insights`, currently OFF and uncommitted). Written jointly from a
Thirukanitham-astrologer and product-owner standpoint.

**The question this doc answers:** a request came in to expand Vinaadi toward a
"world-class" 15–20 domain / 300–500 topic prediction ontology (personality,
education, career, wealth, love, marriage, children, health, family, property,
foreign, social status, legal, spiritual, timing). This doc is the considered
answer: *what to build, what to refuse, and in what order* — grounded in what the
engine already computes rather than a flat wishlist.

**How to read this doc.** Part 1 is the assessment (what the engine has today).
Part 2 is the reframe — why the target is a *completed 12-Bhava grid*, not a
topic count. Part 3 is the topic ontology itself (the reviewable grid an
astrologer signs off). Part 4 is the per-topic evidence recipe + authoring
schema. Part 5 is the phased roadmap. Part 6 is the safety system that lets it
scale. Part 7 is the review/validation process. **Nothing here ships on "does it
run" — per this repo's own precedent, domain calc bugs are silent
(`feedback_astrology_calc_accuracy`; Gowri table, Rikta tithi, Amirdhadhi
Yogam).**

**Astrologer sign-off is required on Parts 3, 4, and every per-topic signature
before its code merges.** Sections needing native-Tamil wording review are marked
🅃. Sections needing classical-technique sign-off are marked 🅹 (jyotishi).

---

## Part 1 — Assessment: the evidence layer is world-class, the reading layer is thin

### 1.1 What is already computed (the raw material)

| Capability | Module | Status |
|---|---|---|
| Full Shodasavarga (D2,D3,D4,D7,D9,D10,D12,D16,D20,D24,D27,D30,D40,D45,D60) | `app/calculations/divisional_charts.py` | ✅ complete |
| Ashtakavarga (BAV/SAV bindus) | `app/calculations/ashtakavarga.py` | ✅ audited 2026-07-02 |
| Vimshottari + Ashtottari + Yogini + Kalachakra dashas | `*_dasha.py` | ✅ built |
| Karaka chains (8 areas) | `app/calculations/karaka_chains.py` | ✅ |
| House-lords / functional nature / adhipathi report | `app/calculations/house_lords.py` | ✅ |
| Jaimini karakas (Atmakaraka…), Tajaka/Varshaphal | `jaimini_karakas.py`, `tajaka.py` | ✅ |
| Yogas + doshams detection | `yogas.py`, `_yoga_dosham.py` | ✅ |
| Gochara quality tables (Ezharai/Kandaka/Ashtama Sani, Guru peyarchi) | `transits.py`, `prediction_score.py` | ✅ |
| Reasoning kernel (ordinal bands, contradiction, promise-gate, timing-vote, chart-signature) | `app/reasoning/` | ✅ |

### 1.2 What is actually *read* for predictions today (~22 topics)

- **9 life-areas** (`life_areas_service.py`): Career, Money, Health, Relationships,
  Education, Spiritual, Family Harmony, Children, Property/Foreign/Litigation.
  Karaka-chain scored, dasha + gochara support, timing windows.
- **13 propensities** (`propensity_service.py`): love, relationship-strain,
  higher-education, dropout-watch, career-mode, government-job, job-disruption,
  child-timing, accident-care, emotional-load, loneliness, conviction,
  prudence/severe-loss.

### 1.3 The two structural gaps (this is where quality is being left on the table)

1. **The propensity engine reads only D9.** `PlanetView` carries `d9_rasi` and
   nothing else. It computes D7, D10, D24, D4, D12, D30, D20 — and reads none of
   them. A jyotishi predicting children reads the **7th house of the D7 (Saptamsa)**,
   not merely the 5th of the Rasi. Career → **D10 (Dasamsa)**. Education →
   **D24 (Chaturvimsamsa)**. Property/vehicles → **D4 (Chaturthamsa)**. This is
   the single largest quality lever in the codebase and it is unused.

2. **Timing is a boolean.** `Signals.window` is set on "is a relevant dasha lord
   active?" — a yes/no. The engine has Ashtakavarga bindus (the classical
   `sarvashtakavarga` transit gate) and four dasha systems. `PropensityResult`
   already carries empty `timing_window_start/end` date fields waiting to be
   filled. Real Thirukanitham timing triangulates **bhukti + gochara + AV bindus**.

**Verdict.** The machinery of a master astrologer is present and being driven like
a beginner counting houses. The right expansion completes the *reading*, not the
*evidence*.

---

## Part 2 — Reframe: the target is a completed 12-Bhava grid, not a topic count 🅹

Chasing "300–500 topics" is the wrong goal for three reasons:

- **It is not how Thirukanitham reasons.** Prediction = **Bhava-phala** (house
  significations) cross-verified against a fixed evidence recipe. The house is the
  organizing unit; topics are its significations.
- **Breadth without validation is a liability, not a feature** — especially the
  proposed "40 named diseases." Unvalidated fatalistic output is the exact failure
  mode this repo has been burned by.
- **Code is not the bottleneck.** In the propensity architecture a new topic ≈
  *1 `eval_*` function + 1 `_Spec` row + Tamil copy + 1 test*. The constraints are
  **astrologer validation** and **native-Tamil copy** — human review capacity, not
  developer time. Plan for review throughput, not line count.

**So the target is:** every one of the 12 Bhavas fully read for its principal
classical significations, each through one repeatable 6-source recipe (Part 4),
landing at **~65 curated, defensible topics** — not 500 shallow ones.

---

## Part 3 — The topic ontology (the reviewable grid) 🅹🅃

Each row is a candidate topic: its Bhava, principal karaka, the varga that refines
it, and current coverage. **Astrologer: strike, merge, or add rows before any code
is written.** Legend — 🟢 covered · 🟡 partial/shallow · 🔴 absent.

### Bhava 1 — Tanu (self, body, temperament)
| Topic | Karaka | Varga | Now |
|---|---|---|---|
| Constitutional vitality & resilience | Sun, Lagna lord | D1 | 🟡 |
| **Swabhava personality profile** (one synthesized card, not 40) | Lagna+Moon+Mercury | D1 | 🔴 |
| Longevity-watchfulness season (never a lifespan claim — D6) | Lagna lord, 8th | D8 | 🟡 |

### Bhava 2 — Dhana (accumulated wealth, family, speech, food)
| Topic | Karaka | Varga | Now |
|---|---|---|---|
| Savings & accumulation capacity | Jupiter, Venus | D2 (Hora) | 🟡 |
| Family-wealth / inheritance line | 2nd lord, Jupiter | D2 | 🔴 |
| Speech & persuasion strength (asset for sales/teaching) | Mercury, 2nd | D1 | 🔴 |

### Bhava 3 — Sahaja (courage, siblings, initiative, communication)
| Topic | Karaka | Varga | Now |
|---|---|---|---|
| Self-effort / entrepreneurial drive | Mars, 3rd lord | D3 (Drekkana) | 🟡 (career-mode) |
| Sibling bond & support | Mars, 3rd | D3 | 🔴 |
| Communication / writing / media aptitude | Mercury | D1 | 🔴 |

### Bhava 4 — Sukha (mother, home, property, vehicles, contentment)
| Topic | Karaka | Varga | Now |
|---|---|---|---|
| Home / land ownership chance | Mars, Moon, 4th lord | **D4** | 🟡 |
| Vehicle / conveyance comfort | Venus, 4th | D16 | 🔴 |
| Relationship with mother | Moon, 4th | D12 | 🔴 |
| Inner contentment / peace-of-mind season | Moon | D1 | 🟡 |

### Bhava 5 — Putra (children, intelligence, romance, speculation, mantra)
| Topic | Karaka | Varga | Now |
|---|---|---|---|
| Children — timing of | Jupiter, 5th lord | **D7** | 🟡 (D9-only) |
| Children — number/blessing tendency | Jupiter | **D7** | 🔴 |
| Intellect / analytical brilliance | Mercury, Jupiter | D24 | 🟡 (higher-ed) |
| Romance chance | Venus, 5th | D9 | 🟢 |
| Speculation / lottery **caution** (never "will win") | 5th, Rahu | D1 | 🔴 |
| Mantra / upasana affinity | Ketu, Jupiter | D20 | 🔴 |

### Bhava 6 — Ari (debts, disease-watch, litigation, competition, service) 🔴 near-empty
| Topic | Karaka | Varga | Now |
|---|---|---|---|
| Debt / loan-burden watch | 6th lord, Saturn | D6 | 🔴 |
| Litigation / dispute season & resolution lean | Mars, Saturn, 6th | D6 | 🔴 |
| Competitive-exam / rivalry edge | Mars, Saturn, 6th | D1 | 🟡 (govt-job) |
| Chronic-health watchfulness (season only, no diagnosis) | 6th, Saturn | D6/D30 | 🟡 |

### Bhava 7 — Kalatra (marriage, spouse, partnership, business, residence-abroad)
| Topic | Karaka | Varga | Now |
|---|---|---|---|
| Marriage — timing window | Venus, Jupiter, 7th lord | **D9** | 🟡 |
| Marriage — married-life harmony | Venus, 7th | D9 | 🟡 (strain only) |
| Spouse — nature / background tendencies | 7th lord, Venus | D9 | 🔴 |
| Business partnership fit | 7th, Mercury | D10 | 🔴 |
| Manglik/Chevvai dosham surfacing & cancellation | Mars, 7th | D9 | 🟡 (detected, not narrated here) |

### Bhava 8 — Ayur (longevity, inheritance, sudden change, occult, chronic)
| Topic | Karaka | Varga | Now |
|---|---|---|---|
| Prudence / severe-change season (D6-safe) | Saturn, 8th | D30 | 🟢 (severe-loss) |
| Inheritance / unearned gains lean | 8th lord, Jupiter | D2 | 🔴 |
| Occult / research / depth-work affinity | Saturn, Ketu, 8th | D20 | 🔴 |

### Bhava 9 — Bhagya (fortune, father, dharma, luck, guru, long travel)
| Topic | Karaka | Varga | Now |
|---|---|---|---|
| Overall fortune / bhagya strength | Jupiter, 9th lord | D9 | 🟡 |
| Relationship with father | Sun, 9th | D12 | 🔴 |
| Higher-study / research chance | Jupiter, Mercury | **D24** | 🟡 (D9-only) |
| Guru / mentor connection | Jupiter, Ketu, 9th | D20 | 🔴 |

### Bhava 10 — Karma (career, status, authority, government)
| Topic | Karaka | Varga | Now |
|---|---|---|---|
| Career direction (enterprise vs salaried) | Sun, Saturn, Mercury | **D10** | 🟢 |
| Government / authority-role chance | Sun, 10th lord | **D10** | 🟢 |
| Career-transition / job-disruption watch | 10th lord, Saturn | D10 | 🟢 |
| Professional reputation / recognition | Sun, 10th | D10 | 🔴 |
| Career-domain lean (tech/medicine/law/arts…) | 10th lord + karaka | D10 | 🔴 |

### Bhava 11 — Labha (gains, income, ambitions fulfilled, friends, elder siblings) 🔴 near-empty
| Topic | Karaka | Varga | Now |
|---|---|---|---|
| Income growth / multiple-stream lean | 11th lord, Jupiter | D2 | 🔴 |
| Fulfilment-of-desires season | 11th lord | D1 | 🔴 |
| Friends / network / powerful-mentor support | 11th, Jupiter | D1 | 🟡 (loneliness inverse) |

### Bhava 12 — Vyaya (expenditure, loss, foreign/settlement, moksha, isolation)
| Topic | Karaka | Varga | Now |
|---|---|---|---|
| Foreign travel / settlement chance | Rahu, 12th lord, Saturn | **D12** | 🟡 |
| Expenditure / outflow discipline watch | 12th lord, Saturn | D2 | 🔴 |
| Moksha / detachment / spiritual-retreat pull | Ketu, 12th | D20 | 🟡 (spiritual) |
| Isolation / withdrawal season | Moon, 12th | D1 | 🟡 (loneliness) |

### Cross-cutting: Timing layer (answers "when?")
Not new topics — a *timing enrichment* applied to every topic above via Part 4
step 6: major career window, marriage window, childbirth window, property window,
foreign window, financial-growth phase, health-caution phase. Sourced from
Vimshottari bhukti + gochara + Ashtakavarga bindus.

**Grid total after astrologer pruning: target ≈ 55–65 topics.**

---

## Part 4 — The evidence recipe & authoring schema 🅹

### 4.1 The Vinaadi Reading Recipe (mandatory per topic)

Every topic's `eval_*` function reads, in order:

1. **Bhava** — occupants + malefic/benefic aspects on the significator house.
2. **Bhava-lord** — placement house + dignity (exalt/own/debilitated/combust).
3. **Karaka** — strength & affliction of the natural significator planet(s).
4. **Domain varga** — the *same reading in the topic's varga* (children→D7,
   career→D10, education→D24, property→D4, marriage→D9, spirituality→D20). This is
   the Phase-1 upgrade that makes readings feel expert. Varga vote is
   *corroborating*: it can strengthen or soften, never flip a QUIET to STRONG alone.
5. **Dasha activation** — is the significator / house-lord running in
   maha/antar/(pratyantar)? Vimshottari primary; Ashtottari/Yogini as tie-breakers
   where classically indicated.
6. **Timing** — narrow the window from bhukti dates ∩ gochara quality ∩ SAV bindus
   in the transited house. Populate `timing_window_start/end`, not just prose.

This *is* the 5-evidence + confidence + timing structure the original request
called "world-class" — every source already exists.

### 4.2 Extend `_Spec` so a topic cannot be authored ad-hoc 🅹

```python
@dataclass(frozen=True, slots=True)
class _Spec:
    key: str
    category: PropensityCategory
    tier: PropensityTier            # CHANCE | CAUTION | (new) PROFILE
    title: BiText
    topic: BiText
    evaluator: object
    # NEW — mandatory classical provenance, enforced by lint test:
    primary_house: int              # the Bhava
    karakas: tuple[str, ...]        # significator planets
    domain_varga: str               # "D1".."D60" — which varga refines it
    age_min: int = 0
    age_max: int = 200
    disclaimer: BiText | None = None
    show_support_resources: bool = False
```

A topic with a sensitive tier and no disclaimer, or with an unknown varga, fails
`tests/test_propensity_authoring.py` at import — you cannot merge a malformed card.

### 4.3 New `PROFILE` tier for the Swabhava card

Personality is *not* 40 cards. One `eval_swabhava` synthesizes Lagna sign + Lagna
lord dignity + Moon sign/nakshatra + Mercury (intellect) into a temperament
profile with 4–6 `AstroFactor` traits. Cheap, safe, high perceived value. Framed
as tendencies with growth edges (the existing `eval_stubbornness` tone), never
fixed verdicts.

---

## Part 5 — Phased roadmap (impact × confidence × effort)

Sequenced so quality/validation compounds before breadth is added.

### Phase 0 — Land what exists (blocking prerequisite)
Get the 13 existing propensities through astrologer + native-Tamil review and
**commit them** (flag stays OFF until review passes). *Nothing else in this plan
starts until Phase 0 closes* — unvalidated health/loss topics are liability, not
inventory.
**Exit:** 13 topics reviewed, golden cases attached, committed.

### Phase 1 — Varga wiring ⭐ highest quality-per-effort
Teach `PlanetView`/`_Reader` to carry and read the domain varga. Upgrade the
*existing* children/career/education/property/fortune evaluators to read D7/D10/
D24/D4/D9. **No new topics — existing cards jump from beginner to jyotishi.**
**Files:** `propensities.py` (`_Reader` gains `varga_house(planet, "D7")`),
`propensity_service.py` (`build_chart_input` threads the vargas already on the
snapshot). **No API surface change** (internal enrichment).
**Validation:** 3 golden charts where D-chart flips the read (e.g. strong Rasi 5th
but afflicted D7 → children-timing softens). 🅹

> **Status — implemented 2026-07-12 (flag still OFF, not committed).**
> The domain vargas were *already* materialised on the read path
> (`_chart_response_from_record` recomputes the full set from `absolute_longitude`
> into `snapshot.data.vargas`, keyed `"D2".."D60"` → `{PLANET: rasi, …, "LAGNA": rasi}`),
> so no snapshot extension or recomputation was needed — `build_chart_input`
> simply threads `snapshot.data.vargas` onto a new `PropensityChartInput.vargas`
> field. **No API-surface change.**
>
> `_Reader` gained a `_VargaReader` (Whole-Sign, houses from the varga Lagna,
> sharing the extracted `_planet_aspects` graha-drishti so D1 and varga aspect
> rules can't drift) plus `varga_house()` and a single-factor `varga_domain_vote()`.
> Each upgraded evaluator emits **at most one** corroborating varga factor and is
> **gated on `s.has_signal`** — a varga can strengthen or soften a D1 read but can
> never manufacture one on a QUIET chart (doctrine D3).
>
> **What the varga reading changed, per evaluator:**
> - `eval_higher_education` → **D24** 5th + Jupiter/Mercury dignity: a promising
>   Rasi read (2 supports) reaches STRONG only when the Siddhamsa confirms it.
> - `eval_child_delay` → **D7** 5th + Jupiter: a delay flagged in the Rasi
>   deepens (WATCHFUL → EXTRA_CARE) on an afflicted Saptamsa, or eases
>   (WATCHFUL → STEADY) on a blessed one — the plan's worked example.
> - `eval_government_job` → **D10** 10th + Sun: office-strength read confirmed to
>   STRONG by the Dasamsa.
> - `eval_job_loss` → **D10** 10th + its own 10th-lord: a Sade-Sati work-watch
>   deepens when the career varga is itself unsettled.
> - `eval_career_mode` → **no varga vote (removed on astrologer review, below).**
>
> **Astrologer review pass (same day, acting-reviewer — a licensed human
> jyotishi's final sign-off is still the Part 7 gate):**
> 1. **Varga math verified, not assumed.** The D7/D10/D24 compute formulas were
>    hand-derived against the classical Parashari amsa rules (D7: odd→same sign,
>    even→7th; D10: odd→same, even→9th; D24: odd→Leo, even→Cancer) and found
>    correct — the risk was *unprotected*, not wrong. Locked in with hand-computed
>    golden-value tests in `tests/test_divisional_charts.py` (these three vargas
>    previously had dispatch coverage only). This closes the top silent-bug risk:
>    a confidently-wrong varga is worse than reading none.
> 2. **`career_mode` D10 vote removed.** The Dasamsa refines career *strength/
>    status*, not the enterprise-vs-salaried *direction* that card reads; mapping
>    D10 placements onto that axis is a modern heuristic, and a confident vote on
>    it would violate the QUIET-is-silence doctrine. D10 stays only where it is
>    classically sound (government_job, job_loss). Better to under-claim.
> 3. **Signature houses/karakas confirmed** for the four kept upgrades
>    (education D24-5th+Jup/Merc, children D7-5th+Jup, office D10-10th+Sun,
>    stability D10-10th+its-lord); the corroboration weight (≤1 gated factor)
>    holds the "strengthen/soften, never dominate" rule. **Tamil copy** for the
>    new factor strings reviewed for register and non-fatalistic tone (they also
>    run through the existing banned-mortality-language test via the sensitive
>    cards). **Vote thresholds** (house counts only if benefic-and-not-malefic;
>    karaka by dignity; net decides) reviewed and kept.
>
> **Residual (the one thing acting-review can't substitute):** a true end-to-end
> cross-check of 2–3 *real* natal charts against a second engine (Jagannatha
> Hora / printed panchangam) per Part 6.3. The amsa math is now verified
> deterministically (longitude→rasi) and the ephemeris (birth→longitude) is
> validated elsewhere, so the compound risk is low — but a human jyotishi should
> still eyeball a handful of full readings before the flag ever flips.
>
> **Validation delivered:** 5 golden flip-cases + 1 by-design invariance
> (career_mode ignores D10) + 1 doctrine (QUIET-preserved) case in
> `tests/test_propensity_service.py`; hand-computed D7/D10/D24 golden-value math
> tests in `tests/test_divisional_charts.py`. Full propensity + divisional suites
> green (43), `/charts/{id}/propensities` endpoint test green on the Docker test
> DB (real snapshot → real computed vargas), ruff clean.

### Phase 2 — Real timing
Replace boolean windows with `timing_window_start/end` from bhukti ∩ gochara ∩ SAV
bindus. Reuse `transits.py` + `ashtakavarga.py`. Surfaces the date fields already
in `PropensityResult` → **API contract touch: `app/api/predictions.py`,
`packages/shared/src/api/propensities.ts`, `web/…propensities-panel`, and check
`mobile/`** (per CLAUDE.md 4-surface rule).
**Validation:** windows must fall inside the correct maha/antar span on golden
charts; no window in a zero-bindu transit. 🅹

> **Status — implemented 2026-07-12 (flag still OFF, not committed).**
> Confirmed on the read path before coding: `calculate_vimshottari_timeline()`
> (`app/calculations/dasha.py`, already called in `_load_chart_context`) returns
> `current_antardasha` with real `start_date`/`end_date` — computed every request
> but previously discarded after collapsing it to `{maha_lord, antar_lord}` names.
> `compute_bhinnashtakavarga` + `compute_sarvashtakavarga`
> (`app/calculations/ashtakavarga.py`) were not wired into the propensity read
> path at all (life_areas_service.py computes its own separate copy for its own
> purposes). Gochara quality had no existing propensity-side primitive, so this
> reuses the module's own D1/varga aspect rule (`_planet_aspects`) against the
> transiting sky rather than importing life_areas_service's parallel Moon-based
> house-quality tables — one aspect rule for D1, varga, *and* transit, instead of
> a second, silently-divergent "gochara quality" definition.
>
> **Deliberate scope decision:** rather than searching for a *future* bhukti span,
> Phase 2 concretizes the **currently-running antardasha** — the same one already
> driving the boolean `window_note` — into real dates, gated by two more checks:
> the transiting karaka must contact the topic's house (gochara, via
> `_planet_aspects` reused against `transit_house_by_planet`), and the topic
> house's own rasi must carry at least one Sarvashtakavarga bindu right now
> (never a zero-bindu transit). Concrete dates only ever appear **alongside** an
> already-fired `window_note` — Phase 2 narrows, it never invents — so no new
> Tamil/English copy was needed. Searching forward for a future (not-yet-active)
> bhukti span is left as an explicit follow-up, not attempted here.
>
> **Eligibility, tier-symmetric:** a CHANCE card only narrows to dates when
> `pro > 0 and pro >= con` (STRONG/PROMISING, never LIMITED); a CAUTION card only
> narrows when `con > 0` (WATCHFUL/EXTRA_CARE, never STEADY/QUIET) — a caution
> card whose dasha nominally "touches" but which shows no actual risk factor
> never gets a "watch these dates" claim.
>
> **Files:** `app/calculations/propensities.py` (`PropensityChartInput` gains
> `transit_house_by_planet`, `sav_bindus`, `current_antardasha_start/end`;
> `_Reader.timing_window(house, karaka, as_of)` runs the three gates),
> `app/services/propensity_service.py` (`_TimingSpec` on 7 of the 13 registry
> rows — the ones that already had a `window_note`: love D5/VENUS,
> higher_education D9/JUPITER, government_job D10/SUN, job_disruption
> D10/SATURN, child_timing D5/JUPITER, accident_care D8/MARS — accident_care has
> no dedicated Part-3 row, 8th+Mars is the classical accident/injury pairing —
> resilience_watch D8/SATURN), `app/api/predictions.py` (`_load_chart_context`
> now also returns the `VimshottariTimeline`; `get_propensities` computes
> transit-house-from-Lagna per planet + Sarvashtakavarga bindus and threads them
> through; `PropensityCardOut` gains `timingWindowStart/End`).
> **4-surface sweep:** `packages/shared/src/api/propensities.ts` and
> `web/components/dashboard-propensities-panel-nova.tsx` updated together;
> `mobile/` has no propensities caller yet (checked, nothing to update).
>
> **Validation delivered:** 5 golden cases in `tests/test_propensity_service.py`
> — window lands inside the real bhukti span (clipped to not start before
> "today"); suppressed when the karaka's transit misses the house (gochara
> gate); suppressed at zero SAV bindus (zero-bindu gate); the same mechanism
> narrows a CAUTION-tier card (resilience_watch, con>0 eligibility); and absent
> entirely without a boolean window in hand. Endpoint contract test extended
> (`tests/test_predictions_api.py`) to assert `timingWindowStart/End` are always
> present keys (string-or-null) on the live `/propensities` response. Full
> propensity + divisional suites green (48 offline), predictions-API suite green
> (8) on the Docker test DB, ruff/tsc/eslint clean on all touched files.
>
> **Residual (carried, not blocking):** the Phase 0/1 human-jyotishi
> end-to-end cross-check (plan Part 6.3) still hasn't run; Phase 2's own
> gochara/SAV gates are new classical-technique surface that should be part of
> that same review pass before the flag ever flips. A future-bhukti search
> (beyond "currently running") is an open, explicitly-deferred follow-up.

### Phase 3 — Fill the dark houses (demand-ranked)
Add topics in this order (each = recipe + Tamil copy + golden case + review):
1. **Marriage suite** (Tamil astrology's #1 demand): spouse-nature,
   married-life-harmony, business-partnership — 7th + D9 + Venus/Jupiter.
2. **Foreign/settlement** (diaspora demand): 12th + Rahu + D12 + gochara.
3. **Wealth suite**: income-growth, savings, inheritance — 2nd/11th + D2 + Dhana
   yogas (already detected).
4. **Bhava-6 suite**: litigation season, debt-watch, competitive-edge.
5. **Swabhava PROFILE card** (§4.3).
**Adds ≈ 15 topics.**

> **Status — implemented 2026-07-12 (flag still OFF, gate jumped on explicit
> user instruction; Phase 0/1/2's own human-jyotishi review, Part 6.3, still
> has not run — see the note at the top of this Phase-3 status block and the
> "where things stand" note at the end of Part 5).**
>
> **Two technique gaps found and resolved conservatively — same "don't force
> an unavailable/awkward technique" call as the Phase-1 career_mode D10
> removal, better to under-claim than wire something silently wrong:**
> 1. **D9 (Navamsa) is not in `PropensityChartInput.vargas`.** Only D2-D60's
>    even/special divisions are (`app.services._chart_planets._VARGA_DIVISIONS
>    = (2,3,4,7,10,12,16,20,24,27,30,40,45,60)`); D9 is carried per-planet as
>    `PlanetView.d9_rasi` with no Lagna-relative house frame in this input. So
>    `marriage_harmony`/`business_partnership_fit` read D1 only (the latter
>    gets a **D10** vote instead — a genuinely available, classically-sound
>    substitute for the *business* half of Bhava 7, career-strength being
>    what D10 actually answers).
> 2. **D6 (Shashthamsa) is not computed anywhere in this codebase** — absent
>    from `_VARGA_DIVISIONS` entirely. Adding it is a separate divisional-chart
>    effort (new formula + hand-verified golden-value tests, the same rigor
>    Phase 1 spent on D7/D10/D24) — out of scope here. The Bhava-6 suite
>    (`litigation_season`, `debt_watch`, `competitive_edge`) is D1-only.
> 3. **D2 (Hora) is NOT a 12-house varga** — it's a binary Chandra/Surya split
>    (`app.calculations.divisional_charts.compute_d2`). Routing it through the
>    Phase-1 `varga_domain_vote` (which assumes a Lagna-relative 12-house
>    frame) would have silently misread every planet into "house 1 or 2" of a
>    varga with no real house system — exactly the kind of silent domain-calc
>    bug `feedback_astrology_calc_accuracy` warns about. Built a dedicated
>    `_Reader.hora_wealth_vote()` instead, implementing the actual classical
>    Hora rule (BPHS): benefics in Chandra Hora + malefics in Surya Hora
>    ("Ubhayachara") is auspicious for wealth, the reverse is not. Wired into
>    `income_growth`/`savings_capacity` (general wealth-flow topics); NOT into
>    `inheritance_lean` (8th-house inheritance channel is a different
>    classical question the Hora rule doesn't answer).
>
> **10 topics shipped** (not the full ~15 estimate — `spouse_nature` was
> folded into `marriage_harmony` rather than shipped as a near-duplicate 7th-
> house read; see `eval_marriage_harmony`'s docstring): `marriage_harmony`,
> `business_partnership_fit` (Cat.MARRIAGE — Bhava 7 covers both marriage and
> business partnership classically), `foreign_settlement` (Cat.LIFE_PATH),
> `income_growth`, `savings_capacity`, `inheritance_lean` (Cat.WEALTH),
> `litigation_season`, `debt_watch` (Cat.LIFE_PATH), `competitive_edge`
> (Cat.CAREER), `swabhava_profile` (new **PROFILE** tier — descriptive,
> never graded, always shown, never QUIET; Cat.WELLBEING). Three new
> `PropensityCategory` values added (`MARRIAGE`, `WEALTH`, `LIFE_PATH`).
>
> **Part 6 safety system — partially shipped, not the full §4.2 `_Spec`
> schema extension.** Added a cheap, high-value lint test instead
> (`test_every_caution_card_carries_a_disclaimer` in
> `tests/test_propensity_service.py`, asserts over the live `_REGISTRY`) —
> directly closes the liability risk Part 6 names without the larger
> `primary_house`/`karakas`/`domain_varga` field migration across all 23
> specs, which stayed out of scope for this pass.
>
> **4-surface sweep:** `packages/shared/src/api/propensities.ts` (3 new
> categories + PROFILE tier) and `web/components/dashboard-propensities-panel-nova.tsx`
> (category order/labels, PROFILE level chip) updated together; `mobile/` has
> no propensities caller yet (checked, nothing to update).
>
> **Validation:** 6 new golden cases in `tests/test_propensity_service.py` —
> the Hora vote lifting `income_growth` to STRONG and softening
> `savings_capacity` to MIXED, the D12 vote lifting `foreign_settlement` to
> STRONG (proving `varga_domain_vote` extends cleanly to a new topic, same
> pattern as D7/D10/D24), `swabhava_profile` always present and never QUIET
> (even on an empty chart), its factors reading Lagna/Moon/Mercury, and all
> three new categories appearing in a real bundle. Full suite: 28 propensity
> unit tests + 35 predictions-API/divisional-chart tests green on the
> `vinaadi_test` Docker DB (real chart snapshot, real computed vargas),
> ruff/tsc/eslint/vitest(102) all clean.
>
> **Residual (unchanged from Phase 0-2, now larger in scope):** the human-
> jyotishi + native-Tamil review (Part 6.3/Part 7) still has not run — Phase 3
> adds 10 more unreviewed signatures and Tamil strings on top of the 13 from
> Phase 0-2, all still gated behind `propensity_insights` (OFF). Nothing in
> this Phase-3 change has been committed either, per the same standing gate.

### Phase 4 — Complete the grid to ~65
Remaining 🔴/🟡 rows in Part 3, each through the recipe and review gate. Stop at
the pruned grid total — do **not** pad toward 300.

### Explicitly out of scope (refused as PO)
- ❌ **40 named-disease predictions** (diabetes/thyroid/kidney/heart…). Health stays
  *watchfulness season* only, enforced by the no-diagnosis lint. Medical liability.
- ❌ **40 personality micro-trait cards** → collapsed to one Swabhava profile.
- ❌ **"5,000–10,000 rules"** as a target — marketing math; ~65 recipe-driven topics
  encode the meaningful rule-set with far less silent-bug surface.
- ❌ Any topic asserting death, disease diagnosis, guaranteed windfall, or
  certainty. Bands + QUIET-is-silence doctrine (D2/D3/D6) is non-negotiable.

---

## Part 6 — The safety system that lets this scale 🅹🅃

Breadth multiplies risk surface. Ship these *before* Phase 3:

1. **Authoring schema** (§4.2) — provenance mandatory, malformed cards fail import.
2. **Tone/diagnosis lint** — extend the existing propensity test: assert no topic's
   Tamil or English copy contains death/diagnosis/certainty language, and every
   CAUTION topic has a disclaimer + (where relevant) support-resources block. This
   is what lets you add 40 topics without re-reviewing tone by hand each time.
3. **Golden-case gate** — per `feedback_astrology_calc_accuracy`: every topic needs
   2–3 hand-verified reference charts (cross-checked against a second source —
   Jagannatha Hora / printed panchangam) locked into `tests/`. **This is the true
   velocity constraint, not code.**
4. **QUIET honesty** — a topic with no signal returns QUIET, never a forced verdict.
   Guard against "confident-sounding filler" as breadth grows.

---

## Part 7 — Review & validation process (how sign-off actually works)

For each topic, in order, before its code merges:

1. **Astrologer (🅹):** approve the row in Part 3 (house/karaka/varga), then approve
   the signature logic (which combinations count as SUPPORT vs CAUTION, thresholds).
2. **Native-Tamil (🅃):** review both `BiText` strings for wording, register, and
   non-fatalistic tone. Existing precedent: `docs/tamil-review-daily-briefing.md`.
3. **Golden cases:** 2–3 charts hand-checked; locked into the propensity test suite.
4. **Contract sweep:** if a field reaches a response, update all four API surfaces
   in the same change (CLAUDE.md).
5. **Flag discipline:** everything ships behind `propensity_insights` (OFF) until
   the astrologer signs off the whole tranche for public exposure.

---

## Appendix — Effort/impact snapshot

| Phase | New topics | Primary lever | Effort | User-visible impact |
|---|---|---|---|---|
| 0 Land existing | 0 | validation | S | unblocks everything |
| 1 Varga wiring | 0 | **depth** | M | ⭐ high (feels expert) |
| 2 Real timing | 0 | **"when?"** | M | ⭐ high (pay-for feature) |
| 3 Dark houses | ~15 | breadth (demand) | L | high |
| 4 Complete grid | ~15–25 | breadth | L | medium |

**Recommended commit order: 0 → 1 → 2 before any of 3.** Thirteen varga-deep,
properly-timed, validated readings is a larger felt leap than 200 shallow new
cards — and de-risks the breadth work that follows.
