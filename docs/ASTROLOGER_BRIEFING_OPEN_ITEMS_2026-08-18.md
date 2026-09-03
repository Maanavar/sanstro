# Astrologer briefing — the open items, explained

Companion to [the open-items list](OPEN_ITEMS_NEEDING_ASTROLOGER_2026-08-18.md).
That file says *what* is open. This one explains *each item well enough to answer*
— what the rule is, exactly what Vinaadi computes today, which competing practice
exists, who is affected if we have it wrong, and what a usable answer looks like.

**How to use this.** Read an item, answer the numbered questions at its end. You
can answer inline in this file, in chat, or on paper — whatever is easiest. Where
an item says **bring the page**, please do; §A-2 is in this list precisely because
a verbal confirmation in July was contradicted by a live case in August, and I do
not want to repeat that.

**What I mean by "changes an output".** Vinaadi has ~2,500 automated tests holding
the engine to whatever doctrine we record. So an answer here does not just change
a document — it changes what a real user is told on a real day. Where an item is
marked **Tier 1** or **Tier 2**, expect me to change code and re-run the suite.

**Terminology.** I use the Tamil almanac name first where one exists, with the
Sanskrit in brackets, because that is how the product displays these. Nakshatra
numbers are 1–27 with Aswini = 1. Rasi numbers are 1–12 with Mesham = 1.

---

# Part 1 — for the astrologer

## Tier 1 — the answer changes what a user is told

---

### A-3. Tamil month boundary (தமிழ் மாதப் பிறப்பு) — **read this one first**

I have moved this to the top because it is the only item where I can hand you a
**decidable** question, and because two pieces of evidence in our own codebase
now contradict each other. This is also the item with the widest blast radius.

#### What the rule is

The Tamil month is a **solar** month: it is named for the rasi the Sun occupies,
not for any lunar cycle. Chithirai is the Sun in Mesham, Vaikasi the Sun in
Rishabam, and so on. The month therefore begins at a **sankranti** — the instant
the Sun crosses from one rasi into the next.

The difficulty is that a sankranti happens at an *instant*, but a calendar needs a
*day*. If Simha sankranti occurs at 07:58 in the morning, does that whole day
belong to Aavani, or does Aavani begin the following day? Every regional Hindu
calendar answers this differently, and the answer is a fixed convention, not an
astronomical fact.

#### What Vinaadi does today

The **sunset rule**: if the sankranti instant falls *before that day's sunset*,
that day is day 1 of the new month; otherwise day 1 is the following day. This is
the convention usually stated as the Tamil (and Orissa) rule in standard
references. Implemented in `tamil_calendar.tamil_solar_date`, with the sankranti
instant found by bisecting the Sun's longitude to the exact crossing.

**Plus one hardcoded override.** `_MONTH_START_DATE_OVERRIDES` forces Aavani 1,
2026 to 18 August, because a Chennai calendar was checked in a previous session
and said the 18th, where the rule gives the 17th. A test locks it
(`test_aavani_2026_verified_calendar_boundary`, asserting 17 August = Aadi 32).

#### The contradiction I found while writing this

An override is a confession that the rule is wrong somewhere. So I computed every
2026 sankranti and asked what each candidate rule produces. The competing
convention is the **sunrise rule**: the month begins on the day at whose *sunrise*
the Sun is already in the new rasi — which is attractive because everything else
in this product is anchored to Hindu sunrise.

Here is the result. Chennai, Lahiri ayanamsa, geometric centre-of-disc sunrise.

| Tamil month | Sankranti instant (IST) | Sunset rule (shipped) | Sunrise rule |
|---|---|---|---|
| Chithirai | 2026-04-14 09:32:39 | **14 Apr** | 15 Apr |
| Vaikasi | 2026-05-15 06:22:01 | **15 May** | 16 May |
| Aani | 2026-06-15 12:53:00 | **15 Jun** | 16 Jun |
| Aadi | 2026-07-16 23:39:22 | 17 Jul | 17 Jul |
| **Aavani** | 2026-08-17 07:58:45 | **17 Aug** | **18 Aug** |
| Purattasi | 2026-09-17 07:52:57 | **17 Sep** | 18 Sep |
| Aippasi | 2026-10-17 19:51:42 | 18 Oct | 18 Oct |
| Karthigai | 2026-11-16 19:43:12 | 17 Nov | 17 Nov |
| Margazhi | 2026-12-16 10:25:02 | **16 Dec** | 17 Dec |
| Thai | 2027-01-14 21:10:25 | 15 Jan | 15 Jan |
| Maasi | 2027-02-13 10:09:04 | **13 Feb** | 14 Feb |
| Panguni | 2027-03-15 07:00:06 | **15 Mar** | 16 Mar |

**The two rules disagree on 8 of 12 months.** This is not an edge case; it is a
systematic fork. And now the contradiction:

- **Chithirai supports the sunset rule.** Sankranti 14 April 09:32 → sunset rule
  gives 14 April. **Puthandu 2026 is 14 April**, which is gazetted by the Tamil
  Nadu government and is in our own festival table. The sunrise rule would give
  15 April, which is wrong.
- **The Aavani override supports the sunrise rule.** Sankranti 17 August 07:58 →
  sunset rule gives 17 August, sunrise rule gives 18 August, and the override says
  18 August.

**Both cannot be right.** No single sunrise-or-sunset threshold reproduces both
Puthandu on 14 April and Aavani 1 on 18 August. Something else is going on, and I
can see three candidate explanations:

1. **The Aavani reference was a Vakya (வாக்கிய) panchangam, not a Thirukanitham
   one.** Vakya panchangams derive positions from older Surya-Siddhanta tables
   rather than from astronomical computation, and they routinely differ from
   Thirukanitham by up to a day at month boundaries. If the 18 August figure came
   from a Vakya almanac, then chasing it with a Thirukanitham engine is a category
   error, the override should be deleted, and there will be many more such
   mismatches — because we would be trying to make a drik engine reproduce a
   non-drik calendar. **This is the explanation I consider most likely.**
2. **The Aavani reference was misread** — e.g. an almanac page showing 18 August
   as the first *full* day, or as the day of a month-entry observance rather than
   day 1.
3. **The real Tamil rule is neither of my two candidates** — for instance a
   threshold at a specific ghati count after sunrise rather than at sunrise or
   sunset. In that case both data points could be consistent and I simply have the
   wrong threshold.

#### Why it matters

The Tamil month feeds far more than a date label: the monthly calendar view, every
Tamil-month-derived festival (Aadi Perukku, Aavani Avittam, Karthigai Deepam,
Thai Poosam, Panguni Uthiram), the muhurta engine's traditional-month notices, and
the Tamil date shown on every panchangam surface. A one-day error in a month start
shifts every one of those by a day for that whole month.

#### What we need you to answer

1. **Which almanac should Vinaadi match?** Please name it — publisher and edition.
   And critically: **is it Vakya or Thirukanitham?** The product is named for
   Thirukanitham, so if the reference almanac is Vakya we have a design decision to
   make, not a bug to fix.
2. **What is the day-assignment rule** the reference almanac applies when a
   sankranti falls between sunrise and sunset? Sunset threshold, sunrise
   threshold, a ghati count, or something else?
3. **The decisive check — please look up three dates** in your almanac. These are
   chosen because the two rules disagree on all three, so any one of them settles
   it and three together rule out a coincidence:
   - **Chithirai 1, 2026** — is it 14 or 15 April?
   - **Aavani 1, 2026** — is it 17 or 18 August? (this is the disputed one)
   - **Maasi 1, 2027** — is it 13 or 14 February?
4. **If Aavani 1 really is 18 August** and Chithirai 1 really is 14 April, then no
   simple threshold explains both, and I will need the rule as the almanac's own
   compilers state it — a page, not a date.

**A usable answer looks like:** *"Match the [publisher] Thirukanitham panchangam.
The month begins on the day the sankranti falls if it occurs before sunset.
Chithirai 1 is 14 April 2026, Aavani 1 is 17 August 2026 — the 18 August figure
you were given was wrong."* That answer lets me delete the override, delete the
test that locks it, and trust the rule permanently.

**If the answer is the sunrise rule instead**, then 8 of 12 months in 2026 are
currently a day early and Puthandu needs separate explanation.

---

### A-1. `GO-10` Kandaka Sani (கண்டக சனி)

#### What the rule is

Saturn's transit is read through several named cycles, and Kandaka Sani is one of
them — the one associated with obstruction and blocked effort. The disagreement
between lineages is about two things: **what you count from**, and **which houses
count**.

#### What Vinaadi does today

Saturn in the **1st, 4th, 7th or 10th from the Lagna** — the four kendras,
counted from the ascendant, not from the Moon. When it is active the reader sees
it labelled "Kandaka Sani (from Lagna)" / "கண்டக சனி (லக்னம்)" on every surface,
so the reference is always disclosed.

For context, here is our complete Saturn-cycle map, so you can see how Kandaka sits
beside the others:

| Cycle | Counted from | Saturn in |
|---|---|---|
| ஏழரை சனி (Ezharai / Sade Sati) | Janma Rasi | 12, 1, 2 |
| ஜென்ம சனி (Janma Sani) | Janma Rasi | 1 |
| அர்த்தாஷ்டம சனி (Ardhashtama) | Janma Rasi | 4 |
| அஷ்டம சனி (Ashtama) | Janma Rasi | 8 |
| **கண்டக சனி (Kandaka)** | **Lagna** | **1, 4, 7, 10** |

