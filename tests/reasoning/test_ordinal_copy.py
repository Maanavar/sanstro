"""Phase 2 (D2/D3/D7) — ordinal copy: band words AND numeric scores together.

Product decision 2026-07-13 (P0-1, docs/PREDICTION_DOCTRINE_AND_ROADMAP.md):
show both the band word and the numeric score in user copy, not one or the
other. The `reasoning_bands` flag therefore no longer toggles score-bearing
narrative text — those strings carry the score regardless of the flag. The
flag still gates the `band` field's confidence-vocabulary unification (e.g.
marriage's legacy `confidence` tier deriving from the `Band`).

precision_validator remains a real enforcement tool for the epistemic-state
voices (SILENT_VOICE/BLOCKED_VOICE/reading phrases) — those never claim a
score in the first place and must stay that way.
"""
from datetime import date

import pytest

from app.services import feature_flags
from app.services.life_areas_service import _build_area_reason
from app.services.narrative_engine import (
    BLOCKED_VOICE,
    SILENT_VOICE,
    band_phrase,
    daily_summary,
    dasha_support_reason,
    gochar_reason,
    panchangam_reason,
    personal_caution_reason,
    precision_validator,
    tone_validator,
)
from app.services.whatif_service import (
    _build_summary,
    _DashaAssessment,
    _GocharAssessment,
    _NatalAssessment,
)

pytestmark = pytest.mark.no_db

ALL_BANDS = ("STRONG", "LIKELY", "MIXED", "WEAK", "BLOCKED", "SILENT")


@pytest.fixture
def bands_on():
    feature_flags.set_flag("reasoning_bands", True)
    yield
    feature_flags.reset_flag("reasoning_bands")


@pytest.fixture
def bands_off():
    feature_flags.set_flag("reasoning_bands", False)
    yield
    feature_flags.reset_flag("reasoning_bands")


def _narrative_sweep() -> list[str]:
    """Every Phase 2 narrative output, both languages, across score bands."""
    texts: list[str] = []
    for score in (10, 40, 47, 52, 63, 72, 90):
        for bi in (
            dasha_support_reason("JUPITER", "VENUS", score),
            panchangam_reason(5, 2, "BAVA", "JUPITER", score, 10),
            gochar_reason(5, 3, None, False, False, score),
            personal_caution_reason(False, None, False, False, False, score),
            daily_summary(score, "JUPITER", "VENUS", False, None, False, None),
        ):
            texts.extend((bi.ta, bi.en))
    return texts


# ── precision_validator unit behaviour ─────────────────────────────────────────

def test_precision_validator_catches_known_leak_shapes():
    assert precision_validator("Today 72/100 — a good day.")
    assert precision_validator("(பஞ்சாங்க மதிப்பெண்: 55/100)")
    assert precision_validator("careful action (dasha index 40/100)")
    assert precision_validator("Panchangam score: 63")


def test_precision_validator_passes_clean_band_copy():
    assert precision_validator("Today is a good day. Jupiter dasa is active.") == []
    assert precision_validator("தசை ஆதரவு வலுவானது — திட்டமிட்ட செயல்களுக்கு நல்ல நேரம்.") == []


# ── Score-bearing narrative keeps the number regardless of the flag ────────────

def test_flag_off_legacy_strings_keep_scores(bands_off):
    bi = dasha_support_reason("JUPITER", "VENUS", 72)
    assert "(72/100)" in bi.ta and "(72/100)" in bi.en
    bi = panchangam_reason(5, 2, "BAVA", "JUPITER", 63, 10)
    assert "63/100" in bi.ta and "63/100" in bi.en
    bi = gochar_reason(5, 3, None, False, False, 58)
    assert "58/100" in bi.ta and "58/100" in bi.en
    bi = daily_summary(82, "JUPITER", "VENUS", False, None, False, None)
    assert "82/100" in bi.ta and "82/100" in bi.en


def test_flag_on_strings_still_keep_scores(bands_on):
    """D7: bands are additive, not a replacement — the score must survive."""
    bi = dasha_support_reason("JUPITER", "VENUS", 72)
    assert "(72/100)" in bi.ta and "(72/100)" in bi.en
    bi = panchangam_reason(5, 2, "BAVA", "JUPITER", 63, 10)
    assert "63/100" in bi.ta and "63/100" in bi.en
    bi = gochar_reason(5, 3, None, False, False, 58)
    assert "58/100" in bi.ta and "58/100" in bi.en
    bi = daily_summary(82, "JUPITER", "VENUS", False, None, False, None)
    assert "82/100" in bi.ta and "82/100" in bi.en


def test_flag_off_area_reason_keeps_score(bands_off):
    bi = _build_area_reason("CAREER", 74, "JUPITER", 5, "JUPITER", "VENUS", True, False, None)
    assert "(74/100)" in bi.ta and "(74/100)" in bi.en


