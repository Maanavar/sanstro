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
    _stree_dirgha_band,
    _stree_dirgha_score,
    _vasya_score,
    _vedha_score,
    _yoni_score,
    check_nadi_dosha,
    compute_porutham,
)

# ---------------------------------------------------------------------------
# Dinam (தினம்) — count boy's nak from girl's (1-based, 1-27); PASS only for
# the published Tamil 12-count table (spec §11.4): {2,4,6,8,9,11,13,15,18,20,
# 24,26}, incl. the 9th/18th count (Parama Mitra tara). NOT the pure mod-9
# tara rule — 17/22/27 are deliberately excluded (WI-19, OQ-2 pending
# astrologer confirmation of the 12-count set as final).
# ---------------------------------------------------------------------------

def test_dinam_same_nakshatra():
    # count=1 → not in DINAM_GOOD → FAIL
    assert _dinam_score(1, 1) == 0


def test_dinam_pass_position():
    # boy=2, girl=1 → count=2 → in DINAM_GOOD → PASS
    assert _dinam_score(2, 1) == 1


def test_dinam_fail_position():
    # boy=3, girl=1 → count=3 → not in DINAM_GOOD → FAIL
    assert _dinam_score(3, 1) == 0


def test_dinam_eighth_count_passes():
    # boy=8, girl=1 → count=8 → in DINAM_GOOD → PASS
    assert _dinam_score(8, 1) == 1


def test_dinam_ninth_count_parama_mitra_passes():
    # boy=9, girl=1 → count=9 (Parama Mitra tara) → PASS.
    # Regression: the old mod-9 formula failed remainder 0 / count 9, contradicting
    # the site's own natchathiram compatible-star lists (Ashwini → Ayilyam).
    assert _dinam_score(9, 1) == 1


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


def test_mahendra_good_set_symmetric_under_direction_reversal():
    # 2026-07 audit A-6: code counts girl-from-boy, the reference spec counts
    # boy-from-girl. Outcomes are identical only because MAHENDRA_GOOD is closed
    # under c -> 29-c (the two count directions around a 27-star ring always sum
    # to 29). Pin that closure so a future edit to the set can't silently break
    # the equivalence without a test failure.
    # diff = (girl - boy) % 27 + 1 sweeps 1..27 as girl varies with boy=1 fixed.
    good_diffs = {((g - 1) % 27) + 1 for g in range(1, 28) if _mahendra_score(1, g) == 1}
    assert good_diffs == {4, 7, 10, 13, 16, 19, 22, 25}
    assert all((29 - c) in good_diffs for c in good_diffs)


# ---------------------------------------------------------------------------
# Stree Dirgham (ஸ்திரீ தீர்கம்) — count boy's nak FROM girl's (0-based); pass if > 6
# Threshold: boy must be ≥ 8th nakshatra from girl (count > 7 in 1-indexed)
# ---------------------------------------------------------------------------

def test_stree_dirgha_good():
    # boy=20 (Uthiradam), girl=1 (Aswini): (20-1)%27=19 > 6 → PASS
    assert _stree_dirgha_score(14, 1) == 1
    assert _stree_dirgha_band(14, 1) == "UTTAMA"


def test_stree_dirgha_bad():
    # boy=4 (Rohini), girl=1 (Aswini): (4-1)%27=3 ≤ 6 → FAIL
    assert _stree_dirgha_score(4, 1) == 0


def test_stree_dirgha_boundary():
    # boy=8 (Poosam), girl=1 (Aswini): diff=7 > 6 → PASS (count=8, meets >7)
    assert _stree_dirgha_score(13, 1) == 0
    assert _stree_dirgha_band(8, 1) == "MADHYAMA"
    assert _stree_dirgha_band(7, 1) == "FAIL"
    # boy=7 (Punarpoosam), girl=1 (Aswini): diff=6 ≤ 6 → FAIL (count=7, fails >7)
    assert _stree_dirgha_score(7, 1) == 0


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
# Rasi (ராசி) — EC-RULING-01: asymmetric bride→groom inclusive count.
#   1 → same-rasi handling (PASS here), 2..6 → FAIL, 7..12 → PASS.
# Signature is _rasi_score(rasi_boy, rasi_girl); the count runs girl → boy.
# ---------------------------------------------------------------------------

def test_rasi_seventh():
    # girl=7 (Thula) → boy=1 (Mesha): count 7 → favourable → PASS
    assert _rasi_score(1, 7) == 1


