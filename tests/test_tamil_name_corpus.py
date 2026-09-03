"""Coverage and sanity checks for the draft Tamil baby-name corpus (NUM-52).

This corpus and the pada canon it is matched against
(`app.data.nakshatra_pada_akshara`) are both draft/unverified — see both
modules' docstrings. These tests do not assert the corpus is *correct*
(nobody has reviewed it); they assert it is *usable for pipeline development*:
every nakshatra can produce at least one CONFIRMED match, and the data itself
is well-formed.
"""
from __future__ import annotations

import pytest

from app.calculations.numerology_naming import MatchConfidence, evaluate_candidate
from app.data.nakshatra_pada_akshara import PADA_AKSHARA_TABLE
from app.data.tamil_name_corpus import TAMIL_NAME_CORPUS

pytestmark = pytest.mark.no_db


def test_corpus_entries_are_well_formed() -> None:
    assert len(TAMIL_NAME_CORPUS) > 0
    for candidate in TAMIL_NAME_CORPUS:
        assert candidate.tamil_form.strip()
        assert candidate.latin_variants
        assert all(variant.strip() for variant in candidate.latin_variants)
        assert candidate.gender in ("m", "f", "n", None)


def test_corpus_has_no_exact_duplicate_entries() -> None:
    keys = [(c.tamil_form, c.latin_variants) for c in TAMIL_NAME_CORPUS]
    assert len(keys) == len(set(keys))


def _confirmed_nakshatras() -> set[int]:
    """Every nakshatra reachable via at least one CONFIRMED candidate on some pada.

    Mirrors what `find_names` would find on the strict (no relaxation) rung,
    but scans all 108 rows directly rather than one (nakshatra, pada) at a
    time — cheaper, and the thing this test cares about is nakshatra-level
    coverage, not which specific pada got there.
    """
    hit: set[int] = set()
    for row in PADA_AKSHARA_TABLE:
        if row.nakshatra_id in hit:
            continue
        for candidate in TAMIL_NAME_CORPUS:
            scored = evaluate_candidate(candidate, row)
            if scored.confidence is MatchConfidence.CONFIRMED:
                hit.add(row.nakshatra_id)
                break
    return hit


def test_every_nakshatra_has_a_confirmed_candidate() -> None:
    """The literal bar this corpus draft must clear: all 27 nakshatras, not all 108 padas.

    Measured, not guessed — if this fails, the fix is adding a targeted name
    for the missing nakshatra's padas, not loosening this assertion.
    """
    confirmed = _confirmed_nakshatras()
    missing = set(range(1, 28)) - confirmed
    assert not missing, f"No CONFIRMED candidate for nakshatra(s): {sorted(missing)}"


def _confirmed_counts_by_pada() -> dict[tuple[int, int], int]:
    counts: dict[tuple[int, int], int] = {}
    for row in PADA_AKSHARA_TABLE:
        counts[row.key] = sum(
            1
            for candidate in TAMIL_NAME_CORPUS
            if evaluate_candidate(candidate, row).confidence is MatchConfidence.CONFIRMED
        )
    return counts


def test_pada_level_confirmed_coverage_is_measured() -> None:
    """Records actual pada-level coverage so a future edit can see it move.

    Not a promise of 108/108 — the corpus docstring names padas with no
    confirmed candidate by construction (Tamil phonotactics forbid some
    openings outright) or by this pass simply not finding one yet.
    """
    covered = sum(1 for n in _confirmed_counts_by_pada().values() if n)
    # Floor, not a target: fails loudly if a future edit regresses coverage,
    # without pinning to today's exact count. Was 80 against the 96-name draft;
    # raised with the 2026-07-31 expansion so that pass cannot silently rot.
    assert covered >= 98, f"Pada-level CONFIRMED coverage dropped to {covered}/108"


def test_most_padas_offer_more_than_a_single_name() -> None:
    """Depth, not just reach — the thing the first corpus pass got wrong.

    Reach (at least one CONFIRMED name per *nakshatra*) was already met by the
    96-name draft, yet 69 of the 108 padas returned exactly one name. A parent
    sees only their own pada, and a one-name answer reads as a broken tool
    rather than a shortlist. This is the assertion that keeps that from
    regressing unnoticed.
    """
    counts = _confirmed_counts_by_pada()
    at_least_two = sum(1 for n in counts.values() if n >= 2)
    assert at_least_two >= 75, (
        f"Only {at_least_two}/108 padas offer two or more names; "
        "the corpus has thinned back out to a one-name list."
    )
