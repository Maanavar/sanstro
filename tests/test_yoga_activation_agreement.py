"""A yoga's "is it running" flag and its activation score must never disagree.

Reported 2026-09-23: a chart read Gaja Kesari, Hamsa and Vipareetha Raja Yoga
as "Active" with the dormant score 34/100 beside each. The detectors decided
activation against Maha + Antar + *Pratyantar* lords; `yoga_activation_score`
against Maha + Antar only. A Guru Pratyantar lit all three flags while the score
correctly called them dormant.

The property is swept over many charts rather than asserted on one, because
which yoga a given dasha lights is chart-specific — a single fixture proves
nothing about the next chart.
"""
from __future__ import annotations

from datetime import date, time

import pytest

from app.calculations._yoga_detect import (
    AMALA_AFFLICTING_MALEFICS,
    _merge_yoga_list,
    detect_adhi_yoga,
    detect_amala_yoga,
    detect_raja_yoga,
    detect_raja_yogakaraka,
)
from app.calculations._yoga_helpers import YogaResult, raja_lord_qualifies
from app.calculations.dasha import DashaPeriod
from app.calculations.yoga_activation import BOTH_LORDS_STEP, key_planets_for, yoga_activation_score
from app.services._chart_build import _chart_response_from_profile, _yoga_timing

_DORMANT_BASE = {"STRONG": 75, "MODERATE": 55, "PARTIAL": 40, "WEAK": 25}


def _synthetic_profile(birth: date, hour: int):
    class _SyntheticProfile:
        birth_profile_id = None
        display_name = "Synthetic Test Subject"
        birth_date_local = birth
        birth_time_local = time(hour, 15)
        birth_latitude = 13.0827
        birth_longitude = 80.2707
        birth_timezone = "Asia/Kolkata"
        birth_city = "Chennai"
        birth_state = "Tamil Nadu"
        birth_country = "India"
        birth_place = "Chennai, Tamil Nadu, India"
        gender = None
        gender_for_traditional_rules = None
        birth_time_accuracy = "exact"
        deleted_at = None
        relationship = None
        notes = None
        created_at = None
        updated_at = None

    return _SyntheticProfile()


# 36 synthetic births spread over ~70 years and the day, so the running
# Mahadasha/Antardasha/Pratyantar lords and the present yogas all vary.
_BIRTHS = [(date(1952 + 2 * i, 1 + (i * 5) % 12, 1 + (i * 7) % 27), (i * 5) % 24) for i in range(36)]


@pytest.mark.no_db
def test_active_flag_and_score_agree_across_charts() -> None:
    checked = 0
    active_seen = 0
    for birth, hour in _BIRTHS:
        data = _chart_response_from_profile(_synthetic_profile(birth, hour), "v1").data
        for y in data.yogas:
            if not y.is_present:
                continue
            dormant = round(_DORMANT_BASE.get(y.strength, 50) * 0.45)
            checked += 1
            active_seen += y.is_currently_active
            assert y.is_currently_active == y.dasha_activated, y.name
            # Antaram never activates on its own: a peak window only ever sits
            # inside a period a Maha/Antar lord has already opened.
            if y.peak_window is not None:
                assert y.is_currently_active, f"{y.name}: peak window on a dormant yoga"
            if y.is_currently_active:
                assert y.activation_score != dormant, (
                    f"{birth} {hour}h: {y.name} reads active but scores the dormant {dormant}"
                )
            else:
                assert y.activation_score == dormant, (
                    f"{birth} {hour}h: {y.name} reads dormant but scores {y.activation_score}"
                )
    # The sweep must actually exercise both sides of the property.
    assert checked > 100
    assert active_seen > 5


def test_score_takes_the_callers_verdict() -> None:
    """Handing the score the published flag is what keeps the two in step."""
    common = dict(
        yoga_name="GAJA_KESARI_YOGA",
        yoga_is_present=True,
        yoga_strength="STRONG",
        mahadasha_lord="SUN",
        antardasha_lord="KETU",
        planet_scores={"JUPITER": 80, "MOON": 60},
    )
    assert yoga_activation_score(**common) == 34  # no key graha running
    assert yoga_activation_score(**common, activated=False) == 34
    assert yoga_activation_score(**common, activated=True) > 34


