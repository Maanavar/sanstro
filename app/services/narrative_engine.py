"""
Rule-based narrative engine for Tamil astrology guidance.

Takes structured calculation outputs and produces human-readable Tamil + English
text. No LLM required — all text is generated from pre-written templates keyed
on calculated values (score band, active planet, dasha lord, cycle type, etc.).
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING

from app.calculations.astro import house_from_reference
from app.calculations.chart_strength import compute_natal_planet_score

if TYPE_CHECKING:
    from app.schemas.charts import PlanetPosition


# ── Bilingual string helper ────────────────────────────────────────────────────

@dataclass(frozen=True)
class BiText:
    ta: str
    en: str


def _bi(ta: str, en: str) -> BiText:
    return BiText(ta=ta, en=en)


def build_strength_narrative(planets: list["PlanetPosition"], lagna_rasi: int) -> BiText:
    if not planets:
        return _bi(
            "கிரக பல விவரம் தற்போது கிடைக்கவில்லை.",
            "Planet strength details are currently unavailable.",
        )

    sun = next((planet for planet in planets if planet.graha == "SUN"), None)
    sun_longitude = sun.absolute_longitude if sun is not None else 0.0

    scored: list[tuple[str, int, int]] = []
    for planet in planets:
        score = compute_natal_planet_score(
            planet=planet.graha,
            natal_rasi=planet.rasi,
            natal_longitude=planet.absolute_longitude,
            natal_lagna_rasi=lagna_rasi,
            sun_longitude=sun_longitude,
            is_retrograde=planet.is_retrograde,
            is_vargottama=planet.is_vargottama,
            d9_rasi=planet.d9_rasi,
        )
        house = house_from_reference(lagna_rasi, planet.rasi)
        scored.append((planet.graha, score, house))

    scored.sort(key=lambda item: item[1], reverse=True)
    strongest_planet, strongest_score, strongest_house = scored[0]
    weakest_planet, weakest_score, weakest_house = scored[-1]
    strongest_name = PLANET_NAME.get(strongest_planet, _bi(strongest_planet, strongest_planet))
    weakest_name = PLANET_NAME.get(weakest_planet, _bi(weakest_planet, weakest_planet))

    return _bi(
        f"{strongest_name.ta} {strongest_house}ஆம் இடத்தில் ({strongest_score}/100) பலமாக உள்ளது. "
        f"{weakest_name.ta} {weakest_house}ஆம் இடத்தில் ({weakest_score}/100) கவனம் தேவை.",
        f"{strongest_name.en} in house {strongest_house} is strong ({strongest_score}/100). "
        f"{weakest_name.en} in house {weakest_house} needs caution ({weakest_score}/100).",
    )


# ── Planet display names ───────────────────────────────────────────────────────

PLANET_NAME: dict[str, BiText] = {
    "SUN":     _bi("சூரியன்",   "Sun"),
    "MOON":    _bi("சந்திரன்",  "Moon"),
    "MARS":    _bi("செவ்வாய்",  "Mars"),
    "MERCURY": _bi("புதன்",      "Mercury"),
    "JUPITER": _bi("குரு",       "Jupiter (Guru)"),
    "VENUS":   _bi("சுக்கிரன்", "Venus"),
    "SATURN":  _bi("சனி",        "Saturn (Sani)"),
    "RAHU":    _bi("ராகு",       "Rahu"),
    "KETU":    _bi("கேது",       "Ketu"),
}

RASI_NAME: dict[int, BiText] = {
    1:  _bi("மேஷம்",    "Mesham (Aries)"),
    2:  _bi("ரிஷபம்",   "Rishabam (Taurus)"),
    3:  _bi("மிதுனம்",  "Mithunam (Gemini)"),
    4:  _bi("கடகம்",    "Kadagam (Cancer)"),
    5:  _bi("சிம்மம்",  "Simmam (Leo)"),
    6:  _bi("கன்னி",    "Kanni (Virgo)"),
    7:  _bi("துலாம்",   "Thulam (Libra)"),
    8:  _bi("விருச்சிகம்", "Viruchigam (Scorpio)"),
    9:  _bi("தனுசு",    "Dhanusu (Sagittarius)"),
    10: _bi("மகரம்",    "Magaram (Capricorn)"),
    11: _bi("கும்பம்",  "Kumbam (Aquarius)"),
    12: _bi("மீனம்",    "Meenam (Pisces)"),
}

NAKSHATRA_NAME: dict[int, BiText] = {
    1:  _bi("அசுவினி",       "Aswini"),
    2:  _bi("பரணி",          "Bharani"),
    3:  _bi("கார்த்திகை",    "Karthigai"),
    4:  _bi("ரோகிணி",        "Rohini"),
    5:  _bi("மிருகசீரிடம்",  "Mirugaseeridam"),
    6:  _bi("திருவாதிரை",    "Thiruvathirai"),
    7:  _bi("புனர்பூசம்",    "Punarpoosam"),
    8:  _bi("பூசம்",         "Poosam"),
    9:  _bi("ஆயில்யம்",      "Ayilyam"),
    10: _bi("மகம்",           "Magam"),
    11: _bi("பூரம்",          "Pooram"),
    12: _bi("உத்திரம்",      "Uthiram"),
    13: _bi("அஸ்தம்",        "Hastham"),
    14: _bi("சித்திரை",      "Chithirai"),
    15: _bi("சுவாதி",        "Swathi"),
    16: _bi("விசாகம்",       "Visakam"),
    17: _bi("அனுசம்",        "Anusham"),
    18: _bi("கேட்டை",        "Kettai"),
    19: _bi("மூலம்",         "Moolam"),
    20: _bi("பூராடம்",       "Pooradam"),
    21: _bi("உத்திராடம்",    "Uthiradam"),
    22: _bi("திருவோணம்",     "Thiruvonam"),
    23: _bi("அவிட்டம்",      "Avittam"),
    24: _bi("சதயம்",         "Sadayam"),
    25: _bi("பூரட்டாதி",     "Poorattathi"),
    26: _bi("உத்திரட்டாதி",  "Uthirattathi"),
    27: _bi("ரேவதி",         "Revathi"),
}


# ── Score band labels ──────────────────────────────────────────────────────────

def _rasi_name_safe(rasi_number: int) -> BiText:
    """Return a non-empty bilingual rasi label, even for out-of-range inputs."""
    return RASI_NAME.get(rasi_number, _bi(f"ராசி {rasi_number}", f"Rasi {rasi_number}"))


def _band(score: int) -> str:
    if score >= 80:
        return "STRONG_SUPPORT"
    if score >= 65:
        return "GOOD"
    if score >= 50:
        return "BALANCED"
    if score >= 35:
        return "CAUTION"
    return "RESTORATIVE"


# ── Dasha lord characterisation ───────────────────────────────────────────────

_DASHA_CHARACTER: dict[str, BiText] = {
    "SUN":     _bi("சூரியன் தசை — தன்னம்பிக்கை, அதிகாரம், நேர்மை", "Sun dasa — confidence, authority, integrity"),
    "MOON":    _bi("சந்திரன் தசை — உணர்வுகள், மனம், குடும்பம்",    "Moon dasa — emotions, mind, family"),
    "MARS":    _bi("செவ்வாய் தசை — செயல், தைரியம், போட்டி",        "Mars dasa — action, courage, competition"),
    "MERCURY": _bi("புதன் தசை — புத்திசாலித்தனம், தொழில்நுட்பம், தகவல்தொடர்பு", "Mercury dasa — intellect, skill, communication"),
    "JUPITER": _bi("குரு தசை — வளர்ச்சி, ஞானம், அதிர்ஷ்டம்",     "Jupiter dasa — growth, wisdom, fortune"),
    "VENUS":   _bi("சுக்கிரன் தசை — அன்பு, சுகம், படைப்பு",       "Venus dasa — love, comfort, creativity"),
    "SATURN":  _bi("சனி தசை — கடமை, ஒழுக்கம், நிலைத்தன்மை",      "Saturn dasa — duty, discipline, endurance"),
    "RAHU":    _bi("ராகு தசை — முறைமீறல், திடீர் மாற்றம், வெளிநாடு", "Rahu dasa — unconventional paths, sudden change, foreign"),
    "KETU":    _bi("கேது தசை — ஆன்மீகம், வைராக்கியம், உள்முக பயணம்", "Ketu dasa — spirituality, detachment, inner journey"),
}

_ANTARA_NOTE: dict[str, BiText] = {
    "SUN":     _bi("சூரியன் புக்தி — தெளிவான நேரம்",             "Sun bhukti — a period of clarity"),
    "MOON":    _bi("சந்திரன் புக்தி — உணர்வுகளை கவனிக்கவும்",    "Moon bhukti — watch your emotional responses"),
    "MARS":    _bi("செவ்வாய் புக்தி — முன்னெடுப்புகளுக்கு நல்ல நேரம்", "Mars bhukti — good for initiatives"),
    "MERCURY": _bi("புதன் புக்தி — கற்றல், பேச்சுவார்த்தை சாதகம்", "Mercury bhukti — favourable for learning, negotiation"),
    "JUPITER": _bi("குரு புக்தி — ஆசீர்வாதம் மற்றும் வாய்ப்பு",   "Jupiter bhukti — blessings and opportunity"),
    "VENUS":   _bi("சுக்கிரன் புக்தி — சுகம், உறவு சாதகம்",       "Venus bhukti — comfort and relationship support"),
    "SATURN":  _bi("சனி புக்தி — பொறுமையும் கடமையும் முக்கியம்",  "Saturn bhukti — patience and duty are key"),
    "RAHU":    _bi("ராகு புக்தி — எதிர்பாராத திருப்பங்கள் சாத்தியம்", "Rahu bhukti — unexpected turns possible"),
    "KETU":    _bi("கேது புக்தி — ஆன்மீக வழிகாட்டல் கிடைக்கும்",  "Ketu bhukti — spiritual guidance available"),
}


# ── Moon transit reasoning ─────────────────────────────────────────────────────

def moon_transit_reason(
    current_nakshatra: int,
    janma_nakshatra: int,
    chandrashtama: bool,
    current_moon_rasi: int,
    janma_rasi: int,
    moon_score: int,
) -> BiText:
    house = ((current_moon_rasi - janma_rasi) % 12) + 1
    nak_name = NAKSHATRA_NAME.get(current_nakshatra, _bi(str(current_nakshatra), str(current_nakshatra)))

    if chandrashtama:
        return _bi(
            f"சந்திரன் இன்று ஜன்ம நட்சத்திரத்திலிருந்து 8ஆம் நட்சத்திரமான {nak_name.ta}-ல் உள்ளது (சந்திராஷ்டமம்). "
            f"முக்கிய முடிவுகளை தவிர்க்கவும்.",
            f"Moon is in {nak_name.en}, the 8th nakshatra from your birth star (Chandrashtamam). "
            f"Avoid major decisions.",
        )

    # Janma Nakshatra day: Moon returns to the native's birth star.
    # Distinct from Chandrashtamam (8th Rasi from natal Moon, checked above via moon.rasi).
    if current_nakshatra == janma_nakshatra:
        return _bi(
            f"இன்று சந்திரன் ஜன்ம நட்சத்திரமான {nak_name.ta}-ல் உள்ளது. "
            f"உணர்ச்சிகரமான சூழல்களில் கவனமாக இருக்கவும்.",
            f"Moon is in your birth nakshatra {nak_name.en} today (Janma Nakshatra). "
            f"Be mindful in emotionally charged situations.",
        )

    if moon_score >= 65:
        return _bi(
            f"சந்திரன் {_rasi_name_safe(current_moon_rasi).ta}-ல் உள்ளது — "
            f"ஜன்ம ராசியிலிருந்து {house}ஆம் இடம். மன நிலை நல்லது.",
            f"Moon is in {_rasi_name_safe(current_moon_rasi).en} — "
            f"house {house} from birth sign. Mental state is supportive.",
        )

    return _bi(
        f"சந்திரன் {_rasi_name_safe(current_moon_rasi).ta}-ல் உள்ளது — "
        f"ஜன்ம ராசியிலிருந்து {house}ஆம் இடம். மிதமான மன அழுத்தம் சாத்தியம்.",
        f"Moon is in {_rasi_name_safe(current_moon_rasi).en} — "
        f"house {house} from birth sign. Mild mental pressure is possible.",
    )


# ── Dasha support reasoning ────────────────────────────────────────────────────

def dasha_support_reason(maha_lord: str, antar_lord: str, dasha_score: int) -> BiText:
    maha = _DASHA_CHARACTER.get(maha_lord, _bi(maha_lord, maha_lord))
    antar = _ANTARA_NOTE.get(antar_lord, _bi(antar_lord, antar_lord))
    strength = (
        "நல்ல ஆதரவு" if dasha_score >= 65
        else "மிதமான ஆதரவு" if dasha_score >= 50
        else "குறைந்த ஆதரவு"
    )
    strength_en = (
        "strong support" if dasha_score >= 65
        else "moderate support" if dasha_score >= 50
        else "reduced support"
    )
    return _bi(
        f"{maha.ta}. {antar.ta}. தசா {strength} ({dasha_score}/100).",
        f"{maha.en}. {antar.en}. Dasa provides {strength_en} ({dasha_score}/100).",
    )


# ── Panchangam reasoning ───────────────────────────────────────────────────────

_TITHI_CAUTION = {4, 9, 14, 19, 24, 29}
_TITHI_MILD = {8, 23, 30}
_YOGA_CAUTION = {1, 6, 9, 10, 17, 27}

# Yoga names aligned with YOGA_NAMES in panchangam.py (Tamil Thirukanitham spelling)
_YOGA_NAME: dict[int, str] = {
    1: "Vishkambha", 2: "Priti", 3: "Ayushman", 4: "Saubhagya", 5: "Shobhana",
    6: "Atiganda", 7: "Sukarma", 8: "Dhriti", 9: "Shoola", 10: "Ganda",
    11: "Vriddhi", 12: "Dhruva", 13: "Vyaghata", 14: "Harshana", 15: "Vajra",
    16: "Siddhi", 17: "Vyatipata", 18: "Variyana", 19: "Parigha", 20: "Shiva",
    21: "Siddha", 22: "Sadhya", 23: "Shubha", 24: "Shukla", 25: "Brahma",
    26: "Indra", 27: "Vaidhriti",
}


def panchangam_reason(
    tithi_number: int,
    yoga_number: int,
    karana_name: str,
    weekday_lord: str,
    panchangam_score: int,
    nakshatra_number: int,
) -> BiText:
    notes_ta: list[str] = []
    notes_en: list[str] = []

    if tithi_number in _TITHI_CAUTION:
        notes_ta.append(f"திதி {tithi_number} (ரிக்த திதி) — புதிய முயற்சிகளுக்கு சாதகமில்லை")
        notes_en.append(f"Tithi {tithi_number} (Rikta tithi) — not favourable for new starts")
    elif tithi_number in _TITHI_MILD:
        notes_ta.append(f"திதி {tithi_number} — சிறிய கவனம் தேவை")
        notes_en.append(f"Tithi {tithi_number} — mild caution advised")
    else:
        notes_ta.append(f"திதி {tithi_number} — சாதகமானது")
        notes_en.append(f"Tithi {tithi_number} — favourable")

    yoga_name = _YOGA_NAME.get(yoga_number, str(yoga_number))
    if yoga_number in _YOGA_CAUTION:
        notes_ta.append(f"யோகம்: {yoga_name} — முக்கியமான பணிகளை தவிர்க்கவும்")
        notes_en.append(f"Yoga: {yoga_name} — avoid important tasks")
    else:
        notes_ta.append(f"யோகம்: {yoga_name} — சாதாரண நாள்")
        notes_en.append(f"Yoga: {yoga_name} — ordinary day")

    if karana_name == "VISHTI":
        notes_ta.append("கரணம் விஷ்டி — தீய கரணம், புது துவக்கங்கள் தவிர்க்கவும்")
        notes_en.append("Karana Vishti — a traditionally cautious karana; prefer completing existing tasks")

    nak_name = NAKSHATRA_NAME.get(nakshatra_number, _bi(str(nakshatra_number), str(nakshatra_number)))
    notes_ta.append(f"நட்சத்திரம்: {nak_name.ta}")
    notes_en.append(f"Nakshatra: {nak_name.en}")

    return _bi(
        " · ".join(notes_ta) + f" (பஞ்சாங்க மதிப்பெண்: {panchangam_score}/100).",
        " · ".join(notes_en) + f" (Panchangam score: {panchangam_score}/100).",
    )


# ── Gochar / transit reasoning ─────────────────────────────────────────────────

_TRANSIT_QUALITY: dict[str, dict[int, BiText]] = {
    "JUPITER": {
        **{h: _bi("குரு ஆதரவு நல்லது", "Jupiter transit is supportive") for h in (2, 5, 7, 9, 11)},
        **{h: _bi("குரு கஷ்டமான இடத்தில்", "Jupiter transit is challenging") for h in (4, 8, 12)},
    },
    "SATURN": {
        **{h: _bi("சனி சாதகமான இடத்தில்", "Saturn transit is favourable") for h in (3, 6, 11)},
        **{h: _bi("சனி கஷ்டமான இடத்தில் — ஜன்ம சனி / அஷ்டம சனி கவனம்",
                  "Saturn transit is challenging — watch Janma Sani / Ashtama Sani") for h in (1, 4, 8, 12)},
    },
}

_SANI_CYCLE_WARN: dict[str, BiText] = {
    "JANMA_SANI":           _bi("ஜன்ம சனி நடப்பு — உடல் மற்றும் முயற்சிகளில் கவனம்",
                                "Janma Sani active — take care of health and efforts"),
    "ARDHASHTAMA_SANI":     _bi("அர்த்தாஷ்டம சனி — திடீர் சங்கடங்கள் சாத்தியம்",
                                "Ardhashtama Sani — sudden difficulties possible"),
    "ASHTAMA_SANI":         _bi("அஷ்டம சனி நடப்பு — முக்கிய முடிவுகளில் கவனம்",
                                "Ashtama Sani active — exercise caution in major decisions"),
    "KANTAKA_SANI":         _bi("கண்டக சனி — தொழில், உடல்நலம் கவனம்",
                                "Kantaka Sani — career and health need attention"),
    "KANDAKA_SANI":         _bi("கண்டக சனி (லக்னத்திலிருந்து) — கட்டமைப்பு மறுசீரமைப்பு காலம்",
                                "Kantaka Sani (from Lagna) — structural restructuring and responsibility cycle"),
    "EZHARAI_SANI_PHASE_1": _bi("ஏழரை சனி — முதல் கட்டம். மாற்றங்களை ஏற்க தயாராகுங்கள்.",
                                "Ezhara Sani — phase 1. Prepare to accept transitions."),
    "EZHARAI_SANI_PHASE_3": _bi("ஏழரை சனி — மூன்றாம் கட்டம். குடும்ப, பொருள் விஷயங்களில் கவனம்.",
                                "Ezhara Sani — phase 3. Attention to family and financial matters."),
}


def gochar_reason(
    jupiter_house: int,
    saturn_house: int,
    sani_cycle_type: str | None,
    sani_cycle_active: bool,
    chandrashtama: bool,
    transit_score: int,
) -> BiText:
    notes_ta: list[str] = []
    notes_en: list[str] = []

    jup = _TRANSIT_QUALITY.get("JUPITER", {}).get(jupiter_house)
    if jup:
        notes_ta.append(f"குரு {jupiter_house}ஆம் இடம்: {jup.ta}")
        notes_en.append(f"Jupiter in house {jupiter_house}: {jup.en}")
    else:
        notes_ta.append(f"குரு {jupiter_house}ஆம் இடம் (நடுநிலை)")
        notes_en.append(f"Jupiter in house {jupiter_house} (neutral)")

    sat = _TRANSIT_QUALITY.get("SATURN", {}).get(saturn_house)
    if sat:
        notes_ta.append(f"சனி {saturn_house}ஆம் இடம்: {sat.ta}")
        notes_en.append(f"Saturn in house {saturn_house}: {sat.en}")
    else:
        notes_ta.append(f"சனி {saturn_house}ஆம் இடம் (நடுநிலை)")
        notes_en.append(f"Saturn in house {saturn_house} (neutral)")

    if sani_cycle_active and sani_cycle_type:
        warn = _SANI_CYCLE_WARN.get(sani_cycle_type)
        if warn:
            notes_ta.append(warn.ta)
            notes_en.append(warn.en)

    if chandrashtama:
        notes_ta.append("சந்திராஷ்டமம் கோசார தாக்கத்தை பலவீனப்படுத்துகிறது")
        notes_en.append("Chandrashtamam weakens the overall transit support")

    return _bi(
        " · ".join(notes_ta) + f" (கோசார மதிப்பெண்: {transit_score}/100).",
        " · ".join(notes_en) + f" (Gochar score: {transit_score}/100).",
    )


# ── Personal caution reasoning ─────────────────────────────────────────────────

def personal_caution_reason(
    chandrashtama: bool,
    sani_cycle_type: str | None,
    sani_cycle_active: bool,
    mercury_combust: bool,
    abhijit_restricted: bool,
    personal_score: int,
    kantaka_sani_active: bool = False,
) -> BiText:
    if personal_score >= 55:
        return _bi(
            "தனிப்பட்ட கவலைகள் இல்லை. நேர்மறை நாள்.",
            "No personal cautions today. Positive day.",
        )

    notes_ta: list[str] = []
    notes_en: list[str] = []

    if chandrashtama:
        notes_ta.append("சந்திராஷ்டமம் — உணர்வு நெருக்கடி சாத்தியம்")
        notes_en.append("Chandrashtamam — emotional stress possible")

    if sani_cycle_active and sani_cycle_type:
        warn = _SANI_CYCLE_WARN.get(sani_cycle_type)
        if warn:
            notes_ta.append(warn.ta)
            notes_en.append(warn.en)

    if kantaka_sani_active and not sani_cycle_active:
        warn = _SANI_CYCLE_WARN.get("KANDAKA_SANI")
        if warn:
            notes_ta.append(warn.ta)
            notes_en.append(warn.en)

    if mercury_combust:
        notes_ta.append("புதன் அஸ்தமனம் — தொடர்பு, ஒப்பந்தங்களில் கவனம்")
        notes_en.append("Mercury combust — take care with communication and agreements")

    if abhijit_restricted:
        notes_ta.append("இன்று அபிஜித் முஹூர்த்தம் இல்லை")
        notes_en.append("Abhijit muhurtam is not available today")

    if not notes_ta:
        return _bi(
            f"மிதமான கவலை நிலை ({personal_score}/100). வழக்கமான நடவடிக்கைகளை தொடரலாம்.",
            f"Mild caution level ({personal_score}/100). Routine activities are fine.",
        )

    return _bi(
        " · ".join(notes_ta) + ".",
        " · ".join(notes_en) + ".",
    )


# ── Remedy suggestions ─────────────────────────────────────────────────────────

_PLANET_REMEDY: dict[str, BiText] = {
    "SUN":     _bi("ஞாயிற்றுக்கிழமை காலையில் சூரியனை வணங்குங்கள். ஆதித்ய ஹ்ருதயம் படிக்கலாம்.",
                   "Offer water to the rising Sun on Sundays. Reciting Aditya Hridayam is beneficial."),
    "MOON":    _bi("திங்கட்கிழமை சந்திர வழிபாடு செய்யுங்கள். வெள்ளை பொருட்கள் தானம் செய்யலாம்.",
                   "Worship the Moon on Mondays. Donating white items is beneficial."),
    "MARS":    _bi("செவ்வாய்க்கிழமை முருகன் வழிபாடு. செம்பு பொருட்கள் தானம் நல்லது.",
                   "Worship Murugan on Tuesdays. Donating copper items is auspicious."),
    "MERCURY": _bi("புதன்கிழமை பெருமாள் (திருமால்) வழிபாடு. பச்சை பொருட்கள் தானம்.",
                   "Worship Perumal (Thirumaal) on Wednesdays. Donating green items is helpful."),
    "JUPITER": _bi("வியாழக்கிழமை தட்சிணாமூர்த்தி தரிசனம், குரு பகவான் வழிபாடு. மஞ்சள் அல்லது மஞ்சள் பூக்கள் தானம்.",
                   "Visit Dakshinamurthy temple on Thursdays. Worship Guru Bhagavan. Donating yellow or yellow flowers is auspicious."),
    "VENUS":   _bi("வெள்ளிக்கிழமை மகாலட்சுமி வழிபாடு. வெள்ளை அல்லது வண்ணமயமான பூக்கள் சமர்ப்பிக்கலாம்.",
                   "Worship Mahalakshmi on Fridays. Offering white or colourful flowers is auspicious."),
    "SATURN":  _bi("சனிக்கிழமை சனீஸ்வரன் வழிபாடு. எள் எண்ணெய் விளக்கு ஏற்றுங்கள். கடுமையான பேச்சை தவிர்க்கவும்.",
                   "Worship Saneeswaran on Saturdays. Light a sesame oil lamp. Avoid harsh speech."),
    "RAHU":    _bi("துர்கா / காளி வழிபாடு நல்லது. ஏழை உணவு தானம் செய்யலாம். சனிக்கிழமை விரதம் உதவும்.",
                   "Worship Durga / Kali. Donating food to the needy is helpful. Saturday fasting is beneficial."),
    "KETU":    _bi("கணேஷ் வழிபாடு நல்லது. ஆன்மீக நூல்கள் படியுங்கள். தனிமையில் தியானம் செய்யுங்கள்.",
                   "Worship Ganesha. Read spiritual texts. Meditate in solitude."),
}

_CYCLE_REMEDY: dict[str, BiText] = {
    "JANMA_SANI":       _bi("சனிக்கிழமை ஹனுமான் / சனீஸ்வரன் வழிபாடு. தொடர்ச்சியான முயற்சி மிகவும் முக்கியம்.",
                            "Worship Hanuman / Saneeswaran on Saturdays. Consistent effort is essential now."),
    "ARDHASHTAMA_SANI": _bi("சனி வழிபாடும் பொறுமையும் தேவை. திடீர் முடிவுகளை தவிர்க்கவும்.",
                            "Saturn worship and patience are needed. Avoid sudden decisions."),
    "ASHTAMA_SANI":     _bi("அஷ்டம சனியில் சனி ஆலயம் செல்லுங்கள். கூடுமானவரை புதிய வாக்குறுதிகளை தவிர்க்கவும்.",
                            "Visit a Saturn temple during Ashtama Sani. Avoid major new commitments where possible."),
    "KANTAKA_SANI":     _bi("தொழில் முடிவுகளில் மட்டுப்பாடு தேவை. நட்பு மற்றும் குடும்ப ஆதரவை தேடுங்கள்.",
                            "Exercise restraint in career decisions. Seek the support of friends and family."),
}

_CHANDRASHTAMA_REMEDY = _bi(
    "சந்திராஷ்டமம் நாட்களில் பெரிய ஒப்பந்தங்கள், நிதி முடிவுகள், அறுவை சிகிச்சை தவிர்க்கவும். "
    "இன்று கோவிலுக்கு சென்று மன அமைதியை பெறுங்கள்.",
    "During Chandrashtamam, avoid major contracts, financial decisions, and surgery. "
    "Visit a temple today for mental peace.",
)


def remedy_suggestion(
    maha_lord: str,
    sani_cycle_type: str | None,
    sani_cycle_active: bool,
    chandrashtama: bool,
    score: int,
    afflicted_planets: list[str] | None = None,
) -> BiText:
    if afflicted_planets:
        primary = afflicted_planets[0]
        if primary == "SUN":
            return _bi(
                "சூரியன் பலம் குறைவதால்: காலை சூரிய உதயத்தில் கிழக்கு நோக்கி 12 சுற்று சூர்ய நமஸ்காரம் செய்யுங்கள்; "
                "ஆதித்ய ஹ்ருதயம் அல்லது காயத்ரி மந்திரம் ஜபியுங்கள்; சூரியனுக்கு அர்க்யம் அளியுங்கள்; சூரியனார் கோவில் தரிசனம் செய்யலாம்.",
                "Sun appears weak: perform 12 rounds of Surya Namaskar facing east at sunrise; "
                "recite Aditya Hridayam or Gayatri; offer Arghyam to the rising Sun; consider visiting Suryanar temple.",
            )
        primary_remedy = _PLANET_REMEDY.get(primary)
        if primary_remedy:
            return primary_remedy

    if score >= 70:
        planet_remedy = _PLANET_REMEDY.get(maha_lord)
        if planet_remedy:
            return planet_remedy
        return _bi("இன்று நல்ல நாள். வழக்கமான வழிபாட்டை தொடரவும்.",
                   "Today is a good day. Continue your regular worship practice.")

    if chandrashtama:
        return _CHANDRASHTAMA_REMEDY

    if sani_cycle_active and sani_cycle_type and sani_cycle_type in _CYCLE_REMEDY:
        return _CYCLE_REMEDY[sani_cycle_type]

    planet_remedy = _PLANET_REMEDY.get(maha_lord)
    if planet_remedy:
        return planet_remedy

    return _bi(
        "இன்று அமைதியான, திட்டமிட்ட நாளாக வைத்துக்கொள்ளுங்கள். வழக்கமான வழிபாட்டை தொடரவும்.",
        "Keep today calm and structured. Continue your regular worship practice.",
    )


# ── Main daily summary ─────────────────────────────────────────────────────────

_SUMMARY_TEMPLATES: dict[str, tuple[str, str]] = {
    "STRONG_SUPPORT": (
        "இன்று {score}/100 — மிகவும் ஆதரவான நாள். {dasha_char} நடப்பில் உள்ளது. "
        "சிறந்த நேரம் பயன்படுத்தி திட்டமிட்ட முடிவுகளை எடுங்கள்.",
        "Today {score}/100 — strongly supportive day. {dasha_char} is active. "
        "Use the best window to execute your planned decisions.",
    ),
    "GOOD": (
        "இன்று {score}/100 — நல்ல நாள். {dasha_char} நடப்பில் உள்ளது. "
        "ராகு காலம் தவிர்த்து முக்கிய பணிகளை முன்னெடுங்கள்.",
        "Today {score}/100 — a good day. {dasha_char} is active. "
        "Proceed with important tasks, avoiding Rahu Kalam.",
    ),
    "BALANCED": (
        "இன்று {score}/100 — நிலையான நாள். {dasha_char} நடப்பில் உள்ளது. "
        "படிப்படியாக செயல்பட்டு, எளிய முடிவுகளை மட்டும் எடுங்கள்.",
        "Today {score}/100 — a steady day. {dasha_char} is active. "
        "Move step by step and keep decisions simple.",
    ),
    "CAUTION": (
        "இன்று {score}/100 — கவனம் தேவைப்படும் நாள். {dasha_char} நடப்பில் உள்ளது. "
        "வழக்கமான பணிகளுக்கு முன்னுரிமை கொடுங்கள், பெரிய முடிவுகளை ஒத்தி வையுங்கள்.",
        "Today {score}/100 — a cautious day. {dasha_char} is active. "
        "Prioritise routine tasks and defer major decisions.",
    ),
    "RESTORATIVE": (
        "இன்று {score}/100 — ஓய்வும் மீளச்சேர்க்கையும் தேவைப்படும் நாள். {dasha_char} நடப்பில் உள்ளது. "
        "சிறிய பொறுப்புகளை மட்டும் ஏற்று, ஓய்வுக்கு முன்னுரிமை கொடுங்கள்.",
        "Today {score}/100 — a restorative day. {dasha_char} is active. "
        "Keep commitments small and prioritise rest.",
    ),
}


def daily_summary(
    score: int,
    maha_lord: str,
    antar_lord: str,
    chandrashtama: bool,
    sani_cycle_type: str | None,
    sani_cycle_active: bool,
    best_window_label: str | None,
) -> BiText:
    band = _band(score)
    ta_tmpl, en_tmpl = _SUMMARY_TEMPLATES[band]

    maha_char = _DASHA_CHARACTER.get(maha_lord, _bi(maha_lord, maha_lord))
    dasha_char_ta = maha_char.ta.split(" — ")[0]  # just "குரு தசை"
    dasha_char_en = maha_char.en.split(" — ")[0]  # just "Jupiter dasa"

    ta = ta_tmpl.format(score=score, dasha_char=dasha_char_ta)
    en = en_tmpl.format(score=score, dasha_char=dasha_char_en)

    # Append strongest active warning
    if chandrashtama:
        ta += " சந்திராஷ்டமம் நடப்பில் உள்ளது — முக்கிய முடிவுகளை தவிர்க்கவும்."
        en += " Chandrashtamam is active — avoid major decisions."
    elif sani_cycle_active and sani_cycle_type:
        warn = _SANI_CYCLE_WARN.get(sani_cycle_type)
        if warn:
            ta += f" {warn.ta}."
            en += f" {warn.en}."

    if best_window_label and band in ("STRONG_SUPPORT", "GOOD"):
        ta += f" சிறந்த நேரம்: {best_window_label}."
        en += f" Best window: {best_window_label}."

    return _bi(ta, en)


# ── Action / caution suggestions with actual values ───────────────────────────

def action_suggestion(
    maha_lord: str,
    best_window_start: str | None,
    best_window_end: str | None,
    score: int,
) -> BiText:
    band = _band(score)
    planet_en = PLANET_NAME.get(maha_lord, _bi(maha_lord, maha_lord)).en
    planet_ta = PLANET_NAME.get(maha_lord, _bi(maha_lord, maha_lord)).ta

    if best_window_start and band in ("STRONG_SUPPORT", "GOOD", "BALANCED"):
        return _bi(
            f"சிறந்த நேரம் {best_window_start}–{best_window_end}-ல் முக்கிய பணிகளை தொடங்குங்கள். "
            f"{planet_ta} தசையில் தொடர்ச்சியான முயற்சி நல்ல பலன் தரும்.",
            f"Begin your most important task during the best window {best_window_start}–{best_window_end}. "
            f"Consistent effort under {planet_en} dasa yields good results.",
        )

    if band in ("CAUTION", "RESTORATIVE"):
        return _bi(
            f"இன்று வழக்கமான பணிகளை மட்டும் செய்யுங்கள். "
            f"{planet_ta} தசையில் பொறுமை மிக முக்கியம்.",
            f"Stick to routine tasks today. "
            f"Patience is essential under {planet_en} dasa.",
        )

    return _bi(
        f"{planet_ta} தசையில் திட்டமிட்ட செயல்பாடுகள் நல்ல பலன் தரும்.",
        f"Planned activities yield good results under {planet_en} dasa.",
    )


def caution_suggestion(
    chandrashtama: bool,
    sani_cycle_type: str | None,
    sani_cycle_active: bool,
    rahu_kalam_start: str,
    rahu_kalam_end: str,
) -> BiText:
    if chandrashtama:
        return _bi(
            f"சந்திராஷ்டமம் நடப்பில் உள்ளது. ராகு காலம் {rahu_kalam_start}–{rahu_kalam_end} தவிர்க்கவும். "
            f"நிதி மற்றும் உடல்நலம் சார்ந்த முடிவுகளை ஒத்தி வையுங்கள்.",
            f"Chandrashtamam is active. Avoid Rahu Kalam {rahu_kalam_start}–{rahu_kalam_end}. "
            f"Defer financial and health-related decisions.",
        )

    if sani_cycle_active and sani_cycle_type:
        warn = _SANI_CYCLE_WARN.get(sani_cycle_type)
        warn_ta = warn.ta if warn else ""
        warn_en = warn.en if warn else ""
        return _bi(
            f"{warn_ta}. ராகு காலம் {rahu_kalam_start}–{rahu_kalam_end} தவிர்க்கவும்.",
            f"{warn_en}. Avoid Rahu Kalam {rahu_kalam_start}–{rahu_kalam_end}.",
        )

    return _bi(
        f"ராகு காலம் {rahu_kalam_start}–{rahu_kalam_end} புதிய முயற்சிகளுக்கு தவிர்க்கவும். "
        f"அவசர முடிவுகளை தடுக்கவும்.",
        f"Avoid Rahu Kalam {rahu_kalam_start}–{rahu_kalam_end} for new starts. "
        f"Prevent rushed decisions.",
    )


# ── Tithi content cards (FEATURE-05) ──────────────────────────────────────────

def build_amavasai_card() -> BiText:
    """Tithi 30 — Amavasai / Pitru Tarpan day. No score penalty; surface this card instead."""
    return _bi(
        "இன்று அமாவாசை — பித்ரு தர்பண நாள். "
        "முன்னோர்களை நினைத்து, குல தெய்வத்தை வணங்குவதற்கு ஏற்ற நேரம். "
        "புதிய முயற்சிகளை நாளை தொடங்குங்கள்.",
        "Today is Amavasai — the Pitru Tarpan day. "
        "A sacred day for ancestor remembrance and Kula Deivam worship. "
        "Begin new ventures tomorrow.",
    )


def build_pournami_card() -> BiText:
    """Tithi 15 — Pournami / Full Moon day."""
    return _bi(
        "இன்று பௌர்ணமி — சந்திர பகவான் நிறைவான நாள். "
        "ஆலய தரிசனம், தானம், மனச்சுத்தி செய்துகொள்வதற்கு ஏற்ற நேரம். "
        "குடும்பத்தினருடன் இனிய நேரம் கழியுங்கள்.",
        "Today is Pournami — the Full Moon day. "
        "A blessed day for temple visits, charity, and inner cleansing. "
        "Spend quality time with family.",
    )


def build_pradosham_card() -> BiText:
    """Tithi 13 or 28 — Pradosham, sacred to Shiva."""
    return _bi(
        "இன்று பிரதோஷம் — சிவ வழிபாட்டிற்கு சிறப்பான நாள். "
        "மாலை வேளையில் சிவன் கோவிலுக்கு சென்று, அர்ச்சனை செய்வது மிகவும் சிறப்பு. "
        "ஆரோக்கியம் மற்றும் குடும்ப நலனுக்காக பிரார்த்திக்கலாம்.",
        "Today is Pradosham — a sacred day for Lord Shiva. "
        "Visiting a Shiva temple and performing archana in the evening is especially auspicious. "
        "Pray for health and family well-being.",
    )


def build_ekadasi_card() -> BiText:
    """Tithi 11 or 26 — Ekadasi, sacred to Vishnu / Perumal."""
    return _bi(
        "இன்று ஏகாதசி — திருமால் வழிபாட்டிற்கு சிறப்பான நாள். "
        "விரதம் இருப்பவர்களுக்கு ஆன்மீக பலன் அதிகம். "
        "பெருமாள் கோவிலுக்கு சென்று துளசி சமர்ப்பிக்கலாம்.",
        "Today is Ekadasi — a sacred day for Thirumal (Vishnu). "
        "Fasting on this day carries spiritual merit. "
        "Visit a Perumal temple and offer Tulasi.",
    )


def tithi_content_card(tithi_number: int) -> BiText | None:
    """
    Returns a tithi content card for special tithis, or None for ordinary days.
    Tithis: 30=Amavasai, 15=Pournami, 13/28=Pradosham, 11/26=Ekadasi.
    """
    if tithi_number == 30:
        return build_amavasai_card()
    if tithi_number == 15:
        return build_pournami_card()
    if tithi_number in {13, 28}:
        return build_pradosham_card()
    if tithi_number in {11, 26}:
        return build_ekadasi_card()
    return None


# ── Score component explanation bundle ────────────────────────────────────────

@dataclass
class ScoreComponentReasons:
    moon_transit: BiText
    dasha_support: BiText
    panchangam: BiText
    gochar: BiText
    personal_caution: BiText
    summary: BiText
    action: BiText
    caution: BiText
    remedy: BiText


def build_score_reasons(
    *,
    score: int,
    # moon
    current_nakshatra: int,
    janma_nakshatra: int,
    chandrashtama: bool,
    current_moon_rasi: int,
    janma_rasi: int,
    moon_score: int,
    # dasha
    maha_lord: str,
    antar_lord: str,
    dasha_score: int,
    # panchangam
    tithi_number: int,
    yoga_number: int,
    karana_name: str,
    weekday_lord: str,
    panchangam_score: int,
    panchangam_nakshatra: int,
    # gochar
    jupiter_house_from_moon: int,
    saturn_house_from_moon: int,
    sani_cycle_type: str | None,
    sani_cycle_active: bool,
    kantaka_sani_active: bool = False,
    transit_score: int = 50,
    # personal
    mercury_combust: bool = False,
    abhijit_restricted: bool = False,
    personal_score: int = 60,
    # windows
    best_window_start: str | None = None,
    best_window_end: str | None = None,
    best_window_label: str | None = None,
    rahu_kalam_start: str = "00:00",
    rahu_kalam_end: str = "00:00",
    afflicted_planets: list[str] | None = None,
) -> ScoreComponentReasons:
    return ScoreComponentReasons(
        moon_transit=moon_transit_reason(
            current_nakshatra, janma_nakshatra, chandrashtama,
            current_moon_rasi, janma_rasi, moon_score,
        ),
        dasha_support=dasha_support_reason(maha_lord, antar_lord, dasha_score),
        panchangam=panchangam_reason(
            tithi_number, yoga_number, karana_name,
            weekday_lord, panchangam_score, panchangam_nakshatra,
        ),
        gochar=gochar_reason(
            jupiter_house_from_moon, saturn_house_from_moon,
            sani_cycle_type, sani_cycle_active, chandrashtama, transit_score,
        ),
        personal_caution=personal_caution_reason(
            chandrashtama, sani_cycle_type, sani_cycle_active,
            mercury_combust, abhijit_restricted, personal_score,
            kantaka_sani_active=kantaka_sani_active,
        ),
        summary=daily_summary(
            score, maha_lord, antar_lord, chandrashtama,
            sani_cycle_type, sani_cycle_active, best_window_label,
        ),
        action=action_suggestion(maha_lord, best_window_start, best_window_end, score),
        caution=caution_suggestion(
            chandrashtama, sani_cycle_type, sani_cycle_active,
            rahu_kalam_start, rahu_kalam_end,
        ),
        remedy=remedy_suggestion(
            maha_lord, sani_cycle_type, sani_cycle_active, chandrashtama, score, afflicted_planets=afflicted_planets,
        ),
    )


# ── Tone validator ──────────────────────────────────────────────────────────

_BANNED_PHRASES: list[str] = [
    "bad day",
    "danger",
    "will fail",
    "doomed",
    "trouble ahead",
    "crisis",
    "hardship",
    "inauspicious",
]


# ── Shadow Work Prompts — P3-A ────────────────────────────────────────────────

# Tamasic nakshatras per Thirukanitham (8th, 9th, 10th, 18th, 19th, 24th nakshatras)
_TAMASIC_NAKSHATRAS = {"BHARANI", "AYILYAM", "MAGAM", "KETTAI", "MOOLAM", "SADAYAM"}

# Prompts keyed by 8th/12th lord or moon nakshatra type
_SHADOW_PROMPTS_8TH: dict[str, tuple[tuple[str, str], ...]] = {
    "SATURN": (
        ("என்னிடம் உள்ள நீண்ட நாள் பயம் என்ன? அதை நான் எப்படி எதிர்கொள்கிறேன்?",
         "What long-held fear do I carry, and how am I facing it?"),
        ("என்னில் எந்த நம்பிக்கை என்னை பின்னோக்கி இழுக்கிறது?",
         "What belief in me is holding me back from growth?"),
    ),
    "MARS": (
        ("என் கோபம் அல்லது ஆக்ரோஷம் உண்மையில் என்ன பாதுகாக்கிறது?",
         "What is my anger or frustration really protecting?"),
        ("நான் எங்கு ஆற்றலை மிகவும் கடுமையாக உட்புகுத்துகிறேன்?",
         "Where am I pushing too hard, and what would softening feel like?"),
    ),
    "RAHU": (
        ("என்னிடம் எந்த விஷயங்கள் மீது நான் அதிக ஆர்வம் கொள்கிறேன், ஏன்?",
         "What am I obsessively drawn to, and what does that reveal about me?"),
        ("என்னில் என்ன மறைந்திருக்கிறது, அதை நான் ஒப்புக்கொள்ள தயாராக இருக்கிறேனா?",
         "What part of myself am I hiding, and am I ready to acknowledge it?"),
    ),
    "DEFAULT": (
        ("என்னிடம் உள்ள இருண்ட அல்லது ஒளிவிலக்கப்பட்ட பகுதி என்ன?",
         "What hidden or shadowed part of me needs acknowledgement today?"),
        ("நான் அடிக்கடி தவிர்க்கும் உணர்வு எது?",
         "Which emotion do I most often avoid, and what would it say if I listened?"),
    ),
}

_SHADOW_PROMPTS_12TH: dict[str, tuple[tuple[str, str], ...]] = {
    "JUPITER": (
        ("என்னில் ஆன்மீக தேடல் எந்த திசையில் உள்ளது?",
         "In which direction is my spiritual longing pointing?"),
        ("நான் கொடுத்தது மற்றும் தியாகிப்பது, அது என்னை எப்படி உணர வைக்கிறது?",
         "What have I given up or sacrificed, and how does that feel in my body?"),
    ),
    "VENUS": (
        ("நான் எந்த உறவில் அல்லது அனுபவத்தில் தன்னை இழந்தேன்?",
         "In which relationship or experience have I lost myself, and what remains?"),
        ("என்னில் ஒளிந்திருக்கும் ஆசை என்ன?",
         "What desire within me is hiding in the shadows?"),
    ),
    "DEFAULT": (
        ("நான் தனிமையில் என்ன உணர்கிறேன், அதை ஒப்புக்கொள்கிறேனா?",
         "What do I feel in solitude, and am I honest with myself about it?"),
        ("என்னிலிருந்து விடுவிக்கப்பட வேண்டியது என்ன?",
         "What am I ready to release from my inner landscape?"),
    ),
}

_SHADOW_PROMPTS_TAMASIC = (
    ("என்னில் உள்ள இருண்ட ஆற்றலை நான் எவ்வாறு ஆக்கபூர்வமாக பயன்படுத்த முடியும்?",
     "How can I channel my intense inner energy into something constructive?"),
    ("என் ஆழ்மன பயங்கள் என்னிடம் என்ன சொல்கின்றன?",
     "What are my deepest instincts trying to tell me?"),
)


def generate_shadow_prompts(
    lagna_rasi: int,
    planets: "list[PlanetPosition]",
    moon_nakshatra: str,
) -> list[BiText]:
    """Generate 3 shadow-work journal prompts based on 8th lord, 12th lord, and Moon nakshatra."""
    from app.calculations.chart_strength import SIGN_LORD

    def house_lord(house: int) -> str:
        rasi = ((lagna_rasi + house - 2) % 12) + 1
        return SIGN_LORD.get(rasi, "UNKNOWN")

    eighth_lord = house_lord(8)
    twelfth_lord = house_lord(12)
    is_tamasic = moon_nakshatra.upper() in _TAMASIC_NAKSHATRAS

    results: list[BiText] = []

    # Prompt 1: from 8th lord
    prompts_8 = _SHADOW_PROMPTS_8TH.get(eighth_lord, _SHADOW_PROMPTS_8TH["DEFAULT"])
    ta, en = prompts_8[0]
    results.append(_bi(ta, en))

    # Prompt 2: from 12th lord
    prompts_12 = _SHADOW_PROMPTS_12TH.get(twelfth_lord, _SHADOW_PROMPTS_12TH["DEFAULT"])
    ta, en = prompts_12[0]
    results.append(_bi(ta, en))

    # Prompt 3: tamasic nakshatra or generic
    if is_tamasic:
        ta, en = _SHADOW_PROMPTS_TAMASIC[0]
    else:
        ta, en = prompts_8[1] if len(prompts_8) > 1 else _SHADOW_PROMPTS_8TH["DEFAULT"][1]
    results.append(_bi(ta, en))

    return results


def tone_validator(text: str) -> list[str]:
    """Return list of banned phrases found in `text` (case-insensitive).

    Returns an empty list when text is compliant.
    Used in tests to verify non-fatalistic language across all narrative output.
    """
    lower = text.lower()
    return [phrase for phrase in _BANNED_PHRASES if phrase in lower]
