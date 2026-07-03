"""D1 gate in whatif._overall_verdict — gate(natal) → vote(dasha, gochar, panchangam)."""
import itertools

import pytest

from app.services.whatif_service import _overall_verdict

pytestmark = pytest.mark.no_db


# ── Flag OFF: legacy four-pillar formula unchanged ─────────────────────────────

def test_legacy_path_unchanged_and_band_free():
    overall, verdict, band, reading = _overall_verdict(70, 70, 70, 70)
    assert band is None
    assert reading is None
    assert overall == 70
    assert verdict == "FAVOURABLE"


def test_legacy_soft_floor_still_applies():
    # High weighted sum but one pillar below 50 → NEUTRAL (legacy AND-floor).
    overall, verdict, band, reading = _overall_verdict(45, 90, 90, 90)
    assert band is None
    assert reading is None
    assert verdict == "NEUTRAL"


# ── Flag ON: promise is a veto, not a vote member ──────────────────────────────

def test_blocked_natal_cannot_be_lifted_by_any_timing():
    for dasha, gochar, panch in itertools.product((0, 50, 100), repeat=3):
        overall, verdict, band, reading = _overall_verdict(
            38, dasha, gochar, panch, use_reasoning_gate=True
        )
        assert band == "BLOCKED"
        assert reading == "NOT_PROMISED"
        assert verdict == "CAUTION"
        assert overall <= 25


def test_pass_gate_favourable_when_timing_aligned():
    overall, verdict, band, reading = _overall_verdict(70, 80, 75, 70, use_reasoning_gate=True)
    # timing vote = 0.45*80 + 0.35*75 + 0.20*70 = 76 → STRONG
    assert overall == 76
    assert band == "STRONG"
    assert reading == "PROMISED_AND_TIMED"
    assert verdict == "FAVOURABLE"


def test_weak_gate_caps_band_at_likely():
    overall, verdict, band, reading = _overall_verdict(50, 80, 75, 70, use_reasoning_gate=True)
    assert band == "LIKELY"  # STRONG timing capped by WEAK gate
    # The reading sees the pre-cap timing: active period, partial promise.
    assert reading == "ACTIVE_BUT_UNPROMISED"
    assert verdict == "FAVOURABLE"


def test_gate_thresholds_boundary():
    _, _, band_weak, _ = _overall_verdict(42, 80, 75, 70, use_reasoning_gate=True)
    _, _, band_blocked, _ = _overall_verdict(41, 80, 75, 70, use_reasoning_gate=True)
    assert band_weak != "BLOCKED"
    assert band_blocked == "BLOCKED"


def test_pass_gate_with_poor_timing_is_caution_not_blocked():
    # Promised but not now (the Phase 3 reading — D4).
    overall, verdict, band, reading = _overall_verdict(70, 20, 20, 40, use_reasoning_gate=True)
    assert band == "WEAK"
    assert reading == "PROMISED_NOT_NOW"
    assert verdict == "CAUTION"
