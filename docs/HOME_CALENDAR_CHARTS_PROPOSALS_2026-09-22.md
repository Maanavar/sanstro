# Home, Calendar and Charts proposals: research and plan

**Date:** 2026-09-22 · **Status:** owner rulings recorded (R1–R6, below); §7 fixed, not committed; the rest not built · **Asked by:** owner

Seven owner questions, each read through four lenses: Tamil Thirukanitham
astrologer (**Astro**), full-stack developer (**Dev**), product owner and
designer (**PO/UX**), and software architect (**Arch**). Every "today" claim
below was checked against the code on `harden/production-readiness` on this
date. File references are to that tree.

---

## Summary

| # | Question | What the code does today | Recommendation | Size | Priority |
|---|---|---|---|---|---|
| 7 | Mesha always highlighted | **Bug, reproduced.** Chart keeps the *previous* chart's selected cell | Reset selection per chart; stop painting selection when there is no explain panel; mark lagna the traditional way | S | **P0** |
| 1 | Notify during Rahu / Yama / bad horai | Hero shows live state for **Rahu Kalam only**; Yamagandam and Kuligai never go live in the hero | Live "now" line for every avoid period; opt-in reminders on mobile only | S–M | **P1** |
| 2 | Re-ask location every 45 days | Current location exists and is used, but it is never re-asked or checked | Prompt when the device timezone disagrees, with a long backstop; share the life-focus strip slot | M | **P1** |
| 3 | Is detailed muhurta search personalised like marriage dates? | Yes, it is chart-personalised and has the same month, Tamil-month and paksha controls. The two lists never mention each other. | Badge almanac wedding days inside detailed results | S | P2 |
| 4 | Muhurta result → monthly-calendar-style day view | Results open a thin modal; the monthly drawer is richer | Reuse `DayDetailDrawerNova` and add a "For your activity" section; add a List/Calendar toggle | M | P2 |
| 6 | D9 planet positions | D1 only; D9 sign appears only inside each planet's drawer | D1/D9 switch on the same section, with D9 dignity and vargottama | M | P2 |
| 5 | Replace "chart in two minutes" with today's personal palan | Reading already collapses after first read (shipped 2026-09-07); hero already has a personal daily briefing | Per-area **இன்றைய பலன்** card for self and family, built on the same daily engine | L | P3 |

Suggested order: fix 7 → build 1 → build 2 → 3 and 4 together → 6 → 5.
Item 5 is last because it needs new astrologer-reviewed Tamil content, not
because it matters less.

---

## 7. Why Mesha stays highlighted in the chart (bug)

**Root cause (reproduced with a render probe):** `RasiChart` and
`NavamsaChart` in `web/components/dashboard-charts.tsx` keep the selected cell
in `useState`, seeded **once** from `chart.lagna.rasi`:

```ts
const [ownRasi, setOwnRasi] = useState<number>(chart.lagna.rasi);
```

When the `chart` prop changes, as it does when you switch between family
members on Family & Charts, the state is not re-seeded. The previous chart's
lagna cell stays "selected" and is painted with `--chart-cell-selected`. The
probe rendered a Mesha-lagna chart and then re-rendered with a Simmam-lagna
chart. Result:

```
Mesham   pressed=true   bg=var(--chart-cell-selected)   ← stale, not lagna
Simmam   pressed=false  bg=var(--chart-d1-lagna-bg)     ← real lagna
```

So if the first chart on screen (usually your own) has a **Mesha lagna**,
Mesha stays lit on every member you open afterwards. *Please confirm your own
chart is Mesha lagna.* That would explain "always Mesha". If it is not, the
same mechanism still applies to whichever chart loaded first.

Two design problems make it worse:

- On Family & Charts both grids are rendered with `showExplain={false}`, so a
  "selected" cell has **no purpose there**: there is no explain panel for it
  to drive. It is only a second highlight.
