# Efficiency & Reuse Fix Plan — 2026-08-07

Companion to [REUSE_AUDIT_2026-08-07.md](REUSE_AUDIT_2026-08-07.md). That document says
*what* is duplicated; this one says *what to do, in what order, on which surface*.

---

## 0. The two surfaces, and why the split drives the plan

This product is two applications sharing one Next.js tree, and they have **opposite cost
models**. A fix that helps one can be neutral or harmful on the other, so every item below
is tagged **[M]** marketing, **[D]** dashboard, or **[S]** shared/backend.

| | **[M] Marketing / public** | **[D] Dashboard / signed-in** |
|---|---|---|
| Routes | `/`, `/tools/*`, `/learn/*`, `/dosham/*`, `/temples/*`, `/natchathiram/*`, `/pariharam/*`, `/yogam/*`, `/tamil-calendar/*`, `/features/*`, `/trust/*`, `/panchangam/*` | `/dashboard/*` (+ `/login`, `/admin`) |
| Files | 167 `.tsx` under `app/` (55 are `"use client"`) | 107 dashboard-scoped `.tsx` + `app/dashboard/*` |
| Design system | `.cl-*` / `.clf-*` ("Clarity"), `.mk-*`, `.site-*` — **479 + 31 + 21 classes** | `.cd-*` ("Nova") in `dashboard.css` + `dashboard-nova.css` |
| Data | `marketing-i18n.ts` (2,490 ln), `guide-detail-content.ts` (2,568 ln), `natchathiram-data.ts` (2,474 ln) — static, build-time | live API via `apiFetchJson` / react-query |
| What "efficient" means | **first-load bytes, LCP, CLS, SEO.** One-shot visitor, cold cache, often mobile data | **interaction latency, refetch waterfalls, re-render cost.** Warm cache, long session |
| Success metric | transferred KB on a cold `/` and `/tools/*` | time-to-interactive on tab switch; number of network round-trips per tab |

**The one-line summary of the problem:** the *JavaScript* boundary between these two is
clean, but the *CSS* boundary is not. Marketing's design system lives in the root layout,
so every signed-in dashboard page downloads it.

### What is already clean — do not touch

Verified, so nobody wastes a sprint "fixing" these:

- **Marketing data modules are properly confined.** `marketing-i18n.ts`,
  `guide-detail-content.ts`, `natchathiram-data.ts` (7,500+ lines combined) are imported
  only by `app/` marketing routes. Zero leak into the dashboard bundle.
- **`framer-motion` is dashboard-only.** 9 importers, all under dashboard/login. The
  `components/ui` barrel already deliberately excludes `Score`/`Table`/`ProgressBar` to keep
  it that way — keep honouring that.
- **Code-splitting exists where it matters.** `dashboard-workspace.tsx` uses `next/dynamic`
  16 times.
- **`packages/shared/src/api/`** is real and used. **`share-card-canvas.ts`** is properly
  factored. **Backend routers** use FastAPI `Depends()` consistently (315 sites, 43 files).
  **Ephemeris/panchangam** already carry `lru_cache` + a Redis layer (`app/core/cache.py`).

---

## Phase 1 — Correctness first (do not batch with anything else)

These are shipping defects found by the reuse audit. They are small, surgical, and each is
independently releasable. **Nothing else in this plan should jump the queue.**

### F1 · [S] One `assert_chart_owner`, and give `muhurta.py` one — **live IDOR**

`_assert_chart_owner` is copy-pasted 5× with identical bodies
(`charts.py:62`, `daily_guidance.py:40`, `transits.py:21`, `numerology.py:100`,
`remedies.py:22`), differing only in return type. Because the rule lives in five places,
`app/api/muhurta.py` never got it — `_current_user` is underscore-prefixed (deliberately
unused), and neither `find_best_muhurta_slots` nor `list_muhurtham_naals` accepts a
`user_id`, so nothing downstream re-checks.

Any authenticated user with a chart UUID can read another user's output from
`GET /api/v1/charts/{chart_id}/muhurta` and `/muhurtham-naals`.

**Do:**
1. New `app/core/chart_access.py`:
   ```python
   def assert_chart_owner(session, chart_id, current_user) -> tuple[Chart, BirthProfile]:
   ```
   (superset of all five — callers that ignored the return keep ignoring it).
2. Replace the 5 local definitions with an import. Keep the private aliases if you want a
   zero-diff call-site change: `_assert_chart_owner = assert_chart_owner`.
3. Add it to both `muhurta.py` routes.
4. Test: for each `chart_id` route, user B requesting user A's chart gets 403. Parametrise
   over the router list so a *new* router without the guard fails the test.
5. Audit the ~9 remaining `chart_id` routers (`annual_wrapped`, `life_event_log`,
   `public_tools`, `relationships`, `reports`, `retrospective`, `share_card`). Some
   legitimately scope in the service layer via a `user_id ==` filter — `context.py` does
   this correctly. Either pattern is fine; **pick one per router and record which**, because
   today the mix is what makes the rule unverifiable.

