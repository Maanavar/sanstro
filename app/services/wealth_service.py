from __future__ import annotations

from dataclasses import dataclass
from datetime import date

from app.calculations.astro import house_from_reference
from app.calculations.ashtakavarga import compute_bhinnashtakavarga, get_av_bindu
from app.services.life_area_prediction_models import AstroFactor, BiText, LifeAreaPrediction, house_lord_for_lagna


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
            main_prediction_ta="தனிப்பட்ட செல்வ வளர்ச்சி ஆலோசனை வயது காரணமாக ஒத்திவைக்கப்படுகிறது; இப்போது குடும்ப பாதுகாப்பும் நல்ல பழக்க வளர்ச்சியும் முக்கியம்.",
            main_prediction_en="Personal wealth-growth advice is age-gated; this phase is about family-managed protection and habit-building.",
            astrological_factors=[
                AstroFactor(
                    key="age_phase_gate",
                    status="INFO",
                    detail=BiText(
                        ta=f"வயது {payload.age}: நீண்டகால செல்வ முடிவுகள் பொதுவாக பெற்றோர் அல்லது பாதுகாவலர் வழிநடத்தலில் இருக்கும்.",
                        en=f"Age {payload.age}: long-term wealth decisions are usually parent/guardian managed.",
                    ),
                )
            ],
            dasha_support="PARTIAL",
            transit_support="PARTIAL",
            timing_window_start=payload.as_of,
            timing_window_end=date(payload.as_of.year, 12, 31),
            confidence="LOW",
            challenges=[BiText("இதை உடனடி முதலீட்டு நேரமாக விளக்க வேண்டாம்.", "Avoid interpreting this as immediate investment timing.")],
            supports=[BiText("குடும்ப நிதி பாதுகாப்பு மற்றும் குழந்தை பராமரிப்பு நிலைத்தன்மையில் கவனம் செலுத்தவும்.", "Focus on family financial safety and child-care stability.")],
        )

    second_lord = house_lord_for_lagna(payload.lagna_rasi, 2)
    eleventh_lord = house_lord_for_lagna(payload.lagna_rasi, 11)
    fifth_lord = house_lord_for_lagna(payload.lagna_rasi, 5)
    ninth_lord = house_lord_for_lagna(payload.lagna_rasi, 9)
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
                ta=f"வாழ்க்கை கட்டம்: {payload.life_stage}.",
                en=f"Life stage: {payload.life_stage}.",
            ),
        )
    )
    if payload.life_stage == "student":
        score -= 5
        challenges.append(BiText("மாணவர் கட்டத்தில் தீவிர செல்வ விரிவை விட சேமிப்பு பழக்கங்களுக்கு முன்னுரிமை கொடுக்கவும்.", "Student life-stage: prioritise savings habits over aggressive wealth expansion."))
    elif payload.life_stage == "mid_life":
        score += 4
        supports.append(BiText("நடுத்தர வயது கட்டம் நீண்டகால செல்வ கட்டமைப்பிற்கு ஆதரவாக உள்ளது.", "Mid-life phase supports long-horizon wealth structuring."))
    elif payload.life_stage == "senior":
        challenges.append(BiText("மூத்த வயதில் பாதுகாப்பும் உடனடி பணப்புழக்கமும் முன்னுரிமை பெற வேண்டும்.", "Senior phase: favour preservation and liquidity."))

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
        challenges.append(BiText("பித்ரு கர்ம தொடர்பான நிலையில் மரியாதையும் கட்டுப்பாடும் முக்கியம்.", "Pitru-linked factors call for disciplined financial conduct."))
    elif pitru_label == "DOSHAM_WITH_NIVARTHI":
        supports.append(BiText("பித்ரு நிவர்த்தி காரணங்கள் நேர்மையான முன்னேற்றப் பாதையை ஆதரிக்கின்றன.", "Pitru mitigation factors support steady progress."))

    rahu_ketu_label = (payload.rahu_ketu_label or "").upper()
    if rahu_ketu_label in {"STRONG_ACTIVE_RAHU_KETU_DOSHAM", "ACTIVE_RAHU_KETU_DOSHAM"}:
        score -= 3
        challenges.append(BiText("ராகு-கேது சுட்டிக்காட்டும் காலங்களில் சிந்திக்காமல் ஆபத்து எடுக்க வேண்டாம்.", "Rahu-Ketu signals suggest avoiding impulsive risk."))
    score = max(0, min(100, score))
    top_supports = [b.ta for b in supports[:2]] if supports else []
    top_challenges = [b.ta for b in challenges[:2]] if challenges else []
    top_supports_en = [b.en for b in supports[:2]] if supports else []
    top_challenges_en = [b.en for b in challenges[:2]] if challenges else []

    if score >= 70:
        confidence = "HIGH"
        support_phrase = "குறிப்பாக " + " மற்றும் ".join(top_supports) if top_supports else "11ம் வீடு மற்றும் தனயோக அமைப்பு நல்லது"
        main = (
            f"செல்வ முன்னேற்றத்திற்கு சாதகமான காலம். {support_phrase}. "
            "தசை மற்றும் 11ம் வீட்டு நிலை இந்த ஆதரவை உறுதிப்படுத்துகின்றன.",
            f"A favourable phase for wealth growth. {'; '.join(top_supports_en) if top_supports_en else '11th house and dhana yoga configuration are supportive'}. "
            "The dasha and 11th house placement confirm this window.",
        )
    elif score >= 50:
        confidence = "MEDIUM"
        support_phrase = " மற்றும் ".join(top_supports) if top_supports else ""
        challenge_phrase = "ஆனால் " + " மற்றும் ".join(top_challenges) if top_challenges else "சில கவலைகள் உள்ளன"
        main = (
            f"செல்வ சிக்னல்கள் கலந்த நிலையில் உள்ளன. {support_phrase + ' ' if support_phrase else ''}{challenge_phrase}. "
            "கட்டுப்பட்ட திட்டமிடல் மூலம் வளர்ச்சி வாய்ப்புகளை பயன்படுத்திக்கொள்ளுங்கள்.",
            f"Wealth signals are mixed. {'; '.join(top_supports_en) if top_supports_en else ''} {'but ' + '; '.join(top_challenges_en) if top_challenges_en else ''}. "
            "Use disciplined planning to make the most of available opportunities.",
        )
    else:
        confidence = "LOW"
        challenge_phrase = "முக்கியமாக " + " மற்றும் ".join(top_challenges) if top_challenges else "தற்போதைய நிலை சவாலானது"
        main = (
            f"அபாய முதலீடுகளை தவிர்க்கவும். {challenge_phrase}. "
            "பணப்பாதுகாப்பை முன்னிலைப்படுத்தி நிதி நிலைமையை நிலைநிறுத்துங்கள்.",
            f"Avoid high-risk financial exposure. {'; '.join(top_challenges_en) if top_challenges_en else 'Conditions need stabilising'}. "
            "Prioritise financial security and consolidate your position.",
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