- In Nova, "selected" (`--color-surface-soft`) and "lagna"
  (`--color-mid-bg`) are close in tone, so a stale selection reads as a
  second lagna.

**Astro:** you are right. The lagna is the one cell that must stand out,
because every house is counted from it. Tamil convention marks it with a
**diagonal stroke across the cell's corner plus "ல"**, not with a background
tint alone.

**Plan**
1. Re-seed the selection whenever the chart identity changes (key the grid by
   `chartId`, or reset `ownRasi` when `chart.lagna.rasi` changes). Same for
   the D9 grid, whose lagna is `computeD9LagnaRasi(...)`.
2. When `showExplain` is false and no controlled `selectedRasi` is passed,
   don't paint a selection at all.
3. Lagna marker: add the traditional corner diagonal and "ல" / "La" to the
   existing tint, so it no longer depends on colour alone (also an
   accessibility gain).
4. Regression test: render chart A, re-render with chart B, and assert that
   only B's lagna cell is highlighted. (The probe above is that test, minus
   the assertion.)

---

## 1. Tell the user when they are inside an avoid period right now

**What exists**

- The Today **ribbon** draws Rahu Kalam, Yamagandam, Kuligai and Nalla Neram
  on a timeline with a NOW marker, and shows the current and next Horai
  (`dashboard-today-ribbon-nova.tsx`).
- The **hero's avoid card** has live state ("running now · ends in 22 min" /
  "starts in…"), **but it only ever reads `cautionWindows[0]`**
  (`dashboard-today-tab-nova.tsx` ~L658). `_caution_windows()` in
  `app/services/_dg_hora.py` always puts Rahu Kalam first. So when you are
  inside **Yamagandam or Kuligai, the hero says nothing.** After Rahu Kalam
  ends, the card hides.
- The engine already knows about bad horai and bad Gowri kalas: `bestWindowConflicts` with
  kinds `MALEFIC_HORA` and `BAD_KALA` (Rogam / Soram / Visham). It uses them
  only to keep bad windows from being recommended. It never uses them to say "now is a bad time".
- Push: an hourly server cron with a "smart silence" cap of one push per day.
  It cannot fire at 10:30 or 13:30 to the minute.

**Astro**

- **Daytime-only kalams.** Rahu Kalam, Yamagandam and Kuligai are each one
  eighth of the daytime, fixed by weekday. Together they cover about 4½ hours,
  roughly 37% of daylight, every day. Calling each one an alarm would make
  the app a source of fear, and the tone rules forbid that.
- **Kuligai is not the same kind of "avoid".** In common Tamil practice what
  you do in Kuligai tends to *repeat*. That makes it good for buying gold or
  paying off a debt, and bad for anything you would not want repeated. The
  app currently treats it as a plain avoid (owner ruling 2026-08-23). A live
  line should use different wording for it. This is a **lineage choice for
  the astrologer**, not a code decision.
- **Bad horai is personal and depends on the activity.** Saturn and Mars
  horai are cautioned in general. For a given native, the horai of the 6th,
  8th and 12th lords matter more. The engine's
  `_MALEFIC_HORA_LORDS = {SATURN, MARS, RAHU, KETU}` includes Rahu and Ketu,
  which have **no horai** in the seven-graha hora cycle. That is harmless
  (they never match) but worth tidying so the list states the doctrine
  truthfully.
- **Durmuhurtham** is computed in `app/calculations/panchangam.py` but not
  sent in the daily panchangam response. It belongs in the same avoid-set
  eventually.

**PO/UX**

- Put **one live line** in the hero, not a banner stack: *"Now: Yamagandam
  until 1:30 pm · avoid new starts"*. In Tamil use the period word, per the
  clock rule: *"இப்போது: எமகண்டம் · மதியம் 1:30 வரை"*. When two periods
  overlap, show only the stronger one (Rahu > Yama > Kuligai).
- When nothing bad is running, the same slot shows the next clean window. The
  hero already knows it (`pickRecommendedWindow`).
