from __future__ import annotations

from dataclasses import dataclass

from app.reasoning.promise_gate import GateGrade, gate_from_l1
from app.reasoning.timing_vote import combine_gate_and_timing


@dataclass
class PredictionScoreInput:
    house_lord_strength: int
    karaka_strength: int
    yoga_present: bool
    yoga_strength: str
    dosham_present: bool
    dosham_cancelled: bool
    dosham_strength: str
    key_planet_strengths: list[int]
    maha_lord_functional_nature: str
    antar_lord_functional_nature: str
    maha_lord_house_connection: bool
    antar_lord_house_connection: bool
    maha_lord_strength: int
    maturation_multiplier: float
    varga_confirmation: int
    jupiter_house_score: int
    saturn_house_score: int
    double_transit_score: int
    is_sade_sati: bool
    is_ashtama_sani: bool
    bav_delta: int
    sav_delta: int
    # EC-RULING-05. Both default to None, meaning "the caller did not evaluate
    # this", which is deliberately NOT the same as "no segmentation applies" or
    # "no mitigation applies". A caller that supplies neither gets exactly the
    # previous flat behaviour, so adding these did not silently re-score every
    # existing surface — they light up as callers start passing them.
    sade_sati_severity: str | None = None
    sade_sati_mitigation_count: int = 0


@dataclass
class PredictionScoreResult:
    total: int
    l1_birth_promise: int
    l2_planet_strength: int
    l3_dasha_activation: int
    l4_varga_confirmation: int
    l5_transit_support: int
    l6_ashtakavarga: int
    interpretation: str
    interpretation_ta: str
    interpretation_en: str
    # Reasoning-gate fields (Phase 1, additive; None on the legacy path).
    # band is ordinal (STRONG/LIKELY/MIXED/WEAK/BLOCKED/SILENT — D2);
    # gate_grade records the promise-gate outcome (PASS/WEAK/BLOCKED/SILENT).
    band: str | None = None
    gate_grade: str | None = None


# EC-RULING-05 (A26 + A25). The cost of Sade Sati by where in the ninety months
# the native actually is, then reduced by each stated mitigation.
#
# The old model charged a flat 4 for all seven and a half years. The traditional
# division says the middle thirty-five months are *comparatively favourable*, so
# charging them the same as the opening sixteen was wrong about roughly half the
# cycle. FAVOURABLE is priced at 1 rather than 0 — the cycle is still running and
# the reading should not pretend otherwise — while the short acute window closing
# Janma Sani costs more than the old flat rate ever did.
#
# The unsegmented value stays 4 exactly, so a caller that has not been updated
# scores identically to before.
_SADE_SATI_PENALTY_BY_SEVERITY: dict[str, int] = {
    "DIFFICULT": 5,
    "FAVOURABLE": 1,
    "ACUTE": 7,
    "MIXED": 3,
}
_SADE_SATI_UNSEGMENTED_PENALTY = 4

#: Each established mitigation lifts one point off, floored so that a mitigated
#: cycle is lighter but never free — the transit is still happening.
_SADE_SATI_MITIGATION_RELIEF = 1
_SADE_SATI_MIN_PENALTY = 1


def _sade_sati_penalty(severity: str | None, mitigation_count: int) -> int:
    """Cost of an active Sade Sati, segmented (A26) and gated (A25)."""
    base = (
        _SADE_SATI_PENALTY_BY_SEVERITY.get(severity, _SADE_SATI_UNSEGMENTED_PENALTY)
        if severity is not None
        else _SADE_SATI_UNSEGMENTED_PENALTY
    )
    relieved = base - _SADE_SATI_MITIGATION_RELIEF * max(0, mitigation_count)
    return max(_SADE_SATI_MIN_PENALTY, relieved)


_YOGA_STRENGTH_BONUS = {"STRONG": 8, "PARTIAL": 4, "WEAK": 1, "NONE": 0}
_DOSHAM_PENALTY = {"STRONG": -10, "MODERATE": -5, "MILD": -2, "NONE": 0}
_FN_DASHA_SCORE = {
    "YOGAKARAKA": 25,
    "LAGNA_LORD": 20,
    "TRIKONA": 18,
    "KENDRA": 12,
    "NEUTRAL": 10,
    "UPACHAYA": 8,
    "MARAKA": 5,
    "DUSTHANA": 3,
}

# Tamil lead adjectives align with the shared verdict lexicon (C-5,
# app/calculations/verdict_lexicon.py): EXCEPTIONAL → மிகச் சிறந்த (excellent
# root), GOOD → நல்ல, MIXED → கலப்பான. STRONG / DIFFICULT / VERY_WEAK keep
# distinct words since this scale has more tiers than the 4-rung ladder.
_INTERPRETATION_SCALE = [
    (91, "EXCEPTIONAL", "மிகச் சிறந்த காலம் — முழு நடவடிக்கை எடுக்கவும்", "Exceptional period — act fully, rare alignment"),
    (76, "STRONG", "வலிமையான ஆதரவு — நம்பிக்கையுடன் முன்னேறவும்", "Strong support — proceed with confidence"),
    (61, "GOOD", "நல்ல வாய்ப்பு — முயற்சியுடன் நல்ல பலன் கிடைக்கும்", "Good chance — result comes with sustained effort"),
    (41, "MIXED", "கலப்பான பலன் — கவனமான திட்டமிடல் தேவை", "Mixed — plan carefully, avoid impulsive decisions"),
    (21, "DIFFICULT", "சவாலான காலம் — மேலும் நல்ல சந்தர்ப்பத்திற்காக காத்திரு", "Difficult — conserve energy, wait for better window"),
    (0, "VERY_WEAK", "இப்போது இந்த விஷயத்தில் பெரிய ஆபத்தை தவிர்க்கவும்", "Avoid major risk in this area during this period"),
]


