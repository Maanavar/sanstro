# Answers to the 23 October questions

Answers to [`ASTROLOGER_MESSAGE_2026-10-23.md`](ASTROLOGER_MESSAGE_2026-10-23.md) (Q1–Q22),
received 23 October 2026. The full text is in the appendix. This file records what
each answer says, what our own checks found, and what is built.

## 0. Read this first: what kind of answer this is

The reply opens:

> Answering as reasoned doctrine, not as a practitioner with the books open.

Every answer carries one of three tags: **Settled** (follows from the festival's own
definition or from our numbers), **Lineage** (defensible, a school could differ),
or **Needs the book**. None of them cites a page. So this reply is a different kind
of evidence from the 13 October rulings, which named sources. Until the owner says
otherwise, **we treat it as reasoned advice and nothing as signed off**. A
"Settled" tag is the respondent's confidence. It does not cite a source.

The reply asked for two checks before anything enters the calendar. We ran both,
plus one more (§2):

| Check | Result |
|---|---|
| Q3: does "the first Krittika at sunrise in Aadi" reproduce all 11 Aadi Krithigai examples? | **No, 10/11.** It gives 18 Jul 2028; the example is 14 Aug. |
| Q8: Varalakshmi 2022 in print | **Not done.** It needs a printed 2022 panchangam (owner). |
| Q1a: are the 11 Jayanthi examples two lineages? | **No. One rule fits all 11** (§2.3), and it contradicts the answer to Q1c. |

**Update, same day: the owner delegated verification.** Each festival answer was
checked against published almanacs (Drik Panchang for Chennai, Tamil Nadu holiday
orders, dated temple reports). What was built, and where the sources overruled an
answer, is in §5, which supersedes the "Status" column below.

**Second update, same day: the astrologer answered the follow-up.** Those answers
(A1–F1 of `ASTROLOGER_FOLLOWUP_2026-10-23.md`) are in §6, which supersedes §5
wherever the two differ — notably Varalakshmi, where he reversed the 22 October
ruling and overrode the Drik dates as a lineage choice.

## 1. Summary

