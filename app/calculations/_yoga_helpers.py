"""Shared constants, dataclasses, and small utility functions for yoga/dosham detection."""
from __future__ import annotations

import re
from collections.abc import Iterable, Mapping
from dataclasses import dataclass

from app.calculations.astro import house_from_reference
from app.calculations.chart_strength import (
    EXALTATION_RASI,
    OWN_SIGN_RASI,
    SIGN_LORD,
)
from app.calculations.display_names import planet_en, planet_ta
from app.calculations.doctrine_options import DEFAULT_DOCTRINE, DoctrineOptions
from app.calculations.functional_nature import FunctionalNature, get_functional_nature
from app.calculations.functional_status import raja_participation
from app.calculations.yoga_rules import rule_ids_for_yoga

PlanetInput = int | Mapping[str, int | float | str]

KENDRA_HOUSES = {1, 4, 7, 10}
TRIKONA_HOUSES = {1, 5, 9}
DUSTHANA_HOUSES = {6, 8, 12}
# 2026-07 audit A-5: confirmed against mainstream Kuja/Chevvai Dosham
# references (Mars in 1,2,4,7,8,12 from Lagna/Moon/Venus) as the standard
# Tamil house set, including the 1st house — see docs/SEVVAIRAGU.MD §4.1.
TAMIL_SEVVAI_HOUSES = {1, 2, 4, 7, 8, 12}
RAHU_KETU_MARRIAGE_HOUSES = {1, 2, 7, 8}
SEVEN_PLANETS = ("SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN")
NATURAL_BENEFICS = {"JUPITER", "VENUS", "MERCURY", "MOON"}
# Mandhi/Gulika counts as a malefic occupant/aspect for yoga detection, same
# as Rahu/Ketu — see docs/THIRUKANITHAM_DEPTH_EXPANSION_PLAN.md Phase 1.2.
NATURAL_MALEFICS = {"SATURN", "MARS", "RAHU", "KETU", "SUN", "MANDHI"}

HOUSE_SIGN_NIVARTHI: dict[int, frozenset[int]] = {
    2:  frozenset({3, 6}),
    4:  frozenset({1, 8}),
    7:  frozenset({4, 10}),
    8:  frozenset({9, 12}),
    12: frozenset({2, 7}),
}

# DD-05: astrologer / porutham view only — see `DoshamResult.astrologer_markers`.
FEMALE_HIGH_ATTENTION_SEVVAI_HOUSES = frozenset({4, 8, 12})
MALE_HIGH_ATTENTION_SEVVAI_HOUSES = frozenset({2, 7, 8})
KADAGAM_SIMMAM_LAGNA_EXCEPTION = {4, 5}
SEVVAI_BENEFIC_REDUCERS = {"JUPITER", "VENUS", "MERCURY", "MOON"}


@dataclass(frozen=True, slots=True)
class YogaResult:
    name: str
    is_present: bool
    strength: str
    conditions_met: list[str]
    cancellation_factors: list[str]
    dasha_activated: bool
    description_ta: str
    description_en: str
    #: Activation grahas resolved **per chart**, for yogas whose key graha is a
    #: house *lord* and so cannot be named in a static registry row (Daridra's
    #: key graha is the 11th lord, which differs by lagna). When non-empty this
    #: overrides ``yoga_rules.activation_key_planets()`` for this one result.
    #:
    #: An empty tuple means "no per-chart override" — it does NOT mean dormant;
    #: the registry's ``key_planets`` still applies. Astrologer ruling,
    #: 2026-09-11.
    key_grahas: tuple[str, ...] = ()
    #: One tuple of forming grahas per *instance* behind this card. A merged
    #: card (Raja Yoga) unions ``key_grahas`` across instances, which loses
    #: which lords formed the same instance — and the 2026-09-23 "both lords"
    #: step applies only when Dasha and Bhukti lords formed the *same* one.
    #: Empty = the card is a single instance whose formers are ``key_grahas``.
    former_groups: tuple[tuple[str, ...], ...] = ()
    #: Grahas recorded as supporting, never forming — Rahu/Ketu sharing a sign
    #: with a Raja Yoga's forming lord (ruling 2026-09-23). Their dashas do not
    #: activate the yoga. Engine-internal; not on the wire.
    supporting_grahas: tuple[str, ...] = ()
    #: DD-15 secondary activators resolved per chart (the planets causing a
    #: neecha bhanga, a node's dispositor, the Moon for the Chandra yogas).
    #: Their dasha lights the yoga at the *moderate* tier only. Engine-internal.
    secondary_grahas: tuple[str, ...] = ()

    @property
    def rule_ids(self) -> tuple[str, ...]:
        """The rulebook IDs whose definitions this result can come from.

        Usually one. Two for ``RAJA_YOGA``, which merges an association
        formulation (`YOG-RY-01`) and an exchange formulation (`YOG-RY-02`) onto
        one card. A property rather than a field so it stays out of the wire
        schema and out of ``dataclasses.asdict`` — the split is an audit
        artefact, not an API change.
        """
        return rule_ids_for_yoga(self.name)


