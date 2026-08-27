from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass
from functools import lru_cache
from typing import Any

from app.calculations.aspects import aspect_target_rasis
from app.calculations.astro import (
    RASI_NAMES as CANONICAL_RASI_NAMES,
)
from app.calculations.astro import (
    degree_in_rasi,
    house_from_reference,
    normalize_longitude,
    rasi_from_degree,
)
from app.calculations.ephemeris import (
    EphemerisSnapshot,
    calculate_sidereal_planets,
    saturn_longitude_at_jd,
)

# Transit-facing labels remain uppercase for backward compatibility in stored/output payloads.
RASI_NAMES = {number: name.upper() for number, name in CANONICAL_RASI_NAMES.items()}

GRAHA_LABELS = {
    "SUN": "SUN",
    "MOON": "MOON",
    "MARS": "MARS",
    "MERCURY": "MERCURY",
    "JUPITER": "GURU",
    "VENUS": "VENUS",
    "SATURN": "SANI",
    "RAHU": "RAHU",
    "KETU": "KETU",
}

MAJOR_GRAHAS = ("SANI", "GURU", "RAHU", "KETU")

COMBUST_ORBS = {
    "MERCURY": {"direct": 14.0, "retrograde": 12.0},
    "VENUS": {"direct": 10.0, "retrograde": 8.0},
    "MARS": {"direct": 17.0, "retrograde": 17.0},
    "JUPITER": {"direct": 11.0, "retrograde": 11.0},
    "SATURN": {"direct": 15.0, "retrograde": 15.0},
    # Moon near Sun = Amavasai (New Moon), not combustion in Vedic/Tamil Jyothidam.
}

# Cazimi ("in the heart of the Sun") — [VARIANT], not Tamil combustion doctrine.
#
# Doctrine A-10 (ruled 2026-08-19) confirmed the five combustion orbs below and
# the gandanta span, but deliberately did NOT confirm this one. Cazimi is a real
# technique; it is simply unsourced in this repository, and it should not ride
# along inside a table that is sourced. Treat the 0°17' figure as our declared
# choice until a Tamil source names it, and do not cite it as though the ruling
# covered it.
#
# The rare exceptional sub-condition of combustion: a planet within
# 0°17' (17 arc-minutes = 0.2833°) of the Sun's
# exact longitude is not burnt but supercharged: it sits in the Sun's heart and
# gains, rather than loses, indicative strength. This is a much tighter orb than
# the 8°-17° combustion orbs above, so every cazimi planet is also inside the
# combustion range — cazimi is the override that flips that penalty to a bonus.
CAZIMI_ORB = 17.0 / 60.0  # 0°17' in decimal degrees

# Gandanta zones: last 3°20' of water signs (Kadagam, Viruchigam, Meenam) and
# first 3°20' of fire signs (Simmam, Dhanusu, Mesham). Six zones total.
# Meenam end (356°40'–360°) and Mesham start (0°–3°20') are kept separate because
# normalize_longitude returns [0, 360) and 360.0 is never produced.
GANDANTA_RANGES = (
    (356.6666666667, 360.0),  # Meenam end — matches values in [356.667, 360)
    (0.0, 3.3333333333),       # Mesham start
    (116.6666666667, 120.0),   # Kadagam end
    (120.0, 123.3333333333),   # Simmam start
    (236.6666666667, 240.0),   # Viruchigam end
    (240.0, 243.3333333333),   # Dhanusu start
)


@dataclass(frozen=True, slots=True)
class CycleAssessment:
    type: str | None
    is_active: bool
    supportive_label: str | None = None


@dataclass(frozen=True, slots=True)
class TransitPosition:
    graha: str
    current_rasi: str
    house_from_moon: int
    house_from_lagna: int
    is_retrograde: bool
    is_combust: bool
    is_sandhi: bool
    is_gandanta: bool
    interpretation_key: str


def angular_distance(degree_a: float, degree_b: float) -> float:
    diff = abs(normalize_longitude(degree_a) - normalize_longitude(degree_b))
    return min(diff, 360.0 - diff)


