"""The `YOG-01` split must stay honest: one auditable rule row per yoga.

The 2026-08-27 astrologer review refused to sign the yoga block because twenty
detector functions and thirty emitted yoga codes sat behind a single rulebook
ID. `app/calculations/yoga_rules.py` is the split. This file is what stops it
rotting back into a blanket claim:

* every yoga code the detectors can emit has a rule row (a new yoga cannot ship
  unaudited),
* every rule row names a code the detectors actually emit (no phantom rows
  describing yogas the engine does not have),
* every rule ID reaches both reviewer-facing documents,
* the activation table is keyed on the codes the detectors emit — the defect the
  split uncovered, where nine yogas looked up a near-miss name, matched nothing,
  and were capped at the dormant rung whatever dasha ran.

The emitted-code scan reads the detector *sources* rather than importing a list,
for the same reason `test_yoga_effects.py` does: codes are passed as `name="X"`
keywords, as positional `YogaResult("X", ...)` arguments, and as values in
lookup tables, so no single importable list exists upstream of the registry.
"""
from __future__ import annotations

import re
from pathlib import Path

import pytest

from app.calculations._yoga_helpers import YogaResult
from app.calculations.yoga_activation import YOGA_KEY_PLANETS, yoga_activation_score
from app.calculations.yoga_rules import (
    LEGAL_MARKERS,
    RETIRED_BLANKET_RULE_ID,
    YOGA_RULE_BY_ID,
    YOGA_RULES,
    activation_key_planets,
    rule_ids_for_yoga,
)

pytestmark = pytest.mark.no_db

REPO_ROOT = Path(__file__).resolve().parent.parent
_CALC_DIR = REPO_ROOT / "app" / "calculations"
_DETECTOR_SOURCES = ("_yoga_detect.py", "yogas.py")

RULEBOOK = REPO_ROOT / "docs" / "VINAADI_ASTROLOGY_RULEBOOK_FOR_EXTERNAL_REVIEW.md"
APPENDIX = REPO_ROOT / "docs" / "VINAADI_RULEBOOK_TABLE_APPENDIX.md"

_RULE_ID_SHAPE = re.compile(r"^YOG-[A-Z]{2,4}-\d{2}$")


def _emitted_yoga_codes() -> set[str]:
    """Every `YogaResult.name` / caution code the detector sources can produce."""
    codes: set[str] = set()
    for filename in _DETECTOR_SOURCES:
        source = (_CALC_DIR / filename).read_text(encoding="utf-8")
        for match in re.findall(r'"([A-Z][A-Z0-9_]{2,})"', source):
            if match.endswith("_YOGA") or match.endswith("_CAUTION"):
                codes.add(match)
    return codes


# ── the scan itself, so nothing below passes vacuously ──────────────────────
def test_scan_finds_the_detectors() -> None:
    codes = _emitted_yoga_codes()
    assert len(codes) >= 30, f"scan found only {len(codes)} codes — regex likely broken"
    assert "GAJA_KESARI_YOGA" in codes, "missed a name= keyword emission"
    assert "SUNAPHA_YOGA" in codes, "missed a positional YogaResult emission"
    assert "HAMSA_YOGA" in codes, "missed a lookup-table emission"
    assert "MOOLAM_CAUTION" in codes, "missed a nakshatra-caution emission"


# ── registry shape ──────────────────────────────────────────────────────────
def test_rule_ids_are_unique_and_well_formed() -> None:
    ids = [rule.rule_id for rule in YOGA_RULES]
    assert len(ids) == len(set(ids)), "duplicate rule ID in YOGA_RULES"
    bad = [rule_id for rule_id in ids if not _RULE_ID_SHAPE.match(rule_id)]
    assert not bad, f"rule IDs must look like YOG-XX-01: {bad}"
    assert RETIRED_BLANKET_RULE_ID not in ids, (
        "YOG-01 is the retired blanket ID and must never be a rule row again"
    )


