# Seven decisions I need from you — 2026-08-28

*(Copy-paste this whole file to the astrologer. It is written to be readable
without the codebase. Reply inline, or just by item number.)*

---

## Context in one paragraph

The full **Kalaprakasika** (N. P. Subramania Iyer, Foreword January 1917;
printed pp. 1–249 plus Introduction i–xxii and the errata page) is now in hand.
Its Introduction p. xv names **Dhrig-Ganitha** reckoning, which matches the
Thirukanitham basis the software computes on — so its pages are safe to execute
against our longitudes. Reading the remaining 130 pages closed several open
questions outright, killed a few lines of enquiry for good, and produced the
seven items below, **every one of which is a judgement rather than a search**.
None of them can be closed by more reading. Two of them (1 and 3) change what
real users see; one of them (1) is arguably wrong in production right now.

**How I have set this up so it stays honest:** every rule in the engine carries
a provenance marker — `[CLASSICAL]` (an implemented printed rule),
`[TRADITION]`, `[LINEAGE]` (real practice, school-dependent, we picked one and
say so), `[VARIANT]` (a defensible reading, not a flat quote), `[PRODUCT]` (our
own arithmetic, no scriptural authority claimed) and `[LIMIT]` (present but
simplified). The one failure mode I am trying to prevent is **a product
calibration wearing a shastra label**. Several of the questions below are
therefore about the *label*, not about the number.

---

## 1. `FCR-10c` — marriage on Amavasai: keep 74 as a `[VARIANT]` inference, or revert to 83?

**This is the only item that is arguably wrong in production today.**

**What ships today.** A marriage muhurta falling on **Amavasai (new moon)**
scores **74 out of 100**, down from 83, with a cited −14 penalty. The change was
made on 2026-08-27.

**The reasoning that produced it.** Kalaprakasika **p. 79** (the marriage
chapter) says:

> *"All the Thithis after Ashtami of Krishna Paksha (dark fortnight) are
> inauspicious and will affect life."*

I read "Krishna Ashtami is the eighth of the dark fortnight, so 'all the Thithis
after' runs 9 through 15 — and Krishna 15 is Amavasai." That put the new moon
inside a **cited** prohibition rather than leaving it to a generic almanac rule.

**What the full book then showed.** The Appendix, **printed p. 249**, states the
book's own tithi numbering:

> *"Thithis are 14 in number reckoned from a New-Moon day to the next Full-Moon
> or from the Full-Moon to the New-Moon. The 1st day, ie, the day following the
> New-Moon or the Full-Moon, is Prathamai; 2nd, Dhwithiyai; … 14th,
> Chathurdhasi."*

**Fourteen, and the count stops at Chathurdhasi.** New Moon and Full Moon are
the *bounds* of the fortnight, not numbered members of it. Under the book's own
scheme **there is no "Krishna 15"**, so "the Thithis after Ashtami" runs 9
through 14 and Amavasai is not among them.

This is consistent everywhere the book counts tithis, which is what convinces me
it is the author's scheme and not one loose sentence:

| Page | Wording |
|---|---|
| p. 31 (Namakaranam) | *"the 4th, 6th, 8th, 9th, 12th, and 14th of the bright and dark halves … **the Full-Moon and the New-Moon days**"* |
| p. 32 (milk-feeding) | *"Chathurthi, Navami, Shasti, Ashtami, Chathurdhasi **and New Moon**"* |
| p. 45 (Upanayanam) | *"Chathurthi, Ashtami, Navami, Chathurdhasi, **the Full-moon and the New-moon days**"* |
| p. 79 (the marriage passage itself) | *"Prathamai (of the dark fortnight) Shashti, Ashtami, Dhwadhasi, **Pournami (Full-Moon)** are middling"* — Pournami named beside the numerals, never as "the 15th" |

**What this does and does not prove.** It does **not** show the conclusion is
wrong. Amavasai *does* terminate Krishna Paksha, and reading the whole tail of
the dark fortnight — its closing day included — as inauspicious for marriage is
a defensible inference. What it shows is that **the stated reason is not the
book's own numbering**, so the citation as recorded is not honest.

