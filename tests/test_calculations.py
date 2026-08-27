from datetime import datetime

import pytest

from app.calculations.astro import (
    house_from_reference,
    local_datetime_to_utc,
    navamsa_rasi_from_degree,
    navamsa_rasi_from_nakshatra_pada,
    normalize_longitude,
    rasi_from_degree,
)
from app.calculations.transits import classify_sani_cycle, is_gandanta


def test_meenam_is_rasi_12():
    assert rasi_from_degree(330.0) == 12


def test_dhanusu_is_rasi_9():
    assert rasi_from_degree(240.0) == 9


def test_house_from_reference_dhanusu_to_meenam_is_four():
    assert house_from_reference("Dhanusu", "Meenam") == 4


# T002 — additional house count golden cases from QA spec
def test_house_from_reference_magaram_to_meenam_is_three():
    assert house_from_reference("Magaram", "Meenam") == 3


def test_house_from_reference_kadagam_to_kumbam_is_eight():
    assert house_from_reference("Kadagam", "Kumbam") == 8


def test_uthiradam_third_paadham_maps_to_kumbam_navamsa():
    # T020 via nakshatra-pada lookup helper
    assert navamsa_rasi_from_nakshatra_pada("Uthiradam", 3) == 11


# T020 — Uthiradam 3rd Pada via degree calculation (Magaram → D9 Kumbam)
def test_uthiradam_third_pada_degree_maps_to_kumbam_navamsa():
    # Uthiradam (nakshatra 21) 3rd pada midpoint ≈ 274°
    uthiradam_3rd_pada_degree = 274.0
    assert rasi_from_degree(uthiradam_3rd_pada_degree) == 10  # Magaram
    assert navamsa_rasi_from_degree(uthiradam_3rd_pada_degree) == 11  # Kumbam


# T021 — Moolam 1st Pada (Dhanusu) → D9 Mesham (not Vargottama)
def test_moolam_first_pada_maps_to_mesham_navamsa():
    moolam_1st_pada_degree = 240.5  # midpoint of Moolam 1st pada
    assert rasi_from_degree(moolam_1st_pada_degree) == 9   # Dhanusu
    assert navamsa_rasi_from_degree(moolam_1st_pada_degree) == 1  # Mesham
    assert navamsa_rasi_from_degree(moolam_1st_pada_degree) != rasi_from_degree(moolam_1st_pada_degree)  # not Vargottama


# T022 — Rishabam 13°30' (absolute 43.5°) → D9 Rishabam = Vargottama
def test_rishabam_13_30_is_vargottama():
    absolute_degree = 43.5  # Rishabam 13.5°
    d1_rasi = rasi_from_degree(absolute_degree)
    d9_rasi = navamsa_rasi_from_degree(absolute_degree)
    assert d1_rasi == 2   # Rishabam
    assert d9_rasi == 2   # Rishabam
    assert d1_rasi == d9_rasi  # Vargottama confirmed


def test_longitude_normalization():
    assert normalize_longitude(-1.0) == 359.0
    assert normalize_longitude(361.25) == pytest.approx(1.25)


def test_local_datetime_to_utc_converts_ist_to_utc():
    utc_dt = local_datetime_to_utc(datetime(1991, 7, 22, 6, 30), "Asia/Kolkata")
    assert utc_dt.isoformat() == "1991-07-22T01:00:00+00:00"


# T010 — second IST to UTC golden case
def test_local_datetime_to_utc_second_reference_case():
    utc_dt = local_datetime_to_utc(datetime(2025, 5, 20, 15, 32), "Asia/Kolkata")
    assert utc_dt.isoformat() == "2025-05-20T10:02:00+00:00"


def test_local_datetime_to_utc_dst_ambiguous_hour_uses_later_fold():
    utc_dt = local_datetime_to_utc(datetime(2025, 11, 2, 1, 30), "America/New_York")
    assert utc_dt.isoformat() == "2025-11-02T06:30:00+00:00"


def test_local_datetime_to_utc_dst_spring_forward_gap_raises_error():
    with pytest.raises(ValueError):
        local_datetime_to_utc(datetime(2025, 3, 9, 2, 30), "America/New_York")


