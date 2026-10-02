"""Golden fixtures for DOCTRINE_DECISIONS v1.3 (docs/DOCTRINE_DECISIONS_V1.2.md).

One synthetic chart per implemented decision (P0: DD-02, DD-03, DD-09; P1:
DD-05, DD-06, DD-07, DD-12, DD-15), the three DD-07 matrix fixtures from the
decision file — with the ownership status named `DUAL_LORD_YOGAKARAKA` — and one
test per open-item switch, proving each default equals the decision file's
"default until ruled" and that flipping it changes what it should.

Every chart here is a hand-built rasi map, not a person. Planets a test does not
need are parked where they cannot interfere, and the comment says why.
"""
from __future__ import annotations

import dataclasses

import pytest

from app.calculations._yoga_detect import (
    detect_adhi_base,
    detect_adhi_raja_grade,
    detect_bhagya_support,
    detect_gaja_kesari,
    detect_gaja_kesari_parashara,
    detect_lakshmi_yoga,
    detect_lakshmi_yoga_phaladeepika,
    detect_neecha_bhanga,
    detect_raja_yoga,
    detect_retrograde_debilitated_raja_yoga,
)
from app.calculations._yoga_dosham import detect_kalasarpa, detect_rahu_ketu_dosham, detect_sevvai_dosham
from app.calculations.aspects import effective_natural_class, moon_is_natural_benefic
from app.calculations.bhava_palan import build_palan, lord_dignity_of
from app.calculations.doctrine_options import (
    DEFAULT_DOCTRINE,
    LONGITUDE_EPSILON,
    OPEN_ITEMS,
    DoctrineOptions,
    validated,
)
from app.calculations.dosha_samyam import compare_marriage_doshams, rahu_ketu_samyam
from app.calculations.functional_nature import FUNCTIONAL_NATURE_TABLE
from app.calculations.functional_status import (
    ALL_LAGNAS,
    FUNCTIONAL_STATUS_MATRIX,
    MATRIX_SIGNED_OFF,
    SEVEN_SIGN_LORDS,
    FunctionalStatus,
    derive_status,
    functional_status,
    node_functional_context,
)
from app.calculations.lagna_lord_strength import DEBILITY_CAP, lagna_lord_strength
from app.calculations.neecha_bhanga import evaluate_neecha_bhanga
from app.calculations.yoga_activation import activation_tier, yoga_activation_score
from app.calculations.yogas import detect_yogas_and_doshams

pytestmark = pytest.mark.no_db

# The decision file's names for lagnas and grahas.
MESHAM, RISHABAM, MITHUNAM, KADAGAM, SIMMAM, KANNI = 1, 2, 3, 4, 5, 6
THULAM, VIRUCHIGAM, DHANUSU, MAGARAM, KUMBAM, MEENAM = 7, 8, 9, 10, 11, 12
SURYAN, CHANDRAN, SEVVAI, BUDHAN, GURU, SUKRAN, SANI = SEVEN_SIGN_LORDS
RAHU, KETU = "RAHU", "KETU"
YOGAKARAKA = FunctionalStatus.DUAL_LORD_YOGAKARAKA
NON_SIGN_LORD = FunctionalStatus.NON_SIGN_LORD


# ── DD-07: functional-status matrix (fixtures from the decision file) ────────
def test_lagna_lord_not_automatically_yogakaraka() -> None:
    assert YOGAKARAKA not in functional_status(MESHAM, SEVVAI)     # owns 1, 8
    assert YOGAKARAKA not in functional_status(MITHUNAM, BUDHAN)   # owns 1, 4
    assert YOGAKARAKA not in functional_status(DHANUSU, GURU)      # owns 1, 4
    assert YOGAKARAKA in functional_status(KADAGAM, SEVVAI)        # owns 5, 10
    assert YOGAKARAKA in functional_status(RISHABAM, SANI)         # owns 9, 10


def test_yogakaraka_whole_matrix() -> None:
    expected = {
        (RISHABAM, SANI), (KADAGAM, SEVVAI), (SIMMAM, SEVVAI),
        (THULAM, SANI), (MAGARAM, SUKRAN), (KUMBAM, SUKRAN),
    }
    found = {(lagna, p) for lagna in ALL_LAGNAS for p in SEVEN_SIGN_LORDS
             if YOGAKARAKA in functional_status(lagna, p)}
    assert found == expected


def test_nodes_rejected_by_matrix() -> None:
    for lagna in ALL_LAGNAS:
        for node in (RAHU, KETU):
            assert functional_status(lagna, node) == {NON_SIGN_LORD}
    with pytest.raises(ValueError):
        node_functional_context(MESHAM, SEVVAI, {SEVVAI: 1})


def test_matrix_is_84_static_cells_equal_to_their_derivation() -> None:
    assert len(FUNCTIONAL_STATUS_MATRIX) == 84
    for (lagna, planet), cell in FUNCTIONAL_STATUS_MATRIX.items():
        assert cell.statuses == derive_status(lagna, planet), (lagna, planet)
        assert cell.source, "every cell carries its source"
    assert MATRIX_SIGNED_OFF is False  # O-9: built, not signed


def test_lagna_lords_owning_a_kendra_are_lagna_lord_plus_kendra_neutral() -> None:
    for lagna, planet in ((MITHUNAM, BUDHAN), (KANNI, BUDHAN), (DHANUSU, GURU), (MEENAM, GURU)):
        statuses = functional_status(lagna, planet)
        assert {FunctionalStatus.LAGNA_LORD, FunctionalStatus.KENDRA_NEUTRAL} <= statuses
        assert YOGAKARAKA not in statuses