@dataclass(frozen=True, slots=True)
class DoshamResult:
    name: str
    is_present: bool
    is_cancelled: bool
    strength: str
    label: str
    category: str
    conditions_met: list[str]
    cancellation_factors: list[str]
    missing_data: list[str]
    dasha_activated: bool
    description_ta: str
    description_en: str
    explanation_what_ta: str
    explanation_what_en: str
    explanation_why_ta: str
    explanation_why_en: str
    explanation_how_ta: str
    explanation_how_en: str
    # Optional named sub-type (e.g. the specific Kala Sarpa naga). Empty for
    # doshams that have no variant. Rendered as a badge on the dosham card.
    variant_ta: str = ""
    variant_en: str = ""
    #: Observations for the astrologer / porutham view only — never on the
    #: consumer wire. DD-05: gender-weighted Sevvai houses live here, not in
    #: `conditions_met`, so no consumer surface can print "Female chart: …".
    astrologer_markers: tuple[str, ...] = ()
    #: DD-17: the grade the formation earns *before* any mitigation —
    #: STRONG / PARTIAL / WEAK, "" when the dosham did not form. `strength`
    #: stays the post-mitigation grade (WEAK once nivarthi applies), so this is
    #: the only place the reader can see how much the protections absorbed.
    formation_strength: str = ""
    #: DD-17: what remains after mitigation — NONE (not formed), MILD, MODERATE
    #: or STRONG. A mitigated dosham is never NONE: nivarthi lowers a dosham, it
    #: does not erase the placement that formed it (O-18's reasoning).
    residual: str = "NONE"
    #: DD-17: facts that shape the reading without moving the grade — e.g. the
    #: Rahu–Ketu axis *not* repeating from the Moon. Rendered as context, never
    #: as a trigger or a mitigation, and never counted.
    context_notes: tuple[str, ...] = ()
    #: DD-17: where the dosham was counted from, one row per reference point.
    reference_houses: tuple[ReferenceHouse, ...] = ()
    #: DD-17: what this placement tends to bring *in this chart* (e.g. Ketu in
    #: the 2nd), as opposed to `explanation_what_*`, which says what the dosham
    #: is for everyone. Empty when the detector has nothing chart-specific.
    meaning_ta: str = ""
    meaning_en: str = ""


@dataclass(frozen=True, slots=True)
class ReferenceHouse:
    """One reference point a dosham is counted from (DD-17).

    ``houses`` is the house (or, for the nodes, the Rahu house then the Ketu
    house) counted from ``reference_rasi``; ``counts`` says whether that
    placement falls in the dosham's houses from this reference. Language-free
    on purpose: surfaces render the rasi through their own localiser.
    """

    reference: str  # LAGNA | MOON | VENUS | D9_LAGNA
    reference_rasi: int
    houses: tuple[int, ...]
    counts: bool


#: DD-17 residual grades, Tier C (engine convention, not a textual rule).
_RESIDUAL_OF_ACTIVE = {"STRONG": "STRONG", "PARTIAL": "MODERATE", "MODERATE": "MODERATE", "WEAK": "MILD"}


def dosham_residual(
    *,
    is_present: bool,
    is_cancelled: bool,
    strength: str,
    formation_strength: str,
    narrow_margin: bool,
    primary_reference: bool = True,
) -> str:
    """What a dosham leaves behind after its mitigations (DD-17).

    Un-mitigated: the post-mitigation strength, renamed (PARTIAL → MODERATE).
    Mitigated: MILD, except that a formation graded STRONG whose mitigations
    only just reached the nivarthi threshold, and which stands on the primary
    reference (the Lagna), keeps a MODERATE residual. A strong placement barely
    offset is not the same reading as a mild one comfortably offset; the old
    "Low intensity" badge told both readers the same thing.
    """
    if not is_present:
        return "NONE"
    if not is_cancelled:
        return _RESIDUAL_OF_ACTIVE.get(strength, "MILD")
    if formation_strength == "STRONG" and narrow_margin and primary_reference:
        return "MODERATE"
    return "MILD"


@dataclass(frozen=True, slots=True)
class KalasarpaResult:
    is_present: bool
    pattern: str
    conditions_met: list[str]
    description_ta: str
    description_en: str
    # One of the 12 named nagas (Ananta..Sheshanaga), keyed on Rahu's house
    # from lagna. "NONE" when no Kala Sarpa is present.
    variant: str = "NONE"
    variant_ta: str = ""
    variant_en: str = ""
    rahu_house: int | None = None
    meaning_ta: str = ""
    meaning_en: str = ""


def _planet_rasi(planets: Mapping[str, PlanetInput], planet: str) -> int:
    value = planets[planet]
    if isinstance(value, int):
        return value
    if "rasi" in value:
        return int(value["rasi"])
    raise ValueError(f"Missing rasi for {planet}")


def _planets_as_rasi_map(planets: Mapping[str, PlanetInput]) -> dict[str, int]:
    return {planet: _planet_rasi(planets, planet) for planet in planets}


# ── Degree-based strength gating for otherwise sign-only yogas (audit T6) ─────
_STRENGTH_RANK: dict[str, int] = {"WEAK": 0, "PARTIAL": 1, "STRONG": 2}
_RANK_STRENGTH: dict[int, str] = {0: "WEAK", 1: "PARTIAL", 2: "STRONG"}


