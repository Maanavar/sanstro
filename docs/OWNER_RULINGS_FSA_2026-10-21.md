# Owner Rulings on the Full System Audit — 2026-10-21

Rulings on [`FULL_SYSTEM_AUDIT_2026-10-21.md`](FULL_SYSTEM_AUDIT_2026-10-21.md),
given the same day. This file records each ruling **verbatim** where it
constrains future work (CLAUDE.md: *record the constraint verbatim*), what was
built against it, what was measured, and two points that need confirmation
before the next step.

---

## The governing principle (verbatim)

> **One question, one rule engine, one answer.** The same birth details or the
> same muhurta time must produce the same result whether it surfaces in the
> public tool, the signed-in dashboard, the PDF export, or a push notification.
> A rule may legitimately differ by purpose (marriage versus a shop opening) or
> by parampara (one lineage's custom versus another's) — but then that is one
> engine with a declared parameter, not two engines disagreeing by accident.

Standing requirements:

1. **Every rule names its source in the output.** Which grantham, which parampara, which classical table.
2. **Every number names its datum.** From birth, or from the start of the mahadasha. From janma rasi, or from janma nakshatra.
3. **Where paramparas differ, the difference is a setting, not a silent choice.** Make the profile explicit and show the user which one they are reading.

---

## Status

| Item | Ruling | State |
|---|---|---|
| FSA-03 | Noindex now; classify the 87 by datum vs arithmetic; regenerate from the engine | Hold (all 27) and classification done; **engine timings built and rendered on all 27 + base pages; base-page prose cleaned; Rohini prose cleaned as pilot; 26 visual pages' prose open** (§7.1) |
| FSA-03b | (found 2026-10-21) the live, indexed base pages carried the same bare-age errors | **Done** (§7.2) |
| FSA-04 | Correct the 12-sign table; ~~split~~ (withdrawn, §2.1); D11 recorded | **Done** — table corrected + gated, 8th row labelled, D11 recorded as a reasoned choice |
| FSA-01 | Remove the sunrise-lagna factor; do not repair | **Done** — removed from both paths, gated; 1216-test muhurta suite green |
| §8.3 / FSA-17 | Hide months now (P0); disclose per component on the paid page; name it Varuda Palan | **Done** (§4) |
| FSA-02 | Per-karya star lists + tradition profile | Approved (§7.4); not built; three tables and the gandanta reading await the astrologer |
| §8.4 URLs | Keep Sanskrit URLs; Tamil name first in title and H1 | **Done** — Option A ruled (§8.1) and built |
| Year lord | Five-candidate architecture; weekday lord rejected | **Blocked** on documented textual rules (§8.4) |
| Shatabhisha Saturn | Age-independent rewrite | **Done** (§8.3) |
| Rohini release | — | **Hold** until Tamil and content review (§8.2) |
| Native Tamil review | — | **Release requirement** (§8.6) |
| Mobile 6/8 | Add the note to the mobile porutham screen as a disclosure | **Done** (§7.6) |

Nothing here is committed.

---

## 1. FSA-03 — dasa timings

> Ruling: noindex the 21 pages now. Then establish the datum before assuming all
> 87 errors are arithmetic. Republish only what the engine computes.
>
> State the datum in every published timing. Write "12 yr 6 mo from the start of
> Saturn dasha", never a bare number a reader will read as his age.
>
> Republish a page only when its arithmetic can be re-derived on demand.

### 1.1 The hold — 27 pages, not 21

`web/lib/natchathiram-dasa-hold.ts` holds every `/natchathiram/<slug>/visual`
page: `robots: { index: false, follow: true }` on both the English and `/ta/`
twins, and none of them in the sitemap.

**Why 27, when the ruling said 21.** 21 was the number of pages the audit's
parser could read, and the audit called it a floor. The other six (Ashwini,
Bharani, Krittika, Rohini, Mrigashira, Ardra) phrase the same claims differently
and carry 42 timing figures between them, with the same errors. For example:

- Bharani: "Venus–Rahu antardasa (approximately years 12–14 of the dasa)". Vimshottari puts it at years 7.2–10.2.
- Rohini: "Moon–Rahu antardasa (approximately ages 8–9)". For a Rohini native it ends by age 2.9 at the latest, whatever the balance.

By the ruling's own test ("republish only what the engine computes") none of
the 27 qualifies. **If you want only the 21 held,** filter `DASA_TIMING_HOLD`
in that file down to them; the sitemap and tests follow automatically.

Gate: `web/lib/natchathiram-dasa-hold.test.ts` — evaluates each page's real
`generateMetadata` on both twins, and the sitemap. Run once with the hold
emptied: **28 of 30 fail**. Blind spot: it proves the pages ask not to be
indexed, nothing about their content. Already-indexed URLs leave Google's index
only as it recrawls them; Search Console removal can speed that up once the
domain is live.

### 1.2 Classification of the claims

Every "X–Y antardasa (~yr N of X[, ~age(s) A–B])" claim on the 21 parseable
pages, against Vimshottari. Bhukti = MD years × AD years ÷ 120, in the fixed
order starting from the dasa lord. The pages state their own datum for N
("of Saturn" = from the start of Saturn dasa). The ages are from birth; for a
native of that star the dasa starts at an age set by the birth balance, so
each age is checked against the full range of possible balances.