def test_legacy_functional_nature_agrees_on_the_six_yogakarakas() -> None:
    legacy = {(lagna, p) for lagna, row in FUNCTIONAL_NATURE_TABLE.items()
              for p, nature in row.items() if nature == "YOGAKARAKA"}
    matrix = {(lagna, p) for lagna in ALL_LAGNAS for p in SEVEN_SIGN_LORDS
              if YOGAKARAKA in functional_status(lagna, p)}
    assert legacy == matrix


def test_node_context_is_by_dispositor_and_association() -> None:
    ctx = node_functional_context(MESHAM, RAHU, {RAHU: 5, SURYAN: 5, SANI: 11})
    assert ctx.kind == "FUNCTION_BY_DISPOSITOR_AND_ASSOCIATION"
    assert (ctx.house, ctx.dispositor, ctx.conjunctions) == (5, SURYAN, (SURYAN,))
    assert SANI in ctx.aspected_by  # Sani's 7th from Kumbam lands on Simmam


def test_raja_yoga_twelfth_co_lord_is_not_downgraded() -> None:
    """DD-07: never downgrade for the 12th alone. Mesham lagna, Guru (9+12) with
    Chandran (4th lord) in Kadagam forms the yoga, graded QUALIFIED."""
    chart = {GURU: 4, CHANDRAN: 4, SURYAN: 11, SEVVAI: 11, BUDHAN: 11, SUKRAN: 11, SANI: 11}
    pair = [r for r in detect_raja_yoga(chart, MESHAM) if set(r.key_grahas) == {GURU, CHANDRAN}]
    assert pair and "raja_grade_qualified" in pair[0].conditions_met


# ── DD-03: Rahu–Ketu marriage axis ───────────────────────────────────────────
# Mesham lagna; nodes on 1/7. Planets not under test are parked where nothing
# touches the 7th, the nodes or Sukran (the 7th lord): Suriyan, Chandran, Budhan
# and Sani in Mithunam (aspects land on 5, 9, 12); Sevvai and Sukran in Kumbam
# (Sevvai's aspects land on 2, 5, 6); Guru in Rishabam (aspects 6, 8, 10). With
# no aggravation and no mitigation the axis reads Moderate.
_RK_BASE = {RAHU: 7, KETU: 1, SURYAN: 3, CHANDRAN: 3, SEVVAI: 11, BUDHAN: 3, GURU: 2, SUKRAN: 11, SANI: 3}


def _rk(moves: dict[str, int] | None = None):
    return detect_rahu_ketu_dosham({**_RK_BASE, **(moves or {})}, MESHAM)


def test_dd03_one_axis_finding_never_two_doshas() -> None:
    result = _rk()
    assert result.is_present is True
    assert [c for c in result.conditions_met if c.startswith("rahu_ketu_axis")] == ["rahu_ketu_axis_1_7"]


def test_dd03_formerly_uncancellable_axis_can_now_be_mitigated() -> None:
    """P0: the old `strong_affliction` veto made nivarthi impossible on every
    1/7 and 2/8 chart. Guru aspecting the node and the 7th, with no aggravation,
    takes a Moderate axis below Mild: mitigated, still present."""
    result = _rk({GURU: 11})  # Guru in Kumbam: 9th aspect on Thulam (7th), Rahu there
    assert {"guru_joins_or_aspects_node", "guru_aspects_seventh_or_its_lord"} <= set(result.cancellation_factors)
    assert result.is_present is True
    assert result.is_cancelled is True
    assert result.label == "RAHU_KETU_DOSHAM_WITH_NIVARTHI"


def test_dd03_aggravations_raise_the_grade_and_mitigations_lower_it() -> None:
    assert _rk().strength == "PARTIAL"
    assert _rk().label == "ACTIVE_RAHU_KETU_DOSHAM"
    aggravated = _rk({SUKRAN: 7})  # Venus joins Rahu in the 7th — and it is the 7th lord
    assert {"node_with_venus", "node_with_seventh_lord"} <= set(aggravated.conditions_met)
    assert aggravated.strength == "STRONG"
    assert aggravated.label == "STRONG_ACTIVE_RAHU_KETU_DOSHAM"


def test_dd03_houses_5_and_9_are_not_this_dosham() -> None:
    assert _rk({RAHU: 5, KETU: 11}).is_present is False
    assert _rk({RAHU: 9, KETU: 3}).is_present is False


def test_dd03_o1_moon_venus_reference_is_secondary_only() -> None:
    """O-1: from the Moon/Venus the check may raise severity, never create it."""
    no_axis = {**_RK_BASE, RAHU: 3, KETU: 9, CHANDRAN: 9}  # axis 7th from the Moon only
    assert detect_rahu_ketu_dosham(no_axis, MESHAM).is_present is False
    with_axis = {**_RK_BASE, CHANDRAN: 1}
    on = detect_rahu_ketu_dosham(with_axis, MESHAM)
    off = detect_rahu_ketu_dosham(with_axis, MESHAM, doctrine=DoctrineOptions(o1_rk_moon_venus_secondary=False))
    assert "node_afflicts_from_moon_or_venus" in on.conditions_met
    assert "node_afflicts_from_moon_or_venus" not in off.conditions_met


def test_dd03_samyam_and_off_by_default_cross_samyam() -> None:
    a = _rk()
    b = _rk({SUKRAN: 7})
    sevvai = detect_sevvai_dosham({**_RK_BASE, SEVVAI: 7}, MESHAM)
    assert rahu_ketu_samyam(a, a) is True
    assert rahu_ketu_samyam(_rk({GURU: 11}), a) is False  # a mitigated axis is not carried
    assert compare_marriage_doshams(a, b, sevvai, sevvai).rahu_ketu is True
    assert compare_marriage_doshams(a, None, None, sevvai).cross is False  # O-3 off
    on = DoctrineOptions(o3_cross_samyam=True)
    assert compare_marriage_doshams(a, None, None, sevvai, on).cross is True


