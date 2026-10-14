"""One spelling per Tamil astrology term across every surface.

A native reader's review (2026-09-30) found the same page spelling the 6/8/12 group
two ways — துஷ்டானம் in most places, துஸ்தானம் on the Strengths & watch-outs tile
beside it. துஷ்டானம் is the recognisable Tamil rendering of duṣṭhāna and was
standardised everywhere. This ratchet keeps the retired spelling from returning.

BLIND SPOT: a source scan cannot see a string assembled at runtime (e.g.
"து" + "ஸ்தானம்"), nor text arriving from the database or an LLM.
"""
from __future__ import annotations

from pathlib import Path

import pytest

pytestmark = pytest.mark.no_db

_ROOT = Path(__file__).resolve().parent.parent
_SCAN = ("app", "web/components", "web/lib", "web/app", "mobile/src", "packages/shared/src")
_SUFFIXES = {".py", ".ts", ".tsx", ".json"}
_SKIP_PARTS = {"node_modules", ".next", "__pycache__"}

# retired spelling -> the spelling to use instead
_RETIRED = {"துஸ்தான": "துஷ்டான"}


def _source_files():
    for base in _SCAN:
        root = _ROOT / base
        if not root.exists():
            continue
        for path in root.rglob("*"):
            if path.suffix in _SUFFIXES and not _SKIP_PARTS.intersection(path.parts):
                yield path


def test_no_retired_tamil_spelling_in_source() -> None:
    hits = []
    for path in _source_files():
        text = path.read_text(encoding="utf-8", errors="ignore")
        for retired, use in _RETIRED.items():
            if retired in text:
                hits.append(f"{path.relative_to(_ROOT)}: {retired} -> use {use}")
    assert not hits, "\n".join(hits)


def test_the_scan_actually_reaches_the_surfaces() -> None:
    """Baseline for the gate above: an empty or mis-rooted scan passes vacuously."""
    names = {p.name for p in _source_files()}
    assert "dashboard-hybrid-parts.tsx" in names
    assert "numerology_alignment.py" in names
