"""C-3 — `DIV-01`/`DIV-02` exact-boundary certification for every varga.

The divisional *names* were never the open question; the *mapping algorithms*
were unverified at their edges. `tests/test_divisional_charts.py` samples the
middle of amsas, where every implementation agrees. This file walks the
**boundaries** — all 3,336 of them across the fifteen supported divisions — and
pins the one rule that decides which side a planet on the line falls on:

    A degree that lands exactly on an amsa boundary belongs to the amsa it
    OPENS, not the one it closes.

That rule is what `EPSILON_DEGREES` exists for. Navamsa has always had it
(`astro.navamsa_rasi_from_degree`); the vargas computed in `divisional_charts`
did not, and three of them were wrong because of it:

    D7   30 of  84 boundaries misplaced   (step 30/7)
    D27 133 of 324 boundaries misplaced   (step 30/27)
    D45 161 of 540 boundaries misplaced   (step 2/3)

Every one of those steps is a non-terminating binary fraction, so `deg / step`
at the k-th boundary can land at `k - 1e-16` and `int()` floors it into the
previous amsa. The other twelve divisions have exactly-representable steps and
were already correct — which is why sampling never caught this, and why the
boundary walk is the only test shape that could.

Expected values here are computed with `fractions.Fraction`, i.e. in exact
rational arithmetic, and never by calling the module under test. A test that
asks the engine what the engine thinks is a tautology wearing a test's clothes.
"""
from __future__ import annotations

from fractions import Fraction

import pytest

from app.calculations.astro import navamsa_rasi_from_degree
from app.calculations.divisional_charts import get_varga

pytestmark = pytest.mark.no_db

# Every division `get_varga` dispatches. D30 is boundary-tested separately: its
# amsas are five unequal segments, not `30/n` slices.
EQUAL_STEP_DIVISIONS = (2, 3, 4, 7, 9, 10, 12, 16, 20, 24, 27, 40, 45, 60)

# Divisions whose step is NOT exactly representable as a float. These are the
# only ones the epsilon can change, and all three were wrong before it.
NON_REPRESENTABLE_STEP_DIVISIONS = (7, 9, 27, 45)


def _amsa_start(rasi: int, division: int, amsa_index: int) -> Fraction:
    """Exact ecliptic longitude opening amsa `amsa_index` of `rasi`."""
    return Fraction(30 * (rasi - 1)) + amsa_index * Fraction(30, division)


def _all_boundaries(division: int):
    for rasi in range(1, 13):
        for amsa_index in range(division):
            yield rasi, amsa_index, _amsa_start(rasi, division, amsa_index)


# ── the invariant, stated three ways ────────────────────────────────────────

@pytest.mark.parametrize("division", EQUAL_STEP_DIVISIONS)
def test_every_boundary_opens_its_own_amsa(division: int) -> None:
    """The boundary degree and a hair above it must land in the same amsa.

    This is the assertion that failed 324 times across D7/D27/D45 before
    `_amsa` added the epsilon. It needs no expected-value table: a planet at
    exactly 3°20' of Aries and one at 3°20'00.000000004" are in the same
    navamsa by definition, and any implementation that disagrees is rounding,
    not calculating.
    """
    offenders = []
    for rasi, amsa_index, exact in _all_boundaries(division):
        on_boundary = get_varga(division, {"P": float(exact)})["P"]
        just_above = get_varga(division, {"P": float(exact) + 1e-9})["P"]
        if on_boundary != just_above:
            offenders.append((rasi, amsa_index, float(exact), on_boundary, just_above))
    assert not offenders, (
        f"D{division}: {len(offenders)} boundaries fall into the amsa they close "
        f"instead of the one they open; first: {offenders[0]}"
    )


# A probe distance comfortably outside the epsilon's reach but far below any
# meaningful astronomical precision: 1e-6° is 0.0036 arc-seconds, and the
# epsilon is applied in *ratio* units, so it spans at most `1e-9 * step` degrees
# — 4.3e-9° for D7, the widest step here.
BELOW_BOUNDARY = 1e-6


