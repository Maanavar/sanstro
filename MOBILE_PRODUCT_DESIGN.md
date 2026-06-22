# Vinaadi Mobile — Product Design Strategy
# Web Feature Adaptation for Mobile

**Last updated:** 2026-06-21  
**Role:** Product Design + UX Strategy  
**Status:** Decision document — read this BEFORE writing any screen spec or code

---

## The Core Problem with "Port Web to Mobile"

The web dashboard is a **workspace**. Users open it, sit down, and spend 10–20 minutes exploring their chart, reading predictions, planning decisions.

The mobile app is a **companion**. Users unlock it for 30–60 seconds while commuting, before a meeting, first thing in the morning. Then they put it away.

These are fundamentally different interaction modes. A direct port creates a mobile app that feels like a shrunken laptop. That is not 2026 standard. That is 2015 responsive web.

**The right question is never "how do I put Feature X on mobile?"**  
**The right question is "what JOB does Feature X do, and what's the best mobile form for that job?"**

---

## Principle Stack (non-negotiable)

1. **Glanceable first.** Any piece of data the user checks daily must be readable in under 3 seconds. If it needs a scroll, it's already too slow.
2. **Progressive depth.** Surface the signal, hide the detail. Tap to go deeper, never scroll to find the main point.
3. **Push over pull.** Mobile's superpower is that it knows when something matters. The web waits to be visited. Mobile should arrive at the right moment.
4. **Contextual over navigational.** If a feature is only relevant in the context of something else, it lives inside that thing — not as a tab, not as a screen, not as a menu item.
5. **One screen, one job.** Each screen answers exactly one question. If you can't say the screen's job in 6 words, it's doing too much.

---

## Navigation Architecture Decision

### Current (4 tabs)
```
Today | Panchangam | Tools | Me
```
This works for what's built. It breaks as soon as we add predictions, life events, journal, and synastry — there's nowhere to put them without creating navigation chaos.

### Proposed (5 tabs)
```
Today | Panchangam | Insights | Tools | Me
```

**Why 5 and not a different structure:**
- iOS and Android both render 5 tabs cleanly — this is the system ceiling before tabs need labels and icons to carry the weight
- The 5 jobs map to distinct user intent: "What's today?" / "What time is best?" / "What does my chart say?" / "Calculate something" / "My profile"
- Adding a 6th would require a "More" tab which destroys discoverability

### Tab Definitions

| Tab | Job | Contains |
|-----|-----|---------|
| **Today** | Daily companion — what matters right now | Score ring, life area pulse, cosmic weather, nalla neram, guidance, activity chips, journal quick-capture, CTA to next life event |
| **Panchangam** | Timing oracle — is this a good time? | Calendar, day detail, weekly score preview, Gowri cycle badges, muhurta check shortcut |
| **Insights** | Personal depth — what does my chart say? | Dasha, Life Predictions, Life Events timeline, Varshaphala, Transits, Journal history |
| **Tools** | Calculators — check something specific | Porutham, Muhurta, Natchathiram, Dosham, Yogam, Pariharam, Prashan, Rectification |
| **Me** | Identity + settings | Profile, Family Vault, Subscription, Notifications, Language |

---

## Feature Adaptation Map

Each web feature below has been analysed for its job, then assigned the correct mobile treatment. "Screen" means it earns a dedicated page. "Component" means it lives inside an existing screen. "Push" means it should arrive as a notification, not be found by navigating.

---

### Life Area Predictions (Marriage, Career, Wealth, Health)

**Web treatment:** 4 text cards in a panel tab.  
**Job:** Tell the user how each life domain is trending this week/month.

**Wrong mobile approach:** A `/predictions` screen with 4 scrollable cards.  
**Right mobile approach — two entry points:**

**Entry 1 — Today screen surface layer:**  
Below the score ring, add 4 coloured mini-bars labelled with Tamil/English area names. Each bar is 40pt wide, coloured from red → amber → green by score. This is a 5-second glance. No navigation needed for the signal.

