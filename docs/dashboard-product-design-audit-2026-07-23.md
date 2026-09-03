# Vinaadi — Dashboard Product-Design Audit & Revamp

**Author's lens:** chief product design (25 yrs, Apple / Google / Tesla)
**Date:** 2026-07-23
**Scope:** the signed-in dashboard — every tab, sub-tab, view, and overlay.

---

## 0. How I audited

I read the IA backbone (`web/lib/dashboard-tabs.ts`, `web/components/dashboard-workspace.tsx`,
`web/components/dashboard-hero.tsx`) and walked every tab component and its second-level
structure. Below is the **actual surface I found**, not the sitemap on paper.

### The real map

| Level 1 (nav) | Level 2 | Pattern used |
|---|---|---|
| **Today** (`personal`) | 6 stacked sections: hero+score → activity board → sunrise timeline ribbon → life-areas+dasa row → family+remedy row → deep-dive bridge | vertical scroll |
| **Calendar** | Panchangam · Monthly · Muhurta (Monthly has its own 3-card control rail) | segmented toggle |
| **Family & Charts** (`family`) | single-scroll section rail: members → planet orbs → bhava table → bhukti timeline → Sani cycle → forecast. **Absorbed the old Transit & Dasha tab.** | section-rail scroll |
| **Goals** (`plan`) | Goals · Events · What-if · Decisions | rounded pills |
| **Life Areas** | Overview · Predictions · Chances & Cautions · Yogas & Doshams · Remedies · Full report | flat pills |
| **⋯ More** | **Tools** (9 cards) · **Explore** (5 categories) · QA (dev) | dropdown → card grid |
| **Settings** (corner) | Setup & Family · Account · Life context · Experience · Appearance · Notifications · Journal & Data · Privacy & Legal · Danger Zone | left rail |
| **Journal** | Write · Entries · Reflections | flat pills |

**Tools (9):** Jadhagam Generator · Annual Wrapped · Retrospective · Muhurta Finder ·
Panchangam Planner · Indraiya Rasipalan · Activity Timing · Varshaphala · Compatibility.

**Explore (5):** Nakshatram · Dosham · Yogam · Guide · Learn (each list → detail).

**Overlays:** Ask Vinaadi, Prasna, Guest chart modal, Edit member/profile, Feedback, Life-Mode picker.

### The number that matters

- **~51 distinct destination-states** a user can land on (11 primary + ~40 second-level).
- **7 different second-level navigation patterns** (segmented toggle, flat pills, rounded pills,
  card grid, category cards, section-rail, left rail) — for the *same job*: "switch view within a tab."
- **654 inline `style={{…}}` blocks** across the tab files, on top of **117 design tokens** that
  already exist in `dashboard-nova.css`. Tokens exist; a **component layer that uses them does not**.
  The only shared "chip" components are `member-chip` and `streak-chip` — no shared TabStrip,
  Segmented, Pill, Card, or Score primitive.
- **Journal is orphaned** from primary nav — reachable only via "go to journal" links inside other tabs.
- Tab-switch transition is **0.42s** (`dashboard-workspace.tsx:1479`) — ~2× too slow for a utility app.

---

## 1. The 90-second verdict

Vinaadi has a **world-class engine wearing a taxonomy-first coat of paint.** The astrology
computation, the bilingual seriousness, and the Nova visual language are genuinely strong. But
the dashboard is organized the way the *codebase* is organized ("Tools", "Explore", "Life Areas",
"Charts") — **by category of feature, not by what a person came to do.** The tell is in your own
history: the repo carries **~15 dashboard/IA "audits" and "consistency" passes.** You don't re-audit
a structure that's right. Re-auditing every few weeks is the symptom; **category-first IA with no
shared component system** is the disease.

A chief PD does three things here, in order:

1. **Re-cut the IA around intent, not category** (fewer, verb-shaped destinations).
2. **Build the missing component layer** (one Segmented, one Card, one Score, one TabStrip) so the
   7 nav patterns collapse to 1 and the 654 inline styles collapse toward 0.
3. **Make "today's answer" the product**, and demote everything else to depth-on-demand.

---

## 2. What is genuinely strong (keep, protect)

- **Engine depth & doctrine.** Shadbala, vargas, conditional dashas, Kalachakra, synastry,
  varshaphala — this is a real jyotish engine, not a horoscope toy. That is the moat.
- **Bilingual as a first-class concern.** The recent "no title echo / no co-render" work is the
  *right* instinct — render in the active language, cleanly. Protect it with a system (§5), not vigilance.
