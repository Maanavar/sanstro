# Vinaadi AI — Function, Calculation & Scoring Reference

**Audience:** a practising Thirukanitham astrologer asked to verify what this
software actually computes, plus the product and engineering reviewers who have
to act on that verdict.

**Snapshot date:** 2026-08-27
**Review status:** **REVIEWED AND SIGNED, 2026-08-27.** All twelve §7 questions
ruled (`FCR-01` … `FCR-12`); §9 signed at 29 of 30 blocks. Rulings are marked
inline in the sections they touch, so a reader who never reaches §7 still meets
them. Four defects found while ruling are listed in §7.13 and all four are fixed.
Sixteen rulings landed in all (`FCR-01` … `FCR-12`, plus `FCR-10a` … `FCR-10d`
found while verifying the others). **Still open and named as such:**

1. **Per-yoga verdicts** (§9.1 item 1). The *split* the reviewer asked for is
   **done** — `YOG-01` is retired and 32 per-yoga rules now carry their own
   condition sets (§3.6). What is still owed is the reviewer's mark on each. The
   block therefore stays **NOT SIGNED**, but it is no longer an auditability
   gap: it is a queue.
2. **The Porutham share** of Compatibility Intelligence (§9.1 item 4) — a
   positioning call for the owner, not a defect.
3. **Four `[PAGE NEEDED]` rows** — `PN-1`, `PN-3`, `PN-4`, `PN-5` in
   [`VINAADI_PAGE_NEEDED_REGISTER_2026-08-27.md`](VINAADI_PAGE_NEEDED_REGISTER_2026-08-27.md),
   which only the physical books can close. `PN-2` (the Baladi avastha
   multipliers) **closed by relabelling** — the curve is `[PRODUCT]`, the zoning
   stays `[CLASSICAL]`.
**Branch:** `harden/production-readiness`
**Scope:** every calculating function in the engine, the measures each one
consumes, the arithmetic it performs, the number or band it emits, and the
screen that number reaches. Pure UI, database and auth plumbing are out of scope.

**Companion documents.** This file answers *what is computed and how it is
scored*. Two neighbours answer different questions and are not duplicated here:

| Document | Answers |
|---|---|
| [`VINAADI_ASTROLOGY_RULEBOOK_FOR_EXTERNAL_REVIEW.md`](VINAADI_ASTROLOGY_RULEBOOK_FOR_EXTERNAL_REVIEW.md) | Rule-by-rule doctrine checklist with stable IDs (`PAN-07`, `GO-10`, …) for marking Correct / Incorrect / Variant |
| [`VINAADI_RULEBOOK_TABLE_APPENDIX.md`](VINAADI_RULEBOOK_TABLE_APPENDIX.md) | Every lookup table printed in full, generated from the constants the engine evaluates |
| [`VINAADI_DASHBOARD_SYSTEM_REFERENCE_2026-08-25.md`](VINAADI_DASHBOARD_SYSTEM_REFERENCE_2026-08-25.md) | Screen-by-screen product behaviour, architecture, tiers |

Where this document names a rule ID, it is the rulebook's ID. Where it names a
file and function, that is the executable definition and outranks any prose.

---

## 0. How to review this document

Every computed item below carries one of five markers. **A reviewer's job is to
challenge the first two and to confirm that the last three are honestly
labelled** — the most common failure in astrology software is a product
calibration wearing a shastra label.

| Marker | Meaning | What a reviewer should do |
|---|---|---|
| **[CLASSICAL]** | An implemented traditional rule or printed table | Check it against your source. Name the book, edition and page for any correction |
| **[LINEAGE]** | A real practice, but one that differs by school; we picked one and disclose it | Tell us whether your lineage agrees, and what it does instead |
| **[PRODUCT]** | Vinaadi's own arithmetic — a weight, a band cutoff, a normalisation. No classical authority claimed | Judge the *direction* and the *relative magnitude*, not the exact number |
| **[MEASURE]** | A count or a coordinate, not a judgement (a longitude, a bindu, a duration) | Check the method, not the meaning |
| **[LIMIT]** | Present but simplified, or deliberately not used for prediction | Tell us if the simplification is unsafe |

Two markers on one item is deliberate, not indecision. Several rules are a
traditional principle wrapped in our arithmetic, and marking the whole thing
`[CLASSICAL]` would claim source authority for our own weights.

---

## 1. The system in one page

Vinaadi is a Tamil Thirukanitham (drik-ganita) astrology platform: a signed-in
web dashboard, a mobile app, a public marketing site with free calculators, and
a FastAPI backend that does all the astronomy and all the judging.

- **Ephemeris:** Swiss Ephemeris, sidereal, **Lahiri ayanamsa**.
- **Nodes:** **mean node**. Ketu is always exactly 180° from Rahu.
- **Houses:** **whole sign** (bhava = rasi) for every primary reading.
- **Primary timing language:** **Vimshottari** dasha, five levels deep.
- **Primary transit reference:** **Janma Rasi** (natal Moon sign); Lagna is
  supplemental, never a replacement.
- **Sunrise:** Hindu sunrise — geometric rising of the **centre of the solar
  disc, no refraction** (`SE_BIT_HINDU_RISING`). This anchors every
  sunrise-dependent almanac rule.
- **Language:** fully bilingual Tamil / English, one language at a time.
- **No LLM in the calculation path.** Every number and every sentence in the
  reading surfaces is produced by deterministic code from computed values. The
  only model call in the product is the optional "Ask Vinaadi" free-text
  question feature, and it is fed the already-computed chart as context.

### Code scale

| Layer | Files | Notes |
|---|---|---|
| `app/calculations/` | 61 modules | Pure astrology. No database, no HTTP, no clock except what is passed in |
| `app/reasoning/` | 6 modules | The promise-gate / timing-vote / band machinery |
| `app/services/` | 94 modules | Orchestration, narration, persistence, gating |
| `app/api/` | 48 routers, ~180 endpoints | The HTTP surface |
| `app/data/` | 17 modules | Sourced rule tables (Kalaprakasika chapters, almanac grids, corpora) |
| `tests/` | 204 test modules | Includes doctrine-invariant and disclosure-boundary gates |

---

## 2. The pipeline

Everything in the product is one of these fourteen layers, or a presentation of
one. Layers only ever read downward.

```
L0  Astronomy          Swiss Ephemeris → sidereal longitudes, speeds, rise/set
L1  Chart construction Rasi, nakshatra, pada, Lagna, whole-sign houses
L2  Strength & dignity Dignity ladder, six-bala blend, Bhava Bala, full Shadbala
L3  Divisional charts  D2 D3 D4 D7 D9 D10 D12 D16 D20 D24 D27 D30 D40 D45 D60
L4  Ashtakavarga       Bhinna (per graha) → Sarva (aggregate) → derived readings
L5  Yogas & doshams    ~30 yoga detectors, 9 dosham detectors, cancellation rules
L6  Dasha systems      Vimshottari (primary) + 5 secondary/conditional systems
L7  Gochar             Transit house scoring, Vedha, Sani cycles, peyarchi
L8  Panchangam         Five limbs as timed spans + kalams + Gowri + hora + festivals
L9  Muhurta            Sourced activity rules → factor list → day score → window
L10 Compatibility      10-porutham, Nadi, synastry, 8-layer marriage intelligence
L11 Numerology         Chaldean core → chart alignment → naming, timing, matching
L12 Reasoning          Promise GATE → timing VOTE → ordinal Band (never a raw %)
L13 Narrative          Deterministic bilingual text from computed values
L14 Disclosure         Age gates, life-phase gates, tone filter, safety filter
```

---

## 3. Function inventory, layer by layer

### 3.1 L0 — Astronomy (`app/calculations/ephemeris.py`, `astro.py`)

| Function | What it computes | Marker |
|---|---|---|
| `set_lahiri_ayanamsa()` | Pins the sidereal mode to Lahiri for the process | [CLASSICAL] |
| `get_lahiri_ayanamsa_ut(jd)` | Ayanamsa value at an instant | [MEASURE] |
| `calculate_sidereal_planets(jd)` | Nine grahas: sidereal longitude, speed, retrograde flag, rasi, degree-in-rasi | [MEASURE] |
| `calculate_lagna_degree(jd, lat, lon)` | Ascendant longitude for the birth place | [CLASSICAL] |
| `calculate_asc_mc(jd, lat, lon)` | Ascendant + Midheaven (used by Dig Bala) | [MEASURE] |
| `calculate_rise_transit_jd(...)` | Sunrise / sunset by **Hindu rising** flags | [CLASSICAL] |
| `sun_longitude_at_jd`, `saturn_longitude_at_jd` | Single-body helpers for boundary bisection (Sankranti, Saturn ingress) | [MEASURE] |
| `astro.rasi_from_degree` / `nakshatra_from_degree` / `pada_from_degree` | 30° / 13°20′ / 3°20′ divisions | [CLASSICAL] |
| `astro.house_from_reference(ref_rasi, target_rasi)` | Whole-sign count, 1-based inclusive — the single house function used by every layer | [CLASSICAL] |
| `astro.navamsa_rasi_from_degree` / `..._from_nakshatra_pada` | D9 by the corrected movable/fixed/dual start rules | [CLASSICAL] |
| `astro.local_datetime_to_utc` / `utc_datetime_to_julian_day` | Birth time → UTC → JD, via IANA timezone | [MEASURE] |

**Declared choice, `CORE-02`.** The mean node is used because classical
computation, the Vakya tradition and most Tamil practice use it, and because
Rahu is doctrinally always vakri. **Caveat printed in the source:** Jagannatha
Hora defaults to the *true* node, so a reader comparing against out-of-the-box
JHora will see Rahu/Ketu differ by up to ~1.5°, occasionally crossing a pada
boundary and therefore shifting a Vimshottari start. Do not cite JHora as
supporting our choice.

---

### 3.2 L1 — Chart construction (`app/services/_chart_build.py`, `_chart_planets.py`)

Produces the persisted chart snapshot every other layer reads: nine grahas with
rasi / nakshatra / pada / degree / retrograde / combust / vargottama / D9 rasi /
strength score; Lagna; Mandhi (Gulika); all 12 bhavas; the varga maps; the
Ashtakavarga grid; the yoga and dosham lists; the Vimshottari timeline.

Birth-time quality is carried as a first-class field. When the birth time is
unknown or approximate, Lagna is marked uncertain and Lagna-dependent readings
are suppressed rather than silently computed (`CORE-08`).

**Birth-condition detection** (`birth_conditions.py`) — [CLASSICAL] with
[PRODUCT] penalties:

| Condition | Test | Effect |
|---|---|---|
| Grahana (eclipse) birth | Sun/Moon within eclipse proximity at birth | Luminary strength penalty **10.0** |
| Sankranti birth | The Sun changes rasi during the birth civil day | Sun strength penalty **5.0** |
| Dagda rasi | Tithi-derived burnt-sign table | Flagged, not scored |

---

### 3.3 L2 — Strength and dignity (`chart_strength.py`, `shadbala.py`)

This is the most consequential layer in the product: three other scores read it.

#### 3.3.1 The dignity ladder — `_dignity_score` [CLASSICAL]

| Placement | Value |
|---|---|
| Exalted | 100 |
| Moolatrikona (within the stated degree zone) | 90 |
| Own sign | 80 |
| Friend's sign | 60 |
| Neutral | 50 |
| Enemy's sign | 35 |
| Debilitated | 15 |

Moolatrikona zones are per-graha degree ranges, not whole signs. **One disclosed
divergence:** the Moon's zone is coded 4°–30° Taurus; some sources (BPHS among
them) give 3°–30°.

> **RULED `FCR-11`, 2026-08-27 — 4°–30° kept, and a larger defect found behind
> the question.** The Moon's exaltation *point* is 3° Taurus and Moolatrikona
> begins after it, so 3°–30° would overlap the point it follows. But the degree
> was the smaller half. `_dignity_score` tested exaltation at **whole-sign**
> granularity and returned 100 before reaching the Moolatrikona branch — and for
> the **Moon (Taurus) and Mercury (Virgo) the exaltation sign *is* the
> Moolatrikona sign**, so those two rungs were unreachable. The 26 degrees from
> 4° to 30° Taurus over-scored the Moon by 10 dignity points; the upper half of Virgo
> over-scored Mercury by 10 or 20. Roughly one chart in twelve carries a Moon in
> Taurus, and dignity carries 0.30 of the composite. Exaltation is now
> degree-bounded for exactly those two grahas. **The rule to remember: a graha
> whose exaltation sign is also its Moolatrikona sign must be zoned by degree, or
> the lower rung is dead code.**

#### 3.3.2 Naisargika maitri [CLASSICAL] for the seven, [LINEAGE] for the nodes

The seven-graha core is the classical Parashari table and is derivable from the
Moolatrikona rule. Its asymmetries are doctrine, not bugs (Moon regards Mercury
a friend; Mercury regards Moon an enemy). **The Rahu/Ketu rows are not
Parashari** — classical naisargika maitri has no node entries at all — and
follow common Tamil practice. They can never reach `_dignity_score` because a
node never acts as a sign lord; they are read only for graha-to-graha regard
(dasha harmony, compatibility). Two node asymmetries were called out for ruling
in the rulebook (`STR-01`).

> **RULED `FCR-02`, 2026-08-27 — `STR-01` closed. There were three, not two.**
> The principle: a classical naisargika asymmetry is *derived*, never asserted —
> every seven-graha asymmetry falls out of the Moolatrikona arithmetic, which is
> what makes Moon/Mercury doctrine. **The nodes have no Moolatrikona sign, so no
> node asymmetry can be derived from anything**, and each one is an accident by
> construction. A sweep of all 9×9 ordered pairs found a third the review had
> not named: **Rahu held Saturn a friend while Saturn listed neither node.** That
> was the costly one — Saturn carries the heaviest weight in the daily transit
> component. All three are now symmetric (Ketu/Rahu enemy, Ketu/Mars friend,
> Rahu/Saturn friend) and a test asserts node symmetry directly.

#### 3.3.3 Avastha [CLASSICAL] zoning, [PRODUCT] multipliers

Three classical avastha schemes are computed and displayed:

- **Baladi** (5-stage, 6° zones, reversed in even signs) — also supplies the
  multiplier `_avastha_multiplier` used by the composite score
  (0.50/0.75/**1.00**/0.65/0.25 odd; reversed even).

  > **The zoning is classical; the five multipliers are not** — relabelled
  > `[PRODUCT]` 2026-08-27, closing §9.1 item 2. The 6° zones, the Bala→Mrita
  > order and the even-sign reversal are BPHS and are signed. The curve is
  > ours: the texts give fractions of effect — broadly a quarter, a half, full,
  > little, nil — and differ among themselves at the tails, where ours doubles
  > the infant and floors the dead at 0.25 rather than nothing. The smoothing is
  > deliberate and was **kept**, not corrected: a graha should not fall off a
  > cliff at 24°01′, and a zero would erase a graha from a score it is only one
  > input to. What was wrong was the label, which put a product judgement inside
  > a `[CLASSICAL]` block. Reach: avastha scales 0.60 of sthana, which carries
  > 0.30 of the composite — about **4–5 points of a 10–95 score at the tails**,
  > on the ~40% of grahas sitting in a first- or last-6° zone in any chart.
  > A `[CLASSICAL]` label returns only with printed fractions —
  > [`PN-2`](VINAADI_PAGE_NEEDED_REGISTER_2026-08-27.md).
- **Jagradadi** (3-stage, 10° thirds, reversed in even signs).
- **Deeptadi** — a **relabelling of the dignity ladder**, not an independent
  calculation. Three of the nine classical rungs (Shanta, Vikala, Kopa) are
  **never produced** because this scorer has no varga-placement or combustion
  input at that point. Documented as a simplification, not claimed complete.

#### 3.3.4 The composite natal graha strength — `compute_natal_planet_score` → **10–95** [PRODUCT] built on [CLASSICAL] parts

This is the number a reader sees as "Guru — 71/100" on the Jadhagam screen. It
is explicitly **not** Shadbala (`CORE-12`); Shadbala is computed separately (§3.3.6).

**Step 1 — six weighted balas.**

| Bala | Weight | Definition |
|---|---|---|
| Sthana (positional) | **0.30** | `(dignity × avastha × 0.60 + house_strength × 0.40) / 100` |
| Dik (directional) | **0.15** | Distance from the graha's dik-peak house, linear to 0 at 6 houses. Peaks: Sun/Mars 10, Jupiter/Mercury 1, Moon/Venus 4, Saturn 7 |
| Kala (temporal) | **0.15** | `natha × 0.50 + paksha × 0.30 + D9-tier bonus × 0.20`. Nathonnatha: day-strong Sun/Jupiter/Venus, night-strong Moon/Mars/Saturn, Mercury always 0.7 |
| Chesta (motional) | **0.15** | Retrograde = **1.0**; direct at normal speed 0.6; slow 0.4; fast 0.5; Sun/Moon fixed 0.5; nodes 0.6 |
| Naisargika (natural) | **0.10** | Fixed per-graha constant, Sun strongest → Saturn weakest |
| Drik (aspectual) | **0.15** | `0.5 + 0.15 × benefic aspects − 0.15 × malefic aspects`, clamped 0–1 |

House strength inside sthana: kendra (1/4/7/10) **80**, trikona (5/9) **75**,
(2/11) **65**, (3/6) **55**, dusthana (8/12) **25**.

**Step 2 — modifiers, in this order:**

| Modifier | Points | Note |
|---|---|---|
| Vargottama | **+4.0** | |
| D9 dignified | **+5.0** | *Gated on natal dignity being exactly 50* — a tie-breaker for an average graha, not a top-up for one already exalted |
| D9 debilitated | **−5.0** | Deliberately **not** gated — the case that most needs it is rasi-exalted + navamsa-neecha. Vargottama is exempt |
| Cazimi (within 0°17′ of the Sun) | **+10.0** | Overrides combustion entirely |
| Combustion | up to **−22.0** | A **gradient**, scaled by `combustion_severity` from full at the cazimi boundary to zero at the orb edge. Per-graha orbs, separate direct and retrograde values |
| Rasi sandhi (≤1° or ≥29° in sign) | **−8.0** | |
| Gandanta | **−10.0** | |
| Graha yuddha (lost a planetary war) | **−15.0** | War = two non-luminary, non-node grahas within 1°; loser is the one trailing in the short forward arc |

**Step 3 — clamp to 10–95 and publish the breakdown.**

`explain_natal_planet_score` returns the score **plus a signed contribution list
that always sums to the published number** — a synthetic `clamp` term absorbs
rounding and the clamp so the arithmetic cannot fail to add up on screen. This
exists because a bare 0–100 with no visible derivation is the single largest
source of "your number is wrong" complaints.

**Two corrections already made here, worth confirming you agree with:**

1. **Retrogression is rewarded once, not twice.** A flat +8 for retrograde used
   to sit on top of Chesta Bala already returning its maximum. That made
   retrogression worth ~+14 against a maximum combustion penalty of −22, and a
   combust *and* retrograde 6th-lord Mercury surfaced as the chart's strongest
   graha. An astrologer review flagged it as not defensible (2026-07-18); the
   flat bonus was removed. Chesta Bala **is** the vakra-graha-is-strong rule.
