from __future__ import annotations

from dataclasses import dataclass
from datetime import date

from app.calculations.astro import house_from_reference
from app.calculations.chart_strength import SIGN_LORD
from app.calculations.transits import classify_kandaka_cycle
from app.services.life_area_prediction_models import AstroFactor, BiText, LifeAreaPrediction


@dataclass(frozen=True, slots=True)
class CareerAssessmentInput:
    as_of: date
    lagna_rasi: int
    planets_rasi: dict[str, int]
    active_dasha_lords: set[str]
    transit_saturn_rasi: int
    age: int
    life_stage: str = "young_adult"
    employment_type: str | None = None
    career_track: str = "general"


def _house_lord(lagna_rasi: int, house: int) -> str:
    house_rasi = ((lagna_rasi + house - 2) % 12) + 1
    return SIGN_LORD[house_rasi]


def assess_career_prediction(payload: CareerAssessmentInput) -> LifeAreaPrediction:
    if payload.age < 18:
        return LifeAreaPrediction(
            life_area="career",
            main_prediction_ta="Career-growth interpretation is age-gated; current focus is learning, health, and family support.",
            main_prediction_en="Career-growth interpretation is age-gated; current focus is learning, health, and family support.",
            astrological_factors=[
                AstroFactor(
                    key="age_phase_gate",
                    status="INFO",
                    detail=BiText(
                        ta=f"Age {payload.age}: career expansion guidance is deferred to later phase.",
                        en=f"Age {payload.age}: career expansion guidance is deferred to later phase.",
                    ),
                )
            ],
            dasha_support="PARTIAL",
            transit_support="PARTIAL",
            timing_window_start=payload.as_of,
            timing_window_end=date(payload.as_of.year, 12, 31),
            confidence="LOW",
            challenges=[BiText("Do not treat this as a career-decision phase.", "Do not treat this as a career-decision phase.")],
            supports=[BiText("Support education, habits, and emotional security first.", "Support education, habits, and emotional security first.")],
        )

    tenth_house_rasi = ((payload.lagna_rasi + 10 - 2) % 12) + 1
    tenth_lord = _house_lord(payload.lagna_rasi, 10)
    sixth_lord = _house_lord(payload.lagna_rasi, 6)
    second_lord = _house_lord(payload.lagna_rasi, 2)
    eleventh_lord = _house_lord(payload.lagna_rasi, 11)
    lagna_lord = _house_lord(payload.lagna_rasi, 1)

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

    planets_in_10th = sorted(
        name for name, rasi in payload.planets_rasi.items() if rasi == tenth_house_rasi
    )
    if planets_in_10th:
        score += 8
        supports.append(BiText("10ம் வீடு செயலில் உள்ளது.", "10th house is activated."))
        factors.append(
            AstroFactor(
                key="tenth_house_occupancy",
                status="SUPPORT",
                detail=BiText(
                    ta=f"10ம் வீட்டில் கிரகங்கள்: {', '.join(planets_in_10th)}.",
                    en=f"Planets in 10th house: {', '.join(planets_in_10th)}.",
                ),
            )
        )

    tenth_lord_house = house_from_reference(payload.lagna_rasi, payload.planets_rasi[tenth_lord])
    if tenth_lord_house in {1, 4, 5, 7, 9, 10, 11}:
        score += 12
        supports.append(BiText("10ம் அதிபதி நல்ல நிலையில் உள்ளது.", "10th lord is in a strong house."))
        factors.append(
            AstroFactor(
                key="tenth_lord_placement",
                status="SUPPORT",
                detail=BiText(
                    ta=f"10ம் அதிபதி {tenth_lord_house}ம் வீட்டில்.",
                    en=f"10th lord is placed in house {tenth_lord_house}.",
                ),
            )
        )
    else:
        score -= 8
        challenges.append(BiText("10ம் அதிபதி சவாலான இடத்தில்.", "10th lord is in a challenging house."))

    lagna_lord_house = house_from_reference(payload.lagna_rasi, payload.planets_rasi[lagna_lord])
    if lagna_lord_house in {1, 3, 6, 10, 11}:
        score += 6
        supports.append(BiText("லக்னம் சார்ந்த செயல்திறன் உதவுகிறது.", "Lagna-lord placement supports execution."))

    sixth_lord_house = house_from_reference(payload.lagna_rasi, payload.planets_rasi[sixth_lord])
    if sixth_lord_house in {3, 6, 10, 11}:
        score += 4
        supports.append(BiText("6ம் வீட்டு வேலை திறன் ஆதரவு.", "6th-house service indicators are supportive."))

    second_lord_house = house_from_reference(payload.lagna_rasi, payload.planets_rasi[second_lord])
    eleventh_lord_house = house_from_reference(payload.lagna_rasi, payload.planets_rasi[eleventh_lord])
    if second_lord_house in {2, 5, 9, 10, 11} and eleventh_lord_house in {2, 5, 9, 10, 11}:
        score += 6
        supports.append(BiText("வருமான வீடுகள் ஆதரிக்கின்றன.", "Income houses are supportive."))

    karaka_alignment = {"SUN", "SATURN", "MERCURY", "MARS"} & payload.active_dasha_lords
    if karaka_alignment:
        score += 8
        supports.append(
            BiText(
                "தொழில் கரக கிரக தசை இணைப்பு உள்ளது.",
                "Career karaka dasha alignment is active.",
            )
        )

    dasha_support = "WEAK"
    if tenth_lord in payload.active_dasha_lords or lagna_lord in payload.active_dasha_lords:
        dasha_support = "STRONG"
        score += 10
    elif karaka_alignment:
        dasha_support = "PARTIAL"

    saturn_house_from_lagna = house_from_reference(payload.lagna_rasi, payload.transit_saturn_rasi)
    kandaka = classify_kandaka_cycle(saturn_house_from_lagna)
    transit_support = "STRONG"
    if saturn_house_from_lagna == 10 and kandaka.is_active:
        transit_support = "WEAK"
        score -= 8
        challenges.append(
            BiText(
                "சனி 10ம் இடம் வழியாக மறுசீரமைப்பு அழுத்தம் தரலாம்.",
                "Saturn through the 10th can indicate restructuring pressure.",
            )
        )
    elif saturn_house_from_lagna in {3, 6, 11}:
        score += 4
        supports.append(BiText("சனி இடம் வளர்ச்சி முயற்சிக்கு துணை.", "Saturn position supports steady growth effort."))

    if payload.life_stage == "student":
        score -= 6
        challenges.append(
            BiText(
                "Student life-stage: focus on foundations before high-risk career moves.",
                "Student life-stage: focus on foundations before high-risk career moves.",
            )
        )
    elif payload.life_stage == "young_adult":
        score += 4
        supports.append(BiText("Young-adult phase supports career foundation building.", "Young-adult phase supports career foundation building."))
    elif payload.life_stage == "mid_life":
        score += 5
        supports.append(BiText("Mid-life phase supports responsibility expansion.", "Mid-life phase supports responsibility expansion."))
    else:
        challenges.append(BiText("Senior phase favours lower-risk transitions.", "Senior phase favours lower-risk transitions."))
    if 24 <= payload.age <= 50:
        score += 5
        supports.append(BiText("வயது கட்டம் தொழில் முன்னேற்றத்திற்கு ஏற்றது.", "Age phase is supportive for career growth."))

    # ── Employment-type karaka adjustment ─────────────────────────────────────
    # Different employment modes activate different house lords as primary karakas.
    if payload.employment_type == "self_employed":
        # Self-employed: 2nd lord (income accumulation) is the critical karaka
        if second_lord in payload.active_dasha_lords:
            score += 6
            supports.append(BiText(
                "சுயதொழிலில் 2ம் அதிபதி தசை — வருமானம் ஆதரிக்கப்படுகிறது.",
                "2nd lord active in dasha — self-employment income is supported.",
            ))
        else:
            challenges.append(BiText(
                "சுயதொழிலில் 2ம் அதிபதி தசையில் இல்லை — வருமானம் தாமதமாகலாம்.",
                "2nd lord not in active dasha — self-employment income may lag.",
            ))
        factors.append(AstroFactor(
            key="employment_second_lord",
            status="SUPPORT" if second_lord in payload.active_dasha_lords else "CAUTION",
            detail=BiText(
                ta=f"சுயதொழில் — 2ம் அதிபதி ({second_lord}) தசை நிலை பரிசீலிக்கப்பட்டது.",
                en=f"Self-employed — 2nd lord ({second_lord}) dasha status evaluated.",
            ),
        ))
    elif payload.employment_type == "business_owner":
        # Business owner: 7th house (partnerships / trade) is the primary karaka
        seventh_lord = _house_lord(payload.lagna_rasi, 7)
        seventh_house_rasi = ((payload.lagna_rasi + 7 - 2) % 12) + 1
        business_planets = sorted(n for n, r in payload.planets_rasi.items() if r == seventh_house_rasi)
        if seventh_lord in payload.active_dasha_lords or business_planets:
            score += 7
            supports.append(BiText(
                "வியாபாரத்திற்கு 7ம் இடம் / அதிபதி ஆதரவு உள்ளது.",
                "7th house supports business partnerships and commerce.",
            ))
        else:
            score -= 3
            challenges.append(BiText(
                "7ம் இட வலு குறைவு — பங்காளர் சிக்கல் கவனிக்கவும்.",
                "7th house weak — watch for partnership risks in business.",
            ))
        factors.append(AstroFactor(
            key="employment_seventh_house",
            status="SUPPORT" if (seventh_lord in payload.active_dasha_lords or business_planets) else "CAUTION",
            detail=BiText(
                ta=f"வியாபாரம் — 7ம் அதிபதி ({seventh_lord}), 7ம் வீட்டு கிரகங்கள்: {', '.join(business_planets) or 'இல்லை'}.",
                en=f"Business — 7th lord ({seventh_lord}), planets in 7th: {', '.join(business_planets) or 'none'}.",
            ),
        ))
    elif payload.employment_type == "retired":
        score -= 5
        challenges.append(BiText(
            "ஓய்வு பெற்ற நிலை — தொழில் மதிப்பீடு பாரம்பரியம் மற்றும் நோக்கத்திற்கு பொருந்தும்.",
            "Retired phase — career scoring applies to legacy and purpose, not active work.",
        ))
        factors.append(AstroFactor(
            key="employment_retired",
            status="INFO",
            detail=BiText(
                ta="ஓய்வு பெற்ற நிலை கணக்கில் எடுக்கப்பட்டது.",
                en="Retired employment status factored into career assessment.",
            ),
        ))
    elif payload.employment_type is not None:
        # Salaried, homemaker, unemployed, student — record for transparency
        factors.append(AstroFactor(
            key="employment_type",
            status="INFO",
            detail=BiText(
                ta=f"வேலை நிலை: {payload.employment_type}.",
                en=f"Employment type: {payload.employment_type}.",
            ),
        ))

    score = max(0, min(100, score))
    if score >= 70:
        confidence = "HIGH"
        main = (
            "தொழில் முன்னேற்றம் மற்றும் பொறுப்பு விரிவுக்கு நல்ல கால அமைப்பு.",
            "Favourable phase for career growth and responsibility expansion.",
        )
    elif score >= 50:
        confidence = "MEDIUM"
        main = (
            "தொழிலில் முன்னேற்ற சிக்னல்கள் உள்ளன; ஆனால் கட்டுப்பாடான திட்டமிடல் அவசியம்.",
            "Career signals are constructive, with disciplined planning needed.",
        )
    else:
        confidence = "LOW"
        main = (
            "தொழில் முடிவுகளில் மிகுதியான அபாயத்தை தவிர்த்து நிலைநிறுத்து அணுகுமுறை பின்பற்றவும்.",
            "Avoid high-risk career moves and focus on stabilising execution.",
        )

    factors.append(
        AstroFactor(
            key="career_track",
            status="INFO",
            detail=BiText(
                ta=f"தொழில் பாதை: {payload.career_track}.",
                en=f"Career track: {payload.career_track}.",
            ),
        )
    )

    return LifeAreaPrediction(
        life_area="career",
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
