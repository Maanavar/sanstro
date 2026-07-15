"""Unit tests for app.calculations.compatibility_intelligence — WI-04, WI-05,
WI-20, WI-21 (docs/CALC_AUDIT_REMEDIATION_PLAN_2026-07.md).
"""
from __future__ import annotations

from types import SimpleNamespace

import pytest

from app.calculations import compatibility_intelligence as ci_module
from app.calculations.chart_strength import SIGN_LORD
from app.calculations.compatibility_intelligence import (
    ChartMarriageStrength,
    DashaHarmony,
    EmotionalCompatibility,
    NavamsaCompatibility,
    SevvaiDoshamDetail,
    _compute_navamsa,
    _d9_dignified,
    _graha_relation,
    _moon_harmony_label,
    compute_compatibility_intelligence,
)
from app.calculations.porutham import _graha_maitri_kuta, _rasi_score

pytestmark = pytest.mark.no_db


def _planet(graha: str, d9_rasi: int) -> SimpleNamespace:
    return SimpleNamespace(graha=graha, d9_rasi=d9_rasi)


def _snap(lagna_rasi: int, planets: list[SimpleNamespace]) -> SimpleNamespace:
    return SimpleNamespace(data=SimpleNamespace(
        lagna=SimpleNamespace(rasi=lagna_rasi),
        planets=planets,
    ))


# ---------------------------------------------------------------------------
# WI-04 — Compatibility Navamsa: rasi compared against house sets (category
# error). sla_d9/slb_d9 are D9 SIGN numbers; the old code tested them against
# _KENDRAS|_TRIKONAS (a HOUSE set), which awards points on 6 of 12 signs
# regardless of dignity. Fixed to a dignity check (own sign or exaltation).
# ---------------------------------------------------------------------------

def test_d9_dignified_own_sign_and_exaltation():
    assert _d9_dignified("MARS", 1) is True   # own sign (Aries)
    assert _d9_dignified("MARS", 8) is True   # own sign (Scorpio)
    assert _d9_dignified("MARS", 10) is True  # exaltation (Capricorn)
    assert _d9_dignified("MARS", 4) is False  # debilitation (Cancer)


def test_seventh_lord_debilitated_in_kendra_sign_scores_zero_not_three():
    # Lagna Cancer(4) -> 7th house rasi Capricorn(10) -> 7th lord SATURN.
    # Saturn's D9 debilitation sign is Aries(1) — which is ALSO a
    # kendra/trikona house number. The old category-error code awarded +3
    # here purely because 1 is in _KENDRAS|_TRIKONAS; dignity says this
    # placement is actually weak and must score 0.
    snap_a = _snap(4, [_planet("VENUS", 0), _planet("SATURN", 1)])
    snap_b = _snap(1, [_planet("VENUS", 0)])
    result = _compute_navamsa(snap_a, snap_b)
    assert result.score == 0


def test_seventh_lord_own_sign_not_in_kendra_trikona_scores_three():
    # Lagna Taurus(2) -> 7th house rasi Scorpio(8) -> 7th lord MARS.
    # Mars's OTHER own sign is Scorpio(8) itself — which is NOT in
    # _KENDRAS|_TRIKONAS ({1,4,5,7,9,10}). The old code wrongly withheld
    # points for this genuinely dignified placement; the dignity check
    # correctly awards +3.
    snap_a = _snap(2, [_planet("VENUS", 0), _planet("MARS", 8)])
    snap_b = _snap(1, [_planet("VENUS", 0)])
    result = _compute_navamsa(snap_a, snap_b)
    assert result.score == 3


# ---------------------------------------------------------------------------
# WI-05 — Moon-Moon emotional harmony table (Doctrine §10 ratified table),
# with a structurally-enforced symmetric lookup.
# ---------------------------------------------------------------------------

