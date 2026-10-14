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


#: Domains whose labels are a *magnitude*, not a quality verdict, and so have
#: no VerdictRung. The rung exists to keep colour/tone in step with the word;
#: a magnitude's colour is driven by something else, so there is nothing to
#: keep in step. Add to this set only with that reasoning spelled out.
_RUNGLESS_DOMAINS = {
    # F-DSP-01: Sevvai severity (SEVERE / MODERATE / MILD / NONE). The badge
    # that renders it takes its colour from `hasDosham && !isCancelled`, a
    # boolean — never from the severity word — so a rung here would govern
    # nothing. Giving one anyway would also force a wrong mapping: "NONE"
    # means *no dosham*, which is a good outcome, and there is no rung that
    # says "good" without also saying "excellent verdict".
    "dosham_severity",
}


def test_every_phrase_label_has_a_rung() -> None:
    # Every domain label that renders a phrase must also map to a severity rung
    # (so colour/tone parity can never disagree with the word).
    for domain, labels in VERDICT_PHRASE.items():
        if domain in _RUNGLESS_DOMAINS:
            continue
        for label in labels:
            assert verdict_rung(domain, label) is not None, f"{domain}/{label} has no rung"


def test_the_rungless_exemption_is_not_a_blanket() -> None:
    """The exemption above must stay narrow: every domain NOT in it still has
    to satisfy the invariant, and the exempt set must only name domains that
    actually exist. An exemption for a deleted domain silently widens."""
    assert _RUNGLESS_DOMAINS <= set(VERDICT_PHRASE)
    assert len(_RUNGLESS_DOMAINS) < len(VERDICT_PHRASE)


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
