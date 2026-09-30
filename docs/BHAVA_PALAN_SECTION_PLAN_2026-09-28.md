# Bhava Palan — a per-house "how strong, why, what to do" section

**Date:** 2026-09-28
**Surface:** Family & Charts (`web/components/dashboard-family-charts-hybrid.tsx`, detail view)
**Status:** PLAN — nothing built. Owner rulings needed (§9) before P0 starts.
**Wearing:** Tamil thirukanitham reader · product owner · UX architect

---

## 1. The ask

> "give details about each position of their chart — telling strong or moderate or weak —
> giving explanation why it is — for example telling your 7th house is weak so marriage
> related should be done with care, you should be calm and patient, you should do this and
> don't do this."

Three things per house, in this order:

1. **நிலை** — a verdict word (strong / mixed / needs care)
2. **ஏன்** — why, naming the actual graha responsible
3. **நடைமுறை** — conduct: what to lean on, what to go slowly with

---

## 2. What already exists (read this before designing anything)

I audited the engine and both render surfaces first. **Most of this is already built and
shipping — it is simply never drawn on screen.**

### 2.1 The backend already computes all twelve houses

`chart_explanation_service._build_bhava_section()` returns a `ChartExplanationBhava` for
**every** house 1–12, carrying:

| Field | What it holds |
|---|---|
| `bhavaBala` | 0–100, from `compute_all_bhava_bala()` |
| `lord` / `lordHouse` / `lordStrength` | the bhavadhipati and where it sits |
| `occupants` | grahas in the house |
| `aspectingPlanets` | **drishti onto the house**, including onto empty houses |
| `theme` | the life area, bilingual |
| `explanation` | bilingual prose |

Its own docstring says why it exists:

> *"an unoccupied 7th under Saturn's full aspect — a first-order fact for any marriage
> question — appeared nowhere in the reading."*

`compute_bhava_bala()` (`app/calculations/chart_strength.py`) is a real composite:
bhavadhipati bala 50% + occupant bala 25% + drishti bala 25%.

### 2.2 …and **nothing renders it**

A sweep of `web/`, `mobile/` and `packages/shared/` for `bhavas` / `bhavaBala` returns
**only the type definition** in `packages/shared/src/types/index.ts:1169-1187`. There is
not one consumer. Twelve houses of computed reading are paid for on every chart request
and thrown away.

### 2.3 The UI's house verdict **contradicts** the engine's

`HyBhavaTable` (`web/components/dashboard-hybrid-parts.tsx`) already draws a 12-row table
with a "நிலை / Status" column. Its dot is computed as:

```ts
const lordScore = strengthByGraha.get(lordGraha);
const dot = lordScore >= 60 ? high : lordScore >= 40 ? mid : low;
```

That is **the lord's strength alone** — the 50% term — with occupants and drishti dropped.
So the exact case the backend was built for (empty 7th, strong Venus elsewhere, Saturn
aspecting it) renders **green** in the table while the engine's own `bhavaBala` says
otherwise. Two answers to one question, and the visible one is the weaker.

### 2.4 Three defects in that table, worth fixing in the same pass

1. **Colour is the sole carrier of meaning** — a red/amber/green dot with no text label.
   WCAG 2.2 §1.4.1. Our axe gate cannot see this (it only checks contrast), per
   `docs` note *Axe Gate Only Checks Contrast*.
2. **The number lives only in `title=`** — invisible to touch users entirely, and
   invisible to every text probe we run, exactly as the display-boundary note in
   `CLAUDE.md` warns.
3. **The dot is 9px** and is the only interactive-looking affordance in the row.

### 2.5 What is genuinely missing

Only three things — and they are the three the owner asked for:

- a **band word** (the engine emits a number; D2 says never show the raw int as the verdict)
- a **why-line** that names the responsible graha
- **conduct** guidance

---

## 3. Doctrinal position (thirukanitham)

### 3.1 How a bhava is actually judged

Classical reading takes six inputs. We currently compute three.

