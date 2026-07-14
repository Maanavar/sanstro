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

from app.calculations.porutham import check_nadi_dosha, compute_porutham

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
