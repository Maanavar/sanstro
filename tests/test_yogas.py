from app.calculations.yogas import (
    detect_dhana_yoga,
    detect_gaja_kesari,
    detect_pitru_dosham,
    detect_rahu_ketu_dosham,
    detect_neecha_bhanga,
    detect_raja_yoga,
    detect_sevvai_dosham,
)


def test_t090_sevvai_dosham_detection():
    planets = {
        "SUN": 3,
        "MOON": 4,
        "MARS": 7,
        "MERCURY": 2,
        "JUPITER": 5,
        "VENUS": 6,
        "SATURN": 9,
        "RAHU": 11,
        "KETU": 5,
    }
    result = detect_sevvai_dosham(planets, lagna_rasi=1)
    assert result.is_present is True


def test_t091_sevvai_dosham_cancellation_for_certain_lagna():
    planets = {
        "SUN": 3,
        "MOON": 4,
        "MARS": 2,
        "MERCURY": 2,
        "JUPITER": 5,
        "VENUS": 6,
        "SATURN": 9,
        "RAHU": 11,
        "KETU": 5,
    }
    result = detect_sevvai_dosham(planets, lagna_rasi=1)
    assert result.is_present is True
    assert result.is_cancelled is True


def test_t091_both_partners_have_sevvai_dosham_cancellation():
    planets = {
        "SUN": 3,
        "MOON": 4,
        "MARS": 7,
        "MERCURY": 2,
        "JUPITER": 5,
        "VENUS": 6,
        "SATURN": 9,
        "RAHU": 11,
        "KETU": 5,
    }
    result = detect_sevvai_dosham(planets, lagna_rasi=2, partner_has_sevvai_dosham=True)
    assert result.is_present is True
    assert result.is_cancelled is True


def test_t092_sevvai_dosham_from_lagna_moon_venus():
    from_lagna = {
        "SUN": 3,
        "MOON": 4,
        "MARS": 7,
        "MERCURY": 2,
        "JUPITER": 5,
        "VENUS": 6,
        "SATURN": 9,
        "RAHU": 11,
        "KETU": 5,
    }
    from_moon = {
        "SUN": 3,
        "MOON": 1,
        "MARS": 8,
        "MERCURY": 2,
        "JUPITER": 5,
        "VENUS": 9,
        "SATURN": 10,
        "RAHU": 11,
        "KETU": 5,
    }
    from_venus = {
        "SUN": 3,
        "MOON": 1,
        "MARS": 10,
        "MERCURY": 2,
        "JUPITER": 5,
        "VENUS": 3,
        "SATURN": 7,
        "RAHU": 11,
        "KETU": 5,
    }
    lagna_result = detect_sevvai_dosham(from_lagna, lagna_rasi=1)
    moon_result = detect_sevvai_dosham(from_moon, lagna_rasi=2)
    venus_result = detect_sevvai_dosham(from_venus, lagna_rasi=2)
    assert "from_lagna" in lagna_result.conditions_met
    assert "from_moon" in moon_result.conditions_met
    assert "from_venus" in venus_result.conditions_met


def test_sevvai_tamil_mode_does_not_treat_first_house_as_dosham():
    planets = {
        "SUN": 3,
        "MOON": 5,
        "MARS": 1,
        "MERCURY": 2,
        "JUPITER": 5,
        "VENUS": 3,
        "SATURN": 9,
        "RAHU": 11,
        "KETU": 5,
    }
    result = detect_sevvai_dosham(planets, lagna_rasi=1, sevvai_mode="tamil_standard")
    assert result.is_present is False
    assert result.label == "NO_SEVVAI_DOSHAM"


def test_sevvai_extended_mode_treats_first_house_as_candidate():
    planets = {
        "SUN": 3,
        "MOON": 4,
        "MARS": 1,
        "MERCURY": 2,
        "JUPITER": 5,
        "VENUS": 6,
        "SATURN": 9,
        "RAHU": 11,
        "KETU": 5,
    }
    result = detect_sevvai_dosham(planets, lagna_rasi=1, sevvai_mode="extended_manglik")
    assert result.is_present is True
    assert result.label in {"ACTIVE_SEVVAI_DOSHAM", "STRONG_ACTIVE_SEVVAI_DOSHAM", "SEVVAI_DOSHAM_WITH_NIVARTHI"}


