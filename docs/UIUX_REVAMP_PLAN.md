# Vinaadi AI — UI/UX Revamp Master Plan
**Version:** 1.0  
**Last updated:** 2026-05-28  
**Status:** Approved for implementation  
**Author:** Product + Claude Code review (synthesized from Claude + Copilot + Codex reviews)

---

## HOW TO USE THIS DOCUMENT

This document is the single source of truth for the Vinaadi frontend revamp.  
Any agent or developer working on UI/UX changes must:

1. Read `docs/AGENT_INSTRUCTIONS.md` first (astrology rules, stack, mandatory constraints)
2. Read this file completely before writing any code
3. Follow the phase order — do not skip Phase 0
4. Make zero backend changes — this is a frontend-only revamp
5. After completing any phase, update the **Phase Status** table below

**Repo root:** `C:\Users\senth\OneDrive\문서\GitHub\sanstro`  
**Frontend root:** `C:\Users\senth\OneDrive\문서\GitHub\sanstro\web`  
**Shell:** PowerShell (use `;` not `&&`)  
**Dev server:** `cd web ; npm run dev` (port 3000)

---

## PHASE STATUS (update as you complete work)

| Phase | Name | Status |
|---|---|---|
| 0 | Architecture split — domain hooks | ✅ Complete (2026-05-28) |
| 1 | Design system + navigation shell | ✅ Complete (2026-05-28) |
| 2 | TODAY tab | ✅ Complete (2026-05-28) |
| 3 | TOOLS tab (FAB consolidation) | ✅ Complete (2026-05-28) |
| 4 | EXPLORE tab | ✅ Complete (2026-05-28) |
| 5 | FAMILY + PLAN tabs | ✅ Complete (2026-05-28) |
| 6 | JOURNAL + SETTINGS tabs | ✅ Complete (2026-05-28) |
| 7 | Landing + Login + Accessibility | ✅ Complete (2026-05-28) |

---

## 1. DIAGNOSIS — WHAT IS WRONG TODAY

### Navigation problems
- 9 flat tabs with emoji-only labels (◎ ☿ 🎯 🌿 👪 📅 ✏ ⚙️ ❓) — users must memorise what each means
- No visual hierarchy — all 9 tabs look equally important
- No mobile bottom nav — tab bar overflows on small screens

### Discoverability problems (features nobody finds)
- **Generate Jathagam for Anyone** — hidden behind a FAB, most users never find it
- **Marriage Matching / Porutham** — hidden behind a FAB
- **Birth Time Rectification Wizard** — buried 3+ clicks deep in Settings → Setup
- **Annual Wrapped Report** — no clear entry point in any navigation
- **Retrospective Analysis** — conditionally rendered, no nav entry
- **Ask Vinaadi AI Chat** — one of 4 stacked unlabelled FABs
- **Decision Support (A vs B)** — buried inside Plan tab scroll
- **Shadow Prompts / Inner Landscape** — mode-gated and hidden in Journal
- **Synastry Panel** — inside Family tab with no signpost that it exists

### Information hierarchy problems
- "What should I know right now" (score, alerts) is buried, not surfaced on open
- Chandrashtama warning exists but is not visually prominent
- "What to avoid" is never emphasised equally with "what is good"
- Panchangam is a data table wall — no progressive disclosure
- Life Areas tab is one long scroll with no entry-point cards

### Architecture problems
- `dashboard-workspace.tsx` is 1400+ lines mixing auth, data fetching, state, and UI
- Inline styles scattered across 40+ component files — no central design system
- 4 stacked FABs bottom-right — cluttered, no labels, discoverable only by accident

---

## 2. DESIGN PRINCIPLES

1. **Glanceable first** — today's score, alerts, and dasha visible without any clicks
2. **Progressive disclosure** — summary card first, detail on tap/click
3. **Intent-based navigation** — organised by what users come to *do*, not internal data model
4. **Both generations** — large tap targets (min 44×44px), icon + text label always, no jargon without explanation, bilingual at all times
5. **Warm dark theme** — keep dark background, promote golden `#e5b84d` as primary accent over cold indigo
6. **"Avoid" is as important as "good"** — every positive guidance must have a paired avoid card
7. **Tools are features, not afterthoughts** — major tools get a primary nav destination

