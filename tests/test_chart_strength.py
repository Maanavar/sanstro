import pytest

from app.calculations.chart_strength import (
    _baladi_avastha,
    _chesta_bala_score,
    _deeptadi_avastha,
    _jagradadi_avastha,
    _kala_bala_score,
    compute_natal_planet_score,
    compute_strength_breakdown,
    detect_planetary_wars,
)
from app.calculations.shadbala import _nathonnatha_bala, ShadbalaContext

pytestmark = pytest.mark.no_db


def test_detect_planetary_war_marks_lower_degree_as_loser():
    wars = detect_planetary_wars({"MARS": 45.0, "MERCURY": 45.5, "SUN": 45.2})
    assert wars["MARS"] == "MERCURY"


def test_detect_planetary_war_sign_boundary_uses_absolute_longitude():
    # OQ-1 (2026-07-16): Mercury at 29.5 deg Gemini (abs 89.5) and Jupiter at
    # 0.3 deg Cancer (abs 90.3) are ~0.8 deg apart — a war — but the OLD code
    # compared degree-within-sign (29.5 vs 0.3) and would have wrongly made
    # the higher-absolute-longitude planet (Jupiter) the loser. Fixed: the
    # trailing planet in absolute zodiacal longitude (Mercury) loses.
    wars = detect_planetary_wars({"MERCURY": 89.5, "JUPITER": 90.3})
    assert wars["MERCURY"] == "JUPITER"


def test_detect_planetary_war_handles_zero_aries_seam():
    # Same boundary bug, at the 0/360 Aries seam instead of an interior sign
    # boundary: Saturn at 359.9 deg (29.9 Pisces) trails Venus at 0.2 deg
    # (0.2 Aries) by the short forward arc (~0.3 deg), so Saturn loses.
    wars = detect_planetary_wars({"SATURN": 359.9, "VENUS": 0.2})
    assert wars["SATURN"] == "VENUS"


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
    """M-1: Deepta=exalted, Swastha=Moolatrikona/own sign (both collapse to
    the same label — MT is a stronger form of own-sign dignity, not a
    distinct classical rung), Mudita=friend's sign, Deena=neutral,
    Dukhita=enemy sign, Khala=debilitated. Own sign must render Swastha, not
    Mudita — a Tamil-literate user checking a planet in own sign expects
    ஸ்வஸ்த (Swastha)."""
    assert _deeptadi_avastha(100) == "DEEPTA"
    assert _deeptadi_avastha(90) == "SWASTHA"
    assert _deeptadi_avastha(80) == "SWASTHA"
    assert _deeptadi_avastha(60) == "MUDITA"
    assert _deeptadi_avastha(50) == "DEENA"
    assert _deeptadi_avastha(35) == "DUKHITA"
    assert _deeptadi_avastha(15) == "KHALA"


# ---------------------------------------------------------------------------
# WI-01 — Kala Bala day/night sets must agree with shadbala._nathonnatha_bala
# (docs/CALC_AUDIT_REMEDIATION_PLAN_2026-07.md)
# ---------------------------------------------------------------------------

def test_kala_bala_and_nathonnatha_classify_all_grahas_identically():
    day_ctx = ShadbalaContext(
        asc_longitude=0.0, mc_longitude=0.0, weekday=0,
        birth_clock_hours=12.0, sunrise_hours=6.0, sunset_hours=18.0,
    )
    night_ctx = ShadbalaContext(
        asc_longitude=0.0, mc_longitude=0.0, weekday=0,
        birth_clock_hours=0.0, sunrise_hours=6.0, sunset_hours=18.0,
    )
    for planet in ("SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN"):
        kala_day = _kala_bala_score(planet, is_daytime=True, paksha_is_shukla=True,
                                     is_vargottama=False, d9_rasi=None)
        kala_night = _kala_bala_score(planet, is_daytime=False, paksha_is_shukla=True,
                                       is_vargottama=False, d9_rasi=None)
        natha_day = _nathonnatha_bala(planet, day_ctx)
        natha_night = _nathonnatha_bala(planet, night_ctx)
        # Both engines must agree on which half (day vs night) is stronger.
        assert (kala_day > kala_night) == (natha_day > natha_night)
        assert (kala_day < kala_night) == (natha_day < natha_night)


def test_kala_bala_venus_stronger_by_day_saturn_stronger_by_night():
    venus_day = _kala_bala_score("VENUS", is_daytime=True, paksha_is_shukla=True,
                                  is_vargottama=False, d9_rasi=None)
    saturn_day = _kala_bala_score("SATURN", is_daytime=True, paksha_is_shukla=True,
                                   is_vargottama=False, d9_rasi=None)
    assert venus_day > saturn_day

    venus_night = _kala_bala_score("VENUS", is_daytime=False, paksha_is_shukla=True,
                                    is_vargottama=False, d9_rasi=None)
    saturn_night = _kala_bala_score("SATURN", is_daytime=False, paksha_is_shukla=True,
                                     is_vargottama=False, d9_rasi=None)
    assert saturn_night > venus_night


def test_compute_strength_breakdown_includes_avastha_labels():
    # 20 deg Aries: Mars own-sign but outside its 0-12 deg Moolatrikona zone,
    # so dignity_score is the plain own-sign band (80) -> SWASTHA (M-1).
    breakdown = compute_strength_breakdown(
        planet="MARS",
        natal_rasi=1,
        natal_longitude=20.0,
        natal_lagna_rasi=1,
        is_retrograde=False,
    )
    assert breakdown["baladi"] == _baladi_avastha(20.0, 1)
    assert breakdown["jagradadi"] == _jagradadi_avastha(20.0, 1)
    assert breakdown["deeptadi"] == "SWASTHA"
