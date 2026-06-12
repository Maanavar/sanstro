"""Friendship compatibility — Feature 4 (public, no-auth tool).

Reuses the existing porutham (kuta) computation but reframes it as a *friendship*
report. Marriage-specific kutas (Rajju, Vedha) are removed. The output is always
positively framed — see the framing rules in GROWTH_FEATURES.md:

- Never output "incompatible", "avoid", "bad match", "not suitable", "failed".
- Every section contains at least one positive statement.
- The final "Growth Together" section is always uplifting.
- Raw kuta percentages are never surfaced — only band labels.
"""
from __future__ import annotations

from app.calculations.porutham import compute_porutham

# Kutas that belong to the marriage frame and are dropped for friendship.
_EXCLUDED_KUTAS = {"RAJJU", "VEDHA"}


def _band(pct: float) -> dict:
    if pct >= 80:
        return {"key": "NATURAL_COMPANIONS", "ta": "இயல்பான தோழர்கள்", "en": "Natural Companions"}
    if pct >= 60:
        return {"key": "COMPLEMENTARY_PAIR", "ta": "ஒன்றுக்கொன்று நிறைவு", "en": "Complementary Pair"}
    if pct >= 40:
        return {"key": "GROWTH_FRIENDS", "ta": "வளரும் நட்பு", "en": "Growth Friends"}
    return {"key": "COSMIC_TEACHERS", "ta": "வான் ஆசான்கள்", "en": "Cosmic Teachers"}


def _bi(ta: str, en: str) -> dict:
    return {"ta": ta, "en": en}


def get_friendship_report(p1: dict, p2: dict) -> dict:
    """p1/p2: {name, nakshatra:int, nakshatra_name:str, rasi:int, rasi_name:str}."""
    result = compute_porutham(
        boy_nakshatra=p1["nakshatra"],
        girl_nakshatra=p2["nakshatra"],
        boy_rasi=p1["rasi"],
        girl_rasi=p2["rasi"],
    )

    # Friendship score: all kutas except the marriage-only ones, normalised 0–100.
    kept = [k for k in result.kutas if k.name.upper() not in _EXCLUDED_KUTAS]
    earned = sum(k.score for k in kept)
    possible = sum(k.max_score for k in kept) or 1
    pct = round(earned / possible * 100)
    band = _band(pct)

    n1, n2 = p1["name"] or "Friend 1", p2["name"] or "Friend 2"

    def kuta_score(*needles: str) -> float:
        for k in kept:
            if any(nd in k.name.upper() for nd in needles):
                return k.score / (k.max_score or 1)
        return 0.5

    gana = kuta_score("GANA")
    rasi = kuta_score("RASI", "BHAKOOT")
    nadi = kuta_score("NADI")
    yoni = kuta_score("YONI")

    cosmic = band["key"] == "COSMIC_TEACHERS"

    sections = [
        {
            "key": "communication",
            "title": _bi("தொடர்பு பாணி", "Communication Style"),
            "text": _bi(
                f"{n1} மற்றும் {n2} இடையே கருத்துப் பரிமாற்றம் இயல்பாக நடக்கும். "
                + ("சில சமயம் வெவ்வேறு பார்வைகள் வரும் — அதுவே உரையாடலை வளமாக்கும்." if rasi < 0.6 else "ஒத்த அலைவரிசை உங்கள் உரையாடலை எளிதாக்குகிறது."),
                f"{n1} and {n2} can talk things through naturally. "
                + ("Different viewpoints will surface at times — that is exactly what keeps the conversation rich." if rasi < 0.6 else "A shared wavelength makes your conversations easy and warm."),
            ),
        },
        {
            "key": "trust",
            "title": _bi("நம்பிக்கையும் விசுவாசமும்", "Trust & Loyalty"),
            "text": _bi(
                "ஒருவருக்கொருவர் நம்பிக்கையை வளர்க்கும் தன்மை இந்த நட்பில் உண்டு. "
                + ("காலப்போக்கில் இந்த நம்பிக்கை இன்னும் ஆழமாகும்." if nadi < 0.6 else "ஆழமான விசுவாசம் இயல்பாகவே அமைகிறது."),
                "There is a real capacity here to build trust in each other. "
                + ("With time this trust only deepens." if nadi < 0.6 else "Deep loyalty comes naturally between you."),
            ),
        },
        {
            "key": "energy",
            "title": _bi("சக்தி சமநிலை", "Energy Balance"),
            "text": _bi(
                ("உங்கள் இருவரின் ஆற்றலும் ஒத்துப்போகிறது — சேர்ந்து இயங்குவது சுலபம்." if gana >= 0.6
                 else "உங்கள் ஆற்றல்கள் வேறுபட்டாலும், அவை ஒன்றையொன்று நிரப்புகின்றன."),
                ("Your energies move in sync — doing things together feels effortless." if gana >= 0.6
                 else "Your energies differ, and in doing so they complement and balance each other."),
            ),
        },
        {
            "key": "best_times",
            "title": _bi("சேர்ந்திருக்க சிறந்த நேரம்", "Best Times to Connect"),
            "text": _bi(
                f"{p1['nakshatra_name']} மற்றும் {p2['nakshatra_name']} நட்சத்திரங்களின் நாட்களில் "
                "சந்திப்புகளும் திட்டங்களும் சிறப்பாக அமையும்.",
                f"Meetings and plans tend to flow best on days ruled by the {p1['nakshatra_name']} "
                f"and {p2['nakshatra_name']} nakshatras.",
            ),
        },
        {
            "key": "growth_together",
            "title": _bi("ஒன்றாக வளர்தல்", "Growth Together"),
            "text": _bi(
                ("ஒவ்வொரு சிறந்த நட்பும் நமக்கு ஏதாவது கற்றுத்தரும். நீங்கள் இருவரும் "
                 "ஒருவரிடமிருந்து ஒருவர் வளர்ச்சியடைய நிறைய இருக்கிறது." if cosmic
                 else "உங்கள் நட்பு ஒருவரையொருவர் சிறந்தவராக்குகிறது — சேர்ந்து இன்னும் வளரலாம்."),
                ("Every great friendship teaches us something. Here's what you bring out in each other — "
                 "there is so much for you both to grow from." if cosmic
                 else "Your friendship brings out the best in each other — and there's plenty more to grow into together."),
            ),
        },
    ]

    return {
        "person1": {"name": n1, "nakshatra": p1["nakshatra_name"], "rasi": p1["rasi_name"]},
        "person2": {"name": n2, "nakshatra": p2["nakshatra_name"], "rasi": p2["rasi_name"]},
        "band": band,
        "scoreRange": (
            "80–100%" if pct >= 80 else "60–79%" if pct >= 60 else "40–59%" if pct >= 40 else "0–39%"
        ),
        "headline": (
            _bi(
                "ஒவ்வொரு சிறந்த நட்பும் நமக்கு ஏதாவது கற்றுத்தரும். நீங்கள் ஒருவரிடம் ஒருவர் வெளிக்கொணர்வது இதோ.",
                "Every great friendship teaches us something. Here's what you bring out in each other.",
            )
            if cosmic
            else _bi(
                f"{n1} & {n2} — {band['ta']}.",
                f"{n1} & {n2} — {band['en']}.",
            )
        ),
        "sections": sections,
    }
