from concurrent.futures import ThreadPoolExecutor
from datetime import date, datetime, timedelta, timezone

import pytest

from app.calculations.festivals import get_festivals_for_date
from app.calculations.panchangam import (
    NAKSHATRA_NAMES,
    _amirdhadhi_yogam_name,
    _compute_subha_muhurtham_broad,
    _compute_subha_muhurtham_strict,
    _jeevan_value,
    _nethiram_value,
    _special_tithi_durations_for_civil_day,
    best_gowri_slot,
    calculate_daily_panchangam,
    dominant_special_tithi_for_civil_day,
    gowri_category_rank,
)
from app.schemas.panchangam import PanchangamMonthlyQuery
from app.services.panchangam_service import build_monthly_panchangam

pytestmark = pytest.mark.no_db

GOWRI_GOOD_NAMES = {"AMIRTHAM", "UTHI", "LABHAM", "DHANAM", "SUGAM"}
GOWRI_BAD_NAMES = {"ROGAM", "SORAM", "VISHAM"}


def test_subha_muhurtham_excludes_tuesday_and_saturday_per_tamil_tradition():
    monday_broad, _ = _compute_subha_muhurtham_broad(5, "ROHINI", 0)
    monday_strict, _ = _compute_subha_muhurtham_strict(5, "SHUKLA", "ROHINI", "SIDDHA", 0, False)
    tuesday_broad, tuesday_reason = _compute_subha_muhurtham_broad(5, "ROHINI", 1)
    saturday_broad, saturday_reason = _compute_subha_muhurtham_broad(5, "ROHINI", 5)
    tuesday_strict, tuesday_strict_reason = _compute_subha_muhurtham_strict(
        5, "SHUKLA", "ROHINI", "SIDDHA", 1, False
    )
    saturday_strict, saturday_strict_reason = _compute_subha_muhurtham_strict(
        5, "SHUKLA", "ROHINI", "SIDDHA", 5, False
    )

    assert monday_broad is True
    assert monday_strict is True
    assert tuesday_broad is False
    assert saturday_broad is False
    assert tuesday_strict is False
    assert saturday_strict is False
    assert "Tuesday excluded for Subha Muhurtham" in tuesday_reason
    assert "Saturday excluded for Subha Muhurtham" in saturday_reason
    assert "Tuesday excluded for Subha Muhurtham" in tuesday_strict_reason
    assert "Saturday excluded for Subha Muhurtham" in saturday_strict_reason


def test_festival_tags_preserve_religion_and_government_holiday_categories():
    festivals = get_festivals_for_date(date(2026, 2, 1), 1, "SHUKLA", "ASHWINI")

    thai_poosam = next(item for item in festivals if item["name"] == "Thai Poosam")
    assert thai_poosam["category"] == "hindu"
    assert set(thai_poosam["tags"]) == {"hindu", "tamilnadu_govt"}

    republic_day = next(
        item
        for item in get_festivals_for_date(date(2026, 1, 26), 1, "SHUKLA", "ASHWINI")
        if item["name"] == "Republic Day"
    )
    assert republic_day["category"] == "indian_govt"
    assert set(republic_day["tags"]) == {"indian_govt", "tamilnadu_govt"}


def test_thiruvonam_is_available_for_monthly_vratha_grouping():
    festivals = get_festivals_for_date(date(2026, 8, 28), 12, "SHUKLA", "THIRUVONAM")

    assert any(item["name"] == "Thiruvonam Vratam" for item in festivals)


def test_sani_pradhosam_replaces_generic_pradhosam_on_saturday():
    festivals = get_festivals_for_date(date(2026, 6, 13), 13, "KRISHNA", "ASHWINI")
    festival_names = [item["name"] for item in festivals]

    assert "Sani Pradhosam" in festival_names
    assert "Pradhosam" not in festival_names


