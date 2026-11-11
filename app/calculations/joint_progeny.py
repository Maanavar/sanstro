"""FAA-32: joint progeny, read across both charts.

Spec: docs/GROUP_D_SPECS_2026-11-11.md D3 as amended by §0.3 (rulings
2026-11-11). Describes and times only: no score, no status word, no net
verdict, and nothing on whether a child will come (Q17). Each factor carries a
``bearing`` (SUPPORTIVE / CHALLENGING / CONTEXT) so a surface can show the two
lists the spec asks for; nothing adds them up.

Per chart:

* the 5th from the lagna: occupants, its lord, and the grahas that aspect the
  house or aspect / join the lord;
* Guru as putra karaka: its own placement, and malefics joined to it;
* the 5th from Guru and its lord (BPHS 7.42, ``classical_rule``);
* the 5th from the Moon and its lord (``engine_inference``);
* a stated bride's 9th, its lord and occupants (Phaladeepika 11.1,
  ``classical_rule``, with the verse's own-house exception). A stated groom's
  9th is recorded as context only. No stated gender: no 9th, and the reading
  says so (``ninth="NOT_APPLIED"``);
* D7 lines only when the D7 lagna holds across the birth-time tolerance
  (``progeny_checks.check_d7``, the existing rule). Otherwise they drop, with
  a reason.

Per couple: three joint patterns (5th house, 5th lord, Guru: BOTH / ONE /
NEITHER), and dasha windows. A window is a true intersection of a bhukti of a
timing lord for A with a bhukti of a timing lord for B, inside the horizon
(5 years by default, 10 optional). Timing lords (rulings): the 5th lord, Guru,
5th occupants, the lord of the 5th from Guru, the 5th lord's dispositor, and a
bride's 9th lord and 9th occupants. Never the 2nd or 7th lords.

**Engine conventions, not rulings** (recorded so nobody reads them as doctrine):
the bearing of a lord or karaka (debilitated / combust / 6-8-12 = challenging;
exalted / own / kendra / trikona = supportive; both or neither = context); a
malefic in its own house outside the bride's 9th is context, not support,
because the verse's exception was checked only for that reading; "bhukti of a
timing lord" is read at antardasa level, from the spec's word "bhuktis"; and
no timing is given when either partner is under 18 or 50 and over.

Placement ids (``"D1.SATURN"``) are FAA-30's. ``also_counted_in`` names a formed
children's dosham whose own condition marker is this placement, so Saturn in
the 5th with Santhana Thadai formed is one finding, not two.
"""
from __future__ import annotations

from collections.abc import Iterable, Mapping, Sequence
from dataclasses import dataclass, field
from datetime import date
from typing import Literal

from app.calculations._yoga_helpers import DUSTHANA_HOUSES, KENDRA_HOUSES, TRIKONA_HOUSES
from app.calculations.aspects import aspects_house, moon_is_natural_benefic
from app.calculations.astro import house_from_reference, julian_day_to_utc_datetime
from app.calculations.dasha import DashaPeriod, _build_subperiods
from app.calculations.divisional_charts import compute_d7
from app.calculations.mangalya_sthana import (
    Condition,
    Dignity,
    Nature,
    dignity_of,
    graha_nature,
    lordship_of,
    nth_rasi,
    stated_role,
)
from app.calculations.progeny_checks import CHILDBEARING_AGE_LIMIT, CHILDREN_DOSHAMS, check_d7
from app.calculations.rule_sources import (
    BPHS_7_42,
    GROUP_D_RULINGS_2026_11_11,
    PHALADEEPIKA_11_1,
    PHALADEEPIKA_11_1_OWN_HOUSE,
    tier_of,
)
from app.constants.astrology import SIGN_LORD

