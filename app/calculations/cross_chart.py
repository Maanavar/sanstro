"""FAA-33: classical cross-chart observations between two horoscopes.

Spec: docs/GROUP_D_SPECS_2026-11-11.md, D1 as amended by §0.3 (rulings 2026-11-11).

Two-chart readings elsewhere compare scores; nothing placed one chart's factors
in the other chart. These rows do, as **observations only**:

* ``SEVENTH_LORD`` - the sign X's 7th lord occupies **in X's own chart**,
  counted from Y's lagna, and (a separate row) from Y's Moon. Never Y's
  position of the same graha: that is a different placement.
* ``LAGNA`` - X's lagna rasi counted from Y's lagna.
* ``MOON`` - X's Moon rasi counted from Y's lagna, and (a separate row) from
  Y's Moon. Moon-from-lagna and Moon-from-Moon are never merged.
* ``VENUS`` / ``JUPITER`` - X's natal Venus / Guru sign counted from Y's lagna;
  house 7 means it falls on Y's 7th. A planetary overlay: the graha never
  "becomes" Y's 7th lord. No spouse-karaka reading is attached here (that
  needs stated gender and lives in `marriage_service._spouse_karakas`).

Every row has exactly one reference (`house_from_lagna` or `house_from_moon`
set, the other None), so one `status` describes it.

Status table (provisional, engine_inference; AI-consolidated rulings, the owner
ruled 2026-11-11 to build them at this tier). For the 7th-lord, lagna and Moon
rows: 1/5/7/9 SUPPORT; 11 NOTE (secondary support, no status of its own);
2/3/4/10 NEUTRAL; 6/8/12 NOTE, which is "look closer", never a rejection. The
Venus/Guru overlay rows are SUPPORT on the 7th and NEUTRAL elsewhere: that
check asks one question, whether the graha falls on the 7th.

No score anywhere. `compute_compatibility_intelligence` attaches the rows
after the composite is fixed; a test pins that the breakdown is unchanged.
Both directions are computed separately (`cross_chart_observations` calls the
one-way function twice with the charts swapped), never mirrored.

Wire carries numbers and graha keys only; surfaces render names through
`rasiDisplayName` / `tPlanetLord` (CLAUDE.md display boundary).
"""
from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass
from typing import Any, Literal

from app.calculations.astro import house_from_reference
from app.calculations.chart_strength import SIGN_LORD

Direction = Literal["A_TO_B", "B_TO_A"]
CrossChartKey = Literal["SEVENTH_LORD", "LAGNA", "MOON", "VENUS", "JUPITER"]
CrossChartStatus = Literal["SUPPORT", "NEUTRAL", "NOTE"]

#: Every row ships at this tier until the astrologer ratifies the table.
CROSS_CHART_TIER = "engine_inference"

_SUPPORT_HOUSES = frozenset({1, 5, 7, 9})
_NOTE_HOUSES = frozenset({6, 8, 11, 12})


@dataclass(frozen=True, slots=True)
class ChartPoints:
    """The few positions FAA-33 reads from one chart (rasi numbers 1-12)."""

    lagna_rasi: int
    planet_rasi: Mapping[str, int]

    @property
    def moon_rasi(self) -> int:
        return self.planet_rasi["MOON"]


@dataclass(frozen=True, slots=True)
class CrossChartObservation:
    direction: Direction
    key: CrossChartKey
    #: The graha whose natal sign is placed (None for the LAGNA row).
    graha: str | None
    #: The sign being placed, in the *source* chart (X of X->Y).
    rasi: int
    house_from_lagna: int | None
    house_from_moon: int | None
    status: CrossChartStatus
    tier: str = CROSS_CHART_TIER


def house_status(house: int) -> CrossChartStatus:
    if not 1 <= house <= 12:
        raise ValueError(f"house must be 1-12, got {house}")
    if house in _SUPPORT_HOUSES:
        return "SUPPORT"
    if house in _NOTE_HOUSES:
        return "NOTE"
    return "NEUTRAL"


def _overlay_status(house: int) -> CrossChartStatus:
    return "SUPPORT" if house == 7 else "NEUTRAL"


def seventh_lord_of(lagna_rasi: int) -> str:
    return SIGN_LORD[(lagna_rasi - 1 + 6) % 12 + 1]


def one_way(src: ChartPoints, dst: ChartPoints, direction: Direction) -> tuple[CrossChartObservation, ...]:
    """Rows for src -> dst. Reads src's own placements only."""
    rows: list[CrossChartObservation] = []

    lord = seventh_lord_of(src.lagna_rasi)
    lord_rasi = src.planet_rasi[lord]
    h_l = house_from_reference(dst.lagna_rasi, lord_rasi)
    h_m = house_from_reference(dst.moon_rasi, lord_rasi)
    rows.append(CrossChartObservation(direction, "SEVENTH_LORD", lord, lord_rasi, h_l, None, house_status(h_l)))
    rows.append(CrossChartObservation(direction, "SEVENTH_LORD", lord, lord_rasi, None, h_m, house_status(h_m)))

    h = house_from_reference(dst.lagna_rasi, src.lagna_rasi)
    rows.append(CrossChartObservation(direction, "LAGNA", None, src.lagna_rasi, h, None, house_status(h)))

    h_l = house_from_reference(dst.lagna_rasi, src.moon_rasi)
    h_m = house_from_reference(dst.moon_rasi, src.moon_rasi)
    rows.append(CrossChartObservation(direction, "MOON", "MOON", src.moon_rasi, h_l, None, house_status(h_l)))
    rows.append(CrossChartObservation(direction, "MOON", "MOON", src.moon_rasi, None, h_m, house_status(h_m)))

    for key, graha in (("VENUS", "VENUS"), ("JUPITER", "JUPITER")):
        r = src.planet_rasi[graha]
        h = house_from_reference(dst.lagna_rasi, r)
        rows.append(CrossChartObservation(direction, key, graha, r, h, None, _overlay_status(h)))  # type: ignore[arg-type]

    return tuple(rows)


def cross_chart_observations(a: ChartPoints, b: ChartPoints) -> tuple[CrossChartObservation, ...]:
    """A->B rows, then B->A rows; each direction computed on its own."""
    return one_way(a, b, "A_TO_B") + one_way(b, a, "B_TO_A")


def chart_points_from_snapshot(snap: Any) -> ChartPoints:
    return ChartPoints(
        lagna_rasi=snap.data.lagna.rasi,
        planet_rasi={p.graha: p.rasi for p in snap.data.planets},
    )
