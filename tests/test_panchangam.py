from concurrent.futures import ThreadPoolExecutor
from datetime import date, datetime, timedelta, timezone

from app.calculations.panchangam import calculate_daily_panchangam


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
    # Nalla Neram is now weekday-slot based (Thirukanitham tradition); Thursday = slot 1 = sunrise slot
    assert snapshot.nalla_neram[0].slot == 1
    assert snapshot.nalla_neram[0].start == snapshot.sunrise
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


def test_gowri_nalla_neram_slots_match_thirukanitham_tradition():
    # Dates chosen to cover all 7 weekdays. Location: Madurai (9.9252, 78.1198).
    # Expected Gowri slots per tradition: Sun=(5,6,8), Mon=(1,4,8), Tue=(1,4,7),
    # Wed=(2,6), Thu=(3,5,8), Fri=(2,5,8), Sat=(3,6,7).
    cases = [
        (date(2026, 6, 7),  "SUNDAY",    (5, 6, 8)),
        (date(2026, 6, 1),  "MONDAY",    (1, 4, 8)),
        (date(2026, 6, 2),  "TUESDAY",   (1, 4, 7)),
        (date(2026, 6, 3),  "WEDNESDAY", (2, 6)),
        (date(2026, 6, 4),  "THURSDAY",  (3, 5, 8)),
        (date(2026, 6, 5),  "FRIDAY",    (2, 5, 8)),
        (date(2026, 6, 6),  "SATURDAY",  (3, 6, 7)),
    ]
    for d, expected_weekday, expected_slots in cases:
        snap = calculate_daily_panchangam(d, 9.9252, 78.1198, "Asia/Kolkata")
        assert snap.weekday == expected_weekday, f"{d}: weekday mismatch"
        actual = tuple(s.slot for s in snap.gowri_nalla_neram)
        assert actual == expected_slots, f"{d} ({expected_weekday}): got {actual}, want {expected_slots}"


def test_rahu_kalam_uses_daylight_division_chennai_2026_01_15():
    snapshot = calculate_daily_panchangam(date(2026, 1, 15), 13.0827, 80.2707, "Asia/Kolkata")
    daylight_slot = (snapshot.sunset - snapshot.sunrise) / 8
    expected_start = snapshot.sunrise + daylight_slot * (snapshot.rahu_kalam.slot - 1)
    expected_end = expected_start + daylight_slot

    assert snapshot.weekday == "THURSDAY"
    assert snapshot.rahu_kalam.slot == 6
    assert abs((snapshot.rahu_kalam.start - expected_start).total_seconds()) < 1
    assert abs((snapshot.rahu_kalam.end - expected_end).total_seconds()) < 1