| Class | Meaning | Count |
|---|---|---|
| ARITH_OK | N is right, from the start of the dasa | 59 |
| AGE_AS_YR | N is wrong from the dasa start, but is a *possible age* for that bhukti — a right number under the wrong datum label | 20 |
| ROW_SHIFT | N lands in the neighbouring bhukti — a table row slipped | 7 |
| WRONG | none of the above | 60 |

The stated **ages are a second, independent defect**: 65 of 146 cannot occur
for any birth balance. That includes 16 of the 59 claims whose "yr N" is right.
**No page has every claim right on both counts.** One of the 87 sits within
0.15 yr of a bhukti edge (Ashlesha, Ketu–Mercury at 6.0), so it is
convention-sensitive rather than wrong.

**What this means for the fix.** At most 20 of the 87 could be repaired by
relabelling, and 13 of those 20 also carry impossible ages. The job is a
**regeneration**, not a relabelling — which is what the ruling's step 3 already
requires. The size is all timing text on 27 pages, not 87 numbers.

### 1.3 Open (steps 3–6)

- Generate each page's timing text from `app/calculations/dasha.py` arithmetic,
  with the datum in the sentence. A fixed age cannot be stated for a star; state
  "from the start of Saturn dasa", or a range over the balance.
- Conversion convention: 365.25-day years is already the single convention in
  all six dasa engines (verified in the audit). Use the same for page text.
- Lift each page from the hold only when a test re-derives its numbers. The
  classification script is the seed of that test.

---

## 2. FSA-04 — Chandrashtama tool

> Correct the public 12-sign table to 1, 3, 6, 7, 10, 11 favourable; 2, 4, 5, 8,
> 9, 12 adverse. The backend's classical table stands as the source.
>
> Separate the tools. Chandrashtama = the 8th star from janma nakshatra. Gochara
> = the 12-sign Moon transit. Two tools, two labels, no overlap.
>
> Keep Tarabalam distinct from both — it is a third reckoning.

### Built

`web/app/(marketing)/tools/chandrashtama/page.tsx`:
- every row carries `favourable`, equal to {1, 3, 6, 7, 10, 11}, and its text says favourable or adverse;
- the table is headed **சந்திர கோச்சாரம் / Chandra gochara** and names its source (Phaladeepika, the source `gochara_scores.py` cites);
- the bilingual echo under the result is removed, and so is the ⚠ emoji;
- three Tamil strings that mixed in "Vinaadi", "Dashboard", "Chandrashtama" and "Janma Rasi" are now all Tamil. **Unreviewed by a native reader.**

Gate: `tests/test_public_moon_gochara_table.py` compares the page's flags with
`GOCHARA_FAVOURABLE_FROM_MOON["MOON"]`. It fails when the 9th is flipped back.
Blind spot: it checks the flag, not the wording beside it.

### 2.1 Resolved: 8th rasi, and no split (follow-up ruling, same day)

> Chandrashtama — yes, I meant the 8th rasi. I was wrong, and D11 is right. My
> sentence said 8th nakshatra from janma nakshatra. That was a straight error,
> not loose phrasing. Do not follow it.
>
> And do not split the tool. My split recommendation rested on the bad premise.
> Chandrashtama is the 8th position of the same twelve-rasi gochara table the
> panchangam already uses — one table serves both … Fix those [the 5th and 9th],
> label the 8th row as the Chandrashtama position, keep Tarabalam separate.
>
> Record D11 as a reasoned choice so no one reopens it in a year.

Done: the 8th row reads "the Chandrashtama position", the page notes that one
table serves both, and the reasoned-choice record is §17 of
`CHANDRASHTAMA_SURFACE_DIVERGENCE_2026-09-09.md`. That record includes the
owner's qualification: some lineages reckon from the nakshatra; if that is ever
wanted, it arrives as a tradition-profile parameter, never as a change to D11.

The question as it was put, kept for the record:

The ruling defines Chandrashtama as **"the 8th nakshatra from janma nakshatra"**.
The standing rule in this repo (D11/§16, ruled 2026-09-10,
`docs/CHANDRASHTAMA_SURFACE_DIVERGENCE_2026-09-09.md`) is the Moon in the
**8th rasi** from the janma rasi — a 210° offset — resolved to the janma star
for the day's prohibition. The two are not the same:

- the 8th *nakshatra* is +7 stars, about 93°;
- the 8th *rasi* is about +16 stars, 210°.

The 8th star from the janma star is a **Tarabalam** position (the 8th tara,
Mitra), and the ruling itself keeps Tarabalam separate. Implementing the
sentence literally would move every user's Chandrashtama day by roughly a
week, onto a day Tarabalam counts as friendly.

**Question:** is the intended rule the existing one — the day the Moon
transits the 8th rasi, named for the janma star (D11) — so that "8th" in the
ruling means the 8th *rasi*? Until answered, the split is not started and D11
stands.

---

## 3. FSA-01 — sunrise lagna

> Ruling: remove the factor. Do not repair it.
>
> If a month factor is still wanted, build it honestly: correct Tamil months,
> labelled Tamil month custom, user-visible, and switchable by tradition profile.
>
> Chithirai … some lineages do avoid Chithirai for kalyanam. But that is a
> community custom, and it must be labelled and switchable as one.

### Built