def test_flag_on_area_reason_keeps_score(bands_on):
    for score in (20, 50, 80):
        bi = _build_area_reason("CAREER", score, "JUPITER", 5, "JUPITER", "VENUS", True, False, None)
        assert f"({score}/100)" in bi.ta and f"({score}/100)" in bi.en
        # The band/level word still carries the judgement alongside the score.
        assert ("strong" in bi.en) or ("moderate" in bi.en) or ("needs attention" in bi.en)


def test_narrative_sweep_is_flag_independent():
    """Same score-bearing copy regardless of reasoning_bands (D7 is additive)."""
    feature_flags.set_flag("reasoning_bands", False)
    off_texts = _narrative_sweep()
    feature_flags.set_flag("reasoning_bands", True)
    on_texts = _narrative_sweep()
    feature_flags.reset_flag("reasoning_bands")
    assert off_texts == on_texts


def _whatif_summary(verdict: str) -> tuple[str, str]:
    natal = _NatalAssessment(score=70, text_ta="x", text_en="x")
    dasha = _DashaAssessment(score=70, maha_lord="JUPITER", antar_lord="VENUS", text_ta="x", text_en="x")
    gochar = _GocharAssessment(score=70, primary_karaka="JUPITER", house_from_moon=5, text_ta="x", text_en="x")
    summary, *_ = _build_summary(
        "job_change", verdict, 72, natal, dasha, gochar, date(2027, 3, 1), False, None
    )
    return summary.ta, summary.en


@pytest.mark.parametrize("verdict", ["FAVOURABLE", "NEUTRAL", "CAUTION"])
def test_flag_on_whatif_summary_keeps_score(bands_on, verdict):
    ta, en = _whatif_summary(verdict)
    assert "(72/100)" in ta and "(72/100)" in en


@pytest.mark.parametrize("verdict", ["FAVOURABLE", "NEUTRAL", "CAUTION"])
def test_flag_off_whatif_summary_keeps_score(bands_off, verdict):
    ta, en = _whatif_summary(verdict)
    assert "(72/100)" in ta and "(72/100)" in en


# ── Band voice (D3/D6): one vocabulary, non-fatalistic ─────────────────────────

def test_band_phrase_covers_every_band_bilingually():
    for band in ALL_BANDS:
        phrase = band_phrase(band)
        assert phrase.ta and phrase.en


def test_band_phrase_unknown_falls_back_to_mixed():
    assert band_phrase("???") == band_phrase("MIXED")


def test_silent_and_blocked_voices_pass_tone_and_precision():
    """SILENT/BLOCKED are epistemic states, not scores — these never carry a
    number, unlike the score-bearing narrative covered above."""
    for text in (SILENT_VOICE.ta, SILENT_VOICE.en, BLOCKED_VOICE.ta, BLOCKED_VOICE.en):
        assert tone_validator(text) == []
        assert precision_validator(text) == []


def test_blocked_voice_redirects_instead_of_dooming():
    assert "redirect" in BLOCKED_VOICE.en.lower()


# ── Marriage: legacy confidence derives from band when the flag is on ──────────

def _golden_marriage_case(name: str):
    import json
    from pathlib import Path

    from app.services.marriage_service import MarriageAssessmentInput

    golden = Path(__file__).resolve().parents[1] / "golden" / "reasoning" / "marriage_promise_gate.json"
    with golden.open(encoding="utf-8") as fh:
        raw = {case["name"]: case for case in json.load(fh)["cases"]}[name]["input"]
    return MarriageAssessmentInput(
        as_of=date(2026, 7, 3),
        lagna_rasi=raw["lagna_rasi"],
        planets_rasi=raw["planets_rasi"],
        active_dasha_lords=set(raw["active_dasha_lords"]),
        transit_jupiter_rasi=raw["transit_jupiter_rasi"],
        transit_venus_rasi=raw["transit_venus_rasi"],
        age=raw["age"],
        marital_status=raw["marital_status"],
        venus_combust=raw["venus_combust"],
        sevvai_dosham_cancelled=raw["sevvai_dosham_cancelled"],
        d9_rasi_by_planet=raw["d9_rasi_by_planet"],
    )


def test_marriage_confidence_derives_from_band_when_flag_on(bands_on):
    from app.reasoning.verdict import Band, band_to_legacy_confidence
    from app.services.marriage_service import assess_marriage_prediction

    result = assess_marriage_prediction(
        _golden_marriage_case("promised_and_timed_marriage"), use_reasoning_gate=True
    )
    assert result.band is not None
    expected = band_to_legacy_confidence(Band(result.band))
    assert result.confidence == expected
