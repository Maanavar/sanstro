"""Putra Sarpa and Marana Karaka Sthana name *this chart's* facts (2026-10-06).

Owner report: the Putra Sarpa card named "the 5th house or its lord" as the
cause and "a strong 5th lord" as the cure, so the 5th house appeared on both
sides; the Marana Karaka Sthana card said only "mercury in marana karaka
sthana" and "the impact varies with your current Dasha period". Every chart
here is synthetic.
"""
from __future__ import annotations

import pytest

from app.calculations._yoga_dosham import (
    detect_marana_karaka_sthana,
    detect_putra_sarpa_dosham,
    detect_santhana_thadai,
)
from app.calculations._yoga_helpers import _marker_explain, _marker_explain_ta

pytestmark = pytest.mark.no_db


def test_putra_sarpa_names_the_disturber_and_the_guard_separately() -> None:
    # Mesham lagna: 5th house Simmam, 5th lord Sun (in Dhanusu, unafflicted).
    # Rahu sits in Simmam; Guru in Kadagam (the 4th, a kendra) guards.
    result = detect_putra_sarpa_dosham({"SUN": 9, "RAHU": 5, "KETU": 11, "JUPITER": 4}, 1, {"SUN": 50})
    assert result.is_present and result.is_cancelled
    assert result.conditions_met == ["fifth_house_has_rahu"]
    assert result.cancellation_factors == ["jupiter_in_kendra_house_4"]
    assert "What disturbs your 5th house (Simmam): Rahu in the house itself." in result.meaning_en
    assert "What guards it: Jupiter, the karaka for children, in your 4th house (a kendra)." in result.meaning_en
    # The Sun is not strong here, so the reading must not claim it guards.
    assert "Sun" not in result.meaning_en
    assert "சிம்மம்" in result.meaning_ta and "ராகு" in result.meaning_ta
    assert "Rahu sits in your 5th house" in result.explanation_why_en


def test_putra_sarpa_same_lord_on_both_sides_is_named_once() -> None:
    # Rahu joins the 5th lord (Sun, in Dhanusu), and the Sun is strong.
    result = detect_putra_sarpa_dosham({"SUN": 9, "RAHU": 9, "KETU": 3, "JUPITER": 2}, 1, {"SUN": 80})
    assert result.conditions_met == ["fifth_lord_sun_joined_by_rahu"]
    assert result.cancellation_factors == ["fifth_lord_sun_strong"]
    assert "Rahu beside its lord, Sun" in result.meaning_en
    assert "the strength of that lord" in result.meaning_en


def test_putra_sarpa_unguarded_says_so_and_names_the_dasha() -> None:
    result = detect_putra_sarpa_dosham({"SUN": 9, "RAHU": 5, "KETU": 11, "JUPITER": 2}, 1, {"SUN": 50})
    assert result.is_present and not result.is_cancelled
    assert result.meaning_en.endswith("Nothing in this chart guards it. Most noticeable in the dasha or bhukti of Rahu.")
    # What it brings and the medical note have their own card sections.
    assert "medical" not in result.meaning_en and "children, studies" not in result.meaning_en


# ── O-32 (owner ruling 2026-10-06): Thulam lagna, Sani in its own 5th ────────

def test_o32_sani_in_own_fifth_for_thulam_is_neutralized() -> None:
    # Thulam lagna, Sani in Kumbam (the 5th); no node in the 5th or beside Guru.
    result = detect_santhana_thadai({"SATURN": 11, "RAHU": 1, "KETU": 7, "JUPITER": 3}, 7, {"SATURN": 80})
    assert result.is_present is False and result.is_cancelled is False
    assert result.conditions_met == ["fifth_house_has_saturn"]
    assert result.cancellation_factors == ["saturn_yogakaraka_own_fifth"]
    assert "is not active" in result.explanation_why_en and "yogakaraka" in result.explanation_why_en
    assert "செயல்படவில்லை" in result.explanation_why_ta


def test_o32_an_independent_affliction_still_forms_it() -> None:
    # Rahu joins Sani in Kumbam: the node in the 5th is its own affliction.
    result = detect_putra_sarpa_dosham({"SATURN": 11, "RAHU": 11, "KETU": 5, "JUPITER": 3}, 7, {"SATURN": 80})
    assert result.is_present is True
    assert result.conditions_met == ["fifth_house_has_rahu"]  # Sani is not counted


