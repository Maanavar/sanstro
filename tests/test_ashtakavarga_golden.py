"""C-4 — `STR-04` Bhinnashtakavarga golden fixtures.

The seven-planet bindu tables had no golden test. `test_bav_derived.py` covers
the *karaka-relative* readings built on top of them and `test_bav_disclosure_
boundary.py` covers the gate between the two, but the grid itself — 56 rows of
benefic houses that every one of those layers reads — was unpinned. A typo in
one row would have moved a life-area band, a transit score and a printed chart
at once, and nothing would have failed.

**Three independent things are pinned here, and they fail for different reasons.**

1. *Row totals against the published classical values* (Sun 48, Moon 49, Mars
   39, Mercury 54, Jupiter 56, Venus 52, Saturn 39, Sarva 337). These are not
   derived from our table — they are the standard totals printed in every
   Ashtakavarga treatment, and they are the one genuinely external check
   available without a second engine. A dropped or duplicated house number in
   any of the 56 rows moves its planet's total off the published figure.
   `rulebook STR-06` already quotes four of them (Guru 56, Budhan 54, Suriyan
   48, Sevvai 39) as the baselines its bands are cut against, so a table edit
   that slipped past this test would silently move those baselines too.

2. *A frozen grid for one synthetic chart*, cross-computed by a **pull**
   traversal ("for each target rasi, how many reference points count it as
   benefic?") where `compute_bhinnashtakavarga` uses a **push** traversal ("for
   each reference point, which rasis does it credit?"). The two walk the same
   table in opposite directions, so an off-by-one in the house-to-rasi
   conversion shows up as a disagreement rather than as two matching wrong
   answers. The frozen literal then holds the *values* still across refactors.

3. *Structural invariants that hold for every chart* — rotation equivariance,
   totals independent of placement, the 0..8 cell range, and the node exclusion
   ruled in `STR-08`. These are the ones that catch a change in the traversal
   rather than in the data.

The chart below is synthetic and deliberately regular — one graha per sign, no
conjunctions — chosen so that a failure points at the table rather than at an
accidental coincidence in the fixture.
"""
from __future__ import annotations

import pytest

from app.calculations.ashtakavarga import (
    BAV_PLANETS,
    BAV_TABLE,
    compute_bhinnashtakavarga,
    compute_sarvashtakavarga,
    get_av_bindu,
)

pytestmark = pytest.mark.no_db

# ── the fixture chart ───────────────────────────────────────────────────────

SYNTHETIC_CHART: dict[str, int] = {
    "SUN": 1,       # Aries
    "MOON": 4,      # Cancer
    "MARS": 8,      # Scorpio
    "MERCURY": 2,   # Taurus
    "JUPITER": 9,   # Sagittarius
    "VENUS": 3,     # Gemini
    "SATURN": 11,   # Aquarius
    "LAGNA": 5,     # Leo
}

# Frozen output for SYNTHETIC_CHART, rasi 1..12 left to right.
GOLDEN_BAV: dict[str, tuple[int, ...]] = {
    "SUN":     (4, 7, 2, 4, 3, 4, 5, 5, 5, 3, 4, 2),
    "MOON":    (4, 3, 4, 5, 3, 6, 4, 3, 6, 4, 3, 4),
    "MARS":    (1, 6, 3, 1, 4, 6, 4, 4, 3, 3, 3, 1),
    "MERCURY": (4, 6, 3, 4, 6, 5, 6, 3, 5, 3, 6, 3),
    "JUPITER": (4, 5, 6, 4, 4, 4, 4, 5, 4, 6, 6, 4),
    "VENUS":   (5, 2, 4, 5, 4, 7, 7, 4, 2, 3, 4, 5),
    "SATURN":  (6, 5, 2, 2, 2, 2, 5, 4, 3, 4, 2, 2),
}

GOLDEN_SAV: tuple[int, ...] = (28, 34, 24, 25, 26, 34, 35, 28, 28, 26, 28, 21)

