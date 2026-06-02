from app.calculations.maturation import maturation_multiplier
from app.calculations.prediction_score import PredictionScoreInput, compute_prediction_score


def test_maturation_multiplier_windows():
    assert maturation_multiplier("MARS", 20.0) == 0.70
    assert maturation_multiplier("MARS", 28.0) == 1.10
    assert maturation_multiplier("MARS", 35.0) == 1.00


def test_prediction_score_layer_sum_and_bounds():
    inp = PredictionScoreInput(
        house_lord_strength=75,
        karaka_strength=70,
        yoga_present=True,
        yoga_strength="STRONG",
        dosham_present=False,
        dosham_cancelled=False,
        dosham_strength="NONE",
        key_planet_strengths=[70, 65, 80],
        maha_lord_functional_nature="TRIKONA",
        antar_lord_functional_nature="KENDRA",
        maha_lord_house_connection=True,
        antar_lord_house_connection=True,
        maha_lord_strength=72,
        maturation_multiplier=1.10,
        varga_confirmation=10,
        jupiter_house_score=78,
        saturn_house_score=-12,
        double_transit_score=15,
        is_sade_sati=False,
        is_ashtama_sani=False,
        bav_delta=5,
        sav_delta=3,
    )
    out = compute_prediction_score(inp)
    assert 0 <= out.total <= 100
    assert out.total == (
        out.l1_birth_promise
        + out.l2_planet_strength
        + out.l3_dasha_activation
        + out.l4_varga_confirmation
        + out.l5_transit_support
        + out.l6_ashtakavarga
    )