def test_pradhosam_is_dated_from_pradhosha_kalam_tithi_not_sunrise():
    """Issue #10: Pradhosam is a sunset (pradhosha-kalam) vrata. When Trayodashi
    (13th) is only reached after sunrise but is present at sunset, Pradhosam is
    observed that evening; when it has already passed by sunset, it is not — the
    sunrise tithi must not decide it."""
    # Sunrise still Dvadasi (12), but Trayodashi (13) prevails at pradhosha-kalam.
    names_when_sunset_is_13 = {
        item["name"]
        for item in get_festivals_for_date(
            date(2026, 3, 31), 12, "SHUKLA", "ASHWINI", pradhosham_tithi_number=13
        )
    }
    assert "Pradhosam" in names_when_sunset_is_13

    # Sunrise is Trayodashi (13), but by pradhosha-kalam it has advanced to Chaturdasi (14).
    names_when_sunset_is_14 = {
        item["name"]
        for item in get_festivals_for_date(
            date(2026, 3, 31), 13, "SHUKLA", "ASHWINI", pradhosham_tithi_number=14
        )
    }
    assert "Pradhosam" not in names_when_sunset_is_14


def test_snapshot_computes_pradhosha_kalam_tithi():
    snapshot = calculate_daily_panchangam(date(2026, 6, 13), 13.0827, 80.2707, "Asia/Kolkata")
    # Sunset tithi is a valid 1..30 tithi index and is derived at pradhosha-kalam.
    assert 1 <= snapshot.pradhosham_tithi_number <= 30


def test_daily_panchangam_uses_documented_2026_05_21_reference_case():
    snapshot = calculate_daily_panchangam(date(2026, 5, 21), 9.9252, 78.1198, "Asia/Kolkata")

    expected_sunrise = datetime(2026, 5, 21, 5, 53, tzinfo=timezone(timedelta(hours=5, minutes=30)))
    expected_sunset = datetime(2026, 5, 21, 18, 33, tzinfo=timezone(timedelta(hours=5, minutes=30)))

    assert snapshot.weekday == "THURSDAY"
    assert snapshot.weekday_lord == "GURU"
    assert snapshot.tithi_number == 5
    assert snapshot.tithi_name == "PANCHAMI"
    assert snapshot.tithi_paksha == "SHUKLA"
    assert abs((snapshot.sunrise - expected_sunrise).total_seconds()) < 300
    assert abs((snapshot.sunset - expected_sunset).total_seconds()) < 300
    assert snapshot.sunrise < snapshot.solar_noon < snapshot.sunset
    assert snapshot.rahu_kalam.slot == 6
    assert snapshot.yamagandam.slot == 1
    assert snapshot.kuligai.slot == 3
    assert snapshot.gowri_panchangam[0].name == "DHANAM"
    assert snapshot.gowri_panchangam[0].period == "DAY"
    assert len(snapshot.gowri_nalla_neram) == 2
    assert {s.period for s in snapshot.gowri_nalla_neram} == {"DAY", "NIGHT"}
    assert all(s.name is None and s.is_good is True for s in snapshot.gowri_nalla_neram)
    assert len(snapshot.nalla_neram) == 2
    assert {s.period for s in snapshot.nalla_neram} == {"AM", "PM"}
    assert all(s.name is None and s.is_good is True for s in snapshot.nalla_neram)
    assert snapshot.abhijit_restricted is False
    assert len(snapshot.hora) == 24
    assert snapshot.hora[0].lord == "GURU"
    assert snapshot.hora[12].lord == "MOON"


def test_weekday_kalam_slots_match_qa_reference():
    snapshot = calculate_daily_panchangam(date(2025, 5, 20), 11.0168, 76.9558, "Asia/Kolkata")

    assert snapshot.weekday == "TUESDAY"
    assert snapshot.rahu_kalam.slot == 7
    assert snapshot.yamagandam.slot == 3
    assert snapshot.kuligai.slot == 5


def test_daily_panchangam_is_stable_under_parallel_calls():
    args = (date(2026, 5, 21), 13.0827, 80.2707, "Asia/Kolkata")

    with ThreadPoolExecutor(max_workers=8) as pool:
        futures = [pool.submit(calculate_daily_panchangam, *args) for _ in range(24)]
        snapshots = [future.result() for future in futures]

    assert len(snapshots) == 24
    assert all(snapshot.sunrise < snapshot.solar_noon < snapshot.sunset for snapshot in snapshots)
    assert all(snapshot.tithi_number >= 1 for snapshot in snapshots)


