"""DD-17 (2026-10-06): dosham reckoning — residual, reference points, context.

Every chart here is a synthetic rasi map built to isolate one rule; no birth
data stands behind any of them.
"""
from __future__ import annotations

import pytest

from app.calculations._yoga_dosham import (
    detect_badhaka_dosham,
    detect_kalathra_dosham,
    detect_putra_sarpa_dosham,
    detect_rahu_ketu_dosham,
    detect_sevvai_dosham,
    rk_placement_meaning,
)
from app.calculations._yoga_helpers import dosham_residual, dosham_verdict_sentence
from app.calculations.doctrine_options import DEFAULT_DOCTRINE, OPEN_ITEM_BY_ID, DoctrineOptions, validated

pytestmark = pytest.mark.no_db

RISHABAM, KUMBAM = 2, 11

# ── Rahu–Ketu 2/8 (Rishabam lagna: Rahu 2nd, Ketu 8th) ───────────────────────
# Guru in Mesham aspects Dhanusu (the 8th, Ketu's sign) by its 9th aspect and
# touches nothing else that matters; the 8th lord (Guru) is in the 12th, so not
# strong; Sani in Meenam and Sevvai in Makaram leave the 7th (Viruchigam) alone.
_RK_28 = {
    "RAHU": 3, "KETU": 9, "JUPITER": 1, "MERCURY": 1, "MOON": 6,
    "VENUS": 11, "MARS": 10, "SUN": 5, "SATURN": 12,
}


def _rk(moves: dict[str, int] | None = None, **kwargs):
    return detect_rahu_ketu_dosham({**_RK_28, **(moves or {})}, RISHABAM, **kwargs)


def test_defaults_are_the_dd17_rulings() -> None:
    assert DEFAULT_DOCTRINE.o26_sevvai_dispositor_mitigation == "off"
    assert DEFAULT_DOCTRINE.o27_sevvai_seventh_lord_strength == "dignity_or_kendra_trikona"
    assert DEFAULT_DOCTRINE.o28_rk_second_house_support == "dignity"
    assert DEFAULT_DOCTRINE.o29_rk_guru_counted_once is True
    for item in ("O-26", "O-27", "O-28", "O-29"):
        assert OPEN_ITEM_BY_ID[item].status == "FLAGGED"
    with pytest.raises(ValueError):
        validated(DoctrineOptions(o26_sevvai_dispositor_mitigation="from_lagna"))


def test_o29_one_guru_aspect_is_counted_once() -> None:
    result = _rk()
    assert result.cancellation_factors == ["guru_joins_or_aspects_node"]
    legacy = _rk(doctrine=DoctrineOptions(o29_rk_guru_counted_once=False))
    assert set(legacy.cancellation_factors) == {"guru_joins_or_aspects_node", "strong_eighth_lord_or_benefic_on_eighth"}


def test_o28_the_second_lords_dignity_protects_the_second_house() -> None:
    supported = _rk({"MERCURY": 6, "MOON": 4})  # 2nd lord Budhan in Kanni: own and exalted
    assert "second_lord_dignified" in supported.cancellation_factors
    off = _rk({"MERCURY": 6, "MOON": 4}, doctrine=DoctrineOptions(o28_rk_second_house_support="off"))
    assert {"second_lord_dignified", "strong_second_lord_or_benefic_on_second"}.isdisjoint(off.cancellation_factors)
    # Placement alone is not dignity: Budhan in Simmam is the 4th (a kendra)
    # from Rishabam. Only the broader option counts it.
    placed = {"MERCURY": 5, "MOON": 4}
    assert "second_lord_dignified" not in _rk(placed).cancellation_factors
    broad = _rk(placed, doctrine=DoctrineOptions(o28_rk_second_house_support="strong_or_benefic"))
    assert "strong_second_lord_or_benefic_on_second" in broad.cancellation_factors


def test_rk_reference_rows_context_and_meaning() -> None:
    result = _rk()
    rows = {row.reference: row for row in result.reference_houses}
    assert rows["LAGNA"].houses == (2, 8) and rows["LAGNA"].counts is True
    assert rows["MOON"].houses == (10, 4) and rows["MOON"].counts is False
    assert rows["VENUS"].counts is False
    assert "rk_axis_not_repeated_from_moon_venus" in result.context_notes
    assert result.meaning_en.startswith("Rahu in the 2nd") and "Ketu in the 8th" in result.meaning_en
    assert "ராகு" in result.meaning_ta and "கேது" in result.meaning_ta
    # The axis names the finding; never a bare traditional alias (review 2026-10-06).
    assert (result.variant_en, result.variant_ta) == ("2/8 axis", "2/8 அச்சு")


