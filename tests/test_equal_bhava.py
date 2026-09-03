import pytest

from app.calculations.equal_bhava import compute_equal_bhava

pytestmark = pytest.mark.no_db


def test_equal_bhava_equal_house_boundaries():
    result = compute_equal_bhava(
        lagna_longitude=0.0,
        planet_longitudes={
            "SUN": 29.0,   # still in 1st house
            "MOON": 31.0,  # 2nd house
            "MARS": 44.0,  # 2nd house
        },
    )
    assert result["SUN"] == 1
    assert result["MOON"] == 2
    assert result["MARS"] == 2
