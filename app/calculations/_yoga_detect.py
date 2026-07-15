"""Yoga detection functions: Gaja Kesari, Raja, Dhana, Neecha Bhanga, Pancha Mahapurusha, and more."""
from __future__ import annotations

from collections.abc import Iterable, Mapping
from dataclasses import dataclass
from itertools import combinations

from app.calculations.aspects import aspects_house
from app.calculations.astro import house_from_reference
from app.calculations.chart_strength import (
    DEBILITATION_RASI,
    EXALTATION_RASI,
    MOOLATRIKONA_ZONE,
    OWN_SIGN_RASI,
    SIGN_LORD,
)
from app.calculations._yoga_helpers import (
    KENDRA_HOUSES,
    NATURAL_BENEFICS,
    NATURAL_MALEFICS,
    PlanetInput,
    TRIKONA_HOUSES,
    YogaResult,
    _house_lord,
    _is_active,
    _is_kendra_from,
    _planet_rasi,
    gate_yoga_strength,
)

_PANCHA_MAHAPURUSHA: dict[str, tuple[str, str]] = {
    "MARS":    ("RUCHAKA_YOGA",  "ருசக யோகம்"),
    "MERCURY": ("BHADRA_YOGA",   "பத்ர யோகம்"),
    "JUPITER": ("HAMSA_YOGA",    "ஹம்ச யோகம்"),
    "VENUS":   ("MALAVYA_YOGA",  "மாளவ்ய யோகம்"),
    "SATURN":  ("SASA_YOGA",     "சஸ யோகம்"),
}

_PANCHA_MAHAPURUSHA_EN: dict[str, str] = {
    "RUCHAKA_YOGA": "Ruchaka Yoga — Mars in own/exalted/Moolatrikona and in a Kendra from Lagna.",
    "BHADRA_YOGA":  "Bhadra Yoga — Mercury in own/exalted/Moolatrikona and in a Kendra from Lagna.",
    "HAMSA_YOGA":   "Hamsa Yoga — Jupiter in own/exalted/Moolatrikona and in a Kendra from Lagna.",
    "MALAVYA_YOGA": "Malavya Yoga — Venus in own/exalted/Moolatrikona and in a Kendra from Lagna.",
    "SASA_YOGA":    "Sasa Yoga — Saturn in own/exalted/Moolatrikona and in a Kendra from Lagna.",
}

_NAKSHATRA_CAUTION_MAP: dict[int, tuple[str, str, str]] = {
    9:  ("AYILYAM_CAUTION",  "ஆயில்ய தோஷம்", "Ashlesha (Ayilyam) nakshatra — traditional caution, especially regarding the in-law relationship."),
    18: ("KETTAI_CAUTION",   "கேட்டை தோஷம்", "Jyeshtha (Kettai) nakshatra — traditional caution; remedies and family awareness recommended."),
    19: ("MOOLAM_CAUTION",   "மூல தோஷம்",    "Moola nakshatra — traditional caution, especially for first child; remedies widely practiced."),
}


@dataclass(frozen=True, slots=True)
class ParivartanaResult:
    planet_a: str
    planet_b: str
    sub_type: str   # "MAHA" | "DAINYA" | "KAHALA"
    conditions_met: list[str]


@dataclass(frozen=True, slots=True)
class NakshatraCautionResult:
    name: str
    nakshatra_number: int
    description_ta: str
    description_en: str


def detect_gaja_kesari(
    planets: Mapping[str, PlanetInput],
    moon_rasi: int,
    *,
    active_lords: Iterable[str] | None = None,
    planet_scores: Mapping[str, int] | None = None,
    combust_planets: frozenset[str] = frozenset(),
) -> YogaResult:
    active = set(active_lords or ())
    jupiter_rasi = _planet_rasi(planets, "JUPITER")
    house = house_from_reference(moon_rasi, jupiter_rasi)
    present = house in KENDRA_HOUSES
    strength = "STRONG" if present else "WEAK"
    gate_notes: list[str] = []
    if present:
        strength, gate_notes = gate_yoga_strength(
            strength, ("JUPITER", "MOON"), planet_scores, combust_planets
        )
    return YogaResult(
        name="GAJA_KESARI_YOGA",
        is_present=present,
        strength=strength,
        conditions_met=["jupiter_in_kendra_from_moon"] if present else [],
        cancellation_factors=gate_notes,
        dasha_activated=_is_active(active, "JUPITER", "MOON"),
        description_ta="சந்திரத்திலிருந்து குரு கேந்திரத்தில் இருந்தால் கஜகேசரி யோகம்.",
        description_en="Gaja Kesari is present when Jupiter is in a Kendra from Moon.",
    )


