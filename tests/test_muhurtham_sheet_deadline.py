"""Deferred-checks plan, item 9: the yearly almanac muhurtham-day sheet.

The list comes from the printed almanac, so it cannot be computed; it can only
be entered on time. This is the gate that says so: from 1 October it warns
that next year has no sheet, and from 1 December it fails the build.
"""
from __future__ import annotations

import warnings
from datetime import date

import pytest

from app.data.muhurtham_naals import MUHURTHAM_NAALS_BY_YEAR, sheet_deadline_status

pytestmark = pytest.mark.no_db

_HAVE = frozenset({2026, 2027})


@pytest.mark.parametrize(
    ("today", "expected"),
    [
        (date(2027, 9, 30), "ok"),     # before the warning window
        (date(2027, 10, 1), "warn"),   # 2028 missing, window open
        (date(2027, 11, 30), "warn"),
        (date(2027, 12, 1), "fail"),   # the negative run: missing after 1 Dec fails
        (date(2026, 12, 15), "ok"),    # 2027 is entered
    ],
)
def test_deadline_windows(today: date, expected: str) -> None:
    assert sheet_deadline_status(today, _HAVE) == expected


def test_next_years_sheet_is_entered_in_time() -> None:
    """The live gate. Blind spot: it checks a sheet exists, not that it was
    double-entered against the photographed pages (plan item 9, step 1)."""
    status = sheet_deadline_status(date.today())
    if status == "warn":
        warnings.warn(
            f"No almanac muhurtham sheet for {date.today().year + 1} yet; "
            "it becomes a build failure on 1 December (app/data/muhurtham_naals.py).",
            stacklevel=1,
        )
    assert status != "fail", (
        f"No almanac muhurtham sheet for {date.today().year + 1}. Enter it in "
        "app/data/muhurtham_naals.py from the photographed almanac pages."
    )
    assert MUHURTHAM_NAALS_BY_YEAR  # the registry itself was not emptied
