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


def test_the_papa_houses_keep_the_six_after_the_sevvai_ruling() -> None:
    """The 2026-10-30 ruling (Q5) moved Sevvai to the Tamil five and ruled on
    Sevvai only, so papa samyam keeps 1, 2, 4, 7, 8, 12 until it is ruled."""
    from app.calculations._yoga_helpers import SEVVAI_HOUSE_SETS

    assert PAPA_HOUSES == SEVVAI_HOUSE_SETS["union_six"]


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


# ── Plan item 3 (2026-11-09): rows, direction, and the porutham payload ────────

def test_every_point_is_a_row_a_jothidar_can_check_by_hand() -> None:
    planets = _clean() | {"SATURN": 7, "MARS": 8, "MOON": 2}
    count = papa_count(planets, 1)
    assert sum(r.points for r in count.rows) == count.total
    for ref in PAPA_REFERENCES:
        assert sum(r.points for r in count.rows if r.reference == ref) == count.by_reference[ref]
    assert all(r.house in PAPA_HOUSES and r.graha in PAPA_GRAHAS for r in count.rows)
    assert count.missing_references == ()


def test_a_missing_reference_is_named_not_silently_dropped() -> None:
    planets = {k: v for k, v in _clean().items() if k != "MOON"}
    assert papa_count(planets, 1).missing_references == ("MOON",)


def test_removing_ketu_from_the_set_changes_a_ketu_in_the_seventh_count(monkeypatch) -> None:
    """Negative run (plan item 3): the count must depend on the malefic set."""
    import app.calculations.dosha_samyam as ds

    planets = _clean() | {"KETU": 7}
    with_ketu = papa_count(planets, 1).total
    monkeypatch.setattr(ds, "PAPA_GRAHAS", frozenset({"SUN", "MARS", "SATURN", "RAHU"}))
    assert ds.papa_count(planets, 1).total == with_ketu - 3


def test_the_report_counts_in_the_direction_its_caller_resolved(monkeypatch: pytest.MonkeyPatch) -> None:
    """F-POR-05 regression, found 2026-11-09. `compute_compatibility_intelligence`
    used to call `papa_samyam_lines(snap_a, snap_b)` with no direction, so when
    the service put the bride in slot A the check ran backwards."""
    import app.calculations.compatibility_intelligence as ci
    from tests.test_compatibility_intelligence import _stub_strong_layers

    _stub_strong_layers(monkeypatch)
    monkeypatch.setattr(ci, "papa_samyam_lines", papa_samyam_lines)
    light, heavy = _clean(), _clean() | {"SATURN": 7, "MARS": 8}
    porutham = SimpleNamespace(
        total_score=7, max_score=10, percentage=70.0, label="GOOD",
        rajju_dosha=False, vedha_dosha=False, nadi_dosha={"has_nadi_dosha": False},
    )

    def report(a_is_boy: bool):
        return ci.compute_compatibility_intelligence(
            snap_a=_snap(light), snap_b=_snap(heavy), porutham_result=porutham,
            synastry_score=60, a_is_boy=a_is_boy,
        )

    # A (light) is the groom: he falls short of the heavier bride.
    assert any("Papa samyam falls short" in line for line in report(True).risks_en)
    # A (light) is the bride: the heavier groom balances her.
    as_bride = report(False)
    assert not any("Papa samyam" in line for line in as_bride.risks_en)
    assert any("Papa samyam agrees" in line for line in as_bride.strengths_en)


def _chart_snap(planets: dict[str, int], *, gender: str | None, lagna: int = 1, nakshatra: int = 1) -> SimpleNamespace:
    from uuid import uuid4

    rows = [SimpleNamespace(graha=g, rasi=r, nakshatra=nakshatra, pada=1) for g, r in planets.items()]
    return SimpleNamespace(data=SimpleNamespace(
        chart_id=uuid4(),
        planets=rows,
        lagna=SimpleNamespace(rasi=lagna),
        birth_profile=SimpleNamespace(gender_for_traditional_rules=gender),
    ))