---

## 3. NEW INFORMATION ARCHITECTURE

### 3.1 Primary Navigation (7 destinations, down from 9 flat tabs)

```
☀  Today          — score, alerts, guidance, week ahead
◎  Explore        — chart, transits, dasha, life areas, yogas
🔧 Tools          — jathagam generator, porutham, rectification, AI chat, retrospective, annual wrapped
👪 Family         — vault, members, synastry, calendar
🎯 Plan           — goals, what-if, timing, decisions
✏  Journal        — write, entries, shadow prompts
⚙️ Settings       — profile, preferences, help, QA
```

**Mobile:** Bottom tab bar — icon + text label, 7 items  
**Desktop ≥1024px:** Collapsible left sidebar, active item has golden left border  
**Rule:** Never emoji-only — always icon + text label

### 3.2 Persistent Elements (always visible, every tab)

```
TOP BAR (slim):
  [Vinaadi wordmark]  [Score chip: 82 — Favorable]  [Mode: Balanced]  [🔔 N]  [Avatar]

CHANDRASHTAMA BANNER (red, only on applicable days):
  ⛔ Chandrashtama today — avoid major decisions and new beginnings
```

### 3.3 Always-Visible Information Hierarchy

Ranked by priority — maintain this order across all layouts:

| Rank | Information | Treatment |
|---|---|---|
| 1 | Today's score + band label | Large circular gauge in top bar chip + TODAY tab hero |
| 2 | Chandrashtama / critical alert | Red persistent banner below top bar |
| 3 | Best window / Avoid window | Two paired action cards, TODAY tab |
| 4 | One actionable remedy | Golden highlight card, TODAY tab |
| 5 | Peyarchi / Sani alerts | Amber banner inside TODAY tab alert zone |
| 6 | Current dasha breadcrumb | Metric strip under top bar |
| 7 | Birth time confidence badge | Visible on chart view, not hidden in settings |
| 8 | User mode indicator | Persistent pill in top bar |

---

## 4. PAGE AND TAB SPECIFICATIONS

### 4.1 TODAY Tab (default landing after login)

This is the most-used screen. Every user opens the app here daily.

**Layout (top to bottom):**

```
Good morning, [Name]
[Weekday] · [Vara] · [Nakshatra] · [Tithi]
──────────────────────────────────────────
SCORE GAUGE — circular arc, large, centre
  Score number + band label
  e.g. "82 — Favorable"
──────────────────────────────────────────
ALERT ZONE (conditional — only shown if relevant):
  ⛔ Chandrashtama today — red card
  ⚠  Peyarchi upcoming — amber card
  ⚠  Ashtama Sani — amber card
──────────────────────────────────────────
TWO ACTION CARDS (side by side):
  [✓ Best window]        [✗ Avoid window]
  10am – 12pm            2pm – 4pm
──────────────────────────────────────────
REMEDY CARD (golden background):
  Today's actionable — one clear sentence
──────────────────────────────────────────
PANCHANGAM — collapsed by default:
  Tithi · Vara · Yoga · Karana   [Expand ▼]
  (Full timings: sunrise, sunset, brahma
   muhurta, kalam slots inside expanded)
──────────────────────────────────────────
WEEK AHEAD — 7-day horizontal strip:
  [Mon] [Tue] [Wed] [Thu] [Fri] [Sat] [Sun]
  Score color band under each day
  Click day → shows that day's guidance
──────────────────────────────────────────
FAMILY TODAY — glanceable avatar chip row:
  [Avatar + score dot] × N members
  Tap any chip → opens member detail drawer
  → leads to Family tab
```

**Key rules:**
- Score gauge is the visual centrepiece — nothing above it except greeting + date
- Alert zone is conditional — if no alerts, section is hidden entirely (no empty space)
- "Avoid" card is mandatory alongside "Best window" — never show one without the other
- Panchangam is collapsed by default — users can expand it; traditional users will
- Family Today row only shows if family vault has members

---

### 4.2 EXPLORE Tab

Sub-navigation pills (horizontal):
```
[Natal Chart]  [Dashas]  [Transits]  [Life Areas]  [Yogas & Doshams]
```

