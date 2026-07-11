"""Shared constants, dataclasses, and small utility functions for yoga/dosham detection."""
from __future__ import annotations

from collections.abc import Iterable, Mapping
from dataclasses import dataclass

from app.calculations.astro import house_from_reference
from app.calculations.chart_strength import (
    DEBILITATION_RASI,
    EXALTATION_RASI,
    MOOLATRIKONA_ZONE,
    OWN_SIGN_RASI,
    SIGN_LORD,
)
from app.calculations.functional_nature import FunctionalNature, get_functional_nature

PlanetInput = int | Mapping[str, int | float | str]

KENDRA_HOUSES = {1, 4, 7, 10}
TRIKONA_HOUSES = {1, 5, 9}
TAMIL_SEVVAI_HOUSES = {1, 2, 4, 7, 8, 12}
EXTENDED_SEVVAI_HOUSES = {1, 2, 4, 7, 8, 12}
RAHU_KETU_MARRIAGE_HOUSES = {1, 2, 7, 8}
RAHU_KETU_SARPA_HOUSES = {5, 9}
SEVEN_PLANETS = ("SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN")
NATURAL_BENEFICS = {"JUPITER", "VENUS", "MERCURY", "MOON"}
# Mandhi/Gulika counts as a malefic occupant/aspect for yoga detection, same
# as Rahu/Ketu — see docs/THIRUKANITHAM_DEPTH_EXPANSION_PLAN.md Phase 1.2.
NATURAL_MALEFICS = {"SATURN", "MARS", "RAHU", "KETU", "SUN", "MANDHI"}

HOUSE_SIGN_NIVARTHI: dict[int, frozenset[int]] = {
    2:  frozenset({3, 6}),
    4:  frozenset({1, 8}),
    7:  frozenset({4, 10}),
    8:  frozenset({9, 12}),
    12: frozenset({2, 7}),
}

FEMALE_HIGH_ATTENTION_SEVVAI_HOUSES = {4, 8, 12}
MALE_HIGH_ATTENTION_SEVVAI_HOUSES = {2, 7, 8}
KADAGAM_SIMMAM_LAGNA_EXCEPTION = {4, 5}
SEVVAI_BENEFIC_REDUCERS = {"JUPITER", "VENUS", "MERCURY", "MOON"}
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


# ── Degree-based strength gating for otherwise sign-only yogas (audit T6) ─────
_STRENGTH_RANK: dict[str, int] = {"WEAK": 0, "PARTIAL": 1, "STRONG": 2}
_RANK_STRENGTH: dict[int, str] = {0: "WEAK", 1: "PARTIAL", 2: "STRONG"}


def gate_yoga_strength(
    base_strength: str,
    key_planets: Iterable[str],
    planet_scores: Mapping[str, int] | None,
    combust_planets: frozenset[str] = frozenset(),
    *,
    weak_threshold: int = 45,
    floor: str = "PARTIAL",
) -> tuple[str, list[str]]:
    """Downgrade a *present* yoga's reported strength by its key planets' condition.

    Whole-sign presence is decided by the caller and is NOT touched here — a
    Gaja Kesari with a combust Jupiter is still "present", but should not read as
    a full-strength yoga. This helper only ever *lowers* strength (never raises
    it) and floors at ``floor`` so a genuinely present yoga is not hidden.

    The composite ``planet_scores`` already fold in planetary war, gandanta, and
    dignity (see chart_strength); combustion is passed separately because the
    yoga engine receives it as its own flag set. Returns the modulated strength
    plus human-readable factor notes for ``cancellation_factors``.
    """
    if base_strength == "WEAK":
        return base_strength, []
    scores = planet_scores or {}
    keys = [p for p in key_planets if p]
    if not keys:
        return base_strength, []

    notes: list[str] = []
    downgrade = 0

    weakest = min(keys, key=lambda p: scores.get(p, 50))
    weakest_score = scores.get(weakest, 50)
    if weakest_score < weak_threshold:
        downgrade += 1
        notes.append(f"weak_key_planet_{weakest.lower()}_{weakest_score}")

    combust_keys = [p for p in keys if p in combust_planets]
    if combust_keys:
        downgrade += 1
        notes.append("combust_key_planet_" + "_".join(p.lower() for p in combust_keys))

    if downgrade == 0:
        return base_strength, []

    floor_rank = _STRENGTH_RANK[floor]
    new_rank = max(floor_rank, _STRENGTH_RANK[base_strength] - downgrade)
    return _RANK_STRENGTH[new_rank], notes


def _house_lord(lagna_rasi: int, house_number: int) -> str:
    house_rasi = ((lagna_rasi + house_number - 2) % 12) + 1
    return SIGN_LORD[house_rasi]