def gate_yoga_strength(
    base_strength: str,
    key_planets: Iterable[str],
    planet_scores: Mapping[str, int] | None,
    combust_planets: frozenset[str] = frozenset(),
    *,
    weak_threshold: int = 45,
    floor: str = "PARTIAL",
) -> tuple[str, list[str]]:
    """Downgrade a *present* yoga's reported strength by its key planets' condition.

    Whole-sign presence is decided by the caller and is NOT touched here — a
    Gaja Kesari with a combust Jupiter is still "present", but should not read as
    a full-strength yoga. This helper only ever *lowers* strength (never raises
    it) and floors at ``floor`` so a genuinely present yoga is not hidden.

    The composite ``planet_scores`` already fold in planetary war, gandanta, and
    dignity (see chart_strength); combustion is passed separately because the
    yoga engine receives it as its own flag set. Returns the modulated strength
    plus human-readable factor notes for ``cancellation_factors``.
    """
    if base_strength == "WEAK":
        return base_strength, []
    scores = planet_scores or {}
    keys = [p for p in key_planets if p]
    if not keys:
        return base_strength, []

    notes: list[str] = []
    downgrade = 0

    weakest = min(keys, key=lambda p: scores.get(p, 50))
    weakest_score = scores.get(weakest, 50)
    if weakest_score < weak_threshold:
        downgrade += 1
        notes.append(f"weak_key_planet_{weakest.lower()}_{weakest_score}")

    combust_keys = [p for p in keys if p in combust_planets]
    if combust_keys:
        downgrade += 1
        notes.append("combust_key_planet_" + "_".join(p.lower() for p in combust_keys))

    if downgrade == 0:
        return base_strength, []

    floor_rank = _STRENGTH_RANK[floor]
    new_rank = max(floor_rank, _STRENGTH_RANK[base_strength] - downgrade)
    return _RANK_STRENGTH[new_rank], notes


def _house_lord(lagna_rasi: int, house_number: int) -> str:
    house_rasi = ((lagna_rasi + house_number - 2) % 12) + 1
    return SIGN_LORD[house_rasi]


def houses_owned(lagna_rasi: int, planet: str) -> set[int]:
    return {h for h in range(1, 13) if _house_lord(lagna_rasi, h) == planet}


def raja_lord_qualifies(
    lagna_rasi: int, planet: str, doctrine: DoctrineOptions = DEFAULT_DOCTRINE
) -> bool:
    """May this kendra/trikona lord form a Raja Yoga, given a dusthana it also owns?

    Kept as a name; the rule itself now lives in one place,
    `functional_status.raja_participation` (DD-07). Lagna ownership decides
    first; a 6th/8th co-lord is decided by its moolatrikona sign (ruling
    2026-09-23); a 12th co-lord is no longer downgraded for the 12th alone
    (DD-07, O-4), which reverses the 2026-09-23 reading for Rishabam Sevvai,
    Thulam Budhan and Viruchigam Sukran — open item O-14.
    """
    return raja_participation(lagna_rasi, planet, doctrine).eligible


def _is_kendra_from(reference_rasi: int, target_rasi: int) -> bool:
    return house_from_reference(reference_rasi, target_rasi) in KENDRA_HOUSES


def _is_functional_benefic(lagna_rasi: int, planet: str) -> bool:
    nature = get_functional_nature(lagna_rasi, planet)
    return nature in {
        FunctionalNature.YOGAKARAKA,
        FunctionalNature.LAGNA_LORD,
        FunctionalNature.TRIKONA,
        FunctionalNature.KENDRA,
        FunctionalNature.NEUTRAL,
    }


def _is_active(active_lords: set[str], *lords: str) -> bool:
    return any(lord in active_lords for lord in lords)


def _strong_planet_house(lagna_rasi: int, planet_rasi: int) -> bool:
    return house_from_reference(lagna_rasi, planet_rasi) in KENDRA_HOUSES | TRIKONA_HOUSES


def _planet_is_strong(planets: Mapping[str, PlanetInput], planet: str, lagna_rasi: int) -> bool:
    planet_rasi = _planet_rasi(planets, planet)
    own_sign = planet_rasi in OWN_SIGN_RASI.get(planet, set())
    exalted = planet_rasi == EXALTATION_RASI.get(planet)
    return own_sign or exalted or _strong_planet_house(lagna_rasi, planet_rasi)


def _ordinal(n: int) -> str:
    tail = "th" if 11 <= n % 100 <= 13 else {1: "st", 2: "nd", 3: "rd"}.get(n % 10, "th")
    return f"{n}{tail}"


# MKS house per graha — the same table as `_yoga_dosham.MARANA_KARAKA_STHANA`,
# repeated here because that module imports this one.
_MKS_HOUSE = {"sun": 12, "moon": 8, "mars": 7, "mercury": 7, "jupiter": 3, "venus": 6, "saturn": 1}


