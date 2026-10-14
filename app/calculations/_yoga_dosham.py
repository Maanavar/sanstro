"""Dosham detection functions: Sevvai, Rahu/Ketu, Pitru, Kalasarpa, Kalathra, Putra Sarpa, Badhaka."""
from __future__ import annotations

from collections.abc import Iterable, Mapping

from app.calculations._yoga_helpers import (
    FEMALE_HIGH_ATTENTION_SEVVAI_HOUSES,
    HOUSE_SIGN_NIVARTHI,
    KADAGAM_SIMMAM_LAGNA_EXCEPTION,
    KENDRA_HOUSES,
    MALE_HIGH_ATTENTION_SEVVAI_HOUSES,
    RAHU_KETU_MARRIAGE_HOUSES,
    SEVEN_PLANETS,
    SEVVAI_BENEFIC_REDUCERS,
    TAMIL_SEVVAI_HOUSES,
    TRIKONA_HOUSES,
    DoshamResult,
    KalasarpaResult,
    PlanetInput,
    ReferenceHouse,
    _build_dosham_explanations,
    _house_lord,
    _is_active,
    _is_functional_benefic,
    _is_kendra_from,
    _planet_is_strong,
    _planet_rasi,
    _planets_as_rasi_map,
    dosham_residual,
)
from app.calculations.aspects import aspects_house, effective_natural_class
from app.calculations.astro import house_from_reference
from app.calculations.chart_strength import EXALTATION_RASI, OWN_SIGN_RASI, SIGN_LORD
from app.calculations.display_names import planet_en, planet_ta, rasi_en, rasi_ta
from app.calculations.doctrine_options import DEFAULT_DOCTRINE, LONGITUDE_EPSILON, DoctrineOptions

_MOVABLE_LAGNAS = {1, 4, 7, 10}
_FIXED_LAGNAS = {2, 5, 8, 11}
_DUAL_LAGNAS = {3, 6, 9, 12}

# Marana Karaka Sthana — the house (from Lagna) in which each classical graha's
# placement is traditionally treated as most adverse for matters that graha
# signifies, chiefly used to flag extra-caution dasha/bhukti periods (health,
# major decisions). This is NOT a death prediction; it is framed here purely as
# a traditional caution indicator, consistent with how other doshams in this
# module are framed (see _build_dosham_explanations).
MARANA_KARAKA_STHANA: dict[str, int] = {
    "SUN": 12,
    "MOON": 8,
    "MARS": 7,
    "MERCURY": 7,
    "JUPITER": 3,
    "VENUS": 6,
    "SATURN": 1,
}

# What each graha signifies (its karakatva), for the MKS "In your chart" line.
# Saturn's ayush karakatva is left out on purpose: beside the word "marana" it
# would read as the life-span prediction this indicator explicitly is not.
_MKS_KARAKA: dict[str, tuple[str, str]] = {
    "SUN": ("தந்தை, அதிகாரம், அரசுத் தொடர்பு, உடல் உயிர்ப்பு", "father, authority, government and vitality"),
    "MOON": ("தாய், மனம், உணர்வுகள், மன அமைதி", "mother, mind, emotions and peace of mind"),
    "MARS": ("தைரியம், உடன்பிறந்தோர், நிலம், சொத்து", "courage, siblings, land and property"),
    "MERCURY": ("அறிவு, பேச்சு, கல்வி, வணிகம்", "intellect, speech, learning and trade"),
    "JUPITER": ("ஞானம், குழந்தைகள், ஆசிரியர், செல்வம்", "wisdom, children, teachers and wealth"),
    "VENUS": ("திருமணம், சுகம், வாகனம், கலை", "marriage, comforts, vehicles and the arts"),
    "SATURN": ("உழைப்பு, ஒழுக்கம், சேவை, நீண்டகாலப் பொறுப்புகள்", "work, discipline, service and long-term duties"),
}

# The nature of each MKS house — why that house is the hard one for its graha.
_MKS_HOUSE_NATURE: dict[int, tuple[str, str]] = {
    12: ("செலவையும் இழப்பையும் குறிக்கும் வீடு", "the house of expense and loss"),
    8: ("மறைவையும் திடீர் மாற்றங்களையும் குறிக்கும் வீடு", "the house of upheaval and hidden matters"),
    7: ("கூட்டாண்மையைக் குறிக்கும் வீடு", "the house of partnership"),
    3: ("முயற்சியையும் தைரியத்தையும் குறிக்கும் வீடு", "the house of effort and courage"),
    6: ("பகை, கடன், நோயைக் குறிக்கும் வீடு", "the house of conflict, debt and illness"),
    1: ("உங்களையும் உடலையும் குறிக்கும் வீடு", "the house of self and body"),
}


def _mks_meaning(
    planets: Mapping[str, PlanetInput],
    afflicted: list[str],
    *,
    jupiter_aspects: set[str],
) -> tuple[str, str]:
    """Per-graha reading for Marana Karaka Sthana (DD-17 "In your chart").

    The card used to say only "mercury in marana karaka sthana" (a raw marker)
    and "the impact varies with your current Dasha period" — it never said
    which house, what the planet stands for, or when it matters.
    """
    parts_ta: list[str] = []
    parts_en: list[str] = []
    for planet in afflicted:
        rasi = _planet_rasi(planets, planet)
        house = MARANA_KARAKA_STHANA[planet]
        karaka_ta, karaka_en = _MKS_KARAKA[planet]
        nature_ta, nature_en = _MKS_HOUSE_NATURE[house]
        name_ta, name_en = planet_ta(planet), planet_en(planet)
        # The fact only: what MKS means is the card's "What this is", what it
        # brings and when are their own sections (said once, 2026-10-06).
        ta = (
            f"{karaka_ta} ஆகியவற்றின் காரகனான {name_ta} உங்கள் {house}-ஆம் வீட்டில் ({rasi_ta(rasi)}) உள்ளது — "
            f"{nature_ta}; இது அதன் மரண காரக ஸ்தானம்."
        )
        en = (
            f"{name_en}, the planet of {karaka_en}, sits in your {_ordinal_en(house)} house ({rasi_en(rasi)}), "
            f"{nature_en} — its Marana Karaka Sthana."
        )
        if rasi == EXALTATION_RASI.get(planet):
            ta += " இங்கு அது உச்சம் பெற்றுள்ளது; இது அந்தப் பலவீனத்தைப் பெருமளவு ஈடுசெய்கிறது."
            en += " Here it is exalted, which largely offsets the weakness."
        elif rasi in OWN_SIGN_RASI.get(planet, set()):
            ta += " இங்கு அது ஆட்சி பெற்றுள்ளது; இது அந்தப் பலவீனத்தைப் பெருமளவு ஈடுசெய்கிறது."
            en += " Here it is in its own sign, which largely offsets the weakness."
        if planet in jupiter_aspects:
            ta += " குருவின் பார்வை அதன் மீது உள்ளது; இது பாதுகாப்பு தருகிறது."
            en += " Jupiter aspects it there, which protects it."
        parts_ta.append(ta)
        parts_en.append(en)
    return " ".join(parts_ta), " ".join(parts_en)


