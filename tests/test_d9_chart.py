from datetime import datetime

from app.calculations.astro import local_datetime_to_utc, navamsa_rasi_from_degree, utc_datetime_to_julian_day
from app.calculations.d9_chart import calculate_d9_chart
from app.calculations.ephemeris import calculate_lagna_degree


def test_calculate_d9_chart_returns_all_nine_bodies():
    birth_utc = local_datetime_to_utc(datetime(1993, 3, 15, 8, 15), "Asia/Kolkata")
    jd_ut = utc_datetime_to_julian_day(birth_utc)
    snapshot = calculate_d9_chart(jd_ut, 13.0827, 80.2707)

    assert snapshot.jd_ut == jd_ut
    assert set(snapshot.bodies.keys()) == {
        "SUN",
        "MOON",
        "MARS",
        "MERCURY",
        "JUPITER",
        "VENUS",
        "SATURN",
        "RAHU",
        "KETU",
    }
    assert all(1 <= body.d9_rasi <= 12 for body in snapshot.bodies.values())


def test_d9_lagna_uses_navamsa_of_natal_lagna_degree():
    birth_utc = local_datetime_to_utc(datetime(1993, 3, 15, 8, 15), "Asia/Kolkata")
    jd_ut = utc_datetime_to_julian_day(birth_utc)
    lagna_degree = calculate_lagna_degree(jd_ut, 13.0827, 80.2707)
    expected_d9_lagna = navamsa_rasi_from_degree(lagna_degree)

    snapshot = calculate_d9_chart(jd_ut, 13.0827, 80.2707)
    assert snapshot.d9_lagna_rasi == expected_d9_lagna
