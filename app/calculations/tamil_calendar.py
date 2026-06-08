"""Tamil solar calendar (Thirukanitham) date conversion.

The Tamil month is the sidereal rasi the Sun occupies: the Sun's entry into a
rasi (sankranti) begins a new Tamil month. Per Thirukanitham tradition, the
month's first civil day is the sankranti day itself if the sankranti instant
falls before that day's sunrise; otherwise the first day is the day after.
The day-of-month is the civil-day count since that first day (=1).

    Mesha   -> Chithirai     Thula      -> Aippasi
    Rishaba -> Vaikasi       Vrischika  -> Karthigai
    Mithuna -> Aani          Dhanu      -> Margazhi
    Kataka  -> Aadi          Makara     -> Thai
    Simha   -> Aavani        Kumbha     -> Maasi
    Kanni   -> Purattasi      Meena     -> Panguni

Note: relies on the swisseph ephemeris (via `_sun_longitude_at_jd` and
`calculate_rise_transit_jd`). Verify output in an environment where swisseph
is available before relying on it.
"""
from __future__ import annotations

from datetime import UTC, date, datetime, time, timedelta
from zoneinfo import ZoneInfo

from app.calculations.astro import (
    julian_day_to_utc_datetime,
    normalize_longitude,
    utc_datetime_to_julian_day,
)
from app.calculations.ephemeris import calculate_rise_transit_jd
from app.calculations.tajaka import _sun_longitude_at_jd

# Index 0 == Mesha == Chithirai
TAMIL_MONTHS: list[tuple[str, str]] = [
    ("சித்திரை", "Chithirai"),
    ("வைகாசி", "Vaikasi"),
    ("ஆனி", "Aani"),
    ("ஆடி", "Aadi"),
    ("ஆவணி", "Aavani"),
    ("புரட்டாசி", "Purattasi"),
    ("ஐப்பசி", "Aippasi"),
    ("கார்த்திகை", "Karthigai"),
    ("மார்கழி", "Margazhi"),
    ("தை", "Thai"),
    ("மாசி", "Maasi"),
    ("பங்குனி", "Panguni"),
]

_MAX_MONTH_DAYS = 33  # solar months never exceed ~31-32 days; safety bound for the walk-back


def _local_midnight_jd(d: date, tz: ZoneInfo) -> float:
    midnight_local = datetime.combine(d, time(0, 0), tzinfo=tz)
    return utc_datetime_to_julian_day(midnight_local.astimezone(UTC))


def _sunrise_jd(d: date, tz: ZoneInfo, latitude: float, longitude: float) -> float:
    return calculate_rise_transit_jd(_local_midnight_jd(d, tz), latitude, longitude, rise=True)


def _solar_noon_jd(d: date, tz: ZoneInfo, latitude: float, longitude: float) -> float:
    """Midpoint between sunrise and sunset (madhyahna), mirroring panchangam.py's solar_noon."""
    sunrise_jd = _sunrise_jd(d, tz, latitude, longitude)
    sunset_jd = calculate_rise_transit_jd(sunrise_jd, latitude, longitude, rise=False)
    return sunrise_jd + (sunset_jd - sunrise_jd) / 2


def _sun_rasi_index_at_jd(jd: float) -> int:
    """Sidereal rasi index (0=Mesha) of the Sun at Julian Day `jd`."""
    return int(normalize_longitude(_sun_longitude_at_jd(jd)) // 30) % 12


def _find_sankranti_jd(rasi: int, before_jd: float) -> float:
    """Find the JD when the Sun entered `rasi`.

    `before_jd` must fall within `rasi` (i.e. the Sun is already in that rasi
    at that instant). Walks backward a day at a time until the rasi differs,
    then bisects the bracketed day to the exact crossing instant — mirroring
    the boundary-finding approach used for tithi/yoga in panchangam.py.
    """
    hi = before_jd
    lo = before_jd - 1.0
    steps = 0
    while _sun_rasi_index_at_jd(lo) == rasi:
        hi = lo
        lo -= 1.0
        steps += 1
        if steps > _MAX_MONTH_DAYS:
            raise ValueError("sankranti search exceeded maximum solar month length")

    base_angle = normalize_longitude(_sun_longitude_at_jd(lo))
    target_angle = rasi * 30.0
    continuous_target = target_angle if target_angle >= base_angle else target_angle + 360.0
    for _ in range(64):
        mid = (lo + hi) / 2
        angle = normalize_longitude(_sun_longitude_at_jd(mid))
        if angle < base_angle - 180.0:
            angle += 360.0
        if angle >= continuous_target:
            hi = mid
        else:
            lo = mid
    return hi


def tamil_solar_date(d: date, timezone_name: str, latitude: float, longitude: float) -> tuple[int, int]:
    """Return (month_index 0..11, day_of_month starting at 1) for civil date `d`.

    The Tamil month is the sidereal rasi the Sun occupies at solar noon
    (madhyahna) on `d`. A sankranti is assigned to its own civil day if the
    crossing instant falls before that day's solar noon, otherwise to the
    following day — the noon-cutoff rule used by Thirukanitham panchangams.
    Using noon (rather than sunrise) for both the month lookup and the
    cutoff check keeps the two self-consistent: a sankranti that crosses
    after sunrise but before noon would otherwise be attributed to the new
    month while the sunrise-based rasi lookup still reported the old one,
    producing a day-count jump at the boundary.
    """
    tz = ZoneInfo(timezone_name)
    noon_jd = _solar_noon_jd(d, tz, latitude, longitude)
    rasi = _sun_rasi_index_at_jd(noon_jd)

    sankranti_jd = _find_sankranti_jd(rasi, noon_jd)
    sankranti_date = julian_day_to_utc_datetime(sankranti_jd).astimezone(tz).date()
    sankranti_noon_jd = _solar_noon_jd(sankranti_date, tz, latitude, longitude)

    if sankranti_jd < sankranti_noon_jd:
        month_start_date = sankranti_date
    else:
        month_start_date = sankranti_date + timedelta(days=1)

    day_of_month = (d - month_start_date).days + 1
    return rasi, day_of_month


def format_tamil_date(d: date, timezone_name: str, latitude: float, longitude: float) -> tuple[str, str]:
    """Return (tamil_text, english_text), e.g. ("ஆடி 15", "Aadi 15")."""
    rasi, day = tamil_solar_date(d, timezone_name, latitude, longitude)
    ta, en = TAMIL_MONTHS[rasi]
    return f"{ta} {day}", f"{en} {day}"
