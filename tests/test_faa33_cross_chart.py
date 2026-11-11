"""FAA-33 cross-chart observations (docs/GROUP_D_SPECS_2026-11-11.md D1 + §0.3).

Synthetic rasi placements only; no person, no birth data.
"""
from __future__ import annotations

from dataclasses import replace
from types import SimpleNamespace

import pytest

import app.calculations.compatibility_intelligence as ci_module
from app.calculations.astro import house_from_reference
from app.calculations.cross_chart import (
    ChartPoints,
    chart_points_from_snapshot,
    cross_chart_observations,
    house_status,
    one_way,
    seventh_lord_of,
)

_GRAHAS = ("SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN", "RAHU", "KETU")

# A: Mesha lagna, so the 7th is Thula and its lord Venus. A's Venus is in Mithuna.
A = ChartPoints(1, {"SUN": 10, "MOON": 5, "MARS": 2, "MERCURY": 11, "JUPITER": 9,
                    "VENUS": 3, "SATURN": 6, "RAHU": 4, "KETU": 10})
# B: Thula lagna, so B's 7th rasi is Mesha = A's lagna. B's Venus is elsewhere (Makara).
B = ChartPoints(7, {"SUN": 1, "MOON": 10, "MARS": 8, "MERCURY": 12, "JUPITER": 1,
                    "VENUS": 10, "SATURN": 3, "RAHU": 6, "KETU": 12})


def _rows(rows, direction, key):
    return [r for r in rows if r.direction == direction and r.key == key]


def test_status_table_matches_the_ruling_for_every_house():
    expected = {1: "SUPPORT", 5: "SUPPORT", 7: "SUPPORT", 9: "SUPPORT",
                11: "NOTE", 6: "NOTE", 8: "NOTE", 12: "NOTE",
                2: "NEUTRAL", 3: "NEUTRAL", 4: "NEUTRAL", 10: "NEUTRAL"}
    assert {h: house_status(h) for h in range(1, 13)} == expected
    with pytest.raises(ValueError):
        house_status(13)


def test_each_row_has_exactly_one_reference():
    for r in cross_chart_observations(A, B):
        assert (r.house_from_lagna is None) != (r.house_from_moon is None), r
        assert r.tier == "engine_inference"


def test_seventh_lord_reads_the_source_charts_own_placement_not_the_partners():
    """Rulings §2.3 check 1. A's 7th lord is Venus; A's Venus (Mithuna, 3) and
    B's Venus (Makara, 10) differ, so substituting B's would change the house."""
    assert seventh_lord_of(A.lagna_rasi) == "VENUS"
    lagna_row, moon_row = _rows(cross_chart_observations(A, B), "A_TO_B", "SEVENTH_LORD")
    assert lagna_row.graha == "VENUS" and lagna_row.rasi == 3
    assert lagna_row.house_from_lagna == house_from_reference(7, 3) == 9
    assert moon_row.house_from_moon == house_from_reference(10, 3) == 6
    assert lagna_row.status == "SUPPORT" and moon_row.status == "NOTE"


def test_lagna_on_partners_seventh_shows_in_both_directions():
    """Spec D1 acceptance: A's lagna is B's 7th rasi."""
    rows = cross_chart_observations(A, B)
    (ab,) = _rows(rows, "A_TO_B", "LAGNA")
    (ba,) = _rows(rows, "B_TO_A", "LAGNA")
    assert ab.house_from_lagna == 7 and ba.house_from_lagna == 7
    assert ab.status == ba.status == "SUPPORT"


def test_moon_from_lagna_and_moon_from_moon_are_separate_rows():
    from_lagna, from_moon = _rows(cross_chart_observations(A, B), "A_TO_B", "MOON")
    assert from_lagna.house_from_lagna == house_from_reference(B.lagna_rasi, A.moon_rasi)
    assert from_moon.house_from_moon == house_from_reference(B.moon_rasi, A.moon_rasi)
    assert from_lagna.house_from_moon is None and from_moon.house_from_lagna is None


