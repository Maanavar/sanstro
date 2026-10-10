"""A14 — the committed generated TypeScript must match the running backend.

`packages/shared/src/generated/api-types.ts` is produced by
`scripts/generate_api_types.py` from the listed routes' response models. If a
Pydantic response model changes and nobody regenerates, the generated types —
and the `tsc` fit check in `packages/shared/src/api/__contracts__/generated-fit.ts`
that reads them — would keep vouching for the old shape. This fails instead.

It also pins what "optional" means in the generated file: a key the server
writes on every response is not optional, which is what an HTTP body from a
small probe app is compared against.

What it cannot see: operations outside the generator's `OPERATIONS` list,
whether the fit check itself was run (that is `tsc` in mobile CI), and a
field dropped by code outside the response model (a handler that returns a
`JSONResponse` directly bypasses the model entirely).
"""
from __future__ import annotations

import importlib.util
import re
from pathlib import Path
from typing import NotRequired

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pydantic import BaseModel, Field
from typing_extensions import TypedDict  # pydantic needs this one before Python 3.12

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
    expected = generator.render(generator.response_schemas(app))
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


class _Inner(BaseModel):
    note: str | None = None


class _Loose(TypedDict):
    always: int
    sometimes: NotRequired[str]


class _Probe(BaseModel):
    requiredValue: int
    nullableDefault: str | None = None
    listDefault: list[int] = Field(default_factory=list)
    plainDefault: bool = True
    inner: _Inner = Field(default_factory=_Inner)
    loose: _Loose = Field(default_factory=lambda: {"always": 1})


def _probe_app(**route_options) -> FastAPI:
    probe_app = FastAPI()

    @probe_app.get("/api/v1/probe", response_model=_Probe, **route_options)
    def probe() -> _Probe:
        return _Probe(requiredValue=1)

    return probe_app


def test_a_field_sent_on_every_response_is_not_optional() -> None:
    probe_app = _probe_app()
    body = TestClient(probe_app).get("/api/v1/probe").json()
    text = _generator().render(_generator().response_schemas(probe_app, (("GetProbe", "/api/v1/probe"),)))
    declared = dict(re.findall(r"^  (\w+)(\??):", text, re.M))

    sent = [*body, *body["inner"], *body["loose"]]
    assert "sometimes" not in body["loose"]
    assert [key for key in sent if declared.get(key) != ""] == []
    # A TypedDict's NotRequired key is genuinely absent here, so it stays optional.
    assert declared["sometimes"] == "?"


@pytest.mark.parametrize(
    "option",
    [
        {"response_model_exclude_none": True},
        {"response_model_exclude_unset": True},
        {"response_model_exclude_defaults": True},
        {"response_model_exclude": {"plainDefault"}},
        {"response_model_include": {"requiredValue"}},
    ],
)
def test_a_route_that_drops_fields_is_refused(option: dict) -> None:
    with pytest.raises(ValueError, match="defaulted fields may be absent"):
        _generator().response_schemas(_probe_app(**option), (("GetProbe", "/api/v1/probe"),))
