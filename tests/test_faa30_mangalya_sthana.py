"""FAA-30 8th-house reading (docs/GROUP_D_SPECS_2026-11-11.md D2 + §0.3).

Synthetic rasi placements only; no person, no birth data.
"""
from __future__ import annotations

import random
from dataclasses import replace

import pytest

from app.calculations.functional_status import FunctionalStatus
from app.calculations.mangalya_sthana import (
    EighthHouseChart,
    d9_lagna_stable,
    joint_pattern,
    one_chart,
    stated_role,
)
from app.calculations.rule_sources import REGISTRY

# Kataka lagna (4): the 8th is Kumbha (11), lord Saturn. The Moon in Kanni (6):
# the 8th from the Moon is Mesha (1), lord Mars. Sun 1 / Moon 6 = Shukla.
BASE = EighthHouseChart(
    lagna_rasi=4,
    planet_rasi={"SUN": 1, "MOON": 6, "MARS": 11, "MERCURY": 2, "JUPITER": 12,
                 "VENUS": 3, "SATURN": 9, "RAHU": 3, "KETU": 9},
)


def _f(reading, kind, ref=None, graha=None, target=None):
    return [f for f in reading.factors if f.kind == kind and (ref is None or f.reference == ref)
            and (graha is None or f.graha == graha) and (target is None or f.target == target)]


def test_role_comes_from_the_stated_gender_only():
    assert stated_role("female") == "BRIDE"
    assert stated_role(" Male ") == "GROOM_8TH"
    for g in (None, "", "not_specified", "UNKNOWN", "other"):
        assert stated_role(g) == "NOT_APPLIED"


def test_unknown_gender_applies_nothing():
    r = one_chart(BASE, "not_specified")
    assert r.role == "NOT_APPLIED" and r.factors == () and r.mangalya_reference is None
    assert r.malefic_influence is False


def test_bride_reads_both_references_separately():
    r = one_chart(BASE, "female")
    assert r.mangalya_reference == "BOTH"
    assert (r.eighth_from_lagna, r.eighth_from_moon) == (11, 1)
    (lord_l,) = _f(r, "LORD", "LAGNA")
    (lord_m,) = _f(r, "LORD", "MOON")
    assert (lord_l.graha, lord_m.graha) == ("SATURN", "MARS")


def test_sevvai_in_the_8th_is_the_same_placement_the_dosham_counts():
    """Rulings §1.5: Mars in the 8th from the lagna, with Sevvai dosham counting
    from the lagna, is one placement shown twice, not two findings."""
    chart = replace(BASE, dosham_references={"SEVVAI_DOSHAM": frozenset({"LAGNA"})})
    (occ,) = _f(one_chart(chart, "female"), "OCCUPANT", "LAGNA", "MARS")
    assert occ.placement_id == "D1.MARS"
    assert occ.also_counted_in == ("SEVVAI_DOSHAM",)
    # Without the dosham (or counted from another reference) there is no link.
    (bare,) = _f(one_chart(BASE, "female"), "OCCUPANT", "LAGNA", "MARS")
    assert bare.also_counted_in == ()
    other = replace(BASE, dosham_references={"SEVVAI_DOSHAM": frozenset({"MOON"})})
    (occ2,) = _f(one_chart(other, "female"), "OCCUPANT", "LAGNA", "MARS")
    assert occ2.also_counted_in == ()


def test_malefic_in_its_own_8th_carries_the_phaladeepika_exception():
    """Phaladeepika 11.1: a malefic in a house it owns gives good results. The
    rulings left it out; it is recorded, and it does not count as influence."""
    own = replace(BASE, planet_rasi={**BASE.planet_rasi, "SATURN": 11, "MARS": 5})
    r = one_chart(own, "female")
    (sat,) = _f(r, "OCCUPANT", "LAGNA", "SATURN")
    assert sat.own_house is True and sat.nature == "MALEFIC"
    assert sat.rule == "PHALADEEPIKA_11_1_OWN_HOUSE" and sat.tier == "classical_rule"
    lagna_side = [f for f in r.factors if f.reference == "LAGNA" and f.kind == "OCCUPANT"]
    assert not any(f.nature == "MALEFIC" and not f.own_house for f in lagna_side)


