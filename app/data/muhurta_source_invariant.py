"""C-1 — the global `MUH-08` invariant: no activity rule goes live unsourced.

Provenance has been enforced per-module since the Kalaprakasika extraction
began: `tests/test_kalaprakasika_samskara_doctrine.py` loops over that chapter's
`RULE_SOURCES` and checks each record is self-consistent, and the other suites
do the same for theirs. What no module could check is the join — that every
`rule_id` the **registry** cites actually resolves, in the right scope, to a
record complete enough to lead a reader back to a page.

That join is where a rule goes live unsourced. A module test passes on the
records it owns while saying nothing about the ids the registry points at, and a
registry entry citing a typo'd or deleted id fails only on the day a real
panchangam happens to hit that factor. `resolve_rule_source` returning None is
then read by the engine as "no rule here" — the rule silently stops running and
nothing is red.

So this module walks the whole graph once, statically, and reports every way it
can be broken:

* **unresolvable** — a cited id no table carries.
* **incomplete** — a record without the page, passage, or verification stamp
  that makes it a citation rather than an assertion.
* **out of scope** — a record confirmed for one `source_scope` being cited by a
  different activity without that borrowing being declared. `RuleSource`'s own
  docstring names this the failure mode scope exists to stop, and until now
  nothing compared the two. Ch. XXI's treasure rules reach GOLD, GEMS and GRAIN
  exactly this way; they are legitimate, so they are declared on the activity
  via `inherits_scope_from` rather than waived here.
* **misfiled** — a record whose chapter is not the chapter the activity says it
  comes from, so the citation leads to the wrong pages.
* **colliding** — one id carried by two tables with different content, which
  makes `resolve_rule_source` order-dependent.
* **stranded** — the reverse direction: a *scoreable* rule that is fully sourced
  for a registered activity and that the registry never cites, i.e. doctrine
  extracted from the text and then not run. Five of these are real and
  deliberate; they are listed below with the reason, so the list is reviewable
  rather than invisible.

Reported as a list rather than raised, so `tests/test_muhurta_source_invariant.py`
can print every violation at once instead of one per run.
"""
from __future__ import annotations

from dataclasses import dataclass, fields

from app.calculations.muhurta_doctrine import ProvenanceStatus, RuleSource, RuleType
from app.data import marriage_muhurta_rules as marriage
from app.data.muhurta_activity_registry import (
    ACTIVITY_RULES,
    RULE_SOURCE_TABLES,
    ActivityRules,
)

# Same tuple `muhurta_engine._RULE_SOURCE_TABLES` resolves against, rebuilt here
# so the invariant does not import the engine (the engine imports the registry,
# and a check that runs at import time must not join that cycle). The two are
# pinned together by `test_muhurta_source_invariant.py`.
ALL_RULE_SOURCE_TABLES: tuple[dict[str, RuleSource], ...] = (
    marriage.RULE_SOURCES,
    *RULE_SOURCE_TABLES,
)

# The `ActivityRules` fields that name a rule_id. Derived rather than listed, so
# a new `*_rule_id` field is covered by this invariant from the moment it exists
# — the alternative is a hardcoded tuple that silently stops covering the newest
# factor, which is the exact shape of the gap this module was built to close.
RULE_ID_FIELDS: tuple[str, ...] = tuple(
    f.name for f in fields(ActivityRules) if f.name.endswith("_rule_id")
)

# Factors the registry can actually score. Anything else in the rule tables —
# house occupancy, named yogas, day-part, months-from-birth — is sourced on
# purpose and absent from the registry on purpose (see `ActivityRules`'s
# docstring), so it is not expected to be cited and is not reported as stranded.
SCOREABLE_FACTORS: frozenset[str] = frozenset(
    {
        "NAKSHATRA",
        "TITHI",
        "KARANA",
        "VARA",
        "MUHURTA_LAGNA_SIGN",
        "PAKSHA",
        "JANMA_NAKSHATRA",
        "JANMA_TARA_COUNT",
    }
)

# Sourced, scoreable, for a registered activity — and deliberately not wired.
# Each reason is the short form of what the record's own `notes` field argues at
# length; the point of naming them here is that the list is finite and reviewed,
# so a *sixth* stranded rule is a finding rather than more of the same.
HELD_UNWIRED_RULE_IDS: dict[str, str] = {
    "KP_CH3_MILK_FEEDING_JANMA_TARA_001": (
        "Recommends the 10th tara that six other chapters prohibit. The engine's "
        "janma-tara field is a prohibition set; scoring an inverted passage needs "
        "a favourable-count field and an astrologer's ruling first."
    ),
    "KP_CH10_MANTRA_JANMA_TARA_001": (
        "The second of the two passages that invert janma-tara polarity, calling "
        "the janma/Anu-Jenma/Thri-Jenma triad beneficial. Held with the above, "
        "for the same reason and pending the same ruling."
    ),
    "KP_CH7_UPANAYANAM_JANMA_TARA_002": (
        "A second janma-tara ban in the same chapter. Its union with "
        "KP_CH7_UPANAYANAM_JANMA_TARA_001 spans 11 of 27 counts, which is wide "
        "enough that widening the live prohibition set is an owner decision."
    ),
    "KP_CH8_EDUCATION_SUBJECT_001": (
        "Five per-subject star lists. The picker asks what day, not what subject, "
        "and merging the five would erase the distinction the chapter drew."
    ),
    "KP_CH19_SOWING_CROP_TABLES_001": (
        "Per-crop star lists, two of which contradict the chapter's own closed "
        "general list. Wiring them would break the chapter's general rule for "
        "anyone sowing roots."
    ),
}


