# Vinaadi AI — Product Roadmap (Prioritization)

**Role:** Principal Product Manager
**Date:** 2026-07-07
**Inputs:** `00-product-understanding`, `02-personas` (60), `03-first-run-thinkaloud` (10 observed), `04-feature-testing`, `05-issue-synthesis/TOP_100_ISSUES.md`
**Mandate:** Prioritize work only. No screen redesigns. Every ranking is explained and cites the issue number(s) from `TOP_100_ISSUES.md` (shown as `#n`).

---

## 1. How I prioritized (the lens)

Severity alone under-ranks cheap-but-wide fixes and over-ranks expensive segment bets. So each issue was scored on four axes and the roadmap slot is the **product** of them, not severity in isolation:

- **Reach** — personas affected (the `Freq` column; a reach estimate over 60 synthetic personas, not incidence).
- **Severity** — does it block the core job / exclude a segment (Critical) → cosmetic (Low).
- **Confidence** — is the defect **Observed (O)** in a think-aloud, **Inferred (I)** from a profile, or an unverified **Risk (R)**? `R` items are *not* funded as builds until a spike confirms the defect exists.
- **Effort** — S / M / L, rough eng+design lift.

**Two structural consequences of this lens** (both drawn from Part C of the synthesis):

1. **Comprehension & modality — not calculation accuracy — dominate the top of the funnel.** Six of the top nine issues are "can the user read/operate this at all." The engine's correctness (which the one expert largely validated) is a Tier-2/3 concern. So the roadmap front-loads *legibility*, not new astrology depth.
2. **Trust is gated upstream of revenue.** The chart-foundation doubt (`#3`), data-custody fear (`#7`), and hidden-charges reflex (`#19`) all sit *before* any paywall. Fixing them is monetization work even though none of it is a paywall feature.

**One discipline enforced throughout:** the five `R`-tagged high-reach items (`#2, #12, #37, #34, #43, #68, #92, #97`) are the biggest single source of misallocation risk. `#2` alone reaches ~20 personas but is **unverified** — it could be a one-line locale-default bug or a quarter of platform work. **We do not guess. Sprint 0 is a verification spike** before a rupee of build capacity is committed to any `R` item.

---

## 2. Priority tiers (what & why)

Ordering *within* each tier is by reach × confidence. Effort (S/M/L) and evidence (O/I/R) are shown so the sequencing in §4 is auditable.

### CRITICAL — fund now; blocks the core job or excludes a segment
*These are the items where a persona cannot do the thing they came for, and the defect is Observed or high-confidence Inferred.*

| Rank | Issue | # | Reach | Effort | Evid | Why Critical |
|---|---|---|---|---|---|---|
| C1 | English-by-default on a Tamil-first product | #8 | 12 | **S** | O | Widest-reach issue with the smallest fix. First impression for the core majority; low-digital users nearly stall at the door. Highest value-per-effort in the entire corpus. |
| C2 | Opaque daily score (no plain நல்ல நாள்/ஜாக்கிரதை, no colour legend) | #9, #50, #63, #64 | 10 | **S/M** | O | The hero of the daily habit answers no question the folk majority asked. Cheap to add a plain-language verdict + legend; earns the daily-loop trust everything else compounds on. |
| C3 | Ask Vinaadi never gives a plain go/stay verdict | #6 | 4 | **S/M** | O | The single job-to-be-done for folk-devout users ("can I go/sign/travel?"). Largely an output-format/prompt change, not a model change — small lift, direct hit on the core loop. |
| C4 | Auto-filled lat/long unverifiable → poisons trust in the whole chart | #3, #16, #90 | 8 | **M** | O | Upstream of *every* downstream feature and all monetization. If the foundation is doubted, nothing built on it converts. |
| C5 | Remedy card is Hindu-ritual only — alienates non-Hindu cultural users | #10, #39 | 14 | **M** | O | Largest reach in the register (~¼ of the base). A daily-surface repel-point for Christian/Muslim cultural users. Needs a secular/non-ritual next-action alternative, not a reframe of the whole app (that's L-tier). |
| C6 | Family Vault empty on day 1 — the came-for feature is unavailable at first run | #4, #60 | 8 | **M** | O | The stickiest, highest-LTV feature fails its own activation moment. Cold-start work (prefill/sample/partial-entry), not new capability. |
| C7 | Diaspora date/muhurtham may default to Tamil-Nadu locale `R` | #2, #12, #37 | 20 | **?** | R | *Highest reach in the entire corpus, but unverified.* Funded as a **Sprint-0 spike first** — if real, it is the #1 build; if a config default, it is a Quick Win. Cannot rank the build until the spike resolves it. |
| C8 | Account + email wall before any value | #5, #26, #55 | 5 | **M** | O | A whole low-digital / no-email cohort can only enter via a relative. Guest-value + no-email path + SSO. |
| C9 | Data-custody fear blocks entering family birth details | #7, #43 | 5 | **S/M** | O | Sits upstream of vault population (C6) and every paid porutham/report it feeds. Mostly trust affordances + copy + surfacing the delete/rectify controls that *already exist* but weren't discovered. |

