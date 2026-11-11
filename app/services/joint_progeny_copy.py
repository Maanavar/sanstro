"""FAA-32 copy for the server-rendered PDF.

A line-for-line mirror of ``web/lib/joint-progeny-copy.ts`` (the source of
truth). ``tests/golden/joint_progeny/joint_progeny_copy.json`` is generated
from the web functions; the web test and ``tests/test_faa32_joint_progeny.py``
both reproduce every line.

Describes and times only; never says whether a child will come (Q17).
"""
from __future__ import annotations

from typing import Any

from app.calculations.display_names import planet_en, planet_ta, rasi_en, rasi_ta

HEADING = {"en": "Children: reading both charts", "ta": "குழந்தைப் பேறு: இரு ஜாதகங்களும்"}
INTRO = {
    "en": (
        "What each chart shows around children: the 5th house, Jupiter, the 5th from Jupiter and from the Moon "
        "sign, and for a bride the 9th. Each line is marked supportive or challenging; the marks are not "
        "added up. These describe the charts for your astrologer; they do not change the score, and nothing "
        "here says whether or when a child will come."
    ),
    "ta": (
        "ஒவ்வொரு ஜாதகத்திலும் குழந்தைப் பேறு தொடர்பானவை: 5ஆம் இடம், குரு, குருவிலிருந்தும் ராசியிலிருந்தும் "
        "5ஆம் இடம், மணப்பெண்ணுக்கு 9ஆம் இடம். ஒவ்வொரு வரியும் சாதகம் அல்லது சவால் எனக் குறிக்கப்பட்டுள்ளது; "
        "இவை கூட்டிக் கணக்கிடப்படுவதில்லை. இவை ஜோதிடர் பார்க்க வேண்டிய ஜாதகக் குறிப்புகள்; மதிப்பெண்ணை "
        "மாற்றாது, குழந்தை பிறக்குமா, எப்போது என்று இங்கு எதுவும் சொல்லப்படவில்லை."
    ),
}
GROUPS = ("LAGNA", "KARAKA", "JUPITER", "MOON", "NINTH", "D7")

_DOSHAM_NAMES = {
    "PUTRA_SARPA_DOSHAM": ("Putra Sarpa dosham", "புத்ர சர்ப்ப தோஷம்"),
    "SANTHANA_THADAI": ("Santhana Thadai", "புத்திர தடை"),
}
_ROLE = {
    "FIFTH_LORD": ("5th lord", "5ஆம் அதிபதி"),
    "JUPITER": ("putra karaka", "புத்திர காரகர்"),
    "FIFTH_OCCUPANT": ("in the 5th", "5ஆம் இடத்தில்"),
    "FIFTH_FROM_JUPITER_LORD": ("lord of the 5th from Jupiter", "குருவிலிருந்து 5ஆம் அதிபதி"),
    "FIFTH_LORD_DISPOSITOR": ("dispositor of the 5th lord", "5ஆம் அதிபதி நிற்கும் ராசியின் அதிபதி"),
    "NINTH_LORD": ("9th lord", "9ஆம் அதிபதி"),
    "NINTH_OCCUPANT": ("in the 9th", "9ஆம் இடத்தில்"),
}


def _g(o: Any, snake: str, camel: str) -> Any:
    if isinstance(o, dict):
        return o.get(camel, o.get(snake))
    return getattr(o, snake)


def _ord_en(n: int) -> str:
    if 11 <= n % 100 <= 13:
        return f"{n}th"
    return f"{n}{ {1: 'st', 2: 'nd', 3: 'rd'}.get(n % 10, 'th') }"


def _planet(key: str, ta: bool) -> str:
    return (planet_ta if ta else planet_en)(key) or key


def group_of(f: Any) -> str:
    ref, target, bhava = _g(f, "reference", "reference"), _g(f, "target", "target"), _g(f, "bhava", "bhava")
    if ref == "D7_LAGNA":
        return "D7"
    if target == "KARAKA":
        return "KARAKA"
    if ref == "LAGNA" and bhava == 9:
        return "NINTH"
    return str(ref)