| # | Input | In `compute_bhava_bala` today? |
|---|---|---|
| 1 | பாவாதிபதியின் பலம் + இருப்பிடம் | ✅ 50% |
| 2 | பாவத்தில் உள்ள கிரகங்கள் | ✅ 25% |
| 3 | பாவத்தின் மேல் விழும் பார்வை | ✅ 25% |
| 4 | பாவ காரகன் (7th→சுக்ரன், 10th→சூரியன்…) | ❌ |
| 5 | வர்க்க உறுதி (D9 for 7th, D10 for 10th…) | ⚠️ partly — see 3.1a |
| 6 | அதிபதி பாவத்திலிருந்து கேந்திர/திரிகோணமா | ❌ |

**Ruling I recommend:** add 4/5/6 as **display-only confirmation lines**, *not* as extra
score terms. Folding them into the number re-runs the karaka weight that
`promise_gate` already applies downstream and repeats the
*Layered Scoring Double-Counts* mistake. The number stays a three-term composite; the
card gains a line like *"D9 agrees"* / *"D9 does not confirm this"*.

### 3.1a Correction, 2026-09-29 — row 5 was already half true

Row 5 read ❌ when this plan was written. It was wrong, and the mistake is the kind
CLAUDE.md's *stale conclusion* rule is about: the check was run against
`compute_bhava_bala`, which indeed contains no varga term — but that function's row-1
input is `planet_scores`, and **the Navamsa is already inside those**. Asked whether
the bhava reading is D1 or D9, the honest answer is *D1 frame, thin graha-level
hybrid*:

| D9 term on the house lord's score | Points | After Bhavadhipati's 50% |
|---|---|---|
| Vargottama (`chart_strength.py:985`) | +4 | +2 |
| D9 dignified, gated on neutral Rasi dignity (`:994`) | +5 | +2.5 |
| D9 debilitated (`:1007`) | −5 | −2.5 |
| …Rasi-exalted **and** D9-neecha, charged double (`:1007`) | −10 | −5 |
| Kala Bala D9 tier (`:605`) | ±0.6 | ±0.3 |
| Neecha bhanga via D9 strength (`:1214`, bonus `:1138`) | +14 | +7 |

Against the measured distribution in §9 (mean 45, stdev 6, cuts at 50/40) one point is
0.17σ, so −5 and +7 are **band-moving**. D9 is not decorative here.

What is genuinely absent is the *bhava-level* varga question — "does D9 confirm this
house's promise" — which is what row 5 meant and what P3 still owes. The distinction is
doctrinal, not pedantic: **the Navamsa judges a graha, the Rasi judges a bhava.** A
graha's D9 dignity belongs in Bhavadhipati Bala and is correctly there; a varga's
verdict on a house is a second register that ratifies or withholds, and must never be
averaged into the first.

**Built 2026-09-29 (not the P3 item):** the defect this correction exposed. `render_why`
called a lord "strongly placed" on score alone, while the chart drawn beside it showed
that lord neecha. Sweep (`scripts/bhava_dignity_sweep.py`, checked in so the figure
outlives this note): 4,000 charts each with one graha forced into its debilitation sign
— **3,384** (84.6%) still scored it ≥ 50, and of the 3,560 whose debilitation was
cancelled, **3,184** (89.4%) did. Uniform-random placements over-represent kendras, so
these bound the shape of the problem, not its rate in real charts.
`bhava_palan._varga_ground` now makes the sentence
state its ground in four cases (bhanga via D9, bhanga via the three Rasi-side routes,
debilitated-but-well-placed, and hollow exaltation). Display only — no score moved, and
`test_the_band_is_unchanged_by_the_navamsa` ratchets that.

**Still open for P3, and still needing one ruling:** whether varga confirmation is
per-house (D9 for the 7th, D10 for the 10th, D4 for the 4th, D7 for the 5th, D3 for the
3rd) or D9 across all twelve. Per-house is the classical answer; D9-for-everything is a
modern shortcut and would be a doctrine error in a product that names itself
thirukanitham.

Two facts the next reader should inherit rather than re-derive:

1. **The 7th already has this, shipped.** `marriage_service.py:630-655` reads the 7th
   lord's navamsa dignity and calls it, in its own comment, "the classical D9
   confirmation of the 7th bhava itself, not just of the karaka". So the per-house
   reading is not hypothetical here — it exists, for one house, and it is the pattern
   to extend rather than reinvent.
2. **But it moves a score (±4), where §3.1's ruling says display-only.** Two surfaces
   can therefore disagree about the same 7th house: the marriage panel folds D9 into
   its number, the bhava panel (correctly, per ruling Q5) does not. Whichever way P3 is
   ruled, that divergence is the thing to resolve — it is a real cross-surface
   inconsistency today, not a style question.