def detect_raja_yoga(
    planets: Mapping[str, PlanetInput],
    lagna_rasi: int,
    *,
    active_lords: Iterable[str] | None = None,
    planet_scores: Mapping[str, int] | None = None,
    combust_planets: frozenset[str] = frozenset(),
) -> list[YogaResult]:
    active = set(active_lords or ())
    kendra_lords = {_house_lord(lagna_rasi, house) for house in (1, 4, 7, 10)}
    trikona_lords = {_house_lord(lagna_rasi, house) for house in (1, 5, 9)}

    results: list[YogaResult] = []
    for trikona_lord in sorted(trikona_lords):
        for kendra_lord in sorted(kendra_lords):
            if trikona_lord == kendra_lord:
                continue
            trikona_rasi = _planet_rasi(planets, trikona_lord)
            kendra_rasi = _planet_rasi(planets, kendra_lord)
            if trikona_rasi == kendra_rasi or aspects_house(trikona_lord, trikona_rasi, kendra_rasi):
                strength, gate_notes = gate_yoga_strength(
                    "STRONG", (trikona_lord, kendra_lord), planet_scores, combust_planets
                )
                results.append(
                    YogaResult(
                        name="RAJA_YOGA",
                        is_present=True,
                        strength=strength,
                        conditions_met=[f"{trikona_lord}_{kendra_lord}_link"],
                        cancellation_factors=gate_notes,
                        dasha_activated=_is_active(active, trikona_lord, kendra_lord),
                        description_ta="திரிகோண மற்றும் கேந்திர அதிபதிகள் இணைப்பு ராஜயோகமாக கருதப்படுகிறது.",
                        description_en="A Trikona and Kendra lord linkage is traditionally treated as Raja Yoga.",
                    )
                )
    return results


def detect_dhana_yoga(
    planets: Mapping[str, PlanetInput],
    lagna_rasi: int,
    *,
    active_lords: Iterable[str] | None = None,
    planet_scores: Mapping[str, int] | None = None,
    combust_planets: frozenset[str] = frozenset(),
) -> YogaResult:
    active = set(active_lords or ())
    second_lord = _house_lord(lagna_rasi, 2)
    eleventh_lord = _house_lord(lagna_rasi, 11)
    second_rasi = _planet_rasi(planets, second_lord)
    eleventh_rasi = _planet_rasi(planets, eleventh_lord)
    conditions: list[str] = []

    if second_rasi == eleventh_rasi:
        conditions.append("second_eleventh_conjunction")

    second_rasi_owned_by_eleventh = SIGN_LORD[second_rasi] == eleventh_lord
    eleventh_rasi_owned_by_second = SIGN_LORD[eleventh_rasi] == second_lord
    if second_rasi_owned_by_eleventh and eleventh_rasi_owned_by_second:
        conditions.append("second_eleventh_exchange")

    second_house = house_from_reference(lagna_rasi, second_rasi)
    eleventh_house = house_from_reference(lagna_rasi, eleventh_rasi)
    if second_house in KENDRA_HOUSES | TRIKONA_HOUSES and eleventh_house in KENDRA_HOUSES | TRIKONA_HOUSES:
        conditions.append("both_lords_in_strong_houses")

    present = len(conditions) > 0
    base_strength = "STRONG" if "second_eleventh_conjunction" in conditions or "second_eleventh_exchange" in conditions else ("PARTIAL" if present else "WEAK")
    strength, gate_notes = gate_yoga_strength(
        base_strength, (second_lord, eleventh_lord), planet_scores, combust_planets
    )
    return YogaResult(
        name="DHANA_YOGA",
        is_present=present,
        strength=strength,
        conditions_met=conditions,
        cancellation_factors=gate_notes,
        dasha_activated=_is_active(active, second_lord, eleventh_lord),
        description_ta="2ம் மற்றும் 11ம் அதிபதிகளின் உறவு தனயோக சுட்டியாக பார்க்கப்படுகிறது.",
        description_en="A link between 2nd and 11th lords is treated as a Dhana Yoga indicator.",
    )


