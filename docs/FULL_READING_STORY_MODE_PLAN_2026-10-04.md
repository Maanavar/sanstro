# Full Technical Reading — Story Mode Redesign Plan

**Date:** 2026-10-04
**Surface:** Family & Charts → §9 "Full technical reading" (`ChartExplanationPanel`,
`web/components/dashboard-chart-explanation.tsx`, 1,766 lines; also rendered by
`dashboard-family-shared.tsx:276`)
**Trigger:** Owner: *"even as the developer I find all ten subtabs too dense, not ready
to read, tiring. Present it so any audience finds it easy and useful; keep the deep
version behind a toggle for astrologers; use icons, pictures, graphics, animation."*
**Status:** BUILT 2026-10-04 (P0–P3, then a second pass for FTR-18 and P4; FTR-20 is a first,
text-only mobile version). The owner delegated every decision ("full ownership, proceed in order"),
so §11 records the calls made. **Not committed.** What was verified, and what was not, is in §13 and §14.
**Lineage:** This is **Phase 5** of `docs/family-charts-humanization-audit.md`
("roll Meaning → Why → Mechanics across every surface"). That phase was planned but
never done. Phases 0–4 fixed the planet orbs and only *collapsed* this panel. They did
not redesign it.

Status legend: `[ ]` open · `[~]` in progress · `[x]` done

---

## 1. What you asked for, in one paragraph

Today the panel is a **reference manual**: ten tabs organised by astrological
*mechanism* (conjunction, drishti, house group, functional nature) and filled with
same-weight grey paragraphs. You want a **guided reading** organised by the *questions
a person actually has*. It should show before it tells, give a verdict before the
reason, and stay short enough to finish. The complete reading stays one toggle away for
astrologers, and **nothing is deleted**: the same data gets two renderings.

---

## 2. Diagnosis — measured, not felt

### 2.1 How much text each subtab renders

Measured by running three **synthetic** birth profiles through the real
`GET /charts/{id}/explanation` on the test DB (as-of 2026-10-04) and counting the words
in every bilingual text field each tab renders. Probe: `D:\tmp\density_probe\test_density_probe.py`.

| Subtab | EN words (A / B / C) | TA words | Text blocks |
|---|---|---|---|
| What your chart is built around | 53 / 15 / 88 | 41 / 11 / 72 | 1–3 |
| What is active for you now | 247 / 217 / 208 | ~180 | ~10 |
| **Where your planets are placed** | **4,036 / 3,774 / 3,698** | **~2,660** | **~205** |
| Friends standing together | 51 / 72 / 54 | ~60 | 6–8 |
| Which planets look at which | 77 / 84 / 42 | ~50 | 6–12 |
| Which parts of life planets sit in | 105 / 95 / 105 | ~75 | 3 (+9 static lines) |
| How each planet works for you | 0 chart-specific | 0 | 9 static cards |
| Chart patterns & difficult placements | **28–30 yogas + 8 doshams** listed | — | — |
| Strengths & areas for care | 327 / 268 / 291 | ~225 | 7–9 |
| Big planet moves coming | 141 / 144 / 144 | ~118 | 6 |

**About 5,000 English words before the yoga list: roughly 21 minutes of reading.
The planet-positions tab alone is 80% of it:** 9 planets × 10–13 labelled
facet paragraphs, every one expanded, all at the same visual weight.

### 2.2 Why it is tiring (root causes)

1. **One tab carries the whole weight.** Each planet card prints all 10–13 facets at
   once. Below is the real *first* planet of synthetic chart A. A newcomer has to read
   the avastha degree band to reach the remedy:
   > *Life-stage in its sign (Baladi avastha): Mrita avastha — classically the weakest
   > stage … Kadagam is an even sign, where the order runs backwards (first 6° Mrita,
   > last 6° Bala); 5.02° falls in the 0°–6° band.*
2. **Organised by mechanism, not by question.** You have to know what "drishti" means
   before you know you want that tab. Nobody arrives asking "show me my house groups".
   They ask *who am I, what is running now, what is good, what should I watch, what is
   coming.*
3. **One visual grammar for everything.** Grey paragraph + chip row, ten times over. A
   positions card carries up to 8 chips. No image, no diagram, no number drawn as a
   shape. Nothing tells the eye where to land.
4. **Mechanics are mixed into meaning.** The takeaway and the derivation share one
   paragraph, so you cannot skim for the answer.
5. **It repeats the page above it.** §5 Planet positions, §6 Dashas, §7 Yogas &
   strengths and §8 Forecast already say much of this in friendlier form. §9 says it
   again in denser words. Reading the same fact three times is what makes the page feel
   endless.
6. **Developer text and machine codes reach the reader:**
   - Rasi and nakshatra **codes inside prose, in both languages.** The probe found 13
     distinct codes (`KADAGAM`, `POOSAM`, `MAGARAM`, `THIRUVONAM`, …) inside sentences.
     A Tamil reader sees Latin capitals in the middle of Tamil text. Source:
     `chart_explanation_service.py:1279-1280` (`{planet.rasi_name}`), `:1386`
     (nakshatra name), `:1854/1859` (`RASI_NAMES[...]`). The DXA-08 ratchet only scans
     frontend files, so it cannot see this.
   - Peyarchi renders `{event.fromRasi} - {event.toRasi}` raw
     (`dashboard-chart-explanation.tsx:1745`), which prints `KUMBAM - MAGARAM`.
   - Meta text shown to users: *"Yogas and doshams are reused from the already computed
     chart rules."*, *"This section connects Lagna, Moon sign, and the current dasha as
     the chart's working base."*, *"Full Dasa activation detail appears when backend
     explanation data is available."*
   - The teaser line *"5 planets in Kendra; strongest planet Sun; transit explanation
     ready."* is jargon used as the hook.