# ---------------------------------------------------------------------------
# T060 — Gandanta boundary tests
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("degree,expected", [
    (359.0, True),   # Meenam end
    (1.0, True),     # Mesham start
    (119.0, True),   # Kadagam end
    (121.0, True),   # Simmam start
    (239.0, True),   # Vrichigam end
    (241.0, True),   # Dhanusu start
    (150.0, False),  # Mid-sign — not Gandanta
    (90.0, False),   # Kadagam start — not Gandanta
])
def test_gandanta_boundaries(degree: float, expected: bool):
    assert is_gandanta(degree) == expected


# ---------------------------------------------------------------------------
# T050 — Chandrashtama
# ---------------------------------------------------------------------------

def test_house_from_reference_8th_kadagam_to_kumbam():
    # Rasi house calculation: Kumbam is the 8th house from Kadagam
    assert house_from_reference("Kadagam", "Kumbam") == 8


# ---------------------------------------------------------------------------
# T040–T042 — Sani cycle golden cases
# ---------------------------------------------------------------------------

def test_sani_cycle_dhanusu_moon_saturn_meenam_is_ardhashtama():
    # T040: house_from(Dhanusu 9, Meenam 12) = 4 → Ardhashtama Sani
    position = house_from_reference("Dhanusu", "Meenam")
    assert position == 4
    cycle = classify_sani_cycle(position)
    assert cycle.type == "ARDHASHTAMA_SANI"
    assert cycle.is_active is True


def test_sani_cycle_magaram_moon_saturn_meenam_no_named_cycle():
    # T041: house_from(Magaram 10, Meenam 12) = 3 → no named Saturn-pressure cycle
    position = house_from_reference("Magaram", "Meenam")
    assert position == 3
    cycle = classify_sani_cycle(position)
    assert cycle.is_active is False


def test_sani_cycle_meenam_moon_saturn_meenam_is_janma():
    # T042: house_from(Meenam, Meenam) = 1 → Janma Sani
    position = house_from_reference("Meenam", "Meenam")
    assert position == 1
    cycle = classify_sani_cycle(position)
    assert cycle.type == "JANMA_SANI"
    assert cycle.is_active is True


# ---------------------------------------------------------------------------
# T090 — Safety text: no forbidden phrases in any label output
# ---------------------------------------------------------------------------

FORBIDDEN_FRAGMENTS = [
    "you will die",
    "no marriage",
    "no children",
    "disaster period",
    "cursed",
    "guaranteed loss",
]

@pytest.mark.parametrize("label", ["STRONG_SUPPORT", "GOOD", "BALANCED", "CAUTION", "RESTORATIVE"])
@pytest.mark.parametrize("fragment", FORBIDDEN_FRAGMENTS)
def test_guidance_text_has_no_forbidden_phrases(label: str, fragment: str):
    from app.services.daily_guidance_service import _build_text
    text, action, caution = _build_text(50, label, [], [])
    combined = (text.en + text.ta + action.en + action.ta + caution.en + caution.ta).lower()
    assert fragment not in combined, f"Label '{label}' output contains forbidden phrase: '{fragment}'"


# ---------------------------------------------------------------------------
# BUG-01 — Chandrashtama: must use 8th Rasi from natal Moon, not 8th Nakshatra
# ---------------------------------------------------------------------------

def test_chandrashtama_8th_rasi_from_natal_moon_kadagam():
    # Kadagam (4) natal Moon → Chandrashtama Rasi = Kumbam (11)
    # house_from(4, 11) = (11-4)%12 + 1 = 8 ✓
    natal_moon_rasi = 4
    chandrashtama_rasi = ((natal_moon_rasi - 1 + 7) % 12) + 1
    assert chandrashtama_rasi == 11
    assert house_from_reference(natal_moon_rasi, chandrashtama_rasi) == 8