| Q | Answer (tag) | Our check | Status |
|---|---|---|---|
| Q1 | Print the evening date; nisheetha window on its own line (Settled) | Matches 8/11 examples; a single Rohini rule matches 11/11 (§2.3) | No change: the code already prints the evening date. Rohini finding goes back to the astrologer |
| Q1a | Treat the examples as unauthenticated; probably two lineages (Needs the book) | One rule explains all 11 | Reported back |
| Q1b | 2031 → 9 Aug (Settled) | Agrees with the engine and the example | No change |
| Q1c | Only Ashtami decides Gokulashtami; Sri Jayanthi is a separate row (Settled) | Contradicted by the examples in 2027, 2029, 2030 | **Held** |
| Q2 | Aadi Krithigai is a sunrise observance (Lineage, strong) | Sunrise fits 10/11 under §3, 11/11 with the rule in §2.1 | Ready to build, rule in §2.1 |
| Q3 | Take the **first** Krittika at sunrise; delete §3 for this festival if it fits all 11 (conditional) | **Fails** (2028) | Not built as worded. §2.1 has a rule that fits all 11 |
| Q4 | Keep the full-moon test as primary; §3 is only the fallback (Settled) | The six rows match the engine today, except Vaigasi 2022/2041 | Built for 4 of 6. Vaigasi 2022/2041 need the §3 fallback (§3, B2) |
| Q5 | Deepam 2032 → **17 Nov** (union wins) (Settled) | Full-moon test at sunset fits **11/11**; moves only 2032 in 2020–2045 | Ready to build (B1) |
| Q6 | Maasi Magam is sunrise; 3 Mar 2026 stands (Settled) | Agrees with the engine | No change |
| Q7 | Consecutiveness is an observation; still, 2045 → Ayudha Pooja **19 Oct**, Vijayadasami 20 Oct (Lineage) | Fires in 1 of 26 years | Ready to build on confirmation (B4) |
| Q8 | Drop the "Pournami is a Friday" branch: 2022 → 5 Aug, 2026 → 21 Aug, 2029 → 17 Aug (Lineage, strong) | Reverses the round-two ruling; the reply says 2022 in print decides it | **Held** for the printed 2022 date |
| Q9a | A skipped Ekadashi: the almanac labels the day it falls in; the **fast is on Dwadasi** (Lineage, strong) | Engine names no day today | Ready to build (B5): API change on all four surfaces |
| Q9b | Label and fast day differ; add a third field for parana (Settled) | — | Part of B5 |
| Q10 | Guru conjunct Mars reduces and does not cancel, but say it is a lineage choice; no numeric weight without a source (Lineage) | Code reduces by +1 mitigation | Record as lineage choice |
| Q11 | Reduces in a single chart, can cancel in matching; **Katakam debility should feed the two-chart balance, not cancel automatically** (Lineage, strong) | Today it cancels automatically in matching (`_yoga_dosham.py:350-353`) | Ready to build (B6) |
| Q12 | Say so, with supplied wording (Settled) | — | Copy (B7); Tamil needs review |
| Q13 | No table, no text named (Needs the book). Take the disputed rows from the same text as the Rajju table | — | No change; keep caution |
| Q14 | Three-grade question needs the book. Under the standard table all three cells are பொருத்தமில்லை; do not fill by symmetry; keep the >14 exception off | F-POR-01 is not built | No change. Do not fill cells from this answer |
| Q15 | Common lists give Thulam → Kanni; take the whole 12-rasi table first (Needs the book) | — | F-POR-04 stays held |
| Q16 | Cannot identify PN-4 / p. 243 (Needs the book) | — | Citation stays unverified |
| Q17 | Counts twice, as **three separate counts** (one per reference), not double weight in one (Lineage, strong) | Need to check how the code sums | Check before claiming agreement |
| Q18 | Five grahas default; Mandhi as a separate method; fix the Mandhi formula first (Lineage) | Maandhi formula is ruled (Gulika = end of Saturn's part, 2026-09-29) | No change |
| Q19 | No sourced table; dhruva / chara / mridu classes as scaffolding only | — | Keep "no sourced ruling" |
| Q20 | Muhurta: avoid the junction padas; the narrow window is for birth charts (Lineage, strong) | New-beginnings muhurta not built | Note for when it is |
| Q21 | Tajika Neelakanthi; aspects **by degree with deeptamsha orbs** (Settled); year starts at the **exact solar return** (Settled); Q21.1/3/4 need the book | Code uses the exact solar return already; aspects are same-rasi ≤ 5°, not orbs | Keep "approximate" |
| Q22 | Send the list when ready; separate "what the text says" from "what Vinaadi does" | — | No action |

## 2. What our checks found

Scripts: scratch copies of `scripts/audit/solar_month_tiebreak_scan.py` and
`jayanthi_label_scan.py`, run in `vinaadi-dev-api`, Chennai, 2020–2045.

### 2.1 Aadi Krithigai (Q2, Q3)

| Rule | Matches the 11 examples | Miss |
|---|---|---|
| Today: sunset, §3 | 4/11 | 2024, 2025, 2028–2032 |
| Sunrise, §3 | 10/11 | 2025 (gives 16 Aug) |
| Q3 as worded: sunrise, first occurrence | 10/11 | 2028 (gives 18 Jul) |
| **Sunrise; a day that holds Krittika at sunrise beats one that only contains it; then §3** | **11/11** | — |

Why the last rule works: in 2025 the second Krittika (16 Aug) holds **no sunrise**.
It is named only by containment, so the 20 Jul occurrence, which holds a sunrise,
outranks it. In 2028 both occurrences hold a sunrise, and §3 picks 14 Aug. So the
2025 example is not an exception to §3. The containment fallback (§5) lost to a
real sunrise, which is how §0.3 already orders them.

This rule is **ours, not the astrologer's**. It needs confirming before it is cited
as ruled. Against today's labels it moves 13 dates in 2020–2045: 2022, 2024, 2025,
2028–2032, 2035, 2037, 2041, 2043 move by one day; 2025 and 2044 move from 16 Aug to 20 Jul.

### 2.2 Karthigai Deepam (Q5)

| Rule | Matches the 11 examples | Dates moved in 2020–2045 |
|---|---|---|
| Today: sunset, §3 | 10/11 (2032 → 14 Dec) | — |
| **Sunset, full-moon test** | **11/11** | 2032 only (14 Dec → 17 Nov) |
| Sunrise, full-moon test | 8/11 | 13 |

Deepam stays a sunset observance. Only the tie-break changes.

### 2.3 Krishna Jayanthi (Q1a, Q1c)

The reply suggested that the 8/7 split is two lineages. It is not. One rule
reproduces **all 11** examples:

> If Krishna Ashtami overlaps Rohini (Jayanthi yoga), take the night whose
> nisheetha lies inside the overlap, printed by its evening date. If no nisheetha
> does, take the day the overlap falls in. If they do not overlap, take the night
> with Ashtami at nisheetha, printed by its evening date (today's rule).

| Year | Ashtami + Rohini overlap | Rule gives | Example |
|---|---|---|---|
| 2023 | 6 Sep 15:38 → 7 Sep 10:24 (holds the 6 Sep nisheetha) | 6 Sep | 6 Sep |
| 2025, 2028, 2031, 2033 | none | Ashtami night | matches |
| 2026 | 4 Sep 02:25 → 23:04 (no nisheetha) | 4 Sep | 4 Sep |
| **2027** | 25 Aug 12:28 → 19:20 | **25 Aug** | 25 Aug (today: 24 Aug) |
| **2029** | 1 Sep 00:33 → 22:57 | **1 Sep** | 1 Sep (today: 31 Aug) |
| **2030** | 21 Aug 19:24 → 20:01 | **21 Aug** | 21 Aug (today: 20 Aug) |
| 2032 | 27 Aug 23:39 → 28 Aug 13:10 | 27 Aug | 27 Aug |

So in the examples **Rohini does decide the day when it meets Ashtami**, which is
the opposite of the answer to Q1c ("only Ashtami decides Gokulashtami"). In
2020–2045 the rule moves 2027, 2029, 2030 and 2038 against today's labels. This
goes back to the astrologer as a question. Neither rule is built.

## 3. Ready to build once the owner confirms

| # | Change | Fires | Surfaces |
|---|---|---|---|
| B1 | Karthigai Deepam: `tie_break="full_moon_month"` | 2032 | engine only |
| B2 | Full-moon test undecided → fall back to §3 (Q4: Vaigasi 2022, 2041 → 12 Jun) | 2 years | engine only |
| B3 | Aadi Krithigai: sunrise, a sunrise day beats a contained one, then §3 (§2.1) | 13 years | engine only; **our rule, needs confirming** |
| B4 | 2045: Navami holding two aparahnas → the one adjoining Dasami, for Ayudha Pooja | 2045 | engine only |
| B5 | Kshaya Ekadashi: label on the day it falls in, fast on Dwadasi, parana the next morning | ~1 per year | API: `app/api/`, `packages/shared/src/api/`, `mobile/src/api/`, `web/` |
| B6 | Sevvai: Katakam debility in matching adds to the balance and does not cancel on its own | matching only | engine + copy |
| B7 | Q12 wording on the debility card | — | copy; Tamil review |

**Held:** Q8 (needs 2022 Varalakshmi in print), Q1c (examples contradict the
answer, §2.3), Q13–Q16 and Q19 (tables), Q21.1/3/4 (edition).

## 4. Questions back to the astrologer

1. **Jayanthi.** All eleven of your dates follow one rule in which Rohini decides the
   day when it meets Ashtami (§2.3). That differs from your Q1c answer. Which should
   the app print?
2. **Aadi Krithigai.** "First Krittika" fits 10 of 11 and misses 2028 (it gives
   18 Jul; your date is 14 Aug). "A day holding Krittika at sunrise beats one that
   only contains it, then the later lunar month" fits all 11. Is that the rule?
3. **Sources.** Which of these answers can you tie to a printed text? Today
   none of them cites one, so none is recorded as signed off.

## 5. Checked against published sources, and built (23 October)

The doctrine record is `docs/DOCTRINE_DECISIONS_V1.md` §8.2. In short:

| Q | Outcome | Deciding sources |
|---|---|---|
| Q1 | **Built, not as answered.** Jayanthi yoga decides when Ashtami meets Rohini; otherwise Ashtami at nisheetha, evening date. Q1c ("only Ashtami decides") is not adopted | Drik Panchang Chennai smarta 2021, 2026–2031 all match; TN holiday 2016. Against: TN holiday 2019 (23 Aug; Drik generic gives 24) |
| Q2/Q3 | **Built**: sunrise, and a sunrise day beats a contained one, then §3. "First Krittika" (Q3) is not adopted: it fails 2028 and 2020 | AstroVed 2025 (20 Jul), hindupad 2020 (12 Aug), Mylapore Times 2022 (23 Jul). Against: Kapali temple 2019 (26 Jul, both rules give 27) |
| Q4 | **Built** as answered: full-moon test primary, §3 fallback | — |
| Q5 | **Built** as answered: 2032 → 17 Nov | Tiruvannamalai Maha Deepam 17 Nov 2013, the same two-Krittika shape |
| Q6 | No change, as answered | — |
| Q7 | **Built** as answered: 2045 Ayudha Pooja → 19 Oct | TN G.O. 937: Ayudha Pooja 18 Oct 2018, the later of two aparahnas |
| Q8 | **Not adopted.** The Friday-Pournami branch stays | Drik Panchang Chennai: 12 Aug 2022, 28 Aug 2026, 24 Aug 2029. Nothing supports 5 Aug 2022 |
| Q9 | **Built, not as answered.** A kshaya Ekadashi names the day it falls in, the smarta fast day. The answer put the fast on Dwadasi; Drik gives Dwadasi only to Vaishnava / Gauna observers. Parana is not shown by the app, so no field was added | Drik Panchang Yogini Ekadashi 2026; Srirangam Vaikunta Ekadashi 30 Dec 2025, which the engine had missed |
| Q10–Q12 | No change. No source found either way on Q11's refinement, so the round-two ruling stands. Q12's wording waits for a Tamil review | — |
| Q13–Q21 | No change: tables and editions, not on the web in any form we would trust | — |

Gates: `yearly_observances_scan.py 2018 2045` 0 unreported problems;
`festival_label_dump.py` before/after diff shows only the intended rows; focused
tests (`test_festivals.py`, `test_panchangam_events.py`, `test_calendar_categories.py`,
`test_panchangam.py`) 229 passed in the container. Local runs are not authoritative;
CI decides.

## 6. The follow-up answers (A1–F1), and what they changed

Answers to `docs/ASTROLOGER_FOLLOWUP_2026-10-23.md`, received the same day.
Tagged by him CONFIRMED, LINEAGE or OPEN. These supersede §5 where they differ.

### 6.1 Built

| # | Answer | Built | Effect |
|---|---|---|---|
| A1a, A1b | The Rohini overlap decides **only if it reaches the evening** — the midnight, aparahna or pradosham. A morning-only overlap does not override. 2019 is therefore 23 Aug | `observance_days.jayanthi_yoga_day` returns None for a morning-only overlap, so Ashtami-at-nisheetha stands | 2019 → 23 Aug. **Nothing else moves in 2013–2045.** Published dates matched: 19/19, against 18/19 before |
| A2a | A Krittika holding sunrise beats one between two sunrises | already built (§5) | — |
| A3 | Krittika at dusk, then the full-moon test, then the later lunar month | already built (§5) | — |
| A4 | The later of two afternoons, next to Dasami; keep 18 Oct 2018 as a regression test | already built; 2018 is pinned in the gate | — |
| A5b | **Reverse the 22 Oct ruling.** The strict Friday-*before* rule is the Tamil/Dravida default: 2026 → 21 Aug (Sringeri's Jagadguru observed it), 2022 → 5 Aug, 2029 → 17 Aug | `festivals._recurring_tithi_festivals` window is now 1–7 days before the printed Pournami, never 0 | 3 dates in 26 years. The curated 2026 row returns to 21 Aug |
| B1b | Debility is a **modifier**, with no numeric weight. Full cancellation only under neechabhanga: the lord of Katakam (Chandra) or of Makaram (Sani) in a kendra from Lagna or Moon | `_yoga_dosham` adds no `mitigation_score` for debility and cancels only on a new `mars_neechabhanga` marker | A single chart with debilitated Mars and no other mitigation now grades one higher (PARTIAL, not WEAK). Only neechabhanga cancels in a match |
| B3 | The Tamil wording, with two corrections (`பாவம்` → `பாவகம்`, `முடிவு` → `பலன்`) | a context note `sevvai_mars_debility_modifies`, his text verbatim in both languages, on every chart where debility fires | new user-facing copy, astrologer-reviewed |

**One forced reading in B1b.** "Chandra in a kendra from the Moon" is true of
every chart, since the Moon is in house 1 from itself. Taken literally the
bhanga would always fire and debility would always cancel — exactly what the
same answer rules out. So the Moon is judged from the Lagna only, and that is
pinned by `test_the_moon_is_not_its_own_neechabhanga`. Worth confirming with him.

### 6.2 Held, with the reason

| # | Answer | Why not built |
|---|---|---|
| A6a–A6c | The fast is on **Dwadasi** by default, with Drik's smarta day as a second line, the Vaishnava day as a third, and parana shown after Hari Vasara | This is the multi-line feature (§3, B5), not a single-date flip, and flipping the label alone would be worse than today. **Conflict to settle first:** Srirangam opened the Paramapada Vasal on 30 Dec 2025, a kshaya Vaikunta Ekadashi, which is the day it falls in, not the Dwadasi. Moving the label would put the app's flagship Vaikunta Ekadashi a day off the temple and both printed almanacs. The engine keeps the day it falls in until this is resolved |
| A1c | Add a separate Sri Jayanthi line; the rule is OPEN and the line provisional | Cannot build a line whose rule is open |
| A2b | Keep 27 Jul 2019; add an optional "temple custom" note for the evening of 26 Jul | Display addition, no rule change; recorded |
| A5b (part) | Show Drik's Pournami-Friday date as an alternative line | Needs an owner decision on showing one festival on two days, plus Tamil copy |
| B2 | Keep reduction-only; full parihara for Guru as a setting, off by default, with a tradition label | A doctrine option with no named text; the default is already reduction-only, so nothing changes today |
| C2 | All three gana cells provisionally "not acceptable", stored disabled and flagged unsourced; the >14-star exception counts bride→groom and rescues only the Rakshasa pairings | Explicitly unsourced; storing a disabled table adds risk without benefit while F-POR-01 is unbuilt |
| C6 | Do not count Mandhi (already the default); make it a setting; note Mandhi ≠ Gulika | Default already correct; the setting and the note are follow-ups |
| D2 | Two labelled gandanta definitions, narrow (last/first two ghatis) and wide (junction padas); likely Muhurta Chintamani, verse unverified | New-beginnings muhurta is not built |
| E1–E4 | Friendly aspects only (unconfirmed); no hadda table, no fallback year lord; return "year-lord rule requires verification" rather than naming a planet | The page already says the year lord is approximate; the explicit "requires verification" status is a follow-up |
| C1, C3, C4, C5, D1, F1 | OPEN: no source named | Unchanged, cautions kept |

### 6.3 Still owed by the astrologer

The 2022 Varalakshmi panchangam page (A5a, "unverified" by his own tag),
"PN-4" title page and pp. 242–244 (C4), a papa-samyam worked example (C5), the
star-pada, gana and vasya tables (C1–C3), the muhurta star lists (D1), the
Tajika Neelakanthi title page (E4), and one complete printed Karinaal list (F1).

---

## Appendix: the reply, verbatim

> Answering as reasoned doctrine, not as a practitioner with the books open. Every ruling is tagged **Settled** (follows from the festival's own definition or from the numbers you gave), **Lineage** (defensible, but a school could differ — record it as a choice), or **Needs the book** (I won't manufacture it). For the tables in Part 3 I give you structure and the decision rule, not invented cells.
>
> **Part 1. Festival dates**
>
> **One finding runs through Q3, Q4 and Q5, so take it first.** Your §3 ("the later occurrence") is only ever *visible* in the handful of years that hold the star twice. In every other year both rules agree, so your eleven examples don't actually test §3 — except in exactly the years where they contradict it: Aadi Krithigai 2025, Karthigai Deepam 2032, and the six rows in Q4. A rule that is contradicted every time it becomes testable is the wrong rule for these festivals. That dissolves most of this section without needing an exception anywhere.
>
> **Q1a.** Treat them as unauthenticated. **[Needs the book]** But the 8/7 split is not noise — it's the signature of two lineages, not one inconsistent rule. Smarta Gokulashtami and Sri Vaishnava Sri Jayanthi fall a day apart in roughly these proportions. Before you hunt for a date-printing rule, check whether sorting the eleven into two lineages makes each internally consistent. If it does, there was never a puzzle.
>
> **Q1b.** Ashtami holds the midnight of 9→10 Aug and not the next. Rohini is absent from both, and for the smarta observance Rohini is an enhancement (the Jayanthi yoga), never a requirement. The night is 9 Aug; print **9 Aug**. **[Settled]**
>
> **Q1c.** Only Ashtami decides Gokulashtami. Rohini decides Sri Jayanthi. Default to smarta and carry Sri Jayanthi as a distinct observance with its own row — do not merge them. **[Settled]**
>
> **Q1 (the printed date).** Print the **evening date**, with the nisheetha window on its own line as you planned. The reason is not that it matches more examples; it's that the vrata is kept across that day — the fast, the preparation and the government holiday all sit on the evening date, and worship simply falls after midnight. 2026 = 4 Sep is right. **[Settled]**
>
> **Q2.** Yes, sunrise. Aadi Krithigai is a daytime temple festival (abhishekam, kavadi), structurally unlike the monthly pradosha-judged vratam. Keep them as two separate rules, not one algorithm with a flag. **[Lineage, strong]**
>
> **Q3.** Not an exception. The rule is wrong. For Aadi Krithigai take the **first** Krittika at sunrise inside solar Aadi, which gives 20 Jul 2025 and leaves all ten other examples untouched. Test this before adopting it: it should reproduce all eleven. If it does, delete §3's application to this festival rather than carving out 2025. **[Settled, conditional on the test]**
>
> **Q4.** Keep the full-moon test; it is primary. These four festivals *are* the star's union with the Pournami of that solar month — that's what the names mean. Use §3 only as the fallback when no occurrence unites. **[Settled]**
>
> | Festival | Year | Ruling |
> |---|---|---|
> | Thai Poosam | 2033 | 16 Jan |
> | Maasi Magam | 2033 | 15 Feb |
> | Panguni Uthiram | 2033 | 16 Mar |
> | Vaigasi Visakam | 2030 | 17 May |
> | Vaigasi Visakam | 2022, 2041 | union ties → fallback → 12 Jun |
>
> **Q5.** The union wins. **17 Nov 2032.** Krittika with Pournami, inside Karthigai, is the festival's definition; 14 Dec has Krittika on Trayodasi, which is simply not Karthigai Deepam. And yes, the same principle governs Q4. **[Settled]**
>
> **Q6.** Yes, sunrise — and note it's the same union rule as Q4, Magam with Pournami at the 3 Mar sunrise. **3 Mar 2026** stands. **[Settled]**
>
> **Q7.** Observation, not a rule — no text makes consecutiveness binding. But in 2045 the tie-break should give way: **Ayudha Pooja 19 Oct, Vijayadasami 20 Oct.** Navami holds the 19th's aparahna right up to its expiry at 16:08, and Mahanavami puja is meant to conclude immediately before Dasami begins. Choosing 18 Oct strands a day that belongs to neither observance. Record the strict §6 reading (18 Oct) as the competing lineage. **[Lineage]**
>
> **Q8.** No — the second branch is wrong. The classical statement is the Friday *preceding* the Shravana Pournami, strictly before. Your own recollection of 2022 (5 Aug, not 12 Aug) is the tell, and it matches what I'd expect was observed. **2026 → 21 Aug, 2029 → 17 Aug, 2022 → 5 Aug.** Check 21 Aug 2026 sits in Shukla paksha — it does, around Ashtami — which is the other half of the rule and confirms it. A minority observes on the Pournami itself; keep that as a toggle, not the default. **[Lineage, strong — verify 2022 in print, it decides this]**
>
> **Q9a.** Yes, it is observed, and the two answers are different things. The almanac's date (10 Jul 2026, 29 Jul 2027) is the **calendar label** — the day the tithi falls in, as your printed sources give it. The **fast is on Dwadasi** (11 Jul 2026, 30 Jul 2027). This is not an edge case you're inventing: a lupta Ekadashi throws the observance onto the Dwadasi, which takes on Mahadvadashi character. Both Vaishnava and smarta reasoning land in the same place here, by different routes — Vaishnava because a Dashami-touched Ekadashi is never fasted, smarta by the same viddha logic you already cite. **[Lineage, strong]**
>
> **Q9b.** No, they differ, and your instinct to show two answers is right. Add a third field for parana the following morning. Your decision not to extend §5 to Ekadashi was correct — the fast is what makes it a different question. **[Settled]**
>
> **Part 2. Sevvai dosham**
>
> **Q10.** Yes, your implementation is right **given your two stated cancellation conditions**. Guru's conjunction reduces. Flag it though: a good many Tamil texts do treat Guru's conjunction or aspect on Mars as a full parihara, so this is a lineage position you're taking, not a correction of an error. Don't assign a numeric weight to the reduction without a source. **[Lineage]**
>
> **Q11.** Yes, correct. Reduces in a single chart; can cancel in matching. One refinement: debilitation in Katakam should feed the two-chart balance, not fire an automatic cancel on its own. **[Lineage, strong]**
>
> **Q12.** Yes, say so. Wording:
>
> > Mars's debility modifies the reading of Sevvai dosham. Some texts hold that a debilitated Mars does less harm; others hold that in the 7th or 8th it does more. The result depends on house, lordship and aspect, and debility alone does not establish cancellation.
>
> **[Settled]**
>
> **Part 3. Tables and citations**
>
> **Q13.** I can't give you the star-pada table, and I won't name a text for Anusham and Uthirattathi from memory. **[Needs the book]** The decision rule when your two sources disagree: take the one your Rajju and Porutham tables already come from. Internal consistency across the matching module beats picking the "better" text per cell — a table assembled from two lineages produces results neither lineage would accept. Keep the caution and the unchanged Rajju report until then.
>
> **Q14.** **[Needs the book]** on the three-grade question itself — many Tamil texts give pass/fail and you should establish that yours grades at all before building three. On the three open cells: if you adopt the standard gana table, **all three are பொருத்தமில்லை**. The asymmetry claim is real though — a groom of higher gana with a lower-gana bride is tolerated where the reverse is not — so do not assume reversing groom and bride leaves the cell unchanged, and don't fill the table by symmetry. On the 14-star exception: it is normally a cancellation of gana dosha, so it applies only where the pairing fails, and you must also fix *how* the count runs (bride's star to groom's, or the shorter way round). Disable it until both are sourced.
>
> **Q15.** **[Needs the book]** for the full table. On the disputed cell: the common vasya lists do give **Thulam controlling Kanni** (along with Makaram), so your cell is probably right — but take the whole 12-rasi table before committing, because a partial check can hide direction reversals elsewhere. Keep your existing directional grading as a recorded convention.
>
> **Q16.** I cannot identify "PN-4 / p. 243" and will not guess an expansion. **[Needs the book]** Mark the citation unverified, keep the implementation labelled provisional, and when you request the page ask for enough surrounding text to see the rule's scope, not just p. 243 alone.
>
> **Q17.** Your reading is right, but state it precisely, because the imprecision is where the dispute lives. Papa samyam computes a count **per reference** — Lagna, Moon, Venus — separately. A malefic in a papa house from two references raises two of the three counts. So it does count twice, but as two independent counts, not as double weight inside one. Those produce different totals if you sum. Write the formula as three counts, then define explicitly whether you compare bride to groom per reference or on the sum. **[Lineage, strong — the worked example will settle the compare step]**
>
> **Q18.** Keep the five-graha count as default; implement Mandhi as a separate sourced method and show both. **[Lineage]** One thing to resolve first: Mandhi/Gulika has competing formulas (which eighth, and whether you take its start or its midpoint), and it is very sensitive to birth-time error. Fix the formula before you fix the question — otherwise "should Mandhi count" has no stable answer to test.
>
> **Part 4**
>
> **Q19.** No sourced Tamil table from me. **[Needs the book]** But the classical framework these lists are built on is standard and you can use it as scaffolding while you wait — the nakshatra classes:
>
> | Class | Stars | Suits |
> |---|---|---|
> | Dhruva / fixed | Rohini, Uthiram, Uthiradam, Uthirattathi | House-warming, planting, anything meant to endure |
> | Chara / movable | Punarpoosam, Swathi, Sravanam, Avittam, Sadayam | Travel, vehicles, movement |
> | Mridu / soft | Mrigasirisham, Chitirai, Anusham, Revathi | New beginnings, learning, arts |
>
> That is the shape the answer will take. Keep the "no sourced ruling" message until a named Tamil muhurta text fills it, and note that each purpose also carries tithi and weekday exclusions that the star list alone won't give you.
>
> **Q20.** Answering **as a muhurta practitioner**: avoid the junction padas — the last of Revathi, Ayilyam, Kettai and the first of Aswini, Magam, Moolam. That is the operative interval for elections. **[Lineage, strong]** The narrower interval (a ghatika or so either side of the junction) belongs to birth-chart reading, where the concern is the Moon's exact position at a fixed instant rather than a window you are choosing. Don't import it into muhurta — it would make a veto so narrow it never fires. Source needed for the narrow figure. **[Needs the book]**
>
> **Q21.** Tajika Neelakanthi is the right lineage; I can't give you the edition. **[Needs the book]** On the five sub-questions:
>
> 1. The candidacy test is the five adhikaris (Muntha lord, varsha lagna lord, janma lagna lord, trirashi lord, and the day or night lord), ranked by pancha-vargiya bala, with the requirement that the candidate aspect the varsha lagna. Whether an inimical aspect satisfies that requirement is genuinely disputed between commentators — this one needs the edition. **[Needs the book]**
> 2. **By degree, with deeptamsha orbs.** Not whole-sign. This is definitional to Tajika, not a lineage variant, and getting it wrong invalidates everything downstream. **[Settled]**
> 3. The Egyptian terms table as given in Tajika Neelakanthi — but take it from your edition and don't substitute a Ptolemaic variant. **[Needs the book]**
> 4. The usual fallback is the strongest of the five by pancha-vargiya bala regardless of aspect; some take the Muntha lord. Report it as undetermined rather than guessing. **[Needs the book]**
> 5. **The exact solar return** — the Sun's return to its natal sidereal longitude. Not the ingress, not the birthday. **[Settled]**
>
> Keep "approximate" on the paid page until 1, 3 and 4 close.
>
> **Part 5**
>
> **Q22.** Send the list when you're ready; it blocks nothing. The one thing worth building in now is the field that separates *what the text says* from *what Vinaadi does with it* — most doctrine disputes turn out to be interpretation disputes wearing a citation.
>
> **Two things to do before any of this goes into the calendar.** Run the Q3 test (first-Krittika against all eleven years) — if it passes, §3 loses its application to the star festivals entirely and Q3, Q4 and Q5 all close together. And get 2022 Varalakshmi in print, because that single date decides Q8 and I've ruled against your current behaviour on it.