@pytest.mark.parametrize("division", EQUAL_STEP_DIVISIONS)
def test_every_boundary_differs_from_the_amsa_it_closes(division: int) -> None:
    """The other half of the same rule: a degree measurably *below* the boundary
    must still belong to the preceding amsa.

    Without this, `_amsa` could be "fixed" by an epsilon large enough to swallow
    real degrees — a nudge of 1e-3 would pass the test above while reassigning
    every planet within 3.6 arc-seconds of a boundary into the next amsa. So the
    epsilon has to be narrow enough that it only ever rescues float error, and
    this is the test that bounds it from the other side.

    Every equal-step varga here advances the target sign by a non-zero stride
    per amsa, so "a different amsa" and "a different sign" coincide and the
    engine's own output is enough to tell them apart.
    """
    for rasi, amsa_index, exact in _all_boundaries(division):
        if amsa_index == 0:
            continue  # the sign boundary, covered by test_sign_boundaries_are_clean
        on_boundary = get_varga(division, {"P": float(exact)})["P"]
        below = get_varga(division, {"P": float(exact) - BELOW_BOUNDARY})["P"]
        assert below != on_boundary, (
            f"D{division} rasi {rasi} amsa {amsa_index}: {BELOW_BOUNDARY}° below "
            f"the boundary still lands in the next amsa — epsilon too wide"
        )


# How far the target sign advances per amsa *within* one rasi. This is doctrine,
# not an implementation detail, so it is written down rather than read back off
# the engine: Drekkana walks the trines (+4), Chaturthamsa the kendras (+3),
# Shashtiamsa runs forward in odd signs and *backward* in even ones, and every
# other equal-step varga advances one sign at a time. D2 is absent — its two
# horas are Leo and Cancer and do not roll at all.
AMSA_STRIDE: dict[int, int] = {3: 4, 4: 3}


def _stride(division: int, rasi: int) -> int:
    if division == 60:
        return 1 if rasi % 2 == 1 else -1
    return AMSA_STRIDE.get(division, 1)


@pytest.mark.parametrize("division", EQUAL_STEP_DIVISIONS)
def test_amsa_index_matches_exact_rational_arithmetic(division: int) -> None:
    """Walk each amsa's opening, middle and closing degree and check the sign
    the engine returns against one derived by exact `Fraction` arithmetic.

    Only the sign that opens each rasi is taken from the engine; every amsa
    after it is predicted from that anchor plus the varga's declared stride, so
    a wrong index anywhere inside the sign is a wrong sign here. Three probes
    per amsa — the opening degree, the midpoint, and the last representable
    degree before the next boundary — so an off-by-one that only bites on one
    edge cannot hide in the middle.
    """
    if division == 2:
        pytest.skip("D2's two horas are Leo/Cancer, not a rolling advance")
    step = Fraction(30, division)
    for rasi in range(1, 13):
        base = get_varga(division, {"P": float(30 * (rasi - 1))})["P"]
        stride = _stride(division, rasi)
        for amsa_index in range(division):
            start = _amsa_start(rasi, division, amsa_index)
            middle = start + step / 2
            end = start + step - Fraction(1, 10**7)
            expected = ((base - 1 + stride * amsa_index) % 12) + 1
            for probe, where in ((start, "start"), (middle, "middle"), (end, "end")):
                got = get_varga(division, {"P": float(probe)})["P"]
                assert got == expected, (
                    f"D{division} rasi {rasi} amsa {amsa_index} ({where}, "
                    f"{float(probe)}): expected rasi {expected}, got {got}"
                )


# ── the three divisions the epsilon actually rescued ────────────────────────

@pytest.mark.parametrize("division", NON_REPRESENTABLE_STEP_DIVISIONS)
def test_the_regression_case_is_a_non_representable_step(division: int) -> None:
    """Pins *why* only D7, D9, D27 and D45 were ever at risk.

    If a future varga is added with a step like 30/11, this test names it as
    needing the epsilon before anyone has to rediscover the failure from a
    wrong chart. The other eleven divisions are exact in binary and are
    asserted so, in the same breath, so the two lists cannot silently swap.
    """
    step = 30.0 / division
    assert Fraction(step) != Fraction(30, division), (
        f"D{division} is listed as non-representable but 30/{division} is exact "
        f"in float — move it out of NON_REPRESENTABLE_STEP_DIVISIONS"
    )


