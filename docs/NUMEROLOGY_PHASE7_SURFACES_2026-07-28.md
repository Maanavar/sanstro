# Numerology Phase 7 — the numbers-only surfaces

**Date:** 2026-07-28
**Branch:** `harden/production-readiness`
**Status:** Built, gates green, **not committed**
**Scope:** Web only. Mobile has no numerology surface and is unchanged — see §6.

Companion docs: `NUMEROLOGY_IMPLEMENTATION_PLAN_2026-07-25.md` (build status),
`NUMEROLOGY_DOCTRINE_RULINGS_2026-07-25.md` (D1–D6, NU-04, NU-05),
`dashboard-ia-audit-2026-07-22.md` (why these screens live where they do).

---

## 1. What this is

~14k lines of numerology backend were built, tested, committed and pushed with
**zero frontend**. This adds the frontend for the two-thirds of it that is
arithmetic, and deliberately leaves the rest alone.

The dividing line is not effort, it is honesty. `numerology_content.CONTENT_REVIEWED`
is `False`, so every interpretive string in every response comes back `null` by
design. A surface whose output is a number, a graha and a score is complete
without the corpus. A surface whose output *is* a sentence would render blank
space where the meaning goes, and would be rebuilt from scratch when the Tamil
review lands.

| Built | Route | Surface |
|---|---|---|
| Fortune Alignment | `POST /charts/{id}/numerology/alignment` | Tools → Numerology → Alignment |
| Favourable numbers | `GET .../favourable-numbers` | Tools → Numerology → Alignment |
| Personal cycle | `GET .../personal-cycle` | Tools → Numerology → Cycle |
| Saved name shortlist (NUM-58) | `POST`/`GET`/`DELETE .../name-sessions` | Tools → Numerology → Names |
| Lucky dates | `GET .../lucky-dates` | Tools → Numerology → Dates |
| Marriage dates | `GET .../marriage-dates` | Tools → Numerology → Dates |
| Public calculators ×3 | `POST /public/numerology/{profile,number,personal-year}` | `/tools/numerology-calculator` |

**Not built, on purpose** — both are in the plan's "shipped backend" column and
neither has a screen:

- **Name correction.** The analysis ships; the alternatives do not. Doctrine
  §9.4 requires the legal-consequence warning alongside any corrected spelling,
  and that warning is unreviewed Tamil, so the backend withholds the whole list
  (`alternativesWithheldReason: "pending_content_review"`). A screen whose entire
  purpose is to show alternatives has nothing to show. The **finding** it
  produces is surfaced instead, on the Alignment view — see §4.
- **Compatibility / Peyar Porutham (NUM-34).** Numbers ship, every summary
  sentence is withheld. The deciding instrument — Jathagam Porutham — already
  renders in full on the Compatibility tool, so a numerology second opinion with
  its reasoning stripped out would put bare tokens beside a complete reading.

---

## 2. Files

| File | Lines | Role |
|---|---|---|
| `web/components/dashboard-numerology-shared.tsx` | 375 | Vocabulary + primitives. **Read this first** — it carries the two rules everything else inherits. |
| `web/components/dashboard-numerology-panel-nova.tsx` | 97 | Tool shell, 4-way `Segmented`. |
| `web/components/dashboard-numerology-alignment-nova.tsx` | 336 | Fortune Alignment + favourable numbers. |
| `web/components/dashboard-numerology-cycle-nova.tsx` | 151 | Personal year / month / day. |
| `web/components/dashboard-numerology-names-nova.tsx` | 280 | NUM-58 shortlist, full create/list/delete. |
| `web/components/dashboard-numerology-dates-nova.tsx` | 435 | Lucky dates + marriage naals. |
| `web/app/tools/numerology-calculator/NumerologyCalculatorContent.tsx` | 457 | Public calculators. |
| `web/app/tools/numerology-calculator/page.tsx` | 103 | Metadata + FAQ JSON-LD. |
| `web/components/dashboard-numerology-shared.test.tsx` | 194 | 18 tests, all on the rules that fail silently. |

