"""Yoga and dosham detection facade — public API for the astrology calculation layer.

Internal logic is split across three private sub-modules:
  _yoga_helpers.py  — shared constants, dataclasses, and utilities
  _yoga_dosham.py   — dosham detection (Sevvai, Rahu/Ketu, Pitru, Kalasarpa, Kalathra, …)
  _yoga_detect.py   — yoga detection (Gaja Kesari, Raja, Dhana, Pancha Mahapurusha, …)
"""
from __future__ import annotations

from collections.abc import Iterable, Mapping

# ── Re-export everything from sub-modules so callers don't need to change ──────
# The names below are imported to be re-exported, not because this file uses
# them. `__all__` at the foot of this module is what keeps Ruff from deleting
# them as F401 — see docs/AUDIT_TRIAGE_2026-08-31.md §1.1.
from app.calculations._yoga_detect import (
    NakshatraCautionResult,
    ParivartanaResult,
    _merge_yoga_list,
    _nodes_with,
    _parivartana_as_yogas,
    detect_adhi_base,
    detect_adhi_raja_grade,
    detect_adhi_yoga,
    detect_amala_yoga,
    detect_bhagya_support,
    detect_budha_aditya,
    detect_chandala_yoga,
    detect_chandala_yoga_ketu_variant,
    detect_chandra_mangala,
    detect_daridra_yoga,
    detect_daridra_yoga_proxy,
    detect_dhana_yoga,
    detect_dhana_yoga_supportive,
    detect_gaja_kesari,
    detect_gaja_kesari_parashara,
    detect_kartari_yoga,
    detect_kemadruma_yoga,
    detect_lakshmi_yoga,
    detect_lakshmi_yoga_phaladeepika,
    detect_nakshatra_cautions,
    detect_neecha_bhanga,
    detect_pancha_mahapurusha,
    detect_parivartana,
    detect_raja_yoga,
    detect_raja_yogakaraka,
    detect_retrograde_debilitated_raja_yoga,
    detect_sakata_yoga,
    detect_sunapha_anapha_durudhura,
    detect_vasumati_yoga,
    detect_vipareetha_raja,
    raja_lord_sets,
)
from app.calculations._yoga_dosham import (
    detect_badhaka_dosham,
    detect_kalasarpa,
    detect_kalathra_dosham,
    detect_marana_karaka_sthana,
    detect_pitru_dosham,
    detect_putra_sarpa_dosham,
    detect_rahu_ketu_dosham,
    detect_sevvai_dosham,
    get_badhaka_lord,
)
from app.calculations._yoga_helpers import (
    FEMALE_HIGH_ATTENTION_SEVVAI_HOUSES,
    HOUSE_SIGN_NIVARTHI,
    KADAGAM_SIMMAM_LAGNA_EXCEPTION,
    KENDRA_HOUSES,
    MALE_HIGH_ATTENTION_SEVVAI_HOUSES,
    NATURAL_BENEFICS,
    NATURAL_MALEFICS,
    RAHU_KETU_MARRIAGE_HOUSES,
    SEVEN_PLANETS,
    SEVVAI_BENEFIC_REDUCERS,
    TAMIL_SEVVAI_HOUSES,
    TRIKONA_HOUSES,
    DoshamResult,
    KalasarpaResult,
    PlanetInput,
    YogaResult,
    _build_dosham_explanations,
    _house_lord,
    _is_active,
    _is_functional_benefic,
    _is_kendra_from,
    _marker_explain,
    _marker_explain_ta,
    _planet_is_strong,
    _planet_rasi,
    _planets_as_rasi_map,
    _strong_planet_house,
)
from app.calculations.aspects import moon_is_natural_benefic
from app.calculations.astro import house_from_reference
from app.calculations.chart_strength import SIGN_LORD
from app.calculations.doctrine_options import DEFAULT_DOCTRINE, DoctrineOptions, validated
from app.calculations.functional_nature import get_functional_nature
from app.calculations.functional_status import raja_grade


