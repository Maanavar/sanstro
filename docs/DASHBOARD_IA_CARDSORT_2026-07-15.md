# Dashboard IA — Plan / Tools / Explore card-sort brief (UXD-10)

Status: **recommendation only — nothing moved.** The audit (UXD-10) says "run a card
sort **before** renaming/moving anything," so this file is the input to that card
sort: a current-state inventory, the concrete boundary problems, and 3 candidate
groupings to validate. Implementation waits on a product decision (or a real sort).

Constraints carried in from the rest of the audit:
- **Top-nav only** (UXD-01/UXD-02) — no left rail, no bottom bar. Whatever we land on
  must fit the horizontal top strip (≤ ~7 primary items, overflow "More" allowed).
- **Life Areas & Journal deliberately highlight no tab while active** (DASH-13) — that
  behaviour is intentional and must be preserved by whatever IA we pick.

---

## 1. Current inventory (what actually lives where)

Primary top-nav tabs (`dashboard-hero.tsx`): **Today · Calendar · Family & Charts ·
Plan · Tools · Explore · Settings**. Two more tabs exist but are reachable only via
in-content links and highlight nothing: **Life Areas** and **Journal**.

| Tab | Contains (from `dashboard-workspace.tsx`) | User's job |
|---|---|---|
| **Today** (`personal`) | Daily guidance, score dial, streak, panchangam glance | "What about today?" |
| **Calendar** | Monthly panchangam, tithi/nakshatra, muhurtham-ish dates | "When is a good day?" |
| **Family & Charts** | Family vault, member charts, the chart engine | "Show me the chart(s)" |
| **Plan** | Goals, what-if scenarios, **transits**, dasha story, varshaphala | "What's coming / decide" |
| **Tools** | **Porutham**, chart generator, Annual Wrapped, Retrospective, Indraiya Rasipalan, activity timing | "Run a calculator" |
| **Explore** | Nakshatram, **dosham**, yogam reference, Ask Vinaadi | "Look something up" |
| **Life Areas** *(no highlight)* | Per-life-area predictions | "How's my career/health…" |
| **Journal** *(no highlight)* | Daily journal entries + correlations | "Log & reflect" |

## 2. The boundary problems (why this needs a sort)

1. **Timing is scattered across three tabs.** "When is a good day?" is answered by
   Calendar (panchangam), Plan (transits/dasha), *and* Tools (activity timing) — a user
   with a muhurtham question has no single obvious home.
2. **Porutham (compatibility) sits in Tools, but relationships live in Family.** A user
   thinking about marriage compatibility reaches for Family/relationships, not a
   "tools" drawer of calculators.
3. **Doshams are in Explore (a reference library), but they're also *your* chart.** A
   dosham reading is both an encyclopedia entry *and* a personal verdict — Explore
   frames it as generic reference, disconnecting it from Family & Charts / Life Areas.
4. **Annual Wrapped + Retrospective are personal review, filed under Tools.** They're a
   look back at *your* year, closer to Today/Plan than to standalone calculators.
5. **Life Areas & Journal have no tab home.** Two whole surfaces are discoverable only
   by stumbling on an in-content link — the single biggest discoverability gap.

## 3. Three candidate groupings to test

The card sort should validate one of these (or a hybrid). All respect top-nav-only and
the Life-Areas/Journal "no highlight" rule.

### Candidate A — group by *time horizon* (smallest change)
`Today · Calendar · My Chart · Plan · Tools · Explore · Settings`
- **My Chart** = today's "Family & Charts" + dosham/yoga *personal verdicts* pulled out
  of Explore. Explore becomes a pure encyclopedia (nakshatram/dosham/yogam *reference*).
- Timing stays split but is signposted: Calendar cross-links to Plan→Transits.
- Lowest migration cost; keeps 7 tabs.

### Candidate B — group by *user job* (bigger, clearer)
`Today · Timing · My Chart · Relationships · Plan · Library · Settings`
- **Timing** merges Calendar + activity-timing + muhurtham → one "when is a good day"
  home.
- **Relationships** merges Family & Charts + **Porutham** → everything multi-person.
- **Library** = Explore's reference (nakshatram/dosham/yogam) + Ask Vinaadi.
- **Plan** keeps goals/transits/dasha/varshaphala; Annual Wrapped + Retrospective move to
  Today (a "your year" review surface).
- Highest clarity, highest migration cost; still ≤7 with a "More" overflow.

### Candidate C — minimal, fix only the two worst gaps
Keep today's 7 tabs, but:
- Give **Journal** and **Life Areas** a real home: add them under a **"More ▾"** overflow
  item in the top strip (satisfies discoverability without a new nav pattern).
- Move **Porutham** from Tools into **Family & Charts** (relationships).
- Leave Plan/Tools/Explore otherwise as-is.
- Cheapest path that removes the most user-reported confusion.

## 4. Recommended next step

Run an **open card sort** (10–15 target users, mix of the 1970s–80s cohort + diaspora)
on the ~18 leaf features (daily guidance, score, panchangam, muhurtham, transits, dasha,
varshaphala, goals, porutham, chart generator, rasipalan, annual wrapped, retrospective,
nakshatram, dosham, yogam, life areas, journal). If a live sort isn't feasible, **Candidate
C is the safe default** — it fixes the two highest-severity issues (discoverability of
Journal/Life-Areas, and porutham's mis-home) with minimal risk, and can ship without
re-teaching the whole nav.

**Do not implement any of the above without sign-off** — moving/renaming tabs changes
muscle memory for existing users and must be a deliberate product call.
