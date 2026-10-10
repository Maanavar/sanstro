"""Yoga display names: one canon, two runtimes, full registry coverage.

`packages/shared/src/yogaDisplay.ts` is the canonical name table (web and
mobile). `app/calculations/yoga_display.py` is the backend's copy, used where
the server renders text itself (the astrologer PDF, FTR-22). Two failure modes
are guarded:

1. The copies drift — a rename lands in one runtime only.
2. The rule registry defines a yoga the table has no name for, so every surface
   prints the raw engine code. Found 2026-10-04: KARTARI_YOGA rendered as
   "KARTARI_YOGA" in both languages; seven registry rows had no entry.

Pure source parsing — no database.
"""
from __future__ import annotations

import re
from pathlib import Path

import pytest

from app.calculations.yoga_display import YOGA_DISPLAY, yoga_display_name
from app.calculations.yoga_rules import YOGA_RULES

pytestmark = pytest.mark.no_db

_TS = Path(__file__).resolve().parents[1] / "packages" / "shared" / "src" / "yogaDisplay.ts"
_ROW = re.compile(r'^\s*([A-Z0-9_]+):\s*\{\s*ta:\s*"([^"]+)",\s*en:\s*"([^"]+)"\s*\},', re.M)


def _ts_table() -> dict[str, tuple[str, str]]:
    source = _TS.read_text(encoding="utf-8")
    body = source.split("export const YOGA_DISPLAY", 1)[1].split("\n};", 1)[0]
    return {key: (ta, en) for key, ta, en in _ROW.findall(body)}


def test_the_parser_reads_the_whole_ts_table() -> None:
    # Baseline: a regex that silently matched nothing would make parity vacuous.
    table = _ts_table()
    entries = sum(1 for line in _TS.read_text(encoding="utf-8").splitlines() if re.match(r"^\s*[A-Z0-9_]+:\s*\{\s*ta:", line))
    assert len(table) == entries > 40


def test_backend_copy_matches_the_shared_table() -> None:
    assert YOGA_DISPLAY == _ts_table()


def test_every_registered_yoga_has_a_display_name() -> None:
    missing = sorted(
        rule.yoga_name
        for rule in YOGA_RULES
        if rule.yoga_name and rule.yoga_name.upper() not in YOGA_DISPLAY
    )
    assert not missing, f"registry yogas with no display name (would print the raw code): {missing}"


def test_lookup_mirrors_resolve_yoga_key() -> None:
    assert yoga_display_name("GAJA_KESARI_YOGA", "en") == "Gaja Kesari pattern"  # never rewritten to ..._YOGA_YOGA
    assert yoga_display_name("gaja_kesari", "ta") == YOGA_DISPLAY["GAJA_KESARI"][0]
    assert yoga_display_name("NOT_A_YOGA", "en") == "Not A Yoga"
