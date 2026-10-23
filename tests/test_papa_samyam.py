"""F-CI-03 — பாப சாம்யம், the standard Tamil check the report used to omit.

Ground-truth audit 2026-10-13: Tamil families who bring two jadhagams to a
jothidar expect papa samyam, and the report said nothing at all — which reads
as "we checked and it was fine".
"""
from __future__ import annotations

from types import SimpleNamespace

import pytest

from app.calculations.compatibility_intelligence import papa_samyam_lines
from app.calculations.dosha_samyam import (
    PAPA_GRAHAS,
    PAPA_HOUSES,
    PAPA_REFERENCES,
    papa_count,
    papa_samyam,
)

pytestmark = pytest.mark.no_db


def _clean() -> dict[str, int]:
    """Lagna 1; every malefic parked in a house that is papa from none of the
    three references, so the count is a true zero to build cases on."""
    return {
        "MOON": 1, "VENUS": 1,
        "SUN": 3, "MARS": 3, "SATURN": 3, "RAHU": 3, "KETU": 3,
        "MERCURY": 5, "JUPITER": 9,
    }


# ── The count itself ───────────────────────────────────────────────────────

def test_a_chart_with_no_malefic_in_a_papa_house_counts_zero() -> None:
    count = papa_count(_clean(), 1)
    assert count.total == 0
    assert count.grahas == ()
    assert set(count.by_reference) == set(PAPA_REFERENCES)


def test_a_malefic_counts_once_per_reference_it_is_papa_from() -> None:
    """The three references are three separate readings of the same chart,
    not one reading to de-duplicate. Saturn in rasi 7 is the 7th from a Lagna
    in 1, from a Moon in 1 and from a Venus in 1 — so it scores three."""
    planets = _clean() | {"SATURN": 7}
    count = papa_count(planets, 1)
    assert count.by_reference == {"LAGNA": 1, "MOON": 1, "VENUS": 1}
    assert count.total == 3
    assert count.grahas == ("SATURN",)


def test_references_are_read_independently() -> None:
    """Moon in rasi 7 puts Saturn-in-7 in the Moon's 1st (papa) but shifts
    what else is papa from the Moon — the three counts must be able to
    differ, which a single-reference reading could not express."""
    planets = _clean() | {"SATURN": 7, "MOON": 7}
    count = papa_count(planets, 1)
    assert count.by_reference["LAGNA"] == 1   # Saturn is 7th from Lagna
    assert count.by_reference["MOON"] == 1    # Saturn is 1st from the Moon
    assert len(set(count.by_reference.values())) >= 1


def test_only_the_five_papa_grahas_count() -> None:
    """Mandhi is in `_yoga_helpers.NATURAL_MALEFICS` but deliberately not
    here: a sixth body would make our total incomparable with the count a
    jothidar does by hand."""
    assert PAPA_GRAHAS == frozenset({"SUN", "MARS", "SATURN", "RAHU", "KETU"})
    assert "MANDHI" not in PAPA_GRAHAS
    benefics_in_papa_houses = _clean() | {"JUPITER": 7, "MERCURY": 8, "MOON": 1, "VENUS": 1}
    assert papa_count(benefics_in_papa_houses, 1).total == 0


def test_the_papa_houses_are_the_sevvai_set() -> None:
    from app.calculations._yoga_helpers import TAMIL_SEVVAI_HOUSES

    assert PAPA_HOUSES == frozenset(TAMIL_SEVVAI_HOUSES)


def test_a_missing_reference_graha_is_skipped_not_counted_as_zero() -> None:
    """A chart we could not read from the Moon has an unknown Moon count, not
    a clean one — counting it zero would quietly understate the load."""
    planets = {k: v for k, v in _clean().items() if k != "MOON"} | {"SATURN": 7}
    count = papa_count(planets, 1)
    assert "MOON" not in count.by_reference
    assert set(count.by_reference) == {"LAGNA", "VENUS"}


# ── The comparison ─────────────────────────────────────────────────────────

def test_the_boy_needs_at_least_the_girls_papa_points() -> None:
    heavy = _clean() | {"SATURN": 7, "MARS": 8}
    light = _clean()

    assert papa_samyam(heavy, 1, light, 1).balanced is True
    assert papa_samyam(light, 1, heavy, 1).balanced is False


