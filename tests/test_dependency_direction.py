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

A session handed to a calculation is DB coupling the import graph cannot see
(an unannotated `session` parameter imports nothing), so a second check
refuses any `session`/`db` parameter in `app/calculations`. The panchangam
read-through cache was the one case; it moved to
`app/services/panchangam_cache.py` on 2026-10-08.

What this cannot see: `importlib`/`__import__` by name, a session passed under
another parameter name or inside another object, and anything outside `app/`.
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
BASELINE: dict[tuple[str, str], str] = {}

# Parameter names that carry a database session into a function.
_SESSION_PARAMS = frozenset({"session", "db"})


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


def test_calculations_take_no_session() -> None:
    """Pure calculations get their inputs as values, never a session to fetch them."""
    found: list[str] = []
    for path in sorted((APP / "calculations").rglob("*.py")):
        tree = ast.parse(path.read_text(encoding="utf-8"), filename=str(path))
        for node in ast.walk(tree):
            if not isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                continue
            a = node.args
            for arg in [*a.posonlyargs, *a.args, *a.kwonlyargs]:
                if arg.arg in _SESSION_PARAMS:
                    found.append(f"{path.relative_to(REPO).as_posix()}:{node.lineno} {node.name}({arg.arg})")
    assert not found, (
        "Calculations taking a database session:\n  " + "\n  ".join(found)
        + "\nLoad the inputs in a service and pass values down."
    )


def test_baseline_has_no_stale_entries() -> None:
    stale = sorted(set(BASELINE) - _violations())
    assert not stale, (
        f"These BASELINE entries no longer occur — delete them so the list only shrinks: {stale}"
    )
