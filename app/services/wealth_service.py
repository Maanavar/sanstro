from __future__ import annotations

from dataclasses import dataclass
from datetime import date

from app.calculations.astro import house_from_reference
from app.calculations.ashtakavarga import compute_bhinnashtakavarga, get_av_bindu
from app.calculations.chart_strength import SIGN_LORD
from app.services.life_area_prediction_models import AstroFactor, BiText, LifeAreaPrediction


@dataclass(frozen=True, slots=True)
class WealthAssessmentInput:
    as_of: date
    lagna_rasi: int
    planets_rasi: dict[str, int]
    active_dasha_lords: set[str]
    transit_jupiter_rasi: int
    has_dhana_yoga: bool
    age: int
    life_stage: str = "young_adult"
    ashtakavarga_11th_bindu: int | None = None
    pitru_dosham_label: str | None = None
    rahu_ketu_label: str | None = None


def _house_lord(lagna_rasi: int, house: int) -> str:
    house_rasi = ((lagna_rasi + house - 2) % 12) + 1
    return SIGN_LORD[house_rasi]


def _derived_11th_bindu(payload: WealthAssessmentInput, eleventh_house_rasi: int) -> int:
    if payload.ashtakavarga_11th_bindu is not None:
        return payload.ashtakavarga_11th_bindu
    required = {"SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN"}
    if not required.issubset(payload.planets_rasi):
        return 4
    bav = compute_bhinnashtakavarga(
        {
            "SUN": payload.planets_rasi["SUN"],
            "MOON": payload.planets_rasi["MOON"],
            "MARS": payload.planets_rasi["MARS"],
            "MERCURY": payload.planets_rasi["MERCURY"],
            "JUPITER": payload.planets_rasi["JUPITER"],
            "VENUS": payload.planets_rasi["VENUS"],
            "SATURN": payload.planets_rasi["SATURN"],
            "LAGNA": payload.lagna_rasi,
        }
    )
    return get_av_bindu(bav, "JUPITER", eleventh_house_rasi)