def _is_kendra_from(reference_rasi: int, target_rasi: int) -> bool:
    return house_from_reference(reference_rasi, target_rasi) in KENDRA_HOUSES


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
        "badhaka_active": "The badhaka lord (by your lagna) is touching your Lagna, Moon, lagna-lord, or current Dasha",
        "badhaka_lord_strong": "The badhaka lord is strong, so obstacles clear faster",
        "fifth_afflicted": "The 5th house/lord (progeny, creativity) is afflicted by the nodes or malefics",
        "strong_fifth_lord": "The 5th lord is strong, reducing the impact",
        "jupiter_kendra": "Jupiter is in a kendra and protects the progeny significator",
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
        "badhaka_active": "லக்னப்படி பாதக அதிபதி உங்கள் லக்னம்/சந்திரன்/லக்னாதிபதி அல்லது தற்போதைய தசையை பாதிக்கிறது",
        "badhaka_lord_strong": "பாதக அதிபதி வலுவாக உள்ளதால் தடைகள் விரைவில் கடக்கப்படும்",
        "fifth_afflicted": "5-ம் வீடு/அதிபதி ராகு-கேது அல்லது பாதக கிரகங்களால் பாதிக்கப்பட்டுள்ளது",
        "strong_fifth_lord": "5-ம் அதிபதி வலுவாக உள்ளதால் தாக்கம் குறைகிறது",
        "jupiter_kendra": "குரு கேந்திரத்தில் இருந்து சந்தான காரகனை பாதுகாக்கிறார்",
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
        "BADHAKA_DOSHAM": "Badhaka dosham is an obstruction pattern from the badhaka lord (the lord of the 11th/9th/7th house, set by your lagna type) that can bring delays and last-minute blocks when it is active.",
        "KALATHRA_DOSHAM": "Kalathra dosham is a marriage-sensitivity indicator formed when the 7th house or its lord is afflicted.",
        "PUTRA_SARPA_DOSHAM": "Putra Sarpa dosham is an indicator formed when the 5th house (children, creativity) or its lord is afflicted by the nodes or malefics.",
        "MARANA_KARAKA_STHANA": "Marana Karaka Sthana flags a planet placed in its traditional caution house, indicating its dasha/bhukti calls for extra care rather than predicting death.",
    }
    what_ta_map = {
        "SEVVAI_DOSHAM": "செவ்வாய் தோஷம் என்பது செவ்வாயின் இடத்தை அடிப்படையாகக் கொண்ட திருமண இணக்கப் பார்வை குறிப்பான்.",
        "RAHU_KETU_DOSHAM": "ராகு-கேது தோஷம் என்பது கிரக நிலைகளை சூழ்நிலையோடு பார்க்கும் பாரம்பரிய தோஷ குறிப்பான்.",
        "PITRU_DOSHAM": "பித்ரு தோஷம் என்பது தமிழ் ஜோதிடத்தில் முன்னோர் கர்ம உணர்திறன் குறிப்பான்.",
        "KALASARPA": "காலசர்ப்ப யோகம் என்பது அனைத்து ஏழு கிரகங்களும் ராகு-கேது அச்சின் ஒரு பக்கத்தில் உள்ளதைக் குறிக்கும்.",
        "BADHAKA_DOSHAM": "பாதக தோஷம் என்பது உங்கள் லக்னப்படி அமையும் பாதக அதிபதி செயல்படும்போது தடைகளையும் கடைசி-நிமிட இடையூறுகளையும் தரக்கூடிய தடை-வடிவம்.",
        "KALATHRA_DOSHAM": "களத்திர தோஷம் என்பது 7-ம் வீடு அல்லது அதன் அதிபதி பாதிக்கப்படும்போது உருவாகும் திருமண உணர்திறன் குறிப்பான்.",
        "PUTRA_SARPA_DOSHAM": "புத்ர சர்ப்ப தோஷம் என்பது சந்தானம்/படைப்பாற்றலை குறிக்கும் 5-ம் வீடு ராகு-கேது அல்லது பாதக கிரகங்களால் பாதிக்கப்படும்போது உருவாகும் குறிப்பான்.",
        "MARANA_KARAKA_STHANA": "மரண காரக ஸ்தானம் என்பது ஒரு கிரகம் அதன் பாரம்பரிய கவன வீட்டில் இருப்பதைக் குறிக்கும்; அந்த கிரக தசை/புக்தியில் கூடுதல் கவனம் தேவை என்பதைக் காட்டுமே தவிர இறப்பு கணிப்பு அல்ல.",
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
