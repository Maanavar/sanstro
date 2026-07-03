"""Marriage promise gate — golden cases (plan §7) + flag-off regression.

Golden charts are SYNTHETIC (CLAUDE.md rule) and hand-annotated in
tests/golden/reasoning/marriage_promise_gate.json.
"""
from __future__ import annotations

import json
from datetime import date
from pathlib import Path

import pytest

from app.services.marriage_service import MarriageAssessmentInput, assess_marriage_prediction

pytestmark = pytest.mark.no_db

_GOLDEN = Path(__file__).resolve().parents[1] / "golden" / "reasoning" / "marriage_promise_gate.json"
_AS_OF = date(2026, 7, 3)


def _load_cases() -> dict[str, dict]:
    with _GOLDEN.open(encoding="utf-8") as fh:
        return {case["name"]: case for case in json.load(fh)["cases"]}


def _payload(raw: dict, **overrides) -> MarriageAssessmentInput:
    inp = dict(raw)
    inp.update(overrides)
    return MarriageAssessmentInput(
        as_of=_AS_OF,
        lagna_rasi=inp["lagna_rasi"],
        planets_rasi=inp["planets_rasi"],
        active_dasha_lords=set(inp["active_dasha_lords"]),
        transit_jupiter_rasi=inp["transit_jupiter_rasi"],
        transit_venus_rasi=inp["transit_venus_rasi"],
        age=inp["age"],
        marital_status=inp["marital_status"],
        venus_combust=inp["venus_combust"],
        sevvai_dosham_cancelled=inp["sevvai_dosham_cancelled"],
        d9_rasi_by_planet=inp["d9_rasi_by_planet"],
    )


def test_denied_chart_is_blocked_and_makes_no_timing_claim():
    case = _load_cases()["denied_marriage"]
    result = assess_marriage_prediction(_payload(case["input"]), use_reasoning_gate=True)
    assert result.band == "BLOCKED"
    assert result.confidence == "LOW"
    assert result.timing_window_start is None and result.timing_window_end is None
    # D6: BLOCKED must redirect, never doom — a support line is always offered.
    assert result.supports
    # D2/D6: no numeric score leaks into the copy.
    assert "/100" not in result.main_prediction_en


def test_strong_venus_dasha_does_not_lift_a_denied_chart():
    # The plan's canonical D1 property: vary the timing inputs, band stays BLOCKED.
    case = _load_cases()["denied_marriage"]
    for dasha_lords in ({"VENUS"}, {"JUPITER", "VENUS"}, {"SATURN"}):
        for jup in (1, 3, 9):  # include Jupiter transits aspecting the 7th
            result = assess_marriage_prediction(
                _payload(case["input"], active_dasha_lords=dasha_lords, transit_jupiter_rasi=jup),
                use_reasoning_gate=True,
            )
            assert result.band == "BLOCKED"


def test_delayed_chart_passes_gate_with_weak_dasha_support():
    case = _load_cases()["delayed_marriage"]
    result = assess_marriage_prediction(_payload(case["input"]), use_reasoning_gate=True)
    assert result.band not in ("BLOCKED", "SILENT")
    assert result.dasha_support == "WEAK"  # promised, but not now
    assert result.timing_window_start is not None
    assert any(f.key == "promise_gate_pass" for f in result.astrological_factors)


def test_promised_and_timed_chart_stays_strong():
    # Regression (plan §7 item 5): the gate must not dim genuinely strong charts.
    case = _load_cases()["promised_and_timed_marriage"]
    result = assess_marriage_prediction(_payload(case["input"]), use_reasoning_gate=True)
    assert result.confidence == "HIGH"
    assert result.band == "STRONG"
    assert result.dasha_support == "STRONG"


def test_flag_off_behaviour_is_unchanged():
    case = _load_cases()["denied_marriage"]
    result = assess_marriage_prediction(_payload(case["input"]), use_reasoning_gate=False)
    assert result.band is None
    assert not any(f.key.startswith("promise_gate") for f in result.astrological_factors)


def test_married_profiles_are_never_promise_gated():
    # Married profiles read as harmony, not as a new-event promise (applicability ≠ promise).
    case = _load_cases()["denied_marriage"]
    result = assess_marriage_prediction(
        _payload(case["input"], marital_status="married"), use_reasoning_gate=True
    )
    assert result.band != "BLOCKED"
