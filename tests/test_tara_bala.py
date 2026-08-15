from __future__ import annotations

import pytest

from app.calculations.tara_bala import chandra_bala, tara_number


@pytest.mark.no_db
@pytest.mark.parametrize(
    ("janma", "day", "expected"),
    [(4, 4, 1), (1, 2, 2), (1, 3, 3), (1, 9, 9), (27, 1, 2)],
)
def test_tara_number_uses_the_27_star_circle(janma, day, expected):
    assert tara_number(janma, day) == expected


@pytest.mark.no_db
@pytest.mark.parametrize(
    ("janma", "transit", "expected"),
    [(1, 1, 1), (1, 4, 4), (1, 8, 8), (1, 12, 12), (12, 1, 2)],
)
def test_chandra_bala_returns_the_house_from_janma_rasi(janma, transit, expected):
    assert chandra_bala(janma, transit) == expected


@pytest.mark.no_db
def test_shared_helpers_reject_invalid_domains():
    with pytest.raises(ValueError):
        tara_number(0, 1)
    with pytest.raises(ValueError):
        tara_number(1, 28)
    with pytest.raises(ValueError):
        chandra_bala(13, 1)