def _parametrized_marker(marker: str, lang: str) -> str | None:
    """Markers that carry a planet or house (Putra Sarpa, Marana Karaka
    Sthana). Twins of the web panel's MARKER_PATTERNS rules for the same
    tokens; without them the why-text printed "mercury in marana karaka sthana"."""
    ta = lang == "ta"

    def name(code: str) -> str:
        return planet_ta(code.upper()) if ta else planet_en(code.upper())

    if m := re.fullmatch(r"fifth_house_has_([a-z]+)", marker):
        return (f"{name(m[1])} உங்கள் 5-ஆம் வீட்டில் (குழந்தை, படைப்பாற்றல் வீடு) உள்ளது" if ta
                else f"{name(m[1])} sits in your 5th house, the house of children and creativity")
    if m := re.fullmatch(r"fifth_lord_([a-z]+)_joined_by_([a-z]+)", marker):
        return (f"உங்கள் 5-ஆம் அதிபதி {name(m[1])} இருக்கும் ராசியிலேயே {name(m[2])} உள்ளது" if ta
                else f"{name(m[2])} shares a sign with your 5th lord, {name(m[1])}")
    if m := re.fullmatch(r"jupiter_joined_by_([a-z]+)", marker):
        return (f"புத்திர காரகனான குரு இருக்கும் ராசியிலேயே {name(m[1])} உள்ளது" if ta
                else f"{name(m[1])} shares a sign with Jupiter, the karaka for children")
    if m := re.fullmatch(r"fifth_lord_([a-z]+)_strong", marker):
        return (f"உங்கள் 5-ஆம் அதிபதி {name(m[1])} வலுவாக உள்ளது; வீட்டின் சொந்த அதிபதி அதைக் காக்கிறது" if ta
                else f"Your 5th lord, {name(m[1])}, is strong; the house's own lord protects it")
    if m := re.fullmatch(r"jupiter_in_kendra_house_(\d+)", marker):
        return (f"புத்திர காரகனான குரு கேந்திரத்தில் (உங்கள் {m[1]}-ஆம் வீடு) உள்ளது; பாதுகாப்பு தருகிறது" if ta
                else f"Jupiter, the karaka for children, stands in a kendra (your {_ordinal(int(m[1]))} house) and protects")
    if (m := re.fullmatch(r"([a-z]+)_in_marana_karaka_sthana", marker)) and m[1] in _MKS_HOUSE:
        house = _MKS_HOUSE[m[1]]
        return (f"{name(m[1])} உங்கள் {house}-ஆம் வீட்டில் உள்ளது; இது அதன் மரண காரக ஸ்தானம்" if ta
                else f"{name(m[1])} is in your {_ordinal(house)} house, its Marana Karaka Sthana")
    if m := re.fullmatch(r"([a-z]+)_dignified_in_mks", marker):
        return (f"{name(m[1])} அங்கு ஆட்சி அல்லது உச்சம் பெற்றுள்ளது; பலவீனம் பெருமளவு ஈடுசெய்யப்படுகிறது" if ta
                else f"{name(m[1])} is in its own or exaltation sign there, which largely offsets the weakness")
    if m := re.fullmatch(r"jupiter_aspects_([a-z]+)_in_mks", marker):
        return (f"குருவின் பார்வை அங்கு {name(m[1])} மீது உள்ளது; பாதுகாப்பு தருகிறது" if ta
                else f"Jupiter aspects {name(m[1])} there, a protective influence")
    return None


def _marker_explain(marker: str) -> str:
    if (built := _parametrized_marker(marker, "en")) is not None:
        return built
    marker_labels = {
        "badhaka_active": "The badhaka lord (by your lagna) is touching your Lagna, Moon, lagna-lord, or current Dasha",
        "badhaka_lord_strong": "The badhaka lord is strong, so obstacles clear faster",
        "saturn_yogakaraka_own_fifth": "For Thulam lagna Saturn is the 5th lord and the yogakaraka, in its own sign, so it guards the house it occupies",
        "from_lagna": "Mars is in a dosha house from Lagna",
        "from_moon": "Mars is in a dosha house from Moon",
        "from_venus": "Mars is in a dosha house from Venus",
        "mars_own_sign": "Mars is in own sign",
        "mars_exaltation": "Mars is exalted",
        "mars_lagna_lord_mitigation": "Lagna-based mitigation applies",
        "tamil_sevvai_exception_cancer_leo": "The traditional Tamil exception for Kadagam/Simmam lagna applies as a strong mitigation, not a full cancellation",
        "house_sign_nivarthi": "House-sign nivarthi: Mars rasi cancels dosham for that house",
        "benefic_strong_seventh_lord": "7th lord strength gives protection",
        "jupiter_aspect_on_mars": "Jupiter influence on Mars reduces intensity",
        "jupiter_conjunct_mars": "Jupiter conjunct Mars in same rasi — strong nivarthi",
        "benefic_association_mars": "Benefic planet (Venus/Mercury/Moon) is conjunct Mars",
        "mars_dispositor_kendra_trikona": "Mars's sign lord is in a kendra or trikona counted from Mars",
        "both_partners_have_sevvai": "Comparable Sevvai in both charts",
        "node_afflicts_moon": "Rahu/Ketu is joined with the Moon",
        "rahu_ketu_axis_1_7": "The Rahu-Ketu axis falls on houses 1 and 7 from Lagna",
        "rahu_ketu_axis_2_8": "The Rahu-Ketu axis falls on houses 2 and 8 from Lagna",
        "node_with_seventh_lord": "A node is joined with the 7th lord",
        "node_with_venus": "A node is joined with Venus",
        "malefic_influence_on_seventh": "A malefic occupies or aspects the 7th house",
        "node_afflicts_from_moon_or_venus": "The axis also falls on a marriage house counted from the Moon or Venus",
        "guru_joins_or_aspects_node": "Jupiter joins or aspects a node",
        "node_in_favourable_sign_lineage": "A practitioner-selected node-dignity lineage treats this node sign as favourable",
        "guru_aspects_seventh_or_its_lord": "Jupiter aspects the 7th house or its lord",
        "strong_eighth_lord_or_benefic_on_eighth": "The 8th lord is strong, or a benefic influences the 8th house",
        "strong_second_lord_or_benefic_on_second": "The 2nd lord is strong, or a benefic other than Jupiter influences the 2nd house",
        "second_lord_dignified": "The 2nd lord is in its own or exaltation sign, unafflicted",
        # DD-17 context notes: same text as DOSHAM_CONTEXT_LABELS in
        # packages/shared/src/doshamReckoning.ts (held equal by a test).
        "sevvai_not_from_lagna": "Mars is not in a dosha house from your Lagna. The dosham is counted only from the Moon or Venus, which weighs less than a Lagna placement.",
        "rk_axis_not_repeated_from_moon_venus": "Counted from your Moon and from Venus, the nodes do not fall on houses 1, 2, 7 or 8. The axis is not repeated, which is the lighter reading.",
        "rk_axis_repeated_in_navamsa": "In the Navamsa (D9) the nodes again fall on houses 1, 2, 7 or 8 from its Lagna — the pattern repeats there.",
        "rk_axis_not_repeated_in_navamsa": "In the Navamsa (D9) the nodes fall outside houses 1, 2, 7 and 8 — the pattern does not repeat there.",
        "jupiter_kendra_trikona_support": "Jupiter support exists",
        "strong_seventh_lord": "7th lord is strong",
        "sun_with_node": "Sun is linked with Rahu/Ketu",
        "node_in_ninth": "Node is linked to 9th house",
        "saturn_in_ninth": "Saturn is in 9th house",
        "ninth_lord_dusthana": "9th lord is in 6/8/12",
        "sun_strong": "Sun strength acts as mitigation",
        "all_planets_between_rahu_and_ketu": "All planets lie in one Rahu-Ketu arc",
        "all_planets_between_ketu_and_rahu": "All planets lie in one Ketu-Rahu arc",
        "seventh_lord_strong_d9": "7th lord is strong in Navamsa (D9)",
        "jupiter_aspects_seventh_lord": "Jupiter aspects the 7th lord directly",
        "seventh_afflicted": "7th lord or marriage karaka is afflicted",
    }
    return marker_labels.get(marker, marker.replace("_", " "))


