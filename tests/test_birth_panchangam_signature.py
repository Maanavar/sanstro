"""The birth panchangam signature (AAU-01, AAU-02, AAU-08, AAU-17).

What these pin, each against a definition rather than against the engine's own
earlier output:

* the five limbs are the limbs at the **birth instant**, recomputed here from
  the full ephemeris snapshot (a different call path from the one the signature
  uses), on 200 synthetic births and on births one minute either side of a
  tithi, nakshatra, yoga and karana change;
* a birth before sunrise belongs to the **previous Tamil day** (date, weekday,
  sunrise, and the sunrise the naazhigai counts from);
* the chart's nadi is porutham's nadi, for all 27 stars;
* the naazhigai is counted from full seconds.

All births are synthetic; no real person's data.
"""
from __future__ import annotations

import random
from datetime import UTC, date, datetime, time, timedelta
from zoneinfo import ZoneInfo

import pytest

from app.calculations.astro import normalize_longitude, utc_datetime_to_julian_day
from app.calculations.ephemeris import calculate_sidereal_planets
from app.calculations.porutham import nakshatra_nadi
from app.services._chart_build import _birth_panchangam_signature_items
from app.services._chart_planets import _nakshatra_nadi

TZ = "Asia/Kolkata"
CHENNAI = (13.0827, 80.2707)
MADURAI = (9.9252, 78.1198)


def _utc(d: date, t: time, tz: str = TZ) -> datetime:
    return datetime.combine(d, t, tzinfo=ZoneInfo(tz)).astimezone(UTC)


def _sig(d: date, t: time | None, place=CHENNAI) -> dict[str, object]:
    instant = _utc(d, t) if t is not None else None
    return dict(_birth_panchangam_signature_items(d, TZ, place[0], place[1], instant))


