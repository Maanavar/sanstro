"""Muhurta engine — mode semantics, veto/penalty split, and provenance surfacing.

The tests that matter most here are the ones that pin *honesty properties*
rather than scores:

* general mode must never be vetoed by a personal factor, and must never
  mention a person;
* an activity with no sourced rule table must say so rather than scoring as
  though it had been checked;
* a factor decided by a classical rule must carry the `rule_id` that leads to
  its page and passage.

Scores themselves are engine policy and deliberately loosely asserted — pinning
exact numbers here would freeze tunable weights as if they were doctrine.
"""
from __future__ import annotations

import re
from datetime import date, timedelta

import pytest

from app.calculations.muhurta_engine import (
    Subject,
    Verdict,
    _ordinal,
    score_day,
)
from app.calculations.panchangam import calculate_daily_panchangam
from app.data import marriage_muhurta_rules as marriage

# Chennai — a location, not a person.
LATITUDE, LONGITUDE, TIMEZONE = 13.0827, 80.2707, "Asia/Kolkata"
SWEEP_START = date(2026, 6, 1)
SWEEP_DAYS = 45

pytestmark = pytest.mark.no_db


@pytest.fixture(scope="module")
def snapshots() -> list:
    return [
        calculate_daily_panchangam(SWEEP_START + timedelta(days=i), LATITUDE, LONGITUDE, TIMEZONE)
        for i in range(SWEEP_DAYS)
    ]


@pytest.fixture(scope="module")
def snapshot(snapshots) -> object:
    return snapshots[0]


# A clearly-synthetic subject — no real birth data, per repo policy.
SYNTHETIC = Subject(janma_nakshatra=4, janma_rasi=2, lagna_rasi=5, label="Test Subject")


# ── mode semantics ──────────────────────────────────────────────────────────

def test_general_mode_computes_no_personal_factors(snapshot) -> None:
    result = score_day(snapshot, "MARRIAGE", subject=None)
    names = {f.factor for f in result.factors}
    assert "TARA_BALA" not in names
    assert "CHANDRA_BALA" not in names


def test_general_mode_is_never_vetoed_by_a_personal_factor(snapshots) -> None:
    """The defining property of the mode. If a personal veto could reach a
    general result, the two modes would not be separable."""
    for snap in snapshots:
        result = score_day(snap, "MARRIAGE", subject=None)
        for factor in result.veto_reasons:
            assert factor.factor not in {"TARA_BALA", "CHANDRA_BALA"}


def test_general_mode_never_names_a_person(snapshots) -> None:
    """Mode-honesty gate: a general answer that reads as personal is worse than
    no answer, because the user acts on it believing their chart was consulted."""
    for snap in snapshots:
        result = score_day(snap, "MARRIAGE", subject=None)
        for factor in result.factors:
            assert "Test Subject" not in factor.reason_en
            assert "your" not in factor.reason_en.lower()
            assert "this person" not in factor.reason_en.lower()


def test_personal_and_general_differ_somewhere_over_a_sweep(snapshots) -> None:
    """If adding a chart changed nothing, the personal layer would be theatre."""
    differed = [
        snap.date_local
        for snap in snapshots
        if score_day(snap, "MARRIAGE", SYNTHETIC).score != score_day(snap, "MARRIAGE", None).score
    ]
    assert differed, "personal and general scored identically on every day in the sweep"


def test_two_subjects_can_rank_the_same_range_differently(snapshots) -> None:
    """Tara Bala and Chandra Bala are what make a muhurta personal — two birth
    stars must be able to produce different day orderings."""
    other = Subject(janma_nakshatra=17, janma_rasi=9, lagna_rasi=3, label="Second Subject")

    def ranked(subject: Subject) -> list:
        scored = [(score_day(s, "MARRIAGE", subject), s.date_local) for s in snapshots]
        return [d for sc, d in sorted(scored, key=lambda x: (-x[0].score, x[1]))]

    assert ranked(SYNTHETIC) != ranked(other)


# ── veto vs penalty ─────────────────────────────────────────────────────────

def test_chandrashtama_vetoes_rather_than_merely_penalising(snapshots) -> None:
    """Chandrashtama is not compensable by any aggregate score. A day that only
    *loses points* for it would still be recommendable on a strong almanac."""
    found = False
    for snap in snapshots:
        result = score_day(snap, "MARRIAGE", SYNTHETIC)
        chandra = next(f for f in result.factors if f.factor == "CHANDRA_BALA")
        if chandra.verdict is Verdict.VETO:
            found = True
            assert result.vetoed is True
            assert "Chandrashtama" in chandra.reason_en
    assert found, "sweep contained no Chandrashtama day for this subject — widen the sweep"


def test_a_vetoed_day_still_reports_what_killed_it(snapshots) -> None:
    for snap in snapshots:
        result = score_day(snap, "MARRIAGE", SYNTHETIC)
        if result.vetoed:
            assert result.veto_reasons, "vetoed with no factor naming the cause"
            for factor in result.veto_reasons:
                assert factor.reason_en and factor.reason_ta


def test_no_almanac_factor_ever_vetoes_for_marriage(snapshots) -> None:
    """Kalaprakasika lists the eleven stars as *best* and does not blanket-forbid
    the rest, so a non-listed star is a penalty. Promoting it to a veto would
    assert something the cited page does not say."""
    for snap in snapshots:
        result = score_day(snap, "MARRIAGE", subject=None)
        for factor in result.factors:
            assert factor.verdict is not Verdict.VETO


