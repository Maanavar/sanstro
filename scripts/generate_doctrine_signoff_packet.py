"""Generate the practitioner packet for the unfrozen yoga/dosham doctrine.

The packet is generated from the live functional-status matrix so a reviewer
never signs a hand-copied table. Use ``--check`` in CI or before committing.

v1.7 (2026-10-03): the owner's rulings on the v1.5 packet are applied as code
defaults. The packet now shows each one as the applied default, for the
practitioner to confirm or correct; an owner ruling is not a signature.

v1.8 (2026-10-03, second round): Kadagam Guru is a named exception to the
moolatrikona co-lord test, O-24 is ruled `mixed`, and the section D wording is
the owner-supplied text. Section D stays open for a named native reader.
"""
from __future__ import annotations

import argparse
import hashlib
from pathlib import Path

from app.calculations.doctrine_options import DEFAULT_DOCTRINE, DoctrineOptions
from app.calculations.functional_status import (
    ALL_LAGNAS,
    FUNCTIONAL_STATUS_MATRIX,
    MATRIX_SIGNED_OFF,
    RAJA_LINEAGE_EXCEPTIONS,
    SEVEN_SIGN_LORDS,
    SOURCE_VETOED_RAJA_PAIRS,
    FunctionalStatus,
    kendradhipati_two_kendras,
    owned_houses,
    raja_participation,
)

_SIX_EIGHT_ONLY = DoctrineOptions(o23_six_eight_colord_mode="moolatrikona")
_LORDSHIP_ONLY = DoctrineOptions(o23_six_eight_colord_mode="lordship_only")
_KENDRADHIPATI_EXCLUDE = DoctrineOptions(o24_kendradhipati_two_kendras="exclude")


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "docs" / "DOCTRINE_V15_PRACTITIONER_SIGNOFF_PACKET.md"

RASI_NAMES = {
    1: "Mesham",
    2: "Rishabam",
    3: "Mithunam",
    4: "Kadagam",
    5: "Simmam",
    6: "Kanni",
    7: "Thulam",
    8: "Viruchigam",
    9: "Dhanusu",
    10: "Magaram",
    11: "Kumbam",
    12: "Meenam",
}

ABBREVIATIONS = {
    FunctionalStatus.LAGNA_LORD: "LL",
    FunctionalStatus.TRIKONA_BENEFIC: "TB",
    FunctionalStatus.DUAL_LORD_YOGAKARAKA: "YK",
    FunctionalStatus.KENDRA_LORD: "KL",
    FunctionalStatus.KENDRADHIPATI_BENEFIC: "KB",
    FunctionalStatus.KENDRADHIPATI_MALEFIC: "KM",
    FunctionalStatus.TRISHADAYA_MALEFIC: "TM",
    FunctionalStatus.CONTEXTUAL_2ND: "C2",
    FunctionalStatus.CONTEXTUAL_12TH: "C12",
    FunctionalStatus.EIGHTH_SPECIAL_CASE: "E8",
    FunctionalStatus.EIGHTH_LUMINARY_EXEMPT: "E8X",
    FunctionalStatus.MARAKA: "MK",
}


def lagna_label(lagna: int) -> str:
    return f"{RASI_NAMES[lagna]} ({lagna})"


def canonical_matrix() -> str:
    rows: list[str] = []
    for lagna in ALL_LAGNAS:
        for planet in SEVEN_SIGN_LORDS:
            statuses = sorted(status.value for status in FUNCTIONAL_STATUS_MATRIX[(lagna, planet)].statuses)
            rows.append(f"{lagna}|{planet}|{','.join(statuses)}")
    return "\n".join(rows)


def matrix_cell(lagna: int, planet: str) -> str:
    statuses = FUNCTIONAL_STATUS_MATRIX[(lagna, planet)].statuses
    ordered = sorted(ABBREVIATIONS[status] for status in statuses)
    houses = "/".join(str(house) for house in sorted(owned_houses(lagna, planet)))
    return f"{'+'.join(ordered)}<br><sub>owns {houses}</sub>"


def focus_rows(status: FunctionalStatus) -> list[list[str]]:
    rows: list[list[str]] = []
    for lagna in ALL_LAGNAS:
        for planet in SEVEN_SIGN_LORDS:
            cell = FUNCTIONAL_STATUS_MATRIX[(lagna, planet)]
            if status in cell.statuses:
                labels = ", ".join(sorted(item.value for item in cell.statuses))
                houses = ", ".join(str(house) for house in sorted(owned_houses(lagna, planet)))
                rows.append([lagna_label(lagna), planet, houses, labels])
    return rows


def raja_cell(lagna: int, planet: str) -> str:
    """What Raja Yoga actually reads for this lord: its side(s) and eligibility."""
    part = raja_participation(lagna, planet, DEFAULT_DOCTRINE)
    sides = "+".join(side for side, on in (("K", part.kendra_lord), ("T", part.trikona_lord)) if on)
    if not sides:
        return "—"
    if not part.eligible:
        return f"**{sides} excluded**<br><sub>{part.basis}</sub>"
    if part.basis == "kendradhipati_mixed":
        return f"{sides}<br><sub>mixed (kendradhipati)</sub>"
    if part.basis in {exception.basis for exception in RAJA_LINEAGE_EXCEPTIONS.values()}:
        return f"{sides}<br><sub>mixed (lineage exception)</sub>"
    return sides


