"""Field-name contract guard for TypeScript API wrappers.

``test_api_wrapper_route_contract.py`` proves a wrapper's **path** and **verb**
reach a real route, and that a caller only unwraps ``.data`` from a route that
sends one. It says nothing about the **field names** inside the response, and
that gap is the quietest of the three:

* a wrong path is a 404,
* a wrong verb is a 405,
* a misspelled field is ``undefined`` — no error, no type error (the wrapper's
  ``as Promise<T>`` cast asserts the lie), and the UI renders a blank where a
  number should be, forever.

There is no compile-time link between a pydantic ``Field(alias="lagnaRasi")``
and a TypeScript ``lagnaRasi: number``. This test builds one: it parses the
exported interfaces in ``packages/shared/src/api``, matches each wrapper's
``as Promise<SomeInterface>`` cast to that route's 200 response schema in the
app's own OpenAPI document, and walks both trees together comparing names.

**Only one direction is an error.** A field TypeScript declares that the backend
never sends is always ``undefined`` — a bug. A field the backend sends that
TypeScript has not declared is merely unused, which is how every one of these
wrappers starts life. Failing on the second would make the guard unusable.

Where a schema cannot be resolved to a concrete object (a raw ``dict`` response,
an ``additionalProperties`` map, a route with no ``response_model``) the walk
stops rather than guesses. Silence there is honest: the route-existence guard
already documents that giving those routes response models would extend both
guards' reach.
"""

from __future__ import annotations

import re
from pathlib import Path

import pytest

# Reuse the sibling guard's path handling rather than restating it. Two copies
# of "how a wrapper path maps to a backend path" is two chances for the guards
# to disagree about which route they are even talking about.
from test_api_wrapper_route_contract import (
    _normalise_backend_path,
    _normalise_wrapper_path,
    _to_absolute,
)

from app.main import app

# Pure static analysis + OpenAPI introspection — never touches the database.
pytestmark = pytest.mark.no_db

REPO_ROOT = Path(__file__).resolve().parents[1]
WRAPPER_DIR = REPO_ROOT / "packages" / "shared" / "src" / "api"
#: Wrapper response interfaces routinely nest a shared type declared in
#: ``src/types`` (``kutas: KutaResult[]``). Parsing only ``src/api`` meant
#: ``_base_type`` resolved such a field to a name this file had never seen, and
#: the walk stopped — the guard's documented "silence where a schema cannot be
#: resolved", swallowing whole subtrees rather than one field.
#:
#: **That blind spot cost us a live bug.** ``KutaResult.passed`` was declared in
#: ``src/types`` and never emitted by any backend schema, so the public porutham
#: share page — whose row renders ``passed ? "Pass" : "Fail"`` — printed
#: "✗ Fail" on all ten poruthams of every shared link. Undetected until
#: 2026-08-31, by which time it had been in the type for months. Nesting is
#: exactly where a field goes unread longest, which is where the guard is worth
#: the most.
TYPES_DIR = REPO_ROOT / "packages" / "shared" / "src" / "types"

_SPEC = app.openapi()
_SCHEMAS = _SPEC.get("components", {}).get("schemas", {})

# export interface Foo { ... }  /  export interface Foo extends Bar { ... }
# Brace-matched rather than regex-delimited. The original pattern ended the body
# at a `}` in column 0 and read members at exactly two spaces of indent, which
# silently skipped every **single-line** interface — and `src/types/index.ts`,
# where the shared shapes live, writes many of them that way:
#
#     export interface KutaResult { name: string; passed: boolean; ... }
#
# An interface the parser cannot see is not reported as unparsed; it simply
# never enters `INTERFACES`, so any wrapper field typed with it resolves to an
# unknown name and the walk stops — indistinguishable from the honest silence
# this guard keeps for genuinely unresolvable schemas. `KutaResult.passed` hid
# in that gap and shipped a public page that printed "Fail" on every row.
_INTERFACE_HEAD_RE = re.compile(r"^export interface (?P<name>\w+)[^{]*\{", re.MULTILINE)
_MEMBER_RE = re.compile(r"^\s*(?P<name>\w+)(?P<optional>\?)?\s*:\s*(?P<type>.+)$", re.DOTALL)


#: A member ends at a top-level `;` or at a newline (one-per-line style).
_MEMBER_SEPARATORS = ";" + chr(10)


def _interface_bodies(text: str) -> list[tuple[str, str]]:
    """(name, body) for each interface, with the body brace-matched."""
    out: list[tuple[str, str]] = []
    for head in _INTERFACE_HEAD_RE.finditer(text):
        depth, i = 1, head.end()
        while i < len(text) and depth:
            if text[i] == "{":
                depth += 1
            elif text[i] == "}":
                depth -= 1
            i += 1
        if depth == 0:
            out.append((head.group("name"), text[head.end():i - 1]))
    return out


