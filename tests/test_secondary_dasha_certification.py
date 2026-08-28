"""C-5 — `DAS-06`/`DAS-07`/`DAS-08` secondary dasha certification.

The existing per-system suites verify each dasha against **one** reference
chart plus a handful of hand-picked cases. That is enough to catch a wrong
formula and not enough to certify a system: an off-by-one that only bites at
nakshatra 26, or a mahadasha chain that loses a day on the wrap into the second
cycle, survives every sampled test in the repository today.

Certification here means two things the per-system suites do not do:

1. **The whole input domain, not a sample.** Every one of the 27 nakshatras for
   the lord-sequence systems, every one of the 108 nakshatra-padas for
   Kalachakra, at three points inside each — the opening degree, the midpoint,
   and the last sliver — checked for contiguity, exact partitioning, and
   monotone balance. That is the shape of test that can say "this arithmetic is
   right", rather than "this arithmetic was right once".

2. **The `[LIMIT]` made executable.** `DAS-06` and `DAS-07` say these systems
   must not silently override the primary Vimshottari reading. Until now that
   was a claim in a document. `test_no_limited_system_reaches_an_interpretive_
   module` walks the static import closure of every interpretive service and
   fails if one of them can reach a limited system at any depth.

`app/calculations/dasha_certification.py` records, per system, what these tests
certify and — the part that matters more — what they cannot. A test cannot
certify that Ardra-adi is the right Ashtottari grouping for a Tamil chart, or
that the Kalachakra pada tables were transcribed correctly from a source this
repository does not hold. Those stay in `uncertified` and stay owed.
"""
from __future__ import annotations

import ast
import os
from collections import deque

import pytest

from app.calculations.ashtottari_dasha import (
    ASHTOTTARI_SEQUENCE,
    ASHTOTTARI_YEARS,
    calculate_ashtottari_timeline,
    calculate_opening_ashtottari,
    evaluate_ashtottari_applicability,
)
from app.calculations.astro import NAKSHATRA_SIZE_DEGREES
from app.calculations.conditional_dashas import (
    CONDITIONAL_DASHA_SYSTEMS,
    calculate_timeline,
)
from app.calculations.dasha_certification import (
    INTERPRETIVE_MODULES,
    LIMITED_DASHA_MODULES,
    SECONDARY_DASHA_CERTIFICATIONS,
)
from app.calculations.jaimini_karakas import (
    CHARA_KARAKA_ORDER,
    compute_char_karakas,
)
from app.calculations.kalachakra_dasha import (
    CHAKRA_DIRECTION,
    RASI_YEARS,
    calculate_kalachakra_timeline,
    calculate_opening_kalachakra,
)
from app.calculations.yogini_dasha import (
    YOGINI_SEQUENCE,
    YOGINI_YEARS,
    calculate_opening_yogini,
    calculate_yogini_timeline,
)

pytestmark = pytest.mark.no_db

BIRTH_JD = 2451545.0            # J2000, an arbitrary fixed epoch
AS_OF_JD = BIRTH_JD + 12000.0   # ~33 years on, so a running period always exists
JULIAN_YEAR_DAYS = 365.25

# A julian day is ~86400 seconds; 1e-6 days is a tenth of a second. Contiguity
# is asserted at that scale rather than exactly, because the period boundaries
# are float sums of year fractions and an exact-equality assertion would be
# testing IEEE754 rather than the dasha.
JD_TOLERANCE = 1e-6

PADA_SIZE = NAKSHATRA_SIZE_DEGREES / 4.0

# Three probes inside every nakshatra: the opening degree, the midpoint, and the
# last sliver before the next one. The opening and the last sliver are where a
# balance calculation goes wrong.
NAKSHATRA_PROBES = (0.0, 0.5, 0.999999)


def _nakshatra_longitudes() -> list[tuple[int, float, float]]:
    """(nakshatra 1..27, fraction elapsed, longitude) over the whole zodiac."""
    out = []
    for nakshatra in range(1, 28):
        start = (nakshatra - 1) * NAKSHATRA_SIZE_DEGREES
        for fraction in NAKSHATRA_PROBES:
            out.append((nakshatra, fraction, start + fraction * NAKSHATRA_SIZE_DEGREES))
    return out