7. **"How each planet works for you" has no chart-specific prose.** It shows 9 cards
   keyed only on a role label, so every Simmam-lagna chart reads identically. It
   doesn't even say *which houses* each planet rules, which is the one thing an
   astrologer opens that tab for.

### 2.3 What is good and must survive

- Every sentence is **computed from the real chart**. This is the moat. No Barnum copy.
- Facets already carry **`tone: BOOST | CAUTION | NEUTRAL`**, a free colour and icon
  signal that is currently rendered only as a label colour.
- `scoreBreakdown` (the addable "why this score"), doctrine caveats (nodal drishti),
  paral counts, life-stage aware remedies, sign-edge notes.
- Bilingual end to end; the Tamil follows the almanac-term rulings already recorded.

---

## 3. The concept — "Story first, ledger behind"

**One payload, two lenses.** No content is deleted and no new astrology is invented.

| | **Story view** (default for most) | **Astrologer view** (toggle) |
|---|---|---|
| Organised by | 5 life questions ("chapters") | Today's 10 mechanism tabs |
| Leads with | A picture, a verdict, ≤ 2 sentences | Dense tables an expert scans |
| Shows | The 1–3 facts that matter most per question | Every field, uncapped |
| Strength | Band word + meter | Number + score breakdown |
| Words before first tap | **≤ 600 total, ≤ 120 per chapter** | Unbounded; it's the ledger |

Experts read **tables** faster than prose, so the Astrologer view gets *denser and
better*, not just "the old screen".

### 3.1 Design principles (the rules every card follows)

1. **One idea per card.** A card answers one question.
2. **Show, then say.** Every card leads with a visual (glyph, meter, chart overlay,
   timeline), then at most two sentences.
3. **Verdict → why → mechanics.** This is the existing product law, now applied here.
4. **Reading budget.** ≤ 120 visible EN words per chapter. Tamil must come in at or
   under the English count (it measures ~0.7×). The budget is a gate (FTR-17), not a
   guideline.
5. **Tone is colour + icon + word.** Never colour alone (WCAG 1.4.1).
6. **Motion explains, never decorates.** Animate only to show a relationship: an aspect
   line drawing from one planet to another, the dasha playhead sitting at today.
   Reduced motion shows the finished frame.
7. **Say it once.** If §3–§8 above already says it, link there instead of repeating it.
8. **House rules still apply:** active language only (no bilingual echo), Tamil almanac
   terms (கோச்சாரம், பரல், துஷ்டானம்), no accent left-border on cards, Nova tokens
   only, no emoji as icons.

---

## 4. Story view — five chapters

### 4.1 Where the ten tabs go

| Today's subtab | Story chapter | Astrologer view |
|---|---|---|
| What your chart is built around | **1 · Who you are** | Core identity table |
| Which parts of life planets sit in | 1 · Who you are (as chart highlight) | House-group table |
| How each planet works for you | 2 · Your nine planets (one plain role word) | **Lordship table** (role + houses ruled) |
| Where your planets are placed | **2 · Your nine planets** | Graha ledger |
| Friends standing together | 2 · Your nine planets (relationships overlay) | Conjunction + maitri table |
| Which planets look at which (natal) | 2 · Your nine planets (relationships overlay) | Full drishti table, **no 18 cap** |
| What is active for you now | **3 · What's running now** | Dasha-chain table |
| Which planets look at which (Guru/Sani transit) | 3 · What's running now | Transit table + parals |
| Chart patterns & difficult placements | **4 · Gifts & care** | Full yoga/dosham panel |
| Strengths & areas for care | 4 · Gifts & care | Summary + caveats |
| Big planet moves coming | **5 · What's coming** | Peyarchi table |

### 4.2 Panel layout (desktop; on mobile the rail scrolls and cards stack)

```
┌──────────────────────────────────────────────────────────────────────┐
│ YOUR CHART, READ FOR YOU                 [ Story | Astrologer view ] │
│ "Venus is leading your life right now — from your house of family    │
│  and money."                          ← headline composed from data  │
├──────────────────────────────────────────────────────────────────────┤
│ ① Who you are  ② Your nine planets  ③ Running now  ④ Gifts & care    │
│ ⑤ What's coming                 ← sticky chapter rail, lucide icons │
├──────────────────────────────────────────────────────────────────────┤
│  [ chapter content: visual first, ≤ 2 sentences per card ]           │
│                                                                      │
│                                   Next: Your nine planets  →         │
└──────────────────────────────────────────────────────────────────────┘
```

### 4.3 Chapter 1 — Who you are

```
┌───────────────┬───────────────┬───────────────┐
│ [zodiac art]  │ [zodiac art]  │ [nakshatra]   │
│ LAGNA         │ RASI (Moon)   │ STAR          │
│ Kadagam       │ Thulam        │ Poosam · 2    │
│ How you meet  │ Your mind and │ Your inner    │
│ the world     │ moods         │ nature        │
└───────────────┴───────────────┴───────────────┘
┌──────────────────────────────────────────────┐
│ [South Indian chart, houses tinted by group] │  ← tap a box → that
│  ● pillars (kendra) ● growth (trikona)       │    house's planets
│  ● care (dusthana)   legend = colour+icon+word│   + 1-line theme
└──────────────────────────────────────────────┘
```

- **Artwork already exists:** `ZodiacBadge` (12 gold AVIFs) and `NakshatraBadge` (27
  SVGs) are in the codebase.