def detect_sevvai_dosham(
    planets: Mapping[str, PlanetInput],
    lagna_rasi: int,
    *,
    gender: str | None = None,
    partner_has_sevvai_dosham: bool = False,
    active_lords: Iterable[str] | None = None,
    combust_planets: frozenset[str] = frozenset(),
    d9_rasi_map: Mapping[str, int] | None = None,
    d9_lagna_rasi: int | None = None,
    doctrine: DoctrineOptions = DEFAULT_DOCTRINE,
) -> DoshamResult:
    active = set(active_lords or ())
    # JUPITER is read unconditionally below (its drishti on Mars is a
    # cancellation), so it is required here too. It was left out, and a chart
    # without it raised KeyError instead of returning INCOMPLETE_DATA.
    missing_data = [planet for planet in ("MARS", "MOON", "VENUS", "JUPITER") if planet not in planets]
    if missing_data:
        what_ta, what_en, why_ta, why_en, how_ta, how_en = _build_dosham_explanations(
            "SEVVAI_DOSHAM",
            "INCOMPLETE_DATA",
            conditions_met=[],
            cancellation_factors=[],
            missing_data=missing_data,
        )
        return DoshamResult(
            name="SEVVAI_DOSHAM",
            is_present=False,
            is_cancelled=False,
            strength="WEAK",
            label="INCOMPLETE_DATA",
            category="MARRIAGE",
            conditions_met=[],
            cancellation_factors=[],
            missing_data=missing_data,
            dasha_activated=False,
            description_ta="செவ்வாய் தோஷம் பகுப்பாய்விற்கு செவ்வாய், சந்திரன், சுக்கிரன், குரு நிலைகள் தேவை.",
            description_en="Sevvai dosham analysis needs Mars, Moon, Venus, and Jupiter placements.",
            explanation_what_ta=what_ta,
            explanation_what_en=what_en,
            explanation_why_ta=why_ta,
            explanation_why_en=why_en,
            explanation_how_ta=how_ta,
            explanation_how_en=how_en,
        )

    mars_rasi = _planet_rasi(planets, "MARS")
    moon_rasi = _planet_rasi(planets, "MOON")
    venus_rasi = _planet_rasi(planets, "VENUS")
    conditions_met: list[str] = []
    house_hits: dict[str, int] = {}

    lagna_house = house_from_reference(lagna_rasi, mars_rasi)
    moon_house = house_from_reference(moon_rasi, mars_rasi)
    venus_house = house_from_reference(venus_rasi, mars_rasi)

    if lagna_house in TAMIL_SEVVAI_HOUSES:
        conditions_met.append("from_lagna")
        house_hits["from_lagna"] = lagna_house
    if moon_house in TAMIL_SEVVAI_HOUSES:
        conditions_met.append("from_moon")
        house_hits["from_moon"] = moon_house
    if venus_house in TAMIL_SEVVAI_HOUSES:
        conditions_met.append("from_venus")
        house_hits["from_venus"] = venus_house

    aggravation_count = 0
    if conditions_met and "MARS" in combust_planets:
        conditions_met.append("mars_combust")
        aggravation_count += 1
    if conditions_met and any(
        planet in planets and _planet_rasi(planets, planet) == mars_rasi
        for planet in ("SATURN", "RAHU")
    ):
        conditions_met.append("mars_joined_saturn_or_rahu")
        aggravation_count += 1

    # DD-05: gender weighting is for the astrologer / porutham view only. It is
    # recorded beside the result, never in `conditions_met`, so no consumer
    # surface can say "Female chart: …". It never decided presence anyway.
    gender_norm = (gender or "").lower()
    weighted = FEMALE_HIGH_ATTENTION_SEVVAI_HOUSES if gender_norm == "female" else (
        MALE_HIGH_ATTENTION_SEVVAI_HOUSES if gender_norm == "male" else frozenset()
    )
    astrologer_markers = tuple(
        f"{gender_norm}_weighted_house_{house_num}_{ref_key}"
        for ref_key, house_num in house_hits.items() if house_num in weighted
    )

    cancellation_factors: list[str] = []
    mitigation_score = 0
    major_cancellation = False
    exempt_lagna = False
    softened_by_exception = False

    if mars_rasi in OWN_SIGN_RASI["MARS"]:
        cancellation_factors.append("mars_own_sign")
        mitigation_score += 1
    if mars_rasi == EXALTATION_RASI["MARS"]:
        cancellation_factors.append("mars_exaltation")
        mitigation_score += 1

    if lagna_rasi in KADAGAM_SIMMAM_LAGNA_EXCEPTION:
        # DD-06: the traditional Tamil exception for Kadagam/Simmam lagna. The
        # marker is always recorded, so a later ruling (O-6) can switch to full
        # exemption without recomputing anything. Until then it is a strong
        # mitigation — one grade off and one mitigation point — and never by
        # itself an erasure: Mars's house, dignity and the other references
        # still set what remains.
        cancellation_factors.append("tamil_sevvai_exception_cancer_leo")
        if doctrine.o6_sevvai_cancer_leo == "full_exemption":
            exempt_lagna = True
        else:
            mitigation_score += 1
            softened_by_exception = True
    elif lagna_rasi in {1, 8} and lagna_house in {1, 2}:
        # O-18 is now operational without choosing the ruling: preserve the
        # shipped full cancellation by default, or switch to DD-06's strong
        # mitigation posture through DoctrineOptions.
        cancellation_factors.append("mars_lagna_lord_mitigation")
        mitigation_score += 1
        if doctrine.o18_aries_scorpio_sevvai == "full_cancellation":
            major_cancellation = True
        else:
            softened_by_exception = True

    for _ref_key, house_num in house_hits.items():
        if house_num in HOUSE_SIGN_NIVARTHI and mars_rasi in HOUSE_SIGN_NIVARTHI[house_num]:
            if "house_sign_nivarthi" not in cancellation_factors:
                cancellation_factors.append("house_sign_nivarthi")
            mitigation_score += 1

    jupiter_rasi = _planet_rasi(planets, "JUPITER")
    if aspects_house("JUPITER", jupiter_rasi, mars_rasi):
        cancellation_factors.append("jupiter_aspect_on_mars")
        mitigation_score += 1

    if jupiter_rasi == mars_rasi:
        cancellation_factors.append("jupiter_conjunct_mars")
        mitigation_score += 1
        major_cancellation = True

    for benefic in SEVVAI_BENEFIC_REDUCERS - {"JUPITER"}:
        if benefic in planets and _planet_rasi(planets, benefic) == mars_rasi:
            if "benefic_association_mars" not in cancellation_factors:
                cancellation_factors.append("benefic_association_mars")
            mitigation_score += 1
            break

    # O-26 (DD-17): off by default. The rule counted the sign lord *from Mars*,
    # had no cited source, and alone could turn a strong active dosham into
    # nivarthi — while its card label dropped "from Mars", so readers checked it
    # from the Lagna and found it false.
    mars_sign_lord = SIGN_LORD[mars_rasi]
    if doctrine.o26_sevvai_dispositor_mitigation != "off" and mars_sign_lord in planets:
        lord_rasi = _planet_rasi(planets, mars_sign_lord)
        if house_from_reference(mars_rasi, lord_rasi) in KENDRA_HOUSES | TRIKONA_HOUSES:
            cancellation_factors.append("mars_dispositor_kendra_trikona")
            mitigation_score += 1

    seventh_lord = _house_lord(lagna_rasi, 7)
    if seventh_lord in planets:
        seventh_lord_rasi = _planet_rasi(planets, seventh_lord)
        malefics = {"MARS", "SATURN", "RAHU", "KETU"}
        conjunct_malefic = any(
            p in planets and _planet_rasi(planets, p) == seventh_lord_rasi
            for p in malefics if p != seventh_lord
        )
        seventh_lord_combust = seventh_lord in combust_planets
        # O-27 (DD-17): a dignified 7th lord protects even outside a kendra —
        # one definition of "strong 7th lord" for both marriage doshams.
        if doctrine.o27_sevvai_seventh_lord_strength == "kendra_functional_benefic":
            seventh_lord_is_strong = _is_functional_benefic(lagna_rasi, seventh_lord) and _is_kendra_from(lagna_rasi, seventh_lord_rasi)
        else:
            seventh_lord_is_strong = _lord_is_strong(planets, seventh_lord, lagna_rasi, combust_planets)
        d9_strong = False
        if d9_rasi_map and d9_lagna_rasi and seventh_lord in d9_rasi_map:
            d9_house = house_from_reference(d9_lagna_rasi, d9_rasi_map[seventh_lord])
            d9_strong = d9_house in (KENDRA_HOUSES | TRIKONA_HOUSES)
        jupiter_aspect_7l = False
        if "JUPITER" in planets:
            jup_rasi = _planet_rasi(planets, "JUPITER")
            jupiter_aspect_7l = aspects_house("JUPITER", jup_rasi, seventh_lord_rasi)
        if seventh_lord_is_strong and not conjunct_malefic and not seventh_lord_combust:
            cancellation_factors.append("benefic_strong_seventh_lord")
            mitigation_score += 1
        if d9_strong:
            cancellation_factors.append("seventh_lord_strong_d9")
            mitigation_score += 1
        if jupiter_aspect_7l:
            cancellation_factors.append("jupiter_aspects_seventh_lord")
            mitigation_score += 1

    if partner_has_sevvai_dosham:
        cancellation_factors.append("both_partners_have_sevvai")
        major_cancellation = True

    is_present = bool(conditions_met) and not exempt_lagna
    is_cancelled = is_present and (major_cancellation or mitigation_score >= 2)
    strong_house_hit = any(house_hits.get(key) in {7, 8} for key in house_hits)
    reference_count = len([c for c in conditions_met if c.startswith("from_")])
    # DD-17: the formation's own grade, before any mitigation softens it.
    formation_strength = ""
    if is_present:
        formation_strength = "STRONG" if (strong_house_hit or reference_count >= 2 or aggravation_count) else "PARTIAL"
    if not is_present or is_cancelled:
        strength = "WEAK"
    elif strong_house_hit or len([c for c in conditions_met if c.startswith("from_")]) >= 2:
        strength = "PARTIAL" if softened_by_exception else "STRONG"
    else:
        strength = "WEAK" if softened_by_exception else "PARTIAL"
    if is_present and not is_cancelled and aggravation_count:
        strength = {"WEAK": "PARTIAL", "PARTIAL": "STRONG", "STRONG": "STRONG"}[strength]

    if not is_present:
        label = "NO_SEVVAI_DOSHAM"
    elif is_cancelled:
        label = "SEVVAI_DOSHAM_WITH_NIVARTHI"
    elif "from_lagna" not in conditions_met and "from_moon" not in conditions_met and "from_venus" in conditions_met:
        label = "SEVVAI_DOSHAM_CANDIDATE"
    elif strength == "STRONG":
        label = "STRONG_ACTIVE_SEVVAI_DOSHAM"
    else:
        label = "ACTIVE_SEVVAI_DOSHAM"

    residual = dosham_residual(
        is_present=is_present,
        is_cancelled=is_cancelled,
        strength=strength,
        formation_strength=formation_strength,
        narrow_margin=not major_cancellation and mitigation_score == 2,
        # The Lagna is the primary reference; a dosham counted only from the
        # Moon or Venus is the lighter reading (DD-17).
        primary_reference="from_lagna" in conditions_met,
    )
    context_notes = ("sevvai_not_from_lagna",) if is_present and "from_lagna" not in conditions_met else ()
    reference_houses = tuple(
        ReferenceHouse(reference=ref, reference_rasi=ref_rasi, houses=(house,), counts=house in TAMIL_SEVVAI_HOUSES)
        for ref, ref_rasi, house in (
            ("LAGNA", lagna_rasi, lagna_house),
            ("MOON", moon_rasi, moon_house),
            ("VENUS", venus_rasi, venus_house),
        )
    )

    # A protection of nothing is not a nivarthi (the L-5 invariant). Sent on an
    # unformed dosham, the web card read it as "did form … and was annulled"
    # and the chip as "Neutralized". Kept only when a lagna exemption (O-18
    # "full_cancellation") is what un-formed it.
    if not is_present and not exempt_lagna:
        cancellation_factors = []
    what_ta, what_en, why_ta, why_en, how_ta, how_en = _build_dosham_explanations(
        "SEVVAI_DOSHAM",
        label,
        conditions_met=conditions_met,
        cancellation_factors=cancellation_factors,
        missing_data=[],
        residual=residual,
        context_notes=context_notes,
    )
    return DoshamResult(
        name="SEVVAI_DOSHAM",
        is_present=is_present,
        is_cancelled=is_cancelled,
        strength=strength,
        label=label,
        category="MARRIAGE" if lagna_house not in {1, 8} else "MARRIAGE_PERSONAL",
        conditions_met=conditions_met,
        cancellation_factors=cancellation_factors,
        missing_data=[],
        dasha_activated=_is_active(active, "MARS"),
        # DD-05: one sentence for every reader, whatever the chart's gender.
        description_ta=(
            "இந்த ஜாதகத்தில் செவ்வாய் திருமண உணர்திறன் உள்ள இடத்தில் உள்ளது. அதன் உண்மையான "
            "தாக்கம் செவ்வாயின் வலிமை, பார்வைகள், மற்ற திருமண சுட்டிகள் ஆகியவற்றைப் பொறுத்தது."
            if is_present else
            "செவ்வாய் தோஷம் ஒரு வழிகாட்டல் குறிப்பான் மட்டுமே; நிவர்த்தி காரணங்கள் தீவிரத்தை குறைக்கலாம்."
        ),
        description_en=(
            "Mars is in a marriage-sensitive position in this chart. Its actual effect depends on "
            "Mars's strength, aspects and the rest of the marriage indicators."
            if is_present else
            "Sevvai dosham is treated as a traditional tendency indicator; cancellation factors can soften intensity."
        ),
        explanation_what_ta=what_ta,
        explanation_what_en=what_en,
        explanation_why_ta=why_ta,
        explanation_why_en=why_en,
        explanation_how_ta=how_ta,
        explanation_how_en=how_en,
        astrologer_markers=astrologer_markers,
        formation_strength=formation_strength,
        residual=residual,
        context_notes=context_notes,
        reference_houses=reference_houses,
    )


#: DD-03 severity arithmetic, all Tier C. A formed axis starts at Moderate; each
#: aggravation adds one grade, up to Strong, and then each mitigation removes
#: one. 2 is Strong, 1 Moderate, 0 Mild, and below 0 the mitigations outweigh
#: the axis: the dosham is reported as mitigated (nivarthi), never erased.
#:
#: The ceiling is applied *before* the mitigations, as the tables' "+1 grade /
#: −1 grade" wording reads. Summing first and clamping last let surplus
#: aggravations absorb mitigations: one Sukran with Rahu (7th lord, Venus and
#: the O-1 from-Venus check) scored +3, while the default mitigations total at
#: most 3, so no chart with two aggravations could ever reach nivarthi — the
#: "uncancellable" P0 defect again, by arithmetic. Nothing locks the grade.
RK_BASE_SEVERITY = 1
RK_MAX_SEVERITY = 2

