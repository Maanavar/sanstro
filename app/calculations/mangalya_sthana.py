"""FAA-30: the 8th house read explicitly (mangalya sthana for a stated bride).

Spec: docs/GROUP_D_SPECS_2026-11-11.md D2 as amended by §0.3 (rulings
2026-11-11). Describes only: no score, no status word, no verdict. The 2/8
Rahu-Ketu dosham and Sevvai-in-8th already move scores; scoring this too would
count the same placement twice.

Role, from the STATED ``gender_for_traditional_rules`` only (FAA decisions §2):

* ``BRIDE`` (female) - mangalya sthana, Phaladeepika 11.1 (*mangalyam
  nidhanat*). Read from the lagna AND from the Moon (``reference="BOTH"``)
  until a sourced strength rule exists: the "stronger of lagna/Moon" gloss is
  the translator's, so the Moon reading is cited to the rulings.
* ``GROOM_8TH`` (male) - the same computations, labelled "8th-house factors".
  Never called mangalya.
* ``NOT_APPLIED`` (anything else) - no factors; the reading says why.

Classes (rulings): Sani, Sevvai, Rahu, Ketu and Surya are malefic. The Moon
(by paksha) and Budhan (by association) are conditional, decided by
``aspects.effective_natural_class``. Guru, Sukran and a waxing Moon are
benefic. Phaladeepika 11.1 also says a malefic in a house it owns gives good
results; every factor records that (``own_house``) instead of dropping it.

Each factor carries ``placement_id`` (``"D1.MARS"``) and ``also_counted_in``:
a Sevvai in the 8th that Sevvai dosham already counts from the same reference
is visibly the same placement, not a second finding. FAA-32 reuses the id.

EC-RULING-06: no mortality-class wording anywhere (the banned set lives in
narrative_engine._BANNED_MORTALITY_PHRASES), and the
MARAKA lordship status is not carried. D9 lines are dropped, and the reading
says so, when the D9 lagna is not stable across the birth-time tolerance.
"""
from __future__ import annotations

from collections.abc import Iterable, Mapping
from dataclasses import dataclass, field
from typing import Literal

from app.calculations.aspects import aspects_house, effective_natural_class, moon_is_natural_benefic
from app.calculations.astro import house_from_reference, navamsa_rasi_from_degree
from app.calculations.chart_strength import DEBILITATION_RASI, EXALTATION_RASI, OWN_SIGN_RASI
from app.calculations.functional_status import FunctionalStatus, functional_status
from app.calculations.rule_sources import (
    GROUP_D_RULINGS_2026_11_11,
    PHALADEEPIKA_11_1,
    PHALADEEPIKA_11_1_OWN_HOUSE,
    tier_of,
)
from app.constants.astrology import SIGN_LORD

Role = Literal["BRIDE", "GROOM_8TH", "NOT_APPLIED"]
Reference = Literal["LAGNA", "MOON", "D9_LAGNA"]
Kind = Literal["OCCUPANT", "LORD", "INFLUENCE", "PROTECTION", "D9_LORD", "D9_OCCUPANT"]
Nature = Literal["MALEFIC", "BENEFIC"]
Condition = Literal["PAKSHA", "ASSOCIATION"]
Dignity = Literal["EXALTED", "OWN", "DEBILITATED", "NEUTRAL"]
Via = Literal["IN", "CONJUNCT", "ASPECT"]
Target = Literal["HOUSE", "LORD"]

#: Birth-time tolerance for the D9 lagna, the same figure the D7 check uses.
D9_TOLERANCE_MINUTES = 5

_MALEFICS = frozenset({"SATURN", "MARS", "RAHU", "KETU", "SUN"})
_CONDITIONAL = {"MOON": "PAKSHA", "MERCURY": "ASSOCIATION"}
_BENEFICS = frozenset({"JUPITER", "VENUS"})
_GRAHAS = ("SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN", "RAHU", "KETU")
#: Protection lines (rulings): Guru's aspects and Sukran's 7th aspect.
_PROTECTORS = ("JUPITER", "VENUS")

#: Dosham name -> the grahas whose placement it counts.
_DOSHAM_GRAHAS = {"SEVVAI_DOSHAM": frozenset({"MARS"}), "RAHU_KETU_DOSHAM": frozenset({"RAHU", "KETU"})}