def test_amala_and_adhi_trigger_on_their_occupying_benefics() -> None:
    """Both flags were a functional-nature test (does a benefic here lord a
    trikona?) that reads no dasha. Ruling 2026-09-23: the triggers are the
    benefics that *occupy* the houses — never the house lord, and for Adhi never
    Chandran, who is only the reference point."""
    nature = {"JUPITER": "TRIKONA", "VENUS": "YOGAKARAKA", "MERCURY": "TRIKONA"}
    # Lagna Mesha (1), Moon Mesha (1): 10th is Makara (10), lorded by Sani.
    amala = detect_amala_yoga({"JUPITER": 10, "VENUS": 10, "MOON": 1, "SUN": 5}, 1, 1, nature)
    assert amala.is_present and amala.dasha_activated is False
    assert set(amala.key_grahas) == {"JUPITER", "VENUS"}
    # Moon in Mesha: 6th/7th/8th are Kanni/Thulam/Vrischikam (6/7/8).
    adhi = detect_adhi_yoga({"JUPITER": 6, "VENUS": 7, "MERCURY": 8, "MOON": 1, "SUN": 8}, 1, nature)
    assert adhi.is_present and adhi.dasha_activated is False
    assert "MOON" not in adhi.key_grahas and set(adhi.key_grahas) <= {"JUPITER", "VENUS", "MERCURY"}
    assert adhi.key_grahas
    # Their score now follows those formers, not a dormant cap.
    assert key_planets_for("AMALA_YOGA", amala.key_grahas) == list(amala.key_grahas)


def test_raja_yoga_triggers_on_its_own_pair_not_a_fixed_list() -> None:
    """Ruling 2026-09-23: each Raja Yoga instance activates on the two lords
    that form it. Mesha lagna: 5th lord Suriya (trikona), 4th lord Chandran
    (kendra), conjunct in Simha → one instance, formed by Suriya + Chandran."""
    results = detect_raja_yoga({"SUN": 5, "MOON": 5, "MARS": 3, "JUPITER": 2, "VENUS": 11,
                                "MERCURY": 12, "SATURN": 8}, 1, active_lords={"SATURN"})
    pair = next(r for r in results if set(r.key_grahas) == {"SUN", "MOON"})
    assert pair.dasha_activated is False  # Sani runs; Sani did not form it
    # A merged card activates on the union of its instances' formers only.
    merged = _merge_yoga_list(results, "RAJA_YOGA")
    assert set(merged.key_grahas) == {g for r in results for g in r.key_grahas}
    # …and keeps each instance's pair, which the "both lords" step needs.
    assert {frozenset(g) for g in merged.former_groups} == {frozenset(r.key_grahas) for r in results}


# ── Ruling 2026-09-23 (second pass): tiers, peak window, yogakaraka, Amala ──

def _antaram(lord: str) -> DashaPeriod:
    return DashaPeriod(
        level="pratyantar", lord=lord, start_jd=0.0, end_jd=1.0,
        start_date=date(2026, 9, 1), end_date=date(2026, 10, 20), sequence_index=0,
    )


def _raja(*pairs: tuple[str, str]):
    return _merge_yoga_list(
        [YogaResult(
            name="RAJA_YOGA", is_present=True, strength="STRONG", conditions_met=[],
            cancellation_factors=[], dasha_activated=False, description_ta="",
            description_en="", key_grahas=pair,
        ) for pair in pairs],
        "RAJA_YOGA",
    )


def test_strong_tier_is_a_fixed_capped_step() -> None:
    common = dict(
        yoga_name="GAJA_KESARI_YOGA", yoga_is_present=True, yoga_strength="STRONG",
        mahadasha_lord="JUPITER", antardasha_lord="MOON", planet_scores={"JUPITER": 60, "MOON": 60},
    )
    moderate = yoga_activation_score(**common, activated=True)
    strong = yoga_activation_score(**common, activated=True, both_lords=True)
    assert strong == moderate + BOTH_LORDS_STEP  # additive, not a multiplier
    capped = dict(common, planet_scores={"JUPITER": 100, "MOON": 100})
    assert yoga_activation_score(**capped, activated=True, both_lords=True) <= 100
    # A dormant yoga never earns the step, whatever the caller claims.
    assert yoga_activation_score(**common, activated=False, both_lords=True) == 34


