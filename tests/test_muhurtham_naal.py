"""Tests for the curated muhurtham-naal listing and chart-matched ranking.

These do not touch the ephemeris or the database — the naal data is baked and
the matching is pure arithmetic — so they run anywhere (no swisseph / no DB).
"""
from __future__ import annotations

import uuid
from datetime import datetime, time
from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from app.calculations.astro import RASI_NAMES
from app.data.muhurtham_naals import available_years, get_muhurtham_naals
from app.models import BirthProfile, Chart
from app.services import muhurtham_naal_service as svc

pytestmark = pytest.mark.no_db


def test_2026_sheet_has_55_dates_with_expected_pirai_split():
    naals = get_muhurtham_naals(2026)
    assert len(naals) == 55
    valar = sum(1 for n in naals if n.pirai == "VALARPIRAI")
    thei = sum(1 for n in naals if n.pirai == "THEIPIRAI")
    assert (valar, thei) == (25, 30)
    # every curated date resolves to an auspicious driving star
    for n in naals:
        assert n.nakshatra_name in svc.NAKSHATRA_NAMES


def test_2027_sheet_has_74_dates_with_expected_pirai_split():
    naals = get_muhurtham_naals(2027)
    assert len(naals) == 74
    valar = sum(1 for n in naals if n.pirai == "VALARPIRAI")
    thei = sum(1 for n in naals if n.pirai == "THEIPIRAI")
    assert (valar, thei) == (37, 37)
    assert available_years() == [2026, 2027]
    for n in naals:
        assert n.nakshatra_name in svc.NAKSHATRA_NAMES


def test_list_filters_and_unknown_year():
    assert len(svc.list_muhurtham_naals(2026)) == 55
    feb = svc.list_muhurtham_naals(2026, month=2)
    assert {v.date[:7] for v in feb} == {"2026-02"}
    valar = svc.list_muhurtham_naals(2026, pirai="VALARPIRAI")
    assert all("Valarpirai" in v.pirai.en for v in valar)
    with pytest.raises(HTTPException) as exc:
        svc.list_muhurtham_naals(2030)
    assert exc.value.status_code == 404


@pytest.mark.parametrize(
    "janma,day,expected_tara,expected_quality",
    [
        (4, 4, 1, "NEUTRAL"),   # same star -> Janma
        (1, 2, 2, "GOOD"),      # Aswini -> Bharani -> Sampat
        (1, 3, 3, "AVOID"),     # Aswini -> Karthigai -> Vipat
        (1, 9, 9, "GOOD"),      # Aswini -> Ayilyam -> Parama Mitra
        (1, 7, 7, "AVOID"),     # Aswini -> Punarpoosam -> Naidhana
    ],
)
def test_tara_number_and_quality(janma, day, expected_tara, expected_quality):
    tara = svc._tara_number(janma, day)
    assert tara == expected_tara
    assert svc.TARA_QUALITY[tara] == expected_quality


class _FakeChart:
    def __init__(self, janma_nakshatra: str, moon_rasi: str):
        self.janma_nakshatra = janma_nakshatra
        self.moon_rasi = moon_rasi


class _FakeSession:
    def __init__(self, chart):
        self._chart = chart

    def get(self, model, _id):
        if model is Chart:
            return self._chart
        if model is BirthProfile:
            return None
        raise AssertionError(f"Unexpected model: {model}")


def test_match_ranks_and_flags_chandrashtama_for_rohini():
    # Rohini native (rasi Rishabam=2). Chandrashtama rasi = 9 (Dhanusu).
    session = _FakeSession(_FakeChart("ROHINI", "Rishabam"))
    matches, ctx = svc.match_muhurtham_naals(uuid.uuid4(), 2026, session)

    assert ctx["total_count"] == 55
    assert ctx["chandrashtama_rasi_number"] == 9
    assert 0 < ctx["recommended_count"] < 55
    assert ctx["daily_location"] is None

    # sorted best-first by score, ties by earliest date
    scores = [m.match_score for m in matches]
    assert scores == sorted(scores, reverse=True)

    # Moolam days (rasi Dhanusu=9) are both Naidhana tara AND chandrashtama -> 0
    moolam = [m for m in matches if m.naal.nakshatra.en == "Moolam"]
    assert moolam, "expected Moolam muhurtham dates in 2026 sheet"
    for m in moolam:
        assert m.is_chandrashtama is True
        assert m.is_recommended is False
        assert m.match_score == 0

    # recommended entries are GOOD tara and never chandrashtama
    for m in matches:
        if m.is_recommended:
            assert m.tara_quality == "GOOD"
            assert m.is_chandrashtama is False
        assert len(m.reasons) >= 2  # tara reason + chandrashtama line