# The published classical totals. External to this repository — that is the
# whole point of citing them here.
CLASSICAL_ROW_TOTALS: dict[str, int] = {
    "SUN": 48,
    "MOON": 49,
    "MARS": 39,
    "MERCURY": 54,
    "JUPITER": 56,
    "VENUS": 52,
    "SATURN": 39,
}
CLASSICAL_SARVA_TOTAL = 337

REFERENCE_POINTS = ("SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN", "LAGNA")


def _pull_bav(chart: dict[str, int]) -> dict[str, dict[int, int]]:
    """Second, independent traversal of `BAV_TABLE`.

    For each target rasi, ask every reference point "which house are you
    counting this rasi as?" and credit a bindu if that house is in the list.
    `compute_bhinnashtakavarga` walks it the other way — from each reference
    point's benefic houses out to the rasis they land on. The two directions
    share the data and nothing else, so they disagree on any indexing error.
    """
    out: dict[str, dict[int, int]] = {}
    for planet, refs in BAV_TABLE.items():
        row: dict[int, int] = {}
        for target in range(1, 13):
            row[target] = sum(
                1
                for ref_point, houses in refs.items()
                if ref_point in chart
                and ((target - chart[ref_point]) % 12) + 1 in houses
            )
        out[planet] = row
    return out


# ── 1. the published totals ─────────────────────────────────────────────────

@pytest.mark.parametrize("planet", BAV_PLANETS)
def test_table_row_totals_match_the_published_classical_values(planet: str) -> None:
    """Sum of the eight benefic-house lists for one planet. This is the count
    of bindus that planet distributes across the zodiac in *any* chart, so it is
    a property of the table alone and is directly comparable to the printed
    figure."""
    total = sum(len(houses) for houses in BAV_TABLE[planet].values())
    assert total == CLASSICAL_ROW_TOTALS[planet], (
        f"{planet}'s table distributes {total} bindus; the published total is "
        f"{CLASSICAL_ROW_TOTALS[planet]}. A house number has been added, dropped "
        f"or duplicated in one of its eight rows."
    )


def test_sarvashtakavarga_grand_total_is_337() -> None:
    assert sum(CLASSICAL_ROW_TOTALS.values()) == CLASSICAL_SARVA_TOTAL
    total = sum(len(h) for refs in BAV_TABLE.values() for h in refs.values())
    assert total == CLASSICAL_SARVA_TOTAL


def test_mars_from_lagna_row_stays_at_the_corrected_five_houses() -> None:
    """The one row this repository knowingly departs from its own spec document
    on: the spec's verbatim table duplicated Mars-from-Mars into Mars-from-Lagna,
    which put Mars at 41 bindus and Sarva at 339. Pinned by value, because
    "restore the spec table" is a plausible-looking future edit that would
    reintroduce a two-bindu error in every chart."""
    assert BAV_TABLE["MARS"]["LAGNA"] == [1, 3, 6, 10, 11]
    assert BAV_TABLE["MARS"]["LAGNA"] != BAV_TABLE["MARS"]["MARS"]


# ── table well-formedness ───────────────────────────────────────────────────

@pytest.mark.parametrize("planet", BAV_PLANETS)
def test_every_planet_has_all_eight_reference_points(planet: str) -> None:
    assert tuple(BAV_TABLE[planet]) == REFERENCE_POINTS


@pytest.mark.parametrize("planet", BAV_PLANETS)
def test_every_benefic_house_list_is_sorted_unique_and_in_range(planet: str) -> None:
    """A duplicate would credit two bindus from one reference point, which the
    0..8 cell range cannot express and no total would necessarily catch."""
    for ref_point, houses in BAV_TABLE[planet].items():
        assert houses == sorted(houses), f"{planet}/{ref_point} is not sorted"
        assert len(houses) == len(set(houses)), f"{planet}/{ref_point} has a duplicate"
        assert all(1 <= h <= 12 for h in houses), f"{planet}/{ref_point} is out of range"
        assert houses, f"{planet}/{ref_point} is empty"


