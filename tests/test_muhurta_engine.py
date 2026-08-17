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
from pathlib import Path

import pytest

from app.calculations.muhurta_engine import (
    Subject,
    Verdict,
    _ordinal,
    resolve_rule_source,
    score_day,
)
from app.calculations.panchangam import calculate_daily_panchangam
from app.data import marriage_muhurta_rules as marriage
from app.data.muhurta_activity_registry import ACTIVITY_RULES

REPO_ROOT = Path(__file__).resolve().parents[1]

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


@pytest.mark.parametrize("activity", ["EAR_BORING", "TONSURE"])
def test_saturday_is_a_hard_veto_for_samskaras_that_explicitly_avoid_it(snapshots, activity) -> None:
    saturday = next(snapshot for snapshot in snapshots if snapshot.weekday == "SATURDAY")

    result = score_day(saturday, activity, subject=None)
    vara = next(factor for factor in result.factors if factor.factor == "VARA")

    assert vara.verdict is Verdict.VETO
    assert result.vetoed is True
    assert "Saturday" in vara.reason_en


def test_saturday_remains_available_when_an_activity_source_names_it_favourable(snapshots) -> None:
    saturday = next(snapshot for snapshot in snapshots if snapshot.weekday == "SATURDAY")

    result = score_day(saturday, "HARVEST_INGATHERING", subject=None)
    vara = next(factor for factor in result.factors if factor.factor == "VARA")

    assert vara.verdict is Verdict.BONUS
    assert result.vetoed is False


def test_every_explicitly_avoided_weekday_is_a_hard_veto(snapshots) -> None:
    for activity, rules in ACTIVITY_RULES.items():
        if not rules.vara_avoid:
            continue
        snapshot = next(s for s in snapshots if s.weekday in rules.vara_avoid)
        result = score_day(snapshot, activity, subject=None)
        vara = next(factor for factor in result.factors if factor.factor == "VARA")
        assert vara.verdict is Verdict.VETO, activity
        assert result.vetoed is True, activity


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


def test_tamil_reason_copy_never_carries_a_latin_star_name(snapshots) -> None:
    """Bilingual copy needs a bilingual star name.

    `nakshatra_name.title()` was interpolated into both languages, so the Tamil
    reason read "…பதினொரு நட்சத்திரங்களுள் Aswini ஒன்று." — a Latin word inside a
    Tamil sentence. Any ASCII letter run in a Tamil reason is the tell.
    """
    latin_run = re.compile(r"[A-Za-z]{3,}")
    for snap in snapshots:
        for factor in score_day(snap, "MARRIAGE", SYNTHETIC).factors:
            # The synthetic subject's own label is English by construction and is
            # meant to appear; nothing else Latin belongs in the Tamil copy.
            tamil = factor.reason_ta.replace(SYNTHETIC.label or "", "")
            assert not latin_run.findall(tamil), (
                f"Latin text in Tamil reason: {factor.reason_ta}"
            )


def test_the_unlabelled_marriage_path_keeps_latin_out_of_the_tamil_copy(
    snapshots,
) -> None:
    """The test above supplies a label, which hides the bug this one catches.

    `muhurta_service.find_best_muhurta_slots` builds its `Subject` **without** a
    label, so unlabelled is the *production* path. A shared fallback —
    `who = subject.label or "this person"` — interpolated into `reason_ta` shipped
    "this person ஜென்ம ராசிக்கு 8ல் சந்திரன்" on every real result. English keeps
    its fallback; Tamil must drop the phrase entirely.

    Marriage is guarded here specifically because it is the one activity the
    engine still scores by its own branch, and so is outside the sourced-activity
    sweep in `test_muhurta_sourced_activities_e2e.py`.
    """
    unlabelled = Subject(janma_nakshatra=4, janma_rasi=2, lagna_rasi=5)
    latin_run = re.compile(r"[A-Za-z]{3,}")
    seen: set[str] = set()
    for snap in snapshots:
        for factor in score_day(snap, "MARRIAGE", unlabelled).factors:
            seen.add(factor.factor)
            assert not latin_run.findall(factor.reason_ta), (
                f"{factor.factor}: Latin text in unlabelled Tamil reason — {factor.reason_ta}"
            )
            # The emptied-slot spacing bug. `_tara_bala_factor` has a branch
            # reading f"{star_ta} {who} சொந்த நட்சத்திரம்"; substituting an empty
            # string without moving the space leaves a gap mid-sentence.
            assert "  " not in factor.reason_ta, (
                f"{factor.factor}: double space where the label was dropped — {factor.reason_ta}"
            )
    # Fail loudly if the sweep never reached the two personal factors that
    # carried the bug, rather than passing on an empty run.
    assert {"CHANDRA_BALA", "TARA_BALA"} <= seen


