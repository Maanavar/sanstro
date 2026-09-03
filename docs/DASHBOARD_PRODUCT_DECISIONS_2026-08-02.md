# Dashboard — Product Decisions, 2026-08-02

**Author's hats:** Tamil numerology practitioner · Thirukanitham astrologer · Product Owner
**Method:** read from the code, not from the docs. Every claim below carries a file:line. Where a
`docs/*.md` file says something is done and the code disagrees, the code wins.

---

## Verdict in one paragraph

The *engine* is not the problem. Ashtakavarga feeds the daily score and life areas
(`app/services/_dg_scoring.py`, `app/services/life_areas_service.py:1586`), Chandrashtama is on the
hero (`dashboard-today-tab-nova.tsx:494`), Gowri nalla neram, Horai, Abhijit, peyarchi, vedha,
neecha bhanga, holistic strength synthesis — all real, all wired. Vinaadi's astrology depth is
genuinely ahead of anything in the Tamil consumer market. The problem is that **the two newest,
most differentiating features cannot speak, and one of them cannot run at all in production.**
Numerology ships as bare integers because three review gates are still closed; Baby Name Finder is
now linked from the public nav and returns HTTP 503 in any real environment. Neither is an
engineering problem. Both are *my* problem — doctrine and content review — and that is the number
one item on this roadmap.

---

## P0 — Ship-blockers. Fix before anything else is built.

### P0-1. Baby Name Finder is linked from the public nav and 503s in production

- `app/calculations/numerology_naming.py:60` — `assert_canon_usable()` raises `UnverifiedCanonError`
  when `APP_ENV ∈ {production, staging}` and the pada canon is not 108/108 verified.
- `app/data/nakshatra_pada_akshara.py:92` — `CANON_VERSION = "0.1.0-draft"`, **0 of 108 rows verified**.
- `app/api/public_tools.py:1338` — that exception is converted to `503 SERVICE_UNAVAILABLE`.
- Commit `d6774e8` added `/tools/baby-name-finder` to `web/components/public-nav.tsx:81` and
  `public-footer.tsx:23`.

So in production the flow is: nav link → tool page → enter a baby's birth details → 503. The flag
`numerology_baby_naming` being `True` (`feature_flags.py:218`) does not help; the canon guard is
independent of it and is *correct* to fire.

**Decision — do both, in this order:**
1. **Now:** pull the nav + footer entries, or gate them on a build-time env check. Do not ship a
   navigation entry to a route that cannot answer. This is a one-commit revert of the nav half of
   `d6774e8`; the tool page itself stays reachable by URL for dev/test.
2. **Then:** run the NU-8a verification protocol on all 108 rows. This is the unlock, and it is
   mine to do — see P1-1.

### P0-2. Decide what "reviewed" means, and put a date on it

Three independent gates are closed right now:

| Gate | File | Withholds |
|---|---|---|
| `CONTENT_REVIEWED = False` | `app/services/numerology_content.py:81` | every root 1-9 and compound reading sentence |
| `CONTENT_REVIEWED = False` | `app/services/numerology_personal_year_content.py:41` | every personal-year meaning |
| canon `verified=False` ×108 | `app/data/nakshatra_pada_akshara.py` | all baby naming, in prod |

Plus `app/data/tamil_name_corpus.py` — `CORPUS_VERSION = "0.1.0-draft"`, assistant-authored, zero
rows reviewed.

