from __future__ import annotations

import pytest

from app.calculations.life_area_prediction_models import BiText
from app.services import marriage_service as svc

pytestmark = pytest.mark.no_db


def _scored(
    score: int,
    *,
    supports: tuple[str, ...] = (),
    challenges: tuple[str, ...] = (),
) -> svc._MarriageScore:
    return svc._MarriageScore(
        score=score,
        factors=[],
        supports=[BiText(ta=f"ஆதரவு {item}", en=f"Support {item}") for item in supports],
        challenges=[BiText(ta=f"சவால் {item}", en=f"Challenge {item}") for item in challenges],
        dasha_support="WEAK",
        transit_support="WEAK",
    )


def _narrate(
    scored: svc._MarriageScore,
    *,
    gate=None,
    band=None,
    married: bool = False,
    reasoning_bands: bool = False,
    signature: bool = False,
) -> svc._MarriageNarration:
    return svc._narrate_marriage_prediction(
        scored,
        gate=gate,
        band_enum=band,
        married_harmony_mode=married,
        reasoning_bands=reasoning_bands,
        reasoning_chart_signature=signature,
    )


@pytest.mark.parametrize(
    ("score", "confidence"),
    ((70, "HIGH"), (69, "MEDIUM"), (50, "MEDIUM"), (49, "LOW")),
)
def test_timing_copy_keeps_the_seventy_and_fifty_boundaries(score: int, confidence: str) -> None:
    assert _narrate(_scored(score)).confidence == confidence


@pytest.mark.parametrize(
    ("score", "confidence"),
    ((70, "HIGH"), (69, "MEDIUM"), (50, "MEDIUM"), (49, "LOW")),
)
def test_married_copy_keeps_the_seventy_and_fifty_boundaries(score: int, confidence: str) -> None:
    assert _narrate(_scored(score), married=True).confidence == confidence


def test_married_mode_uses_harmony_copy() -> None:
    timing = _narrate(_scored(70, supports=("one",)))
    married = _narrate(_scored(70, supports=("one",)), married=True)

    assert timing.main_prediction_en.startswith("The current phase appears supportive")
    assert married.main_prediction_en.startswith("Your marital bond appears strong")


def test_copy_uses_only_the_first_two_evidence_lines() -> None:
    result = _narrate(_scored(70, supports=("one", "two", "three")))

    assert "Support one; Support two" in result.main_prediction_en
    assert "Support three" not in result.main_prediction_en


def test_reasoning_band_can_replace_the_legacy_score_confidence() -> None:
    gate = svc.assess_promise(
        bhava_lord_house=1,
        bhava_lord_afflicted=False,
        karaka_dignity_d1="OWN",
        karaka_dignity_varga="OWN",
        karaka_available=True,
    )
    result = _narrate(
        _scored(70),
        gate=gate,
        band=svc.Band.MIXED,
        reasoning_bands=True,
    )

    assert gate.grade is svc.GateGrade.PASS
    assert result.band == "MIXED"
    assert result.confidence == "MEDIUM"


def test_band_is_recorded_but_score_confidence_kept_when_band_flag_is_off() -> None:
    gate = svc.assess_promise(
        bhava_lord_house=1,
        bhava_lord_afflicted=False,
        karaka_dignity_d1="OWN",
        karaka_dignity_varga="OWN",
        karaka_available=True,
    )
    with_gate = _narrate(_scored(70), gate=gate, band=svc.Band.MIXED, reasoning_bands=False)
    without_gate = _narrate(_scored(70))

    assert (with_gate.band, with_gate.confidence) == ("MIXED", "HIGH")
    assert (without_gate.band, without_gate.confidence) == (None, "HIGH")


def test_weak_promise_caps_legacy_confidence_at_medium() -> None:
    gate = svc.assess_promise(
        bhava_lord_house=1,
        bhava_lord_afflicted=False,
        karaka_dignity_d1="DEBILITATED",
        karaka_dignity_varga="DEBILITATED",
        karaka_available=True,
    )
    result = _narrate(
        _scored(90),
        gate=gate,
        band=svc.Band.LIKELY,
        reasoning_bands=True,
    )

    assert gate.grade is svc.GateGrade.WEAK
    assert result.band == "LIKELY"
    assert result.confidence == "MEDIUM"


def test_causal_chain_is_only_built_for_low_confidence() -> None:
    low = _narrate(_scored(49, challenges=("one", "two")), signature=True)
    low_flag_off = _narrate(_scored(49, challenges=("one",)), signature=False)
    high = _narrate(_scored(70, challenges=("one",)), signature=True)

    assert low.causal_chain is not None
    assert low_flag_off.causal_chain is None
    assert high.causal_chain is None