- **Tamil-astrologer call:** a Tamil reader recognises the **South Indian square
  chart**, not a Western wheel. Reuse the existing `RasiChart` with a highlight overlay
  instead of inventing a wheel. (Its props need checking; it may need an `overlay`
  prop.)
- **Copy caution:** `coreIdentity.explanation` is meta boilerplate today. The pillar
  lines here are the *classical meaning of the term* (textbook and true for everyone),
  clearly labelled as such. The chart-specific part is *which* rasi, star and houses. We
  don't write personality blurbs we can't compute.
- Sign-edge notes (`lagnaEdgeNote`) stay, as a quiet "Birth time near a boundary" tag
  that expands.

### 4.4 Chapter 2 — Your nine planets

```
┌────────┬────────┬────────┐   Each tile: planet orb/glyph (reuse
│ ☉ Sun  │ ☾ Moon │ ♂ Mars │   HyPlanetOrbs palette) · one band word
│ Steady │ Strong │ Needs  │   + 3-segment meter · one life-area line
│ ▮▮▯    │ ▮▮▮    │ care ▮ │   · "● Active now" pulse if it leads
│ self & │ mind & │ effort │   a running period
│ body   │ mother │        │
├────────┼────────┼────────┤   Tap → expands in place:
│ ...    │ ...    │ ...    │     MEANING  1 sentence (synthesis facet)
└────────┴────────┴────────┘     WHY      ≤ 2 lines, chosen by tone
                                 [ Show all 12 details ▸ ]  → ledger rows
  [ Relationships ]  ← toggles a chart overlay: conjunction clusters
                       circled, aspects drawn as arrows (solid =
                       friendly, dashed = needs care, + label)
```

**Facet triage.** This rule turns ~420 words per planet into ~50 visible:

| Facet key | Story layer | Rule |
|---|---|---|
| `synthesis` | **Meaning** | Always; it's the planet's one-line verdict |
| `role` | Meaning (plain role word) | "Helper for you" / "Handle steadily". New copy, needs review |
| `activation` | Meaning badge | Only when `BOOST` (leads a running period) |
| `strength` | **Why** | Shown as band word + meter, no number |
| `placement` | Why | "Lives in House 2 · family, speech, money" + chart highlight |
| `condition` | Why | Only when `CAUTION` (combust, war, …) |
| `navamsa` | Why | Only when `BOOST` or `CAUTION` |
| `company` | Why | Only when it has co-tenants |
| `lordship`, `avastha`, `nakshatra` | Detail | Behind "Show all details" |
| `transit` | → Chapter 3 | Moved; it's a *now* fact, not a *who* fact |
| `remedy` | → Chapter 4 | Collected and de-duplicated |

Pick at most **2 Why lines**: CAUTION first, then BOOST, then NEUTRAL. This puts the
lines that change the verdict in front of the reader.

### 4.5 Chapter 3 — What's running now

```
MAHADASHA  Venus   ████████████░░░░░░░░░░  2019 ──●── 2039   Steady
BHUKTI     Moon    ███░░░░░░░                ●               Support
ANTARAM    Saturn  █░░                       ●               Care
                                   ● = today (playhead)

┌ Guru in the sky now ────────────┐ ┌ Sani in the sky now ────────────┐
│ 9th from your Moon · supportive │ │ 4th from your Moon · Ardhashtama│
│ Parals here: ●●●●●●○○  6/8      │ │ Parals here: ●●●○○○○○  3/8      │
│ Touches: your Mercury (speech)  │ │ Touches: —                      │
└─────────────────────────────────┘ └─────────────────────────────────┘
                    Full timeline in §6 Dashas →   (say it once)
```

- **Parals as 8 dots** is a natural visual: the classical 0–8 scale *is* a dot count.
- Lead with **house from Moon** (peyarchi practice; existing T-38/T-39 ruling), with the
  Lagna house second.

### 4.6 Chapter 4 — Gifts & care

Two columns: **Gifts** (strongest planet + caveat if any, top positives, up to 3 yogas)
and **Handle with care** (lowest planet with a reassurance frame, cautions, present and
uncancelled doshams with their status wording). Footer: "All 30 patterns →" opens the
Astrologer yoga panel, and "Remedies →" links to §7 (say it once).

**Why cap at 3:** the probe found **28–30 yogas per chart**. A list of 30 tells a lay
reader "everyone has these", which costs trust. Ranking rule (Q4): yogas whose period
is *active by dasha timing* first, per the 2026-09-23 status-axes ruling ("Active" =
dasha timing only), then the panel's existing order.

### 4.7 Chapter 5 — What's coming

```
  NOW ──────●────────────●──────────────●──────────────●──── 2028
          Rahu          Guru           Sani           Ketu
        5 Dec 2026    May 2027        …              …
        in 62 days
      [Kumbam art → Magaram art]
      3rd from Moon: effort & courage magnified
      [ Sade Sati begins ] ← sani-cycle badge when present
```

The from→to artwork uses rasi **numbers** through `rasiDisplayName`, never the raw
`fromRasi` code (fixes FTR-02).

### 4.8 Chapter rail and the glossary

- Five numbered chapters with lucide icons (`UserRound`, `Orbit`, `Timer`, `Gift`,
  `CalendarClock`). The rail is sticky and scrolls horizontally on mobile.
- Each chapter ends with **"Next: …"**, so the reading has a path and an end.
- **Glossary chips:** a term such as *Kendra*, *Paral*, *Antaram* or *Ardhashtama*
  opens a one-line popover. Same language only, no echo. Each definition is written
  once (`reading-glossary.ts`), so every surface explains a term the same way.

---

## 5. Astrologer view (the toggle)

- **Control:** a segmented switch at the top of the panel, `Story | Astrologer view`.
  Tamil wording is open (Q1); pending native review.
