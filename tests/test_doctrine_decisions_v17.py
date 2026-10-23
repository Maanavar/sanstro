"""DOCTRINE_DECISIONS v1.7 — owner rulings of 2026-10-03 on the v1.5 sign-off packet.

The rulings adopt a consolidated review. They are an owner decision, not a
practitioner signature: `MATRIX_SIGNED_OFF` stays False and the physical-edition
ledger (§18) is still open. Each test pins one ruling, and the A2 golden tests
pin the three BPHS Ch. 34 pairs that must never form a full Raja Yoga from
association alone.

All charts are synthetic placements, not anyone's birth data.
"""
from __future__ import annotations

import pytest

from app.calculations._yoga_detect import (
    detect_gaja_kesari_parashara,
    detect_neecha_bhanga,
    detect_raja_yoga,
)
from app.calculations.doctrine_options import DEFAULT_DOCTRINE, DoctrineOptions, validated
from app.calculations.functional_status import (
    ALL_LAGNAS,
    CONFIRMED_RAJA_YOGA,
    MATRIX_SIGNED_OFF,
    MIXED_RAJA_RELATION,
    SEVEN_SIGN_LORDS,
    SOURCE_VETOED_RELATION,
    FunctionalStatus,
    functional_status,
    kendradhipati_two_kendras,
    node_functional_context,
    owned_houses,
    raja_grade,
    raja_participation,
    raja_relation,
)
from app.calculations.neecha_bhanga import evaluate_neecha_bhanga
from app.calculations.yogas import detect_yogas_and_doshams

pytestmark = pytest.mark.no_db

MESHAM, RISHABAM, MITHUNAM, KADAGAM, SIMMAM, KANNI = 1, 2, 3, 4, 5, 6
THULAM, VIRUCHIGAM, DHANUSU, MAGARAM, KUMBAM, MEENAM = 7, 8, 9, 10, 11, 12
SURYAN, CHANDRAN, SEVVAI, BUDHAN = "SUN", "MOON", "MARS", "MERCURY"
GURU, SUKRAN, SANI, RAHU, KETU = "JUPITER", "VENUS", "SATURN", "RAHU", "KETU"

E8 = FunctionalStatus.EIGHTH_SPECIAL_CASE
E8X = FunctionalStatus.EIGHTH_LUMINARY_EXEMPT
KL = FunctionalStatus.KENDRA_LORD
KB = FunctionalStatus.KENDRADHIPATI_BENEFIC
KM = FunctionalStatus.KENDRADHIPATI_MALEFIC


def _chart(**rasis: int) -> dict[str, int]:
    """Every sign lord parked in Rishabam (no graha is debilitated there), the
    nodes on the Rishabam–Viruchigam axis, unless placed; tests place what
    they test."""
    base = {p: RISHABAM for p in SEVEN_SIGN_LORDS} | {RAHU: RISHABAM, KETU: VIRUCHIGAM}
    base.update({k.upper(): v for k, v in rasis.items()})
    return base


def _present_pairs(results) -> set[frozenset[str]]:
    return {frozenset(r.key_grahas) for r in results if r.is_present}


# ── O-9: the matrix ─────────────────────────────────────────────────────────
def test_matrix_stays_unsigned() -> None:
    assert MATRIX_SIGNED_OFF is False


def test_luminaries_carry_no_eighth_lord_blemish_but_keep_the_ownership() -> None:
    assert functional_status(DHANUSU, CHANDRAN) == {E8X}
    assert functional_status(MAGARAM, SURYAN) == {E8X}
    assert 8 in owned_houses(DHANUSU, CHANDRAN) and 8 in owned_houses(MAGARAM, SURYAN)
    # Every other 8th lord keeps EIGHTH_SPECIAL_CASE: ten cells.
    eighth = [(l, p) for l in ALL_LAGNAS for p in SEVEN_SIGN_LORDS if E8 in functional_status(l, p)]
    assert len(eighth) == 10
    assert all(p not in (SURYAN, CHANDRAN) for _, p in eighth)


