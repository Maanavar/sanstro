"""EC-RULING-07 — Kuligai polarity, as ruled by the owner on 2026-08-17.

Kuligai **repeats** whatever is begun in it. That single property decides the
sign, and it cuts both ways: buying gold in Kuligai is good (you buy gold again),
marrying in Kuligai is bad (you marry again). Both are the owner's own examples
and are pinned below as the anchors of the whole table.

The discriminator is therefore never "is this act auspicious?" but *does
repeating it ADD to a stock, or does it mean the first one came UNDONE?* — which
is why the samskaras are adverse despite being the most auspicious acts there
are: each is meant to happen once per person.

This file previously asserted the opposite state — an empty table shipped behind
an unverified-source flag. The owner's ruling replaced that, so the assertions
are inverted rather than deleted: the emptiness was never the doctrine, it was
the placeholder for it.
"""
from __future__ import annotations

import pytest

from app.calculations.muhurta_engine import SOURCED_ACTIVITIES
from app.data.kuligai_polarity import (
    ADVERSE,
    FAVOURABLE,
    KULIGAI_ACTIVITY_TABLE_UNVERIFIED,
    KuligaiPolarity,
    favours,
    polarity_for,
    rejects,
)

pytestmark = pytest.mark.no_db


def test_the_owners_two_anchor_cases():
    """The ruling's ground truth. Every other row was reasoned from these two."""
    assert polarity_for("GOLD") is KuligaiPolarity.FAVOURABLE
    assert polarity_for("MARRIAGE") is KuligaiPolarity.ADVERSE


def test_the_table_is_ruled_and_no_longer_ships_as_an_open_gap():
    assert KULIGAI_ACTIVITY_TABLE_UNVERIFIED is False
    assert FAVOURABLE and ADVERSE


def test_no_activity_is_both_favoured_and_adverse():
    """One act cannot both add to a stock and mean the first came undone."""
    assert FAVOURABLE & ADVERSE == frozenset()


def test_every_sourced_activity_has_been_classified():
    """A new sourced activity must not silently arrive with no Kuligai reading.

    UNSPECIFIED is a safe default for rejection, so a gap here would never fail
    anything at runtime — it would just quietly stop asking the question.
    """
    unclassified = sorted(set(SOURCED_ACTIVITIES) - FAVOURABLE - ADVERSE)
    assert unclassified == []


def test_the_one_per_person_samskaras_are_all_adverse():
    """Not because they are inauspicious — because a second one means the first
    did not stand."""
    for samskara in (
        "NAMING_CEREMONY", "ANNAPRASANA", "EAR_BORING", "TONSURE",
        "UPANAYANAM", "SEEMANTHAM", "MARRIAGE",
    ):
        assert polarity_for(samskara) is KuligaiPolarity.ADVERSE, samskara


def test_acquisition_is_favoured_across_the_whole_class():
    """The gold case is a class, not a special case."""
    for acquisition in ("GOLD", "GEMS", "NEW_ORNAMENT", "TREASURE_STORE", "LAND_PURCHASE"):
        assert polarity_for(acquisition) is KuligaiPolarity.FAVOURABLE, acquisition


def test_medical_diverges_from_kalaprakasika_on_purpose():
    """A Kalaprakasika reading lists treatment among Gulika's favoured acts.

    Under the Tamil repetition rule it cannot be — treatment recurring is illness
    recurring — and the owner ruled that Tamil Jothidam governs. Pinned because a
    future reader comparing the two sources will otherwise read it as an error.
    """
    assert polarity_for("MEDICAL") is KuligaiPolarity.ADVERSE


def test_rejects_and_favours_are_the_two_halves_and_never_overlap():
    """A rejection-only model cannot say "prefer this window", which was the
    half of the ruling the blanket exclusion could not express."""
    for activity in sorted(SOURCED_ACTIVITIES):
        polarity = polarity_for(activity)
        assert rejects(activity) is (polarity is KuligaiPolarity.ADVERSE)
        assert favours(activity) is (polarity is KuligaiPolarity.FAVOURABLE)
        assert not (rejects(activity) and favours(activity))


def test_an_unclassified_activity_never_rejects():
    """The original defect: defaulting to reject *is* the blanket exclusion."""
    assert polarity_for("ANYTHING_AT_ALL") is KuligaiPolarity.UNSPECIFIED
    assert rejects("ANYTHING_AT_ALL") is False
    assert favours("ANYTHING_AT_ALL") is False


def test_unspecified_is_distinct_from_neutralised():
    """"The text settles this as neutral" and "we have no reading" must never
    collapse into the same value — the whole engine turns on that distinction."""
    assert KuligaiPolarity.UNSPECIFIED is not KuligaiPolarity.NEUTRALISED


def test_neutralised_cancels_without_rejecting(monkeypatch):
    """The third branch has no rows yet, so drive it rather than leave it dead."""
    from app.data import kuligai_polarity as kp

    monkeypatch.setattr(kp, "NEUTRALISED", frozenset({"EXAM"}))
    assert kp.polarity_for("EXAM") is KuligaiPolarity.NEUTRALISED
    assert kp.rejects("EXAM") is False
    assert kp.favours("EXAM") is False


def test_activity_lookup_is_case_and_whitespace_insensitive():
    """The picker normalises activity keys upstream, but this module is imported
    directly by other callers and must not depend on that."""
    assert polarity_for("  gold ") is KuligaiPolarity.FAVOURABLE
    assert polarity_for("marriage") is KuligaiPolarity.ADVERSE
