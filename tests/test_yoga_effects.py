"""Coverage guard for the yoga "so what" catalogue.

Fixing the yogas that were missing a plain-language effect is worth little if
the next yoga added to the detectors ships the same way. This test scans the
detector sources for yoga codes and fails if any of them has no entry in
``YOGA_EFFECT`` — so the gap cannot silently reopen.

Scanning the source rather than importing a registry is deliberate: the
detectors have no single registry to import. Codes are variously passed as
``name="X"`` keyword arguments, positional ``YogaResult("X", ...)`` arguments,
and values in lookup tables (``_PANCHA_MAHAPURUSHA``). A regex over the source
catches all three shapes; a hand-maintained list in this file would drift.
"""
from __future__ import annotations

import re
from pathlib import Path

import pytest

from app.calculations.yoga_effects import YOGA_EFFECT, yoga_effect

_CALC_DIR = Path(__file__).resolve().parent.parent / "app" / "calculations"

_DETECTOR_SOURCES = ("_yoga_detect.py", "yogas.py", "_yoga_helpers.py")

# Yoga codes that do not end in _YOGA and so are not caught by the suffix rule.
_NON_SUFFIXED_YOGA_CODES = frozenset({"KALASARPA", "MARANA_KARAKA_STHANA"})

# Doshams carry their own explanation_what/why/how fields and are out of scope
# for this catalogue.
_DOSHAM_SUFFIX = "_DOSHAM"


def _emitted_yoga_codes() -> set[str]:
    codes: set[str] = set()
    for filename in _DETECTOR_SOURCES:
        path = _CALC_DIR / filename
        if not path.exists():
            continue
        source = path.read_text(encoding="utf-8")
        for match in re.findall(r'"([A-Z][A-Z0-9_]{2,})"', source):
            if match.endswith(_DOSHAM_SUFFIX):
                continue
            if match.endswith("_YOGA") or match in _NON_SUFFIXED_YOGA_CODES:
                codes.add(match)
    return codes


@pytest.mark.no_db
def test_scan_finds_the_detectors() -> None:
    """Self-check: a regex that silently matches nothing would make every other
    assertion in this file vacuously pass."""
    codes = _emitted_yoga_codes()
    assert len(codes) >= 20, f"scan found only {len(codes)} yoga codes — regex likely broken"
    # Spot-check one code of each emission shape the scan has to handle.
    assert "GAJA_KESARI_YOGA" in codes, "missed a name= keyword emission"
    assert "SUNAPHA_YOGA" in codes, "missed a positional YogaResult emission"
    assert "HAMSA_YOGA" in codes, "missed a lookup-table emission"
    assert "KALASARPA" in codes, "missed a non-_YOGA-suffixed code"


@pytest.mark.no_db
def test_every_detectable_yoga_has_a_plain_language_effect() -> None:
    missing = sorted(code for code in _emitted_yoga_codes() if code not in YOGA_EFFECT)
    assert not missing, (
        "These yogas can be detected and shown to a user but have no plain-language "
        f"effect in YOGA_EFFECT, so they would render as a name and a score with no "
        f"meaning: {missing}"
    )


@pytest.mark.no_db
def test_no_effect_entry_is_empty_or_untranslated() -> None:
    for code, (ta, en) in YOGA_EFFECT.items():
        assert ta.strip(), f"{code} has no Tamil effect text"
        assert en.strip(), f"{code} has no English effect text"
        assert ta != en, f"{code} has identical ta/en text — one language was not written"


@pytest.mark.no_db
def test_effect_is_one_sentence_and_not_a_mechanism_restatement() -> None:
    """The effect line must say what the yoga *does*, not restate how it forms.
    A mechanism restatement is the exact failure this catalogue exists to fix,
    and its tell is the em-dash-after-name shape used by description_en
    ("Amala Yoga — benefics in the 10th...")."""
    for code, (_ta, en) in YOGA_EFFECT.items():
        readable = code.replace("_", " ").title()
        assert not en.startswith(readable), (
            f"{code} effect text restates the yoga name and mechanism "
            f"({en[:60]!r}) — that belongs in description_en, not here"
        )


@pytest.mark.no_db
def test_effect_text_makes_no_guarantees() -> None:
    """Tone gate: traditional attributions are framed as traditional. A yoga
    must never promise an outcome in someone's life."""
    banned = ("will definitely", "guarantees", "guaranteed", "you will become", "always brings")
    for code, (_ta, en) in YOGA_EFFECT.items():
        lowered = en.lower()
        for phrase in banned:
            assert phrase not in lowered, f"{code} effect text overclaims: contains {phrase!r}"


@pytest.mark.no_db
def test_unknown_code_degrades_quietly() -> None:
    assert yoga_effect("NOT_A_REAL_YOGA") == ("", "")
