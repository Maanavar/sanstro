"""Rules built from the AI review of 2026-11-10 (DOCTRINE_DECISIONS_V1 §19, code tag
`ai_review_2026_11_10`; answers in docs/ASTROLOGER_MASTER_SHEET_RESPONSE_2026-11-10.md).

Each test pairs the new default with its counter-case, the replaced behaviour
behind the same switch, so a revert fails here and not only a text check.

Synthetic charts only: no person, no birth data. Lagna Mesham (1) unless
stated: the 5th house is Simmam (5), its lord the Sun.
"""
from __future__ import annotations

from dataclasses import replace

import pytest

from app.calculations._yoga_dosham import detect_putra_sarpa_dosham, detect_santhana_thadai
from app.calculations.doctrine_options import DEFAULT_DOCTRINE, validated
from app.calculations.remedies import active_dosham_planet

pytestmark = pytest.mark.no_db

_BASE = {"SUN": 3, "MOON": 6, "MARS": 7, "MERCURY": 3, "VENUS": 6, "SATURN": 8}


def _ps(*, doctrine=DEFAULT_DOCTRINE, d9=None, longitudes=None, **placed: int):
    return detect_putra_sarpa_dosham(
        {**_BASE, **placed}, 1, {}, doctrine=doctrine, d9_rasi_map=d9, longitudes=longitudes,
    )


# ── B1: a node alone in the 5th is a கவனம் note, not a dosham ────────────────
def test_a_node_alone_in_the_fifth_is_a_note_not_a_dosham() -> None:
    r = _ps(RAHU=5, KETU=11, JUPITER=2)
    assert not r.is_present and r.label == "NO_DOSHAM"
    assert r.context_notes == ("putra_sarpa_node_alone_watch",)
    assert r.parihara == "none" and r.progeny_outlook == "needs_attention"
    assert active_dosham_planet([r], 1) is None, "no naga parihara for a note"
    assert "fifth_house_has_rahu" in r.conditions_met


def test_node_alone_counter_case_mild_is_still_a_dosham() -> None:
    r = _ps(doctrine=replace(DEFAULT_DOCTRINE, ps_node_alone="mild"), RAHU=5, KETU=11, JUPITER=2)
    assert (r.is_present, r.strength, r.parihara) == (True, "WEAK", "full")


def test_one_whole_leg_still_declares() -> None:
    r = _ps(RAHU=5, KETU=11, SUN=11, JUPITER=2)
    assert r.is_present and r.formation_strength == "PARTIAL"


# ── B9: beyond 10 degrees a leg weighs half ──────────────────────────────────
def test_a_leg_within_ten_degrees_is_whole_and_beyond_is_half() -> None:
    placed = {"KETU": 5, "RAHU": 11, "SUN": 11, "JUPITER": 2}
    close = _ps(longitudes={"RAHU": 310.0, "SUN": 305.0}, **placed)
    wide = _ps(longitudes={"RAHU": 302.0, "SUN": 325.0}, **placed)
    assert close.is_present and close.formation_strength == "PARTIAL"
    assert not wide.is_present, "a half leg alone does not confirm"
    assert wide.context_notes == ("putra_sarpa_node_alone_watch",)


def test_orb_counter_case_zero_is_same_sign_full_weight() -> None:
    r = _ps(
        doctrine=replace(DEFAULT_DOCTRINE, node_beside_full_weight_orb=0.0),
        longitudes={"RAHU": 302.0, "SUN": 325.0}, KETU=5, RAHU=11, SUN=11, JUPITER=2,
    )
    assert r.is_present and r.formation_strength == "PARTIAL"


def test_two_wide_legs_make_one_whole_leg() -> None:
    # Rahu beside the Sun and beside Jupiter (which aspects Simmam from the
    # 11th), both more than 10 degrees away.
    r = _ps(longitudes={"RAHU": 300.5, "SUN": 325.0, "JUPITER": 329.0}, KETU=5, RAHU=11, SUN=11, JUPITER=11)
    assert r.is_present and r.formation_strength == "PARTIAL"