#### The competing practice

Kandaka Sani is variously reckoned **from Lagna, from Janma Rasi, or from Arudha
Lagna**, and the house set is variously **1/4/7/10** or **1/4/8/10** or **4/7/10**
without the 1st.

#### The part that actually needs your judgement

Notice what happens if Kandaka is counted **from Janma Rasi at 4/7/10**, which a
good many Tamil sources state. The 4th from Janma Rasi is *already* Ardhashtama
Sani in the table above. On a 1/4/8/10 set, the 8th is *already* Ashtama Sani. So
a Janma-Rasi Kandaka **overlaps by design** with cycles we already name.

Our Lagna reference avoids the overlap and makes Kandaka a genuinely independent
axis. That is tidy — but tidiness is not evidence, and it may be the wrong
tidiness. So the real question is structural:

**Is Kandaka Sani meant to be a separate axis from the Moon-reference cycles, or
is it a layered second name for positions those cycles already cover?**

If it is layered, then a reader currently in Saturn's 4th from the Moon should
arguably be told *both* "Ardhashtama Sani" and "Kandaka Sani", and today they are
told only the first.

#### Why it matters

This decides whether a person is told they are *currently undergoing* Kandaka
Sani. Moving the reference from Lagna to Moon changes the entire population who
see the flag — most people's Lagna and Moon sign differ, so the two references
select almost disjoint groups.

#### What we need you to answer

1. **Reference** — Lagna, Janma Rasi, or Arudha Lagna?
2. **House set** — 1/4/7/10, 1/4/8/10, or 4/7/10?
3. **Separate axis or layered name?** (the structural question above)
4. **Source** — book, publisher, page; or "this is my lineage's practice", which is
   a perfectly good answer as long as we record it as such.

**A usable answer looks like:** *"Kandaka Sani is from Lagna, 4/7/10 — the 1st is
not included, that is Janma Sani's place. It is a separate reading from the Moon
cycles. See [book] p.[n]."*

---

### A-2. `PAN-11` Nethiram (நேத்திரம்) and Jeevan (ஜீவன்)

#### What the rule is

Two daily markers shown on the Calendar. Nethiram grades the day as குருடு
(blind), ஒரு கண் (one eye), or இரு கண் (two eyes). Jeevan grades it இல்லை (none),
அரை வாழ்க்கை (half life), or முழு வாழ்க்கை (full life). Both are muhurta-suitability
markers, not personal readings, and the UI says so explicitly.

#### What Vinaadi does today

Both are computed from the **symmetric ring distance** `d` between the Sun's
nakshatra and the day's Moon nakshatra — that is, the *shorter* of the two ways
round the 27-star circle:

```
d = min( |sun_nak - moon_nak| mod 27 ,  27 - (|sun_nak - moon_nak| mod 27) )
```

| | Cutoffs |
|---|---|
| **Nethiram** | `d ≤ 2` → குருடு · `d ≤ 8` → ஒரு கண் · else → இரு கண் |
| **Jeevan** | `d ≤ 1` → இல்லை · `d = 9` → இல்லை · `d ≤ 8` → அரை · else → முழு |

#### The problem

On **2026-08-10 in Chennai** you gave a live correction. Sunrise Sun nakshatra was
Ayilyam (10), Moon nakshatra Thiruvathirai (7), so `d = 3`. Our table returns
**ஒரு கண்**. You said it should be **குருடு**.

This is not a provenance quibble. It is a wrong value on a live screen.

#### Why I did not just fix it

Because one data point does not determine the replacement, and there are two very
different candidate fixes:

- **Candidate 1 — move the cutoff.** Blind becomes `d ≤ 3`. Minimal change, fixes
  this case, and might break others.
- **Candidate 2 — the distance itself is wrong.** Every other count in this
  codebase — Dinam porutham, tara bala, Rasi porutham — is a **directional
  inclusive** count: you count *from* one star *to* another in a fixed direction,
  and the base star counts as 1. Only Jeevan/Nethiram uses a symmetric shortest-arc
  distance. An earlier audit already flagged that as suspicious by analogy. If the
  real rule is a directional inclusive count from the Sun's star to the Moon's,
  then the cutoffs mean something different and the whole table needs rebuilding —
  and the 2026-08-10 case would be explained by the count, not the threshold.

Choosing between these off one example would be guessing, and this exact formula
was marked confirmed by you on 2026-07-16 — so I would be overturning a
confirmation on a single data point. I logged it instead.

#### What we need you to answer

1. **Is the count directional or symmetric?** i.e. do you count from the Sun's
   star to the Moon's star in one direction (base counts as 1), or the shorter arc
   either way?
2. **The cutoffs** — for Nethiram, which counts give குருடு, which ஒரு கண், which
   இரு கண்? Same for Jeevan's three grades.