def test_chandrashtama_8th_rasi_from_natal_moon_rishabam():
    # Rishabam (2) natal Moon → Chandrashtama Rasi = Dhanusu (9)
    natal_moon_rasi = 2
    chandrashtama_rasi = ((natal_moon_rasi - 1 + 7) % 12) + 1
    assert chandrashtama_rasi == 9
    assert house_from_reference(natal_moon_rasi, chandrashtama_rasi) == 8


def test_chandrashtama_all_rasis_produce_correct_8th():
    for rasi in range(1, 13):
        chandrashtama_rasi = ((rasi - 1 + 7) % 12) + 1
        assert house_from_reference(rasi, chandrashtama_rasi) == 8


# ---------------------------------------------------------------------------
# BUG-02 — Amavasai (Tithi 30) must not be in the panchangam score penalty set
# ---------------------------------------------------------------------------

def test_amavasai_not_in_ashtami_penalty_set():
    penalty_tithis = {8, 23}
    assert 30 not in penalty_tithis


def test_ashtami_in_penalty_set():
    penalty_tithis = {8, 23}
    assert 8 in penalty_tithis
    assert 23 in penalty_tithis


# ---------------------------------------------------------------------------
# BUG-03 — Kandaka Sani from the Janma Rasi: fires for 4, 7, 10
# Doctrine A-1 (ruled 2026-08-19) moved the reference from Lagna to Janma Rasi
# and dropped the 1st, which is Janma Sani's position.
# ---------------------------------------------------------------------------

def test_kandaka_sani_from_janma_rasi_detected():
    from app.calculations.transits import classify_kandaka_cycle
    for house in [4, 7, 10]:
        result = classify_kandaka_cycle(house)
        assert result.is_active is True
        assert result.type == "KANDAKA_SANI"


def test_kandaka_sani_not_active_for_other_houses():
    from app.calculations.transits import classify_kandaka_cycle
    for house in [1, 2, 3, 5, 6, 8, 9, 11, 12]:
        result = classify_kandaka_cycle(house)
        assert result.is_active is False


def test_kandaka_layers_over_the_moon_cycles_rather_than_replacing_them():
    """Doctrine A-1: the overlap is the rule, not a modelling defect.

    Saturn in the 4th from the Janma Rasi is Ardhashtama Sani *and* Kandaka
    Sani. We used to count Kandaka from the Lagna precisely so this could never
    happen; a reader in that position must now be told both names.
    """
    from app.calculations.transits import classify_kandaka_cycle, classify_sani_cycle

    assert classify_sani_cycle(4).type == "ARDHASHTAMA_SANI"
    assert classify_kandaka_cycle(4).type == "KANDAKA_SANI"
    # The 7th and 10th are Kandaka alone — no Moon-reference cycle names them.
    for house in (7, 10):
        assert classify_sani_cycle(house).is_active is False
        assert classify_kandaka_cycle(house).is_active is True
    # The 1st is Janma Sani alone, no longer also Kandaka.
    assert classify_sani_cycle(1).type == "JANMA_SANI"
    assert classify_kandaka_cycle(1).is_active is False


def test_each_kandaka_limb_names_what_it_governs():
    """FCR-04: one penalty, three readings.

    The score is deliberately flat across 4/7/10 and scored once. The *copy* is
    not, and must not go back to being one generic line. At the 4th, where
    Kandaka always coincides with Ardhashtama, an unattributed obstruction line
    beside the Ardhashtama reading looks like a second affliction. At the 10th —
    the limb standard gochar reads as mixed rather than adverse — a flat penalty
    the reader's own reading does not corroborate needs to say what it is about.
    """
    from app.calculations.transits import classify_kandaka_cycle

    labels = {h: classify_kandaka_cycle(h).supportive_label for h in (4, 7, 10)}
    assert all(labels.values()), "a Kandaka limb lost its label"
    assert len(set(labels.values())) == 3, f"limbs share copy: {labels}"
    # The contested limb must name the domain it governs, not caution in general.
    tenth = labels[10].lower()
    assert any(word in tenth for word in ("position", "standing", "work")), (
        f"the 10th limb says nothing about what it governs: {labels[10]}"
    )