# ── B6: a strong 5th lord ────────────────────────────────────────────────────
# Ketu in the 5th; Rahu with Jupiter in the 11th (Jupiter aspects Simmam): one
# leg. The Sun, the 5th lord, exalted in the lagna.
_B6 = {"KETU": 5, "RAHU": 11, "JUPITER": 11, "SUN": 1}


def test_a_dignified_kendra_fifth_lord_with_a_clean_navamsa_lowers_the_grade() -> None:
    r = _ps(d9={"SUN": 1}, **_B6)
    assert (r.formation_strength, r.strength) == ("PARTIAL", "WEAK")
    assert "fifth_lord_sun_strong" in r.cancellation_factors


def test_fifth_lord_debilitated_in_navamsa_or_unknown_navamsa_is_not_strong() -> None:
    for d9 in ({"SUN": 7}, None):
        r = _ps(d9=d9, **_B6)
        assert r.strength == "PARTIAL", d9
        assert "fifth_lord_sun_strong" not in r.cancellation_factors


def test_fifth_lord_joined_by_the_dosham_planet_is_not_strong() -> None:
    r = _ps(d9={"SUN": 1}, KETU=5, RAHU=1, JUPITER=2, SUN=1)  # Rahu with the Sun: the leg itself
    assert "fifth_lord_sun_strong" not in r.cancellation_factors


def test_strong_lord_counter_case_stand_in_reads_the_score() -> None:
    stand_in = replace(DEFAULT_DOCTRINE, children_protection_definition="stand_in")
    r = detect_putra_sarpa_dosham({**_BASE, **_B6}, 1, {"SUN": 40}, doctrine=stand_in, d9_rasi_map={"SUN": 1})
    assert "fifth_lord_sun_strong" not in r.cancellation_factors


# ── B7: a protecting Jupiter needs a link to the 5th and no affliction ───────
def test_a_kendra_jupiter_with_no_link_does_not_protect() -> None:
    # Jupiter exalted in Kadagam (the 4th) aspects 8, 10, 12: no link to
    # Simmam or to the Sun in the 11th.
    r = _ps(KETU=5, RAHU=11, SUN=11, JUPITER=4)
    assert r.strength == "PARTIAL"
    assert not any(f.startswith("jupiter_") for f in r.cancellation_factors)


def test_kendra_counter_case_stand_in_protects() -> None:
    r = _ps(doctrine=replace(DEFAULT_DOCTRINE, children_protection_definition="stand_in"),
            KETU=5, RAHU=11, SUN=11, JUPITER=4)
    assert r.strength == "WEAK" and "jupiter_in_kendra_house_4" in r.cancellation_factors


def test_a_linked_unafflicted_jupiter_protects() -> None:
    # Jupiter in Dhanusu (own sign, the 9th) aspects Simmam by its 9th aspect.
    r = _ps(KETU=5, RAHU=11, SUN=11, JUPITER=9)
    assert r.strength == "WEAK"
    assert "jupiter_guards_fifth_from_house_9" in r.cancellation_factors


def test_jupiter_in_the_fifth_protects_only_when_dignified() -> None:
    # Santhana Thadai by Saturn beside the 5th lord.
    simmam = detect_santhana_thadai({**_BASE, "SATURN": 3, "JUPITER": 5, "RAHU": 2, "KETU": 8}, 1, {})
    assert simmam.is_present
    assert not any(f.startswith("jupiter_") for f in simmam.cancellation_factors)
    # Meenam lagna: the 5th is Kadagam, where Jupiter is exalted; the Moon,
    # the 5th lord, sits with Saturn in Thulam.
    kadagam = detect_santhana_thadai(
        {"SUN": 10, "MOON": 7, "MARS": 2, "MERCURY": 10, "VENUS": 11, "SATURN": 7, "JUPITER": 4, "RAHU": 3, "KETU": 9},
        12, {},
    )
    assert kadagam.is_present
    assert "jupiter_guards_fifth_from_house_5" in kadagam.cancellation_factors


