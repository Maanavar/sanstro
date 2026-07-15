from app.calculations.bhava_chalit import compute_bhava_chalit


def test_bhava_chalit_equal_house_boundaries():
    result = compute_bhava_chalit(
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