# ── DD-02: Lakshmi ───────────────────────────────────────────────────────────
# Mesham lagna: the 9th lord is Guru, the lagna lord Sevvai.
_LK_SCORES = {SEVVAI: 75, GURU: 75, SUKRAN: 70}


def test_dd02_parashari_needs_kendra_and_dignity() -> None:
    present = detect_lakshmi_yoga({GURU: 4, SEVVAI: 1}, MESHAM, _LK_SCORES)
    assert present.is_present is True
    assert "ninth_lord_exalted" in present.conditions_met
    # Own sign but in a trikona (the 9th): not a kendra, so not Lakshmi.
    assert detect_lakshmi_yoga({GURU: 9, SEVVAI: 1}, MESHAM, _LK_SCORES).is_present is False
    # Kendra but no dignity (Guru in Thulam, the 7th): not Lakshmi, but Fortune support.
    no_dignity = {GURU: 7, SEVVAI: 1}
    assert detect_lakshmi_yoga(no_dignity, MESHAM, _LK_SCORES).is_present is False
    support = detect_bhagya_support(no_dignity, MESHAM, _LK_SCORES)
    assert support is not None and support.name == "BHAGYA_SUPPORT"


def test_dd02_debility_without_bhanga_caps_the_lagna_lord() -> None:
    """An unrelated high component must not carry a debilitated lord over 60.

    Rishabam lagna: Sukran (lagna lord) debilitated in Kanni with no bhanga —
    Budhan (lord of Kanni) and Guru (lord of Meenam, Sukran's exaltation sign)
    both sit outside every kendra from the Lagna and Chandran, and outside
    each other's kendras. Sani, the 9th lord, is in its own Kumbam, the 10th:
    everything else Lakshmi asks for is there."""
    planets = {SUKRAN: 6, BUDHAN: 1, GURU: 3, CHANDRAN: 2, SANI: 11}
    assert evaluate_neecha_bhanga(SUKRAN, planet_rasi=planets, lagna_rasi=RISHABAM).cancelled is False
    strength = lagna_lord_strength(RISHABAM, planets, {SUKRAN: 90})
    assert strength.debility_capped is True and strength.score == DEBILITY_CAP
    assert detect_lakshmi_yoga(planets, RISHABAM, {SUKRAN: 90, SANI: 80}).is_present is False
    # The same chart with Sukran in its own Thulam passes.
    healthy = {**planets, SUKRAN: 7}
    assert detect_lakshmi_yoga(healthy, RISHABAM, {SUKRAN: 90, SANI: 80}).is_present is True


def test_dd02_o8_threshold_is_a_switch() -> None:
    planets = {GURU: 4, SEVVAI: 1}
    scores = {SEVVAI: 62, GURU: 75}
    assert detect_lakshmi_yoga(planets, MESHAM, scores).is_present is True
    strict = DoctrineOptions(o8_lagna_lord_threshold=70)
    assert detect_lakshmi_yoga(planets, MESHAM, scores, doctrine=strict).is_present is False


def test_dd02_phaladeepika_variant_is_off_in_the_consumer_ui() -> None:
    chart = {GURU: 9, SUKRAN: 7, SEVVAI: 1, CHANDRAN: 3, SURYAN: 3, BUDHAN: 3, SANI: 3, RAHU: 3, KETU: 9}
    assert detect_lakshmi_yoga_phaladeepika(chart, MESHAM, _LK_SCORES) is not None
    default, _, _ = detect_yogas_and_doshams(chart, MESHAM, 3, planet_scores_in=_LK_SCORES)
    assert "LAKSHMI_YOGA_PHALADEEPIKA" not in {y.name for y in default}
    shown, _, _ = detect_yogas_and_doshams(
        chart, MESHAM, 3, planet_scores_in=_LK_SCORES,
        doctrine=DoctrineOptions(show_lakshmi_phaladeepika=True),
    )
    assert "LAKSHMI_YOGA_PHALADEEPIKA" in {y.name for y in shown}


# ── DD-09: neecha bhanga, one rule per verse ─────────────────────────────────
def _nb(planets: dict[str, int], lagna: int, options: DoctrineOptions = DEFAULT_DOCTRINE):
    return evaluate_neecha_bhanga(SANI, planet_rasi=planets, lagna_rasi=lagna, options=options)


# Thulam lagna, Sani debilitated in Mesham (the 7th). Sevvai, lord of Mesham,
# sits there too — in a kendra from the Lagna, joined not aspecting: NB-a only
# (NB-g restates it and adds no point). Chandran in Mithunam, Sukran in its own
# Rishabam, both clear of every other rule.
_NB_ONE = {SANI: 1, SEVVAI: 1, CHANDRAN: 3, SUKRAN: 2}
# Nothing cancels: Sevvai and Sukran outside every kendra from the Lagna and
# Chandran (here the same set) and outside each other's; Sevvai's aspects from
# Rishabam fall on 5, 8 and 9, not on Mesham. Sani itself is in a kendra.
_NB_NONE = {SANI: 1, SEVVAI: 2, CHANDRAN: 7, SUKRAN: 3}


def test_dd09_any_one_verse_cancels_and_is_recorded() -> None:
    """One rule is enough. NB-a, Phaladeepika 7.26."""
    evaluation = _nb(_NB_ONE, THULAM)
    assert evaluation.cancelled is True
    assert "nb_a_debilitation_lord_in_kendra" in evaluation.markers
    card = detect_neecha_bhanga(_NB_ONE, THULAM)[0]
    assert card.is_present is True and card.key_grahas == (SANI,)
    assert SEVVAI in card.secondary_grahas


