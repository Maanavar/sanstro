from __future__ import annotations

from datetime import datetime

import pytest

from app.calculations.astro import local_datetime_to_utc, utc_datetime_to_julian_day
from app.calculations.dasha import JULIAN_YEAR_DAYS
from app.calculations.kalachakra_dasha import (
    CHAKRA_DIRECTION,
    KALACHAKRA_CHAKRAS,
    NAKSHATRA_GROUP,
    RASI_YEARS,
    KalachakraPeriod,
    _build_antardashas,
    calculate_kalachakra_timeline,
    calculate_opening_kalachakra,
)

pytestmark = pytest.mark.no_db

# Same T003 reference chart used by test_golden_validation.py,
# test_jaimini_karakas.py, test_yogini_dasha.py and test_ashtottari_dasha.py
# (1993-03-15 08:15 IST, longitudes cross-verified to within 0.1 deg against
# a second ephemeris source). Moon at 240.01137891 deg falls in Moola
# (nakshatra 19), 1st pada -- which happens to be directly one of the rows
# in Saravali's Kalachakra table (Aswini chakra, Savya, Paramayus 100).
_T003_MOON_LONGITUDE = 240.01137891


def _t003_birth_jd() -> float:
    dt_utc = local_datetime_to_utc(datetime(1993, 3, 15, 8, 15), "Asia/Kolkata")
    return utc_datetime_to_julian_day(dt_utc)


def test_every_pada_sequence_sums_to_its_own_paramayus() -> None:
    # Strongest available internal-consistency check on the transcription
    # from kala_chakras.html: each 9-rasi row must sum exactly to its stated
    # Paramayus (83, 85, 86 or 100 years).
    for chakra, padas in KALACHAKRA_CHAKRAS.items():
        for pada, (sequence, paramayus) in padas.items():
            total = sum(RASI_YEARS[rasi] for rasi in sequence)
            assert total == paramayus, f"{chakra} pada {pada} sums to {total}, expected {paramayus}"
            assert len(sequence) == 9


def test_nakshatra_group_table_counts_match_source() -> None:
    # kala_basics.html: Aswini group has 10 nakshatras, Bharani 5, Rohini 8,
    # Mrigasira 4 (10+5+8+4 = 27).
    from collections import Counter

    counts = Counter(NAKSHATRA_GROUP.values())
    assert counts["ASWINI"] == 10
    assert counts["BHARANI"] == 5
    assert counts["ROHINI"] == 8
    assert counts["MRIGASIRA"] == 4
    assert sum(counts.values()) == 27
    # Spot checks against the verbatim mapping table.
    assert NAKSHATRA_GROUP[1] == "ASWINI"  # Aswini
    assert NAKSHATRA_GROUP[2] == "BHARANI"  # Bharani
    assert NAKSHATRA_GROUP[19] == "ASWINI"  # Mula (T003's nakshatra)
    assert NAKSHATRA_GROUP[4] == "ROHINI"  # Rohini
    assert NAKSHATRA_GROUP[5] == "MRIGASIRA"  # Mrigasira


def test_chakra_direction_matches_source() -> None:
    assert CHAKRA_DIRECTION["ASWINI"] == "SAVYA"
    assert CHAKRA_DIRECTION["BHARANI"] == "SAVYA"
    assert CHAKRA_DIRECTION["ROHINI"] == "APSAVYA"
    assert CHAKRA_DIRECTION["MRIGASIRA"] == "APSAVYA"


def test_opening_kalachakra_against_t003_reference_chart() -> None:
    # Moon at 240.01137891 deg -> nakshatra 19 (Moola), 1st pada.
    # NAKSHATRA_GROUP[19] = ASWINI -> pada 1 sequence starts ARI(7)...,
    # Paramayus 100.
    # fraction_into_pada = 0.01137891 / 3.33333333 = 0.0034137
    # expired_years = 0.0034137 * 100 = 0.34137
    # 0.34137 < 7 (Aries years) -> opening rasi is Aries, balance =
    # 7 - 0.34137 = 6.65863
    birth_jd = _t003_birth_jd()
    chakra, pada, sequence, paramayus, opening_index, balance_years, opening_end_jd = (
        calculate_opening_kalachakra(_T003_MOON_LONGITUDE, birth_jd)
    )

    assert chakra == "ASWINI"
    assert pada == 1
    assert paramayus == 100
    assert sequence == ("ARI", "TAU", "GEM", "CAN", "LEO", "VIR", "LIB", "SCO", "SAG")
    assert opening_index == 0
    assert balance_years == pytest.approx(6.65863, abs=1e-3)
    assert opening_end_jd == pytest.approx(birth_jd + balance_years * JULIAN_YEAR_DAYS)


