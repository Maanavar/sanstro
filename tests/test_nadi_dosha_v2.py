"""Acceptance checks for A-9 v2 — Nadi Dosha cancellation rule rewrite
(astrologer live session ruling, 2026-07-14,
docs/ASTROLOGER_LIVE_SESSION_BACKLOG_2026-07.md). Covers every acceptance
check enumerated in the ruling: the two Classical Exceptions (Parihāra), the
mode-gated rasi-lord-friendship branch, the same-nakshatra/same-pada
non-exception, the "different rasi alone" regression fix, the Rajju guard,
the mandatory closing clause, and the always-named active mode.

Rasi/lord fixtures used throughout:
- Mesha(1)=MARS, Kataka(4)=MOON        — Mars->Moon friend, Moon->Mars only
  neutral: NOT mutually friendly (one-way doesn't qualify).
- Mesha(1)=MARS, Dhanus(9)=JUPITER     — Mars<->Jupiter friends both ways:
  mutually friendly.
- Mithuna(3)=MERCURY, Thula(7)=VENUS   — Mercury<->Venus friends both ways:
  mutually friendly (second fixture for the lenient/strict branch).
"""
from __future__ import annotations

import pytest

pytestmark = pytest.mark.no_db

from app.calculations.chart_strength import _NATURAL_ENEMIES, _NATURAL_FRIENDS
from app.calculations.porutham import (
    _GRAHA_RELATION,
    _NADI_CLOSING_CLAUSE_TA,
    _NADI_EXCEPTION_PADA_TA,
    _NADI_EXCEPTION_RASI_TA,
    _NADI_LENIENT_CANCEL_TA,
    _NADI_RAJJU_WARNING_TA,
    _NADI_STRICT_PARTIAL_TA,
    _rasi_lords_mutually_friendly,
    check_nadi_dosha,
    compute_porutham,
)

_CLASSICAL_GRAHAS = ("SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN")

# Ashwini(1) and Thiruvathirai/Ardra(6) are both AADHI nadi (see
# test_nadi_dosha_helper_flags_same_nadi in test_porutham.py).
_BOY_NAK, _GIRL_NAK = 1, 6


def test_different_rasi_unrelated_stars_not_cancelled():
    # Regression on the old bug: "different rasi alone" must not cancel.
    out = check_nadi_dosha(_BOY_NAK, _GIRL_NAK, boy_rasi=1, girl_rasi=4)  # MARS/MOON, not mutual
    assert out["has_nadi_dosha"] is True
    assert out["mitigation"] == "NONE"
    assert out["cancellations"] == []


def test_same_nakshatra_different_pada_is_classical_exception_both_modes():
    for mode in ("strict", "classical_lenient"):
        out = check_nadi_dosha(5, 5, boy_pada=1, girl_pada=2, mode=mode)
        assert out["has_nadi_dosha"] is False, mode
        assert out["mitigation"] == "FULL", mode
        assert any("Parihāra" in n for n in out["cancellations"]), mode


def test_same_rasi_different_nakshatra_is_classical_exception_both_modes():
    # Ashwini(1) and Ardra(6): same nadi (AADHI). Force same rasi via override.
    for mode in ("strict", "classical_lenient"):
        out = check_nadi_dosha(_BOY_NAK, _GIRL_NAK, boy_rasi=1, girl_rasi=1, mode=mode)
        assert out["has_nadi_dosha"] is False, mode
        assert out["mitigation"] == "FULL", mode
        assert any("Parihāra" in n for n in out["cancellations"]), mode


def test_same_nakshatra_same_pada_never_cancels():
    out = check_nadi_dosha(5, 5, boy_pada=2, girl_pada=2, mode="classical_lenient")
    assert out["has_nadi_dosha"] is True
    assert out["mitigation"] == "NONE"
    assert out["cancellations"] == []


def test_friendly_rasi_lords_cancelled_in_lenient_mode():
    # Mesha(1)=MARS / Dhanus(9)=JUPITER: friends both ways.
    out = check_nadi_dosha(_BOY_NAK, _GIRL_NAK, boy_rasi=1, girl_rasi=9, mode="classical_lenient")
    assert out["has_nadi_dosha"] is False
    assert out["mitigation"] == "FULL"
    assert any("lenient" in n.lower() for n in out["cancellations"])