# ---------------------------------------------------------------------------
# BUG-10 — Functional nature: Lagna-based transit and dasha modifiers
# ---------------------------------------------------------------------------

def test_functional_nature_yogakaraka_gives_highest_transit_modifier():
    from app.calculations.functional_nature import get_transit_modifier
    # Saturn is Yogakaraka for Thulaam (7) → modifier 1.35
    # Saturn is NEUTRAL for Mesha (1) → modifier 1.00
    saturn_thulaam = get_transit_modifier(7, "SATURN")
    saturn_mesha   = get_transit_modifier(1, "SATURN")
    assert saturn_thulaam > saturn_mesha


def test_functional_nature_dusthana_gives_lowest_transit_modifier():
    from app.calculations.functional_nature import get_transit_modifier
    # Jupiter is DUSTHANA for Thulaam (7) — 3rd+6th lord
    # Jupiter is LAGNA_LORD for Dhanusu (9) — 1st lord
    jup_thulaam = get_transit_modifier(7, "JUPITER")
    jup_dhanusu = get_transit_modifier(9, "JUPITER")
    assert jup_dhanusu > jup_thulaam


def test_jupiter_dasha_modifier_differs_by_lagna():
    from app.calculations.functional_nature import get_dasha_modifier
    # Dhanusu (9): Jupiter = LAGNA_LORD → high dasha modifier
    # Thulaam (7): Jupiter = DUSTHANA → low dasha modifier
    assert get_dasha_modifier(9, "JUPITER") > get_dasha_modifier(7, "JUPITER")


def test_all_lagnas_all_planets_covered():
    from app.calculations.functional_nature import FunctionalNature, get_functional_nature
    planets = ["SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN", "RAHU", "KETU"]
    for lagna in range(1, 13):
        for planet in planets:
            nature = get_functional_nature(lagna, planet)
            assert isinstance(nature, FunctionalNature)


def test_saturn_yogakaraka_for_rishabam_and_thulaam():
    from app.calculations.functional_nature import FunctionalNature, get_functional_nature
    # Saturn rules 9th+10th for Rishabam → Yogakaraka
    assert get_functional_nature(2, "SATURN") == FunctionalNature.YOGAKARAKA
    # Saturn rules 4th+5th for Thulaam → Yogakaraka
    assert get_functional_nature(7, "SATURN") == FunctionalNature.YOGAKARAKA


def test_venus_yogakaraka_for_magaram_and_kumbam():
    from app.calculations.functional_nature import FunctionalNature, get_functional_nature
    # Venus rules 5th+10th for Magaram → Yogakaraka
    assert get_functional_nature(10, "VENUS") == FunctionalNature.YOGAKARAKA
    # Venus rules 4th+9th for Kumbam → Yogakaraka
    assert get_functional_nature(11, "VENUS") == FunctionalNature.YOGAKARAKA


# ---------------------------------------------------------------------------
# BUG-04 — Graha relationship score: complete natural friendship table
# ---------------------------------------------------------------------------

def test_t070_mesha_functional_nature_spot_check():
    from app.calculations.functional_nature import FunctionalNature, get_functional_nature
    assert get_functional_nature(1, "MARS") == FunctionalNature.LAGNA_LORD
    assert get_functional_nature(1, "SUN") == FunctionalNature.TRIKONA
    assert get_functional_nature(1, "VENUS") == FunctionalNature.MARAKA
    assert get_functional_nature(1, "SATURN") == FunctionalNature.NEUTRAL


