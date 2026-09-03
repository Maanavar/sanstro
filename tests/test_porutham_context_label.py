"""Regression locks for _contextualize_porutham_result (2026-07 porutham audit).

Every dashboard porutham surface (family porutham tab, Tools compare, share
links, compare PDFs) shapes compute_porutham() output through this helper. It
used to re-derive the label from percentage alone (>=80 EXCELLENT), which
(a) dropped the A-4 Rajju/Vedha -> CAUTION veto downgrade the engine applies at
the source, and (b) graded 8/10 as EXCELLENT while the engine (and the by-star
marketing tool) say GOOD. MARRIAGE must pass the engine label through verbatim;
masked contexts grade on the engine's own 90/70/50 rungs and still force
CAUTION when a selected veto kuta (Rajju/Vedha) fails.
"""
from __future__ import annotations

import pytest

pytestmark = pytest.mark.no_db

from app.calculations.porutham import compute_porutham
from app.services.synastry_service import (
    _contextualize_porutham_result,
    _label_for_percentage,
)


def test_marriage_rajju_veto_downgrade_survives_contextualizer():
    # Aswini(1) x Magam(10): same Rajju group -> engine forces CAUTION (A-4).
    result = compute_porutham(boy_nakshatra=1, girl_nakshatra=10, boy_rasi=1, girl_rasi=5)
    assert result.rajju_dosha is True
    assert result.label == "CAUTION"
    shaped = _contextualize_porutham_result(result, "MARRIAGE")
    assert shaped["rajju_dosha"] is True
    assert shaped["label"] == "CAUTION"


def test_marriage_label_always_matches_engine_label():
    # MARRIAGE selects all 10 kutas, so the shaped label/score/percentage must
    # be exactly the engine's own — sweep a spread of star pairs to lock it.
    for boy_nak in range(1, 28, 5):
        for girl_nak in range(1, 28, 3):
            result = compute_porutham(
                boy_nakshatra=boy_nak,
                girl_nakshatra=girl_nak,
                boy_rasi=(boy_nak - 1) % 12 + 1,
                girl_rasi=(girl_nak - 1) % 12 + 1,
            )
            shaped = _contextualize_porutham_result(result, "MARRIAGE")
            assert shaped["label"] == result.label, (boy_nak, girl_nak)
            assert shaped["total_score"] == result.total_score, (boy_nak, girl_nak)
            assert shaped["percentage"] == result.percentage, (boy_nak, girl_nak)


def test_friendship_context_vedha_veto_forces_caution():
    # Aswini(1) x Kettai(18) is a Vedha pair; Vedha is in the FRIENDSHIP mask,
    # so the veto must cap the context label too.
    result = compute_porutham(boy_nakshatra=1, girl_nakshatra=18, boy_rasi=1, girl_rasi=8)
    shaped = _contextualize_porutham_result(result, "FRIENDSHIP")
    assert shaped["vedha_dosha"] is True
    assert shaped["label"] == "CAUTION"


def test_percentage_rungs_match_engine_thresholds():
    assert _label_for_percentage(100) == "EXCELLENT"
    assert _label_for_percentage(90) == "EXCELLENT"
    assert _label_for_percentage(80) == "GOOD"      # was EXCELLENT pre-audit
    assert _label_for_percentage(70) == "GOOD"
    assert _label_for_percentage(60) == "AVERAGE"   # was GOOD pre-audit
    assert _label_for_percentage(50) == "AVERAGE"
    assert _label_for_percentage(40) == "CAUTION"   # was AVERAGE pre-audit
    assert _label_for_percentage(0) == "CAUTION"
