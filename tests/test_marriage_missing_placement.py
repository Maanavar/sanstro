"""A marriage reading whose placement map lacks a graha the score reads.

The scoring stage reads Venus and the 7th and 2nd lords by name. Before this
guard a missing one raised KeyError whenever the promise gate had not already
answered SILENT: gate off, a married profile (the gate never runs for one),
or a missing 2nd lord (the gate does not look at it). Missing data now reads
SILENT on every path, as the gate rules for a missing karaka or lord (D3).
"""
from __future__ import annotations

from datetime import date

import pytest

from app.services import feature_flags
from app.services import marriage_service as svc

pytestmark = pytest.mark.no_db

# Kadagam lagna: the 7th lord is Saturn (Makaram), the 2nd lord the Sun (Simham).
PLANETS = {
    "SUN": 5,
    "MOON": 4,
    "MARS": 1,
    "MERCURY": 6,
    "JUPITER": 9,
    "VENUS": 2,
    "SATURN": 11,
    "RAHU": 3,
    "KETU": 9,
}


@pytest.fixture(autouse=True)
def _shipped_flags(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(svc, "get_flag", lambda name: feature_flags._defaults().get(name))


def _payload(*, without: str | None = None, marital_status: str | None = None) -> svc.MarriageAssessmentInput:
    planets = {graha: rasi for graha, rasi in PLANETS.items() if graha != without}
    return svc.MarriageAssessmentInput(
        as_of=date(2030, 3, 1),
        lagna_rasi=4,
        planets_rasi=planets,
        active_dasha_lords={"VENUS", "MOON"},
        transit_jupiter_rasi=10,
        transit_venus_rasi=10,
        age=30,
        marital_status=marital_status,
        maha_lord="VENUS",
        antar_lord="MOON",
    )


@pytest.mark.parametrize("without", ["VENUS", "SATURN", "SUN"])
@pytest.mark.parametrize(
    ("gate", "marital_status"),
    [(False, None), (True, None), (None, "married")],
    ids=["gate-off", "gate-on", "married"],
)
def test_missing_scored_placement_reads_silent(without: str, gate: bool | None, marital_status: str | None) -> None:
    result = svc.assess_marriage_prediction(
        _payload(without=without, marital_status=marital_status),
        use_reasoning_gate=gate,
    )

    assert result.band == "SILENT"
    assert result.confidence == "LOW"
    assert [factor.key for factor in result.astrological_factors] == ["promise_gate_silent"]
    assert result.timing_window_start is None


def test_complete_placements_are_scored_as_before() -> None:
    for gate, marital_status in ((False, None), (True, None), (None, "married")):
        result = svc.assess_marriage_prediction(_payload(marital_status=marital_status), use_reasoning_gate=gate)
        assert result.band != "SILENT"
        assert "promise_gate_silent" not in {factor.key for factor in result.astrological_factors}


def test_missing_scored_placements_names_each_absent_graha() -> None:
    assert svc._missing_scored_placements(_payload()) == []
    assert svc._missing_scored_placements(_payload(without="SUN")) == ["SUN"]