**Effort:** ~1h + tests. **Surface:** backend, affects [D].

#### ✅ LANDED 2026-08-07 — and the audit above was wrong in three ways

Every correction made the item bigger, which is worth noting on its own: an audit that
undercounts a security rule undercounts it in the unsafe direction.

**1. Six copies, not five.** `journal.py:46` had one too.

**2. They were not "identical bodies differing only in return type" — `journal.py`'s had
already drifted.** It omitted the `deleted_at` check, so a chart whose birth profile had been
soft-deleted stayed readable through that route, and it answered **403 where the other five
answer 404**, which leaks chart existence to a non-owner. Neither is visible reading that copy
on its own; both were obvious the moment six sat in one place. This is the drift the item
predicted for `F3` — it had already happened here.

**3. `muhurta.py` was not the only unguarded router. `share_card.py` was the same defect**,
found by doing step 5 rather than by reading the audit. `generate_card_data(session, chart_id,
card_type, resolved_date)` takes **no owner argument at all**, so a signed-in user with any
chart UUID got a 200 carrying that chart's daily score, headline, best windows and running
dasa lord. Verified by removing the new guard and watching the test return the payload.

**Two independent instances is the actual argument for the shared module.** The failure mode is
not a bad copy of the rule — it is a router that never got one, and absence does not appear in
a diff.

**Also fixed:** `transits.gochar_current` validated its query params *before* authorising, so a
non-owner probing it got a helpful 422 about parameter shape instead of a 403. `sani_cycle`
three lines below already had the right order.

**Landed:**

- `app/core/chart_access.py` — one `assert_chart_owner`, superset of all six, 404-before-403 so
  a missing chart and someone else's chart are indistinguishable.
- Six local copies replaced (aliased to `_assert_chart_owner`, so call sites are unchanged).
- `muhurta.py` ×2 and `share_card.py` ×1 guarded.
- `tests/test_chart_access_guard.py`, 25 tests. Structural half enumerates all **52**
  `{chart_id}` routes off the live app and fails until each owning module declares
  `router-guard` or `service-scope`; behavioural half drives 8 routes as a second user and
  requires **403**, with valid params so a 422 cannot pass for a guard.
- 250 tests green across every router touched.

**One honest gap:** the structural half sees **path** params only. `journal.py` takes its
`chart_id` from a request body and is covered by its own named test; a future body-param router
would not be caught by the enumeration.

