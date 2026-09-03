"""C-5 — what is and is not certified about each secondary dasha system.

`DAS-06` marks Ashtottari, Yogini, Kalachakra and the conditional family
`[LIMIT]`: they may be calculated and displayed where eligible, but must not
silently override the primary Vimshottari reading. `DAS-07` does the same for
Chara Dasha, and `DAS-08` marks the Jaimini 8-karaka scheme `[VARIANT]`.

Those markers are a **guard**, and the guard is the right call. What they are
not is a **certification**. "This system cannot reach interpretation" says
nothing about whether its arithmetic is right, and the two get conflated the
moment someone decides a system looks stable enough to promote. This module
separates them, per system, into three things a reader can act on:

* `certified` — verified by test over the **whole input domain**, not sampled.
  Every claim here is pinned by `tests/test_secondary_dasha_certification.py`.
* `uncertified` — known-unverified, with what would close it. These are the
  items that need a second source or an astrologer, and naming them is the
  point: an empty `uncertified` list on an experimental system is the failure
  mode this module exists to prevent.
* `may_feed_interpretation` — the `[LIMIT]` itself, made executable. The test
  suite walks the import closure of the interpretive services and fails if a
  system marked False has reached them.

**A certified arithmetic is not a ratified doctrine.** Everything below
certifies that the implementation computes what its own cited source describes,
consistently and across every input. Whether that source is the right one for a
Tamil audience — Ardra-adi versus Krittika-adi for Ashtottari, the Kalachakra
pada tables, which savya/apasavya split Chara Dasha follows — is a doctrine
question this file deliberately does not answer, and each entry says so.
"""
from __future__ import annotations

from dataclasses import dataclass, field

from app.calculations import (
    ashtottari_dasha,
    conditional_dashas,
    kalachakra_dasha,
    yogini_dasha,
)


@dataclass(frozen=True, slots=True)
class DashaCertification:
    """One secondary system's verification status."""

    key: str
    display_name: str
    rulebook_id: str
    marker: str
    # Total years in one full cycle, or None where the system has no single
    # cycle length (Kalachakra's paramayus depends on the natal pada).
    cycle_years: float | None
    # Number of distinct lords/rasis in one cycle.
    lord_count: int
    # The named source the implementation follows.
    source: str
    # The eligibility rule in words. Systems that apply to every chart say so
    # explicitly — "no gate" is a finding to record, not a field to leave blank.
    eligibility_rule: str
    # Name of the function that evaluates eligibility, or None where the system
    # has no gate. Pinned by test, so adding an evaluator forces this entry to
    # be updated rather than leaving a stale None.
    eligibility_evaluator: str | None
    # `DAS-06`/`DAS-07`. False means: no interpretive service may import this.
    may_feed_interpretation: bool
    certified: tuple[str, ...] = ()
    uncertified: tuple[str, ...] = field(default=())