def test_new_options_validate() -> None:
    assert validated(DEFAULT_DOCTRINE) is DEFAULT_DOCTRINE
    with pytest.raises(ValueError):
        validated(replace(DEFAULT_DOCTRINE, ps_node_alone="maybe"))
    with pytest.raises(ValueError):
        validated(replace(DEFAULT_DOCTRINE, node_beside_full_weight_orb=45.0))


# ── C2: Mars in Simmam or Kumbam is nivarthi for every Sevvai house ──────────
# Viruchigam lagna (8): Mars in Kumbam is the 4th house; the Moon in Kadagam
# corroborates (Mars 8th from it), so the base grade is PARTIAL. Nothing else
# reduces: no Jupiter aspect, no benefic with Mars, the 7th lord in the 8th.
_C2 = {"MARS": 11, "MOON": 4, "VENUS": 3, "JUPITER": 2, "SATURN": 1, "SUN": 6, "MERCURY": 6, "RAHU": 6, "KETU": 12}


def _sevvai(planets, lagna, doctrine=DEFAULT_DOCTRINE, **kw):
    from app.calculations._yoga_dosham import detect_sevvai_dosham

    return detect_sevvai_dosham(planets, lagna, doctrine=doctrine, **kw)


def test_mars_in_kumbam_reduces_sevvai() -> None:
    r = _sevvai(_C2, 8)
    assert r.is_present and r.formation_strength == "PARTIAL"
    assert r.strength == "WEAK" and "mars_in_simha_kumbha" in r.cancellation_factors


def test_simha_kumbha_counter_case_off_keeps_the_grade() -> None:
    r = _sevvai(_C2, 8, replace(DEFAULT_DOCTRINE, sevvai_simha_kumbha_nivarthi=False))
    assert r.strength == "PARTIAL" and "mars_in_simha_kumbha" not in r.cancellation_factors


# ── C4: a strong Guru on Mars is nivarthi ────────────────────────────────────
# Mesham lagna: Mars in Thulam (the 7th), corroborated by the Moon and Venus in
# Mesham (base STRONG). Jupiter in Mesham, a friend's sign, aspects Mars.
_C4 = {"MARS": 7, "MOON": 1, "VENUS": 1, "JUPITER": 1, "SATURN": 10, "SUN": 12, "MERCURY": 12, "RAHU": 6, "KETU": 12}


def test_a_strong_guru_on_mars_shows_the_lowest_grade_with_a_note() -> None:
    r = _sevvai(_C4, 1)
    assert r.is_present and not r.is_cancelled
    assert r.formation_strength == "STRONG" and r.strength == "WEAK"
    assert "strong_guru_on_mars" in r.cancellation_factors
    assert "sevvai_strong_guru_nivarthi" in r.context_notes


def test_a_strong_guru_on_mars_is_no_mismatch_in_matching() -> None:
    r = _sevvai(_C4, 1, partner_sevvai_references=())
    assert r.is_cancelled


def test_strong_guru_counter_case_reduces_one_grade_only() -> None:
    reduces = replace(DEFAULT_DOCTRINE, sevvai_strong_guru="reduces")
    r = _sevvai(_C4, 1, reduces)
    assert r.strength == "PARTIAL" and "strong_guru_on_mars" not in r.cancellation_factors
    assert not _sevvai(_C4, 1, reduces, partner_sevvai_references=()).is_cancelled


def test_a_debilitated_guru_is_not_strong() -> None:
    # Jupiter in Magaram (its debility) aspects Kadagam, Meenam and Viruchigam:
    # put Mars in Kadagam, the 4th from Mesham.
    planets = {**_C4, "MARS": 4, "MOON": 1, "VENUS": 1, "JUPITER": 10, "SATURN": 6}
    r = _sevvai(planets, 1)
    assert "strong_guru_on_mars" not in r.cancellation_factors