def test_friendly_rasi_lords_only_partial_mitigation_in_strict_mode():
    out = check_nadi_dosha(_BOY_NAK, _GIRL_NAK, boy_rasi=1, girl_rasi=9, mode="strict")
    assert out["has_nadi_dosha"] is True  # NOT cancelled
    assert out["mitigation"] == "MODERATE"
    assert any("partial mitigation" in n.lower() for n in out["cancellations"])


def test_mercury_saturn_lords_are_not_mutually_friendly():
    # Hastham(13) and Poorattathi(25) are both AADHI nadi. Kanni(6)=MERCURY,
    # Kumbha(11)=SATURN: Saturn->Mercury is a friend but Mercury->Saturn is
    # only NEUTRAL (Parashari; matches chart_strength._NATURAL_FRIENDS), so
    # the rasi-lord-friendship branch must not apply in either mode.
    # Regression for the 2026-07 audit find: the relation table coded the pair
    # as friends both ways, wrongly granting MODERATE mitigation (strict) or a
    # FULL cancel (lenient) to Mithuna/Kanni × Makara/Kumbha couples.
    for mode in ("strict", "classical_lenient"):
        out = check_nadi_dosha(13, 25, boy_rasi=6, girl_rasi=11, mode=mode)
        assert out["has_nadi_dosha"] is True, mode
        assert out["mitigation"] == "NONE", mode
        assert out["cancellations"] == [], mode


def test_mercury_saturn_rasi_pairs_not_mutually_friendly():
    # WI-02 acceptance bullet 1: Mercury-sign x Saturn-sign, both directions
    # (Mithuna/Kanni = MERCURY; Makara/Kumbha = SATURN). Mercury only regards
    # Saturn as neutral, so none of these four pairs qualify as mutually
    # friendly regardless of which rasi is passed first.
    assert _rasi_lords_mutually_friendly(3, 10) is False
    assert _rasi_lords_mutually_friendly(3, 11) is False
    assert _rasi_lords_mutually_friendly(6, 10) is False
    assert _rasi_lords_mutually_friendly(6, 11) is False


def test_kanni_magaram_nadi_pair_not_cancelled_by_friendship_branch():
    # Kanni(6)=MERCURY, Magaram(10)=SATURN. Hastham(13) and Poorattathi(25)
    # are both AADHI nadi with no classical (same-nakshatra/same-rasi)
    # exception in play, so the only path to cancellation is the rasi-lord
    # friendship branch — which must not fire here (WI-02 acceptance bullet 2).
    out_strict = check_nadi_dosha(13, 25, boy_rasi=6, girl_rasi=10, mode="strict")
    assert out_strict["has_nadi_dosha"] is True
    assert out_strict["mitigation"] == "NONE"

    out_lenient = check_nadi_dosha(13, 25, boy_rasi=6, girl_rasi=10, mode="classical_lenient")
    assert out_lenient["has_nadi_dosha"] is True
    assert out_lenient["mitigation"] == "NONE"


def test_graha_relation_matches_chart_strength_natural_friends_and_enemies():
    # WI-02 acceptance bullet 3: for the 7 classical grahas, porutham's
    # _GRAHA_RELATION must agree with chart_strength's independently-maintained
    # _NATURAL_FRIENDS/_NATURAL_ENEMIES tables — 1.0 iff friend, 0.0 iff enemy.
    # This is what would have caught the original Mercury->Saturn miscode.
    for a in _CLASSICAL_GRAHAS:
        for b in _CLASSICAL_GRAHAS:
            if a == b:
                continue
            relation = _GRAHA_RELATION.get((a, b))
            assert relation is not None, f"missing relation for ({a}, {b})"
            is_friend = b in _NATURAL_FRIENDS.get(a, frozenset())
            is_enemy = b in _NATURAL_ENEMIES.get(a, frozenset())
            if relation == 1.0:
                assert is_friend, f"({a}, {b}) = 1.0 but not a friend in chart_strength"
            if is_friend:
                assert relation == 1.0, f"({a}, {b}) is a friend in chart_strength but relation={relation}"
            if relation == 0.0:
                assert is_enemy, f"({a}, {b}) = 0.0 but not an enemy in chart_strength"
            if is_enemy:
                assert relation == 0.0, f"({a}, {b}) is an enemy in chart_strength but relation={relation}"


