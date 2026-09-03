"""The hero's "Best window" must be the intersection of all three day grids.

Reported 2026-08-14: the Today hero headlined 1:27-2:29 pm as "good for important
tasks" while the panchangam page, on the same screen, marked 1:58-3:31 pm as
Rogam — "avoid new or important work". The hero was picking a whole 62-minute
hora and checking it only against Rahu Kalam / Yamagandam / Kuligai, so a hora
half-spent inside a bad Gowri kala passed the filter untouched.

The fixture is that exact day: Friday, Chennai, sunrise 06:13 / sunset 18:37.
Both grids below are derived from it, not invented — Gowri kalas are daylight/8
(93 min, Friday sequence starting at Sugam with Visham on the Rahu slot) and
horas are daylight/12 (62 min, Friday starting at Venus).
"""
from __future__ import annotations

from datetime import datetime
from types import SimpleNamespace

import pytest

from app.services._dg_hora import _best_hours, _perfect_windows

DAY = datetime(2026, 8, 14)


def _at(hm: str) -> datetime:
    h, m = hm.split(":")
    return DAY.replace(hour=int(h), minute=int(m))


def _kala(name: str, start: str, end: str, slot: int, is_good: bool) -> SimpleNamespace:
    return SimpleNamespace(
        name=name, start=_at(start), end=_at(end), slot=slot, period="DAY", is_good=is_good
    )


def _hora(lord: str, start: str, end: str) -> SimpleNamespace:
    return SimpleNamespace(lord=lord, start=_at(start), end=_at(end))


# Friday day kalas: Sugam, Soram, Uthi, Visham (the Rahu Kalam slot), Amirtham,
# Rogam, Labham, Dhanam.
FRIDAY_KALAS = [
    _kala("SUGAM", "06:13", "07:46", 1, True),
    _kala("SORAM", "07:46", "09:19", 2, False),
    _kala("UTHI", "09:19", "10:52", 3, True),
    _kala("VISHAM", "10:52", "12:25", 4, False),
    _kala("AMIRTHAM", "12:25", "13:58", 5, True),
    _kala("ROGAM", "13:58", "15:31", 6, False),
    _kala("LABHAM", "15:31", "17:03", 7, True),
    _kala("DHANAM", "17:03", "18:37", 8, True),
]

# Friday horas from sunrise: Venus, Mercury, Moon, Saturn, Jupiter, Mars, Sun, …
FRIDAY_HORAS = [
    _hora("VENUS", "06:13", "07:15"),
    _hora("MERCURY", "07:15", "08:17"),
    _hora("MOON", "08:17", "09:19"),
    _hora("SATURN", "09:19", "10:21"),
    _hora("GURU", "10:21", "11:23"),
    _hora("MARS", "11:23", "12:25"),
    _hora("SUN", "12:25", "13:27"),
    _hora("VENUS", "13:27", "14:29"),
    _hora("MERCURY", "14:29", "15:31"),
    _hora("MOON", "15:31", "16:33"),
    _hora("SATURN", "16:33", "17:35"),
    _hora("GURU", "17:35", "18:37"),
]


def _panchangam() -> SimpleNamespace:
    return SimpleNamespace(
        abhijit_restricted=True,  # keep Abhijit out of the ranking for these cases
        abhijit_start=_at("12:01"),
        abhijit_end=_at("12:49"),
        # Friday: Rahu Kalam is day slot 4, Yamagandam slot 7, Kuligai slot 2.
        rahu_kalam=SimpleNamespace(start=_at("10:52"), end=_at("12:25")),
        yamagandam=SimpleNamespace(start=_at("15:31"), end=_at("17:03")),
        kuligai=SimpleNamespace(start=_at("07:46"), end=_at("09:19")),
        gowri_panchangam=FRIDAY_KALAS,
        hora=FRIDAY_HORAS,
    )


# Thulam lagna (rasi 7) → Venus is the lagna lord, so Venus horas are personal.
VENUS_NATIVE = dict(current_maha_lord="MOON", lagna_rasi=7, current_antar_lord="MOON")


@pytest.mark.no_db
def test_best_window_is_trimmed_to_where_the_grids_agree() -> None:
    windows, _ = _perfect_windows(_panchangam(), **VENUS_NATIVE)
    top = windows[0]
    # The Venus hora runs 13:27-14:29 and Amirtham 12:25-13:58. The old code
    # offered the whole hora; the overlap is the only part that is actually both.
    assert (top.start, top.end) == ("13:27", "13:58")
    assert top.kala == "AMIRTHAM"
    assert top.hora_lord == "VENUS"
    assert top.is_personal is True


@pytest.mark.no_db
def test_no_best_window_touches_a_bad_kala() -> None:
    windows, _ = _perfect_windows(_panchangam(), **VENUS_NATIVE)
    bad = [(k.name, k.start, k.end) for k in FRIDAY_KALAS if not k.is_good]
    for w in windows:
        start, end = _at(w.start), _at(w.end)
        for name, bad_start, bad_end in bad:
            assert not (start < bad_end and bad_start < end), f"{w.type} {w.start}-{w.end} overlaps {name}"


