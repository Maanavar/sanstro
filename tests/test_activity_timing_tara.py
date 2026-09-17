"""Personal Tara Bala in the activity-timing ranker."""
from __future__ import annotations

import pytest

from app.calculations.activity_timing_rules import assess_activity_timing

pytestmark = pytest.mark.no_db

_DAY = (15, "SHUKLA", "JUPITER")


def test_omitting_birth_star_keeps_the_activity_assessment_impersonal() -> None:
    result = assess_activity_timing("marriage", *_DAY, nakshatra_number=1)

    assert result.tara_signal is None
    assert result.tara_score == 0


def test_personal_tara_is_named_and_uses_the_shared_calibration() -> None:
    result = assess_activity_timing(
        "marriage", *_DAY, nakshatra_number=3, janma_nakshatra=1
    )

    assert result.tara_signal is not None
    assert result.tara_signal.short_en == "Vipat tara"
    assert result.tara_score == -30
    assert "Vipat tara" in result.combined_en


def test_two_synthetic_birth_stars_reverse_the_same_two_day_order() -> None:
    """Tara is a real personal factor rather than explanatory decoration."""
    day_stars = (1, 2)

    first_subject = [
        assess_activity_timing("marriage", *_DAY, nakshatra_number=star, janma_nakshatra=1)
        for star in day_stars
    ]
    second_subject = [
        assess_activity_timing("marriage", *_DAY, nakshatra_number=star, janma_nakshatra=2)
        for star in day_stars
    ]

    assert first_subject[1].tara_score > first_subject[0].tara_score
    assert second_subject[0].tara_score > second_subject[1].tara_score


# ── A couple's day in the month scan (owner ruling R1) ──────────────────────
def _couple_day(scores: list[int], janmas: tuple[int, int]):
    from app.services.daily_guidance_service import _couple_timing_day
    from app.services.muhurtham_naal_service import couple_who

    general = assess_activity_timing("marriage", *_DAY, nakshatra_number=3)
    readings = [
        assess_activity_timing("marriage", *_DAY, nakshatra_number=3, janma_nakshatra=janma)
        for janma in janmas
    ]
    return readings, _couple_timing_day(general, readings, scores, couple_who("BRIDE"))


def test_a_couple_day_takes_the_lower_score_and_the_weaker_tara_independently() -> None:
    # Day star 3: Vipat for a star-1 bride, Sampat for a star-2 groom. The
    # groom's day score is lower, the bride's Tara is weaker — each family
    # is folded on its own, so the day takes one of each.
    readings, (score, tara, reason_ta, reason_en) = _couple_day([72, 64], (1, 2))
    assert readings[0].tara_score < 0 < readings[1].tara_score
    assert score == 64
    assert tara == readings[0].tara_score
    assert reason_en.startswith("Bride: Vipat tara")
    assert "Groom: Sampat tara" in reason_en
    assert "(Bride 72 · Groom 64)" in reason_en
    assert "the bride's Tara, the weaker of the two" in reason_en
    assert reason_ta.startswith("மணமகள்: ") and "மணமகன்: " in reason_ta


def test_an_identical_couple_day_says_so_instead_of_naming_a_winner() -> None:
    _, (score, tara, _, reason_en) = _couple_day([70, 70], (1, 1))
    assert (score, tara) == (70, -30)
    assert "Both charts score this day 70." in reason_en
    assert "weaker of the two" not in reason_en
