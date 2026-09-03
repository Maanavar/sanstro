"""Phase 5 — chart signature + root-cause chain copy (narrative_engine).

Covers the bilingual framing voice per motif (tone D6 + precision D2 clean)
and the causal-chain formatting helper.
"""
import pytest

from app.reasoning.chart_signature import MOTIF
from app.services.narrative_engine import (
    SIGNATURE_VOICE,
    precision_validator,
    render_causal_chain,
    signature_framing,
    tone_validator,
)

pytestmark = pytest.mark.no_db


class _Bi:
    def __init__(self, ta: str, en: str) -> None:
        self.ta = ta
        self.en = en


def test_every_motif_has_a_bilingual_framing():
    for motif in MOTIF.values():
        voice = SIGNATURE_VOICE[motif]
        assert voice.ta and voice.en


def test_signature_framings_pass_tone_and_precision():
    for voice in SIGNATURE_VOICE.values():
        assert tone_validator(voice.ta) == [], voice.ta
        assert tone_validator(voice.en) == [], voice.en
        assert precision_validator(voice.ta) == [], voice.ta
        assert precision_validator(voice.en) == [], voice.en


def test_signature_framing_unknown_motif_falls_back():
    assert signature_framing("???") == SIGNATURE_VOICE["wisdom_and_growth"]


def test_signature_framing_known_motif_matches_table():
    assert signature_framing("delay_then_reward") == SIGNATURE_VOICE["delay_then_reward"]


def test_render_causal_chain_joins_steps_and_conclusion():
    steps = [_Bi("காரணம் ஒன்று", "reason one"), _Bi("காரணம் இரண்டு", "reason two")]
    conclusion = _Bi("முடிவு", "conclusion")
    chain = render_causal_chain(steps, conclusion)
    assert "reason one" in chain.en and "reason two" in chain.en and "conclusion" in chain.en
    # RP-09: spoken prose, never an arrow chain.
    assert "→" not in chain.en and "→" not in chain.ta
    assert chain.en.index("reason one") < chain.en.index("reason two") < chain.en.index("conclusion")
    assert "காரணம் ஒன்று" in chain.ta and "முடிவு" in chain.ta


def test_render_causal_chain_with_no_steps_returns_conclusion_only():
    conclusion = _Bi("முடிவு", "conclusion")
    chain = render_causal_chain([], conclusion)
    assert chain.ta == "முடிவு"
    assert chain.en == "conclusion"


def test_render_causal_chain_passes_tone_and_precision():
    steps = [
        _Bi("சூரியன் 5ஆம் இடத்தில் உள்ளது", "the Sun is in house 5"),
        _Bi("சனி தசை நடுநிலை", "the Saturn dasha is neutral"),
    ]
    conclusion = _Bi("கவனம் தேவை", "needs attention")
    chain = render_causal_chain(steps, conclusion)
    assert tone_validator(chain.ta) == []
    assert tone_validator(chain.en) == []
    assert precision_validator(chain.ta) == []
    assert precision_validator(chain.en) == []