# ── D3: Rahu by gochara is 3/6/11; the 10th is mixed ─────────────────────────
def test_rahu_tenth_from_the_moon_is_mixed_and_neutral() -> None:
    from app.calculations.gochara_grade import gochara_grade
    from app.calculations.gochara_scores import NEUTRAL, gochara_house_score, is_favourable_gochara

    assert gochara_grade("RAHU", 10) == "MIXED"
    assert gochara_house_score("RAHU", 10) == NEUTRAL
    assert not is_favourable_gochara("RAHU", 10)
    # Counter-cases: the other three stay favourable, and the Sun keeps its 10th.
    assert all(gochara_grade("RAHU", h) == "SUPPORTIVE" for h in (3, 6, 11))
    assert is_favourable_gochara("SUN", 10)
    assert gochara_grade("KETU", 10) == "NEEDS_CARE"


# ── B4: the D7 birth-time line is 5 minutes ──────────────────────────────────
def test_d7_birth_time_line_is_five_minutes() -> None:
    from app.calculations.progeny_checks import BIRTH_TIME_TOLERANCE_MINUTES, D7_MARGIN_MINUTES

    assert BIRTH_TIME_TOLERANCE_MINUTES == 5 and D7_MARGIN_MINUTES == 5.0


# ── D10: no marriage window below the legal age ──────────────────────────────
def test_no_marriage_window_starts_before_the_legal_age(monkeypatch) -> None:
    from datetime import UTC, date, datetime

    from app.calculations import event_windows
    from app.calculations.astro import utc_datetime_to_julian_day

    # A synthetic child born 1 Jun 2015 (21 on 1 Jun 2036), Mesham lagna.
    chart = event_windows.ChartData(
        lagna_rasi=1, moon_longitude=100.0,
        birth_jd=utc_datetime_to_julian_day(datetime(2015, 6, 1, 6, 0, tzinfo=UTC)),
    )
    legal = date(2036, 6, 1)
    windows = event_windows.find_marriage_windows(chart, 2026, 2045)
    assert all(w.start_date >= legal for w in windows)
    # Counter-case: without the floor the same chart has windows before it.
    monkeypatch.setattr(event_windows, "MARRIAGE_LEGAL_AGE", 0)
    unfloored = event_windows.find_marriage_windows(chart, 2026, 2045)
    assert any(w.start_date < legal for w in unfloored)


# ── D11: the Sanskrit ruthu beside the Tamil ─────────────────────────────────
def test_ruthu_prints_the_sanskrit_name_beside_the_tamil(monkeypatch) -> None:
    from datetime import date

    from app.calculations import tamil_year

    info = tamil_year.tamil_year_info(date(2026, 4, 20), "Asia/Kolkata", 13.0827, 80.2707)
    assert info.ruthu == "ILAVENIL"
    assert (info.ruthu_ta, info.ruthu_en) == ("இளவேனில் (வசந்த ருது)", "Ilavenil (Vasanta)")
    assert set(tamil_year.RUTHU_SANSKRIT) == {r[0] for r in tamil_year.RUTHU_CYCLE}
    monkeypatch.setattr(tamil_year, "SHOW_SANSKRIT_RUTHU", False)
    plain = tamil_year.tamil_year_info(date(2026, 4, 20), "Asia/Kolkata", 13.0827, 80.2707)
    assert (plain.ruthu_ta, plain.ruthu_en) == ("இளவேனில்", "Ilavenil")


# ── A1/A3: two tests, lordship and strength ──────────────────────────────────
def _stub(graha: str, rasi: int, *, combust: bool = False):
    from types import SimpleNamespace

    return SimpleNamespace(graha=graha, rasi=rasi, is_combust=combust)


def test_exalted_venus_for_meena_lagna_is_mixed_and_names_malavya() -> None:
    from app.services import one_minute_reading_service as one

    chart_1 = one.LordStanding.from_chart(12, [_stub("VENUS", 12), _stub("JUPITER", 6)])
    ta, en = one._now_texture("VENUS", "self", chart_1)
    assert "மாளவ்ய யோகம்" in ta and "yoga" not in en  # English body: no technical vocabulary
    assert "மூன்றாம், எட்டாம்" in ta and "but is strong" in en
    # The lagna lord, in a kendra, keeps the promise (A3).
    assert one._now_texture("JUPITER", "self", chart_1) == one._VOICE["JUPITER"].now_texture