def test_o32_ordinary_restores_the_plain_reading() -> None:
    from app.calculations.doctrine_options import DoctrineOptions

    result = detect_santhana_thadai(
        {"SATURN": 11, "RAHU": 1, "KETU": 7, "JUPITER": 3}, 7, {"SATURN": 80},
        doctrine=DoctrineOptions(o32_putra_sarpa_thulam_sani="ordinary"),
    )
    assert result.is_present is True and result.conditions_met == ["fifth_house_has_saturn"]


def test_o32_is_thulam_only_not_a_blanket_own_sign_rule() -> None:
    # Makaram lagna: the 5th is Rishabam (Venus's). Sani there is not its own
    # 5th, so nothing neutralizes it.
    result = detect_santhana_thadai({"SATURN": 2, "RAHU": 1, "KETU": 7, "JUPITER": 3, "VENUS": 6}, 10, {"VENUS": 50})
    assert result.is_present is True and result.conditions_met == ["fifth_house_has_saturn"]


def test_unformed_doshams_carry_no_protective_factors() -> None:
    """A protection of nothing is not a nivarthi (L-5). Sent on an unformed
    dosham, the web card read it as "did form … and was annulled". Before the
    fix, ~2,100 of 3,000 random charts carried one (Pitru, Kalathra, Sevvai)."""
    import random

    from app.calculations.yogas import detect_yogas_and_doshams

    rng = random.Random(7)
    grahas = ("SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN")
    for _ in range(400):
        chart = {g: rng.randint(1, 12) for g in grahas}
        rahu = rng.randint(1, 12)
        chart["RAHU"], chart["KETU"] = rahu, (rahu + 5) % 12 + 1
        lagna = rng.randint(1, 12)
        _, doshams, _ = detect_yogas_and_doshams(chart, lagna, chart["MOON"], active_lords=["SUN"], current_maha_lord="SUN")
        for d in doshams:
            if not d.is_present and d.cancellation_factors:
                assert d.cancellation_factors == ["saturn_yogakaraka_own_fifth"], (d.name, d.cancellation_factors)


def test_putra_sarpa_saturn_does_not_join_itself_for_thulam_lagna() -> None:
    # Thulam lagna: Saturn is the 5th lord. Saturn in Magaram, no node near
    # the 5th, its lord or Guru. This formed the dosham in every Thulam chart.
    result = detect_santhana_thadai({"SATURN": 10, "RAHU": 1, "KETU": 7, "JUPITER": 3}, 7, {"SATURN": 50})
    assert result.is_present is False
    assert result.meaning_en == ""


def test_putra_sarpa_missing_jupiter_neither_forms_nor_protects() -> None:
    # A chart without Jupiter or the nodes compared None == None and formed.
    result = detect_putra_sarpa_dosham({"SUN": 9}, 1, {"SUN": 50})
    assert result.is_present is False and result.cancellation_factors == []


# ── AAU-12 (ruled 2026-10-29): Sarpa needs a node; Saturn is Santhana Thadai ─

def test_aau12_saturn_alone_forms_santhana_thadai_not_sarpa() -> None:
    # Mesham lagna, Saturn in Simmam (the 5th), nodes elsewhere and apart from Guru.
    chart = {"SUN": 9, "SATURN": 5, "RAHU": 2, "KETU": 8, "JUPITER": 4}
    sarpa = detect_putra_sarpa_dosham(chart, 1, {"SUN": 50})
    thadai = detect_santhana_thadai(chart, 1, {"SUN": 50})
    assert sarpa.is_present is False
    assert thadai.is_present is True and thadai.name == "SANTHANA_THADAI"
    assert thadai.conditions_met == ["fifth_house_has_saturn"]
    assert "Saturn" not in sarpa.description_en
    assert "Rahu" not in thadai.description_en


def test_aau12_a_node_beside_guru_never_forms_santhana_thadai() -> None:
    chart = {"SUN": 9, "SATURN": 3, "RAHU": 6, "KETU": 12, "JUPITER": 6}
    assert detect_putra_sarpa_dosham(chart, 1, {"SUN": 50}).conditions_met == ["jupiter_joined_by_rahu"]
    assert detect_santhana_thadai(chart, 1, {"SUN": 50}).is_present is False


