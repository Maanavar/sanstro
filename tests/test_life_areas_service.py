from datetime import date

from app.services.life_areas_service import (
    _CHANDRASHTAMA_AREAS,
    _TREND_DELTA,
    _duration_caution,
    _narrative,
    _trend,
)

# ── Trend arrow ────────────────────────────────────────────────────────────────
# `_trend` used to be a function of the current score alone — score < 45 meant
# "DOWN" — so a tile reading "Money 16 ↓" was not saying money was falling, it
# was saying 16 is a low number. It now measures the real six-month slope.


def test_trend_reads_the_six_month_slope_not_the_current_level():
    # A low score that is climbing must read UP, and a high one that is falling
    # must read DOWN. Both were impossible under the old level-only rule.
    assert _trend(16, 16 + _TREND_DELTA) == "UP"
    assert _trend(82, 82 - _TREND_DELTA) == "DOWN"


def test_trend_ignores_moves_smaller_than_the_ashtakavarga_jitter():
    # The ashtakavarga term alone swings a score by up to ±4 when the area's
    # karaka changes rasi, which is not a change of direction.
    for delta in range(-(_TREND_DELTA - 1), _TREND_DELTA):
        assert _trend(50, 50 + delta) == "STABLE", delta


def test_trend_is_flat_when_nothing_moves():
    for score in (0, 16, 45, 54, 70, 100):
        assert _trend(score, score) == "STABLE"


def test_chandrashtama_areas_are_the_mind_sensitive_ones():
    # The client's `chandrashtamaApplied` flag is derived from this same set, so
    # the marker on a tile can never disagree with the penalty on its score.
    assert _CHANDRASHTAMA_AREAS == frozenset(
        {"HEALTH", "RELATIONSHIPS", "FAMILY_HARMONY", "EDUCATION"}
    )
    assert "CAREER" not in _CHANDRASHTAMA_AREAS
    assert "MONEY" not in _CHANDRASHTAMA_AREAS


def test_low_score_health_caution_uses_non_chandrashtama_text_when_false():
    bundle = _narrative(
        area="HEALTH",
        score=40,
        maha_lord="MOON",
        sani_active=True,
        sani_type="ASHTAMA_SANI",
        chandrashtama=False,
        jupiter_house=7,
        saturn_house=4,
    )
    assert bundle.caution is not None
    assert "Chandrashtamam" not in bundle.caution.en
    assert "Ashtama Sani" in bundle.caution.en


def test_low_score_health_caution_mentions_chandrashtama_when_true():
    bundle = _narrative(
        area="HEALTH",
        score=40,
        maha_lord="MOON",
        sani_active=True,
        sani_type="ASHTAMA_SANI",
        chandrashtama=True,
        jupiter_house=7,
        saturn_house=4,
    )
    assert bundle.caution is not None
    assert "Chandrashtamam" in bundle.caution.en


def test_low_score_relationship_caution_is_conditional():
    bundle_no_chandra = _narrative(
        area="RELATIONSHIPS",
        score=40,
        maha_lord="MOON",
        sani_active=False,
        sani_type=None,
        chandrashtama=False,
        jupiter_house=7,
        saturn_house=4,
    )
    bundle_with_chandra = _narrative(
        area="RELATIONSHIPS",
        score=40,
        maha_lord="MOON",
        sani_active=False,
        sani_type=None,
        chandrashtama=True,
        jupiter_house=7,
        saturn_house=4,
    )

    assert bundle_no_chandra.caution is not None
    assert bundle_with_chandra.caution is not None
    assert "Chandrashtamam" not in bundle_no_chandra.caution.en
    assert "Chandrashtamam" in bundle_with_chandra.caution.en


def test_low_score_education_caution_is_conditional():
    bundle_no_chandra = _narrative(
        area="EDUCATION",
        score=40,
        maha_lord="MOON",
        sani_active=False,
        sani_type=None,
        chandrashtama=False,
        jupiter_house=7,
        saturn_house=4,
    )
    bundle_with_chandra = _narrative(
        area="EDUCATION",
        score=40,
        maha_lord="MOON",
        sani_active=False,
        sani_type=None,
        chandrashtama=True,
        jupiter_house=7,
        saturn_house=4,
    )

    assert bundle_no_chandra.caution is not None
    assert bundle_with_chandra.caution is not None
    assert "Chandrashtamam" not in bundle_no_chandra.caution.en
    assert "Chandrashtamam" in bundle_with_chandra.caution.en


def test_low_score_family_caution_is_conditional():
    bundle_no_chandra = _narrative(
        area="FAMILY_HARMONY",
        score=40,
        maha_lord="MOON",
        sani_active=False,
        sani_type=None,
        chandrashtama=False,
        jupiter_house=7,
        saturn_house=4,
    )
    bundle_with_chandra = _narrative(
        area="FAMILY_HARMONY",
        score=40,
        maha_lord="MOON",
        sani_active=False,
        sani_type=None,
        chandrashtama=True,
        jupiter_house=7,
        saturn_house=4,
    )

    assert bundle_no_chandra.caution is not None
    assert bundle_with_chandra.caution is not None
    assert "Chandrashtamam" not in bundle_no_chandra.caution.en
    assert "Chandrashtamam" in bundle_with_chandra.caution.en


def test_duration_caution_includes_until_date_and_action():
    caution = _duration_caution("CAREER", date(2026, 9, 1))
    assert "until" in caution.en.lower()
    assert "Improvement starts" in caution.en
