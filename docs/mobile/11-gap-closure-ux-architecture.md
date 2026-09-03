# 11 - Mobile Gap Closure UX Architecture

**Purpose:** close the remaining web-vs-mobile gaps without scattering features into the wrong surfaces. This document is the working plan for mobile IA, UX placement, and Thirukanitham-first implementation.

**Status:** aligned to the current repo state on 2026-06-22.

---

## 1. What is true in the codebase today

The mobile app is **not** starting from three tabs and three tools anymore.

Already present in code:

- Five-tab shell: `Today`, `Panchangam`, `Insights`, `Tools`, `Me`
- Standalone routes for `dasha`, `transits`, `varshaphala`, `daily-score`, `chandrashtama`, `premium`, `rectification`, `wrapped`
- Tool routes for `porutham`, `muhurta`, `natchathiram`, `dosham`, `yogam`, `pariharam`, `prashan`
- Guest preferences already hold `rasi`, `city`, `lat`, `lon`, `lang`
- RevenueCat wiring exists in the root layout and session bootstrap
- Panchangam location bug is already fixed in the current mobile screens

This means the gap-closure sprint is mostly about:

1. correcting remaining correctness issues
2. deepening thin screens
3. placing content in the right UX layer
4. making Thirukanitham visible as a method, not just a badge

### Known feature gaps vs web (as of 2026-06-22)

These are present on web but absent on mobile. Each has a recommended placement column.

| Feature | Web | Mobile | Recommended placement | Priority |
|---|---|---|---|---|
| Goals screen | ✅ | ❌ | `Insights` tab | P0 |
| Varga / divisional charts | ✅ | ❌ | `Insights` → `/vargas` | P1 |
| Decision assistant (`/decisions/brief`) | ✅ | ❌ | `Today` card + `/ask-vinaadi` | P1 |
| What-if scenario analysis (`/whatif`) | ✅ | ❌ | `/ask-vinaadi` extended mode | P2 |
| Natchathiram deep-dive (27 star pages) | ✅ | Cards only | `Tools` → `natchathiram` poster screen | P1 |
| Dosham detailed pages | ✅ | Tool entry only | Tool result + bottom sheet | P1 |
| Yogam showcase | ✅ | ❌ | `Tools` → `yogam` result list | P1 |
| Pariharam detail pages | ✅ | Tool entry only | Tool result cards | P1 |
| Temples directory | ✅ | ❌ | `Learn` rail + hybrid link | P2 |
| Educational learn section | ✅ | ❌ | `mobile/app/learn/` route group | P1 |
| Tamil calendar with festivals | ✅ | ❌ | `Panchangam` calendar tab | P1 |
| Chart PDF export | ✅ | ❌ | `Me` → Jadhagam → share action | P2 |
| Side-by-side chart comparison | ✅ | ❌ | `Me` → Family Vault | P2 |
| Muhurtham Naal list | ✅ | ❌ | `Panchangam` calendar | P2 |
| Friendship compatibility | ✅ | ❌ | `Tools` | P3 |

---

## 2. Product architecture we should use

### Core rule

Each surface should have one job:

- `Today`: what matters now
- `Panchangam`: time and calendar
- `Insights`: personal depth and interpretation
- `Tools`: calculators, checks, and references
- `Me`: identity, settings, saved access, and account actions

### The mistake to avoid

Do **not** keep adding every missing web page into `Tools`.

That creates a junk drawer and hides the product logic. Mobile should separate:

- **time-based daily utility**
- **personal chart depth**
- **interactive tools**
- **evergreen learning**

### Recommended mobile mental model

`Today` is the morning companion.
`Panchangam` is the daily almanac.
`Insights` is the personal astrologer.
`Tools` is the calculation lab.
`Me` is the home for the user and their data.

---

## 3. Where each missing feature should live

### A. `Today`

Keep this as the highest-signal dashboard only.

Wire here:

