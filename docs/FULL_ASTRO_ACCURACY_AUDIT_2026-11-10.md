# Vinaadi — Astrology Accuracy Audit: Engine Review, Findings and Implementation Specification (rev. 2.2, 2026-11-11)

*Audit date 2026-11-10. Formerly titled "Full Astrology Accuracy Audit"; renamed because it
is not a whole-codebase line audit. File path unchanged so existing references hold.*

Audit of the calculation engines, yogam/dosham rules, scores, precautions and cross-surface
contracts in Vinaadi, read as (a) a Tamil Thirukanitham astrologer, (b) a product owner,
(c) a full-stack engineer. Branch `feat/tamil-voice-v4`, uncommitted tree as of 10 Nov 2026.
**Not a whole-codebase line audit:** the narrative/prediction services were sampled (§0, §9),
and no classical table has yet been checked against a printed page (§1).

**Status of this document:** accepted as the **working audit and implementation
specification**, not as astrological sign-off. Group B/C items still need their ruling or
source; §9 and §13 are owed before any "astrologically audited" claim.

**Rev. 2** folds in a second review of rev. 1 (ChatGPT, 2026-11-10, pasted by the owner).
That review is also an AI reading from memory and cites no printed page, so it is not an
astrologer sign-off either. Where it improved a fix, the fix below is rewritten; where it
misread the code or an existing ruling, the item says so (§10 lists both).

Builds on: `FULL_SYSTEM_AUDIT_2026-10-21.md`, `FULL_CODEBASE_AUDIT_2026-10-22.md`,
`ASTROLOGER_PRODUCT_TEST_AUDIT_2026-10-29.md`, `ASTROLOGER_MASTER_SHEET_2026-11-10.md`.
Festivals/observances and the 27 nakshatra dasa-prose pages were covered by those and are
not re-audited.

### How to read an item

Status: `[ ]` open · `[~]` partly done / held · `[x]` done.

**Class** (what kind of finding it is; not all findings are equally authoritative):

| Class | Meaning |
|---|---|
| `CALC` | Confirmed calculation error: the arithmetic is wrong against a rule nobody disputes |
| `PARITY` | Confirmed cross-surface inconsistency: two surfaces give two answers for one fact |
| `DEFECT` | Confirmed software defect (crash, dead code, wrong field, hard-coded value) |
| `COPY` | Reader-facing copy that misstates what the engine does |
| `DOCTRINE` | Traditional interpretation that varies by lineage; needs an owner/astrologer ruling |
| `SOURCE` | Needs the printed reference page before anything changes |
| `GAP` | Missing astrology capability |

**Action group** (what may happen next):

| Group | Rule |
|---|---|
| **A — fix now** | Engineering fix + tests; no doctrine changes |
| **B — after ruling** | Write the question in a decision doc (question, references, competing readings, recommended policy); build only after the owner rules |
| **C — after source** | Obtain the printed page(s); compare the *whole* table, never one row; do not mix lineages |
| **D — build** | New capability; spec first |

Items already ruled in `docs/DOCTRINE_DECISIONS_V1.md` (or an EC-RULING) are **not**
re-opened here. Where a ruling exists but a *consumer* contradicts it, the contradiction is
the finding, not the ruling. Claude does not decide a lineage question on its own, and no
rule here is called "universal" where traditions differ.

---

## 0. Scope and method

Read line-by-line (not sampled): `app/calculations/*` — porutham, dosha_samyam, dasa_sandhi,
compatibility_intelligence, astro, ephemeris, transits, tara_bala, sade_sati, d9_chart,
divisional_charts, equal_bhava, chart_strength, shadbala, ashtakavarga, bav_derived, aspects,
neecha_bhanga, _yoga_helpers, _yoga_detect, _yoga_dosham, yogas, yoga_rules (head),
yoga_activation, yoga_effects (head), dasha, yogini/ashtottari/kalachakra/conditional dashas,
panchangam, tamil_calendar, karinaal, lunar_month (head), day_quality, gochara_scores,
gochara_grade, house_lords, functional_nature, lagna_lord_strength, nakshatra_analysis,
nakshatra_lord_dynamics, birth_conditions, planet_conditions, maturation, progeny_checks,
muhurta_engine, activity_timing_rules (head), propensities (head), bhava_palan, remedies,
family_harmony_remedies (head), event_windows, prediction_score, double_transit, tajaka,
prasna, jaimini_karakas, numerology, numerology_compatibility (head).
Services: marriage, synastry, _chart_build, _chart_planets, _dg_scoring, _dg_hora,
_dg_peyarchi (head), personal_palan, transit, rectification, muhurtham_naal, karaka_chains,
age_gate/age_phase, primary_concern (mapping), emotional_weather, annual_wrapped.
Data: marriage_muhurta_rules, durmuhurtham_rules, muhurtham_naals, tamil_calendar_authority.
Clients: packages/shared doshamReckoning, nakshatraLord, transits (gocharaGrade); web
chart-utils, lunar, kalam-live, natchathiram-data (attribute fields), PoruthamTool (tables),
compatibility-intelligence-panel (maxima), marketing-i18n dosham/learn/tool pages; mobile
jadhagam tool and jadhagam/[id].

Sampled only (copy-heavy narrative, not line-audited): one_minute_reading_service (5,057
lines), five_minute_reading_service, life_areas_service, daily_guidance_service,
muhurta_service, the 27 natchathiram visual pages, muhurta_activity_registry and the
Kalaprakasika rule data. §9 turns that gap into its own audit.

**Limitation.** Classical tables were checked against the standard references (BPHS /
Phaladeepika / Muhurta Chintamani / B.V. Raman) **from memory, not against a printed
page**. §1 lists what matched so the owner knows what was compared; a `SOURCE` item means
memory is not good enough for that change.

Three standards of quality apply, and this audit mainly covers the first two:

1. **Mathematical** — positions, houses, vargas, panchangam arithmetic.
2. **Astrological** — the traditional rule is applied as the chosen lineage states it.
3. **Interpretational** — the sentence a reader sees actually follows from the chart.
   Covered only by sampling here; §9 is owed before anyone calls Vinaadi "astrologically
   audited".

---

## 1. Reviewed and found consistent with the selected rules (no immediate action)

"Consistent" here is **not** "verified against a classical source". Each check below has
one of four levels:

| Level | Meaning |
|---|---|
| **M — mathematically checked** | Arithmetic/derivation read line-by-line against a formula nobody disputes |
| **D — matches Vinaadi doctrine** | Agrees with a ruling in `DOCTRINE_DECISIONS_V1.md` / an EC-RULING, or with the server (client mirrors) |
| **P — printed source** | Compared against a printed page. **No item is at this level yet.** |
| **R — recollection only** | Agrees with the reviewer's memory of BPHS / Phaladeepika / Muhurta Chintamani / Raman. Not source-verified; treat as unconfirmed until P |

| Bullet below | Level |
|---|---|
| Porutham tables, Dignity, Shadbala tables, Gochara tables, Dagda/Jaimini/Tajaka/Pushkara/MKS/badhaka, Remedy catalogue, Marriage-muhurta data | R |
| Divisional-chart start-sign rules | R (rule) · M (arithmetic) |
| Ashtakavarga | R (rows) · M (337 total) |
| Panchangam | M (tithi/nakshatra/yoga/karana arithmetic, Gowri/hora derivation) · R (name sequences, slot tables, ashubha/Rikta sets) |
| Maandhi | D (Maandhi ruling 2026-09-29) · M (span logic) |
| Vimshottari, Yogini, Kalachakra sums, conditional dashas | M · Ashtottari fork D |
| Client mirrors | D (match the server) |
| Chart assembly | M |

Promoting any R item to P needs the page cited beside it.

- Porutham: Gana (27), Yoni (27 + 7 hostile pairs), Nadi cycle, Rajju 5-group cycle, Vedha
  pairs incl. the Mrigashira/Chitra/Dhanishta triad, Mahendra count set, Graha-maitri
  (49 pairs, Parashari), Vasya table except the Simha row (FAA-03).