**Router pattern register** (the item's step 5 — "pick one per router and record which"):

| Pattern | Routers |
|---|---|
| `router-guard` | `charts`, `daily_guidance`, `numerology`, `remedies`, `transits`, `muhurta`, `share_card`, (`journal`, body param) |
| `service-scope` | `annual_wrapped`, `ask_vinaadi`, `life_areas`, `life_events`, `life_event_log`, `predictions` |

`public_tools.py` appeared in the first grep and is a false positive — it is unauthenticated by
design and has no `chart_id` route. `reports`/`retrospective`/`relationships` named in the
audit have no `{chart_id}` route either.

### F2 · [D] One planet-name map — Venus currently has two spellings in the UI

`tPlanetLord` (`web/lib/i18n.ts:1104`) is canonical and used by ~10 surfaces. Eight
components hand-roll their own map; four drifted to **சுக்ரன்** where the rest of the app
says **சுக்கிரன்**: `dashboard-ashtottari-dasha-panel.tsx:20`,
`dashboard-yogini-dasha-panel.tsx:31`, `dashboard-shadbala-panel.tsx:17`,
`dashboard-conditional-dashas-panel.tsx:26`.

Each copy is internally consistent, which is exactly why no test sees it.

**Do:**
1. Delete all 8 local maps; call `tPlanetLord(code, lang)`.
   (Also covers `plainlang.ts:36`, `dashboard-yoga-dosham-panel.tsx:126`,
   `dashboard-jadhagam-report-panel.tsx:41`, `chart-generate-inline-panel.tsx:92,147`,
   `JadhagamTool.tsx:44,204`.)
2. Guard test: assert no file outside `web/lib/i18n.ts` declares a `Record` keyed
   `SUN|MOON|MARS|MERCURY|JUPITER|VENUS|SATURN|RAHU|KETU` with Tamil-script values.
   Regex over the source tree; cheap, and it stops recurrence.

**Effort:** ~2h. **Surface:** [D] (all 8 are dashboard components).

#### ✅ LANDED 2026-08-07

The four drifted maps are gone and the Venus spelling is now single-sourced. What the work
turned up beyond the plan:

**`dashboard-yoga-dosham-panel`'s map carried a comment defending itself:** *"Local to this file
on purpose — the panel already owns its own label vocabulary and there is no shared web-side
planet-name helper to reuse."* `tPlanetLord` already existed and already served ~10 surfaces, so
the claim was untrue when written. **A justification nobody re-checks outlives the duplication
it defends** — the comment is replaced by the guard test.

**Two files could not simply delete their map, and both for the same real reason:**
`chart-generate-inline-panel` and `JadhagamTool` include **MANDHI**, an upagraha with no
`tPlanetLord` row. The nine delegate; MANDHI stays as a genuine local addition. `JadhagamTool`'s
`PLANET_LABELS_EN` ("Sun · Suryan") also stays — that bilingual gloss exists nowhere else.

**`plainlang.ts` was the interesting one.** Its 18 planet rows were not quite a duplicate map:
nine are bare names, nine carry a plain-language gloss ("soul planet", "மனம் கிரகம்"). Rewritten
so a `graha(code, taGloss?, enGloss?)` helper composes the canonical name with the gloss, so the
**name is never typed here and the gloss is the only thing written out**. Output is
byte-identical. The uneven glossing between the two key families is preserved rather than
"made consistent" — that is a copy decision, not a refactor.

**`dashboard-jadhagam-report-panel` had six copies of `lang === "ta" ? (MAP[x] ?? x) : x`**, not
one. Replaced by a single `planetNameTA` helper, so the ternary went with the map. Its English
side deliberately shows the raw enum (`SUN`, not `Sun`) — preserved.

**The guard test needed two passes, and the first version was wrong in a way worth recording.**
Keying on "a planet enum key on a line that also contains a Tamil graha name" produced three
false positives, all planet-keyed tables whose values are *content*, not names:

```
JUPITER: { ta: "ஞானம், செல்வம், குழந்தைகள், குரு", … }   // significations
SATURN:  { ta: "சனி தீபம் + பெரியோரை சேவித்தல்", … }      // a remedy
```

The rule is now **exact match, not "contains"**: some complete string literal on the line must
*equal* a graha name. A name table's value is the name and nothing else. The detector is tested
directly against both sets of real lines, because the tree-sweep alone proves only that today is
clean, not that a ninth copy would be noticed.

**Verified:** `tsc --noEmit` clean, 337 web unit tests pass (3 new), `text-encoding-guard` green.
The 4 remaining eslint errors are pre-existing `<a>`-vs-`<Link>` in marketing tools, untouched
here.

### F3 · [S] Consolidate the doctrine constants while they still agree

No drift yet, but per this project's own history domain-calc divergence is silent — fix
before it costs a debugging session.

| Constant | Canonical | Delete |
|---|---|---|
| Sign lords (web) | `lib/chart-utils.ts:22` `RASI_LORDS` | `dashboard-chart-explanation-data.ts:80`, `JadhagamTool.tsx:118` |
| Exaltation/debilitation (web) | `dashboard-chart-explanation-data.ts:38,48` | `JadhagamTool.tsx:86,89` |
| Sign lords (backend) | `calculations/chart_strength.py:97` | `conditional_dashas.py:441` (its own comment says *"equals chart_strength.SIGN_LORD"*), `chart_explanation_service.py:1517` |
| Planet Tamil names (backend) | `calculations/display_names.py:18` | `annual_wrapped_service.py:29`, `dasha_transition_service.py:51` (both byte-identical) |

**Leave alone:** `narrative_engine.PLANET_NAME` is a *deliberate*, documented richer parallel
table — `display_names.py`'s docstring explains the pairing. Do not "consolidate" it.

**Effort:** ~1h. **Surface:** [S].

#### ✅ LANDED 2026-08-08 — "no drift yet" was wrong, and there were 7 copies not 3

**Backend sign lords: seven byte-identical copies, not three.** `chart_strength`,
`conditional_dashas`, `functional_nature`, `ashtottari_dasha`, `chart_explanation_service`,
`muhurta_service`, `whatif_service`. **Only two had an equality test** — the other four could
have diverged in silence.

Three of the copies documented a real reason: *"kept local so this leaf module stays free of the
heavier `chart_strength` import."* **That reasoning was sound and argued for a lighter home, not
for six more copies.** `app/constants/astrology.py` imports nothing and its docstring already
said *"import from here, never redefine locally"* — so `SIGN_LORD` moved there, and every leaf
keeps its leaf property while there is exactly one definition. `chart_strength.SIGN_LORD` stays
as a re-export because most call sites and tests reach for it there. Verified: all seven names
are now the *same object*.

**Backend planet Tamil names:** `annual_wrapped_service._PLANET_TA` and
`dasha_transition_service.PLANET_NAME_TA` confirmed byte-equal to `display_names.PLANET_TA`
programmatically, then replaced with imports. `narrative_engine.PLANET_NAME` left alone as
documented.

**The web side had already drifted, which is what this item was written to prevent.**
`JadhagamTool.tsx`'s `NATURAL_ENEMIES` **omitted RAHU/KETU as enemies for SUN, MARS, JUPITER,
VENUS and KETU**, against both the dashboard's copy and the backend's
`chart_strength._NATURAL_ENEMIES` (which agree with each other exactly).

**It never surfaced, and the reason matters more than the relief.** Its only reader, `getNilai`,
compares the graha against `SIGN_LORD[rasi]` — and a sign lord is only ever one of the seven,
never Rahu or Ketu. The five wrong rows were **unreachable, not correct.** A copy that is already
wrong and merely never consulted is the argument for single-sourcing, not a reason to relax.

**Where the web tables went, and why not the obvious place.** Pointing `JadhagamTool` at
`dashboard-chart-explanation-data.ts` would have fixed the duplication and created a Phase 2
problem: that module also holds `HOUSE_MEANING` and `SECTION_META`, several KB of bilingual
dashboard prose, which would then ship on an SEO-indexed marketing page. The tables are pure
doctrine, so they live in `lib/chart-utils.ts` — already imported by both surfaces — and
`dashboard-chart-explanation-data.ts` re-exports them so its own call sites are untouched.

**New guard: `web/lib/doctrine-parity.test.ts`.** The web↔Python constant boundary has no
compile-time check — the same unguarded seam as the API contract, one layer down. It parses the
Python literals as text (a Node test cannot import the ephemeris, and shelling out to `python`
would make a fast suite depend on the venv) and asserts sign lords, exaltation, debilitation,
natural friends and natural enemies all agree. Row counts are asserted separately so a table that
parsed to `{}` cannot pass by being empty on both sides, and one test pins the exact drift that
shipped so the file cannot become decoration.

**Verified:** 591 backend tests green across 26 doctrine suites; `tsc` clean; 341 web unit tests
(4 new). The two pre-existing `_SIGN_LORD == SIGN_LORD` equality tests are kept — they still catch
a future divergent redefinition.

---

## Phase 2 — [M] Marketing: stop shipping the dashboard's CSS, and vice versa

This is the single biggest measurable win in the repo and it is almost entirely mechanical.

### The measurement

`web/app/globals.css` is **215 KB / 7,945 lines**, imported by the **root** layout — so it
ships on *every* route, both surfaces. Byte breakdown by design system:

| Namespace | Bytes | % | Used by |
|---|---|---|---|
| `.cl-*` / `.clf-*` (Clarity — marketing) | 109,026 | **51.2%** | **72 marketing files, 0 dashboard files** |
| *(unprefixed: resets, tokens, `body`, media queries)* | 64,836 | 30.5% | genuinely global |
| `.cd-*` (dashboard) | 25,826 | 12.1% | **duplicate namespace** — see F5 |
| `.as-*` | 5,607 | 2.6% | 18 of 41 classes used |
| `.mk-*` | 3,935 | 1.8% | 31 of 31 used ✓ |
| `.site-*` | 3,525 | 1.7% | **21 classes, 0 uses — dead** |

Meanwhile `dashboard.css` (28 KB) + `dashboard-nova.css` (127 KB) are correctly scoped to
the `/dashboard` layout. So the asymmetry is one-directional and fixable.

### F4 · [M+D] Split `globals.css` into `base` + `marketing`

**Target:** dashboard stops downloading ~109 KB of Clarity CSS; marketing stops downloading
~26 KB of stale `.cd-*`.

**Do — in this order, because step 1 de-risks the rest:**

1. **Inventory first, move nothing.** Script the class-usage map: for every selector in
   `globals.css`, which surface's TSX references it. A first pass showed the dashboard *does*
   depend on some globals-only classes (notably parts of `as-*` and `cd-*` used by components
   living in `components/` rather than `components/dashboard-*`), so a naive
   "drop globals.css from the dashboard layout" **will** break things. Get the real number
   before splitting.
2. Extract `app/globals-base.css` — the ~65 KB of unprefixed resets/tokens/`body`/media
   queries plus whatever step 1 proves is genuinely cross-surface. Keep in root layout.
3. Extract `app/marketing.css` — the `.cl-*` / `.clf-*` / `.mk-*` / `.site-*` blocks.
4. Add `app/(marketing)/layout.tsx` as a route group wrapping the public routes and import
   `marketing.css` there. Route groups don't change URLs, so **no SEO or redirect risk** —
   the same technique already used for `dashboard/(workspace)`.
5. Delete the 21 dead `.site-*` classes and the 23 unused `.as-*` classes.

   **✅ Done 2026-08-08**, plus `day-strip`'s CSS that F11 explicitly handed over. 30
   `.site-*` rules and 25 `.as-*` rules (6.1 KB) out of `marketing.css`; 16 `.day-strip*`
   rules (1.8 KB) out of `globals.css`, where they had been costing *every* route to style a
   component that is not imported anywhere. The 5 live `.as-*` families (`as-card`,
   `as-profile`, `as-topic`, `as-rasi`, `as-nak`) were left alone; the pruner refuses any
   grouped selector where a single class is still referenced, and it reported each skip.

   **Not deleted, deliberately:** a further ~17 KB in `marketing.css` where every class in
   the rule is unreferenced (73 `.cl-*`, 3 `.clf-*`, 3 `.cd-*`). Those are the live marketing
   system, where a "dead" verdict has more ways to be wrong than in a retired namespace, and
   the saving now falls on marketing alone rather than on every route. Worth a separate pass
   with a browser open, not a drive-by.

**Verify:** cold-load transferred CSS on `/dashboard` before vs after; and a visual-diff
sweep of both surfaces (`web/tests/visual/quality-gates.spec.ts` already exists — extend it).

**Effort:** 1–2 days including the visual pass. **Risk:** medium — mitigated entirely by
step 1. Do not skip step 1.

#### ✅ LANDED 2026-08-08 — steps 1–5, measured off real builds

CSS transferred per route, union over each route's whole layout chain
(`node scripts/css-budget.mjs` after `npm run build`, same measurement both sides):

| Surface | Before | After | Change |
|---|---|---|---|
| `/dashboard/*` | 246.6–249.9 KB | 164.2–167.5 KB | **−82 KB (−33%)** |
| marketing routes | 168.9–171.6 KB | 145.0 KB | **−27 KB (−15%)** |
| `/login`, `/admin` | 178.4–185.6 KB | 74.9–82.2 KB | **−103 KB (−56%)** |

`globals.css` 215 KB → 62 KB; new `app/marketing.css` 118 KB; new
`app/dashboard/dashboard-globals.css` 30 KB. All 153 pages build; marketing URLs
unchanged (route groups are stripped from the path).

The dashboard saving is 82 KB rather than the 109 KB projected above, and the gap is
honest: the 109 KB was the raw `.cl-*` byte count, but a rule has to live where the classes
it styles are *used*, and some `.cl-*` rules group a marketing class with a genuinely shared
one. Those stay in the base file. The remaining ~17 KB of unreferenced `.cl-*` is measured
and listed but **not** deleted — see step 5 below.

**Step 1 was worth more than its stated reason.** It said the dashboard depends on "parts of
`as-*` and `cd-*`". The real number is **84 classes** defined only in `globals.css` that
dashboard code renders — the drawer, the life-event cards, the rectification wizard, none of
them named `dashboard-*`. Filenames cannot answer which surface uses a class; only the import
graph can. That is what `scripts/css-inventory.mjs` now does.

**Three things the plan did not anticipate, each found by measuring:**

**1. There are three CSS load contexts, not two surfaces.** `login/` and `admin/` read as
"the signed-in side" but are not under `app/dashboard/`, so they never load its stylesheet.
Filing by surface put `.input--error` / `.select--error` / `.input--valid` — used by the
shared `ValidatedField` that `/login` renders — into a file `/login` does not load, silently
dropping login's field-validation styling. The question is never "which surface does this
feel like" but "which stylesheets does this route actually load".

**2. Cascade order is not preserved by construction.** One file's order is settled by
position; three files load base → surface, so any base rule that sat *after* a surface rule
now sits *before* it. `scripts/css-split.mjs` refuses to write until it has checked every
such pair — both by identical selector and, more importantly, by the class combinations that
actually occur in the source, since `className="card cl-tile"` is matched by two rules that
share no selector text. Zero conflicts across 81 real combinations.

**3. Ownership cannot be read off a class name.** `html:not(:has(.cd-shell))` gives marketing
`color-scheme: light` by naming the *dashboard's* class. Filing it by that name would have
moved it to the dashboard file and handed dark-OS visitors dark form controls on the cream
pages again (MKT-19). Classes inside `:not()` say who a rule is **not** for.

**The split is verified, not asserted.** The three outputs hold exactly the 1,334 rules the
original had — same at-rule context, same declarations, none dropped or duplicated. Moved
text is copied verbatim and spliced out, so `globals.css`'s diff is deletions only rather
than a 7,900-line reformat that no one could review.

**Two tooling bugs, both caught by the guard rather than by review.** Splitting while a stale
`@/app/tools/...` import was still in the tree made `RasippalanTool` unreachable from the
dashboard, so `.cl-mobile-cta` measured as marketing-only and was filed where the dashboard
could not load it — **a broken import silently narrows a class's measured surface.**
`css-split.mjs` now refuses to run on an incomplete graph, which immediately exposed the
second: `base + "/index.tsx"` mixes path separators on Windows, so directory-barrel imports
(`./ui`, `@/components/skeleton`) had *never* resolved, in any run.

**Still owed:** the authenticated browser pass and a visual-diff sweep. Every check here is
static or build-time; nothing has looked at a rendered dashboard.

### F5 · [M+D] Kill the `.cd-shell` name collision

`globals.css:3140` defines `.cd-shell` and `dashboard.css:1` defines `.cd-shell` — two
different, unrelated systems sharing a class name. `app/dashboard/layout.tsx`'s own comment
documents this as a hazard and says the dashboard CSS is loaded at that level specifically so
it wins the cascade:

> *"…so the standalone routes under `/dashboard/*` also get `.cd-shell`'s real Classic/Nova
> color system instead of falling through to globals.css's unrelated 'Clarity' `.cd-shell`
> block (same class name, a different, always-light, unscoped legacy component-styling layer)."*

That is load-order dependence holding a bug at bay. F4 makes it worse *or* fixes it depending
on which file lands first — so resolve it **as part of** F4, not after: rename the
globals.css block to `.cl-shell` (its actual family) and update the ~65 unused-in-TSX
`.cd-*` selectors that belong to it.

**Effort:** folded into F4. **Do not ship F4 without this.**

#### ✅ LANDED 2026-08-07 — and the prescribed fix (rename) was the wrong one

Renaming the block to `.cl-shell` assumed it belonged to the marketing family and merely
collided. Measuring says otherwise in both directions:

- **No marketing file renders `.cd-shell`.** The two that appeared to were naming it in a
  *comment*. So renaming it to a class nothing renders would have deleted it silently — safe
  only if it was already dead, which nobody had checked.
- **It is not a marketing layer at all.** It styles `.cd-shell .card` / `.chip` / `.metric` /
  `.table`: the dashboard's own components, from the always-light Clarity era.

So the only real question was whether it still wins anywhere. It does not. **45 of its 47
rules are shadowed by `dashboard-nova.css`**, whose `[data-ui="nova"] .cd-shell` selectors
carry higher specificity and load later, and whose theme blocks redefine every custom
property the block set — including the score-band tokens (`--color-high/mid/low` and
friends) that ~600 `var()` references depend on. Deleted.

**The two exceptions were live and wrong.** The shell's scrollbars painted a warm brown thumb
authored for a light shell onto one that defaults to dark. `globals.css`'s base pair has the
mirror-image bug: a white thumb over the cream marketing pages. Both now derive from
`--color-text`, which each theme block already defines, so each theme gets its own contrast
instead of one being picked.

**This removed F4's hard dependency on F5** — the collision was gone before the split began,
rather than having to be resolved during it. The `.cd-shell` entry also turned out to be the
*only* rival-system collision: the other 73 shared names (`.card`, `.chip`, `.button`,
`.surface`, `.table`, `.metric`) are deliberate base-in-globals + theme-override-in-nova
layering, which the split preserves.

### F6 · [M] Trim the root layout's client payload

`app/layout.tsx` currently gives every marketing visitor: `QueryProvider` (react-query
runtime), `PostHogProvider`, `BetaSystem`, `Toaster` (sonner), and **4 Google font
families** — before a single pixel of content. The dashboard layout adds 2 more (6 total).

Static marketing pages use almost none of this. Proposals, cheapest first:

| Change | Saving | Risk |
|---|---|---|
| Move `QueryProvider` from root → `dashboard/layout.tsx` + `login` | react-query off every marketing page | **Check first:** 55 marketing `.tsx` are `"use client"`; grep them for `useQuery` before moving. `web/hooks/*` are dashboard-only, so this is likely safe. |
| Lazy-load `PostHogProvider` after first paint / on idle | analytics off the critical path | low — verify pageview still fires |
| `Toaster` → dashboard layout only, or `next/dynamic` | sonner off marketing | low — grep `toast(` in `app/` marketing routes first |
| `BetaSystem` → `next/dynamic` | small | low |
| Audit the 4 root fonts | Fraunces/Inter/JetBrains Mono/Noto Sans Tamil — is Mono used on marketing at all? | low |

**Effort:** ~half a day. **Do after F4** — F4's measurement harness tells you whether these
moved the needle.

### F7 · [M] Convert marketing client components back to server components

55 of 167 marketing `.tsx` are `"use client"`. Marketing content is overwhelmingly static
prose and JSON-LD; each unnecessary `"use client"` ships its whole subtree as JS and forfeits
streaming SSR.

**Do:** triage the 55. Most will be `"use client"` only for a `useState` language toggle or
an accordion. Push the interactive leaf into a small client child and let the page stay a
server component. Start with the highest-traffic routes (`/`, `/tools/*`).

**Effort:** ~1 day for the top 15 routes. **Measure per route** — don't do all 55 blind.

---

## Phase 3 — [D] Dashboard: one fetch path, one form control

### F8 · `useApiQuery` + `<AsyncSection>`

**Today:** 196 direct `apiFetchJson` calls across 54 files; 37 of them pair it with
hand-managed `loading`/`error` state. Six panels share a *character-for-character* identical
block:

```tsx
const [data, setData] = useState<T | null>(null);
const [state, setState] = useState<"idle" | "loading" | "error">("idle");
useEffect(() => {
  if (!chartId) return;
  let cancelled = false;
  setState("loading");
  getX(chartId)
    .then((res) => { if (!cancelled) { setData(res.data); setState("idle"); } })
    .catch(() => { if (!cancelled) setState("error"); });
  return () => { cancelled = true; };
}, [chartId]);
```

`dashboard-{ashtottari,yogini,kalachakra}-dasha-panel`, `dashboard-conditional-dashas-panel`,
`dashboard-shadbala-panel`, `dashboard-propensities-panel-nova`. Ten more use the
`.then/.catch/.finally` variant.

**Efficiency cost, not just tidiness:** each hand-rolled copy is outside react-query, so it
**refetches on every mount** — i.e. every tab switch. `/charts/{id}/event-windows` is fetched
two entirely different ways (`dashboard-event-windows.tsx:82` hand-rolled in Life Areas,
`dashboard-plan-tab-nova.tsx:164` via react-query in Plan), so the same data crosses the wire
twice per session with two separate caches.

**Do:**
1. `web/hooks/useApiQuery.ts` — thin react-query wrapper over a shared-client fn + key,
   returning `{ data, isLoading, error }`. Reuse the `STALE` presets in `lib/queryClient.ts`.
   This is not a new abstraction; it's the one the five existing good hooks already imply.
2. `<AsyncSection loading error retry>` in `components/ui/` — owns the bilingual
   "Loading…" / "Could not load X." paragraphs currently retyped in 19 files.
3. Migrate the six identical panels as the proving run.
4. Promote `useEventWindowsQuery` into `web/hooks/` and point `EventWindowsPanel` at it.
   Same for `DashboardActivityTimingCard` vs `NovaActivityTimingCard`.

**Do NOT** rewrite all 54 files in one pass. Migrate on touch after the proving run.

**Effort:** ~1 day for the hook + 6 panels. **Measure:** network requests on a
Today→Plan→Life Areas→Today tab cycle, before vs after.

### F9 · `<SecondaryDashaPanel>` — five panels are one component

`dashboard-ashtottari-dasha-panel.tsx` (217 ln) and `dashboard-yogini-dasha-panel.tsx`
(167 ln) are ~85% identical: same `CollapsibleSection` + `GlossaryTerm` subtitle, same
experimental caveat, same loading/error paragraphs, same two-column "Current Mahadasha /
Antardasha" `Card`, same mahadasha list with current-period highlight. `kalachakra` and
`conditional` follow the same skeleton.

They differ only in: label map (F2 removes this), shared-client fn (F8 removes this), period
field name (`lord` vs `yogini`), title/caveat copy, and Ashtottari's extra `applicability`
card.

**Do — after F2 and F8, which strip two of the four differences:**
`<SecondaryDashaPanel {...{ titleTa, titleEn, caveat, glossaryTerm, query, periods,
renderPeriodLabel, header? }} />`. ~600 lines → ~200 + four ~40-line configs.

**Effort:** ~half a day *if sequenced after F2/F8*; ~1.5 days if attempted first.

### F10 · The 9 `fieldStyle` copies are an accessibility gap

`components/ui/field.tsx` already provides `Field`/`Input`/`Select`/`Textarea` with
`aria-invalid`, `aria-describedby`, `role="alert"`, and token-driven `.ui-input`/`.ui-select`
styling. Bypassing it: **9 copies of `const fieldStyle`** plus 4 of `inputStyle`/`labelStyle`.

`chart-generate-inline-panel:63`, `dashboard-activity-timing-card:27`,
`dashboard-journal-tab-nova:62`, `dashboard-plan-whatif-nova:42`,
`dashboard-plan-muhurta-picker-nova:38`, `dashboard-plan-muhurta-nova:32`,
`dashboard-plan-decisions-nova:43`, `dashboard-settings-session-tab:202`,
`dashboard-retrospective-panel:36`, `porutham-panel:52` **[D]**;
`MuhurtaTool:89`, `JadhagamTool:651`, `PanchangamTool:45`, `FriendshipTool:191` **[M]**.

Every one is a raw `<input style={fieldStyle}>`, so **none carry the a11y attributes**. The
visual drift is what people notice; the missing `aria-*` is what actually matters.

Only 31 of ~250 components import from `@/components/ui` at all. This cluster is the
highest-density, lowest-risk slice of that gap — the four Plan panels alone are four
near-identical copies in one folder.

**Do:** the four Plan panels first (one folder, one reviewer, one visual diff), then the
rest. **[M] tools last** — they're on SEO-indexed pages, so they want their own visual pass.

**Effort:** ~half a day for the 9 [D] files.

---

## Phase 4 — Dead weight

### F11 · 13 orphaned files — 2,543 lines

Never imported anywhere; referenced only from comments.

| File | Lines | Surface | Note |
|---|---|---|---|
| `components/porutham-panel.tsx` | 559 | D | superseded by `dashboard-tools-porutham-nova.tsx` |
| `components/dashboard-numerology-dates-nova.tsx` | 435 | D | the "Dates view cut as duplication" |
| `components/dashboard-charts-panel-nova.tsx` | 407 | D | **named in 2 live files' comments as though it renders** |
| `components/dashboard-numerology-baby-names-nova.tsx` | 334 | D | superseded by `dashboard-tools-baby-names-nova.tsx` |
| `components/dashboard-today-decide-nova.tsx` | 236 | D | |
| `components/peyarchi-banner.tsx` | 150 | D | |
| `components/tools-grid.tsx` | 98 | M | |
| `components/morning-guidance-card.tsx` | 86 | D | replaced by `dashboard-footer-morning-nova.tsx` |
| `components/day-strip.tsx` | 69 | D | its CSS is still live at `globals.css:2236` |
| `components/alert-banner.tsx` | 56 | ? | |
| `components/advanced-lens-note.tsx` | 55 | ? | |
| `components/member-chip.tsx` | 30 | ? | |
| `components/sub-nav.tsx` | 28 | M | |

Three carry `-nova` suffixes, which in this codebase signals "the current generation" — so
the risk isn't the bytes (they're tree-shaken out of the bundle anyway), it's someone fixing
a bug in the file we don't ship.