def _top_level_members(body: str) -> list[tuple[str, str, bool]]:
    """Members declared at depth 0, however the file lays them out.

    Depth tracking replaces the old indent rule and preserves its intent: a
    member of a nested inline object sits at depth >= 1 and belongs to an
    anonymous type with no interface name to recurse into, so it is skipped.
    """
    chunks, depth, buf = [], 0, []
    for ch in body:
        if ch in "{[(":
            depth += 1
        elif ch in "}])":
            depth -= 1
        if depth == 0 and ch in _MEMBER_SEPARATORS:
            chunks.append("".join(buf))
            buf = []
        else:
            buf.append(ch)
    chunks.append("".join(buf))

    members: list[tuple[str, str, bool]] = []
    for chunk in chunks:
        chunk = chunk.strip()
        # Drop comment lines; a `//` or `*` line can otherwise look like a member.
        if not chunk or chunk.startswith(("//", "/*", "*")):
            continue
        m = _MEMBER_RE.match(chunk)
        if m:
            members.append((m.group("name"), m.group("type").strip(), bool(m.group("optional"))))
    return members

# getApiClient().get("/x", …) as Promise<FooResponse>
#              …or as Promise<{ success: boolean; data: FooData }>
#
# **The inline-envelope form was skipped entirely until 2026-08-31**, on the
# stated grounds that it "has no identifier to look up". It has one — the `data`
# member's type — and the form is not a rare corner: 45 of the client's 83 casts
# are written this way, so more than half the shared client had never been
# checked by this guard at all. Every porutham wrapper is in that half, which is
# why `KutaResult.passed` could be declared, never sent, and consumed by the
# public share page for months without this test noticing.
#
# The regex stops at the opening of the type argument; the type itself is
# brace-matched below, because a regex cannot balance `{}` inside `<>`.
_WRAPPER_CAST_RE = re.compile(
    r"""getApiClient\(\)\s*\.\s*(?P<verb>get|post|patch|put|delete)\s*\(\s*
        (?P<q>["'`])(?P<path>/[^"'`]*)(?P=q)
        [^;]{0,500}?as\s+Promise<\s*""",
    re.VERBOSE | re.DOTALL,
)


def _cast_type_at(text: str, pos: int) -> tuple[str, str] | None:
    """The cast's type argument, as ("named", Name) or ("envelope", DataType).

    An envelope resolves to the named type of its `data` member — the payload
    every consumer actually reads. An envelope whose `data` is itself anonymous
    has no interface to compare and returns None, which is the guard's usual
    honest silence.
    """
    if pos >= len(text):
        return None
    if text[pos] != "{":
        m = re.match(r"\w+", text[pos:])
        return ("named", m.group(0)) if m else None
    depth, i = 1, pos + 1
    while i < len(text) and depth:
        if text[i] == "{":
            depth += 1
        elif text[i] == "}":
            depth -= 1
        i += 1
    if depth:
        return None
    for name, declared, _optional in _top_level_members(text[pos + 1:i - 1]):
        if name == "data":
            base = _base_type(declared)
            if base:
                return ("envelope", base)
    return None


def _parse_interfaces() -> dict[str, list[tuple[str, str, bool]]]:
    """Interface name -> [(field, declared type, optional)] for the shared client."""
    out: dict[str, list[tuple[str, str, bool]]] = {}
    # `src/api` last: a wrapper-local interface wins over a same-named shared
    # one, matching how TypeScript resolves the wrapper's own declaration.
    sources = sorted(TYPES_DIR.rglob("*.ts")) + sorted(WRAPPER_DIR.rglob("*.ts"))
    for ts_file in sources:
        if ts_file.name.endswith(".test.ts"):
            continue
        text = ts_file.read_text(encoding="utf-8")
        for name, body in _interface_bodies(text):
            fields = _top_level_members(body)
            if fields:
                out[name] = fields
    return out


def _base_type(declared: str) -> str | None:
    """The single named type a declaration reduces to, if there is one.

    ``SavedNameSession[]`` -> ``SavedNameSession``; ``BiText | null`` -> ``BiText``;
    ``string`` -> ``string``. A genuine union of two named types returns None —
    there is no single schema to walk into, and guessing a branch would produce
    exactly the false positive that gets a guard deleted.
    """
    parts = [p.strip() for p in declared.split("|")]
    named = [p for p in parts if p not in {"null", "undefined"}]
    if len(named) != 1:
        return None
    candidate = named[0].removesuffix("[]").strip()
    return candidate if re.fullmatch(r"\w+", candidate) else None