3. **Please bring the printed table or the printed rule.** This is the item where a
   verbal confirmation already failed once. If you have a panchangam that prints
   Nethiram/Jeevan daily, three or four dated examples from it would also settle it
   — I can fit the rule to them and show you the fit.
4. **Doctrine §7 originally asked for two independent printed panchangams** for
   these two markers. Neither is recorded in our repository. If you have them, the
   publisher and edition would close that too.

**Reassurance on scope:** these are display-only. Neither feeds any score, ranking,
or recommendation — I verified every consumer. So this is a visible wrong value,
not a wrong recommendation.

---

### A-4. `DOS-02` Kala Sarpa / Sarpa dosha arc

#### What the rule is

When all seven grahas fall within the arc from Rahu to Ketu, leaving the other
half of the zodiac empty, the chart is read as Kala Sarpa. The concept is not in
dispute; four
mechanical details are, and each changes who qualifies.

#### What Vinaadi does today

Whole-sign placement, direction-agnostic. Our Rahu/Ketu **marriage-attention**
houses (1, 2, 7, 8) are a separate rule and are not in question here.

#### The four points schools disagree on

1. **A planet exactly on a node.** If Mars sits at the same degree as Rahu, is it
   inside the arc, outside, or does it break the yoga entirely?
2. **Lagna.** Must the ascendant also fall inside the arc, or only the seven
   grahas? Some lineages require it, which greatly reduces how many charts qualify.
3. **Direction.** Is the arc read specifically Rahu → Ketu in zodiacal order, or is
   any single half-containing arc enough? A direction-sensitive rule halves the
   qualifying population.
4. **Boundary tolerance.** Strict whole-sign, or is there a degree tolerance at the
   node ends?

#### Why it matters

Kala Sarpa is heavy language for a reader. Getting the qualification criteria too
loose means telling people they have a serious affliction they do not have. We
currently answer all four questions by implementation default rather than by
ruling, which is the wrong way round for a rule this weighty.

#### What we need you to answer

Each of the four, ideally with a page. Marked `[VARIANT]` until then.

---

## Tier 2 — the answer changes a table or a threshold

---

### A-5. `POR-05` Rasi Porutham (ராசி பொருத்தம்) — exception rows shipped disabled

#### What the rule is

Count from the woman's Moon rasi to the man's, inclusive, base counting as 1.
Certain counts pass and certain counts fail.

#### What Vinaadi does today

The **directional skeleton only**: same rasi passes, counts 7–12 pass, counts 2–6
fail. `RASI_EXCEPTIONS_ENABLED = False`.

#### What is deliberately missing

Two refinements were reported to us but arrived **without a quoted passage**, so
they were built as an empty schema and switched off:

- an **even-sign exception at the 2nd position** — i.e. the 2nd count normally
  fails, but passes when some even-sign condition holds;
- **six enumerated pair exceptions at the 6th position**.

Nothing fires today. The code comment is explicit about why: a plausible-sounding
completion of "what a rich classical rule probably contains" is exactly how
invented doctrine gets into an engine.

#### Why it matters, and which direction the error runs

If those exceptions are real, then couples who should **pass** Rasi porutham are
currently being **failed** on it. That is the same shape as the Vasya defect we
already found and fixed — a missing pass, not a spurious pass. It is the worse
direction for a marriage-matching product, because a wrongly-failed match may
simply not proceed.

#### What we need you to answer

1. **The verbatim passage** for the 2nd-position even-sign exception — which signs,
   and what exactly the condition is.
2. **The six pairs** at the 6th position, listed.
3. The page for each. When these arrive the sets get filled and the flag flips in
   one change, with tests.

---

### A-6. `POR-02` Dinam (தினம்) — is our exception policy deliberate?

#### What the rule is

Count the boy's nakshatra from the girl's, inclusive 1–27. Certain counts pass.

#### What Vinaadi does today

Binary pass/fail on the 12-count set **{2, 4, 6, 8, 9, 11, 13, 15, 18, 20, 24,
26}**. Note that 17, 22 and 27 are **deliberately excluded** — a pure tara-mod-9
rule would pass them, but the locked Tamil 12-count table does not, and we follow
the table. The 9th and 18th (Parama Mitra tara) do pass.

#### What we may be omitting

Some traditions carry **pada-specific Madhyama (partial) exceptions** — a count
that neither cleanly passes nor cleanly fails, resolving by pada, notably around
the 12th, 14th and 16th counts.

#### Why it matters

Not because binary is wrong — a product may legitimately simplify to pass/fail.
But right now a reviewer cannot tell whether we omitted the Madhyama band **on
purpose** or **by ignorance**, and those are very different things to publish.

#### What we need you to answer

1. Do pada-specific Madhyama exceptions apply in our lineage's Dinam?
2. If yes — the table, and how a Madhyama result should be *displayed* (a third
   state, or rounded to pass, or rounded to fail?).