@dataclass(frozen=True, slots=True)
class EighthHouseChart:
    """What FAA-30 reads from one chart. Rasi numbers 1-12."""

    lagna_rasi: int
    planet_rasi: Mapping[str, int]
    combust: frozenset[str] = frozenset()
    #: True = Shukla. None = derive from Sun/Moon rasis (aspects.py fallback).
    paksha_is_shukla: bool | None = None
    d9_rasi: Mapping[str, int] = field(default_factory=dict)
    d9_lagna_rasi: int | None = None
    #: From `d9_lagna_stable`. False drops every D9 line.
    d9_lagna_reliable: bool = False
    #: Present doshams -> the references ("LAGNA", "MOON") they count from.
    dosham_references: Mapping[str, frozenset[str]] = field(default_factory=dict)

    @property
    def moon_rasi(self) -> int:
        return self.planet_rasi["MOON"]


@dataclass(frozen=True, slots=True)
class EighthHouseFactor:
    kind: Kind
    reference: Reference
    graha: str
    #: The graha's rasi in the chart (or varga) being read.
    rasi: int
    #: House of the graha from the reference.
    house: int
    nature: Nature
    condition: Condition | None
    dignity: Dignity
    combust: bool
    #: Functional statuses for this lagna, MARAKA removed (EC-RULING-06).
    lordship: tuple[str, ...]
    #: The graha owns the 8th it influences (Phaladeepika 11.1's exception).
    own_house: bool
    via: Via
    target: Target
    placement_id: str
    also_counted_in: tuple[str, ...]
    rule: str
    tier: str


@dataclass(frozen=True, slots=True)
class EighthHouseReading:
    role: Role
    #: "BOTH" for a stated gender (lagna and Moon, never merged); None when not applied.
    mangalya_reference: Literal["BOTH"] | None
    eighth_from_lagna: int | None
    eighth_from_moon: int | None
    factors: tuple[EighthHouseFactor, ...]
    #: None when D9 lines are present; a reason key when they were dropped.
    d9_note: Literal["D9_LAGNA_UNRELIABLE", "D9_UNAVAILABLE"] | None
    #: True when a malefic (not in its own house) occupies or aspects either 8th,
    #: or either 8th lord is debilitated or combust. A description, not a grade.
    malefic_influence: bool
    tier: str = "engine_inference"


def stated_role(gender: str | None) -> Role:
    g = (gender or "").strip().lower()
    return "BRIDE" if g == "female" else "GROOM_8TH" if g == "male" else "NOT_APPLIED"


def d9_lagna_stable(lagna_longitude: float, bracket: tuple[float, float] | None, confidence_minutes: int = 0) -> bool:
    """The D9 lagna sign is the same at birth time -/+ the tolerance (the
    ephemeris bracket, not an average rising rate). No bracket: not stable."""
    if bracket is None or confidence_minutes > D9_TOLERANCE_MINUTES:
        return False
    signs = {navamsa_rasi_from_degree(x % 360.0) for x in (bracket[0], lagna_longitude, bracket[1])}
    return len(signs) == 1


def nth_rasi(rasi: int, n: int) -> int:
    """The rasi that is the n-th house from ``rasi`` (inclusive count)."""
    return (rasi + n - 2) % 12 + 1


_nth = nth_rasi


def dignity_of(graha: str, rasi: int) -> Dignity:
    if rasi == DEBILITATION_RASI.get(graha):
        return "DEBILITATED"
    if rasi == EXALTATION_RASI.get(graha):
        return "EXALTED"
    if rasi in OWN_SIGN_RASI.get(graha, frozenset()):
        return "OWN"
    return "NEUTRAL"


_dignity = dignity_of


def graha_nature(planet_rasi: Mapping[str, int], paksha_is_shukla: bool | None, graha: str) -> tuple[Nature, Condition | None]:
    """The rulings' classes, shared by FAA-30 and FAA-32."""
    if graha in _MALEFICS:
        return "MALEFIC", None
    if graha in _BENEFICS:
        return "BENEFIC", None
    cls = effective_natural_class(graha, planet_rasi, paksha_is_shukla=paksha_is_shukla)
    return ("MALEFIC" if cls == "MALEFIC" else "BENEFIC"), _CONDITIONAL[graha]  # type: ignore[return-value]


def _nature(chart: EighthHouseChart, graha: str) -> tuple[Nature, Condition | None]:
    return graha_nature(chart.planet_rasi, chart.paksha_is_shukla, graha)


def lordship_of(lagna_rasi: int, graha: str) -> tuple[str, ...]:
    """Functional statuses for this lagna, MARAKA removed (EC-RULING-06)."""
    return tuple(sorted(s.value for s in functional_status(lagna_rasi, graha) if s is not FunctionalStatus.MARAKA))


_lordship = lordship_of