Reference = Literal["LAGNA", "MOON", "JUPITER", "D7_LAGNA"]
Kind = Literal["OCCUPANT", "LORD", "KARAKA", "INFLUENCE", "BENEFIC_ASPECT", "D7_LORD", "D7_OCCUPANT", "D7_KARAKA"]
Via = Literal["IN", "CONJUNCT", "ASPECT"]
Target = Literal["HOUSE", "LORD", "KARAKA"]
Bearing = Literal["SUPPORTIVE", "CHALLENGING", "CONTEXT"]
Ninth = Literal["CHILDREN", "CONTEXT", "NOT_APPLIED"]
D7Note = Literal["D7_LAGNA_UNRELIABLE", "D7_UNAVAILABLE"]
JointKey = Literal["FIFTH_HOUSE", "FIFTH_LORD", "JUPITER"]
JointPattern = Literal["BOTH", "ONE", "NEITHER"]
TimingRole = Literal[
    "FIFTH_LORD", "JUPITER", "FIFTH_OCCUPANT", "FIFTH_FROM_JUPITER_LORD",
    "FIFTH_LORD_DISPOSITOR", "NINTH_LORD", "NINTH_OCCUPANT",
]
TimingNote = Literal["AGE_OUTSIDE_RANGE"]

#: Spec D3 / §0.3: 5 years by default, 10 optional.
HORIZON_YEARS_DEFAULT = 5
HORIZON_YEARS_OPTIONS = (5, 10)
#: Below this age neither partner's windows are shown (progeny_checks' band).
ADULT_AGE = 18

_GRAHAS = ("SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN", "RAHU", "KETU")
_STRONG_HOUSES = KENDRA_HOUSES | TRIKONA_HOUSES
_ROLE_ORDER: tuple[TimingRole, ...] = (
    "FIFTH_LORD", "JUPITER", "FIFTH_OCCUPANT", "FIFTH_FROM_JUPITER_LORD",
    "FIFTH_LORD_DISPOSITOR", "NINTH_LORD", "NINTH_OCCUPANT",
)


@dataclass(frozen=True, slots=True)
class ProgenyChart:
    """What FAA-32 reads from one chart. Rasi numbers 1-12."""

    lagna_rasi: int
    planet_rasi: Mapping[str, int]
    combust: frozenset[str] = frozenset()
    #: True = Shukla. None = derive from Sun/Moon rasis (aspects.py fallback).
    paksha_is_shukla: bool | None = None
    d7_rasi: Mapping[str, int] = field(default_factory=dict)
    d7_lagna_rasi: int | None = None
    #: From `progeny_checks.check_d7(...).houses_reliable`. False drops every D7 line.
    d7_lagna_reliable: bool = False
    #: Formed children's doshams -> their own condition markers
    #: (``fifth_house_has_saturn`` ...), for the shared placement link.
    dosham_markers: Mapping[str, tuple[str, ...]] = field(default_factory=dict)

    @property
    def moon_rasi(self) -> int:
        return self.planet_rasi["MOON"]


@dataclass(frozen=True, slots=True)
class ProgenyFactor:
    kind: Kind
    reference: Reference
    #: 5 or 9: the house this line belongs to. Karaka lines carry 5.
    bhava: int
    graha: str
    #: The graha's rasi in the chart (or D7) being read.
    rasi: int
    #: House of the graha from the reference.
    house: int
    nature: Nature
    condition: Condition | None
    dignity: Dignity
    combust: bool
    #: Functional statuses for this lagna, MARAKA removed (EC-RULING-06).
    lordship: tuple[str, ...]
    #: The graha owns the house it occupies or aspects.
    own_house: bool
    via: Via
    target: Target
    bearing: Bearing
    placement_id: str
    also_counted_in: tuple[str, ...]
    rule: str
    tier: str


@dataclass(frozen=True, slots=True)
class TimingLord:
    graha: str
    roles: tuple[TimingRole, ...]