#### Natal Chart sub-section
- South Indian D1 grid — keep exactly as-is (traditional, correct, familiar to all generations — do NOT redesign the chart grid itself)
- Birth time confidence badge overlaid on chart header (Official record / Family memory / Elder recall / Unknown)
- D9 toggle beside D1 (not a separate tab or page)
- Planet table: compact, top 5 visible, `[Show all ▼]` expands the rest
- Lagna / Moon / Nakshatra summary as pill badges in chart card header

#### Dashas sub-section
- Current dasha: large card showing breadcrumb → `[Maha] → [Antar] → [Pratyantar]`
- Start date + end date of each level
- Horizontal dasha timeline (keep existing bar — make it taller and richer in colour)
- "What this dasha period means for you" narrative — collapsible, below timeline
- Dasha story entries and journal correlations inside this sub-section

#### Transits sub-section
- "What changed today" summary card at top
- Major transit banner: active Jupiter/Saturn/Retrograde alerts
- Planet grid: current transit position vs natal house, highlight conjunctions
- Upcoming rasi changes (Peyarchi) as alert cards
- Sani cycle tracker: Ashtama / Janma / Ardhashtama indicators with explanations

#### Life Areas sub-section
- Card grid: 3 columns desktop, 2 columns mobile
- Age-phase relevance badge on each card: "Relevant for your life stage" (existing backend logic — surface it visibly)
- Each card: icon, area name, one-line status, score chip, `[Details →]` button
- `[Details →]` opens a DrawerPanel (right-side slide-in) with the full Prediction Detail Panel inside
- Confidence badge shown per prediction (existing `ConfidenceBadge` component)
- Life areas: Career, Money, Health, Relationships, Education, Spiritual, Family Harmony

#### Yogas & Doshams sub-section
- Two columns: Favorable Yogas (green left border) | Challenging Doshams (amber/red left border)
- Each entry: Tamil name + English name, one-line meaning, `[Why? ▼]` expandable reasoning
- Doshams additionally show: `[What to do]` and `[What to avoid]` explicit action items
- Nivarthi (cancellation) factors shown inline under each dosham
- `[Load Jadhagam Report]` button at bottom → opens DrawerPanel with full Jadhagam Report Panel:
  - Planetary strength bars
  - Functional natures (Lagna Lord, Yogakaraka, Trikona, Kendra lords)
  - House-by-house analysis
  - Dispositor chains

---

### 4.3 TOOLS Tab ← New primary section, promoted from hidden FABs

**This is the biggest structural fix.** All tools below currently exist in the codebase but are hidden behind unlabelled FABs, settings pages, or conditional renders. Promoting them to a named primary destination fixes discoverability for all user types.

**Layout: Card grid — 2 columns, each tool is a large clearly-labelled card**

#### Tool cards (6 total):

**1. Generate Jathagam** (route: `/dashboard/chart-generate`)
- Description: "Create a full Jathagam for any person. Print-ready South Indian chart with planet table."
- Note shown on card: "Temporary — profile is not saved after you leave"
- Page layout: two-panel — form left (sticky), chart preview right (live after submit)
- D1 + D9 side by side with toggle
- Planet table: compact, collapsible columns
- Print button: prominent, floating bottom-right of preview panel
- Print layout: keep exactly as-is (already well-structured)

**2. Marriage Matching / Porutham** (route: `/dashboard/porutham`)
- Description: "Compare two Jathagams for marriage compatibility. Kuta scores with Dosha check."
- Page layout: 3-step wizard
  - Step 1: Person 1 birth details form
  - Step 2: Person 2 birth details form
  - Step 3: Results
- Progress indicator at top (Step 1 of 3)
- Step 3 results layout:
  - Large score circle at top (e.g. "28 / 36")
  - Context selector pills: General / Marriage / Friendship / Business / Family
  - Kuta breakdown grid (Dinam, Ganam, Mahendra, Stree Dheergam, Yoni, Rasi, Graha Maitri, Bhakoot, Nadi)
  - Dosha warnings: Rajju Dosha, Vedha Dosha — red warning cards
  - Side-by-side D1 charts — collapsed by default, `[Show charts ▼]` expands
- Quick fill option: "Use a saved family member" — pull from vault to pre-fill form

