from __future__ import annotations

# P2-05 CLOSED, 2026-08-18. The question this TODO asked — overlay it in Jadhagam, or keep
# it internal? — was already answered by a shipped surface nobody updated the note for:
# `dashboard-vargas-panel.tsx` renders it under `equal_bhava_title`, and deliberately shows
# only the grahas whose bhava differs from their rasi.
#
# That "only the differences" framing is the doctrine, not a space saving. The primary
# interpretive engine is whole-sign (DOCTRINE §6, rulebook CORE-04), so a full second house
# grid beside the rasi chart would offer the reader two contradictory house numbers for the
# same graha with no way to tell which one the app's own text used. A short list of the
# grahas that move, labelled a secondary lens, asks a question; a parallel chart answers it
# wrongly. Sripati/chalit proper is still unimplemented — the label says equal bhava because
# that is what this computes.


def compute_equal_bhava(
    lagna_longitude: float,
    planet_longitudes: dict[str, float],
) -> dict[str, int]:
    """
    Equal houses from the Lagna degree. NOT Sripati chalit — each house is a
    fixed 30 degrees from the Lagna cusp, with no bhava madhya/sandhi
    trisection. Primary interpretation in this product remains whole-sign
    (rasi-as-bhava) per Doctrine §6; this is a secondary lens for
    bhava-strength questions only.
    Returns {planet: house_1_to_12}.
    """
    lagna = lagna_longitude % 360.0
    result: dict[str, int] = {}
    for planet, raw_lon in planet_longitudes.items():
        lon = raw_lon % 360.0
        rel = (lon - lagna) % 360.0
        result[planet] = int(rel // 30.0) + 1
    return result