3. If no — say so, and I will state the omission explicitly rather than leave it
   implied.

---

### A-7. `POR-03` Sthree Deergham (ஸ்திரீ தீர்க்கம்) — is the threshold 8 or 13?

#### What the rule is

Count the boy's nakshatra from the girl's. A larger count is held to indicate
longevity and stability for the woman in the marriage.

#### What Vinaadi does today

The **lenient** threshold: inclusive count **≥ 8** passes.

#### The competing practice

A stricter **≥ 13** — half the 27-star circle — is required in some traditions.

#### Why it matters

The band between them is counts 8 through 12, which is five of twenty-seven
positions, roughly 19% of all pairings. Every couple in that band currently passes
and would fail under the strict rule. This is one of the broadest single-threshold
effects in the whole porutham set.

#### What we need you to answer

1. Is **≥ 8** correct for Tamil practice as we present it, or should it be ≥ 13?
2. If ≥ 8 — is it a genuine lineage position, or a lenient convention we should
   *label* as lenient to the reader?

---

### A-8. `POR-04` Vasya (வசிய பொருத்தம்) — we are overruling a printed page

#### What the rule is

A rasi-to-rasi table of which signs are drawn to (under the sway of) which.

#### What Vinaadi does today

Here is the full shipped table:

| Rasi | Vasya to |
|---|---|
| Mesham | Simmam, Viruchigam |
| Rishabam | Kadagam, Thulaam |
| Mithunam | Kanni |
| Kadagam | Viruchigam, Dhanusu |
| **Simmam** | **Thulaam** |
| Kanni | Mithunam, Meenam |
| Thulaam | Magaram |
| Viruchigam | Kadagam, Kanni |
| Dhanusu | Meenam |
| Magaram | Mesham, Kumbham |
| Kumbham | Mesham |
| Meenam | Magaram |

The kuta passes when the relation holds in **either** direction, or when both are
the same rasi.

#### The conflict, stated plainly

**Jothidam p.69 prints Simmam → Makaram, not Simmam → Thulaam.** We ship Thulaam,
because Makaram contradicts every standard table I can check — Muhurta Chintamani
and Jataka Parijata both give Thulaam. We treat the printed row as a source or OCR
defect.

That means **we are overruling a printed page on my inference**, and that should
be your ruling, not mine.

For context, two other rows in this table were found *incomplete* against the same
page on 2026-08-17 and were corrected in our favour: Viruchigam → Kanni and
Magaram → Kumbham were both missing, and both omissions were causing couples who
should have cleared Vasya to be failed. So p.69 has been right where we were
wrong, twice. That makes overruling it a third time uncomfortable.

#### What we need you to answer

1. **Simmam → Thulaam or Simmam → Makaram?**
2. If Makaram — is the standard-table Thulaam simply a different school, in which
   case we should follow the book and record the divergence the other way round?

---

### A-9. `PAN-09` Abhijit Muhurtham (அபிஜித் முகூர்த்தம்)

#### What the rule is

The auspicious midday window, held to be free of most defects.

#### What Vinaadi does today

A **fixed solar noon ± 24 minutes** — a 48-minute window centred on local apparent
noon. Solar noon comes from the same ephemeris transit calculation as sunrise, so
it tracks the equation of time and the longitude within the timezone rather than
assuming clock 12:00. **Excluded on Wednesday**, when the day is marked
`abhijit_restricted` and the muhurta engine awards no Abhijit credit.

#### The competing practice

Scale Abhijit to **one fifteenth of the actual daylight span** — the 8th of 15
equal muhurtas of the day. This makes it wider in summer and narrower in winter,
and it moves with latitude. At Chennai the difference is modest; for a user in
London it is substantial.

#### Why it matters

Abhijit is a scoring factor in the muhurta engine, and its width determines
whether a recommended window falls inside it.

#### What we need you to answer

1. **Fixed ±24 minutes, or day-length ÷ 15?**
2. **Is Wednesday the only exclusion?** Some traditions restrict it differently,
   or apply nakshatra-based exceptions.

---

### A-10. `GO-03` combustion (அஸ்தங்கதம்) and gandanta orbs

#### What the rules are

A graha too close to the Sun is combust and loses strength. Gandanta is the
junction between a water sign and a fire sign, held to be a vulnerable zone.

#### What Vinaadi does today

Combustion orbs, in degrees of separation from the Sun:

| Graha | Direct | Retrograde |
|---|---|---|
| Budhan (Mercury) | 14 | 12 |
| Sukran (Venus) | 10 | 8 |
| Sevvai (Mars) | 17 | 17 |
| Guru (Jupiter) | 11 | 11 |
| Sani (Saturn) | 15 | 15 |

