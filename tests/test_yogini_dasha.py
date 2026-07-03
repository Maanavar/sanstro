from __future__ import annotations

from datetime import datetime

import pytest

from app.calculations.astro import local_datetime_to_utc, utc_datetime_to_julian_day
from app.calculations.dasha import JULIAN_YEAR_DAYS
from app.calculations.yogini_dasha import (
    TOTAL_CYCLE_YEARS,
    YOGINI_RULING_PLANET,
    YOGINI_SEQUENCE,
    YOGINI_YEARS,
    calculate_opening_yogini,
    calculate_yogini_timeline,
    _yogini_sequence_from,
)

pytestmark = pytest.mark.no_db

# Same T003 reference chart used by test_golden_validation.py and
# test_jaimini_karakas.py (1993-03-15 08:15 IST, longitudes cross-verified
# to within 0.1 deg against a second ephemeris source).
_T003_MOON_LONGITUDE = 240.01137891


def _t003_birth_jd() -> float:
    dt_utc = local_datetime_to_utc(datetime(1993, 3, 15, 8, 15), "Asia/Kolkata")
    return utc_datetime_to_julian_day(dt_utc)


def test_yogini_years_sum_to_36() -> None:
    assert sum(YOGINI_YEARS.values()) == TOTAL_CYCLE_YEARS


def test_sequence_fixed_order_never_reversed() -> None:
    assert YOGINI_SEQUENCE == [
        "MANGALA", "PINGALA", "DHANYA", "BHRAMARI",
        "BHADRIKA", "ULKA", "SIDDHA", "SANKATA",
    ]


def test_opening_yogini_against_t003_reference_chart() -> None:
    # Moon at 240.01137891 deg -> nakshatra 19 (Moola, 240.0-253.33 deg).
    # remainder = (19 + 3) % 8 = 22 % 8 = 6 -> ULKA (Saturn, 6 years).
    # fraction_elapsed = 0.01137891 / 13.33333 = 0.00085342
    # balance_years = (1 - 0.00085342) * 6 = 5.99487948
    birth_jd = _t003_birth_jd()
    opening_yogini, balance_years, opening_end_jd = calculate_opening_yogini(_T003_MOON_LONGITUDE, birth_jd)

    assert opening_yogini == "ULKA"
    assert YOGINI_RULING_PLANET[opening_yogini] == "SATURN"
    assert balance_years == pytest.approx(5.99487948, abs=1e-4)
    assert opening_end_jd == pytest.approx(birth_jd + balance_years * JULIAN_YEAR_DAYS)


def test_opening_yogini_remainder_zero_maps_to_sankata() -> None:
    # Nakshatra 5 (Mrigashira): (5 + 3) % 8 == 0 -> treated as 8 -> SANKATA.
    # Longitude 53.3333 deg (start of nakshatra 5, degrees 53.33-66.67) gives
    # fraction_elapsed == 0, so balance == the full 8-year Sankata period.
    birth_jd = _t003_birth_jd()
    opening_yogini, balance_years, _ = calculate_opening_yogini(53.333333333, birth_jd)

    assert opening_yogini == "SANKATA"
    assert YOGINI_RULING_PLANET[opening_yogini] == "RAHU"
    assert balance_years == pytest.approx(8.0, abs=1e-6)


def test_sequence_from_rotates_without_reordering() -> None:
    rotated = _yogini_sequence_from("ULKA")
    assert rotated == ["ULKA", "SIDDHA", "SANKATA", "MANGALA", "PINGALA", "DHANYA", "BHRAMARI", "BHADRIKA"]


def test_timeline_current_mahadasha_at_birth_is_opening_yogini() -> None:
    birth_jd = _t003_birth_jd()
    timeline = calculate_yogini_timeline(birth_jd, _T003_MOON_LONGITUDE, as_of_jd=birth_jd)

    assert timeline.opening_yogini == "ULKA"
    assert timeline.current_mahadasha.lord == "ULKA"
    assert timeline.current_mahadasha.level == "maha"
    assert timeline.current_antardasha.level == "antar"
    # Opening antardasha at birth must itself be ULKA (the mahadasha's own
    # yogini leads its own antardasha sequence).
    assert timeline.current_antardasha.lord == "ULKA"


def test_antardashas_span_full_unclipped_mahadasha() -> None:
    birth_jd = _t003_birth_jd()
    timeline = calculate_yogini_timeline(birth_jd, _T003_MOON_LONGITUDE, as_of_jd=birth_jd)

    total_days = sum(p.end_jd - p.start_jd for p in timeline.antardashas)
    expected_days = YOGINI_YEARS["ULKA"] * JULIAN_YEAR_DAYS
    assert total_days == pytest.approx(expected_days, abs=1e-6)
    assert [p.lord for p in timeline.antardashas] == _yogini_sequence_from("ULKA")


def test_mahadasha_sequence_wraps_in_fixed_order_after_opening() -> None:
    birth_jd = _t003_birth_jd()
    timeline = calculate_yogini_timeline(birth_jd, _T003_MOON_LONGITUDE, as_of_jd=birth_jd)

    lords = [p.lord for p in timeline.mahadashas[:8]]
    assert lords == _yogini_sequence_from("ULKA")
    # A cyclic 8-yogini sequence repeating forever: cycle 2 reproduces the
    # exact same relative order as cycle 1 (rotating a periodic sequence and
    # repeating it is indistinguishable from the unrotated sequence repeating).
    assert [p.lord for p in timeline.mahadashas[8:16]] == lords
