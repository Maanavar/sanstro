from __future__ import annotations

from dataclasses import dataclass
from itertools import combinations
from typing import Iterable, Mapping

from app.calculations.astro import house_from_reference
from app.calculations.chart_strength import DEBILITATION_RASI, EXALTATION_RASI, MOOLATRIKONA_ZONE, OWN_SIGN_RASI, SIGN_LORD
from app.calculations.functional_nature import FunctionalNature, get_functional_nature

PlanetInput = int | Mapping[str, int | float | str]

KENDRA_HOUSES = {1, 4, 7, 10}
TRIKONA_HOUSES = {1, 5, 9}
TAMIL_SEVVAI_HOUSES = {1, 2, 4, 7, 8, 12}    # includes 1st house per Tamil Thirukanitham tradition
EXTENDED_SEVVAI_HOUSES = {1, 2, 4, 7, 8, 12}
RAHU_KETU_MARRIAGE_HOUSES = {1, 2, 7, 8}
RAHU_KETU_SARPA_HOUSES = {5, 9}
SEVEN_PLANETS = ("SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN")
NATURAL_BENEFICS = {"JUPITER", "VENUS", "MERCURY", "MOON"}
NATURAL_MALEFICS = {"SATURN", "MARS", "RAHU", "KETU", "SUN"}

# Spec §6.3 — house-sign nivarthi table
HOUSE_SIGN_NIVARTHI: dict[int, frozenset[int]] = {
    2:  frozenset({3, 6}),   # Mithunam(3), Kanni(6)
    4:  frozenset({1, 8}),   # Mesham(1), Viruchigam(8)
    7:  frozenset({4, 10}),  # Kadagam(4), Magaram(10)
    8:  frozenset({9, 12}),  # Dhanusu(9), Meenam(12)
    12: frozenset({2, 7}),   # Rishabam(2), Thulam(7)
}

# Spec §7.2 — gender-based high-attention houses
FEMALE_HIGH_ATTENTION_SEVVAI_HOUSES = {4, 8, 12}
MALE_HIGH_ATTENTION_SEVVAI_HOUSES = {2, 7, 8}

# Spec §6.8 — lagna exceptions (yogakaraka for Mars)
KADAGAM_SIMMAM_LAGNA_EXCEPTION = {4, 5}  # Kadagam=4, Simmam=5

# Spec §6.6 — benefic planets that modify Mars dosham
SEVVAI_BENEFIC_REDUCERS = {"JUPITER", "VENUS", "MERCURY", "MOON"}

# Upachaya houses — Rahu/Ketu more workable here
RAHU_KETU_UPACHAYA_HOUSES = {3, 6, 10, 11}


@dataclass(frozen=True, slots=True)
class YogaResult:
    name: str
    is_present: bool
    strength: str
    conditions_met: list[str]
    cancellation_factors: list[str]
    dasha_activated: bool
    description_ta: str
    description_en: str


@dataclass(frozen=True, slots=True)
class DoshamResult:
    name: str
    is_present: bool
    is_cancelled: bool
    strength: str
    label: str
    category: str
    conditions_met: list[str]
    cancellation_factors: list[str]
    missing_data: list[str]
    dasha_activated: bool
    description_ta: str
    description_en: str
    explanation_what_ta: str
    explanation_what_en: str
    explanation_why_ta: str
    explanation_why_en: str
    explanation_how_ta: str
    explanation_how_en: str


@dataclass(frozen=True, slots=True)
class KalasarpaResult:
    is_present: bool
    pattern: str
    conditions_met: list[str]
    description_ta: str
    description_en: str


def _planet_rasi(planets: Mapping[str, PlanetInput], planet: str) -> int:
    value = planets[planet]
    if isinstance(value, int):
        return value
    if "rasi" in value:
        return int(value["rasi"])
    raise ValueError(f"Missing rasi for {planet}")


def _planets_as_rasi_map(planets: Mapping[str, PlanetInput]) -> dict[str, int]:
    return {planet: _planet_rasi(planets, planet) for planet in planets}


def _house_lord(lagna_rasi: int, house_number: int) -> str:
    house_rasi = ((lagna_rasi + house_number - 2) % 12) + 1
    return SIGN_LORD[house_rasi]


def _is_kendra_from(reference_rasi: int, target_rasi: int) -> bool:
    return house_from_reference(reference_rasi, target_rasi) in KENDRA_HOUSES


def _is_seventh_aspect(rasi_a: int, rasi_b: int) -> bool:
    return house_from_reference(rasi_a, rasi_b) == 7


def _is_functional_benefic(lagna_rasi: int, planet: str) -> bool:
    nature = get_functional_nature(lagna_rasi, planet)
    return nature in {
        FunctionalNature.YOGAKARAKA,
        FunctionalNature.LAGNA_LORD,
        FunctionalNature.TRIKONA,
        FunctionalNature.KENDRA,
        FunctionalNature.NEUTRAL,
    }


def _is_active(active_lords: set[str], *lords: str) -> bool:
    return any(lord in active_lords for lord in lords)


def _strong_planet_house(lagna_rasi: int, planet_rasi: int) -> bool:
    return house_from_reference(lagna_rasi, planet_rasi) in KENDRA_HOUSES | TRIKONA_HOUSES


def _planet_is_strong(planets: Mapping[str, PlanetInput], planet: str, lagna_rasi: int) -> bool:
    planet_rasi = _planet_rasi(planets, planet)
    own_sign = planet_rasi in OWN_SIGN_RASI.get(planet, set())
    exalted = planet_rasi == EXALTATION_RASI.get(planet)
    return own_sign or exalted or _strong_planet_house(lagna_rasi, planet_rasi)


def _marker_explain(marker: str) -> str:
    marker_labels = {
        "from_lagna": "Mars is in a dosha house from Lagna",
        "from_moon": "Mars is in a dosha house from Moon",
        "from_venus": "Mars is in a dosha house from Venus",
        "mars_own_sign": "Mars is in own sign",
        "mars_exaltation": "Mars is exalted",
        "mars_lagna_lord_mitigation": "Lagna-based mitigation applies",
        "mars_yogakaraka_lagna": "Mars is Yogakaraka for this Lagna (Kadagam/Simmam)",
        "house_sign_nivarthi": "House-sign nivarthi: Mars rasi cancels dosham for that house",
        "benefic_strong_seventh_lord": "7th lord strength gives protection",
        "jupiter_aspect_on_mars": "Jupiter influence on Mars reduces intensity",
        "jupiter_conjunct_mars": "Jupiter conjunct Mars in same rasi — strong nivarthi",
        "benefic_association_mars": "Benefic planet (Venus/Mercury/Moon) is conjunct Mars",
        "mars_dispositor_kendra_trikona": "Mars sign-lord is in kendra/trikona from Mars",
        "both_partners_have_sevvai": "Comparable Sevvai in both charts",
        "female_high_attention_house": "Female chart: extra attention on this house for Sevvai",
        "male_high_attention_house": "Male chart: extra attention on this house for Sevvai",
        "node_afflicts_moon": "Rahu/Ketu is conjunct Moon (emotional/stability concern)",
        "rahu_ketu_upachaya": "Rahu/Ketu in upachaya house (3/6/10/11) — more manageable",
        "rahu_in_marriage_house": "Rahu is in marriage-sensitive house",
        "ketu_in_marriage_house": "Ketu is in marriage-sensitive house",
        "rahu_in_sarpa_house": "Rahu is in Sarpa/Naga-sensitive house",
        "ketu_in_sarpa_house": "Ketu is in Sarpa/Naga-sensitive house",
        "node_with_seventh_lord": "Node links with 7th lord",
        "node_with_venus": "Node links with Venus",
        "jupiter_kendra_trikona_support": "Jupiter support exists",
        "strong_seventh_lord": "7th lord is strong",
        "strong_venus": "Venus is strong",
        "sun_with_node": "Sun is linked with Rahu/Ketu",
        "node_in_ninth": "Node is linked to 9th house",
        "saturn_in_ninth": "Saturn is in 9th house",
        "ninth_lord_dusthana": "9th lord is in 6/8/12",
        "sun_strong": "Sun strength acts as mitigation",
        "all_planets_between_rahu_and_ketu": "All planets lie in one Rahu-Ketu arc",
        "all_planets_between_ketu_and_rahu": "All planets lie in one Ketu-Rahu arc",
        "seventh_lord_strong_d9": "7th lord is strong in Navamsa (D9)",
        "jupiter_aspects_seventh_lord": "Jupiter aspects the 7th lord directly",
        "seventh_afflicted": "7th lord or marriage karaka is afflicted",
    }
    return marker_labels.get(marker, marker.replace("_", " "))


def _marker_explain_ta(marker: str) -> str:
    marker_labels_ta = {
        "from_lagna": "செவ்வாய் லக்னத்திலிருந்து தோஷ வீட்டில் உள்ளது",
        "from_moon": "செவ்வாய் சந்திரனிலிருந்து தோஷ வீட்டில் உள்ளது",
        "from_venus": "செவ்வாய் சுக்கிரனிலிருந்து தோஷ வீட்டில் உள்ளது",
        "mars_own_sign": "செவ்வாய் சொந்த ராசியில் உள்ளது",
        "mars_exaltation": "செவ்வாய் உச்சத்தில் உள்ளது",
        "mars_lagna_lord_mitigation": "லக்ன அடிப்படையில் தணிக்கை பொருந்துகிறது",
        "mars_yogakaraka_lagna": "இந்த லக்னத்திற்கு செவ்வாய் யோககாரகனாக செயல்படுகிறது",
        "house_sign_nivarthi": "இட-ராசி நிவர்த்தி தோஷத்தை குறைக்கிறது",
        "benefic_strong_seventh_lord": "7ம் அதிபதியின் வலிமை பாதுகாப்பு தருகிறது",
        "jupiter_aspect_on_mars": "குரு செவ்வாயை பார்க்கிறது; தீவிரம் குறைகிறது",
        "jupiter_conjunct_mars": "குரு செவ்வாயுடன் இணைந்துள்ளது; வலுவான நிவர்த்தி",
        "benefic_association_mars": "சுபகிரகம் செவ்வாயுடன் சேர்ந்துள்ளது",
        "mars_dispositor_kendra_trikona": "செவ்வாயின் ராசி அதிபதி கேந்திரம்/திரிகோணத்தில் உள்ளது",
        "both_partners_have_sevvai": "இரு ஜாதகங்களிலும் ஒத்த செவ்வாய் நிலை உள்ளது",
        "female_high_attention_house": "பெண் ஜாதகத்தில் இந்த செவ்வாய் வீட்டிற்கு கூடுதல் கவனம் தேவை",
        "male_high_attention_house": "ஆண் ஜாதகத்தில் இந்த செவ்வாய் வீட்டிற்கு கூடுதல் கவனம் தேவை",
        "node_afflicts_moon": "ராகு/கேது சந்திரனுடன் சேர்ந்துள்ளது",
        "rahu_ketu_upachaya": "ராகு/கேது உபசய வீட்டில் இருப்பதால் சமாளிக்கும் திறன் உண்டு",
        "rahu_in_marriage_house": "ராகு திருமண உணர்திறன் வீட்டில் உள்ளது",
        "ketu_in_marriage_house": "கேது திருமண உணர்திறன் வீட்டில் உள்ளது",
        "rahu_in_sarpa_house": "ராகு சர்ப்ப/நாக உணர்திறன் வீட்டில் உள்ளது",
        "ketu_in_sarpa_house": "கேது சர்ப்ப/நாக உணர்திறன் வீட்டில் உள்ளது",
        "node_with_seventh_lord": "கிரக கணு 7ம் அதிபதியுடன் தொடர்பு கொள்கிறது",
        "node_with_venus": "கிரக கணு சுக்கிரனுடன் தொடர்பு கொள்கிறது",
        "jupiter_kendra_trikona_support": "குரு ஆதரவு உள்ளது",
        "strong_seventh_lord": "7ம் அதிபதி வலிமையாக உள்ளது",
        "strong_venus": "சுக்கிரன் வலிமையாக உள்ளது",
        "sun_with_node": "சூரியன் ராகு/கேதுவுடன் தொடர்பில் உள்ளது",
        "node_in_ninth": "கிரக கணு 9ம் வீட்டுடன் தொடர்பில் உள்ளது",
        "saturn_in_ninth": "சனி 9ம் வீட்டில் உள்ளது",
        "ninth_lord_dusthana": "9ம் அதிபதி 6/8/12ல் உள்ளது",
        "sun_strong": "சூரியன் வலிமை தணிக்கையாக செயல்படுகிறது",
        "all_planets_between_rahu_and_ketu": "அனைத்து கிரகங்களும் ராகு-கேது வில்லினுள் உள்ளன",
        "all_planets_between_ketu_and_rahu": "அனைத்து கிரகங்களும் கேது-ராகு வில்லினுள் உள்ளன",
        "seventh_lord_strong_d9": "7ம் அதிபதி நவாம்சத்தில் வலிமையாக உள்ளது",
        "jupiter_aspects_seventh_lord": "குரு 7ம் அதிபதியை நேரடியாக பார்க்கிறது",
        "seventh_afflicted": "7ம் அதிபதி அல்லது திருமண காரகன் பாதிக்கப்பட்டுள்ளது",
        "seventh_lord_in_house_6": "7ம் அதிபதி 6ம் வீட்டில் உள்ளது",
        "seventh_lord_in_house_8": "7ம் அதிபதி 8ம் வீட்டில் உள்ளது",
        "seventh_lord_in_house_12": "7ம் அதிபதி 12ம் வீட்டில் உள்ளது",
        "seventh_lord_own_sign": "7ம் அதிபதி சொந்த ராசியில் உள்ளது",
        "seventh_lord_exalted": "7ம் அதிபதி உச்சத்தில் உள்ளது",
    }
    return marker_labels_ta.get(marker, marker.replace("_", " "))