def test_t100_gaja_kesari_yoga():
    planets_true = {
        "JUPITER": 7,
    }
    result_true = detect_gaja_kesari(planets_true, moon_rasi=1)
    assert result_true.is_present is True

    planets_false = {
        "JUPITER": 2,
    }
    result_false = detect_gaja_kesari(planets_false, moon_rasi=1)
    assert result_false.is_present is False


def test_t101_raja_yoga():
    planets = {
        "SUN": 7,
        "MOON": 7,
        "MARS": 1,
        "MERCURY": 3,
        "JUPITER": 9,
        "VENUS": 2,
        "SATURN": 10,
        "RAHU": 11,
        "KETU": 5,
    }
    results = detect_raja_yoga(planets, lagna_rasi=1)
    assert any(item.is_present for item in results)


def test_t102_dhana_yoga():
    planets = {
        "SUN": 4,
        "MOON": 5,
        "MARS": 1,
        "MERCURY": 3,
        "JUPITER": 9,
        "VENUS": 8,
        "SATURN": 8,
        "RAHU": 11,
        "KETU": 5,
    }
    result = detect_dhana_yoga(planets, lagna_rasi=1)
    assert result.is_present is True


def test_t103_neecha_bhanga_raja_yoga():
    planets = {
        "SUN": 5,
        "MOON": 1,
        "MARS": 4,
        "MERCURY": 6,
        "JUPITER": 9,
        "VENUS": 2,
        "SATURN": 10,
        "RAHU": 11,
        "KETU": 5,
    }
    results = detect_neecha_bhanga(planets, lagna_rasi=1)
    mars_result = next(item for item in results if "planet_debilitated" in item.conditions_met)
    assert mars_result.is_present is True


def test_yoga_and_dosham_dasha_activation_flags():
    planets = {
        "SUN": 7,
        "MOON": 1,
        "MARS": 7,
        "MERCURY": 3,
        "JUPITER": 7,
        "VENUS": 2,
        "SATURN": 10,
        "RAHU": 11,
        "KETU": 5,
    }
    sevvai = detect_sevvai_dosham(planets, lagna_rasi=1, active_lords={"MARS"})
    gaja = detect_gaja_kesari(planets, moon_rasi=1, active_lords={"JUPITER"})
    dhana = detect_dhana_yoga(planets, lagna_rasi=1, active_lords={"VENUS"})
    assert sevvai.dasha_activated is True
    assert gaja.dasha_activated is True
    assert dhana.dasha_activated is True


def test_rahu_ketu_dosham_detects_sensitive_houses():
    planets = {
        "SUN": 3,
        "MOON": 4,
        "MARS": 7,
        "MERCURY": 2,
        "JUPITER": 5,
        "VENUS": 6,
        "SATURN": 9,
        "RAHU": 1,
        "KETU": 7,
    }
    result = detect_rahu_ketu_dosham(planets, lagna_rasi=1)
    assert result.is_present is True
    assert result.strength in {"PARTIAL", "STRONG"}


def test_rahu_ketu_sarpa_naga_label_for_5_9_axis():
    planets = {
        "SUN": 3,
        "MOON": 4,
        "MARS": 7,
        "MERCURY": 2,
        "JUPITER": 5,
        "VENUS": 6,
        "SATURN": 9,
        "RAHU": 5,
        "KETU": 11,
    }
    result = detect_rahu_ketu_dosham(planets, lagna_rasi=1)
    assert result.is_present is True
    assert result.label == "SARPA_NAGA_DOSHAM_CANDIDATE"
    assert result.category == "SARPA_NAGA"


def test_rahu_ketu_incomplete_data_label():
    planets = {
        "SUN": 3,
        "MOON": 4,
        "MARS": 7,
        "MERCURY": 2,
        "JUPITER": 5,
        "VENUS": 6,
        "SATURN": 9,
        "RAHU": 1,
    }
    result = detect_rahu_ketu_dosham(planets, lagna_rasi=1)
    assert result.label == "INCOMPLETE_DATA"
    assert "KETU" in result.missing_data


