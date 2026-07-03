"""Promise gate — D1: promise is a veto, not a weight (Phase 1).

Astrological definition (chief-specialist spec, plan §Phase 1):
a life area is PROMISED when *both*
  - the relevant bhava lord is not fatally afflicted (not in dusthana
    6/8/12 from lagna *and* not combust/debilitated without cancellation),
  - the area's karaka holds a supportive dignity in D1 and in the area's
    varga (D9 for marriage, D10 for career, … — routed by _AREA_ROUTING).

Grades:
  PASS    — both hold → proceed to the timing vote.
  WEAK    — one holds → proceed, but cap the final band at LIKELY.
  BLOCKED — bhava lord fatally afflicted AND karaka debilitated in both
            D1 and the varga → Band.BLOCKED; do NOT run the timing vote.
  SILENT  — karaka/lord data missing, or genuinely neutral on every axis
            → Band.SILENT (the chart is quiet, not saying "no" — D3).

Additive scoring across this gate is the "averaging error" and is banned.
"""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from app.reasoning.verdict import Band, BiText

# Dignity vocabulary shared with the knowledge layer
# (app/calculations/chart_strength.py 9-level table, collapsed for the gate).
FRIENDLY_DIGNITIES: frozenset[str] = frozenset(
    {"EXALTED", "MOOLATRIKONA", "OWN", "FRIEND", "NEUTRAL"}
)
AFFLICTED_DIGNITIES: frozenset[str] = frozenset({"DEBILITATED", "COMBUST"})

_DUSTHANA_HOUSES: frozenset[int] = frozenset({6, 8, 12})


class GateGrade(str, Enum):
    PASS = "PASS"
    WEAK = "WEAK"
    BLOCKED = "BLOCKED"
    SILENT = "SILENT"


# Grade → the band the gate alone dictates when the timing vote is skipped.
GRADE_TO_BAND: dict[GateGrade, Band] = {
    GateGrade.BLOCKED: Band.BLOCKED,
    GateGrade.SILENT: Band.SILENT,
}


@dataclass(frozen=True, slots=True)
class GateResult:
    grade: GateGrade
    reason: BiText
    lord_ok: bool
    karaka_ok: bool

    @property
    def proceeds_to_timing(self) -> bool:
        """Only PASS/WEAK charts get a timing vote (D1)."""
        return self.grade in (GateGrade.PASS, GateGrade.WEAK)


def _reason(grade: GateGrade) -> BiText:
    # Non-fatalistic by doctrine D6: BLOCKED reads as "not indicated /
    # redirect", never "doomed".
    table = {
        GateGrade.PASS: BiText(
            ta="ஜாதக வாக்கு உள்ளது — பாவம் அதிபதியும் காரகனும் ஆதரவாக உள்ளனர்.",
            en="The birth chart promises this area — both the house lord and the karaka are supportive.",
        ),
        GateGrade.WEAK: BiText(
            ta="ஜாதக வாக்கு பகுதியளவே உள்ளது — ஒரு சுட்டி ஆதரவாகவும் மற்றொன்று பலவீனமாகவும் உள்ளது.",
            en="The birth promise is partial — one indicator supports while the other is weak.",
        ),
        GateGrade.BLOCKED: BiText(
            ta="இந்த விஷயத்தில் ஜாதகம் வலுவான வாக்கு தரவில்லை — சாதகமான தசையிலும் இது முதன்மை பாதை அல்ல. ஜாதகம் ஆதரிக்கும் பகுதிகளில் கவனம் செலுத்துவது நல்லது.",
            en="The chart does not strongly promise this — even in a good dasha it is not the primary path. Redirecting focus to areas the chart does support is wiser.",
        ),
        GateGrade.SILENT: BiText(
            ta="இந்த கேள்விக்கு ஜாதகம் அமைதியாக உள்ளது — உறுதியான கணிப்பு தர போதிய சமிக்ஞை இல்லை.",
            en="The chart is quiet on this question — there isn't enough signal for a confident call.",
        ),
    }
    return table[grade]


def assess_promise(
    *,
    bhava_lord_house: int,
    bhava_lord_afflicted: bool,
    karaka_dignity_d1: str,
    karaka_dignity_varga: str,
    karaka_available: bool,
) -> GateResult:
    """Assess whether the natal chart promises a life area (D1 gate).

    Dignity strings use the collapsed vocabulary: EXALTED / MOOLATRIKONA /
    OWN / FRIEND / NEUTRAL / ENEMY / DEBILITATED / COMBUST. Callers that
    lack varga data should pass "NEUTRAL" for karaka_dignity_varga (the
    gate then leans on D1 alone rather than inventing a denial).
    """
    if not karaka_available:
        return GateResult(
            grade=GateGrade.SILENT, reason=_reason(GateGrade.SILENT),
            lord_ok=False, karaka_ok=False,
        )

    lord_ok = bhava_lord_house not in _DUSTHANA_HOUSES and not bhava_lord_afflicted
    karaka_ok = (
        karaka_dignity_d1 in FRIENDLY_DIGNITIES
        and karaka_dignity_varga in FRIENDLY_DIGNITIES
    )

    if lord_ok and karaka_ok:
        return GateResult(GateGrade.PASS, _reason(GateGrade.PASS), lord_ok, karaka_ok)

    # BLOCKED is deliberately strict (chief-specialist spec): the lord must
    # be fatally afflicted AND the karaka afflicted in both D1 and varga.
    # Anything less certain falls to WEAK or SILENT, never BLOCKED (D3).
    if (
        not lord_ok
        and bhava_lord_afflicted
        and karaka_dignity_d1 in AFFLICTED_DIGNITIES
        and karaka_dignity_varga in AFFLICTED_DIGNITIES
    ):
        return GateResult(GateGrade.BLOCKED, _reason(GateGrade.BLOCKED), lord_ok, karaka_ok)

    if lord_ok or karaka_ok:
        return GateResult(GateGrade.WEAK, _reason(GateGrade.WEAK), lord_ok, karaka_ok)

    return GateResult(GateGrade.SILENT, _reason(GateGrade.SILENT), lord_ok, karaka_ok)


def gate_from_l1(
    l1_birth_promise: int,
    *,
    dosham_present: bool = False,
    dosham_cancelled: bool = False,
    dosham_strength: str = "NONE",
) -> GateResult:
    """Convert the legacy L1 birth-promise layer (0–30) into a GateResult.

    Used by compute_prediction_score, whose inputs are pre-aggregated
    strengths rather than raw dignities (plan §Phase 1 step 2).

    Thresholds (L1 max = 30; neutral 50-strength lord+karaka ≈ 11):
      ≥ 16 → PASS, 8–15 → WEAK,
      < 8  → BLOCKED only when an active uncancelled STRONG/MODERATE
             dosham denies the area; otherwise SILENT (weak placements
             without an active affliction are a quiet chart, not a "no").
    """
    if l1_birth_promise >= 16:
        grade = GateGrade.PASS
    elif l1_birth_promise >= 8:
        grade = GateGrade.WEAK
    elif (
        dosham_present
        and not dosham_cancelled
        and dosham_strength in ("STRONG", "MODERATE")
    ):
        grade = GateGrade.BLOCKED
    else:
        grade = GateGrade.SILENT
    lord_ok = grade in (GateGrade.PASS, GateGrade.WEAK)
    return GateResult(grade, _reason(grade), lord_ok=lord_ok, karaka_ok=lord_ok)
