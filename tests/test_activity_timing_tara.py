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