def is_combust(graha: str, degree: float, sun_degree: float, is_retrograde: bool) -> bool:
    if graha in {"SUN", "RAHU", "KETU"}:
        return False

    if graha not in COMBUST_ORBS:
        return False

    motion_state = "retrograde" if is_retrograde else "direct"
    sep = angular_distance(degree, sun_degree)
    return sep <= COMBUST_ORBS[graha][motion_state]


def is_cazimi(graha: str, degree: float, sun_degree: float) -> bool:
    """True when ``graha`` sits in the heart of the Sun (within 0°17').

    Same eligible bodies as combustion (excludes the Sun itself and the shadow
    nodes). A cazimi planet is astronomically inside its combustion orb, so
    callers that apply a combustion penalty must check this first and invert it.
    """
    if graha in {"SUN", "RAHU", "KETU"}:
        return False
    if graha not in COMBUST_ORBS:
        return False
    return angular_distance(degree, sun_degree) <= CAZIMI_ORB


def combustion_severity(
    graha: str, degree: float, sun_degree: float, is_retrograde: bool
) -> float:
    """Graded combustion intensity in ``[0.0, 1.0]``.

    Classical combustion is a gradient, not a hard boundary: "the closer the
    planet is to the Sun, the more intense the combustion." This returns how
    burnt the planet is:

    * ``0.0`` — at or beyond the combustion orb edge (barely / not combust), or
      a body that never combusts (Sun / nodes / Moon), or a cazimi planet
      (the caller applies the cazimi bonus instead of a penalty).
    * ``1.0`` — at the cazimi boundary (0°17'), i.e. maximally burnt just
      *outside* the heart of the Sun.

    The taper is linear between the cazimi boundary and the planet's (motion-
    dependent) combustion orb, so a planet near the orb edge is only lightly
    penalised while one nearly conjunct the Sun takes the full weight.
    """
    if graha in {"SUN", "RAHU", "KETU"}:
        return 0.0
    if graha not in COMBUST_ORBS:
        return 0.0

    motion_state = "retrograde" if is_retrograde else "direct"
    orb = COMBUST_ORBS[graha][motion_state]
    sep = angular_distance(degree, sun_degree)
    if sep > orb or sep <= CAZIMI_ORB:
        return 0.0

    span = orb - CAZIMI_ORB
    if span <= 0:
        return 1.0
    return (orb - sep) / span


def is_gandanta(degree: float) -> bool:
    normalized = normalize_longitude(degree)
    return any(start <= normalized < end for start, end in GANDANTA_RANGES)


def classify_sani_cycle(position_from_moon: int) -> CycleAssessment:
    mapping = {
        12: CycleAssessment(
            type="EZHARAI_SANI_PHASE_1",
            is_active=True,
            supportive_label="Sade Sati beginning: discipline, expenses, and spiritual reset",
        ),
        1: CycleAssessment(
            type="JANMA_SANI",
            is_active=True,
            supportive_label="Sade Sati peak: major life restructuring with resilience growth",
        ),
        2: CycleAssessment(
            type="EZHARAI_SANI_PHASE_3",
            is_active=True,
            supportive_label="Sade Sati ending: financial caution with consolidation",
        ),
        4: CycleAssessment(
            type="ARDHASHTAMA_SANI",
            is_active=True,
            supportive_label="Home and inner stability refinement cycle",
        ),
        8: CycleAssessment(
            type="ASHTAMA_SANI",
            is_active=True,
            supportive_label="Deep change, rest, and recovery cycle",
        ),
    }
    return mapping.get(position_from_moon, CycleAssessment(type=None, is_active=False))