def test_a_supplied_label_still_reaches_both_languages(snapshots) -> None:
    """The Tamil fix drops the phrase only when there is nothing to print. A
    label that vanished from the Tamil copy would be the opposite regression, and
    an empty-string fallback in both languages would pass the Latin guard above
    while silently losing the name."""
    for snap in snapshots:
        for factor in score_day(snap, "MARRIAGE", SYNTHETIC).factors:
            if factor.factor not in {"CHANDRA_BALA", "TARA_BALA"}:
                continue
            assert SYNTHETIC.label in factor.reason_en
            assert SYNTHETIC.label in factor.reason_ta


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


# ── one scorer, repo-wide (§9.4) ────────────────────────────────────────────

def test_there_is_exactly_one_day_scorer_in_the_repo() -> None:
    """The hard gate from the remediation plan's §9.4, not a review opinion.

    `muhurta_service._score_panchangam` and `public_tools._score_public_muhurta`
    were two copies of the generic almanac layer on two endpoints. They had
    already drifted — Amavasai cost -5 in one and 0 in the other, and only one
    of them consulted the sourced per-activity doctrine at all, so the same
    marriage question got a different answer depending on whether you were
    signed in. Both are folded into `score_day`. If a second one reappears,
    this fails.

    Matched on the `def` rather than on the bare name, because the surviving
    code comments deliberately name both dead functions to explain where the
    logic went — the plan's literal `grep -rn "_score_public_muhurta" app/`
    would flag that history as a violation.
    """
    app_dir = REPO_ROOT / "app"
    banned = re.compile(r"^\s*def (_score_public_muhurta|_score_panchangam)\b", re.MULTILINE)
    offenders = [
        f"{path.relative_to(REPO_ROOT)}: {match}"
        for path in app_dir.rglob("*.py")
        for match in banned.findall(path.read_text(encoding="utf-8"))
    ]
    assert not offenders, f"a second muhurta day-scorer is back: {offenders}"


# ── L1 generic almanac ──────────────────────────────────────────────────────

def test_every_activity_gets_the_generic_almanac_layer(snapshot) -> None:
    """An activity with no sourced table must still be judged on the almanac.
    Scoring only L2 would leave every gold/property day on the same base score,
    which is not "we don't know" — it is a flat ranking presented as a ranking.
    """
    for activity in ("MARRIAGE", "PURCHASE", "TRAVEL", "JOB_START"):
        names = {f.factor for f in score_day(snapshot, activity, None).factors}
        assert {
            "ALMANAC_TITHI", "ALMANAC_NAKSHATRA", "ALMANAC_DAY_QUALITY",
            "ALMANAC_YOGA", "ALMANAC_WINDOWS",
        } <= names, f"{activity} lost the generic almanac layer"


def test_the_generic_layer_separates_days_for_an_unsourced_activity(snapshots) -> None:
    """The reason B3 could delete the public scorer at all: without L1, general
    mode for an unsourced activity would return one identical score every day."""
    scores = {score_day(snap, "PURCHASE", None).score for snap in snapshots}
    assert len(scores) > 1, "every day scored identically for an unsourced activity"


def test_the_generic_layer_never_claims_to_be_sourced(snapshots) -> None:
    """`ALMANAC_*` factors are almanac convention, not cited doctrine. A rule_id
    on one would put a page citation under a claim no page makes."""
    for snap in snapshots:
        for factor in score_day(snap, "MARRIAGE", SYNTHETIC).factors:
            if factor.factor.startswith("ALMANAC_"):
                assert factor.rule_id is None, f"{factor.factor} claimed a citation"


def test_the_generic_and_sourced_nakshatra_layers_stay_distinct(snapshots) -> None:
    """"A generally auspicious star" and "Kalaprakasika names this star best for
    marriage" are different claims. The sweep must contain a day where they
    disagree, or the two layers are collapsed in practice whatever the code says.
    """
    disagreed = False
    for snap in snapshots:
        factors = {f.factor: f for f in score_day(snap, "MARRIAGE", None).factors}
        generic_good = factors["ALMANAC_NAKSHATRA"].verdict is Verdict.BONUS
        sourced_good = factors["NAKSHATRA"].verdict is Verdict.BONUS
        if generic_good != sourced_good:
            disagreed = True
    assert disagreed, "the generic star list and the marriage star list never diverged"


