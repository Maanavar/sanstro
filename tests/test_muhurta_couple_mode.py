"""Two charts, one wedding date — the couple layer and the bride's Jupiter rule.

A wedding has two subjects and this engine scored one. Chandrashtama and Tara
Bala are per-person gates in Tamil practice, so a date clean for the groom and
Naidhana for the bride was being recommended as a wedding muhurtham on the
strength of half the evidence.

Owner ruling, 2026-09-12, pinned below:

* The **weaker side governs** each personal factor. Not an average — an
  excellent Tara Bala for one does not buy back an adverse one for the other.
* A **veto from either** side vetoes the day.
* The personal layer keeps the **same weight** it has in single-chart mode, so
  the ruling cannot be undone by the score scale quietly doubling.
* Ch. XIV p.79's Jupiter gochara is wired as a **penalty**, from the **bride's**
  Janma-Rasi, and only when a caller has said which chart is hers.

The sweeps here run over many subject pairs rather than many dates. One pair on
thirty days is a weaker test than thirty pairs on one day, because the property
being checked is a property of the *pair*.
"""
from __future__ import annotations

from datetime import date, timedelta

import pytest

from app.calculations.muhurta_engine import (
    FactorResult,
    Subject,
    Verdict,
    _personal_factors,
    _weaker_side_governs,
    marriage_jupiter_gochara_factor,
    score_day,
)
from app.calculations.panchangam import calculate_daily_panchangam
from app.data.marriage_muhurta_rules import MARRIAGE_JUPITER_ADVERSE_HOUSES_FROM_MOON
from app.services.muhurta_service import _apply_tara_display_cap

pytestmark = pytest.mark.no_db

_LATITUDE, _LONGITUDE, _TIMEZONE = 13.0827, 80.2707, "Asia/Kolkata"
_START = date(2026, 6, 1)
_DAYS = 30

# Synthetic throughout. No real birth data reaches a fixture — see CLAUDE.md.
_BRIDE = Subject(
    janma_nakshatra=3, janma_rasi=2, lagna_rasi=5,
    label="the bride", label_ta="மணமகள்", role="BRIDE",
)
_GROOM = Subject(
    janma_nakshatra=17, janma_rasi=8, lagna_rasi=1,
    label="the groom", label_ta="மணமகன்", role="GROOM",
)


@pytest.fixture(scope="module")
def snapshots():
    return [
        calculate_daily_panchangam(_START + timedelta(days=offset), _LATITUDE, _LONGITUDE, _TIMEZONE)
        for offset in range(_DAYS)
    ]


def _factor(name: str, verdict: Verdict, contribution: float) -> FactorResult:
    return FactorResult(
        factor=name, verdict=verdict, contribution=contribution,
        reason_en="reason", reason_ta="காரணம்",
    )


def _priced(factors, name: str) -> float:
    return sum(f.contribution for f in factors if f.factor == name)


# ── the combination rule ────────────────────────────────────────────────────


def test_worse_of_two_readings_is_the_one_priced():
    """Bride +8, groom -12 → the day takes -12, not -2 and not -4."""
    combined = _weaker_side_governs(
        [_factor("TARA_BALA", Verdict.BONUS, 8.0)],
        [_factor("TARA_BALA", Verdict.PENALTY, -12.0)],
    )
    assert _priced(combined, "TARA_BALA") == -12.0


def test_both_readings_are_reported_even_though_one_is_priced():
    """The stood-down half stays visible. A reader comparing two dates needs to
    see that the bride's star was fine on the one the groom's ruled out."""
    combined = _weaker_side_governs(
        [_factor("TARA_BALA", Verdict.BONUS, 8.0)],
        [_factor("TARA_BALA", Verdict.PENALTY, -12.0)],
    )
    assert len(combined) == 2
    stood_down = next(f for f in combined if f.contribution == 0.0)
    # A zero that does not explain itself is the defect class this repo has
    # already paid for: a printed number and the sentence beside it disagreeing.
    assert "Not counted in the score" in stood_down.reason_en
    assert "சேர்க்கப்படவில்லை" in stood_down.reason_ta
    # Bilingual, not one English clause spliced into the Tamil sentence.
    assert "Not counted" not in stood_down.reason_ta


def test_a_veto_from_either_side_survives_the_fold():
    for primary, partner in (
        ([_factor("CHANDRA_BALA", Verdict.VETO, 0.0)], [_factor("CHANDRA_BALA", Verdict.BONUS, 10.0)]),
        ([_factor("CHANDRA_BALA", Verdict.BONUS, 10.0)], [_factor("CHANDRA_BALA", Verdict.VETO, 0.0)]),
    ):
        combined = _weaker_side_governs(primary, partner)
        assert any(f.verdict is Verdict.VETO for f in combined)
        # And nothing alongside a veto is credited.
        assert _priced(combined, "CHANDRA_BALA") == 0.0