def test_every_rule_carries_the_fields_a_reviewer_marks() -> None:
    """A row with an empty condition or an empty source is a blanket claim
    wearing a rule ID — exactly what the split exists to remove."""
    for rule in YOGA_RULES:
        assert rule.name_en.strip(), f"{rule.rule_id} has no English name"
        assert rule.markers, f"{rule.rule_id} carries no marker"
        assert set(rule.markers) <= LEGAL_MARKERS, (
            f"{rule.rule_id} uses a marker outside the rulebook vocabulary: {rule.markers}"
        )
        assert rule.present_when.strip(), f"{rule.rule_id} has no presence test"
        assert rule.strength_rule.strip(), f"{rule.rule_id} has no strength rule"
        assert rule.cancellation.strip(), f"{rule.rule_id} has no cancellation field"
        assert rule.source.strip(), f"{rule.rule_id} names no source or absence of one"
        assert rule.detector.strip(), f"{rule.rule_id} names no detector"


def test_a_product_or_variant_rule_explains_the_departure() -> None:
    """`[PRODUCT]` and `[VARIANT]` mean 'we chose this'. A row that claims either
    without saying what was chosen cannot be ruled on."""
    for rule in YOGA_RULES:
        if {"PRODUCT", "VARIANT"} & set(rule.markers):
            assert rule.note.strip(), (
                f"{rule.rule_id} is marked {rule.markers} but names no departure — "
                "a reviewer cannot rule on an undisclosed choice"
            )


# ── registry ↔ code ─────────────────────────────────────────────────────────
def test_every_emitted_yoga_code_has_a_rule_row() -> None:
    registered = {rule.yoga_name for rule in YOGA_RULES if rule.yoga_name}
    missing = sorted(_emitted_yoga_codes() - registered)
    assert not missing, (
        "These yoga codes can reach a reader with no auditable rule row, which is "
        f"the exact gap YOG-01 was refused for: {missing}"
    )


def test_no_rule_row_describes_a_yoga_the_engine_cannot_emit() -> None:
    emitted = _emitted_yoga_codes()
    phantom = sorted(
        rule.rule_id for rule in YOGA_RULES if rule.yoga_name and rule.yoga_name not in emitted
    )
    assert not phantom, f"rule rows describing codes no detector emits: {phantom}"


def test_pancha_mahapurusha_has_five_rules_not_one() -> None:
    """The review named this one specifically: five yogas, five IDs."""
    pmp = [rule for rule in YOGA_RULES if rule.rule_id.startswith("YOG-PMP-")]
    assert len(pmp) == 5, f"expected five Pancha Mahapurusha rules, got {len(pmp)}"
    assert {rule.yoga_name for rule in pmp} == {
        "RUCHAKA_YOGA", "BHADRA_YOGA", "HAMSA_YOGA", "MALAVYA_YOGA", "SASA_YOGA",
    }


def test_raja_yoga_carries_one_row_per_formulation() -> None:
    """"Raja Yoga alone has several" was the review's headline objection. The
    two implemented formulations get a row each, and the ones we do not
    implement get a row saying so."""
    assert rule_ids_for_yoga("RAJA_YOGA") == ("YOG-RY-01", "YOG-RY-02")
    not_implemented = YOGA_RULE_BY_ID["YOG-RY-03"]
    assert not_implemented.yoga_name == "", "YOG-RY-03 records a non-detection"
    assert "LIMIT" in not_implemented.markers


def test_yoga_result_resolves_its_own_rule_ids() -> None:
    result = YogaResult(
        name="GAJA_KESARI_YOGA",
        is_present=True,
        strength="STRONG",
        conditions_met=[],
        cancellation_factors=[],
        dasha_activated=False,
        description_ta="",
        description_en="",
    )
    assert result.rule_ids == ("YOG-GK-01",)
    assert YogaResult(
        name="NOT_A_REAL_YOGA",
        is_present=False,
        strength="WEAK",
        conditions_met=[],
        cancellation_factors=[],
        dasha_activated=False,
        description_ta="",
        description_en="",
    ).rule_ids == ()