def _pada_longitudes() -> list[tuple[int, int, float]]:
    """(nakshatra, pada 1..4, longitude at the pada's midpoint) — all 108."""
    return [
        (nakshatra, pada, (nakshatra - 1) * NAKSHATRA_SIZE_DEGREES
         + (pada - 1) * PADA_SIZE + PADA_SIZE / 2)
        for nakshatra in range(1, 28)
        for pada in range(1, 5)
    ]


def _assert_chain_is_contiguous(periods, label: str) -> None:
    """No gap, no overlap, no zero-length or reversed period.

    A gap silently drops time from a person's timeline; an overlap puts them in
    two periods at once. Both render as a plausible-looking table, which is why
    they need asserting rather than eyeballing.
    """
    assert periods, f"{label}: no periods at all"
    for period in periods:
        assert period.end_jd > period.start_jd, f"{label}: non-positive period"
    for earlier, later in zip(periods, periods[1:], strict=False):
        assert abs(earlier.end_jd - later.start_jd) < JD_TOLERANCE, (
            f"{label}: {earlier.end_jd - later.start_jd:+.9f} day discontinuity "
            f"between sequence {earlier.sequence_index} and {later.sequence_index}"
        )
    assert [p.sequence_index for p in periods] == list(range(len(periods))), (
        f"{label}: sequence indices are not a clean 0..n run"
    )


def _assert_partitions_parent(children, parent, label: str) -> None:
    """Sub-periods must tile their parent exactly — start together, end
    together, and leave nothing in between."""
    _assert_chain_is_contiguous(children, f"{label} sub-periods")
    assert abs(children[0].start_jd - parent.start_jd) < JD_TOLERANCE, (
        f"{label}: sub-periods start {children[0].start_jd - parent.start_jd:+.9f} "
        f"days off their parent"
    )
    assert abs(children[-1].end_jd - parent.end_jd) < JD_TOLERANCE, (
        f"{label}: sub-periods end {children[-1].end_jd - parent.end_jd:+.9f} "
        f"days off their parent"
    )


# ═══ 1. the [LIMIT], made executable ════════════════════════════════════════

def _module_file(module: str) -> str | None:
    path = module.replace(".", os.sep) + ".py"
    return path if os.path.exists(path) else None


def _direct_imports(module: str) -> set[str]:
    """First-party imports named in one module's source.

    Static, not runtime: a runtime check would only see what the import machinery
    happened to load, and a lazily-imported secondary dasha inside a function
    body is exactly the shape of regression this is guarding against. `ast` sees
    it either way.
    """
    path = _module_file(module)
    if path is None:
        return set()
    with open(path, encoding="utf-8") as handle:
        tree = ast.parse(handle.read(), path)
    found: set[str] = set()
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            found.update(alias.name for alias in node.names)
        elif isinstance(node, ast.ImportFrom) and node.module and node.level == 0:
            found.add(node.module)
            found.update(f"{node.module}.{alias.name}" for alias in node.names)
    return {name for name in found if name.startswith("app.")}


def _import_closure(entry: str) -> tuple[set[str], dict[str, str]]:
    reached, parents = {entry}, {}
    queue = deque([entry])
    while queue:
        current = queue.popleft()
        for imported in _direct_imports(current):
            if imported in reached:
                continue
            reached.add(imported)
            parents[imported] = current
            queue.append(imported)
    return reached, parents


@pytest.mark.parametrize("entry", INTERPRETIVE_MODULES)
def test_no_limited_system_reaches_an_interpretive_module(entry: str) -> None:
    """`DAS-06`/`DAS-07`. A secondary system must not be reachable from anything
    that produces a reading — not directly, and not through five hops of
    helper module either, which is how this kind of guard usually fails.
    """
    assert _module_file(entry) is not None, (
        f"{entry} is listed as interpretive but no longer exists — update "
        f"INTERPRETIVE_MODULES rather than leaving a check that silently passes"
    )
    reached, parents = _import_closure(entry)
    for module, system in LIMITED_DASHA_MODULES.items():
        if module not in reached:
            continue
        chain, node = [], module
        while node in parents:
            chain.append(node)
            node = parents[node]
        assert False, (
            f"{system} is [LIMIT] but reaches the interpretive module {entry}: "
            + " <- ".join([*chain, entry])
        )