#: DD-17: what a node in each marriage-axis house tends to bring, by bhava.
#: Tendencies, never outcomes — the old reading ("Ketu in 2 = family destroyed")
#: is exactly the overstatement this copy exists to replace. A graha takes no
#: honorific (O-25 review, 2026-10-05). Tamil pending native review.
RK_NODE_HOUSE_MEANING: dict[tuple[str, int], tuple[str, str]] = {
    ("RAHU", 1): (
        "லக்னத்தில் ராகு (சுயம், உடல், வாழ்க்கைத் திசை): அமைதியற்ற உந்துதல், தன்னைத் தொடர்ந்து புதுப்பித்துக்கொள்ளும் அடையாளம், பொறுமையை மீறும் லட்சியம் இருக்கலாம்.",
        "Rahu in the 1st (self, body, direction): a restless drive, a self-image that keeps reinventing itself, and ambition that can outrun patience.",
    ),
    ("KETU", 1): (
        "லக்னத்தில் கேது (சுயம், உடல், வாழ்க்கைத் திசை): உள்நோக்கிய, சில நேரங்களில் தன்னம்பிக்கை குறையும் இயல்பு; ஆன்மீக அல்லது மாறுபட்ட வழிகள் நோக்கிய இயல்பான ஈர்ப்பு இருக்கலாம்.",
        "Ketu in the 1st (self, body, direction): an inward, sometimes self-doubting nature, with a natural pull toward spiritual or unconventional paths.",
    ),
    ("RAHU", 2): (
        "2-ஆம் வீட்டில் ராகு (குடும்பம், பேச்சு, சேமிப்பு): சேர்க்க வேண்டும் என்ற வலுவான உந்துதல், கூர்மையான அல்லது வசீகரமான பேச்சு, குடும்ப வழக்கத்திலிருந்து மாறுபட்ட உணவு, பழக்கங்கள் இருக்கலாம். சீரான சேமிப்புப் பழக்கம் உதவும்.",
        "Rahu in the 2nd (family, speech, savings): a strong drive to accumulate, speech that can be sharp or persuasive, and food or habits that differ from the family's own. Steady saving habits help.",
    ),
    ("KETU", 2): (
        "2-ஆம் வீட்டில் கேது (குடும்பம், பேச்சு, சேமிப்பு): சில காலங்களில் குடும்பத்திலிருந்து விலகியிருப்பது போன்ற உணர்வு, சட்டென்று வெளிப்படும் பேச்சு, பணம், சேமிப்பு பற்றிய வழக்கத்திற்கு மாறான அணுகுமுறை இருக்கலாம். குடும்பப் பிணைப்புகள் தானாக அமைவதை விட, கவனமான முயற்சியால் வளரக்கூடும்.",
        "Ketu in the 2nd (family, speech, savings): periods of feeling apart from the family, speech that comes out abruptly, and an unusual attitude to money or saving. Family bonds may need conscious care rather than coming effortlessly.",
    ),
    ("RAHU", 7): (
        "7-ஆம் வீட்டில் ராகு (கூட்டாண்மை): தீவிரமான அல்லது வழக்கத்திற்கு மாறான உறவுகள் — மாறுபட்ட பின்னணியுள்ள துணை, அல்லது அதிக எதிர்பார்ப்புகள் இருக்கலாம். தெளிவான, நேர்மையான உரையாடல் இதைச் சீராக்கும்.",
        "Rahu in the 7th (partnership): intense or unconventional partnerships — a partner from a different background, or expectations that run high. Clear, honest communication steadies it.",
    ),
    ("KETU", 7): (
        "7-ஆம் வீட்டில் கேது (கூட்டாண்மை): துணையோ உறவோ சில காலங்களில் தொலைவாக உணரப்படலாம்; நெருக்கம் கவனமான முயற்சியைக் கேட்கலாம். எதிர்பார்ப்பை விட பொதுவான நோக்கம் அதிகம் உதவும்.",
        "Ketu in the 7th (partnership): periods when a partner or the partnership feels distant, or when closeness takes conscious effort. Shared purpose helps more than expectation.",
    ),
    ("RAHU", 8): (
        "8-ஆம் வீட்டில் ராகு (மறைவான விஷயங்கள், கூட்டு நிதி, திடீர் மாற்றம்): மறைவான விஷயங்கள், நம்பிக்கை, பிறரின் நோக்கம் பற்றி அதிகம் யோசிக்கும் போக்கு, கூட்டுப் பணம் அல்லது திடீர் மாற்றங்களில் கூடுதல் உணர்திறன் இருக்கலாம். ஆராய்ச்சி, மறைபொருள் அறிவில் ஆர்வமும் இருக்கலாம்.",
        "Rahu in the 8th (hidden matters, joint finances, sudden change): a tendency to overthink hidden issues, trust and other people's intentions, and sensitivity around joint money or sudden change. Also an interest in research and hidden knowledge.",
    ),
    ("KETU", 8): (
        "8-ஆம் வீட்டில் கேது (மறைவான விஷயங்கள், கூட்டு நிதி, திடீர் மாற்றம்): மாற்றங்களின் போது திடீர் பற்றின்மை, உள்ளுணர்வு, ஆராய்ச்சி, ஆன்மீக ஆழம் நோக்கிய ஈர்ப்பு இருக்கலாம். கூட்டு நிதியில் தெளிவான ஏற்பாடுகள் நல்லது.",
        "Ketu in the 8th (hidden matters, joint finances, sudden change): sudden detachment when things change, and a quiet pull toward intuition, research or spiritual depth. Joint finances need clear arrangements.",
    ),
}


def rk_placement_meaning(rahu_house: int, ketu_house: int) -> tuple[str, str]:
    """The chart-specific reading of a formed axis (DD-17): each node's house,
    in the order the houses fall, closed by the tendency-not-outcome line."""
    rows = sorted(
        (house, node) for node, house in (("RAHU", rahu_house), ("KETU", ketu_house))
        if (node, house) in RK_NODE_HOUSE_MEANING
    )
    if not rows:
        return "", ""
    ta = " ".join(RK_NODE_HOUSE_MEANING[(node, house)][0] for house, node in rows)
    en = " ".join(RK_NODE_HOUSE_MEANING[(node, house)][1] for house, node in rows)
    return (
        f"{ta} இவை கவனிக்க வேண்டிய போக்குகள் மட்டுமே; உறுதியான விளைவுகள் அல்ல.",
        f"{en} These are tendencies to watch, not fixed outcomes.",
    )
_RK_GRADE: dict[int, tuple[str, str]] = {
    2: ("STRONG", "STRONG_ACTIVE_RAHU_KETU_DOSHAM"),
    1: ("PARTIAL", "ACTIVE_RAHU_KETU_DOSHAM"),
    0: ("WEAK", "ACTIVE_RAHU_KETU_DOSHAM"),
}
_RK_MALEFIC_CANDIDATES = ("SUN", "MOON", "MARS", "MERCURY", "SATURN")
_RK_BENEFIC_CANDIDATES = ("MOON", "MERCURY", "JUPITER", "VENUS")
_SEVENTH_LORD_AFFLICTORS = {"MARS", "SATURN", "RAHU", "KETU"}


def _lord_is_strong(
    planets: Mapping[str, PlanetInput], lord: str, lagna_rasi: int, combust_planets: frozenset[str]
) -> bool:
    """Engine reading of a "strong" house lord (Tier C): own sign, exalted or
    in a kendra/trikona, not joined by Sevvai/Sani/Rahu/Ketu, not combust.

    One test for every marriage-dosham lord (DD-17): the Rahu–Ketu 7th, 8th
    and 2nd lords and, since O-27, the Sevvai 7th lord."""
    if lord not in planets:
        return False
    lord_rasi = _planet_rasi(planets, lord)
    joined = any(
        p in planets and _planet_rasi(planets, p) == lord_rasi
        for p in _SEVENTH_LORD_AFFLICTORS if p != lord
    )
    return _planet_is_strong(planets, lord, lagna_rasi) and not joined and lord not in combust_planets


def _lord_is_dignified(
    planets: Mapping[str, PlanetInput], lord: str, combust_planets: frozenset[str]
) -> bool:
    """The stricter reading (O-28): own or exaltation sign only, not joined by
    Sevvai/Sani/Rahu/Ketu, not combust. Placement alone does not qualify."""
    if lord not in planets:
        return False
    lord_rasi = _planet_rasi(planets, lord)
    dignified = lord_rasi in OWN_SIGN_RASI.get(lord, set()) or lord_rasi == EXALTATION_RASI.get(lord)
    joined = any(
        p in planets and _planet_rasi(planets, p) == lord_rasi
        for p in _SEVENTH_LORD_AFFLICTORS if p != lord
    )
    return dignified and not joined and lord not in combust_planets



