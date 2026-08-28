"""C-1 — `MUH-08`: no activity rule goes live without a valid source_id.

The per-module doctrine suites each check the records their own chapter owns.
This one checks the **join** between the registry and those records, which is
the only place a rule can go live unsourced: a cited id that resolves to nothing
is read by the engine as "this factor has no rule", so the rule stops running
and no chapter's test notices.

`app/data/muhurta_source_invariant.py` carries the reasoning for each violation
kind. The tests below assert the invariant holds, and then pin the invariant
itself — a checker that quietly stops checking is worse than no checker, so each
detector gets a case proving it still fires.
"""
from __future__ import annotations

from dataclasses import replace

import pytest

from app.calculations.muhurta_doctrine import (
    Authority,
    ProvenanceStatus,
    RuleSource,
    RuleType,
    VerificationOutcome,
)
from app.calculations.muhurta_engine import _RULE_SOURCE_TABLES, resolve_rule_source
from app.data.muhurta_activity_registry import ACTIVITY_RULES
from app.data.muhurta_source_invariant import (
    ALL_RULE_SOURCE_TABLES,
    HELD_UNWIRED_RULE_IDS,
    RULE_ID_FIELDS,
    SCOREABLE_FACTORS,
    SourceViolation,
    cited_rule_ids,
    resolve,
    validate_muhurta_sources,
)

pytestmark = pytest.mark.no_db


def _sample_source() -> RuleSource:
    """A complete record, borrowed from live data so the fixture cannot drift
    away from the shape the real ones have."""
    for table in ALL_RULE_SOURCE_TABLES:
        for source in table.values():
            if source.provenance_status is ProvenanceStatus.CONFIRMED:
                return source
    raise AssertionError("no CONFIRMED rule source to build a fixture from")


# ── the invariant itself ────────────────────────────────────────────────────

def test_no_activity_rule_is_live_without_a_valid_source_id() -> None:
    violations = validate_muhurta_sources()
    assert not violations, "MUH-08 violated:\n" + "\n".join(
        f"  {v}" for v in violations
    )


def test_every_registered_activity_cites_at_least_one_sourced_rule() -> None:
    """An activity with no citations at all would pass the invariant vacuously
    while offering the reader a "sourced" election built on nothing."""
    for activity, rules in ACTIVITY_RULES.items():
        cited = cited_rule_ids(rules)
        assert cited, f"{activity} is selectable but cites no rule at all"
        assert all(resolve(rule_id) is not None for rule_id in cited), activity


def test_the_invariant_resolves_against_the_same_tables_as_the_engine() -> None:
    """The invariant rebuilds the table tuple rather than importing the engine,
    to stay out of the import cycle. That freedom is only safe while the two
    lists are identical, so it is pinned rather than trusted."""
    assert [id(t) for t in ALL_RULE_SOURCE_TABLES] == [
        id(t) for t in _RULE_SOURCE_TABLES
    ]


def test_resolve_agrees_with_the_engines_resolver_on_every_cited_id() -> None:
    for rules in ACTIVITY_RULES.values():
        for rule_id in cited_rule_ids(rules):
            assert resolve(rule_id) is resolve_rule_source(rule_id), rule_id


# ── the detectors still fire ────────────────────────────────────────────────

def test_an_unresolvable_id_is_caught(monkeypatch: pytest.MonkeyPatch) -> None:
    activity, rules = next(iter(ACTIVITY_RULES.items()))
    broken = replace(rules, tithi_rule_id="KP_CH99_NOT_A_REAL_RULE_001")
    monkeypatch.setitem(ACTIVITY_RULES, activity, broken)
    kinds = {v.kind for v in validate_muhurta_sources()}
    assert "unresolvable" in kinds


