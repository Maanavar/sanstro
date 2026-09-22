# Home, Calendar and Charts proposals: research and plan

**Date:** 2026-09-22 · **Status:** owner rulings recorded (R1–R6, below); §7 fixed in `7347030`; §1 web + mobile slices committed in `8f60d0f`, device/browser sign-off still open; the rest not built · **Asked by:** owner

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
| R7 | Kuligai is **conditional**, not polar (2026-09-22) | Resolve polarity from the activity. With no activity supplied: neither a hard blocker nor a generic "best time". Details below. |

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

### R7: Kuligai is conditional, and the activity resolves it

Owner ruling, 2026-09-22, given on the audit above. It refines R5 rather than
replacing it: R5's gold/property/marriage/surgery examples stand, and this
states the principle they are examples of.

> The key traditional idea is that work begun in Kuligai tends toward
> **repetition, recurrence, continuation or multiplication**. That can be
> desirable for some activities and undesirable for others.

1. **Kuligai has no universal polarity.** Never classify it as universally
   auspicious or universally prohibited.
2. **The activity resolves it.** Repeat-worthy / growth / continuation
   activities: may be favourable. Activities where recurrence is undesirable:
   may be unfavourable.
3. **Classical activity rules take precedence** for major samskara/muhurta
   activities (marriage, grihapravesam, and their kind). **Kuligai alone must
   never turn a prohibited period into an auspicious one** — it can only ever
   modulate within what the activity's own rules already allow.
4. **With no activity supplied, Kuligai is `CONDITIONAL` / `UNSPECIFIED`** —
   *not* a hard blocker, and *not* a generic "best time". Both readings are
   wrong in the activity-free case.
5. **Wording.** The generic Today surface must not say simply "Kuligai is
   good". Say *"Kuligai — suitable for activities intended to repeat, continue
   or grow."*
6. **Abhijit overlap** is shown as **informational / conditional**, never in
   the avoid register, unless the selected activity makes Kuligai
   unfavourable.
7. **On an activity-free "best time today" surface**, keep Abhijit as the
   general auspicious window and show Kuligai **separately, as a
   special-purpose conditional period** — never folded into either the
   recommended list or the avoided list.

The owner explicitly rejected the plain "stop blocking on Kuligai" option:
making it non-blocking while still calling it generally good loses the
activity-dependent doctrine, which is the whole point.

**Backend note:** `app/data/kuligai_polarity.py` already models 1-3 correctly,
including the deliberate non-rejecting `UNSPECIFIED` default. R7 changes no
backend rule; it settles the activity-free web case the table cannot decide,
and tightens the copy.

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

- **§1 web-first live kalam slice implemented (2026-09-22), committed in `8f60d0f`.**
  - one shared resolver now decides the period running now for both the Today
    hero and ribbon, with the ruled overlap priority Rahu Kalam > Yamagandam >
    Kuligai;
  - Yamagandam and Kuligai no longer disappear behind the first Rahu Kalam
    caution window;
  - live Rahu Kalam / Yamagandam name the end time and advise against new
    starts;
  - Kuligai has its own neutral, repeat-friendly treatment and the R5 wording
    in English and Tamil; it is not rendered as a generic avoid period;
  - Tamil end times use the almanac period-word formatter.

  Gate: 8 new tests across `kalam-live.test.ts`, `dashboard-today-tab-nova.test.tsx`,
  and `dashboard-today-ribbon-nova.test.tsx`. All fail with their fix removed
  (checked by hand, not just before the original implementation) and pass now.
  The full web suite is green: 103 files, 983 tests. `tsc --noEmit` and targeted
  ESLint are green.

  **Review pass (2026-09-22), two fixes:**
  - `dashboard-today-tab-nova.test.tsx`'s new Kuligai assertions called
    `within()` on `Element.closest(".ui-card")`, which types as `Element`, not
    `HTMLElement` — `tsc --noEmit` failed on it. The original report claimed a
    clean typecheck; it wasn't run after that test was added. Fixed with
    `closest<HTMLElement>(...)`.
  - `liveAvoidLine`'s Tamil copy shipped in the imperative register
    (புதிய தொடக்கங்களைத் **தவிர்க்கவும்**), the exact form the owner ruling of
    2026-09-17 (`avoidRahu`, two lines above it in the same file) rules against
    in favour of the advisory தவிர்ப்பது நல்லது — and the same ruling asks for
    one phrasing per piece of advice, not two. Fixed to match `avoidRahu`'s
    register; added a Tamil-mode test (`"counsels rather than commands..."`)
    that fails with the imperative form restored, so this can't silently drift
    back.