def excluded_rows() -> list[list[str]]:
    rows: list[list[str]] = []
    for lagna in ALL_LAGNAS:
        for planet in SEVEN_SIGN_LORDS:
            default = raja_participation(lagna, planet, DEFAULT_DOCTRINE)
            if (default.kendra_lord or default.trikona_lord) and not default.eligible:
                six_eight = raja_participation(lagna, planet, _SIX_EIGHT_ONLY)
                lordship = raja_participation(lagna, planet, _LORDSHIP_ONLY)
                houses = ", ".join(str(h) for h in sorted(owned_houses(lagna, planet)))
                rows.append([
                    lagna_label(lagna), planet, houses, default.basis,
                    "eligible" if six_eight.eligible else "excluded",
                    "eligible" if lordship.eligible else "excluded",
                ])
    return rows


def kendradhipati_rows() -> list[list[str]]:
    rows: list[list[str]] = []
    for lagna in ALL_LAGNAS:
        for planet in SEVEN_SIGN_LORDS:
            if kendradhipati_two_kendras(lagna, planet):
                houses = ", ".join(str(h) for h in sorted(owned_houses(lagna, planet)))
                alt = raja_participation(lagna, planet, _KENDRADHIPATI_EXCLUDE)
                rows.append([
                    lagna_label(lagna), planet, houses, "takes part, MIXED_KENDRADHIPATI",
                    "excluded" if not alt.eligible else "takes part",
                ])
    return rows


def veto_rows() -> list[list[str]]:
    return [
        [lagna_label(lagna), " + ".join(sorted(pair)), source]
        for (lagna, pair), source in sorted(SOURCE_VETOED_RAJA_PAIRS.items(), key=lambda kv: kv[0][0])
    ]


def markdown_table(headers: list[str], rows: list[list[str]]) -> str:
    header = "| " + " | ".join(headers) + " |"
    separator = "|" + "|".join("---" for _ in headers) + "|"
    body = ["| " + " | ".join(row) + " |" for row in rows]
    return "\n".join([header, separator, *body])