- **Default:** `TRADITIONAL` → Astrologer; `BEGINNER` / `BALANCED` → Story (Q2). The
  choice is remembered per device (`localStorage`, wrapped in try/catch, render-safe
  without it) and **does not** rewrite the global mode (Q3).
- **Content:** every field rendered today, re-laid as ledgers:
  - **Graha ledger:** Graha · House · Rasi · Star-pada · D9 · Dignity · Avastha · Role ·
    Score · Flags. Row expands to all facets + `scoreBreakdown`.
  - **Lordship table:** role *and the houses each graha rules from this Lagna*. This
    fixes root cause 7.
  - **Drishti table:** source → target, aspect type, every row (the 18-chip cap goes).
  - Conjunction + maitri, dasha chain with dates, Guru/Sani transit with parals,
    peyarchi table, the full yoga/dosham panel, the summary with caveats.
  - **Method note first.** Astrologers want the school before the reading:
    whole-sign houses, node aspects 5/7/9, ayanamsa.
- **Classical-detail panels below §9 follow the toggle.** In Astrologer view the
  `classical-detail` gate (Vargas, Shadbala) opens. The `experimental-dasha` gate keeps
  its own toggle, because it is a different claim and its blurb says so.

---

## 6. Visual language & motion

| Element | Source | Notes |
|---|---|---|
| UI icons | `lucide-react` (already a dependency) | Import per icon |
| Planet glyphs/orbs | `HyPlanetOrbs` palette, `CelestialGlyphNova` | Reuse; no new colours |
| Rasi / star art | `ZodiacBadge`, `NakshatraBadge` | Already shipped |
| Chart map | `RasiChart` (South Indian) + overlay | Tamil convention |
| Meters | 3-segment meter (as in Bhava palan) | No raw numbers in Story |
| Paral dots | New tiny SVG, 8 dots | Token colours |
| Dasha bars + playhead | New SVG | Reuse `hy-ring-pulse` for the playhead |
| Aspect arrows | New SVG overlay on `RasiChart` | `stroke-dashoffset` draw-in |
| Tone | `--color-high` / `--color-mid` / `--color-low` + `CheckCircle2` / `AlertTriangle` / `Dot` + a word | WCAG 1.4.1 |
| Chapter enter | Existing `nova-rise` keyframe | ≤ 300 ms |

- **Replace the emoji icons** (`❤️💼💰🧠` in `dashboard-hybrid-parts.tsx:257-267`) with
  lucide `Heart`, `Briefcase`, `Coins` and `Brain`. Emoji render differently on every OS
  and ignore the theme.
- **Motion budget:** ≤ 400 ms per transition. Nothing loops except the "Active now" pulse.
  The global `[data-ui="nova"]` reduced-motion guard already stills everything. Import
  framer-motion **directly**, never through the `components/ui` barrel (past
  ChunkLoadError).
- **Axe runs after fades settle.** Mid-animation pixels have failed contrast checks
  before.

---

## 7. Copy system (Tamil-astrologer lens)

- **Card budget:** headline ≤ 12 words; body ≤ 2 sentences, ≤ 35 words.
- **Voice:** second person, present tense, concrete life areas. Name a term once, with a
  glossary chip, then use plain words.
- **Headlines are templates over chart fields**, never free prose. Every one must pass
  the existing test: *"would this sentence read differently for a chart where this
  planet is debilitated in the 6th?"* If it wouldn't, cut it.
- **"Weak" always carries a reassurance frame, and nothing is falsely "all good".** This
  is the humanization audit's guardrail.
- **New strings** (chapter names, plain role words, pillar meanings, glossary, toggle
  label) are flagged `// New Tamil, pending native review` and listed for the
  astrologer.
- **Nothing in the 8th-house / longevity family** (permanent refusal, Q4 of Bhava palan).

---

## 8. Architecture

- **No API shape change for P1–P3.** Both views read the existing
  `ChartExplanationData`, so the four-surface contract is untouched. P0's backend fix
  changes prose *content* only. FTR-02 adds two optional fields, which is additive and
  coordinated (see the item).
- **Split the 1,766-line monolith** into `web/components/chart-reading/`:
  - `reading-panel.tsx`: shell, toggle, chapter rail
  - `story/chapter-*.tsx`: five chapters
  - `astrologer/*.tsx`: the ledgers (lazy `dynamic()` chunk; Story users never download it)
  - `graphics/*.tsx`: paral dots, dasha bars, aspect overlay, meters
  - `reading-selectors.ts`: **pure functions** (facet triage, headline templates, yoga
    ranking, remedy de-dupe, say-it-once checks). No React, unit-tested.
  - `reading-glossary.ts`: bilingual term definitions
- `ChartExplanationPanel` keeps its export and props, so `dashboard-family-shared.tsx:276`
  and the existing tests keep working while the internals move.
- **Mobile:** nothing in `mobile/src` consumes the explanation today, so there is no
  parity break. The selectors are written to move to `packages/shared` when mobile gets
  this surface (FTR-20).
- **Client first, server later:** headline and triage start client-side for fast
  iteration, as humanization Phase 2 did. FTR-21 moves them into
  `chart_explanation_service.py` for a single source of truth.

---

## 9. Work items

### P0 — Fix what is wrong today (independent; ship first)

- [x] **FTR-01 — Rasi/nakshatra codes inside backend prose (both languages).**
  *Problem:* 13 codes such as `KADAGAM` and `POOSAM` reach readers mid-sentence, Tamil
  included. *Fix:* render localised names at `chart_explanation_service.py:1279-1280,
  1386, 1854, 1859` (Tamil names in `ta`, title-case transliteration in `en`). Add a
  backend ratchet test that walks every `BiText` in the payload for 3 synthetic charts
  and fails on any rasi/nakshatra code. *Acceptance:* the ratchet fails on today's code
  (baseline run with the fix removed) and passes after; recorded blind spot: it checks
  codes, not English-name-in-Tamil-text.
