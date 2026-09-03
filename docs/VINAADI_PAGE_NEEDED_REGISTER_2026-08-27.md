# `[PAGE NEEDED]` Register

**Opened 2026-08-27** from §9.1 item 3 of
[`VINAADI_FUNCTION_CALCULATION_AND_SCORING_REFERENCE_2026-08-27.md`](VINAADI_FUNCTION_CALCULATION_AND_SCORING_REFERENCE_2026-08-27.md).

Five rules in the engine rest on **lineage or a specific almanac**, not on a
classical work that can be derived from or reasoned about. They are executing
today and they are not wrong; what they lack is a citation. This file is the one
place that tracks them, so that none of them drifts into being treated as
sourced merely because it has been in the tree a long time.

**Two of the five are now closed — `PN-2` and `PN-1` — both by relabelling to
`[PRODUCT]` on an owner ruling rather than by finding a page. That is a
legitimate way out and it is the only one besides the physical copy.**

**Nothing here is closed by reasoning.** A row that still claims a source closes
only when a physical copy supplies the fields below. An astrologer who cites a page from memory is
how fabricated provenance enters a system and never leaves; that is the failure
this register exists to prevent.

---

## What closes a row

Every row needs four fields. Three are obvious. The fourth is the one that
actually matters.

| Field | Why |
|---|---|
| **Publisher** | Tamil almanac and muhurta texts are reprinted by many houses with divergent tables under the same title |
| **Edition / year** | Tables are silently corrected between editions |
| **Page** | So the next reviewer can check the claim rather than trust this file |
| **Vakya or Thirukanitham** | **See below — this is not bookkeeping** |

### Why the reckoning field is mandatory for any almanac row

A Vakya panchangam and a Thirukanitham panchangam disagree on tithi and
nakshatra end-times, sometimes by hours. **We ship Thirukanitham.**

If a rule was printed against Vakya reckoning and we execute it on
Thirukanitham longitudes, the rule fires **on different days than its own author
intended**. That is a permanent, silent off-by-one. No test catches it, because
the code faithfully implements the rule it was given; the error is in the frame,
not the arithmetic. A source without this field is not a closed row — it is a
new bug with a citation attached.

A photograph of the page, including the title page and edition line, closes a
row completely.

**What to actually put on the glass** is in
[`SOURCE_PHOTOCOPY_REQUEST_2026-08-27.md`](SOURCE_PHOTOCOPY_REQUEST_2026-08-27.md),
which groups every open item in this register and in
[`OPEN_ITEMS_NEEDING_ASTROLOGER_2026-08-18.md`](OPEN_ITEMS_NEEDING_ASTROLOGER_2026-08-18.md)
by **book** rather than by rule ID. The one thing to note here: `PN-4`'s p.243
and `PN-5`'s cutoffs both point at a Tamil volume this repository cites twelve
times and **never names** — so its title and imprint page are the single
cheapest exposure on that list.

---

## The register

