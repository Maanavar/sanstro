"""Yoga and dosham detection facade — public API for the astrology calculation layer.

Internal logic is split across three private sub-modules:
  _yoga_helpers.py  — shared constants, dataclasses, and utilities
  _yoga_dosham.py   — dosham detection (Sevvai, Rahu/Ketu, Pitru, Kalasarpa, Kalathra, …)
  _yoga_detect.py   — yoga detection (Gaja Kesari, Raja, Dhana, Pancha Mahapurusha, …)
"""
from __future__ import annotations

from collections.abc import Iterable, Mapping

from app.calculations.astro import house_from_reference
from app.calculations.functional_nature import get_functional_nature

# ── Re-export everything from sub-modules so callers don't need to change ──────
from app.calculations._yoga_helpers import (
    EXTENDED_SEVVAI_HOUSES,
    FEMALE_HIGH_ATTENTION_SEVVAI_HOUSES,
    HOUSE_SIGN_NIVARTHI,
    KADAGAM_SIMMAM_LAGNA_EXCEPTION,
    KENDRA_HOUSES,
    KalasarpaResult,
    MALE_HIGH_ATTENTION_SEVVAI_HOUSES,
    NATURAL_BENEFICS,
    NATURAL_MALEFICS,
    PlanetInput,
    RAHU_KETU_MARRIAGE_HOUSES,
    RAHU_KETU_SARPA_HOUSES,
    RAHU_KETU_UPACHAYA_HOUSES,
    SEVEN_PLANETS,
    SEVVAI_BENEFIC_REDUCERS,
    TAMIL_SEVVAI_HOUSES,
    TRIKONA_HOUSES,
    DoshamResult,
    YogaResult,
    _build_dosham_explanations,
    _house_lord,
    _is_active,
    _is_functional_benefic,
    _is_kendra_from,
    _is_seventh_aspect,
    _marker_explain,
    _marker_explain_ta,
    _planet_is_strong,
    _planet_rasi,
    _planets_as_rasi_map,
    _strong_planet_house,
)

from app.calculations._yoga_dosham import (
    detect_badhaka_dosham,
    detect_kalasarpa,
    detect_kalathra_dosham,
    detect_pitru_dosham,
    detect_putra_sarpa_dosham,
    detect_rahu_ketu_dosham,
    detect_sevvai_dosham,
    get_badhaka_lord,
)

from app.calculations._yoga_detect import (
    NakshatraCautionResult,
    ParivartanaResult,
    _merge_yoga_list,
    _parivartana_as_yogas,
    detect_adhi_yoga,
    detect_amala_yoga,
    detect_budha_aditya,
    detect_chandra_mangala,
    detect_chandala_yoga,
    detect_daridra_yoga,
    detect_dhana_yoga,
    detect_gaja_kesari,
    detect_kemadruma_yoga,
    detect_lakshmi_yoga,
    detect_nakshatra_cautions,
    detect_neecha_bhanga,
    detect_pancha_mahapurusha,
    detect_parivartana,
    detect_raja_yoga,
    detect_sakata_yoga,
    detect_sunapha_anapha_durudhura,
    detect_vasumati_yoga,
    detect_vipareetha_raja,
)

from app.calculations.chart_strength import SIGN_LORD


