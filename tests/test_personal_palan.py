"""Personal palan (proposal §5): one verdict source, full content coverage,
Chandrashtama precedence, tara never reverses a line, and safe health wording."""
from __future__ import annotations

import re
from datetime import date

import pytest

from app.services import personal_palan as pp

LABELS = ("STRONG_SUPPORT", "GOOD", "BALANCED", "CAUTION", "RESTORATIVE")


def _build(*, house: int = 1, tara: int = 2, label: str = "BALANCED", chandrashtama: bool = False, weekday: str = "MARS"):
    janma_star = 1
    return pp.build_personal_palan(
        on_date=date(2026, 9, 23),
        natal_moon_rasi=1,
        janma_nakshatra=janma_star,
        day_moon_rasi=house,  # natal Moon in rasi 1, so house == rasi
        day_nakshatra=((janma_star - 1 + tara - 1) % 27) + 1,
        weekday_lord=weekday,
        label=label,
        is_chandrashtama=chandrashtama,
    )


def test_matrix_is_complete():
    assert sorted(pp._MATRIX) == list(range(1, 13))
    for row in pp._MATRIX.values():
        assert len(row) == len(pp.AREAS)
    for area in pp.AREAS:
        if area != "MIND":
            assert set(pp._AREA_TEXT[area]) == {"FAVOURABLE", "MIXED", "CAUTION"}
        assert area in pp._ADVICE_CAUTION and area in pp._ADVICE_OPPORTUNITY
        assert area in pp._STRENGTH and area in pp._WATCH


@pytest.mark.parametrize("label", LABELS)
def test_overall_follows_the_hero_label_only(label):
    expected = {"STRONG_SUPPORT": "FAVOURABLE", "GOOD": "FAVOURABLE", "BALANCED": "MIXED"}.get(label, "CAUTION")
    for house in range(1, 13):
        for tara in range(1, 10):
            assert _build(house=house, tara=tara, label=label).overall_polarity == expected


def test_basis_names_the_computed_house_and_tara():
    palan = _build(house=11, tara=6)
    assert (palan.moon_house, palan.tara) == (11, 6)
    assert "house 11" in palan.basis.en and "11-ஆம்" in palan.basis.ta
    assert palan.tara_name.en == "Sadhana"


def test_chandrashtama_leads_and_nothing_reads_favourable():
    for house in (7, 8):
        for tara in range(1, 10):
            palan = _build(house=house, tara=tara, label="BALANCED", chandrashtama=True)
            assert palan.overall == pp._CHANDRASHTAMA_LEAD
            assert all(a.polarity != "FAVOURABLE" for a in palan.areas)
            by_area = {a.area: a.polarity for a in palan.areas}
            for area in ("CAREER", "BUSINESS", "MONEY", "TRAVEL", "DOCUMENTS", "COMMUNICATION", "MIND"):
                assert by_area[area] == "CAUTION"
            assert palan.opportunity_area is None and palan.strength is None
            assert palan.worship == pp._WORSHIP_CHANDRASHTAMA


def test_tara_never_lifts_a_caution_line():
    for house, row in pp._MATRIX.items():
        for tara in range(1, 10):
            palan = _build(house=house, tara=tara)
            for base, area in zip(row, palan.areas, strict=True):
                if base == "CAUTION":
                    assert area.polarity == "CAUTION", (house, tara, area.area)


def test_only_the_birth_star_itself_is_called_the_birth_star():
    # Tara 1 is counts 1, 10 and 19; the 10th and 19th are its trines.
    own = _build(tara=1)  # count 1
    trine = pp.build_personal_palan(
        on_date=date(2026, 9, 23), natal_moon_rasi=1, janma_nakshatra=1,
        day_moon_rasi=4, day_nakshatra=10, weekday_lord="MARS", label="BALANCED",
        is_chandrashtama=False,
    )
    assert own.tara == trine.tara == 1
    assert "janma star today" in own.basis.en
    assert "janma star today" not in trine.basis.en and "trine" in trine.basis.en


def test_adverse_tara_softens_action_areas():
    palan = _build(house=11, tara=3)  # 11th: every area favourable at base
    by_area = {a.area: a.polarity for a in palan.areas}
    for area in pp._ACTION_AREAS:
        assert by_area[area] == "MIXED"
    assert by_area["FAMILY"] == "FAVOURABLE"