```
[Score Ring: 74]
❤ Career  ◉◉◉◉◎   72
❤ Love    ◉◉◉◎◎   61
❤ Wealth  ◉◉◉◉◉   88
❤ Health  ◉◉◎◎◎   44
```

Tap any bar → bottom sheet opens with full prediction text for that area. Sheet snaps to 55% (summary) or 90% (full text + next 30-day chart). No navigation away from Today.

**Entry 2 — Insights tab "This Period's Outlook":**  
A horizontal swipeable card stack. One card per life area. Each card: large area icon, score arc, 3–4 sentence prediction in Tamil/English, "Next 30 days" indicator. Swipe left to read next area.

This is better than web because:
- Web forces you to compare all 4 simultaneously (cognitive load)
- Mobile lets you focus on one area at a time (calmer, more reflective)
- The surface bar on Today gives the quick signal; the card gives the story

---

### Life Events (Predicted windows with confidence tiers)

**Web treatment:** A list of events with date ranges and confidence percentages (e.g. "Marriage window: Apr–Aug 2027, 78% confidence").  
**Job:** Tell the user when the cosmos is aligned for major milestones.

**Wrong mobile approach:** A scrollable list of event cards.  
**Right mobile approach — three touchpoints:**

**Touchpoint 1 — Today screen countdown widget:**  
A single-line card at the bottom of Today: "Next significant window: Career peak — 127 days →". Tap → goes to the Life Events screen. This is the only place this appears on Today. It earns its space by being urgency-driver.

**Touchpoint 2 — Insights tab "Your Life Timeline":**  
A dedicated section in Insights rendered as a **flowing vertical river timeline**. The river is the user's life from birth to ~age 90. Their current position is marked with a glowing dot. Upcoming event windows are coloured bands on the river (green = favourable, amber = transitional, red = challenging). Tap a band → bottom sheet with full event detail + what it means.

The river format is deliberately different from the web list because:
- It communicates scale ("this is a 3-month window in a lifetime") without numbers
- It shows multiple events' relationships (a career peak and a marriage window overlapping tells a story)
- It's scroll-driven, which is native to mobile

**Touchpoint 3 — Push notification:**  
60 days before any significant window opens, send "Your [Career / Marriage / Health] window opens in 60 days. Tap to prepare." This is the mobile superpower the web cannot replicate.

---

### Journal

**Web treatment:** A full tab with text input, 8-category picker, context event fields, correlation view. Designed for 10-minute sessions.  
**Job:** Help the user track significant life moments so they can correlate them with astro periods retrospectively.

**Wrong mobile approach:** Copy the form fields to a `/journal/new` screen.  
**Right mobile approach:**

The fundamental insight is that journaling on mobile is not the same act as journaling on desktop. On mobile, journaling is **marking a moment**, not writing an essay.

**Primary entry — Today screen "Log a moment" button:**  
A small persistent button at the bottom of Today, shaped like a `+` with a quill mark. Tap → a 3-step bottom sheet:

```
Step 1: What happened?  [chips: big win / hard day / decision made / milestone / nothing yet]
Step 2: Which area?     [chips: Career / Love / Health / Money / Family / Spiritual / General]
Step 3: Any note?       [optional free text, max 200 chars] [optional voice note 30s]
               → Done (3 taps, 8 seconds)
```

The system automatically records: timestamp, current Dasha lord, active transit, today's cosmic score. No user input needed for the astrological context — it's captured silently.