**Do — in two steps, deletion last:**
1. **Now:** add `// ORPHANED 2026-08-07 — not imported anywhere. See docs/EFFICIENCY_FIX_PLAN_2026-08-07.md` to the top of each. Zero risk, kills the wrong-file hazard immediately.
2. **Later, per file, on your explicit approval only** — never as a batch. `day-strip.tsx`
   also owns live CSS in `globals.css:2236-2300` that F4 would otherwise carry forward.

#### ✅ STEP 1 LANDED 2026-08-08 — step 2 (deletion) not started, and needs per-file approval

All 13 banner'd, each stating what supersedes it and what still points at it. **The audit's list
was exactly right** — a fresh scan (below) found the same 13, no more and no fewer, which is worth
recording after F1/F2/F3 each turned up more than the audit said.

**Two claims verified rather than repeated:**

- `day-strip.tsx`'s CSS *is* still live at `globals.css:2236-2300` (~65 lines), and **no `.tsx`
  outside the orphan itself references any `.day-strip*` class.** So the CSS is dead too, and F4
  would carry it into the new file. This is the one orphan with a cost beyond the wrong-file
  hazard, and F4 should handle it rather than inherit it.
- `dashboard-charts-panel-nova.tsx` is indeed cited by two live files as though it renders
  (`dashboard-family-shared.tsx:300`, `dashboard-today-deepdive-extras-nova.tsx:101`).