- **§1 mobile local reminders implemented (2026-09-22), committed in `8f60d0f`.** R1:
  opt-in, local, offline, no server load.
  - `timeOnDateToMs` (+ its DST-refinement helpers) moved from `web/lib/tz.ts`
    to `packages/shared/src/utils/tz.ts`, re-exported from web unchanged, so
    mobile's reminders resolve the same instant web's hero/ribbon do instead
    of a second copy that can drift — same reasoning as `pinFirst` earlier
    this plan. Added `./utils/tz` to `packages/shared/package.json`'s
    `exports` map; `shared-exports-map.test.ts` (a pre-existing guard against
    exactly this class of miss) caught the omission on the first run.
  - `mobile/src/lib/kalamReminders.ts`: pure trigger-time planning
    (`planKalamReminders`), same "before/during/after, half-open at the end"
    reasoning as web's `resolveKalamStatus`, arrived at independently since
    the two run in different runtimes. `KALAM_REMINDER_KINDS` is
    `["rahuKalam", "yamagandam"]` — Kuligai is structurally excluded, not
    filtered out, so there is no wording path that could get it wrong (R5).
  - `mobile/src/lib/kalamNotificationScheduler.ts`: schedules through
    `expo-notifications`, tags its own notifications so a rebuild cancels
    exactly its own and nothing else scheduled on the device; Tamil body
    copy uses the same advisory register (தவிர்ப்பது நல்லது) as web's
    `avoidRahu` / `liveAvoidLine`, on purpose, given what shipped wrong in
    the web slice's own first draft.
  - Toggle (Settings, "On this device", device-local via
    `useKalamReminderToggle` / `AsyncStorage`, deliberately not the
    server-synced `NotificationPreferenceData`) and scheduling
    (`useKalamReminders`, mounted on Today where today's kalam times already
    load) are two hooks, not one: Today stays mounted while the reader visits
    Settings, so Today re-reads the toggle with `useFocusEffect` rather than
    only on mount.

  Gate: 6 new tests in `mobile/__tests__/kalamReminders.test.ts`, including
  one that plants a stray truthy `kuligai` key on the prefs object and asserts
  nothing gets planned. Checked by hand with the past-lead-time guard removed:
  fails. Mobile suite green: 14 suites, 106 tests. `tsc --noEmit` and ESLint
  clean on every touched/new file, web and mobile both.

  **Review pass, one fix:** the Settings screen's first draft put the new
  "On this device" section inside the same `!isLoading && !isError` gate as
  the server-synced toggles above it. A failed or slow
  `getNotificationPreferences` call would then have hidden the local-only
  Rahu/Yama toggle behind an unrelated `ErrorCard` — exactly the server
  dependency this feature exists to not have. Restructured to one `ScrollView`
  where only the server-backed section is gated on the query state and the
  device-local section always renders below it.

  **Still open in §1:** Durmuhurtham — now exposed, see below; rendering it is
  the remaining half.