@dataclass(frozen=True, slots=True)
class ProgenyReading:
    ninth: Ninth
    fifth_from_lagna: int
    fifth_from_moon: int
    fifth_from_jupiter: int | None
    #: None when the 9th is not applied.
    ninth_from_lagna: int | None
    factors: tuple[ProgenyFactor, ...]
    d7_note: D7Note | None
    timing_lords: tuple[TimingLord, ...]
    #: Descriptions for the joint layer, never grades.
    fifth_house_challenged: bool
    fifth_lord_challenged: bool
    jupiter_challenged: bool
    tier: str = "engine_inference"


@dataclass(frozen=True, slots=True)
class TimingSpan:
    start: date
    end: date
    lord: str
    maha_lord: str


@dataclass(frozen=True, slots=True)
class TimingWindow:
    start: date
    end: date
    lord_a: str
    maha_a: str
    roles_a: tuple[TimingRole, ...]
    lord_b: str
    maha_b: str
    roles_b: tuple[TimingRole, ...]


@dataclass(frozen=True, slots=True)
class JointLine:
    key: JointKey
    pattern: JointPattern


@dataclass(frozen=True, slots=True)
class JointProgeny:
    person_a: ProgenyReading
    person_b: ProgenyReading
    joint: tuple[JointLine, ...]
    windows: tuple[TimingWindow, ...]
    horizon_years: int
    horizon_start: date
    horizon_end: date
    timing_note: TimingNote | None
    tier: str = "engine_inference"


def ninth_role(gender: str | None) -> Ninth:
    role = stated_role(gender)
    return "CHILDREN" if role == "BRIDE" else "CONTEXT" if role == "GROOM_8TH" else "NOT_APPLIED"


def _lord_bearing(dignity: Dignity, combust: bool, house: int) -> Bearing:
    strained = dignity == "DEBILITATED" or combust or house in DUSTHANA_HOUSES
    held = dignity in ("EXALTED", "OWN") or house in _STRONG_HOUSES
    if strained and not held:
        return "CHALLENGING"
    if held and not strained:
        return "SUPPORTIVE"
    return "CONTEXT"


def _occupant_bearing(nature: Nature, own: bool, *, verse_exception: bool) -> Bearing:
    if nature == "BENEFIC":
        return "SUPPORTIVE"
    if own:
        return "SUPPORTIVE" if verse_exception else "CONTEXT"
    return "CHALLENGING"


def _linked(chart: ProgenyChart, marker: str) -> tuple[str, ...]:
    return tuple(name for name, markers in chart.dosham_markers.items() if marker in markers)


