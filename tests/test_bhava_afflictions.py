"""Named bhava affliction analysis (app/calculations/bhava_afflictions.py).

Hand-worked from Aries lagna (rasi 1): 7th bhava = Libra (7), lord Venus.
"""

import pytest

from app.calculations.bhava_afflictions import (
    affliction_dosham_strength,
    assess_bhava_afflictions,
)

pytestmark = pytest.mark.no_db


def test_heavily_afflicted_seventh_house():
    # Mars occupies Libra; Saturn in Aries casts its 7th aspect onto Libra;
    # Rahu in Virgo (12th from bhava) + Ketu in Scorpio (2nd from bhava)
    # hem it in papa kartari; Mars from Libra aspects Venus in Taurus
    # (4/7/8 from Libra = Capricorn/Aries/Taurus).
    report = assess_bhava_afflictions(
        lagna_rasi=1,
        bhava_house=7,
        planet_rasis={"MARS": 7, "SATURN": 1, "RAHU": 6, "KETU": 8, "VENUS": 2},
        karaka="VENUS",
    )
    assert report.malefics_occupying == ("MARS",)
    assert report.malefics_aspecting == ("SATURN",)
    assert report.papa_kartari is True
    assert not report.shubha_kartari
    # Venus is both lord and karaka — afflictors recorded once, on the lord.
    # Mars (4th from Libra), Rahu (5/7/9 from Virgo → 10/12/2), and Ketu
    # (5/7/9 from Scorpio → 12/2/4) all reach Venus in Taurus.
    assert report.lord_afflicted_by == ("KETU", "MARS", "RAHU")
    assert report.karaka_afflicted_by == ()
    # 1 occupying + 1 aspecting + 2 lord (capped) + 2 papa kartari = 6
    assert report.severity == 6
    assert report.is_afflicted
    assert affliction_dosham_strength(report.severity) == "MODERATE"


def test_bhava_lord_exempt_from_afflicting_own_house():
    # Cancer lagna (4): 7th bhava = Capricorn (10), owned by Saturn.
    # Saturn standing in its own 7th reads as delay/stability, not denial.
    report = assess_bhava_afflictions(
        lagna_rasi=4,
        bhava_house=7,
        planet_rasis={"SATURN": 10, "VENUS": 3},
        karaka="VENUS",
    )
    assert report.malefics_occupying == ()
    assert report.malefics_aspecting == ()


def test_shubha_kartari_reduces_severity():
    # Jupiter in Virgo (12th from Libra) and Moon in Scorpio (2nd from it)
    # hem the 7th benefically; Mars in Aries aspects Libra (7th aspect).
    report = assess_bhava_afflictions(
        lagna_rasi=1,
        bhava_house=7,
        planet_rasis={"JUPITER": 6, "MOON": 8, "MARS": 1, "VENUS": 5},
        karaka="VENUS",
    )
    assert report.shubha_kartari is True
    assert not report.papa_kartari
    # 1 aspecting (Mars) - 1 shubha kartari = 0
    assert report.severity == 0
    assert not report.is_afflicted


def test_mild_background_contact_is_not_afflicted():
    # Jupiter sits in the 7th; the only malefic contact is Ketu in Gemini,
    # whose 5th/9th aspects touch Libra (bhava) and Aquarius (Venus). One
    # aspect + one lord contact = severity 2 — normal background, below
    # the affliction threshold. (Mars@3 aspects 6/9/10, Saturn@6 aspects
    # 8/12/3, Rahu@9 aspects 1/3/5 — none reach Libra or Venus.)
    report = assess_bhava_afflictions(
        lagna_rasi=1,
        bhava_house=7,
        planet_rasis={"JUPITER": 7, "VENUS": 11, "SATURN": 6, "MARS": 3, "RAHU": 9, "KETU": 3},
        karaka="VENUS",
    )
    assert report.malefics_occupying == ()
    assert report.malefics_aspecting == ("KETU",)
    assert report.lord_afflicted_by == ("KETU",)
    assert report.severity == 2
    assert not report.is_afflicted
    assert affliction_dosham_strength(report.severity) == "NONE"


def test_dosham_strength_thresholds():
    assert affliction_dosham_strength(0) == "NONE"
    assert affliction_dosham_strength(2) == "NONE"
    assert affliction_dosham_strength(3) == "MILD"
    assert affliction_dosham_strength(5) == "MODERATE"
    assert affliction_dosham_strength(7) == "STRONG"