- Dignity: exaltation/debilitation/own/moolatrikona zones; natural friendship incl. the
  node rows (symmetric); compound relationship ladder.
- Divisional charts: all 15 vargas (D2…D60) follow the Parashari start-sign rules; D30 odd
  and even segments correct; D60 forward for both parities.
- Shadbala: deep exaltation points, saptavargaja points, oja-yugma, kendradi, drekkana,
  dig bala directions, paksha (Moon doubled), tribhaga, vara, ayana (Sun doubled),
  naisargika, required-rupa table.
- Ashtakavarga: all 56 BAV rows, totals 48/49/39/54/56/52/39 = 337.
- Gochara: favourable houses for all nine grahas; Vedha table incl. Sun–Saturn and
  Moon–Mercury exemptions; combustion orbs; gandanta spans; Sade Sati phases and the
  ingress-Moon murthi table; Kandaka limbs; Ardhashtama/Ashtama.
- Panchangam: tithi/nakshatra/yoga/karana arithmetic and name sequences (incl. Kimstughna,
  Shakuni, Chatushpada, Naga), Rahu/Yamagandam/Kuligai day slots, night Gulika slots, Gowri
  day/night derivation, hora lord sequence, Abhijit = 8th of 15, Durmuhurtham indices,
  Soolam directions, Rikta/Ashtami sets, the nine ashubha yogas, seven-class star table.
- Maandhi day/night nazhigai constants; vaara-bounded span logic.
- Vimshottari (years, sequence, balance, sub-period reconstruction); Yogini; Ashtottari
  years (fork disclosed); Kalachakra tables sum to paramayus; all seven conditional dashas'
  years/anchors.
- Dagda-rasi (tithi-keyed) table; eclipse-birth logic shape; Jaimini 8-karaka with Rahu
  reversed; Tajaka muntha; Pushkara navamsa and bhaga tables; MKS houses; badhaka houses.
- Remedy catalogue: nine temples, beej mantras, japa counts, daanam items, gemstones,
  metals, fingers; BPHS graha colours and directions.
- Marriage-muhurta data: 7 best tithis, lagna best/avoid, Jupiter adverse houses,
  no-wedding months, Tue/Sat avoidance.
- Client mirrors: shared nakshatra lord derivation, SIGN_LORD, gochara grade (incl. Rahu
  10th = MIXED), CI panel maxima 35/20/15/15/10/5, web PoruthamTool gana/rajju tables, web
  dignity tables, nakshatra pages' lord/gana/rasi-span for all 27 stars, lunar phase glyph.
- Chart assembly: Lahiri set before every ascendant call; cazimi/combust exclusivity;
  Maandhi re-derived on read; birth limbs read at the birth instant; vaara before sunrise.

---

## 2. P0 — wrong output reaching a reader today

### FAA-01 `[ ]` Mobile Navamsa (D9) lagna is one sign off for fixed and dual lagnas
**Class** `CALC` · **Group A**
- **Where:** `mobile/app/(tabs)/tools/jadhagam.tsx:36-44`, `mobile/app/jadhagam/[id].tsx:41-49`
  (`navamsaRasiFromDegree`).
- **Problem:** fixed signs start the navamsa count at `sign + 7` (the 8th sign) and dual
  signs at `sign + 3` (the 4th). Parashara: movable from the same sign, fixed from the
  **9th**, dual from the **5th** (`app/calculations/astro.py::navamsa_rasi_from_degree`:
  `+8` and `+4`). Example: Rishabam lagna at 0° → server D9 lagna Makaram (10); mobile
  says Dhanusu (9).
- **Why it matters:** the D9 wheel on mobile puts the Lagna in the wrong house for 8 of 12
  lagnas, so every Navamsa house count (7th for marriage, D9 dignity, spouse reading) is
  shifted, while the planets (from `chart.vargas.D9` / `d9Rasi`) are right. Web already
  deprecated its client copy for this reason (`web/lib/chart-utils.ts::computeD9LagnaRasi`).
- **Fix:** delete both helpers; read `chart.lagna.d9Rasi` (already on the contract). The
  backend is the only place D9 is computed.
- **Acceptance:** mobile parity test against `packages/shared` or a pinned fixture
  (Mesham 0° → 1, Rishabam 0° → 10, Mithunam 0° → 7, Kadagam 0° → 4); it fails on the
  current code for signs 2,3,5,6,8,9,11,12.

### FAA-02 `[ ]` Birth-time rectification scores are astrologically meaningless
**Class** `DEFECT` — logic defect (current algorithm: no formula is wrong; it compares the
wrong things and never reads the event date) + `GAP` (replacement method) · **Group A** to
withdraw, **Group D** to replace
- **Where:** `app/services/rectification_service.py:42-60, 101-108` (`_lagna_supports_event`,
  `_score_candidates`).
- **Problem:** a candidate scores a point when its **lagna rasi number** (1–12) is in the
  event's **house-number** list (`MARRIAGE: [7, 2]`). A Thulam (7) or Rishabam (2) lagna
  "supports" every marriage regardless of the chart; the event **dates are never read**.
  The sibling `validate_chart_against_events` (line 240+) at least reads dasha lords at the
  event date.
- **Why it matters:** the tool recommends a time and writes it back
  (`apply_rectified_time` → whole chart recalculated). A wrong lagna then feeds every
  reading. For birth-time-unknown users it is the only path offered.
- **Fix, step 1 (Group A, now):** stop recommending or writing back a time from this
  score. Hide `apply_rectified_time` behind a flag; keep event capture.
- **Fix, step 2 (Group D, spec first):** a dasha-lord match supports an event; it cannot
  prove a birth time. A replacement must, per 30-min (then finer) candidate:
  1. build the candidate's chart;
  2. per event, test the event's bhava and its lord (7th for marriage, 5th for a child,
     10th for career, 4th for property…) together with the Lagna lord;
  3. test the running Mahadasha/Bhukti (and Antara where resolution allows) for a link to
     that bhava/lord;
  4. test the relevant varga (D9 marriage, D7 children, D10 career);
  5. test the slow transits at the event date (Guru, Sani; double-transit where built);
  6. require **several independent events**; a single event never moves the
     recommendation;
  7. weight each event by the **reliability of its date** (exact date / month only / year
     only / reader unsure), captured with the event; an approximate date cannot carry a
     dasha- or transit-level test;
  8. report a **confidence range** and a ±window, and **decline to recommend** when the
     evidence is insufficient (too few events, low-reliability dates, or candidates that
     score within noise of each other).
  Safeguard: dasha agreement and transit agreement **cannot independently establish** the
  birth time. The top-scoring candidate is presented as "most consistent with the events
  you gave", never as the objectively correct birth time, and is never written back to
  the chart without the reader's explicit confirmation.
- **Acceptance:** on a synthetic chart with three known exact-dated events, the true lagna
  window ranks first; shuffling event dates changes the ranking (today it does not); with
  one event, or three year-only events, the tool declines to recommend; no copy string
  calls a candidate "your correct birth time".

### FAA-03 `[ ]` Vasya: Simha row overrides its own cited source on an unverified premise
**Class** `SOURCE` · **Group C**
- **Where:** `app/calculations/porutham.py::_VASYA` (row 5 and the comment above it).
- **Problem:** the comment says Jothidam p.69 prints **Simha → Makara** and dismisses it as
  an OCR defect because it "contradicts every standard table". From memory, Raman /
  Muhurta Chintamani also give Makara and Thula is a web-table variant — but that is
  memory, not a page. Today Simha–Makara couples fail Vasya and Simha–Thula pass.
- **Why it matters:** the engine's own citation says the opposite of what the code does,
  and the deviation rests on a factual claim nobody checked.
- **Fix:** photograph Jothidam p.69 and one more printed Tamil table; compare **all twelve
  rows**, not row 5 alone. Adopt one lineage's complete table; never splice rows. Rewrite
  the comment to name the source and drop "every standard table".
