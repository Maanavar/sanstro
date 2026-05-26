from __future__ import annotations


# Maps age → list of active life focus areas.
# Used by the jadhagam report to surface only the scenarios, components,
# and fortune probabilities that are RELEVANT to the person's current
# stage of life rather than presenting a static all-at-once dump.
def get_active_life_phases(current_age: int) -> list[str]:
    if current_age < 5:
        return ["health", "family_nurture"]
    if current_age < 12:
        return ["health", "education", "family"]
    if current_age < 18:
        return ["education", "health", "family", "character_formation"]
    if current_age < 24:
        return ["education", "health", "career_preparation"]
    if current_age < 35:
        return ["career", "marriage", "wealth_foundation"]
    if current_age < 50:
        return ["career_peak", "wealth", "property", "children"]
    if current_age < 65:
        return ["health", "spirituality", "family_legacy"]
    if current_age < 70:
        return ["health_priority", "spirituality", "family_legacy", "wealth_transfer", "retirement_stability"]
    return ["health_senior", "spirituality", "family_support", "ancestral_duty"]


# Age-band label for human-readable headers in reports.
def get_age_phase_label(current_age: int) -> dict[str, str]:
    if current_age < 12:
        return {"ta": "குழந்தை பருவம்", "en": "Childhood"}
    if current_age < 18:
        return {"ta": "இளைமை பருவம்", "en": "Youth"}
    if current_age < 24:
        return {"ta": "இளம் பருவம்", "en": "Early adulthood"}
    if current_age < 35:
        return {"ta": "வளர்ச்சி பருவம்", "en": "Building years"}
    if current_age < 50:
        return {"ta": "நடு வயது பருவம்", "en": "Middle years"}
    if current_age < 65:
        return {"ta": "முதிர்ச்சி பருவம்", "en": "Mature years"}
    return {"ta": "மூத்த பருவம்", "en": "Elder years"}


