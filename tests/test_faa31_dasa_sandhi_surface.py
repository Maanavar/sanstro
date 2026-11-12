"""FAA-31 dasa sandhi surface (docs/GROUP_D_SPECS_2026-11-11.md D4 + §0.4).

The engine was already gated by tests/test_dasa_sandhi.py. This file gates the
**ruled reading** the owner ratified on 2026-11-12: mahadasa level, A_FIXED
+/- 6 months, change-point gap primary, window gap supplementary, 10-year
horizon, no score and no verdict.

Synthetic timelines and synthetic Julian days only; no person, no birth data.
"""
from __future__ import annotations

import json
from datetime import date, timedelta
from pathlib import Path

import pytest

from app.calculations.dasa_sandhi import (
    BAND_CLOSE_MONTHS,
    BAND_NEAR_MONTHS,
    FIXED_MONTHS_RULED,
    HORIZON_YEARS_RULED,
    RULE_SOURCE_ID,
    RULED_OPTION,
    DashaPeriod,
    band_of,
    couple_reading,
    date_to_jd,
    months_to_days,
)
from app.calculations.rule_sources import REGISTRY
from app.schemas.relationships import DasaSandhiData
from app.services import dasa_sandhi_copy as copy

FROM = date(2026, 11, 12)
FROM_JD = date_to_jd(FROM)
GOLDEN = Path(__file__).parent / "golden" / "dasa_sandhi" / "dasa_sandhi_copy.json"

#: A lord order with no repeats, so a transition is identifiable by its lords.
LORDS = ("SUN", "MOON", "MARS", "RAHU", "JUPITER", "SATURN", "MERCURY", "KETU", "VENUS")


def timeline(change_offsets_days: list[float], *, span: float = 4000.0) -> tuple[DashaPeriod, ...]:
    """Contiguous mahadasas whose handovers fall at `FROM + offset` days.

    The first period opens `span` days before the first change and the last
    closes `span` days after the last, so every change is a real handover and
    the horizon never clips a period short.
    """
    bounds = [FROM_JD + o for o in sorted(change_offsets_days)]
    edges = [bounds[0] - span, *bounds, bounds[-1] + span]
    out: list[DashaPeriod] = []
    for i in range(len(edges) - 1):
        s, e = edges[i], edges[i + 1]
        out.append(DashaPeriod(
            level="maha", lord=LORDS[i % len(LORDS)], start_jd=s, end_jd=e,
            start_date=FROM + timedelta(days=s - FROM_JD),
            end_date=FROM + timedelta(days=e - FROM_JD),
            sequence_index=i,
        ))
    return tuple(out)


def read(offsets_a: list[float], offsets_b: list[float], **kw):
    return couple_reading(timeline(offsets_a), timeline(offsets_b), from_date=FROM, **kw)


# ---------------------------------------------------------------------------
# The ruled configuration
# ---------------------------------------------------------------------------

def test_the_ruled_configuration_is_the_default():
    """Mahadasa, A_FIXED +/- 6 months, 10 years (spec §0.4)."""
    r = read([400], [430])
    assert (RULED_OPTION, FIXED_MONTHS_RULED, HORIZON_YEARS_RULED) == ("A_FIXED", 6.0, 10)
    assert r.option == "A_FIXED"
    assert r.fixed_months == 6.0
    assert r.horizon_years == 10
    assert r.horizon_start == FROM


def test_the_reading_cites_the_vendor_practice_and_ships_at_engine_inference():
    """The thresholds are documented practice, not doctrine (OWNER-Q-D2)."""
    r = read([400], [430])
    assert r.rule == RULE_SOURCE_ID == "PROKERALA_PORUTHAM_P17"
    entry = REGISTRY[r.rule]
    assert entry.classification == "vendor_practice"
    assert entry.tier == "engine_inference"
    assert r.tier == "engine_inference"


# ---------------------------------------------------------------------------
# The primary measure: the change-point gap
# ---------------------------------------------------------------------------

