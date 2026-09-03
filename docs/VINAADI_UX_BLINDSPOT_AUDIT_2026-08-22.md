# VINAADI UX BLINDSPOT AUDIT REPORT

## Date: 2026-08-22
## Auditor: Codex

## Scope and method

Static implementation audit of the current Nova dashboard and public tools
against the two personas in the supplied brief. This evaluates discoverability,
comprehension, emotional safety and cultural accessibility, not the validity of
the Thirukanitham calculations. It covers the current hosts for the requested
features: Setup, Today, Family & Charts, Calendar, Tools, Explore, Goals,
Journal and Settings.

---

## EXECUTIVE SUMMARY

- Total issues: **24**
- S0 — BLIND: **4**
- S1 — LOST: **8**
- S2 — GUESSING: **5**
- S3 — FRICTION: **4**
- S4 — MISSED: **3**

Vinaadi is appreciably safer than a raw astrology data dump. The setup screen
calls astrology “a window, not a verdict”; Dosham detail distinguishes Absent,
Mitigated and Active; Porutham says it is guidance rather than a gate; and some
advanced terms have tap-to-reveal definitions. Those are material strengths.

The central blindspot is where and when help appears. Help is strongest after a
person has found a Deep Dive or detailed tool. First-run, Today and Calendar
still assume that terms such as Panchangam, Rahu Kalam, Dasa, Rasi and Muhurta
are meaningful. The app also puts a person’s chart, Dasa and transit material
under **Family & Charts**, a label that does not advertise those individual jobs.

Top five findings:

1. **X-01** — Place search is Tamil-Nadu-shaped, with no visible global-place
   recovery flow (S0 for Jake).
2. **X-02** — “Birth time optional” does not explain the impact of omission or
   approximation when the user makes that choice (S1/S2).
3. **X-06** — Today presents a score and timing cautions before explaining how
   to use them safely (S1/S2).
4. **X-11** — Chart/Dasa/Transit information is hidden behind a label that does
   not match the user’s task (S4).
5. **X-15** — Compatibility’s score, pass/fail and critical labels arrive before
   its contextual safety frame can counter an emotional interpretation (S2).

Would they return?

- **Karthik:** Probably, after assistance or persistence. The daily utility and
  cultural familiarity are compelling, but he will not yet feel he understands
  the system.
- **Jake:** Unlikely after one self-directed session. He can operate the surface
  but cannot explain the chart or make a confident judgment about what is advice,
  tradition or a warning.

---

## PERSONA A (KARTHIK) — FULL WALKTHROUGH

### First contact (0–60 seconds)

Karthik recognizes Jathagam, Rahu Kalam, Sani and Porutham. The Tamil toggle,
daily action and calendar hooks make the product feel intended for him. But
recognition is not understanding: he cannot say why a score is 54 rather than
68, or how Dasa, transit and Panchangam are combined. His arc is **curious →
reassured → selectively confused → likely to return for daily utility, not
understanding**.

### Screen-by-screen audit

#### Landing, registration and setup

**What Karthik sees:** A three-step flow: his chart, a Family Vault, then add a
member. The setup primer has reassuring, non-fatalistic language.

**What he understands:** Name, date, time and place; the broad purpose of a
Jathagam.

**What he misses:** Why time is optional, whether a Family Vault is needed for
his own reading, and how to recover when a place is unmatched.

| ID | Element | Severity | Description | Suggested fix |
|---|---|---:|---|---|
| A-01 / X-02 | Birth-time field | S1 | “Optional” is clear; the impact on Lagna/houses is not. Source/confidence is hidden in optional detail. | Add: “Exact time enables house-level readings; unknown time still gives star/sign guidance.” Reveal an appropriate uncertainty route in-line. |
| A-02 / X-03 | Family Vault | S3 | It follows personal-chart setup before personal value is demonstrated. | Mark it optional and defer: “Add family charts later.” |
| A-03 / X-04 | Unmatched place | S1 | Fallback exposes timezone and coordinates, which are not folk-user inputs. | Offer nearest-city/map fallback with plain error recovery. |

#### Today / first result

**What Karthik sees:** Greeting, daily score, best/avoid timing, Panchangam
facts and links to deeper content.

**What he understands:** Useful time windows and many common festival/Rahu
Kalam references.

**What he misses:** Score ingredients and distinctions among personal window,
Hora, Abhijit and Nalla Neram.

**Emotional arc:** Supported on a high score; prone to worry on a low score even
when copy is careful.

