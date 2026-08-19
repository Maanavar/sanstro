"""
Ashtakavarga (Bhinnashtakavarga) bindu calculation.
Source: Formula Engine Spec §9.1-9.4, Thirukanitham / Brihat Parashara tradition.

BAV_TABLE[planet][reference_point] = list of houses (from that reference point's Rasi)
that contribute 1 bindu when the planet transits there.

P2-05 RULING, 2026-08-18 — the bindu grid is APPROVED for the Jadhagam screen, and the
boundary it must respect is why this note replaced the open question rather than answering
it in a roadmap row.

**A bindu grid states a count. It never states a subject.**

What this module returns is a measurement, in the same sense a graha's longitude is one. It
is part of a chart's face — printed beside the rasi and navamsa charts in any almanac — and
an astrologer inspecting their own jadhagam is entitled to their own arithmetic. It says
nothing about a person and does not change with age, so it is ungated, correctly. It also
already ships to every client on `ChartSummaryData.ashtakavarga` (app/schemas/charts.py) and
`dashboard-chart-explanation.tsx` reads it for the peyarchi bindu line — so "keep it
internal-only" was never the status quo on offer; it would have been a removal that broke a
live surface.

What is NOT approved — and what a grid must not quietly acquire — is a reading counted from
a **karaka graha**: the 5th from Guru, the 3rd from Sevvai, the 4th from Budhan, the 9th
from Suriyan. Those speak about a person's children, siblings, mother and father. They live
in `bav_derived.py`, they reach a surface only through `disclosable_indications()`, and they
are gated on the life-area age band, the life-phase gate, the propensity band and the
declared-fact gate. A grid cell that gains a band word, a life-domain label, or a highlight
on "the 5th from Guru" has stopped being the grid and has bypassed all four — and nothing in
a diff of the grid's own file would look wrong.

That is not left to memory: `tests/test_bav_disclosure_boundary.py` fails when it happens.
Rationale in docs/BAV_DERIVED_INDICATIONS_2026-08-18.md, doctrine in
docs/DOCTRINE_DECISIONS_V1.md §13.
"""
from __future__ import annotations

# Verbatim from Formula Engine Spec §9.2
BAV_TABLE: dict[str, dict[str, list[int]]] = {
    "SUN": {
        "SUN":     [1, 2, 4, 7, 8, 9, 10, 11],
        "MOON":    [3, 6, 10, 11],
        "MARS":    [1, 2, 4, 7, 8, 9, 10, 11],
        "MERCURY": [3, 5, 6, 9, 10, 11, 12],
        "JUPITER": [5, 6, 9, 11],
        "VENUS":   [6, 7, 12],
        "SATURN":  [1, 2, 4, 7, 8, 9, 10, 11],
        "LAGNA":   [3, 4, 6, 10, 11, 12],
    },
    "MOON": {
        "SUN":     [3, 6, 7, 8, 10, 11],
        "MOON":    [1, 3, 6, 7, 10, 11],
        "MARS":    [2, 3, 5, 6, 9, 10, 11],
        "MERCURY": [1, 3, 4, 5, 7, 8, 10, 11],
        "JUPITER": [1, 4, 7, 8, 10, 11, 12],
        "VENUS":   [3, 4, 5, 7, 9, 10, 11],
        "SATURN":  [3, 5, 6, 11],
        "LAGNA":   [3, 6, 10, 11],
    },
    "MARS": {
        "SUN":     [3, 5, 6, 10, 11],
        "MOON":    [3, 6, 11],
        "MARS":    [1, 2, 4, 7, 8, 10, 11],
        "MERCURY": [3, 5, 6, 11],
        "JUPITER": [6, 10, 11, 12],
        "VENUS":   [6, 8, 11, 12],
        "SATURN":  [1, 4, 7, 8, 9, 10, 11],
        # Classical BPHS/Phala Deepika Mars-from-Lagna row is [1,3,6,10,11] — the spec
        # doc's verbatim table duplicated the Mars-from-Mars row here by error; corrected
        # per domain audit (Mars total 41→39 bindus, SAV 339→337).
        "LAGNA":   [1, 3, 6, 10, 11],
    },
    "MERCURY": {
        "SUN":     [5, 6, 9, 11, 12],
        "MOON":    [2, 4, 6, 8, 10, 11],
        "MARS":    [1, 2, 4, 7, 8, 9, 10, 11],
        "MERCURY": [1, 3, 5, 6, 9, 10, 11, 12],
        "JUPITER": [6, 8, 11, 12],
        "VENUS":   [1, 2, 3, 4, 5, 8, 9, 11],
        "SATURN":  [1, 2, 4, 7, 8, 9, 10, 11],
        "LAGNA":   [1, 3, 5, 6, 9, 10, 11],  # Phala Deepika (Tamil primary source)
    },
    "JUPITER": {
        "SUN":     [1, 2, 3, 4, 7, 8, 9, 10, 11],
        "MOON":    [2, 5, 7, 9, 11],
        "MARS":    [1, 2, 4, 7, 8, 10, 11],
        "MERCURY": [1, 2, 4, 5, 6, 9, 10, 11],
        "JUPITER": [1, 2, 3, 4, 7, 8, 10, 11],
        "VENUS":   [2, 5, 6, 9, 10, 11],
        "SATURN":  [3, 5, 6, 12],
        "LAGNA":   [1, 2, 4, 5, 6, 7, 9, 10, 11],
    },
    "VENUS": {
        "SUN":     [8, 11, 12],
        "MOON":    [1, 2, 3, 4, 5, 8, 9, 11, 12],
        "MARS":    [3, 4, 6, 9, 11, 12],
        "MERCURY": [3, 5, 6, 9, 11],
        "JUPITER": [5, 8, 9, 10, 11],
        "VENUS":   [1, 2, 3, 4, 5, 8, 9, 10, 11],
        "SATURN":  [3, 4, 5, 8, 9, 10, 11],
        "LAGNA":   [1, 2, 3, 4, 5, 8, 9, 11],
    },
    "SATURN": {
        "SUN":     [1, 2, 4, 7, 8, 10, 11],
        "MOON":    [3, 6, 11],
        "MARS":    [3, 5, 6, 10, 11, 12],
        "MERCURY": [6, 8, 9, 10, 11, 12],
        "JUPITER": [5, 6, 11, 12],
        "VENUS":   [6, 11, 12],
        "SATURN":  [3, 5, 6, 11],
        "LAGNA":   [1, 3, 4, 6, 10, 11],
    },
}

