"""Horoscope + numerology compatibility engine (NUM-34, Phase 3).

Pure-module tests. No DB, no ephemeris — the route-level behaviour lives in
``tests/test_numerology_chart_api.py``.

What this file is really guarding:

1. **The relation table is borrowed, not invented.** The whole defensibility of
   this feature rests on the pair relation being naisargika maitri out of the
   repo's existing table rather than a "number compatibility chart" made up for
   the occasion. Two encodings of that table exist here; the first test pins
   that they agree, so the arrangement cannot drift silently.
2. **The astrology cannot be overridden.** The clamp and the never-recomputed
   label are doctrine §9.1 in code, and they are tested against a case where
   numerology would very much like to disagree.
3. **The claims in the module docstring are measured.** The grade distribution
   and the reachable one-sided pairs are asserted, not asserted-to-be-obvious.
"""
from __future__ import annotations

from collections import Counter

import pytest

from app.calculations.numerology import (
    NUMBER_TO_GRAHA,
    build_profile,
    reading_from_total,
)
from app.calculations.numerology_alignment import align_profile
from app.calculations.numerology_compatibility import (
    _BAND_SCORE,
    _RELATION_BY_PAIR,
    _RELATION_SCORE,
    ENEMY,
    FRIEND,
    KNOWN_GRAHAS,
    NEUTRAL,
    NEUTRAL_SCORE,
    NUMEROLOGY_ADJUSTMENT_BOUND,
    CompatibilityBand,
    CompatibilityBasis,
    NumberRelation,
    PairKind,
    _adjustment_for,
    _band_for_score,
    cheiro_relation,
    compare_numbers,
    graha_relation,
    layer_over_porutham,
    pair_numbers,
    relation_between,
    resolve_basis,
    summary_en,
)
from app.calculations.numerology_timing import (
    NUMEROLOGY_ADJUSTMENT_BOUND as TIMING_BOUND,
)
from app.calculations.porutham import _GRAHA_RELATION

pytestmark = pytest.mark.no_db

CLASSICAL = ("SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN")

#: A lagna to hang the per-side alignments off. Which one barely matters here —
#: the pair relation is chart-independent, which is itself asserted below.
_LAGNA = 1


# ── The borrowed table ───────────────────────────────────────────────────────
def test_the_repos_two_graha_relation_tables_agree() -> None:
    """``porutham._GRAHA_RELATION`` and ``chart_strength``'s sets are one truth.

    This module reads the chart_strength encoding because it is the only one
    covering Rahu and Ketu, which numbers 4 and 7 need. The porutham encoding is
    what the Graha Maitri kuta scores with. If they ever disagree, a couple's
    porutham screen and their numerology screen would contradict each other
    about the same two grahas — so the agreement is pinned rather than assumed.
    """
    disagreements = [
        (a, b, _GRAHA_RELATION.get((a, b)), graha_relation(a, b))
        for a in CLASSICAL
        for b in CLASSICAL
        if _GRAHA_RELATION.get((a, b)) != graha_relation(a, b)
    ]
    assert not disagreements, (
        "the two natural-friendship encodings in this repo have drifted: "
        f"{disagreements}"
    )


def test_the_porutham_table_alone_cannot_serve_this_feature() -> None:
    """Documents *why* the chart_strength encoding is the one read.

    Numbers 4 and 7 are Rahu and Ketu. If someone later "simplifies" this module
    onto ``_GRAHA_RELATION``, two of the nine numbers would silently fall back to
    a default. This test fails first and says so.
    """
    node_entries = [key for key in _GRAHA_RELATION if "RAHU" in key or "KETU" in key]
    assert node_entries == [], (
        "porutham's table now covers the nodes — if it is complete for all nine "
        "grahas, this module should read it directly and drop the second source"
    )
    assert graha_relation("RAHU", "VENUS") == FRIEND
    assert graha_relation("KETU", "MARS") == FRIEND


