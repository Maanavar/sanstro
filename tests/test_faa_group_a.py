"""Group A fixes from docs/FULL_ASTRO_ACCURACY_AUDIT_2026-11-10.md.

One test block per item. Synthetic inputs only (CLAUDE.md PII rule); the
places are city centres, the instants are public eclipses and almanac dates.
"""
from __future__ import annotations

from datetime import UTC, date, datetime

import pytest

from app.calculations.astro import navamsa_rasi_from_degree, utc_datetime_to_julian_day

CHENNAI = (13.0827, 80.2707, "Asia/Kolkata")


# ── FAA-01: D9 lagna start signs (server is the only D9 source) ──────────────
# The mobile copy started fixed signs at the 8th and dual at the 4th. Mobile's
# own gate is mobile/__tests__/d9-lagna-from-server.test.ts.
@pytest.mark.parametrize(
    ("lagna_rasi", "expected_d9"),
    [(1, 1), (2, 10), (3, 7), (4, 4)],  # Mesham, Rishabam, Mithunam, Kadagam at 0 deg
)
def test_faa01_navamsa_lagna_start_signs(lagna_rasi: int, expected_d9: int) -> None:
    assert navamsa_rasi_from_degree((lagna_rasi - 1) * 30.0) == expected_d9


# ── FAA-24: eclipse birth only when an eclipse actually happened ─────────────
# Gate verified 2026-11-11: the old syzygy/node-orb detector (HEAD 34aaba4b)
# flags the +20 h case as SOLAR and the penumbral-only case as LUNAR; it does NOT
# flag the plain new moon (Sun 30 deg off the node), so that test is a guard for
# the new code, not a regression proof. BLIND SPOT: visibility is judged at the birth
# instant only, not "visible at some point of the eclipse".
def _jd(*args: int) -> float:
    return utc_datetime_to_julian_day(datetime(*args, tzinfo=UTC))


def test_faa24_total_solar_eclipse_visible_and_not_visible() -> None:
    from app.calculations.ephemeris import eclipse_at_birth

    dallas = eclipse_at_birth(_jd(2024, 4, 8, 18, 17), 32.78, -96.80)
    assert dallas is not None and dallas.kind == "SOLAR" and dallas.magnitude == "TOTAL"
    assert dallas.visible_at_place is True
    chennai = eclipse_at_birth(_jd(2024, 4, 8, 18, 17), CHENNAI[0], CHENNAI[1])
    assert chennai is not None and chennai.visible_at_place is False


def test_faa24_birth_twenty_hours_from_eclipse_is_not_flagged() -> None:
    from app.calculations.ephemeris import eclipse_at_birth

    assert eclipse_at_birth(_jd(2024, 4, 9, 14, 17), CHENNAI[0], CHENNAI[1]) is None


def test_faa24_new_moon_without_eclipse_is_not_flagged() -> None:
    from app.calculations.ephemeris import eclipse_at_birth

    assert eclipse_at_birth(_jd(2024, 5, 8, 3, 22), CHENNAI[0], CHENNAI[1]) is None


def test_faa24_lunar_eclipse_visibility_by_place() -> None:
    from app.calculations.ephemeris import eclipse_at_birth

    seen = eclipse_at_birth(_jd(2025, 9, 7, 18, 12), CHENNAI[0], CHENNAI[1])
    assert seen is not None and seen.kind == "LUNAR" and seen.magnitude == "TOTAL"
    assert seen.visible_at_place is True
    unseen = eclipse_at_birth(_jd(2025, 9, 7, 18, 12), 40.71, -74.0)  # New York, daytime
    assert unseen is not None and unseen.visible_at_place is False


def test_faa24_penumbral_only_lunar_eclipse_is_not_grahana() -> None:
    from app.calculations.ephemeris import eclipse_at_birth

    assert eclipse_at_birth(_jd(2024, 3, 25, 7, 13), CHENNAI[0], CHENNAI[1]) is None


# ── FAA-27: Pitru dosham with the 9th lord missing ───────────────────────────
def test_faa27_pitru_missing_ninth_lord_is_incomplete_not_a_crash() -> None:
    from app.calculations._yoga_dosham import detect_pitru_dosham

    # Simha lagna: 9th = Mesham, whose lord MARS is absent here. Before the fix
    # this raised ValueError("Missing rasi for MARS").
    planets = {"SUN": 1, "SATURN": 3, "RAHU": 5, "KETU": 11, "JUPITER": 7}
    result = detect_pitru_dosham(planets, lagna_rasi=5)
    assert result.label == "INCOMPLETE_DATA"
    assert "MARS" in result.missing_data


# ── FAA-26: nishita is the 8th night muhurta, not civil 00:00 ─────────────────
def test_faa26_nishita_interval_is_eighth_of_fifteen() -> None:
    from app.calculations.panchangam import nishita_interval_jd

    start, end = nishita_interval_jd(100.0, 100.5)  # a 12-hour night
    assert start == pytest.approx(100.0 + 7 * 0.5 / 15)
    assert end == pytest.approx(100.0 + 8 * 0.5 / 15)
    assert (start + end) / 2 == pytest.approx(100.25)  # centred on the midpoint


