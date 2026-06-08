from __future__ import annotations

from dataclasses import asdict, dataclass

from app.calculations.functional_nature import FunctionalNature


@dataclass(frozen=True)
class PlanetRemedy:
    planet: str
    day: str
    temple_ta: str
    temple_en: str
    mantra_seed: str
    mantra_full_ta: str
    japa_count: int
    daanam_items_ta: str
    daanam_items_en: str
    gemstone_ta: str
    gemstone_en: str
    metal: str
    finger: str
    fasting_rule_ta: str
    fasting_rule_en: str
    behavioural_ta: str
    behavioural_en: str


PLANET_REMEDY_CATALOG: dict[str, PlanetRemedy] = {
    "SUN": PlanetRemedy("SUN", "ஞாயிறு", "சூரியனார் கோவில்", "Sooriyanar Koil (Suryanar Kovil)", "ஓம் ஹ்ராம்", "ஓம் ஹ்ராம் ஹ்ரீம் ஹ்ரௌம் ஸஹ சூர்யாய நம:", 7000, "கோதுமை, செம்மண் துணி", "Wheat, red cloth", "மாணிக்கம்", "Ruby", "Gold", "Ring finger", "ஞாயிறு விரதம்", "Fast on Sunday", "அகம்பாவம் குறைக்கவும்.", "Reduce ego and practice gratitude."),
    "MOON": PlanetRemedy("MOON", "திங்கள்", "திங்களூர் சந்திர ஸ்தலம்", "Thingaloor Chandra Sthalam", "ஓம் ஷ்ராம்", "ஓம் ஷ்ராம் ஷ்ரீம் ஷ்ரௌம் ஸஹ சந்திராய நம:", 11000, "அரிசி, பால்", "Rice, milk", "முத்து", "Pearl", "Silver", "Little finger", "திங்கள் விரதம்", "Fast on Monday", "மன அமைதி பழகவும்.", "Practice calm emotional expression."),
    "MARS": PlanetRemedy("MARS", "செவ்வாய்", "வைத்தீஸ்வரன் கோவில்", "Vaitheeswaran Koil Angaraka Sthalam", "ஓம் க்ராம்", "ஓம் க்ராம் க்ரீம் க்ரௌம் ஸஹ பௌமாய நம:", 10000, "சிவப்பு பருப்பு", "Red lentils", "பவளம்", "Red Coral", "Gold", "Ring finger", "செவ்வாய் விரதம்", "Fast on Tuesday", "கோபக் கட்டுப்பாடு.", "Control anger and impulsiveness."),
    "MERCURY": PlanetRemedy("MERCURY", "புதன்", "திருவெண்காடு புதன் ஸ்தலம்", "Thiruvenkadu Budha Sthalam", "ஓம் ப்ராம்", "ஓம் ப்ராம் ப்ரீம் ப்ரௌம் ஸஹ புத்தாய நம:", 9000, "பச்சை பயறு", "Green gram", "மரகதம்", "Emerald", "Gold", "Little finger", "புதன் விரதம்", "Fast on Wednesday", "ஒழுங்கான கற்றல் பழக்கம்.", "Maintain disciplined learning."),
    "JUPITER": PlanetRemedy("JUPITER", "வியாழன்", "ஆலங்குடி குரு ஸ்தலம்", "Alangudi Guru Sthalam", "ஓம் கிராம்", "ஓம் கிராம் க்ரீம் கிரௌம் ஸஹ குரவே நம:", 19000, "கொண்டைக்கடலை", "Chickpeas", "புஷ்பராகம்", "Yellow Sapphire", "Gold", "Index finger", "வியாழன் விரதம்", "Fast on Thursday", "ஆசிரியர் அருள் பெறவும்.", "Seek teacher/guru guidance."),
    "VENUS": PlanetRemedy("VENUS", "வெள்ளி", "கஞ்சனூர் சுக்கிரன் ஸ்தலம்", "Kanjanur Sukra Sthalam", "ஓம் ஷும்", "ஓம் ஷும் ஷுக்ராய நம:", 16000, "வெள்ளை துணி", "White cloth", "வைரம்", "Diamond", "Silver", "Ring finger", "வெள்ளி விரதம்", "Fast on Friday", "உறவில் மரியாதை பேணி நடக்கவும்.", "Practice harmony in relationships."),
    "SATURN": PlanetRemedy("SATURN", "சனி", "திருநள்ளாறு சனி ஸ்தலம்", "Thirunallar Sani Sthalam", "ஓம் ஷாம்", "ஓம் ஷாம் ஷனேஷ்சராய நம:", 23000, "எள், கருப்பு துணி", "Sesame, black cloth", "நீலம்", "Blue Sapphire", "Iron", "Middle finger", "சனி விரதம்", "Fast on Saturday", "ஒழுக்கமும் சேவையும் வளர்க்கவும்.", "Build discipline and service."),
    "RAHU": PlanetRemedy("RAHU", "ராகு காலம் (தினமும்)", "திருநாகேஸ்வரம் ராகு ஸ்தலம்", "Thirunageswaram Rahu Sthalam", "ஓம் ப்ராம்", "ஓம் ப்ராம் ப்ரீம் ப்ரௌம் ஸஹ ராஹவே நம:", 18000, "தேங்காய், கருப்பு உளுந்து", "Coconut, black gram", "கோமேதகம்", "Hessonite", "Silver", "Middle finger", "ராகு கால விரதம்", "Fast on the daily Rahu Kalam window", "ஒரே குறிக்கோளில் கவனம்.", "Focus on one direction."),
    "KETU": PlanetRemedy("KETU", "சனி", "கீழ்ப்பெரும்பள்ளம் கேது ஸ்தலம்", "Keezhaperumpallam Ketu Sthalam", "ஓம் ஸ்ராம்", "ஓம் ஸ்ராம் ஸ்ரீம் ஸ்ரௌம் ஸஹ கேதவே நம:", 17000, "கலவை தானியம்", "Mixed grains", "வைடூரியம்", "Cat's Eye", "Silver", "Ring finger", "சனி விரதம் (விநாயகர் வழிபாடு)", "Fast on Saturday (Vinayagar worship)", "தியானம் வளர்க்கவும்.", "Deepen meditation practice."),
}


