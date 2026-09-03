"""Shared astrology constant lists.

Single source of truth — import from here, never redefine locally.
"""
from __future__ import annotations

NAKSHATRA_NAMES: tuple[str, ...] = (
    "ASWINI",
    "BHARANI",
    "KARTHIGAI",
    "ROHINI",
    "MIRUGASEERIDAM",
    "THIRUVATHIRAI",
    "PUNARPOOSAM",
    "POOSAM",
    "AYILYAM",
    "MAGAM",
    "POORAM",
    "UTHIRAM",
    "HASTHAM",
    "CHITHIRAI",
    "SWATHI",
    "VISAKAM",
    "ANUSHAM",
    "KETTAI",
    "MOOLAM",
    "POORADAM",
    "UTHIRADAM",
    "THIRUVONAM",
    "AVITTAM",
    "SADAYAM",
    "POORATTATHI",
    "UTHIRATTATHI",
    "REVATHI",
)

# Traditional 7-planet sign lordship, 1=Mesha … 12=Meenam. Rahu and Ketu own no
# sign, which is why this maps to seven planets and not nine.
#
# THIS MODULE IS THE HOME BECAUSE OF WHY THE COPIES EXISTED. Seven byte-identical
# maps were spread across `chart_strength`, `conditional_dashas`,
# `functional_nature`, `ashtottari_dasha`, `chart_explanation_service`,
# `muhurta_service` and `whatif_service`. Three of them documented a real reason:
# *"kept local so this leaf module stays free of the heavier chart_strength
# import."* That reason was sound — and it argued for a lighter home, not for six
# more copies. This file imports nothing, so a leaf can take the constant without
# taking a dependency, and the tradeoff the comments described disappears.
#
# `chart_strength.SIGN_LORD` re-exports this name; a great many call sites and
# tests reach for it there, and that is the correct place to look for it when you
# are already reasoning about strength.
#
# Only two of the seven copies had an equality test. Four could have drifted
# silently, and per this repo's history domain-calc divergence does not announce
# itself — it produces a subtly wrong reading for one rasi in twelve.
SIGN_LORD: dict[int, str] = {
    1: "MARS", 2: "VENUS", 3: "MERCURY", 4: "MOON", 5: "SUN", 6: "MERCURY",
    7: "VENUS", 8: "MARS", 9: "JUPITER", 10: "SATURN", 11: "SATURN", 12: "JUPITER",
}
