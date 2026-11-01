"""AAU-18 (ruled 2026-10-29, native review pending): one spelling per porutham.

Display names follow what a Tamil almanac prints (owner ruling 2026-07-20):
வசியம், மகேந்திரம், ஸ்திரீ தீர்க்கம். The result screens, the synastry copy and
the mobile learn page had three different sets.
"""
from __future__ import annotations

from pathlib import Path

import pytest

pytestmark = pytest.mark.no_db

_ROOT = Path(__file__).resolve().parent.parent
_REJECTED = ("வாஸ்யம்", "மாஹேந்திரம்", "மஹேந்திரம்", "தீர்கம்")
_SURFACES = (
    "app/calculations/porutham.py",
    "app/services/synastry_service.py",
    "mobile/src/lib/learnContent.ts",
    "web/components/dashboard-synastry-panel.tsx",
)


@pytest.mark.parametrize("path", _SURFACES)
def test_no_rejected_porutham_spelling(path: str) -> None:
    source = (_ROOT / path).read_text(encoding="utf-8")
    found = [word for word in _REJECTED if word in source]
    assert not found, f"{path} still spells {found}"


def test_the_result_screen_names_use_the_almanac_forms() -> None:
    source = (_ROOT / "app/calculations/porutham.py").read_text(encoding="utf-8")
    for word in ("வசியம்", "மகேந்திரம்", "ஸ்திரீ தீர்க்கம்"):
        assert word in source