def detect_neecha_bhanga(
    planets: Mapping[str, PlanetInput],
    lagna_rasi: int,
    *,
    active_lords: Iterable[str] | None = None,
    retrograde_planets: frozenset[str] = frozenset(),
    d9_rasi_map: Mapping[str, int] | None = None,
    d9_lagna_rasi: int | None = None,
) -> list[YogaResult]:
    active = set(active_lords or ())
    moon_rasi = _planet_rasi(planets, "MOON")
    exaltation_owner_by_planet = {planet: SIGN_LORD[rasi] for planet, rasi in EXALTATION_RASI.items()}
    exalter_of_sign = {rasi: planet for planet, rasi in EXALTATION_RASI.items()}
    results: list[YogaResult] = []

    for planet, debilitation_rasi in DEBILITATION_RASI.items():
        planet_rasi = _planet_rasi(planets, planet)
        if planet_rasi != debilitation_rasi:
            continue

        conditions: list[str] = ["planet_debilitated"]

        debilitation_sign_lord = SIGN_LORD[debilitation_rasi]
        deb_lord_rasi = _planet_rasi(planets, debilitation_sign_lord)
        if _is_kendra_from(lagna_rasi, deb_lord_rasi) or _is_kendra_from(moon_rasi, deb_lord_rasi):
            conditions.append("debilitation_sign_lord_in_kendra")

        exalter_planet = exalter_of_sign.get(debilitation_rasi)
        if exalter_planet is not None:
            exalter_rasi = _planet_rasi(planets, exalter_planet)
            if _is_kendra_from(lagna_rasi, exalter_rasi) or _is_kendra_from(moon_rasi, exalter_rasi):
                conditions.append("exalter_of_debilitation_sign_in_kendra")

        exaltation_sign_lord = exaltation_owner_by_planet.get(planet)
        if exaltation_sign_lord is not None:
            exaltation_sign_lord_rasi = _planet_rasi(planets, exaltation_sign_lord)
            if aspects_house(exaltation_sign_lord, exaltation_sign_lord_rasi, planet_rasi):
                conditions.append("exaltation_sign_lord_aspects_debilitated")

        if d9_rasi_map and d9_lagna_rasi and planet in d9_rasi_map:
            d9_house = house_from_reference(d9_lagna_rasi, d9_rasi_map[planet])
            if d9_house in (KENDRA_HOUSES | TRIKONA_HOUSES):
                conditions.append("debilitated_planet_strong_d9")

        if planet in retrograde_planets:
            conditions.append("debilitated_planet_retrograde_note")

        present = len(conditions) > 1
        results.append(
            YogaResult(
                name="NEECHA_BHANGA_RAJA_YOGA",
                is_present=present,
                strength="PARTIAL" if present else "WEAK",
                conditions_met=conditions,
                cancellation_factors=[],
                dasha_activated=_is_active(active, planet),
                description_ta="நீச கிரகத்திற்கு நிவர்த்தி நிபந்தனைகள் சேர்ந்தால் நீசபங்க ராஜயோகம்.",
                description_en="Neecha Bhanga Raja Yoga is considered when a debilitated planet has cancellation conditions.",
            )
        )

    return results


def detect_pancha_mahapurusha(
    planets: Mapping[str, PlanetInput],
    lagna_rasi: int,
    *,
    active_lords: Iterable[str] | None = None,
    planet_scores: Mapping[str, int] | None = None,
    combust_planets: frozenset[str] = frozenset(),
) -> list[YogaResult]:
    active = set(active_lords or ())
    results: list[YogaResult] = []
    for planet, (yoga_name, ta) in _PANCHA_MAHAPURUSHA.items():
        if planet not in planets:
            continue
        p_rasi = _planet_rasi(planets, planet)
        in_own = p_rasi in OWN_SIGN_RASI.get(planet, set())
        in_exalt = p_rasi == EXALTATION_RASI.get(planet)
        mt = MOOLATRIKONA_ZONE.get(planet)
        in_mool = mt is not None and p_rasi == mt[0]
        in_kendra = house_from_reference(lagna_rasi, p_rasi) in KENDRA_HOUSES
        present = (in_own or in_exalt or in_mool) and in_kendra
        conditions: list[str] = []
        gate_notes: list[str] = []
        strength = "WEAK"
        if present:
            if in_own:
                conditions.append(f"{planet.lower()}_own_sign")
            if in_exalt:
                conditions.append(f"{planet.lower()}_exaltation")
            if in_mool:
                conditions.append(f"{planet.lower()}_moolatrikona")
            conditions.append(f"{planet.lower()}_in_kendra")
            strength, gate_notes = gate_yoga_strength(
                "STRONG", (planet,), planet_scores, combust_planets
            )
        results.append(YogaResult(
            name=yoga_name,
            is_present=present,
            strength=strength,
            conditions_met=conditions,
            cancellation_factors=gate_notes,
            dasha_activated=_is_active(active, planet),
            description_ta=ta,
            description_en=_PANCHA_MAHAPURUSHA_EN[yoga_name],
        ))
    return results