- Hora: show "Saturn horai now" only when the user is about to act, which
  means inside the activity board ("Is today okay for…"), not on the hero.
- **Notifications:** no automatic push for every kalam. Offer an **opt-in
  "remind me 10 min before Rahu Kalam"** on mobile only, using local
  scheduled notifications. They are exact, work offline and add no server
  load. Web push is not worth it for this.

**Arch**

- Make the hero pick the **currently-running** avoid period out of
  *all* `cautionWindows` (and later `BAD_KALA`), not `[0]`. The `spanPhase()`
  function already exists; this changes selection only, not data.
- The ribbon and the hero must resolve "now" from the same function, so they
  never disagree on screen.
- Mobile local reminders read the same `cautionWindows` from the bundle. The
  schedule is rebuilt each morning and on location change (see §2).

**Plan:** (a) hero live line across all three kalams: S, web first, mobile
pulse second. (b) Astrologer ruling on Kuligai wording. (c) Opt-in mobile
reminders: M, after (a). (d) Expose durmuhurtham in the panchangam response:
S backend, plus the four-surface contract update.

---

## 2. Re-ask the user's location every 45 days

**What exists:** the birth profile already has `current_place / latitude /
longitude / timezone` and `current_location_updated_at`.
`location_service.resolve_effective_daily_location()` and the dashboard
bundle use the current location when it is complete, and the birth location
otherwise. **Nothing ever reads `current_location_updated_at`**, and nothing
checks whether the user has moved. It is only set in Edit profile.

**Astro:** everything in the daily panchangam that is tied to sunrise moves
with place: Rahu, Yama and Kuligai, the Gowri grid, horai, Nalla Neram, the
tithi and nakshatra "at sunrise", and the Tamil date's sunset rule. Chennai
to Coimbatore is about 20 minutes. Abroad the whole table is wrong, including
the timezone. The personal parts (Tara bala, Chandrashtama) barely move with
place. So the risk is exactly the timings the user acts on.

**PO/UX:** moving is an event, not a cycle. A fixed 45-day question is noise
for the large majority who never move, and it is too late for someone who
flew out yesterday. Better:

1. **Mismatch prompt (main path).** Compare the device timezone (web
   `Intl.DateTimeFormat().resolvedOptions().timeZone`, and the mobile
   equivalent) with the profile's effective timezone. If they differ, show at
   once: *"Your phone is on Singapore time. Show today's timings for
   Singapore?"* with **[Use Singapore] [Keep Chennai]**. City-level only,
   never GPS precision, and no location history is stored.
2. **Backstop (your 45 days).** If the location was never confirmed, or was
   last confirmed more than N days ago, show the same one-line strip used by
   life focus. **Ruled N = 45** (R2). It is one server constant.
3. **One check-in slot.** The life-focus strip (60 days) and the location
   strip must never stack. Queue them: at most one check-in strip per visit.
4. Always **say which place the timings are for** ("Timings for Chennai") on
   the hero and ribbon, so a wrong location is visible without a prompt.
5. Family: each member keeps their own current location (a son in the US
   gets US timings). The mismatch prompt applies only to the signed-in user's
   own profile.

**Arch**

- Add `locationConfirmedAt` (or reuse `current_location_updated_at`, and
  stamp it on "Keep" too) and a server-computed `locationCheckDue`, the same
  pattern as `LIFE_MODE_STALE_DAYS` in `app/core/life_mode.py`, so web and
  mobile share one cadence.
- `dashboard_bundle_service.py` (~L79) **re-implements** the
  current-vs-birth choice instead of calling
  `resolve_effective_daily_location()`. Fold it into the one resolver before
  adding anything, otherwise the two will drift.
- Return `effectiveLocation.source` (`current` or `birth`) plus the place
  name in the bundle so the UI can show "Timings for …". Route and response
  changes touch all four surfaces (`app/api`, `packages/shared`, `mobile`,
  `web`). Add a shared wrapper for any new endpoint.