def _build_dosham_explanations(
    dosham_name: str,
    label: str,
    *,
    conditions_met: list[str],
    cancellation_factors: list[str],
    missing_data: list[str],
) -> tuple[str, str, str, str, str, str]:
    what_en_map = {
        "SEVVAI_DOSHAM": "Sevvai dosham is a traditional compatibility sensitivity indicator based on Mars placement.",
        "RAHU_KETU_DOSHAM": "Rahu-Ketu dosham is a traditional node-based sensitivity indicator interpreted by context.",
        "PITRU_DOSHAM": "Pitru dosham is a traditional lineage-karma sensitivity indicator in Tamil astrology.",
        "KALASARPA": "Kala Sarpa indicates all seven classical planets on one side of the Rahu-Ketu axis.",
    }
    what_ta_map = {
        "SEVVAI_DOSHAM": "செவ்வாய் தோஷம் என்பது செவ்வாயின் இடத்தை அடிப்படையாகக் கொண்ட திருமண இணக்கப் பார்வை குறிப்பான்.",
        "RAHU_KETU_DOSHAM": "ராகு-கேது தோஷம் என்பது கிரக நிலைகளை சூழ்நிலையோடு பார்க்கும் பாரம்பரிய தோஷ குறிப்பான்.",
        "PITRU_DOSHAM": "பித்ரு தோஷம் என்பது தமிழ் ஜோதிடத்தில் முன்னோர் கர்ம உணர்திறன் குறிப்பான்.",
        "KALASARPA": "காலசர்ப்ப யோகம் என்பது அனைத்து ஏழு கிரகங்களும் ராகு-கேது அச்சின் ஒரு பக்கத்தில் உள்ளதைக் குறிக்கும்.",
    }
    what_en = what_en_map.get(dosham_name, "This is a traditional dosham indicator.")
    what_ta = what_ta_map.get(dosham_name, "இது ஒரு பாரம்பரிய தோஷ குறிப்பான்.")

    if missing_data:
        why_en = f"Result is marked incomplete because required chart data is missing: {', '.join(missing_data)}."
        why_ta = f"தேவையான ஜாதக தரவு கிடைக்கவில்லை: {', '.join(missing_data)}. முடிவு முழுமையடையவில்லை."
    else:
        why_parts: list[str] = [f"Final label: {label.replace('_', ' ')}."]
        if conditions_met:
            why_parts.append("Triggered factors: " + "; ".join(_marker_explain(item) for item in conditions_met) + ".")
        else:
            why_parts.append("No triggering factors were found.")
        if cancellation_factors:
            why_parts.append("Mitigation factors: " + "; ".join(_marker_explain(item) for item in cancellation_factors) + ".")
        why_en = " ".join(why_parts)
        # Tamil: build readable summary
        ta_parts: list[str] = []
        if conditions_met:
            ta_parts.append("தூண்டும் காரணங்கள்: " + "; ".join(_marker_explain_ta(item) for item in conditions_met) + ".")
        else:
            ta_parts.append("எந்த தூண்டும் காரணமும் இல்லை.")
        if cancellation_factors:
            ta_parts.append("தணிக்கை காரணங்கள்: " + "; ".join(_marker_explain_ta(item) for item in cancellation_factors) + ".")
        why_ta = " ".join(ta_parts)

    how_en = (
        "Use this as a guidance signal, not a fixed outcome. Review the full chart, check cancellation factors,"
        " and combine with practical communication, health, and family support decisions."
    )
    how_ta = (
        "இதை ஒரு வழிகாட்டல் சமிக்ஞையாக மட்டுமே பயன்படுத்துங்கள், முடிவான விளைவாக அல்ல. "
        "முழு ஜாதகத்தையும் பார்க்கவும், தணிக்கை காரணங்களை ஆராயவும், "
        "மேலும் நடைமுறை தொடர்பு, உடல்நலம், குடும்ப ஆதரவு முடிவுகளையும் சேர்க்கவும்."
    )
    return what_ta, what_en, why_ta, why_en, how_ta, how_en


def detect_sevvai_dosham(
    planets: Mapping[str, PlanetInput],
    lagna_rasi: int,
    *,
    sevvai_mode: str = "tamil_standard",
    gender: str | None = None,
    partner_has_sevvai_dosham: bool = False,
    active_lords: Iterable[str] | None = None,
    combust_planets: frozenset[str] = frozenset(),
    d9_rasi_map: Mapping[str, int] | None = None,
    d9_lagna_rasi: int | None = None,
) -> DoshamResult:
    active = set(active_lords or ())
    missing_data = [planet for planet in ("MARS", "MOON", "VENUS") if planet not in planets]
    if missing_data:
        what_ta, what_en, why_ta, why_en, how_ta, how_en = _build_dosham_explanations(
            "SEVVAI_DOSHAM",
            "INCOMPLETE_DATA",
            conditions_met=[],
            cancellation_factors=[],
            missing_data=missing_data,
        )
        return DoshamResult(
            name="SEVVAI_DOSHAM",
            is_present=False,
            is_cancelled=False,
            strength="WEAK",
            label="INCOMPLETE_DATA",
            category="MARRIAGE",
            conditions_met=[],
            cancellation_factors=[],
            missing_data=missing_data,
            dasha_activated=False,
            description_ta="செவ்வாய் தோஷம் பகுப்பாய்விற்கு செவ்வாய், சந்திரன், சுக்கிரன் நிலைகள் தேவை.",
            description_en="Sevvai dosham analysis needs Mars, Moon, and Venus placements.",
            explanation_what_ta=what_ta,
            explanation_what_en=what_en,
            explanation_why_ta=why_ta,
            explanation_why_en=why_en,
            explanation_how_ta=how_ta,
            explanation_how_en=how_en,
        )

    mars_rasi = _planet_rasi(planets, "MARS")
    moon_rasi = _planet_rasi(planets, "MOON")
    venus_rasi = _planet_rasi(planets, "VENUS")
    conditions_met: list[str] = []
    severity_notes: list[str] = []
    sevvai_houses = EXTENDED_SEVVAI_HOUSES if sevvai_mode == "extended_manglik" else TAMIL_SEVVAI_HOUSES
    house_hits: dict[str, int] = {}

    lagna_house = house_from_reference(lagna_rasi, mars_rasi)
    moon_house = house_from_reference(moon_rasi, mars_rasi)
    venus_house = house_from_reference(venus_rasi, mars_rasi)

    if lagna_house in sevvai_houses:
        conditions_met.append("from_lagna")
        house_hits["from_lagna"] = lagna_house
    if moon_house in sevvai_houses:
        conditions_met.append("from_moon")
        house_hits["from_moon"] = moon_house
    if venus_house in sevvai_houses:
        conditions_met.append("from_venus")
        house_hits["from_venus"] = venus_house

    # Gender-based severity annotation (spec §7.2)
    gender_norm = (gender or "").lower()
    for ref_key, house_num in house_hits.items():
        if gender_norm == "female" and house_num in FEMALE_HIGH_ATTENTION_SEVVAI_HOUSES:
            severity_notes.append(f"female_high_attention_house")
            if "female_high_attention_house" not in conditions_met:
                conditions_met.append("female_high_attention_house")
        elif gender_norm == "male" and house_num in MALE_HIGH_ATTENTION_SEVVAI_HOUSES:
            severity_notes.append(f"male_high_attention_house")
            if "male_high_attention_house" not in conditions_met:
                conditions_met.append("male_high_attention_house")

    cancellation_factors: list[str] = []
    mitigation_score = 0
    major_cancellation = False

    # Spec §6.1 — Mars in own sign or exaltation
    if mars_rasi in OWN_SIGN_RASI["MARS"]:
        cancellation_factors.append("mars_own_sign")
        mitigation_score += 1
    if mars_rasi == EXALTATION_RASI["MARS"]:
        cancellation_factors.append("mars_exaltation")
        mitigation_score += 1

    # Spec §6.8 — Kadagam/Simmam lagna yogakaraka exception
    if lagna_rasi in KADAGAM_SIMMAM_LAGNA_EXCEPTION:
        cancellation_factors.append("mars_yogakaraka_lagna")
        mitigation_score += 1
        major_cancellation = True
    elif lagna_rasi in {1, 8} and lagna_house in {1, 2}:
        # Mesham/Viruchigam lagna lord mitigation (original rule retained)
        cancellation_factors.append("mars_lagna_lord_mitigation")
        mitigation_score += 1
        major_cancellation = True

    # Spec §6.3 — house-sign nivarthi table
    for ref_key, house_num in house_hits.items():
        if house_num in HOUSE_SIGN_NIVARTHI and mars_rasi in HOUSE_SIGN_NIVARTHI[house_num]:
            if "house_sign_nivarthi" not in cancellation_factors:
                cancellation_factors.append("house_sign_nivarthi")
            mitigation_score += 1

    # Spec §6.4 — Jupiter aspect on Mars (5th/7th/9th)
    jupiter_rasi = _planet_rasi(planets, "JUPITER")
    jupiter_to_mars = house_from_reference(jupiter_rasi, mars_rasi)
    if jupiter_to_mars in {5, 7, 9}:
        cancellation_factors.append("jupiter_aspect_on_mars")
        mitigation_score += 1

    # Spec §6.5 — Jupiter conjunct Mars (same rasi)
    if jupiter_rasi == mars_rasi:
        cancellation_factors.append("jupiter_conjunct_mars")
        mitigation_score += 1
        major_cancellation = True

    # Spec §6.6 — Benefic association with Mars (Venus/Mercury/Moon in same rasi)
    for benefic in SEVVAI_BENEFIC_REDUCERS - {"JUPITER"}:
        if benefic in planets and _planet_rasi(planets, benefic) == mars_rasi:
            if "benefic_association_mars" not in cancellation_factors:
                cancellation_factors.append("benefic_association_mars")
            mitigation_score += 1
            break

    # Spec §6.7 — Mars dispositor in kendra/trikona from Mars
    mars_sign_lord = SIGN_LORD[mars_rasi]
    if mars_sign_lord in planets:
        lord_rasi = _planet_rasi(planets, mars_sign_lord)
        if house_from_reference(mars_rasi, lord_rasi) in KENDRA_HOUSES | TRIKONA_HOUSES:
            cancellation_factors.append("mars_dispositor_kendra_trikona")
            mitigation_score += 1

    # Strong 7th lord reduces dosham (Spec §13.2 extended checks)
    seventh_lord = _house_lord(lagna_rasi, 7)
    if seventh_lord in planets:
        seventh_lord_rasi = _planet_rasi(planets, seventh_lord)
        seventh_lord_is_strong = _is_functional_benefic(lagna_rasi, seventh_lord) and _is_kendra_from(lagna_rasi, seventh_lord_rasi)
        # Extended: not conjunct malefics
        malefics = {"MARS", "SATURN", "RAHU", "KETU"}
        conjunct_malefic = any(
            p in planets and _planet_rasi(planets, p) == seventh_lord_rasi
            for p in malefics if p != seventh_lord
        )
        # Extended: not combust
        seventh_lord_combust = seventh_lord in combust_planets
        # Extended: strong in D9 Navamsa
        d9_strong = False
        if d9_rasi_map and d9_lagna_rasi and seventh_lord in d9_rasi_map:
            d9_house = house_from_reference(d9_lagna_rasi, d9_rasi_map[seventh_lord])
            d9_strong = d9_house in (KENDRA_HOUSES | TRIKONA_HOUSES)
        # Extended: Jupiter aspecting 7th lord (5th/7th/9th from Jupiter)
        jupiter_aspect_7l = False
        if "JUPITER" in planets:
            jup_rasi = _planet_rasi(planets, "JUPITER")
            jupiter_aspect_7l = house_from_reference(jup_rasi, seventh_lord_rasi) in {5, 7, 9}
        if seventh_lord_is_strong and not conjunct_malefic and not seventh_lord_combust:
            cancellation_factors.append("benefic_strong_seventh_lord")
            mitigation_score += 1
        if d9_strong:
            cancellation_factors.append("seventh_lord_strong_d9")
            mitigation_score += 1
        if jupiter_aspect_7l:
            cancellation_factors.append("jupiter_aspects_seventh_lord")
            mitigation_score += 1

    if partner_has_sevvai_dosham:
        cancellation_factors.append("both_partners_have_sevvai")
        major_cancellation = True

    is_present = len([c for c in conditions_met if c not in {"female_high_attention_house", "male_high_attention_house"}]) > 0
    is_cancelled = is_present and (major_cancellation or mitigation_score >= 2)
    strong_house_hit = any(house_hits.get(key) in {7, 8} for key in house_hits)
    if not is_present or is_cancelled:
        strength = "WEAK"
    elif strong_house_hit or len([c for c in conditions_met if c.startswith("from_")]) >= 2:
        strength = "STRONG"
    else:
        strength = "PARTIAL"

    if not is_present:
        label = "NO_SEVVAI_DOSHAM"
    elif is_cancelled:
        label = "SEVVAI_DOSHAM_WITH_NIVARTHI"
    elif "from_lagna" not in conditions_met and "from_moon" not in conditions_met and "from_venus" in conditions_met:
        label = "SEVVAI_DOSHAM_CANDIDATE"
    elif strength == "STRONG":
        label = "STRONG_ACTIVE_SEVVAI_DOSHAM"
    else:
        label = "ACTIVE_SEVVAI_DOSHAM"

    what_ta, what_en, why_ta, why_en, how_ta, how_en = _build_dosham_explanations(
        "SEVVAI_DOSHAM",
        label,
        conditions_met=conditions_met,
        cancellation_factors=cancellation_factors,
        missing_data=[],
    )
    return DoshamResult(
        name="SEVVAI_DOSHAM",
        is_present=is_present,
        is_cancelled=is_cancelled,
        strength=strength,
        label=label,
        category="MARRIAGE" if lagna_house not in {1, 8} else "MARRIAGE_PERSONAL",
        conditions_met=conditions_met,
        cancellation_factors=cancellation_factors,
        missing_data=[],
        dasha_activated=_is_active(active, "MARS"),
        description_ta="செவ்வாய் தோஷம் ஒரு வழிகாட்டல் குறிப்பான் மட்டுமே; நிவர்த்தி காரணங்கள் தீவிரத்தை குறைக்கலாம்.",
        description_en="Sevvai dosham is treated as a traditional tendency indicator; cancellation factors can soften intensity.",
        explanation_what_ta=what_ta,
        explanation_what_en=what_en,
        explanation_why_ta=why_ta,
        explanation_why_en=why_en,
        explanation_how_ta=how_ta,
        explanation_how_en=how_en,
    )