def _hindu_names(d: date) -> set[str]:
    from app.services.panchangam_cache import calculate_daily_panchangam
    from app.services.panchangam_service import _build_festivals

    snap = calculate_daily_panchangam(d, *CHENNAI)
    return {f.name for f in _build_festivals(snap) if f.category == "hindu"}


def test_faa26_chaturdashi_touching_nishita_names_the_night() -> None:
    # Masa Sivarathiri 19 Jul 2020 (Drik Panchang): Chaturdashi ended 00:10 on
    # the 20th, inside nishita but before its centre. A centre-instant test
    # finds no night in that month at all.
    # Gate verified 2026-11-11: with `nishita_touches_k_chaturdashi` left None
    # (centre-only fallback) this fails. BLIND SPOT: one lunar month pinned;
    # the 2037-06-11 and 2045-02-14 moves are unverified against print.
    assert "Masa Sivarathiri" in _hindu_names(date(2020, 7, 19))
    assert "Masa Sivarathiri" not in _hindu_names(date(2020, 7, 18))
    assert "Masa Sivarathiri" not in _hindu_names(date(2020, 7, 20))


# ── FAA-22 / FAA-23: synastry copy ───────────────────────────────────────────
def test_faa22_marriage_note_names_real_poruthams() -> None:
    from app.services.synastry_service import _CONTEXT_NOTE

    note = _CONTEXT_NOTE["MARRIAGE"]
    assert "Sthira" not in note["en"] and "ஸ்தீர" not in note["ta"]
    assert "Rajju" in note["en"] and "ரஜ்ஜு" in note["ta"]


def test_faa23_transit_alert_is_tamil_script_and_names_roles() -> None:
    import re
    from types import SimpleNamespace

    from app.services import synastry_service as ss

    def snap(planets: dict[str, float]) -> SimpleNamespace:
        return SimpleNamespace(data=SimpleNamespace(planets=[
            SimpleNamespace(graha=g, absolute_longitude=d) for g, d in planets.items()
        ]))

    chart_a = snap({"VENUS": 0.0, "MOON": 120.0})
    chart_b = snap({"VENUS": 200.0, "MOON": 300.0})
    hits = ss.check_transit_activation(chart_a, chart_b, {"SATURN": SimpleNamespace(absolute_longitude=0.5)})
    assert hits
    for hit in hits:
        # Gate verified 2026-11-11: the old romanised string fails both checks.
        assert not re.search(r"[A-Za-z]", hit.message_ta), hit.message_ta
        assert not re.search(r"\b[AB] (VENUS|MOON)\b", hit.message_en), hit.message_en
        assert "your" in hit.message_en


# ── FAA-14: one gandanta boundary for score and card ─────────────────────────
# Gate verified 2026-11-11: on HEAD's code the sweep fails (the card called
# 3°20′–5° "MILD" gandanta while the score did not). BLIND SPOT: checks the two
# functions agree; a third gandanta test elsewhere would not be seen.
def test_faa14_score_and_card_agree_on_every_degree() -> None:
    from app.calculations.nakshatra_analysis import gandanta_detail
    from app.calculations.transits import is_gandanta

    for junction in (0.0, 120.0, 240.0):
        for step in range(0, 61):  # 0° to 6° in 0.1° steps
            for side in (-1, 1):
                lon = (junction + side * step / 10) % 360.0
                card = gandanta_detail({"X": lon})["X"]
                assert card["is_gandanta"] == is_gandanta(lon), (junction, side, step)


def test_faa14_near_band_is_not_called_gandanta() -> None:
    from app.calculations.nakshatra_analysis import gandanta_detail

    near = gandanta_detail({"X": 124.0})["X"]  # 4° Simmam
    assert near == {"is_gandanta": False, "zone": "KATAKA_SIMHA", "intensity": "NEAR"}
    assert gandanta_detail({"X": 359.5})["X"]["intensity"] == "DEEP"   # 30′ before Mesham
    assert gandanta_detail({"X": 2.0})["X"]["intensity"] == "MODERATE"
    assert gandanta_detail({"X": 130.0})["X"]["intensity"] is None


# ── FAA-10: one star contribution per muhurta day ────────────────────────────
# Gate verified 2026-11-11: on HEAD the day-quality factor contributes +20 on
# every subha day, so this fails. BLIND SPOT: the activity layer (L2) may still
# add its own chapter star bonus; that is a different, sourced claim.
def test_faa10_day_quality_never_scores_the_star_again() -> None:
    from datetime import date, timedelta

    from app.calculations.muhurta_engine import score_day
    from app.calculations.panchangam import compute_daily_panchangam

    seen_subha = False
    for i in range(40):
        snap = compute_daily_panchangam(date(2026, 3, 1) + timedelta(days=i), *CHENNAI)
        result = score_day(snap, "MARRIAGE")
        factors = {f.factor: f for f in result.factors}
        if "ALMANAC_DAY_QUALITY" in factors:
            assert factors["ALMANAC_DAY_QUALITY"].contribution == 0.0
            seen_subha = seen_subha or snap.is_subha_muhurtham
    assert seen_subha, "fixture window held no subha day; widen it"


