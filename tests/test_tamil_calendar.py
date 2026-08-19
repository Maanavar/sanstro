"""Regression coverage for Tamil solar month boundaries."""

from datetime import date

from app.calculations.tamil_calendar import tamil_solar_date

CHENNAI = (13.0827, 80.2707, "Asia/Kolkata")


def test_aavani_2026_verified_calendar_boundary() -> None:
    """The verified Chennai calendar assigns Aavani 1 to 18 August 2026."""
    latitude, longitude, timezone = CHENNAI

    assert tamil_solar_date(date(2026, 8, 17), timezone, latitude, longitude) == (3, 32)
    assert tamil_solar_date(date(2026, 8, 18), timezone, latitude, longitude) == (4, 1)
