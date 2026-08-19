"""Release-gate invariants for the published rulebook.

A 2026-08-18 external release-gate review made a specific request: stop spot-
checking the doctrine and mechanically assert the things a table transcription
error would break. Every test here is that kind of assertion — a shape, an
exhaustive sweep, or a property that must hold for all inputs — rather than a
worked example. Worked examples live in the per-module test files; this file is
the net underneath them.

Each test names the rulebook ID it protects, so a doctrine change that
legitimately breaks one of these tells the next reader exactly which published
rule to update alongside it.
"""
from __future__ import annotations

import itertools

import pytest

pytestmark = pytest.mark.no_db

from app.calculations import festivals as FE
from app.calculations import panchangam as PA
from app.calculations import porutham as PO
from app.calculations import transits as TR
from app.calculations._yoga_helpers import TAMIL_SEVVAI_HOUSES
from app.calculations.compatibility_intelligence import (
    _MOON_HARMONY_TABLE,
    _moon_harmony_label,
)
from app.calculations.dasha import DASHA_YEARS
from app.calculations.porutham import compute_porutham
from app.data import kuligai_polarity as KU

ALL_NAKSHATRAS = range(1, 28)
ALL_RASIS = range(1, 13)


# ---------------------------------------------------------------------------
# PAN-12 — the 7 x 27 Amirdhadhi grid. A shifted row is 27 wrong days.
# ---------------------------------------------------------------------------
def test_amirdhadhi_grid_is_exactly_seven_by_twentyseven():
    assert sorted(PA.AMIRDHADHI_YOGAM_TABLE) == list(range(7))
    for weekday, row in PA.AMIRDHADHI_YOGAM_TABLE.items():
        assert len(row) == 27, f"weekday {weekday} has {len(row)} cells, not 27"


def test_amirdhadhi_cells_are_all_declared_classes():
    """Every cell must be a class the label map can render.

    A typo'd cell would otherwise surface as a KeyError on one weekday/star
    combination — roughly once a month, in production, for one user.
    """
    for weekday, row in PA.AMIRDHADHI_YOGAM_TABLE.items():
        for index, cell in enumerate(row):
            assert cell in PA.AMIRDHADHI_YOGAM_LABELS, (
                f"weekday {weekday}, nakshatra {index + 1}: unknown class {cell!r}"
            )


def test_amirdhadhi_every_weekday_carries_at_least_one_good_day():
    """No weekday may be uniformly adverse — that shape means a lost row."""
    for weekday, row in PA.AMIRDHADHI_YOGAM_TABLE.items():
        assert "A" in row, f"weekday {weekday} has no Amirtha cell at all"


# ---------------------------------------------------------------------------
# PAN-06 / PAN-07 — daylight eighths and Gowri sequences
# ---------------------------------------------------------------------------
@pytest.mark.parametrize(
    "table,name",
    [(PA.RAHU_SLOT, "Rahu Kalam"), (PA.YAMA_SLOT, "Yamagandam"), (PA.KULIGAI_SLOT, "Kuligai")],
)
def test_daylight_kalam_slots_are_a_permutation_per_weekday(table, name):
    """Each kalam occupies a distinct one of the eight parts on each weekday.

    Seven weekdays over eight slots: one slot must be unused per kalam, and no
    slot may serve two weekdays — that is what makes the printed almanac tables
    a rotation rather than a coincidence.
    """
    assert sorted(table) == sorted(range(7)), f"{name} is missing a weekday"
    slots = sorted(table.values())
    assert len(set(slots)) == 7, f"{name} reuses a daylight slot across weekdays"
    assert all(1 <= slot <= 8 for slot in slots), f"{name} has an out-of-range slot"


@pytest.mark.parametrize("table,name", [(PA.GOWRI_DAY_TABLE, "day"), (PA.GOWRI_NIGHT_TABLE, "night")])
def test_gowri_rows_are_eight_slots_of_known_kalas(table, name):
    known = set(PA.GOWRI_ROTATING_KALAS) | {"VISHAM"}
    assert sorted(table) == sorted(range(7))
    for weekday, row in table.items():
        assert len(row) == 8, f"Gowri {name} weekday {weekday} has {len(row)} slots"
        assert set(row) <= known, f"Gowri {name} weekday {weekday} has an unknown kala"