def test_dd09_nb_e_is_gone() -> None:
    """The debilitated planet itself in a kendra is not in 7.26–30. Sani in
    Mesham is the 7th from Thulam — a kendra — and that alone cancels nothing."""
    assert _nb(_NB_NONE, THULAM).cancelled is False


def test_dd09_unlisted_conditions_are_o12_and_navamsa_is_o7() -> None:
    planets = {**_NB_NONE, SURYAN: 1}  # Suriya exalts in Mesham, in the 7th
    assert _nb(planets, THULAM).cancelled is False
    assert _nb(planets, THULAM, DoctrineOptions(o12_nb_unlisted_conditions=True)).cancelled is True
    d9 = evaluate_neecha_bhanga(SANI, planet_rasi=_NB_NONE,
                                lagna_rasi=THULAM, d9_rasi_map={SANI: 7}, d9_lagna_rasi=7)
    assert d9.cancelled is False
    d9_on = evaluate_neecha_bhanga(SANI, planet_rasi=_NB_NONE,
                                   lagna_rasi=THULAM, d9_rasi_map={SANI: 7}, d9_lagna_rasi=7,
                                   options=DoctrineOptions(o7_nb_navamsa=True))
    assert d9_on.cancelled is True


def test_dd09_one_condition_reads_mild_not_a_bare_raja_yoga() -> None:
    card = detect_neecha_bhanga(_NB_ONE, THULAM)[0]
    # NB-a and NB-g fire on the same placement; NB-g adds no point.
    assert {"nb_a_debilitation_lord_in_kendra", "nb_g_lord_in_kendra"} <= set(card.conditions_met)
    assert card.strength == "WEAK"


def test_dd09_o19_moon_as_its_own_reference() -> None:
    """Sevvai debilitated in Kadagam: the lord of Kadagam is Chandran, who is
    always in a kendra from itself. Literally read, NB-a always fires (the
    shipped behaviour, kept by default); O-19 can drop the self-reference."""
    planets = {SEVVAI: 4, CHANDRAN: 6, SANI: 12, GURU: 2}  # Mesham lagna; Chandran in the 6th
    literal = evaluate_neecha_bhanga(SEVVAI, planet_rasi=planets, lagna_rasi=MESHAM)
    assert "nb_a_debilitation_lord_in_kendra" in literal.markers
    strict = evaluate_neecha_bhanga(SEVVAI, planet_rasi=planets, lagna_rasi=MESHAM,
                                    options=DoctrineOptions(o19_nb_moon_self_reference=False))
    assert "nb_a_debilitation_lord_in_kendra" not in strict.markers


def test_dd09_o10_nbg_reference() -> None:
    """Sevvai in a kendra from the Moon only: NB-a fires (Lagna or Moon); NB-g
    reads the Lagna unless O-10 widens it."""
    planets = {SANI: 1, SEVVAI: 9, CHANDRAN: 6, SUKRAN: 6}  # Dhanusu is the 4th from Kanni
    lagna_only = _nb(planets, THULAM)
    assert "nb_g_lord_in_kendra" not in lagna_only.markers
    widened = _nb(planets, THULAM, DoctrineOptions(o10_nbg_reference="lagna_or_moon"))
    assert "nb_g_lord_in_kendra" in widened.markers


# ── DD-12: dynamic Moon and Mercury ──────────────────────────────────────────
@pytest.mark.parametrize(
    ("elongation", "benefic"),
    [(0.0, False), (360.0, False), (LONGITUDE_EPSILON / 2, False), (0.5, True),
     (179.5, True), (180.0, True), (180.0 + LONGITUDE_EPSILON / 2, True), (180.5, False), (359.5, False)],
)
def test_dd12_moon_boundaries_are_exact(elongation: float, benefic: bool) -> None:
    assert moon_is_natural_benefic(elongation) is benefic


def test_dd12_legacy_72_degree_flag() -> None:
    assert moon_is_natural_benefic(200.0) is False
    assert moon_is_natural_benefic(200.0, legacy_72_degree=True) is True
    assert moon_is_natural_benefic(30.0, legacy_72_degree=True) is False


def test_dd12_mercury_graded_by_the_stronger_side() -> None:
    chart = {BUDHAN: 3, GURU: 3, SANI: 3}
    assert effective_natural_class(BUDHAN, chart) == "MALEFIC"  # no scores: malefic wins
    assert effective_natural_class(BUDHAN, chart, planet_scores={GURU: 80, SANI: 40}) == "BENEFIC"
    assert effective_natural_class(BUDHAN, chart, planet_scores={GURU: 40, SANI: 80}) == "MALEFIC"
    assert effective_natural_class(BUDHAN, chart, planet_scores={GURU: 60, SANI: 60}) == "MALEFIC"
    assert effective_natural_class(BUDHAN, {BUDHAN: 3}) == "BENEFIC"


# ── DD-05 / DD-06: Sevvai ────────────────────────────────────────────────────
_SV = {SEVVAI: 7, CHANDRAN: 3, SUKRAN: 3, GURU: 3, SURYAN: 3, BUDHAN: 3, SANI: 3, RAHU: 3, KETU: 9}


def test_dd05_same_consumer_reading_for_both_genders() -> None:
    female = detect_sevvai_dosham(_SV, MESHAM, gender="female")
    male = detect_sevvai_dosham(_SV, MESHAM, gender="male")
    for field in ("is_present", "strength", "label", "conditions_met", "description_en", "description_ta"):
        assert getattr(female, field) == getattr(male, field), field
    assert "marriage-sensitive position" in female.description_en
    assert male.astrologer_markers == ("male_weighted_house_7_from_lagna",)