def test_the_yoga_is_reported_but_never_scored_as_support(snapshots) -> None:
    """Both former copies of L1 appended the yoga name to the *support* string
    unconditionally, so a day carrying Vyatipata read as supported by it. The
    yoga is reported as its own ungraded factor instead."""
    for snap in snapshots:
        yoga = next(f for f in score_day(snap, "MARRIAGE", None).factors if f.factor == "ALMANAC_YOGA")
        assert yoga.verdict is Verdict.NEUTRAL
        assert yoga.contribution == 0.0


# ── provenance resolves ─────────────────────────────────────────────────────

def test_every_emitted_rule_id_resolves_to_a_page_and_a_passage(snapshots) -> None:
    """A rule_id the product cannot turn back into a citation is decoration.
    This walks the sweep in both modes rather than trusting one day."""
    seen = 0
    for snap in snapshots:
        for subject in (None, SYNTHETIC):
            for factor in score_day(snap, "MARRIAGE", subject).factors:
                if factor.rule_id is None:
                    continue
                record = resolve_rule_source(factor.rule_id)
                assert record is not None, f"unresolvable rule_id {factor.rule_id}"
                assert record.authority.page is not None
                assert record.authority.verse_or_passage
                seen += 1
    assert seen, "no factor cited a rule across the whole sweep"


# ── Amirdhadhi Yogam (EC-A08 polarity + the almanac's own day class) ─────────

def test_every_day_carries_an_amirdhadhi_factor(snapshots) -> None:
    """The classification exists for every weekday x star pair, so a day with no
    such factor means the snapshot lost its weekday or star, not that the day is
    unclassified."""
    for snap in snapshots:
        names = {f.factor for f in score_day(snap, "MARRIAGE").factors}
        assert "ALMANAC_AMIRDHADHI_YOGAM" in names


def test_marana_yogam_is_scored_against_the_day(snapshots) -> None:
    """The gap this factor closed: the class was computed, cached, serialised and
    displayed while every scorer ignored it, so a day the almanac marks Marana
    Yogam could top a 60-day marriage search on the strength of its tithi and
    star alone.

    Asserted as a sign, not a magnitude — the weight is engine policy.
    """
    seen_adverse = False
    for snap in snapshots:
        factor = next(
            f for f in score_day(snap, "MARRIAGE").factors
            if f.factor == "ALMANAC_AMIRDHADHI_YOGAM"
        )
        if "Marana" in factor.reason_en or "Prabalarishta" in factor.reason_en:
            seen_adverse = True
            assert factor.verdict is Verdict.PENALTY
            assert factor.contribution < 0
        elif "Amirtha" in factor.reason_en or "Siddha" in factor.reason_en:
            assert factor.verdict is Verdict.BONUS
            assert factor.contribution > 0
    assert seen_adverse, "45-day sweep contained no adverse Amirdhadhi day — check the table"


def test_amirdhadhi_reason_is_bilingual_and_names_both_inputs(snapshots) -> None:
    """The claim is about a *combination*, so the copy has to name the weekday and
    the star. 'Marana Yogam' alone is not checkable against a printed almanac."""
    tamil = re.compile(r"[஀-௿]")
    for snap in snapshots[:7]:
        factor = next(
            f for f in score_day(snap, "MARRIAGE").factors
            if f.factor == "ALMANAC_AMIRDHADHI_YOGAM"
        )
        assert tamil.search(factor.reason_ta)
        assert not tamil.search(factor.reason_en)
        assert str(snap.weekday).title() in factor.reason_en


def test_adverse_amirdhadhi_never_carries_a_rule_id(snapshots) -> None:
    """L1 is almanac convention, not cited doctrine. A `rule_id` here would send
    the UI looking for a page and passage that does not exist."""
    for snap in snapshots:
        factor = next(
            f for f in score_day(snap, "MARRIAGE").factors
            if f.factor == "ALMANAC_AMIRDHADHI_YOGAM"
        )
        assert factor.rule_id is None


def test_amirdhadhi_is_polarity_aware_for_terminative_intent(snapshots, monkeypatch) -> None:
    """EC-A08: a destructive kala is not adverse for a destructive intent.

    The source that supplies Marana Yogam says in the same passage that one may
    repay a debt on such a day. No shipped activity is terminative yet, so the
    set is empty in production — this drives it through a temporary member to
    prove the branch is wired, not dead code waiting for a future edit.
    """
    from app.calculations import muhurta_engine

    monkeypatch.setattr(muhurta_engine, "_TERMINATIVE_ACTIVITIES", frozenset({"MARRIAGE"}))
    for snap in snapshots:
        factor = next(
            f for f in score_day(snap, "MARRIAGE").factors
            if f.factor == "ALMANAC_AMIRDHADHI_YOGAM"
        )
        assert factor.contribution >= 0, "an adverse class still penalised a terminative intent"