- Daily score
- Current dasha preview
- Active chandrashtama alert
- Next transit / peyarchi alert
- One-tap links into deeper screens
- **Decision prompt card** — surface `/decisions/brief` as a single daily card: "Facing a decision today? Ask Vinaadi." Tap → `/ask-vinaadi` in decision mode.

Do not add long educational copy here.

### B. `Panchangam`

This is the correct place for:

- daily timings
- monthly Tamil calendar
- **Tamil calendar festivals** (Hindu, Christian, Muslim, Government holidays — port from web)
- **Muhurtham Naal list** (auspicious days highlighted on monthly calendar)
- location-sensitive sunrise/sunset
- "why timings changed" context tied to location and date

Add a visible method strip near the header:

- `City`
- `Thirukanitham`
- `Lahiri`
- `Drik`

This tab should teach by light annotation, not by long articles.

### C. `Insights`

This should become the **depth hub**. It is the right place to wire the personal astrology stack.

Primary modules:

- Dasha timeline
- Varshaphala
- Transit outlook
- Life-area pulse
- Event windows
- Journal patterns
- **Goals** — new module. Wire `/goals` CRUD. Correlate active goals with current dasha period in the hero card. Backend fully built.
- **Varga / divisional charts** — new module. Wire `/charts/{id}/vargas` response into a dedicated varga screen. Show D-1 (Rasi), D-9 (Navamsa), D-10 (Dashamsa) as minimum.

Secondary module:

- `Learn Thirukanitham` rail

This is the best place for explainers because users arrive here already in a "help me understand" mindset.

### D. `Tools`

This stays action-oriented.

Correct tool categories:

- Matching: `Porutham`
- Timing: `Muhurta`
- Reference: `Natchathiram`
- Chart checks: `Dosham`, `Yogam`
- Remedies: `Pariharam`
- Horary: `Prashan`
- **Friendship compatibility** — port from web, belongs here (P3)

Every tool screen should answer three questions in order:

1. what is the result
2. how was it checked in Thirukanitham terms
3. what should the user do next

Do not turn `Tools` into a long-form article library.

### E. `Me`

Use this for stable, non-time-sensitive entry points:

- My Jadhagam
- Dasha Timeline
- Annual Prediction
- Transits
- Notification Inbox
- Rectification
- language, city, push, privacy, premium
- **Chart PDF export** — share action on Jadhagam screen, generates PDF via backend

`Me` should link to depth; it should not own the primary experience for that depth.

---

## 4. Thirukanitham content strategy

### Principle

Thirukanitham should appear in three layers:

1. **trust marker**
2. **calculation explanation**
3. **learnable methodology**

### Layer 1: trust marker

Keep the badge, but standardize it.

Show the badge on:

- Daily Score
- Panchangam hero
- Dasha banner
- Varshaphala summary
- Jadhagam
- tool result cards

### Layer 2: calculation explanation

Each computed screen needs a compact `Why this result?` disclosure.

Examples:

- Panchangam: location + sunrise-adjusted timings
- Dosham: checked from Lagna, Moon sign, Venus, cancellation rules
- Yogam: chart combinations and strength basis
- Dasha: Vimshottari sequence + current maha/antar period
- Transits: current rasi + planet movement + impact label basis

This should be a bottom sheet or accordion, not a full article.

### Layer 3: learnable methodology

Create a dedicated learn route group:

`mobile/app/learn/...`

Initial topics:

- `what-is-thirukanitham`
- `why-birth-time-matters`
- `how-to-read-a-jadhagam`
- `what-is-chandrashtama`
- `what-is-porutham`

These pages can start as native summaries with a `Read full guide on web` link while we decide how much of the web editorial corpus should become native.

---

## 5. Native vs web rule for educational content

Not every web page should become a full native page.

### Must be native

- anything interactive
- anything personal to the chart
- anything used weekly or daily
- anything needed to explain a live result

Examples:

- dasha
- transits
- varshaphala
- chandrashtama state
- dosham result explanation
- natchathiram reference for selected star

### Can be hybrid

- long evergreen editorial pages
- SEO-style educational essays
- trust/methodology long reads
- temple directories with large textual content