def test_dd06_cancer_leo_exception_mitigates_but_never_erases() -> None:
    """DD-06: the exception is the only mitigation here, so the dosham stays
    present and uncancelled — one grade lighter, never erased."""
    # Sevvai in Kadagam, the lagna itself (debilitated). Guru in Rishabam
    # aspects 6, 8 and 10 — neither Sevvai nor Sani (the 7th lord, in Mithunam).
    chart = {**_SV, SEVVAI: 4, GURU: 2}
    result = detect_sevvai_dosham(chart, KADAGAM)
    assert "tamil_sevvai_exception_cancer_leo" in result.cancellation_factors
    assert result.is_present is True
    assert result.is_cancelled is False, "the exception alone must not cancel"
    exempt = detect_sevvai_dosham(chart, KADAGAM, doctrine=DoctrineOptions(o6_sevvai_cancer_leo="full_exemption"))
    assert exempt.is_present is False
    assert "tamil_sevvai_exception_cancer_leo" in exempt.cancellation_factors


# ── DD-15: activation sets ───────────────────────────────────────────────────
def test_dd15_secondary_activator_is_moderate_only() -> None:
    assert activation_tier("NEECHA_BHANGA_RAJA_YOGA", is_present=True, maha=SEVVAI, antar=BUDHAN,
                           key_grahas=(SANI,), secondary_grahas=(SEVVAI,)) == "MODERATE"
    assert activation_tier("NEECHA_BHANGA_RAJA_YOGA", is_present=True, maha=GURU, antar=BUDHAN,
                           key_grahas=(SANI,), secondary_grahas=(SEVVAI,)) == "NONE"
    assert activation_tier("RAJA_YOGA", is_present=True, maha=GURU, antar=CHANDRAN,
                           key_grahas=(GURU, CHANDRAN), both_lords=True) == "STRONG"
    dormant = yoga_activation_score("NEECHA_BHANGA_RAJA_YOGA", True, "PARTIAL", GURU, BUDHAN, {},
                                    chart_key_grahas=(SANI,), chart_secondary_grahas=(SEVVAI,))
    lit = yoga_activation_score("NEECHA_BHANGA_RAJA_YOGA", True, "PARTIAL", SEVVAI, BUDHAN, {},
                                chart_key_grahas=(SANI,), chart_secondary_grahas=(SEVVAI,))
    assert lit > dormant


def test_dd15_formerly_dormant_yogas_now_carry_activators() -> None:
    chart = {CHANDRAN: 1, SANI: 2, GURU: 12, SURYAN: 5, SEVVAI: 5, BUDHAN: 5, SUKRAN: 5, RAHU: 1, KETU: 7}
    yogas, _, _ = detect_yogas_and_doshams(chart, MESHAM, 1)
    by_name = {y.name: y for y in yogas if y.is_present}
    assert by_name["SUNAPHA_YOGA"].key_grahas == (SANI,)
    assert by_name["ANAPHA_YOGA"].key_grahas == (GURU,)
    assert by_name["SUNAPHA_YOGA"].secondary_grahas == (CHANDRAN,)  # O-16 default
    off, _, _ = detect_yogas_and_doshams(chart, MESHAM, 1, doctrine=DoctrineOptions(o16_moon_secondary_activator=False))
    assert next(y for y in off if y.name == "SUNAPHA_YOGA").secondary_grahas == ()


# ── open items ───────────────────────────────────────────────────────────────
def test_every_open_item_o1_to_o23_is_recorded() -> None:
    ids = {item.item_id for item in OPEN_ITEMS}
    assert {f"O-{n}" for n in range(1, 24)} <= ids
    for item in OPEN_ITEMS:
        if item.status == "FLAGGED":
            assert item.option in {f.name for f in dataclasses.fields(DoctrineOptions)}, item.item_id


def test_defaults_are_the_decision_files_defaults() -> None:
    d = DEFAULT_DOCTRINE
    assert d.o1_rk_moon_venus_secondary is True        # secondary, severity only
    assert d.o3_cross_samyam is False                  # off
    assert d.o4_twelfth_colord_mode == "contextual"    # CONTEXTUAL_12TH
    assert d.o5_gk_base_nb_guru == "graded"
    assert d.o6_sevvai_cancer_leo == "strong_mitigation"
    assert d.o7_nb_navamsa is False                    # excluded
    assert d.o8_lagna_lord_threshold == 60
    assert d.o10_nbg_reference == "lagna"
    assert d.o2_node_dignity_mode == "disabled"         # no lineage assumed
    assert d.o11_retrograde_debilitated_raja_yoga is False
    assert d.o12_nb_unlisted_conditions is False       # excluded
    assert d.o13_nb_verses_give_raja_yoga is True
    assert d.o15_raja_one_way_aspect is False          # mutual only
    assert d.o16_moon_secondary_activator is True      # DD-15 table
    assert d.o17_bhagya_support_scope == "literal"
    assert d.o18_aries_scorpio_sevvai == "full_cancellation"
    assert d.o19_nb_moon_self_reference is True        # literal
    assert d.o20_adhi_raja_malefic_aspects is False    # occupants only
    assert d.o21_nb_planet_as_own_lord is False        # DD-09 deleted NB-e
    assert d.o22_gk_moon_as_support is True            # literal DD-01/DD-12
    assert d.o23_six_eight_colord_mode == "moolatrikona"  # 2026-09-23 ruling
    assert d.moon_72_degree_convention is False
    assert d.show_lakshmi_phaladeepika is False


def test_an_unimplemented_flag_value_is_refused() -> None:
    with pytest.raises(ValueError):
        validated(DoctrineOptions(o6_sevvai_cancer_leo="full"))


def test_admin_flags_build_the_same_options_as_the_default() -> None:
    from app.services.feature_flags import current_doctrine_options

    assert current_doctrine_options() == DEFAULT_DOCTRINE