def test_rk_navamsa_is_context_never_grade() -> None:
    base = _rk()
    repeats = _rk(d9_rasi_map={"RAHU": 7, "KETU": 1}, d9_lagna_rasi=1)
    clear = _rk(d9_rasi_map={"RAHU": 4, "KETU": 10}, d9_lagna_rasi=1)
    assert "rk_axis_repeated_in_navamsa" in repeats.context_notes
    assert "rk_axis_not_repeated_in_navamsa" in clear.context_notes
    # DD-03 keeps D9 out of the grade.
    assert repeats.strength == clear.strength == base.strength
    assert repeats.cancellation_factors == clear.cancellation_factors == base.cancellation_factors


def test_rk_formation_and_residual() -> None:
    result = _rk()
    assert result.formation_strength == "PARTIAL"
    # Base 1, one mitigation → net 0: still active, graded Mild.
    assert result.is_cancelled is False
    assert (result.strength, result.residual) == ("WEAK", "MILD")
    mitigated = _rk({"MERCURY": 6, "MOON": 4})
    assert mitigated.is_cancelled is True
    assert mitigated.residual == "MILD"  # never NONE while present


def test_rk_placement_meaning_covers_all_eight_node_houses() -> None:
    for rahu, ketu in ((1, 7), (7, 1), (2, 8), (8, 2)):
        ta, en = rk_placement_meaning(rahu, ketu)
        assert en.endswith("not fixed outcomes.") and ta.endswith("அல்ல.")
    assert rk_placement_meaning(5, 11) == ("", "")


# ── Sevvai (Kumbam lagna; 7th lord Suriyan) ─────────────────────────────────
def test_o26_dispositor_rule_is_off_by_default() -> None:
    # Mars in Thulam, its lord Sukran in Mesham: 7th from Mars.
    chart = {"SUN": 1, "MOON": 3, "MARS": 7, "MERCURY": 6, "JUPITER": 9, "VENUS": 1, "SATURN": 10, "RAHU": 11, "KETU": 5}
    assert "mars_dispositor_kendra_trikona" not in detect_sevvai_dosham(chart, 1).cancellation_factors
    on = detect_sevvai_dosham(chart, 1, doctrine=DoctrineOptions(o26_sevvai_dispositor_mitigation="from_mars"))
    assert "mars_dispositor_kendra_trikona" in on.cancellation_factors


def test_o27_a_dignified_seventh_lord_protects_outside_a_kendra() -> None:
    # Suriyan exalted in Mesham — the 3rd from Kumbam, neither kendra nor trikona.
    chart = {"MARS": 12, "MOON": 6, "VENUS": 2, "JUPITER": 2, "SUN": 1, "SATURN": 9, "RAHU": 5, "KETU": 11, "MERCURY": 3}
    assert "benefic_strong_seventh_lord" in detect_sevvai_dosham(chart, KUMBAM).cancellation_factors
    legacy = detect_sevvai_dosham(chart, KUMBAM, doctrine=DoctrineOptions(o27_sevvai_seventh_lord_strength="kendra_functional_benefic"))
    assert "benefic_strong_seventh_lord" not in legacy.cancellation_factors


def test_sevvai_strong_formation_barely_offset_from_lagna_keeps_moderate_residual() -> None:
    # Mars 2nd from the Lagna and 7th from the Moon (formation STRONG). Exactly
    # two mitigations: the exalted 7th lord, and Guru in Thulam aspecting it.
    chart = {"MARS": 12, "MOON": 6, "VENUS": 2, "JUPITER": 7, "SUN": 1, "SATURN": 9, "RAHU": 5, "KETU": 11, "MERCURY": 3}
    result = detect_sevvai_dosham(chart, KUMBAM)
    assert result.is_cancelled is True
    assert result.formation_strength == "STRONG"
    assert result.residual == "MODERATE"
    assert result.context_notes == ()
    assert {r.reference: r.houses for r in result.reference_houses} == {"LAGNA": (2,), "MOON": (7,), "VENUS": (11,)}