- **The "one canonical score" instinct on Today** (`dashboard-today-tab-nova.tsx:297`). Correct. The
  problem isn't this score — it's that three *other* scoring systems compete with it (§4.4).
- **Family & Charts as a single-scroll graphical page.** The section-rail direction is good; it just
  needs to stop being an AND-tab (§4.2).
- **Nova motion & celestial ambient.** Beautiful. Just needs a speed/consistency pass (§6).

---

## 3. The five systemic problems

### 3.1 Navigation is category-first, so it never stops growing
7 top tabs + a **"More" catch-all** + Settings + an orphaned Journal. "More" is where features go to
die, and it currently hides **Tools and Explore — two of your richest areas.** Category labels
("Tools", "Life Areas") give **zero information scent**: a user who wants "is Thursday good for the
housewarming?" has to *know* that lives under Calendar → Muhurta, or Tools → Muhurta Finder, or
Goals → Decisions. It lives in all three.

### 3.2 Conceptual duplication across tabs (the "AND-label" smell)
- **"Family & Charts"** is two mental models bolted together — and it *also* absorbed Transit & Dasha.
  That's four models in one tab. An AND-label is an unresolved IA decision left as a label.
- **Muhurta** appears in Calendar, in Tools (Muhurta Finder), and as Goals → Decisions.
- **Panchangam** is a Calendar view *and* a Tool ("Panchangam Planner").
- **Compatibility/Porutham** was moved Family → Tools, but Family still owns synastry data.
- **Rasipalan** (Tools) overlaps Today's daily guidance.

Every one of these is a place the user can get a *different answer to the same question* depending on
which door they used. In an astrology product, **inconsistent answers destroy trust faster than a
wrong answer** — a wrong answer is disagreement; two answers is "they're guessing."

### 3.3 No component system → 7 nav patterns, 654 inline styles, endless drift
You have tokens (117) but no **primitives** built on them. So every tab re-hand-rolls its sub-nav
with literal `fontSize: "12px", fontWeight: subTab===key ? 700 : 600` inline. This is the **root
cause of the recurring "consistency audit"** — there is nothing to be consistent *to*. Fixing colors
file-by-file is mopping with the tap running.

### 3.4 Multiple, competing scoring systems
Today's one score vs. Life Areas' 6-tier scores vs. Family forecast scores vs. daily-guidance layer
breakdowns. Four numeric truths. Users can't reconcile "Today = 7/10" with "Career = weak tier" with
"6-month forecast = stable." **One score model, expressed at different zooms** — not four models.

### 3.5 Depth is unguided
A first-time user and a jyotishi see the same wall. There's no progressive disclosure contract:
Today alone is 6 dense sections; Life Areas is 6 sub-tabs; Family is a long scroll. Everything is
"advanced" by default, so nothing feels like *the* thing to look at.

---

## 4. The revamp

### 4.1 New IA — intent-first, 5 destinations, no "More"

Re-cut around the four questions people actually open an astrology app to ask, plus a library:

| New tab | Verb / question | Absorbs today's… |
|---|---|---|
| **Today** | "How is today, and what should I do?" | Today (slimmed to 3 sections), daily Rasipalan, Activity Timing |
| **Timing** | "When should I do X?" | Calendar (all 3 views), Muhurta Finder, Goals→Decisions, Panchangam |
| **Chart** | "What does my chart say?" | Family & Charts, Transit & Dasha, Life Areas, Yogas/Doshams, Reports, Varshaphala |
| **People** | "How do we fit together?" | Family members, Compatibility/Porutham, family harmony/remedies |
| **Explore** | "Teach me / let me wander" | Explore, Learn, Guides, Nakshatram/Dosham/Yogam library |

Goals + Journal fold into **Today** (a "track & reflect" strip) and **Chart** (goals as chart-linked
timelines). Settings stays a corner rail. **Result: 5 verb-tabs, no dropdown, nothing orphaned.**
Every "which door?" ambiguity in §3.2 resolves because there's now exactly one door per intent.

> Decision needed from you: whether "People" earns top-level billing or lives inside "Chart." My
> recommendation is top-level — cross-chart / family is a genuine differentiator and deserves the shelf.

### 4.2 Kill the AND-labels
- **Family & Charts → "Chart"** (self) and **"People"** (others). Transit/Dasha are *views inside a
  chart*, not a co-equal noun.