def test_match_recommended_only_filter():
    session = _FakeSession(_FakeChart("ROHINI", "Rishabam"))
    all_matches, ctx = svc.match_muhurtham_naals(uuid.uuid4(), 2026, session)
    rec_only, _ = svc.match_muhurtham_naals(
        uuid.uuid4(), 2026, session, recommended_only=True,
    )
    assert len(rec_only) == ctx["recommended_count"]
    assert all(m.is_recommended for m in rec_only)


def test_chart_match_uses_computed_location_specific_nalla_neram(monkeypatch):
    """The public table stays static; a chart match must use its daily location."""
    profile_id = uuid.uuid4()

    class _ChartWithProfile(_FakeChart):
        birth_profile_id = profile_id

    class _Profile:
        birth_place = "Synthetic birthplace"
        birth_latitude = 10.0
        birth_longitude = 76.0
        birth_timezone = "Asia/Kolkata"
        current_place = "Synthetic current place"
        current_latitude = 11.0
        current_longitude = 77.0
        current_timezone = "Asia/Kolkata"

    class _SessionWithProfile(_FakeSession):
        def get(self, model, _id):
            if model is Chart:
                return self._chart
            if model is BirthProfile:
                return _Profile()
            return None

    def _snapshots(start, end, lat, lon, tz, *, session, only=None):
        assert (lat, lon, tz) == (11.0, 77.0, "Asia/Kolkata")
        # The curated sheet is ~55 dates scattered over a year. Without `only`
        # the range call fills every day between the first and last — ~360
        # computations to answer about 55, which 502'd the endpoint at the
        # proxy's 300 s limit the first time a year came up cache-cold.
        assert only == {n.date for n in get_muhurtham_naals(2026)}
        slot = SimpleNamespace(
            start=datetime(2026, 1, 1, 8, 12),
            end=datetime(2026, 1, 1, 9, 7),
            period="AM",
        )
        return {
            # No windows = the pre-v44 cache case, which sends the Chandrashtama
            # reading down its rasi fallback. This test is about Nalla Neram;
            # the two-tier reading has its own below.
            n.date: SimpleNamespace(nalla_neram=[slot], chandrashtamam_janma_nakshatra_windows=())
            for n in get_muhurtham_naals(2026)
        }

    monkeypatch.setattr(svc, "calculate_daily_panchangam_range", _snapshots)
    matches, _ = svc.match_muhurtham_naals(
        uuid.uuid4(), 2026, _SessionWithProfile(_ChartWithProfile("ROHINI", "Rishabam"))
    )

    assert all(match.naal.nalla_neram[0].start == "08:12" for match in matches)


def _match_with_affected_star(monkeypatch, affected_star_number: int):
    """Run the chart match with every date's Chandrashtama touching one star."""
    profile_id = uuid.uuid4()

    class _ChartWithProfile(_FakeChart):
        birth_profile_id = profile_id

    class _Profile:
        birth_place = "Synthetic birthplace"
        birth_latitude = 10.0
        birth_longitude = 76.0
        birth_timezone = "Asia/Kolkata"
        current_place = "Synthetic current place"
        current_latitude = 11.0
        current_longitude = 77.0
        current_timezone = "Asia/Kolkata"

    class _SessionWithProfile(_FakeSession):
        def get(self, model, _id):
            if model is Chart:
                return self._chart
            if model is BirthProfile:
                return _Profile()
            return None

    slot = SimpleNamespace(
        start=datetime(2026, 1, 1, 8, 12), end=datetime(2026, 1, 1, 9, 7), period="AM",
    )

    def _snapshots(start, end, lat, lon, tz, *, session, only=None):
        # `rasi_number` is part of a real window and part of the match: nine
        # stars straddle a rasi boundary, so the veto tests star AND rasi. The
        # reader below is Rohini/Rishabam, so 2 is the rasi that makes the day
        # theirs — a stub without it would exercise the pre-v45 fallback instead
        # of the rule. Rohini and Krittika both touch Rishabam, so this is a
        # coherent value for either star the callers pass.
        #
        # `start`/`end` are the day's own edges, because the D11 ruling made the
        # match ask which day a window NAMES: sunrise to next sunrise, with a
        # window that opens late and outlasts the day belonging to tomorrow. A
        # lone window spanning its whole day is the "all day, and it is yours"
        # case, which is what these tests mean by "every date is this reader's".
        window = SimpleNamespace(
            name=svc.NAKSHATRA_NAMES[affected_star_number - 1],
            rasi_number=2,
            start=datetime(2026, 1, 1, 6, 0),
            end=datetime(2026, 1, 2, 6, 0),
        )
        return {
            n.date: SimpleNamespace(
                nalla_neram=[slot],
                chandrashtamam_janma_nakshatra_windows=(window,),
            )
            for n in get_muhurtham_naals(2026)
        }

    monkeypatch.setattr(svc, "calculate_daily_panchangam_range", _snapshots)
    matches, _ = svc.match_muhurtham_naals(
        uuid.uuid4(), 2026, _SessionWithProfile(_ChartWithProfile("ROHINI", "Rishabam")),
    )
    return matches