# ── provenance surfacing ────────────────────────────────────────────────────

def test_sourced_factors_carry_a_resolvable_rule_id(snapshot) -> None:
    """The audit trail: every rule_id a factor emits must resolve to a real
    RULE_SOURCES record with a page and a passage behind it."""
    result = score_day(snapshot, "MARRIAGE", SYNTHETIC)
    sourced = [f for f in result.factors if f.rule_id is not None]
    assert sourced, "no marriage factor cited a rule"
    for factor in sourced:
        assert factor.rule_id in marriage.RULE_SOURCES
        record = marriage.RULE_SOURCES[factor.rule_id]
        assert record.authority.page is not None
        assert record.authority.verse_or_passage


def test_unsourced_activity_says_so_instead_of_scoring_silently(snapshot) -> None:
    """Gold, land and business have no primary-text table yet. Scoring them as
    NEUTRAL would be indistinguishable from having checked and approved."""
    result = score_day(snapshot, "PURCHASE", subject=None)
    nakshatra = next(f for f in result.factors if f.factor == "NAKSHATRA")
    assert nakshatra.verdict is Verdict.UNSOURCED
    assert nakshatra.contribution == 0.0
    assert "sourced" in nakshatra.reason_en.lower()
    assert nakshatra.rule_id is None


def test_unsourced_activity_still_gets_the_personal_layer(snapshot) -> None:
    """The personal factors are activity-independent — a missing activity table
    must not silently disable Tara Bala and Chandra Bala too."""
    result = score_day(snapshot, "PURCHASE", SYNTHETIC)
    names = {f.factor for f in result.factors}
    assert {"TARA_BALA", "CHANDRA_BALA"} <= names


def test_marriage_tithi_conflict_is_surfaced_not_resolved_silently(snapshots) -> None:
    """The best-tithi list and the 'after Krishna Ashtami' sweep overlap on
    10/11/13 on the same page. The engine applies the more specific rule but
    must report the ambiguity so the astrologer can settle it."""
    conflicts = [
        f
        for snap in snapshots
        for f in score_day(snap, "MARRIAGE", None).factors
        if f.conflict is not None
    ]
    assert conflicts, "sweep hit no Krishna-paksha 10/11/13 day — widen the sweep"
    for factor in conflicts:
        assert "best-list" in factor.conflict
        assert "pending astrologer confirmation" in factor.conflict


# ── reason copy ────────────────────────────────────────────────────────────

def test_house_ordinals_read_correctly() -> None:
    """`f"{n}th"` produced "Moon is 1th/2th/3th from your birth sign" in the
    shipped reason text. All twelve houses are user-visible, so all twelve are
    pinned."""
    assert [_ordinal(n) for n in range(1, 13)] == [
        "1st", "2nd", "3rd", "4th", "5th", "6th",
        "7th", "8th", "9th", "10th", "11th", "12th",
    ]


def test_no_reason_text_contains_a_malformed_ordinal(snapshots) -> None:
    """Checked by re-deriving each ordinal found in the copy. A naive substring
    scan for "1th" is wrong — "11th" contains it and is correct."""
    ordinal_re = re.compile(r"\b(\d+)(st|nd|rd|th)\b")
    for snap in snapshots:
        for factor in score_day(snap, "MARRIAGE", SYNTHETIC).factors:
            for number, suffix in ordinal_re.findall(factor.reason_en):
                assert f"{number}{suffix}" == _ordinal(int(number)), (
                    f"malformed ordinal in: {factor.reason_en}"
                )


def test_tithi_and_nakshatra_names_share_one_casing(snapshots) -> None:
    """A reason reading "CHATHURTHI" beside one reading "Aswini" is the kind of
    seam that shows up in a screenshot, not in a green test run."""
    for snap in snapshots:
        for factor in score_day(snap, "MARRIAGE", None).factors:
            words = [w for w in factor.reason_en.split() if w.isalpha() and len(w) > 3]
            assert not [w for w in words if w.isupper()], (
                f"upper-case term in reason copy: {factor.reason_en}"
            )


# ── the rules actually bite ────────────────────────────────────────────────

def test_a_favoured_star_outscores_a_non_favoured_one(snapshots) -> None:
    """The whole point of the activity table: it must change the ranking. Today
    the flat SUBHA_NAKSHATRAS set treats every activity alike."""
    favoured = [s for s in snapshots if s.nakshatra_number in marriage.MARRIAGE_NAKSHATRA_ALLOWED]
    other = [s for s in snapshots if s.nakshatra_number not in marriage.MARRIAGE_NAKSHATRA_ALLOWED]
    assert favoured and other, "sweep lacked both cases"

    def nakshatra_contribution(snap) -> float:
        result = score_day(snap, "MARRIAGE", None)
        return next(f for f in result.factors if f.factor == "NAKSHATRA").contribution

    assert min(nakshatra_contribution(s) for s in favoured) > max(
        nakshatra_contribution(s) for s in other
    )


def test_magha_and_mula_score_as_favoured_for_marriage(snapshots) -> None:
    """The case that proves activity tables override the nature classification.
    A generic 'Ugra/Tikshna = reject' rule would penalise both."""
    for snap in snapshots:
        if snap.nakshatra_name.upper() in {"MAGAM", "MOOLAM"}:
            result = score_day(snap, "MARRIAGE", None)
            nakshatra = next(f for f in result.factors if f.factor == "NAKSHATRA")
            assert nakshatra.verdict is Verdict.BONUS, (
                f"{snap.nakshatra_name} penalised despite being in the marriage list"
            )