def one_chart(chart: ProgenyChart, gender: str | None) -> ProgenyReading:
    ninth = ninth_role(gender)
    present = [g for g in _GRAHAS if g in chart.planet_rasi]
    factors: list[ProgenyFactor] = []

    def nature(g: str) -> tuple[Nature, Condition | None]:
        return graha_nature(chart.planet_rasi, chart.paksha_is_shukla, g)

    def add(kind: Kind, ref: Reference, bhava: int, graha: str, rasi: int, house: int, *, via: Via,
            target: Target, own_house: bool, bearing: Bearing, rule: str, linked: Iterable[str] = (),
            varga: str = "D1") -> None:
        nat, cond = nature(graha)
        factors.append(ProgenyFactor(
            kind=kind, reference=ref, bhava=bhava, graha=graha, rasi=rasi, house=house,
            nature=nat, condition=cond, dignity=dignity_of(graha, rasi),
            combust=varga == "D1" and graha in chart.combust,
            lordship=lordship_of(chart.lagna_rasi, graha), own_house=own_house,
            via=via, target=target, bearing=bearing, placement_id=f"{varga}.{graha}",
            also_counted_in=tuple(linked), rule=rule, tier=tier_of(rule),
        ))

    def house_lines(ref: Reference, ref_rasi: int, bhava: int, rule: str, *, context_only: bool = False,
                    verse_exception: bool = False, aspects: bool = False) -> None:
        target_rasi = nth_rasi(ref_rasi, bhava)
        lord = SIGN_LORD[target_rasi]
        lord_rasi = chart.planet_rasi.get(lord)

        def h(r: int) -> int:
            return house_from_reference(ref_rasi, r)

        def b(x: Bearing) -> Bearing:
            return "CONTEXT" if context_only else x

        for g in present:
            r = chart.planet_rasi[g]
            if r != target_rasi:
                continue
            own = SIGN_LORD.get(r) == g
            nat, _ = nature(g)
            occ_rule = PHALADEEPIKA_11_1_OWN_HOUSE.id if own and nat == "MALEFIC" and verse_exception else rule
            linked = _linked(chart, f"fifth_house_has_{g.lower()}") if (ref, bhava) == ("LAGNA", 5) else ()
            add("OCCUPANT", ref, bhava, g, r, bhava, via="IN", target="HOUSE", own_house=own,
                bearing=b(_occupant_bearing(nat, own, verse_exception=verse_exception)), rule=occ_rule, linked=linked)

        if lord_rasi is not None:
            dig = dignity_of(lord, lord_rasi)
            add("LORD", ref, bhava, lord, lord_rasi, h(lord_rasi), via="IN", target="LORD",
                own_house=lord_rasi == target_rasi,
                bearing=b(_lord_bearing(dig, lord in chart.combust, h(lord_rasi))), rule=rule)

        if not aspects:
            return
        engine = GROUP_D_RULINGS_2026_11_11.id
        for g in present:
            r = chart.planet_rasi[g]
            nat, _ = nature(g)
            kind: Kind = "INFLUENCE" if nat == "MALEFIC" else "BENEFIC_ASPECT"
            own = g == lord
            if r != target_rasi and aspects_house(g, r, target_rasi):
                bear: Bearing = "SUPPORTIVE" if nat == "BENEFIC" else ("CONTEXT" if own else "CHALLENGING")
                add(kind, ref, bhava, g, r, h(r), via="ASPECT", target="HOUSE", own_house=own, bearing=b(bear), rule=engine)
            if lord_rasi is None or g == lord:
                continue
            bear = "SUPPORTIVE" if nat == "BENEFIC" else "CHALLENGING"
            if r == lord_rasi:
                linked = _linked(chart, f"fifth_lord_{lord.lower()}_joined_by_{g.lower()}") if nat == "MALEFIC" else ()
                add(kind, ref, bhava, g, r, h(r), via="CONJUNCT", target="LORD", own_house=False, bearing=b(bear),
                    rule=engine, linked=linked)
            elif aspects_house(g, r, lord_rasi):
                add(kind, ref, bhava, g, r, h(r), via="ASPECT", target="LORD", own_house=False, bearing=b(bear), rule=engine)

    engine = GROUP_D_RULINGS_2026_11_11.id
    # 1. The 5th from the lagna, with aspects (the rulings; no checked verse).
    house_lines("LAGNA", chart.lagna_rasi, 5, engine, aspects=True)

    # 2. Guru as putra karaka, and malefics joined to it.
    jupiter_rasi = chart.planet_rasi.get("JUPITER")
    if jupiter_rasi is not None:
        jh = house_from_reference(chart.lagna_rasi, jupiter_rasi)
        add("KARAKA", "LAGNA", 5, "JUPITER", jupiter_rasi, jh, via="IN", target="KARAKA", own_house=False,
            bearing=_lord_bearing(dignity_of("JUPITER", jupiter_rasi), "JUPITER" in chart.combust, jh), rule=engine)
        for g in present:
            if g != "JUPITER" and chart.planet_rasi[g] == jupiter_rasi and nature(g)[0] == "MALEFIC":
                add("INFLUENCE", "LAGNA", 5, g, jupiter_rasi, jh, via="CONJUNCT", target="KARAKA", own_house=False,
                    bearing="CHALLENGING", rule=engine, linked=_linked(chart, f"jupiter_joined_by_{g.lower()}"))
        # 3. The 5th from Guru and its lord: BPHS 7.42.
        house_lines("JUPITER", jupiter_rasi, 5, BPHS_7_42.id)

    # 4. The 5th from the Moon: engine_inference.
    house_lines("MOON", chart.moon_rasi, 5, engine)

    # 5. The 9th: a bride's is the verse; a groom's is context only.
    if ninth == "CHILDREN":
        house_lines("LAGNA", chart.lagna_rasi, 9, PHALADEEPIKA_11_1.id, verse_exception=True)
    elif ninth == "CONTEXT":
        house_lines("LAGNA", chart.lagna_rasi, 9, engine, context_only=True)

    # 6. D7, only on a D7 lagna the birth time can carry.
    d7_note: D7Note | None = None
    if not chart.d7_rasi or chart.d7_lagna_rasi is None:
        d7_note = "D7_UNAVAILABLE"
    elif not chart.d7_lagna_reliable:
        d7_note = "D7_LAGNA_UNRELIABLE"
    else:
        l7 = chart.d7_lagna_rasi
        fifth7 = nth_rasi(l7, 5)
        lord7 = SIGN_LORD[fifth7]
        if lord7 in chart.d7_rasi:
            r7 = chart.d7_rasi[lord7]
            h7 = house_from_reference(l7, r7)
            add("D7_LORD", "D7_LAGNA", 5, lord7, r7, h7, via="IN", target="LORD", own_house=r7 == fifth7,
                bearing=_lord_bearing(dignity_of(lord7, r7), False, h7), rule=engine, varga="D7")
        for g in present:
            if chart.d7_rasi.get(g) == fifth7:
                nat, _ = nature(g)
                own = SIGN_LORD.get(fifth7) == g
                add("D7_OCCUPANT", "D7_LAGNA", 5, g, fifth7, 5, via="IN", target="HOUSE", own_house=own,
                    bearing=_occupant_bearing(nat, own, verse_exception=False), rule=engine, varga="D7")
        if "JUPITER" in chart.d7_rasi:
            rj = chart.d7_rasi["JUPITER"]
            hj = house_from_reference(l7, rj)
            add("D7_KARAKA", "D7_LAGNA", 5, "JUPITER", rj, hj, via="IN", target="KARAKA", own_house=False,
                bearing=_lord_bearing(dignity_of("JUPITER", rj), False, hj), rule=engine, varga="D7")

    # Joint-layer facts: occupation, conjunction and the graha's own condition,
    # never an aspect (the Santhana Thadai trigger surface). With aspects these
    # fired BOTH for 79% (5th lord) and 63% (5th house) of synthetic couples:
    # Mars, Saturn, the nodes and the Sun together reach almost every sign.
    lagna5 = [f for f in factors if f.reference == "LAGNA" and f.bhava == 5 and f.via != "ASPECT"]
    return ProgenyReading(
        ninth=ninth,
        fifth_from_lagna=nth_rasi(chart.lagna_rasi, 5),
        fifth_from_moon=nth_rasi(chart.moon_rasi, 5),
        fifth_from_jupiter=nth_rasi(jupiter_rasi, 5) if jupiter_rasi is not None else None,
        ninth_from_lagna=nth_rasi(chart.lagna_rasi, 9) if ninth != "NOT_APPLIED" else None,
        factors=tuple(factors),
        d7_note=d7_note,
        timing_lords=timing_lords(chart, ninth),
        fifth_house_challenged=any(f.target == "HOUSE" and f.bearing == "CHALLENGING" for f in lagna5),
        fifth_lord_challenged=any(f.target == "LORD" and f.bearing == "CHALLENGING" for f in lagna5),
        jupiter_challenged=any(f.target == "KARAKA" and f.bearing == "CHALLENGING" for f in lagna5),
    )