def _marker_explain_ta(marker: str) -> str:
    if (built := _parametrized_marker(marker, "ta")) is not None:
        return built
    marker_labels_ta = {
        "badhaka_active": "லக்னப்படி பாதக அதிபதி உங்கள் லக்னம்/சந்திரன்/லக்னாதிபதி அல்லது தற்போதைய தசையை பாதிக்கிறது",
        "badhaka_lord_strong": "பாதக அதிபதி வலுவாக உள்ளதால் தடைகள் விரைவில் கடக்கப்படும்",
        "saturn_yogakaraka_own_fifth": "துலாம் லக்னத்திற்கு சனி 5-ஆம் அதிபதியும் யோககாரகனும்; ஆட்சி பெற்று தன் வீட்டிலேயே இருப்பதால் அந்த வீட்டைக் காக்கிறது",
        "from_lagna": "செவ்வாய் லக்னத்திலிருந்து தோஷ வீட்டில் உள்ளது",
        "from_moon": "செவ்வாய் சந்திரனிலிருந்து தோஷ வீட்டில் உள்ளது",
        "from_venus": "செவ்வாய் சுக்கிரனிலிருந்து தோஷ வீட்டில் உள்ளது",
        "mars_own_sign": "செவ்வாய் சொந்த ராசியில் உள்ளது",
        "mars_exaltation": "செவ்வாய் உச்சத்தில் உள்ளது",
        "mars_lagna_lord_mitigation": "லக்ன அடிப்படையில் தணிக்கை பொருந்துகிறது",
        "tamil_sevvai_exception_cancer_leo": "கடகம்/சிம்ம லக்னத்திற்கான பாரம்பரிய தமிழ் விதிவிலக்கு வலுவான தணிக்கையாகப் பொருந்துகிறது; முழு நிவர்த்தி அல்ல",
        "house_sign_nivarthi": "இட-ராசி நிவர்த்தி தோஷத்தை குறைக்கிறது",
        "benefic_strong_seventh_lord": "7ம் அதிபதியின் வலிமை பாதுகாப்பு தருகிறது",
        "jupiter_aspect_on_mars": "குரு செவ்வாயை பார்க்கிறது; தீவிரம் குறைகிறது",
        "jupiter_conjunct_mars": "குரு செவ்வாயுடன் இணைந்துள்ளது; வலுவான நிவர்த்தி",
        "benefic_association_mars": "சுபகிரகம் செவ்வாயுடன் சேர்ந்துள்ளது",
        "mars_dispositor_kendra_trikona": "செவ்வாயிலிருந்து எண்ணும்போது, செவ்வாயின் ராசி அதிபதி கேந்திரம் அல்லது திரிகோணத்தில் உள்ளது",
        "both_partners_have_sevvai": "இரு ஜாதகங்களிலும் ஒத்த செவ்வாய் நிலை உள்ளது",
        "node_afflicts_moon": "ராகு/கேது சந்திரனுடன் சேர்ந்துள்ளது",
        "rahu_ketu_axis_1_7": "ராகு-கேது அச்சு லக்னத்திலிருந்து 1, 7ஆம் வீடுகளில் உள்ளது",
        "rahu_ketu_axis_2_8": "ராகு-கேது அச்சு லக்னத்திலிருந்து 2, 8ஆம் வீடுகளில் உள்ளது",
        "node_with_seventh_lord": "ராகு/கேது 7ம் அதிபதியுடன் சேர்ந்துள்ளது",
        "node_with_venus": "ராகு/கேது சுக்கிரனுடன் சேர்ந்துள்ளது",
        "malefic_influence_on_seventh": "பாவ கிரகம் 7ம் வீட்டில் உள்ளது அல்லது அதைப் பார்க்கிறது",
        "node_afflicts_from_moon_or_venus": "சந்திரன் அல்லது சுக்கிரனிலிருந்தும் அச்சு திருமண வீட்டில் விழுகிறது",
        "guru_joins_or_aspects_node": "குரு ராகு/கேதுவுடன் சேர்ந்துள்ளார் அல்லது பார்க்கிறார்",
        # Owner-ruled wording 2026-10-03 (v1.8): lineage-dependent, never universal.
        "node_in_favourable_sign_lineage": "தேர்ந்தெடுக்கப்பட்ட ஜோதிட மரபுப்படி, ராகு/கேது இருக்கும் இந்த ராசி சாதகமானதாகக் கருதப்படுகிறது",
        "guru_aspects_seventh_or_its_lord": "குரு 7ம் வீட்டையோ அதன் அதிபதியையோ பார்க்கிறார்",
        # Was "…சுப கிரகம் 8ம் வீட்டைப் பாதிக்கிறது" — "afflicts", the opposite
        # of benefic support. Same sentence as the web card, mitigation clause
        # included (native-reader correction 2026-10-03); "8-ஆம்" said once
        # (O-25 review, 2026-10-05).
        "strong_eighth_lord_or_benefic_on_eighth": "8-ஆம் வீட்டிற்கு ஆதரவு உள்ளது: அதன் அதிபதி வலுவாக உள்ளது அல்லது சுப கிரக ஆதரவு கிடைக்கிறது — இதனால் தாக்கம் குறைகிறது.",
        # DD-17 (2026-10-06), built on the reviewed 8th-support sentence.
        "strong_second_lord_or_benefic_on_second": "2-ஆம் வீட்டிற்கு ஆதரவு உள்ளது: அதன் அதிபதி வலுவாக உள்ளது அல்லது குரு அல்லாத சுப கிரக ஆதரவு கிடைக்கிறது — இதனால் தாக்கம் குறைகிறது.",
        "second_lord_dignified": "2-ஆம் அதிபதி ஆட்சி அல்லது உச்ச ராசியில், பாவ கிரகச் சேர்க்கையின்றி உள்ளது — 2-ஆம் வீட்டிற்குப் பாதுகாப்பு.",
        "sevvai_not_from_lagna": "லக்னத்திலிருந்து செவ்வாய் தோஷ வீட்டில் இல்லை; சந்திரன் அல்லது சுக்கிரனிலிருந்து மட்டுமே தோஷம் கணக்கிடப்படுகிறது. லக்னத்திலிருந்து வரும் தோஷத்தை விட இதன் எடை குறைவு.",
        "rk_axis_not_repeated_from_moon_venus": "சந்திரனிலிருந்தும் சுக்கிரனிலிருந்தும் எண்ணும்போது ராகு-கேது 1, 2, 7, 8-ஆம் வீடுகளில் இல்லை. அச்சு மீண்டும் வராதது லேசான நிலையைக் காட்டுகிறது.",
        "rk_axis_repeated_in_navamsa": "நவாம்சத்திலும் (D9) ராகு-கேது அதன் லக்னத்திலிருந்து 1, 2, 7 அல்லது 8-ஆம் வீடுகளில் உள்ளன — அமைப்பு அங்கும் மீண்டும் வருகிறது.",
        "rk_axis_not_repeated_in_navamsa": "நவாம்சத்தில் (D9) ராகு-கேது 1, 2, 7, 8-ஆம் வீடுகளுக்கு வெளியே உள்ளன — அமைப்பு அங்கு மீண்டும் வரவில்லை.",
        "jupiter_kendra_trikona_support": "குரு ஆதரவு உள்ளது",
        "strong_seventh_lord": "7ம் அதிபதி வலிமையாக உள்ளது",
        "sun_with_node": "சூரியன் ராகு/கேதுவுடன் தொடர்பில் உள்ளது",
        "node_in_ninth": "கிரக கணு 9ம் வீட்டுடன் தொடர்பில் உள்ளது",
        "saturn_in_ninth": "சனி 9ம் வீட்டில் உள்ளது",
        "ninth_lord_dusthana": "9ம் அதிபதி 6/8/12ல் உள்ளது",
        "sun_strong": "சூரியன் வலிமை தணிக்கையாக செயல்படுகிறது",
        "all_planets_between_rahu_and_ketu": "அனைத்து கிரகங்களும் ராகு-கேது வில்லினுள் உள்ளன",
        "all_planets_between_ketu_and_rahu": "அனைத்து கிரகங்களும் கேது-ராகு வில்லினுள் உள்ளன",
        "seventh_lord_strong_d9": "7ம் அதிபதி நவாம்சத்தில் வலிமையாக உள்ளது",
        "jupiter_aspects_seventh_lord": "குரு 7ம் அதிபதியை நேரடியாக பார்க்கிறது",
        "seventh_afflicted": "7ம் அதிபதி அல்லது திருமண காரகன் பாதிக்கப்பட்டுள்ளது",
        "seventh_lord_in_house_6": "7ம் அதிபதி 6ம் வீட்டில் உள்ளது",
        "seventh_lord_in_house_8": "7ம் அதிபதி 8ம் வீட்டில் உள்ளது",
        "seventh_lord_in_house_12": "7ம் அதிபதி 12ம் வீட்டில் உள்ளது",
        "seventh_lord_own_sign": "7ம் அதிபதி சொந்த ராசியில் உள்ளது",
        "seventh_lord_exalted": "7ம் அதிபதி உச்சத்தில் உள்ளது",
    }
    return marker_labels_ta.get(marker, marker.replace("_", " "))