def test_pitru_dosham_detects_sun_node_pattern():
    planets = {
        "SUN": 9,
        "MOON": 4,
        "MARS": 7,
        "MERCURY": 2,
        "JUPITER": 5,
        "VENUS": 6,
        "SATURN": 9,
        "RAHU": 9,
        "KETU": 3,
    }
    result = detect_pitru_dosham(planets, lagna_rasi=1)
    assert result.is_present is True
    assert result.explanation_what_en
    assert result.explanation_why_en
    assert result.explanation_how_en


# --- Spec scenario §19.2: Mesha Lagna, Mars Viruchigam(8th), Jupiter Kadagam(4th), Moon Magaram(10th), Female ---

SCENARIO_PLANETS = {
    "SUN": 8,       # Viruchigam
    "MOON": 10,     # Magaram
    "MARS": 8,      # Viruchigam (8th from Mesham lagna)
    "MERCURY": 6,
    "JUPITER": 4,   # Kadagam
    "VENUS": 5,
    "SATURN": 9,
    "RAHU": 11,
    "KETU": 5,
}
SCENARIO_LAGNA = 1  # Mesham


def test_sevvai_scenario_mesha_lagna_8th_mars_female():
    """Spec §19.2: Mars 8th from Lagna (Viruchigam), own sign + Guru 5th aspect = SEVVAI_DOSHAM_WITH_NIVARTHI."""
    result = detect_sevvai_dosham(SCENARIO_PLANETS, SCENARIO_LAGNA, gender="female")
    assert result.is_present is True
    assert result.label == "SEVVAI_DOSHAM_WITH_NIVARTHI"
    assert "from_lagna" in result.conditions_met
    # Mars is in Viruchigam = own sign
    assert "mars_own_sign" in result.cancellation_factors
    # Jupiter in Kadagam(4) aspects Viruchigam(8) by 5th aspect
    assert "jupiter_aspect_on_mars" in result.cancellation_factors
    # Female chart — extra severity note must be present
    assert "female_high_attention_house" in result.conditions_met
    # Moon in Magaram(10): Mars is 11th from Moon, so no dosham from Moon
    assert "from_moon" not in result.conditions_met


def test_sevvai_house_sign_nivarthi_2nd_house_mithunam():
    """Spec §6.3: Mars in 2nd house from Lagna AND Mars rasi is Mithunam(3) → house_sign_nivarthi."""
    # Lagna = Rishabam(2), Mars = Mithunam(3) → 2nd house
    planets = {
        "SUN": 1,
        "MOON": 5,
        "MARS": 3,   # Mithunam — 2nd from Rishabam
        "MERCURY": 6,
        "JUPITER": 9,
        "VENUS": 2,
        "SATURN": 10,
        "RAHU": 11,
        "KETU": 5,
    }
    result = detect_sevvai_dosham(planets, lagna_rasi=2)
    assert result.is_present is True
    assert "house_sign_nivarthi" in result.cancellation_factors


def test_sevvai_mars_dispositor_kendra_trikona():
    """Spec §6.7: Mars in Thulaam(7), lord of Thulaam is Venus. Venus in kendra from Mars → dispositor nivarthi."""
    # Lagna=Mesham(1), Mars=Thulaam(7). Sign lord of Thulaam=VENUS.
    # Put Venus in Mesham(1) → house_from(Thulaam=7, Mesham=1) = 7th → kendra.
    planets = {
        "SUN": 1,
        "MOON": 3,
        "MARS": 7,   # Thulaam
        "MERCURY": 6,
        "JUPITER": 9,
        "VENUS": 1,  # Mesham — 7th from Thulaam (kendra from Mars)
        "SATURN": 10,
        "RAHU": 11,
        "KETU": 5,
    }
    result = detect_sevvai_dosham(planets, lagna_rasi=1)
    assert "mars_dispositor_kendra_trikona" in result.cancellation_factors


