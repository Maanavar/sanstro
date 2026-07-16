"""Dosham detection functions: Sevvai, Rahu/Ketu, Pitru, Kalasarpa, Kalathra, Putra Sarpa, Badhaka."""
from __future__ import annotations

from collections.abc import Iterable, Mapping

from app.calculations.aspects import aspects_house
from app.calculations.astro import house_from_reference
from app.calculations.chart_strength import EXALTATION_RASI, OWN_SIGN_RASI, SIGN_LORD
from app.calculations._yoga_helpers import (
    FEMALE_HIGH_ATTENTION_SEVVAI_HOUSES,
    HOUSE_SIGN_NIVARTHI,
    KADAGAM_SIMMAM_LAGNA_EXCEPTION,
    KENDRA_HOUSES,
    KalasarpaResult,
    MALE_HIGH_ATTENTION_SEVVAI_HOUSES,
    NATURAL_MALEFICS,
    PlanetInput,
    RAHU_KETU_MARRIAGE_HOUSES,
    RAHU_KETU_SARPA_HOUSES,
    RAHU_KETU_UPACHAYA_HOUSES,
    SEVEN_PLANETS,
    SEVVAI_BENEFIC_REDUCERS,
    SIGN_LORD,
    TAMIL_SEVVAI_HOUSES,
    TRIKONA_HOUSES,
    DoshamResult,
    _build_dosham_explanations,
    _house_lord,
    _is_active,
    _is_functional_benefic,
    _is_kendra_from,
    _planet_is_strong,
    _planet_rasi,
)

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
) -> DoshamResult:
    active = set(active_lords or ())
    missing_data = [planet for planet in ("MARS", "MOON", "VENUS") if planet not in planets]
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
            description_ta="செவ்வாய் தோஷம் பகுப்பாய்விற்கு செவ்வாய், சந்திரன், சுக்கிரன் நிலைகள் தேவை.",
            description_en="Sevvai dosham analysis needs Mars, Moon, and Venus placements.",
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
    severity_notes: list[str] = []
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

    gender_norm = (gender or "").lower()
    for _ref_key, house_num in house_hits.items():
        if gender_norm == "female" and house_num in FEMALE_HIGH_ATTENTION_SEVVAI_HOUSES:
            severity_notes.append("female_high_attention_house")
            if "female_high_attention_house" not in conditions_met:
                conditions_met.append("female_high_attention_house")
        elif gender_norm == "male" and house_num in MALE_HIGH_ATTENTION_SEVVAI_HOUSES:
            severity_notes.append("male_high_attention_house")
            if "male_high_attention_house" not in conditions_met:
                conditions_met.append("male_high_attention_house")

    cancellation_factors: list[str] = []
    mitigation_score = 0
    major_cancellation = False

    if mars_rasi in OWN_SIGN_RASI["MARS"]:
        cancellation_factors.append("mars_own_sign")
        mitigation_score += 1
    if mars_rasi == EXALTATION_RASI["MARS"]:
        cancellation_factors.append("mars_exaltation")
        mitigation_score += 1

    if lagna_rasi in KADAGAM_SIMMAM_LAGNA_EXCEPTION:
        cancellation_factors.append("mars_yogakaraka_lagna")
        mitigation_score += 1
        major_cancellation = True
    elif lagna_rasi in {1, 8} and lagna_house in {1, 2}:
        cancellation_factors.append("mars_lagna_lord_mitigation")
        mitigation_score += 1
        major_cancellation = True

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

    mars_sign_lord = SIGN_LORD[mars_rasi]
    if mars_sign_lord in planets:
        lord_rasi = _planet_rasi(planets, mars_sign_lord)
        if house_from_reference(mars_rasi, lord_rasi) in KENDRA_HOUSES | TRIKONA_HOUSES:
            cancellation_factors.append("mars_dispositor_kendra_trikona")
            mitigation_score += 1

    seventh_lord = _house_lord(lagna_rasi, 7)
    if seventh_lord in planets:
        seventh_lord_rasi = _planet_rasi(planets, seventh_lord)
        seventh_lord_is_strong = _is_functional_benefic(lagna_rasi, seventh_lord) and _is_kendra_from(lagna_rasi, seventh_lord_rasi)
        malefics = {"MARS", "SATURN", "RAHU", "KETU"}
        conjunct_malefic = any(
            p in planets and _planet_rasi(planets, p) == seventh_lord_rasi
            for p in malefics if p != seventh_lord
        )
        seventh_lord_combust = seventh_lord in combust_planets
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

    is_present = len([c for c in conditions_met if c not in {"female_high_attention_house", "male_high_attention_house"}]) > 0
    is_cancelled = is_present and (major_cancellation or mitigation_score >= 2)
    strong_house_hit = any(house_hits.get(key) in {7, 8} for key in house_hits)
    if not is_present or is_cancelled:
        strength = "WEAK"
    elif strong_house_hit or len([c for c in conditions_met if c.startswith("from_")]) >= 2:
        strength = "STRONG"
    else:
        strength = "PARTIAL"

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

    what_ta, what_en, why_ta, why_en, how_ta, how_en = _build_dosham_explanations(
        "SEVVAI_DOSHAM",
        label,
        conditions_met=conditions_met,
        cancellation_factors=cancellation_factors,
        missing_data=[],
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
        description_ta="செவ்வாய் தோஷம் ஒரு வழிகாட்டல் குறிப்பான் மட்டுமே; நிவர்த்தி காரணங்கள் தீவிரத்தை குறைக்கலாம்.",
        description_en="Sevvai dosham is treated as a traditional tendency indicator; cancellation factors can soften intensity.",
        explanation_what_ta=what_ta,
        explanation_what_en=what_en,
        explanation_why_ta=why_ta,
        explanation_why_en=why_en,
        explanation_how_ta=how_ta,
        explanation_how_en=how_en,
    )