Modified: `dashboard-tools-tab-nova.tsx` (prop, tool card, render),
`dashboard-workspace.tsx` (`showNumerology` state, `openTool`/`closeTool`,
`activeTool` derivation, prop). **No Python touched.**

All API calls go through the 13 typed wrappers in
`packages/shared/src/api/numerology.ts`. No new `apiFetchJson` call site was
added — the web bypass pattern was not grown.

---

## 3. Where these screens live, and why

**Tools tab, as one inline tool with four views.** Not a new tab, not the Today
homepage.

The IA spec resolved D2 as "keep one tab, de-duplicate" and its guiding
principle is *one artifact → exactly one canonical home*. The Tools tab already
describes itself, in its own page heading, as **"Calculators that know your
charts"** — which is precisely what chart-aware numerology is: an instrument
applied to a saved chart, not a new lens on the chart itself. Hosting it there
costs no change to the `Tab` union, `RESTORABLE_TABS`, `URL_ADDRESSABLE_TABS`, or
the workspace render switch — the four-way contract that has to move together.

**One deliberate deviation from the brief.** The handoff notes that favourable
numbers is "the one numerology reading that can sit on a dashboard unprompted",
which points at Today. It is not on Today. The IA audit's F2 finding is that
Today is already the second-densest surface in the app and its Deep Dive was cut
back for exactly that reason; adding a ninth card to it to launch a tool that is
still behind an off flag inverts the priority. The section loads unprompted
*inside* the tool, so the "needs no input" property is preserved. **This is a
product call, not a technical constraint** — moving it to Today later is a
props-passing change, and the section component takes only `lang` and `chartId`.

---

## 4. The rules the frontend is holding

These are enforced in code, not in review notes.

### 4.1 No unreviewed prose ships

`ReadingsWithheldNote` is the only thing that renders when `readingsAvailable`
is false, and it says the words are missing on purpose. Nothing in this tree
substitutes for a withheld sentence. The rule for future edits is stated at the
top of `dashboard-numerology-shared.tsx`: **render tokens, never author
meaning.** Turning `"strongly_aligned"` into "Strongly aligned" is rendering a
token. Writing "your name number suits Saturn, so expect steady progress" is
smuggling the withheld corpus past the gate the backend enforces.

The prose that *does* render on the Dates views — `panchangamSupport`,
`dashaSupport`, `cautions`, tara names, naal reasons — belongs to the muhurta and
muhurtham-naal engines. It is reviewed, already live elsewhere in the app, and
this layer only passes it through. The numerology's own `noteEn`/`noteTa` arrive
null and are not rendered.

### 4.2 Doctrine D6 — the compound surrogate

`CompoundLine` refuses to print a bare compound when `compoundBeyondSeries` is
non-null. It names **both** numbers and says which one is being described,
because the encoded meaning belongs to a different number than the name actually
makes. Ten of twelve realistic three-part Indian document names measured past
Cheiro's 52, so this is the ordinary case for a full legal name, not a corner.

Pinned by four tests, including the Tamil path — an English-only guard would
leave the more likely reader unprotected.

### 4.3 A number never overrides a graha

- Every alignment row leads with the **graha and its functional role in this
  chart**, with the digit as a badge beside it. The score is a function of
  lordship, and a reader who takes away only "7 scored 82" has read a number
  where a graha was meant.
- On both Dates views the **astrology score renders first and unmodified**.
  `slot.score` and `match.matchScore` are the muhurta and almanac engines' own
  verdicts; `adjustedScore` sits beside them, so what the numerology moved is
  visible rather than folded in.
- `clampedByAstrology` gets its own sentence: the engine had a lift to give and
  the panchangam's flag on the date took it away. A silently-dropped lift is
  indistinguishable from no lift.

### 4.4 The banned fear trade

No verdict label reaches for the fear register, in either language, and a test
asserts it against the same word list the backend lints its corpus with.
`misaligned` reads as *"out of step"* — a statement about the fit between a
number and a chart — never as a claim about the person.

### 4.5 The flag is checked before the chart