Pattern:

- in-app summary card
- bottom sheet overview
- optional outbound `Read full guide`

This keeps mobile fast and intentional instead of cloning the website badly.

---

## 6. Target navigation and wiring map

### From `Today`

- score ring → `/daily-score`
- current dasha card → `/dasha`
- chandrashtama alert → `/chandrashtama`
- transit alert → `/transits`
- decision card → `/ask-vinaadi` (decision mode)
- ask action → `/ask-vinaadi`

### From `Insights`

- dasha hero → `/dasha`
- annual prediction tile → `/varshaphala`
- transit tile → `/transits`
- varga tile → `/vargas`
- goals tile → `/goals`
- learn rail card → `/learn/[slug]`

### From `Tools`

- `Porutham` result → bottom sheet first, detailed route only if needed later
- `Muhurta` result → bottom sheet first
- `Natchathiram` → dedicated reference screen, optional deep link to learn article
- `Dosham` → result accordion + `How checked`
- `Yogam` → result list + strength explanation
- `Pariharam` → practical remedy cards grouped by dosha
- `Prashan` → answer screen with outcome, lagna, and caution copy

### From `Me`

- keep shortcut links to `/jadhagam/[id]`, `/dasha`, `/varshaphala`, `/transits`
- add `Learn` entry point here too for users who look for reference/help from settings/profile
- add PDF export action on Jadhagam screen

### From notifications

- peyarchi → `/transits`
- daily timing alert → `/panchangam`
- score or personal guidance alert → `/daily-score`
- decision prompt → `/ask-vinaadi`

---

## 7. Screen-depth priorities

### Priority 0: correctness and trust

Before any feature work, the following must be true:

- [ ] Sentry configured and capturing crashes on real devices (iOS + Android)
- [ ] RevenueCat entitlement edge cases verified: expired subscription, restore purchases, family sharing
- [ ] Tamil text encoding clean — no mojibake on any production screen (audit all screens with Tamil content)
- [ ] Cold start time measured — target under 2.5s on mid-range Android (Pixel 6a class)
- [ ] Offline panchangam verified — timings must display from cache when device has no connection

Dark mode is **not** a token rename. It requires a full design pass across all 30+ screens. Options:

1. Commit to full dark mode — add `parchment`, `goldMethod`, `deepIndigo`, `surfaceDark` tokens to [mobile/src/theme/colors.ts](mobile/src/theme/colors.ts) and audit every `StyleSheet.create` that uses hardcoded `#F5EFE6`, `#FFFFFF`, or `white` — estimated 3–4 days.
2. Defer to after Phase 4 — document the decision, add a `TODO(dark-mode)` comment in colors.ts.

Do not list dark mode as a Phase 1 task without committing to option 1 or 2.

### Priority 1: make the existing feature screens feel complete

Each screen below has explicit acceptance criteria.

**`dasha/index.tsx`**
- [ ] Hero card shows current maha dasha + antar dasha name, start date, end date, percentage elapsed
- [ ] Scrubber renders a horizontal timeline with past/present/future periods visible
- [ ] Tapping a period opens a bottom sheet with the full narrative for that period
- [ ] Empty state: "Birth time not confirmed — rectify for accurate dasha" with link to `/rectification`

**`transits/index.tsx`**
- [ ] Each planet row shows: current rasi, movement direction, days until next sign change
- [ ] Peyarchi (major sign change) periods are visually distinct — color-coded or badged
- [ ] Tapping a planet opens a bottom sheet with impact narrative for this chart
- [ ] Method strip shows `Thirukanitham` and current location

**`varshaphala/index.tsx`**
- [ ] Year summary hero: year number, overall theme sentence, 3 highlight life areas
- [ ] Monthly grid: each month has a color-coded tone (favorable / neutral / caution)
- [ ] House accordion: each house section has a 2-sentence summary before the full text
- [ ] Share action: generate a Varshaphala summary card