def detect_rahu_ketu_dosham(
    planets: Mapping[str, PlanetInput],
    lagna_rasi: int,
    *,
    gender: str | None = None,
    active_lords: Iterable[str] | None = None,
    combust_planets: frozenset[str] = frozenset(),
    d9_rasi_map: Mapping[str, int] | None = None,
    d9_lagna_rasi: int | None = None,
) -> DoshamResult:
    active = set(active_lords or ())
    missing_data = [planet for planet in ("RAHU", "KETU", "VENUS", "JUPITER") if planet not in planets]
    if missing_data:
        what_ta, what_en, why_ta, why_en, how_ta, how_en = _build_dosham_explanations(
            "RAHU_KETU_DOSHAM",
            "INCOMPLETE_DATA",
            conditions_met=[],
            cancellation_factors=[],
            missing_data=missing_data,
        )
        return DoshamResult(
            name="RAHU_KETU_DOSHAM",
            is_present=False,
            is_cancelled=False,
            strength="WEAK",
            label="INCOMPLETE_DATA",
            category="NODES",
            conditions_met=[],
            cancellation_factors=[],
            missing_data=missing_data,
            dasha_activated=False,
            description_ta="ராகு/கேது தோஷம் பகுப்பாய்விற்கு ராகு, கேது, சுக்கிரன், குரு நிலைகள் தேவை.",
            description_en="Rahu/Ketu dosham analysis needs Rahu, Ketu, Venus, and Jupiter placements.",
            explanation_what_ta=what_ta,
            explanation_what_en=what_en,
            explanation_why_ta=why_ta,
            explanation_why_en=why_en,
            explanation_how_ta=how_ta,
            explanation_how_en=how_en,
        )

    rahu_rasi = _planet_rasi(planets, "RAHU")
    ketu_rasi = _planet_rasi(planets, "KETU")
    jupiter_rasi = _planet_rasi(planets, "JUPITER")
    venus_rasi = _planet_rasi(planets, "VENUS")
    rahu_house = house_from_reference(lagna_rasi, rahu_rasi)
    ketu_house = house_from_reference(lagna_rasi, ketu_rasi)

    conditions_met: list[str] = []
    marriage_candidates: list[int] = []
    sarpa_candidates: list[int] = []

    # Spec §11.1 — marriage-sensitive houses from Lagna
    if rahu_house in RAHU_KETU_MARRIAGE_HOUSES:
        conditions_met.append("rahu_in_marriage_house")
        marriage_candidates.append(rahu_house)
    if ketu_house in RAHU_KETU_MARRIAGE_HOUSES:
        conditions_met.append("ketu_in_marriage_house")
        marriage_candidates.append(ketu_house)

    # Spec §15 — Sarpa/Naga: 5th/9th axis
    if rahu_house in RAHU_KETU_SARPA_HOUSES:
        conditions_met.append("rahu_in_sarpa_house")
        sarpa_candidates.append(rahu_house)
    if ketu_house in RAHU_KETU_SARPA_HOUSES:
        conditions_met.append("ketu_in_sarpa_house")
        sarpa_candidates.append(ketu_house)

    # Spec §11.2 — node conjunct 7th lord or Venus (confirmed afflictions)
    seventh_lord = _house_lord(lagna_rasi, 7)
    if seventh_lord in planets:
        seventh_lord_rasi = _planet_rasi(planets, seventh_lord)
        if seventh_lord_rasi in {rahu_rasi, ketu_rasi}:
            conditions_met.append("node_with_seventh_lord")
    if venus_rasi in {rahu_rasi, ketu_rasi}:
        conditions_met.append("node_with_venus")

    # Spec §11.2 — node conjunct Moon (emotional stability)
    if "MOON" in planets:
        moon_rasi = _planet_rasi(planets, "MOON")
        if moon_rasi in {rahu_rasi, ketu_rasi}:
            conditions_met.append("node_afflicts_moon")

    # Spec §13.4 — upachaya houses (3,6,10,11) — more workable, note it
    if rahu_house in RAHU_KETU_UPACHAYA_HOUSES and rahu_house not in RAHU_KETU_MARRIAGE_HOUSES:
        conditions_met.append("rahu_ketu_upachaya")
    if ketu_house in RAHU_KETU_UPACHAYA_HOUSES and ketu_house not in RAHU_KETU_MARRIAGE_HOUSES:
        if "rahu_ketu_upachaya" not in conditions_met:
            conditions_met.append("rahu_ketu_upachaya")

    cancellation_factors: list[str] = []

    # Spec §13.1 — Guru aspects nodes, 7th lord, Venus, Moon
    jupiter_house_from_lagna = house_from_reference(lagna_rasi, jupiter_rasi)
    if jupiter_house_from_lagna in KENDRA_HOUSES | TRIKONA_HOUSES:
        cancellation_factors.append("jupiter_kendra_trikona_support")
    # Also check if Jupiter directly aspects Rahu/Ketu or 7th house
    jupiter_to_rahu = house_from_reference(jupiter_rasi, rahu_rasi)
    if jupiter_to_rahu in {5, 7, 9}:
        if "jupiter_kendra_trikona_support" not in cancellation_factors:
            cancellation_factors.append("jupiter_kendra_trikona_support")

    # Spec §13.2 — strong 7th lord (extended: D9, combust, malefic conjunct, Jupiter aspect)
    if seventh_lord in planets:
        seventh_lord_rasi_rk = _planet_rasi(planets, seventh_lord)
        base_strong = _planet_is_strong(planets, seventh_lord, lagna_rasi)
        rk_malefics = {"MARS", "SATURN", "RAHU", "KETU"}
        conjunct_mal_rk = any(
            p in planets and _planet_rasi(planets, p) == seventh_lord_rasi_rk
            for p in rk_malefics if p != seventh_lord
        )
        seventh_combust_rk = seventh_lord in combust_planets
        d9_strong_rk = False
        if d9_rasi_map and d9_lagna_rasi and seventh_lord in d9_rasi_map:
            d9_house_rk = house_from_reference(d9_lagna_rasi, d9_rasi_map[seventh_lord])
            d9_strong_rk = d9_house_rk in (KENDRA_HOUSES | TRIKONA_HOUSES)
        jup_aspect_7l_rk = False
        if "JUPITER" in planets:
            jup_rasi_rk = _planet_rasi(planets, "JUPITER")
            jup_aspect_7l_rk = house_from_reference(jup_rasi_rk, seventh_lord_rasi_rk) in {5, 7, 9}
        if base_strong and not conjunct_mal_rk and not seventh_combust_rk:
            cancellation_factors.append("strong_seventh_lord")
        if d9_strong_rk:
            cancellation_factors.append("seventh_lord_strong_d9")
        if jup_aspect_7l_rk:
            cancellation_factors.append("jupiter_aspects_seventh_lord")
    # Additional D9 cancellation: D9 7th lord strong from D9 lagna.
    if d9_rasi_map and d9_lagna_rasi:
        d9_7th_lord = SIGN_LORD[((d9_lagna_rasi + 5) % 12) + 1]
        if d9_7th_lord in d9_rasi_map:
            d9_7th_lord_house = house_from_reference(d9_lagna_rasi, d9_rasi_map[d9_7th_lord])
            if d9_7th_lord_house in KENDRA_HOUSES | TRIKONA_HOUSES:
                conditions_met.append("d9_seventh_lord_strong")

    # Spec §13.3 — strong Venus not conjunct node
    if _planet_is_strong(planets, "VENUS", lagna_rasi) and venus_rasi not in {rahu_rasi, ketu_rasi}:
        cancellation_factors.append("strong_venus")

    # Gender-specific severity weighting (spec §14)
    gender_norm = (gender or "").lower()
    if gender_norm == "female":
        # Extra attention on 8th house for female charts
        if any(h == 8 for h in marriage_candidates):
            if "female_high_attention_house" not in conditions_met:
                conditions_met.append("female_high_attention_house")
    elif gender_norm == "male":
        # Extra attention on 7th house and Venus for male charts
        if any(h == 7 for h in marriage_candidates) or "node_with_venus" in conditions_met:
            if "male_high_attention_house" not in conditions_met:
                conditions_met.append("male_high_attention_house")

    has_marriage_candidate = len(marriage_candidates) > 0
    has_sarpa_candidate = len(sarpa_candidates) > 0
    strong_marriage_affliction = bool(
        set(marriage_candidates) & {7, 8}
        or "node_with_seventh_lord" in conditions_met
        or "node_with_venus" in conditions_met
        or "node_afflicts_moon" in conditions_met
    )
    is_present = has_marriage_candidate or has_sarpa_candidate
    is_cancelled = has_marriage_candidate and len(cancellation_factors) >= 2 and not strong_marriage_affliction

    if not is_present:
        strength = "WEAK"
    elif strong_marriage_affliction:
        strength = "STRONG"
    else:
        strength = "PARTIAL"

    if has_marriage_candidate:
        if is_cancelled:
            label = "RAHU_KETU_DOSHAM_WITH_NIVARTHI"
        elif strong_marriage_affliction:
            label = "STRONG_ACTIVE_RAHU_KETU_DOSHAM"
        elif len(marriage_candidates) == 1:
            label = "RAHU_KETU_DOSHAM_CANDIDATE"
        else:
            label = "ACTIVE_RAHU_KETU_DOSHAM"
        category = "MARRIAGE"
    elif has_sarpa_candidate:
        label = "SARPA_NAGA_DOSHAM_CANDIDATE"
        category = "SARPA_NAGA"
    else:
        label = "NO_RAHU_KETU_DOSHAM"
        category = "NODES"

    what_ta, what_en, why_ta, why_en, how_ta, how_en = _build_dosham_explanations(
        "RAHU_KETU_DOSHAM",
        label,
        conditions_met=conditions_met,
        cancellation_factors=cancellation_factors,
        missing_data=[],
    )
    return DoshamResult(
        name="RAHU_KETU_DOSHAM",
        is_present=is_present,
        is_cancelled=is_cancelled,
        strength=strength if not is_cancelled else "WEAK",
        label=label,
        category=category,
        conditions_met=conditions_met,
        cancellation_factors=cancellation_factors,
        missing_data=[],
        dasha_activated=_is_active(active, "RAHU", "KETU"),
        description_ta="ராகு/கேது நிலைகள் பாரம்பரிய குறிப்பான்களாக பார்க்கப்படும்; சூழல் மற்றும் பாதுகாப்பு காரணங்கள் முக்கியம்.",
        description_en="Rahu/Ketu placements are treated as traditional tendency indicators; context and protective factors matter.",
        explanation_what_ta=what_ta,
        explanation_what_en=what_en,
        explanation_why_ta=why_ta,
        explanation_why_en=why_en,
        explanation_how_ta=how_ta,
        explanation_how_en=how_en,
    )


