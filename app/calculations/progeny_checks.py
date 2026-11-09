"""The two children's-dosham checks Q13 left open: the Saptamsa (D7) and the dasa.

Owner ruling 2026-10-30 (docs/DOCTRINE_DECISIONS_V1.md §18, Q13): Santhana Thadai
and Putra Sarpa are read in order: formation, then protection, then D7 and dasa.
This module is the third step. It runs only on a dosham that has formed.

**What it may and may not do (Q18).** These rules come from standard practice:
the Saptamsa is the varga of children (BPHS lists it for sons and grandsons), a
5th-house affliction is confirmed by repeating the 5th-house test in that varga,
and a house's results come in the periods of the planets that afflict it or rule
it. No printed source with edition and page has been recorded against them yet,
so they sit at the `engine_inference` tier. The rule for that tier is that they
**describe and time, and never grade**: nothing here touches `strength`,
`residual`, `parihara` or `progeny_outlook`. When the astrologer ratifies a rule
(docs/ASTROLOGER_QUESTIONS_CHILDREN_D7_DASHA_2026-11-09.md), it can be promoted.

**Precautions built in.**

* The D7 lagna moves one sign for every 4.29° of the rising degree, roughly
  every 17 minutes of birth time. The D7 house checks are marked unreliable when
  the stated birth-time uncertainty is over 2 minutes (the same cut-off as
  `vargaReliability`), or when birth time +/-2 minutes would give a different
  D7 lagna. Since 2026-11-09 that second test uses the real ephemeris: the
  caller passes the lagna at birth time -2 and +2 minutes (`lagna_bracket`),
  which is exact for the place and the sign. The rising rate varies roughly
  3-6 min/deg with sign and latitude, so the old "4 minutes a degree" average
  marked fast-rising charts reliable when two minutes could still move them.
  The average survives only as the fallback when no bracket is given.
* Every D7 fact used here (the 5th, its lord, Jupiter's house) hangs on that
  lagna, so an unreliable D7 lagna gives the verdict UNCERTAIN, not a guess.
* Q17: no value here can say a person cannot have children. The verdicts are
  "repeats", "strained", "supports", "mixed" and "uncertain".
"""

from __future__ import annotations

from collections.abc import Iterable, Mapping
from dataclasses import dataclass, field
from datetime import date

from app.calculations._yoga_helpers import DUSTHANA_HOUSES, KENDRA_HOUSES, TRIKONA_HOUSES
from app.calculations.aspects import aspects_house
from app.calculations.astro import house_from_reference
from app.calculations.chart_strength import SIGN_LORD
from app.calculations.dasha import DashaPeriod, _build_subperiods
from app.calculations.divisional_charts import compute_d7

#: One saptamsa spans 30/7 degrees.
D7_SPAN_DEG = 30.0 / 7.0
#: The lagna's average motion: about one degree in four minutes of clock time.
#: An average, so the margin it gives is approximate, and is said to be.
MINUTES_PER_LAGNA_DEGREE = 4.0
#: Under this many minutes from a D7 boundary, the D7 lagna is time-sensitive.
#: Equal to the birth-time tolerance below: a time good to +/-2 minutes cannot
#: move a lagna that is more than 2 minutes from a boundary. (Was 5, which on a
#: ~17-minute part withheld the verdict on about 10/17 = 58% of charts; at 2 it
#: is about 4/17 = 23%. See docs/DEFERRED_ASTROLOGY_CHECKS_BUILD_PLAN, item 0.)
D7_MARGIN_MINUTES = 2.0
#: Over this many minutes of stated uncertainty, D7 houses are not reliable
#: (the cut-off `_varga_reliability` uses for every high varga).
BIRTH_TIME_TOLERANCE_MINUTES = 2
#: How far ahead the dasa windows look, and how many are returned.
HORIZON_YEARS = 20
MAX_WINDOWS = 6
#: Past this age the windows speak to existing children, not to having them.
CHILDBEARING_AGE_LIMIT = 50