def test_strong_tier_needs_both_lords_in_the_same_instance() -> None:
    card = _raja(("SUN", "MOON"), ("JUPITER", "SATURN"))
    both, _ = _yoga_timing(card, maha="SUN", antar="JUPITER", antaram=_antaram("KETU"))
    assert both is False  # each formed a *different* instance
    both, _ = _yoga_timing(card, maha="SUN", antar="MOON", antaram=_antaram("KETU"))
    assert both is True


def test_own_bhukti_is_moderate_not_strong() -> None:
    """Amendment 2026-09-23: Strong needs two *distinct* formers. Swa-bhukti
    classically gives mixed results, so a single-former yoga never reaches it."""
    card = _raja(("SUN", "MOON"))
    both, _ = _yoga_timing(card, maha="SUN", antar="SUN", antaram=_antaram("KETU"))
    assert both is False
    yogakaraka = detect_raja_yogakaraka({"SATURN": 11, "SUN": 3}, 7, active_lords={"SATURN"})
    both, _ = _yoga_timing(yogakaraka, maha="SATURN", antar="SATURN", antaram=_antaram("KETU"))
    assert both is False


def test_peak_window_is_an_antaram_former_inside_an_open_period() -> None:
    card = _raja(("SUN", "MOON"), ("JUPITER", "SATURN"))
    _, window = _yoga_timing(card, maha="SUN", antar="KETU", antaram=_antaram("MOON"))
    assert window is not None and window.antaram_lord == "MOON"
    assert (window.start, window.end) == (date(2026, 9, 1), date(2026, 10, 20))
    # Antaram lord formed a different instance from the activating lord: no peak.
    _, window = _yoga_timing(card, maha="SUN", antar="KETU", antaram=_antaram("SATURN"))
    assert window is None
    # And it serialises under the camelCase wire name.
    _, window = _yoga_timing(card, maha="SUN", antar="KETU", antaram=_antaram("MOON"))
    assert window.model_dump(by_alias=True, mode="json") == {
        "start": "2026-09-01", "end": "2026-10-20", "antaramLord": "MOON",
    }


def test_dusthana_dual_lords_are_decided_by_moolatrikona() -> None:
    assert raja_lord_qualifies(3, "SATURN") is True     # Mithuna: MT Kumbam is the 9th
    assert raja_lord_qualifies(4, "JUPITER") is False   # Kataka: MT Dhanusu is the 6th
    assert raja_lord_qualifies(2, "MARS") is False      # Rishabha: MT Mesham is the 12th
    # Lagna ownership decides first (amendment): MT Thulam / Mesham is the 6th,
    # yet the lagna lord qualifies.
    assert raja_lord_qualifies(2, "VENUS") is True      # Rishabha lagna
    assert raja_lord_qualifies(8, "MARS") is True       # Vrischika lagna
    assert raja_lord_qualifies(1, "SUN") is True        # owns no dusthana


def test_disqualified_lord_forms_no_raja_yoga() -> None:
    """Kataka lagna: Guru lords the 9th but its moolatrikona is the 6th. Guru
    conjunct Chandran (lagna lord) would have formed a Raja Yoga before."""
    results = detect_raja_yoga({"JUPITER": 1, "MOON": 1, "SUN": 11, "MARS": 11,
                                "MERCURY": 11, "VENUS": 11, "SATURN": 11}, 4)
    assert not any("JUPITER" in r.key_grahas for r in results)


def test_rahu_ketu_support_but_never_form_a_raja_yoga() -> None:
    # Mesha lagna: Suriya (5th lord) + Chandran (4th lord) in Simha, Rahu with them.
    results = detect_raja_yoga({"SUN": 5, "MOON": 5, "RAHU": 5, "KETU": 11, "MARS": 3,
                                "MERCURY": 12, "JUPITER": 2, "VENUS": 11, "SATURN": 8}, 1,
                               active_lords={"RAHU"})
    pair = next(r for r in results if set(r.key_grahas) == {"SUN", "MOON"})
    assert pair.supporting_grahas == ("RAHU",)
    assert "RAHU" not in pair.key_grahas and pair.dasha_activated is False