def test_rasi_sixth():
    """girl=2 (Rishabham) → boy=7 (Thulam): count 6 → adverse → FAIL.

    Read on an even-bride pairing since 2026-08-28. Mesha → Kanni, this test's
    original example, is one of the six pairs Kalaprakasika p.74 lifts at the
    6th, so it now passes — for a sourced reason, not because the base rule
    changed. The base rule is what this test is for."""
    assert _rasi_score(7, 2) == 0


def test_rasi_eighth_from_bride_now_passes():
    """The clearest behaviour change from EC-RULING-01.

    The old symmetric Bhakoot rule failed the 8th in either direction. The Tamil
    directional rule marks only 2..6 from the bride adverse, so the 8th passes.
    """
    # girl=1 (Mesha) → boy=8 (Vrischika): count 8 → PASS (used to FAIL).
    assert _rasi_score(8, 1) == 1


def test_rasi_positions_three_to_five_from_bride_fail_with_no_exception():
    """The other half of EC-RULING-01: these used to pass under Bhakoot, because
    Bhakoot only ever looked at 6 and 8.

    Counts 3, 4 and 5 are the ones NEITHER text carves an exception out of, so
    they fail plainly whatever the signs are. The 2nd and the 6th are exception-
    bearing and are tested separately — this test is the control."""
    for offset, count in ((2, 3), (3, 4), (4, 5)):
        for girl in range(1, 13):
            boy = (girl - 1 + offset) % 12 + 1
            assert _rasi_score(boy, girl) == 0, f"count {count}, bride {girl}"


def test_rasi_count_is_directional_not_symmetric():
    """The property that makes this a different rule, not a variant.

    Mesha bride with Kanni groom is a 6th-position match and fails; swap the two
    and it is an 8th-position match and passes. A symmetric rule cannot express
    that, which is exactly why the old one could not be patched into shape.

    Read with an exception-free pairing (Rishabham bride, Thulam groom) so the
    property under test is the direction and not p.74's enumerated list — bride
    Mesha / groom Kanni, the original example, is now one of the six lifted
    pairs and would pass for an unrelated reason.
    """
    assert _rasi_score(7, 2) == 0   # bride Rishabham, groom Thulam → count 6
    assert _rasi_score(2, 7) == 1   # bride Thulam, groom Rishabham → count 8


def test_rasi_same_is_routed_out_of_this_rule():
    # Count 1 → same-rasi handling, which is a separate rule; PASS is its base.
    assert _rasi_score(3, 3) == 1


def test_rasi_second_position_lifts_only_for_an_even_groom_sign():
    """ASTROLOGER RULING 2026-08-28 (`A-5`), Kalaprakasika p.74:

        "Even if the Jenma-Rasi of the bridegroom be the 2nd from that of the
         bride, the effect will be good if such Jenma-Rasi be an EVEN sign ...
         If it be an ODD sign, it will do harm."

    The parity test is on the GROOM's sign — "such Jenma-Rasi" is the one the
    sentence has just named. Reading it off the bride's sign inverts the rule on
    every chart, and at the 2nd position the two parities are always opposite,
    so the error would be total rather than occasional."""
    for girl in range(1, 13):
        boy = girl % 12 + 1                      # the 2nd from the bride
        assert _rasi_score(boy, girl) == (1 if boy % 2 == 0 else 0), (
            f"bride {girl}, groom {boy}"
        )


def test_rasi_sixth_position_lifts_exactly_the_six_printed_pairs():
    """The six enumerated pairs of p.74, and nothing else at the 6th.

    Each printed pair is a 6th-position pairing in one direction only — the
    reverse is the 8th, which passes anyway — so the list is directional as
    printed, not a set of unordered pairs to be applied both ways."""
    from app.calculations.porutham import _RASI_SIXTH_PAIR_EXCEPTIONS

    assert len(_RASI_SIXTH_PAIR_EXCEPTIONS) == 6
    for girl, boy in _RASI_SIXTH_PAIR_EXCEPTIONS:
        assert (boy - girl) % 12 + 1 == 6, f"({girl}, {boy}) is not a 6th-position pair"
        assert _rasi_score(boy, girl) == 1

    lifted = {g for g, _ in _RASI_SIXTH_PAIR_EXCEPTIONS}
    for girl in range(1, 13):
        boy = (girl - 1 + 5) % 12 + 1             # the 6th from the bride
        if girl not in lifted:
            assert _rasi_score(boy, girl) == 0, f"bride {girl} lifted without a source"