def test_sevvai_jupiter_conjunct_mars_major_cancellation():
    """Spec §6.5: Jupiter and Mars in same rasi → major cancellation."""
    planets = {
        "SUN": 3,
        "MOON": 5,
        "MARS": 8,
        "MERCURY": 6,
        "JUPITER": 8,   # same rasi as Mars
        "VENUS": 2,
        "SATURN": 10,
        "RAHU": 11,
        "KETU": 5,
    }
    result = detect_sevvai_dosham(planets, lagna_rasi=1)
    assert "jupiter_conjunct_mars" in result.cancellation_factors
    assert result.is_cancelled is True


def test_sevvai_kadagam_lagna_yogakaraka():
    """Spec §6.8: Kadagam(4) lagna — Mars is yogakaraka (5th+10th lord) → major cancellation."""
    planets = {
        "SUN": 3,
        "MOON": 5,
        "MARS": 11,   # 8th from Kadagam lagna
        "MERCURY": 6,
        "JUPITER": 4,
        "VENUS": 2,
        "SATURN": 10,
        "RAHU": 11,
        "KETU": 5,
    }
    result = detect_sevvai_dosham(planets, lagna_rasi=4)
    assert "mars_yogakaraka_lagna" in result.cancellation_factors
    assert result.is_cancelled is True


def test_sevvai_benefic_association_mars():
    """Spec §6.6: Moon conjunct Mars in same rasi → benefic_association_mars."""
    planets = {
        "SUN": 3,
        "MOON": 8,   # same rasi as Mars
        "MARS": 8,
        "MERCURY": 6,
        "JUPITER": 9,
        "VENUS": 2,
        "SATURN": 10,
        "RAHU": 11,
        "KETU": 5,
    }
    result = detect_sevvai_dosham(planets, lagna_rasi=1)
    assert "benefic_association_mars" in result.cancellation_factors


def test_sevvai_gender_male_high_attention():
    """Spec §7.2: Male chart — Mars in 7th → male_high_attention_house noted."""
    planets = {
        "SUN": 3,
        "MOON": 5,
        "MARS": 7,   # 7th from Mesham lagna
        "MERCURY": 6,
        "JUPITER": 9,
        "VENUS": 2,
        "SATURN": 10,
        "RAHU": 11,
        "KETU": 5,
    }
    result = detect_sevvai_dosham(planets, lagna_rasi=1, gender="male")
    assert "male_high_attention_house" in result.conditions_met


def test_rahu_ketu_node_afflicts_moon():
    """Spec §11.2: Rahu conjunct Moon → node_afflicts_moon detected."""
    planets = {
        "SUN": 3,
        "MOON": 5,
        "MARS": 7,
        "MERCURY": 6,
        "JUPITER": 9,
        "VENUS": 2,
        "SATURN": 10,
        "RAHU": 5,   # same rasi as Moon
        "KETU": 11,
    }
    result = detect_rahu_ketu_dosham(planets, lagna_rasi=1)
    assert "node_afflicts_moon" in result.conditions_met


def test_rahu_ketu_upachaya_noted():
    """Spec §13.4: Rahu in 3rd (upachaya) — rahu_ketu_upachaya noted but not marriage dosham."""
    planets = {
        "SUN": 3,
        "MOON": 5,
        "MARS": 7,
        "MERCURY": 6,
        "JUPITER": 4,
        "VENUS": 2,
        "SATURN": 10,
        "RAHU": 3,   # 3rd house = upachaya
        "KETU": 9,   # 9th — sarpa candidate
    }
    result = detect_rahu_ketu_dosham(planets, lagna_rasi=1)
    assert "rahu_ketu_upachaya" in result.conditions_met
    # Rahu in 3rd is NOT a marriage house — should not create marriage candidate
    assert "rahu_in_marriage_house" not in result.conditions_met


def test_rahu_ketu_female_high_attention_8th():
    """Spec §14.2: Female chart, Ketu in 8th → female_high_attention_house flagged."""
    planets = {
        "SUN": 3,
        "MOON": 5,
        "MARS": 7,
        "MERCURY": 6,
        "JUPITER": 4,
        "VENUS": 2,
        "SATURN": 10,
        "RAHU": 2,
        "KETU": 8,   # 8th house — marriage house + female attention
    }
    result = detect_rahu_ketu_dosham(planets, lagna_rasi=1, gender="female")
    assert "female_high_attention_house" in result.conditions_met
    assert result.is_present is True