def detect_budha_aditya(
    planets: Mapping[str, PlanetInput],
    *,
    combust_planets: frozenset[str] = frozenset(),
    active_lords: Iterable[str] | None = None,
) -> YogaResult:
    active = set(active_lords or ())
    mercury_rasi = _planet_rasi(planets, "MERCURY")
    sun_rasi = _planet_rasi(planets, "SUN")
    mercury_combust = "MERCURY" in combust_planets
    same_rasi = mercury_rasi == sun_rasi
    present = same_rasi and not mercury_combust
    partial = same_rasi and mercury_combust
    conditions: list[str] = []
    if same_rasi:
        conditions.append("mercury_sun_same_rasi")
    if mercury_combust:
        conditions.append("mercury_combust_partial")
    return YogaResult(
        name="BUDHA_ADITYA_YOGA",
        is_present=present or partial,
        strength="STRONG" if present else ("PARTIAL" if partial else "WEAK"),
        conditions_met=conditions,
        cancellation_factors=[],
        dasha_activated=_is_active(active, "MERCURY", "SUN"),
        description_ta="புத ஆதித்ய யோகம்" + (" (புதன் அஸ்தமனம் — உள்ளுணர்வு புத்தி)" if partial else ""),
        description_en=(
            "Budha Aditya Yoga — Sun and Mercury in same rasi, Mercury not combust."
            if present
            else "Partial Budha Aditya (Mercury combust — internalized intellect)."
            if partial
            else "Budha Aditya Yoga not present."
        ),
    )


def detect_vipareetha_raja(
    planets: Mapping[str, PlanetInput],
    lagna_rasi: int,
    *,
    active_lords: Iterable[str] | None = None,
) -> YogaResult:
    active = set(active_lords or ())
    dusthana = {6, 8, 12}
    conditions: list[str] = []
    for house_num in dusthana:
        lord = _house_lord(lagna_rasi, house_num)
        if lord not in planets:
            continue
        lord_rasi = _planet_rasi(planets, lord)
        lord_house = house_from_reference(lagna_rasi, lord_rasi)
        if lord_house in dusthana and lord_house != house_num:
            conditions.append(f"{lord.lower()}_lord_of_{house_num}_in_{lord_house}")
    present = len(conditions) > 0
    return YogaResult(
        name="VIPAREETHA_RAJA_YOGA",
        is_present=present,
        strength="STRONG" if present else "WEAK",
        conditions_met=conditions,
        cancellation_factors=[],
        dasha_activated=_is_active(active, *[_house_lord(lagna_rasi, h) for h in dusthana]),
        description_ta="விபரீத ராஜ யோகம் — 6, 8, 12 அதிபதி வேறொரு துஷ்டான வீட்டில் இருந்தால் இந்த யோகம் உருவாகும்.",
        description_en="Vipareetha Raja Yoga — lord of a dusthana (6/8/12) placed in another dusthana.",
    )


def detect_parivartana(
    planets: Mapping[str, PlanetInput],
    lagna_rasi: int,
) -> list[ParivartanaResult]:
    kendra_trikona = {1, 4, 5, 7, 9, 10}
    dusthana = {6, 8, 12}
    results: list[ParivartanaResult] = []
    planet_list = [p for p in ("SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN") if p in planets]
    for p1, p2 in combinations(planet_list, 2):
        p1_rasi = _planet_rasi(planets, p1)
        p2_rasi = _planet_rasi(planets, p2)
        if SIGN_LORD.get(p1_rasi) == p2 and SIGN_LORD.get(p2_rasi) == p1:
            p1_house = house_from_reference(lagna_rasi, p1_rasi)
            p2_house = house_from_reference(lagna_rasi, p2_rasi)
            both_kt = p1_house in kendra_trikona and p2_house in kendra_trikona
            either_dusthana = p1_house in dusthana or p2_house in dusthana
            if both_kt:
                sub_type = "MAHA"
            elif either_dusthana:
                sub_type = "DAINYA"
            else:
                sub_type = "KAHALA"
            results.append(ParivartanaResult(
                planet_a=p1,
                planet_b=p2,
                sub_type=sub_type,
                conditions_met=[f"{p1.lower()}_{p2.lower()}_exchange", f"sub_type_{sub_type.lower()}"],
            ))
    return results


def _parivartana_as_yogas(
    parivartana: list[ParivartanaResult],
    active_lords: set[str],
) -> list[YogaResult]:
    results: list[YogaResult] = []
    for pv in parivartana:
        present = pv.sub_type in ("MAHA", "DAINYA", "KAHALA")
        results.append(YogaResult(
            name="PARIVARTANA_YOGA",
            is_present=present,
            strength="STRONG" if pv.sub_type == "MAHA" else ("PARTIAL" if pv.sub_type == "DAINYA" else "WEAK"),
            conditions_met=pv.conditions_met,
            cancellation_factors=[],
            dasha_activated=_is_active(active_lords, pv.planet_a, pv.planet_b),
            description_ta=f"பரிவர்தன யோகம் ({pv.sub_type}) — {pv.planet_a} மற்றும் {pv.planet_b} கிரகங்கள் ராசி மாற்றம் செய்கின்றன.",
            description_en=f"Parivartana Yoga ({pv.sub_type}) — {pv.planet_a} and {pv.planet_b} exchange signs.",
        ))
    return results