def test_the_closure_walker_actually_finds_things() -> None:
    """Negative control for the test above.

    An import walker that silently returns nothing would pass every `[LIMIT]`
    check while proving nothing at all. Two things are asserted: that the
    interpretive modules which read the *primary* dasha are seen to reach it,
    and that the closure genuinely goes deeper than one hop — otherwise a
    limited system three modules away would be invisible and the guard above
    would be decoration.
    """
    reaches_vimshottari = [
        entry
        for entry in INTERPRETIVE_MODULES
        if "app.calculations.dasha" in _import_closure(entry)[0]
    ]
    assert len(reaches_vimshottari) >= 8, (
        "the walker found almost nothing; it is not traversing imports"
    )
    deep = [
        entry
        for entry in INTERPRETIVE_MODULES
        if len(_import_closure(entry)[0]) > len(_direct_imports(entry)) + 1
    ]
    assert deep, "the walker never followed a second hop"
    # ...and at least one entry must be several hops deep, so a two-level walk
    # cannot pass this either.
    depths = []
    for entry in INTERPRETIVE_MODULES:
        _reached, parents = _import_closure(entry)
        for module in parents:
            depth, node = 0, module
            while node in parents:
                depth += 1
                node = parents[node]
            depths.append(depth)
    assert max(depths) >= 3, f"deepest import chain found was {max(depths)} hops"


def test_the_display_route_is_where_the_limited_systems_are_allowed() -> None:
    """The other half of the LIMIT: they are not banned outright, they are
    confined to display. If nothing reaches them at all they have been deleted,
    and this test says so instead of quietly turning green."""
    reached, _ = _import_closure("app.api.charts")
    for module, system in LIMITED_DASHA_MODULES.items():
        assert module in reached, (
            f"{system} is not reachable from the charts API — it is calculated "
            f"and displayed nowhere, so the LIMIT is now moot"
        )


# ═══ 2. Ashtottari over the whole domain ════════════════════════════════════

def test_ashtottari_years_sum_to_its_declared_cycle() -> None:
    assert sum(ASHTOTTARI_YEARS.values()) == 108
    assert set(ASHTOTTARI_YEARS) == set(ASHTOTTARI_SEQUENCE)
    assert len(ASHTOTTARI_SEQUENCE) == 8


@pytest.mark.parametrize("nakshatra,fraction,longitude", _nakshatra_longitudes())
def test_ashtottari_timeline_is_sound_at_every_nakshatra(
    nakshatra: int, fraction: float, longitude: float
) -> None:
    lord, balance, _ = calculate_opening_ashtottari(longitude, BIRTH_JD)
    assert lord in ASHTOTTARI_SEQUENCE, nakshatra
    full = ASHTOTTARI_YEARS[lord]
    assert 0.0 <= balance <= full + 1e-9, f"nakshatra {nakshatra}: balance {balance}"
    assert balance == pytest.approx(full * (1.0 - fraction), abs=1e-6), (
        f"nakshatra {nakshatra} at {fraction:.6f} elapsed: balance is not the "
        f"unelapsed remainder of its lord's period"
    )

    timeline = calculate_ashtottari_timeline(BIRTH_JD, longitude, AS_OF_JD)
    assert timeline.opening_lord == lord
    _assert_chain_is_contiguous(timeline.mahadashas, f"ashtottari n{nakshatra}")
    assert timeline.mahadashas[0].start_jd == BIRTH_JD
    _assert_partitions_parent(
        timeline.antardashas, timeline.current_mahadasha, f"ashtottari n{nakshatra}"
    )
    assert timeline.current_mahadasha.start_jd <= AS_OF_JD <= timeline.current_mahadasha.end_jd
    assert timeline.current_antardasha.start_jd <= AS_OF_JD <= timeline.current_antardasha.end_jd


def test_ashtottari_mahadasha_chain_follows_the_fixed_sequence_from_the_opening() -> None:
    """The wrap is where a sequence walk goes wrong, so it is checked across the
    full three cycles the timeline builds rather than the first few periods."""
    for nakshatra in range(1, 28):
        longitude = (nakshatra - 0.5) * NAKSHATRA_SIZE_DEGREES
        timeline = calculate_ashtottari_timeline(BIRTH_JD, longitude, AS_OF_JD)
        start = ASHTOTTARI_SEQUENCE.index(timeline.opening_lord)
        expected = [
            ASHTOTTARI_SEQUENCE[(start + i) % 8]
            for i in range(len(timeline.mahadashas))
        ]
        assert [p.lord for p in timeline.mahadashas] == expected, nakshatra