**The fork — please pick one:**

* **(a) Keep 74, re-cite it as `[VARIANT]`.** The penalty then stands on
  *"Amavasai closes Krishna Paksha and the tail after Ashtami is inauspicious"*
  — an inference from p. 79, not a numbered thithi. Honest, and it keeps the
  behaviour users see today.
* **(b) Revert to 83** and let the general almanac line speak instead. Faithful
  to p. 249, and restores the state before 2026-08-27.

**Two things you should know before choosing.**

1. It was deliberately **not** made a veto. The passage establishes
   inauspiciousness, not absolute prohibition, and this engine scores the page
   rather than the practice. If you think marriage on Amavasai should be an
   outright block rather than a penalty, say so — that is a third answer.
2. **The penalty and its gate move together.** There is a switch that stands the
   generic −5 new-moon penalty down for marriage precisely so the cited −14 is
   not double-counted. Reverting the number alone would leave Amavasai judged by
   *no* layer at all — which is the exact defect this whole thread was opened to
   fix, reintroduced from the other side. I will move both or neither; I only
   need your verdict.

---

## 2. `PN-1` — the Rahu and Ketu rows in the natural-friendship (naisargika maitri) table

**One-line change once you say so. This closes a register row.**

**What ships today.** A 9×9 permanent friend / neutral / enemy grid used in both
natal strength and daily transit scoring. The **seven-graha core is sourced and
signed.** The **two node rows are not** — they have never had an author.

**Why they cannot be derived.** Every asymmetry in the seven-graha table falls
out of Moolatrikona arithmetic (from a graha's Moolatrikona sign, the 2nd, 4th,
5th, 8th, 9th and 12th signs give its friends). **The nodes have no Moolatrikona
sign**, so no node friendship can be derived from anything. Each entry in those
two rows is a choice someone made, and the code cannot say whose.

**What the full book settled.** The Appendix, **printed p. 246**, prints the
general planetary-friendship table:

> *"Sun — Saturn and Venus are enemies, the other planets are his friends,
> Mercury is neutral. **Moon — No enemies.** The Sun and Mercury are her friends
> and the rest are neutrals. Mars — The Sun, the Moon and Jupiter are friends;
> Venus and Saturn are neutrals; Mercury is his enemy. Mercury — The Sun and
> Venus are friends; the Moon, enemy; the rest, neutral. Jupiter — Mercury and
> Venus are enemies; Saturn, neutral; the rest, friends. Venus — Mercury and
> Saturn are friends; Mars and Jupiter, neutrals; the rest, enemies. Saturn —
> Venus and Mercury are friends; Jupiter is neutral; the rest, enemies."*

**All 49 ordered pairs of our seven-graha core match this exactly**, including
the Moon–Mercury asymmetry (Moon holds Mercury a friend; Mercury holds the Moon
an enemy). **And the table has no Rahu or Ketu row.** That is the *second*
printed table in this lineage giving friendship for seven grahas only — the
porutham-scoped one at pp. 74–75 was the first — and the Moolatrikona table the
derivation rests on (**p. 119 footnote**) has no nodes either.

**So there is nothing left to find.** Separately, a sweep of all 81 ordered pairs
found three asymmetries in the node rows — one of them Rahu holding Saturn a
friend while Saturn listed neither node, on the heaviest-weighted graha in the
daily transit component. All three are now symmetric and a test pins that. But
symmetry is internal consistency, not provenance.

**The ask:** may I relabel the two node rows **`[PRODUCT]`** — house policy,
openly declared, no scriptural claim — exactly as the Baladi avastha multipliers
were closed? **The values do not change; only the label does.** If instead your
lineage carries its own printed node friendship table, that closes the row the
better way and I will take it.

---

## 3. `A-19` — janma / anu-janma / thri-janma: per-function exemptions, and full/half/quarter grading

**This one changes which days pass for real users, in both directions.**

**What ships today.** A **binary** prohibition. The birth star, the **10th** and
the **19th** from it are barred for muhurta, all three equally, for every
activity in the catalogue.