def compute_prediction_score(
    inp: PredictionScoreInput, *, use_reasoning_gate: bool = False
) -> PredictionScoreResult:
    """Six-layer Thirukanitham prediction score.

    Legacy path (default): flat additive total = L1+…+L6 (unchanged).

    Reasoning-gate path (``use_reasoning_gate=True`` — D1, plan Phase 1):
    L1 birth promise is converted into a hard GATE, not a vote member.
      - BLOCKED/SILENT → return early with that band; total clamped near 0;
        L2–L6 are skipped (no dasha/transit can manufacture an unpromised event).
      - PASS/WEAK → total becomes the TIMING VOTE (L2–L6 rescaled to 0–100,
        "when / how strong", never "whether"); L1 is never re-added.
        A WEAK gate caps the band at LIKELY.
    """
    lord_norm = inp.house_lord_strength / 100.0
    karak_norm = inp.karaka_strength / 100.0
    l1 = round(lord_norm * 14 + karak_norm * 8)
    l1 += _YOGA_STRENGTH_BONUS.get(inp.yoga_strength, 0)
    dosham_pen = _DOSHAM_PENALTY.get(inp.dosham_strength, 0)
    if inp.dosham_present and inp.dosham_cancelled:
        dosham_pen = dosham_pen // 2
    l1 = max(0, min(30, l1 + dosham_pen))

    if use_reasoning_gate:
        gate = gate_from_l1(
            l1,
            dosham_present=inp.dosham_present,
            dosham_cancelled=inp.dosham_cancelled,
            dosham_strength=inp.dosham_strength,
        )
        if not gate.proceeds_to_timing:
            # D1 veto: the chart does not promise this — timing is not consulted.
            total = min(l1, 10) if gate.grade is GateGrade.BLOCKED else min(l1, 20)
            interp = _INTERPRETATION_SCALE[-1]
            for row in _INTERPRETATION_SCALE:
                if total >= row[0]:
                    interp = row
                    break
            return PredictionScoreResult(
                total=total,
                l1_birth_promise=l1,
                l2_planet_strength=0,
                l3_dasha_activation=0,
                l4_varga_confirmation=0,
                l5_transit_support=0,
                l6_ashtakavarga=0,
                interpretation=interp[1],
                interpretation_ta=interp[2],
                interpretation_en=interp[3],
                band=combine_gate_and_timing(gate, 0).value,
                gate_grade=gate.grade.value,
            )
    else:
        gate = None

    if inp.key_planet_strengths:
        avg = sum(inp.key_planet_strengths) / len(inp.key_planet_strengths)
        l2 = round(avg / 100.0 * 15)
    else:
        l2 = 8
    l2 = max(0, min(15, l2))

    maha_base = _FN_DASHA_SCORE.get(inp.maha_lord_functional_nature, 10)
    antar_base = _FN_DASHA_SCORE.get(inp.antar_lord_functional_nature, 10)
    l3 = round(maha_base * 0.6 + antar_base * 0.4)
    if inp.maha_lord_house_connection:
        l3 += 4
    if inp.antar_lord_house_connection:
        l3 += 2
    l3 = round(l3 * inp.maturation_multiplier)
    l3 = max(0, min(25, l3))

    l4 = max(0, min(10, inp.varga_confirmation + 5))

    l5 = 8
    l5 += round(inp.jupiter_house_score * 0.05)
    l5 += round(inp.saturn_house_score * 0.03)
    l5 += round(inp.double_transit_score * 0.4)
    if inp.is_sade_sati:
        l5 -= _sade_sati_penalty(inp.sade_sati_severity, inp.sade_sati_mitigation_count)
    if inp.is_ashtama_sani:
        l5 -= 3
    l5 = max(0, min(15, l5))

    l6 = max(0, min(5, 3 + inp.bav_delta // 2 + inp.sav_delta // 2))

    band: str | None = None
    gate_grade: str | None = None
    if gate is not None:
        # Timing vote: L2–L6 (max 70) rescaled to 0–100. L1 is NOT re-added —
        # the gate already consumed it (re-adding is the banned averaging error).
        timing_score = max(0, min(100, round((l2 + l3 + l4 + l5 + l6) / 70 * 100)))
        total = timing_score
        band = combine_gate_and_timing(gate, timing_score).value
        gate_grade = gate.grade.value
    else:
        total = max(0, min(100, l1 + l2 + l3 + l4 + l5 + l6))

    interp = _INTERPRETATION_SCALE[-1]
    for row in _INTERPRETATION_SCALE:
        if total >= row[0]:
            interp = row
            break

    return PredictionScoreResult(
        total=total,
        l1_birth_promise=l1,
        l2_planet_strength=l2,
        l3_dasha_activation=l3,
        l4_varga_confirmation=l4,
        l5_transit_support=l5,
        l6_ashtakavarga=l6,
        interpretation=interp[1],
        interpretation_ta=interp[2],
        interpretation_en=interp[3],
        band=band,
        gate_grade=gate_grade,
    )