### 3.2 The dusthana inversion — the trap that makes a naive dot wrong

For **6, 8, 12** a low score is not bad news and a high score is not good news.

- A **weak 6th** = weak enemies, fewer debts, less illness. Classically *favourable*.
- A **strong 6th** with a strong lord = capable opponents and real litigation.
- A **weak 12th** = less loss and less expenditure — but also less renunciation, less
  rest, weaker foreign links.

Painting the 6th red because its bala is 38 tells the reader the opposite of the truth.
**The band must be polarity-aware per house**, not a straight threshold on the number.
This alone disqualifies extending the current dot logic.

Concretely: houses 6/8/12 read on an inverted scale; 3 and 11 are upachaya and read on a
*growth* scale (they improve with age and effort, so "needs care" at 25 is not a life
sentence); 1/4/7/10 and 5/9 read directly.

### 3.3 Karako bhava nashaya

The bhava karaka sitting **in its own bhava** damages it (Venus in the 7th, Sun in the
10th, Jupiter in the 5th). Our occupant term currently *adds* +10 for a benefic there.
This is a real inversion, not a styling matter. Needs an explicit exception.

### 3.4 The 8th house — hard boundary

Tamil almanacs name the 8th **ஆயுள் ஸ்தானம்**. We will use the Tamil house names
(§6.2) because they carry meaning the ordinal does not — **but the 8th is never rendered
as a longevity statement.** Balarishta was permanently refused
(`project_adverse_yoga_coverage_2026-09-11`); this is the same refusal in a new surface.
The 8th reads as *deep change, research, joint resources, inheritance, careful renewal* —
which is what `HOUSE_MEANING[8]` already says. Its label ships as ஆயுள் only if §9-Q4
is ruled that way; otherwise as மாற்றம்.

---

## 4. Where it goes, and why (IA)

**Recommendation: no new tab, no new section in the tab strip. Expand `HyBhavaTable` in
place.**

The table already asks the question and answers it badly. A row expands to a panel
carrying the verdict, the why and the conduct. The dot becomes a **band chip with a word
in it**, which retires the colour-only defect in the same change.

Why not the alternatives:

| Option | Verdict |
|---|---|
| New tab in Family & Charts | ✗ The IA refactor (2026-07-22) deliberately collapsed tabs. Adding one re-opens a closed decision. |
| New section in `ChartExplanationPanel`'s tab strip | ✗ It already has a `houses` section — but that section renders only the **three group cards** (kendra/trikona/dusthana) and a flat planet list. It should render `bhavas[]` instead of growing a 11th sibling tab. |
| A standalone "Your 12 houses" page | ✗ Orphan surface; nothing links to it; duplicates the table. |
| **Expand `HyBhavaTable` rows** | ✓ Fixes a live contradiction and an a11y defect while delivering the feature. |

**Two render sites, one engine:**

1. `HyBhavaTable` — Family & Charts detail view. Expandable rows. *Primary.*
2. `ChartExplanationPanel` → `houses` section — repoint from group cards to `bhavas[]`,
   with the group cards kept **below** as the synthesis. *Secondary, same components.*

Per *Pure Function Recomputed Per Consumer*: the band, why-line and conduct are computed
**once in the backend** and shipped on `ChartExplanationBhava`. Neither render site
recomputes a threshold. That also keeps mobile a wiring job, not a port.

---

## 5. Engine design

### 5.1 Band — polarity-aware, three words

```
bhavaVerdict: "SUPPORTED" | "MIXED" | "NEEDS_CARE"
```

A **new, separate vocabulary** from `app/reasoning/verdict.Band`
(STRONG/LIKELY/MIXED/WEAK/BLOCKED/SILENT). Deliberately so: `Band` is the *prediction*
band (promise gate + timing vote) and appears on Life Areas cards on the same screen.
Two different scales sharing three words would read as a contradiction —
*Two Axes On One Card Reads As Contradiction*.

Say it plainly on the card: **this is the terrain, not the weather.** Life Areas answers
"how is marriage going this year"; this answers "what is marriage built on in this chart,
for life."

Polarity table:

| Houses | Scale | Band from `bhavaBala` |
|---|---|---|
| 1,2,4,5,7,9,10 | direct | ≥52 SUPPORTED · 40–51 MIXED · <40 NEEDS_CARE |
| 3,11 | upachaya | ≥50 SUPPORTED · 38–49 MIXED · <38 NEEDS_CARE, + "grows with effort" note |
| 6,8,12 | inverted | ≤39 SUPPORTED (worded *quiet*) · 40–50 MIXED · ≥51 NEEDS_CARE |

*Green cuts raised by 2 on 2026-09-30 — see §9-Q1a.*

**Measured, not eyeballed** — see §9. The earlier 60/40 proposal in this section was
falsified by the sweep (it fired SUPPORTED 0.7% of the time) and has been replaced.

### 5.2 The why-line — names the graha, never generic

Derived from **which term dominates the composite**, not from the band:

```
dominant = argmax |term_score - 50| over {bhavadhipati, occupant, drishti}
```

Then the line names the real actor:

> **7-ஆம் வீடு — கவனம் தேவை.** இதன் அதிபதி சுக்ரன் 8-ஆம் வீட்டில் உள்ளார்,
> மேலும் சனி இந்த வீட்டைப் பார்க்கிறார்.

> **House 7 — needs care.** Its lord Venus sits in the 8th, and Saturn aspects this house.

Generic band prose ("this house is weak, be careful") is the failure mode to design
against. The reader must be able to check the claim against their own chart on the same
screen — the table row above it already shows sign, lord and occupants.

### 5.3 Conduct — keyed on the responsible graha, not on the band

**This is the core of the design.** Conduct copy keyed on the band alone produces twelve
interchangeable paragraphs. A real jyotishi's advice changes with *which* graha is doing
the work:

| Afflicting graha in the 7th | What is actually said |
|---|---|
| சனி (Saturn) | delay is the remedy, not the problem; steadiness; an older or settled partner suits; never rush a decision |
| செவ்வாய் (Mars) | cool the temper; never decide or confront in anger; match horoscopes with care |
| ராகு (Rahu) | verify what you are told; avoid haste and glamour; involve family elders |
| சூரியன் (Sun) | make room for the other's authority; soften ego in the partnership |
| சந்திரன் weak | emotional steadiness; do not decide in a low mood |

So the composition is:

```
conduct(house_theme, dominant_graha, band, polarity) -> { lean_on[], go_slowly_with[] }
```

