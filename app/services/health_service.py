from __future__ import annotations

from dataclasses import dataclass
from datetime import date

from app.calculations.astro import house_from_reference
from app.calculations.chart_strength import SIGN_LORD
from app.services.life_area_prediction_models import AstroFactor, BiText, LifeAreaPrediction


@dataclass(frozen=True, slots=True)
class HealthAssessmentInput:
    as_of: date
    lagna_rasi: int
    planets_rasi: dict[str, int]
    active_dasha_lords: set[str]
    age: int
    life_stage: str = "young_adult"
    lagna_strength_score: int = 50
    pitru_dosham_label: str | None = None
    rahu_ketu_label: str | None = None


def _house_lord(lagna_rasi: int, house: int) -> str:
    house_rasi = ((lagna_rasi + house - 2) % 12) + 1
    return SIGN_LORD[house_rasi]


def assess_health_prediction(payload: HealthAssessmentInput) -> LifeAreaPrediction:
    if payload.age < 12:
        return LifeAreaPrediction(
            life_area="health",
            main_prediction_ta="For children, health guidance should prioritize sleep, feeding, hygiene, vaccination schedule, and regular pediatric review.",
            main_prediction_en="For children, health guidance should prioritize sleep, feeding, hygiene, vaccination schedule, and regular pediatric review.",
            astrological_factors=[
                AstroFactor(
                    key="child_health_phase",
                    status="INFO",
                    detail=BiText(
                        ta=f"Age {payload.age}: child-health preventive routines are the primary focus.",
                        en=f"Age {payload.age}: child-health preventive routines are the primary focus.",
                    ),
                ),
                AstroFactor(
                    key="health_safety_note",
                    status="INFO",
                    detail=BiText(
                        ta="This is preventive guidance only and does not replace medical advice.",
                        en="This is preventive guidance only and does not replace medical advice.",
                    ),
                ),
            ],
            dasha_support="PARTIAL",
            transit_support="PARTIAL",
            timing_window_start=payload.as_of,
            timing_window_end=date(payload.as_of.year, 12, 31),
            confidence="MEDIUM",
            challenges=[BiText("If symptoms appear, seek pediatric care early.", "If symptoms appear, seek pediatric care early.")],
            supports=[BiText("Steady routine and caregiver support are the strongest protections now.", "Steady routine and caregiver support are the strongest protections now.")],
        )

    lagna_lord = _house_lord(payload.lagna_rasi, 1)
    sixth_lord = _house_lord(payload.lagna_rasi, 6)
    eighth_lord = _house_lord(payload.lagna_rasi, 8)
    twelfth_lord = _house_lord(payload.lagna_rasi, 12)

    factors: list[AstroFactor] = []
    supports: list[BiText] = []
    challenges: list[BiText] = []
    score = 55
    factors.append(
        AstroFactor(
            key="life_stage",
            status="INFO",
            detail=BiText(
                ta=f"Life stage: {payload.life_stage}.",
                en=f"Life stage: {payload.life_stage}.",
            ),
        )
    )
    if payload.life_stage == "student":
        supports.append(BiText("Student phase: consistency in sleep and routines is the strongest support.", "Student phase: consistency in sleep and routines is the strongest support."))
    elif payload.life_stage == "mid_life":
        supports.append(BiText("Mid-life phase: preventive screening cadence is important.", "Mid-life phase: preventive screening cadence is important."))
    elif payload.life_stage == "senior":
        score -= 3
        challenges.append(BiText("Senior phase: prioritise regular check-ups and recovery pacing.", "Senior phase: prioritise regular check-ups and recovery pacing."))

    if payload.lagna_strength_score >= 65:
        score += 10
        supports.append(BiText("லக்ன பலம் மீட்பு திறனை ஆதரிக்கிறது.", "Lagna strength supports recovery capacity."))
        lagna_status = "SUPPORT"
    elif payload.lagna_strength_score <= 40:
        score -= 10
        challenges.append(BiText("லக்ன பலம் குறைவு; ஒழுங்கான பராமரிப்பு அவசியம்.", "Lagna strength is low; disciplined care is important."))
        lagna_status = "CAUTION"
    else:
        lagna_status = "NEUTRAL"
    factors.append(
        AstroFactor(
            key="lagna_strength",
            status=lagna_status,
            detail=BiText(
                ta=f"லக்ன பல மதிப்பு: {payload.lagna_strength_score}.",
                en=f"Lagna strength score: {payload.lagna_strength_score}.",
            ),
        )
    )

    lagna_lord_house = house_from_reference(payload.lagna_rasi, payload.planets_rasi[lagna_lord])
    if lagna_lord_house in {1, 4, 5, 9, 10, 11}:
        score += 8
        supports.append(BiText("லக்ன அதிபதி நல்ல வீட்டில் உள்ளது.", "Lagna lord is in a supportive house."))
    else:
        score -= 6
        challenges.append(BiText("லக்ன அதிபதி சவாலான நிலையில் உள்ளது.", "Lagna lord is in a challenging position."))

    for house_name, lord in [("6th", sixth_lord), ("8th", eighth_lord), ("12th", twelfth_lord)]:
        lord_house = house_from_reference(payload.lagna_rasi, payload.planets_rasi[lord])
        if lord_house in {6, 8, 12}:
            score -= 4
            challenges.append(
                BiText(
                    f"{house_name} வீட்டு அதிபதி பாதிப்பு சிக்னல் தருகிறது.",
                    f"{house_name} house-lord placement indicates caution.",
                )
            )
        else:
            score += 2

    affliction_count = 0
    for graha in ("SATURN", "MARS", "RAHU"):
        house_from_lagna = house_from_reference(payload.lagna_rasi, payload.planets_rasi[graha])
        if house_from_lagna in {1, 6, 8, 12}:
            affliction_count += 1
    if affliction_count >= 2:
        score -= 8
        challenges.append(BiText("சனி/செவ்வாய்/ராகு அழுத்தம் அதிகம்.", "Saturn/Mars/Rahu pressure is elevated."))
    elif affliction_count == 0:
        score += 4
        supports.append(BiText("கடின கிரக அழுத்தம் குறைவாக உள்ளது.", "Heavy-planet pressure is limited."))
    factors.append(
        AstroFactor(
            key="afflictions",
            status="CAUTION" if affliction_count >= 2 else "SUPPORT",
            detail=BiText(
                ta=f"அழுத்த எண்ணிக்கை: {affliction_count}.",
                en=f"Affliction count: {affliction_count}.",
            ),
        )
    )

    dasha_support = "STRONG"
    if sixth_lord in payload.active_dasha_lords or eighth_lord in payload.active_dasha_lords:
        score -= 8
        dasha_support = "WEAK"
        challenges.append(BiText("6/8ம் அதிபதி தசை காலம் கவனம் தேவை.", "6th/8th lord dasha calls for extra care."))
    elif lagna_lord in payload.active_dasha_lords:
        score += 6
        supports.append(BiText("லக்ன அதிபதி தசை மீட்பு ஆதரவு தரும்.", "Lagna-lord dasha supports recovery."))

    if payload.age >= 50:
        score -= 4
        challenges.append(BiText("வயது காரணமாக தடுப்பு பராமரிப்பு முக்கியம்.", "Preventive care becomes more important with age."))
    rahu_ketu_label = (payload.rahu_ketu_label or "").upper()
    if rahu_ketu_label in {"STRONG_ACTIVE_RAHU_KETU_DOSHAM", "ACTIVE_RAHU_KETU_DOSHAM"}:
        score -= 3
        challenges.append(BiText("Rahu-Ketu azhutham irukkum kaalangalil nithanam mukkiyam.", "Rahu-Ketu pressure periods call for steady routines."))

    pitru_label = (payload.pitru_dosham_label or "").upper()
    if pitru_label == "STRONG_ACTIVE_DOSHAM":
        score -= 2
        challenges.append(BiText("Pitru sambandha manasika bhaaram varalam; routine support thevai.", "Pitru-linked stress sensitivity may rise; routine support helps."))
    score = max(0, min(100, score))
    if score >= 70:
        confidence = "HIGH"
        main = (
            "ஆரோக்கிய நிலை மேலாண்மைக்கு நல்ல ஆதரவு உள்ளது; தடுப்பு பழக்கங்களை தொடரவும்.",
            "Health-management support is good; continue preventive routines.",
        )
    elif score >= 50:
        confidence = "MEDIUM"
        main = (
            "ஆரோக்கிய சிக்னல்கள் கலப்பு நிலையில் உள்ளதால் ஒழுங்கான வாழ்க்கை முறை அவசியம்.",
            "Health indicators are mixed, so consistent routine and monitoring are important.",
        )
    else:
        confidence = "LOW"
        main = (
            "உடல் அறிகுறிகளை புறக்கணிக்காமல் உடனடி தடுப்பு அணுகுமுறையை பின்பற்றவும்.",
            "Do not ignore symptoms; follow a prompt preventive-care approach.",
        )

    transit_support = "PARTIAL"
    factors.append(
        AstroFactor(
            key="health_safety_note",
            status="INFO",
            detail=BiText(
                ta="இந்த மதிப்பீடு முன்கூட்டிய பராமரிப்பு வழிகாட்டல் மட்டுமே; மருத்துவ ஆலோசனையை மாற்றாது.",
                en="This assessment is preventive guidance only and does not replace medical advice.",
            ),
        )
    )

    return LifeAreaPrediction(
        life_area="health",
        main_prediction_ta=main[0],
        main_prediction_en=main[1],
        astrological_factors=factors,
        dasha_support=dasha_support,
        transit_support=transit_support,
        timing_window_start=payload.as_of,
        timing_window_end=date(payload.as_of.year, 12, 31),
        confidence=confidence,
        challenges=challenges,
        supports=supports,
    )