def detect_pitru_dosham(
    planets: Mapping[str, PlanetInput],
    lagna_rasi: int,
    *,
    active_lords: Iterable[str] | None = None,
) -> DoshamResult:
    active = set(active_lords or ())
    missing_data = [planet for planet in ("SUN", "SATURN", "RAHU", "KETU", "JUPITER") if planet not in planets]
    if missing_data:
        what_ta, what_en, why_ta, why_en, how_ta, how_en = _build_dosham_explanations(
            "PITRU_DOSHAM",
            "INCOMPLETE_DATA",
            conditions_met=[],
            cancellation_factors=[],
            missing_data=missing_data,
        )
        return DoshamResult(
            name="PITRU_DOSHAM",
            is_present=False,
            is_cancelled=False,
            strength="WEAK",
            label="INCOMPLETE_DATA",
            category="PITRU",
            conditions_met=[],
            cancellation_factors=[],
            missing_data=missing_data,
            dasha_activated=False,
            description_ta="பித்ரு தோஷம் பகுப்பாய்விற்கு சூரியன், சனி, ராகு, கேது, குரு நிலைகள் தேவை.",
            description_en="Pitru dosham analysis needs Sun, Saturn, Rahu, Ketu, and Jupiter placements.",
            explanation_what_ta=what_ta,
            explanation_what_en=what_en,
            explanation_why_ta=why_ta,
            explanation_why_en=why_en,
            explanation_how_ta=how_ta,
            explanation_how_en=how_en,
        )

    sun_rasi = _planet_rasi(planets, "SUN")
    saturn_rasi = _planet_rasi(planets, "SATURN")
    rahu_rasi = _planet_rasi(planets, "RAHU")
    ketu_rasi = _planet_rasi(planets, "KETU")
    jupiter_rasi = _planet_rasi(planets, "JUPITER")
    ninth_lord = _house_lord(lagna_rasi, 9)
    ninth_lord_rasi = _planet_rasi(planets, ninth_lord)

    ninth_house_rasi = ((lagna_rasi + 9 - 2) % 12) + 1
    ninth_lord_house = house_from_reference(lagna_rasi, ninth_lord_rasi)
    saturn_house = house_from_reference(lagna_rasi, saturn_rasi)

    conditions_met: list[str] = []
    major_condition = False
    if sun_rasi in {rahu_rasi, ketu_rasi}:
        conditions_met.append("sun_with_node")
        major_condition = True
    if rahu_rasi == ninth_house_rasi or ketu_rasi == ninth_house_rasi:
        conditions_met.append("node_in_ninth")
        major_condition = True
    if saturn_house == 9:
        conditions_met.append("saturn_in_ninth")
    if ninth_lord_house in {6, 8, 12}:
        conditions_met.append("ninth_lord_dusthana")

    minor_count = sum(1 for key in conditions_met if key in {"saturn_in_ninth", "ninth_lord_dusthana"})
    is_present = major_condition or minor_count >= 2

    cancellation_factors: list[str] = []
    if house_from_reference(lagna_rasi, jupiter_rasi) in KENDRA_HOUSES | TRIKONA_HOUSES:
        cancellation_factors.append("jupiter_kendra_trikona_support")
    if sun_rasi in OWN_SIGN_RASI["SUN"] or sun_rasi == EXALTATION_RASI["SUN"]:
        cancellation_factors.append("sun_strong")

    is_cancelled = is_present and len(cancellation_factors) >= 2
    if not is_present:
        strength = "WEAK"
    elif major_condition and minor_count >= 1:
        strength = "STRONG"
    else:
        strength = "PARTIAL"

    if not is_present:
        label = "NO_DOSHAM"
    elif is_cancelled:
        label = "DOSHAM_WITH_NIVARTHI"
    elif strength == "STRONG":
        label = "STRONG_ACTIVE_DOSHAM"
    else:
        label = "ACTIVE_DOSHAM"

    what_ta, what_en, why_ta, why_en, how_ta, how_en = _build_dosham_explanations(
        "PITRU_DOSHAM",
        label,
        conditions_met=conditions_met,
        cancellation_factors=cancellation_factors,
        missing_data=[],
    )
    return DoshamResult(
        name="PITRU_DOSHAM",
        is_present=is_present,
        is_cancelled=is_cancelled,
        strength=strength if not is_cancelled else "WEAK",
        label=label,
        category="PITRU",
        conditions_met=conditions_met,
        cancellation_factors=cancellation_factors,
        missing_data=[],
        dasha_activated=_is_active(active, "SUN", "RAHU", "KETU", ninth_lord),
        description_ta="பித்ரு தோஷம் பாரம்பரிய முன்னோர் கர்ம உணர்திறன் குறிப்பான்; ஆதரவு காரணங்கள் விளைவை மென்மையாக்கலாம்.",
        description_en="Pitru dosham is treated as a traditional lineage-karma sensitivity indicator; supportive factors can soften effects.",
        explanation_what_ta=what_ta,
        explanation_what_en=what_en,
        explanation_why_ta=why_ta,
        explanation_why_en=why_en,
        explanation_how_ta=how_ta,
        explanation_how_en=how_en,
    )


def detect_gaja_kesari(
    planets: Mapping[str, PlanetInput],
    moon_rasi: int,
    *,
    active_lords: Iterable[str] | None = None,
) -> YogaResult:
    active = set(active_lords or ())
    jupiter_rasi = _planet_rasi(planets, "JUPITER")
    house = house_from_reference(moon_rasi, jupiter_rasi)
    present = house in KENDRA_HOUSES
    return YogaResult(
        name="GAJA_KESARI_YOGA",
        is_present=present,
        strength="STRONG" if present else "WEAK",
        conditions_met=["jupiter_in_kendra_from_moon"] if present else [],
        cancellation_factors=[],
        dasha_activated=_is_active(active, "JUPITER", "MOON"),
        description_ta="சந்திரத்திலிருந்து குரு கேந்திரத்தில் இருந்தால் கஜகேசரி யோகம்.",
        description_en="Gaja Kesari is present when Jupiter is in a Kendra from Moon.",
    )


def detect_raja_yoga(
    planets: Mapping[str, PlanetInput],
    lagna_rasi: int,
    *,
    active_lords: Iterable[str] | None = None,
) -> list[YogaResult]:
    active = set(active_lords or ())
    kendra_lords = {_house_lord(lagna_rasi, house) for house in (1, 4, 7, 10)}
    trikona_lords = {_house_lord(lagna_rasi, house) for house in (1, 5, 9)}

    results: list[YogaResult] = []
    for trikona_lord in sorted(trikona_lords):
        for kendra_lord in sorted(kendra_lords):
            if trikona_lord == kendra_lord:
                continue
            trikona_rasi = _planet_rasi(planets, trikona_lord)
            kendra_rasi = _planet_rasi(planets, kendra_lord)
            if trikona_rasi == kendra_rasi or _is_seventh_aspect(trikona_rasi, kendra_rasi):
                results.append(
                    YogaResult(
                        name="RAJA_YOGA",
                        is_present=True,
                        strength="STRONG",
                        conditions_met=[f"{trikona_lord}_{kendra_lord}_link"],
                        cancellation_factors=[],
                        dasha_activated=_is_active(active, trikona_lord, kendra_lord),
                        description_ta="திரிகோண மற்றும் கேந்திர அதிபதிகள் இணைப்பு ராஜயோகமாக கருதப்படுகிறது.",
                        description_en="A Trikona and Kendra lord linkage is traditionally treated as Raja Yoga.",
                    )
                )
    return results


def detect_dhana_yoga(
    planets: Mapping[str, PlanetInput],
    lagna_rasi: int,
    *,
    active_lords: Iterable[str] | None = None,
) -> YogaResult:
    active = set(active_lords or ())
    second_lord = _house_lord(lagna_rasi, 2)
    eleventh_lord = _house_lord(lagna_rasi, 11)
    second_rasi = _planet_rasi(planets, second_lord)
    eleventh_rasi = _planet_rasi(planets, eleventh_lord)
    conditions: list[str] = []

    if second_rasi == eleventh_rasi:
        conditions.append("second_eleventh_conjunction")

    second_rasi_owned_by_eleventh = SIGN_LORD[second_rasi] == eleventh_lord
    eleventh_rasi_owned_by_second = SIGN_LORD[eleventh_rasi] == second_lord
    if second_rasi_owned_by_eleventh and eleventh_rasi_owned_by_second:
        conditions.append("second_eleventh_exchange")

    second_house = house_from_reference(lagna_rasi, second_rasi)
    eleventh_house = house_from_reference(lagna_rasi, eleventh_rasi)
    if second_house in KENDRA_HOUSES | TRIKONA_HOUSES and eleventh_house in KENDRA_HOUSES | TRIKONA_HOUSES:
        conditions.append("both_lords_in_strong_houses")

    present = len(conditions) > 0
    return YogaResult(
        name="DHANA_YOGA",
        is_present=present,
        strength="STRONG" if "second_eleventh_conjunction" in conditions or "second_eleventh_exchange" in conditions else ("PARTIAL" if present else "WEAK"),
        conditions_met=conditions,
        cancellation_factors=[],
        dasha_activated=_is_active(active, second_lord, eleventh_lord),
        description_ta="2ம் மற்றும் 11ம் அதிபதிகளின் உறவு தனயோக சுட்டியாக பார்க்கப்படுகிறது.",
        description_en="A link between 2nd and 11th lords is treated as a Dhana Yoga indicator.",
    )