**`tools/natchathiram.tsx`**
- [ ] Selected star has a poster-style hero: star name in Tamil + English, ruling planet, guna, element
- [ ] Ruling deity and symbol shown
- [ ] Compatible contexts: career, marriage, timing notes
- [ ] Deep link to `/learn/natchathiram-[slug]` for full guide

**`tools/dosham.tsx`**
- [ ] Detected doshas separated from checked-and-absent
- [ ] Each detected dosham has: name, severity indicator, brief explanation
- [ ] "How checked" accordion: lagna, moon sign, cancellation rules used
- [ ] Remedy CTA: "See remedies for this dosham" → `/tools/pariharam`

**`tools/yogam.tsx` (currently thin)**
- [ ] Lists all yogas present in the chart with: name, nature (benefic/malefic), strength
- [ ] "How checked" bottom sheet per yoga
- [ ] Highlight top 3 yogas in the hero

**`tools/pariharam.tsx` (currently thin)**
- [ ] Groups remedies by: Dosham, Planet, Life Area
- [ ] Each remedy card: what to do, when to do it, which temple/deity
- [ ] Mark as completed action (local state)

### Priority 2: add the learning layer

- New `learn` route group at `mobile/app/learn/`
- `_layout.tsx` with back navigation and progress header
- `[slug].tsx` — single template for all learn pages
- Small number of native methodology pages (start with 5 listed in Section 4)
- Cross-links from all tool screens and Insights

### Priority 3: interaction polish

See Section 8 (Motion Architecture) for full detail.

---

## 8. Motion architecture

This is one of the largest gaps versus top-tier apps (Google/Apple/Linear). Motion is not decoration — it communicates state change, guides attention, and creates the feeling that the app is alive. It belongs in the plan at the same priority level as features, not as a Phase 5 afterthought.

### Principles

- Motion should communicate meaning, not perform. Every animation answers: what changed and why should the user notice?
- Spring physics over linear easing everywhere. `withSpring` from Reanimated 2 with `damping: 18, stiffness: 120` as the default.
- Never block interaction while animating. Animations must run on the UI thread.

### Moment-by-moment animation plan

**Jadhagam reveal (most important moment in the app)**

The first time a user sees their birth chart is the emotional peak of onboarding. Currently it renders instantly. It should feel like an unveiling.

- Center mandala fades in first (300ms)
- Houses draw in clockwise starting from Lagna (staggered, 40ms per house, SVG path animation)
- Planet abbreviations fade into their respective houses (staggered after houses complete)
- ThirukanithamBadge slides up from bottom with spring
- Estimated effort: 1 day (Reanimated 2 + react-native-svg animated paths)

**Score ring (already partially done — extend it)**

- Current: stroke animation on mount. Good.
- Add: score number counts up from 0 to final value in sync with stroke (use `useDerivedValue` + `useAnimatedProps`)
- Add: on shared transition into `/daily-score`, the ring morphs in size between screens (SharedTransitionView already wired — complete it)

**Screen entry stagger (applies to every list screen)**

Every screen that renders a list of cards should stagger card entry:

```ts
// Pattern — apply to every FlatList / ScrollView card
FadeInDown.delay(index * 40).springify()
```

Apply to: Today tab cards, Insights modules, Tools grid, Panchangam timings grid.
Estimated effort: 0.5 days (one helper component, apply everywhere).

**Today tab scroll behavior**

- Score ring and greeting header should have a subtle parallax on scroll (move at 0.3x scroll speed)
- Tab bar should remain visible — no collapse
- Estimated effort: 0.5 days (Reanimated 2 `useAnimatedScrollHandler`)

**Bottom sheets**

Replace all `Modal` and accordion patterns with `@gorhom/bottom-sheet` (already in package.json or add it):

- Snap points: 50%, 90%
- Handle bar visible
- Backdrop blur on iOS
- Spring open / spring close
- Apply to: `WhyThisResultSheet`, tool results, dasha period detail, transit detail, yoga detail

Estimated effort: 1 day for the component, 0.5 days per screen to wire.

**Tab switching**