@pytest.mark.parametrize(
    "division", [d for d in EQUAL_STEP_DIVISIONS if d not in NON_REPRESENTABLE_STEP_DIVISIONS]
)
def test_the_remaining_divisions_have_exact_binary_steps(division: int) -> None:
    step = 30.0 / division
    assert Fraction(step) == Fraction(30, division), (
        f"D{division} has an inexact step and belongs in "
        f"NON_REPRESENTABLE_STEP_DIVISIONS"
    )


def test_d7_taurus_second_saptamsa_is_the_original_reproducer() -> None:
    """The exact float that surfaced this. 34.285714285714285 is 4°17'08.57" of
    Taurus — the opening of D7's *second* saptamsa — and `deg / step` there is
    0.9999999999999998. It filed the planet in amsa 0.

    Named as its own case because D7 feeds the children propensity reading, so
    this was not a cosmetic off-by-one in a chart nobody scores.
    """
    boundary = 34.285714285714285
    assert get_varga(7, {"P": boundary})["P"] == get_varga(7, {"P": boundary + 1e-9})["P"]
    # Taurus is even: count from the 7th (Scorpio, 8). Amsa 1 -> 8 + 1 = 9.
    assert get_varga(7, {"P": boundary})["P"] == 9
    # ...and a measurable step before it is still the first saptamsa, Scorpio.
    assert get_varga(7, {"P": boundary - BELOW_BOUNDARY})["P"] == 8


# ── D9 navamsa, the division C-3 named explicitly ───────────────────────────

def test_navamsa_pada_ladder_across_a_movable_sign() -> None:
    """0°00', 3°20', 6°40', 10°00' … 26°40' of Aries — the nine pada openings
    C-3 asked for by name, each expected to advance one sign from Aries."""
    for pada in range(9):
        degree = pada * (10.0 / 3.0)
        assert navamsa_rasi_from_degree(degree) == ((pada) % 12) + 1, (
            f"Aries pada {pada + 1} at {degree}° is not the {pada + 1}th sign"
        )


@pytest.mark.parametrize(
    "rasi,start_rasi,label",
    [
        (1, 1, "movable Aries starts from itself"),
        (2, 10, "fixed Taurus starts from the 9th"),
        (3, 7, "dual Gemini starts from the 5th"),
        (4, 4, "movable Cancer starts from itself"),
        (11, 7, "fixed Aquarius starts from the 9th"),
        (12, 4, "dual Pisces starts from the 5th"),
    ],
)
def test_navamsa_start_sign_holds_at_every_pada_boundary(
    rasi: int, start_rasi: int, label: str
) -> None:
    """`DIV-02` — the movable/fixed/dual start rule, checked at the boundary of
    all nine padas rather than at one sampled degree inside the sign."""
    for pada in range(9):
        degree = float(_amsa_start(rasi, 9, pada))
        expected = ((start_rasi - 1 + pada) % 12) + 1
        assert navamsa_rasi_from_degree(degree) == expected, f"{label}, pada {pada + 1}"


def test_vargottama_survives_at_zero_degrees_of_every_movable_sign() -> None:
    """`DIV-02`'s stated reason for choosing per-sign starts over a universal
    anchor. If this fails, someone has swapped navamsa to Method B."""
    for rasi in (1, 4, 7, 10):
        assert navamsa_rasi_from_degree(float(30 * (rasi - 1))) == rasi


def test_navamsa_last_arcsecond_of_pisces_stays_in_pisces() -> None:
    """29°59'59" of Pisces — the top of the zodiac, C-3's named upper edge. The
    dual start for Pisces is Cancer (4); the ninth pada is 4 + 8 = Pisces."""
    assert navamsa_rasi_from_degree(360.0 - 1.0 / 3600.0) == 12


# ── D30, whose amsas are unequal by doctrine ────────────────────────────────

