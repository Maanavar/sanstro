"""Completeness guard for response models that are constructed by hand.

The three sibling guards (`test_api_wrapper_route_contract.py`,
`test_api_wrapper_field_contract.py`, and the TS↔OpenAPI parity check) all
police the boundary *between* the backend and its clients. This one polices a
gap entirely inside the backend, and it is the one that actually shipped a bug.

`BirthProfileResponse(BirthProfileCreate)` gets its 25 payload fields by
**inheritance**. Every place that builds one, however, lists the fields **by
hand** — 30 keyword arguments, one per line. Adding a field to the schema
therefore does not add it to the serializers, and every field on the model has
a default, so a forgotten one is not a TypeError. It is `None`, forever, on
whichever route used that builder.

That is exactly what happened to `children`. `_chart_build._birth_profile_response`
passed `marital_status` and `employment_type` but not `children`, so the field
was write-only end to end: the one-minute reading could PATCH an answer to it,
and the web profile form — which hydrates its selects from the chart response,
not from `GET /birth-profiles` — could never read the answer back to show it.
The reader could set a value they could then never see or correct, while it fed
`life_areas`, `marriage_service` and daily guidance. Nothing failed. No test
went red. Both other builders of the same model passed the field correctly,
which is what made it invisible: the schema, the DB column, the PATCH route and
two of three serializers were all right.

So the check is structural rather than behavioural: parse the app, find every
hand-built call to a guarded model, and diff the keyword arguments against the
model's real field set. A field may be omitted only if it is named in
`_ALLOWED_OMISSIONS` with a reason.

Adding a model to `_GUARDED_MODELS` is the whole cost of extending this to the
next hand-built response.
"""

from __future__ import annotations

import ast
import importlib
from pathlib import Path

import pytest

pytestmark = pytest.mark.no_db

REPO_ROOT = Path(__file__).resolve().parents[1]
APP_ROOT = REPO_ROOT / "app"

# model class name -> import path
_GUARDED_MODELS = {
    "BirthProfileResponse": "app.schemas.birth_profiles",
}

# model name -> {field: why it may be absent}
#
# An entry here is a claim that the field being `None` is correct, not merely
# tolerated. Anything not listed must be passed explicitly at every call site.
_ALLOWED_OMISSIONS: dict[str, dict[str, str]] = {
    "BirthProfileResponse": {
        "chart_id": (
            "No consumer reads it off this model — verified across app/, web/, "
            "mobile/ and packages/shared/. The chart response carries `chartId` "
            "at the top level of its own data object, and the list endpoint's "
            "callers (mobile ProfileManager, web birth-profiles-manager) use "
            "only profile identity. Threading a chart lookup into the chart "
            "builder to populate a field nobody reads would be churn. If a "
            "consumer ever does read it, delete this entry first."
        ),
    },
}


def _model_fields(model_name: str) -> set[str]:
    module = importlib.import_module(_GUARDED_MODELS[model_name])
    return set(getattr(module, model_name).model_fields.keys())


def _iter_construction_sites() -> list[tuple[str, Path, int, set[str], bool]]:
    """(model_name, file, lineno, kwargs_passed, has_splat) for each call site."""
    sites: list[tuple[str, Path, int, set[str], bool]] = []
    for path in sorted(APP_ROOT.rglob("*.py")):
        # utf-8-sig: two files under app/ carry a BOM, and `ast.parse` rejects
        # U+FEFF as a non-printable character. See CLAUDE.md on never
        # round-tripping source through PowerShell.
        tree = ast.parse(path.read_text(encoding="utf-8-sig"))
        for node in ast.walk(tree):
            if not isinstance(node, ast.Call):
                continue
            name = getattr(node.func, "id", None) or getattr(node.func, "attr", None)
            if name not in _GUARDED_MODELS:
                continue
            passed = {kw.arg for kw in node.keywords if kw.arg is not None}
            has_splat = any(kw.arg is None for kw in node.keywords)
            sites.append((name, path, node.lineno, passed, has_splat))
    return sites


def test_every_guarded_model_is_actually_constructed_somewhere():
    """A guard that matches nothing passes for the wrong reason.

    If a model is renamed, or every call site moves behind a helper this AST
    walk cannot see, the completeness test below would go green while checking
    nothing at all.
    """
    sites = _iter_construction_sites()
    constructed = {name for name, *_ in sites}
    assert constructed == set(_GUARDED_MODELS), (
        f"Guarded models never constructed in app/: {set(_GUARDED_MODELS) - constructed}. "
        "Either the model was renamed, or its call sites are no longer statically "
        "visible — in which case this guard needs rewriting, not deleting."
    )


def test_hand_built_responses_pass_every_field_the_model_declares():
    failures: list[str] = []

    for model_name, path, lineno, passed, has_splat in _iter_construction_sites():
        if has_splat:
            # `**something` could supply anything; refusing to guess is the
            # honest outcome. If this ever fires, prefer making the call site
            # explicit over teaching the guard to guess.
            failures.append(
                f"{path.relative_to(REPO_ROOT).as_posix()}:{lineno} builds {model_name} "
                "with a ** splat, which this guard cannot verify. Pass the fields "
                "explicitly so a dropped one stays visible."
            )
            continue

        allowed = _ALLOWED_OMISSIONS.get(model_name, {})
        missing = _model_fields(model_name) - passed - set(allowed)
        if missing:
            failures.append(
                f"{path.relative_to(REPO_ROOT).as_posix()}:{lineno} builds {model_name} "
                f"without {sorted(missing)}. Every field on this model has a default, "
                "so the omission is silently None on this route rather than a "
                "TypeError. Pass it, or add it to _ALLOWED_OMISSIONS with the reason "
                "None is correct here."
            )

    assert not failures, "\n".join(failures)


def test_allowed_omissions_are_real_fields():
    """An allowlist entry for a field that no longer exists silently widens the guard."""
    for model_name, omissions in _ALLOWED_OMISSIONS.items():
        stale = set(omissions) - _model_fields(model_name)
        assert not stale, (
            f"_ALLOWED_OMISSIONS[{model_name!r}] names fields that are not on the "
            f"model: {sorted(stale)}. Remove them — a stale entry excuses nothing "
            "and hides the next real drop."
        )
