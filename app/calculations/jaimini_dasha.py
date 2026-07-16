from __future__ import annotations

# P2-04 RESOLVED (2026-07-14): Chara Dasha is fully surfaced end-to-end.
#   API   : GET /charts/{id}/chara-dasha (app/api/charts.py)
#   shared: packages/shared/src/api/charaDasha.ts (getCharaDasha)
#   web   : "Classical Timing" surface in web/components/dashboard-charts-panel-nova.tsx
#   mobile: "Jaimini Chara" tab in mobile/app/dasha/index.tsx
# No further product decision pending. See docs/ROADMAP_TASKS.md P2-04.
#
# WI-10 (2026-07-16): full rewrite of the direction and period-length rules.
# The previous version used sign-parity (lagna odd/even) for sequence
# direction and a movable/fixed/dual axis for period length — both wrong.
# Rewritten against the classical BPHS/Jaimini savya-apasavya rule, cross-
# referenced across independent published sources (a fully-worked Chara
# Dasha calculation, and two further descriptions of the same rule) since
# JHora itself was not available to verify against — see
# docs/CALC_AUDIT_REMEDIATION_PLAN_2026-07.md WI-10 for the full sourcing
# note. This implementation is internally consistent with those published
# sources but has NOT been cross-checked against JHora or another live
# reference-software chart.

from collections.abc import Mapping
from datetime import date, timedelta

from app.calculations.astro import RASI_NAMES

_SIGN_LORD: dict[int, str] = {
    1: "MARS",
    2: "VENUS",
    3: "MERCURY",
    4: "MOON",
    5: "SUN",
    6: "MERCURY",
    7: "VENUS",
    8: "MARS",
    9: "JUPITER",
    10: "SATURN",
    11: "SATURN",
    12: "JUPITER",
}

# Savya (forward-counting) / Apasavya (backward-counting) rasi groups.
# This is a quadrant-of-3 split of the zodiac, NOT plain odd/even sign
# parity: Savya = Aries-Taurus-Gemini and Libra-Scorpio-Sagittarius;
# Apasavya = Cancer-Leo-Virgo and Capricorn-Aquarius-Pisces. It agrees with
# plain odd/even for movable and fixed signs but disagrees for dual signs
# (Gemini/Virgo/Sagittarius/Pisces) — that disagreement is exactly where the
# previous lagna-odd/even implementation was wrong.
_SAVYA_RASI: frozenset[int] = frozenset({1, 2, 3, 7, 8, 9})
_APASAVYA_RASI: frozenset[int] = frozenset({4, 5, 6, 10, 11, 12})

# Scorpio and Aquarius each have two Jaimini lords (the classical planet and
# its co-ruling node). (primary, node) order matches _SIGN_LORD's existing
# single-lord choice for these two signs.
_CO_LORD_NODE: dict[int, tuple[str, str]] = {
    8: ("MARS", "KETU"),
    11: ("SATURN", "RAHU"),
}


def _add_years(value: date, years: int) -> date:
    """Add whole years while handling leap-day safely."""
    try:
        return value.replace(year=value.year + years)
    except ValueError:
        # Feb 29 -> Feb 28 on non-leap target year
        return value.replace(month=2, day=28, year=value.year + years)


def _distance_from_rasi(from_rasi: int, to_rasi: int) -> int:
    """Inclusive zodiac distance from from_rasi -> to_rasi (1..12)."""
    return ((to_rasi - from_rasi) % 12) + 1


def _ninth_from(rasi: int) -> int:
    """The 9th rasi (inclusive) counting forward from the given rasi."""
    return ((rasi - 1 + 8) % 12) + 1


def _is_direct_sequence(pivot_rasi: int) -> bool:
    """
    BPHS Chara Dasha direction rule: the 9th sign from a pivot rasi decides
    direct/reverse — Savya is direct, Apasavya is reverse. The pivot is the
    Lagna for the mahadasha sequence, or the running mahadasha rasi for its
    own antardasha sequence (confirmed against a fully worked multi-
    mahadasha example during WI-10 sourcing: every mahadasha's sub-period
    direction matched 9th-from-that-rasi, not 9th-from-lagna).
    """
    return _ninth_from(pivot_rasi) in _SAVYA_RASI


def _zodiac_order(direct: bool) -> list[int]:
    return list(range(1, 13)) if direct else [1, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2]


def _rotate_from(order: list[int], pivot: int) -> list[int]:
    start_idx = order.index(pivot)
    return order[start_idx:] + order[:start_idx]