@pytest.mark.parametrize(
    "months,expected",
    [
        (0.0, "CLOSE"), (3.0, "CLOSE"), (5.99, "CLOSE"),
        (BAND_CLOSE_MONTHS, "NEAR"), (6.01, "NEAR"), (9.0, "NEAR"), (11.99, "NEAR"),
        (BAND_NEAR_MONTHS, None), (12.01, None), (24.0, None),
    ],
)
def test_band_boundaries(months: float, expected: str | None):
    """Closed at the bottom, open at the top: exactly 6 months reads NEAR and
    exactly 12 months is not flagged at all."""
    assert band_of(months_to_days(months)) == expected


@pytest.mark.parametrize("months,expected", [(3.0, "CLOSE"), (9.0, "NEAR")])
def test_a_pair_carries_the_band_of_its_own_change_gap(months: float, expected: str):
    r = read([400], [400 + months_to_days(months)])
    assert [p.band for p in r.pairs] == [expected]
    assert r.pairs[0].change_gap_days == pytest.approx(months_to_days(months))


def test_a_gap_beyond_twelve_months_is_rejected_by_the_tolerance():
    """Well past the band, the candidate search never offers the pair."""
    r = read([400], [400 + months_to_days(12.5)])
    assert r.pairs == ()
    assert r.band is None


def test_a_gap_of_exactly_twelve_months_is_rejected_by_the_band_filter():
    """**This is the only input that proves the band filter.**

    Two guards sit in series and they disagree at the boundary: the candidate
    tolerance is closed (`<= 12 months`), the band is open (`< 12 months`). So
    everything over 12 months is dropped by the tolerance, and a test at, say,
    12.5 months passes even with the band filter deleted -- it proves the
    tolerance, not the filter. Exactly 12 months is the one gap the tolerance
    admits and the band must refuse.
    """
    exact = months_to_days(BAND_NEAR_MONTHS)
    # The tolerance does admit it: the pair is a candidate.
    from app.calculations.dasa_sandhi import couple_transitions_within

    candidates = couple_transitions_within(
        timeline([400]), timeline([400 + exact]),
        from_jd=FROM_JD, horizon_years=HORIZON_YEARS_RULED, tolerance_days=exact,
    )
    assert len(candidates.pairs) == 1, "the tolerance should admit the boundary pair"
    # And the band filter refuses it, so it never reaches the reading.
    assert band_of(exact) is None
    r = read([400], [400 + exact])
    assert r.pairs == ()
    assert r.band is None
    # One day under, it is read: the boundary is where it is claimed to be.
    assert len(read([400], [400 + exact - 1]).pairs) == 1


def test_the_couples_band_is_its_closest_pair():
    """How the prevalence in §0.4 was measured: CLOSE wins over NEAR."""
    near = read([400], [400 + months_to_days(9)])
    assert near.band == "NEAR"
    both = read([400, 2000], [400 + months_to_days(9), 2000 + months_to_days(2)])
    assert {p.band for p in both.pairs} == {"NEAR", "CLOSE"}
    assert both.band == "CLOSE"


def test_nothing_flagged_gives_no_band_and_no_pairs():
    r = read([400], [400 + months_to_days(30)])
    assert (r.pairs, r.band) == ((), None)


# ---------------------------------------------------------------------------
# The supplementary measure: the window gap
# ---------------------------------------------------------------------------

def test_window_gap_is_the_change_gap_less_twelve_months():
    """Under A_FIXED +/- 6 months the two measures are one, offset by 12
    months. Proven here so nobody reads the window line as new evidence."""
    for months in (0.5, 3.0, 6.0, 9.0, 11.5):
        p = read([400], [400 + months_to_days(months)]).pairs[0]
        assert p.window_gap_days == pytest.approx(p.change_gap_days - months_to_days(12))


def test_a_flagged_pairs_windows_always_overlap_under_the_ruled_window():
    """A corollary of the identity above: the "apart" wording is unreachable
    while the window is +/- 6 months. It is kept for the other options."""
    for months in (0.0, 3.0, 6.0, 11.99):
        p = read([400], [400 + months_to_days(months)]).pairs[0]
        assert p.windows_overlap is True
        assert p.window_gap_days < 0


