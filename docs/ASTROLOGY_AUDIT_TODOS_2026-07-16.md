# Astrology Audit TODOs — 2026-07-16

Actionable work items from [ASTROLOGY_FULL_CODE_AUDIT_2026-07-16.md](ASTROLOGY_FULL_CODE_AUDIT_2026-07-16.md)
(full line-by-line re-audit of every calc + reasoning module). Check items off here as they land;
keep the finding IDs (M-x / L-x / AR-x) in commit messages so the audit doc stays traceable.

**Status legend:** `[ ]` open · `[x]` done · `[~]` decided-won't-fix (record the ruling inline).

---

## Tier 1 — Medium findings (fix or explicitly rule)

- [x] **M-1 · Deeptadi avastha labels shifted one rung** — `app/calculations/chart_strength.py:199-213`
  - Bug: own sign (dignity 80) → MUDITA, friend (60) → SHANTA. Classical: own = **SWASTHA**, friend = **MUDITA**, benefic-varga/neutral = SHANTA. The Moolatrikona band (90) consumed the SWASTHA slot and pushed everything down.
  - Fix: remap — 100 → DEEPTA, 90+80 (MT + own) → SWASTHA, 60 (friend) → MUDITA, 50 (neutral) → SHANTA or DEENA per chosen source, 35 (enemy) → DUKHITA, 15 (debilitated) → KHALA. Keep the documented Vikala/Kopa omission.
  - Acceptance: a planet in own sign renders ஸ்வஸ்த / Swastha on the strength breakdown; golden test pins all 7 bands.
  - Done: remapped 90+80→SWASTHA, 60→MUDITA, 50→DEENA (SHANTA/benefic-varga has no input in this dignity-only scorer, documented); golden test in `tests/test_chart_strength.py` pins all 7 score bands.

- [x] **M-2 · Sivarathiri keyed on sunrise tithi, not nishita** — `app/calculations/festivals.py:321-327`
  - Bug: Maha Shivaratri is defined by Krishna Chaturdashi prevailing at **midnight (nishita)**; on the true vrata day the sunrise tithi is usually still Trayodashi, so the udaya-tithi rule labels the *following* civil day. Same error class as the fixed Pradhosham issue #10 — but this one is **undocumented**.
  - Fix: compute `nishita_tithi_number` (tithi at the local midnight after sunrise — generalize the `pradhosham_tithi_number` machinery in `panchangam.py`), persist it in the cache snapshot (bump `PANCHANGAM_CACHE_DATA_VERSION`), and key Sivarathiri on it. Fallback: at minimum document the one-day-late behaviour at the rule.
  - Acceptance: 2026 Maasi Sivarathiri matches a printed panchangam / the gazetted date; regression test locks it.
  - Done: added `nishita_tithi_number` (cache v34), Sivarathiri now keyed on it. Verified: new date (2026-02-15) matches the astrologer-curated `calendar_categories_2026.py` "Maha Sivarathiri" entry exactly; old sunrise-tithi rule landed a day late (02-16). Regression test in `tests/test_festivals.py`.

- [x] **M-3 · Node drishti drift in propensities** — `app/calculations/propensities.py:108-120`
  - Bug: `_planet_aspects` special-cases only Mars/Jupiter/Saturn; Rahu/Ketu get 7th-only, contradicting the canonical `aspects.py` (nodes 5/7/9) across all 40 propensity cards. `malefic_hits()` under-counts node aspects everywhere in the suite.
  - Fix (pick one, document either way):
    - (a) add `if planet in ("RAHU", "KETU") and diff in (4, 8): return True` to match `aspects.py`, or
    - (b) rule that the propensity layer deliberately excludes node special-aspects and say so in a comment where `_planet_aspects` is defined.
  - Acceptance: `propensities._planet_aspects` and `aspects.aspect_houses` agree for all 9 grahas (or the divergence is asserted + documented in a test).
  - Done: chose (a). Added parity test asserting `_planet_aspects` matches `aspects.aspect_houses` for all 9 grahas across all 12 house-counts.

- [x] **M-4 · Vipareetha Raja Yoga misses own-dusthana case** — `app/calculations/_yoga_detect.py:339-347`
  - Bug: `lord_house != house_num` excludes the 6th lord in the 6th, 8th-in-8th, 12th-in-12th — which are exactly the canonical Harsha / Sarala / Vimala yogas.
  - Fix: drop the `!=` exclusion (or gate own-house on strength if the stricter school is preferred) and name the school in a comment.
  - Acceptance: 6th-lord-in-6th chart detects VRY; test covers all three own-house cases.
  - Done: dropped the `!=` exclusion (inclusive school, documented in-code). Tests cover Harsha/Sarala/Vimala (all 3 own-house cases) plus the cross-dusthana and absent cases.