**Why these nine and not the other Tier-1 rows:** `#1` (voice/non-reader modality) and `#14` (assisted mode) and `#11` (whole-app Hindu framing) and `#13` (funnel shape) are genuinely Critical *in severity* but are **L-effort structural bets** — they go to Long-term Bets (§3) and the Later horizon (§4), not to "fund now," because shipping them well takes a quarter and they must not jump ahead of the S-effort fixes that unblock the same users sooner.

### HIGH — schedule this quarter; trust damage or likely abandonment for a segment
| Rank | Issue | # | Reach | Effort | Evid | Why High |
|---|---|---|---|---|---|---|
| H1 | Red "needs attention" life-area tier reads as "something wrong with my health" | #17, #99 | 8 | **S** | O | Content-correct, delivery-wrong: converts "take care" into fear for folk mothers. Harmful + churn-driving, and it's a copy/framing fix (small). |
| H2 | Ask Vinaadi has no cost transparency → cost-anxious won't ask twice | #18 | 6 | **S** | O | Actively suppresses the one daily feature with a direct monetization line. A label, not a feature. |
| H3 | Business/timing tools (Muhurta, Decisions, What-If) are buried | #28, #29, #70 | 8 | **M** | O | The highest willingness-to-pay features are hidden under Plan/Explore; discovery is the conversion bottleneck for the segment that pays most. Navigation surfacing, not new tools. |
| H4 | No trust-proof ("matches temple panchangam / your astrologer") surfaced | #45, #71 | 5 | **M** | O | The exact thing that converts both folk and expert users is left for them to find by hand. Both paying personas (P03, P08) only paid *after* manual cross-check. |
| H5 | Hardcoded fake-looking testimonials dent credibility | #22 | 4 | **S** | O | Undercuts the "serious/precise" positioning at first impression for the exact rigor-seeking segment. Trivial fix, real trust cost. |
| H6 | Kalachakra shipped prominently with no caveat / no sign-off | #21, #40 | 3 | **S** | O+memory | Moat *and* liability: the one thing the expert most wants to interrogate is the one most likely wrong. Corroborated by project memory (experimental/unverified). A caveat label is small; it caps blast radius. |
| H7 | Shadbala wears the full classical name but is a simplified render | #20, #72 | 3 | **S** | O | Mislabelled rigor is exactly what the credibility-setting expert catches; word-of-mouth risk in the authority tier. Relabel/caveat. |
| H8 | Deep Dive is a jargon wall that overwhelms & *embarrasses* non-experts | #15, #24, #89 | 8 | **M** | O | Shame response on the flagship depth undermines the calm/inclusive positioning; beginner mode doesn't actually simplify. Progressive-disclosure + glossary, not new content. |
| H9 | Reflexive "free = hidden charges" distrust taints the app | #19, #86, #94 | 6 | **S** | O | Suppresses signup confidence and any upsell. Copy + a clear free/paid boundary. |
| H10 | Web cannot take payment (app-store-only) | #27 | 5 | **L** | O | Every web lead must reinstall to pay; conversion leak. High value but **L-effort + policy-constrained** — scheduled, not "now." |
| H11 | Reports value unclear before purchase | #73 | 4 | **S** | O | Encountered-not-sought pricing with unclear value → reflexive skip. Value-preview copy. |
| H12 | Health card risks reading as medical advice | #31, #77 | 4 | **S** | O | Liability + trust. Safeguard copy on a sensitive surface — cheap insurance against a disproportionate risk. |
| H13 | High-stakes financial/immigration decisions leaned on astrology with no risk-framing | #32, #98 | 6 | **S** | I | Blame/liability exposure if a costly real-money decision "goes wrong" after a nudge. Decision-surface framing copy. |

