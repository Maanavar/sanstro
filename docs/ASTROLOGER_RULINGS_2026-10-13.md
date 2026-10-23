# Astrologer Rulings — 13 October 2026

Answers to the seven questions opened by
[`GROUND_TRUTH_AUDIT_IMPLEMENTATION_2026-10-13.md`](GROUND_TRUTH_AUDIT_IMPLEMENTATION_2026-10-13.md)
§2, plus rulings on Karinaal, Sade Sati weighting, the localisation ratchet, the
festival lunar month and the composite rungs.

**Reading order:** §3 is the important half. Four of the seven questions were
answered **"revise, but do not encode the table yet"** — the ruling approves a
*mechanism* and withholds the *data* until a source is produced. Shipping the
mechanism and filling the table from the audit's own list would be the exact
failure this document exists to prevent, and in two cases the astrologer
specifically corrected the audit's list.

The astrologer's own framing, which the rest of this file follows:

> 1. **சாஸ்திர விதி** — what a particular text actually teaches.
> 2. **தமிழக நடைமுறை** — how Tamil astrologers apply or modify that rule.
> 3. **Vinaadi implementation** — what the app should calculate, display and explain.
>
> Thirukanitham establishes the astronomical framework. It does not, by itself,
> resolve every difference between marriage-matching traditions.

---

## 1. Summary

| ID | Ruling | Decision | Status after today |
|---|---|---|---|
| F-POR-02 | Flag ஷஷ்டாஷ்டகம் in **both** orientations; no silent pass, no auto-rejection | Revise | ✅ **Engine built**, surfaces pending — §2 |
| F-POR-03 | Recognise ஏக நட்சத்திரம் as a separate assessment; do not falsify Rajju | Revise | **Not built** — §3, star table held |
| F-POR-01 | Three grades (உத்தமம் / மத்திமம் / பொருத்தமில்லை), not binary | Revise | **Not built** — §3, 3×3 matrix incomplete |
| F-POR-04 | Do not add Thulam → Kanni without a verified source table | Hold | No change, as ruled |
| F-ASV-01 | Audit **all eight** Mercury contributor rows before changing any constant | Audit | ✅ **Done and fixed** — §2 |
| F-KAR-01 | Keep Sukran generally; add Guru as husband significator in female-chart readings | Revise | **Not built** — §3 |
| Property karaka | Mars for land, Moon / 4th for home and residence — split, do not swap | Revise | **Not built** — §3 |
| Karinaal | Hold the 34-day table; **do not remove Karthigai 7** | Hold + correction | ✅ **Karthigai 7 restored** — §2 |
| Sade Sati | Keep the three named phases; 6/4/3 is Vinaadi's model, **not scriptural** | Approve with caveat | ✅ **Provenance recorded** — §2 |
| Localisation ratchet | Supported, and extend past static scanning to real Tamil output | Approve | Not built |
| Festival lunar month | Supported; no first/second-tithi heuristic | Approve | Not built |
| 80/65/50 rungs | Keep on hold until the porutham rules settle | Hold | No change, as ruled |

### Four corrections the ruling makes to the audit itself

The audit was not accepted wholesale. These four are where the astrologer
contradicted it, and each one changed what we did:

1. **F-ASV-01 was not a choice between two texts.** The audit framed it as
   "Phaladeepika `{1,3,5,6,9,10,11}` vs BPHS `{1,2,4,6,8,10,11}` — which text?"
   The astrologer identified `{1,2,4,6,8,10,11}` as the **Lagna contributor row**
   in the classical eight-contributor table, and Mercury's own contributor row as
   eight positions including 12. Our audit of all 56 rows confirmed it: this was
   a transcription error, not a lineage variant. See §2.
2. **Karthigai 7 must not be removed.** Published Karinaal lists disagree on it.
   Removing it on the strength of our own derived table was wrong.
3. **The eka-nakshatra star list in the audit is not authoritative.** The
   astrologer's source names **Anusham**; the audit named **Uthirattathi**. Lists
   differ between traditions, so neither may be hardcoded.
4. **6/4/3 are not traditional values.** Tradition supplies the *ordering*
   (Janma heaviest). The magnitudes are ours and must not be cited as classical.

### Standing architectural directive

> Do not confuse a traditional calculation with an absolute judgment about
> someone's life. A traditional dosha indication must not be represented as proof
> that a marriage will fail.

Four layers to preserve in code:

```
Calculated Fact  ->  Traditional Rule  ->  Exception / Mitigation  ->  User-facing Interpretation
```

This is consistent with the existing advisory-voice rule (ruled previously: the
app **advises, never decides**) and with EC-RULING-06's ban on ஆயுள் framing.

---

## 2. Changed today