def timing_lords(chart: ProgenyChart, ninth: Ninth) -> tuple[TimingLord, ...]:
    """The rulings' list. Never the 2nd or 7th lords; the 9th only for a bride."""
    roles: dict[str, list[TimingRole]] = {}

    def put(g: str | None, role: TimingRole) -> None:
        if g is None or g not in _GRAHAS:
            return
        if role not in roles.setdefault(g, []):
            roles[g].append(role)

    fifth = nth_rasi(chart.lagna_rasi, 5)
    fifth_lord = SIGN_LORD[fifth]
    put(fifth_lord, "FIFTH_LORD")
    put("JUPITER", "JUPITER")
    for g, r in chart.planet_rasi.items():
        if r == fifth:
            put(g, "FIFTH_OCCUPANT")
    jr = chart.planet_rasi.get("JUPITER")
    if jr is not None:
        put(SIGN_LORD[nth_rasi(jr, 5)], "FIFTH_FROM_JUPITER_LORD")
    lr = chart.planet_rasi.get(fifth_lord)
    if lr is not None:
        put(SIGN_LORD[lr], "FIFTH_LORD_DISPOSITOR")
    if ninth == "CHILDREN":
        ninth_rasi = nth_rasi(chart.lagna_rasi, 9)
        put(SIGN_LORD[ninth_rasi], "NINTH_LORD")
        for g, r in chart.planet_rasi.items():
            if r == ninth_rasi:
                put(g, "NINTH_OCCUPANT")
    return tuple(
        TimingLord(g, tuple(sorted(rs, key=_ROLE_ORDER.index)))
        for g, rs in sorted(roles.items(), key=lambda kv: _GRAHAS.index(kv[0]))
    )


