"""Tamil month notes in the muhurta picker.

Two kinds, separated by F-MUH-01: Aadi / Purattasi / Margazhi are a practice
rule that now demotes the date, while the Thai eldest-child note is a genuine
family custom and stays advisory.
"""

from datetime import date

import pytest

from app.calculations.muhurta_engine import NO_WEDDING_TAMIL_MONTHS
from app.calculations.tamil_calendar import tamil_solar_date
from app.services.muhurta_service import _traditional_month_notices

CHENNAI = ("Asia/Kolkata", 13.0827, 80.2707)


def test_wedding_in_aadi_says_the_date_is_demoted_not_merely_noted() -> None:
    """F-MUH-01. The notice used to promise the opposite of what the picker
    did — "it does not change this muhurta's score or recommendation" — while
    an Aadi date could rank first."""
    timezone, latitude, longitude = CHENNAI
    notices = _traditional_month_notices("MARRIAGE", date(2026, 7, 25), timezone, latitude, longitude)

    assert len(notices) == 1
    assert notices[0].month.en == "Aadi"
    assert "ranked below" in notices[0].message.en
    assert "general family custom" not in notices[0].message.en
    assert "score or recommendation" not in notices[0].message.en


@pytest.mark.parametrize("day", [date(2026, 7, 25), date(2026, 10, 1), date(2026, 12, 20)])
def test_the_noticed_months_are_the_months_the_engine_demotes(day: date) -> None:
    """The notice and the demotion must name the same three months; a notice
    on a month the engine does not demote is the old bug in the other
    direction."""
    timezone, latitude, longitude = CHENNAI
    month_index, _ = tamil_solar_date(day, timezone, latitude, longitude)
    assert month_index in NO_WEDDING_TAMIL_MONTHS
    assert _traditional_month_notices("MARRIAGE", day, timezone, latitude, longitude)


def test_marriage_notices_cover_purattasi_margazhi_and_conditional_thai_customs() -> None:
    timezone, latitude, longitude = CHENNAI
    purattasi = _traditional_month_notices("MARRIAGE", date(2026, 10, 1), timezone, latitude, longitude)
    margazhi = _traditional_month_notices("MARRIAGE", date(2026, 12, 20), timezone, latitude, longitude)
    thai = _traditional_month_notices("MARRIAGE", date(2027, 1, 20), timezone, latitude, longitude)

    assert purattasi[0].month.en == "Purattasi"
    assert margazhi[0].month.en == "Margazhi"
    assert thai[0].month.en == "Thai"
    # Thai is the one that genuinely is family-specific, so it keeps the
    # original advisory wording and the engine does not demote it.
    assert "eldest among their siblings" in thai[0].message.en
    assert "does not change this muhurta's score" in thai[0].message.en
    thai_month_index, _ = tamil_solar_date(date(2027, 1, 20), timezone, latitude, longitude)
    assert thai_month_index not in NO_WEDDING_TAMIL_MONTHS


def test_family_custom_notice_is_not_applied_to_unrelated_activities() -> None:
    timezone, latitude, longitude = CHENNAI
    assert _traditional_month_notices("SPIRITUAL", date(2026, 12, 20), timezone, latitude, longitude) == []
