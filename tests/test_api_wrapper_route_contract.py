"""Route-existence contract guard for TypeScript API wrappers.

Parity audit 2026-07-17 found two whole classes of drift that were invisible to
every existing test:

* ``packages/shared/src/api/tools.ts`` wrappers pointing at URLs that no backend
  route serves at all (relics of an older ``/public-tools/*`` scheme) — 9 mobile
  screens hard-404ed.
* Wrapper paths that exist but were requested with the wrong verb.

The mobile contract tests (``mobile/__tests__/api/contracts.test.ts``) mock the
HTTP client and assert the *wrapper's own* path, so a wrapper that points at a
nonexistent route passes happily. Nothing compares wrapper paths against the
actual FastAPI route table — this test does.

It statically parses every ``getApiClient().<verb>("/path")`` / ``apiGet("/path")``
style call in ``packages/shared/src/api`` and ``mobile/src/api``, normalises path
parameters, and asserts each (verb, path) pair exists in the app's OpenAPI schema.
"""

from __future__ import annotations

import re
from pathlib import Path

import pytest

from app.main import app

# Pure static analysis + OpenAPI introspection — never touches the database.
pytestmark = pytest.mark.no_db

REPO_ROOT = Path(__file__).resolve().parents[1]
WRAPPER_DIRS = (
    REPO_ROOT / "packages" / "shared" / "src" / "api",
    REPO_ROOT / "mobile" / "src" / "api",
)

API_V1_PREFIX = "/api/v1"

# getApiClient().get("/x") | api.post(`/x`) | client.delete("/x")
_METHOD_CALL_RE = re.compile(
    r"""(?:getApiClient\(\)|\bapi|\bclient)\s*\.\s*
        (get|post|patch|put|delete)\s*
        [^(;]{0,200}?\(\s*(["'`])(/[^"'`]*)\2""",
    re.VERBOSE,
)

# apiGet("/x") | apiPost<T>(`/x`) | apiDelete("/x")
_HELPER_CALL_RE = re.compile(
    r"""\bapi(Get|Post|Patch|Put|Delete)\s*
        [^(;]{0,200}?\(\s*(["'`])(/[^"'`]*)\2""",
    re.VERBOSE,
)

_PARAM_PLACEHOLDER = "{}"

# A `${...}` that occupies a whole path segment is a path parameter, e.g.
# `/charts/${encodeURIComponent(chartId)}/dasha`.
_SEGMENT_TEMPLATE_RE = re.compile(r"(?<=/)\$\{[^}]*\}(?=/|$)")
# OpenAPI's `{chart_id}` -> the same opaque segment, so names need not match.
_OPENAPI_PARAM_RE = re.compile(r"\{[^}]*\}")


def _normalise_backend_path(path: str) -> str:
    path = _OPENAPI_PARAM_RE.sub(_PARAM_PLACEHOLDER, path)
    return path.rstrip("/") or "/"


def _normalise_wrapper_path(path: str) -> str:
    """Reduce a wrapper path to a comparable shape: no query string, opaque params."""
    path = path.split("?", 1)[0]
    path = _SEGMENT_TEMPLATE_RE.sub(_PARAM_PLACEHOLDER, path)
    # Any `${...}` left over is interpolated mid-segment rather than being a whole
    # segment — in practice a pre-built query string, e.g.
    # `/charts/${id}/propensities${query}` where query is `?asOf=...`. The routable
    # part is everything before it, so truncate there.
    suffix = path.find("${")
    if suffix != -1:
        path = path[:suffix]
    return path.rstrip("/") or "/"


def _to_absolute(path: str) -> str:
    """Mirror the clients' prefixing rules.

    Both web (``web/lib/api.ts`` normalizeApiPath) and mobile
    (``mobile/src/api/client.ts`` buildApiUrl) send an already-``/api/``-qualified
    path as-is and prefix everything else with ``/api/v1``.
    """
    if path.startswith("/api/"):
        return path
    return f"{API_V1_PREFIX}{path}"


def _iter_wrapper_calls():
    """Yield (verb, raw_path, source_location) for every wrapper HTTP call."""
    for directory in WRAPPER_DIRS:
        if not directory.is_dir():
            continue
        for ts_file in sorted(directory.rglob("*.ts")):
            if ts_file.name.endswith(".test.ts") or ts_file.name == "client.ts":
                continue
            text = ts_file.read_text(encoding="utf-8")
            rel = ts_file.relative_to(REPO_ROOT).as_posix()
            for match in _METHOD_CALL_RE.finditer(text):
                verb, _, path = match.groups()
                line = text.count("\n", 0, match.start()) + 1
                yield verb.upper(), path, f"{rel}:{line}"
            for match in _HELPER_CALL_RE.finditer(text):
                verb, _, path = match.groups()
                line = text.count("\n", 0, match.start()) + 1
                yield verb.upper(), path, f"{rel}:{line}"