def test_kendra_lordship_is_split_by_natural_nature() -> None:
    assert {KL, KB} <= functional_status(MITHUNAM, GURU)      # owns 7+10
    assert {KL, KB} <= functional_status(MESHAM, CHANDRAN)    # owns 4
    assert {KL, KM} <= functional_status(MESHAM, SANI)        # owns 10+11
    assert {KL, KM} <= functional_status(RISHABAM, SURYAN)    # owns 4
    # No cell is both, and every kendra lord that is not the lagna lord is one.
    for lagna in ALL_LAGNAS:
        for planet in SEVEN_SIGN_LORDS:
            statuses = functional_status(lagna, planet)
            assert not {KB, KM} <= statuses
            if KL in statuses and FunctionalStatus.LAGNA_LORD not in statuses:
                assert statuses & {KB, KM}, (lagna, planet)


def test_kendradhipati_two_kendras_is_exactly_four_cells() -> None:
    found = {(l, p) for l in ALL_LAGNAS for p in SEVEN_SIGN_LORDS if kendradhipati_two_kendras(l, p)}
    assert found == {(MITHUNAM, GURU), (KANNI, GURU), (DHANUSU, BUDHAN), (MEENAM, BUDHAN)}


def test_lagna_lord_overrides_the_eighth_for_mesham_mars_and_thulam_venus() -> None:
    for lagna, planet in ((MESHAM, SEVVAI), (THULAM, SUKRAN)):
        assert E8 in functional_status(lagna, planet)
        part = raja_participation(lagna, planet)
        assert part.eligible and part.basis == "lagna_lord"
    # The 8th never makes the grade MIXED for the lagna lord: Sevvai with the
    # Sun (5th lord, clean) is a full Raja Yoga for Mesham.
    assert raja_grade(MESHAM, SURYAN, SEVVAI) == "FULL"


def test_node_context_reads_house_dispositor_conjunctions_and_received_aspects() -> None:
    chart = _chart(rahu=SIMMAM, ketu=KUMBAM, sun=SIMMAM, saturn=KUMBAM, jupiter=DHANUSU)
    for lagna in ALL_LAGNAS:
        assert functional_status(lagna, RAHU) == {FunctionalStatus.NON_SIGN_LORD}
    ctx = node_functional_context(MESHAM, RAHU, chart)
    assert ctx.house == 5 and ctx.dispositor == SURYAN
    assert SURYAN in ctx.conjunctions
    # Received: Guru's 9th aspect from Dhanusu, Sani's 7th from Kumbam.
    assert GURU in ctx.aspected_by and SANI in ctx.aspected_by
    assert not hasattr(ctx, "aspects_cast")  # outgoing aspects: a separate lineage question
    ketu = node_functional_context(MESHAM, KETU, chart)
    assert ketu.house == 11 and ketu.dispositor == SANI and SANI in ketu.conjunctions


# ── A2 / O-23: Raja Yoga participation ──────────────────────────────────────
def test_moolatrikona_test_extends_to_third_and_eleventh_co_lords() -> None:
    newly_out = {(MESHAM, SANI), (SIMMAM, SUKRAN), (KUMBAM, SEVVAI)}
    for lagna, planet in newly_out:
        part = raja_participation(lagna, planet)
        assert not part.eligible and part.basis == "moolatrikona_upachaya"
        # The 6th/8th-only test (v1.6) still admitted them.
        assert raja_participation(lagna, planet, DoctrineOptions(o23_six_eight_colord_mode="moolatrikona")).eligible
    # 3rd/11th co-lords whose moolatrikona is the kendra they own stay in.
    for lagna, planet in ((KADAGAM, SUKRAN), (VIRUCHIGAM, SANI), (MAGARAM, SEVVAI)):
        assert raja_participation(lagna, planet).basis == "moolatrikona_kendra_trikona"


def test_the_whole_exclusion_set_under_the_ruling() -> None:
    """The v1.7 set; v1.8 re-admits Kadagam Guru (test_doctrine_decisions_v18)."""
    v17 = DoctrineOptions(o23_lineage_exceptions=False)
    out = {
        (l, p) for l in ALL_LAGNAS for p in SEVEN_SIGN_LORDS
        if (part := raja_participation(l, p, v17)) and (part.kendra_lord or part.trikona_lord) and not part.eligible
    }
    assert out == {
        (MESHAM, SANI), (KADAGAM, GURU), (KADAGAM, SANI), (SIMMAM, SUKRAN),
        (KANNI, SANI), (KUMBAM, SEVVAI), (KUMBAM, BUDHAN),
    }