- **Acceptance:** `_VASYA` equals the chosen source's full table, cited by page; test
  pins row 5 in the ruled direction.

### FAA-04 `[ ]` Public pages still carry the excised Rajju lifespan framing and call Nadi a dealbreaker
**Class** `COPY` · **Group A**
- **Where:** `web/app/(marketing)/learn/what-is-porutham/page.tsx:66` ("associated with
  longevity concerns for the spouse"); `web/app/(marketing)/tools/marriage-porutham-calculator/PoruthamPageContent.tsx:20`
  ("marital stability and longevity"); `web/lib/marketing-i18n/tool-porutham.ts:22-23`
  (Mahendra "longevity", Sthree Deergham "wife's … longevity");
  `web/lib/marketing-i18n/dosham-kalathra.ts:53` ("partner's longevity");
  `web/lib/marketing-i18n/learn-porutham.ts:25,37` (Nadi is a "dealbreaker"; "7 or more
  out of 10 … excluding Rajju and Nadi").
- **Problem:** EC-RULING-06 (P0, 2026-08-17) excised spouse-loss/longevity framing from the
  engine and `tests/test_tone_compliance.py` sweeps `app/`; the public tree was never swept.
  The engine counts Rajju as **one of the ten** and treats Nadi as a separate disclosure
  with cancellation modes, never a veto.
- **Fix:** rewrite in the advisory voice, no outcome claims. Suggested framing:
  Rajju — முக்கியமான திருமணப் பொருத்தம்; Nadi — தனியாகக் கவனிக்க வேண்டிய பொருத்தம்,
  with its cancellation modes named where they apply. State the engine's actual rule (ten
  kutas incl. Rajju; Nadi reported separately). Do **not** reintroduce "longevity" even as
  "traditionally associated with" — that is the framing the ruling removed. Extend the
  tone sweep to `web/lib/marketing-i18n` and `web/app/(marketing)`.
- **Acceptance:** tone sweep over web passes (run once with one banned string restored and
  confirm it fails); learn page and engine summary agree on what "7/10" and Nadi mean;
  Tamil strings reviewed.

### FAA-05 `[ ]` Public Sevvai and Naga pages state formation/cancellation rules the engine's rulings reject
**Class** `COPY` (pages vs ruled engine) · **Group A** for the parity fix; any change to the
rulings themselves is **Group B**
- **Where:** `web/lib/marketing-i18n/dosham-sevvai.ts:80-88, 100-102, 125`;
  `web/lib/marketing-i18n/dosham-naga.ts:19, 101`.
- **Problem (Sevvai):** the page says own sign/exaltation is a "partial cancellation",
  Guru's aspect a "strong cancellation", Mars as 7th/2nd lord "softens", debilitated Mars
  "milder". The engine's **existing rulings** (§8, O-18, B1b) say: two cancellations only
  (comparable samyam; Katakam debility **with** neechabhanga); own sign, exaltation and
  Guru's aspect **reduce**, never cancel; debility is a modifier with no numeric weight;
  no 7th/2nd-lord rule.
- **Problem (Naga):** the page says a node with the 5th lord, or afflicting Jupiter,
  *declares* the dosham and Jupiter in/aspecting the 5th "cancels". Ruling (§18 Q7-9, B1):
  only a node **in the 5th** declares; other legs are a watch-note; protections lower one
  grade and never cancel.
- **What this item is not:** it does not propose new doctrine. These rulings are on
  record; the finding is that public copy contradicts them. Other Tamil traditions do
  treat own-sign/exalted Mars, friendly signs, Guru's association and placement-specific
  exceptions as cancellations, and other placements as Naga dosham — so those are real
  lineage alternatives, not errors.
- **Fix:** rewrite both pages from the engine's rule text (`_build_dosham_explanations`
  what/why strings are the source of truth), keeping **formation / modification /
  cancellation** as three separate statements (as DD-17 already does in the engine). Add
  one disclosure line per page: "Some traditions treat X as a cancellation; Vinaadi
  treats it as a reduction." If the owner wants to revisit a ruling, that goes to the
  decision doc (Group B), not into this fix.
- **Acceptance:** a reader can apply the page's rule to their chart and get the card's
  present/reduced/cancelled verdict; a parity gate greps the copy for banned claims
  ("cancel" beside own-sign/exaltation/Guru for Sevvai; "declares" for a 5th-lord leg),
  run once with one claim restored to confirm it fails.

---

## 3. P1 — contradictions between surfaces (same fact, two answers)

### FAA-06 `[ ]` Janma tara is a penalty in Today and a bonus in the muhurta picker
**Class** `PARITY` + `DOCTRINE` · **Group B**
- **Where:** `app/services/_dg_scoring.py::TARA_DELTA` (Janma = **−20**);
  `app/calculations/tara_bala.py::TARA_SCORE` (Janma = **+8**) read by
  `muhurta_engine._tara_bala_factor` and `muhurtham_naal_service`.
  `muhurta_engine.TARA_GENERAL_CAUTION = {1,3,5,7}` calls Janma a caution while the same
  module scores it up.
- **Why:** on the reader's own-star day Today drops and the date picker rises. Doctrine
  A-11 allowed two magnitudes, not two signs. The standard Tara Bala classification lists
  Janma among the unfavourable taras, so the +8 needs a stated justification.
- **Fix:** ruling on Janma tara polarity (and whether it varies by activity); both tables
  then carry the same sign and the display word matches the score direction.
- **Acceptance:** parity test `sign(TARA_DELTA[k]) == sign(TARA_SCORE[k])` for k in 1..9.

### FAA-07 `[ ]` Inauspicious nitya yoga and Vishti karana block the badge but score zero in the picker
**Class** `PARITY` · **Group B** (weights and activity exceptions), engineering then Group A
- **Where:** `muhurta_engine._almanac_yoga_factor` (zero, "not sourced yet") vs
  `panchangam.ASHUBHA_YOGAS` (AAU-15: "the one table" for the strict badge and daily
  caution) and `_dg_scoring._yoga_penalty` (−10), `_karana_penalty` (Vishti −10). The
  picker penalises Vishti only when an activity's chapter lists it.
- **Why:** the picker can rank a Vyatipata/Vaidhriti day or a Vishti stretch top while the
  calendar badge and Today say caution.
- **Fix:** an L1 `ALMANAC_YOGA` penalty from `ASHUBHA_YOGAS` and a generic Vishti penalty
  that **stands down where an activity's chapter rules otherwise** (RULE_PRECEDENCE);
  activity-specific exceptions need the ruling. Weights stay ENGINE_POLICY; re-run the
  90-day distribution check.
- **Acceptance:** no vetoed-badge day ranks above an unblocked day with the same other
  factors, except where a cited chapter rule says so.

### FAA-08 `[ ]` Two hora definitions in one engine, the second unlabelled
**Class** `PARITY` + `DOCTRINE` · **Group B**
- **Where:** `panchangam._make_hora_entries` (24 equal 60-min hours from sunrise) vs
  `shadbala._hora_lord` (day/12 and night/12 unequal horas).
- **Context:** the equal hour is **owner ruling EC-RULING-03**
  (`docs/EC_RULING_IMPLEMENTATION_2026-08-17.md:105`), matching the hourly horai tables
  many Tamil almanacs print. The classical planetary hora divides day and night into 12
  unequal parts each, and that is what Kala Bala's hora bala assumes.
- **Why:** one birth instant can get two hora lords (a 60-virupa swing in Kala Bala), and
  nothing tells the reader which system each surface uses.
- **Fix:** do **not** change Shadbala just to make the two agree. Default: keep Shadbala on
  the classical unequal hora and label `kala_components.hora` "classical unequal hora;
  differs from the panchangam horai". Reopening EC-RULING-03 itself is an owner decision
  and goes in the decision doc.
- **Acceptance:** each surface names its hora system; the panchangam surface does not
  claim to be the classical unequal hora.

