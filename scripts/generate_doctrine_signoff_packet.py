"""Generate the practitioner packet for the unfrozen yoga/dosham doctrine.

The packet is generated from the live functional-status matrix so a reviewer
never signs a hand-copied table. Use ``--check`` in CI or before committing.
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
    SEVEN_SIGN_LORDS,
    FunctionalStatus,
    owned_houses,
    raja_participation,
)

_LORDSHIP_ONLY = DoctrineOptions(o23_six_eight_colord_mode="lordship_only")


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
    FunctionalStatus.KENDRA_NEUTRAL: "KN",
    FunctionalStatus.TRISHADAYA_MALEFIC: "TM",
    FunctionalStatus.CONTEXTUAL_2ND: "C2",
    FunctionalStatus.CONTEXTUAL_12TH: "C12",
    FunctionalStatus.EIGHTH_SPECIAL_CASE: "E8",
    FunctionalStatus.MARAKA: "MK",
}


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
                rows.append([f"{RASI_NAMES[lagna]} ({lagna})", planet, houses, labels])
    return rows


def raja_cell(lagna: int, planet: str) -> str:
    """What Raja Yoga actually reads for this lord: its side(s) and eligibility."""
    part = raja_participation(lagna, planet, DEFAULT_DOCTRINE)
    sides = "+".join(side for side, on in (("K", part.kendra_lord), ("T", part.trikona_lord)) if on)
    if not sides:
        return "—"
    if part.eligible:
        return sides
    return f"**{sides} excluded**<br><sub>{part.basis}</sub>"


def excluded_rows() -> list[list[str]]:
    rows: list[list[str]] = []
    for lagna in ALL_LAGNAS:
        for planet in SEVEN_SIGN_LORDS:
            default = raja_participation(lagna, planet, DEFAULT_DOCTRINE)
            if (default.kendra_lord or default.trikona_lord) and not default.eligible:
                alt = raja_participation(lagna, planet, _LORDSHIP_ONLY)
                houses = ", ".join(str(h) for h in sorted(owned_houses(lagna, planet)))
                rows.append([
                    f"{RASI_NAMES[lagna]} ({lagna})", planet, houses,
                    default.basis, "eligible" if alt.eligible else "excluded",
                ])
    return rows


def markdown_table(headers: list[str], rows: list[list[str]]) -> str:
    header = "| " + " | ".join(headers) + " |"
    separator = "|" + "|".join("---" for _ in headers) + "|"
    body = ["| " + " | ".join(row) + " |" for row in rows]
    return "\n".join([header, separator, *body])


def render() -> str:
    digest = hashlib.sha256(canonical_matrix().encode("utf-8")).hexdigest()
    matrix_rows = [
        [f"{RASI_NAMES[lagna]} ({lagna})"]
        + [matrix_cell(lagna, planet) for planet in SEVEN_SIGN_LORDS]
        for lagna in ALL_LAGNAS
    ]
    row_checks = "\n".join(f"- [ ] {RASI_NAMES[lagna]} row: all seven cells reviewed" for lagna in ALL_LAGNAS)
    c12_table = markdown_table(
        ["Lagna", "Graha", "Owned houses", "Full status set"],
        focus_rows(FunctionalStatus.CONTEXTUAL_12TH),
    )
    e8_table = markdown_table(
        ["Lagna", "Graha", "Owned houses", "Full status set"],
        focus_rows(FunctionalStatus.EIGHTH_SPECIAL_CASE),
    )
    matrix_table = markdown_table(["Lagna", *SEVEN_SIGN_LORDS], matrix_rows)
    raja_table = markdown_table(
        ["Lagna", *SEVEN_SIGN_LORDS],
        [
            [f"{RASI_NAMES[lagna]} ({lagna})"] + [raja_cell(lagna, planet) for planet in SEVEN_SIGN_LORDS]
            for lagna in ALL_LAGNAS
        ],
    )
    excluded_table = markdown_table(
        ["Lagna", "Graha", "Owned houses", "Default basis (2026-09-23 ruling)", "Under O-23 `lordship_only`"],
        excluded_rows(),
    )
    signed_state = "SIGNED" if MATRIX_SIGNED_OFF else "UNSIGNED"
    return f"""# Vinaadi doctrine practitioner sign-off packet

**Doctrine record:** `docs/DOCTRINE_DECISIONS_V1.2.md` v1.6
**Generated from:** `app/calculations/functional_status.py`  
**Engine state at generation:** `{signed_state}` (`MATRIX_SIGNED_OFF = {MATRIX_SIGNED_OFF}`)  
**84-cell SHA-256:** `{digest}`