def assess_wealth_prediction(payload: WealthAssessmentInput) -> LifeAreaPrediction:
    if payload.age < 18:
        return LifeAreaPrediction(
            life_area="wealth",
            main_prediction_ta="Personal wealth-growth advice is age-gated; this phase is about family-managed protection and habit-building.",
            main_prediction_en="Personal wealth-growth advice is age-gated; this phase is about family-managed protection and habit-building.",
            astrological_factors=[
                AstroFactor(
                    key="age_phase_gate",
                    status="INFO",
                    detail=BiText(
                        ta=f"Age {payload.age}: long-term wealth decisions are usually parent/guardian managed.",
                        en=f"Age {payload.age}: long-term wealth decisions are usually parent/guardian managed.",
                    ),
                )
            ],
            dasha_support="PARTIAL",
            transit_support="PARTIAL",
            timing_window_start=payload.as_of,
            timing_window_end=date(payload.as_of.year, 12, 31),
            confidence="LOW",
            challenges=[BiText("Avoid interpreting this as immediate investment timing.", "Avoid interpreting this as immediate investment timing.")],
            supports=[BiText("Focus on family financial safety and child-care stability.", "Focus on family financial safety and child-care stability.")],
        )

    second_lord = _house_lord(payload.lagna_rasi, 2)
    eleventh_lord = _house_lord(payload.lagna_rasi, 11)
    fifth_lord = _house_lord(payload.lagna_rasi, 5)
    ninth_lord = _house_lord(payload.lagna_rasi, 9)
    eleventh_house_rasi = ((payload.lagna_rasi + 11 - 2) % 12) + 1

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
    if payload.life_stage == "student":
        score -= 5
        challenges.append(BiText("Student life-stage: prioritise savings habits over aggressive wealth expansion.", "Student life-stage: prioritise savings habits over aggressive wealth expansion."))
    elif payload.life_stage == "mid_life":
        score += 4
        supports.append(BiText("Mid-life phase supports long-horizon wealth structuring.", "Mid-life phase supports long-horizon wealth structuring."))
    elif payload.life_stage == "senior":
        challenges.append(BiText("Senior phase: favour preservation and liquidity.", "Senior phase: favour preservation and liquidity."))

    second_house = house_from_reference(payload.lagna_rasi, payload.planets_rasi[second_lord])
    eleventh_house = house_from_reference(payload.lagna_rasi, payload.planets_rasi[eleventh_lord])
    if second_house in {1, 2, 5, 9, 10, 11}:
        score += 8
        supports.append(BiText("2ம் அதிபதி வருமான அடித்தளத்தை ஆதரிக்கிறது.", "2nd lord supports income foundation."))
    else:
        score -= 6
        challenges.append(BiText("2ம் அதிபதி சவாலான நிலையில் உள்ளது.", "2nd lord is in a challenging placement."))

    if eleventh_house in {1, 2, 5, 9, 10, 11}:
        score += 8
        supports.append(BiText("11ம் அதிபதி லாப சுட்டியை உயர்த்துகிறது.", "11th lord improves gains potential."))
    else:
        score -= 6
        challenges.append(BiText("11ம் அதிபதி லாபத்தில் மந்தம் தரலாம்.", "11th lord may slow gains."))

    factors.append(
        AstroFactor(
            key="lords_2_11",
            status="SUPPORT" if second_house in {1, 2, 5, 9, 10, 11} and eleventh_house in {1, 2, 5, 9, 10, 11} else "CAUTION",
            detail=BiText("2ம்/11ம் அதிபதி நிலை மதிப்பீடு.", "2nd/11th lord placement assessment."),
        )
    )

    if payload.has_dhana_yoga:
        score += 10
        supports.append(BiText("தனயோகம் உள்ளது.", "Dhana yoga is present."))
        factors.append(AstroFactor(key="dhana_yoga", status="SUPPORT", detail=BiText("தனயோகம் லாப சாத்தியத்தை உயர்த்துகிறது.", "Dhana yoga raises gain potential.")))
    else:
        challenges.append(BiText("தனயோகம் தெளிவாக இல்லை.", "Clear dhana yoga support is not present."))

    fifth_house = house_from_reference(payload.lagna_rasi, payload.planets_rasi[fifth_lord])
    ninth_house = house_from_reference(payload.lagna_rasi, payload.planets_rasi[ninth_lord])
    if fifth_house in {1, 5, 9, 10, 11}:
        score += 4
    if ninth_house in {1, 5, 9, 10, 11}:
        score += 4
    factors.append(
        AstroFactor(
            key="poorva_punya_luck",
            status="SUPPORT" if fifth_house in {1, 5, 9, 10, 11} or ninth_house in {1, 5, 9, 10, 11} else "NEUTRAL",
            detail=BiText("5ம்/9ம் வீட்டு அதிபதி நிலை.", "5th/9th house-lord status."),
        )
    )

    dasha_support = "WEAK"
    if second_lord in payload.active_dasha_lords or eleventh_lord in payload.active_dasha_lords:
        score += 10
        dasha_support = "STRONG"
        supports.append(BiText("2ம்/11ம் அதிபதி தசை செயலில் உள்ளது.", "2nd/11th lord dasha is active."))

    second_house_rasi = ((payload.lagna_rasi + 2 - 2) % 12) + 1
    transit_support = "WEAK"
    if payload.transit_jupiter_rasi in {second_house_rasi, eleventh_house_rasi}:
        score += 8
        transit_support = "STRONG"
        supports.append(BiText("குரு கோசாரம் வருமான வீடுகளை தொடுகிறது.", "Jupiter transit supports wealth houses."))
    else:
        challenges.append(BiText("குரு கோசாரம் நேரடி ஆதரவு குறைவு.", "Direct Jupiter transit support is limited."))

    av11 = _derived_11th_bindu(payload, eleventh_house_rasi)
    if av11 >= 4:
        score += 6
        supports.append(BiText("11ம் ராசி அஷ்டகவர்க்க பிந்து நல்லது.", "11th rasi Ashtakavarga bindu is supportive."))
    else:
        score -= 5
        challenges.append(BiText("11ம் ராசி அஷ்டகவர்க்க பிந்து குறைவு.", "11th rasi Ashtakavarga bindu is low."))
    factors.append(
        AstroFactor(
            key="ashtakavarga_11th",
            status="SUPPORT" if av11 >= 4 else "CAUTION",
            detail=BiText(f"11ம் ராசி பிந்து: {av11}.", f"11th-house bindu: {av11}."),
        )
    )

    if 28 <= payload.age <= 50:
        score += 5
        supports.append(BiText("வயது கட்டம் செல்வ அடித்தளத்திற்கு ஏற்றது.", "Age phase supports wealth building."))
    pitru_label = (payload.pitru_dosham_label or "").upper()
    if pitru_label in {"STRONG_ACTIVE_DOSHAM", "ACTIVE_DOSHAM"}:
        score -= 4
        challenges.append(BiText("Pitru-karma nilaiyil maryadhaiyum kattupaadum mukkiyam.", "Pitru-linked factors call for disciplined financial conduct."))
    elif pitru_label == "DOSHAM_WITH_NIVARTHI":
        supports.append(BiText("Pitru nivarthi karanangal nermai vazhiyai aadharikkindrana.", "Pitru mitigation factors support steady progress."))

    rahu_ketu_label = (payload.rahu_ketu_label or "").upper()
    if rahu_ketu_label in {"STRONG_ACTIVE_RAHU_KETU_DOSHAM", "ACTIVE_RAHU_KETU_DOSHAM"}:
        score -= 3
        challenges.append(BiText("Rahu-Ketu siru alochanai illamal risk edukka vendam.", "Rahu-Ketu signals suggest avoiding impulsive risk."))
    score = max(0, min(100, score))
    if score >= 70:
        confidence = "HIGH"
        main = (
            "செல்வ முன்னேற்றத்திற்கு சீரான ஆதரவு காணப்படுகிறது.",
            "Wealth-growth indicators are steadily supportive.",
        )
    elif score >= 50:
        confidence = "MEDIUM"
        main = (
            "செல்வத்தில் வளர்ச்சி வாய்ப்புகள் உள்ளன; கட்டுப்பட்ட திட்டமிடல் அவசியம்.",
            "Wealth opportunities are available with disciplined planning.",
        )
    else:
        confidence = "LOW"
        main = (
            "அபாய முதலீடுகளை தவிர்த்து பணப்பாதுகாப்பை முன்னிலைப்படுத்தவும்.",
            "Avoid high-risk exposure and prioritise financial stability.",
        )

    return LifeAreaPrediction(
        life_area="wealth",
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