def test_ashtottari_full_cycle_after_the_clipped_opening_is_exactly_108_years() -> None:
    """The opening mahadasha is clipped to the balance; every one after it is
    full. Eight consecutive full periods must therefore span the cycle exactly,
    which is the check that a rounding drift across periods would fail."""
    timeline = calculate_ashtottari_timeline(BIRTH_JD, 100.0, AS_OF_JD)
    full = timeline.mahadashas[1:9]
    span_years = (full[-1].end_jd - full[0].start_jd) / JULIAN_YEAR_DAYS
    assert span_years == pytest.approx(108.0, abs=1e-6)


# ═══ 3. Yogini over the whole domain ════════════════════════════════════════

def test_yogini_years_sum_to_its_declared_cycle() -> None:
    assert sum(YOGINI_YEARS.values()) == 36
    assert set(YOGINI_YEARS) == set(YOGINI_SEQUENCE)
    assert len(YOGINI_SEQUENCE) == 8


@pytest.mark.parametrize("nakshatra", range(1, 28))
def test_yogini_opening_is_the_nakshatra_plus_three_walk_at_every_nakshatra(
    nakshatra: int,
) -> None:
    """`(nakshatra + 3) mod 8`, with a zero remainder meaning the *eighth*
    yogini rather than falling off the front of the list. Nakshatra 5 and 13 are
    the remainder-zero cases, and an implementation that indexed straight would
    return Mangala there instead of Sankata."""
    longitude = (nakshatra - 0.5) * NAKSHATRA_SIZE_DEGREES
    remainder = (nakshatra + 3) % 8
    expected = YOGINI_SEQUENCE[(8 if remainder == 0 else remainder) - 1]
    yogini, _, _ = calculate_opening_yogini(longitude, BIRTH_JD)
    assert yogini == expected, f"nakshatra {nakshatra}"


def test_the_remainder_zero_nakshatras_exist_so_that_case_is_really_covered() -> None:
    zero_cases = [n for n in range(1, 28) if (n + 3) % 8 == 0]
    assert zero_cases, "no nakshatra hits the remainder-zero branch"
    for nakshatra in zero_cases:
        longitude = (nakshatra - 0.5) * NAKSHATRA_SIZE_DEGREES
        assert calculate_opening_yogini(longitude, BIRTH_JD)[0] == "SANKATA"


@pytest.mark.parametrize("nakshatra,fraction,longitude", _nakshatra_longitudes())
def test_yogini_timeline_is_sound_at_every_nakshatra(
    nakshatra: int, fraction: float, longitude: float
) -> None:
    yogini, balance, _ = calculate_opening_yogini(longitude, BIRTH_JD)
    full = YOGINI_YEARS[yogini]
    assert balance == pytest.approx(full * (1.0 - fraction), abs=1e-6), nakshatra

    timeline = calculate_yogini_timeline(BIRTH_JD, longitude, AS_OF_JD)
    assert timeline.opening_yogini == yogini
    _assert_chain_is_contiguous(timeline.mahadashas, f"yogini n{nakshatra}")
    _assert_partitions_parent(
        timeline.antardashas, timeline.current_mahadasha, f"yogini n{nakshatra}"
    )
    start = YOGINI_SEQUENCE.index(yogini)
    assert [p.lord for p in timeline.mahadashas] == [
        YOGINI_SEQUENCE[(start + i) % 8] for i in range(len(timeline.mahadashas))
    ], nakshatra


def test_yogini_full_cycle_after_the_clipped_opening_is_exactly_36_years() -> None:
    timeline = calculate_yogini_timeline(BIRTH_JD, 100.0, AS_OF_JD)
    full = timeline.mahadashas[1:9]
    span_years = (full[-1].end_jd - full[0].start_jd) / JULIAN_YEAR_DAYS
    assert span_years == pytest.approx(36.0, abs=1e-6)


# ═══ 4. Kalachakra over all 108 padas ═══════════════════════════════════════

