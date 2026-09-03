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

# EC-7.2 — natal strength penalties for the *verified* boundary births. These are
# natal constants (true every day of life), so they belong in the per-planet natal
# strength (which flows once into daily + prediction) rather than as a flat daily-
# tone offset, which would only re-baseline the whole life uniformly. Applied to
# the afflicted luminary/luminaries in chart_strength via _chart_build, on the same
# natal-modifier ladder as cazimi (+10) / gandanta (-10) / planetary war (-15):
#   * Grahana Janma shadows the luminaries — both Sun and Moon for a solar eclipse
#     (New Moon on the node), the Moon alone for a lunar (Full Moon on the node;
#     the Sun is the light source, not the shadowed body). -10 each, on par with
#     gandanta — a serious classical natal affliction.
#   * Sankranti birth is a milder Sun-specific ingress junction (temperamental
#     friction, not a deep affliction). -5 on the Sun, half of gandanta.
# Dagda Rasi is deliberately NOT scored here — it is a per-sign table verdict that
# stays display-only. Cazimi is scored separately inside chart_strength itself
# (it is already resolved per-planet there), so it is absent from this map.
GRAHANA_LUMINARY_PENALTY = 10.0
SANKRANTI_SUN_PENALTY = 5.0

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
    # (L-12: dropped the `angular_distance(elongation, 180.0) <= 0.0` clause —
    # it was only ever true at exactly elongation == 180.0, a single point
    # already covered by the orb check below.)
    if elongation >= 180.0 - LUNAR_SYZYGY_ORB:
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


# The nine classical bodies checked for burnt-sign occupancy. Mandhi/Gulika and
# other sub-points are display-only and deliberately excluded so the Dagda note
# reports where it genuinely lands rather than over-flagging.
_DAGDA_OCCUPANT_GRAHAS: tuple[str, ...] = (
    "SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN", "RAHU", "KETU",
)


def _join_en(items: Sequence[str]) -> str:
    """Human 'a, b and c' join for readable prose."""
    parts = list(items)
    if len(parts) <= 1:
        return parts[0] if parts else ""
    if len(parts) == 2:
        return f"{parts[0]} and {parts[1]}"
    return f"{', '.join(parts[:-1])} and {parts[-1]}"


def _join_ta(items: Sequence[str]) -> str:
    """Tamil 'a, b மற்றும் c' join."""
    parts = list(items)
    if len(parts) <= 1:
        return parts[0] if parts else ""
    return f"{', '.join(parts[:-1])} மற்றும் {parts[-1]}"


