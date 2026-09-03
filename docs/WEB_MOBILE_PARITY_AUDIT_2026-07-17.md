# Web ↔ Mobile API Parity Audit — 2026-07-17

> **Status update — 2026-07-17 (same day): §2 (all P0 breakage) and §7.1/§7.2 are FIXED.**
> See [§8 Remediation log](#8-remediation-log-2026-07-17) at the bottom for exactly what changed,
> two corrections to this audit's own claims, and one *new* bug the fix work uncovered
> (**web Prasna was also broken**, for a different reason). §3–§6 remain open.

**Scope.** Every backend route in `app/api/` was cross-referenced against every call site in
`web/` (direct `apiFetchJson`, raw `fetch('/api/backend/...')`, and `@vinaadi/shared/api/*`
wrapper imports) and every call site in `mobile/` (`mobile/src/api/*` re-exports +
`mobile/app/**` screen imports). Method: static source audit only — no live requests were made.

**Verdict.** Web and mobile are **not** at parity. Mobile has two systemic wiring bugs that
make **9 mobile screens call endpoints that do not exist** (guaranteed 404s), plus a long tail
of web features with no mobile wiring at all, and several places where the same feature is
served by *different* endpoints on each surface.

---

## 1. Executive summary

| Category | Count | Status |
|---|---|---|
| Mobile screens wired to non-existent backend routes (hard 404) | 9 screens / 8 endpoints | ✅ Fixed (§8) |
| Shared wrappers pointing at dead routes (`tools.ts`) | 6 functions | ✅ Fixed (§8) |
| Shared wrappers broken **on mobile only** by the `/public/` prefix-bypass bug | 5 functions (2 live, 3 dormant) | ✅ Fixed (§8) |
| **Silent envelope unwrapping** — call sites reading `.data` from flat routes (found during §8, not in the original audit; killed web Prasna *and* web language sync outright) | 4 call sites / 2 features | ✅ Fixed + guarded (§8.3) |
| Web features with no mobile wiring | ~30 endpoints across 12 domains | ⬜ Open — needs product decisions (§7.3) |
| Same feature, different endpoint per surface | 8 divergences | ⬜ Open |
| Endpoints referenced by **neither** surface (cleanup candidates) | ~17 | ⬜ Open |

---

## 2. P0 — Mobile screens calling endpoints that do not exist

### 2a. Dead-route wrappers in `packages/shared/src/api/tools.ts`

These six wrappers target URLs that have **no matching route anywhere in `app/api/`**. Only
mobile calls them (web uses its own, correct, paths), so every one of these mobile screens
error-states on load. They look like relics of an older backend URL scheme
(`/public-tools/*`, `prashan` vs today's `prasna`).

| # | Shared wrapper | URL it requests | Backend reality | Mobile screen affected | Web equivalent (works) |
|---|---|---|---|---|---|
| 1 | `getDosham` | `GET /api/v1/charts/{id}/dosham` | **No route** | `(tabs)/tools/dosham.tsx` | dosham data via `/charts/{id}/jadhagam-report` / dashboard-bundle |
| 2 | `getYogam` | `GET /api/v1/charts/{id}/yogam` | **No route** | `(tabs)/tools/yogam.tsx` | yogam data via jadhagam-report / dashboard-bundle |
| 3 | `getPariharam` | `GET /api/v1/charts/{id}/pariharam` | **No route** | `(tabs)/tools/pariharam.tsx` | `GET /charts/{id}/remedy-plan` + `GET /charts/{id}/gemstone-advice` |
| 4 | `getNatchathiram` | `GET /api/v1/public-tools/natchathiram?number=N` | **No route** | `(tabs)/tools/natchathiram/[slug].tsx` | `GET /content/nakshatra/{n}` |
| 5 | `getPrashan` | `POST /api/v1/public-tools/prashan` | **No route** | `(tabs)/tools/prashan.tsx` | `POST /prasna` |
| 6 | `getMuhurta` | `GET /api/v1/muhurta?chartId=public&…` | **No route** (also `chartId` must be a UUID on the real route) | `(tabs)/tools/muhurta.tsx` (slot-finder half; the Decision Brief half works) | `GET /charts/{id}/muhurta` (authed picker) or `POST /public/muhurta` (guest tool) |

### 2b. Mobile client `/public/` prefix-bypass bug

`mobile/src/api/client.ts` (`buildApiUrl`):

```ts
const bypass = path.startsWith("/api/") || path.startsWith("/public/");
return ENV.API_BASE_URL + (bypass ? path : `${API_V1_PREFIX}${path}`);
```

Paths beginning `/public/` are sent **without** the `/api/v1` prefix — but the backend mounts
`public_tools` **only** at `/api/v1/public/*` (`app/main.py:244`; no unversioned mount, no
redirect). Web is unaffected because `web/lib/api.ts` `normalizeApiPath` *adds* `/api/v1` to
these same paths. Result: every shared wrapper with a `/public/...` path 404s on mobile only.

| Shared wrapper | Path | Mobile caller | Status on mobile |
|---|---|---|---|
| `getPorutham` (porutham.ts) | `POST /public/porutham/by-star` | `(tabs)/tools/porutham.tsx`, `(tabs)/tools/friendship.tsx` | **Broken, live** |
| `getPublicMuhurthamNaals` (mobile `muhurthamNaal.ts`) | `GET /public/muhurtham-naals` | `muhurtham-naal/index.tsx` (public list; the chart-matched call uses `/charts/...` and is fine) | **Broken, live** |
| `getRasiPalan` | `GET /public/rasi-palan` | none (RasiPalanCard is props-only; only contract tests call it) | Broken, dormant |
| `getRasiPalanGrid` | `GET /public/rasi-palan/grid` | web-only caller | Broken if mobile ever adopts |
| `getPoruthamGrid` | `POST /public/porutham/by-star/grid` | web-only caller | Broken if mobile ever adopts |

> **Why tests didn't catch any of this:** `mobile/__tests__/api/contracts.test.ts` mocks the
> HTTP client and asserts the *wrapper's own* path (e.g. asserts `getRasiPalan` calls
> `/public/rasi-palan`) — it bakes the wrong URL into the expectation. A route-existence check
> against the FastAPI OpenAPI schema (all wrapper paths ⊆ backend paths) would catch this
> whole class.

**Affected mobile screens (user-visible breakage):** Tools→Dosham, Tools→Yogam,
Tools→Pariharam, Tools→Prashan, Tools→Natchathiram detail, Tools→Muhurta (slot list),
Tools→Porutham, Tools→Friendship, Muhurtham-Naal (public tab). All are reachable from the
Tools tab / navigation — none are gated off.

---

## 3. Web features with **no mobile wiring**

Grouped by domain. "No wrapper" = the endpoint has no `packages/shared/src/api/` function at
all (per the forward policy in CLAUDE.md, one must be added before mobile consumes it).

### Predictions & insights
| Endpoint | Web surface | Mobile status |
|---|---|---|
| `GET /charts/{id}/predictions/{marriage,career,wealth,health}` | Life-Areas depth panels | No wrapper, no screen |
| `GET /charts/{id}/propensities` | "Chances & Cautions" panel (40 cards) | Shared wrapper exists; not re-exported, no screen |
| `GET /charts/{id}/event-windows` | Plan tab event windows | No wrapper, no screen |
| `POST /whatif` | Plan tab What-If | No wrapper, no screen |
| `GET /alerts/ambient` | Today-tab ambient alerts | No wrapper, no screen |
| `GET /daily-guidance/week-ahead` | Week-ahead strip | No wrapper, no screen |
| `GET /charts/{id}/dasha/timeline` | "Dasha story" narrative | Mobile uses plain `/charts/{id}/dasha` instead |
| `GET /transits/peyarchi-report/{id}` | Peyarchi report | Mobile uses simpler `/charts/{id}/peyarchi/upcoming` |
| `GET /charts/{id}/conditional-dashas` | Conditional-dashas panel (7 systems) | Re-exported in `mobile/src/api/dasha.ts` but **no screen imports it** — dasha screen shows only Vimshottari/Chara/Yogini/Ashtottari/Kalachakra |
| `GET /charts/{id}/solar-return` | Charts panel | No re-export, no screen (mobile has varshaphala only) |

### Journal & context
| Endpoint | Web surface | Mobile status |
|---|---|---|
| `PATCH/DELETE /journal/{id}` | Journal edit/delete | Mobile journal is create+list only |
| `GET /journal/prompts` | Prompted journaling | Not wired |
| `POST /journal/retention/apply`, `GET/PATCH /settings/journal` | Retention settings | Not wired |
| `GET /journal/export` | Journal export download | Not wired |
| `GET /journal/{chartId}/correlations` | Journal↔dasha correlations | Not wired |
| `GET/POST /context` | Mood check-in | Not wired |

### Family, relationships, porutham
| Endpoint | Web surface | Mobile status |
|---|---|---|
| `POST/PATCH/DELETE /family-vaults/{id}/members[/{mid}]` | Member management | Mobile can only list vaults / view today / create vault |
| `GET /family-vaults/{id}/daily-aggregate`, `/composite` | Family day aggregate + week composite | Not wired |
| `GET /relationships/alerts` | Relationship alerts | Not wired |
| `POST /relationships/compare`, `/compare-synastry`, `/compare/pdf` | Direct two-chart compare (+PDF) | Not wired (mobile has member synastry only) |
| `GET /relationships/{mid}/compatibility-intelligence[/direct]` (+2 PDF routes) | Compatibility-Intelligence panel | Not wired |
| `POST /porutham-shares`, `POST /porutham-shares/{id}/revoke` | Shareable porutham links | Not wired |
| `POST /public/compare`, `/public/compare/pdf` | Full-chart porutham tool (+PDF) | Not wired (mobile only has by-star, which is broken — §2b) |
| `POST /public/friendship-compatibility` | Friendship tool | Mobile approximates with **marriage** by-star porutham on vault members — different engine *and* currently 404s |
| `POST /public/chart`, `/public/chart-preview` | Guest chart tools | Not wired (mobile guests use onboarding flow) |

### Misc
| Endpoint | Web surface | Mobile status |
|---|---|---|
| `POST /prasna` | Prasna widget | Mobile calls dead `/public-tools/prashan` (§2a) |
| `GET /content/nakshatra/{n}` | Explore→Nakshatra | Mobile calls dead `/public-tools/natchathiram` (§2a) |
| `GET /charts/{id}/remedy-plan`, `/gemstone-advice` | Remedies card | Mobile calls dead `/charts/{id}/pariharam` (§2a) |
| `GET /activity-timing`, `/activity-timing/batch` | Today "Decide" + Plan timing cards | Shared wrapper exists (`activityTiming.ts`); not re-exported, no screen |
| `POST /decisions/brief` | Plan decisions | ✅ wired (muhurta screen) — listed for contrast |
| `GET /charts/{id}/share-card`, `GET /public/panchangam-share-card` | Server-rendered share cards | Mobile captures views locally (`ShareCaptureView`) instead |
| `POST /notifications/{id}/read`, `/notifications/read-all` | Inbox mark-read | Mobile inbox is **read-only** (`getNotificationInbox` only) |
| `GET/PATCH /settings/ui`, `/settings/life-mode` | Server-synced prefs (lang, life mode) — **note: the lang *read* was itself broken on web until §8.3b; it saved but never applied** | Mobile stores prefs locally (`userPrefs`) — do not roam across devices |
| `POST /feedback` | Feedback modal + settings tab | Not wired |
| `POST /reports/purchase` | Reports purchase page | Mobile reports screen is a static catalogue (RevenueCat products; purchase not wired to this endpoint — presumably native IAP + `/webhooks/revenuecat`) |
| `GET /auth/oauth/providers`, `/auth/oauth/google/start` | Google OAuth login | Mobile is email/password only |
| `PATCH /birth-profiles/{id}` | Edit birth profile | Mobile can create/list/delete but not edit |
| `DELETE /settings/notifications/fcm-token` | Push unregister on logout | Mobile registers (PUT) but never unregisters |
| `GET /stats/public` | Homepage stats | N/A (marketing) |
| `GET /charts/{id}/dashboard-bundle` | The 13-in-1 dashboard aggregate | Not used by mobile (see §5) |

*Web-only by design (not gaps): `/admin/*`, `/admin/analytics/*`, `/qa/*`, `POST /newsletter`.*

---

## 4. Mobile wiring with no web counterpart (reverse direction)

| Endpoint | Mobile surface | Web status |
|---|---|---|
| `GET /daily-snapshot` | Today tab | Web uses `/charts/{id}/dashboard-bundle` instead — see §5 |
| `GET /charts/{id}/dasha` (plain timeline) | Dasha screen, Insights | Web uses bundle + `/dasha/timeline` story |
| `GET /charts/{id}/peyarchi/upcoming` | Transits screen | Web uses `/transits/peyarchi-report/{id}` |
| `POST /geo/geocode` | Onboarding birth-place geocoding (server proxy) | Web uses a local TN-centric city dataset (known diaspora limitation) |
| `GET /users/me/subscription` | Me tab / premium | Web never surfaces subscription state |
| `POST /auth/mobile/{login,register,refresh,logout}` | Token auth + refresh | By design (web uses cookie auth) |
| `GET /charts/{id}` (full chart) | Jadhagam screens, rectification, reveal | Web reads chart via bundle/jadhagam-report |

---

## 5. Same feature, different endpoint — divergence risks

These are places where both surfaces have the feature but wired to *different* backend paths,
so fixes/doctrine changes can land on one surface and silently miss the other (this class has
bitten before — see the Nova/Classic calc-fork audit):

1. **Today screen data**: web = `GET /charts/{id}/dashboard-bundle` (aggregated, includes
   guidance, panchangam, yogas, explanation, etc.); mobile = `GET /daily-snapshot` +
   separate calls. Two different service compositions produce "today".
2. **Dasha detail**: web = bundle + `/charts/{id}/dasha/timeline` (narrative); mobile =
   `/charts/{id}/dasha` raw periods. Mobile also misses conditional dashas entirely.
3. **Peyarchi/transits**: web = `/transits/peyarchi-report/{id}`; mobile =
   `/charts/{id}/peyarchi/upcoming`. Different response shapes and content depth.
4. **Porutham tools**: web = full-chart `POST /public/compare` (+by-star tool with grid);
   mobile = by-star only (and broken). Web-only PDF.
5. **Friendship compatibility**: web = dedicated `/public/friendship-compatibility` engine;
   mobile = marriage by-star porutham between vault members — a semantically different
   calculation presented under the same feature name (and broken).
6. **Nakshatra encyclopedia**: web = `/content/nakshatra/{n}`; mobile = dead
   `/public-tools/natchathiram` with a *different expected response schema*
   (`NatchathiramData` vs the content payload).
7. **Remedies**: web = `/remedy-plan` + `/gemstone-advice`; mobile = dead `/pariharam` with
   its own `PariharamEntry` schema.
8. **Share cards**: web = server-rendered (`/charts/{id}/share-card`,
   `/public/panchangam-share-card`); mobile = local screenshot capture. Visual/branding
   drift between the two is unchecked.

Also worth noting: **muhurta** — web guest tool = `POST /public/muhurta`, web authed picker =
`GET /charts/{id}/muhurta`; mobile targets a third, non-existent path (§2a #6).

---

## 6. Endpoints referenced by **neither** surface (cleanup / decision candidates)

Static-audit result — verify before removal (external clients, widgets, or scheduled jobs may
still call them):

`GET /charts/{id}/gochar/current` · `GET /charts/{id}/sani-cycle` · `GET /charts/{id}/peyarchi`
· `GET /panchangam/timings` · `GET /daily-guidance/range` · `GET /charts/{id}/week-ahead`
(chart-scoped variant; web uses the profile-scoped one) · `GET /streak` (only `/streak/ping`
is used, by both) · `GET /relationships/{mid}/porutham` · `POST /public/porutham` (full-detail
public porutham; tools use by-star or compare) · `GET /public/panchangam-events[/{event}]` ·
`GET /public/calendar-categories[/{cat}]` · `GET /charts/{id}/summary` (wrapper exists,
no UI caller) · `GET /birth-profiles/{id}` (single get) · `GET /family-vaults/{id}/summary` ·
`GET /family-vaults/{id}/calendar` · `GET /family-vaults/{id}/journal[/summary]` ·
`GET /charts/{id}/explanation` (direct route; explanation content reaches web via the
dashboard bundle).

---

## 7. Suggested fix order (no changes applied)

1. **P0 — un-break the 9 mobile screens.** Two small changes fix most of it:
   a. Repoint the six `tools.ts` wrappers at the real routes (`/content/nakshatra/{n}`,
      `/prasna`, `/charts/{id}/muhurta` or `/public/muhurta`, remedies pair; dosham/yogam need
      a decision — either read from jadhagam-report/chart-full like web, or add real backend
      routes). Note the response schemas differ, so screens need mapping updates too.
   b. Remove `"/public/"` from the mobile client's prefix bypass (or make it
      `"/public/" → "/api/v1/public/"`). One-line fix; instantly repairs porutham, friendship,
      and public muhurtham-naals on mobile.
2. **Contract guard.** Add a test that loads the FastAPI OpenAPI route set and asserts every
   path template in `packages/shared/src/api/*` + `mobile/src/api/*` exists with the right
   verb — this class of drift is invisible to the current mock-based contract tests.
3. **Parity decisions, not code**: decide which §3 gaps are deliberate scope (journal depth,
   family CRUD, admin) vs. must-ship (mark-read in inbox, conditional-dashas screen,
   activity timing, ambient alerts are likely quick wins since shared wrappers/screens exist).
4. **Convergence**: longer-term, migrate mobile Today to the dashboard-bundle endpoint (or
   formally document `/daily-snapshot` as the mobile contract) so the two surfaces can't
   drift on "today" calculations.

---

## 8. Remediation log — 2026-07-17

All of §2 (the P0 breakage) plus §7 items 1 and 2 are done. Nothing in §3–§6 was touched.
**Not committed yet; no live device/browser pass has been run** — every claim below is backed
by types, tests, and the route table, not by a screen someone looked at.

### 8.1 Two corrections to this audit

1. **§2b's "why tests didn't catch this" was wrong about the cause.**
   `mobile/__tests__/api/contracts.test.ts` asserting `getRasiPalan` calls `/public/rasi-palan`
   is *correct* — that is the wrapper's proper path. The bug was never in the wrapper; it was
   `buildApiUrl` refusing to version-prefix it. The test isn't wrong, it's simply blind to this
   layer: it mocks the client, so `buildApiUrl` never runs. That test was therefore left alone
   and real coverage was added instead (`mobile/__tests__/api/buildApiUrl.test.ts`).
2. **§2a #6's fix suggestion for muhurta was under-specified.** `POST /public/muhurta` is not a
   drop-in: it takes `lat`/`lng`/`timezone`/`eventType` and returns `PublicMuhurtaResponse`
   (panchangam-only scoring), a different shape *and* a different calculation from the authed
   `GET /charts/{id}/muhurta` (which adds dasha + hora support). The chart-scoped route was
   chosen, matching web's authed picker.

### 8.2 What changed

| Area | Change |
|---|---|
| `mobile/src/api/client.ts` | Dropped `/public/` from the prefix bypass. Repairs porutham, friendship, and public muhurtham-naals on mobile. `buildApiUrl` is now exported so it can be tested. |
| `packages/shared/src/api/tools.ts` | All six dead wrappers repointed at real routes, with the response types the backend actually returns (verified against the live payload, not inferred). |
| `packages/shared/src/yogaDisplay.ts` **(new)** | `YOGA_DISPLAY` / `resolveYogaKey` / `displayName` extracted out of `web/components/dashboard-yoga-dosham-panel.tsx` so both surfaces name yogas/doshams from one table. Web re-exports them, so its dozen existing import sites are unchanged. |
| Mobile tools screens | `dosham`, `yogam`, `pariharam`, `prashan`, `natchathiram/[slug]`, `muhurta` remapped onto the real payloads (details below). |
| `web/components/dashboard-today-deepdive-extras-nova.tsx`, `dashboard-prasna-widget.tsx` | Fixed the envelope bug below. |

**Per-wrapper resolution:**

| Wrapper | Now calls | Screen consequence |
|---|---|---|
| `getNatchathiram` | `GET /content/nakshatra/{n}` | Fields were snake_case, payload is camelCase. `general_*` → `profile`. `pada_descriptions` **does not exist** on the real payload — that block is replaced by the real `strengths`/`cautions`. The screen's hardcoded `guna` table was dropped in favour of the backend's `ganam`/`yoni`, which it derives from the same classical tables the Porutham engine uses (one less client-side fork). |
| `getPrashan` → `askPrasna` | `POST /prasna` | **The screen's premise was wrong**: it took a free-text question, but the engine reads the sky at ask-time and keys on a `questionArea` enum — it never interpreted the text. Rewritten to web's area picker + outlook/indicators/caution rendering. |
| `getMuhurta` | `GET /charts/{id}/muhurta` | Sent `chartId` as a query param with the literal value `"public"`; the route wants a real chart UUID in the path. Quick-muhurta now requires a chart and reuses the screen's existing "Chart required" gate. |
| `getPariharam` | `GET /charts/{id}/remedy-plan` | The plan is keyed by **planet in priority order**, not by dosha, and has no "colours" field. Re-laid out as Temple / Mantra / Gemstone / Daanam / Fasting per planet. Gemstones honour `is_gemstone_prescribed` (the backend deliberately withholds one for some functional natures — no fallback invented). The response's fasting + no-guarantee disclaimer is now surfaced instead of dropped. |
| `getDosham`, `getYogam` | `GET /charts/{id}` (via `getChartFull`) | §2a said these "need a decision". Resolved: **no new backend routes.** `doshams`/`yogas` already ride on the full chart payload, which is where web reads them from too. Severity is now derived from `strength` + `isCancelled` (a cancelled dosham reads as clear, matching web); yogam filters to `isPresent`, which the old screen wrongly assumed of every row. |

### 8.3 New bug class found while fixing: **silent envelope unwrapping**

Not a parity gap — an independent bug class on the surface this audit treated as the working
one. It is the nastiest kind here: unlike a wrong path (404) or wrong verb (405), it throws
nothing. `res.data` is just `undefined`, the `as`-cast asserts a shape the route never sends so
the type checker stays quiet, and the feature renders nothing forever.

**Four call sites across two features were affected. Both features were dead on web.**

#### (a) Prasna — never rendered a result

`POST /prasna` returns its payload **flat** (`response_model=PrasnaResponse`; there is no
envelope middleware, and `tests/test_prasna_api.py` asserts `body["questionArea"]` at the top
level). Both web widgets did:

```ts
const res = await apiFetchJson<{ success: boolean; data: PrasnaResponse }>("/api/v1/prasna", …);
if (res.success && res.data) setResult(res.data);
else setError("No result returned.");
```

`apiFetchJson` does no unwrapping, so `res.success` is always `undefined` → **every ask fell to
the error branch and no result ever rendered.** Fixed in both. Note `dashboard-prasna-widget.tsx`'s
own `PrasnaWidget` component is orphaned (only its `QUESTION_AREAS`/`outlookLabel` are imported,
by the live Nova widget) — it was fixed too rather than left as a broken template to copy.

Pinned by `web/components/dashboard-prasna-widget.test.tsx`, which feeds the real flat payload
through both widgets. Confirmed to actually fail: re-introducing the old
`if (res.success && res.data)` makes it render "No result returned." — exactly what users saw.

#### (b) `GET /settings/ui` — the stored language preference never applied

Found by sweeping for the class rather than the instance (§8.6). `GET /settings/ui` answers flat
(`UiPrefsResponse` = `{ lang, dashboard_mode }`, no aliases, no envelope), but
`web/components/dashboard-workspace.tsx` and `web/app/dashboard/reports/page.tsx` both read
`r.data?.lang` → always `undefined`.

So the DB-backed language preference **never applied on load** — the feature §3 lists as
"Server-synced prefs (lang, life mode)" was silently doing nothing on web. It hid perfectly:
`.catch()` swallowed nothing (there was no error), and the localStorage fallback still produced
a plausible language, so the only visible symptom was that your language didn't roam across
devices — the entire point of storing it server-side. The PATCH (write) side was always correct,
so the value was being saved faithfully and then ignored. `/settings/life-mode` reads flat
correctly and was never affected.

### 8.4 The guard (§7.2) — `tests/test_api_wrapper_route_contract.py`

Two checks, both `no_db`, **150 passing**.

**1. Route existence.** Parses every `getApiClient().<verb>(…)` / `apiGet(…)` call in
`packages/shared/src/api` + `mobile/src/api`, applies the clients' prefixing rules, normalises
path params, and asserts each (verb, path) exists in the app's OpenAPI schema. Written *before*
the wrapper fixes, it failed on exactly the six dead wrappers and nothing else — independently
reproducing §2a from the route table.

**2. Envelope shape** (added after §8.3). For any call site that unwraps `.data` — including
web's direct `apiFetchJson` calls, which check 1 does not scan — asserts the route's 200 response
actually *has* a `data` field. This is what found the `/settings/ui` bug. Verified to fire on the
known-bad case rather than merely passing.

Both self-check (`test_wrapper_calls_were_discovered`, `test_unwrapping_calls_were_discovered`)
so a regex that silently matches nothing can't pass as green. **That guard earned its keep
immediately**: the first draft of check 2 matched only 4 call sites instead of 78, because its
regex excluded `;` — and a TS generic like `<{ success: boolean; data: X }>` is full of them. It
would have missed the very Prasna bug that motivated it while reporting green.

Known limitations, deliberate:
- A `${…}` interpolated mid-segment (e.g. `/charts/${id}/propensities${query}`, where `query` is
  a pre-built `?asOf=…`) is truncated at the interpolation rather than treated as a path param —
  otherwise it false-positives.
- Check 2 can only judge routes that declare a `response_model`. Routes returning a raw dict
  (e.g. `/charts/{id}/remedy-plan`, which *does* envelope its payload) are invisible to the
  schema and skipped rather than guessed at. **Giving those routes response models would widen
  the net** — a cheap follow-up with real value.

### 8.6 Method note — why the sweep beat the instance

The Prasna fix was found by reading one route. The `/settings/ui` bug was found by asking the
*general* question — "which call sites unwrap `.data` from a route that has none?" — across
every surface, mechanically, from the OpenAPI schema. That took one throwaway script and turned
one bug into a second, more damaging one (a feature that had been silently inert on web), then
into a permanent guard.

Worth repeating for the other silent classes: response *field* drift (a wrapper typing
`name_ta` where the payload sends `nameTa` — precisely what the natchathiram screen had) is the
obvious next candidate and is equally schema-checkable.

### 8.5 Verification

Shared `tsc` clean · web `tsc` + `lint` clean, vitest **163/163** · mobile `tsc` clean for
`app/`+`src/` and `lint` 0 errors, jest green (contract tests **19**) · backend: contract guard
**150 passed**, prasna/remedies/content API tests **9 passed** against test Postgres.

Two checks went beyond "the suite is green", because green proves little on its own:
- The nakshatra payload was dumped from a live `TestClient` call and matched against the new
  types field by field (confirming camelCase aliases, and snake_case *inside*
  `compatibleGroupsRich`).
- Both new regression tests were confirmed to **fail on the pre-fix code**, not just pass on the
  fixed code.

Mobile `tsc` still reports 6 errors in files this work never touched (`app/(tabs)/today.tsx`
`fmt` + `@expo/vector-icons`, `app/dasha/index.tsx`, `src/api/dasha.ts`, `src/components/ListItem.tsx`).
Pre-existing; worth their own pass. Mobile's tsconfig also lacks jest types, so every test file
errors under `pnpm tsc` — filter `__tests__/` when reading that output.

**Decided:** Prashan ships as the area picker (matches web). The free-text box is gone for good,
not deferred — the engine never read it.

**Owed:** a real device pass on the 9 repaired screens, and an authed browser pass on web Prasna
+ cross-device language sync (§8.3b) — both are now test-pinned but neither has been seen running.