def test_opening_at_pada_start_gives_full_balance() -> None:
    # Exact start of Ashwini (nakshatra 1, pada 1): fraction_into_pada == 0,
    # so the full pada-1 Paramayus-100 sequence's first rasi (Aries, 7y) is
    # the opening Mahadasha with its full 7-year balance.
    birth_jd = _t003_birth_jd()
    chakra, pada, sequence, paramayus, opening_index, balance_years, _ = (
        calculate_opening_kalachakra(0.0, birth_jd)
    )

    assert chakra == "ASWINI"
    assert pada == 1
    assert opening_index == 0
    assert balance_years == pytest.approx(7.0, abs=1e-6)


def test_timeline_current_mahadasha_and_antardasha_at_birth_is_opening_rasi() -> None:
    birth_jd = _t003_birth_jd()
    timeline = calculate_kalachakra_timeline(birth_jd, _T003_MOON_LONGITUDE, as_of_jd=birth_jd)

    assert timeline.opening_rasi == "ARI"
    assert timeline.current_mahadasha.rasi == "ARI"
    assert timeline.current_mahadasha.level == "maha"
    assert timeline.current_antardasha.level == "antar"
    # At birth we are still within Aries' own antardasha (0.34y elapsed of a
    # 0.49y ARI/ARI antardasha) -- the mahadasha lord leads its own
    # antardasha sequence, same convention as every other dasha module here.
    assert timeline.current_antardasha.rasi == "ARI"


def test_antardashas_span_full_unclipped_mahadasha() -> None:
    birth_jd = _t003_birth_jd()
    timeline = calculate_kalachakra_timeline(birth_jd, _T003_MOON_LONGITUDE, as_of_jd=birth_jd)

    total_days = sum(p.end_jd - p.start_jd for p in timeline.antardashas)
    expected_days = RASI_YEARS["ARI"] * JULIAN_YEAR_DAYS
    assert total_days == pytest.approx(expected_days, abs=1e-6)
    assert len(timeline.antardashas) == 9


def test_antardasha_duration_matches_source_worked_example() -> None:
    # Reproduces kala_antardasas.html's own cited worked example verbatim:
    # "Taurus Dasa has a total period of 16 years. Let birth be in the 3rd
    # Pada of Aswini Chakra (Savya). The Paramayus is 83 years."
    #   Taurus/Taurus = 16 * 16 / 83 = 3.0843 years
    #   Taurus/Aries  = 7 * 16 / 83  = 1.349 years
    sequence, paramayus = KALACHAKRA_CHAKRAS["ASWINI"][3]
    assert paramayus == 83
    taurus_index = sequence.index("TAU")  # first occurrence, index 0

    parent = KalachakraPeriod(
        level="maha",
        rasi="TAU",
        pada_table_index=taurus_index,
        start_jd=2_400_000.0,
        end_jd=2_400_000.0 + 16 * JULIAN_YEAR_DAYS,
        start_date=datetime(2000, 1, 1).date(),
        end_date=datetime(2016, 1, 1).date(),
        sequence_index=0,
    )
    antardashas = _build_antardashas(parent, sequence, paramayus)

    assert antardashas[0].rasi == "TAU"
    assert (antardashas[0].end_jd - antardashas[0].start_jd) / JULIAN_YEAR_DAYS == pytest.approx(3.0843, abs=1e-3)
    assert antardashas[1].rasi == "ARI"
    assert (antardashas[1].end_jd - antardashas[1].start_jd) / JULIAN_YEAR_DAYS == pytest.approx(1.349, abs=1e-3)
    total_years = sum((p.end_jd - p.start_jd) / JULIAN_YEAR_DAYS for p in antardashas)
    assert total_years == pytest.approx(16.0, abs=1e-6)


def test_mahadasha_sequence_repeats_via_portion_zero_method() -> None:
    # Documented convention: once the birth pada's 9-rasi sequence is
    # exhausted, it repeats from its own first rasi (Portion Zero Method,
    # kala_cycle.html's named South-Indian convention) -- so cycle 2
    # reproduces the exact same relative rasi order as cycle 1.
    birth_jd = _t003_birth_jd()
    timeline = calculate_kalachakra_timeline(birth_jd, _T003_MOON_LONGITUDE, as_of_jd=birth_jd)

    first_cycle = [p.rasi for p in timeline.mahadashas[:9]]
    second_cycle = [p.rasi for p in timeline.mahadashas[9:18]]
    assert first_cycle == ["ARI", "TAU", "GEM", "CAN", "LEO", "VIR", "LIB", "SCO", "SAG"]
    assert second_cycle == first_cycle
