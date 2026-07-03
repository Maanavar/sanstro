"""Phase 1 promise gate — D1 grades and the strict-BLOCKED criterion."""
import pytest

from app.reasoning.promise_gate import GateGrade, assess_promise, gate_from_l1

pytestmark = pytest.mark.no_db


def _gate(**overrides):
    base = dict(
        bhava_lord_house=1,
        bhava_lord_afflicted=False,
        karaka_dignity_d1="OWN",
        karaka_dignity_varga="NEUTRAL",
        karaka_available=True,
    )
    base.update(overrides)
    return assess_promise(**base)


def test_pass_when_lord_and_karaka_both_supportive():
    result = _gate()
    assert result.grade is GateGrade.PASS
    assert result.proceeds_to_timing
    assert result.reason.ta and result.reason.en  # D2: every grade carries a reason


def test_missing_karaka_data_is_silent_not_blocked():
    # D3: missing data can never manufacture a denial.
    result = _gate(karaka_available=False)
    assert result.grade is GateGrade.SILENT
    assert not result.proceeds_to_timing


@pytest.mark.parametrize("dusthana", [6, 8, 12])
def test_lord_in_dusthana_with_good_karaka_is_weak(dusthana):
    result = _gate(bhava_lord_house=dusthana)
    assert result.grade is GateGrade.WEAK
    assert result.proceeds_to_timing


def test_afflicted_lord_with_good_karaka_is_weak():
    result = _gate(bhava_lord_afflicted=True)
    assert result.grade is GateGrade.WEAK


def test_blocked_requires_affliction_on_every_axis():
    # Fatally afflicted lord AND karaka debilitated in both D1 and varga.
    result = _gate(
        bhava_lord_house=8,
        bhava_lord_afflicted=True,
        karaka_dignity_d1="DEBILITATED",
        karaka_dignity_varga="DEBILITATED",
    )
    assert result.grade is GateGrade.BLOCKED
    assert not result.proceeds_to_timing


def test_partial_affliction_falls_to_silent_never_blocked():
    # Lord in dusthana but NOT afflicted + karaka weak on both charts:
    # certainty for a denial is missing → SILENT (D3 default-to-quiet).
    result = _gate(
        bhava_lord_house=8,
        bhava_lord_afflicted=False,
        karaka_dignity_d1="DEBILITATED",
        karaka_dignity_varga="DEBILITATED",
    )
    assert result.grade is GateGrade.SILENT


def test_varga_neutral_fallback_keeps_gate_open():
    # Callers without varga data pass NEUTRAL — a strong D1 karaka still passes.
    result = _gate(karaka_dignity_d1="EXALTED", karaka_dignity_varga="NEUTRAL")
    assert result.grade is GateGrade.PASS


# ── gate_from_l1 (legacy L1 layer → GateResult) ────────────────────────────────

def test_l1_thresholds():
    assert gate_from_l1(16).grade is GateGrade.PASS
    assert gate_from_l1(30).grade is GateGrade.PASS
    assert gate_from_l1(15).grade is GateGrade.WEAK
    assert gate_from_l1(8).grade is GateGrade.WEAK


def test_low_l1_without_active_dosham_is_silent():
    assert gate_from_l1(3).grade is GateGrade.SILENT
    assert gate_from_l1(0).grade is GateGrade.SILENT


def test_low_l1_with_strong_uncancelled_dosham_is_blocked():
    result = gate_from_l1(
        3, dosham_present=True, dosham_cancelled=False, dosham_strength="STRONG"
    )
    assert result.grade is GateGrade.BLOCKED


def test_cancelled_dosham_never_blocks():
    result = gate_from_l1(
        3, dosham_present=True, dosham_cancelled=True, dosham_strength="STRONG"
    )
    assert result.grade is GateGrade.SILENT


def test_mild_dosham_never_blocks():
    result = gate_from_l1(
        3, dosham_present=True, dosham_cancelled=False, dosham_strength="MILD"
    )
    assert result.grade is GateGrade.SILENT