This packet gathers the decisions that cannot be completed by code review. It
does not turn an unchecked source into a verified citation, and generation does
not constitute a signature. Sign only after comparing the table and cited
verses with the editions named below.

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
| KN | Kendra-neutral lord (owns 4, 7 or 10) |
| TM | Trishadaya malefic (owns 3, 6 or 11) |
| C2 | Contextual 2nd lord |
| C12 | Contextual 12th lord |
| E8 | 8th-lord special case |
| MK | Maraka lord (2nd or 7th; timing context only) |

### Required row review

{row_checks}

### Required focus review: every 12th-lord cell

{c12_table}

### Required focus review: every 8th-lord cell

{e8_table}

Question for this table: Laghu Parashari is commonly read as exempting the Sun
and the Moon from the 8th-lordship blemish. If that is your reading, the E8
status on Dhanusu-Moon and Magaram-Sun should be corrected — note it under
"approve with corrections".

- [ ] E8 stands for Dhanusu-Moon and Magaram-Sun.
- [ ] Remove E8 for the Sun/Moon cells (cite the verse): ____________________

### Node rule, reviewed separately from lordship

- [ ] Confirm Rahu/Ketu never receive a lordship status from this matrix.
- [ ] Confirm their functional context is read through sign dispositor,
  conjunctions and aspects (`node_functional_context`).
- [ ] Confirm the node rule applies to both Rahu and Ketu.

### O-9 attestation

- [ ] I reviewed all 84 cells, including the complete status set in each cell.
- [ ] I reviewed every C12 and E8 focus row above.
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
- 6th or 8th co-lord: takes part only if its moolatrikona sign is the kendra or
  trikona it owns (ruling 2026-09-23). Open item **O-23**.

{raja_table}

These lords own a kendra or trikona and are nonetheless shut out of every Raja
Yoga by the 2026-09-23 test:

{excluded_table}

- [ ] Keep the 2026-09-23 moolatrikona test (default).
- [ ] Use `lordship_only`: these lords take part, and the 6th/8th co-lordship
  shows only as the Tier C `MIXED` grade.

## B. Implemented doctrine choices awaiting a ruling

The mechanisms below exist in code; the current default is shown. Selecting an
alternative requires a practitioner ruling and a dated update to the doctrine
record — then a code default change, not a runtime flag.

### O-2: Rahu/Ketu favourable-sign lineage

Current default: `disabled`.

- [ ] Keep disabled.
- [ ] Enable an explicit lineage and sign list.

Required if enabled:  
Lineage/source: __________________________________  
Rahu favourable rasis (1-12): ____________________  
Ketu favourable rasis (1-12): ____________________

The engine refuses `explicit_signs` without a non-empty source and at least one
valid rasi. No sign list is inferred by Vinaadi.

### O-11: retrograde debilitated-planet Raja Yoga

Current default: `off`.

- [ ] Keep off.
- [ ] Adopt as a separate rule.
- [ ] Adopt only after changing the engine proxy for "bright rays".

The dormant implementation requires: debilitated, retrograde, outside houses
6/8/12, and non-combust. Non-combust is an explicit provisional proxy for
"bright rays", not a claim that the Sanskrit terms are identical.

Ruling / replacement proxy: ________________________________________________

### O-17: dignified but incomplete Lakshmi cases

Current default: `literal` (unlabelled).

- [ ] Keep `literal`.
- [ ] Use `all_incomplete_lakshmi` and emit `BHAGYA_SUPPORT` when the 9th lord
  is dignified but either not in a kendra or the lagna lord is below the
  baladhya threshold.

### O-18: Mesham/Viruchigam Sevvai exception

Current default: `full_cancellation` (preserves shipped behavior).

- [ ] Keep `full_cancellation`.
- [ ] Use `strong_mitigation`, matching DD-06's posture: one mitigation point
  and one grade of softening; other independent mitigations can still combine
  to produce nivarthi.

### O-21: Budhan as its own exaltation-sign lord (neecha bhanga)

Budhan is debilitated in Meenam and rules Kanni, its own exaltation sign. Read
literally, NB-b ("the exaltation-sign lord in a kendra"), NB-c and NB-g then
test the debilitated Budhan's own position — which is NB-e, the rule DD-09
deleted as absent from Phaladeepika 7.26–30.

Current default: self-reference skipped (DD-09 governs).

- [ ] Keep skipped.
- [ ] Read literally: a debilitated Budhan in a kendra cancels its own debility.

