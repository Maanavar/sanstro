"""The briefing's spoken leads: the Moon's, and the Saturn cycle's backdrop.

The Moon lead must say the read, not the coordinates.

`moon_transit_reason` opens with rasi / nakshatra / house-from-birth-sign and
only then interprets. That order is right for the "Why this prediction?" tile,
where showing the working is the point — but the briefing synthesizer keeps each
fragment's *lead clause*, so inside the hero the coordinates survived and the
interpretation was the half that got cut. The reader met "Moon is in Anusham,
Viruchigam (Scorpio), house 12 from birth sign." and nothing they could act on.

`moon_spoken` is the RP-10 "spoken lead" for that slot, matching what
`panchangam_spoken` / `gochar_spoken` already do for theirs.
"""
from __future__ import annotations

import re

import pytest

from app.services.narrative_engine import (
    _NAK_QUALITY,
    _SANI_CYCLE_BACKGROUND,
    _SANI_CYCLE_WARN,
    dasha_spoken,
    gochar_spoken,
    moon_spoken,
    moon_transit_reason,
    sani_cycle_background,
)

pytestmark = pytest.mark.no_db

# Anusham(18) in Viruchigam(8), 12th from a Dhanusu(9) birth sign — the exact
# case reported on the dashboard hero.
_ANUSHAM, _JANMA_NAK, _VIRUCHIGAM, _DHANUSU = 17, 5, 8, 9


def test_tile_variant_still_leads_with_the_coordinates() -> None:
    """Guards the split: the astrologer-facing tile keeps its working."""
    tile = moon_transit_reason(_ANUSHAM, _JANMA_NAK, False, _VIRUCHIGAM, _DHANUSU, 60)
    assert "Anusham" in tile.en
    assert "house 12 from birth sign" in tile.en


@pytest.mark.parametrize("moon_score", [20, 44, 55, 70, 95])
@pytest.mark.parametrize("chandrashtama", [True, False])
def test_spoken_lead_prints_no_coordinates(moon_score: int, chandrashtama: bool) -> None:
    spoken = moon_spoken(_ANUSHAM, _JANMA_NAK, chandrashtama, moon_score)
    for lang in (spoken.en, spoken.ta):
        assert "Anusham" not in lang
        assert "Viruchigam" not in lang
        assert "Scorpio" not in lang
        # No bare house/rasi index anywhere — that number is the tile's job.
        assert not re.search(r"\bhouse \d+", lang)


def test_spoken_lead_carries_the_days_quality_so_it_changes_daily() -> None:
    """The Moon crosses a new star roughly every day; the line must follow it.

    This is what stops the hero reading as the same sentence every morning.
    """
    seen = {
        moon_spoken(nak, _JANMA_NAK, False, 70).en
        for nak in range(1, 28)
        if nak != _JANMA_NAK
    }
    assert len(seen) == 26, "each nakshatra should give the day its own wording"
    assert _NAK_QUALITY[_ANUSHAM].en in moon_spoken(_ANUSHAM, _JANMA_NAK, False, 70).en


def test_chandrashtama_and_janma_star_get_their_own_reads() -> None:
    chandra = moon_spoken(_ANUSHAM, _JANMA_NAK, True, 30)
    assert "Chandrashtama" in chandra.en

    janma = moon_spoken(_JANMA_NAK, _JANMA_NAK, False, 55)
    assert "birth star" in janma.en
    assert janma.en != chandra.en


# ── Saturn cycle backdrop ─────────────────────────────────────────────────────
# A flag has to name its cause *and* its scope. The tile-facing `_SANI_CYCLE_WARN`
# text is written in today register because the "Why this prediction?" heading
# above it supplies the scope; dropped into the briefing beside "a steady day" it
# read as a forecast for the next few hours — and a Sani cycle runs 2½ to 7½
# years, so that alarm would lead the hero every morning for years.

_SPAN_WORDS = ("years-long", "months-long", "long phase", "long stretch", "closing stretch")