def detect_yogas_and_doshams(
    planets: Mapping[str, PlanetInput],
    lagna_rasi: int,
    moon_rasi: int,
    *,
    active_lords: Iterable[str] | None = None,
    current_maha_lord: str | None = None,
    sevvai_mode: str = "tamil_standard",
    gender: str | None = None,
    partner_has_sevvai_dosham: bool = False,
    combust_planets: frozenset[str] = frozenset(),
    retrograde_planets: frozenset[str] = frozenset(),
    janma_nakshatra: int | None = None,
    d9_rasi_map: Mapping[str, int] | None = None,
    d9_lagna_rasi: int | None = None,
    bhava_chalit_map: Mapping[str, int] | None = None,
) -> tuple[list[YogaResult], list[DoshamResult], list[NakshatraCautionResult]]:
    _ = bhava_chalit_map
    planets_rasi = _planets_as_rasi_map(planets)
    lagna_nature_map = {
        planet: get_functional_nature(lagna_rasi, planet).value
        for planet in planets_rasi
    }
    planet_scores = {
        planet: int(value.get("strength_score", 50))
        if isinstance(value, Mapping)
        else 50
        for planet, value in planets.items()
    }
    yogas: list[YogaResult] = []
    yogas.append(detect_gaja_kesari(planets, moon_rasi, active_lords=active_lords))
    raja_list = detect_raja_yoga(planets, lagna_rasi, active_lords=active_lords)

    parivartana = detect_parivartana(planets, lagna_rasi)
    active_set = set(active_lords or ())
    resolved_maha_lord = current_maha_lord or (sorted(active_set)[0] if active_set else "")
    for pv in parivartana:
        if pv.sub_type == "MAHA":
            p1_house = house_from_reference(lagna_rasi, _planet_rasi(planets, pv.planet_a))  # noqa: F841
            p2_house = house_from_reference(lagna_rasi, _planet_rasi(planets, pv.planet_b))  # noqa: F841
            kendra_trikona = KENDRA_HOUSES | TRIKONA_HOUSES  # noqa: F841
            kendra_lords = {_house_lord(lagna_rasi, h) for h in (1, 4, 7, 10)}
            trikona_lords = {_house_lord(lagna_rasi, h) for h in (1, 5, 9)}
            if pv.planet_a in kendra_lords and pv.planet_b in trikona_lords or \
               pv.planet_b in kendra_lords and pv.planet_a in trikona_lords:
                raja_list.append(YogaResult(
                    name="RAJA_YOGA",
                    is_present=True,
                    strength="STRONG",
                    conditions_met=[f"{pv.planet_a.lower()}_{pv.planet_b.lower()}_parivartana_link"],
                    cancellation_factors=[],
                    dasha_activated=_is_active(active_set, pv.planet_a, pv.planet_b),
                    description_ta="திரிகோண-கேந்திர அதிபதிகளின் பரிவர்தனம் ராஜயோகமாக கருதப்படுகிறது.",
                    description_en="Parivartana between Trikona and Kendra lords is treated as Raja Yoga.",
                ))

    yogas.append(
        _merge_yoga_list(raja_list, "RAJA_YOGA")
        if raja_list
        else YogaResult(
            name="RAJA_YOGA",
            is_present=False,
            strength="WEAK",
            conditions_met=[],
            cancellation_factors=[],
            dasha_activated=False,
            description_ta="திரிகோண-கேந்திர அதிபதி இணைப்பு இல்லை.",
            description_en="No Trikona-Kendra lord linkage found.",
        )
    )
    yogas.append(detect_dhana_yoga(planets, lagna_rasi, active_lords=active_lords))
    neecha_list = detect_neecha_bhanga(
        planets, lagna_rasi,
        active_lords=active_lords,
        retrograde_planets=retrograde_planets,
        d9_rasi_map=d9_rasi_map,
        d9_lagna_rasi=d9_lagna_rasi,
    )
    yogas.append(
        _merge_yoga_list(neecha_list, "NEECHA_BHANGA_RAJA_YOGA")
        if neecha_list
        else YogaResult(
            name="NEECHA_BHANGA_RAJA_YOGA",
            is_present=False,
            strength="WEAK",
            conditions_met=[],
            cancellation_factors=[],
            dasha_activated=False,
            description_ta="நீச பங்க நிலை இல்லை.",
            description_en="No Neecha Bhanga condition present.",
        )
    )

    yogas.extend(detect_pancha_mahapurusha(planets, lagna_rasi, active_lords=active_lords))
    yogas.append(detect_budha_aditya(planets, combust_planets=combust_planets, active_lords=active_lords))
    yogas.append(detect_vipareetha_raja(planets, lagna_rasi, active_lords=active_lords))

    pv_yogas = _parivartana_as_yogas(parivartana, active_set)
    if pv_yogas:
        yogas.extend(pv_yogas)
    else:
        yogas.append(YogaResult(
            name="PARIVARTANA_YOGA",
            is_present=False,
            strength="WEAK",
            conditions_met=[],
            cancellation_factors=[],
            dasha_activated=False,
            description_ta="பரிவர்தன யோகம் — இரண்டு கிரகங்கள் ஒருவருக்கொருவர் ஆட்சி ராசியில் இல்லை.",
            description_en="No Parivartana Yoga present.",
        ))

    yogas.append(detect_chandra_mangala(planets, active_lords=active_lords))
    yogas.append(detect_sakata_yoga(moon_rasi, planets_rasi.get("JUPITER", moon_rasi), lagna_rasi))
    yogas.append(detect_kemadruma_yoga(planets_rasi, moon_rasi, lagna_rasi))
    yogas.append(detect_chandala_yoga(planets_rasi.get("JUPITER", moon_rasi), planets_rasi.get("RAHU", moon_rasi)))
    yogas.append(detect_amala_yoga(planets_rasi, lagna_rasi, moon_rasi, lagna_nature_map))
    yogas.append(detect_adhi_yoga(planets_rasi, moon_rasi, lagna_nature_map))
    yogas.append(detect_daridra_yoga(planets_rasi, lagna_rasi, planet_scores))
    yogas.append(detect_lakshmi_yoga(planets_rasi, lagna_rasi, planet_scores))
    yogas.extend(detect_sunapha_anapha_durudhura(planets_rasi, moon_rasi))
    yogas.append(detect_vasumati_yoga(planets_rasi, moon_rasi))

    kalasarpa = detect_kalasarpa(planets)
    kalasarpa_label = "KALA_SARPA_DOSHAM_CANDIDATE" if kalasarpa.is_present else "NO_DOSHAM"
    kalasarpa_explanations = _build_dosham_explanations(
        "KALASARPA",
        kalasarpa_label,
        conditions_met=kalasarpa.conditions_met,
        cancellation_factors=[],
        missing_data=[],
    )
    doshams: list[DoshamResult] = [
        detect_sevvai_dosham(
            planets,
            lagna_rasi,
            sevvai_mode=sevvai_mode,
            gender=gender,
            partner_has_sevvai_dosham=partner_has_sevvai_dosham,
            active_lords=active_lords,
            combust_planets=combust_planets,
            d9_rasi_map=d9_rasi_map,
            d9_lagna_rasi=d9_lagna_rasi,
        ),
        detect_rahu_ketu_dosham(
            planets,
            lagna_rasi,
            gender=gender,
            active_lords=active_lords,
            combust_planets=combust_planets,
            d9_rasi_map=d9_rasi_map,
            d9_lagna_rasi=d9_lagna_rasi,
        ),
        detect_pitru_dosham(
            planets,
            lagna_rasi,
            active_lords=active_lords,
        ),
        detect_kalathra_dosham(
            planets,
            lagna_rasi,
            active_lords=active_lords,
            d9_rasi_map=d9_rasi_map,
        ),
        detect_putra_sarpa_dosham(
            planets_rasi,
            lagna_rasi,
            planet_scores=planet_scores,
        ),
        detect_badhaka_dosham(
            planets_rasi,
            lagna_rasi,
            planet_scores,
            resolved_maha_lord,
        ),
        DoshamResult(
            name="KALASARPA",
            is_present=kalasarpa.is_present,
            is_cancelled=False,
            strength="PARTIAL" if kalasarpa.is_present else "WEAK",
            label=kalasarpa_label,
            category="KALA_SARPA",
            conditions_met=kalasarpa.conditions_met,
            cancellation_factors=[],
            missing_data=[],
            dasha_activated=_is_active(set(active_lords or ()), "RAHU", "KETU"),
            description_ta=kalasarpa.description_ta,
            description_en=kalasarpa.description_en,
            explanation_what_ta=kalasarpa_explanations[0],
            explanation_what_en=kalasarpa_explanations[1],
            explanation_why_ta=kalasarpa_explanations[2],
            explanation_why_en=kalasarpa_explanations[3],
            explanation_how_ta=kalasarpa_explanations[4],
            explanation_how_en=kalasarpa_explanations[5],
        ),
    ]

    nakshatra_cautions = detect_nakshatra_cautions(janma_nakshatra) if janma_nakshatra is not None else []
    return yogas, doshams, nakshatra_cautions