- [x] **FTR-02 — Peyarchi from→to prints raw codes** (`dashboard-chart-explanation.tsx:1745`).
  *Fix:* render through `rasiDisplayName(number, lang)`. That needs the rasi number:
  add optional `fromRasiNumber`/`toRasiNumber` to `ChartExplanationPeyarchiEvent`
  (additive; update `packages/shared` types and grep `mobile/` per the contract rule).
  *Acceptance:* Tamil mode shows கும்பம் → மகரம்.
- [x] **FTR-03 — Developer and meta text shown to users.** Replace the three meta
  strings and the jargon teaser (§2.2 item 6) with reader-facing copy, or omit them.
- [x] **FTR-04 — Emoji used as icons** in the life-areas card → lucide icons.

### P1 — Toggle + Astrologer view (no content loss, lowest risk)

- [x] **FTR-05 — Split the monolith** into `chart-reading/` (§8). Behaviour stays
  identical; existing tests pass unchanged.
- [x] **FTR-06 — Astrologer view ledgers** (§5): graha ledger, lordship table with houses
  ruled, uncapped drishti table, method note first. *Acceptance:* a field-inventory
  checklist shows every field rendered today is reachable in ≤ 2 taps.
- [x] **FTR-07 — `Story | Astrologer view` toggle**: mode-seeded default, per-device
  memory, survives missing storage. *Acceptance:* unit tests for all three modes and
  for storage throwing.
- [x] **FTR-08 — The classical-detail gate follows the toggle**; the experimental gate
  stays separate.

### P2 — Story view

- [x] **FTR-09 — Chapter shell + rail + data headline + "Next" path.**
- [x] **FTR-10 — Ch 1 Who you are:** three pillars with artwork + `RasiChart` house-group overlay.
- [x] **FTR-11 — Ch 2 Your nine planets:** tile grid, facet triage (§4.4), in-place expand.
- [x] **FTR-12 — Ch 2 Relationships overlay:** conjunction clusters + aspect arrows on the chart.
- [x] **FTR-13 — Ch 3 Running now:** dasha bars with playhead; Guru/Sani from-Moon cards with paral dots.
- [x] **FTR-14 — Ch 4 Gifts & care:** two columns, top-3 yoga rule (Q4), present doshams only.
- [x] **FTR-15 — Ch 5 What's coming:** peyarchi timeline with artwork, countdown, sani-cycle badge.
- [x] **FTR-16 — Glossary popovers**, bilingual, one definition per term.

### P3 — Say it once, motion, gates

- [x] **FTR-17 — Reading-budget gate.** A test renders the Story view for 3 synthetic
  charts in **EN and TA** and fails if any chapter is over 120 visible words (TA ≤ the EN
  count). *Baseline:* point it at today's panel and confirm it fails (Positions ≈ 3,800).
  *Blind spot recorded:* word count cannot judge clarity, and jsdom sees no layout.