# Return age-specific practical guidance for the report.
# These texts are real, semantic, and not generic filler.
def get_age_based_practical_guidance(
    current_age: int,
    mahadasha_lord: str,
    antardasha_lord: str,
    lagna_rasi: str,
    strong_planets: list[str],
    weak_planets: list[str],
) -> dict[str, list[str]]:
    en: list[str] = []
    ta: list[str] = []

    # Age-phase specific core guidance
    if current_age < 12:
        en += [
            "Focus on building health routines and educational habits early.",
            "Family environment strongly shapes this phase — stability at home is key.",
        ]
        ta += [
            "ஆரம்பத்திலேயே ஆரோக்கிய பழக்கங்களையும் கல்வி அடிப்படையையும் உருவாக்கவும்.",
            "குடும்ப சூழல் இந்த பருவத்தை வடிவமைக்கிறது — வீட்டில் நிலையான சூழல் முக்கியம்.",
        ]
    elif current_age < 18:
        en += [
            "Education and skill foundation are the primary focus now.",
            "Physical health investments made now pay off across the next two decades.",
            "Avoid making binding long-term commitments — this is an exploratory phase.",
        ]
        ta += [
            "கல்வி மற்றும் திறன் அடிப்படை இப்போது முதன்மை கவனம்.",
            "இப்போது செய்யும் உடல் ஆரோக்கிய முயற்சிகள் அடுத்த இரண்டு தசாப்தங்களில் பலன் தரும்.",
            "நீண்ட கால கட்டுப்பாடுகளை இப்போது தவிர்க்கவும் — இது ஆராய்ச்சி காலம்.",
        ]
    elif current_age < 24:
        en += [
            "Career foundation and educational completion are the central priority.",
            "Evaluate long-term relationship possibilities carefully — avoid rushed commitments.",
            "Build financial habits now: small, consistent savings compound over a career.",
        ]
        ta += [
            "தொழில் அடிப்படையும் கல்வி முடிப்பும் மையக் கவனம்.",
            "நீண்ட கால உறவுகளை கவனமாக மதிப்பிடவும் — அவசர கட்டுப்பாடுகளை தவிர்க்கவும்.",
            "இப்போதே நிதி பழக்கங்களை உருவாக்கவும்: சிறிய, தொடர்ந்த சேமிப்பு வளரும்.",
        ]
    elif current_age < 30:
        en += [
            "This is the critical phase for career launch — prioritise skill development and visibility.",
            "Marriage prospects should be evaluated holistically including shared values and life goals.",
            "Begin systematic financial planning; avoid speculative investments in this phase.",
        ]
        ta += [
            "இது தொழில் தொடக்கத்திற்கான முக்கியமான காலம் — திறன் மேம்பாடு மற்றும் புலப்படுவதை முன்னுரிமை கொடுங்கள்.",
            "திருமண வாய்ப்புகளை பகிர்ந்த மதிப்புகள் மற்றும் வாழ்க்கை இலக்குகள் உட்பட முழுமையாக மதிப்பிடவும்.",
            "திட்டமிட்ட நிதி திட்டமிடலை தொடங்கவும்; இந்த காலத்தில் ஊகமான முதலீடுகளை தவிர்க்கவும்.",
        ]
    elif current_age < 40:
        en += [
            "Career growth and family stability are the twin priorities — balance both deliberately.",
            "Property investment decisions should be made with long-term stability in mind.",
            "Children's health and educational foundation are an active responsibility now.",
            "Avoid major career risks unless the current Mahadasha strongly supports it.",
        ]
        ta += [
            "தொழில் வளர்ச்சியும் குடும்ப நிலைத்தன்மையும் இரட்டை முன்னுரிமைகள் — இரண்டையும் வேண்டுமென சமப்படுத்தவும்.",
            "சொத்து முதலீட்டு முடிவுகளை நீண்ட கால நிலைத்தன்மையை கருத்தில் கொண்டு எடுக்கவும்.",
            "குழந்தைகளின் ஆரோக்கியம் மற்றும் கல்வி அடிப்படை இப்போது செயலில் உள்ள பொறுப்பு.",
            "தற்போதைய மகாதசை வலுவாக ஆதரிக்காத வரை பெரிய தொழில் அபாயங்களை தவிர்க்கவும்.",
        ]
    elif current_age < 50:
        en += [
            "Peak career phase — strategic decisions now define long-term professional legacy.",
            "Wealth consolidation is more important than aggressive growth in this phase.",
            "Children's higher education and settlement is an active priority.",
            "Preventive health checks become essential — do not defer them.",
        ]
        ta += [
            "உச்ச தொழில் காலம் — இப்போது மூலோபாய முடிவுகள் நீண்ட கால தொழில் மரபை தீர்மானிக்கின்றன.",
            "இந்த காலத்தில் ஊக வளர்ச்சியை விட செல்வம் ஒருங்கிணைப்பு அதிக முக்கியம்.",
            "குழந்தைகளின் உயர்கல்வியும் குடியேற்றமும் செயலில் உள்ள முன்னுரிமை.",
            "தடுப்பு உடல்நல பரிசோதனைகள் அவசியமாகின்றன — அவற்றை தள்ளி வைக்காதீர்கள்.",
        ]
    elif current_age < 60:
        en += [
            "Protecting and organising accumulated wealth is the central financial task.",
            "Health requires proactive attention — regular checkups and lifestyle discipline.",
            "Spiritual and dharmic practices deepen naturally — this is a good time to invest in them.",
            "Supporting children's life transitions (marriage, career) is an active focus.",
        ]
        ta += [
            "திரட்டப்பட்ட செல்வத்தை பாதுகாப்பது மற்றும் ஒழுங்கமைப்பது மையமான நிதி பணி.",
            "ஆரோக்கியத்திற்கு முன்னோக்கிய கவனம் தேவை — வழக்கமான பரிசோதனைகளும் வாழ்க்கை முறை ஒழுக்கமும்.",
            "ஆன்மீக மற்றும் தர்ம நடைமுறைகள் இயற்கையாகவே ஆழமடைகின்றன — அவற்றில் முதலீடு செய்ய இது நல்ல நேரம்.",
            "குழந்தைகளின் வாழ்க்கை மாற்றங்களை (திருமணம், தொழில்) ஆதரிப்பது செயலில் உள்ள கவனம்.",
        ]
    else:
        en += [
            "Health preservation and daily routine stability are the primary focus.",
            "Spiritual practice and connection with family legacy are deeply fulfilling now.",
            "Delegating financial management responsibilities to the next generation is wise.",
            "Maintaining social connection and purpose prevents isolation and supports wellbeing.",
        ]
        ta += [
            "ஆரோக்கிய பாதுகாப்பும் தினசரி வழக்கமான நிலைத்தன்மையும் முதன்மை கவனம்.",
            "ஆன்மீக நடைமுறையும் குடும்ப மரபுடன் தொடர்பும் இப்போது ஆழமான திருப்தியை தருகின்றன.",
            "நிதி மேலாண்மை பொறுப்புகளை அடுத்த தலைமுறைக்கு ஒப்படைப்பது புத்திசாலித்தனம்.",
            "சமூக தொடர்பு மற்றும் நோக்கத்தை பராமரிப்பது தனிமைப்படுத்தலை தடுக்கிறது மற்றும் நலன்புரிவை ஆதரிக்கிறது.",
        ]

    # Dasha-specific overlay
    _add_dasha_guidance(en, ta, mahadasha_lord, antardasha_lord)

    # Planetary strength overlay
    _add_planet_strength_guidance(en, ta, strong_planets, weak_planets, current_age)

    return {"en": en, "ta": ta}