SECONDARY_DASHA_CERTIFICATIONS: dict[str, DashaCertification] = {
    "ASHTOTTARI": DashaCertification(
        key="ASHTOTTARI",
        display_name="Ashtottari Dasha",
        rulebook_id="DAS-06",
        marker="[LIMIT]",
        cycle_years=ashtottari_dasha.TOTAL_CYCLE_YEARS,
        lord_count=len(ashtottari_dasha.ASHTOTTARI_SEQUENCE),
        source="B. V. Raman's Ardra-adi grouping (v1), corroborated against Satyori",
        eligibility_rule=(
            "Rahu occupies a kendra or trikona from the lord of the lagna, and "
            "not the lagna itself. Paksha/day-night is recorded as a secondary "
            "qualifier and never as the primary test."
        ),
        eligibility_evaluator="evaluate_ashtottari_applicability",
        may_feed_interpretation=False,
        certified=(
            "the eight lords' years sum to 108 exactly",
            "the opening lord is correct at every one of the 27 nakshatras",
            "the opening balance falls monotonically from full to zero across "
            "each nakshatra's own span",
            "mahadashas run contiguously with no gap or overlap, for every "
            "nakshatra, across three full cycles",
            "antardashas partition their parent exactly, including the clipped "
            "opening mahadasha",
            "the applicability rule reads Rahu from the lagna *lord*, not from "
            "the lagna, and returns indeterminate rather than False when Rahu "
            "is missing",
        ),
        uncertified=(
            "Ardra-adi (Raman) versus Krittika-adi (BPHS/Santhanam) — the two "
            "groupings assign different opening lords for the same Moon, and "
            "this repository follows Raman. An astrologer's ruling, not a test, "
            "closes this.",
            "whether the paksha qualifier should ever be promoted to a primary "
            "eligibility test",
        ),
    ),
    "YOGINI": DashaCertification(
        key="YOGINI",
        display_name="Yogini Dasha",
        rulebook_id="DAS-06",
        marker="[LIMIT]",
        cycle_years=yogini_dasha.TOTAL_CYCLE_YEARS,
        lord_count=len(yogini_dasha.YOGINI_SEQUENCE),
        source="BPHS-adjacent; Devi Bhagavata / Muhurta Chintamani tradition",
        eligibility_rule=(
            "None. Yogini applies to every chart — the opening yogini is a "
            "function of the natal nakshatra alone. Recorded explicitly so that "
            "'no evaluator' reads as a finding rather than an omission."
        ),
        eligibility_evaluator=None,
        may_feed_interpretation=False,
        certified=(
            "the eight yoginis' years sum to 36 exactly",
            "the opening yogini is (nakshatra + 3) mod 8 at every nakshatra, "
            "with remainder zero mapping to Sankata rather than falling off the "
            "sequence",
            "the sequence never reverses, at any starting point",
            "mahadashas run contiguously across four full cycles",
            "antardashas partition their parent exactly",
        ),
        uncertified=(
            "the antardasha proportioning convention — Yogini antardashas are "
            "given more than one way in circulation, and only the "
            "proportional-to-cycle reading is implemented",
            "whether the Tamil lineage this product serves uses Yogini at all, "
            "which is a product question ahead of an arithmetic one",
        ),
    ),
    "KALACHAKRA": DashaCertification(
        key="KALACHAKRA",
        display_name="Kalachakra Dasha",
        rulebook_id="DAS-06",
        marker="[LIMIT]",
        # Paramayus varies by pada (savya/apasavya groups), so there is no one
        # cycle length. The per-pada totals are certified instead.
        cycle_years=None,
        lord_count=len(kalachakra_dasha.RASI_YEARS),
        source="Standard savya/apasavya pada tables; NO independent second source",
        eligibility_rule=(
            "None. Kalachakra applies to every chart — the pada of the natal "
            "Moon selects the chakra and its rasi sequence."
        ),
        eligibility_evaluator=None,
        may_feed_interpretation=False,
        certified=(
            "every one of the pada sequences sums to its own declared paramayus",
            "the nakshatra-to-group table covers all 27 nakshatras exactly once",
            "each chakra's direction matches its group",
            "the opening rasi and balance are correct at every nakshatra-pada, "
            "all 108 of them",
            "mahadashas run contiguously with no gap or overlap for every one "
            "of the 108 padas",
            "antardashas partition their parent exactly",
        ),
        uncertified=(
            "the pada tables themselves have NO independent second source in "
            "this repository. This is the weakest link in the family and the "
            "reason Kalachakra is described as experimental — a transcription "
            "error in one pada row would be internally consistent and would "
            "pass every test above.",
            "the antardasha sub-division method, of which several circulate",
        ),
    ),
    "CONDITIONAL": DashaCertification(
        key="CONDITIONAL",
        display_name="Conditional dasha family (Shashtihayani, Chaturashiti, …)",
        rulebook_id="DAS-06",
        marker="[LIMIT]",
        cycle_years=None,  # one per system; certified per-system instead
        lord_count=len(conditional_dashas.CONDITIONAL_DASHA_SYSTEMS),
        source="BPHS conditional-dasha chapter, per-system nakshatra groupings",
        eligibility_rule=(
            "One per system, each a natal placement test (Sun in lagna for "
            "Shashtihayani, 10th lord in the 10th for Chaturashiti, and so on). "
            "Evaluated together so a chart can be told which of the family it "
            "qualifies for."
        ),
        eligibility_evaluator="evaluate_applicability",
        may_feed_interpretation=False,
        certified=(
            "each system's lord years sum to its declared total",
            "each system's sequence and years table name the same lords",
            "the engine reproduces Vimshottari exactly when run on Vimshottari's "
            "own parameters — the strongest available check on the generalised "
            "machinery, because Vimshottari is independently verified",
            "Shashtihayani's degree-block grouping, which is not a mod-8 walk "
            "and disagrees with one at Bharani",
            "opening balance is full at a nakshatra's start and half at its "
            "midpoint, for every system",
        ),
        uncertified=(
            "the per-system nakshatra groupings beyond Shashtihayani have one "
            "source each",
            "which member of the family, if any, a chart should actually be "
            "read by when it qualifies for several",
        ),
    ),
    "CHARA": DashaCertification(
        key="CHARA",
        display_name="Jaimini Chara Dasha",
        rulebook_id="DAS-07",
        marker="[LIMIT]",
        cycle_years=None,  # rasi periods are 1..12 years by lord placement
        lord_count=12,
        source="BPHS / K. N. Rao chara dasha rules",
        eligibility_rule=(
            "None as a calculation. `DAS-07` withholds it from interpretive "
            "output until the full rule set is confirmed, which is a gate on "
            "*use*, not on the chart."
        ),
        eligibility_evaluator=None,
        may_feed_interpretation=False,
        certified=(
            "savya rasis count forward and apasavya rasis backward",
            "an own-sign lord gives twelve years regardless of group",
            "Scorpio and Aquarius dual-lord resolution, including the occupancy, "
            "companion-count and degree tie-breaks",
            "antardasha direction follows the mahadasha rasi, not the lagna",
            "a native past one full cycle still resolves to a running period",
        ),
        uncertified=(
            "`DAS-07` names direction, own-sign length and dual-lord resolution "
            "as the three rules to confirm. All three are implemented and "
            "tested; what is missing is an astrologer confirming the "
            "implementation matches the lineage, which no test can supply.",
        ),
    ),
    "CHARA_KARAKA": DashaCertification(
        key="CHARA_KARAKA",
        display_name="Jaimini Chara Karakas (8-karaka, reverse Rahu)",
        rulebook_id="DAS-08",
        marker="[VARIANT]",
        cycle_years=None,
        lord_count=8,
        source="BPHS Ch. 32; K. N. Rao / Sanjay Rath reverse-Rahu convention",
        eligibility_rule="None. Every chart has a full karaka assignment.",
        eligibility_evaluator=None,
        # The only True in this file. Karakas are not a dasha and `DAS-08` is a
        # [VARIANT], not a [LIMIT]: `chart_signature` reads the Atmakaraka. The
        # certification below is therefore load-bearing in a way the others are
        # not — this one is live.
        may_feed_interpretation=True,
        certified=(
            "Rahu's effective degree is 30 minus its advancement, not its "
            "advancement — the [VARIANT] `DAS-08` names",
            "Ketu is excluded even when it holds the highest degree",
            "all eight karakas are assigned, in strictly descending effective "
            "degree, for every chart with all eight candidates",
            "the tie-break follows the documented classical dignity order and "
            "not dict insertion order",
            "reversing Rahu changes the Atmakaraka on charts where it should, "
            "so the convention is demonstrably load-bearing",
        ),
        uncertified=(
            "the 8-karaka scheme versus the 7-karaka (planets-only) variant. "
            "This repository ratified 8; some lineages drop Daarakaraka and "
            "fold spouse significations elsewhere. `DAS-08` asks for output to "
            "be checked against the standard before public interpretation, and "
            "the Atmakaraka is already read by `chart_signature`.",
        ),
    ),
}

