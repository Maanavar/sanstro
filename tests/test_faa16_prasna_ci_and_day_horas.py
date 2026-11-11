"""FAA-16 remainder (prasna + two-chart CI strength read gender) and the
_dg_hora daytime split (sunrise→sunset, not the first twelve clock hours).

Synthetic inputs only; no real birth data.
"""
from __future__ import annotations

from datetime import UTC, datetime, timedelta
from types import SimpleNamespace

import pytest

from app.calculations import compatibility_intelligence as ci
from app.calculations.panchangam import PanchangamHoraEntry, PanchangamSlot
from app.calculations.prasna import cast_prasna_chart, prasna_outlook
from app.services import _dg_hora, marriage_service

pytestmark = pytest.mark.no_db

_CHENNAI = {"timezone_name": "Asia/Kolkata", "latitude": 13.0827, "longitude": 80.2707}
_ASKED = datetime(2026, 6, 1, 10, 30)


# ── prasna ──────────────────────────────────────────────────────────────────

def _prasna(gender, area="MARRIAGE"):
    return cast_prasna_chart(
        question_datetime_local=_ASKED, question_area=area, querent_gender=gender, **_CHENNAI
    )


def test_prasna_marriage_karaka_follows_stated_gender():
    assert _prasna("female")["karaka"] == "JUPITER"
    assert _prasna("female")["secondary_karaka"] == "VENUS"
    assert _prasna("male")["karaka"] == "VENUS"
    assert _prasna("male")["secondary_karaka"] == "JUPITER"
    # Case/whitespace tolerant, like marriage_service.stated_gender.
    assert _prasna(" Female ")["karaka"] == "JUPITER"


@pytest.mark.parametrize("gender", [None, "", "not_specified", "UNKNOWN", "other"])
def test_prasna_unknown_gender_reads_both_and_says_so(gender):
    out = _prasna(gender)
    assert {out["karaka"], out["secondary_karaka"]} == {"VENUS", "JUPITER"}
    assert out["querent_gender"] is None
    assert "Gender is not given" in out["outlook_en"]
    assert "பாலினம்" in out["outlook_ta"]
    # The disclosure is not a challenge line.
    assert not any("Gender" in line for line in out["negative_indicators"])


def test_prasna_secondary_karaka_is_shown_but_does_not_move_the_verdict():
    for gender in ("female", "male", None):
        out = _prasna(gender)
        lines = out["positive_indicators"] + out["negative_indicators"]
        noted = [line for line in lines if "noted, not counted" in line]
        assert len(noted) == 1 and noted[0].startswith(out["secondary_karaka"])
        counted = {
            "karaka_house": out["karaka_house"],
            "positive_indicators": [x for x in out["positive_indicators"] if "noted, not counted" not in x],
            "negative_indicators": [x for x in out["negative_indicators"] if "noted, not counted" not in x],
        }
        assert out["outlook"] == prasna_outlook(counted, {})


def test_prasna_gender_is_ignored_outside_marriage():
    for area, karaka in (("CHILDREN", "JUPITER"), ("JOB", "MERCURY")):
        out = _prasna("female", area)
        assert out["karaka"] == karaka
        assert out["secondary_karaka"] is None
        assert "Gender" not in out["outlook_en"]


# ── CI two-chart marriage strength ──────────────────────────────────────────

def _strength_snap(gender, venus_strength, jupiter_strength):
    # Lagna Kadagam (4): the 7th lord is Saturn, left out of the chart, so the
    # 7th-lord terms are fixed (house 0 -> no placement points; default
    # strength 50 -> +2) and the score is 2 + the karaka term.
    planets = [
        SimpleNamespace(graha="VENUS", house_from_lagna=1, strength_score=venus_strength),
        SimpleNamespace(graha="JUPITER", house_from_lagna=1, strength_score=jupiter_strength),
    ]
    return SimpleNamespace(data=SimpleNamespace(
        lagna=SimpleNamespace(rasi=4),
        planets=planets,
        birth_profile=SimpleNamespace(gender_for_traditional_rules=gender),
    ))


def _karaka_term(gender, venus_strength, jupiter_strength):
    return ci._compute_chart_marriage_strength(_strength_snap(gender, venus_strength, jupiter_strength)).score - 2