def test_the_window_gap_never_decides_the_band():
    """Spec §0.2: the practice's own sample rates a 5.8-month window gap as
    satisfactory. Mutating only the window must not move a band."""
    import dataclasses

    p = read([400], [400 + months_to_days(3)]).pairs[0]
    assert p.band == "CLOSE"
    # A pair whose windows are forced apart keeps the band its change gap gave.
    forced = dataclasses.replace(p, window_gap_days=+200.0)
    assert band_of(forced.change_gap_days) == "CLOSE"
    assert forced.windows_overlap is False


# ---------------------------------------------------------------------------
# Horizon and symmetry
# ---------------------------------------------------------------------------

def test_the_horizon_bounds_both_partners():
    """A change beyond the 10-year horizon is not read, even when the other
    partner's change sits right beside it."""
    beyond = 10 * 365.25 + 100
    r = read([beyond], [beyond + 10])
    assert r.pairs == ()
    inside = 9 * 365.25
    assert read([inside], [inside + 10]).pairs != ()


def test_the_horizon_starts_at_the_date_given():
    """The ruling allows a planned marriage date in place of the reference
    date; the engine takes whichever the caller passes."""
    later = FROM + timedelta(days=365)
    r = couple_reading(timeline([400]), timeline([410]), from_date=later)
    assert r.horizon_start == later
    assert r.horizon_end > later
    # The same changes now sit earlier in the horizon, and still pair.
    assert len(r.pairs) == 1


def test_swapping_the_partners_changes_nothing_but_the_sides():
    a, b = timeline([400, 1800]), timeline([400 + months_to_days(3), 1800 + months_to_days(9)])
    forward = couple_reading(a, b, from_date=FROM)
    backward = couple_reading(b, a, from_date=FROM)
    assert forward.band == backward.band
    assert len(forward.pairs) == len(backward.pairs)
    assert [p.band for p in forward.pairs] == [p.band for p in backward.pairs]
    assert [round(p.change_gap_days, 6) for p in forward.pairs] == [
        round(p.change_gap_days, 6) for p in backward.pairs
    ]
    assert forward.swapped().pairs == backward.pairs
    assert forward.swapped().swapped().pairs == forward.pairs


def test_pairs_are_chronological():
    r = read([1800, 400], [1800 + months_to_days(2), 400 + months_to_days(2)])
    assert [p.a.at for p in r.pairs] == sorted(p.a.at for p in r.pairs)


def test_identical_charts_pair_every_change_at_a_zero_gap():
    """The production-path test uses one chart as both partners, so this is the
    shape it must produce: every change coincides, so the gap is 0 (CLOSE) and
    the +/-6-month spans overlap by the full twelve months."""
    t = timeline([400, 1800])
    r = couple_reading(t, t, from_date=FROM)
    assert r.band == "CLOSE"
    assert len(r.pairs) == 2
    for p in r.pairs:
        assert p.change_gap_days == 0
        assert p.a.at == p.b.at and p.a.outgoing == p.b.outgoing
        assert p.window_gap_days == pytest.approx(-months_to_days(12))
        assert p.windows_overlap is True


def test_horizon_years_must_be_positive():
    with pytest.raises(ValueError):
        read([400], [410], horizon_years=0)


# ---------------------------------------------------------------------------
# The wire
# ---------------------------------------------------------------------------

def test_the_wire_carries_graha_keys_and_numbers_only():
    """CLAUDE.md display boundary: no name the server chose."""
    d = DasaSandhiData.from_result(read([400], [400 + months_to_days(3)]))
    assert d.band == "CLOSE"
    p = d.pairs[0]
    for key in (p.outgoing_a, p.incoming_a, p.outgoing_b, p.incoming_b):
        assert key in LORDS, key
    blob = d.model_dump_json(by_alias=True)
    for leaked in ("Mercury", "Saturn", "புதன்", "சனி", "close together", "dosham"):
        assert leaked not in blob, leaked
    assert '"changeGapDays"' in blob and '"windowGapDays"' in blob


def test_the_wire_rounds_the_gaps_to_days_and_keeps_the_sign():
    p = DasaSandhiData.from_result(read([400], [400 + months_to_days(3)])).pairs[0]
    assert p.change_gap_days == round(months_to_days(3))
    assert p.window_gap_days < 0
    assert p.windows_overlap is True