def test_jothidam_sixth_even_sign_exception_is_ruled_in_but_unfilled():
    """Ruled in on 2026-08-28 and deliberately empty.

    We hold a paraphrase of Jothidam p.68, not its sentence, and filling a set
    from a paraphrase is the failure EC-RULING-01 was opened over. The empty set
    is the honest state: the row is live and changes nothing.

    The reason it must stay empty until the page is read is arithmetic. At the
    6th the groom's parity is always the bride's flipped, so p.74's six pairs are
    exactly the odd-bride/even-groom cases. If Jothidam's exception means "every
    even sign", it covers precisely the other six — and the two rules together
    would lift EVERY 6th-position pairing, retiring the 6th-position failure
    altogether. That is a doctrine change, not an exception."""
    from app.calculations.porutham import (
        _RASI_SIXTH_EVEN_SIGN_JOTHIDAM,
        RASI_EXCEPTION_GAP,
        RASI_EXCEPTIONS_ENABLED,
    )

    assert RASI_EXCEPTIONS_ENABLED is True
    assert _RASI_SIXTH_EVEN_SIGN_JOTHIDAM == frozenset()
    assert "p.68" in RASI_EXCEPTION_GAP
    # At least one 6th-position pairing must still fail, or the 6th is retired.
    assert any(_rasi_score((g - 1 + 5) % 12 + 1, g) == 0 for g in range(1, 13))


# ---------------------------------------------------------------------------
# Rasiyathipathi (ராசியாதிபதி) — FAIL only if either lord regards the other as
# an enemy (one-way enmity fails; friend/neutral combinations all pass)
# ---------------------------------------------------------------------------

def test_graha_maitri_same_lord():
    # Rasi 1 (Mesham=MARS) and Rasi 8 (Viruchigam=MARS) → same planet → PASS
    assert _graha_maitri_kuta(1, 8) == 1


def test_graha_maitri_enemies():
    # Rasi 1 (MARS) and Rasi 3 (MERCURY) → Mars and Mercury are enemies → FAIL
    assert _graha_maitri_kuta(1, 3) == 0


def test_graha_maitri_one_way_enemy_fails():
    # Kataka (MOON) × Mithuna (MERCURY): Moon holds Mercury a friend, but
    # Mercury holds Moon an ENEMY — one-way enmity fails (adhamam). An
    # "average ≥ 0.5" rule would wrongly pass this pair.
    assert _graha_maitri_kuta(4, 3) == 0


def test_graha_maitri_mercury_saturn_signs_pass():
    # Kanni (MERCURY) × Makara (SATURN): Saturn holds Mercury a friend and
    # Mercury holds Saturn neutral — no enmity either way → PASS (madhyamam).
    # Locks that correcting the Mercury→Saturn cell to neutral (2026-07 audit)
    # does not change this kuta's verdict.
    assert _graha_maitri_kuta(6, 10) == 1


# ---------------------------------------------------------------------------
# Rajju (ராஜ்ஜு) — same group = FAIL (veto), different = PASS
# ---------------------------------------------------------------------------

def test_rajju_same_group():
    # Aswini(1) group 1 and Magam(10) group 1 → FAIL
    assert _rajju_score(1, 10) == 0


def test_rajju_different_group():
    # Aswini(1) group 1, Rohini(4) group 4 → PASS
    assert _rajju_score(1, 4) == 1


def test_rajju_same_nakshatra_now_fails():
    """EC-RULING-04: the eka-nakshatra exemption is gone.

    It used to PASS here, which was self-defeating — the same star is by
    construction the same Rajju group, so the exemption waived the veto in the
    single most concentrated case the rule describes. The exception it was
    borrowed from (*eka nakshatra – bhinna pada*) belongs to Nadi, and is still
    honoured there; see `test_nadi_eka_nakshatra_bhinna_pada_still_cancels`.
    """
    assert _rajju_score(5, 5) == 0


def test_nadi_eka_nakshatra_bhinna_pada_still_cancels():
    """The Rajju removal must not take the Nadi exception with it — they are
    different rules that happened to share a phrase."""
    result = check_nadi_dosha(5, 5, boy_pada=1, girl_pada=3)
    assert result["has_nadi_dosha"] is False
    assert result["mitigation"] == "FULL"
    # And the Rajju failure is still surfaced alongside it, so a cancelled Nadi
    # can never read as "the match is clear".
    assert result["rajju_guard_warning"] is None  # not passed in here
    guarded = check_nadi_dosha(5, 5, boy_pada=1, girl_pada=3, rajju_failed=True)
    assert guarded["rajju_guard_warning"] is not None


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
    # Mithuna(3) vasya to Kanni(6); Kanni(6) vasya to Mithuna(3) → mutual → PASS
    assert _vasya_score(3, 6) == 1