def test_an_out_of_scope_citation_is_caught(monkeypatch: pytest.MonkeyPatch) -> None:
    """GOLD legitimately cites Ch. XXI's TREASURE_STORE rules. Strip the
    declaration and the same citation must be reported — that is the difference
    between a declared borrowing and a silent promotion."""
    gold = ACTIVITY_RULES["GOLD"]
    assert gold.inherits_scope_from == ("TREASURE_STORE",)
    monkeypatch.setitem(ACTIVITY_RULES, "GOLD", replace(gold, inherits_scope_from=()))
    offenders = [v for v in validate_muhurta_sources() if v.kind == "out-of-scope"]
    assert offenders and all(v.activity == "GOLD" for v in offenders)


def test_an_incomplete_record_is_caught(monkeypatch: pytest.MonkeyPatch) -> None:
    """A record claiming CONFIRMED with no passage recorded is an assertion, not
    a citation. Emptying the passage on a live record must be reported even
    though `provenance_status` still says CONFIRMED."""
    activity = "NAMING_CEREMONY"
    rule_id = ACTIVITY_RULES[activity].tithi_rule_id
    source = resolve(rule_id)
    assert source is not None
    gutted = replace(
        source, authority=replace(source.authority, verse_or_passage=None)
    )
    table = next(t for t in ALL_RULE_SOURCE_TABLES if rule_id in t)
    monkeypatch.setitem(table, rule_id, gutted)
    offenders = [
        v for v in validate_muhurta_sources() if v.kind == "incomplete" and v.rule_id == rule_id
    ]
    assert offenders


def test_a_misfiled_chapter_is_caught(monkeypatch: pytest.MonkeyPatch) -> None:
    activity = "NAMING_CEREMONY"
    rule_id = ACTIVITY_RULES[activity].tithi_rule_id
    source = resolve(rule_id)
    assert source is not None
    moved = replace(source, authority=replace(source.authority, chapter="XCIX"))
    table = next(t for t in ALL_RULE_SOURCE_TABLES if rule_id in t)
    monkeypatch.setitem(table, rule_id, moved)
    kinds = {v.kind for v in validate_muhurta_sources() if v.rule_id == rule_id}
    assert "misfiled" in kinds


def test_a_stranded_scoreable_rule_is_caught(monkeypatch: pytest.MonkeyPatch) -> None:
    """The reverse direction: doctrine extracted from the text, for a live
    activity, that nothing runs. Simulated by dropping one of the five held
    rules off the reviewed list."""
    held = dict(HELD_UNWIRED_RULE_IDS)
    dropped = held.pop("KP_CH8_EDUCATION_SUBJECT_001")
    assert dropped
    monkeypatch.setattr(
        "app.data.muhurta_source_invariant.HELD_UNWIRED_RULE_IDS", held
    )
    offenders = [v for v in validate_muhurta_sources() if v.kind == "stranded"]
    assert [v.rule_id for v in offenders] == ["KP_CH8_EDUCATION_SUBJECT_001"]