# Rohini is star 4 and rasi Rishabam (2), so its Chandrashtama rasi is Dhanusu
# (9) — the sign Moolam, Pooradam and Uthiradam sit in.
ROHINI_STAR = 4
KRITTIKA_STAR = 3


def test_the_readers_own_star_window_vetoes_a_muhurtham_date(monkeypatch):
    """Owner ruling 2026-09-09: the star window is the hard avoid."""
    matches = _match_with_affected_star(monkeypatch, ROHINI_STAR)

    # The stub gives every date to Rohini, so every date is this reader's.
    assert matches
    for m in matches:
        assert m.is_chandrashtama is True
        assert m.is_recommended is False
        assert any("Chandrashtama for your star Rohini" in r.en for r in m.reasons)


def test_the_rasi_span_cautions_without_vetoing(monkeypatch):
    """Same dates, but the day belongs to another star.

    Before the ruling all 2.25 days of the Moon's transit of the 8th were a hard
    veto, so these dates were marked "Chandrashtama for you, avoid" while the
    dashboard badged only one of them. They now carry a mild penalty and stay
    eligible.
    """
    vetoed = {m.naal.date: m for m in _match_with_affected_star(monkeypatch, ROHINI_STAR)}
    cautioned = _match_with_affected_star(monkeypatch, KRITTIKA_STAR)

    # Keyed off the naal's own rasi number, not its star name: Uthiradam sits in
    # Makaram in this sheet (only its first pada is Dhanusu), so a name filter
    # would sweep in dates that are not in this reader's 8th at all.
    dhanusu_dates = {
        n.date.isoformat() for n in get_muhurtham_naals(2026) if n.moon_rasi_number == 9
    }
    in_rasi = [m for m in cautioned if m.naal.date in dhanusu_dates]
    assert in_rasi, "expected Dhanusu-rasi dates in the 2026 sheet"

    for soft in in_rasi:
        assert soft.is_chandrashtama is False
        assert any("mild caution" in r.en for r in soft.reasons)
        # Cautioned, not cleared: scores above the same date's hard-veto reading,
        # and never zeroed by Chandrashtama alone.
        assert soft.match_score > vetoed[soft.naal.date].match_score
        if soft.tara_quality == "GOOD":
            assert soft.is_recommended is True

    # And a date outside the 8th sign gets neither line.
    outside = [m for m in cautioned if m.naal.date not in dhanusu_dates]
    assert outside
    assert all(
        any("No Chandrashtama for your star" in r.en for r in m.reasons) for m in outside
    )


def test_match_unknown_chart_or_year():
    with pytest.raises(HTTPException) as exc:
        svc.match_muhurtham_naals(uuid.uuid4(), 2030, _FakeSession(_FakeChart("ROHINI", "Rishabam")))
    assert exc.value.status_code == 404

    class _NoneSession:
        def get(self, model, _id):
            return None

    with pytest.raises(HTTPException) as exc2:
        svc.match_muhurtham_naals(uuid.uuid4(), 2026, _NoneSession())
    assert exc2.value.status_code == 404


def test_a_single_chart_reports_one_governing_reading():
    session = _FakeSession(_FakeChart("ROHINI", "Rishabam"))
    matches, ctx = svc.match_muhurtham_naals(uuid.uuid4(), 2026, session)
    assert ctx["partner"] is None and ctx["subject_who"] is None
    for m in matches:
        assert len(m.readings) == 1
        (reading,) = m.readings
        assert reading.who is None and reading.governs is True
        assert reading.tara_number == m.tara_number


