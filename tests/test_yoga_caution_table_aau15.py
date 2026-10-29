"""AAU-15 (ruled 2026-10-29): one table of nine inauspicious nitya yogas.

The daily scorer and the day's sentence each carried a six-yoga copy; the
strict muhurtham check had nine. So on a Parigha, Vajra or Vyaghata day Today
was quiet while the muhurtham search refused the day.
"""
from __future__ import annotations

import pytest

from app.calculations.panchangam import ASHUBHA_YOGA_NUMBERS, ASHUBHA_YOGAS, YOGA_NAMES

pytestmark = pytest.mark.no_db


def test_the_table_is_the_nine() -> None:
    assert ASHUBHA_YOGAS == {
        "VISHKAMBHA", "ATIGANDA", "SHOOLA", "GANDA", "VYAGHATA",
        "VAJRA", "VYATIPATA", "PARIGHA", "VAIDHRITI",
    }
    assert {YOGA_NAMES[n - 1] for n in ASHUBHA_YOGA_NUMBERS} == ASHUBHA_YOGAS


def test_every_reader_is_the_same_object() -> None:
    """Identity, not equality: equal copies drift one cell at a time."""
    from app.services._dg_scoring import CAUTION_YOGAS
    from app.services.narrative_engine import _YOGA_CAUTION

    assert CAUTION_YOGAS is ASHUBHA_YOGA_NUMBERS
    assert _YOGA_CAUTION is ASHUBHA_YOGA_NUMBERS


@pytest.mark.parametrize("name", ["VYAGHATA", "VAJRA", "PARIGHA"])
def test_the_three_that_were_missing_now_caution_the_day(name: str) -> None:
    from types import SimpleNamespace

    from app.services._dg_scoring import _yoga_penalty

    span = SimpleNamespace(number=YOGA_NAMES.index(name) + 1, name=name)
    assert _yoga_penalty(span) < 0