def test_headline_drops_a_house_theme_that_pulls_against_the_verdict():
    palan = _build(house=8, label="GOOD")
    assert palan.overall == pp._OVERALL_LEAD["FAVOURABLE"]
    assert palan.areas[pp.AREAS.index("MIND")].text == pp._HOUSE_THEME[8]


_MEDICAL = re.compile(r"\b(diagnos|disease|cure|medicine|medication|surgery|illness|death|die)\w*", re.I)
_MEDICAL_TA = ("நோய்", "மருந்து", "மரணம்", "அறுவை")
_FEAR = re.compile(r"\b(danger|disaster|curse|doom|must)\b", re.I)


def _every_text():
    for bank in pp._AREA_TEXT.values():
        yield from bank.values()
    yield from pp._HOUSE_THEME.values()
    yield from pp._TARA_NOTE.values()
    yield from pp._ADVICE_CAUTION.values()
    yield from pp._ADVICE_OPPORTUNITY.values()
    yield from pp._WORSHIP.values()
    yield from pp._OVERALL_LEAD.values()
    for bank in pp._CLOSING.values():
        yield from bank
    yield pp._TARA_NOTE_TRIAD
    yield pp._CHANDRASHTAMA_LEAD
    yield pp._MIND_CHANDRASHTAMA
    yield pp._WORSHIP_CHANDRASHTAMA


def test_no_medical_or_fear_language_and_every_line_is_bilingual():
    for text in _every_text():
        assert text.ta.strip() and text.en.strip()
        assert re.search(r"[஀-௿]", text.ta), text.ta
        assert not _MEDICAL.search(text.en), text.en
        assert not _FEAR.search(text.en), text.en
        assert not any(word in text.ta for word in _MEDICAL_TA), text.ta


def test_no_lucky_aspects_or_kuligai():
    # R9 and R10: neither may appear in palan copy.
    for text in _every_text():
        assert "lucky" not in text.en.lower() and "kuligai" not in text.en.lower()
        assert "அதிர்ஷ்ட" not in text.ta and "குளிகை" not in text.ta


# ── Period layer (dasha / bhukti, Sani, Guru, Rahu) ───────────────────────────

def _period(**overrides):
    base = dict(
        maha_lord="JUPITER", antar_lord="SATURN", natal_lagna_rasi=1, antar_natal_rasi=10,
        sani_cycle=None, kandaka_house=None, guru_house=3, saturn_house=3, rahu_house=9,
        antar_transit_house=11,
    )
    base.update(overrides)
    return pp.PeriodInputs(**base)


def _with_period(period, *, house=11, tara=2, label="GOOD", chandrashtama=False):
    return pp.build_personal_palan(
        on_date=date(2026, 9, 23), natal_moon_rasi=1, janma_nakshatra=1,
        day_moon_rasi=house, day_nakshatra=((tara - 1) % 27) + 1, weekday_lord="MARS",
        label=label, is_chandrashtama=chandrashtama, period=period,
    )


def test_period_never_moves_the_overall_or_lifts_a_line():
    for label in LABELS:
        for cycle in (None, *pp._SANI_LAYER):
            for guru in range(1, 13):
                plain = _build(house=4, tara=3, label=label)
                layered = _with_period(_period(sani_cycle=cycle, guru_house=guru), house=4, tara=3, label=label)
                assert layered.overall_polarity == plain.overall_polarity
                for before, after in zip(plain.areas, layered.areas, strict=True):
                    assert pp._STEP[after.polarity] <= pp._STEP[before.polarity]


def test_ashtama_sani_caps_its_areas_and_names_itself():
    palan = _with_period(_period(sani_cycle="ASHTAMA_SANI", saturn_house=8), house=11)
    by_area = {a.area: a for a in palan.areas}
    for area in ("CAREER", "HEALTH", "DOCUMENTS", "MONEY"):
        assert by_area[area].polarity == "MIXED"
        assert "Ashtama Sani" in by_area[area].period_note.en
    assert by_area["FRIENDS"].polarity == "FAVOURABLE"


def test_sani_outranks_a_supportive_guru_on_the_same_area():
    palan = _with_period(_period(sani_cycle="EZHARAI_SANI_PHASE_3", guru_house=2), house=11)
    money = next(a for a in palan.areas if a.area == "MONEY")
    assert "Ezharai Sani" in money.period_note.en and money.polarity == "MIXED"