def test_the_table_covers_exactly_the_nine_numbers_grahas() -> None:
    """No number can reach a graha the friendship table does not know."""
    assert KNOWN_GRAHAS == set(NUMBER_TO_GRAHA.values())
    assert len(KNOWN_GRAHAS) == 9


def test_an_unknown_graha_is_refused_not_defaulted_to_neutral() -> None:
    """A bad name must not quietly tell two people they are neutral to each other.

    The sibling readers of this table default to neutral, which is correct for
    them — they ask about sign lords, always one of the seven. This function
    answers a question about two *people*, so a silent default is the confident
    wrong answer this feature refuses everywhere else.
    """
    with pytest.raises(ValueError, match="unknown graha"):
        graha_relation("SUN", "URANUS")
    with pytest.raises(ValueError, match="unknown graha"):
        graha_relation("Sun", "MOON")  # case matters; the enum keys are upper


def test_every_number_pair_resolves() -> None:
    """All 81 ordered number pairs produce a grade — no KeyError in production."""
    for a in range(1, 10):
        for b in range(1, 10):
            _, _, relation = relation_between(NUMBER_TO_GRAHA[a], NUMBER_TO_GRAHA[b])
            assert isinstance(relation, NumberRelation)


def test_the_relation_table_is_total() -> None:
    """Every combination of two directional values has a grade.

    Six unordered combinations of three values. A future third value (or a
    fourth relation tier) would leave a hole that only shows up as a KeyError on
    some unlucky couple's request.
    """
    values = (ENEMY, NEUTRAL, FRIEND)
    expected = {(min(a, b), max(a, b)) for a in values for b in values}
    assert set(_RELATION_BY_PAIR) == expected
    assert len(_RELATION_BY_PAIR) == 6


def test_every_grade_is_reachable_from_a_real_number_pair() -> None:
    """A grade no pair can produce is dead vocabulary in the API contract."""
    seen = {
        relation_between(NUMBER_TO_GRAHA[a], NUMBER_TO_GRAHA[b])[2]
        for a in range(1, 10)
        for b in range(1, 10)
    }
    assert seen == set(NumberRelation)


def test_the_measured_grade_distribution() -> None:
    """The docstring's distribution claim, measured rather than stated.

    45 unordered pairs including a number with itself. Pinned so that editing
    the friendship source — or "tidying" the grade thresholds — has to
    acknowledge how it moved the spread.
    """
    counts: Counter[NumberRelation] = Counter()
    for a in range(1, 10):
        for b in range(a, 10):
            counts[relation_between(NUMBER_TO_GRAHA[a], NUMBER_TO_GRAHA[b])[2]] += 1

    assert sum(counts.values()) == 45
    assert counts[NumberRelation.HARMONIOUS] == 15
    assert counts[NumberRelation.SUPPORTIVE] == 6
    assert counts[NumberRelation.NEUTRAL] == 5
    assert counts[NumberRelation.ONE_SIDED] == 3
    assert counts[NumberRelation.STRAINED] == 7
    assert counts[NumberRelation.DIFFICULT] == 9


# ── Asymmetry ────────────────────────────────────────────────────────────────
def test_one_sided_pairs_are_exactly_these_three() -> None:
    """Permanent friendship is directional, and three number pairs prove it.

    2/5 (Moon-Mercury), 4/6 (Rahu-Venus) and 6/7 (Venus-Ketu). Naming them keeps
    ``ONE_SIDED`` from being quietly collapsed into ``STRAINED`` by a later
    refactor — which would erase *which partner* carries the difficulty, the one
    thing this grade exists to say.
    """
    one_sided = {
        (a, b)
        for a in range(1, 10)
        for b in range(a, 10)
        if relation_between(NUMBER_TO_GRAHA[a], NUMBER_TO_GRAHA[b])[2]
        is NumberRelation.ONE_SIDED
    }
    assert one_sided == {(2, 5), (4, 6), (6, 7)}


