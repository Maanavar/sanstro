from app.calculations.chart_strength import (
    _chesta_bala_score,
    compute_natal_planet_score,
    detect_planetary_wars,
)


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