- Active tab icon should scale up with spring on selection (`withSpring(1.15)` → `withSpring(1.0)`)
- Inactive icons scale down slightly
- Estimated effort: 2 hours

**Pull-to-refresh**

- Already uses `RefreshControl` with saffron tint — keep.
- Add: on refresh complete, a subtle success pulse on the first card (scale 1.0 → 1.02 → 1.0)

**Haptics (already excellent — minor additions)**

- Add `Haptics.impactAsync(Light)` on tab selection
- Add `Haptics.notificationAsync(Success)` on chart save during onboarding reveal
- Current implementation elsewhere is already top-tier — do not over-add

### Lottie / Rive for key moments

These three moments need illustration-based animation. Static icons or text are insufficient.

1. **Jadhagam reveal success** — replace the plain green checkmark with a Lottie animation: a lotus or star constellation drawing itself
2. **Empty state for Insights** — when no birth chart exists: an animated constellation that invites the user to add their details
3. **Goal completed** — when a user marks a life goal as achieved: brief celebration animation

Source options: LottieFiles.com (free library), or commission one custom for the brand.

Estimated effort: 0.5 days per animation to integrate once assets exist.

### What Gesture Handler should actually do (currently installed but unused)

- **Swipe-to-dismiss** on all bottom sheets (built into `@gorhom/bottom-sheet`)
- **Swipe between Panchangam tabs** (daily ↔ monthly) using `react-native-pager-view`
- **Long-press on Today cards** to reveal quick actions (share, add to journal)
- **Swipe-left on notification inbox rows** to dismiss

Do not add swipe gestures that have no clear action. No drag-to-reorder unless Goals requires it.

---

## 9. Offline-first strategy

The app's core use case is a morning companion. Users open it at 5–7am, often on weak or transitioning connections. The following must work with no network:

| Screen | Offline requirement | Cache TTL |
|---|---|---|
| `Today` | All data from last successful load | 24 hours |
| `Panchangam` daily | Timings for today | 24 hours |
| `Panchangam` calendar | Current month | 7 days |
| `Daily Score` | Last score + narrative | 24 hours |
| `Dasha` | Current period data | 7 days |
| `Jadhagam` | Chart data | 30 days |
| `Tools` results | Most recent result per tool | Session only |

Implementation: React Query `staleTime` and `cacheTime` are already configured. Audit each query call and set explicit values matching the table above. Add an offline banner (`"Showing cached data from [date]"`) when the device has no connection and data is stale.

---

## 10. Production release gates

Before any phase ships to the App Store or Play Store:

**Gate 1 — Stability**
- [ ] Crash-free rate ≥ 99.2% on Sentry (measure over 48h of internal testing)
- [ ] No P0 layout breaks on iPhone SE (375px) and Samsung Galaxy A34 (360px)
- [ ] All Tamil text renders correctly on both platforms (no tofu, no mojibake)

**Gate 2 — Core flows**
- [ ] Guest can open app → see today's panchangam → see daily score → no crash
- [ ] Registered user can view their chart → see dasha → see transits → no crash
- [ ] Premium subscription purchase → entitlement unlocked → no crash

**Gate 3 — App Store compliance**
- [ ] Restore Purchases button visible and functional on premium screen ✅ (already present)
- [ ] Privacy policy linked from onboarding and Me tab ✅
- [ ] No use of private APIs
- [ ] App does not require network access to display initial content (offline gate above)

---

## 11. Visual thesis — resolved to token level

### Concept

Quiet temple-library energy: warm parchment surfaces, gold method accents, deep indigo for interpretation depth, and very little ornamental chrome.

### Token additions required

Add these to [mobile/src/theme/colors.ts](mobile/src/theme/colors.ts):

```ts
// Surfaces
parchment: '#F5EFE6',        // warm background (already used, make it a token)
parchmentDeep: '#EDE4D5',    // card surface on parchment

// Method / Gold accent
goldMethod: '#C9971C',       // calculation labels, method strips, Thirukanitham badge
goldMethodLight: '#FDF3D9',  // gold chip background

// Interpretation depth (dark surfaces)
deepIndigo: '#0D0F1A',       // dark screen backgrounds (premium, reveal moments)
indigoSurface: '#161929',    // cards on dark backgrounds
indigoText: '#E8E4F0',       // text on dark backgrounds

// Motion
// No color token — define spring config in a separate motion.ts file
```