def test_vasya_one_sided():
    # Only one direction counts — still PASS
    assert _vasya_score(1, 5) == 1  # rasi 1 is vasya to {5,8}; 5 in that set


def test_vasya_none():
    # No vasya relationship → FAIL
    assert _vasya_score(1, 3) == 0


def test_vasya_same_rasi_passes():
    # Same rasi is traditionally treated as an automatic Vasya pass (matches
    # the public tool's calcVasya, which the backend previously disagreed with).
    assert _vasya_score(4, 4) == 1


def test_vasya_table_carries_the_two_rows_that_were_incomplete():
    """Vrischika→Kanni and Makara→Kumbha were missing until 2026-08-17.

    Both are attested by two authorities that agree with each other against the
    shipped table (Jothidam p.69 and the standard Muhurta-Chintamani vasya
    table), and both are *missing PASSes*: couples who should have cleared Vasya
    porutham were failed on it. Asserted on the score, not on the raw dict, so a
    later "tidy" that moves the data cannot quietly drop them again.
    """
    # Vrischika (8) controls Kataka (4) AND Kanni (6).
    assert _vasya_score(8, 6) == 1
    assert _vasya_score(6, 8) == 1
    # Makara (10) controls Mesha (1) AND Kumbha (11).
    assert _vasya_score(10, 11) == 1
    assert _vasya_score(11, 10) == 1
    # Guard rail: the fix widened exactly two rows, it did not make Vasya
    # vacuous. A pair with no vasya relation either way still fails.
    assert _vasya_score(8, 11) == 0


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


def test_compute_porutham_label_downgraded_on_rajju_veto():
    # Same rajju group but otherwise strong match — label must not read GOOD/EXCELLENT.
    result = compute_porutham(
        boy_nakshatra=1, girl_nakshatra=10,
        boy_rasi=1, girl_rasi=5,
    )
    assert result.rajju_dosha is True
    assert result.label == "CAUTION"


def test_compute_porutham_label_downgraded_on_vedha_veto():
    result = compute_porutham(
        boy_nakshatra=1, girl_nakshatra=18,
        boy_rasi=1, girl_rasi=9,
    )
    assert result.vedha_dosha is True
    assert result.label == "CAUTION"


def test_compute_porutham_no_dosha_case():
    # Aswini(1) and Rohini(4) — different rajju, not vedha pair
    result = compute_porutham(
        boy_nakshatra=1, girl_nakshatra=4,
        boy_rasi=1, girl_rasi=2,
    )
    assert result.rajju_dosha is False
    assert result.vedha_dosha is False


def test_nadi_dosha_helper_flags_same_nadi():
    # Ashwini(1, real rasi Mesha) and Thiruvathirai/Ardra(6, real rasi
    # Mithuna) — both AADHI under the correct zigzag mapping. This is the
    # audit's headline false-negative: the old contiguous-block mapping put
    # Ardra in MADHYA and missed this true dosha. Real (not artificial-same)
    # rasis are used so this isolates the same-nadi detection from the A-9 v2
    # cancellation branches (different rasi, Mars/Mercury are not mutually
    # friendly, so nothing here should cancel).
    out = check_nadi_dosha(1, 6)
    assert out["boy_nadi"] == out["girl_nadi"] == "AADHI"
    assert out["has_nadi_dosha"] is True
    assert out["mitigation"] == "NONE"


def test_nadi_dosha_ashwini_bharani_are_different_nadi():
    # Regression: the old contiguous-block mapping falsely flagged Ashwini(1)
    # and Bharani(2) as same Nadi (both "block 1"). Correct zigzag: Ashwini is
    # AADHI, Bharani is MADHYA — no dosha.
    out = check_nadi_dosha(1, 2)
    assert out["boy_nadi"] != out["girl_nadi"]
    assert out["has_nadi_dosha"] is False


def test_nadi_dosha_different_rasi_alone_no_longer_cancels():
    # A-9 v2 regression lock (2026-07-14 astrologer ruling): "different rasi
    # alone" must NOT cancel Nadi Dosha. Aswini(1, Mesha/MARS) and
    # Punarpoosam(7, pada-4 rasi Kataka/MOON) — both AADHI nadi, different
    # rasi, but Mars/Moon are not MUTUALLY friendly (Mars→Moon is a friend,
    # but Moon→Mars is only neutral) — so the friendly-lords branch doesn't
    # apply either. The old rule wrongly cancelled this to MILD/cleared.
    out = check_nadi_dosha(1, 7, boy_rasi=1, girl_rasi=4)
    assert out["boy_nadi"] == out["girl_nadi"]
    assert out["has_nadi_dosha"] is True
    assert out["severity"] == "SEVERE"
    assert out["mitigation"] == "NONE"
    assert out["cancellations"] == []


