"""Shared bilingual display names for calculation-layer prose (RP-01).

User-facing sentences composed in the calculations/services layers must never
interpolate internal enum codes ("SUN", "MAHADASHA", "ASHTAMA_SANI") into Tamil
or English prose. This module is the one canonical lookup for those names at
the calculations level, so `app/calculations/*` modules don't have to reach up
into `app/services/narrative_engine.py` (which keeps its own richer BiText
catalogue for the daily engine).

Keep spellings aligned with narrative_engine.PLANET_NAME — the tables are a
hand-maintained pair (test_arch03_bilingual_audit asserts script purity on the
rendered output, not table equality).
"""
from __future__ import annotations

from app.constants.astrology import NAKSHATRA_NAMES

PLANET_TA: dict[str, str] = {
    "SUN": "சூரியன்", "MOON": "சந்திரன்", "MARS": "செவ்வாய்",
    "MERCURY": "புதன்", "JUPITER": "குரு", "VENUS": "சுக்கிரன்",
    "SATURN": "சனி", "RAHU": "ராகு", "KETU": "கேது",
}

PLANET_EN: dict[str, str] = {
    "SUN": "Sun", "MOON": "Moon", "MARS": "Mars",
    "MERCURY": "Mercury", "JUPITER": "Jupiter", "VENUS": "Venus",
    "SATURN": "Saturn", "RAHU": "Rahu", "KETU": "Ketu",
}


def planet_ta(graha: str) -> str:
    """Tamil display name for a planet enum code (falls back to the code)."""
    return PLANET_TA.get(graha, graha)


def planet_en(graha: str) -> str:
    """Plain English display name for a planet enum code."""
    return PLANET_EN.get(graha, graha.title() if graha.isupper() else graha)


# Nitya-yoga display names, 1..27, in the Tamil panchangam spelling used by
# printed Tamil almanacs. English keeps the familiar transliteration.
YOGA_NAME_TA: dict[int, str] = {
    1: "விஷ்கம்பம்", 2: "பிரீதி", 3: "ஆயுஷ்மான்", 4: "சௌபாக்யம்", 5: "சோபனம்",
    6: "அதிகண்டம்", 7: "சுகர்மம்", 8: "திருதி", 9: "சூலம்", 10: "கண்டம்",
    11: "விருத்தி", 12: "துருவம்", 13: "வியாகாதம்", 14: "ஹர்ஷணம்", 15: "வஜ்ரம்",
    16: "சித்தி", 17: "வியதீபாதம்", 18: "வரீயான்", 19: "பரிகம்", 20: "சிவம்",
    21: "சித்தம்", 22: "சாத்யம்", 23: "சுபம்", 24: "சுக்லம்", 25: "பிரம்மம்",
    26: "இந்திரம்", 27: "வைதிருதி",
}

YOGA_NAME_EN: dict[int, str] = {
    1: "Vishkambha", 2: "Priti", 3: "Ayushman", 4: "Saubhagya", 5: "Shobhana",
    6: "Atiganda", 7: "Sukarma", 8: "Dhriti", 9: "Shoola", 10: "Ganda",
    11: "Vriddhi", 12: "Dhruva", 13: "Vyaghata", 14: "Harshana", 15: "Vajra",
    16: "Siddhi", 17: "Vyatipata", 18: "Variyana", 19: "Parigha", 20: "Shiva",
    21: "Siddha", 22: "Sadhya", 23: "Shubha", 24: "Shukla", 25: "Brahma",
    26: "Indra", 27: "Vaidhriti",
}


# Sani cycle type → short display label (the full advisory sentences live in
# narrative_engine._SANI_CYCLE_WARN; this is just the name of the cycle).
SANI_CYCLE_TA: dict[str, str] = {
    "JANMA_SANI": "ஜன்ம சனி",
    "ARDHASHTAMA_SANI": "அர்த்தாஷ்டம சனி",
    "ASHTAMA_SANI": "அஷ்டம சனி",
    "KANTAKA_SANI": "கண்டக சனி",
    "KANDAKA_SANI": "கண்டக சனி (லக்னம்)",
    "EZHARAI_SANI_PHASE_1": "ஏழரை சனி (தொடக்கம்)",
    "EZHARAI_SANI_PHASE_2": "ஏழரை சனி (நடுவு — ஜன்ம சனி)",
    "EZHARAI_SANI_PHASE_3": "ஏழரை சனி (முடிவு)",
}