### Motion config file

Create `mobile/src/theme/motion.ts`:

```ts
export const spring = {
  default: { damping: 18, stiffness: 120 },
  gentle: { damping: 22, stiffness: 90 },
  snappy: { damping: 14, stiffness: 180 },
};

export const duration = {
  fast: 200,
  medium: 350,
  slow: 600,
  reveal: 1200,  // score ring, chart drawing
};
```

### Content pattern per screen

Every screen follows this layout hierarchy:

1. **Hero** — current signal (score, period name, today's theme)
2. **Support** — one next action or key alert
3. **Detail** — calculation context (behind a `WhyThisResultSheet`)
4. **CTA** — deeper read or related feature

Screens that violate this hierarchy feel cluttered. Audit Today, Insights, and Dasha first.

---

## 12. Accessibility minimum viable pass

Not an optional phase — App Store review in some regions flags missing accessibility. Do this in Phase 1 alongside correctness.

- [ ] All interactive elements have `accessibilityLabel` and `accessibilityRole`
- [ ] Minimum touch target: 44×44pt (add `hitSlop` where elements are smaller)
- [ ] All images and icons have `accessibilityLabel` or `accessibilityHidden={true}`
- [ ] Test with VoiceOver (iOS) and TalkBack (Android) on at least Today and Onboarding screens
- [ ] Do not implement Dynamic Type scaling yet — defer until Phase 4

---

## 13. Time estimates by phase

These are rough band estimates for a single developer. Adjust for team size.

| Phase | Scope | Estimate |
|---|---|---|
| Phase 1 — Foundation cleanup | Sentry, encoding, offline audit, a11y pass, dark mode decision | 3–4 days |
| Phase 2 — IA alignment | Insights hub, Learn route group, Goals screen, wiring map | 5–7 days |
| Phase 3 — Thirukanitham layer | `WhyThisResultSheet`, methodology strip, `useColors()` hook | 2–3 days |
| Phase 4 — Deepen thin screens | Dasha, transits, varshaphala, dosham, yogam, pariharam, natchathiram | 8–10 days |
| Phase 5 — Motion and polish | Jadhagam reveal animation, stagger, score morph, bottom sheets, Lottie moments | 5–7 days |
| **Total** | | **~23–31 developer days** |

---

## 14. Delivery sequence

### Phase 1 - Foundation cleanup (~3–4 days)

- [ ] Sentry configured and crash-free rate baseline established
- [ ] RevenueCat entitlement edge cases verified
- [ ] Tamil text encoding audit — fix all screens with mojibake
- [ ] Accessibility minimum viable pass (labels, roles, touch targets)
- [ ] Offline cache TTL values set per table in Section 9
- [ ] Cold start time measured and documented
- [ ] Decision made on dark mode scope (commit or defer with documented reason)
- [ ] Resolve `useColors()` hook — standardize away from direct color imports

### Phase 2 - Information architecture alignment (~5–7 days)

- [ ] `Insights` becomes depth hub: wire Goals, Varga, Learn rail
- [ ] `Goals` screen built — `mobile/app/goals/index.tsx`
- [ ] `Vargas` screen built — `mobile/app/vargas/index.tsx`
- [ ] `Learn` route group scaffolded — `mobile/app/learn/_layout.tsx` + `[slug].tsx`
- [ ] 5 initial learn pages written (native summary format)
- [ ] `Panchangam` calendar tab adds festival highlights and Muhurtham Naal
- [ ] Decision card wired to `Today` tab
- [ ] Entry points from `Today`, `Tools`, `Me`, notifications all verified per wiring map

### Phase 3 - Thirukanitham explanation layer (~2–3 days)

- [ ] `WhyThisResultSheet` component built and shared
- [ ] `MethodologyStrip` component built and shared
- [ ] Applied to: Panchangam, Dosham, Yogam, Dasha, Transits
- [ ] Thirukanitham badge standardized on all computed screens

### Phase 4 - Deepen thin screens (~8–10 days)

- [ ] `dasha/index.tsx` — acceptance criteria from Section 7
- [ ] `transits/index.tsx` — acceptance criteria from Section 7
- [ ] `varshaphala/index.tsx` — acceptance criteria from Section 7
- [ ] `tools/natchathiram.tsx` — poster hero + full star data
- [ ] `tools/dosham.tsx` — detected vs absent + how checked
- [ ] `tools/yogam.tsx` — yoga list + strength + hero
- [ ] `tools/pariharam.tsx` — grouped remedy cards

### Phase 5 - Motion and premium polish (~5–7 days)

- [ ] `mobile/src/theme/motion.ts` created with spring and duration constants
- [ ] Token additions to `colors.ts` (parchment, goldMethod, deepIndigo set)
- [ ] Jadhagam chart entrance animation (house draw-in, planet fade)
- [ ] Score ring number count-up animation synced to stroke
- [ ] Screen entry stagger helper applied to all list screens
- [ ] Bottom sheet pattern (`@gorhom/bottom-sheet`) wiring for tool results and explanations
- [ ] Tab icon spring scale animation
- [ ] Lottie animation for jadhagam reveal success moment
- [ ] Today tab header parallax on scroll
- [ ] Swipe between Panchangam daily/monthly views

---

## 15. New files to create

```
mobile/app/goals/index.tsx
mobile/app/vargas/index.tsx
mobile/app/learn/_layout.tsx
mobile/app/learn/[slug].tsx
mobile/app/learn/what-is-thirukanitham.tsx
mobile/app/learn/why-birth-time-matters.tsx
mobile/app/learn/how-to-read-a-jadhagam.tsx
mobile/app/learn/what-is-chandrashtama.tsx
mobile/app/learn/what-is-porutham.tsx
mobile/src/components/MethodologyStrip.tsx
mobile/src/components/WhyThisResultSheet.tsx
mobile/src/components/BottomSheet.tsx
mobile/src/hooks/useColors.ts
mobile/src/hooks/useOfflineStatus.ts
mobile/src/theme/motion.ts
```

---

## 16. Decisions

- `Insights`, not `Tools`, is the right home for personal astrology depth.
- `Tools` remains interactive and reference-oriented.
- Educational Thirukanitham content should exist as a distinct learn layer, not be buried inside settings or sprayed across tool screens.
- We should not blindly port every web page into native form.
- Goals screen is P0 — backend is fully built, this is a retention mechanic that should have been in the app already.
- Varga / divisional charts belong in `Insights` — they are interpretation depth, not interactive tools.
- Decision assistant (`/decisions/brief`) surfaces on `Today` as a daily card — it is a daily-use feature, not a tool.
- Dark mode requires an explicit commit or defer decision before Phase 1 closes — it cannot remain an open item.
- Motion is a first-class feature, not a Phase 5 polish pass. The jadhagam reveal animation is the single highest-ROI motion investment in the app.
- Offline panchangam and daily score are non-negotiable for a morning companion product.
- The next implementation sprint should optimize for **clarity of product structure** before adding more feature count.

---

## 17. Definition of done for this planning phase

We are ready to implement when:

- every missing or thin feature has a clear parent surface ✅ (Section 3)
- every Thirukanitham touchpoint has one of the three layers: badge, explanation, or learn page ✅ (Section 4)
- we have agreed which content stays native versus hybrid ✅ (Section 5)
- every thin screen has explicit acceptance criteria ✅ (Section 7)
- motion moments are named and scoped ✅ (Section 8)
- offline requirements are defined ✅ (Section 9)
- release gates are defined ✅ (Section 10)
- visual tokens are resolved to actual values ✅ (Section 11)
- time estimates exist for planning conversations ✅ (Section 13)
- implementation can proceed in phases without reworking navigation again ✅