**What the book actually says.** Ch. XXXIII is the book's own definitions
chapter — the one every other chapter cross-references — and it upholds the ban:

> **p. 168:** *"Unfavorable Asterisms — Nothing new or important should be
> started under any of the following asterisms … and the **Jenma, Anu-janma and
> Thri-Janma** asterisms, ie., the Janma-Nakshatra, the 10th and the 19th
> asterisms therefrom respectively."*

But **p. 167 grades the severity, and we model none of it**:

> *"**The Second Pariyaya** — The strength of the first asterism (the 10th
> asterism from the Jenma-Nakshathra) of this set is **only one half** of what is
> attributed to the 'Jenmam' of the first Pariyaya. The quality of the 19th
> asterism is **just one half** of what is attributed to the 10th asterism. The
> 3rd, 5th and 7th asterisms (of the 2nd Pariyaya) are not, however, as 'bad' as
> the 3rd, 5th, and 7th asterisms of the first: the first quarter of the 3rd, the
> fourth quarter of the 5th and the third quarter of the 7th asterism should
> alone be avoided. **The Third Pariyaya** — The asterisms of this Pariyaya, as
> such, **have no adverse qualities.**"*

That reads as **janma full, 10th half, 19th quarter, third cycle nil** — against
our flat three-way bar.

**And the book routinely writes per-function exemption lists.** Explicitly, at
**p. 191**:

> *"The 27th asterism from the Jenma-Nakshathra is auspicious for all functions
> **except** Shaving, Upanayana, Marriage, Anniversary, Journey, and Laying the
> foundation of a building"* — followed by a second list of thirteen functions it
> *"does not adversely affect"*.

The same shape appears at p. 32 (first milk-feeding), p. 34 (Annaprasana) and
p. 62 (mantra initiation) — where the triad is called **beneficial**. So the
apparent contradiction I flagged earlier resolves as **precedence, not conflict**:
the general rule bars the triad; chapter-specific lists override for their own
rite.

**Three questions, and each one is genuinely yours:**

* **3a. Do we honour the per-function exemptions**, so that mantra initiation,
  first milk-feeding and Annaprasana escape the bar their own chapters lift —
  or do we hold the general bar everywhere and say so plainly?
* **3b. Do we adopt the full / half / quarter grading**, or stay binary?
  Adopting it makes the 10th and especially the 19th much softer than today, so
  **days that currently fail would pass.**
* **3c. A wrinkle in p. 167 I would rather you resolve than me.** The 19th is the
  first asterism of the *third* Pariyaya, yet the passage grades it under the
  second and then says the third Pariyaya "as such" has no adverse qualities.
  **Is the 19th a quarter-strength bar, or does "third Pariyaya nil" swallow it
  entirely?** Those give different answers on the same day.

**Also on record, and unbuilt:** the book prints neutralizations we do not model
at all — e.g. **p. 191**: *"The Moon well-placed in the 9th or 10th house,
aspected to benefics, counteracts the evil effects caused by Jenma-Nakshathra and
the 3rd, 5th, 7th, 10th and 19th asterisms therefrom."* Ch. XXXIV (pp. 189–197) is
nothing but cancellations, and it is the least-implemented chapter in the book.
Not asking you to rule on it today — flagging that our affliction scoring is
systematically harsher than the text because of it.

---

## 4. `A-5` / `A-7` / `A-8` — which text governs porutham where the two disagree?

**Both books have been in hand since 2026-08-27. This is no longer research.**

The two sources are the Tamil *Jothidam* volume we have followed for porutham,
and Kalaprakasika Ch. XIII (pp. 68–78). They disagree in three places.

### 4a. `A-5` — Rasi Porutham exceptions: attached to the 6th, or to the 2nd?

Today the software ships **the directional skeleton only**: same rasi and the
7th–12th pass, the 2nd–6th fail, and **both refinements are switched off**
because they arrived without a quoted passage. The schema exists; nothing fires.

Now both passages are in hand — **and they attach the same idea to different
positions:**