| ID | Element | Severity | Description | Suggested fix |
|---|---|---:|---|---|
| A-04 / X-06 | Daily score | S1 | A precise-looking number has no immediate explanation of factors or safe decision rule. | Add a tappable “How today is read” below it: three plain factors, non-deterministic framing, one action. |
| A-05 / X-07 | Avoid windows | S2 | Familiar labels can be read as prohibitions, not timing guidance. | Pair every window with scope: “Avoid starting a new important task,” never a bare warning. |
| A-06 / X-08 | After-score CTA | S4 | “Open Chart & Explanations” is not an obvious answer to “why is today like this?” | Use “See why this day is shaped this way,” then reveal evidence. |

#### Family & Charts: Jathagam, planets, Dasa and Gochar

**What Karthik sees:** A family-oriented home containing his chart, selected
member charts, planet detail, Dasa, Saturn cycle and transit material.

**What he understands:** South Indian chart form and common planet names.

**What he misses:** Abbreviations, house grammar, dignity/strength, D9/Navamsa
and alternate Dasa systems.

| ID | Element | Severity | Description | Suggested fix |
|---|---|---:|---|---|
| A-07 / X-11 | “Family & Charts” navigation | S4 | A user looking for Jathagam, Dasa or Gochar does not naturally choose this label. | Rename to “My Chart & Family”, or expose persistent chips: “Chart · Dasa · Transits”. |
| A-08 / X-09 | Chart grammar | S1 | Familiar format is still not self-explaining. | First-open coachmark: signs stay fixed, Lagna marks house 1, tap a box/planet; include compact legend. |
| A-09 / X-10 | Technical Deep Dive | S1 | Selected deep concepts have definitions; core terms lack a consistent learning path at point of use. | Apply one shared tap-to-learn component to every astrology term. |
| A-10 / X-12 | Dasa timeline | S1 | Date/planet hierarchy comes before “what is active now / what changes next?”. | Lead with current chapter, life-language themes, next shift; timeline second. |
| A-11 / X-13 | Sani/transit cards | S2 | Calm visual design does not fully neutralize inherited fear around Sade Sati/Ashtama Sani. | Lead with care/action and improvement point; classical label second. |

#### Calendar, Explore, Tools, Settings and Journal

**What Karthik sees:** A rich Panchangam, Yogam/Dosham library and tools for
Porutham, Muhurta and Numerology, with goals/settings/journal nearby.

**What he understands:** Festival calendar and basic timing practices.

**What he misses:** Which Panchangam factors are personally relevant, which tool
answers a particular question, and why profile context changes guidance.

| ID | Element | Severity | Description | Suggested fix |
|---|---|---:|---|---|
| A-12 / X-14 | Panchangam | S1 | Accurate facts appear as peer facts, not as a practical interpretation. | Default to “Today for you”, “good for”, “avoid starting”; disclose five limbs beneath. |
| A-13 / X-16 | Yogam/Dosham | S1 | Dosham detail is safer than a raw result, but the library has no beginner entry point. | Add: “Chart patterns, not predictions. Start with what affects today.” |
| A-14 / X-17 | Tools | S3 | Descriptions help, but adjacent timing/decision tools still require category knowledge. | Organize by jobs: check a match, choose a date, understand chart, plan a decision. |
| A-15 / X-18 | Settings/profile context | S3 | Optional personal inputs do not explain the value of disclosure. | Group as “Make readings fit your current life (optional)” with data-use explanation. |
| A-16 / X-19 | Journal | S4 | It is not a consistent primary destination. | Add a stable “Reflect” action on Today and in navigation. |

---

## PERSONA B (JAKE) — FULL WALKTHROUGH

### First contact (0–60 seconds)

Jake recognizes a polished planning/astrology product. “Today”, date, score,
calendar and time are legible. English-like words create false familiarity:
Yoga, House, Transit and Compatibility do not mean their Vedic usage. A South
Indian chart is an unlabelled diagram. His arc is **curious → can operate the
surface → cannot explain it → distrusts or leaves technical layers**.

### Screen-by-screen audit

#### Landing, registration and birth data

**What Jake sees:** Requests for personal birth data, place, timezone and later
family information.

**What he understands:** Profile basics.

**What he misses:** Exact-time significance, global place support, timezone/DST
handling and why a family vault follows a personal setup.