def test_tiers_follow_the_registry_and_only_the_brides_lagna_reading_is_the_verse():
    bride = one_chart(BASE, "female")
    groom = one_chart(BASE, "male")
    for r in (bride, groom):
        for f in r.factors:
            assert f.tier == REGISTRY[f.rule].tier, f
    classical = [f for f in bride.factors if f.tier == "classical_rule"]
    assert classical and all(f.reference == "LAGNA" and f.kind in ("OCCUPANT", "LORD") for f in classical)
    assert all(f.tier == "engine_inference" for f in groom.factors)
    assert all(not f.rule.startswith("PHALADEEPIKA") for f in groom.factors)


def test_guru_and_sukran_protection_lines_each_carry_their_own_dignity():
    # From Thula (7), Kumbha (11) is the 5th: Guru's 5th aspect falls on the
    # lagna's 8th. Sukran in Simha (5) reaches Kumbha by its 7th.
    chart = replace(BASE, planet_rasi={**BASE.planet_rasi, "JUPITER": 7, "VENUS": 5})
    r = one_chart(chart, "female")
    (guru,) = _f(r, "PROTECTION", "LAGNA", "JUPITER", "HOUSE")
    (sukran,) = _f(r, "PROTECTION", "LAGNA", "VENUS", "HOUSE")
    assert guru.dignity == "NEUTRAL" and sukran.dignity == "NEUTRAL"
    # Sukran in its own Thula (7) reaches Mesha (1), the Moon's 8th: the line
    # carries OWN. The line never cancels anything; it records the strength.
    own = replace(BASE, planet_rasi={**BASE.planet_rasi, "VENUS": 7})
    (line,) = _f(one_chart(own, "female"), "PROTECTION", "MOON", "VENUS", "HOUSE")
    assert line.dignity == "OWN"
    assert one_chart(own, "female").malefic_influence is True  # protection did not erase influence


def test_moon_class_follows_paksha_and_mercury_follows_its_company():
    # Moon in Kumbha (the lagna's 8th). Sun in Mesha: Mesha->Kumbha is 11, Krishna.
    waning = replace(BASE, planet_rasi={**BASE.planet_rasi, "MOON": 11})
    (moon,) = _f(one_chart(waning, "female"), "OCCUPANT", "LAGNA", "MOON")
    assert (moon.nature, moon.condition) == ("MALEFIC", "PAKSHA")
    waxing = replace(waning, paksha_is_shukla=True)
    (moon2,) = _f(one_chart(waxing, "female"), "OCCUPANT", "LAGNA", "MOON")
    assert (moon2.nature, moon2.condition) == ("BENEFIC", "PAKSHA")
    # Mercury alone in the 8th stays benefic; with Mars there it turns malefic.
    alone = replace(BASE, planet_rasi={**BASE.planet_rasi, "MERCURY": 11, "MARS": 5})
    (bu,) = _f(one_chart(alone, "female"), "OCCUPANT", "LAGNA", "MERCURY")
    assert (bu.nature, bu.condition) == ("BENEFIC", "ASSOCIATION")
    joined = replace(BASE, planet_rasi={**BASE.planet_rasi, "MERCURY": 11})
    (bu2,) = _f(one_chart(joined, "female"), "OCCUPANT", "LAGNA", "MERCURY")
    assert bu2.nature == "MALEFIC"


def test_d9_lines_need_a_stable_d9_lagna():
    d9 = {"SUN": 2, "MOON": 3, "MARS": 1, "MERCURY": 4, "JUPITER": 5, "VENUS": 6,
          "SATURN": 8, "RAHU": 8, "KETU": 2}
    stable = replace(BASE, d9_rasi=d9, d9_lagna_rasi=1, d9_lagna_reliable=True)
    r = one_chart(stable, "female")
    assert r.d9_note is None
    (lord9,) = _f(r, "D9_LORD")
    assert lord9.graha == "SATURN" and lord9.rasi == 8 and lord9.placement_id == "D9.SATURN"
    assert {f.graha for f in _f(r, "D9_OCCUPANT")} == {"SATURN", "RAHU"}
    unstable = replace(stable, d9_lagna_reliable=False)
    r2 = one_chart(unstable, "female")
    assert r2.d9_note == "D9_LAGNA_UNRELIABLE"
    assert not [f for f in r2.factors if f.kind.startswith("D9")]
    assert one_chart(BASE, "female").d9_note == "D9_UNAVAILABLE"