2. **Venus–Rahu / Venus–Ketu.** Venus's enemy row listed both nodes while both
   node rows listed Venus a friend. Not an asymmetry — a contradiction, and two
   consumers resolved it two different ways. Resolved toward **friend**, per the
   Tamil practice table the node rows came from.

#### 3.3.5 Bhava Bala — `compute_bhava_bala` → **0–100** [PRODUCT]

A house's strength is not just its lord's:

`bhavadhipati (lord's own score) × 0.50 + occupant × 0.25 + drishti × 0.25`

Occupant and drishti each start at 50 and move ±10 / ±8 per benefic / malefic,
using the shared special-aspect table. **Mandhi/Gulika participates as a
malefic** for occupancy and aspect.

#### 3.3.6 Full classical Shadbala — `compute_shadbala` [CLASSICAL] [LIMIT]

A separate, additive, **experimental-labelled** engine that does not replace
§3.3.4. Output is in **Virupas** (60 Virupa = 1 Rupa), converted to Rupas and
compared to the required-Rupas table (Sun 6.5, Moon 6.0, Mars 5.0, Mercury 7.0,
Jupiter 6.5, Venus 5.5, Saturn 5.0) for a classical pass/fail verdict.

Sub-balas implemented: Uchcha, Saptavargaja (compound relationship over seven
vargas), Oja-Yugma, Kendradi, Drekkana; Dig; Nathonnatha, Paksha, Tribhaga,
Vara, Hora, Ayana (true declination from longitude + obliquity); Chesta; Drik;
Naisargika.

**Deliberately omitted rather than guessed** — Abda and Masa Bala (need
ahargana-derived year/month lords), and Yuddha Bala (needs apparent disc
diameters). Those omissions make the total a **floor** on classical Shadbala,
which is why it ships behind an experimental label pending Jagannatha Hora
cross-validation. Rahu/Ketu are excluded — they have no classical Shadbala.

#### 3.3.7 Holistic strength synthesis — `apply_holistic_synthesis` [PRODUCT], flag-gated

A second pass adding four *relational* measures the per-graha blend omits:
functional lordship (Yogakaraka +7 … Dusthana −6), yuti graded by the
companion's nature and strength, neecha bhanga (+14), and aspect relief weighted
by the aspecting graha's own strength. **The net delta is capped** so it refines
and can never dominate the six balas — a graha weak on the balas cannot be
inflated to "strong" by relationships alone.

---

### 3.4 L3 — Divisional charts (`divisional_charts.py`, `d9_chart.py`)

`compute_d2 d3 d4 d7 d10 d12 d16 d20 d24 d27 d30 d40 d45 d60` plus D9 from
`astro.navamsa_rasi_from_degree`, and a `get_varga(name, …)` router. [CLASSICAL]

Vargottama is detected wherever D1 and the relevant varga agree.
Vargas are consumed by: Shadbala's Saptavargaja, the promise gate's
varga-confirmation term, the D9 dignity modifier, marriage (D9) and career (D10)
routing, and the navamsa compatibility layer.

---

### 3.5 L4 — Ashtakavarga (`ashtakavarga.py`, `bav_derived.py`)

- `compute_bhinnashtakavarga(natal_rasi_map)` → `{graha: {rasi: bindus 0–8}}`
  for the **seven** classical grahas, from eight reference points each
  (seven grahas + Lagna). [MEASURE] [CLASSICAL]
- `compute_sarvashtakavarga(bav)` → per-rasi total 0–56. [MEASURE]
- `get_av_bindu(bav, graha, rasi)` → bindus **or `None`**.

**Ruling A-15 (2026-08-19), material to any transit score.** Rahu and Ketu have
no Bhinnashtakavarga table and **we no longer invent one**. The code previously
substituted **Saturn's table** for both nodes, attributed in a comment to
"common Thirukanitham practice" — an attribution nothing in the repository
sourced. A different pairing was explicitly *not* adopted in its place: the
failure was never which graha was borrowed, it was borrowing without a source.
A second defect fell out of this — the old neutral default of 4 was read by every
caller as "supportive, worth +8", so the neutral value was quietly a bonus.

> **Documentation defect found while writing this review — FIXED 2026-08-27.**
> The module-level comment at `app/calculations/ashtakavarga.py:115-117` read
> *"For Rahu/Ketu transit scoring, Saturn's table is used as a proxy."* The
> executing code (`get_av_bindu`, same file) does the opposite and returns
> `None`. The **code was correct and the comment was stale**, describing
> behaviour the module had already deleted. Removed, and replaced with a pointer
> to the `A-15` ruling on `get_av_bindu` so the next reader finds the doctrine
> rather than its ghost.

#### Karaka-relative indications — `bav_derived.py` [CLASSICAL] rules, [PRODUCT] bands

Four readings counted from a **karaka graha's own rasi**, not from Lagna:

| Key | Karaka | Bhava from karaka | Domain | Baseline |
|---|---|---|---|---|
| progeny | Guru | 5th | Children | 4.00 |
| siblings | Sevvai | 3rd | Family | 2.67 |
| maternal | Budhan | 4th | Family | 3.83 |
| paternal | Suriyan | 9th | Family | 4.33 |

Output is a **band** (strong / neutral / thin) with a ±1-bindu margin, **never a
count of children, siblings or relatives**, even though the sutras are often
quoted as giving exact counts. Baselines differ per rule because the grahas' BAV
totals differ (Guru 56, Budhan 54, Suriyan 48, Sevvai 39) — a flat cut called
74% of sibling indications "thin" purely as an artefact of Sevvai's small table.

> **RULED `FCR-01`, 2026-08-27 — from the karaka, confirmed. The Budhan rule
> stands; the reason recorded for it was backwards.** The file said the Budhan
> rule "deliberately replaces the weaker Moon-BAV-4th formulation" because the
> Moon variant "conflates the mother with her siblings." It is the other way
> round. **Budhan is mātula-kāraka — kāraka of the mother's *brother*.**
> Chandran is mātṛ-kāraka, kāraka of the mother herself, and the exact
> counterpart of Suriyan as pitṛ-kāraka in the 9th-from-Suriyan rule beside it.
> The two are **different classical rules, not competing formulations of one**;
> neither displaces the other, and a Chandran-4th mother rule may still be added.
> What shipped is right — what was wrong was believing a choice had been made.
> Sukran-7th (spouse) and Sani-8th (longevity) stay unbuilt, and both exclusions
> are affirmed.

**Disclosure boundary, enforced by a test.** The bindu *grid* is chart
arithmetic and shown ungated, like a rasi chart. These four *readings* speak
about a person and reach a surface only through `disclosable_indications()`,
gated on the life-area age band, the life-phase gate, the propensity band and
the declared-fact gate. Progeny discloses **only** its supportive band — the
thin band is withheld, because discouraging fertility content belongs to the one
disclaimed surface built for it.

---

### 3.6 L5 — Yogas and doshams

**Yoga detectors** (`_yoga_detect.py`, `yogas.py`) — **20 detector functions**
(19 yogas plus a nakshatra-caution detector) emitting **30 yoga codes**: Gaja
Kesari, Raja Yoga, Dhana Yoga, Neecha Bhanga, Pancha Mahapurusha (all five in
one detector), Budha Aditya, Vipareetha Raja, Parivartana, Chandra Mangala,
Sakata, Kemadruma, Kartari (papa/shubha), Chandala, Amala, Adhi, Daridra,
Lakshmi, Sunapha/Anapha/Durudhura, Vasumati.
`yogas.detect_yogas_and_doshams` is the single entry point that runs them all.

> **`YOG-01` is split, 2026-08-27 — the gap this section carried is closed.**
> One rulebook ID covering twenty definitions is now **32 per-yoga rules** in
> `app/calculations/yoga_rules.py` — `YOG-GK-01`, `YOG-RY-01` … `YOG-NKC-03`,
> plus `YOG-ACT-01` for the activation arithmetic. Each carries its own presence
> test, strength ladder, cancellation set, marker and source, printed in full in
> [the table appendix](VINAADI_RULEBOOK_TABLE_APPENDIX.md) and pinned to the
> emitted codes by `tests/test_yoga_rules.py`. **Raja Yoga became three rows** —
> the association formulation we implement, the exchange formulation we also
> implement, and a `[LIMIT]` row naming the ones we do not, so their absence is
> auditable rather than invisible. Pancha Mahapurusha became five.
>
> **This is the split, not the verdict.** §9's yoga row stays **NOT SIGNED**
> until each rule is marked individually — that is what the reviewer asked for.

Writing the rows out surfaced three things the blanket ID had been covering, all
recorded rather than quietly changed:

| Finding | Rule | Status |
|---|---|---|
| **Adhi Yoga fires on one benefic** where the classical rule wants the three as a set, and grades by *houses* covered rather than *benefics* placed — so it is present on most charts. The loosest presence test in the set | `YOG-AD-01` | Held for a ruling. Tightening a presence test removes a yoga from charts that show it today — a doctrine call, not a bug fix |
| **Dhana Yoga's third condition has no classical parent.** "Both wealth lords in a kendra/trikona" is a Vinaadi proxy, and it is much the commonest of the three conditions | `YOG-DN-01` | Held for a ruling, together with whether the classical set should widen to the 5th and 9th lords |
| **The activation table was keyed on names the detectors never emit.** `GAJA_KESARI` was looked up for a code emitted as `GAJA_KESARI_YOGA`; `PANCHA_MAHAPURUSHA_MARS` for a code emitted as `RUCHAKA_YOGA`. Nine yogas — Gaja Kesari, Budha Aditya, Vipareetha Raja, Chandra Mangala and all five Pancha Mahapurusha — matched nothing, counted as never dasha-activated, and were capped at 45% of their base score whatever dasha ran | `YOG-ACT-01` | **Fixed.** A live defect, not a classification question. The table is now derived from the rule rows, so the key *is* the emitted code |

**Fifteen** of the 27 scored yoga codes legitimately declare no key grahas and
stay dormant-capped: Parivartana, Sakata, Kemadruma, the three Kartari codes,
Chandala, Amala, Adhi, Daridra, Lakshmi, the three Chandra yogas
(Sunapha/Anapha/Durudhura) and Vasumati. That is disclosed per rule in the
appendix's activation column rather than fixed here — choosing a key graha for a
yoga that has none is a doctrine call, not a code fix. The three nakshatra
cautions are not scored at all.

**Dosham detectors** (`_yoga_dosham.py`) — **8 detector functions** (plus a
`get_badhaka_lord` helper); Nadi is detected in the porutham module, §3.11:

| Dosham | Method | Marker |
|---|---|---|
| Sevvai (Chevvai/Kuja) | Mars in 1/2/4/7/8/12 counted from **all three references independently — Lagna, Moon and Venus**; a hit from any one raises it, and the read-out records which fired. Severity weighted by gender (female 4/8/12, male 2/7/8), reduced by own-sign/exalted Mars, Kadagam and Simmam yogakaraka Lagnas, Mars-as-Lagna-lord in 1st/2nd for Mesham/Viruchigam, benefic association, and a house-specific nivarthi table. Two uncancelled charts cancel each other | [CLASSICAL] |
| Rahu-Ketu marriage attention | Nodes in 1/2/7/8 | [CLASSICAL] |
| Kala Sarpa | Judged on **actual longitude**, over the **seven grahas only**, Lagna not required inside the arc, **no degree tolerance** at node ends. A graha exactly on a node qualifies but the boundary is **disclosed**, not silently resolved. Direction recorded (`ANULOMA` / `VILOMA`) but **never used to disqualify** — some schools name the reverse enclosure "Kala Amrita"; we do not bake that in | [CLASSICAL] + [LINEAGE] |
| Pitru | Sun/Moon–node afflictions in the 9th axis | [CLASSICAL] |
| Kalathra | 7th-house affliction set | [CLASSICAL] |
| Marana Karaka Sthana | Per-graha fatal-house table | [CLASSICAL] |
| Putra Sarpa | 5th-house node affliction | [CLASSICAL] |
| Badhaka | Badhaka lord by movable/fixed/dual Lagna | [CLASSICAL] |
| Nadi (in porutham) | See §3.11 | [CLASSICAL] |

**Yoga activation** — `yoga_activation_score` → **0–100** [PRODUCT]. A yoga is a
standing promise; this converts presence into *timed intensity*:

```
if not present                    → 0
strength_base = STRONG 75 | MODERATE 55 | PARTIAL 40 | WEAK 25
if no key planet is maha/antar    → round(strength_base × 0.45)      (dormant)
else                              → strength_base × 0.60 + best_key_planet_score × 0.40
clamped 10–100
```

---

### 3.7 L6 — Dasha systems

#### Vimshottari (`dasha.py`) — primary [CLASSICAL]

- Cycle 120 years: Ketu 7, Venus 20, Sun 6, Moon 10, Mars 7, Rahu 18,
  Jupiter 16, Saturn 19, Mercury 17.
- Opening lord = the Moon's birth-nakshatra lord; **balance is proportional to
  the nakshatra portion remaining at birth**.
- Nakshatra size held as exactly `40/3` degrees; year length `365.25` days.
- Five levels computed: maha → antar → pratyantar → sookshma → prana, each a
  proportional subdivision in the same order.
- Two full cycles (~240 years) are generated so long-range projection works.

#### Secondary systems [LIMIT]

| System | Module | Status |
|---|---|---|
| Ashtottari (108y) | `ashtottari_dasha.py` | Computed when its eligibility rule is met |
| Yogini (36y) | `yogini_dasha.py` | Computed |
| Kalachakra | `kalachakra_dasha.py` | **Experimental** label |
| Conditional dashas | `conditional_dashas.py` | Seven, each with an `evaluate_applicability` gate |
| Jaimini Chara | `jaimini_dasha.py` | **`DAS-07`: not used for interpretive output** until the full BPHS / K.N. Rao rule set (direction, own-sign length, Scorpio/Aquarius dual-lord resolution) is confirmed |

`DAS-06` is a standing rule: a secondary system may be displayed but **must
never silently override the primary Vimshottari reading**.

#### Jaimini Chara Karakas (`jaimini_karakas.py`) [LINEAGE]

8-karaka scheme including Rahu, ranked by degrees traversed, with **Rahu's
reverse degree** (`30° − degrees traversed`). Karakamsa from the Atmakaraka's D9
rasi. `DAS-08` asks you to confirm this standard before any public
interpretation is built on it.

#### Dasha activation (`dasha_activation.py`) [CLASSICAL]

A dasha lord "connects" to a life area by **lordship, aspect on the bhava,
dispositorship, or node agency** — not merely by occupying a relevant house,
which was the old and much weaker rule.

#### Maturation (`maturation.py`) [CLASSICAL]

`maturation_multiplier(planet, age)` — the classical graha-maturity ages, used
to damp a dasha result for a graha that has not yet matured.

---

### 3.8 L7 — Gochar and Saturn cycles (`transits.py`, `sade_sati.py`, `double_transit.py`)

| Function | Computes | Marker |
|---|---|---|
| `is_combust` / `combustion_severity` | Per-graha orbs with **separate direct and retrograde values**; severity is a 0–1 gradient | [CLASSICAL] |
| `is_cazimi` | Within 0°17′ | [LINEAGE] — a Tajika import, but classical usage flips a tightly conjunct graha from weak to fortified |
| `is_gandanta` | Six junction ranges | [CLASSICAL] |
| `check_vedha` | Transit-house obstruction, with documented Sun–Saturn and Moon–Mercury exemption pairs. **A vedha does not zero a transit — it reduces its contribution to 25%** | [CLASSICAL] |
| `get_jupiter_aspects` / `get_saturn_aspects` / `get_mars_aspects` | Special aspects: Mars 4/7/8, Jupiter 5/7/9, Saturn 3/7/10, others 7th | [CLASSICAL] |
| `classify_sani_cycle(house_from_moon)` | Janma Sani, Ezharai phases 1–3, Ardhashtama (4th), Ashtama (8th) — **all counted from the Janma Rasi** | [CLASSICAL] |
| `classify_kandaka_cycle(house_from_moon)` | Saturn in the **4th, 7th or 10th from the Janma Rasi** | [LINEAGE] |
| `classify_ezharai_sani_murthi_ingress(janma_rasi, ingress_moon_rasi)` | Moorti at Saturn's **rasi ingress instant**: 1/6/11 Swarna, 2/5/9 Rajata, 3/7/10 Tamra, 4/8/12 Loha | [CLASSICAL] table, [LINEAGE] application |
| `find_saturn_ingress_jd` / `find_saturn_egress_jd` | Bisection to the exact ingress/egress instant | [MEASURE] |
| `score_double_transit(...)` | **−10 … +15** | [CLASSICAL] principle, [PRODUCT] numbers |

**Kandaka is a layered name, not a separate axis** (ruling A-1, 2026-08-19).
Saturn in the 4th from the Janma Rasi is Ardhashtama Sani *and* Kandaka Sani;
the reader is told both, **but the score is applied once**. Vinaadi previously
reckoned Kandaka from Lagna over the four kendras specifically so no overlap
could occur — that tidiness was an engineering preference, not a source, and it
selected a nearly disjoint population. Every surface labels it
"Kandaka Sani (from Janma Rasi) / கண்டக சனி (ஜென்ம ராசி)" so the reference is
disclosed and never implied to be universal. `tests/test_rulebook_invariants.py`
pins the code to 4/7/10 from the Janma Rasi.

**Double transit scoring** [PRODUCT numbers]:

| Condition | Score |
|---|---|
| Saturn occupies the house **and** Rahu occupies it | **−10** |
| Saturn occupies it with no Jupiter support | **−5** |
| Jupiter occupies it and Saturn connects (or the reverse) | **+15** |
| Jupiter aspects it | **+10** |
| Either Jupiter or Saturn connects | **+5** |
| Neither | **0** |

#### Sade Sati segmentation — `sade_sati.py` [CLASSICAL], EC-RULING-05

Replaced a flat penalty applied to every native for all seven and a half years.
The traditional month-by-month division over ninety months:

| Months | Grade |
|---|---|
| 1–16 | **DIFFICULT** |
| 17–51 | **FAVOURABLE** (the source's own point in citing the table is that the whole period is *not* adverse) |
| 52–56 | MIXED |
| 57–60 | **ACUTE** — the short window closing Janma Sani |
| 61–90 | MIXED |

Phase index by Saturn's house from the natal Moon: 12th = first (Viraya),
1st = second (Janma), 2nd = third (Pada). The **position within a phase comes
from the real ingress instant**, not from table arithmetic.

Mitigations (`assess_mitigation`) — natal Saturn dignified (own 10/11 or exalted
7), natal Saturn well placed (3/6/10/11), and the transited sign's SAV above
**30 bindus**. Each mitigation lifts one penalty point, **floored at 1** — a
mitigated cycle is lighter but never free.

`FIFTH_HOUSE_IS_UNTOUCHED` — across all three positions Saturn occupies during
the cycle, the 5th from the natal Moon is neither occupied nor aspected. This is
**verified by aspect arithmetic in a test**, not asserted, and is used as a
bounded reassurance insight.

> **Standing engine rule:** Sade Sati is a full-chart transit judgement. It
> **never** becomes a porutham or marriage-compatibility veto at any severity
> tier. `tests/test_sade_sati.py` asserts the module separation directly.

---

### 3.9 L8 — Panchangam (`panchangam.py`, `tamil_calendar.py`, `festivals.py`)

The single largest calculation module (~2,400 lines). Location-specific,
anchored at local Hindu sunrise.

#### The five limbs, as **timed spans** — not as instants [CLASSICAL] + doctrine R-1

| Limb | Formula |
|---|---|
| Tithi | `floor(((moon − sun) mod 360) / 12°)` → 30 tithis; Shukla 1–15, Krishna 16–30 |
| Nakshatra | Moon's sidereal longitude ÷ 13°20′ |
| Yoga | `((sun + moon) mod 360)` ÷ 13°20′ — a **sum**, not the difference used for tithi |
| Karana | One fixed opening (Kimstughna), then seven movable repeating eight times across indices 1–56, then three fixed closing (Shakuni, Chatushpada, Naga). **Not simply a "6° half-tithi sequence"** |
| Vara | Weekday, with its lord |

**The span model is the important part.** Every limb is computed as a list of
`PanchangamLimbSpan(number, name, start, end, fraction)` covering the civil day,
found by root-finding on the underlying angle. `limb_fraction`,
`limb_weighted`, `dominant_from_spans` and `dominant_span_name` are the four
readers.

*Why this matters:* until this changed, every input was read at a single instant
— the limbs at sunrise, the Moon at solar noon — and that instant carried a whole
day's score. Measured at Chennai over 2026-08 … 2027-07, **the sunrise nakshatra
holds less than half the day on 46.6% of days and the sunrise karana on 97.5%**,
and the Vishti penalty was consequently never applied on **100 of the 149 days
Vishti actually occurs**. The உதய rule still *names* the day (calendar grid,
festivals, headings are untouched); what changed is that the *score* is now
weighted by how long each value was really in force. On a day with no transition
every function returns exactly what the old scalar code returned.

#### Day divisions [CLASSICAL]

- **Rahu Kalam / Yamagandam / Kuligai** — the actual local sunrise-to-sunset
  daylight interval split into **eight equal parts**, then the classical weekday
  slot selected. Slot tables are per weekday and printed in the appendix.
- **Gowri Panchangam / Nalla Neram** — a per-weekday eight-kala sequence for day
  **and** for night. These are **not** one rotating 8-cycle; each weekday row
  differs, so both full 7×8 tables are printed rather than described. Overlap
  warnings fire when a nominally good Gowri period collides with a caution window.
- **Abhijit Muhurtham** — the **8th of 15 equal muhurtas dividing the daylight
  span**: width `(sunset − sunrise) / 15`, centred on the midpoint of daylight by
  construction. Wider in summer, narrower in winter, moves with latitude.
  Wednesday is the only weekday exclusion. This replaced a fixed solar-noon ± 24
  minutes, which only ever coincided with the true width near the equinox at low
  latitude — at London the old rule gave 48 minutes in both June and December
  where the true windows are roughly 67 and 32.
- **Hora** — **equal 60-minute periods from local Hindu sunrise**, 24 per day,
  cycling by weekday hora lord along the descending-geocentric-distance chain.
  [LINEAGE]: it is *not* twelve unequal daylight and twelve unequal night
  planetary hours. Both conventions are authentic; the declared choice has
  classical footing (a sunrise-to-sunrise day divided into 24 equal parts is how
  BPHS describes Hora Bala) and Tamil almanacs print whole-hour boundaries with
  the 6-1-8-3 mnemonic, which only holds at exactly sixty minutes.
- **Durmuhurtham** — from `app/data/durmuhurtham_rules.py`.

#### Classification tables

- **Amirdhadhi Yogam** — the 7×27 weekday × nakshatra grid classifying each pair
  Amirtha / Siddha / Marana / Prabalarishta. All **189 cells** are printed in the
  appendix; the grid's shape and class domain are asserted by
  `tests/test_rulebook_invariants.py`, because a shifted row would mean 27 wrong
  daily classifications. Source: *Ungal Vazhkkai Vazhikatti* panchangam
  (astrologer-supplied, re-sourced 2026-07-14). **Note for reviewers:** the seven
  Amrita-Siddhi *muhurta* pairs land on **Siddha**, not Amirtha, in this table.
  That is correct — the muhurta yoga and this daily-classification table are
  different objects. An earlier audit assumed otherwise, "corrected" two cells,
  and the change was reverted.
- **Jeevan / Nethiram** [LINEAGE] [LIMIT] — derived from a **symmetric ring
  distance** between the Sun's nakshatra and the day's Moon nakshatra. **Scoring
  reach: none.** Both are display-only strings on the panchangam snapshot;
  neither feeds daily score, muhurta ranking, porutham or any recommendation.
  Two things are recorded rather than papered over: the formula was accepted in
  astrologer review but **no independent printed source is captured in-repo**,
  and a **2026-08-10 live case contradicts the Nethiram cutoff**. A single case
  underdetermines the replacement table, so the cutoff has deliberately not been
  guess-patched.

  > **RULED `FCR-07`, 2026-08-27 — one defect fixed, no table invented.** No
  > cutoff table is supplied from memory, and not guess-patching was right. But
  > the defect was identifiable without a source: Nethiram and Jeevan are **one
  > paired rubric**, and at ring distance exactly 9 the engine printed
  > **இரு கண் — both eyes, the best Nethiram — beside ஜீவன் இல்லை, no life, the
  > worst Jeevan.** That is the only such cell in the 0–13 domain and no almanac
  > prints it; the same line also made Jeevan non-monotonic (0.5 at 8, 0 at 9, 1
  > at 10). Ring distance 9 falls on ~7% of days, frequent enough to be the
  > 2026-08-10 case. The `distance == 9` special case is deleted; both limbs now
  > share the 8|9 boundary and move together. **The cutoffs themselves remain
  > unsourced and both stay display-only with zero scoring reach** until a named
  > almanac — publisher, edition, page, Vakya or Thirukanitham — supplies the
  > table.
- **Chandrashtama** — the transiting Moon in the **8th rasi from Janma Rasi**.
  Never the 8th nakshatra; the two boundary systems do not align.
- **Soolam** direction and parigaram by weekday.

#### Tamil solar calendar (`tamil_calendar.py`) [CLASSICAL], ruling A-3

Tamil month derived from the sidereal solar month, boundary found by
**bisecting the Sun's rasi ingress (Sankranti) to the exact instant**. The
day-assignment rule is the **sunset threshold, with no exceptions**: a sankranti
before that day's sunset starts the month on that same civil day, otherwise the
next day.

A previous hardcoded correction (forcing Aavani 1, 2026 to 18 August from one
unverified almanac reading) **has been deleted**. 18 August is what the competing
*sunrise* rule gives, and that rule contradicts the gazetted Puthandu
(Chithirai 1, 2026 = 14 April) which our own festival table independently
carries. The two rules disagree on **8 of 12 months in 2026** — a systematic
fork, not one stray date. Reintroducing any per-month correction now requires a
named almanac: publisher, edition, **and whether it is Vakya or Thirukanitham**,
since a Vakya reference cannot be reproduced by a drik engine at all.

#### Festivals (`festivals.py`) [LIMIT] — two engines with different reach

1. **Algorithmic** — Ekadashi (Smarta default, with dashami-viddha handling),
   Pradosham, Sankatahara Chaturthi, Amavasai/Pournami, Karthigai, Sashti and the
   solar-day yearly festivals, computed from tithi/nakshatra/solar-month rules
   against the ephemeris. Answers for **any** year.
2. **Gazetted** — government holiday dates plus a few administrative records,
   for **2025–2026 only**, named by `GAZETTED_FESTIVAL_YEARS` and asserted
   against the rulebook sentence by a test.

Outside that range a calendar shows the algorithmic set and no gazetted rows:
**thinner, never wrong.**

---

### 3.10 L9 — Muhurta (`muhurta_engine.py`, `app/data/kalaprakasika_*.py`, `muhurta_service.py`)

The largest sourced-rule corpus in the product: seven Kalaprakasika chapter
files plus a marriage-rules file and an 84 KB activity registry.

#### The factor model

`score_day(snapshot, activity, subject=None)` returns a `DayScore` carrying a
**list of named factors**, each with a `Verdict` and a signed contribution:

| Verdict | Meaning |
|---|---|
| `VETO` | The day is disqualified; its score is not a number anyone should rank on |
| `PENALTY` / `BONUS` | Graded contribution |
| `NEUTRAL` | Checked, and fine |
| **`UNSOURCED`** | **We have nothing to check against.** Deliberately distinct from NEUTRAL — "we checked and it is fine" and "we have no rule" must never render as the same thing |

Each factor carries a `rule_id` linking into `RULE_SOURCES` when a classical rule
decided it, and `None` when it was an engine heuristic — so the UI cannot dress
a heuristic up as sourced doctrine. A `conflict` field is set when two sourced
rules both matched and the text does not settle which wins; it is **surfaced,
not silently resolved**.

`unscored_dimensions_for(activity)` reports the dimensions the activity's own
chapter covers that the engine cannot check — the gap is published, not hidden.

#### The three layers

- **L1 — generic almanac**, always, for every activity: tithi, nakshatra, day
  quality, yoga, Amirdhadhi Yogam, windows.
- **L2 — the activity's own sourced table**, or an explicit `UNSOURCED` gap:
  nakshatra, tithi, and optionally karana, vara, paksha, lagna sign.
- **Personal layer** — only when a `Subject` is supplied: Chandra Bala, Tara
  Bala, janma nakshatra, janma tara count. **`subject=None` is general mode: the
  personal factors are not computed, not scored and not mentioned. A general
  result can never be vetoed by a personal factor — that is the definition of
  the mode.**

#### The weights — `_W`, ENGINE_POLICY, **not doctrine** [PRODUCT]

Base **50.0**. Selected weights:

| Factor | Weight | Rationale recorded in source |
|---|---|---|
| Rikta tithi | −15 | |
| Amavasai | −5 | Two former copies disagreed (0 vs −5); resolved toward the penalty, because telling the user "not ideal for new starts" and then scoring as if we had not is silence taken for approval |
| Subha tithi (Shukla / Krishna) | +10 / +8 | |
| Subha nakshatra | +10 | |
| Subha muhurtham | +20 | |
| Abhijit / Nalla Neram | +5 / +5 | |
| **Amirtha Yogam** | **+12** | Sized *above* the broad subha-star bonus because the almanac tradition treats this as a day-selection gate, not a preference |
| **Siddha Yogam** | **+4** | |
| **Marana Yogam** | **−16** | No printed panchangam offers a muhurtam on a Marana day |
| **Prabalarishta Yogam** | **VETO** | **Changed 2026-08-27 (`FCR-09`).** Was −30. From a base of 50 that opened the day at 20 against **+104** of stackable L1+L2 bonuses, so nothing in the arithmetic stopped a Prabalarishta day ranking GOOD or even BEST. பிரபல ஆரிஷ்டம் is *manifest* arishta — a day the almanac does not offer, not one it grades down. Costs 7 of 189 cells, ~13 days a year. The `terminative` exemption is preserved |
| Nakshatra favoured / not listed / excluded | +14 / −6 / −14 | "Excluded" = a chapter explicitly closed the list |
| Tithi best / middling / inauspicious | +10 / 0 / −14 | |
| Karana transition | −10 | |
| Lagna best / avoid | +8 / −10 | |
| Vara good / avoid | +6 / −8 | Below the star, because Tamil practice ranks star above weekday and three chapters name the same four benefic weekdays |
| Paksha preferred / against | +6 / −8 | |
| Chandra strong / bonus / weak | +10 / +5 / −12 | |
| **Karaka combust (moudyam)** | **−14** | Set to exactly cancel `NAKSHATRA_FAVOURED (+14)`, so a fine star alone can never carry a purchase made while its karaka is invisible. Penalty, never veto — vetoing would blank ~2 months a year |
| Karaka debilitated | −10 | Level with `LAGNA_AVOID` |
| Wealth-house heuristic | +1 | **Owner-approved product heuristic, not a Kalaprakasika rule**, and applied so it cannot change the visible band |

**Retrogression is deliberately not penalised**, though one chapter lists it.
Vakri is a strength in this codebase and in the classical rule behind it; docking
it here would put two engines in one app on opposite sides of the same
condition. Tamil practice suspends muhurthams inside மௌட்யம், not inside a vakri
period — no almanac blanks the four months a year Jupiter is retrograde.

**Tara scoring vs Tara display are separate** (doctrine A-11). The *severe* taras
that carry a scoring penalty are **3 / 5 / 7 and only those**. Janma (1) is
commonly marked "not good" in general Tarabala presentations, so a reader-facing
panel may show it as unfavourable without the engine treating it as a defect.

#### The display scale — `display_score(raw)` [PRODUCT]

`score_day` is **unclamped by design**: callers add their own layers (the service
adds a dasha bonus and a hora bonus) and clamping in the engine would silently
eat them. Every surface that shows a number to a human therefore maps it first:

```
raw ≤ 0          → 0
raw ≤ 80         → raw                          (identity)
80 < raw < 180   → 80 + (raw − 80) × 20/100     (piecewise-linear compression)
raw ≥ 180        → 100
```

Strictly monotonic below the ceiling, so it never reorders two days and never
invents a tie. Callers round to **one decimal**, not to an integer: at integer
precision the compressed band recovers only 66 of 110 distinct top-five values
across the sourced activities, against 93 of 110 at one decimal.

*Measured basis:* a 90-day Chennai sweep of all sourced activities
(n = 3,244) gave min −9, p50 80, p95 130, max 161, with 29.3% at or above 100.
Re-measured 2026-08-17 after Amirdhadhi joined L1 (n = 1,975): min 1, p50 81,
p95 131, max 150, 31.2% at or above 100 — so the knee and ceiling still hold and
the mapping was not retuned. The ceiling is a **fixed** 180, deliberately not
derived from the observed distribution: a data-derived ceiling would drift every
time a weight changed, silently moving every displayed number.

#### Bands and the picker

| Band | Threshold |
|---|---|
| `BEST` | ≥ 75.0 |
| `GOOD` | ≥ 55.0 |
| `USABLE` | below 55.0 |
| `NOT_RECOMMENDED` | vetoed |

Adverse Tara caps the *displayed* band: Vipat (3) and Pratyari (5) cap at Good,
Naidhana (7) caps at Usable.

**Chandrashtama vetoes** — the day is dropped, not merely docked, because no
almanac strength offsets it.

**The window** is a favoured hora ∩ a good Gowri day kala, clear of Rahu Kalam,
Yamagandam and Kuligai, so the clock time and the reason printed beside it always
agree. Owner ruling (2026-08-23): the **best** Gowri kala wins the promoted
window, and an avoid-kala **vetoes** it.

#### Muhurtham naal (`muhurtham_naal_service.py`)

The list of muhurtham dates is **curated from a published almanac**, not from our
own broad `is_subha_muhurtham` flag, which over-reports. Personalisation on top:
Chandrashtama is a hard avoid; Tara Bala sorts the rest. Days that are
Tara-favourable and Chandrashtama-free surface as best matches; the rest are
still returned, annotated.

---

### 3.11 L10 — Compatibility

#### Tamil 10-Porutham — `compute_porutham` → **0–10** [CLASSICAL]

Each porutham is a **pass/fail** worth exactly one point. Not a 36-guna
Ashtakoota system.

| # | Porutham | Rule |
|---|---|---|
| 1 | Dinam (தினம்) | Count boy's star from girl's (1-based, 1–27); pass on the classical good-count table `{2,4,6,8,9,11,13,15,18,20,24,26}`. **17/22/27 are deliberately absent** — a pure tara-mod-9 rule would pass them; the locked spec table is the 12-count Tamil variant |
| 2 | Ganam (கணம்) | Deva/Manushya/Rakshasa; Deva+Deva or Deva+Manushya pass |
| 3 | Mahendra (மகேந்திரம்) | Count ∈ {4,7,10,13,16,19,22,25} |
| 4 | Stree Dirgham | Count > 7 |
| 5 | Yoni (யோனி) | 14 animal symbols; same or neutral pair passes, hostile pair fails |
| 6 | Rasi (ராசி) | Fails on the 6th/8th position (Shashtashtaka) |
| 7 | Rasiyathipathi | **Fails if either rasi lord regards the other as an enemy** — one-way enmity fails |
| 8 | Vasya (வாஸ்யம்) | At least one rasi must be vasya of the other |
| 9 | **Rajju (ராஜ்ஜு)** | Same Rajju group = **VETO** |
| 10 | **Vedha (வேதம்)** | Vedha star pair = **VETO** |

Bands: **≥9 EXCELLENT, ≥7 GOOD, ≥5 AVERAGE, else CAUTION**. A Rajju failure
**forces the overall label to CAUTION regardless of total.**

**Two source corrections made in 2026-08, both worth your confirmation:**

- **Vedha is a triad, not thirteen pairs.** Twelve of thirteen shipped rows were
  verbatim from the source (p.70). The thirteenth was the closing line —
  *"Mrigashirsha, Chitra and Dhanishta are mutually Vedha"* — flattened to one
  edge with Chitra dropped. Three independent confirmations: 27 is odd, so a pure
  pairing cannot cover it; the pair sums fall into three families of four (19,
  28, 37) and the triad members are exactly the star each family is missing; and
  the same triple recurs in the source as a natural class at p.69 (Siro Rajju)
  and pp.60-61 (Kuja Dosha exemption). Effect: `{5,14}` and `{14,23}` now veto.
  Nothing that failed before now passes.
- **Two vasya rows were incomplete.** Vrischika → Kanni and Makara → Kumbha were
  missing, each attested by two independent authorities. Effect: **missing
  PASSes, never spurious ones** — couples who should have cleared Vasya were
  being failed. Simha → Thula is deliberately kept as-is: p.69 prints Makara
  there, contradicting every standard table; treated as a source/OCR defect.

#### Nadi Dosha — `check_nadi_dosha` [CLASSICAL], flag-gated parihara mode

Nadi assignment zigzags in a repeating 6-star cycle
(Aadhi, Madhya, Anthya, Anthya, Madhya, Aadhi) — **not** contiguous blocks of
nine.

**"Different rasi alone" does not cancel** (the old lenient rule is retired).
Cancellation requires one of:

1. A **Classical Exception (parihāra)**, in every mode — same nakshatra with
   different pada, or same rasi with different nakshatra.
2. **Rasi-lord friendship**, when Moon signs differ — gated by the
   `nadi_parihara_mode` flag. `classical_lenient` grants a full cancel;
   **`strict` (the default) records only a disclosed partial mitigation** and the
   dosha stays flagged.

Same nakshatra + same pada is an explicit non-exception and never cancels.
A Rajju hard-fail is surfaced independently of Nadi status in all modes.

**Tone rule enforced by test.** The source's own framing for the Rajju
prohibition is a longevity concern. That is inadmissible in user-facing output.
The sanctioned internal carrier is a reason code plus a category
(`RAJJU_SOURCE_TEXT_CATEGORY`), and `tests/test_porutham.py` asserts they never
appear in any rendered string. The finding is unchanged — Rajju still fails,
still forces CAUTION, still reads as one of the strongest objections in Tamil
matching. Only the claim about an outcome is gone.

#### Synastry — `compute_synastry_score` → **0–100** [PRODUCT]

Base 50, six longitude pairs evaluated for aspect and orb
(A♀–B♀, A♀–B♂, B♀–A♂, A☾–B☾, A☉–B☾, B☉–A☾), each contributing a signed delta.
Bands: **≥65 SUPPORTIVE, ≥45 MIXED, else CAREFUL**.

#### Compatibility Intelligence — `compute_compatibility_intelligence` → **0–100** [PRODUCT] over [CLASSICAL] layers

Eight layers, weighted to 100:

| Layer | Max | Source |
|---|---|---|
| Porutham | 20 | `compute_porutham` |
| 7th-house marriage strength (both charts) | 20 | 7th lord placement + strength, Venus, Jupiter, malefics in the 7th |
| Navamsa harmony | 20 | Both Venuses and both 7th lords in D9 |
| Dasha harmony | 15 | Running maha/antar lords of both, and their end dates |
| Dosham analysis | 10 | Sevvai for both, with **mutual cancellation** |
| Emotional | 10 | Moon–Moon and Venus–Mars harmony |
| Synastry | 5 | Rescaled from the 0–100 above |

Sevvai delegates to the **main dosham engine** so this report and the Jadhagam
card can never disagree on `has_dosham` / `is_cancelled` for the same chart.

---

### 3.12 L11 — Numerology (`numerology*.py`, 7 modules)

**Chaldean, not Pythagorean** — Tamil Nadu practice is Chaldean and a
Pythagorean table would be dismissed on sight. Two properties that break naive
implementations are enforced:

1. **No letter carries the value 9.** The table is *data*, not `A=1..Z=26 mod 9`
   — deriving it arithmetically produces a different, wrong table.
2. **The compound outranks the root.** 43 and 34 both reduce to 7 and mean
   different things. Every reading carries `total`, `reduction_chain`,
   `compound` and `root`; the compound is never discarded.

**Script discipline.** `score_text` **raises** on non-Latin input rather than
skipping it. Silently ignoring Tamil characters would return a plausible, wrong
number. Non-letters (spaces, hyphens, dots) are dropped *and reported* in
`ignored_characters`.

**A disclosed hole.** "The compound" is the first chain value inside Cheiro's
documented **10–52** series. Indian document names routinely exceed 52 — of
twelve realistic three-part names measured, **ten totalled above 52**. Pandit
Sethuraman extended the series to 1–108 for exactly this reason and his is the
tradition this product follows, but **that corpus is not in hand, so the 53–108
meanings are not encoded**. Instead `compound_beyond_series` carries the real
total and `compound_is_surrogate` says outright that the reading describes a
surrogate. Encoding the meanings from an unsourced guess was refused.

**Number → graha:** 1 Sun, 2 Moon, 3 Jupiter, 4 Rahu, 5 Mercury, 6 Venus,
7 Ketu, 8 Saturn, 9 Mars. (Cheiro maps 4→Uranus and 7→Neptune; Tamil practice
re-maps to Rahu and Ketu. The compatibility grouping is unaffected.)

| Module | Computes |
|---|---|
| `numerology.py` | Chaldean core: name, date, mobile, vehicle, house numbers |
| `numerology_alignment.py` | **Fortune Alignment Score** — the bridge to jyotisha |
| `numerology_compatibility.py` | Two-person number matching under two selectable bases |
| `numerology_timing.py` | Personal year/month/day, date scoring, business launch |
| `numerology_naming.py` | Baby-name generation from pada-akshara + number fit |
| `numerology_correction.py` | Adult name-correction variants from a 7-rule set |

#### Fortune Alignment Score → **0–100** [PRODUCT]

A number's graha is looked up, then that graha's **functional nature for the
native's Lagna** sets a base:

| Nature | Base |
|---|---|
| Yogakaraka | 92 |
| Lagna lord | 85 |
| Trikona | 80 |
| Kendra | 60 |
| Neutral | 55 |
| Upachaya | 48 |
| Maraka | 38 |
| Dusthana | 25 |

Natal strength then refines by at most **±12** — never dominates. The
`StrengthRule` is **named on the wire** because one case is genuinely surprising
and reads as a bug otherwise: a **maraka lord at strength 71 scores lower than
the same lord at 40** (`INVERTED`). That is the doctrine — strength governs how
fully a graha delivers what it rules, not whether what it rules is welcome — but
a screen showing "Strength 71" beside a fallen score with no rule named has shown
the reader an arithmetic error.

Verdict bands, derived from the cutoffs rather than written twice:
**≥78 strongly aligned, ≥62 aligned, ≥45 neutral, ≥32 misaligned, else strongly
misaligned.**

#### Compatibility → **0–100** [PRODUCT]

Relation grades score `HARMONIOUS 92, SUPPORTIVE 74, NEUTRAL 55, ONE_SIDED 45,
STRAINED 35, DIFFICULT 20`. Three pairs, weights renormalised over those present:
**destiny 0.40, psychic 0.35, name 0.25**. The name weighs *less* here than in
alignment, deliberately — there the name is weighted up because it is the one
number the native can change; here nobody is correcting a name, so the numbers
neither party chose are the honest basis.

Two selectable bases: **Cheiro's sympathetic series** (default) and **graha
maitri**. Under Cheiro there is **no negative grade** — he states no enmities, so
`NEUTRAL` means "he does not speak to this pairing", not "these two clash".

#### Timing — the doctrine guard that matters most

`score_date(...)` maps the chart's own 1–9 favourability ranking to a bounded
symmetric adjustment (rank 1 → +8 … rank 5 → 0 … rank 9 → −8). Without a chart
ranking the adjustment is **zero: no chart, no opinion.**

> **`has_astrological_caution` clamp.** When the panchangam has flagged a date,
> numerology may still *lower* the ranking but **may never raise it**, and the
> clamp is surfaced (`clamped_by_astrology`), not silent. *"A numerologically
> ideal date that is astrologically inauspicious must never be recommended."*
> `business_launch_score` carries the same rule as
> `requires_muhurta_confirmation = True`, always: **numerology ranks launch
> dates; it never clears one.**

---

### 3.13 L12 — The reasoning layer (`app/reasoning/`)

This is the part most likely to distinguish Vinaadi from a template engine, and
the part most in need of your ruling.

#### D1 — promise is a **veto**, not a weight

`assess_promise(...)` grades a life area before any timing is consulted:

| Grade | Condition | Consequence |
|---|---|---|
| `PASS` | Bhava lord not in a dusthana and not afflicted, **and** karaka holds a supportive dignity in D1 **and** in the area's varga | Proceed to the timing vote |
| `WEAK` | One of the two holds | Proceed, but **cap the final band at LIKELY** |
| `BLOCKED` | Lord fatally afflicted **and** karaka afflicted in **both** D1 and varga | Band = BLOCKED; **the timing vote is not run** |
| `SILENT` | Karaka/lord data missing, or genuinely neutral on every axis | Band = SILENT — *the chart is quiet, not saying no* |

Varga routing is per area (D9 for marriage, D10 for career, …). A caller without
varga data passes `NEUTRAL` so the gate leans on D1 alone rather than inventing a
denial. **BLOCKED is deliberately strict**: anything less certain falls to WEAK
or SILENT, never BLOCKED.

> **Additive scoring across this gate is "the averaging error" and is banned.**
> No dasha and no transit can manufacture an unpromised event.

#### D1 second stage — the timing vote

Only PASS/WEAK charts get one. It is a weighted vote over timing pillars (dasha,
gochar, varga confirmation, ashtakavarga, panchangam) normalised 0–100, with
weights **renormalised** so a caller can simply drop a missing pillar.
**L1 is never re-added** — the gate already consumed it.

#### D2 — bands are ordinal, and the raw number is internal

`STRONG / LIKELY / MIXED / WEAK / BLOCKED / SILENT`. The 0–100 timing score
**is never rendered to users** in this path. Cutoffs are admin-tunable flags:
**strong 75, likely 60, mixed 45.**

#### Other reasoning modules

- `chart_signature.py` — detects the dominant signature of a reading
  (Atmakaraka 3 points, aspect 2, dasha 2, self-period bonus 1, strength 1).
- `contradiction.py` — catches a reading that argues both ways.
- `calibration.py` — logs the band a prediction was issued at, so a later
  recalibration has data.
- `verdict.py` — the shared band vocabulary and `cap_band`.

---

### 3.14 L13/L14 — Narrative and disclosure

**Narrative** (`narrative_engine.py`, `chart_explanation_service.py`,
`nakshatra_content.py`, the reading services) — pre-written bilingual templates
keyed on calculated values. No LLM. `build_score_reasons` renders the reasons a
score is what it is, from the same values that produced it.

**Disclosure gates**, applied *after* calculation, never baked into it:

| Gate | Effect |
|---|---|
| Age gate (`app/core/age_gate.py`) | Life areas have age bands; Sevvai Dosham softens above a threshold; marriage content has an upper age |
| Life-phase gate | Suppresses areas irrelevant to the reader's declared phase |
| Declared-fact gate | `suppress_when_married` and similar — a propensity card that assumes an unmarried reader is withheld |
| Tone compliance (`tests/test_tone_compliance.py`) | A shipped-tree sweep for banned mortality/fatalism phrasings |
| Safety filter (`safety_filter.py`) | Final output filter |
| Supportive-band-only | Progeny discloses only its supportive band (§3.5) |

The separation is stated as a principle: **an interpretive overlay at scoring
time, not baked into the natal calculation itself, which must stay
age-independent.**

---

## 4. The score register — every number the product shows a user

This is the direct answer to *"where are we giving scores, how are we scoring,
and what are we computing to present it"*.

### 4.1 Chart-level scores

| # | Score | Scale | Function | Inputs | Marker | Where shown |
|---|---|---|---|---|---|---|
| 1 | **Natal graha strength** | 10–95 | `chart_strength.compute_natal_planet_score` | Dignity, avastha, house, dik, kala, chesta, naisargika, drik + 8 modifiers | [PRODUCT] over [CLASSICAL] | Jadhagam / chart explanation, per graha, with full term breakdown |
| 2 | **Bhava Bala** | 0–100 | `compute_bhava_bala` | Lord's score 50%, occupants 25%, drishti 25% | [PRODUCT] | Bhava panel |
| 3 | **Classical Shadbala** | Virupas → Rupas + pass/fail | `compute_shadbala` | Ten classical sub-balas | [CLASSICAL] [LIMIT] | `/charts/{id}/shadbala`, experimental label |
| 4 | **Yoga activation** | 0–100 | `yoga_activation_score` | Yoga strength band + dasha lord match + key planet score | [PRODUCT] | Yogam screen |
| 5 | **Ashtakavarga bindus** | BAV 0–8, SAV 0–56 | `compute_bhinnashtakavarga` / `compute_sarvashtakavarga` | Eight reference points per graha | [MEASURE] | Bindu grid, ungated |
| 6 | **BAV derived band** | STRONG / NEUTRAL / THIN | `classify_bindu_band` | Bindus vs the rule's own analytic baseline, ±1 margin | [PRODUCT] band on [CLASSICAL] rule | Life-area card only, four gates deep |
| 7 | **House lord strength band** | STRONG ≥60 / MODERATE / WEAK <40 | `house_lords.strength_band` | Lord's natal score | [PRODUCT] | House lord report |

### 4.2 Daily and timing scores

| # | Score | Scale | Function | Marker | Where shown |
|---|---|---|---|---|---|
| 8 | **Daily alignment score** | 0–100 + 5 labels | `daily_guidance_service` | [PRODUCT] | Today hero, week-ahead, calendar, push, share card, PDF |
| 8a | ├ Moon component | 0–100 | `weighted_moon_score` | [PRODUCT] on [CLASSICAL] Tara | internal, shown as a reason |
| 8b | ├ Transit component | 0–100 | `_transit_with_av_score` × 6 grahas | [PRODUCT] | internal |
| 8c | ├ Dasha component | 0–100 | `_dasha_lord_strength_score` + relationship | [PRODUCT] | internal |
| 8d | ├ Panchangam component | 0–100 | `weighted_panchangam_score` | [PRODUCT] | internal |
| 8e | └ Personal-safety component | 0–100 | Sani cycle, Chandrashtama, Abhijit, Mercury combustion | [PRODUCT] | internal |
| 9 | **Confidence band** | LIKELY / MIXED / WEAK | Count of Moon, dasha, transit ≥ 60 | [PRODUCT] | Beside the daily score |
| 10 | **Activity board alignment** | SUPPORTS / NEUTRAL / CAUTION | `daily_activity_board` | [CLASSICAL] rules | Today activity card |
| 11 | **Muhurta day score** | raw → 0–100 display, 4 bands | `score_day` → `display_score` | [PRODUCT] weights on [CLASSICAL] rules | Muhurta picker, public muhurta tool |
| 12 | **Muhurtham-naal personal match** | best / annotated | `muhurtham_naal_service` | [CLASSICAL] | Muhurtham naal listing |
| 13 | **Event window score** | 0–100 | `find_marriage_windows` etc. — base 70, ± activation, double transit, dasha | [PRODUCT] | Event-windows panel |
| 14 | **Dasha support / bhukti score** | 0–100 | `dasha_service` | [PRODUCT] | Dasha timeline |
| 15 | **Emotional weather** | tone + aspect score | `emotional_weather` | [PRODUCT] | Today |
| 16 | **Ambient alert priority** | integer rank | `ambient_alerts_service` | [PRODUCT] | Alert ordering only |

### 4.3 Life-area and prediction scores

| # | Score | Scale | Function | Marker | Where shown |
|---|---|---|---|---|---|
| 17 | **Life-area score** | 0–100 | `life_areas_service._score_area` → `compute_prediction_score` | [PRODUCT] | Life Areas screen, 7 areas |
| 18 | **Six-layer prediction score** | 0–100 + 6 verdicts | `compute_prediction_score` | [PRODUCT] | Under 17, 19, and the prediction endpoints |
| 19 | **Marriage / career / wealth / health prediction** | Band + confidence | `marriage_service`, `career_service`, … | [PRODUCT] on [CLASSICAL] | `/predictions/*` |
| 20 | **Propensity chance / caution level** | 5 / 4 ordinal levels | `propensity_service._grade_chance` / `_grade_caution` | [PRODUCT] | 41 propensity cards (41 `_Spec` entries, 41 evaluators) |
| 21 | **What-if scenario** | 0–100 across 3 pillars | `whatif_service` | [PRODUCT] | What-If simulator |
| 22 | **Decision brief option score** | signed adjustment | `decisions_service._score_adjustment` | [PRODUCT] | Decision brief |
| 23 | **Annual wrapped average** | 0–100, bands 75/55/40 | `annual_wrapped_service` | [PRODUCT] | Annual wrapped |
| 24 | **Rectification candidate score** | point count, top-3 | `rectification_service._score_candidates` | [PRODUCT] [LIMIT] — labelled heuristic, ~30–60 min window | Rectification tool |
| 25 | **Retrospective signature match** | similarity score | `retrospective_service` | [PRODUCT] | Retrospective |

### 4.4 Relationship scores

| # | Score | Scale | Function | Marker | Where shown |
|---|---|---|---|---|---|
| 26 | **10-Porutham** | 0–10 + % + 4 labels | `compute_porutham` | [CLASSICAL] | Porutham tool (public + signed-in), family vault |
| 27 | **Nadi severity** | NONE / MILD / SEVERE + mitigation tier | `check_nadi_dosha` | [CLASSICAL] | Porutham result |
| 28 | **Synastry** | 0–100, 3 labels | `compute_synastry_score` | [PRODUCT] | Family & Charts, relationships |
| 29 | **Compatibility Intelligence** | 0–100 over 7 weighted layers | `compute_compatibility_intelligence` | [PRODUCT] over [CLASSICAL] | Compare / marriage report |
| 30 | **Friendship compatibility** | kuta score | `friendship_compatibility_service` | [PRODUCT] | Public tool |

### 4.5 Numerology scores

| # | Score | Scale | Function | Marker |
|---|---|---|---|---|
| 31 | **Fortune Alignment** | 0–100 + 5 verdicts | `align_number` | [PRODUCT] |
| 32 | **Number compatibility** | 0–100 + 5 bands | `numerology_compatibility` | [PRODUCT] |
| 33 | **Date favourability** | rank 1–9 → ±8 adjustment | `score_date` | [PRODUCT], astrology-clamped |
| 34 | **Business launch** | 0–100 (date .45 / name .35 / personal year .20) | `business_launch_score` | [PRODUCT], never clears a date |
| 35 | **Name-correction candidate** | ranked variants from a 7-rule set | `numerology_correction` | [PRODUCT] |
| 36 | **Baby-name fit** | pada-akshara gate + number fit | `numerology_naming` | [CLASSICAL] gate, [PRODUCT] ranking |

---

## 5. Score deep-dives, with the arithmetic

### 5.1 The daily alignment score — the number most readers see most often

**Five weighted components plus a flat term.** Weights sum to 0.94; the flat
remedial term (max 6) brings the maximum to exactly 100. Each component is
rounded first and the total is their sum, so there is no double-rounding
discrepancy.

```
score =  round(moon_score           × 0.28)
       + round(transit_score        × 0.24)
       + round(dasha_score          × 0.19)
       + round(panchangam_score     × 0.14)
       + round(personal_safety      × 0.09)
       + remedial_support                     (0, 3 or 6)
       → min(100, …)
```

**Component 1 — Moon (0.28).** Base 70.

- `+ Σ over nakshatra spans of TARA_DELTA[tara(span)] × span.fraction`
  — Tara Bala from the birth star to the day star, **duration-weighted**:

  | Tara | 1 Janma | 2 Sampat | 3 Vipat | 4 Kshema | 5 Pratyak | 6 Sadhana | 7 Naidhana | 8 Mitra | 9 Parama Mitra |
  |---|---|---|---|---|---|---|---|---|---|
  | Delta | **−20** | +8 | **−15** | +8 | −10 | +5 | **−15** | +8 | **+12** |

  *This table is deliberately not `tara_bala.TARA_SCORE`* — that one is the
  muhurta picker's own calibration on a different scale, and the two tara systems
  were ruled to stay separate (muhurta doctrine, 2026-08-16). Same 1..9 ordering,
  different magnitudes, different consumer.

- `− 25.0 × chandrashtama_share` — the share of the day the transiting Moon sits
  in the 8th rasi from the natal Moon.
- `+ 10.0 × overlap(auspicious star, clear of the 8th rasi)`. **This is an
  interval intersection, not a product of two fractions.** A rasi boundary falls
  every 30° and a nakshatra boundary every 13°20′, so they interleave;
  multiplying would claim an overlap on a day where the auspicious star and the
  clear rasi never actually coincide. Chandrashtama nullifies the transit star's
  auspiciousness, so the +10 is earned only by the stretch of day that is **both**.

**Component 2 — Transit (0.24).** Base 50, then for each of Jupiter, Saturn,
Rahu, Ketu, Mars, Moon:

```
base       = TRANSIT_BASE_SCORE[graha][house from Janma Rasi]
           ± 8 by Ashtakavarga bindus (≥4 supportive, ≤2 difficult; nodes get no adjustment)
           clamped 10–90
contribution = (base − 50) × PLANET_DAILY_WEIGHT[graha] × functional_nature_modifier(lagna, graha)
if Vedha:  contribution × 0.25
```

`PLANET_DAILY_WEIGHT`: Saturn **0.20**, Jupiter 0.18, Mars 0.14, Rahu 0.12,
Moon 0.10, Ketu 0.08. Then a Jupiter-from-Moon refinement (−6 in the 8th … +4 in
the 5th/9th/11th) and a Saturn-from-Lagna material modifier (−4 in a kendra,
+2 in 3/6/11).

**Component 3 — Dasha (0.19).**

```
maha_score  = clamp(natal_score × 0.40 + transit_house_base × 0.40 + (20 if retrograde else 10), 10, 95)
              × functional_nature_modifier(lagna, lord)
              × age_stage_modifier(age, lord)
antar_score = same
relationship = 72 if same lord | 70 if natural friends | 38 if natural enemies | 55 otherwise
dasha_score = maha × 0.45 + antar × 0.30 + relationship × 0.25
```

The age-stage modifier is the Thirukanitham teaching that the same dasha
produces different intensity by age.

> **RULED `FCR-03`, 2026-08-27 — direction right, thresholds unsourced, and the
> sourced table was already in the repository.** The doctrine underneath this is
> the classical **graha maturity (paripakva) ages**, which live in
> `app/calculations/maturation.py` and always have: Guru 16, Suriyan 22,
> Chandran 24, Sukran 25, Sevvai 28, Budhan 32, Sani 36, Rahu 42, Ketu 48. This
> function had hand-rolled round numbers beside them. Every youth threshold now
> **reads that table** rather than restating it, so the two cannot drift —
> Sani 30 → 36, Sevvai 25 → 28, Sukran 20 → 25, Chandran 20 → 24.
>
> **Suriyan, Rahu and Ketu are no longer flat** (0.92 before 22; 0.90 before 42
> and 48). The nodes have the two latest maturities in the scheme and the two
> dashas most notoriously difficult when they run early — an 18-year Rahu
> mahadasha opening at 5 and one opening at 45 are not the same period.
> **Budhan stays flat by decision, not omission**: a Budhan dasha in childhood is
> the education dasha and is favourable exactly when its maturity age would
> discount it. **Guru keeps 35–60 but the reason changed** — Guru matures
> earliest of all, so its uplift is ashrama fitness, not maturity, and remains
> declared `[LINEAGE]`.
>
> The *curve* stays separate from `maturation_multiplier`, which uses the same
> ages on a different shape for the prediction layer. Two consumers may hold two
> calibrations of one doctrine — the two-Tara-tables precedent (`A-11`) — but
> not two copies of the ages.

**Component 4 — Panchangam (0.14).** Base 70, **duration-weighted**:
Rikta tithi −15, Ashtami −10, caution yoga −10, Vishti karana −10, weekday lord
= Lagna lord +8, weekday lord = maha lord +5. **Amavasai is not penalised here**
(`PAN-15`: it is a sacred Pitru Tarpan day). The vara terms stay unweighted — a
weekday genuinely is a whole-day property.

If a goal is active, the activity's Thirukanitham timing rules add +5 (SUPPORTS)
or −8 (CAUTION).

**Component 5 — Personal safety (0.09).** Base 60: Chandrashtama −15; Sade Sati
by **Moorti at Saturn's real ingress instant** (Gold 4, Silver 6, Copper 8,
Iron 10); Ardhashtama −9; Ashtama −12; Kandaka −7 **only if no other Sani cycle
is active** (the single-scoring guard for the A-1 overlap); Abhijit restricted
−5; Mercury combust −3.

