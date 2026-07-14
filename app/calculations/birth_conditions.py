"""Birth-time micro-condition detection (the "Border Alert" module).

These are the delicate junction/edge conditions of a horoscope that a coarse
"Rasi + Nakshatra" reading misses but that materially change a chart's meaning:

  * Cazimi (heart of the Sun)      — an empowering sub-condition of combustion.
  * Sankranti birth                — born on a solar sign-ingress day.
  * Grahana Janma (eclipse birth)  — born at/near a solar or lunar eclipse.
  * Dagda rasi                     — sign(s) "burnt" (dagda/shoonya) by the birth tithi.

Cazimi is surfaced per-planet on ``PlanetPosition`` (see ``_chart_planets``);
this module additionally rolls it into the consolidated Border-Alert list so the
UI has one place to render every junction condition.

ASTROLOGER-GATED tables
-----------------------
Dagda rasi is a classical *table* lookup whose published tables diverge across
sources (Uttara Kalamrita vs. Muhurtha Chintamani vs. regional Tamil panchanga
usage). Per this project's standing rule that domain calc bugs are silent and
must be golden-validated, it stays behind ``DAGDA_RASI_TABLE_VERIFIED`` until a
Tamil Thirukanitham reader supplies the authoritative values.

Status (2026-07-14 live session): DAGDA_RASI is now VERIFIED and live — the
astrologer supplied the tithi-keyed "Zero Rasi" table (EC-2), which also
clarified that Dagda Rasi = Shoonya Rasi (same tithi-keyed concept), and that
the old solar-month × tithi key was actually the separate "Dagdha Tithi" dosha.
The former separate TITHI_SHOONYA flag (also tithi-keyed) was therefore retired
as a duplicate of DAGDA_RASI (EC-1). Distinct doshas deliberately NOT modelled
here: Dagdha Tithi (solar-month → burnt date), Maasa Shoonya Tithi (lunar-month
→ void tithi), and Dagdha Yoga (weekday × tithi → boolean). This mirrors the
repo's existing astrologer-gated conventions (DRAFT_GUIDE_SLUGS, Kalachakra).
"""
from __future__ import annotations

from collections.abc import Mapping, Sequence
from dataclasses import dataclass, field

from app.calculations.astro import RASI_NAMES, normalize_longitude
from app.calculations.transits import angular_distance

# Tamil rasi labels — kept local so this calculations module never imports from
# the api/ layer. Order matches RASI_NAMES (1-indexed).
RASI_NAMES_TA: dict[int, str] = {
    1: "மேஷம்", 2: "ரிஷபம்", 3: "மிதுனம்", 4: "கடகம்",
    5: "சிம்மம்", 6: "கன்னி", 7: "துலாம்", 8: "விருச்சிகம்",
    9: "தனுசு", 10: "மகரம்", 11: "கும்பம்", 12: "மீனம்",
}

GRAHA_LABELS_TA: dict[str, str] = {
    "SUN": "சூரியன்", "MOON": "சந்திரன்", "MARS": "செவ்வாய்",
    "MERCURY": "புதன்", "JUPITER": "குரு", "VENUS": "சுக்கிரன்",
    "SATURN": "சனி", "RAHU": "ராகு", "KETU": "கேது",
}

# Eclipse detection orbs (degrees). An eclipse requires a syzygy (new/full moon)
# occurring close to the Rahu-Ketu axis. These are the classical ecliptic-limit
# style orbs; requiring BOTH the syzygy and the node proximity keeps the flag
# tight to genuine eclipse births rather than any near-node conjunction.
SOLAR_ECLIPSE_NODE_ORB = 13.0
SOLAR_SYZYGY_ORB = 13.0       # Sun-Moon separation near 0° (New Moon)
LUNAR_ECLIPSE_NODE_ORB = 12.0
LUNAR_SYZYGY_ORB = 13.0       # Sun-Moon separation near 180° (Full Moon)