def test_d9_lagna_stability_reads_the_bracket_not_an_average():
    # One navamsa is 3deg20': boundaries at 6.667 and 10.0. 8.3 sits mid-pada.
    assert d9_lagna_stable(8.3, (7.8, 8.8)) is True
    assert d9_lagna_stable(10.0, (9.9, 10.1)) is False
    assert d9_lagna_stable(8.3, None) is False
    assert d9_lagna_stable(8.3, (7.8, 8.8), confidence_minutes=15) is False


def test_no_maraka_lordship_ever_reaches_a_factor():
    """EC-RULING-06: the 2nd/7th 'maraka' status is a lifespan concept."""
    rng = random.Random(30)
    for _ in range(300):
        chart = EighthHouseChart(
            lagna_rasi=rng.randint(1, 12),
            planet_rasi={g: rng.randint(1, 12) for g in ("SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN")}
            | {"RAHU": (r := rng.randint(1, 12)), "KETU": (r + 5) % 12 + 1},
        )
        for g in ("female", "male"):
            for f in one_chart(chart, g).factors:
                assert FunctionalStatus.MARAKA.value not in f.lordship
                assert 1 <= f.house <= 12 and 1 <= f.rasi <= 12
                assert f.tier == REGISTRY[f.rule].tier


def test_joint_pattern_describes_both_one_or_neither():
    # Rahu and Ketu together aspect every house of one parity, so two adjacent
    # 8ths can never both be clear. The Moon in the lagna sign gives one 8th
    # (Kumbha, 11); nodes on even signs leave it alone. Saturn (its lord) is
    # exalted in Thula and nothing malefic reaches Thula.
    quiet = EighthHouseChart(lagna_rasi=4, planet_rasi={"SUN": 4, "MOON": 4, "MARS": 3, "MERCURY": 5,
                                                        "JUPITER": 4, "VENUS": 5, "SATURN": 7, "RAHU": 2, "KETU": 8})
    loud = one_chart(BASE, "female")
    calm = one_chart(quiet, "male")
    assert loud.malefic_influence is True
    assert calm.malefic_influence is False, [f for f in calm.factors if f.nature == "MALEFIC"]
    assert joint_pattern(loud, calm) == "ONE"
    assert joint_pattern(loud, one_chart(BASE, "male")) == "BOTH"
    assert joint_pattern(calm, calm) == "NEITHER"
    assert joint_pattern(loud, one_chart(BASE, None)) == "NOT_APPLIED"


def test_pdf_copy_reproduces_every_web_line():
    """app/services/eighth_house_copy.py mirrors web/lib/eighth-house-copy.ts;
    the golden file is generated from the web functions."""
    import json
    from pathlib import Path

    from app.services import eighth_house_copy

    golden = Path(__file__).parent / "golden" / "eighth_house" / "eighth_house_copy.json"
    cases = json.loads(golden.read_text(encoding="utf-8"))["cases"]
    assert len(cases) == 108
    for c in cases:
        assert eighth_house_copy.line(c["factor"], c["lang"]) == c["line"], c
        assert eighth_house_copy.also_counted(c["factor"], c["lang"]) == c["also"], c


@pytest.mark.parametrize("gender", ["female", "male"])
def test_every_factor_has_exactly_the_reference_it_names(gender):
    r = one_chart(BASE, gender)
    for f in r.factors:
        if f.kind == "OCCUPANT" and f.reference != "D9_LAGNA":
            expected = r.eighth_from_lagna if f.reference == "LAGNA" else r.eighth_from_moon
            assert f.rasi == expected and f.house == 8