* **Jothidam p. 68** attaches its single even-sign exception to the **6th**
  position (even sign from Rishabha, groom 6th → Madhyama).
* **Kalaprakasika p. 74** attaches it to the **2nd**: *"Even if the Jenma-Rasi of
  the bridegroom be the 2nd from that of the bride, the effect will be good if
  such Jenma-Rasi be an **even sign** … If it be an **odd sign**, it will do
  harm."*

Kalaprakasika p. 74 also prints the six enumerated pair exceptions at the 6th:
*"Aries and Virgo; Sagittari and Taurus; Libra and Pisces; Aquarius and Cancer;
Leo and Capricorn; Gemini and Scorpio."*

**Effect of enabling either:** couples currently **failed** on Rasi at the 2nd or
the 6th would **pass**. This is a *missing pass*, not a spurious fail — the same
shape as the Vasya defect we already found and fixed.

**The ask:** which text governs, and do both refinements go live, or only one?

### 4b. `A-7` — Sthree Deergham: we ship the minority reading

Today: the lenient **≥ 8** (inclusive count, boy's star from girl's).

**Kalaprakasika p. 72:** *"The asterism of the bridegroom should be beyond the
**13th** … **Some writers hold that it is enough if the said asterism be beyond
the 7th.**"* **Jothidam p. 67 carries the same hedge.**

So **both printed sources make ≥ 14 the primary rule and ≥ 8 the minority — and
we ship the minority.** That is defensible and it is disclosed, but right now it
is an *inherited default*, not a decision. **Effect of switching:** counts 8–12
flip from pass to fail. That is a broad band and it will make the software
noticeably stricter on matches.

**The ask:** confirm ≥ 8 for Tamil practice as we present it, or move us to ≥ 14.

### 4c. `A-8` — Vasya, Simmam → Thulaam: we are overruling a printed page

Today: **Simmam → Thulaam.** **Jothidam p. 69 prints Simmam → Makaram**, which
contradicts every standard table (Muhurta Chintamani, Jataka Parijata), so we
treated the printed row as a source or OCR defect and kept Thulaam.

**Kalaprakasika p. 75 now backs us: "Libra, to Leo."** Eleven of its twelve rows
match our table exactly, including both 2026-08-17 fixes (Vrischika → Kanni,
Makara → Kumbha).

**The ask:** confirm the override. This is us overruling a printed page in a
book we otherwise follow, and it should be a recorded ruling rather than my
inference. *(One row still needs the physical page: Kalaprakasika's Taurus row
reads "Cancer and **Leo**" against our Kataka + Thulaam — plausibly a Leo/Libra
OCR slip, so I have not acted on it.)*

---

## 5. Porutham's share of the compatibility score — the standing §9.1 item

**Positioning, not correctness. Entirely yours.**

The marriage report's headline number is an eight-layer blend out of 100:

| Layer | Max |
|---|---|
| **Porutham (the ten poruthams)** | **20** |
| 7th-house marriage strength, both charts | 20 |
| Navamsa harmony | 20 |
| Dasha harmony | 15 |
| Dosham analysis (Sevvai, with mutual cancellation) | 10 |
| Emotional (Moon–Moon, Venus–Mars) | 10 |
| Synastry (Western-style aspect harmony) | 5 |

Nothing in this blend is *wrong*. It is an honest `[PRODUCT]` construction and it
is labelled as one. My concern is different:

**20 of 100 is low for a Tamil audience.** The ten poruthams are the instrument
the family actually uses. A report that weights them at one fifth will sometimes
disagree with the elder in the room — and it will lose that argument, whatever
the other 80 points say.

My own recommendation, for what it is worth: **raise Porutham's share and let
Synastry, at 5, carry the difference.** But this is a judgement about who we are
speaking to, not about doctrine, so I will not move it without you.

*(Note that Rajju and Vedha already act as vetoes independently of the total — a
Rajju failure forces the overall verdict to CAUTION regardless of score. So the
weighting question is about the ordinary middle of the range, not about the hard
failures.)*

**The ask:** a number. "Porutham 35, Synastry 0" — or whatever you judge right.