def test_the_nodes_have_no_table_of_their_own() -> None:
    """`STR-08`, ruled 2026-08-19. Adding a Rahu or Ketu row here — with any
    borrowed graha's houses — is the change this test exists to stop."""
    assert "RAHU" not in BAV_TABLE
    assert "KETU" not in BAV_TABLE
    assert set(BAV_PLANETS) == set(CLASSICAL_ROW_TOTALS)


# ── 2. the golden grid ──────────────────────────────────────────────────────

@pytest.mark.parametrize("planet", BAV_PLANETS)
def test_golden_grid_for_the_synthetic_chart(planet: str) -> None:
    computed = compute_bhinnashtakavarga(SYNTHETIC_CHART)[planet]
    actual = tuple(computed[rasi] for rasi in range(1, 13))
    assert actual == GOLDEN_BAV[planet], (
        f"{planet}'s bindu row changed for the fixture chart.\n"
        f"  expected {GOLDEN_BAV[planet]}\n"
        f"  got      {actual}"
    )


def test_the_push_and_pull_traversals_agree() -> None:
    """The cross-check that makes the frozen grid above worth trusting: it was
    produced by this comparison, not read off the engine alone."""
    assert compute_bhinnashtakavarga(SYNTHETIC_CHART) == _pull_bav(SYNTHETIC_CHART)


def test_golden_sarvashtakavarga_for_the_synthetic_chart() -> None:
    sav = compute_sarvashtakavarga(compute_bhinnashtakavarga(SYNTHETIC_CHART))
    assert tuple(sav[rasi] for rasi in range(1, 13)) == GOLDEN_SAV
    assert sum(sav.values()) == CLASSICAL_SARVA_TOTAL


def test_golden_grid_rows_sum_to_the_published_totals() -> None:
    """Ties the two halves together: if the frozen grid and the published totals
    ever disagree, one of them was updated without the other."""
    for planet, row in GOLDEN_BAV.items():
        assert sum(row) == CLASSICAL_ROW_TOTALS[planet], planet
    assert sum(sum(row) for row in GOLDEN_BAV.values()) == sum(GOLDEN_SAV)


# ── 3. invariants that hold for every chart ─────────────────────────────────

@pytest.mark.parametrize("shift", range(1, 12))
def test_rotating_the_whole_chart_rotates_the_grid_by_the_same_amount(shift: int) -> None:
    """Every rule in the table counts from a reference point, so the grid has no
    absolute orientation: move every graha n signs and every bindu moves n signs.

    This is the strongest single check on the traversal — it fails on any
    modular-arithmetic slip that a fixed golden grid could absorb, because it
    compares the engine against itself under a transformation the doctrine
    guarantees rather than against a stored number.
    """
    rotated_chart = {
        point: ((rasi - 1 + shift) % 12) + 1 for point, rasi in SYNTHETIC_CHART.items()
    }
    rotated = compute_bhinnashtakavarga(rotated_chart)
    base = compute_bhinnashtakavarga(SYNTHETIC_CHART)
    for planet in BAV_PLANETS:
        for rasi in range(1, 13):
            moved_to = ((rasi - 1 + shift) % 12) + 1
            assert rotated[planet][moved_to] == base[planet][rasi], (
                f"{planet} rasi {rasi} did not follow a {shift}-sign rotation"
            )