def _gemstone_policy(functional_nature: FunctionalNature) -> tuple[bool, str, str, str | None, str | None]:
    if functional_nature in {FunctionalNature.DUSTHANA, FunctionalNature.MARAKA}:
        return False, "இந்த கிரகத்திற்கு ரத்தினம் பரிந்துரை செய்யப்படாது.", "Gemstone is not prescribed for this functional malefic.", "Malefic", "Malefic"
    if functional_nature in {FunctionalNature.YOGAKARAKA, FunctionalNature.TRIKONA, FunctionalNature.LAGNA_LORD}:
        return True, "இந்த கிரகத்திற்கு ரத்தினம் பரிந்துரைக்கப்படுகிறது.", "Gemstone is prescribed for this benefic functional role.", None, None
    return True, "எச்சரிக்கையுடன் அணியலாம்.", "Gemstone is optional with caution.", "Use after expert review", "Use after expert review"


def get_remedy(planet: str, functional_nature: FunctionalNature, severity: str) -> dict:
    remedy = PLANET_REMEDY_CATALOG[planet]
    prescribe, reason_ta, reason_en, caution_ta, caution_en = _gemstone_policy(functional_nature)
    payload = asdict(remedy)
    payload.update(
        {
            "functional_nature": functional_nature.value,
            "severity": severity,
            "is_gemstone_prescribed": prescribe,
            "gemstone_ta": remedy.gemstone_ta if prescribe else None,
            "gemstone_en": remedy.gemstone_en if prescribe else None,
            "reason_ta": reason_ta,
            "reason_en": reason_en,
            "caution_ta": caution_ta,
            "caution_en": caution_en,
        }
    )
    return payload


def get_area_remedy(
    area: str,
    weak_planets: list[str],
    lagna_rasi: int,
    functional_nature_map: dict[str, FunctionalNature],
    score: int,
) -> dict:
    target = weak_planets[0] if weak_planets else "JUPITER"
    fn = functional_nature_map.get(target, FunctionalNature.NEUTRAL)
    severity = "SEVERE" if score < 35 else ("MODERATE" if score < 55 else "MILD")
    remedy = get_remedy(target, fn, severity)
    return {
        "area": area,
        "lagna_rasi": lagna_rasi,
        "primary_planet": target,
        "remedy": remedy,
    }