**New guard: `web/lib/orphan-scan.test.ts`, and it asserts BOTH directions.** A new orphan fails
until it is declared and banner'd — and a declared orphan that *gains* an importer also fails,
because its banner has become a lie, and a stale warning is worse than none. That second direction
is the failure mode this repo keeps paying for: F2 found a comment insisting no shared planet-name
helper existed, and F3 found a "no drift yet" claim that was already false.

Two scan details that would otherwise produce false positives, recorded because both were hit:
the specifier regex must match the dynamic `import("…")` form (`dashboard-workspace.tsx` alone has
16, so missing it reports most of the dashboard as orphaned), and `index.ts`/`index.tsx` barrels
must be excluded since they are imported by *directory* name and so never appear as "index".

**Verified:** `tsc` clean, 344 web unit tests (3 new), eslint unchanged.

---

## Sequencing

```
Phase 1  F1 ── F2 ── F3            surgical, ship independently        ~1 day total
            │
Phase 2     └─ F4+F5 ─── F6 ── F7  [M] CSS split, then payload         ~3–4 days
            │
Phase 3     └─ F8 ─── F9           [D] one fetch path                  ~1.5 days
                 └──── F10         [D] kit adoption                    ~0.5 day
Phase 4     F11 step 1 (headers) — do today, costs nothing
            F11 step 2 (deletion) — per file, on approval
```