### F-ASV-01 — Mercury BAV: a transcription error, found by auditing all 56 rows

The ruling's instruction was procedural: *"I would not approve a simple
replacement of one seven-element array with another without identifying its
contributor key"*, followed by a five-step audit. Steps 1–3 and 5 were completed;
step 4 is open (see §4).

**What the audit found.** One row of 56 disagrees with the classical table:

| | |
|---|---|
| Row | `BAV_TABLE["MERCURY"]["LAGNA"]` |
| Was | `[1, 3, 5, 6, 9, 10, 11]`, commented `# Phala Deepika (Tamil primary source)` |
| Is | `[1, 2, 4, 6, 8, 10, 11]` |
| Diagnosis | the `MERCURY`-from-`MERCURY` row `[1,3,5,6,9,10,11,12]` with the `12` dropped |

This is the **same defect already corrected one block up** at
`BAV_TABLE["MARS"]["LAGNA"]`, where the spec document had duplicated
Mars-from-Mars into Mars-from-Lagna. The attribution to Phala Deepika was
papering over a paste. Orientation (step 2) was verified correct:
`compute_bhinnashtakavarga` counts `target_rasi = ref_rasi + house - 1`, i.e.
contributor → receiver.

**Why it survived three years and a dedicated golden test.** Dropping one house
from an eight-house row leaves seven, so:

| Check | Before fix | After fix | Published |
|---|---|---|---|
| Mercury BAV total | 54 | 54 | 54 |
| Sarvashtakavarga total | 337 | 337 | 337 |

`tests/test_ashtakavarga_golden.py` pinned **totals**, and the Mars fix had been
gated as a one-off assertion *about Mars*. Both gates passed, and neither could
have failed. The class stayed open for the next row to be found by hand.

**It was not cosmetic.** On a synthetic chart, 6 of 12 rasis carried a wrong
Mercury bindu, and **3 of them sat on the wrong side of the `>= 4` threshold**
that `_dg_scoring` reads as a supportive transit. Consumers affected:
`daily_guidance_service`, `life_areas_service` (SAV per rasi), `wealth_service`,
`_chart_summary` (the Jadhagam grid) and the predictions API.

**The gate now pins all 56 rows by value** against an externally transcribed
`CLASSICAL_BAV_TABLE`, replacing the per-row one-off pattern.

> **Blind spot, per CLAUDE.md.** The pin proves our table matches *this
> transcription* of the classical one; it cannot prove the transcription. Both
> halves were entered from the same secondary source the ruling quotes — which
> the ruling itself flags as *"a secondary technical reference, not a primary
> Sanskrit edition"* — so a shared error would pass. Step 4 of the ruling's audit
> (an independently calculated reference chart) is still open.

A second gate was drafted and **deleted before shipping**: "no row duplicates
another in its block." Run against the pre-fix table as CLAUDE.md requires, it
**passed** — a truncated copy is not equal to anything — so it was a tick that
could not fail on the very defect it named. The reason is recorded in the test
file so it is not re-added.

### F-POR-02 — ஷஷ்டாஷ்டகம் both orientations (engine layer)

`shashtashtaka_relation()` in `app/calculations/porutham.py`, surfaced as
`PorutthamResult.shashtashtaka` (a `ShashtashtakaNote`). **Additive only:** it
does not touch `_rasi_score`, the ten kuta scores, `total_score`, the band label,
the summary sentences or the Rajju/Vedha veto. That restraint is the ruling —
*"retain the existing Kalaprakasika directional result as a separately identified
textual interpretation"* — and `directional_pass` records what the retained rule
said, so a consumer can tell a named fail from a silent pass.

Approved Tamil copy is used **verbatim** and pinned by a test; the label is
`ஷஷ்டாஷ்டகக் குறை — மேலாய்வு தேவை`.

Detecting "either orientation" needs only one count: the two inclusive counts
between different signs always sum to 14, so `{6, 8}` is closed under the swap.
Recorded in the docstring because the second test would be a branch that cannot
fire.

> **A fifth correction to the audit, found while building this.** The audit
> framed the exposure as "the 8th passes" — 12 of 144 rasi combinations. Measured
> over all 144: **24 pairings are Shashtashtaka and 18 of them still pass Rasi
> today.** Count 8 contributes 12, as expected. But count 6 — adverse *in
> general* — contributes a further **6**, because `_rasi_exception_lifts` (the
> enumerated p.74 exception pairs, approved on the unrelated question of
> restoring missing passes) lifts half the count-6 pairings to a full pass. Both
> halves need the note, and the silent-pass population is 18/144, not 12.

Verification: 13 assertions across 11 test functions in
`tests/test_shashtashtaka.py`, all passing. Each was then run with its fix
removed and confirmed to fail — detection narrowed to `{6}` breaks three gates,
hardening `_rasi_score` to fail the 8th breaks two, and paraphrasing the Tamil
copy breaks one.