def _add_years(d: date, years: int) -> date:
    return date(d.year + years, d.month, min(d.day, 28))


def active_spans(mahadashas: Iterable[DashaPeriod], lords: Iterable[str], start: date, end: date) -> tuple[TimingSpan, ...]:
    """Bhuktis of a timing lord, clipped to [start, end)."""
    wanted = set(lords)
    spans: list[TimingSpan] = []
    for maha in mahadashas:
        if maha.end_date <= start or maha.start_date >= end:
            continue
        for antar in _build_subperiods(maha, "antar"):
            if antar.lord not in wanted or antar.end_date <= start or antar.start_date >= end:
                continue
            spans.append(TimingSpan(max(antar.start_date, start), min(antar.end_date, end), antar.lord, maha.lord))
    return tuple(spans)


def intersect(a: Sequence[TimingSpan], b: Sequence[TimingSpan], roles_a: Mapping[str, tuple[TimingRole, ...]],
              roles_b: Mapping[str, tuple[TimingRole, ...]]) -> tuple[TimingWindow, ...]:
    """True intersections only: a window exists where both spans run, and
    starts strictly before it ends."""
    out: list[TimingWindow] = []
    for x in a:
        for y in b:
            s, e = max(x.start, y.start), min(x.end, y.end)
            if s < e:
                out.append(TimingWindow(s, e, x.lord, x.maha_lord, roles_a.get(x.lord, ()),
                                        y.lord, y.maha_lord, roles_b.get(y.lord, ())))
    return tuple(sorted(out, key=lambda w: (w.start, w.end)))


def _age(birth: date, on: date) -> int:
    return on.year - birth.year - ((on.month, on.day) < (birth.month, birth.day))


def joint_lines(a: ProgenyReading, b: ProgenyReading) -> tuple[JointLine, ...]:
    def pattern(x: bool, y: bool) -> JointPattern:
        return "BOTH" if x and y else "ONE" if x or y else "NEITHER"

    return (
        JointLine("FIFTH_HOUSE", pattern(a.fifth_house_challenged, b.fifth_house_challenged)),
        JointLine("FIFTH_LORD", pattern(a.fifth_lord_challenged, b.fifth_lord_challenged)),
        JointLine("JUPITER", pattern(a.jupiter_challenged, b.jupiter_challenged)),
    )