SANI_CYCLE_EN: dict[str, str] = {
    "JANMA_SANI": "Janma Sani",
    "ARDHASHTAMA_SANI": "Ardhashtama Sani",
    "ASHTAMA_SANI": "Ashtama Sani",
    "KANTAKA_SANI": "Kantaka Sani",
    "KANDAKA_SANI": "Kantaka Sani (from Lagna)",
    "EZHARAI_SANI_PHASE_1": "Ezharai Sani (opening phase)",
    "EZHARAI_SANI_PHASE_2": "Ezharai Sani (middle — Janma Sani)",
    "EZHARAI_SANI_PHASE_3": "Ezharai Sani (closing phase)",
}


def sani_cycle_ta(cycle_type: str) -> str:
    return SANI_CYCLE_TA.get(cycle_type, "சனி சுழற்சி")


def sani_cycle_en(cycle_type: str) -> str:
    return SANI_CYCLE_EN.get(cycle_type, cycle_type.replace("_", " ").title())


# ---------------------------------------------------------------------------
# Rasi names.
#
# English spellings mirror `app.calculations.astro.RASI_NAMES`, which is
# already Tamil almanac usage (Mesham, Rishabam, …) rather than Sanskrit
# (Mesha, Vrishabha, …) — do not "correct" them toward Sanskrit.
#
# NOTE: `app/api/daily_snapshot.py` and `app/api/public_tools.py` each carry a
# private `_RASI_NAMES_TA` copy that predates this one. New code should import
# from here; those two are left alone rather than refactored blind.
# ---------------------------------------------------------------------------
RASI_TA: dict[int, str] = {
    1: "மேஷம்", 2: "ரிஷபம்", 3: "மிதுனம்", 4: "கடகம்",
    5: "சிம்மம்", 6: "கன்னி", 7: "துலாம்", 8: "விருச்சிகம்",
    9: "தனுசு", 10: "மகரம்", 11: "கும்பம்", 12: "மீனம்",
}

RASI_EN: dict[int, str] = {
    1: "Mesham", 2: "Rishabam", 3: "Mithunam", 4: "Kadagam",
    5: "Simmam", 6: "Kanni", 7: "Thulam", 8: "Viruchigam",
    9: "Dhanusu", 10: "Magaram", 11: "Kumbam", 12: "Meenam",
}


def rasi_ta(rasi: int | None) -> str | None:
    return RASI_TA.get(rasi) if rasi is not None else None


def rasi_en(rasi: int | None) -> str | None:
    return RASI_EN.get(rasi) if rasi is not None else None


# ---------------------------------------------------------------------------
# Nakshatra names, 1..27.
#
# The Tamil spellings are printed-almanac usage and were previously a private
# tuple inside `muhurtham_naal_service`. They are here now because a second
# caller appeared (the one-minute reading), and the alternative was the third
# hand-copy of a name table in this codebase — which is exactly what the RASI
# note above is apologising for.
#
# THE ENGLISH SIDE IS DERIVED, NOT TYPED. `NAKSHATRA_NAMES` is the stable
# machine value other surfaces match on and it is already Tamil-almanac
# transliteration; the only difference in prose is case. Writing the 27 English
# names out again would create a table that can silently disagree with the
# constant it is supposed to mirror, which is the failure mode RASI_EN already
# carries. Derivation makes that impossible rather than merely tested.
# ---------------------------------------------------------------------------
NAKSHATRA_TA: dict[int, str] = {
    1: "அசுவினி", 2: "பரணி", 3: "கார்த்திகை", 4: "ரோகிணி",
    5: "மிருகசீரிடம்", 6: "திருவாதிரை", 7: "புனர்பூசம்", 8: "பூசம்",
    9: "ஆயில்யம்", 10: "மகம்", 11: "பூரம்", 12: "உத்திரம்",
    13: "ஹஸ்தம்", 14: "சித்திரை", 15: "சுவாதி", 16: "விசாகம்",
    17: "அனுசம்", 18: "கேட்டை", 19: "மூலம்", 20: "பூராடம்",
    21: "உத்திராடம்", 22: "திருவோணம்", 23: "அவிட்டம்", 24: "சதயம்",
    25: "பூரட்டாதி", 26: "உத்திரட்டாதி", 27: "ரேவதி",
}

NAKSHATRA_EN: dict[int, str] = {
    index + 1: name.title() for index, name in enumerate(NAKSHATRA_NAMES)
}


def nakshatra_ta(nakshatra: int | None) -> str | None:
    """Tamil display name for a 1-indexed nakshatra number."""
    return NAKSHATRA_TA.get(nakshatra) if nakshatra is not None else None


def nakshatra_en(nakshatra: int | None) -> str | None:
    """Prose-cased English name for a 1-indexed nakshatra number."""
    return NAKSHATRA_EN.get(nakshatra) if nakshatra is not None else None