# ── the defect the split uncovered ──────────────────────────────────────────
def test_activation_table_is_keyed_on_codes_the_detectors_emit() -> None:
    """The regression guard for the near-miss keys.

    `YOGA_KEY_PLANETS` used to hold `GAJA_KESARI` for a code emitted as
    `GAJA_KESARI_YOGA` and `PANCHA_MAHAPURUSHA_MARS` for a code emitted as
    `RUCHAKA_YOGA`, so nine yogas matched nothing and could never be activated
    by their own dasha lord.
    """
    emitted = _emitted_yoga_codes()
    stray = sorted(key for key in YOGA_KEY_PLANETS if key not in emitted)
    assert not stray, (
        "activation keys that no detector emits — every one of these is a yoga "
        f"silently capped at the dormant rung: {stray}"
    )
    assert YOGA_KEY_PLANETS == activation_key_planets(), (
        "the activation table must be derived from the rule rows, not hand-maintained"
    )


@pytest.mark.parametrize(
    ("yoga_name", "dasha_lord"),
    [
        ("GAJA_KESARI_YOGA", "JUPITER"),
        ("RUCHAKA_YOGA", "MARS"),
        ("BHADRA_YOGA", "MERCURY"),
        ("HAMSA_YOGA", "JUPITER"),
        ("MALAVYA_YOGA", "VENUS"),
        ("SASA_YOGA", "SATURN"),
        ("BUDHA_ADITYA_YOGA", "MERCURY"),
        ("VIPAREETHA_RAJA_YOGA", "SATURN"),
        ("CHANDRA_MANGALA_YOGA", "MARS"),
    ],
)
def test_the_nine_dormant_capped_yogas_now_activate(yoga_name: str, dasha_lord: str) -> None:
    """Each of these was capped at `round(75 * 0.45)` = 34 in its own
    mahadasha. With the key repaired a strong graha lifts it well above that."""
    dormant = yoga_activation_score(
        yoga_name=yoga_name,
        yoga_is_present=True,
        yoga_strength="STRONG",
        mahadasha_lord="__NOBODY__",
        antardasha_lord="__NOBODY__",
        planet_scores={dasha_lord: 80},
    )
    activated = yoga_activation_score(
        yoga_name=yoga_name,
        yoga_is_present=True,
        yoga_strength="STRONG",
        mahadasha_lord=dasha_lord,
        antardasha_lord="__NOBODY__",
        planet_scores={dasha_lord: 80},
    )
    assert dormant == 34, f"{yoga_name} dormant rung moved unexpectedly"
    assert activated > dormant, (
        f"{yoga_name} does not respond to a {dasha_lord} mahadasha — the activation "
        "key has drifted from the emitted code again"
    )


def test_an_absent_yoga_still_scores_zero() -> None:
    assert yoga_activation_score(
        yoga_name="GAJA_KESARI_YOGA",
        yoga_is_present=False,
        yoga_strength="STRONG",
        mahadasha_lord="JUPITER",
        antardasha_lord="MOON",
        planet_scores={"JUPITER": 90},
    ) == 0


# ── registry ↔ documents ────────────────────────────────────────────────────
def test_every_rule_id_reaches_both_reviewer_documents() -> None:
    rulebook = RULEBOOK.read_text(encoding="utf-8")
    appendix = APPENDIX.read_text(encoding="utf-8")
    for rule in YOGA_RULES:
        assert rule.rule_id in rulebook, f"{rule.rule_id} is missing from the rulebook"
        assert rule.rule_id in appendix, f"{rule.rule_id} is missing from the table appendix"


def test_the_rulebook_no_longer_advertises_the_gap_as_open() -> None:
    """The old `YOG-01` line ended "that split is open work, not a claim already
    met." Shipping the split while leaving that sentence would be worse than
    either state on its own."""
    rulebook = RULEBOOK.read_text(encoding="utf-8")
    assert "that split is open work" not in rulebook
    assert "[RETIRED 2026-08-27" in rulebook, "YOG-01 must stay as a retired signpost"
    assert "YOG-ACT-01" in rulebook, "the activation arithmetic needs its own ID"