def _add_dasha_guidance(en: list[str], ta: list[str], mahadasha: str, antardasha: str) -> None:
    dasha_notes: dict[str, tuple[str, str]] = {
        "SUN": (
            "Sun Mahadasha favours authority, government dealings, and public recognition.",
            "சூரிய மகாதசை அதிகாரம், அரசு விவகாரங்கள் மற்றும் பொது அங்கீகாரத்திற்கு சாதகம்.",
        ),
        "MOON": (
            "Moon Mahadasha brings emotional sensitivity — travel, liquids, and maternal connections are highlighted.",
            "சந்திர மகாதசை உணர்வு உணர்திறனை கொண்டுவருகிறது — பயணம், திரவங்கள் மற்றும் தாய்வழி தொடர்புகள் முன்னிலைப்படுத்தப்படுகின்றன.",
        ),
        "MARS": (
            "Mars Mahadasha drives action, courage, and property/land matters — channel the energy constructively.",
            "செவ்வாய் மகாதசை செயல், தைரியம் மற்றும் சொத்து/நில விவகாரங்களை ஊக்குவிக்கிறது — சக்தியை ஆக்கப்பூர்வமாக வழிப்படுத்தவும்.",
        ),
        "MERCURY": (
            "Mercury Mahadasha supports communication, business, education, and intellectual pursuits.",
            "புத மகாதசை தொடர்பு, வணிகம், கல்வி மற்றும் அறிவுசார் நடவடிக்கைகளை ஆதரிக்கிறது.",
        ),
        "JUPITER": (
            "Jupiter Mahadasha is generally expansive — wisdom, teaching, children, and dharmic activity are supported.",
            "குரு மகாதசை பொதுவாக விரிவடையும் — ஞானம், கற்பித்தல், குழந்தைகள் மற்றும் தர்ம செயல்பாடு ஆதரிக்கப்படுகின்றன.",
        ),
        "VENUS": (
            "Venus Mahadasha favours relationships, luxury, arts, and material comforts.",
            "சுக்கிர மகாதசை உறவுகள், ஆடம்பரம், கலை மற்றும் பொருள் ஆறுதல்களுக்கு சாதகம்.",
        ),
        "SATURN": (
            "Saturn Mahadasha demands discipline, patience, and long-term structured effort — shortcuts backfire.",
            "சனி மகாதசை ஒழுக்கம், பொறுமை மற்றும் நீண்ட கால திட்டமிட்ட முயற்சியை கோருகிறது — குறுக்குவழிகள் தவறுகின்றன.",
        ),
        "RAHU": (
            "Rahu Mahadasha brings ambitious drives and unconventional paths — focus and discernment are crucial.",
            "ராகு மகாதசை ஆர்வமிக்க இயக்கங்களையும் வழக்கத்திற்கு மாறான பாதைகளையும் கொண்டுவருகிறது — கவனம் மற்றும் நுண்ணறிவு முக்கியம்.",
        ),
        "KETU": (
            "Ketu Mahadasha fosters detachment, spiritual insight, and completion of past karma.",
            "கேது மகாதசை பிரிவு, ஆன்மீக நுண்ணறிவு மற்றும் கடந்த கால கர்மத்தின் நிறைவை வளர்க்கிறது.",
        ),
    }
    if mahadasha in dasha_notes:
        en.append(dasha_notes[mahadasha][0])
        ta.append(dasha_notes[mahadasha][1])