_RESIDUAL_WORD: dict[str, tuple[str, str]] = {
    "STRONG": ("அதிகம்", "high"),
    "MODERATE": ("மிதமானது", "moderate"),
    "MILD": ("லேசானது", "mild"),
}


def dosham_verdict_sentence(
    label: str, residual: str | None, *, mitigation_count: int, formed: bool,
) -> tuple[str, str]:
    """One plain verdict line for a dosham (DD-17), Tamil and English.

    Mitigated reads "reduced, not erased" with the residual named — the line a
    reviewing practitioner asked for in place of a bare "Low intensity".
    ``residual`` None (an older caller) falls back to the label alone.
    """
    if not formed:
        return ("இந்த ஜாதகத்தில் இந்த தோஷம் உருவாகவில்லை.", "This dosham does not form in this chart.")
    mitigated = "NIVARTHI" in label or "CANCELLED" in label or "MITIGATED" in label
    if mitigated:
        word_ta, word_en = _RESIDUAL_WORD.get(residual or "MILD", _RESIDUAL_WORD["MILD"])
        return (
            f"தோஷம் உள்ளது; {mitigation_count} நிவர்த்தி காரணங்களால் அதன் தாக்கம் குறைகிறது. "
            f"மீதமுள்ள தாக்கம் {word_ta} — குறைந்துள்ளது, முழுமையாக நீங்கவில்லை.",
            f"Present, and reduced by {mitigation_count} protective factor{'s' if mitigation_count != 1 else ''}. "
            f"A {word_en} residual influence remains — reduced, not erased.",
        )
    if residual in _RESIDUAL_WORD:
        word_ta, word_en = _RESIDUAL_WORD[residual]
        return (f"தோஷம் உள்ளது. தீவிரம்: {word_ta}.", f"Present. Intensity: {word_en}.")
    return ("தோஷம் உள்ளது.", "Present.")