The gates are *right*. Splitting them was right (Cheiro's titles shipped once we noticed a citation
isn't a claim about the reader; the name-correction legal warning shipped on its own gate). But the
net effect today is that a ~13k-line numerology tree renders as integers and graha names, and
**Peyar Porutham — fully built backend (`POST /numerology/compatibility`), fully typed client
(`packages/shared/src/api/numerology.ts:872`) — has zero frontend consumers** and is deliberately
withheld (`dashboard-numerology-panel-nova.tsx:56-60`).

**Decision:** the review pass is a scheduled work item with an owner and a date, not a background
wish. Scope it as four separable passes so partial completion still ships something:

- **Pass A — personal year (9 rows).** Smallest, highest daily value, already drafted
  (`numerology_personal_year_content.py:48`). Ship first.
- **Pass B — root 1-9 (9 rows × 2 languages).** The character notes. Ship second.
- **Pass C — compound 10-52 re-renderings (26 distinct + 17 echoes).** Cheiro's fatalism is already
  re-framed as tendency; this pass confirms the Tamil and the framing distance.
- **Pass D — the 108 pada rows.** Needs a named printed source per row, not an online table. This
  is the long one and it gates baby naming alone.

---

## P1 — Unlock what is already built. Zero new engines.

### P1-1. Peyar Porutham gets a home under the Compatibility tool

Built, tested, wrapped, unreachable. The reasoning for withholding it — "a numerology second opinion
with its reasoning removed would add tokens next to a complete reading" — is correct *while Pass B/C
are closed*. The moment they close, this ships, and it ships **inside the existing Porutham/
Compatibility tool as a second section**, not as a new tool card.

**Why there:** in Tamil practice a family asks jathaga porutham and peyar porutham in the same
conversation, from the same person, about the same two people. Two separate tools would be an app
IA that no Tamil household recognises. `dashboard-tools-porutham-nova.tsx` already has both people
selected — the numerology call needs no new input.

### P1-2. `lucky-dates` and `marriage-dates` — decide, don't leave them orphaned

The Dates view was cut on 2026-07-29 as pure duplication, and the reasoning holds
(`dashboard-numerology-panel-nova.tsx:29-52`). But the routes are still live and tested with no
caller, which is a maintenance liability that will rot.

**Decision:** fold the numerology `adjustment` column into the surfaces where the dates already
live — `/api/v1/activity-timing` for activity dates. Accept that the public muhurtham-naal page is
chart-less and therefore *cannot* carry it; say so in the naal page copy rather than leaving a gap
people assume is a bug. If that fold isn't scheduled within this quarter, delete the two routes.
Half-built is the worst of the three states.

### P1-3. Kill or build the "Recent results" stub

`dashboard-tools-tab-nova.tsx:380-390` renders a card that says tool-run history isn't tracked yet.
It is a promise with no backend behind it.

**Decision: build it, small.** The pattern already exists —
`app/models/numerology_name_session.py` stores *the question, never the answer*, which is exactly
the right privacy posture for a tool-run log. Generalise that model to `tool_sessions` (tool id,
inputs, timestamp — no computed output) and the Tools tab gets a real "pick up where you left off"
row. This also replaces the hardcoded "Most used" hero (currently always Porutham,
`dashboard-tools-tab-nova.tsx:335`) with a measured one.

---

## P2 — Dashboard IA. Three decisions.

### P2-1. Settings is in the primary nav *and* the account menu. Promote Tools into that slot.

- `dashboard-hero.tsx:37-46` — primary tabs: Today · Calendar · Family & Charts · Goals · Life Areas
  · **Settings**
- `dashboard-hero.tsx:48-51` — behind a "More ▾" dropdown: **Tools** · Explore · QA
- `dashboard-hero.tsx:478` — the account avatar dropdown *also* has Settings

So a duplicate destination holds a primary slot while the 11-calculator tab — which hosts both
flagship features, Numerology and Baby Names — sits two clicks deep. The Today tab's Quick Links row
(`dashboard-today-glance-nova.tsx`) exists specifically to paper over this, which is itself the
evidence that the IA is wrong.

**Decision:** remove `settings` from `TAB_DEFS`, promote `tools`. Settings keeps its account-menu
entry, its URL, and the onboarding gate's ability to route to it — nothing else changes.

New primary: **Today · Calendar · Charts · Life Areas · Tools** · More ▾ (Goals, Explore, Journal).

### P2-2. The Tools grid needs two tiers, not eleven equal cards

Eleven cards at identical visual weight (`dashboard-tools-tab-nova.tsx:148-226`) means the user
scans all eleven every visit. Three of them are cross-nav shortcuts to other tabs (Muhurta,
Panchangam), which is a different kind of thing wearing the same clothes.

**Decision:** two groups with real headings —
- **Readings** (needs your chart): Jadhagam Generator, Varshaphala, Compatibility, Numerology,
  Annual Wrapped, Retrospective
- **Timing & lookups**: Porutham, Activity Timing, Rasipalan, Baby Names, + the two cross-nav cards
  visually demoted to text links, since they are navigation, not tools.

### P2-3. Numerology's `disabled: needsProfile` strands the highest-intent visitor

`dashboard-tools-tab-nova.tsx:217` disables the Numerology card without a saved chart. Doctrinally
correct — Fortune Alignment needs a lagna, and `numerology_alignment_required` (`feature_flags.py:181`)
forbids an unscored recommendation. But the person with a *name* question and no chart is the most
common numerology visitor in Tamil Nadu, and today they hit a grey card.

**Decision:** don't enable it — **redirect** it. A disabled card gets a secondary link to the public
`/tools/numerology-calculator`, which already runs the chart-less path, plus one line: *"Save a birth
chart to see how these numbers sit against your jadhagam."* That converts a dead end into the
onboarding funnel.

---

## P3 — New capability, ranked by Tamil-market value

### P3-1. Rasi-level peyarchi palan (public) — **highest ROI in this document**

Every peyarchi route is chart-scoped: `app/api/transits.py:59` and `:74` are both
`/charts/{chart_id}/peyarchi...`. There is **no per-rasi public peyarchi surface anywhere** in
`web/app/`.

Sani peyarchi (every ~2.5 years) and Guru peyarchi (yearly) are the single largest recurring
astrology events in Tamil Nadu — the moments when people who never open an astrology app open one.
"Sani peyarchi palan for Rishaba rasi" is the highest-volume Tamil astrology query there is, and we
answer it for nobody.

Everything needed exists: `app/services/peyarchi_service.py`, `classifyPeyarchiToneFromMoon`
(`web/lib/peyarchi.ts`), Ashtakavarga bindus already wired into the peyarchi card
(`dashboard-chart-explanation-ashtakavarga.test.ts`), and the per-rasi public page pattern is proven
by `web/app/tools/indraiya-rasipalan`.

**Decision: build `/peyarchi/[planet]/[rasi]`.** 12 rasis × 2 planets = 24 pages, generated from the
engine, refreshed each peyarchi. Free, public, indexed. Each page ends at "see how this reads against
*your* chart" → signup. This is the acquisition engine the product does not currently have.

*Astrologer's note on doing it honestly:* a rasi-level palan is a Moon-sign gochara reading and
nothing more. It must say so. The bindu count for the transited rasi is the one thing that lifts it
above a newspaper column — show it, and show that the personal reading differs.

### P3-2. Panchapakshi (பஞ்சபட்சி) — the missing third leg of daily timing

Zero hits across the entire repo. We ship Gowri nalla neram and Horai; Panchapakshi is the third
system Tamil practitioners use for day-part timing, keyed on birth nakshatra and paksha, and it is
on essentially every competing Tamil panchangam app.

It is pure computation — no LLM, no interpretive corpus — so it does **not** stack another content
gate. It slots into `dashboard-today-ribbon-nova.tsx` beside Horai.

**Caveat, stated plainly:** it needs a sourced activity/bird/time table the same way the pada canon
did, and I will not draft that table myself and call it canon — that is exactly the mistake
`tamil_name_corpus.py` is currently paying for. Get a named printed source first, then build.

### P3-3. Numerology: the birth-date grid (எண் கட்டம்)

`app/calculations/numerology.py` computes psychic (janma), destiny (bhagya), name, namesake and
object numbers. There is no date grid — missing numbers, repeated numbers, planes.

In Tamil practice, the 3×3 grid is the *first thing drawn on paper* in a numerology consultation. Its
absence is the most conspicuous gap in an otherwise unusually rigorous numerology engine.

**Why it can ship now:** the grid itself is arithmetic — which digits appear in the birth date, how
often. That is a number, not a claim about a person, which is precisely the category the current
"numbers ship, prose waits" policy already allows (same reasoning that released Cheiro's compound
titles). Ship the grid as a visual with counts. The *interpretation* of a missing 4 or a triple 9
waits for Pass B like everything else.

### P3-4. Numerology: favourable day, colour and direction

Verified absent. These are the three most-asked, lowest-risk numerology outputs, and they are nearly
free: they derive from `NUMBER_TO_GRAHA` (`numerology.py:85`), and the graha→weekday mapping already
exists in the remedies engine (`app/calculations/remedies.py`, day fields on every remedy row).

**Decision:** derive them from the existing graha bridge, present them as *derivations* ("your
destiny number 6 → Sukran → Friday"), never as free-floating assertions. That framing is both more
honest and more impressive than the flat "your lucky colour is green" every competitor prints.

---

## Monetization — one decision that is currently unmade

`is_premium` is called in exactly six places (`app/core/subscription.py:22` and its callers): birth
profile count, family vault count, goals count, Ask Vinaadi daily usage, report purchase, and the
tier string on `/auth/me`. **Every deep engine is free to any registered user** — Varshaphala,
synastry, shadbala, propensities, all divisional charts, the entire numerology tree.

Premium today gates *quantity*. It gates no *depth*. That is not a tier plan; it is a rate limit.

**Recommendation (PO call, needs your sign-off):** price on the things a Tamil family actually pays a
real astrologer for, and keep free the things they'd otherwise get from a newspaper or a temple
noticeboard.

| Free (acquisition) | Paid (the thing they'd pay ₹ for anyway) |
|---|---|
| Daily guidance, panchangam, Today | Full jadhagam PDF |
| Rasipalan, peyarchi palan (P3-1) | Name correction |
| Porutham (jathagam) | Baby naming, once P0-2 Pass D lands |
| Public numerology calculator | Peyar porutham (P1-1) |
| Chandrashtama, muhurtham naal | Varshaphala + full-year forecast |

Note the pattern: **everything paid is a document or a decision someone carries out of the room with
them.** Everything free is something that is true today and stale tomorrow. That maps to how this
trade has always been priced in Tamil Nadu, and it needs no new engine — only `require_premium`
guards on routes that already exist.

---

## What I am deliberately *not* recommending

- **More daily-surface facts on Today.** It already carries briefing, score + band, best/avoid
  window, Horai, Abhijit, Chandrashtama, emotional weather, and Quick Links. It is at capacity. The
  next thing added there should replace something.
- **A Vakya panchangam engine.** `grep vakya` → zero hits, and some TN families do follow Vakya for
  vratham dates. But building a second ephemeris to serve a minority convention is disproportionate.
  **Do this instead:** a Learn note explaining Thirukanitham vs Vakya, and a one-line caveat on
  festival/vratham rows naming which system produced the date. Credibility with older users comes
  from *acknowledging* the difference, not from computing both.
- **A numerology tab of its own.** The 2026-07-22 IA ruling — one artifact, one canonical home — is
  right, and chart-aware numerology is an instrument applied to a chart. It stays in Tools. P2-1
  fixes the real problem, which was that Tools itself was buried.
- **Rebuilding anything in the astrology engine.** It is the strongest part of this product. Leave it
  alone and go finish the content review.

---

## Sequence

1. **This week** — P0-1 nav revert. One commit. Stops shipping a 503.
2. **This month** — P0-2 Pass A + B (18 rows of content review). Unlocks personal-year meanings and
   root readings; P1-1 Peyar Porutham follows the day Pass B closes.
3. **Same month, parallel (frontend work, no review dependency)** — P2-1 nav swap, P2-2 Tools
   grouping, P2-3 numerology redirect, P1-3 tool-session history.
4. **Next** — P3-1 peyarchi palan pages, timed to land before the next peyarchi.
5. **Then** — P0-2 Pass C + D. Pass D is the gate on baby naming and the only route to un-reverting
   P0-1.
6. **Sourced-table dependent, unscheduled** — P3-2 Panchapakshi, P3-3 grid, P3-4 day/colour/direction.

The one-line summary: **stop building engines, start opening gates.**