# Ezharai Sani (Sade Sati) severity grading by the natal Moon's nakshatra pada
# (quarter, 1-4) — a classical Tamil convention grading the intensity of the
# *entire* 7.5-year cycle, independent of which of the three phases is running.
# Pada 1 is graded harshest (Iron) down to pada 4 (Gold, mildest).
EZHARAI_SANI_MURTHI_BY_PADA: dict[int, dict[str, str]] = {
    1: {"grade": "IRON",   "ta": "இரும்பு சனி", "en": "Iron (Irumbu) Murthi — most severe"},
    2: {"grade": "COPPER", "ta": "செம்பு சனி",   "en": "Copper (Semmbu) Murthi — strong"},
    3: {"grade": "SILVER", "ta": "வெள்ளி சனி",   "en": "Silver (Velli) Murthi — moderate"},
    4: {"grade": "GOLD",   "ta": "பொன் சனி",     "en": "Gold (Ponnu) Murthi — mildest"},
}


def classify_ezharai_sani_murthi(moon_nakshatra_pada: int) -> dict[str, str]:
    """Grade overall Ezharai Sani severity from the natal Moon's nakshatra pada.

    Returns a dict with 'grade' (IRON/COPPER/SILVER/GOLD), 'ta', and 'en' keys.

    Doctrine §3 (WI-08): this is the "Traditional Pada Murthi — regional
    variant" — authentic minority Tamil practice (family lineages, some
    temple astrologers, some Nadi traditions), but NOT what printed
    panchangams publish. `classify_ezharai_sani_murthi_ingress` below is the
    ratified default; this function is kept for back-compat and must only
    ever be surfaced under an explicit "regional variant" label, never as an
    unlabeled default.
    """
    if moon_nakshatra_pada not in EZHARAI_SANI_MURTHI_BY_PADA:
        raise ValueError("moon_nakshatra_pada must be between 1 and 4")
    return dict(EZHARAI_SANI_MURTHI_BY_PADA[moon_nakshatra_pada])


# Ezharai Sani (Sade Sati) severity grading by the DEFAULT ingress-Moon method
# (Doctrine §3, ratified 2026-07): at the moment Saturn enters a new rasi,
# count the transiting Moon's rasi from the native's janma rasi. This is what
# printed panchangams publish and what users expect; keyed on the inclusive
# 1-based count `((moon - janma) % 12) + 1`.
EZHARAI_SANI_MURTHI_BY_INGRESS_COUNT: dict[int, dict[str, str]] = {
    1: {"grade": "GOLD",   "ta": "பொன் சனி",     "en": "Gold (Ponnu) Murthi — mildest"},
    6: {"grade": "GOLD",   "ta": "பொன் சனி",     "en": "Gold (Ponnu) Murthi — mildest"},
    11: {"grade": "GOLD",  "ta": "பொன் சனி",     "en": "Gold (Ponnu) Murthi — mildest"},
    2: {"grade": "SILVER", "ta": "வெள்ளி சனி",   "en": "Silver (Velli) Murthi — moderate"},
    5: {"grade": "SILVER", "ta": "வெள்ளி சனி",   "en": "Silver (Velli) Murthi — moderate"},
    9: {"grade": "SILVER", "ta": "வெள்ளி சனி",   "en": "Silver (Velli) Murthi — moderate"},
    3: {"grade": "COPPER", "ta": "செம்பு சனி",   "en": "Copper (Semmbu) Murthi — strong"},
    7: {"grade": "COPPER", "ta": "செம்பு சனி",   "en": "Copper (Semmbu) Murthi — strong"},
    10: {"grade": "COPPER", "ta": "செம்பு சனி",  "en": "Copper (Semmbu) Murthi — strong"},
    4: {"grade": "IRON",   "ta": "இரும்பு சனி", "en": "Iron (Irumbu) Murthi — most severe"},
    8: {"grade": "IRON",   "ta": "இரும்பு சனி", "en": "Iron (Irumbu) Murthi — most severe"},
    12: {"grade": "IRON",  "ta": "இரும்பு சனி", "en": "Iron (Irumbu) Murthi — most severe"},
}