def detect_neecha_bhanga(
    planets: Mapping[str, PlanetInput],
    lagna_rasi: int,
    *,
    active_lords: Iterable[str] | None = None,
    retrograde_planets: frozenset[str] = frozenset(),
    d9_rasi_map: Mapping[str, int] | None = None,
    d9_lagna_rasi: int | None = None,
) -> list[YogaResult]:
    active = set(active_lords or ())
    moon_rasi = _planet_rasi(planets, "MOON")
    exaltation_owner_by_planet = {planet: SIGN_LORD[rasi] for planet, rasi in EXALTATION_RASI.items()}
    exalter_of_sign = {rasi: planet for planet, rasi in EXALTATION_RASI.items()}
    results: list[YogaResult] = []

    for planet, debilitation_rasi in DEBILITATION_RASI.items():
        planet_rasi = _planet_rasi(planets, planet)
        if planet_rasi != debilitation_rasi:
            continue

        conditions: list[str] = ["planet_debilitated"]

        # Rule 1 ✓ — lord of debilitation sign in kendra from Lagna or Moon
        debilitation_sign_lord = SIGN_LORD[debilitation_rasi]
        deb_lord_rasi = _planet_rasi(planets, debilitation_sign_lord)
        if _is_kendra_from(lagna_rasi, deb_lord_rasi) or _is_kendra_from(moon_rasi, deb_lord_rasi):
            conditions.append("debilitation_sign_lord_in_kendra")

        # Rule 2 ✓ — planet exalted in that sign is in kendra
        exalter_planet = exalter_of_sign.get(debilitation_rasi)
        if exalter_planet is not None:
            exalter_rasi = _planet_rasi(planets, exalter_planet)
            if _is_kendra_from(lagna_rasi, exalter_rasi) or _is_kendra_from(moon_rasi, exalter_rasi):
                conditions.append("exalter_of_debilitation_sign_in_kendra")

        # Rule 3 (was already: exaltation sign lord aspects) — keep it
        exaltation_sign_lord = exaltation_owner_by_planet.get(planet)
        if exaltation_sign_lord is not None:
            exaltation_sign_lord_rasi = _planet_rasi(planets, exaltation_sign_lord)
            if _is_seventh_aspect(exaltation_sign_lord_rasi, planet_rasi):
                conditions.append("exaltation_sign_lord_aspects_debilitated")

        # Rule 4 — debilitated planet strong in Navamsa D9
        if d9_rasi_map and d9_lagna_rasi and planet in d9_rasi_map:
            d9_house = house_from_reference(d9_lagna_rasi, d9_rasi_map[planet])
            if d9_house in (KENDRA_HOUSES | TRIKONA_HOUSES):
                conditions.append("debilitated_planet_strong_d9")

        # Rule 5 — debilitated planet is retrograde (tradition-dependent note)
        if planet in retrograde_planets:
            conditions.append("debilitated_planet_retrograde_note")

        present = len(conditions) > 1
        results.append(
            YogaResult(
                name="NEECHA_BHANGA_RAJA_YOGA",
                is_present=present,
                strength="PARTIAL" if present else "WEAK",
                conditions_met=conditions,
                cancellation_factors=[],
                dasha_activated=_is_active(active, planet),
                description_ta="நீச கிரகத்திற்கு நிவர்த்தி நிபந்தனைகள் சேர்ந்தால் நீசபங்க ராஜயோகம்.",
                description_en="Neecha Bhanga Raja Yoga is considered when a debilitated planet has cancellation conditions.",
            )
        )

    return results


def detect_kalasarpa(planets: Mapping[str, PlanetInput]) -> KalasarpaResult:
    rahu_rasi = _planet_rasi(planets, "RAHU")
    ketu_rasi = _planet_rasi(planets, "KETU")
    planet_rasis = [_planet_rasi(planets, planet) for planet in SEVEN_PLANETS]

    def _distance(start: int, end: int) -> int:
        return (end - start) % 12

    in_rahu_arc = all(_distance(rahu_rasi, rasi) <= 6 for rasi in planet_rasis)
    in_ketu_arc = all(_distance(ketu_rasi, rasi) <= 6 for rasi in planet_rasis)

    if in_rahu_arc:
        return KalasarpaResult(
            is_present=True,
            pattern="ANULOMA",
            conditions_met=["all_planets_between_rahu_and_ketu"],
            description_ta="அனைத்து 7 கிரகங்களும் ராகு-கேது இடைவட்டத்தில் உள்ளதால் காலசர்ப்ப அமைப்பு.",
            description_en="All seven planets are contained within one Rahu-Ketu arc, indicating Kalasarpa formation.",
        )
    if in_ketu_arc:
        return KalasarpaResult(
            is_present=True,
            pattern="VILOMA",
            conditions_met=["all_planets_between_ketu_and_rahu"],
            description_ta="அனைத்து 7 கிரகங்களும் கேது-ராகு இடைவட்டத்தில் உள்ளதால் காலசர்ப்ப அமைப்பு.",
            description_en="All seven planets are contained within one Ketu-Rahu arc, indicating Kalasarpa formation.",
        )
    return KalasarpaResult(
        is_present=False,
        pattern="NONE",
        conditions_met=[],
        description_ta="காலசர்ப்ப அமைப்பு இல்லை.",
        description_en="Kalasarpa formation is not present.",
    )


# ── Pancha Mahapurusha (Spec §15.3) ─────────────────────────────────────────

_PANCHA_MAHAPURUSHA: dict[str, tuple[str, str]] = {
    "MARS":    ("RUCHAKA_YOGA",  "ருசக யோகம்"),
    "MERCURY": ("BHADRA_YOGA",   "பத்ர யோகம்"),
    "JUPITER": ("HAMSA_YOGA",    "ஹம்ச யோகம்"),
    "VENUS":   ("MALAVYA_YOGA",  "மாளவ்ய யோகம்"),
    "SATURN":  ("SASA_YOGA",     "சஸ யோகம்"),
}

_PANCHA_MAHAPURUSHA_EN: dict[str, str] = {
    "RUCHAKA_YOGA": "Ruchaka Yoga — Mars in own/exalted/Moolatrikona and in a Kendra from Lagna.",
    "BHADRA_YOGA":  "Bhadra Yoga — Mercury in own/exalted/Moolatrikona and in a Kendra from Lagna.",
    "HAMSA_YOGA":   "Hamsa Yoga — Jupiter in own/exalted/Moolatrikona and in a Kendra from Lagna.",
    "MALAVYA_YOGA": "Malavya Yoga — Venus in own/exalted/Moolatrikona and in a Kendra from Lagna.",
    "SASA_YOGA":    "Sasa Yoga — Saturn in own/exalted/Moolatrikona and in a Kendra from Lagna.",
}


def detect_pancha_mahapurusha(
    planets: Mapping[str, PlanetInput],
    lagna_rasi: int,
    *,
    active_lords: Iterable[str] | None = None,
) -> list[YogaResult]:
    active = set(active_lords or ())
    results: list[YogaResult] = []
    for planet, (yoga_name, ta) in _PANCHA_MAHAPURUSHA.items():
        if planet not in planets:
            continue
        p_rasi = _planet_rasi(planets, planet)
        in_own = p_rasi in OWN_SIGN_RASI.get(planet, set())
        in_exalt = p_rasi == EXALTATION_RASI.get(planet)
        mt = MOOLATRIKONA_ZONE.get(planet)
        in_mool = mt is not None and p_rasi == mt[0]
        in_kendra = house_from_reference(lagna_rasi, p_rasi) in KENDRA_HOUSES
        present = (in_own or in_exalt or in_mool) and in_kendra
        conditions: list[str] = []
        if present:
            if in_own:
                conditions.append(f"{planet.lower()}_own_sign")
            if in_exalt:
                conditions.append(f"{planet.lower()}_exaltation")
            if in_mool:
                conditions.append(f"{planet.lower()}_moolatrikona")
            conditions.append(f"{planet.lower()}_in_kendra")
        results.append(YogaResult(
            name=yoga_name,
            is_present=present,
            strength="STRONG" if present else "WEAK",
            conditions_met=conditions,
            cancellation_factors=[],
            dasha_activated=_is_active(active, planet),
            description_ta=ta,
            description_en=_PANCHA_MAHAPURUSHA_EN[yoga_name],
        ))
    return results


# ── Budha Aditya Yoga (Spec §15.5) ──────────────────────────────────────────

def detect_budha_aditya(
    planets: Mapping[str, PlanetInput],
    *,
    combust_planets: frozenset[str] = frozenset(),
    active_lords: Iterable[str] | None = None,
) -> YogaResult:
    active = set(active_lords or ())
    mercury_rasi = _planet_rasi(planets, "MERCURY")
    sun_rasi = _planet_rasi(planets, "SUN")
    mercury_combust = "MERCURY" in combust_planets
    same_rasi = mercury_rasi == sun_rasi
    present = same_rasi and not mercury_combust
    partial = same_rasi and mercury_combust
    conditions: list[str] = []
    if same_rasi:
        conditions.append("mercury_sun_same_rasi")
    if mercury_combust:
        conditions.append("mercury_combust_partial")
    return YogaResult(
        name="BUDHA_ADITYA_YOGA",
        is_present=present or partial,
        strength="STRONG" if present else ("PARTIAL" if partial else "WEAK"),
        conditions_met=conditions,
        cancellation_factors=[],
        dasha_activated=_is_active(active, "MERCURY", "SUN"),
        description_ta="புத ஆதித்ய யோகம்" + (" (புதன் அஸ்தமனம் — உள்ளுணர்வு புத்தி)" if partial else ""),
        description_en=(
            "Budha Aditya Yoga — Sun and Mercury in same rasi, Mercury not combust."
            if present
            else "Partial Budha Aditya (Mercury combust — internalized intellect)."
            if partial
            else "Budha Aditya Yoga not present."
        ),
    )


# ── Vipareetha Raja Yoga (Spec §15.6) ───────────────────────────────────────

def detect_vipareetha_raja(
    planets: Mapping[str, PlanetInput],
    lagna_rasi: int,
    *,
    active_lords: Iterable[str] | None = None,
) -> YogaResult:
    active = set(active_lords or ())
    dusthana = {6, 8, 12}
    conditions: list[str] = []
    for house_num in dusthana:
        lord = _house_lord(lagna_rasi, house_num)
        if lord not in planets:
            continue
        lord_rasi = _planet_rasi(planets, lord)
        lord_house = house_from_reference(lagna_rasi, lord_rasi)
        if lord_house in dusthana and lord_house != house_num:
            conditions.append(f"{lord.lower()}_lord_of_{house_num}_in_{lord_house}")
    present = len(conditions) > 0
    return YogaResult(
        name="VIPAREETHA_RAJA_YOGA",
        is_present=present,
        strength="STRONG" if present else "WEAK",
        conditions_met=conditions,
        cancellation_factors=[],
        dasha_activated=_is_active(active, *[_house_lord(lagna_rasi, h) for h in dusthana]),
        description_ta="விபரீத ராஜ யோகம் — 6, 8, 12 அதிபதி வேறொரு துஷ்டான வீட்டில் இருந்தால் இந்த யோகம் உருவாகும்.",
        description_en="Vipareetha Raja Yoga — lord of a dusthana (6/8/12) placed in another dusthana.",
    )


# ── Parivartana Yoga (Spec §15 / PARTIAL-01 dependency) ─────────────────────

@dataclass(frozen=True, slots=True)
class ParivartanaResult:
    planet_a: str
    planet_b: str
    sub_type: str   # "MAHA" | "DAINYA" | "KAHALA"
    conditions_met: list[str]


def detect_parivartana(
    planets: Mapping[str, PlanetInput],
    lagna_rasi: int,
) -> list[ParivartanaResult]:
    kendra_trikona = {1, 4, 5, 7, 9, 10}
    dusthana = {6, 8, 12}
    results: list[ParivartanaResult] = []
    planet_list = [p for p in ("SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN") if p in planets]
    for p1, p2 in combinations(planet_list, 2):
        p1_rasi = _planet_rasi(planets, p1)
        p2_rasi = _planet_rasi(planets, p2)
        # Parivartana: p1 is in a sign owned by p2, and p2 is in a sign owned by p1
        if SIGN_LORD.get(p1_rasi) == p2 and SIGN_LORD.get(p2_rasi) == p1:
            p1_house = house_from_reference(lagna_rasi, p1_rasi)
            p2_house = house_from_reference(lagna_rasi, p2_rasi)
            both_kt = p1_house in kendra_trikona and p2_house in kendra_trikona
            either_dusthana = p1_house in dusthana or p2_house in dusthana
            if both_kt:
                sub_type = "MAHA"
            elif either_dusthana:
                sub_type = "DAINYA"
            else:
                sub_type = "KAHALA"
            results.append(ParivartanaResult(
                planet_a=p1,
                planet_b=p2,
                sub_type=sub_type,
                conditions_met=[f"{p1.lower()}_{p2.lower()}_exchange", f"sub_type_{sub_type.lower()}"],
            ))
    return results


