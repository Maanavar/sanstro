"""Phase 3 (D4) — contradiction engine: disagreement is classified, not averaged.

Covers the pure classifier matrix, the bilingual reading voices (tone D6 +
precision D2 clean), and the whatif summary template selection behind the
``reasoning_contradiction`` flag (flag-off output byte-identical).
"""
from datetime import date

import pytest

from app.reasoning.contradiction import Reading, classify
from app.reasoning.promise_gate import GateGrade
from app.reasoning.verdict import Band
from app.services import feature_flags
from app.services.narrative_engine import (
    READING_VOICE,
    active_but_unpromised_voice,
    precision_validator,
    promised_not_now_voice,
    reading_phrase,
    tone_validator,
)
from app.services.whatif_service import (
    _build_summary,
    _DashaAssessment,
    _GocharAssessment,
    _NatalAssessment,
    _overall_verdict,
)

pytestmark = pytest.mark.no_db

ALL_TIMING_BANDS = (None, Band.BLOCKED, Band.SILENT, Band.WEAK, Band.MIXED, Band.LIKELY, Band.STRONG)


@pytest.fixture
def contradiction_on():
    feature_flags.set_flag("reasoning_contradiction", True)
    yield
    feature_flags.reset_flag("reasoning_contradiction")


@pytest.fixture
def contradiction_off():
    # Default flipped ON 2026-07-13 (P0-2) — this fixture is now needed for
    # any test that specifically wants to prove flag-off behaviour.
    feature_flags.set_flag("reasoning_contradiction", False)
    yield
    feature_flags.reset_flag("reasoning_contradiction")


# ── Classifier matrix (plan §Phase 3 sketch + D3/D4 doctrine) ──────────────────

def test_blocked_gate_is_not_promised_regardless_of_timing():
    for timing in ALL_TIMING_BANDS:
        assert classify(GateGrade.BLOCKED, timing) is Reading.NOT_PROMISED


def test_pass_gate_readings():
    assert classify(GateGrade.PASS, Band.STRONG) is Reading.PROMISED_AND_TIMED
    assert classify(GateGrade.PASS, Band.LIKELY) is Reading.PROMISED_AND_TIMED
    assert classify(GateGrade.PASS, Band.MIXED) is Reading.MIXED
    assert classify(GateGrade.PASS, Band.WEAK) is Reading.PROMISED_NOT_NOW
    assert classify(GateGrade.PASS, None) is Reading.MIXED


def test_weak_gate_readings():
    # §15.2 Option B (specialist decision, 2026-07-13): WEAK + active timing
    # is a genuinely different epistemic state from SILENT + active timing —
    # one of the two promise conditions did hold — so it gets its own
    # "partial support" reading instead of ACTIVE_BUT_UNPROMISED's full
    # redirect (which stays reserved for a truly quiet/blocked promise).
    assert classify(GateGrade.WEAK, Band.STRONG) is Reading.PARTIALLY_PROMISED
    assert classify(GateGrade.WEAK, Band.LIKELY) is Reading.PARTIALLY_PROMISED
    assert classify(GateGrade.WEAK, Band.MIXED) is Reading.MIXED
    assert classify(GateGrade.WEAK, Band.WEAK) is Reading.MIXED
    assert classify(GateGrade.WEAK, None) is Reading.MIXED


def test_silent_gate_readings():
    # D4: quiet on promise AND timing → SILENT, never forced into a story.
    assert classify(GateGrade.SILENT, None) is Reading.SILENT
    assert classify(GateGrade.SILENT, Band.WEAK) is Reading.SILENT
    assert classify(GateGrade.SILENT, Band.MIXED) is Reading.MIXED
    # An active period over a quiet promise is a redirect (plan sketch).
    assert classify(GateGrade.SILENT, Band.LIKELY) is Reading.ACTIVE_BUT_UNPROMISED
    assert classify(GateGrade.SILENT, Band.STRONG) is Reading.ACTIVE_BUT_UNPROMISED


def test_classifier_is_total():
    for grade in GateGrade:
        for timing in ALL_TIMING_BANDS:
            assert classify(grade, timing) in Reading


# ── Reading voices: bilingual, tone-clean (D6), precision-clean (D2) ───────────

def test_reading_voice_covers_every_reading_bilingually():
    for reading in Reading:
        voice = READING_VOICE[reading.value]
        assert voice.ta and voice.en