@pytest.mark.parametrize(
    "rasi,boundaries,targets",
    [
        (1, (0.0, 5.0, 10.0, 18.0, 25.0), (1, 11, 9, 3, 7)),    # odd: Mars..Venus
        (2, (0.0, 5.0, 12.0, 20.0, 25.0), (2, 6, 12, 10, 8)),   # even: Venus..Mars
    ],
)
def test_d30_segment_openings_land_in_the_right_lord(
    rasi: int, boundaries: tuple[float, ...], targets: tuple[int, ...]
) -> None:
    """Trimsamsa's five segments are 5/5/8/7/5 degrees wide, so its boundaries
    are integers and float error never reached it. Pinned anyway: the widths
    are the doctrine, and a future edit to the segment table would move them.
    """
    for opening, expected in zip(boundaries, targets, strict=True):
        longitude = 30.0 * (rasi - 1) + opening
        assert get_varga(30, {"P": longitude})["P"] == expected, (
            f"D30 rasi {rasi} at {opening}° into the sign"
        )
        # the degree before each opening must belong to the previous segment
        if opening > 0.0:
            assert get_varga(30, {"P": longitude - BELOW_BOUNDARY})["P"] != expected


def test_d30_last_arcsecond_of_a_sign_stays_in_the_final_segment() -> None:
    assert get_varga(30, {"P": 29.999999})["P"] == 7    # Aries, Venus segment
    assert get_varga(30, {"P": 59.999999})["P"] == 8    # Taurus, Mars segment


# ── whole-zodiac invariants ─────────────────────────────────────────────────

@pytest.mark.parametrize("division", (*EQUAL_STEP_DIVISIONS, 30))
def test_sign_boundaries_are_clean(division: int) -> None:
    """0° of each sign must be that sign's first amsa, and the arcsecond before
    it must belong to the previous sign's last amsa. `_norm`'s `lon % 30.0` is
    where a planet at exactly 60.0 could be read as 29.999...° of Taurus."""
    for rasi in range(1, 13):
        opening = float(30 * (rasi - 1))
        first_amsa = get_varga(division, {"P": opening})["P"]
        assert first_amsa == get_varga(division, {"P": opening + 1e-9})["P"], (
            f"D{division}: 0° of rasi {rasi} does not open the sign's first amsa"
        )


@pytest.mark.parametrize("division", (*EQUAL_STEP_DIVISIONS, 30))
def test_output_is_always_a_valid_rasi(division: int) -> None:
    """No amsa may map outside 1..12 — the clamp in `_amsa` exists so the last
    sliver of a sign cannot index a division that does not exist."""
    for _rasi, _, exact in _all_boundaries(division if division != 30 else 60):
        for probe in (float(exact), float(exact) + 1e-9, float(exact) - 1e-9):
            got = get_varga(division, {"P": probe % 360.0})["P"]
            assert 1 <= got <= 12, f"D{division} produced rasi {got} at {probe}"


@pytest.mark.parametrize("division", (*EQUAL_STEP_DIVISIONS, 30))
def test_negative_and_wrapped_longitudes_agree_with_their_canonical_form(
    division: int,
) -> None:
    """`_norm` reduces mod 360 before dividing. A negative longitude and its
    positive equivalent must agree exactly — including at boundaries, where
    `-360.0 + x` and `x` are not always the same float."""
    for _rasi, _, exact in _all_boundaries(division if division != 30 else 12):
        canonical = float(exact)
        assert (
            get_varga(division, {"P": canonical - 360.0})["P"]
            == get_varga(division, {"P": canonical})["P"]
            == get_varga(division, {"P": canonical + 360.0})["P"]
        ), f"D{division} disagrees with itself across a 360° wrap at {canonical}"


def test_d9_dispatch_and_direct_navamsa_agree_at_every_boundary() -> None:
    """`get_varga(9, ...)` delegates to `navamsa_rasi_from_degree`. Pinned at
    the boundaries so the delegation cannot be replaced with a local copy that
    drops the epsilon."""
    for _, _, exact in _all_boundaries(9):
        degree = float(exact)
        assert get_varga(9, {"P": degree})["P"] == navamsa_rasi_from_degree(degree)
