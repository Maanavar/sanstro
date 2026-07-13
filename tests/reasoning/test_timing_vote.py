"""Timing vote — weighted vote, band mapping, and the D1 combinator."""
import pytest

from app.reasoning.promise_gate import gate_from_l1
from app.reasoning.timing_vote import (
    combine_gate_and_timing,
    timing_band_from_score,
    weighted_timing_vote,
)
from app.reasoning.verdict import Band
from app.services.feature_flags import get_flag, reset_flag, set_flag

pytestmark = pytest.mark.no_db


def test_weighted_vote_renormalises_weights():
    # Dropping a pillar (weight 0) renormalises instead of deflating.
    assert weighted_timing_vote([(80, 0.5), (80, 0.5)]) == 80
    assert weighted_timing_vote([(80, 0.5), (80, 0.5), (0, 0.0)]) == 80


def test_weighted_vote_empty_or_zero_weights_is_neutral():
    assert weighted_timing_vote([]) == 50
    assert weighted_timing_vote([(90, 0.0)]) == 50


def test_weighted_vote_bounds():
    assert weighted_timing_vote([(0, 1.0)]) == 0
    assert weighted_timing_vote([(100, 1.0)]) == 100


def test_band_thresholds():
    assert timing_band_from_score(75) is Band.STRONG
    assert timing_band_from_score(74) is Band.LIKELY
    assert timing_band_from_score(60) is Band.LIKELY
    assert timing_band_from_score(59) is Band.MIXED
    assert timing_band_from_score(45) is Band.MIXED
    assert timing_band_from_score(44) is Band.WEAK
    assert timing_band_from_score(0) is Band.WEAK


def test_blocked_gate_vetoes_any_timing():
    gate = gate_from_l1(0, dosham_present=True, dosham_cancelled=False, dosham_strength="STRONG")
    for timing in (0, 45, 75, 100):
        assert combine_gate_and_timing(gate, timing) is Band.BLOCKED


def test_silent_gate_stays_silent_regardless_of_timing():
    gate = gate_from_l1(0)
    for timing in (0, 45, 75, 100):
        assert combine_gate_and_timing(gate, timing) is Band.SILENT


def test_weak_gate_caps_band_at_likely():
    gate = gate_from_l1(10)  # WEAK
    assert combine_gate_and_timing(gate, 100) is Band.LIKELY
    assert combine_gate_and_timing(gate, 60) is Band.LIKELY
    assert combine_gate_and_timing(gate, 50) is Band.MIXED


def test_pass_gate_lets_timing_speak():
    gate = gate_from_l1(20)  # PASS
    assert combine_gate_and_timing(gate, 90) is Band.STRONG
    assert combine_gate_and_timing(gate, 30) is Band.WEAK


def test_band_cutoff_flag_defaults_match_original_hardcoded_values():
    """P3-2/P3-3: cutoffs moved from literals to admin-tunable flags.

    Defaults must reproduce the pre-flag behaviour (75/60/45) byte-for-byte —
    no threshold has actually changed, only the mechanism.
    """
    assert get_flag("timing_band_strong_cutoff") == 75
    assert get_flag("timing_band_likely_cutoff") == 60
    assert get_flag("timing_band_mixed_cutoff") == 45


def test_band_thresholds_are_admin_tunable_via_flags():
    set_flag("timing_band_strong_cutoff", 80)
    try:
        assert timing_band_from_score(79) is Band.LIKELY
        assert timing_band_from_score(80) is Band.STRONG
    finally:
        reset_flag("timing_band_strong_cutoff")
    # Reset restores the original hardcoded-equivalent default.
    assert timing_band_from_score(75) is Band.STRONG
