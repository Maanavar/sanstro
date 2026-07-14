from __future__ import annotations

from datetime import datetime

import pytest

from app.calculations.astro import local_datetime_to_utc, utc_datetime_to_julian_day
from app.calculations.dasha import JULIAN_YEAR_DAYS
from app.calculations.ashtottari_dasha import (
    ASHTOTTARI_SEQUENCE,
    ASHTOTTARI_YEARS,
    NAK_LORD,
    TOTAL_CYCLE_YEARS,
    calculate_ashtottari_timeline,
    calculate_opening_ashtottari,
    evaluate_ashtottari_applicability,
    _sequence_from,
)

pytestmark = pytest.mark.no_db

# Same T003 reference chart used by test_golden_validation.py,
# test_jaimini_karakas.py, and test_yogini_dasha.py (1993-03-15 08:15 IST,
# longitudes cross-verified to within 0.1 deg against a second ephemeris
# source).
_T003_MOON_LONGITUDE = 240.01137891


def _t003_birth_jd() -> float:
    dt_utc = local_datetime_to_utc(datetime(1993, 3, 15, 8, 15), "Asia/Kolkata")
    return utc_datetime_to_julian_day(dt_utc)


def test_ashtottari_years_sum_to_108() -> None:
    assert sum(ASHTOTTARI_YEARS.values()) == TOTAL_CYCLE_YEARS == 108.0


def test_sequence_fixed_order_matches_every_source_checked() -> None:
    assert ASHTOTTARI_SEQUENCE == [
        "SUN", "MOON", "MARS", "MERCURY", "SATURN", "JUPITER", "RAHU", "VENUS",
    ]


def test_nak_lord_ardra_adi_grouping() -> None:
    # Authoritative Ardra-adi grouping (live session 2026-07-14, EC-6). The
    # anchors Ashwini/Bharani/Revati -> Rahu are stable across every Ardra-adi
    # source. Interior boundaries: CROSS-CHECK DONE 2026-07-15 (full-ownership web
    # research) found a genuine two-tradition fork — this is the B.V. Raman /
    # Jataka Parijata 27-nakshatra partition (kept, Tamil-appropriate), NOT the
    # BPHS-Santhanam 28-nakshatra (Abhijit) partition. See module docstring.
    assert NAK_LORD[1] == "RAHU"    # Ashwini  [stable anchor]
    assert NAK_LORD[2] == "RAHU"    # Bharani  [stable anchor]
    assert NAK_LORD[27] == "RAHU"   # Revati   [stable anchor]
    assert NAK_LORD[6] == "SUN"     # Ardra — the reckoning anchor
    assert NAK_LORD[9] == "MOON"    # Ashlesha
    assert NAK_LORD[13] == "MARS"   # Hasta
    assert NAK_LORD[19] == "MERCURY"  # Mula
    assert NAK_LORD[20] == "SATURN"   # Purva Ashadha
    assert NAK_LORD[23] == "JUPITER"  # Dhanishta


def test_nak_lord_keeps_raman_v1_not_bphs_santhanam_v2() -> None:
    # Explicit fork lock (EC-6 cross-check, 2026-07-15). These three cells are the
    # ones where the kept B.V. Raman partition (v1) disagrees with the primary
    # BPHS-Santhanam partition (v2, Sun4/Moon3/Mars4/... with Abhijit). If someone
    # later flips the table to the BPHS reading, this trips loudly and forces the
    # tradition choice back through review rather than a silent swap.
    assert NAK_LORD[9] == "MOON"      # v1; BPHS-Santhanam v2 -> SUN
    assert NAK_LORD[16] == "MERCURY"  # v1 (Vishakha); v2 -> MARS
    assert NAK_LORD[26] == "JUPITER"  # v1 (U.Bhadra); v2 -> RAHU
    # Non-uniform grouping: runs of 3/3/3/4/3/4/3/4 -> Moon, Mercury, Jupiter
    # get 4 nakshatras each; the rest 3. (Rahu's 3 include the Revati wrap.)
    from collections import Counter
    counts = Counter(NAK_LORD.values())
    assert counts["MOON"] == counts["MERCURY"] == counts["JUPITER"] == 4
    for lord in ("SUN", "MARS", "SATURN", "VENUS", "RAHU"):
        assert counts[lord] == 3
    assert sum(counts.values()) == 27


