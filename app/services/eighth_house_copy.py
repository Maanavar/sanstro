"""FAA-30 copy for the server-rendered PDF.

A line-for-line mirror of ``web/lib/eighth-house-copy.ts`` (the source of
truth). ``tests/golden/eighth_house/eighth_house_copy.json`` is generated from
the web functions; the web test and ``tests/test_faa30_mangalya_sthana.py``
both reproduce every line.

Describes only; no lifespan, widowhood or spouse-death wording (EC-RULING-06).
"Mangalya" only for a stated bride.
"""
from __future__ import annotations

from typing import Any

from app.calculations.display_names import planet_en, planet_ta, rasi_en, rasi_ta

INTRO = {
    "en": (
        "What stands in, on and around the 8th house, from the lagna and from the Moon sign. These "
        "describe the chart for your astrologer; they do not change the score, and no single line "
        "decides anything."
    ),
    "ta": (
        "லக்னத்திலிருந்தும் ராசியிலிருந்தும் 8ஆம் இடத்தில் உள்ளவை, அதைப் பார்ப்பவை, அதன் அதிபதி. இவை "
        "ஜோதிடர் பார்க்க வேண்டிய ஜாதகக் குறிப்புகள்; மதிப்பெண்ணை மாற்றாது, எந்த ஒரு வரியும் தனியாக "
        "முடிவு சொல்லாது."
    ),
}
HEADING = {"en": "The 8th house", "ta": "8ஆம் இடம்"}

_GROUP = {
    "en": {"LAGNA": "From the lagna", "MOON": "From the Moon sign", "D9_LAGNA": "In the Navamsa (D9)"},
    "ta": {"LAGNA": "லக்னத்திலிருந்து", "MOON": "ராசியிலிருந்து", "D9_LAGNA": "நவாம்சத்தில் (D9)"},
}
_DOSHAM_NAMES = {"SEVVAI_DOSHAM": ("Sevvai dosham", "செவ்வாய் தோஷம்"), "RAHU_KETU_DOSHAM": ("Rahu-Ketu dosham", "ராகு-கேது தோஷம்")}


def _g(o: Any, snake: str, camel: str) -> Any:
    if isinstance(o, dict):
        return o.get(camel, o.get(snake))
    return getattr(o, snake)


def _ord_en(n: int) -> str:
    if 11 <= n % 100 <= 13:
        return f"{n}th"
    return f"{n}{ {1: 'st', 2: 'nd', 3: 'rd'}.get(n % 10, 'th') }"


def title(role: str, lang: str) -> str:
    en = lang != "ta"
    if role == "BRIDE":
        return "Mangalya sthana (the 8th house)" if en else "மாங்கல்ய ஸ்தானம் (8ஆம் இடம்)"
    if role == "GROOM_8TH":
        return "8th-house factors" if en else "8ஆம் இடக் காரணிகள்"
    return "8th-house reading not applied" if en else "8ஆம் இட ஆய்வு செய்யப்படவில்லை"


def not_applied(lang: str) -> str:
    if lang != "ta":
        return (
            "This reading needs a stated gender. For a bride the 8th is read as mangalya sthana, for a "
            "groom as general 8th-house factors; neither was applied."
        )
    return (
        "இந்த ஆய்வுக்குப் பாலினம் குறிப்பிடப்பட வேண்டும். மணப்பெண்ணுக்கு 8ஆம் இடம் மாங்கல்ய ஸ்தானமாகவும், "
        "மணமகனுக்குப் பொதுவான 8ஆம் இடக் காரணிகளாகவும் பார்க்கப்படும்; இரண்டும் இங்கு பார்க்கப்படவில்லை."
    )


def group_label(ref: str, lang: str) -> str:
    return _GROUP["ta" if lang == "ta" else "en"][ref]


def _qualifiers(f: Any, lang: str) -> str:
    nature, condition, dignity = _g(f, "nature", "nature"), _g(f, "condition", "condition"), _g(f, "dignity", "dignity")
    parts: list[str] = []
    if lang != "ta":
        parts.append("malefic" if nature == "MALEFIC" else "benefic")
        if condition == "PAKSHA":
            parts.append("waning Moon" if nature == "MALEFIC" else "waxing Moon")
        if condition == "ASSOCIATION":
            parts.append("by its company")
        if dignity != "NEUTRAL":
            parts.append({"EXALTED": "exalted", "OWN": "in its own sign", "DEBILITATED": "debilitated"}[dignity])
        if _g(f, "combust", "combust"):
            parts.append("combust")
        if _g(f, "own_house", "ownHouse"):
            parts.append("owns this 8th")
    else:
        parts.append("பாவக் கிரகம்" if nature == "MALEFIC" else "சுபக் கிரகம்")
        if condition == "PAKSHA":
            parts.append("தேய்பிறைச் சந்திரன்" if nature == "MALEFIC" else "வளர்பிறைச் சந்திரன்")
        if condition == "ASSOCIATION":
            parts.append("சேர்க்கையால்")
        if dignity != "NEUTRAL":
            parts.append({"EXALTED": "உச்சம்", "OWN": "ஆட்சி", "DEBILITATED": "நீசம்"}[dignity])
        if _g(f, "combust", "combust"):
            parts.append("அஸ்தங்கம்")
        if _g(f, "own_house", "ownHouse"):
            parts.append("இந்த 8ஆம் இடத்தின் அதிபதி")
    return ", ".join(parts)