### MEDIUM — friction / secondary unmet need; workaround exists
| Rank | Issue | # | Reach | Effort | Why Medium |
|---|---|---|---|---|---|
| M1 | EN/TA toggle hard to find | #49 | 6 | S | Adds a stall step, but C1 (default-Tamil) removes most of the pain; this is the residual. |
| M2 | Employment list omits common Tamil occupations | #23 | 8 | S | Wide but shallow "this app understands me" erosion; a data-list edit. |
| M3 | Score breakdown too paragraph-dense for casual users | #53, #58 | 3 | S | The smartest trust move wasted on skimmers; summarize-first. |
| M4 | Password creation/recovery high-friction for low-digital users | #26 | 5 | M | Real drop, largely absorbed by SSO/no-email work in C8. |
| M5 | Porutham needs full second-chart; no partner-star-only quick mode | #42 | 3 | M | Blocks the came-for feature at intent, but for a narrower set than C6. |
| M6 | No proactive ritual/festival/caution-day reminders | #33, #66 | 7 | M | Strongest unused re-engagement lever — but coupled to spam-risk (#34) which the Sprint-0 spike must resolve first. |
| M7 | Journal/mood-pattern high-value but stumbled-upon | #41, #80 | 5 | S | Foregone retention for the reflective segment; a surfacing/entry-point change. |
| M8 | Small fonts vs. fading eyesight (no large-text mode) | #25 | 5 | M | Excludes a high-retention senior cohort; standard a11y work. |
| M9 | Barnum/hollow daily content for analysts | #30, #56, #57, #58 | 4 | M | Analysts discount the daily content; a content-quality investment, not a defect. |
| M10 | Birth-date/time ambiguity & guessed-value uncertainty unguided | #51, #52, #84, #85 | 4 | S | Foundational-field doubt; inline guidance copy. |
| M11 | Form length triggers "hand it to my son" | #54, #62 | 4 | M | Abandonment risk; progressive/simplified path (overlaps C8/assisted mode). |
| M12 | Reports/guest value boundary unclear | #82, #94 | 2 | S | Signup-gate hesitation; framing. |
| M13 | Rahu Kalam scope ambiguous | #83 | 2 | S | Even trusting users misapply the most-used almanac element; a scope note. |
| M14 | Multi-member transit / combined-family view `R` | #68, #69 | 3 | M | The family mental model may not exist post-setup; **verify in Sprint 0** before building. |

### LOW — minor / narrow / cosmetic
`#87` friendship-compat expectation · `#88` "widowed" abruptness · `#89` glossary (partly in H8) · `#91` icon/colour legend for non-readers · `#92` Wrapped share `R` · `#93` streak (unproven) · `#95` heavy report language · `#96` subtle-yoga completeness quibble · `#97` cross-country dual-TZ `R` · `#100` elder guided mode (overlaps L-tier bet).
**Why Low:** each reaches 1–3 personas, has a workaround, or is a cosmetic nick a single expert notices. Fund only when adjacent work makes them near-free.

### BACKLOG — real but not now (mostly single-segment jobs & unproven mechanics)
Long-tail segment jobs, each the stated core need of a *specific* persona but individually narrow: agricultural muhurtham `#35`, facilitator/multi-family tooling `#36`, remote family participation `#46`, diaspora matchmaking `#47`, education/exam timing `#44`, memorial/remembrance days `#66`, panjangam-depth tithi cards `#67`, weather pairing `#65`, shift-worker timing `#75`, livelihood-specific guidance `#76`, glanceable gig mode `#74`, intergenerational/teaching mode `#78`, Gen-Z sun-sign bridge `#79`, community date-desk `#81`, LGBTQ-inclusive framing `#38`, self/shadow-work depth `#80`.
**Why Backlog, not Dead:** §5 of the synthesis is explicit these are *opportunities as much as defects* — real, evidenced, but single-segment. They graduate to a tier when (a) a segment is chosen as a growth priority, or (b) they cluster into a shippable theme (e.g. `#35/#65/#75/#76` = an "informal-worker/agrarian" pack).

