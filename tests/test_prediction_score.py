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


def _neutral_input(**overrides) -> PredictionScoreInput:
    base = dict(
        house_lord_strength=50,
        karaka_strength=50,
        yoga_present=False,
        yoga_strength="NONE",
        dosham_present=False,
        dosham_cancelled=False,
        dosham_strength="NONE",
        key_planet_strengths=[50],
        maha_lord_functional_nature="NEUTRAL",
        antar_lord_functional_nature="NEUTRAL",
        maha_lord_house_connection=False,
        antar_lord_house_connection=False,
        maha_lord_strength=50,
        maturation_multiplier=1.0,
        varga_confirmation=0,
        jupiter_house_score=0,
        saturn_house_score=0,
        double_transit_score=0,
        is_sade_sati=False,
        is_ashtama_sani=False,
        bav_delta=0,
        sav_delta=0,
    )
    base.update(overrides)
    return PredictionScoreInput(**base)


def test_absent_yoga_adds_nothing_whatever_its_label():
    """Detectors label an absent yoga WEAK (sometimes STRONG after a merge), so
    the strength alone must never earn the birth-promise bonus."""
    baseline = compute_prediction_score(_neutral_input()).l1_birth_promise
    absent_strong = compute_prediction_score(
        _neutral_input(yoga_present=False, yoga_strength="STRONG")
    ).l1_birth_promise
    present_strong = compute_prediction_score(
        _neutral_input(yoga_present=True, yoga_strength="STRONG")
    ).l1_birth_promise
    assert absent_strong == baseline
    assert present_strong > baseline


def test_absent_dosham_subtracts_nothing_whatever_its_label():
    baseline = compute_prediction_score(_neutral_input()).l1_birth_promise
    absent_strong = compute_prediction_score(
        _neutral_input(dosham_present=False, dosham_strength="STRONG")
    ).l1_birth_promise
    present_strong = compute_prediction_score(
        _neutral_input(dosham_present=True, dosham_strength="STRONG")
    ).l1_birth_promise
    assert absent_strong == baseline
    assert present_strong < baseline


def test_interpretation_copy_never_commands_the_act():
    """Owner-approved copy 2026-10-01. A timing score may favour preparation; it
    must not tell someone facing surgery or a large investment to "act fully".
    Tamil stays in the polite register — the old DIFFICULT band ended in the
    informal singular காத்திரு."""
    from app.calculations.prediction_score import _INTERPRETATION_SCALE

    codes = [code for _floor, code, _ta, _en in _INTERPRETATION_SCALE]
    assert codes == ["EXCEPTIONAL", "STRONG", "GOOD", "MIXED", "DIFFICULT", "VERY_WEAK"]
    for _floor, _code, ta, en in _INTERPRETATION_SCALE:
        for banned in ("act fully", "with confidence", "rare alignment", "Exceptional"):
            assert banned not in en, en
        assert not ta.endswith("காத்திரு"), ta
        assert "எடுக்கவும்" not in ta and "முன்னேறவும்" not in ta, ta


def test_maha_lord_strength_scales_the_dasha_layer_around_neutral():
    """Owner ruling 2026-10-01: a strong dasha lord gives its promise fully, a
    weak one partly. Centred on 50 so an average lord changes nothing."""
    layer = {
        s: compute_prediction_score(
            _neutral_input(maha_lord_functional_nature="YOGAKARAKA", maha_lord_strength=s)
        ).l3_dasha_activation
        for s in (0, 50, 100)
    }
    assert layer[0] < layer[50] < layer[100]
    # Neutral 50 reproduces the pre-ruling layer exactly: round(25*.6 + 10*.4) = 19.
    assert layer[50] == 19

