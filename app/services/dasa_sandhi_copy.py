"""FAA-31 copy for the server-rendered PDF.

A line-for-line mirror of ``web/lib/dasa-sandhi-copy.ts`` (the source of
truth). ``tests/golden/dasa_sandhi/dasa_sandhi_copy.json`` is generated from
the web functions; the web test and ``tests/test_faa31_dasa_sandhi_surface.py``
both reproduce every line.

Describes and times only (spec §0.4): no score, no dosham, no parihara, no
veto on the match, nothing about widowhood or lifespan (EC-RULING-06).
"""
from __future__ import annotations

from typing import Any

from app.calculations.display_names import planet_en, planet_ta

#: The same fraction of the Julian year the engine bands with, so a printed gap
#: agrees with the band it came from.
DAYS_PER_MONTH = 365.25 / 12

HEADING = {
    "en": "When each chart's mahadasa changes",
    "ta": "மகாதசை மாறும் காலங்கள்",
}
INTRO = {
    "en": (
        "A mahadasa is a long planetary period, and the handover from one to the next is called dasa "
        "sandhi. One matching practice looks at whether both partners' handovers fall close together in "
        "the years after marriage, and reads that as a period of change for both at once. We list the "
        "dates here so your astrologer can read them against the two charts. This is that practice's way "
        "of looking, not a rule from the classical texts; it is not a dosham, it changes no score, and it "
        "says nothing about whether to marry."
    ),
    "ta": (
        "மகாதசை என்பது ஒரு நீண்ட கிரக காலம்; ஒன்று முடிந்து அடுத்தது தொடங்கும் இடைவெளியைத் தசா சந்தி "
        "என்பார்கள். திருமணத்திற்குப் பிறகு இருவருக்கும் இந்த மாற்றங்கள் அருகருகே வருகிறதா என்று பார்க்கும் "
        "ஒரு பொருத்த வழக்கம் உண்டு; அப்படி வந்தால் இருவருக்கும் ஒரே நேரத்தில் மாற்றங்கள் நிறைந்த காலம் "
        "என்று அது படிக்கிறது. ஜோதிடர் இரு ஜாதகங்களுடன் சேர்த்துப் பார்க்க அந்தத் தேதிகளை இங்கே தந்துள்ளோம். "
        "இது அந்த வழக்கத்தின் பார்வை; சாஸ்திர விதி அல்ல. இது தோஷம் அல்ல, மதிப்பெண்ணை மாற்றாது, திருமணம் "
        "செய்யலாமா என்பதைப் பற்றி எதுவும் சொல்லவில்லை."
    ),
}
NOTE = {
    "en": (
        "These are dates to read, not a finding against the match. A mahadasa change is a period of "
        "change in anyone's life, and both charts keep running their own periods either way. Nothing here "
        "is a dosham, and there is no remedy to buy for it."
    ),
    "ta": (
        "இவை படிக்க வேண்டிய தேதிகள்; பொருத்தத்திற்கு எதிரான குறிப்பு அல்ல. மகாதசை மாற்றம் யாருடைய "
        "வாழ்க்கையிலும் மாற்றங்கள் நிறைந்த காலம்; எப்படியிருந்தாலும் இரு ஜாதகங்களும் அவற்றின் சொந்தக் "
        "காலங்களைத் தொடர்ந்து நடத்தும். இங்கு எதுவும் தோஷம் அல்ல; இதற்காக வாங்க வேண்டிய பரிகாரமும் இல்லை."
    ),
}


def _g(o: Any, snake: str, camel: str) -> Any:
    """Field access that works for both a camelCase dict (the golden file,
    generated from the web functions) and a snake_case pydantic object (what
    the PDF passes)."""
    if isinstance(o, dict):
        return o.get(camel, o.get(snake))
    return getattr(o, snake)


def _d(o: Any, snake: str, camel: str) -> str:
    """A date field as an ISO string, from either shape."""
    v = _g(o, snake, camel)
    return v.isoformat() if hasattr(v, "isoformat") else str(v)


def _planet(key: str, lang: str) -> str:
    return planet_en(key) if lang == "en" else planet_ta(key)


def months(days: float, lang: str) -> str:
    """A day count as months, to one decimal. Mirrors ``sandhiMonths``."""
    m = abs(days) / DAYS_PER_MONTH
    n = f"{m:.1f}"
    if n.endswith(".0"):
        n = n[:-2]
    if lang == "ta":
        return f"{n} மாதம்"
    return f"{n} {'month' if n == '1' else 'months'}"


