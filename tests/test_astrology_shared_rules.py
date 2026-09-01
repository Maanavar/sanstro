from __future__ import annotations

from datetime import date, datetime, time

import pytest

from app.calculations.astro import (
    chandrashtama_rasi_from_janma,
    is_chandrashtama,
    local_datetime_to_utc,
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
    assert nakshatra_to_rasi(12, 1) == 5  # Uthiram pada 1: Simmam
    assert nakshatra_to_rasi(12, 2) == 6  # Uthiram pada 2: Kanni
    assert nakshatra_to_rasi(14, 2) == 6  # Chithirai pada 2: Kanni
    assert nakshatra_to_rasi(14, 3) == 7  # Chithirai pada 3: Thulam
    assert nakshatra_to_rasi(16, 3) == 7  # Visakam pada 3: Thulam
    assert nakshatra_to_rasi(16, 4) == 8  # Visakam pada 4: Viruchigam
    assert nakshatra_to_rasi(21, 1) == 9  # Uthiradam pada 1: Dhanusu
    assert nakshatra_to_rasi(21, 2) == 10 # Uthiradam pada 2: Magaram
    assert nakshatra_to_rasi(23, 2) == 10 # Avittam pada 2: Magaram
    assert nakshatra_to_rasi(23, 3) == 11 # Avittam pada 3: Kumbam
    assert nakshatra_to_rasi(25, 3) == 11 # Poorattathi pada 3: Kumbam
    assert nakshatra_to_rasi(25, 4) == 12 # Poorattathi pada 4: Meenam


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


def test_chandrashtama_mesha_moon_is_vrishchika() -> None:
    # Workboard A-03: Moon in Mesha (rasi 1) → Chandrashtama when transit Moon is in Vrishchika (rasi 8)
    assert chandrashtama_rasi_from_janma(1) == 8   # Mesham -> Vrishchikam
    assert is_chandrashtama(1, 8) is True           # transit Moon in Vrishchika → chandrashtama
    assert is_chandrashtama(1, 3) is False          # transit Moon in Mithuna → not chandrashtama


def test_badhaka_lord_depends_on_lagna_not_always_saturn() -> None:
    assert get_badhaka_lord(1, SIGN_LORD) == "SATURN"   # movable: 11th from Mesham
    assert get_badhaka_lord(5, SIGN_LORD) == "MARS"     # fixed: 9th from Simmam
    assert get_badhaka_lord(3, SIGN_LORD) == "JUPITER"  # dual: 7th from Mithunam


# ---------------------------------------------------------------------------
# P2-08 — Historical timezone reconstruction uses ZoneInfo fold disambiguation
# ---------------------------------------------------------------------------

def test_historical_birth_utc_reconstruction_india_pre_1947() -> None:
    """local_datetime_to_utc uses ZoneInfo (not pytz.replace) so historical Indian births
    get correct UTC even for pre-1947 dates. IANA records IST (+05:30) from 1906-01-01. (P2-08)"""
    local_dt = datetime.combine(date(1946, 6, 15), time(10, 30))
    utc_dt = local_datetime_to_utc(local_dt, "Asia/Kolkata")

    # IST = UTC+05:30 since 1906 per IANA tzdb
    assert utc_dt.tzinfo is not None
    expected_utc_hour = 5  # 10:30 IST − 5:30 = 05:00 UTC
    assert utc_dt.hour == expected_utc_hour
    assert utc_dt.minute == 0
    assert utc_dt.tzinfo.utcoffset(utc_dt).total_seconds() == 0


def test_historical_birth_utc_reconstruction_roundtrip() -> None:
    """Round-trip: converting back from UTC to IST must recover the original local time."""
    from zoneinfo import ZoneInfo

    local_dt = datetime.combine(date(1940, 1, 1), time(6, 0))
    utc_dt = local_datetime_to_utc(local_dt, "Asia/Kolkata")
    ist = ZoneInfo("Asia/Kolkata")
    recovered = utc_dt.astimezone(ist).replace(tzinfo=None)
    assert recovered == local_dt


def test_remedy_catalog_uses_tamil_navagraha_sthalam_circuit() -> None:
    assert PLANET_REMEDY_CATALOG["SUN"].temple_en.startswith("Sooriyanar")
    assert PLANET_REMEDY_CATALOG["MOON"].temple_en.startswith("Thingaloor")
    assert PLANET_REMEDY_CATALOG["MARS"].temple_en.startswith("Vaitheeswaran")
    assert PLANET_REMEDY_CATALOG["MERCURY"].temple_en.startswith("Thiruvenkadu")
    assert PLANET_REMEDY_CATALOG["JUPITER"].temple_en.startswith("Alangudi")
    assert PLANET_REMEDY_CATALOG["VENUS"].temple_en.startswith("Kanjanur")
