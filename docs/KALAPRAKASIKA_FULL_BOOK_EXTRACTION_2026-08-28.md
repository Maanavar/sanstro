# Kalaprakasika — full-book extraction, 2026-08-28

**The whole book arrived.** Printed **pp. 1–249**, plus Introduction i–xxii, the
Foreword, the contents tail and the **errata page**. The earlier scan stopped at
printed p. 118; twenty-one chapters and the Appendix had never been seen.

**Book 2 of [`SOURCE_PHOTOCOPY_REQUEST_2026-08-27.md`](SOURCE_PHOTOCOPY_REQUEST_2026-08-27.md)
is closed.** Nothing further needs photocopying from this volume.

---

## Page map — and a warning

This file is paginated **differently from the first scan**. Two spreads per PDF
page, left page even:

```
printed left  = 2 x PDF - 24        printed right = 2 x PDF - 23
PDF           = floor(printed / 2) + 12
```

Confirmed at three points: PDF 12 = xxii + p. 1; PDF 46 = pp. 68–69; PDF 136 =
pp. 248–249. Introduction i–xxii occupies PDF 1–12.

**The first scan's map was `PDF = printed + 32`.** Anyone citing a PDF page from
one file against the other will be ~30 pages out. **Cite printed pages only.**

### Edition confirmed

Foreword signed **"January, 1917 — N. P. Subramania Iyer"** (p. xxii); author
**Narasimhan, son of Varadarya, of the family of Baradwaja at Proudarayapuram
(Poli-Pakkam)** (p. 1). This matches the imprint our page map assumed, so every
printed-page citation already in the repo stands.

---

## 1. The finding that cuts against a ruling we already made

### `FCR-10c` — the marriage 83 → 74 change rests on arithmetic the book contradicts

