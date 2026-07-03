import pytest

from app.calculations.chart_strength import (
    _baladi_avastha,
    _chesta_bala_score,
    _deeptadi_avastha,
    _jagradadi_avastha,
    compute_natal_planet_score,
    compute_strength_breakdown,
    detect_planetary_wars,
)

pytestmark = pytest.mark.no_db


def test_detect_planetary_war_marks_lower_degree_as_loser():
    wars = detect_planetary_wars({"MARS": 45.0, "MERCURY": 45.5, "SUN": 45.2})
    assert wars["MARS"] == "MERCURY"


def test_chesta_bala_rules():
    assert _chesta_bala_score("MARS", True, 1.0) == 1.0
    assert _chesta_bala_score("SUN", False, 1.0) == 0.5


def test_planetary_war_penalty_applied_to_score():
    base = compute_natal_planet_score(
        planet="MARS",
        natal_rasi=2,
        natal_longitude=45.0,
        natal_lagna_rasi=1,
        sun_longitude=10.0,
        is_retrograde=False,
    )
    penalized = compute_natal_planet_score(
        planet="MARS",
        natal_rasi=2,
        natal_longitude=45.0,
        natal_lagna_rasi=1,
        sun_longitude=10.0,
        is_retrograde=False,
        planetary_wars={"MARS": "MERCURY"},
    )
    assert penalized <= base


# ---------------------------------------------------------------------------
# Phase 1.3 — Baladi / Jagradadi / Deeptadi avastha golden cases
# (docs/THIRUKANITHAM_DEPTH_EXPANSION_PLAN.md Phase 1.3)
# ---------------------------------------------------------------------------

def test_baladi_avastha_odd_sign_zones():
    # Rasi 1 (Aries, odd): zones are 0-6/6-12/12-18/18-24/24-30 deg.
    assert _baladi_avastha(3.0, 1) == "BALA"
    assert _baladi_avastha(9.0, 1) == "KUMARA"
    assert _baladi_avastha(15.0, 1) == "YUVA"
    assert _baladi_avastha(21.0, 1) == "VRIDDHA"
    assert _baladi_avastha(27.0, 1) == "MRITA"


def test_baladi_avastha_even_sign_reverses_zones():
    # Rasi 2 (Taurus, even): zone order reverses.
    assert _baladi_avastha(33.0, 2) == "MRITA"    # 3 deg in sign
    assert _baladi_avastha(57.0, 2) == "BALA"     # 27 deg in sign


def test_jagradadi_avastha_odd_sign_thirds():
    # Rasi 1 (Aries, odd): 0-10/10-20/20-30 deg thirds.
    assert _jagradadi_avastha(5.0, 1) == "JAGRAT"
    assert _jagradadi_avastha(15.0, 1) == "SWAPNA"
    assert _jagradadi_avastha(25.0, 1) == "SUSHUPTI"


def test_jagradadi_avastha_even_sign_reverses_thirds():
    # Rasi 2 (Taurus, even): third order reverses.
    assert _jagradadi_avastha(35.0, 2) == "SUSHUPTI"  # 5 deg in sign
    assert _jagradadi_avastha(55.0, 2) == "JAGRAT"     # 25 deg in sign


def test_deeptadi_avastha_dignity_bands():
    assert _deeptadi_avastha(100) == "DEEPTA"
    assert _deeptadi_avastha(90) == "SWASTHA"
    assert _deeptadi_avastha(80) == "MUDITA"
    assert _deeptadi_avastha(60) == "SHANTA"
    assert _deeptadi_avastha(50) == "DEENA"
    assert _deeptadi_avastha(35) == "DUKHITA"
    assert _deeptadi_avastha(15) == "KHALA"


def test_compute_strength_breakdown_includes_avastha_labels():
    # 20 deg Aries: Mars own-sign but outside its 0-12 deg Moolatrikona zone,
    # so dignity_score is the plain own-sign band (80) -> MUDITA.
    breakdown = compute_strength_breakdown(
        planet="MARS",
        natal_rasi=1,
        natal_longitude=20.0,
        natal_lagna_rasi=1,
        is_retrograde=False,
    )
    assert breakdown["baladi"] == _baladi_avastha(20.0, 1)
    assert breakdown["jagradadi"] == _jagradadi_avastha(20.0, 1)
    assert breakdown["deeptadi"] == "MUDITA"
