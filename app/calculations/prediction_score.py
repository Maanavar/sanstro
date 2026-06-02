from __future__ import annotations

from dataclasses import dataclass


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

_INTERPRETATION_SCALE = [
    (91, "EXCEPTIONAL", "மிகவும் சிறப்பான காலம் — முழு நடவடிக்கை எடுக்கவும்", "Exceptional period — act fully, rare alignment"),
    (76, "STRONG", "வலிமையான ஆதரவு — நம்பிக்கையுடன் முன்னேறவும்", "Strong support — proceed with confidence"),
    (61, "GOOD", "நல்ல வாய்ப்பு — முயற்சியுடன் நல்ல பலன் கிடைக்கும்", "Good chance — result comes with sustained effort"),
    (41, "MIXED", "கலப்பான பலன் — கவனமான திட்டமிடல் தேவை", "Mixed — plan carefully, avoid impulsive decisions"),
    (21, "DIFFICULT", "சவாலான காலம் — மேலும் நல்ல சந்தர்ப்பத்திற்காக காத்திரு", "Difficult — conserve energy, wait for better window"),
    (0, "VERY_WEAK", "இப்போது இந்த விஷயத்தில் பெரிய ஆபத்தை தவிர்க்கவும்", "Avoid major risk in this area during this period"),
]


def compute_prediction_score(inp: PredictionScoreInput) -> PredictionScoreResult:
    lord_norm = inp.house_lord_strength / 100.0
    karak_norm = inp.karaka_strength / 100.0
    l1 = round(lord_norm * 14 + karak_norm * 8)
    l1 += _YOGA_STRENGTH_BONUS.get(inp.yoga_strength, 0)
    dosham_pen = _DOSHAM_PENALTY.get(inp.dosham_strength, 0)
    if inp.dosham_present and inp.dosham_cancelled:
        dosham_pen = dosham_pen // 2
    l1 = max(0, min(30, l1 + dosham_pen))

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
        l5 -= 4
    if inp.is_ashtama_sani:
        l5 -= 3
    l5 = max(0, min(15, l5))

    l6 = max(0, min(5, 3 + inp.bav_delta // 2 + inp.sav_delta // 2))

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
    )