def test_a_penalty_only_one_side_earns_still_applies():
    """An absent factor is a neutral 0 for that subject, not "no opinion".

    This is the direction an avoidance rule must never fail. Writing the floor
    as a flat 0.0 for a one-sided family discards exactly this case.
    """
    combined = _weaker_side_governs([_factor("JANMA_TARA_COUNT", Verdict.PENALTY, -20.0)], [])
    assert _priced(combined, "JANMA_TARA_COUNT") == -20.0


def test_a_bonus_only_one_side_earns_is_not_credited():
    """The mirror of the rule above, and the half that stops the fold from
    quietly becoming "best of both"."""
    combined = _weaker_side_governs([_factor("JANMA_TARA_COUNT", Verdict.BONUS, 8.0)], [])
    assert _priced(combined, "JANMA_TARA_COUNT") == 0.0


def test_couple_mode_never_scores_above_either_chart_alone(snapshots):
    """The whole ruling in one property, swept over every day in the range.

    If this ever fails upward, the personal layer has started averaging or
    summing — the two failure modes the ruling names by hand.
    """
    for snapshot in snapshots:
        solo_bride = score_day(snapshot, "MARRIAGE", _BRIDE, include_lagna_sign=False)
        solo_groom = score_day(snapshot, "MARRIAGE", _GROOM, include_lagna_sign=False)
        couple = score_day(snapshot, "MARRIAGE", _BRIDE, co_subject=_GROOM, include_lagna_sign=False)
        assert couple.score <= min(solo_bride.score, solo_groom.score) + 1e-9
        assert couple.vetoed == (solo_bride.vetoed or solo_groom.vetoed)


def test_couple_mode_does_not_double_the_personal_layer(snapshots):
    """The scale is unchanged: the fold prices one reading per factor family.

    Summing both subjects would have doubled the personal layer against the
    almanac, which is the double-counting failure this codebase has hit before —
    and it would have done so silently, because every number still looks
    plausible.
    """
    personal = {"CHANDRA_BALA", "TARA_BALA", "JANMA_NAKSHATRA", "JANMA_TARA_COUNT"}

    def almanac(day):
        return sum(f.contribution for f in day.factors if f.factor not in personal)

    for snapshot in snapshots:
        couple = score_day(snapshot, "MARRIAGE", _BRIDE, co_subject=_GROOM, include_lagna_sign=False)
        bride_only = score_day(snapshot, "MARRIAGE", _BRIDE, include_lagna_sign=False)
        priced_families = [
            f.factor for f in couple.factors
            if f.factor in personal and f.contribution != 0.0
        ]
        # At most one priced reading per family, however many were reported.
        assert len(priced_families) == len(set(priced_families))
        # And the almanac half of the day is untouched by the fold.
        assert almanac(couple) == pytest.approx(almanac(bride_only))


def test_reported_contributions_still_sum_to_the_score(snapshots):
    """`factors` remains a complete, honest account of the number beside it."""
    for snapshot in snapshots[:5]:
        couple = score_day(snapshot, "MARRIAGE", _BRIDE, co_subject=_GROOM, include_lagna_sign=False)
        assert couple.score == pytest.approx(50.0 + sum(f.contribution for f in couple.factors))


def test_a_co_subject_without_a_subject_is_refused(snapshots):
    """A couple is two charts. Allowing this would silently become single-chart
    mode for whichever person the caller did not think they were asking about."""
    with pytest.raises(ValueError):
        score_day(snapshots[0], "MARRIAGE", None, co_subject=_GROOM)


def test_general_mode_is_untouched_by_the_couple_path(snapshots):
    for snapshot in snapshots[:5]:
        general = score_day(snapshot, "MARRIAGE", None, include_lagna_sign=False)
        assert not any(
            f.factor in {"CHANDRA_BALA", "TARA_BALA", "JANMA_TARA_COUNT"} for f in general.factors
        )


