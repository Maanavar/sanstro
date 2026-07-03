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


def test_nak_lord_table_derivation_krittikadi_convention() -> None:
    # Documented convention: NAK_LORD[n] = SEQUENCE[(n - 3) % 8] — the 8-lord
    # cycle opens at Krittika (n=3), per the Krittikadi variant. Regression
    # guard for this project's own derived table (see module docstring for
    # why no directly-quoted classical table was used instead).
    assert NAK_LORD[3] == "SUN"  # Krittika opens the cycle
    assert NAK_LORD[4] == "MOON"
    assert NAK_LORD[10] == "VENUS"
    assert NAK_LORD[11] == "SUN"  # cycle wraps every 8 nakshatras
    assert NAK_LORD[1] == "RAHU"  # Ashwini: (1 - 3) % 8 == 6 -> RAHU
    assert NAK_LORD[27] == "SUN"  # Revati: (27 - 3) % 8 == 0 -> SUN
    # 27 nakshatras over an 8-lord cycle can't divide evenly (27 = 3*8 + 3);
    # the 3 extra nakshatras land on whichever lords the wrap-around hits —
    # here Sun, Rahu, Venus get 4 nakshatras each, the rest get 3.
    from collections import Counter
    counts = Counter(NAK_LORD.values())
    assert counts["SUN"] == counts["RAHU"] == counts["VENUS"] == 4
    for lord in ("MOON", "MARS", "MERCURY", "SATURN", "JUPITER"):
        assert counts[lord] == 3
    assert sum(counts.values()) == 27


def test_opening_ashtottari_against_t003_reference_chart() -> None:
    # Moon at 240.01137891 deg -> nakshatra 19 (Moola, 240.0-253.33 deg).
    # NAK_LORD[19] = SEQUENCE[(19 - 3) % 8] = SEQUENCE[0] = SUN (6 years).
    # fraction_elapsed = 0.01137891 / 13.33333 = 0.00085342
    # balance_years = (1 - 0.00085342) * 6 = 5.99487948
    birth_jd = _t003_birth_jd()
    opening_lord, balance_years, opening_end_jd = calculate_opening_ashtottari(_T003_MOON_LONGITUDE, birth_jd)

    assert opening_lord == "SUN"
    assert balance_years == pytest.approx(5.99487948, abs=1e-4)
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

    assert timeline.opening_lord == "SUN"
    assert timeline.current_mahadasha.lord == "SUN"
    assert timeline.current_mahadasha.level == "maha"
    assert timeline.current_antardasha.level == "antar"
    # Opening antardasha at birth must itself be the mahadasha's own lord
    # (the mahadasha lord leads its own antardasha sequence).
    assert timeline.current_antardasha.lord == "SUN"


def test_antardashas_span_full_unclipped_mahadasha() -> None:
    birth_jd = _t003_birth_jd()
    timeline = calculate_ashtottari_timeline(birth_jd, _T003_MOON_LONGITUDE, as_of_jd=birth_jd)

    total_days = sum(p.end_jd - p.start_jd for p in timeline.antardashas)
    expected_days = ASHTOTTARI_YEARS["SUN"] * JULIAN_YEAR_DAYS
    assert total_days == pytest.approx(expected_days, abs=1e-6)
    assert [p.lord for p in timeline.antardashas] == _sequence_from("SUN")


def test_mahadasha_sequence_wraps_in_fixed_order_after_opening() -> None:
    birth_jd = _t003_birth_jd()
    timeline = calculate_ashtottari_timeline(birth_jd, _T003_MOON_LONGITUDE, as_of_jd=birth_jd)

    lords = [p.lord for p in timeline.mahadashas[:8]]
    assert lords == _sequence_from("SUN")
    # A cyclic 8-lord sequence repeating forever: cycle 2 reproduces the
    # exact same relative order as cycle 1.
    assert [p.lord for p in timeline.mahadashas[8:16]] == lords