def test_direction_survives_into_the_pair_under_both_bases() -> None:
    """Rahu counts Venus a friend; Venus counts Rahu an enemy.

    The graha regard ships whichever doctrine is grading, because it is a fact
    about the grahas and an astrologer wants it either way. Under Cheiro the
    *grade* differs — 4 and 6 are in different series — and the disagreement is
    declared rather than hidden.
    """
    for basis in CompatibilityBasis:
        pair = pair_numbers(
            PairKind.DESTINY,
            reading_from_total(4),  # Rahu
            reading_from_total(6),  # Venus
            basis=basis,
            lagna_rasi_a=_LAGNA,
            lagna_rasi_b=_LAGNA,
        )
        assert pair.graha_regard_a_to_b == FRIEND, basis
        assert pair.graha_regard_b_to_a == ENEMY, basis
        assert pair.graha_relation is NumberRelation.ONE_SIDED, basis
        assert pair.is_mutual is False, basis

    cheiro = pair_numbers(
        PairKind.DESTINY,
        reading_from_total(4),
        reading_from_total(6),
        basis=CompatibilityBasis.CHEIRO_SERIES,
        lagna_rasi_a=_LAGNA,
        lagna_rasi_b=_LAGNA,
    )
    assert cheiro.relation is NumberRelation.NEUTRAL
    assert cheiro.bases_agree is False


def test_swapping_the_two_people_swaps_the_direction_not_the_grade() -> None:
    def build(a: int, b: int):
        return pair_numbers(
            PairKind.DESTINY,
            reading_from_total(a),
            reading_from_total(b),
            lagna_rasi_a=_LAGNA,
            lagna_rasi_b=_LAGNA,
        )

    forward, reverse = build(4, 6), build(6, 4)
    assert forward.relation is reverse.relation
    assert forward.score == reverse.score
    assert (forward.graha_regard_a_to_b, forward.graha_regard_b_to_a) == (
        reverse.graha_regard_b_to_a,
        reverse.graha_regard_a_to_b,
    )


def test_a_number_paired_with_itself_is_harmonious_under_both_bases() -> None:
    """Under Cheiro because same-series is reflexive; under the graha table
    because a graha is its own friend. Neither needs a rule invented for
    same-number couples."""
    for n in range(1, 10):
        assert cheiro_relation(n, n) is NumberRelation.HARMONIOUS, n
        _, _, graha = relation_between(NUMBER_TO_GRAHA[n], NUMBER_TO_GRAHA[n])
        assert graha is NumberRelation.HARMONIOUS, n


def test_the_pair_relation_ignores_the_charts() -> None:
    """The pair relation is chart-independent under either basis.

    Each side's own chart alignment rides along in ``a``/``b`` and must not leak
    into the pair score — if it did, the horoscope would be counted twice, once
    here and once through the porutham this layers over.
    """
    for basis in CompatibilityBasis:
        scores = {
            (
                pair_numbers(
                    PairKind.PSYCHIC,
                    reading_from_total(3),
                    reading_from_total(8),
                    basis=basis,
                    lagna_rasi_a=lagna_a,
                    lagna_rasi_b=lagna_b,
                ).score,
                pair_numbers(
                    PairKind.PSYCHIC,
                    reading_from_total(3),
                    reading_from_total(8),
                    basis=basis,
                    lagna_rasi_a=lagna_a,
                    lagna_rasi_b=lagna_b,
                ).relation,
            )
            for lagna_a in range(1, 13)
            for lagna_b in range(1, 13)
        }
        assert len(scores) == 1, basis


# ── Doctrine D4: Cheiro's series, each claim pinned to its source ────────────
def test_cheiro_group_a_is_mutually_sympathetic() -> None:
    """1 "get[s] on well with persons born under the 2, 4, and 7"; 4 is "more
    attracted to persons born under the 1, 2, 7 and 8 numbers"; 2 "vibrate[s]
    together" with 1 and "in a lesser degree" with 7."""
    for a in (1, 2, 4, 7):
        for b in (1, 2, 4, 7):
            assert cheiro_relation(a, b) is NumberRelation.HARMONIOUS, (a, b)


