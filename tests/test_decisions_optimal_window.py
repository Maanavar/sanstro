"""D3 regression — the decision brief's "Optimal window" must be computed.

It used to be `target_date + 21 days` for a NEUTRAL verdict and `+ 45 days` for
anything else, selected purely off the verdict string. No planet, no chart, no
ephemeris — a fabricated date rendered to the user under an astrological
heading. It is now the end of the running antardasha — the level this brief's
own dasha pillar is scored on — and when that cannot be computed we name no
date at all.
"""
from __future__ import annotations

import re
from datetime import date, timedelta

import pytest

from app.services.decisions_service import _optimal_window

pytestmark = pytest.mark.no_db

TARGET = date(2026, 6, 15)
SHIFT = (date(2026, 9, 3), "VENUS")


def test_favourable_names_the_date_the_user_asked_about():
    assert _optimal_window(TARGET, "FAVOURABLE", SHIFT) == "around 15 Jun 2026"


def test_neutral_names_the_computed_period_change():
    text = _optimal_window(TARGET, "NEUTRAL", SHIFT)
    assert "03 Sep 2026" in text
    assert "Venus antardasha" in text


def test_caution_names_the_same_boundary_and_asks_for_a_reassessment():
    text = _optimal_window(TARGET, "CAUTION", SHIFT)
    assert text.startswith("reassess from")
    assert "03 Sep 2026" in text


@pytest.mark.parametrize("verdict", ["NEUTRAL", "CAUTION"])
def test_no_date_is_invented_when_the_timeline_is_unavailable(verdict):
    text = _optimal_window(TARGET, verdict, None)
    assert not re.search(r"\d", text), f"a date was fabricated with no timeline: {text!r}"


@pytest.mark.parametrize("verdict", ["NEUTRAL", "CAUTION"])
def test_the_fabricated_offsets_are_gone(verdict):
    """The exact strings the old code produced must no longer be reachable."""
    text = _optimal_window(TARGET, verdict, SHIFT)
    for days in (21, 45):
        assert (TARGET + timedelta(days=days)).strftime("%d %b %Y") not in text
