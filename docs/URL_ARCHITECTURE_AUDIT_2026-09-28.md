# URL architecture audit — 2026-09-28

Scope: every address that can appear in a visitor's browser bar. The public
site (`web/app/(marketing)`), the Tamil twins (`/ta/...`), the signed-in
workspace (`/dashboard/...`), and the seams between them — sign-in, deep links,
404s.

Verdict up front: **the public site's URL design is good and the signed-in
one's is half-built.** The marketing routes are readable, Tamil-first where the
noun is Tamil, canonical-tagged, hreflang-paired and ratcheted by
`lib/seo-metadata.test.ts` (14 tests, passing). The dashboard's path scheme
(`lib/dashboard-tabs.ts`) is thoughtfully designed — slugs follow nav labels,
not internal ids — but it stopped at one level deep, and nothing tested it at
all. The defects are concentrated at the three places nobody owns: the parent
URL, the sign-in wall, and the 404.

---

## What was wrong

### 1. The sign-in wall ate every destination — P0

`middleware.ts` turned any signed-out hit on `/dashboard/*` into a bare
`/login`, and `/login` always finished at `/dashboard`. Every one of these lost
the destination silently:

- a link to `/dashboard/tools/porutham` shared with a spouse,
- a bookmark to any tab,
- a session that expired while reading (`useSession` bounced to `/login` too),
- every marketing CTA — all 14 of them point at bare `/login`, so
  "Calculate your porutham" on `/tools/marriage-porutham-calculator` deposited
  the visitor on Today with no porutham in sight.

This is the single largest item here. The entire signed-in URL vocabulary — the
part the team spent effort designing — was unreachable from outside the wall.

### 2. Nine Settings sections shared one URL — P1

`/dashboard/settings` drew Setup, Account, Life context, Experience,
Appearance, Notifications, Journal & Data, Privacy & Legal and Danger Zone from
component state alone. "Change your morning guidance time" was not a link
anyone could send — not in a support reply, not in an email, not from another
part of the product. Browser Back inside Settings jumped out of Settings
entirely.

### 3. Five parent URLs 404'd — P1

Truncating a URL to reach the section above it is ordinary navigation, not a
typo. These had no page:

| URL | Children it should have led to |
|---|---|
| `/panchangam` | `/panchangam/today`, `/panchangam/<date>` |
| `/trust` | `/trust/about-vinaadi`, `/trust/methodology` |
| `/tools` | **10** tool pages |
| `/learn` | 6 articles |
| `/features` | 4 pages |

### 4. There was no 404 page at all — P1

No `not-found.tsx` anywhere in `web/app`. Every dead URL — including the five
above — rendered Next's built-in default: black-on-white *"404 | This page
could not be found"*, no header, no link, no brand, **and no Tamil**. That is
the page shown at the exact moment a visitor is most likely to leave.

### 5. `/dashboard/reports` has no inbound link — needs a decision

The one-off report purchase page is a real, working route with **zero links to
it** anywhere in `web/`. Reachable only by typing the URL. The upgrade CTA
inside it is deliberately withheld during the open beta (`!OPEN_BETA`), but the
buy buttons are live, so this looks like a lost entry point rather than a
decision. **Not fixed here** — where it belongs (Tools grid? user menu?
`/pricing`?) is an owner call, not a refactor.

---

## What was fixed

| Fix | Files |
|---|---|
| Sign-in carries the destination (`?next=`), with an open-redirect guard | `middleware.ts`, `lib/auth-redirect.ts` (new), `app/login/page.tsx`, `hooks/useSession.ts` |
| Settings sections are addressable: `/dashboard/settings/notifications` | `lib/dashboard-tabs.ts`, `components/dashboard-workspace.tsx` |
| `/panchangam` → `/panchangam/today`, `/trust` → `/trust/about-vinaadi` (308) | `next.config.mjs` |
| A branded, bilingual 404 that names the sections | `app/not-found.tsx` (new) |
| Tests for the URL vocabulary and the redirect guard | `lib/dashboard-tabs.test.ts` (+22), `lib/auth-redirect.test.ts` (new, 6), `e2e/auth-and-chart.spec.ts` (+2) |

Notes on each:

**`?next=` is validated, not trusted.** The middleware builds the value from our
own path, so it is internal by construction — but by the time `/login` reads it
back it is a query param a stranger can write, so `safeNextPath` re-checks it.
It refuses absolute URLs, protocol-relative `//host`, backslash variants,
control characters (the `java\nscript:` smuggle), and anything outside
`/dashboard` and `/admin` — including `/dashboardish`, which a naive
`startsWith` would pass.

**A fresh signup still goes to setup.** `?next=` applies only once a birth
profile exists. Setup is not something a deep link may skip past, so the
destination is dropped rather than queued — deliberate, and worth revisiting if
the signup funnel ever wants to honour it.

**`/dashboard/settings` is canonically section-named**, unlike `/dashboard`,
which is canonically bare. Settings has no "main" section, so the URL always
names one; bare `/dashboard/settings` is an inbound alias for `setup` that the
outbound sync rewrites. `SETTINGS_SECTION_SLUGS` is typed as a total
`Record<SettingsSectionId, string>`, so adding a tenth rail section without
giving it a slug is a compile error.

**The two redirects are 308**, not 302 — those parents have never served
anything else. `/tools`, `/learn` and `/features` are *not* redirected: picking
one of ten tools arbitrarily is worse than the new 404, which lists the
sections. They need real hub pages (see below).

