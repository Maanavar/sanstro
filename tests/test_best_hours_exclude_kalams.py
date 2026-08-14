"""A recommended 'best window' must never fall inside an inauspicious kalam.

Regression for the bug where the featured best window (3:35-4:37pm) landed
squarely inside Yamagandam (3:35-5:09pm) — the same day view marks Yamagandam,
Rahu Kalam and Kuligai as periods to avoid, so recommending one as *best*
contradicts the app itself.

The cases below with no `gowri_panchangam` exercise the stale-snapshot fallback
path, which is what `_best_hours` did in full before the Gowri intersection
existed. The intersection itself is covered in test_perfect_best_window.py.
"""
from __future__ import annotations

from datetime import datetime
from types import SimpleNamespace

import pytest

from app.services._dg_hora import _best_hours, _caution_windows


def _slot(h1: int, m1: int, h2: int, m2: int) -> SimpleNamespace:
    d = datetime(2026, 7, 24)
    return SimpleNamespace(start=d.replace(hour=h1, minute=m1), end=d.replace(hour=h2, minute=m2))


def _hora(lord: str, h1: int, m1: int, h2: int, m2: int) -> SimpleNamespace:
    d = datetime(2026, 7, 24)
    return SimpleNamespace(lord=lord, start=d.replace(hour=h1, minute=m1), end=d.replace(hour=h2, minute=m2))


def _panchangam(hora_entries: list[SimpleNamespace]) -> SimpleNamespace:
    return SimpleNamespace(
        abhijit_restricted=True,  # keep Abhijit out of the way for these cases
        abhijit_start=datetime(2026, 7, 24, 12, 3),
        abhijit_end=datetime(2026, 7, 24, 12, 51),
        rahu_kalam=_slot(10, 53, 12, 27),
        yamagandam=_slot(15, 35, 17, 9),   # 3:35pm - 5:09pm, as in the screenshot
        kuligai=_slot(7, 44, 9, 19),
        gowri_panchangam=[],  # stale snapshot — no kala grid to intersect against
        hora=hora_entries,
    )


def _windows_overlap(a, b) -> bool:
    return a.start < b.end and b.start < a.end


@pytest.mark.no_db
def test_best_hour_inside_yamagandam_is_excluded() -> None:
    # A Jupiter (benefic) hora that sits exactly inside Yamagandam.
    p = _panchangam([_hora("GURU", 15, 35, 16, 37)])
    windows, _ = _best_hours(p, current_maha_lord="MOON", lagna_rasi=1, current_antar_lord="MOON")
    assert all(w.start != "15:35" for w in windows), "a best window was placed inside Yamagandam"


@pytest.mark.no_db
def test_clear_benefic_hora_still_offered() -> None:
    # Same Jupiter hora, but at 1:00-2:00pm — clear of every kalam. It must survive.
    p = _panchangam([_hora("GURU", 13, 0, 14, 0)])
    windows, _ = _best_hours(p, current_maha_lord="MOON", lagna_rasi=1, current_antar_lord="MOON")
    assert any(w.start == "13:00" for w in windows), "a clean benefic hora was wrongly dropped"


@pytest.mark.no_db
def test_no_best_window_overlaps_any_kalam() -> None:
    p = _panchangam([
        _hora("GURU", 7, 44, 8, 44),    # inside Kuligai
        _hora("VENUS", 11, 0, 12, 0),   # inside Rahu Kalam
        _hora("MOON", 15, 35, 16, 37),  # inside Yamagandam
        _hora("MERCURY", 13, 0, 14, 0),  # clear
    ])
    best, _ = _best_hours(p, current_maha_lord="MOON", lagna_rasi=1, current_antar_lord="MOON")
    caution = _caution_windows(p)
    # Rebuild kalam intervals from the caution windows and assert zero overlap.
    for b in best:
        for c in caution:
            bw = SimpleNamespace(start=b.start, end=b.end)
            cw = SimpleNamespace(start=c.start, end=c.end)
            assert not _windows_overlap(bw, cw), f"{b.type} overlaps {c.type}"
    assert any(w.start == "13:00" for w in best), "the one clear window should remain"


@pytest.mark.no_db
def test_caution_windows_now_include_all_three_kalams() -> None:
    p = _panchangam([])
    types = {w.type for w in _caution_windows(p)}
    assert types == {"RAHU_KALAM", "YAMAGANDAM", "KULIGAI"}
    assert _caution_windows(p)[0].type == "RAHU_KALAM"  # callers read [0] as Rahu
