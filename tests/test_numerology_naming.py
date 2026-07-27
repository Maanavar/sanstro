"""Name Lab / pada-akshara tests (NU-8a).

Two groups:

* **Integrity** — run over the whole 108-row table. These lock in the collision
  findings that motivated the schema (Devanagari as identity key, joint
  two-script matching). If someone "cleans up" the apparent duplicate at
  Purva Ashadha P2/P4, or re-keys the table on bare Latin, these fail.

* **Pipeline** — exercised against TIER-A rows only, per the NU-8a protocol.
  Tier B/C rows are the ones published sources disagree about; asserting
  behaviour on them would bake a guess into the regression suite.

No test here treats an akshara value as *expected output* — the table is draft
canon. They assert structure, guards and matching mechanics only.
"""
from __future__ import annotations

import pytest

from app.calculations.numerology_naming import (
    _CONFIDENCE_RANK,
    LATIN_BARE_INDEX,
    TAMIL_INDEX,
    MatchConfidence,
    NameCandidate,
    NamingConstraints,
    NamingMode,
    Relaxation,
    UnverifiedCanonError,
    assert_canon_usable,
    evaluate_candidate,
    find_names,
    padas_for_name,
)
from app.data.nakshatra_pada_akshara import (
    PADA_AKSHARA_ALTERNATES,
    PADA_AKSHARA_BY_KEY,
    PADA_AKSHARA_TABLE,
    TAMIL_SHARED_BASES,
    cross_checked_row_count,
    is_production_ready,
    verified_row_count,
)

#: Pure table/matching tests — no DB, no ephemeris, no clock.
pytestmark = pytest.mark.no_db

#: Nakshatras the NU-8a draft marks tier A. Pipeline tests stay inside this set.
TIER_A_NAKSHATRAS = frozenset({1, 2, 3, 4, 5, 7, 9, 10, 11, 12, 14, 16, 17, 18, 24, 27})


def cand(tamil: str, *latin: str, gender: str | None = None) -> NameCandidate:
    return NameCandidate(tamil_form=tamil, latin_variants=latin, gender=gender)


# ---------------------------------------------------------------------------
# Integrity
# ---------------------------------------------------------------------------
def test_table_is_27_nakshatras_by_4_padas() -> None:
    assert len(PADA_AKSHARA_TABLE) == 108
    assert len({r.nakshatra_id for r in PADA_AKSHARA_TABLE}) == 27
    assert len(PADA_AKSHARA_BY_KEY) == 108
    for nak in range(1, 28):
        assert {PADA_AKSHARA_BY_KEY[(nak, p)].pada for p in range(1, 5)} == {1, 2, 3, 4}


def test_every_row_is_unverified_draft_canon() -> None:
    """The fixture must never ship pre-marked as verified."""
    assert verified_row_count() == 0
    assert is_production_ready() is False
    for row in PADA_AKSHARA_TABLE:
        assert row.verified is False
        assert row.verified_by is None
        assert row.verified_on is None
        assert row.source_ref is None


def test_bare_latin_is_a_lossy_key() -> None:
    """108 rows collapse to 94 distinct bare-Latin strings.

    This is *why* the schema keys on Devanagari. If this count moves, the
    two-script matching logic needs revisiting, not the assertion.
    """
    distinct = {r.akshara_latin_bare for r in PADA_AKSHARA_TABLE}
    assert len(distinct) == 94
    collisions = {k: v for k, v in LATIN_BARE_INDEX.items() if len(v) > 1}
    assert len(collisions) == 14


def test_purva_ashadha_p2_and_p4_are_distinct_aksharas() -> None:
    """Both romanise to 'Dha' but are different letters. Not a duplicate row.

    A cleanup pass that de-duplicates on bare Latin would silently destroy this.
    """
    p2 = PADA_AKSHARA_BY_KEY[(20, 2)]
    p4 = PADA_AKSHARA_BY_KEY[(20, 4)]
    assert p2.akshara_latin_bare == p4.akshara_latin_bare == "Dha"
    assert p2.akshara_devanagari != p4.akshara_devanagari
    assert p2.akshara_iso != p4.akshara_iso
    assert p2.akshara_tamil != p4.akshara_tamil


def test_tamil_is_also_a_lossy_key_in_the_other_direction() -> None:
    """Tamil is MORE lossy than bare Latin, not less — 80 distinct vs 94.

    Latin loses place of articulation (ṭa/ta, ḍa/da, ṇa/na); Tamil loses voicing
    and aspiration (ka/kha/ga/gha all -> கா). The two are lossy in orthogonal
    directions, which is the whole basis of the two-script model. Neither is the
    "better" script.
    """
    distinct = {r.akshara_tamil for r in PADA_AKSHARA_TABLE}
    assert len(distinct) == 80
    collisions = {k: v for k, v in TAMIL_INDEX.items() if len(v) > 1}
    assert len(collisions) == 21
    # Worst case: four different Sanskrit aksharas share டா.
    assert set(TAMIL_INDEX["டா"]) == {(8, 4), (11, 2), (13, 4), (20, 4)}


