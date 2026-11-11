"""FAA-32 joint progeny (docs/GROUP_D_SPECS_2026-11-11.md D3 + §0.3).

Synthetic rasi placements and synthetic Julian days only; no person, no birth data.
"""
from __future__ import annotations

import json
import random
from dataclasses import replace
from datetime import date
from pathlib import Path

import pytest

from app.calculations.dasha import calculate_vimshottari_timeline
from app.calculations.functional_status import FunctionalStatus
from app.calculations.joint_progeny import (
    ProgenyChart,
    TimingSpan,
    active_spans,
    intersect,
    joint_progeny,
    ninth_role,
    one_chart,
    timing_lords,
)
from app.calculations.rule_sources import REGISTRY

# Mesha lagna (1): the 5th is Simha (5), lord Sun; the 9th is Dhanus (9), lord
# Jupiter. Moon in Mithuna (3): its 5th is Thula (7), lord Venus. Jupiter in
# Kanni (6): its 5th is Makara (10), lord Saturn. Saturn sits in the 5th.
BASE = ProgenyChart(
    lagna_rasi=1,
    planet_rasi={"SUN": 10, "MOON": 3, "MARS": 8, "MERCURY": 11, "JUPITER": 6,
                 "VENUS": 12, "SATURN": 5, "RAHU": 2, "KETU": 8},
    paksha_is_shukla=True,
)
AS_OF = date(2026, 11, 11)
AS_OF_JD = 2_461_355.5  # 2026-11-11 00:00 UT


def _f(reading, kind=None, ref=None, graha=None, target=None, bhava=None):
    return [f for f in reading.factors
            if (kind is None or f.kind == kind) and (ref is None or f.reference == ref)
            and (graha is None or f.graha == graha) and (target is None or f.target == target)
            and (bhava is None or f.bhava == bhava)]


def test_the_ninth_follows_the_stated_gender_only():
    assert ninth_role("female") == "CHILDREN"
    assert ninth_role(" Male ") == "CONTEXT"
    for g in (None, "", "not_specified", "other"):
        assert ninth_role(g) == "NOT_APPLIED"
    r = one_chart(BASE, None)
    assert r.ninth_from_lagna is None and not _f(r, bhava=9)
    # The 5th, Guru, the 5th from Guru and from the Moon do not need a gender.
    assert {f.reference for f in r.factors} >= {"LAGNA", "JUPITER", "MOON"}


def test_the_fifth_from_jupiter_is_bphs_7_42_and_the_moon_side_is_engine_inference():
    r = one_chart(BASE, "male")
    assert r.fifth_from_jupiter == 10
    (lord,) = _f(r, "LORD", "JUPITER")
    assert lord.graha == "SATURN" and lord.rule == "BPHS_7_42" and lord.tier == "classical_rule"
    (moon_lord,) = _f(r, "LORD", "MOON")
    assert moon_lord.graha == "VENUS" and moon_lord.tier == "engine_inference"
    for f in r.factors:
        assert f.tier == REGISTRY[f.rule].tier
        if f.tier == "classical_rule":
            assert f.reference == "JUPITER" and f.kind in ("OCCUPANT", "LORD"), f


def test_brides_ninth_is_the_verse_and_grooms_is_context_only():
    bride, groom = one_chart(BASE, "female"), one_chart(BASE, "male")
    (lord_b,) = _f(bride, "LORD", "LAGNA", bhava=9)
    assert lord_b.graha == "JUPITER" and lord_b.rule == "PHALADEEPIKA_11_1"
    (lord_g,) = _f(groom, "LORD", "LAGNA", bhava=9)
    assert lord_g.rule == "GROUP_D_RULINGS_2026_11_11" and lord_g.bearing == "CONTEXT"
    assert all(f.bearing == "CONTEXT" for f in _f(groom, bhava=9))
    assert not any(f.rule.startswith("PHALADEEPIKA") for f in groom.factors)


