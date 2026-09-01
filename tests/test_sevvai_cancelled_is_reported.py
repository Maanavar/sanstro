"""A cancelled Sevvai Dosham must read as cancelled, not as absent (anchor 4).

Anchor case 4 of the 2026-08-31 ruling set: *"8 pass but Sevvai dosham present
and cancelled → GOOD — present-but-cancelled caps an otherwise-excellent match
one rung down, and the family must be **told** it was cancelled, not that it was
absent."* The rulings doc recorded this as not yet verified against what the
surfaces actually say.

It was not being told. Both Sevvai branches in the compatibility report's
narrative required ``not is_cancelled``, so a present-but-cancelled dosham
produced no line at all — not a risk, not a strength. The report was therefore
word-for-word identical to one for a couple who never had the dosham, even
though the engine itself distinguishes them (`_compute_sevvai` scores a
cancelled dosham 4 and an absent one 5).

Three states, three readings. That is the whole of what these pin.
"""
from __future__ import annotations

import pytest

from app.calculations.compatibility_intelligence import (
    SevvaiDoshamDetail,
    sevvai_risk_lines,
)

pytestmark = pytest.mark.no_db


def _sevvai(*, has_dosham: bool, is_cancelled: bool, severity: str = "NONE") -> SevvaiDoshamDetail:
    return SevvaiDoshamDetail(
        has_dosham=has_dosham,
        mars_house=7,
        is_cancelled=is_cancelled,
        severity=severity,
        cancellation_reasons=[],
        note_en="",
        note_ta="",
        score=0,
    )


CLEAR = _sevvai(has_dosham=False, is_cancelled=False)
CANCELLED = _sevvai(has_dosham=True, is_cancelled=True)
ACTIVE = _sevvai(has_dosham=True, is_cancelled=False, severity="SEVERE")


def test_a_cancelled_dosham_is_reported_at_all():
    """The defect: it produced no line, so the family was never told."""
    risks_en, risks_ta = sevvai_risk_lines(CANCELLED, CLEAR)

    assert len(risks_en) == 1, "a cancelled dosham said nothing to the family"
    assert len(risks_ta) == 1, "the Tamil reading must say it too"


def test_a_cancelled_dosham_does_not_read_as_absent():
    risks_en, _ = sevvai_risk_lines(CANCELLED, CLEAR)
    line = risks_en[0].lower()

    assert "cancelled" in line
    # The distinction anchor 4 is about, stated rather than implied.
    assert "not absent" in line
    assert "no dosham" not in line


def test_a_clear_chart_still_says_nothing():
    """Absent is absent — this must not become a line about a dosham nobody has."""
    assert sevvai_risk_lines(CLEAR, CLEAR) == ([], [])


def test_an_active_dosham_still_reads_as_active_and_names_its_severity():
    risks_en, _ = sevvai_risk_lines(ACTIVE, CLEAR)

    assert len(risks_en) == 1
    assert "active" in risks_en[0].lower()
    assert "severe" in risks_en[0].lower()
    assert "cancelled" not in risks_en[0].lower()


def test_the_three_states_are_mutually_distinguishable():
    """The property that actually matters: no two states produce the same text.

    An assertion on one phrase can be satisfied while two states still read
    identically to a person; this compares them against each other.
    """
    absent = sevvai_risk_lines(CLEAR, CLEAR)[0]
    cancelled = sevvai_risk_lines(CANCELLED, CLEAR)[0]
    active = sevvai_risk_lines(ACTIVE, CLEAR)[0]

    assert absent != cancelled
    assert cancelled != active
    assert absent != active


def test_each_person_is_named_separately():
    risks_en, _ = sevvai_risk_lines(CLEAR, CANCELLED)

    assert len(risks_en) == 1
    assert "Person B" in risks_en[0]


def test_both_partners_cancelled_produces_a_line_each():
    """Mutual cancellation sets is_cancelled on both, and both still have the
    dosham — so the report owes the family two statements, not one."""
    risks_en, risks_ta = sevvai_risk_lines(CANCELLED, CANCELLED)

    assert len(risks_en) == 2
    assert len(risks_ta) == 2
    assert "Person A" in risks_en[0]
    assert "Person B" in risks_en[1]


def test_tamil_and_english_stay_in_step():
    """Every reading owes both languages the same number of statements."""
    for pair in [
        (CLEAR, CLEAR),
        (CANCELLED, CLEAR),
        (ACTIVE, CLEAR),
        (CANCELLED, ACTIVE),
        (CANCELLED, CANCELLED),
        (ACTIVE, ACTIVE),
    ]:
        risks_en, risks_ta = sevvai_risk_lines(*pair)
        assert len(risks_en) == len(risks_ta)