def test_mixed_counter_case_single_test_names_the_houses_only(monkeypatch) -> None:
    from app.services import one_minute_reading_service as one

    monkeypatch.setattr(one, "PROMISE_NEEDS_STRENGTH", False)
    chart_1 = one.LordStanding.from_chart(12, [_stub("VENUS", 12)])
    ta, en = one._now_texture("VENUS", "self", chart_1)
    assert "மாளவ்ய" not in ta and "those houses' matters that tend to come forward" in en


def test_a_weak_benefic_lord_loses_the_promise() -> None:
    from app.services import one_minute_reading_service as one

    # Meena lagna: Jupiter, the lagna lord, in Thulam (an enemy's sign, the 8th).
    weak = one.LordStanding.from_chart(12, [_stub("JUPITER", 7)])
    ta, en = one._now_texture("JUPITER", "self", weak)
    assert "helpful lord but not a strong one" in en and "வலு குறைவாக" in ta


def test_weak_benefic_counter_case_single_test_keeps_the_promise(monkeypatch) -> None:
    from app.services import one_minute_reading_service as one

    monkeypatch.setattr(one, "PROMISE_NEEDS_STRENGTH", False)
    weak = one.LordStanding.from_chart(12, [_stub("JUPITER", 7)])
    assert one._now_texture("JUPITER", "self", weak) == one._VOICE["JUPITER"].now_texture


def test_navamsa_debility_takes_the_strength_away() -> None:
    from types import SimpleNamespace

    from app.services import one_minute_reading_service as one

    in_d9_debility = SimpleNamespace(graha="JUPITER", rasi=12, is_combust=False, d9_rasi=10)
    standing = one.LordStanding.from_chart(12, [in_d9_debility])
    assert not standing.strong("JUPITER") and not standing.promise_holds("JUPITER")
    assert one.LordStanding.from_chart(12, [_stub("JUPITER", 12)]).promise_holds("JUPITER")


def test_the_strong_malefic_bhukti_names_both_sides() -> None:
    from app.services import five_minute_reading_service as five
    from app.services import one_minute_reading_service as one

    chart_1 = one.LordStanding.from_chart(12, [_stub("VENUS", 12)])
    ta, en = five.bhukti_flavor("VENUS", them=False, standing=chart_1)
    assert "வசதிகளையும்" in ta and "comforts too" in en


# ── C3: a mild Sevvai says it is common ──────────────────────────────────────
def test_a_mild_sevvai_says_it_is_common_and_a_confirmed_one_does_not() -> None:
    mild = _sevvai(_C2, 8)  # reduced to WEAK by Kumbam
    assert mild.strength == "WEAK" and "sevvai_mild_is_common" in mild.context_notes
    confirmed = _sevvai(_C2, 8, replace(DEFAULT_DOCTRINE, sevvai_simha_kumbha_nivarthi=False))
    assert confirmed.strength == "PARTIAL" and "sevvai_mild_is_common" not in confirmed.context_notes


# ── A6: a neutral line at a child's Mars-to-Rahu dasa change ─────────────────
def test_child_mars_to_rahu_change_gets_a_neutral_sandhi_line(monkeypatch) -> None:
    from datetime import date

    from app.services import one_minute_reading_service as one
    from tests.test_tamil_everyday_voice import _mars_then_rahu

    beat = one._beat_years_ahead_for_a_child(timeline=_mars_then_rahu(), as_of=date(2026, 11, 10), display_name="Kavitha")
    assert "தசா சந்தி" in beat.text.ta and "dasa sandhi" in beat.text.en
    # No prediction about subjects or schooling rides on it.
    assert "படிப்பு" not in beat.text.ta and "school" not in beat.text.en
    monkeypatch.setattr(one, "_CHILD_SENSITIVE_SANDHI", frozenset())
    plain = one._beat_years_ahead_for_a_child(timeline=_mars_then_rahu(), as_of=date(2026, 11, 10), display_name="Kavitha")
    assert "சந்தி" not in plain.text.ta


