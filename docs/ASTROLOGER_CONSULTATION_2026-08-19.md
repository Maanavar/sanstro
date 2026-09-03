# Astrologer consultation — five open questions

**Date prepared:** 2026-08-19 (Q4 added the same day, after a second review pass)
**For:** an astrologer consulted on behalf of the Vinaadi AI project
**Prepared by:** the engineering side, from the open items in
[DOCTRINE_RULINGS_2026-08-19.md](DOCTRINE_RULINGS_2026-08-19.md)

---

## Read this first — what this document is

We are building a Tamil Thirukanitham astrology engine. Almost every rule in it
is now sourced and pinned to a printed authority. Five questions are left that
we refuse to answer by guessing, because each one changes real output for real
users and a plausible-sounding guess is indistinguishable from doctrine once it
is written into code.

**Four of the five are astrology questions (Q1–Q4).** The fifth (Q5) is a
software-licence purchase decision and is included only because it was on the
same list — an astrologer cannot answer it and should not be asked to.

**Q4 is the most tractable of the five** — it may need nothing more than
naming the almanac you work from and reading one line out of it.

For each question below you will find:

- **What we ship today** — the exact rule currently running.
- **What is at stake** — how many real cases change, measured, not estimated.
- **The question** — stated so it can be answered in one or two sentences.
- **What would count as an answer** — the level of evidence we need.

**Please, wherever possible, name the source** — book title, author, edition and
page number. "This is how it is done" is usable if it is stated as the
consulting astrologer's own lineage practice; we will record it that way, under
their name, rather than dressing it up as a classical citation. Both are
acceptable. What we cannot use is an answer whose origin we cannot write down.

---

# Q1 — ஸ்திரீ தீர்க்கம் (Sthree Deergham): how does a *Madhyama* result count?

### The rule in one line

Count the boy's nakshatra **from the girl's nakshatra**, the girl's star being
the base and counting as **1**. The resulting count decides the porutham.

### What we ship today — a strict two-state rule

