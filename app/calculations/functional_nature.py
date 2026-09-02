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

from collections.abc import Mapping
from enum import Enum

from app.constants.astrology import SIGN_LORD


class FunctionalNature(str, Enum):  # noqa: UP042 — str-mixin enum kept; StrEnum changes str()/format() output
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
# IMPORTANT: this table is now cross-checked by `derive_functional_nature`
# (see below) and pinned by tests/test_functional_nature_derivation.py — every
# cell must match the mechanical derivation except the 1 documented expert
# override in KNOWN_FUNCTIONAL_NATURE_OVERRIDES — do NOT edit a cell without
# also updating the derivation/test.
#
# 2026-07 audit A-2 resolved two internal contradictions (Lagna 6 Jupiter vs
# Lagna 12 Mercury both owning {4,7}; Lagna 3 Jupiter vs Lagna 9 Mercury both
# owning {7,10}): Kendradhipati Dosha doctrine does not subdivide by which two
# kendras are owned, so all four cells now read KENDRA (matching the
# mechanical derivation) — see the `derive_functional_nature` comment for the
# citation. These two are no longer overrides.
# Edge cases (planet owns Trikona + Dusthana simultaneously) follow the rule:
#   Trikona+Dusthana → TRIKONA, except {5,8}/{6,9} which → NEUTRAL
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
        "MERCURY": "KENDRA",      # 7th+10th lord (Kendra+Kendra = Kendradhipati)
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
        "MERCURY": "KENDRA",      # 4th+7th lord (Kendra+Kendra = Kendradhipati)
        "JUPITER": "LAGNA_LORD",  # 1st+10th lord (Lagna+Kendra; Lagna overrides)
        "VENUS":   "DUSTHANA",    # 3rd+8th lord (Upachaya+Dusthana → Dusthana)
        "SATURN":  "DUSTHANA",    # 11th+12th lord (Upachaya+Dusthana → Dusthana)
        "RAHU":    "NEUTRAL",
        "KETU":    "NEUTRAL",
    },
}


# ── Derivation from house ownership (audit T4) ────────────────────────────────
# The 108-cell table above is hand-authored and therefore vulnerable to a silent
# typo corrupting every prediction for a lagna. `derive_functional_nature`
# recomputes each cell mechanically from house ownership + the documented
# classical overrides, and a golden test asserts the table equals the derivation
# for all cells except the small, explicitly-listed expert overrides below.
#
# This mirror is a *validation oracle*, not the production path — `get_functional_nature`
# still reads FUNCTIONAL_NATURE_TABLE so behaviour is unchanged. Reconciling the
# flagged inconsistencies requires astrologer sign-off (see KNOWN_FUNCTIONAL_NATURE_OVERRIDES).

# Sign → ruling planet (1=Mesha … 12=Meenam). Was a local copy to keep this module
# a dependency-light leaf, with a golden test asserting it matched
# chart_strength.SIGN_LORD. `app.constants.astrology` imports nothing, so the leaf
# property survives and the equality is structural now instead of asserted.
_SIGN_LORD: dict[int, str] = SIGN_LORD

# Planet → the set of rasis it rules (Rahu/Ketu own none). Accumulated in a
# mutable dict and frozen into the public one, rather than built in place and
# frozen over itself — same result, and the intermediate no longer has to
# pretend to already hold frozensets.
_owned_rasis: dict[str, set[int]] = {}
for _rasi, _lord in _SIGN_LORD.items():
    _owned_rasis.setdefault(_lord, set()).add(_rasi)
PLANET_OWNED_RASIS: dict[str, frozenset[int]] = {
    planet: frozenset(rasis) for planet, rasis in _owned_rasis.items()
}

_KENDRA = frozenset({4, 7, 10})
_TRIKONA = frozenset({5, 9})
_DUSTHANA = frozenset({6, 8, 12})
_MARAKA = frozenset({2, 7})
_UPACHAYA = frozenset({3, 11})


def _house_from(lagna_rasi: int, rasi: int) -> int:
    return ((rasi - lagna_rasi) % 12) + 1


# Cells where the hand-authored table intentionally diverges from the
# mechanical derivation. Each entry: (lagna, planet) → (table_value, note).
# NOT auto-reconciled — changing this alters production predictions and needs
# astrologer sign-off.
#
# 2026-07 audit A-2: this dict previously also carried (6, "JUPITER") and
# (9, "MERCURY") as a pair of internal contradictions (same house-set, {4,7}
# or {7,10}, yielding different verdicts at another lagna). Both are resolved
# — see the FUNCTIONAL_NATURE_TABLE module comment and the
# `derive_functional_nature` Kendradhipati citation — so they no longer
# diverge from the derivation and were removed from this dict.
KNOWN_FUNCTIONAL_NATURE_OVERRIDES: dict[tuple[int, str], tuple[str, str]] = {
    (1, "SATURN"): (
        "NEUTRAL",
        "10th+11th lord for Mesha: Kendra+Upachaya, treated as functional-neutral "
        "(mechanical rule yields KENDRA). Expert call, defensible.",
    ),
}