- [x] **M-5 · Activity-timing tithi fall-through grants SUPPORTS to unclassified tithis** — `app/calculations/activity_timing_rules.py:171-241`
  - Bug: the final `return` treats every tithi not in Rikta/Heavy/Ekadasi/Pournami as auspicious — so Prathama (1), 18, 25, 27, 28 read "favourable", contradicting the module's own docstring list (Prathama is classically avoided for beginnings).
  - Fix: make the AUSPICIOUS set explicit ({2,3,5,6,7,10,12,13,16,17,20,21,22}); route the remainder (1, 18, 25, 27, 28) to NEUTRAL with an honest reason string.
  - Acceptance: Prathama returns NEUTRAL for `business_start`; parametrized test covers every tithi 1–30 against the documented classification.
  - Done: explicit `_AUSPICIOUS_TITHIS` set added; fall-through now returns NEUTRAL. New `tests/test_activity_timing_rules.py` parametrizes all 30 tithis against the documented classification. AR-7 confirmation still owed (Tier 3, unchanged).

---

## Tier 2 — Low findings (batch by theme)

### Batch A — Dosham presentational correctness
- [x] **L-4 · Protective marker filed under "Triggered factors"** — `_yoga_dosham.py:380-385`: `d9_seventh_lord_strong` is appended to `conditions_met`; move to `cancellation_factors`. — Done.
- [x] **L-5 · Putra Sarpa never checks the 5th house itself** — `_yoga_dosham.py:961-975`: only tests malefics conjunct the 5th *lord* and nodes on Jupiter; add nodes/Saturn occupying house 5 (its own description promises this). Also fix `is_cancelled=bool(cancellation)` being True while `is_present` is False. — Done: both fixed.
- [x] **L-6 · Daridra yoga lists both trigger strings even when only one fired** — `_yoga_detect.py:670`: build `conditions_met` from the actual conditions. — Done.

### Batch B — Yoga completeness
- [x] **L-2 · Parivartana MAHA set omits 2 and 11** — `_yoga_detect.py:364`: classical Maha-parivartana includes dhana-house lords {1,2,4,5,7,9,10,11}; a 2↔11 exchange currently grades KAHALA/WEAK. — Done: MAHA houses now `{1,2,4,5,7,9,10,11}`.
- [x] **L-3 · Raja-yoga link is one-directional** — `_yoga_detect.py:119`: only trikona-lord→kendra-lord aspect is checked; a kendra lord's special aspect (Mars/Jup/Sat) onto the trikona lord is missed. Add the reverse check. — Done: reverse aspect check added.
- [x] **L-7 · Kala Sarpa is rasi-granular** — `_yoga_dosham.py:637`: a planet in the same sign as a node but past its degree still counts inside the arc; degree-exact test not modeled. Minimum: document the simplification in the docstring; better: use longitudes when available. — Done (minimum bar): docstring documents the simplification and links AR-3; no behavior change pending astrologer ruling.

### Batch C — Dead code / edge cases
- [x] **L-1 · Amirdhadhi "next" preview uses today's weekday row** — `panchangam.py:1616`: when the nakshatra boundary lands after midnight the next-name should use the next vara's row. Cosmetic preview field. — Done: uses `nakshatra_ends_at`'s own weekday when it falls on a different calendar day.
- [x] **L-11 · Dead parameter** — `panchangam.py:980`: `_compute_subha_muhurtham_strict` accepts `abhijit_restricted` and never reads it. Use it or drop it. — Done: dropped (all call sites + tests updated).
- [x] **L-12 · Dead clause in eclipse detection** — `birth_conditions.py:188`: `angular_distance(elongation, 180.0) <= 0.0` is only true at exactly 180°; the `>= 180-orb` clause does all the work. Simplify. — Done: removed.

