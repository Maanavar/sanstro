"""Ranking invariants for the personal activity-date month view."""
from __future__ import annotations

import pytest

from app.services.daily_guidance_service import _activity_timing_rank

pytestmark = pytest.mark.no_db


def test_chart_score_can_cross_a_generic_panchangam_bucket_boundary() -> None:
    """Regression for D4: SUPPORTS used to receive an untouchable +200."""
    chart_strong_caution = _activity_timing_rank(92, "CAUTION", -30, 10)
    chart_weak_support = _activity_timing_rank(45, "SUPPORTS", 8, 11)

    assert chart_strong_caution > chart_weak_support


def test_alignment_and_date_are_deterministic_tie_breakers() -> None:
    assert _activity_timing_rank(60, "SUPPORTS", 0, 8) > _activity_timing_rank(60, "NEUTRAL", 0, 7)
    assert _activity_timing_rank(60, "NEUTRAL", 0, 7) > _activity_timing_rank(60, "NEUTRAL", 0, 8)