def derive_functional_nature(lagna_rasi: int, planet: str) -> FunctionalNature:
    """Mechanically derive functional nature from house ownership + classical overrides.

    Validation oracle for FUNCTIONAL_NATURE_TABLE (see module note). Rahu/Ketu
    have no ownership → NEUTRAL (dispositor logic lives in get_functional_nature).
    """
    owned = PLANET_OWNED_RASIS.get(planet)
    if not owned:
        return FunctionalNature.NEUTRAL
    houses = {_house_from(lagna_rasi, rasi) for rasi in owned}

    if 1 in houses:
        return FunctionalNature.LAGNA_LORD

    has_trikona = bool(houses & _TRIKONA)
    has_kendra = bool(houses & _KENDRA)
    has_dusthana = bool(houses & _DUSTHANA)

    if has_trikona and has_kendra:
        return FunctionalNature.YOGAKARAKA
    if has_trikona:
        if has_dusthana:
            # A trine lord keeps its benefit unless paired with the specifically
            # polluting {5,8} or {6,9} dusthana combination.
            return FunctionalNature.NEUTRAL if houses in ({5, 8}, {6, 9}) else FunctionalNature.TRIKONA
        return FunctionalNature.TRIKONA
    if has_kendra:
        if has_dusthana:
            # Kendra + dusthana → dusthana, except {7,8} (maraka-7 + dusthana-8).
            return FunctionalNature.MARAKA if houses == {7, 8} else FunctionalNature.DUSTHANA
        if 7 in houses:
            # 7th is both kendra and maraka. Pure two-kendra ownership (no
            # trikona/dusthana admixture) is Kendradhipati Dosha territory
            # regardless of *which* second kendra is owned — {4,7} and {7,10}
            # are treated the same (2026-07 audit A-2: previously only
            # {7,10} kept KENDRA while {4,7} fell to MARAKA, producing two
            # internally inconsistent table cells — see
            # KNOWN_FUNCTIONAL_NATURE_OVERRIDES history). A sole 7th lord (no
            # second kendra — only possible for Sun/Moon, which own a single
            # sign) or 7th combined with a non-kendra house (e.g. {2,7}, both
            # maraka) keeps the plain maraka reading.
            return FunctionalNature.KENDRA if houses in ({7, 10}, {4, 7}) else FunctionalNature.MARAKA
        return FunctionalNature.KENDRA
    if has_dusthana:
        return FunctionalNature.DUSTHANA
    if houses & _MARAKA:
        return FunctionalNature.MARAKA
    if houses & _UPACHAYA:
        return FunctionalNature.UPACHAYA
    return FunctionalNature.NEUTRAL


_NODES = ("RAHU", "KETU")


def owned_houses(lagna_rasi: int, planet: str) -> tuple[int, ...]:
    """Houses this graha rules counted from this lagna, ascending.

    The reason a functional nature came out as it did — `MARAKA` for Venus at
    Mesha lagna *is* "Venus rules the 2nd and the 7th", not a separate fact
    about it. Surfaces that show a verdict need this to explain one, so the
    derivation is exported rather than left inside `derive_functional_nature`.

    Empty for RAHU/KETU, which own no sign; `node_dispositor` and the occupied
    house carry their story instead (see `_node_functional_nature`).
    """
    owned = PLANET_OWNED_RASIS.get(planet)
    if not owned:
        return ()
    return tuple(sorted(_house_from(lagna_rasi, rasi) for rasi in owned))


def house_of(lagna_rasi: int, rasi: int) -> int:
    """Which house a rasi is, counted from this lagna. 1-12."""
    return _house_from(lagna_rasi, rasi)


def node_dispositor(node_rasi: int) -> str:
    """Lord of the sign a node occupies — whose nature the node borrows."""
    return _SIGN_LORD[node_rasi]


def is_dusthana_house(house: int) -> bool:
    """6th, 8th, 12th — the houses that override a node's dispositor."""
    return house in _DUSTHANA


def _node_functional_nature(lagna_rasi: int, node_rasi: int) -> FunctionalNature:
    """Functional nature of a node (audit T5).

    Classical rule: a node has no house ownership, so it behaves as (a) the
    functional nature of its **dispositor** (the lord of the sign it occupies),
    tempered by (b) the house it occupies — a node sitting in a dusthana
    (6/8/12) acts as a malefic regardless of a benefic dispositor.
    """
    occupied_house = _house_from(lagna_rasi, node_rasi)
    if occupied_house in _DUSTHANA:
        return FunctionalNature.DUSTHANA
    dispositor = _SIGN_LORD[node_rasi]
    return get_functional_nature(lagna_rasi, dispositor)


def get_functional_nature(
    lagna_rasi: int,
    planet: str,
    *,
    node_rasi_map: Mapping[str, int] | None = None,
) -> FunctionalNature:
    """Return the functional nature of a planet for a given Lagna Rasi (1–12).

    Rahu/Ketu have no house ownership. When ``node_rasi_map`` (planet → occupied
    rasi) is supplied and contains the node, its nature is resolved via
    dispositor + occupied house (`_node_functional_nature`). Without chart
    context the nodes fall back to the table default (NEUTRAL) — preserving the
    behaviour of legacy callers that pass only lagna + planet.
    """
    if planet in _NODES and node_rasi_map is not None and planet in node_rasi_map:
        return _node_functional_nature(lagna_rasi, node_rasi_map[planet])
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
