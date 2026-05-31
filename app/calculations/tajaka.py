from __future__ import annotations

from datetime import UTC, datetime

from app.calculations.astro import normalize_longitude, rasi_from_degree, utc_datetime_to_julian_day
from app.calculations.ephemeris import calculate_lagna_degree, calculate_sidereal_planets


def _sun_longitude_at_jd(jd: float) -> float:
    snap = calculate_sidereal_planets(jd)
    return normalize_longitude(snap.bodies["SUN"].absolute_longitude)


def _signed_angular_diff(current: float, target: float) -> float:
    """Signed angular difference in (-180, 180]."""
    return (current - target + 180.0) % 360.0 - 180.0


def find_solar_return_jd(
    natal_sun_longitude: float,
    return_year: int,
    latitude: float,
    longitude: float,
    ayanamsa_type: str = "LAHIRI",
) -> float:
    """
    Find the Julian Day of the solar return in return_year.
    Uses daily scan + bisection refinement.
    """
    _ = (latitude, longitude, ayanamsa_type)  # kept for signature compatibility
    target = normalize_longitude(natal_sun_longitude)

    jd_start = utc_datetime_to_julian_day(datetime(return_year, 1, 1, tzinfo=UTC))
    jd_end = utc_datetime_to_julian_day(datetime(return_year + 1, 1, 6, tzinfo=UTC))

    best_jd = jd_start
    best_abs_diff = 999.0
    probe = jd_start
    while probe <= jd_end:
        diff = abs(_signed_angular_diff(_sun_longitude_at_jd(probe), target))
        if diff < best_abs_diff:
            best_abs_diff = diff
            best_jd = probe
        probe += 1.0

    jd_lo = best_jd - 1.5
    jd_hi = best_jd + 1.5
    lo_diff = _signed_angular_diff(_sun_longitude_at_jd(jd_lo), target)
    hi_diff = _signed_angular_diff(_sun_longitude_at_jd(jd_hi), target)

    expand = 0
    while lo_diff * hi_diff > 0 and expand < 8:
        jd_lo -= 1.0
        jd_hi += 1.0
        lo_diff = _signed_angular_diff(_sun_longitude_at_jd(jd_lo), target)
        hi_diff = _signed_angular_diff(_sun_longitude_at_jd(jd_hi), target)
        expand += 1

    for _ in range(70):
        mid = (jd_lo + jd_hi) / 2.0
        mid_diff = _signed_angular_diff(_sun_longitude_at_jd(mid), target)
        if abs(mid_diff) < 1e-8:
            return mid
        if lo_diff * mid_diff <= 0:
            jd_hi = mid
            hi_diff = mid_diff
        else:
            jd_lo = mid
            lo_diff = mid_diff

    return (jd_lo + jd_hi) / 2.0


def calculate_muntha(natal_lagna_rasi: int, birth_year: int, return_year: int) -> int:
    """Muntha advances one rasi per year from natal Lagna."""
    years_elapsed = return_year - birth_year
    return ((natal_lagna_rasi - 1 + years_elapsed) % 12) + 1


def calculate_tajaka_chart(
    natal_sun_longitude: float,
    natal_lagna_rasi: int,
    birth_year: int,
    return_year: int,
    birth_latitude: float,
    birth_longitude: float,
    ayanamsa_type: str = "LAHIRI",
) -> dict:
    from app.calculations.astro import RASI_NAMES

    sr_jd = find_solar_return_jd(
        natal_sun_longitude=natal_sun_longitude,
        return_year=return_year,
        latitude=birth_latitude,
        longitude=birth_longitude,
        ayanamsa_type=ayanamsa_type,
    )
    snap = calculate_sidereal_planets(sr_jd)
    lagna_longitude = calculate_lagna_degree(sr_jd, birth_latitude, birth_longitude)
    sr_lagna_rasi = rasi_from_degree(lagna_longitude)
    muntha = calculate_muntha(natal_lagna_rasi, birth_year, return_year)

    return {
        "julian_day": sr_jd,
        "return_year": return_year,
        "sr_lagna_rasi": sr_lagna_rasi,
        "sr_lagna_rasi_name": RASI_NAMES.get(sr_lagna_rasi, ""),
        "muntha_rasi": muntha,
        "muntha_rasi_name": RASI_NAMES.get(muntha, ""),
        "sun_longitude_at_return": normalize_longitude(snap.bodies["SUN"].absolute_longitude),
        "lagna_matches_natal": sr_lagna_rasi == natal_lagna_rasi,
        "planets": snap,
    }