- A location change must invalidate cached day data for that profile. Check
  the panchangam and daily-guidance cache keys include the coordinates, not
  just the profile id.

---

## 3. Is the detailed muhurta search personalised like the marriage dates?

**Yes. They are two different sources behind the same controls.**

| | Published marriage dates | Detailed muhurta search |
|---|---|---|
| Source | Printed almanac wedding days (`muhurtham_naal_service`) | Computed by the engine for any activity (`/charts/{id}/muhurta`) |
| Personalised by | Your birth star: Tara bala + Chandrashtama; both stars in couple mode | Your full chart: Tara/Chandra bala, dasha support, activity rules; couple mode for marriage |
| Filters | English month, Tamil month, Valarpirai/Theipirai | English month, Tamil month, date range, paksha, activity location |

**The gap:** the two lists never mention each other. A marriage date in the
detailed search does not say "this is also a published almanac muhurtham
day", which is the first thing a Tamil family asks. Published dates already
have "Check in detail", which sends the date to the detailed search.

**Astro:** for a wedding, most families will not accept a date that is not in
the almanac, however good its computed score. Being on the almanac list is a
gate, not a bonus point.

**Plan:** add an "Almanac muhurtham day" badge on detailed-search results for
MARRIAGE. This is a lookup against the same muhurtham-naal data, done on the
server so the rule lives in one place. Consider an "almanac days only" filter
for marriage. Separately, the **quick scan** (`/activity-timing`) and the
**detailed search** are different engines with different scores. Check a
sample month for dates they rank in opposite directions before promoting both
on the same screen. The saved rule "Layered scoring double-counts" applies.

---

## 4. Muhurta results: use the monthly calendar's day view

**What exists:** results are a vertical list of `NovaMuhurtaCard`s. The date
link opens `MuhurtaPanchangamOverlay`, a modal with the four limbs, Nalla
Neram and the three kalams. The monthly calendar's `DayDetailDrawerNova`
(exported from `dashboard-calendar-tab-nova.tsx`) is far richer: day
identity, Subha Muhurtham / Karinaal markings, sunrise/noon/sunset, good and
avoid windows, full limbs, Chandrashtama, festivals, previous/next day, and a
link to the full day. It takes `data/loading/error` as props, so the caller
does the fetch and it can be reused as is.

**PO/UX: you are right; one day view, not two.**

1. **Replace the modal with the monthly drawer**, plus a new top section
   **"For your activity"**: the slot's score, its time windows, the reasons
   for and against, the couple verdict, and the almanac badge from §3. The
   rest of the drawer is the day's panchangam exactly as on the calendar, so
   a user learns one layout.
2. **Previous/next in this context steps through the search results**, not
   calendar days ("3 of 11"). Decision needed; see questions below.
3. **List | Calendar toggle** on results. The calendar view is the month
   grid with result days marked, using the same mechanism as the life-focus
   "focus days" overlay that is already on the monthly grid. For a Tamil
   family choosing between dates, seeing them in a month is how an almanac
   is read.
4. Keep the list as the default on phones.

**Arch**

- Fetch panchangam at the **activity location** (`result.activityLocation`),
  not the chart's location. The current overlay gets this right and the
  drawer caller must keep it.
- Reuse `DayDetailDrawerNova` by adding an optional `lead` slot prop. Do not
  fork it.
- `MuhurtaPanchangamOverlay` has two callers (quick scan and detailed
  search). Once both move to the drawer it becomes unused. **Removing it is
  the last step and needs your per-file approval.**
- The panchangam fetch here is a direct `apiFetchJson`. That is grandfathered,
  but new code should go through the shared wrapper if one exists for
  `/panchangam/daily`.

---

## 5. Home: replace "Your chart in two minutes" with today's personal palan