@pytest.mark.parametrize(
    ("lagna", "pair"),
    [(MESHAM, (GURU, SANI)), (MITHUNAM, (GURU, SANI)), (SIMMAM, (GURU, SUKRAN))],
    ids=["mesham-guru-sani", "mithunam-guru-sani", "simmam-guru-sukran"],
)
@pytest.mark.parametrize(
    "mode", ["moolatrikona_3_6_8_11", "moolatrikona", "lordship_only"],
)
def test_bphs_counterexample_pairs_never_form_a_raja_yoga(lagna, pair, mode) -> None:
    """Golden: conjunct, under every co-lord mode — the pair never forms. Under
    the default the moolatrikona test already removes Mesham Sani and Simmam
    Sukran; the veto table is what holds when that test is switched."""
    a, b = pair
    options = DoctrineOptions(o23_six_eight_colord_mode=mode)
    chart = _chart(**{a: KADAGAM, b: KADAGAM})
    results = detect_raja_yoga(chart, lagna, doctrine=options)
    assert frozenset(pair) not in _present_pairs(results)
    assert raja_relation(lagna, a, b) == SOURCE_VETOED_RELATION


def test_a_vetoed_pair_is_recorded_on_the_card() -> None:
    # Mithunam: both lords pass eligibility, so the veto table is what speaks.
    chart = _chart(jupiter=KADAGAM, saturn=KADAGAM)
    results = detect_raja_yoga(chart, MITHUNAM)
    vetoed = [r for r in results if "raja_pair_source_vetoed_jupiter_saturn" in r.cancellation_factors]
    assert vetoed and not vetoed[0].is_present and vetoed[0].key_grahas == ()


def test_vetoed_only_chart_reads_as_formed_and_cancelled_through_the_facade() -> None:
    chart = _chart(jupiter=KADAGAM, saturn=KADAGAM, mercury=SIMMAM, venus=THULAM,
                   sun=RISHABAM, moon=DHANUSU, mars=MAGARAM)
    yogas, _, _ = detect_yogas_and_doshams(chart, MITHUNAM, DHANUSU)
    raja = next(y for y in yogas if y.name == "RAJA_YOGA")
    present_with_pair = raja.is_present and {"JUPITER_SATURN_link", "SATURN_JUPITER_link"} & set(raja.conditions_met)
    assert not present_with_pair
    assert "raja_pair_source_vetoed_jupiter_saturn" in raja.cancellation_factors


# ── O-24: kendradhipati ─────────────────────────────────────────────────────
def test_two_kendra_benefic_takes_part_at_a_mixed_grade_by_default() -> None:
    """Dhanusu: Surya (9th) with Budhan (7th+10th). BPHS 34's Dhanus paragraph,
    as commonly translated, names this pair; O-24's default keeps it, graded
    MIXED_KENDRADHIPATI. 'exclude' removes it."""
    chart = _chart(sun=SIMMAM, mercury=SIMMAM)
    results = detect_raja_yoga(chart, DHANUSU)
    pair = [r for r in results if r.is_present and set(r.key_grahas) == {SURYAN, BUDHAN}]
    assert pair and "raja_grade_mixed_kendradhipati" in pair[0].conditions_met
    assert raja_relation(DHANUSU, SURYAN, BUDHAN) == MIXED_RAJA_RELATION
    excluded = detect_raja_yoga(chart, DHANUSU, doctrine=DoctrineOptions(o24_kendradhipati_two_kendras="exclude"))
    assert frozenset({SURYAN, BUDHAN}) not in _present_pairs(excluded)


def test_three_way_relation_on_a_clean_pair() -> None:
    assert raja_relation(THULAM, BUDHAN, CHANDRAN) == CONFIRMED_RAJA_YOGA   # 9th+12th with 10th


def test_doctrine_values_are_validated() -> None:
    with pytest.raises(ValueError):
        validated(DoctrineOptions(o24_kendradhipati_two_kendras="veto"))
    with pytest.raises(ValueError):
        validated(DoctrineOptions(o13_nb_raja_min_points=0))
    assert validated(DEFAULT_DOCTRINE) is DEFAULT_DOCTRINE