def test_opening_ashtottari_against_t003_reference_chart() -> None:
    # Moon at 240.01137891 deg -> nakshatra 19 (Moola, 240.0-253.33 deg).
    # Ardra-adi table: NAK_LORD[19] = MERCURY (17 years).
    # fraction_elapsed = 0.01137891 / 13.33333 = 0.00085342
    # balance_years = (1 - 0.00085342) * 17 = 16.98549189
    birth_jd = _t003_birth_jd()
    opening_lord, balance_years, opening_end_jd = calculate_opening_ashtottari(_T003_MOON_LONGITUDE, birth_jd)

    assert opening_lord == "MERCURY"
    assert balance_years == pytest.approx(16.98549189, abs=1e-4)
    assert opening_end_jd == pytest.approx(birth_jd + balance_years * JULIAN_YEAR_DAYS)


def test_opening_ashtottari_at_nakshatra_start_gives_full_balance() -> None:
    # Ashwini (nakshatra 1, 0-13.333 deg) -> NAK_LORD[1] = RAHU (12 years).
    # At the exact start of the nakshatra, fraction_elapsed == 0, so the
    # balance is the full 12-year Rahu period.
    birth_jd = _t003_birth_jd()
    opening_lord, balance_years, _ = calculate_opening_ashtottari(0.0, birth_jd)

    assert opening_lord == "RAHU"
    assert balance_years == pytest.approx(12.0, abs=1e-6)


def test_sequence_from_rotates_without_reordering() -> None:
    rotated = _sequence_from("RAHU")
    assert rotated == ["RAHU", "VENUS", "SUN", "MOON", "MARS", "MERCURY", "SATURN", "JUPITER"]


def test_timeline_current_mahadasha_at_birth_is_opening_lord() -> None:
    birth_jd = _t003_birth_jd()
    timeline = calculate_ashtottari_timeline(birth_jd, _T003_MOON_LONGITUDE, as_of_jd=birth_jd)

    assert timeline.opening_lord == "MERCURY"
    assert timeline.current_mahadasha.lord == "MERCURY"
    assert timeline.current_mahadasha.level == "maha"
    assert timeline.current_antardasha.level == "antar"
    # Opening antardasha at birth must itself be the mahadasha's own lord
    # (the mahadasha lord leads its own antardasha sequence).
    assert timeline.current_antardasha.lord == "MERCURY"


def test_antardashas_span_full_unclipped_mahadasha() -> None:
    birth_jd = _t003_birth_jd()
    timeline = calculate_ashtottari_timeline(birth_jd, _T003_MOON_LONGITUDE, as_of_jd=birth_jd)

    total_days = sum(p.end_jd - p.start_jd for p in timeline.antardashas)
    expected_days = ASHTOTTARI_YEARS["MERCURY"] * JULIAN_YEAR_DAYS
    assert total_days == pytest.approx(expected_days, abs=1e-6)
    assert [p.lord for p in timeline.antardashas] == _sequence_from("MERCURY")


def test_mahadasha_sequence_wraps_in_fixed_order_after_opening() -> None:
    birth_jd = _t003_birth_jd()
    timeline = calculate_ashtottari_timeline(birth_jd, _T003_MOON_LONGITUDE, as_of_jd=birth_jd)

    lords = [p.lord for p in timeline.mahadashas[:8]]
    assert lords == _sequence_from("MERCURY")
    # A cyclic 8-lord sequence repeating forever: cycle 2 reproduces the
    # exact same relative order as cycle 1.
    assert [p.lord for p in timeline.mahadashas[8:16]] == lords


# --- Applicability (informational; EC-6 resolution 2026-07-15) ----------------
# Primary rule: Rahu in a kendra (1/4/7/10) or trikona (5/9) FROM THE LAGNA LORD,
# excepting Rahu placed in the lagna itself. Aries lagna -> lagna lord Mars.


