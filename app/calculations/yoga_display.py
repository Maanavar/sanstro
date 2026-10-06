"""Display names for yoga/dosham engine codes, for server-rendered output.

The canonical table is `packages/shared/src/yogaDisplay.ts` (web and mobile read
it). The backend needs the same names where it renders text itself — the
"share with my astrologer" PDF (FTR-22) — and a raw engine code there is the
display-boundary leak CLAUDE.md forbids. This is a copy of that table, not a
second canon: `tests/test_yoga_display_parity.py` fails when the two differ, and
when the rule registry defines a yoga neither has a name for.
"""
from __future__ import annotations

YOGA_DISPLAY: dict[str, tuple[str, str]] = {
    "GAJA_KESARI_YOGA": ("கஜகேசரி அமைப்பு", "Gaja Kesari pattern"),
    "GAJA_KESARI_PARASHARA": ("கஜகேசரி யோகம்", "Gaja Kesari Yoga"),
    "GAJA_KESARI": ("கஜகேசரி யோகம்", "Gaja Kesari Yoga"),
    "RAJA_YOGA": ("ராஜயோகம்", "Raja Yoga"),
    "YOGAKARAKA_RAJA_YOGA": ("யோககாரக கிரகம்", "Yogakaraka planet"),
    "DHANA_YOGA": ("தன யோகம்", "Dhana Yoga"),
    "DHANA_SUPPORTIVE_YOGA": ("தன யோகம் (துணை)", "Dhana Yoga (supportive)"),
    "NEECHA_BHANGA_RAJA_YOGA": ("நீசபங்க ராஜயோகம்", "Neecha Bhanga Raja Yoga"),
    "NEECHA_NIVARTHI": ("நீசபங்கம்", "Neecha Bhanga (debility cancelled)"),
    "RETROGRADE_DEBILITATED_RAJA_YOGA": ("வக்கிர நீச கிரக ராஜயோகம்", "Retrograde debilitated-planet Raja Yoga"),
    "KALASARPA": ("காலசர்ப்ப யோகம்", "Kala Sarpa Yoga"),
    "BUDHA_ADITYA_YOGA": ("புத ஆதித்ய யோகம்", "Budha-Aditya Yoga"),
    "VIPAREETHA_RAJA_YOGA": ("விபரீத ராஜயோகம்", "Vipareetha Raja Yoga"),
    "PARIVARTANA_YOGA": ("பரிவர்தன யோகம்", "Parivartana Yoga"),
    "CHANDRA_MANGALA_YOGA": ("சந்திர மங்கள யோகம்", "Chandra-Mangala Yoga"),
    "SAKATA_YOGA": ("சகட யோகம்", "Sakata Yoga"),
    "KEMADRUMA_YOGA": ("கேமத்ரும யோகம்", "Kemadruma Yoga"),
    "CHANDALA_YOGA": ("குரு சண்டாள யோகம்", "Guru-Chandala Yoga"),
    "CHANDALA_KETU_YOGA": ("குரு சண்டாள யோகம் (குரு-கேது)", "Guru-Chandala Yoga (Ketu variant)"),
    "AMALA_YOGA": ("அமல யோகம்", "Amala Yoga"),
    "ADHI_YOGA": ("அதி யோகம்", "Adhi Yoga"),
    "ADHI_BASE": ("அதி யோக அமைப்பு", "Adhi pattern (base)"),
    "ADHI_RAJA_GRADE": ("அதி யோகம் — முழுப் பலம் உறுதியாகவில்லை", "Adhi Yoga (full strength not confirmed)"),
    "DARIDRA_YOGA": ("தரித்ர யோகம்", "Daridra Yoga"),
    "DARIDRA_PROXY_YOGA": ("தரித்ர யோகம் (வினாடி அளவுகோல்)", "Daridra Yoga (Vinaadi measure)"),
    "LAKSHMI_YOGA": ("லக்ஷ்மி யோகம்", "Lakshmi Yoga"),
    "LAKSHMI_YOGA_PHALADEEPIKA": ("லக்ஷ்மி யோகம் (பலதீபிகை வடிவம்)", "Lakshmi Yoga (Phaladeepika form)"),
    "BHAGYA_SUPPORT": ("பாக்கிய ஆதரவு", "Fortune support"),
    "VASUMATI_YOGA": ("வசுமதி யோகம்", "Vasumati Yoga"),
    "RUCHAKA_YOGA": ("ருசக யோகம்", "Ruchaka Yoga"),
    "BHADRA_YOGA": ("பத்ர யோகம்", "Bhadra Yoga"),
    "HAMSA_YOGA": ("ஹம்ச யோகம்", "Hamsa Yoga"),
    "MALAVYA_YOGA": ("மாளவ்ய யோகம்", "Malavya Yoga"),
    "SASA_YOGA": ("சஸ யோகம்", "Sasa Yoga"),
    "SUNAPHA_YOGA": ("சுனபா யோகம்", "Sunapha Yoga"),
    "PAPA_KARTARI_YOGA": ("பாப கர்த்தரி யோகம்", "Papa Kartari Yoga"),
    "SHUBHA_KARTARI_YOGA": ("சுப கர்த்தரி யோகம்", "Shubha Kartari Yoga"),
    "KARTARI_YOGA": ("கர்த்தரி அமைப்பு இல்லை", "Kartari — neither formation present"),
    "ANAPHA_YOGA": ("அநபா யோகம்", "Anapha Yoga"),
    "DURUDHURA_YOGA": ("துருதுரா யோகம்", "Durudhura Yoga"),
    "AYILYAM_CAUTION": ("ஆயில்ய தோஷம்", "Ayilyam (Ashlesha) caution"),
    "KETTAI_CAUTION": ("கேட்டை தோஷம்", "Kettai (Jyeshtha) caution"),
    "MOOLAM_CAUTION": ("மூல தோஷம்", "Moolam (Moola) caution"),
    "SEVVAI_DOSHAM": ("செவ்வாய் தோஷம்", "Sevvai Dosham"),
    "RAHU_KETU_DOSHAM": ("ராகு-கேது தோஷம்", "Rahu-Ketu Dosham"),
    "PITRU_DOSHAM": ("பித்ரு தோஷம்", "Pitru Dosham"),
    "KALATHRA_DOSHAM": ("களத்திர தோஷம்", "Kalathra Dosham"),
    "PUTRA_SARPA_DOSHAM": ("புத்ர சர்ப்ப தோஷம்", "Putra Sarpa Dosham"),
    "BADHAKA_DOSHAM": ("பாதக தோஷம்", "Badhaka Dosham"),
    "MARANA_KARAKA_STHANA": ("மரண காரக ஸ்தானம்", "Marana Karaka Sthana"),
}