# ── FAA-17: marriage timing window is the running antardasha ─────────────────
# Gate verified 2026-11-11: on HEAD every path ends the window on 31 December.
def _marriage_payload(**kw):
    from app.services import marriage_service as svc

    base = dict(
        as_of=date(2030, 3, 1), lagna_rasi=4,
        planets_rasi={"SUN": 1, "MOON": 4, "MARS": 6, "MERCURY": 2, "JUPITER": 9,
                      "VENUS": 3, "SATURN": 11, "RAHU": 5, "KETU": 11},
        active_dasha_lords={"VENUS", "MOON"}, transit_jupiter_rasi=10, transit_venus_rasi=10,
        age=30, maha_lord="VENUS", antar_lord="MOON",
    )
    base.update(kw)
    return svc.MarriageAssessmentInput(**base)


def test_faa17_window_follows_the_antardasha() -> None:
    from app.services.marriage_service import assess_marriage_prediction

    a = assess_marriage_prediction(_marriage_payload(antar_end=date(2031, 8, 9)), use_reasoning_gate=False)
    b = assess_marriage_prediction(_marriage_payload(antar_end=date(2032, 2, 1)), use_reasoning_gate=False)
    assert (a.timing_window_end, b.timing_window_end) == (date(2031, 8, 9), date(2032, 2, 1))
    none = assess_marriage_prediction(_marriage_payload(), use_reasoning_gate=False)
    assert none.timing_window_start is None and none.timing_window_end is None
    minor = assess_marriage_prediction(_marriage_payload(age=12, antar_end=date(2031, 8, 9)))
    assert minor.timing_window_end is None


# ── FAA-20: a neutral Venus is not "support" ─────────────────────────────────
def test_faa20_neutral_venus_is_neither_support_nor_challenge() -> None:
    from app.services.marriage_service import assess_marriage_prediction

    # Venus in Mithunam (3): not own, exalted or debilitated; not combust.
    r = assess_marriage_prediction(_marriage_payload(antar_end=date(2031, 1, 1)), use_reasoning_gate=False)
    venus = next(f for f in r.astrological_factors if f.key == "venus_strength")
    assert venus.status == "NEUTRAL"
    assert all("Venus offers support" not in s.en for s in r.supports)
    assert all("Venus strength is reduced" not in c.en for c in r.challenges)


# ── FAA-21: non-marriage readings do not depend on who was entered first ─────
# Gate verified 2026-11-11: without `reverse_result` the totals differ for
# many pairs. BLIND SPOT: Nadi / eka-nakshatra notes are not compared.
@pytest.mark.parametrize("context", ["FRIENDSHIP", "BUSINESS", "FAMILY", "GENERAL"])
def test_faa21_swapping_a_and_b_changes_no_verdict(context: str) -> None:
    from app.calculations.porutham import compute_porutham
    from app.services.synastry_service import _contextualize_porutham_result

    def rasi(nak: int) -> int:
        return ((nak - 1) * 4) // 9 + 1  # pada 1 of the star

    for a in range(1, 28):
        for b in range(1, 28):
            ab = compute_porutham(boy_nakshatra=a, girl_nakshatra=b, boy_rasi=rasi(a), girl_rasi=rasi(b))
            ba = compute_porutham(boy_nakshatra=b, girl_nakshatra=a, boy_rasi=rasi(b), girl_rasi=rasi(a))
            one = _contextualize_porutham_result(ab, context, reverse_result=ba)
            two = _contextualize_porutham_result(ba, context, reverse_result=ab)
            assert (one["total_score"], one["label"]) == (two["total_score"], two["label"]), (a, b)


# ── FAA-19 (Group A half): 2nd/3rd are not dusthanas ─────────────────────────
def test_faa19_seventh_lord_in_second_is_not_called_challenging() -> None:
    from app.services.marriage_service import assess_marriage_prediction

    # Kadagam lagna: the 7th lord is Saturn; put it in Simmam (the 2nd).
    r = assess_marriage_prediction(
        _marriage_payload(planets_rasi={"SUN": 1, "MOON": 4, "MARS": 6, "MERCURY": 2, "JUPITER": 9,
                                        "VENUS": 3, "SATURN": 5, "RAHU": 5, "KETU": 11},
                          antar_end=date(2031, 1, 1)),
        use_reasoning_gate=False,
    )
    texts = [c.en for c in r.challenges] + [f.detail.en for f in r.astrological_factors]
    assert not any("challenging house" in t or "dusthana" in t for t in texts)


def test_faa19_prasna_second_house_is_a_maraka_label() -> None:
    import inspect

    from app.calculations import prasna

    src = inspect.getsource(prasna)
    assert "in the 2nd house (a maraka sthana)" in src