# --- Astrologer-gated tables (see module docstring) -------------------------
# NOTE: the former TITHI_SHOONYA table/flag was retired 2026-07-14 (EC-1). It was
# keyed tithi -> rasi(s), which the astrologer confirmed is the *same* phenomenon
# as Dagda Rasi (Dagdha Rasi = Shoonya Rasi = Zero Rasi). Keeping both would
# double-report; the single DAGDA_RASI flag below now covers it. ("Tithi Shoonya"
# as a label is deliberately avoided — it collides with the distinct Maasa
# Shoonya *tithi* dosha, which is month-keyed, not tithi-keyed.)
DAGDA_RASI_TABLE_VERIFIED = True
# Dagdha ("burnt") Rasi = Zero Rasi = Shoonya Rasi — the sign(s) rendered inert
# for a given tithi. Authoritative "Zero Rasi" table (Vidya Madhaviya lineage),
# supplied by the astrologer in the live session (2026-07-14, EC-2). Key is the
# tithi NAME 1-14, identical in both pakshas; Purnima (15) and Amavasya (30)
# have no burnt sign. This corrects the backlog's premise: Dagda Rasi is
# tithi-keyed, NOT solar-month × tithi (that key is the separate "Dagdha Tithi"
# dosha, which outputs a burnt *date*, not a birth burnt sign). Interior rows
# flagged for a Tamil-panchangam / B.V. Raman *Muhurtha* cross-check; the
# symmetric pairs (1↔12, 2↔11, 5↔8, 9↔10) and empty Purnima/Amavasya are stable.
# The *set* of burnt signs is paksha-independent (we report the set, so no paksha
# arg is needed). If a *primary* burnt sign is ever ranked/highlighted, note that
# the primary flips by paksha (Shukla → first, Krishna → second by Kala Purusha
# order), with source-noted exceptions at tithis 3, 4, and 7 — verify before use.
DAGDA_RASI_TABLE: dict[int, tuple[int, ...]] = {
    1: (7, 10), 2: (9, 12), 3: (5, 10), 4: (2, 11), 5: (3, 6),
    6: (1, 5), 7: (4, 9), 8: (3, 6), 9: (5, 8), 10: (5, 8),
    11: (9, 12), 12: (7, 10), 13: (2, 5), 14: (12, 3, 6, 9),
}


