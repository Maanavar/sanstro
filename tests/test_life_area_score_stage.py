"""A13 — `_score_life_area`, the per-area scoring stage lifted out of `get_life_areas`.

Pins the stage's own rules with plain values: `_score_area` and the karaka
chain are replaced by fakes (as `test_life_areas_service.py` already does for
`_score_area`), so what is tested is what the stage does with their results.
These restate rules already in the code; none is new doctrine.
`tests/test_life_areas_golden.py` covers the stage as `get_life_areas` uses it.
"""
from __future__ import annotations

from types import SimpleNamespace

import pytest

from app.calculations.functional_nature import get_functional_nature
from app.reasoning.contradiction import classify
from app.reasoning.promise_gate import GateGrade
from app.reasoning.timing_vote import timing_band_from_score
from app.services import life_areas_service as svc

pytestmark = pytest.mark.no_db

AREA = "CAREER"  # primary karaka SATURN
MOON = 4
QUIET = SimpleNamespace(is_active=False, type="NORMAL")


def _saturn_rasi_for_house(house: int) -> int:
    return (MOON - 1 + house - 1) % 12 + 1


def _stage(monkeypatch, *, pre_blend=80, chain=40, gate=None, maha="SUN", antar="MARS", saturn_house=None):
    monkeypatch.setattr(svc, "_score_area", lambda *_a, **_k: (pre_blend, {"probe": 1}, gate))
    chain_result = {"score": chain, "supporting_factors": [], "blocking_factors": []}
    monkeypatch.setattr(svc, "_karaka_chain_score", lambda **_k: chain_result)
    bodies = {} if saturn_house is None else {"SATURN": SimpleNamespace(rasi=_saturn_rasi_for_house(saturn_house))}
    result = svc._score_life_area(
        AREA,
        natal_moon_rasi=MOON, transit_bodies=bodies, maha_lord=maha, antar_lord=antar,
        sani_cycle=QUIET, kandaka_cycle=QUIET, chandrashtama_share=0.0, natal_lagna_rasi=1,
        natal_planet_scores={}, natal_planet_rasis={}, vargas={}, bav={}, sav={}, native_age=40,
        sade_sati_severity=None, sade_sati_mitigation_count=0, transit_planet_rasis={},
        functional_nature_map={p: get_functional_nature(1, p) for p in ("SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN", "RAHU", "KETU")},
    )
    return result, chain_result


def _strong_saturn_house() -> int:
    return next(h for h in range(1, 13) if svc._HOUSE_SCORE_TABLE["SATURN"].get(h, 50) >= 60)


def test_the_karaka_chain_is_blended_65_35(monkeypatch) -> None:
    result, chain = _stage(monkeypatch, pre_blend=80, chain=40)
    assert result.score == round(80 * 0.65 + 40 * 0.35)
    assert result.breakdown == {"probe": 1}
    # Handed over as the same dict: the caller prepends BAV-derived factors.
    assert result.chain is chain
    assert result.primary_karaka == "SATURN"


def test_the_reading_is_classified_from_the_score_before_the_blend(monkeypatch) -> None:
    assert timing_band_from_score(80) != timing_band_from_score(52), "pick scores in different timing bands"
    result, _ = _stage(monkeypatch, pre_blend=80, chain=0, gate=GateGrade.PASS.value)
    assert result.score == 52
    assert result.reading == classify(GateGrade.PASS, timing_band_from_score(80)).value


@pytest.mark.parametrize(("gate", "expected"), [(None, None), ("BLOCKED", classify(GateGrade.BLOCKED, None).value)])
def test_no_gate_means_no_reading_and_a_blocked_gate_ignores_timing(monkeypatch, gate, expected) -> None:
    result, _ = _stage(monkeypatch, gate=gate)
    assert result.reading == expected


def test_three_aligned_signals_are_high_confidence(monkeypatch) -> None:
    # SUN/MARS maha/antar on CAREER: round(72 * 0.70 + 65 * 0.30) = 70.
    result, _ = _stage(monkeypatch, pre_blend=90, chain=90, saturn_house=_strong_saturn_house())
    assert result.confidence == "HIGH"
    assert result.karaka_house_from_moon == _strong_saturn_house()


def test_a_karaka_with_no_transit_reads_house_one_at_fifty(monkeypatch) -> None:
    result, _ = _stage(monkeypatch, pre_blend=90, chain=90, saturn_house=None)
    assert result.karaka_house_from_moon == 1
    assert result.driver_reason.en.endswith("position")
    assert result.confidence == "MEDIUM"  # score and dasha aligned; the transit is a neutral 50


def test_a_signal_of_exactly_sixty_counts(monkeypatch) -> None:
    # SATURN/SATURN on CAREER: dasha round(60 * 0.70 + 60 * 0.30) = 60; score 60;
    # no transit (50). Two signals at the threshold -> MEDIUM, not LOW.
    result, _ = _stage(monkeypatch, pre_blend=60, chain=60, maha="SATURN", antar="SATURN")
    assert result.score == 60
    assert result.confidence == "MEDIUM"


def test_weak_signals_are_low_confidence(monkeypatch) -> None:
    # KETU/MOON on CAREER: round(40 * 0.70 + 50 * 0.30) = 43.
    result, _ = _stage(monkeypatch, pre_blend=20, chain=20, maha="KETU", antar="MOON")
    assert (result.maha_score, result.antar_score) == (40, 50)
    assert result.confidence == "LOW"