**Secondary entry — Insights tab "My Journal" section:**  
A calendar heatmap (like GitHub's contribution graph) showing intensity of logged moments. Tap a day → see what was logged. Monthly patterns emerge visually. Users who log regularly see their "astrological life story" forming.

This is fundamentally different from the web journal because:
- The web journal is analytical (write, correlate, reflect)
- The mobile journal is instinctive (tap, mark, move on)
- Both serve the same long-term goal: retrospective correlation

---

### Retrospective Analysis

**Web treatment:** A correlation panel matching logged events to astrological periods.  
**Job:** Show the user that astrology actually predicted what happened to them.

**Wrong mobile approach:** A separate retrospective screen with a table.  
**Right mobile approach — woven into existing contexts:**

**Context 1 — Inside any Journal entry:**  
When viewing a past journal entry, below the entry text, automatically show: "You were in [Rahu Mahadasha, Ketu Antardasha] when this happened. [What does this mean?]" — a small contextual card. Tap the "What does this mean?" → info sheet about that period's typical themes.

**Context 2 — Insights tab "Patterns" card:**  
One scroll-past card in Insights: "In the past 12 months, 4 of your 6 logged wins happened during [Jupiter period]. Your challenge entries cluster in [Saturn period]." Rendered as a simple bar chart. Not a dedicated screen.

**Context 3 — Annual Wrapped:**  
The richest retrospective experience is the Annual Wrapped (see below). That's where the full story is told.

---

### Goals & Planning + Decision Support

**Web treatment:** Goals tab with event-to-window mapping; Decision support panel with brief output.  
**Job:** Help the user act on astrological timing for major decisions.

**Wrong mobile approach:** A goals list screen + a decision form screen.  
**Right mobile approach:**

Goals and decisions are the same thing in disguise: "I want X, when is the best time to pursue it?"

**Integrate into Muhurta (existing Tools screen):**  
Muhurta today is an activity picker → time slot result. Extend it with two modes:

```
[Quick Muhurta]     Pick an activity today → best time slot
[Life Decision]     New — pick a life area + horizon → best 3-month windows in next 2 years
```

"Life Decision" is the Decision Support + Goals feature adapted for mobile. Instead of a separate tab, it's a deeper mode of the tool the user already knows. The result is a push notification: "Set a reminder for [start of your peak window]?" — one tap and they're done.

This eliminates the need for a goals management screen entirely. Goals on mobile is just "remind me when the window opens."

---

### Divisional Charts (Vargas D2–D60)

**Web treatment:** A panel rendering all divisional charts side-by-side.  
**Job:** Allow advanced users to examine their chart at different resolution levels.

**Wrong mobile approach:** 12 chart grids scrollable vertically.  
**Right mobile approach:**

The Jadhagam chart screen (accessible from Me and Tools) adds a **chart type selector** above the chart — a horizontally scrollable chip strip:

```
[D1 Rasi ●] [D9 Navamsa] [D10 Dashamsha] [D12 Dvadashamsha] [D3] [D7] [D4] ···
```

Selecting a chip swaps the chart grid below with a spring animation. The active chip is highlighted. Chart title + meaning shown beneath the chip: "D9 Navamsa — Marriage & Spiritual Strength".

Show D1, D9, D10, D12 for all users. Remaining charts behind premium chip (locked icon, tapping opens paywall sheet).

The single-chart-at-a-time format is actually MORE readable on mobile than the web's dense multi-chart view.

---

### Synastry / Family Compatibility

**Web treatment:** A synastry matrix table showing planetary alignments between two people.  
**Job:** Understand how two people's charts interact.

**Wrong mobile approach:** Reproduce the matrix table at mobile width.  
**Right mobile approach:**

Inside the Family Vault screen, each family member card gets a **"Compare" button**. Tapping opens a bottom sheet — never a new screen — with:

```
[Compatibility Radar]   A 5-axis chart (Timing | Values | Communication | Finance | Energy)
[Top Strengths — 3 bullets]
[Points of Tension — 2 bullets]
[Overall Match Score + one-line summary]
```

The radar chart replaces the matrix because:
- A matrix at 375pt width requires zooming and panning (hostile UX)
- A radar chart shows the same multi-axis information at a glance
- It communicates "shape" of compatibility rather than individual planet placements (which are meaningless to most users anyway)

Advanced users who want the planetary matrix get a "Full analysis" link that opens the web dashboard.

---

### Birth Time Rectification

**Web treatment:** A multi-step wizard with yes/no/unsure questions about past life events.  
**Job:** Narrow down an uncertain birth time by correlating known events to chart periods.

**This maps almost perfectly to mobile.** Mobile is actually BETTER for this wizard because:
- One question per screen = zero cognitive overload
- Swipe forward = natural progress gesture
- Swipe back = undo last answer (better than a back button)

**Implementation:**  
New screen `mobile/app/rectification/index.tsx`. 
Accessible from the Jadhagam chart screen: "Not sure about your birth time? Refine it →".  
Wizard steps: intro → event questions (one per screen, swipeable) → result with corrected time range → "Apply to my chart" CTA.

Use `expo-router` animated stack with `swipeEnabled` to simulate horizontal page swipe between steps.

---

### Annual Wrapped

**Web treatment:** A year-in-review page you navigate to.  
**Job:** Celebrate the user's astrological year, create a viral share moment, deepen connection with the app.

**Wrong mobile approach:** A screen you tap into from Me settings.  
**Right mobile approach:**

Annual Wrapped is an **event**, not a feature. It should arrive as a push notification on two occasions:
1. The user's solar return date (astrological new year — when the Sun returns to its natal position)
2. December 26–31 (calendar year reflection)

The notification: "Your 2025 in the cosmos is ready. 2 minutes to watch." opens a **full-screen story** (no tab bar, no header, fills the whole screen):

```
Slide 1:  [Your year, astrologically] — animated star field with user's Rasi
Slide 2:  [Your Dasha story] — "You spent 2025 in [Rahu Mahadasha]. Known for ambition and unexpected shifts."
Slide 3:  [Your peak 30 days] — "Your highest-scoring period was [Oct 14–Nov 12]. What happened?"
Slide 4:  [Your life area trends] — 4 sparkline charts, one per area, full year
Slide 5:  [Your log moments] — "You marked [7] significant moments" — journal highlights
Slide 6:  [Year ahead preview] — "2026 brings [Jupiter transit] to your 10th house. Career acceleration likely."
Slide 7:  [Share card] — Beautiful image generated, native share sheet
```

Tap and hold on any slide = pause. Swipe left = next. Swipe right = back.

This format (Instagram Story / Spotify Wrapped) is the dominant mobile media format for Gen Z. It requires no design explanation — everyone already knows how to use it.

---

### Share Cards

**Web treatment:** A shareable URL you copy.  
**Job:** Let the user show their cosmic identity to friends.

**Wrong mobile approach:** A share URL.  
**Right mobile approach:**

Native image generation + system share sheet.

Long-press (haptic feedback) on any of these elements triggers "Share" in an action sheet:
- Today's score ring → generates "My cosmic score today: 74/100 [bar chart] [Vinaadi branding]"
- Panchangam card → generates "Today's [Tamil date]: Nalla Neram [time range] [Rahu Kalam time]"
- Natchathiram detail → generates "[Star name] born | [traits] | [Vinaadi branding]"

Image is generated client-side using `react-native-view-shot` (capture the component as an image). Native share sheet handles WhatsApp, Instagram Stories, iMessage.

WhatsApp is the primary target — the card should be formatted 9:16 for Stories or 2:1 for WhatsApp chat.

---

### Gowri Cycle

**Web treatment:** A section in the Personal tab.  
**Job:** Alert the user to Gowri's auspicious time windows throughout the day.

**Mobile treatment — purely contextual:**  
- Add Gowri time slots as a `TimeCard` in Today (same row as Nalla Neram and Rahu Kalam)
- Add a small coloured indicator dot on Panchangam calendar day cells (gold dot = auspicious Gowri period today)
- An "ℹ" icon next to "Gowri" triggers a bottom sheet explanation for users who don't know what it is
- NOT a dedicated screen. Not a tab section. A data point that enriches existing screens.

---

### Peyarchi / Saturn Transit Banner

**Web treatment:** A banner that appears when Saturn changes signs.  
**Job:** Alert users to a major planetary transit that affects everyone's Rasi differently.

**Mobile treatment:**  
- Push notification when Peyarchi starts: "[Saturn enters Aquarius]. Tap to see your Rasi impact."
- On the Today screen: a "Cosmic Alert" card appears (styled like a warning banner) during active Peyarchi, with "affects your Rasi" badge. Tap → Transits screen filtered to Saturn.
- The Transits screen already exists and shows this data — the only new piece is the surface card on Today.

---

### Educational Content (27 Natchathiram, Dosham articles, Yogam detail pages)

**Web treatment:** Separate SEO-optimised article pages.  
**Job:** Help users understand astrological concepts.

**Wrong mobile approach:** 27 Natchathiram screens + 6 Dosham screens + 8 Yogam screens.  
**Right mobile approach — contextual information architecture:**

**Rule: Information is shown where it's relevant, not where it lives.**

| Content | Where it lives on mobile |
|---------|--------------------------|
| Natchathiram details (27 stars) | Natchathiram tool screen — becomes a paginated browser. One star per page, horizontal swipe. User's star auto-selected. Not 27 separate screens — one screen with paged content. |
| Dosham explanations | Inside the Dosham tool screen. Each dosham row's expanded state includes the explanation. The article IS the expanded card. |
| Yogam details | Same — inside Yogam screen, each yoga's expanded state includes the full description. |
| Pariharam details | Inside Pariharam screen, remedy cards expand to show full details. |
| "What is Chandrashtama?" | Info sheet triggered by ℹ icon on Chandrashtama screen. |
| "How to read a Jadhagam" | Info sheet triggered from the Jadhagam chart screen. |
| "What is Porutham?" | Intro card that appears above Porutham tool form on first use. |
| General education | NOT a tab. Consider a contextual tooltip system — first time a user sees "Dasha" the word gets an underline they can tap to get a 3-sentence definition. |

---

### Panchanga Calendar — Week Ahead Guidance

**Web treatment:** A "Week Ahead" section in the guidance panel.  
**Job:** Let users see which upcoming days are favourable for different activities.

**Mobile treatment — Panchangam tab enhancement:**  
The calendar week strip already exists. Enhance it:
- Each day cell gets a micro-indicator: coloured dot (green/amber/red) showing that day's composite score
- "This Week" summary card ABOVE the calendar: "Best days this week: Tuesday, Friday | Challenging: Wednesday"
- Card is driven by the backend's weekly scores, not hardcoded
- No new screen needed — this enriches the Panchangam tab that users already visit daily

---

### Activity Timing Cards

**Web treatment:** Cards listing recommended activities for specific time windows.  
**Job:** Help users know what to do (or avoid) today based on the cosmic state.

**Mobile treatment — Today screen chips:**  
Replace or supplement the generic guidance text with a chip row:

```
✓ Travel  ✓ Business talks  ✓ Learning  ✗ Surgery  ✗ Contracts
```

Chips are dynamically generated from the guidance API response. Tapping a chip → bottom sheet explaining why (links to Muhurta data).

This replaces an entire "Activity Timing" panel with 5 chips and a bottom sheet — more scannable, same information.

---

## What Explicitly Does NOT Get a Mobile Screen

Some web features should link to web instead of being rebuilt:

| Web Feature | Mobile decision | Reason |
|-------------|-----------------|--------|
| Admin console | Web only | Admin is a power-user workflow, not a mobile use case |
| Full 36-point Porutham matrix | Deep link to web | Matrix layout impossible at mobile width; the tools screen gives a score + summary |
| Detailed Jadhagam report (full PDF-style) | Deep link to web | Long-form reading = desktop session |
| Temple pages | Web link from Pariharam | Static content, low engagement, better as a web destination |
| Tamil calendar festivals | Web link from Panchangam | SEO content, low app value |
| Friendship compatibility | Maybe — evaluate demand | Can add as a Tools card if demand justifies it |
| Marketing pages (features/*, trust/*) | Web only | Not app content |
| Admin analytics | Web only | Not user-facing |

For deep links to web, use a standard in-app browser (WebView or `expo-web-browser`) with the app's brand colour in the browser chrome.

---

## The Redesigned Today Screen

The Today screen is the app's front door. It should answer 5 questions that a user has every morning:

1. **Is today a good day?** → Score ring (already exists) + life area mini-bars (new)
2. **What time should I do important things?** → Nalla Neram / Rahu Kalam / Gowri (enhance existing)
3. **What's my horoscope today?** → Rasi Palan / daily guidance (already exists)
4. **Is anything unusual happening cosmically?** → Cosmic Alert card (new — appears only on Peyarchi, eclipse, Chandrashtama days)
5. **What's coming up for me?** → Countdown to next life event + "This week" preview chip (new)

Additional: Quick "Log a moment" button and "Ask Vinaadi" shortcut.

**Scroll structure (top to bottom):**

```
─ Header: Logo + Location chip + Notification bell ─────────────
─ Score Ring (large) + 4 life area mini-bars ───────────────────
─ [Cosmic Alert card — conditional, only on significant days] ──
─ Today's date (Tamil calendar format) ─────────────────────────
─ Nalla Neram | Rahu Kalam | Gowri (3 time cards in a row) ─────
─ Activity chips: ✓ Travel ✓ Business ✗ Contracts ─────────────
─ Rasi Palan (daily guidance text) ─────────────────────────────
─ Dasha context: "You're in [Rahu MD, Jupiter AD] — [1 line]" ──
─ Life Event countdown: "Career window in 127 days →" ──────────
─ [Log a moment +] [Ask Vinaadi →] ─────────────────────────────
─ [Ad unit — guests only] ──────────────────────────────────────
```

The Panchangam details (tithi, natchathiram, karanam, yogam, vaaram) move to the Panchangam tab. Today only shows the essentials — the 3 time cards and the score.

---

## The New Insights Tab

This is the tab that holds all personal-depth features. Structure:

```
─ Header: "Insights" + your Rasi chip ──────────────────────────
─ [Your Dasha Now] — Maha + Antar, remaining time, link to full timeline
─ [Life Area Predictions] — horizontal swipeable cards (4 areas)
─ [Life Events] — river timeline or 3-card preview + "See all" 
─ [Annual Prediction] — current year summary card + link to full
─ [Transits] — "2 transits this month affecting you" card + link
─ [Your Journal] — heatmap + last 3 entries + "Add moment +"
```

Each section is a **card preview** with a "See all" link to the full screen. The tab itself is a vertical scroll of insight cards — a personalised astrological dashboard in the good sense of the word.

---

## Handling the Tamil Audience Specifically

Tamil astrology users skew 30–60 years old but the next generation (25–35 Gen Z Tamil) is the growth segment. Design decisions that serve both:

1. **Tamil-first language** — default to Tamil on first launch, toggle to English. Not "Tamil as alternative."
2. **Familiar symbols** — use Tamil numbers (௧ ௨ ௩) in the chart alongside Arabic. Use Rasi symbols users recognise from almanacs.
3. **Kaalam names in Tamil first** — "நல்ல நேரம்" before "Nalla Neram". Experienced users need no translation.
4. **WhatsApp share format** — Tamil users share screenshots on family WhatsApp groups. Design every share card knowing it will be viewed at thumbnail size in a WhatsApp chat.
5. **Offline fallback** — show yesterday's cached data if the network is slow. Rural Tamil Nadu has patchy connectivity. Never show a blank screen.

---

## Summary: Feature Decision Table

| Web Feature | Mobile Treatment | New Screen? |
|-------------|-----------------|-------------|
| Life Area Predictions | Mini-bars on Today + swipeable cards in Insights | No new screen (add to Insights tab) |
| Life Events | Countdown on Today + River timeline in Insights | Add section in Insights tab |
| Journal | Quick-capture bottom sheet from Today | Add "My Journal" section in Insights tab |
| Retrospective | Contextual inside journal entries + Patterns card in Insights | No separate screen |
| Goals / Decision Support | Extend Muhurta tool into "Life Decision" mode | No new screen |
| Synastry | Radar chart bottom sheet from Family Vault | No new screen |
| Divisional Charts | Chip selector on existing Jadhagam screen | No new screen |
| Birth Time Rectification | Swipeable step-wizard | New screen `/rectification` |
| Annual Wrapped | Full-screen story triggered by push | New screen `/wrapped` (seasonal) |
| Share Cards | Long-press → react-native-view-shot → share sheet | Component, no screen |
| Gowri Cycle | TimeCard on Today + dot on Calendar | Component, no screen |
| Peyarchi Banner | Cosmic Alert card on Today + push notification | Component, no screen |
| Activity Timing | Chip row on Today | Component, no screen |
| Natchathiram articles | Paged view inside existing Natchathiram tool | No new screen |
| Dosham articles | Expandable content inside existing Dosham screen | No new screen |
| Yogam articles | Expandable content inside existing Yogam screen | No new screen |
| Pariharam articles | Expandable content inside existing Pariharam screen | No new screen |
| Weekly ahead guidance | Score dots on calendar cells + "This week" card | Component, no screen |
| Dasha scrubber | Horizontal proportional timeline in Dasha screen | Enhance existing screen |
| Varshaphala | Already built | Already exists |
| Transits | Already built | Already exists |
| Temple pages | Deep link to web | External link |
| Admin / Analytics | Web only | Not built on mobile |

---

## Implementation Order for a Coding Agent

After completing MOBILE_UX_2026.md (design polish), build in this order:

### Phase 1 — Navigation restructure (1–2 days)
1. Add "Insights" as 5th tab in `_layout.tsx`
2. Create `mobile/app/(tabs)/insights/index.tsx` — scaffold with placeholder sections
3. Move Dasha, Transits, Varshaphala access links from Today/Me into Insights
4. Keep existing screens, just add navigation paths from Insights

### Phase 2 — Today screen enrichment (2–3 days)
5. Add 4 life area mini-bars below score ring (backend: `predictions.py`)
6. Add activity timing chips (backend: `daily_guidance.py` already returns this)
7. Add Gowri time card (backend: `panchangam.py` data)
8. Add "Life Event countdown" widget (backend: `life_events.py`)
9. Add Cosmic Alert card conditional component
10. Add "Log a moment +" quick-capture entry (client-side only, stores locally then syncs)

### Phase 3 — Insights tab sections (3–4 days)
11. Life area predictions swipeable cards (new `src/api/predictions.ts` + section in Insights)
12. Life Events river timeline (new `src/api/life_events.ts` + section in Insights)
13. Journal heatmap + recent entries (new `src/api/journal.ts` + quick-capture sheet)
14. Patterns card (derived from journal data — no new API needed)

### Phase 4 — Tool enhancements (2–3 days)
15. Muhurta "Life Decision" mode (extend existing `muhurta.tsx`)
16. Divisional chart chip selector on Jadhagam screen
17. Birth Time Rectification wizard (new screen, `src/api/rectification.ts`)
18. Natchathiram tool → paged star browser
19. Family Vault → synastry radar sheet

### Phase 5 — Delight & Virality (2–3 days)
20. Annual Wrapped story screen
21. Share card generation (react-native-view-shot)
22. Long-press share on Today score, Panchangam card, Natchathiram
23. Deep links to web for admin/report features

---

## Done When (overall)

The mobile app has feature parity with the web — adapted, not replicated — when:

- [ ] Opening Today answers all 5 morning questions in under 10 seconds
- [ ] Life area predictions surface on Today (no navigation needed for the signal)
- [ ] A journal entry can be logged in 3 taps from Today
- [ ] The Insights tab tells a complete personal astrological story: Dasha → Predictions → Life Events → Annual → Transits → Journal
- [ ] Family members can be compared via a radar chart bottom sheet (no separate screen)
- [ ] Divisional charts D1–D12 are accessible via chip selector in the chart view
- [ ] Birth time rectification is a swipeable step wizard
- [ ] Annual Wrapped launches as a full-screen story on solar return
- [ ] Any card can be shared to WhatsApp via long-press
- [ ] Gowri, Peyarchi, activity timing all surface contextually without their own screens
- [ ] The Muhurta tool handles both "today's best time" AND "best window in the next 2 years"
- [ ] A user who has never opened the web app can do everything they'd want from mobile

The measure is not "is every web feature present?" The measure is "does a Tamil astrology user get more value from Vinaadi's mobile app than from any competitor?"
