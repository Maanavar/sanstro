"""The month ranker's nakshatra layer.

For most Tamil muhurta work the Moon's mansion is the single strongest
day-selection factor — stronger than the weekday, which this module always
consulted. The "top 5 dates this month" ranker nonetheless read only tithi,
paksha and weekday, so it would happily rank a Bharani day above a Poosam day.

These tests pin the two properties that matter, and they are honesty properties
rather than score assertions:

* the star must actually change a verdict, and
* a *sourced* judgement (marriage, from Kalaprakasika Ch. XIV) and a *generic*
  one (the broad Thirukanitham auspicious-star list, which knows nothing about
  the activity) must be distinguishable in the copy — because presenting the
  second as the first would claim a classical text ruled on gold or property,
  which none of ours has yet.
"""
from __future__ import annotations

import pytest

from app.calculations.activity_timing_rules import (
    ACTIVITY_TYPES,
    assess_activity_timing,
    daily_activity_board,
)
from app.calculations.panchangam import SUBHA_NAKSHATRA_NUMBERS
from app.constants.astrology import NAKSHATRA_NAMES
from app.data.marriage_muhurta_rules import MARRIAGE_NAKSHATRA_ALLOWED

pytestmark = pytest.mark.no_db

# Pournami in Shukla paksha on a Thursday — the most supportive combination the
# rules describe, so any change in verdict below comes from the star alone.
_GOOD_DAY = (15, "SHUKLA", "JUPITER")

_ROHINI = NAKSHATRA_NAMES.index("ROHINI") + 1        # in the marriage best-11
_BHARANI = NAKSHATRA_NAMES.index("BHARANI") + 1      # in neither list
_POOSAM = NAKSHATRA_NAMES.index("POOSAM") + 1        # generic subha, not marriage-best


def test_omitting_the_star_is_visible_rather_than_silent() -> None:
    """A caller with no panchangam snapshot gets the old three-signal behaviour —
    but `nakshatra_signal` is None, so "not consulted" cannot be mistaken
    downstream for "consulted, nothing to say"."""
    result = assess_activity_timing("marriage", *_GOOD_DAY)
    assert result.nakshatra_signal is None


def test_passing_the_star_populates_the_signal() -> None:
    result = assess_activity_timing("marriage", *_GOOD_DAY, _ROHINI)
    assert result.nakshatra_signal is not None
    assert result.nakshatra_signal.alignment == "SUPPORTS"


def test_the_star_changes_the_verdict_on_an_otherwise_identical_day() -> None:
    """The whole point. If the same day produced the same verdict for every
    star, wiring the factor in would be theatre."""
    favoured = assess_activity_timing("marriage", *_GOOD_DAY, _ROHINI)
    other = assess_activity_timing("marriage", *_GOOD_DAY, _BHARANI)
    assert favoured.combined_alignment == "SUPPORTS"
    assert other.combined_alignment != "SUPPORTS"


def test_marriage_is_judged_against_the_sourced_table_not_the_generic_list() -> None:
    """Poosam is on the general auspicious-star list but is *not* among the
    eleven Kalaprakasika names best for marriage. A ranker reading the generic
    list for marriage would rate it as a best marriage star; this asserts it
    does not."""
    assert _POOSAM in SUBHA_NAKSHATRA_NUMBERS
    assert _POOSAM not in MARRIAGE_NAKSHATRA_ALLOWED

    marriage = assess_activity_timing("marriage", *_GOOD_DAY, _POOSAM)
    assert marriage.nakshatra_signal.alignment == "NEUTRAL"
    assert "marriage" in marriage.nakshatra_signal.reason_en.lower()


def test_an_unsourced_activity_says_its_star_layer_is_generic() -> None:
    """Gold, land and business have no primary-text table yet — Kalaprakasika
    Ch. XXI is the next extraction. Until then their star layer is the generic
    list and the copy must say so, rather than implying an activity ruling."""
    for activity in ("property", "money", "business_start"):
        signal = assess_activity_timing(activity, *_GOOD_DAY, _POOSAM).nakshatra_signal
        assert signal is not None
        assert "general auspicious-star list" in signal.reason_en
        assert "specific to this activity has been sourced" in signal.reason_en


def test_the_generic_layer_never_claims_a_classical_authority() -> None:
    """No unsourced activity may name a text. The marriage copy cites
    Kalaprakasika; nothing else is entitled to."""
    for activity in ACTIVITY_TYPES:
        if activity == "marriage":
            continue
        for number in (_ROHINI, _BHARANI, _POOSAM):
            signal = assess_activity_timing(activity, *_GOOD_DAY, number).nakshatra_signal
            assert "Kalaprakasika" not in signal.reason_en, activity


def test_an_unlisted_star_is_neutral_never_a_caution() -> None:
    """Kalaprakasika names eleven stars *best* for marriage without forbidding
    the other sixteen. Flipping the day to CAUTION would assert something the
    cited page does not say — and would put two thirds of the calendar in red."""
    for number in range(1, 28):
        signal = assess_activity_timing("marriage", *_GOOD_DAY, number).nakshatra_signal
        assert signal.alignment in {"SUPPORTS", "NEUTRAL"}


def test_the_star_is_named_as_the_cause_when_it_decides_the_verdict() -> None:
    """Nakshatra outranks tithi in the compact "why" chip — it is the strongest
    day-selection factor, so a UI naming the weekday instead would misattribute
    the ranking."""
    result = assess_activity_timing("marriage", *_GOOD_DAY, _ROHINI)
    assert "Rohini" in result.short_en


def test_the_board_still_works_without_a_star_and_changes_with_one() -> None:
    """`daily_activity_board` keeps its three-argument form for callers with no
    snapshot, and consults the star when one is passed."""
    plain = daily_activity_board(*_GOOD_DAY)
    with_star = daily_activity_board(*_GOOD_DAY, nakshatra_number=_BHARANI)
    assert plain.favourable, "the most supportive combination produced no green light"
    # Bharani is on neither list, so at least one activity must drop out of green.
    assert len(with_star.favourable) < len(plain.favourable)


def test_every_activity_still_gets_a_bilingual_reason_with_a_star() -> None:
    for activity in ACTIVITY_TYPES:
        for number in (_ROHINI, _BHARANI):
            signal = assess_activity_timing(activity, *_GOOD_DAY, number).nakshatra_signal
            assert signal.reason_en.strip(), f"{activity} has no English star reason"
            assert signal.reason_ta.strip(), f"{activity} has no Tamil star reason"
            assert signal.short_en.strip() and signal.short_ta.strip()
