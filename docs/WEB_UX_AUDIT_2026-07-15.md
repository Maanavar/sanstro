# Web UX Audit — Fix Backlog (2026-07-15)

Source: full-surface code audit of `web/` on `harden/production-readiness` —
~120 marketing routes (`clarity-shell`) and the signed-in Nova dashboard
(`web/app/dashboard/**`, `web/components/dashboard-*`). Judged against 2026
consumer leaders (Linear, Stripe, Airbnb, Notion), not other astrology apps.
Mobile *app* (native iOS/Android) is out of scope — this covers `web/` only,
including its mobile-viewport behavior.

**How to use this file (for any coding agent):**

- Read `CLAUDE.md` first — PowerShell syntax, DB safety rules, and the API-contract
  rule (a route/param/shape change must update `app/api/`, `packages/shared/src/api/`,
  `mobile/src/api/`, and `web/` together).
- Work top-down by priority within each part unless told otherwise.
- **Navigation decision (2026-07-15, user-confirmed):** the dashboard uses **top
  nav only**. `dashboard-left-rail.tsx` is confirmed dead (already
  `display:none` under Nova) and should be deleted, not revived. Any mobile-nav
  fix must extend the existing top tab strip (overflow "More", visible scroll
  affordance) — do **not** introduce a bottom tab bar or a second nav pattern.
- Verification baseline: `npx tsc --noEmit` (in `web/`, use
  `.\node_modules\.bin\tsc.CMD --noEmit`) and `npx vitest run` (in `web/`).
- Deletion items require explicit per-file user approval — do not batch-delete.

Status legend: `[ ]` open · `[x]` done · `[~]` partially done / needs decision.

---

## PART 1 — Marketing / public site

### P0 — blocks revenue or core discovery

- [x] **MKT-01** Pricing plan cards have no CTA buttons
  - **Problem:** Guest/Registered/Premium cards show eyebrow, heading, sentence, price — and stop. No button on any card (`web/app/pricing/page.tsx:91-111`). No monthly/annual toggle, no "recommended" marker. The only CTAs are several screens down.
  - **Why it matters:** Pricing is the highest-intent page in the funnel. Every visitor here has decided to consider paying; the page answers with nothing to click.
  - **Fix:** Add one CTA per card — "Try guest mode" / "Create free account" / "Start 7-day free trial." Add a monthly/annual toggle and a "Recommended" badge on Premium.
  - **Acceptance:** every plan card has a working primary action; toggle updates displayed price.

- [x] **MKT-02** Internal repo language shipped to customers
  - **Problem:** "The web app does not yet process checkout directly **in this repo**" and "your storefront or future web checkout currency support" (`web/app/pricing/page.tsx:149`).
  - **Why it matters:** Reads as an internal engineering note leaking onto the highest-intent page — undermines trust exactly where trust needs to be highest.
  - **Fix:** Rewrite in customer voice: what's available today, what's coming, no repo/engineering language anywhere in `web/`.
  - **Acceptance:** grep `web/app` for "repo", "backend", "not yet implemented" style phrasing in user-facing strings — zero hits.

- [x] **MKT-03** No search across ~120 content pages
  - **Problem:** 27 nakshatra pages (+27 visual variants), dosham/yogam/pariharam/temple/learn libraries — the only search input in the codebase is in `admin-console.tsx`.
  - **Why it matters:** Astrology visitors arrive with a specific term in mind. If it's not surfaced in a hover dropdown, they bounce to Google — often landing on a competitor.
  - **Fix (phase 1):** client-side index (title + Tamil name + transliteration variants) behind a nav search icon / `/` shortcut.
  - **Acceptance:** typing a nakshatra name (English or Tamil) or dosham name from anywhere on the site surfaces the matching page within 2 keystrokes.

### P1 — high-impact trust/visual issues

- [x] **MKT-04** Hero sample card is stale ("Tuesday, 26 May")
  - **Problem:** Labeled "Today's Reading · Sample" but hardcoded (`web/components/home-content.tsx:14`) — weeks out of date at any given visit.
  - **Why it matters:** The product's core claim is precise daily computation; showing a canned reading undercuts the pitch it's trying to make, and the public panchangam endpoint already exists to compute the real one.
  - **Fix:** Compute the sample card from today's real public panchangam data.
  - **Acceptance:** hero card date matches the visitor's actual date.

