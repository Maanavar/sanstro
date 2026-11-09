# Deferred astrology checks: analysis and build plan

**Date:** 2026-11-09. **For:** the owner (decisions), the astrologer (the rulings marked ⚖), and
the developers who build each item. **Status:** plan. Nothing here is built except item 0.

Every place where the product tells a reader that something "is not ruled", "not sourced" or
"not built yet", plus two checks it dropped without saying so. For each item:

1. **Today:** what the code does now, checked against the source, with file and line.
2. **Classical calculation:** how the tradition reckons it, and where the streams disagree.
3. **Proposed rule:** what Vinaadi should compute, and which parts need a ruling.
4. **Build:** engine, API, shared wording, web, mobile (CLAUDE.md: all four surfaces in one change).
5. **Measurements:** the numbers and gates that prove it is right before it ships.

All examples use synthetic charts. No real birth data goes in any fixture.

---

## Ground rules that apply to every item

These come from rulings already on record. A build that breaks one is wrong even if it works.

| Rule | Source | What it means here |
|---|---|---|
| **Provenance tiers.** `classical_cited` → `lineage_cited` → `practice_convention` → `engine_inference`. An `engine_inference` rule may **describe and time only**. It never declares a dosham, moves a grade, or triggers a parihara. | DOCTRINE_DECISIONS_V1 §18, Q18 | Every new rule starts at `engine_inference` unless a page is photographed and cited (publisher, edition, Tamil year, page). |
| **A lineage choice is the astrologer's.** Where streams disagree, the engine carries a `DoctrineOptions` switch and a default, and the astrologer picks. | Contested = lineage choice (memory) | Items 3, 4, 5 and 6 each have a ⚖ table. |
| **Never invent a table.** A muhurta or matching table comes from a printed page, not from a website or an AI. A website is a lead, never a citation. | Q18; the muhurta engine's "silence is never approval" rule | Item 4 lists published lists as *leads to verify*, never as data to ship. |
| **No denial of children, no fatalism.** | Q17 | Applies to items 0 and 7. |
| **No double counting.** Two layered scores for one placement count it twice. | Layered scoring double-counts (memory) | Papasamyam vs Sevvai (item 3); nithya yoga vs Amirdhadhi (item 5). |
| **A gate proves its own check.** Run every new gate once with the fix removed and confirm it fails. Write its blind spot next to the PASS. | CLAUDE.md, Testing | Every Measurements block ends with its negative run. |
| **Display boundary.** Planet and rasi names render through the shared name tables, never a server string. | CLAUDE.md | Every new wire field is a key or a number, worded in `packages/shared`. |

**Verification sources used throughout:** Drik Panchang (Chennai, geoname 1264527) for panchangam
times; Jagannatha Hora for vargas and dasa dates; the printed Vasan Suththa Thirukkanidha Panchangam
for Tamil almanac conventions (Q1). Each is a comparison point; none is a citation for doctrine.

---

## Summary

| # | Item | Today | What is missing | Who decides | Size |
|---|---|---|---|---|---|
| 0 | Children's doshams: D7 and dasa (Q13) | **Built 2026-11-09**, `engine_inference` | Ratification; prevalence measurement; reference check | ⚖ Astrologer | Done; S to finish |
| 1 | Putra Sarpa: Guru + Ketu (Q14, D6b) | Watch-note, "has not been ruled yet" | A ruling only | ⚖ Astrologer | S |
| 2 | Putra Sarpa / Santhana Thadai protections (Q12) | Stand-in definitions, `pending_definition` | Definition of "strong 5th lord" and "protecting Jupiter" | ⚖ Astrologer | M |
| 3 | Papasamyam | **Built** in the compatibility report; **dropped** from the Porutham tool on a stale comment | Weights, house set, cancellations, tolerance; show it on the Porutham page | ⚖ Astrologer; Dev | M |
| 4 | Muhurta: activities with no sourced star/tithi table | "Not yet sourced" for Job start, Exam, Travel, Medical, Spiritual, Purchase, Investment | Tables from printed pages | ⚖ Astrologer + sourcing | L |
| 5 | Muhurta: the day's nithya yoga | "Not graded for muhurta by any sourced table yet" | A sourced grading, with time-portion rules | ⚖ Astrologer | M |
| 6 | Porutham: Eka Nakshatra (same birth star) | "Vinaadi has not yet confirmed them from a named text" | The star classes and pada rules | ⚖ Astrologer | S–M |
| 7 | Dasa Sandhi | **Not built anywhere**; dropped from the Porutham tool | Definition, window length, matching tolerance | ⚖ Astrologer; Dev | M |
| 8 | Muhurta: Kuligai in time windows | Every activity is classified; the favourable case is **named but not scored** | A weight | Owner (product weight) | S |
| 9 | Almanac muhurtham-day lists | "No almanac muhurtham list sourced for this year yet" | A yearly data-entry process with a deadline gate | Owner + data entry | S, recurring |

---

## 0. Children's doshams: Saptamsa (D7) and dasa (Q13)

**Today.** Built 2026-11-09: `app/calculations/progeny_checks.py`, API field
`ChartDoshamInsight.progenyChecks`, wording in `packages/shared/src/progenyChecks.ts`, shown by
`web/components/dosham-reckoning-block.tsx` and `mobile/app/(tabs)/tools/dosham.tsx`. Tier:
`engine_inference`. It does not touch `strength`, `residual`, `parihara` or `progenyOutlook`; a
test builds the dosham with and without the checks and compares every grade field.

**Calculation as built.**

- **D7 chart:** each longitude, *including the lagna degree*, is divided into seven parts of
  30/7° (4°17′8.6″). An odd sign counts its parts from itself; an even sign from the 7th sign
  from itself (BPHS, Saptamsa). `divisional_charts.compute_d7` already handles the exact-boundary
  case (a degree on a boundary belongs to the part it opens).
