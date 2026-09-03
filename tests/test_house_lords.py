"""Tests for the bhava-lord (adhipathi) placement report (audit T3)."""
from __future__ import annotations

import pytest

from app.calculations.house_lords import (
    _HOUSE_META,
    compute_house_lord_report,
)

# Mesha (Aries) lagna, rasi 1. SIGN_LORD gives:
#   1 MARS, 2 VENUS, 3 MERCURY, 4 MOON, 5 SUN, 6 MERCURY, 7 VENUS,
#   8 MARS, 9 JUPITER, 10 SATURN, 11 SATURN, 12 JUPITER
_PLANETS_RASI = {
    "SUN": 5, "MOON": 4, "MARS": 1, "MERCURY": 6, "JUPITER": 9,
    "VENUS": 7, "SATURN": 11, "RAHU": 3, "KETU": 9,
}
_SCORES = {
    "SUN": 55, "MOON": 48, "MARS": 72, "MERCURY": 60, "JUPITER": 74,
    "VENUS": 30, "SATURN": 50, "RAHU": 50, "KETU": 50,
}


@pytest.mark.no_db
def test_report_covers_all_twelve_houses():
    report = compute_house_lord_report(1, _PLANETS_RASI, _SCORES)
    assert [r.house for r in report] == list(range(1, 13))


@pytest.mark.no_db
def test_bhagya_adhipathi_placement_and_reading():
    """9th lord (Bhagya) for Mesha is Jupiter, placed in its own 9th house."""
    report = compute_house_lord_report(1, _PLANETS_RASI, _SCORES)
    ninth = next(r for r in report if r.house == 9)
    assert ninth.lord == "JUPITER"
    assert ninth.lord_house == 9  # Jupiter in rasi 9 = house 9 from lagna 1
    assert ninth.strength_score == 74
    assert ninth.strength_band == "STRONG"
    assert ninth.adhipathi_ta == "பாக்கியாதிபதி"
    assert "பாக்கியாதிபதி" in ninth.reading_ta
    assert "குரு" in ninth.reading_ta
    assert "Jupiter" in ninth.reading_en


@pytest.mark.no_db
def test_previously_collapsed_lords_are_named():
    """The #8–#14 adhipathis that were folded into coarse buckets are now named."""
    report = compute_house_lord_report(1, _PLANETS_RASI, _SCORES)
    by_house = {r.house: r for r in report}
    assert by_house[2].adhipathi_en.startswith("Dhana")
    assert by_house[6].adhipathi_en.startswith("Roga")
    assert by_house[8].adhipathi_en.startswith("Ayush")
    assert by_house[9].adhipathi_en.startswith("Bhagya")
    assert by_house[11].adhipathi_en.startswith("Labha")
    assert by_house[12].adhipathi_en.startswith("Vyaya")


@pytest.mark.no_db
def test_strength_bands():
    report = compute_house_lord_report(1, _PLANETS_RASI, _SCORES)
    by_house = {r.house: r for r in report}
    # 7th lord Venus, score 30 -> WEAK
    assert by_house[7].lord == "VENUS"
    assert by_house[7].strength_band == "WEAK"
    # 1st lord Mars, score 72 -> STRONG
    assert by_house[1].lord == "MARS"
    assert by_house[1].strength_band == "STRONG"


@pytest.mark.no_db
def test_missing_scores_default_to_moderate():
    report = compute_house_lord_report(1, _PLANETS_RASI)
    for r in report:
        assert r.strength_score == 50
        assert r.strength_band == "MODERATE"


@pytest.mark.no_db
def test_incomplete_planet_map_skips_house():
    partial = dict(_PLANETS_RASI)
    del partial["JUPITER"]  # drops houses 9 and 12 (both Jupiter-ruled)
    report = compute_house_lord_report(1, partial, _SCORES)
    houses = {r.house for r in report}
    assert 9 not in houses
    assert 12 not in houses
    assert 1 in houses


@pytest.mark.no_db
def test_functional_nature_is_populated():
    report = compute_house_lord_report(1, _PLANETS_RASI, _SCORES)
    first = next(r for r in report if r.house == 1)
    assert first.lord == "MARS"
    assert first.functional_nature == "LAGNA_LORD"


@pytest.mark.no_db
def test_all_house_meta_bilingual():
    for house, meta in _HOUSE_META.items():
        assert meta.adhipathi_ta and meta.adhipathi_en
        assert meta.significations_ta and meta.significations_en
        assert 1 <= house <= 12