def test_t072_all_12_lagnas_minimum_functional_nature_checks():
    from app.calculations.functional_nature import FunctionalNature, get_functional_nature

    lagna_lords = {
        1: "MARS",
        2: "VENUS",
        3: "MERCURY",
        4: "MOON",
        5: "SUN",
        6: "MERCURY",
        7: "VENUS",
        8: "MARS",
        9: "JUPITER",
        10: "SATURN",
        11: "SATURN",
        12: "JUPITER",
    }
    yogakaraka_by_lagna = {
        1: None,
        2: "SATURN",
        3: None,
        4: "MARS",
        5: "MARS",
        6: None,
        7: "SATURN",
        8: None,
        9: None,
        10: "VENUS",
        11: "VENUS",
        12: None,
    }
    planets = ["SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN", "RAHU", "KETU"]

    for lagna in range(1, 13):
        assert get_functional_nature(lagna, lagna_lords[lagna]) == FunctionalNature.LAGNA_LORD
        expected_yogakaraka = yogakaraka_by_lagna[lagna]
        actual_yogakarakas = [
            planet for planet in planets
            if get_functional_nature(lagna, planet) == FunctionalNature.YOGAKARAKA
        ]
        if expected_yogakaraka is None:
            assert actual_yogakarakas == []
        else:
            assert actual_yogakarakas == [expected_yogakaraka]

    jupiter_natures = {get_functional_nature(lagna, "JUPITER") for lagna in range(1, 13)}
    saturn_natures = {get_functional_nature(lagna, "SATURN") for lagna in range(1, 13)}
    assert jupiter_natures != {FunctionalNature.YOGAKARAKA}
    assert saturn_natures != {FunctionalNature.DUSTHANA}


def test_relationship_same_lord():
    from app.services.daily_guidance_service import _graha_relationship_score
    assert _graha_relationship_score("JUPITER", "JUPITER") == 72


def test_relationship_friends_symmetric():
    from app.services.daily_guidance_service import _graha_relationship_score
    assert _graha_relationship_score("JUPITER", "SUN") == 70
    assert _graha_relationship_score("SUN", "JUPITER") == 70


def test_relationship_enemies_symmetric():
    from app.services.daily_guidance_service import _graha_relationship_score
    assert _graha_relationship_score("SUN", "SATURN") == 38
    assert _graha_relationship_score("SATURN", "SUN") == 38


def test_relationship_neutral():
    from app.services.daily_guidance_service import _graha_relationship_score
    assert _graha_relationship_score("JUPITER", "SATURN") == 55


def test_all_36_pairs_covered_with_valid_scores():
    from app.services.daily_guidance_service import _graha_relationship_score
    planets = ["SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN", "RAHU", "KETU"]
    for m in planets:
        for a in planets:
            score = _graha_relationship_score(m, a)
            assert score in {38, 55, 70, 72}, f"Unexpected score {score} for {m}/{a}"


# ---------------------------------------------------------------------------
# BUG-05 — Ashtakavarga: real bindus, 0-8 range, chart-specific
# ---------------------------------------------------------------------------

def test_bav_bindu_range_0_to_8():
    from app.calculations.ashtakavarga import compute_bhinnashtakavarga, get_av_bindu
    natal = {"SUN": 5, "MOON": 3, "MARS": 8, "MERCURY": 4, "JUPITER": 9, "VENUS": 6, "SATURN": 11, "LAGNA": 1}
    bav = compute_bhinnashtakavarga(natal)
    for planet in ["SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN"]:
        for rasi in range(1, 13):
            b = get_av_bindu(bav, planet, rasi)
            assert b is not None, f"Missing bindu for {planet} rasi {rasi}"
            assert 0 <= b <= 8, f"Out of range bindu {b} for {planet} rasi {rasi}"


def test_bav_sarvashtakavarga_total_in_expected_range():
    from app.calculations.ashtakavarga import compute_bhinnashtakavarga, compute_sarvashtakavarga
    natal = {"SUN": 5, "MOON": 3, "MARS": 8, "MERCURY": 4, "JUPITER": 9, "VENUS": 6, "SATURN": 11, "LAGNA": 1}
    bav = compute_bhinnashtakavarga(natal)
    sarva = compute_sarvashtakavarga(bav)
    total = sum(sarva.values())
    assert 200 <= total <= 350, f"Sarvashtakavarga total {total} out of expected range 200-350"