def group_label(group: str, ninth: str, lang: str) -> str:
    if lang != "ta":
        ninth_label = "The 9th, read for children in a woman's chart" if ninth == "CHILDREN" else "The 9th, as context only"
        return {
            "LAGNA": "The 5th from the lagna", "KARAKA": "Jupiter, the karaka for children", "JUPITER": "The 5th from Jupiter",
            "MOON": "The 5th from the Moon sign", "NINTH": ninth_label, "D7": "In the Saptamsa (D7)",
        }[group]
    ninth_label = "9ஆம் இடம் (பெண் ஜாதகத்தில் குழந்தைப் பேற்றுக்கு)" if ninth == "CHILDREN" else "9ஆம் இடம் (குறிப்புக்காக மட்டும்)"
    return {
        "LAGNA": "லக்னத்திலிருந்து 5ஆம் இடம்", "KARAKA": "புத்திர காரகர் குரு", "JUPITER": "குருவிலிருந்து 5ஆம் இடம்",
        "MOON": "ராசியிலிருந்து 5ஆம் இடம்", "NINTH": ninth_label, "D7": "சப்தாம்சத்தில் (D7)",
    }[group]


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
            parts.append("owns this house")
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
            parts.append("இந்த இடத்தின் அதிபதி")
    return ", ".join(parts)


def line(f: Any, lang: str) -> str:
    ta = lang == "ta"
    g = _planet(_g(f, "graha", "graha"), ta)
    rasi = _g(f, "rasi", "rasi")
    sign = (rasi_ta if ta else rasi_en)(rasi) or str(rasi)
    q = _qualifiers(f, lang)
    kind, via, target = _g(f, "kind", "kind"), _g(f, "via", "via"), _g(f, "target", "target")
    house, n = _g(f, "house", "house"), _g(f, "bhava", "bhava")
    if not ta:
        lord = f"the {_ord_en(n)} lord" if target == "LORD" else f"the {_ord_en(n)}"
        if kind == "OCCUPANT":
            return f"{g} is in the {_ord_en(n)}, {sign} ({q})."
        if kind == "LORD":
            return f"The {_ord_en(n)} lord, {g}, is in the {_ord_en(house)} house, {sign} ({q})."
        if kind == "KARAKA":
            return f"{g} is in the {_ord_en(house)} house, {sign} ({q})."
        if kind in ("INFLUENCE", "BENEFIC_ASPECT"):
            if target == "KARAKA":
                return f"{g} is with Jupiter, in {sign} ({q})."
            return f"{g} is with {lord}, in {sign} ({q})." if via == "CONJUNCT" else f"{g} aspects {lord} from {sign} ({q})."
        if kind == "D7_LORD":
            return f"The 5th lord in the Saptamsa, {g}, is in its {_ord_en(house)} house, {sign} ({q})."
        if kind == "D7_KARAKA":
            return f"{g} is in the Saptamsa's {_ord_en(house)} house, {sign} ({q})."
        return f"{g} is in the Saptamsa's 5th, {sign} ({q})."
    lord_ta = f"{n}ஆம் அதிபதியை" if target == "LORD" else f"{n}ஆம் இடத்தை"
    if kind == "OCCUPANT":
        return f"{g} {n}ஆம் இடமான {sign}-இல் உள்ளது ({q})."
    if kind == "LORD":
        return f"{n}ஆம் அதிபதி {g}, {house}ஆம் இடமான {sign}-இல் உள்ளது ({q})."
    if kind == "KARAKA":
        return f"{g} {house}ஆம் இடமான {sign}-இல் உள்ளது ({q})."
    if kind in ("INFLUENCE", "BENEFIC_ASPECT"):
        if target == "KARAKA":
            return f"{g} குருவுடன் {sign}-இல் சேர்ந்துள்ளது ({q})."
        if via == "CONJUNCT":
            return f"{g} {n}ஆம் அதிபதியுடன் {sign}-இல் சேர்ந்துள்ளது ({q})."
        return f"{g} {sign}-இலிருந்து {lord_ta} பார்க்கிறது ({q})."
    if kind == "D7_LORD":
        return f"சப்தாம்சத்தில் 5ஆம் அதிபதி {g}, {house}ஆம் இடமான {sign}-இல் உள்ளது ({q})."
    if kind == "D7_KARAKA":
        return f"சப்தாம்சத்தில் {g} {house}ஆம் இடமான {sign}-இல் உள்ளது ({q})."
    return f"சப்தாம்சத்தின் 5ஆம் இடமான {sign}-இல் {g} உள்ளது ({q})."