def test_a_malefic_in_its_own_ninth_carries_the_verses_exception_for_a_bride():
    # Simha lagna (5): the 9th is Mesha, Mars's own sign.
    chart = replace(BASE, lagna_rasi=5, planet_rasi={**BASE.planet_rasi, "MARS": 1})
    (mars,) = _f(one_chart(chart, "female"), "OCCUPANT", "LAGNA", "MARS", bhava=9)
    assert mars.own_house and mars.nature == "MALEFIC"
    assert mars.rule == "PHALADEEPIKA_11_1_OWN_HOUSE" and mars.tier == "classical_rule"
    assert mars.bearing == "SUPPORTIVE"
    # Outside the bride's 9th the exception is not the verse: context, not support.
    own_fifth = replace(BASE, lagna_rasi=9, planet_rasi={**BASE.planet_rasi, "MARS": 1})
    (m5,) = _f(one_chart(own_fifth, "female"), "OCCUPANT", "LAGNA", "MARS", bhava=5)
    assert m5.own_house and m5.bearing == "CONTEXT" and m5.tier == "engine_inference"


def test_saturn_in_the_fifth_is_the_same_placement_santhana_thadai_counts():
    chart = replace(BASE, dosham_markers={"SANTHANA_THADAI": ("fifth_house_has_saturn",)})
    (occ,) = _f(one_chart(chart, "female"), "OCCUPANT", "LAGNA", "SATURN", bhava=5)
    assert occ.placement_id == "D1.SATURN" and occ.also_counted_in == ("SANTHANA_THADAI",)
    # The 5th from Guru reading the same Saturn is not the dosham's marker.
    (bare,) = _f(one_chart(BASE, "female"), "OCCUPANT", "LAGNA", "SATURN", bhava=5)
    assert bare.also_counted_in == ()
    assert all(f.also_counted_in == () for f in one_chart(chart, "female").factors if f.reference != "LAGNA")


def test_d7_lines_need_a_reliable_d7_lagna():
    d7 = {"SUN": 2, "MOON": 3, "MARS": 5, "MERCURY": 4, "JUPITER": 1, "VENUS": 6, "SATURN": 8, "RAHU": 5, "KETU": 11}
    good = replace(BASE, d7_rasi=d7, d7_lagna_rasi=1, d7_lagna_reliable=True)
    r = one_chart(good, "female")
    assert r.d7_note is None
    (lord7,) = _f(r, "D7_LORD")
    assert lord7.graha == "SUN" and lord7.rasi == 2 and lord7.placement_id == "D7.SUN"
    assert {f.graha for f in _f(r, "D7_OCCUPANT")} == {"MARS", "RAHU"}
    (k7,) = _f(r, "D7_KARAKA")
    assert k7.house == 1 and k7.bearing == "SUPPORTIVE"
    bad = one_chart(replace(good, d7_lagna_reliable=False), "female")
    assert bad.d7_note == "D7_LAGNA_UNRELIABLE" and not [f for f in bad.factors if f.kind.startswith("D7")]
    assert one_chart(BASE, "female").d7_note == "D7_UNAVAILABLE"


def test_timing_lords_are_the_rulings_list_and_never_the_2nd_or_7th_lord():
    lords = {t.graha: t.roles for t in timing_lords(BASE, "CHILDREN")}
    assert lords == {
        "SUN": ("FIFTH_LORD",),
        "JUPITER": ("JUPITER", "NINTH_LORD"),
        "SATURN": ("FIFTH_OCCUPANT", "FIFTH_FROM_JUPITER_LORD", "FIFTH_LORD_DISPOSITOR"),
    }
    # Venus rules the 2nd and the 7th from Mesha and nothing else here.
    assert "VENUS" not in lords
    groom = {t.graha: t.roles for t in timing_lords(BASE, "CONTEXT")}
    assert groom["JUPITER"] == ("JUPITER",)