def detect_yogas_and_doshams(
    planets: Mapping[str, PlanetInput],
    lagna_rasi: int,
    moon_rasi: int,
    *,
    active_lords: Iterable[str] | None = None,
    current_maha_lord: str | None = None,
    gender: str | None = None,
    partner_has_sevvai_dosham: bool = False,
    combust_planets: frozenset[str] = frozenset(),
    retrograde_planets: frozenset[str] = frozenset(),
    janma_nakshatra: int | None = None,
    d9_rasi_map: Mapping[str, int] | None = None,
    d9_lagna_rasi: int | None = None,
    equal_bhava_map: Mapping[str, int] | None = None,
    planet_scores_in: Mapping[str, int] | None = None,
    longitudes_in: Mapping[str, float] | None = None,
    doctrine: DoctrineOptions = DEFAULT_DOCTRINE,
) -> tuple[list[YogaResult], list[DoshamResult], list[NakshatraCautionResult]]:
    _ = equal_bhava_map
    doctrine = validated(doctrine)
    planets_rasi = _planets_as_rasi_map(planets)
    if longitudes_in and {"SUN", "MOON"} <= set(longitudes_in):
        # DD-12: the Moon's natural class from its elongation, with exact
        # amavasya (not benefic) and pournami (benefic) boundaries. This is the
        # *class* only — Kala Bala's paksha term is computed elsewhere and does
        # not read it.
        paksha_is_shukla: bool | None = moon_is_natural_benefic(
            longitudes_in["MOON"] - longitudes_in["SUN"],
            legacy_72_degree=doctrine.moon_72_degree_convention,
        )
    else:
        # The shared classifier can derive this rasi-only fallback itself; keep
        # the decision here explicit because this facade owns chart context.
        paksha_is_shukla = None
    lagna_nature_map = {
        planet: get_functional_nature(lagna_rasi, planet, node_rasi_map=planets_rasi).value
        for planet in planets_rasi
    }
    # Degree-based composite strength scores. Production call sites pass a
    # rasi-only `planets` map, so the embedded-Mapping fallback below yields a
    # uniform 50 for every planet — which silently kills strength-gated rules
    # (Lakshmi, Daridra, Putra-Sarpa, Badhaka). Prefer the explicit
    # `planet_scores_in` threaded from the real chart-strength computation.
    if planet_scores_in is not None:
        planet_scores = {
            planet: int(score) if score is not None else 50
            for planet, score in planet_scores_in.items()
        }
    else:
        planet_scores = {
            planet: int(value.get("strength_score", 50))
            if isinstance(value, Mapping)
            else 50
            for planet, value in planets.items()
        }
    yogas: list[YogaResult] = []
    gaja_kesari_strict = detect_gaja_kesari_parashara(
        planets, lagna_rasi, moon_rasi, active_lords=active_lords,
        planet_scores=planet_scores, combust_planets=combust_planets,
        paksha_is_shukla=paksha_is_shukla,
        moon_counts_as_support=doctrine.o22_gk_moon_as_support,
    )
    yogas.append(gaja_kesari_strict)
    yogas.append(detect_gaja_kesari(
        planets, moon_rasi, active_lords=active_lords,
        planet_scores=planet_scores, combust_planets=combust_planets,
        lagna_rasi=lagna_rasi, d9_rasi_map=d9_rasi_map,
        d9_lagna_rasi=d9_lagna_rasi, doctrine=doctrine,
        strict_form_present=gaja_kesari_strict.is_present,
    ))
    raja_list = detect_raja_yoga(
        planets, lagna_rasi, active_lords=active_lords,
        planet_scores=planet_scores, combust_planets=combust_planets,
        doctrine=doctrine,
    )

    parivartana = detect_parivartana(planets, lagna_rasi)
    active_set = set(active_lords or ())
    resolved_maha_lord = current_maha_lord or (sorted(active_set)[0] if active_set else "")
    kendra_lords, trikona_lords = raja_lord_sets(lagna_rasi, doctrine)
    for pv in parivartana:
        if pv.sub_type == "MAHA":
            if pv.planet_a in kendra_lords and pv.planet_b in trikona_lords or \
               pv.planet_b in kendra_lords and pv.planet_a in trikona_lords:
                grade = raja_grade(lagna_rasi, pv.planet_a, pv.planet_b)
                raja_list.append(YogaResult(
                    name="RAJA_YOGA",
                    is_present=True,
                    strength="STRONG",
                    conditions_met=[
                        f"{pv.planet_a.lower()}_{pv.planet_b.lower()}_parivartana_link",
                        f"raja_grade_{grade.lower()}",
                    ],
                    cancellation_factors=[],
                    dasha_activated=_is_active(active_set, pv.planet_a, pv.planet_b),
                    key_grahas=(pv.planet_a, pv.planet_b),  # ruling 2026-09-23: this instance's formers
                    supporting_grahas=_nodes_with(
                        planets, _planet_rasi(planets, pv.planet_a), _planet_rasi(planets, pv.planet_b),
                    ),
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
    yogas.append(detect_raja_yogakaraka(
        planets, lagna_rasi, active_lords=active_lords,
        planet_scores=planet_scores, combust_planets=combust_planets,
        d9_rasi_map=d9_rasi_map, d9_lagna_rasi=d9_lagna_rasi,
        doctrine=doctrine,
    ))
    yogas.append(detect_dhana_yoga(
        planets, lagna_rasi, active_lords=active_lords,
        planet_scores=planet_scores, combust_planets=combust_planets,
    ))
    yogas.append(detect_dhana_yoga_supportive(
        planets, lagna_rasi, active_lords=active_lords,
        planet_scores=planet_scores, combust_planets=combust_planets,
    ))
    neecha_list = detect_neecha_bhanga(
        planets, lagna_rasi,
        active_lords=active_lords,
        retrograde_planets=retrograde_planets,
        d9_rasi_map=d9_rasi_map,
        d9_lagna_rasi=d9_lagna_rasi,
        doctrine=doctrine,
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
    if doctrine.o11_retrograde_debilitated_raja_yoga:
        retrograde_neecha = detect_retrograde_debilitated_raja_yoga(
            planets, lagna_rasi,
            active_lords=active_lords,
            retrograde_planets=retrograde_planets,
            combust_planets=combust_planets,
            doctrine=doctrine,
        )
        yogas.append(
            _merge_yoga_list(retrograde_neecha, "RETROGRADE_DEBILITATED_RAJA_YOGA")
            if retrograde_neecha
            else YogaResult(
                name="RETROGRADE_DEBILITATED_RAJA_YOGA",
                is_present=False,
                strength="WEAK",
                conditions_met=[],
                cancellation_factors=[],
                dasha_activated=False,
                description_ta="வக்ர நீச கிரக ராஜயோக விதி நிறைவேறவில்லை.",
                description_en="The retrograde debilitated-planet raja-yoga rule is not met.",
            )
        )

    yogas.extend(detect_pancha_mahapurusha(
        planets, lagna_rasi, active_lords=active_lords,
        planet_scores=planet_scores, combust_planets=combust_planets,
    ))
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

    yogas.append(detect_chandra_mangala(
        planets, active_lords=active_lords,
        planet_scores=planet_scores, combust_planets=combust_planets,
    ))
    yogas.append(detect_sakata_yoga(moon_rasi, planets_rasi.get("JUPITER", moon_rasi), lagna_rasi))
    yogas.append(detect_kemadruma_yoga(planets_rasi, moon_rasi, lagna_rasi))
    yogas.append(detect_chandala_yoga(planets_rasi.get("JUPITER", moon_rasi), planets_rasi.get("RAHU", moon_rasi)))
    yogas.append(detect_chandala_yoga_ketu_variant(planets_rasi.get("JUPITER", moon_rasi), planets_rasi.get("KETU", moon_rasi)))
    yogas.append(detect_amala_yoga(
        planets_rasi, lagna_rasi, moon_rasi, lagna_nature_map, paksha_is_shukla=paksha_is_shukla,
    ))
    adhi_raja = detect_adhi_raja_grade(
        planets_rasi, moon_rasi, paksha_is_shukla=paksha_is_shukla,
        planet_scores=planet_scores, combust_planets=combust_planets,
        moon_secondary=doctrine.o16_moon_secondary_activator,
        include_malefic_aspects=doctrine.o20_adhi_raja_malefic_aspects,
    )
    yogas.append(detect_adhi_base(
        planets_rasi, moon_rasi, lagna_nature_map, paksha_is_shukla=paksha_is_shukla,
        planet_scores=planet_scores, combust_planets=combust_planets,
        moon_secondary=doctrine.o16_moon_secondary_activator,
        raja_grade_present=adhi_raja.is_present,
    ))
    yogas.append(adhi_raja)
    yogas.append(detect_daridra_yoga(planets_rasi, lagna_rasi, planet_scores))
    yogas.append(detect_daridra_yoga_proxy(planets_rasi, lagna_rasi, planet_scores))
    yogas.append(detect_lakshmi_yoga(
        planets_rasi, lagna_rasi, planet_scores, combust_planets=combust_planets,
        d9_rasi_map=d9_rasi_map, d9_lagna_rasi=d9_lagna_rasi, doctrine=doctrine,
    ))
    bhagya = detect_bhagya_support(
        planets_rasi, lagna_rasi, planet_scores, combust_planets=combust_planets,
        d9_rasi_map=d9_rasi_map, d9_lagna_rasi=d9_lagna_rasi, doctrine=doctrine,
    )
    if bhagya is not None:
        yogas.append(bhagya)
    if doctrine.show_lakshmi_phaladeepika:
        lakshmi_pd = detect_lakshmi_yoga_phaladeepika(
            planets_rasi, lagna_rasi, planet_scores, combust_planets=combust_planets,
        )
        if lakshmi_pd is not None:
            yogas.append(lakshmi_pd)
    yogas.extend(detect_sunapha_anapha_durudhura(
        planets_rasi, moon_rasi, moon_secondary=doctrine.o16_moon_secondary_activator,
    ))
    yogas.append(detect_vasumati_yoga(
        planets_rasi, moon_rasi, lagna_rasi, paksha_is_shukla=paksha_is_shukla,
        planet_scores=planet_scores,
    ))
    yogas.append(detect_kartari_yoga(
        planets_rasi, lagna_rasi, "LAGNA", paksha_is_shukla=paksha_is_shukla,
        planet_scores=planet_scores,
    ))

    # Doctrine A-4: Kala Sarpa is judged on actual longitudes where the caller
    # has them. `planets` is a rasi-only map at every production call site (the
    # same reason `planet_scores_in` exists), so the degrees are threaded
    # separately rather than inferred.
    kalasarpa = detect_kalasarpa(planets, lagna_rasi, longitudes=longitudes_in)
    kalasarpa_label = "KALA_SARPA_DOSHAM_CANDIDATE" if kalasarpa.is_present else "NO_DOSHAM"
    kalasarpa_explanations = _build_dosham_explanations(
        "KALASARPA",
        kalasarpa_label,
        conditions_met=kalasarpa.conditions_met,
        cancellation_factors=[],
        missing_data=[],
    )
    # When a named naga is identified, lead the "what" explanation with the
    # variant's meaning so the dosham card names the specific Kala Sarpa type.
    kalasarpa_what_ta = kalasarpa_explanations[0]
    kalasarpa_what_en = kalasarpa_explanations[1]
    if kalasarpa.variant != "NONE":
        kalasarpa_what_ta = f"{kalasarpa.variant_ta}: {kalasarpa.meaning_ta}"
        kalasarpa_what_en = f"{kalasarpa.variant_en} Kala Sarpa: {kalasarpa.meaning_en}"
    doshams: list[DoshamResult] = [
        detect_sevvai_dosham(
            planets,
            lagna_rasi,
            gender=gender,
            partner_has_sevvai_dosham=partner_has_sevvai_dosham,
            active_lords=active_lords,
            combust_planets=combust_planets,
            d9_rasi_map=d9_rasi_map,
            d9_lagna_rasi=d9_lagna_rasi,
            doctrine=doctrine,
        ),
        detect_rahu_ketu_dosham(
            planets,
            lagna_rasi,
            active_lords=active_lords,
            combust_planets=combust_planets,
            moon_benefic=paksha_is_shukla,
            planet_scores=planet_scores,
            doctrine=doctrine,
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
        detect_marana_karaka_sthana(
            planets,
            lagna_rasi,
            active_lords=active_lords,
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
            explanation_what_ta=kalasarpa_what_ta,
            explanation_what_en=kalasarpa_what_en,
            variant_ta=kalasarpa.variant_ta,
            variant_en=kalasarpa.variant_en,
            explanation_why_ta=kalasarpa_explanations[2],
            explanation_why_en=kalasarpa_explanations[3],
            explanation_how_ta=kalasarpa_explanations[4],
            explanation_how_en=kalasarpa_explanations[5],
        ),
    ]

    nakshatra_cautions = detect_nakshatra_cautions(janma_nakshatra) if janma_nakshatra is not None else []
    return yogas, doshams, nakshatra_cautions


# The facade's public surface. This exists so Ruff can see that the imports
# above are re-exports rather than F401 unused-imports — deleting them breaks
# app/calculations/remedies.py, app/services/_chart_build.py and six test
# modules. See docs/AUDIT_TRIAGE_2026-08-31.md §1.1.
__all__ = [
    "DoshamResult",
    "FEMALE_HIGH_ATTENTION_SEVVAI_HOUSES",
    "HOUSE_SIGN_NIVARTHI",
    "KADAGAM_SIMMAM_LAGNA_EXCEPTION",
    "KENDRA_HOUSES",
    "KalasarpaResult",
    "MALE_HIGH_ATTENTION_SEVVAI_HOUSES",
    "NATURAL_BENEFICS",
    "NATURAL_MALEFICS",
    "NakshatraCautionResult",
    "ParivartanaResult",
    "PlanetInput",
    "RAHU_KETU_MARRIAGE_HOUSES",
    "SEVEN_PLANETS",
    "SEVVAI_BENEFIC_REDUCERS",
    "SIGN_LORD",
    "TAMIL_SEVVAI_HOUSES",
    "TRIKONA_HOUSES",
    "YogaResult",
    "_build_dosham_explanations",
    "_house_lord",
    "_is_active",
    "_is_functional_benefic",
    "_is_kendra_from",
    "_marker_explain",
    "_marker_explain_ta",
    "_merge_yoga_list",
    "_parivartana_as_yogas",
    "_planet_is_strong",
    "_planet_rasi",
    "_planets_as_rasi_map",
    "_strong_planet_house",
    "detect_adhi_yoga",
    "detect_adhi_base",
    "detect_adhi_raja_grade",
    "detect_amala_yoga",
    "detect_bhagya_support",
    "detect_badhaka_dosham",
    "detect_budha_aditya",
    "detect_chandala_yoga",
    "detect_chandala_yoga_ketu_variant",
    "detect_chandra_mangala",
    "detect_daridra_yoga",
    "detect_daridra_yoga_proxy",
    "detect_dhana_yoga",
    "detect_dhana_yoga_supportive",
    "detect_gaja_kesari",
    "detect_gaja_kesari_parashara",
    "detect_kalasarpa",
    "detect_kalathra_dosham",
    "detect_kartari_yoga",
    "detect_kemadruma_yoga",
    "detect_lakshmi_yoga",
    "detect_lakshmi_yoga_phaladeepika",
    "detect_marana_karaka_sthana",
    "detect_nakshatra_cautions",
    "detect_neecha_bhanga",
    "detect_pancha_mahapurusha",
    "detect_parivartana",
    "detect_pitru_dosham",
    "detect_putra_sarpa_dosham",
    "detect_rahu_ketu_dosham",
    "detect_raja_yoga",
    "detect_raja_yogakaraka",
    "detect_retrograde_debilitated_raja_yoga",
    "raja_lord_sets",
    "detect_sakata_yoga",
    "detect_sevvai_dosham",
    "detect_sunapha_anapha_durudhura",
    "detect_vasumati_yoga",
    "detect_vipareetha_raja",
    "detect_yogas_and_doshams",
    "get_badhaka_lord",
    "get_functional_nature",
    "house_from_reference",
]