- **Verdict**, in this order:
  1. `UNCERTAIN` when the birth-time uncertainty is over 2 minutes (the same cut-off as
     `vargaReliability`) or the rising degree is within 2 minutes of a D7 boundary. Margin in
     minutes = distance to the nearest boundary in degrees × 4 (the lagna's mean rate; it varies
     roughly 3–6 min/° with sign and latitude, so the figure is approximate and says so).
     **Proposed replacement (review 2026-11-09):** drop the ×4 conversion. Compute the lagna at
     birth time − tolerance and + tolerance with the real ephemeris, take the D7 sign of each, and
     mark `UNCERTAIN` if they differ. That is exact for the place and sign, and the 23.3% figure
     below becomes a property of real birth places, so it must be re-measured on a sweep of
     synthetic times *and latitudes* rather than random lagna degrees.
  2. `REPEATS` when this dosham's own afflictor (Rahu/Ketu for Putra Sarpa, Saturn for Santhana
     Thadai) sits in the D7 5th or with the D7 5th lord.
  3. `STRAINED` when the D7 5th lord is in the 6th, 8th or 12th from the D7 lagna and Jupiter gives
     no support.
  4. `SUPPORTS` when Jupiter is in the D7 5th, aspects it, or sits in a kendra or trikona from the
     D7 lagna, with no node on Jupiter, and the D7 5th lord is not in a dusthana.
  5. `MIXED` otherwise.
- **Open question on rule 4 (review 2026-11-09).** "Kendra or trikona from the D7 lagna" says
  Jupiter is well placed, not that it protects the 5th. A narrower test, Jupiter in the D7 5th or
  aspecting the D7 5th or its lord, is closer to "protection". The wider placement could stay as a
  separate supportive note. This is a question for the astrologer, not a code choice.
- **Wording.** The verdict keys are Vinaadi's categories, not BPHS terms. `REPEATS` means "the D7
  shows the same configuration". The reader's line must describe the chart and never predict that
  a problem will repeat (Q17).
- **Dasa windows:** from today to 20 years ahead, at most 6. A mahadasa of an afflictor or a
  supporter is one window; otherwise each bhukti of one is. Afflictors: the dosham's own planets.
  Supporters: Jupiter and the D1 5th lord, unless the dosham itself joins them to the afflictor.
  A window is `MIXED` when both apply. Age band: under 18, 18–49, 50 and over.

**⚖ Still owed** (questions already written: `docs/ASTROLOGER_QUESTIONS_CHILDREN_D7_DASHA_2026-11-09.md`):
which D7 factors count and what each does; which dasas activate; bhukti or mahadasa; whether the
dasa may ever move the grade; when the "first reading" line can go.

**Measurements to finish.**

| Measure | How | Pass |
|---|---|---|
| D7 sign agreement | 50 synthetic charts, D7 signs for all 9 grahas + lagna vs Jagannatha Hora | 100% outside 0.01° of a boundary |
| Dasa dates | Same 50 charts, mahadasa and bhukti start dates vs Jagannatha Hora (Lahiri, 365.25-day year) | Within 1 day |
| Verdict prevalence | Sweep every Putra Sarpa / Santhana Thadai chart in the 84-chart fixture and a 10 000-chart random sweep; report the share of each verdict | Recorded beside the PASS. If `REPEATS` exceeds 30%, review the rule before ratification (a confirmation that fires on a third of charts confirms nothing) |
| Birth-time guard | Share of random charts that come out `UNCERTAIN` at 0 minutes stated uncertainty | **Measured 2026-11-09** (100 000 random lagnas, `tests/test_progeny_checks.py`): inside the 21–26% gate, expected 23.3%. The old 5-minute margin measured **58.4%**, and the gate fails on it (negative run done). The astrologer confirms the line |
| Grade untouched | Existing assembler test (`tests/test_progeny_checks.py`) | Passes; fails with the guard removed (already run 2026-11-09) |

**Corrected 2026-11-09.** The first build used a 5-minute margin. On a part about 17 minutes wide
that withholds the D7 verdict on about 10/17 ≈ 58% of charts. The margin now equals the 2-minute
birth-time tolerance (about 23%), on the reasoning that a time good to ±2 minutes cannot move a lagna
more than 2 minutes from a boundary.

---

## 1. Putra Sarpa: Guru with Ketu (Q14, D6b)

**Today.** `detect_putra_sarpa_dosham` counts Guru + Rahu as a leg and Guru + Ketu as a watch-note
(`putra_sarpa_guru_ketu_noted`): "Whether Guru with Ketu weighs the same as Guru with Rahu has not
been ruled yet" (`packages/shared/src/doshamReckoning.ts:181`).