**3. Birth Time Rectification** (currently: Settings → Setup → buried)
- Description: "Not sure of exact birth time? Answer life event questions to narrow it down."
- 3-step wizard (existing logic, just surfaced properly):
  - Step 1: Answer life event questions (marriage, career change, relocation, health event, parent birth)
  - Step 2: Rectification candidates with probability weights
  - Step 3: Apply recommended time to profile with confirmation dialog
- After completing: confirmation toast + navigate back to profile

**4. Ask Vinaadi AI** (currently: unlabelled indigo FAB)
- Description: "Ask any question about your chart. Answers with astrological reasoning shown."
- Full-page chat view (not just a floating widget)
- Suggested questions based on current goal track
- Confidence tier shown per answer
- Daily quota indicator
- Previous answers history visible
- The floating FAB widget on other pages can stay as a shortcut — but the full experience lives here

**5. Retrospective Analysis** (currently: conditionally rendered, no nav entry)
- Description: "Interpret a past life event against your chart transits on that day."
- Form: select date, describe event, event type (career / health / relationship / finance / family / travel / spiritual / other)
- Result: comparative intensity analysis vs chart transits
- History of past retrospective analyses

**6. Annual Wrapped** (currently: unclear trigger, not in navigation)
- Description: "Your year in review — dasha era, peak periods, life area stats, shareable card."
- `[Generate Wrapped]` button
- 8–11 slides: dasha era overview, peak periods, life area stats, reflection prompts, personalized insights
- Share card with visual design
- Note on card: "Best viewed at year-end — but you can generate anytime"

---

### 4.4 FAMILY Tab

Sub-navigation pills:
```
[Members]  [Synastry]  [Calendar]
```

**Vault selector:** Dropdown pill in the tab header (not a separate section taking up space)

#### Members sub-section
- Family aggregate score: large number at top of section with color band (green / amber / red)
- Member card grid: 2–3 columns
- Each member card (larger than current):
  - Mini chart thumbnail (South Indian grid, small)
  - Member name + relationship tag
  - Nakshatra chip
  - Today's score dot (color-coded)
  - `[View →]` button
- `[View →]` opens a DrawerPanel with full member detail: chart, daily guidance, predictions for that member
- Edit / delete inside the drawer (not on the card face — destructive actions not visible by default)
- Add member: `+` card at end of grid (not a floating button)

#### Synastry sub-section
- Note: Synastry = existing relationship analysis within family. Porutham (in Tools) = evaluating new matches.
- Pairwise compatibility matrix (grid: all members × all members)
- Each cell: compatibility score chip
- Click cell → DrawerPanel with full synastry detail:
  - Kuta breakdown (Dinam, Ganam, Mahendra, Stree Dheergam, Yoni, Rasi, Graha Maitri, Bhakoot, Nadi)
  - Confidence + weight per factor
- Relationship alerts at top of section: Rajju Dosha, Vedha Dosha — red warning banners

#### Calendar sub-section
- Monthly view (not weekly) with day cells
- Color dot per member per day (score color)
- Chandrashtama days: distinct background highlight
- Filter chips: All / Auspicious / Caution / Member-specific
- Muhurta picking for joint family activities surfaced here

---

### 4.5 PLAN Tab

Sub-navigation pills:
```
[Goals]  [What-If]  [Timing]  [Decisions]
```

#### Goals sub-section
- Goal cards with progress indicator
- Inline add form (no modal needed) — type + description + target
- Goal types: Career / Exam / Relationship / Financial / Other

#### What-If sub-section
- Prompt format: "If I [action] on [date], how does it affect my [area]?"
- Before / after comparison card in result
- Hypothetical only — nothing stored

#### Timing sub-section (Activity Timing / Muhurta)
- Filter chips: Career / Finance / Health / Ritual / Family / Marriage / Travel
- Best date windows as a list result
- Each result: date, day quality chip, panchangam summary for that day

#### Decisions sub-section
- Two-option comparison (A vs B)
- Priority area selector: career / family / health / relationship / education / money / spiritual
- Astrological verdict card with reasoning
- Decision history (list of past decisions analysed)

---

### 4.6 JOURNAL Tab

Sub-navigation pills:
```
[Write]  [Entries]  [Reflections]
```

#### Write sub-section
- Minimal composer: text area + life-area tag picker (pill chips)
- Context event tagger: job change / marriage / travel / health / education / property / family / other
- `[Save entry]` button