def classify_ezharai_sani_murthi_ingress(janma_rasi: int, ingress_moon_rasi: int) -> dict[str, str]:
    """Grade overall Ezharai Sani severity by the DEFAULT ingress-Moon method
    (Doctrine §3): count the transiting Moon's rasi (at the instant Saturn
    entered its current rasi) from the native's janma rasi.

    Returns a dict with 'grade' (GOLD/SILVER/COPPER/IRON), 'ta', and 'en' keys.
    """
    count = ((ingress_moon_rasi - janma_rasi) % 12) + 1
    return dict(EZHARAI_SANI_MURTHI_BY_INGRESS_COUNT[count])


_SATURN_INGRESS_STEP_DAYS = 30.0
_SATURN_INGRESS_MAX_STEPS = 40  # ~1200 days walk-back cap (Saturn: ~2.5 yr/rasi)


@lru_cache(maxsize=64)
def find_saturn_ingress_jd(current_rasi: int, before_jd: float) -> float:
    """Find the JD when Saturn entered `current_rasi`.

    `before_jd` must fall within `current_rasi` (Saturn is already in that
    rasi at that instant). Walks backward ~30 days at a time (Saturn spends
    ~2.5 years per rasi) until the rasi differs, then bisects the bracketed
    window to the exact crossing instant — mirroring the boundary-finding
    approach `tamil_calendar.find_sankranti_jd` uses for the Sun.

    Known simplification: like the Sun-sankranti finder, this assumes a
    single forward crossing and does not special-case a retrograde loop that
    briefly re-enters the previous sign very close to the boundary — a rare
    edge case, not handled here.
    """
    hi = before_jd
    lo = before_jd - _SATURN_INGRESS_STEP_DAYS
    steps = 0
    while calculate_sidereal_planets(lo).bodies["SATURN"].rasi == current_rasi:
        hi = lo
        lo -= _SATURN_INGRESS_STEP_DAYS
        steps += 1
        if steps > _SATURN_INGRESS_MAX_STEPS:
            raise ValueError("saturn ingress search exceeded maximum walk-back window")

    for _ in range(64):
        mid = (lo + hi) / 2
        if calculate_sidereal_planets(mid).bodies["SATURN"].rasi == current_rasi:
            hi = mid
        else:
            lo = mid
    return hi


# One day, in JD. The egress search below bisects down to this and stops:
# the only consumer renders the result as a month and year, so grinding the
# bracket to seconds would buy precision nothing prints and would cost ~45
# further ephemeris probes on a request the reader is waiting on.
_SATURN_EGRESS_PRECISION_DAYS = 1.0
# THE STOPPING RULE IS GEOMETRIC, NOT A TIME WINDOW. Saturn's retrograde arc —
# the longitude it gives back between the station-retrograde and station-direct
# points — is ~6.8° at its widest. Once Saturn stands more than that past a sign
# boundary, no loop can carry it back into the sign it just left, so the last
# crossing behind it is final. 9° is the widest arc plus margin.
#
# Written this way on purpose: a fixed "wait N days and assume it is done"
# heuristic would have to guess how long the loop takes, which varies with where
# in the arc the boundary falls. This assumes only how FAR back a loop can
# reach, which is a property of the orbit and not of the particular crossing.
_SATURN_MAX_RETROGRADE_ARC_DEG = 9.0
# Coarse step for open travel; fine step once within `_RISK_BAND_DEG` of the
# boundary. The band is what makes the coarse step safe, and the numbers are
# chosen to give one invariant: Saturn's fastest is ~0.134°/day, so a thirty-day
# step moves at most ~4.02°, which is less than the 5° band — therefore a coarse
# step can never cross the boundary, and EVERY crossing is approached at the
# fine step. Without that, a re-entry lasting under a month could be stepped
# straight over, which is precisely the case this function exists to catch.
# Four days is ~0.5° at Saturn's fastest, and any excursion back across a
# boundary brackets a station, where the motion is slower still.
_SATURN_EGRESS_COARSE_STEP_DAYS = 30.0
_SATURN_EGRESS_FINE_STEP_DAYS = 4.0
_SATURN_EGRESS_RISK_BAND_DEG = 5.0
# Enough for the whole search: ~26 coarse steps of open travel to reach the
# band, then fine steps across the band and out to the arc limit, including a
# full retrograde loop spent inside it. Typical is ~130 probes, worst ~215.
# This is a runaway guard, not a tuning knob.
_SATURN_EGRESS_MAX_STEPS = 400