def test_two_different_charts_produce_different_bindus():
    from app.calculations.ashtakavarga import compute_bhinnashtakavarga, get_av_bindu
    chart_a = {"SUN": 1, "MOON": 4, "MARS": 7, "MERCURY": 10, "JUPITER": 1, "VENUS": 4, "SATURN": 7, "LAGNA": 1}
    chart_b = {"SUN": 6, "MOON": 9, "MARS": 12, "MERCURY": 3, "JUPITER": 6, "VENUS": 9, "SATURN": 12, "LAGNA": 7}
    bav_a = compute_bhinnashtakavarga(chart_a)
    bav_b = compute_bhinnashtakavarga(chart_b)
    # At least one rasi must differ for Jupiter
    diffs = sum(
        1 for rasi in range(1, 13)
        if get_av_bindu(bav_a, "JUPITER", rasi) != get_av_bindu(bav_b, "JUPITER", rasi)
    )
    assert diffs > 0, "Two different charts must produce different Jupiter AV bindus"


def test_rahu_ketu_have_no_bav_table_and_get_no_proxy():
    """Doctrine A-15 (ruled 2026-08-19): the nodes are omitted, not proxied.

    Saturn's table used to be substituted for both nodes on an attribution
    ("common Thirukanitham practice") that nothing in this repository sourced.
    None is the honest answer; it also stops a table-less graha collecting the
    +8 that callers award for `bindus >= 4`.
    """
    from app.calculations.ashtakavarga import compute_bhinnashtakavarga, get_av_bindu
    natal = {"SUN": 5, "MOON": 3, "MARS": 8, "MERCURY": 4, "JUPITER": 9, "VENUS": 6, "SATURN": 11, "LAGNA": 1}
    bav = compute_bhinnashtakavarga(natal)
    for rasi in range(1, 13):
        assert get_av_bindu(bav, "RAHU", rasi) is None
        assert get_av_bindu(bav, "KETU", rasi) is None
        # Specifically not Saturn's value — the shape of the old proxy.
        assert get_av_bindu(bav, "RAHU", rasi) != get_av_bindu(bav, "SATURN", rasi)


# ---------------------------------------------------------------------------
# BUG-06 — Natal planet strength: exalted > own > debilitated; combust penalty
# ---------------------------------------------------------------------------

def test_exalted_planet_higher_than_debilitated():
    from app.calculations.chart_strength import compute_natal_planet_score
    exalted     = compute_natal_planet_score("JUPITER", 4,  4 * 30 + 5.0, 1, 0.0, False)
    debilitated = compute_natal_planet_score("JUPITER", 10, 10 * 30 + 5.0, 1, 0.0, False)
    assert exalted > debilitated


def test_combust_planet_lower_score():
    from app.calculations.chart_strength import compute_natal_planet_score
    combust = compute_natal_planet_score("MERCURY", 5, 5 * 30 + 2.0, 1, 5 * 30 + 1.0, False)
    clear   = compute_natal_planet_score("MERCURY", 5, 5 * 30 + 2.0, 1, 2 * 30 + 1.0, False)
    assert clear > combust


# ---------------------------------------------------------------------------
# EC-7.1 — Graded combustion + calibrated cazimi (2026-07-15 astrologer ruling)
# Combustion is a gradient, not a hard boundary: full weight near an exact
# conjunction, tapering to zero at the planet's combustion orb edge. Cazimi
# (within 0°17') flips the penalty to a fixed bonus.
# ---------------------------------------------------------------------------

def test_combustion_severity_is_graded_by_nearness():
    from app.calculations.transits import combustion_severity, CAZIMI_ORB

    # Mercury direct: 14° combustion orb.
    orb = 14.0
    # Just outside the cazimi boundary — maximally burnt.
    near = combustion_severity("MERCURY", CAZIMI_ORB + 1e-4, 0.0, False)
    # Midpoint of the taper band ≈ 0.5.
    mid_sep = (orb + CAZIMI_ORB) / 2.0
    mid = combustion_severity("MERCURY", mid_sep, 0.0, False)
    assert near == pytest.approx(1.0, abs=1e-3)
    assert mid == pytest.approx(0.5, abs=1e-3)
    # At and beyond the orb edge → no combustion.
    assert combustion_severity("MERCURY", orb, 0.0, False) == 0.0
    assert combustion_severity("MERCURY", orb + 0.5, 0.0, False) == 0.0
    # Inside the cazimi heart → 0.0 (caller applies the bonus, not a penalty).
    assert combustion_severity("MERCURY", CAZIMI_ORB / 2.0, 0.0, False) == 0.0
    # Non-combusting bodies never register severity.
    assert combustion_severity("SUN", 0.05, 0.0, False) == 0.0
    assert combustion_severity("RAHU", 0.05, 0.0, False) == 0.0
    assert combustion_severity("MOON", 0.05, 0.0, False) == 0.0