def test_tamil_resolves_thirteen_of_the_fourteen_latin_collisions() -> None:
    """Bare Latin merges 11-P3 ṭī with 16-P1 tī; Tamil keeps டீ vs தீ."""
    resolved = 0
    for keys in LATIN_BARE_INDEX.values():
        if len(keys) < 2:
            continue
        rows = [PADA_AKSHARA_BY_KEY[k] for k in keys]
        if len({r.akshara_tamil for r in rows}) == len(rows):
            resolved += 1
    assert resolved == 13


def test_joint_two_script_key_is_as_discriminating_as_devanagari() -> None:
    """The core property the matcher depends on.

    Devanagari (ground truth) separates 107 of 108 rows. The (Latin, Tamil) pair
    separates exactly the same 107 — so the two-script key is a lossless proxy
    for the akshara identity, even though each script alone is not (94 and 80).

    The single unresolved pair is Ardra P2 / Shravana P4: the same akshara (घा)
    genuinely appearing twice. Shravana is a disputed tier-C row.
    """
    devanagari = {r.akshara_devanagari for r in PADA_AKSHARA_TABLE}
    joint = {(r.akshara_latin_bare, r.akshara_tamil) for r in PADA_AKSHARA_TABLE}
    assert len(devanagari) == len(joint) == 107

    unresolved = [keys for keys in _joint_index().values() if len(keys) > 1]
    assert unresolved == [((6, 2), (22, 4))]


def test_tamil_collapse_affects_more_than_half_the_table() -> None:
    """55%, not the ~20% the NU-8a draft estimated.

    Every ka/ca/ja/ṭa/ta/pa-series row is affected, not only the aspirates the
    draft called out. This is the scale of the open practitioner question about
    Tamil substitution — it gates the majority of padas, so it is a blocker for
    the Name Lab rather than an edge case.
    """
    collapsed = [r for r in PADA_AKSHARA_TABLE if r.tamil_collapse]
    assert len(collapsed) == 59
    affected_nakshatras = {r.nakshatra_id for r in collapsed}
    assert len(affected_nakshatras) == 21


def _joint_index() -> dict[tuple[str, str], tuple[tuple[int, int], ...]]:
    buckets: dict[tuple[str, str], list[tuple[int, int]]] = {}
    for row in PADA_AKSHARA_TABLE:
        buckets.setdefault((row.akshara_latin_bare, row.akshara_tamil), []).append(row.key)
    return {k: tuple(v) for k, v in buckets.items()}


def test_tamil_collapse_is_derived_from_shared_bases() -> None:
    for row in PADA_AKSHARA_TABLE:
        expected = row.akshara_tamil[0] in TAMIL_SHARED_BASES
        assert row.tamil_collapse is expected, f"{row.key} {row.akshara_tamil}"


def test_latin_initial_sets_are_populated_and_not_bare_echoes() -> None:
    """Per NU-8a the set is hand-entered, never machine-derived from the bare form."""
    for row in PADA_AKSHARA_TABLE:
        assert row.latin_initial_set, row.key
        assert all(v.strip() for v in row.latin_initial_set), row.key
    multi = [r for r in PADA_AKSHARA_TABLE if len(r.latin_initial_set) > 1]
    assert len(multi) > 90


def test_shravana_carries_the_attested_competing_series() -> None:
    """Ja-series (draft) vs Kha-series (Drik Panchang). Both are in current use."""
    assert len(PADA_AKSHARA_ALTERNATES) == 4
    assert {r.nakshatra_id for r in PADA_AKSHARA_ALTERNATES} == {22}
    primary = [PADA_AKSHARA_BY_KEY[(22, p)].akshara_latin_bare for p in range(1, 5)]
    alternate = [PADA_AKSHARA_BY_KEY[(22, p)].alternate[2] for p in range(1, 5)]
    assert primary == ["Ju", "Je", "Jo", "Gha"]
    assert alternate == ["Khi", "Khu", "Khe", "Kho"]


def test_cross_check_is_recorded_but_does_not_promote_to_verified() -> None:
    """An online table is corroboration, not canon — the NU-8a protocol says so."""
    assert cross_checked_row_count() == 108
    assert verified_row_count() == 0
    assert is_production_ready() is False
    assert "Drik Panchang" in PADA_AKSHARA_TABLE[0].cross_check_ref
    assert all(r.source_ref is None for r in PADA_AKSHARA_TABLE)