**Classical position.** Guru Chandala yoga, as classically named, is Jupiter with **Rahu**
(*Chandala* is Rahu's epithet). Extending it to Ketu is a later and regional practice. Some modern
writers read Guru + Ketu the other way, as a spiritual combination. No grade change is defensible
without a page.

**⚖ Ruling needed.** One of: (a) Ketu is a full leg like Rahu; (b) Ketu is a half leg, which needs
a grade scale finer than WEAK / PARTIAL / STRONG; (c) watch-note only (today's behaviour).

**Build.** Already parameterised in effect. Add `DoctrineOptions.d6b_guru_ketu` = `watch_note`
(default) | `leg`. Under `leg`, Ketu joins `beside_guru` and the note is dropped. No new wire field.

**Measurements.**

| Measure | Pass |
|---|---|
| Prevalence of Putra Sarpa at each grade, both settings, on the 10 000-chart sweep | Under `leg`: severe ≤ 5%, confirmed + severe ≤ 25% (Q16 build gate) |
| Change count | Report how many fixture charts change grade under `leg`; the astrologer sees the list before switching |
| Negative run | Set the option to `leg`, assert the watch-note disappears; revert, assert it returns |

---

## 2. Children's-dosham protections (Q12)

**Today.** Two protections lower a grade by one and never cancel: a **strong 5th lord**
(`planet_scores[lord] >= 65`) and a **protecting Jupiter** (Jupiter in a kendra from the Lagna).
Both are tagged `engine_inference`, `pending_definition` (`app/calculations/_yoga_dosham.py:1657`).
The ruling itself says sign dignity is not strength, and a kendra is a positional stand-in.
When both apply, the grade still drops by **one step at most** (`_yoga_dosham.py:1670`,
`1 if reducers else 0`), so the two do not stack.

**Tension with §18, flagged in review 2026-11-09.** These reducers are `engine_inference`, yet they
move a grade, which the ground rules forbid. They were kept at shipped behaviour so that no live
grade would rise (comment at line 1658). The astrologer's ruling on this item settles the
exception: either the definitions are ratified and become `lineage_cited`, or the reducers stop
moving the grade.

**Classical calculation.** A house is protected when its lord is strong and unafflicted and when
benefics, above all Jupiter, influence it:

- **Strong 5th lord:** own or exaltation sign, or friendly sign with good Shadbala; not combust;
  not in the 6th, 8th or 12th; not joined by Rahu, Ketu or Saturn. Vinaadi already computes
  Shadbala (`app/calculations/shadbala.py`), so a Shadbala ratio test is available.
- **Protecting Jupiter:** Jupiter in the 5th, or aspecting the 5th (5th, 7th, 9th aspects), or
  aspecting the 5th lord; Jupiter itself not debilitated, combust or joined by a node.

**Proposed rule (for ratification).**

| Protection | Proposed test | Replaces |
|---|---|---|
| Strong 5th lord | Shadbala ≥ its classical minimum requirement (BPHS required rupas: Sun 6.5, Moon 6, Mars 5, Mercury 7, Jupiter 6.5, Venus 5.5, Saturn 5) **and** not combust **and** not in 6/8/12 **and** not joined by an afflictor. ⚖ The astrologer defines "afflictor" (Rahu, Ketu and Saturn only, or also Mars, Sun and aspects). Shadbala alone shows strength, not relevance to the 5th | composite score ≥ 65 |
| Protecting Jupiter | Jupiter in the 5th, or aspecting the 5th or its lord, **and** not debilitated, combust or node-joined | Jupiter in a kendra |

**Build.** Two predicates in `_yoga_dosham.py`, behind `DoctrineOptions.q12_protection` =
`stand_in` (default until ruled) | `classical`. Marker keys stay the same so the wording does not
change; add two keys for the new reasons.

**Measurements.**

| Measure | Pass |
|---|---|
| Shadbala rupas vs Jagannatha Hora for 50 synthetic charts | Within 0.5 rupa per graha |
| Grade movement: charts whose grade changes under `classical`, on the 84-chart fixture | List reviewed by the astrologer before switching |
| Q16 prevalence, both settings | Same caps as item 1 |
| Negative run | Force Jupiter combust; the `classical` protection must drop |

---

## 3. Papasamyam (பாப சாம்யம்)

**Today. It is built, but only half shown.**

- `app/calculations/dosha_samyam.py:86–192` counts the five malefics (Sun, Mars, Saturn, Rahu,
  Ketu) in houses 1, 2, 4, 7, 8, 12 from the Lagna, Moon and Venus of each chart, one point each,
  and checks **boy's total ≥ girl's total**. It deliberately does not score.
- It reaches the reader in the compatibility report (`compatibility_intelligence.papa_samyam_lines`,
  line 431).
- The **Porutham tool page does not show it.** `web/components/dashboard-tools-porutham-nova.tsx:135`
  says Papasamyam was dropped because "grep-confirmed neither concept exists anywhere in
  app/calculations". That comment is stale and wrong for Papasamyam. A family using the Porutham
  page and comparing it with a printed jathagam will find the check missing.

**Classical calculation and its variants.** The shape is common (malefics counted in set houses
from set references), but every part of it varies: the malefic set, the houses, the weights and
the verdict. "Boy's total ≥ girl's" is itself a lineage convention, not a fixed law, and is ruled
in point 5 below. Counting the same malefic from Lagna, Moon and Venus is intended in this method
and is not double counting. Double counting arises only when the total is combined with another
score that has already weighed the same placement (see Sevvai below).

| Element | Common practice | Variants seen |
|---|---|---|
| Malefics | Sun, Mars, Saturn, Rahu | Ketu included (Tamil, today's code); Sun at half weight; waning Moon and afflicted Mercury added in some Kerala practice |
| Houses | 1, 2, 4, 7, 8, 12 | 7 and 8 weighted double; the 2nd dropped |
| References | Lagna, Moon, Venus | Weights 1 : ½ : ¼ for Lagna : Moon : Venus (Kerala); equal weights (today's code) |
| Per-planet weight | Mars and Saturn full; Sun and nodes lighter | All equal (today's code) |
| Cancellation | A malefic in its own or exaltation sign, or aspected by Jupiter, counts less | No cancellation (today's code) |
| Verdict | Boy's points ≥ girl's | Within a tolerance (for example girl ≤ boy + 1 or + 2) |

**Double counting with Sevvai.** Mars in 2/4/7/8/12 is both Sevvai dosham and Papasamyam points.
The porutham composite already handles Sevvai samyam (`_apply_mutual_sevvai_cancellation`). If
Papasamyam is ever scored, Mars must not be charged twice; either it is excluded from the score
when Sevvai has been weighed, or the two are presented side by side and never summed.

**⚖ Ruling needed** (a table the astrologer fills):

1. Malefic set, and per-planet weights.
2. House set, and whether 7 and 8 weigh double.
3. Reference weights (equal, or 1 : ½ : ¼).
4. Which cancellations apply.
5. The verdict: strict ≥, or a tolerance.
6. Does it **score** in the porutham composite, or only report? (Today: report only.)

**Build.**

- Engine: weights in a `PapaWeights` table behind `DoctrineOptions.papa_samyam_weights` =
  `equal_count` (today) | `kerala_1_half_quarter` | `astrologer_table`. Points become fractions;
  keep the per-reference, per-planet breakdown so a jothidar can check it by hand.
- API: a `papaSamyam` block on the porutham response (keys and numbers only): totals, breakdown
  rows `{reference, graha, house, points}`, `balanced`, `shortfall`.
- Shared: `packages/shared/src/papaSamyam.ts` words it; a typed wrapper in `packages/shared/src/api/`.
- Web and mobile: a Papasamyam card on the Porutham page, after the ten poruthams, showing both
  totals and the breakdown. Fix the stale comment.

**Measurements.**

| Measure | Pass |
|---|---|
| Hand-count parity | 20 synthetic couples, counted by hand by the astrologer from printed charts; engine totals equal the hand totals under the ruled weights | 20 / 20 |
| Direction | Swapping the two charts flips `balanced` whenever totals differ (F-POR-05 guard) | Always |
| Distribution | On 10 000 random couples, share `balanced` | Recorded. Expect a little over 50% under strict ≥ (ties count as balanced); far from that means a bug |
| No double charge | If scored: a Mars-only chart with Sevvai samyam applied changes the composite once, not twice | Exact |
| Negative run | Remove Ketu from the set; a Ketu-in-7th fixture must change its total | Fails as expected |

---

## 4. Muhurta: activities with no sourced star or tithi table

**Today.** `app/calculations/muhurta_engine.py:1007–1045, 1151, 1185, 1301`. For an activity not in
`SOURCED_ACTIVITIES`, the nakshatra and tithi factors return `UNSOURCED`: "No primary-text
nakshatra list has been sourced for {activity} yet — this day's nakshatra was not judged." The
planner labels it "Not yet sourced".

- **Sourced** (Kalaprakasika, page-cited): Marriage (Ch. XIV), the samskaras (Ch. III–IV: naming,
  milk feeding, annaprasana, ear boring, tonsure, upanayanam, seemantham, lying-in, vidyarambham,
  education start, Veda study, mantra initiation, snaana), treasure and agriculture (Ch. XXI: gold,
  gems, grain, land, cattle, harvest, sowing, tillage, new clothes, new ornament).
- **Unsourced:** JOB_START, EXAM, TRAVEL, MEDICAL, SPIRITUAL, PURCHASE, INVESTMENT. The planet
  lords for these (`app/services/muhurta_service.py:209`) are product judgement, and the code says so.

**Where the tables are.** These activities are classical chapters; they need reading and
photographing, not inventing.

| Activity | Classical chapter to source | Notes |
|---|---|---|
| TRAVEL | Yatra prakarana (Muhurta Chintamani; Kalaprakasika's travel chapter) | Also brings directional rules (disa shoola, already in the panchangam as soolam) and weekday rules |
| MEDICAL | Aushadha sevana / roga chikitsa (Muhurta Chintamani) | Kuligai is already `[LINEAGE]` adverse (MUH-06). The star list is separate from that ruling |
| EXAM, EDUCATION | Vidyarambha is sourced; an exam is not a classical act | ⚖ Map EXAM to Vidyarambha's table, or keep it unsourced. Mapping is a ruling, not a code choice |
| JOB_START | Raja darshana / seva arambha (seeking service) | Closest classical act; ⚖ mapping |
| PURCHASE, INVESTMENT | Kraya-vikraya (buying and selling); Ch. XXI covers gold, land and grain only | ⚖ Generic purchase may map to kraya; investment has no classical act |
| SPIRITUAL | Deva pratishtha, diksha, homa (Kalaprakasika p. 192 already lists five spiritual acts on Gulika's benefic side) | Star and tithi lists for diksha are in the same texts |

**Leads, not data.** Published lists circulate (for example, a commonly quoted travel list of
Ashwini, Mrigashirsha, Punarvasu, Pushya, Hasta, Anuradha, Shravana, Dhanishta, Revati). These are
**leads to check against the photographed page**. Nothing enters `ACTIVITY_RULES` without a
`rule_id` that resolves to a page in `RULE_SOURCES` (`tests/test_muhurta_engine.py` already enforces
this).

**Build per activity** (the pattern Ch. XXI followed):

1. Photograph the page; add a `RULE_SOURCES` record (book, translator, publisher, edition, page,
   passage).
2. Add an `ActivityRules` entry in `app/data/muhurta_activity_registry.py`: star groups, tithi
   groups, weekday rules, and `unscored_dimensions` for anything on the page the engine cannot judge.
3. Add the activity's Kuligai polarity if it is new (`app/data/kuligai_polarity.py`).
4. Surface parity: `tests/test_muhurta_activity_surface_parity.py` must list it on web and mobile.

**Medical: a safety rule before any table (added in review 2026-11-09).** Whatever the ruling,
a medical muhurta must never suggest delaying urgent care or prescribed treatment. The planner shows
a fixed line on every MEDICAL result: timing is cultural guidance for planned, non-urgent
procedures only, and a doctor's advice comes first. Gate: every MEDICAL response carries the line
key; run once with the key removed and confirm it fails. Today the only doctor-first copy is in
`packages/shared/src/progenyChecks.ts:208`. Muhurta has none.

**SPIRITUAL is too broad.** Diksha, homa, deva pratishtha and pilgrimage have different lists.
Source them as separate activities rather than one SPIRITUAL table.

**Measurements.**

| Measure | Pass |
|---|---|
| Every emitted `rule_id` resolves to a page | Existing test, 100% |
| Transcription check | The astrologer re-reads each entered list against the photo; zero differences |
| Coverage | `UNSOURCED` count per activity over a year of days drops to 0 for each activity sourced |
| Behaviour change | For each new table, the number of days per year whose verdict changes, by direction, reported before merge |
| Negative run | Delete one star from a sourced list; the day that relied on it must change verdict |

---

## 5. Muhurta: the day's nithya yoga

**Today.** `app/calculations/muhurta_engine.py:774`: "Yoga is {name} — not graded for muhurta by any
sourced table yet." Verdict NEUTRAL, contribution 0. The Tamil Amirdhadhi Yogam (weekday ×
nakshatra) is already judged in the L1 almanac layer.

**Classical calculation.** Nithya yoga = (Sun's longitude + Moon's longitude) ÷ 13°20′; 27 yogas.
Nine are inauspicious. The commonly quoted muhurta rule (Muhurta Chintamani tradition) avoids only
**part** of most of them, counted from the yoga's start time:

| Yoga | Portion to avoid (commonly quoted) |
|---|---|
| Vishkambha | first 3 ghatis (some texts 5) |
| Atiganda | first 6 ghatis |
| Shula | first 5 ghatis (some texts 7) |
| Ganda | first 6 ghatis |
| Vyaghata | first 9 ghatis |
| Vajra | first 9 ghatis (some texts 3) |
| Parigha | first half |
| Vyatipata | whole yoga |
| Vaidhriti | whole yoga |

One ghati = one nazhigai = 24 minutes. The yoga's start and end are clock times already computed by
the panchangam (the yoga changes about once a day, but its length varies with the Moon's speed).
**The variants in the table are why this must be sourced.**

**Tamil practice question.** Tamil almanacs print nithya yoga, but Tamil muhurta practice leans on
Amirdhadhi Yogam. Grading both risks judging the same day twice under two systems.

**⚖ Ruling needed.** (1) Is nithya yoga judged for Tamil muhurta at all, beside Amirdhadhi? (2) If so,
whose portion table (cite the page)? (3) A penalty, or a veto for Vyatipata and Vaidhriti?

**Build.** `_almanac_yoga_factor` uses the yoga's start JD from the panchangam snapshot and the
ruled table: inside the avoided portion → PENALTY (or VETO), else NEUTRAL. For windows, the portion
boundary splits the day, so a morning slot may fail while an afternoon slot passes; the window scorer
must judge per slot, not per day.

**Measurements.**

| Measure | Pass |
|---|---|
| Yoga index and start/end times vs Drik Panchang (Chennai), 60 consecutive days | Index 100%; times within 2 minutes |
| Portion boundary | For each of the 9 yogas, a synthetic slot 1 minute before and 1 minute after the boundary gets opposite verdicts | 18 / 18 |
| No double judgement | A day failed by Amirdhadhi and by nithya yoga shows two named factors and is not penalised twice unless the ruling says so | Per ruling |
| Negative run | Set Vishkambha's portion to 0; a slot in its first hour must stop failing | Fails as expected |

---

## 6. Porutham: Eka Nakshatra (same birth star)

**Today.** `app/calculations/porutham.py:656–731`. Same star is labelled "further examination
advised"; the note says the star classes differ between traditions and "Vinaadi has not yet confirmed
them from a named text, so no exception is applied here and the Rajju result stands as calculated".
That is the correct fail-safe until ruled.

**Classical calculation.** Same nakshatra for both partners is judged on its own, apart from Rajju:

- **Same pada:** treated restrictively in most streams; some same-star exception tables still
  differ. The astrologer's lineage decides.
- **Different padas:** depends on the star's class. A commonly quoted grouping (a lead to verify):
  *uttama* (acceptable) Rohini, Thiruvathirai, Magam, Hastham, Visakam, Thiruvonam, Uthirattathi,
  Revathi; *madhyama* Ashwini, Karthigai, Mirugasirisham, Punarpoosam, Poosam, Pooram, Chithirai,
  Pooradam; the rest *adhama* (avoid).
- **Stars that span two rasis** (Karthigai, Mirugasirisham, Punarpoosam, Uthiram, Chithirai,
  Visakam, Avittam, Pooratathi): partners in different rasis are read more leniently in some streams.
- **Which partner's pada comes first** matters in some streams (the boy's pada ahead of the girl's).

**⚖ Ruling needed.** The astrologer's own table: class per star, pada rule, two-rasi rule, order
rule, and whether an acceptable Eka overrides a failed Rajju (it does in some streams; today it never
does).

**Build.** `EKA_NAKSHATRA_CLASSES` table with `rule_id` and source, behind
`DoctrineOptions.eka_nakshatra` = `examine_only` (today) | `astrologer_table`. Output keys only
(`eka_class`, `pada_relation`, `overrides_rajju`); shared wording on both apps.

**Measurements.**

| Measure | Pass |
|---|---|
| Table coverage | All 27 stars classed; all 16 ordered pada pairs per star (432 in all) resolve to a verdict | 100% |
| Rajju interaction | For every same-star pair, the Rajju veto applies exactly as the ruling states | Exhaustive 27 × 4 × 4 test |
| Negative run | Remove one star's class; its pairs must fall back to "examine" | Fails as expected |

---

## 7. Dasa Sandhi (தசா சந்தி)

**Today.** Not computed anywhere. It was a "not yet available" card on the Porutham page and was
removed (`dashboard-tools-porutham-nova.tsx:135`). The engine already has every input:
`calculate_vimshottari_timeline` gives every mahadasa and bhukti with dates.

**Classical calculation.** Two uses of one idea, the junction where one mahadasa hands over to the next:

1. **In one chart (timing):** the sandhi is a period of instability around the change. Definitions differ:

   | Option | Sandhi window |
   |---|---|
   | A. Fixed | 6 months before and 6 months after the change |
   | B. Proportional | The last bhukti of the outgoing mahadasa and the first bhukti of the incoming one |
   | C. Narrow | The last pratyantara of the outgoing and the first of the incoming |

2. **In matching (porutham):** Dasa Sandhi dosham when **both partners' mahadasas change at about the
   same time**, usually counted within the early years of the marriage. Tolerance is commonly given
   in months (6 or 12). Some practice also flags both partners running the **same mahadasa lord**;
   that is a separate rule and stays off by default.

**⚖ Ruling needed.** (1) Window definition A, B or C. (2) Matching tolerance (months). (3) The horizon
counted from the marriage date (for example, the first 5 or 7 years). (4) Report only, or score?
(5) Is it a dosham that a parihara answers, or a timing caution? (Proposed: a timing caution, never a
veto, `engine_inference` until ruled.)

**Build.**

- Engine: `app/calculations/dasa_sandhi.py` with `sandhi_windows(timeline, option)` and
  `couple_sandhi(timeline_a, timeline_b, from_date, horizon_years, tolerance_months)`. Pure functions.
- API: `dasaSandhi` on the porutham response: each partner's change dates in the horizon, the pairs
  within tolerance, and the gap in days.
- Shared wording; a card on the Porutham page (web and mobile); on the single-chart dasa screen, the
  current or next sandhi window.
- Muhurta: optionally name a sandhi window as a caution factor for major starts. Never priced until ruled.

**Measurements.**

| Measure | Pass |
|---|---|
| Change dates vs Jagannatha Hora, 50 synthetic charts | Within 1 day |
| Tolerance edge | Couple pairs at tolerance − 1 day and + 1 day get opposite verdicts | Exact |
| Prevalence | On 10 000 random couples, the share flagged under each tolerance and horizon | Recorded. Rough expectation: mahadasas last 6–20 years, so a 12-month tolerance over a 7-year horizon flags a meaningful minority. A rate near 0% or above 40% means a bug or a wrong window |
| Symmetry | Swapping partners gives the same result | Always |
| Negative run | Set tolerance to 0; the near-pair fixture must stop flagging | Fails as expected |

---

## 8. Muhurta: Kuligai in time windows

**Today.** Every activity the API accepts has a Kuligai polarity (`app/data/kuligai_polarity.py`,
EC-RULING-07, MUH-06), checked 2026-11-09:

- **Favourable:** gold, gems, grain, land, cattle, harvest, sowing, tillage, agriculture start, new
  clothes, new ornament, treasure store, new-grain meal, purchase, investment, spiritual.
- **Adverse:** marriage, all samskaras, education start, Veda study, mantra initiation, snaana, exam,
  job start, travel, medical (`[LINEAGE]`, against Kalaprakasika p. 192), grain expenditure.

So the line "no ruling for this activity has been recorded yet" (`app/services/muhurta_service.py:1571`)
cannot appear today; it only guards a future activity. **The real gap:** an adverse overlap carries a
penalty, but a favourable overlap is *named and not scored* ("the window scorer does not yet carry a
Kuligai term", `muhurta_service.py:1556`).

**Calculation.** Day Kuligai is the slot of sunrise-to-sunset in 8 equal parts given by
`KULIGAI_SLOT`: Sun 7th, Mon 6th, Tue 5th, Wed 4th, Thu 3rd, Fri 2nd, Sat 1st. Night Kuligai splits
sunset to next sunrise by `KULIGAI_NIGHT_SLOT`: Sun 3rd, Mon 2nd, Tue 1st, Wed 7th, Thu 6th,
Fri 5th, Sat 4th. Rulership starts from the lord of the fifth weekday, and Kuligai is Saturn's part
(`app/calculations/panchangam.py:112, 132`; keys are Python weekdays, Mon = 0).
*Corrected in review 2026-11-09:* an earlier draft said "Sat 7th … Fri 1st", which misread key 6
(Sunday) as Saturday. The code was always right. The night rule's derivation is in the code comment,
but it has no page citation. Add one before night Kuligai carries any new weight.

**Decision (owner, product weight).** The size of the favourable bonus. Proposal: the same magnitude
as the adverse penalty, so the two halves of one ruling weigh the same, and capped so Kuligai alone
can never lift a slot that a veto excluded. *Counter-view (review 2026-11-09):* a period that suits
an activity does not have to earn a bonus the same size as the penalty. The alternatives are a
smaller bonus, or naming it as a supporting factor without scoring it (today's behaviour). The owner
picks one of the three.

**Build.** Add `WINDOW_KULIGAI_FAVOURABLE` to the window scorer with the ruled weight. Add a test
that every activity in `SOURCED_ACTIVITIES` resolves to a polarity other than `UNSPECIFIED`, so the
unreachable sentence stays unreachable.

**Measurements.**

| Measure | Pass |
|---|---|
| Kuligai start/end vs Drik Panchang Chennai, 30 days, day and night | Within 2 minutes |
| Polarity coverage | Every accepted activity is FAVOURABLE, ADVERSE or NEUTRALISED | 100% |
| Symmetry | For gold, a Kuligai slot ranks above an otherwise identical non-Kuligai slot; for marriage, below | Both |
| Veto respected | A vetoed slot with a Kuligai bonus stays vetoed | Always |
| Negative run | Set the bonus to 0; the gold ranking test must fail | Fails as expected |

---

## 9. Almanac muhurtham-day lists

**Today.** `web/lib/almanac-muhurtham.ts:69`: "No almanac muhurtham list sourced for this year
yet." The list comes from the printed almanac (Q1: Vasan Suththa Thirukkanidha Panchangam is the
convention authority), so it cannot be computed. Memory notes the 2028 almanac is due around
15 Sep 2027.

**Build (a process, not a formula).**

1. Each year, when the almanac is out: photograph the muhurtham-day pages; enter the list with
   page references; a second person checks every row against the photo. Each sheet records the
   almanac's edition and Tamil year, publisher, page and photo, and **the place its times are
   reckoned for**. A list printed for one meridian is not automatically right for a reader far
   from it.
2. A build gate: from 1 October each year, warn if next year has no sheet; from 1 December, fail.
3. Until a sheet exists, keep today's quiet wording, which tells the reader nothing failed.

**Measurements.**

| Measure | Pass |
|---|---|
| Double-entry check | Two independent entries of the year's list | 0 differences |
| Engine vs almanac | Days the almanac lists vs days the engine rates subha for marriage | Report the agreement rate; every disagreement gets a reason (engine rule, or almanac convention) |
| Deadline gate | Run with next year's sheet removed after 1 Dec | Fails as expected |

---

## Order of work

1. **Item 3, Papasamyam on the Porutham page.** Already computed; the page is missing a check
   families expect. Ship it as report-only under today's weights, labelled as such, while the
   astrologer fills the weight table.
2. **Item 4's medical safety line and item 0's interval guard.** Neither waits on a ruling. Both
   make what is already live safer.
3. **Item 8, Kuligai weight.** One owner decision, small build.
4. **Item 0, finish measurements.** Re-measure the guard after the interval change.
5. **Item 7, Dasa Sandhi.** Pure calculation on data the engine has; ship as a timing caution at
   `engine_inference`. The "same mahadasa lord" check stays a separate observation and is never
   folded into the sandhi.
6. **Items 1, 2, 5, 6.** Each is a ruling plus a small switch. Batch them into one astrologer sheet.
7. **Item 4, muhurta tables.** Largest: sourcing and transcription, one activity at a time, Travel
   and Medical first (most asked).
8. **Item 9.** Yearly; set the gate now.

**Review note (2026-11-09).** An external AI review of this plan was checked against the code. Its
Kuligai concern was a doc error, not a code error. Its other points are folded in above. Its web
links are leads under the ground rules, not citations. Two approvals stay separate for every rule:
the astrologer approves the doctrine, and the tests approve the implementation. A passing test never
promotes a rule's provenance tier.

## Decisions to collect

| # | Decision | From |
|---|---|---|
| 0 | D7 factors, dasa activators, the birth-time threshold | Astrologer |
| 1 | Guru + Ketu: leg, half leg, or watch-note | Astrologer |
| 2 | Definitions of a strong 5th lord and a protecting Jupiter | Astrologer |
| 3 | Papasamyam weights, houses, cancellations, tolerance; score or report | Astrologer; scoring is Owner |
| 4 | Activity mappings (Exam, Job start, Purchase, Investment) and the pages to source | Astrologer |
| 5 | Whether nithya yoga applies beside Amirdhadhi; the portion table | Astrologer |
| 6 | The Eka Nakshatra table and its Rajju interaction | Astrologer |
| 7 | Dasa Sandhi window, tolerance, horizon; dosham or caution | Astrologer |
| 8 | Size of the favourable Kuligai bonus | Owner |
| 9 | Who enters and who checks the yearly almanac list | Owner |

Every new reader-facing Tamil line from these builds goes through the owner's Tamil review sheet,
as in the 2026-11-09 voice rewrite.

---

## Build status, 2026-11-09 (second pass)

Owner rulings taken in this pass: **item 8**, the favourable Kuligai case stays named and
unscored. **Item 7**, engine only: all three windows parameterised, no default, nothing
reader-facing until the astrologer rules (gated by `tests/test_dasa_sandhi.py`).

| # | State | Where |
|---|---|---|
| 0 | Guard now exact: D7 sign at birth time ±2 min from the ephemeris (`check_d7(lagna_bracket=…)`, computed in `_chart_build` only for a formed children's dosham). The 4 min/° average is the fallback when no place is known | `app/calculations/progeny_checks.py`, `app/services/_chart_build.py` |
| 1 | `DoctrineOptions.d6b_guru_ketu` = `watch_note` (default, unchanged) \| `leg`; flag `doctrine_d6b_guru_ketu` | `_yoga_dosham.detect_putra_sarpa_dosham`, `tests/test_d6b_guru_ketu_switch.py` |
| 2 | **Not built.** The detector receives neither Shadbala nor combustion, the afflictor set is ⚖, and Shadbala vs Jagannatha Hora (0.5 rupa) is owed first | — |
| 3 | `papaSamyam` on `/public/compare`, `/relationships/compare` and the vault porutham route, MARRIAGE only, report only (`method: equal_count`, `ratified: false`). Card on the Porutham page and the family synastry panel; section in the porutham PDF; the star-only tools (mobile, marketing calculator) say the check is not run there. Stale comment fixed. **Bug fixed:** the compatibility report counted papa samyam with A as the groom even when the service had resolved A as the bride (F-POR-05 class); the regression test fails with the bug restored | `dosha_samyam.py`, `compatibility_intelligence.py`, `synastry_service.py`, `schemas/relationships.py`, `packages/shared/src/papaSamyam.ts`, `web/components/papa-samyam-card.tsx` |
| 4 | Medical safety line: `safetyNotices: ["medical_doctor_first"]` on every MEDICAL muhurta response (signed-in, personalized, public); worded in `packages/shared/src/muhurtaSafety.ts`; shown on the web picker, the marketing tool and mobile. Never a factor (test compares scores with and without). Star tables: **not built** (sourcing) | `muhurta_service.SAFETY_NOTICES_BY_ACTIVITY`, `tests/test_muhurta_safety_notice.py` |
| 5, 6 | **Not built.** Each needs a sourced table | — |
| 7 | `app/calculations/dasa_sandhi.py`: `transitions`, `sandhi_windows(option, fixed_months)`, `couple_transitions_within(tolerance_days, horizon_years)`, `couple_window_overlaps(option, …)`. Bhukti and pratyantara bounds checked against the closed form; symmetry and tolerance edge exact. **No API, UI, score, dosham, parihara or warning** | `tests/test_dasa_sandhi.py` |
| 8 | Unscored (ruling). Gate: every activity the API accepts has a ruled polarity | `tests/test_kuligai_polarity.py` |
| 9 | Deadline gate: warn from 1 Oct, fail from 1 Dec if next year has no sheet | `muhurtham_naals.sheet_deadline_status`, `tests/test_muhurtham_sheet_deadline.py` |

**Measurements** (`scripts/audit/deferred_checks_measurements.py`, synthetic, seeded). None of
these validates a rule; they are what the rule as coded does.

| Item | Measure | Result |
|---|---|---|
| 0 | Guard share, 20 000 random instants, 0–56°N | 23.4% (0–20N 23.9, 20–40N 23.4, 40–56N 22.8); theory 84 × 4 / 1436 = 23.4% |
| 0 | Old average vs ephemeris | Old trusted a chart that ±2 min actually moves: 2.3% (4.0% at 40–56N); old withheld a stable one: 1.9% |
| 0 | D7 verdicts, declared charts | Putra Sarpa (n 1631): REPEATS 19.2, STRAINED 8.3, SUPPORTS 23.6, MIXED 24.5, UNCERTAIN 24.3. Santhana Thadai (n 1476): 14.0 / 8.1 / 22.7 / 31.8 / 23.4. Both under the 30% REPEATS review line |
| 1 | Putra Sarpa, 10 000 charts | watch_note: confirmed+severe 1.9%, severe 0.1%. leg: 2.3%, 0.1%. 44 charts (0.4%) change grade. Both inside Q16 |
| 3 | Balanced share, 10 000 real-chart couples | 56.6% (ties 13.8%; expected (1 + ties)/2 = 56.9%) |
| 7 | Transition rule, 10 000 couples | 5 y: 2.4% (6 mo), 5.2% (12 mo); 7 y: 3.5%, 7.5% |
| 7 | Window overlap | 5 y: A 6.2%, B 22.3%, C 2.1%; 7 y: A 8.5%, B 29.5%, C 2.9% (A at ±6 months) |

Negative runs done: papa direction (bug restored → fails); Ketu removed from the malefic set
(count drops); safety table emptied (key disappears, scores unchanged); zero sandhi tolerance
(near pair stops flagging); sheet missing after 1 Dec (fails); `d6b` both ways.

**Still owed:** Jagannatha Hora comparison of D7 signs and dasa dates (needs the desktop
program); every ⚖ above; the 2026/2027 muhurtham sheets cite tamildailycalendar.com, a lead
under Q18, so they need the photographed-page process of item 9; whether porutham share
links should carry papa samyam (more chart detail on a public link, A12).

**New Tamil lines for the owner's review sheet** (all in `packages/shared/src/papaSamyam.ts`,
`packages/shared/src/muhurtaSafety.ts`, and the PDF twin in `pdf_export_service._papa_samyam_pdf_lines`):

1. பாப சாம்யம் — heading.
2. சமன்: மாப்பிள்ளையின் பாப கிரக எண்ணிக்கை பெண்ணுடையதற்குக் குறையவில்லை; மரபு இதையே எதிர்பார்க்கிறது.
3. {n} குறைகிறது: மரபுப்படி மாப்பிள்ளையின் பாப கிரக எண்ணிக்கை பெண்ணுடையதற்குக் குறையாமல் இருக்க வேண்டும். இது பல சோதனைகளில் ஒன்று; அனுபவமிக்க ஜோதிடர் இரு ஜாதகங்களின் மற்ற அம்சங்களுடன் சேர்த்து இதைப் பார்ப்பார்.
4. பொதுவான முறையில் எண்ணப்பட்டது: லக்னம், சந்திரன், சுக்கிரன் ஆகிய மூன்றிலிருந்தும் 1, 2, 4, 7, 8, 12ஆம் இடங்களில் உள்ள சூரியன், செவ்வாய், சனி, ராகு, கேது ஒவ்வொன்றுக்கும் ஒரு புள்ளி. உங்கள் ஜோதிடர் வேறு எடைகளில் கணக்கிடலாம். இது பொருத்த மதிப்பெண்ணில் சேர்க்கப்படவில்லை.
5. இரு ஜாதகங்களிலும் பாலினம் குறிப்பிடப்படவில்லை; அதனால் நபர் 1 மாப்பிள்ளையாகக் கொள்ளப்பட்டார். இருவரையும் மாற்றினால் இந்தச் சோதனையின் முடிவு மாறும்.
6. லக்னத்திலிருந்து / சந்திரனிலிருந்து / சுக்கிரனிலிருந்து; இல்லை; கணக்கிட முடியவில்லை.
7. பாப சாம்யம் இங்கு பார்க்கப்படவில்லை. அதற்கு நட்சத்திரம் மட்டும் போதாது, இரு முழு ஜாதகங்களும் தேவை; இரு ஜாதகங்களுடன் இதைப் பார்த்துக்கொள்ளுங்கள்.
8. இந்த நேரக் கணிப்பு திட்டமிட்ட, அவசரமில்லாத சிகிச்சைகளுக்கான பண்பாட்டு வழிகாட்டி மட்டுமே. மருத்துவரின் ஆலோசனையே முதன்மையானது: நல்ல நேரத்துக்காக அவசர சிகிச்சையையோ மருத்துவர் சொன்ன சிகிச்சையையோ தள்ளிப்போடாதீர்கள்.