def test_graded_combustion_scoring_orders_by_depth():
    from app.calculations.chart_strength import compute_natal_planet_score

    # Same Mercury, only the Sun's separation changes (sun_longitude feeds only
    # the combustion/cazimi term in this scorer).
    natal = 5 * 30 + 2.0  # 152.0
    deep_combust    = compute_natal_planet_score("MERCURY", 5, natal, 1, natal - 1.0, False)   # sep 1°
    shallow_combust = compute_natal_planet_score("MERCURY", 5, natal, 1, natal - 12.5, False)  # sep 12.5° (< 14° orb)
    not_combust     = compute_natal_planet_score("MERCURY", 5, natal, 1, natal - 60.0, False)  # far
    cazimi          = compute_natal_planet_score("MERCURY", 5, natal, 1, natal - 0.1, False)   # sep 0.1° (< 0°17')

    # Graded, not flat: a shallowly-combust planet outscores a deeply-combust one.
    assert shallow_combust > deep_combust
    # A non-combust planet outscores any combust one.
    assert not_combust > shallow_combust
    # Cazimi flips weak→fortified: it outscores the plain non-combust baseline.
    assert cazimi > not_combust


def test_ec71_magnitudes_locked():
    # Regression lock on the EC-7.1 ruling. Change deliberately with sourcing.
    from app.calculations.chart_strength import CAZIMI_BONUS, MAX_COMBUSTION_PENALTY

    assert CAZIMI_BONUS == 10.0
    assert MAX_COMBUSTION_PENALTY == 22.0


def test_vargottama_bonus_improves_natal_strength():
    from app.calculations.chart_strength import compute_natal_planet_score
    without_bonus = compute_natal_planet_score("JUPITER", 2, 2 * 30 + 0.0, 1, 0.0, False, False)
    with_bonus = compute_natal_planet_score("JUPITER", 2, 2 * 30 + 0.0, 1, 0.0, False, True)
    assert with_bonus > without_bonus


def test_d9_dignity_bonus_applies_when_d1_is_average():
    from app.calculations.chart_strength import compute_natal_planet_score
    baseline = compute_natal_planet_score("JUPITER", 11, 11 * 30 + 5.0, 1, 0.0, False)
    with_d9_dignity = compute_natal_planet_score("JUPITER", 11, 11 * 30 + 5.0, 1, 0.0, False, d9_rasi=9)
    assert with_d9_dignity > baseline


def test_d9_debilitation_penalises_a_rasi_exalted_planet():
    """Exalted in Rasi, neecha in Navamsa must score below the same placement
    with a neutral D9. This is the case the D9 chart exists to catch, and it
    previously scored identically because only the bonus half was applied."""
    from app.calculations.chart_strength import compute_natal_planet_score
    # Jupiter exalted in Cancer (rasi 4), debilitated in Capricorn (rasi 10).
    neutral_d9 = compute_natal_planet_score("JUPITER", 4, 4 * 30 + 5.0, 1, 0.0, False, d9_rasi=2)
    neecha_d9 = compute_natal_planet_score("JUPITER", 4, 4 * 30 + 5.0, 1, 0.0, False, d9_rasi=10)
    assert neecha_d9 < neutral_d9


def test_d9_debilitation_is_exempt_when_vargottama():
    """Vargottama holds the sign across D1/D9, which is stabilising even in a
    debilitation sign — it must not be charged the neecha penalty as well."""
    from app.calculations.chart_strength import compute_natal_planet_score
    plain = compute_natal_planet_score("JUPITER", 10, 10 * 30 + 5.0, 1, 0.0, False, d9_rasi=10)
    vargottama = compute_natal_planet_score(
        "JUPITER", 10, 10 * 30 + 5.0, 1, 0.0, False, is_vargottama=True, d9_rasi=10
    )
    assert vargottama > plain