| ID | Element | Severity | Description | Suggested fix |
|---|---|---:|---|---|
| B-01 / X-01 | Place autocomplete | S0 | The backing list is Tamil-Nadu-focused. Free typing exists, but no global resolution promise or obvious recovery. | Use global geocoding or label the current list; offer map/world-search before coordinates. |
| B-02 / X-02 | Birth time | S2 | “Optional” encourages omission without explaining which readings become uncertain. | Add a plain before/after preview and a morning/afternoon/unknown route. |
| B-03 / X-05 | Timezone/DST | S1 | Timezone appears as a fallback field, not a confidence-building accuracy step. | Auto-detect and confirm IANA zone; give “Why this matters”, including historical/DST support. |
| B-04 / X-03 | Family Vault | S3 | It is unexplained product vocabulary and expands the task too soon. | Explain and defer it as optional. |

#### Today / dashboard

**What Jake sees:** Score, Moon imagery, timing windows and short actions.

**What he understands:** The product recommends a time and names a caution.

**What he misses:** What the score means, whether “avoid” means danger, and
what Panchangam/Rahu/Abhijit/Hora are.

| ID | Element | Severity | Description | Suggested fix |
|---|---|---:|---|---|
| B-05 / X-06 | Score | S1 | “54/100” has no built-in decision meaning. | On first run, lead with the action; show score as supporting detail after explanation. |
| B-06 / X-07 | Avoid windows | S2 | “Avoid” can be mistaken for safety/danger advice. | Say “In this tradition, avoid starting new commitments”; distinguish everyday activities. |
| B-07 / X-20 | False familiarity | S1 | Yoga/Transit/House/Compatibility have plausible but wrong everyday meanings. | Pair first use with a short translation, e.g. “Yoga (a chart pattern)”. |
| B-08 / X-08 | Why route | S4 | No obvious “Teach me why today looks like this” route at the first result. | Add a progressive Why sheet: life language → astrology evidence. |

#### Chart, planets, Dasa and transit

**What Jake sees:** D1/D9, square chart, planetary abbreviations, timelines and
technical systems.

**What he understands:** Almost none of the visual grammar.

| ID | Element | Severity | Description | Suggested fix |
|---|---|---:|---|---|
| B-09 / X-09 | Jathagam Kattam | S0 | Without a legend/primer, Jake cannot proceed from the diagram. | Interactive “Read this chart in 60 seconds”, full planet/node names and tap targets. |
| B-10 / X-10 | Advanced systems | S0 | D9, Vargas, Shadbala and alternate Dasas form an expert wall even when individual terms have tooltips. | Gate behind Advanced astrology and state prerequisite concepts. |
| B-11 / X-12 | Dasa | S1 | Selective glossary use does not turn the timeline into a person-level story. | Use “Your current chapter”, “what may feel active”, “next shift” first. |
| B-12 / X-11 | Navigation label | S4 | “Family & Charts” does not match “understand my chart” or “what affects me now?”. | Provide “My chart” and “Transits & timing” as explicit routes/aliases. |

#### Yogam, Dosham, Porutham, Muhurta, Numerology and Panchangam

**What Jake sees:** Technical libraries and calculators. The Dosham screen does
provide status, triggers/cancellation and several full guides — a good safety
foundation.

**What he understands:** A Dosham has a status and a Porutham has a result.

**What he feels:** “Active”, “critical”, “no match”, “one-sided” and a score can
outweigh downstream caveats.

| ID | Element | Severity | Description | Suggested fix |
|---|---|---:|---|---|
| B-13 / X-16 | Dosham | S2 | Loaded labels are visible before prevalence, mitigation and scope. | Put a permanent safety preface in the hero: pattern, not diagnosis/verdict; mitigation and constructive action first. |
| B-14 / X-15 | Porutham | S2 | Score, pass/fail and critical cross-checks can make a relationship feel algorithmically decided. | Pre-result framing; use “needs conversation” language; explain Rajju/Vedha beside flags. |
| B-15 / X-21 | Muhurta | S1 | Results are actionable but method/cultural scope is not established before technical factors. | Ask a plain goal; explain the traditional timing method after returning usable windows. |
| B-16 / X-22 | Numerology | S1 | Chaldean/fortune alignment/name work lacks a first-use method statement. | Label as a separate tradition and avoid language implying a name must change. |
| B-17 / X-14 | Panchangam | S0 | Five limbs, Tamil months and timing systems are a jargon wall. | Default to three practical outputs; make the limbs “traditional detail” with definitions. |

#### Navigation, settings and mobile