# ── Couples (2026-09-15) ──────────────────────────────────────────────────────
#
# A published wedding date is read against both charts and the weaker side
# governs each check (docs/MUHURTA_COUPLE_MODE_2026-09-12.md, R1). These are
# properties of a *pair*, so they sweep star pairs, not dates.


class _PairSession:
    def __init__(self, charts: dict, profiles: dict):
        self._charts = charts
        self._profiles = profiles

    def get(self, model, key):
        if model is Chart:
            return self._charts.get(key)
        if model is BirthProfile:
            return self._profiles.get(key)
        raise AssertionError(f"Unexpected model: {model}")


def _saved_chart(star: str, rasi_number: int, *, birth_time: time | None = time(6, 30)):
    """(chart_id, chart, profile_id, profile) for a synthetic saved chart."""
    profile_id = uuid.uuid4()
    chart = SimpleNamespace(
        janma_nakshatra=star, moon_rasi=RASI_NAMES[rasi_number], birth_profile_id=profile_id,
    )
    profile = SimpleNamespace(
        birth_place="Synthetic birthplace", birth_latitude=10.0, birth_longitude=76.0,
        birth_timezone="Asia/Kolkata", current_place="Synthetic current place",
        current_latitude=11.0, current_longitude=77.0, current_timezone="Asia/Kolkata",
        birth_time_local=birth_time,
    )
    return uuid.uuid4(), chart, profile_id, profile


def _pair_session(*entries) -> _PairSession:
    return _PairSession(
        {chart_id: chart for chart_id, chart, _, _ in entries},
        {profile_id: profile for _, _, profile_id, profile in entries},
    )


@pytest.fixture()
def _rasi_fallback_snapshots(monkeypatch):
    """Snapshots with no star windows, so Chandrashtama is read by rasi alone.

    That keeps each date's verdict a pure function of the two charts' rasis,
    which is what lets the sweep compare a couple against its two halves.
    """
    slot = SimpleNamespace(start=datetime(2026, 1, 1, 8, 12), end=datetime(2026, 1, 1, 9, 7), period="AM")

    def _snapshots(start, end, lat, lon, tz, *, session, only=None):
        return {
            day: SimpleNamespace(nalla_neram=[slot], chandrashtamam_janma_nakshatra_windows=())
            for day in (only or ())
        }

    monkeypatch.setattr(svc, "calculate_daily_panchangam_range", _snapshots)


# One star per quality neighbourhood, spread across the zodiac so Chandrashtama
# lands on different dates for each.
_SWEEP_CHARTS = [
    ("ROHINI", 2), ("ASWINI", 1), ("MOOLAM", 9),
    ("HASTHAM", 6), ("REVATHI", 12), ("POOSAM", 4),
]


@pytest.mark.usefixtures("_rasi_fallback_snapshots")
def test_a_couple_is_never_ranked_above_either_half_of_it():
    entries = [_saved_chart(star, rasi) for star, rasi in _SWEEP_CHARTS]
    session = _pair_session(*entries)
    solo = {
        chart_id: {m.naal.date: m for m in svc.match_muhurtham_naals(chart_id, 2026, session)[0]}
        for chart_id, *_ in entries
    }

    for a, *_ in entries:
        for b, *_ in entries:
            if a == b:
                continue
            couple, ctx = svc.match_muhurtham_naals(
                a, 2026, session, partner_chart_id=b, subject_role="BRIDE",
            )
            assert len(couple) == 55
            for m in couple:
                sa, sb = solo[a][m.naal.date], solo[b][m.naal.date]
                assert m.match_score <= min(sa.match_score, sb.match_score)
                # Recommended for a couple means recommended for each of them —
                # no more, and no less.
                assert m.is_recommended == (sa.is_recommended and sb.is_recommended)
                assert m.is_chandrashtama == (sa.is_chandrashtama or sb.is_chandrashtama)
                assert [r.governs for r in m.readings].count(True) == 1
                governing = next(r for r in m.readings if r.governs)
                assert (governing.tara_number, governing.tara_quality) == (m.tara_number, m.tara_quality)
            assert ctx["recommended_count"] <= min(
                sum(s.is_recommended for s in solo[a].values()),
                sum(s.is_recommended for s in solo[b].values()),
            )