| ID | Rule | Code site | Grade today | Scoring reach |
|---|---|---|---|---|
| ~~`PN-1`~~ | Naisargika maitri — **node rows only** | [chart_strength.py:176](../app/calculations/chart_strength.py#L176), [:187](../app/calculations/chart_strength.py#L187) | **`[PRODUCT]` — CLOSED 2026-08-28 by ruling** | Scores — natal + daily transit |
| `PN-2` | Baladi avastha **multiplier curve** | [chart_strength.py:286](../app/calculations/chart_strength.py#L286) | `[PRODUCT]` *(relabelled 2026-08-27)* | Scores — ~4–5 pts of the composite |
| `PN-3` | Sevvai dosham **gender weighting** | [_yoga_helpers.py:41-42](../app/calculations/_yoga_helpers.py#L41) | `[LINEAGE]` | Scores — dosham severity |
| `PN-4` | Sade Sati **90-month grade bands** | [sade_sati.py:69](../app/calculations/sade_sati.py#L69) | `[LINEAGE]` | Scores — phase severity |
| `PN-5` | **Jeevan / Nethiram cutoffs** | [panchangam.py:354](../app/calculations/panchangam.py#L354), [:393](../app/calculations/panchangam.py#L393) | `[LINEAGE]` — **hardened 2026-08-28** | **None — display only** |

---

### `PN-1` — Naisargika maitri, node rows

**What is sourced and signed:** the seven-graha core. Every asymmetry in it
falls out of the Moolatrikona arithmetic, which is exactly what makes it
doctrine rather than preference — it can be re-derived and checked.

**What is not:** Rahu's and Ketu's rows. **The nodes have no Moolatrikona sign,
so no node friendship can be derived from anything.** Every entry in those two
rows is a choice someone made, and the code cannot say whose. A 2026-08-27 sweep
of all 9×9 ordered pairs found three asymmetries, one of them (Rahu holding
Saturn a friend while Saturn listed neither node) on the heaviest-weighted graha
in the daily transit component. All three are now symmetric and a test pins node
symmetry — but symmetry is an internal consistency property, not a source.

**Needed:** the lineage's own node friendship table, or an explicit ruling that
these are house policy, in which case they are relabelled `[PRODUCT]` like
`PN-2` and the row closes that way instead.

> ### 2026-08-28 — the search is over; only the ruling is left
>
> The full Kalaprakasika arrived, and its **Appendix, printed p. 246**, prints a
> general planetary-friendship table — the natal-scoped one, not the
> porutham-scoped table at pp. 74–75:
>
> > *"Sun — Saturn and Venus are enemies, the other planets are his friends,
> > Mercury is neutral. **Moon — No enemies.** The Sun and Mercury are her
> > friends and the rest are neutrals. Mars — The Sun, the Moon and Jupiter are
> > friends; Venus and Saturn are neutrals; Mercury is his enemy. Mercury — The
> > Sun and Venus are friends; the Moon, enemy; the rest, neutral. Jupiter —
> > Mercury and Venus are enemies; Saturn, neutral; the rest, friends. Venus —
> > Mercury and Saturn are friends; Mars and Jupiter, neutrals; the rest,
> > enemies. Saturn — Venus and Mercury are friends; Jupiter is neutral; the
> > rest, enemies."*
>
> **All 49 ordered pairs of our seven-graha core match it exactly**, the
> Moon–Mercury asymmetry included. **And the table has no Rahu or Ketu row.**
>
> That is now the **second** printed table in this lineage giving friendship for
> seven grahas only. The Moolatrikona table the derivation argument rests on is
> also printed (**p. 119 footnote**) and contains no nodes either — which is
> precisely why no node friendship can be derived from anything.
>
> **Recommendation: close this row by relabelling the two node rows `[PRODUCT]`,
> exactly as `PN-2` closed.** There is nothing further to search for. Not done
> here because this file requires an owner ruling to relabel, and that rule is
> the reason the register works.

> ### 2026-08-28 — CLOSED by astrologer ruling
>
> *"YES — relabel node rows `[PRODUCT]`. No lineage table exists to offer."*
>
> Relabelled at the constant in
> [`chart_strength.py`](../app/calculations/chart_strength.py#L176), per rule 5
> below. **The values are unchanged**; only the claim made about them is. This
> is the second row to close by relabelling rather than by sourcing, and the
> ruling states plainly why no third option existed.
>
> Two things to protect from a future reviewer's good intentions. First, the
> **symmetry** of the node rows is an internal-consistency property, not
> provenance — it must never be cited as evidence that the rows are traditional.
> Second, the seven-graha core is now genuinely **sourced** (p. 246, all 49
> ordered pairs), so the two halves of this table no longer carry the same
> grade: one is `[CLASSICAL]` with a page, the other is `[PRODUCT]` with none.
> Do not let the core's citation drift across the boundary into the node rows.

---

### `PN-2` — Baladi avastha multipliers

**Partially closed 2026-08-27 — by relabelling, not by sourcing.**

The five zones, their Bala→Mrita order and the reversal in even signs are BPHS
and are **signed**. The five *numbers* — `0.50 / 0.75 / 1.00 / 0.65 / 0.25` —
are a smoothed product curve. The texts express avastha as fractions of effect
(broadly a quarter, a half, full, little, nil) and differ among themselves at
the tails; ours doubles the infant and floors the dead at a quarter where the
texts give nothing.

That smoothing is a defensible engineering choice and was kept. What changed is
the label: it was sitting inside a `[CLASSICAL]` block, which put a product
judgement under Parashara's name. It is now `[PRODUCT]`, documented at the
constant.

**This row stays open** only for the optional upgrade: supply the lineage's
printed fractions and the curve can be restored to `[CLASSICAL]`. **If no source
is forthcoming, close this row as `[PRODUCT]` permanently** — that is an honest
resting state, and preferable to hunting for a source to justify a number
already chosen for engineering reasons.

---

### `PN-3` — Sevvai dosham gender weighting

Female high-attention houses `{4, 8, 12}`, male `{2, 7, 8}`.

**Signed and not in question:** checking all three references independently —
Lagna, Chandran and Sukran — and recording which fired. That is the correct
Tamil treatment, and the common shortcut of reading from Lagna alone is why two
astrologers so often disagree on the same chart. Houses 1/2/4/7/8/12 and the
mutual-cancellation rule are correct.

**Open:** only the gender split. Widely practised, rarely printed.

**Reach:** this changes a severity grade a reader sees on a marriage report, so
it is not cosmetic.

---

### `PN-4` — Sade Sati 90-month grade bands

**Signed and not in question:** the *structure*. Replacing a flat seven-and-a-
half-year penalty with the month-wise division is right, and **the source's own
point in citing it — that the whole period is not adverse — is what most
readings get wrong.** Taking phase position from the real Saturn ingress instant
is right. The Moorti table (1/6/11 Swarna, 2/5/9 Rajata, 3/7/10 Tamra, 4/8/12
Loha) is the classical one. Flooring a mitigated cycle at 1 so it is lighter but
never free is right.

**Open:** the month-band grades themselves — which months are DIFFICULT,
FAVOURABLE, ACUTE, MIXED, and where each boundary falls. The module comment
cites p.243 of the working text; that citation needs its publisher and edition
before it counts.

---

### `PN-5` — Jeevan / Nethiram cutoffs

**The only row with zero scoring reach.** Both limbs are display-only and must
stay that way until this row closes. Do not wire either into a score on the
strength of "it has been on the screen for months".

**Fixed 2026-08-27 without a source, and correctly so** (`FCR-07`): Nethiram and
Jeevan are one paired rubric, and at ring distance exactly 9 the engine printed
**இரு கண்** — both eyes, the best Nethiram — beside **ஜீவன் இல்லை**, no life,
the worst Jeevan. The only such cell in the 0–13 domain; no almanac prints it,
and the same line made Jeevan non-monotonic. The `distance == 9` special case is
deleted and both limbs now share the 8|9 boundary. That defect was identifiable
from internal contradiction alone.

**Still open:** the cutoffs themselves. **This row is the one where the
Vakya/Thirukanitham field bites hardest** — Jeevan and Nethiram are read off
nakshatra positions relative to the Sun's star, exactly the quantity the two
reckonings disagree about.

> ### 2026-08-28 — a classical parent was found, and it argues against citing it
>
> Ch. XXXIII of Kalaprakasika carries the Nethiram vocabulary in full, with a
> formula, at **printed p. 171**:
>
> > *"**Blind Asterisms** — Omit the stellar quarters (Nakshathra-Padhas) from
> > **Purvabadhrapadha** to the ruling asterism at the time in question. Divide
> > these stellar quarters by 27. **Remainders from 1 to 6 represent blind
> > asterisms; remainders 7 to 15 represent asterisms blind of one eye; 16 to 27
> > are asterisms with two eyes.**"*
>
> Two things follow, and they point opposite ways.
>
> **1. It is a rival construction, not ours.** The book counts padas from
> Purvabhadrapada mod 27; we use a ring distance from the sunrise star. These
> disagree on most days. **This does not confirm our table.**
>
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
>
> **2. The book excludes our readers by name, twice.**
>
> > **p. 192:** *"the evil effects of Soolam, Athimasam, Ekargala and **blind
> > asterisms** prevail **only in that part of the country north of the river
> > Sone**."*
> >
> > **p. 195:** *"The bad influences connected with Panku (lameness) and
> > **Andham (blindness) Kanan (one-eyed)** and Soonya-Masa prevail **only in the
> > provinces of Magadha and Gouda**."*
>
> Magadha and Gouda are Bihar and Bengal. **Tamil Nadu is about a thousand miles
> outside the stated scope.** Kalaprakasika supplies the rule and then says it
> does not operate where our users live.
>
> **So this row does not close — it hardens.** The Tamil almanac lineage remains
> the *only* authority for showing Nethiram to a Tamil reader, which is exactly
> what the row already said. **A citation to p. 171 here would be worse than no
> citation**: a page that, read to its end, argues against the feature. Recorded
> so that nobody closes `PN-5` later by finding p. 171 and stopping there.
>
> Related doctrine, **p. 198**: the book states outright that regions honour
> different yoga families — *"Vara and Nakshathra Yogas are considered important
> in the province of Bengal; in the Yamala country importance is attached to
> Thithi and Vara Yogas; in Kalinga, Amsa Yoga; in Avanthi, Vishkamba and other
> Yogas"*. **The text itself denies that its chapters are universal**, which
> supports our Tamil-first overrides and warns against importing any chapter
> wholesale.

---

## Rules for maintaining this file

1. **A row closes only on a physical page.** Not on a website, not on a second
   astrologer's recollection, not on internal consistency.
2. **Never fill a page number from memory**, including your own. An empty field
   is a known gap; a wrong one is a lie that survives every future review.
3. **A row may also close by relabelling** — conceding the rule is house policy
   and marking it `[PRODUCT]`. That is a legitimate outcome, not a failure, and
   `PN-2` has already taken it.
4. **Do not increase a row's scoring reach while it is open.** `PN-5` is
   display-only by ruling; the others already score and must not score *more*.
5. When a row closes, record the four fields **in the code comment at the site**,
   not only here — the register is an index, and the citation belongs next to
   the constant it justifies.

## Change log

| Date | Change |
|---|---|
| 2026-08-27 | Register opened with five rows. `PN-2` relabelled `[PRODUCT]` at the constant and in §3.3.3 of the reference doc — its classical claim withdrawn rather than left unsigned |
| 2026-08-28 | **The full Kalaprakasika arrived (pp. 1–249) and moved two rows in opposite directions.** `PN-1`: p. 246 prints a general naisargika table whose 49 seven-graha pairs match ours exactly and which **has no node rows** — a second such table in this lineage, so the search is over and only the relabelling ruling is left. `PN-5`: p. 171 supplies a classical blind/one-eye/two-eye rule, and pp. 192 and 195 then restrict it to *north of the Sone* / *Magadha and Gouda* — so the row **hardens** as `[LINEAGE]` rather than closing, and citing p. 171 is now explicitly warned against. `PN-4`'s bare "p. 243" is still ambiguous: **Kalaprakasika's Appendix does begin at printed p. 243**, and it is a glossary with no Sade Sati content, which is evidence the citation means Book 1 — but not proof. Full extraction in [`KALAPRAKASIKA_FULL_BOOK_EXTRACTION_2026-08-28.md`](KALAPRAKASIKA_FULL_BOOK_EXTRACTION_2026-08-28.md) |
| 2026-08-28 | **`PN-1` CLOSED by astrologer ruling** — *"YES — relabel node rows `[PRODUCT]`. No lineage table exists to offer."* Relabelled at the constant; values unchanged. Two of five rows are now closed, both by relabelling. The register's remaining three (`PN-3` Sevvai gender weighting, `PN-4` Sade Sati month bands, `PN-5` Jeevan/Nethiram) still need the physical books, and `PN-5` is now explicitly *hardened* rather than closeable — see its 2026-08-28 note |