- Muhurta has exactly **one home: Timing.** Everything else *links* to it, never re-implements it.
- Panchangam is a **view**, never also a "Planner tool."

### 4.3 One second-level navigation pattern
Build **`<Segmented>`** once. Every tab's sub-nav (Life Areas' 6, Goals' 4, Journal's 3, Calendar's 3,
Explore's 5) uses it. Tools' card grid and Family's section-rail become the **two sanctioned layout
patterns for "many peers" (grid) and "one long story" (rail)** — pick per content type, not per author.
Seven patterns → three, chosen by rule.

### 4.4 One score, three zooms
Define **one 0–100 day/context score** with a fixed color ramp (token-driven). Express it as:
- a **ring** on Today (the answer),
- **tier chips** on Life Areas (the same number, bucketed),
- **trend line** on forecast (the same number, over time).
Never a second independent scale. Trust is the product; consistency of the number *is* trust.

### 4.5 Progressive disclosure contract
- **Today** ships 3 sections, not 6: (1) the score + one-line "why + what to do", (2) the sunrise
  timeline, (3) one deep-dive doorway. The other 3 collapse behind "More on today."
- Every tab opens at its **simplest useful view**; depth is one tap, never the landing.
- Adopt an explicit **"Simple / Full" reading level** toggle (persisted) so the jyotishi gets the wall
  and the newcomer gets the answer — same data, disclosed differently.

---

## 5. The component & token layer (the real unlock)

Ship a tiny primitive kit in `web/components/ui/` and route the tabs through it. This is what stops
the audit treadmill:

| Primitive | Replaces | Kills |
|---|---|---|
| `<Segmented>` | 7 hand-rolled sub-nav strips | inline pill styles |
| `<Card>` / `<Panel>` | ad-hoc bordered divs | ~half the 654 inline styles |
| `<Score ring / chip / trend>` | 4 scoring UIs | competing scales |
| `<Stat>` / `<Meter>` | inline label+value rows | drift |
| `<BilingualText>` | per-site `lang==="ta" ? … : …` | co-render regressions by construction |

`<BilingualText>` is the systemic fix for your bilingual scar tissue: **one place** decides active-
language rendering, so "title echo" and "EN+TA co-render" bugs become *impossible to author*, not
*things to keep catching in review.*

Adoption is incremental: build the 5 primitives, convert **one tab fully as the reference
implementation** (I'd pick Life Areas — most sub-tabs, most inline styles), then convert the rest tab-
by-tab. No big-bang rewrite.

---

## 6. Motion & feel

- Tab switch: **0.42s → 0.22s**, same easing. Navigation should feel instant; save long eases for
  celestial ambient, not for getting to your data.
- Standardize a **motion token set** (nav 220ms, reveal 280ms, ambient 600ms+) so timing stops being
  per-component guesswork — same disease as colors, same cure.
- Keep the celestial ambient / moon-phase backdrop; it's a signature. Just make sure it never delays
  content paint.

---

## 7. Prioritized roadmap

**P0 — stop the bleeding (systemic, unblocks everything else)**
1. Build the 5 UI primitives (§5). Convert Life Areas as the reference tab.
2. `<BilingualText>` + `<Score>` — retire the two worst-drift patterns first.
3. Motion tokens; drop nav transition to 220ms.

**P1 — the IA re-cut (§4.1–4.2)**
4. Collapse to 5 verb-tabs; dissolve "More"; give Journal & Goals real homes.
5. One home per intent for Muhurta / Panchangam / Compatibility — link, don't duplicate.
6. Slim Today to 3 sections + "More on today."

**P2 — depth & polish**
7. Simple/Full reading-level toggle, persisted.
8. Convert remaining tabs to the primitive kit; drive inline-`style` count toward zero.
9. One score model wired across Today / Life Areas / forecast.

## 8. What I'd measure

- **Time-to-answer:** open → sees today's verdict. Target < 3s, zero taps.
- **"Which door" rate:** how often users reach the same feature via ≥2 paths (should trend to 1).
- **Inline-style count** as a system-health metric (654 → target < 100).
- **Audit frequency:** if the component layer works, the "consistency audit" should stop recurring.
  That's the real KPI — the treadmill ending.

---

## 9. The one-sentence version

> Vinaadi is a Ferrari engine in a filing cabinet: **re-cut the dashboard around the four questions a
> person actually asks, build the five primitives the tokens have been waiting for, and make today's
> answer the product** — then the endless consistency audits stop, because there's finally a system to
> be consistent *to*.
