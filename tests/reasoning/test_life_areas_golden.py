"""Golden-set coverage (plan §7 item 1, §11 item 4, P0-2 §15.3 item 3) for the
nine non-marriage life areas — K1-K3 (RELATIONSHIPS) are covered by
test_marriage_gate.py against marriage_promise_gate.json; this file covers
K4-K21 from golden_set_worksheet.json's ``cases`` array.

Each row's ``gate_inputs``/``timing_score`` are the mechanical values fed to
assess_promise()/classify() — every expected gate/band/reading is
mechanically reproduced from those two fields via the same kernel functions
production code calls, not merely asserted against a hand-picked expectation.
"""
from __future__ import annotations

import json
from pathlib import Path

import pytest

from app.reasoning.contradiction import classify
from app.reasoning.promise_gate import GateGrade, assess_promise
from app.reasoning.timing_vote import combine_gate_and_timing, timing_band_from_score

pytestmark = pytest.mark.no_db

_GOLDEN = Path(__file__).resolve().parents[1] / "golden" / "reasoning" / "golden_set_worksheet.json"


def _load_cases() -> list[dict]:
    with _GOLDEN.open(encoding="utf-8") as fh:
        return [case for case in json.load(fh)["cases"] if case.get("status") == "DONE"]


_CASES = _load_cases()
_CASE_IDS = [case["name"] for case in _CASES]


@pytest.mark.parametrize("case", _CASES, ids=_CASE_IDS)
def test_golden_case_matches_kernel(case: dict):
    gate_inputs = case["input"]["gate_inputs"]
    timing_score = case["input"]["timing_score"]
    expected = case["expected"]

    gate = assess_promise(**gate_inputs)
    assert gate.grade.value == expected["gate"], case["name"]

    band = combine_gate_and_timing(gate, timing_score)
    assert band.value == expected["band"], case["name"]

    # classify() wants the pre-cap timing band regardless of gate grade —
    # life_areas_service/whatif_service compute their timing signal
    # independently of the promise gate and pass it through unconditionally
    # (only compute_prediction_score's *scoring* early-returns for
    # BLOCKED/SILENT; the *reading* classifier still wants to know what an
    # active/quiet period would have said). `timing_band=None` is reserved
    # for callers with no timing signal computed at all, not for
    # BLOCKED/SILENT gates specifically.
    pre_cap_timing_band = timing_band_from_score(timing_score)
    reading = classify(gate.grade, pre_cap_timing_band)
    assert reading.value == expected["reading"], case["name"]


def test_golden_set_covers_every_reading_at_least_twice():
    from app.reasoning.contradiction import Reading

    counts: dict[str, int] = {}
    for case in _CASES:
        reading = case["expected"]["reading"]
        counts[reading] = counts.get(reading, 0) + 1
    # K1-K3 (marriage_promise_gate.json) also contribute NOT_PROMISED,
    # PROMISED_NOT_NOW, PROMISED_AND_TIMED — already >=2 for those three
    # even before this file's rows are counted.
    already_covered_by_k1_k3 = {"NOT_PROMISED", "PROMISED_NOT_NOW", "PROMISED_AND_TIMED"}
    for reading in Reading:
        if reading.value in already_covered_by_k1_k3:
            assert counts.get(reading.value, 0) >= 1, reading.value
        else:
            assert counts.get(reading.value, 0) >= 2, reading.value


def test_golden_set_covers_every_life_area():
    from app.services.life_areas_service import _AREA_ROUTING

    # _AREA_ROUTING carries two synonym pairs with identical houses/karaka/
    # varga (MONEY/WEALTH, SPIRITUAL/SPIRITUALITY) — a pre-existing naming
    # duplication in life_areas_service.py, not something this worksheet
    # needs a separate golden chart for; covering one covers the routing
    # both keys share.
    synonyms = {"WEALTH": "MONEY", "SPIRITUALITY": "SPIRITUAL"}

    covered = {case["target_area"] for case in _CASES} | {"RELATIONSHIPS"}  # K1-K3
    for area in _AREA_ROUTING:
        assert synonyms.get(area, area) in covered, area


def test_blocked_rows_are_never_lifted_by_timing():
    # D1 property test: a BLOCKED gate's band/reading must not move no
    # matter what timing_score is supplied — the veto is absolute.
    blocked_cases = [c for c in _CASES if c["expected"]["gate"] == "BLOCKED"]
    assert blocked_cases, "expected at least one BLOCKED golden case"
    for case in blocked_cases:
        gate = assess_promise(**case["input"]["gate_inputs"])
        for sweep_score in (0, 30, 50, 75, 100):
            assert combine_gate_and_timing(gate, sweep_score).value == "BLOCKED"
            assert classify(gate.grade, timing_band_from_score(sweep_score)).value == "NOT_PROMISED"
