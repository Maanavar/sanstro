from __future__ import annotations

from dataclasses import dataclass

from app.calculations.astro import degree_in_rasi, house_from_reference, normalize_longitude

RASI_NAMES = {
    1: "MESHAM",
    2: "RISHABAM",
    3: "MIDHUNAM",
    4: "KADAGAM",
    5: "SIMMAM",
    6: "KANNI",
    7: "THULAAM",
    8: "VRICHIGAM",
    9: "DHANUSU",
    10: "MAGARAM",
    11: "KUMBAM",
    12: "MEENAM",
}

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
    "MERCURY": {"direct": 12.0, "retrograde": 14.0},
    "VENUS": {"direct": 10.0, "retrograde": 8.0},
    "MARS": {"direct": 17.0, "retrograde": 17.0},
    "JUPITER": {"direct": 11.0, "retrograde": 11.0},
    "SATURN": {"direct": 15.0, "retrograde": 15.0},
    "MOON": {"direct": 12.0, "retrograde": 12.0},
}

# Gandanta zones: last 3°20' of water signs (Kadagam, Vrichigam, Meenam) and
# first 3°20' of fire signs (Simmam, Dhanusu, Mesham). Six zones total.
# Meenam end (356°40'–360°) and Mesham start (0°–3°20') are kept separate because
# normalize_longitude returns [0, 360) and 360.0 is never produced.
GANDANTA_RANGES = (
    (356.6666666667, 360.0),  # Meenam end — matches values in [356.667, 360)
    (0.0, 3.3333333333),       # Mesham start
    (116.6666666667, 120.0),   # Kadagam end
    (120.0, 123.3333333333),   # Simmam start
    (236.6666666667, 240.0),   # Vrichigam end
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


def is_gandanta(degree: float) -> bool:
    normalized = normalize_longitude(degree)
    return any(start <= normalized <= end for start, end in GANDANTA_RANGES)


def classify_sani_cycle(position_from_moon: int) -> CycleAssessment:
    mapping = {
        12: CycleAssessment(
            type="EZHARAI_SANI_PHASE_1",
            is_active=True,
            supportive_label="Expenditure, release, and discipline cycle",
        ),
        1: CycleAssessment(
            type="JANMA_SANI",
            is_active=True,
            supportive_label="Self, routine, and resilience alignment cycle",
        ),
        2: CycleAssessment(
            type="EZHARAI_SANI_PHASE_3",
            is_active=True,
            supportive_label="Family, speech, and resource balancing cycle",
        ),
        4: CycleAssessment(
            type="ARDHASHTAMA_SANI",
            is_active=True,
            supportive_label="Home and inner stability refinement cycle",
        ),
        7: CycleAssessment(
            type="KANTAKA_SANI",
            is_active=True,
            supportive_label="Relationships and partnership caution cycle",
        ),
        8: CycleAssessment(
            type="ASHTAMA_SANI",
            is_active=True,
            supportive_label="Deep change, rest, and recovery cycle",
        ),
    }
    return mapping.get(position_from_moon, CycleAssessment(type=None, is_active=False))


def classify_kandaka_cycle(position_from_lagna: int) -> CycleAssessment:
    if position_from_lagna in {1, 4, 7, 10}:
        return CycleAssessment(
            type="KANDAKA_SANI",
            is_active=True,
            supportive_label="Lagna-based restructuring and responsibility cycle",
        )
    return CycleAssessment(type=None, is_active=False)


def transit_interpretation_key(graha: str, house_from_moon: int) -> str:
    return f"{graha}_FROM_MOON_{house_from_moon}"


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
