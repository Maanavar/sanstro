import pytest

from app.calculations.aspects import (
    _FRACTIONAL_DRISHTI,
    aspect_houses,
    aspect_strength,
    aspect_target_rasis,
    aspects_house,
    effective_natural_class,
)

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


def test_fractional_drishti_keeps_boolean_api_poorna_only():
    assert aspect_strength("SUN", 1, 5) == 0.50
    assert aspects_house("SUN", 1, 5) is False
    assert aspect_strength("MARS", 1, 4) == 1.0
    assert aspects_house("MARS", 1, 4) is True


def test_fractional_drishti_matches_page_245_tiers():
    """p.245: (4,8) three quarters, (5,9) half, (3,10) quarter, 7th full.

    Deliberately asserted on a graha with no special aspect, so the table is
    read raw rather than through a poorna promotion.
    """
    expected = {3: 0.25, 4: 0.75, 5: 0.50, 7: 1.00, 8: 0.75, 9: 0.50, 10: 0.25}
    for house, strength in expected.items():
        target = ((1 - 1 + (house - 1)) % 12) + 1
        assert aspect_strength("SUN", 1, target) == strength, house
    for house in (2, 6, 11, 12):
        target = ((1 - 1 + (house - 1)) % 12) + 1
        assert aspect_strength("SUN", 1, target) == 0.0, house


def test_each_special_aspect_graha_promotes_exactly_one_tier():
    """The tier check on the table itself.

    Mars 4/8, Jupiter 5/9 and Saturn 3/10 are the special aspects *because*
    each pair sits on one fraction of p.245's sight.  If a graha's two special
    houses ever read different fractions, the fractional table and the
    special-aspect table have drifted apart.
    """
    for planet in ("MARS", "JUPITER", "SATURN"):
        tiers = {
            _FRACTIONAL_DRISHTI[house]
            for house in aspect_houses(planet)
            if house != 7
        }
        assert len(tiers) == 1, (planet, tiers)


def test_effective_natural_class_uses_paksha_and_mercury_association():
    waxing = {"SUN": 1, "MOON": 4, "MERCURY": 10, "JUPITER": 10}
    waning = {"SUN": 1, "MOON": 8, "MERCURY": 10, "SATURN": 10}
    alone = {"SUN": 1, "MOON": 4, "MERCURY": 10}
    assert effective_natural_class("MOON", waxing) == "BENEFIC"
    assert effective_natural_class("MOON", waning) == "MALEFIC"
    assert effective_natural_class("MERCURY", waxing) == "BENEFIC"
    assert effective_natural_class("MERCURY", waning) == "MALEFIC"
    assert effective_natural_class("MERCURY", alone) == "BENEFIC"


def test_unassociated_mercury_is_benefic():
    """Ruled 2026-08-31. Budha is a natural benefic whose malefic turn is
    *conditional* on malefic company; with no company the condition never
    fires. It shipped as MALEFIC, which contradicted both classical readings
    and the Moon's own no-context fallback in the same function.

    A missing Mercury position is absent data, not a chart fact, and is benign
    for the same reason.
    """
    assert effective_natural_class("MERCURY", {"MERCURY": 10}) == "BENEFIC"
    assert effective_natural_class("MERCURY", {"MERCURY": 10, "JUPITER": 4}) == "BENEFIC"
    assert effective_natural_class("MERCURY", {"SUN": 1, "MOON": 4}) == "BENEFIC"
    # A single malefic sharing the rasi still turns it — the rule is intact.
    assert effective_natural_class("MERCURY", {"MERCURY": 10, "SATURN": 10}) == "MALEFIC"


def test_effective_natural_class_keeps_moon_benefic_without_sun_context():
    assert effective_natural_class("MOON", {"MOON": 4}) == "BENEFIC"