| Count (girl's star = 1) | Verdict today |
|---|---|
| 1 – 7 | **Fails** |
| 8 – 27 | **Passes** |

That is 20 of the 27 possible counts passing. Across all 729 possible
girl-star × boy-star combinations, **74.1% pass** and 25.9% fail.

Sthree Deergham is one of the ten poruthams. Each porutham is worth exactly
**1 point out of 10**, and the total drives the couple's headline verdict:

| Total | Label shown to the user |
|---|---|
| 9 – 10 | EXCELLENT |
| 7 – 8 | GOOD |
| 5 – 6 | AVERAGE |
| 0 – 4 | CAUTION |

So one porutham flipping can move a couple from GOOD to AVERAGE, or from
AVERAGE to CAUTION. This is a marriage-matching product; that boundary matters
to people.

### What we are being asked to change

A three-grade reading of the same rule, which appears in comparative panchanga
sources:

| Count (girl's star = 1) | Grade |
|---|---|
| 1 – 6 | **இல்லை** — does not hold |
| 7 – 13 | **மத்திமம்** (Madhyama) — middling |
| 14 – 27 | **உத்தமம்** (Uttama) — excellent |

We accept the three-grade *shape*. **What we do not know is what to do with the
middle grade in a system that scores out of 10 in whole points.**

### Q1a — the main question

> **When Sthree Deergham comes out Madhyama, does the porutham count as met, as
> not met, or as something in between?**
>
> And if "in between" — is a Madhyama Sthree Deergham traditionally treated as
> an *acceptance with a caution* (the marriage proceeds), or as an *objection
> that other poruthams must compensate for*?

We ask because the answer decides both the arithmetic and the words on screen.
Concretely, the three options are:

1. **Madhyama counts as met** — the couple scores the point, and we print
   "மத்திமம்" beside it as a note.
2. **Madhyama counts as not met** — the couple loses the point, and we print it
   as a partial rather than a flat failure.
3. **Madhyama is a genuine third state** — neither. This is the most faithful
   option and the most expensive one: it changes the result shape everywhere,
   and we would need to know whether a Madhyama porutham contributes a half
   point, or whether the score stops being "out of 10" altogether.

### What each answer does to real couples — measured

Every count value 1…27 occurs in exactly 27 of the 729 star pairs, so each count
is exactly **3.7%** of all possible pairings.

| If Madhyama... | Which counts change verdict | Share of all pairings affected |
|---|---|---|
| **counts as met** | count 7 only (fail → pass) | **3.7%** get *more* lenient |
| **counts as not met** | counts 8 – 13 (pass → fail) | **22.2%** get *stricter* |

The second option is a large, one-directional tightening: roughly one couple in
five who passes this porutham today would stop passing it. That is not a reason
to prefer the first option — it is a reason not to choose either by accident.

### Q1b — the boundary at 13

The Tamil wording we have found reads **"13க்கு மேல்"** — *above* 13. Read
strictly, that puts **13 itself in Madhyama** and Uttama starts at 14. A
different reading, "13 and above", would put 13 in Uttama.

> **Does the canonical wording mean "above 13" (Uttama starts at 14), or "13 and
> above" (Uttama starts at 13)?**

We are currently holding 13 at the Madhyama end, deliberately, until this is
settled. If 13 belongs to Uttama instead, then the "Madhyama counts as not met"
option above affects **18.5%** of pairings rather than 22.2%.

### Q1c — two mechanical confirmations, while we have your attention

> 1. **Direction.** We count the **boy's star from the girl's**, girl's star = 1.
>    Some sources count the other way. Is ours correct?
> 2. **Same star.** When both partners share a birth star the count is 1, which
>    fails under every reading above. Is that right, or does the same-star case
>    have its own treatment in Sthree Deergham?

### Q1d — the identical question for தினம் (Dinam)

Dinam is a second porutham with the same structural problem, and one answer may
well settle both.

We ship Dinam as a strict 12-count table. Counting the boy's star from the
girl's (girl = 1), these counts pass and **all others fail**:

> **2, 4, 6, 8, 9, 11, 13, 15, 18, 20, 24, 26**

Note in particular that **17, 22 and 27 fail** in our table. A simple
tara-based rule (count modulo 9) would pass all three, so their absence is
either a deliberate feature of the Tamil 12-count variant or a transcription
loss, and we cannot tell which from the table alone.

> **Is the 12-count table above correct as a complete pass list? Specifically —
> are 17, 22 and 27 genuine failures, or are they Madhyama (partial) counts that
> our table has collapsed into failure?**
>
> **And does Dinam carry pada-specific Madhyama exceptions** — a count that
> passes or fails depending on which pada of the nakshatra each partner falls
> in? We have deliberately not implemented any, but we do not know whether that
> is correct or merely incomplete.

### What would count as an answer for Q1

The grade table with its source (book, edition, page), including the exact
wording at the 13 boundary; plus a plain statement of how a Madhyama result is
treated when a matcher reports a whole number of poruthams met.

**For each of Q1a–Q1d, please mark how you're answering** — this is what lets
us record it correctly rather than guess at its standing afterward:

> ☐ Printed source *(name the book, edition, page)*
> ☐ My own lineage practice *(not a printed rule — how I was taught / how I practise)*
> ☐ Not certain *(leave it open rather than guess)*

---

# Q2 — வசிய பொருத்தம் (Vasya): what does Simmam's row actually say?

### Why this question exists

Vasya asks whether one partner's rasi is *vasya* — under the sway of — the
other's. If either direction holds (or both share a rasi), the porutham passes.

Our declared source for this table is a Tamil work we refer to internally as
**"Jothidam", page 69**. That page has already corrected us **twice**: two rows
in our table were incomplete, and in both cases the printed page and the
standard Muhurta Chintamani / Jataka Parijata tables *agreed with each other
against our code*. Both errors were causing couples to be **wrongly failed**.

There is a third row where the page and the standard tables **disagree with
each other**, and that is what we need settled.

### The full table we ship today

Key = a rasi; value = the rasi(s) it holds vasya.

| Rasi | Holds vasya over |
|---|---|
| 1. மேஷம் (Mesha) | Simmam, Viruchigam |
| 2. ரிஷபம் (Rishabam) | Kadagam, Thulaam |
| 3. மிதுனம் (Mithunam) | Kanni |
| 4. கடகம் (Kadagam) | Viruchigam, Dhanusu |
| **5. சிம்மம் (Simmam)** | **Thulaam** ← *the row in question* |
| 6. கன்னி (Kanni) | Mithunam, Meenam |
| 7. துலாம் (Thulaam) | Makaram |
| 8. விருச்சிகம் (Viruchigam) | Kadagam, Kanni |
| 9. தனுசு (Dhanusu) | Meenam |
| 10. மகரம் (Makaram) | Mesham, Kumbam |
| 11. கும்பம் (Kumbam) | Mesham |
| 12. மீனம் (Meenam) | Makaram |

### The conflict

- **The standard tables** (Muhurta Chintamani, Jataka Parijata) give
  **Simmam → Thulaam**. This is what we ship.
- **Jothidam p.69** reportedly prints **Simmam → Makaram**.

We currently treat the page as wrong here — a printing or transcription defect —
and follow the standard tables. That is an uncomfortable position: it is the one
place where we overrule our own declared source, and that same page has already
been right against us twice.

### Q2 — the question

> **For Simmam, which rasi does it hold vasya over — துலாம் (Thulaam), மகரம்
> (Makaram), or both?**
>
> And separately: **is the twelve-row table above correct as a whole?** If any
> other row is wrong or incomplete, that matters more than Simmam, because a
> missing entry silently fails couples who should pass.

**Please state the direction explicitly, not just the pair** — e.g. "Simmam
*has* Thulaam as its vasya" rather than "Simmam / Thulaam are vasya", so a
correct table cannot get reversed when we encode it. Vasya is not always
symmetric (see rows 3, 5, 7, 9, 11 above, which are one-directional).

### What would count as an answer for Q2

Either the astrologer's own printed vasya table (photograph or transcription,
with the book and page), or a clear statement of which reading their tradition
follows for Simmam and why the other exists.

If it is possible to have the physical page 69 of the Jothidam work read aloud
or photographed, that alone closes this question. **We would rather see the page
than be told what the page says** — including by ourselves. That is the whole
reason this item is still open.

**Please mark how you're answering:**

> ☐ Printed source *(name the book, edition, page — or attach/photograph it)*
> ☐ My own lineage practice
> ☐ Not certain

---

# Q3 — அபிஜித் முகூர்த்தம் (Abhijit): is it barred for marriage and Upanayana?

### What we now compute

Abhijit is the **8th of the 15 equal muhurtas that divide the daylight span**.
Its width is therefore `(sunset − sunrise) ÷ 15` and it sits centred on the
midpoint of daylight by construction. **Wednesday is the only weekday on which
Abhijit is withheld.**

(We recently corrected this: we had been using a fixed ±24-minute window around
local noon, which is only right near the equinox at low latitude. For a user in
London the true window is roughly 67 minutes in summer and 32 in winter, not 48
year-round.)

### The open point

Our source states that **Abhijit is not suitable for marriage or for
Upanayana**. We have not acted on that, because it is an activity-level rule and
we did not want to guess its strength or its scope.

### Where this would bite, concretely

Our muhurta engine scores each candidate day out of a 0–100 scale and then picks
a time window within the chosen day. Abhijit enters in **two** distinct places:

1. **Day scoring.** A day that carries an Abhijit window earns a flat **+5**
   toward its score, as part of a "this day has usable auspicious windows at
   all" factor. This applies to **every** activity today, marriage included.
2. **Window selection.** When a chosen day has no Nalla Neram slot available,
   **the Abhijit window is what we recommend as the time to act** — again for
   every activity, marriage included.

So if the rule is real, we are currently both *rewarding* marriage days for
having an Abhijit window and, on some days, *actively recommending that couples
marry inside it*. The second is the more serious of the two.

### Q3a — is the exclusion real, and how strong is it?

> **Is Abhijit muhurtham genuinely unsuitable for திருமணம் (marriage) and
> உபநயனம் (Upanayanam)?**
>
> And if so, which of these is it:
>
> - **`PROHIBITION`** — an absolute bar: the ceremony must not fall inside
>   Abhijit, full stop. (We would exclude the window from selection entirely
>   for those events.)
> - **`NO_AUSPICIOUS_CREDIT`** — a withheld endorsement: Abhijit simply does not
>   *sanctify* these acts, so it should not be counted in their favour, but a
>   well-chosen day is not spoiled by having one. (We would remove the +5 and
>   stop recommending the window, but not reject the day.)
>
> **Please answer with one of those two labels** — `PROHIBITION` or
> `NO_AUSPICIOUS_CREDIT` — rather than "unsuitable" alone; that word is
> genuinely ambiguous between the two and the ambiguity is exactly what we
> cannot resolve without you.

That distinction is the whole of the engineering decision, and it is not one we
can infer from "unsuitable".

### Q3b — how far does the exclusion reach?

Our engine handles **31 activity types**, of which several are samskaras that
sit near Upanayana in character:

> நாமகரணம் (naming), அன்னப்பிராசனம் (first solid food), காதுகுத்து (ear-boring),
> முடி இறக்கல் (tonsure), சீமந்தம் (Seemantham), வித்யாரம்பம் (start of learning),
> வேத அத்யயனம் (Veda study), மந்திர உபதேசம் (mantra initiation)

> **Does the exclusion apply only to marriage and Upanayana as named, or does it
> extend to the samskaras generally?**

If the answer is "only the two named", we will encode exactly those two and
record that the narrowness is deliberate.

### Q3c — one confirmation

> **Is Wednesday the only weekday on which Abhijit is withheld?** We have found
> no other weekday exclusion and would like that confirmed rather than assumed.

### What would count as an answer for Q3

A statement of the rule with its source, and — critically — whether it functions
as a prohibition or as a non-endorsement.

**Please mark how you're answering:**

> ☐ Printed source *(name the book, edition, page)*
> ☐ My own lineage practice
> ☐ Not certain

---

# Q4 — ஆவணி 1, 2026: is it 17 or 18 August? (and is your almanac Vakya or Thirukanitham?)

### Why this question exists

Our engine computes the Tamil month from the Sun's entry into each rasi
(sankranti), using the rule we understand to be Thirukanitham practice:

> if the sankranti falls **before that day's sunset**, the month begins that
> same day; otherwise it begins the next day.

That rule reproduces the **gazetted Puthandu**: Chithirai 1, 2026 = 14 April.
The Simha sankranti falls on **17 August 2026 at 07:58 IST** (Chennai), which is
before sunset, so our engine gives **Aavani 1 = 17 August**.

**But several published sources give Aavani 1 = 18 August**, and we take that
seriously rather than dismissing it.

### What makes this interesting rather than a simple error

We checked whether *any* variation of the rule could give both the gazetted
Puthandu and an 18 August Aavani — sunrise, midday (மத்தியானம்), aparahna, sunset.
**None can**, and the reason is simple:

| | Sankranti time | How far into the day |
|---|---|---|
| **Chithirai** (Puthandu) | 14 Apr, 09:32 IST | 3h32m after sunrise |
| **Simha** (Aavani) | 17 Aug, 07:58 IST | 1h58m after sunrise |

Aavani's sankranti happens **earlier in the morning** than Chithirai's. So any
rule generous enough to let Chithirai begin on its own day (14 April) must also
let Aavani begin on its own day (17 August). To get 18 August you would need a
rule that is *stricter* for the earlier crossing — which is self-contradictory.

So the 18 August sources are not simply using a different cut-off time. Our best
hypothesis is that **they are computing the sankranti itself differently** —
i.e. they are **Vakya** (வாக்கியம், based on mean planetary motion from the Surya
Siddhanta) rather than **Thirukanitham / drik** (திருக்கணிதம், based on the true
observed positions we compute). Vakya and drik sankranti times can differ by
several hours, which would move the crossing past sunset and give 18 August
under the very same sunset rule.

### Q4a — the main question

> **In your practice, is Aavani 1, 2026 the 17th or the 18th of August?**

### Q4b — the question that actually settles it

> **Is the almanac (பஞ்சாங்கம்) you work from Vakya or Thirukanitham?**
> Please name it — publisher, edition/year — and if possible tell us what it
> prints for **Aavani 1, 2026** and for **Puthandu 2026**.

This matters more than Q4a, because if your almanac is Vakya then both answers
are correct within their own systems and we simply have to say which system our
product implements. We would rather ship a correct Thirukanitham calendar and
label it as such than quietly split the difference.

### Q4c — a check on the rule itself

> **Is "before sunset" the correct threshold for the Tamil month boundary?**
> Some traditions use sunrise, and Kerala's Malayalam calendar uses *aparahna*
> (roughly ⅗ of the way through daylight). We would like the Tamil rule
> confirmed as a rule, separately from the Aavani date.

### What we are *not* asking for

Please don't give us a single corrected date to hardcode. We previously had
exactly that — a one-line patch forcing Aavani 1 to 18 August — and we deleted
it, because one date cannot establish a rule and a hardcoded exception hides
whatever the real rule is. **A month-start table for a full Tamil year is worth
more to us than a hundred individual corrections.**

### What would count as an answer for Q4

The almanac's name and system (Vakya / Thirukanitham), and ideally a photograph
or transcription of its **month-start table for Tamil year 2026-27**. Our own
derived table, for comparison, is in
`docs/TAMIL_MONTH_BOUNDARY_TABLE_2026-27.md`.

**Please mark how you're answering:**

> ☐ Printed source *(name the almanac, publisher, edition — and its system)*
> ☐ My own lineage practice
> ☐ Not certain

---

# Q5 — Swiss Ephemeris licence · **not an astrology question**

Included only because it appeared on the same list of four. **Please do not put
this to the astrologer** — it is a commercial software-licensing decision for
the owner and a lawyer.

**The situation.** Our planetary calculations use the *Swiss Ephemeris* library
from Astrodienst. It is dual-licensed:

- **AGPL-3.0** — free, but it requires the *entire* software project built on it
  to be released under AGPL or a compatible licence. For us that would mean
  offering the complete source of Vinaadi AI, including all the interpretation
  logic, to every user of the service.
- **A paid Astrodienst Professional Licence** — permits use inside a proprietary
  commercial product.

Astrodienst's licensing terms require the choice to be made **before** the
software is distributed or a public service goes live. Our mobile app ships the
library onto users' devices, which is distribution in the strict sense and needs
its own answer under the same licence.

**The ruling already recorded:** purchase the professional licence.

**What remains, and none of it is an engineering task:**

1. Purchase the Astrodienst Professional Licence; file the invoice and terms.
2. Add `LICENSE` and `THIRD_PARTY_NOTICES` at the repository root stating the
   choice and carrying the Swiss Ephemeris attribution.
3. Have the signed terms reviewed by someone with commercial-licensing
   authority.

This is the sharpest item on the whole list because it is the only one that gets
**harder after launch**, not easier. It is gated in the go-live checklist.

---

# Summary — the questions on one page

| # | Question | Who answers |
|---|---|---|
| **1a** | Does a **Madhyama** Sthree Deergham count as met, not met, or a third state? | Astrologer |
| **1b** | Does Uttama begin at **13** or at **14**? ("13க்கு மேல்" = above 13?) | Astrologer |
| **1c** | Is the count **boy's star from girl's** correct, and what happens when both share a star? | Astrologer |
| **1d** | Is our 12-count **Dinam** table complete — are 17, 22, 27 true failures? Any pada exceptions? | Astrologer |
| **2** | **Simmam** holds vasya over Thulaam or Makaram? And is the rest of the table right? | Astrologer (ideally with the page) |
| **3a** | Is **Abhijit** barred for marriage and Upanayana — absolutely, or merely not endorsing? | Astrologer |
| **3b** | Does that bar extend to the other **samskaras**? | Astrologer |
| **3c** | Is **Wednesday** the only weekday Abhijit is withheld? | Astrologer |
| **4a** | Is **Aavani 1, 2026** the 17th or 18th of August? | Astrologer |
| **4b** | Is your almanac **Vakya or Thirukanitham** — and what does it print for Aavani 1 and Puthandu? | Astrologer (the one that settles it) |
| **4c** | Is **"before sunset"** the correct Tamil month-boundary threshold? | Astrologer |
| **5** | Swiss Ephemeris licence purchase | **Owner + lawyer — not the astrologer** |

---

# A note on how answers get recorded

Every answer goes into the code as a comment naming its origin, in one of three
forms:

- **`SOURCE: <book, edition, page>`** — a printed authority we can point a
  reviewer at.
- **`[TAMIL_LINEAGE]: <astrologer's name and date>`** — this consulting
  astrologer's own practice, recorded honestly as a lineage choice among
  authentic alternatives rather than as the only defensible reading.
- **`[VARIANT]`** — a real technique that we have chosen to apply but that sits
  outside the sourced table it appears beside.

There is no fourth form. An answer we cannot attribute is one we cannot ship, so
"I am not certain" is a genuinely useful reply — it keeps the item open, which
is where it belongs, instead of freezing a guess into an engine that thousands
of people will read as authority.
