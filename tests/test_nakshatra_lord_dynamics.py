"""Nakshatra lord dynamics — the star lord's colouring of its occupant."""
from __future__ import annotations

import pytest

from app.calculations.dasha import NAK_LORD
from app.calculations.nakshatra_lord_dynamics import (
    _LORD_HOUSE_COLOUR,
    nakshatra_lord,
    nakshatra_lord_note,
)


@pytest.mark.no_db
def test_lord_table_is_the_vimshottari_table_not_a_copy() -> None:
    """A second hand-maintained 27-star lord table is exactly the drift risk
    this module exists to remove."""
    for nakshatra in range(1, 28):
        assert nakshatra_lord(nakshatra) == NAK_LORD[nakshatra]


@pytest.mark.no_db
def test_sadayam_is_rahu_ruled() -> None:
    """Spot-check against a known correspondence: Sadayam (Shatabhisha, 24) is
    ruled by Rahu."""
    assert nakshatra_lord(24) == "RAHU"


@pytest.mark.no_db
def test_every_house_has_colour_copy() -> None:
    for house in range(1, 13):
        ta, en = _LORD_HOUSE_COLOUR[house]
        assert ta.strip() and en.strip(), f"house {house} has no colour copy"


@pytest.mark.no_db
def test_note_names_both_the_star_lord_and_its_house() -> None:
    """The whole point is the lord's *placement* — naming the lord alone is
    what the chart already did."""
    _ta, en = nakshatra_lord_note("MERCURY", 24, "Sadayam", 11)
    assert "Rahu" in en
    assert "Sadayam" in en
    assert "house 11" in en


@pytest.mark.no_db
def test_demanding_lord_house_adds_a_note_of_care() -> None:
    _ta, gentle = nakshatra_lord_note("MERCURY", 24, "Sadayam", 11)
    _ta2, demanding = nakshatra_lord_note("MERCURY", 24, "Sadayam", 8)
    assert "patience" in demanding.lower()
    assert "patience" not in gentle.lower()


@pytest.mark.no_db
def test_planet_in_its_own_nakshatra_is_not_described_as_linked() -> None:
    """Sun rules Kirthigai; a self-ruled planet has no external modifier and the
    copy must not imply one."""
    assert nakshatra_lord(3) == "SUN"
    _ta, en = nakshatra_lord_note("SUN", 3, "Kirthigai", 5)
    assert "own nakshatra" in en
    assert "ruled by Sun" not in en


@pytest.mark.no_db
def test_unplotted_lord_states_linkage_without_claiming_direction() -> None:
    """With no house for the lord, the note may name the link but must not
    invent a placement."""
    _ta, en = nakshatra_lord_note("MERCURY", 24, "Sadayam", None)
    assert "Rahu" in en
    assert "house" not in en.lower()


@pytest.mark.no_db
def test_note_is_bilingual_for_every_nakshatra() -> None:
    for nakshatra in range(1, 28):
        for house in (None, 1, 6, 12):
            ta, en = nakshatra_lord_note("MERCURY", nakshatra, "Star", house)
            assert ta.strip(), f"nakshatra {nakshatra} house {house} has no Tamil note"
            assert en.strip(), f"nakshatra {nakshatra} house {house} has no English note"
