# Group D — build specifications (FAA-02 step 2, FAA-30, FAA-31, FAA-32, FAA-33)

Status: **rulings received 2026-11-11 (see §0); FAA-33 built (§0.5) and FAA-30 built (§0.6); FAA-32, -31, -02 not built.** The sections D1–D5
below are the original draft and stay as written; where §0 changes them, §0 governs.
Parent: `docs/FULL_ASTRO_ACCURACY_AUDIT_2026-11-10.md`
(the audit text for each item is the requirement; this file is the "how").

---

## 0. Rulings received 2026-11-11, and what was checked

The owner supplied a consolidated rulings document ("Group D — Final Astrologer Rulings and
Build Specifications", 11 Nov 2026, "pending owner sign-off"), with the instruction to verify
it rather than follow it blindly. **Its author is not stated.** Treat it like the 11-09/11-10
sheets until the owner says otherwise: rulings to build behind the tier rules, not
practitioner sign-off.

### 0.1 Source checks (fetched 2026-11-11)

| Citation in the rulings | What the source actually says | Effect |
|---|---|---|
| Phaladeepika 11.1 ([siva.sh](https://www.siva.sh/phaladeepika/11/1)) | **Confirmed.** Sanskrit *māṅgalyaṁ nidhanāt*: mangalya from the 8th. 9th = children, 7th = the husband, lagna = appearance, 4th = chastity. The English renders the 8th as "prosperity and happiness" and adds "(from the Lagna or the Moon whichever is stronger)". The fetch found no Moon word in the Sanskrit line, so that parenthesis may be the translator's gloss. No translator is credited. **The verse also says a malefic in a house it owns gives good results.** The rulings left that out. | FAA-30 and the bride's 9th in FAA-32 must apply the own-house exception. "Stronger of lagna/Moon" is shown as BOTH (rulings §3.2), and the source line notes the gloss. |
| BPHS 7.42 ([enjoylearningsanskrit](https://enjoylearningsanskrit.com/scriptures/parashara/chapter-7/verse-42/)) | **Confirmed.** 5th from Jupiter for children, 7th from Venus for the spouse. The same verse gives 8th/12th from Saturn for longevity and loss. Chapter numbering is that site's (other editions number BPHS differently); no translator is credited. | 5th-from-Guru goes in FAA-32. 8th from Saturn is **not** used (EC-RULING-06). |
| Prokerala Tamil Jathaga Porutham sample, p.17 ([pdf](https://api.prokerala.com/reports/sample/porutham-tamil-en.pdf)) | **Confirmed verbatim:** "Final six months of one dasha and the first six months of the next dasha is called dasha sandhi period. Overlapping of dasha sandhi in a man's and woman's horoscope post marriage is considered detrimental … at least 6 months gap (minimum 1 year is ideal) between dasha sandhi periods". The table it compares is **mahadashas**. Astro-Vision's matching software also reads it as "dasa change for the girl as well as the boy within a short span". A vendor sample report, not a text. | Mahadasa level is supported, so **B_BHUKTI (my draft's proposal) is withdrawn.** But see 0.2. |
| — | One Scribd matching note defines dasa sandhi as "the same dasa running for both". That is a different rule. | Stays not built (D4 table, last row). |

### 0.2 FAA-31: the source's own example contradicts the rulings' reading

The rulings read "6 months gap" as the gap **between the two 12-month windows**. In Prokerala's
own sample, the boy's Rahu→Guru change is 7 Dec 2031 and the girl's is 31 May 2033. The windows
are 7 Jun 2031–7 Jun 2032 and 30 Nov 2032–30 Nov 2033: a **5.8-month** gap. The report rates the
couple **"Satisfactory"**. So either Prokerala measures the gap between the change points
(17.8 months there), or its horizon excluded 2031–33. The page doesn't say which.

Measured on the item-7 synthetic population (10,000 couples, seed 7, scratch run of
`dasa_sandhi`, A_FIXED ±6 months; a prevalence, not a ratification):

| Rule | 5-year horizon | 10-year horizon |
|---|---|---|
| Windows overlap | 6.2% | 11.7% |
| Window gap < 6 months (rulings' literal reading; change points < 18 months apart) | 7.2% | 15.2% |
| Window gap < 12 months | 8.9% | 19.6% |
| Change points < 6 months apart | 2.4% | 5.0% |

All of these are under the rulings' ~30% noise line. **Open: OWNER-Q-D1** (§0.4).

### 0.3 What changes in the build, item by item

**FAA-33 (D1): approved, descriptive.**
- Support houses from B's lagna and B's Moon: 1/5/7/9 = SUPPORT. 11 = NOTE (secondary
  support; no new status). 2/3/4/10 = NEUTRAL. 6/8/12 = NOTE, never rejection.
- Check 1 reads A's 7th lord's **sign in A's chart**. Never B's position of the same graha.
- Check 3 is two rows: A's Moon from B's lagna, and A's Moon from B's Moon. Never merged.
- Check 4 is a planetary overlay. It never says the graha "becomes" B's 7th lord. Any
  spouse-karaka wording uses stated gender only.
- Wire: `{direction, key, houseFromLagna: int|null, houseFromMoon: int|null, status,
  tier: "engine_inference"}`. A→B and B→A computed separately (a test swaps the inputs).

**FAA-30 (D2): approved, descriptive only, no score.**
- FEMALE: 8th from lagna **and** 8th from Moon, `mangalyaReference: "BOTH"` until a
  sourced strength rule exists. MALE: "general 8th-house observations", never "mangalya".
  Unknown: `NOT_APPLIED` with the stated line.
- Malefics: Sani, Sevvai, Rahu, Ketu, Surya. Conditional: waning Moon (paksha) and Budhan
  (by association). Benefics: Guru, Sukran, waxing Moon. Every placement is recorded with
  dignity, combustion, aspect and **lordship** (`functional_status.functional_status`, which
  already exists). Phaladeepika's own-house exception applies (0.1).
- Guru's 5/7/9 aspects and Sukran's 7th aspect on the 8th or the 8th lord are recorded as
  separate protection lines, each with its own dignity. No automatic cancellation.
- Each factor carries the underlying placement id (rulings §1.5), so a Sevvai in the 8th
  shared with Sevvai dosham is visibly the same placement.
- D9 lines are dropped when the D9 lagna is unreliable.

**FAA-32 (D3): approved with added references.**
- Each chart: 5th, 5th lord, 5th occupants, Guru, **5th from Guru and its lord**
  (BPHS 7.42, `classical_rule`), aspects, D7 (reliability-gated).
- Stated FEMALE: also the 9th, 9th lord and 9th occupants (Phaladeepika 11.1,
  `classical_rule`). Stated MALE: 9th recorded as context only. Unknown: neither, and the
  reading says so.
- 5th from Moon: `engine_inference`.
- Timing lords: 5th lord, Guru, 5th occupants, lord of the 5th from Guru, dispositor of the
  5th lord; the bride's 9th lord and 9th occupants. Not the 2nd/7th lords. Horizon is 5 years
  by default, 10 optional. Windows are true intersections.

**FAA-31 (D4): Mahadasa A_FIXED ±6 months, engine-only until the owner ratifies.**
The horizon (10 years) starts from the planned marriage date if given, else the reference
date. No score, no dosham, no parihara. OWNER-Q-D1 decides which gap is measured.

**FAA-02 step 2 (D5): stays disabled.** The point table is **not approved**. When built:
the checks are separate evidence with no ranking, plus a decline when events cover fewer than
two distinct life categories. Varga stability comes from actual boundaries, not a 13-minute
average. The noise gate runs at least 500 cases (1,000 preferred). The decline target stays
≥ 80%. No consumer-facing candidate time.

**Cross-cutting.** A rule-source registry (rulings §9.1) records each new rule's
classification, book, edition, chapter/verse and school. The three citations above are its
first entries, with the gaps from 0.1 noted. Shared planetary classification comes from
existing modules, not a new table per item.

### 0.4 Owner answers (2026-11-11)

- **OWNER-Q-D2: AI consolidation.** New rules ship at `engine_inference` (describe and time,
  never grade). Only the lines verified in 0.1 are tagged `classical_rule`: 5th from Guru
  (BPHS 7.42) and the bride's 8th/9th (Phaladeepika 11.1). Mahadasa sandhi is a
  vendor-documented practice, not the astrologer's, so it ships at `engine_inference` and
  cites Prokerala p.17 as its evidence.
- **OWNER-Q-D1: show both.** The owner's answer was also AI-drafted, and the owner chose it.
  - The **primary** measure is the change-point gap: the days between the two Mahadasa changes.
    Below 6 months = "close"; 6–12 months = "near, read alongside the individual charts";
    over 12 months = not flagged.
  - The **supplementary** measure is the window gap, shown beside it. It never flags on its own.
  - Wording follows the advisory voice: the answer's "strong Dasa Sandhi concern" becomes
    "the two Mahadasa changes fall close together". No veto and no dosham. The thresholds are
    attributed to the selected practice, not presented as doctrine.
  - A later step, not v1, may read the outgoing and incoming lords' placement and strength.
  - Measured (0.2 population, 10,000 couples, seed 7; `scripts/audit/deferred_checks_measurements.py`,
    "OWNER-Q-D1 bands", 2026-11-11). A couple's band is its closest pair of changes:

    | Horizon | < 6 months ("close") | 6–12 months ("near") | Either |
    |---|---|---|---|
    | 5 years | 2.4% | 2.7% | 5.2% |
    | 10 years | 5.0% | 5.7% | 10.8% |

    Both bands are well under the ~30% noise line. A prevalence of the rule as coded, not a
    ratification. FAA-31 stays engine-only until the owner ratifies the surface.
- **Build: FAA-33 first**, then pause for review.

### 0.5 FAA-33 built (2026-11-11, uncommitted)

- **Engine.** `app/calculations/cross_chart.py`. It is pure and reads `ChartPoints`. Each
  direction is computed with its own `one_way` call. Every row has exactly one reference.
  CI attaches the rows through `_cross_chart` after the composite is fixed.
- **Wire.** `crossChart: CrossChartObservation[]` on CI. It is optional in
  `packages/shared` and defaults to `[]` in the schema, and carries numbers and graha keys
  only. Mobile does not read CI, so mobile needs no change.
- **Web.** A "Chart-to-chart observations" card in `compatibility-intelligence-panel.tsx`.
  Its copy is in `web/lib/cross-chart-copy.ts`, using `rasiDisplayName` / `tPlanetLord`. Venus
  and Guru overlay rows show only when they fall on the partner's 7th.
  The Tamil copy is Claude's draft and has not been native-reviewed.
- **PDF.** The same section is on the CI PDF, after Level 8. Its copy is
  `app/services/cross_chart_copy.py`, a mirror of the web copy. Both sides must reproduce
  `tests/golden/cross_chart/cross_chart_copy.json` (128 lines, generated from the web functions).
  The direction label is words, since the PDF fonts have no arrow glyph.
- **Gates.**
  - `tests/test_faa33_cross_chart.py` (11 tests).
  - The direct-pair API test now checks `crossChart`.
  - `web/lib/cross-chart-copy.test.ts` (6 tests, including the golden file).
  - The direct-pair PDF test finds the heading after proving every stream was read, and builds
    the Tamil PDF. With the section disabled, it fails.
  - Found while gating the PDF: `tests/_pdf_readable.py` skipped every second stream (it
    matched the `stream` inside `endstream`). Fixed, and `assert_probe_works` now requires every
    stream to inflate. The A12 at-rest leak check was not weakened (it searches ciphertext it
    first proves is ciphertext); only its proof-of-life read was partial.
  - Mutation run: reading the partner's placement for the 7th lord fails 2 tests (the
    own-placement test and the never-reads-destination test). Blind spot: the gates prove
    the geometry and the "no score" wiring, not that the 1/5/7/9 table is the right reading.
    That table is the ruling.
- **Found on the way (pre-existing at HEAD).** CI's `porutham_score` was typed `int`, but
  porutham totals come in halves since the Madhyama bands. Every pair with a Madhyama kuta
  failed validation with a 500 on the CI routes: 3 tests in `test_relationships_api.py`
  failed at HEAD. It is now typed `float`, and the PDF formats it with `:g`.

### 0.6 FAA-30 built (2026-11-11)

- **Engine.** `app/calculations/mangalya_sthana.py`, pure. Role from the stated gender only
  (BRIDE / GROOM_8TH / NOT_APPLIED). Both references, never merged. Factors: occupants, the 8th
  lord, malefic influence on the 8th and its lord, Guru/Sukran protection lines (each with its
  own dignity, no cancellation), D9 lines. Every factor records dignity, combustion, lordship
  (MARAKA removed, EC-RULING-06) and `ownHouse` (Phaladeepika 11.1's exception).
- **Shared placement id.** `placementId` (`D1.MARS`) plus `alsoCountedIn`: a Sevvai in the 8th
  that Sevvai dosham counts from the same reference shows as one placement ("one finding, not
  two"). Rahu-Ketu links the same way. FAA-32 reuses the id.
- **D9.** Lines appear only when the D9 lagna is the same sign at birth ±5 min (ephemeris
  bracket) and the stated time confidence is within 5 min. Otherwise all D9 lines drop, with a
  reason.
- **No status word.** D2's "supported / mixed / needs attention" was not built: under
  `engine_inference` a status word is a grade. Each chart instead carries one descriptive
  fact, `maleficInfluence`, and the couple a joint pattern (BOTH / ONE / NEITHER / NOT_APPLIED).
- **Rule-source registry.** `app/calculations/rule_sources.py`. `classical_rule` only for
  Phaladeepika 11.1 (and its own-house line) and BPHS 7.42. The bride's lagna-side
  occupant/lord lines cite 11.1. The Moon-side lines cite the rulings, because the Moon may
  be the translator's gloss. Prokerala p.17 is `vendor_practice`.
- **Surfaces.** CI: `eighthHouse` (web card after Level 5, PDF section after Level 5). Marriage
  reading: `eighthHouse` on `/charts/{id}/predictions/marriage`, under the Nova marriage card.
  Left out for a minor or a parent's reading. Mobile reads neither route, so it needs no change.
  Copy: `web/lib/eighth-house-copy.ts`, mirrored in `app/services/eighth_house_copy.py`, and
  both pinned by `tests/golden/eighth_house/eighth_house_copy.json` (108 lines). The Tamil is
  Claude's draft, not native-reviewed; the `{sign}-இல்` forms in particular want a reviewer.
- **Found on the way: a member's stated gender never reached their chart.**
  `create_birth_profile_record` dropped `gender_for_traditional_rules`, so every new profile,
  owner or member, stored `not_specified`. Member edits set `FamilyMember` only. Porutham
  worked around it by reading the member row; CI's FAA-16 spouse-karaka weights and Sevvai's
  gender rule did not. Fixed:
  - the create path copies the field;
  - member edits route it through `apply_birth_profile_changes`, so the chart recalculates;
  - `_sync_linked_family_member` mirrors it back;
  - the chart build falls back to the linked member's stated gender for rows written before
    the fix. No data was rewritten.

  **Behaviour change:** family members with a stated gender now get gender-specific readings
  (FAA-16 karaka weighting, Sevvai's gender rule, FAA-30) where they silently got the
  unknown-gender reading before.
- **Gates.** `tests/test_faa30_mangalya_sthana.py` (engine, plus the PDF copy against the
  golden file), the CI production-path test (bride and groom with the same chart: identical
  placements, differing only in role and tier; PDF names mangalya once), the marriage-route
  test, and `tests/test_member_stated_gender_reaches_the_chart.py`. Mutations: dropping the
  own-house check, the dosham link, the create copy or the edit copy each fail a test. Blind
  spot: the gates prove the wiring and the "no score" boundary. They do not prove the malefic
  list or the protection lines; those are the rulings.

Rules that bind every item below (already on record, not re-opened here):

- **Advisory voice; advise, never decide** (porutham glossary). No item outputs a verdict
  on whether to marry or whether a child will come.
- **EC-RULING-06**: never widowhood, spouse death or lifespan, for either chart.
- **Gender** only from the stated `gender_for_traditional_rules` field
  (`docs/FAA_DECISIONS_2026-11-11.md` §2). Unknown → the reading says which
  gender-specific readings it did not apply.
- **Tier**: a rule with no printed source (edition + page) ships at `engine_inference`.
  It **describes and times, and never grades** (the `progeny_checks.py` precedent) until
  the astrologer ratifies it.
- **Display boundary** (CLAUDE.md): numbers on the wire, names through `rasiDisplayName`
  / `tPlanetLord`. New endpoints get a typed wrapper in `packages/shared/src/api/`.
- Synthetic fixtures only.

Suggested build order: **FAA-33 → FAA-30 → FAA-32 → FAA-31 → FAA-02**. That runs
cheapest first, and the first three share one cross-chart assembler.

---

## D1. FAA-33 — classical cross-chart reference

**Purpose.** Two-chart readings compare scores. They never place one chart's factors in
the other chart. This adds the classical cross-references as **observations**.

**Reads (both directions, A→B and B→A):**

| # | Check | Computed as |
|---|---|---|
| 1 | A's 7th lord placed in B's chart | house of A's 7th-lord graha counted from B's lagna and from B's Moon |
| 2 | A's lagna rasi as a house in B's chart | `house_from_reference(B.lagna, A.lagna)`; 7th / 1st / trikona noted |
| 3 | A's Moon rasi as a house in B's chart | the same, from B's lagna |
| 4 | A's Venus and Guru falling on B's 7th | rasi equality with B's 7th house rasi |

**Output.** A new `crossChart` block on the compatibility-intelligence response:
`{direction: "A_TO_B"|"B_TO_A", key, houseFromLagna: int, houseFromMoon: int|null,
status: "SUPPORT"|"NEUTRAL"|"NOTE"}`. No score contribution in v1 (engine_inference).

**Copy.** One line per check. Example: "A's 7th lord (Venus) falls in B's 7th house."
Never "this makes them meant for each other".

**Acceptance.** A mirrored synthetic pair gives symmetric rows. A pair where A's lagna is
B's 7th rasi shows that row in both directions. The total score is unchanged (the test
pins the breakdown).

**Questions for the owner / astrologer.**
1. Which houses count as "support" for check 1? Proposed: 1, 5, 7, 9 from B's lagna or Moon.
2. Is Moon-reference read alongside lagna-reference, or lagna only?

---

## D2. FAA-30 — mangalya sthana (8th house), three separate assessments

**Purpose.** The 8th is reached today only through the Rahu–Ketu 2/8 axis and Sevvai in
the 8th. This reads it explicitly.

**Assessment 1: the bride's mangalya sthana** (stated female only):

| Factor | Computed as |
|---|---|
| 8th house occupants | grahas with `house_from_lagna == 8`; benefic / malefic split |
| 8th lord | house, dignity (`_dignity_label`), combust |
| Aspects on the 8th | `assess_bhava_afflictions(bhava_house=8, ...)`, as for the 7th |
| D9 support | the 8th lord's D9 dignity; malefics in D9's 8th |
| Guru on the 8th | Guru's aspect on the 8th or the 8th lord (a protection line) |

**Assessment 2: the groom's 8th-house factors** (stated male only). These are the same
computations, under their own label: "8th-house factors (marital stability)". **Not called
mangalya.** No lifespan wording.

**Gender unknown.** Neither label is applied. One neutral line says the mangalya reading
needs a stated gender (policy §2).

**Assessment 3: joint.** This is shown beside the existing samyam layers, not merged into
them. It reports whether both readings carry affliction (a "both charts" line) or only one.

**Output.** `mangalyaSthana: {role: "BRIDE"|"GROOM_8TH"|"NOT_APPLIED", factors:
AstroFactor[], summary: BiText}` per chart, on the marriage reading and on CI.
Status words: "supported", "mixed", "needs attention". **Never** "weak mangalya" as a
verdict.

**Interaction to check before building.** The Rahu–Ketu 2/8 dosham and Sevvai-in-8th
already reduce scores. If assessment 1 also scores, the same affliction counts twice
(memory: layered scoring double-counts). Proposal: v1 **does not score**. It describes
only.

**Acceptance.** Female fixture with an afflicted 8th lord: factor lines present, no score
change. Male mirror fixture: the label is "8th-house factors", and no string contains
"மாங்கல்ய" or "mangalya". Unknown-gender fixture: the NOT_APPLIED line. A copy sweep
finds no lifespan or widowhood vocabulary (reuse the EC-RULING-06 banned list).

**Questions.**
3. Which malefics count on the 8th? (Sani, Sevvai, Rahu, Ketu, Surya? Is a waning Moon included?)
4. Is Guru's aspect on the 8th a protection line? Does Sukran's count too?
5. Should a later version score it, and if so, by how much? Doing that means removing the
   2/8 overlap first.

---

## D3. FAA-32 — joint progeny

**Purpose.** Progeny checks are single-chart today (`progeny_checks.py`, the D7/dasa
step for Santhana Thadai / Putra Sarpa). This adds a two-chart reading.

**Four layers, reported separately (audit text):**

1. **Individual indications, each chart.** 5th house, 5th lord (house, dignity), Guru
   (putra karaka) house and dignity, malefics on the 5th. Reuses `progeny_checks` and
   the existing dosham detectors. No new rule.
2. **Joint considerations.** Whether both charts' 5th lords are afflicted, both Gurus
   are weak, or one supports while the other is strained. Each is stated as a pattern, not a
   sum.
3. **Dasha timing.** The bhuktis of the 5th lord / Guru / planets in the 5th that run for
   **both** partners in the next N years. Overlapping windows are listed (dates only).
4. **Supportive vs challenging factors.** Two lists, no net verdict.

**D7.** It is supporting evidence, **never pass/fail**. It reuses the D7 reliability rule
(`BIRTH_TIME_TOLERANCE_MINUTES`, `lagna_bracket`). An unreliable D7 lagna on either chart
drops that chart's D7 lines and says why.

**Never.** No "can / cannot have children", no probability, no grading (Q17 ruling).

**Output.** `jointProgeny: {individual: {a, b}, joint: AstroFactor[], timing:
[{start, end, lordA, lordB}], supports: BiText[], challenges: BiText[]}` on CI only.

**Acceptance.** One fixture per layer. Both-afflicted gives the joint line. An unreliable
D7 on one chart drops only that chart's D7 lines. Timing windows are the intersection of
the two dasha spans (unit test on synthetic DashaPeriods). A copy sweep runs against the Q17
banned phrases.

**Questions.**
6. Horizon for layer 3: 5 years? 10?
7. Which lords count for timing: 5th lord, Guru, occupants of the 5th, and the 9th lord?

---

## D4. FAA-31 — dasa sandhi surface

**State.** The engine is built (`dasa_sandhi.py`, three window options, two couple
readings). The owner ruled it engine-only on 2026-11-09. There is no surface.

**What a surface needs, per the module header, before anything ships:**

| Decision | Options on record | Proposal |
|---|---|---|
| Window | A_FIXED (±6 months) / B_BHUKTI / C_PRATYANTARA | B_BHUKTI: the classical reading most often cited; measure first with `scripts/audit/deferred_checks_measurements.py` |
| Couple reading | transitions within tolerance / windows overlap | windows overlap (a stated claim, not a coincidence count) |
| Tolerance, horizon | free parameters | horizon 10 years; tolerance only under the first reading |
| Interpretation | none | a timing note ("a period of change for both"); no score, no dosham, no parihara |
| "Same mahadasa lord for both" | deliberately not built | stays not built; it is a separate rule |

**Output when ruled.** `dasaSandhi: [{personA: {start, end}, personB: {...}, overlap:
{start, end}}]` on CI, under a "timing" heading. No score.

**Acceptance.** The measurement script run is recorded with the share of synthetic couples
flagged under the chosen option. If it is above ~30%, the note is noise; reconsider before
shipping.

**Question.**
8. Approve B_BHUKTI + overlap + 10-year horizon + note-only? Or keep it engine-only?

---

## D5. FAA-02 step 2 — multi-event rectification

**State.** Step 1 is built. The recommendation is withdrawn behind
`rectification_recommendation_enabled`, and event capture is kept.

**Input change (the API contract, all four surfaces).** `RectificationEvent` gains:

- `eventDay: int | null` (the day of the month);
- `dateReliability: "EXACT" | "MONTH" | "YEAR" | "UNSURE"`, required, with no default.
  The client asks for it; the server never infers it from which fields are filled.
- Event types extended to the bhavas the method tests: MARRIAGE (7), CHILD_BIRTH (5),
  CAREER_START/BREAK (10), PROPERTY (4), RELOCATION (12/4), PARENT_DEATH is **not**
  added (EC-RULING-06 spirit).

**Method, per candidate** (30-min grid over the stated range, then 5-min around the
leaders):

| Test | Needs reliability | Points (proposal) |
|---|---|---|
| Event bhava + its lord + lagna lord linked (occupation, aspect, lordship) | any | 1 |
| Running MD/AD lord linked to that bhava or lord | EXACT or MONTH | 2 |
| Pratyantara linked | EXACT | 1 |
| Varga repeats it (D9 marriage, D7 child, D10 career) | EXACT, and the varga lagna is stable ±5 min | 1 |
| Slow transit (Guru/Sani or double transit on the bhava) | EXACT or MONTH | 1 |

YEAR events carry only the first row. UNSURE events are shown but never scored.

**Decline rules (any one → no recommendation):**
- fewer than 3 events at MONTH or better;
- the top candidate within the noise band of the second (proposal: <15% of the max
  score apart);
- the leading candidates span more than one lagna.

**Output.** Ranked windows with a ± range, `confidence: "LOW"|"MEDIUM"`. There is **no
HIGH**: dasha and transit agreement cannot prove a birth time. Copy: "most consistent with
the events you gave". Write-back stays behind explicit confirmation and the existing flag.

**Acceptance (audit text).** A synthetic chart with three exact events ranks the true window
first. Shuffling the dates changes the ranking. With one event, or three year-only events,
it declines. A noise gate runs it on 50 synthetic charts with random events, and the decline
rate must be at least 80% (proof that random events can't produce a confident time).

**Questions.**
9. Approve the point table, or hand it to the astrologer?
10. Is the 5-min refinement useful? D9 moves about every 13 minutes, so a 5-min answer
    may claim more precision than the events support.
11. Does a birth-time-unknown user see this tool at all before the method is ratified?

---

## Open-question index

| # | Item | Who | Answer (rulings 2026-11-11, §0) |
|---|---|---|---|
| 1–2 | FAA-33 support houses; Moon reference | astrologer | 1/5/7/9 support, 11 note; lagna + Moon + Moon-to-Moon |
| 3–5 | FAA-30 malefics; Guru protection; scoring later | astrologer, owner | Sani/Sevvai/Rahu/Ketu/Surya, waning Moon + Budhan conditional; Guru and Sukran, each by its own strength; no score |
| 6–7 | FAA-32 horizon; timing lords | astrologer | 5 y default, 10 optional; §0.3 lord list |
| 8 | FAA-31 surface or not | owner | Mahadasa A_FIXED; engine-only until ratified; show both gaps, change-point primary (§0.4) |
| 9–11 | FAA-02 points; precision; exposure | astrologer, owner | points not approved; 5-min grid internal only; disabled |
