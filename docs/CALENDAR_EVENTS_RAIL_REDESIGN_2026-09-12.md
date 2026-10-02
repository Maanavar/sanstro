# Calendar — Events & Festivals rail, redesign

**Date:** 2026-09-12 (implemented 2026-09-15)
**Surface:** `web/components/dashboard-calendar-monthly-nova.tsx` — the right-hand
rail on Calendar → Monthly (Card A, "Events & Festivals").
**Status:** SHIPPED. Owner delegated D1-D5 ("take the right decision and
implement it") on 2026-09-15. Decisions and what shipped are in §8 below.

---

## 1. The question, answered with real numbers

> *"What if the month has more than 100 events — will it all be listed on front?"*

**Yes, it would all render.** The list has no cap:
[dashboard-calendar-monthly-nova.tsx:735](../web/components/dashboard-calendar-monthly-nova.tsx#L735)
maps the array straight to rows with no `slice`, no window, no virtualisation.

**But 100 never happens.** I measured every month of 2026 and 2027 by calling
`build_monthly_panchangam` directly (Chennai, dev DB, read-only), counting what
the Upcoming tab counts — every festival deduped by `(date, name)`, plus every
Tamil muhurtham day:

| | min | mean | max |
|---|---|---|---|
| Events per month | **16** (Jul 2026) | **24.0** | **36** (Mar 2026) |

So the ceiling is 36, not 100. That matters, because it changes the fix: this
does **not** need virtualisation or pagination. It needs the panel to stop being
a dump.

And the important part — **it is already broken at 36, and it is already broken
at 22.** Your screenshot is October 2026, a 22-event month, and the rail runs
~600px past the bottom of the calendar grid it sits beside. March 2026 would run
roughly 1,100px past it. The problem isn't a hypothetical 100. It's that the
panel has no bounded height and no editorial hierarchy *today*.

---

## 2. What's actually wrong

Six findings. Each is verified against the code or the measured data, not inferred
from the screenshot.

### F1 — The rail has no bounded height; the grid does

The grid is a fixed 5–6 week block. The rail is `flex-direction: column` with N
children and no `max-height`. At 22 events the rail is ~1,050px against a ~490px
grid. That single asymmetry produces the large dead area under the calendar in
your screenshot, and pushes **Filter Calendar** and **Quick Jump** — the two
cards that actually *do* something — below the fold, under a list of things that
merely *inform*.

> The controls are buried under the content they control.

### F2 — "View all (N)" is inert in 11 months out of 12

[Lines 455–466](../web/components/dashboard-calendar-monthly-nova.tsx#L455). The
truncation keeps items with `dateLocal >= todayDate`, and falls back to the whole
month when that set is empty.

- Browsing a **future** month → every item is `>= todayDate` → `hiddenCount = 0` → button never renders, full month dumps out.
- Browsing a **past** month → forward set is empty → fallback → full month dumps out.
- Only in the **current** month does it ever truncate.

Your screenshot proves it: October 2026 viewed on 12 Sep 2026, 22 rows, no "View
all" button anywhere. The one affordance meant to bound this list is disabled
precisely when browsing — which is what a month view is *for*.

**F2a — and when it does appear, its number contradicts its own label.
FIXED 2026-09-12.** The count printed after the word "all" was
`upcomingHiddenCount`, the *remainder*. In the current month that put three
unrelatable numbers on one card: a tab badge reading **23**, a list of **13**
rows, and a button reading **View all (10)** — "all" naming the total while the
number named what was left. The button now prints the month total, matching the
badge directly above it. Note the repo's other three "View all" buttons
(`dashboard-hybrid-parts.tsx` lines 1377/1633/1887) carry no count at all, so
this one was the outlier twice over. Covered by
`web/components/dashboard-calendar-monthly-sidebar.test.tsx`. The *inertness*
above is untouched and still stands.

### F3 — The tabs and the Filter Calendar are two filters for one list, stacked 20px apart

Tabs: **Upcoming 22 · Vratham 10 · Muhurtham 3**. Directly beneath, a second card
with six category toggles. Both filter the same array. Worse, the three tabs
aren't a partition — Vratham and Muhurtham are *subsets* of Upcoming, so the
badges read as three peers that don't add up. The code comment at
[line 480](../web/components/dashboard-calendar-monthly-nova.tsx#L480) already
records fighting this exact confusion once.

### F4 — The rail's dots are explained by no legend, and two of them collide

The rail uses `NOVA_DOT_TONE` (4 tones keyed to `kind`). The legend under the grid
documents `NOVA_CAL_HILITE` (9 entries keyed to grid highlight kinds). They are
**different palettes**. Cross-referencing the constants:

| Rail dot | Token | What the legend says that token means |
|---|---|---|
| Festival | `--color-accent-strong` | Festival ✅ |
| Reference muhurtham | `--color-high` | Muhurtham day ✅ |
| **Vratham** | `--color-low` | **"Chathurthi"** ❌ |
| **World day** | `--color-accent-secondary` | **"Amavasai"** ❌ |

Half the rail's dots are actively misleading against the only legend on the page.

### F5 — Everything has the same weight, so nothing has any

Deepavali, `உலக நீர் தினம்` (World Water Day), Pradhosam, and a muhurtham day
matched to the reader all render as the identical row: 7px dot, name, and a
three-fact meta line. The list is sorted by date and by nothing else.

The bulk of it is content the reader already knows. Across 24 measured months,
**10–13 rows per month are recurring vrathams** — Pradhosam twice, Ekadashi
twice, Chathurthi twice, Sashti, Ashtami, Karthigai, Rohini, Thiruvonam. Every
month. Forever. That is roughly **half the panel** spent restating the lunar
cycle.

This is the cadence rule from the Today-tab audit
(`project_daily_surface_cadence_2026-09-07`) applied to a monthly surface:
**new content earns the space, old content earns a link.** Pradhosam is the
oldest content in the product and it is taking three full rows in March.

### F6 — "Your chart" is not your chart

The most serious finding, and it isn't a layout issue.

`NovaEventRow` renders a **"Your chart" / "உங்கள் ஜாதகம்"** badge, and the
Muhurtham tab renders **"Best for your chart" / "உங்கள் ஜாதகத்துக்கு ஏற்ற நாட்கள்"**,
on days where `isSubhaMuhurtham` is true
([lines 282, 783](../web/components/dashboard-calendar-monthly-nova.tsx#L282)).

That flag comes from `_compute_subha_muhurtham_broad` in
[app/calculations/panchangam.py:1502](../app/calculations/panchangam.py#L1502):

```python
def _compute_subha_muhurtham_broad(
    tithi_number: int,
    nakshatra_name: str,
    weekday_index: int,
) -> tuple[bool, str]:
    """Nakshatra-led Subha Muhurtham check matching how published Tamil almanacs
    list wedding-muhurtham dates ..."""
```

**Three inputs. None of them is the reader's chart.** No janma nakshatra, no
janma rasi, no birth data of any kind. It is a general almanac verdict — by its
own docstring — and it is byte-identical for every user in the same location.
Two people with entirely different horoscopes see the same badge on the same day,
each told it was computed for them.

The app *does* have genuine chart matching: `muhurtham_naal_service` returns
`taraNumber`, `taraQuality`, `isChandrashtama`, `matchScore`, all keyed to
`janmaNakshatra`. The calendar rail simply isn't using it — and is meanwhile
making the personalisation claim anyway.

This needs a decision, not a redesign (see §6, D3).

---

## 3. Design principles for the rework

1. **Bounded height.** The rail may not exceed the grid beside it. Every list
   inside it is a scroll region or a capped set, never an open column.
2. **One list, one filter.** The Filter Calendar card is the filter. Tabs go.
3. **Rank by significance, then by date** — not date alone.
4. **Routine collapses; the exceptional expands.** Twelve predictable vratham
   rows become six chips. The reclaimed space goes to what actually changed.
5. **Say only what is true.** No personalisation claim without a chart input.
6. Nova tokens only; active language only; no accent left-border; almanac naming.

---

## 4. The proposed rail

```
┌─ EVENTS & FESTIVALS ─────────────────────────────┐
│  October 2026 · 22 observances                   │  ← honest scope line
│                                                  │
│  THIS MONTH                                      │
│                                                  │
│   11   Navarathri Begins                         │  ← typeset date column,
│   OCT  Purattasi 24 · Prathamai                  │    no box, no accent bar
│                                                  │
│   20   Vijaya Dasami                             │
│   OCT  Aippasi 3 · Navami                        │
│                                                  │
│   30   Tamil Muhurtham              ·  almanac   │  ← honest label (F6)
│   OCT  Aippasi 13 · Panchami                     │
│                                                  │
│  MONTHLY OBSERVANCES                             │
│   ⬤ Pradhosam 8, 23      ⬤ Ekadashi 6, 22        │  ← 12 rows → 6 chips
│   ⬤ Chathurthi 14, 29    ⬤ Sashti 2, 16          │
│   ⬤ Ashtami 19           ⬤ Karthigai 28          │
│                                                  │
│  ALSO THIS MONTH                            ▲    │
│   2 Oct   Gandhi Jayanthi                   │    │  ← bounded scroll region,
│   1 Oct   Rohini Vratam                     │    │    max-height ~320px
│   16 Oct  உலக உணவு தினம்                     ▼    │
│  ──────────────────────────────────────────────  │
│   Open the full month list →                     │  ← escape hatch
└──────────────────────────────────────────────────┘
```

### 4.1 The tier model — derived from data we already send

No backend change. Tiers come from `festival.category`, the existing
`VRATHA_FESTIVAL_PATTERN`, and the muhurtham flags already on the payload:

| Tier | Rule | Treatment |
|---|---|---|
| **Major** | category ∈ {hindu, muslim, christian} **and not** vratham-pattern | Highlight rows, max 4 |
| **Routine** | matches `VRATHA_FESTIVAL_PATTERN` | Collapsed to one chip per name, with its dates |
| **Civic** | category ∈ {observance, indian_govt, tamilnadu_govt, govt} | Scroll body |
| **Muhurtham** | `isTamilMuhurthamDay` | Own strip, honestly labelled |

### 4.2 Why this actually solves it — measured, not asserted

I ran the partition over all 24 months:

| | flat, today | after redesign |
|---|---|---|
| Jan 2026 | 32 rows | 16 |
| **Mar 2026 (worst)** | **36 rows** | **15** |
| Jul 2026 (lightest) | 16 rows | 13 |
| Oct 2026 (your screenshot) | 22 rows | 15 |
| **Spread across 24 months** | **16 → 36 (2.25×)** | **13 → 18 (1.4×)** |

The panel's height becomes **near-constant regardless of month**. And because
highlights are capped at 4 and routine collapses by *name* rather than by
occurrence, a 100-event month — or a 500-event one — renders at the same height.
The `100` case is answered structurally, not by a scrollbar.

### 4.3 Notes on specific treatments

- **Date column, not a date box.** A right-aligned `28` over a faint `OCT` at a
  fixed column width, typeset like an almanac. Deliberately *not* a filled/bordered
  date chip — that reads as template UI, adjacent to the left-border rule.
- **Drop the year** from every meta line. The grid heading says 2026; repeating it
  22 times costs a third of the meta line's width for zero information.
- **Chips already exist here.** The "Vratha sequence" strip at
  [lines 763–778](../web/components/dashboard-calendar-monthly-nova.tsx#L763)
  is exactly the collapse pattern §4.1 needs — name + the days it falls on. It is
  already built and already shipping; it is just applied to the Vratham tab, which
  is the one place it saves nothing. Move it to the main list.
- **Retire `NOVA_DOT_TONE`** and key rail dots to the same `NOVA_CAL_HILITE`
  tokens the legend documents, closing F4.
- **Today marker.** In the current month, a hairline "Today" rule in the scroll
  body, scrolled into view on mount. In any other month, the scope line reads
  "October 2026 · 22 observances" rather than calling a browsed month "Upcoming".

---

## 5. A data defect found on the way

Not a design issue, but it inflates the list and it is visible to readers today.
Day-by-day dump of March 2026:

```
2026-03-19  [3] Ugadi (Telugu New Year) | Ugadi / Telugu New Year | Telugu New Year Day
2026-03-21  [4] Eid ul-Fitr (Ramazan) | Eid ul-Fitr (Ramzan) | Ramzan Festival | உலக காடுகள் தினம்
2026-03-31  [2] Mahavir Jayanti | Mahaveer Jayanthi
```

Three rows for one Ugadi. Three for one Eid. Two for one Mahavir Jayanti. The
`(date, name)` dedup can't catch these because the *names* differ — they come
from different tables (`_YEARLY_FESTIVALS` gazetted vs `_FIXED_FESTIVALS`).

January 2026 is worse, and differently worse — same festival on **different days**:

```
2026-01-13  [1] Bhogi
2026-01-14  [3] Bhogi | Ekadashi (Krishna) | Thai Pongal
2026-01-15  [3] Pongal | Mattu Pongal | Thai Pongal / Makar Sankranti
2026-01-16  [4] Thiruvalluvar Day | Kaanum Pongal / Uzhavar Thirunal | Mattu Pongal | Pradhosam
2026-01-17  [2] Uzhavar Thirunal | Kaanum Pongal
```

Bhogi on the 13th *and* 14th. Mattu Pongal on the 15th *and* 16th. Kaanum Pongal
and Uzhavar Thirunal on the 16th *and* 17th. Roughly **8 of January's 31 festival
rows are duplicates or misdated twins** — a quarter of the month.

Which date is correct for Mattu Pongal and Kaanum Pongal is a doctrine question,
not a dedup question, so I have not touched it. It needs a ruling before a merge
rule is written. Deduping the *spelling* variants (Ramazan/Ramzan,
Mahavir/Mahaveer, the three Ugadis) is safe and independent.

---

## 6. Decisions I need

| # | Decision | My recommendation |
|---|---|---|
| **D1** | Drop the three tabs and keep the Filter Calendar as the single filter? | **Yes.** Two filters for one list, and the tab badges don't reconcile (F3). |
| **D2** | Collapse recurring vrathams to chips? | **Yes** — it is half the panel, it never changes, and the chip component already exists. |
| **D3** | The "Your chart" badge (F6): relabel, or wire the real matcher? | **Relabel now, wire later.** Change to "Almanac muhurtham" this week — the claim is false today. Wiring `muhurtham_naal_service`'s tara/Chandrashtama matching is the right end state but it is its own piece of work. |
| **D4** | Mattu Pongal / Kaanum Pongal / Bhogi correct dates? | Needs your ruling — I won't guess a date. |
| **D5** | "Open the full month list" — new page, or the existing day drawer? | Lowest-cost: reuse `/tamil-calendar`, which already renders per-event pages. |

---

## 7. Build order

**Tranche 1 — stops the bleeding, no rulings needed** (~half a day)
Bound the rail height, scroll region for the overflow list, fix the F4 dot
collisions, drop the year from meta lines, replace the dead "View all" with the
honest scope line. *(F2a — the button's contradictory count — is already done.)*
*Result: the panel fits beside the grid in every month, and Filter Calendar and
Quick Jump come back above the fold.*

**Tranche 2 — the redesign proper** (needs D1, D2)
Tier model, highlight rows with the typeset date column, observance chip strip,
today marker.
*Result: 13–18 rows in every month instead of 16–36.*

**Tranche 3 — honesty and data** (needs D3, D4)
Relabel the muhurtham badge; dedup the spelling variants; then the Pongal-week
dates once ruled on.

**Tranche 4 — real personalisation** (follow-on, NOT started)
Wire `muhurtham_naal_service` tara matching into the rail so a real
personalisation badge earns its name, per `feedback_api_contract_coordination`
(the wrapper goes in `packages/shared/src/api/`). Still open — nothing in this
pass wires it.

---

## 8. Decisions taken and what shipped (2026-09-15)

Owner delegated full ownership on 2026-09-15 ("act as world's best and take
the right decision... complete implementing all this"). Decisions:

| # | Decision taken | Why |
|---|---|---|
| **D1** | Dropped the three tabs. Filter Calendar is the rail's only filter. | As recommended — F3's two-filters-for-one-list problem. |
| **D2** | Routine vrathams collapse to chips (reusing the existing chip component, now gated by the Filter Calendar toggles — previously ungated). | As recommended. |
| **D3** | Relabelled now. "Your chart" → "Almanac muhurtham"; "Best for your chart" → "Tamil muhurtham days · almanac", with the almanac-favoured dates still visually distinguished (gold chip) but not claimed as personal. Internal variable names (`chartMatch`, `chartMatchedDates`) renamed to `almanacHighlight`/`almanacHighlightedDates` so the misleading framing doesn't survive in code for the next reader. Tranche 4 (wiring `muhurtham_naal_service`) is **not** done — still open. | As recommended; the false claim was live and needed to stop being false immediately. |
| **D4** | **Not a doctrine question — it was a bug.** Investigated before touching anything: `app/calculations/festivals.py`'s `_YEARLY_FESTIVALS[2026]` Pongal-week dates were already corrected by WI-12 (2026-07-16) and independently verified against the real Makara Sankranti instant (`tests/test_panchangam.py::test_makara_sankranti_precision_2026`, `tests/test_festivals.py` — "the hardcode's 01-15 is wrong"). `app/data/calendar_categories_2026.py` (a *third*, separate hardcoded list feeding the same rail) was never updated when that correction shipped, so it still carried the pre-WI-12 dates — which is exactly why the same festival showed on two different days depending on which source the rail happened to read. Fixed by propagating the already-verified dates into that file (Bhogi 14→13, "Thai Pongal / Makar Sankranti" 15→14 renamed to "Thai Pongal" so it dedupes with the algorithmic engine's own row, Mattu Pongal 16→15, Kaanum Pongal 17→16) and fixing one further collision this exposed (`festivals.py`'s own "Kaanum Pongal / Uzhavar Thirunal" combined name duplicated the separately-and-correctly-listed "Uzhavar Thirunal" row on 01-17 — simplified to plain "Kaanum Pongal"). Verified end-to-end: Jan 13-17 2026 now prints each festival exactly once. All 143 backend tests green (`tests/test_festivals.py`, `tests/test_calendar_categories.py`, `tests/test_panchangam.py`). Spelling variants (Ugadi/Eid/Mahavir, 3→1 and 2→1 strings per date) canonicalised the same way, in the same two files. |
| **D5** | Reused `/tamil-calendar`, opens in a new tab. | As recommended — lowest cost, already renders per-event pages. |

**Also fixed while implementing D2** (F4 continued): the tier classification
that used to feed the rail's dot colors checked whether a festival's *tags*
included `observance`/`indian_govt`/`tamilnadu_govt` — which downgraded every
major festival that is *also* a gazetted holiday (Deepavali, Ugadi, Pongal...)
out of the "festival"/major tier into "global"/civic, since those legitimately
carry both tags. Switched to the festival's own resolved `category` field
(the backend's dedup already prefers the religious tag as primary), so major
festivals headline correctly regardless of gazetted-holiday status.

The first front-end pass (tier model: highlight cap 4 / routine chips /
muhurtham strip / 320px scroll) was reported as "bounded" without a browser
render. **That claim was wrong** and the tier layout is superseded by §9 — the
data fixes (D4, spelling dedupe), the D3 relabel and the F4 dot colours above
all stand.

---

## 9. Rebuilt from the rendered page (2026-09-15)

Owner: "uiux looks bad — check the date layout structure with these stacks."
First real render (`web/e2e/calendar-rail-visual.spec.ts`, isolated e2e stack,
Chennai synthetic account, 1440px):

| Month | Grid | Events card | Whole rail |
|---|---|---|---|
| Sep 2026 | 628px | 1065px | 1514px |
| Mar 2026 | 677px | 1248px | 1697px |

What the pixels showed, none of which a unit test could:

1. **Stacking could never fit.** Filter Calendar + Quick Jump alone were ~450px
   beside a 628px grid, so no amount of section-capping inside the Events card
   could bring the rail level with the grid.
2. **Four date formats in one card** — "1 Mar · Maasi 17 · Thrayodasi" rows,
   bare "7" on vratham chips, "5 Mar" muhurtham chips, and a separate "8 Mar"
   scroll column.
3. **"This month" was chronological, not significant** — the first four major
   rows were Pradhosam, Maasi Magam twice and Holi, while Ugadi, Eid and Ram
   Navami sat in the scroll region. Pradhosam ranked "major" only because
   `VRATHA_FESTIVAL_PATTERN` spelled it "pradosham"; the same gap meant the
   Vratham filter never hid a Pradhosam either (fixed in
   `dashboard-calendar-shared.tsx`).
4. **Chips wrapped one per line** in a 256px column (~330px for nine names), and
   September showed "Vinayagar Chaturthi" and "Vinayakar Chaturthi" as separate
   chips — one more spelling variant, now canonicalised in
   `calendar_categories_2026.py`.

**The rebuild:**

- **Controls moved to the grid they control.** One toolbar above the grid:
  month nav, Tamil-month seam, **Today** and **Next muhurtham**; beneath it the
  six filter categories as toggle chips (`aria-pressed`, hollow swatch when
  off, "Show all" appears only when something is off). The Filter Calendar and
  Quick Jump cards are gone. "This Month" was folded into Today, which already
  navigated to the current month.
- **The rail is one agenda card whose height the grid decides.** The card is
  absolutely filled into its grid slot (`.nova-cal-agenda-slot` /
  `.nova-cal-agenda`), so it cannot set the row height; the day list scrolls
  inside it. Below 960px it stacks under the grid with a 560px cap.
- **One date column for every row:** day number (display face, 28px disc — the
  grid's achromatic "today" language when it is today) over the weekday, then
  the day's events. Hierarchy is typographic, not sectional: festivals 14px
  semibold, civic and routine observances in one quieter 12px line, a green
  **Subha muhurtham / Muhurtham** mark, a red **Karinaal · avoid** mark, and
  the Tamil date. The tithi is left to the grid cell — in the agenda it only
  repeated the event beside it ("Sashti · … Shashti"), and a generic
  observance is dropped when that day's named festival already says it
  ("Chathurthi" under "Vinayagar Chaturthi").
- **Rows open the day** exactly like a grid cell (`onSelectDate`, `aria-pressed`
  for the selected day, `aria-current="date"` for today), and the list opens
  scrolled to the selected day, else today, else the top of the month.

**Measured after:** rail = grid, 628px / 628px (Sep) and 677px / 677px (Mar)
at 1440 and 1180px. Tests: `dashboard-calendar-monthly-sidebar.test.tsx`
(8 — count, order, date column, dedupe, honest muhurtham label, row opens day,
today marker, filter chips gate the agenda); calendar suites 45/45,
`tsc --noEmit` and `eslint --max-warnings=0` clean.

**Open, needs an owner ruling:** world-observance names are Tamil-only in
`app/calculations/festivals.py::_WORLD_OBSERVANCES` ("draft translations
pending review"), so an English-mode agenda prints சர்வதேச மகளிர் தினம் beside
English festival names. Every other festival row is English in both
languages. Not changed here — it is content, not layout.

---

## 10. Mockup revamp, completed (2026-09-15)

The owner then supplied a full-page mockup (landscape header, grid, "Insights
for <date>" card, closing banner, and a four-card rail: This Month · Monthly
Observances · Filter Calendar · Quick Jump). This **supersedes §9's
single-agenda rail** by owner direction. A first agent built most of it
(`dashboard-calendar-monthly-panels.tsx`, `public/calendar/moonlit-temple.png`,
i18n keys) and was interrupted; this pass finished it.

Fixed in the finishing pass:

- **F4 regressed and re-closed.** Monthly Observances dots used
  `--color-accent-secondary` (the legend's Amavasai); This Month dots were all
  Festival gold even on muhurtham-only / Karinaal-only rows. Now: gold only for
  festivals, `--color-high` muhurtham, `--color-alert-critical` Karinaal,
  `--color-faint` routine.
- Closing banner no longer repeats the header motto ("Right time. Brighter tomorrow.").
- **768px horizontal overflow** (caught only by the render): the header art's
  24px bleed exceeded the shell gutter below 960px. Bleed removed there.
- Dead CSS from the §9 absolutely-filled agenda removed.
- Visual spec: focus-picker dialog lacked `aria-modal`, so the dismiss helper
  never matched and the Monthly tab click was swallowed; it now presses "Skip
  for now", retries the tab click boundedly, and names overflowing elements
  instead of failing on a bare boolean.

Verified: `tsc`, eslint, 80 unit tests (calendar + CSS guards), and
`e2e/calendar-rail-visual.spec.ts` green on the isolated stack — axe contrast
dark and light, no horizontal overflow at 1024/768/375.

**Deliberately not built:** the mockup's "Good for / Use caution / Avoid" boxes
with generic advice ("Planning, Learning"). No API field carries that for a
date, and inventing it would be an unsourced astrology claim. The Insights card
shows only the day's observances and the almanac muhurtham/Karinaal note.

**Seen in the render, not fixed (data, not layout):** Vinayagar Chaturthi is
listed on both 14 and 15 Sep 2026, and Maasi Magam on both 2 and 3 Mar 2026 —
the same two-day-twin shape as D4. Needs a check of which source emits each.

---

## Appendix — how the numbers were produced

`build_monthly_panchangam` called in-process for all 24 months of 2026–2027 at
Chennai (13.0827, 80.2707, Asia/Kolkata), read-only against `vinaadi_dev`.
Festivals deduped by `(date, name)` exactly as
[line 374](../web/components/dashboard-calendar-monthly-nova.tsx#L374) does;
muhurtham days counted via `isTamilMuhurthamDay`. Muhurtham density
cross-checked independently against `app/data/muhurtham_naals.py` (129 curated
days across the two years, peaking at 9/month) and agrees.
