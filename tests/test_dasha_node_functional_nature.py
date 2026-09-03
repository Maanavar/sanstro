"""Node (Rahu/Ketu) mahadasha interpretation text — functional-nature threading.

Audit follow-up (THIRUKANITHAM_DEGREE_ADHIPATHI_AUDIT_2026-07 §0.5): the dasha
interpretation text path in ``dasha_service`` previously never received a
``node_rasi_map``, so a Rahu/Ketu maha/antar dasha always rendered as the
table-default NEUTRAL ("நடுநிலை அதிபதி") even when the node's dispositor made
the period strongly auspicious or malefic. These tests pin the fix: the node's
functional nature now flows through to the rendered Tamil/English text.
"""
from __future__ import annotations

from datetime import date

import pytest

from app.calculations.functional_nature import FunctionalNature
from app.services.dasha_service import (
    _FUNCTIONAL_NATURE_TEXT,
    _build_dasha_interpretation,
    _dasha_transition_note,
)

pytestmark = pytest.mark.no_db

# Rishabam (Rishaba) lagna = rasi 2. Saturn is the YOGAKARAKA (owns 9th+10th).
# Kumbam = rasi 11 is ruled by Saturn, and sits in the 10th from this lagna
# (a kendra, not a dusthana) — so a node there inherits Saturn's yogakaraka nature.
_LAGNA_RISHABAM = 2
_RAHU_IN_KUMBAM = {"RAHU": 11}

# Mesha = rasi 1 sits in the 12th (a dusthana) from Rishabam lagna, so a node
# there is a functional malefic regardless of its dispositor.
_RAHU_IN_MESHA = {"RAHU": 1}

_NEUTRAL_TA = _FUNCTIONAL_NATURE_TEXT[FunctionalNature.NEUTRAL][0]
_YOGAKARAKA_TA = _FUNCTIONAL_NATURE_TEXT[FunctionalNature.YOGAKARAKA][0]
_YOGAKARAKA_EN = _FUNCTIONAL_NATURE_TEXT[FunctionalNature.YOGAKARAKA][1]
_DUSTHANA_TA = _FUNCTIONAL_NATURE_TEXT[FunctionalNature.DUSTHANA][0]


def test_node_maha_without_map_still_reads_neutral() -> None:
    """Legacy behaviour is preserved when no chart context is supplied."""
    interp = _build_dasha_interpretation("RAHU", _LAGNA_RISHABAM)
    assert _NEUTRAL_TA in interp.natural_domain_ta
    assert "Neutral" in interp.natural_domain_en


def test_node_maha_inherits_dispositor_yogakaraka_nature() -> None:
    """Rahu maha text reflects its dispositor's yogakaraka nature, not NEUTRAL."""
    interp = _build_dasha_interpretation(
        "RAHU", _LAGNA_RISHABAM, node_rasi_map=_RAHU_IN_KUMBAM
    )
    assert _YOGAKARAKA_TA in interp.natural_domain_ta
    assert _YOGAKARAKA_EN in interp.natural_domain_en
    assert _NEUTRAL_TA not in interp.natural_domain_ta


def test_node_in_dusthana_reads_malefic() -> None:
    """A node occupying a dusthana renders as a functional malefic period."""
    interp = _build_dasha_interpretation(
        "RAHU", _LAGNA_RISHABAM, node_rasi_map=_RAHU_IN_MESHA
    )
    assert _DUSTHANA_TA in interp.natural_domain_ta
    assert "Dusthana" in interp.natural_domain_en


def test_node_maha_lord_in_antardasha_relationship_text() -> None:
    """When the *maha* lord is a node, the antardasha's relationship text uses it."""
    interp = _build_dasha_interpretation(
        "JUPITER",
        _LAGNA_RISHABAM,
        maha_lord="RAHU",
        node_rasi_map=_RAHU_IN_KUMBAM,
    )
    assert _YOGAKARAKA_TA in interp.relationship_to_maha_ta
    assert _YOGAKARAKA_EN in interp.relationship_to_maha_en


def test_transition_note_uses_node_nature() -> None:
    """A node's dispositor-derived nature steers the maha→maha transition note.

    Rahu (yogakaraka via Saturn) → Mars (dusthana for Rishabam) is a benefic→
    malefic handover, which must select the 'challenging phase begins' branch.
    Without the node map, Rahu reads NEUTRAL and the note falls through to the
    generic branch.
    """
    when = date(2030, 1, 1)
    with_map = _dasha_transition_note(
        "RAHU", "MARS", _LAGNA_RISHABAM, when, node_rasi_map=_RAHU_IN_KUMBAM
    )
    without_map = _dasha_transition_note("RAHU", "MARS", _LAGNA_RISHABAM, when)

    assert "சவாலான கட்டம்" in with_map.note_ta
    assert "challenging phase" in with_map.note_en
    assert with_map.note_en != without_map.note_en