def _rasi_of(longitude: float) -> int:
    """Sidereal rasi number (1-12) for an absolute longitude."""
    return int(normalize_longitude(longitude) // 30.0) + 1


def tithi_number_from_longitudes(sun_longitude: float, moon_longitude: float) -> int:
    """Tithi (1-30) from the Sun-Moon elongation — the standard 12°-per-tithi rule."""
    elong = (moon_longitude - sun_longitude) % 360.0
    return int(elong // 12.0) + 1


def sun_rasi_day_bounds(
    sun_longitude_at_birth: float,
    sun_speed_deg_per_day: float,
    day_fraction_at_birth: float,
) -> tuple[int, int]:
    """Sidereal rasi of the Sun at the birth day's start and end.

    Linearly extrapolates from the birth-moment Sun longitude using its own
    daily speed. Over a single civil day the Sun's curvature is negligible, so
    this cleanly answers "did a sankranti fall within the birth day?" without a
    second ephemeris call. ``day_fraction_at_birth`` is 0.0 at local midnight,
    0.5 at local noon.
    """
    start = sun_longitude_at_birth - sun_speed_deg_per_day * day_fraction_at_birth
    end = sun_longitude_at_birth + sun_speed_deg_per_day * (1.0 - day_fraction_at_birth)
    return _rasi_of(start), _rasi_of(end)


@dataclass(frozen=True, slots=True)
class BirthConditionFlag:
    code: str                 # e.g. "CAZIMI", "SANKRANTI_BIRTH", "GRAHANA_BIRTH"
    is_present: bool
    severity: str             # "BOOST" | "ALERT" | "INFO"
    title_ta: str
    title_en: str
    description_ta: str
    description_en: str
    detail: dict[str, object] = field(default_factory=dict)


def is_sankranti_birth(sun_rasi_day_start: int, sun_rasi_day_end: int) -> bool:
    """True when the Sun changes sidereal sign during the birth civil day.

    Callers pass the Sun's sidereal rasi at the start and end of the birth day
    (local midnight to next local midnight). A differing rasi means a sankranti
    (solar ingress) fell within the day — a Sankranti birth.
    """
    return sun_rasi_day_start != sun_rasi_day_end


def detect_grahana_birth(
    sun_longitude: float,
    moon_longitude: float,
    rahu_longitude: float,
) -> tuple[bool, str | None, int | None]:
    """Detect an eclipse birth (Grahana Janma).

    Returns ``(is_present, eclipse_type, near_node)`` where ``eclipse_type`` is
    "SOLAR" or "LUNAR" and ``near_node`` is the node (as a rasi-agnostic marker:
    +1 for Rahu, -1 for Ketu) the luminary sits closest to. A solar eclipse is a
    New Moon near a node; a lunar eclipse is a Full Moon near a node.
    """
    ketu_longitude = normalize_longitude(rahu_longitude + 180.0)
    elongation = angular_distance(sun_longitude, moon_longitude)

    sun_to_rahu = angular_distance(sun_longitude, rahu_longitude)
    sun_to_ketu = angular_distance(sun_longitude, ketu_longitude)
    moon_to_rahu = angular_distance(moon_longitude, rahu_longitude)
    moon_to_ketu = angular_distance(moon_longitude, ketu_longitude)

    # Solar eclipse: New Moon (Sun-Moon conjunct) close to the nodal axis.
    if elongation <= SOLAR_SYZYGY_ORB:
        if min(sun_to_rahu, sun_to_ketu) <= SOLAR_ECLIPSE_NODE_ORB:
            near = 1 if sun_to_rahu <= sun_to_ketu else -1
            return True, "SOLAR", near

    # Lunar eclipse: Full Moon (Sun-Moon opposition) with the Moon near a node.
    if angular_distance(elongation, 180.0) <= 0.0 or elongation >= 180.0 - LUNAR_SYZYGY_ORB:
        if min(moon_to_rahu, moon_to_ketu) <= LUNAR_ECLIPSE_NODE_ORB:
            near = 1 if moon_to_rahu <= moon_to_ketu else -1
            return True, "LUNAR", near

    return False, None, None


def _dagda_tithi_name(tithi_number: int) -> int | None:
    """Paksha-independent tithi name (1-14) from an absolute tithi (1-30).

    Purnima (15) and Amavasya (30) return None — they have no burnt sign.
    """
    if tithi_number in (15, 30):
        return None
    return tithi_number if tithi_number <= 14 else tithi_number - 15


def dagda_rasi(tithi_number: int) -> tuple[int, ...]:
    """Burnt (dagda/shoonya) rasi numbers for a birth tithi.

    Tithi-keyed and paksha-independent (see DAGDA_RASI_TABLE). Empty for the
    full/new moon, and empty until the table is verified.
    """
    if not DAGDA_RASI_TABLE_VERIFIED:
        return ()
    name = _dagda_tithi_name(tithi_number)
    if name is None:
        return ()
    return DAGDA_RASI_TABLE.get(name, ())


def _rasi_label(rasi: int) -> str:
    return RASI_NAMES.get(rasi, str(rasi))


def _rasi_label_ta(rasi: int) -> str:
    return RASI_NAMES_TA.get(rasi, str(rasi))


def detect_birth_conditions(
    *,
    planet_longitudes: Mapping[str, float],
    tithi_number: int,
    sun_rasi_day_start: int,
    sun_rasi_day_end: int,
    cazimi_planets: Sequence[str] = (),
) -> list[BirthConditionFlag]:
    """Roll up every birth-time junction condition into one Border-Alert list.

    Only conditions that are actually present are returned. ``cazimi_planets``
    is the list of grahas already flagged cazimi on their PlanetPosition, passed
    in so this module and the per-planet flag never disagree.
    """
    flags: list[BirthConditionFlag] = []

    sun_lon = planet_longitudes.get("SUN")
    moon_lon = planet_longitudes.get("MOON")
    rahu_lon = planet_longitudes.get("RAHU")

    # --- Cazimi (empowering) -------------------------------------------------
    if cazimi_planets:
        names_en = ", ".join(p.title() for p in cazimi_planets)
        names_ta = ", ".join(GRAHA_LABELS_TA.get(p, p.title()) for p in cazimi_planets)
        flags.append(
            BirthConditionFlag(
                code="CAZIMI",
                is_present=True,
                severity="BOOST",
                title_ta="கசிமி — சூரிய இதயம்",
                title_en="Cazimi — Heart of the Sun",
                description_ta=(
                    f"{names_ta} சூரியனின் இதயத்தில் (0°17'-க்குள்) அமர்ந்து, "
                    "எரிந்து போகாமல் அசாதாரணமான பலம் பெறுகிறது."
                ),
                description_en=(
                    f"{names_en} sits in the heart of the Sun (within 0°17'), so it is "
                    "not burnt by combustion but made exceptionally strong."
                ),
                detail={"planets": list(cazimi_planets)},
            )
        )

    # --- Sankranti birth (restless friction) ---------------------------------
    if is_sankranti_birth(sun_rasi_day_start, sun_rasi_day_end):
        flags.append(
            BirthConditionFlag(
                code="SANKRANTI_BIRTH",
                is_present=True,
                severity="ALERT",
                title_ta="சங்கராந்தி பிறப்பு",
                title_en="Sankranti Birth",
                description_ta=(
                    f"சூரியன் {_rasi_label_ta(sun_rasi_day_start)}-லிருந்து "
                    f"{_rasi_label_ta(sun_rasi_day_end)}-க்கு மாறும் சங்கராந்தி நாளில் பிறப்பு — "
                    "உள் முரண்பாடும் அமைதியற்ற தன்மையும் தரக்கூடியது."
                ),
                description_en=(
                    f"Born on the sankranti day the Sun crosses from "
                    f"{_rasi_label(sun_rasi_day_start)} into {_rasi_label(sun_rasi_day_end)} — "
                    "classically linked to inner friction and a restless life."
                ),
                detail={
                    "from_rasi": sun_rasi_day_start,
                    "to_rasi": sun_rasi_day_end,
                },
            )
        )

    # --- Grahana Janma (eclipse birth) ---------------------------------------
    if sun_lon is not None and moon_lon is not None and rahu_lon is not None:
        present, eclipse_type, near_node = detect_grahana_birth(sun_lon, moon_lon, rahu_lon)
        if present:
            node_en = "Rahu" if near_node == 1 else "Ketu"
            node_ta = "ராகு" if near_node == 1 else "கேது"
            if eclipse_type == "SOLAR":
                desc_en = (
                    f"Born at/near a solar eclipse — a New Moon on the {node_en} axis. "
                    "The Sun and Moon are both shadowed, marking an intense, karmic birth."
                )
                desc_ta = (
                    f"சூரிய கிரகணத்தின் போது பிறப்பு — {node_ta} அச்சில் அமாவாசை. "
                    "சூரியனும் சந்திரனும் மறைக்கப்பட்டு தீவிர கர்ம பிறப்பைக் குறிக்கிறது."
                )
            else:
                desc_en = (
                    f"Born at/near a lunar eclipse — a Full Moon on the {node_en} axis. "
                    "The Moon is shadowed, classically an emotionally intense, karmic birth."
                )
                desc_ta = (
                    f"சந்திர கிரகணத்தின் போது பிறப்பு — {node_ta} அச்சில் பௌர்ணமி. "
                    "சந்திரன் மறைக்கப்பட்டு உணர்ச்சிகரமான கர்ம பிறப்பைக் குறிக்கிறது."
                )
            flags.append(
                BirthConditionFlag(
                    code="GRAHANA_BIRTH",
                    is_present=True,
                    severity="ALERT",
                    title_ta="கிரகண ஜென்மம்",
                    title_en="Grahana Janma (Eclipse Birth)",
                    description_ta=desc_ta,
                    description_en=desc_en,
                    detail={"eclipse_type": eclipse_type, "near_node": node_en},
                )
            )

    # --- Dagda rasi (tithi-keyed; EC-2) --------------------------------------
    burnt = dagda_rasi(tithi_number)
    if burnt:
        labels_en = ", ".join(_rasi_label(r) for r in burnt)
        labels_ta = ", ".join(_rasi_label_ta(r) for r in burnt)
        plural_en = "signs are" if len(burnt) > 1 else "sign is"
        flags.append(
            BirthConditionFlag(
                code="DAGDA_RASI",
                is_present=True,
                severity="ALERT",
                title_ta="தக்த ராசி",
                title_en="Dagda Rasi (Burnt Sign)",
                description_ta=f"{labels_ta} ராசி இந்தப் பிறப்பில் தக்தமாகிறது (எரிந்தது).",
                description_en=f"The {labels_en} {plural_en} burnt (dagda) for this birth.",
                detail={"burnt_rasis": list(burnt)},
            )
        )

    return flags