def test_an_empty_reading_serialises_as_no_pairs_and_a_null_band():
    d = DasaSandhiData.from_result(read([400], [400 + months_to_days(30)]))
    assert d.pairs == [] and d.band is None


# ---------------------------------------------------------------------------
# Copy parity with the web
# ---------------------------------------------------------------------------

def test_pdf_copy_reproduces_every_web_line():
    """app/services/dasa_sandhi_copy.py mirrors web/lib/dasa-sandhi-copy.ts;
    the golden file is generated from the web functions (WRITE_GOLDEN=1)."""
    golden = json.loads(GOLDEN.read_text(encoding="utf-8"))
    for c in golden["intro"]:
        assert copy.INTRO[c["lang"]] == c["text"], c
    for c in golden["note"]:
        assert copy.NOTE[c["lang"]] == c["text"], c
    for c in golden["bands"]:
        d = {"band": c["band"], "horizonYears": c["horizonYears"]}
        assert copy.band_line(d, c["lang"]) == c["line"], c
    for c in golden["horizons"]:
        assert copy.horizon(c["couple"], c["lang"]) == c["line"], c
    for c in golden["pairs"]:
        assert copy.pair_line(c["pair"], "Person A", "Person B", c["lang"]) == c["line"], c
        assert copy.window_line(c["pair"], c["lang"]) == c["window"], c
    for c in golden["months"]:
        assert copy.months(c["days"], c["lang"]) == c["text"], c
    # Proof of life: the golden file actually covers both bands, both
    # languages, the empty case and the unreachable "apart" branch.
    assert {c["band"] for c in golden["bands"]} == {"CLOSE", "NEAR", None}
    assert {c["lang"] for c in golden["pairs"]} == {"en", "ta"}
    assert any(not c["pair"]["windowsOverlap"] for c in golden["pairs"])


def test_the_copy_measures_months_the_same_way_the_engine_bands_them():
    """The copy carries its own `DAYS_PER_MONTH` (the web file cannot import
    the engine's). If the two drift, a card could print "6.1 months" beside a
    CLOSE band, which is under six months. The web side is pinned by the
    golden file; this pins the server side to the engine."""
    from app.calculations.dasa_sandhi import DAYS_PER_MONTH

    assert copy.DAYS_PER_MONTH == DAYS_PER_MONTH
    # And the band edge prints as exactly the number the band is named for.
    assert copy.months(months_to_days(BAND_CLOSE_MONTHS), "en") == "6 months"
    assert copy.months(months_to_days(BAND_NEAR_MONTHS), "en") == "12 months"


def test_the_window_line_says_it_restates_the_primary_gap():
    """It must not read as a second, independent finding."""
    p = DasaSandhiData.from_result(read([400], [400 + months_to_days(3)])).pairs[0]
    en = copy.window_line(p, "en")
    assert "restates the gap above rather than adding to it" in en
    assert "கூடுதல் தகவல் அல்ல" in copy.window_line(p, "ta")


def test_no_copy_line_grades_vetoes_or_sells():
    """EC-RULING-06 and the advisory voice, on the server side too."""
    d = DasaSandhiData.from_result(read([400, 1800], [400 + months_to_days(3), 1800 + months_to_days(9)]))
    text = " | ".join(
        line
        for lang in ("en", "ta")
        for line in (
            [copy.INTRO[lang], copy.NOTE[lang], copy.band_line(d, lang), copy.horizon(d, lang)]
            + [copy.pair_line(p, "A", "B", lang) for p in d.pairs]
            + [copy.window_line(p, lang) for p in d.pairs]
        )
    )
    for banned in ("widow", "death", "lifespan", "do not marry", "unsuitable",
                   "parihara", "out of 10", "scored", "deduct"):
        assert banned not in text.lower(), banned
    for banned in ("தோஷம் உள்ளது", "பரிகாரம் செய்", "திருமணம் வேண்டாம்"):
        assert banned not in text, banned
    # And it states what it is not.
    assert "not a dosham" in copy.INTRO["en"]
    assert "changes no score" in copy.INTRO["en"]