def joint_progeny(
    chart_a: ProgenyChart, gender_a: str | None, mahadashas_a: Sequence[DashaPeriod], birth_a: date,
    chart_b: ProgenyChart, gender_b: str | None, mahadashas_b: Sequence[DashaPeriod], birth_b: date,
    *, as_of: date, horizon_years: int = HORIZON_YEARS_DEFAULT,
) -> JointProgeny:
    if horizon_years not in HORIZON_YEARS_OPTIONS:
        raise ValueError(f"horizon_years must be one of {HORIZON_YEARS_OPTIONS}")
    a, b = one_chart(chart_a, gender_a), one_chart(chart_b, gender_b)
    end = _add_years(as_of, horizon_years)
    ages = (_age(birth_a, as_of), _age(birth_b, as_of))
    note: TimingNote | None = None
    windows: tuple[TimingWindow, ...] = ()
    if any(x < ADULT_AGE or x >= CHILDBEARING_AGE_LIMIT for x in ages):
        note = "AGE_OUTSIDE_RANGE"
    else:
        ra = {t.graha: t.roles for t in a.timing_lords}
        rb = {t.graha: t.roles for t in b.timing_lords}
        windows = intersect(active_spans(mahadashas_a, ra, as_of, end), active_spans(mahadashas_b, rb, as_of, end), ra, rb)
    return JointProgeny(a, b, joint_lines(a, b), windows, horizon_years, as_of, end, note)


def chart_from_snapshot(
    snap: object,
    *,
    lagna_bracket: tuple[float, float] | None = None,
) -> ProgenyChart:
    """Adapter from a chart response snapshot. The D7 lagna's reliability is
    `progeny_checks.check_d7`'s (the same rule the dosham's D7 step uses)."""
    data = snap.data  # type: ignore[attr-defined]
    planets = {p.graha: p for p in data.planets}
    sun, moon = planets.get("SUN"), planets.get("MOON")
    shukla = None
    if sun is not None and moon is not None:
        shukla = moon_is_natural_benefic((moon.absolute_longitude - sun.absolute_longitude) % 360.0)
    markers = {
        d.name: tuple(d.conditions_met or ())
        for d in (getattr(data, "doshams", None) or ())
        if d.name in CHILDREN_DOSHAMS and d.is_present
    }
    profile = getattr(data, "birth_profile", None)
    confidence = int(getattr(profile, "birth_time_confidence_minutes", 0) or 0)
    lagna_lon = getattr(data.lagna, "absolute_longitude", None)
    longitudes = {g: p.absolute_longitude for g, p in planets.items() if g in _GRAHAS}
    d7_rasi: dict[str, int] = {}
    d7_lagna = None
    reliable = False
    if lagna_lon is not None and len(longitudes) == len(_GRAHAS):
        d7 = compute_d7({**longitudes, "LAGNA": lagna_lon})
        d7_lagna = d7["LAGNA"]
        d7_rasi = {g: d7[g] for g in _GRAHAS}
        reliable = check_d7(longitudes, lagna_lon, (), birth_time_confidence_minutes=confidence,
                            lagna_bracket=lagna_bracket).houses_reliable
    return ProgenyChart(
        lagna_rasi=data.lagna.rasi,
        planet_rasi={g: p.rasi for g, p in planets.items() if g in _GRAHAS},
        combust=frozenset(g for g, p in planets.items() if getattr(p, "is_combust", False)),
        paksha_is_shukla=shukla,
        d7_rasi=d7_rasi,
        d7_lagna_rasi=d7_lagna,
        d7_lagna_reliable=reliable,
        dosham_markers=markers,
    )


def birth_date_of(snap: object) -> date:
    return julian_day_to_utc_datetime(snap.data.julian_day).date()  # type: ignore[attr-defined]