---

## Gates: what each new check cannot see

Per `CLAUDE.md` — a `Gate:` line measures its own check, not the item.

- **`lib/dashboard-tabs.test.ts` (22 new tests)** — run with the settings
  branch of `dashboardPath` deleted, it fails on 2 tests
  (`'/dashboard/settings'` vs `'/dashboard/settings/notifications'`); restored,
  22/22 pass. It covers the **pure path layer only**. It cannot see the
  workspace wiring — that a real click writes the URL, that Back restores the
  section, that the seeded state matches the pane. That path is covered by
  `tsc` and by the existing source-text assertions in
  `dashboard-workspace.test.tsx`, which is not the same thing as a browser
  proving it.
- **`lib/auth-redirect.test.ts`** — covers the validator, not the wiring. That
  the middleware actually sets the param and that `/login` actually navigates
  there is covered by the new e2e test, which **has not been run locally**: the
  Playwright config spins up an isolated stack (copied `web/`, its own backend
  on :8010, `vinaadi_e2e` on the test Postgres). Both behaviours were instead
  verified by hand against the running dev server — see below.
- **`lib/seo-metadata.test.ts`** — the existing 14-test gate walks `page.tsx`
  files. **A missing page is invisible to it by construction**, which is
  precisely why five parent URLs 404'd under a green suite for months. It also
  never looks at `/dashboard`, at redirects, or at 404 status codes.
- **The 404 page** — has no automated check on its *content*. If a section in
  `DESTINATIONS` is ever retired, the 404 page will link to a 404.

### Verified by hand against the dev server (:3000)

```
/dashboard/tools/porutham          307 → /login?next=%2Fdashboard%2Ftools%2Fporutham
/dashboard/settings/notifications  307 → /login?next=%2Fdashboard%2Fsettings%2Fnotifications
/panchangam                        308 → /panchangam/today
/trust                             308 → /trust/about-vinaadi
/tools, /learn, /features, /widget, /nonexistent-page   404, branded page
```

The 404 was checked in **both** languages — `jothidam-lang=ta` renders
*"இந்தப் பக்கம் இங்கு இல்லை"* and the Tamil section names. An English-only pass
would have proved nothing about the Tamil half.

Full suite after the change: **1253 tests, 121 files, all passing**; `tsc
--noEmit` clean; `eslint` clean on all touched files.

---

## Reviewed and deliberately left alone

**Language lives in the URL on the public site and in a cookie on the
dashboard.** `/ta/natchathiram/rohini` exists; `/ta/dashboard/...` does not, and
`NEVER_LOCALISED` blocks it. That asymmetry is correct, not a defect: the `/ta`
prefix exists so a *crawler* — which sends no cookie — reaches the Tamil page.
The dashboard is behind auth and noindex, so a prefix there buys nothing and
would double every dashboard URL. Recording it here so the next reader does not
"fix" it.

**Marketing and dashboard tool slugs differ, mostly for good reason.** The
public URL is a search phrase; the in-app one is a name.

| Public | In-app |
|---|---|
| `/tools/marriage-porutham-calculator` | `/dashboard/tools/porutham` |
| `/tools/numerology-calculator` | `/dashboard/tools/numerology` |
| `/tools/friendship-compatibility` | `/dashboard/tools/compatibility` |
| `/tools/indraiya-rasipalan` | `/dashboard/tools/rasipalan` |
| `/tools/jadhagam-generator` | `/dashboard/tools/jadhagam-generator` ✓ |
| `/tools/baby-name-finder` | `/dashboard/tools/baby-name-finder` ✓ |
| `/tools/muhurta-calculator` | `/dashboard/tools/muhurta-**finder**` ✗ |

Only the last is pure variance — `finder` vs `calculator` for one tool, with no
reason behind it. Low priority; renaming it is a one-line change to
`TOOL_SLUGS`, and nothing external links to the in-app form.

---

## Open — ranked

1. **Wire `/dashboard/reports` to something, or record why it is dark.** A live
   purchase page with no inbound link. Owner decision.
2. **Point the marketing CTAs at what they promise.** All 14 go to bare
   `/login`. With `?next=` now working, `withNextPath("/login", "/dashboard/tools/numerology")`
   on the numerology page's CTA makes the funnel land where the visitor asked.
   The plumbing is done; only the call sites are left.
3. **Hub pages for `/tools`, `/learn`, `/features`.** `/tools` is the valuable
   one — 10 pages of commercial-intent content with no parent. Each needs
   copy, a Tamil twin, metadata, a sitemap entry and an hreflang pair, so it is
   a scoped piece of work, not a drive-by.
4. **A gate for parent URLs.** Extend `seo-metadata.test.ts`: for every route
   with children, assert the parent path answers 200 or 308. This is the check
   that would have caught items 3 and 4 of *What was wrong*.
5. **The calendar date is not in the URL.** `/dashboard/calendar` always means
   "whatever day is in localStorage". `/dashboard/calendar/2026-10-05` would
   make a day linkable and make Back work across date changes. Lower value than
   it looks — the surface is private — but it is the last big piece of
   dashboard state the URL cannot express.
6. **Overlays have no URL, so Back does not close them.** Ask Vinaadi, Prasna,
   birth-time rectification, edit-profile, feedback and the life-mode picker
   are all state-only. On a phone, Back is how people close things; today it
   exits the dashboard instead. Worth a single shared pattern rather than six
   one-offs.
