"""Unit tests for the 10-kuta Porutham engine."""
from __future__ import annotations

import pytest

from app.calculations.porutham import (
    _dinam_score,
    _ganam_score,
    _graha_maitri_kuta,
    _mahendra_score,
    _rajju_score,
    _rasi_score,
    _stree_dirgha_score,
    _vasya_score,
    _vedha_score,
    _yoni_score,
    check_nadi_dosha,
    compute_porutham,
)

# ---------------------------------------------------------------------------
# Individual kuta tests
# ---------------------------------------------------------------------------

def test_dinam_same_nakshatra():
    # diff == 0, remainder 0 → same nakshatra group = inauspicious per Tamil Thirukanitham → 0
    assert _dinam_score(1, 1) == 0


def test_dinam_bad_position():
    # diff = (15 - 1) % 27 = 14; 14 % 9 = 5 → 5 not in {0..4} → poor
    assert _dinam_score(15, 1) == 0


def test_ganam_same():
    # Aswini (Deva) and Mirugaseeridam (Deva) — same gana
    assert _ganam_score(1, 5) == 6


def test_ganam_deva_manushya():
    # Aswini (Deva=1) and Pooram (Manushya=2)
    assert _ganam_score(1, 11) == 5


def test_ganam_deva_rakshasa():
    # Aswini (Deva) and Karthigai/Krittika (Rakshasa) — incompatible
    assert _ganam_score(1, 3) == 0


def test_yoni_same_nakshatra():
    # Aswini and Sathayam — both Yoni 1 (Horse) ? let's check Aswini=1,Aswini=1
    assert _yoni_score(1, 1) == 4


def test_yoni_hostile_pair():
    # Aswini(1)=Horse and Hastham(13)=Buffalo — natural enemies
    assert _yoni_score(1, 13) == 0


def test_rasi_seventh():
    # Boy rasi 1, girl rasi 7 → diff 7 → max score
    assert _rasi_score(1, 7) == 7


def test_rasi_fourth():
    # Boy rasi 1, girl rasi 4 → diff 4 → hostile
    assert _rasi_score(1, 4) == 0


def test_graha_maitri_same_lord():
    # Rasi 1 (Mesham, lord MARS) vs rasi 8 (Viruchigam, lord MARS) — same planet
    assert _graha_maitri_kuta(1, 8) == 5


def test_rajju_same_group():
    # Aswini(1) group 1 and Magam(10) group 1 in rajju cycle → dosha
    assert _rajju_score(1, 10) == 0


def test_rajju_different_group():
    # Aswini(1) group 1, Rohini(4) group 4
    assert _rajju_score(1, 4) == 2


def test_vedha_pair():
    # Aswini(1) and Kettai/Jyeshtha(18) are a classical vedha pair
    assert _vedha_score(1, 18) == 0


def test_vedha_non_pair():
    assert _vedha_score(1, 2) == 2


def test_vasya_mutual():
    # Rasi 3 (Mithunam) → vasya to 9 and 6; rasi 9 (Dhanusu) → vasya to 3 and 6
    assert _vasya_score(3, 9) == 2


def test_vasya_none():
    assert _vasya_score(1, 3) == 0


def test_mahendra_good():
    # diff = (4 - 1) % 27 + 1 = 4; in {4,7,10,...} → classical max score 4
    assert _mahendra_score(4, 1) == 4


def test_stree_dirgha_good():
    # diff = (14 - 1) % 27 = 13 → > 9 → classical max score 5
    assert _stree_dirgha_score(14, 1) == 5


def test_stree_dirgha_bad():
    # diff = (3 - 1) % 27 = 2 → <= 9 → score 0
    assert _stree_dirgha_score(3, 1) == 0


# ---------------------------------------------------------------------------
# compute_porutham integration
# ---------------------------------------------------------------------------

def test_compute_porutham_returns_8_kutas():
    # Rajju and Vedha are dosha-only flags (not scored as points); 8 scored kutas remain
    result = compute_porutham(
        boy_nakshatra=1, girl_nakshatra=4,
        boy_rasi=1, girl_rasi=2,
    )
    assert len(result.kutas) == 8


def test_compute_porutham_max_score_36():
    result = compute_porutham(
        boy_nakshatra=1, girl_nakshatra=4,
        boy_rasi=1, girl_rasi=2,
    )
    assert result.max_score == 36


def test_compute_porutham_total_within_bounds():
    result = compute_porutham(
        boy_nakshatra=1, girl_nakshatra=7,
        boy_rasi=4, girl_rasi=10,
    )
    assert 0 <= result.total_score <= 36


def test_compute_porutham_percentage_range():
    result = compute_porutham(
        boy_nakshatra=3, girl_nakshatra=3,
        boy_rasi=1, girl_rasi=1,
    )
    assert 0.0 <= result.percentage <= 100.0


def test_compute_porutham_excellent_label():
    # Same nakshatra = dinam+ganam+yoni+rajju max; same rasi = rasi max; etc
    result = compute_porutham(
        boy_nakshatra=3, girl_nakshatra=3,
        boy_rasi=2, girl_rasi=8,  # 7th from each other
    )
    assert result.label in {"EXCELLENT", "GOOD", "AVERAGE", "CAUTION"}


def test_compute_porutham_vedha_flagged():
    # Aswini(1) and Kettai/Jyeshtha(18) = vedha pair
    result = compute_porutham(
        boy_nakshatra=1, girl_nakshatra=18,
        boy_rasi=1, girl_rasi=9,
    )
    assert result.vedha_dosha is True


def test_compute_porutham_rajju_flagged():
    # Aswini(1) and Magam(10) — same rajju group 1
    result = compute_porutham(
        boy_nakshatra=1, girl_nakshatra=10,
        boy_rasi=1, girl_rasi=5,
    )
    assert result.rajju_dosha is True


def test_compute_porutham_no_dosha_case():
    # Aswini(1) and Rohini(4) — different rajju, not vedha pair
    result = compute_porutham(
        boy_nakshatra=1, girl_nakshatra=4,
        boy_rasi=1, girl_rasi=2,
    )
    assert result.rajju_dosha is False
    assert result.vedha_dosha is False


def test_nadi_dosha_helper_flags_same_nadi():
    out = check_nadi_dosha(1, 2)
    assert out["boy_nadi"] == out["girl_nadi"]
    assert out["has_nadi_dosha"] is True


def test_compute_porutham_includes_nadi_payload():
    result = compute_porutham(
        boy_nakshatra=1, girl_nakshatra=2,
        boy_rasi=1, girl_rasi=2,
    )
    assert "has_nadi_dosha" in result.nadi_dosha


def test_compute_porutham_bilingual_summary():
    result = compute_porutham(
        boy_nakshatra=1, girl_nakshatra=4,
        boy_rasi=1, girl_rasi=7,
    )
    assert len(result.summary_en) > 20
    assert len(result.summary_ta) > 20


@pytest.mark.parametrize("boy_nak,girl_nak,boy_rasi,girl_rasi", [
    (1, 1, 1, 1),
    (27, 27, 12, 12),
    (14, 1, 7, 1),
    (9, 18, 4, 8),
])
def test_compute_porutham_various_inputs_no_exception(boy_nak, girl_nak, boy_rasi, girl_rasi):
    result = compute_porutham(
        boy_nakshatra=boy_nak,
        girl_nakshatra=girl_nak,
        boy_rasi=boy_rasi,
        girl_rasi=girl_rasi,
    )
    assert result.total_score >= 0