def test_a_colliding_id_across_two_tables_is_caught(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Two tables carrying the same id with different content makes
    `resolve_rule_source` depend on table order — a rule would then cite one
    page and score from another."""
    rule_id = "KP_CH3_NAMING_TITHI_001"
    original = resolve(rule_id)
    assert original is not None
    impostor = replace(original, authority=replace(original.authority, page=999))
    other = next(t for t in ALL_RULE_SOURCE_TABLES if rule_id not in t)
    monkeypatch.setitem(other, rule_id, impostor)
    kinds = {v.kind for v in validate_muhurta_sources() if v.rule_id == rule_id}
    assert "colliding" in kinds


def test_a_pending_record_cannot_reach_a_live_activity(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """`marriage_muhurta_rules` deliberately keeps PENDING records beside empty
    constants. This proves one cannot be wired to a scored factor by accident."""
    activity = "NAMING_CEREMONY"
    rule_id = ACTIVITY_RULES[activity].tithi_rule_id
    source = resolve(rule_id)
    assert source is not None
    table = next(t for t in ALL_RULE_SOURCE_TABLES if rule_id in t)
    monkeypatch.setitem(
        table, rule_id, replace(source, provenance_status=ProvenanceStatus.PENDING)
    )
    offenders = [
        v
        for v in validate_muhurta_sources()
        if v.kind == "incomplete" and v.rule_id == rule_id
    ]
    assert offenders


# ── the invariant's own configuration ───────────────────────────────────────

def test_rule_id_fields_are_discovered_not_hardcoded() -> None:
    """A new `*_rule_id` field must be covered from the moment it exists. If
    this list is ever replaced with a literal, the newest factor becomes the one
    the invariant does not check — which is the gap C-1 was opened to close."""
    assert set(RULE_ID_FIELDS) == {
        "prohibited_stars_rule_id",
        "tithi_rule_id",
        "karana_rule_id",
        "vara_rule_id",
        "lagna_rule_id",
        "paksha_rule_id",
        "janma_nakshatra_rule_id",
        "janma_tara_rule_id",
    }


def test_every_scoreable_factor_is_actually_cited_by_some_activity() -> None:
    """`SCOREABLE_FACTORS` decides which stranded rules get reported. A factor
    listed there that nothing cites would be a name with no meaning, and would
    silently narrow the reverse check."""
    cited_factors = {
        resolve(rule_id).factor
        for rules in ACTIVITY_RULES.values()
        for rule_id in cited_rule_ids(rules)
    }
    assert cited_factors == SCOREABLE_FACTORS


def test_every_held_rule_is_real_sourced_and_still_unwired() -> None:
    """The held list is an exemption, so it has to expire on its own. Wiring a
    held rule, or deleting it, fails here rather than leaving a stale waiver
    that would hide the next stranded rule with the same id."""
    cited = {
        rule_id
        for rules in ACTIVITY_RULES.values()
        for rule_id in cited_rule_ids(rules)
    }
    for rule_id, reason in HELD_UNWIRED_RULE_IDS.items():
        source = resolve(rule_id)
        assert source is not None, f"{rule_id} is held but no longer exists"
        assert rule_id not in cited, (
            f"{rule_id} is wired now — remove it from HELD_UNWIRED_RULE_IDS"
        )
        assert source.factor in SCOREABLE_FACTORS, (
            f"{rule_id} is not a scoreable factor, so it needs no exemption"
        )
        assert source.source_scope in ACTIVITY_RULES, (
            f"{rule_id}'s scope is not a live activity, so it needs no exemption"
        )
        assert len(reason) > 40, f"{rule_id}'s reason is too thin to review"


def test_held_rules_carry_their_full_argument_in_the_record_not_only_here() -> None:
    """The one-line reason in `HELD_UNWIRED_RULE_IDS` is a summary. The record
    itself must still carry the long form, so the decision survives someone
    reading only the data module."""
    for rule_id in HELD_UNWIRED_RULE_IDS:
        source = resolve(rule_id)
        assert source is not None and source.notes, rule_id


def test_the_violation_type_renders_something_a_reader_can_act_on() -> None:
    rendered = str(
        SourceViolation("unresolvable", "GOLD", "KP_CH21_X_001", "no table carries it")
    )
    assert "GOLD" in rendered and "KP_CH21_X_001" in rendered


def test_a_valid_record_is_not_reported(monkeypatch: pytest.MonkeyPatch) -> None:
    """Negative control. Re-inserting a complete record under a live activity's
    factor must leave the invariant clean — otherwise every test above could be
    passing because the checker reports everything."""
    activity = "NAMING_CEREMONY"
    rule_id = ACTIVITY_RULES[activity].tithi_rule_id
    source = resolve(rule_id)
    assert source is not None
    table = next(t for t in ALL_RULE_SOURCE_TABLES if rule_id in t)
    monkeypatch.setitem(table, rule_id, replace(source, notes="re-stated, unchanged"))
    assert not validate_muhurta_sources()


def test_the_fixture_helpers_are_wired_to_the_real_vocabulary() -> None:
    """Guards the imports this file leans on: if `Authority`, `RuleType` or
    `VerificationOutcome` move, the detector tests above would still pass while
    testing a fixture shape the data no longer uses."""
    sample = _sample_source()
    assert isinstance(sample.authority, Authority)
    assert isinstance(sample.rule_type, RuleType)
    assert sample.outcome is None or isinstance(sample.outcome, VerificationOutcome)