def detect_rahu_ketu_dosham(
    planets: Mapping[str, PlanetInput],
    lagna_rasi: int,
    *,
    gender: str | None = None,
    active_lords: Iterable[str] | None = None,
    combust_planets: frozenset[str] = frozenset(),
    d9_rasi_map: Mapping[str, int] | None = None,
    d9_lagna_rasi: int | None = None,
    moon_benefic: bool | None = None,
    planet_scores: Mapping[str, int] | None = None,
    doctrine: DoctrineOptions = DEFAULT_DOCTRINE,
) -> DoshamResult:
    """Rahu–Ketu marriage axis — DOCTRINE_DECISIONS v1.3, DD-03 (Tier B).

    Formation: a node in house 1, 2, 7 or 8 from Lagna, reported as **one** axis
    finding (`rahu_ketu_axis_1_7` or `rahu_ketu_axis_2_8`), never as two doshas
    for two nodes. Houses 5 and 9 are no longer read here (DD-04): node-in-5th
    belongs to the progeny analysis and the 9th to dharma/father.

    Severity is graded, never vetoed (see `RK_BASE_SEVERITY`). Aggravations land
    in `conditions_met`, mitigations in `cancellation_factors`. The old rule
    that a 7th/8th node "blocks every cancellation" is gone: it made nivarthi
    impossible for every axis chart, about one chart in three.

    Not read for the grade, by decision: the gender markers (DD-05 moves them
    out of this detector), the Navamsa 7th-lord tests, Venus's own strength, and
    Jupiter merely in a kendra/trikona. O-2's node-sign mitigation exists only
    when an explicitly named practitioner lineage and exact sign lists are
    supplied. ``gender`` is accepted for call-site compatibility and ignored.

    DD-17 (2026-10-06): ``d9_rasi_map`` / ``d9_lagna_rasi`` are read for
    *context only* — whether the axis repeats in the Navamsa — and never move
    the grade, so DD-03's decision stands. The 2/8 axis now weighs the 2nd
    house's support as it already weighed the 8th's (O-28), and one Guru
    aspect is counted once (O-29).
    """
    _ = gender
    active = set(active_lords or ())
    missing_data = [planet for planet in ("RAHU", "KETU", "VENUS", "JUPITER") if planet not in planets]
    if missing_data:
        what_ta, what_en, why_ta, why_en, how_ta, how_en = _build_dosham_explanations(
            "RAHU_KETU_DOSHAM",
            "INCOMPLETE_DATA",
            conditions_met=[],
            cancellation_factors=[],
            missing_data=missing_data,
        )
        return DoshamResult(
            name="RAHU_KETU_DOSHAM",
            is_present=False,
            is_cancelled=False,
            strength="WEAK",
            label="INCOMPLETE_DATA",
            category="NODES",
            conditions_met=[],
            cancellation_factors=[],
            missing_data=missing_data,
            dasha_activated=False,
            description_ta="ராகு/கேது தோஷம் பகுப்பாய்விற்கு ராகு, கேது, சுக்கிரன், குரு நிலைகள் தேவை.",
            description_en="Rahu/Ketu dosham analysis needs Rahu, Ketu, Venus, and Jupiter placements.",
            explanation_what_ta=what_ta,
            explanation_what_en=what_en,
            explanation_why_ta=why_ta,
            explanation_why_en=why_en,
            explanation_how_ta=how_ta,
            explanation_how_en=how_en,
        )

    rahu_rasi = _planet_rasi(planets, "RAHU")
    ketu_rasi = _planet_rasi(planets, "KETU")
    node_rasis = {rahu_rasi, ketu_rasi}
    jupiter_rasi = _planet_rasi(planets, "JUPITER")
    venus_rasi = _planet_rasi(planets, "VENUS")
    rahu_house = house_from_reference(lagna_rasi, rahu_rasi)
    ketu_house = house_from_reference(lagna_rasi, ketu_rasi)
    node_houses = {rahu_house, ketu_house}

    # One axis finding. The nodes stand opposite, so an axis chart always has a
    # node in the 7th (1/7) or the 8th (2/8); the per-node test below only
    # guards a malformed input in which they are not opposite.
    if node_houses & {1, 7}:
        axis = "1_7"
    elif node_houses & {2, 8}:
        axis = "2_8"
    else:
        axis = ""

    conditions_met: list[str] = []
    cancellation_factors: list[str] = []
    context_notes: list[str] = []
    seventh_lord = _house_lord(lagna_rasi, 7)
    eighth_lord = _house_lord(lagna_rasi, 8)
    second_lord = _house_lord(lagna_rasi, 2)
    seventh_rasi = ((lagna_rasi + 5) % 12) + 1
    eighth_rasi = ((lagna_rasi + 6) % 12) + 1
    second_rasi = (lagna_rasi % 12) + 1
    moon_rasi = _planet_rasi(planets, "MOON") if "MOON" in planets else None
    # O-29: Guru's influence on a node's house is already
    # `guru_joins_or_aspects_node`; the house-support tests read the others.
    house_supporters = tuple(
        p for p in _RK_BENEFIC_CANDIDATES if not (doctrine.o29_rk_guru_counted_once and p == "JUPITER")
    )

    def natural_class(planet: str) -> str:
        return effective_natural_class(
            planet, _planets_as_rasi_map(planets),
            paksha_is_shukla=moon_benefic, planet_scores=planet_scores,
        )

    def influences(planet: str, target_rasi: int) -> bool:
        if planet not in planets:
            return False
        rasi = _planet_rasi(planets, planet)
        return rasi == target_rasi or aspects_house(planet, rasi, target_rasi)

    if axis:
        conditions_met.append(f"rahu_ketu_axis_{axis}")
        # Aggravations — DD-03 table, +1 grade each.
        if seventh_lord in planets and _planet_rasi(planets, seventh_lord) in node_rasis:
            conditions_met.append("node_with_seventh_lord")
        if venus_rasi in node_rasis:
            conditions_met.append("node_with_venus")
        if moon_rasi in node_rasis:
            conditions_met.append("node_afflicts_moon")
        # Malefic influence on the 7th: a natural malefic by DD-12 (waning Moon
        # and afflicted Budhan included) occupying or aspecting the 7th house.
        # The nodes are excluded — on the 1/7 axis one of them *is* the finding.
        if any(natural_class(p) == "MALEFIC" and influences(p, seventh_rasi) for p in _RK_MALEFIC_CANDIDATES):
            conditions_met.append("malefic_influence_on_seventh")
        # O-1: the same houses counted from the Moon or from Venus. Secondary —
        # it can raise the grade, never create the dosham.
        if doctrine.o1_rk_moon_venus_secondary:
            secondary_refs = [r for r in (moon_rasi, venus_rasi) if r is not None]
            if any(
                house_from_reference(ref, node) in RAHU_KETU_MARRIAGE_HOUSES
                for ref in secondary_refs for node in node_rasis
            ):
                conditions_met.append("node_afflicts_from_moon_or_venus")
            elif moon_rasi is not None:
                # DD-17: the absence was checked too, and a reader is owed it —
                # an axis that does not repeat from the Moon or Venus is the
                # lighter reading. Context only; the grade was simply not raised.
                context_notes.append("rk_axis_not_repeated_from_moon_venus")

        # Mitigations — DD-03 table, −1 grade each.
        if jupiter_rasi in node_rasis or any(aspects_house("JUPITER", jupiter_rasi, n) for n in node_rasis):
            cancellation_factors.append("guru_joins_or_aspects_node")
        if aspects_house("JUPITER", jupiter_rasi, seventh_rasi) or (
            seventh_lord in planets and aspects_house("JUPITER", jupiter_rasi, _planet_rasi(planets, seventh_lord))
        ):
            cancellation_factors.append("guru_aspects_seventh_or_its_lord")
        if axis == "1_7" and _lord_is_strong(planets, seventh_lord, lagna_rasi, combust_planets):
            cancellation_factors.append("strong_seventh_lord")
        if axis == "2_8" and (
            _lord_is_strong(planets, eighth_lord, lagna_rasi, combust_planets)
            or any(natural_class(p) == "BENEFIC" and influences(p, eighth_rasi) for p in house_supporters)
        ):
            cancellation_factors.append("strong_eighth_lord_or_benefic_on_eighth")
        # O-28: the node in the 2nd sits in the kudumba sthana, and the 2nd
        # lord's dignity protects it. The default reads dignity only: the 8th
        # side's broader test (any kendra/trikona placement) doubled the 2/8
        # nivarthi rate when applied here too (DD-17 frequency report).
        if axis == "2_8" and doctrine.o28_rk_second_house_support == "dignity" and _lord_is_dignified(
            planets, second_lord, combust_planets
        ):
            cancellation_factors.append("second_lord_dignified")
        elif axis == "2_8" and doctrine.o28_rk_second_house_support == "strong_or_benefic" and (
            _lord_is_strong(planets, second_lord, lagna_rasi, combust_planets)
            or any(natural_class(p) == "BENEFIC" and influences(p, second_rasi) for p in house_supporters)
        ):
            cancellation_factors.append("strong_second_lord_or_benefic_on_second")
        # O-2: no sign list is assumed. A practitioner must name the lineage
        # and supply the exact Rahu/Ketu rasis before this mitigation can fire.
        if doctrine.o2_node_dignity_mode == "explicit_signs" and (
            rahu_rasi in doctrine.o2_rahu_favourable_rasis
            or ketu_rasi in doctrine.o2_ketu_favourable_rasis
        ):
            cancellation_factors.append("node_in_favourable_sign_lineage")

    aggravations = len(conditions_met) - 1 if axis else 0
    aggravated = min(RK_BASE_SEVERITY + aggravations, RK_MAX_SEVERITY)
    net = aggravated - len(cancellation_factors)
    is_present = bool(axis)
    is_cancelled = is_present and net < 0

    if not is_present:
        strength, label, category = "WEAK", "NO_RAHU_KETU_DOSHAM", "NODES"
    elif is_cancelled:
        strength, label, category = "WEAK", "RAHU_KETU_DOSHAM_WITH_NIVARTHI", "MARRIAGE"
    else:
        strength, label = _RK_GRADE[net]
        category = "MARRIAGE"

    formation_strength = _RK_GRADE[aggravated][0] if is_present else ""
    residual = dosham_residual(
        is_present=is_present,
        is_cancelled=is_cancelled,
        strength=strength,
        formation_strength=formation_strength,
        narrow_margin=net == -1,
    )

    def node_houses_from(ref_rasi: int) -> tuple[int, int]:
        return house_from_reference(ref_rasi, rahu_rasi), house_from_reference(ref_rasi, ketu_rasi)

    reference_houses: list[ReferenceHouse] = [
        ReferenceHouse("LAGNA", lagna_rasi, (rahu_house, ketu_house), bool(axis)),
    ]
    for ref, ref_rasi in (("MOON", moon_rasi), ("VENUS", venus_rasi)):
        if ref_rasi is not None:
            houses = node_houses_from(ref_rasi)
            reference_houses.append(
                ReferenceHouse(ref, ref_rasi, houses, any(h in RAHU_KETU_MARRIAGE_HOUSES for h in houses))
            )
    # DD-17: the Navamsa repetition, context only (DD-03 keeps D9 out of the grade).
    if d9_rasi_map and d9_lagna_rasi and "RAHU" in d9_rasi_map and "KETU" in d9_rasi_map:
        d9_houses = (
            house_from_reference(d9_lagna_rasi, d9_rasi_map["RAHU"]),
            house_from_reference(d9_lagna_rasi, d9_rasi_map["KETU"]),
        )
        d9_repeats = any(h in RAHU_KETU_MARRIAGE_HOUSES for h in d9_houses)
        reference_houses.append(ReferenceHouse("D9_LAGNA", d9_lagna_rasi, d9_houses, d9_repeats))
        if axis:
            context_notes.append("rk_axis_repeated_in_navamsa" if d9_repeats else "rk_axis_not_repeated_in_navamsa")

    what_ta, what_en, why_ta, why_en, how_ta, how_en = _build_dosham_explanations(
        "RAHU_KETU_DOSHAM",
        label,
        conditions_met=conditions_met,
        cancellation_factors=cancellation_factors,
        missing_data=[],
        residual=residual,
        context_notes=context_notes,
    )
    meaning_ta, meaning_en = rk_placement_meaning(rahu_house, ketu_house) if axis else ("", "")
    return DoshamResult(
        name="RAHU_KETU_DOSHAM",
        is_present=is_present,
        is_cancelled=is_cancelled,
        strength=strength,
        label=label,
        category=category,
        conditions_met=conditions_met,
        cancellation_factors=cancellation_factors,
        missing_data=[],
        dasha_activated=_is_active(active, "RAHU", "KETU"),
        description_ta="ராகு/கேது நிலைகள் பாரம்பரிய குறிப்பான்களாக பார்க்கப்படும்; சூழல் மற்றும் பாதுகாப்பு காரணங்கள் முக்கியம்.",
        description_en="Rahu/Ketu placements are treated as traditional tendency indicators; context and protective factors matter.",
        explanation_what_ta=what_ta,
        explanation_what_en=what_en,
        explanation_why_ta=why_ta,
        explanation_why_en=why_en,
        explanation_how_ta=how_ta,
        explanation_how_en=how_en,
        formation_strength=formation_strength,
        residual=residual,
        context_notes=tuple(context_notes),
        reference_houses=tuple(reference_houses),
        meaning_ta=meaning_ta,
        meaning_en=meaning_en,
        # The axis names the finding (review 2026-10-06): "Rahu–Ketu Dosham ·
        # 2/8 axis", never a bare traditional alias like Naga Dosham.
        variant_ta=f"{axis.replace('_', '/')} அச்சு" if axis else "",
        variant_en=f"{axis.replace('_', '/')} axis" if axis else "",
    )