- `muhurta_engine._lagna_sign_factor`, `_registry_lagna_sign_factor` and the `include_lagna_sign` switch are deleted. No path scores a lagna off a day.
- The **conditional-sign** case (Namakarana and Snaana signs approved "only when a benefic occupies the sign") lived only on the sunrise path. It was moved into `lagna_sign_factor_at_window`, not dropped. Otherwise those signs would have read "the text names it neither way".
- The signed-in picker's `include_lagna_sign=False` is gone, so the public and signed-in tools now score a day identically.

Gates:
- `tests/test_muhurta_no_sunrise_lagna.py`: a day's score must not change when only its sunrise lagna changes. It runs over all twelve sunrise signs and every sourced activity plus marriage. Against the unmodified engine (a `HEAD` worktree): **50 failed**.
- `test_muhurta_sourced_activities_e2e.py`: the conditional-sign test now checks every conditional sign at the window, and the Tamil-copy test covers the window factor.

Blind spot: the public `/muhurta` route still does not judge the lagna at the slot it returns (FSA-10).

**Not built:** a Tamil-month custom factor. The no-wedding months (Aadi,
Purattasi, Margazhi) are already scored by `_marriage_month_factor` (F-MUH-01).
A Chithirai-avoidance custom would belong to the tradition profile in §5.

---

## 4. §8.3 — Tajaka / Varshaphala code review

> Audit the code first, then label. Varshaphala engine present (muntha, sahams,
> year-lord) → sell it as Varshaphala, openly. North Indian chart layout only →
> rename the feature, do not call it Tajaka. Either way it comes off the page as
> Tamil astrology.

What `app/calculations/tajaka.py` and `app/services/tajaka_service.py` compute:

| Element | Present? |
|---|---|
| Solar-return (varsha pravesha) moment and chart, sidereal Lahiri | **Yes** |
| Varsha lagna, at the birthplace | **Yes** |
| Muntha (natal lagna + completed years) | **Yes** |
| Year lord | **Substitute.** The weekday lord of the solar-return day (`_TAJAKA_YEAR_LORD_BY_WEEKDAY`). The Tajaka varsheshwara is chosen from the five office-holders (pancha-adhikari) by strength and aspect to the varsha lagna |
| Sahams | No |
| Mudda / Patyayini dasa | No |
| Tajaka yogas | Itthasala and Isarafa only, as a same-rasi ±5° approximation labelled "Simplified" (Doctrine §9) |
| Area outlook | House placement of a karaka, the year lord and muntha from the varsha lagna — a product heuristic |
| "Favourable months" | **Not computed — new defect FSA-17.** A constant per score band: every area scoring ≥ 70 on every chart gets months [2, 4, 6, 9, 11]; 50–69 gets [3, 5, 8, 10]; below gets [1, 7, 12]. Shown on web (`dashboard-varshaphala-panel.tsx:161`, mapped onto Jan–Dec although a Tajaka year starts at the solar return) and mobile (`varshaphala/index.tsx:161`) |

**Answer to the ruling's test:** more than a chart layout, less than a
Varshaphala engine. The solar-return chart and muntha are real; the year lord
is a substitute; sahams and the Tajaka dasas are absent.

### 4.1 Ruling (follow-up, same day)

> Hide the favourable months today. FSA-17 is the serious finding here, well
> above the missing sahams … This goes at P0 beside the dasha pages, ahead of
> the renaming.
>
> Put this on the paid page itself, not in a help article. And when the months
> eventually return, derive them from the individual's chart with the method
> written down first — do not swap the fixed bands for a second
> plausible-looking formula.
>
> "North Indian" describes a chart format, not a calculation system … What
> you've built is a partial Varshaphala … Varuda Palan (வருடப்பலன்) —
> simplified annual chart. If the pricing page needs English first, Simplified
> Annual Chart (Varuda Palan). Mention "North Indian" only if you're describing
> the chart format on screen.

(This supersedes the name this file first recommended, which wrongly used
"North Indian".)

### 4.2 Built

- **Months hidden at the source.** `tajaka_service` always sends `favourableMonths: []`. The field stays because it's a wire contract on four surfaces. Web and mobile also stopped rendering it, so a backend regression can't bring the months back alone.
- **The disclosure on the paid feature itself.** `packages/shared/src/constants/varuda-palan.ts` holds the component table, which the web panel and mobile screen render from the same rows:

  | Component | Status |
  |---|---|
  | Annual solar-return chart | Computed |
  | Muntha | Computed |
  | Year lord | Approximate — weekday stand-in, not a panchadhikari determination |
  | Favourable months | Hidden |
  | Sahams | Not implemented, not claimed |
  | Tajaka dasa | Not implemented, not claimed |

- **Renamed** to Simplified Annual Chart (Varuda Palan) / வருடப்பலன் — எளிமைப்படுத்தப்பட்ட ஆண்டு ஜாதகம் on the web panel, tools tab, pricing, setup tab, family view, the mobile screen, tools list, Me tab and premium page, and the shared tier copy. Internal identifiers (`varshaphala` route, module, i18n keys) are unchanged.
- **Two promises removed.** The panel and the tools tab both described "a month-by-month outlook for any year", which is exactly the fabricated output.
- **Fixed while there:**
  - *Mobile score scale.* It printed "72/10" and coloured on 7/4 thresholds against a 20–90 score, so every area was green.
  - *Display boundary.* Mobile rendered `solarReturnLagnaName`, `munthaRasiName`, the bare `yearLord` and the area wire code; web rendered the area code. Both now go through `rasiDisplayName`, `tPlanetLord` and a shared area-label map.