def test_supportive_guru_adds_a_clause_without_changing_polarity():
    palan = _with_period(_period(guru_house=11), house=4)
    plain = _build(house=4, tara=2, label="GOOD")
    for before, after in zip(plain.areas, palan.areas, strict=True):
        if after.area in pp._GURU_SUPPORT[11]:
            assert "Guru in house 11" in after.period_note.en
            assert after.polarity == before.polarity


def test_guru_and_rahu_house_sets_agree_with_the_engine():
    from app.services._dg_peyarchi import NODE_AXIS_RESTRUCTURING, NODE_AXIS_SUPPORTIVE
    from app.services._dg_scoring import TRANSIT_BASE_SCORE

    jupiter = TRANSIT_BASE_SCORE["JUPITER"]
    assert set(pp._GURU_SUPPORT) == {h for h, s in jupiter.items() if s >= 65}
    assert set(pp._GURU_TESTING) == {h for h, s in jupiter.items() if s < 45}
    assert set(pp._RAHU_SUPPORT) == set(NODE_AXIS_SUPPORTIVE)
    assert set(pp._RAHU_TESTING) == set(NODE_AXIS_RESTRUCTURING)


def test_bhukti_lord_brings_its_ruled_houses_forward():
    # Mesha lagna: Saturn rules the 10th and 11th -> career, money.
    palan = _with_period(_period(antar_lord="SATURN", antar_transit_house=11))
    assert palan.dasha_areas == ("CAREER", "MONEY")
    assert palan.period.antar_houses == (10, 11)
    assert palan.period.antar_transit_supportive is True
    assert "houses 10, 11" in palan.period.text.en and "which backs them" in palan.period.text.en
    # A node reads the house it sits in: natal Rahu in rasi 7 from a Mesha lagna.
    node = _with_period(_period(antar_lord="RAHU", antar_natal_rasi=7, antar_transit_house=8))
    assert node.dasha_areas == ("LOVE",)
    assert node.period.antar_transit_supportive is False
    assert "sits in house 7" in node.period.text.en


def test_every_period_line_is_bilingual_and_safe():
    notes = [n for _, n in pp._SANI_LAYER.values()] + [n for _, n in pp._KANDAKA_LAYER.values()]
    notes += [pp._guru_note(h, s) for h in range(1, 13) for s in (True, False)]
    notes += [pp._rahu_note(h, s) for h in range(1, 13) for s in (True, False)]
    for lord in pp.GRAHA_NAME:
        for sup in (3, 8):
            notes.append(pp._period(_period(antar_lord=lord, maha_lord=lord, antar_transit_house=sup)).text)
    for text in notes:
        assert re.search(r"[\u0B80-\u0BFF]", text.ta)
        assert not _MEDICAL.search(text.en) and not _FEAR.search(text.en), text.en
        assert not any(word in text.ta for word in _MEDICAL_TA), text.ta


# ── Presenter transcript ──────────────────────────────────────────────────────

def _transcript_palan(**kw):
    return _with_period(
        _period(sani_cycle="ASHTAMA_SANI", saturn_house=8, guru_house=2),
        **kw,
    )


def test_transcript_runs_in_presenter_order():
    palan = pp.build_personal_palan(
        on_date=date(2026, 9, 23), natal_moon_rasi=1, janma_nakshatra=1, day_moon_rasi=11,
        day_nakshatra=2, weekday_lord="MARS", label="GOOD", is_chandrashtama=False,
        period=_period(sani_cycle="ASHTAMA_SANI", saturn_house=8), best_window=("13:42", "15:18"),
    )
    kinds = [seg.kind for seg in palan.transcript]
    assert kinds[0] == "OVERALL" and kinds[1] == "PERIOD" and kinds[-1] == "CLOSING"
    assert kinds.index("TIME") > max(i for i, k in enumerate(kinds) if k == "AREA")
    assert kinds[-5:] == ["STRENGTH", "ADVICE", "LUCKY", "WORSHIP", "CLOSING"] or kinds[-4:] == ["ADVICE", "LUCKY", "WORSHIP", "CLOSING"]
    time = next(seg for seg in palan.transcript if seg.kind == "TIME")
    assert "மதியம் 1:42" in time.text.ta
    assert "from 1:42 pm to 3:18 pm" in time.text.en
    period = next(seg for seg in palan.transcript if seg.kind == "PERIOD")
    assert "Ashtama Sani" in period.text.en and "அஷ்டம சனி" in period.text.ta