#### Entries sub-section
- Timeline style: date left, content right
- Each entry: dasha period label as metadata (e.g. "Sun MD · Mercury AD")
- Colored left-edge border matching dasha color for that entry's date
- Retention indicator at top: "Auto-deletes after N days — change in Settings"

#### Reflections sub-section
- Shadow Prompts / Inner Landscape
- Mode gate shown clearly for BEGINNER users: "Available in Balanced and Traditional mode" + link to mode switcher
- BALANCED / TRADITIONAL users see: `[Generate new prompts]` button
- Prompt cards with `[Journal my response]` button
- Previous prompts history

---

### 4.7 SETTINGS Tab

No sub-tabs — use clear section headers.

#### Profile section
- Birth profile summary: name, date, time, place
- Birth time confidence badge (prominent, not tiny): Official record / Family memory / Elder recall / Unknown
- `[Edit profile]` button → Edit Profile Modal
- Active vault selector

#### Preferences section
- User mode selector: Beginner / Balanced / Traditional (show what changes with each mode)
- Goal track: Career / Exam / Relationship / Financial / None
- Language: EN / Tamil
- Journal retention: days slider
- Notification preferences

#### Account section
- User email
- Session info (user ID, vault ID)
- `[Sign out]` button

#### Help section
- FAQ content (currently the QA tab — move it here)
- Methodology explanation (Thirukanitham, Lahiri ayanamsa, house system — builds user trust)
- `[Send feedback]` form (currently a FAB — move here; FAB can stay as a shortcut)

---

### 4.8 Landing Page (`/`)

**Hero section:**
- Full-screen split layout: left = animated glow (golden + sky blue radials) + Vinaadi symbol + copy + CTA; right = live demo strip
- Demo strip: static (no API) animated cards cycling through a sample daily score card, panchangam fragment, and a dasha breadcrumb — shows users what they will actually see
- CTA: `[Open dashboard →]`

**Feature section:**
- Cards with illustrated thumbnails of real UI: chart grid miniature, dasha bar miniature, member cards miniature
- Not text + icon — show the actual product

**Trust section:**
- "Built on Thirukanitham precision"
- Thirukanitham tradition · Lahiri ayanamsa · Drik ephemeris backend · Whole Sign houses · Vimshottari dasha
- This builds credibility with traditional users

**Mobile:** Hero stacks vertically, demo strip becomes horizontal scroll

---

### 4.9 Login Page (`/login`)

- Keep dark card
- Add animated glow background (same as landing hero)
- Desktop: two-column — left = brand story ("Tamil astrology, calculated precisely, explained plainly"), right = form
- Password strength: color-fill arc (not bars)
- Social proof line below submit
- Onboarding setup form: explicit birth time confidence selector (Official record / Family memory / Elder recall / Unknown) as a visible step

---

## 5. FAB CONSOLIDATION

| Current FAB | Action | New home |
|---|---|---|
| Purple — Feedback | Opens feedback modal | Settings → Help section (FAB can stay as shortcut) |
| Gold — Porutham | Routes to `/dashboard/porutham` | Tools tab card |
| Green — Chart generate | Routes to `/dashboard/chart-generate` | Tools tab card |
| Indigo — Ask Vinaadi | Toggles AI chat widget | Tools tab card + **keep as 1 FAB** (makes sense in-context on any page) |

**After revamp: 1 FAB only** — Ask Vinaadi AI chat widget  
**Reason to keep it as FAB:** Users ask chart questions while browsing any tab — keeping it floating means they don't lose their place

---

## 6. COMPONENT BUILD LIST

### New components to create

