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
    # source; the interior boundaries are the adopted table pending a JHora
    # cross-check.
    assert NAK_LORD[1] == "RAHU"    # Ashwini  [stable anchor]
    assert NAK_LORD[2] == "RAHU"    # Bharani  [stable anchor]
    assert NAK_LORD[27] == "RAHU"   # Revati   [stable anchor]
    assert NAK_LORD[6] == "SUN"     # Ardra — the reckoning anchor
    assert NAK_LORD[9] == "MOON"    # Ashlesha
    assert NAK_LORD[13] == "MARS"   # Hasta
    assert NAK_LORD[19] == "MERCURY"  # Mula
    assert NAK_LORD[20] == "SATURN"   # Purva Ashadha
    assert NAK_LORD[23] == "JUPITER"  # Dhanishta
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
