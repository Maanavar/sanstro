"""A13 — imports must point down the layers, with the exceptions written down.

The layers, lowest first: domain calculations (`app/calculations`) ->
persistence (`app/db`, `app/models`) -> application (`app/services`) -> API
(`app/api`). A lower layer importing a higher one is the coupling A13 found:
calculations doing cache SQL through an ORM model, a calculation importing its
types from a service, and every ORM model importing its column types from
`services`.

Every `import` in a module counts — top level, inside a function, under
`TYPE_CHECKING` — because a deferred import is still a dependency, only a
quieter one. Parsed with `ast`, so a string or comment mentioning a module does
not count.

`BASELINE` lists the violations that remain, each with its reason. It is
self-cleaning: an entry that no longer occurs fails the test until it is
deleted, so the list can only shrink.

What this cannot see: `importlib`/`__import__` by name, dependencies passed in
at runtime (a session handed to a calculation is still DB coupling — see the
panchangam entry), and anything outside `app/`.
"""
from __future__ import annotations

import ast
from pathlib import Path

import pytest

pytestmark = pytest.mark.no_db

REPO = Path(__file__).resolve().parent.parent
APP = REPO / "app"

# package -> import prefixes it must not use
RULES: dict[str, tuple[str, ...]] = {
    "app/calculations": ("app.models", "app.services", "app.api", "app.db", "sqlalchemy", "fastapi"),
    "app/models": ("app.services", "app.api"),
    "app/db": ("app.services", "app.api", "app.models"),
    "app/core": ("app.services", "app.api"),
    "app/services": ("app.api",),
}

# (module file, imported module) -> why it is still allowed. Remove an entry
# when its violation is fixed; the stale check below insists on it.
BASELINE: dict[tuple[str, str], str] = {
    # The read-through cache lives inside the calculation, and
    # `calculate_daily_panchangam(session=...)` is the public entry point for
    # ~30 callers. Moving it is a facade move on a perf-budgeted hot path, kept
    # out of the first A13 pass on purpose.
    ("app/calculations/panchangam.py", "sqlalchemy"): "panchangam cache (A13 follow-up)",
    ("app/calculations/panchangam.py", "sqlalchemy.dialects.postgresql"): "panchangam cache (A13 follow-up)",
    ("app/calculations/panchangam.py", "sqlalchemy.orm"): "panchangam cache (A13 follow-up)",
    ("app/calculations/panchangam.py", "app.models.panchangam_cache"): "panchangam cache (A13 follow-up)",
}


def _forbidden(module: str, prefixes: tuple[str, ...]) -> bool:
    return any(module == p or module.startswith(p + ".") for p in prefixes)


def _upward_imports(path: Path, prefixes: tuple[str, ...]) -> set[str]:
    tree = ast.parse(path.read_text(encoding="utf-8"), filename=str(path))
    found: set[str] = set()
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            found.update(a.name for a in node.names if _forbidden(a.name, prefixes))
        elif isinstance(node, ast.ImportFrom) and node.module and node.level == 0:
            if _forbidden(node.module, prefixes):
                found.add(node.module)
            else:
                # `from app import services` names the layer in the alias.
                found.update(
                    f"{node.module}.{a.name}" for a in node.names
                    if _forbidden(f"{node.module}.{a.name}", prefixes)
                )
    return found


def _violations() -> set[tuple[str, str]]:
    found: set[tuple[str, str]] = set()
    for package, prefixes in RULES.items():
        for path in sorted((REPO / package).rglob("*.py")):
            rel = path.relative_to(REPO).as_posix()
            found.update((rel, module) for module in _upward_imports(path, prefixes))
    return found


def test_rules_reach_real_files() -> None:
    """Guard the guard: a rule over an empty glob would pass forever."""
    for package in RULES:
        assert list((REPO / package).rglob("*.py")), f"{package} matched no files"


def test_no_new_upward_imports() -> None:
    new = sorted(_violations() - set(BASELINE))
    assert not new, (
        "Upward imports (a lower layer importing a higher one):\n  "
        + "\n  ".join(f"{rel} imports {module}" for rel, module in new)
        + "\nMove the shared type or function down instead; see the module docstring."
    )


def test_baseline_has_no_stale_entries() -> None:
    stale = sorted(set(BASELINE) - _violations())
    assert not stale, (
        f"These BASELINE entries no longer occur — delete them so the list only shrinks: {stale}"
    )