**Hard dependencies:**
- F5 **must** ship inside F4 (the `.cd-shell` collision is currently held at bay by CSS load
  order, which F4 changes).
- F9 after F2 and F8 — they remove two of its four points of difference. Doing F9 first
  triples its cost.
- F4 step 1 (inventory) before F4 steps 2–5. Non-negotiable; the dashboard has real
  dependencies on globals.css.

**Parallelisable:** Phase 2 [M] and Phase 3 [D] touch disjoint files and can run
concurrently on separate branches.

---

## Guard tests — so none of this comes back

Add alongside the fixes, not after. Each one is cheap and pins a lesson this repo has already
paid for once.

| Guard | Prevents | Where |
|---|---|---|
| Parametrised owner-check test over every `chart_id` route | a 7th router shipping without F1's guard | backend tests ✅ |
| No Tamil planet `Record` outside `lib/i18n.ts` | F2 recurrence | source-regex test ✅ |
| No `const *Style` object containing `border`+`padding` outside `components/ui/` | F10 recurrence | source-regex test |
| Every load context can reach the CSS it uses; one loader per stylesheet; size ratchets | F4 regression | `lib/css-surface-boundary.test.ts` ✅ |
| `components/ui` barrel must not transitively import `framer-motion` | the ChunkLoadError class already hit once | build-time check |
| Orphan scan (basename appears in no import specifier) in CI, warn-only | F11 recurrence | CI job |

---

## How to know it worked

Capture these **before** starting; they are the whole argument for the work.

**[M] Marketing** — cold load, throttled Fast 3G, `/` and `/tools/marriage-porutham-calculator`:
- transferred CSS bytes · transferred JS bytes · LCP · CLS
- target: CSS down by the ~26 KB of stale `.cd-*` + dead `.site-*`/`.as-*`; JS down by the
  react-query/sonner/posthog removals in F6

**[D] Dashboard** — signed-in, warm cache:
- transferred CSS on first dashboard paint — target: **−109 KB** (the Clarity system)
- network requests across a Today→Plan→Life Areas→Today tab cycle — target: event-windows
  fetched **once**, not twice
- the six F8 panels: no refetch on remount

**[S] Backend:**
- `pytest` green; new owner-check test fails when a router is added without a guard

Record the before/after in this file when each phase lands.
