"""Tamil family-custom notes in the muhurta picker are informational only."""

from datetime import date

from app.services.muhurta_service import _traditional_month_notices

CHENNAI = ("Asia/Kolkata", 13.0827, 80.2707)


def test_wedding_in_aadi_has_a_non_blocking_family_custom_notice() -> None:
    timezone, latitude, longitude = CHENNAI
    notices = _traditional_month_notices("MARRIAGE", date(2026, 7, 25), timezone, latitude, longitude)

    assert len(notices) == 1
    assert notices[0].month.en == "Aadi"
    assert "general family custom" in notices[0].message.en
    assert "score or recommendation" in notices[0].message.en


def test_marriage_notices_cover_purattasi_margazhi_and_conditional_thai_customs() -> None:
    timezone, latitude, longitude = CHENNAI
    purattasi = _traditional_month_notices("MARRIAGE", date(2026, 10, 1), timezone, latitude, longitude)
    margazhi = _traditional_month_notices("MARRIAGE", date(2026, 12, 20), timezone, latitude, longitude)
    thai = _traditional_month_notices("MARRIAGE", date(2027, 1, 20), timezone, latitude, longitude)

    assert purattasi[0].month.en == "Purattasi"
    assert margazhi[0].month.en == "Margazhi"
    assert thai[0].month.en == "Thai"
    assert "eldest among their siblings" in thai[0].message.en


def test_family_custom_notice_is_not_applied_to_unrelated_activities() -> None:
    timezone, latitude, longitude = CHENNAI
    assert _traditional_month_notices("SPIRITUAL", date(2026, 12, 20), timezone, latitude, longitude) == []