# ── A7: Saturn on the lagna adds one line, only with a confirmed time ────────
def test_saturn_on_the_lagna_adds_one_line_only_when_the_lagna_is_given() -> None:
    from datetime import date

    from app.services import five_minute_reading_service as five

    # Chart 1 (synthetic): Moon in Viruchigam, Meena lagna; Saturn in Meenam in Nov 2026.
    with_lagna = five._beat_window_ahead(moon_rasi=8, as_of=date(2026, 11, 10), lagna_rasi=12)
    without = five._beat_window_ahead(moon_rasi=8, as_of=date(2026, 11, 10))
    assert "லக்னத்தின் மீதும்" in with_lagna.text.ta and "over your lagna" in with_lagna.text.en
    assert "லக்ன" not in without.text.ta and "lagna" not in without.text.en
    # The Moon count stays the graded one: same opening either way.
    assert with_lagna.text.en.startswith(without.text.en)


# ── B3: the D7 confirms; a supportive D7 lowers one grade, never raises ──────
@pytest.mark.parametrize(
    ("strength", "verdict", "expected"),
    [
        ("PARTIAL", "SUPPORTS", "WEAK"),
        ("STRONG", "SUPPORTS", "PARTIAL"),
        ("WEAK", "SUPPORTS", None),  # already the lowest
        ("PARTIAL", "REPEATS", None),  # blocks the lowering, never raises
        ("PARTIAL", "STRAINED", None),
        ("PARTIAL", "MIXED", None),
        ("STRONG", "UNCERTAIN", None),
    ],
)
def test_d7_lowers_only_on_support(strength: str, verdict: str, expected) -> None:
    from app.calculations.progeny_checks import d7_lowered_strength

    assert d7_lowered_strength(strength, verdict) == expected


def test_d7_counter_case_off_never_grades(monkeypatch) -> None:
    from app.calculations import progeny_checks

    monkeypatch.setattr(progeny_checks, "D7_LOWERS_A_SUPPORTED_GRADE", False)
    assert progeny_checks.d7_lowered_strength("PARTIAL", "SUPPORTS") is None


# ── B5: the periods that bring a children's dosham into effect ───────────────
def test_felt_periods_add_the_fifth_lord_and_planets_joined_in_the_fifth(monkeypatch) -> None:
    from app.calculations import progeny_checks as pc

    # Mesham lagna: Rahu in Simmam (the 5th) with Mercury; the Sun rules the 5th.
    rasis = {"RAHU": 5, "MERCURY": 5, "SUN": 9, "JUPITER": 2, "KETU": 11}
    assert set(pc._felt_lords(1, ("RAHU",), rasis)) == {"RAHU", "MERCURY", "SUN"}
    assert pc._supporting_lords(1, ("RAHU",), ["fifth_house_has_rahu"]) == ("JUPITER",)
    # Counter-case: the 11-09 reading felt the afflictor alone; Jupiter and the
    # 5th lord were supportive.
    monkeypatch.setattr(pc, "DASA_PERIODS", "q13")
    assert pc._felt_lords(1, ("RAHU",), rasis) == ("RAHU",)
    assert pc._supporting_lords(1, ("RAHU",), ["fifth_house_has_rahu"]) == ("JUPITER", "SUN")