---

## 3. Cross-cutting views (the two shapes the brief asked for)

These cut *across* the tiers above — Quick Wins and Long-term Bets are effort/horizon lenses, not new priorities.

### ⚡ QUICK WINS — high value ÷ low effort; ship in the first 1–2 sprints
*Selected purely on value-per-effort. Mostly copy, config, labels, and surfacing controls that already exist.*

| Quick Win | # | Why it qualifies |
|---|---|---|
| Default to Tamil (locale/heritage detection) | #8 | 12-persona reach, S-effort. The single best value-per-effort move in the corpus. |
| Plain-language score verdict + colour legend | #9, #50, #63, #64 | Turns the opaque hero into a readable one; S/M, reaches 10. |
| Ask Vinaadi: lead with a go/stay verdict, then reasoning | #6 | Output-format/prompt change; hits the core job for voice/folk users. |
| Ask Vinaadi cost-transparency label | #18 | One line of copy unblocks a monetization-adjacent feature. |
| Soften the red "needs attention" life-area tier | #17, #99 | Copy fix that removes a daily fear-spike + liability read. |
| Replace hardcoded testimonials | #22 | Removes a credibility own-goal at first impression. |
| Caveat labels on Kalachakra / Shadbala / experimental engines | #20, #21, #40 | Caps the single highest expert-trust + liability risk for near-zero cost. |
| Surface existing delete/rectify + a "your data is safe" affordance | #7, #43 | The privacy blocker already *has* controls users never found; surface them. |
| Add common Tamil occupations to the employment list | #23 | Data-list edit; wide "understands me" win. |
| Clear free-vs-paid boundary + Reports value-preview | #19, #73, #94 | Copy that reduces hidden-charge anxiety and skip-reflex. |
| Safeguard copy on health / high-stakes-decision surfaces | #31, #32, #98 | Cheap liability insurance on sensitive surfaces. |

**Quick-win rule I'm enforcing:** none of these require a screen redesign — they are defaults, labels, copy, data lists, prompt formats, and surfacing already-built controls. That's precisely why they go first: maximum trust recovery before any structural investment.

### 🎯 LONG-TERM BETS — structural, multi-sprint, compounding
*High severity but L-effort; they define the product's ceiling, so they're funded deliberately after the Quick Wins stop the bleeding.*

| Bet | # | The thesis |
|---|---|---|
| **Modality layer: visual verdict + voice in/out** | #1, #59, #91, #14 | Unlocks the entire low-literacy / voice-first / assisted-caregiver segment (Gulf labour, estate, elders) that today uses the app only second-hand. The biggest untapped *reachable* audience. |
| **Religion-neutral framing system** | #10→#11, #39 | Beyond the C5 remedy alternative: a framing layer letting ~¼ of the base (Christian/Muslim cultural users) use the product without a religion wall. The widest structural fault line. |
| **Diaspora locale/timezone correctness** (pending Sprint-0 spike) | #2, #12, #37, #97 | If the spike confirms the gap, this is the platform bet for ~⅓ of the base — correct dates/muhurtham in the user's own timezone + regional festivals. Potentially the largest single value unlock. |
| **Onboarding for non-household users** | #13, #84 | Re-architecting the funnel so singles/students/youth aren't told "this is for your mother" — protects the acquisition segment at its most fragile moment. |
| **Web payments** | #27 | Removes the app-store reinstall tax on every web lead; policy-constrained, hence long. |
| **Beginner/progressive-depth mode that actually simplifies** | #15, #24, #48, #79 | Makes depth a ladder, not a wall — serves both the embarrassed folk user and the heritage-curious Gen-Z on-ramp. |
| **Family decision-OS** (combined view, multi-member transits, remote participation) | #4→#68, #69, #46 | Compounds the stickiest, highest-LTV surface into the household "operating system" the family personas actually described. |

---

## 4. Sequenced roadmap (Now / Next / Later)

Priority tells you *what matters*; this tells you *what to build in what order*, respecting dependencies and the verify-before-build rule.