def _resolve(schema: dict | None, depth: int = 0) -> dict | None:
    """Dig through $ref / nullable anyOf / allOf / array items to an object schema."""
    if not isinstance(schema, dict) or depth > 8:
        return None
    ref = schema.get("$ref")
    if ref:
        return _resolve(_SCHEMAS.get(ref.rsplit("/", 1)[-1]), depth + 1)
    if "properties" in schema:
        return schema
    if schema.get("type") == "array":
        # A TS `X[]` field lines up with the array's *item* schema.
        return _resolve(schema.get("items"), depth + 1)
    for combinator in ("anyOf", "oneOf", "allOf"):
        for branch in schema.get(combinator, []):
            if isinstance(branch, dict) and branch.get("type") == "null":
                continue
            resolved = _resolve(branch, depth + 1)
            if resolved is not None:
                return resolved
    return None


def _response_schemas() -> dict[tuple[str, str], dict]:
    """(verb, normalised path) -> the raw 200 response schema."""
    out: dict[tuple[str, str], dict] = {}
    for path, operations in _SPEC["paths"].items():
        key = _normalise_backend_path(path)
        for verb, operation in operations.items():
            if verb.upper() in {"HEAD", "OPTIONS"}:
                continue
            for code in ("200", "201"):
                schema = (
                    operation.get("responses", {})
                    .get(code, {})
                    .get("content", {})
                    .get("application/json", {})
                    .get("schema")
                )
                if schema:
                    out[(verb.upper(), key)] = schema
                    break
    return out


def _iter_wrapper_casts():
    """Yield (verb, normalised path, interface name, location) per typed wrapper."""
    for ts_file in sorted(WRAPPER_DIR.rglob("*.ts")):
        if ts_file.name.endswith(".test.ts") or ts_file.name == "client.ts":
            continue
        text = ts_file.read_text(encoding="utf-8")
        rel = ts_file.relative_to(REPO_ROOT).as_posix()
        for match in _WRAPPER_CAST_RE.finditer(text):
            found = _cast_type_at(text, match.end())
            if found is None:
                continue
            kind, type_name = found
            line = text.count(chr(10), 0, match.start()) + 1
            yield (
                match.group("verb").upper(),
                _normalise_wrapper_path(_to_absolute(match.group("path"))),
                type_name,
                f"{rel}:{line}",
                # Where in the 200 body this type sits: the whole response, or
                # the `data` member of an envelope.
                "data" if kind == "envelope" else None,
            )


INTERFACES = _parse_interfaces()
RESPONSE_SCHEMAS = _response_schemas()

#: Drift that already existed when this guard was written, recorded rather than
#: hidden, so the guard can go green and protect everything else from today.
#:
#: **This allowlist is self-cleaning.** If a recorded field stops being drift,
#: the test below fails and tells you to delete the entry — an allowlist that
#: silently outlives its bug is how a guard rots into decoration.
#:
#: ``MeResponse.displayName`` — **there is no user display name in this system.**
#: ``users`` has no such column, registration does not accept one, and
#: ``updateMe({ displayName })`` patches a field ``UpdateUserSettingsRequest``
#: discards. So this is not drift to be renamed away; adding it means inventing
#: a user attribute (column + migration + a way to set it), which is a product
#: decision. The TS field is typed ``undefined`` so the compiler tells the truth
#: about it meanwhile.
#:
#: ``MeResponse.tier`` **was** here and is now fixed (2026-07-27): the same
#: first run of this guard found that mobile stored ``undefined`` as the session
#: tier whenever RevenueCat was unavailable, because no route had ever sent the
#: field. ``AuthUserResponse.tier`` now derives it from the subscription table.
#: ``GuidanceEnvelope.data.chandrashtamaEnds`` **was** here, found 2026-08-31 the
#: moment this guard learned to descend into ``src/types``, and is now fixed
#: (2026-09-01). It had never once rendered: ``ChandrashtamaCard``'s
#: "Ends: <time>" line always fell through to its untimed fallback, on web and on
#: the hybrid charts page, and mobile's defensive
#: ``chandrashtamaEnds ?? chandrashtama_ends`` was dead on both branches.
#: ``daily_guidance_service`` now sends it, derived from the same
#: ``moon_rasi_spans`` that decide the badge. This guard is what reported the
#: fix: it failed with "the bug is fixed — delete those entries", which is the
#: self-cleaning property working as designed.
KNOWN_DRIFT: dict[str, set[str]] = {
    "MeResponse": {"MeResponse.displayName"},
}

# Only the casts resolving to an interface this file actually parsed. A cast
# naming a type declared outside `src/api` and `src/types` is still skipped.
WRAPPER_CASTS = sorted(
    {row for row in _iter_wrapper_casts() if row[2] in INTERFACES},
    key=lambda row: (row[2], row[0], row[1]),
)