_AFFLICTORS_BY_DOSHAM: Mapping[str, tuple[str, ...]] = {
    "PUTRA_SARPA_DOSHAM": ("RAHU", "KETU"),
    "SANTHANA_THADAI": ("SATURN",),
}
CHILDREN_DOSHAMS = frozenset(_AFFLICTORS_BY_DOSHAM)


@dataclass(frozen=True, slots=True)
class D7Check:
    #: D7 houses are read from the D7 lagna; False when the birth time cannot
    #: carry it, and then `verdict` is UNCERTAIN.
    houses_reliable: bool
    #: Approximate minutes of birth time between the rising degree and the
    #: nearest D7 boundary.
    margin_minutes: int
    lagna_rasi: int
    fifth_rasi: int
    fifth_lord: str
    fifth_lord_house: int
    jupiter_house: int
    #: This dosham's own afflictors in the D7 5th or with the D7 5th lord.
    repeated_by: tuple[str, ...]
    jupiter_supports: bool
    fifth_lord_in_dusthana: bool
    #: REPEATS | STRAINED | SUPPORTS | MIXED, or UNCERTAIN when the birth time
    #: cannot carry the D7 lagna. Never a denial (Q17).
    verdict: str


@dataclass(frozen=True, slots=True)
class DashaWindow:
    lord: str
    #: MAHA (the whole mahadasa) or BHUKTI (one antardasa inside it).
    level: str
    maha_lord: str
    start: date
    end: date
    #: AFFLICTION | SUPPORT | MIXED.
    kind: str
    is_current: bool


@dataclass(frozen=True, slots=True)
class DashaCheck:
    current_maha: str
    current_bhukti: str
    #: AFFLICTION | SUPPORT | MIXED | NEUTRAL, for the period running today.
    current_kind: str
    afflicting_lords: tuple[str, ...]
    supporting_lords: tuple[str, ...]
    windows: tuple[DashaWindow, ...]
    #: UNDER_18 | CHILDBEARING | PAST — what the windows are for.
    age_band: str


@dataclass(frozen=True, slots=True)
class ProgenyChecks:
    d7: D7Check
    dasha: DashaCheck
    #: Q18 tier of both rules until the astrologer ratifies them.
    tier: str = "engine_inference"
    notes: tuple[str, ...] = field(default_factory=tuple)


def afflictors_in(name: str, conditions_met: Iterable[str]) -> tuple[str, ...]:
    """This dosham's afflicting grahas, as its own conditions name them."""
    allowed = _AFFLICTORS_BY_DOSHAM.get(name, ())
    found: list[str] = []
    for marker in conditions_met:
        for planet in allowed:
            token = planet.lower()
            if marker.endswith(f"has_{token}") or marker.endswith(f"joined_by_{token}"):
                if planet not in found:
                    found.append(planet)
    return tuple(found)


def _d7_margin_minutes(lagna_longitude: float) -> float:
    offset = (lagna_longitude % 30.0) % D7_SPAN_DEG
    margin_deg = min(offset, D7_SPAN_DEG - offset)
    return margin_deg * MINUTES_PER_LAGNA_DEGREE


def _d7_sign(longitude: float) -> int:
    return compute_d7({"LAGNA": longitude})["LAGNA"]


def _bracket_margin(lagna_longitude: float, bracket: tuple[float, float]) -> tuple[bool, float]:
    """(D7 lagna unchanged across the bracket, minutes to the nearest boundary).

    The minutes use the local rising rate measured across the bracket, so they
    are this chart's own figure, not the 4 min/deg average.
    """
    before, after = bracket
    stable = _d7_sign(before) == _d7_sign(lagna_longitude) == _d7_sign(after)
    span_deg = (after - before) % 360.0
    rate = span_deg / (2 * BIRTH_TIME_TOLERANCE_MINUTES)  # degrees per minute
    offset = (lagna_longitude % 30.0) % D7_SPAN_DEG
    margin_deg = min(offset, D7_SPAN_DEG - offset)
    minutes = margin_deg / rate if rate > 0 else margin_deg * MINUTES_PER_LAGNA_DEGREE
    return stable, minutes