def test_cheiro_group_b_is_mutually_sympathetic() -> None:
    """3 and 6 and 9 each name "the series of 3, 6, or 9"."""
    for a in (3, 6, 9):
        for b in (3, 6, 9):
            assert cheiro_relation(a, b) is NumberRelation.HARMONIOUS, (a, b)


def test_five_gets_on_with_almost_any_number() -> None:
    """"...but their best friends are those born under their own number" — so 5
    with 5 outranks 5 with anyone else."""
    for other in range(1, 10):
        if other == 5:
            continue
        assert cheiro_relation(5, other) is NumberRelation.SUPPORTIVE, other
        assert cheiro_relation(other, 5) is NumberRelation.SUPPORTIVE, other
    assert cheiro_relation(5, 5) is NumberRelation.HARMONIOUS


def test_four_and_eight_are_interchangeable_and_carry_no_doom() -> None:
    """"their interchangeable number, which is 4".

    Cheiro is separately emphatic that this is "the terrible combination" and
    fatalistic in love and marriage. **That is deliberately not encoded** —
    standing ruling 3 bans the 8-and-4 fear trade, and whether Sani or Rahu is
    heavy for these two people is a question their charts answer. The structural
    bond is kept; the doom is dropped.
    """
    assert cheiro_relation(4, 8) is NumberRelation.HARMONIOUS
    assert cheiro_relation(8, 4) is NumberRelation.HARMONIOUS


def test_cheiro_names_no_enmities() -> None:
    """The finding that shapes the whole layer.

    He says who you get on with and is silent about the rest, and silence is not
    enmity. If a negative grade ever appears under this basis, someone has
    invented a table and attributed it to a source that does not carry one.
    """
    produced = {cheiro_relation(a, b) for a in range(1, 10) for b in range(1, 10)}
    assert produced == {
        NumberRelation.HARMONIOUS,
        NumberRelation.SUPPORTIVE,
        NumberRelation.NEUTRAL,
    }


def test_cross_series_pairs_are_neutral_not_negative() -> None:
    """1 and 6 belong to different series. Cheiro claims no sympathy there and
    no difficulty either — the chart decides that one."""
    assert cheiro_relation(1, 6) is NumberRelation.NEUTRAL
    assert cheiro_relation(2, 9) is NumberRelation.NEUTRAL


def test_the_measured_cheiro_distribution() -> None:
    """Measured across the 45 unordered pairs, not asserted from the structure."""
    counts: Counter[NumberRelation] = Counter()
    for a in range(1, 10):
        for b in range(a, 10):
            counts[cheiro_relation(a, b)] += 1
    assert sum(counts.values()) == 45
    assert counts[NumberRelation.HARMONIOUS] == 19
    assert counts[NumberRelation.SUPPORTIVE] == 8
    assert counts[NumberRelation.NEUTRAL] == 18


def test_cheiro_basis_can_raise_a_score_and_never_lower_one() -> None:
    """The best property this layer has, asserted rather than described.

    Every negative verdict in a compatibility response must come from the
    poruthams. If this fails, the numerology has acquired the power to condemn a
    couple — which is what "a number never overrides a graha" exists to prevent.
    """
    for a in range(1, 10):
        for b in range(1, 10):
            score = _RELATION_SCORE[cheiro_relation(a, b)]
            assert _adjustment_for(score) >= 0, (a, b)


def test_the_graha_basis_still_grades_the_full_range() -> None:
    """The second basis keeps its teeth — the flag is a real choice."""
    produced = {
        relation_between(NUMBER_TO_GRAHA[a], NUMBER_TO_GRAHA[b])[2]
        for a in range(1, 10)
        for b in range(1, 10)
    }
    assert produced == set(NumberRelation)


