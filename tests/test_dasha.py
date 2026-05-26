from datetime import datetime

import pytest

from app.calculations.astro import local_datetime_to_utc, nakshatra_from_degree, utc_datetime_to_julian_day
from app.calculations.dasha import NAK_LORD, calculate_opening_dasha, calculate_vimshottari_timeline
from app.calculations.ephemeris import calculate_sidereal_planets


def test_opening_dasha_from_reference_birth_chart_is_ketu():
    birth_datetime_utc = local_datetime_to_utc(datetime(1993, 3, 15, 8, 15), "Asia/Kolkata")
    jd_ut = utc_datetime_to_julian_day(birth_datetime_utc)
    snapshot = calculate_sidereal_planets(jd_ut)

    opening_lord, balance_years_at_birth, opening_end_jd = calculate_opening_dasha(
        snapshot.bodies["MOON"].absolute_longitude,
        jd_ut,
    )

    assert opening_lord == "KETU"
    assert balance_years_at_birth == pytest.approx(6.99, abs=0.05)
    assert opening_end_jd > jd_ut


def test_vimshottari_timeline_current_branch_starts_with_opening_lord():
    birth_datetime_utc = local_datetime_to_utc(datetime(1993, 3, 15, 8, 15), "Asia/Kolkata")
    jd_ut = utc_datetime_to_julian_day(birth_datetime_utc)
    snapshot = calculate_sidereal_planets(jd_ut)

    timeline = calculate_vimshottari_timeline(jd_ut, snapshot.bodies["MOON"].absolute_longitude, jd_ut)

    assert timeline.opening_lord == "KETU"
    assert timeline.current_mahadasha.lord == "KETU"
    assert timeline.current_antardasha.lord == "KETU"
    assert timeline.current_pratyantardasha.lord == "KETU"
    assert timeline.mahadashas[1].lord == "VENUS"
    assert timeline.mahadashas[0].start_jd == pytest.approx(jd_ut, abs=1e-9)


def test_t060_opening_dasha_independent_nakshatra_verification():
    birth_datetime_utc = local_datetime_to_utc(datetime(1993, 3, 15, 8, 15), "Asia/Kolkata")
    jd_ut = utc_datetime_to_julian_day(birth_datetime_utc)
    snapshot = calculate_sidereal_planets(jd_ut)
    moon_longitude = snapshot.bodies["MOON"].absolute_longitude

    moon_nakshatra = nakshatra_from_degree(moon_longitude)
    opening_lord, _, _ = calculate_opening_dasha(moon_longitude, jd_ut)

    assert moon_longitude == pytest.approx(240.01137891, abs=0.01)
    assert moon_nakshatra == 19
    assert NAK_LORD[moon_nakshatra] == "KETU"
    assert opening_lord == NAK_LORD[moon_nakshatra]
