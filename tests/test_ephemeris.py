from datetime import datetime

import pytest

from app.calculations.astro import local_datetime_to_utc, utc_datetime_to_julian_day
from app.calculations.ephemeris import calculate_lagna_degree, calculate_sidereal_planets


def test_sidereal_planets_from_documented_birth_datetime():
    birth_datetime_utc = local_datetime_to_utc(
        datetime(1993, 3, 15, 8, 15),
        "Asia/Kolkata",
    )
    jd_ut = utc_datetime_to_julian_day(birth_datetime_utc)

    snapshot = calculate_sidereal_planets(jd_ut)

    assert snapshot.backend in {"pyswisseph", "swisseph-ffi"}
    assert snapshot.ayanamsa == "LAHIRI"
    assert snapshot.ayanamsa_value_degrees == pytest.approx(23.76211742, abs=0.01)
    assert snapshot.jd_ut == jd_ut
    assert snapshot.bodies["SUN"].absolute_longitude == pytest.approx(330.76342508, abs=0.01)
    assert snapshot.bodies["MOON"].absolute_longitude == pytest.approx(240.01137891, abs=0.01)
    assert snapshot.bodies["RAHU"].absolute_longitude == pytest.approx(232.78702194, abs=0.01)
    assert snapshot.bodies["KETU"].absolute_longitude == pytest.approx(52.78702194, abs=0.01)
    assert snapshot.bodies["SUN"].is_retrograde is False
    assert snapshot.bodies["SUN"].show_retrograde_badge is False
    assert snapshot.bodies["MOON"].show_retrograde_badge is False
    assert snapshot.bodies["RAHU"].show_retrograde_badge is False
    assert snapshot.bodies["KETU"].show_retrograde_badge is False
    assert snapshot.bodies["MERCURY"].is_retrograde is True
    assert snapshot.bodies["MERCURY"].show_retrograde_badge is True
    assert snapshot.bodies["VENUS"].is_retrograde is True
    assert snapshot.bodies["JUPITER"].is_retrograde is True
    assert snapshot.bodies["KETU"].absolute_longitude == pytest.approx(
        (snapshot.bodies["RAHU"].absolute_longitude + 180.0) % 360.0,
        abs=1e-9,
    )


def test_t020_lagna_changes_once_within_two_hour_window_for_chennai():
    latitude = 13.0827
    longitude = 80.2707
    times = [(8, 0), (8, 30), (9, 0), (9, 30), (10, 0)]

    lagna_rasis: list[int] = []
    for hour, minute in times:
        birth_datetime_utc = local_datetime_to_utc(
            datetime(1993, 3, 16, hour, minute),
            "Asia/Kolkata",
        )
        jd_ut = utc_datetime_to_julian_day(birth_datetime_utc)
        lagna_degree = calculate_lagna_degree(jd_ut, latitude, longitude)
        lagna_rasis.append(int((lagna_degree % 360) // 30) + 1)

    changes = sum(1 for i in range(1, len(lagna_rasis)) if lagna_rasis[i] != lagna_rasis[i - 1])
    assert changes == 1