`isNumerologyUnavailable()` reads a 404 on a numerology route as **"not launched
yet"** and renders it as such. This is not defensive coding: the backend checks
`numerology_engine` *before* it checks the chart, deliberately, so a flag-off
deployment answers 404 identically for a real chart and a made-up one. Rendering
that as "chart not found" would be a lie about the user's own data. Three tests
pin the discrimination, including that it does not swallow a 500.

---

## 5. Gates

| Gate | Result |
|---|---|
| `web` tsc | clean |
| `@vinaadi/shared` tsc | clean |
| `mobile` tsc | clean |
| `web` eslint (`--max-warnings=0`) | clean |
| `web` vitest | 36 files, **243 passed** (18 new) |
| `mobile` jest | 6 suites, 70 passed |
| `pytest -m no_db` (sqlite) | 1778 passed, **1 failed**, 1 skipped — see below |
| ruff | **no-op — zero Python files touched** (`git status` confirms) |

The 32-minute `-m "not no_db"` DB suite was **not re-run**. No Python file was
touched, so it has no changed code under it. Say so rather than implying it was
run.

### The one pytest failure — `test_perf_calculate_daily_panchangam`

Not caused by this work: **zero Python files were touched**, so the Python tree
is byte-identical to HEAD. It is the wall-clock budget the handoff already flags
as load-sensitive.

But do not record it as "verified idle flake", because it was not verified.
Measured, four runs: **2.829s / 2.397s / 2.086s / 4.209s against a 1.0s budget**,
on a machine sitting at ~66% CPU (OneDrive sync + two VS Code hosts + Edge). It
did not pass once. A 2–4× miss is wider than "a bit of load" comfortably
explains, and nobody has yet run it on a genuinely idle machine to see whether it
recovers.

**Owed:** one run on an idle machine. If it still lands above 1s there, the
budget or `calculate_daily_panchangam` has genuinely regressed and that is a
separate investigation — it just is not this one.

---

## 6. What is owed

1. **Authenticated browser pass.** Every screen here is behind login, and until
   today also behind an off flag, so none of it has been seen rendered. This is
   the same debt several prior tranches carry, and the Dasha Timeline revamp is
   the cautionary tale — two silent bugs passed every gate and were caught only
   by a screenshot. Still owed.
2. **Tamil pass.** The Tamil strings in this tree are field labels and status
   copy, not the reviewed corpus, but they are still Tamil written without a
   native reader. Still owed.
3. **Mobile.** No numerology surface exists on mobile. The shared wrappers are
   already there and typed, so it is a rendering job, not an integration one.
   Deliberately out of scope here; flagged rather than silently skipped.
4. ~~**Sitemap.**~~ Done 2026-07-28, in the same change that flipped the flag
   (item 5) — `/tools/numerology-calculator` is now in `web/app/sitemap.ts`, the
   public nav `Tools` dropdown, and the footer's tools column.
5. ~~**Turning the flag on is a separate decision.**~~ Done 2026-07-28 — user
   call, made explicitly (not inferred): `numerology_engine` flipped to `True`
   in `app/services/feature_flags.py`. This launches the numbers-only surfaces
   (favourable numbers, Fortune Alignment, personal cycle, lucky/marriage
   dates, name sessions) plus the family-member "Reading for" switcher added
   the same day (`dashboard-numerology-panel-nova.tsx`). It does **not** launch
   the two withheld screens in §7 below — those are gated on
   `CONTENT_REVIEWED`, a separate flag this change did not touch, so every
   interpretive string still nulls out exactly as before.

---

## 7. When the corpus clears review

The two withheld screens become buildable, in this order:

1. **Name correction** — needs `legalWarningEn`/`legalWarningTa` to become
   non-null. The wrapper's own contract note applies: display the warning *with*
   the list, not behind a disclosure. Users change legal names and then Aadhaar,
   KYC, passport and certificates disagree for years.
2. **Peyar Porutham** — layers onto the existing `/relationships/compare`
   surface rather than getting its own screen, since `authority:
   "jathagam_porutham"` already says which instrument decides.

Neither needs new backend work. Both need the Tamil review, and Sethuraman's
*Adhista Vingyanam* would close D6 alongside it.