# The interpretive surface. A `[LIMIT]` system must not be reachable from any of
# these, directly or transitively. Listed by module path rather than discovered,
# because "everything that produces a reading" is a product judgement and this
# is where that judgement is written down — a new reading service belongs here.
INTERPRETIVE_MODULES: tuple[str, ...] = (
    "app.services.daily_guidance_service",
    "app.services.one_minute_reading_service",
    "app.services.five_minute_reading_service",
    "app.services.chart_explanation_service",
    "app.services.life_areas_service",
    "app.services.propensity_service",
    "app.services.narrative_engine",
    "app.services.decisions_service",
    "app.services.qa_service",
    "app.services.whatif_service",
    "app.services.retrospective_service",
    "app.services.dasha_service",
    "app.services.dasha_transition_service",
    "app.calculations.prediction_score",
    "app.calculations.propensities",
    "app.calculations.dasha_activation",
    "app.calculations.remedies",
    "app.calculations.event_windows",
)

# Calculation modules a `[LIMIT]` system lives in. Reaching any interpretive
# module above from one of these is the violation `DAS-06`/`DAS-07` describe.
LIMITED_DASHA_MODULES: dict[str, str] = {
    "app.calculations.ashtottari_dasha": "ASHTOTTARI",
    "app.calculations.yogini_dasha": "YOGINI",
    "app.calculations.kalachakra_dasha": "KALACHAKRA",
    "app.calculations.conditional_dashas": "CONDITIONAL",
    "app.calculations.jaimini_dasha": "CHARA",
}