def _parivartana_as_yogas(
    parivartana: list[ParivartanaResult],
    active_lords: set[str],
) -> list[YogaResult]:
    results: list[YogaResult] = []
    for pv in parivartana:
        present = pv.sub_type in ("MAHA", "DAINYA", "KAHALA")
        results.append(YogaResult(
            name="PARIVARTANA_YOGA",
            is_present=present,
            strength="STRONG" if pv.sub_type == "MAHA" else ("PARTIAL" if pv.sub_type == "DAINYA" else "WEAK"),
            conditions_met=pv.conditions_met,
            cancellation_factors=[],
            dasha_activated=_is_active(active_lords, pv.planet_a, pv.planet_b),
            description_ta=f"பரிவர்தன யோகம் ({pv.sub_type}) — {pv.planet_a} மற்றும் {pv.planet_b} கிரகங்கள் ராசி மாற்றம் செய்கின்றன.",
            description_en=f"Parivartana Yoga ({pv.sub_type}) — {pv.planet_a} and {pv.planet_b} exchange signs.",
        ))
    return results


# ── Chandra Mangala Yoga (Spec §15) ─────────────────────────────────────────

def detect_chandra_mangala(
    planets: Mapping[str, PlanetInput],
    *,
    active_lords: Iterable[str] | None = None,
) -> YogaResult:
    active = set(active_lords or ())
    moon_rasi = _planet_rasi(planets, "MOON")
    mars_rasi = _planet_rasi(planets, "MARS")
    conjunct = moon_rasi == mars_rasi
    mutual_seventh = house_from_reference(moon_rasi, mars_rasi) == 7
    present = conjunct or mutual_seventh
    conditions: list[str] = []
    if conjunct:
        conditions.append("moon_mars_same_rasi")
    elif mutual_seventh:
        conditions.append("moon_mars_mutual_seventh")
    return YogaResult(
        name="CHANDRA_MANGALA_YOGA",
        is_present=present,
        strength="STRONG" if conjunct else ("PARTIAL" if mutual_seventh else "WEAK"),
        conditions_met=conditions,
        cancellation_factors=[],
        dasha_activated=_is_active(active, "MOON", "MARS"),
        description_ta="சந்திர மங்கள யோகம் — சந்திரனும் செவ்வாயும் ஒரே ராசியில் அல்லது ஏழாம் பார்வையில் இருந்தால் இந்த யோகம் ஏற்படும்.",
        description_en="Chandra Mangala Yoga — Moon and Mars in same rasi or mutual 7th aspect.",
    )


# ── Nakshatra Dosham Cautions (Spec §15) ─────────────────────────────────────

_NAKSHATRA_CAUTION_MAP: dict[int, tuple[str, str, str]] = {
    9:  ("AYILYAM_CAUTION",  "ஆயில்ய தோஷம்", "Ashlesha (Ayilyam) nakshatra — traditional caution, especially regarding the in-law relationship."),
    18: ("KETTAI_CAUTION",   "கேட்டை தோஷம்", "Jyeshtha (Kettai) nakshatra — traditional caution; remedies and family awareness recommended."),
    19: ("MOOLAM_CAUTION",   "மூல தோஷம்",    "Moola nakshatra — traditional caution, especially for first child; remedies widely practiced."),
}


@dataclass(frozen=True, slots=True)
class NakshatraCautionResult:
    name: str
    nakshatra_number: int
    description_ta: str
    description_en: str


def detect_nakshatra_cautions(janma_nakshatra: int) -> list[NakshatraCautionResult]:
    entry = _NAKSHATRA_CAUTION_MAP.get(janma_nakshatra)
    if entry is None:
        return []
    name, ta, en = entry
    return [NakshatraCautionResult(name=name, nakshatra_number=janma_nakshatra, description_ta=ta, description_en=en)]


def _merge_yoga_list(results: list[YogaResult], merged_name: str) -> YogaResult:
    """Merge multiple YogaResult entries with the same name into one.

    Combines all conditions_met and cancellation_factors so the frontend
    receives exactly one entry per yoga type (no duplicate React keys).
    """
    present = [r for r in results if r.is_present]
    if not results:
        raise ValueError("Cannot merge empty yoga list")
    base = results[0]
    all_conditions: list[str] = []
    all_cancellations: list[str] = []
    dasha_activated = False
    for r in results:
        all_conditions.extend(r.conditions_met)
        all_cancellations.extend(r.cancellation_factors)
        if r.dasha_activated:
            dasha_activated = True
    strengths = [r.strength for r in present]
    strength = "STRONG" if "STRONG" in strengths else ("PARTIAL" if "PARTIAL" in strengths else "WEAK")
    return YogaResult(
        name=merged_name,
        is_present=bool(present),
        strength=strength,
        conditions_met=list(dict.fromkeys(all_conditions)),
        cancellation_factors=list(dict.fromkeys(all_cancellations)),
        dasha_activated=dasha_activated,
        description_ta=base.description_ta,
        description_en=base.description_en,
    )


def detect_sakata_yoga(moon_rasi: int, jupiter_rasi: int, lagna_rasi: int) -> YogaResult:
    moon_from_jupiter = house_from_reference(jupiter_rasi, moon_rasi)
    present = moon_from_jupiter in {6, 8, 12}
    cancelled = house_from_reference(lagna_rasi, moon_rasi) in KENDRA_HOUSES
    conditions = [f"moon_from_jupiter_{moon_from_jupiter}"] if present else []
    cancellations = ["moon_kendra_from_lagna"] if present and cancelled else []
    return YogaResult(
        name="SAKATA_YOGA",
        is_present=present,
        strength="PARTIAL" if present and cancelled else ("STRONG" if present else "WEAK"),
        conditions_met=conditions,
        cancellation_factors=cancellations,
        dasha_activated=False,
        description_ta="சகட யோகம் — சந்திரன் குருவுக்கு 6/8/12இல் இருந்தால் பலன் ஏற்ற இறக்கம்.",
        description_en="Sakata Yoga — Moon in 6/8/12 from Jupiter gives fluctuating fortune.",
    )


def detect_kemadruma_yoga(planets: dict[str, int], moon_rasi: int, lagna_rasi: int) -> YogaResult:
    second = ((moon_rasi - 1 + 1) % 12) + 1
    twelfth = ((moon_rasi - 1 - 1) % 12) + 1
    surrounding = [
        p for p, rasi in planets.items()
        if p not in {"SUN", "RAHU", "KETU", "MOON"} and rasi in {second, twelfth}
    ]
    conjunction = any(p != "MOON" and rasi == moon_rasi for p, rasi in planets.items())
    moon_kendra_lagna = house_from_reference(lagna_rasi, moon_rasi) in KENDRA_HOUSES
    present = len(surrounding) == 0
    cancelled = moon_kendra_lagna or conjunction
    return YogaResult(
        name="KEMADRUMA_YOGA",
        is_present=present,
        strength="PARTIAL" if present and cancelled else ("STRONG" if present else "WEAK"),
        conditions_met=["no_planets_2nd_12th_from_moon"] if present else [],
        cancellation_factors=[c for c, ok in [("moon_kendra_from_lagna", moon_kendra_lagna), ("moon_conjunction", conjunction)] if present and ok],
        dasha_activated=False,
        description_ta="கேமத்ரும யோகம் — சந்திரனைச் சுற்றி 2/12இல் கிரக ஆதரவு இல்லாமை.",
        description_en="Kemadruma Yoga — absence of planets in 2nd/12th from Moon.",
    )


def detect_chandala_yoga(jupiter_rasi: int, rahu_rasi: int) -> YogaResult:
    present = jupiter_rasi == rahu_rasi
    return YogaResult(
        name="CHANDALA_YOGA",
        is_present=present,
        strength="STRONG" if present else "WEAK",
        conditions_met=["jupiter_rahu_conjunction"] if present else [],
        cancellation_factors=[],
        dasha_activated=False,
        description_ta="சண்டாள யோகம் — குரு ராகு சேர்க்கை.",
        description_en="Chandala Yoga — Jupiter conjunct Rahu.",
    )


def detect_amala_yoga(planets: dict[str, int], lagna_rasi: int, moon_rasi: int, lagna_nature_map: dict[str, str]) -> YogaResult:
    tenth_lagna = ((lagna_rasi - 1 + 9) % 12) + 1
    tenth_moon = ((moon_rasi - 1 + 9) % 12) + 1
    found = []
    for planet in NATURAL_BENEFICS:
        rasi = planets.get(planet)
        if rasi in {tenth_lagna, tenth_moon}:
            found.append(planet)
    present = len(found) > 0
    return YogaResult(
        name="AMALA_YOGA",
        is_present=present,
        strength="STRONG" if len(found) >= 2 else ("PARTIAL" if present else "WEAK"),
        conditions_met=[f"{planet}_in_10th" for planet in found],
        cancellation_factors=[],
        dasha_activated=any(lagna_nature_map.get(planet, "") in {"YOGAKARAKA", "TRIKONA"} for planet in found),
        description_ta="அமல யோகம் — லக்னம்/சந்திரத்திலிருந்து 10ஆம் இடத்தில் சுபகிரகங்கள்.",
        description_en="Amala Yoga — benefics in the 10th from Lagna or Moon.",
    )


def detect_adhi_yoga(planets: dict[str, int], moon_rasi: int, lagna_nature_map: dict[str, str]) -> YogaResult:
    target_houses = {6, 7, 8}
    coverage = set()
    for planet in {"JUPITER", "VENUS", "MERCURY"}:
        rasi = planets.get(planet)
        if rasi is None:
            continue
        h = house_from_reference(moon_rasi, rasi)
        if h in target_houses:
            coverage.add(h)
    count = len(coverage)
    return YogaResult(
        name="ADHI_YOGA",
        is_present=count > 0,
        strength="STRONG" if count == 3 else ("PARTIAL" if count == 2 else ("WEAK" if count == 1 else "WEAK")),
        conditions_met=[f"benefic_in_house_{h}_from_moon" for h in sorted(coverage)],
        cancellation_factors=[],
        dasha_activated=any(lagna_nature_map.get(p, "") in {"YOGAKARAKA", "TRIKONA"} for p in {"JUPITER", "VENUS", "MERCURY"}),
        description_ta="அதி யோகம் — சந்திரனிலிருந்து 6/7/8இல் சுபகிரக ஆதரவு.",
        description_en="Adhi Yoga — benefics in 6th/7th/8th from Moon.",
    )


def detect_daridra_yoga(planets: dict[str, int], lagna_rasi: int, planet_scores: dict[str, int]) -> YogaResult:
    eleventh_lord = _house_lord(lagna_rasi, 11)
    eleventh_rasi = planets.get(eleventh_lord, lagna_rasi)
    eleventh_house = house_from_reference(lagna_rasi, eleventh_rasi)
    weak = planet_scores.get(eleventh_lord, 50) < 40
    malefic_conj = any(
        planets.get(m) == eleventh_rasi for m in NATURAL_MALEFICS if m != eleventh_lord
    )
    present = eleventh_house in {6, 8, 12} or (weak and malefic_conj)
    return YogaResult(
        name="DARIDRA_YOGA",
        is_present=present,
        strength="STRONG" if present and eleventh_house in {6, 8, 12} else ("PARTIAL" if present else "WEAK"),
        conditions_met=[f"eleventh_lord_in_{eleventh_house}", "eleventh_lord_weak_malefic_conj"] if present else [],
        cancellation_factors=[],
        dasha_activated=False,
        description_ta="தரித்ர யோகம் — 11ஆம் அதிபதி துஷ்டானத்தில்/பலஹீனம்.",
        description_en="Daridra Yoga — 11th lord in dusthana or weak with malefics.",
    )