def test_an_unknown_basis_is_refused() -> None:
    with pytest.raises(ValueError, match="unknown numerology compatibility basis"):
        resolve_basis("sethuraman")
    assert resolve_basis("cheiro_series") is CompatibilityBasis.CHEIRO_SERIES
    assert resolve_basis("graha_maitri") is CompatibilityBasis.GRAHA_MAITRI


def test_cheiro_refuses_a_number_outside_one_to_nine() -> None:
    with pytest.raises(ValueError, match="number must be 1..9"):
        cheiro_relation(0, 5)
    with pytest.raises(ValueError, match="number must be 1..9"):
        cheiro_relation(5, 10)


def test_each_side_is_aligned_against_its_own_chart() -> None:
    """The per-side alignments must not both be scored against one lagna."""
    pair = pair_numbers(
        PairKind.DESTINY,
        reading_from_total(8),  # Saturn
        reading_from_total(8),
        lagna_rasi_a=10,  # Makara — Saturn is lagna lord
        lagna_rasi_b=5,  # Simha — Saturn is not
        strengths_a={"SATURN": 70.0},
        strengths_b={"SATURN": 70.0},
    )
    assert pair.a.functional_nature != pair.b.functional_nature
    assert pair.a.score != pair.b.score


# ── Aggregation ──────────────────────────────────────────────────────────────
def _pair(
    kind: PairKind,
    a: int,
    b: int,
    basis: CompatibilityBasis = CompatibilityBasis.GRAHA_MAITRI,
):
    """Default to the graha basis here: these tests exercise the aggregation
    machinery, which needs the full score range that Cheiro's basis does not
    produce. The Cheiro basis has its own section above."""
    return pair_numbers(
        kind,
        reading_from_total(a),
        reading_from_total(b),
        basis=basis,
        lagna_rasi_a=_LAGNA,
        lagna_rasi_b=_LAGNA,
    )


def test_omitting_the_name_pair_does_not_deflate_the_score() -> None:
    """Weights renormalise over the pairs present.

    Most callers will not supply both names. If the missing 0.25 were simply
    dropped from the denominator's numerator, every nameless comparison would
    score 25% low and look like a worse match than it is.
    """
    two = compare_numbers((_pair(PairKind.DESTINY, 1, 2), _pair(PairKind.PSYCHIC, 1, 2)))
    three = compare_numbers(
        (
            _pair(PairKind.DESTINY, 1, 2),
            _pair(PairKind.PSYCHIC, 1, 2),
            _pair(PairKind.NAME, 1, 2),
        )
    )
    assert {p.relation for p in two.pairs} == {NumberRelation.HARMONIOUS}
    assert two.score == three.score == _RELATION_SCORE[NumberRelation.HARMONIOUS]


def test_the_aggregate_is_weighted_toward_destiny() -> None:
    """Destiny outweighs psychic, so flipping which one is difficult moves the score."""
    destiny_bad = compare_numbers(
        (_pair(PairKind.DESTINY, 1, 6), _pair(PairKind.PSYCHIC, 1, 3))
    )
    psychic_bad = compare_numbers(
        (_pair(PairKind.DESTINY, 1, 3), _pair(PairKind.PSYCHIC, 1, 6))
    )
    assert destiny_bad.pairs[0].relation is NumberRelation.DIFFICULT
    assert psychic_bad.pairs[1].relation is NumberRelation.DIFFICULT
    assert destiny_bad.score < psychic_bad.score


def test_compare_numbers_refuses_an_empty_set() -> None:
    with pytest.raises(ValueError, match="at least one number pair"):
        compare_numbers(())


def test_compare_numbers_refuses_a_mixed_basis_set() -> None:
    """Two pairs graded by different doctrines cannot be averaged into one number."""
    with pytest.raises(ValueError, match="different bases"):
        compare_numbers(
            (
                _pair(PairKind.DESTINY, 1, 6, CompatibilityBasis.CHEIRO_SERIES),
                _pair(PairKind.PSYCHIC, 1, 6, CompatibilityBasis.GRAHA_MAITRI),
            )
        )