def _degrees_past(longitude: float, boundary: float) -> float:
    """Signed degrees from `boundary` to `longitude`, in (-180, 180].

    Positive means past the boundary (Saturn has left the sign), negative means
    still short of it. Signed rather than absolute so the caller can tell "9°
    past, cannot come back" from "9° short, has not arrived".
    """
    return ((longitude - boundary + 180.0) % 360.0) - 180.0


@lru_cache(maxsize=64)
def find_saturn_egress_jd(current_rasi: int, after_jd: float) -> float:
    """Find the JD when Saturn LEAVES `current_rasi`, searching forward.

    `after_jd` must fall within `current_rasi` — Saturn is already in that rasi
    at that instant, which the one caller guarantees by construction (it reads
    the rasi from this very JD). Violating it raises rather than searching from
    a position the search cannot interpret.

    Reads ``saturn_longitude_at_jd`` rather than ``calculate_sidereal_planets``
    — one Swiss Ephemeris call per probe instead of ten. The backward finder
    predates that helper and still takes full snapshots; it is left alone here
    because its caller is a cycle report that tolerates the cost and its
    results are already cached, and changing it is not this change's job.

    RETURNS THE FINAL EGRESS, NOT THE FIRST CROSSING, and the difference is
    months rather than days. Saturn crosses a sign boundary up to three times
    when the boundary falls inside its retrograde arc: forward, back, forward
    again. Taking the first crossing there names a month up to a station-gap
    early — and since every reader in a ~2.5-year residency shares one egress,
    a wrong one is wrong for all of them for the whole stretch. This walks past
    the first crossing, treats any return to `current_rasi` as evidence that
    the crossing behind it was not the last one, and only bisects once Saturn
    stands `_SATURN_MAX_RETROGRADE_ARC_DEG` past the boundary, beyond a loop's
    reach. `find_saturn_ingress_jd` above still has the old behaviour in the
    backward direction; its consumer is a cycle report, and it was left alone
    rather than changed untested.

    The value is not only rendered to a month: the five-minute reading's
    ``basis`` line prints it as a full ISO instant behind the disclosure
    toggle, so a reader can inspect the exact day. That is the reason this is
    a correctness fix and not a precision nicety.
    """
    boundary = 30.0 * (current_rasi % 12)
    jd = after_jd
    longitude = saturn_longitude_at_jd(jd)
    if rasi_from_degree(longitude) != current_rasi:
        raise ValueError("after_jd must fall within current_rasi")

    last_inside = jd
    first_outside: float | None = None
    steps = 0
    while True:
        past = _degrees_past(longitude, boundary)
        jd += (
            _SATURN_EGRESS_FINE_STEP_DAYS
            if abs(past) <= _SATURN_EGRESS_RISK_BAND_DEG
            else _SATURN_EGRESS_COARSE_STEP_DAYS
        )
        longitude = saturn_longitude_at_jd(jd)
        past = _degrees_past(longitude, boundary)

        if rasi_from_degree(longitude) == current_rasi:
            # A return. Whatever crossing we had bracketed was not the last.
            last_inside = jd
            first_outside = None
        else:
            if first_outside is None:
                first_outside = jd
            if past > _SATURN_MAX_RETROGRADE_ARC_DEG:
                # Out of reach of any loop: `first_outside` is the sample after
                # the last crossing, `last_inside` the one before it.
                lo, hi = last_inside, first_outside
                break

        steps += 1
        if steps > _SATURN_EGRESS_MAX_STEPS:
            raise ValueError("saturn egress search exceeded maximum walk-forward window")

    while hi - lo > _SATURN_EGRESS_PRECISION_DAYS:
        mid = (lo + hi) / 2
        if rasi_from_degree(saturn_longitude_at_jd(mid)) == current_rasi:
            lo = mid
        else:
            hi = mid
    return hi