Cazimi orb: 0.28°. Gandanta: six ranges of exactly 3°20′ straddling the
Meenam/Mesham, Kadagam/Simmam and Viruchigam/Dhanusu boundaries.

**Chandran (the Moon) is deliberately absent** from the combustion table. Moon
near the Sun is treated as Amavasai instead, which is `GO-04`, and a test pins
the Moon's absence so the condition cannot be double-counted.

#### Why it matters

These numbers were published for the first time this week and have never been
independently checked. An orb that is too wide marks grahas combust that are not.

#### What we need you to answer

1. Confirm or correct the five orbs.
2. **Does retrogression change the orb at all** in Tamil practice? We narrow it
   for Budhan and Sukran only.
3. **Does retrogression change the *result* of a transit reading, or only its
   intensity?** Right now it is an input flag with no defined effect size, which
   is not a checkable rule.
4. Confirm the gandanta span — is 3°20′ either side right, or is it a different
   arc?

---

### A-11. `MUH-03` Tara Bala (தாரா பலம்)

#### What the rule is

Count the day's nakshatra from the native's Janma Nakshatra in a repeating cycle
of nine taras; certain taras are adverse for beginning something.

#### What Vinaadi does today

Nine-tara cycle, **Janma counts as 1, not 0** (pinned by test). Adverse classes
are **3 (Vipat), 5 (Pratyak), 7 (Naidhana)**. Activity-specific source rules from
Kalaprakasika can be stricter for particular activities.

#### What we need you to answer

1. Confirm the three adverse taras. Some practice also treats the 1st (Janma)
   itself as unsuitable for certain beginnings — do we need a fourth?
2. Does any activity in our catalogue take a **stricter** set than these three,
   beyond what the Kalaprakasika rules already encode?

---

## Tier 3 — marker and provenance only, no output changes

These do not change a single number a user sees. They change whether we may label
a rule `[TRADITION]` (a traditional rule you can source-check) rather than
`[VARIANT]` (our declared choice among authentic alternatives). Low urgency, but
they are the last rules in the product claiming more certainty than we hold.

---

### A-12. `PAN-07` Gowri Panchangam (கௌரி பஞ்சாங்கம்) — source not recorded

Both 7×8 tables (day and night) are now published in our appendix, and they are
**not** a single rotating 8-cycle — each weekday row genuinely differs, which is
why a transcription bug hid in them twice before being fixed. The tables are
correct as far as we can tell, but **no printed source is named in our
repository**.

**Ask:** which panchangam, which page? Enough to make the tables re-derivable by
someone who is not us.

---

### A-13. `STR-01` Two node-friendship asymmetries

Our natural-friendship grid includes Rahu and Ketu as participants, which strict
Parashari tables do not. Two entries look like they may be transcription drift
rather than doctrine:

1. **Ketu holds Rahu an enemy, but Rahu does not list Ketu at all** — so the
   relationship is one-way. The nodes are always 180° apart so this never affects a
   conjunction, but it does reach relationship read-outs.
2. **Ketu holds Sevvai (Mars) a friend, but Sevvai holds Ketu neither friend nor
   enemy** — again one-way.

**Not asking about Moon–Mercury.** That asymmetry (Moon holds Budhan a friend,
Budhan holds Moon an enemy) is the genuine classical one and we know it is
intentional.

**Ask:** are the two Ketu asymmetries intended, or should they be symmetric?

---

### A-14. `STR-03` Moon and the nodes

Chandran holds both Rahu and Ketu as enemies in our Tamil overlay. Strict
classical Parashari gives the Moon **no** enemies at all.

**Ask:** confirm the overlay is right for Tamil practice.

---

### A-15. `STR-08` Saturn's Ashtakavarga table proxied for Rahu and Ketu

#### What the situation is

Rahu and Ketu have no Bhinnashtakavarga table of their own. When Vinaadi scores a
**transit** for bindu support, it substitutes **Sani's table** for both nodes, and
returns a neutral 4 for any graha with no table at all.

The code describes this as common Thirukanitham practice. **That attribution is
unsourced in our repository** — someone wrote it down as received wisdom and it
was never checked. It is exactly the kind of claim that should not survive a
release review unexamined.

Note what we deliberately do *not* do: the four karaka-relative indications
(`STR-05`) do **not** use the proxy. A substitute table is arguably defensible for
scoring a transit and meaningless for "the 5th bhava from Guru", so those rules
return nothing rather than a proxied answer.

**Ask:** is the Sani proxy your practice? Is a different graha used? Or should the
nodes simply be omitted from bindu-based transit scoring altogether?

---

### A-16. `STR-05` Karaka-relative indications — pairing and direction

#### What the rules are

Four indications are read by counting from a **karaka graha's own rasi** rather
than from the Lagna:

| Indication | Rule |
|---|---|
| Progeny | 5th from Guru |
| Siblings | 3rd from Sevvai |
| Maternal relatives | 4th from Budhan |
| Paternal | 9th from Suriyan |