def test_ci_strength_bride_with_strong_guru_is_not_read_as_weak():
    # Strong Guru (band 3), weak Venus (band 1). Venus-only scored 1.
    # Bride: (3*1.0 + 1*0.5)/1.5 = 2.33 -> 2.
    assert _karaka_term("female", 30, 90) == 2
    s = ci._compute_chart_marriage_strength(_strength_snap("female", 30, 90))
    assert "primary spouse significator Jupiter" in s.note_en or "primary spouse significator Guru" in s.note_en
    groom = ci._compute_chart_marriage_strength(_strength_snap("male", 30, 90))
    assert "primary spouse significator Venus" in groom.note_en


def test_ci_strength_karaka_term_is_a_weighted_mean_of_both_bands():
    # Guru band 3, Venus band 2 (strength 60). Bride: (3 + 1)/1.5 = 2.67 -> 3.
    # Groom: (2 + 1.5)/1.5 = 2.33 -> 2. Unknown: 2.5 -> 3 (half-up, not banker's).
    assert _karaka_term("female", 60, 90) == 3
    assert _karaka_term("male", 60, 90) == 2
    assert _karaka_term(None, 60, 90) == 3
    # Groom with strong Venus, weak Guru: (3 + 0.5)/1.5 = 2.33 -> 2; bride 1.67 -> 2;
    # both weak -> 1; both strong -> 3 on every path.
    for g in ("female", "male", None):
        assert _karaka_term(g, 30, 30) == 1
        assert _karaka_term(g, 90, 90) == 3


def test_ci_strength_unknown_gender_names_both_and_says_why():
    s = ci._compute_chart_marriage_strength(_strength_snap(None, 90, 90))
    assert "gender not given" in s.note_en
    assert "பாலினம்" in s.note_ta


def test_ci_and_marriage_service_share_one_karaka_table():
    for gender in ("female", "male", None):
        payload = SimpleNamespace(gender=gender)
        assert ci._chart_spouse_karakas(ci._stated_gender(gender)) == marriage_service._spouse_karakas(payload)


# ── _dg_hora: daytime is sunrise→sunset ─────────────────────────────────────

_SUNRISE = datetime(2026, 6, 21, 0, 15, tzinfo=UTC)  # synthetic


def _panchangam(daylight_hours: float):
    order = ("SUN", "VENUS", "MERCURY", "MOON", "SATURN", "GURU", "MARS")
    hora = [
        PanchangamHoraEntry(index=i, lord=order[i % 7],
                            start=_SUNRISE + timedelta(hours=i), end=_SUNRISE + timedelta(hours=i + 1))
        for i in range(24)
    ]
    far = _SUNRISE - timedelta(days=1)
    dead = PanchangamSlot(start=far, end=far + timedelta(minutes=1), slot=0)
    return SimpleNamespace(
        sunrise=_SUNRISE,
        sunset=_SUNRISE + timedelta(hours=daylight_hours),
        hora=hora,
        gowri_panchangam=[],
        rahu_kalam=dead, yamagandam=dead, kuligai=dead,
        abhijit_restricted=True,
    )


def test_day_horas_on_a_long_day_include_the_thirteenth():
    p = _panchangam(13.0)
    horas = _dg_hora._day_horas(p)
    assert len(horas) == 13
    assert horas[-1][2] == p.sunset


def test_day_horas_on_a_short_day_stop_at_sunset():
    p = _panchangam(11.25)
    horas = _dg_hora._day_horas(p)
    assert len(horas) == 12
    assert horas[-1][1] == _SUNRISE + timedelta(hours=11)
    assert horas[-1][2] == p.sunset  # clipped, not 12:00 after sunrise
    assert all(end <= p.sunset for _l, _s, end in horas)


def test_fallback_windows_never_run_past_sunset():
    p = _panchangam(11.1)  # last hora clipped to 6 minutes: below the floor
    windows, _ = _dg_hora._best_hours(p, "SUN")
    sunset_hm = _dg_hora._hm(p.sunset)
    ends = [w.end for w in windows]
    assert _dg_hora._hm(_SUNRISE + timedelta(hours=12)) not in ends
    assert sunset_hm not in ends  # the 6-minute sliver is dropped


def test_day_horas_without_sunset_keeps_twelve():
    p = _panchangam(13.0)
    p.sunset = None
    assert len(_dg_hora._day_horas(p)) == 12