def _add_planet_strength_guidance(
    en: list[str],
    ta: list[str],
    strong_planets: list[str],
    weak_planets: list[str],
    current_age: int,
) -> None:
    if "JUPITER" in strong_planets:
        en.append("Strong Jupiter supports wisdom, growth, and benefic outcomes this period.")
        ta.append("வலுவான குரு இந்த காலத்தில் ஞானம், வளர்ச்சி மற்றும் நற்பலன்களை ஆதரிக்கிறது.")
    if "VENUS" in strong_planets and current_age >= 18 and current_age < 55:
        en.append("Strong Venus augments relationship harmony and material wellbeing.")
        ta.append("வலுவான சுக்கிரன் உறவு நல்லிணக்கம் மற்றும் பொருள் நலனை அதிகரிக்கிறது.")
    if "SATURN" in weak_planets and current_age >= 25:
        en.append("Weak Saturn indicates the need for extra discipline in commitments and long-term planning.")
        ta.append("பலவீனமான சனி கடமைகள் மற்றும் நீண்ட கால திட்டமிடலில் கூடுதல் ஒழுக்கம் தேவை என்பதை குறிக்கிறது.")
    if "MARS" in weak_planets:
        en.append("Weak Mars calls for measured action — avoid impulsive decisions and physical overexertion.")
        ta.append("பலவீனமான செவ்வாய் கண்ணளவிய செயல்பாட்டை கோருகிறது — தன்னிச்சையான முடிவுகள் மற்றும் உடல் அதிக உழைப்பை தவிர்க்கவும்.")


