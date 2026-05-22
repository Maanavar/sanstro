from datetime import datetime

import pytest

from app.calculations.astro import local_datetime_to_utc, utc_datetime_to_julian_day
from app.calculations.ephemeris import calculate_sidereal_planets


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
