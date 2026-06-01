"""
Functional nature (Tatastha Karaka Balam) of planets by Lagna.
Source: Classical Tamil Jyothidam / Parashari doctrine.

For each Lagna, every planet is classified as:
  YOGAKARAKA — owns both a Kendra and a Trikona (most powerful benefic)
  LAGNA_LORD — owns the 1st house (always benefic)
  TRIKONA    — owns a Trikona (5th or 9th) — benefic
  KENDRA     — owns only Kendra houses (4th, 7th, 10th) — neutral (Kendradhipati)
  MARAKA     — owns 2nd or 7th — transition/caution
  DUSTHANA   — owns 6th, 8th, or 12th — malefic tendency
  UPACHAYA   — owns 3rd or 11th only — mild malefic / growing-house lord
  NEUTRAL    — mixed ownership that doesn't fall clearly into above

These classifications affect:
1. Transit score modifier (how beneficial is this planet transiting a house)
2. Dasha score modifier (how beneficial is this planet's Mahadasha/Antardasha)
"""
from __future__ import annotations
from enum import Enum


class FunctionalNature(str, Enum):
    YOGAKARAKA = "YOGAKARAKA"
    LAGNA_LORD = "LAGNA_LORD"
    TRIKONA    = "TRIKONA"
    KENDRA     = "KENDRA"
    MARAKA     = "MARAKA"
    DUSTHANA   = "DUSTHANA"
    UPACHAYA   = "UPACHAYA"
    NEUTRAL    = "NEUTRAL"


# Score modifier applied to a planet's transit contribution based on its functional nature.
# Base transit score is a generic house-quality number; this multiplier personalises it by Lagna.
FUNCTIONAL_TRANSIT_MODIFIER: dict[FunctionalNature, float] = {
    FunctionalNature.YOGAKARAKA: 1.35,
    FunctionalNature.LAGNA_LORD: 1.20,
    FunctionalNature.TRIKONA:    1.15,
    FunctionalNature.KENDRA:     0.90,
    FunctionalNature.NEUTRAL:    1.00,
    FunctionalNature.MARAKA:     0.85,
    FunctionalNature.UPACHAYA:   0.85,
    FunctionalNature.DUSTHANA:   0.65,
}

# Score modifier applied to a planet's Dasha period score based on functional nature.
FUNCTIONAL_DASHA_MODIFIER: dict[FunctionalNature, float] = {
    FunctionalNature.YOGAKARAKA: 1.40,
    FunctionalNature.LAGNA_LORD: 1.25,
    FunctionalNature.TRIKONA:    1.20,
    FunctionalNature.KENDRA:     0.90,
    FunctionalNature.NEUTRAL:    1.00,
    FunctionalNature.MARAKA:     0.80,
    FunctionalNature.UPACHAYA:   0.85,
    FunctionalNature.DUSTHANA:   0.60,
}


