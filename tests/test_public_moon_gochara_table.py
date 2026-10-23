"""The public Chandrashtama tool's Moon-transit table agrees with the backend (FSA-04).

`web/app/(marketing)/tools/chandrashtama/page.tsx` renders its own 12-sign
Chandra gochara table in the browser. Until 2026-10-21 it called the 5th and 9th
from the janma rasi good and the 7th neutral — the opposite of
`gochara_scores.GOCHARA_FAVOURABLE_FROM_MOON["MOON"]`, so the public tool and the
signed-in Transits card disagreed about the same Moon on the same day.

This parses the page's `favourable:` flags and compares them to the backend set.

BLIND SPOT: it checks the boolean on each row, not the wording beside it. A row
marked `favourable: false` whose text still sounds encouraging would pass.
"""

from __future__ import annotations

import re
from pathlib import Path

import pytest

from app.calculations.gochara_scores import GOCHARA_FAVOURABLE_FROM_MOON

pytestmark = pytest.mark.no_db

PAGE = Path(__file__).resolve().parents[1] / "web" / "app" / "(marketing)" / "tools" / "chandrashtama" / "page.tsx"
_ROW_RE = re.compile(r"^\s*(\d{1,2}):\s*\{\s*favourable:\s*(true|false)\s*,", re.MULTILINE)


def _page_flags() -> dict[int, bool]:
    text = PAGE.read_text(encoding="utf-8")
    return {int(house): flag == "true" for house, flag in _ROW_RE.findall(text)}


def test_page_table_was_parsed() -> None:
    """Guard the guard: a regex that matches nothing proves nothing."""
    assert sorted(_page_flags()) == list(range(1, 13))


def test_public_moon_table_matches_classical_gochara() -> None:
    page_favourable = {house for house, good in _page_flags().items() if good}
    assert page_favourable == set(GOCHARA_FAVOURABLE_FROM_MOON["MOON"])