def test_gowri_every_weekday_offers_a_good_kala_in_daylight():
    """Nalla Neram must exist on every weekday, or a surface renders empty."""
    for weekday, row in PA.GOWRI_DAY_TABLE.items():
        assert set(row) & PA.GOWRI_GOOD_NAMES, f"weekday {weekday} has no good day kala"


# ---------------------------------------------------------------------------
# PAN-08 / MUH-07 — Hora is one equal-hour implementation, shared
# ---------------------------------------------------------------------------
def test_hora_is_twentyfour_equal_sixty_minute_periods():
    assert PA._HORAS_PER_DAY == 24
    assert PA._HORA_DURATION.total_seconds() == 60 * 60


def test_hora_lord_chain_is_the_seven_classical_lords_once_each():
    assert len(PA._HORA_SEQUENCE) == 7
    assert len(set(PA._HORA_SEQUENCE)) == 7


# ---------------------------------------------------------------------------
# PAN-11 — Jeevan/Nethiram stay total functions over the whole ring
# ---------------------------------------------------------------------------
@pytest.mark.parametrize("sun_nak", range(27))
def test_jeevan_and_nethiram_are_renderable_for_every_star_pair(sun_nak):
    """All 729 Sun x Moon nakshatra pairs must land on a printable label.

    The cutoffs are ladders with an implicit else-branch; a future edit that
    reorders them could produce a value with no label, which reaches the reader
    as a blank field rather than an error.
    """
    for moon_nak in range(27):
        assert PA._jeevan_value(sun_nak, moon_nak) in PA.JEEVAN_LABELS
        assert PA._nethiram_value(sun_nak, moon_nak) in PA.NETHIRAM_LABELS


# ---------------------------------------------------------------------------
# POR-02..POR-08 — exhaustive porutham sweep. 729 pairs; there is no reason
# to spot-check a space this small.
# ---------------------------------------------------------------------------
@pytest.mark.parametrize("girl_nak", ALL_NAKSHATRAS)
def test_all_729_nakshatra_pairs_produce_a_wellformed_result(girl_nak):
    for boy_nak in ALL_NAKSHATRAS:
        # Rasi is independent of nakshatra here on purpose: the point is that no
        # nakshatra pair can crash or produce an out-of-range aggregate.
        result = compute_porutham(
            boy_nakshatra=boy_nak,
            girl_nakshatra=girl_nak,
            boy_rasi=(boy_nak % 12) + 1,
            girl_rasi=(girl_nak % 12) + 1,
        )
        assert len(result.kutas) == 10
        assert result.max_score == 10
        assert 0 <= result.total_score <= result.max_score
        assert 0 <= result.percentage <= 100
        assert result.label
        for kuta in result.kutas:
            assert kuta.passed in (True, False)
        # A Rajju or Vedha failure must cap the headline (POR-09). Assert it
        # here for every pair, not only the two worked examples.
        if result.rajju_dosha or result.vedha_dosha:
            assert result.label.upper() != "EXCELLENT", (
                f"boy {boy_nak} / girl {girl_nak}: hard dosha did not cap the label"
            )


@pytest.mark.parametrize(
    "score_fn",
    [
        PO._dinam_score, PO._ganam_score, PO._mahendra_score,
        PO._stree_dirgha_score, PO._yoni_score, PO._rajju_score, PO._vedha_score,
    ],
)
def test_every_nakshatra_kuta_is_binary_over_all_729_pairs(score_fn):
    for boy, girl in itertools.product(ALL_NAKSHATRAS, ALL_NAKSHATRAS):
        assert score_fn(boy, girl) in (0, 1), f"{score_fn.__name__}({boy},{girl}) is not binary"


def test_nakshatra_keyed_tables_cover_all_27_stars():
    for name, table in (
        ("Gana", PO.GANA_BY_NAKSHATRA),
        ("Yoni", PO.YONI_BY_NAKSHATRA),
        ("Rajju", PO._RAJJU_GROUP),
        ("Nadi", PO._NAKSHATRA_NADI),
    ):
        assert sorted(table) == list(ALL_NAKSHATRAS), f"{name} table does not cover 1-27"