def test_gowri_panchangam_names_match_full_gowri_engine():
    cases = [
        (date(2026, 6, 7), "SUNDAY",    ("UTHI",     "AMIRTHAM", "ROGAM",  "LABHAM")),
        (date(2026, 6, 1), "MONDAY",    ("AMIRTHAM", "ROGAM",    "LABHAM", "DHANAM")),
        (date(2026, 6, 2), "TUESDAY",   ("ROGAM",    "LABHAM",   "DHANAM", "SUGAM")),
        (date(2026, 6, 3), "WEDNESDAY", ("LABHAM",   "DHANAM",   "SUGAM",  "SORAM")),
        (date(2026, 6, 4), "THURSDAY",  ("DHANAM",   "SUGAM",    "SORAM",  "VISHAM")),
        (date(2026, 6, 5), "FRIDAY",    ("SUGAM",    "SORAM",    "VISHAM", "UTHI")),
        (date(2026, 6, 6), "SATURDAY",  ("SORAM",    "VISHAM",   "UTHI",   "AMIRTHAM")),
    ]
    for d, expected_weekday, expected_first_day_names in cases:
        snap = calculate_daily_panchangam(d, 9.9252, 78.1198, "Asia/Kolkata")
        assert snap.weekday == expected_weekday, f"{d}: weekday mismatch"
        assert len(snap.gowri_panchangam) == 16
        actual_first_day_names = tuple(s.name for s in snap.gowri_panchangam[:4])
        assert actual_first_day_names == expected_first_day_names
        assert {s.name for s in snap.gowri_panchangam}.issubset(GOWRI_GOOD_NAMES | GOWRI_BAD_NAMES)
        assert all(s.name in GOWRI_GOOD_NAMES for s in snap.gowri_panchangam if s.is_good)
        assert len(snap.gowri_nalla_neram) == 2
        assert {s.period for s in snap.gowri_nalla_neram} == {"DAY", "NIGHT"}


def test_saturday_night_gowri_table_ends_with_rogam():
    snap = calculate_daily_panchangam(date(2026, 6, 6), 9.9252, 78.1198, "Asia/Kolkata")

    assert snap.weekday == "SATURDAY"
    assert snap.gowri_panchangam[-1].period == "NIGHT"
    assert snap.gowri_panchangam[-1].name == "ROGAM"


def test_best_gowri_slot_uses_category_ranking_before_time():
    snap = calculate_daily_panchangam(date(2026, 6, 6), 13.0827, 80.2707, "Asia/Kolkata")

    # Saturday day kalas: SORAM, VISHAM, UTHI, AMIRTHAM, ROGAM, LABHAM, DHANAM, SUGAM.
    # Good slots appear in time order: UTHI (slot 3), AMIRTHAM (slot 4), LABHAM (slot 6),
    # DHANAM (slot 7), SUGAM (slot 8).
    # best_gowri_slot must pick AMIRTHAM (rank 1) even though UTHI appears first in time.
    day_good_slots = [s for s in snap.gowri_panchangam if s.period == "DAY" and s.is_good]
    assert day_good_slots[0].name == "UTHI"
    assert best_gowri_slot(day_good_slots).name == "AMIRTHAM"
    assert gowri_category_rank("AMIRTHAM") < gowri_category_rank("UTHI")
    assert gowri_category_rank("LABHAM") < gowri_category_rank("ROGAM")


def test_nalla_and_gowri_nalla_neram_use_compact_tamil_calendar_windows():
    snap = calculate_daily_panchangam(date(2026, 6, 8), 13.0827, 80.2707, "Asia/Kolkata")

    assert snap.weekday == "MONDAY"
    assert [(s.period, s.start.strftime("%H:%M"), s.end.strftime("%H:%M")) for s in snap.nalla_neram] == [
        ("AM", "06:30", "07:30"),
        ("PM", "16:30", "17:30"),
    ]
    assert [(s.period, s.start.strftime("%H:%M"), s.end.strftime("%H:%M")) for s in snap.gowri_nalla_neram] == [
        ("DAY", "05:41", "07:18"),
        ("NIGHT", "18:34", "19:57"),
    ]
    assert all(s.name is None and s.is_good is True for s in snap.nalla_neram + snap.gowri_nalla_neram)


