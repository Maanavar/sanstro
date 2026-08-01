"""Emit the NU-8a pada-akshara verification sheet for astrologer sign-off.

Why a generator and not a hand-written document
-----------------------------------------------
The sheet's whole purpose is to be worked through row by row, flipping
``verified=True`` in ``app/data/nakshatra_pada_akshara.py`` as each is confirmed.
A hand-maintained markdown copy would drift from the table within one sitting,
and a verification sheet that disagrees with the data it certifies is worse than
none. Re-run this after every batch::

    $env:PYTHONUTF8 = "1"
    python scripts/generate_pada_verification_sheet.py

The progress counts, the per-row status marks and the "remaining" list are all
read off the table itself, so the document cannot claim a row is verified when
it is not.

What the reviewer is actually being asked
-----------------------------------------
Not "is this table right" — that question cannot be answered in one pass over
108 rows. Each row asks one narrow question: *for this nakshatra and this pada,
is this the akshara a name should begin with?* Answer per row, name the source,
move on. Where the source disagrees with the draft, the source wins.

The two traps this sheet is laid out to prevent
-----------------------------------------------
1. **The lookalike rows are real distinctions, not duplicates.** Purva Ashadha
   P2 (धा dhā) and P4 (ढा ḍhā) both romanise to "Dha" and sit in the same
   nakshatra. They look like a copy-paste error and they are not. Every such
   group is flagged inline so a reviewer does not "correct" one into the other.
2. **Tamil script alone cannot confirm 59 of the 108 rows.** Where
   ``tamil_collapse`` is true the Tamil letter is shared by several Sanskrit
   consonants (க covers ka/kha/ga/gha), so Tamil evidence can rule a row out but
   never in. Those rows carry a marker saying which script the confirmation has
   to come from.
"""
from __future__ import annotations

import sys
from collections import defaultdict
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from app.data.nakshatra_pada_akshara import (  # noqa: E402
    CANON_VERSION,
    PADA_AKSHARA_TABLE,
    verified_row_count,
)

OUTPUT = REPO_ROOT / "docs" / "PADA_AKSHARA_VERIFICATION_SHEET.md"


def _collision_groups() -> dict[str, list[str]]:
    """Bare-Latin strings shared by more than one pada, as "N-P" labels.

    Recomputed here rather than hardcoded from the module docstring's measured
    14: if a row's Latin string is edited during verification the collision set
    moves, and a stale warning is a warning pointing at the wrong rows.
    """
    by_latin: dict[str, list[str]] = defaultdict(list)
    for row in PADA_AKSHARA_TABLE:
        by_latin[row.akshara_latin_bare].append(f"{row.nakshatra_id}-P{row.pada}")
    return {latin: labels for latin, labels in by_latin.items() if len(labels) > 1}


def _escape(text: str) -> str:
    """Markdown table cells cannot carry a raw pipe."""
    return text.replace("|", "\\|")


