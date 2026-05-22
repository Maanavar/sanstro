from app.calculations.astro import house_from_reference
from app.calculations.transits import classify_kandaka_cycle, classify_sani_cycle, is_gandanta


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


# T050 — Chandrashtama: Moon in Kumbam(11), Katakam(4) Moon is affected
def test_chandrashtama_kumbam_moon_affects_katakam_janma():
    current_moon_rasi = 11  # Kumbam
    janma_rasi = 4           # Katakam / Kadagam
    position = house_from_reference(janma_rasi, current_moon_rasi)
    assert position == 8     # 8th house = chandrashtama


# T060 — additional Gandanta boundary tests from QA spec
def test_gandanta_at_fire_water_junctions():
    assert is_gandanta(359.0) is True   # Meenam end
    assert is_gandanta(1.0) is True     # Mesham start
    assert is_gandanta(119.0) is True   # Kadagam end
    assert is_gandanta(121.0) is True   # Simmam start
    assert is_gandanta(239.0) is True   # Vrichigam end
    assert is_gandanta(241.0) is True   # Dhanusu start
    assert is_gandanta(150.0) is False  # unrelated zone