def detect_pitru_dosham(
    planets: Mapping[str, PlanetInput],
    lagna_rasi: int,
    *,
    active_lords: Iterable[str] | None = None,
) -> DoshamResult:
    active = set(active_lords or ())
    missing_data = [planet for planet in ("SUN", "SATURN", "RAHU", "KETU", "JUPITER") if planet not in planets]
    if missing_data:
        what_ta, what_en, why_ta, why_en, how_ta, how_en = _build_dosham_explanations(
            "PITRU_DOSHAM",
            "INCOMPLETE_DATA",
            conditions_met=[],
            cancellation_factors=[],
            missing_data=missing_data,
        )
        return DoshamResult(
            name="PITRU_DOSHAM",
            is_present=False,
            is_cancelled=False,
            strength="WEAK",
            label="INCOMPLETE_DATA",
            category="PITRU",
            conditions_met=[],
            cancellation_factors=[],
            missing_data=missing_data,
            dasha_activated=False,
            description_ta="பித்ரு தோஷம் பகுப்பாய்விற்கு சூரியன், சனி, ராகு, கேது, குரு நிலைகள் தேவை.",
            description_en="Pitru dosham analysis needs Sun, Saturn, Rahu, Ketu, and Jupiter placements.",
            explanation_what_ta=what_ta,
            explanation_what_en=what_en,
            explanation_why_ta=why_ta,
            explanation_why_en=why_en,
            explanation_how_ta=how_ta,
            explanation_how_en=how_en,
        )

    sun_rasi = _planet_rasi(planets, "SUN")
    saturn_rasi = _planet_rasi(planets, "SATURN")
    rahu_rasi = _planet_rasi(planets, "RAHU")
    ketu_rasi = _planet_rasi(planets, "KETU")
    jupiter_rasi = _planet_rasi(planets, "JUPITER")
    ninth_lord = _house_lord(lagna_rasi, 9)
    ninth_lord_rasi = _planet_rasi(planets, ninth_lord)

    ninth_house_rasi = ((lagna_rasi + 9 - 2) % 12) + 1
    ninth_lord_house = house_from_reference(lagna_rasi, ninth_lord_rasi)
    saturn_house = house_from_reference(lagna_rasi, saturn_rasi)

    conditions_met: list[str] = []
    major_condition = False
    if sun_rasi in {rahu_rasi, ketu_rasi}:
        conditions_met.append("sun_with_node")
        major_condition = True
    if rahu_rasi == ninth_house_rasi or ketu_rasi == ninth_house_rasi:
        conditions_met.append("node_in_ninth")
        major_condition = True
    if saturn_house == 9:
        conditions_met.append("saturn_in_ninth")
    if ninth_lord_house in {6, 8, 12}:
        conditions_met.append("ninth_lord_dusthana")

    minor_count = sum(1 for key in conditions_met if key in {"saturn_in_ninth", "ninth_lord_dusthana"})
    is_present = major_condition or minor_count >= 2

    cancellation_factors: list[str] = []
    if house_from_reference(lagna_rasi, jupiter_rasi) in KENDRA_HOUSES | TRIKONA_HOUSES:
        cancellation_factors.append("jupiter_kendra_trikona_support")
    if sun_rasi in OWN_SIGN_RASI["SUN"] or sun_rasi == EXALTATION_RASI["SUN"]:
        cancellation_factors.append("sun_strong")

    is_cancelled = is_present and len(cancellation_factors) >= 2
    if not is_present:
        strength = "WEAK"
    elif major_condition and minor_count >= 1:
        strength = "STRONG"
    else:
        strength = "PARTIAL"

    if not is_present:
        label = "NO_DOSHAM"
    elif is_cancelled:
        label = "DOSHAM_WITH_NIVARTHI"
    elif strength == "STRONG":
        label = "STRONG_ACTIVE_DOSHAM"
    else:
        label = "ACTIVE_DOSHAM"

    # DD-17: two mitigations exist and both are needed, so every nivarthi here
    # is at the threshold — a STRONG formation keeps a moderate residual.
    formation_strength = strength if is_present else ""
    residual = dosham_residual(
        is_present=is_present,
        is_cancelled=is_cancelled,
        strength="WEAK" if is_cancelled else strength,
        formation_strength=formation_strength,
        narrow_margin=len(cancellation_factors) == 2,
    )
    if not is_present:
        cancellation_factors = []  # a protection of nothing (L-5); see Sevvai
    what_ta, what_en, why_ta, why_en, how_ta, how_en = _build_dosham_explanations(
        "PITRU_DOSHAM",
        label,
        conditions_met=conditions_met,
        cancellation_factors=cancellation_factors,
        missing_data=[],
        residual=residual,
    )
    return DoshamResult(
        name="PITRU_DOSHAM",
        is_present=is_present,
        is_cancelled=is_cancelled,
        strength=strength if not is_cancelled else "WEAK",
        label=label,
        category="PITRU",
        conditions_met=conditions_met,
        cancellation_factors=cancellation_factors,
        missing_data=[],
        dasha_activated=_is_active(active, "SUN", "RAHU", "KETU", ninth_lord),
        description_ta="பித்ரு தோஷம் பாரம்பரிய முன்னோர் கர்ம உணர்திறன் குறிப்பான்; ஆதரவு காரணங்கள் விளைவை மென்மையாக்கலாம்.",
        description_en="Pitru dosham is treated as a traditional lineage-karma sensitivity indicator; supportive factors can soften effects.",
        explanation_what_ta=what_ta,
        explanation_what_en=what_en,
        explanation_why_ta=why_ta,
        explanation_why_en=why_en,
        explanation_how_ta=how_ta,
        explanation_how_en=how_en,
        formation_strength=formation_strength,
        residual=residual,
    )


# The 12 named Kala Sarpa variants (nagas), keyed on the house Rahu occupies
# from the lagna. This is the standard classical naming: the naga is fixed by
# Rahu's house, so its life-area emphasis follows that house's significations
# (i.e. the meaning is not a separate lookup table — it is the house domain,
# which keeps this unambiguous and safe to ship live, unlike Tithi Shoonya).
KALASARPA_NAGAS: dict[int, dict[str, str]] = {
    1:  {"code": "ANANTA",       "en": "Ananta",       "ta": "அனந்த காலசர்ப்பம்",
         "meaning_en": "Rahu in the 1st house — the self, identity and vitality carry the karmic knot; strong drive shadowed by restlessness.",
         "meaning_ta": "ராகு லக்னத்தில் — சுயம், அடையாளம், உடல்நலம் மீது கர்ம முடிச்சு; பலமான உந்துதலுடன் அமைதியின்மை."},
    2:  {"code": "KULIKA",       "en": "Kulika",       "ta": "குலிக காலசர்ப்பம்",
         "meaning_en": "Rahu in the 2nd house — wealth, family and speech fluctuate; savings and family ties need conscious effort.",
         "meaning_ta": "ராகு 2-ல் — செல்வம், குடும்பம், பேச்சு ஏற்ற இறக்கம்; சேமிப்பு, குடும்ப பந்தம் முயற்சி கேட்கும்."},
    3:  {"code": "VASUKI",       "en": "Vasuki",       "ta": "வாசுகி காலசர்ப்பம்",
         "meaning_en": "Rahu in the 3rd house — courage, siblings and communication are the arena; gains come through sustained effort.",
         "meaning_ta": "ராகு 3-ல் — தைரியம், உடன்பிறப்பு, தொடர்பு; தொடர் முயற்சியால் வெற்றி."},
    4:  {"code": "SHANKHAPALA",  "en": "Shankhapala",  "ta": "சங்கபால காலசர்ப்பம்",
         "meaning_en": "Rahu in the 4th house — home, mother, property and peace of mind are tested; domestic stability needs tending.",
         "meaning_ta": "ராகு 4-ல் — வீடு, தாய், சொத்து, மன அமைதி சோதிக்கப்படும்; குடும்ப ஸ்திரத்தன்மை கவனம் கேட்கும்."},
    5:  {"code": "PADMA",        "en": "Padma",        "ta": "பத்ம காலசர்ப்பம்",
         "meaning_en": "Rahu in the 5th house — children, education and romance may see delays; creativity blooms after patience.",
         "meaning_ta": "ராகு 5-ல் — குழந்தை, கல்வி, காதலில் தாமதம் இருக்கலாம்; பொறுமைக்குப் பின் படைப்பாற்றல் மலரும்."},
    6:  {"code": "MAHAPADMA",    "en": "Mahapadma",    "ta": "மகாபத்ம காலசர்ப்பம்",
         "meaning_en": "Rahu in the 6th house — a fighter's placement; enemies, debts and illness are overcome through service and grit.",
         "meaning_ta": "ராகு 6-ல் — போராளி அமைப்பு; எதிரி, கடன், நோய் சேவை மற்றும் விடாமுயற்சியால் வெல்லப்படும்."},
    7:  {"code": "TAKSHAKA",     "en": "Takshaka",     "ta": "தக்ஷக காலசர்ப்பம்",
         "meaning_en": "Rahu in the 7th house — marriage and partnerships carry turbulence; relationships mature through conscious work.",
         "meaning_ta": "ராகு 7-ல் — திருமணம், கூட்டாண்மையில் கொந்தளிப்பு; உறவுகள் விழிப்புணர்வான முயற்சியால் முதிரும்."},
    8:  {"code": "KARKOTAKA",    "en": "Karkotaka",    "ta": "கர்க்கோடக காலசர்ப்பம்",
         "meaning_en": "Rahu in the 8th house — sudden events, inheritance and the occult; deep transformations and interest in hidden knowledge.",
         "meaning_ta": "ராகு 8-ல் — திடீர் நிகழ்வுகள், வாரிசு, மறைபொருள்; ஆழமான மாற்றங்கள், மறைவான அறிவில் ஈடுபாடு."},
    9:  {"code": "SHANKHACHUDA", "en": "Shankhachuda", "ta": "சங்கசூட காலசர்ப்பம்",
         "meaning_en": "Rahu in the 9th house — fortune, father and beliefs shift; foreign links and unconventional dharma.",
         "meaning_ta": "ராகு 9-ல் — அதிர்ஷ்டம், தந்தை, நம்பிக்கைகளில் மாற்றம்; வெளிநாட்டுத் தொடர்பு, மாற்று தர்மம்."},
    10: {"code": "GHATAKA",      "en": "Ghataka",      "ta": "காடக காலசர்ப்பம்",
         "meaning_en": "Rahu in the 10th house — career and public status swing; ambition is high, professional stability needs strategy.",
         "meaning_ta": "ராகு 10-ல் — தொழில், அந்தஸ்து ஏற்ற இறக்கம்; லட்சியம் அதிகம், தொழில் ஸ்திரத்தன்மைக்கு திட்டம் தேவை."},
    11: {"code": "VISHADHARA",   "en": "Vishadhara",   "ta": "விஷதர காலசர்ப்பம்",
         "meaning_en": "Rahu in the 11th house — gains, networks and elder siblings; income often through unconventional or large-scale means.",
         "meaning_ta": "ராகு 11-ல் — லாபம், தொடர்புகள், மூத்த உடன்பிறப்பு; மாற்று அல்லது பெரிய அளவிலான வருமானம்."},
    12: {"code": "SHESHANAGA",   "en": "Sheshanaga",   "ta": "சேஷநாக காலசர்ப்பம்",
         "meaning_en": "Rahu in the 12th house — expenses, foreign lands and moksha; a spiritually inclined, sometimes isolating placement.",
         "meaning_ta": "ராகு 12-ல் — செலவு, வெளிநாடு, மோட்சம்; ஆன்மீக நாட்டமுள்ள, சில நேரம் தனிமைப்படுத்தும் அமைப்பு."},
}