def check_d7(
    longitudes: Mapping[str, float],
    lagna_longitude: float,
    afflictors: tuple[str, ...],
    *,
    birth_time_confidence_minutes: int = 0,
    lagna_bracket: tuple[float, float] | None = None,
) -> D7Check:
    """`lagna_bracket`: the lagna at birth time minus and plus
    `BIRTH_TIME_TOLERANCE_MINUTES`, from the ephemeris. When given, the D7
    lagna is time-stable exactly when all three fall in one D7 sign."""
    d7 = compute_d7({**longitudes, "LAGNA": lagna_longitude})
    lagna = d7["LAGNA"]
    fifth_rasi = ((lagna + 5 - 2) % 12) + 1
    fifth_lord = SIGN_LORD[fifth_rasi]
    lord_rasi = d7[fifth_lord]
    jupiter_rasi = d7["JUPITER"]
    fifth_lord_house = house_from_reference(lagna, lord_rasi)
    jupiter_house = house_from_reference(lagna, jupiter_rasi)

    # Planet-to-planet: an afflictor with the D7 5th lord does not depend on
    # the D7 lagna. Afflictor in the D7 5th does.
    with_lord = [p for p in afflictors if p != fifth_lord and d7.get(p) == lord_rasi]
    in_fifth = [p for p in afflictors if d7.get(p) == fifth_rasi]
    repeated_by = tuple(dict.fromkeys(in_fifth + with_lord))

    jupiter_supports = (
        jupiter_rasi == fifth_rasi
        or aspects_house("JUPITER", jupiter_rasi, fifth_rasi)
        or jupiter_house in (KENDRA_HOUSES | TRIKONA_HOUSES)
    ) and not any(d7.get(p) == jupiter_rasi for p in ("RAHU", "KETU"))
    fifth_lord_in_dusthana = fifth_lord_house in DUSTHANA_HOUSES

    if lagna_bracket is not None:
        time_stable, margin = _bracket_margin(lagna_longitude, lagna_bracket)
    else:
        margin = _d7_margin_minutes(lagna_longitude)
        time_stable = margin >= D7_MARGIN_MINUTES
    houses_reliable = birth_time_confidence_minutes <= BIRTH_TIME_TOLERANCE_MINUTES and time_stable
    # Every fact above hangs on the D7 lagna (the 5th, its lord, Jupiter's
    # house). When the birth time cannot carry that lagna, no verdict is given.
    if not houses_reliable:
        verdict = "UNCERTAIN"
    elif repeated_by:
        verdict = "REPEATS"
    elif fifth_lord_in_dusthana and not jupiter_supports:
        verdict = "STRAINED"
    elif jupiter_supports and not fifth_lord_in_dusthana:
        verdict = "SUPPORTS"
    else:
        verdict = "MIXED"
    return D7Check(
        houses_reliable=houses_reliable,
        margin_minutes=int(round(margin)),
        lagna_rasi=lagna,
        fifth_rasi=fifth_rasi,
        fifth_lord=fifth_lord,
        fifth_lord_house=fifth_lord_house,
        jupiter_house=jupiter_house,
        repeated_by=repeated_by,
        jupiter_supports=jupiter_supports,
        fifth_lord_in_dusthana=fifth_lord_in_dusthana,
        verdict=verdict,
    )


def _supporting_lords(lagna_rasi: int, afflictors: tuple[str, ...], conditions_met: Iterable[str]) -> tuple[str, ...]:
    """Jupiter and the 5th lord, unless the dosham itself joins a node or
    Saturn to them: a planet carrying the afflictor gives mixed results."""
    fifth_lord = SIGN_LORD[((lagna_rasi + 5 - 2) % 12) + 1]
    joined = " ".join(conditions_met)
    lords: list[str] = []
    for planet in ("JUPITER", fifth_lord):
        if planet in afflictors or planet in lords:
            continue
        if planet == "JUPITER" and "jupiter_joined_by_" in joined:
            continue
        if planet == fifth_lord and f"fifth_lord_{fifth_lord.lower()}_joined_by_" in joined:
            continue
        lords.append(planet)
    return tuple(lords)


