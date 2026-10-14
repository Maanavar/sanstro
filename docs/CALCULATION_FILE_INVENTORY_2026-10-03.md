# Calculation File Inventory — where every formula lives

**Date:** 2026-10-03 · **Branch:** `harden/production-readiness` · **Scope:** backend `app/`, plus client-side derivation in `packages/shared` and `web/lib`

This is a map of every file that **calculates, scores, detects or decides** something astrological: the chart, yogams, doshams, fortunes (palan), cautions, remedies, panchangam, muhurtham, matching, dashas, transits and numerology. Each entry names the file, its size, and the functional sections inside it. A file that holds more than one area gets one bullet per section.

How it was built: an AST walk of every module (module docstring, public functions and classes, and the private helpers and constant tables of the large files). Function names are quoted exactly as they appear in the code, so you can grep them.

**What this does not list:** plumbing with no astrology in it (auth, email, encryption, journal CRUD, goals, streaks, notification dispatch, FCM, audit log, settings, job registry, acquisition). See [§18](#18-excluded--no-calculation-inside).

---

## Contents

1. [Layering — how a prediction flows](#1-layering--how-a-prediction-flows)
2. [Astronomical foundation & chart construction](#2-astronomical-foundation--chart-construction)
3. [Planet & house strength](#3-planet--house-strength)
4. [Yogams](#4-yogams)
5. [Doshams](#5-doshams)
6. [Dasha systems](#6-dasha-systems)
7. [Transits (Gocharam), Sade Sati & Peyarchi](#7-transits-gocharam-sade-sati--peyarchi)
8. [Panchangam & Tamil calendar](#8-panchangam--tamil-calendar)
9. [Muhurtham & activity timing](#9-muhurtham--activity-timing)
10. [Daily fortune (palan) & life-area predictions](#10-daily-fortune-palan--life-area-predictions)
11. [Cautions — "Chances & Cautions" and caution windows](#11-cautions--chances--cautions-and-caution-windows)
12. [Remedies (Parigaram)](#12-remedies-parigaram)
13. [Compatibility & matching (Porutham)](#13-compatibility--matching-porutham)
14. [Readings, explanations & the reasoning kernel](#14-readings-explanations--the-reasoning-kernel)
15. [Special charts — Varshaphala, Prasna, Rectification](#15-special-charts--varshaphala-prasna-rectification)
16. [Numerology](#16-numerology)
17. [Client-side derivation (web & shared)](#17-client-side-derivation-web--shared)
18. [Excluded — no calculation inside](#18-excluded--no-calculation-inside)
19. [Hot spots for a lead](#19-hot-spots-for-a-lead)

---

## 1. Layering — how a prediction flows

```
Swiss Ephemeris ─► app/calculations/ephemeris.py, astro.py          (longitudes, lagna, sunrise, JD)
                 ─► app/services/_chart_planets.py, _chart_build.py  (assemble the chart)
                 ─► app/calculations/*                               (pure rules: strength, yogas, doshams, dashas, panchangam …)
                 ─► app/reasoning/*                                  (promise gate → timing vote → verdict band)
                 ─► app/services/*_service.py                        (compose per surface: daily, life areas, readings …)
                 ─► app/services/narrative_engine.py, safety_filter  (bilingual prose + tone check)
                 ─► app/api/ ─► packages/shared/src/api/ ─► web/, mobile/
```

Rule of thumb: **`app/calculations/` holds the doctrine** (pure functions, no DB). **`app/services/` orchestrates and scores per surface**, and several services carry their own scoring tables (flagged ⚠ below). **`app/data/` holds sourced rule tables** (Kalaprakasika, almanac sheets).

---

## 2. Astronomical foundation & chart construction

### [app/calculations/ephemeris.py](../app/calculations/ephemeris.py) — 594 lines
- **Ayanamsa:** `set_lahiri_ayanamsa`, `get_lahiri_ayanamsa_ut` (Lahiri)
- **Planet positions:** `calculate_sidereal_planets`, `calculate_sun_moon_longitudes` (hot-path), `sun_longitude_at_jd`, `saturn_longitude_at_jd`
- **Lagna & MC:** `calculate_lagna_degree`, `calculate_asc_mc`
- **Sunrise / sunset:** `calculate_rise_transit_jd`, `SunriseConvention` (apparent upper limb + refraction, ruling 2026-09-29), `RiseTransitUndefinedError` (polar days)

### [app/calculations/astro.py](../app/calculations/astro.py) — 316 lines
- **Zodiac maths:** `normalize_longitude`, `rasi_from_degree`, `degree_in_rasi`, `resolve_rasi`, `house_from_reference`
- **Nakshatra & pada:** `nakshatra_from_degree`, `pada_from_degree`, `nakshatra_to_rasi`
- **Navamsa:** `navamsa_rasi_from_degree`, `navamsa_rasi_from_nakshatra_pada`
- **Chandrashtamam:** `chandrashtama_rasi_from_janma`, `is_chandrashtama`, `chandrashtama_janma_angle`, `chandrashtama_janma_nakshatra`
- **Time & Julian Day:** `local_datetime_to_utc`, `resolve_timezone`, `utc_datetime_to_julian_day` (Meeus), `julian_day_to_utc_datetime`, `round_to_nearest_minute`, `format_clock_hhmm`

### [app/calculations/divisional_charts.py](../app/calculations/divisional_charts.py) — 291 lines
- **Vargas:** `compute_d2` (Hora), `d3`, `d4`, `d7`, `d10`, `d12`, `d16`, `d20`, `d24`, `d27`, `d30`, `d40`, `d45`, `d60`; dispatcher `get_varga`

### [app/calculations/aspects.py](../app/calculations/aspects.py) — 229 lines
- **Drishti (aspects):** `aspect_strength` (0/¼/½/¾/full), `aspect_houses`, `aspects_house`, `aspect_target_rasis`; a single special-aspect table for Mars, Jupiter and Saturn
- **Benefic/malefic class:** `moon_is_natural_benefic` (by Sun–Moon elongation, DD-12), `effective_natural_class`

### [app/calculations/birth_conditions.py](../app/calculations/birth_conditions.py) — 495 lines ("Border Alert")
- **Tithi from longitudes:** `tithi_number_from_longitudes`
- **Sankranti birth:** `sun_rasi_day_bounds`, `is_sankranti_birth`
- **Grahana (eclipse) birth:** `detect_grahana_birth`
- **Dagda (burnt) rasi:** `dagda_rasi`
- **Roll-up & strength penalty:** `detect_birth_conditions`, `birth_condition_strength_penalties` (EC-7.2)

### [app/calculations/lagna_edge.py](../app/calculations/lagna_edge.py) — 188 lines
- **Lagna sign-edge warning:** `lagna_edge_note`, `lagna_edge_note_for_profile` (the lagna would change within the birth-time error window)
- **D9 lagna edge:** `navamsa_lagna_edge_note`, `navamsa_lagna_edge_note_for_profile`

### [app/calculations/nakshatra_analysis.py](../app/calculations/nakshatra_analysis.py) — 99 lines
- **Dispositor chain:** `build_dispositor_chain`
- **Pushkara:** `pushkara_check`
- **Gandanta:** `gandanta_detail`

### [app/services/_chart_planets.py](../app/services/_chart_planets.py) — 676 lines
- **Per-planet derivation:** vargas, varga reliability, nakshatra analysis, speed ratio, aspect counts, gana, nadi
- **Day/night birth:** `_sunrise_sunset_jd`, `resolve_daytime_birth` (feeds Kala Bala)
- **Vaara portion:** `classify_vaara_portion`
- **Maandhi / Gulika:** `MaandhiSpan`, `maandhi_span`, `_mandhi_longitude` (proportional nāzhigai, ruling 2026-09-29)

### [app/services/_chart_build.py](../app/services/_chart_build.py) — 1102 lines
- **Chart assembly:** `_chart_response_from_profile`, `_chart_response_from_record`
- **Birth panchangam signature:** `_birth_panchangam_signature`
- **Birth-condition penalties:** `_build_birth_conditions`, `_apply_birth_condition_penalties`
- **Holistic strength pass:** `_apply_holistic_strength_synthesis` (flag-gated)
- **Yoga/dosham insights & timing:** `_build_yoga_dosham_insights`, `_yoga_timing`, `_former_groups`, `_current_dasha_lords`

### [app/services/_chart_summary.py](../app/services/_chart_summary.py) — 473 lines
- **Chart summary:** `get_chart_summary`, `get_chart_summary_from_snapshot`
- **Jadhagam report:** `get_jadhagam_report`
- **Report tables:** `_functional_nature_table`, `_adhipathi_report`, `_ashtakavarga_table`, `_lagna_edge_text`

### Single-purpose foundation files

| File | Lines | Holds |
|---|---|---|
| [app/calculations/d9_chart.py](../app/calculations/d9_chart.py) | 45 | `calculate_d9_chart`: Navamsa snapshot |
| [app/calculations/equal_bhava.py](../app/calculations/equal_bhava.py) | 35 | `compute_equal_bhava`: equal houses from the lagna degree (not Sripati) |
| [app/calculations/nakshatra_lord_dynamics.py](../app/calculations/nakshatra_lord_dynamics.py) | 101 | `nakshatra_lord`, `nakshatra_lord_note`: how the star lord colours a planet |
| [app/calculations/jaimini_karakas.py](../app/calculations/jaimini_karakas.py) | 88 | `compute_char_karakas` (Atmakaraka…), `compute_karakamsa` |
| [app/calculations/display_names.py](../app/calculations/display_names.py) | 200 | Bilingual names for planet / rasi / nakshatra / tithi / Sani cycle (prose layer) |
| [app/constants/astrology.py](../app/constants/astrology.py) | 59 | `NAKSHATRA_NAMES`, `SIGN_LORD`: the single source of truth |
| [app/constants/versions.py](../app/constants/versions.py) | 95 | Calc-version and doctrine-version stamps |
| [app/services/_chart_persist.py](../app/services/_chart_persist.py) | 266 | `calculate_chart`, `calculate_chart_for_persisted_profile`: persist planets and the chart |
| [app/services/chart_service.py](../app/services/chart_service.py) | 32 | Facade over the four `_chart_*` modules |

---

## 3. Planet & house strength

### [app/calculations/chart_strength.py](../app/calculations/chart_strength.py) — 1324 lines
- **Navamsa dignity:** `d9_dignity_tier`, `d9_dignity_label`
- **Relationships:** `natural_relationship` (naisargika), `temporary_relationship` (tatkalika), `compound_relationship` (panchadha)
- **Graha yuddham:** `detect_planetary_wars`
- **Bhava bala:** `compute_bhava_bala`, `compute_all_bhava_bala` (0–100)
- **Six-component strength label set:** `compute_strength_breakdown` (sthana / dik / kala / chesta / naisargika / drik + baladi / jagradadi / deeptadi avasthas)
- **Natal planet score:** `compute_natal_planet_score`, `explain_natal_planet_score`, `ScoreContribution` (signed terms)
- **Yuti orb:** `yuti_orb_factor`
- **Neecha bhanga test (one planet):** `neecha_bhanga_cancelled`
- **Holistic second pass:** `apply_holistic_synthesis`

### [app/calculations/shadbala.py](../app/calculations/shadbala.py) — 620 lines
- **Full classical Shadbala:** `compute_shadbala`, `PlanetInput`, `ShadbalaContext`, `PlanetShadbala`
- **Astronomy helpers:** `declination_from_longitude`, `mean_obliquity` (IAU 1980)
- Service: [app/services/shadbala_service.py](../app/services/shadbala_service.py) (191 lines), `build_shadbala_response`

### [app/calculations/functional_nature.py](../app/calculations/functional_nature.py) — 411 lines
- **Functional benefic/malefic by lagna:** `derive_functional_nature`, `get_functional_nature`
- **Ownership helpers:** `owned_houses`, `house_of`, `is_dusthana_house`, `node_dispositor`
- **Score multipliers:** `get_transit_modifier`, `get_dasha_modifier`

### [app/calculations/functional_status.py](../app/calculations/functional_status.py) — 490 lines (DD-07 matrix)
- **12 lagnas × 7 lords status table:** `functional_status`, `derive_status` (validation oracle), `MatrixCell`
- **Yogakaraka:** `dual_lord_yogakaraka`, `kendradhipati_two_kendras`
- **Rahu/Ketu functioning:** `node_functional_context`
- **Raja Yoga eligibility:** `raja_participation`, `raja_grade`, `raja_relation`, `source_veto` (BPHS counter-examples), `RajaLineageException`

### [app/calculations/house_lords.py](../app/calculations/house_lords.py) — 207 lines
- **Adhipathi report:** `compute_house_lord_report`, `HouseLordReading`
- **House facts:** `house_rasi`, `house_significations`, `house_lord_title` ("பாக்கியாதிபதி")
- **Strength band:** `strength_band`

### [app/calculations/bhava_palan.py](../app/calculations/bhava_palan.py) — 717 lines (+ [bhava_palan_copy.py](../app/calculations/bhava_palan_copy.py), 289 lines of copy tables)
- **Banding:** `polarity_of`, `verdict_of`, `band_word` (dusthana inversion)
- **Attribution:** `dominant_term`, `DominantTerm`, `karaka_in_own_bhava`, `lord_dignity_of`
- **Build:** `build_palan`, `BhavaPalan`
- **Rendering:** `render_framing`, `render_why`, `render_conduct`, `render_karaka_note`, `render_contrast`, `render_polarity_note`

### [app/calculations/ashtakavarga.py](../app/calculations/ashtakavarga.py) — 195 lines
- **BAV:** `compute_bhinnashtakavarga`, `get_av_bindu`
- **SAV:** `compute_sarvashtakavarga`

### [app/calculations/bav_derived.py](../app/calculations/bav_derived.py) — 286 lines
- **Bindus counted from a karaka:** `rasi_from_planet`, `bav_house_from_planet`, `expected_bindus`, `classify_bindu_band`
- **Indications:** `compute_bav_derived_indications`, `disclosable_indications`, `factor_code`

### Single-purpose strength files

| File | Lines | Holds |
|---|---|---|
| [app/calculations/lagna_lord_strength.py](../app/calculations/lagna_lord_strength.py) | 94 | `lagna_lord_strength`: is the lagna lord balāḍhya? (DD-02) |
| [app/calculations/bhava_afflictions.py](../app/calculations/bhava_afflictions.py) | 159 | `assess_bhava_afflictions`, `affliction_dosham_strength`: malefic affliction on a house, its lord and its karaka |
| [app/calculations/planet_conditions.py](../app/calculations/planet_conditions.py) | 249 | `combust_meaning`, `retrograde_meaning`: plain-language condition effects |
| [app/calculations/maturation.py](../app/calculations/maturation.py) | 51 | `MATURATION_AGE`, `maturation_multiplier`, `maturation_status`: planet maturity ages |
| [app/calculations/karaka_chains.py](../app/calculations/karaka_chains.py) | 61 | `LIFE_AREA_KARAKA`: the classical karaka chain per life area (table only) |

---

## 4. Yogams

### [app/calculations/yogas.py](../app/calculations/yogas.py) — 541 lines (public facade)
- **Single entry point:** `detect_yogas_and_doshams`, which runs every detector below plus the doshams in §5

### [app/calculations/_yoga_detect.py](../app/calculations/_yoga_detect.py) — 1723 lines
- **Gaja Kesari:** `detect_gaja_kesari` (Raman form), `detect_gaja_kesari_parashara` (strict, DD-01)
- **Raja Yoga:** `detect_raja_yoga` (DD-07), `raja_lord_sets`, `detect_raja_yogakaraka`, `source_vetoed_raja_instance` (v1.7)
- **Dhana Yoga:** `detect_dhana_yoga`, `detect_dhana_yoga_supportive` (YOG-DN-02 proxy)
- **Neecha Bhanga Raja Yoga:** `detect_neecha_bhanga` (DD-09, O-13), `detect_retrograde_debilitated_raja_yoga`
- **Pancha Mahapurusha:** `detect_pancha_mahapurusha`
- **Budha-Aditya:** `detect_budha_aditya`
- **Vipareetha Raja:** `detect_vipareetha_raja`
- **Parivartana (exchange):** `detect_parivartana`, `ParivartanaResult`
- **Chandra-Mangala:** `detect_chandra_mangala`
- **Lakshmi Yoga:** `detect_lakshmi_yoga` (DD-02 Parashari), `detect_lakshmi_yoga_phaladeepika`, `detect_bhagya_support` (fallback)
- **Adhi Yoga:** `detect_adhi_base`, `detect_adhi_raja_grade`, `detect_adhi_yoga` (DD-08)
- **Moon-based:** `detect_sunapha_anapha_durudhura`, `detect_kemadruma_yoga`, `detect_sakata_yoga`, `detect_vasumati_yoga`, `detect_amala_yoga`
- **Adverse yogas:** `detect_kartari_yoga` (Papa/Shubha), `detect_chandala_yoga`, `detect_chandala_yoga_ketu_variant`, `detect_daridra_yoga`, `detect_daridra_yoga_proxy`
- **Nakshatra cautions:** `detect_nakshatra_cautions`, `NakshatraCautionResult`

### [app/calculations/_yoga_helpers.py](../app/calculations/_yoga_helpers.py) — 431 lines
- **Result types:** `YogaResult`, `DoshamResult`, `KalasarpaResult`
- **Strength gating:** `gate_yoga_strength` (downgrades a yoga by its key planets' condition)
- **Lordship helpers:** `houses_owned`, `raja_lord_qualifies`, `_house_lord`, `_is_kendra_from`, `_is_functional_benefic`, `_planet_is_strong`
- **Dosham explanations:** `_build_dosham_explanations`, `_marker_explain`, `_marker_explain_ta`

### [app/calculations/yoga_rules.py](../app/calculations/yoga_rules.py) — 1370 lines
- **Rule registry (one auditable row per yoga):** `YogaRule`, `rules_for_yoga`, `rule_ids_for_yoga`
- **Activation table:** `ActivationBasis` (DD-15), `activation_key_planets`

### [app/calculations/yoga_activation.py](../app/calculations/yoga_activation.py) — 150 lines
- **Which dasha activates a yoga:** `key_planets_for`
- **Timing state:** `activation_tier` (STRONG / MODERATE / NONE)
- **Intensity:** `yoga_activation_score` (0–100)

### [app/calculations/neecha_bhanga.py](../app/calculations/neecha_bhanga.py) — 283 lines
- **One rule per verse (DD-09):** `NeechaBhangaRule`, `evaluate_neecha_bhanga`, `NeechaBhangaEvaluation`
- **Grading:** `strength_for_points`

### [app/calculations/doctrine_options.py](../app/calculations/doctrine_options.py) — 267 lines
- **Doctrine switches (§16 open items O-1…):** `DoctrineOptions`, `validated`, `OpenItem`
- Runtime source: `current_doctrine_options` in [app/services/feature_flags.py](../app/services/feature_flags.py)

### Single-purpose yoga files

| File | Lines | Holds |
|---|---|---|
| [app/calculations/yoga_effects.py](../app/calculations/yoga_effects.py) | 257 | `yoga_effect`: a bilingual "so what" sentence per yoga code |

---

## 5. Doshams

### [app/calculations/_yoga_dosham.py](../app/calculations/_yoga_dosham.py) — 1208 lines
- **Sevvai (Chevvai / Mangal) Dosham:** `detect_sevvai_dosham`
- **Rahu–Ketu Dosham:** `detect_rahu_ketu_dosham` (DD-03), `_rk_lord_is_strong`
- **Pitru Dosham:** `detect_pitru_dosham`
- **Kala Sarpa:** `detect_kalasarpa` (arc test over seven grahas)
- **Kalathra Dosham:** `detect_kalathra_dosham` (7th lord in 6/8/12)
- **Putra Sarpa Dosham:** `detect_putra_sarpa_dosham`
- **Badhaka:** `get_badhaka_lord`, `detect_badhaka_dosham`
- **Marana Karaka Sthana:** `detect_marana_karaka_sthana`

### [app/calculations/dosha_samyam.py](../app/calculations/dosha_samyam.py) — 67 lines
- **Dosham balancing in matching (DD-03):** `rahu_ketu_samyam`, `cross_samyam` (off by default, O-3), `compare_marriage_doshams`, `MarriageSamyam`

Related: Sade Sati / Kandaka / Ashtama Sani live in §7. Nadi dosha lives in `porutham.py` (§13). Sevvai cancellation between partners lives in `compatibility_intelligence.py` (§13).

---

## 6. Dasha systems

### [app/calculations/dasha.py](../app/calculations/dasha.py) — 186 lines (primary: Vimshottari)
- **Opening balance:** `calculate_opening_dasha`
- **Timeline:** `calculate_vimshottari_timeline`, `DashaPeriod`, `VimshottariTimeline`

### [app/calculations/ashtottari_dasha.py](../app/calculations/ashtottari_dasha.py) — 347 lines
- **Applicability:** `evaluate_ashtottari_applicability`
- **Timeline:** `calculate_opening_ashtottari`, `calculate_ashtottari_timeline`

### [app/calculations/conditional_dashas.py](../app/calculations/conditional_dashas.py) — 553 lines
- **System config:** `ConditionalDashaSystem`
- **Timeline:** `calculate_opening`, `calculate_timeline`
- **Applicability:** `evaluate_applicability`

### [app/calculations/jaimini_dasha.py](../app/calculations/jaimini_dasha.py) — 284 lines
- **Chara Dasha:** `calculate_chara_dasha`, `current_chara_dasha`
- **Antardasha:** `calculate_chara_antardasha`

### [app/calculations/kalachakra_dasha.py](../app/calculations/kalachakra_dasha.py) — 345 lines
- **Opening & timeline:** `calculate_opening_kalachakra`, `calculate_kalachakra_timeline`

### [app/calculations/dasha_activation.py](../app/calculations/dasha_activation.py) — 155 lines
- **Does the running dasha activate a house?** `assess_dasha_activation`: connection match by lordship, occupancy, aspect, dispositor, karaka and node agency

### Single-purpose dasha files

| File | Lines | Holds |
|---|---|---|
| [app/calculations/yogini_dasha.py](../app/calculations/yogini_dasha.py) | 180 | `calculate_opening_yogini`, `calculate_yogini_timeline` (36-year cycle) |
| [app/calculations/dasha_house_mapping.py](../app/calculations/dasha_house_mapping.py) | 22 | `get_dasha_activated_houses` |
| [app/calculations/dasha_certification.py](../app/calculations/dasha_certification.py) | 309 | `DashaCertification`: what is and is not verified per secondary system |
| [app/services/dasha_service.py](../app/services/dasha_service.py) | 333 | `get_chart_dasha`, `get_chart_dasha_from_snapshot` |
| [app/services/dasha_transition_service.py](../app/services/dasha_transition_service.py) | 119 | `get_dasha_transition_alerts`: 90 / 30 / 7-day and day-of alerts |
| [app/services/ashtottari_dasha_service.py](../app/services/ashtottari_dasha_service.py) · [yogini_dasha_service.py](../app/services/yogini_dasha_service.py) · [kalachakra_dasha_service.py](../app/services/kalachakra_dasha_service.py) · [conditional_dashas_service.py](../app/services/conditional_dashas_service.py) | 88 · 59 · 70 · 167 | Response builders; conditional adds `derive_day_night_birth` |

---

## 7. Transits (Gocharam), Sade Sati & Peyarchi

### [app/calculations/transits.py](../app/calculations/transits.py) — 596 lines
- **Combustion:** `is_combust`, `is_cazimi`, `combustion_severity`, `angular_distance`
- **Gandanta:** `is_gandanta`
- **Saturn cycles:** `classify_sani_cycle`, `classify_kandaka_cycle`, `classify_ezharai_sani_murthi`, `classify_ezharai_sani_murthi_ingress`
- **Saturn ingress / egress search:** `find_saturn_ingress_jd`, `find_saturn_egress_jd`
- **Vedha (obstruction):** `check_vedha`
- **Transit aspects:** `get_jupiter_aspects`, `get_saturn_aspects`, `get_mars_aspects`, `planets_transited_by`
- **Assembly:** `build_transit_position`, `transit_interpretation_key`

### [app/calculations/sade_sati.py](../app/calculations/sade_sati.py) — 229 lines (EC-RULING-05)
- **Segmentation:** `is_sade_sati_house`, `elapsed_month`, `severity_for_month`, `SadeSatiSeverity`
- **Mitigation:** `assess_mitigation`, `SadeSatiMitigation`
- **Houses touched:** `houses_touched_during_cycle`

### [app/services/_dg_peyarchi.py](../app/services/_dg_peyarchi.py) — 353 lines
- **Peyarchi report (Jupiter / Saturn / Rahu / Ketu):** `get_peyarchi_report`
- **Dasha story (birth to 120 years):** `get_dasha_story`
- **Rahu–Ketu axis:** `_node_axis_phase`, `_rahu_ketu_axis_outlook`

### [app/services/transit_service.py](../app/services/transit_service.py) — 332 lines
- **Gochara snapshot:** `build_transit_snapshot`, `get_gochar_current`
- **Sani cycle response:** `build_sani_cycle_response`, `get_sani_cycle`

### [app/services/peyarchi_service.py](../app/services/peyarchi_service.py) — 154 lines
- **Next sign change:** `find_next_rasi_change`, `find_next_permanent_rasi_change` (ignores retrograde back-and-forth)
- **Summary:** `get_peyarchi_summary`

### Single-purpose transit files

| File | Lines | Holds |
|---|---|---|
| [app/calculations/double_transit.py](../app/calculations/double_transit.py) | 50 | `score_double_transit`: Jupiter + Saturn on a house, −10…+15 |
| [app/calculations/tara_bala.py](../app/calculations/tara_bala.py) | 52 | `tara_number` (1–9), `chandra_bala` (Moon's house from janma rasi) |
| [app/services/peyarchi_alert_service.py](../app/services/peyarchi_alert_service.py) | 213 | `refresh_peyarchi_alerts`, `daily_peyarchi_refresh` |
| [app/services/emotional_weather.py](../app/services/emotional_weather.py) | 192 | `compute_emotional_weather`: Moon-transit aspect tone |
| [app/services/pirantha_naal_service.py](../app/services/pirantha_naal_service.py) | 178 | `next_janma_nakshatra_date`: nakshatra birthday |
| [app/services/ambient_alerts_service.py](../app/services/ambient_alerts_service.py) | 211 | `list_ambient_alerts`: peyarchi and relationship alerts scored by due tier |

---

## 8. Panchangam & Tamil calendar

### [app/calculations/panchangam.py](../app/calculations/panchangam.py) — 2760 lines (the largest calculation file)
- **Five limbs (tithi, nakshatra, yoga, karana, vaara):** `_tithi_number_at_jd`, `_nakshatra_number_at_jd`, `_yoga_number_at_jd`, `_karana_index_at_jd`, `_weekday_lord_and_name`; tables `TITHI_NAMES`, `YOGA_NAMES`, `MOVABLE_KARANAS`, `WEEKDAY_LORDS`
- **Boundary search & intra-day spans:** `_find_next_boundary_jd`, `limb_spans_between`, `dominant_from_spans`, `dominant_span_name`, `limb_fraction`, `limb_weighted`, `PanchangamLimbSpan`
- **Next-value lookahead:** `_next_tithi`, `_next_nakshatra_name`, `_next_yoga_name`, `_next_karana_name`
- **Amavasai / Pournami ownership:** `dominant_special_tithi_for_civil_day`, `_special_tithi_durations_for_civil_day`
- **Rahu Kalam / Yamagandam / Kuligai:** `RAHU_SLOT`, `YAMA_SLOT`, `KULIGAI_SLOT`, `KULIGAI_NIGHT_SLOT`
- **Durmuhurtham:** `_durmuhurtham_windows` (inputs in `app/data/durmuhurtham_rules.py`)
- **Gowri Panchangam:** `GOWRI_DAY_TABLE`, `GOWRI_NIGHT_TABLE`, `_compute_gowri_panchangam`, `gowri_category_rank`, `best_gowri_slot`, `gowri_kala_label`, `gowri_good_purpose`
- **Nalla Neram:** `_compute_nalla_neram`, `_compute_gowri_nalla_neram`, `_clear_of_bad_kalams`, `NALLA_NERAM_SUMMARY_TABLE`
- **Subha Muhurtham (broad / strict):** `_compute_subha_muhurtham_broad`, `_compute_subha_muhurtham_strict`, `_muhurtham_weekday_block_reason`; tables `SUBHA_TITHIS_*`, `SUBHA_NAKSHATRAS`, `SUBHA_YOGAS`, `ASHUBHA_YOGAS`, `RIKTA_TITHIS_IN_PAKSHA`
- **Hora:** `_make_hora_entries`, `PanchangamHoraEntry`
- **Amirdhadhi Yogam:** `amirdhadhi_yogam_class`, `_amirdhadhi_yogam_name`, `AMIRDHADHI_YOGAM_TABLE`
- **Chandrashtamam windows:** `chandrashtamam_janma_nakshatra_windows_for_day`, `own_chandrashtama_windows`, `is_chandrashtama_day`
- **Jeevan / Nethiram:** `_jeevan_value`, `_nethiram_value`
- **Soolam & its parigaram:** `SOOLAM_DIRECTION`, `SOOLAM_PARIGARAM_BY_DIRECTION`
- **Daylight lagna schedule:** `build_daylight_lagna_schedule`, `with_daylight_lagna_schedule`, `PanchangamLagnaWindow`
- **Moon phase:** `_moon_phase_label`
- **Cache & entry points:** `calculate_daily_panchangam`, `calculate_daily_panchangam_range`, `purge_expired_panchangam_cache`, serialise/deserialise helpers

### [app/calculations/tamil_calendar.py](../app/calculations/tamil_calendar.py) — 306 lines
- **Sankranti search:** `find_sankranti_jd`, `month_start_date_for_sankranti`
- **Tamil date:** `tamil_solar_date`, `format_tamil_date` ("ஆடி 15")
- **Month spans:** `tamil_month_spans`, `TamilMonthSpan`

### [app/calculations/festivals.py](../app/calculations/festivals.py) — 530 lines
- **Fixed and yearly festivals:** `_FIXED_FESTIVALS`, `_YEARLY_FESTIVALS`, `_WORLD_OBSERVANCES`
- **Tithi-recurring festivals:** `_recurring_tithi_festivals`
- **Nakshatra festivals per Tamil month:** `_NAKSHATRA_FESTIVALS`, `_MONTH_*` tables
- **Gazetted coverage:** `gazetted_coverage_bounds`, `has_gazetted_coverage`
- **Lookup:** `get_festivals_for_date`

### [app/services/panchangam_service.py](../app/services/panchangam_service.py) — 635 lines
- **Daily panchangam:** `calculate_panchangam`, `calculate_panchangam_timings`
- **Monthly calendar:** `build_monthly_panchangam`
- **Tamil months:** `build_tamil_months`

### [app/services/panchangam_events_service.py](../app/services/panchangam_events_service.py) — 278 lines
- **Special-event listings (Pournami, Amavasai, Pradosham…):** `list_events`, `get_event`
- **Karinaal:** `karinaal_dates`, `is_karinaal`

### Panchangam data & small services

| File | Lines | Holds |
|---|---|---|
| [app/data/durmuhurtham_rules.py](../app/data/durmuhurtham_rules.py) | 23 | Verified Durmuhurtham slot inputs (15 daylight muhurtas) |
| [app/data/kuligai_polarity.py](../app/data/kuligai_polarity.py) | 189 | `polarity_for`, `rejects`, `favours`: Kuligai is conditional per activity (EC-RULING-07) |
| [app/data/tamil_calendar_authority.py](../app/data/tamil_calendar_authority.py) | 43 | `published_month_start_date`: published month starts from the Gnanananda almanac |
| [app/data/panchangam_events_2026.py](../app/data/panchangam_events_2026.py) | 315 | Auto-generated 2026 special-event dates |
| [app/data/calendar_categories_2026.py](../app/data/calendar_categories_2026.py) | 234 | 2026 festival and holiday categories |
| [app/services/panchangam_card_service.py](../app/services/panchangam_card_service.py) | 123 | `get_card_data`: share card |
| [app/services/panchangam_prewarm.py](../app/services/panchangam_prewarm.py) | 112 | `prewarm_panchangam_cache`: cron |
| [app/services/calendar_category_service.py](../app/services/calendar_category_service.py) | 93 | Category listing |

---

## 9. Muhurtham & activity timing

### [app/calculations/muhurta_engine.py](../app/calculations/muhurta_engine.py) — 2464 lines
- **Almanac factors:** `_almanac_tithi_factor`, `_almanac_nakshatra_factor`, `_almanac_yoga_factor`, `_almanac_day_quality_factor`, `_almanac_amirdhadhi_factor`, `_almanac_windows_factor`
- **Sourced limb factors:** `_nakshatra_factor`, `_registry_nakshatra_factor`, `_tithi_factor`, `_registry_tithi_factor`, `_karana_factor`, `_vara_factor`, `_paksha_factor`
- **Lagna factors:** `_lagna_sign_factor`, `lagna_sign_factor_at_window`, `limb_factors_at_window`
- **Personal layer:** `_tara_bala_factor`, `_chandra_bala_factor`, `_janma_nakshatra_factor`, `_janma_tara_count_factor`, `_personal_factors`, `Subject`
- **Couple mode:** `_weaker_side_governs`, `_stand_down` (the weaker chart governs)
- **Wealth & karaka:** `wealth_house_heuristic_factor` (explicitly unsourced), `karaka_dignity_factors`
- **Marriage:** `marriage_jupiter_gochara_factor` (Jupiter from the bride's janma rasi)
- **Provenance:** `resolve_rule_source`, `unscored_dimensions_for`
- **Scoring:** `score_day`, `display_score` (0–100), `DayScore`, `FactorResult`, `Verdict`

### [app/calculations/activity_timing_rules.py](../app/calculations/activity_timing_rules.py) — 799 lines
- **Per-activity verdict:** `assess_activity_timing` (paksha, tithi, weekday, nakshatra)
- **Daily board:** `daily_activity_board`, `DailyActivityBoard`, `ActivityVerdict`
- **Personalisation:** `personalize_board`, `ActivityAudience`

### [app/calculations/muhurta_doctrine.py](../app/calculations/muhurta_doctrine.py) — 144 lines
- **Provenance schema:** `RuleSource`, `Authority`, `Severity`, `PolicyClass`, `RuleType`, `SourceConfidence`, `VerificationOutcome`

### [app/services/muhurta_service.py](../app/services/muhurta_service.py) — 1392 lines
- **Top-N slot finder:** `find_best_muhurta_slots`, `normalize_activity`
- **Time windows:** `_best_time_window`, `_daylight_fragments`, `_clear_good_day_kalas`, `_best_fragment`
- **Hora support:** `_activity_hora_lords`, `_hora_support_text`
- **Dasha and transit support:** `_dasha_support`, `_transit_factors_at`
- **Traditional month notices:** `_traditional_month_notices`, `_WEDDING_MONTH_CUSTOMS`
- **Band and heuristic bonus:** `_score_band`, `_apply_in_band_heuristic_bonus`, `_apply_tara_display_cap`

### [app/services/muhurtham_naal_service.py](../app/services/muhurtham_naal_service.py) — 706 lines
- **Curated wedding dates:** `list_muhurtham_naals`
- **Chart-matched ranking:** `match_muhurtham_naals`, `NaalReading`
- **Couple:** `couple_who`, `require_couple_birth_time`

### Muhurtham rule data (sourced from Kalaprakasika)

| File | Lines | Holds |
|---|---|---|
| [app/data/muhurta_activity_registry.py](../app/data/muhurta_activity_registry.py) | 1547 | Activity → sourced rule tables; `ActivityRules`, `StarGroup` |
| [app/data/muhurta_source_invariant.py](../app/data/muhurta_source_invariant.py) | 269 | `validate_muhurta_sources`: no rule goes live unsourced (MUH-08) |
| [app/data/marriage_muhurta_rules.py](../app/data/marriage_muhurta_rules.py) | 699 | Ch. XIII–XIV marriage doctrine |
| [app/data/kalaprakasika_samskara_rules.py](../app/data/kalaprakasika_samskara_rules.py) | 803 | Ch. III–IV Namakarana, Annaprasana, Karnavedha |
| [app/data/kalaprakasika_lifecycle_rules.py](../app/data/kalaprakasika_lifecycle_rules.py) | 828 | Ch. V, VII, XVII, XVIII Choulam, Upanayanam, Seemantham, birth chamber |
| [app/data/kalaprakasika_learning_rules.py](../app/data/kalaprakasika_learning_rules.py) | 830 | Ch. VI, VIII, X–XII education arc |
| [app/data/kalaprakasika_agriculture_rules.py](../app/data/kalaprakasika_agriculture_rules.py) | 720 | Ch. XIX, XXII land work, first crop |
| [app/data/kalaprakasika_harvest_rules.py](../app/data/kalaprakasika_harvest_rules.py) | 578 | Ch. XX harvest; `HarvestYoga` |
| [app/data/kalaprakasika_treasure_rules.py](../app/data/kalaprakasika_treasure_rules.py) | 808 | Ch. XXI gold, gems, grain, land; `TreasureYoga` |
| [app/data/kalaprakasika_adornment_rules.py](../app/data/kalaprakasika_adornment_rules.py) | 378 | Ch. XXIII–XXIV new clothes, ornaments |
| [app/data/muhurtham_naals.py](../app/data/muhurtham_naals.py) | 248 | Curated almanac wedding dates; `get_muhurtham_naals` |

---

## 10. Daily fortune (palan) & life-area predictions

### [app/calculations/prediction_score.py](../app/calculations/prediction_score.py) — 273 lines
- **Six-layer Thirukanitham score:** `compute_prediction_score`
- **Sade Sati penalty:** `_sade_sati_penalty` (severity-graded, with mitigation relief)
- **Dasha-lord strength swing:** `_maha_strength_multiplier`
- **Scale:** `interpret_score` (one 0–100 scale for every surface), `SUPPORTIVE_SCORE_FLOOR`

### [app/services/daily_guidance_service.py](../app/services/daily_guidance_service.py) — 2090 lines
- **Daily guidance:** `build_daily_guidance_response`, `get_daily_guidance`, `get_daily_guidance_range`
- **Week ahead:** `get_week_ahead`, `get_week_ahead_by_chart`
- **Activity timing (top dates in a month):** `get_activity_timing`, `_timing_day_score`, `_couple_timing_day`
- **Remedy focus:** `_build_remedy_focus`, `_compose_temple_action`, `_compose_seva_actions`
- **Journal correlation:** `get_journal_correlations`

### [app/services/_dg_scoring.py](../app/services/_dg_scoring.py) — 621 lines ⚠ scoring maths outside `calculations/`
- **Tara position:** `tara_position`
- **Score tables:** `TRANSIT_BASE_SCORE` (per-planet house from the Moon), `PLANET_PERIOD_SCORE`
- **Dasha scores:** `_planet_period_score`, `_dasha_lord_strength_score`, `_age_dasha_modifier`, `_pratyantar_narrative`
- **Transit with Ashtakavarga:** `_transit_with_av_score`
- **Relationship score:** `_graha_relationship_score` (9×9)
- **Panchangam penalties:** `_tithi_penalty`, `_yoga_penalty`, `_karana_penalty`, `weighted_panchangam_score`
- **Moon & Chandrashtamam:** `weighted_moon_score`, `chandrashtama_share`, `chandrashtama_rasi_for`, `chandrashtama_end`

### [app/services/_dg_hora.py](../app/services/_dg_hora.py) — 473 lines
- **Hora:** `_current_hora_lord`, `_personal_hora_lords`, `_supportive_sets`
- **Bad kalams:** `_inauspicious_intervals`, `_kalam_intervals`
- **Gowri kalas:** `_day_gowri_kalas`
- **Best windows:** `_perfect_windows`, `_best_hours`, `_conflict_key`
- **Caution windows:** `_caution_windows`
- **Text:** `_build_text`

### [app/services/personal_palan.py](../app/services/personal_palan.py) — 1072 lines
- **Personal daily palan (இன்றைய பலன் · உங்கள் ஜாதகப்படி):** `build_personal_palan`
- **Per-area palan:** `PalanArea`, `PalanPeriod`
- **Lucky items:** `PalanLucky`
- **Read-aloud transcript:** `TranscriptSegment`

### [app/services/life_areas_service.py](../app/services/life_areas_service.py) — 2476 lines ⚠ carries its own per-planet house tables
- **Seven areas (Career, Money, Health, Relationships, Education, Spiritual, Family Harmony):** `get_life_areas`, `_score_area`
- **Transit house tables:** `_JUPITER_HOUSE_SCORE`, `_SATURN_…`, `_MARS_…`, `_MERCURY_…`, `_VENUS_…`, `_SUN_HOUSE_SCORE`
- **Dasha and Sani:** `_DASHA_AREA_SCORE`, `_SANI_AREA_PENALTY`
- **Chandrashtamam:** `_chandrashtama_rasi_share`, `_CHANDRASHTAMA_PENALTY`
- **Karaka chain:** `_karaka_chain_score`
- **Maraka safety:** `_maraka_safety_check`
- **Forecast (6/12-month):** `_projected_area_score`, `_find_next_improvement_date`, `_trend`
- **Age and marital gating:** `_age_phase`, `_is_married`, `_is_student`, `_not_applicable_text`

### Area-specific predictors (each returns a `LifeAreaPrediction`)

### [app/services/career_service.py](../app/services/career_service.py) — 477 lines
- **Career prediction:** `assess_career_prediction`: 10th-house affliction, dasha connection to 10/2/6/11, Saturn in the 10th

### [app/services/marriage_service.py](../app/services/marriage_service.py) — 865 lines
- **Promise gate:** `_marriage_promise_gate`, `_gated_marriage_prediction`
- **Chart signature:** `_compute_chart_signature`
- **Prediction:** `assess_marriage_prediction`
- **Safety check:** `_safety_checked`

### [app/services/health_service.py](../app/services/health_service.py) — 243 lines
- **Health prediction:** `assess_health_prediction`: the 6th–8th complex sets the care period

### [app/services/wealth_service.py](../app/services/wealth_service.py) — 265 lines
- **Wealth prediction:** `assess_wealth_prediction`: 2/11/5 lordship, Jupiter/Venus karakas
- **11th-house bindus:** `_derived_11th_bindu`

### Event windows & scenarios

### [app/calculations/event_windows.py](../app/calculations/event_windows.py) — 409 lines
- **Marriage windows:** `find_marriage_windows`
- **Career windows:** `find_career_windows`
- **Finance windows:** `find_finance_windows`
- **Dispatcher:** `find_event_windows`

### [app/services/life_event_service.py](../app/services/life_event_service.py) — 570 lines
- **3–5 year windows:** `_marriage_windows`, `_career_windows`, `_studies_windows`, `_relocation_windows`, `_health_caution_windows`
- **Confidence:** `_confidence`
- **Entry point:** `get_life_event_windows`

### [app/services/whatif_service.py](../app/services/whatif_service.py) — 1144 lines ⚠ another set of per-planet house tables
- **Triple confirmation:** `_assess_natal_promise`, `_assess_dasha_support`, `_assess_gochar_support`
- **Panchangam score:** `_compute_panchangam_score`
- **Verdict:** `_overall_verdict`, `evaluate_whatif`

### [app/services/decisions_service.py](../app/services/decisions_service.py) — 370 lines
- **Scenario detection:** `_scenario_from_text`, `_pick_scenario`
- **Next dasha shift:** `_next_dasha_shift`
- **Optimal window:** `_optimal_window`
- **Recommendation:** `_build_option_analysis`, `_recommend`, `build_decision_brief`

### [app/services/age_phase_service.py](../app/services/age_phase_service.py) — 625 lines
- **Life phases & stage:** `get_active_life_phases`, `get_age_phase_label`, `life_stage`, `is_minor`
- **Age-apt house themes:** `house_theme_for_stage`
- **Practical guidance:** `get_age_based_practical_guidance`
- **Age-based remedies:** `get_age_based_remedies`, `remedy_lead_in_for_stage`
- **Summaries:** `build_chart_gist`, `build_executive_summary`, `build_year_guidance`

### Single-purpose fortune files

| File | Lines | Holds |
|---|---|---|
| [app/services/daily_briefing_synth.py](../app/services/daily_briefing_synth.py) | 359 | `synthesize_daily_briefing`: orders six computed reasons into one briefing |
| [app/services/_dg_goals.py](../app/services/_dg_goals.py) | 238 | Goal enrichment of the action line; journal insight |
| [app/services/_dg_cache.py](../app/services/_dg_cache.py) | 213 | Daily score cache (no maths) |
| [app/services/life_area_prediction_models.py](../app/services/life_area_prediction_models.py) | 55 | `LifeAreaPrediction`, `AstroFactor`, `house_lord_for_lagna` |
| [app/services/primary_concern_service.py](../app/services/primary_concern_service.py) | 168 | `infer_primary_concerns`: names the client's likely concern |
| [app/services/annual_wrapped_service.py](../app/services/annual_wrapped_service.py) | 321 | `compute_annual_wrapped`: year in review, score bands |
| [app/services/retrospective_service.py](../app/services/retrospective_service.py) | 368 | `analyse_and_save_retrospective`: past-event intensity by transits |
| [app/services/notification_service.py](../app/services/notification_service.py) | 100 | `build_morning_notification`: morning Nalla Neram push |
| [app/services/life_focus_service.py](../app/services/life_focus_service.py) | 146 | `user_blocked_modes`, `resolve_focus`, `chart_goal_track`: focus and age gating |

---

## 11. Cautions — "Chances & Cautions" and caution windows

### [app/calculations/propensities.py](../app/calculations/propensities.py) — 1706 lines
- **Love & relationships:** `eval_love`, `eval_breakup`, `eval_marriage_harmony`, `eval_early_marriage_readiness`, `eval_marriage_delay_watch`, `eval_spousal_support_strength`, `eval_loneliness`
- **Education:** `eval_higher_education`, `eval_dropout_risk`, `eval_degree_interruption`
- **Career:** `eval_career_mode`, `eval_government_job`, `eval_job_loss`, `eval_promotion_recognition`, `eval_entrepreneurial_timing`, `eval_workplace_conflict`, `eval_skill_mastery`, `eval_career_networking_influence`, `eval_career_change_success`, `eval_competitive_edge`
- **Money:** `eval_income_growth`, `eval_savings_capacity`, `eval_inheritance_lean`, `eval_windfall_gains`, `eval_speculative_risk`, `eval_debt_watch`
- **Property:** `eval_property_acquisition`, `eval_property_investment_timing`, `eval_ancestral_property_stability`
- **Foreign:** `eval_foreign_settlement`, `eval_pr_immigration_prospects`
- **Legal:** `eval_litigation_season`, `eval_legal_outcome_favor`, `eval_contract_dispute_risk`
- **Business partnership:** `eval_business_partnership_fit`
- **Health & care (sensitive tier):** `eval_accident_care`, `eval_depression_vuln`, `eval_severe_loss` (prudence season, never a death claim)
- **Children:** `eval_child_delay`
- **Temperament:** `eval_stubbornness`, `eval_swabhava_profile`

### [app/services/propensity_service.py](../app/services/propensity_service.py) — 635 lines
- **Input assembly:** `build_chart_input`
- **Grading, age gating, sensitive framing:** `assess_propensities`
- Models: [app/services/propensity_models.py](../app/services/propensity_models.py) (201 lines): `ChanceLevel`, `CautionLevel`, `PropensityTier`, `PropensityResult`

### Other caution logic (cross-reference)

| Caution | Where |
|---|---|
| Nakshatra cautions (birth star) | `detect_nakshatra_cautions`, [_yoga_detect.py](../app/calculations/_yoga_detect.py) |
| Birth-time junction cautions (Sankranti, Grahana, Gandanta, Dagda) | [birth_conditions.py](../app/calculations/birth_conditions.py) |
| Lagna-edge (birth-time accuracy) caution | [lagna_edge.py](../app/calculations/lagna_edge.py) |
| Daily caution windows (Rahu Kalam, Yamagandam, Kuligai) | `_caution_windows`, [_dg_hora.py](../app/services/_dg_hora.py) |
| Daily caution sentence | `caution_suggestion`, `personal_caution_reason`, `rahu_kalam_advice` in [narrative_engine.py](../app/services/narrative_engine.py) |
| Health caution windows | `_health_caution_windows`, [life_event_service.py](../app/services/life_event_service.py) |
| Chandrashtamam | [astro.py](../app/calculations/astro.py), [panchangam.py](../app/calculations/panchangam.py), [_dg_scoring.py](../app/services/_dg_scoring.py) |
| Sade Sati / Kandaka / Ashtama Sani | [transits.py](../app/calculations/transits.py), [sade_sati.py](../app/calculations/sade_sati.py) |
| Dasha transition alerts | [dasha_transition_service.py](../app/services/dasha_transition_service.py) |
| Maraka safety | `_maraka_safety_check`, [life_areas_service.py](../app/services/life_areas_service.py) |
| Tara Bala adverse days | `_TARA_ADVERSE`, `TARA_GENERAL_CAUTION` in [muhurta_engine.py](../app/calculations/muhurta_engine.py) |
| Family member care flag | [web/lib/family-flags.ts](../web/lib/family-flags.ts) |

---

## 12. Remedies (Parigaram)

### [app/calculations/remedies.py](../app/calculations/remedies.py) — 379 lines
- **Planet remedy catalogue:** `PLANET_REMEDY_CATALOG`, `PLANET_REMEDY_WEEKDAY`, `PlanetRemedy`, `get_remedy`
- **Dosham → remedy planet:** `active_dosham_planet`
- **Remedy focus selection:** `select_remedy_focus`, `RemedyFocusSelection` (shared by the Today card and the full plan)
- **Life-area remedy:** `get_area_remedy`, `AREA_REMEDY_SCORE_CEILING`, `MAINTAIN_PRACTICE_*`
- **Gemstone policy:** `_gemstone_policy`, `GEMSTONE_NOTE_*`
- **Safety:** `remedy_disclaimer`, `FASTING_CAUTION_*`, `GUARANTEE_NOTE_*`

### [app/calculations/family_harmony_remedies.py](../app/calculations/family_harmony_remedies.py) — 424 lines
- **Cross-chart family remedies:** `synthesize_family_harmony_remedies`, `MemberChartInput`, `FamilyHarmonyRemedyItem`
- Service: `get_family_harmony_remedies` in [app/services/family_vault_service.py](../app/services/family_vault_service.py)

### Other remedy logic (cross-reference)

| Remedy | Where |
|---|---|
| Today's remedy focus card (temple / seva action) | `_build_remedy_focus`, [daily_guidance_service.py](../app/services/daily_guidance_service.py) |
| Daily remedy sentence | `remedy_suggestion`, [narrative_engine.py](../app/services/narrative_engine.py) |
| Age-based remedies | `get_age_based_remedies`, [age_phase_service.py](../app/services/age_phase_service.py) |
| Natal remedy line per planet | `_natal_remedy_text`, [chart_explanation_service.py](../app/services/chart_explanation_service.py) |
| Soolam direction parigaram | `SOOLAM_PARIGARAM_BY_DIRECTION`, [panchangam.py](../app/calculations/panchangam.py) |
| Nadi dosha parihara modes | `_NADI_PARIHARA_MODES`, [porutham.py](../app/calculations/porutham.py) |
| Public pariharam pages (static copy, no maths) | `web/lib/marketing-i18n/pariharam-*.ts` |

---

## 13. Compatibility & matching (Porutham)

### [app/calculations/porutham.py](../app/calculations/porutham.py) — 1029 lines
- **The 10 poruthams:** `_dinam_score`, `_ganam_score`, `_mahendra_score`, `_stree_dirgha_band`, `_yoni_score`, `_rasi_score`, `_graha_maitri_kuta`, `_vasya_score`, `_rajju_score`, `_vedha_score`
- **Rasi exceptions:** `_rasi_exception_lifts`, `RASI_EXCEPTIONS_ENABLED`, `_RASI_SIXTH_PAIR_EXCEPTIONS`
- **Nadi dosha:** `check_nadi_dosha`, `_NADI_PARIHARA_MODES`
- **Three-fold grade:** `GRADE_UTTAMA` / `MADHYAMA` / `ADHAMA`, `porutham_band_label`
- **Total:** `compute_porutham`, `format_porutham_total` (half points)

### [app/calculations/compatibility_intelligence.py](../app/calculations/compatibility_intelligence.py) — 1065 lines (8-level report)
- **Sevvai comparison:** `_compute_sevvai`, `_apply_mutual_sevvai_cancellation`, `sevvai_risk_lines`
- **Samyam lines:** `marriage_samyam_lines`
- **Chart marriage strength:** `_compute_chart_marriage_strength`
- **Navamsa compatibility:** `_compute_navamsa`, `_d9_dignified`
- **Dasha harmony:** `_compute_dasha_harmony`
- **Emotional compatibility:** `_compute_emotional_compatibility`, `_MOON_HARMONY_TABLE`
- **Report:** `compute_compatibility_intelligence`

### [app/services/synastry_service.py](../app/services/synastry_service.py) — 1116 lines
- **Synastry score:** `compute_synastry_score`, `_aspect_between`, `_aspect_eval`
- **Transit activation of a relationship:** `check_transit_activation`, `refresh_relationship_alerts`
- **Porutham by relationship:** `_contextualize_porutham_result` (kuta mask per relationship type), `get_porutham_for_member`, `compare_charts_direct`
- **Compatibility intelligence:** `build_compatibility_intelligence_from_snapshots`, `get_compatibility_intelligence_for_member`
- **Bride/groom assignment:** `_assign_bride_groom`

### Single-purpose matching files

| File | Lines | Holds |
|---|---|---|
| [app/services/friendship_compatibility_service.py](../app/services/friendship_compatibility_service.py) | 139 | `get_friendship_report`: porutham reframed for friendship |
| [app/calculations/dosha_samyam.py](../app/calculations/dosha_samyam.py) | 67 | See §5 |
| [app/services/porutham_share_service.py](../app/services/porutham_share_service.py) | 184 | Share links (no maths) |

---

## 14. Readings, explanations & the reasoning kernel

### Reasoning kernel — `app/reasoning/`

### [app/reasoning/promise_gate.py](../app/reasoning/promise_gate.py) — 166 lines
- **D1 promise gate (veto, not weight):** `assess_promise`, `GateGrade`, `GateResult`, `gate_from_l1`

### [app/reasoning/timing_vote.py](../app/reasoning/timing_vote.py) — 61 lines
- **Timing vote:** `weighted_timing_vote`, `timing_band_from_score`
- **Combinator:** `combine_gate_and_timing` (gate first, then vote)

### [app/reasoning/verdict.py](../app/reasoning/verdict.py) — 107 lines
- **Ordinal bands:** `Band`, `band_rank`, `cap_band`
- **Legacy mapping:** `band_to_legacy_confidence`, `legacy_confidence_to_band`
- **Types:** `BiText`, `Verdict`

### Single-purpose kernel files

| File | Lines | Holds |
|---|---|---|
| [app/reasoning/contradiction.py](../app/reasoning/contradiction.py) | 79 | `classify`: why the promise and the timing disagree (PROMISED_NOT_NOW, etc.) |
| [app/reasoning/chart_signature.py](../app/reasoning/chart_signature.py) | 173 | `detect_signature`: the chart's dominant graha and its motif |
| [app/reasoning/calibration.py](../app/reasoning/calibration.py) | 88 | `build_calibration_report`: hit / near / miss over the prediction log |
| [app/services/prediction_log_service.py](../app/services/prediction_log_service.py) | 208 | `log_prediction`, `join_outcome`: the calibration data spine |

### [app/services/chart_explanation_service.py](../app/services/chart_explanation_service.py) — 2560 lines
- **Per-planet explanation:** `_build_planet_sections`, `_planet_facets`, `_planet_explanation`
- **Dignity, lordship, navamsa, avastha, condition facets:** `_dignity_label`, `_lordship_facet_value`, `_navamsa_facet_value`, `_avastha_facet_value`, `_condition_facet_value`, `_sandhi_meaning`
- **Score breakdown:** `_score_breakdown`, `_score_term_detail`
- **Conjunctions & aspects:** `_build_conjunctions`, `_build_aspects`, `_relationship_text`
- **Graha yuddham:** `_yuddham_text`
- **Bhava & house groups:** `_build_bhava_section`, `_build_house_groups` (kendra / trikona / dusthana)
- **Transit contacts on natal planets:** `_planet_transit_contacts`, `_contact_rank`
- **Current activation:** `_build_current_activation_section`, `_activation_signals`
- **Peyarchi section:** `_build_peyarchi_section`
- **Natal remedy line:** `_natal_remedy_text`
- **Entry point:** `build_chart_explanation`

### [app/services/one_minute_reading_service.py](../app/services/one_minute_reading_service.py) — 3967 lines (largest file in `app/`)
- **Chart context:** `build_chart_context`, `ChartContext`, `_signature_lord`, `_strongest_and_weakest`, `_lagna_is_reliable`
- **Beats:** `_beat_who_you_are`, `_beat_what_this_rests_on`, `_beat_strength_and_cost`, `_beat_what_life_keeps_teaching`, `_beat_last_ten_years`, `_beat_right_now`, `_beat_next_ten_years`, `_beat_one_thing`, `_beat_age_question`
- **Child and third-party variants:** `_beat_years_ahead_for_a_child`, `_beat_period_for_someone_else`, `_beat_third_party_close`
- **Dasha handovers:** `_period_covering`, `_handovers_within`, `forward_beat_names_mahadasha_handover`
- **Honesty controls:** `Provenance`, `BaseRate`, `word_budget`, `_LONGEVITY_REFUSAL`

### [app/services/five_minute_reading_service.py](../app/services/five_minute_reading_service.py) — 1615 lines
- **Reading:** `build_five_minute_reading`
- **Controls:** `word_budget`, `repeated_source_clauses`

### [app/services/narrative_engine.py](../app/services/narrative_engine.py) — 1659 lines
- **Daily reasons:** `moon_transit_reason`, `dasha_support_reason`, `panchangam_reason`, `gochar_reason`, `sani_cycle_background`
- **Spoken briefing leads:** `panchangam_spoken`, `gochar_spoken`, `dasha_spoken`, `moon_spoken`
- **Action / caution / remedy lines:** `action_suggestion`, `caution_suggestion`, `personal_caution_reason`, `remedy_suggestion`, `rahu_kalam_advice`, `daily_summary`
- **Special-tithi cards:** `build_amavasai_card`, `build_pournami_card`, `build_pradosham_card`, `build_ekadasi_card`, `build_shivarathiri_card`, `tithi_content_card`, `festival_for_tithi`
- **Score reasons:** `build_score_reasons`, `ScoreComponentReasons`
- **Strength narrative:** `build_strength_narrative`
- **Reasoning voice:** `band_phrase`, `reading_phrase`, `promised_not_now_voice`, `active_but_unpromised_voice`, `signature_framing`, `render_causal_chain`
- **Validators:** `tone_validator`, `mortality_validator`, `precision_validator`
- **Clock formatting:** `tamil_day_period`, `format_clock_label`, `format_time_range`
- **Shadow prompts:** `generate_shadow_prompts`

### Single-purpose reading files

| File | Lines | Holds |
|---|---|---|
| [app/services/nakshatra_content.py](../app/services/nakshatra_content.py) | 808 | `build_nakshatra_perspective`, `get_nakshatra_card` |
| [app/calculations/verdict_lexicon.py](../app/calculations/verdict_lexicon.py) | 144 | `verdict_rung`, `verdict_phrase`: one Tamil quality ladder |
| [app/services/safety_filter.py](../app/services/safety_filter.py) | 73 | `check_text`, `run_safety_pass`: serve-time tone check |
| [app/services/ask_vinaadi_service.py](../app/services/ask_vinaadi_service.py) | 549 | `answer_question`: chart context sent to the LLM (no local maths) |
| [app/services/qa_service.py](../app/services/qa_service.py) | 567 | `run_golden_validation`: golden tests across the calculation modules |
| [app/services/pdf_export_service.py](../app/services/pdf_export_service.py) | 764 | Jadhagam, porutham and compatibility PDFs (render only) |

---

## 15. Special charts — Varshaphala, Prasna, Rectification

### [app/calculations/tajaka.py](../app/calculations/tajaka.py) — 165 lines
- **Solar return:** `find_solar_return_jd`
- **Muntha:** `calculate_muntha`
- **Varshaphala chart:** `calculate_tajaka_chart`
- Service: [app/services/tajaka_service.py](../app/services/tajaka_service.py) (182 lines), `get_varshaphala`

### [app/calculations/prasna.py](../app/calculations/prasna.py) — 155 lines
- **Prasna chart:** `cast_prasna_chart`
- **Outlook:** `prasna_outlook` (Moon applying to karaka; delay houses 3/6/11)

### [app/services/rectification_service.py](../app/services/rectification_service.py) — 335 lines
- **Birth-time estimation:** `estimate_birth_time`, `_build_candidate_lagna`, `_score_candidates`
- **Apply:** `apply_rectified_time`
- **Validate against life events:** `validate_chart_against_events`, `ValidationReport`

---

## 16. Numerology

### [app/calculations/numerology.py](../app/calculations/numerology.py) — 466 lines
- **Reduction:** `digit_sum`, `reduction_chain`, `compound_from_chain`, `reading_from_total`
- **Chaldean scoring:** `chaldean_value`, `score_text`, `score_digits`
- **Profile:** `psychic_number`, `destiny_number`, `build_profile`
- **Objects (mobile / vehicle / house number):** `analyze_object`

### [app/calculations/numerology_alignment.py](../app/calculations/numerology_alignment.py) — 563 lines (Fortune Alignment)
- **Number vs chart:** `align_number`, `align_profile`, `NodeBasis`, `StrengthRule`
- **Ranking:** `ranked_alignments_for`, `favourable_numbers_for`
- **Verdict bands:** `verdict_from_score`, `band_for`
- **Name-change guard:** `should_advise_name_change`

### [app/calculations/numerology_compatibility.py](../app/calculations/numerology_compatibility.py) — 778 lines (Peyar Porutham)
- **Graha and Cheiro relations:** `graha_relation`, `cheiro_relation`, `relation_between`, `resolve_basis`
- **Pairs:** `pair_numbers`, `compare_numbers`
- **Name harmony:** `name_harmony_from_alignment`
- **Layering over porutham:** `layer_over_porutham`, `summary_en`, `summary_ta`

### [app/calculations/numerology_correction.py](../app/calculations/numerology_correction.py) — 555 lines
- **Spelling variants:** `split_called_name`, `generate_variants`, `SpellingOperation`
- **Ranking:** `rank_variants`, `correct_name`
- **Legal warning:** `legal_warning_available`, `legal_warning`

### [app/calculations/numerology_naming.py](../app/calculations/numerology_naming.py) — 900 lines (Name Lab)
- **Canon guard:** `assert_canon_usable`, `UnverifiedCanonError`
- **Pada-akshara matching:** `evaluate_candidate`, `padas_for_name`, `rasi_of_pada`, `latin_is_ambiguous`, `tamil_is_ambiguous`
- **Search with relaxation ladder:** `find_names`, `NamingConstraints`, `Relaxation`, `EmptyReason`
- **Target scoring:** `relation_to_target`, `evaluate_against_target`

### [app/calculations/numerology_timing.py](../app/calculations/numerology_timing.py) — 503 lines
- **Personal cycles:** `personal_year`, `personal_month`, `personal_day`, `personal_cycle`, `resolve_epoch`
- **Date scoring:** `date_number`, `score_date`
- **Business launch:** `business_launch_score`

### Numerology services & data

| File | Lines | Holds |
|---|---|---|
| [app/services/numerology_service.py](../app/services/numerology_service.py) | 144 | Rollout gate; `load_chart_context`, `pada_context_from_snapshot` |
| [app/services/numerology_alignment_service.py](../app/services/numerology_alignment_service.py) | 107 | `alignment_for_chart`, `ranked_numbers_for_chart` |
| [app/services/numerology_compatibility_service.py](../app/services/numerology_compatibility_service.py) | 238 | `compatibility_for_charts`, `has_astrological_caution` |
| [app/services/numerology_correction_service.py](../app/services/numerology_correction_service.py) | 152 | `correct_name_for_chart` |
| [app/services/numerology_naming_service.py](../app/services/numerology_naming_service.py) | 807 | `baby_names_for_chart`, `baby_names_for_pada`, `baby_names_for_birth_details` |
| [app/services/numerology_timing_service.py](../app/services/numerology_timing_service.py) | 470 | `cycle_for`, `chithirai_start`, `layer_onto_muhurta_slots`, `layer_onto_naal_matches`, `lucky_dates_for_chart`, `marriage_dates_for_chart` |
| [app/services/numerology_name_session_service.py](../app/services/numerology_name_session_service.py) | 193 | Saved spellings, recomputed live |
| [app/services/numerology_content.py](../app/services/numerology_content.py) · [numerology_personal_year_content.py](../app/services/numerology_personal_year_content.py) | 496 · 161 | Root/compound and personal-year text corpora (gated as unreviewed) |
| [app/data/nakshatra_pada_akshara.py](../app/data/nakshatra_pada_akshara.py) | 494 | 108-row pada-akshara table; **provisional fixture, not canon** |
| [app/data/tamil_name_corpus.py](../app/data/tamil_name_corpus.py) | 448 | Baby-name corpus; **draft, unreviewed** |

---

## 17. Client-side derivation (web & shared)

The frontends mostly display server values. The files below **derive** something on the client. Mobile (`mobile/src/lib/`) has no astrology maths; it consumes the API and `packages/shared`.

| File | Lines | What it derives |
|---|---|---|
| [packages/shared/src/yogaDisplay.ts](../packages/shared/src/yogaDisplay.ts) | 292 | Yoga/dosham display state: `yogaActivationState`, `isRunningInDasha`, `isAdverseYoga`, `doshamStanding`, `yogaStanding`, `natalStrengthWord` |
| [packages/shared/src/utils/panchangamLimb.ts](../packages/shared/src/utils/panchangamLimb.ts) | 83 | `limbNow`: which tithi/nakshatra/karana span is running now vs at sunrise |
| [packages/shared/src/nakshatraLord.ts](../packages/shared/src/nakshatraLord.ts) | 68 | `nakshatraLord`: derived from the Vimshottari cycle |
| [packages/shared/src/personalPalan.ts](../packages/shared/src/personalPalan.ts) | 69 | Palan area labels and order (no maths) |
| [web/lib/chart-utils.ts](../web/lib/chart-utils.ts) | 306 | `computeD9LagnaRasi`, `houseFrom`, dignity tables (`EXALTATION_RASI`, `DEBILITATION_RASI`, `MOOLATRIKONA_ZONE`, `NATURAL_FRIENDS`…), `rasiDisplayName` |
| [web/lib/gowri.ts](../web/lib/gowri.ts) | 186 | Gowri kala rank, labels, `bestGowriSlot`; mirrors `panchangam.py` |
| [web/lib/kalam-live.ts](../web/lib/kalam-live.ts) | 80 | `resolveKalamStatus`: is Rahu Kalam etc. running now |
| [web/lib/lunar.ts](../web/lib/lunar.ts) | 76 | `moonPhaseFromTithi`, `lunarSpecialTithiMeta` |
| [web/lib/nokku.ts](../web/lib/nokku.ts) | 77 | `nokkuClassForNakshatra`: Mel / Keel / Sama Nokku day |
| [web/lib/today-windows.ts](../web/lib/today-windows.ts) | 198 | `pickFeaturedWindow`, `pickRecommendedWindow`, `clearSegments`: which good window to feature |
| [web/lib/kuta-grade.ts](../web/lib/kuta-grade.ts) | 59 | Porutham three-fold grade display |
| [web/lib/family-flags.ts](../web/lib/family-flags.ts) | 127 | `memberCareReason`, `activeSaniCycles`, `saniCycleName`: why a member is flagged |
| [web/lib/almanac-muhurtham.ts](../web/lib/almanac-muhurtham.ts) | 71 | Is the date also on the printed almanac list (a gate, not a score) |
| [web/lib/verdict-lexicon.ts](../web/lib/verdict-lexicon.ts) | 72 | Mirror of `verdict_lexicon.py`, **hand-synced** |

---

## 18. Excluded — no calculation inside

`acquisition_service`, `ask_vinaadi_usage_service`, `audit_service`, `birth_profile_service` (CRUD; triggers recalculation), `context_service`, `daily_push_cron`, `dashboard_bundle_service` (composes other services), `email_service`, `encryption`, `family_vault_service` (CRUD + aggregation; its remedy call is in §12), `fcm_service`, `feature_flags` (doctrine switches, §4), `goals_service`, `job_registry`, `journal_service`, `journal_purge`, `life_event_log_service`, `location_service`, `notification_dispatch_service`, `push_service`, `settings_service`, `share_card_service`, `streak_service`, `porutham_share_service`, `nakshatra_content_static` (deprecated).

**Doctrine verification scripts** (offline tools, not served): `scripts/doctrine_v13_frequency_sweep.py`, `daridra_definition_sweep.py`, `bhava_dignity_sweep.py`, `sunrise_reference_crosscheck.py`, `derive_tamil_month_boundaries.py`, `generate_doctrine_signoff_packet.py`, `generate_rulebook_appendix.py`, `generate_pada_verification_sheet.py`.

---

## 19. Hot spots for a lead

1. **Scoring tables duplicated across services.** Per-planet transit house-score tables exist separately in `life_areas_service.py` (`_JUPITER_HOUSE_SCORE`…) and `whatif_service.py` (`_JUPITER_HOUSE_SCORE`…, plus Moon, Rahu and Ketu). Daily scoring has a third, `TRANSIT_BASE_SCORE` in `_dg_scoring.py`. A doctrine change to "Jupiter in the 5th" has to be made in more than one place. This is the strongest candidate for a single `app/calculations/gochara_scores.py`.
2. **Very large files.** `one_minute_reading_service.py` (3967 lines), `panchangam.py` (2760), `chart_explanation_service.py` (2560), `life_areas_service.py` (2476) and `muhurta_engine.py` (2464) each hold eight or more distinct sections (listed above). `panchangam.py` alone covers five limbs, three kalams, Gowri, Nalla Neram, Subha Muhurtham, Hora, Amirdhadhi, Chandrashtamam, the lagna schedule and the cache.
3. **Hand-synced client mirrors.** `web/lib/gowri.ts` ↔ `panchangam.py` Gowri labels, and `web/lib/verdict-lexicon.ts` ↔ `verdict_lexicon.py`. Nothing generates or checks either pair.
4. **Unverified data feeding live paths.** `nakshatra_pada_akshara.py` (provisional), `tamil_name_corpus.py` (draft), `porutham.py` `VEDHA_TABLE_UNVERIFIED`, and `wealth_house_heuristic_factor` (explicitly unsourced). Each is labelled in code. Confirm the gates still hold before any launch.
5. **Remedy and caution logic is spread out.** Remedies come from six places and cautions from about twelve (§11, §12). The cross-reference tables above are the current map. If the product wants one "all cautions" or "all remedies" view, it needs an aggregator; none exists today.