Gates:
- `tests/test_charts_api.py::test_varshaphala_never_sends_favourable_months_fsa17` — fails on the unmodified service (HEAD worktree).
- `web/components/dashboard-varshaphala-panel.test.tsx`, in both languages — feeds the old months in and asserts they never render; fails when the render is restored.

Blind spots: no mobile render test (mobile was type-checked only), and the new Tamil copy is unreviewed by a native reader.

**Still open:** a real varsheshwara (panchadhikari) selection. Until it exists,
the year lord stays labelled approximate. Months come back only with a written,
ruled method.

---

## 5. FSA-02 — per-karya star lists (design, not built)

> Replace the single global good-star flag with per-karya star lists. Magam and
> Moolam become caution stars for general beginnings while remaining permitted
> for marriage.
>
> Some Tamil lineages avoid Magam for marriage as well, on the pitru ground. Do
> not hard-code one lineage's view as the shastra. Make it a tradition profile
> the user selects, and show which profile the answer follows.
>
> Magam — accepted for marriage; avoided for new ventures (gandanta).

Shape proposed for review before any code:

- **One table, keyed by karya:** `VIVAHAM`, `AARAMBAM`, `GRIHA_PRAVESAM`, `PRAYANAM`, plus the existing Kalaprakasika activities. Each entry gives `permitted`, `caution` (with a reason code such as `GANDANTA` or `PITRU`), and a source line.
- **Tradition profile:** a named, user-visible setting (default plus at least one "avoid Magam for marriage" lineage) that overrides specific cells. Every answer carries the profile it followed.
- **One reader:** the calendar badge, the muhurta almanac factor (`muhurta_engine.py:613`), the PDF (`pdf_export_service.py:704`) and push (`daily_push_cron.py:293`) all call one function `(star, karya, profile) → verdict + reason + source`. `SUBHA_NAKSHATRAS` and `AUSPICIOUS/CAUTION_DAILY_NAKSHATRAS` are retired into it.
- **Daily view:** never one verdict for the day. Show per-purpose lines, e.g. "Magam — accepted for marriage; avoided for new ventures (gandanta)".
- **Gate:** for every (karya, profile), `permitted ∩ caution = ∅`, and the four surfaces return the same verdict for the same star.

Open for the astrologer: the per-karya lists themselves beyond Magam and
Moolam. The existing activity tables (`MARRIAGE_NAKSHATRA_ALLOWED` and the
Kalaprakasika registry) cover the sourced activities, but `AARAMBAM`,
`GRIHA_PRAVESAM` and `PRAYANAM` need their tables named.

---

## 6. §8.4 — nakshatra URLs (not started)

> Keep the Sanskrit URLs; change the display names. Tamil name first in title and
> H1, Sanskrit in brackets. Add Tamil-spelling URLs only as 301s to the canonical
> ones.

Current state, for whoever picks this up: the visual pages' titles already lead
with the Tamil name ("Anusham Nakshathiram — Visual Profile") but carry no
Sanskrit in brackets. The H1s and the base `/natchathiram/<slug>` pages were not
checked.

---

## 7. Second round of rulings (same day) and what was built

### 7.1 FSA-03 — rebuild all 27 from the engine

> Decision: rebuild all 27 pages from the engine. Keep all 27 on noindex and out
> of the sitemap. Generate every timing from dasha.py, using the 365.25-day year.
> There is no second implementation of Vimshottari arithmetic in the frontend.
> Every sentence names its starting point … Bare year numbers are banned. Ages
> from birth appear only when calculated from an actual birth balance. A range
> across possible birth balances must be labelled as a range. … A page leaves
> the hold only when its tests pass, and each release is a deliberate decision.

**Correction to the ruling's example.** It reads "Venus–Rahu antardasha begins
12 years 6 months after the start of Venus mahadasha". The engine says **7 yr
2 mo** (Venus 3 yr 4 mo + Sun 1 yr + Moon 1 yr 8 mo + Mars 1 yr 2 mo). The
example is pinned at the right value in both test suites so nobody copies it.

**Built:**

- `scripts/generate_natchathiram_dasa_timings.py` calls the engine itself
  (`calculate_vimshottari_timeline`, `_build_subperiods`, `calculate_opening_dasha`)
  at both balance extremes and writes `web/lib/generated/natchathiram-dasa-timings.ts`:
  per star, the balance by pada, and per mahadasha its length, start/end age
  range, and every bhukti's offset from the dasa start, duration and start-age
  range. The frontend formats only. `[y, m, d]` is the book convention (twelve
  30-day months to a year) for writing the same 365.25-day number.
- Visual pages: `period` and `ageRange` are gone from the type and from all 27
  pages (216 hand-typed fields). The timeline label, the new bhukti table in each
  dasa's panel (datum in the column header: "After Venus dasha begins") and the
  footnote all render engine data. "At This Age" is now "What to Expect" — it
  was itself an age claim. Each page passes only its own star's timings, so the
  ~800 KB table never reaches a client bundle.