# A graha sitting exactly on a node is a boundary case, not a tolerance. This
# epsilon exists only because longitudes are floats — it is about a hundredth of
# an arcsecond and is NOT a doctrinal orb. Doctrine A-4 ruled that there is no
# degree tolerance at the node ends; widening this value reintroduces one.
def detect_kalasarpa(
    planets: Mapping[str, PlanetInput],
    lagna_rasi: int | None = None,
    *,
    longitudes: Mapping[str, float] | None = None,
) -> KalasarpaResult:
    """Kala Sarpa arc test over the seven grahas.

    Doctrine A-4 (ruled 2026-08-19) settled four mechanical points that were
    previously answered by implementation default:

    1. **Seven grahas only.** The Lagna is not required to fall inside the arc.
       Some lineages do require it, which greatly reduces how many charts
       qualify; we do not.
    2. **Actual longitude**, when available. Pass `longitudes` (sidereal, 0-360,
       keyed by graha) and the arc is tested degree-exactly. Without it this
       falls back to the older whole-sign test, which counts a graha in the same
       sign as a node but past its exact degree as still inside the arc. That
       fallback is a documented approximation, not the rule — it is retained
       only for callers that carry rasi without degrees.
    3. **No degree tolerance** at the node ends (see the epsilon note above).
    4. **A graha exactly on a node is a boundary case.** It does not break the
       formation, but it is recorded in `conditions_met` as
       `graha_on_node_<GRAHA>` rather than silently resolved in or out.

    Direction is recorded, never used to disqualify: Rahu->Ketu is `ANULOMA`,
    Ketu->Rahu is `VILOMA`. Some modern schools name the reverse enclosure
    "Kala Amrita" and read it quite differently. That is a school convention we
    deliberately do not bake in as settled Tamil doctrine, so both directions
    form the yoga and the pattern is reported for the caller to interpret.

    Kala Sarpa is heavy language for a reader. Criteria that are too loose tell
    people they carry a serious affliction they do not have — which is why each
    of these is a ruling rather than a default.
    """
    rahu_rasi = _planet_rasi(planets, "RAHU")
    ketu_rasi = _planet_rasi(planets, "KETU")
    planet_rasis = [_planet_rasi(planets, planet) for planet in SEVEN_PLANETS]

    degree_exact = longitudes is not None and all(
        graha in longitudes for graha in (*SEVEN_PLANETS, "RAHU", "KETU")
    )
    on_node: list[str] = []

    if degree_exact and longitudes is not None:
        rahu_lon = longitudes["RAHU"] % 360.0
        ketu_lon = longitudes["KETU"] % 360.0
        in_rahu_arc = True
        in_ketu_arc = True
        for graha in SEVEN_PLANETS:
            graha_lon = longitudes[graha] % 360.0
            from_rahu = (graha_lon - rahu_lon) % 360.0
            from_ketu = (graha_lon - ketu_lon) % 360.0
            if (
                min(from_rahu, 360.0 - from_rahu) <= LONGITUDE_EPSILON
                or min(from_ketu, 360.0 - from_ketu) <= LONGITUDE_EPSILON
            ):
                on_node.append(graha)
            if from_rahu > 180.0:
                in_rahu_arc = False
            if from_ketu > 180.0:
                in_ketu_arc = False
    else:
        def _distance(start: int, end: int) -> int:
            return (end - start) % 12

        in_rahu_arc = all(_distance(rahu_rasi, rasi) <= 6 for rasi in planet_rasis)
        in_ketu_arc = all(_distance(ketu_rasi, rasi) <= 6 for rasi in planet_rasis)

    if not (in_rahu_arc or in_ketu_arc):
        return KalasarpaResult(
            is_present=False,
            pattern="NONE",
            conditions_met=[],
            description_ta="காலசர்ப்ப அமைப்பு இல்லை.",
            description_en="Kalasarpa formation is not present.",
        )

    pattern = "ANULOMA" if in_rahu_arc else "VILOMA"
    condition = (
        "all_planets_between_rahu_and_ketu"
        if in_rahu_arc
        else "all_planets_between_ketu_and_rahu"
    )
    conditions_met = [condition]
    # Record how the arc was judged, so a reader of `conditions_met` can tell a
    # degree-exact qualification from a whole-sign approximation (doctrine A-4).
    conditions_met.append("arc_test_degree_exact" if degree_exact else "arc_test_whole_sign")
    # A graha exactly on a node qualifies, but the boundary is disclosed rather
    # than resolved silently in or out.
    conditions_met.extend(f"graha_on_node_{graha}" for graha in on_node)

    # Name the naga from Rahu's house. When lagna is unknown (older callers),
    # fall back to the un-named formation so behavior never regresses.
    # Bound once and reused below, where the naga lookup having succeeded is
    # what proves the lagna was known.
    rahu_house = house_from_reference(lagna_rasi, rahu_rasi) if lagna_rasi else None
    naga = KALASARPA_NAGAS.get(rahu_house) if rahu_house is not None else None
    if naga is None:
        return KalasarpaResult(
            is_present=True,
            pattern=pattern,
            conditions_met=conditions_met,
            description_ta="அனைத்து 7 கிரகங்களும் ராகு-கேது அச்சின் ஒரு பக்கத்தில் உள்ளதால் காலசர்ப்ப அமைப்பு.",
            description_en="All seven planets fall on one side of the Rahu-Ketu axis, indicating a Kalasarpa formation.",
        )

    conditions_met.append(f"rahu_house_{rahu_house}")
    conditions_met.append(f"variant_{naga['code'].lower()}")
    return KalasarpaResult(
        is_present=True,
        pattern=pattern,
        conditions_met=conditions_met,
        description_ta=(
            f"{naga['ta']} — அனைத்து 7 கிரகங்களும் ராகு-கேது அச்சின் ஒரு பக்கத்தில். {naga['meaning_ta']}"
        ),
        description_en=(
            f"{naga['en']} Kala Sarpa — all seven planets fall on one side of the Rahu-Ketu axis. {naga['meaning_en']}"
        ),
        variant=naga["code"],
        variant_ta=naga["ta"],
        variant_en=naga["en"],
        rahu_house=rahu_house,
        meaning_ta=naga["meaning_ta"],
        meaning_en=naga["meaning_en"],
    )


def get_badhaka_lord(lagna_rasi: int, planets_rasi_to_lord: dict[int, str]) -> str:
    if lagna_rasi in _MOVABLE_LAGNAS:
        badhaka_house = 11
    elif lagna_rasi in _FIXED_LAGNAS:
        badhaka_house = 9
    else:
        badhaka_house = 7
    badhaka_rasi = ((lagna_rasi + badhaka_house - 2) % 12) + 1
    return planets_rasi_to_lord[badhaka_rasi]


def detect_kalathra_dosham(
    planets: Mapping[str, PlanetInput],
    lagna_rasi: int,
    moon_rasi: int | None = None,
    is_male: bool = True,
    planet_scores: dict[str, int] | None = None,
    *,
    active_lords: Iterable[str] | None = None,
    d9_rasi_map: Mapping[str, int] | None = None,
) -> DoshamResult:
    """Kalathra Dosham: 7th lord placed in 6th, 8th, or 12th house from Lagna."""
    _ = moon_rasi
    active = set(active_lords or ())
    seventh_lord = _house_lord(lagna_rasi, 7)

    if seventh_lord not in planets:
        return DoshamResult(
            name="KALATHRA_DOSHAM",
            is_present=False,
            is_cancelled=False,
            strength="WEAK",
            label="INCOMPLETE_DATA",
            category="MARRIAGE",
            conditions_met=[],
            cancellation_factors=[],
            missing_data=[seventh_lord],
            dasha_activated=False,
            description_ta="களத்திர தோஷம் கணிக்க 7ம் அதிபதி நிலை தேவை.",
            description_en="Kalathra dosham analysis requires the 7th lord placement.",
            explanation_what_ta="களத்திர தோஷம் என்பது 7ம் அதிபதி துஷ்டான வீட்டில் இருக்கும் போது திருமண விஷயங்களில் கவனம் தேவை என்பதைச் சொல்வது.",
            explanation_what_en="Kalathra dosham is a marriage sensitivity indicator that arises when the 7th lord is placed in a dusthana house.",
            explanation_why_ta="தேவையான ஜாதக தரவு கிடைக்கவில்லை.",
            explanation_why_en="Required chart data is unavailable.",
            explanation_how_ta="முழு ஜாதக தரவுடன் மீண்டும் பரிசீலிக்கவும்.",
            explanation_how_en="Review again with complete chart data.",
        )

    seventh_lord_rasi = _planet_rasi(planets, seventh_lord)
    seventh_lord_house = house_from_reference(lagna_rasi, seventh_lord_rasi)
    is_in_dusthana = seventh_lord_house in {6, 8, 12}
    legacy_affliction = False
    if planet_scores is not None:
        venus_or_jupiter = "VENUS" if is_male else "JUPITER"
        legacy_affliction = any(
            planet in planets and _planet_rasi(planets, planet) == seventh_lord_rasi
            for planet in {"SATURN", "RAHU", "KETU", "MARS"}
        ) or (
            venus_or_jupiter in planets
            and any(
                planet in planets and _planet_rasi(planets, planet) == _planet_rasi(planets, venus_or_jupiter)
                for planet in {"SATURN", "RAHU", "KETU", "MARS"}
            )
        )
    is_present = is_in_dusthana or legacy_affliction
    conditions_met = []
    if is_in_dusthana:
        conditions_met.append(f"seventh_lord_in_house_{seventh_lord_house}")
    if legacy_affliction:
        conditions_met.append("seventh_afflicted")
    cancellation_factors: list[str] = []

    if seventh_lord_rasi in OWN_SIGN_RASI.get(seventh_lord, set()):
        cancellation_factors.append("seventh_lord_own_sign")
    if seventh_lord_rasi == EXALTATION_RASI.get(seventh_lord):
        cancellation_factors.append("seventh_lord_exalted")
    if "JUPITER" in planets:
        jupiter_rasi = _planet_rasi(planets, "JUPITER")
        if aspects_house("JUPITER", jupiter_rasi, seventh_lord_rasi):
            cancellation_factors.append("jupiter_aspects_seventh_lord")
    if d9_rasi_map and seventh_lord in d9_rasi_map:
        d9_rasi = d9_rasi_map[seventh_lord]
        if d9_rasi in OWN_SIGN_RASI.get(seventh_lord, set()) or d9_rasi == EXALTATION_RASI.get(seventh_lord):
            cancellation_factors.append("seventh_lord_strong_d9")

    # `is_present and`: a cancellation of nothing is not a nivarthi (the L-5
    # invariant Putra Sarpa and Badhaka also hold to).
    is_cancelled = is_present and (len(cancellation_factors) >= 2 or (
        len(cancellation_factors) == 1
        and cancellation_factors[0] in {"seventh_lord_exalted", "jupiter_aspects_seventh_lord"}
    ))
    strong_formation = seventh_lord_house == 8 or bool(
        legacy_affliction and planet_scores and planet_scores.get(seventh_lord, 50) < 40
    )
    formation_strength = ("STRONG" if strong_formation else "PARTIAL") if is_present else ""
    if not is_present:
        label = "NO_KALATHRA_DOSHAM"
        strength = "WEAK"
    elif is_cancelled:
        label = "KALATHRA_DOSHAM_CANCELLED"
        strength = "WEAK"
    elif strong_formation:
        label = "STRONG_KALATHRA_DOSHAM"
        strength = "STRONG"
    else:
        label = "KALATHRA_DOSHAM"
        # Was "MODERATE", a value no other dosham uses; every shared strength
        # helper read it as Mild, so an active Kalathra dosham displayed as mild.
        strength = "PARTIAL"
    residual = dosham_residual(
        is_present=is_present,
        is_cancelled=is_cancelled,
        strength=strength,
        formation_strength=formation_strength,
        narrow_margin=len(cancellation_factors) <= 2,
    )

    house_name_ta = {
        6: "6ம் வீட்டில் (ரிபு ஸ்தானம்)",
        8: "8ம் வீட்டில் (ஆயுள் ஸ்தானம்)",
        12: "12ம் வீட்டில் (விரய ஸ்தானம்)",
    }.get(seventh_lord_house, f"{seventh_lord_house}ம் வீட்டில்")
    house_name_en = {
        6: "house 6 (Ripu sthana)",
        8: "house 8 (Ayush sthana)",
        12: "house 12 (Viraya sthana)",
    }.get(seventh_lord_house, f"house {seventh_lord_house}")
    if not is_present:
        cancellation_factors = []  # a protection of nothing (L-5); see Sevvai
    what_ta, what_en, why_ta, why_en, how_ta, how_en = _build_dosham_explanations(
        "KALATHRA_DOSHAM",
        label,
        conditions_met=conditions_met,
        cancellation_factors=cancellation_factors,
        missing_data=[],
        residual=residual,
    )

    return DoshamResult(
        name="KALATHRA_DOSHAM",
        is_present=is_present,
        is_cancelled=is_cancelled,
        strength=strength,
        label=label,
        category="MARRIAGE",
        conditions_met=conditions_met,
        cancellation_factors=cancellation_factors,
        missing_data=[],
        dasha_activated=_is_active(active, seventh_lord, "VENUS"),
        description_ta=(
            f"களத்திர தோஷம்: 7ம் அதிபதி ({planet_ta(seventh_lord)}) {house_name_ta} உள்ளது; திருமண விஷயங்களில் கவனம் தேவை."
            if is_present
            else f"7ம் அதிபதி ({planet_ta(seventh_lord)}) {house_name_ta} உள்ளது; களத்திர தோஷம் இல்லை."
        ),
        description_en=(
            f"Kalathra dosham: 7th lord ({planet_en(seventh_lord)}) is in {house_name_en}; marriage matters need attention."
            if is_present
            else f"7th lord ({planet_en(seventh_lord)}) is in {house_name_en}; no Kalathra dosham."
        ),
        explanation_what_ta=what_ta,
        explanation_what_en=what_en,
        explanation_why_ta=why_ta,
        explanation_why_en=why_en,
        explanation_how_ta=how_ta,
        explanation_how_en=how_en,
        formation_strength=formation_strength,
        residual=residual,
    )


