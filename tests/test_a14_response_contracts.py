"""A14 — the nine operations the contract guards could not check.

`test_api_wrapper_field_contract.py` compares each shared wrapper's TypeScript
interface with the route's OpenAPI response schema. For nine operations there
was no schema to compare against — eight routes returned a hand-built dict with
no `response_model`, and daily-status was annotated `-> dict` — so the guard
skipped them and their wrappers' casts were never checked at all.

Two tests per operation:

1. **A concrete schema exists.** The 200 response (and, for an enveloped
   route, its `data`) resolves to an object with named properties.
2. **The schema is lossless for a real payload.** Declaring a
   `response_model` makes FastAPI validate and re-serialise the return value,
   which silently drops an undeclared key, adds a defaulted one, or coerces a
   value. So the route function is also called directly and its raw return,
   encoded exactly as FastAPI encodes a model-less route, must equal what the
   HTTP response carries. This also catches the next builder change that adds
   a field and forgets the model.

What this cannot see: payload branches the synthetic chart does not reach
(a chart with no current Chara period, a monthly-quota user's daily status, an
unknown birth time). It compares JSON values, so an int that becomes a float
(`5` vs `5.0`) passes — the same number to every JSON client.
"""
from __future__ import annotations

from datetime import date
from uuid import UUID

import pytest
from fastapi.encoders import jsonable_encoder

from app.api import ask_vinaadi as ask_vinaadi_api
from app.api import charts as charts_api
from app.api import remedies as remedies_api
from app.db.session import SessionLocal
from app.main import app
from app.models.user import User
from tests.conftest import TEST_USER_EMAIL, TEST_USER_ID

AS_OF = date(2026, 5, 21)
YEAR = 2026

# (OpenAPI path, query params, whether the body is a {success, data} envelope)
OPERATIONS = {
    "chara-dasha": ("/api/v1/charts/{chart_id}/chara-dasha", {}, True),
    "yogini-dasha": ("/api/v1/charts/{chart_id}/yogini-dasha", {"asOf": AS_OF.isoformat()}, True),
    "ashtottari-dasha": ("/api/v1/charts/{chart_id}/ashtottari-dasha", {"asOf": AS_OF.isoformat()}, True),
    "kalachakra-dasha": ("/api/v1/charts/{chart_id}/kalachakra-dasha", {"asOf": AS_OF.isoformat()}, True),
    "conditional-dashas": ("/api/v1/charts/{chart_id}/conditional-dashas", {"asOf": AS_OF.isoformat()}, True),
    "remedy-plan": ("/api/v1/charts/{chart_id}/remedy-plan", {}, True),
    "shadbala": ("/api/v1/charts/{chart_id}/shadbala", {}, True),
    "varshaphala": ("/api/v1/charts/{chart_id}/varshaphala", {"year": YEAR}, True),
    "daily-status": ("/api/v1/ask-vinaadi/daily-status", {}, False),
}


def _raw(name: str, session, user: User, chart_id: UUID):
    """The route function's own return value, before any response model."""
    calls = {
        "chara-dasha": lambda: charts_api.get_chara_dasha(chart_id, session, user),
        "yogini-dasha": lambda: charts_api.get_yogini_dasha(chart_id, AS_OF, session, user),
        "ashtottari-dasha": lambda: charts_api.get_ashtottari_dasha(chart_id, AS_OF, session, user),
        "kalachakra-dasha": lambda: charts_api.get_kalachakra_dasha(chart_id, AS_OF, session, user),
        "conditional-dashas": lambda: charts_api.get_conditional_dashas(chart_id, AS_OF, session, user),
        "remedy-plan": lambda: remedies_api.remedy_plan(chart_id, session, user),
        "shadbala": lambda: charts_api.get_shadbala(chart_id, session, user),
        "varshaphala": lambda: charts_api.get_varshaphala_endpoint(chart_id, YEAR, session, user),
        "daily-status": lambda: ask_vinaadi_api.ask_vinaadi_daily_status(session, user),
    }
    return calls[name]()


def _resolve(schema: dict, components: dict) -> dict:
    while "$ref" in schema:
        schema = components[schema["$ref"].rsplit("/", 1)[-1]]
    return schema


def _response_schema(path: str) -> dict | None:
    spec = app.openapi()
    operation = spec["paths"].get(path, {}).get("get")
    if operation is None:
        return None
    content = operation["responses"].get("200", {}).get("content", {})
    return content.get("application/json", {}).get("schema")


@pytest.mark.no_db
@pytest.mark.parametrize("name", sorted(OPERATIONS))
def test_operation_declares_a_concrete_response_schema(name: str) -> None:
    path, _params, enveloped = OPERATIONS[name]
    components = app.openapi().get("components", {}).get("schemas", {})
    schema = _response_schema(path)
    assert schema, f"{path}: no 200 JSON response schema"
    body = _resolve(schema, components)
    assert body.get("properties"), f"{path}: 200 schema is not a concrete object: {body}"
    if enveloped:
        data = _resolve(body["properties"].get("data", {}), components)
        assert data.get("properties"), f"{path}: `data` is not a concrete object: {data}"


@pytest.mark.parametrize("name", sorted(OPERATIONS))
def test_response_model_is_lossless(name: str, client, birth_profile_payload_factory) -> None:
    created = client.post("/api/v1/birth-profiles", json=birth_profile_payload_factory()).json()
    chart_id = UUID(created["data"]["chartId"])
    path, params, _enveloped = OPERATIONS[name]

    response = client.get(path.format(chart_id=chart_id), params=params)
    assert response.status_code == 200, response.text

    user = User(user_id=UUID(TEST_USER_ID), email=TEST_USER_EMAIL)
    with SessionLocal() as session:
        raw = jsonable_encoder(_raw(name, session, user, chart_id))
    served = response.json()

    # The one value that differs between two calls by construction: the clock.
    for body in (served, raw):
        if isinstance(body.get("meta"), dict):
            body["meta"].pop("generatedAt", None)

    assert served == raw