def test_default_mode_is_strict():
    out = check_nadi_dosha(_BOY_NAK, _GIRL_NAK, boy_rasi=1, girl_rasi=9)
    assert out["nadi_parihara_mode"] == "strict"
    assert out["mitigation"] == "MODERATE"
    assert out["has_nadi_dosha"] is True


def test_rajju_guard_survives_lenient_cancellation():
    # Diff rasi + friendly lords + Rajju fail + lenient mode -> Nadi cancelled,
    # but the Rajju warning must still be surfaced (guard cannot be bypassed).
    out = check_nadi_dosha(
        _BOY_NAK, _GIRL_NAK, boy_rasi=1, girl_rasi=9,
        mode="classical_lenient", rajju_failed=True,
    )
    assert out["has_nadi_dosha"] is False  # Nadi itself is cancelled
    assert out["rajju_guard_warning"] is not None
    assert "rajju" in out["rajju_guard_warning"].lower()

    # The overall match is not silently cleared: compute_porutham forces the
    # label to CAUTION whenever Rajju fails, regardless of Nadi status.
    # Ashwini(1) and Aslesha(9) both fall in Rajju group 1 (Pada) under the
    # 9-tent cycle -> Rajju veto (different nakshatra, so not the
    # eka-nakshatra exception).
    result = compute_porutham(boy_nakshatra=1, girl_nakshatra=9, boy_rasi=1, girl_rasi=9)
    assert result.rajju_dosha is True
    assert result.label == "CAUTION"


def test_rajju_guard_present_even_without_nadi_cancellation():
    out = check_nadi_dosha(_BOY_NAK, _GIRL_NAK, boy_rasi=1, girl_rasi=4, rajju_failed=True)
    assert out["rajju_guard_warning"] is not None


def test_rajju_guard_absent_when_rajju_did_not_fail():
    out = check_nadi_dosha(_BOY_NAK, _GIRL_NAK, boy_rasi=1, girl_rasi=9, mode="classical_lenient")
    assert out["rajju_guard_warning"] is None


def test_closing_clause_present_on_every_cancellation_or_mitigation():
    cases = [
        check_nadi_dosha(5, 5, boy_pada=1, girl_pada=2),  # pada exception
        check_nadi_dosha(_BOY_NAK, _GIRL_NAK, boy_rasi=1, girl_rasi=1),  # rasi exception
        check_nadi_dosha(_BOY_NAK, _GIRL_NAK, boy_rasi=1, girl_rasi=9, mode="classical_lenient"),  # lenient
        check_nadi_dosha(_BOY_NAK, _GIRL_NAK, boy_rasi=1, girl_rasi=9, mode="strict"),  # strict partial
    ]
    for out in cases:
        assert out["cancellations"][-1] == (
            "This removes only the Nadi objection. Other mandatory poruthams "
            "(Rajju, Vedhai, Mahendra, Yoni, etc.) are evaluated independently."
        )


def test_no_closing_clause_when_nothing_applied():
    out = check_nadi_dosha(_BOY_NAK, _GIRL_NAK, boy_rasi=1, girl_rasi=4)
    assert out["cancellations"] == []


def test_active_mode_always_named():
    for mode in ("strict", "classical_lenient"):
        out = check_nadi_dosha(1, 2, mode=mode)  # different nadi, no dosha at all
        assert out["nadi_parihara_mode"] == mode


def test_invalid_mode_falls_back_to_strict():
    out = check_nadi_dosha(_BOY_NAK, _GIRL_NAK, boy_rasi=1, girl_rasi=9, mode="not_a_real_mode")
    assert out["nadi_parihara_mode"] == "strict"
    assert out["mitigation"] == "MODERATE"