@pytest.mark.parametrize("cycle_type", sorted(_SANI_CYCLE_WARN))
def test_every_warn_cycle_has_a_backdrop_phrasing(cycle_type: str) -> None:
    """No cycle may reach the briefing with only its today-register warn text."""
    assert sani_cycle_background(cycle_type) is not None


@pytest.mark.parametrize("cycle_type", sorted(_SANI_CYCLE_BACKGROUND))
def test_backdrop_clause_names_both_cause_and_span(cycle_type: str) -> None:
    clause = _SANI_CYCLE_BACKGROUND[cycle_type]
    assert "Sani" in clause.en, "the cause must be named"
    assert any(w in clause.en for w in _SPAN_WORDS), "the span must be named"


def test_backdrop_clause_is_shorter_than_the_tile_warn_is_alarming() -> None:
    """It is the one line that won't change tomorrow, so it must not dominate.

    Kept to a single short sentence; if it grows past this it starts competing
    with the day-varying signals it is only meant to scope.
    """
    for cycle_type, clause in _SANI_CYCLE_BACKGROUND.items():
        assert len(clause.en) <= 110, f"{cycle_type} backdrop clause is too long"


def test_no_running_cycle_yields_no_clause() -> None:
    assert sani_cycle_background(None) is None
    assert sani_cycle_background("NOT_A_REAL_CYCLE") is None


# ── Impossible-state check ────────────────────────────────────────────────────

def test_janma_nakshatra_and_chandrashtama_cannot_co_occur() -> None:
    """Not a copy rule — a geometric fact, so the briefing need never merge them.

    Chandrashtamam is the Moon in the 8th *rasi* from the natal Moon's rasi; the
    janma nakshatra sits, by construction, in that natal rasi. A nakshatra spans
    13°20', so it can touch at most two *adjacent* rasis — never two 7 apart.
    The pair is unreachable, and `moon_spoken` tests Chandrashtamam first so a
    bad input degrades to the safer read rather than the celebratory one.
    """
    span = 360 / 27
    for nak in range(1, 28):
        lo, hi = (nak - 1) * span, nak * span - 1e-9
        rasis = {int(lo // 30) + 1, int(hi // 30) + 1}
        assert max(rasis) - min(rasis) <= 1, f"nakshatra {nak} spans non-adjacent rasis"

    # And if the impossible pair is ever forced in, Chandrashtamam still wins.
    forced = moon_spoken(_JANMA_NAK, _JANMA_NAK, True, 20)
    assert "Chandrashtama" in forced.en
    assert "birth star" not in forced.en


# ── Transit lead ──────────────────────────────────────────────────────────────

@pytest.mark.parametrize("jup_house", range(1, 13))
@pytest.mark.parametrize("sat_house", [1, 3, 5, 8, 11])
def test_transit_lead_prints_no_house_numbers(jup_house: int, sat_house: int) -> None:
    """"Jupiter in house 5" is the same coordinates-without-a-read as the Moon's."""
    spoken = gochar_spoken(jup_house, sat_house, None, False, 55)
    assert not re.search(r"\bhouse \d+", spoken.en)
    assert not re.search(r"\d+ஆம் இடத்தில்", spoken.ta)


# ── Dasha lead ────────────────────────────────────────────────────────────────

def test_reduced_dasha_lead_actually_states_the_caution() -> None:
    """The old lead clause was "You are currently in the Saturn dasa." — no warning.

    That only became load-bearing once a lone caution could be promoted into the
    second slot: the synthesizer surfaced the signal and printed nothing about it.
    """
    low = dasha_spoken("SATURN", 18)
    assert "running low" in low.en
    assert "consolidating" in low.en

    strong = dasha_spoken("SATURN", 82)
    assert "behind you" in strong.en
    assert strong.en != low.en


def test_dasha_lead_reads_its_quality_list_as_prose() -> None:
    # "brings duty, discipline, endurance to the fore" is missing its conjunction.
    assert "duty, discipline, and endurance" in dasha_spoken("SATURN", 82).en