def build_sheet() -> str:
    total = len(PADA_AKSHARA_TABLE)
    verified = verified_row_count()
    collisions = _collision_groups()
    collapse_rows = [r for r in PADA_AKSHARA_TABLE if r.tamil_collapse]

    lines: list[str] = []
    add = lines.append

    add("# Pada-Akshara Verification Sheet (NU-8a)")
    add("")
    add("> **Generated file — do not hand-edit.**")
    add("> Regenerate with `python scripts/generate_pada_verification_sheet.py`")
    add("> after flipping rows in `app/data/nakshatra_pada_akshara.py`.")
    add("")
    add(f"- **Canon version:** `{CANON_VERSION}`")
    add(f"- **Verified:** {verified} / {total} rows")
    add("")

    if verified == 0:
        add(
            "Nothing is verified yet, so nothing renders: "
            "`numerology_naming.assert_canon_usable()` raises `UnverifiedCanonError` "
            "outside development, and `NamingResult.usable` is `False` while any row "
            "in a result is draft. **Baby-name suggestion is blocked on this sheet "
            "and on nothing else.**"
        )
    elif verified < total:
        add(
            f"{total - verified} rows still draft. A naming result is `usable` only "
            "when every row it touched is verified, so partial progress unblocks "
            "partial coverage — the nakshatras finished below are live, the rest "
            "are not."
        )
    else:
        add(
            "All rows verified. Flip `CANON_VERSION` off `-draft` in "
            "`app/data/nakshatra_pada_akshara.py` to promote the table to canon."
        )
    add("")

    # ── Protocol ────────────────────────────────────────────────────────────
    add("## How to fill this in")
    add("")
    add("For each row, one question: **for this nakshatra and this pada, is this the")
    add("akshara a name should begin with?**")
    add("")
    add("1. Check against **one named printed source**. Prefer a Tamil")
    add("   panchangam or jataka text in current use over any online table.")
    add("2. Where the source disagrees with the draft, **the source wins** — write")
    add("   the source's akshara in the `Correct?` column.")
    add("3. Record the source in `app/data/nakshatra_pada_akshara.py` on that row:")
    add("   `source_ref`, `verified_by`, `verified_on`, then `verified=True`.")
    add("4. Re-run the generator so this sheet's counts follow.")
    add("")
    add("Leave a row alone rather than guessing it. A row marked verified on a")
    add("recollection is worse than a row still marked draft, because the guard")
    add("stops protecting it.")
    add("")

    # ── Trap 1: collisions ──────────────────────────────────────────────────
    add("## Before you start: rows that look like duplicates and are not")
    add("")
    add(
        f"{len(collisions)} bare-Latin strings are each carried by more than one pada. "
        "These are genuine distinctions the Latin spelling cannot show — mostly "
        "retroflex-vs-dental pairs (`ṭa`/`ta`, `ḍa`/`da`, `ṇa`/`na`). **Do not "
        "reconcile them into one another.** Read the Devanagari column, which is "
        "the identity key; the Latin column is display only."
    )
    add("")
    add("| Latin | Padas sharing it |")
    add("| --- | --- |")
    for latin in sorted(collisions):
        add(f"| {_escape(latin)} | {', '.join(collisions[latin])} |")
    add("")

    # ── Trap 2: Tamil collapse ──────────────────────────────────────────────
    add("## Before you start: where Tamil script cannot settle the question")
    add("")
    add(
        f"**{len(collapse_rows)} of {total} rows** ({round(100 * len(collapse_rows) / total)}%) "
        "are marked `TA?` below. On those the Tamil letter is shared by several "
        "Sanskrit consonants — க covers *ka / kha / ga / gha*, ட covers "
        "*ṭa / ṭha / ḍa / ḍha*, and so on — so a Tamil-script source can rule the "
        "row out but cannot confirm it. Those rows need a source that carries "
        "Devanagari or a diacritic-bearing transliteration."
    )
    add("")
    add(
        "This is the open practitioner question the draft left, and it is why it "
        "is a blocker rather than an edge case: it governs the majority of the "
        "table, spanning 21 of the 27 nakshatras."
    )
    add("")

    # ── The table ───────────────────────────────────────────────────────────
    add("## The 108 rows")
    add("")
    add("Legend — `TA?` the Tamil letter alone cannot confirm this row · ")
    add("`DUP` the Latin string is shared with another pada (see above) · ")
    add("`OK` verified · `—` still draft.")
    add("")

    current_nakshatra: int | None = None
    for row in PADA_AKSHARA_TABLE:
        if row.nakshatra_id != current_nakshatra:
            current_nakshatra = row.nakshatra_id
            add("")
            # Almanac name leads (that is what the reviewing astrologer calls
            # the star); the Sanskrit form trails so a row can still be checked
            # against a Sanskrit printed source.
            add(
                f"### {row.nakshatra_id}. {row.nakshatra_ta} · {row.nakshatra_en} "
                f"_(Skt. {row.nakshatra_sanskrit})_"
            )
            add("")
            add("| Pada | Devanagari | ISO | Latin | Tamil | Flags | Status | Correct? | Source |")
            add("| --- | --- | --- | --- | --- | --- | --- | --- | --- |")

        flags: list[str] = []
        if row.tamil_collapse:
            flags.append("`TA?`")
        if row.akshara_latin_bare in collisions:
            flags.append("`DUP`")

        status = "`OK`" if row.verified else "—"
        source = _escape(row.source_ref) if row.verified and row.source_ref else ""

        add(
            f"| P{row.pada} "
            f"| {_escape(row.akshara_devanagari)} "
            f"| {_escape(row.akshara_iso)} "
            f"| {_escape(row.akshara_latin_bare)} "
            f"| {_escape(row.akshara_tamil)} "
            f"| {' '.join(flags)} "
            f"| {status} "
            # Left blank on purpose — the reviewer writes the source's akshara
            # here when it differs from the draft. Never pre-filled with the
            # draft value: a column that already agrees with the row above it
            # invites a tick rather than a check.
            f"|  "
            f"| {source} |"
        )

    add("")
    add("---")
    add("")
    add(
        "Related: `docs/NUMEROLOGY_IMPLEMENTATION_PLAN_2026-07-25.md` (NU-8a), "
        "`app/calculations/numerology_naming.py` (the guard this sheet releases), "
        "`tests/test_numerology_naming.py` (the collision counts asserted as tests)."
    )
    add("")
    return "\n".join(lines)


def main() -> int:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    # UTF-8 without BOM, LF endings — the file carries Devanagari and Tamil and
    # is read by tooling that does not expect a BOM.
    OUTPUT.write_text(build_sheet(), encoding="utf-8", newline="\n")
    print(f"wrote {OUTPUT.relative_to(REPO_ROOT)}")
    print(f"{verified_row_count()} / {len(PADA_AKSHARA_TABLE)} rows verified")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