- **R5 Kuligai audit (2026-09-22), read-only — the doctrine conflict is
  narrower than R5 assumed, and one half of it is already built.**

  R5 asks for the audit *before* changing anything, and names three consumers.
  Two of the three are already correct, and the "one activity → kuligai-policy
  table on the backend" R5 asks for **already exists**:

  - `app/data/kuligai_polarity.py` — owner-ruled 2026-08-17 as **EC-RULING-07**,
    refined by astrologer ruling `MUH-06` (2026-08-28). It is the same
    repetition discriminator R5 states ("does repeating this add to a stock, or
    mean the first came undone?"), already extended well past R5's four
    examples: 18 FAVOURABLE activities, 20 ADVERSE. `KULIGAI_ACTIVITY_TABLE_UNVERIFIED`
    is already `False`. `polarity_for` returns `UNSPECIFIED` for anything
    unclassified, and `rejects()` is **false** for `UNSPECIFIED` — the backend's
    default is deliberately *not* to reject, because defaulting to reject is the
    blanket exclusion EC-RULING-07 exists to undo.
  - `app/services/muhurta_service.py` — consumes it in both directions already.
    `_clear_good_day_kalas` cuts Kuligai only when `kuligai_rejects(activity)`;
    the slot scorer names a Kuligai overlap always but only penalises an adverse
    activity, and emits `WINDOW_KULIGAI_FAVOURABLE` as an unpriced bonus for a
    favourable one.
  - The activity board (`web/components/dashboard-today-activity-board-nova.tsx`)
    contains **no** Kuligai handling of its own — it reads the backend verdict,
    so it inherits the table correctly.

  So R5's "audit how each of them treats Kuligai before changing any" resolves
  to: the muhurta engine and the activity board need no change, and no new
  backend table should be written. This is the "stale conclusion outlives its
  check" pattern — R5 was drafted without checking what 2026-08-17 had already
  ruled and built.

  **The one real conflict is on the Today tab, and the web half of §1 that just
  shipped is what makes it visible.** `web/components/dashboard-today-tab-nova.tsx`
  treats Kuligai as a plain avoid-kala in two places, both activity-free:

  - L610-614, `avoidSpans` = `[rahuKalam, yamagandam, kuligai]`, passed to
    `pickRecommendedWindow`. A window overlapping Kuligai is never promoted and
    counts into `skippedForCollision` / `collidesWithAvoid`.
  - L1630-1635, the Abhijit overlap note lists Kuligai beside Rahu Kalam and
    Yamagandam, so it prints "Abhijit overlaps Kuligai" in the avoid register.

  Both sit on the same tab as the hero card that now reads *"Now: Kuligai until
  1:30 pm · good for what you'd want again (gold, property)"*. One surface, two
  registers for one period — the contradiction the saved rules "two axes on one
  card" and "explanation must match its own numbers" both name.

  **Not fixed in the audit, because it is a doctrine call, not a code call.**
  The web recommendation is activity-free: there is no activity to look up in
  the polarity table, so neither "keep blocking" nor "stop blocking" follows
  from EC-RULING-07 on its own. Put to the owner → **R7**, above.

- **R7 applied to both web surfaces (2026-09-22), not committed.** No backend
  change: `kuligai_polarity.py` and `muhurta_service.py` already model R7.1-3,
  and the activity board reads their verdict.

  Signed-in Today (`dashboard-today-tab-nova.tsx`, `dashboard-i18n.ts`):
  - `avoidSpans` is Rahu Kalam + Yamagandam. Kuligai no longer disqualifies a
    window, and no longer counts into `skippedForCollision` /
    `collidesWithAvoid`.
  - `clearOfKalas` and `allCollide` no longer claim Kuligai was checked —
    the sentence now names only what the code actually tested.
  - A promoted window overlapping Kuligai says so itself, in the conditional
    voice (`windowInKuligai`), so "clear of Rahu Kalam and Yamagandam" cannot
    be read as "clear of everything" (R7.7).
  - `abhijitOverlapNote` takes Kuligai as a separate argument and appends
    `abhijitInKuligai` informationally; Kuligai is out of the binding register
    and out of `clearSegments`, so it no longer shortens Abhijit's "clear
    part" either (R7.6).
  - Hero copy leads with the repetition principle rather than "good"
    (`liveKuligaiLine`, `kuligaiMeaning`), keeping R5's examples as examples.

  Signed-out home (`public-today.ts`, `home-today-panel.tsx`,
  `marketing-i18n/home.ts`) carried a parallel copy of the same model and was
  fixed with it — a doctrine ruling applied to one of two surfaces is the
  DXA-08 failure repeating. `AvoidPeriod["key"]` is now `rahuKalam |
  yamagandam` (so the dead Kuligai branch failed to typecheck rather than
  lingering), `kuligaiPeriod()` is separate, Kuligai is out of the avoid-card
  rotation, and its row in "other timings" carries `today_kuligai_note` so its
  company in that list is not read as its meaning.

  Gate: 3 new tests (promoted window overlapping Kuligai is promoted *and*
  named; Abhijit ∩ Kuligai is conditional, not binding; the guest Kuligai row
  has its own note), plus 6 existing tests updated from the old doctrine. The
  two new Today-tab tests were **checked with the fix removed and both fail**
  — Kuligai was put back into `avoidSpans` and into the Abhijit avoid list,
  and the run was verified red before reverting. Full web suite green: 103
  files, 986 tests. `tsc --noEmit` and ESLint clean.

  **Blind spot:** every one of these is a jsdom text assertion. None of them
  sees the Kuligai card's accent treatment in Nova light or dark, at 375 px,
  or how the extra conditional line reflows the hero — and the guest panel's
  new note adds a row of height to a marketing surface that has never been
  looked at in a browser this session. Tamil copy is unreviewed by a native
  reader. Visual sign-off still required.

- **§1 (d): Durmuhurtham exposed in the daily panchangam response
  (2026-09-22), not committed.** Plan item (d), and smaller than the plan
  assumed — the *only* thing missing was the response mapping.

  The rule has been computed, verified against seven owner-supplied Chennai
  almanac entries, and carried on `PanchangamSnapshot` since 2026-08-16. It
  already serialises **and** deserialises through the panchangam cache
  (`app/calculations/panchangam.py` L2015 / L2145), and the deserialiser
  already tolerates its absence — so **no cache version bump**, and none of
  the recompute-storm risk a bump carries. `_build_kalam` in
  `panchangam_service.py` was simply dropping the field on the floor on its
  way to the wire.

  - `app/schemas/panchangam.py`: `PanchangamKalam.durmuhurtham`, defaulting to
    `[]` so a payload built before today still validates.
  - `app/services/panchangam_service.py`: `_build_kalam` maps it, with
    `warn_on_conflict=False` — the Gowri conflict warning is about a *good*
    kala landing on an inauspicious kalam, and Durmuhurtham is never a good
    kala.
  - **Four-surface check:** `web/lib/types.ts` and mobile both re-export the
    kalam type from `packages/shared/src/types/index.ts`, so the contract has
    exactly one definition and one edit — `durmuhurtham?: KalamSlot[]`,
    optional for the same reason `gowriPanchangam` is. Verified by grep rather
    than assumed; `web/lib/types.ts` defines no kalam shape of its own.

  Gate: 1 new test in `tests/test_durmuhurtham_structure.py`, **checked
  failing with the mapping removed**. Backend 125 passed across
  `test_panchangam`, `test_panchangam_api` and `test_gulika`; field-contract
  and serializer-contract suites green (83 passed). `tsc --noEmit` green on
  web and mobile; mobile suite 14 suites / 106 tests.

  **Not rendered anywhere yet, deliberately.** Whether Durmuhurtham joins the
  avoid-set is a doctrine call, and R7 is the argument for not guessing it:
  `is_good=False` on a slot is not the same claim as "show this in the avoid
  register". Needs an owner ruling before any surface paints it.

  **Blind spot, both halves:** neither jsdom nor Jest's node/RN test
  environments prove a notification actually appears on a device at the
  scheduled moment, survives the app being killed, or reads correctly in the
  OS notification tray in Tamil. `mobile/.maestro/flows/` has no flow for this
  yet. jsdom also still cannot see painted emphasis in Nova light/dark or
  375 px reflow for the web half. The in-app browser and a device/emulator
  were both unavailable in this session, so visual and on-device sign-off are
  still required before either half ships.

- **§2 backend groundwork (2026-09-22), not committed.** Everything the UI
  needs, and nothing that paints yet.

  - **The duplicate resolver is gone first, as the Arch note demanded.**
    `dashboard_bundle_service.py` L79 re-implemented the current-vs-birth
    choice; it now calls the resolver every other service calls. The copy
    existed only to tolerate a profile with no usable location at all — the
    shared resolver calls `float()` on the birth coordinates unconditionally
    and raises — so `resolve_effective_daily_location_or_none()` gives that
    third answer in the one place the rule lives.
  - **`panchangamPlace`** on the bundle (§2.4). `panchangamLocation` names the
    *rule* that chose the place ("current" beat "birth"), which is not
    something to show a reader — "Timings for current" is not the ask.
  - **`locationCheckDue` + `locationConfirmedAt`** on the bundle, computed from
    `LOCATION_CHECK_DUE_DAYS = 45` (R2) in `location_service.py`, the same
    server-side-cadence pattern as `LIFE_MODE_STALE_DAYS`. A profile that has
    never confirmed a location is due immediately — null is the state of every
    reader who has only ever had a birth location, which is exactly the group
    most likely to be reading timings for a place they left.
  - **`POST /birth-profiles/{id}/confirm-location`** and its shared wrapper.
    Only PATCH stamped `current_location_updated_at`, and only when a current
    location field was actually in the payload — so "Keep Chennai" changed
    nothing and the backstop would return on the reader's next visit.
    Declining has to be recorded as an answer, not as silence.

  Gate: 6 new backend tests (cadence boundary at exactly 45 days, naive-stamp
  handling, the resolver's None case, the constant itself, and the endpoint
  stamping without moving the place) plus 1 mobile wrapper-contract test
  asserting the path-param shape — the class of drift that bit `getDailyGuidance`
  and `registerFcmToken`. Backend route- and field-contract suites 284 passed
  (up from 274: the new wrapper is now checked against its route). `tsc` clean
  on web and mobile.

  **Nothing renders yet.** The mismatch prompt (§2.1), the backstop strip
  (§2.2), the one-slot queueing against the life-focus strip (§2.3) and the
  "Timings for X" label (§2.4) are all still to build.

- **§2 Arch, last bullet: the cache question, checked — and it was a real bug
  (2026-09-22), not committed.**

  The two caches answer differently:

  - `PanchangamCache` is keyed on `(cache_date, latitude, longitude,
    ayanamsa_type)`, so a move misses correctly with no help from anyone.
  - `DailyScore` — the daily-guidance cache — is keyed on
    `(birth_profile_id, score_date)` and records **nothing** about the place
    the row was computed for. Everything sunrise-derived in that row (the
    avoid kalas, the Gowri grid, horai, the recommended window's clock times)
    moves with the place. So a reader who moved Chennai → Singapore kept being
    served Chennai timings under the Singapore label, for every date already
    warm. §2 would have shipped its prompt on top of a cache that ignored the
    answer.

  Fixed in `update_birth_profile`: when the **effective location actually
  changes**, that profile's `DailyScore` rows from today forward are dropped.

  - The test is on the resolved location before vs after, not on which fields
    the payload mentioned — a PATCH re-sending the same city is the "Keep"
    answer arriving by another route, and must not throw away warm rows.
  - Past dates are kept. Those rows describe days actually lived at the old
    place; rewriting history is both wrong and the expensive option.
  - **Deliberately not a cache-version bump.** A bump invalidates every row for
    every user at once, which is a load test (see the saved rule). This
    recomputes only the moved profile's future rows — the same reasoning
    `_GOAL_TRACK_KEY` in `_dg_cache.py` records for its own case.

  Gate: 2 new API tests. The move test **fails with the invalidation removed**;
  the same-city test passes either way by construction, which is the point of
  having it — it pins the behaviour that makes the first test's condition
  narrow.

  **Residual, written down rather than fixed:** a path that changes a current
  location *without* going through `update_birth_profile` would still leave
  stale rows. `family_vault_service.py` L1647 stamps
  `current_location_updated_at` directly and is the one such path today; it
  was not touched here because whether a vault edit can move a member's
  current location is a separate question from §2's.

- **§7 fixed (2026-09-22), committed in `7347030`.** `web/components/dashboard-charts.tsx`:
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