---

## 6. p. 245 fractional aspects (drishti) — adopt, or record why not?

**Please do not let me act on this from a page read.** Adopting it changes aspect
counts in every module of the engine.

**Kalaprakasika p. 245:**

> *"All planets throw a full aspect to the 7th house. The 4th and 8th houses are
> aspected with **three quarters** of a sight; 5th and 9th houses with **half** a
> sight; 3rd and 10th houses with **quarter** sight. Of the planets aspecting
> with a full sight the Sun, the Moon, Mercury and Venus are the strongest. Of
> the planets aspecting with half sight, **Jupiter** is the strongest; of those
> that aspect with three quarter of a sight, **Mars** is the strongest."*

**Why this matters.** This is recognisably the classical basis for the familiar
rule — Jupiter aspects the 5th and 9th, Mars the 4th and 8th, Saturn the 3rd and
10th. **But it is not stated that way.** As printed, *every* planet aspects the
3rd, 4th, 5th, 8th, 9th and 10th at a fractional strength, and the "special"
planets are merely **the strongest within their fraction** — not the only ones
who cast that sight.

**What we do today** is the familiar special-aspect model: Jupiter 5/9, Mars 4/8,
Saturn 3/10, everyone else the 7th only. Separately, our own audit records that
aspect handling is **inconsistent between modules**, so if we are going to unify
it, this page is the doctrine to unify it *against*.

**The fork:**

* **(a) Adopt fractional drishti** — all grahas to 3/4/5/7/8/9/10 at
  quarter / three-quarter / half / full strength, with per-fraction strongest
  planets. Faithful to the page, and it would unify the modules. It would also
  change aspect-derived readings across natal strength, transits, bhava
  affliction and yoga cancellation. Broad blast radius.
* **(b) Keep the special-aspect model** and record on the page why — e.g. that
  Tamil practice reads the special aspects as exclusive, whatever the Sanskrit
  parent says.

Either answer is fine. What is not fine is leaving it undecided while the modules
disagree with each other.

---

## 7. The 32 yoga verdicts — the largest outstanding row, and only you can sign it

**Background.** At the last review you refused to sign the yoga detectors as one
item: *"Twenty independent definitions cannot take one verdict… I will sign these
per yoga, once each carries its own ID and condition set."* That is done. The
single blanket rule is retired, and in its place are **32 per-yoga rules**, each
with its own presence test, strength ladder, cancellation set, provenance marker
and source, plus **`YOG-ACT-01`** for the activation arithmetic. Every row is
generated from the code, and a test refuses to let a yoga ship without a row, or
a row describe a yoga the engine does not emit — so the list cannot go stale.

**Writing the rows out found a live defect, which is the reason the exercise was
worth doing.** The activation table was keyed on names the detectors never emit
(`GAJA_KESARI` looked up for a code emitted as `GAJA_KESARI_YOGA`). **Nine yogas
— Gaja Kesari, Budha Aditya, Vipareetha Raja, Chandra Mangala and all five Pancha
Mahapurusha — therefore matched nothing, counted as never dasha-activated, and
were permanently capped at 45% of their base score no matter which dasha ran.**
That is fixed.

**How I propose to make signing cheap.** Do not read 32 rows. Instead:

* **Silence means correct.** Reply with only the IDs you would mark **wrong** or
  **variant**. Anything you do not name, I record as signed.
* **Three rows change *who sees a yoga*. Start there** — the other 29 only change
  how strongly it reads.
* **Two groups share one question each**, so five rows and three rows collapse to
  two answers.

### The three that matter most

| ID | Yoga | The question |
|---|---|---|
| **`YOG-AD-01`** | Adhi Yoga | We fire on **at least one** of Guru / Sukran / Budhan in the 6th, 7th or 8th from Chandran, and grade by houses covered. The classical rule wants the three **as a set**. Ours is therefore present on most charts. **Tightening it removes the yoga from charts that display it today**, which is why I have not touched it. |
| **`YOG-DN-01`** | Dhana Yoga | Three conditions on the 2nd and 11th lords. The third — *"both wealth lords in a kendra or trikona"* — **has no classical parent; it is our own proxy**, and it is the commonest of the three. Keep, drop, or relabel? |
| **`YOG-RY-01`** | Raja Yoga | Of four live formulations we implement **two**: trikona-lord/kendra-lord **association**, and their **sign exchange**. The other two are recorded in an explicit "not implemented" row so their absence is auditable. **Is the pair we chose the right pair for your practice?** |