def test_applicability_true_when_rahu_kendra_from_lagna_lord() -> None:
    # Mars (Aries lord) in house 1; Rahu in house 4 -> 4th from the lagna lord
    # (a kendra), and Rahu is not in the lagna. -> applies.
    result = evaluate_ashtottari_applicability(
        lagna_rasi=1,
        planet_house={"MARS": 1, "RAHU": 4},
        paksha=None,
        is_day_birth=None,
    )
    assert result.applicable is True
    assert "house 4" in result.reason


def test_applicability_true_when_rahu_trikona_from_lagna_lord() -> None:
    # Rahu in house 5 -> 5th (trikona) from the lagna lord in house 1.
    result = evaluate_ashtottari_applicability(
        lagna_rasi=1,
        planet_house={"MARS": 1, "RAHU": 5},
        paksha=None,
        is_day_birth=None,
    )
    assert result.applicable is True


def test_applicability_false_when_rahu_not_kendra_trikona() -> None:
    # Rahu in house 3 -> 3rd from the lagna lord: neither kendra nor trikona.
    result = evaluate_ashtottari_applicability(
        lagna_rasi=1,
        planet_house={"MARS": 1, "RAHU": 3},
        paksha=None,
        is_day_birth=None,
    )
    assert result.applicable is False


def test_applicability_false_when_rahu_in_lagna_even_if_conjunct_lord() -> None:
    # BPHS exception: Rahu in the lagna disqualifies the system, even though a
    # naive count (Rahu conjunct the lagna lord in house 1 -> 1st) would pass.
    result = evaluate_ashtottari_applicability(
        lagna_rasi=1,
        planet_house={"MARS": 1, "RAHU": 1},
        paksha=None,
        is_day_birth=None,
    )
    assert result.applicable is False
    assert "lagna" in result.reason.lower()


def test_applicability_exception_and_qualifier_use_different_frames() -> None:
    # The frame-conflation trap: with the lagna lord in the 5th and Rahu in the
    # ascendant, Rahu is 9th FROM THE LAGNA LORD -> a trikona, which the
    # QUALIFYING test (relative frame) would pass. But the EXCEPTION test is in the
    # ABSOLUTE frame (Rahu's house == 1 = Rahu in the lagna), and it must win. If
    # the two tests were ever collapsed into one reference frame, this flips to
    # True and the bug ships. Exception is checked first, so the verdict is False.
    result = evaluate_ashtottari_applicability(
        lagna_rasi=1,  # Aries -> lagna lord Mars
        planet_house={"MARS": 5, "RAHU": 1},
        paksha=None,
        is_day_birth=None,
    )
    assert result.applicable is False
    assert "lagna" in result.reason.lower()

    # Control: same relative geometry (Rahu 9th from the lagnesha) but Rahu NOT in
    # the ascendant -> the exception does not fire and the qualifier passes.
    control = evaluate_ashtottari_applicability(
        lagna_rasi=1,
        planet_house={"MARS": 8, "RAHU": 4},  # (4 - 8) % 12 + 1 = 9 -> trikona
        paksha=None,
        is_day_birth=None,
    )
    assert control.applicable is True


def test_applicability_indeterminate_when_rahu_missing() -> None:
    result = evaluate_ashtottari_applicability(
        lagna_rasi=1,
        planet_house={"MARS": 1},
        paksha="SHUKLA",
        is_day_birth=False,
    )
    assert result.applicable is None


def test_applicability_paksha_secondary_is_separate_from_primary() -> None:
    # Night birth in Shukla Paksha supports the secondary condition; day birth in
    # Shukla does not. Either way the secondary is reported independently of the
    # (here indeterminate) positional verdict, never folded into it.
    supports = evaluate_ashtottari_applicability(
        lagna_rasi=1, planet_house={"MARS": 1, "RAHU": 4},
        paksha="SHUKLA", is_day_birth=False,
    )
    assert supports.applicable is True
    assert supports.paksha_supports is True

    no_support = evaluate_ashtottari_applicability(
        lagna_rasi=1, planet_house={"MARS": 1, "RAHU": 4},
        paksha="SHUKLA", is_day_birth=True,
    )
    assert no_support.paksha_supports is False

    unknown = evaluate_ashtottari_applicability(
        lagna_rasi=1, planet_house={"MARS": 1, "RAHU": 4},
        paksha=None, is_day_birth=None,
    )
    assert unknown.paksha_supports is None