def test_a_name_valid_under_only_the_alternate_series_is_ambiguous() -> None:
    """Honouring one series silently would reject correct names; matching it
    outright would overstate a split we have not resolved."""
    row = PADA_AKSHARA_BY_KEY[(22, 1)]
    # கீதா / "Kheetha" opens with the Kha-series reading, not the Ja-series.
    scored = evaluate_candidate(cand("கீதா", "Kheetha"), row)
    assert scored.confidence is MatchConfidence.AMBIGUOUS
    assert any("alternate reading" in w for w in scored.warnings)


def test_primary_series_still_wins_where_it_matches() -> None:
    row = PADA_AKSHARA_BY_KEY[(22, 1)]
    scored = evaluate_candidate(cand("ஜுலி", "Juli"), row)
    assert scored.confidence is MatchConfidence.CONFIRMED


# ---------------------------------------------------------------------------
# Production guard
# ---------------------------------------------------------------------------
@pytest.mark.parametrize("env", ["production", "staging", "PRODUCTION", " Staging "])
def test_guard_raises_in_real_user_environments(monkeypatch: pytest.MonkeyPatch, env: str) -> None:
    monkeypatch.setenv("APP_ENV", env)
    with pytest.raises(UnverifiedCanonError, match="draft canon"):
        assert_canon_usable()


@pytest.mark.parametrize("env", ["development", "test", "local", ""])
def test_guard_is_silent_outside_real_user_environments(
    monkeypatch: pytest.MonkeyPatch, env: str
) -> None:
    monkeypatch.setenv("APP_ENV", env)
    assert_canon_usable()