# ── FAA-11: curated naal Tamil date == engine Tamil date ─────────────────────
# Gate verified 2026-11-11: reading the stored row fields instead, 47 of 129
# rows differ. BLIND SPOT: Chennai reference only, as the calendar page.
def test_faa11_naal_tamil_date_matches_the_calendar() -> None:
    from app.calculations.tamil_calendar import tamil_solar_date
    from app.data.muhurtham_naals import MUHURTHAM_NAALS_BY_YEAR
    from app.services.muhurtham_naal_service import _to_view

    for year in (2026, 2027):
        for n in MUHURTHAM_NAALS_BY_YEAR[year]:
            view = _to_view(n, nalla_neram=[])
            month, day = tamil_solar_date(n.date, "Asia/Kolkata", 13.0827, 80.2707)
            assert view.tamil_day == day, n.date
    # The audit's named rows: published Aani 1 = 15 Jun 2026, Aavani 1 = 18 Aug.
    by_date = {n.date: n for n in MUHURTHAM_NAALS_BY_YEAR[2026]}
    assert _to_view(by_date[date(2026, 6, 17)], nalla_neram=[]).tamil_day == 3
    assert _to_view(by_date[date(2026, 8, 23)], nalla_neram=[]).tamil_day == 6


# ── FAA-18: fast planets are read over the window, not on 1 July ─────────────
# Gate verified 2026-11-11: HEAD reads only the anchor day, so a Venus that
# enters the house in October never counted. BLIND SPOT: 5-day sampling.
def test_faa18_venus_in_house_later_in_the_window_counts() -> None:
    from app.calculations.event_windows import _fast_planet_in_house_during, _rasi_on

    october = _rasi_on("VENUS", date(2030, 10, 15))
    assert _rasi_on("VENUS", date(2030, 7, 1)) != october  # precondition
    assert _fast_planet_in_house_during("VENUS", october, date(2030, 1, 1), date(2030, 12, 31))
    assert not _fast_planet_in_house_during("VENUS", october, date(2030, 7, 1), date(2030, 7, 10))


# ── FAA-08: each surface names its hora system ───────────────────────────────
def test_faa08_hora_systems_are_labelled_and_differ() -> None:
    from app.schemas.panchangam import PanchangamTimingsData
    from app.schemas.shadbala import ShadbalaData

    pan = PanchangamTimingsData.model_fields["hora_system"].default
    sha = ShadbalaData.model_fields["hora_system"].default
    assert pan == "EQUAL_60_MIN_FROM_SUNRISE"
    assert sha == "CLASSICAL_UNEQUAL_DAY_NIGHT_TWELFTHS"


# ── FAA-06 / §8.2: a tara scored on two surfaces has one sign ────────────────
# Gate verified 2026-11-11: fails on HEAD at k=1 (Janma -20 vs +8). BLIND SPOT:
# signs only; magnitudes may differ by ruling A-11.
@pytest.mark.parametrize("k", range(1, 10))
def test_faa06_tara_polarity_agrees_between_today_and_picker(k: int) -> None:
    from app.calculations.tara_bala import TARA_SCORE
    from app.services._dg_scoring import TARA_DELTA

    def sign(x: float) -> int:
        return (x > 0) - (x < 0)

    assert sign(TARA_DELTA[k]) == sign(TARA_SCORE[k])


# ── FAA-07: the picker prices what the badge calls caution ───────────────────
# Gate verified 2026-11-11: on HEAD the yoga factor is always 0 and there is no
# Vishti factor, so both assertions fail. BLIND SPOT: one 60-day window.
def test_faa07_ashubha_yoga_and_vishti_are_priced() -> None:
    from datetime import timedelta

    from app.calculations.muhurta_engine import score_day
    from app.calculations.panchangam import ASHUBHA_YOGA_NUMBERS, compute_daily_panchangam

    saw_yoga = saw_vishti = False
    for i in range(60):
        snap = compute_daily_panchangam(date(2026, 4, 1) + timedelta(days=i), *CHENNAI)
        factors = {f.factor: f for f in score_day(snap, "MARRIAGE").factors}
        # A stretch over a twentieth of the day rounds to at least -1.
        if sum(s.fraction for s in snap.yoga_spans or [] if s.number in ASHUBHA_YOGA_NUMBERS) > 0.06:
            assert factors["ALMANAC_YOGA"].contribution < 0
            saw_yoga = True
        if sum(s.fraction for s in snap.karana_spans or [] if s.name == "VISHTI") > 0.06:
            assert factors["ALMANAC_VISHTI"].contribution < 0
            saw_vishti = True
    assert saw_yoga and saw_vishti