def one_chart(chart: EighthHouseChart, gender: str | None) -> EighthHouseReading:
    role = stated_role(gender)
    if role == "NOT_APPLIED":
        return EighthHouseReading("NOT_APPLIED", None, None, None, (), None, False)

    present = [g for g in _GRAHAS if g in chart.planet_rasi]
    factors: list[EighthHouseFactor] = []

    def add(kind: Kind, ref: Reference, graha: str, rasi: int, house: int, *, via: Via, target: Target,
            own_house: bool, rule: str, linked: Iterable[str] = (), varga: str = "D1") -> None:
        nature, condition = _nature(chart, graha)
        factors.append(EighthHouseFactor(
            kind=kind, reference=ref, graha=graha, rasi=rasi, house=house,
            nature=nature, condition=condition, dignity=_dignity(graha, rasi),
            combust=varga == "D1" and graha in chart.combust,
            lordship=_lordship(chart.lagna_rasi, graha), own_house=own_house,
            via=via, target=target, placement_id=f"{varga}.{graha}",
            also_counted_in=tuple(linked), rule=rule, tier=tier_of(rule),
        ))

    influenced = False
    for ref, ref_rasi in (("LAGNA", chart.lagna_rasi), ("MOON", chart.moon_rasi)):
        eighth = _nth(ref_rasi, 8)
        lord = SIGN_LORD[eighth]
        lord_rasi = chart.planet_rasi.get(lord)
        # The bride's lagna reading is the verse; the Moon reading and every
        # groom line are the rulings (engine_inference).
        verse = role == "BRIDE" and ref == "LAGNA"
        house_rule = PHALADEEPIKA_11_1.id if verse else GROUP_D_RULINGS_2026_11_11.id

        def h(rasi: int, _ref_rasi: int = ref_rasi) -> int:
            return house_from_reference(_ref_rasi, rasi)

        for g in present:
            r = chart.planet_rasi[g]
            if r != eighth:
                continue
            own = SIGN_LORD.get(r) == g
            nature, _ = _nature(chart, g)
            linked = [d for d, gs in _DOSHAM_GRAHAS.items() if g in gs and ref in chart.dosham_references.get(d, ())]
            rule = PHALADEEPIKA_11_1_OWN_HOUSE.id if own and nature == "MALEFIC" and verse else house_rule
            add("OCCUPANT", ref, g, r, 8, via="IN", target="HOUSE", own_house=own, rule=rule, linked=linked)  # type: ignore[arg-type]
            influenced |= nature == "MALEFIC" and not own

        if lord_rasi is not None:
            add("LORD", ref, lord, lord_rasi, h(lord_rasi), via="IN", target="LORD", own_house=lord_rasi == eighth,  # type: ignore[arg-type]
                rule=house_rule)
            influenced |= _dignity(lord, lord_rasi) == "DEBILITATED" or lord in chart.combust

        for g in present:
            r = chart.planet_rasi[g]
            nature, _ = _nature(chart, g)
            own = g == lord
            if nature == "MALEFIC" and r != eighth and aspects_house(g, r, eighth):
                add("INFLUENCE", ref, g, r, h(r), via="ASPECT", target="HOUSE", own_house=own,  # type: ignore[arg-type]
                    rule=GROUP_D_RULINGS_2026_11_11.id)
                influenced |= not own
            if nature == "MALEFIC" and lord_rasi is not None and g != lord:
                if r == lord_rasi:
                    add("INFLUENCE", ref, g, r, h(r), via="CONJUNCT", target="LORD", own_house=False,  # type: ignore[arg-type]
                        rule=GROUP_D_RULINGS_2026_11_11.id)
                elif aspects_house(g, r, lord_rasi):
                    add("INFLUENCE", ref, g, r, h(r), via="ASPECT", target="LORD", own_house=False,  # type: ignore[arg-type]
                        rule=GROUP_D_RULINGS_2026_11_11.id)

        # Protection lines: each with its own dignity, no automatic cancellation.
        for g in _PROTECTORS:
            if g not in chart.planet_rasi:
                continue
            r = chart.planet_rasi[g]
            if r != eighth and aspects_house(g, r, eighth):
                add("PROTECTION", ref, g, r, h(r), via="ASPECT", target="HOUSE", own_house=g == lord,  # type: ignore[arg-type]
                    rule=GROUP_D_RULINGS_2026_11_11.id)
            if lord_rasi is not None and g != lord and r != lord_rasi and aspects_house(g, r, lord_rasi):
                add("PROTECTION", ref, g, r, h(r), via="ASPECT", target="LORD", own_house=False,  # type: ignore[arg-type]
                    rule=GROUP_D_RULINGS_2026_11_11.id)

    d9_note: Literal["D9_LAGNA_UNRELIABLE", "D9_UNAVAILABLE"] | None = None
    if not chart.d9_rasi or chart.d9_lagna_rasi is None:
        d9_note = "D9_UNAVAILABLE"
    elif not chart.d9_lagna_reliable:
        d9_note = "D9_LAGNA_UNRELIABLE"
    else:
        lord = SIGN_LORD[_nth(chart.lagna_rasi, 8)]
        if lord in chart.d9_rasi:
            r9 = chart.d9_rasi[lord]
            add("D9_LORD", "D9_LAGNA", lord, r9, house_from_reference(chart.d9_lagna_rasi, r9), via="IN",
                target="LORD", own_house=False, rule=GROUP_D_RULINGS_2026_11_11.id, varga="D9")
        eighth9 = _nth(chart.d9_lagna_rasi, 8)
        for g in present:
            if chart.d9_rasi.get(g) == eighth9 and _nature(chart, g)[0] == "MALEFIC":
                add("D9_OCCUPANT", "D9_LAGNA", g, eighth9, 8, via="IN", target="HOUSE",
                    own_house=SIGN_LORD.get(eighth9) == g, rule=GROUP_D_RULINGS_2026_11_11.id, varga="D9")

    return EighthHouseReading(
        role=role,
        mangalya_reference="BOTH",
        eighth_from_lagna=_nth(chart.lagna_rasi, 8),
        eighth_from_moon=_nth(chart.moon_rasi, 8),
        factors=tuple(factors),
        d9_note=d9_note,
        malefic_influence=influenced,
    )


