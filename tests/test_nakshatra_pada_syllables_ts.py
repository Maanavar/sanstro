"""AAU-04: the Jadhagam's naming syllables are the canon's, not a second table.

The sheet hand-typed its own table, which differed from
`app/data/nakshatra_pada_akshara.py` in 59 of 108 cells. It now renders a file
generated from the canon. This fails if that file is stale, or if the sheet
grows its own table again.

Blind spot: it proves the sheet shows the canon, not that the canon is right.
The canon is 0 of 108 verified until the astrologer signs it.
"""
from __future__ import annotations

import importlib.util
from pathlib import Path

import pytest

pytestmark = pytest.mark.no_db

_ROOT = Path(__file__).resolve().parent.parent
_TOOL = _ROOT / "web" / "app" / "(marketing)" / "tools" / "jadhagam-generator" / "JadhagamTool.tsx"


def _generator():
    path = _ROOT / "scripts" / "generate_nakshatra_pada_syllables.py"
    spec = importlib.util.spec_from_file_location("generate_nakshatra_pada_syllables", path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


def test_committed_syllables_are_current() -> None:
    generator = _generator()
    assert generator.OUTPUT.read_text(encoding="utf-8") == generator.render(generator.build()), (
        "web/lib/generated/nakshatra-pada-syllables.ts is stale — run "
        "`python scripts/generate_nakshatra_pada_syllables.py` and commit the result."
    )


def test_aswini_starts_with_su_not_karthigais_a() -> None:
    syllables = _generator().build()["syllables"]
    assert syllables[1] == ["சு", "சே", "சோ", "லா"]
    assert syllables[3][0] == "அ"  # அ is Karthigai pada 1


def test_the_sheet_reads_the_generated_file_and_types_no_table() -> None:
    source = _TOOL.read_text(encoding="utf-8")
    assert "@/lib/generated/nakshatra-pada-syllables" in source
    assert "NAKSHATRA_SYLLABLES" not in source
    assert '"அ",   "சி"' not in source  # the old Aswini row