# Kandaka's three limbs from the Janma Rasi. Same cycle, same single penalty —
# the labels differ only so the reader can place the pressure. Keys are the
# house from the natal Moon; the 1st is absent because it is Janma Sani, which
# has its own name. Display copy only: nothing matches on these strings.
_KANDAKA_LIMB_LABEL: dict[int, str] = {
    4: "Obstruction cycle at the fourth: home, land and inner settledness under strain — hold ground rather than move",
    7: "Obstruction cycle at the seventh: partnership and agreement slow to close — patience with sustained effort",
    10: "Obstruction cycle at the tenth: position, standing and the weight of the work itself — effort tells slowly, and late",
}


def classify_kandaka_cycle(position_from_moon: int) -> CycleAssessment:
    """Kandaka Sani: Saturn in the 4th, 7th or 10th from the Janma Rasi.

    [TAMIL_LINEAGE] Doctrine A-1, ruled 2026-08-19. Two things changed here.

    The **reference** moved from the Lagna to the Janma Rasi. That is not a
    cosmetic swap: most people's Lagna and Moon sign differ, so the two
    references select almost disjoint populations, and this changes who is told
    they are undergoing Kandaka Sani.

    The **house set** dropped the 1st, which belongs to Janma Sani.

    And Kandaka is **layered**, not a separate axis. Saturn in the 4th from the
    Moon is Ardhashtama Sani *and* Kandaka Sani; a reader in that position
    should be told both. We previously counted from the Lagna specifically so
    that Kandaka would never overlap the Moon-reference cycles — the overlap was
    read as a modelling defect and engineered away. It is not a defect; it is
    the rule. Tidiness is not evidence.

    Callers must therefore pass the house from the natal Moon and must render
    this alongside `classify_sani_cycle`, never instead of it.

    **The three limbs read differently, and the label now says which one fired**
    (`FCR-04`, 2026-08-27). The penalty is unchanged and deliberately so — one
    number, scored once, for all three. What changed is only the copy, because a
    single generic "obstruction" line was doing two things badly:

    * The **4th** always coincides with Ardhashtama Sani, so the reader is
      already being told about that cycle; repeating an unattributed obstruction
      line beside it reads as a second, independent affliction.
    * The **10th** is the contested limb. Standard gochar reads Saturn's 3rd,
      6th and 11th from the Moon as supportive and the 10th as *mixed*, so a
      reader who knows gochar meets a flat penalty here that their own reading
      does not corroborate. Naming what the 10th actually governs — position,
      standing, the weight of the work itself — is the difference between a
      verdict they can place and one that looks like an error.

    The astrologer's ruling stands: this is a real lineage rule and one
    competing reading is not grounds to overrule it. But the 10th is the limb to
    revisit first if the penalty is ever retuned, and the 7th is the one to
    leave alone.
    """
    label = _KANDAKA_LIMB_LABEL.get(position_from_moon)
    if label is not None:
        return CycleAssessment(
            type="KANDAKA_SANI",
            is_active=True,
            supportive_label=label,
        )
    return CycleAssessment(type=None, is_active=False)


# Spec §6.5 — Vedha table: for a planet in the good_house key, the value is the blocking house.
# When another planet simultaneously occupies the blocking house, the transit benefit is cancelled.
VEDHA_TABLE: dict[str, dict[int, int]] = {
    "SUN":     {3: 9, 6: 12, 10: 4, 11: 5},
    "MOON":    {1: 5, 3: 9, 6: 12, 7: 2, 10: 4, 11: 8},
    "MARS":    {3: 12, 6: 9, 11: 5},
    "MERCURY": {2: 5, 4: 3, 6: 9, 8: 1, 10: 8, 11: 12},
    "JUPITER": {2: 12, 5: 4, 7: 3, 9: 10, 11: 8},
    "VENUS":   {1: 8, 2: 7, 3: 1, 4: 10, 5: 9, 8: 5, 9: 11, 11: 3, 12: 6},
    "SATURN":  {3: 12, 6: 9, 11: 5},
}