def test_compute_porutham_threads_pada_and_mode():
    result = compute_porutham(
        boy_nakshatra=5, girl_nakshatra=5,
        boy_rasi=2, girl_rasi=2,
        boy_pada=1, girl_pada=2,
        nadi_parihara_mode="classical_lenient",
    )
    assert result.nadi_dosha["has_nadi_dosha"] is False
    assert result.nadi_dosha["mitigation"] == "FULL"
    assert result.nadi_dosha["nadi_parihara_mode"] == "classical_lenient"


def test_no_dosha_case_has_no_mitigation_or_notes():
    out = check_nadi_dosha(1, 2)  # different nadi entirely
    assert out["has_nadi_dosha"] is False
    assert out["mitigation"] == "NONE"
    assert out["cancellations"] == []
    assert out["rajju_guard_warning"] is None


# --------------------------------------------------------------------------- #
# Native-Tamil review lock (A-9 Tamil pass, 2026-07-15). The six new v2
# user-facing Tamil sentences were reviewed and approved as-is (no corrections);
# docs/tamil-review-nadi-dosha.md is RESOLVED. These golden asserts catch any
# silent edit to the approved text — a change here must go back through review.
# --------------------------------------------------------------------------- #
def test_nadi_v2_tamil_strings_native_reviewed_locked():
    assert _NADI_EXCEPTION_PADA_TA == "பாரம்பரிய விதிவிலக்கு (பரிகாரம்): ஒரே நட்சத்திரம், வேறு பாதம்."
    assert _NADI_EXCEPTION_RASI_TA == "பாரம்பரிய விதிவிலக்கு (பரிகாரம்): ஒரே ராசி, வேறு நட்சத்திரம்."
    assert _NADI_LENIENT_CANCEL_TA == (
        "ராசிகள் வேறுபட்டு, அந்தந்த ராசி அதிபதிகள் ஒரே கிரகமாகவோ அல்லது பரஸ்பர "
        "நண்பர்களாகவோ இருக்கும்போது, பின்பற்றப்படும் பாரம்பரியத்தைப் பொறுத்து நாடி "
        "தோஷம் நீங்கியதாகக் கருதப்படலாம். வெறும் ராசி வேறுபாடு மட்டும் தோஷத்தை "
        "தானாக நீக்காது."
    )
    assert _NADI_STRICT_PARTIAL_TA == (
        "ராசி அதிபதிகள் நட்புடையவர்களாக இருந்தாலும், இங்கு பின்பற்றப்படும் கடுமையான "
        "நடைமுறையின்படி இது ஒரு பகுதி தணிப்பு மட்டுமே — நாடி தோஷம் முழுமையாக நீங்கவில்லை."
    )
    assert _NADI_CLOSING_CLAUSE_TA == (
        "இது நாடி ஆட்சேபனையை மட்டுமே நீக்குகிறது. மற்ற கட்டாய பொருத்தங்கள் "
        "(ராஜ்ஜு, வேதம், மகேந்திரம், யோனி போன்றவை) தனித்தனியாக மதிப்பிடப்படுகின்றன."
    )
    assert _NADI_RAJJU_WARNING_TA == "மேலே உள்ள நாடி முடிவைப் பொருட்படுத்தாமல் ராஜ்ஜு தோஷம் இன்னும் பொருந்தும்."


def test_nadi_note_ta_composes_reviewed_fragments_in_order():
    # Same rasi + different nakshatra -> full cancel via Classical Exception, with
    # Rajju also failing: the user-visible Tamil paragraph joins base + exception
    # + closing + rajju-warning in that order (locks composition, not just each
    # fragment). Mirrors composed example C in the review doc.
    out = check_nadi_dosha(_BOY_NAK, _GIRL_NAK, boy_rasi=1, girl_rasi=1, rajju_failed=True)
    assert out["note_ta"] == " ".join([
        "நாடி தோஷம் உள்ளது — குழந்தைகள் உடல்நலத்தில் கவனம் தேவை. பரிகாரம் குறித்து ஆலோசிக்கவும்.",
        _NADI_EXCEPTION_RASI_TA,
        _NADI_CLOSING_CLAUSE_TA,
        _NADI_RAJJU_WARNING_TA,
    ])
