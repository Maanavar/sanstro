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

  > **⚠️ Half-true, and the wrong half was checked — corrected by F7, 2026-08-09.** This
  > asked "does it leak into the *dashboard*", and the answer is genuinely no. But this
  > table's own left column says marketing is judged on **first-load bytes**, and by that
  > measure the question that mattered was whether these modules leak *across marketing
  > routes*. `marketing-i18n.ts` did, completely: all 63 exports in one chunk on 117 of
  > 121 routes. "Do not touch" held for two of the three files — `natchathiram-data.ts`
  > is correctly confined to its 28 routes, verified — but it parked the largest single
  > win in the repo under a heading that told people to skip it. F6 had already found the
  > same entry wrong once (`BetaSystem` pulled 524 KB of `marketing-i18n` into the **root**
  > layout). Twice is not bad luck: **a "verified clean" note is only as good as the
  > question it asked, and it does not carry the question with it.**
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

#### ✅ VERIFIED ON RENDERED PAGES 2026-08-08 — and the prune had broken 13 live rules

The check owed above ("every check here is static or build-time; nothing has looked at a
rendered dashboard") is done. **The split itself is clean. F4 step 5's prune was not.**

**How the before/after was obtained.** Not a worktree at `17b45ef` — this is a pnpm
workspace, so a second checkout needs three junctioned `node_modules` trees, and it would
move two variables at once. `scripts/css-presplit-toggle.mjs` instead reverts *only which
stylesheets load*, in place and reversibly: the original `globals.css` restored from git,
the two new imports commented out, `dashboard-nova.css` reverted. The route-group move is
deliberately left in place — route groups are stripped from the URL and the group layout
renders a bare fragment, so it cannot change a pixel, and reverting it would only add risk.

**What was compared.** `e2e/css-ab.spec.ts` captures a computed-style fingerprint of every
rendered element across all three load contexts, both themes, two widths — 28 captures
including two authenticated dashboard ones. Not screenshots: a dashboard showing today's
chart produces a wall of true-but-irrelevant pixel differences. The fingerprint is keyed by
`tagName + sorted class list`, **not** by DOM path, because a path shifts whenever content
changes length and reports thousands of false differences on a page styled identically.

**Result: 97 raw differences across 3,707 class combinations, and exactly 13 were real.**

| Cause | Count | Verdict |
|---|---|---|
| `.as-*` rules deleted by the prune | 13 | **real regression — fixed** |
| Animation caught mid-flight (spin matrices, star opacity, beta-modal fade) | ~60 | noise |
| Content loaded on one side, not the other (every height delta on `rasipalan` is the same 557px) | ~15 | noise |
| Tag-only keys landing on different elements | ~9 | instrument flaw, now segregated |
| **Attributable to the split** | **0** | |

**The 13.** `astro-symbols.tsx` builds its class names:

```tsx
cx("as-rasi", `as-rasi--${item.tone}`, `as-rasi--${size}`)
className={`as-topic__mark as-topic__mark--${index}`}
```

No literal `as-rasi--fire` exists anywhere, so every tool that decides "is this class used?"
by searching source answers **no** — correctly, and uselessly. The prune deleted the rasi
element-tone gradients, the rasi/nakshatra size modifiers, and the four `<AstroTopic>` marks.
The marks are the worst: they carry the `left/top/right/bottom` offsets, so all four stopped
being positioned and stacked in one corner rather than merely looking plain.

623ad59's own message asserts the opposite — *"the 5 live `.as-*` families … are untouched …
the pruner refuses any grouped selector in which a single class is still referenced"*. That
safety net is real, and it was aimed at the wrong failure: it guards **grouped** selectors,
and every rule here was a standalone rule for a single modifier class.

Restored verbatim from `17b45ef`; the marks now compute byte-identical to their pre-split
values on a rendered page. New guards: `scripts/css-dynamic-class-audit.mjs` (with
`--since <ref>`, which is what found all 13 — run it before any future prune) and
`lib/css-dynamic-class.test.ts`.

**A second instrument, and a second finding.** `scripts/css-split-seams.mjs` re-derives the
cascade question from the built stylesheets rather than trusting the splitter's one-time
check. 95 classes are legitimately defined in more than one file. Exactly **one** cascade
inversion exists: `.cd-tools-v3-card:hover` (now in `dashboard-globals.css`) versus
`.cd-tools-v3-card.is-disabled` (now in base), equal specificity, both setting `box-shadow`,
original order reversed. It is unreachable — nothing renders `.cd-tools-v3-card`, and no
source file of any type contains `is-disabled`. Recorded rather than fixed, because the
reason it did not ship is that nobody uses it, not that the cascade is fine.

`css-split.mjs` missed it for the same reason the prune missed the `.as-*` rules: its
co-occurrence pass pairs rules via class combinations it can read as **literal** `className`
strings, and a conditionally-applied modifier never appears as one. Reading the built
stylesheets has no such blind spot. Note also *why* the rule crossed the boundary at all —
`destOf()` returns `base` as soon as any class in a selector is used by both surfaces, so one
shared class on a compound selector drags the whole rule out of its surface file.

**The existing suites, run on both sides.** `npm run test:visual` fails 33/33 — and fails
**identically** with pre-split CSS, baseline diff ratios matching to two decimal places
(0.18 / 0.16 / 0.15). Every quality-gate page fails on `tap-target-too-small` alone (40×40
controls against a 44 px floor), with the same counts and the same element sizes on both
sides. No axe violations, no horizontal overflow. **All 33 are pre-existing.** The three
baselines are gitignored (`.gitignore:47`) and dated **2026-06-30**, five weeks and ~40
commits before the split, so this suite could not have attributed anything to it either way.
Re-baselining it is a separate job.

`web/scripts/css-split.mjs` now refuses to run on its own output — its input is
`app/globals.css`, which after the split is the *base* file. Measured, a second run reports
272 rules, all destined base, 0 marketing bytes: it would replace the 118 KB `marketing.css`
with an empty one. Two guards, because they fail in different cases (outputs already exist;
input no longer holds a marketing system). "Are `.cl-*` rules still present" is **not** a
usable signal — 85 `.cl-*` matches survive in the base inside grouped selectors.

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

#### ✅ LANDED 2026-08-08 — and two claims in this plan were wrong

Measured by **which routes actually ship each module**, out of 126:

| Module | Before | After |
|---|---|---|
| `posthog-js` | 126 | **6** |
| `react-query` | 126 | **3** |
| `sonner` | 126 | **3** |

JS per route, union over the whole layout chain, uncompressed:

| Surface | Before | After |
|---|---|---|
| marketing | 1221.5K – 1974.6K | **462.8K – 1712.6K** |
| `/login` | 1533.1K | **985.4K** |
| `/admin` | 1268.2K | **712.1K** |
| dashboard | 1237.6K – 1532.3K | **546.3K – 1043.6K** |

The dashboard gets smaller too, even though `QueryProvider` and `Toaster` moved *into* it —
what left was bigger than what arrived.

**The "check first" column was answered from the import graph, not by grep.** A grep over
`app/(marketing)` asks a narrower question than the one that matters: a provider removed from
the root layout breaks any component a route *renders*, and `components/` holds both surfaces'
files side by side. `scripts/payload-probe.mjs` walks each load context's real module tree —
the same instrument the CSS side needed, for the same reason.

- **`QueryProvider` → `app/dashboard/layout.tsx`.** Marketing reaches zero react-query. So do
  `/login` and `/admin` — so, contrary to the table above, it is **not** also added to login.
- **`Toaster` → `app/dashboard/layout.tsx`.** Exactly one file calls `toast()`.
- **`PostHogProvider` + `BetaSystem` → deferred** past first paint via
  `components/deferred-chrome.tsx`. Both already rendered `null` on the server and on first
  paint, so nothing visible changes. The wrapper exists because `next/dynamic` with
  `ssr: false` is not allowed inside a Server Component in Next 15.

**Wrong claim 1 — "marketing data modules are properly confined … zero leak into the dashboard
bundle"** (§0, "what is already clean — do not touch"). `BetaSystem` imports
`lib/marketing-i18n.ts`, **524 KB of source**, and `BetaSystem` was rendered from the **root**
layout. It suppresses itself on `/dashboard` by returning `null` — *after* its module has
loaded. That is most of the 758 KB that leaves the simplest marketing routes.

**Wrong claim 2 — "is Mono used on marketing at all?"** It is, heavily. `--cl-font-mono` wraps
`var(--font-mono)` and is applied at ~28 sites in `marketing.css`, while `globals.css`
references it **zero** times. Marketing is its main consumer.

The real font finding is next door: **Fraunces is loaded twice.** The root layout declares
400/500/600 + italics as `--font-display`; the dashboard layout declares 500/600/700 as
`--font-nova-display`. A signed-in visitor gets **27 `@font-face` blocks for one typeface**
(18 + 9) across two independent `next/font` instances, with 500 and 600 declared in both. Not
changed here — merging them is a design call about which cuts each surface needs, not a
mechanical move.

**Why `next build`'s own column shows nothing.** First Load JS is identical before and after
(104 kB shared; `/login` 300 → 301 kB). It counts the page entry plus shared-by-all, so client
chunks pulled in by a **layout** are under-counted — the same defect `css-budget.mjs` was
written to work around on the CSS side. `scripts/js-budget.mjs` is its sibling: it unions the
layout chain, and `--find <module>` reports which routes actually ship a package by searching
the emitted chunks.

**Verified:** 10 public routes + `/login` loaded from a real production build (no page errors,
no "No QueryClient set"); `nova-sweep` 11/11 against the isolated e2e backend with no console
or page errors; 374 web unit tests; `tsc` clean; eslint unchanged. New guard
`lib/payload-boundary.test.ts` fails if a marketing or root-only route starts reaching
react-query or sonner — which would otherwise be a runtime crash on a public page rather than
a build error.

**Still open in F6:** merging the two Fraunces declarations (needs a design call).

##### ✅ THE TWO FRAUNCES DECLARATIONS MERGED 2026-08-09

The call: **one instance, carrying the union of the cuts each surface already renders**
(400/500/600/700 + italics). 700 because Nova renders it; 400 and the italics because marketing
does (`.cl-hero__h1 em`, `.cl-num-quote`, `/login`'s `.ca-left-headline em`). Nothing added
speculatively, nothing dropped — this changes what is *declared*, not what is rendered.

| | before | after |
|---|---|---|
| Fraunces `@font-face` blocks | 27, across 2 instances | **24, in 1** |
| Fraunces in the dashboard stylesheet | 14 mentions | **0** |
| CSS per route, dashboard | 164.2–167.5K | **159.2–162.5K** |
| CSS per route, marketing max | 145.0K | **144.1K** |

`--font-nova-display` is **deleted, not aliased.** An alias pointing at the variable it used to
shadow reads as deliberate a year later, and there is nothing left to keep apart:
`dashboard-nova.css`'s `[data-ui="nova"] .cd-shell` block no longer re-points `--font-display`
at a second instance, it inherits the one on `<html>`.

That block's comment said *"display font is Cormorant Garamond"* — SHD-01 replaced Cormorant
with Fraunces and left the note behind. Third instance of the pattern in this document (F2's
comment insisting no shared planet-name helper existed; F3's "no drift yet").

**New instrument: `scripts/font-probe.mjs`** — reads the computed `--font-display` and heading
`font-family` off a rendered page. Static analysis proves there is one definition; only a
browser proves it *arrives*, because `.cd-shell` used to override it and now inherits it. Clean
on `/`, `/learn/what-is-chandrashtama`, `/login`.

**One honest gap:** the probe covers the three unauthenticated load contexts; the dashboard was
not rendered signed-in. What stands in for it is stronger than a guess and weaker than a
screenshot — across every emitted stylesheet there is now exactly one `--font-display`
definition, zero `--font-nova-display` references, and the root layout puts the font variable
class on `<html>` for every route, so inside `.cd-shell` it cannot resolve to anything else.
**An authenticated pass is owed** and pairs naturally with the one F9 still owes.

### F7 · [M] Convert marketing client components back to server components

55 of 167 marketing `.tsx` are `"use client"`. Marketing content is overwhelmingly static
prose and JSON-LD; each unnecessary `"use client"` ships its whole subtree as JS and forfeits
streaming SSR.

**Do:** triage the 55. Most will be `"use client"` only for a `useState` language toggle or
an accordion. Push the interactive leaf into a small client child and let the page stay a
server component. Start with the highest-traffic routes (`/`, `/tools/*`).

**Effort:** ~1 day for the top 15 routes. **Measure per route** — don't do all 55 blind.

#### ✅ PART ONE LANDED 2026-08-09 — but the prescribed fix does not apply, and the real cost was somewhere else

**The triage first, because it invalidates the plan above.** Of the 53 marketing
`"use client"` files, **26 use no React hook at all** — and they are client components for a
single reason: `useLang()` is a context hook, and it is threaded through *every text node* on
the page as `mt(d.h1, lang)`. So "push the interactive leaf into a small client child" has no
leaf to push. The whole page is the consumer. Converting these means resolving the language on
the server, which is a different job with a product-visible consequence (a language toggle
becomes a round trip), and it was raised rather than assumed.

**What measuring found instead, and it is bigger than the `"use client"` count.** All 63
exports of `lib/marketing-i18n.ts` (524 KB of source) land in **one webpack commons chunk that
117 of 121 marketing routes download eagerly**. `/learn/what-is-chandrashtama` — a 55-line page
that imports exactly one object — ships the Thirunallar temple's full English description, the
five dosham guides, and every tool's copy.

The import map was never the problem: every page already imports precisely its own slice. What
was missing was **module granularity for webpack to act on**.

| | JS per route (union over the layout chain, uncompressed) |
|---|---|
| marketing, before | 462.8K – **1712.6K** |
| marketing, after | 462.8K – **1240.9K** |
| per-route saving | **−477 KB**, uniform across all 117 routes; **no route grew** |

**Two things are required and neither works alone.** Probed before writing the splitter,
because the reasoning would have got this wrong in both directions:

| | result |
|---|---|
| `"sideEffects"` in package.json, alone | **117 routes. No change at all.** |
| the module split, alone | **117 routes.** Without the flag webpack must assume importing any module has side effects, so an unused `export *` cannot be dropped. |
| both | **1 route.** |

That asymmetry is the whole reason `lib/marketing-i18n-split.test.ts` exists. Deleting one line
of `package.json` silently reverts 477 KB per route and leaves a tree that merely *looks* better
organised — `tsc`, eslint and `next build` all stay green, and the only symptom is a number in a
report nobody runs. The guard was verified by removing the field and watching it fail, not just
by watching it pass.

**Landed:** `scripts/i18n-split.mjs` (63 exports → 45 per-page modules + `_s.ts`; barrel
524 KB → 3.2 KB), `"sideEffects": ["*.css"]` in `web/package.json`,
`lib/marketing-i18n-split.test.ts` (4 tests), `scripts/marketing-render-probe.mjs`.

**No import site changed.** The barrel stays at `lib/marketing-i18n.ts` while the domains live
in `lib/marketing-i18n/`; a file beats a directory in both TS and webpack resolution, so all 63
`from "@/lib/marketing-i18n"` imports keep meaning the barrel. Text is moved verbatim and
spliced out, so each new file reviews as "the same bytes, relocated" and the splitter refuses to
run on its own output — the trap `css-split.mjs` documented after a re-run would have written an
empty `marketing.css`.

**Two measurement hazards worth recording, both hit here:**

1. **A needle containing `·` reported "0 of 126 routes" for a module that was on 117.** The
   interpunct is escaped in the minified chunk, so a literal search misses it. This is the same
   class as `as-rasi--${tone}` and `novaFieldStyle` — three tools and now one search string
   fooled by a name the output writes differently from the source. Use plain ASCII needles.
2. **Two `next dev` servers left running from the previous day were rewriting `.next` on every
   file change**, replacing the production build under `next start` — every route 404'd with a
   zero-length body while the route manifest listed it correctly. It also means a measurement
   taken from `.next` is only trustworthy if nothing recompiled since the build; the numbers
   above were re-derived on a clean build with no dev server running and **reproduced exactly**.

**Still open in F7:** the RSC conversion itself. The 26 hookless pages remain client components,
and the `NAV`/`FOOTER` chrome (9 KB) is genuinely on every page and should stay. Worth noting for
whoever picks it up: **46 of 52 route rows are already `ƒ` Dynamic**, because the root layout
does `await cookies()` to read the lang cookie — so the usual objection to server-rendering the
active language (losing static prerendering) has already been paid, and `LangProvider` then
re-derives that same value on the client from `localStorage` anyway.

#### ✅ PART TWO LANDED 2026-08-09 — the count above was wrong, and the cost was never the page's own code

**"26 hookless pages" was 64.** The triage regex was `^["']use client["']`, and every
`dosham/*`, `pariharam/*` and `temples/*` `PageContent.tsx` carries a **UTF-8 BOM**, so `^`
never matched — and those were the heavy ones. Fourth entry in this document's running list of
tools fooled by a name the file writes differently from how the search spells it
(`as-rasi--${tone}`, `novaFieldStyle`, `Learn · Chandrashtama`, now a BOM). **Every one of the
four was a search that returned a confident, wrong, smaller number.** 41 pages converted.

| family | n | before | after | change |
|---|---|---|---|---|
| `/natchathiram/*` | 55 | 989K | 638K | **−351K** |
| `/pariharam/*` | 9 | 894K | 566K | −327K |
| `/dosham/*` | 7 | 891K | 566K | −325K |
| `/temples/*` | 6 | 870K | 566K | −305K |
| `/yogam/*` | 2 | 745K | 565K | −181K |
| `/trust`, `/features`, `/learn`, `/tamil-calendar`, `/tools` | 27 | — | — | −5K to −23K |

Marketing range **463K–1241K → 463K–797K**. **No route grew.**

**The size was never the page's own JSX** — that is why the first estimate (source bytes of
each page's TSX plus its i18n module: ~5–25 KB) was right for two pilot routes and wrong by
**19×** on the third. `guide-detail-content.ts` (2,568 ln) and `natchathiram-data.ts`
(2,474 ln) are build-time data reached through *helpers* — `getGuideVerifyNote()`,
`NATCHATHIRAM_EN` — and **a helper called from a client component is bundled for the browser
whether or not its output is.** The whole corpus rode along behind one
`const [lang] = useLang()`.

That is the third time §0's "marketing data modules are properly confined — do not touch" note
has been wrong, each time for the reason F7 part one recorded: it asked whether these modules
leak into the *dashboard*. They do not. They were leaking across marketing routes, and then
into the client bundle, and the note's heading told people not to look.

**A cost `js-budget.mjs` cannot see.** `NatchathiramFactVisual` is a client component called
from a server one, so its props are serialised into the RSC payload. It asked for the whole
`NatchathiramEntry` and rendered five scalars off it — sending each route the entry's Tamil
`sections` prose a second time, already present as rendered HTML. Narrowed to the five fields:
**HTML 99.0K → 76.7K per nakshatra route, ×27.** *A prop type is a transfer cost once it
crosses that boundary*, and no JS-chunk measurement reports it.

**The language is now request-scoped and resolved one way.** `lib/server-lang.ts` owns
`getServerLang()`; `app/layout.tsx` uses it too, so the layout and its pages cannot disagree.
`lib/i18n.ts` gained `resolveLang()` — there were **two coercion rules with different shapes**,
the layout's `v === "ta" ? "ta" : "en"` and `LangProvider`'s
`v === "ta" || v === "en" ? v : initialLang`.

**The cookie is authoritative now, and that needed a migration path nobody had named.**
localStorage does not expire; the cookie has a 1-year max-age. A visitor returning after a long
gap, or one who cleared cookies only, arrives with a Tamil preference the server could not see —
and on a server-rendered page, writing the cookie back is no longer enough, because the copy is
in the HTML. It self-heals with one `router.refresh()`, only when the two disagree.

**The toggle costs an RSC round trip**, in a `useTransition` so the current language stays
interactive until the new one arrives. That was the product-visible trade, and it was raised
before any code was written.

**Guard: `components/lang-toggle.test.tsx`, and it guards a dead control.** Delete that one
`router.refresh()` and `tsc`, eslint, `next build` and the unit suite all stay green while the
language button silently does nothing on ~45 server-rendered routes — and it keeps working on
the pages still reading `useLang()`, so a spot check passes too. Same shape as part one's
`sideEffects` field. **Verified by deleting the call and watching the test fail**, which is not
a formality: the first attempt to verify it *appeared* to pass with the call removed, because
the edit that was meant to remove it had silently done nothing.

**Conversion order is forced and not optional:** a Server Component cannot be imported by a
Client Component, so pages convert before the components they share. `astro-symbols.tsx` stays
client — dashboard components import it. `scripts/`-adjacent helper used for the sweep checks
every importer of a file is already server before converting it.

**Still client, correctly:** the 14 files with real hooks (the tools), and the `NAV`/`FOOTER`
chrome, which is genuinely on every page.

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

#### ✅ LANDED 2026-08-08 — and the headline claim did not reproduce

`hooks/useApiQuery.ts`, `components/ui/async-section.tsx`, the six panels, and
`useEventWindowsQuery` promoted into `hooks/useEventWindows.ts`.

**The fetch block really was identical in all six. What had drifted was the
presentation of its failure** — three different colours for the same error:
`--color-mid` (ashtottari, yogini, kalachakra, conditional), `--color-low`
(shadbala), `--deepdive-accent` (propensities, which also used `--text-sm` where
the rest used `--text-base`). What gets copied stays in step; what gets
hand-written diverges. Standardised on `--color-mid` — the majority, and the right
severity for an optional section inside a collapsible.

**The Tamil loading line had NOT drifted**, checked before centralising it: all 16
occurrences are byte-identical. Recorded because it cuts against the usual finding.
The sweep did turn up a construction that must not be folded in —
"ஜாதகம் ஏற்றப்படுகிறது…" names *what* is loading and inflects the verb for it, so
replacing those with the generic default would be a copy regression, not a cleanup.

**The measurement, and the honest result.** `e2e/tab-cycle-requests.spec.ts` counts
every v1 request across two laps of Today→Goals→Life Areas→Today. **Before and
after are identical: 7 requests, `event-windows` once.** This item says that
endpoint "crosses the wire twice per session with two separate caches". It can,
but not on this path, for two reasons:

- The Plan tab's copy was **already inside react-query**, so it was never the
  offender; only the Life Areas consumer was hand-rolled.
- That consumer is **lazy**. `EventWindowsPanel` is rendered without `autoLoad`, so
  it shows "Select an event type above" and fetches nothing until a tab is clicked.
  The duplication is user-triggered, not automatic.

So F8 removes a duplicate definition and guarantees one cache — worth having — but
it is **not** a measured request reduction and is not claimed as one.

**What the same run did find:** `charts/{id}/life-event-log` is fetched **once per
lap**. It is one of the ~30 remaining hand-rolled blocks this item deliberately did
not rewrite, and the spec now pins it as a known-open exception so the assertion
tightens when it is fixed.

**Reachability, which changes what the proving run proves.** Five of the six panels
render from `dashboard-family-charts-hybrid` *and* from
`dashboard-charts-panel-nova.tsx` — the latter being one of F11's 13 orphans, so
that render site ships to nobody. Four of the five also sit behind
`AdvancedAstrologyGate`. **The cycle named in this item mounts none of them.**

#### ✅ THE KNOWN-OPEN EXCEPTION CLOSED 2026-08-09 — `life-event-log`

Migrated on touch, which is the path this item prescribes. `NovaLifeEventLogCard`
now reads through `useApiQuery` on one key (`["life-event-log", chartId]`), and the
POST writes the new row into that cache with `setQueryData` instead of into local
state.

**Why this one refetched per lap when the six did not:** it has **two mount sites**
(`dashboard-plan-tab-nova.tsx:549` and `:557`), so a hand-rolled `useEffect` fetch
re-ran on each, and neither could see the other's rows. One shared key fixes both
the traffic and the coherence problem at once.

`STALE.session` rather than the `STALE.today` the six F8 panels use. Those are
natal-chart derivations that genuinely cannot change during a session; a life event
log is authored by the user and may be edited from another device, so a 24-hour
stale window would be wrong for a different reason than it is right for them.

**A defect found by reading the code being moved, not by any test.** The old
`.catch(() => setItems([]))` collapsed a failed load into the *empty* state, so the
card said "No events logged yet. Tap + Log event to add your first." when the
request had actually errored. That is the one reading of this card that must never
be wrong — it invites the user to re-enter history they already recorded. It now
renders an `<AsyncSection>` error with a retry.

Its loading line was also `"ஏற்றுகிறோம்..."` — first-person plural, ASCII ellipsis —
against the sixteen byte-identical `"ஏற்றுகிறது…"` the F8 sweep counted. Folded into
the shared default, because unlike `"ஜாதகம் ஏற்றப்படுகிறது…"` it names nothing and
inflects for nothing, so it is drift rather than copy.

**Measured, against the isolated e2e stack** (backend :8010 on `vinaadi_e2e`,
frontend :3100, proxy confirmed reporting `environment=e2e`, `--workers=1`):

```
[tab-cycle] every v1 request over two laps (7 total):
      1x  charts/{id}/life-event-log     <- was 1x per lap
      1x  event-windows
      1x  activity-timing/batch
      1x  charts/{id}/predictions/{marriage,career,wealth,health}
[tab-cycle] endpoints requested more than once: 0
```

`e2e/tab-cycle-requests.spec.ts`'s exception list is now empty and the assertion is
the strict form: **nothing** may be requested twice across two laps. Unlike F8's
headline claim, this one is a real measured reduction — small (one request per extra
lap), but it is the assertion that now holds the line for the ~29 hand-rolled blocks
still outstanding.

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

#### ✅ LANDED 2026-08-08 — three panels, not four, and the sequencing worked too well

`components/dashboard-secondary-dasha-panel.tsx` now owns the shell all three were
hand-rendering: same `CollapsibleSection`, same `GlossaryTerm` subtitle and caveat,
same two-column current-period card, same highlighted mahadasha list — down to the
same `padding: var(--space-1_5) var(--space-3)`.

**"Kalachakra and conditional follow the same skeleton" is half wrong.** Kalachakra
does. **Conditional does not** — it renders a paksha line and a list of per-system
cards, with no current-period card and no mahadasha list at all. It shares the
header and the async states with these three and nothing below that, so it keeps
its own body. Checked rather than assumed.

**The projected saving does not land, because the sequencing did its job.** F9 was
scheduled after F2 and F8 because they remove two of its four differences — and they
had already removed most of the *lines* too. "~600 lines → ~200 + four configs" was
measured against the pre-F2 files. Actual: the three panels go **443 → 302**, plus a
158-line shared component, so **the tree is 17 lines longer**. The win is not bytes:
a change to the current-period card is now one edit instead of three, and a fourth
secondary dasha costs a config rather than a copy.

Deliberately **not generic over the API response type** — each panel keeps its own
`useApiQuery` call and maps its own field names (`yogini`, `rasiName`, `lord`) into a
plain shape. A generic selector would hide the one thing that actually differs.
Yogini's ruling-planet suffix and Ashtottari's applicability card are slots, so
neither panel gave up copy to share the shell.

**Not visually diffed:** all three render behind `AdvancedAstrologyGate` inside
Family & Charts, which the sweep's BALANCED-mode account does not open.

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

#### ✅ LANDED 2026-08-08 — the gap was worse than "no aria-*": 13 of 19 controls had no name

This item says the copies "none carry the a11y attributes". Measured on rendered
pages, the actual state was a level worse: the captions beside those inputs were
`<span>`s, or `<label>`s with **neither `htmlFor` nor the control nested inside**, so
the controls had **no accessible name at all**.

`e2e/field-a11y-probe.spec.ts` walks five signed-in surfaces and reads the name the
browser computes. **Before: 13 of 19 unnamed. After: 0 of 19.** The before number was
taken by stashing only `web/components` and re-running, so it is measured, not
asserted. A source guard can prove the copies are gone; only a rendered page can prove
the replacement works, since the association is resolved by the browser.

**There were 11 copies, not 9.** `novaFieldStyle` in `dashboard-tools-porutham-nova`
and `dashboard-today-deepdive-extras-nova` are live and were missed because a
case-sensitive grep for `fieldStyle` does not match `novaFieldStyle` — the same class
of blind spot as the built class names, one letter wide.

**Two copies deliberately left, both unreachable code:** `porutham-panel` (an F11
orphan) and `DashboardActivityTimingCard` — **a dead component inside a live module**.
That file is imported only for five helpers; `NovaActivityTimingCard` superseded the
component. The orphan scan works at file granularity and cannot see this.

**`PlaceCombobox` never spreads `inputProps`**, so `style={fieldStyle}` at
`dashboard-plan-muhurta-picker-nova` had never reached the input, and the `id` that
`Field` clones onto it is dropped too — leaving its label's `htmlFor` pointing at
nothing. `aria-label` is now forwarded explicitly and passed at the three call sites.

**New `FieldShell`** for controls that name themselves and must not be wrapped in a
`<label>`: `NovaSelect` renders a `<button>`, which a label would both mis-describe and
re-activate on click, closing the dropdown.

**The [M] tools are declared, not migrated, and not for lack of time.** `.ui-input`
exists only as `[data-ui="nova"] .cd-shell .ui-*` in `dashboard-nova.css`, which
marketing does not load at all after F4, and no marketing page renders `.cd-shell`.
Swapping them would render browser-default controls on SEO-indexed pages. They also
already nest their inputs inside their `<label>`, so **the a11y gap was concentrated
entirely in [D]**.

Guard: `lib/field-style-guard.test.ts`, both directions. It keys on a control box
*reaching a raw form control*, not on the declaration alone — the first version flagged
a print-table cell, two card surfaces and a tile, and a guard that cries wolf earns an
allowlist entry rather than a fix.

#### ⛔ THE [M] HALF IS CLOSED AS WON'T-DO — decided 2026-08-09

Raised rather than picked, and the answer is to leave the four marketing tools
(`MuhurtaTool`, `JadhagamTool`, `PanchangamTool`, `FriendshipTool`) on their own
`fieldStyle` consts.

**The reason is that there is no defect here to fix.** All four already nest their
inputs inside their `<label>`, so every control has an accessible name. The a11y gap
this item was written about was **entirely dashboard-side**, and that half is done
(13 of 19 unnamed → 0). What remains on the marketing side is four duplicated style
objects — a tidiness cost.

**What adopting the kit would actually cost.** `.ui-input` / `.ui-select` /
`.ui-textarea` exist *only* as `[data-ui="nova"] .cd-shell .ui-*` in
`dashboard-nova.css`, which marketing has not loaded since the F4 split, and no
marketing page renders `.cd-shell`. So the swap is not a swap: it requires authoring
a second, marketing-scoped form-control system in Clarity tokens, and then giving it
its own browser pass in both themes on **SEO-indexed pages**. Paying that to
de-duplicate four style objects is the wrong trade.

The third option — hoisting Nova's `.ui-*` block out of its `.cd-shell` scope so both
surfaces share one definition — was rejected for a more specific reason: it un-scopes
a dashboard-authored system onto the cream marketing pages, which is precisely the
tangle F5 and F4 just finished undoing. The `.cd-shell` collision is a solved problem
and should not be re-created one namespace over.

The four stay allowlisted in `lib/field-style-guard.test.ts`. Revisit only if
marketing gains a form-heavy surface that wants the kit for its own sake.

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

**Status 2026-08-09 (end of session):** **every item F1–F11 step 1 has landed.** F7 is
complete — part one (the i18n module split, −477 KB per marketing route) and part two
(the RSC conversion, marketing 463K–1241K → 463K–797K per route). F10's [M] half is
closed as won't-do with the reason recorded, and F6's last open thread — the two
Fraunces declarations — is merged.

Open, in the order I'd take them:

1. **The ~17 KB of unreferenced `.cl-*` in `marketing.css`** (73 `.cl-*`, 3 `.clf-*`,
   3 `.cd-*`). Wants a browser open and `css-dynamic-class-audit.mjs --since <ref>` run
   first — F4's earlier prune deleted 13 live rules in exactly this namespace.
2. **An authenticated render pass**, which three separate items now owe: F9's three
   secondary-dasha panels, F10's migrated fields, and the Fraunces merge's dashboard
   half. One signed-in session closes all three.
3. **Re-baselining `web/tests/visual`** — gitignored, dated 2026-06-30, all 33 failing
   identically since before the CSS split, so it currently blinds every visual change.
   Its own job, and it gates item 2 being worth much.
4. **~29 hand-rolled `apiFetchJson` blocks** outside react-query, migrate-on-touch.
   `e2e/tab-cycle-requests.spec.ts` now asserts the strict form (nothing requested twice
   across two laps), so a regression here is loud.
5. **F11 step 2** (deletion, per file, on explicit approval only — never as a batch).

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
| A control box reaching a raw `<input>`/`<select>`/`<textarea>` | F10 recurrence | `lib/field-style-guard.test.ts` ✅ |
| Every form control on the migrated panels has an accessible name | F10 regression — invisible to tsc, resolved by the browser | `e2e/field-a11y-probe.spec.ts` ✅ |
| Every sub-tab named in `TOP_TABS` is actually reached | a sweep silently shrinking to nothing | `e2e/nova-sweep.spec.ts` ✅ |
| Every load context can reach the CSS it uses; one loader per stylesheet; size ratchets | F4 regression | `lib/css-surface-boundary.test.ts` ✅ |
| A class only an interpolation can build is still a live class | the F4-step-5 prune that deleted 13 live rules | `lib/css-dynamic-class.test.ts` ✅ |
| No marketing or root-only route reaches react-query / sonner | F6 regression — a runtime crash on a public page, not a build error | `lib/payload-boundary.test.ts` ✅ |
| `package.json` keeps `sideEffects`, and the i18n barrel declares nothing itself | F7 regression — silently puts all 63 i18n domains back on all 117 marketing routes, with **no** build error and no visible symptom | `lib/marketing-i18n-split.test.ts` ✅ |
| The language toggle actually re-renders server copy | F7 part two — a **dead control** on ~45 server-rendered routes, with tsc, eslint, `next build` and the unit suite all green and the toggle still working on the pages that kept `useLang()` | `components/lang-toggle.test.tsx` ✅ |
| `components/ui` barrel must not transitively import `framer-motion` | the ChunkLoadError class already hit once | build-time check |
| Orphan scan (basename appears in no import specifier) in CI, warn-only | F11 recurrence | CI job |

### Instruments added while verifying F4/F6

These exist because a question kept recurring in a form no existing tool answered. Each is
cheap to re-run and each found something.

| Script | Question it answers | What it found |
|---|---|---|
| `scripts/css-split.mjs` (guarded) | is this input still unsplit? | a re-run would write an **empty** `marketing.css` |
| `scripts/css-split-seams.mjs` | did the split change which declaration wins? | 1 inversion, unreachable |
| `scripts/css-dynamic-class-audit.mjs` | which classes can no tool see? | the 13 deleted live rules |
| `scripts/css-presplit-toggle.mjs` | what did this look like before? | reversible pre-split rendering |
| `e2e/css-ab.spec.ts` + `scripts/css-ab-diff.mjs` | did any element resolve differently? | 97 diffs, 13 real |
| `scripts/payload-probe.mjs` | who actually reaches this module? | login does not need react-query |
| `scripts/js-budget.mjs` | which routes ship this package? | 126 → 6 / 3 / 3 |
| `e2e/field-a11y-probe.spec.ts` | does the browser give this control a name? | 13 of 19 unnamed → 0 |
| `e2e/tab-cycle-requests.spec.ts` | what crosses the wire on a tab cycle? | F8's headline claim did not reproduce; `life-event-log` refetches per lap (now fixed; assertion tightened to zero exceptions) |
| `scripts/i18n-split.mjs` (guarded) | can a marketing page ship only its own copy? | 63 exports in one 488 KB chunk on 117 routes |
| `scripts/marketing-render-probe.mjs` | does the page still render its own copy, in **both** languages? | 39/39 clean after the split **and** after the RSC conversion — it sends `jothidam-lang=ta` and reads server-rendered HTML, so it exercises exactly the mechanism F7 part two replaced |
| `scripts/font-probe.mjs` | does this surface actually resolve the font it declares? | one Fraunces on all three public load contexts; `--font-nova-display` gone |

### The sweep was measuring less than it claimed

`e2e/nova-sweep.spec.ts` is described in this repo as the fastest dashboard
regression check. While using it to verify F10 it turned out to be green while
covering considerably less than its name implies — three compounding faults, each
hiding the next:

1. It waited for `networkidle`, which says nothing about a `next/dynamic` panel still
   showing its `loading` fallback. **Goals and Life Areas were screenshotted
   mid-skeleton**, and since a skeleton has no text, `assertNoLeakedText` passed.
2. With the panel unrendered, its sub-tab strip did not exist — and a missing sub-tab
   was `continue`, not a failure. **All 11 sub-tabs were silently skipped.**
3. Independently, the lookup used `getByRole("button")`. The strip is `<Segmented>`,
   whose buttons carry `role="tab"`, and an explicit role **replaces** the implicit
   one. `goToTab()` documents this exact trap for the "More" menu's `role="menuitem"`
   directly above the code that fell into it.

Plus a stale entry: "Best Dates & Muhurta" was listed under Goals, having moved to
Calendar in the 2026-07-22 IA refactor — the same class as the "Transits & Dashas"
entry fixed in `955f4fa`. Fixed in `68d8948`: 11 tests / 0 sub-tabs → 12 tests / all
11 sub-tabs reached. **A list of destinations is only worth having if a destination
going missing is loud.**

**A caution that applies to all of them.** Four separate searches in this repo have now been
fooled by the same thing — a name the file writes differently from how the search spells it.
`as-rasi--${tone}` (built by interpolation), `novaFieldStyle` (a case-sensitive prefix),
`Learn · Chandrashtama` (a non-ASCII character escaped in the minified output), and F7 part
two's `^"use client"` (defeated by a UTF-8 BOM). **Every one returned a confident, wrong,
*smaller* number** — 0 of 126 routes, 9 copies not 11, 26 pages not 64 — which is the direction
that makes you stop looking. Three separate tools have been fooled by the same thing: `css-split.mjs`'s
conflict check reads literal `className` strings, so a conditionally-applied modifier was
invisible to it. The F4 prune read literal class names, so `as-rasi--${tone}` was invisible to
it. `css-inventory.mjs` splits template literals on `${…}` deliberately, which is right for
keeping the static tokens and wrong if you then treat the result as complete. Any tool that
decides "is this used?" by searching source is answering a narrower question than it appears
to.

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
