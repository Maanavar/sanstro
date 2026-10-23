# API contracts and the display boundary

Moved word for word from `CLAUDE.md` (lines 97-153) on 2026-10-22. `CLAUDE.md` keeps the short form and points here.

## API contracts — coordinate across surfaces

API routes, query params, and response shapes are a shared contract across four locations, not backend-internal:
- `app/api/` (backend)
- `packages/shared/src/api/` (shared client)
- `mobile/src/api/`
- `web/`

A change made only in the backend (e.g. renaming a param, moving a path segment to a query param) breaks the other consumers silently at runtime — there is no compile-time check across this boundary. Before changing a route path, query param name, or response shape, grep all four locations for callers and update them in the same change. Prefer query params over path segments for optional filters — easier to add without breaking existing callers.

### `packages/shared/src/api/` forward policy

`web/` mostly bypasses the shared client today (direct `apiFetchJson(...)` calls with hardcoded paths in hooks/components) — that's grandfathered, don't touch existing call sites as drive-by cleanup. But going forward:

- Any **new** backend endpoint gets a typed wrapper added to `packages/shared/src/api/`, and any new web/mobile code consuming it **must** use that wrapper, not a fresh direct-fetch call. Don't grow the bypass pattern further.
- When a shared wrapper already exists and is correct for what you're building, use it — don't add a second, parallel direct-fetch path to the same endpoint.
- A wrapper's URL/method/params are unverified by the type system (they're a hand-typed string + `ApiClient.get/post/patch/put/delete` call, not generated from the FastAPI route) — when adding or touching one, actually re-read the backend route decorator and confirm the path shape (path param vs. query param) and HTTP verb before wiring it up. Two of these silently drifted wrong in the past (`getDailyGuidance` used a query param where the backend expected a path param; `registerFcmToken` sent `PATCH` where the backend only accepts `PUT`) and would have failed on first real use.
- If a change adds a route (or ports one) that only mobile currently reaches through the shared client, that's fine — don't delete a wrapper just because `web/` doesn't call it yet; check `mobile/` for callers before deleting anything from `packages/shared/src/api/`.

## Display boundary — never render a name the server chose

The backend sends most astrology terms **twice**: a language-free key and a
pre-rendered English name. For one rasi it sends three — `rasi` (number),
`rasiName` (`"Mithunam"`) and `rasiCode` (`"MITHUNAM"`). The same doubling
exists for `lord`/`graha`, nakshatra, tithi, yoga, karana and the Saturn-cycle
`type`.

**Render the key through the localiser. Never render the name field.**

| Read this | Not this | Through |
|---|---|---|
| `rasi` (number) | `rasiName`, `rasiCode`, `lagnaRasiName`, `munthaRasiName` | `rasiDisplayName(rasi, lang)` — `lib/chart-utils` |
| `graha`, `lord` | the bare string | `tPlanetLord(key, lang)` — `lib/i18n` |
| `nakshatraName`, tithi, yoga, karana | the bare string | `tNakshatra` / `tTithi` / `tYoga` / `tKarana` |
| Saturn-cycle `type` | the bare tag | `saniCycleName(tag, lang)` — `lib/family-flags` |

**Why:** a name field is English-only, so rendering it prints `Mithunam` at a
Tamil reader; a code field prints `MITHUNAM` at everybody. DXA-08 fixed the
code half, was gated PASS, and left **nine** surfaces rendering the name half —
the gate greps for `UPPER_CASE` and a correctly-cased English word trips no
regex. `web/lib/rasi-display-boundary.test.ts` now ratchets the rasi case in CI.
Nothing ratchets the others: a raw `period.lord` was still sitting in a dasha
tooltip months later, two files from a twin that localised it correctly.

**How to apply:**
- Writing a component: if a field name ends in `Name` or `Code`, it is the wrong
  field. Look for its key twin in `packages/shared/src/types/index.ts` — it is
  almost always right beside it.
- Reviewing: grep the diff for `.rasiName`, `.rasiCode`, `.lord`, `.graha`.
- `title=` and `aria-label=` count as rendering. They carry the same leak and
  **no** browser text probe can see them — `innerText` does not include
  attributes.
- Tamil-mode checks are not optional for this class: every harness phase except
  `ta` runs the audit account in English, so an English-only pass proves nothing
  about it. The `ta` phase reads visible text only — it cannot see `title=` or
  `aria-label=` either.