### The two group questions

* **The five Pancha Mahapurusha** (`YOG-PMP-01` Ruchaka, `-02` Bhadra, `-03`
  Hamsa, `-04` Malavya, `-05` Sasa) all share one choice: **kendra is counted
  from the Lagna only.** Schools that also count kendras from Chandran would
  report more of these. **One answer covers all five.**
* **Sunapha / Anapha / Durudhura** (`YOG-SAD-01/02/03`) all share one choice: the
  grahas that "do not count" beside Chandran are Suriyan, Rahu, Kethu **and
  Mandhi**. **One answer covers all three.**

### The remaining rows, one line each — mark only what is wrong

| ID | Yoga | Presence test as coded |
|---|---|---|
| `YOG-GK-01` | Gaja Kesari | Guru in a kendra (1/4/7/10) from **Chandran**, whole sign |
| `YOG-RY-02` | Raja Yoga (exchange) | A full sign exchange whose two grahas are one kendra lord and one trikona lord |
| `YOG-RY-03` | Raja Yoga formulations **not** implemented | Never fires — an audit row recording what we omit |
| `YOG-NBR-01` | Neecha Bhanga Raja Yoga | A graha debilitated **and** its debilitation cancelled |
| `YOG-BA-01` | Budha Aditya | Budhan and Suriyan share a rasi (no orb test, no combustion test) |
| `YOG-VRY-01` | Vipareetha Raja (Harsha / Sarala / Vimala) | Lord of the 6th, 8th or 12th in a dusthana, **including its own** |
| `YOG-PV-01` | Parivartana (Maha / Dainya / Kahala) | Two grahas each occupy the sign the other rules; one card per pair |
| `YOG-CM-01` | Chandra Mangala | Chandran and Chevvai share a rasi, **or** Chevvai is 7th from Chandran |
| `YOG-SK-01` | Sakata | Chandran in the 6th, 8th or 12th from Guru |
| `YOG-KD-01` | Kemadruma | Nothing but Suriyan / Rahu / Kethu in the 2nd or 12th from Chandran |
| `YOG-KT-01` | Papa Kartari | 2nd and 12th from Lagna both occupied, both hold a malefic, neither holds a benefic |
| `YOG-KT-02` | Shubha Kartari | Same, with benefics and no malefic |
| `YOG-KT-03` | Kartari absent | A "neither formed" row, emitted as not-present |
| `YOG-CH-01` | Guru Chandala | Guru and Rahu share a rasi |
| `YOG-AM-01` | Amala | A benefic in the 10th from Lagna **or** the 10th from Chandran |
| `YOG-DR-01` | Daridra | 11th lord in a dusthana, **or** weak and afflicted by a malefic |
| `YOG-LK-01` | Lakshmi | 9th lord strong and in a kendra/trikona, **and** Lagna lord strong |
| `YOG-VS-01` | Vasumati | Two or more benefics in an upachaya (3/6/10/11) from **Chandran** |
| `YOG-NKC-01/02/03` | Ayilyam / Kettai / Moolam cautions | Birth star is Ayilyam (9), Kettai (18) or Moolam (19) — Tamil lineage, display-only caution |
| `YOG-ACT-01` | Activation arithmetic | Absent = 0; else base STRONG 75 / PARTIAL 40 / WEAK 25, **×0.45 when no key graha runs as Maha or Antar lord**, else base×0.60 + best key-graha score×0.40, clamped 10–100 |

**One thing to know about `YOG-ACT-01`:** a yoga whose row declares **no** key
grahas can never rise above the dormant rung, whatever dasha is running. That is
now visible per row rather than hidden — but if you think any yoga sits in the
wrong bucket there, that is a real correction.