def _resolve_rasi_lord(
    rasi: int,
    planet_rasi_map: Mapping[str, int],
    planet_longitudes: Mapping[str, float] | None = None,
) -> str | None:
    """
    Return the lord whose position decides a rasi's dasha length. Scorpio
    and Aquarius have two lords (Mars/Ketu, Saturn/Rahu); the stronger one
    is picked per this hierarchy, cross-referenced across multiple published
    descriptions of the rule (one source's phrasing of the "one occupies own
    sign" step reads inverted relative to the others — the majority reading,
    used here, is that occupying the sign outranks not occupying it):
      1. Both co-lords conjunct in the same rasi -> either gives the same
         count; return the primary (classical, non-nodal) one.
      2. Exactly one of the two occupies the rasi itself -> it wins.
      3. Neither (or the tie isn't resolved yet) -> whichever co-lord has
         more companion planets in its own occupied rasi wins.
      4. Still tied -> higher degree-in-sign wins (needs planet_longitudes;
         without it this rung is skipped and the primary lord is kept,
         documented as a rare, honest simplification).
    """
    co_lords = _CO_LORD_NODE.get(rasi)
    if co_lords is None:
        return _SIGN_LORD[rasi]

    primary, node = co_lords
    primary_rasi = planet_rasi_map.get(primary)
    node_rasi = planet_rasi_map.get(node)

    if primary_rasi is None and node_rasi is None:
        return primary
    if primary_rasi is None:
        return node
    if node_rasi is None:
        return primary
    if primary_rasi == node_rasi:
        return primary

    primary_in_own = primary_rasi == rasi
    node_in_own = node_rasi == rasi
    if primary_in_own != node_in_own:
        return primary if primary_in_own else node

    primary_companions = sum(1 for r in planet_rasi_map.values() if r == primary_rasi)
    node_companions = sum(1 for r in planet_rasi_map.values() if r == node_rasi)
    if primary_companions != node_companions:
        return primary if primary_companions > node_companions else node

    if planet_longitudes is not None:
        primary_deg = planet_longitudes.get(primary)
        node_deg = planet_longitudes.get(node)
        if primary_deg is not None and node_deg is not None:
            primary_deg_in_sign = primary_deg % 30.0
            node_deg_in_sign = node_deg % 30.0
            if primary_deg_in_sign != node_deg_in_sign:
                return primary if primary_deg_in_sign > node_deg_in_sign else node

    return primary


def _chara_period_years(
    rasi: int,
    planet_rasi_map: Mapping[str, int],
    planet_longitudes: Mapping[str, float] | None = None,
) -> int:
    """
    Return Chara Dasha period length (years) for a rasi.

    BPHS rule: count (inclusive) from the rasi to its lord's occupied rasi —
    forward if the rasi is Savya, backward if Apasavya — then subtract 1. A
    lord in its own sign always gives the maximum, 12 years, regardless of
    Savya/Apasavya (the count-minus-1 formula degenerates to 0 there, which
    is not a valid dasha length).
    """
    lord = _resolve_rasi_lord(rasi, planet_rasi_map, planet_longitudes)
    lord_rasi = planet_rasi_map.get(lord) if lord else None
    if lord_rasi is None:
        return 8

    if lord_rasi == rasi:
        return 12

    if rasi in _SAVYA_RASI:
        count = _distance_from_rasi(rasi, lord_rasi)
    else:
        count = _distance_from_rasi(lord_rasi, rasi)

    return max(1, min(12, count - 1))


def _dasha_sequence_order(lagna_rasi: int) -> list[int]:
    """Return 12-sign dasha sequence starting from Lagna (see _is_direct_sequence)."""
    order = _zodiac_order(_is_direct_sequence(lagna_rasi))
    return _rotate_from(order, lagna_rasi)


def calculate_chara_dasha(
    lagna_rasi: int,
    planet_rasi_map: Mapping[str, int],
    birth_date: date,
    planet_longitudes: Mapping[str, float] | None = None,
) -> list[dict]:
    """
    Calculate the complete Jaimini Chara Dasha sequence.
    """
    rasi_order = _dasha_sequence_order(lagna_rasi)
    periods: list[dict] = []
    current = birth_date

    for rasi in rasi_order:
        years = _chara_period_years(rasi, planet_rasi_map, planet_longitudes)
        end = _add_years(current, years)
        periods.append(
            {
                "rasi": rasi,
                "rasi_name": RASI_NAMES.get(rasi, str(rasi)),
                "years": years,
                "start_date": current,
                "end_date": end,
            }
        )
        current = end

    return periods


def current_chara_dasha(
    lagna_rasi: int,
    planet_rasi_map: Mapping[str, int],
    birth_date: date,
    as_of: date | None = None,
    planet_longitudes: Mapping[str, float] | None = None,
) -> dict | None:
    """Return the currently running Chara Dasha period."""
    today = as_of or date.today()
    for period in calculate_chara_dasha(lagna_rasi, planet_rasi_map, birth_date, planet_longitudes):
        if period["start_date"] <= today < period["end_date"]:
            return period
    return None


def calculate_chara_antardasha(main_period: dict) -> list[dict]:
    """
    Sub-periods (Antardasha) within a Jaimini Chara Dasha main period. Each
    of the 12 sub-periods has equal duration = main_period_years / 12.
    Direction follows the same Savya/Apasavya 9th-from-rasi rule as the
    mahadasha sequence, pivoted on the running mahadasha rasi (see
    _is_direct_sequence) — not on the natal Lagna.
    """
    main_rasi = main_period["rasi"]
    main_years = main_period["years"]
    sub_duration_days = (main_years * 365.25) / 12

    order = _zodiac_order(_is_direct_sequence(main_rasi))
    rasi_order = _rotate_from(order, main_rasi)

    periods: list[dict] = []
    current = main_period["start_date"]
    for rasi in rasi_order:
        end_dt = current + timedelta(days=sub_duration_days)
        periods.append({
            "rasi": rasi,
            "rasi_name": RASI_NAMES.get(rasi, str(rasi)),
            "start_date": current,
            "end_date": end_dt,
        })
        current = end_dt
    return periods