### O-22: the Moon as strict Gaja Kesari's supporting benefic

DD-01 requires Guru "joined or aspected by a benefic". A waxing Moon opposite or
beside Guru is such a benefic — but the Moon is one of the yoga's two grahas.

Current default: the Moon counts (literal DD-01 / DD-12).

- [ ] The Moon counts.
- [ ] Require a benefic other than the Moon.

### O-23: 6th/8th co-lords in Raja Yoga

See section A2 for the four lords this decides.

- [ ] Keep the 2026-09-23 moolatrikona test.
- [ ] `lordship_only`.

Practitioner name: ______________________________
Signature: ______________________________________  Date: _______________

## B2. Calibration (Tier C — frequency, not doctrine)

From `docs/DOCTRINE_V13_FREQUENCY_REPORT_2026-10-01.md` (3,000 ephemeris
charts). These are engine thresholds, not textual rules, and are reported so
they can be ruled on rather than tuned silently in code:

- Raja Yoga forms on about four charts in five (80.4%; 86.8% under O-23's
  `lordship_only`).
- Neecha Bhanga Raja Yoga forms on 95% of charts that carry a debilitated
  graha ("any one condition", DD-09); 15% of all charts read Strong.
- `BHAGYA_SUPPORT` appears on about a third of charts (36.5%); the Adhi base
  pattern on 38%.
- DD-06 moved Sevvai cancellation by under one point: the Kadagam/Simmam
  mitigation plus any one other common mitigation still reaches nivarthi
  (cancellation needs two mitigation points).

- [ ] Accept these frequencies for consumer display as graded.
- [ ] Rule on a threshold change (attach): ____________________________

## C. Section 18 physical-edition verification ledger

Do not check a row from an online transcription alone. Record edition,
translator/editor, publication year, page and the person who inspected it.

| Source claim | Physical edition / page | Verified by / date | Result |
|---|---|---|---|
| BPHS 36.3-4 |  |  | [ ] match [ ] correction |
| BPHS 36.27-28 |  |  | [ ] match [ ] correction |
| BPHS 34.11-15 |  |  | [ ] match [ ] correction |
| BPHS 3.11 |  |  | [ ] match [ ] correction |
| Phaladeepika 6.21 |  |  | [ ] match [ ] correction |
| Phaladeepika 7.26-30 map (online map exists; physical check open) |  |  | [ ] match [ ] correction |
| Phaladeepika Ch. 7 retrograde/debilitated verse (O-11) |  |  | [ ] match [ ] correction |
| Saravali Adhi raja-grade condition |  |  | [ ] match [ ] correction |
| Brihat Jataka 13.2 |  |  | [ ] match [ ] correction |
| Srutakeerti commentary on BJ 13.2 |  |  | [ ] match [ ] correction |
| Raman, 300 Combinations: Yogas 1, 7 and 27 |  |  | [ ] match [ ] correction |
| Laghu Parashari functional-lordship verses |  |  | [ ] match [ ] correction |
| Printed Tamil source: Rahu/Ketu and gender-weighted Sevvai lists |  |  | [ ] match [ ] correction |

Verifier attestation: I inspected the physical editions recorded above and did
not rely only on a web transcription.  
Name: __________________  Signature: __________________  Date: __________

## D. Native Tamil copy review

Review in context, not as isolated dictionary translations. At minimum inspect
the consumer labels/descriptions for these newly added keys and the complete
pending list in `docs/ASTROLOGER_REVIEW_QUEUE.md`:

- `node_in_favourable_sign_lineage` (O-2)
- `RETROGRADE_DEBILITATED_RAJA_YOGA`, `debilitated_planet_retrograde`,
  `bright_rays_engine_non_combust`, `debilitated_planet_outside_dusthana` (O-11)
- `ninth_lord_not_in_lakshmi_kendra`,
  `lagna_lord_below_baladhya_threshold`, dignified `BHAGYA_SUPPORT` copy (O-17)
- DD-01 / DD-08 labels and every earlier unreviewed item named in the queue
- Combustion is written அஸ்தங்கம் across the yoga cards and அஸ்தமனம் in
  Budha-Aditya and the panchangam. Choose one for the yoga surface.
- Corrected 2026-10-02 and still unread: `strong_eighth_lord_or_benefic_on_eighth`
  (a benefic was said to *afflict* the 8th), `ADHI_RAJA_GRADE` (Tamil now says
  "பரிசீலனையில்", as English says "candidate"), `bright_rays_engine_non_combust`,
  the Gaja Kesari base copy ("அமைப்பு", not "யோகம்")

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