@pytest.mark.parametrize("nakshatra,pada,longitude", _pada_longitudes())
def test_kalachakra_timeline_is_sound_at_every_one_of_the_108_padas(
    nakshatra: int, pada: int, longitude: float
) -> None:
    """Kalachakra is the one system in this family with no independent second
    source in the repository, which makes internal consistency the only check
    available — so it is applied to every pada rather than to a sample."""
    timeline = calculate_kalachakra_timeline(BIRTH_JD, longitude, AS_OF_JD)
    label = f"kalachakra n{nakshatra}p{pada}"

    assert timeline.pada == pada, label
    assert timeline.opening_rasi in RASI_YEARS, label
    assert timeline.direction in set(CHAKRA_DIRECTION.values()), label
    assert 0.0 < timeline.balance_years_at_birth <= RASI_YEARS[timeline.opening_rasi]

    _assert_chain_is_contiguous(timeline.mahadashas, label)
    _assert_partitions_parent(timeline.antardashas, timeline.current_mahadasha, label)
    assert timeline.mahadashas[0].start_jd == BIRTH_JD, label
    assert timeline.mahadashas[0].rasi == timeline.opening_rasi, label


@pytest.mark.parametrize("nakshatra,pada,longitude", _pada_longitudes())
def test_every_kalachakra_cycle_spans_its_own_paramayus(
    nakshatra: int, pada: int, longitude: float
) -> None:
    """The paramayus is per-pada, so "one cycle is 100 years" is not available
    as a check. What must hold is that the periods after the clipped opening,
    taken one full sequence at a time, span exactly the paramayus this pada
    declares — which is the property that a wrong row in the pada table would
    still satisfy, and a wrong *sum* would not."""
    timeline = calculate_kalachakra_timeline(BIRTH_JD, longitude, AS_OF_JD)
    sequence_length = len(timeline.mahadashas) // 3
    assert sequence_length >= 4, f"n{nakshatra}p{pada}: implausibly short sequence"
    cycle = timeline.mahadashas[1 : 1 + sequence_length]
    span_years = (cycle[-1].end_jd - cycle[0].start_jd) / JULIAN_YEAR_DAYS
    assert span_years == pytest.approx(float(timeline.paramayus), abs=1e-6), (
        f"n{nakshatra}p{pada}: one cycle spans {span_years:.6f} years but the "
        f"declared paramayus is {timeline.paramayus}"
    )


@pytest.mark.parametrize("nakshatra,pada,_longitude", _pada_longitudes()[:12])
def test_kalachakra_expired_years_advance_monotonically_across_a_pada(
    nakshatra: int, pada: int, _longitude: float
) -> None:
    """Kalachakra maps one pada onto the *whole* paramayus, so unlike every
    other system here the opening balance does not fall monotonically — it
    sawtooths as the opening rasi walks down the sequence. What must advance
    monotonically is the **time expired**, and it must reach the paramayus at
    the far end of the pada.

    This is the assertion that certifies the pada-to-sequence mapping: an
    opening index that jumped, repeated or skipped a rasi would break the walk
    while leaving every individual balance looking plausible.
    """
    pada_start = (nakshatra - 1) * NAKSHATRA_SIZE_DEGREES + (pada - 1) * PADA_SIZE
    previous_expired = -1.0
    previous_index = -1
    for step in range(60):
        longitude = pada_start + (step / 60.0) * PADA_SIZE
        _c, got_pada, sequence, paramayus, index, balance, _e = (
            calculate_opening_kalachakra(longitude, BIRTH_JD)
        )
        assert got_pada == pada, f"n{nakshatra}p{pada} step {step} left its pada"
        expired = (
            sum(float(RASI_YEARS[r]) for r in sequence[:index])
            + float(RASI_YEARS[sequence[index]])
            - balance
        )
        assert expired > previous_expired - 1e-9, (
            f"n{nakshatra}p{pada} step {step}: expired years went backwards"
        )
        assert index >= previous_index, (
            f"n{nakshatra}p{pada} step {step}: the opening rasi walked backwards "
            f"through the sequence"
        )
        assert expired == pytest.approx(
            (step / 60.0) * paramayus, abs=1e-6
        ), f"n{nakshatra}p{pada} step {step}: expired years are not the elapsed fraction of paramayus"
        previous_expired, previous_index = expired, index


# ═══ 5. the conditional family ══════════════════════════════════════════════

@pytest.mark.parametrize("system_key", sorted(CONDITIONAL_DASHA_SYSTEMS))
def test_conditional_system_years_and_sequence_agree(system_key: str) -> None:
    system = CONDITIONAL_DASHA_SYSTEMS[system_key]
    assert sum(system.years.values()) == system.total_years, system_key
    assert set(system.years) == set(system.sequence), system_key
    assert len(system.sequence) == system.lord_count, system_key