def _expected_limbs(instant: datetime) -> dict[str, int]:
    """Limb numbers from the full ephemeris snapshot at the instant."""
    snap = calculate_sidereal_planets(utc_datetime_to_julian_day(instant))
    sun = snap.bodies["SUN"].absolute_longitude
    moon = snap.bodies["MOON"].absolute_longitude
    diff = normalize_longitude(moon - sun)
    return {
        "tithi": int((diff + 1e-9) // 12) + 1,
        "nakshatra": int((moon + 1e-9) // (40 / 3)) + 1,
        "pada": int(((moon % (40 / 3)) + 1e-9) // (10 / 3)) + 1,
        "yoga": int((normalize_longitude(sun + moon) + 1e-9) // (40 / 3)) + 1,
        "karana": int((diff + 1e-9) // 6),
    }


def _names(limbs: dict[str, int]) -> dict[str, object]:
    from app.calculations.panchangam import NAKSHATRA_NAMES, _karana_name, _tithi_name, _yoga_name

    return {
        "tithi": _tithi_name(limbs["tithi"]),
        "tithi_paksha": "SHUKLA" if limbs["tithi"] <= 15 else "KRISHNA",
        "nakshatra": NAKSHATRA_NAMES[limbs["nakshatra"] - 1],
        "nakshatra_pada": limbs["pada"],
        "yogam": _yoga_name(limbs["yoga"]),
        "karanam": _karana_name(limbs["karana"]),
    }


def _assert_limbs_match(sig: dict[str, object], instant: datetime) -> None:
    expected = _names(_expected_limbs(instant))
    got = {k: sig[k] for k in expected}
    assert got == expected, f"birth {instant.isoformat()}"


# --- AAU-01: limbs at the birth instant -------------------------------------

def test_limbs_are_the_birth_instants_on_200_synthetic_births():
    rng = random.Random(20261029)
    for _ in range(200):
        d = date(1960, 1, 1) + timedelta(days=rng.randrange(365 * 50))
        t = time(rng.randrange(24), rng.randrange(60))
        _assert_limbs_match(_sig(d, t), _utc(d, t))


def _find_change(which: str, start: datetime) -> datetime:
    """The first instant after `start` at which the limb `which` changes, to the second."""
    def limb(at: datetime) -> int:
        return _expected_limbs(at)[which]

    lo, hi = start, start + timedelta(hours=1)
    first = limb(lo)
    while limb(hi) == first:
        lo, hi = hi, hi + timedelta(hours=1)
    while (hi - lo) > timedelta(seconds=1):
        mid = lo + (hi - lo) / 2
        if limb(mid) == first:
            lo = mid
        else:
            hi = mid
    return hi


@pytest.mark.parametrize("which", ["tithi", "nakshatra", "yoga", "karana"])
def test_limbs_follow_the_instant_one_minute_either_side_of_a_change(which):
    # Start mid-afternoon so the change found is not at the day's sunrise, where
    # the old sunrise-copying code would have been right by accident.
    start = _utc(date(1987, 3, 11), time(15, 0))
    change = _find_change(which, start)
    for instant in (change - timedelta(minutes=1), change + timedelta(minutes=1)):
        local = instant.astimezone(ZoneInfo(TZ))
        sig = _sig(local.date(), local.time().replace(second=0, microsecond=0))
        _assert_limbs_match(sig, _utc(local.date(), local.time().replace(second=0, microsecond=0)))
    before = _expected_limbs(change - timedelta(minutes=1))[which]
    after = _expected_limbs(change + timedelta(minutes=1))[which]
    assert before != after  # the pair really straddles a change


# --- AAU-02: the Tamil day runs sunrise to sunrise --------------------------

@pytest.mark.parametrize(
    ("d", "tamil_en", "vaaram"),
    [
        (date(1995, 4, 14), "Panguni 30", "THURSDAY"),
        (date(2001, 1, 15), "Thai 1", None),
        (date(1990, 7, 10), "Aani 25", None),
    ],
)
def test_a_birth_at_3am_is_on_the_previous_tamil_day(d, tamil_en, vaaram):
    sig = _sig(d, time(3, 0))
    assert sig["tamil_date_en"] == tamil_en
    assert sig["tamil_day_local"] == (d - timedelta(days=1)).isoformat()
    if vaaram:
        assert sig["vaaram"] == vaaram


@pytest.mark.parametrize("place", [CHENNAI, MADURAI])
@pytest.mark.parametrize("d", [date(1995, 1, 10), date(1995, 7, 10)])
def test_sunrise_is_the_boundary(place, d):
    """One minute after sunrise is that civil day; one minute before is the day before."""
    noon = _sig(d, time(12, 0), place)
    assert noon["tamil_day_local"] == d.isoformat()
    sunrise = datetime.strptime(str(noon["sunrise_time"]), "%I:%M:%S %p").time()
    sunrise_dt = datetime.combine(d, sunrise)
    after = (sunrise_dt + timedelta(minutes=1)).time()
    before = (sunrise_dt - timedelta(minutes=1)).time()

    assert _sig(d, after, place)["tamil_day_local"] == d.isoformat()
    assert _sig(d, after, place)["tamil_date_en"] == noon["tamil_date_en"]
    assert _sig(d, before, place)["tamil_day_local"] == (d - timedelta(days=1)).isoformat()


def test_a_pre_sunrise_birth_counts_naazhigai_from_the_previous_sunrise():
    sig = _sig(date(1995, 4, 14), time(3, 0))
    naazhigai, vinaadi = (int(x) for x in str(sig["birth_naazhigai"]).split("."))
    # ~21 hours after the previous sunrise: well past 50 naazhigai, under 60.
    assert 50 <= naazhigai < 60
    assert 0 <= vinaadi < 60


# --- AAU-17: naazhigai from full seconds ------------------------------------

def test_naazhigai_is_counted_from_full_seconds():
    d = date(1995, 1, 10)
    noon = _sig(d, time(12, 0))
    sunrise = datetime.combine(d, datetime.strptime(str(noon["sunrise_time"]), "%I:%M:%S %p").time())
    # Birth times are whole minutes, and sunrise is not, so the sunrise's own
    # seconds count: a vinaadi is 24 s, and dropping up to 59 s of sunrise (as
    # the old client count did) moves the answer by up to 2 vinaadi. The
    # printed sunrise is truncated to the second, so allow one vinaadi under.
    birth = (sunrise.replace(second=0) + timedelta(hours=4, minutes=12)).time()
    elapsed = int((datetime.combine(d, birth) - sunrise).total_seconds())
    expected = elapsed // 24
    naazhigai, vinaadi = (int(x) for x in str(_sig(d, birth)["birth_naazhigai"]).split("."))
    assert naazhigai * 60 + vinaadi in (expected, expected - 1)
    assert sunrise.second >= 24, "pick a date whose sunrise seconds make the old count differ"


def test_no_birth_time_keeps_the_sunrise_values_and_prints_no_naazhigai():
    sig = _sig(date(1995, 1, 10), None)
    assert sig["birth_naazhigai"] is None
    assert sig["tamil_day_local"] == "1995-01-10"


# --- AAU-08: one nadi table -------------------------------------------------

def test_the_chart_nadi_is_porutham_nadi_for_all_27_stars():
    for n in range(1, 28):
        assert _nakshatra_nadi(n).upper() == nakshatra_nadi(n), n


# --- AAU-16: the year line, from the Tamil day ------------------------------

def test_the_signature_carries_year_ayanam_and_ruthu_from_the_tamil_day():
    """03:00 on 14 Apr 1995 is Panguni 30 of the old year (AAU-02), so the
    jathagam's year line must be the old year's; 06:30 is Chithirai 1."""
    before, after = _sig(date(1995, 4, 14), time(3, 0)), _sig(date(1995, 4, 14), time(6, 30))
    assert before["tamil_year_en"] == "Bhava" and after["tamil_year_en"] == "Yuva"
    assert before["tamil_year_number"] == 8 and after["tamil_year_number"] == 9
    assert (before["ruthu_en"], after["ruthu_en"]) == ("Pinpani", "Ilavenil")
    assert before["ayanam_en"] == after["ayanam_en"] == "Uttarayanam"
