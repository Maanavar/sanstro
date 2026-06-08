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
    dominant_nakshatra_for_civil_day,
    dominant_special_tithi_for_civil_day,
    dominant_tithi_for_civil_day,
    gowri_category_rank,
)
from app.schemas.panchangam import PanchangamMonthlyQuery
from app.services.panchangam_service import build_monthly_panchangam

pytestmark = pytest.mark.no_db

GOWRI_GOOD_NAMES = {"AMIRDHA", "UTHI", "LAABAM", "DHANAM", "SUGAM"}
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
        (date(2026, 6, 7), "SUNDAY", ("UTHI", "AMIRDHA", "ROGAM", "LAABAM")),
        (date(2026, 6, 1), "MONDAY", ("AMIRDHA", "VISHAM", "ROGAM", "LAABAM")),
        (date(2026, 6, 2), "TUESDAY", ("ROGAM", "LAABAM", "DHANAM", "SUGAM")),
        (date(2026, 6, 3), "WEDNESDAY", ("LAABAM", "DHANAM", "SUGAM", "SORAM")),
        (date(2026, 6, 4), "THURSDAY", ("DHANAM", "SUGAM", "SORAM", "UTHI")),
        (date(2026, 6, 5), "FRIDAY", ("SUGAM", "SORAM", "UTHI", "VISHAM")),
        (date(2026, 6, 6), "SATURDAY", ("SORAM", "UTHI", "VISHAM", "AMIRDHA")),
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

    # The full Gowri Panchangam contains an earlier UTHI slot and a later
    # AMIRDHA slot — best_gowri_slot must pick by category rank, not time.
    day_good_slots = [s for s in snap.gowri_panchangam if s.period == "DAY" and s.is_good]
    assert day_good_slots[0].name == "UTHI"
    assert best_gowri_slot(day_good_slots).name == "AMIRDHA"
    assert gowri_category_rank("AMIRDHA") < gowri_category_rank("UTHI")
    assert gowri_category_rank("SUGAM") < gowri_category_rank("ROGAM")


def test_nalla_and_gowri_nalla_neram_use_compact_tamil_calendar_windows():
    snap = calculate_daily_panchangam(date(2026, 6, 8), 13.0827, 80.2707, "Asia/Kolkata")

    assert snap.weekday == "MONDAY"
    assert [(s.period, s.start.strftime("%H:%M"), s.end.strftime("%H:%M")) for s in snap.nalla_neram] == [
        ("AM", "06:30", "07:30"),
        ("PM", "16:30", "17:30"),
    ]
    assert [(s.period, s.start.strftime("%H:%M"), s.end.strftime("%H:%M")) for s in snap.gowri_nalla_neram] == [
        ("DAY", "09:15", "10:15"),
        ("NIGHT", "19:30", "20:30"),
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


def test_monthly_builder_uses_dominant_civil_day_labels():
    response = build_monthly_panchangam(
        PanchangamMonthlyQuery(year=2026, month=6, lat=13.0827, lng=80.2707, timezone="Asia/Kolkata")
    )

    assert response.data.entries
    for entry in response.data.entries:
        day = date.fromisoformat(str(entry.date_local))
        dominant_tithi = dominant_tithi_for_civil_day(day, "Asia/Kolkata")
        dominant_nakshatra = dominant_nakshatra_for_civil_day(day, "Asia/Kolkata")

        assert dominant_tithi is not None
        assert dominant_nakshatra is not None
        assert entry.tithi_number == dominant_tithi
        assert entry.nakshatra_name == NAKSHATRA_NAMES[dominant_nakshatra - 1]


def test_monthly_builder_exposes_sunrise_based_tamil_muhurtham_days():
    response = build_monthly_panchangam(
        PanchangamMonthlyQuery(year=2026, month=6, lat=13.0827, lng=80.2707, timezone="Asia/Kolkata")
    )

    june_7 = next(entry for entry in response.data.entries if str(entry.date_local) == "2026-06-07")
    june_18 = next(entry for entry in response.data.entries if str(entry.date_local) == "2026-06-18")

    assert june_7.is_tamil_muhurtham_day is True
    assert june_7.is_subha_muhurtham is False
    assert june_7.is_subha_muhurtham_strict is False
    assert june_18.is_tamil_muhurtham_day is True
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
