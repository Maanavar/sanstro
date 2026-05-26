from app.calculations.astro import house_from_reference
from app.calculations.ephemeris import EphemerisBody, EphemerisSnapshot
from app.calculations.transits import (
    classify_kandaka_cycle,
    classify_sani_cycle,
    get_jupiter_aspects,
    get_saturn_aspects,
    is_gandanta,
    planets_transited_by,
)


def test_sani_cycle_mapping_uses_expected_house_numbers():
    assert classify_sani_cycle(4).type == "ARDHASHTAMA_SANI"
    assert classify_sani_cycle(1).type == "JANMA_SANI"
    assert classify_sani_cycle(2).type == "EZHARAI_SANI_PHASE_3"
    assert classify_sani_cycle(3).type is None


# T040 — Dhanusu Moon + Saturn in Meenam = Ardhashtama Sani (house 4), NOT Janma Sani
def test_dhanusu_moon_saturn_meenam_is_ardhashtama_not_janma():
    janma_rasi = 9   # Dhanusu
    saturn_rasi = 12  # Meenam
    position = house_from_reference(janma_rasi, saturn_rasi)
    assert position == 4
    cycle = classify_sani_cycle(position)
    assert cycle.type == "ARDHASHTAMA_SANI"
    assert cycle.type != "JANMA_SANI"
    assert cycle.is_active is True


# T041 — Magaram Moon + Saturn in Meenam = house 3, no named cycle
def test_magaram_moon_saturn_meenam_has_no_named_cycle():
    janma_rasi = 10  # Magaram
    saturn_rasi = 12  # Meenam
    position = house_from_reference(janma_rasi, saturn_rasi)
    assert position == 3
    cycle = classify_sani_cycle(position)
    assert cycle.type is None
    assert cycle.is_active is False


# T042 — Meenam Moon + Saturn in Meenam = house 1, Janma Sani
def test_meenam_moon_saturn_meenam_is_janma_sani():
    janma_rasi = 12  # Meenam
    saturn_rasi = 12  # Meenam
    position = house_from_reference(janma_rasi, saturn_rasi)
    assert position == 1
    cycle = classify_sani_cycle(position)
    assert cycle.type == "JANMA_SANI"
    assert cycle.is_active is True


def test_kandaka_cycle_is_only_active_on_quadrants_from_lagna():
    assert classify_kandaka_cycle(1).type == "KANDAKA_SANI"
    assert classify_kandaka_cycle(4).type == "KANDAKA_SANI"
    assert classify_kandaka_cycle(7).type == "KANDAKA_SANI"
    assert classify_kandaka_cycle(10).type == "KANDAKA_SANI"
    assert classify_kandaka_cycle(2).type is None


def test_gandanta_uses_three_degrees_twenty_minutes():
    assert is_gandanta(0.5) is True
    assert is_gandanta(357.0) is True
    assert is_gandanta(117.0) is True
    assert is_gandanta(240.5) is True
    assert is_gandanta(30.0) is False


# T050 — house_from_reference: Kumbam(11) is 8th house from Katakam(4)
def test_house_from_reference_kumbam_is_8th_from_katakam():
    current_moon_rasi = 11  # Kumbam
    janma_rasi = 4           # Katakam / Kadagam
    position = house_from_reference(janma_rasi, current_moon_rasi)
    assert position == 8


# T060 — additional Gandanta boundary tests from QA spec
def test_gandanta_at_fire_water_junctions():
    assert is_gandanta(359.0) is True   # Meenam end
    assert is_gandanta(1.0) is True     # Mesham start
    assert is_gandanta(119.0) is True   # Kadagam end
    assert is_gandanta(121.0) is True   # Simmam start
    assert is_gandanta(239.0) is True   # Vrichigam end
    assert is_gandanta(241.0) is True   # Dhanusu start
    assert is_gandanta(150.0) is False  # unrelated zone


def test_jupiter_special_aspects():
    assert get_jupiter_aspects(1) == [5, 7, 9]
    assert get_jupiter_aspects(11) == [3, 5, 7]


def test_saturn_special_aspects():
    assert get_saturn_aspects(1) == [3, 7, 10]
    assert get_saturn_aspects(12) == [2, 6, 9]


def test_planets_transited_by_same_rasi_detection():
    snapshot = EphemerisSnapshot(
        jd_ut=0.0,
        backend="test",
        ayanamsa="LAHIRI",
        ayanamsa_value_degrees=0.0,
        bodies={
            "SUN": EphemerisBody("SUN", 5.0, 1.0, 1, 5.0, False, False),
            "JUPITER": EphemerisBody("JUPITER", 35.0, 1.0, 2, 5.0, False, False),
            "SATURN": EphemerisBody("SATURN", 65.0, 1.0, 3, 5.0, False, False),
        },
    )
    natal = {
        "MOON": {"rasi": 2},
        "VENUS": {"rasi": 1},
        "MARS": {"rasi": 12},
    }
    transited = planets_transited_by(snapshot, natal)
    assert transited["MOON"] == ["JUPITER"]
    assert transited["VENUS"] == ["SUN"]
    assert transited["MARS"] == []