# Functional nature by Lagna (1=Mesha ... 12=Meenam) and planet.
# Derived from house ownership using house_from(lagna_rasi, planet_owned_rasi).
# Rahu/Ketu have no house ownership — default NEUTRAL; caller may use dispositor logic.
#
# IMPORTANT: Verify against a Tamil Jyothidam reference before production use.
# Edge cases (planet owns Trikona + Dusthana simultaneously) follow the rule:
#   Trikona+Dusthana → NEUTRAL (pollution reduces pure benefit)
#   Trikona+Kendra   → YOGAKARAKA
#   Lagna lordship   → always LAGNA_LORD regardless of other ownership
FUNCTIONAL_NATURE_TABLE: dict[int, dict[str, str]] = {
    1: {  # Mesha Lagna — Mars rules 1st+8th; Sun rules 5th; Venus rules 2nd+7th; Saturn rules 10th+11th
        "SUN":     "TRIKONA",     # 5th lord
        "MOON":    "KENDRA",      # 4th lord (Kadagam)
        "MARS":    "LAGNA_LORD",  # 1st+8th lord (Lagna overrides)
        "MERCURY": "DUSTHANA",    # 3rd+6th lord
        "JUPITER": "TRIKONA",     # 9th+12th lord (9th=Trikona overrides 12th=Dusthana)
        "VENUS":   "MARAKA",      # 2nd+7th lord (both Maraka houses)
        "SATURN":  "NEUTRAL",     # 10th+11th lord (Kendra+Upachaya — mixed)
        "RAHU":    "NEUTRAL",
        "KETU":    "NEUTRAL",
    },
    2: {  # Rishabam Lagna — Venus rules 1st+6th; Saturn rules 9th+10th; Mercury rules 2nd+5th
        "SUN":     "KENDRA",      # 4th lord (Simmam)
        "MOON":    "UPACHAYA",    # 3rd lord (Kadagam)
        "MARS":    "DUSTHANA",    # 7th+12th lord (Maraka+Dusthana → Dusthana)
        "MERCURY": "TRIKONA",     # 2nd+5th lord (5th=Trikona; 2nd adds Dhana quality)
        "JUPITER": "DUSTHANA",    # 8th+11th lord (Dusthana+Upachaya → Dusthana)
        "VENUS":   "LAGNA_LORD",  # 1st+6th lord (Lagna overrides 6th)
        "SATURN":  "YOGAKARAKA",  # 9th+10th lord (Trikona+Kendra = Yogakaraka)
        "RAHU":    "NEUTRAL",
        "KETU":    "NEUTRAL",
    },
    3: {  # Mithunam Lagna — Mercury rules 1st+4th; Venus rules 5th+12th; Saturn rules 9th+8th
        "SUN":     "UPACHAYA",    # 3rd lord (Simmam)
        "MOON":    "MARAKA",      # 2nd lord (Kadagam)
        "MARS":    "DUSTHANA",    # 6th+11th lord (Dusthana+Upachaya → Dusthana)
        "MERCURY": "LAGNA_LORD",  # 1st+4th lord (Lagna+Kendra; Lagna overrides)
        "JUPITER": "KENDRA",      # 7th+10th lord (Kendra+Kendra = Kendradhipati)
        "VENUS":   "TRIKONA",     # 5th+12th lord (5th=Trikona overrides 12th=Dusthana)
        "SATURN":  "TRIKONA",     # 9th+8th lord (9th=Trikona overrides 8th=Dusthana)
        "RAHU":    "NEUTRAL",
        "KETU":    "NEUTRAL",
    },
    4: {  # Kadagam Lagna — Moon rules 1st; Mars rules 5th+10th; Saturn rules 7th+8th
        "SUN":     "MARAKA",      # 2nd lord (Simmam)
        "MOON":    "LAGNA_LORD",  # 1st lord
        "MARS":    "YOGAKARAKA",  # 5th+10th lord (Trikona+Kendra = Yogakaraka)
        "MERCURY": "DUSTHANA",    # 3rd+12th lord (Upachaya+Dusthana → Dusthana)
        "JUPITER": "NEUTRAL",     # 6th+9th lord (Dusthana+Trikona = mixed → Neutral)
        "VENUS":   "KENDRA",      # 4th+11th lord (Kendra+Upachaya → Kendra)
        "SATURN":  "MARAKA",      # 7th+8th lord (Maraka+Dusthana → Maraka)
        "RAHU":    "NEUTRAL",
        "KETU":    "NEUTRAL",
    },
    5: {  # Simmam Lagna — Sun rules 1st; Mars rules 4th+9th; Saturn rules 6th+7th
        "SUN":     "LAGNA_LORD",  # 1st lord
        "MOON":    "DUSTHANA",    # 12th lord (Kadagam=12th from Simmam)
        "MARS":    "YOGAKARAKA",  # 4th+9th lord (Kendra+Trikona = Yogakaraka)
        "MERCURY": "MARAKA",      # 2nd+11th lord (Maraka+Upachaya → Maraka)
        "JUPITER": "NEUTRAL",     # 5th+8th lord (Trikona+Dusthana = mixed → Neutral)
        "VENUS":   "KENDRA",      # 3rd+10th lord (Kendra with Upachaya; 10th=Kendra dominates)
        "SATURN":  "DUSTHANA",    # 6th+7th lord (Dusthana+Maraka → Dusthana)
        "RAHU":    "NEUTRAL",
        "KETU":    "NEUTRAL",
    },
    6: {  # Kanni Lagna — Mercury rules 1st+10th; Venus rules 2nd+9th; Saturn rules 5th+6th
        "SUN":     "DUSTHANA",    # 12th lord (Simmam=12th from Kanni)
        "MOON":    "UPACHAYA",    # 11th lord (Kadagam=11th from Kanni)
        "MARS":    "DUSTHANA",    # 3rd+8th lord (Upachaya+Dusthana → Dusthana)
        "MERCURY": "LAGNA_LORD",  # 1st+10th lord (Lagna+Kendra; Lagna overrides)
        "JUPITER": "KENDRA",      # 4th+7th lord (Kendra+Kendra = Kendradhipati)
        "VENUS":   "TRIKONA",     # 2nd+9th lord (9th=Trikona; 2nd adds Dhana quality)
        "SATURN":  "TRIKONA",     # 5th+6th lord (5th=Trikona overrides 6th=Dusthana)
        "RAHU":    "NEUTRAL",
        "KETU":    "NEUTRAL",
    },
    7: {  # Thulam Lagna — Venus rules 1st+8th; Saturn rules 4th+5th; Jupiter rules 3rd+6th
        "SUN":     "UPACHAYA",    # 11th lord (Simmam=11th from Thulam)
        "MOON":    "KENDRA",      # 10th lord (Kadagam=10th from Thulam)
        "MARS":    "MARAKA",      # 2nd+7th lord (both Maraka houses)
        "MERCURY": "TRIKONA",     # 9th+12th lord (9th=Trikona overrides 12th=Dusthana)
        "JUPITER": "DUSTHANA",    # 3rd+6th lord (Upachaya+Dusthana → Dusthana)
        "VENUS":   "LAGNA_LORD",  # 1st+8th lord (Lagna overrides 8th)
        "SATURN":  "YOGAKARAKA",  # 4th+5th lord (Kendra+Trikona = Yogakaraka)
        "RAHU":    "NEUTRAL",
        "KETU":    "NEUTRAL",
    },
    8: {  # Viruchigam Lagna — Mars rules 1st+6th; Jupiter rules 2nd+5th; Venus rules 7th+12th
        "SUN":     "KENDRA",      # 10th lord (Simmam=10th from Viruchigam)
        "MOON":    "TRIKONA",     # 9th lord (Kadagam=9th from Viruchigam)
        "MARS":    "LAGNA_LORD",  # 1st+6th lord (Lagna overrides 6th)
        "MERCURY": "DUSTHANA",    # 8th+11th lord (Dusthana+Upachaya → Dusthana)
        "JUPITER": "TRIKONA",     # 2nd+5th lord — 5th=Trikona dominates Maraka; Parashari doctrine
        "VENUS":   "DUSTHANA",    # 7th+12th lord (Maraka+Dusthana → Dusthana)
        "SATURN":  "KENDRA",      # 3rd+4th lord (Upachaya+Kendra → Kendra)
        "RAHU":    "NEUTRAL",
        "KETU":    "NEUTRAL",
    },
    9: {  # Dhanusu Lagna — Jupiter rules 1st+4th; Sun rules 9th; Saturn rules 2nd+3rd
        "SUN":     "TRIKONA",     # 9th lord (Simmam=9th from Dhanusu)
        "MOON":    "DUSTHANA",    # 8th lord (Kadagam=8th from Dhanusu)
        "MARS":    "TRIKONA",     # 5th+12th lord (5th=Trikona overrides 12th=Dusthana)
        "MERCURY": "NEUTRAL",     # 7th+10th lord (Kendra+Kendra = Kendradhipati → Neutral)
        "JUPITER": "LAGNA_LORD",  # 1st+4th lord (Lagna+Kendra; Lagna overrides)
        "VENUS":   "DUSTHANA",    # 6th+11th lord (Dusthana+Upachaya → Dusthana)
        "SATURN":  "MARAKA",      # 2nd+3rd lord (Maraka+Upachaya → Maraka)
        "RAHU":    "NEUTRAL",
        "KETU":    "NEUTRAL",
    },
    10: {  # Magaram Lagna — Saturn rules 1st+2nd; Venus rules 5th+10th; Mars rules 4th+11th
        "SUN":     "DUSTHANA",    # 8th lord (Simmam=8th from Magaram)
        "MOON":    "MARAKA",      # 7th lord (Kadagam=7th from Magaram)
        "MARS":    "KENDRA",      # 4th+11th lord (Kendra+Upachaya → Kendra)
        "MERCURY": "NEUTRAL",     # 6th+9th lord (Trikona+Dusthana = mixed → Neutral, same rule as Kadagam Jupiter)
        "JUPITER": "DUSTHANA",    # 3rd+12th lord (Upachaya+Dusthana → Dusthana)
        "VENUS":   "YOGAKARAKA",  # 5th+10th lord (Trikona+Kendra = Yogakaraka)
        "SATURN":  "LAGNA_LORD",  # 1st+2nd lord (Lagna overrides)
        "RAHU":    "NEUTRAL",
        "KETU":    "NEUTRAL",
    },
    11: {  # Kumbam Lagna — Saturn rules 1st+12th; Venus rules 4th+9th; Jupiter rules 2nd+11th
        "SUN":     "MARAKA",      # 7th lord (Simmam=7th from Kumbam)
        "MOON":    "DUSTHANA",    # 6th lord (Kadagam=6th from Kumbam)
        "MARS":    "KENDRA",      # 3rd+10th lord (Kendra with Upachaya; 10th=Kendra dominates)
        "MERCURY": "NEUTRAL",     # 5th+8th lord (Trikona+Dusthana = mixed → Neutral)
        "JUPITER": "MARAKA",      # 2nd+11th lord (Maraka+Upachaya → Maraka tendency)
        "VENUS":   "YOGAKARAKA",  # 4th+9th lord (Kendra+Trikona = Yogakaraka)
        "SATURN":  "LAGNA_LORD",  # 1st+12th lord (Lagna overrides 12th)
        "RAHU":    "NEUTRAL",
        "KETU":    "NEUTRAL",
    },
    12: {  # Meenam Lagna — Jupiter rules 1st+10th; Mars rules 2nd+9th; Venus rules 3rd+8th
        "SUN":     "DUSTHANA",    # 6th lord (Simmam=6th from Meenam)
        "MOON":    "TRIKONA",     # 5th lord (Kadagam=5th from Meenam)
        "MARS":    "TRIKONA",     # 2nd+9th lord (9th=Trikona; 2nd adds Dhana quality → Trikona)
        "MERCURY": "MARAKA",      # 4th+7th lord (Kendra+Maraka → Maraka)
        "JUPITER": "LAGNA_LORD",  # 1st+10th lord (Lagna+Kendra; Lagna overrides)
        "VENUS":   "DUSTHANA",    # 3rd+8th lord (Upachaya+Dusthana → Dusthana)
        "SATURN":  "DUSTHANA",    # 11th+12th lord (Upachaya+Dusthana → Dusthana)
        "RAHU":    "NEUTRAL",
        "KETU":    "NEUTRAL",
    },
}


def get_functional_nature(lagna_rasi: int, planet: str) -> FunctionalNature:
    """Return the functional nature of a planet for a given Lagna Rasi (1–12)."""
    row = FUNCTIONAL_NATURE_TABLE.get(lagna_rasi, {})
    nature_str = row.get(planet, "NEUTRAL")
    return FunctionalNature(nature_str)


def get_transit_modifier(lagna_rasi: int, planet: str) -> float:
    """Multiplier applied to a planet's transit contribution based on its functional nature for this Lagna."""
    nature = get_functional_nature(lagna_rasi, planet)
    return FUNCTIONAL_TRANSIT_MODIFIER[nature]


def get_dasha_modifier(lagna_rasi: int, planet: str) -> float:
    """Multiplier applied to a planet's Dasha score based on its functional nature for this Lagna."""
    nature = get_functional_nature(lagna_rasi, planet)
    return FUNCTIONAL_DASHA_MODIFIER[nature]