# DD-01 / DD-08 / DD-10 and residual audit closures (2026-10-01).
def test_dd01_strict_gaja_kesari_hides_the_supportive_base_label() -> None:
    chart = {
        CHANDRAN: 1, GURU: 1, SUKRAN: 1, SURYAN: 3, SEVVAI: 3,
        BUDHAN: 3, SANI: 3, RAHU: 5, KETU: 11,
    }
    strict = detect_gaja_kesari_parashara(chart, MESHAM, MESHAM)
    base = detect_gaja_kesari(chart, MESHAM, lagna_rasi=MESHAM,
                              strict_form_present=strict.is_present)
    assert strict.is_present is True  # same sign is the first kendra
    assert strict.key_grahas == (GURU, CHANDRAN)
    assert base.is_present is False


def test_dd01_strict_form_never_uses_neecha_bhanga_as_a_rescue_and_o5_is_switchable() -> None:
    # Guru is debilitated in Magaram, a kendra from both Mesham Lagna and
    # Thulam Moon. Sani in Mesham supplies a canonical neecha-bhanga condition.
    chart = {GURU: 10, CHANDRAN: 7, SANI: 1, SUKRAN: 10, SURYAN: 3,
             SEVVAI: 3, BUDHAN: 3, RAHU: 5, KETU: 11}
    assert evaluate_neecha_bhanga(GURU, planet_rasi=chart, lagna_rasi=MESHAM).cancelled
    assert not detect_gaja_kesari_parashara(chart, MESHAM, 7).is_present
    graded = detect_gaja_kesari(chart, 7, lagna_rasi=MESHAM)
    suppressed = detect_gaja_kesari(
        chart, 7, lagna_rasi=MESHAM,
        doctrine=DoctrineOptions(o5_gk_base_nb_guru="suppressed"),
    )
    assert graded.is_present is True and graded.strength != "STRONG"
    assert suppressed.is_present is False


def test_dd08_adhi_base_accepts_one_dynamic_benefic_and_raja_grade_is_clean_only() -> None:
    clean = {CHANDRAN: 1, GURU: 6, SURYAN: 1, SEVVAI: 1, BUDHAN: 1,
             SUKRAN: 1, SANI: 1, RAHU: 1, KETU: 1}
    base = detect_adhi_base(clean, 1, {})
    raja = detect_adhi_raja_grade(clean, 1)
    assert base.is_present and "adhi_single_planet_sufficiency" in base.conditions_met
    assert base.key_grahas == (GURU,) and base.secondary_grahas == (CHANDRAN,)
    assert raja.is_present and raja.key_grahas == (GURU,)

    contaminated = {**clean, SANI: 6}
    dirty_base = detect_adhi_base(contaminated, 1, {})
    assert dirty_base.is_present and "adhi_purity_mixed" in dirty_base.conditions_met
    assert not detect_adhi_raja_grade(contaminated, 1).is_present
    assert not detect_adhi_raja_grade(clean, 1, combust_planets=frozenset({GURU})).is_present


def test_dd08_o20_controls_malefic_aspect_scope_only_for_raja_grade() -> None:
    chart = {CHANDRAN: 1, GURU: 6, SANI: 4, SURYAN: 1, SEVVAI: 1,
             BUDHAN: 1, SUKRAN: 1, RAHU: 1, KETU: 1}
    assert detect_adhi_raja_grade(chart, 1).is_present
    assert not detect_adhi_raja_grade(chart, 1, include_malefic_aspects=True).is_present


def test_dd10_kalasarpa_uses_the_shared_float_epsilon_for_node_boundaries() -> None:
    rasis = {p: 1 for p in (SURYAN, CHANDRAN, SEVVAI, BUDHAN, GURU, SUKRAN, SANI, RAHU)}
    rasis[KETU] = 7
    on_node = {p: LONGITUDE_EPSILON / 2 for p in (SURYAN, CHANDRAN, SEVVAI, BUDHAN, GURU, SUKRAN, SANI)}
    on_node.update({RAHU: 0.0, KETU: 180.0})
    result = detect_kalasarpa(rasis, longitudes=on_node)
    assert result.is_present
    assert "graha_on_node_SUN" in result.conditions_met
    beyond = {**on_node, SURYAN: LONGITUDE_EPSILON * 2}
    assert "graha_on_node_SUN" not in detect_kalasarpa(rasis, longitudes=beyond).conditions_met


def test_bhava_palan_and_neecha_bhanga_agree_when_o12_changes() -> None:
    planets = {**_NB_NONE, SURYAN: 1}
    off = lord_dignity_of(SANI, THULAM, planets)
    on_options = DoctrineOptions(o12_nb_unlisted_conditions=True)
    on = lord_dignity_of(SANI, THULAM, planets, doctrine=on_options)
    assert off.bhanga is False and on.bhanga is True
    palan = build_palan(4, THULAM, planets, {SANI: 50}, 45, doctrine=on_options)
    assert palan.lord_dignity.bhanga is True


def test_sevvai_residual_aggravations_are_conditions_and_raise_strength() -> None:
    chart = {SEVVAI: 4, CHANDRAN: 8, SUKRAN: 8, GURU: 2,
             SURYAN: 5, BUDHAN: 5, SANI: 5, RAHU: 9, KETU: 3}
    base = detect_sevvai_dosham(chart, MITHUNAM)
    combust = detect_sevvai_dosham(chart, MITHUNAM, combust_planets=frozenset({SEVVAI}))
    joined = detect_sevvai_dosham({**chart, SANI: 4}, MITHUNAM)
    assert "mars_combust" in combust.conditions_met
    assert "mars_combust" not in combust.cancellation_factors
    assert "mars_joined_saturn_or_rahu" in joined.conditions_met
    assert "mars_joined_saturn_or_rahu" not in joined.cancellation_factors
    assert base.strength == "PARTIAL"
    assert combust.strength == joined.strength == "STRONG"