# Classical exemptions: these pairs never vedha-cancel each other, regardless
# of house placement (WI-14).
_VEDHA_EXEMPT_PAIRS = frozenset({frozenset({"SUN", "SATURN"}), frozenset({"MOON", "MERCURY"})})


def check_vedha(
    planet: str,
    house_from_moon: int,
    all_transit_houses: dict[str, int],
) -> bool:
    """
    Returns True if any other transiting planet occupies the Vedha (blocking) house
    for this planet's current position, per spec §6.5.
    """
    vedha_house = VEDHA_TABLE.get(planet, {}).get(house_from_moon)
    if vedha_house is None:
        return False
    for other_planet, other_house in all_transit_houses.items():
        if other_planet == planet:
            continue
        if frozenset({planet, other_planet}) in _VEDHA_EXEMPT_PAIRS:
            continue
        if other_house == vedha_house:
            return True
    return False


def transit_interpretation_key(graha: str, house_from_moon: int) -> str:
    return f"{graha}_FROM_MOON_{house_from_moon}"


def get_jupiter_aspects(transit_rasi: int) -> list[int]:
    """Rasis (1-12) Jupiter aspects (5th/7th/9th) transiting from transit_rasi."""
    return aspect_target_rasis("JUPITER", transit_rasi)


def get_saturn_aspects(transit_rasi: int) -> list[int]:
    """Rasis (1-12) Saturn aspects (3rd/7th/10th) transiting from transit_rasi."""
    return aspect_target_rasis("SATURN", transit_rasi)


def get_mars_aspects(transit_rasi: int) -> list[int]:
    """Rasis (1-12) Mars aspects (4th/7th/8th) transiting from transit_rasi."""
    return aspect_target_rasis("MARS", transit_rasi)


def _extract_natal_rasi(natal_position: Any) -> int:
    if isinstance(natal_position, Mapping):
        if "rasi" in natal_position:
            return int(natal_position["rasi"])
    if hasattr(natal_position, "rasi"):
        return int(natal_position.rasi)
    raise ValueError("natal position must expose 'rasi'")


def planets_transited_by(
    transit_snapshot: EphemerisSnapshot,
    natal_planets: Mapping[str, Any],
) -> dict[str, list[str]]:
    transited: dict[str, list[str]] = {}
    for natal_name, natal_position in natal_planets.items():
        natal_rasi = _extract_natal_rasi(natal_position)
        transiting_grahas = [
            graha
            for graha, body in transit_snapshot.bodies.items()
            if body.rasi == natal_rasi
        ]
        transited[natal_name] = transiting_grahas
    return transited


def build_transit_position(
    graha: str,
    current_degree: float,
    current_rasi_number: int,
    sun_degree: float,
    natal_moon_rasi: int,
    natal_lagna_rasi: int,
    is_retrograde: bool,
) -> TransitPosition:
    transit_label = GRAHA_LABELS[graha]
    return TransitPosition(
        graha=transit_label,
        current_rasi=RASI_NAMES[current_rasi_number],
        house_from_moon=house_from_reference(natal_moon_rasi, current_rasi_number),
        house_from_lagna=house_from_reference(natal_lagna_rasi, current_rasi_number),
        is_retrograde=is_retrograde,
        is_combust=is_combust(graha, current_degree, sun_degree, is_retrograde),
        is_sandhi=degree_in_rasi(current_degree) <= 1.0 or degree_in_rasi(current_degree) >= 29.0,
        is_gandanta=is_gandanta(current_degree),
        interpretation_key=transit_interpretation_key(
            transit_label, house_from_reference(natal_moon_rasi, current_rasi_number)
        ),
    )
