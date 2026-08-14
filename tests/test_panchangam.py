from concurrent.futures import ThreadPoolExecutor
from datetime import date, datetime, timedelta, timezone

import pytest

from app.calculations.ephemeris import RiseTransitUndefinedError
from app.calculations.festivals import get_festivals_for_date
from app.calculations.panchangam import (
    AMIRDHADHI_YOGAM_LABELS,
    AMIRDHADHI_YOGAM_TABLE,
    GOWRI_DAY_TABLE,
    GOWRI_NIGHT_TABLE,
    GOWRI_ROTATING_KALAS,
    NAKSHATRA_NAMES,
    NIGHT_VISHAM_SLOT,
    RAHU_SLOT,
    SOOLAM_DIRECTION,
    SOOLAM_PARIGARAM_BY_DIRECTION,
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
    monday_strict, _ = _compute_subha_muhurtham_strict(5, "SHUKLA", "ROHINI", "SIDDHA", 0)
    tuesday_broad, tuesday_reason = _compute_subha_muhurtham_broad(5, "ROHINI", 1)
    saturday_broad, saturday_reason = _compute_subha_muhurtham_broad(5, "ROHINI", 5)
    tuesday_strict, tuesday_strict_reason = _compute_subha_muhurtham_strict(
        5, "SHUKLA", "ROHINI", "SIDDHA", 1
    )
    saturday_strict, saturday_strict_reason = _compute_subha_muhurtham_strict(
        5, "SHUKLA", "ROHINI", "SIDDHA", 5
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

    # WI-07 (2026-07-16): sunrise/sunset switched to Hindu sunrise (disc
    # center, no refraction, geocentric — SE_BIT_HINDU_RISING). Both times
    # move ~4-6 min toward solar noon versus the old refracted-upper-limb
    # values (sunrise later, sunset earlier) — see panchangam.py v33 note.
    expected_sunrise = datetime(2026, 5, 21, 5, 59, tzinfo=timezone(timedelta(hours=5, minutes=30)))
    expected_sunset = datetime(2026, 5, 21, 18, 29, tzinfo=timezone(timedelta(hours=5, minutes=30)))

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
    assert all(s.name in GOWRI_GOOD_NAMES and s.is_good is True for s in snapshot.gowri_nalla_neram)
    assert len(snapshot.nalla_neram) == 2
    assert {s.period for s in snapshot.nalla_neram} == {"AM", "PM"}
    assert all(s.name in GOWRI_GOOD_NAMES and s.is_good is True for s in snapshot.nalla_neram)
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
    # First four daytime kalas per weekday. VISHAM sits on the Rahu Kalam slot, so
    # it only appears this early on Mon (slot 2), Sat (slot 3) and Fri (slot 4).
    cases = [
        (date(2026, 6, 7), "SUNDAY",    ("UTHI",     "AMIRTHAM", "ROGAM",  "LABHAM")),
        (date(2026, 6, 1), "MONDAY",    ("AMIRTHAM", "VISHAM",   "ROGAM",  "LABHAM")),
        (date(2026, 6, 2), "TUESDAY",   ("ROGAM",    "LABHAM",   "DHANAM", "SUGAM")),
        (date(2026, 6, 3), "WEDNESDAY", ("LABHAM",   "DHANAM",   "SUGAM",  "SORAM")),
        (date(2026, 6, 4), "THURSDAY",  ("DHANAM",   "SUGAM",    "SORAM",  "UTHI")),
        (date(2026, 6, 5), "FRIDAY",    ("SUGAM",    "SORAM",    "UTHI",   "VISHAM")),
        (date(2026, 6, 6), "SATURDAY",  ("SORAM",    "UTHI",     "VISHAM", "AMIRTHAM")),
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


# Published Gowri daytime sequences from drikpanchang.com (Drik Ganita =
# Thirukanitham), 17-24 July 2026, covering every weekday. Anchored to an external
# reference rather than to our own table: the pre-v36 bug survived two corrections
# because the only invariant ever checked was "each row is a rotation of the master
# cycle", which the wrong table also satisfied.
GOWRI_DAY_REFERENCE = {
    6: ("UTHI", "AMIRTHAM", "ROGAM", "LABHAM", "DHANAM", "SUGAM", "SORAM", "VISHAM"),
    0: ("AMIRTHAM", "VISHAM", "ROGAM", "LABHAM", "DHANAM", "SUGAM", "SORAM", "UTHI"),
    1: ("ROGAM", "LABHAM", "DHANAM", "SUGAM", "SORAM", "UTHI", "VISHAM", "AMIRTHAM"),
    2: ("LABHAM", "DHANAM", "SUGAM", "SORAM", "VISHAM", "UTHI", "AMIRTHAM", "ROGAM"),
    3: ("DHANAM", "SUGAM", "SORAM", "UTHI", "AMIRTHAM", "VISHAM", "ROGAM", "LABHAM"),
    4: ("SUGAM", "SORAM", "UTHI", "VISHAM", "AMIRTHAM", "ROGAM", "LABHAM", "DHANAM"),
    5: ("SORAM", "UTHI", "VISHAM", "AMIRTHAM", "ROGAM", "LABHAM", "DHANAM", "SUGAM"),
}


@pytest.mark.parametrize("weekday", sorted(GOWRI_DAY_REFERENCE))
def test_gowri_day_table_matches_published_reference(weekday):
    assert GOWRI_DAY_TABLE[weekday] == GOWRI_DAY_REFERENCE[weekday]


@pytest.mark.parametrize("weekday", sorted(GOWRI_DAY_REFERENCE))
def test_visham_occupies_the_rahu_kalam_slot(weekday):
    """Visham IS Rahu: the daytime Rahu Kalam slot must never be an auspicious kala.

    This is the invariant the pre-v36 table violated on Tue/Thu/Fri/Sat, where a
    good kala (Thursday: AMIRTHAM, "best overall") was printed across Rahu Kalam.
    """
    assert GOWRI_DAY_TABLE[weekday][RAHU_SLOT[weekday] - 1] == "VISHAM"


def test_gowri_day_rows_contain_each_kala_exactly_once():
    for weekday, row in GOWRI_DAY_TABLE.items():
        assert sorted(row) == sorted(GOWRI_GOOD_NAMES | {"ROGAM", "SORAM", "VISHAM"}), weekday


# Gowri NIGHT sequences, supplied by the project astrologer (2026-07-17) and
# independently corroborated against drikpanchang (Drik Ganita = Thirukanitham)
# and Prokerala. Pinned verbatim for the same reason as GOWRI_DAY_REFERENCE: the
# pre-v37 night table was a valid rotation of the master cycle on every row, so
# no structural invariant could catch that VISHAM was on the wrong slot.
GOWRI_NIGHT_REFERENCE = {
    6: ("DHANAM", "SUGAM", "SORAM", "VISHAM", "UTHI", "AMIRTHAM", "ROGAM", "LABHAM"),
    0: ("SUGAM", "SORAM", "UTHI", "AMIRTHAM", "VISHAM", "ROGAM", "LABHAM", "DHANAM"),
    1: ("SORAM", "UTHI", "VISHAM", "AMIRTHAM", "ROGAM", "LABHAM", "DHANAM", "SUGAM"),
    2: ("UTHI", "AMIRTHAM", "ROGAM", "LABHAM", "DHANAM", "SUGAM", "SORAM", "VISHAM"),
    3: ("AMIRTHAM", "VISHAM", "ROGAM", "LABHAM", "DHANAM", "SUGAM", "SORAM", "UTHI"),
    4: ("ROGAM", "LABHAM", "DHANAM", "SUGAM", "SORAM", "UTHI", "VISHAM", "AMIRTHAM"),
    5: ("LABHAM", "DHANAM", "SUGAM", "SORAM", "UTHI", "VISHAM", "AMIRTHAM", "ROGAM"),
}


@pytest.mark.parametrize("weekday", sorted(GOWRI_NIGHT_REFERENCE))
def test_gowri_night_table_matches_astrologer_reference(weekday):
    assert GOWRI_NIGHT_TABLE[weekday] == GOWRI_NIGHT_REFERENCE[weekday]


@pytest.mark.parametrize("weekday", sorted(GOWRI_NIGHT_REFERENCE))
def test_night_visham_is_not_on_the_day_rahu_slot(weekday):
    """Night VISHAM does not track Rahu the way daytime VISHAM does.

    Guards the specific wrong turn that produced the pre-v37 table: "fix" the
    night rows by analogy with the day rule and this fails on all seven weekdays.
    """
    assert GOWRI_NIGHT_TABLE[weekday][NIGHT_VISHAM_SLOT[weekday] - 1] == "VISHAM"
    assert NIGHT_VISHAM_SLOT[weekday] != RAHU_SLOT[weekday]


@pytest.mark.parametrize("weekday", sorted(GOWRI_NIGHT_REFERENCE))
def test_night_visham_slot_is_three_steps_along_the_rahu_weekday_order(weekday):
    """Cross-check, not the source of truth (NIGHT_VISHAM_SLOT is).

    The Rahu Kalam mnemonic assigns day slots 2..8 in the order Mon, Sat, Fri,
    Wed, Thu, Tue, Sun; stepping +3 along it lands on the night VISHAM slot for
    every weekday. Documented in panchangam.py — asserted here so that if someone
    later edits NIGHT_VISHAM_SLOT, they are told the structure broke rather than
    silently losing it.
    """
    assert NIGHT_VISHAM_SLOT[weekday] == ((RAHU_SLOT[weekday] - 2 + 3) % 7) + 2


def test_gowri_night_rows_contain_each_kala_exactly_once():
    for weekday, row in GOWRI_NIGHT_TABLE.items():
        assert sorted(row) == sorted(GOWRI_GOOD_NAMES | {"ROGAM", "SORAM", "VISHAM"}), weekday


def test_gowri_night_rotation_starts_four_kalas_after_the_day_rotation():
    """The night rotation is offset from the day's; only VISHAM's slot is special."""
    for weekday in range(7):
        day_start = GOWRI_DAY_TABLE[weekday][0]
        night_start = GOWRI_NIGHT_TABLE[weekday][0]
        # VISHAM never starts a row it does not rotate into, so both firsts are rotating kalas.
        day_index = GOWRI_ROTATING_KALAS.index(day_start)
        assert night_start == GOWRI_ROTATING_KALAS[(day_index + 4) % 7], weekday


def test_saturday_night_gowri_table_ends_with_rogam():
    snap = calculate_daily_panchangam(date(2026, 6, 6), 9.9252, 78.1198, "Asia/Kolkata")

    assert snap.weekday == "SATURDAY"
    assert snap.gowri_panchangam[-1].period == "NIGHT"
    assert snap.gowri_panchangam[-1].name == "ROGAM"


def test_best_gowri_slot_uses_category_ranking_before_time():
    snap = calculate_daily_panchangam(date(2026, 6, 6), 13.0827, 80.2707, "Asia/Kolkata")

    # Saturday day kalas: SORAM, UTHI, VISHAM, AMIRTHAM, ROGAM, LABHAM, DHANAM, SUGAM
    # (VISHAM at slot 3 = Saturday's Rahu Kalam slot).
    # Good slots appear in time order: UTHI (slot 2), AMIRTHAM (slot 4), LABHAM (slot 6),
    # DHANAM (slot 7), SUGAM (slot 8).
    # best_gowri_slot must pick AMIRTHAM (rank 1) even though UTHI appears first in time.
    day_good_slots = [s for s in snap.gowri_panchangam if s.period == "DAY" and s.is_good]
    assert day_good_slots[0].name == "UTHI"
    assert best_gowri_slot(day_good_slots).name == "AMIRTHAM"
    assert gowri_category_rank("AMIRTHAM") < gowri_category_rank("UTHI")
    assert gowri_category_rank("LABHAM") < gowri_category_rank("ROGAM")


def _collides(slot, bad) -> bool:
    """Minute-truncated overlap, matching panchangam._windows_overlap."""
    def m(dt):
        return dt.replace(second=0, microsecond=0)
    return any(m(slot.start) < m(b.end) and m(b.start) < m(slot.end) for b in bad)


def test_nalla_and_gowri_nalla_neram_are_real_gowri_kalas_clear_of_bad_kalams():
    # Reliable panchangams derive the daily Nalla Neram from the Gowri good kalas
    # on the real sunrise grid and always keep it clear of Rahu Kalam /
    # Yamagandam / Kuligai. Both summaries must therefore (a) be actual good Gowri
    # kalas of the day and (b) never overlap an inauspicious kalam.
    snap = calculate_daily_panchangam(date(2026, 6, 8), 13.0827, 80.2707, "Asia/Kolkata")
    assert snap.weekday == "MONDAY"

    bad = [snap.rahu_kalam, snap.yamagandam, snap.kuligai]
    good_gowri = {(g.start, g.end) for g in snap.gowri_panchangam if g.is_good}

    assert {s.period for s in snap.nalla_neram} <= {"AM", "PM"}
    assert {s.period for s in snap.gowri_nalla_neram} <= {"DAY", "NIGHT"}
    for s in snap.nalla_neram + snap.gowri_nalla_neram:
        assert s.is_good is True and s.name in GOWRI_GOOD_NAMES
        assert (s.start, s.end) in good_gowri, "summary window is not a real Gowri good kala"
        assert not _collides(s, bad), f"{s.period} {s.start:%H:%M}-{s.end:%H:%M} collides with a bad kalam"

    # AM/PM Nalla Neram split the daytime at solar noon.
    for s in snap.nalla_neram:
        if s.period == "AM":
            assert s.start < snap.solar_noon
        if s.period == "PM":
            assert s.start >= snap.solar_noon


def test_gowri_nalla_neram_never_announces_a_kala_that_is_a_bad_kalam():
    # Thursday's first good Gowri day kala (Dhanam, slot 1) IS Yamagandam. Early
    # code took the first good kala blindly and announced the bad kalam as nalla
    # neram; the DAY window must never land on one, whichever kala it picks.
    thu = calculate_daily_panchangam(date(2026, 6, 4), 13.0827, 80.2707, "Asia/Kolkata")
    assert thu.weekday == "THURSDAY"
    thu_day = next(s for s in thu.gowri_nalla_neram if s.period == "DAY")
    assert not _collides(thu_day, [thu.yamagandam])
    assert thu_day.start >= thu.yamagandam.end  # past the Yamagandam slot

    # Saturday used to be cited here as "first good kala IS Rahu Kalam", which was
    # an artefact of the pre-v36 table putting UTHI on Saturday's Rahu slot. Rahu
    # Kalam is VISHAM by construction, so no good Saturday kala can collide with it.
    sat = calculate_daily_panchangam(date(2026, 6, 6), 13.0827, 80.2707, "Asia/Kolkata")
    assert sat.weekday == "SATURDAY"
    sat_day = next(s for s in sat.gowri_nalla_neram if s.period == "DAY")
    assert not _collides(sat_day, [sat.rahu_kalam])


def test_gowri_nalla_neram_is_the_best_kala_and_never_repeats_a_nalla_neram_window():
    """The Gowri summary must earn its own card.

    Taking the FIRST clear good kala made the DAY window identical to the AM Nalla
    Neram window on every weekday — that window is *defined* as the first clear
    good day kala — so the two cards printed one window twice. The DAY pick is now
    the best-ranked clear good kala that Nalla Neram does not already print.
    """
    for day_offset in range(14):
        snap = calculate_daily_panchangam(
            date(2026, 6, 1) + timedelta(days=day_offset), 13.0827, 80.2707, "Asia/Kolkata"
        )
        printed = {(s.start, s.end) for s in snap.nalla_neram}
        day = next(s for s in snap.gowri_nalla_neram if s.period == "DAY")
        assert (day.start, day.end) not in printed, f"{snap.weekday}: Gowri DAY repeats a Nalla Neram window"

        # Ranked, not chronological: no clear good kala outranks the one shown,
        # apart from the ones Nalla Neram has already taken.
        bad = [snap.rahu_kalam, snap.yamagandam, snap.kuligai]
        available = [
            s for s in snap.gowri_panchangam
            if s.period == "DAY" and s.is_good and not _collides(s, bad) and (s.start, s.end) not in printed
        ]
        assert gowri_category_rank(day.name) == min(gowri_category_rank(s.name) for s in available), snap.weekday


def test_gowri_nalla_neram_night_window_is_the_earliest_good_kala_not_the_best():
    """The NIGHT half is chronological, and the DAY half is not — on purpose.

    v38 ranked both halves for symmetry. But Amirtham advances one slot per
    weekday, so "always Amirtham" walked the night window around the clock: on
    the Aug 2026 Chennai grid it landed at 04:33 (Fri), 03:06 (Sat), 01:40 (Sun)
    and after 22:47 (Mon/Tue). A night window is read as "this evening", so the
    pick is now the earliest clear good night kala.
    """
    for day_offset in range(14):
        day = date(2026, 8, 10) + timedelta(days=day_offset)
        snap = calculate_daily_panchangam(day, 13.0827, 80.2707, "Asia/Kolkata")
        night = next(s for s in snap.gowri_nalla_neram if s.period == "NIGHT")

        bad = [snap.rahu_kalam, snap.yamagandam, snap.kuligai]
        available = [
            s for s in snap.gowri_panchangam
            if s.period == "NIGHT" and s.is_good and not _collides(s, bad)
        ]
        assert night.start == min(s.start for s in available), (
            f"{day} {snap.weekday}: night pick is not the earliest clear good kala"
        )

        # The property that motivated the rule: a "tonight" window must open
        # before the date rolls over, not in the small hours of the next morning.
        midnight = datetime.combine(day + timedelta(days=1), datetime.min.time(), tzinfo=night.start.tzinfo)
        assert night.start < midnight, (
            f"{day} {snap.weekday}: night window opens at {night.start:%m-%d %H:%M}, past midnight"
        )


def test_no_good_day_kala_ever_collides_with_rahu_kalam():
    """Rahu Kalam is VISHAM on every weekday, so it can never be announced as good.

    Pre-v36 this held only on Sun/Wed; Tue/Thu/Fri/Sat printed a good kala across
    Rahu Kalam and _compute_gowri_nalla_neram's Rahu filter silently hid it.
    """
    for day_offset in range(7):
        snap = calculate_daily_panchangam(
            date(2026, 6, 1) + timedelta(days=day_offset), 13.0827, 80.2707, "Asia/Kolkata"
        )
        rahu_kalas = [
            s for s in snap.gowri_panchangam
            if s.period == "DAY" and _collides(s, [snap.rahu_kalam])
        ]
        assert rahu_kalas, snap.weekday
        for kala in rahu_kalas:
            assert kala.name == "VISHAM", f"{snap.weekday}: {kala.name} printed across Rahu Kalam"
            assert not kala.is_good


def test_polar_day_night_raises_typed_error_not_overflow():
    # Tromso (69.6N): during polar day (June) and polar night (December) the Sun
    # is circumpolar, so sunrise-anchored panchangam is undefined. This must raise
    # a clean, typed RiseTransitUndefinedError (mapped to HTTP 422) rather than an
    # unhandled OverflowError from the Julian-Day -> datetime conversion.
    for polar_date in (date(2026, 6, 21), date(2026, 12, 21)):
        with pytest.raises(RiseTransitUndefinedError):
            calculate_daily_panchangam(polar_date, 69.6492, 18.9553, "Europe/Oslo")

    # A high-but-non-polar latitude with a real (very long) day still computes.
    reykjavik = calculate_daily_panchangam(date(2026, 6, 21), 64.1466, -21.9426, "Atlantic/Reykjavik")
    assert reykjavik.sunrise < reykjavik.solar_noon < reykjavik.sunset


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


def test_amirdhadhi_yogam_grid_is_structurally_sound():
    # Re-sourced 2026-07-14 from the Ungal Vazhkkai Vazhikatti panchangam.
    # Every weekday row must cover all 27 nakshatras exactly once, using only
    # the four known classes.
    assert set(AMIRDHADHI_YOGAM_TABLE) == {0, 1, 2, 3, 4, 5, 6}
    for weekday, row in AMIRDHADHI_YOGAM_TABLE.items():
        assert len(row) == 27, f"weekday {weekday} row has {len(row)} cells"
        assert set(row) <= set(AMIRDHADHI_YOGAM_LABELS), f"weekday {weekday} has unknown class"
        # Exactly one Prabalarishta (P) cell per weekday in this source.
        assert row.count("P") == 1, f"weekday {weekday} P-count={row.count('P')}"


def test_amirdhadhi_yogam_prabalarishta_cells():
    # The seven 4th-class (Prabalarishta) cells, one per weekday.
    # (weekday_index, nakshatra_number 1..27) per the reference source.
    prabalarishta = {
        (6, 2): "Sun+Bharani",
        (0, 14): "Mon+Chithirai",
        (1, 21): "Tue+Uthiradam",
        (2, 23): "Wed+Avittam",
        (3, 18): "Thu+Kettai",
        (4, 20): "Fri+Pooradam",
        (5, 27): "Sat+Revathi",
    }
    for (weekday, nak), label in prabalarishta.items():
        assert _amirdhadhi_yogam_name(weekday, nak) == "பிரபலாரிஷ்ட யோகம்", label


def test_amirdhadhi_yogam_amrita_siddhi_pairs_read_siddha_not_amirtha():
    # Regression lock: the Amrita-Siddhi *Yoga* muhurta pairs are NOT the
    # Amirtha (A) cells of this daily-classification table — they land on Siddha
    # (C). This reverses the 2026-07 audit's v29 premise. (weekday, nakshatra):
    # Sun+Hasta(13), Tue+Ashwini(1), Wed+Anuradha(17), Thu+Pushya(8),
    # Fri+Revathi(27) all read Siddha; Mon+Shravana(22), Sat+Rohini(4) read Amirtha.
    assert _amirdhadhi_yogam_name(6, 13) == "சித்தயோகம்"  # Sun+Hasta
    assert _amirdhadhi_yogam_name(1, 1) == "சித்தயோகம்"   # Tue+Ashwini (was wrongly "A" in v29)
    assert _amirdhadhi_yogam_name(2, 17) == "சித்தயோகம்"  # Wed+Anuradha (was wrongly "A" in v29)
    assert _amirdhadhi_yogam_name(3, 8) == "சித்தயோகம்"   # Thu+Pushya
    assert _amirdhadhi_yogam_name(4, 27) == "சித்தயோகம்"  # Fri+Revathi
    assert _amirdhadhi_yogam_name(0, 22) == "அமிர்தயோகம்"  # Mon+Shravana
    assert _amirdhadhi_yogam_name(5, 4) == "அமிர்தயோகம்"   # Sat+Rohini


def test_amirdhadhi_thursday_friday_rows_web_confirmed():
    # Cross-check DONE 2026-07-15 (full-ownership web research). The Thursday and
    # Friday rows were verified cell-for-cell against the source publisher's own
    # public article (ungalvazhkkai.seithisaral.in), and the Thursday Marana set
    # additionally matches Ernst Wilhelm's "fatal Dagdha Yoga on Jupiter's Vara"
    # exactly. This locks the two flagged Prabalarishta cells IN CONTEXT with the
    # surrounding Marana cells they were suspected of conflicting with.
    #
    # Thursday (weekday 3): Marana on Krittika(3), Rohini(4), Mrigasira(5),
    # Ardra(6), U.Phalguni(12), Shatabhisha(24); Prabalarishta on Kettai(18).
    for nak in (3, 4, 5, 6, 12, 24):
        assert _amirdhadhi_yogam_name(3, nak) == "மரணயோகம்", f"Thu+{nak}"
    assert _amirdhadhi_yogam_name(3, 18) == "பிரபலாரிஷ்ட யோகம்"  # Thu+Kettai
    #
    # Friday (weekday 4): Marana on Rohini(4), Pushya(8), Ashlesha(9), Magha(10),
    # Kettai(18), Shravana(22); Prabalarishta on Pooradam(20).
    for nak in (4, 8, 9, 10, 18, 22):
        assert _amirdhadhi_yogam_name(4, nak) == "மரணயோகம்", f"Fri+{nak}"
    assert _amirdhadhi_yogam_name(4, 20) == "பிரபலாரிஷ்ட யோகம்"  # Fri+Pooradam


def test_soolam_parigaram_direction_food_mapping():
    # A-8, 2026-07-14: astrologer-corrected direction->food table. East/West were
    # swapped vs the prior DRAFT (East->Curd not Jaggery, West->Jaggery not Curd);
    # North/South refined to the specific traditional words.
    assert SOOLAM_PARIGARAM_BY_DIRECTION["கிழக்கு"] == "தயிர்"       # East -> Curd
    assert SOOLAM_PARIGARAM_BY_DIRECTION["மேற்கு"] == "வெல்லம்"      # West -> Jaggery
    assert SOOLAM_PARIGARAM_BY_DIRECTION["வடக்கு"] == "பசும்பால்"    # North -> fresh milk
    assert SOOLAM_PARIGARAM_BY_DIRECTION["தெற்கு"] == "நல்லெண்ணெய்"  # South -> sesame oil
    # Every direction in the weekday table has a parigaram entry.
    for direction in SOOLAM_DIRECTION.values():
        assert direction in SOOLAM_PARIGARAM_BY_DIRECTION


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