### FAA-09 `[ ]` Jupiter's house from the Moon is charged twice in the daily transit score
**Class** `PARITY` (double count) · **Group A**
- **Where:** `app/services/_dg_scoring.py:675-694` (`transit_component`). Jupiter is scored
  via `GOCHARA_HOUSE_SCORE` (weight 0.18) **and** via `_JUPITER_FROM_MOON_MODIFIER` —
  **both read the house from the natal Moon** (`house_from_reference(natal_moon_rasi, …)`).
  Only Saturn's modifier is from the Lagna. `_JUPITER_FROM_MOON_MODIFIER[10] = +1` also
  leans supportive where the gochara grade calls the 10th MIXED.
- **Not the same as Lagna vs Moon.** Guru from Chandra rasi and Guru from Janma lagna are
  two distinct traditional readings and both may matter. That is not what this code does:
  it reads one Moon-based fact twice. A Guru-from-Lagna term would be a new, separately
  labelled feature (Group B).
- **Why:** the layered-scoring double count the repo already paid for in muhurta (FCR-10).
- **Fix:** keep one Moon-based Jupiter term (the derived gochara table) or make the
  modifier a pure gradation inside the favourable set; measure the day-score distribution
  before/after.
- **Acceptance:** Jupiter's house from the Moon moves the score through one term only;
  distribution delta recorded.

### FAA-10 `[ ]` A fit star is credited twice by two generic muhurta layers
**Class** `PARITY` (double count) · **Group A**
- **Where:** `muhurta_engine._almanac_nakshatra_factor` (+10, `FIT_STARS`) and
  `_almanac_day_quality_factor` (+20, `is_subha_muhurtham`, itself the FIT-star verdict
  with weekday/tithi blocks). L2 may then add +14 for the chapter's own list.
- **Why:** same fact, +30 before doctrine speaks; RULE_PRECEDENCE says a generic layer
  stands down, but both generic layers fire.
- **Fix:** fold the star half of day-quality into the nakshatra factor (block reasons keep
  their own chip); re-measure p50/p95.
- **Acceptance:** one star chip, one star contribution, per day.

### FAA-11 `[ ]` Curated wedding list carries Aani and Aavani day numbers one day off the published calendar
**Class** `PARITY` · **Group A**
- **Where:** `app/data/muhurtham_naals.py` rows 2026-06-17…07-12 (stored Aani 2…27;
  published Aani 1 = 15 Jun, so Aani 3…28) and 2026-08-23…09-13 (stored Aavani 7…28;
  published Aavani 1 = 18 Aug, so Aavani 6…27); 2026-09-17 labelled Purattasi 1
  (published Purattasi 1 = 18 Sep, so Aavani 31). `muhurtham_naal_service._to_view` renders
  `n.tamil_day` straight from the row.
- **Why:** calendar page and muhurtham list show two Tamil dates for one civil day; rows
  pre-date the Gnanananda boundaries in `tamil_calendar_authority` (FCA-02).
- **Fix:** derive `tamil_month_index`/`tamil_day` at read time from `tamil_solar_date`
  (Chennai reference) instead of storing them.
- **Acceptance:** drift test (stored label == engine label) passes for 2026 and 2027.

### FAA-12 `[ ]` Venus–Venus 2/12 is STRONG while Moon–Moon 2/12 is MIXED in the same module
**Class** `PARITY` + `DOCTRINE` · **Group B** for the grade, **Group A** for the dead code
- **Where:** `compatibility_intelligence._compute_emotional_compatibility`
  (`venus_rasi_diff in {1, 2, 12, 5, 9}` → STRONG) vs `_MOON_HARMONY_TABLE` (2/12 = MIXED,
  Doctrine §10). Wire field still named `venusMarsHarmony` for a Venus–Venus reading
  (F-CI-05); the Venus–Mars scaffolding is dead code.
- **Note:** Moon harmony and Venus harmony need not carry identical grades — but a
  different Venus table must be a ruled, cited table, not an unexplained literal set.
- **Fix:** ruling: grade Venus–Venus on the §10 table or adopt a named Venus table. Group
  A now: delete the dead `vm_*` lines (rename the wire field only with all four API
  surfaces in one change).
- **Acceptance:** each row's table is named and cited; dead code gone.

### FAA-13 `[ ]` Health karaka differs between two tables in `life_areas_service.py`
**Class** `PARITY` · **Group A** (route to the pinned table); adding Moon is **Group B**
- **Where:** `_AREA_KARAKA["HEALTH"] = ["SUN","MARS"]` (line ~267, pinned to
  `karaka_chains`) vs `_AREA_ROUTING["HEALTH"]["karaka"] = ["SUN","MOON"]` (line ~415,
  feeds the promise gate).
- **Fix:** route both from `LIFE_AREA_KARAKA` (the pinned table); extend
  `test_karaka_tables_agree` to `_AREA_ROUTING`. Sun, Mars and Moon signify different
  sides of health (vitality, injury/surgery, mind/fluids); if the owner wants Moon in the
  health set, that changes `LIFE_AREA_KARAKA` by ruling, in one place.
- **Acceptance:** one health karaka set; the agreement test fails with the old literal
  restored.

### FAA-14 `[ ]` Gandanta: the score uses 3°20′, the display calls ≤5° "mild gandanta"
**Class** `PARITY` · **Group A**
- **Where:** `transits.is_gandanta` (last/first 3°20′ only, −10 in the score) vs
  `nakshatra_analysis.gandanta_detail` (DEEP ≤40′, MODERATE ≤3°20′, MILD ≤5°, symmetric).
- **Why:** a planet at 4° Simmam is "mild gandanta" on the chart card and not gandanta in
  its strength breakdown.
- **Fix:** keep the traditional boundary as the only "gandanta":

  | Distance from the junction | Label | Scored |
  |---|---|---|
  | ≤ 40′ | Deep gandanta (ஆழ்ந்த கண்டாந்தம்) | yes |
  | 40′ – 3°20′ | Gandanta (கண்டாந்தம்) | yes |
  | 3°20′ – 5° | Near gandanta — not gandanta | no |

  Rename MILD; the card copy for the third band must not say "gandanta".
- **Acceptance:** score and card agree on every degree in a 0–6° sweep each side of all
  three junctions — Revati/Ashwini (Meenam/Mesham, 0°), Ayilyam/Magam (Kadagam/Simmam,
  120°), Kettai/Moolam (Viruchigam/Dhanusu, 240°). Distance is the shortest angular
  distance to the junction, measured on **both** sides, including the 360°/0° wrap.

### FAA-15 `[ ]` Amavasai is "inauspicious" to the badge and "sacred, not penalised" to the score
**Class** `PARITY` · **Group B** (the sentence), then Group A
- **Where:** `panchangam._day_block_reason` ("Inauspicious: Amavasai tithi") vs
  `_dg_scoring._tithi_penalty` comment ("NOT penalised: a sacred Pitru Tarpan day") and
  `muhurta_engine._W.ALMANAC_AMAVASAI = −5`.
- **Note:** Amavasai is right for pitru tarpanam and ancestral rites and is avoided for most
  ordinary new auspicious work. There is no single universal Amavasai score; it depends on
  the activity.
- **Fix:** rule one statement per activity class (pitru karma: favourable; new auspicious
  work: avoid; daily score: neutral with a note), and have all three surfaces read it.
- **Acceptance:** one activity-keyed table; badge, score and picker cite it.

---

## 4. P1 — wrong or partial astrology in predictions, scores and precautions

### FAA-16 `[ ]` Marriage stack is gender-blind: Guru is never read for the bride
**Class** `GAP` + `DOCTRINE` · **Group B** (role split), then Group A
- **Where:** `marriage_service._marriage_promise_gate` (karaka = VENUS always),
  `_score_marriage_prediction` (Venus only), `compatibility_intelligence._compute_chart_marriage_strength`
  (Jupiter fetched, never scored), `prasna.MARRIAGE.karaka = VENUS`.
  `karaka_chains.LIFE_AREA_KARAKA["MARRIAGE"]` lists `["VENUS","JUPITER"]`, so life-areas
  and marriage already disagree.