@pytest.mark.parametrize(
    "rasi_a,rasi_b,expected",
    [
        (1, 1, "GOOD"),         # same rasi
        (1, 2, "MIXED"), (1, 12, "MIXED"),      # dwirdwadasa
        (1, 3, "GOOD"), (1, 11, "GOOD"),        # upachaya
        (1, 4, "GOOD"), (1, 10, "GOOD"),        # kendra
        (1, 5, "EXCELLENT"), (1, 9, "EXCELLENT"),  # trikona
        (1, 6, "TENSE"), (1, 8, "TENSE"),       # shadashtaka
        (1, 7, "GOOD"),        # samasaptama
    ],
)
def test_moon_harmony_golden_distance_to_tier(rasi_a, rasi_b, expected):
    assert _moon_harmony_label(rasi_a, rasi_b) == expected


def test_moon_harmony_symmetric_for_all_144_rasi_pairs():
    for a in range(1, 13):
        for b in range(1, 13):
            assert _moon_harmony_label(a, b) == _moon_harmony_label(b, a), (a, b)


def test_moon_harmony_never_grades_above_tense_when_porutham_rasi_fails():
    # Any Moon pair that fails porutham's own Shashtashtaka (6th/8th) veto
    # must not grade above TENSE here — the two engines must agree on which
    # positions are adverse.
    for a in range(1, 13):
        for b in range(1, 13):
            if _rasi_score(a, b) == 0:  # porutham FAIL (6th/8th position)
                assert _moon_harmony_label(a, b) == "TENSE", (a, b)


# ---------------------------------------------------------------------------
# WI-20 — _graha_relation compound friendship rule (Doctrine §11): enemy in
# either direction -> enemy; friend in both directions -> friend; else neutral.
# ---------------------------------------------------------------------------

def test_graha_relation_one_way_friend_one_way_enemy_is_enemy_not_friend():
    # Moon regards Mercury as a friend, but Mercury regards Moon as an enemy
    # (_NATURAL_ENEMIES["MERCURY"] == {"MOON"}). The old "or" logic checked
    # friendship before enmity and returned "friend" outright; the Doctrine
    # §11 compound rule ("enemy in either direction -> enemy") — and this
    # repo's own porutham._graha_maitri_kuta precedent, which FAILs this
    # exact pair — both resolve this to "enemy", order-independent.
    #
    # NOTE: WI-20's prose in CALC_AUDIT_REMEDIATION_PLAN_2026-07.md asserts
    # this pair "should be neutral", which contradicts its own 3-bullet rule
    # (enemy-either-direction wins), its own verbatim fix code, and the
    # porutham precedent it cites as the model to match. Flagged for the
    # astrologer/doc owner to amend that prose; the code below follows the
    # rule + precedent, not the prose example.
    assert _graha_relation("MOON", "MERCURY") == "enemy"
    assert _graha_relation("MERCURY", "MOON") == "enemy"


def test_graha_relation_enemy_either_direction_is_enemy():
    assert _graha_relation("SUN", "VENUS") == "enemy"
    assert _graha_relation("VENUS", "SUN") == "enemy"


def test_graha_relation_friend_both_directions_is_friend():
    assert _graha_relation("SUN", "MOON") == "friend"
    assert _graha_relation("MOON", "SUN") == "friend"


def test_graha_relation_same_planet_is_friend():
    assert _graha_relation("MARS", "MARS") == "friend"


def test_graha_relation_agrees_with_graha_maitri_kuta_fail_cases():
    # Wherever porutham._graha_maitri_kuta fails a rasi-lord pair (enemy in
    # either direction), compatibility_intelligence._graha_relation must also
    # call the lords' relation "enemy" — same underlying concept, must not
    # silently diverge between the two modules.
    for rasi_a in range(1, 13):
        for rasi_b in range(1, 13):
            if _graha_maitri_kuta(rasi_a, rasi_b) == 0:
                lord_a, lord_b = SIGN_LORD[rasi_a], SIGN_LORD[rasi_b]
                assert _graha_relation(lord_a, lord_b) == "enemy", (rasi_a, rasi_b)


# ---------------------------------------------------------------------------
# WI-21 — Rajju/Vedha veto hard-caps the CI overall label at CAUTION
# (Doctrine §12), regardless of the weighted 0-100 score.
# ---------------------------------------------------------------------------