@pytest.mark.parametrize(
    "chart",
    [
        SYNTHETIC_CHART,
        dict.fromkeys(REFERENCE_POINTS, 1),                          # everything stacked in Aries
        dict.fromkeys(REFERENCE_POINTS, 12),                         # everything stacked in Pisces
        {p: i + 1 for i, p in enumerate(REFERENCE_POINTS)},          # Aries..Scorpio in order
        {p: 12 - i for i, p in enumerate(REFERENCE_POINTS)},         # Pisces..Leo in reverse
    ],
    ids=["synthetic", "all-aries", "all-pisces", "ascending", "descending"],
)
def test_row_totals_are_independent_of_where_the_grahas_sit(chart: dict[str, int]) -> None:
    """Each reference point always distributes exactly `len(houses)` bindus —
    placement decides *which* rasis get them, never how many exist. A chart
    whose total drifts means bindus were dropped on a wrap or double-counted."""
    bav = compute_bhinnashtakavarga(chart)
    for planet in BAV_PLANETS:
        assert sum(bav[planet].values()) == CLASSICAL_ROW_TOTALS[planet], (
            f"{planet} distributed {sum(bav[planet].values())} bindus for {chart}"
        )
    assert sum(compute_sarvashtakavarga(bav).values()) == CLASSICAL_SARVA_TOTAL


@pytest.mark.parametrize(
    "chart",
    [
        SYNTHETIC_CHART,
        dict.fromkeys(REFERENCE_POINTS, 7),
        {p: (i * 5) % 12 + 1 for i, p in enumerate(REFERENCE_POINTS)},
    ],
    ids=["synthetic", "all-libra", "spread"],
)
def test_every_cell_is_within_the_zero_to_eight_scale(chart: dict[str, int]) -> None:
    """Eight reference points, at most one bindu each. A cell above 8 means a
    reference point was counted twice; the SAV ceiling of 56 follows."""
    bav = compute_bhinnashtakavarga(chart)
    for planet in BAV_PLANETS:
        for rasi, bindus in bav[planet].items():
            assert 0 <= bindus <= 8, f"{planet} has {bindus} bindus in rasi {rasi}"
    for rasi, total in compute_sarvashtakavarga(bav).items():
        assert 0 <= total <= 56, f"SAV rasi {rasi} is {total}"


def test_a_reference_point_missing_from_the_chart_is_skipped_not_defaulted() -> None:
    """An absent graha contributes nothing rather than being read as Aries. The
    row total then drops by exactly that reference point's list length, which is
    how the shortfall stays legible instead of turning into wrong placements."""
    partial = {k: v for k, v in SYNTHETIC_CHART.items() if k != "SATURN"}
    bav = compute_bhinnashtakavarga(partial)
    for planet in BAV_PLANETS:
        expected = CLASSICAL_ROW_TOTALS[planet] - len(BAV_TABLE[planet]["SATURN"])
        assert sum(bav[planet].values()) == expected, planet


def test_the_lagna_row_is_a_real_contributor_not_an_afterthought() -> None:
    """Lagna is one of the eight reference points, so dropping it must change
    the grid. Guards against a caller that passes only the seven grahas and
    quietly gets a seven-eighths chart that still looks plausible."""
    without_lagna = {k: v for k, v in SYNTHETIC_CHART.items() if k != "LAGNA"}
    assert compute_bhinnashtakavarga(without_lagna) != compute_bhinnashtakavarga(
        SYNTHETIC_CHART
    )


# ── get_av_bindu ────────────────────────────────────────────────────────────

def test_get_av_bindu_reads_the_golden_grid() -> None:
    bav = compute_bhinnashtakavarga(SYNTHETIC_CHART)
    for planet in BAV_PLANETS:
        for rasi in range(1, 13):
            assert get_av_bindu(bav, planet, rasi) == GOLDEN_BAV[planet][rasi - 1]


@pytest.mark.parametrize("node", ["RAHU", "KETU"])
def test_get_av_bindu_returns_none_for_the_nodes_never_a_neutral_four(node: str) -> None:
    """`STR-08`. The old neutral default of 4 was read by callers as a
    supportive transit worth +8 — "no value" and "a middling value" are not
    interchangeable here, so the None is the assertion."""
    bav = compute_bhinnashtakavarga(SYNTHETIC_CHART)
    for rasi in range(1, 13):
        assert get_av_bindu(bav, node, rasi) is None