- [x] **MKT-05** Marketing icons are text glyphs, not icons
  - **Problem:** ◎ ⊕ ☽ ◈ ✦ ⊛ ✉ ⊡ carry the six value props, four tool cards, connect section (`web/components/home-content.tsx:62-67`) and the login left panel.
  - **Why it matters:** Glyph rendering varies by OS/emoji font — the site can look different across family members' phones. Reads as the strongest "template" tell on the site.
  - **Fix:** Replace with one consistent stroke-icon set (reuse the dashboard's SVG icons or lucide-react).
  - **Acceptance:** zero bare Unicode glyphs used as icons in `web/components/home-content.tsx`, `web/app/login/page.tsx`.

- [x] **MKT-06** Nav dropdowns: menu ARIA without menu keyboard behavior
  - **Problem:** Trigger has `aria-haspopup` but never `aria-expanded`; panels are `role="menu"`/`menuitem` but arrow keys/Home/End/Escape do nothing; opens via CSS `:hover`/`:focus-within` only (`web/components/public-nav.tsx:9-22, 79-83`) — unreliable on touch laptops/iPads.
  - **Fix:** Either implement full keyboard menu semantics, or drop the `menu`/`menuitem` roles for a plain disclosure pattern with `aria-expanded` wired to actual open state.
  - **Acceptance:** dropdown fully operable via keyboard (Tab, Enter, Arrow keys, Escape); `aria-expanded` reflects real state.

- [x] **MKT-07** Pricing page bypasses the design system entirely
  - **Problem:** 100% inline styles with literal hex (`#2E2118`, `#6C4B32`, `#E7C39F`…) while `--cl-*` tokens sit unused.
  - **Fix:** Rebuild on `--cl-*` tokens as part of MKT-01's card rework.
  - **Acceptance:** no literal hex colors in `web/app/pricing/page.tsx`.

- [x] **MKT-08** Tier comparison table says "Not included" instead of selling
  - **Problem:** Four "Not included" cells (`web/app/pricing/page.tsx:50-61`); the 7-day trial is buried mid-paragraph instead of being the Premium CTA label.
  - **Fix:** Replace "Not included" with a one-line benefit/teaser per row where relevant; promote "Start 7-day free trial" to the Premium card's button text.
  - **Acceptance:** no bare "Not included" cells remain; trial terms visible on the button itself.

### P2 — polish

- [x] **MKT-09** Dead/disabled iOS App Store badge on pricing (`web/app/pricing/page.tsx:214-234`) — hide until the listing is live; a disabled button is an anti-signal.
- [x] **MKT-10** Hero CTA label flickers post-load — A/B flag resolves client-side (`web/components/home-content.tsx:52-56, 126-133`); resolve server-side or hold the button in a loading state.
- [x] **MKT-11** Social-proof counter shows "—" forever on API failure (`web/components/home-content.tsx:260-266`) — reserve width, count-up on arrival, numberless fallback copy on error.
- [x] **MKT-12** Four spellings of one word in nav/URL/copy (`/natchathiram`, "Nakshathirams" nav label at `web/components/public-nav.tsx:181`, "nakshatram" in dashboard, "nakshatra" in backend) — pick one user-facing spelling, keep the rest as search synonyms for MKT-03.
- [x] **MKT-13** Pricing table has no `scope`/`caption`; FAQ has no accordion or FAQPage JSON-LD (`web/app/pricing/page.tsx:119-138`).
- [x] **MKT-14** "INR 0" / "INR 249" reads like an invoice line — use ₹ with `Intl.NumberFormat("en-IN")`, "Free" for zero.
- [x] **MKT-15** Newsletter input is placeholder-labeled only (`web/components/home-content.tsx:571-579`) — add a visible label.
- [x] **MKT-16** Year-stamped nav labels hardcoded ("Muhurtham Naal 2027," "Tamil Calendar 2026" — `web/components/public-nav.tsx:43-44`) — derive from current date/data.
- [x] **MKT-17** ~75 lines of embedded `<style>` in `public-nav.tsx:58-135`, hundreds more in `login/page.tsx` — extract to scoped CSS files. *(Done: moved to `web/components/public-nav.css`, imported by the component; login half tracked under UXD-24. tsc clean.)*
- [x] **MKT-18** No motion anywhere on public pages — one orchestrated hero entrance would be enough; nothing else needs to move.
- [x] **MKT-19** No dark theme for public pages, but root layout declares `color-scheme: light dark` (`web/app/layout.tsx:169`) — can produce dark-styled native form controls on cream pages for dark-OS visitors. Scope `color-scheme` to light, or build the dark `--cl-*` variant.
- [~] **MKT-20** No named human authority (astrologer/reviewer) on any guide or verdict page — add "Reviewed by" bylines with credentials; this converts the 1970s-80s cohort more than any visual change.

---

## PART 2 — Dashboard (signed-in Nova)

### P0 — blocks mobile usage or core trust

- [x] **UXD-01** Delete `dashboard-left-rail.tsx` (confirmed dead + confirmed unwanted 2026-07-15)
  - **Problem:** Renders but is `display:none` under Nova (`web/app/dashboard/dashboard-nova.css:657`), and its labels contradict the live top nav (calls the calendar tab "Panchangam" while `dashboard-hero.tsx:62` says "Calendar").
  - **Decision:** user confirmed top nav only — no left rail, now or later.
  - **Fix:** Delete `dashboard-left-rail.tsx` and its import in `dashboard-workspace.tsx`. Ask for per-file approval before deleting (repo rule).
  - **Acceptance:** file removed, no dangling imports, `tsc --noEmit` clean.

- [x] **UXD-02** Top nav is unusable past the fold on mobile
  - **Problem:** Seven tabs (Today, Calendar, Family & Charts, Plan, Tools, Explore, Settings — `dashboard-hero.tsx:60-68`) scroll horizontally with the scrollbar hidden (`web/app/dashboard/dashboard-nova.css:728-740`), no overflow indicator. On a 360px screen, several tabs are invisible with no signal that they exist. Below 1024px the topbar wraps to two rows; below 720px the subbar drops chart identity entirely (`dashboard-nova.css:937-960`).
  - **Constraint:** stays within the top-nav pattern — no bottom tab bar.
  - **Fix:** Add a visible scroll-fade + chevron affordance on the horizontal strip at narrow widths, OR collapse to icon-only tabs with a "More ▾" overflow item inside the same top bar once space runs out. Restack (don't drop) the identity subbar under 720px.
  - **Acceptance:** on a 360px viewport, every one of the 7 tabs is reachable within the top bar without accidental horizontal-scroll discovery; chart identity still visible (restacked, not removed) below 720px.

- [ ] **UXD-03** "System" theme ignores the OS preference
  - **Problem:** Nova stays dark unless the user explicitly picks Light (`web/app/dashboard/dashboard-nova.css:54-64`); the code comment admits the light-on-system-preference path was never verified.
  - **Why it matters:** A daytime user crossing from the cream marketing site into "System" mode lands in a midnight UI with no bridge — and it's silently wrong, not a deliberate choice.
  - **Fix:** Run the light-parity audit called out in the CSS comment (score bands, glass overlays, Classic-token redirects on light); once verified, make System follow `prefers-color-scheme`.
  - **Acceptance:** with OS set to light and Nova theme set to "System," the dashboard renders the light variant with no visual regressions.
  - **[x] Implemented + static-audited (2026-07-15, live browser pass still owed):** `useTheme` + the pre-paint inline script in `layout.tsx` now resolve "System" → `data-theme="light"|"dark"` via `matchMedia("(prefers-color-scheme: light)")`, with a live `change` listener so the dashboard flips without reload. **Static light-parity audit:** diffed the dark vs light `.cd-shell` token blocks in `dashboard-nova.css` — **122/122 dark tokens covered in light**; the only 4 not redeclared in the light block (`--color-surface-2/-3`, `--color-border`, `--color-accent-muted`) fall through to the base `.cd-shell` block (`globals.css:3131`) which holds correct light literals (`#FAF5EA`/`#EDE5D4`/`#D4C8AE`/`rgba(184,90,44,.12)`), so there is no dark-on-dark token gap. Also fixed a leak the change would have widened: added `html:not(:has(.cd-shell)) { color-scheme: light }` so a system-dark visitor doesn't get dark native form controls on the cream marketing pages (upholds MKT-19; also fixes the pre-existing explicit-dark case). tsc + eslint clean. Remaining: a live browser pass (score bands, glass overlays, chart grids in light) per the agreed split.

### P1 — high-impact UX/a11y/forms

- [ ] **UXD-04** Dashboard i18n is 766 inline `lang === "ta" ? … : …` ternaries across 40 components
  - **Problem:** No central catalog (unlike marketing's `marketing-i18n.ts`), so Tamil coverage is unauditable. Confirmed gap: the rail's "Explore" tab has no Tamil label at all (`dashboard-left-rail.tsx:120` — moot once UXD-01 lands, but the same gap pattern likely exists elsewhere in the 40 files).
  - **Fix:** Migrate to a shared i18n catalog (mirror the marketing pattern); then a native-speaker Tamil review becomes possible (already queued per project notes).
  - **Acceptance:** a script/lint can enumerate every user-facing string and its Tamil counterpart; no inline ternaries remain in touched files going forward.
  - **[~] Foundation done (2026-07-15) — full migration is the standalone PR the item calls for:** (1) **Enumeration (acceptance #1 met):** `scripts/extract-dashboard-i18n.mjs` (+ `pnpm i18n:dashboard` / `:json`) walks `web/components` + `web/app` and extracts every `lang === "ta" ? … : …` pair into `docs/dashboard-i18n-catalog.json` — **1,878 string pairs across 150 files** (429 more sit among JSX/variables, flagged for manual review). It surfaced **7 real gaps** (untranslated `ta === en`: "Normal", "Push notifications unavailable.", Sani-cycle labels; and an empty `en` side at `dashboard-today-glance-nova.tsx:340`). This unblocks the queued native-Tamil review. (2) **Go-forward home (acceptance #2 pattern):** new `web/lib/dashboard-i18n.ts` mirrors `marketing-i18n.ts` (`s(en, ta)` / `dt(entry, lang)`); `streak-chip.tsx` migrated onto it as proof. tsc + eslint + vitest green. The remaining ~1,878-string migration across 150 files is deliberately its own PR (the item says "best done as its own PR"), now seeded by the catalog.

- [x] **UXD-05** First-run status speaks system jargon
  - **Problem:** Default post-signup status: *"Ready. Create a profile or family vault to begin."* in success tone (`dashboard-workspace.tsx:230-233`). "Family vault" is internal vocabulary at minute zero.
  - **Fix:** Replace with a 3-step welcome checklist (Add birth details → See your chart → Read today) with one primary action.
  - **Acceptance:** new-signup dashboard shows a checklist, not a status sentence, until the first chart exists.

- [x] **UXD-06** Birth form exposes ~16 fields to every user *(Done: create form now shows 4 core fields — Name, Birth Date, Birth Time, Birth Place; timezone auto-fills from a matched place and appears only when unresolved; Relationship, Birth-Time-Source, "Where you live now", Marital Status, Employment Type moved into a collapsed native `<details>` "More details (optional)" drawer (keyboard/SR-accessible, no required fields inside). Field JSX moved byte-exact (Tamil preserved); tsc + 136 vitest green. New Tamil summary label flagged for native review.)*
  - **Problem:** Includes birth-time source, confidence-minutes, marital status, employment type, current-location coordinates (`dashboard-workspace.tsx:140-159`). `PlaceCombobox` already hides lat/long mechanics well — the remaining field count is the problem.
  - **Fix:** Chart creation needs 4 fields (name, date, time, place). Move everything else into an "Improve accuracy" drawer shown after the first chart exists.
  - **Acceptance:** first-run chart creation form has 4 required fields; advanced fields reachable via a clearly labeled secondary action.

- [x] **UXD-07** Keyboard focus is nearly invisible
  - **Problem:** Only 6 `:focus-visible` rules across ~280KB of dashboard+global CSS; some inputs set `outline: "none"` inline (`dashboard-setup-tab.tsx:133`).
  - **Fix:** One global focus-ring token (gold ring on dark Nova surfaces, ink ring on light); remove every `outline:none`.
  - **Acceptance:** Tab-only navigation through the dashboard shows a visible focus indicator on every interactive element.

- [x] **UXD-08** LifeModePicker dialog is broken as a dialog
  - **Problem:** `role="dialog" aria-modal` but no focus trap, no Escape-to-close, no `aria-labelledby` (`life-mode-picker.tsx:62-72`). Separately: "Skip for now" doesn't skip — it fires the same PATCH request selecting BALANCED (`life-mode-picker.tsx:130-142`); on network failure the user is stuck in an error loop for a choice they declined to make.
  - **Fix:** Wire the shared `modal-shell` primitive (already used for `ConfirmDialog`) instead of a bespoke `role="dialog"`. Make Skip a local no-op with no network call.
  - **Acceptance:** Escape closes the picker; focus is trapped while open and returns to the trigger on close; Skip never issues a request.

- [ ] **UXD-09** Component monoliths block interactivity
  - **Problem:** `dashboard-yoga-dosham-panel.tsx` (118KB), `dashboard-chart-explanation.tsx` (95KB), `dashboard-workspace.tsx` (82KB), `dashboard-setup-tab.tsx` (57KB).
  - **Fix:** Split each by section; move static rule/reference text into lazily-loaded data files.
  - **Acceptance:** no single dashboard component file exceeds ~30KB after refactor (soft target, judgment call per file).
  - **[~] Pattern proven on the largest file; full split is a standalone PR:** Applied the audit's prescribed technique ("move static rule/reference text into lazily-loaded data files") to `dashboard-chart-explanation.tsx` — 14 static reference constants + shared types (rasi names, exaltation/debilitation/moolatrikona/own-sign tables, house meanings, `SECTION_META`, …) extracted byte-exact into a new co-located `dashboard-chart-explanation-data.ts` (pure data, no React — statically or lazily importable). Component **1651 → 1473 lines**; tsc + eslint + 143 vitest green (behavior-preserving pure-data move). Remaining (the standalone PR): finish this file's per-section component split to hit ~30KB, and repeat the data-extract + section-split on `dashboard-yoga-dosham-panel.tsx` / `dashboard-workspace.tsx` / `dashboard-setup-tab.tsx` — those want a live browser pass since they carry render/state, unlike this pure-data move.

### P2 — consistency, polish, retention

- [~] **UXD-10** Plan / Tools / Explore boundaries are unclear — muhurta lives in Plan, porutham in Tools, doshams in Explore; Life Areas/Journal deliberately highlight no tab while active (`dashboard-left-rail.tsx:106-113`, logic to preserve post-UXD-01). Run a card sort before renaming/moving anything. *(Done as far as it should go pre-sort: **nothing moved** — the item explicitly says card-sort first. Wrote `docs/DASHBOARD_IA_CARDSORT_2026-07-15.md`: a current-state inventory of all 9 tabs, the 5 concrete boundary problems (timing scattered across 3 tabs; porutham mis-homed in Tools; doshams framed as generic reference; Wrapped/Retrospective filed as "tools"; Life-Areas/Journal have no tab home), and 3 candidate groupings to validate + a recommended default (Candidate C — fix the two worst gaps with minimal risk). Implementation awaits the sort / product sign-off.)*
- [x] **UXD-11** `dashboard-setup-tab.tsx` has a private token map (`W`, lines 100-138) and custom `WInput`/`WSelect` parallel to shared primitives — consolidate. *(Done: published sanctioned `TextInput`/`Select` in `dashboard-ui.tsx` (also SHD-03), setup-tab now alias-imports them — its two local defs deleted, all 28 call sites unchanged, non-error pixels identical + free `aria-invalid`. Two edit modals keep their own (differently-sized: 9px/r10 vs 8px/r12) copies pending a browser diff; `W` map retained for StepBtn/GhostBtn/WField.)*
- [x] **UXD-12** Modal loading fallbacks reuse dashboard-card skeletons for every `dynamic()` import including modals (`dashboard-workspace.tsx:48-80`) — give modals a modal-shaped skeleton.
- [x] **UXD-13** Rail-style icon buttons hide their visible label with `aria-hidden` and rely on `title` for the accessible name (`dashboard-left-rail.tsx:150-165` — re-verify pattern elsewhere once UXD-01 removes this specific file) — visible text should be the accessible name, not `title`.
- [x] **UXD-14** Score bands are hue-only (green/amber/coral, `dashboard-nova.css:114-125`) — pair every band with its verdict word (lexicon already exists) for colorblind users.
- [x] **UXD-15** Birth-time uncertainty is collected (source + confidence-minutes) but never shown back to the user — surface it on low-confidence charts ("birth time approximate — lagna-dependent results may shift").
- [x] **UXD-16** Date-pill invisible-native-input overlay — verify `showPicker()` and hit-target behavior on iOS Safari and Android Chrome specifically; add a fallback UI if unsupported.
- [x] **UXD-17** Raw API `detail` strings surface directly in error toasts/messages — route through a message map; keep raw detail behind an optional "technical details" disclosure.
- [x] **UXD-18** Streaks (`useStreak`) and annual Wrapped (`dashboard-annual-wrapped.tsx`) are built but have no first-class surface — give the streak a visible presence + forgiveness mechanic; make Wrapped shareable as an image. *(Done: (1) forgiveness — pure `hooks/streak-logic.ts` `computeStreak` forgives a single missed day once per rolling 7-day window, tracks personal `best`; 7 unit tests. (2) surface — new milestone-aware `StreakChip` (lucide Flame, 7/14/30/100/365 tiers with glow, "rest day kept" moon on a spent grace, best-streak tooltip) replaces the bare Today-tab span. (3) share — the orphaned `WrappedShareCard` (full 9:16 year image → Web Share/PNG) is now wired into the Wrapped overlay as the primary "Share your year" action. tsc + eslint + vitest green. NOTE: server streak stays authoritative for signed-in `days` — a server-side grace day is the backend follow-up for full multi-device parity.)*
- [x] **UXD-19** Score dial leads with the number; the calm verdict phrase (`bandPhrase`) is secondary — flip the hierarchy ("A measured day — 64" not "64").
- [x] **UXD-20** Score dial and time-window values use proportional figures — add `font-variant-numeric: tabular-nums`.
- [x] **UXD-21** Celestial welcome plays identically on every login; no distinct moment for first chart, first porutham, or streak milestones — reserve the biggest animation for the biggest events. *(Done: `LoginWelcomeNova` now has a `grand` tier — a radiant ray-burst blooms from the hub, the reveal holds a beat longer, and an optional `milestoneLabel` caption appears; routine returns keep the calmer standard reveal so the grand one stands out. Login wires `grand` for a genuine first arrival ("Your first sky awaits"). Streak milestones are visually distinguished by the new `StreakChip` glow/fill (UXD-18). Reduced-motion drops the burst. tsc + eslint clean. Follow-up surfaces (first-porutham celebration, full-screen streak-milestone moment) can reuse the same `grand` + `milestoneLabel` API.)*

### Login page (auth surface, shared by both worlds)

- [x] **UXD-22** Password strength meter counts characters only — "aaaaaaaaaaaaaaaa" scores "Strong" (`web/app/login/page.tsx:249-251`). Replace with zxcvbn; show requirements up front, not as post-submit errors.
- [x] **UXD-23** Login left-panel feature list uses text glyphs (`login/page.tsx:62-66`) — same fix as MKT-05, do once, apply everywhere.
- [x] **UXD-24** ~800 lines of embedded `<style>` in `login/page.tsx` — extract to a scoped CSS file (same pattern as MKT-17). *(Done: 586-line block → `web/app/login/login.css`, byte-faithful extraction, imported by the page. tsc clean.)*

---

## PART 3 — Shared foundation (fix once, both surfaces benefit)

- [ ] **SHD-01** Two products share one name — marketing is Fraunces + Inter on cream; dashboard is Cormorant Garamond + Source Serif 4 + system-ui on dark purple/gold (`web/app/layout.tsx:17-44` vs `web/app/dashboard/layout.tsx:26-38`). Six font families load in total.
  - **Fix:** Pick one display serif for both surfaces (Fraunces already carries the brand and reads better at UI sizes than Cormorant's hairlines); carry the gold accent into the public palette; get to ≤4 loaded families.

- [x] **SHD-02** Three icon systems in one product — text glyphs (marketing/login), hand-rolled stroke SVGs (dashboard rail/topbar), lucide-react (`life-mode-picker.tsx`). Standardize on one (stroke SVG or lucide) sitewide. *(Done — standardized on **lucide-react** (user-chosen; already a dep in 14 web files). `marketing-icons.tsx` `MarketingIcon` is now a thin lucide adapter (name API unchanged, so `home-content.tsx` untouched); dashboard topbar `Bell/Settings/SignOut/Check/Close` (`dashboard-hero.tsx`) and login `Eye/Check/Mail` → lucide. Google-SSO branded glyph kept (multi-color brand mark). Incidental one-off control glyphs (nav chevron/hamburger, share-card canvas) left as native SVG — not part of a shared icon system. tsc + eslint clean. Marketing icon visuals shift slightly (e.g. porutham rings→Heart) — worth a visual glance.)*

- [ ] **SHD-03** Four styling systems fighting — the tokens package; 170KB `globals.css` with five parallel palettes (`--cl-*`, `--cal-*`, `--panel-*`, `--chart-*`, 11 `--veil-white-*` steps); Nova's override layer forced to mirror selectors at higher specificity because globals hardcodes hex (`dashboard-nova.css:962-1010`); and whole pages (pricing, setup tab) written in raw inline hex.
  - **Fix (no big-bang rewrite):** enforce the existing color-literal ratchet on touched files in CI; publish the 6 sanctioned primitives (card/chip/button/input/modal/table); migrate pricing first as proof of the pattern.
  - **[x] Status (2026-07-15):** CI ratchet **already enforced** — `.github/workflows/ci.yml` `design-tokens` job runs `scripts/audit-color-literals.mjs` on every PR (whole-tree keyed baseline: grandfathers existing literals, blocks new ones — stricter than "touched files only"). Sanctioned primitives now: `Button`/`Chip`/`Surface`(card)/`Field` + new `TextInput`/`Select` (UXD-11) in `dashboard-ui.tsx`; `ModalShell` (modal) already shared. Pricing already token-migrated (MKT-07). Remaining: a documented primitive index + a `Table` primitive (deferred — no current consumer). NOTE: the ratchet baseline (`scripts/color-literals-baseline.json`) is stale vs the current uncommitted working tree and needs one `pnpm qa:colors:update` regen at commit time; no *new* `.tsx` literals were introduced by this work.

- [x] **SHD-04** Tamil typography has no bold weight — Noto Sans Tamil loads only 400/500/600 (`web/app/layout.tsx:39-44`) while the UI sets 700/800 on Tamil strings, forcing faux-bold synthesis on the script the brand is named after.
  - **Fix:** load the 700 cut; audit line-height/clipping for Tamil in chips and headings; decide deliberately how Tamil renders inside serif display headings (currently an undesigned fallback collision).

- [x] **SHD-05** No release-gate live browser pass — several already-shipped features are marked "browser pass pending" in project docs (celestial pass, Nova-only migration), and this audit itself is a static code read, not a live session.
  - **Fix:** add a live-browser-pass checklist as a release gate, not an optional follow-up.

---

## Suggested first week

Marketing: MKT-01 → MKT-02 → MKT-09 → MKT-14 → MKT-04 → MKT-05 → MKT-03 (phase 1).
Dashboard: UXD-01 (delete left rail) → UXD-05 → UXD-07 → UXD-08 → UXD-22 → UXD-12 → UXD-14.

The two structural bets for the quarter: web checkout (MKT-01 in full) and a top-nav-only mobile layout that doesn't lose tabs past the fold (UXD-02). Everything else compounds behind those two.