def detect_marana_karaka_sthana(
    planets: Mapping[str, PlanetInput],
    lagna_rasi: int,
    *,
    active_lords: Iterable[str] | None = None,
) -> DoshamResult:
    """Flag classical planets placed in their Marana Karaka Sthana (traditional
    caution house). Framed as an extra-caution indicator for that planet's
    dasha/bhukti, not a longevity/death prediction."""
    active = set(active_lords or ())
    missing_data = [planet for planet in MARANA_KARAKA_STHANA if planet not in planets]
    if missing_data:
        what_ta, what_en, why_ta, why_en, how_ta, how_en = _build_dosham_explanations(
            "MARANA_KARAKA_STHANA",
            "INCOMPLETE_DATA",
            conditions_met=[],
            cancellation_factors=[],
            missing_data=missing_data,
        )
        return DoshamResult(
            name="MARANA_KARAKA_STHANA",
            is_present=False,
            is_cancelled=False,
            strength="WEAK",
            label="INCOMPLETE_DATA",
            category="LONGEVITY_CAUTION",
            conditions_met=[],
            cancellation_factors=[],
            missing_data=missing_data,
            dasha_activated=False,
            description_ta="மரண காரக ஸ்தான பகுப்பாய்விற்கு சூரியன், சந்திரன், செவ்வாய், புதன், குரு, சுக்கிரன், சனி நிலைகள் தேவை.",
            description_en="Marana Karaka Sthana analysis needs Sun, Moon, Mars, Mercury, Jupiter, Venus, and Saturn placements.",
            explanation_what_ta=what_ta,
            explanation_what_en=what_en,
            explanation_why_ta=why_ta,
            explanation_why_en=why_en,
            explanation_how_ta=how_ta,
            explanation_how_en=how_en,
        )

    jupiter_rasi = _planet_rasi(planets, "JUPITER") if "JUPITER" in planets else None
    afflicted: list[str] = []
    mitigated: set[str] = set()
    jupiter_aspects: set[str] = set()
    cancellation_factors: list[str] = []

    for planet, mks_house in MARANA_KARAKA_STHANA.items():
        rasi = _planet_rasi(planets, planet)
        if house_from_reference(lagna_rasi, rasi) != mks_house:
            continue
        afflicted.append(planet)
        if rasi in OWN_SIGN_RASI.get(planet, set()) or rasi == EXALTATION_RASI.get(planet):
            cancellation_factors.append(f"{planet.lower()}_dignified_in_mks")
            mitigated.add(planet)
        if jupiter_rasi is not None and planet != "JUPITER" and aspects_house("JUPITER", jupiter_rasi, rasi):
            cancellation_factors.append(f"jupiter_aspects_{planet.lower()}_in_mks")
            mitigated.add(planet)
            jupiter_aspects.add(planet)

    conditions_met = [f"{planet.lower()}_in_marana_karaka_sthana" for planet in afflicted]
    is_present = bool(afflicted)
    is_cancelled = is_present and mitigated == set(afflicted)
    dasha_activated = _is_active(active, *afflicted) if afflicted else False

    if not is_present:
        strength = "WEAK"
    elif is_cancelled:
        strength = "WEAK"
    elif dasha_activated:
        strength = "STRONG"
    else:
        strength = "PARTIAL"

    if not is_present:
        label = "NO_MARANA_KARAKA_STHANA"
    elif is_cancelled:
        label = "MARANA_KARAKA_STHANA_MITIGATED"
    elif dasha_activated:
        label = "ACTIVE_MARANA_KARAKA_STHANA"
    else:
        label = "MARANA_KARAKA_STHANA_CANDIDATE"

    formation_strength = ("STRONG" if dasha_activated else "PARTIAL") if is_present else ""
    residual = dosham_residual(
        is_present=is_present,
        is_cancelled=is_cancelled,
        strength=strength,
        formation_strength=formation_strength,
        # Each afflicted graha mitigated by exactly one factor: at the threshold.
        narrow_margin=len(cancellation_factors) <= len(afflicted),
    )
    what_ta, what_en, why_ta, why_en, how_ta, how_en = _build_dosham_explanations(
        "MARANA_KARAKA_STHANA",
        label,
        conditions_met=conditions_met,
        cancellation_factors=cancellation_factors,
        missing_data=[],
        residual=residual,
    )
    meaning_ta, meaning_en = _mks_meaning(planets, afflicted, jupiter_aspects=jupiter_aspects)
    return DoshamResult(
        name="MARANA_KARAKA_STHANA",
        is_present=is_present,
        is_cancelled=is_cancelled,
        strength=strength,
        label=label,
        category="LONGEVITY_CAUTION",
        conditions_met=conditions_met,
        cancellation_factors=cancellation_factors,
        missing_data=[],
        dasha_activated=dasha_activated,
        description_ta=(
            "மரண காரக ஸ்தானம் — ஒரு கிரகம் அதற்குரிய குறிப்பிட்ட வீட்டில் இருக்கும்போது, "
            "அந்த கிரகத்தின் தசை/புக்தியில் கூடுதல் கவனம் (உடல்நலம், முக்கிய முடிவுகள்) தேவை "
            "என்பதைக் காட்டும் பாரம்பரிய குறிப்பான். இது இறப்பு கணிப்பு அல்ல."
        ),
        description_en=(
            "Marana Karaka Sthana is a traditional caution indicator: when a planet occupies its "
            "designated house, extra care (health, major decisions) is advised during that planet's "
            "dasha/bhukti. This is not a longevity or death prediction."
        ),
        explanation_what_ta=what_ta,
        explanation_what_en=what_en,
        explanation_why_ta=why_ta,
        explanation_why_en=why_en,
        explanation_how_ta=how_ta,
        explanation_how_en=how_en,
        formation_strength=formation_strength,
        residual=residual,
        meaning_ta=meaning_ta,
        meaning_en=meaning_en,
    )


def _ordinal_en(n: int) -> str:
    tail = "th" if 11 <= n % 100 <= 13 else {1: "st", 2: "nd", 3: "rd"}.get(n % 10, "th")
    return f"{n}{tail}"


def _join_en(items: list[str], word: str = "and") -> str:
    return items[0] if len(items) == 1 else f"{', '.join(items[:-1])} {word} {items[-1]}"


_PUTRA_SARPA_AFFLICTORS = ("RAHU", "KETU", "SATURN")


def _putra_sarpa_meaning(
    *,
    fifth_house_rasi: int,
    fifth_lord: str,
    in_house: list[str],
    beside_lord: list[str],
    beside_guru: list[str],
    lord_strong: bool,
    jupiter_house: int | None,
) -> tuple[str, str]:
    """The chart's own reading (DD-17 "In your chart"), Tamil and English.

    Names what disturbs the 5th house and what guards it, separately. The card
    used to say "the 5th house or its lord is afflicted" as the cause and "a
    strong 5th lord" as the cure, so a reader saw the 5th house on both sides
    and could not tell which fact in *their* chart did what.
    """
    lord_ta, lord_en = planet_ta(fifth_lord), planet_en(fifth_lord)
    disturb_ta: list[str] = []
    disturb_en: list[str] = []
    if in_house:
        disturb_ta.append(f"{', '.join(planet_ta(p) for p in in_house)} அந்த வீட்டிலேயே இருப்பது")
        disturb_en.append(f"{_join_en([planet_en(p) for p in in_house])} in the house itself")
    if beside_lord:
        disturb_ta.append(f"அதன் அதிபதியான {lord_ta} இருக்கும் ராசியிலேயே {', '.join(planet_ta(p) for p in beside_lord)} இருப்பது")
        disturb_en.append(f"{_join_en([planet_en(p) for p in beside_lord])} beside its lord, {lord_en}")
    if beside_guru:
        disturb_ta.append(f"புத்திர காரகனான குரு இருக்கும் ராசியிலேயே {', '.join(planet_ta(p) for p in beside_guru)} இருப்பது")
        disturb_en.append(f"{_join_en([planet_en(p) for p in beside_guru])} beside Jupiter, the karaka for children")

    guard_ta: list[str] = []
    guard_en: list[str] = []
    if lord_strong:
        # When the lord is itself the one a malefic sits beside, it is the same
        # planet on both sides — say so rather than naming it twice.
        guard_ta.append("அந்த அதிபதி வலுவாக இருப்பது" if beside_lord else f"அதன் அதிபதி {lord_ta} வலுவாக இருப்பது")
        guard_en.append("the strength of that lord" if beside_lord else f"the strength of its own lord, {lord_en}")
    if jupiter_house is not None:
        guard_ta.append(f"புத்திர காரகனான குரு உங்கள் {jupiter_house}-ஆம் வீட்டில் (கேந்திரம்) இருப்பது")
        guard_en.append(f"Jupiter, the karaka for children, in your {_ordinal_en(jupiter_house)} house (a kendra)")

    dasha = list(dict.fromkeys(in_house + beside_lord + beside_guru))
    dasha_ta = " அல்லது ".join(planet_ta(p) for p in dasha)
    dasha_en = _join_en([planet_en(p) for p in dasha], "or")
    house_ta = f"உங்கள் 5-ஆம் வீட்டை ({rasi_ta(fifth_house_rasi)}) பாதிப்பது: {'; '.join(disturb_ta)}."
    house_en = f"What disturbs your 5th house ({rasi_en(fifth_house_rasi)}): {'; '.join(disturb_en)}."
    # Facts and timing only. What it may bring, what to do and the medical
    # note each have their own section on the card (said once, 2026-10-06).
    when_ta = f"{dasha_ta} தசை அல்லது புக்தியில் இது அதிகம் உணரப்படலாம்."
    when_en = f"Most noticeable in the dasha or bhukti of {dasha_en}."
    if guard_en:
        return (
            f"{house_ta} அதைக் காப்பது: {'; '.join(guard_ta)}. {when_ta}",
            f"{house_en} What guards it: {'; '.join(guard_en)}. {when_en}",
        )
    return (
        f"{house_ta} இந்த ஜாதகத்தில் அதைக் காக்கும் காரணம் இல்லை. {when_ta}",
        f"{house_en} Nothing in this chart guards it. {when_en}",
    )


