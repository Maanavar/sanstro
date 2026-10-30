"""AAU-16 (ruled 2026-10-29): Tamil year name, Ayanam and Ruthu.

Synthetic dates only. The 29 Oct 2026 fixture is the ruling's own: Parabhava
(#40), Aippasi, Dakshinayanam, Koodhir — computed, not copied.
"""
from __future__ import annotations

from datetime import date

import pytest

from app.calculations.tamil_year import RUTHU_CYCLE, SAMVATSARA_NAMES, samvatsara_number, tamil_year_info

pytestmark = pytest.mark.no_db

CHENNAI = ("Asia/Kolkata", 13.0827, 80.2707)


def test_the_cycle_has_sixty_names_and_the_known_years_land() -> None:
    assert len(SAMVATSARA_NAMES) == 60 == len({en for _, en in SAMVATSARA_NAMES})
    assert SAMVATSARA_NAMES[samvatsara_number(1987) - 1][1] == "Prabhava"
    assert SAMVATSARA_NAMES[samvatsara_number(2024) - 1][1] == "Krodhi"
    assert SAMVATSARA_NAMES[samvatsara_number(2025) - 1][1] == "Visuvasu"
    assert samvatsara_number(2026) == 40 and SAMVATSARA_NAMES[39] == ("பராபவ", "Parabhava")
    assert samvatsara_number(2047) == 1  # the cycle returns after sixty years


def test_the_rulings_fixture_29_oct_2026() -> None:
    info = tamil_year_info(date(2026, 10, 29), *CHENNAI)
    assert (info.year_number, info.year_en) == (40, "Parabhava")
    assert info.month_index == 6  # Aippasi
    assert info.ayanam == "DAKSHINAYANAM"
    assert info.ruthu == "KOODHIR"


def test_the_year_turns_at_chithirai_1_not_on_1_january() -> None:
    # Margazhi in January and Panguni in early April still belong to the year
    # that began the April before.
    assert tamil_year_info(date(2027, 1, 5), *CHENNAI).year_en == "Parabhava"
    assert tamil_year_info(date(2027, 4, 10), *CHENNAI).year_en == "Parabhava"
    assert tamil_year_info(date(2027, 4, 20), *CHENNAI).year_en == "Plavanga"


def test_a_birth_before_sunrise_on_chithirai_1_keeps_the_old_year() -> None:
    """Callers pass the Tamil day (AAU-02): 03:00 on 14 Apr 1995 is Panguni 30
    of the previous day, so the year is still the old one."""
    old = tamil_year_info(date(1995, 4, 13), *CHENNAI)
    new = tamil_year_info(date(1995, 4, 14), *CHENNAI)
    assert old.month_index == 11 and new.month_index == 0
    assert new.year_number == old.year_number % 60 + 1


def test_ayanam_follows_the_makara_and_kataka_ingress() -> None:
    assert tamil_year_info(date(2026, 1, 10), *CHENNAI).ayanam == "DAKSHINAYANAM"  # Margazhi
    assert tamil_year_info(date(2026, 1, 20), *CHENNAI).ayanam == "UTTARAYANAM"    # Thai
    assert tamil_year_info(date(2026, 7, 10), *CHENNAI).ayanam == "UTTARAYANAM"    # Aani
    assert tamil_year_info(date(2026, 7, 25), *CHENNAI).ayanam == "DAKSHINAYANAM"  # Aadi


def test_ruthu_cycle_starts_with_kaar_and_covers_every_month_once() -> None:
    assert RUTHU_CYCLE[0][0] == "KAAR"
    months = [m for *_, pair in RUTHU_CYCLE for m in pair]
    assert sorted(months) == list(range(12))