def detect_chandra_mangala(
    planets: Mapping[str, PlanetInput],
    *,
    active_lords: Iterable[str] | None = None,
    planet_scores: Mapping[str, int] | None = None,
    combust_planets: frozenset[str] = frozenset(),
) -> YogaResult:
    active = set(active_lords or ())
    moon_rasi = _planet_rasi(planets, "MOON")
    mars_rasi = _planet_rasi(planets, "MARS")
    conjunct = moon_rasi == mars_rasi
    mutual_seventh = house_from_reference(moon_rasi, mars_rasi) == 7
    present = conjunct or mutual_seventh
    conditions: list[str] = []
    if conjunct:
        conditions.append("moon_mars_same_rasi")
    elif mutual_seventh:
        conditions.append("moon_mars_mutual_seventh")
    base_strength = "STRONG" if conjunct else ("PARTIAL" if mutual_seventh else "WEAK")
    strength, gate_notes = gate_yoga_strength(
        base_strength, ("MOON", "MARS"), planet_scores, combust_planets
    )
    return YogaResult(
        name="CHANDRA_MANGALA_YOGA",
        is_present=present,
        strength=strength,
        conditions_met=conditions,
        cancellation_factors=gate_notes,
        dasha_activated=_is_active(active, "MOON", "MARS"),
        description_ta="சந்திர மங்கள யோகம் — சந்திரனும் செவ்வாயும் ஒரே ராசியில் அல்லது ஏழாம் பார்வையில் இருந்தால் இந்த யோகம் ஏற்படும்.",
        description_en="Chandra Mangala Yoga — Moon and Mars in same rasi or mutual 7th aspect.",
    )


def detect_nakshatra_cautions(janma_nakshatra: int) -> list[NakshatraCautionResult]:
    entry = _NAKSHATRA_CAUTION_MAP.get(janma_nakshatra)
    if entry is None:
        return []
    name, ta, en = entry
    return [NakshatraCautionResult(name=name, nakshatra_number=janma_nakshatra, description_ta=ta, description_en=en)]


def _merge_yoga_list(results: list[YogaResult], merged_name: str) -> YogaResult:
    """Merge multiple YogaResult entries with the same name into one."""
    present = [r for r in results if r.is_present]
    if not results:
        raise ValueError("Cannot merge empty yoga list")
    base = results[0]
    all_conditions: list[str] = []
    all_cancellations: list[str] = []
    dasha_activated = False
    for r in results:
        all_conditions.extend(r.conditions_met)
        all_cancellations.extend(r.cancellation_factors)
        if r.dasha_activated:
            dasha_activated = True
    strengths = [r.strength for r in present]
    strength = "STRONG" if "STRONG" in strengths else ("PARTIAL" if "PARTIAL" in strengths else "WEAK")
    return YogaResult(
        name=merged_name,
        is_present=bool(present),
        strength=strength,
        conditions_met=list(dict.fromkeys(all_conditions)),
        cancellation_factors=list(dict.fromkeys(all_cancellations)),
        dasha_activated=dasha_activated,
        description_ta=base.description_ta,
        description_en=base.description_en,
    )


def detect_sakata_yoga(moon_rasi: int, jupiter_rasi: int, lagna_rasi: int) -> YogaResult:
    moon_from_jupiter = house_from_reference(jupiter_rasi, moon_rasi)
    present = moon_from_jupiter in {6, 8, 12}
    cancelled = house_from_reference(lagna_rasi, moon_rasi) in KENDRA_HOUSES
    conditions = [f"moon_from_jupiter_{moon_from_jupiter}"] if present else []
    cancellations = ["moon_kendra_from_lagna"] if present and cancelled else []
    return YogaResult(
        name="SAKATA_YOGA",
        is_present=present,
        strength="PARTIAL" if present and cancelled else ("STRONG" if present else "WEAK"),
        conditions_met=conditions,
        cancellation_factors=cancellations,
        dasha_activated=False,
        description_ta="சகட யோகம் — சந்திரன் குருவுக்கு 6/8/12இல் இருந்தால் பலன் ஏற்ற இறக்கம்.",
        description_en="Sakata Yoga — Moon in 6/8/12 from Jupiter gives fluctuating fortune.",
    )