def detect_birth_conditions(
    *,
    planet_longitudes: Mapping[str, float],
    tithi_number: int,
    sun_rasi_day_start: int,
    sun_rasi_day_end: int,
    cazimi_planets: Sequence[str] = (),
    lagna_rasi: int | None = None,
) -> list[BirthConditionFlag]:
    """Roll up every birth-time junction condition into one Border-Alert list.

    Only conditions that are actually present are returned. ``cazimi_planets``
    is the list of grahas already flagged cazimi on their PlanetPosition, passed
    in so this module and the per-planet flag never disagree. ``lagna_rasi`` (when
    known) lets the Dagda note say whether a burnt sign actually falls on the
    ascendant, turning an abstract almanac verdict into a chart-specific one.
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
                title_ta="கசிமி — சூரிய இதயம் (பலமூட்டும் நிலை)",
                title_en="Cazimi — Heart of the Sun (a strengthening condition)",
                description_ta=(
                    "ஒரு கிரகம் சூரியனுக்கு மிக அருகில் வரும்போது பொதுவாக பலம் இழக்கும் "
                    f"('எரிந்து போவது'). ஆனால் {names_ta} சரியாக சூரியனின் மையத்தில் "
                    "அமர்ந்திருப்பதால் நேர்மாறாக நடக்கிறது — அந்தக் கிரகம் அசாதாரணமான "
                    "பலமும் தெளிவும் பெற்று உங்கள் வாழ்வில் வலுவாகச் செயல்படுகிறது."
                ),
                description_en=(
                    "When a planet sits very close to the Sun it usually loses strength "
                    f"(it gets 'burnt'). But {names_en} sits at the exact centre of the Sun — "
                    "a rare sweet spot that does the opposite, making that planet unusually "
                    "strong and clear in how it shapes your life."
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
                    f"சூரியன் ஒரு ராசியிலிருந்து ({_rasi_label_ta(sun_rasi_day_start)}) "
                    f"அடுத்த ராசிக்கு ({_rasi_label_ta(sun_rasi_day_end)}) மாறிய நாளில் "
                    "நீங்கள் பிறந்தீர்கள் — இந்த மாற்ற நாள் 'சங்கராந்தி' எனப்படும். இந்தத் "
                    "திருப்புமுனையில் பிறப்பது பாரம்பரியமாக உள்முரண்பாடு மற்றும் அமைதியற்ற, "
                    "பல மாற்றங்கள் நிறைந்த வாழ்க்கையுடன் தொடர்புபடுத்தப்படுகிறது."
                ),
                description_en=(
                    "You were born on the day the Sun moved from one zodiac sign "
                    f"({_rasi_label(sun_rasi_day_start)}) into the next "
                    f"({_rasi_label(sun_rasi_day_end)}) — this changeover day is called "
                    "Sankranti. Being born right at this 'turning point' is traditionally "
                    "linked to an inner restlessness and a life with many changes."
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
            if eclipse_type == "SOLAR":
                desc_en = (
                    "You were born at or very near a solar eclipse — the moment the Sun is "
                    "briefly covered. Both the Sun (your core self) and the Moon (your "
                    "emotions) were shadowed at that moment, traditionally the mark of an "
                    "intense life with deep, karmic lessons to work through."
                )
                desc_ta = (
                    "சூரிய கிரகணத்தின் போது அல்லது அதற்கு மிக அருகில் நீங்கள் பிறந்தீர்கள் — "
                    "சூரியன் சிறிது நேரம் மறைக்கப்படும் தருணம். அப்போது சூரியனும் (உங்கள் "
                    "அடிப்படை ஆளுமை) சந்திரனும் (உங்கள் உணர்வுகள்) மறைக்கப்பட்டிருந்தன — "
                    "பாரம்பரியமாக இது ஆழமான கர்மப் பாடங்கள் கொண்ட தீவிர வாழ்க்கையைக் குறிக்கிறது."
                )
            else:
                desc_en = (
                    "You were born at or very near a lunar eclipse — when the full Moon is "
                    "briefly shadowed. The Moon governs your emotions, so a shadowed Moon at "
                    "birth is traditionally read as an emotionally intense, deeply karmic "
                    "start to life."
                )
                desc_ta = (
                    "சந்திர கிரகணத்தின் போது அல்லது அதற்கு மிக அருகில் நீங்கள் பிறந்தீர்கள் — "
                    "முழு நிலவு சிறிது நேரம் மறைக்கப்படும் தருணம். சந்திரன் உங்கள் உணர்வுகளை "
                    "ஆளுவதால், பிறப்பின்போது மறைந்த சந்திரன் பாரம்பரியமாக உணர்ச்சிகரமான, "
                    "ஆழமான கர்மத் தொடக்கமாகக் கருதப்படுகிறது."
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
        burnt_set = set(burnt)
        labels_en = _join_en([_rasi_label(r) for r in burnt])
        labels_ta = _join_ta([_rasi_label_ta(r) for r in burnt])
        many_signs = len(burnt) > 1

        # Where the burnt sign(s) actually land in *this* chart. The verdict only
        # bites on a planet or the lagna that occupies a burnt sign (and the
        # houses that sign rules from the ascendant) — naming the occupants turns
        # an abstract almanac note into "here is where it shows up for you".
        occupants_en: list[str] = []
        occupants_ta: list[str] = []
        occupant_codes: list[str] = []
        if lagna_rasi is not None and lagna_rasi in burnt_set:
            occupants_en.append("your Lagna (ascendant)")
            occupants_ta.append("உங்கள் லக்னம்")
            occupant_codes.append("LAGNA")
        for graha in _DAGDA_OCCUPANT_GRAHAS:
            lon = planet_longitudes.get(graha)
            if lon is not None and _rasi_of(lon) in burnt_set:
                occupants_en.append(graha.title())
                occupants_ta.append(GRAHA_LABELS_TA.get(graha, graha.title()))
                occupant_codes.append(graha)

        # Common opening — what a burnt sign is and *why* these signs are yours.
        what_why_en = (
            f"A 'burnt' sign (dagda — also called shoonya, 'void') is one the classical "
            f"almanac treats as temporarily drained of its usual strength for a person born "
            f"on your lunar day (tithi). Each tithi burns a different set of signs, and yours "
            f"burns {labels_en}."
        )
        what_why_ta = (
            f"'தக்த ராசி' (எரிந்த ராசி; 'சூன்ய ராசி' என்றும் அழைக்கப்படும்) என்பது உங்கள் பிறந்த "
            f"திதியின் அடிப்படையில் சிறிது காலம் தன் வழக்கமான பலம் குறைந்ததாகக் கருதப்படும் ராசி. "
            f"ஒவ்வொரு திதியும் வெவ்வேறு ராசிகளை 'எரிந்ததாக' ஆக்குகிறது; உங்கள் திதியில் {labels_ta} "
            f"ராசி எரிந்ததாகக் கருதப்படுகிறது."
        )

        if occupants_en:
            occ_en = _join_en(occupants_en)
            occ_ta = _join_ta(occupants_ta)
            sit_en = "sits" if len(occupants_en) == 1 else "sit"
            desc_en = (
                f"{what_why_en} In your chart {occ_en} {sit_en} in a burnt sign — so the parts "
                "of life those points touch tend to unfold a little more slowly and ask for "
                "extra patience and steady effort before they bear fruit. This points to delay "
                "and effort, not denial: it is one weighting factor a jyotishi balances against "
                "each planet's dignity, your running dasha, and the aspects on it."
            )
            desc_ta = (
                f"{what_why_ta} உங்கள் ஜாதகத்தில் {occ_ta} இந்த எரிந்த ராசியில் அமைந்துள்ளதால், "
                "அவை தொடர்பான வாழ்க்கை அம்சங்கள் சற்று மெதுவாகவே வெளிப்படும்; பலனளிக்க கூடுதல் "
                "பொறுமையும் நிலையான முயற்சியும் தேவைப்படும். இது தடை அல்ல, தாமதம் மட்டுமே — கிரக "
                "பலம், நடப்பு தசை, பார்வைகள் அனைத்தையும் சேர்த்தே ஜோதிடர் இதை எடைபோடுவார்."
            )
        else:
            these_signs_en = "these signs" if many_signs else "this sign"
            desc_en = (
                f"{what_why_en} In your chart no planet sits in {these_signs_en}, and "
                f"{'they are' if many_signs else 'it is'} not your ascendant — so the effect "
                f"stays light and mostly academic here. It softens, very slightly, the general "
                f"matters {labels_en} would govern, but with no planet or ascendant point there "
                "to carry it, a jyotishi would simply note it and weigh it against the rest of "
                "the chart."
            )
            desc_ta = (
                f"{what_why_ta} உங்கள் ஜாதகத்தில் இந்த ராசியில் எந்தக் கிரகமும் இல்லை, லக்னமும் "
                "அல்ல — எனவே இதன் தாக்கம் மிகக் குறைவே. இது அந்த ராசியின் பொதுப் பலன்களை சற்றே "
                "மென்மையாக்கும் அளவுதான்; அதைச் சுமக்க அங்கே கிரகமோ லக்னமோ இல்லாததால், ஜோதிடர் "
                "இதைக் கவனத்தில் கொண்டு மற்ற ஜாதக அம்சங்களுடன் சேர்த்து எடைபோடும் சிறு குறிப்பு மட்டுமே."
            )

        flags.append(
            BirthConditionFlag(
                code="DAGDA_RASI",
                is_present=True,
                severity="ALERT",
                title_ta="தக்த ராசி (எரிந்த ராசி)",
                title_en="Dagda Rasi (a 'burnt' sign for your birth day)",
                description_ta=desc_ta,
                description_en=desc_en,
                detail={"burnt_rasis": list(burnt), "occupied_by": occupant_codes},
            )
        )

    return flags


def birth_condition_strength_penalties(
    flags: Sequence[BirthConditionFlag],
) -> dict[str, float]:
    """Per-graha natal strength penalty from the verified boundary births (EC-7.2).

    Derived from the already-detected Border-Alert flags so eclipse/sankranti
    detection stays single-source. Only the luminaries are ever penalised — see
    GRAHANA_LUMINARY_PENALTY / SANKRANTI_SUN_PENALTY for the magnitudes and the
    astrology behind them. Grahana shadows the luminaries (Sun+Moon for a solar
    eclipse, Moon alone for a lunar); Sankranti nudges the Sun. Dagda Rasi and
    Cazimi are intentionally not in this map (display-only table verdict, and a
    per-planet modifier already resolved inside chart_strength, respectively).
    Returns an empty map when no scoring boundary condition is present.
    """
    penalties: dict[str, float] = {}
    for flag in flags:
        if not flag.is_present:
            continue
        if flag.code == "SANKRANTI_BIRTH":
            penalties["SUN"] = penalties.get("SUN", 0.0) + SANKRANTI_SUN_PENALTY
        elif flag.code == "GRAHANA_BIRTH":
            penalties["MOON"] = penalties.get("MOON", 0.0) + GRAHANA_LUMINARY_PENALTY
            if flag.detail.get("eclipse_type") == "SOLAR":
                penalties["SUN"] = penalties.get("SUN", 0.0) + GRAHANA_LUMINARY_PENALTY
    return penalties