| Component | File | Purpose |
|---|---|---|
| `BottomNav` | `components/bottom-nav.tsx` | Mobile 7-item tab bar, icon + label |
| `SidebarNav` | `components/sidebar-nav.tsx` | Desktop left sidebar, collapsible |
| `SubNav` | `components/sub-nav.tsx` | Horizontal pill sub-navigation (reusable in every tab) |
| `DrawerPanel` | `components/drawer-panel.tsx` | Right-side slide-in panel for detail views |
| `AlertBanner` | `components/alert-banner.tsx` | Dismissible top banner (red/amber) |
| `ScoreGauge` | `components/score-gauge.tsx` | Circular arc score display |
| `DayStrip` | `components/day-strip.tsx` | 7-day week strip with score color bands |
| `MemberChip` | `components/member-chip.tsx` | Avatar + score color dot |
| `ActionCard` | `components/action-card.tsx` | Best window / Avoid window pair |
| `ToolsGrid` | `components/tools-grid.tsx` | Card grid layout for Tools tab |
| `ToolCard` | `components/tool-card.tsx` | Individual tool card (icon, name, description, CTA) |
| `LifeAreaCard` | `components/life-area-card.tsx` | Card for Life Areas grid |
| `SynastryMatrix` | `components/synastry-matrix.tsx` | Pairwise grid for Family Synastry |
| `ModeBadge` | `components/mode-badge.tsx` | Persistent Beginner/Balanced/Traditional pill |
| `CollapsibleSection` | `components/collapsible-section.tsx` | Expand/collapse wrapper |
| `StepWizard` | `components/step-wizard.tsx` | Multi-step form shell (Porutham, Rectification) |

### Existing components to significantly revise

| Component | File | Change |
|---|---|---|
| `DashboardHero` | `components/dashboard-hero.tsx` | Strip emoji tab bar → slim top bar with score chip + mode badge |
| `DashboardWorkspace` | `components/dashboard-workspace.tsx` | Thin coordinator after Phase 0 hook extraction; new 7-tab routing |
| `DashboardPersonalTab` | `components/dashboard-personal-tab.tsx` | Becomes TODAY tab layout |
| `DashboardLifeAreasTab` | `components/dashboard-life-areas-tab.tsx` | Card grid instead of linear scroll |
| `DashboardFamilyTab` | `components/dashboard-family-tab.tsx` | Sub-nav + restructured member cards + synastry matrix |
| `DashboardMemberCard` | `components/dashboard-member-card.tsx` | Larger, add mini chart thumbnail, score dot |
| `DashboardSettingsSessionTab` | `components/dashboard-settings-session-tab.tsx` | Restructured into 4 sections (Profile, Preferences, Account, Help) |
| `DashboardPlanTab` | `components/dashboard-plan-tab.tsx` | Sub-nav (Goals / What-If / Timing / Decisions) |
| `DashboardJournalTab` | `components/dashboard-journal-tab.tsx` | Sub-nav (Write / Entries / Reflections) |

### Existing components to keep unchanged

| Component | Reason |
|---|---|
| `JathagamKattam` (in `dashboard-charts.tsx`) | South Indian chart grid is correct and familiar — do not redesign |
| `DashaTimeline` (in `dashboard-dasha.tsx`) | Keep horizontal bar — only make it taller and richer in colour |
| `DashboardDailySnapshot` | Relocate as hero card inside TODAY tab — content unchanged |
| `PeyarchiBanner` | Keep as-is — just elevate its visual prominence |
| `ConfidenceBadge` | Keep — just make it larger and more prominent on chart views |

---

## 7. DESIGN TOKENS (globals.css changes)

### Color token changes

| Token | Current | New | Reason |
|---|---|---|---|
| `--color-accent` | `#6366f1` (cold indigo) | `#e5b84d` (golden) | Golden is already used in components — make it the primary accent |
| `--color-accent-secondary` | (none) | `#93c5fd` (sky blue) | Demote indigo to secondary |
| `--color-alert-critical` | (none) | `#f87171` | Chandrashtama, Vedha, Rajju |
| `--color-alert-caution` | (none) | `#fbbf24` | Peyarchi, Sani warnings |
| `--color-positive` | (none) | `#4ade80` | Best window, favorable scores |
| `--color-surface` | `#111827` | unchanged | |
| `--color-text` | `#e5e7eb` | unchanged | |

### Layout primitives to add

```css
.layout-app           /* root flex container — sidebar + main */
.layout-sidebar       /* desktop: left sidebar column */
.layout-main          /* main content area beside sidebar */
.layout-bottom-nav    /* mobile: padding-bottom to clear fixed nav */
.drawer               /* slide-in panel from right */
.sub-nav              /* horizontal pill row */
.alert-banner         /* top-anchored dismissible banner */
.score-gauge          /* circular arc container */
.tool-grid            /* 2-column tool card grid */
.day-strip            /* 7-day horizontal strip */
```