# Return age-appropriate optional remedies (not generic).
def get_age_based_remedies(
    current_age: int,
    mahadasha_lord: str,
    lagna_rasi: str,
    weak_planets: list[str],
) -> dict[str, list[str]]:
    en: list[str] = []
    ta: list[str] = []

    # Universal base by age
    if current_age < 18:
        en.append("Offer prayers at the family kula deivam temple on auspicious days.")
        ta.append("மங்கலமான நாட்களில் குல தெய்வ கோயிலில் வழிபாடு செய்யவும்.")
    elif current_age < 35:
        en.append("Navagraha puja on Saturdays and lighting a lamp on Fridays supports stability.")
        ta.append("சனிக்கிழமைகளில் நவகிரக பூஜை மற்றும் வெள்ளிக்கிழமைகளில் விளக்கேற்றுவது நிலைத்தன்மையை ஆதரிக்கிறது.")
    elif current_age < 55:
        en.append("Regular temple visits on the nakshatra of your birth star maintains alignment.")
        ta.append("உங்கள் ஜன்ம நட்சத்திர நாளில் வழக்கமான கோயில் வருகை சரியான தாளத்தை பராமரிக்கிறது.")
    else:
        en.append("Ancestral puja (pitru tharpanam) on Amavasai maintains family karmic balance.")
        ta.append("அமாவாசையில் பித்ரு தர்ப்பணம் குடும்ப கர்ம சமநிலையை பராமரிக்கிறது.")

    # Dasha-specific remedy
    dasha_remedies: dict[str, tuple[str, str]] = {
        "SUN": ("Offer water (arghya) to the rising Sun on Sundays.", "ஞாயிற்றுக்கிழமைகளில் உதய சூரியனுக்கு அர்க்கியம் செலுத்தவும்."),
        "MOON": ("Fasting or simple sattvic food on Mondays and offering milk to Shiva/Goddess.", "திங்கட்கிழமைகளில் விரதம் அல்லது சாத்வீக உணவு மற்றும் சிவன்/தேவிக்கு பால் படைத்தல்."),
        "MARS": ("Hanuman puja on Tuesdays and reciting Anjaneya stotra supports Mars.", "செவ்வாய்க்கிழமைகளில் ஆஞ்சநேய பூஜை மற்றும் அஞ்சநேய ஸ்தோத்திரம் செவ்வாயை ஆதரிக்கும்."),
        "MERCURY": ("Reciting Vishnu sahasranamam on Wednesdays supports Mercury.", "புதன்கிழமைகளில் விஷ்ணு சஹஸ்ரநாமம் புதனை ஆதரிக்கும்."),
        "JUPITER": ("Guru puja on Thursdays and reading Devi Bhagavatam or Guru stotram.", "வியாழக்கிழமைகளில் குரு பூஜை மற்றும் தேவி பாகவதம் அல்லது குரு ஸ்தோத்திரம் படிக்கவும்."),
        "VENUS": ("Lakshmi puja on Fridays and offering white flowers to the Goddess.", "வெள்ளிக்கிழமைகளில் லட்சுமி பூஜை மற்றும் தேவிக்கு வெள்ளை பூக்கள் படைத்தல்."),
        "SATURN": ("Light sesame-oil lamp on Saturdays and recite Shani stotra for Saturn strength.", "சனிக்கிழமைகளில் நல்லெண்ணெய் விளக்கு ஏற்றி சனி ஸ்தோத்திரம் சொல்லவும்."),
        "RAHU": ("Durga/Kali puja on Tuesdays and offering blue/dark flowers may mitigate Rahu.", "செவ்வாய்க்கிழமைகளில் துர்கா/காளி பூஜை மற்றும் நீல/கருமையான பூக்கள் படைத்தல் ராகுவை தணிக்கலாம்."),
        "KETU": ("Ganesh puja on Tuesdays and reciting Ganesh stotra supports Ketu.", "செவ்வாய்க்கிழமைகளில் கணேஷ் பூஜை மற்றும் கணேஷ் ஸ்தோத்திரம் கேதுவை ஆதரிக்கும்."),
    }
    if mahadasha_lord in dasha_remedies:
        en.append(dasha_remedies[mahadasha_lord][0])
        ta.append(dasha_remedies[mahadasha_lord][1])

    # Weak planet remedies
    for planet in weak_planets[:2]:  # limit to top 2 weak planets
        planet_remedies: dict[str, tuple[str, str]] = {
            "SUN": ("Offer water to the Sun at sunrise to strengthen solar energy in the chart.", "ஜாதகத்தில் சூரிய சக்தியை வலுப்படுத்த சூரிய உதயத்தில் நீர் அர்ப்பணிக்கவும்."),
            "MOON": ("White or silver objects, milk offerings on Mondays support Moon.", "வெள்ளை அல்லது வெள்ளி பொருட்கள், திங்கட்கிழமைகளில் பால் படைத்தல் சந்திரனை ஆதரிக்கும்."),
            "MARS": ("Coral gemstone (in silver/gold, after proper muhurtha) may strengthen Mars.", "மூங்கில் மவுல் (சரியான முகூர்த்தத்திற்கு பின் வெள்ளி/தங்கத்தில்) செவ்வாயை வலுப்படுத்தலாம்."),
            "MERCURY": ("Green moong dal offering on Wednesdays supports Mercury.", "புதன்கிழமைகளில் பச்சை பாசிப்பருப்பு படைத்தல் புதனை ஆதரிக்கும்."),
            "JUPITER": ("Yellow sapphire or yellow topaz (after consultation) supports Jupiter.", "மஞ்சள் நீலம் அல்லது மஞ்சள் புஷ்பராகம் (ஆலோசனையின் பின்) குருவை ஆதரிக்கும்."),
            "VENUS": ("White sapphire or diamond (after proper consultation) strengthens Venus.", "வெள்ளை நீலம் அல்லது வைரம் (சரியான ஆலோசனையின் பின்) சுக்கிரனை வலுப்படுத்தும்."),
            "SATURN": ("Iron or lead offerings, sesame lamps on Saturdays balance Saturn.", "இரும்பு அல்லது ஈயம் படைத்தல், சனிக்கிழமைகளில் எள்ளு விளக்கு சனியை சமப்படுத்தும்."),
        }
        if planet in planet_remedies:
            en.append(planet_remedies[planet][0])
            ta.append(planet_remedies[planet][1])

    return {"en": en, "ta": ta}