> **Blind spots.** (1) **Nothing renders it yet.** The note reaches
> `PorutthamResult` and stops there; the eight consumers that would show it —
> `synastry_service`, `pdf_export_service`, `porutham_share_service`,
> `public_tools`, `packages/shared/src/types`, and four web surfaces — are
> untouched, so today this is a field with no reader. (2) Every assertion encodes
> *our* reading of the ruling's mechanism; the Tamil wording is the ruling's own,
> which is the strongest available warrant but not a native review. (3) p.74 is
> still un-re-examined, so the directional rule the tests now pin is itself
> provisional.

### Karinaal — Karthigai 7 restored

`karinaal.KARINAAL_TAMIL_DAYS[7]` is `{1, 7, 10, 17}` again. Karinaal is an
*avoid*-day, so the fail-safe direction is to keep showing a disputed one and let
a printed almanac remove it, not the reverse.

Two of the three differences the derivation produced were **independently
confirmed** by the ruling against published tables:

| Difference | Ruling |
|---|---|
| Margazhi 11 added | ✅ Supported by published practice — keep |
| Thai `{1, 2, 3, 11, 17}` | ✅ Supported as Tamil month/day identities — keep |
| Karthigai 7 removed | ❌ **Reverted.** Lists disagree; do not remove on our table alone |

On the five Thai dates moving one civil day: the ruling's instruction is to keep
the Tamil month/day identity separate from the Gregorian conversion, verify Thai
1 under our solar-month rule, then map consistently — and that *"a mathematically
consistent conversion cannot establish which underlying Karinaal list is
authoritative."* That is the same caution our own implementation note recorded.
The 34-day table stays the rule of record, still unverified against a printed
almanac.

### Sade Sati — the weights are ours, and now say so

The three named phases (விரய 12th / ஜென்ம 1st / பாத 2nd) and Janma-heaviest are
approved. The removal of the unsourced 16/35/4-month segmentation is called
"reasonable". But:

> The numerical weights `6/4/3` are an application design choice unless directly
> sourced. They should not be described as traditional scriptural values.

`_SADE_SATI_PENALTY_BY_SEVERITY` now records this, including that the ordering
test (`test_janma_sani_is_the_heaviest_phase_everywhere_in_it`) pins only the
*ordering* and would pass for 6/5/4 or 9/4/2 equally. Nara-Chakra stays
unimplemented until its source and calculation method are verified; if PN-4 is
produced, compute from Saturn's transit nakshatra counted from the janma
nakshatra, **not** a month clock.

---

## 3. Approved but deliberately not built — read before closing any of these

Each item below has an **approved mechanism** and a **withheld table**. Building
the mechanism and filling the table from the audit would overturn the withholding
by implication.

### F-POR-02 — ஷஷ்டாஷ்டகம், both orientations

> **Engine layer built — see §2.** What remains here is the rendering: eight
> consumers, two of which (`synastry_service`, `test_relationships_api`) were
> being edited by a concurrent session when this was written, so the wiring was
> deliberately deferred rather than merged into someone else's in-flight change.

**Ruled:** detect 6/8 in either orientation; mark it
`ஷஷ்டாஷ்டகக் குறை — மேலாய்வு தேவை`; do **not** equate it with complete marriage
rejection; **retain** the existing Kalaprakasika directional result as a
separately identified textual interpretation until p.74 is re-examined.

Explicitly *not* an overturn: *"I cannot definitively overturn your earlier
page-74 ruling without seeing that passage itself. The change I recommend is a
Tamil-practice compatibility safeguard, not a claim that Kalaprakasika has been
mistranslated."*

So this is **additive**: a both-ways flag plus a note, alongside the unchanged
directional pass/fail. It is the only one of the three live marriage items that
can ship without new table data, and it is the highest-exposure one (a false
*pass* — "your app says pass, my jothidar says fail").

Approved Tamil copy is in the ruling and should be used verbatim.

### F-POR-03 — ஏக நட்சத்திரம்

**Ruled:** add a dedicated `EKA_NAKSHATRA_PORUTHAM` assessment, separate from
Dinam and Rajju, accounting for the shared star, **each person's pada**, the
traditional classification of that star+pada, and whether the selected doctrine
treats it as an exception to a Rajju veto.

**Do not falsify the Rajju calculation to produce a pass.** Preserve both
findings and apply a separately sourced exception where permitted.

**Held:** the star-by-star approval table. *"I would not hardcode an `UTTAMA` list
from memory or a single website."* Sources vary over **Anusham** and
**Uthirattathi** — and note the astrologer's list and the audit's list differ on
exactly those two stars, which is itself the evidence.

