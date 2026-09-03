"""RULE_SOURCE provenance schema for Thirukkanitham muhurta doctrine.

Every muhurta rule sourced from a classical text (Kalaprakasika and, later,
other primary sources) carries a machine-readable provenance record instead
of a prose citation. This is what lets the engine answer "why did you allow
Moolam?" with a page and a passage instead of "the scoring model liked it."

See `docs/MUHURTA_ENGINE_AUTHORITATIVE_INPUTS_v2_2026-08-14.md` (RULE_SOURCE
section) for the design this module implements verbatim, and
`docs/MARRIAGE_EXTRACTION_WORKSHEET_KALAPRAKASIKA_CH14_2026-08-14.yaml` for
the first worked extraction that populates it (`app/data/marriage_muhurta_rules.py`).

This module is provenance plumbing only — it does not score anything.
Nothing here reaches into panchangam/chart data; the L0-L9 scoring engine
that consumes these records is a separate, later piece of work.
"""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class Severity(str, Enum):  # noqa: UP042 — str-mixin enum kept; StrEnum changes str()/format() output
    """The rule's *effect* on a candidate muhurta. Never add members — a rule
    needing a seventh state almost certainly wants `PolicyClass` instead."""

    HARD_VETO = "HARD_VETO"
    SEVERE_PENALTY = "SEVERE_PENALTY"
    PENALTY = "PENALTY"
    NEUTRAL = "NEUTRAL"
    BONUS = "BONUS"
    STRONG_BONUS = "STRONG_BONUS"


class PolicyClass(str, Enum):  # noqa: UP042 — str-mixin enum kept, as above
    """Priority/classification axis, separate from `Severity`. A rule may
    carry both, e.g. `policy_class=HIGH_PRIORITY_RESTRICTION` +
    `severity=HARD_VETO` once the source settles the effect."""

    HIGH_PRIORITY_RESTRICTION = "HIGH_PRIORITY_RESTRICTION"


class ProvenanceStatus(str, Enum):  # noqa: UP042 — str-mixin enum kept, as above
    CONFIRMED = "CONFIRMED"
    TRADITIONALLY_REPORTED = "TRADITIONALLY_REPORTED"
    PENDING = "PENDING"
    ENGINE_CONCEPT = "ENGINE_CONCEPT"


class RuleType(str, Enum):  # noqa: UP042 — str-mixin enum kept, as above
    TEXTUAL_RULE = "TEXTUAL_RULE"      # a claim about what the source text says
    INTERPRETATION = "INTERPRETATION"  # how to compute/apply an ambiguous textual term
    ENGINE_POLICY = "ENGINE_POLICY"    # Vinaadi's own product decision, no textual authority


class SourceConfidence(str, Enum):  # noqa: UP042 — str-mixin enum kept, as above
    EXACT = "EXACT"
    INTERPRETED = "INTERPRETED"
    SECONDARY = "SECONDARY"


class VerificationOutcome(str, Enum):  # noqa: UP042 — str-mixin enum kept, as above
    """Controlled vocabulary from the extraction worksheet. NOT_FOUND is not
    FALSE — it means "searched this chapter, no supporting passage"."""

    CONFIRMED_EXACT = "CONFIRMED_EXACT"
    CONFIRMED_WITH_CONDITION = "CONFIRMED_WITH_CONDITION"
    PARTIAL = "PARTIAL"
    CONTRADICTED = "CONTRADICTED"
    NOT_FOUND = "NOT_FOUND"
    SCHOOL_VARIANT = "SCHOOL_VARIANT"
    OUT_OF_SCOPE = "OUT_OF_SCOPE"
    TRANSLATION_AMBIGUOUS = "TRANSLATION_AMBIGUOUS"


_PRIMARY_TEXT_CONFIRMED_OUTCOMES = frozenset(
    {VerificationOutcome.CONFIRMED_EXACT, VerificationOutcome.CONFIRMED_WITH_CONDITION}
)


@dataclass(frozen=True, slots=True)
class Authority:
    """Where a claim comes from. `page`/`verse_or_passage` are required for
    anything claiming `PRIMARY_TEXT_CONFIRMED` — see `RuleSource.is_primary_text_confirmed`."""

    tradition: str | None
    chapter: str | None
    page: int | str | None
    verse_or_passage: str | None
    translation_edition: str | None = None
    original_language_term: str | None = None


@dataclass(frozen=True, slots=True)
class RuleSource:
    """Provenance record for one doctrine rule.

    `source_scope` is load-bearing: a `TEXTUAL_RULE` confirmed in a NATAL
    chapter (e.g. gandanta) must never be read as confirmed for MUHURTA/
    election scope just because the wording is verbatim. Scope stops that
    silent promotion — always compare `source_scope` against where the rule
    is about to be *used*, not just whether provenance is CONFIRMED.
    """

    rule_id: str
    factor: str
    activity: str
    authority: Authority
    provenance_status: ProvenanceStatus
    source_scope: str
    rule_type: RuleType
    source_confidence: SourceConfidence | None = None
    outcome: VerificationOutcome | None = None
    interpretation: str | None = None
    notes: str | None = None
    verified_on: str | None = None
    verified_by: str | None = None

    # A bhanga/exception resolves ABOVE the primary rule it modifies (RULE_PRECEDENCE
    # level 1) — otherwise "lower never overrides higher" would make every exception
    # dead code. Prefer attaching an exception here, local to the rule it modifies,
    # over relying on cross-rule precedence.
    exceptions: tuple[str, ...] = ()
    # Populate ONLY when the source text explicitly says this rule cancels or
    # supersedes another. Praising a combination as auspicious is not an override:
    # a favourable yoga must not rescue a prohibited house occupancy without the
    # text saying so.
    overrides: tuple[str, ...] = ()
    overridden_by: tuple[str, ...] = ()

    def is_primary_text_confirmed(self) -> bool:
        """PRIMARY_TEXT_CONFIRMED eligibility per the v2.3 spec: outcome is
        CONFIRMED_EXACT or CONFIRMED_WITH_CONDITION, rule_type is
        TEXTUAL_RULE, and the passage is actually recorded.

        CONFIRMED_WITH_CONDITION is not weaker provenance — "X allowed
        provided Y" is a fully-sourced conditional rule and must not be
        excluded merely for carrying a condition.
        """
        return (
            self.outcome in _PRIMARY_TEXT_CONFIRMED_OUTCOMES
            and self.rule_type is RuleType.TEXTUAL_RULE
            and bool(self.authority.verse_or_passage)
        )