def test_benefic_aspects_improve_natal_strength():
    from app.calculations.chart_strength import compute_natal_planet_score
    malefic_pressure = compute_natal_planet_score("JUPITER", 2, 2 * 30 + 5.0, 1, 0.0, False, False, 0, 2)
    benefic_support = compute_natal_planet_score("JUPITER", 2, 2 * 30 + 5.0, 1, 0.0, False, False, 2, 0)
    assert benefic_support > malefic_pressure


def test_moolatrikona_dignity_scores():
    from app.calculations.chart_strength import _dignity_score
    assert _dignity_score("JUPITER", 9, 9 * 30 + 5.0) == 90   # Moolatrikona (0-10°)
    assert _dignity_score("JUPITER", 12, 12 * 30 + 5.0) == 80  # Own sign
    assert _dignity_score("JUPITER", 4, 4 * 30 + 5.0) == 100   # Exaltation


def test_debilitation_lowest_dignity():
    from app.calculations.chart_strength import _dignity_score
    assert _dignity_score("JUPITER", 10, 10 * 30 + 5.0) == 15  # Debilitation


# ---------------------------------------------------------------------------
# BUG-08 — Vedha Vichara: blocking planet cancels transit benefit
# ---------------------------------------------------------------------------

def test_vedha_blocked_when_blocking_planet_present():
    from app.calculations.transits import check_vedha
    # Jupiter in house 9 from Moon; Vedha house = 10. Saturn in house 10 → blocks
    all_houses = {"JUPITER": 9, "SATURN": 10, "MOON": 3}
    assert check_vedha("JUPITER", 9, all_houses) is True


def test_vedha_not_blocked_when_blocking_house_empty():
    from app.calculations.transits import check_vedha
    # Jupiter in house 9; Vedha house = 10. No planet in 10.
    all_houses = {"JUPITER": 9, "SATURN": 6, "MOON": 3}
    assert check_vedha("JUPITER", 9, all_houses) is False


def test_vedha_returns_false_for_planet_with_no_table():
    from app.calculations.transits import check_vedha
    # MARS has no Vedha table entry
    all_houses = {"MARS": 5, "JUPITER": 7}
    assert check_vedha("MARS", 5, all_houses) is False


# ---------------------------------------------------------------------------
# WI-14 — classical Sun<->Saturn and Moon<->Mercury Vedha exemptions
# ---------------------------------------------------------------------------

def test_vedha_sun_saturn_exemption_both_directions():
    from app.calculations.transits import check_vedha
    # Sun in house 3 from Moon; Sun's Vedha house = 9. Saturn occupying 9
    # must NOT cancel Sun's transit benefit (classical exemption).
    assert check_vedha("SUN", 3, {"SATURN": 9}) is False
    # Saturn in house 6 from Moon; Saturn's Vedha house = 9. Sun occupying 9
    # must NOT cancel Saturn's transit benefit either.
    assert check_vedha("SATURN", 6, {"SUN": 9}) is False


def test_vedha_moon_mercury_exemption_both_directions():
    from app.calculations.transits import check_vedha
    # Moon in house 1 from Moon (i.e. conjunct); Moon's Vedha house = 5.
    # Mercury occupying 5 must NOT cancel Moon's transit benefit.
    assert check_vedha("MOON", 1, {"MERCURY": 5}) is False
    # Mercury in house 2 from Moon; Mercury's Vedha house = 5. Moon occupying
    # 5 must NOT cancel Mercury's transit benefit either.
    assert check_vedha("MERCURY", 2, {"MOON": 5}) is False


def test_vedha_unrelated_planet_still_blocks_despite_exemptions():
    from app.calculations.transits import check_vedha
    # Sun's Vedha house (9) occupied by an unrelated planet (Jupiter, not
    # part of any exempt pair) still blocks as normal.
    assert check_vedha("SUN", 3, {"JUPITER": 9}) is True