def detect_kemadruma_yoga(planets: dict[str, int], moon_rasi: int, lagna_rasi: int) -> YogaResult:
    second = ((moon_rasi - 1 + 1) % 12) + 1
    twelfth = ((moon_rasi - 1 - 1) % 12) + 1
    surrounding = [
        p for p, rasi in planets.items()
        if p not in {"SUN", "RAHU", "KETU", "MOON"} and rasi in {second, twelfth}
    ]
    present = len(surrounding) == 0

    # Four classical Bhanga (cancellation) rules — any single one softens the yoga to
    # PARTIAL; two or more void it (STRENGTH=WEAK), matching the graded-severity approach
    # used elsewhere in this file rather than a single all-or-nothing cancellation flag.
    moon_kendra_lagna = house_from_reference(lagna_rasi, moon_rasi) in KENDRA_HOUSES
    planet_kendra_from_moon = any(
        planet not in {"MOON", "RAHU", "KETU"} and house_from_reference(moon_rasi, rasi) in KENDRA_HOUSES
        for planet, rasi in planets.items()
    )
    jupiter_rasi = planets.get("JUPITER")
    jupiter_aspects_moon = jupiter_rasi is not None and aspects_house("JUPITER", jupiter_rasi, moon_rasi)
    sun_rasi = planets.get("SUN")
    moon_full_opposite_sun = sun_rasi is not None and house_from_reference(sun_rasi, moon_rasi) == 7

    cancellation_checks = [
        ("moon_kendra_from_lagna", moon_kendra_lagna),
        ("planet_kendra_from_moon", planet_kendra_from_moon),
        ("jupiter_aspects_moon", jupiter_aspects_moon),
        ("moon_full_opposite_sun", moon_full_opposite_sun),
    ]
    cancellation_factors = [name for name, ok in cancellation_checks if present and ok]

    if not present:
        strength = "WEAK"
    elif not cancellation_factors:
        strength = "STRONG"
    elif len(cancellation_factors) == 1:
        strength = "PARTIAL"
    else:
        strength = "WEAK"

    return YogaResult(
        name="KEMADRUMA_YOGA",
        is_present=present,
        strength=strength,
        conditions_met=["no_planets_2nd_12th_from_moon"] if present else [],
        cancellation_factors=cancellation_factors,
        dasha_activated=False,
        description_ta="கேமத்ரும யோகம் — சந்திரனைச் சுற்றி 2/12இல் கிரக ஆதரவு இல்லாமை. நான்கு பங்க விதிகள் ஆராயப்படுகின்றன: லக்னத்திலிருந்து சந்திரன் கேந்திரத்தில், சந்திரனிலிருந்து ஒரு கிரகம் கேந்திரத்தில், குரு பார்வை சந்திரன் மீது, முழு நிலவு (சூரியனுக்கு எதிரே).",
        description_en="Kemadruma Yoga — absence of planets in 2nd/12th from Moon. Checked against four classical cancellation (bhanga) rules: Moon in a kendra from Lagna, any planet in a kendra from Moon, Jupiter's aspect on Moon, and a full Moon (opposite the Sun).",
    )


def detect_kartari_yoga(planets: dict[str, int], target_rasi: int, target_label: str = "LAGNA") -> YogaResult:
    """Papa/Shubha Kartari Yoga — a house 'hemmed' by malefics (Papa, afflicting)
    or benefics (Shubha, protective) placed in the 2nd and 12th signs from it."""
    second = ((target_rasi - 1 + 1) % 12) + 1
    twelfth = ((target_rasi - 1 - 1) % 12) + 1

    second_occupants = [planet for planet, rasi in planets.items() if rasi == second]
    twelfth_occupants = [planet for planet, rasi in planets.items() if rasi == twelfth]

    second_has_malefic = any(planet in NATURAL_MALEFICS for planet in second_occupants)
    second_has_benefic = any(planet in NATURAL_BENEFICS for planet in second_occupants)
    twelfth_has_malefic = any(planet in NATURAL_MALEFICS for planet in twelfth_occupants)
    twelfth_has_benefic = any(planet in NATURAL_BENEFICS for planet in twelfth_occupants)

    is_papa = bool(second_occupants and twelfth_occupants and second_has_malefic and twelfth_has_malefic
                   and not second_has_benefic and not twelfth_has_benefic)
    is_shubha = bool(second_occupants and twelfth_occupants and second_has_benefic and twelfth_has_benefic
                      and not second_has_malefic and not twelfth_has_malefic)

    label = target_label.replace("_", " ").title()
    if is_papa:
        name = "PAPA_KARTARI_YOGA"
        conditions_met = [f"malefics_hemming_{target_label.lower()}"]
        description_ta = f"பாப கர்த்தரி யோகம் — {label} இரு பக்கமும் (2/12) பாதக கிரகங்களால் சூழப்பட்டுள்ளது; அதன் பலன்கள் பலவீனமடையலாம்."
        description_en = f"Papa Kartari Yoga — {label} is hemmed on both sides (2nd/12th) by malefic planets, weakening its significations."
    elif is_shubha:
        name = "SHUBHA_KARTARI_YOGA"
        conditions_met = [f"benefics_hemming_{target_label.lower()}"]
        description_ta = f"சுப கர்த்தரி யோகம் — {label} இரு பக்கமும் (2/12) சுப கிரகங்களால் சூழப்பட்டுள்ளது; அதன் பலன்கள் வலுப்படுத்தப்படுகின்றன."
        description_en = f"Shubha Kartari Yoga — {label} is hemmed on both sides (2nd/12th) by benefic planets, protecting and strengthening its significations."
    else:
        name = "KARTARI_YOGA"
        conditions_met = []
        description_ta = f"{label}-ஐ சுற்றி கர்த்தரி (பாப/சுப) அமைப்பு இல்லை."
        description_en = f"No Papa/Shubha Kartari (hemming) formation is present around {label}."

    is_present = is_papa or is_shubha
    return YogaResult(
        name=name,
        is_present=is_present,
        strength="STRONG" if is_present else "WEAK",
        conditions_met=conditions_met,
        cancellation_factors=[],
        dasha_activated=False,
        description_ta=description_ta,
        description_en=description_en,
    )