def test_the_joint_layer_ignores_aspects():
    """Measured: with aspects, BOTH fired for 79% (5th lord) and 63% (5th house)
    of 2,000 synthetic couples. Occupation and conjunction only."""
    # Saturn in Mithuna (3) aspects Simha by its 3rd; nothing malefic sits in Simha.
    aspected = replace(BASE, planet_rasi={**BASE.planet_rasi, "SATURN": 3})
    r = one_chart(aspected, "male")
    assert _f(r, "INFLUENCE", "LAGNA", "SATURN", "HOUSE") and _f(r, "INFLUENCE", graha="SATURN")[0].bearing == "CHALLENGING"
    assert r.fifth_house_challenged is False
    assert one_chart(BASE, "male").fifth_house_challenged is True  # Saturn in the 5th


def test_windows_are_true_intersections():
    s = TimingSpan
    a = (s(date(2027, 1, 1), date(2027, 3, 1), "JUPITER", "SATURN"), s(date(2027, 4, 1), date(2027, 6, 1), "SUN", "SATURN"))
    b = (s(date(2027, 2, 1), date(2027, 4, 15), "VENUS", "RAHU"), s(date(2027, 6, 1), date(2027, 7, 1), "MOON", "RAHU"))
    w = intersect(a, b, {"JUPITER": ("JUPITER",), "SUN": ("FIFTH_LORD",)}, {"VENUS": ("FIFTH_LORD",)})
    assert [(x.start, x.end, x.lord_a, x.lord_b) for x in w] == [
        (date(2027, 2, 1), date(2027, 3, 1), "JUPITER", "VENUS"),
        (date(2027, 4, 1), date(2027, 4, 15), "SUN", "VENUS"),
    ]
    assert w[0].roles_a == ("JUPITER",) and w[1].roles_b == ("FIFTH_LORD",)
    # Spans that only touch (Jun 1) give no window.
    assert all(x.end > x.start for x in w)


def test_active_spans_are_bhuktis_of_a_timing_lord_inside_the_horizon():
    tl = calculate_vimshottari_timeline(2_450_000.25, 123.4, AS_OF_JD)
    end = date(2031, 11, 11)
    spans = active_spans(tl.mahadashas, {"JUPITER", "SATURN"}, AS_OF, end)
    assert spans
    for sp in spans:
        assert sp.lord in {"JUPITER", "SATURN"} and AS_OF <= sp.start < sp.end <= end


def _couple(gender_a="female", gender_b="male", birth_a=date(1996, 3, 1), birth_b=date(1994, 8, 1), years=5):
    ta = calculate_vimshottari_timeline(2_450_143.7, 200.0, AS_OF_JD)
    tb = calculate_vimshottari_timeline(2_449_565.2, 41.0, AS_OF_JD)
    other = replace(BASE, lagna_rasi=7, planet_rasi={**BASE.planet_rasi, "JUPITER": 11, "MOON": 9})
    return (BASE, gender_a, ta.mahadashas, birth_a), (other, gender_b, tb.mahadashas, birth_b), years


def test_swapping_the_partners_swaps_every_side_of_the_reading():
    (ca, ga, ma, ba), (cb, gb, mb, bb), _ = _couple()
    ab = joint_progeny(ca, ga, ma, ba, cb, gb, mb, bb, as_of=AS_OF)
    ba_ = joint_progeny(cb, gb, mb, bb, ca, ga, ma, ba, as_of=AS_OF)
    assert ab.person_a == ba_.person_b and ab.person_b == ba_.person_a
    assert sorted((w.start, w.end, w.lord_a, w.lord_b) for w in ab.windows) == sorted(
        (w.start, w.end, w.lord_b, w.lord_a) for w in ba_.windows)
    assert ab.windows, "the fixture couple should have at least one window"
    assert [x.pattern for x in ab.joint] == [x.pattern for x in ba_.joint]