@pytest.mark.no_db
def test_the_window_says_what_it_is_made_of() -> None:
    windows, _ = _perfect_windows(_panchangam(), **VENUS_NATIVE)
    assert windows[0].text is not None
    assert "Venus hora inside Amirtham" in windows[0].text.en
    # Tamil is not a translation of the English string — assert the parts.
    assert "அமிர்தம்" in windows[0].text.ta
    assert "சுக்கிரன்" in windows[0].text.ta


@pytest.mark.no_db
def test_the_rogam_collision_is_reported_with_its_cause() -> None:
    _, conflicts = _perfect_windows(_panchangam(), **VENUS_NATIVE)
    rogam = next((c for c in conflicts if c.cause == "ROGAM"), None)
    assert rogam is not None, "the reported bug's own collision went unmentioned"
    # The half of the Venus hora that spills past Amirtham into Rogam.
    assert (rogam.start, rogam.end) == ("13:58", "14:29")
    assert rogam.kind == "BAD_KALA"
    assert "Rogam" in rogam.text.en
    assert "Venus" in rogam.text.en


@pytest.mark.no_db
def test_a_good_kala_inside_a_malefic_hora_is_named_not_hidden() -> None:
    # Uthi 09:19-10:52 opens on a Saturn hora (09:19-10:21). Saturn is malefic for
    # every native, so that stretch is not offered — but the panchangam page
    # prints Uthi as good and no kalam covers it, so nothing else in the app
    # would ever explain the gap.
    _, conflicts = _perfect_windows(_panchangam(), **VENUS_NATIVE)
    saturn = next((c for c in conflicts if c.kind == "MALEFIC_HORA" and c.cause == "SATURN"), None)
    assert saturn is not None
    assert (saturn.start, saturn.end) == ("09:19", "10:21")
    assert "Saturn" in saturn.text.en
    assert "Uthi" in saturn.text.en


@pytest.mark.no_db
def test_conflicts_are_capped_and_lead_with_the_natives_own_hora() -> None:
    _, conflicts = _perfect_windows(_panchangam(), **VENUS_NATIVE)
    assert 0 < len(conflicts) <= 3
    # Venus is the lagna lord, so its 31 minutes lost to Rogam lead — ahead of
    # the longer but impersonal Saturn/Uthi and Mercury/Rogam collisions.
    assert conflicts[0].cause == "ROGAM"
    assert conflicts[0].start == "13:58"


@pytest.mark.no_db
def test_a_kalam_clash_is_filtered_but_not_reported_as_a_hora_collision() -> None:
    # The Moon hora 15:31-16:33 sits in Labham (good) but inside Yamagandam, and
    # the Moon is this native's dasha lord — the single loudest near-miss of the
    # day by duration. It must not appear: the hero's Avoid card already names
    # Yamagandam, and repeating it would push out the collisions nothing else
    # covers. Nor may it be relabelled as a kala or hora problem.
    _, conflicts = _perfect_windows(_panchangam(), **VENUS_NATIVE)
    assert all(c.kind in {"BAD_KALA", "MALEFIC_HORA"} for c in conflicts)
    assert all(c.start != "15:31" for c in conflicts)
    # Same for the Moon hora 08:17-09:19, which is in Soram *and* inside Kuligai.
    assert all(c.start != "08:17" for c in conflicts)


@pytest.mark.no_db
def test_slivers_below_the_actionable_floor_are_not_offered() -> None:
    windows, _ = _perfect_windows(_panchangam(), **VENUS_NATIVE)
    for w in windows:
        span = (_at(w.end) - _at(w.start)).total_seconds() / 60
        assert span >= 15, f"{w.type} is only {span:.0f} minutes — not actionable"


@pytest.mark.no_db
def test_best_hours_puts_the_computed_windows_before_abhijit() -> None:
    p = _panchangam()
    p.abhijit_restricted = False
    windows, _ = _best_hours(p, current_maha_lord="MOON", lagna_rasi=7, current_antar_lord="MOON")
    assert windows[0].kala == "AMIRTHAM"
    assert any(w.type == "ABHIJIT" for w in windows)
    # Abhijit stays unfiltered by design, but must not outrank a computed window.
    assert [w.type for w in windows].index("ABHIJIT") > 0


@pytest.mark.no_db
def test_stale_snapshot_without_kalas_falls_back_instead_of_going_empty() -> None:
    p = _panchangam()
    p.gowri_panchangam = []
    windows, conflicts = _best_hours(p, current_maha_lord="MOON", lagna_rasi=7, current_antar_lord="MOON")
    assert windows, "a snapshot with no kala grid must still offer whole horas"
    assert conflicts == []
    # The fallback knows nothing about kalas and must not pretend otherwise.
    assert all(w.kala is None and w.text is None for w in windows)