# ── FAA-15: one activity-keyed Amavasai rule ─────────────────────────────────
def test_faa15_amavasai_reads_one_table_on_every_surface() -> None:
    from app.calculations.panchangam import AMAVASAI_BY_ACTIVITY, AMAVASAI_NOTE_EN, _day_block_reason
    from app.services._dg_scoring import _tithi_penalty

    assert AMAVASAI_BY_ACTIVITY == {
        "PITRU_KARMA": "FAVOURABLE", "NEW_AUSPICIOUS_WORK": "AVOID", "DAILY_SCORE": "NEUTRAL",
    }
    # Badge: blocked for new work, but not called "Inauspicious".
    reason = _day_block_reason(30, 2)  # a Wednesday Amavasai
    assert reason == AMAVASAI_NOTE_EN and "Inauspicious" not in reason
    # Today: neutral.
    from types import SimpleNamespace
    assert _tithi_penalty(SimpleNamespace(number=30)) == 0.0


# ── FAA-12: Venus-Venus reads the §10 table ──────────────────────────────────
def test_faa12_venus_harmony_uses_the_ruled_table() -> None:
    from types import SimpleNamespace

    from app.calculations import compatibility_intelligence as ci

    def snap(moon: int, venus: int) -> SimpleNamespace:
        planets = [
            SimpleNamespace(graha="MOON", rasi=moon, house_from_lagna=1, absolute_longitude=(moon - 1) * 30.0 + 1),
            SimpleNamespace(graha="VENUS", rasi=venus, house_from_lagna=1, absolute_longitude=(venus - 1) * 30.0 + 1),
            SimpleNamespace(graha="MARS", rasi=1, house_from_lagna=1, absolute_longitude=1.0),
        ]
        return SimpleNamespace(data=SimpleNamespace(planets=planets))

    for d, expected in ((0, "GOOD"), (1, "MIXED"), (4, "STRONG"), (5, "TENSE")):
        out = ci._compute_emotional_compatibility(snap(1, 1), snap(1, 1 + d))
        assert out.venus_mars_harmony == expected, d


# ── Sivarathiri pradosha fallback (owner ruling 2026-11-11) ──────────────────
@pytest.mark.parametrize(("pradosha", "expected"), [(29, True), (28, False)])
def test_sivarathiri_falls_back_to_pradosha_when_no_nishita_qualifies(pradosha: int, expected: bool) -> None:
    from app.calculations.festivals import ObservanceInstants, _recurring_tithi_festivals

    names = {f["name"] for f in _recurring_tithi_festivals(
        tithi_number=29, tithi_paksha="KRISHNA", nakshatra_name="MOOLAM", weekday="MONDAY",
        tamil_month_index=5, special_tithi_day_number=None, pradhosham_tithi_number=pradosha,
        nishita_tithi_number=30, lunar_month_index=4,
        instants=ObservanceInstants(nishita_touches_k_chaturdashi=False,
                                    previous_nishita_touches_k_chaturdashi=False),
        day=date(2031, 10, 1),
    )}
    assert ("Masa Sivarathiri" in names) is expected


# ── Sivarathiri two touching nights (owner ruling 2026-11-11) ───────────────
# Partial first night + whole second night → the second. Whole first night, or
# both whole → the first (unchanged). Synthetic instants; the 2045-02 case is
# the real-ephemeris instance (14 Feb partial, 15 Feb whole).
def _siv_names(**instants) -> set[str]:
    from app.calculations.festivals import ObservanceInstants, _recurring_tithi_festivals

    return {f["name"] for f in _recurring_tithi_festivals(
        tithi_number=28, tithi_paksha="KRISHNA", nakshatra_name="MOOLAM", weekday="MONDAY",
        tamil_month_index=5, special_tithi_day_number=None, pradhosham_tithi_number=28,
        nishita_tithi_number=29, lunar_month_index=4,
        instants=ObservanceInstants(**instants), day=date(2031, 10, 1),
    )}


@pytest.mark.parametrize(
    ("first_full", "second_full", "first_night", "second_night"),
    [(False, True, False, True), (True, False, True, False), (True, True, True, False)],
)
def test_sivarathiri_partial_first_night_yields_to_whole_second(
    first_full: bool, second_full: bool, first_night: bool, second_night: bool
) -> None:
    night1 = _siv_names(
        nishita_touches_k_chaturdashi=True, previous_nishita_touches_k_chaturdashi=False,
        nishita_k_chaturdashi_full=first_full, next_nishita_k_chaturdashi_full=second_full,
    )
    night2 = _siv_names(
        nishita_touches_k_chaturdashi=True, previous_nishita_touches_k_chaturdashi=True,
        previous_nishita_k_chaturdashi_full=first_full, nishita_k_chaturdashi_full=second_full,
    )
    assert ("Masa Sivarathiri" in night1) is first_night
    assert ("Masa Sivarathiri" in night2) is second_night