**What exists (2026-09-07, `298297c`):** on Today the reading already
**collapses to one line once read**, and re-expands only when the bhukti
changes. It stays in full on Family & Charts. The hero already carries a
**personal daily briefing** (`daily_briefing_synth`, flag **on**; the module
docstring saying "OFF by default" is stale). Today also has life-area tiles
(a standing outlook, not daily) and a Family Today row.

So the duplicate text is already mostly gone. What is missing is what you
describe: the **TV-style daily palan, area by area, but from the person's own
chart**, for them and for family.

**Astro: what makes it genuinely personal, compared with TV**

TV rasipalan has 12 buckets: the Moon's transit house from janma rasi
(Chandra gochara). Ours can add:

- **Tara bala** from janma nakshatra, which changes daily: 27 stars × 9 taras.
- **Chandrashtama** (already computed; must lead when present).
- **The running dasa/bhukti lord's transit** and its relation to the day.
- The day lord's relation to the lagna lord.

Be honest about cadence. The Moon-transit part stays the same for about 2¼
days, and Tara changes daily. Health lines must never read as medical advice.
The palan must follow the **same verdict as the hero**: one engine, one
label. Otherwise the card and the hero contradict each other (saved rule "Two
axes on one card read as a contradiction").

**PO/UX: the card**

- Title **"இன்றைய பலன் · உங்கள் ஜாதகப்படி"** / "Today, from your chart".
- One line each for about 5 areas: work, money, family and relationships,
  health, travel and communication. Then one **pariharam** line.
- Member chips (Me · Amma · Son…) using the family aggregate already loaded
  for Family Today. A family member's chart uses neutral order, per life-focus
  ruling Q2.
- The two-minute reading shrinks to a single link row under it ("Your chart
  in two minutes →"), keeping its bhukti-change notice.
- Lucky colour and number are a TV staple. The public rasipalan already
  returns them. Whether a chart-based product should show them is a lineage
  and brand call; see the questions below.

**Arch**

- Build it as an **additive field on daily guidance** (for example
  `areaPalan`) computed from pieces the engine already has. No second score,
  no new endpoint unless needed, and the bundle carries it. Family members get
  it through the existing family aggregate.
- **The cost is content, not code.** The area × Moon-house (× tara) phrasing
  table needs astrologer sign-off and native Tamil review before it ships.
  Use the same process as the briefing glue copy (reviewed 2026-07-14).
- Mobile has a `RasiPalanCard` today. Decide per surface, following
  life-focus Q11.

---

## 6. D9 planet positions

**What exists:** the Planet positions section (`HyPlanetOrbs`,
`dashboard-family-charts-hybrid.tsx` §5) lists D1 only. Each planet's drawer
shows its D9 sign (`col_d9_rasi`). Every planet already carries `d9Rasi` and
`isVargottama`, and the backend already computes D9 dignity
(`d9_dignity_tier` in `app/calculations/chart_strength.py`).

**Astro: what a D9 table must show, and what it must not**

- Per graha: **navamsa sign, house from the D9 lagna, D9 dignity**
  (exalted / own / friendly / enemy / debilitated), **vargottama**. The most
  useful line is the D1→D9 comparison: *"Debilitated in rasi, own sign in
  navamsa: strength recovers"*. That is why people open the D9.
- **No D9 degrees.** Tamil practice does not read them.
- **Birth-time sensitivity.** The D9 lagna changes about every 13 minutes of
  birth time, and the Moon's navamsa about every 6 hours. When birth time is
  approximate, the D9 **houses** must carry a caveat. Planets' D9 signs are
  robust.
- Pushkara navamsa is a natural later addition. It is not computed today.

**PO/UX:** a **D1 | D9 switch** on the same section, not a second full
section. The orbs and rows stay the same and only the facts change. On phones
it stays one list.

**Arch:** the D9 lagna is computed **on the client**
(`computeD9LagnaRasi` in `web/lib/chart-utils.ts`), while planets' D9 comes
from the backend. That is two sources for one chart. Have the backend send
`lagna.d9Rasi` and the per-planet D9 dignity, and use those. Response shape
changes touch all four surfaces.

---

## Owner rulings (2026-09-22)

| # | Question | Ruling |
|---|---|---|
| R1 | Mobile reminders (§1) | **Yes.** Opt-in, mobile local notifications, as proposed. |
| R2 | Location backstop (§2) | **45 days.** The timezone-mismatch prompt stays the main trigger; 45 days is the backstop constant. |
| R3 | Muhurta drawer previous/next (§4) | **Step through the search results**, not calendar days. |
| R4 | Chart (§7) | **Confirmed.** The owner's chart and a family member's chart are both Mesha lagna, so Mesha is the first chart the grid sees. That matches the diagnosis. |
| R5 | Kuligai (§1) | **Kuligai is good for things you want to happen again**: buying gold, signing or registering property, anything everyone wishes to repeat. **Not for marriage. Not for surgery or operations.** |
| R6 | Personal palan (§5) | The section structure below. |

### R5: what the Kuligai ruling changes

- **Live line (§1).** Kuligai is no longer phrased as a plain "avoid". Tamil
  copy should read like *"இப்போது குளிகை · மதியம் 1:30 வரை · தங்கம் வாங்குதல்,
  சொத்துப் பதிவு போன்றவை செய்யலாம்; திருமணம், அறுவை சிகிச்சை வேண்டாம்"*.
  English: *"Now: Kuligai until 1:30 pm · good for what you'd want again (gold,
  property); not for a wedding or surgery"*. It is never shown in the "avoid"
  tone. Rahu Kalam and Yamagandam keep the avoid tone.
- **Doctrine conflict to resolve in code.** The owner ruling of 2026-08-23
  (`web/lib/today-windows.ts`) says a window overlapping Rahu Kalam,
  Yamagandam **or Kuligai** is never promoted. Under R5 that holds only for
  activities that must not repeat. The avoid-set becomes **activity-dependent**:
  - Kuligai **allowed**: gold/jewellery purchase, property purchase or
    registration, and similar acquisitions.
  - Kuligai **blocked**: marriage, surgery or medical procedures.
  - Everything else: keep the current behaviour until the astrologer lists
    more.

  This touches the hero's recommended window, the activity board, and the
  muhurta engine (`app/services/muhurta_service.py`). **Audit how each of
  them treats Kuligai before changing any.** One activity → kuligai-policy
  table should live in one place, on the backend
  (see the saved rule "pure function recomputed per consumer").
- Mobile reminders (R1) remind only for Rahu Kalam and Yamagandam by default.
  Kuligai gets no reminder.

### R6: personal palan structure (இன்றைய பலன்)

The owner's section list, in reading order:

1. **நாளின் மொத்த பலன்**: favourable, mixed or caution; how mood, effort and
   decisions will go.
2. **வேலை / தொழில்**: superior, colleagues, workload, new responsibility;
   for business, customers, orders and negotiation.
3. **பணம்**: income, spending, unexpected expense, recovering a loan, care
   with investment or a big purchase.
4. **குடும்பம்**: spouse, parents, children, relatives, home atmosphere.
5. **காதல் / திருமணம்**: communication in a relationship, marriage talks,
   friction or closeness with a partner.
6. **ஆரோக்கியம்**: **general caution only**: sleep, tiredness, digestion,
   headache, stress. Never phrased like a diagnosis.
7. **மாணவர்கள் / கல்வி**: focus, memory, exams, applications, higher
   studies.
8. **பயணம் / வாகனம்**: whether travel is favourable or delayed; care
   while driving.
9. **அரசு / ஆவணங்கள் / சட்டம்**: applications, approvals, registration,
   documentation.
10. **நண்பர்கள் / சமூகம்**: who to be careful with, and where help may
    come from.
11. **சந்திர நிலை சார்ந்த மனபலன்**: calm, haste, anger, confusion,
    confidence (the Moon's mental reading).
12. **இன்றைய சிறப்பு அறிவுரை**: one actionable line ("பேச்சில் நிதானம்",
    "பண விஷயத்தில் அவசரம் வேண்டாம்", "மதியத்திற்குப் பிறகு சாதகமான
    முன்னேற்றம்").
13. **அதிர்ஷ்ட அம்சங்கள்**: colour, number, direction. **Still open (P1
    below).**
14. **வழிபாடு / பரிகாரம்**: very light: a deity, a sloka, charity,
    gratitude. **No frightening remedies.**
15. **நாளின் முடிவு வரி**: a one-line takeaway ("முயற்சி வெற்றி தரும் நாள்").

**Delivery register:** the TV rasipalan voice the owner gave for Mesham, for
example *"மேஷ ராசி நேயர்களே, இன்று உங்கள் முயற்சிகளில் வேகம் இருக்கும்… இன்று
உங்கள் பலம்: தன்னம்பிக்கை; கவனிக்க வேண்டியது: அவசர முடிவுகள்."* Ours is
addressed to the person, not the rasi, because it is read from their own
chart.

**Screen tabs/chips (owner list):** Overall · Career · Business · Money ·
Family · Love · Health · Education · Travel · Communication · Caution ·
Opportunity · Best part of day · Simple guidance.

Design notes for the build:

- Fifteen sections is a long read for a daily home surface. On Today, show
  **Overall + 3 areas chosen by the user's life focus + advice + closing
  line**, with every other area one tap away in the chip row. The full palan
  opens in place. This follows the "new content earns the space" rule.
- **Best part of day** comes from the same recommended window the hero
  already computes (`pickRecommendedWindow`). It is not a second calculation.
- **Caution / Opportunity** must follow the hero's verdict: one engine, one
  label.
- Health lines pass a copy check for medical wording before shipping.
- Content cost: about 12 areas × Moon-house or tara states × ta/en. It needs
  astrologer sign-off and native Tamil review before it ships.

### Still open

- **P1: lucky colour, number and direction.** Classical and rule-based (for
  example from the day lord, the janma nakshatra lord, or dasa lord colours),
  or TV-style light content? *Recommendation: classical, rule-based, with
  the rule shown on tap. A chart-based product loses trust if one line is
  arbitrary.*
- **P2: the Kuligai activity list** beyond gold, property, marriage and
  surgery. For the astrologer.

## Progress

- **§7 fixed (2026-09-22), not committed.** `web/components/dashboard-charts.tsx`:
  - selection is scoped to the chart's identity (`useCellSelection`), so a
    new chart starts from its own lagna;
  - no selection is painted where the grid has no explain panel
    (`aria-pressed` omitted there);
  - the lagna box gets a corner stroke (`LagnaCornerMark`), top-right so it
    never crosses the rasi name.

  Gate: 4 new tests in `dashboard-charts.test.tsx`. All 4 **fail with the fix
  removed** and pass with it. tsc, eslint and the colour-literal ratchet are
  green.

  **Blind spot:** jsdom does not paint, so the tests prove the state and
  markup, not how the stroke *looks* in the Nova light and dark themes, at
  375 px, or in Tamil. That needs a browser look before this is called done.

## Rules this plan must respect

- Render keys through the localisers, never `rasiName` / `lord` strings
  (CLAUDE.md display boundary), including in `title=` and `aria-label=`.
- Tamil clock uses period words (மதியம் 1:30); no "pm", no em-dash in Tamil copy.
- Route, param and field changes are updated across all four surfaces in the
  same change. New endpoints get a shared wrapper.
- Each new gate is run once with the fix removed and must fail; record its
  blind spot beside the PASS.
- Tamil-mode checks are mandatory for every new surface.
- No deletions without per-file approval, and deletions come last.