# ── O-13: Neecha Bhanga name needs two conditions ───────────────────────────
def test_one_condition_is_neecha_nivarthi_not_a_raja_yoga() -> None:
    """Sevvai debilitated in Kadagam; Chandran (lord of Kadagam) in Mesham, a
    kendra from the Thulam lagna — NB-a. Guru (lord of Makara, Sevvai's
    exaltation) sits in the 3rd from the lagna and 11th from Chandran."""
    chart = _chart(mars=KADAGAM, moon=MESHAM, jupiter=DHANUSU, saturn=KUMBAM)
    evaluation = evaluate_neecha_bhanga(SEVVAI, planet_rasi=chart, lagna_rasi=THULAM)
    assert evaluation.cancelled and evaluation.grade_points == 1
    results = detect_neecha_bhanga(chart, THULAM)
    by_name = {r.name: r for r in results}
    assert by_name["NEECHA_NIVARTHI"].is_present and by_name["NEECHA_NIVARTHI"].strength == "WEAK"
    assert "NEECHA_BHANGA_RAJA_YOGA" not in by_name
    # v1.6 behaviour back on one switch.
    v16 = detect_neecha_bhanga(chart, THULAM, doctrine=DoctrineOptions(o13_nb_raja_min_points=1))
    assert [r.name for r in v16] == ["NEECHA_BHANGA_RAJA_YOGA"] and v16[0].is_present


def test_two_conditions_keep_the_raja_yoga_name() -> None:
    """As above, plus Chandran aspecting Kadagam from Makara instead: NB-a (Chandran
    in a kendra from Thulam) and NB-d (the debilitation lord aspects Sevvai)."""
    chart = _chart(mars=KADAGAM, moon=MAGARAM, jupiter=DHANUSU, saturn=KUMBAM)
    evaluation = evaluate_neecha_bhanga(SEVVAI, planet_rasi=chart, lagna_rasi=THULAM)
    assert evaluation.grade_points >= 2
    results = detect_neecha_bhanga(chart, THULAM)
    assert [r.name for r in results] == ["NEECHA_BHANGA_RAJA_YOGA"]
    assert results[0].is_present and results[0].strength in {"PARTIAL", "STRONG"}


# ── O-21: Budhan's self-reference ───────────────────────────────────────────
def test_self_reference_alone_cannot_make_the_grade_strong() -> None:
    """Mithunam lagna. Budhan debilitated in Meenam (10th). Guru, lord of Meenam,
    in Mithunam: NB-a (kendra from lagna) and NB-g. Budhan itself in a kendra
    gives NB-b, and Guru–Budhan in mutual kendras gives NB-c — both only
    because Budhan is its own exaltation lord. Three points, one independent."""
    chart = _chart(mercury=MEENAM, jupiter=MITHUNAM, moon=RISHABAM, saturn=KUMBAM)
    ev = evaluate_neecha_bhanga(BUDHAN, planet_rasi=chart, lagna_rasi=MITHUNAM)
    assert ev.self_reference_rules == {"NB-b", "NB-c"}
    assert ev.grade_points == 3 and ev.independent_points == 1
    assert ev.strength == "PARTIAL"
    results = detect_neecha_bhanga(chart, MITHUNAM)
    nbry = next(r for r in results if r.name == "NEECHA_BHANGA_RAJA_YOGA")
    assert nbry.is_present and nbry.strength == "PARTIAL"
    assert "nb_self_reference" in nbry.conditions_met


# ── O-22: the Moon as strict Gaja Kesari's support ──────────────────────────
def test_moon_in_the_fourth_or_tenth_from_guru_is_not_its_support() -> None:
    # Guru exalted in Kadagam (4th from Mesham). Chandran in Thulam: Guru is in
    # the 10th from Chandran, and Chandran's only aspect falls on Mesham.
    chart = _chart(jupiter=KADAGAM, moon=THULAM, sun=MEENAM, mercury=MEENAM, venus=MEENAM,
                   mars=MEENAM, saturn=MEENAM)
    result = detect_gaja_kesari_parashara(chart, MESHAM, THULAM, paksha_is_shukla=True)
    assert result.is_present is False


def test_strict_gaja_kesari_counts_a_kendra_from_lagna_without_the_moon() -> None:
    # Guru in Kadagam, a kendra from Mesham; Chandran in Kumbam (Guru is 6th
    # from it). Sukran joins Guru — the support is not the Moon at all.
    chart = _chart(jupiter=KADAGAM, venus=KADAGAM, moon=KUMBAM, mercury=MEENAM, sun=MEENAM)
    result = detect_gaja_kesari_parashara(chart, MESHAM, KUMBAM, paksha_is_shukla=True)
    assert result.is_present is True
    assert "jupiter_in_kendra_from_lagna" in result.conditions_met
    assert "jupiter_in_kendra_from_moon" not in result.conditions_met
    assert "jupiter_supported_by_benefic_venus" in result.conditions_met
