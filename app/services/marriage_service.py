from __future__ import annotations

from dataclasses import dataclass
from datetime import date

from app.calculations.astro import house_from_reference
from app.calculations.chart_strength import DEBILITATION_RASI, EXALTATION_RASI, OWN_SIGN_RASI
from app.calculations.transits import get_jupiter_aspects
from app.core.age_gate import MARRIAGE_UPPER_AGE, SEVVAI_DOSHAM_SOFTENING_AGE, is_married_settled, is_seeking_marriage
from app.services.life_area_prediction_models import AstroFactor, BiText, LifeAreaPrediction, house_lord_for_lagna


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
    relationship_to_owner: str = "self"
_PARENTAL_RELATIONSHIPS: frozenset[str] = frozenset({"parent", "grandparent"})


def assess_marriage_prediction(payload: MarriageAssessmentInput) -> LifeAreaPrediction:
    # Parent/grandparent profiles: marriage timing is not applicable — redirect to
    # family harmony and companionship guidance instead.
    if payload.relationship_to_owner in _PARENTAL_RELATIONSHIPS:
        return LifeAreaPrediction(
            life_area="marriage",
            main_prediction_ta=(
                "பெற்றோர் / பாட்டன்/பாட்டி பிரோஃபைல்களுக்கு திருமண நேர ஆலோசனை பொருந்தாது. "
                "குடும்ப ஒற்றுமை, ஆரோக்கியம் மற்றும் ஆன்மிக வழிகாட்டல் பற்றி விநாடி உதவ தயார்."
            ),
            main_prediction_en=(
                "Marriage timing guidance is not applicable for parent/grandparent profiles. "
                "Vinaadi is here to guide on family harmony, health, and spiritual well-being."
            ),
            astrological_factors=[
                AstroFactor(
                    key="relationship_gate",
                    status="INFO",
                    detail=BiText(
                        ta=f"உறவு வகை '{payload.relationship_to_owner}': திருமண நேர கணிப்பு இந்த சூழலில் பொருந்தாது.",
                        en=f"Relationship type '{payload.relationship_to_owner}': marriage timing prediction is not applicable in this context.",
                    ),
                )
            ],
            dasha_support="PARTIAL",
            transit_support="PARTIAL",
            timing_window_start=payload.as_of,
            timing_window_end=date(payload.as_of.year, 12, 31),
            confidence="LOW",
            challenges=[],
            supports=[BiText(
                "குடும்ப நலன், ஆரோக்கியம் மற்றும் துணைவர் ஒற்றுமை பற்றி கேட்கலாம்.",
                "Ask about family well-being, health, and companionship harmony instead.",
            )],
        )

    if payload.age < 18:
        return LifeAreaPrediction(
            life_area="marriage",
            main_prediction_ta="திருமண நேர ஆலோசனை வயது காரணமாக ஒத்திவைக்கப்படுகிறது; இப்போது குழந்தை வளர்ச்சி மற்றும் குடும்ப பராமரிப்பே முக்கியம்.",
            main_prediction_en="Marriage timing/advice is age-gated; current phase is child development and family care.",
            astrological_factors=[
                AstroFactor(
                    key="age_phase_gate",
                    status="INFO",
                    detail=BiText(
                        ta=f"வயது {payload.age}: இந்த கட்டத்தில் திருமண வழிகாட்டல் பொருந்தாது.",
                        en=f"Age {payload.age}: marriage guidance is not applicable in this phase.",
                    ),
                )
            ],
            dasha_support="PARTIAL",
            transit_support="PARTIAL",
            timing_window_start=payload.as_of,
            timing_window_end=date(payload.as_of.year, 12, 31),
            confidence="LOW",
            challenges=[BiText("இப்போதைய வாழ்க்கை முடிவுகளுக்கு இந்த பகுதியை பயன்படுத்த வேண்டாம்.", "Do not use this section for current-life decisions.")],
            supports=[BiText("ஆரோக்கியம், பாசம், பாதுகாப்பான வளர்ச்சி வழக்கங்கள் ஆகியவற்றில் கவனம் செலுத்தவும்.", "Focus on health, bonding, and safe growth routines.")],
        )

    # Soft gate — past prime marriage age (50+, Tamil/Indian cultural context).
    if payload.age >= MARRIAGE_UPPER_AGE:
        return LifeAreaPrediction(
            life_area="marriage",
            main_prediction_ta=(
                "இந்த வாழ்க்கை கட்டத்தில் ஜோதிட வழிகாட்டல் திருமண நேர கணிப்பிலிருந்து "
                "துணைவன்/துணைவி ஒற்றுமை, குடும்ப பாலம் மற்றும் ஆன்மிக தொடர்புக்கு மாறுகிறது. "
                "உறவு தரம் மற்றும் குடும்ப நலன் பற்றிய கேள்விகளுக்கு விநாடி உதவ தயார்."
            ),
            main_prediction_en=(
                "At this life stage, astrological guidance naturally shifts from marriage timing "
                "to companionship quality, family bonds, and spiritual partnership. "
                "Vinaadi is happy to guide you on relationship quality and family well-being."
            ),
            astrological_factors=[
                AstroFactor(
                    key="life_stage_gate",
                    status="INFO",
                    detail=BiText(
                        ta=f"வயது {payload.age}: திருமண நேர கணிப்பு இந்த கட்டத்திற்கு பொருந்தாது.",
                        en=f"Age {payload.age}: marriage timing predictions are not applicable at this life stage.",
                    ),
                )
            ],
            dasha_support="PARTIAL",
            transit_support="PARTIAL",
            timing_window_start=payload.as_of,
            timing_window_end=date(payload.as_of.year, 12, 31),
            confidence="LOW",
            challenges=[],
            supports=[BiText(
                "துணைவன்/துணைவி ஒற்றுமை மற்றும் குடும்ப நலன் பற்றி கேட்கலாம்.",
                "Ask about companionship harmony and family well-being instead.",
            )],
        )

    married_harmony_mode = is_married_settled(payload.marital_status)

    seventh_house_rasi = ((payload.lagna_rasi + 7 - 2) % 12) + 1
    seventh_lord = house_lord_for_lagna(payload.lagna_rasi, 7)
    second_lord = house_lord_for_lagna(payload.lagna_rasi, 2)
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
                ta=f"வாழ்க்கை கட்டம்: {payload.life_stage}.",
                en=f"Life stage: {payload.life_stage}.",
            ),
        )
    )
    if married_harmony_mode:
        score += 5
        factors.append(AstroFactor(
            key="married_harmony_mode",
            status="INFO",
            detail=BiText(
                ta="திருமணமானவர் — இந்த பகுதி குடும்ப நலன், இல்ல ஒற்றுமை மற்றும் குழந்தை யோகத்தை காட்டுகிறது.",
                en="Married profile — this reading reflects family fortune: home stability, marital harmony, and children's prosperity.",
            ),
        ))
        supports.append(BiText(
            "7ம் வீடு பலம் உறவின் தரத்தை குறிக்கிறது.",
            "7th house strength reflects the quality of your marital bond.",
        ))

        # 4th house — home and family stability
        fourth_lord = house_lord_for_lagna(payload.lagna_rasi, 4)
        fourth_lord_rasi = payload.planets_rasi.get(fourth_lord)
        if fourth_lord_rasi is not None:
            fourth_lord_house = house_from_reference(payload.lagna_rasi, fourth_lord_rasi)
            if fourth_lord_house in {1, 4, 5, 7, 9, 10, 11}:
                score += 6
                factors.append(AstroFactor(
                    key="fourth_lord_family_home",
                    status="SUPPORT",
                    detail=BiText(
                        ta=f"4ம் அதிபதி {fourth_lord_house}ம் வீட்டில் — குடும்ப வீட்டு நிலை நல்லது.",
                        en=f"4th lord in house {fourth_lord_house} — family home stability is well-supported.",
                    ),
                ))
                supports.append(BiText("குடும்ப வீட்டு நிலை நல்ல நிலையில் உள்ளது.", "Family home stability is in a good position."))
            else:
                score -= 3
                factors.append(AstroFactor(
                    key="fourth_lord_family_home",
                    status="CAUTION",
                    detail=BiText(
                        ta=f"4ம் அதிபதி {fourth_lord_house}ம் வீட்டில் — இல்ல சுகத்தில் கவனம் தேவை.",
                        en=f"4th lord in house {fourth_lord_house} — home comfort needs mindful attention.",
                    ),
                ))
                challenges.append(BiText("இல்ல சுகம் மேம்பட கவனம் தேவை.", "Home comfort needs careful attention."))

        # 5th house — children and family prosperity
        fifth_lord = house_lord_for_lagna(payload.lagna_rasi, 5)
        fifth_lord_rasi = payload.planets_rasi.get(fifth_lord)
        if fifth_lord_rasi is not None:
            fifth_lord_house = house_from_reference(payload.lagna_rasi, fifth_lord_rasi)
            if fifth_lord_house in {1, 4, 5, 7, 9, 10, 11}:
                score += 6
                factors.append(AstroFactor(
                    key="fifth_lord_family_prosperity",
                    status="SUPPORT",
                    detail=BiText(
                        ta=f"5ம் அதிபதி {fifth_lord_house}ம் வீட்டில் — குழந்தை யோகம் மற்றும் குடும்ப செல்வாக்கு நல்லது.",
                        en=f"5th lord in house {fifth_lord_house} — children's fortune and family prosperity are well-supported.",
                    ),
                ))
                supports.append(BiText("குடும்ப செல்வாக்கு மற்றும் குழந்தை யோகம் நல்ல அமைப்பில் உள்ளது.", "Family prosperity and children's fortune are well-placed."))
            else:
                factors.append(AstroFactor(
                    key="fifth_lord_family_prosperity",
                    status="NEUTRAL",
                    detail=BiText(
                        ta=f"5ம் அதிபதி {fifth_lord_house}ம் வீட்டில் — குழந்தை நலனில் கவனம் நல்லது.",
                        en=f"5th lord in house {fifth_lord_house} — mindful care supports children's welfare.",
                    ),
                ))

    elif is_seeking_marriage(payload.marital_status):
        # Divorced / widowed / breakup — eligible for marriage fortune, contextually framed.
        marital = (payload.marital_status or "").strip().lower()
        _context_map = {
            "divorced": (
                "மறுமணம் / புதிய உறவு — முன்பு திருமணமானவர்; 7ம் வீடு புதிய வாழ்க்கைத்துணை யோகத்தை காட்டுகிறது.",
                "Second marriage / new relationship — previously married; 7th house now indicates prospects for a new life partner.",
            ),
            "widowed": (
                "புதிய வாழ்க்கைத்துணை யோகம் — இழப்பிற்குப் பிறகான துணை மற்றும் உறவு சாத்தியம் மதிப்பீடு செய்யப்படுகிறது.",
                "Companionship and new life-partner prospects assessed with sensitivity after bereavement.",
            ),
            "breakup": (
                "உறவு மீட்சி மற்றும் திருமண யோகம் — பிரிவிற்குப் பிறகு புதிய காதல் / திருமண சாத்தியம் மதிப்பீடு.",
                "Relationship healing and marriage prospects — assessing fresh love / marriage opportunity after a breakup.",
            ),
        }
        ta_ctx, en_ctx = _context_map.get(marital, (
            "திருமண / புதிய உறவு யோகம் மதிப்பீடு செய்யப்படுகிறது.",
            "Marriage / new relationship prospects are being assessed.",
        ))
        factors.append(AstroFactor(
            key="relationship_context",
            status="INFO",
            detail=BiText(ta=ta_ctx, en=en_ctx),
        ))
        supports.append(BiText(
            "7ம் வீடு பலம் புதிய வாழ்க்கைத்துணை யோகத்தை குறிக்கிறது.",
            "7th house strength indicates prospects for a new life partner.",
        ))

    elif payload.life_stage == "student":
        score -= 6
        challenges.append(BiText("மாணவர் கட்டத்தில் திருமண நேரம் பொதுவாக முதன்மை கவனம் அல்ல.", "Student life-stage: marriage timing is usually not the primary focus."))

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

    if married_harmony_mode:
        # Age range is irrelevant for married users — skip the timing-oriented age check.
        pass
    elif 25 <= payload.age <= 35:
        score += 6
        supports.append(BiText("வயது கட்டம் ஆதரிக்கும் நிலை.", "Age phase is supportive."))
    else:
        challenges.append(BiText("வயது கட்டம் மாறுபட்டு உள்ளது.", "Age phase is outside peak range."))

    if not payload.sevvai_dosham_cancelled:
        if payload.age >= SEVVAI_DOSHAM_SOFTENING_AGE:
            # Traditional softening, not a cancellation — the dosham is still present,
            # but its matching-relevance is treated as naturally reduced past this age.
            score -= 3
            challenges.append(BiText(
                "செவ்வாய் தோஷம் உள்ளது; ஆனால் 28 வயதிற்குப் பின் பாரம்பரிய முறைப்படி தீவிரம் இயற்கையாகவே குறைகிறது.",
                "Sevvai dosham is present, but traditional practice treats its severity as naturally softened past age 28.",
            ))
        else:
            score -= 6
            challenges.append(BiText("செவ்வாய் தோஷம் கவனத்துடன் அணுக வேண்டும்.", "Sevvai dosham requires caution."))
    else:
        supports.append(BiText("செவ்வாய் தோஷ ரத்து காரணம் உள்ளது.", "Sevvai dosham cancellation factors exist."))
    rahu_ketu_label = (payload.rahu_ketu_label or "").upper()
    if rahu_ketu_label in {"STRONG_ACTIVE_RAHU_KETU_DOSHAM", "ACTIVE_RAHU_KETU_DOSHAM"}:
        score -= 5
        challenges.append(BiText("ராகு-கேது தொடர்பு உறவு விஷயங்களில் கூடுதல் கவனம் தேவை என்பதைக் காட்டுகிறது.", "Rahu-Ketu factors suggest added relationship caution."))
    elif rahu_ketu_label == "RAHU_KETU_DOSHAM_CANDIDATE":
        score -= 2
        challenges.append(BiText("ராகு-கேது குறிப்பு நிலை உள்ளது; திட்டமிட்ட அணுகுமுறை பயனுள்ளதாக இருக்கும்.", "Rahu-Ketu candidate signals suggest planning and clarity."))
    elif rahu_ketu_label == "RAHU_KETU_DOSHAM_WITH_NIVARTHI":
        supports.append(BiText("ராகு-கேது நிவர்த்தி காரணங்கள் ஆதரவு தருகின்றன.", "Rahu-Ketu mitigation factors are supportive."))
    score = max(0, min(100, score))
    top_supports = [b.ta for b in supports[:2]] if supports else []
    top_challenges = [b.ta for b in challenges[:2]] if challenges else []
    top_supports_en = [b.en for b in supports[:2]] if supports else []
    top_challenges_en = [b.en for b in challenges[:2]] if challenges else []

    if married_harmony_mode:
        if score >= 70:
            confidence = "HIGH"
            support_phrase = " மற்றும் ".join(top_supports) if top_supports else "பொதுவாக வலுவான அமைப்பு"
            main = (
                f"உங்கள் திருமண பந்தம் இந்த கட்டத்தில் வலுவாக உள்ளது. {support_phrase}. "
                "தசை மற்றும் கோசாரம் உறவு ஒற்றுமைக்கு சாதகமான சூழலை உருவாக்குகின்றன.",
                f"Your marital bond appears strong in this phase. {'; '.join(top_supports_en) if top_supports_en else 'Overall indicators are favourable'}. "
                "Dasha and transit support a harmonious period in your relationship.",
            )
        elif score >= 50:
            confidence = "MEDIUM"
            challenge_phrase = " மற்றும் ".join(top_challenges) if top_challenges else "கொஞ்சம் கவனம் தேவை"
            main = (
                f"உறவு ஒற்றுமைக்கு கொஞ்சம் கவனம் மற்றும் புரிதல் தேவை. {challenge_phrase}. "
                "பொறுமையும் திறந்த உரையாடலும் நல்ல பலன் தரும்.",
                f"Your relationship calls for mindful attention. {'; '.join(top_challenges_en) if top_challenges_en else 'Some areas need care'}. "
                "Patience and open communication will strengthen the bond.",
            )
        else:
            confidence = "LOW"
            challenge_phrase = " மற்றும் ".join(top_challenges) if top_challenges else "சில சவால்கள் உள்ளன"
            main = (
                f"இந்த கட்டத்தில் திருமண உறவில் பொறுமையும் மரியாதையும் முக்கியம். {challenge_phrase}. "
                "இணை நலனில் கவனம் செலுத்துவது சிறந்த பாதை.",
                f"Patience and mutual respect are key in your marital relationship now. {'; '.join(top_challenges_en) if top_challenges_en else 'Some challenges need attention'}. "
                "Focusing on your partner's well-being is the better path.",
            )
    elif score >= 70:
        confidence = "HIGH"
        support_phrase = "குறிப்பாக " + " மற்றும் ".join(top_supports) if top_supports else "பொதுவாக நல்ல அமைப்பு உள்ளது"
        main = (
            f"திருமண விஷயங்களில் ஆதரவான நேரம் தெரிகிறது. {support_phrase}. "
            "தசை மற்றும் கோசாரம் இணைந்து இந்த சாதகமான கட்டத்தை உருவாக்குகின்றன.",
            f"The current phase appears supportive for marriage matters. {'; '.join(top_supports_en) if top_supports_en else 'General indicators are favourable'}. "
            "Dasha and transit together create this favourable window.",
        )
    elif score >= 50:
        confidence = "MEDIUM"
        support_phrase = " மற்றும் ".join(top_supports) if top_supports else ""
        challenge_phrase = "ஆனால் " + " மற்றும் ".join(top_challenges) if top_challenges else "சில கவலைகள் உள்ளன"
        main = (
            f"திருமண சிக்னல்கள் கலந்த நிலையில் உள்ளன. {support_phrase + ' ' if support_phrase else ''}{challenge_phrase}. "
            "திட்டமிட்ட அணுகுமுறை மற்றும் பொறுமை நல்ல பலன் தரும்.",
            f"Marriage indicators are mixed. {'; '.join(top_supports_en) if top_supports_en else ''} {'but ' + '; '.join(top_challenges_en) if top_challenges_en else ''}. "
            "A planned approach with patience will yield better results.",
        )
    else:
        confidence = "LOW"
        challenge_phrase = "முக்கியமாக " + " மற்றும் ".join(top_challenges) if top_challenges else "தற்போதைய நிலை கடினமாக உள்ளது"
        main = (
            f"திருமண முடிவுகளில் அவசரம் தவிர்க்கவும். {challenge_phrase}. "
            "இந்த கட்டத்தில் நிலைமையை நிலைநிறுத்துவதே சிறந்த பாதை.",
            f"Avoid haste in marriage decisions. {'; '.join(top_challenges_en) if top_challenges_en else 'Conditions need stabilising'}. "
            "Consolidating your situation is the better path right now.",
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