- **Rohini prose rewritten as the pilot** (EN + TA, 60 edits). The arithmetic
  showed wrong *placements*, not just wrong numbers: "marriage in Rahu–Jupiter
  (28–30)" — Rahu–Jupiter is Rahu's second bhukti, starting at 9–20;
  "Rahu–Venus, the 2nd sub-period" — it is the 6th; "Mercury–Venus, the 1st
  sub-period, 11 months 27 days" — it is the 3rd and lasts 2 yr 10 mo;
  "Mars–Venus lasting 20 months" — 14 months. Every timing now points to the
  bhukti table. Life-stage words were kept only where they hold over Rohini's
  whole range. **Rohini stays on hold** — release is your decision.

**Gates:**

- `tests/test_natchathiram_dasa_timings.py` (12) — committed file is current;
  lord sequences; bhukti boundaries tile each dasa; birth-balance bounds; ages
  checked against the engine's own calendar dates for a synthetic birth;
  pada balances; y-m-d round-trip. Fix removed (one number changed in the
  committed file): fails.
- `web/lib/natchathiram-dasa-prose.test.ts` — no visual page declares a timing
  field; each lists its dasas in engine order; **any page outside the hold must
  have zero timing claims in its dasa prose.** Fix removed (Rohini lifted before
  its rewrite): fails. After the rewrite: passes.
- `web/components/natchathiram-dasa-timing.test.tsx` — the tables print the
  engine's values column by column, in both languages.

**Blind spots, by construction:** the prose detector (`web/lib/dasa-prose-timing.ts`)
bans every digit, decade word, spelled duration and ordinal sub-period in dasa
prose — but cannot see a *life stage standing in for an age* ("lands in
adolescence", "around marriage age"). Those are reviewed by hand against the
star's range, as done for Rohini. It also reads the visual pages' dasa regions
only, not their other sections.

**Open:** the other 26 visual pages' prose (24–71 flagged phrases each, ~1,200
in all). Same method as Rohini: remove the timing, re-anchor to the table, check
each life stage against the star's range.

### 7.2 FSA-03b — the live base pages (found while doing 7.1)

The indexed `/natchathiram/<slug>` pages — **not** on the hold — carried the
same defect: 65 sentences across 24 stars (Tamil) and 7 (English). Examples:
Krittika "Mars dasha 13–20" (really starts 10–16); Bharani "Jupiter 56–72"
(41–61); Purva Phalguni "Venus can last 5 to 20 years" (0–20); Swati "Rahu 5,
10 or 15 years" (0–18); Jyeshtha "padas 3–4: one or two years" (0 to 8 yr 6 mo);
Shatabhisha "Saturn until 70" (ends 35–53). Two were sequence errors:
**Hasta's Tamil skipped Mars dasa** (Moon → Rahu; correct is Moon → Mars → Rahu),
and **Anuradha's said life starts "after Ketu dasa or directly in Saturn"**
(Anuradha opens in Saturn; Ketu comes after Mercury). Shravana's English put a
professional start in Mars dasa, which begins between birth and age ten.

**Built:** the base page now renders the engine's balance-by-pada and
mahadasha tables above the prose; 81 edits remove every number from paragraphs
that mention a dasa, in any section (three were in the family/career sections).
Gate: the same test file — every Tamil and English paragraph that mentions a
dasa, all 27 stars, zero claims. Fix removed: 31 failures. It once passed
vacuously by reading the wrong English map behind a `?? []`; that fallback is
gone, and a missing entry now fails.

**Still for review:** Shatabhisha's Saturn paragraph still speaks of
"children's marriage, retirement planning" in a dasa that ends at 35–53 — the
number was removed, the life stage needs the author's rewrite.

### 7.3 Varuda Palan year lord — blocked on the text

> Decision: approve the five-candidate architecture. Reject the weekday lord as
> the year lord. Keep the "Approximate" disclosure on the paid page until the
> real method ships. … Eligibility first … Tajaka aspects … Strength. The
> provisional method is panchavargiya bala … No invented weights … Ties and
> fallback. If the source gives no tie-break or no-aspect rule, document that
> gap. … Status: blocked. The astrologer must name the governing text, probably
> Tajaka Neelakanthi … Do not write code until this is done.

Questions to send with it: (1) do inimical aspects (1/7, 4/10) qualify, or only
friendly (3/11, 5/9)? (2) whole-sign or degree-based with deeptamsha orbs?
(3) which hadda table? (4) the text's rule when no candidate aspects the varsha
lagna. Note: the tri-rashi and dina-ratri lords depend on whether the **solar
return** falls by day or night, not the birth.

### 7.4 FSA-02 — approved, with two points for the astrologer

> Decision: approve one table keyed by purpose, a tradition profile, and one
> shared function. … For new starts (AARAMBAM), the caution set is all six
> gandanta stars … Missing tables … show "no sourced ruling for this purpose."
> Do not copy a general auspicious list, and do not treat unlisted stars as
> permitted.

- **Whole star or junction pada?** Gandanta strictly is the last pada of
  Revati/Ashlesha/Jyeshta and the first of Ashwini/Magha/Moola. Whole-star
  caution would mark Ashwini (kshipra) and Revati (mridu) — among the best stars
  for beginnings in muhurta texts — as caution. Ask which, and from which source.