def test_reading_voices_pass_tone_and_precision():
    texts = []
    for reading in Reading:
        voice = READING_VOICE[reading.value]
        texts.extend((voice.ta, voice.en))
    dated = promised_not_now_voice(date(2029, 3, 14))
    redirected = active_but_unpromised_voice(READING_VOICE["MIXED"])
    texts.extend((dated.ta, dated.en, redirected.ta, redirected.en))
    for text in texts:
        assert tone_validator(text) == [], text
        assert precision_validator(text) == [], text


def test_reading_phrase_unknown_falls_back_to_mixed():
    assert reading_phrase("???") == READING_VOICE["MIXED"]


def test_promised_not_now_voice_names_the_window():
    voice = promised_not_now_voice(date(2029, 3, 14))
    assert "14 March 2029" in voice.en
    assert "14-03-2029" in voice.ta
    # No date known → base template, no dangling placeholder.
    base = promised_not_now_voice(None)
    assert base == READING_VOICE["PROMISED_NOT_NOW"]


def test_active_but_unpromised_voice_names_dominant_area():
    class _Label:
        ta = "தொழில்"
        en = "Career"

    voice = active_but_unpromised_voice(_Label())
    assert "career" in voice.en
    assert "தொழில்" in voice.ta
    assert active_but_unpromised_voice(None) == READING_VOICE["ACTIVE_BUT_UNPROMISED"]


# ── Whatif summary template selection (plan §Phase 3 step 2) ───────────────────

def _summary(verdict: str, reading: str | None):
    natal = _NatalAssessment(score=70, text_ta="x", text_en="x")
    dasha = _DashaAssessment(score=70, maha_lord="JUPITER", antar_lord="VENUS", text_ta="x", text_en="x")
    gochar = _GocharAssessment(score=70, primary_karaka="JUPITER", house_from_moon=5, text_ta="x", text_en="x")
    summary, *_ = _build_summary(
        "job_change", verdict, 72, natal, dasha, gochar, date(2027, 3, 1), False, None,
        reading=reading,
    )
    return summary


def test_flag_off_summary_ignores_reading(contradiction_off):
    for reading in (None, "PROMISED_NOT_NOW", "ACTIVE_BUT_UNPROMISED", "PARTIALLY_PROMISED", "NOT_PROMISED"):
        summary = _summary("CAUTION", reading)
        assert summary == _summary("CAUTION", None)


def test_flag_on_promised_not_now_speaks_wait(contradiction_on):
    summary = _summary("CAUTION", "PROMISED_NOT_NOW")
    assert "promised in your chart" in summary.en
    assert "isn't active yet" in summary.en
    assert "வாக்களிக்கப்பட்டுள்ளது" in summary.ta


def test_flag_on_active_but_unpromised_speaks_redirect(contradiction_on):
    summary = _summary("FAVOURABLE", "ACTIVE_BUT_UNPROMISED")
    assert "active period" in summary.en
    assert "direction other than" in summary.en


def test_flag_on_not_promised_speaks_blocked_redirect(contradiction_on):
    summary = _summary("CAUTION", "NOT_PROMISED")
    assert "does not strongly promise" in summary.en
    assert "Redirecting focus" in summary.en


def test_flag_on_aligned_and_mixed_keep_verdict_copy(contradiction_on):
    assert _summary("FAVOURABLE", "PROMISED_AND_TIMED") == _summary("FAVOURABLE", None)
    assert _summary("NEUTRAL", "MIXED") == _summary("NEUTRAL", None)


def test_flag_on_reading_summaries_pass_tone_and_precision(contradiction_on):
    for verdict, reading in (
        ("CAUTION", "PROMISED_NOT_NOW"),
        ("FAVOURABLE", "ACTIVE_BUT_UNPROMISED"),
        ("CAUTION", "NOT_PROMISED"),
    ):
        summary = _summary(verdict, reading)
        for text in (summary.ta, summary.en):
            assert tone_validator(text) == [], text
            assert precision_validator(text) == [], text


# ── Whatif response wiring: reading surfaces only behind the flag ──────────────

def test_overall_verdict_reading_matches_classifier():
    # PASS gate + weak timing → wait; WEAK gate + strong timing → partial promise.
    *_, reading_wait = _overall_verdict(70, 20, 20, 40, use_reasoning_gate=True)
    *_, reading_partial = _overall_verdict(50, 80, 75, 70, use_reasoning_gate=True)
    assert reading_wait == Reading.PROMISED_NOT_NOW.value
    assert reading_partial == Reading.PARTIALLY_PROMISED.value