### Accessibility rules

- All icon-only buttons: must have `aria-label`
- Tab bars: `role="tablist"`, each tab `role="tab"` + `aria-selected`
- DrawerPanel: `role="dialog"` + `aria-modal="true"` + focus trap on open
- AlertBanner: `role="alert"` or `aria-live="polite"`
- `@media (prefers-reduced-motion: reduce)` — disable all transitions and animations
- Touch targets: minimum 44×44px (critical for elder users on mobile)
- Contrast: verify `#94a3b8` on `#05070d` meets 4.5:1 for body text (currently may fail — check and fix)
- Keyboard focus ring must be visible (dark theme resets may have suppressed it — restore it)

---

## 8. IMPLEMENTATION PHASES (detailed)

### Phase 0 — Architecture split (prerequisite — no visual change to user)

**Goal:** Make `dashboard-workspace.tsx` safe to modify by extracting domain concerns into hooks.

**Files to create:**
- `web/hooks/useSession.ts` — auth state, user email, sign out
- `web/hooks/usePersonalData.ts` — chart, dasha, transit, panchangam, guidance, peyarchi, sani
- `web/hooks/useFamilyData.ts` — vaults, members, aggregate score, family calendar
- `web/hooks/usePlanData.ts` — goals, what-if, activity timing
- `web/hooks/useJournalData.ts` — entries, context events, retention, correlations

**Files to modify:**
- `web/components/dashboard-workspace.tsx` — import hooks, remove extracted logic, workspace becomes thin coordinator

**Verification:** Zero visual change for user. All existing tests pass. Dev server starts clean.

---

### Phase 1 — Design system + navigation shell

**Files to create:**
- `web/components/bottom-nav.tsx`
- `web/components/sidebar-nav.tsx`
- `web/components/sub-nav.tsx`
- `web/components/drawer-panel.tsx`
- `web/components/alert-banner.tsx`
- `web/components/mode-badge.tsx`
- `web/components/collapsible-section.tsx`

**Files to modify:**
- `web/app/globals.css` — new color tokens, layout primitives, remove duplicate inline patterns
- `web/components/dashboard-ui.tsx` — add new base primitives
- `web/components/dashboard-hero.tsx` — slim top bar only (strip emoji tab bar)
- `web/components/dashboard-workspace.tsx` — integrate new 7-tab routing and BottomNav/SidebarNav

**Verification:** Navigation works on mobile and desktop. All 7 destinations reachable. Chandrashtama banner appears correctly.

---

### Phase 2 — TODAY tab

**Files to create:**
- `web/components/score-gauge.tsx`
- `web/components/day-strip.tsx`
- `web/components/action-card.tsx`
- `web/components/member-chip.tsx`

**Files to modify:**
- `web/components/dashboard-personal-tab.tsx` — full layout revamp into TODAY tab structure

**Verification:** Score gauge renders correctly for all score bands. Alert zone hidden when no alerts. Panchangam collapsible works. Week strip shows 7 days with correct colors. Family chip row appears if vault has members.

---

### Phase 3 — TOOLS tab

**Files to create:**
- `web/components/tools-grid.tsx`
- `web/components/tool-card.tsx`
- `web/app/dashboard/tools/page.tsx` (or route within workspace)

**Files to modify:**
- `web/app/dashboard/porutham/page.tsx` — step wizard layout
- `web/app/dashboard/chart-generate/page.tsx` — two-panel layout
- `web/components/dashboard-workspace.tsx` — remove 3 of 4 FABs (keep Ask Vinaadi FAB only)
- `web/components/dashboard-rectification-wizard.tsx` — surface as a Tools route entry

**Verification:** All 6 tool cards visible and clickable. Porutham step wizard works end to end. Chart generate produces printable jathagam. Rectification wizard reachable from Tools (and still reachable from Settings for backward compat). Annual Wrapped generates correctly. Retrospective Analysis works.

---

### Phase 4 — EXPLORE tab

**Files to create:**
- `web/components/life-area-card.tsx`
- `web/components/synastry-matrix.tsx` (used in Family tab also)