def detect_lakshmi_yoga(planets: dict[str, int], lagna_rasi: int, planet_scores: dict[str, int]) -> YogaResult:
    ninth_lord = _house_lord(lagna_rasi, 9)
    lagna_lord = _house_lord(lagna_rasi, 1)
    ninth_house = house_from_reference(lagna_rasi, planets.get(ninth_lord, lagna_rasi))
    ninth_strong = planet_scores.get(ninth_lord, 50) >= 60 and ninth_house in KENDRA_HOUSES | TRIKONA_HOUSES
    lagna_strong = planet_scores.get(lagna_lord, 50) >= 60
    present = ninth_strong and lagna_strong
    return YogaResult(
        name="LAKSHMI_YOGA",
        is_present=present,
        strength="STRONG" if present else "WEAK",
        conditions_met=[f"ninth_lord_{ninth_lord}_strong", f"lagna_lord_{lagna_lord}_strong"] if present else [],
        cancellation_factors=[],
        dasha_activated=False,
        description_ta="லக்ஷ்மி யோகம் — 9ஆம் அதிபதி வலிமை + லக்ன அதிபதி வலிமை.",
        description_en="Lakshmi Yoga — strong 9th lord and strong Lagna lord.",
    )


def detect_sunapha_anapha_durudhura(planets: dict[str, int], moon_rasi: int) -> list[YogaResult]:
    second = ((moon_rasi - 1 + 1) % 12) + 1
    twelfth = ((moon_rasi - 1 - 1) % 12) + 1
    has_second = any(p != "SUN" and r == second for p, r in planets.items())
    has_twelfth = any(p != "SUN" and r == twelfth for p, r in planets.items())
    out: list[YogaResult] = []
    if has_second:
        out.append(YogaResult("SUNAPHA_YOGA", True, "PARTIAL", ["planets_in_2nd_from_moon"], [], False, "சுனபா யோகம்.", "Sunapha Yoga."))
    if has_twelfth:
        out.append(YogaResult("ANAPHA_YOGA", True, "PARTIAL", ["planets_in_12th_from_moon"], [], False, "அநபா யோகம்.", "Anapha Yoga."))
    if has_second and has_twelfth:
        out.append(YogaResult("DURUDHURA_YOGA", True, "STRONG", ["planets_in_2nd_and_12th_from_moon"], [], False, "துருதுரா யோகம்.", "Durudhura Yoga."))
    return out


def detect_vasumati_yoga(planets: dict[str, int], moon_rasi: int) -> YogaResult:
    upachaya = {3, 6, 10, 11}
    benefic_hits = []
    for planet in {"JUPITER", "VENUS", "MERCURY", "MOON"}:
        rasi = planets.get(planet)
        if rasi is None:
            continue
        if house_from_reference(moon_rasi, rasi) in upachaya:
            benefic_hits.append(planet)
    present = len(benefic_hits) >= 2
    return YogaResult(
        name="VASUMATI_YOGA",
        is_present=present,
        strength="STRONG" if len(benefic_hits) >= 3 else ("PARTIAL" if present else "WEAK"),
        conditions_met=[f"{p}_upachaya_from_moon" for p in benefic_hits],
        cancellation_factors=[],
        dasha_activated=False,
        description_ta="வசுமதி யோகம் — சுபகிரகங்கள் உபசய ஸ்தானங்களில்.",
        description_en="Vasumati Yoga — benefics in upachaya houses from Moon.",
    )


_MOVABLE_LAGNAS = {1, 4, 7, 10}
_FIXED_LAGNAS = {2, 5, 8, 11}
_DUAL_LAGNAS = {3, 6, 9, 12}


def get_badhaka_lord(lagna_rasi: int, planets_rasi_to_lord: dict[int, str]) -> str:
    if lagna_rasi in _MOVABLE_LAGNAS:
        badhaka_house = 11
    elif lagna_rasi in _FIXED_LAGNAS:
        badhaka_house = 9
    else:
        badhaka_house = 7
    badhaka_rasi = ((lagna_rasi + badhaka_house - 2) % 12) + 1
    return planets_rasi_to_lord[badhaka_rasi]


def detect_kalathra_dosham(
    planets: Mapping[str, PlanetInput],
    lagna_rasi: int,
    moon_rasi: int | None = None,
    is_male: bool = True,
    planet_scores: dict[str, int] | None = None,
    *,
    active_lords: Iterable[str] | None = None,
    d9_rasi_map: Mapping[str, int] | None = None,
) -> DoshamResult:
    """
    Kalathra Dosham: 7th lord placed in 6th, 8th, or 12th house from Lagna.

    Older optional parameters are accepted for backward-compatible callers, but
    the rule is based on the classical 7th-lord dusthana placement.
    """
    _ = moon_rasi
    active = set(active_lords or ())
    seventh_lord = _house_lord(lagna_rasi, 7)

    if seventh_lord not in planets:
        return DoshamResult(
            name="KALATHRA_DOSHAM",
            is_present=False,
            is_cancelled=False,
            strength="WEAK",
            label="INCOMPLETE_DATA",
            category="MARRIAGE",
            conditions_met=[],
            cancellation_factors=[],
            missing_data=[seventh_lord],
            dasha_activated=False,
            description_ta="களத்திர தோஷம் கணிக்க 7ம் அதிபதி நிலை தேவை.",
            description_en="Kalathra dosham analysis requires the 7th lord placement.",
            explanation_what_ta="களத்திர தோஷம் என்பது 7ம் அதிபதி துஷ்டான வீட்டில் இருக்கும் போது திருமண விஷயங்களில் கவனம் தேவை என்பதைச் சொல்வது.",
            explanation_what_en="Kalathra dosham is a marriage sensitivity indicator that arises when the 7th lord is placed in a dusthana house.",
            explanation_why_ta="தேவையான ஜாதக தரவு கிடைக்கவில்லை.",
            explanation_why_en="Required chart data is unavailable.",
            explanation_how_ta="முழு ஜாதக தரவுடன் மீண்டும் பரிசீலிக்கவும்.",
            explanation_how_en="Review again with complete chart data.",
        )

    seventh_lord_rasi = _planet_rasi(planets, seventh_lord)
    seventh_lord_house = house_from_reference(lagna_rasi, seventh_lord_rasi)
    is_in_dusthana = seventh_lord_house in {6, 8, 12}
    legacy_affliction = False
    if planet_scores is not None:
        venus_or_jupiter = "VENUS" if is_male else "JUPITER"
        legacy_affliction = any(
            planet in planets and _planet_rasi(planets, planet) == seventh_lord_rasi
            for planet in {"SATURN", "RAHU", "KETU", "MARS"}
        ) or (
            venus_or_jupiter in planets
            and any(
                planet in planets and _planet_rasi(planets, planet) == _planet_rasi(planets, venus_or_jupiter)
                for planet in {"SATURN", "RAHU", "KETU", "MARS"}
            )
        )
    is_present = is_in_dusthana or legacy_affliction
    conditions_met = []
    if is_in_dusthana:
        conditions_met.append(f"seventh_lord_in_house_{seventh_lord_house}")
    if legacy_affliction:
        conditions_met.append("seventh_afflicted")
    cancellation_factors: list[str] = []

    if seventh_lord_rasi in OWN_SIGN_RASI.get(seventh_lord, set()):
        cancellation_factors.append("seventh_lord_own_sign")
    if seventh_lord_rasi == EXALTATION_RASI.get(seventh_lord):
        cancellation_factors.append("seventh_lord_exalted")
    if "JUPITER" in planets:
        jupiter_rasi = _planet_rasi(planets, "JUPITER")
        if house_from_reference(jupiter_rasi, seventh_lord_rasi) in {5, 7, 9}:
            cancellation_factors.append("jupiter_aspects_seventh_lord")
    if d9_rasi_map and seventh_lord in d9_rasi_map:
        d9_rasi = d9_rasi_map[seventh_lord]
        if d9_rasi in OWN_SIGN_RASI.get(seventh_lord, set()) or d9_rasi == EXALTATION_RASI.get(seventh_lord):
            cancellation_factors.append("seventh_lord_strong_d9")

    is_cancelled = len(cancellation_factors) >= 2 or (
        len(cancellation_factors) == 1
        and cancellation_factors[0] in {"seventh_lord_exalted", "jupiter_aspects_seventh_lord"}
    )
    if not is_present:
        label = "NO_KALATHRA_DOSHAM"
        strength = "WEAK"
    elif is_cancelled:
        label = "KALATHRA_DOSHAM_CANCELLED"
        strength = "WEAK"
    elif seventh_lord_house == 8:
        label = "STRONG_KALATHRA_DOSHAM"
        strength = "STRONG"
    elif legacy_affliction and planet_scores and planet_scores.get(seventh_lord, 50) < 40:
        label = "STRONG_KALATHRA_DOSHAM"
        strength = "STRONG"
    else:
        label = "KALATHRA_DOSHAM"
        strength = "MODERATE"

    house_name_ta = {
        6: "6ம் வீட்டில் (ரிபு ஸ்தானம்)",
        8: "8ம் வீட்டில் (ஆயுள் ஸ்தானம்)",
        12: "12ம் வீட்டில் (விரய ஸ்தானம்)",
    }.get(seventh_lord_house, f"{seventh_lord_house}ம் வீட்டில்")
    house_name_en = {
        6: "house 6 (Ripu sthana)",
        8: "house 8 (Ayush sthana)",
        12: "house 12 (Viraya sthana)",
    }.get(seventh_lord_house, f"house {seventh_lord_house}")
    what_ta, what_en, why_ta, why_en, how_ta, how_en = _build_dosham_explanations(
        "KALATHRA_DOSHAM",
        label,
        conditions_met=conditions_met,
        cancellation_factors=cancellation_factors,
        missing_data=[],
    )

    return DoshamResult(
        name="KALATHRA_DOSHAM",
        is_present=is_present,
        is_cancelled=is_cancelled,
        strength=strength,
        label=label,
        category="MARRIAGE",
        conditions_met=conditions_met,
        cancellation_factors=cancellation_factors,
        missing_data=[],
        dasha_activated=_is_active(active, seventh_lord, "VENUS"),
        description_ta=(
            f"களத்திர தோஷம்: 7ம் அதிபதி ({seventh_lord}) {house_name_ta} உள்ளது; திருமண விஷயங்களில் கவனம் தேவை."
            if is_present
            else f"7ம் அதிபதி ({seventh_lord}) {house_name_ta} உள்ளது; களத்திர தோஷம் இல்லை."
        ),
        description_en=(
            f"Kalathra dosham: 7th lord ({seventh_lord}) is in {house_name_en}; marriage matters need attention."
            if is_present
            else f"7th lord ({seventh_lord}) is in {house_name_en}; no Kalathra dosham."
        ),
        explanation_what_ta=what_ta,
        explanation_what_en=what_en,
        explanation_why_ta=why_ta,
        explanation_why_en=why_en,
        explanation_how_ta=how_ta,
        explanation_how_en=how_en,
    )


def detect_putra_sarpa_dosham(planets: dict[str, int], lagna_rasi: int, planet_scores: dict[str, int]) -> DoshamResult:
    fifth_lord = _house_lord(lagna_rasi, 5)
    fifth_rasi = planets.get(fifth_lord, lagna_rasi)
    afflicted = any(planets.get(p) == fifth_rasi for p in {"RAHU", "KETU", "SATURN"})
    guru_afflicted = any(planets.get(p) == planets.get("JUPITER") for p in {"RAHU", "KETU"})
    present = afflicted or guru_afflicted
    cancellation = []
    if planet_scores.get(fifth_lord, 50) >= 65:
        cancellation.append("strong_fifth_lord")
    if house_from_reference(lagna_rasi, planets.get("JUPITER", lagna_rasi)) in KENDRA_HOUSES:
        cancellation.append("jupiter_kendra")
    label = "NO_DOSHAM"
    if present and cancellation:
        label = "DOSHAM_WITH_NIVARTHI"
    elif present and planet_scores.get(fifth_lord, 50) < 40:
        label = "STRONG_ACTIVE_DOSHAM"
    elif present:
        label = "ACTIVE_DOSHAM"
    what_ta, what_en, why_ta, why_en, how_ta, how_en = _build_dosham_explanations(
        "PUTRA_SARPA_DOSHAM",
        label,
        conditions_met=["fifth_afflicted"] if present else [],
        cancellation_factors=cancellation,
        missing_data=[],
    )
    return DoshamResult(
        name="PUTRA_SARPA_DOSHAM",
        is_present=present,
        is_cancelled=bool(cancellation),
        strength="STRONG" if label == "STRONG_ACTIVE_DOSHAM" else ("PARTIAL" if present else "WEAK"),
        label=label,
        category="CHILDREN",
        conditions_met=["fifth_afflicted"] if present else [],
        cancellation_factors=cancellation,
        missing_data=[],
        dasha_activated=False,
        description_ta="புத்ர/சர்ப்ப தோஷம் — 5ஆம் பாவம் அல்லது குரு பாதிப்பு.",
        description_en="Putra/Sarpa dosham — affliction to 5th house or Jupiter.",
        explanation_what_ta=what_ta,
        explanation_what_en=what_en,
        explanation_why_ta=why_ta,
        explanation_why_en=why_en,
        explanation_how_ta=how_ta,
        explanation_how_en=how_en,
    )


