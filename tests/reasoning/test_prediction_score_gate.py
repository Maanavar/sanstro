"""D1 gate inside compute_prediction_score — regression + property tests.

Plan §7: prove a BLOCKED chart cannot be lifted by ANY dasha/transit
combination, and that the flag-off path is unchanged.
"""
import itertools

import pytest

from app.calculations.prediction_score import PredictionScoreInput, compute_prediction_score

pytestmark = pytest.mark.no_db


def _inp(**overrides) -> PredictionScoreInput:
    base = dict(
        house_lord_strength=75,
        karaka_strength=70,
        yoga_present=False,
        yoga_strength="NONE",
        dosham_present=False,
        dosham_cancelled=False,
        dosham_strength="NONE",
        key_planet_strengths=[70, 65, 80],
        maha_lord_functional_nature="TRIKONA",
        antar_lord_functional_nature="KENDRA",
        maha_lord_house_connection=True,
        antar_lord_house_connection=True,
        maha_lord_strength=72,
        maturation_multiplier=1.10,
        varga_confirmation=10,
        jupiter_house_score=78,
        saturn_house_score=-12,
        double_transit_score=15,
        is_sade_sati=False,
        is_ashtama_sani=False,
        bav_delta=5,
        sav_delta=3,
    )
    base.update(overrides)
    return PredictionScoreInput(**base)


# ── Flag OFF: legacy behaviour untouched ───────────────────────────────────────

def test_flag_off_is_legacy_additive_and_band_free():
    out = compute_prediction_score(_inp())
    assert out.band is None and out.gate_grade is None
    assert out.total == (
        out.l1_birth_promise + out.l2_planet_strength + out.l3_dasha_activation
        + out.l4_varga_confirmation + out.l5_transit_support + out.l6_ashtakavarga
    )


def test_flag_off_zero_promise_can_still_score_on_timing():
    # This documents the pre-gate defect the plan fixes (prediction_score.py L1 not gating).
    out = compute_prediction_score(
        _inp(house_lord_strength=5, karaka_strength=5,
             dosham_present=True, dosham_strength="STRONG")
    )
    assert out.l1_birth_promise <= 2
    assert out.total > 30  # timing layers alone still lift the flat sum


# ── Flag ON: gate → vote ───────────────────────────────────────────────────────

_TIMING_SWEEP = dict(
    maha_lord_functional_nature=["YOGAKARAKA", "DUSTHANA"],
    jupiter_house_score=[0, 82],
    double_transit_score=[0, 20],
    bav_delta=[-4, 5],
)


def test_blocked_chart_cannot_be_lifted_by_any_timing_combination():
    keys = list(_TIMING_SWEEP)
    for combo in itertools.product(*(_TIMING_SWEEP[k] for k in keys)):
        out = compute_prediction_score(
            _inp(
                house_lord_strength=5, karaka_strength=5,
                dosham_present=True, dosham_cancelled=False, dosham_strength="STRONG",
                **dict(zip(keys, combo)),
            ),
            use_reasoning_gate=True,
        )
        assert out.band == "BLOCKED"
        assert out.gate_grade == "BLOCKED"
        assert out.total <= 10  # clamped near zero (D1 veto)
        # Timing layers are never consulted for a BLOCKED chart.
        assert (out.l2_planet_strength, out.l3_dasha_activation, out.l4_varga_confirmation,
                out.l5_transit_support, out.l6_ashtakavarga) == (0, 0, 0, 0, 0)


def test_weak_promise_without_dosham_is_silent_not_blocked():
    out = compute_prediction_score(
        _inp(house_lord_strength=5, karaka_strength=5),
        use_reasoning_gate=True,
    )
    assert out.band == "SILENT"
    assert out.gate_grade == "SILENT"
    assert out.total <= 20


def test_pass_gate_total_is_timing_vote_without_l1():
    out = compute_prediction_score(_inp(), use_reasoning_gate=True)
    assert out.gate_grade == "PASS"
    timing_raw = (
        out.l2_planet_strength + out.l3_dasha_activation + out.l4_varga_confirmation
        + out.l5_transit_support + out.l6_ashtakavarga
    )
    assert out.total == round(timing_raw / 70 * 100)  # L1 never re-added
    assert out.band in {"STRONG", "LIKELY", "MIXED", "WEAK"}


def test_weak_gate_caps_band_at_likely():
    # Neutral 50/50 lord+karaka → L1 ≈ 11 → WEAK gate; max out the timing pillars.
    out = compute_prediction_score(
        _inp(
            house_lord_strength=50, karaka_strength=50,
            key_planet_strengths=[100, 100, 100],
            maha_lord_functional_nature="YOGAKARAKA",
            antar_lord_functional_nature="YOGAKARAKA",
            jupiter_house_score=82, saturn_house_score=76,
            double_transit_score=20, bav_delta=8, sav_delta=8,
        ),
        use_reasoning_gate=True,
    )
    assert out.gate_grade == "WEAK"
    assert out.total >= 75  # timing itself is STRONG territory…
    assert out.band == "LIKELY"  # …but the WEAK gate caps the band (D1)


def test_regression_promised_and_timed_charts_stay_strong():
    # Plan §Phase 1 tests: genuinely promised + well-timed charts must not regress.
    out = compute_prediction_score(
        _inp(house_lord_strength=90, karaka_strength=85, yoga_present=True, yoga_strength="STRONG"),
        use_reasoning_gate=True,
    )
    assert out.gate_grade == "PASS"
    assert out.band in {"STRONG", "LIKELY"}