**Remedial support (flat, max 6).** Reflects window *quality*, not presence —
every day has some Nalla Neram. 6 when a **personal hora** window exists (ruled
by the native's own Lagna or dasha lords), 3 for a generic benefic/Abhijit
window, 0 when the day offers nothing.

**Labels:** ≥80 STRONG_SUPPORT, ≥65 GOOD, ≥50 BALANCED, ≥35 CAUTION, else
RESTORATIVE. **Chandrashtama is a prohibition period: a day in ashtama can never
be labelled GOOD or STRONG_SUPPORT even when dasha and transits are strong** —
it is forced down to BALANCED.

**Cache:** `DAILY_SCORE_ENGINE_VERSION = "2026-08-14-v9"`. Any change to any
weight above must bump this string or stale scores survive.

### 5.2 The six-layer prediction score

| Layer | Max | Computation |
|---|---|---|
| **L1 birth promise** | 30 | `house_lord_strength/100 × 14 + karaka_strength/100 × 8`, + yoga bonus (STRONG 8, PARTIAL 4, WEAK 1), + dosham penalty (STRONG −10, MODERATE −5, MILD −2; **halved if cancelled**) |
| **L2 planet strength** | 15 | Mean of the key planets' natal scores, scaled |
| **L3 dasha activation** | 25 | `maha_fn × 0.6 + antar_fn × 0.4` (Yogakaraka 25 … Dusthana 3), +4 maha house connection, +2 antar, × maturation multiplier |
| **L4 varga confirmation** | 10 | +10 if the house lord sits in a good house of the area's varga, −5 otherwise |
| **L5 transit support** | 15 | 8 + Jupiter house × 0.05 + Saturn house × 0.03 + double transit × 0.4 − Sade Sati penalty − 3 if Ashtama Sani |
| **L6 ashtakavarga** | 5 | `3 + bav_delta/2 + sav_delta/2` |

**Two paths, and the difference is doctrinal.**

- **Legacy path:** `total = L1 + L2 + L3 + L4 + L5 + L6`, clamped 0–100.
- **Reasoning-gate path** (`reasoning_gate` flag, **currently ON**): L1 becomes a
  hard **gate**. BLOCKED or SILENT returns early with that band, total clamped
  near zero, and L2–L6 are **never computed**. PASS or WEAK sends L2–L6 (max 70)
  rescaled to 0–100 as the timing vote. **L1 is not re-added** — the gate
  consumed it. A WEAK gate caps the band at LIKELY.

Verdicts: ≥91 EXCEPTIONAL, ≥76 STRONG, ≥61 GOOD, ≥41 MIXED, ≥21 DIFFICULT,
else VERY_WEAK.

### 5.3 The life-area score — how one area reaches a number

For each of seven areas, the service resolves a primary house and a karaka pair:

| Area | House | Karakas |
|---|---|---|
| Career | 10 | Sani, Suriyan |
| Money / Wealth | 2 | Guru, Sukran |
| Health | 1 | Suriyan, Chevvai |
| Relationships | 7 | Sukran, Guru |
| Education | 5 | Budhan, Guru |
| Spiritual | 9 | Guru, Ketu |
| Family harmony | 4 | Chandran, Guru |

then assembles a `PredictionScoreInput` from: the house lord's and karaka's natal
scores; a bhava-affliction assessment (papa kartari plus multiple malefic drishti
can qualify the birth promise as a dosham; shubha kartari is the cancellation
channel); dasha connection by lordship/aspect/dispositorship/node agency; the
area's varga; SAV delta from the primary house rasi and BAV delta from the
karaka's transit rasi; a double-transit score; and the maturation multiplier.
Kandaka Sani and Chandrashtama then subtract per-area penalties.

**Node handling:** a Rahu or Ketu dasha lord resolves its functional nature via
**dispositor + house**, not via a NEUTRAL table fallback — matching every other
consumer.

### 5.4 Propensities — the one scoring model with no number at all

The 41 propensity cards are graded by **counting signals, not by summing
weights**, and that is a deliberate design choice worth your view.

Each evaluator (`propensities.eval_*`) reads the chart through a `_Reader`
facade and returns a `Signals` record holding a count of supporting factors
(`pro`), a count of opposing factors (`con`), and whether the chart said anything
at all (`has_signal`). No factor carries a magnitude.

**Chance-tier cards** (`_grade_chance`):

| Condition | Level | Band |
|---|---|---|
| No signal | QUIET | SILENT |
| `pro ≥ 3` and `con ≤ 1` | STRONG | STRONG |
| `pro ≥ 2` and `pro > con` | PROMISING | LIKELY |
| `pro ≥ 1` and `pro == con` | MIXED | MIXED |
| `pro > con` | PROMISING | LIKELY |
| `con > pro` | LIMITED | WEAK |

**Caution-tier cards** (`_grade_caution`) run on the net `con − pro`: zero
cautions → STEADY; net ≥ 2 → EXTRA_CARE; net ≥ 1 → WATCHFUL; otherwise STEADY.

Two consequences follow:

1. **A propensity can never produce a percentage**, so it cannot be mistaken for
   a probability. The card shows a level phrase and the topic, never a number.
2. **A quiet chart is reported as quiet**, not as a negative. `QUIET → SILENT`
   is the same D3 distinction the promise gate makes: the chart not speaking is
   not the chart saying no.

Each spec carries its own age band, an optional disclaimer, and optional
suppression rules (`suppress_when_married`, and similar declared-fact gates), so
a card that assumes a life situation the reader is not in is withheld rather than
rephrased.

---

## 6. What we deliberately do **not** compute or claim

A reviewer should be able to see the edges as clearly as the content.

| Not done | Why |
|---|---|
| A full six-fold Shadbala as the product strength score | `CORE-12`. The 0–100 score is a blend and is labelled one. Real Shadbala ships separately and experimentally |
| Abda Bala, Masa Bala, Yuddha Bala | Need ahargana-derived year/month lords and apparent disc diameters, which this engine does not have. **Omitted and documented rather than guessed** |
| Rahu/Ketu Bhinnashtakavarga | They have none classically. We no longer borrow Saturn's |
| Chara Dasha interpretive output | `DAS-07`. Calculated, not interpreted, until the full rule set is confirmed |
| Cheiro compound meanings 53–108 | The Sethuraman corpus is not in hand. The reading declares itself a surrogate instead |
| A count of children / siblings / relatives from bindus | `STR-06`. A printed count is instantly checkable and being wrong about a reader's own family costs more than saying nothing |
| Any death, mortality or fatal-outcome assertion | Blocked by doctrine, and swept for by `tests/test_tone_compliance.py` and `test_mortality_class_sweep.py` |
| A raw prediction percentage shown to a user | D2. Bands are ordinal; the 0–100 timing vote is internal |
| Gazetted festivals outside 2025–2026 | Coverage is bounded and declared. Thinner, never wrong |
| True node | Mean node is the declared choice; the JHora divergence is disclosed |

---

## 7. Open questions — **ALL TWELVE ANSWERED, 2026-08-27**

Originally ranked by how much a wrong answer would cost. Each now carries a
ruling ID `FCR-01` … `FCR-12`, binding doctrine for this engine from 2026-08-27.

**Outcome: nine confirmed what was coded, three required a change.** Ruling on
them surfaced **four further defects that no question had named** — one of them
on the score readers see most often. Those are §7.13.

> **On sourcing, stated plainly.** Where a ruling rests on a named classical work
> it is cited at **chapter or section granularity**, which is stable across
> editions and translations. Page numbers are deliberately absent: they are
> edition-specific, and a page cited from memory is worth less than no citation.
> Where a ruling rests on **lineage practice with no printed source I can name**,
> it says so in those words rather than borrowing a book's authority. §9 keeps a
> column for the owner to add publisher / edition / page from the physical
> copies, and the rows that most need it are marked.

---

### `FCR-01` — The four karaka-relative BAV rules (§3.5)

*From the karaka or from Lagna? And is Budhan the right matula-karaka to replace
the Moon-BAV-4th formulation?*

**RULING — from the karaka, confirmed as coded. The Budhan rule is also
confirmed, but the reason recorded for it was backwards and is corrected.**

**The reference point.** The karaka's own rasi, without qualification. The
signature of this family of rules is that *the same graha supplies both the table
read and the rasi counted from* — Guru's own Ashtakavarga, counted from Guru's
own rasi. Counted from Lagna you are reading the ordinary bhava-bindu strength of
the 5th house: a perfectly good reading, a **different** one, and one
`life_areas_service` already exposes. Building it twice under two names would
have been the error. Sourced in the Ashtakavarga chapters of BPHS and treated at
length in B.V. Raman, *Ashtakavarga System of Prediction*.

**Budhan — the rule stands, the justification was inverted.** The docstring said
the Mercury rule "replaces the weaker Moon-BAV-4th formulation" because "the Moon
variant conflates the mother with her siblings." It is the other way round.
Budhan is **mātula-kāraka** — kāraka of the mother's *brother*, of the maternal
relatives. Chandran is **mātṛ-kāraka**, kāraka of the mother herself, and is the
exact counterpart of Suriyan as pitṛ-kāraka in the 9th-from-Suriyan rule sitting
beside it in the same table.

Budhan-4th and Chandran-4th are **two different classical rules, not two
formulations of one.** Neither replaces the other. The full classical set:

| Karaka | Bhava from it | Indicates | Here |
|---|---|---|---|
| Suriyan | 9th | Father | shipped |
| Chandran | 4th | **The mother herself** | **not built — and never displaced** |
| Budhan | 4th | Maternal relatives (mātula) | shipped |
| Sevvai | 3rd | Co-borns — strictly the *younger* | shipped |
| Guru | 5th | Children | shipped |
| Sukran | 7th | Spouse | deliberately unbuilt |
| Sani | 8th | Longevity | doctrinally banned |

What shipped is right. What was wrong was believing a choice had been made
between two readings when one had simply been implemented. A Chandran-4th mother
rule **may be added**; it was never rejected. The last two stay unbuilt for the
reasons already recorded, and I affirm both — the Sukran rule asserts a spouse the
profile may not have, and the Sani rule is longevity, which doctrine bans.

Two further confirmations. The **per-rule baselines are right and a flat cut
would have been wrong**: a bindu count means different things in tables totalling
56 and 39, and calling 74% of sibling indications "thin" as an artefact of
Sevvai's small table would have been a visible, checkable error. And **never
converting a bindu into a headcount** is correct — the sutras are widely quoted
as giving exact numbers of children and of a father's brothers, and they should
not be.

*Changed:* `bav_derived.py` docstring. No calculation change.

---

### `FCR-02` — Naisargika maitri node rows (§3.3.2)

*Ketu holds Rahu an enemy while Rahu does not list Ketu; Ketu holds Mars a friend
while Mars holds Ketu neutral.*

**RULING — both are transcription accidents, not doctrine. Made symmetric. And
there was a third one, which nobody had noticed.**

**The principle that settles all of them.** A classical naisargika asymmetry is
*derived*, never asserted. Every asymmetry in the seven-graha core falls out of
the Moolatrikona arithmetic — from a graha's MT sign the 2/4/5/8/9/12 are
friendly and the 3/6/7/10/11 inimical — which is exactly why Moon-regards-
Mercury-friend / Mercury-regards-Moon-enemy is doctrine and not a typo. **The
nodes have no Moolatrikona sign, so no derivation is available to them, and
therefore no node asymmetry can be justified from any source.** A one-sided node
grade is an accident by construction. That converts a matter of taste into an
invariant, which is how it is now tested rather than remembered.

A sweep of all 9×9 ordered pairs found **three**, not two:

| Pair | Was | Ruled | Reason |
|---|---|---|---|
| Ketu / Rahu | Ketu→enemy, Rahu→neutral | **ENEMY both ways** | Permanent exact opposition, no shared benefic agency, and Tamil practice reads the reciprocal antardasha (Rahu in Ketu, Ketu in Rahu) as unsettled, never supported |
| Ketu / Mars | Ketu→friend, Mars→neutral | **FRIEND both ways** | The classical dictum *Kuja-vat Ketu* — Ketu acts as Mars acts, and shares Mars's Scorpio agency |
| **Rahu / Saturn** | Rahu→friend, Saturn→neutral | **FRIEND both ways** | The counterpart dictum *Shani-vat Rahu*. **Not named in the review.** This was the one that mattered most: Saturn is the heaviest-weighted graha in the daily transit component, so a Rahu/Saturn pairing graded friend one way and neutral the other landed on the number readers see most often |

All 9×9 ordered pairs are now symmetric. The genuine Moon/Mercury asymmetry is
untouched — flattening that would be the opposite error, and a test already
pins it.

*Changed:* `chart_strength.py` — three rows; new test
`test_node_rows_are_symmetric_in_both_directions`. `STR-01` is closed.

---

### `FCR-03` — The age-stage dasha modifiers (§5.1, component 3)

*Is the direction right, and are Sun/Mercury/Rahu/Ketu correctly left flat?*

**RULING — the direction is right; the thresholds were unsourced and are now
pinned to printed doctrine; and no, three of the four flats were wrong.**

**There is a printed doctrine underneath this function and it was not being
used.** The classical **graha maturity (paripakva) ages** state when a graha
begins to deliver its dasha in full:

| Guru | Suriyan | Chandran | Sukran | Sevvai | Budhan | Sani | Rahu | Ketu |
|---|---|---|---|---|---|---|---|---|
| 16 | 22 | 24 | 25 | 28 | 32 | 36 | 42 | 48 |

Every youth threshold is now cut there instead of at a round number. Nothing
about the shape of the curve changed — it is the same teaching, cut where the
tradition cuts it.

| Graha | Was | Now |
|---|---|---|
| Sani | 0.88 before **30** | 0.88 before **36**; 1.05 after 55 |
| Sevvai | 0.92 before **25** | 0.92 before **28**; 1.05 to 45; 0.95 after |
| Sukran | 0.90 before **20** | 0.90 before **25**; 1.08 to 40; 0.95 after 55 |
| Chandran | 1.05 before **20** or after 60 | 1.05 before **24** or after 60 |
| Guru | 1.10 between 35 and 60 | **unchanged** — see below |
| Suriyan | flat | **0.92 before 22** |
| Rahu | flat | **0.90 before 42** |
| Ketu | flat | **0.90 before 48** |
| Budhan | flat | **flat — and now for a stated reason** |

**On the flats, which is the substantive half of the answer.** Rahu matures at
42 and Ketu at 48 — the two latest ages in the whole scheme, and the two grahas
whose dashas are most notoriously difficult when they run early. An 18-year Rahu
mahadasha opening at 5 and one opening at 45 are not the same period, and every
practitioner knows it; leaving both nodes flat was the least defensible line in
the function. The Sun matures at 22, and a 6-year Sun dasha in early childhood
finds a native with no independent standing to express it.

**Budhan stays flat, and that is now a decision rather than an omission.** It
matures at 32, but a Budhan mahadasha running through childhood is the
*education* dasha and is classically favourable exactly then. The practice
contradicts the discount its maturity age would imply, so Budhan is a genuine
exception.

**Guru keeps 35–60, and what changed is the reason printed beside it.** Guru
matures earliest of all, at 16, so its uplift is **not** a maturity effect and
must not be described as one — a Guru dasha in childhood is a blessing, which is
why there is correctly no youth discount. The 35–60 uplift rests on ashrama
fitness: the grihastha and vanaprastha years are where Guru's significations have
somewhere to land. That remains **[LINEAGE]**, and I am content to own it as
such rather than dress it as sourced.

*Changed:* `_dg_scoring._age_dasha_modifier`; `DAILY_SCORE_ENGINE_VERSION`
bumped to `2026-08-27-v10` so warm rows recompute.

---

### `FCR-04` — Kandaka Sani (§3.8)

*From Lagna, Janma Rasi or Arudha Lagna, and over which houses?*

**RULING — 4/7/10 from the Janma Rasi. Confirmed as coded (`A-1`). Named twice,
scored once, is also correct and must stay.**

The whole Sani-cycle vocabulary — Janma, Ezharai, Ardhashtama, Ashtama, Kandaka —
is one family and is reckoned from the Janma Rasi throughout. Taking one member
of that family off Lagna is what produced the earlier near-disjoint population,
and the note already in the file is right that the tidiness was an engineering
preference rather than a source. Arudha Lagna is not the reference for any of
them. The houses are the three kendras other than the 1st, the 1st being Janma
Sani, which already has its own name.

**Layering.** A layered name is not a second affliction, and scoring it once is
the only defensible treatment. Telling the reader both names is right — a native
who has heard "Kandaka Sani" from an elder should find it in our output.

**One thing worth the owner's eye, which the question did not ask.** Because
Kandaka's 4th coincides with Ardhashtama, the −7 reaches *alone* only when Saturn
is in the **7th or 10th** from the Janma Rasi. The 10th is the weaker limb:
standard gochar reads Saturn in the 3rd, 6th and 11th from the Moon as
supportive and the 10th as mixed, so a flat −7 there sits against a competing
favourable reading. **Not changed** — it is a real lineage rule and one live
tension is not grounds to overrule it — but it is the limb to revisit first if
this penalty is ever retuned.

> **Copy addressed 2026-08-27. The score is untouched.** The −7 stands, flat
> across all three limbs, scored once. What changed is that the reader is now
> told *which limb fired*: `classify_kandaka_cycle` returned one generic
> "obstruction and blocked-effort" line for all three, which was doing two
> things badly. At the **4th**, where Kandaka always coincides with Ardhashtama,
> an unattributed obstruction line sitting beside the Ardhashtama reading looked
> like a second, independent affliction. At the **10th** — the contested limb —
> a reader who knows gochar met a flat penalty their own reading does not
> corroborate; naming what the 10th governs (position, standing, the weight of
> the work) is the difference between a verdict they can place and one that
> looks like an error. Display strings only; nothing matches on them.

*Changed:* `transits._KANDAKA_LIMB_LABEL` (new), `classify_kandaka_cycle` copy.
**No scoring change.**

---

### `FCR-05` — The Dinam good-count table (§3.11)

*The 12-count Tamil variant excludes 17/22/27, which a pure tara-mod-9 rule would
pass. Correct?*

**RULING — correct. Confirm and keep locked.**

The two rules are not the same object and the exclusions are the proof. By
tara-mod-9 all three excluded counts are *good* stars — 17 → 8 (Mitra), 22 → 4
(Kshema), 27 → 9 (Parama Mitra) — so a table derived from tara arithmetic could
not have produced this set by accident. Tamil தின பொருத்தம் judges the count
directly against a printed list; it is not tara wearing a different name.
Treating them as the same rule, and "restoring" the three, is the error to guard
against, and the locked spec table is the guard.

Direction is also right: **counted from the girl's star to the boy's star.**
Reversing it is a different and wrong reading.

*Changed:* nothing.

---

### `FCR-06` — The Vedha triad (§3.11)

*Mrigashira / Chitra / Dhanishta mutually Vedha, 15 edges, all 27 stars covered.*

**RULING — confirmed. The correction was right and the reasoning behind it was
sound.**

All three arguments already recorded hold independently, and I will add a fourth
that anyone can check in one line: **Mrigashira 5, Chitra 14 and Dhanishta 23 are
each exactly 9 apart** — 5 + 9 = 14, 14 + 9 = 23, 23 + 9 = 32 ≡ 5. They are one
star from each of the three nine-star groups, an exact equilateral triangle on the
27-ring, which is precisely why they close among themselves instead of joining the
pair structure. A flattened "Mrigashira–Dhanishta only" edge breaks that symmetry
and drops Chitra out of the scheme entirely.

The effect statement is also right and is the reassuring part: `{5,14}` and
`{14,23}` now veto, and **nothing that failed before now passes.** A correction
that only ever adds vetoes cannot have loosened a match that a family already
relied on.

*Changed:* nothing.

---

### `FCR-07` — Nethiram cutoff (§3.9)

*One 2026-08-10 live case contradicts our table. What is the correct cutoff, and
from which printed source?*

**RULING — I will not supply a cutoff table from memory, and you were right not
to guess-patch it. But the defect is identifiable without one, and it is fixed.**

Nethiram and Jeevan are **one paired rubric**. An almanac prints them side by side
and a reader takes them as a single verdict, so the best of one may never be
printed beside the worst of the other. Across the whole 0–13 ring-distance domain
exactly one cell did that:

| Ring distance | Nethiram | Jeevan |
|---|---|---|
| 0–1 | குருடு (0) | இல்லை (0) |
| 2 | குருடு (0) | அரை (0.5) |
| 3–8 | ஒரு கண் (1) | அரை (0.5) |
| **9** | **இரு கண் (2)** | **இல்லை (0)** ← |
| 10–13 | இரு கண் (2) | முழு (1) |

At ring distance exactly 9 the engine printed **இரு கண் — both eyes, the best
Nethiram — beside ஜீவன் இல்லை, no life, the worst Jeevan.** No almanac prints
that pairing. The same line also made Jeevan non-monotonic in the ring distance —
0.5 at 8, 0 at 9, 1 at 10 — and no graded ring rule dips for one value and
recovers.

Ring distance 9 lands on about **7% of days** (2 of 27 stars), which is frequent
enough to be the 2026-08-10 case.

Deleting the `distance == 9` special case leaves both limbs sharing the same 8|9
boundary and moving together in three coherent grades: குருடு+இல்லை,
ஒரு கண்+அரை, இரு கண்+முழு.

**What this ruling does *not* do.** It does not re-derive the cutoffs from a
source. The `≤1` and `≤8` boundaries remain confirmed-by-review with no printed
source captured in-repo, and both limbs keep their standing status: **display-only,
zero scoring reach.** Neither may be given weight in the daily score, muhurta
ranking or porutham until a named almanac — publisher, edition, page, and whether
**Vakya or Thirukanitham** — supplies the table. That is the one §9 row where the
page column is not a formality.

*Changed:* `panchangam._jeevan_value`; existing golden test updated; new invariant
test `test_nethiram_and_jeevan_never_disagree_across_the_whole_ring`.

---

### `FCR-08` — Hora convention (§3.9)

*Equal 60-minute horas from Hindu sunrise. Confirm this is the Tamil almanac
convention you would defend.*

**RULING — confirmed. This is the convention I would defend, and the reasoning
already in the file is correct.**

Both conventions are authentic and the choice is real, but for a Tamil product it
is not close. **Tamil almanacs print hora boundaries at whole hours.** Twelve
unequal daylight and twelve unequal night horas cannot produce whole-hour
boundaries at any latitude on any date except by coincidence, so an app using
them would disagree with the printed page in the reader's own house. The
6-1-8-3 mnemonic likewise only lands where the day is 24 equal parts. The BPHS
Hora Bala footing — a sunrise-to-sunrise day divided into 24 — is the classical
warrant.

**One honest caveat, not a defect.** Equal 60-minute horas from sunrise tile 24
hours from sunrise, which is not the same interval as sunrise-to-sunrise; the two
differ by the day-length change. At Chennai that is seconds. For a diaspora
native at high latitude in June it is minutes. The engine should never claim the
24 horas exactly fill the sunrise-to-sunrise day. Worth a line in the disclosure
copy; nothing to recompute.

*Changed:* nothing.

---

### `FCR-09` — Amirdhadhi weights (§3.10)

*Amirtha +12, Siddha +4, Marana −16, Prabalarishta −30. Are the ratios
defensible?*

**RULING — three of the four are right, and the fourth is not wrong by size. It
should not be a number at all.**

- **Amirtha +12 above the broad subha-star +10 — correct**, and for the stated
  reason. The almanac treats this class as a day-selection gate, not a
  preference.
- **Siddha +4 — correct, and the defence is the non-obvious one.** Siddha is the
  **modal class** in the 189-cell grid. A bonus carried by most days is a
  constant offset, not a discriminator; sizing it up would flatten the ranking
  while feeling more generous. Small is right *because* it is modal.
- **Marana −16 against Amirtha +12 — correct.** The asymmetry is the point: a
  good day is a preference, a Marana day is a prohibition, and "no printed
  panchangam offers a muhurtam on a Marana day" is the right justification.
- **Prabalarishta — the size is defensible and the *verdict* was wrong. Promoted
  from a −30 penalty to a VETO.** The name says it: பிரபல ஆரிஷ்டம், *manifest*
  arishta. It is not a day the almanac grades down; it is a day the almanac does
  not offer. Priced at −30 from a base of 50 the day opened at 20, and the L1+L2
  bonuses available on a single day sum to **+104** — subha tithi 10, subha
  nakshatra 10, subha muhurtham 20, Abhijit 5, Nalla Neram 5, nakshatra favoured
  14, tithi best 10, lagna best 8, vara good 6, paksha preferred 6, chandra
  strong 10. **Nothing in the arithmetic stopped a Prabalarishta day from ranking
  GOOD, or even BEST.**

  The cost of vetoing is almost nothing: exactly **7 of 189 cells** are "P", one
  per weekday row — about **13 days a year**. The same reasoning already governs
  Chandrashtama in this engine ("the day is dropped, not merely docked, because
  no almanac strength offsets it") and it applies with more force to the worst
  class in the table, not less. The `terminative` exemption is preserved: both
  adverse classes still clear for acts meant to end something, because a veto
  that ignored that would be harsher than the source states.

*Changed:* `muhurta_engine._almanac_amirdhadhi_factor` — Prabalarishta now
returns `Verdict.VETO`. Marana unchanged at −16.

---

### `FCR-10` — Amavasai's two treatments

*Not penalised in the daily score (`PAN-15`), −5 in muhurta ranking (`PAN-16`).
Correct distinction or inconsistency?*

**RULING — a correctly drawn distinction. Both stand. This is the one on the list
that looked like an inconsistency and is not.**

They answer different questions, and the doctrine sentence is worth writing down
because the same shape will recur:

> **The daily score grades a day. The muhurta engine selects a day for an act. A
> day may be sacred and still be unfit for beginnings.**

Amavasai is not a bad day; it is a day with a purpose — Pitru Tarpanam, and Thai,
Aadi and Mahalaya Amavasai are among the most observed days in the Tamil year.
Penalising it in a general life-quality score would tell a native that the day
they perform tarpanam for their ancestors is a poor day, which inverts the
practice. In muhurta the question is whether to *begin* something, and there
Amavasai is universally closed to new undertakings. −5 is if anything light.

**One refinement, flagged not implemented.** The −5 is currently flat across all
activities. The sources close Amavasai to marriage, griha pravesham, business
start and travel; they do not close it to spiritual acts, which it positively
indicates. A per-activity treatment — veto where the chapter closes it, and no
penalty at all for tarpanam and spiritual observance — would be truer than one
number. That needs the activity registry and is a change of scope, not a defect.

> **AMENDED 2026-08-27, same day. Both halves of the paragraph above were
> wrong, and the error hid a live defect.**
>
> **On scope.** The activity registry already exists, and so does the exact
> field — `ActivityRules.tithi_avoid_amavasya`, read by the engine. **21 of the
> 30 activities already bind it to a sourced constant.** This was never a change
> of scope; the machinery was built, wired and in use. The claim came from
> grepping for the literal `tithi_avoid_amavasya=True` and finding nothing —
> every one of them binds a named constant instead.
>
> **On the defect.** Because both layers were already live, Amavasai was being
> **counted twice**: the generic L1 −5 *and* the activity's own L2 verdict for
> one and the same fact. −19 where the chapter grades a penalty; for the four
> that veto, a redundant −5 and two reason chips both naming Amavasai. Measured
> over a 180-day × 30-activity Chennai sweep: **138 cells**, all moving by
> exactly +5, no verdict flips.
>
> **On the spiritual exemption — withdrawn.** It has no target. There is no
> tarpanam or spiritual-observance activity in the registry, and for the
> spiritual-adjacent ones the sources say the *opposite* of what I assumed:
> Mantra initiation and ritual bath **veto** Amavasai, and Veda study penalises
> it — correctly, since Amavasai is a classical anadhyayana day. Implementing an
> exemption would have been me overruling Kalaprakasika from memory across 21
> sourced rules. The source outranks the assumption.
>
> **What was actually fixed.** A precedence rule, now in the module docstring:
> *a generic almanac convention stands down where the activity's own chapter has
> ruled on the same fact.* Where the chapter is silent — 9 activities, MARRIAGE
> among them — L1 is the right fallback and still applies in full. The generic
> weight was **left at −5**: standing L1 down already moves 138 cells, and
> retuning the weight in the same change would make it impossible to tell which
> edit moved a ranking.
>
> Two further defects surfaced while verifying, both fixed — see `FCR-10a` and
> `FCR-10b` below.

---

### `FCR-10a` — the auspicious remainder blessed the new moon

*Found while verifying `FCR-10`. Not raised by any question.*

`tithi_remainder_auspicious` encodes a source sentence of the form *"all Thithis
except X are auspicious"*, and awarded the remainder a **+5 bonus**. Read to the
letter, it certified **Amavasai as positively good for sowing** — because that
chapter's short exclusion list happens not to name the new moon. The generic
layer's −5 and this +5 then netted to zero, so the new moon scored as an
ordinary day.

**RULING — the remainder stops short of the new and full moon.** Amavasai and
Pournami are their own category in every Tamil almanac, not two more entries in
"all other tithis". A chapter that names three tithis to avoid is not thereby
blessing the new moon. The engine's own generic subha lists already agree,
admitting **neither** 15-shukla nor 15-krishna.

In-paksha 15 now falls to NEUTRAL for these activities and the generic reading —
the only layer that has actually judged it — stands. Blast radius: **42 cells**
over the same sweep, across 7 activity/paksha combinations.

*Changed:* `muhurta_engine._registry_tithi_factor`.

---

### `FCR-10b` — ear-boring's closed list was not recognised as a ruling

*Found while verifying `FCR-10`.*

A chapter can rule on Amavasai two ways: by naming it (`tithi_avoid_amavasya`),
or by **closing its list** — *"Other Thithis are not to be considered"* — which
rules on every tithi including Amavasai without naming it. Ear-boring is the
only activity in the sourced doctrine that closes its list, and the first cut of
the precedence fix checked only the first mechanism. It therefore kept a
redundant generic chip beside its own veto.

*Changed:* `muhurta_engine._activity_rules_on_amavasai` now accepts either
mechanism.

---

### `FCR-10c` — **CLOSED by astrologer ruling, 2026-08-27. Marriage on Amavasai: 83 → 74.**

*Found while verifying `FCR-10`. Held for the owner, then fixed on their ruling.*

`MARRIAGE` keeps its own branch, and its tithi tiers stopped at the
**fourteenth** of the waning fortnight: `MARRIAGE_TITHI_INAUSPICIOUS_KRISHNA_
AFTER_ASHTAMI` was `{9…14}`. Amavasai is in-paksha **15**, so it matched no tier,
fell to a bare NEUTRAL, and its only treatment was the generic −5. Measured on
2026-06-15, a real Amavasai: `MARRIAGE` scored **83.0 and was not vetoed** — a
good score for a day no Tamil family will marry on.

**Why it was held.** Fixing it meant asserting a marriage tithi rule, and a page
will not be cited from memory for the flagship activity — that is the whole
discipline of the `[PAGE NEEDED]` register. The module also carries an explicit
warning that altering marriage's branch silently re-scores every marriage day.

**What the ruling turned on.** Not a new citation — a re-reading of the sentence
already extracted. *"All the Thithis after Ashtami of Krishna Paksha are
inauspicious"* is **inclusive in the ordinary tithi sequence**: Krishna Ashtami
is the 8th of the dark fortnight, so the tithis after it run **9 through 15**,
and Krishna 15 **is** Amavasai. The first extraction stopped at 14 because the
source names Pournami but never names the new moon, and that asymmetry read as
deliberate. It was not. Pournami being separately named does not change
Amavasai's numerical identity as Krishna-paksha 15.

So this was an **extraction omission inside a rule we already had**, not a
missing rule — which is why it closed without a new page.

**Ruling (a), not (b): swept, not vetoed.** Amavasai takes `TITHI_INAUSPICIOUS`
(−14) at the same weight as the rest of the back half. It is deliberately *not*
promoted to a marriage veto. The supporting evidence for a veto is real —
**21 of 29 chapters close Amavasai**, four as outright vetoes (a child's first
milk, the naming ceremony, mantra initiation, the Samavarthana bath) — and
traditional practice does treat the new moon as closed to weddings. But the
cited p.79 sentence establishes **inauspiciousness, not absolute prohibition**,
and this engine scores the page rather than the practice. A veto needs a
marriage-specific passage saying the new moon must be completely avoided.

The Annaprasana counter-example does not overturn it: *"Amavasai not stated for
this rite"* is right where that rite's source contains no encompassing rule.
Marriage **does** have one — *all* tithis after Krishna Ashtami — and Amavasai
falls inside it.

**Both halves, or the fix trades one defect for another.** Widening the sweep
alone would have charged the new moon twice for one fact: a cited −14 from
marriage's own branch *plus* the generic −5, with two chips on the card both
explaining Amavasai. `_activity_rules_on_amavasai` therefore returns `True` for
`MARRIAGE`, standing the generic line down — the same double-count `FCR-10` had
just removed from the other 21. The two edits are pinned together by test and by
comment on both sides.

**Verified:** 2026-06-15 now scores **74.0**, not vetoed, with exactly one factor
naming Amavasai — `TITHI`, PENALTY −14, `rule_id=MARRIAGE_TITHI_ALLOWED_SET` —
and no `ALMANAC_TITHI` chip. Distribution re-measured as a paired before/after
over one window (90 days from 2026-06-01, Chennai, n = 1907 unvetoed):
**identical on both sides** — min 1, p50 81, p95 132, max 150, 31.7% ≥ 100. The
display mapping was not retuned.

*Changed:* `marriage_muhurta_rules.MARRIAGE_TITHI_INAUSPICIOUS_KRISHNA_AFTER_
ASHTAMI` (adds 15) and its `RuleSource` notes/interpretation;
`muhurta_engine._activity_rules_on_amavasai` (MARRIAGE short-circuit),
`_tithi_factor` marriage branch, `_W.ALMANAC_AMAVASAI` and
`_almanac_tithi_factor` counts, module docstring, display-mapping measurement
note; `muhurta_activity_registry` module docstring. Tests: three added and two
widened in `tests/test_muhurta_engine.py` (45 pass; 165 pass across the twelve
muhurta suites).

---

### `FCR-10d` — **CLOSED by astrologer ruling, 2026-08-27. The 10/11/13 overlap is precedence, not a conflict.**

Standing OPEN QUESTION beside the same constant: the best-7 tithi list contains
10, 11 and 13, which are also in-paksha numbers swept by *"after Ashtami of
Krishna Paksha"*. The engine applied the sweep as more specific **and emitted a
`FactorResult.conflict` string** saying the ambiguity was "pending astrologer
confirmation" — which reached the API via `app/schemas/muhurta.py`.

**Ruled:** this is a general rule meeting its own paksha-specific qualification,
not an unsettled contradiction. The narrower Krishna statement governs the dark
fortnight. Krishna 10/11/13 are **swept**; Shukla 10/11/13 keep **best**. The
scoring was already correct — only the runtime conflict was wrong, and it is
gone. Reopen only if the surrounding p.79 text turns out to state that the
best-7 hold in either paksha.

The `conflict` field itself is **kept**: no factor emits it now, but the
mechanism is right for the next genuinely unsettled page, and it is already on
the wire — dropping it is a four-surface contract change, not a local cleanup.
That reasoning is recorded on the field.

*Changed:* `_tithi_factor` marriage branch (conflict emission removed, comment
replaced with the ruling), `FactorResult.conflict` docstring, the constant's
comment block, `MARRIAGE_TITHI_ALLOWED_SET` notes. The old conflict test was
replaced by one asserting the settled behaviour on both pakshas, plus a guard
that no factor reports an unresolved conflict.

---

*Changed for `FCR-10`:* `muhurta_engine._almanac_tithi_factor` (now takes
`activity`, may decline), `_activity_rules_on_amavasai` (new),
`_registry_tithi_factor`, `score_day`; module docstring gains the
RULE_PRECEDENCE rule. Five tests added in `tests/test_muhurta_engine.py`.

---

### `FCR-11` — Moon's Moolatrikona zone

*4°–30° Taurus in code; BPHS gives 3°–30°.*

**RULING — keep 4°–30°. But the degree was the smaller half of the question, and
the larger half is that the zone could never fire.**

**On the degree.** The Moon's exaltation *point* is 3° Taurus, and Moolatrikona
begins after the exaltation degree — a 3°–30° zone would overlap the point it is
supposed to follow. 4°–30° is the coherent reading and the one Tamil practice
prints. No change.

**On what the question uncovered.** `_dignity_score` tests exaltation at
**whole-sign** granularity and returns 100 before it ever reaches the
Moolatrikona branch. For five grahas the two signs differ, and that shortcut is
harmless and standard. For two they are the **same sign**, and the rung
underneath was unreachable:

| Graha | Sign | Classical zoning | Engine gave |
|---|---|---|---|
| Chandran | Taurus | 0°–3° exalted (100), **4°–30° Moolatrikona (90)** | 100 for all 30° |
| Budhan | Virgo | 0°–15° exalted (100), **16°–20° MT (90)**, **21°–30° own (80)** | 100 for all 30° |

So the 26 degrees from 4° to 30° Taurus over-scored the Moon by 10 dignity
points, and the upper half of Virgo over-scored Mercury by 10 or 20. The Moon is in Taurus in
about one chart in twelve. Dignity carries **0.30** of the composite through
Sthana Bala and flows on into Bhava Bala, the life-area score and the prediction
layer — this was not cosmetic.

Bounding the exaltation test by degree for exactly these two grahas restores the
ladder and leaves the other five untouched. **The rule to remember: a graha whose
exaltation sign is also its Moolatrikona sign must be zoned by degree, or the
lower rung is dead code.**

*Implementation note.* The printed tables leave a one-degree gap in each sign —
the Moon's exaltation is stated to 3° and its Moolatrikona from 4°, Mercury's to
15° and from 16°. The engine closes each gap **upward into exaltation**
(`EXALTATION_ZONE_END` = 4.0 and 16.0) so no degree falls through to a lower rung
by accident. That is the conservative direction: it can only over-credit by one
degree, never strand one.

*Changed:* `chart_strength.EXALTATION_ZONE_END` (new) and `_dignity_score`.

---

### `FCR-12` — D9 debilitation penalty symmetry

*−5 against a +5 bonus. Should the penalty be heavier?*

**RULING — heavier, but only where the classical case actually bites. −5 base,
−10 when the graha is exalted in rasi.**

A flat increase would be the crude answer. The severe classical reading is
specifically **"exalted in rasi, neecha in navamsa"** — exalted in name, powerless
in effect — and its severity comes from *how much promise the navamsa is
contradicting*. A graha already weak in rasi and neecha in navamsa is merely
consistently weak, the six balas have already said so, and charging it double
would be double-counting the same fact.

So the penalty now scales: **−5 as the base, −10 when natal dignity is 100.**
Ten sits level with Gandanta, above rasi sandhi's −8, and well inside the
combustion gradient's −22 maximum — the right neighbourhood for a structural
dignity failure in a score that is explicitly not Shadbala. Vargottama stays
exempt, correctly.

The **gating** asymmetry already in place is also right and I confirm it: the
bonus is gated on a neutral natal dignity because D9 strength is a tie-breaker
for an average graha, while the penalty is ungated because the case that most
needs it is precisely the exalted one.

*Changed:* `chart_strength.D9_DEBILITATION_PENALTY_EXALTED` (new) and the
modifier branch.

---

### 7.13 Found while ruling — four defects no question had named

Recorded here because the review's own §3.5 defect note proved the value of
writing these down rather than fixing them silently.

| # | Where | Defect | Status |
|---|---|---|---|
| 1 | `chart_strength.py` | **A third naisargika asymmetry: Rahu/Saturn**, graded friend one way and neutral the other. The review named two. This is the one that reaches the daily score, because Saturn carries the heaviest transit weight | **Fixed** (`FCR-02`) |
| 2 | `chart_strength.py` | **The Moon's and Mercury's Moolatrikona rungs were unreachable** — whole-sign exaltation returned 100 first. ~1 chart in 12 carried an over-scored Moon | **Fixed** (`FCR-11`) |
| 3 | `panchangam.py` | **Jeevan contradicted Nethiram at ring distance 9** — best eyes beside no life — and was non-monotonic across 8/9/10 | **Fixed** (`FCR-07`) |
| 4 | `muhurta_engine.py` | **A Prabalarishta day could be displayed GOOD or BEST.** −30 from a base of 50 against +104 of available bonuses is not a gate | **Fixed** (`FCR-09`) |

The common shape in three of the four: **a rule was written correctly and then
made unreachable, or self-contradictory, by the code around it.** None would have
been caught by reading the rule's own line. #2 in particular was found only by
asking what `_dignity_score` does *before* it reaches the table the question was
about — which is the argument for auditing the executing order, not the constants.

---

## 8. How any of this can be verified

| Apparatus | What it guards |
|---|---|
| `tests/test_rulebook_invariants.py` | Pins code to the rulebook's own sentences — the Amirdhadhi grid shape and class domain, Kandaka's 4/7/10-from-Moon, the gazetted-year bounds. A doctrine change cannot land without updating the rulebook too |
| `tests/test_rulebook_appendix_sync.py` | The printed table appendix is **generated from the constants the engine evaluates**. A reviewer never has to take a table on trust, and a hand-copied table cannot drift |
| `tests/test_bav_disclosure_boundary.py` | Fails if the bindu grid ever acquires a band word, a life-domain label, or a karaka-relative highlight — the four disclosure gates cannot be bypassed by a change that looks innocent in the grid's own file |
| `tests/test_chart_strength.py` → node symmetry | **Added by `FCR-02`.** Fails if any Rahu or Ketu row is graded in one direction and left neutral in the other. Assertable as an invariant rather than a blessed-exception list, because node asymmetries have no Moolatrikona derivation available to them and are therefore accidents by construction |
| `tests/test_panchangam.py` → Nethiram/Jeevan ring invariant | **Added by `FCR-07`.** Walks the whole 0–13 ring-distance domain and fails if the best of one limb is ever printed beside the worst of the other, or if Jeevan dips. Catches a paired-rubric contradiction without needing the printed table the cutoffs still lack |
| `tests/test_golden_reference_cases.py`, `test_golden_validation.py` | Fixed charts with known expected outputs |
| `tests/test_tone_compliance.py`, `test_mortality_class_sweep.py` | Shipped-tree sweeps for banned phrasings |
| `tests/test_muhurta_engine.py` (§9.4 gate) | Prevents any service growing a second copy of the generic almanac layer |
| `tests/test_nadi_dosha_v2.py` | Locks native-reviewed Tamil strings — any edit must go through review and update the golden test |
| `tests/test_api_wrapper_route_contract.py`, `test_api_wrapper_field_contract.py` | Catch backend/shared-client drift across the four API surfaces |
| `tests/test_wi07_sunrise_validation_harness.py` | Sunrise convention validation |
| `app/api/qa.py` → `/validate` | A live golden-case runner, 10 categories, callable against a running instance |
| `app/services/prediction_log_service.py` + `reasoning/calibration.py` | Records the band each prediction was issued at, so recalibration has data rather than opinion |

**Test data discipline:** no real personal data — real birth profiles, names or
exact coordinates — appears in any test, fixture, seed, doc or example payload.

---

## 9. Reviewer sign-off sheet — **SIGNED 2026-08-27**

Signed as the reviewing astrologer. **29 of 30 blocks signed: 24 Correct, 2
Incorrect-and-fixed, 2 Incomplete-by-declaration, 1 School variant. One block is
deliberately NOT signed** (yoga detectors) — the split it was withheld for was
delivered on 2026-08-27, but the split is not the signature and the 32 per-yoga
verdicts are still owed. Block 4 (avastha) additionally carries a variant flag
on a sub-item, the Baladi multipliers.

**Citation granularity, stated so nobody over-reads this sheet.** Sources are
named at chapter or section level, which is stable across editions. **No page
numbers are given, because I will not cite a page from memory.** Six rows are
marked **`[PAGE NEEDED]`** — those are the ones where the rule is lineage
practice or a specific almanac table, and where the physical copy genuinely has
to supply publisher, edition, page, and for any almanac **whether it is Vakya or
Thirukanitham**. The other rows rest on classical works whose chapter-level
citation is sufficient to check the rule.

| Block | § | Verdict | Source / note |
|---|---|---|---|
| Foundation — ayanamsa, mean node, whole sign, Hindu sunrise | 3.1 | **Correct** | Lahiri/Chitrapaksha is the Indian Calendar Reform Committee standard and the basis of every Thirukanitham almanac. Whole-sign bhava = rasi is Tamil practice. Mean node is the almanac convention; disclosing the JHora true-node divergence rather than switching is the right handling |
| Dignity ladder and Moolatrikona zones | 3.3.1 | **Incorrect → fixed** (`FCR-11`) | Ladder values correct per the graha-dignity chapters of BPHS and Phaladeepika. The defect was **evaluation order, not values**: whole-sign exaltation returned 100 first, so the Moon's and Mercury's Moolatrikona rungs were unreachable. Moon 4°–30° Taurus retained against BPHS's 3° |
| Naisargika maitri, including node rows | 3.3.2 | Core **Correct**; node rows **Incorrect → fixed** (`FCR-02`) | Seven-graha core is Parashari and derivable from the Moolatrikona rule, which is what makes its asymmetries doctrine. Node rows are Tamil lineage practice — **no printed source exists for them, here or anywhere I can name. `[PAGE NEEDED]`** Three one-sided grades made symmetric; `STR-01` closed |
| Avastha schemes and the Deeptadi simplification | 3.3.3 | **Incomplete** (correctly declared) + **School variant** on the multipliers | Baladi and Jagradadi zoning and the odd/even reversal are correct (BPHS avastha chapter). Deeptadi as a relabel with 3 of 9 rungs unreachable is correctly declared a simplification rather than claimed complete. **But the Baladi multipliers 0.50/0.75/1.00/0.65/0.25 are a smoothed product curve, not the classical fractions** — the texts give quarters and halves and differ among themselves. I am not signing those five numbers as classical. **`[PAGE NEEDED]`** — give me the lineage's own figures |
| Six-bala blend — weights and modifiers | 3.3.4 | **Correct** as a declared `[PRODUCT]` blend | Correct *because* it is labelled not-Shadbala (`CORE-12`); the same numbers presented as Shadbala would be indefensible. Both prior corrections confirmed: retrogression rewarded once through Chesta Bala only — the old flat +8 on top was a genuine error and the 2026-07-18 review was right — and Venus–node resolved to friend. D9 debilitation now graded (`FCR-12`) |
| Classical Shadbala and its three omissions | 3.3.6 | **Incomplete — correctly, and this is the right call** | Sub-balas per the Shadbala chapters of BPHS and B.V. Raman, *Graha and Bhava Balas*. Omitting Abda, Masa and Yuddha rather than approximating them makes the total an honest **floor**; the experimental label pending Jagannatha Hora cross-validation is the correct posture. A guessed Yuddha Bala would have been worse than a missing one |
| Bhinnashtakavarga table and the node ruling | 3.5 | **Correct** | Table per the Ashtakavarga chapters of BPHS and Phaladeepika. **The Mars-from-Lagna correction to [1,3,6,10,11] is right** — the spec had duplicated the Mars-from-Mars row, and Mars totalling 39 rather than 41 is the classical figure. `A-15` node ruling correct; the stale proxy comment is now deleted |
| Karaka-relative indications and their bands | 3.5 | **Correct** (`FCR-01`) | From the karaka, confirmed. BPHS Ashtakavarga chapters; B.V. Raman, *Ashtakavarga System of Prediction*. Budhan is mātula-kāraka and the rule stands — the docstring's justification was inverted and is corrected. Per-rule baselines right; band-never-count right |
| Yoga detector definitions | 3.6 | **NOT SIGNED — split delivered 2026-08-27, per-yoga verdicts owed** | `YOG-01` was right and was not papered over. Twenty independent definitions cannot take one verdict, and "Raja Yoga" alone has several legitimate classical formulations plus a great many loose modern ones. **The condition I set is met:** `YOG-01` is retired and 32 per-yoga rules now each carry their own ID, presence test, strength ladder, cancellation set, marker and source, printed in the [table appendix](VINAADI_RULEBOOK_TABLE_APPENDIX.md). **Still do not read a blanket approval into this row** — the split is not a signature, and this row stays unsigned until the 32 are marked one by one. Three rows want ruling first: `YOG-AD-01`, `YOG-DN-01`, `YOG-RY-01`. Writing the split also exposed a live defect that no reading of the old single line could have caught — nine yogas capped at the dormant activation rung by a mis-keyed lookup — which is itself the argument for per-yoga IDs |
| Sevvai dosham references, gender weighting, nivarthi | 3.6 | **Correct** | Checking **all three references independently — Lagna, Chandran and Sukran — and recording which fired** is the correct Tamil treatment; the common shortcut of reading from Lagna alone is why two astrologers so often disagree on the same chart. Houses 1/2/4/7/8/12 correct. Mutual cancellation of two uncancelled charts correct. **Gender weighting is `[LINEAGE]` — `[PAGE NEEDED]`** |
| Kala Sarpa mechanics and direction handling | 3.6 | **Correct** | Judging on actual longitude, over the seven grahas only, with no degree tolerance at the node ends, is the strict and correct reading. **Recording ANULOMA/VILOMA without letting it disqualify is the right call** — the "Kala Amrita" reversal is a real school position, and baking it in would silently adopt one school over another |
| Vimshottari construction and balance | 3.7 | **Correct** | Cycle, order and year-lengths correct; opening lord from the Moon's birth nakshatra with balance proportional to the portion remaining is the classical construction; nakshatra held at exactly 40/3° is right. `DAS-06` — a secondary system may display but never silently override Vimshottari — is a sound standing rule and should stay |
| Sani cycles, Moorti, Kandaka layering | 3.8 | **Correct** (`FCR-04`) | All members of the cycle family counted from the Janma Rasi, which is the whole point. Moorti table (1/6/11 Swarna, 2/5/9 Rajata, 3/7/10 Tamra, 4/8/12 Loha) is the classical one; taking it at the real ingress instant is a defensible lineage refinement, not a liberty. Kandaka 4/7/10, named twice and scored once. See `FCR-04` on the 10th being the limb to revisit first |
| Sade Sati segmentation and mitigations | 3.8 | **Correct in structure; the 90-month table `[PAGE NEEDED]`** | Replacing a flat seven-and-a-half-year penalty with the month-wise division is right, and **the source's own point — that the whole period is not adverse — is what most readings get wrong**. Phase position from the real ingress instant is right. Mitigations sound, and flooring at 1 so a mitigated cycle is lighter but never free is correct. The month-band grades themselves need their printed source named |
| Five limbs as spans; the duration-weighting change | 3.9 | **Correct — the single best correction in the document** | Limbs as timed spans rather than sunrise instants is right, and the division of labour is exactly right: the உதய rule still *names* the day while the *score* is duration-weighted. The Vishti finding — the penalty never applied on 100 of the 149 days it occurs — is the proof, and it is the kind of error no amount of reading the rule would have caught |
| Kalams, Gowri, Abhijit, Hora | 3.9 | **Correct** (`FCR-08`) | Eight equal parts of the real daylight interval, correct. Gowri as full 7×8 per-weekday tables rather than one rotating cycle, correct. **Abhijit as the 8th of 15 equal daylight muhurtas is the classical definition**, and the fixed noon ± 24 minutes it replaced was only ever right near an equinox at low latitude. Hora confirmed as equal 60-minute from Hindu sunrise, with the high-latitude caveat noted in `FCR-08` |
| Amirdhadhi grid and its weights | 3.9, 3.10 | Grid **Correct**; weights **Correct after `FCR-09`** | Grid from *Ungal Vazhkkai Vazhikatti*, cross-checked against the publisher's own article and the Dagdha set. **The reverted "correction" was right to revert** — the seven Amrita-Siddhi muhurta pairs and this daily-classification table are different objects, and the Siddha landing is the tell. Weights: Amirtha/Siddha/Marana ratios confirmed; Prabalarishta promoted from −30 to VETO |
| Tamil month boundary — sunset threshold | 3.9 | **Correct** | The sunset rule is the Tamil Nadu rule; the competing sunrise rule belongs to other regional traditions, and a fork on 8 of 12 months is what a regional fork looks like, not a bug. Deleting the single hardcoded Aavani correction was right. **Requiring publisher, edition and Vakya-or-Thirukanitham before any re-introduction is the correct bar** — a Vakya date cannot be reproduced by a drik engine at all, so adopting one would make the engine permanently inconsistent with itself |
| Muhurta factor model, veto policy, UNSOURCED handling | 3.10 | **Correct** | Keeping **`UNSOURCED` distinct from `NEUTRAL`** is the best design decision in the engine — "we checked and it is fine" and "we have no rule" must never render alike. Surfacing rule conflicts rather than resolving them silently is the second best. And `subject=None` meaning the personal factors are **not computed at all** is the correct definition of general mode |
| Muhurta weight table | 3.10 | **Correct** as `[PRODUCT]`, with `FCR-09` | Correctly declared ENGINE_POLICY rather than doctrine. **Not penalising retrogression is right and the reasoning is right**: Tamil practice suspends muhurthams inside மௌட்யம், not inside a vakri period, and no almanac blanks the four months a year Guru is retrograde. Star ranked above weekday is right. Karaka-combust sized to exactly cancel a favoured star is a genuinely good piece of calibration |
| 10-Porutham rules, Vedha triad, Vasya rows | 3.11 | **Correct** (`FCR-05`, `FCR-06`) | Dinam 12-count confirmed and **must stay locked against a tara-mod-9 "restoration"**. Vedha triad confirmed — Mrigashira 5, Chitra 14, Dhanishta 23 are each exactly 9 apart, an equilateral triangle on the 27-ring. Vasya additions correct and add only PASSes. Keeping Simha→Thula as printed while treating p.69's Makara as a source defect is the right call. Rajju as a veto forcing CAUTION is correct |
| Nadi parihara — strict vs lenient default | 3.11 | **Correct** | "Different rasi alone does not cancel" is right and retiring the lenient rule was overdue — it was cancelling most doshas it met. Strict default with a **disclosed** partial mitigation is the correct posture. Same nakshatra + same pada never cancelling is right. **The tone rule is exactly right and I want it kept**: Rajju's finding is unchanged, still fails, still forces CAUTION — only the claim about an outcome is gone, and that claim was never ours to make |
| Compatibility Intelligence layer weights | 3.11 | **School variant — one recommendation** | The eight-layer blend is a legitimate `[PRODUCT]` construction and nothing in it is wrong. But **Porutham at 20 of 100 is low for a Tamil audience**: the ten poruthams are the instrument the family actually uses, and a report that weights them at one fifth will disagree with the elder in the room and lose that argument. I would raise Porutham's share and let Synastry, at 5, carry the difference. **A positioning judgement, not a defect — and yours to make, not mine** |
| Chaldean core, script discipline, 53–108 gap | 3.12 | **Correct** | Chaldean rather than Pythagorean is correct for Tamil Nadu and a Pythagorean table would be dismissed on sight. The two properties that break naive implementations — no letter valued 9, and the table held as data rather than derived arithmetically — are both enforced. Raising on non-Latin input rather than silently skipping is right. **Declaring the 53–108 reading a surrogate rather than encoding unsourced meanings is the right refusal** |
| Numerology→jyotisha bridge and the astrology clamp | 3.12 | **Correct** | **The clamp is doctrine and must never be relaxed**: a numerologically ideal date that is astrologically inauspicious must never be recommended, and `requires_muhurta_confirmation = True` always on business launch is the correct expression of it — numerology ranks launch dates, it never clears one. Naming `StrengthRule` on the wire for the INVERTED maraka case is good practice: an unexplained inversion reads as an arithmetic bug |
| Promise gate → timing vote → band (D1/D2/D3) | 3.13 | **Correct — and the most important doctrine in the document** | *"No dasha and no transit can manufacture an unpromised event"* is the sentence the whole reasoning layer should be judged against, and the ban on additive scoring across the gate is what makes it real rather than decorative. **`SILENT` as distinct from `BLOCKED` — the chart is quiet, not saying no — is a real and necessary distinction** and I would resist any pressure to collapse them. BLOCKED being deliberately strict is right. Not re-adding L1 after the gate consumed it is right |
| Daily score composition and weights | 5.1 | **Correct** as `[PRODUCT]`, with `FCR-03` | Component weights are a product judgement and a defensible one. **The interval intersection for the auspicious-star ∩ clear-rasi overlap is correct and the multiplication it replaced was genuinely wrong** — the boundaries interleave, so a product claims overlap on days where none exists. Chandrashtama forcing the label down regardless of score is correct: a prohibition period is not outvoted by good transits. Age-stage modifiers re-pinned per `FCR-03` |
| Six-layer prediction score | 5.2 | **Correct** | The reasoning-gate path is the right one and should stay the default. **Halving a dosham penalty when cancelled rather than zeroing it is correct** — a cancelled dosham is mitigated, not absent, and a parihara that erased the finding would be telling the native something the chart does not say |
| Life-area house/karaka routing | 5.3 | **Correct** | All seven house/karaka pairs are the standard ones. **Resolving a node dasha lord's functional nature by dispositor + house rather than a NEUTRAL fallback is right** and matching every other consumer is what keeps two surfaces from disagreeing about one chart. Optional, not an error: Health could carry Chandran as a third karaka for constitution — Suriyan + Chevvai for vitality is standard and the omission is defensible |
| The declared non-computations | 6 | **Correct — the section that earns the most trust** | Every line is a defensible refusal, and a reviewer learns more from this page than from any other. The two I would defend hardest: **no headcount of children or relatives from bindus**, because a printed count is instantly checkable and being wrong about a reader's own family costs more than silence; and **no death, mortality or fatal-outcome assertion under any framing**. Sweeping the shipped tree for banned phrasings rather than trusting review is the right mechanism |

### 9.1 What I did not sign, and what I still need

1. **Yoga detectors (§3.6).** Still not signed — but **the split is done, so
   what remains is a queue of verdicts, not a gap.** `YOG-01` is retired as a
   markable rule; 32 per-yoga rules (`YOG-GK-01` … `YOG-NKC-03`, plus
   `YOG-ACT-01`) each carry an explicit condition set, strength ladder,
   cancellation set, marker and source, generated from
   `app/calculations/yoga_rules.py` and pinned to the emitted codes by
   `tests/test_yoga_rules.py`. Raja Yoga became three rows, Pancha Mahapurusha
   five. **What I now need is the marking pass, one rule at a time.** Start with
   `YOG-AD-01` (Adhi's presence test is looser than the classical rule),
   `YOG-DN-01` (a Dhana condition with no classical parent), and `YOG-RY-01`
   (which of four live Raja Yoga formulations we implement) — each of those
   changes *who sees a yoga*, not merely how strongly it reads.
2. ~~**Baladi avastha multipliers (§3.3.3).**~~ **CLOSED 2026-08-27 by
   relabelling.** The choice offered was "source them or relabel them
   `[PRODUCT]`"; the second was taken. The zoning stays signed `[CLASSICAL]`,
   the five numbers are now `[PRODUCT]` at the constant and in §3.3.3, and the
   curve itself is unchanged. Reopening for a classical label needs printed
   fractions — [`PN-2`](VINAADI_PAGE_NEEDED_REGISTER_2026-08-27.md).
3. **Five `[PAGE NEEDED]` items** — four marked in the table above (naisargika
   node rows, the Baladi multipliers, Sevvai gender weighting, the Sade Sati
   90-month grades) plus, from `FCR-07`, the Jeevan/Nethiram cutoffs. These are
   the rules that rest on lineage or on a
   specific almanac rather than on a classical work, and only the physical copy
   can close them. For any almanac row: publisher, edition, page, **and whether
   Vakya or Thirukanitham.**

   > **Now tracked in
   > [`VINAADI_PAGE_NEEDED_REGISTER_2026-08-27.md`](VINAADI_PAGE_NEEDED_REGISTER_2026-08-27.md)**
   > (2026-08-27), one row each as `PN-1` … `PN-5`, with the code site, the
   > current provenance grade and the scoring reach of each. The register exists
   > so none of the five drifts into being treated as sourced merely for having
   > been in the tree a long time, and it records *why* the Vakya/Thirukanitham
   > field is mandatory rather than clerical: a Vakya-printed rule executed on
   > Thirukanitham longitudes fires on **different days than its author
   > intended**, and no test can catch that. `PN-2` is already closed by
   > relabelling; `PN-5` is display-only by ruling and must stay so.
4. **One positioning question, not a correction:** the Porutham share of
   Compatibility Intelligence (§3.11).

Everything else is signed and may be treated as reviewed doctrine.

---

## 10. Change log for this document

| Date | Change |
|---|---|
| 2026-08-27 | First edition. Built by reading the executing source, not the prior audits; every weight, cutoff and table in this file was read out of the module that evaluates it. One documentation defect found and reported (stale Rahu/Ketu BAV proxy comment, §3.5) |
| 2026-08-27 | **Astrologer review returned.** All twelve §7 questions ruled (`FCR-01` … `FCR-12`); §9 signed — 29 of 30 blocks, with the yoga detectors deliberately unsigned pending per-yoga IDs. Nine rulings confirmed what was coded; three required a change. The reported §3.5 comment defect is fixed. **Four further defects were found while ruling, none of which any question had named** (§7.13): a third naisargika node asymmetry (Rahu/Saturn), the Moon's and Mercury's unreachable Moolatrikona rungs, Jeevan contradicting Nethiram at ring distance 9, and a Prabalarishta day being able to display GOOD. Also found: the classical maturity ages `FCR-03` needed were already in `maturation.py` and the daily score was not reading them |
| 2026-08-27 | **Four of the six open items worked, and the pattern repeated: the item filed as "needs a change of scope" was the one hiding a live defect.** `FCR-10` claimed the per-activity Amavasai treatment needed machinery that did not exist — the machinery existed, 21 activities already used it, and Amavasai was consequently **scored twice** (138 cells over a 180-day × 30-activity sweep, all +5). Verifying that fix surfaced two more (`FCR-10a`: a remainder clause certifying the new moon as *auspicious* for sowing, 42 cells; `FCR-10b`: ear-boring's closed list not recognised as a ruling) and one left open for the owner (`FCR-10c`: **marriage scores 83 and is not vetoed on Amavasai** — the tiers stop at the fourteenth). The FCR-10 spiritual exemption is **withdrawn**: it had no target, and the sources say the opposite of what it assumed. §9.1 item 2 **closed by relabelling** — the Baladi curve is `[PRODUCT]`, the zoning stays `[CLASSICAL]`. `FCR-04`'s contested 10th limb keeps its −7 and gains limb-specific copy. The five `[PAGE NEEDED]` rules now have a register (`PN-1`…`PN-5`). **Still open: the yoga detector split (§9.1 item 1, the largest gap) and the Porutham share (owner's call).** |

| 2026-08-27 | **`FCR-10c` and `FCR-10d` closed the same day, and the marriage fix was an arithmetic reading rather than a new rule.** Krishna Ashtami is the eighth of the dark fortnight, so "all the Thithis after Ashtami of Krishna Paksha" runs 9 **through 15** — and Krishna 15 *is* Amavasai. The first extraction stopped at 14 because the source names Pournami and never says "Amavasai", and that asymmetry read as deliberate; it was not. Marriage on the new moon **83 → 74**, now cited rather than left to the generic almanac. Deliberately **not** promoted to VETO: the passage establishes inauspiciousness, not absolute prohibition, and this engine scores the page, not the practice. `_activity_rules_on_amavasai` returns `True` for MARRIAGE so the generic −5 stands down with it — **the constant and the gate move together and neither is safe to change alone.** `FCR-10d` retires the long-standing OPEN QUESTION on the 10/11/13 overlap as precedence rather than conflict. **After this row the open list is three: the yoga split (§9.1 item 1), the Porutham share (§9.1 item 4), and the four unclosed `[PAGE NEEDED]` rows.** |

| 2026-08-27 | **`YOG-01` split — the largest audit gap in this document is closed as a gap.** Twenty detector functions and thirty emitted yoga codes behind one rulebook ID became **32 per-yoga rules**, each with its own presence test, strength ladder, cancellation set, marker and source, generated from `app/calculations/yoga_rules.py` into the table appendix and pinned to the emitted codes by `tests/test_yoga_rules.py`. Raja Yoga became three rows — association, exchange, and an explicit `[LIMIT]` row naming the formulations we do **not** implement; Pancha Mahapurusha became five. **The split is not a signature: §9's yoga row stays NOT SIGNED pending 32 individual verdicts.** Writing the rows out found the pattern this document has hit four times already — the item filed as clerical was hiding a live defect. `yoga_activation.YOGA_KEY_PLANETS` was keyed on names no detector emits (`GAJA_KESARI` for `GAJA_KESARI_YOGA`, `PANCHA_MAHAPURUSHA_MARS` for `RUCHAKA_YOGA`), so **nine yogas — Gaja Kesari, Budha Aditya, Vipareetha Raja, Chandra Mangala and all five Pancha Mahapurusha — matched nothing, counted as never dasha-activated, and were capped at 45% of their base score whatever dasha ran.** Fixed by deriving the table from the rule rows. Two doctrine looseness findings (`YOG-AD-01` Adhi fires on one benefic; `YOG-DN-01`'s third condition has no classical parent) are **recorded and held for a ruling, not changed unilaterally** — tightening a presence test removes a yoga from charts that show it today. **After this row the open list is two: the Porutham share (§9.1 item 4) and the four unclosed `[PAGE NEEDED]` rows.** |

### Code changed by the 2026-08-27 rulings

| File | Change | Ruling |
|---|---|---|
| `app/calculations/ashtakavarga.py` | Stale Rahu/Ketu proxy comment deleted | §3.5 defect |
| `app/calculations/chart_strength.py` | Three naisargika node grades made symmetric | `FCR-02` |
| `app/calculations/chart_strength.py` | `EXALTATION_ZONE_END` — degree-bounded exaltation for Moon and Mercury | `FCR-11` |
| `app/calculations/chart_strength.py` | D9 debilitation graded −5 / −10 when rasi-exalted | `FCR-12` |
| `app/calculations/bav_derived.py` | Docstring: mātula justification corrected | `FCR-01` |
| `app/calculations/panchangam.py` | `_jeevan_value` — `distance == 9` special case deleted | `FCR-07` |
| `app/calculations/muhurta_engine.py` | Prabalarishta → `Verdict.VETO` | `FCR-09` |
| `app/services/_dg_scoring.py` | `_age_dasha_modifier` reads `MATURATION_AGE`; Sun/Rahu/Ketu no longer flat | `FCR-03` |
| `app/services/_dg_cache.py` | `DAILY_SCORE_ENGINE_VERSION` → `2026-08-27-v10` | `FCR-03` |
| `tests/test_chart_strength.py` | New `test_node_rows_are_symmetric_in_both_directions` | `FCR-02` |
| `tests/test_panchangam.py` | Golden updated; new whole-ring Nethiram/Jeevan invariant | `FCR-07` |
| `tests/test_muhurta_engine.py` | Adverse-class assertion split: Marana PENALTY, Prabalarishta VETO | `FCR-09` |
| `tests/test_numerology_compatibility.py` | Pinned grade distribution moved, with the three changed pairs named | `FCR-02` |
| `tests/test_numerology_chart_api.py` | Rahu/Saturn boundary assertions; the comment presenting the asymmetry as a feature rewritten | `FCR-02` |
| `docs/VINAADI_RULEBOOK_TABLE_APPENDIX.md` | Regenerated — the printed naisargika grid is built from the constants | `FCR-02` |
| `app/data/marriage_muhurta_rules.py` | Krishna sweep widened to in-paksha 15 (Amavasai); `RuleSource` notes record both rulings | `FCR-10c` / `FCR-10d` |
| `app/calculations/muhurta_engine.py` | `_activity_rules_on_amavasai` returns `True` for MARRIAGE, so the generic −5 stands down | `FCR-10c` |
| `app/calculations/muhurta_engine.py` | Marriage sweep branch no longer emits `FactorResult.conflict`; field kept and documented | `FCR-10d` |
| `app/data/muhurta_activity_registry.py` | Docstring names the cost of MARRIAGE's absence — a registry `None` read as "no ruling" | `FCR-10c` |
| `tests/test_muhurta_engine.py` | Conflict test replaced by settled-behaviour + no-conflict guards; Amavasai sweep/stand-down test added; `_chapter_ruled_activities` now includes MARRIAGE | `FCR-10c` / `FCR-10d` |
| `app/calculations/yoga_rules.py` | **New.** 32 per-yoga rule rows — ID, presence test, strength ladder, cancellation set, marker, source, activation grahas | `YOG-01` split |
| `app/calculations/yoga_activation.py` | `YOGA_KEY_PLANETS` derived from the rule rows and keyed on the emitted code; nine mis-keyed yogas no longer dormant-capped | `YOG-01` split |
| `app/calculations/_yoga_helpers.py` | `YogaResult.rule_ids` resolves a result to its rulebook IDs (property, so it stays off the wire schema) | `YOG-01` split |
| `scripts/generate_rulebook_appendix.py` | New `YOG-*` section — index plus one full definition block per rule | `YOG-01` split |
| `docs/VINAADI_ASTROLOGY_RULEBOOK_FOR_EXTERNAL_REVIEW.md` | `YOG-01` retired to a signpost; 32 markable per-yoga rows added; revision note appended | `YOG-01` split |
| `docs/VINAADI_RULEBOOK_TABLE_APPENDIX.md` | Regenerated with the `YOG-*` section | `YOG-01` split |
| `tests/test_yoga_rules.py` | **New.** Registry ↔ emitted codes ↔ both documents, plus a regression guard on the nine dormant-capped yogas | `YOG-01` split |

**Test outcome.** Full suite **3641 passed, 13 skipped, 0 failed** against the
dedicated Postgres test DB. The first full run surfaced exactly three failures,
all of them `FCR-02` goldens pinning the pre-ruling node grades, and all three
are updated above rather than worked around.

> **One of those three deserves recording on its own.** `test_numerology_chart_api`
> did not merely pass over the Rahu/Saturn asymmetry — it **presented it as the
> feature under test**, with a comment reading *"the psychic pair below still
> carries it: Rahu regards Saturn a friend while Saturn is neutral toward Rahu,
> so directional regard survives at the boundary."* The 2026-08-17 pass that
> fixed the Rahu/Venus contradiction wrote that line one graha away from the same
> defect, and reasoning that applies verbatim to Rahu/Saturn — *"classical maitri
> gives the nodes no friendships at all"* — is in that very comment. **A defect
> can survive a targeted audit by being written into the test as the expected
> behaviour**, which is the argument for `FCR-02`'s derivation principle: an
> invariant that says *no node asymmetry can exist* is checkable, where a list of
> blessed exceptions is only ever as good as the last reader's memory.

**Not changed, and deliberately so:** the Kandaka 10th-house limb (`FCR-04`), the
per-activity Amavasai treatment (`FCR-10`), the Porutham share of Compatibility
Intelligence (§9.1), and the Jeevan/Nethiram cutoffs themselves (`FCR-07`) — the
first three are scope decisions for the owner, the fourth needs a printed source.

> **Superseded later the same day.** Two of those four moved once the code was
> read again rather than reasoned about:
>
> * **`FCR-10` was not a scope decision.** The registry and the
>   `tithi_avoid_amavasya` field already existed and 21 activities already bound
>   it, which meant Amavasai was being **scored twice**, not once. Fixed, with
>   two further defects found while verifying (`FCR-10a`, `FCR-10b`) and one
>   left open for the owner (`FCR-10c` — marriage scores 83 on the new moon),
>   **since closed by ruling the same day: 83 → 74.**
> * **`FCR-04`'s 10th limb** keeps its −7. Only the reason copy changed, so the
>   contested limb now names what it governs instead of offering a generic
>   obstruction line the reader's own gochar contradicts.
>
> Still genuinely unchanged: the **Porutham share** (a positioning call that is
> the owner's), and the **Jeevan/Nethiram cutoffs** (`PN-5`, needs a page).
> The **yoga detector split** (§9.1 item 1) also remains open and is now the
> largest outstanding item in this document.