def bearing(f: Any, lang: str) -> str:
    b = _g(f, "bearing", "bearing")
    if b == "SUPPORTIVE":
        return "சாதகம்" if lang == "ta" else "supportive"
    if b == "CHALLENGING":
        return "சவால்" if lang == "ta" else "challenging"
    return ""


def also_counted(f: Any, lang: str) -> str:
    ta = lang == "ta"
    names = [_DOSHAM_NAMES.get(k, (k, k))[1 if ta else 0] for k in _g(f, "also_counted_in", "alsoCountedIn")]
    if not names:
        return ""
    if not ta:
        return f"The same placement is counted in {' and '.join(names)}; it is one finding, not two."
    return f"இதே நிலை {', '.join(names)}-இலும் கணக்கிடப்பட்டுள்ளது; இது இரண்டு தனிக் குறிப்புகள் அல்ல."


def ninth_not_applied(ninth: str, lang: str) -> str:
    if ninth != "NOT_APPLIED":
        return ""
    if lang != "ta":
        return "In a woman's chart the 9th is also read for children. No gender is stated, so the 9th was not read."
    return "பெண் ஜாதகத்தில் 9ஆம் இடமும் குழந்தைப் பேற்றுக்குப் பார்க்கப்படும். பாலினம் குறிப்பிடப்படாததால் 9ஆம் இடம் பார்க்கப்படவில்லை."


def d7_note(note: str | None, lang: str) -> str:
    ta = lang == "ta"
    if note == "D7_LAGNA_UNRELIABLE":
        return ("சப்தாம்சக் (D7) குறிப்புகள் சேர்க்கப்படவில்லை: பிறந்த நேரத்தால் சப்தாம்ச லக்னத்தை உறுதி செய்ய முடியவில்லை."
                if ta else "Saptamsa (D7) lines are left out: the birth time cannot fix the D7 lagna.")
    if note == "D7_UNAVAILABLE":
        return "இந்த ஜாதகத்துக்குச் சப்தாம்சக் (D7) குறிப்புகள் கிடைக்கவில்லை." if ta else "Saptamsa (D7) lines are not available for this chart."
    return ""


_JOINT_EN = {
    "FIFTH_HOUSE": {
        "BOTH": "In both charts a malefic sits in the 5th, outside its own sign. Read the two together with your astrologer.",
        "ONE": "In one chart a malefic sits in the 5th, outside its own sign; in the other none does.",
        "NEITHER": "In neither chart does a malefic sit in the 5th outside its own sign.",
    },
    "FIFTH_LORD": {
        "BOTH": "In both charts the 5th lord is marked challenging, by its own placement or by a malefic with it. Read the two together with your astrologer.",
        "ONE": "In one chart the 5th lord is marked challenging; in the other it is not.",
        "NEITHER": "In neither chart is the 5th lord marked challenging.",
    },
    "JUPITER": {
        "BOTH": "In both charts Jupiter is marked challenging, by its own placement or by a malefic with it. Read the two together with your astrologer.",
        "ONE": "In one chart Jupiter is marked challenging; in the other it is not.",
        "NEITHER": "In neither chart is Jupiter marked challenging.",
    },
}
_JOINT_TA = {
    "FIFTH_HOUSE": {
        "BOTH": "இரண்டு ஜாதகங்களிலும் 5ஆம் இடத்தில் பாவக் கிரகம் உள்ளது (அதன் சொந்த ராசி அல்ல). இரண்டையும் சேர்த்து ஜோதிடரிடம் பார்க்கவும்.",
        "ONE": "ஒரு ஜாதகத்தில் 5ஆம் இடத்தில் பாவக் கிரகம் உள்ளது (அதன் சொந்த ராசி அல்ல); மற்றதில் இல்லை.",
        "NEITHER": "இரண்டு ஜாதகங்களிலும் 5ஆம் இடத்தில் சொந்த ராசி அல்லாத பாவக் கிரகம் இல்லை.",
    },
    "FIFTH_LORD": {
        "BOTH": "இரண்டு ஜாதகங்களிலும் 5ஆம் அதிபதி சவால் எனக் குறிக்கப்பட்டுள்ளது: அதன் நிலையாலோ, உடன் உள்ள பாவக் கிரகத்தாலோ. இரண்டையும் சேர்த்து ஜோதிடரிடம் பார்க்கவும்.",
        "ONE": "ஒரு ஜாதகத்தில் 5ஆம் அதிபதி சவால் எனக் குறிக்கப்பட்டுள்ளது; மற்றதில் இல்லை.",
        "NEITHER": "இரண்டு ஜாதகங்களிலும் 5ஆம் அதிபதி சவால் எனக் குறிக்கப்படவில்லை.",
    },
    "JUPITER": {
        "BOTH": "இரண்டு ஜாதகங்களிலும் குரு சவால் எனக் குறிக்கப்பட்டுள்ளார்: அவரது நிலையாலோ, உடன் உள்ள பாவக் கிரகத்தாலோ. இரண்டையும் சேர்த்து ஜோதிடரிடம் பார்க்கவும்.",
        "ONE": "ஒரு ஜாதகத்தில் குரு சவால் எனக் குறிக்கப்பட்டுள்ளார்; மற்றதில் இல்லை.",
        "NEITHER": "இரண்டு ஜாதகங்களிலும் குரு சவால் எனக் குறிக்கப்படவில்லை.",
    },
}