def test_sivarathiri_two_night_rule_on_real_ephemeris() -> None:
    # 29 Apr 2022: Drik Panchang (New Delhi page, fetched 2026-11-11) dates Masik
    # Shivaratri on the 29th; Chaturdashi began 00:26 on the 29th, so the 28th's
    # nishita was only partly covered. Same shape in Feb 2045 (Chaturdashi from
    # 00:20 on the 15th). The 26-year scan (2020–2045) moved exactly these and
    # 2037-03-14 → 15; the 2027 almanac still matches 13/13.
    # BLIND SPOT: 2045 and 2037 rest on the rule plus one web listing, not print.
    assert "Masa Sivarathiri" in _hindu_names(date(2022, 4, 29))
    assert "Masa Sivarathiri" not in _hindu_names(date(2022, 4, 28))
    assert "Sivarathiri" in _hindu_names(date(2045, 2, 15))
    assert "Sivarathiri" not in _hindu_names(date(2045, 2, 14))


def test_faa19_seventh_lord_in_second_scores_zero() -> None:
    from app.services.marriage_service import assess_marriage_prediction

    r = assess_marriage_prediction(
        _marriage_payload(planets_rasi={"SUN": 1, "MOON": 4, "MARS": 6, "MERCURY": 2, "JUPITER": 9,
                                        "VENUS": 3, "SATURN": 5, "RAHU": 5, "KETU": 11},
                          antar_end=date(2031, 1, 1)),
        use_reasoning_gate=False,
    )
    factor = next(f for f in r.astrological_factors if f.key == "seventh_lord_placement")
    assert factor.status == "NEUTRAL"


# ── FAA-16: spouse karaka by stated gender ───────────────────────────────────
# Gate verified 2026-11-11: on HEAD the gate reads Venus for everyone, so the
# bride fixture is gated on a debilitated Venus and no Guru line exists.
# BLIND SPOT: prasna and the two-chart CI strength still read Venus only.
_BASE_PLANETS = {"SUN": 1, "MOON": 4, "MARS": 6, "MERCURY": 2, "SATURN": 11, "RAHU": 5, "KETU": 11}


def test_faa16_bride_with_exalted_guru_passes_the_gate() -> None:
    from app.reasoning.promise_gate import GateGrade
    from app.services.marriage_service import _marriage_promise_gate, assess_marriage_prediction

    p = _marriage_payload(planets_rasi={**_BASE_PLANETS, "JUPITER": 4, "VENUS": 6},
                          gender="female", antar_end=date(2031, 1, 1))
    assert _marriage_promise_gate(p).grade is not GateGrade.BLOCKED
    lines = {f.key: f for f in assess_marriage_prediction(p, use_reasoning_gate=False).astrological_factors}
    assert "primary spouse significator" in lines["jupiter_strength"].detail.en
    assert "secondary spouse significator" in lines["venus_strength"].detail.en
    assert lines["jupiter_strength"].status == "SUPPORT"
    assert lines["venus_strength"].status == "CAUTION"


def test_faa16_groom_mirror_reads_venus_first() -> None:
    from app.services.marriage_service import _spouse_karakas, assess_marriage_prediction

    p = _marriage_payload(planets_rasi={**_BASE_PLANETS, "JUPITER": 10, "VENUS": 12},
                          gender="male", antar_end=date(2031, 1, 1))
    assert _spouse_karakas(p)[0][0] == "VENUS"
    lines = {f.key: f for f in assess_marriage_prediction(p, use_reasoning_gate=False).astrological_factors}
    assert "primary spouse significator" in lines["venus_strength"].detail.en
    assert "secondary spouse significator" in lines["jupiter_strength"].detail.en
    assert "jupiter_strength" in lines


@pytest.mark.parametrize("gender", [None, "not_specified", "other"])
def test_faa16_unknown_gender_reads_both_and_says_so(gender) -> None:
    from app.services.marriage_service import assess_marriage_prediction

    p = _marriage_payload(planets_rasi={**_BASE_PLANETS, "JUPITER": 9, "VENUS": 3},
                          gender=gender, antar_end=date(2031, 1, 1))
    keys = {f.key for f in assess_marriage_prediction(p, use_reasoning_gate=False).astrological_factors}
    assert {"venus_strength", "jupiter_strength", "gender_not_given"} <= keys


# ── Kalaprakasika porutham (owner rulings 2026-11-11) ────────────────────────
# Gate verified 2026-11-11: on HEAD Deva-Manushya scored 1.0, Yoni had no
# Madhyama label, Uthiradam was Mongoose, and the eka classification was None.
def test_kp_gana_grades() -> None:
    from app.calculations.porutham import GRADE_ADHAMA, GRADE_MADHYAMA, GRADE_UTTAMA, _ganam_band

    assert _ganam_band(1, 1) == GRADE_UTTAMA          # Ashwini x Ashwini, both Deva
    assert _ganam_band(1, 2) == GRADE_MADHYAMA        # groom Deva, bride Manushya
    assert _ganam_band(2, 1) == GRADE_MADHYAMA        # reverse, ruled the same
    # Groom Krittika (Rakshasa, 3), bride Ashwini (Deva, 1): bride is the 26th
    # from the groom, beyond the 14th -> diminished to Madhyama.
    assert _ganam_band(3, 1) == GRADE_MADHYAMA
    # Groom Ashwini (Deva), bride Krittika (Rakshasa): 3rd -> Adhama.
    assert _ganam_band(1, 3) == GRADE_ADHAMA