### ▶ SPRINT 0 — Verification spike (before committing build capacity)
**Purpose:** resolve the `R`-tagged risks so we fund reality, not fear. Small, mostly investigative.
- **Verify #2/#12/#37/#97** — does the pipeline already localize date/muhurtham to the user's timezone/place, or default to Tamil Nadu? *This single answer re-ranks the whole roadmap.*
- **Verify #34** — current notification behavior/cadence/opt-in defaults (spam-risk gate for M6).
- **Verify #43/#68/#92** — do delete/rectify controls, a combined-family view, and Wrapped share already exist but are undiscovered? (If yes → they collapse into Quick-Win *surfacing*, not builds.)
**Exit criterion:** every `R` item is reclassified as Quick Win, scheduled build, or non-issue.

### ▶ NOW (Sprint 1–2) — Quick Wins: stop the trust bleed
All of §3's Quick Wins — `#8, #9, #6, #18, #17, #22, #20/#21/#40, #7/#43, #23, #19/#73/#94, #31/#32/#98`.
**Why first:** maximum trust/comprehension recovery at minimum cost, and several (#7, #9, #6) are prerequisites the structural bets stand on. Nothing here is a redesign.

### ▶ NEXT (this quarter) — verified Critical builds + High trust
- **C4** chart-foundation confirmation (#3/#16/#90) — unblocks all downstream trust.
- **C6** Family Vault cold-start (#4/#60) + **C9** custody trust (#7).
- **C8** email/SSO/guest-value wall (#5/#26/#55).
- **C5** secular remedy alternative (#10/#39).
- **C7 build** *if* Sprint 0 confirmed the timezone gap.
- **H3** surface timing/decision tools (#28/#29/#70) — the pay-most segment's discovery bottleneck.
- **H4** trust-proof / panchangam-match (#45/#71) — converts folk *and* expert.
- **H8** Deep-Dive progressive disclosure + glossary (#15/#24/#89).
- **H1, H2, H5, H6, H7, H9, H11, H12, H13** land as copy/label items alongside.

### ▶ LATER (next 1–2 quarters) — Long-term Bets
Sequenced by reach × strategic value: **Modality layer (#1/#59/#14)** → **Religion-neutral framing (#11)** → **Diaspora platform (#2 et al, if confirmed)** → **Non-household onboarding (#13)** → **Beginner/progressive mode (#15/#48)** → **Family decision-OS (#68/#69/#46)** → **Web payments (#27)**.
Plus Medium-tier items (M1–M14) slotted opportunistically where they ride adjacent work.

### ▶ BACKLOG — segment packs, funded on a growth decision
The §2 Backlog list, graduated when a segment is chosen as a growth target or items cluster into a theme.

---

## 5. What I deliberately did **not** prioritize (and why)

- **New astrology depth / accuracy features.** The evidence is unambiguous (Part C #1): comprehension and modality, not accuracy, decide adoption; the engine was largely validated by the one expert. Adding depth before legibility would serve ~2 personas while the other 58 still can't read the score. *De-prioritized until the comprehension tier ships.*
- **Streak/gamification (#93).** Zero observed pull; unproven. No build until there's a retention hypothesis to test.
- **Single-segment jobs as individual features.** Real (`§5` of the synthesis) but narrow; funding them one-by-one starves the wide fixes. They wait for a growth-segment decision or a theme cluster.
- **Anything requiring a screen redesign, per the mandate.** Where an issue *could* invite a redesign (e.g. the score dial, the onboarding form), I scoped the roadmap item to the *work and its rank* (a label, a default, a disclosure model) and left the design to a separate exercise.

---

## 6. Honesty flags (carried forward from the synthesis)

- **~30 of the 100 issues rest on Inferred/Risk evidence**, not observed defects. They are ranked lower or gated behind Sprint 0 accordingly — never funded as if proven.
- **Reach is an estimate over 60 synthetic personas (10 observed), not an incidence rate.** Use it to sequence, not to forecast.
- **Protect the assets while fixing the defects.** The panchangam strip, the 6-signal score *breakdown*, the "weather not verdict" framing, and the birth-time-confidence field drew unprompted praise — none of the work above should regress them.

*End — prioritization only. Tiers, cross-cutting Quick Wins / Long-term Bets, and a Now/Next/Later sequence, every ranking explained and evidence-cited.*