# O-2 / O-11 / O-17 / O-18 executable, dormant doctrine branches.
def test_o2_requires_an_explicit_lineage_and_sign_list() -> None:
    with pytest.raises(ValueError, match="o2_node_dignity_source"):
        validated(DoctrineOptions(
            o2_node_dignity_mode="explicit_signs",
            o2_rahu_favourable_rasis=(THULAM,),
        ))
    with pytest.raises(ValueError, match="integer from 1 to 12"):
        validated(DoctrineOptions(o2_rahu_favourable_rasis=(13,)))

    default = detect_rahu_ketu_dosham(_RK_BASE, MESHAM)
    ruled = detect_rahu_ketu_dosham(
        _RK_BASE,
        MESHAM,
        doctrine=validated(DoctrineOptions(
            o2_node_dignity_mode="explicit_signs",
            o2_node_dignity_source="synthetic-practitioner-fixture",
            o2_rahu_favourable_rasis=(THULAM,),
        )),
    )
    assert "node_in_favourable_sign_lineage" not in default.cancellation_factors
    assert "node_in_favourable_sign_lineage" in ruled.cancellation_factors


def test_o11_is_separate_off_by_default_and_enforces_each_gate() -> None:
    chart = {SANI: MESHAM}
    enabled = DoctrineOptions(o11_retrograde_debilitated_raja_yoga=True)
    assert detect_retrograde_debilitated_raja_yoga(
        chart, THULAM, retrograde_planets=frozenset({SANI}),
    ) == []
    result = detect_retrograde_debilitated_raja_yoga(
        chart, THULAM, retrograde_planets=frozenset({SANI}), doctrine=enabled,
    )
    assert len(result) == 1
    assert result[0].name == "RETROGRADE_DEBILITATED_RAJA_YOGA"
    assert "bright_rays_engine_non_combust" in result[0].conditions_met
    assert detect_retrograde_debilitated_raja_yoga(
        chart, THULAM, retrograde_planets=frozenset({SANI}),
        combust_planets=frozenset({SANI}), doctrine=enabled,
    ) == []
    assert detect_retrograde_debilitated_raja_yoga(
        chart, KANNI, retrograde_planets=frozenset({SANI}), doctrine=enabled,
    ) == []  # Mesham is the 8th house from Kanni.


def test_o17_can_label_dignified_but_incomplete_lakshmi_cases() -> None:
    broad = DoctrineOptions(o17_bhagya_support_scope="all_incomplete_lakshmi")
    trikona_chart = {GURU: DHANUSU, SEVVAI: MESHAM}
    assert detect_bhagya_support(trikona_chart, MESHAM, _LK_SCORES) is None
    support = detect_bhagya_support(
        trikona_chart, MESHAM, _LK_SCORES, doctrine=broad,
    )
    assert support is not None
    assert "ninth_lord_own_sign" in support.conditions_met
    assert "ninth_lord_not_in_lakshmi_kendra" in support.conditions_met

    weak_lagna_lord = {GURU: KADAGAM, SEVVAI: MESHAM}
    low_scores = {SEVVAI: 20, GURU: 75}
    support = detect_bhagya_support(
        weak_lagna_lord, MESHAM, low_scores, doctrine=broad,
    )
    assert support is not None
    assert "lagna_lord_below_baladhya_threshold" in support.conditions_met
    assert detect_bhagya_support(
        weak_lagna_lord, MESHAM, _LK_SCORES, doctrine=broad,
    ) is None  # This is full Lakshmi Yoga, not fallback support.


def test_o18_switches_mesham_viruchigam_exception_posture() -> None:
    # Viruchigam lagna, Sevvai in the 2nd: the O-18 exception applies without
    # the separate own-sign mitigation that a Mesham-lagna fixture would add.
    chart = {
        SEVVAI: DHANUSU, CHANDRAN: SIMMAM, SUKRAN: SIMMAM,
        GURU: RISHABAM, SURYAN: MITHUNAM, BUDHAN: MITHUNAM, SANI: MITHUNAM,
        RAHU: KANNI, KETU: MEENAM,
    }
    cancelled = detect_sevvai_dosham(chart, VIRUCHIGAM)
    mitigated = detect_sevvai_dosham(
        chart, VIRUCHIGAM,
        doctrine=DoctrineOptions(o18_aries_scorpio_sevvai="strong_mitigation"),
    )
    assert "mars_lagna_lord_mitigation" in cancelled.cancellation_factors
    assert cancelled.is_cancelled is True
    assert mitigated.is_present is True
    assert mitigated.is_cancelled is False


# ── 2026-10-02 review fixes ──────────────────────────────────────────────────
def test_dd03_surplus_aggravations_cannot_absorb_mitigations() -> None:
    """DD-03: +1 grade per aggravation up to Strong, then −1 per mitigation.

    Mesham lagna; Ketu with Chandran in the lagna, Rahu in Thulam. Three
    aggravations (Moon with a node, a malefic on the 7th, the O-1 from-Moon
    check) against all three default mitigations: Guru from Kumbam aspects
    Rahu and the 7th, and Sukran, the 7th lord, sits clean in the 4th. Summing
    first (1 + 3 − 3) left it Moderate, so no two-aggravation chart could ever
    reach nivarthi — the P0 "uncancellable" defect by arithmetic."""
    chart = {RAHU: 7, KETU: 1, CHANDRAN: 1, SUKRAN: 4, GURU: 11,
             SURYAN: 3, BUDHAN: 3, SANI: 3, SEVVAI: 11}
    result = detect_rahu_ketu_dosham(chart, MESHAM)
    assert len(result.conditions_met) - 1 == 3
    assert len(result.cancellation_factors) == 3
    assert result.is_cancelled is True
    assert result.label == "RAHU_KETU_DOSHAM_WITH_NIVARTHI"


