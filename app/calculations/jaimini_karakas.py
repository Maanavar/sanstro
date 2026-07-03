from __future__ import annotations

# Jaimini Chara Karakas (BPHS Ch. 32) — the 8 grahas SUN..SATURN + RAHU are ranked
# by descending degree-within-sign (0-30 deg); the highest gets ATMAKARAKA ("soul
# significator"), down to DAARAKARAKA. KETU is excluded — this is the standard
# 8-karaka scheme, not the 7-karaka variant some texts use (which drops
# Daarakaraka and folds spouse significations into another karaka).
#
# Documented conventions (per this project's own precedent of naming such
# choices explicitly — see aspects.py, ashtakavarga.py):
#   - RAHU's degree is counted forward (0-30 in its own sign, same direction as
#     the other 7 grahas), not reversed. Some sources reverse Rahu's motion for
#     Jaimini purposes; this project does not, matching common Tamil practice.
#   - Ties (two grahas at the exact same degree-within-sign) are vanishingly
#     rare with real ephemeris data. When they occur, the earlier graha in
#     classical dignity order (Sun > Moon > Mars > Mercury > Jupiter > Venus >
#     Saturn > Rahu) keeps the higher karaka — a documented tie-break, not an
#     accident of dict ordering.
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


def compute_char_karakas(planet_longitudes: Mapping[str, float]) -> dict[str, str]:
    """Rank SUN..SATURN + RAHU by descending degree-within-sign into the 8 Chara Karakas."""
    candidates = [
        (planet, planet_longitudes[planet] % 30.0)
        for planet in _KARAKA_CANDIDATES
        if planet in planet_longitudes
    ]
    ranked = sorted(candidates, key=lambda item: item[1], reverse=True)
    return {karaka: planet for karaka, (planet, _degree) in zip(CHARA_KARAKA_ORDER, ranked)}


def compute_karakamsa(atmakaraka: str, d9_rasi_map: Mapping[str, int]) -> int:
    """Karakamsa = the D9 (navamsa) rasi occupied by the Atmakaraka."""
    return d9_rasi_map[atmakaraka]