def test_kp_yoni_table_and_grades() -> None:
    from app.calculations.porutham import (
        GRADE_ADHAMA,
        GRADE_MADHYAMA,
        GRADE_UTTAMA,
        YONI_BY_NAKSHATRA,
        _yoni_band,
        _yoni_score,
    )

    assert YONI_BY_NAKSHATRA[21] == YONI_BY_NAKSHATRA[12] == 8   # Uthiradam is a Cow
    assert _yoni_band(1, 24) == GRADE_UTTAMA                      # Ashwini/Sathayam, both Horse
    assert _yoni_band(17, 2) == GRADE_ADHAMA                      # Deer (Anusham) vs Elephant (Bharani)
    assert _yoni_band(4, 10) == GRADE_ADHAMA                      # Serpent (Rohini) vs Rat (Magam)
    assert _yoni_band(2, 23) == GRADE_MADHYAMA                    # Elephant vs Lion: no longer hostile
    assert _yoni_score(2, 23) == 1                                # neutral keeps the full point


def test_kp_eka_nakshatra_classes() -> None:
    from app.calculations.porutham import EKA_NAKSHATRA_CLASS, eka_nakshatra_assessment

    assert sorted(EKA_NAKSHATRA_CLASS) == list(range(1, 28))
    counts = {c: list(EKA_NAKSHATRA_CLASS.values()).count(c) for c in ("EXCELLENT", "NEUTRAL", "UNSUITABLE")}
    assert counts == {"EXCELLENT": 8, "NEUTRAL": 11, "UNSUITABLE": 8}
    note = eka_nakshatra_assessment(4, 4, 1, 2, pada_known=True)   # Rohini
    assert note.classification == "EXCELLENT" and note.rajju_exception_applied is False
    assert "Kalaprakasika" in note.note_en


# ── Five protections (owner, 2026-11-11) ─────────────────────────────────────
def test_protect_1_rasi_is_directional_at_6th_and_8th() -> None:
    from app.calculations.porutham import _rasi_score

    # Bride Rishabam (2), groom Thulaam (7): 6th from the bride, not one of
    # Kalaprakasika's six pairs -> fails. Swap them: 8th -> the favourable converse.
    assert _rasi_score(rasi_boy=7, rasi_girl=2) == 0
    assert _rasi_score(rasi_boy=2, rasi_girl=7) == 1


@pytest.mark.parametrize(
    ("groom", "bride", "band"),
    [
        (14, 27, "ADHAMA"),    # groom Chithirai (Rakshasa), bride Revathi (Deva): exactly 14th -> not beyond
        (14, 1, "MADHYAMA"),   # bride Ashwini: 15th, counted across Revathi -> Ashwini
        (1, 14, "ADHAMA"),     # roles swapped: bride Chithirai is the 14th from groom Ashwini
    ],
)
def test_protect_2_gana_exception_counts_bride_from_groom(groom: int, bride: int, band: str) -> None:
    from app.calculations.porutham import GANA_BY_NAKSHATRA, _ganam_band

    assert 3 in (GANA_BY_NAKSHATRA[groom], GANA_BY_NAKSHATRA[bride])  # a Rakshasa mix
    assert _ganam_band(groom, bride) == band


def test_protect_3_yoni_label_never_changes_the_score() -> None:
    from app.calculations.porutham import compute_porutham

    # Bharani (Elephant) x Avittam (Lion): different, not hostile -> neutral.
    r = compute_porutham(boy_nakshatra=2, girl_nakshatra=23, boy_rasi=1, girl_rasi=10)
    yoni = next(k for k in r.kutas if k.name == "Yoni")
    assert yoni.grade == "MADHYAMA" and yoni.score == 1 and yoni.passed


def test_protect_4_same_star_never_overrides_rajju() -> None:
    from app.calculations.porutham import compute_porutham, eka_nakshatra_assessment

    # Rohini x Rohini: Kalaprakasika's "excellent" same star; same Rajju group.
    r = compute_porutham(boy_nakshatra=4, girl_nakshatra=4, boy_rasi=2, girl_rasi=2)
    assert r.rajju_dosha is True and r.label == "CAUTION"
    note = eka_nakshatra_assessment(4, 4, 1, 2, pada_known=True)
    assert note.classification == "EXCELLENT" and note.rajju_exception_applied is False