def detect_putra_sarpa_dosham(
    planets: dict[str, int],
    lagna_rasi: int,
    planet_scores: dict[str, int],
    *,
    doctrine: DoctrineOptions = DEFAULT_DOCTRINE,
) -> DoshamResult:
    fifth_lord = _house_lord(lagna_rasi, 5)
    fifth_rasi = planets.get(fifth_lord, lagna_rasi)
    fifth_house_rasi = ((lagna_rasi + 5 - 2) % 12) + 1
    # Nodes/Saturn occupying the 5th house itself, not just conjunct its lord
    # elsewhere (L-5) — the dosham's own description promises "5th house …
    # afflicted", which the lord-conjunction check alone doesn't cover.
    in_house = [p for p in _PUTRA_SARPA_AFFLICTORS if planets.get(p) == fifth_house_rasi]
    # O-32 (owner ruling 2026-10-06): for Thulam lagna, Sani in Kumbam is the
    # 5th lord in its own sign and the yogakaraka (4th + 5th). The placement is
    # recorded but does not form the dosham on its own; an independent
    # affliction still does. This one case only, not "own sign always cancels".
    sani_neutralized = (
        doctrine.o32_putra_sarpa_thulam_sani == "neutralized"
        and lagna_rasi == 7 and "SATURN" in in_house
    )
    if sani_neutralized:
        in_house.remove("SATURN")
    # A planet does not join itself. For Thulam lagna Saturn *is* the 5th lord,
    # and comparing Saturn's rasi with its own formed this dosham in every
    # Thulam-lagna chart. One already counted in the house is not counted twice.
    beside_lord = [
        p for p in _PUTRA_SARPA_AFFLICTORS
        if p != fifth_lord and p not in in_house and planets.get(p) == fifth_rasi
    ]
    # Guarded on presence: a chart missing both Jupiter and a node compared
    # None == None and formed the dosham. Where Jupiter is the 5th lord
    # (Simmam, Viruchigam lagna) a node beside it is already counted above.
    beside_guru: list[str] = [
        p for p in ("RAHU", "KETU")
        if "JUPITER" in planets and p in planets and p not in beside_lord
        and planets[p] == planets["JUPITER"] and not (fifth_lord == "JUPITER" and p in in_house)
    ]
    present = bool(in_house or beside_lord or beside_guru)
    conditions_met: list[str] = (
        [f"fifth_house_has_{p.lower()}" for p in in_house]
        + [f"fifth_lord_{fifth_lord.lower()}_joined_by_{p.lower()}" for p in beside_lord]
        + [f"jupiter_joined_by_{p.lower()}" for p in beside_guru]
    )
    lord_strong = planet_scores.get(fifth_lord, 50) >= 65
    jupiter_house = house_from_reference(lagna_rasi, planets["JUPITER"]) if "JUPITER" in planets else None
    jupiter_kendra_house = jupiter_house if jupiter_house in KENDRA_HOUSES else None
    # Each marker names its planet or house, so the card can say *which* lord
    # is strong and *where* Jupiter stands (was `strong_fifth_lord` /
    # `jupiter_kendra`; their labels stay in the web panel for older payloads).
    # Read only for a formed dosham: they were sent on unformed charts too, and
    # the web card then said "this combination did form … and was annulled".
    cancellation: list[str] = []
    if present and lord_strong:
        cancellation.append(f"fifth_lord_{fifth_lord.lower()}_strong")
    if present and jupiter_kendra_house is not None:
        cancellation.append(f"jupiter_in_kendra_house_{jupiter_kendra_house}")
    # O-32 neutralized and nothing else formed it: "formation detected,
    # neutralized" — the placement and its reason, with is_present False.
    neutralized = sani_neutralized and not present
    if neutralized:
        conditions_met = ["fifth_house_has_saturn"]
        cancellation = ["saturn_yogakaraka_own_fifth"]
    label = "NO_DOSHAM"
    if present and cancellation:
        label = "DOSHAM_WITH_NIVARTHI"
    elif present and planet_scores.get(fifth_lord, 50) < 40:
        label = "STRONG_ACTIVE_DOSHAM"
    elif present:
        label = "ACTIVE_DOSHAM"
    # is_cancelled must never be True when is_present is False (L-5) —
    # there's nothing to cancel if the dosham was never triggered.
    is_cancelled = present and bool(cancellation)
    formation_strength = ("STRONG" if planet_scores.get(fifth_lord, 50) < 40 else "PARTIAL") if present else ""
    # DD-17: a mitigated dosham reads WEAK like every other detector's; it
    # used to keep PARTIAL beside its nivarthi label.
    strength = "WEAK" if is_cancelled or not present else formation_strength
    residual = dosham_residual(
        is_present=present,
        is_cancelled=is_cancelled,
        strength=strength,
        formation_strength=formation_strength,
        narrow_margin=len(cancellation) == 1,
    )
    what_ta, what_en, why_ta, why_en, how_ta, how_en = _build_dosham_explanations(
        "PUTRA_SARPA_DOSHAM",
        label,
        conditions_met=conditions_met,
        cancellation_factors=cancellation,
        missing_data=[],
        residual=residual,
    )
    meaning_ta, meaning_en = _putra_sarpa_meaning(
        fifth_house_rasi=fifth_house_rasi,
        fifth_lord=fifth_lord,
        in_house=in_house,
        beside_lord=beside_lord,
        beside_guru=beside_guru,
        lord_strong=lord_strong,
        jupiter_house=jupiter_kendra_house,
    ) if present else ("", "")
    if neutralized:
        why_ta = (
            "சனி உங்கள் 5-ஆம் வீடான கும்பத்தில் உள்ளது. ஆனால் துலாம் லக்னத்திற்கு சனி 5-ஆம் அதிபதி, "
            "ஆட்சி பெற்றுள்ளது, யோககாரகனும் கூட; தன் சொந்த வீட்டை அது காக்கிறது. "
            "5-ஆம் வீடு, அதன் அதிபதி அல்லது குருவுக்கு வேறு பாதிப்பு இல்லாததால் புத்ர சர்ப்ப தோஷம் செயல்படவில்லை."
        )
        why_en = (
            "Saturn sits in your 5th house, Kumbam. For Thulam lagna Saturn is the 5th lord, in its own sign, "
            "and the yogakaraka, so it guards the house it owns. With no other affliction to the 5th house, "
            "its lord or Jupiter, Putra Sarpa Dosham is not active."
        )
    return DoshamResult(
        name="PUTRA_SARPA_DOSHAM",
        is_present=present,
        is_cancelled=is_cancelled,
        strength=strength,
        formation_strength=formation_strength,
        residual=residual,
        label=label,
        category="CHILDREN",
        conditions_met=conditions_met,
        cancellation_factors=cancellation,
        missing_data=[],
        dasha_activated=False,
        description_ta="புத்ர சர்ப்ப தோஷம் — 5-ஆம் வீடு, அதன் அதிபதி அல்லது குரு ராகு, கேது அல்லது சனியால் பாதிக்கப்படுவது.",
        description_en="Putra Sarpa dosham — the 5th house, its lord or Jupiter afflicted by Rahu, Ketu or Saturn.",
        explanation_what_ta=what_ta,
        explanation_what_en=what_en,
        explanation_why_ta=why_ta,
        explanation_why_en=why_en,
        explanation_how_ta=how_ta,
        explanation_how_en=how_en,
        meaning_ta=meaning_ta,
        meaning_en=meaning_en,
    )


def detect_badhaka_dosham(
    planets: dict[str, int],
    lagna_rasi: int,
    planet_scores: dict[str, int],
    current_maha_lord: str,
) -> DoshamResult:
    badhaka_lord = get_badhaka_lord(lagna_rasi, SIGN_LORD)
    badhaka_rasi = planets.get(badhaka_lord, lagna_rasi)
    lagna_lord = _house_lord(lagna_rasi, 1)
    active = (
        house_from_reference(lagna_rasi, badhaka_rasi) == 1
        or planets.get("MOON") == badhaka_rasi
        or planets.get(lagna_lord) == badhaka_rasi
        or current_maha_lord == badhaka_lord
    )
    cancellation = []
    if planet_scores.get(badhaka_lord, 50) >= 65:
        cancellation.append("badhaka_lord_strong")
    label = "NO_DOSHAM"
    if active and cancellation:
        label = "DOSHAM_WITH_NIVARTHI"
    elif active and current_maha_lord == badhaka_lord:
        label = "STRONG_ACTIVE_DOSHAM"
    elif active:
        label = "ACTIVE_DOSHAM"
    # Was `bool(cancellation)` alone, so a strong badhaka lord reported a
    # nivarthi on charts where the dosham never formed (the L-5 invariant).
    is_cancelled = active and bool(cancellation)
    formation_strength = ("STRONG" if current_maha_lord == badhaka_lord else "PARTIAL") if active else ""
    strength = "WEAK" if is_cancelled or not active else formation_strength
    residual = dosham_residual(
        is_present=active,
        is_cancelled=is_cancelled,
        strength=strength,
        formation_strength=formation_strength,
        narrow_margin=True,  # one mitigation exists, so any nivarthi is at the threshold
    )
    what_ta, what_en, why_ta, why_en, how_ta, how_en = _build_dosham_explanations(
        "BADHAKA_DOSHAM",
        label,
        conditions_met=["badhaka_active"] if active else [],
        cancellation_factors=cancellation,
        missing_data=[],
        residual=residual,
    )
    return DoshamResult(
        name="BADHAKA_DOSHAM",
        is_present=active,
        is_cancelled=is_cancelled,
        strength=strength,
        formation_strength=formation_strength,
        residual=residual,
        label=label,
        category="OBSTACLES",
        conditions_met=["badhaka_active"] if active else [],
        cancellation_factors=cancellation,
        missing_data=[],
        dasha_activated=current_maha_lord == badhaka_lord,
        description_ta="பாதக தோஷம் — லக்னத்தின்படி பாதக அதிபதி செயல்படும் காலம்.",
        description_en="Badhaka dosham — obstruction pattern from badhaka lord.",
        explanation_what_ta=what_ta,
        explanation_what_en=what_en,
        explanation_why_ta=why_ta,
        explanation_why_en=why_en,
        explanation_how_ta=how_ta,
        explanation_how_en=how_en,
    )
