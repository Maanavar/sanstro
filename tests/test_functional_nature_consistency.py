"""Guard: the four functional-nature weight tables must keep one agreed ranking.

Audit C5 (docs/THIRUKANITHAM_ENGINE_AUDIT_2026-07-23.md). The concept "how good
is this planet functionally for this lagna" is encoded FOUR separate times:
  - functional_nature.FUNCTIONAL_DASHA_MODIFIER   (dasha multiplier)
  - functional_nature.FUNCTIONAL_TRANSIT_MODIFIER (transit multiplier)
  - prediction_score._FN_DASHA_SCORE              (prediction L3 additive)
  - chart_strength.FUNCTIONAL_STRENGTH_DELTA      (natal strength delta)
They are aligned by hand with no cross-check, so a future edit to one could
silently invert a tier in one surface but not the others. This test pins the
ranking all four ALREADY agree on, so such a desync fails loudly.

Known ambiguous middle (deliberately NOT pinned — a genuine doctrinal choice,
not a bug, pending astrologer sign-off): KENDRA vs NEUTRAL disagree today —
_FN_DASHA_SCORE ranks KENDRA above NEUTRAL, while the other three rank NEUTRAL
above KENDRA (kendradhipati dosha treats a benefic kendra-lord as mildly
malefic). MARAKA vs UPACHAYA is a near-tie (equal in the transit table). Both
pairs are excluded from the strict assertions below.
"""
from __future__ import annotations

import pytest

from app.calculations.chart_strength import FUNCTIONAL_STRENGTH_DELTA
from app.calculations.functional_nature import (
    FUNCTIONAL_DASHA_MODIFIER,
    FUNCTIONAL_TRANSIT_MODIFIER,
    FunctionalNature,
)
from app.calculations.prediction_score import _FN_DASHA_SCORE

pytestmark = pytest.mark.no_db


def _weight(table, nature: str) -> float:
    """Read a nature's weight whether the table is enum-keyed or str-keyed."""
    for key, val in table.items():
        if getattr(key, "value", key) == nature:
            return float(val)
    raise KeyError(f"{nature} missing from table")


_TABLES = [
    ("FUNCTIONAL_DASHA_MODIFIER", FUNCTIONAL_DASHA_MODIFIER),
    ("FUNCTIONAL_TRANSIT_MODIFIER", FUNCTIONAL_TRANSIT_MODIFIER),
    ("_FN_DASHA_SCORE", _FN_DASHA_SCORE),
    ("FUNCTIONAL_STRENGTH_DELTA", FUNCTIONAL_STRENGTH_DELTA),
]

# (hi, lo): every table must weight hi strictly above lo.
_AGREED_STRICT = [
    ("YOGAKARAKA", "LAGNA_LORD"),
    ("LAGNA_LORD", "TRIKONA"),
    ("TRIKONA", "KENDRA"),
    ("TRIKONA", "NEUTRAL"),
    ("KENDRA", "UPACHAYA"),
    ("KENDRA", "MARAKA"),
    ("KENDRA", "DUSTHANA"),
    ("NEUTRAL", "UPACHAYA"),
    ("NEUTRAL", "MARAKA"),
    ("NEUTRAL", "DUSTHANA"),
    ("UPACHAYA", "DUSTHANA"),
    ("MARAKA", "DUSTHANA"),
]

# (hi, lo): every table must weight hi >= lo (transit ties UPACHAYA == MARAKA).
_AGREED_WEAK = [
    ("UPACHAYA", "MARAKA"),
]


@pytest.mark.parametrize("name,table", _TABLES)
@pytest.mark.parametrize("hi,lo", _AGREED_STRICT)
def test_functional_weight_strict_ordering(name, table, hi, lo):
    assert _weight(table, hi) > _weight(table, lo), f"{name}: {hi} !> {lo}"


@pytest.mark.parametrize("name,table", _TABLES)
@pytest.mark.parametrize("hi,lo", _AGREED_WEAK)
def test_functional_weight_weak_ordering(name, table, hi, lo):
    assert _weight(table, hi) >= _weight(table, lo), f"{name}: {hi} < {lo}"


def test_every_table_weights_every_nature():
    """No table may omit a functional nature (a missing key defaults silently)."""
    for _name, table in _TABLES:
        for nature in FunctionalNature:
            _weight(table, nature.value)  # raises KeyError if absent