### Batch D — Dasha / prasna edges
- [x] **L-8 · Chara Dasha returns None after one 12-sign cycle** — `jaimini_dasha.py:227-239`: total Chara years can be less than a native's age, so older users get no running period. Generate 2+ cycles like every other dasha module (document the cycle-repetition convention chosen). — Done: 3 repeated cycles (matches `ashtottari_dasha.py`'s `_MAHADASHA_CYCLES` convention), documented in-code.
- [x] **L-15 · Prasna internal contradiction on house 10** — `prasna.py:135`: karaka in 10 lands in the kendra/trikona positive set *and* the DELAY set. Pick one: DELAY = {3,6,11} (drop 10) or remove 10 from the positive set. Name the school. — Done: DELAY = `{3,6,11}` (matches the module's own existing kendra-vs-upachaya split).

### Batch E — Festivals
- [x] **L-13 · Skanda Sashti unnamed** — `festivals.py:306`: every Shukla Sashti is generic "Sashti"; the Aippasi occurrence should be named "Skanda Sashti" (Tamil users search for it). — Done.
- [x] **L-14 · Karthigai Deepam over-constrained** — `festivals.py:354-357`: requires pournami-dominant civil day AND Krittika AND Karthigai month; classically nakshatra-anchored (Krittika day of Karthigai month) with full-moon proximity descriptive. In kshaya years the deepam silently vanishes (the test suite's known gap has this root cause). Re-anchor on nakshatra, keep pournami as tiebreak. — Done: re-anchored on nakshatra+month alone; pournami AND-gate removed (documented residual edge case: a Krittika span covering 2 sunrises labels both days — no cross-day state available to disambiguate further).

### Batch F — Perf / hygiene (no behaviour change)
- [x] **L-16 · Memoize `sun_longitude_at_jd`** — `ephemeris.py:310`: computes a full 9-body snapshot per call and gets bisected ~64× per sankranti search; Saturn's finder has `lru_cache`, the Sun's doesn't. — Done: `@lru_cache(maxsize=256)` added.
- [x] **L-17 · Proleptic-Gregorian JD note** — `astro.py`: Gregorian correction applied unconditionally (pre-1582 dates would be proleptic). No action needed for birth charts; add a one-line comment. — Done.

---

## Tier 3 — Astrologer-session agenda (AR = astrologer review; do NOT change code first)

Per [[feedback_astrologer_provides_reference_tables_directly]]: frame each as an open request for the
authoritative rule/table, not multiple-choice.

- [ ] **AR-1 · D60 direction for even signs** — `divisional_charts.py:220` counts backward for even signs (spec §3.13); BPHS common reading / JHora default counts forward for all. Which does the tradition we follow use? (Display-only today.)
- [ ] **AR-2 · Jagradadi formulation** — `chart_strength.py:168-187` uses degree-thirds (cited source); the more common classical rule is dignity-based (own/exalted = Jagrat, friend/neutral = Swapna, enemy/debilitated = Sushupti). Confirm which to display.
- [ ] **AR-3 · Degree-exact Kala Sarpa** — should the arc test use exact node degrees (stricter classical test) or stay rasi-granular? (Ties to L-7.)
- [ ] **AR-4 · Chara Dasha reference cross-check** — WI-10 note stands: implementation matches published worked examples but has not been checked against JHora/reference software on a live chart. Need one verified chart's full Chara sequence.
- [ ] **AR-5 · WI-07 printed-panchangam sunrise validation** — still the doctrine launch gate: cross-check computed Hindu sunrise + derived fields (Rahu kalam etc.) against 2-3 printed panchangam dates before closing Doctrine §1.
- [ ] **AR-6 · Moon Moolatrikona start** — 4° (current) vs 3° (BPHS) Taurus. Standing item; affects dignity band at 3°–4° Taurus only.
- [ ] **AR-7 · Prathama classification confirmation** — before/with M-5: confirm Prathama and tithis 18/25/27/28 should read NEUTRAL (not favourable) for beginnings in the tradition we follow.

---

## Standing conventions ledger (correct as shipped — no action, keep visible)

Mean node (Doctrine §2) · 365.25-day dasha year · Abhijit fixed ±24 min · Nalla Neram fixed clock tables ·
Mercury-from-Lagna BAV per Phala Deepika · Dinam 12-count Tamil variant · Mahendra direction (symmetric-set
proof) · Stree Dirgha ≥8 lenient · Rasi kuta 6/8-only · Ashtottari Raman-vs-Santhanam fork ·
Kalachakra Portion-Zero continuation · Tajaka same-rasi ±5° simplification (display-only, WI-18 fence) ·
Jeevan/Nethiram confirmed-by-review provenance caveat · Shadbala floor omissions (experimental gate) ·
Whole-sign primary / equal-bhava secondary (Doctrine §6) · Kuja dosham set {1,2,4,7,8,12} (A-5) ·
Dagda Rasi tithi-keyed Zero-Rasi table (EC-2) · Nadi parihara mode flag (A-9 v2).

---

## Suggested landing order

1. **M-2** (Sivarathiri) — user-visible festival date; cache version bump; printed-panchangam check. **DONE 2026-07-16.**
2. **M-1** (Deeptadi) — one-table remap + golden test. **DONE 2026-07-16.**
3. **M-5** (+ AR-7 confirmation) — explicit tithi set. **DONE 2026-07-16** (code); AR-7 confirmation still owed.
4. **M-3** — one-line table fix or one-line documentation; decide first. **DONE 2026-07-16** (chose the fix, option (a)).
5. **M-4** — school decision, then one-line fix. **DONE 2026-07-16** (chose the inclusive/own-house-counts school).
6. Batches A–E as small themed commits; Batch F opportunistic. **ALL DONE 2026-07-16** (Batches A-F, i.e. every Tier 2 item).
7. AR-1..AR-7 queued for the next live astrologer session. **Still open — no code changes made, per policy.**

---

**2026-07-16 session summary:** All Tier 1 (M-1..M-5) and Tier 2 (L-1..L-8, L-11..L-17) items closed in
this session, each with regression tests (new or updated) and a passing full backend test-suite run
(pytest, real Postgres test DB). Not yet committed. Tier 3 (AR-1..AR-7) untouched by design — those need
an astrologer's reference tables/rulings, not code changes.