- **Retire, not merge,** for `SUBHA_NAKSHATRAS`: an entry survives only where it
  names a purpose and a source; otherwise merging would carry a general list into
  the purposes the ruling says must read "no sourced ruling".
- The profile is a new DB column and an API change on all four surfaces; PDF and
  push must read the user's profile, not the default.

### 7.5 §8.4 — display names: one conflict to confirm

> Title and H1: அனுஷம் நட்சத்திரம் (Anuradha). This applies to both
> /natchathiram/<slug> and /natchathiram/<slug>/visual. It also applies to the
> English pages. … The title, H1, canonical URL and page language must agree.

Tamil script on an English page conflicts with the standing ruling "active
language only, no bilingual echo", and with this ruling's own condition that
title and page language agree. Proposed: English pages *Anusham Nakshatram
(Anuradha)*; Tamil pages *அனுஷம் நட்சத்திரம் (அனுராதா)*; names taken from
`tNakshatra`, not typed. Not built until confirmed.

### 7.6 Mobile 6/8 note — done, and one defect it exposed

`mobile/app/(tabs)/tools/porutham.tsx` renders the server's verbatim note under
the score, caution tint, outside the score and veto row.

The 6/8 relation is between Moon **signs**, and nine stars straddle two signs.
Mobile sent no pada, so the backend assumed the majority half. Measured: of
the 405 pairings involving a split star, **144 change their 6/8 answer with the
pada** — and the Rasi kuta with them. Mobile now asks which half (as rasi chips)
for the nine split stars before it will calculate, via a new shared
`@vinaadi/shared/nakshatraRasi`, pinned against the backend's
`nakshatra_to_rasi` for all 108 padas (`web/lib/nakshatra-rasi.test.ts`; fix
removed — pada ignored — 3 of 5 fail). The web calculator already asked; it does
not *require* the answer, so an unanswered split star there still gets the
majority half.

Blind spot: no mobile render test (type-checked only).

### 7.7 Native Tamil read — superseded by §8.6

Unreviewed by a native reader: the Varuda Palan copy (§4), the Chandrashtama
strings (§2), and from this round — the dasa table labels and footnote
(`web/components/natchathiram-dasa-timing.tsx`), the 81 base-page edits, the
Rohini Tamil edits, and the mobile half-of-star prompt.

---

## 8. Third round of rulings (same day)

> **My overall ruling:** Keep the astrological calculations source-driven,
> distinguish established doctrine from assumptions, and do not release
> unverified Tamil astrology content merely because the automated tests pass.
>
> … **when the source is uncertain, say so; when the calculation is
> unavailable, do not invent it; and when the Tamil has not been reviewed, do
> not treat automated test success as editorial approval.**

Three standards, kept separate: calculation correctness (the engine does what
its documented algorithm says), astrological authority (no rule presented as
traditional without an identifiable source), Tamil editorial quality.

### 8.1 Display names — Option A, built

> Approve Option A for all 108 title/H1 combinations. Preserve the existing URL
> structure. … Retain the spelling `Nakshathiram` … The existing `tNakshatra`
> function should supply the names. Do not manually enter the 108 titles and H1s.

| Page | Title and H1 |
|---|---|
| English | Anusham Nakshathiram (Anuradha) |
| Tamil | அனுஷம் நட்சத்திரம் (அனுராதா) |

**Built:** `web/lib/nakshatra-display-name.ts` composes every name from
`tNakshatra` plus a new `NAKSHATRA_SANSKRIT_NAMES` beside `NAKSHATRA_NAMES` in
`packages/shared/src/i18n/panchangam-names.ts`. It feeds the base-page titles
(both languages; also the Article JSON-LD headline), the visual-page titles (the
27 hand-typed English titles are gone; the Tamil ones were already generated)
and both H1s. The English visual H1 used to repeat the name in capitals beneath
itself, so a screen reader read it twice; removed. URLs and canonicals unchanged.

**One judgement call to confirm:** five stars carry no bracket, because the
Sanskrit name *is* the Tamil one and the bracket would only echo it —
Aswini, Bharani, Rohini, Swathi, Revathi ("Rohini Nakshathiram", not
"Rohini Nakshathiram (Rohini)"). Magam (Magha), Hastham (Hasta), Moolam (Mula)
and Chithirai (Chitra) keep theirs: they are different forms a reader searches.
Flipping any of these is one line in the map.

**Gate:** `web/lib/nakshatra-display-name.test.ts` — the ruling's example in both
languages; every key mapped; no Tamil script in an English name, no Latin letter
in a Tamil one; and every page's real `generateMetadata`, base and visual, both
twins, leads with the display name. One visual title restored to its old hand
string: fails. H1s checked on a running dev server (EN and TA, base and visual).

**Blind spot:** the Tamil-script Sanskrit forms (க்ருத்திகா, ம்ருகசிரா, ஆஷ்லேஷா,
மகா, ஷ்ரவணா, ஷதபிஷா …) are transliterations; the test checks their script, not
their spelling. They join the native review (§8.6). `entry.meta.title` in
`natchathiram-data.ts` no longer has a reader; its 27 strings can be removed.

### 8.2 Rohini — hold

> Keep both language versions on hold until these checks are complete. Do not
> split the language holds merely to release the English version earlier …