def _backend_routes() -> dict[str, set[str]]:
    """Normalised backend path -> set of verbs it serves."""
    routes: dict[str, set[str]] = {}
    for path, operations in app.openapi()["paths"].items():
        key = _normalise_backend_path(path)
        verbs = {verb.upper() for verb in operations if verb.upper() != "HEAD"}
        routes.setdefault(key, set()).update(verbs)
    return routes


# ── Envelope-shape guard ─────────────────────────────────────────────────────
# Some routes answer with a { success, data } envelope and some answer flat. A
# caller that unwraps `.data` from a flat route gets `undefined` and silently
# renders nothing — no 404, no error, no type error (the cast asserts the lie).
# This has shipped twice: the web Prasna widget never rendered a result, and
# GET /settings/ui's stored language preference never applied.

_SPEC = app.openapi()
_SCHEMAS = _SPEC.get("components", {}).get("schemas", {})


def _resolve_schema(schema: dict | None, depth: int = 0) -> dict | None:
    if not schema or depth > 6:
        return None
    ref = schema.get("$ref")
    if ref:
        return _SCHEMAS.get(ref.rsplit("/", 1)[-1])
    return schema


def _has_data_field(schema: dict | None, depth: int = 0) -> bool | None:
    """True/False if determinable, None if the schema is too dynamic to tell."""
    resolved = _resolve_schema(schema, depth)
    if resolved is None or depth > 6:
        return None
    properties = resolved.get("properties")
    if properties is not None:
        return "data" in properties
    for combinator in ("allOf", "anyOf", "oneOf"):
        for sub in resolved.get(combinator, []):
            result = _has_data_field(sub, depth + 1)
            if result is not None:
                return result
    return None


def _response_data_fields() -> dict[tuple[str, str], bool]:
    """(verb, normalised path) -> whether the 200 response has a `data` field."""
    out: dict[tuple[str, str], bool] = {}
    for path, operations in _SPEC["paths"].items():
        key = _normalise_backend_path(path)
        for verb, op in operations.items():
            if verb.upper() in {"HEAD", "OPTIONS"}:
                continue
            schema = (
                op.get("responses", {})
                .get("200", {})
                .get("content", {})
                .get("application/json", {})
                .get("schema")
            )
            has_data = _has_data_field(schema)
            if has_data is not None:
                out[(verb.upper(), key)] = has_data
    return out


# Call sites that unwrap `.data`, across every surface including web's direct
# apiFetchJson calls (which the route-existence check above does not scan).
# NB: a TS generic argument like `<{ success: boolean; data: X }>` contains
# semicolons, so these patterns must not exclude `;` — excluding it was why an
# earlier draft of this guard matched almost nothing (and would have missed the
# very Prasna bug that motivated it). They exclude parens instead, which do not
# appear in the type positions being matched.
_UNWRAPPING_CALL_RE = re.compile(
    r"""(?:apiFetchJson|getApiClient\(\)\s*\.\s*(?:get|post|patch|put|delete)
        |\bapi(?:Get|Post|Patch|Put|Delete))
        (?P<generic><[^()]{0,300}?>)?\s*\(\s*["'`](?P<path>/[^"'`]*)""",
    re.VERBOSE | re.DOTALL,
)
_CAST_RE = re.compile(r"as\s+Promise<(?P<cast>[^()]{0,400}?)>\s*;", re.DOTALL)
_DATA_KEY_RE = re.compile(r"\bdata\s*[:?]")

_UNWRAP_SCAN_DIRS = (
    REPO_ROOT / "packages" / "shared" / "src" / "api",
    REPO_ROOT / "mobile" / "src" / "api",
    REPO_ROOT / "web" / "components",
    REPO_ROOT / "web" / "app",
    REPO_ROOT / "web" / "lib",
    REPO_ROOT / "web" / "hooks",
)
_SKIP_PARTS = {"node_modules", ".next", "__snapshots__"}


def _verb_for(call_text: str) -> str:
    lowered = call_text.lower()
    for verb in ("patch", "delete", "post", "put"):
        if verb in lowered:
            return verb.upper()
    return "GET"