def joint_line(key: str, pattern: str, lang: str) -> str:
    return (_JOINT_TA if lang == "ta" else _JOINT_EN)[key][pattern]


def timing_heading(lang: str) -> str:
    return "இருவருக்கும் ஒரே நேரத்தில் நடக்கும் காலங்கள்" if lang == "ta" else "Periods running for both"


def timing_intro(years: int, start: str, end: str, lang: str) -> str:
    if lang != "ta":
        return (
            f"Bhuktis of each chart's timing lords for children that run at the same time, over the next {years} "
            f"years ({start} to {end}). These are dates for your astrologer to read, not predictions."
        )
    return (
        f"அடுத்த {years} ஆண்டுகளில் ({start} முதல் {end} வரை) இருவருக்கும் ஒரே நேரத்தில் நடக்கும், குழந்தைப் "
        "பேற்றைக் குறிக்கும் கிரகங்களின் புக்திகள். இவை ஜோதிடர் பார்க்க வேண்டிய தேதிகள்; கணிப்புகள் அல்ல."
    )


def timing_empty(timing_note: str | None, has_windows: bool, years: int, lang: str) -> str:
    ta = lang == "ta"
    if timing_note == "AGE_OUTSIDE_RANGE":
        return ("தேதிகள் காட்டப்படவில்லை: இருவரும் 18 முதல் 50 வயதுக்குள் இருக்கும்போது மட்டுமே இவை தரப்படும்."
                if ta else "Dates are not listed: they are given only when both partners are between 18 and 50.")
    if has_windows:
        return ""
    return (f"அடுத்த {years} ஆண்டுகளில் இருவருக்கும் ஒரே நேரத்தில் இத்தகைய புக்தி இல்லை."
            if ta else f"No bhukti of a timing lord runs for both in the next {years} years.")


def roles(keys: Any, lang: str) -> str:
    return ", ".join(_ROLE[k][1 if lang == "ta" else 0] for k in keys)


def window_line(w: Any, name_a: str, name_b: str, lang: str) -> str:
    ta = lang == "ta"

    def p(maha: str, lord: str) -> str:
        return f"{_planet(maha, ta)} / {_planet(lord, ta)}"

    start, end = str(_g(w, "start", "start")), str(_g(w, "end", "end"))
    a = f"{name_a}, {p(_g(w, 'maha_a', 'mahaA'), _g(w, 'lord_a', 'lordA'))} ({roles(_g(w, 'roles_a', 'rolesA'), lang)})"
    b = f"{name_b}, {p(_g(w, 'maha_b', 'mahaB'), _g(w, 'lord_b', 'lordB'))} ({roles(_g(w, 'roles_b', 'rolesB'), lang)})"
    if not ta:
        return f"{start} to {end}: {a}; {b}."
    return f"{start} முதல் {end} வரை: {a}; {b}."