# ── D1: marana yogam and Karinaal also block the நல்ல நாள் badge ─────────────
def test_marana_yogam_and_karinaal_block_the_badge(monkeypatch) -> None:
    from app.calculations import panchangam as pg
    from app.calculations.karinaal import karinaal_days_for_year

    monday = 0  # not a blocked weekday
    marana_star = next(n for n in range(1, 28) if pg.amirdhadhi_yogam_class(monday, n) == "M")
    amrita_star = next(n for n in range(1, 28) if pg.amirdhadhi_yogam_class(monday, n) == "A")
    assert "Marana yogam" in pg._day_block_reason(2, monday, marana_star)
    assert pg._day_block_reason(2, monday, amrita_star) is None
    karinaal = min(karinaal_days_for_year(2027))
    assert pg._day_block_reason(2, monday, amrita_star, karinaal) == "Inauspicious: Karinaal"
    # Counter-case: AAU-07's weekday and tithi blocks only.
    monkeypatch.setattr(pg, "DAY_BLOCKS_MARANA_AND_KARINAAL", False)
    assert pg._day_block_reason(2, monday, marana_star, karinaal) is None


# ── F5: tonsure prefers Uttarayanam; Dakshinayanam scores lower, never vetoes ─
def test_tonsure_in_dakshinayanam_scores_lower_and_is_not_vetoed() -> None:
    from datetime import date

    from app.calculations import muhurta_engine as engine
    from app.services.panchangam_cache import calculate_daily_panchangam

    chennai = (13.0827, 80.2707, "Asia/Kolkata")
    october = calculate_daily_panchangam(date(2026, 10, 28), *chennai)  # Aippasi
    february = calculate_daily_panchangam(date(2027, 2, 10), *chennai)  # Thai
    dakshina = engine._tonsure_ayana_factor(october, "TONSURE")
    assert dakshina is not None and dakshina.verdict is engine.Verdict.PENALTY
    assert dakshina.contribution == engine._W.TONSURE_DAKSHINAYANAM < 0
    assert engine._tonsure_ayana_factor(february, "TONSURE") is None
    # Counter-case: no other activity carries it.
    assert engine._tonsure_ayana_factor(october, "MARRIAGE") is None


# ── A2: the bhukti lord read against the dasa lord ───────────────────────────
def test_rahu_bhukti_names_its_sign_lord_and_its_place_from_the_dasa_lord(monkeypatch) -> None:
    from app.services import five_minute_reading_service as five
    from app.services import one_minute_reading_service as one

    # Chart 1 (synthetic): Venus in Meenam, Rahu in Viruchigam (9th from Venus).
    chart_1 = one.LordStanding.from_chart(12, [_stub("VENUS", 12), _stub("RAHU", 8)])
    ta, en = five.bhukti_relation("VENUS", "RAHU", chart_1)
    assert "delivers through Mars" in en and "செவ்வாய் வழியாகவே" in ta
    assert "9th from Venus" in en and "smoothly" in en
    # A 6/8/12 placement reads as friction: Saturn 8th from Venus.
    friction = one.LordStanding.from_chart(12, [_stub("VENUS", 12), _stub("SATURN", 7)])
    assert "friction" in five.bhukti_relation("VENUS", "SATURN", friction)[1]
    # No confirmed chart, no sentence; and the switch removes it.
    assert five.bhukti_relation("VENUS", "RAHU", None) == ("", "")
    monkeypatch.setattr(five, "BHUKTI_RELATION", False)
    assert five.bhukti_relation("VENUS", "RAHU", chart_1) == ("", "")


# ── A9: what the 4th–5th exchange means for the child ────────────────────────
def test_child_exchange_says_what_it_means_and_notes_a_combust_fourth_lord(monkeypatch) -> None:
    from types import SimpleNamespace

    from app.services import five_minute_reading_service as five

    venus = SimpleNamespace(graha="VENUS", house_from_lagna=5, is_combust=True)
    mars = SimpleNamespace(graha="MARS", house_from_lagna=4)
    ta, en = five._child_learning_house_clause(house=4, lord="VENUS", record=venus, lagna_rasi=4, planets=(venus, mars))
    assert "home and learning support each other" in en and "Consistency matters more than pressure" in en
    assert "துணை நிற்கும்" in ta
    monkeypatch.setattr(five, "CHILD_EXCHANGE_MEANING", False)
    ta, en = five._child_learning_house_clause(house=4, lord="VENUS", record=venus, lagna_rasi=4, planets=(venus, mars))
    assert "support each other" not in en and "parivartana" in en