@pytest.mark.parametrize("system_key", sorted(CONDITIONAL_DASHA_SYSTEMS))
@pytest.mark.parametrize("nakshatra", range(1, 28))
def test_conditional_timeline_is_sound_at_every_nakshatra(
    system_key: str, nakshatra: int
) -> None:
    longitude = (nakshatra - 0.5) * NAKSHATRA_SIZE_DEGREES
    timeline = calculate_timeline(system_key, BIRTH_JD, longitude, AS_OF_JD)
    label = f"{system_key} n{nakshatra}"
    system = CONDITIONAL_DASHA_SYSTEMS[system_key]

    assert timeline.opening_lord in system.sequence, label
    _assert_chain_is_contiguous(timeline.mahadashas, label)
    _assert_partitions_parent(timeline.antardashas, timeline.current_mahadasha, label)

    start = system.sequence.index(timeline.opening_lord)
    assert [p.lord for p in timeline.mahadashas] == [
        system.sequence[(start + i) % system.lord_count]
        for i in range(len(timeline.mahadashas))
    ], label


@pytest.mark.parametrize("system_key", sorted(CONDITIONAL_DASHA_SYSTEMS))
def test_conditional_full_cycle_matches_its_declared_total(system_key: str) -> None:
    system = CONDITIONAL_DASHA_SYSTEMS[system_key]
    timeline = calculate_timeline(system_key, BIRTH_JD, 100.0, AS_OF_JD)
    cycle = timeline.mahadashas[1 : 1 + system.lord_count]
    span_years = (cycle[-1].end_jd - cycle[0].start_jd) / JULIAN_YEAR_DAYS
    assert span_years == pytest.approx(float(system.total_years), abs=1e-6), system_key


# ═══ 6. Ashtottari eligibility, the one gate that exists ════════════════════

@pytest.mark.parametrize("rahu_house", range(1, 13))
def test_ashtottari_eligibility_reads_rahu_from_the_lagna_lord(rahu_house: int) -> None:
    """The rule counts kendra/trikona **from the lord of the lagna**, not from
    the lagna. Sweeping Rahu through all twelve houses pins which houses qualify
    rather than sampling one that happens to agree under both readings.
    """
    # Aries lagna, so the lagna lord is Mars; put Mars in the 1st so houses from
    # the lord and houses from the lagna coincide, then vary Rahu.
    result = evaluate_ashtottari_applicability(
        lagna_rasi=1,
        planet_house={"MARS": 1, "RAHU": rahu_house},
        paksha="SHUKLA",
        is_day_birth=True,
    )
    kendra_trikona = {1, 4, 5, 7, 9, 10}
    if rahu_house == 1:
        # Rahu in the lagna is excluded even though the 1st is a kendra.
        assert result.applicable is False, rahu_house
    else:
        assert result.applicable is (rahu_house in kendra_trikona), rahu_house


def test_ashtottari_eligibility_is_indeterminate_not_false_without_rahu() -> None:
    """"We cannot tell" and "no" are different answers, and collapsing them
    would present an unevaluated chart as an ineligible one."""
    result = evaluate_ashtottari_applicability(
        lagna_rasi=1, planet_house={"MARS": 1}, paksha=None, is_day_birth=None
    )
    assert result.applicable is None


def test_ashtottari_eligibility_never_lets_the_paksha_qualifier_decide() -> None:
    """The paksha reading is secondary by doctrine. Flipping it must not flip
    the primary verdict — otherwise a qualifier has quietly become a gate."""
    base = {"lagna_rasi": 1, "planet_house": {"MARS": 1, "RAHU": 4}}
    day = evaluate_ashtottari_applicability(**base, paksha="SHUKLA", is_day_birth=True)
    night = evaluate_ashtottari_applicability(**base, paksha="KRISHNA", is_day_birth=False)
    assert day.applicable == night.applicable


# ═══ 7. DAS-08 — the Jaimini 8-karaka reverse-Rahu scheme ═══════════════════

def _chart(**degrees_in_sign: float) -> dict[str, float]:
    """Longitudes placing each graha at a stated degree of Aries..Pisces in the
    order given, so the karaka ranking depends only on the degrees."""
    return {
        planet: 30.0 * index + degree
        for index, (planet, degree) in enumerate(degrees_in_sign.items())
    }


