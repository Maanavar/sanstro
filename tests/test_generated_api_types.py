"""A14 — the committed generated TypeScript must match the running backend.

`packages/shared/src/generated/api-types.ts` is produced by
`scripts/generate_api_types.py` from `app.openapi()`. If a Pydantic response
model changes and nobody regenerates, the generated types — and the `tsc` fit
check in `packages/shared/src/api/__contracts__/generated-fit.ts` that reads
them — would keep vouching for the old shape. This fails instead.

What it cannot see: operations outside the generator's `OPERATIONS` list, and
whether the fit check itself was run (that is `tsc` in mobile CI).
"""
from __future__ import annotations

import importlib.util
from pathlib import Path

import pytest

from app.main import app

pytestmark = pytest.mark.no_db

REPO = Path(__file__).resolve().parent.parent


def _generator():
    spec = importlib.util.spec_from_file_location("generate_api_types", REPO / "scripts" / "generate_api_types.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_generated_api_types_are_current() -> None:
    generator = _generator()
    expected = generator.render(app.openapi())
    committed = generator.OUTPUT.read_text(encoding="utf-8")
    assert committed == expected, (
        "packages/shared/src/generated/api-types.ts is stale — run "
        "`python scripts/generate_api_types.py` and commit the result."
    )


def test_every_listed_operation_has_a_generated_alias() -> None:
    generator = _generator()
    text = generator.OUTPUT.read_text(encoding="utf-8")
    missing = [alias for alias, _path in generator.OPERATIONS if f"export type {alias}Response" not in text]
    assert not missing, missing