def test_equal_loads_are_balanced() -> None:
    same = _clean() | {"SATURN": 7}
    result = papa_samyam(same, 1, same, 1)
    assert result.balanced is True
    assert result.shortfall == 0


def test_shortfall_is_the_gap_and_only_when_short() -> None:
    light, heavy = _clean(), _clean() | {"SATURN": 7}
    short = papa_samyam(light, 1, heavy, 1)
    assert short.shortfall == heavy_total(heavy) == 3
    assert papa_samyam(heavy, 1, light, 1).shortfall == 0


def heavy_total(planets: dict[str, int]) -> int:
    return papa_count(planets, 1).total


def test_the_check_is_not_symmetric() -> None:
    """Practice asks the *boy's* count to be at least the girl's. If this
    ever became symmetric, `_assign_bride_groom` getting the direction wrong
    (F-POR-05) would stop mattering here — and it does matter."""
    light, heavy = _clean(), _clean() | {"SATURN": 7}
    assert papa_samyam(heavy, 1, light, 1).balanced != papa_samyam(light, 1, heavy, 1).balanced


# ── The report lines ───────────────────────────────────────────────────────

def _snap(planets: dict[str, int], lagna: int = 1) -> SimpleNamespace:
    return SimpleNamespace(data=SimpleNamespace(
        planets=[SimpleNamespace(graha=g, rasi=r) for g, r in planets.items()],
        lagna=SimpleNamespace(rasi=lagna),
    ))


def test_a_balanced_pair_reads_as_a_strength_in_both_languages() -> None:
    s_en, s_ta, r_en, r_ta = papa_samyam_lines(_snap(_clean()), _snap(_clean()))
    assert s_en and s_ta and not r_en and not r_ta
    assert "Papa samyam" in s_en[0]
    assert "பாப சாம்யம்" in s_ta[0]


def test_a_short_boy_reads_as_a_risk_and_says_by_how_much() -> None:
    light, heavy = _clean(), _clean() | {"SATURN": 7}
    s_en, s_ta, r_en, r_ta = papa_samyam_lines(_snap(light), _snap(heavy))
    assert r_en and r_ta and not s_en and not s_ta
    assert "falls short by 3" in r_en[0]
    # Advisory voice, per the standing rule: advise, never decide.
    assert "astrologer" in r_en[0]
    assert "ஜோதிடரிடம்" in r_ta[0]


def test_an_unreadable_snapshot_is_logged_and_skipped_not_raised() -> None:
    """One new check must not be able to take down the whole report — but it
    must not pass as "balanced" either."""
    assert papa_samyam_lines(SimpleNamespace(), SimpleNamespace()) == ([], [], [], [])


def test_the_lines_reach_a_real_report(monkeypatch: pytest.MonkeyPatch) -> None:
    """The end-to-end wiring, which is the whole of F-CI-03: the check now
    exists, so what matters is that its line actually lands in the report's
    own lists rather than being computed and dropped.

    The other seven layers are stubbed — they need chart fields a planet/rasi
    fixture does not carry, and none of them is under test here. Papa samyam
    itself is NOT stubbed: it runs against the real snapshots.
    """
    import app.calculations.compatibility_intelligence as ci
    from tests.test_compatibility_intelligence import _stub_strong_layers

    _stub_strong_layers(monkeypatch)
    # ...including papa samyam, which that helper also stubs. Put the real one
    # back: it is the subject here. `papa_samyam_lines` at module scope is the
    # genuine function, bound before any stubbing.
    monkeypatch.setattr(ci, "papa_samyam_lines", papa_samyam_lines)

    light, heavy = _clean(), _clean() | {"SATURN": 7, "MARS": 8}
    result = ci.compute_compatibility_intelligence(
        snap_a=_snap(light), snap_b=_snap(heavy),
        porutham_result=SimpleNamespace(
            total_score=7, max_score=10, percentage=70.0, label="GOOD",
            rajju_dosha=False, vedha_dosha=False,
            nadi_dosha={"has_nadi_dosha": False},
        ),
        synastry_score=60,
    )
    assert any("Papa samyam" in line for line in result.risks_en)
    assert any("பாப சாம்யம்" in line for line in result.risks_ta)