Budhan as matula-karaka for the maternal side deliberately replaces a weaker
Moon-BAV 4th formulation.

Output is always a **band** (strong / neutral / thin) and **never a count** of
children, siblings or relatives — even though the classical sutras are often
quoted as giving exact numbers. A printed count is instantly checkable by the
reader, and being wrong about their own family costs more than saying nothing.

**Ask, two parts:**

1. Is each **karaka/bhava pairing** right?
2. Does your lineage count these **from the karaka graha, or from the Lagna**?
   This is the whole rule — if it is from Lagna, all four are currently wrong.

---

### A-17. `GO-11` Murthi (மூர்த்தி) inside Ezharai Sani

At Saturn's rasi ingress, the transiting Moon counted from Janma Rasi gives the
Murthi: 1/6/11 பொன் (gold, mildest), 2/5/9 வெள்ளி (silver), 3/7/10 செம்பு
(copper), 4/8/12 இரும்பு (iron, most severe).

The **table itself** is standard and widely documented. What is a lineage choice
is using it **specifically inside Ezharai Sani interpretation** rather than as a
general transit measure.

**Ask:** confirm that placement is right.

---

### A-18. `POR-03` Mahendra (மகேந்திரம்) count direction

We count the girl's nakshatra **from the boy's**, passing on
{4, 7, 10, 13, 16, 19, 22, 25}. Our reference spec counts **boy from girl**.

Here is why this has not caused a bug, and why it still needs answering: the two
directions give **identical** results — but only because that particular set
happens to be closed under `c → 29 − c`. The two count directions around a 27-star
ring always sum to 29, so a set containing both `c` and `29 − c` for every member
is direction-blind. That is an accident of this set, not a general property.

If anyone ever edits that set — adds a count, removes one — the accident breaks
silently and the direction suddenly matters. A test currently pins the symmetry so
the breakage would be caught, but the *correct* direction should be recorded.

**Ask:** girl-from-boy or boy-from-girl?

---

# Part 2 — for you, not the astrologer

---

### B-1. Swiss Ephemeris licensing — the one genuinely irreversible item

#### What the situation is

Every position Vinaadi computes — every chart, panchangam, muhurta window,
transit, dasha boundary — comes from Swiss Ephemeris. `ephemeris.py` calls it with
`SEFLG_SWIEPH`, meaning the real Astrodienst engine, not a built-in fallback. The
dependency is `pyswisseph` on Python below 3.14 and `swisseph-ffi` on 3.14 and
above; both wrap the same library.

**There is no LICENSE file at the repository root.**

Swiss Ephemeris is dual-licensed. You may use it under **AGPL-3.0**, or under a
**paid Astrodienst professional licence**. Those are very different obligations:

- **AGPL** requires that users of a *network service* built on it be offered the
  complete corresponding source. For a hosted product, the obligation is generally
  understood to reach the whole combined work served over the network — not merely
  the ephemeris wrapper. For a commercial SaaS with proprietary interpretation
  logic, that is usually unacceptable.
- **The professional licence** removes that obligation for a fee, and carries its
  own attribution and notice terms.

There is a further wrinkle: the **mobile build distributes** the library to
devices rather than merely serving results from a server. Distribution and network
use trigger AGPL obligations differently, so the mobile app needs its own answer.

#### Why this is the sharpest item in the whole review

Every other finding gets *easier* to fix after launch. This one gets harder: once
the service is public and paid, an unlicensed dependency is a live exposure rather
than a planning question, and retrofitting either choice is expensive.

#### What we need you to decide

1. Which model — AGPL or professional licence?
2. If professional: purchase it, and file the invoice and terms.
3. If AGPL: confirm you are willing to offer complete corresponding source to
   users of the service.
4. Either way: a `LICENSE` or `THIRD_PARTY_NOTICES` file at the repo root stating
   the choice and the Swiss Ephemeris attribution.
5. Get it reviewed by someone with commercial-licensing authority. I flagged the
   exposure; I am not able to make this call and should not.

Gated in [GO_LIVE_CHECKLIST.md](launch/GO_LIVE_CHECKLIST.md) §3a.

---

### B-2. Which external reference for the golden test matrices?

#### What was asked for

The reviewer wants two verification suites we do not have:

- **100 charts** compared against an independent implementation: Sun through
  Saturn longitudes, Rahu/Ketu, Lagna, rasi, nakshatra, pada, D9, D10 — with
  attention to boundary births.
- **A panchangam matrix**: 7 weekdays × 12 months × several locations, checking
  sunrise, sunset, tithi, nakshatra, yoga, karana, Rahu Kalam, Yamagandam,
  Kuligai and Hora.

Both are good asks and I agree they are the largest remaining verification gap.