def detect_chandala_yoga(jupiter_rasi: int, rahu_rasi: int) -> YogaResult:
    present = jupiter_rasi == rahu_rasi
    return YogaResult(
        name="CHANDALA_YOGA",
        is_present=present,
        strength="STRONG" if present else "WEAK",
        conditions_met=["jupiter_rahu_conjunction"] if present else [],
        cancellation_factors=[],
        dasha_activated=False,
        description_ta="சண்டாள யோகம் — குரு ராகு சேர்க்கை.",
        description_en="Chandala Yoga — Jupiter conjunct Rahu.",
    )


def detect_amala_yoga(planets: dict[str, int], lagna_rasi: int, moon_rasi: int, lagna_nature_map: dict[str, str]) -> YogaResult:
    tenth_lagna = ((lagna_rasi - 1 + 9) % 12) + 1
    tenth_moon = ((moon_rasi - 1 + 9) % 12) + 1
    found = []
    for planet in NATURAL_BENEFICS:
        rasi = planets.get(planet)
        if rasi in {tenth_lagna, tenth_moon}:
            found.append(planet)
    present = len(found) > 0
    return YogaResult(
        name="AMALA_YOGA",
        is_present=present,
        strength="STRONG" if len(found) >= 2 else ("PARTIAL" if present else "WEAK"),
        conditions_met=[f"{planet}_in_10th" for planet in found],
        cancellation_factors=[],
        dasha_activated=any(lagna_nature_map.get(planet, "") in {"YOGAKARAKA", "TRIKONA"} for planet in found),
        description_ta="அமல யோகம் — லக்னம்/சந்திரத்திலிருந்து 10ஆம் இடத்தில் சுபகிரகங்கள்.",
        description_en="Amala Yoga — benefics in the 10th from Lagna or Moon.",
    )


def detect_adhi_yoga(planets: dict[str, int], moon_rasi: int, lagna_nature_map: dict[str, str]) -> YogaResult:
    target_houses = {6, 7, 8}
    coverage = set()
    for planet in {"JUPITER", "VENUS", "MERCURY"}:
        rasi = planets.get(planet)
        if rasi is None:
            continue
        h = house_from_reference(moon_rasi, rasi)
        if h in target_houses:
            coverage.add(h)
    count = len(coverage)
    return YogaResult(
        name="ADHI_YOGA",
        is_present=count > 0,
        strength="STRONG" if count == 3 else ("PARTIAL" if count == 2 else ("WEAK" if count == 1 else "WEAK")),
        conditions_met=[f"benefic_in_house_{h}_from_moon" for h in sorted(coverage)],
        cancellation_factors=[],
        dasha_activated=any(lagna_nature_map.get(p, "") in {"YOGAKARAKA", "TRIKONA"} for p in {"JUPITER", "VENUS", "MERCURY"}),
        description_ta="அதி யோகம் — சந்திரனிலிருந்து 6/7/8இல் சுபகிரக ஆதரவு.",
        description_en="Adhi Yoga — benefics in 6th/7th/8th from Moon.",
    )