def test_vasya_table_covers_all_12_rasis():
    assert sorted(PO._VASYA) == list(ALL_RASIS)
    for rasi, targets in PO._VASYA.items():
        assert all(1 <= t <= 12 for t in targets), f"Vasya row {rasi} has an out-of-range rasi"


def test_graha_maitri_is_defined_for_every_ordered_pair_of_rasi_lords():
    """A missing cell would silently read as neutral and pass the kuta."""
    lords = sorted(set(PO.SIGN_LORD.values()))
    for a, b in itertools.product(lords, lords):
        if a == b:
            continue
        assert (a, b) in PO._GRAHA_RELATION, f"no Graha Maitri entry for {a} -> {b}"
        assert PO._GRAHA_RELATION[(a, b)] in (0.0, 0.5, 1.0)


# ---------------------------------------------------------------------------
# POR-06 — Rajju has no eka-nakshatra exemption. This regressed once.
# ---------------------------------------------------------------------------
@pytest.mark.parametrize("nak", ALL_NAKSHATRAS)
def test_same_nakshatra_always_fails_rajju(nak):
    assert PO._rajju_score(nak, nak) == 0


def test_rajju_groups_are_the_five_tent_positions():
    assert sorted(set(PO._RAJJU_GROUP.values())) == [1, 2, 3, 4, 5]


# ---------------------------------------------------------------------------
# POR-07 — the Mrigashira / Chitra / Dhanishta triad. Losing Chitra's edges
# is the exact defect that shipped before, so pin all three edges by name.
# ---------------------------------------------------------------------------
_MRIGASHIRA, _CHITRA, _DHANISHTA = 5, 14, 23


@pytest.mark.parametrize(
    "a,b",
    [
        (_MRIGASHIRA, _CHITRA),
        (_MRIGASHIRA, _DHANISHTA),
        (_CHITRA, _DHANISHTA),
    ],
)
def test_vedha_triad_fires_in_both_directions(a, b):
    assert PO._vedha_score(a, b) == 0, "Vedha triad edge does not fire"
    assert PO._vedha_score(b, a) == 0, "Vedha is not symmetric for this edge"


def test_no_nakshatra_is_structurally_vedha_exempt():
    """27 is odd, so a pure pairing must leave one star uncovered.

    That arithmetic residue is precisely how the dropped Chitra edge hid: any
    table of 13 pairs necessarily exempts exactly one nakshatra from the veto.
    """
    covered = {star for pair in PO._VEDHA_PAIRS for star in pair}
    assert covered == set(ALL_NAKSHATRAS), (
        f"nakshatras with no Vedha partner: {sorted(set(ALL_NAKSHATRAS) - covered)}"
    )


def test_vedha_is_symmetric_across_the_whole_table():
    for boy, girl in itertools.product(ALL_NAKSHATRAS, ALL_NAKSHATRAS):
        assert PO._vedha_score(boy, girl) == PO._vedha_score(girl, boy)


# ---------------------------------------------------------------------------
# POR-12 — Moon-Moon harmony
# ---------------------------------------------------------------------------
def test_moon_harmony_table_covers_all_twelve_positions():
    assert sorted(_MOON_HARMONY_TABLE) == list(ALL_RASIS)
    assert set(_MOON_HARMONY_TABLE.values()) <= {"EXCELLENT", "GOOD", "MIXED", "TENSE"}


def test_moon_harmony_is_symmetric_for_every_rasi_pair():
    """`POR-12` claims symmetry; assert it rather than trusting the keying."""
    for a, b in itertools.product(ALL_RASIS, ALL_RASIS):
        assert _moon_harmony_label(a, b) == _moon_harmony_label(b, a)


def test_moon_harmony_keeps_the_classical_groupings_paired():
    for near, far in ((2, 12), (3, 11), (4, 10), (5, 9), (6, 8)):
        assert _MOON_HARMONY_TABLE[near] == _MOON_HARMONY_TABLE[far], (
            f"positions {near} and {far} are one classical grouping and must share a label"
        )


