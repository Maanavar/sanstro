"""FAA-33 copy for the server-rendered PDF.

A line-for-line mirror of ``web/lib/cross-chart-copy.ts``. The web copy is the
source of truth; ``tests/golden/cross_chart/cross_chart_copy.json`` is generated
from it, and both the web test and ``tests/test_faa33_cross_chart.py`` must
reproduce every line, so the two cannot drift apart silently.

Names come from numbers and graha keys through ``display_names`` (CLAUDE.md
display boundary). Advisory voice: where a point falls, never a verdict.
"""
from __future__ import annotations

from typing import Any, Literal

from app.calculations.display_names import planet_en, planet_ta, rasi_en, rasi_ta

Tone = Literal["favourable", "neutral", "ask"]

#: House meaning, in plain words. The 8th is "sudden changes" only
#: (EC-RULING-06 keeps lifespan out). Same table as the web HOUSE_MEANING.
_HOUSE_MEANING: dict[int, tuple[str, str]] = {
    1: ("Personal closeness", "நெருக்கம், தனிப்பட்ட இணைப்பு"),
    2: ("Family and speech", "குடும்பம், பேச்சு"),
    3: ("Effort and courage", "முயற்சி, தைரியம்"),
    4: ("Home and peace of mind", "வீடு, மன நிம்மதி"),
    5: ("Affection", "அன்பு, பாசம்"),
    6: ("Differences to work through", "சரிசெய்ய வேண்டிய கருத்து வேறுபாடுகள்"),
    7: ("Partnership", "இல்லறத் துணை"),
    8: ("Sudden changes", "எதிர்பாராத மாற்றங்கள்"),
    9: ("Fortune and shared values", "பாக்கியம், தர்மம்"),
    10: ("Work and standing", "தொழில், மதிப்பு"),
    11: ("Gains and fulfilment", "லாபம், நிறைவு"),
    12: ("Expenses and distance", "செலவு, விலகல்"),
}

_TONE_WORD = {
    "en": {"favourable": "favourable", "neutral": "neutral", "ask": "ask your astrologer about this"},
    "ta": {"favourable": "சாதகம்", "neutral": "பொது", "ask": "ஜோதிடரிடம் கேட்கவும்"},
}

HEADING = {"en": "Chart-to-chart observations", "ta": "ஜாதக ஒப்பீட்டுக் குறிப்புகள்"}
INTRO = {
    "en": (
        "Where each chart's key points fall in the other chart. These are observations for your "
        "astrologer to read with the full charts; they do not change the score."
    ),
    "ta": (
        "ஒவ்வொரு ஜாதகத்தின் முக்கிய நிலைகள் மற்ற ஜாதகத்தில் எங்கு வருகின்றன என்பதைக் காட்டுகிறது. "
        "இவை முழு ஜாதகத்துடன் ஜோதிடர் பார்க்க வேண்டிய குறிப்புகள்; மதிப்பெண்ணை மாற்றாது."
    ),
}


def direction_label(src: str, dst: str, lang: str) -> str:
    """PDF only (the web card uses an arrow, which the PDF fonts lack)."""
    if lang == "ta":
        return f"{src} ஜாதக நிலைகள், {dst} ஜாதகத்தில்"
    return f"{src}'s points in {dst}'s chart"


def _get(o: Any, snake: str, camel: str) -> Any:
    """Read a row given as the schema model, the engine dataclass, or wire JSON."""
    if isinstance(o, dict):
        return o.get(camel, o.get(snake))
    return getattr(o, snake)


def _ord_en(n: int) -> str:
    if 11 <= n % 100 <= 13:
        return f"{n}th"
    return f"{n}{ {1: 'st', 2: 'nd', 3: 'rd'}.get(n % 10, 'th') }"


def _house(o: Any) -> tuple[int, bool]:
    h_moon = _get(o, "house_from_moon", "houseFromMoon")
    if h_moon is not None:
        return int(h_moon), True
    return int(_get(o, "house_from_lagna", "houseFromLagna") or 0), False


def row_visible(o: Any) -> bool:
    """Venus/Guru overlay rows only say something when they fall on the 7th."""
    return _get(o, "key", "key") not in ("VENUS", "JUPITER") or _get(o, "house_from_lagna", "houseFromLagna") == 7


def line(o: Any, src: str, dst: str, lang: str) -> str:
    ta = lang == "ta"
    rasi = _get(o, "rasi", "rasi")
    sign = (rasi_ta if ta else rasi_en)(rasi) or str(rasi)
    graha_key = _get(o, "graha", "graha")
    graha = ((planet_ta if ta else planet_en)(graha_key) or graha_key) if graha_key else ""
    n, from_moon = _house(o)
    key = _get(o, "key", "key")

    if not ta:
        ref = f"{dst}'s Moon sign" if from_moon else f"{dst}'s lagna"
        if key == "SEVENTH_LORD":
            return f"{src}'s 7th lord {graha} (in {sign}) falls in the {_ord_en(n)} house from {ref}."
        if key == "LAGNA":
            return f"{src}'s lagna, {sign}, is the {_ord_en(n)} house from {ref}."
        if key == "MOON":
            return f"{src}'s Moon sign, {sign}, is the {_ord_en(n)} from {ref}."
        return f"{src}'s {graha} (in {sign}) falls on {dst}'s 7th house."

    ref = f"{dst} ஜாதகத்தில் ராசியிலிருந்து" if from_moon else f"{dst} ஜாதகத்தில் லக்னத்திலிருந்து"
    if key == "SEVENTH_LORD":
        return f"{src} ஜாதகத்தின் 7ஆம் அதிபதி {graha} ({sign}), {ref} {n}ஆம் இடத்தில் வருகிறது."
    if key == "LAGNA":
        return f"{src} ஜாதகத்தின் லக்னம் {sign}, {ref} {n}ஆம் இடம்."
    if key == "MOON":
        return f"{src} ஜாதகத்தின் ராசி {sign}, {ref} {n}ஆம் இடம்."
    return f"{src} ஜாதகத்தின் {graha} ({sign}), {dst} ஜாதகத்தின் 7ஆம் இடத்தில் வருகிறது."


def tone(o: Any) -> Tone:
    n, _ = _house(o)
    status = _get(o, "status", "status")
    if status == "SUPPORT" or n == 11:
        return "favourable"
    if status == "NOTE":
        return "ask"
    return "neutral"


def badge(o: Any, lang: str) -> str:
    n, _ = _house(o)
    lg = "ta" if lang == "ta" else "en"
    meaning = _HOUSE_MEANING.get(n, ("", ""))[1 if lg == "ta" else 0]
    return f"{meaning} ({_TONE_WORD[lg][tone(o)]})"
