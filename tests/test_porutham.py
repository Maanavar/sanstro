"""Unit tests for the Tamil 10-Porutham engine (pass/fail, max 10)."""
from __future__ import annotations

import pytest

pytestmark = pytest.mark.no_db

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
# Dinam (தினம்) — count boy's nak from girl's; fail if (diff % 9) in {0,2,4,6,8}
# ---------------------------------------------------------------------------

def test_dinam_same_nakshatra():
    # diff=0, remainder=0 → even/zero → FAIL
    assert _dinam_score(1, 1) == 0


def test_dinam_pass_position():
    # diff=(5-1)%27=4, 4%9=4 → even → FAIL; try diff=6 → 6%9=6 → even → FAIL
    # diff=1: boy=2, girl=1 → 1%9=1 → ODD → PASS
    assert _dinam_score(2, 1) == 1


def test_dinam_fail_position():
    # diff=(3-1)%27=2, 2%9=2 → even → FAIL
    assert _dinam_score(3, 1) == 0


def test_dinam_odd_remainder_passes():
    # diff=7: boy=8, girl=1 → 7%9=7 → ODD → PASS
    assert _dinam_score(8, 1) == 1


# ---------------------------------------------------------------------------
# Ganam (கணம்)
# ---------------------------------------------------------------------------

def test_ganam_same():
    # Aswini (Deva) and Mirugaseeridam (Deva) → same gana → PASS
    assert _ganam_score(1, 5) == 1


def test_ganam_deva_manushya():
    # Aswini (Deva) and Pooram (Manushya) → allowed → PASS
    assert _ganam_score(1, 11) == 1


def test_ganam_deva_rakshasa():
    # Aswini (Deva) and Karthigai (Rakshasa) → incompatible → FAIL
    assert _ganam_score(1, 3) == 0


def test_ganam_rakshasa_manushya():
    # Magam (Rakshasa) and Pooram (Manushya) → incompatible → FAIL
    assert _ganam_score(10, 11) == 0


# ---------------------------------------------------------------------------
# Mahendra (மகேந்திரம்) — count girl's nak FROM boy's (1-based); pass if in {4,7,10,13,16,19,22,25}
# ---------------------------------------------------------------------------

def test_mahendra_good():
    # boy=4, girl=1: (1-4)%27+1=24+1=25 → in set → PASS
    assert _mahendra_score(4, 1) == 1


def test_mahendra_bad():
    # boy=1, girl=2: (2-1)%27+1=2 → not in set → FAIL
    assert _mahendra_score(1, 2) == 0


def test_mahendra_position_7():
    # boy=1, girl=8: (8-1)%27+1=8 → not in set → FAIL; try (7-1)%27+1=7 → PASS
    # boy=1, girl=7 → (7-1)%27+1=7 → PASS
    assert _mahendra_score(1, 7) == 1


# ---------------------------------------------------------------------------
# Stree Dirgham (ஸ்திரீ தீர்கம்) — count girl's nak FROM boy's (0-based); pass if > 13
# ---------------------------------------------------------------------------

def test_stree_dirgha_good():
    # boy=14, girl=1: (1-14)%27=14 > 13 → PASS
    assert _stree_dirgha_score(14, 1) == 1


def test_stree_dirgha_bad():
    # boy=1, girl=10: (10-1)%27=9, 9 ≤ 13 → FAIL
    assert _stree_dirgha_score(1, 10) == 0


def test_stree_dirgha_boundary():
    # boy=1, girl=15: (15-1)%27=14 > 13 → PASS
    assert _stree_dirgha_score(1, 15) == 1
    # boy=1, girl=14: (14-1)%27=13, 13 ≤ 13 → FAIL
    assert _stree_dirgha_score(1, 14) == 0


# ---------------------------------------------------------------------------
# Yoni (யோனி)
# ---------------------------------------------------------------------------

def test_yoni_same():
    # Aswini=Horse, Aswini=Horse → same → PASS
    assert _yoni_score(1, 1) == 1


def test_yoni_hostile_pair():
    # Aswini(Horse) and Hastham(Buffalo) → natural enemies → FAIL
    assert _yoni_score(1, 13) == 0


def test_yoni_neutral():
    # Aswini(Horse) and Rohini(Serpent) → not hostile → PASS
    assert _yoni_score(1, 4) == 1


# ---------------------------------------------------------------------------
# Rasi (ராசி) — 4th or 8th position = FAIL, else PASS
# ---------------------------------------------------------------------------

def test_rasi_seventh():
    # boy=1, girl=7 → 7th position → PASS
    assert _rasi_score(1, 7) == 1


def test_rasi_fourth():
    # boy=1, girl=4 → 4th position → FAIL
    assert _rasi_score(1, 4) == 0


def test_rasi_eighth():
    # boy=1, girl=8 → 8th from boy, 6th from girl — 8th is hostile → FAIL
    assert _rasi_score(1, 8) == 0


def test_rasi_same():
    # same rasi → diff_bg=12, diff_gb=12 → neither 4 nor 8 → PASS
    assert _rasi_score(3, 3) == 1


# ---------------------------------------------------------------------------
# Rasiyathipathi (ராசியாதிபதி) — lords avg ≥ 0.5 = PASS
# ---------------------------------------------------------------------------

def test_graha_maitri_same_lord():
    # Rasi 1 (Mesham=MARS) and Rasi 8 (Viruchigam=MARS) → same planet → PASS
    assert _graha_maitri_kuta(1, 8) == 1


def test_graha_maitri_enemies():
    # Rasi 1 (MARS) and Rasi 3 (MERCURY) → Mars and Mercury are enemies → FAIL
    assert _graha_maitri_kuta(1, 3) == 0