#### Why I did not build them

Because both require something to compare **against**, and I do not have it. The
only source of expected values available to me inside the repository is our own
engine — and generating expected values from the thing under test produces a suite
that passes by construction and proves nothing. That is worse than having no
suite, because it *looks* like verification. So I stopped rather than build a
tautology.

#### What we need you to decide

1. **Which reference implementation for charts?** JHora is the usual choice and is
   free. Parashara's Light, or Drik Panchang's API, are alternatives. Whichever it
   is, I need to be able to obtain its output for 100 birth data points — either
   you generate them, or we agree I can script against a public endpoint.
2. **Which printed almanac for the panchangam matrix**, and for which cities? The
   reviewer suggested Chennai, Coimbatore, Delhi, London and Singapore. **The
   non-Indian ones matter most**, because that is where our sunrise calculation,
   timezone handling and daylight-saving behaviour are least exercised — a bug
   there is invisible to any Indian test case.
3. **What tolerance is acceptable?** Sunrise to the second, or to the minute?
   Different reference implementations differ by seconds on sunrise by design
   (refraction and disc-centre conventions), so a tolerance has to be agreed or the
   suite will fail on nothing.

---

### B-3. 2027 gazetted festival dates

Not an astrology question at all — it is the Tamil Nadu government holiday
gazette, plus a few administrative dates.

Our algorithmic festivals (Ekadashi with dashami-viddha handling, Pradosham,
Sankatahara Chaturthi, Amavasai, Pournami, Karthigai, Sashti, and the solar-day
Tamil-month festivals) already compute for **any** year. Only the gazetted rows
stop at 2026.

Until they are extended, a user browsing January 2027 sees the algorithmic
festivals and no government holidays. That is now **disclosed and bounded** in
code (`GAZETTED_FESTIVAL_YEARS`) rather than silently thin, and a test stops the
published limit from drifting from the truth — so this is a completeness task, not
a correctness risk.

**What we need:** the 2027 TN gazette when it publishes, and a decision on whether
the calendar should show a "government holidays not yet published for 2027" note
in the meantime. I think it should; that is a small UI change and your call.

---

# Answer sheet

If it is easier to answer in one place, these are the questions with nothing else
attached. Numbers match the sections above.

**Tier 1 — please answer these**

- **A-3.1** Which almanac should we match — publisher, edition, and **Vakya or
  Thirukanitham**?
- **A-3.2** Day-assignment rule when a sankranti falls between sunrise and sunset?
- **A-3.3** Chithirai 1, 2026 — **14 or 15 April**?
- **A-3.4** Aavani 1, 2026 — **17 or 18 August**?
- **A-3.5** Maasi 1, 2027 — **13 or 14 February**?
- **A-1.1** Kandaka Sani reference — Lagna, Janma Rasi, or Arudha?
- **A-1.2** Kandaka house set — 1/4/7/10, 1/4/8/10, or 4/7/10?
- **A-1.3** Separate axis from the Moon cycles, or a layered second name?
- **A-2.1** Nethiram/Jeevan count — directional or symmetric?
- **A-2.2** The cutoffs for all three Nethiram grades and all three Jeevan grades.
- **A-4.1–4** Kala Sarpa: planet on a node; Lagna required; direction; tolerance.

**Tier 2**

- **A-5.1** Rasi 2nd-position even-sign exception — verbatim.
- **A-5.2** Rasi 6th-position — the six pairs.
- **A-6.1** Dinam pada-specific Madhyama exceptions — do they apply?
- **A-7.1** Sthree Deergham — ≥8 or ≥13?
- **A-8.1** Vasya — Simmam → Thulaam or Simmam → Makaram?
- **A-9.1** Abhijit — fixed ±24 min or day-length ÷ 15?
- **A-9.2** Abhijit — is Wednesday the only exclusion?
- **A-10.1** Combustion orbs — confirm or correct the five.
- **A-10.3** Does retrogression change a transit's result or only its intensity?
- **A-11.1** Tara Bala — confirm 3/5/7 adverse; is Janma itself a fourth?

**Tier 3**

- **A-12** Gowri source — publisher and page.
- **A-13** The two Ketu asymmetries — intended or drift?
- **A-14** Moon holding both nodes as enemies — confirm.
- **A-15** Sani's BAV table proxied for the nodes — your practice, another graha,
  or omit the nodes?
- **A-16** Karaka pairings, and: count from the karaka or from the Lagna?
- **A-17** Murthi used inside Ezharai Sani — confirm.
- **A-18** Mahendra — girl-from-boy or boy-from-girl?

**Yours, not the astrologer's**

- **B-1** Swiss Ephemeris — AGPL or professional licence?
- **B-2** Reference implementation, cities, and tolerances for the golden matrices.
- **B-3** 2027 gazette, and whether to show a "not yet published" note.