def test_venus_and_guru_overlay_is_support_only_on_the_partners_seventh():
    rows = cross_chart_observations(A, B)
    # B's Guru (Mesha, 1) is A's lagna sign, which is A's 1st, not 7th.
    (b_guru,) = _rows(rows, "B_TO_A", "JUPITER")
    assert b_guru.house_from_lagna == 1 and b_guru.status == "NEUTRAL"
    # Put A's Guru on B's 7th (Mesha).
    a_on = replace(A, planet_rasi={**A.planet_rasi, "JUPITER": 1})
    (a_guru,) = _rows(cross_chart_observations(a_on, B), "A_TO_B", "JUPITER")
    assert a_guru.house_from_lagna == 7 and a_guru.status == "SUPPORT"


def test_swapping_the_charts_swaps_the_directions_and_nothing_else():
    """Each direction is computed, not mirrored: swapping the inputs must give
    exactly the other direction's rows."""
    ab = cross_chart_observations(A, B)
    ba = cross_chart_observations(B, A)
    flip = {"A_TO_B": "B_TO_A", "B_TO_A": "A_TO_B"}
    swapped = [replace(r, direction=flip[r.direction]) for r in ba]
    # A->B rows come first in `ab`; in `ba` they are the second half.
    assert swapped[7:] + swapped[:7] == list(ab)


def test_directions_are_not_symmetric_copies():
    """With asymmetric charts the two directions differ; a one-direction-reused
    bug would make them equal."""
    rows = cross_chart_observations(A, B)
    ab = [(r.key, r.house_from_lagna, r.house_from_moon) for r in rows if r.direction == "A_TO_B"]
    ba = [(r.key, r.house_from_lagna, r.house_from_moon) for r in rows if r.direction == "B_TO_A"]
    assert ab != ba


def test_one_way_never_reads_the_destinations_planets():
    """Scramble every planet in the destination except its Moon: A->B rows must
    not move (they read only B's lagna and Moon)."""
    scrambled = ChartPoints(B.lagna_rasi, {g: (B.planet_rasi[g] if g == "MOON" else 2) for g in _GRAHAS})
    assert one_way(A, B, "A_TO_B") == one_way(A, scrambled, "A_TO_B")


def _snap(points: ChartPoints) -> SimpleNamespace:
    return SimpleNamespace(data=SimpleNamespace(
        lagna=SimpleNamespace(rasi=points.lagna_rasi),
        planets=[SimpleNamespace(graha=g, rasi=r) for g, r in points.planet_rasi.items()],
    ))


def test_snapshot_adapter_reads_lagna_and_planets():
    assert chart_points_from_snapshot(_snap(A)) == A


def test_cross_chart_rows_reach_the_report_and_move_no_number(monkeypatch):
    """Score unchanged: the composite and its breakdown are identical with the
    real rows and with none, so the rows carry no points."""
    from tests.test_compatibility_intelligence import _fake_porutham_result, _stub_strong_layers

    _stub_strong_layers(monkeypatch)
    porutham = _fake_porutham_result(rajju_dosha=False, vedha_dosha=False)

    def run():
        return ci_module.compute_compatibility_intelligence(
            snap_a=_snap(A), snap_b=_snap(B), porutham_result=porutham, synastry_score=60,
        )

    without = run()
    monkeypatch.setattr(ci_module, "_cross_chart", lambda a, b: cross_chart_observations(
        chart_points_from_snapshot(a), chart_points_from_snapshot(b)))
    with_rows = run()

    assert without.cross_chart == ()
    assert len(with_rows.cross_chart) == 14  # 7 rows per direction
    assert with_rows.score_breakdown == without.score_breakdown
    assert (with_rows.overall_score, with_rows.overall_label) == (without.overall_score, without.overall_label)
    assert with_rows.strengths_en == without.strengths_en and with_rows.risks_en == without.risks_en