Buildable now: the separate assessment and its disclosure, with no exception
applied — which stops the current silent hard CAUTION from being the whole story.
Not buildable: the uttama/madhyama/prohibited lists.

### F-POR-01 — கணப் பொருத்தம், three grades

**Ruled:** replace binary grading with உத்தமம் / மத்திமம் / பொருத்தமில்லை.
Record the star count. Apply the >14 exception **only to the gana combinations
for which it is documented** — it is "not an unconditional rule for every gana
mismatch". Keep Sthree Deergham a separate calculation.

**Held:** the full asymmetric 3×3 matrix. Three of its nine cells are unresolved
in the ruling itself — Manushya♂/Rakshasa♀ and Deva♂/Rakshasa♀ are "needs
star-count assessment", Rakshasa♂/Deva♀ is "source-dependent".

On the overlap I raised: *"The fact that two poruthams use the same nakshatra
count does not make them identical. Traditionally they assess different aspects.
However, Vinaadi's numerical scoring should avoid treating correlated rules as
independent statistical evidence."* That is a direct constraint on the composite
— it connects to the recorded layered-scoring double-count problem.

### F-KAR-01 — marriage karaka

**Ruled:** keep Sukran as the general marriage significator. Add Guru as the
husband significator **in the traditional female-chart method**, alongside Venus,
the 7th house and the 7th lord. Make the interpretation modes explicit: male
chart, female chart, gender-neutral.

**Engineering restriction, verbatim:** *"Do not automatically replace Venus with
Jupiter in a numeric marriage-timing formula. The astrological significator
distinction does not establish equivalent numerical weights. Validate the rules
and weighting separately."*

### Property karaka — split, do not swap

**Ruled:** Mars and the Moon signify different parts of the domain; neither
replaces the other. Replace the single `property_strength` with three readings:

| Reading | Primary factors |
|---|---|
| நிலம் மற்றும் சொத்து (land, immovable) | 4th house, 4th lord, **Mars**; acquisition houses; D4 |
| வீடு மற்றும் குடியிருப்பு (home, residence) | 4th house, 4th lord, **Moon**; Venus for comforts |
| சொத்து சேர்க்கை (acquisition) | 2nd, 4th, 11th + lords; dasha; D4 |

**Mars-led land logic is kept provisionally.** On the 22 → 63 swing: *"That
difference is too substantial to justify changing a single karaka weight."* The
instruction is to introduce a distinct residence interpretation rather than
silently change the existing number — which is what the implementation record
chose to do on its own, and the ruling confirms it.

### F-POR-04 — Vasya

**HOLD**, as implemented. Thulam → Makaram stays; Thulam → Kanni awaits source
verification. Note the scope instruction: compare the **complete 12-rasi table**
against a named Tamil text or printed panchangam, not just this one cell. Also
recorded: Vasiya Porutham is not identical to North Indian Vashya Koota, and some
tables distinguish the influencing rasi from the influenced one, so direction
matters.

---

## 4. Open items

1. **F-ASV-01 step 4** — check all 12 rasi bindu distributions against an
   independently calculated reference chart. The 56-row pin cannot substitute for
   this; it checks us against a transcription, not against a second engine.
2. **Karinaal against a printed almanac** — the five Thai dates and Karthigai 7
   (now restored and marked disputed). `KARINAAL_TAMIL_DAYS` remains the rule of
   record.
3. **PN-4 / the bare "p. 243"** — still unproduced; Kalaprakasika's appendix also
   begins at printed p. 243, so the citation remains ambiguous.
4. **Three source productions** now block built mechanisms rather than opinions:
   the eka-nakshatra star+pada classification, the gana 3×3 matrix's three
   unresolved cells, and the complete 12-rasi Vasya table.
5. **F-POR-02's rendering** — `PorutthamResult.shashtashtaka` has no reader.
   Eight consumers need it: `synastry_service`, `pdf_export_service`,
   `porutham_share_service`, `public_tools`, `packages/shared/src/types`, and the
   porutham tool, dashboard panel, synastry panel and share page in `web/`. Per
   the CLAUDE.md API-contract rule this is one coordinated change across four
   locations, and per the forward policy any new web/mobile consumer goes through
   a typed wrapper in `packages/shared/src/api/` rather than a fresh direct
   fetch. A field nothing renders is the `advanced-lens-note` failure again.
6. **Downstream goldens for F-ASV-01** — `daily_guidance_golden.json` and
   `life_areas_golden.json` read Mercury bindus and SAV per rasi and have not
   been regenerated. Not run today: another session owned the test suite.
7. **The 80/65/50 rungs** stay on hold, now with the ruling's own added
   constraint: *"Do not tune thresholds simply to achieve an attractive
   distribution of favourable results."*