# Generate a fully semantic executive summary based on the chart's actual data.
def build_executive_summary(
    current_age: int,
    lagna_rasi: str,
    moon_rasi: str,
    nakshatra: str,
    mahadasha_lord: str,
    antardasha_lord: str,
    strong_planets: list[str],
    weak_planets: list[str],
    active_yogas: list[str],
    active_doshams: list[str],
) -> dict[str, str]:
    strong_str = ", ".join(strong_planets[:3]) if strong_planets else "none dominant"
    weak_str = ", ".join(weak_planets[:2]) if weak_planets else "well-balanced"
    yoga_str = ", ".join(active_yogas[:2]) if active_yogas else "general chart pattern"
    dosham_str = f" Notable doshams require careful matching: {', '.join(active_doshams[:2])}." if active_doshams else ""

    phase_label = get_age_phase_label(current_age)

    en = (
        f"This chart belongs to a {phase_label['en'].lower()} person aged {current_age}, "
        f"born with {lagna_rasi} lagna and {moon_rasi} moon rasi (nakshatra: {nakshatra}). "
        f"Currently running {mahadasha_lord} mahadasha — {antardasha_lord} antardasha. "
        f"Strongest planets: {strong_str}. Planets needing support: {weak_str}. "
        f"Active yogas: {yoga_str}.{dosham_str} "
        f"Guidance and predictions presented are specific to the {phase_label['en'].lower()} stage of life."
    )

    ta = (
        f"இந்த ஜாதகம் {current_age} வயதான {phase_label['ta']} நிலையில் உள்ள ஒருவருக்கு சொந்தமானது, "
        f"{lagna_rasi} லக்னம் மற்றும் {moon_rasi} சந்திர ராசியில் (நட்சத்திரம்: {nakshatra}) பிறந்தவர். "
        f"தற்போது {mahadasha_lord} மகாதசை — {antardasha_lord} அந்தரதசை நடக்கிறது. "
        f"வலுவான கிரகங்கள்: {strong_str}. ஆதரவு தேவைப்படும் கிரகங்கள்: {weak_str}. "
        f"நடப்பு யோகங்கள்: {yoga_str}.{dosham_str} "
        f"வழிகாட்டல் மற்றும் கணிப்புகள் {phase_label['ta']} வாழ்க்கை நிலைக்கு குறிப்பிட்டவை."
    )

    return {"en": en, "ta": ta}


