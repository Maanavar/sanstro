"""A13 — golden output for `build_daily_guidance_response`, before any extraction.

The guide's A13 rule for the large orchestration units: write golden fixtures
from synthetic charts first, extract pure stages behind the unchanged public
function, and show the fixtures unchanged after. This is that fixture for the
~880-line daily-guidance builder.

Built with no database: `_chart_response_from_profile` takes any profile-like
object, and the builder with `session=None` computes its own panchangam and
transits. Four synthetic profiles (identities the suite already uses — none is
a real person) × four dates across 2026, in the default `ta-en` language.

**Normalised, on purpose.** CI runs Python 3.12 + pyswisseph; this machine runs
swisseph-ffi, and on 2026-10-08 the two disagreed at a 4-place rounding edge
(see `tests/test_a14_response_contracts.py`). So floats are compared to 2
places and clock times / ISO datetimes are masked; every other value — scores
as integers, labels, bands, flags, names, every sentence of copy around the
times — is compared exactly. A refactor's exact equivalence is proved
separately, old and new in one process (docs/MASTER_FIX_LIST.md, A13).

What this cannot see: the masked clock times themselves (window boundaries),
float drift under 0.005, the session-backed paths (goals, context rows, journal
insight, cache reads), and any language but `ta-en`.

Regenerate only when a change to the output is intended, and say why in the
commit:  python tests/test_daily_guidance_golden.py --write
"""
from __future__ import annotations

import json
import re
import sys
from datetime import date
from datetime import time as dtime
from pathlib import Path
from types import SimpleNamespace
from uuid import UUID

import pytest

pytestmark = pytest.mark.no_db

GOLDEN = Path(__file__).resolve().parent / "golden" / "daily_guidance" / "daily_guidance_golden.json"

#: (key, birth date, birth time, place, lat, lon, timezone) — synthetic.
PROFILES = [
    ("chennai-1991", date(1991, 7, 22), dtime(6, 30), "Chennai, Tamil Nadu, India", 13.0827, 80.2707, "Asia/Kolkata"),
    ("chennai-1992", date(1992, 7, 4), dtime(14, 30), "Chennai, India", 13.0827, 80.2707, "Asia/Kolkata"),
    ("madurai-1988", date(1988, 6, 1), dtime(15, 44), "Madurai, Tamil Nadu, India", 9.9252, 78.1198, "Asia/Kolkata"),
    ("london-1985", date(1985, 12, 10), dtime(23, 50), "London, United Kingdom", 51.5074, -0.1278, "Europe/London"),
]
DATES = [date(2026, 1, 14), date(2026, 5, 21), date(2026, 8, 28), date(2026, 11, 9)]

_ISO_DATETIME = re.compile(r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:[+-]\d{2}:\d{2}|Z)?")
_CLOCK = re.compile(r"\b\d{1,2}:\d{2}(?::\d{2})?\b")


def _profile(key, birth_date, birth_time, place, lat, lon, tz) -> SimpleNamespace:
    seed = sum(map(ord, key))
    return SimpleNamespace(
        birth_profile_id=UUID(int=seed),
        display_name=f"Synthetic {key}",
        birth_date_local=birth_date,
        birth_time_local=birth_time,
        birth_time_known=True,
        birth_place=place,
        birth_latitude=lat,
        birth_longitude=lon,
        birth_timezone=tz,
        current_latitude=None,
        current_longitude=None,
        current_timezone=None,
        current_place=None,
        gender=None,
    )


def normalise(value):
    """The comparable part of a response — see the module docstring."""
    if isinstance(value, dict):
        return {k: normalise(v) for k, v in value.items() if k != "meta"}
    if isinstance(value, list):
        return [normalise(v) for v in value]
    if isinstance(value, bool) or value is None or isinstance(value, int):
        return value
    if isinstance(value, float):
        rounded = round(value, 2)
        return 0.0 if rounded == 0 else rounded
    if isinstance(value, str):
        return _CLOCK.sub("HH:MM", _ISO_DATETIME.sub("<datetime>", value))
    return value


def compute() -> dict[str, dict]:
    from app.services._chart_build import _chart_response_from_profile
    from app.services.daily_guidance_service import build_daily_guidance_response

    out: dict[str, dict] = {}
    for row in PROFILES:
        key = row[0]
        chart = _chart_response_from_profile(
            _profile(*row), "thirukanitham-2026-v1", chart_id=UUID(int=sum(map(ord, key)) + 1),
        )
        for day in DATES:
            response = build_daily_guidance_response(chart, day, "ta-en", session=None)
            out[f"{key}@{day.isoformat()}"] = normalise(response.model_dump(mode="json", by_alias=True))
    return out


_CACHE: dict[str, dict] = {}


def _actual() -> dict[str, dict]:
    if not _CACHE:
        _CACHE.update(compute())
    return _CACHE


def _expected() -> dict[str, dict]:
    return json.loads(GOLDEN.read_text(encoding="utf-8"))


CASE_KEYS = [f"{p[0]}@{d.isoformat()}" for p in PROFILES for d in DATES]


@pytest.mark.parametrize("case", CASE_KEYS)
def test_daily_guidance_matches_golden(case: str) -> None:
    expected = _expected()[case]
    actual = _actual()[case]
    if actual != expected:
        diffs = [
            k for k in sorted(set(expected["data"]) | set(actual["data"]))
            if expected["data"].get(k) != actual["data"].get(k)
        ]
        pytest.fail(f"{case}: daily guidance changed in {diffs}")


def test_golden_matrix_reaches_the_branches_that_matter() -> None:
    """A fixture of identical easy days would pass any refactor."""
    data = [case["data"] for case in _expected().values()]
    assert len(data) == len(CASE_KEYS)
    assert any(d["isChandrashtama"] for d in data), "no Chandrashtama day in the matrix"
    assert not all(d["isChandrashtama"] for d in data)
    assert len({d["label"] for d in data}) >= 2, "every case has the same label"
    assert len({d["score"] for d in data}) >= 8, "scores barely vary across the matrix"


if __name__ == "__main__":
    if "--write" not in sys.argv:
        raise SystemExit("usage: python tests/test_daily_guidance_golden.py --write")
    GOLDEN.parent.mkdir(parents=True, exist_ok=True)
    # One compact line per case: a diff names the case that moved, and the file
    # stays about half the size of an indented dump.
    cases = compute()
    body = ",\n".join(
        f"{json.dumps(k)}: {json.dumps(cases[k], ensure_ascii=False, sort_keys=True, separators=(',', ':'))}"
        for k in sorted(cases)
    )
    GOLDEN.write_text("{\n" + body + "\n}\n", encoding="utf-8")
    print(f"wrote {GOLDEN.relative_to(Path.cwd()) if GOLDEN.is_relative_to(Path.cwd()) else GOLDEN}")
