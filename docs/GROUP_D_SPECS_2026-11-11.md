# Group D — build specifications (FAA-02 step 2, FAA-30, FAA-31, FAA-32, FAA-33)

Status: **draft for owner review, 2026-11-11.** Nothing here is built. Every item lists
the questions it needs answered before code. Parent: `docs/FULL_ASTRO_ACCURACY_AUDIT_2026-11-10.md`
(the audit text for each item is the requirement; this file is the "how").

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

| # | Item | Who |
|---|---|---|
| 1–2 | FAA-33 support houses; Moon reference | astrologer |
| 3–5 | FAA-30 malefics; Guru protection; scoring later | astrologer, owner |
| 6–7 | FAA-32 horizon; timing lords | astrologer |
| 8 | FAA-31 surface or not | owner |
| 9–11 | FAA-02 points; precision; exposure | astrologer, owner |
