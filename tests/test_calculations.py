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
    utc_dt = local_datetime_to_utc(datetime(1993, 3, 15, 8, 15), "Asia/Kolkata")
    assert utc_dt.isoformat() == "1991-07-22T02:45:00+00:00"


# T010 — second IST to UTC golden case
def test_local_datetime_to_utc_second_reference_case():
    utc_dt = local_datetime_to_utc(datetime(2025, 5, 20, 15, 32), "Asia/Kolkata")
    assert utc_dt.isoformat() == "2025-05-20T10:02:00+00:00"


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

def test_chandrashtama_kumbam_moon_from_kadagam_janma():
    # Moon transiting Kumbam when Janma Rasi is Kadagam: 8th house = Chandrashtama
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
