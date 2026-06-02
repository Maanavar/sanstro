from __future__ import annotations

from datetime import date
from types import SimpleNamespace
from typing import Any

import pytest
from fastapi import HTTPException

import app.services.dasha_service as dasha_service
import app.services.emotional_weather as emotional_weather
import app.services.nakshatra_content as nakshatra_content
import app.services.narrative_engine as narrative_engine


def _assert_bilingual_text(text: Any) -> None:
    assert hasattr(text, "ta"), "Tamil field missing"
    assert hasattr(text, "en"), "English field missing"
    assert isinstance(text.ta, str) and text.ta.strip(), "Tamil text empty"
    assert isinstance(text.en, str) and text.en.strip(), "English text empty"


def test_narrative_engine_catalog_entries_are_bilingual_non_empty():
    direct_maps = [
        narrative_engine.PLANET_NAME,
        narrative_engine.RASI_NAME,
        narrative_engine.NAKSHATRA_NAME,
        narrative_engine._DASHA_CHARACTER,
        narrative_engine._ANTARA_NOTE,
        narrative_engine._SANI_CYCLE_WARN,
        narrative_engine._PLANET_REMEDY,
        narrative_engine._CYCLE_REMEDY,
    ]
    for mapping in direct_maps:
        for value in mapping.values():
            _assert_bilingual_text(value)

    for nested in narrative_engine._TRANSIT_QUALITY.values():
        for value in nested.values():
            _assert_bilingual_text(value)

    _assert_bilingual_text(narrative_engine._CHANDRASHTAMA_REMEDY)


def test_narrative_engine_core_outputs_remain_bilingual_non_empty():
    _assert_bilingual_text(
        narrative_engine.moon_transit_reason(
            current_nakshatra=8,
            janma_nakshatra=4,
            chandrashtama=False,
            current_moon_rasi=99,  # Explicit out-of-range input checks safe fallback.
            janma_rasi=4,
            moon_score=70,
        )
    )
    _assert_bilingual_text(narrative_engine.dasha_support_reason("JUPITER", "MOON", 68))
    _assert_bilingual_text(
        narrative_engine.panchangam_reason(
            tithi_number=8,
            yoga_number=17,
            karana_name="VISHTI",
            weekday_lord="SATURN",
            panchangam_score=42,
            nakshatra_number=22,
        )
    )
    _assert_bilingual_text(
        narrative_engine.gochar_reason(
            jupiter_house=5,
            saturn_house=8,
            sani_cycle_type="ASHTAMA_SANI",
            sani_cycle_active=True,
            chandrashtama=False,
            transit_score=47,
        )
    )
    _assert_bilingual_text(
        narrative_engine.personal_caution_reason(
            chandrashtama=True,
            sani_cycle_type="ASHTAMA_SANI",
            sani_cycle_active=True,
            mercury_combust=True,
            abhijit_restricted=True,
            personal_score=32,
            kantaka_sani_active=False,
        )
    )
    _assert_bilingual_text(
        narrative_engine.daily_summary(
            score=61,
            maha_lord="JUPITER",
            antar_lord="MOON",
            chandrashtama=False,
            sani_cycle_type=None,
            sani_cycle_active=False,
            best_window_label="10:20-11:05",
        )
    )
    _assert_bilingual_text(
        narrative_engine.action_suggestion(
            maha_lord="JUPITER",
            best_window_start="10:20",
            best_window_end="11:05",
            score=61,
        )
    )
    _assert_bilingual_text(
        narrative_engine.caution_suggestion(
            chandrashtama=False,
            sani_cycle_type=None,
            sani_cycle_active=False,
            rahu_kalam_start="13:30",
            rahu_kalam_end="15:00",
        )
    )
    _assert_bilingual_text(
        narrative_engine.remedy_suggestion(
            maha_lord="JUPITER",
            sani_cycle_type="ASHTAMA_SANI",
            sani_cycle_active=True,
            chandrashtama=False,
            score=35,
        )
    )
    _assert_bilingual_text(
        narrative_engine.build_strength_narrative(
            planets=[
                SimpleNamespace(graha="SUN", rasi=5, absolute_longitude=125.0, is_retrograde=False, is_vargottama=False, d9_rasi=5),
                SimpleNamespace(graha="JUPITER", rasi=9, absolute_longitude=250.0, is_retrograde=False, is_vargottama=True, d9_rasi=9),
                SimpleNamespace(graha="SATURN", rasi=12, absolute_longitude=358.0, is_retrograde=False, is_vargottama=False, d9_rasi=6),
            ],
            lagna_rasi=1,
        )
    )
    for tithi in (30, 15, 13, 11):
        card = narrative_engine.tithi_content_card(tithi)
        assert card is not None
        _assert_bilingual_text(card)

    reasons = narrative_engine.build_score_reasons(
        score=59,
        current_nakshatra=8,
        janma_nakshatra=4,
        chandrashtama=False,
        current_moon_rasi=6,
        janma_rasi=4,
        moon_score=62,
        maha_lord="JUPITER",
        antar_lord="MOON",
        dasha_score=68,
        tithi_number=8,
        yoga_number=17,
        karana_name="VISHTI",
        weekday_lord="SATURN",
        panchangam_score=42,
        panchangam_nakshatra=22,
        jupiter_house_from_moon=5,
        saturn_house_from_moon=8,
        sani_cycle_type="ASHTAMA_SANI",
        sani_cycle_active=True,
        kantaka_sani_active=False,
        transit_score=47,
        mercury_combust=True,
        abhijit_restricted=True,
        personal_score=32,
        best_window_start="10:20",
        best_window_end="11:05",
        best_window_label="10:20-11:05",
        rahu_kalam_start="13:30",
        rahu_kalam_end="15:00",
    )
    _assert_bilingual_text(reasons.moon_transit)
    _assert_bilingual_text(reasons.dasha_support)
    _assert_bilingual_text(reasons.panchangam)
    _assert_bilingual_text(reasons.gochar)
    _assert_bilingual_text(reasons.personal_caution)
    _assert_bilingual_text(reasons.summary)
    _assert_bilingual_text(reasons.action)
    _assert_bilingual_text(reasons.caution)
    _assert_bilingual_text(reasons.remedy)