@dataclass(frozen=True, slots=True)
class SourceViolation:
    kind: str
    activity: str | None
    rule_id: str
    detail: str

    def __str__(self) -> str:  # pragma: no cover - formatting only
        where = f" [{self.activity}]" if self.activity else ""
        return f"{self.kind}{where} {self.rule_id}: {self.detail}"


def cited_rule_ids(rules: ActivityRules) -> tuple[str, ...]:
    """Every rule_id one activity puts its name to, star groups included."""
    from_fields = tuple(
        rule_id for name in RULE_ID_FIELDS if (rule_id := getattr(rules, name))
    )
    return from_fields + tuple(group.rule_id for group in rules.star_groups)


def resolve(rule_id: str) -> RuleSource | None:
    for table in ALL_RULE_SOURCE_TABLES:
        found = table.get(rule_id)
        if found is not None:
            return found
    return None


def _check_record_is_a_citation(
    activity: str, rule_id: str, source: RuleSource
) -> list[SourceViolation]:
    """A record is only a citation if a reader can follow it to a page.

    `provenance_status` alone is not enough — it is a claim the record makes
    about itself, and the fields that would let a reviewer check that claim are
    separate. So the page, the passage and both halves of the verification stamp
    are required independently of the status.
    """
    problems: list[SourceViolation] = []

    def bad(detail: str) -> None:
        problems.append(SourceViolation("incomplete", activity, rule_id, detail))

    if source.rule_id != rule_id:
        problems.append(
            SourceViolation(
                "misfiled",
                activity,
                rule_id,
                f"record is keyed here but calls itself {source.rule_id!r}",
            )
        )
    if source.provenance_status is not ProvenanceStatus.CONFIRMED:
        bad(f"provenance is {source.provenance_status.value}, not CONFIRMED")
    if source.rule_type is not RuleType.TEXTUAL_RULE:
        bad(f"rule_type is {source.rule_type.value}; a scored rule must be textual")
    if not source.authority.tradition:
        bad("no tradition named")
    if not source.authority.chapter:
        bad("no chapter named")
    if source.authority.page is None:
        bad("no page — the citation cannot be followed")
    if not source.authority.verse_or_passage:
        bad("no verse or passage recorded")
    if not source.verified_on:
        bad("no verified_on date")
    if not source.verified_by:
        bad("no verified_by")
    return problems


def validate_muhurta_sources() -> list[SourceViolation]:
    """Every way the activity-to-provenance graph can be broken, in one pass.

    Returns an empty list when `MUH-08` holds. Never raises: a caller that wants
    a hard failure asserts on the result, and gets the whole list to read rather
    than the first item.
    """
    violations: list[SourceViolation] = []

    # ── colliding ids across tables ─────────────────────────────────────────
    seen: dict[str, RuleSource] = {}
    for table in ALL_RULE_SOURCE_TABLES:
        for rule_id, source in table.items():
            previous = seen.get(rule_id)
            if previous is not None and previous != source:
                violations.append(
                    SourceViolation(
                        "colliding",
                        None,
                        rule_id,
                        "carried by two tables with different content, so which "
                        "one resolves depends on table order",
                    )
                )
            seen.setdefault(rule_id, source)

    # ── forward: every cited id resolves, completely and in scope ───────────
    cited: dict[str, str] = {}
    for activity, rules in ACTIVITY_RULES.items():
        permitted_scopes = {activity, *rules.inherits_scope_from}
        for rule_id in cited_rule_ids(rules):
            cited.setdefault(rule_id, activity)
            source = resolve(rule_id)
            if source is None:
                violations.append(
                    SourceViolation(
                        "unresolvable",
                        activity,
                        rule_id,
                        "no RULE_SOURCES table carries this id, so the engine "
                        "reads the factor as having no rule at all",
                    )
                )
                continue
            violations.extend(_check_record_is_a_citation(activity, rule_id, source))
            if source.source_scope not in permitted_scopes:
                violations.append(
                    SourceViolation(
                        "out-of-scope",
                        activity,
                        rule_id,
                        f"confirmed for scope {source.source_scope!r} but cited by "
                        f"{activity!r}; declare it in that activity's "
                        f"inherits_scope_from if the chapter really does group them",
                    )
                )
            if source.authority.chapter != rules.chapter:
                violations.append(
                    SourceViolation(
                        "misfiled",
                        activity,
                        rule_id,
                        f"cited by an activity filed under Ch. {rules.chapter} but "
                        f"the record claims Ch. {source.authority.chapter}",
                    )
                )

    # ── reverse: sourced, scoreable, for a known activity, and never cited ──
    for rule_id, source in seen.items():
        if rule_id in cited or rule_id in HELD_UNWIRED_RULE_IDS:
            continue
        if source.factor not in SCOREABLE_FACTORS:
            continue
        if source.source_scope not in ACTIVITY_RULES:
            continue
        violations.append(
            SourceViolation(
                "stranded",
                source.source_scope,
                rule_id,
                f"a sourced {source.factor} rule for a live activity that the "
                f"registry never cites — either wire it or record why it is held "
                f"in HELD_UNWIRED_RULE_IDS",
            )
        )

    return violations