# ---------------------------------------------------------------------------
# DAS-02 — Vimshottari totals 120 years
# ---------------------------------------------------------------------------
def test_vimshottari_periods_total_one_hundred_twenty_years():
    assert sum(DASHA_YEARS.values()) == 120


def test_vimshottari_covers_the_nine_grahas_of_the_sequence():
    assert set(DASHA_YEARS) == {
        "KETU", "VENUS", "SUN", "MOON", "MARS", "RAHU", "JUPITER", "SATURN", "MERCURY",
    }


# ---------------------------------------------------------------------------
# GO-05 — transit Vedha
# ---------------------------------------------------------------------------
def test_transit_vedha_houses_are_all_in_range():
    for planet, entries in TR.VEDHA_TABLE.items():
        for good_house, blocking_house in entries.items():
            assert 1 <= good_house <= 12, f"{planet}: good house {good_house} out of range"
            assert 1 <= blocking_house <= 12, f"{planet}: blocker {blocking_house} out of range"
            assert good_house != blocking_house, f"{planet}: house {good_house} blocks itself"


def test_transit_vedha_exemptions_are_the_two_classical_pairs():
    assert TR._VEDHA_EXEMPT_PAIRS == frozenset(
        {frozenset({"SUN", "SATURN"}), frozenset({"MOON", "MERCURY"})}
    )


# ---------------------------------------------------------------------------
# GO-06 / GO-09 / GO-10 — the Sani cycles fire on exactly their own positions
# ---------------------------------------------------------------------------
def test_sade_sati_activates_only_on_the_twelfth_first_and_second():
    active = {
        position
        for position in ALL_RASIS
        if TR.classify_sani_cycle(position).is_active
    }
    assert {12, 1, 2} <= active, "Sade Sati must cover 12, 1 and 2 from Janma Rasi"
    assert active <= {12, 1, 2, 4, 8}, (
        "the Moon-reference Sani classifier fired outside 12/1/2 (Ezharai) and "
        f"4/8 (Ardha Ashtama / Ashtama): {sorted(active)}"
    )


def test_kandaka_sani_activates_only_on_the_four_kendras_from_lagna():
    active = {
        position
        for position in ALL_RASIS
        if TR.classify_kandaka_cycle(position).is_active
    }
    assert active == {1, 4, 7, 10}, (
        "GO-10 declares Kandaka Sani as Saturn in 1/4/7/10 from Lagna; the code "
        f"fires on {sorted(active)}. If doctrine changed, update GO-10 and the "
        "appendix in the same commit."
    )


def test_murthi_table_covers_all_twelve_counts_in_four_grades():
    table = TR.EZHARAI_SANI_MURTHI_BY_INGRESS_COUNT
    assert sorted(table) == list(ALL_RASIS)
    grades = {meta["grade"] for meta in table.values()}
    assert grades == {"GOLD", "SILVER", "COPPER", "IRON"}
    for grade in grades:
        counts = [count for count, meta in table.items() if meta["grade"] == grade]
        assert len(counts) == 3, f"Murthi grade {grade} covers {len(counts)} counts, not 3"


# ---------------------------------------------------------------------------
# GO-03 / GO-04 — combustion and gandanta thresholds
# ---------------------------------------------------------------------------
def test_combustion_orbs_exclude_the_moon():
    """`GO-04` routes Moon-near-Sun through Amavasai, not combustion.

    A Moon entry appearing here would silently double-count that condition.
    """
    assert "MOON" not in TR.COMBUST_ORBS
    assert "SUN" not in TR.COMBUST_ORBS


def test_combustion_orbs_are_positive_and_retrograde_is_never_wider():
    for planet, orbs in TR.COMBUST_ORBS.items():
        assert orbs["direct"] > 0 and orbs["retrograde"] > 0, planet
        assert orbs["retrograde"] <= orbs["direct"], (
            f"{planet}: retrograde combustion orb is wider than direct"
        )