@pytest.mark.usefixtures("_rasi_fallback_snapshots")
def test_two_charts_with_one_star_score_exactly_as_one_chart():
    """The no-double-counting check: the same reading twice is still one reading.

    Summing the personal layer would dock a shared Chandrashtama twice and pass
    every other test here.
    """
    first, second = _saved_chart("MOOLAM", 9), _saved_chart("MOOLAM", 9)
    session = _pair_session(first, second)
    solo = {m.naal.date: m for m in svc.match_muhurtham_naals(first[0], 2026, session)[0]}
    couple, _ = svc.match_muhurtham_naals(first[0], 2026, session, partner_chart_id=second[0])

    for m in couple:
        assert m.match_score == solo[m.naal.date].match_score
        assert not any("weaker tara" in r.en for r in m.reasons)
    shared = [m for m in couple if m.is_chandrashtama]
    assert shared, "expected Kadagam-Moon dates in the 2026 sheet"
    for m in shared:
        assert any("counted once" in r.en for r in m.reasons)


@pytest.mark.usefixtures("_rasi_fallback_snapshots")
def test_each_reading_names_whose_chart_it_read():
    bride, groom = _saved_chart("ROHINI", 2), _saved_chart("ASWINI", 1)
    session = _pair_session(bride, groom)
    matches, ctx = svc.match_muhurtham_naals(
        bride[0], 2026, session, partner_chart_id=groom[0], subject_role="BRIDE",
    )

    assert ctx["subject_who"].en == "Bride"
    assert ctx["partner"]["who"].en == "Groom"
    assert ctx["partner"]["janma_nakshatra"].en == "Aswini"
    for m in matches:
        assert [r.who.en for r in m.readings] == ["Bride", "Groom"]
        assert not any("your star" in r.en for r in m.reasons)
        # "Your star", twice, is two true sentences a reader cannot tell apart.
        assert any(r.en.startswith("Bride — ") for r in m.reasons)
        assert any(r.en.startswith("Groom — ") for r in m.reasons)
        assert any(r.ta.startswith("மணமகள் — ") for r in m.reasons)
        scores = {svc.TARA_SCORE[r.tara_number] for r in m.readings}
        priced = [r for r in m.reasons if "weaker tara" in r.en]
        # The priced-vs-shown sentence appears exactly when it changed the score.
        assert len(priced) == (1 if len(scores) == 2 else 0)

    # The groom being named first makes him the subject, not the bride.
    swapped, swapped_ctx = svc.match_muhurtham_naals(
        bride[0], 2026, session, partner_chart_id=groom[0], subject_role="GROOM",
    )
    assert (swapped_ctx["subject_who"].en, swapped_ctx["partner"]["who"].en) == ("Groom", "Bride")
    # Labels only: the ranking itself cannot depend on who is called what.
    assert [m.match_score for m in swapped] == [m.match_score for m in matches]


@pytest.mark.usefixtures("_rasi_fallback_snapshots")
def test_an_unnamed_couple_is_told_apart_by_position():
    first, second = _saved_chart("ROHINI", 2), _saved_chart("ASWINI", 1)
    session = _pair_session(first, second)
    matches, _ = svc.match_muhurtham_naals(first[0], 2026, session, partner_chart_id=second[0])
    assert [r.who.en for r in matches[0].readings] == ["First chart", "Second chart"]


def test_a_chart_cannot_be_its_own_partner():
    chart = _saved_chart("ROHINI", 2)
    with pytest.raises(HTTPException) as exc:
        svc.match_muhurtham_naals(chart[0], 2026, _pair_session(chart), partner_chart_id=chart[0])
    assert exc.value.status_code == 422


@pytest.mark.parametrize("untimed_side,named", [("partner", "Groom"), ("subject", "Bride")])
def test_a_couple_needs_both_birth_times(untimed_side, named):
    bride = _saved_chart("ROHINI", 2, birth_time=None if untimed_side == "subject" else time(6, 30))
    groom = _saved_chart("ASWINI", 1, birth_time=None if untimed_side == "partner" else time(6, 30))
    with pytest.raises(HTTPException) as exc:
        svc.match_muhurtham_naals(
            bride[0], 2026, _pair_session(bride, groom), partner_chart_id=groom[0], subject_role="BRIDE",
        )
    assert exc.value.status_code == 422
    # Naming which chart failed; two identical-looking choices need that.
    assert exc.value.detail.startswith(f"{named}:")