def test_all_eight_karakas_are_assigned_in_strictly_descending_degree() -> None:
    longitudes = _chart(
        SUN=1.0, MOON=3.0, MARS=5.0, MERCURY=7.0,
        JUPITER=9.0, VENUS=11.0, SATURN=13.0, RAHU=15.0,
    )
    karakas = compute_char_karakas(longitudes)
    assert list(karakas) == CHARA_KARAKA_ORDER
    assert len(set(karakas.values())) == 8

    def effective(planet: str) -> float:
        degree = longitudes[planet] % 30.0
        return 30.0 - degree if planet == "RAHU" else degree

    ranked = [effective(karakas[name]) for name in CHARA_KARAKA_ORDER]
    assert ranked == sorted(ranked, reverse=True)
    assert len(set(ranked)) == 8, "the fixture must not contain a tie"


def test_rahus_degree_is_counted_in_reverse() -> None:
    """`DAS-08`'s named variant. Rahu at 2° of its sign has an effective degree
    of 28 and must outrank a graha at 27° — under forward counting it would rank
    last. This is the assertion the whole [VARIANT] marker rests on."""
    karakas = compute_char_karakas(
        _chart(
            SUN=27.0, MOON=1.0, MARS=1.5, MERCURY=2.0,
            JUPITER=2.5, VENUS=3.0, SATURN=3.5, RAHU=2.0,
        )
    )
    assert karakas["ATMAKARAKA"] == "RAHU"
    assert karakas["AMATYAKARAKA"] == "SUN"


def test_ketu_is_excluded_even_holding_the_highest_degree() -> None:
    longitudes = _chart(
        SUN=1.0, MOON=2.0, MARS=3.0, MERCURY=4.0,
        JUPITER=5.0, VENUS=6.0, SATURN=7.0, RAHU=25.0,
    )
    longitudes["KETU"] = 29.9
    assert "KETU" not in compute_char_karakas(longitudes).values()


def test_the_tie_break_is_the_documented_dignity_order() -> None:
    """Two grahas at the same effective degree. The earlier in Sun > Moon >
    Mars > Mercury > Jupiter > Venus > Saturn > Rahu keeps the higher karaka —
    a stated rule, not whatever the sort happened to do."""
    karakas = compute_char_karakas(
        _chart(
            SUN=20.0, MOON=20.0, MARS=3.0, MERCURY=4.0,
            JUPITER=5.0, VENUS=6.0, SATURN=7.0, RAHU=28.0,
        )
    )
    # Sun and Moon are both at 20°, the highest effective degree in the chart
    # (Rahu at 28° reverses to 2°). Sun precedes Moon in the dignity order, so
    # Sun takes Atmakaraka and Moon the next karaka down.
    assert karakas["ATMAKARAKA"] == "SUN"
    assert karakas["AMATYAKARAKA"] == "MOON"


def test_the_tie_break_does_not_depend_on_mapping_insertion_order() -> None:
    """The same tie, fed in reversed insertion order. If the ranking ever fell
    back on dict ordering, this would hand Atmakaraka to the Moon."""
    tied = _chart(
        SUN=20.0, MOON=20.0, MARS=3.0, MERCURY=4.0,
        JUPITER=5.0, VENUS=6.0, SATURN=7.0, RAHU=28.0,
    )
    reversed_order = dict(reversed(list(tied.items())))
    assert compute_char_karakas(reversed_order) == compute_char_karakas(tied)


@pytest.mark.parametrize("degree", [0.0, 29.999999])
def test_karaka_degrees_behave_at_the_edges_of_a_sign(degree: float) -> None:
    """0° and the last sliver are where a `% 30.0` and a `30.0 -` meet. A graha
    at 0° has the lowest possible effective degree and Rahu at 0° the highest,
    which is the reversal stated as an edge case rather than a midpoint."""
    others = {
        "MOON": 15.0, "MARS": 15.0, "MERCURY": 15.0,
        "JUPITER": 15.0, "VENUS": 15.0, "SATURN": 15.0,
    }
    if degree == 0.0:
        assert compute_char_karakas(_chart(SUN=0.0, **others, RAHU=0.0))[
            "ATMAKARAKA"
        ] == "RAHU"
        assert compute_char_karakas(_chart(SUN=0.0, **others, RAHU=29.999999))[
            "DAARAKARAKA"
        ] in {"SUN", "RAHU"}
    else:
        karakas = compute_char_karakas(_chart(SUN=degree, **others, RAHU=degree))
        assert karakas["ATMAKARAKA"] == "SUN"
        assert karakas["DAARAKARAKA"] == "RAHU"