def test_protect_5_every_rule_names_its_source_and_conflicts_are_explicit() -> None:
    from app.calculations.porutham import (
        EKA_NAKSHATRA_CLASS,
        PORUTHAM_PROVENANCE,
        PORUTHAM_RULED_DEPARTURES,
        PORUTHAM_SOURCE_CONFLICTS,
        compute_porutham,
    )

    kutas = {k.name for k in compute_porutham(boy_nakshatra=1, girl_nakshatra=5, boy_rasi=1, girl_rasi=2).kutas}
    assert kutas <= set(PORUTHAM_PROVENANCE)
    # Resolving a conflict is a deliberate edit to these sets, never a silent drift.
    # Dinam and Graha Maitri were ruled 2026-11-11 to follow Tamil Nadu practice.
    assert set(PORUTHAM_SOURCE_CONFLICTS) == set()
    assert set(PORUTHAM_RULED_DEPARTURES) == {"Dinam", "Graha Maitri"}
    for name, (source, _citation) in PORUTHAM_PROVENANCE.items():
        if source != "KALAPRAKASIKA":
            assert source == "TAMIL_PRACTICE", name
            assert name in PORUTHAM_RULED_DEPARTURES or name in PORUTHAM_SOURCE_CONFLICTS, name
    # Each departure names the reading it did not adopt.
    for text in PORUTHAM_RULED_DEPARTURES.values():
        assert "Kalaprakasika" in text and "Not adopted" in text
    # No merged lists: Anusham is neutral in Kalaprakasika, though a calendar
    # website calls it excellent.
    assert EKA_NAKSHATRA_CLASS[17] == "NEUTRAL"


# ── Vasya Rishabam row and the p.76 classical exception (owner, 2026-11-11) ──
def test_vasya_rishabam_row_is_kalaprakasika() -> None:
    from app.calculations.porutham import _VASYA

    assert _VASYA[2] == frozenset({4, 5})  # Kadagam, Simmam (p.75, scan-checked)


def test_p76_exception_is_shown_separately_and_never_changes_the_result() -> None:
    from app.calculations.porutham import compute_porutham

    # Every star pair (pada-1 rasi): the note appears exactly when one of the
    # four faults failed, never alters a finding, and both outcomes occur.
    found_applicable = found_not = False
    for b in range(1, 28):
        for g in range(1, 28):
            rb, rg = ((b - 1) * 4) // 9 + 1, ((g - 1) * 4) // 9 + 1
            r = compute_porutham(boy_nakshatra=b, girl_nakshatra=g, boy_rasi=rb, girl_rasi=rg)
            ex = r.classical_exception
            failed = {k.name for k in r.kutas if k.grade == "ADHAMA"} & {"Rajju", "Vedha", "Ganam", "Rasi"}
            assert ex.present is bool(failed)
            if not failed:
                continue
            # The original findings stand whatever the exception says.
            assert r.rajju_dosha == ("Rajju" in failed)
            if r.rajju_dosha or r.vedha_dosha:
                assert r.label == "CAUTION"
            assert ex.pending_verification is True and ex.source == "Kalaprakasika p.76"
            if ex.applicable:
                found_applicable = True
                assert ex.conditions_met and "தோஷம் நீங்கிவிட்டது" not in ex.note_ta
            else:
                found_not = True
                assert "does not apply" in ex.note_en
            assert not ({"SAME_LORD", "OPPOSITE_RASIS"} <= set(ex.conditions_met))  # never both
    assert found_applicable and found_not


def test_tamil_practice_dinam_list_is_kept() -> None:
    """Ruled 2026-11-11: Dinam follows the Tamil panchangam 12-count list, not
    Kalaprakasika p.69's tara cycle (which would also pass 10, 17, 19, 21, 23, 25)."""
    from app.calculations.porutham import _DINAM_GOOD_COUNTS, _dinam_score

    assert _DINAM_GOOD_COUNTS == frozenset({2, 4, 6, 8, 9, 11, 13, 15, 18, 20, 24, 26})
    girl = 1
    for count in (10, 17, 19, 21, 23, 25):
        assert _dinam_score(girl + count - 1, girl) == 0, count


def test_exception_friendship_never_contradicts_rasiyathipathi() -> None:
    """One friendship table per reading (ruled 2026-11-11). For every pair of
    moon signs, the p.76 note may call the lords friendly only when the
    Rasiyathipathi row passes them. Built on the book's p.74-75 table it failed
    on Moon–Mercury: friends in the note, enemies in the row.

    Blind spot: proves agreement with the row, not that the Parashari table is
    what a given family's jothidar uses; that is the ruling, not the gate.
    """
    from app.calculations.porutham import compute_porutham

    # A shared star fails Rajju, so the note is always present and its
    # friendship condition is always evaluated; the rasis are passed separately.
    n = 1
    contradictions = []
    for rb in range(1, 13):
        for rg in range(1, 13):
            r = compute_porutham(boy_nakshatra=n, girl_nakshatra=n, boy_rasi=rb, girl_rasi=rg)
            ex = r.classical_exception
            assert ex.present
            maitri = next(k for k in r.kutas if k.name == "Graha Maitri")
            if "FRIENDLY_LORDS" in ex.conditions_met and not maitri.passed:
                contradictions.append((rb, rg))
    assert contradictions == []
    # Kataka (Moon) x Mithuna (Mercury): Mercury counts Moon an enemy, so neither
    # the row nor the note calls them friendly.
    r = compute_porutham(boy_nakshatra=n, girl_nakshatra=n, boy_rasi=4, girl_rasi=3)
    assert "FRIENDLY_LORDS" not in r.classical_exception.conditions_met