_STRONG_STRENGTH = ChartMarriageStrength(
    seventh_house_rasi=7, seventh_lord="VENUS", seventh_lord_house=1,
    seventh_lord_strength=90, venus_house=1, venus_strength=90,
    jupiter_house=1, jupiter_strength=90, has_malefic_in_seventh=False,
    score=10, note_en="", note_ta="",
)
_STRONG_NAVAMSA = NavamsaCompatibility(
    person_a_venus_d9=2, person_b_venus_d9=7, person_a_seventh_lord_d9=2,
    person_b_seventh_lord_d9=7, harmony_label="STRONG", note_en="", note_ta="",
    score=20,
)
_STRONG_SEVVAI = SevvaiDoshamDetail(
    has_dosham=False, mars_house=3, is_cancelled=False, severity="NONE",
    cancellation_reasons=[], note_en="", note_ta="", score=5,
)
_STRONG_DASHA = DashaHarmony(
    person_a_maha_lord="VENUS", person_a_antar_lord="VENUS",
    person_a_maha_end="2030-01-01", person_b_maha_lord="MOON",
    person_b_antar_lord="MOON", person_b_maha_end="2030-01-01",
    harmony_label="SUPPORTIVE", note_en="", note_ta="", score=15,
)
_STRONG_EMOTIONAL = EmotionalCompatibility(
    moon_moon_harmony="EXCELLENT", venus_mars_harmony="STRONG",
    communication_note="", note_en="", note_ta="", score=10,
)


def _stub_strong_layers(monkeypatch: pytest.MonkeyPatch) -> None:
    """Stub every sub-layer of compute_compatibility_intelligence to its
    strongest possible score, so only the porutham/Rajju-Vedha veto varies —
    isolates the WI-21 label-cap logic from needing real chart snapshots."""
    monkeypatch.setattr(ci_module, "_compute_chart_marriage_strength", lambda snap: _STRONG_STRENGTH)
    monkeypatch.setattr(ci_module, "_compute_navamsa", lambda a, b: _STRONG_NAVAMSA)
    monkeypatch.setattr(ci_module, "_compute_sevvai", lambda snap: _STRONG_SEVVAI)
    monkeypatch.setattr(ci_module, "_apply_mutual_sevvai_cancellation", lambda a, b: (a, b))
    monkeypatch.setattr(ci_module, "_compute_dasha_harmony", lambda a, b, jd: _STRONG_DASHA)
    monkeypatch.setattr(ci_module, "_compute_emotional_compatibility", lambda a, b: _STRONG_EMOTIONAL)


def _fake_porutham_result(*, rajju_dosha: bool, vedha_dosha: bool) -> SimpleNamespace:
    return SimpleNamespace(
        total_score=10, max_score=10, percentage=100.0, label="EXCELLENT",
        rajju_dosha=rajju_dosha, vedha_dosha=vedha_dosha,
        nadi_dosha={"has_nadi_dosha": False},
    )


def test_rajju_dosha_caps_overall_label_at_caution_despite_high_score(monkeypatch):
    _stub_strong_layers(monkeypatch)
    porutham_result = _fake_porutham_result(rajju_dosha=True, vedha_dosha=False)
    result = compute_compatibility_intelligence(
        snap_a=SimpleNamespace(), snap_b=SimpleNamespace(),
        porutham_result=porutham_result, synastry_score=100,
    )
    assert result.overall_score >= 65  # strong pre-cap score, per WI-21 acceptance
    assert result.overall_label == "CAUTION"


def test_vedha_dosha_caps_overall_label_at_caution_despite_high_score(monkeypatch):
    _stub_strong_layers(monkeypatch)
    porutham_result = _fake_porutham_result(rajju_dosha=False, vedha_dosha=True)
    result = compute_compatibility_intelligence(
        snap_a=SimpleNamespace(), snap_b=SimpleNamespace(),
        porutham_result=porutham_result, synastry_score=100,
    )
    assert result.overall_score >= 65
    assert result.overall_label == "CAUTION"


def test_no_veto_overall_label_reflects_score_normally(monkeypatch):
    _stub_strong_layers(monkeypatch)
    porutham_result = _fake_porutham_result(rajju_dosha=False, vedha_dosha=False)
    result = compute_compatibility_intelligence(
        snap_a=SimpleNamespace(), snap_b=SimpleNamespace(),
        porutham_result=porutham_result, synastry_score=100,
    )
    assert result.overall_label == "EXCELLENT"