def test_yoga_karana_chandrashtamam_have_transition_metadata():
    snap = calculate_daily_panchangam(date(2026, 6, 8), 13.0827, 80.2707, "Asia/Kolkata")

    assert snap.sunrise < snap.yoga_ends_at < snap.sunrise + timedelta(days=2)
    assert snap.yoga_next_name
    assert snap.yoga_next_name != snap.yoga_name
    assert snap.sunrise < snap.karana_ends_at < snap.sunrise + timedelta(days=2)
    assert snap.karana_next_name
    assert snap.karana_next_name != snap.karana_name
    assert snap.chandrashtamam_affected_janma_rasi_number == (
        (snap.chandrashtamam_moon_rasi_number - 8) % 12
    ) + 1
    assert snap.chandrashtamam_janma_nakshatra_windows
    assert snap.chandrashtamam_janma_nakshatra_windows[0].start.date() == date(2026, 6, 8)
    assert snap.chandrashtamam_janma_nakshatra_windows[0].start <= snap.sunrise <= snap.chandrashtamam_janma_nakshatra_windows[-1].end
    assert all(window.start < window.end for window in snap.chandrashtamam_janma_nakshatra_windows)
    assert all(window.name in NAKSHATRA_NAMES for window in snap.chandrashtamam_janma_nakshatra_windows)


def test_amavasai_pournami_use_dominant_civil_day_marker():
    timezone_name = "Asia/Kolkata"
    start = date(2026, 6, 1)
    flagged: dict[int, list[date]] = {15: [], 30: []}

    for offset in range(45):
        current = start + timedelta(days=offset)
        special = dominant_special_tithi_for_civil_day(current, timezone_name)
        if special not in {15, 30}:
            continue

        current_duration = _special_tithi_durations_for_civil_day(current, timezone_name)[special]
        previous_duration = _special_tithi_durations_for_civil_day(current - timedelta(days=1), timezone_name)[special]
        next_duration = _special_tithi_durations_for_civil_day(current + timedelta(days=1), timezone_name)[special]

        assert current_duration >= previous_duration
        assert current_duration >= next_duration
        snapshot = calculate_daily_panchangam(current, 13.0827, 80.2707, timezone_name)
        assert snapshot.special_tithi_day_number == special
        flagged[special].append(current)

    assert flagged[15]
    assert flagged[30]


def test_monthly_builder_uses_sunrise_governing_labels():
    """Issue #9: the monthly grid names each day by the tithi/nakshatra present at
    sunrise (உதய rule), matching the daily endpoint and the dashboard home — not a
    separate longest-span (dominant) value."""
    response = build_monthly_panchangam(
        PanchangamMonthlyQuery(year=2026, month=6, lat=13.0827, lng=80.2707, timezone="Asia/Kolkata")
    )

    assert response.data.entries
    for entry in response.data.entries:
        day = date.fromisoformat(str(entry.date_local))
        snapshot = calculate_daily_panchangam(day, 13.0827, 80.2707, "Asia/Kolkata")
        assert entry.tithi_number == snapshot.tithi_number
        assert entry.nakshatra_name == snapshot.nakshatra_name


def test_monthly_builder_exposes_sunrise_based_tamil_muhurtham_days():
    response = build_monthly_panchangam(
        PanchangamMonthlyQuery(year=2026, month=6, lat=13.0827, lng=80.2707, timezone="Asia/Kolkata")
    )

    june_7 = next(entry for entry in response.data.entries if str(entry.date_local) == "2026-06-07")
    june_18 = next(entry for entry in response.data.entries if str(entry.date_local) == "2026-06-18")

    # Almanac (curated) muhurtham days are independent of the engine's own check.
    assert june_7.is_tamil_muhurtham_day is True
    assert june_18.is_tamil_muhurtham_day is True
    # The engine's broad/strict subha check now reads the sunrise-governing tithi &
    # nakshatra (issue #9): 2026-06-07 has Avittam (a subha nakshatra) at sunrise, so
    # the broad check passes; 2026-06-18 has a Rikta tithi (4th) at sunrise, so it fails.
    assert june_7.is_subha_muhurtham is True
    assert june_7.is_subha_muhurtham_strict is False
    assert june_18.is_subha_muhurtham is False


def test_nethiram_jeevan_use_sun_nakshatra_bands():
    assert _nethiram_value(5, 24) == 1
    assert _jeevan_value(5, 24) == 0.5
    assert _jeevan_value(1, 10) == 0


