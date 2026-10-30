import pytest

from app.calculations.equal_bhava import compute_equal_bhava

pytestmark = pytest.mark.no_db


def test_the_lagna_degree_is_the_middle_of_the_first_house():
    """AAU-10: house 1 runs lagna - 15 to lagna + 15 (bhava madhya), not
    lagna to lagna + 30 (the Western equal-house cusp)."""
    result = compute_equal_bhava(
        lagna_longitude=0.0,
        planet_longitudes={
            "SUN": 14.9,    # 1st: within 15 of the madhya
            "MOON": 15.1,   # 2nd: past the sandhi at 15
            "MARS": 44.0,   # 2nd: madhya of the 2nd is 30
            "VENUS": 345.5, # 1st: 14.5 before the Lagna
            "SATURN": 344.5,  # 12th
        },
    )
    assert result == {"SUN": 1, "MOON": 2, "MARS": 2, "VENUS": 1, "SATURN": 12}


def test_the_audits_meenam_case():
    """Lagna Meenam 5.9 deg, Moon Magaram 3.9 deg: the 10th on the old
    cusp reckoning, the 11th on madhya, which is the rasi house too."""
    lagna = 330.0 + 5.9
    moon = 270.0 + 3.9
    assert compute_equal_bhava(lagna, {"MOON": moon}) == {"MOON": 11}