Release conditions, verbatim in substance: (1) all edited Tamil sentences
reviewed for naturalness, grammar and meaning; (2) personality, career and
family sections reviewed for unsupported or overly deterministic claims;
(3) life-stage descriptions checked against the engine ranges; (4) English and
Tamil carry the same astrological meaning; (5) tests run and sitemap inclusion
verified after release. **These conditions apply to every visual page, not only
Rohini.** No change made.

### 8.3 Shatabhisha Saturn paragraph — replaced

> Replace the existing paragraph with the revised version, then ensure that the
> English version communicates the same meaning.

The ruled Tamil paragraph is in place verbatim. The English third paragraph,
which only listed the dasa sequence, now carries the same meaning (Saturn
associated with responsibility, discipline, patience and long-term effort;
career growth, family responsibilities and property decisions may come to the
fore; results vary with the horoscope and Saturn's placement) and keeps the
sequence. Ruling's qualification: general introductory content, not a
prediction for every native.

### 8.4 Year lord — blocked on documented rules

> Keep Varuda Palan's year-lord determination explicitly unresolved until the
> missing source rules are verified. Do not present an invented or partially
> implemented result as a traditional calculation.

| Component | Decision |
|---|---|
| Five office-holders | Retain as the candidate set provisionally |
| Eligibility by aspect | Blocked pending source verification |
| Panchavargiya bala | Retain, subject to the chosen authority |
| Hadda table | Blocked pending source selection; once chosen, versioned and tested |
| Tie-breaking | Do not invent a rule |
| No eligible candidate | Return an explicit unresolved result, e.g. `NO_ELIGIBLE_YEAR_LORD`, explained in the UI |
| Day/night classification | Evaluated at the **solar return**, never copied from birth |

Documentation required with the implementation: exact text and edition,
chapter/section and verse, translation used, and the interpretation adopted
where the source is ambiguous. Tajika Neelakanthi is the text to investigate;
not to be claimed as governing until the edition is identified and checked.

### 8.5 Gandanta for AARAMBAM — blocked on source

> Do not ship a whole-star exclusion or a junction-only exclusion as a verified
> traditional rule until the source has been documented.

Prefer the junction reading (last pada of Revati/Ashlesha/Jyeshta, first of
Ashwini/Magha/Moola) if the chosen authority supports it; the exact interval may
be narrower. Implementation steps: identify the authority; establish whole star
vs pada vs narrower interval; record exact longitude boundaries and any time
restrictions; implement in the shared function; test before, at and after each
boundary; if unsettled, return an explicit unresolved result. Until purpose
tables exist, AARAMBAM, GRIHA_PRAVESAM and PRAYANAM show "no sourced ruling".

### 8.6 Native Tamil review — a release requirement

> Conduct a systematic Tamil-language review before releasing new or materially
> edited astrological content. … A separate astrology review should assess
> doctrinal accuracy where needed. Fluency alone does not establish astrological
> correctness.

Per string: spelling and grammar; read aloud; meaning matches the English;
astrological claim checked against source or calculation; terminology
consistent across web and mobile; approval recorded before release.

Groups to review: Varuda Palan (§4), Chandrashtama (§2), the dasa timing tables
and footnote, the visual-panel label (இந்த தசையில்), the base-page edits, the
Rohini edits, the mobile half-of-star prompt, and now the Tamil-script Sanskrit
names (§8.1) and the Shatabhisha paragraph (§8.3).

Reviewer's notes on specific terms, **for the reviewer to settle, not changed
here:** வருடப்பலன் — எளிமைப்படுத்தப்பட்ட ஆண்டு ஜாதகம் (test with ordinary
readers); தோராயம் (say what is approximate); மறைக்கப்பட்டுள்ளது (may read as
deliberately concealed — consider a word for "not yet calculated");
இல்லை — கணக்கிடுவதாகக் கூறவில்லை (awkward; must not imply the concept does not
exist); பிறப்பில் நடப்பது · தசா இருப்பு … வரை (must read as the balance of the
dasa running at birth, not a life span); பதின்வயது (check naturalness in
context); இந்த தசையில் (right for dasa themes, not a universal replacement for
age language).

## 9. Fourth round: astrologer's answers to the review requests (same day)

Answers to A1, A2 and T2 of `REVIEW_REQUESTS_2026-10-21.md`. Net for A2: one
deletion, one replacement with A1, four rewordings, none kept as is.

### 9.1 A1 — the marriage sentence, built

> EN: Where marriage falls within this dasa, it is read from the seventh house
> and its lord, with Venus and Jupiter as the natural significators, and judged
> from the individual horoscope as a tendency rather than a fixed time.
>
> TA: இந்தத் தசைக்குள் திருமணம் அமைந்தால், அது ஜாதகத்தின் ஏழாம் வீட்டையும்
> அதன் அதிபதியையும் கொண்டு பார்க்கப்படுகிறது; சுக்கிரனும் குருவும் அதன் இயல்பான
> காரகர்கள். அது ஒரு நிலையான காலம் அல்ல, ஒரு போக்கே.

Same sentence for all three slots; no pada variants. **Why:** the opening clause
is conditional, so the sentence makes no claim about *whether* this dasa is the
marriage period, which is the thing that changes by pada. A sentence with no
timing cannot be pada-dependent. Two changes from our reference form: "the
seventh house **and its lord**" (the lord does most of the work in a real
reading), and "as a tendency rather than a fixed time" in place of "rather than
from one fixed bhukti" (the old phrase denied a fixed bhukti but left the reader
free to infer a fixed age).