def detect_daridra_yoga(planets: dict[str, int], lagna_rasi: int, planet_scores: dict[str, int]) -> YogaResult:
    eleventh_lord = _house_lord(lagna_rasi, 11)
    eleventh_rasi = planets.get(eleventh_lord, lagna_rasi)
    eleventh_house = house_from_reference(lagna_rasi, eleventh_rasi)
    weak = planet_scores.get(eleventh_lord, 50) < 40
    malefic_conj = any(
        planets.get(m) == eleventh_rasi for m in NATURAL_MALEFICS if m != eleventh_lord
    )
    present = eleventh_house in {6, 8, 12} or (weak and malefic_conj)
    return YogaResult(
        name="DARIDRA_YOGA",
        is_present=present,
        strength="STRONG" if present and eleventh_house in {6, 8, 12} else ("PARTIAL" if present else "WEAK"),
        conditions_met=[f"eleventh_lord_in_{eleventh_house}", "eleventh_lord_weak_malefic_conj"] if present else [],
        cancellation_factors=[],
        dasha_activated=False,
        description_ta="தரித்ர யோகம் — 11ஆம் அதிபதி துஷ்டானத்தில்/பலஹீனம்.",
        description_en="Daridra Yoga — 11th lord in dusthana or weak with malefics.",
    )


def detect_lakshmi_yoga(planets: dict[str, int], lagna_rasi: int, planet_scores: dict[str, int]) -> YogaResult:
    ninth_lord = _house_lord(lagna_rasi, 9)
    lagna_lord = _house_lord(lagna_rasi, 1)
    ninth_house = house_from_reference(lagna_rasi, planets.get(ninth_lord, lagna_rasi))
    ninth_strong = planet_scores.get(ninth_lord, 50) >= 60 and ninth_house in KENDRA_HOUSES | TRIKONA_HOUSES
    lagna_strong = planet_scores.get(lagna_lord, 50) >= 60
    present = ninth_strong and lagna_strong
    return YogaResult(
        name="LAKSHMI_YOGA",
        is_present=present,
        strength="STRONG" if present else "WEAK",
        conditions_met=[f"ninth_lord_{ninth_lord}_strong", f"lagna_lord_{lagna_lord}_strong"] if present else [],
        cancellation_factors=[],
        dasha_activated=False,
        description_ta="லக்ஷ்மி யோகம் — 9ஆம் அதிபதி வலிமை + லக்ன அதிபதி வலிமை.",
        description_en="Lakshmi Yoga — strong 9th lord and strong Lagna lord.",
    )


_SUNAPHA_ANAPHA_EXCLUDED = frozenset({"SUN", "MOON", "RAHU", "KETU", "MANDHI"})


def detect_sunapha_anapha_durudhura(planets: dict[str, int], moon_rasi: int) -> list[YogaResult]:
    # Classical: formed by planets OTHER THAN the Sun in the 2nd/12th from
    # Moon. Nodes (Rahu/Ketu) never form these; Moon is the reference point,
    # not a candidate; Mandhi is an upagraha, not a graha (WI-15). Matches
    # Kemadruma's exclusion pattern in this same file.
    second = ((moon_rasi - 1 + 1) % 12) + 1
    twelfth = ((moon_rasi - 1 - 1) % 12) + 1
    has_second = any(p not in _SUNAPHA_ANAPHA_EXCLUDED and r == second for p, r in planets.items())
    has_twelfth = any(p not in _SUNAPHA_ANAPHA_EXCLUDED and r == twelfth for p, r in planets.items())
    out: list[YogaResult] = []
    if has_second:
        out.append(YogaResult("SUNAPHA_YOGA", True, "PARTIAL", ["planets_in_2nd_from_moon"], [], False, "சுனபா யோகம்.", "Sunapha Yoga."))
    if has_twelfth:
        out.append(YogaResult("ANAPHA_YOGA", True, "PARTIAL", ["planets_in_12th_from_moon"], [], False, "அநபா யோகம்.", "Anapha Yoga."))
    if has_second and has_twelfth:
        out.append(YogaResult("DURUDHURA_YOGA", True, "STRONG", ["planets_in_2nd_and_12th_from_moon"], [], False, "துருதுரா யோகம்.", "Durudhura Yoga."))
    return out


def detect_vasumati_yoga(planets: dict[str, int], moon_rasi: int) -> YogaResult:
    upachaya = {3, 6, 10, 11}
    benefic_hits = []
    for planet in {"JUPITER", "VENUS", "MERCURY", "MOON"}:
        rasi = planets.get(planet)
        if rasi is None:
            continue
        if house_from_reference(moon_rasi, rasi) in upachaya:
            benefic_hits.append(planet)
    present = len(benefic_hits) >= 2
    return YogaResult(
        name="VASUMATI_YOGA",
        is_present=present,
        strength="STRONG" if len(benefic_hits) >= 3 else ("PARTIAL" if present else "WEAK"),
        conditions_met=[f"{p}_upachaya_from_moon" for p in benefic_hits],
        cancellation_factors=[],
        dasha_activated=False,
        description_ta="வசுமதி யோகம் — சுபகிரகங்கள் உபசய ஸ்தானங்களில்.",
        description_en="Vasumati Yoga — benefics in upachaya houses from Moon.",
    )