def test_transcript_says_each_season_clause_once_and_nothing_the_card_does_not():
    palan = _transcript_palan()
    joined_en = " ".join(seg.text.en for seg in palan.transcript)
    for note in {a.period_note for a in palan.areas if a.period_note}:
        assert joined_en.count(note.en) == 1
    card_lines = {a.text.en for a in palan.areas}
    for seg in palan.transcript:
        if seg.kind == "AREA":
            area = next(a for a in palan.areas if a.area == seg.area)
            assert seg.text.en.startswith(area.text.en) and area.text.en in card_lines


def test_transcript_does_not_repeat_the_moon_line_the_headline_already_said():
    palan = _build(house=3, label="GOOD")  # house 3 theme joins the favourable headline
    assert pp._HOUSE_THEME[3].en in palan.overall.en
    assert all(seg.area != "MIND" for seg in palan.transcript)


def test_every_transcript_line_is_safe():
    for label in LABELS:
        for house in range(1, 13):
            palan = _with_period(_period(sani_cycle="JANMA_SANI", kandaka_house=None), house=house, label=label)
            for seg in palan.transcript:
                assert re.search(r"[\u0B80-\u0BFF]", seg.text.ta)
                assert not _MEDICAL.search(seg.text.en) and not _FEAR.search(seg.text.en), seg.text.en


def test_a_capped_area_reads_its_mixed_sentence_not_the_favourable_one():
    # House 11 reads every area favourable; Ashtama Sani caps four of them.
    palan = _with_period(_period(sani_cycle="ASHTAMA_SANI", saturn_house=8), house=11)
    for area in palan.areas:
        if area.area != "MIND":
            assert area.text == pp._AREA_TEXT[area.area][area.polarity], area.area


# ── Lucky colour / number / direction (R9) ────────────────────────────────────

def _lucky_palan(*, hora=None, weekday="JUPITER", soolam=None):
    return pp.build_personal_palan(
        on_date=date(2026, 9, 24), natal_moon_rasi=1, janma_nakshatra=1, day_moon_rasi=11,
        day_nakshatra=2, weekday_lord=weekday, label="GOOD", is_chandrashtama=False,
        best_hora_lord=hora, soolam=soolam,
    )


def test_lucky_aspects_all_belong_to_the_best_hora_lord_and_name_their_rule():
    lucky = _lucky_palan(hora="JUPITER", weekday="MARS", soolam="வடக்கு").lucky
    assert (lucky.graha, lucky.source) == ("JUPITER", "BEST_HORA")
    assert lucky.colour.en == "yellow" and lucky.number == 3 and lucky.direction == "NORTH_EAST"
    assert "Brihat Parashara Hora Shastra" in lucky.basis.en and "best time" in lucky.basis.en
    assert "(Jupiter = 3)" in lucky.basis.en


def test_lucky_aspects_fall_back_to_the_weekday_lord_without_a_hora():
    lucky = _lucky_palan(hora=None, weekday="VENUS").lucky
    assert (lucky.graha, lucky.source, lucky.number) == ("VENUS", "WEEKDAY", 6)
    assert "today's weekday" in lucky.basis.en


def test_a_graha_direction_on_the_days_soolam_is_withheld_and_the_soolam_is_named():
    # Mars's direction is south; Thursday's soolam is south.
    palan = _lucky_palan(hora="MARS", weekday="JUPITER", soolam="தெற்கு")
    assert palan.lucky.direction is None and palan.lucky.soolam == "SOUTH"
    assert "that is today's soolam" in palan.lucky.basis.en
    spoken = next(seg for seg in palan.transcript if seg.kind == "LUCKY")
    assert "lucky direction" not in spoken.text.en
    assert "soolam is south" in spoken.text.en and "சூலம் தெற்கு" in spoken.text.ta


def test_lucky_tables_cover_every_hora_graha_and_agree_with_numerology():
    from app.calculations.numerology import NUMBER_TO_GRAHA

    for graha in ("SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN"):
        assert graha in pp.GRAHA_COLOUR and graha in pp.GRAHA_DIRECTION
        assert NUMBER_TO_GRAHA[pp.GRAHA_NUMBER[graha]] == graha
    # Parashara's eight lords of the directions, each direction once.
    assert len(set(pp.GRAHA_DIRECTION.values())) == 8