- [x] **FTR-18 — Say-it-once pass** against §3–§8: where a fact is already on the page,
  link to it instead of restating it.
  *Done (second pass, 2026-10-04), see §14.* Rule: a **sentence** is said once per
  page; a name or number may recur as a label. Gate: `e2e/chart-reading-say-once.spec.ts`
  (baseline failed on 2 repeated EN sentences in Ch 4, both from `summary.positives/cautions`,
  already printed by §4's cards). §8's transit card also graded Guru/Sani by a different
  rule than Ch 3; it now reads the ruled table.
- [x] **FTR-19 — Motion pass** (aspect draw-in, playhead, chapter enter) with a
  reduced-motion check; axe runs after fades settle.

### P4 — Later

- [~] **FTR-20 — Mobile reading parity** (move the selectors to `packages/shared`).
  *First version built (§14):* `mobile/app/reading/[id].tsx`, five chapters, text-first,
  reached from the jadhagam screen. Not ported: the chart map, aspect arrows, dasha bars and
  glossary popovers. Not seen on a device.
- [x] **FTR-21 — Move headlines and triage server-side** into `chart_explanation_service.py`.
  *Built (§14):* `app/services/reading_story.py` → optional `story` field; web prefers it,
  mobile reads only it.
- [x] **FTR-22 — "Share with my astrologer":** export the Astrologer view through the
  existing jadhagam PDF path. *Built (§14):* `?detail=astrologer`.
- [x] **FTR-23 — Graha illustrations**, if Q6 says yes. *Closed by Q6, nothing built:* Q6
  chose abstract celestial art (the existing orbs). Navagraha deity art remains possible only
  with astrologer and cultural review, and that needs a person.

---

## 10. How we'll know it worked

| Measure | Today | Target |
|---|---|---|
| Visible EN words before any tap (Story) | ~5,000 across tabs | **≤ 600** |
| Largest single tab/chapter | 4,036 words | **≤ 120** |
| Codes in prose (EN + TA) | 13 | **0** (ratchet) |
| Lay-reader task test: 5 people, ≥ 2 Tamil-only — *"Which planet runs your life now?"*, *"Anything big changing this year?"*, *"Your strongest point?"* | not run | ≥ 4/5 correct, < 30 s each |
| Astrologer test: 1 practising astrologer finds any of today's fields | — | ≤ 2 taps, nothing missing |

Gate blind spots go next to each PASS (house rule: a gate proves its own check, not the
item). jsdom cannot see motion, focus or non-text contrast, and the Tamil needs a native
reader.

---

## 11. Decisions (owner delegated, 2026-10-04)

Recorded as taken. Every row below is a default the owner can overturn in one line.

| # | Question | My recommendation |
|---|---|---|
| Q1 | Toggle names. EN: *Story / Astrologer view*. TA: *எளிய விளக்கம் / ஜோதிடர் பார்வை*? | Yes. Tamil to native review |
| Q2 | Default view per mode | `TRADITIONAL` → Astrologer; others → Story |
| Q3 | Does the toggle rewrite the global mode? | **No.** It's a local view preference |
| Q4 | Which 3 yogas does Story show? | **Changed from the proposal.** Chapter 4 ranks by *birth-chart standing* (`yogaStanding`, Strong → Moderate), the same function §7's chips use, so one yoga never reads two ways on one page. The dasha-timing axis moved to Chapter 3 as "Yogas this period switches on" (`isRunningInDasha`), keeping "Active" for timing only (2026-09-23 status-axes ruling). Cancelled adverse yogas are excluded from "watch". **Astrologer to confirm.** |
| Q5 | Planet strength in Story view | Band word + meter, **no number** (consistent with the Bhava palan Q2 ruling) |
| Q6 | Illustrations: Navagraha deity iconography, abstract celestial, or none | **Abstract celestial** (our orbs). Deity art only with astrologer + cultural review |
| Q7 | Keep the panel at §9 (bottom)? | Keep it. FTR-18 removes the overlap with §5–§8 |
| Q8 | Open on load? | **Adjusted:** the panel opens on load in both lenses. The Astrologer view opens on its short first tab, one section at a time, so it is not the wall Phase 4 collapsed. The legacy family tab (`dashboard-family-shared.tsx`) keeps click-to-open. |

---

## 12. Risks

- **A friendlier §9 duplicates §5–§8 more visibly.** FTR-18 is not optional polish.
- **Barnum creep** in headlines and plain role words. Use templates only, plus the
  "debilitated in the 6th" test.
- **Tamil length** breaking the card budgets. The FTR-17 gate measures Tamil separately.
- **Astrologer trust** if the Story view simplifies wrongly. Keep the toggle visible and
  the Astrologer view complete (FTR-06 inventory).
- **Bundle and motion cost.** Lazy-load the Astrologer chunk, import framer-motion
  directly, keep the motion budget.

**Recommended order:** P0 (small, fixes real defects now) → P1 (the toggle plus a
complete Astrologer view, so astrologers lose nothing) → P2 one chapter at a time,
starting with **Chapter 2** (it is 80% of today's density) → P3.

---

## 13. Build log (2026-10-04)

### What shipped

| Item | Where |
|---|---|
| FTR-01 codes in prose | `chart_explanation_service.py` (placement facet, navamsa facet, bhava text) and `nakshatra_lord_dynamics.py` now name rasis/stars per language via `display_names`. The `nakshatra_name` parameter of `nakshatra_lord_note` is gone (it carried the code into both sentences). Ratchet: `tests/test_chart_explanation_display_names.py`. It walks every BiText for 3 synthetic charts and fails on a Latin rasi/nakshatra name inside Tamil text (any case) or an UPPER_CASE code inside English text. |
| FTR-02 peyarchi codes | No API change was needed: `rasiDisplayName` already resolves a code. New `rasiNumber()` in `lib/chart-utils.ts` gives the index for artwork. |
| FTR-03 meta copy | Two backend strings plus the panel teaser and the "backend data" fallback. |
| FTR-04 emoji | `dashboard-hybrid-parts.tsx` life-area buckets now use lucide `Heart`/`Briefcase`/`Coins`/`Brain`. |
| FTR-05 split | `web/components/chart-reading/`: `reading-helpers.ts` (pure, moved verbatim), `reading-atoms.tsx`, `astrologer-view.tsx` (the ten tabs, moved verbatim), `story-*.tsx`, `reading-selectors.ts`, `graphics.tsx`, `use-reading-view.ts`, `chart-reading.css`. `dashboard-chart-explanation.tsx` is now a ~230-line shell with the same export and props. |
| FTR-06 ledgers | `astrologer-ledgers.tsx`: graha ledger, lordship ledger (houses ruled from the Lagna), uncapped drishti table, method note first. |
| FTR-07/08 | `Segmented` lens toggle; `useReadingView` (mode-seeded, per-device, storage-safe). Hybrid §9 owns the lens so the classical-detail gate opens with the Astrologer view. |
| FTR-09..15 | Five chapters. See §4. |
| FTR-16 | Six glossary terms added (`antaram`, `kendra`, `trikona`, `dusthana`, `drishti`, `paral`), reused through the existing `GlossaryTerm`. |
| FTR-17 | `story-reading-budget.test.tsx` runs on a captured synthetic dashboard bundle (`__fixtures__/synthetic-readings.json`, 148 KB, trimmed to rendered fields). |
| FTR-18 | Chapters link to §5 planets, §6 dashas, §7 remedies and §8 forecast via the hybrid's existing `jumpTo`. |
| FTR-19 | One-shot draw-in / grow / rise. The base style is the finished frame, so the global reduced-motion guard leaves a complete picture. |

### Measured (synthetic chart A, before any tap)

| Chapter | EN words | TA words |
|---|---|---|
| Who you are | 112 | 89 |
| Your nine planets | 48 | 40 |
| Running now | 69 | 59 |
| Gifts & care | 99 | 65 |
| What's coming | 83 | 67 |
| **Total** | **411** | **320** |

The old panel's Positions tab measured about 4,000 EN words. Tapping a planet adds 56 words.

### Gate baselines (run with the fix removed)

- Display-name ratchet: failed on the pre-fix code with 13–25 leaked names per chart. It passes after the fix.
- Reading budget: with `whyFacets` mutated to return every facet, a tapped planet added **360** words and the gate failed. The file also asserts that the Astrologer Positions tab is still >1,200 words, so a blind measure would show up.

### Departures from the plan

- ~~**No lazy chunk for the Astrologer view.**~~ Done in the second pass (§14): `next/dynamic`, with the four tests that reach it made async.
- **The chart map is a new SVG/HTML grid (`SouthGrid`), not `RasiChart` with an overlay.** `RasiChart` owns its own explain panel and selection state, and aspect arrows needed an overlay layer it does not have. The cell layout is the same table.
- **Chapter 1 keeps the copy honest.** The pillar lines are the *classical meaning of the term*. The chart-specific facts are which rasi and star fill each pillar and where the Lagna lord sits.

### Blind spots (recorded beside the PASS)

- **Tamil is unread by a native reader.** Every new string is marked `New Tamil, pending native review`.
- **Word counts cannot judge clarity, and jsdom has no layout.** The rendered check was a screenshot pass on the isolated e2e stack (`scripts/ux-audit-stack.ps1`), desktop and 375 px, EN and TA. It does not cover axe, focus order or light theme.
- **The four review items were ruled on 2026-10-04** (recorded as DD-16 in `docs/DOCTRINE_DECISIONS_V1.2.md`, an owner ruling with provisional source tiers):
  - **D1:** the Lagna-lord line is confirmed.
  - **D2:** Sani is supportive only in 3/6/11 and needs care everywhere else. This also re-graded mobile's `moonHouseImpact` and the backend daily line, which had called Sani "neutral" or "quiet" there.
  - **D3:** Guru 1/3/4/10 "Mixed" is kept as Vinaadi grading, with the classical set held beside it.
  - **D4:** top yogas are computed from validity → natal strength → activation → activation score, as `topNatalYogas` (Ch 4) and `topActiveYogas` (Ch 3). D4's "practical impact" key is open as O-25.
- **Mobile has no reading surface yet** (FTR-20).

---

## 14. Second pass (2026-10-04 → 05): the open items

Every item §13 left partial, unrun or unstarted, in the order taken. **Still not committed.**

### Finished partials

| Item | What changed | Gate / evidence |
|---|---|---|
| Budget gate on one chart | Fixture now holds **two** synthetic charts (A, B). The capture script moved into the repo: `scripts/capture_reading_fixture.py`. It reproduces the fixture byte for byte. | `story-reading-budget.test.tsx` asserts ≥ 2 charts. New check: **no Tamil chapter is longer than its English twin** (§3.1). Inverted run failed, restored run passed. |
| Lazy Astrologer view | `next/dynamic` in `dashboard-chart-explanation.tsx`; skeleton while loading. Four tests now wait for it (5 s, since the first transform measured 1.06 s under load). | The browser sweep below opens the Astrologer view and fails if its tablist never arrives. That blocked path is DXA-35's known CSP issue. |
| FTR-18 say it once | Rule: **a sentence once per page; a name may recur as a label.** Ch 4 on the Family page no longer prints `summary.positives/cautions`, because §4's cards own them. It links there instead (`#hy-chart-highlights`). Both read one helper (`highlightLines`, `HIGHLIGHT_CAP`), so lines past §4's cap of 5 stay in Ch 4's "more notes". The legacy family tab has no §4, so it keeps them. | `e2e/chart-reading-say-once.spec.ts`. **Baseline (before the fix): failed, 2 repeated EN sentences, both from the summary.** Unit test in the budget file covers both hosts. |
| §8 vs Ch 3 grading | §8's transit card graded Guru/Sani by a generic upachaya rule. One page said Sani in the 7th was "Steady" (§8) and "Needs care" (Ch 3). §8 now calls `gocharaGrade` for Guru/Sani; other planets keep the generic rule, because no table has been ruled for them. All badge words follow the D2 vocabulary (Supportive / Mixed / Needs care / Steady). | No unit test on the card yet. |

### Defects the new gates found (fixed)

- **Chart map house numbers:** `--color-faint` measured 3.9:1 on the tinted cells (axe, light theme). Fixed with `--color-text`.
- **Legend glossary chips:** 16 px targets 20 px apart (WCAG 2.5.8). Fixed by giving each row `minHeight: 24px`.
- **Yoga panel** (`NovaYogaDoshamPanel`, also in Life Areas): micro-labels at `opacity: 0.65` measured 2.5:1. A translucent pill on its own translucent card doubled the tint (4.31:1). Fixed: opacity removed and `-bg-solid` grounds used.
- **Yoga/dosham card rows overflowed at 375 px** (page 490 px wide). The pills could not wrap. Fixed: wrap + `minWidth: 0`.
- **Ledger scrollers were not keyboard-reachable** (axe `scrollable-region-focusable`). Fixed: `role="region"` + label + `tabIndex=0`.
- **Tamil only: the Astrologer yogas tab pushed the page 31 px wide at 375 px.** Its `display: grid` had an implicit `auto` column, which grew to the panel's min-content. English fit; Tamil did not. Fixed with `gridTemplateColumns: minmax(0, 1fr)`. The overflow check now names the elements past the edge, ignoring content inside a scroller that fits.
- **Test-harness lesson:** in e2e, Tamil mode needs the *account* language (`PATCH /settings/ui`) as well as the stored preference. The account value comes back on session load and overrides localStorage/cookie. The first Tamil runs hung on labels that never rendered. Every action in both specs is now bounded at 30 s.
- **Seven registry yogas had no display name**, so web and mobile printed raw codes (`KARTARI_YOGA` on synthetic chart A, in both languages). Added the registry's own names to `yogaDisplay.ts`. Ratchet: `tests/test_yoga_display_parity.py` (registry coverage + backend copy parity). Baseline: 7 missing.
- **The full backend suite found two tests reading moved files** after the FTR-05 split (`test_chart_explanation_bhavas.py`, `test_marker_label_coverage.py`). The ~700 targeted tests had missed them. Both are repointed.
- **Jadhagam PDF (summary edition) leaked names:** English header labels and raw graha codes in Tamil. Daily section never received `lang`. All fixed (see FTR-22).

### P4

- **FTR-21:** `app/services/reading_story.py` builds the optional `story` field: headline, per-planet why-facet keys and active-now, top natal/active yogas, care column. Keys, not prose, except the headline. Web selectors prefer it and fall back locally. Copied tables (house meanings, adverse set, rasi names) have parity tests in `tests/test_reading_story.py`. **Cross-runtime gate:** `reading-story-parity.test.ts` requires server and client to give identical answers on both charts, EN and TA. It passes.
- **FTR-20 (first version):** `packages/shared/src/reading.ts` now owns chapter titles, pillar and house meanings, sign lordship, strength words and almanac rasi names. Web re-exports them from there. `getChartExplanation` is a shared wrapper (path and verb checked against the route decorator). `mobile/app/reading/[id].tsx` renders the five chapters from the server's picks and is reached from the jadhagam screen. Test: `mobile/__tests__/reading.screen.test.tsx` covers every chapter in EN/TA with no engine code and no Latin name in Tamil. **Not ported:** chart map, aspect arrows, dasha bars, paral dots, glossary popovers. **Not seen on a device.**
- **FTR-22:** `GET /charts/{id}/export/pdf?detail=astrologer` (additive; `summary` is unchanged) appends: method note, graha ledger, lordship, uncapped drishti, dasha chain, formed yogas/doshams, upcoming peyarchi. All names go through display tables, including `app/calculations/yoga_display.py`, which is parity-tested against the shared table. URL shape: `jadhagamPdfPath` in `packages/shared/src/api/charts.ts`, used by web (`ShareWithAstrologer` in the Astrologer view) and by mobile (second button on the jadhagam screen). Ratchet: `tests/test_pdf_export_astrologer.py`. **Baseline with the graha-name fix removed: failed, 9 codes inside the Tamil appendix.**
- **FTR-23:** closed by Q6, nothing built.

### Runs (local; CI is authoritative)

| Suite | Result |
|---|---|
| Backend, full (`pytest -q`, coverage gate) | **5,762 passed, 16 skipped, 0 failed** (47 min). It imported the backend before the FTR-21/22 edits, so the touched files were re-run on the final code: **356 passed, 9 skipped** (explanation, PDF, contract, parity, bundle, gochara). |
| Web vitest, full | **133 files, 1,384 passed** |
| Web lint · colour ratchet · `tsc` (web, mobile, shared) | clean · passed (333 known, 0 new) · clean |
| Mobile jest, full | **16 suites, 118 passed.** `birth-details.screen.test.tsx` is flaky: 2 tests failed in 2 of 4 full runs (once under load, once quiet). That screen was not touched here. |
| Mobile touch-target audit | Already red before this work (104 findings, all in untouched files; none in `reading/` or `jadhagam/[id]`). Baseline not refreshed. |
| Playwright `dashboard-render-pass` + `family-charts-no-vault` (edited heading) | Final run: 9/10. The one failure is DXA-35: a CSP refusal on the **Journal** tab's lazy chunk in `next dev` (pre-existing, unrelated). |
| Playwright `chart-reading-a11y` (axe WCAG 2.0–2.2 A/AA + overflow, every Story chapter, a tapped planet, all 10 Astrologer tabs; EN/TA × light/dark, plus 375 px) | **6/6 passed** on the final code (2026-10-05). Before the fixes: house-number contrast, legend target size, yoga-pill contrast, 375 px overflow (EN and TA) and unfocusable scrollers all failed. Blind spots: axe cannot see non-text contrast (meters, aspect lines, paral dots) or focus order; one synthetic chart; `next dev`, not a production build. |
| Playwright `chart-reading-say-once` | **EN and TA passed** after FTR-18; baseline failed (2 EN sentences). Blind spot: exact sentences only, so a paraphrase passes; pre-tap text only. |

### Still open, and why

- ~~**O-25 "practical impact"** in yoga ranking needs an astrologer ruling.~~ **Ruled 2026-10-05** (owner-passed AI review; DOCTRINE_DECISIONS v2.0, DD-16 D4). Lasting gifts no longer rank by the running dasa; both lists break ties on a server-computed `structuralReach`; ADHI_RAJA_GRADE is kept out of both. Gate: `reading-selectors.test.ts` (the review's A/B/C case) **failed with activation restored as a key, passed without it**; `tests/test_reading_story.py` pins the server twin and the reach formula; the fixture was re-captured and the parity test passes. Blind spot: reach cannot see per-family classical results, and two yogas formed by the same grahas tie.
- **Native Tamil review** of every new string, including the PDF column labels and the mobile screen. An AI review (2026-10-05) settled T1–T4 and the 8th-house line, and those are applied. No named human has read the copy yet.
- **Device pass** for mobile: the reading screen and the "Needs care" label.
- **FTR-20 graphics** on mobile (see above).
- **Web/mobile English rasi names differ elsewhere on mobile.** `RASI_LIST` gives "Aries" while web and the new reading give "Mesham". This predates this work and is recorded, not changed.
- **DXA-35** CSP refusals on lazy chunks (now including the Astrologer chunk) are still undiagnosed.