def test_the_karaka_scheme_is_eight_not_seven() -> None:
    """The ratified default. A seven-karaka variant drops Daarakaraka, so its
    absence from the order is the change this pins against."""
    assert len(CHARA_KARAKA_ORDER) == 8
    assert CHARA_KARAKA_ORDER[-1] == "DAARAKARAKA"


# ═══ 8. the manifest describes the code it claims to describe ═══════════════

def test_every_limited_module_has_a_certification_entry() -> None:
    for system in LIMITED_DASHA_MODULES.values():
        assert system in SECONDARY_DASHA_CERTIFICATIONS, system
        assert SECONDARY_DASHA_CERTIFICATIONS[system].may_feed_interpretation is False


@pytest.mark.parametrize("key", sorted(SECONDARY_DASHA_CERTIFICATIONS))
def test_certification_entries_are_complete(key: str) -> None:
    """The `uncertified` list is the point of the manifest. An entry that
    certifies everything and admits nothing is the state this file was written
    to make impossible — so an empty `uncertified` fails."""
    entry = SECONDARY_DASHA_CERTIFICATIONS[key]
    assert entry.key == key
    assert entry.rulebook_id.startswith("DAS-")
    assert entry.marker in {"[LIMIT]", "[VARIANT]"}
    assert entry.certified, f"{key} certifies nothing"
    assert entry.uncertified, (
        f"{key} claims nothing is left unverified — say what a second source or "
        f"an astrologer would still have to confirm"
    )
    assert entry.eligibility_rule, key
    assert entry.source, key


def test_declared_cycle_years_match_the_modules() -> None:
    assert SECONDARY_DASHA_CERTIFICATIONS["ASHTOTTARI"].cycle_years == 108.0
    assert SECONDARY_DASHA_CERTIFICATIONS["YOGINI"].cycle_years == 36.0
    assert SECONDARY_DASHA_CERTIFICATIONS["ASHTOTTARI"].lord_count == 8
    assert SECONDARY_DASHA_CERTIFICATIONS["YOGINI"].lord_count == 8
    assert SECONDARY_DASHA_CERTIFICATIONS["KALACHAKRA"].lord_count == len(RASI_YEARS)
    assert SECONDARY_DASHA_CERTIFICATIONS["CONDITIONAL"].lord_count == len(
        CONDITIONAL_DASHA_SYSTEMS
    )
    assert SECONDARY_DASHA_CERTIFICATIONS["CHARA_KARAKA"].lord_count == len(
        CHARA_KARAKA_ORDER
    )


@pytest.mark.parametrize("key", sorted(SECONDARY_DASHA_CERTIFICATIONS))
def test_declared_eligibility_evaluator_exists_exactly_when_claimed(key: str) -> None:
    """A system that grows an eligibility gate must update its entry. Without
    this, `eligibility_evaluator=None` decays from "no gate by doctrine" into
    "nobody updated the manifest"."""
    import importlib

    entry = SECONDARY_DASHA_CERTIFICATIONS[key]
    module_name = {
        "ASHTOTTARI": "app.calculations.ashtottari_dasha",
        "YOGINI": "app.calculations.yogini_dasha",
        "KALACHAKRA": "app.calculations.kalachakra_dasha",
        "CONDITIONAL": "app.calculations.conditional_dashas",
        "CHARA": "app.calculations.jaimini_dasha",
        "CHARA_KARAKA": "app.calculations.jaimini_karakas",
    }[key]
    module = importlib.import_module(module_name)
    if entry.eligibility_evaluator is None:
        found = [
            name
            for name in dir(module)
            if name.startswith(("evaluate_", "is_applicable", "applicability_"))
        ]
        assert not found, (
            f"{key} declares no eligibility evaluator but {module_name} defines "
            f"{found} — record the rule in its certification entry"
        )
    else:
        assert callable(getattr(module, entry.eligibility_evaluator)), key


def test_chara_karaka_is_the_only_system_allowed_into_interpretation() -> None:
    """DAS-08 is a [VARIANT], not a [LIMIT], and `chart_signature` reads the
    Atmakaraka. Stated as an assertion so that flipping any other entry to True
    requires deleting this line and thinking about why."""
    allowed = {
        key
        for key, entry in SECONDARY_DASHA_CERTIFICATIONS.items()
        if entry.may_feed_interpretation
    }
    assert allowed == {"CHARA_KARAKA"}
