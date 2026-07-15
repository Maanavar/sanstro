from __future__ import annotations

# TODO(product): decide fate — P2-05. Equal Bhava powers house assignments in chart build
# and is returned in ChartCalculateResponse.equalBhava. Decision: display it as an overlay
# or alternate view in the Jadhagam screen, or keep as internal chart-build only?
# See docs/ROADMAP_TASKS.md and AUDIT_REMEDIATION_PLAN.md P2-05.


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
