from __future__ import annotations

from dataclasses import dataclass
from datetime import date

from app.calculations.astro import house_from_reference
from app.calculations.bhava_afflictions import assess_bhava_afflictions
from app.calculations.dasha_activation import assess_dasha_activation
from app.calculations.transits import classify_kandaka_cycle
from app.services.life_area_prediction_models import AstroFactor, BiText, LifeAreaPrediction, house_lord_for_lagna
from app.services.narrative_engine import PLANET_NAME


def _lord_ta(lord: str) -> str:
    return PLANET_NAME[lord].ta if lord in PLANET_NAME else lord


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
def assess_career_prediction(payload: CareerAssessmentInput) -> LifeAreaPrediction:
    if payload.age < 18:
        return LifeAreaPrediction(
            life_area="career",
            main_prediction_ta="தொழில் வளர்ச்சி விளக்கம் வயது காரணமாக ஒத்திவைக்கப்படுகிறது; இப்போது கல்வி, ஆரோக்கியம், குடும்ப ஆதரவு முக்கியம்.",
            main_prediction_en="Career-growth interpretation is age-gated; current focus is learning, health, and family support.",
            astrological_factors=[
                AstroFactor(
                    key="age_phase_gate",
                    status="INFO",
                    detail=BiText(
                        ta=f"வயது {payload.age}: தொழில் விரிவு வழிகாட்டல் பின்னர் கட்டத்திற்கு ஒத்திவைக்கப்படுகிறது.",
                        en=f"Age {payload.age}: career expansion guidance is deferred to later phase.",
                    ),
                )
            ],
            dasha_support="PARTIAL",
            transit_support="PARTIAL",
            timing_window_start=payload.as_of,
            timing_window_end=date(payload.as_of.year, 12, 31),
            confidence="LOW",
            challenges=[BiText("இந்த நிலையை தொழில் முடிவு கட்டமாக கருத வேண்டாம்.", "Do not treat this as a career-decision phase.")],
            supports=[BiText("முதலில் கல்வி, நல்ல பழக்கங்கள், மன பாதுகாப்பு ஆகியவற்றை ஆதரிக்கவும்.", "Support education, habits, and emotional security first.")],
        )

    tenth_house_rasi = ((payload.lagna_rasi + 10 - 2) % 12) + 1
    tenth_lord = house_lord_for_lagna(payload.lagna_rasi, 10)
    sixth_lord = house_lord_for_lagna(payload.lagna_rasi, 6)
    second_lord = house_lord_for_lagna(payload.lagna_rasi, 2)
    eleventh_lord = house_lord_for_lagna(payload.lagna_rasi, 11)
    lagna_lord = house_lord_for_lagna(payload.lagna_rasi, 1)

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
                    ta=f"10ம் வீட்டில் கிரகங்கள்: {', '.join(_lord_ta(p) for p in planets_in_10th)}.",
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

    # ── Named malefic afflictions on the 10th bhava (bhava_afflictions.py) ──
    affliction = assess_bhava_afflictions(
        lagna_rasi=payload.lagna_rasi,
        bhava_house=10,
        planet_rasis=payload.planets_rasi,
        karaka="SUN",
    )
    if affliction.is_afflicted:
        involved = sorted({*affliction.malefics_occupying, *affliction.malefics_aspecting})
        score -= min(8, 2 + 2 * len(involved))
        challenges.append(BiText(
            "10ம் வீட்டின் மீது பாப கிரக தாக்கம் உள்ளது — தொழில் முன்னேற்றத்தில் தடை/தாமதம் சாத்தியம்.",
            f"Malefic influence on the 10th house ({', '.join(involved) or 'papa kartari'}) — obstacles or delay in career growth are possible.",
        ))
        factors.append(AstroFactor(
            key="tenth_house_malefic_influence",
            status="CAUTION",
            detail=BiText(
                ta="10ம் வீடு / அதிபதி மீது பாப கிரக பார்வை-சேர்க்கை கணக்கில் எடுக்கப்பட்டது.",
                en="Malefic aspect/occupancy on the 10th house and its lord has been factored in.",
            ),
        ))
    elif affliction.shubha_kartari:
        score += 3
        supports.append(BiText(
            "10ம் வீடு சுப கர்த்தரி பாதுகாப்பில் உள்ளது.",
            "The 10th house is protected by shubha kartari.",
        ))

    # Connection-match dasha activation (dasha_activation.py): lordship of
    # 10/2/6/11, occupancy or aspect on the 10th, dispositorship of the 10th
    # lord, karaka identity, and node agency all connect a dasha lord to
    # career — not just being the 10th/lagna lord by identity.
    activation = assess_dasha_activation(
        lagna_rasi=payload.lagna_rasi,
        bhava_house=10,
        dasha_lords=sorted(payload.active_dasha_lords),
        natal_planet_rasis=payload.planets_rasi,
        karakas=("SUN", "SATURN", "MERCURY", "MARS"),
        related_houses=(2, 6, 11),
    )
    _kinds = {conn.split(":", 2)[2] for conn in activation.connections}
    _primary = bool(
        _kinds & {"lords_bhava", "lords_related_house", "is_karaka", "occupies_bhava"}
        or any(kind.startswith("node_agent_of_") for kind in _kinds)
    )
    dasha_support = "WEAK"
    if lagna_lord in payload.active_dasha_lords or _primary:
        dasha_support = "STRONG"
        score += 10
        supports.append(BiText(
            "தசை அதிபதி தொழில் வீடுகளுடன் நேரடி தொடர்பில் உள்ளார்.",
            "The dasha lord connects directly to the career houses.",
        ))
    elif activation.activated:
        dasha_support = "PARTIAL"
        score += 5
        supports.append(BiText(
            "தசை அதிபதி 10ம் வீட்டுடன் மறைமுக தொடர்பில் உள்ளார் (பார்வை/ஆதிக்கம்).",
            "The dasha lord connects to the 10th house indirectly (aspect or dispositorship).",
        ))

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
                "மாணவர் கட்டம்: அதிக ஆபத்துள்ள தொழில் முடிவுகளுக்கு முன் அடித்தளத்தை உறுதிப்படுத்துங்கள்.",
                "Student life-stage: focus on foundations before high-risk career moves.",
            )
        )
    elif payload.life_stage == "young_adult":
        score += 4
        supports.append(BiText("இளம் வயது கட்டம் தொழில் அடித்தள கட்டமைப்பிற்கு ஏற்றது.", "Young-adult phase supports career foundation building."))
    elif payload.life_stage == "mid_life":
        score += 5
        supports.append(BiText("நடுத்தர வயது கட்டம் பொறுப்பு விரிவாக்கத்திற்கு ஏற்றது.", "Mid-life phase supports responsibility expansion."))
    else:
        challenges.append(BiText("மூத்த வயது கட்டம் குறைந்த ஆபத்துள்ள மாற்றங்களை விரும்புகிறது.", "Senior phase favours lower-risk transitions."))
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
                ta=f"சுயதொழில் — 2ம் அதிபதி ({_lord_ta(second_lord)}) தசை நிலை பரிசீலிக்கப்பட்டது.",
                en=f"Self-employed — 2nd lord ({second_lord}) dasha status evaluated.",
            ),
        ))
    elif payload.employment_type == "business_owner":
        # Business owner: 7th house (partnerships / trade) is the primary karaka
        seventh_lord = house_lord_for_lagna(payload.lagna_rasi, 7)
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
                ta=f"வியாபாரம் — 7ம் அதிபதி ({_lord_ta(seventh_lord)}), 7ம் வீட்டு கிரகங்கள்: {', '.join(_lord_ta(p) for p in business_planets) or 'இல்லை'}.",
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
    elif payload.employment_type == "employed_salaried":
        # Salaried: promotion, salary growth, and job stability are the key metrics.
        # 6th lord = service quality; 2nd lord = salary/income growth.
        if sixth_lord in payload.active_dasha_lords:
            score += 5
            supports.append(BiText(
                "6ம் அதிபதி தசை — வேலை நிலை மற்றும் வருமான நிலைத்தன்மை ஆதரிக்கப்படுகிறது.",
                "6th lord active in dasha — job stability and income continuity are supported.",
            ))
        if second_lord in payload.active_dasha_lords:
            score += 5
            supports.append(BiText(
                "2ம் அதிபதி தசை — சம்பள உயர்வு / வருமான முன்னேற்றம் யோகம்.",
                "2nd lord active in dasha — salary raise or income growth is favoured.",
            ))
        if sixth_lord not in payload.active_dasha_lords and second_lord not in payload.active_dasha_lords:
            challenges.append(BiText(
                "6ம் / 2ம் அதிபதி தசையில் இல்லை — பதவி உயர்வு காலம் சற்று நீண்டிருக்கலாம்.",
                "6th/2nd lord not in active dasha — promotion or salary growth may take more time.",
            ))
        factors.append(AstroFactor(
            key="employment_salaried",
            status="INFO",
            detail=BiText(
                ta="சம்பளதாரர் — பதவி உயர்வு, சம்பள வளர்ச்சி மற்றும் வேலை நிலைத்தன்மை மதிப்பீடு.",
                en="Salaried employee — evaluating promotion prospects, salary growth, and job stability.",
            ),
        ))

    elif payload.employment_type == "unemployed":
        # Unemployed: focus on when the employment opportunity window opens.
        score -= 5
        challenges.append(BiText(
            "வேலை இல்லா நிலை — ஜோதிட சமிக்ஞைகள் வாய்ப்பு நேரத்தை காட்டுகின்றன.",
            "Currently unemployed — astrological signals point to the upcoming opportunity window.",
        ))
        if sixth_lord in payload.active_dasha_lords or tenth_lord in payload.active_dasha_lords:
            score += 8
            supports.append(BiText(
                "6ம் / 10ம் அதிபதி தசை — வேலை வாய்ப்பு வரும் நேரம் நெருங்குகிறது.",
                "6th/10th lord in active dasha — an employment opportunity window is approaching soon.",
            ))
        else:
            challenges.append(BiText(
                "6ம் / 10ம் அதிபதி தற்போதைய தசையில் இல்லை — திட்டமிடல் மற்றும் பொறுமை முக்கியம்.",
                "6th/10th lord not in active dasha — focused preparation and patience are key right now.",
            ))
        factors.append(AstroFactor(
            key="employment_unemployed",
            status="CAUTION",
            detail=BiText(
                ta="வேலை தேடும் கட்டம் — வேலை வாய்ப்பு நேர கணிப்பு செய்யப்படுகிறது.",
                en="Job-seeking phase — employment opportunity timing is being assessed.",
            ),
        ))

    elif payload.employment_type == "recently_unemployed":
        # Recently lost job: recovery timing is the focus; frame as temporary.
        score -= 8
        challenges.append(BiText(
            "சமீபத்தில் வேலை இழப்பு — இந்த கட்டம் தற்காலிகமானது; மீட்சி நேர கணிப்பு கீழே.",
            "Recently lost job — this phase is temporary; recovery timing is indicated below.",
        ))
        if sixth_lord in payload.active_dasha_lords or tenth_lord in payload.active_dasha_lords:
            score += 10
            supports.append(BiText(
                "6ம் / 10ம் அதிபதி தசை — விரைவான மீட்சி மற்றும் புதிய வேலை வாய்ப்பு சாத்தியம்.",
                "6th/10th lord active in dasha — swift recovery and a new employment opportunity is likely.",
            ))
        else:
            challenges.append(BiText(
                "6ம் / 10ம் அதிபதி தற்போதைய தசையில் இல்லை — பொறுமையும் திட்டமான மறுதொடக்கமும் தேவை.",
                "6th/10th lord not in active dasha — a patient and planned re-entry is the better approach.",
            ))
        factors.append(AstroFactor(
            key="employment_recently_unemployed",
            status="CAUTION",
            detail=BiText(
                ta="சமீப வேலை இழப்பு — வேலை மீட்சி நேர கணிப்பு செய்யப்படுகிறது.",
                en="Recent job loss factored in — employment recovery timing is being assessed.",
            ),
        ))

    elif payload.employment_type == "homemaker":
        # Homemaker: reframe career as household prosperity and family wealth management.
        # Primary house: 4th (home/comfort), secondary: 2nd (family wealth).
        score += 3
        fourth_lord_hm = house_lord_for_lagna(payload.lagna_rasi, 4)
        fourth_lord_hm_rasi = payload.planets_rasi.get(fourth_lord_hm)
        if fourth_lord_hm_rasi is not None:
            fourth_lord_hm_house = house_from_reference(payload.lagna_rasi, fourth_lord_hm_rasi)
            if fourth_lord_hm_house in {1, 4, 5, 7, 9, 10, 11}:
                score += 7
                supports.append(BiText(
                    "4ம் அதிபதி நல்ல நிலையில் — இல்ல சுகம் மற்றும் குடும்ப செழிப்பு ஆதரிக்கப்படுகிறது.",
                    "4th lord is well-placed — home comfort and family prosperity are supported.",
                ))
            else:
                challenges.append(BiText(
                    "4ம் அதிபதி சவாலான இடத்தில் — இல்ல விஷயங்களில் கவனம் தேவை.",
                    "4th lord in a challenging house — home matters need careful attention.",
                ))
        if second_lord in payload.active_dasha_lords:
            score += 5
            supports.append(BiText(
                "2ம் அதிபதி தசை — குடும்ப செல்வ மேலாண்மை சாதகமாக உள்ளது.",
                "2nd lord active in dasha — family wealth management is well-supported.",
            ))
        factors.append(AstroFactor(
            key="employment_homemaker",
            status="INFO",
            detail=BiText(
                ta="இல்லத்தரசர்/ரசி — இல்ல நிர்வாகம், குடும்ப செல்வம் மற்றும் இல்ல சுகம் மதிப்பீடு.",
                en="Homemaker — household management, family wealth, and home prosperity assessment applied.",
            ),
        ))

    elif payload.employment_type is not None:
        # student and any future values — record for transparency.
        factors.append(AstroFactor(
            key="employment_type",
            status="INFO",
            detail=BiText(
                ta=f"வேலை நிலை: {payload.employment_type}.",
                en=f"Employment type: {payload.employment_type}.",
            ),
        ))

    score = max(0, min(100, score))
    top_supports = [b.ta for b in supports[:2]] if supports else []
    top_challenges = [b.ta for b in challenges[:2]] if challenges else []
    top_supports_en = [b.en for b in supports[:2]] if supports else []
    top_challenges_en = [b.en for b in challenges[:2]] if challenges else []

    if score >= 70:
        confidence = "HIGH"
        support_phrase = "குறிப்பாக " + " மற்றும் ".join(top_supports) if top_supports else "10ம் வீடு மற்றும் தசை நல்ல அமைப்பில் உள்ளன"
        main = (
            f"தொழில் முன்னேற்றத்திற்கு சாதகமான காலம். {support_phrase}. "
            "தசை மற்றும் லக்னாதிபதி நிலை இந்த கட்டத்தை உறுதிப்படுத்துகின்றன.",
            f"A favourable phase for career progress. {'; '.join(top_supports_en) if top_supports_en else '10th house and dasha are well-aligned'}. "
            "The dasha and lagna lord placement confirm this window.",
        )
    elif score >= 50:
        confidence = "MEDIUM"
        support_phrase = " மற்றும் ".join(top_supports) if top_supports else ""
        challenge_phrase = "ஆனால் " + " மற்றும் ".join(top_challenges) if top_challenges else "சில கவலைகள் உள்ளன"
        main = (
            f"தொழில் சிக்னல்கள் கலந்த நிலையில் உள்ளன. {support_phrase + ' ' if support_phrase else ''}{challenge_phrase}. "
            "கட்டுப்பாடான திட்டமிடல் மற்றும் நிலைத்த முயற்சி நல்ல பலன் தரும்.",
            f"Career signals are mixed. {'; '.join(top_supports_en) if top_supports_en else ''} {'but ' + '; '.join(top_challenges_en) if top_challenges_en else ''}. "
            "Disciplined planning and steady effort will yield better results.",
        )
    else:
        confidence = "LOW"
        challenge_phrase = "முக்கியமாக " + " மற்றும் ".join(top_challenges) if top_challenges else "தற்போதைய நிலை சவாலானது"
        main = (
            f"தொழில் முடிவுகளில் அதிக ஆபத்தை தவிர்க்கவும். {challenge_phrase}. "
            "நிலைமையை நிலைநிறுத்துவதே இப்போது சிறந்த பாதை.",
            f"Avoid high-risk career moves. {'; '.join(top_challenges_en) if top_challenges_en else 'Conditions need stabilising'}. "
            "Consolidating your current position is the better path right now.",
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