def test_gandanta_ranges_sit_at_the_water_fire_junctions():
    """Six ranges of 3 deg 20 min, straddling the Pisces/Aries, Cancer/Leo and
    Scorpio/Sagittarius boundaries."""
    assert len(TR.GANDANTA_RANGES) == 6
    for lo, hi in TR.GANDANTA_RANGES:
        assert 0.0 <= lo < hi <= 360.0
        assert hi - lo == pytest.approx(10 / 3, abs=1e-6)


# ---------------------------------------------------------------------------
# DOS-01 — Sevvai house set
# ---------------------------------------------------------------------------
def test_sevvai_house_set_is_the_declared_tamil_six():
    assert TAMIL_SEVVAI_HOUSES == {1, 2, 4, 7, 8, 12}, (
        "DOS-01 publishes the house set as 1/2/4/7/8/12 from Lagna, Moon and "
        "Venus. Changing it means changing the rulebook and the appendix too."
    )


# ---------------------------------------------------------------------------
# MUH-06 — Kuligai polarity
# ---------------------------------------------------------------------------
def test_kuligai_polarity_classes_do_not_overlap():
    """One activity, one polarity — `polarity_for` checks the sets in order, so
    an overlap would resolve silently by set-check order rather than by ruling.
    """
    assert not (KU.FAVOURABLE & KU.ADVERSE)
    assert not (KU.FAVOURABLE & KU.NEUTRALISED)
    assert not (KU.ADVERSE & KU.NEUTRALISED)


def test_kuligai_activity_keys_are_normalised_uppercase():
    """`polarity_for` upper-cases its argument; a lowercase key never matches."""
    for key in KU.FAVOURABLE | KU.ADVERSE | KU.NEUTRALISED:
        assert key == key.strip().upper(), f"unreachable Kuligai key {key!r}"


def test_kuligai_unknown_activity_is_unspecified_not_adverse():
    """Defaulting an unclassified activity to rejection is the defect
    EC-RULING-07 corrected; pin it so it cannot come back."""
    assert KU.polarity_for("NO_SUCH_ACTIVITY") is KU.KuligaiPolarity.UNSPECIFIED
    assert not KU.rejects("NO_SUCH_ACTIVITY")
    assert not KU.favours("NO_SUCH_ACTIVITY")


def test_kuligai_marriage_is_adverse_and_gold_is_favourable():
    """The owner's two worked examples, which give the whole table its sign."""
    assert KU.polarity_for("MARRIAGE") is KU.KuligaiPolarity.ADVERSE
    assert KU.polarity_for("GOLD") is KU.KuligaiPolarity.FAVOURABLE


# ---------------------------------------------------------------------------
# PAN-17 — festival coverage boundary must stay declared
# ---------------------------------------------------------------------------
def test_gazetted_festival_coverage_matches_the_yearly_table():
    assert FE.GAZETTED_FESTIVAL_YEARS == frozenset(FE._YEARLY_FESTIVALS)
    assert FE.GAZETTED_FESTIVAL_YEARS, "gazetted coverage cannot be empty"


def test_gazetted_coverage_years_are_contiguous():
    """A gap would mean one year silently renders thinner than its neighbours."""
    first, last = FE.gazetted_coverage_bounds()
    assert set(range(first, last + 1)) == set(FE.GAZETTED_FESTIVAL_YEARS)


def test_gazetted_coverage_helper_agrees_with_the_constant():
    first, last = FE.gazetted_coverage_bounds()
    assert FE.has_gazetted_coverage(first)
    assert FE.has_gazetted_coverage(last)
    assert not FE.has_gazetted_coverage(last + 1)


def test_rulebook_states_the_actual_festival_coverage_boundary():
    """`PAN-17` must name the real boundary, not an aspiration.

    This is the test that turns a published limit into a maintained one: extend
    coverage and this fails until the rulebook is updated to match.
    """
    from pathlib import Path

    rulebook = Path(__file__).resolve().parents[1] / "docs" / "VINAADI_ASTROLOGY_RULEBOOK_FOR_EXTERNAL_REVIEW.md"
    text = rulebook.read_text(encoding="utf-8")
    first, last = FE.gazetted_coverage_bounds()
    assert f"{first}-{last}" in text or f"{first}–{last}" in text, (
        f"PAN-17 does not state the gazetted coverage range {first}-{last}"
    )
