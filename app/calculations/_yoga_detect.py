"""Yoga detection functions: Gaja Kesari, Raja, Dhana, Neecha Bhanga, Pancha Mahapurusha, and more."""
from __future__ import annotations

from collections.abc import Iterable, Mapping
from dataclasses import dataclass
from itertools import combinations

from app.calculations._yoga_helpers import (
    DUSTHANA_HOUSES,
    KENDRA_HOUSES,
    NATURAL_MALEFICS,
    TRIKONA_HOUSES,
    PlanetInput,
    YogaResult,
    _house_lord,
    _is_active,
    _planet_rasi,
    _planets_as_rasi_map,
    gate_yoga_strength,
    houses_owned,
)
from app.calculations.aspects import aspects_house, effective_natural_class
from app.calculations.astro import house_from_reference
from app.calculations.chart_strength import (
    _NATURAL_ENEMIES,
    DEBILITATION_RASI,
    EXALTATION_RASI,
    MOOLATRIKONA_ZONE,
    OWN_SIGN_RASI,
    SIGN_LORD,
    neecha_bhanga_cancelled,
)
from app.calculations.doctrine_options import DEFAULT_DOCTRINE, DoctrineOptions
from app.calculations.functional_status import (
    FunctionalStatus,
    functional_status,
    raja_grade,
    raja_participation,
)
from app.calculations.lagna_lord_strength import lagna_lord_strength
from app.calculations.neecha_bhanga import evaluate_neecha_bhanga, strength_for_points

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
    lagna_rasi: int | None = None,
    active_lords: Iterable[str] | None = None,
    planet_scores: Mapping[str, int] | None = None,
    combust_planets: frozenset[str] = frozenset(),
    d9_rasi_map: Mapping[str, int] | None = None,
    d9_lagna_rasi: int | None = None,
    doctrine: DoctrineOptions = DEFAULT_DOCTRINE,
    strict_form_present: bool = False,
) -> YogaResult:
    """DD-01's Raman/base form, on the stable ``GAJA_KESARI_YOGA`` wire key."""
    active = set(active_lords or ())
    jupiter_rasi = _planet_rasi(planets, "JUPITER")
    house = house_from_reference(moon_rasi, jupiter_rasi)
    present = house in KENDRA_HOUSES and not strict_form_present
    strength = "STRONG" if present else "WEAK"
    gate_notes: list[str] = []
    if present:
        strength, gate_notes = gate_yoga_strength(
            strength, ("JUPITER", "MOON"), planet_scores, combust_planets
        )
        if jupiter_rasi == DEBILITATION_RASI["JUPITER"]:
            bhanga = (
                evaluate_neecha_bhanga(
                    "JUPITER",
                    planet_rasi=_planets_as_rasi_map(planets),
                    lagna_rasi=lagna_rasi,
                    d9_rasi_map=d9_rasi_map,
                    d9_lagna_rasi=d9_lagna_rasi,
                    options=doctrine,
                )
                if lagna_rasi is not None
                else None
            )
            if bhanga is not None and bhanga.cancelled:
                gate_notes.append("gaja_base_jupiter_debilitated_with_neecha_bhanga")
                if doctrine.o5_gk_base_nb_guru == "suppressed":
                    present = False
                    strength = "WEAK"
                elif strength == "STRONG":
                    strength = "PARTIAL"
            else:
                # O-5 is specifically the *with-bhanga* case. Without bhanga,
                # the base geometry remains visible but is honestly floored.
                gate_notes.append("gaja_base_jupiter_debilitated_without_neecha_bhanga")
                strength = "WEAK"
    return YogaResult(
        name="GAJA_KESARI_YOGA",
        is_present=present,
        strength=strength,
        conditions_met=["jupiter_in_kendra_from_moon", "gaja_kesari_base_geometry"] if present else [],
        cancellation_factors=gate_notes if present else [],
        dasha_activated=_is_active(active, "JUPITER", "MOON"),
        key_grahas=("JUPITER", "MOON") if present else (),
        description_ta="கஜகேசரி அமைப்பு — சந்திரனிலிருந்து குரு கேந்திரத்தில் உள்ளார்; இதன் பலம் குரு, சந்திரன் இருவரின் நிலையைப் பொறுத்தது.",
        description_en="Gaja Kesari pattern — Jupiter in a Kendra from Moon, graded by Jupiter and Moon condition.",
    )


def detect_gaja_kesari_parashara(
    planets: Mapping[str, PlanetInput],
    lagna_rasi: int,
    moon_rasi: int,
    *,
    active_lords: Iterable[str] | None = None,
    planet_scores: Mapping[str, int] | None = None,
    combust_planets: frozenset[str] = frozenset(),
    paksha_is_shukla: bool | None = None,
    moon_counts_as_support: bool = True,
) -> YogaResult:
    """DD-01 strict form: BPHS 36.3–4 (verse number still to verify).

    Benefic support is chart-dynamic per DD-12. The enemy-sign exclusion uses
    the canonical Parashari natural-enmity table in ``chart_strength`` and
    compares Guru with the lord of the rasi Guru occupies; this is the same
    graha-vs-rasi-lord relationship used by the strength engine.

    O-22: a waxing Moon opposite or beside Guru is a benefic joining/aspecting
    Guru, so read literally the Moon supplies the support for its own yoga.
    ``moon_counts_as_support=False`` requires a benefic other than the Moon.
    """
    active = set(active_lords or ())
    rasi_map = _planets_as_rasi_map(planets)
    jupiter_rasi = rasi_map["JUPITER"]
    from_lagna = house_from_reference(lagna_rasi, jupiter_rasi) in KENDRA_HOUSES
    from_moon = house_from_reference(moon_rasi, jupiter_rasi) in KENDRA_HOUSES
    supporters = tuple(sorted(
        planet
        for planet, rasi in rasi_map.items()
        if planet != "JUPITER"
        and (moon_counts_as_support or planet != "MOON")
        and effective_natural_class(
            planet,
            rasi_map,
            paksha_is_shukla=paksha_is_shukla,
            planet_scores=planet_scores,
        ) == "BENEFIC"
        and (rasi == jupiter_rasi or aspects_house(planet, rasi, jupiter_rasi))
    ))
    debilitated = jupiter_rasi == DEBILITATION_RASI["JUPITER"]
    combust = "JUPITER" in combust_planets
    sign_lord = SIGN_LORD[jupiter_rasi]
    enemy_sign = sign_lord in _NATURAL_ENEMIES["JUPITER"]
    present = (from_lagna or from_moon) and bool(supporters) and not debilitated and not combust and not enemy_sign

    conditions: list[str] = []
    if present:
        if from_lagna:
            conditions.append("jupiter_in_kendra_from_lagna")
        if from_moon:
            conditions.append("jupiter_in_kendra_from_moon")
        conditions.extend(f"jupiter_supported_by_benefic_{planet.lower()}" for planet in supporters)
        conditions.extend(("jupiter_not_debilitated", "jupiter_not_combust", "jupiter_not_in_enemy_sign"))
    strength = "STRONG" if present else "WEAK"
    gate_notes: list[str] = []
    if present:
        strength, gate_notes = gate_yoga_strength(
            strength, ("JUPITER", "MOON"), planet_scores, combust_planets
        )
    return YogaResult(
        name="GAJA_KESARI_PARASHARA",
        is_present=present,
        strength=strength,
        conditions_met=conditions,
        cancellation_factors=gate_notes,
        dasha_activated=_is_active(active, "JUPITER", "MOON"),
        key_grahas=("JUPITER", "MOON") if present else (),
        description_ta="கஜகேசரி யோகம் — குரு கேந்திரத்தில் இருந்து சுபகிரக ஆதரவு பெற்று, நீசம், அஸ்தங்கம், பகை ராசி இன்றி உள்ளது.",
        description_en="Gaja Kesari Yoga — Jupiter is in a Kendra from Lagna or Moon, supported by a benefic, and free of debility, combustion and an enemy sign.",
    )