def _kind(lord: str, maha_lord: str, afflicting: tuple[str, ...], supporting: tuple[str, ...]) -> str:
    hit = lord in afflicting or maha_lord in afflicting
    helps = lord in supporting or maha_lord in supporting
    if hit and helps:
        return "MIXED"
    if hit:
        return "AFFLICTION"
    if helps:
        return "SUPPORT"
    return "NEUTRAL"


def check_dasha(
    mahadashas: Iterable[DashaPeriod],
    *,
    lagna_rasi: int,
    afflictors: tuple[str, ...],
    conditions_met: Iterable[str],
    birth_date: date,
    as_of: date,
) -> DashaCheck:
    conditions = tuple(conditions_met)
    supporting = _supporting_lords(lagna_rasi, afflictors, conditions)
    horizon = date(as_of.year + HORIZON_YEARS, as_of.month, min(as_of.day, 28))
    age = as_of.year - birth_date.year - ((as_of.month, as_of.day) < (birth_date.month, birth_date.day))
    age_band = "UNDER_18" if age < 18 else ("PAST" if age >= CHILDBEARING_AGE_LIMIT else "CHILDBEARING")

    windows: list[DashaWindow] = []
    current_maha = current_bhukti = ""
    current_kind = "NEUTRAL"
    for maha in mahadashas:
        if maha.end_date <= as_of or maha.start_date >= horizon:
            continue
        antars = _build_subperiods(maha, "antar")
        for antar in antars:
            if antar.start_date <= as_of < antar.end_date:
                current_maha, current_bhukti = maha.lord, antar.lord
                current_kind = _kind(antar.lord, maha.lord, afflictors, supporting)
        maha_kind = _kind(maha.lord, maha.lord, afflictors, supporting)
        if maha_kind != "NEUTRAL":
            # The whole mahadasa carries it; listing every bhukti would repeat it.
            windows.append(DashaWindow(
                lord=maha.lord, level="MAHA", maha_lord=maha.lord,
                start=maha.start_date,
                end=maha.end_date, kind=maha_kind,
                is_current=maha.start_date <= as_of < maha.end_date,
            ))
            continue
        for antar in antars:
            if antar.end_date <= as_of or antar.start_date >= horizon:
                continue
            kind = _kind(antar.lord, maha.lord, afflictors, supporting)
            if kind == "NEUTRAL":
                continue
            windows.append(DashaWindow(
                lord=antar.lord, level="BHUKTI", maha_lord=maha.lord,
                start=antar.start_date, end=antar.end_date, kind=kind,
                is_current=antar.start_date <= as_of < antar.end_date,
            ))
    return DashaCheck(
        current_maha=current_maha,
        current_bhukti=current_bhukti,
        current_kind=current_kind,
        afflicting_lords=afflictors,
        supporting_lords=supporting,
        windows=tuple(windows[:MAX_WINDOWS]),
        age_band=age_band,
    )


def check_progeny(
    name: str,
    conditions_met: Iterable[str],
    *,
    lagna_rasi: int,
    lagna_longitude: float,
    longitudes: Mapping[str, float],
    mahadashas: Iterable[DashaPeriod],
    birth_date: date,
    as_of: date,
    birth_time_confidence_minutes: int = 0,
    lagna_bracket: tuple[float, float] | None = None,
) -> ProgenyChecks | None:
    """Both checks for a formed children's dosham; None for any other."""
    if name not in CHILDREN_DOSHAMS:
        return None
    conditions = tuple(conditions_met)
    afflictors = afflictors_in(name, conditions)
    if not afflictors:
        return None
    d7 = check_d7(
        longitudes, lagna_longitude, afflictors,
        birth_time_confidence_minutes=birth_time_confidence_minutes,
        lagna_bracket=lagna_bracket,
    )
    dasha = check_dasha(
        mahadashas, lagna_rasi=lagna_rasi, afflictors=afflictors,
        conditions_met=conditions, birth_date=birth_date, as_of=as_of,
    )
    return ProgenyChecks(d7=d7, dasha=dasha)