_SEVVAI_REF = {"from_lagna": "LAGNA", "from_moon": "MOON"}


def chart_from_snapshot(
    snap: object,
    *,
    sevvai_conditions: Iterable[str] = (),
    lagna_bracket: tuple[float, float] | None = None,
) -> EighthHouseChart:
    """Adapter from a chart response snapshot.

    ``sevvai_conditions``: the ``from_*`` references the caller's own Sevvai
    detection stands on (CI passes ``_sevvai_references``, so the link names the
    dosham the same report shows). Rahu-Ketu comes from the chart's dosham list.
    """
    data = snap.data  # type: ignore[attr-defined]
    planets = {p.graha: p for p in data.planets}
    sun, moon = planets.get("SUN"), planets.get("MOON")
    shukla = None
    if sun is not None and moon is not None:
        shukla = moon_is_natural_benefic((moon.absolute_longitude - sun.absolute_longitude) % 360.0)
    refs: dict[str, frozenset[str]] = {}
    sevvai = frozenset(_SEVVAI_REF[c] for c in sevvai_conditions if c in _SEVVAI_REF)
    if sevvai:
        refs["SEVVAI_DOSHAM"] = sevvai
    for d in getattr(data, "doshams", None) or ():
        if d.name == "RAHU_KETU_DOSHAM" and d.is_present:
            rk = frozenset(h.reference for h in d.reference_houses if h.counts and h.reference in ("LAGNA", "MOON"))
            if rk:
                refs["RAHU_KETU_DOSHAM"] = rk
    profile = getattr(data, "birth_profile", None)
    confidence = int(getattr(profile, "birth_time_confidence_minutes", 0) or 0)
    return EighthHouseChart(
        lagna_rasi=data.lagna.rasi,
        planet_rasi={g: p.rasi for g, p in planets.items() if g in _GRAHAS},
        combust=frozenset(g for g, p in planets.items() if getattr(p, "is_combust", False)),
        paksha_is_shukla=shukla,
        d9_rasi={g: p.d9_rasi for g, p in planets.items() if g in _GRAHAS and isinstance(p.d9_rasi, int)},
        d9_lagna_rasi=getattr(data.lagna, "d9_rasi", None),
        d9_lagna_reliable=d9_lagna_stable(data.lagna.absolute_longitude, lagna_bracket, confidence),
        dosham_references=refs,
    )


JointPattern = Literal["BOTH", "ONE", "NEITHER", "NOT_APPLIED"]


def joint_pattern(a: EighthHouseReading, b: EighthHouseReading) -> JointPattern:
    """Assessment 3: shown beside the samyam layers, never merged into them."""
    if a.role == "NOT_APPLIED" or b.role == "NOT_APPLIED":
        return "NOT_APPLIED"
    n = a.malefic_influence + b.malefic_influence
    return "BOTH" if n == 2 else "ONE" if n == 1 else "NEITHER"
