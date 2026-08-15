"""Every activity a UI offers must resolve to a backend activity.

This boundary has already failed once in production: `baby_naming` sat on the
mobile picker from launch, uppercased to `BABY_NAMING`, matched nothing, and
422'd on every tap. `house`, `vehicle` and `business` had the same defect. There
is no compile-time check between a TSX array literal and a Python frozenset, so
the check is here.

It reads the literals out of the three surfaces rather than duplicating them,
so a new picker row is covered the moment it is added — the failure mode is a
row nobody remembered to add here, and parsing the file removes that.
"""
from __future__ import annotations

import re
from pathlib import Path

import pytest

from app.services.muhurta_service import MUHURTA_ACTIVITIES, normalize_activity

pytestmark = pytest.mark.no_db

_REPO = Path(__file__).resolve().parents[1]

# (label, path, the const holding the list, the field naming the activity)
#
# The const name matters: `mobile/app/(tabs)/tools/muhurta.tsx` also declares a
# DECISIONS array of `{ key, label }` objects whose keys are goal names, not
# activities. A file-wide regex swept those up and reported five false failures,
# so the block is located by its declaration first and matched inside.
_SURFACES = (
    (
        "dashboard picker",
        _REPO / "web" / "components" / "dashboard-plan-muhurta-picker-nova.tsx",
        "ACTIVITIES",
        "id",
    ),
    (
        "public calculator",
        _REPO / "web" / "app" / "(marketing)" / "tools" / "muhurta-calculator" / "MuhurtaTool.tsx",
        "EVENT_TYPES",
        "value",
    ),
    (
        "mobile picker",
        _REPO / "mobile" / "app" / "(tabs)" / "tools" / "muhurta.tsx",
        "ACTIVITIES",
        "key",
    ),
)


def _keys_in_const(source: str, const: str, field: str) -> list[str]:
    """Activity keys declared inside `const <const> = [ ... ];` only."""
    start = re.search(rf"const\s+{const}\b[^=]*=\s*\[", source)
    assert start, f"could not find `const {const} = [` — the guard needs updating"
    body = source[start.end():]
    end = body.find("\n];")
    assert end != -1, f"could not find the end of `{const}`"
    return re.findall(rf'{field}:\s*"([A-Za-z_]+)"', body[:end])


@pytest.mark.parametrize(
    ("label", "path", "const", "field"), _SURFACES, ids=[s[0] for s in _SURFACES]
)
def test_every_offered_activity_resolves_to_a_backend_activity(
    label: str, path: Path, const: str, field: str
) -> None:
    assert path.exists(), f"{label}: {path} moved — update this guard"
    keys = _keys_in_const(path.read_text(encoding="utf-8"), const, field)
    assert keys, f"{label}: parsed no activity keys, so this guard is checking nothing"

    unresolved = sorted({k for k in keys if normalize_activity(k) not in MUHURTA_ACTIVITIES})
    assert not unresolved, (
        f"{label} offers activities the backend will reject with 422: {unresolved}. "
        "Either add them to muhurta_service.MUHURTA_ACTIVITIES, alias them in "
        "_ACTIVITY_ALIASES, or take the row off the picker."
    )


def test_the_dashboard_offers_every_page_cited_activity() -> None:
    """The signed-in surface is the one users pay for, and it is the surface that
    silently lacked MARRIAGE while both other pickers offered it. Anything the
    engine can score on primary-text doctrine should be reachable there."""
    from app.calculations.muhurta_engine import SOURCED_ACTIVITIES

    path = _REPO / "web" / "components" / "dashboard-plan-muhurta-picker-nova.tsx"
    offered = set(_keys_in_const(path.read_text(encoding="utf-8"), "ACTIVITIES", "id"))
    missing = sorted(SOURCED_ACTIVITIES - offered)
    assert not missing, (
        f"these activities are scored on cited doctrine but cannot be selected on the "
        f"dashboard: {missing}"
    )
