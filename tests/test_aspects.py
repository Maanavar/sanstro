import pytest

from app.calculations.aspects import aspect_houses, aspect_target_rasis, aspects_house

pytestmark = pytest.mark.no_db


def test_mars_special_aspects_4_7_8():
    # Mars at Aries (rasi 1): 4th=Cancer(4), 7th=Libra(7), 8th=Scorpio(8).
    assert aspects_house("MARS", 1, 4) is True
    assert aspects_house("MARS", 1, 7) is True
    assert aspects_house("MARS", 1, 8) is True
    assert aspects_house("MARS", 1, 2) is False
    assert aspects_house("MARS", 1, 5) is False


def test_jupiter_special_aspects_5_7_9():
    # Jupiter at Aries (rasi 1): 5th=Leo(5), 7th=Libra(7), 9th=Sagittarius(9).
    assert aspects_house("JUPITER", 1, 5) is True
    assert aspects_house("JUPITER", 1, 7) is True
    assert aspects_house("JUPITER", 1, 9) is True
    assert aspects_house("JUPITER", 1, 4) is False


def test_saturn_special_aspects_3_7_10():
    # Saturn at Aries (rasi 1): 3rd=Gemini(3), 7th=Libra(7), 10th=Capricorn(10).
    assert aspects_house("SATURN", 1, 3) is True
    assert aspects_house("SATURN", 1, 7) is True
    assert aspects_house("SATURN", 1, 10) is True
    assert aspects_house("SATURN", 1, 5) is False


def test_rahu_ketu_node_aspects_5_7_9():
    assert aspects_house("RAHU", 1, 5) is True
    assert aspects_house("RAHU", 1, 7) is True
    assert aspects_house("RAHU", 1, 9) is True
    assert aspects_house("KETU", 1, 5) is True
    assert aspects_house("KETU", 1, 7) is True
    assert aspects_house("KETU", 1, 9) is True


def test_mandhi_only_seventh_aspect():
    assert aspects_house("MANDHI", 1, 7) is True
    assert aspects_house("MANDHI", 1, 5) is False
    assert aspects_house("MANDHI", 1, 4) is False


def test_unknown_planet_falls_back_to_seventh_only():
    assert aspect_houses("SUN") == frozenset({7})
    assert aspect_houses("VENUS") == frozenset({7})
    assert aspects_house("SUN", 1, 7) is True
    assert aspects_house("SUN", 1, 5) is False


def test_aspect_target_rasis_round_trips_against_aspects_house():
    for planet in ("SUN", "MARS", "JUPITER", "SATURN", "RAHU", "KETU", "MANDHI"):
        for source_rasi in range(1, 13):
            targets = aspect_target_rasis(planet, source_rasi)
            for target_rasi in range(1, 13):
                expected = target_rasi in targets
                assert aspects_house(planet, source_rasi, target_rasi) is expected
