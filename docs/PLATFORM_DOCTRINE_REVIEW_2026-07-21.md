# Platform Doctrine Review — Dashboard, 2026-07-21

Framing: *what would a platform team that ships operating systems do with this dashboard?*
Not "make it minimal" — that is the cargo-cult version. The actual doctrine is three
rules, and the dashboard breaks all three in ways that are fixable.

1. **Every screen must be able to say what it is.** (Addressability)
2. **The app never congratulates itself.** (Restraint)
3. **The navigation is a model of the user's mind, not an index of your features.** (IA)

---

## 1. Addressability — FIXED in this pass

### The finding

`/dashboard` was one route rendering one 1,925-line client component, with the
destination held in `useState` and mirrored only to `localStorage`. No `useRouter`,
no `useSearchParams`, no `history` call existed anywhere in the file.

This is the same problem `NSUserActivity` exists to solve. On Apple platforms a
screen declares its identity so the system can hand it to another device, restore
it after a kill, index it in Spotlight, and let Siri deep-link to it. A screen that
cannot say what it is gets none of that. Vinaadi's dashboard could not say what it
was, so it got none of the web equivalents:

| Lost capability | Cause |
| --- | --- |
| Deep links (`/dashboard?tab=calendar`) | tab not in URL |
| Back / forward between tabs | no history entries |
| Bookmarking a tab | nothing to bookmark |
| Cross-device continuity | `localStorage` is per-browser |
| Per-tab analytics | every tab is one `/dashboard` pageview |
| Sharing "look at this screen" | link always lands on Today |

The restore path also silently discarded state on user switch
(`dashboard-workspace.tsx`, the `isSameUser` branch), so a shared link would have
been wrong for the recipient even if one had existed.

### What shipped

`?tab=` is now the address of a dashboard tab.

- **`web/lib/dashboard-tabs.ts`** — new `sanitizeUrlTab()` + `TAB_QUERY_PARAM`.
  Deliberately a *superset* of the `localStorage` allowlist: `settings` is
  URL-addressable (a link someone typed should reach it) but still refused by
  `sanitizeRestoredTab` (a stale session must not resurrect into it). `onboarding`
  is refused by both — it is derived from whether a profile exists, never addressed.
  A typo degrades to the fallback chain rather than erroring; a URL is user-editable
  input, not an API contract.
- **`web/components/dashboard-workspace.tsx`** — outbound effect (tab → URL) and
  inbound effect (URL → tab, for back/forward and hand-edited URLs). Both bail when
  the URL already agrees, which is what stops them ping-ponging.
- **`web/app/dashboard/page.tsx`** — `Suspense` boundary. Without it `useSearchParams`
  bails the whole route out of static rendering at build time.

**Precedence on load:** URL → `localStorage` → default `personal`. The URL param is
resolved *outside* the `isSameUser` branch, so a shared link lands correctly even
though the recipient's stored session belongs to a different user and gets cleared.

**push vs. replace** — the judgment call worth recording. A tab the *user* chose is a
navigation and earns a history entry; back should undo it. A tab the *app* chose —
the setup gate, the QA fallback, a post-save redirect — is a correction, and pushing
those traps the user in a loop where back re-fires the same redirect. So the three
intent-carrying helpers (`goToTab`, `goToExploreDestination`, `returnToExplore`) flag
`push` via a ref; the ~15 other `setActiveTab` call sites fall through to `replace`,
which is what each of them actually wants. No call sites had to change.

---

## 2. Restraint — one fix shipped

### `setStatus("Session restored.")` — removed

On login the dashboard raised a toast announcing it had restored your session.

iOS restores your place in every app, every time, and has never once said so. Putting
you back where you were is the *baseline*, not an achievement. A toast for it spends
the user's attention — a strictly finite budget — to tell them nothing they can act on,
and trains them to dismiss the toast channel without reading it, which is exactly the
channel you need when something has actually gone wrong.

The rule: **notify on the unexpected, never on the correct.** Silence is the success state.

### Still open (not changed — copy review, needs your call)

`dashboard-hero.tsx`, `TAB_DEFS`:

- `"Life Area"` — singular where the tab shows several. Should be `"Life Areas"`.
- `"Transit & Dashas"` — singular noun joined to a plural one. Should be
  `"Transits & Dashas"`.

Small, but nav labels are the most-read copy in the product, and mismatched number is
the kind of thing that reads as unfinished without the reader being able to say why.
Both have Tamil label keys (`tab_life_area_nav`, `tab_transits`) that would want a
matching pass.

---

## 3. Information architecture — the real finding, NOT changed

This one is a product decision, so it is written up rather than acted on.

Current primary nav is **7 pills**: Today · Calendar · Family & Charts ·
Transit & Dashas · Goals · Life Area · Settings — plus a **More** menu holding Tools
and Explore, plus Journal which has no top-level entry at all and is reached only
from links inside other tabs.

Two observations.

**a) Settings is not a peer of Today.** It is the one item in that row that is not a
place you go to read something — it is a utility. Apple never puts Settings in a tab
bar; it lives in the account/avatar affordance, outside the content hierarchy.
Moving it there costs nothing, is reversible, and takes the primary row from 7 to 6.
This is the cheapest real IA win available and I'd take it first.

**b) The nav has been reorganised reactively, and the code says so.** From the
header comment in `dashboard-tabs.ts`:

> `"transits"` is the standalone Transit & Dashas tab … *reinstated* as its own
> top-level destination. `"plan"` is the Goals tab — same id as before, *relabeled*
> "Goals" in the nav since Transits split out of it.

A destination that was removed, then reinstated; a sibling relabeled to accommodate
the split. That is a nav being patched per-feature rather than derived from a model
of what the user is trying to do. The tell is `Journal` — it has no entry point of
its own, which means it either belongs *inside* another destination (and should be
modelled that way) or it is a real destination being under-served. Right now it is
neither.

The question worth answering before any further nav work: **what are the 4–5 things a
user opens Vinaadi to do?** Not features — intents. Everything else becomes hierarchy
underneath one of those. My read of the current set is that it collapses toward
something like *Today · Calendar · Charts & Family · Guidance* with Transits, Goals,
Life Areas and Journal living inside Guidance — but that is a guess about your users,
and it is your call, not mine. I did not touch it.

---

## Verification

- `web/lib/dashboard-tabs.test.ts` — 9 passed (5 new cases covering the URL contract:
  nav tabs, the settings asymmetry, onboarding refusal, the QA dev flag, typo degradation).
- `tsc --noEmit` — clean.
- `next lint` on all three changed files — clean.
- `next build` — see session notes; the `Suspense` boundary is a build-time gate.

**Not yet done:** browser pass. Back/forward across tabs, a pasted `?tab=settings`,
and a link opened in a logged-out or different-user browser are all worth exercising
by hand before this ships.