def _iter_unwrapping_calls():
    """Yield (verb, normalised path, location) for call sites reading `.data`."""
    for directory in _UNWRAP_SCAN_DIRS:
        if not directory.is_dir():
            continue
        for ts_file in sorted(directory.rglob("*.ts*")):
            if any(part in _SKIP_PARTS for part in ts_file.parts):
                continue
            if not ts_file.is_file() or ".test." in ts_file.name:
                continue
            try:
                text = ts_file.read_text(encoding="utf-8", errors="ignore")
            except OSError:
                continue
            rel = ts_file.relative_to(REPO_ROOT).as_posix()
            for match in _UNWRAPPING_CALL_RE.finditer(text):
                generic = match.group("generic") or ""
                window = text[match.start(): match.start() + 600]
                # Don't let a cast-less call borrow the *next* declaration's cast.
                for boundary in ("\nexport ", "\nfunction ", "\nasync function "):
                    cut = window.find(boundary)
                    if cut != -1:
                        window = window[:cut]
                cast = _CAST_RE.search(window)
                expects_data = bool(_DATA_KEY_RE.search(generic)) or bool(
                    cast and _DATA_KEY_RE.search(cast.group("cast"))
                )
                if not expects_data:
                    continue
                # apiFetchJson takes an explicit `method:` in its init object;
                # the helper/client forms encode the verb in the callee name.
                verb_source = match.group(0)
                if "apiFetchJson" in verb_source:
                    method = re.search(r"method:\s*[\"'](\w+)[\"']", window)
                    verb = method.group(1).upper() if method else "GET"
                else:
                    verb = _verb_for(verb_source)
                line = text.count("\n", 0, match.start()) + 1
                yield verb, _normalise_wrapper_path(_to_absolute(match.group("path"))), f"{rel}:{line}"


WRAPPER_CALLS = sorted(set(_iter_wrapper_calls()))
BACKEND_ROUTES = _backend_routes()
RESPONSE_DATA_FIELDS = _response_data_fields()
UNWRAPPING_CALLS = sorted(set(_iter_unwrapping_calls()))


def test_wrapper_calls_were_discovered():
    """Guard the guard: a parser that silently matches nothing proves nothing."""
    assert len(WRAPPER_CALLS) > 40, (
        f"Only {len(WRAPPER_CALLS)} wrapper calls parsed — the regexes have "
        "probably drifted from the wrapper source style."
    )


def test_backend_routes_were_discovered():
    assert len(BACKEND_ROUTES) > 50, "OpenAPI schema looks empty/degenerate."


@pytest.mark.parametrize(
    ("verb", "raw_path", "location"),
    WRAPPER_CALLS,
    ids=[f"{verb} {path} ({loc})" for verb, path, loc in WRAPPER_CALLS],
)
def test_wrapper_path_exists_on_backend(verb: str, raw_path: str, location: str):
    absolute = _to_absolute(raw_path)
    normalised = _normalise_wrapper_path(absolute)

    served_verbs = BACKEND_ROUTES.get(normalised)
    assert served_verbs is not None, (
        f"{location}: wrapper requests {verb} {absolute!r}, but no backend route "
        f"serves {normalised!r}. Every real call to this wrapper 404s.\n"
        "Fix the wrapper's path (or add the backend route) — see "
        "docs/WEB_MOBILE_PARITY_AUDIT_2026-07-17.md."
    )
    assert verb in served_verbs, (
        f"{location}: wrapper requests {verb} {absolute!r}, but the backend route "
        f"{normalised!r} only accepts {sorted(served_verbs)}. Every real call to "
        "this wrapper 405s."
    )


def test_unwrapping_calls_were_discovered():
    """Guard the guard — see test_wrapper_calls_were_discovered."""
    assert len(UNWRAPPING_CALLS) > 20, (
        f"Only {len(UNWRAPPING_CALLS)} `.data`-unwrapping call sites parsed — the "
        "regexes have probably drifted from the call-site style."
    )


@pytest.mark.parametrize(
    ("verb", "path", "location"),
    UNWRAPPING_CALLS,
    ids=[f"{verb} {path} ({loc})" for verb, path, loc in UNWRAPPING_CALLS],
)
def test_data_unwrapping_matches_response_shape(verb: str, path: str, location: str):
    """A caller may only read `.data` if the route actually answers with one.

    Unlike a wrong path (404) or a wrong verb (405), this mismatch is silent:
    `res.data` is just `undefined`, the `as`-cast suppresses the type error, and
    the feature renders nothing forever.
    """
    has_data = RESPONSE_DATA_FIELDS.get((verb, path))
    if has_data is None:
        # Not judgeable, so don't guess. Either the route is unknown here (the
        # existence test above owns that), or it declares no response_model and
        # returns a raw dict — e.g. /charts/{id}/remedy-plan, which really does
        # envelope its payload but says so nowhere the schema can see. Giving
        # those routes response models would extend this guard's reach.
        return
    assert has_data, (
        f"{location}: call site unwraps `.data` from {verb} {path!r}, but that "
        "route answers FLAT — it has no `data` field. `res.data` is always "
        "undefined, so this silently renders nothing.\n"
        "Read the payload directly instead — see "
        "docs/WEB_MOBILE_PARITY_AUDIT_2026-07-17.md §8.3."
    )