**Files to modify:**
- `web/components/dashboard-life-areas-tab.tsx` — card grid layout; DrawerPanel for life area detail
- `web/components/dashboard-transits-tab.tsx` — "What changed today" summary header; Sani cycle display
- `web/components/dashboard-personal-tab.tsx` — extract chart + dasha + transits into EXPLORE tab sub-sections

**Verification:** Life area cards render in grid. DrawerPanel opens with detail on click. Yogas/Doshams two-column layout works. Jadhagam report loads inside drawer. Birth time confidence badge visible on chart.

---

### Phase 5 — FAMILY + PLAN tabs

**Files to modify:**
- `web/components/dashboard-family-tab.tsx` — sub-nav; larger member cards; synastry matrix wired
- `web/components/dashboard-member-card.tsx` — larger, mini chart thumbnail, score dot
- `web/components/dashboard-plan-tab.tsx` — sub-nav (Goals / What-If / Timing / Decisions)
- `web/components/dashboard-calendar-tab.tsx` — monthly view; member color dots; filter chips

**Verification:** Family member drawer opens. Synastry matrix renders all member pairs. Monthly calendar color dots correct. Plan sub-nav navigates correctly.

---

### Phase 6 — JOURNAL + SETTINGS tabs

**Files to modify:**
- `web/components/dashboard-journal-tab.tsx` — sub-nav (Write / Entries / Reflections); dasha-colored timeline; shadow prompts with mode gate
- `web/components/dashboard-settings-session-tab.tsx` — 4 section groups (Profile / Preferences / Account / Help); QA content moved here; feedback link added

**Files to remove (or archive):**
- `web/components/dashboard-qa-tab.tsx` — content moved into Settings → Help

**Verification:** Journal sub-nav works. Dasha color edges appear on entries. Mode gate shown correctly for BEGINNER users on Reflections. Settings sections render correctly.

---

### Phase 7 — Landing + Login + Accessibility

**Files to modify:**
- `web/app/page.tsx` — full landing page revamp (split hero, demo strip, illustrated feature cards, trust section)
- `web/app/login/page.tsx` — two-column desktop layout; onboarding confidence selector
- `web/app/globals.css` — accessibility rules (focus ring, reduce motion, min touch targets)

**Verification:**
- Landing page demo strip animates correctly (static data, no API)
- Login two-column renders on desktop, stacks on mobile
- All icon buttons have aria-label
- Tab bars have correct ARIA roles
- DrawerPanel has focus trap
- Keyboard navigation works through all tabs
- Prefers-reduced-motion disables animations
- Touch targets ≥ 44px on all interactive elements
- Contrast ratio audit passes

---

## 9. CONSTRAINTS AND NON-NEGOTIABLES

- **Zero backend changes** — this is a frontend-only revamp. All API endpoints, response shapes, and calculation logic stay exactly as-is.
- **South Indian chart grid unchanged** — do not redesign `JathagamKattam`. Traditional users expect this exact layout.
- **Bilingual support maintained** — every new component must accept `lang: Lang` prop and use `t()` / `tLang()` from `@/lib/i18n`.
- **Dark-only theme** — do not add a light mode. Warm up the golden tones instead.
- **Astrological rules unchanged** — see `docs/AGENT_INSTRUCTIONS.md` for the complete list. UI revamp does not touch scoring, calculations, or dasha logic.
- **Alembic migrations not needed** — no schema changes.
- **TypeScript strict** — all new components must be fully typed. No `any`.
- **No new dependencies without approval** — use what is already in `web/package.json`. If a new library is needed, flag it and ask.

---

## 10. QUESTIONS REQUIRING OWNER DECISION (answer before starting Phase 1)

| # | Question | Recommendation |
|---|---|---|
| 1 | Dark-only or add light mode option? | Dark only — simpler, matches brand |
| 2 | Tamil-first or English-first default? | Keep English default, Tamil toggle (current behaviour) |
| 3 | South Indian chart grid — keep exactly? | Yes — all reviews agree |
| 4 | Annual Wrapped — on-demand only or year-end triggered? | On-demand from Tools tab |
| 5 | Phase 0 hook extraction — approve before proceeding? | Yes — must be reviewed before Phase 1 |
| 6 | Any tabs or features to exclude from revamp? | None identified — all features are in scope |

---

*End of UIUX_REVAMP_PLAN.md*