def test_amirdhadhi_yogam_uses_weekday_nakshatra_table():
    assert _amirdhadhi_yogam_name(0, 24) == "சித்தயோகம்"
    assert _amirdhadhi_yogam_name(0, 25) == "மரணயோகம்"
    assert _amirdhadhi_yogam_name(3, 11) == "சித்தயோகம்"
    assert _amirdhadhi_yogam_name(3, 12) == "மரணயோகம்"


def test_rahu_kalam_uses_daylight_division_chennai_2026_01_15():
    snapshot = calculate_daily_panchangam(date(2026, 1, 15), 13.0827, 80.2707, "Asia/Kolkata")
    daylight_slot = (snapshot.sunset - snapshot.sunrise) / 8
    expected_start = snapshot.sunrise + daylight_slot * (snapshot.rahu_kalam.slot - 1)
    expected_end = expected_start + daylight_slot

    assert snapshot.weekday == "THURSDAY"
    assert snapshot.rahu_kalam.slot == 6
    assert abs((snapshot.rahu_kalam.start - expected_start).total_seconds()) < 1
    assert abs((snapshot.rahu_kalam.end - expected_end).total_seconds()) < 1


# ---------------------------------------------------------------------------
# P2-03 — Tithi 15 / 30 boundary regression (Pournami + Amavasai)
# ---------------------------------------------------------------------------

def test_tithi_boundary_pournami_amavasai_q1_2026():
    """Pournami (15) and Amavasai (30) dominant civil days are found and internally consistent
    across Q1 2026.  The panchangam snapshot's special_tithi_day_number must agree with
    dominant_special_tithi_for_civil_day() for every identified civil day. (P2-03)"""
    tz = "Asia/Kolkata"
    pournami_days: list[date] = []
    amavasai_days: list[date] = []

    for offset in range(90):  # Jan 1 – Mar 31, 2026
        d = date(2026, 1, 1) + timedelta(days=offset)
        dominant = dominant_special_tithi_for_civil_day(d, tz)
        if dominant == 15:
            pournami_days.append(d)
        elif dominant == 30:
            amavasai_days.append(d)

    assert len(pournami_days) >= 3, f"Expected ≥3 Pournami civil days in Q1 2026, got {pournami_days}"
    assert len(amavasai_days) >= 3, f"Expected ≥3 Amavasai civil days in Q1 2026, got {amavasai_days}"

    for d in pournami_days[:3]:
        snap = calculate_daily_panchangam(d, 13.0827, 80.2707, tz)
        assert snap.special_tithi_day_number == 15, (
            f"Pournami day {d}: snapshot.special_tithi_day_number={snap.special_tithi_day_number}"
        )

    for d in amavasai_days[:3]:
        snap = calculate_daily_panchangam(d, 13.0827, 80.2707, tz)
        assert snap.special_tithi_day_number == 30, (
            f"Amavasai day {d}: snapshot.special_tithi_day_number={snap.special_tithi_day_number}"
        )


# ---------------------------------------------------------------------------
# P2-07 — Makara sankranti precision (Thai Pongal 2026)
# ---------------------------------------------------------------------------

def test_makara_sankranti_precision_2026():
    """Thai Pongal 2026 — Makara (Capricorn) sankranti must fall on Jan 14 UTC within ±10 min (P2-07)."""
    from app.calculations.tamil_calendar import _find_sankranti_jd
    from app.calculations.ephemeris import sun_longitude_at_jd
    from app.calculations.astro import normalize_longitude

    # Jan 15, 2026 12:00 UTC — Sun is already in Makara (rasi index 9 = 270°-300°)
    jd_after = 2461056.0

    sankranti_jd = _find_sankranti_jd(9, jd_after)

    # Must fall on Jan 14, 2026 UTC (JD 2461054.5–2461055.5)
    assert 2461054.5 <= sankranti_jd < 2461055.5, (
        f"Makara sankranti 2026 not on Jan 14 UTC: JD={sankranti_jd:.6f}"
    )

    # Sun sidereal longitude at the crossing instant must be at 270° ± 0.01°
    sun_lon = normalize_longitude(sun_longitude_at_jd(sankranti_jd))
    assert abs(sun_lon - 270.0) < 0.01, (
        f"Sun longitude at Makara entry is {sun_lon:.4f}°, expected 270.00°"
    )