def test_public_entry_points_are_guarded(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("APP_ENV", "production")
    pool = [cand("லாவண்யா", "Lavanya")]
    with pytest.raises(UnverifiedCanonError):
        find_names(pool, NamingConstraints(nakshatra_id=1, pada=4))
    with pytest.raises(UnverifiedCanonError):
        padas_for_name(pool[0])


# ---------------------------------------------------------------------------
# Matching mechanics (tier A)
# ---------------------------------------------------------------------------
def test_both_scripts_agreeing_is_confirmed() -> None:
    row = PADA_AKSHARA_BY_KEY[(1, 4)]  # லா / "La", tier A
    assert row.nakshatra_id in TIER_A_NAKSHATRAS
    scored = evaluate_candidate(cand("லாவண்யா", "Lavanya", "Laavanya"), row)
    assert scored.confidence is MatchConfidence.CONFIRMED
    assert scored.matched_latin_variant == "Lavanya"


def test_lossy_single_script_evidence_is_ambiguous_not_a_match() -> None:
    """Tamil-only evidence on a collapsing row cannot pin the pada."""
    row = PADA_AKSHARA_BY_KEY[(11, 3)]  # டீ / "Ti", tier A, ட is a shared base
    assert row.tamil_collapse is True
    scored = evaluate_candidate(cand("டீனா", "Deena"), row)
    assert scored.confidence is MatchConfidence.AMBIGUOUS
    assert any("does not uniquely identify" in w for w in scored.warnings)


def test_unrelated_name_does_not_match() -> None:
    row = PADA_AKSHARA_BY_KEY[(1, 4)]
    scored = evaluate_candidate(cand("மோகன்", "Mohan"), row)
    assert scored.confidence is MatchConfidence.NO_MATCH
    assert scored.is_match is False


def test_latin_matching_ignores_case_and_diacritics() -> None:
    row = PADA_AKSHARA_BY_KEY[(16, 1)]  # தீ, latin set includes "Thee"
    plain = evaluate_candidate(cand("தீபா", "Theepa"), row)
    fancy = evaluate_candidate(cand("தீபா", "thēepa"), row)
    assert plain.confidence is fancy.confidence is MatchConfidence.CONFIRMED


def test_every_match_on_draft_canon_carries_an_unverified_warning() -> None:
    row = PADA_AKSHARA_BY_KEY[(1, 4)]
    scored = evaluate_candidate(cand("லாவண்யா", "Lavanya"), row)
    assert any("unverified draft canon" in w for w in scored.warnings)


def test_reverse_lookup_returns_a_set_not_a_single_pada() -> None:
    """An akshara does not identify one pada. Callers must handle a tuple."""
    hits = padas_for_name(cand("தீபா", "Theepa", "Deepa"))
    assert len(hits) >= 1
    assert all(h.is_match for h in hits)
    # Confirmed matches must sort ahead of weaker evidence.
    ranks = [_CONFIDENCE_RANK[h.confidence] for h in hits]
    assert ranks == sorted(ranks)
    # தீ is Vishakha P1; the name must at minimum reach that pada.
    assert any(h.row.key == (16, 1) for h in hits)


# ---------------------------------------------------------------------------
# Constraint satisfaction + relaxation
# ---------------------------------------------------------------------------
def test_empty_pool_reports_a_distinct_reason() -> None:
    result = find_names([], NamingConstraints(nakshatra_id=1, pada=4))
    assert result.is_empty
    assert result.usable is False
    assert result.empty_reason == "candidate pool was empty"


def test_no_candidate_fits_reports_a_different_reason() -> None:
    result = find_names(
        [cand("மோகன்", "Mohan"), cand("ரவி", "Ravi")],
        NamingConstraints(nakshatra_id=1, pada=4),
    )
    assert result.is_empty
    assert result.empty_reason is not None
    assert "no candidate in a pool of 2" in result.empty_reason
    assert result.empty_reason != "candidate pool was empty"


def test_collapse_gate_blocks_by_default_and_opens_on_opt_in() -> None:
    """Pada 11-P3 (டீ) collapses; the Tamil substitution rule is unresolved."""
    pool = [cand("டீனா", "Deena", "Teena")]
    blocked = find_names(pool, NamingConstraints(nakshatra_id=11, pada=3))
    assert blocked.is_empty
    assert blocked.empty_reason == "pada gated on unresolved tamil_collapse rule"
    assert any("substitution rule" in w for w in blocked.warnings)

    opened = find_names(
        pool,
        NamingConstraints(nakshatra_id=11, pada=3, allow_tamil_collapse=True, allow_ambiguous=True),
    )
    assert not opened.is_empty


def test_strict_search_records_no_relaxation() -> None:
    result = find_names(
        [cand("லாவண்யா", "Lavanya")],
        NamingConstraints(nakshatra_id=1, pada=4),
    )
    assert not result.is_empty
    assert result.relaxations_applied == ()
    assert result.matches[0].confidence is MatchConfidence.CONFIRMED


def test_gender_filter_then_relaxation_is_recorded() -> None:
    """A male-only pool asked for a female name must report DROP_GENDER."""
    pool = [cand("லாவண்யா", "Lavanya", gender="f")]
    result = find_names(
        pool,
        NamingConstraints(nakshatra_id=1, pada=4, gender="m"),
    )
    assert not result.is_empty
    assert Relaxation.DROP_GENDER in result.relaxations_applied


def test_sibling_pada_widening_only_in_weighted_mode() -> None:
    """pada_first must never return an off-target pada (doctrine D2)."""
    # A name that fits Ashwini P1 (சு) but was asked for against Ashwini P4 (லா).
    pool = [cand("சுதா", "Sudha", "Chudha")]

    strict = find_names(pool, NamingConstraints(nakshatra_id=1, pada=4, mode=NamingMode.PADA_FIRST))
    assert strict.is_empty
    assert Relaxation.SIBLING_PADAS not in strict.relaxations_applied

    weighted = find_names(
        pool, NamingConstraints(nakshatra_id=1, pada=4, mode=NamingMode.PADA_WEIGHTED)
    )
    assert not weighted.is_empty
    assert Relaxation.SIBLING_PADAS in weighted.relaxations_applied
    assert any("sibling pada" in w for w in weighted.warnings)
    # The hit came from Ashwini P1 (சு), not the requested P4.
    assert {m.row.key for m in weighted.matches} == {(1, 1)}


def test_result_is_never_usable_while_canon_is_draft() -> None:
    """The single gate on rendering a recommendation. Must hold for every row."""
    pool = [cand("லாவண்யா", "Lavanya")]
    for nak, pada in [(1, 4), (17, 1), (24, 2)]:
        result = find_names(
            pool,
            NamingConstraints(
                nakshatra_id=nak, pada=pada, allow_tamil_collapse=True, allow_ambiguous=True
            ),
        )
        assert result.usable is False, f"{nak}-{pada} reported usable on draft canon"


def test_constraints_reject_out_of_range_input() -> None:
    with pytest.raises(ValueError):
        NamingConstraints(nakshatra_id=28, pada=1)
    with pytest.raises(ValueError):
        NamingConstraints(nakshatra_id=1, pada=5)


def test_candidate_requires_both_scripts() -> None:
    with pytest.raises(ValueError):
        NameCandidate(tamil_form="", latin_variants=("Ravi",))
    with pytest.raises(ValueError):
        NameCandidate(tamil_form="ரவி", latin_variants=())
