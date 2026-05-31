from __future__ import annotations

from app.calculations.astro import julian_day_to_utc_datetime, normalize_longitude
from app.calculations.ephemeris import calculate_sidereal_planets
from app.calculations.tajaka import calculate_muntha, find_solar_return_jd

CHENNAI_LAT = 13.0827
CHENNAI_LON = 80.2707


def test_solar_return_sun_matches_natal() -> None:
    natal_sun = 285.5
    sr_jd = find_solar_return_jd(natal_sun, 2026, CHENNAI_LAT, CHENNAI_LON)
    snap = calculate_sidereal_planets(sr_jd)
    diff = abs(normalize_longitude(snap.bodies["SUN"].absolute_longitude) - natal_sun)
    diff = min(diff, 360.0 - diff)
    assert diff < 0.01, f"Sun longitude diff too large: {diff}"


def test_solar_return_jd_is_in_correct_year() -> None:
    natal_sun = 120.0
    sr_jd = find_solar_return_jd(natal_sun, 2026, CHENNAI_LAT, CHENNAI_LON)
    sr_dt = julian_day_to_utc_datetime(sr_jd)
    assert sr_dt.year == 2026


def test_muntha_moves_one_rasi_per_year() -> None:
    natal_lagna = 3
    birth_year = 2000
    muntha_year1 = calculate_muntha(natal_lagna, birth_year, 2001)
    assert muntha_year1 == 4


def test_muntha_wraps_after_meenam() -> None:
    natal_lagna = 12
    muntha = calculate_muntha(natal_lagna, 2000, 2001)
    assert muntha == 1


def test_muntha_at_birth_year_equals_lagna() -> None:
    natal_lagna = 7
    muntha = calculate_muntha(natal_lagna, 2000, 2000)
    assert muntha == natal_lagna