def test_aau12_every_present_sarpa_names_a_node_and_every_thadai_names_saturn() -> None:
    """Swept over random charts, through the production assembler."""
    import random

    from app.calculations.yogas import detect_yogas_and_doshams

    rng = random.Random(12)
    grahas = ("SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN")
    seen = {"PUTRA_SARPA_DOSHAM": 0, "SANTHANA_THADAI": 0}
    for _ in range(400):
        chart = {g: rng.randint(1, 12) for g in grahas}
        rahu = rng.randint(1, 12)
        chart["RAHU"], chart["KETU"] = rahu, (rahu + 5) % 12 + 1
        _, doshams, _ = detect_yogas_and_doshams(
            chart, rng.randint(1, 12), chart["MOON"], active_lords=["SUN"], current_maha_lord="SUN",
        )
        for d in doshams:
            if d.name in seen and d.is_present:
                seen[d.name] += 1
                # Every marker ends in the afflicting graha (fifth_house_has_X,
                # fifth_lord_<lord>_joined_by_X, jupiter_joined_by_X); the lord
                # in the middle may be Saturn on a valid Sarpa chart.
                afflictors = {marker.rsplit("_", 1)[1] for marker in d.conditions_met}
                if d.name == "PUTRA_SARPA_DOSHAM":
                    assert afflictors and afflictors <= {"rahu", "ketu"}, d.conditions_met
                else:
                    assert afflictors == {"saturn"}, d.conditions_met
    assert all(seen.values()), seen  # the sweep reached both findings


def test_aau12_each_finding_routes_to_its_own_remedy_planet() -> None:
    """The remedial harm the ruling leads with: Saturn's finding must not be
    sent to the naga route."""
    from types import SimpleNamespace

    from app.calculations.remedies import active_dosham_planet

    def one(name: str) -> str | None:
        return active_dosham_planet([SimpleNamespace(name=name, is_present=True)], 1)

    assert one("PUTRA_SARPA_DOSHAM") == "RAHU"
    assert one("SANTHANA_THADAI") == "SATURN"


def _mks_chart(**overrides: int) -> dict[str, int]:
    # Mesham lagna; nothing in its MKS unless overridden.
    chart = {"SUN": 5, "MOON": 2, "MARS": 3, "MERCURY": 6, "JUPITER": 9, "VENUS": 4, "SATURN": 10}
    chart.update(overrides)
    return chart


def test_mks_names_the_planet_its_house_and_what_it_signifies() -> None:
    result = detect_marana_karaka_sthana(_mks_chart(MERCURY=7), 1)
    assert result.is_present and not result.is_cancelled
    assert result.conditions_met == ["mercury_in_marana_karaka_sthana"]
    assert result.meaning_en == (
        "Mercury, the planet of intellect, speech, learning and trade, sits in your 7th house (Thulam), "
        "the house of partnership — its Marana Karaka Sthana."
    )
    assert "துலாம்" in result.meaning_ta and "புதன்" in result.meaning_ta
    # The marker renders as a sentence, not "mercury in marana karaka sthana".
    assert _marker_explain("mercury_in_marana_karaka_sthana") == "Mercury is in your 7th house, its Marana Karaka Sthana"
    assert "marana karaka sthana" not in result.explanation_why_en


def test_mks_dignity_is_named_in_the_reading() -> None:
    # Dhanusu lagna: the 7th is Mithunam, Mercury's own sign.
    chart = {"SUN": 1, "MOON": 10, "MARS": 11, "MERCURY": 3, "JUPITER": 5, "VENUS": 12, "SATURN": 2}
    result = detect_marana_karaka_sthana(chart, 9)
    assert result.is_cancelled
    assert "Here it is in its own sign, which largely offsets the weakness." in result.meaning_en


def test_mks_saturn_reading_makes_no_life_span_claim() -> None:
    result = detect_marana_karaka_sthana(_mks_chart(SATURN=1), 1)
    assert result.is_present
    assert "longevity" not in result.meaning_en.lower()
    assert "ஆயுள்" not in result.meaning_ta


@pytest.mark.parametrize(
    ("marker", "en"),
    [
        ("fifth_lord_sun_joined_by_saturn", "Saturn shares a sign with your 5th lord, Sun"),
        ("jupiter_joined_by_ketu", "Ketu shares a sign with Jupiter, the karaka for children"),
        ("jupiter_aspects_moon_in_mks", "Jupiter aspects Moon there, a protective influence"),
    ],
)
def test_parametrized_markers_render_in_both_languages(marker: str, en: str) -> None:
    assert _marker_explain(marker) == en
    ta = _marker_explain_ta(marker)
    assert "_" not in ta and not any("a" <= ch <= "z" for ch in ta.lower())