| ID | Element | Severity | Description | Suggested fix |
|---|---|---:|---|---|
| B-18 / X-17 | Tools vs Explore | S3 | Both labels are vague and not task-based. | Add intent descriptions: “Learn astrology” vs “Run a calculation”. |
| B-19 / X-23 | Tamil-English boundary | S1 | English is grammatical but heritage terms often appear with no English concept. | First use: “Rahu Kalam — traditional avoid-starting time”; preserve the original term after. |
| B-20 / X-24 | Mobile density | S3 | Chart, compatibility rows, limbs and Deep Dive become long serial stacks. | One primary action per screen; accordions/sheets for evidence; safety copy before first scroll. |

---

## COMPARATIVE ANALYSIS

**Karthik-specific:** familiar vocabulary creates overconfidence; he needs
decision scope and disambiguation, not a lecture. Family/traditional tools have
pull but setup asks for family organisation before value.

**Jake-specific:** chart grammar and Panchangam are genuinely opaque; global
place/timezone assurance is a baseline trust requirement.

**Shared P0 failures:** birth-time consequence, score/timing interpretation,
chart/Dasa/transit discoverability, compatibility safety framing, and a
point-of-need education system. These should not remove classical terminology;
they put life-language in front of it.

---

## PRIORITIZED FIX RECOMMENDATIONS

### TIER 1 — Fix before launch

1. Build a first-result comprehension layer: score meaning, “avoid” scope, one
   action and a Why trail.
2. Explain birth-time accuracy before entry; support unknown/approximate inputs
   with visible output limitations.
3. Provide global place search/map fallback and explicit timezone confirmation.
4. Put compatibility emotional-safety framing before the result/score.
5. Make the chart learnable with an interactive legend and full planet/node
   names.
6. Make My Chart and Today’s influences findable without Vedic vocabulary.

### TIER 2 — Fix in the first month

1. Expand the shared glossary across Today, Calendar, transit, Yogam, Dosham,
   Muhurta and Numerology; explain why a term matters here.
2. Make Calendar/Panchangam interpretation-first and facts progressive.
3. Make Dasa/transit narrative-first: current chapter, next shift, action,
   evidence.
4. Defer optional Family Vault setup until after a first result.
5. Apply a first-run information budget: one conclusion, three supports, then
   intentional expansion.

### TIER 3 — Improve over time

1. Use question-led tools/navigation and a searchable explanation index.
2. Add Advanced mode with prerequisites for Vargas, Shadbala and alternate
   Dasas.
3. Test 360px/390px layouts, ensuring safety/action text appears before dense
   charts/tables.
4. Test terminology with Tamil speakers who know the culture but do not practise
   astrology.

---

## DESIGN PATTERN RECOMMENDATIONS

### Progressive disclosure strategy

Use one ladder on every data surface:

1. **Answer:** “Today is best for steady work; postpone a new commitment until
   2:10 PM.”
2. **Why in life language:** “Current timing and lunar conditions favour review
   over a fresh start.”
3. **Astrology evidence:** Dasa, transit and Panchangam factors.
4. **Study:** chart positions, calculations, timelines, sources and full guides.

### Glossary / tooltip system

Every unfamiliar term needs a tap definition containing its plain concept, why
it appears on that screen, whether it is personal/day/location/general, and a
context-preserving Learn More route. Do not rely on hover or separate libraries.

### Emotional safety framework

For a caution, Dosham, low score or compatibility mismatch: say what it is not
(diagnosis, certainty or mandatory decision); state scope; show mitigation
before severity; offer one optional next action and improvement point; reserve
red for time-sensitive action rather than lifelong identity.

### Cultural bridging for non-Indian users

Introduce heritage terms as a pair at first use: “Muhurta (a traditionally
chosen auspicious time)”. Present practices as optional traditions, maintain
global place/timezone support, and translate purpose without erasing the term.

### “What this means for you” layer

Every astrological surface should have this order:

> **What this means for you** → **What may be supportive today** → **What to
> handle carefully** → **Why Vinaadi says this**.

The final layer can be rigorous Thirukanitham terminology. The first three must
stand on their own for a user with no astrology literacy.

---

## FINAL CHECK

Covered: landing/setup and birth data; first result/Today; South Indian chart
and planet detail; Dasa; Gochar/Sani; Yogam; Dosham; guidance/readings;
Porutham; Muhurta; Numerology; Calendar/Panchangam; remedies; navigation;
settings/profile; journal/return triggers; desktop/mobile density. Features
implemented as embedded tools or detail views were audited in their current
host rather than assumed to be standalone screens.