def raja_lord_sets(
    lagna_rasi: int, doctrine: DoctrineOptions = DEFAULT_DOCTRINE
) -> tuple[set[str], set[str]]:
    """Kendra and trikona lords eligible to form a Raja Yoga for this lagna,
    read from the functional-status rule table (`raja_participation`, DD-07)."""
    kendra: set[str] = set()
    trikona: set[str] = set()
    for planet in ("SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN"):
        part = raja_participation(lagna_rasi, planet, doctrine)
        if not part.eligible:
            continue
        if part.kendra_lord:
            kendra.add(planet)
        if part.trikona_lord:
            trikona.add(planet)
    return kendra, trikona


def _nodes_with(planets: Mapping[str, PlanetInput], *rasis: int) -> tuple[str, ...]:
    """Rahu/Ketu sharing a sign with a forming lord — supporting, never forming
    (ruling 2026-09-23; revisit under the Rahu/Ketu doctrine section)."""
    return tuple(n for n in ("RAHU", "KETU") if n in planets and _planet_rasi(planets, n) in rasis)


def detect_raja_yogakaraka(
    planets: Mapping[str, PlanetInput],
    lagna_rasi: int,
    *,
    active_lords: Iterable[str] | None = None,
    planet_scores: Mapping[str, int] | None = None,
    combust_planets: frozenset[str] = frozenset(),
    d9_rasi_map: Mapping[str, int] | None = None,
    d9_lagna_rasi: int | None = None,
    doctrine: DoctrineOptions = DEFAULT_DOCTRINE,
) -> YogaResult:
    """The yogakaraka graha: one graha owning both a kendra (4/7/10) and a
    trikona (5/9), and how strongly it can deliver.

    The graha is the one holding `DUAL_LORD_YOGAKARAKA` in the functional-status
    matrix (DD-07) — six lagnas have one. House 1 never counts on either side.

    Astrologer ruling 2026-10-01: this card reports the yogakaraka *planet* and
    its *strength*. Ownership alone makes a graha the yogakaraka; it does not by
    itself create a separate Raja Yoga, so the card is named "Yogakaraka planet"
    on every surface. The wire key `YOGAKARAKA_RAJA_YOGA` is kept unchanged as a
    stable identifier (API contract); it is not a claim. `detect_raja_yoga`'s
    different-graha pairing is untouched. The lagna lord is not a yogakaraka
    here: no lagna lord owns the 5th or 9th.

    Ownership alone establishes it (owner ruling on the native-Tamil review,
    2026-09-23, superseding the first-pass dignity gate). Debilitation,
    combustion or a 6th/8th/12th placement lowers it one rung — however many of
    them apply — and never removes it. Each is recorded in `conditions_met`, not
    `cancellation_factors`, so the card reads "Moderate", not "Cancelled".

    Neecha Bhanga (ruling 2026-10-01, option B): when the canonical predicate
    `neecha_bhanga_cancelled` holds for the yogakaraka, the *debility* no longer
    costs the rung, and `<graha>_yogakaraka_neecha_bhanga` records why. Its other
    afflictions (combustion, a 6/8/12 placement) still lower it. A valid bhanga
    never restores STRONG on its own.
    """
    active = set(active_lords or ())
    for planet in ("SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN"):
        if FunctionalStatus.DUAL_LORD_YOGAKARAKA not in functional_status(lagna_rasi, planet):
            continue
        if planet not in planets:
            continue
        owned = houses_owned(lagna_rasi, planet)
        rasi = _planet_rasi(planets, planet)
        house = house_from_reference(lagna_rasi, rasi)
        debilitated = rasi == DEBILITATION_RASI.get(planet)
        # Same predicate as the Neecha Bhanga card and the +14 strength term,
        # so the three can never disagree about whether the debility stands.
        bhanga = debilitated and neecha_bhanga_cancelled(
            planet,
            planet_rasi=_planets_as_rasi_map(planets),
            lagna_rasi=lagna_rasi,
            d9_rasi_map=d9_rasi_map,
            d9_lagna_rasi=d9_lagna_rasi,
            options=doctrine,
        )[0]
        afflictions = [
            reason for reason, applies in (
                (f"{planet.lower()}_yogakaraka_debilitated", debilitated and not bhanga),
                (f"{planet.lower()}_yogakaraka_combust", planet in combust_planets),
                (f"{planet.lower()}_yogakaraka_in_dusthana_{house}", house in DUSTHANA_HOUSES),
            ) if applies
        ]
        notes = [f"{planet.lower()}_yogakaraka_neecha_bhanga"] if bhanga else []
        # Combustion is already one of the afflictions, so the score gate must
        # not count it a second time.
        strength, gate_notes = gate_yoga_strength(
            "PARTIAL" if afflictions else "STRONG", (planet,), planet_scores,
        )
        houses = "_".join(str(h) for h in sorted(owned))
        return YogaResult(
            name="YOGAKARAKA_RAJA_YOGA",
            is_present=True,
            strength=strength,
            conditions_met=[f"{planet.lower()}_yogakaraka_owns_{houses}", *afflictions, *notes],
            cancellation_factors=gate_notes,
            dasha_activated=_is_active(active, planet),
            key_grahas=(planet,),
            description_ta="யோககாரக கிரகம்: ஒரே கிரகம் ஒரு கேந்திரத்திற்கும் ஒரு திரிகோணத்திற்கும் அதிபதியாக உள்ளது.",
            description_en="Yogakaraka planet: one graha lords both a kendra and a trikona.",
        )
    return YogaResult(
        name="YOGAKARAKA_RAJA_YOGA",
        is_present=False,
        strength="WEAK",
        conditions_met=[],
        cancellation_factors=[],
        dasha_activated=False,
        description_ta="இந்த லக்னத்திற்கு யோககாரக கிரகம் இல்லை.",
        description_en="This lagna has no yogakaraka graha.",
    )