def detect_rahu_ketu_dosham(
    planets: Mapping[str, PlanetInput],
    lagna_rasi: int,
    *,
    gender: str | None = None,
    active_lords: Iterable[str] | None = None,
    combust_planets: frozenset[str] = frozenset(),
    d9_rasi_map: Mapping[str, int] | None = None,
    d9_lagna_rasi: int | None = None,
) -> DoshamResult:
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
    jupiter_rasi = _planet_rasi(planets, "JUPITER")
    venus_rasi = _planet_rasi(planets, "VENUS")
    rahu_house = house_from_reference(lagna_rasi, rahu_rasi)
    ketu_house = house_from_reference(lagna_rasi, ketu_rasi)

    conditions_met: list[str] = []
    marriage_candidates: list[int] = []
    sarpa_candidates: list[int] = []

    if rahu_house in RAHU_KETU_MARRIAGE_HOUSES:
        conditions_met.append("rahu_in_marriage_house")
        marriage_candidates.append(rahu_house)
    if ketu_house in RAHU_KETU_MARRIAGE_HOUSES:
        conditions_met.append("ketu_in_marriage_house")
        marriage_candidates.append(ketu_house)

    if rahu_house in RAHU_KETU_SARPA_HOUSES:
        conditions_met.append("rahu_in_sarpa_house")
        sarpa_candidates.append(rahu_house)
    if ketu_house in RAHU_KETU_SARPA_HOUSES:
        conditions_met.append("ketu_in_sarpa_house")
        sarpa_candidates.append(ketu_house)

    seventh_lord = _house_lord(lagna_rasi, 7)
    if seventh_lord in planets:
        seventh_lord_rasi = _planet_rasi(planets, seventh_lord)
        if seventh_lord_rasi in {rahu_rasi, ketu_rasi}:
            conditions_met.append("node_with_seventh_lord")
    if venus_rasi in {rahu_rasi, ketu_rasi}:
        conditions_met.append("node_with_venus")

    if "MOON" in planets:
        moon_rasi = _planet_rasi(planets, "MOON")
        if moon_rasi in {rahu_rasi, ketu_rasi}:
            conditions_met.append("node_afflicts_moon")

    if rahu_house in RAHU_KETU_UPACHAYA_HOUSES and rahu_house not in RAHU_KETU_MARRIAGE_HOUSES:
        conditions_met.append("rahu_ketu_upachaya")
    if ketu_house in RAHU_KETU_UPACHAYA_HOUSES and ketu_house not in RAHU_KETU_MARRIAGE_HOUSES:
        if "rahu_ketu_upachaya" not in conditions_met:
            conditions_met.append("rahu_ketu_upachaya")

    cancellation_factors: list[str] = []

    jupiter_house_from_lagna = house_from_reference(lagna_rasi, jupiter_rasi)
    if jupiter_house_from_lagna in KENDRA_HOUSES | TRIKONA_HOUSES:
        cancellation_factors.append("jupiter_kendra_trikona_support")
    if aspects_house("JUPITER", jupiter_rasi, rahu_rasi):
        if "jupiter_kendra_trikona_support" not in cancellation_factors:
            cancellation_factors.append("jupiter_kendra_trikona_support")

    if seventh_lord in planets:
        seventh_lord_rasi_rk = _planet_rasi(planets, seventh_lord)
        base_strong = _planet_is_strong(planets, seventh_lord, lagna_rasi)
        rk_malefics = {"MARS", "SATURN", "RAHU", "KETU"}
        conjunct_mal_rk = any(
            p in planets and _planet_rasi(planets, p) == seventh_lord_rasi_rk
            for p in rk_malefics if p != seventh_lord
        )
        seventh_combust_rk = seventh_lord in combust_planets
        d9_strong_rk = False
        if d9_rasi_map and d9_lagna_rasi and seventh_lord in d9_rasi_map:
            d9_house_rk = house_from_reference(d9_lagna_rasi, d9_rasi_map[seventh_lord])
            d9_strong_rk = d9_house_rk in (KENDRA_HOUSES | TRIKONA_HOUSES)
        jup_aspect_7l_rk = False
        if "JUPITER" in planets:
            jup_rasi_rk = _planet_rasi(planets, "JUPITER")
            jup_aspect_7l_rk = aspects_house("JUPITER", jup_rasi_rk, seventh_lord_rasi_rk)
        if base_strong and not conjunct_mal_rk and not seventh_combust_rk:
            cancellation_factors.append("strong_seventh_lord")
        if d9_strong_rk:
            cancellation_factors.append("seventh_lord_strong_d9")
        if jup_aspect_7l_rk:
            cancellation_factors.append("jupiter_aspects_seventh_lord")
    if d9_rasi_map and d9_lagna_rasi:
        d9_7th_lord = SIGN_LORD[((d9_lagna_rasi + 5) % 12) + 1]
        if d9_7th_lord in d9_rasi_map:
            d9_7th_lord_house = house_from_reference(d9_lagna_rasi, d9_rasi_map[d9_7th_lord])
            if d9_7th_lord_house in KENDRA_HOUSES | TRIKONA_HOUSES:
                conditions_met.append("d9_seventh_lord_strong")

    if _planet_is_strong(planets, "VENUS", lagna_rasi) and venus_rasi not in {rahu_rasi, ketu_rasi}:
        cancellation_factors.append("strong_venus")

    gender_norm = (gender or "").lower()
    if gender_norm == "female":
        if any(h == 8 for h in marriage_candidates):
            if "female_high_attention_house" not in conditions_met:
                conditions_met.append("female_high_attention_house")
    elif gender_norm == "male":
        if any(h == 7 for h in marriage_candidates) or "node_with_venus" in conditions_met:
            if "male_high_attention_house" not in conditions_met:
                conditions_met.append("male_high_attention_house")

    has_marriage_candidate = len(marriage_candidates) > 0
    has_sarpa_candidate = len(sarpa_candidates) > 0
    strong_marriage_affliction = bool(
        set(marriage_candidates) & {7, 8}
        or "node_with_seventh_lord" in conditions_met
        or "node_with_venus" in conditions_met
        or "node_afflicts_moon" in conditions_met
    )
    is_present = has_marriage_candidate or has_sarpa_candidate
    is_cancelled = has_marriage_candidate and len(cancellation_factors) >= 2 and not strong_marriage_affliction

    if not is_present:
        strength = "WEAK"
    elif strong_marriage_affliction:
        strength = "STRONG"
    else:
        strength = "PARTIAL"

    if has_marriage_candidate:
        if is_cancelled:
            label = "RAHU_KETU_DOSHAM_WITH_NIVARTHI"
        elif strong_marriage_affliction:
            label = "STRONG_ACTIVE_RAHU_KETU_DOSHAM"
        elif len(marriage_candidates) == 1:
            label = "RAHU_KETU_DOSHAM_CANDIDATE"
        else:
            label = "ACTIVE_RAHU_KETU_DOSHAM"
        category = "MARRIAGE"
    elif has_sarpa_candidate:
        label = "SARPA_NAGA_DOSHAM_CANDIDATE"
        category = "SARPA_NAGA"
    else:
        label = "NO_RAHU_KETU_DOSHAM"
        category = "NODES"

    what_ta, what_en, why_ta, why_en, how_ta, how_en = _build_dosham_explanations(
        "RAHU_KETU_DOSHAM",
        label,
        conditions_met=conditions_met,
        cancellation_factors=cancellation_factors,
        missing_data=[],
    )
    return DoshamResult(
        name="RAHU_KETU_DOSHAM",
        is_present=is_present,
        is_cancelled=is_cancelled,
        strength=strength if not is_cancelled else "WEAK",
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

    what_ta, what_en, why_ta, why_en, how_ta, how_en = _build_dosham_explanations(
        "PITRU_DOSHAM",
        label,
        conditions_met=conditions_met,
        cancellation_factors=cancellation_factors,
        missing_data=[],
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


def detect_kalasarpa(
    planets: Mapping[str, PlanetInput],
    lagna_rasi: int | None = None,
) -> KalasarpaResult:
    rahu_rasi = _planet_rasi(planets, "RAHU")
    ketu_rasi = _planet_rasi(planets, "KETU")
    planet_rasis = [_planet_rasi(planets, planet) for planet in SEVEN_PLANETS]

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

    # Name the naga from Rahu's house. When lagna is unknown (older callers),
    # fall back to the un-named formation so behavior never regresses.
    naga = KALASARPA_NAGAS.get(house_from_reference(lagna_rasi, rahu_rasi)) if lagna_rasi else None
    if naga is None:
        return KalasarpaResult(
            is_present=True,
            pattern=pattern,
            conditions_met=conditions_met,
            description_ta="அனைத்து 7 கிரகங்களும் ராகு-கேது அச்சின் ஒரு பக்கத்தில் உள்ளதால் காலசர்ப்ப அமைப்பு.",
            description_en="All seven planets fall on one side of the Rahu-Ketu axis, indicating a Kalasarpa formation.",
        )

    rahu_house = house_from_reference(lagna_rasi, rahu_rasi)
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

    is_cancelled = len(cancellation_factors) >= 2 or (
        len(cancellation_factors) == 1
        and cancellation_factors[0] in {"seventh_lord_exalted", "jupiter_aspects_seventh_lord"}
    )
    if not is_present:
        label = "NO_KALATHRA_DOSHAM"
        strength = "WEAK"
    elif is_cancelled:
        label = "KALATHRA_DOSHAM_CANCELLED"
        strength = "WEAK"
    elif seventh_lord_house == 8:
        label = "STRONG_KALATHRA_DOSHAM"
        strength = "STRONG"
    elif legacy_affliction and planet_scores and planet_scores.get(seventh_lord, 50) < 40:
        label = "STRONG_KALATHRA_DOSHAM"
        strength = "STRONG"
    else:
        label = "KALATHRA_DOSHAM"
        strength = "MODERATE"

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
    what_ta, what_en, why_ta, why_en, how_ta, how_en = _build_dosham_explanations(
        "KALATHRA_DOSHAM",
        label,
        conditions_met=conditions_met,
        cancellation_factors=cancellation_factors,
        missing_data=[],
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
            f"களத்திர தோஷம்: 7ம் அதிபதி ({seventh_lord}) {house_name_ta} உள்ளது; திருமண விஷயங்களில் கவனம் தேவை."
            if is_present
            else f"7ம் அதிபதி ({seventh_lord}) {house_name_ta} உள்ளது; களத்திர தோஷம் இல்லை."
        ),
        description_en=(
            f"Kalathra dosham: 7th lord ({seventh_lord}) is in {house_name_en}; marriage matters need attention."
            if is_present
            else f"7th lord ({seventh_lord}) is in {house_name_en}; no Kalathra dosham."
        ),
        explanation_what_ta=what_ta,
        explanation_what_en=what_en,
        explanation_why_ta=why_ta,
        explanation_why_en=why_en,
        explanation_how_ta=how_ta,
        explanation_how_en=how_en,
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

    what_ta, what_en, why_ta, why_en, how_ta, how_en = _build_dosham_explanations(
        "MARANA_KARAKA_STHANA",
        label,
        conditions_met=conditions_met,
        cancellation_factors=cancellation_factors,
        missing_data=[],
    )
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
    )


def detect_putra_sarpa_dosham(planets: dict[str, int], lagna_rasi: int, planet_scores: dict[str, int]) -> DoshamResult:
    fifth_lord = _house_lord(lagna_rasi, 5)
    fifth_rasi = planets.get(fifth_lord, lagna_rasi)
    afflicted = any(planets.get(p) == fifth_rasi for p in {"RAHU", "KETU", "SATURN"})
    guru_afflicted = any(planets.get(p) == planets.get("JUPITER") for p in {"RAHU", "KETU"})
    present = afflicted or guru_afflicted
    cancellation = []
    if planet_scores.get(fifth_lord, 50) >= 65:
        cancellation.append("strong_fifth_lord")
    if house_from_reference(lagna_rasi, planets.get("JUPITER", lagna_rasi)) in KENDRA_HOUSES:
        cancellation.append("jupiter_kendra")
    label = "NO_DOSHAM"
    if present and cancellation:
        label = "DOSHAM_WITH_NIVARTHI"
    elif present and planet_scores.get(fifth_lord, 50) < 40:
        label = "STRONG_ACTIVE_DOSHAM"
    elif present:
        label = "ACTIVE_DOSHAM"
    what_ta, what_en, why_ta, why_en, how_ta, how_en = _build_dosham_explanations(
        "PUTRA_SARPA_DOSHAM",
        label,
        conditions_met=["fifth_afflicted"] if present else [],
        cancellation_factors=cancellation,
        missing_data=[],
    )
    return DoshamResult(
        name="PUTRA_SARPA_DOSHAM",
        is_present=present,
        is_cancelled=bool(cancellation),
        strength="STRONG" if label == "STRONG_ACTIVE_DOSHAM" else ("PARTIAL" if present else "WEAK"),
        label=label,
        category="CHILDREN",
        conditions_met=["fifth_afflicted"] if present else [],
        cancellation_factors=cancellation,
        missing_data=[],
        dasha_activated=False,
        description_ta="புத்ர/சர்ப்ப தோஷம் — 5ஆம் பாவம் அல்லது குரு பாதிப்பு.",
        description_en="Putra/Sarpa dosham — affliction to 5th house or Jupiter.",
        explanation_what_ta=what_ta,
        explanation_what_en=what_en,
        explanation_why_ta=why_ta,
        explanation_why_en=why_en,
        explanation_how_ta=how_ta,
        explanation_how_en=how_en,
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
    what_ta, what_en, why_ta, why_en, how_ta, how_en = _build_dosham_explanations(
        "BADHAKA_DOSHAM",
        label,
        conditions_met=["badhaka_active"] if active else [],
        cancellation_factors=cancellation,
        missing_data=[],
    )
    return DoshamResult(
        name="BADHAKA_DOSHAM",
        is_present=active,
        is_cancelled=bool(cancellation),
        strength="STRONG" if label == "STRONG_ACTIVE_DOSHAM" else ("PARTIAL" if active else "WEAK"),
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