def detect_badhaka_dosham(
    planets: dict[str, int],
    lagna_rasi: int,
    planet_scores: dict[str, int],
    current_maha_lord: str,
) -> DoshamResult:
    badhaka_lord = get_badhaka_lord(lagna_rasi, SIGN_LORD)
    badhaka_rasi = planets.get(badhaka_lord, lagna_rasi)
    lagna_lord = _house_lord(lagna_rasi, 1)
    active = (
        house_from_reference(lagna_rasi, badhaka_rasi) == 1
        or planets.get("MOON") == badhaka_rasi
        or planets.get(lagna_lord) == badhaka_rasi
        or current_maha_lord == badhaka_lord
    )
    cancellation = []
    if planet_scores.get(badhaka_lord, 50) >= 65:
        cancellation.append("badhaka_lord_strong")
    label = "NO_DOSHAM"
    if active and cancellation:
        label = "DOSHAM_WITH_NIVARTHI"
    elif active and current_maha_lord == badhaka_lord:
        label = "STRONG_ACTIVE_DOSHAM"
    elif active:
        label = "ACTIVE_DOSHAM"
    what_ta, what_en, why_ta, why_en, how_ta, how_en = _build_dosham_explanations(
        "BADHAKA_DOSHAM",
        label,
        conditions_met=["badhaka_active"] if active else [],
        cancellation_factors=cancellation,
        missing_data=[],
    )
    return DoshamResult(
        name="BADHAKA_DOSHAM",
        is_present=active,
        is_cancelled=bool(cancellation),
        strength="STRONG" if label == "STRONG_ACTIVE_DOSHAM" else ("PARTIAL" if active else "WEAK"),
        label=label,
        category="OBSTACLES",
        conditions_met=["badhaka_active"] if active else [],
        cancellation_factors=cancellation,
        missing_data=[],
        dasha_activated=current_maha_lord == badhaka_lord,
        description_ta="பாதக தோஷம் — லக்னத்தின்படி பாதக அதிபதி செயல்படும் காலம்.",
        description_en="Badhaka dosham — obstruction pattern from badhaka lord.",
        explanation_what_ta=what_ta,
        explanation_what_en=what_en,
        explanation_why_ta=why_ta,
        explanation_why_en=why_en,
        explanation_how_ta=how_ta,
        explanation_how_en=how_en,
    )


def detect_yogas_and_doshams(
    planets: Mapping[str, PlanetInput],
    lagna_rasi: int,
    moon_rasi: int,
    *,
    active_lords: Iterable[str] | None = None,
    current_maha_lord: str | None = None,
    sevvai_mode: str = "tamil_standard",
    gender: str | None = None,
    partner_has_sevvai_dosham: bool = False,
    combust_planets: frozenset[str] = frozenset(),
    retrograde_planets: frozenset[str] = frozenset(),
    janma_nakshatra: int | None = None,
    d9_rasi_map: Mapping[str, int] | None = None,
    d9_lagna_rasi: int | None = None,
    bhava_chalit_map: Mapping[str, int] | None = None,
) -> tuple[list[YogaResult], list[DoshamResult], list[NakshatraCautionResult]]:
    # Reserved input for Bhava Chalit-aware house judgements.
    # Current implementation remains rasi-first for backward compatibility.
    _ = bhava_chalit_map
    planets_rasi = _planets_as_rasi_map(planets)
    lagna_nature_map = {
        planet: get_functional_nature(lagna_rasi, planet).value
        for planet in planets_rasi
    }
    planet_scores = {
        planet: int(value.get("strength_score", 50))
        if isinstance(value, Mapping)
        else 50
        for planet, value in planets.items()
    }
    yogas: list[YogaResult] = []
    yogas.append(detect_gaja_kesari(planets, moon_rasi, active_lords=active_lords))
    raja_list = detect_raja_yoga(planets, lagna_rasi, active_lords=active_lords)

    # Parivartana — needed for raja_yoga connection type check
    parivartana = detect_parivartana(planets, lagna_rasi)
    active_set = set(active_lords or ())
    resolved_maha_lord = current_maha_lord or (sorted(active_set)[0] if active_set else "")
    # Add Parivartana as Raja Yoga connection when both lords are kendra/trikona
    for pv in parivartana:
        if pv.sub_type == "MAHA":
            p1_house = house_from_reference(lagna_rasi, _planet_rasi(planets, pv.planet_a))
            p2_house = house_from_reference(lagna_rasi, _planet_rasi(planets, pv.planet_b))
            kendra_trikona = KENDRA_HOUSES | TRIKONA_HOUSES
            kendra_lords = {_house_lord(lagna_rasi, h) for h in (1, 4, 7, 10)}
            trikona_lords = {_house_lord(lagna_rasi, h) for h in (1, 5, 9)}
            if pv.planet_a in kendra_lords and pv.planet_b in trikona_lords or \
               pv.planet_b in kendra_lords and pv.planet_a in trikona_lords:
                raja_list.append(YogaResult(
                    name="RAJA_YOGA",
                    is_present=True,
                    strength="STRONG",
                    conditions_met=[f"{pv.planet_a.lower()}_{pv.planet_b.lower()}_parivartana_link"],
                    cancellation_factors=[],
                    dasha_activated=_is_active(active_set, pv.planet_a, pv.planet_b),
                    description_ta="திரிகோண-கேந்திர அதிபதிகளின் பரிவர்தனம் ராஜயோகமாக கருதப்படுகிறது.",
                    description_en="Parivartana between Trikona and Kendra lords is treated as Raja Yoga.",
                ))

    yogas.append(
        _merge_yoga_list(raja_list, "RAJA_YOGA")
        if raja_list
        else YogaResult(
            name="RAJA_YOGA",
            is_present=False,
            strength="WEAK",
            conditions_met=[],
            cancellation_factors=[],
            dasha_activated=False,
            description_ta="திரிகோண-கேந்திர அதிபதி இணைப்பு இல்லை.",
            description_en="No Trikona-Kendra lord linkage found.",
        )
    )
    yogas.append(detect_dhana_yoga(planets, lagna_rasi, active_lords=active_lords))
    neecha_list = detect_neecha_bhanga(
        planets, lagna_rasi,
        active_lords=active_lords,
        retrograde_planets=retrograde_planets,
        d9_rasi_map=d9_rasi_map,
        d9_lagna_rasi=d9_lagna_rasi,
    )
    yogas.append(
        _merge_yoga_list(neecha_list, "NEECHA_BHANGA_RAJA_YOGA")
        if neecha_list
        else YogaResult(
            name="NEECHA_BHANGA_RAJA_YOGA",
            is_present=False,
            strength="WEAK",
            conditions_met=[],
            cancellation_factors=[],
            dasha_activated=False,
            description_ta="நீச பங்க நிலை இல்லை.",
            description_en="No Neecha Bhanga condition present.",
        )
    )

    # Pancha Mahapurusha
    yogas.extend(detect_pancha_mahapurusha(planets, lagna_rasi, active_lords=active_lords))

    # Budha Aditya
    yogas.append(detect_budha_aditya(planets, combust_planets=combust_planets, active_lords=active_lords))

    # Vipareetha Raja Yoga
    yogas.append(detect_vipareetha_raja(planets, lagna_rasi, active_lords=active_lords))

    # Parivartana Yoga as YogaResult entries
    pv_yogas = _parivartana_as_yogas(parivartana, active_set)
    if pv_yogas:
        yogas.extend(pv_yogas)
    else:
        yogas.append(YogaResult(
            name="PARIVARTANA_YOGA",
            is_present=False,
            strength="WEAK",
            conditions_met=[],
            cancellation_factors=[],
            dasha_activated=False,
            description_ta="பரிவர்தன யோகம் — இரண்டு கிரகங்கள் ஒருவருக்கொருவர் ஆட்சி ராசியில் இல்லை.",
            description_en="No Parivartana Yoga present.",
        ))

    # Chandra Mangala Yoga
    yogas.append(detect_chandra_mangala(planets, active_lords=active_lords))
    # Expanded yoga library (W07)
    yogas.append(detect_sakata_yoga(moon_rasi, planets_rasi.get("JUPITER", moon_rasi), lagna_rasi))
    yogas.append(detect_kemadruma_yoga(planets_rasi, moon_rasi, lagna_rasi))
    yogas.append(detect_chandala_yoga(planets_rasi.get("JUPITER", moon_rasi), planets_rasi.get("RAHU", moon_rasi)))
    yogas.append(detect_amala_yoga(planets_rasi, lagna_rasi, moon_rasi, lagna_nature_map))
    yogas.append(detect_adhi_yoga(planets_rasi, moon_rasi, lagna_nature_map))
    yogas.append(detect_daridra_yoga(planets_rasi, lagna_rasi, planet_scores))
    yogas.append(detect_lakshmi_yoga(planets_rasi, lagna_rasi, planet_scores))
    yogas.extend(detect_sunapha_anapha_durudhura(planets_rasi, moon_rasi))
    yogas.append(detect_vasumati_yoga(planets_rasi, moon_rasi))

    kalasarpa = detect_kalasarpa(planets)
    kalasarpa_label = "KALA_SARPA_DOSHAM_CANDIDATE" if kalasarpa.is_present else "NO_DOSHAM"
    kalasarpa_explanations = _build_dosham_explanations(
        "KALASARPA",
        kalasarpa_label,
        conditions_met=kalasarpa.conditions_met,
        cancellation_factors=[],
        missing_data=[],
    )
    doshams: list[DoshamResult] = [
        detect_sevvai_dosham(
            planets,
            lagna_rasi,
            sevvai_mode=sevvai_mode,
            gender=gender,
            partner_has_sevvai_dosham=partner_has_sevvai_dosham,
            active_lords=active_lords,
            combust_planets=combust_planets,
            d9_rasi_map=d9_rasi_map,
            d9_lagna_rasi=d9_lagna_rasi,
        ),
        detect_rahu_ketu_dosham(
            planets,
            lagna_rasi,
            gender=gender,
            active_lords=active_lords,
            combust_planets=combust_planets,
            d9_rasi_map=d9_rasi_map,
            d9_lagna_rasi=d9_lagna_rasi,
        ),
        detect_pitru_dosham(
            planets,
            lagna_rasi,
            active_lords=active_lords,
        ),
        detect_kalathra_dosham(
            planets,
            lagna_rasi,
            active_lords=active_lords,
            d9_rasi_map=d9_rasi_map,
        ),
        detect_putra_sarpa_dosham(
            planets_rasi,
            lagna_rasi,
            planet_scores=planet_scores,
        ),
        detect_badhaka_dosham(
            planets_rasi,
            lagna_rasi,
            planet_scores,
            resolved_maha_lord,
        ),
        DoshamResult(
            name="KALASARPA",
            is_present=kalasarpa.is_present,
            is_cancelled=False,
            strength="PARTIAL" if kalasarpa.is_present else "WEAK",
            label=kalasarpa_label,
            category="KALA_SARPA",
            conditions_met=kalasarpa.conditions_met,
            cancellation_factors=[],
            missing_data=[],
            dasha_activated=_is_active(set(active_lords or ()), "RAHU", "KETU"),
            description_ta=kalasarpa.description_ta,
            description_en=kalasarpa.description_en,
            explanation_what_ta=kalasarpa_explanations[0],
            explanation_what_en=kalasarpa_explanations[1],
            explanation_why_ta=kalasarpa_explanations[2],
            explanation_why_en=kalasarpa_explanations[3],
            explanation_how_ta=kalasarpa_explanations[4],
            explanation_how_en=kalasarpa_explanations[5],
        ),
    ]

    nakshatra_cautions = detect_nakshatra_cautions(janma_nakshatra) if janma_nakshatra is not None else []
    return yogas, doshams, nakshatra_cautions