def test_the_aggregate_reports_the_basis_it_used() -> None:
    for basis in CompatibilityBasis:
        result = compare_numbers((_pair(PairKind.DESTINY, 1, 2, basis),))
        assert result.basis is basis


def test_band_ties_resolve_to_the_better_band() -> None:
    """The only two integer tie points, measured rather than assumed.

    83 sits exactly between 92 and 74; 29 exactly between 38 and 20. The other
    midpoints (64.5, 46.5) are not integers and so are unreachable.
    """
    assert _band_for_score(83) is CompatibilityBand.STRONG
    assert _band_for_score(29) is CompatibilityBand.GUARDED


def test_every_band_score_bands_back_to_itself() -> None:
    for band, score in _BAND_SCORE.items():
        assert _band_for_score(score) is band


def test_the_band_is_not_a_relation() -> None:
    """The category fix, asserted.

    A summary must never report ``one_sided`` — that is a finding about one
    specific pair of grahas, and an average is not a pair. Keeping the two
    vocabularies disjoint is what prevents it.
    """
    assert not ({b.value for b in CompatibilityBand} & {r.value for r in NumberRelation}) - {
        "supportive",
        "neutral",
        "difficult",
    }
    assert "one_sided" not in {b.value for b in CompatibilityBand}
    assert "strained" not in {b.value for b in CompatibilityBand}
    assert "harmonious" not in {b.value for b in CompatibilityBand}


# ── D5: Sethuraman's name-to-date harmony, per partner ───────────────────────
def _profile(day: int, name: str | None):
    return build_profile(year=1991, month=7, day=day, document_name=name)


def test_name_harmony_is_reported_per_partner() -> None:
    """Sethuraman's core doctrine: each person's own name against their own
    date of birth and chart. It is a per-person finding, so it arrives per
    side."""
    alignment_a = align_profile(_profile(22, "Zoro"), 10)
    alignment_b = align_profile(_profile(17, "Zed"), 5)
    result = compare_numbers(
        (_pair(PairKind.DESTINY, 1, 2),),
        alignment_a=alignment_a,
        alignment_b=alignment_b,
    )
    assert result.name_harmony_a is not None
    assert result.name_harmony_b is not None
    assert 0 <= result.name_harmony_a.score <= 100
    assert isinstance(result.name_harmony_a.change_advised, bool)


def test_name_harmony_is_absent_when_no_name_was_scored() -> None:
    """Absence is "not asked", not "scored badly". Reporting a date-only
    alignment under a *name* harmony label would be a quiet lie."""
    result = compare_numbers(
        (_pair(PairKind.DESTINY, 1, 2),),
        alignment_a=align_profile(_profile(22, None), 10),
        alignment_b=None,
    )
    assert result.name_harmony_a is None
    assert result.name_harmony_b is None


def test_name_harmony_never_moves_the_pair_score() -> None:
    """A one-person finding must not leak into a two-person number."""
    bare = compare_numbers((_pair(PairKind.DESTINY, 1, 2),))
    with_harmony = compare_numbers(
        (_pair(PairKind.DESTINY, 1, 2),),
        alignment_a=align_profile(_profile(22, "Zoro"), 10),
        alignment_b=align_profile(_profile(17, "Zed"), 5),
    )
    assert bare.score == with_harmony.score
    assert bare.band is with_harmony.band


# ── The bounded layer over the astrology ─────────────────────────────────────
def test_the_bound_is_the_same_one_the_date_layer_uses() -> None:
    """One answer to "how far may numerology move an astrological score", not two.

    Widening it is a doctrine change; having two of them is an accident waiting
    to be discovered by a user comparing two screens.
    """
    assert NUMEROLOGY_ADJUSTMENT_BOUND == TIMING_BOUND == 8