def test_nakshatra_content_catalog_and_overlays_are_bilingual_non_empty():
    for nakshatra_number in range(1, 28):
        _assert_bilingual_text(nakshatra_content.NAKSHATRA_LENS[nakshatra_number])
    _assert_bilingual_text(nakshatra_content.DEFAULT_LENS)

    for label in ("STRONG_SUPPORT", "GOOD", "BALANCED", "CAUTION", "RESTORATIVE"):
        _assert_bilingual_text(nakshatra_content.build_nakshatra_perspective(21, label))


def test_emotional_weather_templates_are_bilingual_non_empty():
    for result in emotional_weather._TONE_MAP.values():
        _assert_bilingual_text(result.tone_text)
        _assert_bilingual_text(result.physical_tendency_text)
        _assert_bilingual_text(result.best_use_of_day_text)
        if result.avoid_before is not None:
            _assert_bilingual_text(result.avoid_before)

    _assert_bilingual_text(emotional_weather._DEFAULT_RESULT.tone_text)
    _assert_bilingual_text(emotional_weather._DEFAULT_RESULT.physical_tendency_text)
    _assert_bilingual_text(emotional_weather._DEFAULT_RESULT.best_use_of_day_text)


def test_dasha_service_invalid_level_error_is_bilingual():
    timeline = SimpleNamespace(
        mahadashas=[],
        current_mahadasha=SimpleNamespace(),
        current_antardasha=SimpleNamespace(),
        current_pratyantardasha=SimpleNamespace(),
        current_sookshmadasha=SimpleNamespace(),
    )

    with pytest.raises(HTTPException) as exc:
        dasha_service._timeline_for_level(timeline, "invalid", lagna_rasi=1, birth_date=date(1990, 1, 1))  # type: ignore[arg-type]

    assert exc.value.status_code == 422
    assert isinstance(exc.value.detail, dict)
    assert isinstance(exc.value.detail.get("ta"), str) and exc.value.detail["ta"].strip()
    assert isinstance(exc.value.detail.get("en"), str) and exc.value.detail["en"].strip()


def test_t121_no_fear_based_wording_regression():
    forbidden_tokens = [
        "curse",
        "death",
        "disaster",
        "definitely",
        "you will die",
        "guaranteed loss",
        "no marriage",
        "no children",
    ]

    outputs = [
        narrative_engine.moon_transit_reason(8, 4, False, 6, 4, 62),
        narrative_engine.dasha_support_reason("JUPITER", "MOON", 68),
        narrative_engine.panchangam_reason(8, 17, "VISHTI", "SATURN", 42, 22),
        narrative_engine.gochar_reason(5, 8, "ASHTAMA_SANI", True, False, 47),
        narrative_engine.personal_caution_reason(True, "ASHTAMA_SANI", True, True, True, 32, kantaka_sani_active=False),
        narrative_engine.daily_summary(59, "JUPITER", "MOON", False, None, False, "10:20-11:05"),
        narrative_engine.action_suggestion("JUPITER", "10:20", "11:05", 59),
        narrative_engine.caution_suggestion(False, None, False, "13:30", "15:00"),
        narrative_engine.remedy_suggestion("JUPITER", "ASHTAMA_SANI", True, False, 35),
    ]

    for output in outputs:
        combined = f"{output.ta} {output.en}".lower()
        for token in forbidden_tokens:
            assert token not in combined, f"Found forbidden token '{token}' in narrative output: {combined}"