def line(f: Any, lang: str) -> str:
    ta = lang == "ta"
    graha_key, rasi = _g(f, "graha", "graha"), _g(f, "rasi", "rasi")
    g = (planet_ta if ta else planet_en)(graha_key) or graha_key
    sign = (rasi_ta if ta else rasi_en)(rasi) or str(rasi)
    q = _qualifiers(f, lang)
    kind, via, target, house = _g(f, "kind", "kind"), _g(f, "via", "via"), _g(f, "target", "target"), _g(f, "house", "house")
    if not ta:
        lord = "the 8th lord" if target == "LORD" else "the 8th"
        if kind == "OCCUPANT":
            return f"{g} is in the 8th, {sign} ({q})."
        if kind == "LORD":
            return f"The 8th lord, {g}, is in the {_ord_en(house)} house, {sign} ({q})."
        if kind == "INFLUENCE":
            return f"{g} is with the 8th lord, in {sign} ({q})." if via == "CONJUNCT" else f"{g} aspects {lord} from {sign} ({q})."
        if kind == "PROTECTION":
            return f"{g} aspects {lord} from {sign}, a protecting line ({q})."
        if kind == "D9_LORD":
            return f"The 8th lord, {g}, is in {sign} in the Navamsa ({q})."
        return f"{g} is in the Navamsa's 8th, {sign} ({q})."
    lord = "8ஆம் அதிபதியை" if target == "LORD" else "8ஆம் இடத்தை"
    if kind == "OCCUPANT":
        return f"{g} 8ஆம் இடமான {sign}-இல் உள்ளது ({q})."
    if kind == "LORD":
        return f"8ஆம் அதிபதி {g}, {house}ஆம் இடமான {sign}-இல் உள்ளது ({q})."
    if kind == "INFLUENCE":
        if via == "CONJUNCT":
            return f"{g} 8ஆம் அதிபதியுடன் {sign}-இல் சேர்ந்துள்ளது ({q})."
        return f"{g} {sign}-இலிருந்து {lord} பார்க்கிறது ({q})."
    if kind == "PROTECTION":
        return f"{g} {sign}-இலிருந்து {lord} பார்க்கிறது; இது காக்கும் அம்சம் ({q})."
    if kind == "D9_LORD":
        return f"நவாம்சத்தில் 8ஆம் அதிபதி {g}, {sign}-இல் உள்ளது ({q})."
    return f"நவாம்சத்தின் 8ஆம் இடமான {sign}-இல் {g} உள்ளது ({q})."


def also_counted(f: Any, lang: str) -> str:
    ta = lang == "ta"
    names = [_DOSHAM_NAMES.get(k, (k, k))[1 if ta else 0] for k in _g(f, "also_counted_in", "alsoCountedIn")]
    if not names:
        return ""
    if not ta:
        return f"The same placement is counted in {' and '.join(names)}; it is one finding, not two."
    return f"இதே நிலை {', '.join(names)}-இலும் கணக்கிடப்பட்டுள்ளது; இது இரண்டு தனிக் குறிப்புகள் அல்ல."


def d9_note(note: str | None, lang: str) -> str:
    ta = lang == "ta"
    if note == "D9_LAGNA_UNRELIABLE":
        return ("நவாம்சக் குறிப்புகள் சேர்க்கப்படவில்லை: பிறந்த நேரத்தால் நவாம்ச லக்னத்தை உறுதி செய்ய முடியவில்லை."
                if ta else "Navamsa lines are left out: the birth time cannot fix the Navamsa lagna.")
    if note == "D9_UNAVAILABLE":
        return "இந்த ஜாதகத்துக்கு நவாம்சக் குறிப்புகள் கிடைக்கவில்லை." if ta else "Navamsa lines are not available for this chart."
    return ""


def joint(pattern: str, lang: str) -> str:
    en = {
        "BOTH": "Both charts show malefic influence on the 8th. Read the two together with your astrologer.",
        "ONE": "One chart shows malefic influence on the 8th; the other does not.",
        "NEITHER": "Neither chart shows malefic influence on the 8th.",
    }
    ta = {
        "BOTH": "இரண்டு ஜாதகங்களிலும் 8ஆம் இடத்தில் பாவக் கிரகத் தாக்கம் உள்ளது. இரண்டையும் சேர்த்து ஜோதிடரிடம் பார்க்கவும்.",
        "ONE": "ஒரு ஜாதகத்தில் 8ஆம் இடத்தில் பாவக் கிரகத் தாக்கம் உள்ளது; மற்றதில் இல்லை.",
        "NEITHER": "இரண்டு ஜாதகங்களிலும் 8ஆம் இடத்தில் பாவக் கிரகத் தாக்கம் இல்லை.",
    }
    return (ta if lang == "ta" else en).get(pattern, "")