# Build age-specific current year guidance.
def build_year_guidance(
    current_age: int,
    mahadasha_lord: str,
    antardasha_lord: str,
    strong_planets: list[str],
) -> dict[str, str]:
    # Base guidance driven by dasha lords
    dasha_year: dict[str, tuple[str, str]] = {
        "SUN": (
            "This year the Sun's influence highlights authority, visibility, and professional identity. Decisions about career and reputation made now carry weight.",
            "இந்த ஆண்டு சூரியனின் ஆதிக்கம் அதிகாரம், புலப்பாடு மற்றும் தொழில் அடையாளத்தை முன்னிலைப்படுத்துகிறது. இப்போது எடுக்கப்படும் தொழில் மற்றும் பெருமை தொடர்பான முடிவுகள் தாக்கத்தை கொண்டிருக்கின்றன.",
        ),
        "MOON": (
            "Moon's energy this year favours emotional renewal, travel, and maternal relationships. Maintain mental calm and avoid major upheavals.",
            "இந்த ஆண்டு சந்திரனின் சக்தி உணர்வு புதுப்பிப்பு, பயணம் மற்றும் தாய்வழி உறவுகளுக்கு சாதகம். மன அமைதியை பராமரிக்கவும் மற்றும் பெரிய குழப்பங்களை தவிர்க்கவும்.",
        ),
        "MARS": (
            "Mars drives action and initiative this year — ideal for new ventures, property decisions, and physical health goals. Channel energy without aggression.",
            "செவ்வாய் இந்த ஆண்டு செயல் மற்றும் முன்முயற்சியை ஊக்குவிக்கிறது — புதிய முயற்சிகள், சொத்து முடிவுகள் மற்றும் உடல் ஆரோக்கிய இலக்குகளுக்கு சிறந்தது. ஆக்கிரமிப்பு இல்லாமல் சக்தியை வழிப்படுத்தவும்.",
        ),
        "MERCURY": (
            "Mercury year favours communication, business deals, writing, and intellectual work. Sharpen clarity in agreements and avoid verbal misunderstandings.",
            "புத ஆண்டு தொடர்பு, வணிக ஒப்பந்தங்கள், எழுத்து மற்றும் அறிவுசார் வேலைக்கு சாதகம். ஒப்பந்தங்களில் தெளிவை கூர்மைப்படுத்தவும் மற்றும் வாய்மொழி தவறான புரிதல்களை தவிர்க்கவும்.",
        ),
        "JUPITER": (
            "Jupiter's benediction this year expands opportunities in education, wisdom, dharmic work, and family. Act with gratitude and generosity.",
            "இந்த ஆண்டு குருவின் வரம் கல்வி, ஞானம், தர்ம வேலை மற்றும் குடும்பத்தில் வாய்ப்புகளை விரிவாக்குகிறது. நன்றி மற்றும் தாராள மனதுடன் செயல்படவும்.",
        ),
        "VENUS": (
            "Venus year supports relationship harmony, creative pursuits, beauty, and material comfort. Be discerning in financial indulgences.",
            "சுக்கிர ஆண்டு உறவு நல்லிணக்கம், படைப்பாற்றல் நடவடிக்கைகள், அழகு மற்றும் பொருள் ஆறுதலை ஆதரிக்கிறது. நிதி அனுபவங்களில் நுண்ணறிவுடன் இருக்கவும்.",
        ),
        "SATURN": (
            "Saturn demands disciplined, patient, sustained effort this year. Shortcuts and careless decisions will create long-lasting complications. Build carefully.",
            "சனி இந்த ஆண்டு ஒழுக்கமான, பொறுமையான, தொடர்ந்த முயற்சியை கோருகிறது. குறுக்குவழிகள் மற்றும் கவலையற்ற முடிவுகள் நீண்ட காலமாக உள்ள சிக்கல்களை உருவாக்கும். கவனமாக உருவாக்கவும்.",
        ),
        "RAHU": (
            "Rahu year brings ambition and disruption in equal measure. Unconventional opportunities arise but require careful discrimination. Focus your intent precisely.",
            "ராகு ஆண்டு சம அளவில் ஆர்வமும் குழப்பமும் கொண்டுவருகிறது. வழக்கத்திற்கு மாறான வாய்ப்புகள் எழுகின்றன ஆனால் கவனமான பகுத்தறிவு தேவை. உங்கள் நோக்கத்தை துல்லியமாக கவனமாக வைக்கவும்.",
        ),
        "KETU": (
            "Ketu year fosters spiritual depth, letting go, and completion of long-standing matters. Avoid starting many new initiatives — this is a year of completion.",
            "கேது ஆண்டு ஆன்மீக ஆழம், விட்டுக்கொடுத்தல் மற்றும் நீண்ட காலமாக உள்ள விஷயங்களை முடிப்பதை வளர்க்கிறது. பல புதிய முயற்சிகளை தொடங்குவதை தவிர்க்கவும் — இது நிறைவு ஆண்டு.",
        ),
    }

    base_en, base_ta = dasha_year.get(
        mahadasha_lord,
        ("This year calls for steady effort and careful planning aligned with your current life phase.",
         "இந்த ஆண்டு உங்கள் தற்போதைய வாழ்க்கை நிலையுடன் ஒத்திசைந்த ஒழுக்கமான முயற்சியும் கவனமான திட்டமிடலும் தேவை.")
    )

    # Age-phase modifier
    if current_age < 25:
        suffix_en = " At this life stage, prioritise learning and avoid locking in irreversible commitments."
        suffix_ta = " இந்த வாழ்க்கை நிலையில், கற்றலை முன்னுரிமை கொடுங்கள் மற்றும் திரும்ப முடியாத கடமைகளை தவிர்க்கவும்."
    elif current_age < 45:
        suffix_en = " In this building phase, use the dasha energy to consolidate career and family foundations."
        suffix_ta = " இந்த கட்டுமான காலத்தில், தொழில் மற்றும் குடும்ப அடித்தளங்களை ஒருங்கிணைக்க தசை சக்தியை பயன்படுத்தவும்."
    else:
        suffix_en = " In this mature phase, prioritise quality over quantity in all decisions."
        suffix_ta = " இந்த முதிர்ச்சி காலத்தில், அனைத்து முடிவுகளிலும் அளவை விட தரத்தை முன்னுரிமை கொடுங்கள்."

    return {"en": base_en + suffix_en, "ta": base_ta + suffix_ta}
