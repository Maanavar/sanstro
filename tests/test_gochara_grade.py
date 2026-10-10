"""Guru / Sani gochara from the Janma Rasi — astrologer rulings D2/D3 (2026-10-04).

Pins the doctrine table and the places that read it:

* D2 — Sani is supportive only in 3/6/11; every other house needs care (no
  neutral band), and the named Sani periods stay a separate axis.
* D3 — Guru is classically supportive in 2/5/7/9/11; Vinaadi grades 1/3/4/10
  "Mixed" and 6/8/12 "needs care". The Mixed band is a presentation grade and
  the classical non-supportive set is kept beside it.

The web/mobile mirror lives in packages/shared/src/api/transits.ts; the parity
test below parses its constant arrays so the two cannot drift silently.
"""
from __future__ import annotations

import re
from pathlib import Path

import pytest

from app.calculations import gochara_grade as g
from app.services import narrative_engine

pytestmark = pytest.mark.no_db

_SHARED_TS = Path(__file__).resolve().parent.parent / "packages" / "shared" / "src" / "api" / "transits.ts"


def test_d2_sani_supportive_only_in_3_6_11_and_care_everywhere_else() -> None:
    grades = {h: g.gochara_grade("SATURN", h) for h in range(1, 13)}
    assert {h for h, v in grades.items() if v == "SUPPORTIVE"} == {3, 6, 11}
    assert {h for h, v in grades.items() if v == "NEEDS_CARE"} == {1, 2, 4, 5, 7, 8, 9, 10, 12}
    assert "MIXED" not in grades.values()


def test_d2_named_sani_periods_are_a_separate_axis() -> None:
    assert g.SADE_SATI_FROM_MOON == {12, 1, 2}
    assert g.ARDHASHTAMA_SANI_FROM_MOON == {4}
    assert g.ASHTAMA_SANI_FROM_MOON == {8}
    # 7th and 10th need care, but not because they are a named period.
    assert {7, 10}.isdisjoint(g.NAMED_SANI_PERIOD_HOUSES)
    assert {7, 10} <= g.SANI_NEEDS_CARE_FROM_MOON


def test_d3_guru_grade_sits_over_the_classical_set() -> None:
    grades = {h: g.gochara_grade("JUPITER", h) for h in range(1, 13)}
    assert {h for h, v in grades.items() if v == "SUPPORTIVE"} == g.GURU_SUPPORTIVE_FROM_MOON == {2, 5, 7, 9, 11}
    assert {h for h, v in grades.items() if v == "MIXED"} == {1, 3, 4, 10}
    assert {h for h, v in grades.items() if v == "NEEDS_CARE"} == {6, 8, 12}
    # Classically, everything Mixed is still non-supportive.
    assert g.GURU_MIXED_FROM_MOON <= g.GURU_NON_SUPPORTIVE_FROM_MOON


def test_the_transit_feed_spellings_resolve() -> None:
    assert g.gochara_grade("GURU", 9) == "SUPPORTIVE"
    assert g.gochara_grade("SANI", 9) == "NEEDS_CARE"
    assert g.gochara_grade("RAHU", 3) is None


def _ts_array(name: str) -> set[int]:
    source = _SHARED_TS.read_text(encoding="utf-8")
    match = re.search(rf"export const {name}: readonly number\[\] = \[([^\]]*)\]", source)
    assert match, f"{name} not found in {_SHARED_TS}"
    return {int(x) for x in match.group(1).split(",") if x.strip()}


@pytest.mark.parametrize(
    ("ts_name", "py_value"),
    [
        ("GURU_SUPPORTIVE_FROM_MOON", g.GURU_SUPPORTIVE_FROM_MOON),
        ("GURU_NON_SUPPORTIVE_FROM_MOON", g.GURU_NON_SUPPORTIVE_FROM_MOON),
        ("SANI_SUPPORTIVE_FROM_MOON", g.SANI_SUPPORTIVE_FROM_MOON),
        ("SANI_NEEDS_CARE_FROM_MOON", g.SANI_NEEDS_CARE_FROM_MOON),
        ("SADE_SATI_FROM_MOON", g.SADE_SATI_FROM_MOON),
        ("ARDHASHTAMA_SANI_FROM_MOON", g.ARDHASHTAMA_SANI_FROM_MOON),
        ("ASHTAMA_SANI_FROM_MOON", g.ASHTAMA_SANI_FROM_MOON),
    ],
)
def test_web_and_mobile_read_the_same_table(ts_name: str, py_value: frozenset[int]) -> None:
    assert _ts_array(ts_name) == set(py_value)


def test_daily_line_never_calls_a_care_house_quiet() -> None:
    """`gochar_spoken` used to say Sani "is quiet" in 2/5/7/9/10 — D2 forbids a
    neutral read outside 3/6/11."""
    for house in range(1, 13):
        line = narrative_engine.gochar_spoken(9, house, None, False, 50)
        if house in g.SANI_SUPPORTIVE_FROM_MOON:
            assert "sitting easy" in line.en
        else:
            assert "quiet" not in line.en
            assert ("pressing" in line.en) == (house in g.NAMED_SANI_PERIOD_HOUSES)


def test_daily_line_reads_guru_4th_as_mixed_and_6th_as_care() -> None:
    assert "neither helping nor hindering" in narrative_engine.gochar_spoken(4, 3, None, False, 50).en
    assert "harder spot" in narrative_engine.gochar_spoken(6, 3, None, False, 50).en


def test_tile_never_prints_neutral_for_sani() -> None:
    for house in range(1, 13):
        tile = narrative_engine.gochar_reason(9, house, None, False, False, 50)
        assert "Saturn in house" in tile.en
        assert f"Saturn in house {house} (neutral)" not in tile.en