def _build_dosham_explanations(
    dosham_name: str,
    label: str,
    *,
    conditions_met: list[str],
    cancellation_factors: list[str],
    missing_data: list[str],
    residual: str | None = None,
    context_notes: Iterable[str] = (),
) -> tuple[str, str, str, str, str, str]:
    what_en_map = {
        "SEVVAI_DOSHAM": "Sevvai dosham is a traditional compatibility sensitivity indicator based on Mars placement.",
        "RAHU_KETU_DOSHAM": "Rahu-Ketu dosham is a traditional node-based sensitivity indicator interpreted by context.",
        "PITRU_DOSHAM": "Pitru dosham is a traditional lineage-karma sensitivity indicator in Tamil astrology.",
        "KALASARPA": "Kala Sarpa indicates all seven classical planets on one side of the Rahu-Ketu axis.",
        "BADHAKA_DOSHAM": "Badhaka dosham is an obstruction pattern from the badhaka lord (the lord of the 11th/9th/7th house, set by your lagna type) that can bring delays and last-minute blocks when it is active.",
        "KALATHRA_DOSHAM": "Kalathra dosham is a marriage-sensitivity indicator formed when the 7th house or its lord is afflicted.",
        "PUTRA_SARPA_DOSHAM": "Putra Sarpa dosham concerns the 5th house (children, learning, creativity). It forms when Rahu, Ketu or Saturn sits in the 5th house or shares a sign with the 5th lord, or when a node joins Jupiter, the karaka for children.",
        "MARANA_KARAKA_STHANA": "Each planet has one house, counted from the Lagna, where tradition holds it weakest: its Marana Karaka Sthana. A planet there gives its own results slowly or with extra effort, most of all in its dasha or bhukti. It is not a prediction about life span.",
    }
    what_ta_map = {
        "SEVVAI_DOSHAM": "செவ்வாய் தோஷம் என்பது செவ்வாயின் இடத்தை அடிப்படையாகக் கொண்ட திருமண இணக்கப் பார்வை குறிப்பான்.",
        "RAHU_KETU_DOSHAM": "ராகு-கேது தோஷம் என்பது கிரக நிலைகளை சூழ்நிலையோடு பார்க்கும் பாரம்பரிய தோஷ குறிப்பான்.",
        "PITRU_DOSHAM": "பித்ரு தோஷம் என்பது தமிழ் ஜோதிடத்தில் முன்னோர் கர்ம உணர்திறன் குறிப்பான்.",
        "KALASARPA": "காலசர்ப்ப யோகம் என்பது அனைத்து ஏழு கிரகங்களும் ராகு-கேது அச்சின் ஒரு பக்கத்தில் உள்ளதைக் குறிக்கும்.",
        "BADHAKA_DOSHAM": "பாதக தோஷம் என்பது உங்கள் லக்னப்படி அமையும் பாதக அதிபதி செயல்படும்போது தடைகளையும் கடைசி-நிமிட இடையூறுகளையும் தரக்கூடிய தடை-வடிவம்.",
        "KALATHRA_DOSHAM": "களத்திர தோஷம் என்பது 7-ம் வீடு அல்லது அதன் அதிபதி பாதிக்கப்படும்போது உருவாகும் திருமண உணர்திறன் குறிப்பான்.",
        "PUTRA_SARPA_DOSHAM": "புத்ர சர்ப்ப தோஷம் குழந்தை, கல்வி, படைப்பாற்றலைக் குறிக்கும் 5-ஆம் வீடு பற்றியது. ராகு, கேது அல்லது சனி 5-ஆம் வீட்டில் இருக்கும்போது, அல்லது 5-ஆம் அதிபதியுடன் ஒரே ராசியில் இருக்கும்போது, அல்லது புத்திர காரகனான குருவுடன் ராகு/கேது சேரும்போது இது உருவாகிறது.",
        "MARANA_KARAKA_STHANA": "ஒவ்வொரு கிரகத்திற்கும் லக்னத்திலிருந்து எண்ணும்போது, மரபுப்படி அது மிகவும் பலவீனமாகும் ஒரு வீடு உண்டு: அதுவே அதன் மரண காரக ஸ்தானம். அங்கு இருக்கும் கிரகம் தன் பலன்களை மெதுவாகவோ கூடுதல் முயற்சிக்குப் பிறகோ தரும், குறிப்பாக அதன் தசை அல்லது புக்தியில். இது ஆயுள் பற்றிய கணிப்பு அல்ல.",
    }
    what_en = what_en_map.get(dosham_name, "This is a traditional dosham indicator.")
    what_ta = what_ta_map.get(dosham_name, "இது ஒரு பாரம்பரிய தோஷ குறிப்பான்.")

    if missing_data:
        why_en = f"Result is marked incomplete because required chart data is missing: {', '.join(missing_data)}."
        why_ta = f"தேவையான ஜாதக தரவு கிடைக்கவில்லை: {', '.join(missing_data)}. முடிவு முழுமையடையவில்லை."
    else:
        # DD-17: a verdict sentence, not the engine label ("Final label: SEVVAI
        # DOSHAM WITH NIVARTHI." printed an enum at the reader).
        # Every detector's "not formed" label starts NO_ (NO_DOSHAM,
        # NO_SEVVAI_DOSHAM…); presence is not inferable from conditions_met,
        # since Pitru records a lone minor condition without forming.
        verdict_ta, verdict_en = dosham_verdict_sentence(
            label, residual, mitigation_count=len(cancellation_factors), formed=not label.startswith("NO_"),
        )
        why_parts: list[str] = [verdict_en]
        if conditions_met:
            why_parts.append("Triggered factors: " + "; ".join(_marker_explain(item) for item in conditions_met) + ".")
        else:
            why_parts.append("No triggering factors were found.")
        if cancellation_factors:
            why_parts.append("Mitigation factors: " + "; ".join(_marker_explain(item) for item in cancellation_factors) + ".")
        notes = tuple(context_notes)
        if notes:
            why_parts.append("Context: " + "; ".join(_marker_explain(item).rstrip(".") for item in notes) + ".")
        why_en = " ".join(why_parts)
        ta_parts: list[str] = [verdict_ta]
        if conditions_met:
            ta_parts.append("தூண்டும் காரணங்கள்: " + "; ".join(_marker_explain_ta(item) for item in conditions_met) + ".")
        else:
            ta_parts.append("எந்த தூண்டும் காரணமும் இல்லை.")
        if cancellation_factors:
            ta_parts.append("தணிக்கை காரணங்கள்: " + "; ".join(_marker_explain_ta(item) for item in cancellation_factors) + ".")
        if notes:
            ta_parts.append("சூழல்: " + "; ".join(_marker_explain_ta(item).rstrip(".") for item in notes) + ".")
        why_ta = " ".join(ta_parts)

    how_en = (
        "Use this as a guidance signal, not a fixed outcome. Review the full chart, check cancellation factors,"
        " and combine with practical communication, health, and family support decisions."
    )
    how_ta = (
        "இதை ஒரு வழிகாட்டல் சமிக்ஞையாக மட்டுமே பயன்படுத்துங்கள், முடிவான விளைவாக அல்ல. "
        "முழு ஜாதகத்தையும் பார்க்கவும், தணிக்கை காரணங்களை ஆராயவும், "
        "மேலும் நடைமுறை தொடர்பு, உடல்நலம், குடும்ப ஆதரவு முடிவுகளையும் சேர்க்கவும்."
    )
    return what_ta, what_en, why_ta, why_en, how_ta, how_en