**Size:** 9 grahas × ~4 conduct registers each (the graha's register), composed against
12 house themes. That is a ~36-cell graha register plus 12 house contexts — **not**
12 × 3 × 2 hand-written blocks. Composition keeps it maintainable and keeps it sounding
astrological rather than templated.

Never render as "**Don't**". Render as **"நிதானம் தேவை" / "Go slowly with"**. The tone
validator bans fatalistic phrasing and `safety_filter.run_safety_pass()` is the seam
every surface already passes through — this section must call it too.

### 5.4 The timing pointer — one line, no new computation

> *"This steadies during your Jupiter period (2029–2045)."*

Read from the **existing** dasha layer. Do not compute timing here. It answers the
question the verdict provokes ("is this permanent?") and it is the honest answer:
the terrain is fixed, the weather is not.

### 5.5 Schema additions

On `ChartExplanationBhava` (`app/schemas/chart_explanation.py`):

```python
verdict: str                                  # SUPPORTED | MIXED | NEEDS_CARE
polarity: str                                 # DIRECT | UPACHAYA | INVERTED
why: ChartExplanationText                     # names the dominant graha
lean_on: list[ChartExplanationText]           # 2 items
go_slowly_with: list[ChartExplanationText]    # 2 items
karaka_note: ChartExplanationText | None      # §3.1 input 4
varga_note: ChartExplanationText | None       # §3.1 input 5
timing_note: ChartExplanationText | None      # §5.4
```

Additive only — no existing field renamed, no route changed, no query param moved.
Per the API-contract rule this still touches four surfaces, but as **additions**:
`app/schemas/` → `packages/shared/src/types/index.ts` → `web/` → `mobile/`.
No new endpoint, so no new wrapper in `packages/shared/src/api/` is required.

---

## 6. UX design

### 6.1 Card anatomy (expanded row)

```
┌────────────────────────────────────────────────────────┐
│ 7  களத்திர ஸ்தானம் · உறவுகள், கூட்டாண்மை               │
│    ரிஷபம் (சுக்ரன்)          —            ● கவனம் தேவை │   ← chip: dot + WORD
├────────────────────────────────────────────────────────┤
│ ஏன்                                                     │
│ இதன் அதிபதி சுக்ரன் 8-ஆம் வீட்டில் உள்ளார்; சனி இந்த     │
│ வீட்டைப் பார்க்கிறார்.                                   │
│                                                         │
│ ⌁ D9-ல் சுக்ரன் உறுதிபெறவில்லை.          ← varga note   │
├────────────────────────────────────────────────────────┤
│ இதை நம்புங்கள்                  │ நிதானம் தேவை          │
│ · பொறுமையும் நிதானமும்          │ · அவசர முடிவு        │
│ · நிலையான, மூத்த துணை           │ · கோபத்தில் பேசுவது  │
├────────────────────────────────────────────────────────┤
│ குரு தசையில் (2029–2045) இது நிலைபெறும்.   ← timing     │
└────────────────────────────────────────────────────────┘
```

### 6.2 House labels — Tamil almanac names

Use the names a Tamil reader already knows, with the ordinal retained:

| # | Label | # | Label |
|---|---|---|---|
| 1 | லக்னம் | 7 | களத்திரம் |
| 2 | தனம் | 8 | (§9-Q4) |
| 3 | விக்கிரமம் | 9 | பாக்கியம் |
| 4 | சுகம் | 10 | தொழில் |
| 5 | புத்திரம் | 11 | லாபம் |
| 6 | ரிபு | 12 | விரயம் |

English keeps the existing `HOUSE_MEANING` phrasing — it is already plain and good.
**Active language only, no bilingual echo** (standing ruling).

### 6.3 Interaction & states

- **Collapsed** is the default for all 12. One row open at a time (accordion), matching
  the chart-explanation panel's existing one-section-at-a-time pattern.
- **Row is the hit target**, not the dot — full-width, ≥44px.
- Apply the same scroll-anchoring workaround `dashboard-chart-explanation.tsx:822` uses;
  collapsing a tall panel above the fold yanks the scroll otherwise.
- `prefers-reduced-motion`: no height animation.
- **An "open all" control** for the reader who wants the whole reading — and it is what
  the PDF export path will use.

### 6.4 Accessibility — the specific things that will otherwise fail

- Band chip carries **the word**, always. The dot is decoration.
- `aria-expanded` on the row trigger; panel `id` referenced by `aria-controls`.
- **`title=` is retired**, not extended. The score, if shown at all (§9-Q2), is text.
- Tamil mode must be checked by hand. `scripts/ux-audit-core.mjs` walks top-level tab
  panes in English only — a collapsed row inside a detail view inside the Family tab is
  **outside it by construction**, and the audit account is pinned to `lang: "en"`.
- 375 / 768 / 1024 / 1440 reflow. The two-column lean-on/go-slowly block stacks at 375.
- Non-text contrast (1.4.11) on the chip border — axe has **no implementation for this**
  and will report clean regardless. Measure by hand.

### 6.5 Where this must *not* leak

The display-boundary rule applies in full. `rasiName` / `rasiCode` / `.lord` / `.graha`
are never rendered — read the key, render through `rasiDisplayName()` and
`tPlanetLord()`. This section is exactly the shape that has leaked nine times before:
new component, English-looking name field sitting right next to the key.

---

## 7. Copy safety register

| Rule | Why |
|---|---|
| No "weak" as a bare verdict in Tamil (`பலவீனம்`) | reads as a life sentence; use `கவனம் தேவை` |
| No "don't" — use "go slowly with" | conduct, not prohibition |
| No 8th-house longevity claim, ever | Balarishta permanently refused |
| No marriage *refusal* — only "with care" | the 7th is the most-read house; a NEEDS_CARE 7th must never read as "you should not marry" |
| No medical claim from the 6th | safety pass, medical register |
| Every string through `safety_filter.run_safety_pass()` | the one serve-time seam |
| Band word may appear beside the number | sanctioned (P0-1, 2026-07-13) — but the number is never the verdict (D2) |

**The 7th house is the one to get right.** It is the house this feature will be judged on
and the one where a careless sentence does real harm to a real reader.

---

## 8a. BUILT — 2026-09-29

P0, P1 and P2 are implemented and green. P3 is not started.

| File | What |
|---|---|
| `app/calculations/bhava_palan.py` | polarity, bands, dominant-term attribution, karako bhava nashaya, renderers |
| `app/calculations/bhava_palan_copy.py` | the 9-graha conduct register, house domains, framing, polarity notes |
| `app/schemas/chart_explanation.py` | 10 additive fields on `ChartExplanationBhava` |
| `app/services/chart_explanation_service.py` | wires the palan into `_build_bhava_section` |
| `packages/shared/src/types/index.ts` | `BhavaVerdict`, `BhavaPolarity`, the new optional fields |
| `web/lib/types.ts` | re-exports |
| `web/components/dashboard-hybrid-parts.tsx` | `HyBhavaTable` rewritten as expandable rows with band chips |
| `web/app/dashboard/dashboard-nova.css` | `.bp-*` (44px rows, chip, 3-segment meter, 560px stack) |
| `tests/test_bhava_palan.py` | 34 tests incl. the mirror-drift guard |
| `tests/test_chart_explanation_bhavas.py` | +4 seam tests |
| `web/components/dashboard-hybrid-bhava-palan.test.tsx` | 11 render tests, both languages |

**Green:** 45 bhava tests · 273 palan+reasoning+tone · 146 chart/life-area/strength ·
1264 web tests (122 files) · `tsc --noEmit` clean.

**Life Areas is provably unmoved** — `compute_bhava_bala` was not touched (ruling Q5),
and the 146 chart/life-area/strength tests pass unchanged.

### Gate baselines — each was run with the fix removed

Not optional here: three items in this repo have been recorded green by a gate that
could not fail.

| Gate | Run with fix removed | Result |
|---|---|---|
| `test_term_scores_match_compute_bhava_bala` | weights drifted to 0.6/0.2/0.2 | fails on 12/12 houses ✅ |
| chip carries a word (en + ta) | band word replaced with `{null}` | 3 tests fail ✅ |
| no raw bala, no `title=` | `title={bhavaBala/100}` re-added | fails ✅ |

### Blind spots — recorded beside the PASS, not omitted

1. **`tone_validator` is a phrase list, not a semantic check.** Measured directly, it
   catches `doomed` but passes *"this will destroy your career"* and *"you will suffer
   loss"*. A green tone test proves only that no listed phrase appears. The check with
   teeth is `test_generated_copy_stays_inside_the_q6_fence`, which uses a stricter
   local list — and neither replaces an astrologer reading twelve real outputs.
2. **jsdom has no layout.** Nothing in CI sees 375px reflow, focus-ring visibility, or
   the chip border's non-text contrast (axe has no 1.4.11 implementation at all).
   Needs a browser and a hand measurement.
3. **The threshold sweep used synthetic charts.** Placements are uniform-random, which
   is right for the slow grahas but is not a real birth corpus. The *shape* (centre 45,
   stdev 6) is what the thresholds rest on and that is robust; the exact percentages
   are not gospel.
4. **The Tamil has not been read by a native reader.** Every string is new. The
   grammar follows the honorific forms already in `chart_explanation_service`, but
   register and naturalness are unverified — same open item as GRW-06.
5. **`_term_scores` is a deliberate mirror** of `compute_bhava_bala`. The parity test
   prevents silent drift, but if that formula changes, this must change with it.
6. **No mobile surface renders any of this yet** (P3).

---

## 8. Phasing

Each gate below names **what it cannot see**. A gate recorded without its blind spot is
inherited as "this item is clean" — that has now happened three times in this repo.

### P0 — Render what already exists *(smallest useful ship)*

Draw `bhavas[]` in `HyBhavaTable` as expandable rows: theme, lord + where it sits,
occupants, **aspecting planets**, and the existing bilingual `explanation`. Replace the
dot with a band chip driven by **`bhavaBala`**, not `lordScore`.

- Delivers the empty-7th-under-Saturn case that is currently invisible.
- Retires the colour-only defect and the `title=`-only number.
- Zero backend change.

**Gate:** a unit test asserting the chip word for a fixture chart, in **both** languages.
*Blind spot:* it cannot see reflow, focus order, or whether the Tamil reads naturally to a
native reader. Run the gate once with the fix removed and confirm it fails.

### P1 — Verdict, polarity, why-line

Backend: `verdict`, `polarity`, `why`. Polarity table for 3/6/8/11/12 (§5.1, §3.2).

**Gate:** property sweep over a corpus of charts — every house gets a band; no house of
6/8/12 is ever painted with the direct scale; the why-line always names at least one
graha. *Blind spot:* correctness of the thresholds themselves. That is an astrologer
judgement, not a test — §9-Q1.

### P2 — Conduct

The graha conduct register + composition (§5.3). Tone validator sweep over every
generated string, both languages.

**Gate:** `tests/test_tone_compliance.py` extended to the new templates. *Blind spot:*
it catches banned *phrases*, not a paragraph that is bland or that sounds like a fortune
cookie. That needs the astrologer reading twelve real outputs.

### P3 — Karaka, varga, timing, second surface

§3.1 inputs 4–6 as display-only notes; §5.4 timing pointer; repoint
`ChartExplanationPanel`'s `houses` section to the same components; wire `mobile/`.

**Gate:** a snapshot per surface. *Blind spot:* cross-surface drift — nothing ratchets
that the two render sites keep agreeing.

### Not in scope

Remedies per house (`life_areas_service.structured_remedy` already owns remedies — do not
grow a second remedy vocabulary), PDF export, and any change to the bala formula itself.

---

## 9. Rulings — DECIDED 2026-09-28

All six ruled with full ownership. Q1 is measured, not eyeballed; the rest follow from
that measurement or from blast radius.

### The measurement that drove Q1 and Q2

A 4,000-chart sweep (48,000 house readings) through the **real** `compute_bhava_bala`
and `compute_natal_planet_score`, with synthetic charts shaped like real ones (Mercury
within 28° of the Sun, Venus within 48°, nodes exactly opposed, observed retrograde
rates). Script: `scratchpad/bhava_sweep.py`, `scratchpad/bhava_thresholds.py`.

```
bhava_bala:  min=20  max=70  mean=45.0  stdev=6.0
             p10=38  p25=41  p50=45  p75=49  p90=52  p99=58
```

**The scale is centred at 45, not 50, and is compressed.** This falsified §5.1's
proposal outright:

| Thresholds | SUPPORTED | MIXED | NEEDS_CARE |
|---|---|---|---|
| §5.1 proposal 60/40 | **0.7%** | 83.3% | 16.1% |
| **ruled 50/40** | 26.1% | 59.0% | 14.9% |

At 60/40 essentially no house is ever strong — a band that never fires is not a band.
*(First run of this sweep was itself wrong: it used Tamil graha keys while the engine
uses English, so `planet_scores.get(lord, 50)` silently defaulted every lord to 50 and
the whole distribution collapsed to 46–50. Caught by suspecting my own input first.
Production is unaffected — `PlanetPosition.graha` and `SIGN_LORD` share the English
vocabulary.)*

---

**Q1 — Band thresholds. RULED: measured, polarity-aware.**

| Polarity | Houses | SUPPORTED | MIXED | NEEDS_CARE |
|---|---|---|---|---|
| DIRECT | 1,2,4,5,7,9,10 | ≥ 50 | 40–49 | < 40 |
| UPACHAYA | 3, 11 | ≥ 48 | 38–47 | < 38 |
| INVERTED | 6, 8, 12 | **≤ 41** | 42–50 | **≥ 51** |

Validated on what the reader actually sees: **median 2 NEEDS_CARE and 3 SUPPORTED per
12-house chart**; only 3.7% of charts show 5+ flags; only 3.7% show zero SUPPORTED. The
7th lands 24 / 60 / 16. Upachaya is deliberately the most generous (36% SUPPORTED) —
3 and 11 are the growth houses and a low reading there is not a life sentence.

**Q1a — Green cuts raised by 2. RULED by the owner 2026-09-30.**

| Polarity | SUPPORTED was | SUPPORTED now | NEEDS_CARE (unchanged) |
|---|---|---|---|
| DIRECT | ≥ 50 | **≥ 52** | < 40 |
| UPACHAYA | ≥ 48 | **≥ 50** | < 38 |
| INVERTED | ≤ 41 | **≤ 39** | ≥ 51 |

Trigger: a reader saw 7 green houses on one chart, 5 of them at 50–54, and read the
table as "mostly lucky". A re-sweep (3,000 charts through today's real scorer, Mercury
within 28° and Venus within 48° of the Sun) found the Q1 figures above no longer hold:

| Green line | Green / chart | Amber | Red | Charts with ≥6 green |
|---|---|---|---|---|
| Q1 cuts (50/48/41) | 4.48 | 6.10 | 1.42 | 28.5% |
| +1 | 3.54 | 7.04 | 1.42 | 13.1% |
| **+2 (ruled)** | **3.10** | 7.48 | 1.42 | **8.3%** |

The band had drifted ~1.4 greens per chart above the 26% SUPPORTED Q1 was set at, and
21% of all greens sat exactly on the line. +2 restores Q1's intent. `compute_bhava_bala`
is untouched, so Life Areas scores do not move — only the chip a reader sees.

Two measurement notes. (1) A first run with Mercury and Venus placed uniformly gave
4.87 green per chart — combustion is rarer when they wander, so it overstated the
drift; the table above is the shaped run. (2) The red side of Q1 has drifted too
(1.42 NEEDS_CARE per chart, not the median 2 recorded above). Not changed — the ask
was about greens — but it is on record here rather than left to be rediscovered.

**Q2 — Show the number? RULED: no. Not anywhere, including `title=`.**
Now an evidence-based call, not taste: a scale centred at 45 with stdev 6 is not a
percentage of anything, and `45/100` on a perfectly ordinary house reads as "mediocre"
to every reader who has ever seen a test score. Ship the **band word** plus a
three-segment meter. This also retires the `title=`-only defect (§2.4) rather than
carrying it forward.

**Q3 — Dusthana wording. RULED: three bands, polarity-aware display word.**
The enum stays `SUPPORTED | MIXED | NEEDS_CARE`. For 6/8/12 the top band is *worded*
**அமைதி / Quiet** instead of **வலுவானது / Supported** — a quiet 6th means few enemies,
which is the honest sentence. No fourth enum value; the data model stays simple and the
copy stays true. The card also carries one line explaining the inversion, or a reader
who knows the scale will distrust a green chip on a low house.

Framed as a lineage choice in copy, never as "the other reading is wrong": we follow the
Parashari line that a **quiet dusthana favours the native**, which is the defensible
reading *for this formula specifically* because the formula is 50% lord strength and a
strong 6th lord strengthens debts, illness and opponents.

**Q4 — The 8th house label. RULED: மாற்றம், not ஆயுள்.**
Deliberate departure from the almanac name. ஆயுள் ஸ்தானம் invites precisely the
longevity question we permanently refuse, from exactly the Tamil reader who knows the
term. மாற்றம் is also already what shipped copy says — `HOUSE_MEANING[8]` reads
"ஆழமான மாற்றம், ஆராய்ச்சி". **Recorded here so the next reader does not "correct" it
back to the almanac name.**

**Q5 — Karako bhava nashaya. RULED: do NOT touch the formula.**
Blast radius decides this. `life_areas_service.py:1669` consumes `compute_bhava_bala`
for the **live** Life Areas score — changing the occupant term would silently shift
every user's career/marriage/health numbers as a side effect of shipping a new reading
panel. The doctrine still reaches the reader: karako bhava nashaya ships as a
**display-only note** on the card ("Venus sits in its own 7th — the karaka in its own
bhava asks more of it"), consistent with §3.1's ruling that inputs 4–6 are notes, not
score terms.

**Q6 — Conduct tone. RULED: concrete acts, inside a fence.**
Temperament-only advice ("patience steadies this") is what every generic app says and is
why readers do not trust them. Conduct names a real act — but only one that is:

- **reader-controllable** (their own behaviour, never a third party's),
- **reversible** (never "leave", "sell", "refuse"),
- **non-medical**, **non-legal**, **non-financially-specific** (no amounts, no instruments),
- phrased as **"go slowly with"**, never **"don't"**.

Allowed: *"involve a family elder before you agree."* Not allowed: *"postpone the
wedding"*, *"see a doctor about your stomach"*, *"don't sign in July."*

---

## 10. Summary

The feature the owner asked for is **~70% already computed and 0% rendered**. The honest
shape of this work is: *draw the twelve houses we already calculate, fix the contradiction
between the table's dot and the engine's own number, then add the verdict word, the
why-line and the conduct guidance on top.*

P0 alone — pure front-end, no backend change — ships a real per-house reading and removes
two live defects.