def render() -> str:
    digest = hashlib.sha256(canonical_matrix().encode("utf-8")).hexdigest()
    matrix_rows = [
        [lagna_label(lagna)] + [matrix_cell(lagna, planet) for planet in SEVEN_SIGN_LORDS]
        for lagna in ALL_LAGNAS
    ]
    row_checks = "\n".join(f"- [ ] {RASI_NAMES[lagna]} row: all seven cells reviewed" for lagna in ALL_LAGNAS)
    focus_headers = ["Lagna", "Graha", "Owned houses", "Full status set"]
    c12_table = markdown_table(focus_headers, focus_rows(FunctionalStatus.CONTEXTUAL_12TH))
    e8_table = markdown_table(focus_headers, focus_rows(FunctionalStatus.EIGHTH_SPECIAL_CASE))
    e8x_table = markdown_table(focus_headers, focus_rows(FunctionalStatus.EIGHTH_LUMINARY_EXEMPT))
    matrix_table = markdown_table(["Lagna", *SEVEN_SIGN_LORDS], matrix_rows)
    raja_table = markdown_table(
        ["Lagna", *SEVEN_SIGN_LORDS],
        [[lagna_label(lagna)] + [raja_cell(lagna, planet) for planet in SEVEN_SIGN_LORDS] for lagna in ALL_LAGNAS],
    )
    excluded_table = markdown_table(
        ["Lagna", "Graha", "Owned houses", "Basis (applied default)", "Under 6th/8th-only test", "Under `lordship_only`"],
        excluded_rows(),
    )
    kendradhipati_table = markdown_table(
        ["Lagna", "Graha", "Owned houses", "Applied default (O-24 `mixed`)", "Under O-24 `exclude`"],
        kendradhipati_rows(),
    )
    veto_table = markdown_table(["Lagna", "Pair", "Source (verse pending §18)"], veto_rows())
    signed_state = "SIGNED" if MATRIX_SIGNED_OFF else "UNSIGNED"
    return f"""# Vinaadi doctrine practitioner sign-off packet

**Doctrine record:** `docs/DOCTRINE_DECISIONS_V1.2.md` v2.1
**Generated from:** `app/calculations/functional_status.py`
**Engine state at generation:** `{signed_state}` (`MATRIX_SIGNED_OFF = {MATRIX_SIGNED_OFF}`)
**84-cell SHA-256:** `{digest}`

This packet gathers the decisions that cannot be completed by code review. It
does not turn an unchecked source into a verified citation, and generation does
not constitute a signature. Sign only after comparing the table and cited
verses with the editions named below.

**Owner rulings of 2026-10-03.** The project owner reviewed the v1.5 packet
and ruled on it ("approve with corrections"). Those rulings are now the
engine's defaults, and this packet shows them as **applied**. They are an owner
decision, not a practitioner signature: please confirm or correct each one.
The matrix remains unsigned until you sign section A.

**Second round, also 2026-10-03 (v1.8).** The owner then ruled on Kadagam Guru
(re-admitted as a named exception, graded MIXED) and O-24 (`mixed`), and
supplied the Tamil wording in section D. Both A2 rulings are shown as applied
below. The physical-edition ledger (section C) is unchanged.

**DD-17, 2026-10-06 (v2.1).** Four dosham rulings (O-26 to O-29) and a
residual grade, applied as defaults after a practitioner's review of a real
chart; see section B. Not a practitioner signature.

## A. O-9: 12 x 7 functional-status matrix

Each cell shows its full status set and, below it, the houses owned from that
lagna. Rahu and Ketu are intentionally excluded because they own no signs.

{matrix_table}

### Legend

| Code | Meaning |
|---|---|
| LL | Lagna lord |
| TB | Trikona benefic (owns 1, 5 or 9) |
| YK | Dual-lord yogakaraka: owns one of 4/7/10 and one of 5/9; house 1 does not satisfy either side |
| KL | Kendra lord (owns 4, 7 or 10): lordship only |
| KB | Kendradhipati, natural benefic (Guru, Sukran, Budhan, Chandran): loses its beneficence by kendra lordship. Not given to the lagna lord |
| KM | Kendradhipati, natural malefic (Surya, Sevvai, Sani): sheds its malefic nature by kendra lordship. Not given to the lagna lord |
| TM | Trishadaya malefic (owns 3, 6 or 11) |
| C2 | Contextual 2nd lord |
| C12 | Contextual 12th lord |
| E8 | 8th-lord special case |
| E8X | 8th lord that is the Sun or Moon: ownership kept, 8th-lordship blemish withdrawn |
| MK | Maraka lord (2nd or 7th; timing context only) |

Natural nature for KB/KM uses Laghu Parashari's static list. The chart-level
reading of the Moon by paksha and of Budhan by its company (DD-12) cannot be
seen by a table built per lagna.

**Precedence (applied):** the lagna lord overrides the 8th. Mesham-Sevvai and
Thulam-Sukran own the 1st and the 8th; they always take part in Raja Yoga as
the lagna lord, and the 8th never grades their pair MIXED.

**Deliberate omission:** badhaka lordship is not in this matrix. That follows
Tamil practice; it is recorded here as a choice, not an oversight.

### Required row review

{row_checks}

### Required focus review: every 12th-lord cell

{c12_table}

### Required focus review: every 8th-lord cell

{e8_table}

### The two luminary 8th-lord cells (owner ruling 2026-10-03)

{e8x_table}

Applied: Laghu Parashari (and BPHS Ch. 34) exempt the Sun and the Moon from the
8th-lordship blemish. Their 8th ownership is kept, because longevity and sudden
events still route through that graha; only the malefic-by-lordship tag goes.
This does not make them benefics.

- [ ] Confirm. Laghu Parashari verse in your edition: ____________________
- [ ] Correct: ____________________

### Node rule, reviewed separately from lordship

- [ ] Confirm Rahu/Ketu never receive a lordship status from this matrix.
- [ ] Confirm their functional context is read through the occupied house and
  its sign lord, conjunctions, and aspects *received* (`node_functional_context`).
  Laghu Parashari: the nodes give the results of the bhava they occupy and the
  lord they join. The nodes' own outgoing aspects are a separate lineage
  question and are not read here.
- [ ] Confirm the node rule applies to both Rahu and Ketu.

### O-9 attestation

- [ ] I reviewed all 84 cells, including the complete status set in each cell.
- [ ] I reviewed every C12, E8 and E8X focus row above.
- [ ] I approve the KL / KB / KM split, including no kendradhipati for the lagna lord.
- [ ] I approve the separate Rahu/Ketu functional-context rule.
- [ ] I approve the YK definition above, including exclusion of house 1.

Practitioner name: ______________________________
Edition/tradition used: __________________________
Decision: [ ] approve as written  [ ] approve with corrections attached  [ ] reject
Signature: ______________________________________  Date: _______________

After a clean approval, change `MATRIX_SIGNED_OFF` to `True`, record the
signature date beside it, regenerate this packet, and commit the signed record.
Do not flip the constant for a partial or verbal review.

## A2. What Raja Yoga actually reads (DD-07 step 2)

The matrix above decides which lords are kendra (K) and trikona (T) lords. A
second rule then decides whether a lord **may take part** in a kendra–trikona
Raja Yoga at all. Signing the matrix alone does not sign this rule, so it is
shown here as the engine runs it today.

- Lagna lord: always takes part.
- 12th co-lord: takes part (DD-07 / O-4; O-14 records the conflict).
- 3rd, 6th, 8th or 11th co-lord: takes part only if its moolatrikona sign is
  the kendra or trikona it owns. The 6th/8th half is the 2026-09-23 ruling; the
  owner extended it to the 3rd/11th on 2026-10-03 (O-23).
- One named exception to that test: Kadagam Guru (6+9) takes part as the 9th
  lord and carries its 6th, so every pair it forms grades MIXED (v1.8).
- A natural benefic owning two kendras takes part, graded MIXED for
  kendradhipati (O-24, owner ruling v1.8).
- Three pairs named in BPHS Ch. 34 never form a Raja Yoga for their lagna,
  whatever the lordships say.

Each linked pair now has one of three outcomes: **CONFIRMED** (full or
qualified grade), **MIXED** (a 6th/8th co-lord, or kendradhipati), or
**SOURCE_VETOED**.

{raja_table}

These lords own a kendra or trikona and are nonetheless shut out of every Raja
Yoga:

{excluded_table}

Mesham Sani, Simmam Sukran and Kumbam Sevvai are new under the 3rd/11th
extension. The owner's review listed the first two. Kumbam Sevvai (3+10, its
moolatrikona Mesham is the 3rd) follows from the same rule; BPHS Ch. 34 is
commonly read as calling Sevvai a malefic for Kumbha.

**Kadagam Guru (6+9), owner ruling 2026-10-03 (v1.8): a named exception.**
Guru's moolatrikona, Dhanusu, is the 6th from Kadagam, so the test above would
shut the 9th lord out of every Raja Yoga. Many Tamil practitioners read Guru as
a strong benefic for Kataka. Applied: the test is kept, and Guru alone is
re-admitted as the 9th lord. Its 6th lordship is not erased: with Sevvai (5+10,
the yogakaraka), Chandran (the lagna lord) or Sukran (4+11), every pair grades
MIXED, never FULL. No other 6th/8th co-lord is affected. Recorded as a Tier C
lineage choice; the owner's supporting sources were web summaries, not an
edition. With the exception switched off (`o23_lineage_exceptions = false`)
Guru is excluded as `moolatrikona_dusthana`, as in v1.7.

- [ ] Confirm the extended moolatrikona test with the Kadagam Guru exception (applied default).
- [ ] Remove the exception (exclude Kadagam Guru again).
- [ ] Use the 6th/8th-only test.  [ ] Use `lordship_only`.

**Kendradhipati, natural benefics owning two kendras (O-24, owner ruling v1.8):**

{kendradhipati_table}

Applied (owner ruling 2026-10-03, v1.8): **`mixed`.** Kendradhipati modifies a
lord's functional nature and grade; it does not remove its Raja Yoga
eligibility. BPHS Ch. 34 states kendradhipati (benefics owning kendras lose
their benefic quality) and then, separately, that kendra–trikona relationships
give yoga; its Dhanus paragraph names Surya + Budhan as capable of yoga, which
`exclude` would contradict. Pair rules still run after eligibility: Mithunam
Guru is eligible, and its pair with Sani is still vetoed below. The owner read
the Dhanus line in an online transcription, so it stays provisional until the
printed edition is checked (section C).

- [ ] Confirm `mixed` (applied default).
- [ ] Use `exclude`.
- [ ] Dhanus Surya + Budhan verse, your edition: ____________________

**Source-vetoed pairs (BPHS Ch. 34, owner ruling 2026-10-03):**

{veto_table}

Under the default, Mesham Sani and Simmam Sukran are already excluded by the
moolatrikona test; the veto table is what holds for Mithunam, and for all three
if the co-lord test is ever switched. A vetoed pair forms nothing and is
recorded on the card so the reader is told why.

- [ ] Confirm all three pairs. Verse numbers in your edition: ____________________

## B. Doctrine choices: applied owner rulings and open items

The mechanisms below exist in code. Each shows the default the engine now
runs. Changing one requires a dated update to the doctrine record and a code
default change, not a runtime flag.

### O-2: Rahu/Ketu favourable-sign lineage

Applied (owner ruling 2026-10-03): **disabled.** Lineages conflict (Rahu's
exaltation is given as Rishabam or Mithunam, Ketu's as Viruchigam or Dhanusu,
and popular Tamil lists differ again). Enable only with a named printed source.

- [ ] Confirm disabled.
- [ ] Enable an explicit lineage and sign list.

Required if enabled:
Lineage/source: __________________________________
Rahu favourable rasis (1-12): ____________________
Ketu favourable rasis (1-12): ____________________

The engine refuses `explicit_signs` without a non-empty source and at least one
valid rasi. No sign list is inferred by Vinaadi.

### O-11: retrograde debilitated-planet Raja Yoga

Applied (owner ruling 2026-10-03): **off**, until "bright rays" is modelled
properly. Non-combust is not equivalent to the rashmi condition; if the proxy is
ever kept, copy must never claim the classical condition is met. Candidate
verse for the ledger: Phaladeepika 7.3.

- [ ] Confirm off.
- [ ] Adopt with this model of bright rays: ____________________

### O-13: Neecha Bhanga Raja Yoga needs two or more conditions

Applied (owner ruling 2026-10-03): one cancellation condition reads
**நீசபங்கம்** (debility cancelled; v1.8 label, was நீச நிவர்த்தி) and makes no
raja-yoga claim; the name
Neecha Bhanga Raja Yoga needs two or more distinct conditions. Cancellation
itself still needs only one (DD-09). This is a display rule, not a textual
threshold.

- [ ] Confirm.
- [ ] Correct: ____________________

### O-17: dignified but incomplete Lakshmi cases

Applied (owner ruling 2026-10-03): **`literal`.** No pseudo-yoga is built
from "almost Lakshmi"; a strong 9th lord still feeds general fortune scoring.

- [ ] Confirm `literal`.
- [ ] Use `all_incomplete_lakshmi`.

### O-18: Mesham/Viruchigam Sevvai exception

Applied (owner ruling 2026-10-03): **`strong_mitigation`** — one mitigation
point and one grade of softening, matching DD-06; other independent mitigations
can still combine to nivarthi. Popular Tamil lists treat aatchi/ucham as full
nivarthi; for a marriage reading a false "no dosham" is the costlier error, so
this is Vinaadi's deliberate divergence from that list.

- [ ] Confirm `strong_mitigation`.
- [ ] Restore `full_cancellation`.

### O-21: Budhan as its own exaltation-sign lord (neecha bhanga)

Budhan is debilitated in Meenam and rules Kanni, its own exaltation sign. Read
literally, NB-b, NB-c and NB-g then test the debilitated Budhan's own position,
which is NB-e, the rule DD-09 deleted.

Applied (owner ruling 2026-10-03): **counted, tagged `nb_self_reference`.** Its
positional condition (the kendra) must still hold, and a self-referenced rule
can never by itself lift the grade to Strong.

- [ ] Confirm.
- [ ] Skip the self-reference (v1.6).

### O-22: the Moon as strict Gaja Kesari's supporting benefic

Applied (owner ruling 2026-10-03): **the Moon counts when it is benefic
(waxing) and conjunct or opposite Guru.** From the 4th or 10th it sets up the
kendra but does not aspect Guru, so another benefic is needed. Guru in a kendra
from the lagna is supported too; the Moon need not take part at all.

- [ ] Confirm.
- [ ] Require a benefic other than the Moon.

### O-23 and O-24

See section A2.

### O-26 to O-29: dosham reckoning (DD-17, 2026-10-06)

A practitioner's review of a real chart (passed on by the owner) found the
cards called a Rahu-Ketu axis "Mitigated · Low intensity", hid that Sevvai was
counted from the Moon and Venus but not the Lagna, and leaned on one rule with
no source. Applied as defaults by Claude acting for the owner; **not** a
practitioner signature. Frequencies: `docs/DOSHAM_DD17_FREQUENCY_REPORT_2026-10-06.md`.

- **O-26 Sevvai, Mars's sign lord in a kendra/trikona from Mars — off.** It
  came from an internal design note, not a text, and on the reviewed chart it
  alone turned a strong active dosham into nivarthi.
  - [ ] Confirm off.  [ ] Restore (`from_mars`), source: ____________________
- **O-27 Sevvai, a strong 7th lord protects when own/exalted or in a
  kendra/trikona**, unafflicted and not combust (the Rahu-Ketu 7th-lord test).
  The previous test also required a functional benefic, which only the 7th
  lords of Mithunam, Kanni, Dhanusu and Meenam ever are, so on 8 of 12 lagnas
  no 7th lord could protect.
  - [ ] Confirm.  [ ] Restore the kendra-and-functional-benefic test.
- **O-28 Rahu-Ketu 2/8 axis, the 2nd lord's dignity protects the 2nd house**
  (own or exaltation sign, unafflicted, not combust). The 8th side's broader
  test (any kendra/trikona placement, or a benefic on the house) was measured
  and rejected for the 2nd: it doubled the axis's nivarthi rate.
  - [ ] Confirm `dignity`.  [ ] Use `strong_or_benefic`.  [ ] `off` (8th side only).
- **O-29 Rahu-Ketu, one Guru aspect counts once.** On the 2/8 axis Guru
  aspecting the node in the 8th also counted as "benefic on the 8th".
  - [ ] Confirm.  [ ] Allow the double count.
- **Residual (Tier C, engine convention):** a mitigated dosham always shows a
  residual, never "none". It is MODERATE only when a STRONG formation from the
  Lagna was offset by exactly the threshold number of mitigations; otherwise
  MILD. Navamsa repetition of the node axis and "not counted from the Lagna" are
  shown as context and never move a grade (DD-03 keeps D9 out of the grade).
  - [ ] Confirm.  [ ] Correct: ____________________
- **O-30 (open):** should a Sevvai counted only from the Moon/Venus be graded
  lower *before* mitigation, not only in its residual?
  - [ ] Keep as is.  [ ] Discount in the formation grade: ____________________
- **O-31 (open):** should a mitigated Rahu-Ketu axis keep a "mild-moderate"
  residual floor, since the placement itself remains?
  - [ ] Keep three grades (copy says "the placement itself remains").  [ ] Add the floor.
- **O-32 Putra Sarpa, Thulam lagna, Sani in Kumbam (owner ruling 2026-10-06).**
  Sani is the 5th lord, in its own sign, and the yogakaraka (4th + 5th). The
  placement is recorded but does not form the dosham ("Neutralized"); a node
  in the 5th or beside Guru still forms it. This one case only, not a blanket
  "own sign cancels" rule. Before this, Sani "beside the 5th lord" compared Sani
  with itself and formed Putra Sarpa in every Thulam-lagna chart (a code defect,
  fixed).
  - [ ] Confirm `neutralized`.  [ ] Use `ordinary` (count it as any Sani in the 5th).

Practitioner name: ______________________________
Signature: ______________________________________  Date: _______________

## B2. Calibration (Tier C — frequency, not doctrine)

From `docs/DOCTRINE_V17_FREQUENCY_REPORT_2026-10-03.md` (the same 3,000
ephemeris charts and seed as the v1.3 report). These are engine thresholds,
not textual rules:

- Raja Yoga forms on 78.6% of charts under v1.8 (76.4% under v1.7, 80.4%
  under v1.6). v1.7 moved it down by 0.9 for the source vetoes and 3.0 for the
  3rd/11th extension; the v1.8 Kadagam Guru exception adds 2.2 back, every one
  of those charts MIXED-only. On 56.9% of charts at least one pair is
  CONFIRMED (unchanged since v1.7); on 21.8% every forming pair is MIXED.
  **The corrections do not make Raja Yoga rare.** What keeps it common is the
  all-pairs sweep (`YOG-RY-01`), which the 2026-08-27 reviewer already
  questioned.
- Neecha Bhanga Raja Yoga, now needing two conditions, forms on 24.7% of all
  charts (42.1% under v1.6); 15.3% read Strong. நீசபங்கம் (one condition)
  appears on 22.5%. A Budhan self-reference (O-21) touches 4.4% of charts.
- Sevvai: Mesham/Viruchigam strong mitigation (O-18) moves cancellation from
  71.0% to 70.9% of all charts — four charts in 3,000.

Owner ruling 2026-10-03: **do not accept yet.** The doctrine corrections came
first; consumer prominence is decided on these re-run numbers. Planned display
model, not yet built: three separate dimensions, FORMED / STRENGTH / ACTIVE NOW.
A yoga earns a daily headline only while a participating lord's dasha or bhukti
runs, and the consumer label "Raja Yoga" also requires that neither lord be
combust, debilitated without cancellation, or in 6/8/12.

- [ ] Accept these frequencies for consumer display as graded.
- [ ] Rule on a threshold change (attach): ____________________________

## C. Section 18 physical-edition verification ledger

Do not check a row from an online transcription alone. Record edition,
translator/editor, publication year, page and the person who inspected it.
Record each edition's **own** verse numbering; BPHS numbering varies widely.

Commonly used English editions: BPHS (R. Santhanam, or G. C. Sharma);
Phaladeepika (V. Subrahmanya Sastri); Saravali (R. Santhanam); Brihat Jataka
(B. Suryanarain Rao); 300 Important Combinations (B. V. Raman); Laghu Parashari
(any edition with Sanskrit text and commentary).

| Source claim | Physical edition / page | Verified by / date | Result |
|---|---|---|---|
| BPHS 36.3-4 |  |  | [ ] match [ ] correction |
| BPHS 36.27-28 |  |  | [ ] match [ ] correction |
| BPHS 34.11-15 |  |  | [ ] match [ ] correction |
| BPHS 34, ascendant-wise counterexamples: Mesha Guru+Sani, Mithuna Guru+Sani, Simha Guru+Sukran (A2 vetoes) |  |  | [ ] match [ ] correction |
| BPHS 34, Dhanus: Surya + Budhan named as yoga-giving (O-24) |  |  | [ ] match [ ] correction |
| BPHS 3.11 |  |  | [ ] match [ ] correction |
| Phaladeepika 6.21 |  |  | [ ] match [ ] correction |
| Phaladeepika 7.26-30 map (online map exists; physical check open) |  |  | [ ] match [ ] correction |
| Phaladeepika 7.3, retrograde/debilitated verse (O-11 candidate) |  |  | [ ] match [ ] correction |
| Saravali Adhi raja-grade condition |  |  | [ ] match [ ] correction |
| Brihat Jataka 13.2 |  |  | [ ] match [ ] correction |
| Srutakeerti commentary on BJ 13.2 |  |  | [ ] match [ ] correction |
| Raman, 300 Combinations: Yogas 1, 7 and 27 |  |  | [ ] match [ ] correction |
| Laghu Parashari functional-lordship verses |  |  | [ ] match [ ] correction |
| Laghu Parashari: the Sun and Moon exempt from the 8th-lordship blemish |  |  | [ ] match [ ] correction |
| Laghu Parashari: nodes give the results of their bhava and associated lord |  |  | [ ] match [ ] correction |
| Printed Tamil source: Rahu/Ketu and gender-weighted Sevvai lists |  |  | [ ] match [ ] correction |

Verifier attestation: I inspected the physical editions recorded above and did
not rely only on a web transcription.
Name: __________________  Signature: __________________  Date: __________

## D. Native Tamil copy review

Review in context, not as isolated dictionary translations: every short label
and expanded text rendered on its card, plus the complete pending list in
`docs/ASTROLOGER_REVIEW_QUEUE.md`. The owner supplied the wording below on
2026-10-03 (v1.8) and it is applied on web, shared and backend surfaces.
Review it in Tamil mode: the audit harness runs in English only.

**Reader review received 2026-10-03: "approve with minor copy corrections".**
It was passed on by the owner and does not name the reader, so the signature
below stays blank. Its corrections are applied:

- One term on the நீசபங்கம் card. Its strength lines now read *ஒரு நீசபங்க
  நிபந்தனை நிறைவேறியுள்ளது. நீசத்தின் தாக்கம் குறைகிறது; இது நீசபங்க ராஜயோகம்
  அல்ல.* "நீங்குகிறது" (removed) became "குறைகிறது" (reduced) everywhere.
- That card's "what it can bring" is hedged (*சீராகலாம்*). "How to strengthen"
  no longer claims service makes the cancellation hold. Remedies say ஆடை, not
  வஸ்திரம்.
- The 8th-support line is one sentence on web and backend, ending *— இதனால்
  தாக்கம் குறைகிறது.*
- The bright-rays line no longer says இயந்திரக் குறிகை; it explains that
  non-combustion is used only as a stand-in.
- `raja_grade_mixed` drops "6/8-ஐயும்": *தொடர்புடைய அதிபதிகளில் ஒருவர் 6 அல்லது
  8-ஆம் வீட்டையும் ஆள்கிறார் — அதனால் பலன் கலப்பாகிறது.*
- Combustion is one word, and a planet takes no honorific:
  அஸ்தங்கமடைந்துள்ளது / அஸ்தங்கமடையவில்லை / அஸ்தங்கமடைந்துள்ளன (the plural
  follows the planet count). A web test (`lib/combustion-verb.test.ts`) now
  fails on the split form or the -ார் ending.
- Smaller wording fixes: Gaja Kesari (கஜகேசரி யோகத்திற்கான), Adhi (*அதன்
  முழுப் பலத்திற்கு*: the engine tests Adhi at full strength, not a Raja Yoga),
  Bhagya support (no "/"), Budha-Aditya (colon, not a dash),
  `raja_grade_mixed_kendradhipati`, the lagna-lord strength line, and full stops.
- The four deliberate deviations listed further below were confirmed by the
  reviewer. The sunset ribbon's bare அஸ்தமனம் was accepted.

**Second review received 2026-10-05: "approve with corrections".** Passed on by
the owner and signed by its author as "ChatGPT — GPT-5.6 Sol, OpenAI": an AI
review, which says itself it is not this packet's human signature. It confirmed
the 3 October corrections and the terminology policy (கோச்சாரம், அஸ்தங்கம்,
அஸ்தமனம் for sunset, *கவனம் தேவை* rather than a verdict). Applied:

- A graha takes no honorific anywhere in the reading: the headline and the
  Lagna-lord line say *அமைந்துள்ளது*, not உள்ளார் (web, mobile, backend).
- ஆடை, not வஸ்திரம், in every remedy (Gaja Kesari and Neecha Bhanga Raja Yoga
  were the last two).
- The நீசபங்கம் card's explanation: *ஒரு கிரகம் நீச நிலையில் இருந்தாலும், அந்த
  நீச நிலையைத் தணிக்கும் ஒரு நீசபங்க நிபந்தனை நிறைவேறியுள்ளது. இதை மட்டும் வைத்து
  நீசபங்க ராஜயோகம் என்று கூற முடியாது.*
- `raja_grade_qualified`: *தொடர்பில் உள்ள கிரகங்களில் ஒன்று 2, 3, 11 அல்லது
  12-ஆம் வீட்டிற்கும் அதிபதியாக உள்ளது — அதனால் இது நிபந்தனையுடனான ராஜயோகம்.*
  `raja_grade_mixed` takes the same construction by analogy (not itself
  reviewed): *…6 அல்லது 8-ஆம் வீட்டிற்கும் அதிபதியாக உள்ளது — அதனால் பலன்
  கலப்பாகிறது.*
- The 8th-support line says "8-ஆம்" once: *8-ஆம் வீட்டிற்கு ஆதரவு உள்ளது: அதன்
  அதிபதி வலுவாக உள்ளது அல்லது சுப கிரக ஆதரவு கிடைக்கிறது — இதனால் தாக்கம்
  குறைகிறது.* (The review quoted the pre-3-October text; the 3 October ending
  is kept.)

Still open after that review: about 40 older strings elsewhere in the app give
a graha the -ார் verb (Bhava Palan, marriage, career, the yoga condition
markers). Bhava Palan's *ஆதரவாக உள்ளார்* was itself a reviewed choice, so the
sweep waits for a human reader. The Neecha Bhanga Raja Yoga card's own
description still says *நிவர்த்தி நிபந்தனைகள்* (plural; not raised).

The wording as applied before the review:

- Combustion is அஸ்தங்கம் on every yoga surface; சூரிய அஸ்தமனம் for sunset only.
- Budha-Aditya with a combust Budhan: short *புதன் அஸ்தங்கம்*; expanded
  *புதன் சூரியனுக்கு மிக அருகில் இருப்பதால், தனது இயல்பான பலத்தை முழுமையாக
  வெளிப்படுத்த முடியாத நிலையில் உள்ளது.*
- `NEECHA_NIVARTHI` (one condition): **நீசபங்கம்**; expanded *{{கிரகம்}} நீச நிலையில்
  இருந்தாலும், அதன் நீச நிலையைத் தணிக்கும் ஒரு நிவர்த்தி நிபந்தனை உள்ளது. இதை
  மட்டும் வைத்து நீசபங்க ராஜயோகம் என்று கூற முடியாது.*
- `nb_self_reference`: *புதனின் உச்சராசியான கன்னிக்கும் புதனே அதிபதி. தேவையான
  கேந்திர நிலையில் புதன் இருப்பதால், இந்த நீசபங்க நிபந்தனை நிறைவேறுகிறது.*
- `raja_grade_mixed_kendradhipati`: the generic sentence, ending *…முழுப்
  பலமுள்ள ராஜயோகமாக அல்லாமல் கலப்பு நிலையில் மதிப்பிடப்படுகிறது.*
- `raja_pair_source_vetoed_<a>_<b>`: *{{A}}–{{B}} தொடர்பு அமைந்துள்ளது. இருப்பினும்,
  ஏற்றுக்கொள்ளப்பட்ட மூலநூல் விதிப்படி இந்த இணைவு ராஜயோகமாகக் கொள்ளப்படவில்லை.*
- `ADHI_RAJA_GRADE`: **அதி யோகம் — முழுப் பலம் உறுதியாகவில்லை** (was ராஜ நிலைக்கு
  வாய்ப்புள்ள அதி யோக அமைப்பு).
- `strong_eighth_lord_or_benefic_on_eighth`: 8-ஆம் வீடு ஆதரவு பெறுகிறது: 8-ஆம்
  அதிபதி வலுவாக உள்ளது அல்லது 8-ஆம் வீட்டிற்கு சுப கிரக ஆதரவு கிடைக்கிறது. The
  backend copy still said a benefic *afflicts* the 8th; corrected in v1.8.
- Gaja Kesari: கஜகேசரி அமைப்பு for the base geometry, with the expanded text
  saying further conditions are needed; கஜகேசரி யோகம் only for the strict rule.
- `BHAGYA_SUPPORT`: பாக்கிய ஆதரவு, never described as a lesser Lakshmi Yoga.
- O-2 / O-11 / O-17 markers (`node_in_favourable_sign_lineage`,
  `RETROGRADE_DEBILITATED_RAJA_YOGA` → வக்கிர நீச கிரக ராஜயோகம்,
  `debilitated_planet_retrograde`, `bright_rays_engine_non_combust`,
  `debilitated_planet_outside_dusthana`, `ninth_lord_not_in_lakshmi_kendra`,
  `lagna_lord_below_baladhya_threshold`): the supplied expanded text. The O-11
  markers render only if that detector is switched on.

Deliberate deviations from the supplied text, for the reviewer to accept or
correct: லக்ஷ்மி rather than லட்சுமி, to match the yoga card's name; the O-2
marker drops "Vinaadi-யில்"; the retrograde marker drops "தற்போது" (a natal
retrograde is a birth fact); `{{கிரகம்}}` reads கிரகம் on markers that carry no
planet.

ADHI_RAJA_GRADE (O-25 ruling, 2026-10-05): it stays in the Astrologer view
under the new wording, and never enters the consumer Top-3 yoga lists until
its Saravali source is verified in print (section C).

- [ ] Meaning is correct in astrological Tamil.
- [ ] Register is natural and respectful.
- [ ] The short label and expanded explanation agree.
- [ ] No English-only engine key leaks into rendered copy.

Native reviewer name: ___________________________
Dialect/register notes: _________________________
Signature: ______________________________________  Date: _______________
"""


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="fail when the generated file is stale")
    args = parser.parse_args()
    content = render()
    if args.check:
        if not OUTPUT.exists() or OUTPUT.read_text(encoding="utf-8") != content:
            raise SystemExit(f"stale generated file: {OUTPUT.relative_to(ROOT)}")
        return 0
    OUTPUT.write_text(content, encoding="utf-8", newline="\n")
    print(f"wrote {OUTPUT.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