**The natural-benefic set used throughout** is Guru, Sukran, Budhan and Chandran,
applied unconditionally: **no waxing/waning test on Chandran and no association
test on Budhan**, both of which classical texts use to move a graha between the
sets. If you want either test added, that is one answer that touches many rows.

---

## Also ready to rule, if you have the appetite — none of these is blocking

* **`A-6` Dinam pada exceptions.** Kalaprakasika p. 69 makes counts **12, 14 and
  16** *pada-level* exceptions and says counts 19–27 carry no adverse quality at
  all. **Our binary 12-count table is markedly stricter from the 10th count
  onward.** Adopt, or state the omission openly?
* **`A-20` Upanayanam's second janma-tara ban.** Two passages, both in Ch. VII —
  p. 50's *named* list (10th, 16th, 18th, 23rd, 25th = Karmam, Sanghatham,
  Saamudhayam, Vinasanam, Manasam) and p. 51's (janma + 5th, 7th, 10th, 19th,
  22nd, 27th). Neither is said to supersede the other; their **union spans 11 of
  27 counts**. Union, or the named list alone?
* **`MUH-06` Kuligai and medical treatment.** **p. 192** puts *medical treatment*
  on Gulika's **favourable** list, in print. **We rule it adverse**, on the
  reasoning that treatment recurring means illness recurring. That divergence is
  recorded and deliberate — **confirm it stands** now that the page is in hand.
* **Ashtottari's seed** — Ardra-adi (B. V. Raman) or Krittika-adi (BPHS)? The two
  give different opening lords for the same Moon. Kalaprakasika p. 224 gives six
  of seven *period* lengths but **no nakshatra mapping**, so the book cannot
  answer this and I am asking you directly.

---

## Closed by the book — recorded here only so you know I am not still asking

Combustion orbs (p. 244, all seven plus both retrograde variants) · Kuligai's
eighteen-item favourable list (p. 192) · the kalams and Hora tables with their
derivations (pp. 175–177) · the amsa-lord rules for all divisional charts
(pp. 178–182, which independently confirmed a boundary bug our own test had just
found in the D7) · Vimshottari's 120-year total, all nine period lengths and all
27 nakshatra→lord assignments (pp. 210–212) · *"Moon — No enemies"* (p. 246).

**And three lines of enquiry are now closed negative — please do not spend time
on them:** Kalaprakasika has **no Kandaka Sani rule** (its four "Kantakam"s are a
travel-direction yoga, a count from Mars, a Shashtyamsa name, and a
neutralization — none involves Saturn); its solar-ingress chapter is **omens, not
calendar arithmetic**, so it cannot settle our Tamil month boundary; and its
blind-asterism rule (p. 171) is a **rival construction to our Jeevan/Nethiram,
not a parent** — the book counts padas from Purvabhadrapada mod 27 where we take
a ring distance from the Sun's star, and it then restricts the rule, twice, to
*"north of the river Sone"* and *"the provinces of Magadha and Gouda"* (pp. 192,
195). **Tamil Nadu is a thousand miles outside its stated scope**, so citing that
page would be worse than citing nothing. Jeevan and Nethiram stay display-only
and unscored.

---

### The shortest possible reply I can act on

```
1  (a) keep 74 as VARIANT   |  (b) revert to 83   |  (c) make it a veto
2  yes, relabel PRODUCT     |  or: here is the node table
3a exemptions honoured?     y / n
3b adopt full/half/quarter? y / n
3c the 19th is:  quarter-strength  /  nil
4a governs: Jothidam / Kalaprakasika ;  enable: 2nd / 6th / both / neither
4b Sthree Deergham:  >=8  /  >=14
4c Vasya override confirmed?  y / n
5  Porutham share: __ of 100  (and which layer gives up the points)
6  fractional drishti:  adopt  /  keep special aspects
7  yoga IDs that are WRONG or VARIANT: ____   (silence = signed)
   PMP kendra from: Lagna only / Lagna and Chandran
   SAD excluded grahas correct?  y / n
```
