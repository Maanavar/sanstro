import pytest

from app.calculations.dasha_house_mapping import get_dasha_activated_houses


def test_mesha_lagna_mars_activates_houses_1_and_8():
    assert get_dasha_activated_houses("MARS", 1) == [1, 8]


def test_mesha_lagna_venus_activates_houses_2_and_7():
    assert get_dasha_activated_houses("VENUS", 1) == [2, 7]


def test_thulaam_lagna_saturn_activates_houses_4_and_5():
    assert get_dasha_activated_houses("SATURN", 7) == [4, 5]


def test_rahu_and_ketu_have_no_house_ownership():
    assert get_dasha_activated_houses("RAHU", 1) == []
    assert get_dasha_activated_houses("KETU", 1) == []


def test_invalid_lagna_raises_value_error():
    with pytest.raises(ValueError):
        get_dasha_activated_houses("MARS", 0)