def test_dd03_each_mitigation_lowers_a_strong_axis_one_grade() -> None:
    """Sukran (7th lord) with Rahu counts three ways — 7th lord, Venus, and O-1
    from Venus. Two Guru mitigations still move the grade: Strong → Mild."""
    chart = {RAHU: 7, KETU: 1, SURYAN: 3, CHANDRAN: 3, SEVVAI: 11,
             BUDHAN: 3, GURU: 11, SUKRAN: 7, SANI: 3}
    result = detect_rahu_ketu_dosham(chart, MESHAM)
    assert len(result.cancellation_factors) == 2
    assert result.strength == "WEAK" and result.is_cancelled is False


def test_o21_budhan_is_not_its_own_cancelling_lord() -> None:
    """Budhan debilitated in Meenam, the 10th from Mithunam. Budhan rules Kanni,
    its own exaltation sign, so NB-b read literally is NB-e — deleted by DD-09.
    Guru (lord of Meenam) sits in the 3rd from the Lagna and 2nd from Chandran."""
    planets = {BUDHAN: MEENAM, GURU: SIMMAM, CHANDRAN: KADAGAM}
    default = evaluate_neecha_bhanga(BUDHAN, planet_rasi=planets, lagna_rasi=MITHUNAM)
    assert default.cancelled is False
    literal = evaluate_neecha_bhanga(BUDHAN, planet_rasi=planets, lagna_rasi=MITHUNAM,
                                     options=DoctrineOptions(o21_nb_planet_as_own_lord=True))
    assert "nb_b_exaltation_lord_in_kendra" in literal.markers
    assert literal.cancelling_grahas == ()  # nothing but Budhan itself


def test_o22_moon_as_gaja_kesari_support_is_switchable() -> None:
    # Guru exalted in Kadagam, the 4th from Mesham; a waxing Chandran in Magaram
    # aspects it and is the only benefic touching Guru.
    chart = {GURU: KADAGAM, CHANDRAN: MAGARAM, SURYAN: MEENAM, SEVVAI: MEENAM,
             BUDHAN: MEENAM, SUKRAN: MEENAM, SANI: MEENAM, RAHU: KANNI, KETU: MEENAM}
    literal = detect_gaja_kesari_parashara(chart, MESHAM, MAGARAM, paksha_is_shukla=True)
    assert literal.is_present is True
    assert "jupiter_supported_by_benefic_moon" in literal.conditions_met
    strict = detect_gaja_kesari_parashara(chart, MESHAM, MAGARAM, paksha_is_shukla=True,
                                          moon_counts_as_support=False)
    assert strict.is_present is False


def test_o23_six_eight_co_lords_and_the_matrix_feed_raja_yoga() -> None:
    """Kadagam lagna: Guru owns the 6th and the 9th. The 2026-09-23 moolatrikona
    test (Dhanusu is the 6th) shuts the 9th lord out of every Raja Yoga; O-23's
    alternative lets lordship decide and grades the pair MIXED."""
    chart = {GURU: MEENAM, CHANDRAN: MEENAM, SURYAN: RISHABAM, SEVVAI: RISHABAM,
             BUDHAN: RISHABAM, SUKRAN: RISHABAM, SANI: RISHABAM}

    def pair(options: DoctrineOptions):
        return [r for r in detect_raja_yoga(chart, KADAGAM, doctrine=options)
                if set(r.key_grahas) == {GURU, CHANDRAN}]

    assert pair(DEFAULT_DOCTRINE) == []
    lordship = pair(DoctrineOptions(o23_six_eight_colord_mode="lordship_only"))
    assert lordship and "raja_grade_mixed" in lordship[0].conditions_met


def test_dd08_one_adhi_card_when_the_raja_grade_forms() -> None:
    clean = {CHANDRAN: 1, GURU: 6, SURYAN: 1, SEVVAI: 1, BUDHAN: 1,
             SUKRAN: 1, SANI: 1, RAHU: 1, KETU: 1}
    yogas, _, _ = detect_yogas_and_doshams(clean, MESHAM, 1)
    present = {y.name for y in yogas if y.is_present}
    assert "ADHI_RAJA_GRADE" in present
    assert "ADHI_BASE" not in present
    contaminated, _, _ = detect_yogas_and_doshams({**clean, SANI: 6}, MESHAM, 1)
    present = {y.name for y in contaminated if y.is_present}
    assert "ADHI_BASE" in present and "ADHI_RAJA_GRADE" not in present


def test_set_flag_validates_doctrine_values_before_storing(monkeypatch) -> None:
    from app.services import feature_flags as ff

    monkeypatch.setattr(ff, "_overrides", {})
    with pytest.raises(ff.FlagValueError):
        ff.set_flag("doctrine_o6_sevvai_cancer_leo", "full")
    with pytest.raises(ff.FlagValueError):
        ff.set_flag("doctrine_o8_lagna_lord_threshold", True)  # bool is not an int here
    with pytest.raises(ff.UnknownFlagError):
        ff.set_flag("doctrine_nope", True)
    ff.set_flag("doctrine_o2_ketu_favourable_rasis", [9, 12])
    assert ff.get_flag("doctrine_o2_ketu_favourable_rasis") == (9, 12)
    assert ff.current_doctrine_options().o2_ketu_favourable_rasis == (9, 12)


def test_doctrine_runtime_override_follows_worker_count(monkeypatch) -> None:
    from app.services.feature_flags import doctrine_runtime_override_allowed

    monkeypatch.delenv("WEB_CONCURRENCY", raising=False)
    assert doctrine_runtime_override_allowed() is True
    monkeypatch.setenv("WEB_CONCURRENCY", "2")
    assert doctrine_runtime_override_allowed() is False