def test_compute_porutham_passes_actual_rasi_to_nadi_cancellation():
    result = compute_porutham(
        boy_nakshatra=1,
        girl_nakshatra=7,
        boy_rasi=1,
        girl_rasi=4,
    )
    assert result.nadi_dosha["has_nadi_dosha"] is True
    assert result.nadi_dosha["boy_rasi"] == 1
    assert result.nadi_dosha["girl_rasi"] == 4


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


# ── EC-RULING-06: the Rajju finding survives, its death framing does not ─────

def test_rajju_summary_states_the_objection_without_asserting_an_outcome():
    """Excise, don't reword (EC-RULING-06). The dosha must still read as serious
    — it is a veto — but the summary may not name a spouse-death outcome.

    Uses the shared mortality validator rather than a hand-written substring
    check, so this test cannot drift away from the class it is guarding.
    """
    from app.calculations.porutham import (
        RAJJU_REASON_CODE,
        RAJJU_SOURCE_TEXT_CATEGORY,
        compute_porutham,
    )
    from app.services.narrative_engine import mortality_validator

    # Aswini(1) and Ayilyam(9) are both Pada Rajju — same group, so Rajju fails.
    result = compute_porutham(
        boy_nakshatra=1, girl_nakshatra=9, boy_rasi=1, girl_rasi=4,
    )
    assert result.rajju_dosha is True
    assert result.label == "CAUTION", "the veto must still drive the verdict"

    for text in (result.summary_en, result.summary_ta):
        assert mortality_validator(text) == [], f"death assertion leaked: {text!r}"
        # The internal carriers are for traceability and must never render.
        assert RAJJU_REASON_CODE not in text
        assert RAJJU_SOURCE_TEXT_CATEGORY not in text

    # And the objection is still actually stated, not quietly dropped.
    assert "Rajju" in result.summary_en
    assert "ராஜ்ஜு" in result.summary_ta


# ── EC-RULING-02: Chitra Vedha is HELD, and the hold is visible ─────────────

def test_the_chitra_vedha_gap_is_flagged_not_silently_assumed():
    """EC-RULING-02, resolved against Jothidam p.70.

    The hold's own release condition was the full printed table. p.70 supplies
    it: twelve rows verbatim identical to what shipped, and a closing line
    making Mrigashira/Chitra/Dhanishta *mutually* Vedha. The flag and the table
    move together, so neither can drift from the other.
    """
    from app.calculations.porutham import (
        VEDHA_OPEN_QUESTION,
        VEDHA_TABLE_UNVERIFIED,
        _VEDHA_PAIRS,
    )

    paired = {n for pair in _VEDHA_PAIRS for n in pair}
    unpaired = sorted(set(range(1, 28)) - paired)

    if VEDHA_TABLE_UNVERIFIED:
        assert unpaired == [14], (
            "the held position is 13 pairs with Chitra unpaired; the table has "
            f"moved to {unpaired} without clearing VEDHA_TABLE_UNVERIFIED"
        )
        assert "Chitra" in VEDHA_OPEN_QUESTION
    else:
        assert unpaired == [], (
            "the flag was cleared, so the table is claimed verified — then every "
            f"star needs a partner, but {unpaired} has none"
        )


def test_mrigashira_chitra_dhanishta_are_a_mutual_vedha_triad():
    """All three edges veto, not just the outer one that used to ship.

    {5,23} was already present; {5,14} and {14,23} are the rows the flattening
    lost. Pinning all three means a future edit cannot silently collapse the
    triad back into a pair — which is exactly how the defect arose.
    """
    assert _vedha_score(5, 14) == 0, "Mrigashira x Chitra must veto"
    assert _vedha_score(14, 23) == 0, "Chitra x Dhanishta must veto"
    assert _vedha_score(5, 23) == 0, "Mrigashira x Dhanishta must veto"

    # 27 is odd, so a table of clean pairs can never cover it. Guard the
    # structural fact that made the single-orphan reading impossible.
    assert 27 % 2 == 1
    assert _vedha_score(14, 1) == 1, "Chitra is not vedha to everything"
