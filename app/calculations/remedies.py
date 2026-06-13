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
    seva_ta: str
    seva_en: str


PLANET_REMEDY_CATALOG: dict[str, PlanetRemedy] = {
    "SUN": PlanetRemedy("SUN", "ஞாயிறு", "சூரியனார் கோவில்", "Sooriyanar Koil (Suryanar Kovil)", "ஓம் ஹ்ராம்", "ஓம் ஹ்ராம் ஹ்ரீம் ஹ்ரௌம் ஸஹ சூர்யாய நம:", 7000, "கோதுமை, செம்மண் துணி", "Wheat, red cloth", "மாணிக்கம்", "Ruby", "Gold", "Ring finger", "ஞாயிறு விரதம்", "Fast on Sunday", "அகம்பாவம் குறைக்கவும்.", "Reduce ego and practice gratitude.", "ஞாயிறுகளில் முதியோர் இல்லம் அல்லது அனாதை இல்லத்தில் அன்னதானம் செய்யுங்கள். கண் பார்வை குறைந்தவருக்கு உதவுங்கள். அரசு பள்ளி மாணவருக்கு புத்தகம் அல்லது கட்டணம் கொடுங்கள்.", "Do annadhanam (feed the poor) at an old age home or orphanage on Sundays. Help a visually impaired person. Sponsor a government school child's books or fees."),
    "MOON": PlanetRemedy("MOON", "திங்கள்", "திங்களூர் சந்திர ஸ்தலம்", "Thingaloor Chandra Sthalam", "ஓம் ஷ்ராம்", "ஓம் ஷ்ராம் ஷ்ரீம் ஷ்ரௌம் ஸஹ சந்திராய நம:", 11000, "அரிசி, பால்", "Rice, milk", "முத்து", "Pearl", "Silver", "Little finger", "திங்கள் விரதம்", "Fast on Monday", "மன அமைதி பழகவும்.", "Practice calm emotional expression.", "தாய்மார்கள் அல்லது சிறு குழந்தைகளுக்கு உணவு வழங்குங்கள். ஒரு பெண் குழந்தையின் கல்விக்கு உதவுங்கள். ஆதரவற்ற பெண்களுக்கு மருந்து அல்லது உணவு அளியுங்கள்.", "Feed mothers or young children. Sponsor a girl child's education. Support a woman in need — food, medicine, or school fees."),
    "MARS": PlanetRemedy("MARS", "செவ்வாய்", "வைத்தீஸ்வரன் கோவில்", "Vaitheeswaran Koil Angaraka Sthalam", "ஓம் க்ராம்", "ஓம் க்ராம் க்ரீம் க்ரௌம் ஸஹ பௌமாய நம:", 10000, "சிவப்பு பருப்பு", "Red lentils", "பவளம்", "Red Coral", "Gold", "Ring finger", "செவ்வாய் விரதம்", "Fast on Tuesday", "கோபக் கட்டுப்பாடு.", "Control anger and impulsiveness.", "இரத்த தானம் செய்யுங்கள். விபத்தில் காயப்பட்டவருக்கு அல்லது மருத்துவமனை நோயாளிக்கு உதவுங்கள். முன்னாள் படை வீரர்கள் அல்லது அவர்கள் குடும்பங்களுக்கு உதவுங்கள்.", "Donate blood. Help an accident victim or a hospital patient who cannot afford care. Support a soldier's family or veterans' welfare fund."),
    "MERCURY": PlanetRemedy("MERCURY", "புதன்", "திருவெண்காடு புதன் ஸ்தலம்", "Thiruvenkadu Budha Sthalam", "ஓம் ப்ராம்", "ஓம் ப்ராம் ப்ரீம் ப்ரௌம் ஸஹ புத்தாய நம:", 9000, "பச்சை பயறு", "Green gram", "மரகதம்", "Emerald", "Gold", "Little finger", "புதன் விரதம்", "Fast on Wednesday", "ஒழுங்கான கற்றல் பழக்கம்.", "Maintain disciplined learning.", "ஒரு ஏழை மாணவரின் ஒரு பருவ கல்விக் கட்டணம் கட்டுங்கள். அரசு பள்ளிக்கு புத்தகம் அல்லது எழுது பொருட்கள் வழங்குங்கள். ஒரு பெண் குழந்தையின் முழு ஆண்டு கல்விக்கு நன்கொடை செய்யுங்கள்.", "Pay a term's school fees for an underprivileged student. Donate books or stationery to a government school. Sponsor a girl child's full year of education."),
    "JUPITER": PlanetRemedy("JUPITER", "வியாழன்", "ஆலங்குடி குரு ஸ்தலம்", "Alangudi Guru Sthalam", "ஓம் கிராம்", "ஓம் கிராம் க்ரீம் கிரௌம் ஸஹ குரவே நம:", 19000, "கொண்டைக்கடலை", "Chickpeas", "புஷ்பராகம்", "Yellow Sapphire", "Gold", "Index finger", "வியாழன் விரதம்", "Fast on Thursday", "ஆசிரியர் அருள் பெறவும்.", "Seek teacher/guru guidance.", "ஒரு தகுதியான மாணவரின் கல்லூரிக் கட்டணம் கட்டுங்கள். ஏழைகளுக்கு சேவை செய்யும் பள்ளி அல்லது ஆசிரியருக்கு நன்கொடை வழங்குங்கள். பெண் குழந்தை கல்வி நல அமைப்பிற்கு நன்கொடை செய்யுங்கள்.", "Sponsor the complete education of a deserving student. Donate to a school or teacher serving the poor. Contribute to a girl child education or welfare fund."),
    "VENUS": PlanetRemedy("VENUS", "வெள்ளி", "கஞ்சனூர் சுக்கிரன் ஸ்தலம்", "Kanjanur Sukra Sthalam", "ஓம் ஷும்", "ஓம் ஷும் ஷுக்ராய நம:", 16000, "வெள்ளை துணி", "White cloth", "வைரம்", "Diamond", "Silver", "Ring finger", "வெள்ளி விரதம்", "Fast on Friday", "உறவில் மரியாதை பேணி நடக்கவும்.", "Practice harmony in relationships.", "ஒரு பெண் குழந்தையின் கல்வி அல்லது திருமணச் செலவுக்கு உதவுங்கள். ஆதரவற்ற பெண்களுக்கு தொழில் தொடங்க உதவுங்கள். பெண் கல்வி அல்லது பெண் மேம்பாட்டு அமைப்பிற்கு நன்கொடை வழங்குங்கள்.", "Support a girl child's education or an underprivileged woman's marriage expenses. Help a woman start her livelihood. Donate to a women's education or empowerment organisation."),
    "SATURN": PlanetRemedy("SATURN", "சனி", "திருநள்ளாறு சனி ஸ்தலம்", "Thirunallar Sani Sthalam", "ஓம் ஷாம்", "ஓம் ஷாம் ஷனேஷ்சராய நம:", 23000, "எள், கருப்பு துணி", "Sesame, black cloth", "நீலம்", "Blue Sapphire", "Iron", "Middle finger", "சனி விரதம்", "Fast on Saturday", "ஒழுக்கமும் சேவையும் வளர்க்கவும்.", "Build discipline and service.", "அன்னதானம் செய்யுங்கள் — பசிப்பவருக்கு உணவளியுங்கள். தினக்கூலி தொழிலாளி அல்லது சுத்தம் செய்வோருக்கு உதவுங்கள். தனிமையில் இருக்கும் வயதான ஒருவருக்கு உணவு, மருந்து அல்லது நேரம் கொடுங்கள்.", "Do annadhanam — feed the hungry at a shelter or on the street. Help a daily wage worker or sanitation worker. Support an elderly person living alone with food, medicine, or your time."),
    "RAHU": PlanetRemedy("RAHU", "ராகு காலம் (தினமும்)", "திருநாகேஸ்வரம் ராகு ஸ்தலம்", "Thirunageswaram Rahu Sthalam", "ஓம் ப்ராம்", "ஓம் ப்ராம் ப்ரீம் ப்ரௌம் ஸஹ ராஹவே நம:", 18000, "தேங்காய், கருப்பு உளுந்து", "Coconut, black gram", "கோமேதகம்", "Hessonite", "Silver", "Middle finger", "ராகு கால விரதம்", "Fast on the daily Rahu Kalam window", "ஒரே குறிக்கோளில் கவனம்.", "Focus on one direction.", "தனிமையில் வாழ்பவருக்கு அல்லது சமூகத்தால் ஒதுக்கப்பட்டவருக்கு உதவுங்கள். அனாதை இல்லத்திற்கு நன்கொடை செய்யுங்கள். முதல் தலைமுறை கல்லூரி மாணவருக்கு வழிகாட்டுதல் அல்லது தொழில் ஆலோசனை வழங்குங்கள்.", "Help the socially marginalised or isolated. Donate to an orphanage. Provide career guidance or mentoring to a first-generation college student."),
    "KETU": PlanetRemedy("KETU", "சனி", "கீழ்ப்பெரும்பள்ளம் கேது ஸ்தலம்", "Keezhaperumpallam Ketu Sthalam", "ஓம் ஸ்ராம்", "ஓம் ஸ்ராம் ஸ்ரீம் ஸ்ரௌம் ஸஹ கேதவே நம:", 17000, "கலவை தானியம்", "Mixed grains", "வைடூரியம்", "Cat's Eye", "Silver", "Ring finger", "சனி விரதம் (விநாயகர் வழிபாடு)", "Fast on Saturday (Vinayagar worship)", "தியானம் வளர்க்கவும்.", "Deepen meditation practice.", "நோய்வாய்ப்பட்ட ஏழைக்கு அல்லது மரணப்படுக்கையில் இருப்பவருக்கு உதவுங்கள். பசுக்கள் அல்லது தெரு விலங்குகளுக்கு உணவளியுங்கள். தியானம் அல்லது யோகா கற்க இயலாதவருக்கு நன்கொடை செய்யுங்கள்.", "Help a destitute or terminally ill person. Feed cows or street animals. Sponsor meditation or yoga education for someone who cannot afford it."),
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