**`FCR-10c` reasoned:** *"Krishna Ashtami is the eighth of the dark fortnight, so
'all the Thithis after Ashtami of Krishna Paksha' runs 9 through 15 — and
Krishna 15 is Amavasai."* On that basis marriage on the new moon went **83 → 74**,
and [`muhurta_engine.py:339`](../app/calculations/muhurta_engine.py#L339)
(`_in_paksha_tithi`) maps tithi 30 to in-paksha 15 so the Krishna sweep catches it.

**The Appendix, printed p. 249, states the book's own thithi numbering:**

> *"Thithis are 14 in number reckoned from a New-Moon day to the next Full-Moon
> or from the Full-Moon to the New-Moon. The 1st day, ie, the day following the
> New-Moon or the Full-Moon, is Prathamai; 2nd, Dhwithiyai; 3rd, Thrithiyai;
> 4th, Chathurthi; 5th, Panchami; 6th, Shashti; 7th, Sapthami; 8th, Ashtami;
> 9th, Navami; 10th, Dhasami; 11th, Ekadhasi; 12th, Dhwadhasi; 13th,
> Thrayodhasi; 14th, Chathurdhasi."*

**Fourteen, and the count stops at Chathurdhasi.** New-Moon and Full-Moon are the
*bounds* of the fortnight, not members of the numbered series. **Under the book's
own scheme there is no "Krishna 15", so "the Thithis after Ashtami of Krishna
Paksha" runs 9 through 14 and Amavasai is not one of them.**

**This is consistent everywhere the book counts tithis**, which is what makes it
the author's scheme rather than one loose sentence:

| Page | Wording |
|---|---|
| **p. 31** (Namakaranam) | *"the 4th, 6th, 8th, 9th, 12th, and 14th of the bright and dark halves of the lunar month, **the Full-Moon and the New-Moon days**"* |
| **p. 32** (milk-feeding) | *"Chathurthi, Navami, Shasti, Ashtami, Chathurdhasi **and New Moon**"* |
| **p. 45** (Upanayanam) | *"Chathurthi, Ashtami, Navami, Chathurdhasi, **the Full-moon and the New-moon days**"* |
| **p. 79** (marriage, the very passage `FCR-10c` reads) | *"Prathamai (of the dark fortnight) Shashti, Ashtami, Dhwadhasi, **Pournami (Full-Moon)** are middling"* — Pournami named beside the numerals, not as "15th" |

**What this does and does not do.** It does **not** show the conclusion is wrong:
p. 79 says *"All the Thithis after Ashtami of Krishna Paksha (dark fortnight) are
inauspicious and will affect life"*, and Amavasai does terminate Krishna Paksha,
so reading the whole tail of the dark fortnight — its closing day included — as
inauspicious is defensible. What it does show is that **the stated reason is not
the book's own numbering.** The original extraction stopped at 14 because the
source names Pournami and never says Amavasai; `FCR-10c` called that asymmetry
accidental. **p. 249 says it is the scheme.**

**Owner's call, and it is a real fork:**

* **Keep 74, re-cite it.** The penalty stands on "Amavasai closes Krishna Paksha
  and the tail after Ashtami is inauspicious" — an inference from p. 79, not a
  numbered thithi. Honest, but it is a `[VARIANT]` reading, not the flat quote
  `FCR-10c` recorded.
* **Revert to 83 and let the generic almanac line speak.** Faithful to p. 249,
  and it restores the pre-`FCR-10c` state.

**Do not change either half alone.** `_activity_rules_on_amavasai` returns `True`
for MARRIAGE precisely so the generic −5 stands down beside the cited −14
([`muhurta_engine.py:401`](../app/calculations/muhurta_engine.py#L401)). Reverting
the constant without reverting that gate leaves Amavasai judged by **no layer** —
which is the defect `FCR-10` was opened to fix, reintroduced from the other side.

---

## 2. Closed outright

### `PN-1` / `STR-01` naisargika maitri — **p. 246, and all 49 core pairs match**

The Appendix prints a general planetary-friendship table — **not** the
porutham-scoped one from pp. 74–75:

> *"Sun — Saturn and Venus are enemies, the other planets are his friends,
> Mercury is neutral. Moon — **No enemies.** The Sun and Mercury are her friends
> and the rest are neutrals. Mars — The Sun, the Moon and Jupiter are friends;
> Venus and Saturn are neutrals; Mercury is his enemy. Mercury — The Sun and
> Venus are friends; the Moon, enemy; the rest, neutral. Jupiter — Mercury and
> Venus are enemies; Saturn, neutral; the rest, friends. Venus — Mercury and
> Saturn are friends; Mars and Jupiter, neutrals; the rest, enemies. Saturn —
> Venus and Mercury are friends; Jupiter is neutral; the rest, enemies."*

Diffed against `_NATURAL_FRIENDS` / `_NATURAL_ENEMIES` in
[`chart_strength.py:176`](../app/calculations/chart_strength.py#L176):
**all 49 ordered pairs of the seven-graha core agree, with no exceptions.** The
Moon–Mercury asymmetry `STR-01` names as the one genuine classical directional
asymmetry — Moon holds Mercury a friend, Mercury holds Moon an enemy — is
**printed on the page.** Sourced, not merely asserted.

**And the table has no Rahu or Ketu row.** That is now the **second** printed
table in this lineage giving friendship for seven grahas only (pp. 74–75 was the
first, under Rasyadhipathi). `PN-1` asked for "the lineage's own node friendship
table, or an explicit ruling that these are house policy". **The lineage does not
have one.** Two independent printed tables, zero node rows.

> **Recommendation:** close `PN-1` by relabelling the two node rows `[PRODUCT]`,
> as `PN-2` was closed. The register requires an owner ruling for that, so it is
> not done here — but there is now nothing left to search for.

**Bonus: `STR-03` is confirmed.** `STR-03` reads *"Moon treats Rahu/Ketu as
enemies in the current Tamil overlay; strict classical Parashari tables **may**
give Moon no enemies."* p. 246 says **"Moon — No enemies."** The hedge can go;
the divergence is real and now documented on both sides.

**Bonus: `PN-1`'s derivation argument is sourced.** The Moolatrikona table the
whole "it can be re-derived" claim rests on is printed at **p. 119 footnote** —
Sun Leo, Moon Taurus, Mars Aries, Mercury Virgo, Jupiter Sagittarius, Venus
Libra, Saturn Aquarius. The nodes appear nowhere in it, which is exactly why no
node friendship can be derived.

### `A-10` / `GO-03` combustion orbs — **p. 244, complete with retrograde variants**

> *"Asthangatha — Planets located within a particular degree of the Sun are
> Asthangathas... Moon within 12 degrees from the Sun. Mars, 17. Mercury, 14;
> **12 when retrograde.** Jupiter, 11. Venus, 10; **8 when retrograde.**
> Saturn, 15."*

**`A-10` closes.** The first scan's p. 44 footnote gave only Jupiter 11 and Venus
10 and the register recorded *"the retrograde variants are not stated here"*.
They are stated here. All seven direct orbs and both retrograde variants, one
page.

The **buffers** the muhurta engine applies are sourced too, at **p. 197**:
Moudyam causes no harm when Venus or Jupiter is dignified; Asthangatha Venus
produces no harm when Jupiter holds the rising sign with malefics in 3/6/11;
Samadhrishti exists only when Venus and Jupiter aspect from opposite signs
unaccompanied. Also **p. 197**: *"Asthangatha adversely affects only Brahmanas,
Kshatryas and Vaisyas"* — a caste-scoped clause we do **not** model and should
not start.

### `MUH-06` Kuligai polarity — **p. 192, the full favourable list, eighteen items**

The disputed six-item list is printed, and it is not six:

> *"**The favourable functions for Gulika** — Harvest, the in-gathering of corns,
> oil-bath, buying and selling (trade), making eyes on the image of a Deity,
> deathday anniversary, ornamentation, liquidation of debt, worship of fire,
> opening ceremony, perfuming oneself, **medical treatment**, seating oneself on
> an elephant or a horse, initiation, installation, worship of fire in black
> magic, gift of lands, the study of the Vedas — in respect of all these
> functions Gulika has no evil force. **It is a benefic.**"*

Corroborated three more times: **p. 175 footnote** *"Gulika is not considered
inauspicious, though included in this chapter"*; **p. 191** *"When the lord of the
day is well-dignified or is posited in the rising sign, the adverse qualities of
Gulika need not be considered"*; **pp. 164–165** (Ch. XXXII, debts) gives a
positive Gulika muhurta for discharging debt.

**Both of `MUH-06`'s recorded divergences are now settled — in opposite directions:**

* **SPIRITUAL** was *"favourable by reasoning rather than a quoted line."*
  **It now has four quoted lines** — worship of fire, initiation, installation,
  the study of the Vedas, plus making eyes on a Deity's image. Divergence closes;
  the marker can move off reasoning.
* **MEDICAL** is confirmed as a **knowing** divergence. The book puts medical
  treatment on the favourable list, in print, and we rule it adverse because
  treatment recurring means illness recurring. That was already recorded; it now
  has its page. **Keep the divergence, keep the note** — it is a Tamil-rule
  override of a text we otherwise follow, and that is exactly the kind of thing
  `RuleSource` exists to make visible.

The **repetition mechanism** is sourced generally too, at **p. 168** and
**p. 183**: the five Sthira Karanas *"are powerful for executing acts of violence
but do not favor deeds of benevolence or virtue"* / *"are, however, favourable to
projects of a malicious nature."* Polarity, not blanket exclusion — the principle
`MUH-06` was built on.

### `MUH-05` / `PAN` kalams and `MUH-07` Hora — **pp. 175–177, derivation *and* tables**

Not just values — the construction:

* **p. 175** Gulika = the interval governed by Saturn; twelve hours in **eight
  periods of 1½ hours**; the lord of the day governs the **first and last**, the
  other six ruled by the remaining weekday lords in order. Then
  **Ardhapraharam** (4th period Sunday, 3rd Monday, 2nd Tuesday, 1st Wednesday,
  7th Thursday, 6th Friday, 5th Saturday), **Yamaganda** (5, 4, 3, 2, 1, 7, 6)
  and **Kalan** (1, 7, 6, 5, 4, 3, 2) each given as a period index per weekday.
* **p. 176** the clock table for **Gulikan / Yamagandam / Ardhraparaham / Kalan,
  day and night**, and **Rahu Kalam** in the footnote: *Sunday 4·30–6, Monday
  7·30–9, Tuesday 3–4·30, Wednesday 12–1·30, Thursday 1·30–3, Friday 10·30–12,
  Saturday 9–10·30.*
* **pp. 176–177** Hora derivation (*"the lord of each Hora after the first is the
  one that is sixth in order from the lord of the previous Hora"*) and the full
  **Planetary Horas** table, day and night.

This is a printed source for the kalam set and for `MUH-07`/`PAN-08`'s
sunrise-anchored equal-hora convention. **Note the night tables** — our night
Nalla Neram table was fixed once already (v37, Nalla Neram collision); p. 176's
night grid is an independent check on it.

### `A-19` `MUH-08` janma-tara polarity — **resolves as precedence, pp. 167–168**

The reversal is real but it is not a conflict, because **Ch. XXXIII is the book's
own definitions chapter** — the one every other chapter cross-references — and it
rules against the triad:

> **p. 168:** *"Unfavorable Asterisms — Nothing new or important should be started
> under any of the following asterisms... and the **Jenma, Anu-janma and
> Thri-Janma** asterisms, ie., the Janma-Nakshatra, the 10th and the 19th
> asterisms therefrom respectively."*

And **p. 167 grades the severity**, which we do not model at all:

> *"**The Second Pariyaya** — The strength of the first asterism (the 10th
> asterism from the Jenma-Nakshathra) of this set is **only one half** of what is
> attributed to the 'Jenmam' of the first Pariyaya. The quality of the 19th
> asterism is **just one half** of what is attributed to the 10th asterism. The
> 3rd, 5th and 7th asterisms (of the 2nd Pariyaya) are not, however, as 'bad' as
> the 3rd, 5th, and 7th asterisms of the first: the first quarter of the 3rd, the
> fourth quarter of the 5th and the third quarter of the 7th asterism should
> alone be avoided. **The Third Pariyaya** — The asterisms of this Pariyaya, as
> such, **have no adverse qualities.**"*

So: **janma full, 10th half, 19th quarter, third cycle nil.** Our treatment is
binary.

And the book **routinely uses per-function exemption lists**, which is what
p. 62's mantra-initiation line, p. 32's milk-feeding line and p. 34's
Annaprasana list are. **p. 191** does it explicitly for the 27th:

> *"The 27th asterism from the Jenma-Nakshathra is auspicious for all functions
> **except** Shaving, Upanayana, Marriage, Anniversary, Journey, and Laying the
> foundation of a building"* — followed by a second list of thirteen functions it
> *"does not adversely affect"*.

**`A-19` therefore retires the same way `FCR-10d` did — precedence, not
contradiction.** General rule: triad adverse, graded. Chapter-specific positive
lists override for their own function. **Two questions remain and both are
yours:** (1) do we honour the per-function exemptions, or hold the general bar
everywhere? (2) do we adopt the full/half/quarter grading, or stay binary?

**Neutralization is also printed** — **p. 191**: *"The Moon well-placed in the 9th
or 10th house, aspected to benefics, counteracts the evil effects caused by
Jenma-Nakshathra and the 3rd, 5th, 7th, 10th and 19th asterisms therefrom."*
We model none of the neutralizations. Ch. XXXIV (pp. 189–197) is nothing but
neutralizations, and it is the least-implemented chapter in the book.

### `A-6` / `POR-02` Dinam pada exceptions — the cross-reference resolved

p. 69's *"Of the second Pariyaya the 1st quarter of the 3rd, the 4th quarter of
the 5th, and the 3rd of the 7th asterism should be avoided"* carried a footnote:
*"For explanation of Pariyaya, see Chapter 33."* **Chapter 33 is now in hand**
(pp. 166–177), and p. 167 above is that explanation. `A-6` is fully readable:
counts 12/14/16 are **pada-level** exceptions, counts 19–27 carry **no adverse
quality at all**, and our binary 12-count set is markedly stricter from the 10th
count onward. Still an owner ruling — but no longer missing anything.

### `DIV-01` / `DIV-02` vargas — **pp. 178–182, and it validates the boundary fix**

The Shadvarga and Dhasavirga chapter defines the amsa-lord rules we implement:

| Varga | Page | Rule as printed |
|---|---|---|
| **Navamsa** | 179 | Movable → lord of the sign itself; fixed → 9th from the sign; common → 5th from the sign. *"Thrikona signs (1) Aries, Leo, Sagittarius begin with the Navamsa of Aries; (2) Taurus, Virgo, Capricorn begin with Capricorn; (3) Gemini, Libra, Aquarius begin with Libra; (4) Cancer, Scorpio, Pisces begin with Cancer."* |
| **Hora** | 178 | Odd signs: 1st Hora Sun, 2nd Moon. Even signs: 1st Moon, 2nd Sun |
| **Dhrekkana** | 178 | Movable 1st/5th/9th; fixed 9th/self/5th; common 5th/9th/self |
| **Thrimsamsa** | 178–179 | Odd: Mars 5, Saturn 5, Jupiter 8, Mercury 7, Venus 5. Even: Venus 5, Mercury 7, Jupiter 8, Saturn 5, Mars 5 |
| **Dwadhasamsa** | 179 | Twelve equal parts, 1st is the sign itself |
| **Saptamamsa (D7)** | 180 | *"a division of a sign into seven parts of **4⅔ degrees** each... a division of the ecliptic into **84 Amsas**. The lords of the seven parts of the odd signs are the lords of the seven signs from the odd sign, and... of the even signs... beginning from the **7th sign** from the even sign"* |
| **Dasamsa (D10)** | 180 | Ten parts of 3°, 120 amsas; odd from the sign, even from the **10th** sign |
| **Shodasamsa (D16)** | 181 | Sixteen parts, **192 amsas** |
| **Shashtyamsa (D60)** | 181 | Sixty parts, **720 amsas**, and **all sixty names are printed** — Ghora, Rakshasa, Deva, Kubhera... Indureka; even signs the same list in inverse order |

**This bears directly on the uncommitted varga work.** The new
[`test_varga_boundaries.py`](../tests/test_varga_boundaries.py) found **30 of D7's
84 boundaries** misfiled. p. 180 independently confirms **84 amsas** and the
odd/even 7th-sign reversal — so the count the test walks and the rule it walks it
against are both printed. The epsilon correction in
[`divisional_charts.py:37`](../app/calculations/divisional_charts.py#L37) is
validated against a source, not just against itself.

### Planetary aspects — **p. 245, and it may settle a long-open inconsistency**

> *"All planets throw a full aspect to the 7th house. The 4th and 8th houses are
> aspected with **three quarters** of a sight; 5th and 9th houses with **half** a
> sight; 3rd and 10th houses with **quarter** sight. Of the planets aspecting with
> a full sight the Sun, the Moon, Mercury and Venus are the strongest. Of the
> planets aspecting with half sight, **Jupiter** is the strongest; of those that
> aspect with three quarter of a sight, **Mars** is the strongest."*

This is the classical basis for "Jupiter aspects 5/9, Mars 4/8, Saturn 3/10" —
but stated as **every planet aspecting every one of those houses at a fractional
strength, with the special planets merely strongest in their fraction.** Not as
exclusive special aspects.

**`project_thirukanitham_methodology_gaps` records that aspect rules are
inconsistent across modules.** If that is still open, this page is the doctrine
to unify them against: fractional drishti to 3/4/5/7/8/9/10 for all, with
per-fraction strongest planets. **Owner ruling** — adopting it changes aspect
counts everywhere, so it is not a code change to make on a page read.

---

## 3. Negative results — what the book does **not** source

These matter as much as the closures, because each one was a *hoped-for* target
in the photocopy request and each is now settled negative. **Do not keep looking
here.**

### `A-1` / `FCR-04` / `GO-10` Kandaka Sani — **the book has no such rule**

The photocopy request called Ch. XXIX *"where the book puts it"* on the strength
of the contents listing **"Kandakam"** and **"Chandra-Kandakam"**. Both are now
readable, and neither is a Saturn cycle:

> **p. 144:** *"**Kandakam for the Days of the Week** — This is also an
> inauspicious Yoga. It is inauspicious to go south-east on Tuesday, south-west
> on Wednesday; north-west on Saturday. This adverse Yoga for the days with
> reference to the directions specified, is known as **Vara-Kandakam**."*
>
> **p. 148:** *"**Chandra Kandakam** — ... Aries, Leo and Sagittarius; Taurus,
> Virgo and Capricorn; Gemini, Libra and Aquarius; Cancer, Scorpio and Pisces —
> these four sets of Thrikona or triangular signs are inauspicious for going
> **West, North, East and South**, respectively, if the rising sign, at the time,
> be occupied by the **Moon**."*

Both are **travel-direction yogas**. Neither mentions Saturn.

And Ch. XXXIII's Kantakam, the request's other candidate, is a third unrelated
thing:

> **p. 174:** *"**Kantakam** — Count the asterisms from the one ruled by **Mars**
> to ast. Mula. The last of the same number of asterisms from Mula is denoted by
> the term Kantakam."*

Plus **Kantaka Sthoolam** (p. 174, a blend of that and Sthoolam), **Kantaka** as
Shashtyamsa №36 (p. 181), and a neutralization at p. 194 (*"A planet in his own
Virga or in exaltation, aspected to a benefic, is not affected by Kantakam"*).

**Four distinct "Kantakam"s in this book, and not one of them is Saturn in the
4th/7th/10th from the Janma Rasi.** The A-1 ruling of 2026-08-19 stands on the
owner's authority alone. `FCR-04`'s contested 10th-house limb **cannot be closed
from Kalaprakasika** — it needs the Jothidam volume or another source, and the
Jothidam contents page is the only place left to look.

> This is also a caution about reading contents pages. The request ranked
> Ch. XXIX second-highest **entirely** on two contents entries, and both were
> false friends. Nothing was lost — the same shoot captured the whole book — but
> a chapter-name match is not a rule match.

### `A-3` Tamil month boundary — **Ch. XL is about omens, not calendar arithmetic**

Ch. XL "On Sankrama or Solar Ingresses" (pp. 224–227) was called *"the highest-
value single answer we have"* for the Aavani-1 override. It is not. It defines
Sankranti as the Sun's entry into the first point of a sign, then spends three
pages on **what the ingress portends**:

> **p. 225:** *"Sankaranthi in the forenoon signifies destruction; at noon,
> grief; in the after-noon, well-being; and at night, prosperity."*

Followed by the Sankaranthi Devi's conveyances, weapons, feed and ornaments per
Karana (pp. 225–227). **Nowhere does it give a day-assignment rule** — no "if the
ingress falls after hour X the month begins the next day", which is the one thing
`A-3` needs.

The nearest thing is a **p. 175 footnote**: *"The 30 Ghatikas before and after
Sankaranthi are inauspicious... The three days before and after the Sun's entry
into the 1st point of each of those signs should be avoided."* That is an
avoidance window, not a month boundary.

**`A-3` still needs a printed Tamil Thirukanitham panchangam.** Book 3 remains
the blocker, and the hardcoded 18-August override stays unexplained.

### `PN-5` / `A-2` Jeevan–Nethiram — a classical parent exists, **and it disclaims our region**

This is the most interesting negative in the book, and it cuts two ways.

**The parent exists.** Ch. XXXIII carries the Nethiram vocabulary in full, with a
formula:

> **p. 171:** *"**Blind Asterisms** — Omit the stellar quarters
> (Nakshathra-Padhas) from **Purvabadhrapadha** to the ruling asterism at the
> time in question. Divide these stellar quarters by 27. **Remainders from 1 to 6
> represent blind asterisms; remainders 7 to 15 represent asterisms blind of one
> eye; 16 to 27 are asterisms with two eyes.**"*
>
> *"The 'blind ones' are destructive; those that have 'one eye' produce no good;
> those that have 'both eyes' bestow success. If the 'one-eyed' be strong, it is
> also fruitful."*

With Blind Thithis, Blind Rasis, Deaf Rasis and Lame Rasis alongside (p. 171),
neutralizations at pp. 194–195, and the p. 52 *"asterism of two-eyes"* reference
now explained.

**But it is a rival construction, not ours.** The book counts **padas from
Purvabhadrapada, mod 27, cut at 1–6 / 7–15 / 16–27**. Our rule uses a ring
distance from the sunrise star. These are different rules that will disagree on
most days. **This does not confirm our table — it competes with it.**

> **The two rules are not commensurable, and that settles "rival" over "fix".**
> Computing p. 171's bands over all 108 padas:
>
> | | padas | share |
> |---|---|---|
> | blind (remainder 1–6) | 24 | 2/9 |
> | one eye (7–15) | 36 | 3/9 |
> | two eyes (16–27) | 48 | 4/9 |
>
> A clean 6 : 9 : 12 pada ratio, **repeating four times around the ring** (108
> padas / 27). And **6 of the 27 nakshatras straddle a band boundary**, so the
> book's rule resolves at **pada** level where ours resolves at nakshatra level.
>
> **Most importantly: p. 171's rule never mentions the Sun.** It is an absolute
> function of the day's nakshatra-and-pada, counted from a fixed origin. Ours is
> a *relative* ring distance between the Sun's star and the sunrise star
> ([`panchangam.py:349`](../app/calculations/panchangam.py#L349)). **There is no
> ring distance that maps into the book's bands**, so an earlier draft of this
> note proposing "check whether our distance 3 falls in 1–6" was ill-posed — the
> book's count is not a function of that quantity.
>
> The runnable check is therefore a different one: **compute p. 171's band for
> 2026-08-10 Chennai's sunrise nakshatra *and pada*** and see whether it returns
> blind, as the astrologer said, where our table returns one eye. That needs no
> ruling. But note it can only ever show the book agrees with the astrologer on
> *one day* — it cannot make an absolute pada rule into a fix for a Sun-relative
> one.

**And then the book excludes us by name:**

> **p. 192:** *"Soolam — The evil effects of Soolam, Athimasam, Ekargala and
> **blind asterisms** prevail **only in that part of the country north of the
> river Sone**."*
>
> **p. 195:** *"The bad influences connected with Panku (lameness) and **Andham
> (blindness) Kanan (one-eyed)** and Soonya-Masa prevail **only in the provinces
> of Magadha and Gouda**."*

Magadha and Gouda are Bihar and Bengal. **Tamil Nadu is roughly a thousand miles
outside the stated scope.** So Kalaprakasika supplies the classical blind-asterism
rule and then says, twice, that it does not operate where our readers live.

**`PN-5` does not close — it hardens.** The Tamil almanac lineage is the *only*
authority for showing Nethiram to a Tamil user, exactly as the register recorded.
A citation to Kalaprakasika here would be worse than no citation: it would be a
page that, read to the end, argues against the feature. **Keep `PN-5` as
`[LINEAGE]`, and record the geographic disclaimer so nobody "closes" it later
with p. 171.**

Related and worth recording as doctrine: **p. 198** states that different regions
honour different yoga families outright — *"Vara and Nakshathra Yogas are
considered important in the province of Bengal; in the Yamala country importance
is attached to Thithi and Vara Yogas; in Kalinga, Amsa Yoga; in Avanthi,
Vishkamba and other Yogas are observed."* **The book itself says its chapters are
not universally applicable.** That legitimises our Tamil-first overrides and
warns against importing any chapter wholesale.

### `C-5` Kalachakra — the second source arrived, and it is **not** independent enough to certify by itself

Ch. XXXVIII (pp. 212–222) is the chapter `C-5` was waiting for. It gives:

* **p. 213** the Savya/Apasavya split governs, and the dasa is taken from the
  **stellar quarter occupied by the Moon at birth**, *"and not from the Ascendant"*
* **pp. 213–216** the per-quarter dasa lord and nine sub-periods, spelled out for
  all six groups
* **p. 216** *"Planetary Dhasa periods — Mars, 7 years; Venus, 16; Mercury, 9;
  Moon, 21; Sun, 5; Jupiter, 10; Saturn, 4"*
* **p. 219** the group membership — **SAVYA** I. Aswini, Punarvasu, Hastha, Mula,
  Purvabadhrapadha; II. Bharani, Pushya, Chithra, Purvashada, Utharabadhrapadha;
  III. Krithika, Aslesha, Swathi, Utharashada, Revathi. **APASAVYA** IV. Rohini,
  Magha, Visakha, Sravana; V. Mrigasirsha, Purvapalguni, Anuradha, Sravishta;
  VI. Ardhra, Utharapalguni, Jyeshta, Sathabis. *(5+5+5+4+4+4 = 27 ✓)*
* **p. 219** the reading direction: *"For the Savya order of Dhasas read **from
  left to right**; for Apasavya, **from right to left**. For sub-periods of the
  Savya order read **down**; for those of Apasavya read **up**."*
* **pp. 219–222** **Tables 1–4**, with quarter totals **100, 83, 85, 86 years**

**This is a genuine second source and the diff is now runnable.** But note what
`C-5` actually said: *"a transcription error in one row would be internally
consistent and pass every test above."* **A second source only removes that risk
if the two are compared row by row** — and these tables are dense, rotated
90°, and the OCR of the numeric cells is visibly unreliable (Table 3's header
reads "3rd quarter, 83 years" beside "2nd quarter, 83 years", which cannot both
be right if Table 2 gives 83 and 85).

**So: `C-5` moves from "no second source" to "second source in hand, diff not
yet run, and the numeric cells need the physical page."** That is real progress
and it is not a closure. The **structural** claims above — group membership,
reading direction, Moon's-pada seeding, the seven period lengths — are legible
and can be diffed today; the **year-count cells** cannot be trusted from this
scan.

### Ashtottari — **not settled, and the near-miss is a trap**

The register's question is *"Ashtottari follows **Ardra-adi** (B. V. Raman) where
BPHS/Santhanam gives **Krittika-adi**, and the two assign different opening lords
for the same Moon."*

**Ch. XXXVII "Nakshathra Dhasa" (pp. 210–212) looks like the answer and is not.**
It says *"Count the asterisms **from Krithika** to Jenma-Nakshathra and divide by
nine"* — which reads Krittika-adi — but it is **Vimshottari, not Ashtottari**:
p. 211 calls it *"Udu-Dhasa of which the total number of years is 120"*, and its
nine periods are Sun 6, Moon 10, Mars 7, Rahu 18, Jupiter 16, Saturn 19,
Mercury 17, Ketu 7, Venus 20 — **exactly** `DASHA_YEARS` in
[`dasha.py:9`](../app/calculations/dasha.py#L9), summing to 120.

Its nakshatra→lord map (p. 211) is likewise **standard Ashwini-adi Vimshottari**
despite the Krittika-first *presentation*: Krithika→Sun, Rohini→Moon,
Mrigasirsha→Mars, Ardhra→Rahu, Punarvasu→Jupiter, Pushya→Saturn,
Aslesha→Mercury, Aswini→Ketu, Bharani→Venus. All nine agree with ours.

> **So Ch. XXXVII is a clean independent confirmation of our Vimshottari — the
> 120-year total, all nine period lengths, and all 27 nakshatra→lord
> assignments.** `DAS-01`/`DAS-02`/`DAS-03` gain a printed page. That is worth
> having. **It says nothing about Ashtottari**, and anyone who cites "Kalaprakasika
> p. 211 gives Krittika-adi" into the Ashtottari row will have imported a
> Vimshottari page into an Ashtottari question.

**There is a real Ashtottari trace, and it is elsewhere.** **p. 224**
(Ch. XLI, annual horoscope) prints *"The Dhasa periods (for purposes of this
chapter) of the Sun, the Moon, Mars, Mercury, Jupiter, Venus and Saturn are
respectively, **6, 17, 8, 17, 19, 21 and 10** years."*

Against Ashtottari's canonical Sun 6, Moon 15, Mars 8, Mercury 17, Saturn 10,
Jupiter 19, Rahu 12, Venus 21:

| | Sun | Moon | Mars | Mercury | Jupiter | Venus | Saturn | Rahu |
|---|---|---|---|---|---|---|---|---|
| **Ashtottari** | 6 | **15** | 8 | 17 | 19 | 21 | 10 | 12 |
| **p. 224** | 6 | **17** | 8 | 17 | 19 | 21 | 10 | *omitted* |

**Six of seven match Ashtottari exactly.** Moon at 17 breaks the 108-year total
(6+15+8+17+10+19+12+21 = 108 exactly; 17 gives 110), and 15↔17 is a plausible
OCR or typesetting slip. Rahu is absent, consistent with a chapter using only the
seven.

**This is evidence of the Ashtottari *period* table, not of its *seed*.** The
register's question is which nakshatra opens which lord — Ardra-adi vs
Krittika-adi — and p. 224 gives no nakshatra mapping at all. **The Ashtottari
question stays open.** Flagging the Moon cell for the physical page is worth
doing anyway, since if it really is 15 we have a printed Ashtottari period table.

---

## 4. Traps in the new pages

Four places where a mechanical extraction ships a defect.

### 1. `MUH-08` / Amirdhadhi — **Ch. XXXV's Sunday rows cover 26 of 27 asterisms**

Ch. XXXV (pp. 199–206) is the independent second source for our 7×27
Amirdhadhi/Marana grid, which `MUH-08` records as sourced to **one** almanac
publisher and flagged single-source. All seven weekdays are printed with their
Siddha / Amirtha / Subha / Suba-Madhyama / Nasa / Mruthyu / Dhaktha bands.

**Count Sunday before trusting it.** Siddha 7 (Utharapalguni, Utharashada,
Utharabadhrapada, Hastha, Revathi, Sravana, Mula) + Suba-Madhyama 14 (Rohini,
Mrigasirsha, Sathabis, Swathi, Chithra, Punarvasu, Bharani, Ardhra, Aslesha,
Krithika, Sravishta, and the three folded into
"Purva-Palguni-ashada-badhrapadha") + Nasa 5 (Aswini, Magha, Visakha, Anuradha,
Jyeshta) = **26.**

**Pushya is missing from Sunday entirely** — and Sunday + Pushya is one of the
combinations **p. 202** lists as felicitous (*"Sunday — Pushya, Hastha or Mula
coinciding with Panchami or Sapthami"*). So the day's three-way classification
has a hole exactly where another page puts a positive. Encode p. 199 as printed
and Sunday-Pushya falls into whatever your default is.

**Two more reasons not to encode this chapter mechanically:**

* **Shorthand ranges.** Friday's Siddha reads *"Purvashada **and the next six
  asterisms**"*; Saturday's Subha reads *"Visakha **and the next three
  asterisms**"*. Those need expanding by hand, and "next" in a 27-ring wraps.
* **Inconsistent yoga naming.** Thursday's fatal band is **"Dhaktha Yoga"**
  (p. 201); **p. 206** calls the same thing **"Dhugtha yoga"**. Same yoga, two
  spellings, six pages apart.

**Recommendation:** run the diff against our grid as an **analysis**, not an
import. `MUH-08`'s single-source flag can only come off after all 189 cells are
compared by hand and the three defects above are resolved on the physical page.

### 2. The Gana errata — **now confirmed, and it is on the contents page**

The first scan's trap #1 is verified. **The errata note sits on the contents
page**, nowhere near p. 72:

> *"**Note** — Page 72: Utharashada, Utharapalguni, Purvashada,
> Purvabadhrapadha are also asterisms of **Manushya Ganam**."*

Without it p. 72 gives Manushya Gana five asterisms and the three ganas total
**23, not 27**. With it, 9/9/9. `GANA_BY_NAKSHATRA` in
[`porutham.py:36`](../app/calculations/porutham.py#L36) must be diffed against the
**corrected** list.

The same errata page also corrects **"Page 207: Chapter XXXVII → XXXVI"**, which
explains the chapter-number collision in the contents (two chapters numbered
XXXVII) and confirms the transit chapter is **XXXVI** — worth knowing before
citing chapter numbers rather than pages.

### 3. Ch. XXXIII's counted yogas are all **relative** — do not read them as fixed lists

pp. 174 and 187 define a dozen yogas purely as counts from a *moving* graha:
Sthoolam (from the Sun to Mula), Kantakam (from Mars to Mula), Jwalitham (5th,
7th, 10th, 14th, 25th, 16th from Mars), Dhwajadhandam (9th from Jupiter),
Bhookampam (7th from the Sun), Ulkai (10th from the Sun), Bramha Dhandam (15th),
Dhwajam (21st), Parigham (5th, 7th, 16th, 24th, 25th from Mars), Apasatham (9th
from Jupiter), Vidhyuth (5th), Soolam (8th), Asani (10th), Nirhatham (14th).

**These are not asterism lists — they are functions of the day's chart.** They
also **overlap heavily** (Ulkai and Asani are both "the 10th from the Sun";
Dhwajadhandam and Apasatham are both "the 9th from Jupiter"). Anyone encoding
them as sets will produce a fixed table that is wrong every day, and will
double-count the aliases. p. 187 closes with *"The above asterisms Bhookampam,
Ulkai etc are inauspicious for good functions **when ruled by the Moon**"* —
there is a gating condition too.

### 4. The three re-shoot pages are still needed — **the whole book being in hand does not fix OCR**

Unchanged from the first request. **pp. 72, 73 and 75** carry values the
transcription cannot settle: the Gana table (above), the Yoni page that
contradicts itself (hostile list names Mongoose; the table on the same page never
assigns it, and gives **eight** hostile pairs where we ship seven), and the Vasya
Taurus row reading "Cancer and Leo" against our Kataka + Thulaam. **p. 34**'s
Annaprasana list has the 11th/12th ambiguity. Add **p. 224**'s Moon cell (15 or
17, above) and **Tables 1–4**'s year cells (pp. 219–222).

These are legibility problems in a book we now own. If the physical volume is to
hand, six page photographs close all of them.

---

## 5. New material we never asked for and should record

Pages that source things not on any open-items list. Not urgent; worth knowing
they exist before anyone builds them from reasoning.

| Pages | What |
|---|---|
| **246–247** | **All twelve bhava significations**, printed. A sourced basis for the interpretation layer, which today has none |
| **248** | The **planet attribute grid** — colour, nature, sex, caste, element, deity, garment, metal, body part, grain, season, taste, residence, temperament. A remedies/significations source |
| **184** | **Oordhwa / Thiryag / Atho-Mukha** asterisms, complete and 9/9/9. Used by pp. 79 (marriage), 107 (grain), 143 (travel) — we resolve these by inference today |
| **185–186** | **Thyajyam ghatikas per asterism** (all 27), plus Thithi Thyajyam, Rasi Thyajyam and weekday Thyajyam. Vishanadi named |
| **183** | **Karana doctrine** — Chara vs Sthira, Vishti's exact half-tithi circuit, and the Nandhai / Badhrai / Jayai / Rikthai / Poornai tithi groups |
| **49, 245** | **Exaltation degrees** (Sun Aries 10, Moon Taurus 3, Mars Capricorn 28, Mercury Virgo 15, Jupiter Cancer 5, Venus Pisces 27, Saturn Libra 20) and the exaltation/debility signs |
| **209** | **Planetary strength multipliers** — *"A planet located in his own house, in his own Virga, in exaltation, in Virgothama position and in retrogression possesses **three-fold** strength. Asthangatha planets and those in debilitation put forth only **half** their power and those in inimical signs exhibit but **two-thirds**"* |
| **210** | **Vedhai Signs from the House of the Moon** — a 6×12 gochara-vedha table, with the author's own caveat that Jupiter-in-5/9/11 predictions *"are seldom realised... the Vedhais of planets is responsible for the disappointment"*. We do not model gochara vedha at all |
| **166–177** | Ch. XXXIII entire — the book's **definitions chapter**, which every other chapter cross-references. If one chapter is worth encoding properly, it is this one |
| **189–197** | Ch. XXXIV entire — **neutralizations**. The least-implemented chapter in the book; we score afflictions with almost no cancellation logic |

**p. 209's multipliers are the notable one.** `chart_strength` composes a 0–100
strength from several components; a printed three-fold / two-thirds / one-half
scheme is a direct claim about how those should combine. Worth a look before the
next strength change.

---

## 6. Status after this extraction

### Closed

* **Book 2 acquisition.** Nothing left to photocopy from Kalaprakasika
* **`A-10`** combustion orbs — p. 244, all seven orbs + both retrograde variants
* **`MUH-06` SPIRITUAL** divergence — p. 192 supplies the quoted line
* **`A-19`** janma-tara polarity — resolves as precedence via pp. 167–168; two
  sub-questions remain for the owner (exemptions, and full/half/quarter grading)
* **`A-6`** Dinam pada exceptions — the Ch. 33 cross-reference is in hand
* **`STR-03`** — p. 246 confirms the Moon has no classical enemies; the hedge goes
* **`DIV-01`/`DIV-02`** amsa-lord rules — pp. 178–182, incl. D7's 84 amsas

### Closed negative — stop looking

* **`A-1`/`FCR-04`** Kandaka Sani — **Kalaprakasika does not have this rule.**
  Four unrelated "Kantakam"s, none involving Saturn
* **`A-3`** Tamil month boundary — Ch. XL is omens, not calendar arithmetic
* **`PN-5`** Nethiram — a classical parent exists (p. 171) **and disclaims our
  region** (pp. 192, 195). Stays `[LINEAGE]`; the disclaimer is now on record

### Recommended for ruling

* **`PN-1`** — relabel the node rows `[PRODUCT]`. Two printed tables in this
  lineage, zero node rows. Nothing left to find
* **`FCR-10c`** — **the 83 → 74 marriage change needs re-deciding against p. 249.**
  Keep it as a `[VARIANT]` inference, or revert. **Constant and gate move together**
* **`MUH-06` MEDICAL** — confirm the knowing divergence stands with the page in hand
* **p. 245 aspects** — adopt fractional drishti, or record why we do not

### Still open, unchanged

* The **32 yoga verdicts** (§9.1 item 1) — untouched by this book
* The **Porutham share** at 20/100 (§9.1 item 4) — a positioning call
* **`A-5`/`A-7`/`A-8`** — which text governs porutham. Both pages in hand; owner's call
* **Ashtottari seed** (Ardra-adi vs Krittika-adi) — p. 224 gives six of seven
  *period* lengths, no nakshatra mapping
* **`C-5` Kalachakra** — second source in hand; **row-by-row diff not yet run**,
  and the year cells need the physical page
* **Book 1** — the Tamil *Jothidam* volume, **still unnamed**, still 12 citations.
  Now also the **only** remaining candidate for `A-1`/`FCR-04`
* **Book 3** — a printed Tamil Thirukanitham panchangam. Still held in no form.
  Blocks `A-3`, `A-12` (Gowri), `PN-5`, Durmuhurtham, and the twelve `None`
  sunrise cases
