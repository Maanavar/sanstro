from __future__ import annotations

import pytest

from app.calculations.astro import (
    chandrashtama_rasi_from_janma,
    is_chandrashtama,
    nakshatra_to_rasi,
)
from app.calculations.chart_strength import SIGN_LORD
from app.calculations.remedies import PLANET_REMEDY_CATALOG
from app.calculations.yogas import get_badhaka_lord

pytestmark = pytest.mark.no_db


def test_nakshatra_to_rasi_uses_pada_boundaries_for_split_stars() -> None:
    assert nakshatra_to_rasi(3, 1) == 1   # Karthigai pada 1: Mesham
    assert nakshatra_to_rasi(3, 2) == 2   # Karthigai pada 2: Rishabam
    assert nakshatra_to_rasi(5, 2) == 2   # Mirugaseeridam pada 2: Rishabam
    assert nakshatra_to_rasi(5, 3) == 3   # Mirugaseeridam pada 3: Mithunam
    assert nakshatra_to_rasi(7, 3) == 3   # Punarpoosam pada 3: Mithunam
    assert nakshatra_to_rasi(7, 4) == 4   # Punarpoosam pada 4: Kadagam
    assert nakshatra_to_rasi(21, 1) == 9  # Uthiradam pada 1: Dhanusu
    assert nakshatra_to_rasi(21, 2) == 10 # Uthiradam pada 2: Magaram


def test_nakshatra_to_rasi_preserves_legacy_invalid_pada_fallback() -> None:
    assert nakshatra_to_rasi(10, 0) == nakshatra_to_rasi(10, 1)
    with pytest.raises(ValueError):
        nakshatra_to_rasi(0, 1)
    with pytest.raises(ValueError):
        nakshatra_to_rasi(28, 1)


def test_chandrashtama_standard_is_eighth_rasi_not_eighth_nakshatra() -> None:
    assert chandrashtama_rasi_from_janma(4) == 11  # Kadagam -> Kumbam
    assert chandrashtama_rasi_from_janma(2) == 9   # Rishabam -> Dhanusu
    assert is_chandrashtama(4, 11) is True
    assert is_chandrashtama(4, 10) is False
    assert is_chandrashtama("Kadagam", "Kumbam") is True


def test_badhaka_lord_depends_on_lagna_not_always_saturn() -> None:
    assert get_badhaka_lord(1, SIGN_LORD) == "SATURN"   # movable: 11th from Mesham
    assert get_badhaka_lord(5, SIGN_LORD) == "MARS"     # fixed: 9th from Simmam
    assert get_badhaka_lord(3, SIGN_LORD) == "JUPITER"  # dual: 7th from Mithunam


def test_remedy_catalog_uses_tamil_navagraha_sthalam_circuit() -> None:
    assert PLANET_REMEDY_CATALOG["SUN"].temple_en.startswith("Sooriyanar")
    assert PLANET_REMEDY_CATALOG["MOON"].temple_en.startswith("Thingaloor")
    assert PLANET_REMEDY_CATALOG["MARS"].temple_en.startswith("Vaitheeswaran")
    assert PLANET_REMEDY_CATALOG["MERCURY"].temple_en.startswith("Thiruvenkadu")
    assert PLANET_REMEDY_CATALOG["JUPITER"].temple_en.startswith("Alangudi")
    assert PLANET_REMEDY_CATALOG["VENUS"].temple_en.startswith("Kanjanur")