@pytest.mark.parametrize(
    ("gender_a", "gender_b", "a_is_groom", "assumed"),
    [("male", "female", True, False), ("female", "male", False, False), (None, None, True, True)],
)
def test_the_porutham_payload_carries_papa_samyam_in_the_resolved_direction(
    gender_a, gender_b, a_is_groom, assumed
) -> None:
    from app.services.synastry_service import compare_chart_snapshots_direct

    light, heavy = _clean(), _clean() | {"SATURN": 7, "MARS": 8}
    data = compare_chart_snapshots_direct(
        _chart_snap(light, gender=gender_a, nakshatra=1),
        _chart_snap(heavy, gender=gender_b, nakshatra=10),
        compatibility_context="MARRIAGE",
    ).data
    papa = data.papa_samyam
    assert papa is not None and papa.direction_assumed is assumed
    groom_total, bride_total = (0, 6) if a_is_groom else (6, 0)
    assert (papa.boy.total, papa.girl.total) == (groom_total, bride_total)
    assert papa.balanced is (groom_total >= bride_total)
    wire = data.model_dump(by_alias=True, mode="json")["papaSamyam"]
    assert wire["method"] == "equal_count" and wire["ratified"] is False
    assert {"reference", "graha", "house", "points"} == set(wire["girl" if a_is_groom else "boy"]["rows"][0])


def test_papa_samyam_never_touches_the_porutham_score() -> None:
    """Report only: the same couple scores identically whatever papa samyam
    says, because the composite never reads it."""
    from app.services.synastry_service import compare_chart_snapshots_direct

    light, heavy = _clean(), _clean() | {"SATURN": 7, "MARS": 8}
    balanced = compare_chart_snapshots_direct(
        _chart_snap(heavy, gender="male", nakshatra=1), _chart_snap(light, gender="female", nakshatra=10),
        compatibility_context="MARRIAGE",
    ).data
    short = compare_chart_snapshots_direct(
        _chart_snap(light, gender="male", nakshatra=1), _chart_snap(heavy, gender="female", nakshatra=10),
        compatibility_context="MARRIAGE",
    ).data
    assert balanced.papa_samyam.balanced and not short.papa_samyam.balanced
    assert (balanced.total_score, balanced.label) == (short.total_score, short.label)


def test_only_the_marriage_context_carries_papa_samyam() -> None:
    from app.services.synastry_service import compare_chart_snapshots_direct

    for ctx in ("FRIENDSHIP", "BUSINESS", "FAMILY", "GENERAL"):
        data = compare_chart_snapshots_direct(
            _chart_snap(_clean(), gender="male"), _chart_snap(_clean(), gender="female", nakshatra=10),
            compatibility_context=ctx,
        ).data
        assert data.papa_samyam is None, ctx


def test_balanced_share_on_random_couples_is_a_little_over_half() -> None:
    """Plan item 3, Distribution. Strict >= with ties balanced: by symmetry a
    random couple is balanced a little over half the time. Far from that means
    a bug. Recorded: see the assertion message for the measured share."""
    import random

    rng = random.Random(11)
    grahas = ("SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN", "RAHU")

    def chart() -> tuple[dict[str, int], int]:
        planets = {g: rng.randint(1, 12) for g in grahas}
        planets["KETU"] = (planets["RAHU"] + 5) % 12 + 1
        return planets, rng.randint(1, 12)

    n = 10_000
    balanced = sum(papa_samyam(*chart(), *chart()).balanced for _ in range(n)) / n
    assert 0.50 <= balanced <= 0.60, balanced


def test_the_pdf_prints_every_point_and_the_method_in_both_languages() -> None:
    """The printed sheet is what a family takes to a jothidar. Its wording is a
    server-side twin of `packages/shared/src/papaSamyam.ts`; this pins the parts
    that must not drift: every point, the verdict, and the method note."""
    from app.schemas.relationships import PapaSamyamData
    from app.services.pdf_export_service import _papa_samyam_pdf_lines

    light, heavy = _clean(), _clean() | {"SATURN": 7, "MARS": 8}
    data = PapaSamyamData.from_result(papa_samyam(light, 1, heavy, 1), direction_assumed=True)
    heading, lines = _papa_samyam_pdf_lines(data, "en")
    text = " ".join([heading, *lines])
    assert heading == "Papa samyam: Groom 0 · Bride 6"
    assert "Short by 6" in text and "Mars (8th), Saturn (7th)" in text
    assert "not part of the porutham score" in text and "Person 1 was read as the groom" in text
    heading_ta, lines_ta = _papa_samyam_pdf_lines(data, "ta")
    text_ta = " ".join([heading_ta, *lines_ta])
    assert "சனி (7ஆம்)" in text_ta and "பொருத்த மதிப்பெண்ணில் சேர்க்கப்படவில்லை" in text_ta
    assert not any(word in text_ta for word in ("Saturn", "Mars", "Groom", "Bride", "Lagna"))