def test_adjustment_reaches_the_bound_exactly_at_the_extremes() -> None:
    assert _adjustment_for(_RELATION_SCORE[NumberRelation.HARMONIOUS]) == 8
    assert _adjustment_for(_RELATION_SCORE[NumberRelation.DIFFICULT]) == -8
    assert _adjustment_for(NEUTRAL_SCORE) == 0


def test_adjustment_never_exceeds_the_bound_anywhere_in_range() -> None:
    for score in range(0, 101):
        assert abs(_adjustment_for(score)) <= NUMEROLOGY_ADJUSTMENT_BOUND


def _harmonious() -> object:
    return compare_numbers(
        (_pair(PairKind.DESTINY, 1, 2), _pair(PairKind.PSYCHIC, 1, 2))
    )


def _difficult() -> object:
    return compare_numbers(
        (_pair(PairKind.DESTINY, 1, 6), _pair(PairKind.PSYCHIC, 1, 6))
    )


def test_a_flagged_match_cannot_be_lifted_by_good_numbers() -> None:
    """Doctrine §9.1 — the clamp, on the case that actually matters.

    Two people with perfectly friendly numbers and a Rajju-dosha porutham. The
    numerology wants +8; it gets 0, the clamp is declared, and the combined
    score is the astrology's own.
    """
    numerology = _harmonious()
    assert numerology.band is CompatibilityBand.STRONG

    clean = layer_over_porutham(
        numerology,
        porutham_percentage=40.0,
        porutham_label="CAUTION",
        has_astrological_caution=False,
    )
    flagged = layer_over_porutham(
        numerology,
        porutham_percentage=40.0,
        porutham_label="CAUTION",
        has_astrological_caution=True,
    )

    assert clean.adjustment == 8
    assert clean.clamped_by_astrology is False
    assert flagged.adjustment == 0
    assert flagged.clamped_by_astrology is True
    assert flagged.combined_score == 40.0


def test_a_flagged_match_can_still_be_lowered() -> None:
    """The clamp is one-directional. Numerology may agree with a warning."""
    flagged = layer_over_porutham(
        _difficult(),
        porutham_percentage=40.0,
        porutham_label="CAUTION",
        has_astrological_caution=True,
    )
    assert flagged.adjustment == -8
    assert flagged.clamped_by_astrology is False
    assert flagged.combined_score == 32.0


def test_the_label_is_never_recomputed() -> None:
    """Numerology may shade the score; it may not touch the verdict.

    A CAUTION match with flawless numbers stays CAUTION — that is the difference
    between this product and one that sells reassurance.
    """
    for label in ("EXCELLENT", "GOOD", "AVERAGE", "CAUTION"):
        layered = layer_over_porutham(
            _harmonious(),
            porutham_percentage=30.0,
            porutham_label=label,
            has_astrological_caution=False,
        )
        assert layered.label == label


def test_combined_score_stays_in_range() -> None:
    top = layer_over_porutham(
        _harmonious(),
        porutham_percentage=100.0,
        porutham_label="EXCELLENT",
        has_astrological_caution=False,
    )
    bottom = layer_over_porutham(
        _difficult(),
        porutham_percentage=0.0,
        porutham_label="CAUTION",
        has_astrological_caution=False,
    )
    assert top.combined_score == 100.0
    assert bottom.combined_score == 0.0


def test_the_summary_names_which_instrument_said_what() -> None:
    """No fear framing, and no pretending the number decided it (§9.3)."""
    layered = layer_over_porutham(
        _harmonious(),
        porutham_percentage=72.0,
        porutham_label="GOOD",
        has_astrological_caution=False,
    )
    text = summary_en(layered)
    assert "poruthams" in text
    assert "GOOD" in text
    assert "72.0%" in text

    clamped = layer_over_porutham(
        _harmonious(),
        porutham_percentage=40.0,
        porutham_label="CAUTION",
        has_astrological_caution=True,
    )
    assert "hold it where it is" in summary_en(clamped)