- **Why:** Tamil practice reads Guru as the husband significator in a woman's chart and
  Sukran as the wife significator in a man's. A bride with strong Guru and weak Venus is
  told her marriage promise is weak.
- **Fix:** both planets are always read, with **different roles**; neither becomes
  irrelevant.

  | Chart | Primary spouse karaka | Also read |
  |---|---|---|
  | Bride | Guru (husband significator) | Sukran (relationship/marital significator) |
  | Groom | Sukran (wife significator) | Guru (general marriage significator) |
  | Gender unknown / not given | Both, equally — **a Vinaadi product policy, not a traditional rule** | Say so in the reading |

  When the reader does not give gender, the reading states which traditional
  gender-specific readings cannot be applied (spouse karaka, mangalya sthana, Guru
  gochara for the bride) and what it reads instead (both karakas, 7th house and lord,
  D9), so the gap is visible rather than silently filled.

  Alongside: 7th house and lord, 8th house and lord (FAA-30), D9 Lagna and D9 7th,
  running Mahadasha/Bhukti. Thread through gate, score, D9 dignity check, CI chart strength
  and prasna. No marriage judgement rests on one planet.
- **Spouse karaka ≠ 7th lord.** They are separate factors and are assessed separately,
  even when one planet is both (e.g. Guru as 7th lord for a Mithunam lagna woman): spouse
  karaka, 7th house, 7th lord, the second marital significator, and D9 each get their own
  factor line.
- **Prerequisite — written gender-input policy** (§8.7) before any code: where gender comes
  from (explicit field only), what "unknown" and non-binary do, and the rule that gender is
  **never inferred** from a name, relationship label or any other field.
- **Acceptance:** a female fixture with exalted Guru / debilitated Venus passes the gate and
  the factor lines name both planets with their roles; male mirror fixture likewise; a
  fixture where one planet is karaka and 7th lord shows two lines; an unknown-gender
  fixture reads both and says so.

### FAA-17 `[ ]` Marriage "timing window" is always today → 31 December
**Class** `DEFECT` · **Group A**
- **Where:** `marriage_service.assess_marriage_prediction`
  (`timing_window_end=date(payload.as_of.year, 12, 31)` on every path).
- **Fix:** use the running antardasha span (or the next qualifying one from
  `find_marriage_windows`), else no window.
- **Acceptance:** two fixtures with different dashas get different windows; none ends on
  31 Dec by construction.

### FAA-18 `[ ]` Event windows sample fast transits on one day per year
**Class** `DEFECT` · **Group A**
- **Where:** `event_windows._year_anchor` (1 July for future years) → `venus_support`,
  `sun_support` read on that day; "venus_transits_7th" earns +10 for the whole window when
  Venus holds a sign ~25 days.
- **Fix:** test fast-planet support over the window span (any day Venus/Sun is in the
  house), or drop the fast-planet terms from year windows.

### FAA-19 `[ ]` 7th lord in the 2nd or 3rd is labelled "in a challenging house"
**Class** `DOCTRINE` (rev. 2: moved from mechanical) · **Group B**
- **Where:** `marriage_service._score_marriage_prediction` (`seventh_lord_house in
  {1,4,5,7,9,10,11}` else −8 + "7ம் அதிபதி கஷ்ட வீட்டில்"); same shape for the 4th lord
  (−3 in 2/3). `prasna.cast_prasna_chart` labels a karaka in the **2nd** "in dusthana".
