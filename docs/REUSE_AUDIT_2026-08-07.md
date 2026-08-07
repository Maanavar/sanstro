# Reuse & Duplication Audit — 2026-08-07

Scope: `web/` (352 tsx + 110 ts), `app/` (backend), `packages/shared/`.
Method: pattern-grep for repeated idioms, then read every candidate to confirm the
copies are actually equivalent (not superficially similar).

**Headline:** the shared layers you already built are good — `packages/shared/src/api/`,
`app/calculations/display_names.py`, `app/calculations/chart_strength.py`,
`web/components/ui/`, `web/lib/share-card-canvas.ts`, the react-query hooks. The problem
is **adoption**, not absence. Roughly 30 components predate or bypass the shared thing
that now exists, and in four places the copies have already drifted into user-visible or
security-visible defects.

Findings are ordered by *consequence*, not by line count.

---

## Tier 1 — duplication that has already produced a defect

### R1. `_assert_chart_owner` is copy-pasted 5× — and the 6th router never got one

Five byte-equivalent definitions of the chart ownership boundary:

| File | Line | Return type |
|---|---|---|
| [app/api/charts.py:62](app/api/charts.py#L62) | 62 | `Chart` |
| [app/api/daily_guidance.py:40](app/api/daily_guidance.py#L40) | 40 | `None` |
| [app/api/transits.py:21](app/api/transits.py#L21) | 21 | `None` |
| [app/api/numerology.py:100](app/api/numerology.py#L100) | 100 | `None` |
| [app/api/remedies.py:22](app/api/remedies.py#L22) | 22 | `tuple[Chart, BirthProfile]` |

Identical bodies: load `Chart` → 404, load `BirthProfile` → 404 if missing/soft-deleted,
compare `profile.owner_user_id` → 403. The only difference is what they hand back.

**The consequence:** [app/api/muhurta.py](app/api/muhurta.py) takes `chart_id` on two
routes and has **no ownership check at all**:

```python
# app/api/muhurta.py:25
def get_muhurta(
    chart_id: UUID,
    ...
    _current_user: User = Depends(get_current_user),   # underscore = deliberately unused
):
    return find_best_muhurta_slots(chart_id, activity, date_from, date_to, session)
```

`find_best_muhurta_slots` ([app/services/muhurta_service.py:271](app/services/muhurta_service.py#L271))
and `list_muhurtham_naals`/`match_muhurtham_naals`
([app/services/muhurtham_naal_service.py](app/services/muhurtham_naal_service.py)) take no
`user_id` parameter, so nothing downstream re-checks it either. Any authenticated user who
knows a chart UUID can read muhurta and muhurtham-naal output for someone else's chart —
an IDOR on `GET /api/v1/charts/{chart_id}/muhurta` and
`GET /api/v1/charts/{chart_id}/muhurtham-naals`.

This is the exact failure mode a copy-pasted guard produces: the rule lives in five places,
so "did this router get the guard?" is not a question anyone can answer by reading one file.

**Fix:** one `app/core/chart_access.py` exposing
`assert_chart_owner(session, chart_id, current_user) -> tuple[Chart, BirthProfile]`.
The five call sites import it (callers that ignored the return keep ignoring it).
Then add it to `muhurta.py` and audit the ~9 other routers that take `chart_id` but appear
in neither list — `annual_wrapped`, `life_event_log`, `public_tools`, `relationships`,
`reports`, `retrospective`, `share_card`. (Some of these legitimately push the check into
the service layer via a `user_id ==` filter — `context.py` does it correctly — but that
*second* valid pattern is precisely why there is no single place to verify the rule today.)

**Effort:** ~1h. **This one should not wait for the rest of the audit.**

---

### R2. Venus is spelled two different ways in the shipped Tamil UI

`web/lib/i18n.ts:1104` has the canonical `PLANET_LORDS` map behind `tPlanetLord(key, lang)`,
used correctly by ~10 surfaces. But eight components hand-roll their own planet map instead,
and four of them have drifted:

| File | Venus |
|---|---|
| `web/lib/i18n.ts:1110` (canonical) | சுக்கிரன் |
| `web/lib/plainlang.ts:36` | சுக்கிரன் ✓ |
| `web/components/dashboard-yoga-dosham-panel.tsx:126` | சுக்கிரன் ✓ |
| `web/components/dashboard-jadhagam-report-panel.tsx:41` | சுக்கிரன் ✓ |
| `web/components/dashboard-ashtottari-dasha-panel.tsx:20` | **சுக்ரன்** ✗ |
| `web/components/dashboard-yogini-dasha-panel.tsx:31` | **சுக்ரன்** ✗ |
| `web/components/dashboard-shadbala-panel.tsx:17` | **சுக்ரன்** ✗ |
| `web/components/dashboard-conditional-dashas-panel.tsx:26` | **சுக்ரன்** ✗ |

Same user, same session, two spellings of the same graha depending on which panel is open.
For an almanac product this is a credibility bug, not a nit — and it is invisible to every
test, because each copy is internally consistent.

**Fix:** delete the 8 local maps, call `tPlanetLord(code, lang)`. Add a lint/architecture
test asserting no file outside `web/lib/i18n.ts` contains a `Record` keyed
`SUN|MOON|MARS|...` with Tamil values.

**Effort:** ~2h including the guard test.

---

### R3. The same endpoint is fetched two different ways, with two caches

`/api/v1/charts/{id}/event-windows` has two independent client implementations:

- `EventWindowsPanel` — [web/components/dashboard-event-windows.tsx:82](web/components/dashboard-event-windows.tsx#L82) — hand-rolled `useEffect` + `loading`/`error` state, mounted in the **Life Areas** tab.
- `useEventWindowsQuery` — [web/components/dashboard-plan-tab-nova.tsx:164](web/components/dashboard-plan-tab-nova.tsx#L164) — react-query, mounted in the **Plan** tab.

Switching tabs refetches; the two never share a cache; a change to the response shape has to
be made twice. Same story for `DashboardActivityTimingCard` (hand-rolled) vs
`NovaActivityTimingCard` (`dashboard-today-deepdive-extras-nova.tsx:395`).

**Fix:** promote `useEventWindowsQuery` into `web/hooks/` and have the panel consume it.
This is also the template for R5 below.

---

### R4. Classical constants are re-declared, on both sides of the wire

Sign-lord table, 3 copies in `web/` (all identical):
`web/lib/chart-utils.ts:22` (`RASI_LORDS`), `web/components/dashboard-chart-explanation-data.ts:80`
(`SIGN_LORD`), `web/app/tools/jadhagam-generator/JadhagamTool.tsx:118` (`SIGN_LORD`).

Exaltation/debilitation, 2 copies in `web/`: `dashboard-chart-explanation-data.ts:38,48`
and `JadhagamTool.tsx:86,89`.

Backend, 3 copies of the sign-lord table: `app/calculations/chart_strength.py:97` (canonical),
`app/calculations/conditional_dashas.py:441` — whose own comment reads *"equals
chart_strength.SIGN_LORD"* — and `app/services/chart_explanation_service.py:1517`.

Backend planet names, 2 undocumented byte-identical copies of `display_names.PLANET_TA`:
`app/services/annual_wrapped_service.py:29`, `app/services/dasha_transition_service.py:51`.
(`narrative_engine.PLANET_NAME` is a *deliberate* richer parallel table, documented as such
in `display_names.py`'s docstring — leave it alone.)

No drift yet in this group. But these are doctrine tables: per the project's own history,
domain-calc divergence is silent. Consolidate while they still agree.

**Fix:** frontend imports `RASI_LORDS` from `chart-utils`; backend imports from
`chart_strength` / `display_names`. Mechanical, ~1h.

---

## Tier 2 — the two big mechanical wins

### R5. ~30 components hand-roll the fetch-and-render-three-states dance

You have react-query configured (`web/lib/queryClient.ts`, `STALE` presets) and five hooks
using it properly — `usePersonalData`, `usePlanData`, `useFamilyData`, `useJournalData`,
`useMonthlyPanchangam`. Everything else calls `apiFetchJson` directly: **196 call sites
across 54 files**, of which 37 pair it with hand-managed `const [loading, …]` /
`const [error, …]`.

Six panels share a character-for-character identical idiom:

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

— `dashboard-ashtottari-dasha-panel.tsx:69`, `dashboard-yogini-dasha-panel.tsx:54`,
`dashboard-kalachakra-dasha-panel.tsx:25`, `dashboard-conditional-dashas-panel.tsx:158`,
`dashboard-shadbala-panel.tsx:38`, `dashboard-propensities-panel-nova.tsx:97`.

Ten more use the `let cancelled = false` + `.then/.catch/.finally` variant
(`dashboard-activity-timing-card`, `dashboard-event-windows`, `dashboard-life-events`,
`morning-guidance-card`, `dashboard-ask-vinaadi`, `birth-profiles-manager`, …).

Each copy is a chance to forget the cancel flag (stale-response overwrite), forget the
`finally` (stuck spinner), or swallow the error text.

**Fix, two steps:**

1. `web/hooks/useApiQuery.ts` — a thin react-query wrapper taking the shared-client fn and a
   key, returning `{ data, isLoading, error }`. Not a new abstraction; just the one the five
   good hooks already imply.
2. `<AsyncSection loading error retry>` in `web/components/ui/` — owns the "Loading…" /
   "Could not load X." paragraphs currently retyped bilingually in 19 files.

Do the six identical panels first as the proving run (they're the cheapest and the most
identical), then migrate opportunistically. **Do not** rewrite the 54 files in one pass.

---

### R6. `<Field>/<Input>/<Select>` exists and 13 files ignore it

`web/components/ui/field.tsx` already has the a11y wiring (`aria-invalid`,
`aria-describedby`, `role="alert"`) and reads the token layer via `.ui-input`/`.ui-select`.
Meanwhile there are **9 copies of `const fieldStyle`** and 4 of `inputStyle`/`labelStyle`:

`chart-generate-inline-panel.tsx:63`, `dashboard-activity-timing-card.tsx:27`,
`dashboard-journal-tab-nova.tsx:62`, `dashboard-plan-whatif-nova.tsx:42`,
`dashboard-plan-muhurta-picker-nova.tsx:38`, `dashboard-plan-muhurta-nova.tsx:32`,
`dashboard-plan-decisions-nova.tsx:43`, `dashboard-settings-session-tab.tsx:202`,
`dashboard-retrospective-panel.tsx:36`, `porutham-panel.tsx:52`, plus
`MuhurtaTool.tsx:89`, `JadhagamTool.tsx:651`, `PanchangamTool.tsx:45`,
`FriendshipTool.tsx:191`.

Every one of these is a raw `<input style={fieldStyle}>` — so **none of them carry the
a11y attributes** the kit's `Field` provides. That is the real cost, above the styling drift.

Only 31 of ~250 components import from `@/components/ui` at all. The `fieldStyle` cluster
is the highest-density, lowest-risk slice of that gap — the four Plan panels alone are
four near-identical copies in one folder.

**Effort:** ~half a day for the 9 `fieldStyle` files.

---

### R7. Five secondary-dasha panels are one component

`dashboard-ashtottari-dasha-panel.tsx` (217 lines) and `dashboard-yogini-dasha-panel.tsx`
(167 lines) are ~85% identical: same `CollapsibleSection` + `GlossaryTerm` subtitle, same
experimental caveat, same loading/error paragraphs, same "Current Mahadasha / Antardasha"
two-column `Card`, same mahadasha list with the current-period highlight. `kalachakra` and
`conditional` follow the same skeleton.

They differ only in: the label map (→ R2 kills this), the shared-client fn, the period
field name (`lord` vs `yogini`), title/caveat copy, and Ashtottari's extra `applicability`
card.

**Fix:** `<SecondaryDashaPanel>` taking `{ titleTa, titleEn, caveat, glossaryTerm, query,
periods, renderPeriodLabel, header? }`. ~600 lines → ~200 + four ~40-line configs. Worth
doing *after* R5's hook exists, since the fetch is half of what's shared.

---

## Tier 3 — dead code that reads as live

13 files are never imported anywhere — only referenced from comments. **2,543 lines.**

| File | Lines | Note |
|---|---|---|
| `web/components/porutham-panel.tsx` | 559 | superseded by `dashboard-tools-porutham-nova.tsx` |
| `web/components/dashboard-numerology-dates-nova.tsx` | 435 | the "Dates view cut as duplication" from the name-correction pass |
| `web/components/dashboard-charts-panel-nova.tsx` | 407 | **`-nova`, i.e. current-generation naming** |
| `web/components/dashboard-numerology-baby-names-nova.tsx` | 334 | superseded by `dashboard-tools-baby-names-nova.tsx` |
| `web/components/dashboard-today-decide-nova.tsx` | 236 | |
| `web/components/peyarchi-banner.tsx` | 150 | |
| `web/components/tools-grid.tsx` | 98 | |
| `web/components/morning-guidance-card.tsx` | 86 | replaced by `dashboard-footer-morning-nova.tsx` |
| `web/components/day-strip.tsx` | 69 | CSS still live in `globals.css:2236` |
| `web/components/alert-banner.tsx` | 56 | |
| `web/components/advanced-lens-note.tsx` | 55 | |
| `web/components/member-chip.tsx` | 30 | |
| `web/components/sub-nav.tsx` | 28 | |

Three of these carry `-nova` suffixes, which in this codebase signals "the current one."
`dashboard-charts-panel-nova.tsx` is actively referenced *by name* in two live files'
comments (`dashboard-family-shared.tsx:300`, `dashboard-today-tab-nova.tsx:800`) as though
it renders — a real chance of someone fixing a bug in the file nobody ships.

Deletion is per-file and by your approval; nothing here is removed. The verification
command used:

```powershell
# from D:\sanstro\web — flags files whose basename appears in no import specifier
```

Recommend at minimum a `// ORPHANED <date> — not imported anywhere` header on each until
they're triaged, so the next reader doesn't edit the wrong file.

---

## What is already good — don't "fix" these

- **`packages/shared/src/api/`** — the dasha panels correctly call `getAshtottariDasha`
  etc. rather than hand-typed URLs. The API layer is genuinely shared; only the component
  layer isn't.
- **`web/lib/share-card-canvas.ts`** — `roundRect`/`wrapText`/`drawBranding`/
  `ensureFontsLoaded`/`shareOrDownloadPng` are properly factored across all 4 share cards.
- **Backend routers** — FastAPI `Depends()` used consistently, 315 sites across 43 files;
  the service layer is a real seam. R1 is the exception, not the pattern.
- **`display_names.py` ↔ `narrative_engine.PLANET_NAME`** — a deliberate, documented
  parallel pair. Leave it.

---

## Suggested order

| # | Item | Effort | Why this slot |
|---|---|---|---|
| 1 | **R1** — shared `assert_chart_owner` + fix `muhurta.py` | 1h | live IDOR |
| 2 | **R2** — one planet-name map + guard test | 2h | live UI defect |
| 3 | **R4** — consolidate doctrine constants | 1h | cheap, and they still agree |
| 4 | **R5** — `useApiQuery` + `<AsyncSection>`, 6 panels only | 1d | unblocks R7 |
| 5 | **R7** — `<SecondaryDashaPanel>` | 0.5d | −400 lines |
| 6 | **R6** — 9 `fieldStyle` files → kit `Field` | 0.5d | a11y, not just style |
| 7 | **Tier 3** — triage orphans, per-file | — | your call, per file |

Items 1–3 are surgical and independently shippable. Items 4–6 want a browser + Tamil pass
before landing, since they touch rendered output.