def test_horizon_is_five_years_by_default_ten_optional():
    (ca, ga, ma, ba), (cb, gb, mb, bb), _ = _couple()
    five = joint_progeny(ca, ga, ma, ba, cb, gb, mb, bb, as_of=AS_OF)
    ten = joint_progeny(ca, ga, ma, ba, cb, gb, mb, bb, as_of=AS_OF, horizon_years=10)
    assert (five.horizon_years, five.horizon_end) == (5, date(2031, 11, 11))
    assert ten.horizon_end == date(2036, 11, 11) and len(ten.windows) >= len(five.windows)
    assert all(w.end <= five.horizon_end for w in five.windows)
    with pytest.raises(ValueError):
        joint_progeny(ca, ga, ma, ba, cb, gb, mb, bb, as_of=AS_OF, horizon_years=7)


@pytest.mark.parametrize("birth", [date(2010, 1, 1), date(1970, 1, 1)])
def test_no_dates_outside_18_to_50(birth):
    (ca, ga, ma, _), (cb, gb, mb, bb), _ = _couple()
    j = joint_progeny(ca, ga, ma, birth, cb, gb, mb, bb, as_of=AS_OF)
    assert j.timing_note == "AGE_OUTSIDE_RANGE" and j.windows == ()
    assert j.person_a.factors  # the chart reading itself is still given


def test_population_invariants():
    """No MARAKA, tiers from the registry, classical only on the verified lines,
    houses and rasis in range, every factor bearing one of three marks."""
    rng = random.Random(32)
    for _ in range(300):
        rahu = rng.randint(1, 12)
        chart = ProgenyChart(
            lagna_rasi=rng.randint(1, 12),
            planet_rasi={g: rng.randint(1, 12) for g in ("SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN")}
            | {"RAHU": rahu, "KETU": (rahu + 5) % 12 + 1},
        )
        for g in ("female", "male", None):
            r = one_chart(chart, g)
            for f in r.factors:
                assert FunctionalStatus.MARAKA.value not in f.lordship
                assert 1 <= f.house <= 12 and 1 <= f.rasi <= 12
                assert f.tier == REGISTRY[f.rule].tier
                assert f.bearing in ("SUPPORTIVE", "CHALLENGING", "CONTEXT")
                if f.tier == "classical_rule":
                    assert (f.reference == "JUPITER" and f.kind in ("OCCUPANT", "LORD")) or (
                        g == "female" and f.reference == "LAGNA" and f.bhava == 9), f
            assert {t.graha for t in r.timing_lords} >= {"JUPITER"}


def test_pdf_copy_reproduces_every_web_line():
    """app/services/joint_progeny_copy.py mirrors web/lib/joint-progeny-copy.ts;
    the golden file is generated from the web functions."""
    from app.services import joint_progeny_copy as copy

    golden = json.loads((Path(__file__).parent / "golden" / "joint_progeny" / "joint_progeny_copy.json").read_text(encoding="utf-8"))
    assert len(golden["cases"]) == 114
    for c in golden["cases"]:
        assert copy.line(c["factor"], c["lang"]) == c["line"], c
        assert copy.bearing(c["factor"], c["lang"]) == c["bearing"], c
        assert copy.also_counted(c["factor"], c["lang"]) == c["also"], c
        assert copy.group_of(c["factor"]) == c["group"], c
    for c in golden["joint"]:
        assert copy.joint_line(c["key"], c["pattern"], c["lang"]) == c["line"], c
    for c in golden["windows"]:
        assert copy.window_line(c["window"], "Person A", "Person B", c["lang"]) == c["line"], c
    for c in golden["labels"]:
        assert copy.group_label(c["group"], c["ninth"], c["lang"]) == c["label"], c
    for c in golden["notes"]:
        kind, value, lang = c["kind"], c["value"], c["lang"]
        if kind == "ninth":
            got = copy.ninth_not_applied(value, lang)
        elif kind == "d7":
            got = copy.d7_note(value, lang)
        elif kind == "intro":
            got = copy.timing_intro(5, "2026-11-11", "2031-11-11", lang)
        else:
            got = copy.timing_empty(None if value == "NONE" else value, False, 5, lang)
        assert got == c["text"], c
