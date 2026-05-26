from __future__ import annotations

from datetime import datetime

import pytest

from app.calculations.astro import local_datetime_to_utc, utc_datetime_to_julian_day
from app.calculations.ephemeris import calculate_sidereal_planets


@pytest.mark.parametrize(
    ("case_id", "dt_local", "tz_name", "expected"),
    [
        (
            "GC1",
            datetime(1993, 3, 15, 8, 15),
            "Asia/Kolkata",
            {
                "SUN": 330.76342508,
                "MOON": 240.01137891,
                "MARS": 79.07542605,
                "MERCURY": 319.35056099,
                "JUPITER": 167.96021694,
                "VENUS": 355.97203864,
                "SATURN": 301.07930470,
                "RAHU": 232.78702194,
                "KETU": 52.78702194,
            },
        ),
        (
            "GC2",
            datetime(1988, 11, 2, 19, 45),
            "Asia/Kolkata",
            {
                "SUN": 196.67787727,
                "MOON": 119.50174538,
                "MARS": 336.36411927,
                "MERCURY": 180.16795704,
                "JUPITER": 40.00380905,
                "VENUS": 160.66870194,
                "SATURN": 245.36344290,
                "RAHU": 317.23091126,
                "KETU": 137.23091126,
            },
        ),
        (
            "GC3",
            datetime(2001, 6, 21, 14, 5),
            "America/New_York",
            {
                "SUN": 66.54298972,
                "MOON": 69.99136768,
                "MARS": 236.29974565,
                "MERCURY": 58.89090354,
                "JUPITER": 61.30716288,
                "VENUS": 21.34357073,
                "SATURN": 43.95691031,
                "RAHU": 72.71728179,
                "KETU": 252.71728179,
            },
        ),
        (
            "GC4",
            datetime(1976, 1, 9, 23, 20),
            "Europe/London",
            {
                "SUN": 265.31224758,
                "MOON": 0.12387644,
                "MARS": 51.99172616,
                "MERCURY": 284.14954808,
                "JUPITER": 352.78037018,
                "VENUS": 226.66903121,
                "SATURN": 96.84363639,
                "RAHU": 205.26654437,
                "KETU": 25.26654437,
            },
        ),
        (
            "GC5",
            datetime(2010, 9, 1, 6, 40),
            "Australia/Sydney",
            {
                "SUN": 134.32272656,
                "MOON": 34.04592580,
                "MARS": 176.70709160,
                "MERCURY": 139.42630479,
                "JUPITER": 336.99155511,
                "VENUS": 179.64876281,
                "SATURN": 160.09186694,
                "RAHU": 254.76442312,
                "KETU": 74.76442312,
            },
        ),
    ],
)
def test_t003_golden_case_expansion_all_9_planets(case_id, dt_local, tz_name, expected):
    dt_utc = local_datetime_to_utc(dt_local, tz_name)
    jd = utc_datetime_to_julian_day(dt_utc)
    snap = calculate_sidereal_planets(jd)

    for planet, expected_longitude in expected.items():
        actual = snap.bodies[planet].absolute_longitude
        assert actual == pytest.approx(expected_longitude, abs=0.1), (
            f"{case_id}/{planet} mismatch: expected {expected_longitude}, actual {actual}"
        )