@pytest.mark.parametrize(
    ("saturn_rasi", "combust", "strength", "affliction"),
    [
        (11, frozenset(), "STRONG", None),                                 # Thulam lagna, Sani in the 5th (Kumbam)
        (1, frozenset(), "PARTIAL", "saturn_yogakaraka_debilitated"),      # debilitated in Mesham
        (12, frozenset(), "PARTIAL", "saturn_yogakaraka_in_dusthana_6"),   # 6th from Thulam
        (11, frozenset({"SATURN"}), "PARTIAL", "saturn_yogakaraka_combust"),
    ],
)
def test_yogakaraka_forms_by_ownership_and_affliction_only_weakens(
    saturn_rasi, combust, strength, affliction,
) -> None:
    # Owner ruling on the native-Tamil review, 2026-09-23: ownership makes the
    # yogakaraka; debility, combustion or 6/8/12 lower it one rung, never remove it.
    result = detect_raja_yogakaraka({"SATURN": saturn_rasi, "SUN": 3}, 7,
                                    combust_planets=combust, active_lords={"SATURN"})
    assert result.name == "YOGAKARAKA_RAJA_YOGA"
    assert result.is_present is True
    assert result.strength == strength
    assert result.dasha_activated is True
    assert result.key_grahas == ("SATURN",)
    assert result.cancellation_factors == []  # weakened, not cancelled
    if affliction:
        assert affliction in result.conditions_met


def test_yogakaraka_afflictions_stack_to_one_rung() -> None:
    # Debilitated in Mesham (the 7th from Thulam) and combust: still PARTIAL.
    result = detect_raja_yogakaraka({"SATURN": 1, "SUN": 1}, 7, combust_planets=frozenset({"SATURN"}))
    assert result.is_present is True and result.strength == "PARTIAL"


def test_mesha_lagna_has_no_yogakaraka() -> None:
    assert detect_raja_yogakaraka({"MARS": 1, "JUPITER": 9}, 1).is_present is False


def test_amala_benefic_set_and_malefic_aspect() -> None:
    nature: dict[str, str] = {}
    # Mesha lagna, Chandran in Mesha: the 10th is Makara (10).
    # Amendment: Suriya does not afflict Budhan here (Budha-Aditya; combustion
    # is judged separately). Sevvai, Sani and the nodes do.
    budhan_with_suriya = detect_amala_yoga({"MERCURY": 10, "SUN": 10, "MOON": 1}, 1, 1, nature)
    assert budhan_with_suriya.is_present is True
    for afflictor in ("MARS", "SATURN", "RAHU", "KETU", "MANDHI"):
        with_malefic = detect_amala_yoga({"MERCURY": 10, afflictor: 10, "MOON": 1}, 1, 1, nature)
        assert with_malefic.is_present is False, afflictor
    chandran_alone = detect_amala_yoga({"MOON": 10, "SUN": 3}, 1, 7, nature)
    assert chandran_alone.is_present is False
    # Guru in the 10th, Sani in Vrischikam casting its 3rd drishti on Makara.
    aspected = detect_amala_yoga({"JUPITER": 10, "SATURN": 8, "MOON": 1}, 1, 1, nature)
    assert aspected.is_present and aspected.strength == "WEAK"
    assert aspected.cancellation_factors == []  # weakens, never cancels
    assert "malefic_aspect_on_10th_saturn" in aspected.conditions_met


def test_amala_reads_one_afflictor_set_for_both_tests() -> None:
    # Second amendment, 2026-09-23: Budhan's same-sign test and the 10th-aspect
    # test read one constant, so they cannot drift apart again.
    assert AMALA_AFFLICTING_MALEFICS == {"SATURN", "MARS", "RAHU", "KETU", "MANDHI"}
    nature: dict[str, str] = {}
    # Guru in Makara (10th from Mesha); Suriya in Kataka casts its 7th on it.
    # Suriya is the 10th's karaka with dig bala there, so it does not weaken.
    suriya = detect_amala_yoga({"JUPITER": 10, "VENUS": 10, "SUN": 4, "MOON": 1}, 1, 1, nature)
    assert suriya.strength == "STRONG"
    assert not any(c.startswith("malefic_aspect_on_10th") for c in suriya.conditions_met)
    # Mandhi in Kataka: the project grants it the 7th aspect (EC-A21), so it does.
    mandhi = detect_amala_yoga({"JUPITER": 10, "VENUS": 10, "MANDHI": 4, "MOON": 1}, 1, 1, nature)
    assert mandhi.is_present and mandhi.strength == "PARTIAL"
    assert "malefic_aspect_on_10th_mandhi" in mandhi.conditions_met