def test_both_subjects_are_named_in_their_own_language(snapshots):
    """A role label is generated copy with a real Tamil form, so it must use it.

    A personal name has no translation and falls back to `label` in both, which
    is the behaviour that existed before roles did.
    """
    couple = score_day(snapshots[0], "MARRIAGE", _BRIDE, co_subject=_GROOM, include_lagna_sign=False)
    chandra = [f for f in couple.factors if f.factor == "CHANDRA_BALA"]
    assert len(chandra) == 2
    assert any("the bride" in f.reason_en for f in chandra)
    assert any("the groom" in f.reason_en for f in chandra)
    assert any("மணமகள்" in f.reason_ta for f in chandra)
    assert any("மணமகன்" in f.reason_ta for f in chandra)
    for factor in chandra:
        assert "bride" not in factor.reason_ta
        assert "groom" not in factor.reason_ta


def test_the_display_cap_takes_the_tightest_of_the_two(snapshots):
    """The cap follows the score's ruling: an adverse tara on either side holds
    the band down, whatever the other chart reads."""
    for snapshot in snapshots:
        both = _apply_tara_display_cap(500.0, snapshot, (_BRIDE, _GROOM))
        assert both == min(
            _apply_tara_display_cap(500.0, snapshot, (_BRIDE,)),
            _apply_tara_display_cap(500.0, snapshot, (_GROOM,)),
        )


def test_personal_factors_helper_matches_single_chart_mode(snapshots):
    """The extraction that made the fold possible did not change single-chart
    scoring — the §9.4 concern, in miniature."""
    for snapshot in snapshots[:5]:
        solo = score_day(snapshot, "MARRIAGE", _BRIDE, include_lagna_sign=False)
        helper = _personal_factors(snapshot, "MARRIAGE", _BRIDE)
        # The personal factors are appended last and in this order, so the
        # helper's output is exactly the tail of a single-chart day.
        assert list(solo.factors)[-len(helper):] == helper


# ── Ch. XIV p.79, Jupiter from the bride's Janma-Rasi ───────────────────────


class _Body:
    """Minimal stand-in for an `EphemerisBody`: this rule reads only `rasi`."""

    def __init__(self, rasi: int) -> None:
        self.rasi = rasi


def _bodies(jupiter_rasi: int) -> dict[str, _Body]:
    return {"JUPITER": _Body(jupiter_rasi)}


@pytest.mark.parametrize("house", sorted(MARRIAGE_JUPITER_ADVERSE_HOUSES_FROM_MOON))
def test_jupiter_in_an_adverse_house_from_the_bride_is_a_penalty(house):
    jupiter_rasi = ((_BRIDE.janma_rasi - 1 + house - 1) % 12) + 1
    factor = marriage_jupiter_gochara_factor("MARRIAGE", _bodies(jupiter_rasi), _BRIDE)
    assert factor is not None
    assert factor.verdict is Verdict.PENALTY
    assert factor.contribution < 0
    assert factor.rule_id == "MARRIAGE_JUPITER_GOCHARA_FROM_MOON"
    # Owner ruling: wired as a penalty with the copy softened. The passage's own
    # consequence is in the citation, and must not be in the sentence on screen.
    assert "widow" not in factor.reason_en.lower()
    assert "dies" not in factor.reason_en.lower()


@pytest.mark.parametrize("house", [h for h in range(1, 13) if h not in MARRIAGE_JUPITER_ADVERSE_HOUSES_FROM_MOON])
def test_jupiter_clear_of_the_adverse_houses_is_named_not_silent(house):
    """"We checked and it is clear" must be distinguishable from "no table"."""
    jupiter_rasi = ((_BRIDE.janma_rasi - 1 + house - 1) % 12) + 1
    factor = marriage_jupiter_gochara_factor("MARRIAGE", _bodies(jupiter_rasi), _BRIDE)
    assert factor is not None
    assert factor.verdict is Verdict.NEUTRAL
    assert factor.contribution == 0.0


def test_the_rule_is_silent_for_the_groom_and_for_an_unnamed_role():
    """It names a consequence that falls on the bride. Applying it to the wrong
    chart is not the cautious reading — it is simply the wrong one."""
    for rasi in range(1, 13):
        assert marriage_jupiter_gochara_factor("MARRIAGE", _bodies(rasi), _GROOM) is None
        unnamed = Subject(janma_nakshatra=3, janma_rasi=2)
        assert marriage_jupiter_gochara_factor("MARRIAGE", _bodies(rasi), unnamed) is None


def test_the_rule_is_scoped_to_marriage():
    for activity in ("NAMING_CEREMONY", "JOB_START", "GOLD"):
        assert marriage_jupiter_gochara_factor(activity, _bodies(1), _BRIDE) is None


def test_the_rule_is_silent_when_jupiter_is_missing():
    assert marriage_jupiter_gochara_factor("MARRIAGE", {}, _BRIDE) is None