def resolve_yoga_key(name: str) -> tuple[str, str] | None:
    """Mirror of the shared `resolveYogaKey`: exact key, then the bare
    GAJA_KESARI -> GAJA_KESARI_YOGA rewrite, never applied to a full key."""
    key = name.upper()
    return YOGA_DISPLAY.get(key) or YOGA_DISPLAY.get(key.replace("GAJA_KESARI", "GAJA_KESARI_YOGA"))


def yoga_display_name(name: str, lang: str) -> str:
    """The reader's-language name. An unknown code degrades to readable words
    rather than the shouting enum (the parity test keeps this path unused)."""
    entry = resolve_yoga_key(name)
    if entry is None:
        return name.replace("_", " ").title()
    return entry[0] if lang == "ta" else entry[1]

def yoga_reading_status(is_present: bool, strength: str, cancellation_factors: list[str] | None) -> str:
    """Mirror of the shared `yogaReadingStatus` (PRESENT / CANCELLED / ABSENT).

    Formed-and-cancelled is its own reading (astrologer ruling 2026-09-11): a
    full bhanga sets is_present=False but keeps its cancellation factors.
    """
    cancelled = bool(cancellation_factors)
    if not is_present:
        return "CANCELLED" if cancelled else "ABSENT"
    if cancelled and strength == "WEAK":
        return "CANCELLED"
    return "PRESENT"


_STATUS_WORD = {"ABSENT": ("இல்லை", "Absent"), "CANCELLED": ("நிவர்த்தி", "Cancelled"), "PRESENT": ("உண்டு", "Present")}
_STRENGTH_WORD = {"STRONG": ("வலுவான", "Strong"), "PARTIAL": ("மிதமான", "Moderate")}


def status_word(status: str, lang: str) -> str:
    """Mirror of the shared `yogaReadingStatusLabel`."""
    ta, en = _STATUS_WORD.get(status, _STATUS_WORD["PRESENT"])
    return ta if lang == "ta" else en


def natal_strength_word(strength: str, lang: str) -> str:
    """Mirror of the shared `natalStrengthWord` (anything else reads Mild)."""
    ta, en = _STRENGTH_WORD.get(strength, ("லேசான", "Mild"))
    return ta if lang == "ta" else en


_RESIDUAL_ADJ = {"MODERATE": ("மிதமான", "moderate"), "STRONG": ("வலுவான", "strong")}


def dosham_standing_word(is_cancelled: bool, strength: str, residual: str, lang: str) -> str:
    """Mirror of the shared `doshamStanding` label for a present dosham (DD-17):
    natal strength while active, "Mitigated · mild residual" once mitigated —
    never a bare "Mild", which is what a mitigated dosham's WEAK strength printed."""
    if not is_cancelled:
        return natal_strength_word(strength, lang)
    ta, en = _RESIDUAL_ADJ.get(residual, ("லேசான", "mild"))
    return f"நிவர்த்தி · {ta} மீதத் தாக்கம்" if lang == "ta" else f"Mitigated · {en} residual"
