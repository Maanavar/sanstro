from app.calculations.double_transit import score_double_transit


def test_double_transit_strong_bonus_when_jupiter_and_saturn_connect():
    score = score_double_transit(
        relevant_house_rasi=5,
        jupiter_transit_rasi=5,
        saturn_transit_rasi=11,  # Saturn aspects 5th by 7th aspect
        rahu_transit_rasi=2,
        natal_house_lord_rasi=1,
    )
    assert score == 15


def test_double_transit_strong_penalty_when_saturn_and_rahu_afflict_same_house():
    score = score_double_transit(
        relevant_house_rasi=8,
        jupiter_transit_rasi=3,
        saturn_transit_rasi=8,
        rahu_transit_rasi=8,
        natal_house_lord_rasi=1,
    )
    assert score == -10