**Built:** inserted verbatim in the `expect` text, EN and TA, of Bharani Moon,
Purva Ashadha Moon and Ashwini Venus. That is where the deleted marriage
placement used to sit. The slot comments now say "verbatim, do not reword".

### 9.2 A2 — the six existing sentences, built

| Page, dasa | Ruling | Done |
|---|---|---|
| Ashwini, Venus (remedies) | **Delete; do not substitute A1.** Venus dasa spans roughly the single-digit years to the mid-twenties; "do not defer marriage … most supportive ground" reads on a public page as advice to marry in adolescence. A remedies block advises on conduct, not on whether to marry now | Sentence removed, EN + TA |
| Magha, Venus | **Replace with A1.** "Toward the end of Venus dasa" resolves to a narrow age band that moves with the Ketu balance, so it is a timing claim in softer clothes | Clause replaced, EN + TA |
| Shravana, Rahu | **Reword.** "I would not make that claim." The overlap with marriage years is an artifact of Vimshottari order, not doctrine; Rahu is not a significator of marriage. Keep the overlap, drop the causation | Ruled wording, EN + TA |
| Uttara Ashadha, Rahu | **Reword**, as Shravana with "family formation" / குடும்ப அமைவும் | Ruled wording, EN + TA |
| Ashlesha, Venus | **Reword lightly.** Here the dasa lord *is* the significator; only "commonly falls" → "may fall" | EN "may fall"; TA பொதுவாக … வரும் → … வரலாம் |
| Bharani, Venus | **Reword by deletion.** Keep the first clause; "marriage itself is typically not yet required" is a negative timing claim and an odd thing to tell a reader | Second clause removed, EN + TA |

Ruled Shravana wording:

> EN: Marriage and first professional establishment may fall within this dasa;
> where they do, they are read from Venus, Jupiter and the seventh house and its
> lord, not from this dasa's own nature.
>
> TA: திருமணமும் முதல் தொழில் நிறுவலும் இந்தத் தசைக்குள் அமையலாம்; அவ்வாறு
> அமைந்தால், அவை இந்தத் தசையின் இயல்பால் அல்ல, சுக்கிரன், குரு, ஏழாம் வீடு
> மற்றும் அதன் அதிபதியைக் கொண்டு பார்க்கப்படுகின்றன.

**Two judgement calls, for the Tamil reviewer:**
- *Bharani:* the ruling quoted the kept clause in Tamil as "ஒரு மனிதனை மாற்றும்
  வலுவான உறவு …". The page's existing clause is "ஆளையே மாற்றும் ஒரு தீவிர உறவு …".
  It was kept, because the instruction was to keep the clause and stop, and
  மனிதனை is masculine where ஆளையே is not.
- *Ashlesha TA:* the ruling gave English only. The Tamil hedge (வரலாம்) is ours.

### 9.3 T2 — star names, built by table

> The inflection problem is real but it is not 90 hand edits. … suffix-aware
> replacement, not base-word replacement. … Run the table first, then hand over
> only the remainder.

Oblique stems: names in -ம் take -த்த- (அனுஷம் → அனுஷத்தின் / அனுஷத்துக்கு /
அனுஷத்தில் / அனுஷத்தால் / அனுஷத்தை). கேட்டை takes a -ய்- glide and a direct
dative (கேட்டையின், கேட்டைக்கு, கேட்டையில், கேட்டையால், கேட்டையை). Attributive
use takes the bare stem (அனுஷ நட்சத்திரம்).

**Built:** 88 of 90 uses replaced across Anuradha (16), Hasta (18), Punarvasu
(16), Jyeshtha (14), Purva Ashadha (13 of 14) and Uttara Ashadha (11 of 12).
Before the run, every bare use was read in context. Three were attributive and
got the stem: ஹஸ்த வெளிப்பாடு, ஹஸ்த குழந்தைக்கு, பூராட வாழ்க்கையின். The rest
are nominative subjects and got the base name.

**Left for the reviewer (the remainder):**
- The two etymology lines, "பூர்வ ஆஷாடா என்றால் 'ஆரம்ப வெற்றி'" and
  "உத்தர ஆஷாடா என்றால் 'பிற்கால வெற்றி'". They explain the *Sanskrit* name, so
  the almanac name would make them false. Either keep them, or write
  "பூராடம் (பூர்வ ஆஷாடா) என்றால் …".
- Agreement: whether any sentence's surrounding words were written to agree
  with the Sanskrit form. The table cannot see this.

**ஆஸ்தா:** confirmed a typo for ஹஸ்தா (the Sanskrit-form map in
`panchangam-names.ts` spells it ஹஸ்தா). It occurs nowhere in code outside
Hasta's page. The one other Sanskrit form still in code is deliberate:
`natchathiram-data.ts` says "சமஸ்கிருதத்தில் இது 'புனர்வசு' என்று அழைக்கப்படுகிறது".

**Gate:** `natchathiram-dasa-prose.test.ts` and `nakshatra-display-name.test.ts`
pass (181). Neither can see Tamil grammar or case agreement, so the T2 output
is still part of condition 1, not a substitute for it.