- **Problem:** 2 and 3 are not dusthanas, so the caution copy is wrong. But rev. 1's fix
  ("2/3/11 neutral, no caution") was too flat: the 2nd is a **maraka sthana** (and the
  2nd from the 7th is the 8th, i.e. bride's mangalya context), and the 3rd is a mild
  upachaya/papa house. Each needs its own treatment.
- **Fix (Group A now):** prasna — the 2nd is not a dusthana; correct the label. Stop
  calling 2/3 "challenging" (கஷ்ட வீடு). **Ruling needed** on the score bands for 2, 3 and
  11 (and whether the 2nd carries a maraka note).
- **Guard:** a maraka-house placement is not by itself a marital problem. The 7th lord's
  dignity, functional nature, conjunctions, aspects and the running dasha decide the
  reading; the house alone never produces a negative marriage verdict.
- **Acceptance:** dusthana label only on 6/8/12; 2/3/11 bands match the ruling; a fixture
  with a dignified 7th lord in the 2nd gets no negative verdict from placement alone.

### FAA-20 `[ ]` Neutral Venus prints "Venus offers support"
**Class** `DEFECT` · **Group A**
- **Where:** `marriage_service` `venus_support >= 0` → SUPPORT + "சுக்கிரன் ஆதரவு உள்ளது"
  when `venus_support == 0`.
- **Fix:** three-way copy (support / neutral / reduced). Neutral stays neutral.

### FAA-21 `[ ]` Non-marriage compatibility contexts use bride→groom directional kutas
**Class** `DEFECT` · **Group A**
- **Where:** `synastry_service._CONTEXT_KUTA_MASK` FRIENDSHIP/BUSINESS/FAMILY/GENERAL
  include Dinam and Rasi, both counted girl→boy; `_assign_bride_groom` falls back to
  A=boy for same-gender or unknown pairs.
- **Why:** two friends get a different verdict depending on who was entered first.
- **Fix:** non-marriage contexts use only direction-free kutas (Gana, Yoni, Vedha, Graha
  Maitri, Vasya mutual), or evaluate both directions and report the symmetric reading.
- **Acceptance:** swapping A and B leaves every non-marriage verdict unchanged.

### FAA-22 `[ ]` "Sthira kuta" is not a porutham
**Class** `COPY` · **Group A**
- **Where:** `synastry_service._CONTEXT_NOTE["MARRIAGE"]` ("ஸ்தீர கூடம் (நிலைத்த தன்மை)
  மற்றும் ரஜ்ஜு தோஷம் முக்கியம்").
- **Fix:** name real kutas (Rajju, Vedha, Dinam) or delete the line. Never present a term
  as a standard porutham without a source.

### FAA-23 `[ ]` Relationship alerts ship romanised Tanglish with raw tokens
**Class** `COPY` · **Group A**
- **Where:** `synastry_service.check_transit_activation` lines 466-470
  (`message_ta = f"{planet} {target_name} point-ai nerukkamaaga activate seigiradhu…"`,
  `target_name` = "A VENUS").
- **Fix:** natural Tamil script through `planet_ta`; replace "A/B" with the member's name
  or role; native-Tamil review.

### FAA-24 `[ ]` Eclipse-birth flag fires a day either side and claims "the Sun is briefly covered"
**Class** `CALC` · **Group A**
- **Where:** `birth_conditions.detect_grahana_birth` (13° syzygy orb ≈ 26 h; mean node; no
  eclipse test) with copy "born at or very near a solar eclipse".
- **Problem:** a birth near a Sun–Moon conjunction or opposition is not a birth during an
  eclipse. Tightening the orb (rev. 1's fix) is not enough.
- **Fix:** ask the ephemeris whether an eclipse **actually occurred**: Swiss Ephemeris
  `swe.sol_eclipse_when_glob` / `swe.lun_eclipse_when` around the birth instant, giving
  type (solar/lunar; total/annular/partial/penumbral) and the eclipse's start/max/end.
  Flag only if the birth falls inside that span (or within a declared, stated margin).
  Local visibility (`swe.sol_eclipse_how` / `lun_eclipse_how` at the birthplace) decides
  whether the copy may say it was **visible**; without that computation the copy never
  claims the Sun or Moon was covered at the birthplace. Use the true node for the
  proximity term (eclipse geometry), even though charts use the mean node (§2).
- **Acceptance:** fixtures: a birth 20 h from a syzygy with no eclipse → no flag; a birth at
  a known eclipse maximum → flag with the right type; a lunar eclipse not visible at the
  birthplace → flag without a "visible" claim.

### FAA-25 `[ ]` Kala Sarpa page promises a graded effect the engine never computes
**Class** `COPY` + `SOURCE` · **Group A** (remove the promise) / **Group C** (to grade)
- **Where:** `dosham-kala-sarpa.ts:14,102` ("ranges from mild to intense depending on the
  type and planetary strengths", Mahapadma mild, Sheshanaga auspicious) vs `yogas.py`
  (every Kala Sarpa `PARTIAL` / residual `MODERATE`, no grading).
- **Fix:** remove the promise now. Grading by type only after a cited source for the
  twelve types and their effects.

### FAA-26 `[ ]` Nishita tithi uses civil midnight, not the midpoint of the night
**Class** `CALC` · **Group A**
- **Where:** `panchangam.compute_daily_panchangam` (`next_midnight_jd` = local civil
  00:00). Nishita kala is the muhurta around the midpoint of local sunset → next sunrise
  (Chennai ≈ 00:09 IST, ±16 min with the equation of time, more elsewhere in IST).
- **Why:** Sivarathiri/Krishna Jayanthi dating can move a day when the tithi boundary falls
  in that gap. Jayanthi was ruled "true midnight"; the panchangam field is not.
- **Fix:** compute Nishita as an **interval**, not one timestamp: the night (local sunset →
  next local sunrise, ruled sunrise convention) divided into 15 muhurtas, Nishita = the 8th
  (centred on the midpoint). Then each festival applies **its own** rule to that interval —
  e.g. Krishna Jayanthi (Ashtami at Nishita, with its Rohini/Tamil-lineage ruling) and Maha
  Sivarathiri (Chaturdasi in force through Nishita) are different tests. No festival reads
  a universal "midnight tithi". Each festival's rule is cited from the festival rulings
  already on record; where none is ruled, it is a Group B question.
- **Acceptance:** per-festival tests on boundary years (tithi changing inside vs outside
  the interval); 26-year scan re-run, every moved date listed and checked against a
  printed almanac.

### FAA-27 `[ ]` Pitru dosham raises instead of returning INCOMPLETE_DATA when the 9th lord is missing
**Class** `DEFECT` · **Group A**
- **Where:** `_yoga_dosham.detect_pitru_dosham` (`ninth_lord_rasi = _planet_rasi(planets,
  ninth_lord)` outside the `missing_data` guard).

### FAA-28 `[ ]` Dinam count set excludes 17, 22, 27 without a stated source
**Class** `SOURCE` · **Group C**
- **Where:** `porutham._DINAM_GOOD_COUNTS` (12-count variant; the tara-mod-9 rule passes
  15). Comment calls it "the product stance".
- **Fix:** name the almanac that prints the 12-count list, or adopt the 15; keep the
  chosen lineage consistent with Vasya (FAA-03) and the other kutas.

---

## 5. P2 — missing essentials in marriage matching

The ten poruthams are **one layer** of a marriage assessment, not the assessment. Today
Vinaadi has: 10 poruthams + Nadi + Sevvai (two-chart) + Rahu–Ketu samyam + papa samyam
(text only) + 7th-house strength + D9 Venus/7th-lord + dasha harmony + Moon harmony.

| Component | Weight in practice | Vinaadi today | Item |
|---|---|---|---|
| 10 poruthams | Essential | Built | — |
| Rajju | Very important | Built (one of the ten) | FAA-04 copy |
| Nadi | Important | Built (disclosure) | FAA-04 copy |
| Sevvai dosham | Very important | Built | FAA-05 copy |
| Rahu–Ketu dosham | Important | Built | — |
| Papa samyam | Important | Equal-count only | FAA-37 |
| 7th house and lord | Essential | Built | FAA-19 |
| Venus and Guru, roles by chart | Essential | Venus only | FAA-16 |
| D9 (Lagna, 7th, dignity) | Essential | Partial; mobile D9 lagna wrong | FAA-01, FAA-39b |
| Mangalya sthana (8th) | Important | Indirect only | FAA-30 |
| Dasa sandhi | Important | Engine only | FAA-31 |
| Joint progeny (5th) | Important | Single-chart only | FAA-32 |
| Cross-chart classical reference | Useful | Western aspects only, weight 0 | FAA-33 |
| Moon compatibility | Important | Built | FAA-12 |

No surface may give a marriage verdict from the porutham score alone.

### FAA-29 `[ ]` Spouse karaka by chart — see FAA-16. **Class** `GAP` · Group B
### FAA-30 `[ ]` Mangalya sthana (8th house) read explicitly — **Class** `GAP` · Group D
Today reached only through Rahu–Ketu 2/8 and Sevvai in the 8th. Three **separate**
assessments, not one label applied to both charts for symmetry:
1. **Bride's mangalya sthana** — 8th house, 8th lord and its dignity, occupants, aspects
   on the 8th, strength, D9 support. This is the traditional mangalya reading.
2. **Groom's 8th-house factors** — read as marital-stability factors in his own chart,
   with their own label and copy; not called "mangalya" and not phrased as lifespan.
3. **Joint compatibility** — how the two readings sit together, alongside the existing
   samyam layers.
**Never** output widowhood, spouse death or lifespan for either chart (EC-RULING-06);
advisory voice, limits stated.
### FAA-31 `[~]` Dasa sandhi — engine built (`dasa_sandhi.py`), ruled engine-only; no
surface. "Same mahadasa lord for both" deliberately not built. Owner decision pending.
### FAA-32 `[ ]` Joint progeny — **Class** `GAP` · Group D
Both charts' 5th house and lord, Guru in both, D7 factors where D7 is trusted, the running
dashas, and mutual support/affliction. Progeny checks are single-chart only today. Report
four layers separately: individual indications (each chart), joint considerations, dasha
timing, supportive vs challenging factors. **D7 is supporting evidence, never a pass/fail
gate.** Advisory voice; never a prediction of having or not having children.
### FAA-33 `[ ]` Classical cross-chart reference (groom's 7th lord in the bride's chart and
vice versa; each one's Lagna/Moon as the other's 7th) — **Class** `GAP` · Group D.
### FAA-34 `[~]` Madhyama tiers for Gana, Yoni, Rasi — only Stree Dirgha is graded; the
rest are binary by design, pending Jothidam p.68. **Class** `SOURCE` · Group C.
### FAA-35 `[~]` Eka-nakshatra pada classification — disclosure only, table held
(F-POR-03). **Class** `SOURCE` · Group C.
### FAA-36 `[ ]` Pada-level Rajju/Vedha refinements (ascending/descending rajju) — not
built. **Class** `SOURCE` + `DOCTRINE` · Group C.
### FAA-37 `[~]` Papa samyam weights/tolerance — equal-count only; ruled pending
astrologer. **Class** `SOURCE` · Group C.
### FAA-38 `[ ]` Muhurta engine has no generic yoga, Vishti or Tyajya (star-tail) check —
see FAA-07; Tyajya needs its table sourced. **Class** `GAP` + `SOURCE` · Group C.

---

## 6. P3 — copy and labelling that misstates a fact (all Group A unless noted)

- **FAA-39** `web/lib/natchathiram-data.ts` Anusham deity = "மகாலட்சுமி"; classical
  adhi-devata is Mitra (மித்திரன்). Gana spelt four ways (ராட்சஸ / ராக்ஷச / ராட்சச /
  அசுர), dasa spelt தசை and திசை across pages — pick one per the Tamil voice sheet.
  `COPY`.
- **FAA-39b** D9 on mobile also needs the D9 7th and its lord labelled from the server
  data once FAA-01 lands. `DEFECT`.
- **FAA-40** `_chart_build.py:276-277` birth panchangam `sunrise_time`/`sunset_time` use
  `%I:%M:%S %p` (English am/pm) on a bilingual field; Tamil clock-period rule bans "pm".
  `COPY`.
- **FAA-41** `_dg_hora.py` docstring still says 62-minute horas (60 min since EC-RULING-03).
  `COPY`.
- **FAA-42** `learn-chandrashtama.ts:7` says the sign transit takes "about 2.5 days"; it is
  2¼ (the engine's own copy says இரண்டே கால்). `COPY`.
- **FAA-43** `dosham-sevvai.ts:80` calls Makaram exaltation Mars "strongest" as if that
  softened the dosham, while the ruling marks exaltation a *reduction* factor; fold into
  FAA-05. `COPY`.

---

## 7. Deliberate choices worth re-confirming with the astrologer (not defects)

Each is a lineage choice already made; listed so it stays a conscious one.

- Sevvai declared from the **Lagna only**; Moon/Venus grade (AAU-13). Tamil practice often
  declares from Chandra lagna too.
- Nodes get 5/7/9 drishti (`aspects.ASPECT_HOUSES`) — school choice, disclosed in UI.
- Kala Sarpa: seven grahas, Lagna not required, degree-exact, both directions form.
- Ashtottari lord table = Raman/Jataka Parijata partition (not BPHS 28-nakshatra).
- Tara scores in muhurta vs daily are two calibrations (A-11) — but see FAA-06 for the sign.
- Equal-bhava (lagna as madhya), no Sripati chalit — see FAA-46 for what that implies.
- Mean node for charts (Doctrine §2); eclipse geometry uses the true node (FAA-24).
- Equal 60-min horai on the panchangam (EC-RULING-03) — see FAA-08.
- Moon natural-benefic boundary at exact amavasya/pournami (DD-12), 72° legacy off.

---

## 8. What you did not ask for, and should

1. **A copy-vs-engine parity gate.** Every P0 in §2 except FAA-01/02 is public prose that
   drifted from a ruled engine rule. Nothing tests `web/lib/marketing-i18n` against
   `_build_dosham_explanations` / porutham summaries. Build a grep-level gate per dosham
   (formation verbs, cancellation claims, outcome words) and run the tone sweep over web.
2. **A cross-table sign/polarity gate** for every fact scored on two surfaces (tara,
   Amavasai, yoga, Vishti, Jupiter house, gandanta). FAA-06/07/09/14/15 are one class.
3. **No external-reference golden** for Shadbala, Kalachakra, D27/D45 (all labelled
   experimental). One JHora/Parashara-software fixture per module would retire the label.
4. **Native-Tamil review** still pending on: planet_conditions, nakshatra_lord_dynamics,
   personal_palan (OWNER_COMMISSIONED_DRAFT), yoga_effects, RK_NODE_HOUSE_MEANING, the
   Sevvai C2 context note, the eka-nakshatra and shashtashtaka notes — plus every Tamil
   string this audit's fixes touch.
5. **Muhurtham naal 2028+** and the 2028 almanac import (due ~Sep 2027) — the curated list
   cliff repeats the Karinaal cliff FCA-02 fixed.
6. **Birth time unknown** → chart refuses (correct); rectification (FAA-02) is the only
   path offered and is withdrawn until rebuilt.
7. **Gender as an input** is used for Sevvai markers and Jupiter gochara only; FAA-16 is the
   first of several gendered rules (spouse karaka, mangalya, Guru gochara for the bride)
   that need **one** written policy, including the unknown/non-binary case.
8. **A decision document** for every Group B/C item: question, the references found
   (with page), competing readings, which lineage Vinaadi follows today, and the
   recommended policy. Nothing in Group B/C is built until it is ruled.

---

## 9. Prediction-quality audit (owed; Standard 3 — release requirement)

FAA-44…48 are a **release requirement** for any claim that readings are chart-specific.

A contradiction-free engine is not automatically a correct one. The narrative services were
sampled, not line-audited (one-minute 5,057 lines, five-minute, life-areas 2,691, daily
guidance 1,989, plus marriage, career, health, finance, dasha and gochara copy). They
compose from the engines above but also hold their own house/lord lookups (e.g.
`five_minute_reading_service:1448`). A dedicated pass is owed, line by line, asking of
every sentence: *does this follow from the chart, or is it attractive copy?*

### FAA-44 `[ ]` Lagna-relative reading — **Class** `GAP` audit · Group D
Check every prediction module reads Lagna, Lagna lord, the bhava, its lord, occupants,
aspects and dignity — and that the same planet is not interpreted identically for all 12
lagnas (e.g. Mars is yogakaraka for Kadagam/Simmam, 6th/11th lord for Mithunam).

**12-lagna fixture method (applies to FAA-44…48).** Hold one planetary configuration fixed
(same rasi degrees for every graha) and rotate only the Lagna through all 12 signs. Test
the **reasoning inputs**, not whether the final sentence changes — two charts can
legitimately reach the same score when other factors balance. Per lagna, per planet, the
gate checks four layers:
1. **Ownership** — houses owned match the expected table for that lagna.
2. **Functional nature** — functional benefic/malefic, yogakaraka, maraka, badhaka match
   the expected table.
3. **Consumption** — the prediction engine actually reads (1) and (2): changing only the
   ownership/functional input in a controlled fixture changes the factor the engine
   records (factor list / trace), even if the total does not move.
4. **Explanation** — where ownership materially changes the result, the reader-facing
   explanation names it (e.g. "as your 9th lord…").
Controlled fixtures isolate one factor at a time (ownership, then dignity, then aspect).
An identical final score across lagnas is a **prompt to inspect**, not a failure on its
own. Synthetic configurations only (CLAUDE.md PII rule).

### FAA-45 `[ ]` Functional nature used consistently — **Class** `GAP` audit · Group D
`functional_nature.py` exists. Audit whether every consumer distinguishes: natural
benefic/malefic, functional benefic/malefic, yogakaraka, maraka (2nd/7th lords), badhaka,
and the kendradhipati consideration — and never treats a natural benefic as favourable in
every chart.

### FAA-46 `[ ]` Bhava vs rasi never silently interchanged — **Class** `GAP` audit · Group D
Vinaadi uses equal-bhava with the lagna as madhya, so a planet's rasi house and bhava house
can differ near cusps. Audit every module for which one it reads (planet's rasi, planet's
bhava, rasi lord, bhava lord) and whether the copy names the right one.

### FAA-47 `[ ]` Dasha interpretation from ownership, not nature — **Class** `GAP` audit · Group D
A Mahadasha is not good because its lord is a natural benefic. Check readings weigh:
functional ownership, house placement, dignity, conjunctions, aspects, the lord's
nakshatra lord, the Bhukti lord's relation to the Mahadasha lord, and Antara/Pratyantara
where shown.

### FAA-48 `[ ]` Strength ≠ favourable — **Class** `GAP` audit · Group D
Shadbala/chart strength measures capacity to deliver, not whether the delivery is good. A
strong malefic delivers its significations strongly; a weak benefic struggles to deliver
its promise. Grep every consumer of strength scores for "strong → good" logic or copy.

---

## 10. Rev. 2 changes from the second review

**Adopted (fix rewritten):** FAA-02 (multi-event method; withdraw now), FAA-14 (three
bands, third not gandanta), FAA-16 (both karakas with roles), FAA-19 (2nd = maraka; moved to
ruling), FAA-24 (actual-eclipse test, visibility before any "covered" claim), FAA-30/32
(component lists, advisory voice), §9 (new prediction-quality audit FAA-44…48), item
classes and action groups, the acceptance standard in §12, and "no marriage verdict from
porutham alone".

**Not adopted, and why:**
- **FAA-09 as "Lagna vs Moon".** Both Jupiter terms read the house from the Moon
  (`_dg_scoring.py:675-694`); it is one fact counted twice. Guru-from-Lagna would be a new
  feature.
- **FAA-05 as "Claude's interpretation".** The engine rules are existing owner rulings; the
  finding is copy-vs-ruling parity. The lineage alternatives are now disclosed on the page
  instead.
- **FAA-08 "classical hora is the default".** The equal hour is EC-RULING-03. Both reviews
  agree on the fix (label Shadbala's unequal hora); reopening the ruling is the owner's.
- **FAA-04 "Rajju is associated with longevity".** That framing is what EC-RULING-06
  removed; it stays out of the copy.
- **FAA-13 as needing a ruling first.** Routing both tables to the already-pinned
  `LIFE_AREA_KARAKA` is mechanical; only adding Moon needs a ruling.

### Rev. 2.1 (third review, 2026-11-11)

**Adopted:** §1 retitled with M/D/P/R verification levels (no item is at P yet); title and
status qualified (working spec, not sign-off; not a whole-codebase line audit); FAA-14
junctions and both-sides distance; FAA-16 karaka ≠ 7th lord and a written gender policy as
prerequisite; FAA-19 maraka placement alone is never a negative verdict; FAA-26 Nishita as
an interval with per-festival rules; FAA-30 split into bride's mangalya / groom's factors /
joint; FAA-32 D7 never pass/fail; §9 a release requirement with the 12-lagna fixture
method; §13 supplementary investigation FAA-49…59. The reviewer also withdrew its FAA-09
objection after the code evidence.

**Not adopted:** reading the groom's 8th "for longevity" (FAA-30) — EC-RULING-06 bans
lifespan framing for either chart, so the groom's reading is labelled marital-stability
factors instead.

### Rev. 2.2 (fourth review, 2026-11-11)

**Adopted:** title renamed to "Engine Review, Findings and Implementation Specification"
(file path kept); FAA-02 reclassified `CALC` → `DEFECT` (logic), plus event-date
reliability, a confidence range, decline-when-insufficient, and "never the objectively
correct time"; FAA-16 unknown-gender fallback labelled a Vinaadi policy, and the reading
names which gender-specific readings it cannot apply; FAA-44 12-lagna gate rewritten to
test reasoning inputs (ownership → functional nature → consumption → explanation) instead
of "final text must differ"; FAA-55 Dhana yoga compared against the implemented set and
the chosen source, not a fixed house list, with five sub-questions; FAA-57 graha-yuddha
winner rule sent to Group C.

**Confirmed unchanged:** FAA-08 (label the two hora reckonings, do not homogenise) and
FAA-25 (remove the grading promise now; no table from memory).

**Frozen:** rev. 2.2 is the working specification. Further changes come from rulings,
printed sources, or implementation findings — not another review cycle.

---

## 11. Order of work

| Step | Items | Group |
|---|---|---|
| 1. Wrong numbers / withdraw | FAA-01, FAA-02 step 1, FAA-24, FAA-26, FAA-27 | A |
| 2. Public copy + parity gate | FAA-04, FAA-05 (parity), FAA-22, FAA-23, FAA-25 (remove), FAA-39–43, §8.1 | A |
| 3. Scoring double counts, one measured sweep | FAA-09, FAA-10, FAA-14, §8.2 | A |
| 4. Mechanical | FAA-11, FAA-12 (dead code), FAA-13, FAA-17, FAA-18, FAA-19 (prasna label), FAA-20, FAA-21 | A |
| 5. Decision doc, then build | FAA-06, 07, 08, 12, 15, 16, 19, Group B half of 05 | B |
| 6. Printed sources, then build | FAA-03, 25 (grading), 28, 34, 35, 36, 37, 38 | C |
| 7. New capability, spec first | FAA-02 step 2, 30, 31, 32, 33 | D |
| 8. Prediction-quality audit (12-lagna fixtures) | FAA-44–48 | D |
| 9. Supplementary rule investigation | FAA-49–59 (§13) | investigate, then classify |

Steps 1–4 can start now; §13 runs alongside and does not block them. Do not declare
Vinaadi astrologically audited or production-ready on this document, or because all
software tests pass. That needs steps 1–4 done, the Group B/C rulings settled, §9 and §13
completed, and an independent human astrologer's review.

---

## 12. Acceptance standard (every closed item)

Every item moved to `[x]` carries:

1. **Source or ruling** — the doctrine reference, printed page, or ruling ID it implements.
2. **Before/after example** — one concrete chart or date showing the change.
3. **Calculation test** pinning the new behaviour.
4. **Parity test** across server, `packages/shared`, web and mobile where the fact appears
   on more than one surface (CLAUDE.md API-contract rule).
5. **Tamil review** of every Tamil string added or changed.
6. **Regression test**, and for every new gate: run once with the fix removed, confirm it
   fails, and write its blind spot beside the PASS (CLAUDE.md testing rule).

Implementation discipline: do not modify approved doctrine; do not fold separate
traditional readings into one generic score; no Group B/C change without its ruling or
source; never invent a missing rule — record it as a question instead.

---

## 13. Supplementary rule investigation (rev. 2.1; investigation requests, not defects)

Requested by the second review. Several of these modules were line-read in rev. 1 for
**arithmetic and tables** (§0); this pass checks **rule completeness and interpretation** —
whether the conditions the tradition requires are all tested, and whether the result is
read the way the rule means it. No item here is a presumed defect.

Each item, when investigated, records: implementation location · existing behaviour ·
traditional rule · source or doctrine reference (level M/D/P/R, §1) · verdict
(correct / incorrect / incomplete / lineage-dependent) · recommended correction (with its
Group) · test cases.

| ID | Area | Question | Start at |
|---|---|---|---|
| FAA-49 `[ ]` | Bhava Bala | Is house strength computed and used independently of planet strength, or only inferred from occupants/lord? | `chart_strength`, `shadbala`, `bhava_palan` |
| FAA-50 `[ ]` | Ashtakavarga in transit | Are BAV (the transiting planet's own bindus in that sign) and SAV (sign total) read for their distinct purposes, and is kaksha used or claimed? | `ashtakavarga`, `bav_derived`, `_dg_scoring._transit_with_av_score` |
| FAA-51 `[ ]` | Double transit (priority) | Guru and Sani both influencing the event house/lord — from which reference (Lagna, Moon, or both), by occupation and aspect, with the dasha as the precondition? | `double_transit`, `event_windows` |
| FAA-52 `[ ]` | Neecha bhanga (priority) | Are the cancellation conditions tested individually, and is "cancellation of debility" kept distinct from a claimed strength gain or Raja yoga? | `neecha_bhanga`, consumers in `yogas`, `chart_strength` |
| FAA-53 `[ ]` | Vipareeta Raja yoga (priority) | Harsha/Sarala/Vimala: the 6th/8th/12th lord placed in a dusthana, with the lineage's conditions on association and strength? | `_yoga_detect`, `yoga_rules` |
| FAA-54 `[ ]` | Parivartana yoga (priority) | Are exchanges classed by the houses involved (maha / khala / dainya) and read accordingly, not as uniformly good? | `_yoga_detect`, `yoga_effects` |
| FAA-55 `[ ]` | Dhana yoga | List the combinations **actually implemented** and compare them with the chosen source — not against a fixed house list (1/2/5/9/11 are central; the 10th and others enter depending on the doctrine). Distinguish wealth promise, accumulation (2nd), income/gains (11th), career-generated wealth (10th) and dasha activation. A generic benefic placement must never by itself become Dhana yoga. | `yoga_rules`, `life_areas_service` (wealth) |
| FAA-56 `[ ]` | Raja yoga | Kendra–trikona lord relationship (conjunction / mutual aspect / exchange) tested by lordship from the Lagna, and kendradhipati handled? | `_yoga_detect`, `functional_nature` |
| FAA-57 `[ ]` | Combustion vs planetary war | Asta and graha yuddha kept separate and not double-penalised? Yuddha participants are Mars, Mercury, Jupiter, Venus, Saturn. Proximity alone does not decide the **winner**; the winner method (and the exact proximity condition) varies by source. **Group C:** document the selected source and its method before implementing or modifying any winner calculation. | `planet_conditions`, `chart_strength` |
| FAA-58 `[ ]` | Retrograde planets | Is vakra treated as a strength/intensity factor (cheshta bala) rather than automatically good or bad, and is the copy neutral? | `planet_conditions`, `shadbala`, reading copy |
| FAA-59 `[ ]` | Dasha–gochara | Are natal promise, dasha period and transit trigger distinct layers, with transit unable to produce what the chart does not promise? | `prediction_score`, benefic-promise gate, `event_windows` |

Priority within §13: FAA-51, 52, 53, 54 first (direct effect on life-event readings).
