from __future__ import annotations

# Jaimini Chara Karakas (BPHS Ch. 32) — the 8 grahas SUN..SATURN + RAHU are ranked
# by descending effective degree-within-sign (0-30 deg); the highest gets
# ATMAKARAKA ("soul significator"), down to DAARAKARAKA. KETU is excluded — the
# 8-karaka scheme (Sun..Saturn + Rahu) is the ratified default (Doctrine §4,
# Rao/Rath mainstream for Chara Karakas), not the 7-karaka (planets-only)
# variant some texts use (which drops Daarakaraka and folds spouse
# significations into another karaka). This is now doctrine, not accident.
#
# Documented conventions (per this project's own precedent of naming such
# choices explicitly — see aspects.py, ashtakavarga.py):
#   - RAHU's effective degree = 30 - (degrees traversed in its rasi), i.e. its
#     degree is counted in REVERSE (WI-09, Doctrine §4). Rahu's perpetual
#     retrograde motion is the doctrinal basis: BPHS commentarial tradition,
#     K.N. Rao, Sanjay Rath, and JHora all reverse it. The previous
#     forward-counting convention was a minority reading that silently
#     produces different Atmakaraka/Amatyakaraka assignments from every
#     reference chart a knowledgeable user checks.
#   - Ties (two grahas at the exact same effective degree-within-sign) are
#     vanishingly rare with real ephemeris data. When they occur, the earlier
#     graha in classical dignity order (Sun > Moon > Mars > Mercury > Jupiter >
#     Venus > Saturn > Rahu) keeps the higher karaka — a documented tie-break,
#     not an accident of dict ordering.
from collections.abc import Mapping

CHARA_KARAKA_ORDER: list[str] = [
    "ATMAKARAKA",
    "AMATYAKARAKA",
    "BHRATRUKARAKA",
    "MATRUKARAKA",
    "PITRUKARAKA",
    "PUTRAKARAKA",
    "GNATIKARAKA",
    "DAARAKARAKA",
]

_KARAKA_CANDIDATES: tuple[str, ...] = (
    "SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN", "RAHU",
)


def _karaka_degree(planet: str, longitude: float) -> float:
    """Effective degree-within-sign for Chara Karaka ranking. Rahu's degree is
    reversed (30 - advancement) per its perpetual retrograde motion (WI-09,
    Doctrine §4); all other grahas count forward as usual."""
    deg = longitude % 30.0
    return 30.0 - deg if planet == "RAHU" else deg


def compute_char_karakas(planet_longitudes: Mapping[str, float]) -> dict[str, str]:
    """Rank SUN..SATURN + RAHU by descending effective degree-within-sign
    (Rahu reversed) into the 8 Chara Karakas."""
    candidates = [
        (planet, _karaka_degree(planet, planet_longitudes[planet]))
        for planet in _KARAKA_CANDIDATES
        if planet in planet_longitudes
    ]
    ranked = sorted(candidates, key=lambda item: item[1], reverse=True)

    # A 7-graha map that is missing RAHU is the one shape where truncating below
    # silently converts the ratified 8-karaka scheme into the 7-karaka variant
    # this module explicitly rejects: DAARAKARAKA would just be absent, and the
    # spouse significations it carries would vanish from the reading with no
    # error anywhere. Refuse it rather than answer wrongly.
    if len(ranked) == len(_KARAKA_CANDIDATES) - 1 and not any(
        planet == "RAHU" for planet, _degree in ranked
    ):
        raise ValueError(
            "Chara Karakas need RAHU: a Sun..Saturn-only map would silently drop "
            "DAARAKARAKA and produce the 7-karaka variant (Doctrine §4)."
        )

    # strict=False is deliberate. Callers may legitimately pass a partial
    # longitude map — the Rahu-reversal and tie-break tests each probe with two
    # or three grahas — and ranking what you were given is the intended
    # behaviour there. Production callers (app/api/charts.py,
    # app/reasoning/chart_signature.py) always supply all 8, so the guard above
    # is what covers the case where truncation would change doctrine.
    return {
        karaka: planet
        for karaka, (planet, _degree) in zip(CHARA_KARAKA_ORDER, ranked, strict=False)
    }


def compute_karakamsa(atmakaraka: str, d9_rasi_map: Mapping[str, int]) -> int:
    """Karakamsa = the D9 (navamsa) rasi occupied by the Atmakaraka."""
    return d9_rasi_map[atmakaraka]
