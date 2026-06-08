from __future__ import annotations

from dataclasses import dataclass
from datetime import date

from app.calculations.astro import house_from_reference
from app.calculations.chart_strength import DEBILITATION_RASI, EXALTATION_RASI, OWN_SIGN_RASI, SIGN_LORD
from app.calculations.transits import get_jupiter_aspects
from app.services.life_area_prediction_models import AstroFactor, BiText, LifeAreaPrediction


@dataclass(frozen=True, slots=True)
class MarriageAssessmentInput:
    as_of: date
    lagna_rasi: int
    planets_rasi: dict[str, int]
    active_dasha_lords: set[str]
    transit_jupiter_rasi: int
    transit_venus_rasi: int
    age: int
    life_stage: str = "young_adult"
    marital_status: str | None = None
    venus_combust: bool = False
    sevvai_dosham_cancelled: bool = False
    rahu_ketu_label: str | None = None
    d9_rasi_by_planet: dict[str, int] | None = None


def _house_lord(lagna_rasi: int, house: int) -> str:
    house_rasi = ((lagna_rasi + house - 2) % 12) + 1
    return SIGN_LORD[house_rasi]


def assess_marriage_prediction(payload: MarriageAssessmentInput) -> LifeAreaPrediction:
    if payload.age < 18:
        return LifeAreaPrediction(
            life_area="marriage",
            main_prediction_ta="Marriage timing/advice is age-gated; current phase is child development and family care.",
            main_prediction_en="Marriage timing/advice is age-gated; current phase is child development and family care.",
            astrological_factors=[
                AstroFactor(
                    key="age_phase_gate",
                    status="INFO",
                    detail=BiText(
                        ta=f"Age {payload.age}: marriage guidance is not applicable in this phase.",
                        en=f"Age {payload.age}: marriage guidance is not applicable in this phase.",
                    ),
                )
            ],
            dasha_support="PARTIAL",
            transit_support="PARTIAL",
            timing_window_start=payload.as_of,
            timing_window_end=date(payload.as_of.year, 12, 31),
            confidence="LOW",
            challenges=[BiText("Do not use this section for current-life decisions.", "Do not use this section for current-life decisions.")],
            supports=[BiText("Focus on health, bonding, and safe growth routines.", "Focus on health, bonding, and safe growth routines.")],
        )

    seventh_house_rasi = ((payload.lagna_rasi + 7 - 2) % 12) + 1
    seventh_lord = _house_lord(payload.lagna_rasi, 7)
    second_lord = _house_lord(payload.lagna_rasi, 2)
    venus_rasi = payload.planets_rasi["VENUS"]
    seventh_lord_rasi = payload.planets_rasi[seventh_lord]
    second_lord_rasi = payload.planets_rasi[second_lord]

    factors: list[AstroFactor] = []
    supports: list[BiText] = []
    challenges: list[BiText] = []
    score = 50
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
    marital = (payload.marital_status or "").strip().lower()
    if marital == "married":
        score += 3
        supports.append(BiText("Married profile: read this as relationship-harmony guidance.", "Married profile: read this as relationship-harmony guidance."))
    elif payload.life_stage == "student":
        score -= 6
        challenges.append(BiText("Student life-stage: marriage timing is usually not the primary focus.", "Student life-stage: marriage timing is usually not the primary focus."))

    planets_in_7th = sorted(
        name for name, rasi in payload.planets_rasi.items() if rasi == seventh_house_rasi
    )
    if planets_in_7th:
        score += 6
        factors.append(
            AstroFactor(
                key="seventh_house_occupancy",
                status="SUPPORT",
                detail=BiText(
                    ta=f"7ம் வீட்டில் கிரகங்கள் உள்ளன: {', '.join(planets_in_7th)}.",
                    en=f"Planets occupy the 7th house: {', '.join(planets_in_7th)}.",
                ),
            )
        )
        supports.append(BiText("7ம் வீடு செயலில் உள்ளது.", "7th house is activated."))
    else:
        factors.append(
            AstroFactor(
                key="seventh_house_occupancy",
                status="NEUTRAL",
                detail=BiText("7ம் வீட்டில் நேரடி நிரப்பு குறைவு.", "Direct occupancy in 7th house is limited."),
            )
        )

    seventh_lord_house = house_from_reference(payload.lagna_rasi, seventh_lord_rasi)
    if seventh_lord_house in {1, 4, 5, 7, 9, 10, 11}:
        score += 10
        supports.append(BiText("7ம் அதிபதி நல்ல நிலையில் உள்ளது.", "7th lord is in a supportive position."))
        factors.append(
            AstroFactor(
                key="seventh_lord_placement",
                status="SUPPORT",
                detail=BiText(
                    ta=f"7ம் அதிபதி {seventh_lord_house}ம் வீட்டில்.",
                    en=f"7th lord is placed in house {seventh_lord_house}.",
                ),
            )
        )
    else:
        score -= 8
        challenges.append(BiText("7ம் அதிபதி சிரமமான வீட்டில்.", "7th lord is in a challenging house."))
        factors.append(
            AstroFactor(
                key="seventh_lord_placement",
                status="CAUTION",
                detail=BiText(
                    ta=f"7ம் அதிபதி {seventh_lord_house}ம் வீட்டில் கவனம் தேவை.",
                    en=f"7th lord in house {seventh_lord_house} calls for caution.",
                ),
            )
        )

    venus_support = 0
    if venus_rasi in OWN_SIGN_RASI["VENUS"] or venus_rasi == EXALTATION_RASI["VENUS"]:
        venus_support += 10
    if venus_rasi == DEBILITATION_RASI["VENUS"]:
        venus_support -= 8
    if payload.venus_combust:
        venus_support -= 6
    score += venus_support
    factors.append(
        AstroFactor(
            key="venus_strength",
            status="SUPPORT" if venus_support >= 0 else "CAUTION",
            detail=BiText(
                ta="சுக்கிரன் நிலை திருமண சுட்டியை பாதிக்கிறது.",
                en="Venus condition influences marriage indications.",
            ),
        )
    )
    if venus_support >= 0:
        supports.append(BiText("சுக்கிரன் ஆதரவு உள்ளது.", "Venus offers support."))
    else:
        challenges.append(BiText("சுக்கிரன் பலம் குறைவு.", "Venus strength is reduced."))

    second_lord_house = house_from_reference(payload.lagna_rasi, second_lord_rasi)
    if second_lord_house in {1, 2, 4, 5, 7, 9, 10, 11}:
        score += 5
        factors.append(
            AstroFactor(
                key="second_lord_family_support",
                status="SUPPORT",
                detail=BiText("2ம் அதிபதி குடும்ப ஆதரவுக்குத் துணை.", "2nd lord supports family foundation."),
            )
        )

    if payload.d9_rasi_by_planet is not None:
        d9_venus = payload.d9_rasi_by_planet.get("VENUS")
        if d9_venus in OWN_SIGN_RASI["VENUS"] or d9_venus == EXALTATION_RASI["VENUS"]:
            score += 6
            supports.append(BiText("D9-ல் சுக்கிரன் நல்ல நிலை.", "Venus is strong in D9."))
            factors.append(
                AstroFactor(
                    key="d9_venus",
                    status="SUPPORT",
                    detail=BiText("D9 சுக்கிரன் உறவு தரத்தை உறுதிப்படுத்துகிறது.", "D9 Venus reinforces relationship quality."),
                )
            )

    if payload.d9_rasi_by_planet is not None:
        d9_venus = payload.d9_rasi_by_planet.get("VENUS")
        d1_venus_strong = venus_rasi in OWN_SIGN_RASI["VENUS"] or venus_rasi == EXALTATION_RASI["VENUS"]
        if d9_venus == DEBILITATION_RASI["VENUS"] and d1_venus_strong:
            score -= 2
            supports.append(
                BiText(
                    "\u0bb5\u0bc6\u0bb3\u0bbf\u0baa\u0bcd\u0baa\u0bc1\u0bb1 \u0b9a\u0bc2\u0bb4\u0bb2\u0bcd \u0baa\u0bca\u0ba4\u0bc1\u0bb5\u0bbe\u0b95 \u0b86\u0ba4\u0bb0\u0bb5\u0bc1 \u0b89\u0bb3\u0bcd\u0bb3\u0ba4\u0bc1.",
                    "External circumstances remain broadly supportive.",
                )
            )
            challenges.append(
                BiText(
                    "D9-\u0bb2\u0bcd \u0b9a\u0bc1\u0b95\u0bcd\u0b95\u0bbf\u0bb0\u0ba9\u0bcd \u0ba8\u0bc0\u0b9a\u0bae\u0bcd: \u0ba4\u0ba9\u0bbf\u0baa\u0bcd\u0baa\u0b9f\u0bcd\u0b9f \u0baa\u0bca\u0bb0\u0bc1\u0ba4\u0bcd\u0ba4\u0bae\u0bcd \u0bae\u0bbe\u0bb1\u0bc1\u0baa\u0b9f\u0bb2\u0bbe\u0bae\u0bcd.",
                    "D9 Venus debility can make personal compatibility vary.",
                )
            )
            factors.append(
                AstroFactor(
                    key="d9_venus_d1_support_d9_debility",
                    status="CAUTION",
                    detail=BiText(
                        "D1-\u0bb2\u0bcd \u0b9a\u0bc1\u0b95\u0bcd\u0b95\u0bbf\u0bb0\u0ba9\u0bcd \u0baa\u0bb2\u0bae\u0bcd \u0b89\u0bb3\u0bcd\u0bb3\u0ba4\u0bbe\u0bb2\u0bcd \u0bb5\u0bc6\u0bb3\u0bbf\u0baa\u0bcd\u0baa\u0bc1\u0bb1 \u0b86\u0ba4\u0bb0\u0bb5\u0bc1 \u0b87\u0bb0\u0bc1\u0b95\u0bcd\u0b95\u0bc1\u0bae\u0bcd; D9 \u0ba8\u0bbf\u0bb2\u0bc8 \u0ba4\u0ba9\u0bbf\u0baa\u0bcd\u0baa\u0b9f\u0bcd\u0b9f \u0b92\u0ba4\u0bcd\u0ba4\u0bbf\u0b9a\u0bc8\u0bb5\u0bc8 \u0bae\u0bbe\u0bb1\u0bcd\u0bb1\u0bb2\u0bbe\u0bae\u0bcd.",
                        "Strong D1 Venus supports circumstances, while D9 suggests compatibility can fluctuate.",
                    ),
                )
            )

    dasha_support = "WEAK"
    if seventh_lord in payload.active_dasha_lords or "VENUS" in payload.active_dasha_lords:
        dasha_support = "STRONG"
        score += 10
        supports.append(BiText("தசை ஆதரவு இணைந்துள்ளது.", "Dasha support is aligned."))
    else:
        challenges.append(BiText("7ம் அதிபதி அல்லது சுக்கிரன் தசை இல்லை — தசை ஆதரவு குறைவு.", "Current dasha does not include the 7th lord or Venus — dasha support is weak."))

    jupiter_aspects = get_jupiter_aspects(payload.transit_jupiter_rasi)
    transit_support = "WEAK"
    if payload.transit_jupiter_rasi == seventh_house_rasi or seventh_house_rasi in jupiter_aspects or payload.transit_venus_rasi == seventh_house_rasi:
        transit_support = "STRONG"
        score += 8
        supports.append(BiText("கோசார ஆதரவு உள்ளது.", "Transit support is present."))
    else:
        challenges.append(BiText("கோசார ஆதரவு குறைவு.", "Transit support is limited."))

    if 25 <= payload.age <= 35:
        score += 6
        supports.append(BiText("வயது கட்டம் ஆதரிக்கும் நிலை.", "Age phase is supportive."))
    else:
        challenges.append(BiText("வயது கட்டம் மாறுபட்டு உள்ளது.", "Age phase is outside peak range."))

    if not payload.sevvai_dosham_cancelled:
        score -= 6
        challenges.append(BiText("செவ்வாய் தோஷம் கவனத்துடன் அணுக வேண்டும்.", "Sevvai dosham requires caution."))
    else:
        supports.append(BiText("செவ்வாய் தோஷ ரத்து காரணம் உள்ளது.", "Sevvai dosham cancellation factors exist."))
    rahu_ketu_label = (payload.rahu_ketu_label or "").upper()
    if rahu_ketu_label in {"STRONG_ACTIVE_RAHU_KETU_DOSHAM", "ACTIVE_RAHU_KETU_DOSHAM"}:
        score -= 5
        challenges.append(BiText("Rahu-Ketu thodarbu uravu vivarangalil adhiga gavanam thevai.", "Rahu-Ketu factors suggest added relationship caution."))
    elif rahu_ketu_label == "RAHU_KETU_DOSHAM_CANDIDATE":
        score -= 2
        challenges.append(BiText("Rahu-Ketu candidate nilai irukkirathu; thittamitta anugumurai payanullathu.", "Rahu-Ketu candidate signals suggest planning and clarity."))
    elif rahu_ketu_label == "RAHU_KETU_DOSHAM_WITH_NIVARTHI":
        supports.append(BiText("Rahu-Ketu nivarthi karanangal support kodukkindrana.", "Rahu-Ketu mitigation factors are supportive."))
    score = max(0, min(100, score))
    if score >= 70:
        confidence = "HIGH"
        main = (
            "திருமண முன்னேற்றத்திற்கு சாதகமான காலப்போக்கு தெரிகிறது.",
            "Current indicators suggest a supportive phase for marriage progress.",
        )
    elif score >= 50:
        confidence = "MEDIUM"
        main = (
            "திருமண விஷயங்களில் கலப்பு சிக்னல்கள் உள்ளதால் திட்டமிட்ட அணுகுமுறை உதவும்.",
            "Marriage indicators are mixed, so a planned approach will help.",
        )
    else:
        confidence = "LOW"
        main = (
            "திருமண தீர்மானங்களில் அவசரம் தவிர்த்து நிலைமையை மெதுவாக உறுதிப்படுத்தவும்.",
            "Avoid haste in marriage decisions and stabilise conditions gradually.",
        )

    return LifeAreaPrediction(
        life_area="marriage",
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