# Rahu and Ketu do not have classical Bhinnashtakavarga tables.
# Per spec §9.3 only 7 planets contribute to Sarvashtakavarga.
# For Rahu/Ketu transit scoring, Saturn's table is used as a proxy.
BAV_PLANETS = list(BAV_TABLE.keys())  # SUN, MOON, MARS, MERCURY, JUPITER, VENUS, SATURN


def compute_bhinnashtakavarga(
    natal_rasi_map: dict[str, int],
) -> dict[str, dict[int, int]]:
    """
    Compute the full Bhinnashtakavarga for all 7 BAV planets.

    natal_rasi_map must contain keys: SUN, MOON, MARS, MERCURY, JUPITER, VENUS, SATURN, LAGNA
    Values are Rasi numbers (1-12).

    Returns: {planet: {rasi_1_to_12: bindu_count_0_to_8}}
    """
    result: dict[str, dict[int, int]] = {}
    for planet, ref_table in BAV_TABLE.items():
        bindus: dict[int, int] = {rasi: 0 for rasi in range(1, 13)}
        for ref_point, benefic_houses in ref_table.items():
            ref_rasi = natal_rasi_map.get(ref_point)
            if ref_rasi is None:
                continue
            for benefic_house in benefic_houses:
                # Convert house number (relative to ref_point's Rasi) to absolute Rasi
                target_rasi = ((ref_rasi - 1 + benefic_house - 1) % 12) + 1
                bindus[target_rasi] += 1
        result[planet] = bindus
    return result


def get_av_bindu(
    bav: dict[str, dict[int, int]],
    planet: str,
    transit_rasi: int,
) -> int | None:
    """Ashtakavarga bindus for `planet` transiting `transit_rasi`, or None.

    Doctrine A-15 (ruled 2026-08-19): Rahu and Ketu have no Bhinnashtakavarga
    table, and we no longer invent one for them. This used to substitute
    Saturn's table for both nodes, attributed in a comment to "common
    Thirukanitham practice" — an attribution nothing in this repository
    sourced. For a release-quality engine "no value" beats a borrowed one, so
    the nodes are now omitted from bindu-based transit scoring entirely.

    Do not replace this with a different proxy (Saturn for Rahu, Mars for Ketu,
    or any other pairing) without a named system to cite. The failure here was
    never which graha was borrowed; it was borrowing without a source.

    Returning None rather than a neutral 4 also closes a scoring bug: callers
    treat `>= 4` as a supportive transit worth +8, so the old neutral default
    silently handed every table-less graha a bonus.

    `bav_derived.bav_house_from_planet` has always refused the proxy for the
    karaka-relative indications; the two layers now agree.
    """
    if planet not in BAV_TABLE:
        return None
    planet_bav = bav.get(planet)
    if planet_bav is None:
        return None
    return planet_bav.get(transit_rasi)


def compute_sarvashtakavarga(bav: dict[str, dict[int, int]]) -> dict[int, int]:
    """
    Sum BAV scores across all 7 planets per Rasi.
    Per spec §9.3. Expected total range per house: 0-56.
    """
    sarva: dict[int, int] = {rasi: 0 for rasi in range(1, 13)}
    for planet in BAV_PLANETS:
        for rasi in range(1, 13):
            sarva[rasi] += bav.get(planet, {}).get(rasi, 0)
    return sarva