def band_line(d: Any, lang: str) -> str:
    """The couple's summary line. ``band`` None = nothing flagged."""
    band = _g(d, "band", "band")
    horizon_years = _g(d, "horizon_years", "horizonYears")
    if band == "CLOSE":
        return (
            "The two mahadasa changes fall close together, under six months apart. Read them alongside "
            "each whole chart with your astrologer."
            if lang == "en"
            else "இரு மகாதசை மாற்றங்களும் அருகருகே — ஆறு மாதத்திற்கு உள்ளாகவே — வருகின்றன. ஒவ்வொரு "
            "ஜாதகத்தையும் முழுமையாகப் பார்த்து ஜோதிடரிடம் இவற்றைச் சேர்த்துக் கேளுங்கள்."
        )
    if band == "NEAR":
        return (
            "The two mahadasa changes fall near each other, between six and twelve months apart. Read "
            "them alongside the individual charts."
            if lang == "en"
            else "இரு மகாதசை மாற்றங்களும் ஆறு முதல் பன்னிரண்டு மாதங்களுக்குள், ஒன்றுக்கொன்று அருகில் "
            "வருகின்றன. தனித்தனி ஜாதகங்களுடன் சேர்த்து இவற்றைப் பாருங்கள்."
        )
    if lang == "en":
        return (
            f"No two mahadasa changes fall within twelve months of each other in the next "
            f"{horizon_years} years."
        )
    return (
        f"அடுத்த {horizon_years} ஆண்டுகளில் இரு மகாதசை மாற்றங்களும் பன்னிரண்டு மாதங்களுக்கு உள்ளாக "
        f"அருகருகே வருவதில்லை."
    )


def horizon(d: Any, lang: str) -> str:
    years = _g(d, "horizon_years", "horizonYears")
    a, b = _d(d, "horizon_start", "horizonStart"), _d(d, "horizon_end", "horizonEnd")
    if lang == "en":
        return f"Taken over the next {years} years ({a} to {b})."
    return f"அடுத்த {years} ஆண்டுகளுக்கு ({a} முதல் {b} வரை) எடுக்கப்பட்டது."


def pair_line(p: Any, name_a: str, name_b: str, lang: str) -> str:
    """One pair: each partner's handover, then the gap the band came from."""
    a = f"{_planet(_g(p, 'outgoing_a', 'outgoingA'), lang)} → {_planet(_g(p, 'incoming_a', 'incomingA'), lang)}"
    b = f"{_planet(_g(p, 'outgoing_b', 'outgoingB'), lang)} → {_planet(_g(p, 'incoming_b', 'incomingB'), lang)}"
    gap = months(_g(p, "change_gap_days", "changeGapDays"), lang)
    ca, cb = _d(p, "change_a", "changeA"), _d(p, "change_b", "changeB")
    if lang == "en":
        return f"{name_a}: {a} on {ca}. {name_b}: {b} on {cb}. The two changes are {gap} apart."
    return f"{name_a}: {ca} அன்று {a}. {name_b}: {cb} அன்று {b}. இரு மாற்றங்களுக்கும் இடையே {gap}."


def window_line(p: Any, lang: str) -> str:
    """The supplementary window measure. It never decides the band (spec §0.2).

    It **restates** the primary gap: with a six-month span either side, the
    overlap is exactly twelve months minus the change-point gap, so on the
    ruled configuration a flagged pair's windows always overlap and this line
    adds no information. The copy says so. The "apart" branch is unreachable
    while the window is A_FIXED +/- 6 months; it is kept for the other options.
    """
    gap = months(_g(p, "window_gap_days", "windowGapDays"), lang)
    spans = (
        f"{_d(p, 'window_a_start', 'windowAStart')} – {_d(p, 'window_a_end', 'windowAEnd')}, "
        f"{_d(p, 'window_b_start', 'windowBStart')} – {_d(p, 'window_b_end', 'windowBEnd')}"
    )
    if _g(p, "windows_overlap", "windowsOverlap"):
        if lang == "en":
            return (
                f"Seen as spans — six months either side of each change ({spans}) — they overlap "
                f"by {gap}. That restates the gap above rather than adding to it: with a six-month span, "
                f"the overlap is always twelve months less the gap."
            )
        return (
            f"காலப்பகுதிகளாகப் பார்த்தால் — ஒவ்வொரு மாற்றத்துக்கும் இருபுறமும் ஆறு மாதம் ({spans}) — "
            f"இவை {gap} ஒன்றையொன்று மறைக்கின்றன. இது மேலே உள்ள இடைவெளியையே வேறு வகையில் சொல்கிறது, "
            f"கூடுதல் தகவல் அல்ல: ஆறு மாதக் கணக்கில் இந்த மறைவு எப்போதும் பன்னிரண்டு மாதத்தில் அந்த "
            f"இடைவெளியைக் கழித்ததே."
        )
    if lang == "en":
        return (
            f"Seen as spans — six months either side of each change ({spans}) — they stay "
            f"{gap} apart."
        )
    return (
        f"காலப்பகுதிகளாகப் பார்த்தால் — ஒவ்வொரு மாற்றத்துக்கும் இருபுறமும் ஆறு மாதம் ({spans}) — "
        f"இவற்றுக்கு இடையே {gap} இடைவெளி உள்ளது."
    )