def detect_raja_yoga(
    planets: Mapping[str, PlanetInput],
    lagna_rasi: int,
    *,
    active_lords: Iterable[str] | None = None,
    planet_scores: Mapping[str, int] | None = None,
    combust_planets: frozenset[str] = frozenset(),
    doctrine: DoctrineOptions = DEFAULT_DOCTRINE,
) -> list[YogaResult]:
    """Kendra–trikona Raja Yoga — DOCTRINE_DECISIONS v1.3, DD-07.

    The lordship relationship is necessary, not sufficient: each participant
    must be eligible in the functional-status rule table (`raja_participation`).
    The link here is a conjunction or a **mutual** aspect; the exchange form is
    added by the facade. A one-way special aspect (audit L-3) links only under
    O-15. Each instance records a Tier C grade, `raja_grade_full`/`_qualified`/
    `_mixed`, read from both participants' lordships.
    """
    active = set(active_lords or ())
    kendra_lords, trikona_lords = raja_lord_sets(lagna_rasi, doctrine)

    results: list[YogaResult] = []
    for trikona_lord in sorted(trikona_lords):
        for kendra_lord in sorted(kendra_lords):
            if trikona_lord == kendra_lord:
                continue
            trikona_rasi = _planet_rasi(planets, trikona_lord)
            kendra_rasi = _planet_rasi(planets, kendra_lord)
            t_sees_k = aspects_house(trikona_lord, trikona_rasi, kendra_rasi)
            k_sees_t = aspects_house(kendra_lord, kendra_rasi, trikona_rasi)
            linked = (
                trikona_rasi == kendra_rasi
                or (t_sees_k and k_sees_t)
                or (doctrine.o15_raja_one_way_aspect and (t_sees_k or k_sees_t))
            )
            if linked:
                strength, gate_notes = gate_yoga_strength(
                    "STRONG", (trikona_lord, kendra_lord), planet_scores, combust_planets
                )
                grade = raja_grade(lagna_rasi, trikona_lord, kendra_lord)
                results.append(
                    YogaResult(
                        name="RAJA_YOGA",
                        is_present=True,
                        strength=strength,
                        conditions_met=[f"{trikona_lord}_{kendra_lord}_link", f"raja_grade_{grade.lower()}"],
                        cancellation_factors=gate_notes,
                        dasha_activated=_is_active(active, trikona_lord, kendra_lord),
                        # Astrologer ruling 2026-09-23: a Raja Yoga activates on
                        # the lords that form *this* instance, not a fixed list
                        # and not every kendra/trikona lord in the chart.
                        key_grahas=(trikona_lord, kendra_lord),
                        supporting_grahas=_nodes_with(planets, trikona_rasi, kendra_rasi),
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
    # YOG-DN-01 ruling (2026-08-28): the classical card carries only the two
    # sourced conditions (conjunction, exchange). The third — "both wealth
    # lords in a kendra/trikona" — has no classical parent and is split into
    # its own `[PRODUCT]` card by `detect_dhana_yoga_supportive` below, so a
    # Vinaadi proxy never reads as though it were BPHS dhana yoga.
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

    present = len(conditions) > 0
    base_strength = "STRONG" if present else "WEAK"
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
        description_ta="2ம் மற்றும் 11ம் அதிபதிகளின் சேர்க்கை/பரிவர்த்தனை தனயோகமாக கருதப்படுகிறது.",
        description_en="A conjunction or exchange between the 2nd and 11th lords is treated as classical Dhana Yoga.",
    )


def detect_dhana_yoga_supportive(
    planets: Mapping[str, PlanetInput],
    lagna_rasi: int,
    *,
    active_lords: Iterable[str] | None = None,
    planet_scores: Mapping[str, int] | None = None,
    combust_planets: frozenset[str] = frozenset(),
) -> YogaResult:
    """YOG-DN-02: Vinaadi's own proxy — both wealth lords well placed, with no
    classical parent. Kept, but split off DHANA_YOGA per the 2026-08-28 ruling
    so it never folds in under the classical name."""
    active = set(active_lords or ())
    second_lord = _house_lord(lagna_rasi, 2)
    eleventh_lord = _house_lord(lagna_rasi, 11)
    second_rasi = _planet_rasi(planets, second_lord)
    eleventh_rasi = _planet_rasi(planets, eleventh_lord)
    second_house = house_from_reference(lagna_rasi, second_rasi)
    eleventh_house = house_from_reference(lagna_rasi, eleventh_rasi)
    present = second_house in KENDRA_HOUSES | TRIKONA_HOUSES and eleventh_house in KENDRA_HOUSES | TRIKONA_HOUSES
    conditions = ["both_lords_in_strong_houses"] if present else []
    strength, gate_notes = gate_yoga_strength(
        "PARTIAL" if present else "WEAK", (second_lord, eleventh_lord), planet_scores, combust_planets
    )
    return YogaResult(
        name="DHANA_SUPPORTIVE_YOGA",
        is_present=present,
        strength=strength,
        conditions_met=conditions,
        cancellation_factors=gate_notes,
        dasha_activated=_is_active(active, second_lord, eleventh_lord),
        description_ta="தன யோகம் (துணை) — 2ம்/11ம் அதிபதிகள் இருவரும் கேந்திர/திரிகோணத்தில் — வினாடி அளவுகோல், பாரம்பரிய யோகம் அல்ல.",
        description_en="Dhana Yoga (supportive) — both the 2nd and 11th lords stand in a kendra or trikona. A Vinaadi proxy, not a classical dhana yoga.",
    )


def detect_neecha_bhanga(
    planets: Mapping[str, PlanetInput],
    lagna_rasi: int,
    *,
    active_lords: Iterable[str] | None = None,
    retrograde_planets: frozenset[str] = frozenset(),
    d9_rasi_map: Mapping[str, int] | None = None,
    d9_lagna_rasi: int | None = None,
    doctrine: DoctrineOptions = DEFAULT_DOCTRINE,
) -> list[YogaResult]:
    """Neecha Bhanga Raja Yoga — DOCTRINE_DECISIONS v1.3, DD-09.

    One result per debilitated graha. The rules live in `neecha_bhanga`, one
    row per Phaladeepika verse; each one that fires is recorded by its own
    marker, so the card names the verse rather than a count. Any single rule
    cancels the debility — there is no "any two" threshold. The card carries the
    raja-yoga name only when a firing verse states a raja-yoga result (O-13).

    Strength grows with the number of distinct conditions (Tier C): one
    condition reads "Mild", because with "any one" this fires on many charts and
    must never read as a bare "You have Raja Yoga".
    """
    active = set(active_lords or ())
    planets_rasi = _planets_as_rasi_map(planets)
    results: list[YogaResult] = []

    for planet, debilitation_rasi in DEBILITATION_RASI.items():
        if planets_rasi.get(planet) != debilitation_rasi:
            continue

        # The same evaluator `chart_strength.neecha_bhanga_cancelled` wraps, so
        # the card and the +14 bhanga strength term agree (audit C2).
        evaluation = evaluate_neecha_bhanga(
            planet,
            planet_rasi=planets_rasi,
            lagna_rasi=lagna_rasi,
            d9_rasi_map=d9_rasi_map,
            d9_lagna_rasi=d9_lagna_rasi,
            options=doctrine,
        )
        present = evaluation.gives_raja_yoga(doctrine)
        conditions = ["planet_debilitated", *evaluation.markers]
        # Retrograde is a supporting note only — it never on its own flips a
        # debilitated planet to "present"; O-11 has a separate detector.
        if planet in retrograde_planets:
            conditions.append("debilitated_planet_retrograde_note")

        results.append(
            YogaResult(
                name="NEECHA_BHANGA_RAJA_YOGA",
                is_present=present,
                strength=strength_for_points(evaluation.grade_points) if present else "WEAK",
                conditions_met=conditions,
                cancellation_factors=[],
                dasha_activated=_is_active(active, planet),
                # DD-15: the debilitated graha is the primary activator; the
                # grahas that produced the bhanga are secondary.
                key_grahas=(planet,),
                secondary_grahas=evaluation.cancelling_grahas if present else (),
                description_ta="நீச கிரகத்திற்கு நிவர்த்தி நிபந்தனைகள் சேர்ந்தால் நீசபங்க ராஜயோகம்.",
                description_en="Neecha Bhanga Raja Yoga is considered when a debilitated planet has cancellation conditions.",
            )
        )

    return results


def detect_retrograde_debilitated_raja_yoga(
    planets: Mapping[str, PlanetInput],
    lagna_rasi: int,
    *,
    active_lords: Iterable[str] | None = None,
    retrograde_planets: frozenset[str] = frozenset(),
    combust_planets: frozenset[str] = frozenset(),
    doctrine: DoctrineOptions = DEFAULT_DOCTRINE,
) -> list[YogaResult]:
    # O-11 candidate as a separate rule, off by default. The verse's "bright
    # rays" condition is translated explicitly as non-combust until ruled.
    if not doctrine.o11_retrograde_debilitated_raja_yoga:
        return []
    active = set(active_lords or ())
    planet_rasis = _planets_as_rasi_map(planets)
    results: list[YogaResult] = []
    for planet, debilitation_rasi in DEBILITATION_RASI.items():
        if planet_rasis.get(planet) != debilitation_rasi:
            continue
        house = house_from_reference(lagna_rasi, debilitation_rasi)
        if planet not in retrograde_planets or planet in combust_planets or house in {6, 8, 12}:
            continue
        results.append(YogaResult(
            name="RETROGRADE_DEBILITATED_RAJA_YOGA",
            is_present=True,
            strength="STRONG",
            conditions_met=[
                "planet_debilitated",
                "debilitated_planet_retrograde",
                "bright_rays_engine_non_combust",
                "debilitated_planet_outside_dusthana",
            ],
            cancellation_factors=[],
            dasha_activated=_is_active(active, planet),
            key_grahas=(planet,),
            description_ta=(
                "நீச கிரகம் வக்ரகதியில், அஸ்தங்கம் இன்றி, 6/8/12 "
                "அல்லாத வீட்டில் இருப்பதற்கான தனி ராஜயோக விதி."
            ),
            description_en=(
                "A separate raja-yoga rule for a debilitated, retrograde, non-combust "
                "planet placed outside houses 6, 8 and 12."
            ),
        ))
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
        # Own-dusthana (lord_house == house_num) counts too (M-4): the
        # 6th/8th/12th lord in its own house is exactly the canonical
        # Harsha/Sarala/Vimala yogas, not just cross-dusthana placements —
        # this project follows the inclusive school rather than gating
        # own-house on strength.
        if lord_house in dusthana:
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
    # Maha-parivartana houses (L-2): classical Maha grade is a dhana-house
    # exchange — kendra {1,4,7,10}, trikona {1,5,9}, PLUS the 2nd and 11th
    # (dhana/labha) — not kendra/trikona alone. A 2<->11 exchange must grade
    # MAHA/STRONG, not KAHALA/WEAK.
    maha_houses = {1, 2, 4, 5, 7, 9, 10, 11}
    dusthana = {6, 8, 12}
    results: list[ParivartanaResult] = []
    planet_list = [p for p in ("SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN") if p in planets]
    for p1, p2 in combinations(planet_list, 2):
        p1_rasi = _planet_rasi(planets, p1)
        p2_rasi = _planet_rasi(planets, p2)
        if SIGN_LORD.get(p1_rasi) == p2 and SIGN_LORD.get(p2_rasi) == p1:
            p1_house = house_from_reference(lagna_rasi, p1_rasi)
            p2_house = house_from_reference(lagna_rasi, p2_rasi)
            both_kt = p1_house in maha_houses and p2_house in maha_houses
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
            # DD-15: both exchanging lords activate (SOURCE_INFERRED).
            key_grahas=(pv.planet_a, pv.planet_b),
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
    all_key_grahas: list[str] = []
    all_supporting: list[str] = []
    all_secondary: list[str] = []
    groups: list[tuple[str, ...]] = []
    dasha_activated = False
    for r in results:
        all_conditions.extend(r.conditions_met)
        all_cancellations.extend(r.cancellation_factors)
        all_key_grahas.extend(r.key_grahas)
        all_supporting.extend(r.supporting_grahas)
        all_secondary.extend(r.secondary_grahas)
        groups.extend(r.former_groups or ((r.key_grahas,) if r.key_grahas else ()))
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
        # A merged card activates on the union of its parts' key grahas —
        # dropping them here would silently re-dormant-cap any merged yoga.
        key_grahas=tuple(dict.fromkeys(all_key_grahas)),
        former_groups=tuple(dict.fromkeys(groups)),
        supporting_grahas=tuple(dict.fromkeys(all_supporting)),
        secondary_grahas=tuple(g for g in dict.fromkeys(all_secondary) if g not in all_key_grahas),
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
    formed = len(surrounding) == 0

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
    cancellation_factors = [name for name, ok in cancellation_checks if formed and ok]

    # `planet_kendra_from_moon` is a FULL bhanga on its own, not a graded one.
    # Classical authority is explicit and unconditional here (BPHS, Phaladeepika):
    # a graha in a kendra from the Moon destroys Kemadruma outright. Grading it
    # to PARTIAL produced a self-contradicting reading — Jupiter in a kendra from
    # the Moon forms Gaja Kesari, so the chart reported Gaja Kesari and Kemadruma
    # as simultaneously active, which cannot happen. The remaining three factors
    # stay graded (1 -> PARTIAL, 2+ -> WEAK); they are mitigating, not annulling.
    full_bhanga = "planet_kendra_from_moon" in cancellation_factors

    # YOG-KD-01 ruling (2026-08-28): "Bhanga mandatory before display" — a
    # full bhanga must cancel the card outright, not just soften its strength.
    # Before this, a fully cancelled Kemadruma still reported `is_present=True`
    # at WEAK, which read to a user as present. The three graded (non-full)
    # factors keep softening rather than cancelling, matching Sakata's posture.
    present = formed and not full_bhanga

    if not formed:
        strength = "WEAK"
    elif full_bhanga or len(cancellation_factors) >= 2:
        strength = "WEAK"
    elif len(cancellation_factors) == 1:
        strength = "PARTIAL"
    else:
        strength = "STRONG"

    return YogaResult(
        name="KEMADRUMA_YOGA",
        is_present=present,
        strength=strength,
        conditions_met=["no_planets_2nd_12th_from_moon"] if formed else [],
        cancellation_factors=cancellation_factors,
        dasha_activated=False,
        description_ta="கேமத்ரும யோகம் — சந்திரனைச் சுற்றி 2/12இல் கிரக ஆதரவு இல்லாமை. நான்கு பங்க விதிகள் ஆராயப்படுகின்றன: லக்னத்திலிருந்து சந்திரன் கேந்திரத்தில், சந்திரனிலிருந்து ஒரு கிரகம் கேந்திரத்தில், குரு பார்வை சந்திரன் மீது, முழு நிலவு (சூரியனுக்கு எதிரே).",
        description_en="Kemadruma Yoga — absence of planets in 2nd/12th from Moon. Checked against four classical cancellation (bhanga) rules: Moon in a kendra from Lagna, any planet in a kendra from Moon, Jupiter's aspect on Moon, and a full Moon (opposite the Sun).",
    )


def detect_kartari_yoga(
    planets: dict[str, int], target_rasi: int, target_label: str = "LAGNA", *,
    paksha_is_shukla: bool | None = None,
    planet_scores: Mapping[str, int] | None = None,
) -> YogaResult:
    """Papa/Shubha Kartari Yoga — a house 'hemmed' by malefics (Papa, afflicting)
    or benefics (Shubha, protective) placed in the 2nd and 12th signs from it."""
    second = ((target_rasi - 1 + 1) % 12) + 1
    twelfth = ((target_rasi - 1 - 1) % 12) + 1

    second_occupants = [planet for planet, rasi in planets.items() if rasi == second]
    twelfth_occupants = [planet for planet, rasi in planets.items() if rasi == twelfth]

    def natural_class(planet: str) -> str:
        return effective_natural_class(
            planet, planets, paksha_is_shukla=paksha_is_shukla, planet_scores=planet_scores
        )

    second_has_malefic = any(natural_class(planet) == "MALEFIC" for planet in second_occupants)
    second_has_benefic = any(natural_class(planet) == "BENEFIC" for planet in second_occupants)
    twelfth_has_malefic = any(natural_class(planet) == "MALEFIC" for planet in twelfth_occupants)
    twelfth_has_benefic = any(natural_class(planet) == "BENEFIC" for planet in twelfth_occupants)

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
    # DD-15: the hemming planets are primary (SOURCE_INFERRED); the lord of the
    # hemmed sign is secondary by Vinaadi convention.
    hemmers = tuple(dict.fromkeys(p for p in (*second_occupants, *twelfth_occupants) if p != "MANDHI"))
    hemmed_lord = SIGN_LORD[target_rasi]
    return YogaResult(
        name=name,
        is_present=is_present,
        strength="STRONG" if is_present else "WEAK",
        conditions_met=conditions_met,
        cancellation_factors=[],
        dasha_activated=False,
        key_grahas=hemmers if is_present else (),
        secondary_grahas=(hemmed_lord,) if is_present and hemmed_lord not in hemmers else (),
        description_ta=description_ta,
        description_en=description_en,
    )


def _node_yoga_activators(node: str, node_rasi: int) -> tuple[tuple[str, ...], tuple[str, ...]]:
    """DD-15 for a Guru–node yoga: Guru and the node are primary; the node's
    dispositor is secondary (BPHS: a node gives the results of its sign lord)."""
    dispositor = SIGN_LORD[node_rasi]
    secondary = () if dispositor == "JUPITER" else (dispositor,)
    return ("JUPITER", node), secondary


def detect_chandala_yoga(jupiter_rasi: int, rahu_rasi: int) -> YogaResult:
    present = jupiter_rasi == rahu_rasi
    key, secondary = _node_yoga_activators("RAHU", rahu_rasi)
    return YogaResult(
        name="CHANDALA_YOGA",
        is_present=present,
        strength="STRONG" if present else "WEAK",
        conditions_met=["jupiter_rahu_conjunction"] if present else [],
        cancellation_factors=[],
        dasha_activated=False,
        key_grahas=key if present else (),
        secondary_grahas=secondary if present else (),
        description_ta="சண்டாள யோகம் — குரு ராகு சேர்க்கை.",
        description_en="Chandala Yoga — Jupiter conjunct Rahu.",
    )


def detect_chandala_yoga_ketu_variant(jupiter_rasi: int, ketu_rasi: int) -> YogaResult:
    """YOG-CH-02 (2026-08-28 ruling): Guru+Ketu is a separate `[VARIANT]` card,
    not the same yoga as Guru+Rahu — some schools form Guru Chandala with
    either node, but the Ketu form must not read as `CHANDALA_YOGA` itself."""
    present = jupiter_rasi == ketu_rasi
    key, secondary = _node_yoga_activators("KETU", ketu_rasi)
    return YogaResult(
        name="CHANDALA_KETU_YOGA",
        is_present=present,
        strength="STRONG" if present else "WEAK",
        conditions_met=["jupiter_ketu_conjunction"] if present else [],
        cancellation_factors=[],
        dasha_activated=False,
        key_grahas=key if present else (),
        secondary_grahas=secondary if present else (),
        description_ta="சண்டாள யோகம் (குரு-கேது வேறுபாடு) — சில பாரம்பரியங்கள் மட்டும் ஏற்கும் வடிவம்.",
        description_en="Chandala Yoga — Jupiter conjunct Ketu, a variant recognised by some schools; distinct from the Guru-Rahu form.",
    )


#: The one malefic set Amala reads, for BOTH its tests: Budhan loses benefic
#: status when one of these shares its sign, and one of these casting poorna
#: drishti on an occupied 10th weakens the yoga (ruling 2026-09-23, second
#: amendment — one list so the two tests cannot drift apart again).
#: Suriya is out: karaka of the 10th with dig bala there, and only a mild
#: malefic. Mandhi is in: the project grants it the 7th aspect (`EC-A21`,
#: `aspects.ASPECT_HOUSES`), and the ruling asked for consistency with that.
#: The nodes are in under the node-aspect choice `CORE-10`.
AMALA_AFFLICTING_MALEFICS: frozenset[str] = frozenset({"SATURN", "MARS", "RAHU", "KETU", "MANDHI"})


def detect_amala_yoga(
    planets: dict[str, int], lagna_rasi: int, moon_rasi: int, lagna_nature_map: dict[str, str], *,
    paksha_is_shukla: bool | None = None,
) -> YogaResult:
    tenth_lagna = ((lagna_rasi - 1 + 9) % 12) + 1
    tenth_moon = ((moon_rasi - 1 + 9) % 12) + 1
    tenths = {tenth_lagna, tenth_moon}
    # Ruling 2026-09-23: Guru, Sukran and Budhan — Budhan only when no member of
    # `AMALA_AFFLICTING_MALEFICS` shares its sign; Chandran never. Suriya is
    # deliberately NOT an afflictor (amendment, same day): Budhan is never more
    # than ~28° from Suriya, Budha-Aditya is itself auspicious, and combustion
    # is judged separately — counting Suriya would double-penalise.
    found = []
    for planet in ("JUPITER", "VENUS", "MERCURY"):
        rasi = planets.get(planet)
        if rasi not in tenths:
            continue
        if planet == "MERCURY" and any(planets.get(m) == rasi for m in AMALA_AFFLICTING_MALEFICS):
            continue
        found.append(planet)
    present = len(found) > 0
    strength = "STRONG" if len(found) >= 2 else ("PARTIAL" if present else "WEAK")
    # Malefic drishti on an occupied 10th weakens by one rung, never removes:
    # presence and quality stay separate. Same set as the Budhan test above.
    # Recorded in conditions_met, not cancellation_factors, because a WEAK card
    # with cancellation factors reads as "Cancelled" — which is exactly what the
    # ruling said this is not.
    occupied = {planets[p] for p in found}
    aspecting = sorted(
        m for m in AMALA_AFFLICTING_MALEFICS
        if m in planets and any(aspects_house(m, planets[m], t) for t in occupied)
    )
    if present and aspecting:
        strength = "PARTIAL" if strength == "STRONG" else "WEAK"
    return YogaResult(
        name="AMALA_YOGA",
        is_present=present,
        strength=strength,
        conditions_met=[f"{planet}_in_10th" for planet in found]
        + ([f"malefic_aspect_on_10th_{m.lower()}" for m in aspecting] if present else []),
        cancellation_factors=[],
        # Was a functional-nature test (a benefic here lords a trikona), which
        # reads no dasha at all yet surfaced as "Dasha activated" for life.
        # Astrologer ruling 2026-09-23: the triggers are the benefics *occupying*
        # the 10th — not the 10th lord. The running-dasha check against them is
        # made in `_chart_build._dasha_activated`, which reads `key_grahas`.
        dasha_activated=False,
        key_grahas=tuple(found),
        description_ta="அமல யோகம் — லக்னம்/சந்திரனிலிருந்து 10ஆம் இடத்தில் சுபகிரகங்கள்.",
        description_en="Amala Yoga — benefics in the 10th from Lagna or Moon.",
    )


@dataclass(frozen=True, slots=True)
class _AdhiContext:
    benefic_hits: tuple[tuple[str, int], ...]
    malefic_hits: tuple[tuple[str, int], ...]
    malefic_aspectors: tuple[str, ...]
    purity: str


def _adhi_context(
    planets: Mapping[str, int],
    moon_rasi: int,
    *,
    paksha_is_shukla: bool | None,
    planet_scores: Mapping[str, int] | None,
    include_malefic_aspects: bool,
) -> _AdhiContext:
    """One computation shared by DD-08's base and raja-grade detectors."""
    target_houses = frozenset({6, 7, 8})
    benefic_hits: list[tuple[str, int]] = []
    for planet in ("JUPITER", "VENUS", "MERCURY"):
        rasi = planets.get(planet)
        if rasi is None or house_from_reference(moon_rasi, rasi) not in target_houses:
            continue
        if effective_natural_class(
            planet, planets, paksha_is_shukla=paksha_is_shukla, planet_scores=planet_scores
        ) == "BENEFIC":
            benefic_hits.append((planet, house_from_reference(moon_rasi, rasi)))

    malefic_hits: list[tuple[str, int]] = []
    for planet, rasi in planets.items():
        house = house_from_reference(moon_rasi, rasi)
        if house not in target_houses:
            continue
        if effective_natural_class(
            planet, planets, paksha_is_shukla=paksha_is_shukla, planet_scores=planet_scores
        ) == "MALEFIC":
            malefic_hits.append((planet, house))

    aspectors: set[str] = set()
    if include_malefic_aspects:
        forming_rasis = {planets[planet] for planet, _house in benefic_hits}
        for planet, rasi in planets.items():
            if effective_natural_class(
                planet, planets, paksha_is_shukla=paksha_is_shukla, planet_scores=planet_scores
            ) != "MALEFIC":
                continue
            if any(aspects_house(planet, rasi, target) for target in forming_rasis):
                aspectors.add(planet)

    contamination = len(malefic_hits)
    purity = "PURE" if contamination == 0 else ("MIXED" if contamination == 1 else "ADVERSE")
    return _AdhiContext(tuple(benefic_hits), tuple(malefic_hits), tuple(sorted(aspectors)), purity)


def _lower_yoga_strength(strength: str, steps: int) -> str:
    rank = {"WEAK": 0, "PARTIAL": 1, "STRONG": 2}[strength]
    return {0: "WEAK", 1: "PARTIAL", 2: "STRONG"}[max(0, rank - steps)]


def detect_adhi_base(
    planets: dict[str, int], moon_rasi: int, lagna_nature_map: dict[str, str], *,
    paksha_is_shukla: bool | None = None,
    planet_scores: Mapping[str, int] | None = None,
    combust_planets: frozenset[str] = frozenset(),
    moon_secondary: bool = True,
    raja_grade_present: bool = False,
) -> YogaResult:
    """DD-08 base form, preserving verse/commentary/Raman provenance markers.

    When the raja-grade candidate forms, it carries the label and the base card
    stays absent — one Adhi card per chart, as DD-01 does for Gaja Kesari.
    """
    _ = lagna_nature_map
    context = _adhi_context(
        planets,
        moon_rasi,
        paksha_is_shukla=paksha_is_shukla,
        planet_scores=planet_scores,
        include_malefic_aspects=False,
    )
    count = len(context.benefic_hits)
    present = count >= 1 and not raja_grade_present
    base_strength = "STRONG" if count == 3 else ("PARTIAL" if count == 2 else "WEAK")
    weak_formers = [p for p, _h in context.benefic_hits if (planet_scores or {}).get(p, 50) < 45]
    combust_formers = [p for p, _h in context.benefic_hits if p in combust_planets]
    moon_weak = (planet_scores or {}).get("MOON", 50) < 45
    penalties = int(bool(weak_formers)) + int(bool(combust_formers)) + int(bool(context.malefic_hits)) + int(moon_weak)
    strength = _lower_yoga_strength(base_strength, penalties) if present else "WEAK"
    conditions = []
    if present:
        conditions = [
            "adhi_base_geometry",
            "adhi_distribution_interpretation",
            f"adhi_benefic_count_{count}",
            f"adhi_purity_{context.purity.lower()}",
            *[f"{p}_in_house_{h}_from_moon" for p, h in context.benefic_hits],
            *[f"adhi_benefic_strength_{p.lower()}_{(planet_scores or {}).get(p, 50)}" for p, _h in context.benefic_hits],
            *(["adhi_single_planet_sufficiency"] if count == 1 else []),
            *[f"adhi_malefic_contamination_{p.lower()}" for p, _h in context.malefic_hits],
            *[f"adhi_combust_{p.lower()}" for p in combust_formers],
            *([f"adhi_moon_strength_{(planet_scores or {}).get('MOON', 50)}"] if moon_weak else []),
        ]
    return YogaResult(
        name="ADHI_BASE",
        is_present=present,
        strength=strength,
        conditions_met=conditions,
        cancellation_factors=[],
        dasha_activated=False,
        key_grahas=tuple(p for p, _h in context.benefic_hits) if present else (),
        secondary_grahas=("MOON",) if present and moon_secondary else (),
        description_ta="அதி யோக அமைப்பு — சந்திரனிலிருந்து 6/7/8இல் குறைந்தது ஒரு இயங்குநிலை சுபகிரகம்.",
        description_en="Adhi pattern — at least one dynamically benefic Mercury, Jupiter or Venus in the 6th/7th/8th from Moon.",
    )


def detect_adhi_raja_grade(
    planets: dict[str, int],
    moon_rasi: int,
    *,
    paksha_is_shukla: bool | None = None,
    planet_scores: Mapping[str, int] | None = None,
    combust_planets: frozenset[str] = frozenset(),
    moon_secondary: bool = True,
    include_malefic_aspects: bool = False,
) -> YogaResult:
    """DD-08 candidate raja-grade: an uncombust and uncontaminated base form."""
    context = _adhi_context(
        planets,
        moon_rasi,
        paksha_is_shukla=paksha_is_shukla,
        planet_scores=planet_scores,
        include_malefic_aspects=include_malefic_aspects,
    )
    combust_formers = tuple(
        planet for planet, _house in context.benefic_hits if planet in combust_planets
    )
    present = bool(context.benefic_hits) and not (
        combust_formers or context.malefic_hits or context.malefic_aspectors
    )
    conditions = []
    if present:
        conditions = [
            "adhi_raja_grade_candidate",
            "adhi_base_geometry",
            f"adhi_benefic_count_{len(context.benefic_hits)}",
            "adhi_no_forming_benefic_combust",
            "adhi_no_serious_malefic_affliction",
            *[f"{planet}_in_house_{house}_from_moon" for planet, house in context.benefic_hits],
        ]
    strength, gate_notes = gate_yoga_strength(
        "STRONG" if present else "WEAK",
        (*[planet for planet, _house in context.benefic_hits], "MOON"),
        planet_scores,
        combust_planets,
    )
    return YogaResult(
        name="ADHI_RAJA_GRADE",
        is_present=present,
        strength=strength,
        conditions_met=conditions,
        cancellation_factors=gate_notes if present else [],
        dasha_activated=False,
        key_grahas=tuple(planet for planet, _house in context.benefic_hits) if present else (),
        secondary_grahas=("MOON",) if present and moon_secondary else (),
        description_ta="அதி யோகம் (ராஜ தர நிலை, பரிசீலனையில்) — உருவாக்கும் சுபகிரகங்கள் அஸ்தங்கம் இன்றி, கடுமையான பாவக்கிரகப் பாதிப்பு இன்றி உள்ளன.",
        description_en="Adhi Yoga — candidate raja-grade form with no combust forming benefic or serious malefic affliction.",
    )


def detect_adhi_yoga(
    planets: dict[str, int],
    moon_rasi: int,
    lagna_nature_map: dict[str, str],
    *,
    paksha_is_shukla: bool | None = None,
    planet_scores: Mapping[str, int] | None = None,
    combust_planets: frozenset[str] = frozenset(),
    moon_secondary: bool = True,
) -> YogaResult:
    """Compatibility wrapper for callers migrating to the explicit base key."""
    return detect_adhi_base(
        planets,
        moon_rasi,
        lagna_nature_map,
        paksha_is_shukla=paksha_is_shukla,
        planet_scores=planet_scores,
        combust_planets=combust_planets,
        moon_secondary=moon_secondary,
    )


def _daridra_key_grahas(lagna_rasi: int) -> tuple[str, ...]:
    """The grahas whose dasha activates a Daridra reading, for this lagna.

    Astrologer ruling, 2026-09-11: the 11th lord alone under-reads it, so the
    2nd lord (dhana / speech-and-holdings) carries equal weight. Both are house
    lords and therefore differ by lagna, which is why this is resolved per chart
    into ``YogaResult.key_grahas`` instead of a static registry row. One graha
    can own both houses, hence the de-duplication.
    """
    lords = (_house_lord(lagna_rasi, 11), _house_lord(lagna_rasi, 2))
    return tuple(dict.fromkeys(lords))


_DUSTHANA_HOUSES = (6, 8, 12)
_DHANA_HOUSES = (2, 11)


def detect_daridra_yoga(planets: dict[str, int], lagna_rasi: int, planet_scores: dict[str, int]) -> YogaResult:
    """Daridra Yoga — a **parivartana** between a dusthana lord and a dhana lord.

    Astrologer ruling, 2026-09-11. The previous test was "the 11th lord occupies
    a dusthana", one narrow member of the daridra family, and the ruling replaced
    it with the stronger classical formulation: *the lords of the difficult houses
    connecting with the houses of wealth*.

    "Connecting" is read here as a **mutual exchange only**, and the reason is
    measured rather than asserted (`scripts/daridra_definition_sweep.py`, 200k
    random charts). Over that sweep the looser readings of the same words fire far
    more often than the rule they replaced, not less:

    ===================================================  =========
    reading                                              fire rate
    ===================================================  =========
    the old 11th-lord-in-dusthana test                       25.1%
    a dusthana lord merely *occupying* the 2nd/11th           42.1%
    a dusthana lord *conjunct* a dhana lord                   35.9%
    either of those two ("connecting", read plainly)          63.2%
    **a true parivartana — what this function tests**      **3.9%**
    ===================================================  =========

    The intent behind the ruling was a rarer, stronger Daridra, and only the
    exchange delivers it. Two further reasons the looser forms were rejected:
    a mutual exchange is a genuine *connection* between two houses rather than a
    one-way placement, and it necessarily involves **two distinct grahas**. That
    second property matters more than it looks — for lagnas 2, 3, 8, 9 and 12 a
    single graha owns both a dusthana and a dhana house, so any rule counting
    shared lordship as a connection would fire on 100% of those charts from the
    lagna alone, before a single placement is read.
    """
    _ = planet_scores
    exchanges: list[str] = []
    for dusthana in _DUSTHANA_HOUSES:
        dusthana_lord = _house_lord(lagna_rasi, dusthana)
        for dhana in _DHANA_HOUSES:
            dhana_lord = _house_lord(lagna_rasi, dhana)
            # One graha owning both houses is a lagna constant, not a chart
            # finding — see the docstring.
            if dusthana_lord == dhana_lord:
                continue
            dusthana_lord_house = house_from_reference(
                lagna_rasi, planets.get(dusthana_lord, lagna_rasi)
            )
            dhana_lord_house = house_from_reference(
                lagna_rasi, planets.get(dhana_lord, lagna_rasi)
            )
            if dusthana_lord_house == dhana and dhana_lord_house == dusthana:
                exchanges.append(f"parivartana_{dusthana}_{dhana}")

    present = bool(exchanges)
    return YogaResult(
        name="DARIDRA_YOGA",
        is_present=present,
        strength="STRONG" if present else "WEAK",
        conditions_met=exchanges,
        cancellation_factors=[],
        dasha_activated=False,
        key_grahas=_daridra_key_grahas(lagna_rasi),
        description_ta=(
            "தரித்ர யோகம் — துஷ்டான அதிபதிக்கும் (6/8/12) தன அதிபதிக்கும் (2/11) "
            "இடையே பரிவர்த்தனை."
        ),
        description_en=(
            "Daridra Yoga — a parivartana (mutual exchange) between a dusthana "
            "lord (6th/8th/12th) and a house-of-wealth lord (2nd/11th)."
        ),
    )


def detect_daridra_yoga_proxy(planets: dict[str, int], lagna_rasi: int, planet_scores: dict[str, int]) -> YogaResult:
    """YOG-DR-02: Vinaadi's own proxy — 11th lord weak and conjunct a
    malefic. No classical parent; split off `DARIDRA_YOGA` per the
    2026-08-28 ruling ("the weak-and-afflicted proxy is labelled as ours")."""
    eleventh_lord = _house_lord(lagna_rasi, 11)
    eleventh_rasi = planets.get(eleventh_lord, lagna_rasi)
    weak = planet_scores.get(eleventh_lord, 50) < 40
    malefic_conj = any(
        planets.get(m) == eleventh_rasi for m in NATURAL_MALEFICS if m != eleventh_lord
    )
    present = weak and malefic_conj
    return YogaResult(
        name="DARIDRA_PROXY_YOGA",
        is_present=present,
        strength="PARTIAL" if present else "WEAK",
        conditions_met=["eleventh_lord_weak_malefic_conj"] if present else [],
        cancellation_factors=[],
        dasha_activated=False,
        key_grahas=_daridra_key_grahas(lagna_rasi),
        description_ta="தரித்ர யோகம் (வினாடி அளவுகோல்) — 11ஆம் அதிபதி பலவீனமாகவும் பாதக கிரகத்துடன் சேர்ந்தும்.",
        description_en="Daridra Yoga (Vinaadi proxy) — 11th lord weak and conjunct a malefic. Our own measure, not a classical daridra yoga.",
    )


def _ninth_lord_dignity(planet: str, rasi: int | None, *, moolatrikona: bool) -> str:
    """'exalted' / 'own_sign' / 'moolatrikona', or '' — sign-level, whole sign."""
    if rasi is None:
        return ""
    if rasi == EXALTATION_RASI.get(planet):
        return "exalted"
    if rasi in OWN_SIGN_RASI.get(planet, set()):
        return "own_sign"
    mt = MOOLATRIKONA_ZONE.get(planet)
    if moolatrikona and mt is not None and rasi == mt[0]:
        return "moolatrikona"
    return ""


def detect_lakshmi_yoga(
    planets: dict[str, int],
    lagna_rasi: int,
    planet_scores: dict[str, int],
    *,
    combust_planets: frozenset[str] = frozenset(),
    d9_rasi_map: Mapping[str, int] | None = None,
    d9_lagna_rasi: int | None = None,
    doctrine: DoctrineOptions = DEFAULT_DOCTRINE,
) -> YogaResult:
    """Lakshmi Yoga, Parāśari form — DOCTRINE_DECISIONS v1.3, DD-02 (primary).

    The 9th lord in a **kendra** (1/4/7/10 — not a trikona) **and** in its own,
    moolatrikona or exaltation sign, **and** the lagna lord balāḍhya. Dignity is
    mandatory: the old rule (9th lord in a kendra or trikona, both composite
    scores >= 60) was broader than every source. "Balāḍhya" is Vinaadi's
    strength model (`lagna_lord_strength`, Tier C, threshold O-8).

    The wire key stays `LAKSHMI_YOGA` as a stable identifier, like
    `YOGAKARAKA_RAJA_YOGA`; the registry row names the form.
    """
    ninth_lord = _house_lord(lagna_rasi, 9)
    lagna_lord = _house_lord(lagna_rasi, 1)
    ninth_rasi = planets.get(ninth_lord)
    ninth_house = house_from_reference(lagna_rasi, ninth_rasi) if ninth_rasi is not None else 0
    dignity = _ninth_lord_dignity(ninth_lord, ninth_rasi, moolatrikona=True)
    ll = lagna_lord_strength(
        lagna_rasi, planets, planet_scores,
        d9_rasi_map=d9_rasi_map, d9_lagna_rasi=d9_lagna_rasi, options=doctrine,
    )
    present = ninth_house in KENDRA_HOUSES and bool(dignity) and ll.is_baladhya(doctrine)
    strength, gate_notes = gate_yoga_strength(
        "STRONG" if present else "WEAK", (ninth_lord, lagna_lord), planet_scores, combust_planets
    )
    return YogaResult(
        name="LAKSHMI_YOGA",
        is_present=present,
        strength=strength,
        conditions_met=[
            f"ninth_lord_{ninth_lord.lower()}_in_kendra_{ninth_house}",
            f"ninth_lord_{dignity}",
            f"lagna_lord_{lagna_lord.lower()}_baladhya_{ll.score}",
        ] if present else [],
        cancellation_factors=gate_notes,
        dasha_activated=False,
        key_grahas=(ninth_lord, lagna_lord),
        description_ta="லக்ஷ்மி யோகம் — 9ஆம் அதிபதி கேந்திரத்தில் ஆட்சி/மூலத்திரிகோணம்/உச்சம் பெற்று, லக்னாதிபதி பலம் பெற்றிருத்தல்.",
        description_en="Lakshmi Yoga — the 9th lord in a kendra in its own, moolatrikona or exaltation sign, with a strong lagna lord.",
    )


def detect_bhagya_support(
    planets: dict[str, int],
    lagna_rasi: int,
    planet_scores: dict[str, int],
    *,
    combust_planets: frozenset[str] = frozenset(),
    d9_rasi_map: Mapping[str, int] | None = None,
    d9_lagna_rasi: int | None = None,
    doctrine: DoctrineOptions = DEFAULT_DOCTRINE,
) -> YogaResult | None:
    """Fortune support — DD-02's honest fallback label (Tier C).

    The 9th lord well placed (kendra or trikona) **without** the dignity Lakshmi
    Yoga requires. It is not Lakshmi Yoga and never carries that name. Emitted
    only when present. The two cases this leaves unlabelled — a dignified 9th
    lord in a trikona only, and a dignified 9th lord in a kendra with a weak
    lagna lord — are open item O-17.
    """
    ninth_lord = _house_lord(lagna_rasi, 9)
    ninth_rasi = planets.get(ninth_lord)
    if ninth_rasi is None:
        return None
    ninth_house = house_from_reference(lagna_rasi, ninth_rasi)
    if ninth_house not in KENDRA_HOUSES | TRIKONA_HOUSES:
        return None
    dignity = _ninth_lord_dignity(ninth_lord, ninth_rasi, moolatrikona=True)
    conditions = [f"ninth_lord_{ninth_lord.lower()}_in_house_{ninth_house}"]
    if dignity:
        if doctrine.o17_bhagya_support_scope == "literal":
            return None
        ll = lagna_lord_strength(
            lagna_rasi, planets, planet_scores,
            d9_rasi_map=d9_rasi_map, d9_lagna_rasi=d9_lagna_rasi, options=doctrine,
        )
        if ninth_house in KENDRA_HOUSES and ll.is_baladhya(doctrine):
            return None
        conditions.append(f"ninth_lord_{dignity}")
        if ninth_house not in KENDRA_HOUSES:
            conditions.append("ninth_lord_not_in_lakshmi_kendra")
        if not ll.is_baladhya(doctrine):
            conditions.append("lagna_lord_below_baladhya_threshold")
    else:
        conditions.append("ninth_lord_without_dignity")
    strength, gate_notes = gate_yoga_strength("PARTIAL", (ninth_lord,), planet_scores, combust_planets)
    return YogaResult(
        name="BHAGYA_SUPPORT",
        is_present=True,
        strength=strength,
        conditions_met=conditions,
        cancellation_factors=gate_notes,
        dasha_activated=False,
        key_grahas=(ninth_lord,),
        description_ta=("பாக்கிய ஆதரவு — 9ஆம் அதிபதி கேந்திரம்/திரிகோணத்தில் உள்ளது; லக்ஷ்மி யோகத்திற்கான ஆட்சி/உச்ச நிபந்தனை இல்லை." if not dignity else 'பாக்கிய ஆதரவு: 9ஆம் அதிபதி பலம் பெற்றுள்ளது; முழு லக்ஷ்மி யோகத்தின் மற்ற நிபந்தனைகள் நிறைவேறவில்லை.'),
        description_en=("Fortune support — the 9th lord is in a kendra or trikona, without the dignity Lakshmi Yoga requires." if not dignity else 'Fortune support: the 9th lord has dignity, but another full Lakshmi Yoga condition is not met.'),
    )


def detect_lakshmi_yoga_phaladeepika(
    planets: dict[str, int],
    lagna_rasi: int,
    planet_scores: dict[str, int],
    *,
    combust_planets: frozenset[str] = frozenset(),
) -> YogaResult | None:
    """Lakshmi Yoga, Phaladeepika variant (DD-02). Off in the consumer UI by
    default; the facade emits it only under `show_lakshmi_phaladeepika`.

    The 9th lord **and** Sukran both in their own or exaltation sign, both in a
    kendra or trikona. When Sukran is itself the 9th lord (Kumbam lagna) the two
    conditions collapse into one graha."""
    ninth_lord = _house_lord(lagna_rasi, 9)
    pair = tuple(dict.fromkeys((ninth_lord, "VENUS")))
    hits: list[str] = []
    for planet in pair:
        rasi = planets.get(planet)
        dignity = _ninth_lord_dignity(planet, rasi, moolatrikona=False)
        if rasi is None or not dignity:
            return None
        house = house_from_reference(lagna_rasi, rasi)
        if house not in KENDRA_HOUSES | TRIKONA_HOUSES:
            return None
        hits.append(f"{planet.lower()}_{dignity}_in_house_{house}")
    strength, gate_notes = gate_yoga_strength("STRONG", pair, planet_scores, combust_planets)
    return YogaResult(
        name="LAKSHMI_YOGA_PHALADEEPIKA",
        is_present=True,
        strength=strength,
        conditions_met=hits,
        cancellation_factors=gate_notes,
        dasha_activated=False,
        key_grahas=pair,
        description_ta="லக்ஷ்மி யோகம் (பலதீபிகை வடிவம்) — 9ஆம் அதிபதியும் சுக்கிரனும் ஆட்சி/உச்சம் பெற்று கேந்திர/திரிகோணத்தில்.",
        description_en="Lakshmi Yoga (Phaladeepika form) — the 9th lord and Venus both in own or exaltation sign, in a kendra or trikona.",
    )


_SUNAPHA_ANAPHA_EXCLUDED = frozenset({"SUN", "MOON", "RAHU", "KETU", "MANDHI"})


def detect_sunapha_anapha_durudhura(
    planets: dict[str, int], moon_rasi: int, *, moon_secondary: bool = True,
) -> list[YogaResult]:
    # Classical: formed by planets OTHER THAN the Sun in the 2nd/12th from
    # Moon. Nodes (Rahu/Ketu) never form these; Moon is the reference point,
    # not a candidate; Mandhi is an upagraha, not a graha (WI-15). Matches
    # Kemadruma's exclusion pattern in this same file.
    #
    # DD-15: the forming planets are the primary activators (Raman states it for
    # Sunapha; applying it to Anapha/Durudhura is inference). The Moon is a
    # secondary activator by Vinaadi convention, switchable under O-16.
    second = ((moon_rasi - 1 + 1) % 12) + 1
    twelfth = ((moon_rasi - 1 - 1) % 12) + 1
    in_second = tuple(p for p, r in planets.items() if p not in _SUNAPHA_ANAPHA_EXCLUDED and r == second)
    in_twelfth = tuple(p for p, r in planets.items() if p not in _SUNAPHA_ANAPHA_EXCLUDED and r == twelfth)
    secondary = ("MOON",) if moon_secondary else ()
    out: list[YogaResult] = []
    if in_second:
        out.append(YogaResult("SUNAPHA_YOGA", True, "PARTIAL", ["planets_in_2nd_from_moon"], [], False, "சுனபா யோகம்.", "Sunapha Yoga.",
                              key_grahas=in_second, secondary_grahas=secondary))
    if in_twelfth:
        out.append(YogaResult("ANAPHA_YOGA", True, "PARTIAL", ["planets_in_12th_from_moon"], [], False, "அநபா யோகம்.", "Anapha Yoga.",
                              key_grahas=in_twelfth, secondary_grahas=secondary))
    if in_second and in_twelfth:
        out.append(YogaResult("DURUDHURA_YOGA", True, "STRONG", ["planets_in_2nd_and_12th_from_moon"], [], False, "துருதுரா யோகம்.", "Durudhura Yoga.",
                              key_grahas=in_second + in_twelfth, secondary_grahas=secondary))
    return out


def detect_vasumati_yoga(
    planets: dict[str, int], moon_rasi: int, lagna_rasi: int, *, paksha_is_shukla: bool | None = None,
    planet_scores: Mapping[str, int] | None = None,
) -> YogaResult:
    # YOG-VS-01 ruling (2026-08-28): "Lagna-or-Moon" — upachaya counted from
    # either reference, not from Chandran alone. A hit from either reference
    # counts the graha once; Chandran itself is no longer inert, since it can
    # satisfy the test from the Lagna even though it is always the 1st from
    # itself.
    upachaya = {3, 6, 10, 11}
    benefic_hits = []
    for planet in ("JUPITER", "VENUS", "MERCURY", "MOON"):
        if effective_natural_class(
            planet, planets, paksha_is_shukla=paksha_is_shukla, planet_scores=planet_scores
        ) != "BENEFIC":
            continue
        rasi = planets.get(planet)
        if rasi is None:
            continue
        from_moon = house_from_reference(moon_rasi, rasi) in upachaya
        from_lagna = house_from_reference(lagna_rasi, rasi) in upachaya
        if from_moon or from_lagna:
            benefic_hits.append(planet)
    present = len(benefic_hits) >= 2
    return YogaResult(
        name="VASUMATI_YOGA",
        is_present=present,
        strength="STRONG" if len(benefic_hits) >= 3 else ("PARTIAL" if present else "WEAK"),
        conditions_met=[f"{p}_upachaya_from_lagna_or_moon" for p in benefic_hits],
        cancellation_factors=[],
        dasha_activated=False,
        # DD-15: each qualifying benefic activates (SOURCE_INFERRED).
        key_grahas=tuple(benefic_hits) if present else (),
        description_ta="வசுமதி யோகம் — லக்னம் அல்லது சந்திரனிலிருந்து உபசய ஸ்தானங்களில் சுபகிரகங்கள்.",
        description_en="Vasumati Yoga — benefics in upachaya houses counted from either the Lagna or the Moon.",
    )
