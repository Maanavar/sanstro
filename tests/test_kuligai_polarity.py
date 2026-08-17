"""EC-RULING-07 — Kuligai polarity mechanism.

The ruling separates two things and this file keeps them separate too:

* the **mechanism** — Kuligai multiplies rather than harms, so its sign is
  activity-dependent — ships now;
* the **activity table** — which acts it favours — does not, because the
  candidate list came from synthesis rather than a quoted passage.

So these tests assert the seam is live and that the un-populated default is the
safe one, without asserting any classification the source has not confirmed.
"""
from __future__ import annotations

import pytest

from app.calculations.muhurta_engine import SOURCED_ACTIVITIES
from app.data.kuligai_polarity import (
    ADVERSE,
    FAVOURABLE,
    KULIGAI_ACTIVITY_TABLE_UNVERIFIED,
    KULIGAI_GAP,
    KuligaiPolarity,
    polarity_for,
    rejects,
)

pytestmark = pytest.mark.no_db


def test_the_activity_table_ships_empty_and_says_so():
    """Populating these without a verbatim p.152 reading is the exact failure
    mode the ruling names, so the emptiness is the assertion."""
    assert KULIGAI_ACTIVITY_TABLE_UNVERIFIED is True
    assert FAVOURABLE == frozenset()
    assert ADVERSE == frozenset()
    assert "p.152" in KULIGAI_GAP


def test_unspecified_never_rejects():
    """The one part of the ruling that is actionable today: a blanket exclusion
    of Kuligai is itself the defect, so an unclassified activity must not be
    rejected on Kuligai grounds."""
    for activity in sorted(SOURCED_ACTIVITIES):
        assert polarity_for(activity) is KuligaiPolarity.UNSPECIFIED
        assert rejects(activity) is False


def test_unspecified_is_distinct_from_neutralised():
    """"The text settles this as neutral" and "we have no reading" must never
    collapse into the same value — the whole engine turns on that distinction."""
    assert KuligaiPolarity.UNSPECIFIED is not KuligaiPolarity.NEUTRALISED
    assert polarity_for("ANYTHING_AT_ALL") is KuligaiPolarity.UNSPECIFIED


def test_the_mechanism_actually_works_once_a_table_exists(monkeypatch):
    """Drives the classifying branches through a temporary table, so this is a
    wired mechanism rather than dead scaffolding waiting on a data change."""
    from app.data import kuligai_polarity as kp

    monkeypatch.setattr(kp, "FAVOURABLE", frozenset({"GOLD"}))
    monkeypatch.setattr(kp, "ADVERSE", frozenset({"TRAVEL"}))
    monkeypatch.setattr(kp, "NEUTRALISED", frozenset({"EXAM"}))

    assert kp.polarity_for("GOLD") is KuligaiPolarity.FAVOURABLE
    assert kp.polarity_for("TRAVEL") is KuligaiPolarity.ADVERSE
    assert kp.polarity_for("EXAM") is KuligaiPolarity.NEUTRALISED
    # Only ADVERSE rejects — favourable and neutralised must not.
    assert kp.rejects("TRAVEL") is True
    assert kp.rejects("GOLD") is False
    assert kp.rejects("EXAM") is False


def test_activity_lookup_is_case_and_whitespace_insensitive():
    """The picker normalises activity keys upstream, but this module is imported
    directly by other callers and must not depend on that."""
    from app.data import kuligai_polarity as kp

    original = kp.FAVOURABLE
    try:
        kp.FAVOURABLE = frozenset({"GOLD"})
        assert kp.polarity_for("  gold ") is KuligaiPolarity.FAVOURABLE
    finally:
        kp.FAVOURABLE = original
