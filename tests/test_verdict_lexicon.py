"""Golden test for the shared Tamil verdict lexicon (C-5).

Locks in the cross-surface guarantee: the same quality rung renders the same
Tamil verdict word family on every customer-facing surface (daily, prediction,
synastry, porutham), even though each domain keeps its own tier count.
"""
from __future__ import annotations

import pytest

from app.calculations.verdict_lexicon import (
    VERDICT_PHRASE,
    VERDICT_ROOT_TA,
    VerdictRung,
    verdict_phrase,
    verdict_rung,
)

pytestmark = pytest.mark.no_db


def test_every_phrase_label_has_a_rung() -> None:
    # Every domain label that renders a phrase must also map to a severity rung
    # (so colour/tone parity can never disagree with the word).
    for domain, labels in VERDICT_PHRASE.items():
        for label in labels:
            assert verdict_rung(domain, label) is not None, f"{domain}/{label} has no rung"


def test_shared_root_is_consistent_across_surfaces() -> None:
    # The EXCELLENT rung's adjective root appears on every surface that has a
    # top tier; the CAUTION rung is identical everywhere.
    excellent_root = VERDICT_ROOT_TA[VerdictRung.EXCELLENT]  # மிகச் சிறந்த
    caution_word = VERDICT_ROOT_TA[VerdictRung.CAUTION]      # கவனம் தேவை

    # Daily STRONG_SUPPORT and Porutham EXCELLENT both lead with the same root.
    assert verdict_phrase("daily", "STRONG_SUPPORT", "ta").startswith(excellent_root)
    assert verdict_phrase("porutham", "EXCELLENT", "ta").startswith(excellent_root)

    # The caution word is byte-identical on every surface that has that rung.
    for domain, label in (("daily", "CAUTION"), ("porutham", "CAUTION"), ("synastry", "CAREFUL")):
        assert verdict_phrase(domain, label, "ta") == caution_word


def test_good_rung_shares_the_good_root() -> None:
    good_root = VERDICT_ROOT_TA[VerdictRung.GOOD]  # நல்ல
    for domain, label in (("daily", "GOOD"), ("porutham", "GOOD"), ("synastry", "SUPPORTIVE")):
        assert verdict_phrase(domain, label, "ta").startswith(good_root)


def test_restorative_keeps_its_own_word() -> None:
    # RESTORATIVE sits on the CAUTION severity rung but shows its own honest word.
    assert verdict_rung("daily", "RESTORATIVE") is VerdictRung.CAUTION
    assert verdict_phrase("daily", "RESTORATIVE", "ta") == "ஓய்வு நாள்"


def test_unmapped_domain_returns_none() -> None:
    # Prediction carries its verdict inside full sentences, not a phrase slot.
    assert verdict_phrase("prediction", "EXCEPTIONAL", "ta") is None
    assert verdict_phrase("daily", "NOT_A_LABEL", "ta") is None


def test_synastry_summary_is_tamil_script_not_romanized() -> None:
    # Regression for the romanized-Tamil bug fixed alongside C-5.
    from app.calculations.verdict_lexicon import verdict_phrase as vp

    for label in ("SUPPORTIVE", "MIXED", "CAREFUL"):
        ta = vp("synastry", label, "ta")
        assert ta and any("஀" <= ch <= "௿" for ch in ta), f"{label} not Tamil script"
