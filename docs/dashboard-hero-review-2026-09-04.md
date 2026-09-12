# Dashboard Home — Hero review (2026-09-04)

Surface reviewed: the Today tab hero card — greeting block, mood chips, best-window
tile, score dial, and the right-hand timing rail (avoid window + "Other traditional
timings").

Primary file: `web/components/dashboard-today-tab-nova.tsx` lines 599–971.
Supporting: `web/components/dashboard-ui-nova.tsx`, `web/lib/dashboard-i18n.ts`,
`app/services/emotional_weather.py`.

Reviewed through five lenses: product design, fullstack correctness, Tamil
thirukanitham doctrine, astrology enthusiast, and a first-time naive user.

---

## Verdict

The hero is **structurally right and presentationally leaky**. The information
architecture is the strongest part of this app: one promoted window, one score, the
safety axis kept beside the recommendation rather than competing with it, and the
rival timing systems demoted behind a named disclosure that says what they are *for*.
That is a hard problem, solved.

The arithmetic is also sound. I checked the panchangam numbers on screen against each
other and they are internally consistent (worked below) — the defects are **not** in
the engine.

What is wrong is the last inch: raw database tokens rendered as user copy, one fact
expressed four times in two contradicting valences, a caution panel that goes quiet at
the exact moment the caution applies, and a traditional-timings panel that omits the
one set of times a Tamil reader opens it to find.

Nine of the fifteen findings below are in code the backend already computed a correct
answer for.

---

## What is genuinely good — keep it

- **One promoted window, with its reason attached.** `pickRecommendedWindow` picks by
  the almanac's own Gowri ranking, clear of the three kalas, and the card prints *why*
  ("Amirtham — best overall… Clear of Rahu Kalam, Yamagandam and Kuligai"). Most
  panchangam apps print five times and let the reader referee. This one decides, and
  shows its working.
- **"Other traditional timings" as a disclosure, not peer cards.** The framing —
  "shown so you can check it, not so you have to choose between them" — is the correct
  posture and rare.
- **The ranked conflict line** (2:14–3:14 pm Mercury hora falling in Rogam kala) is
  exactly the kind of honesty that earns trust with a serious user.
- **Chandrashtama in amber, not red**, with "awareness, not alarm". Correct doctrine
  and correct affect.
- **Timezone discipline.** Greeting, hora lookup and the NOW marker all resolve in the
  panchangam zone, not the browser's. A Toronto browser reading a Chennai chart is
  handled.

---

## Findings

Severity: **P0** = wrong or misleading information on screen · **P1** = real user harm
or contradiction · **P2** = polish.

| # | Severity | Finding | Location |
|---|---|---|---|
| 1 | **P0** | Raw database enum rendered as user copy: `balanced_routine` | `dashboard-today-tab-nova.tsx:791–803` |
| 2 | **P0** | The day's *positive* recommendation is painted as a red warning | `:796` |
| 3 | **P0** | `avoidBefore` — the only real caution in emotionalWeather — never rendered anywhere in web | backend `emotional_weather.py:51–54` |
| 4 | **P1** | The avoid window goes silent exactly while the user is inside it | `:938–955` |
| 5 | **P1** | One score, four representations, two valences | `:910–921` |
| 6 | **P1** | "Nalla Neram" row lists no times | `:229–235` |
| 7 | **P1** | Abhijit overlaps Rahu Kalam by 24 min, unremarked, under a card boasting "clear of the kalas" | `:237–244` |
| 8 | **P1** | Disclosure intro overclaims: 3 of its 4 rows are not systems the window was chosen from | `dashboard-i18n.ts:340–343` |
| 9 | **P1** | "Why this score →" lands on a card titled "Why this prediction?" | `:923` → `:1102` |
| 10 | **P1** | Evening-preview toggle exposes no state to assistive tech | `:623–649` |
| 11 | **P1** | The page's only `<h1>` is invisible under forced-colors / Windows HCM | `:741–748` |
| 12 | **P2** | Prime hero slot spent, every day, describing the UI | `:749–753` |
| 13 | **P2** | No nakshatram or tithi in the hero | `:611–620` |
| 14 | **P2** | Clamped briefing has no visual "more" affordance; whole paragraph is a `role="button"` | `dashboard-ui-nova.tsx:92–101` |
| 15 | **P2** | Large dead band in the hero at wide viewports | `:805` |

---

## P0 — wrong information on screen

### 1. `balanced_routine` is a database token, and the human copy for it already exists

The third mood chip reads **`balanced_routine`** — snake_case, unlocalised, straight
out of Python.

All three chips render raw tokens:

```tsx
{ Icon: Leaf,          label: emotionalWeather.tone },              // "calm"
{ Icon: Sparkle,       label: emotionalWeather.physicalTendency },  // "steady"
{ Icon: AlertTriangle, label: emotionalWeather.bestUseOfDay },      // "balanced_routine"
```

`calm` and `steady` are *lucky* — they happen to be single readable English words. The
leak was invisible until a multi-word token surfaced. Every other profile in
`_TONE_MAP` leaks visibly the moment it is selected: `low_energy`, `deep_work`,
`people_facing`, `execution_sprints`, `single_task_routine`.

The backend already ships the human copy, bilingual, for all three:

```python
# app/schemas/daily_guidance.py:85–87
tone_text:             DailyGuidanceText = Field(alias="toneText")
physical_tendency_text: DailyGuidanceText = Field(alias="physicalTendencyText")
best_use_of_day_text:   DailyGuidanceText = Field(alias="bestUseOfDayText")
```

For today's default profile that is:

> **en:** "Well suited for routine progress and practical step-by-step decisions."
> **ta:** "நிதானமான வழக்கமான வேலைகள், சிறு முடிவுகள், படிப்படியான முன்னேற்றம் — இவற்றுக்கு இன்று நல்ல நாள்."

`grep -rn "bestUseOfDayText\|physicalTendencyText\|toneText" web/` returns **zero
hits**. The correct, reviewed, bilingual sentence is computed, serialised, sent over
the wire, and thrown away at the last component.

This is also a **Tamil-mode failure**: switch to `த` and these chips still read
`calm` / `steady` / `balanced_routine`. The Tamil user gets English database tokens.

**Fix:** render `*Text` in the chips. If the pill is too narrow for a full sentence,
keep a short label but derive it from a token→BiText map — never print the token.

### 2. The recommendation is painted as a warning

`bestUseOfDay` is the day's *most positive* field — "supportive for leadership",
"best used for focused, deep work". The hero gives it `AlertTriangle` and
`--color-low`:

```tsx
{ Icon: AlertTriangle, label: ...bestUseOfDay, color: "var(--color-low)",
  bg: "var(--color-low-bg)", border: "var(--color-low-border)" },
```

Tone is hard-coded **by slot position**, not by content. This is the repo's own
DASH-08 ruling ("tone travels with the message — never inferred") inverted: here tone
is inferred from array index. A naive user reads a red-bordered warning triangle and
concludes the day has a problem it does not have.

Compounding it: the *green* Leaf chip carries `tone`, which is the field most likely
to be genuinely negative (`heavy`, `scattered`, `low_energy`). So on a Saturn day the
hero would render **"heavy" in green with a leaf** and **"deep work" in red with a
warning triangle** — both signs exactly inverted.

**Fix:** three fixed slots with three fixed semantics — `tone` neutral, tendency
neutral, `bestUseOfDay` positive/high. Or derive tone from the token, not the index.

### 3. The one genuine caution is never shown

`avoidBefore` is the only field in `EmotionalWeatherResult` that is an actual warning:

> "Delay emotionally heavy conversations until the evening if possible."

`grep -rn "avoidBefore" web/` finds it only in an e2e variable name. It is computed,
typed, serialised — and rendered on no web surface at all.

So the hero currently shows a fake warning (finding 2) while withholding the real one.

---

## P1 — contradictions and user harm

### 4. The avoid window goes quiet exactly when it matters

At the moment of the screenshot the clock is ~11:14 am (best window 12:19 pm, "starts
in 1h 5m"). Rahu Kalam is **10:48 am – 12:19 pm**. The user is *inside the avoid
window right now*, and the card says nothing about it — it renders the same static
"AVOID WINDOW 10:48 am – 12:19 pm" it will render at 4 pm.

Meanwhile the *opportunity* card two columns left has a live countdown, a pulsing dot,
and three phase states (`before` / `during` / `after`, `:542–559`).

The safety axis has no now-state; the opportunity axis has three. That is backwards.
A caution earns live state more than an invitation does.

**Fix:** reuse the existing `windowPhase` machinery for the avoid card. "Now — ends in
1h 5m" during; dim + "passed" after; "in 2h" before. Same three states, same helper.

### 5. One score, four representations, two valences

The score card stacks, in order:

| Element | Renders | Line |
|---|---|---|
| `NovaScoreDial` | **54** / 100 | `:910` |
| `NovaStarRow` | ★★☆☆☆ (`54/20` = 2.7/5, `aria-label="2.7 / 5"`) | `:911` |
| `verdict.verdict` | **"Balanced day"** — neutral-positive | `:913` |
| `bandPhrase(band)` | **"needs attention"** — a caution | `:914–921` |

Four encodings of one number, and the bottom two disagree in direction. A naive user
reads two stars out of five and concludes the day is poor; then "Balanced day" and
concludes it is fine; then "needs attention" and concludes it is not.

This is the repo's own recorded ruling — *Two Axes On One Card = Contradiction* — and
it has reappeared here. `verdict` and `band` are two different ladders applied to the
same value and stacked 6px apart with no label saying they measure different things.
The star row makes it worse: 2.7/5 stars is the harshest of the four encodings and the
only one with no words attached to soften it.

**Fix:** pick two. The dial (precise) plus the verdict phrase (calm, leads) is the
combination UXD-19 already argued for. Drop the star row, or drop the band pill —
whichever survives should carry a label saying what axis it measures.

### 6. "Nalla Neram" is the one row with no times

In `OtherTimingsDisclosure` the Nalla Neram row is constructed with `value: null`
(`:229–235`). Abhijit gets times. Horai gets a lord and a next-change. Avoid periods
gets all three spans. Nalla Neram — **the row a Tamil almanac reader opens this panel
to find** — gets a definition and nothing else.

The panel's own count badge says "4", promising four answers; one of them is a
dictionary entry.

The data is right there: `panchangam.kalam.nallaNeram[]` is already passed into the
ribbon component below and already segmented on the timeline.

**Fix:** print the day's Nalla Neram spans on that row, with the promoted one marked
so it's visibly the same window as the hero's.

### 7. Abhijit overlaps Rahu Kalam and the panel does not say so

Screen values: **Abhijit 11:55 am – 12:44 pm**, **Rahu Kalam 10:48 am – 12:19 pm**.
The overlap is **24 of Abhijit's 49 minutes** — half of it.

The copy calls Abhijit "counted auspicious for anyone, whatever their chart", with no
qualifier, sitting directly under a card whose entire argument is *"Clear of Rahu
Kalam, Yamagandam and Kuligai."* A reader who takes both at face value gets two
contradictory instructions from one panel.

This is not a rare edge case. Friday's Rahu Kalam is the 4th of the eight day-parts,
which on most Fridays straddles late morning into midday — so it will clip the head of
Abhijit on a large fraction of Fridays, structurally. Sunday's 8th part and Saturday's
3rd will collide on other days.

The classical position is genuinely contested (many traditions hold Abhijit overrides
the kalas; many Tamil families do not). Either ruling is defensible; **silence is not**,
because the app has already committed to the opposite doctrine one card away.

**Fix (needs an owner ruling, not a code decision):** when Abhijit intersects a kala,
append the overlap and the app's position — e.g. "11:55 am – 12:44 pm · overlaps Rahu
Kalam until 12:19 pm; this app treats the kalas as binding, so the clear part is
12:19–12:44." Flag for `docs/ASTROLOGER_REVIEW_QUEUE.md`.

### 8. The disclosure's opening line overclaims

> "These are the systems it was chosen from — shown so you can check it, not so you
> have to choose between them."

Of the four rows, only **Nalla Neram** is a system the window was chosen from —
`pickRecommendedWindow` reads the Gowri ranking and the kala spans, nothing else.
Abhijit and Horai are not consulted in the pick at all, and "Avoid periods" is a veto
set, not a source.

So the sentence tells the reader that Abhijit was considered and rejected. It wasn't.
A reader who checks the recommendation against Abhijit and finds they disagree has
been told, falsely, that the disagreement was already adjudicated.

**Fix:** split the intro, or split the panel — one line for "what the window was cut
from" (Nalla Neram) and one for "other systems your almanac also lists" (Abhijit,
Horai), with avoid periods labelled as the veto set it is.

### 9. "Why this score" lands on "Why this prediction?"

`:923` renders **"Why this score →"** pointing at `#nova-deep-dive`, which is headed
**"Why this prediction?"** (`:1102`). Two names for one destination. The user clicks a
question about a *number* and arrives at an answer about a *forecast*, with no visible
confirmation they landed in the right place — and `#nova-deep-dive` is a `<div>`, so
focus does not move for a keyboard or screen-reader user; only the viewport does.

**Fix:** one name (the destination's heading should win), and make the anchor target
focusable (`tabIndex={-1}`) so focus follows the jump.

### 10. The evening-preview toggle tells assistive tech nothing

It is visually a switch — track, knob, animated position (`:638–648`) — but it is a
plain `<button>` with no `aria-pressed` and no `role="switch"`. A screen-reader user
hears "Evening preview, button" and gets no state, before or after activating it.

The repo's axe gate only checks contrast (recorded), so this class of defect passes CI.

Two smaller issues in the same control:

- `🌙` is an emoji used as an icon, which the project's own pre-delivery checklist
  prohibits, and which reads aloud as "crescent moon" mid-label. Same for `🌘` on the
  Chandrashtama pill (`:781`). Both should be lucide glyphs like every other icon on
  this surface.
- **Product:** this is a *setting* occupying prime hero real estate, and it is inert
  for ~20 hours a day — it changes nothing until `zoneHour >= 20` (`:539`). At 11 am it
  is a control that does nothing, sitting beside the day's most important number. It
  belongs in Settings, or should only appear after ~7 pm.

### 11. The page's only `<h1>` disappears under forced colors

The greeting name is gradient-clipped text:

```tsx
background: "linear-gradient(120deg, var(--color-text-strong), var(--color-accent-secondary))",
WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
```

Under Windows High Contrast Mode / `forced-colors: active`, the background gradient is
stripped and `WebkitTextFillColor: transparent` survives — the name renders invisible.
`grep -c "forced-colors" web/app/dashboard/dashboard-nova.css` → **0**. There is no
guard anywhere in the Nova stylesheet.

**Fix:** `@media (forced-colors: active) { .nova-hero-name { -webkit-text-fill-color: currentColor; background: none; } }`. Worth a sweep for other clipped-text uses at the same time.

---

## P2 — polish

### 12. The hero spends its best line describing itself

> "Today's guidance, your chart score, and the best windows — at a glance."

Static, identical every day, and it sits *between* the user's name and the actual
briefing (`:749–753`). It is onboarding copy in a surface a user visits daily. For a
returning user it is a line of noise pushing the real content down; for a first-time
user it says what the layout already says.

**Fix:** show it only on first visit, or only when `personalDailyGuidance` is null
(where it genuinely helps). Otherwise let the briefing lead.

### 13. A Tamil almanac reader's first question is not answered

The header line gives weekday, Gregorian date, Tamil date (Aavani 18), paksha, and the
festival. It does not give **nakshatram** or **tithi** — which for a thirukanitham
reader are the first two things looked up, ahead of paksha. Both are already fetched
and both are rendered correctly (with limb-rollover handling) in the ribbon far below.

Nakshatram in particular is the field a returning Tamil user scans for. Ranking paksha
above it inverts the traditional triage.

**Fix:** add the running star and tithi to the header line, matching the ribbon's
rollover treatment so the two surfaces cannot disagree.

### 14. The clamped briefing does not look clamped

The briefing truncates at "…Ardhashtama Sani — a years-long phase, no…" — cutting off
precisely as the most consequential fact in the paragraph is introduced. It *is*
expandable (hover or click, `NovaClampedText`), but there is no visual affordance —
no chevron, no "more", no cursor change signalled in the markup — so nothing tells the
reader the rest exists.

Separately, `role="button"` is applied to the whole prose paragraph
(`dashboard-ui-nova.tsx:92–101`), so a screen reader announces the entire briefing as
one button label.

**Fix:** an explicit "Read more" affordance; move the button role onto that control and
leave the paragraph as a paragraph with `aria-expanded`/`aria-controls` on the trigger.

### 15. Dead band at wide viewports

The left column is `flex: 1` with `maxWidth` caps of 480px (h1), 520px (lede) and 600px
(briefing), plus a `<div style={{flex: 1}} />` spacer at `:805`. At the ~1900px width
in the screenshot this produces roughly 200px of empty vertical space between the mood
chips and the best-window card, while the right rail's content is compressed into two
224px cards. The hero reads as unfinished at desktop widths even though it is
well-balanced at ~1280px.

**Fix:** cap the hero's own content width, or let the right rail widen past 224px above
~1600px so the columns finish together.

---

## The astrology checks out — worth stating plainly

I verified the on-screen panchangam values against each other before assuming a
display bug was a calculation bug:

- Friday's Rahu Kalam is the 4th of eight day-parts. Working back from
  **10:48 am – 12:19 pm** gives a part length of ~91.3 min → **sunrise ≈ 06:14**,
  day length ≈ 12h11m, **sunset ≈ 18:25**. Plausible for Chennai on 4 Sept.
- Horai: Friday's sunrise hora is Venus, 60-minute clock horas from 06:14 →
  Jupiter 10:14–11:14, **next Mars 11:14 am** ✓ (matches the panel exactly).
- The conflict line's **Mercury hora 2:14–3:14 pm** is the 9th hora from that same
  06:14 sunrise ✓.
- Abhijit **11:55–12:44** is 49 min centred on local noon (~12:19) ✓, and 12:19 is
  also the midpoint of sunrise 06:14 / sunset 18:25 ✓.
- **Aavani 18** on 4 Sept 2026 and **Krishna Jayanthi** on Krishna-paksha ashtami of
  Aavani, with the waning glyph — all mutually consistent ✓.

Every number on the hero agrees with every other number on the hero. One doctrinal
disclosure is missing (finding 7), and the day/night hora-length convention is
undisclosed anywhere in the UI — but the engine is not the problem here.

---

## Suggested order

1. **Findings 1 + 2 + 3** — one change to the chip block. The copy already exists in
   the response; this is deleting a bug, not writing a feature. Fixes Tamil mode too.
2. **Finding 4** — reuse `windowPhase` on the avoid card. Small, and it is the one
   finding where the current behaviour can actually cost a user something.
3. **Finding 5** — drop one of the four score encodings. A deletion.
4. **Findings 9, 10, 11** — label, `aria-pressed`, forced-colors guard. All small.
5. **Findings 6 + 8** — the disclosure's own content. Data is already in hand.
6. **Finding 7** — needs an owner ruling first; queue it in
   `docs/ASTROLOGER_REVIEW_QUEUE.md` rather than picking a doctrine in code.
7. **P2s** as capacity allows; 12 and 13 are the two a daily user would notice.
