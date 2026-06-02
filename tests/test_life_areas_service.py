from datetime import date

from app.services.life_areas_service import _duration_caution, _narrative


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
