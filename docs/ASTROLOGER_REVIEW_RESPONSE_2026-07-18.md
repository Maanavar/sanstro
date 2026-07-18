# Astrologer Review Response — 2026-07-18

Response to an external astrologer's review of the **Family & Charts** page.

Every claim was checked against the code before acting. The review was strong:
most items were real, and one of them (Gaja Kesari / Kemadruma) was a genuine
classical contradiction we were shipping. Two items were **incorrect about the
engine** and are recorded as such, because acting on them would have made the
product worse. One item was correct about the symptom but wrong about the
cause, and the real cause turned out to be a scoring bug the reviewer did not
identify.

Status legend: **FIXED** · **CORRECTED** (reviewer's premise was wrong) ·
**PARTIAL** (backend done, UI pending) · **OPEN**.

---

## 1. Classical errors and contradictions

### 1.1 Gaja Kesari and Kemadruma both shown as "Present" — **FIXED**

The reviewer's hardest and most important catch. Both were rendering as active
on one chart, which is impossible: Jupiter in a kendra from the Moon is
simultaneously what *forms* Gaja Kesari and what *destroys* Kemadruma.

The engine was not actually wrong about the doctrine. `detect_kemadruma_yoga`
already computed `planet_kendra_from_moon` as a bhanga factor. Two things then
threw it away:

1. The bhanga was **graded**, not absolute — a single cancellation factor
   downgraded the yoga to `PARTIAL` while leaving `is_present = True`. But
   classical authority here is unconditional (BPHS, Phaladeepika): a graha in a
   kendra from the Moon destroys Kemadruma outright.
2. The UI rendered `isPresent ? "Present" : "Absent"`, discarding both the
   strength and the cancellation entirely.

Reproduced before fixing:

```
KEMADRUMA present: True | strength: PARTIAL | bhanga: ['planet_kendra_from_moon']
UI rendered      : Present     (alongside Gaja Kesari: Present)
```

**Changes**
- `app/calculations/_yoga_detect.py` — `planet_kendra_from_moon` is now a full
  bhanga on its own. The other three factors stay graded (they mitigate rather
  than annul).
- `packages/shared/src/yogaDisplay.ts` — new `yogaReadingStatus()` returning a
  tri-state `PRESENT | CANCELLED | ABSENT`. Lives in `shared` so web and mobile
  cannot diverge on it.
- `web/components/dashboard-explore-yogam-nova.tsx` — badge, colour, remedies
  and the "what it can do for you now" block all now respect cancellation. A
  cancelled yoga no longer advertises remedies for a yoga that is not operating.

**Guard** — `tests/test_yogas.py::test_gaja_kesari_and_kemadruma_are_never_both_operating`
sweeps all 144 Moon × Jupiter rasi pairs and asserts the two are never both
operating, using the same predicate the UI uses.

### 1.2 Moon top-scored but labelled "planet needing support" — **FIXED**

Root cause accepted as diagnosed: we were conflating **positional strength**
with **capacity to deliver benefic results**.

The summary rows printed a bare graha name with no score and no basis
("Strongest planet: Mercury"), so the axis was invisible and the pick could not
be cross-checked against the per-planet cards.

**Changes** (`_summary_section` in `chart_explanation_service.py`, schema, shared
types, web):
- Labels now name the axis: **"Strongest by position"** / **"Lowest by
  position"**.
- Both rows carry their score, so the summary and the planet cards can no longer
  *appear* to contradict each other silently.
- New `scoreScaleNote` — see §2.2.
- New `strongestPlanetCaveat` — see §1.3.

### 1.3 Mercury declared "strongest" while combust, retrograde and 6th lord — **FIXED (cause was different)**

The reviewer was right about the symptom and right that combustion must weigh
down. But the mechanism was not "combustion isn't weighted" — it is weighted, up
to −22. The actual bug:

> **Retrogression was counted twice.** `_chesta_bala_score` already returns its
> maximum (1.0 vs 0.6 direct) for a retrograde planet — Chesta Bala *is* the
> classical "vakra graha is strong" rule, worth about +6 through its 0.15
> weight. A **flat +8** was then added on top.

So retrogression was worth ≈ +14 against a worst-case combustion penalty of −22.
A combust *and* retrograde planet netted only ≈ −8 and could still top the chart.

Measured after removing the flat bonus:

| case | score |
|---|---|
| combust + retrograde | 31 |
| combust, direct | 25 |
| clear, retrograde | 55 |
| clear, direct | 49 |

Retrogression is now worth a consistent **+6** (chesta bala only); deep
combustion costs ≈ 18.

Additionally, when the top-scoring planet is combust, debilitated or in an enemy
sign, the summary now emits an explicit caveat naming the condition and stating
that positional strength and delivery capacity are different axes.

**Guard** — `tests/test_chart_strength.py::test_retrogression_is_counted_once_via_chesta_bala_only`
asserts the retrograde delta equals the chesta margin, as a bound rather than a
magic number, so a deliberate re-weighting survives but a second bonus fails.

### 1.4 "Saturn in Moolatrikona but only 45/100" — **CORRECTED**

This is not a broken dignity feed. Traced through `compute_natal_planet_score`:

- Moolatrikona **is** detected; `_dignity_score` returns 90.
- That 90 is then multiplied by the **Baladi avastha** multiplier — 0.50 for an
  infant-degree planet in an odd sign — and blended with **house strength**,
  which is 25 for a dusthana placement.
- `(90 × 0.50 × 0.60 + 25 × 0.40) / 100 = 0.37` for the sthana component.

That is defensible classical layering, not a bug. Saturn's low Naisargika Bala
(0.143, correctly the weakest in the BPHS order) compounds it.

**What was actually wrong** is that we showed the badge "Moolatrikona" and the
number "45" side by side with nothing explaining that avastha and bhava sit
between them. Addressed by the score-scale note (§2.2) and by surfacing avastha
(§3.3, open).

No scoring change made. Flagged for the astrologer: *if* the intent is that
Moolatrikona should resist avastha decay, that is a doctrine decision about the
multiplicative combination, not a code defect.

### 1.5 "Gochara is reckoned from Lagna, not Moon" — **CORRECTED, then FIXED in copy**

Not true of the engine. `_activation_tone` already weights the transit house
**from Moon at ±8** and from Lagna at only ±5 — Moon is already primary — and
`_activation_explanation` states both frames in prose. The backend peyarchi text
(`_peyarchi_text`) likewise already leads with "house N from Moon".

What the reviewer saw was a **web-side Guru/Sani transit card** whose copy was
worded Lagna-only, sitting on top of Moon-aware maths.

**Change** — `transitAspectSummary` now leads with the house from the Janma Rasi
and keeps the Lagna house as a secondary clause. The aspect-target houses stay
reckoned from Lagna, deliberately: that computation is used to find which
*natal* planets the transit aspects, which is a birth-chart question, not the
peyarchi verdict. Both frames are documented in place.

---

## 2. Secondary issues

### 2.1 Rahu/Ketu carrying "Dusthana role" / "Maraka role" — **FIXED**

The underlying doctrine was already correct: `get_functional_nature` documents
that the nodes own no house and derives their nature from dispositor + occupied
house. Only the **wording** asserted a lordship Parashari does not grant.

Added node-specific phrasings (`_NODE_FUNCTIONAL_CONTEXT_TA/EN`) that say
*occupies* and *acts through* — e.g. "a shadow graha that owns no sign; it
occupies a Dusthana house, so those matters ask for care and discipline."

### 2.2 Score semantics never explained — **FIXED**

New `scoreScaleNote` on the summary, rendered under the score rows in both
languages. States plainly that 0–100 is a **Shadbala-style positional
composite** of the six components (sthana, dik, kala, chesta, naisargika, drik),
that it measures how firmly a planet stands rather than whether its results will
be good, and gives the 70 / 45 band anchors.

### 2.3 "Rahu-Ketu Dosham 80/100 while everything else is a uniform 12/100" — **FIXED**

The reviewer's instinct ("reads like a placeholder") was right, though it was not
literally a placeholder. `doshamSeverityScore` is a **step function over a
three-level enum** plus two booleans:

```
STRONG 80 · PARTIAL 55 · WEAK 35   (+10 if dasha-activated)
cancelled → × 0.35                 →  28 · 19 · 12
```

Every mitigated-weak dosham therefore lands on exactly **12**. It has about
eight reachable values in total. Rendering one as "12/100" claimed a continuous
precision the inputs never had.

**Change** — new `doshamSeverityBand()` renders **Low / Moderate / High
intensity** instead of a fabricated integer, on both surfaces that showed it.
The numeric function is retained where relative meter length is meaningful.

### 2.4 Nodal 5th/9th aspects are one school's doctrine — **FIXED (disclosed)**

Correct, and worth disclosing. `ASPECT_HOUSES` gave Rahu/Ketu Jupiter-like 5/7/9
with no source note, while Mandhi immediately below it *was* documented.

- `app/calculations/aspects.py` — the choice is now documented as a school
  choice, noting the competing positions (7th only; or no independent drishti at
  all for chaya grahas) and warning that changing it moves Kala Sarpa, bhava bala
  and yoga detection.
- The drishti section now shows a reader-facing note, **conditionally** — only
  when a nodal aspect actually appears in that chart, so it lands where it
  applies instead of as blanket boilerplate.

### 2.5 Raw enum names in the UI ("STANDARD_7TH", "MARS_SPECIAL_4TH") — **FIXED**

Confirmed: `_aspect_type` built `f"{planet}_SPECIAL_{aspect_house}TH"` and the
chip printed it verbatim.

New `aspectTypeLabel()` renders "7th aspect" / "special 4th aspect". The label
deliberately omits the graha name because the chip already says "Mars looks
at…" — otherwise the planet appears twice in one line. The payload keys are
unchanged; they are a contract.

**Guard, and a class-level fix.** `tests/test_marker_label_coverage.py` already
existed to catch exactly this failure mode — but it skips `literal.isupper()`,
which is precisely the blind spot these constants live in. Added
`test_every_aspect_type_renders_as_a_phrase` covering the UPPER_CASE family
(31 tokens scanned, both shapes verified non-vacuously).

### 2.6 Dasha chain repeated identically on every planet card — **FIXED**

`_current_period_text` printed "Current period: Moon Mahadasha / Moon Bhukti /
Jupiter Antaram" on every planet that was not an active lord — the same string
up to eight times per screen.

The chain is already stated once at chart level in `period_summary`. The
per-planet text now keeps only the part that genuinely varies: whether *this*
graha is one of the running lords.

### 2.7 Optimistic tone — **OPEN**

Accepted as fair. "Life areas move quietly without pressure" for a chart with
empty kendras and four planets in dusthanas is too kind. Not addressed in this
pass: tone calibration touches a large body of copy and should be done as one
deliberate pass with the Tamil reviewer, not piecemeal.

---

## 3. "Aspects you're missing entirely"

### 3.1 Ashtakavarga bindus — **CORRECTED (engine existed) + FIXED (now surfaced)**

Not absent. `app/calculations/ashtakavarga.py` implements full
Bhinnashtakavarga and Sarvashtakavarga, and it already feeds `prediction_score`,
`propensities`, `timing_vote`, `daily_guidance_service` and `life_areas_service`.
The BAV map is already carried in the chart payload.

It was simply **never rendered anywhere**. The reviewer was right about the user-
visible product and wrong about the engine.

**Change** — the Guru/Sani peyarchi card now reads the transiting graha's bindus
in the rasi it occupies, with a plain-language reading on the classical 0–8
scale ("more bindus let a peyarchi deliver its results more easily; fewer mean
the same transit works slowly"). Nodes fall back to Saturn's table, matching
`get_av_bindu` server-side.

**Guard** — `web/components/dashboard-chart-explanation-ashtakavarga.test.ts`.
The Lagna rasi has to be recovered from a planet's `(rasi, houseFromLagna)` pair
because the payload carries Lagna only as a display name; that is modular
arithmetic over a 1-based 12-cycle and a silent off-by-one there would produce a
confidently wrong astrological claim. Tested **exhaustively** over all 144 pairs,
plus the node fallback and the missing-data paths.

### 3.2 Bhava-by-bhava narrative — **PARTIAL** (backend + tests done, UI pending)

Two separate things here.

**The reviewer's headline claim is partly wrong**: a full life-areas feature
already exists (`life_areas_service.py` — per-area karakas, house strength, dasha
activation, transit support, narrative, remedy). It is on a different tab from
the page reviewed.

**The reviewer's sharper sub-point is entirely right and was a real gap**:

> "including aspects onto empty but important houses — right now you only show
> planet-to-planet drishti, so nothing aspecting the lagna or 10th surfaces"

Confirmed: `_build_aspects` iterates planets × planets only. An unoccupied 7th
under Saturn's 10th drishti — a first-order fact for any marriage question —
appeared **nowhere** in the reading.

**Change** — new `_build_bhava_section` returns all twelve houses with rasi,
lord, where the lord sits, lord strength, occupants, **aspecting planets**, and
Bhava Bala. Schema (`ChartExplanationBhavaSection`) and shared TS types added;
optional field, so existing clients are unaffected.

**Guard** — `tests/test_chart_explanation_bhavas.py` (5 tests), including the
motivating case (empty 7th under Saturn's aspect must name Saturn), aspects onto
an empty Lagna, and a check that occupants are not double-counted as aspects.

**Remaining:** the web rendering of this section is not built. The data ships;
nothing displays it yet.

### 3.3 Navamsa / Vargottama surfacing — **FIXED**

Real gap, and the reviewer correctly tied it to the Mercury question ("it
directly governs whether that 'strong' Mercury actually delivers").

D9 dignity was reachable only through `_condition_facet_value`, which is a
priority chain with **one winner**: cazimi → D9 debilitation → combustion →
retrogression → vargottama → D9 dignity. So a combust planet never showed its
Navamsa standing at all — exactly the case where it matters most.

**Change** — new always-on `navamsa` facet, separate from the condition facet so
both can appear. "Burnt by the Sun" and "but vargottama in Navamsa" are
complementary facts, not competing ones. Covers vargottama, D9 dignity, D9
debilitation (naming the classical "strong in name, weak in effect" case) and
neutral.

### 3.4 Avastha beyond combustion/retrogression — **OPEN**

Partly a false gap: `compute_strength_breakdown` **already computes** Baladi,
Jagradadi and Deeptadi avasthas, and `PlanetPosition.strength_breakdown` already
carries them in the payload with defaults.

They are not declared in the shared TS `strengthBreakdown` type and not rendered
anywhere. Surfacing them is small and mostly mechanical, but it is not done.

### 3.5 Personalised remedies — **OPEN**

Accepted in full. Remedies are static templates keyed by graha, so every Shani
matter yields "sesame-oil lamp on Saturdays" and every Guru matter "Thursday
prayer and yellow items". This is the single biggest reason the output reads as
machine-generated.

Deliberately not attempted here: doing it properly means keying remedies to the
specific afflicted planet's lord, nakshatra and dasha context, and the copy needs
the astrologer and a native-Tamil reviewer. Rushing it would produce more
templated text with more variables in it.

---

## Verification

- **Python** — **full suite: 1937 passed, 12 skipped, 0 failed** (3h44m; the 12
  skips are the pre-existing WI-07 sunrise-reference gaps).

  An isolated `-m no_db` run had shown one failure,
  `test_perf_calculate_daily_panchangam` — a wall-clock budget assertion. It
  passed in the full run. It is a timing flake under concurrent load, not a
  regression: panchangam imports only `astro`, `ephemeris` and its cache model,
  none of which this work touched, and those calls are GIL-bound Moshier
  computations. Recorded rather than silently dropped.
- **Web** — `tsc --noEmit` clean; `vitest` **174 passed / 30 files**;
  `eslint --max-warnings=0` clean.
- **New guards** — 4 (yoga mutual-exclusivity sweep, retrograde single-count,
  aspect-type label coverage, Ashtakavarga bindu lookup).

## Owed before this ships

1. **Native-Tamil review** of all new Tamil strings — the node functional-nature
   phrasings, the score-scale note, the Navamsa facet, the bhava explanations,
   the nodal-aspect disclosure and the severity bands. One script error was
   caught and fixed during authoring (Devanagari characters had leaked into a
   Tamil string); that is exactly the class of thing a native reader must check.
2. **Live browser pass** — none of this has been seen rendered.
3. **Astrologer decisions still open**: the Moolatrikona-vs-avastha weighting
   (§1.4), whether the D9 debilitation penalty should exceed the bonus, and the
   nodal-drishti school (§2.4) if we want to change rather than merely disclose it.
4. **Tone calibration** (§2.7), **avastha surfacing** (§3.4), **personalised
   remedies** (§3.5), and the **bhava section's web UI** (§3.2).