def test_sevvai_counted_only_from_moon_and_venus_is_the_lighter_reading() -> None:
    # Mars in Mesham is the 3rd from Kumbam (no Lagna dosham), 7th from the Moon
    # in Thulam and 4th from Venus in Magaram. Mitigated three ways: own sign,
    # Mesham is the 4th house's nivarthi rasi, and Suriyan (7th lord) in Simmam.
    chart = {"MARS": 1, "MOON": 7, "VENUS": 10, "JUPITER": 2, "SUN": 5, "SATURN": 3, "RAHU": 4, "KETU": 10, "MERCURY": 6}
    result = detect_sevvai_dosham(chart, KUMBAM)
    assert set(result.conditions_met) == {"from_moon", "from_venus"}
    assert result.is_cancelled is True
    assert result.formation_strength == "STRONG"
    assert result.residual == "MILD"
    assert result.context_notes == ("sevvai_not_from_lagna",)
    lagna_row = next(r for r in result.reference_houses if r.reference == "LAGNA")
    assert lagna_row.houses == (3,) and lagna_row.counts is False


def test_why_text_is_a_verdict_not_an_engine_label() -> None:
    chart = {"MARS": 1, "MOON": 7, "VENUS": 10, "JUPITER": 2, "SUN": 5, "SATURN": 3, "RAHU": 4, "KETU": 10, "MERCURY": 6}
    result = detect_sevvai_dosham(chart, KUMBAM)
    assert "Final label" not in result.explanation_why_en
    assert "SEVVAI_DOSHAM" not in result.explanation_why_en.replace(" ", "_")
    assert len(result.cancellation_factors) == 3
    assert result.explanation_why_en.startswith("Present, and reduced by 3 protective factors. A mild residual")
    assert "Context:" in result.explanation_why_en and "சூழல்:" in result.explanation_why_ta


# ── Residual arithmetic and the other doshams ───────────────────────────────
@pytest.mark.parametrize(
    ("present", "cancelled", "strength", "formation", "narrow", "primary", "expected"),
    [
        (False, False, "WEAK", "", False, True, "NONE"),
        (True, False, "STRONG", "STRONG", False, True, "STRONG"),
        (True, False, "PARTIAL", "PARTIAL", False, True, "MODERATE"),
        (True, True, "WEAK", "STRONG", True, True, "MODERATE"),
        (True, True, "WEAK", "STRONG", True, False, "MILD"),
        (True, True, "WEAK", "STRONG", False, True, "MILD"),
        (True, True, "WEAK", "PARTIAL", True, True, "MILD"),
    ],
)
def test_dosham_residual(present, cancelled, strength, formation, narrow, primary, expected) -> None:
    assert dosham_residual(
        is_present=present, is_cancelled=cancelled, strength=strength,
        formation_strength=formation, narrow_margin=narrow, primary_reference=primary,
    ) == expected


def test_verdict_sentence_never_erases_a_mitigated_dosham() -> None:
    ta, en = dosham_verdict_sentence("DOSHAM_WITH_NIVARTHI", None, mitigation_count=1, formed=True)
    assert "reduced, not erased" in en and "1 protective factor." in en
    assert "நீங்கவில்லை" in ta


def test_badhaka_is_never_cancelled_when_it_did_not_form() -> None:
    # Mesham lagna: badhaka lord Sani, in Kanni, away from Lagna/Moon/lagna lord.
    result = detect_badhaka_dosham({"SATURN": 6, "MOON": 3, "MARS": 9}, 1, {"SATURN": 80}, "VENUS")
    assert result.is_present is False and result.is_cancelled is False and result.residual == "NONE"
    formed = detect_badhaka_dosham({"SATURN": 1, "MOON": 3, "MARS": 9}, 1, {"SATURN": 80}, "SATURN")
    assert formed.is_cancelled is True and formed.strength == "WEAK"
    assert formed.formation_strength == "STRONG" and formed.residual == "MODERATE"


def test_kalathra_uses_the_shared_strength_scale_and_names_the_graha() -> None:
    # Mesham lagna: 7th lord Sukran in Kanni (6th, its debility), no protection.
    result = detect_kalathra_dosham({"VENUS": 6, "JUPITER": 1}, 1)
    assert result.is_present is True and result.is_cancelled is False
    assert result.strength == "PARTIAL"
    assert "VENUS" not in result.description_en and "Venus" in result.description_en
    assert "VENUS" not in result.description_ta and "சுக்கிரன்" in result.description_ta


def test_putra_sarpa_mitigated_reads_weak_with_a_residual() -> None:
    result = detect_putra_sarpa_dosham({"SUN": 9, "RAHU": 5, "JUPITER": 4}, 1, {"SUN": 30})
    assert result.is_cancelled is True  # Guru in Kadagam: a kendra
    assert result.strength == "WEAK"
    assert result.formation_strength == "STRONG" and result.residual == "MODERATE"