# ---------------------------------------------------------------------------
# Rajju (ராஜ்ஜு) — same group = FAIL (veto), different = PASS
# ---------------------------------------------------------------------------

def test_rajju_same_group():
    # Aswini(1) group 1 and Magam(10) group 1 → FAIL
    assert _rajju_score(1, 10) == 0


def test_rajju_different_group():
    # Aswini(1) group 1, Rohini(4) group 4 → PASS
    assert _rajju_score(1, 4) == 1


def test_rajju_same_nakshatra_passes():
    # Eka-nakshatra exception: same star = PASS in Thirukanitham
    assert _rajju_score(5, 5) == 1


# ---------------------------------------------------------------------------
# Vedha (வேதம்) — vedha pair = FAIL (veto), else PASS
# ---------------------------------------------------------------------------

def test_vedha_pair():
    # Aswini(1) and Kettai(18) → vedha pair → FAIL
    assert _vedha_score(1, 18) == 0


def test_vedha_non_pair():
    # Aswini(1) and Bharani(2) → not a vedha pair → PASS
    assert _vedha_score(1, 2) == 1


# ---------------------------------------------------------------------------
# Vasya (வாஸ்யம்) — at least one-directional = PASS; none = FAIL
# ---------------------------------------------------------------------------

def test_vasya_mutual():
    # Rasi 3 vasya to 9; rasi 9 vasya to 3 → mutual → PASS
    assert _vasya_score(3, 9) == 1


def test_vasya_one_sided():
    # Only one direction counts — still PASS
    assert _vasya_score(1, 5) == 1  # rasi 1 is vasya to {5,8}; 5 in that set


def test_vasya_none():
    # No vasya relationship → FAIL
    assert _vasya_score(1, 3) == 0


# ---------------------------------------------------------------------------
# compute_porutham integration
# ---------------------------------------------------------------------------

def test_compute_porutham_returns_10_kutas():
    result = compute_porutham(
        boy_nakshatra=1, girl_nakshatra=4,
        boy_rasi=1, girl_rasi=2,
    )
    assert len(result.kutas) == 10


def test_compute_porutham_max_score_10():
    result = compute_porutham(
        boy_nakshatra=1, girl_nakshatra=4,
        boy_rasi=1, girl_rasi=2,
    )
    assert result.max_score == 10


def test_compute_porutham_total_within_bounds():
    result = compute_porutham(
        boy_nakshatra=1, girl_nakshatra=7,
        boy_rasi=4, girl_rasi=10,
    )
    assert 0 <= result.total_score <= 10


def test_compute_porutham_percentage_range():
    result = compute_porutham(
        boy_nakshatra=3, girl_nakshatra=3,
        boy_rasi=1, girl_rasi=1,
    )
    assert 0.0 <= result.percentage <= 100.0


def test_compute_porutham_label_valid():
    result = compute_porutham(
        boy_nakshatra=3, girl_nakshatra=3,
        boy_rasi=2, girl_rasi=8,
    )
    assert result.label in {"EXCELLENT", "GOOD", "AVERAGE", "CAUTION"}


def test_compute_porutham_kuta_passed_field():
    result = compute_porutham(
        boy_nakshatra=1, girl_nakshatra=4,
        boy_rasi=1, girl_rasi=2,
    )
    for k in result.kutas:
        assert k.passed == (k.score == 1)
        assert k.label in {"PASS", "FAIL"}
        assert k.max_score == 1


def test_compute_porutham_vedha_flagged():
    # Aswini(1) and Kettai(18) → vedha pair
    result = compute_porutham(
        boy_nakshatra=1, girl_nakshatra=18,
        boy_rasi=1, girl_rasi=9,
    )
    assert result.vedha_dosha is True
    vedha_kuta = next(k for k in result.kutas if k.name == "Vedha")
    assert vedha_kuta.passed is False


def test_compute_porutham_rajju_flagged():
    # Aswini(1) and Magam(10) → same rajju group 1
    result = compute_porutham(
        boy_nakshatra=1, girl_nakshatra=10,
        boy_rasi=1, girl_rasi=5,
    )
    assert result.rajju_dosha is True
    rajju_kuta = next(k for k in result.kutas if k.name == "Rajju")
    assert rajju_kuta.passed is False


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


def test_nadi_dosha_cancellation_uses_actual_rasi_for_split_nakshatra():
    out = check_nadi_dosha(3, 2, boy_rasi=2, girl_rasi=1)
    assert out["boy_nadi"] == out["girl_nadi"]
    assert out["has_nadi_dosha"] is False
    assert out["severity"] == "MILD"
    assert out["cancellations"] == ["Different rasi — Nadi Dosha partially mitigated"]


def test_compute_porutham_passes_actual_rasi_to_nadi_cancellation():
    result = compute_porutham(
        boy_nakshatra=3,
        girl_nakshatra=2,
        boy_rasi=2,
        girl_rasi=1,
    )
    assert result.nadi_dosha["has_nadi_dosha"] is False
    assert result.nadi_dosha["boy_rasi"] == 2
    assert result.nadi_dosha["girl_rasi"] == 1


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
    assert "10" in result.summary_en  # mentions 10-porutham score
    assert len(result.summary_ta) > 20


def test_compute_porutham_summary_mentions_tamil_10():
    result = compute_porutham(
        boy_nakshatra=1, girl_nakshatra=4,
        boy_rasi=1, girl_rasi=7,
    )
    assert "10" in result.summary_en
    assert "10" in result.summary_ta


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
    assert 0 <= result.total_score <= 10