def _schema_to_walk(verb: str, path: str, envelope_field: str | None) -> dict | None:
    """The part of the 200 body the cast's type describes."""
    schema = RESPONSE_SCHEMAS.get((verb, path))
    if schema is None or envelope_field is None:
        return schema
    resolved = _resolve(schema)
    if resolved is None:
        return None
    return (resolved.get("properties") or {}).get(envelope_field)


def _walk(
    interface: str,
    schema: dict | None,
    trail: str,
    problems: list[str],
    seen: set[tuple[str, str]],
) -> int:
    """Compare one interface against one schema. Returns fields actually compared."""
    resolved = _resolve(schema)
    if resolved is None:
        return 0
    properties = resolved.get("properties") or {}
    if not properties:
        return 0

    compared = 0
    for field, declared, _optional in INTERFACES.get(interface, []):
        compared += 1
        if field not in properties:
            problems.append(f"{trail}.{field}  (declared as `{declared}`)")
            continue
        nested = _base_type(declared)
        if nested and nested in INTERFACES and (interface, nested) not in seen:
            compared += _walk(
                nested,
                properties[field],
                f"{trail}.{field}",
                problems,
                seen | {(interface, nested)},
            )
    return compared


def test_interfaces_and_casts_were_discovered():
    """Guard the guard: a parser that silently matches nothing proves nothing.

    Floors sit below what was actually measured — 287 interfaces and 72 typed
    casts as of 2026-08-31 (was 132/29 when written, before the parser learned
    single-line interfaces and inline `{ success, data }` envelopes) — rather
    than at a round number guessed at. Raise them when the reach grows; a floor
    left at an old number is how a guard quietly loses half its coverage again.
    """
    assert len(INTERFACES) > 250, (
        f"Only {len(INTERFACES)} shared interfaces parsed — the interface regex "
        "has probably drifted from the source style."
    )
    assert len(WRAPPER_CASTS) >= 65, (
        f"Only {len(WRAPPER_CASTS)} typed wrapper casts parsed — the cast regex "
        "has probably drifted from the wrapper style."
    )


def test_the_walk_actually_reaches_nested_fields():
    """The value is in the nesting, so prove the walk gets there.

    A version of this guard that resolved no nested schema would still pass every
    per-wrapper test below while checking only a handful of top-level names.
    """
    total = 0
    for verb, path, interface, _location, envelope in WRAPPER_CASTS:
        schema = _schema_to_walk(verb, path, envelope)
        if schema is None:
            continue
        total += _walk(interface, schema, interface, [], set())
    assert total > 2400, (
        f"Only {total} fields compared across every wrapper — the schema "
        "resolver is probably bailing out early and the guard is hollow. "
        "704 were compared when this was written; 2699 after the parser was "
        "taught the two shapes it had been silently skipping (2026-08-31)."
    )


@pytest.mark.parametrize(
    ("verb", "path", "interface", "location", "envelope"),
    WRAPPER_CASTS,
    ids=[f"{interface} <- {verb} {path}" for verb, path, interface, _, _e in WRAPPER_CASTS],
)
def test_wrapper_fields_exist_on_the_backend_response(
    verb: str, path: str, interface: str, location: str, envelope: str | None
):
    """Every field the wrapper's type declares must be one the route sends.

    Failure means the field is permanently ``undefined`` at runtime while
    ``tsc`` stays green, because the wrapper's cast asserts a shape nobody
    checked. Fix by correcting the TypeScript name to match the backend's alias
    — or, if the backend is the one that is wrong, by changing the alias and
    every consumer in the same change (CLAUDE.md, API contracts).
    """
    schema = _schema_to_walk(verb, path, envelope)
    if schema is None:
        # The route-existence guard owns "this path does not exist"; a route with
        # no JSON 200/201 body has nothing to compare.
        pytest.skip(f"no response schema for {verb} {path}")

    problems: list[str] = []
    compared = _walk(interface, schema, interface, problems, set())
    if compared == 0:
        pytest.skip(f"{verb} {path} response schema is not a concrete object")

    known = KNOWN_DRIFT.get(interface, set())
    unexpected = [problem for problem in problems if problem.split("  ")[0] not in known]
    assert not unexpected, (
        f"{location}: `{interface}` declares field(s) that {verb} {path} never "
        "sends, so they are `undefined` at runtime while tsc stays green:\n  "
        + "\n  ".join(unexpected)
    )

    # Self-cleaning: a recorded entry that is no longer drift must be deleted,
    # or the allowlist quietly starts excusing a field that is fine today and
    # breaks tomorrow.
    still_drifting = {problem.split("  ")[0] for problem in problems}
    stale = known - still_drifting
    assert not stale, (
        f"KNOWN_DRIFT for `{interface}` lists {sorted(stale)}, which now match "
        f"{verb} {path}. The bug is fixed — delete those entries from "
        "KNOWN_DRIFT in this file."
    )
