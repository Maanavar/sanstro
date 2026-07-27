# Numerology — Doctrine Rulings

**Date:** 2026-07-25
**Authority:** Rulings taken under delegated ownership. Every one is reversible; each records what would change if reversed.
**Companion docs:** `NUMEROLOGY_IMPLEMENTATION_PLAN_2026-07-25.md` (the build), NU-8a fixture brief (the pada table).

A ruling here is a *decision with a stated basis*, not a claim of certainty. Where sources genuinely disagree, the ruling is to **carry both** rather than to pick and hide it.

---

## Correction first — a claim I got wrong

An earlier revision of the plan (§3 D1) and of the `numerology_personal_year_epoch` flag comment asserted:

> "rolling over on 1 January is correct in NEITHER tradition and is the most common bug in numerology software"

**That is wrong.** 1 January is the *dominant published convention* in both Pythagorean and Chaldean practice. Multiple independent sources — including Chaldean-specific treatments using the mulank/month/universal-year formula — set the personal year to the calendar year. The birthday-rollover school is real and defended, but it is the minority position, not the standard.

Both the flag comment and the plan now carry the correction, and `"january"` is an available option rather than one I excluded on a false premise. Fixed in `app/services/feature_flags.py`.

---

## D1 — Personal year epoch

**Ruling: default `"birthday"`, with `"january"` and `"chithirai"` both available via the flag.**

**Basis — coherence, not correctness.** I am not ruling that the calendar-year method is wrong; the sources say it is the more common one. I am ruling that it is wrong *for this product*:

Vinaadi already computes **varshaphala from the solar return** (`app/calculations/tajaka.py::find_solar_return_jd`). The solar return *is* the birthday boundary. If the numerology personal year rolled over on 1 January while varshaphala rolled at the birthday, the app would ship two "your year ahead" features whose years start on different days. A user comparing them would find them contradicting each other with no explanation available, and both would be correct in their own tradition. Internal coherence beats external convention here.

**Chithirai** (Tamil new year) is retained as a third option because some Tamil practitioners hold it, and it costs nothing to keep once the branch exists.

**If reversed:** flip the flag. No code change — this is why it is a flag.

**Sources:** [Numerologist.com personal year](https://numerologist.com/calculators/personal-year-calculator) · [BhagyaVastu](https://bhagyavastu.com/personal-year-calculator/) · [Almanac 2026 guide](https://www.almanac.com/whats-your-personal-year-number-numerology-guide-2026) · [Felicia Bender](https://feliciabender.com/numerology/1-personal-year/)

---

## D2 — Baby-naming precedence

**Ruling: `"pada_first"` stands as default. Unchanged, and I want to state the basis plainly rather than leave it as a preference.**

The nakshatra-pada akshara system is codified in classical Jyotish — it traces to the **Brihat Parashara Hora Shastra**, and the 108 syllables (27 × 4) are a canonical structure, not a modern convention. Chaldean numerology entered Tamil practice through Cheiro in the early 20th century. When the two disagree about a name, the older and better-attested system leads. That is the whole content of "a number never overrides a graha."

`"numerology_first"` remains deliberately unoffered.

**Sources:** [Drik Panchang Swar Siddhanta](https://www.drikpanchang.com/swar-siddhanta/nakshatra/nakshatra-pada-swar-siddhanta.html) · [Vedic naming overview](https://astronidan.com/blog/nakshatra-pada-calculator-find-exact-pada-baby-name/)

---

## D3 — Which script scores a name

**Ruling: confirmed. English/document spelling, enforced in code.**

Chaldean letter values are defined over the Latin alphabet; there is no Chaldean value for a Tamil letter. Tamil Nadu name-correction practice operates on the spelling that appears on documents. `score_text` raises `ScriptMismatchError` rather than skipping non-Latin characters, and every response echoes `scoredName`.

**Note the deliberate asymmetry within the same feature:** numerology scores the **Latin** form; pada matching needs the **Tamil** form. Neither script is sufficient for the other's job — see the NU-8a analysis, where bare Latin resolves only 94 of 108 padas and Tamil only 80.

**If reversed:** real but contained rework — `score_text` and its tests.

---

## NU-05 — Compound numbers 10–52 — **discharged**

**Ruling: sourced to Cheiro, *Book of Numbers*, London: Herbert Jenkins Ltd, 1935 ed., pp. 126–133.**

All 43 numbers are now in `app/services/numerology_content.py`. Structure follows Cheiro's own: **26 carry distinct meanings; 17 he explicitly reads as repeating an earlier compound** (33≡24, 34≡25, 35≡26, 36≡27, 38≡29, 39≡30, 40≡31, 41≡32, 42≡24, 44≡26, 45≡27, 46≡37, 47≡29, 48≡30, 49≡31, 50≡32, 52≡43). Those are modelled as `echoes`, not duplicated copy.

*(The series stops at 52 because, per the Chaldean rationale Cheiro reports, adding the mystical 7 to the compound 45 gives 52 — the weeks of the year.)*

### The editorial ruling this forced

**Cheiro's originals are heavily fatalistic.** 13 is "Death". 16 is "The Shattered Citadel — fatality, accidents, defeat of plans". 26 is "disasters through associations". 29 is "treachery". Plan §9.3 bans exactly this register, and `BANNED_FEAR_TERMS` literally contains *danger*, *disaster*, *ruin*, *destroy*.

I ruled that **we keep his titles and re-render his meanings.** A 1935 occultist's fatalism is not what a Tamil astrology product should say to someone about their own name.

- **Title preserved verbatim** — that is scholarship, and "Royal Star of the Lion" is worth keeping.
- **Meaning re-rendered as tendency and as something actionable.** 16 becomes *"classically the sharpest warning in the series — read as: check the foundation before you build higher."* It still reads as a caution. It does not read as a sentence passed on the reader.
- **`CompoundTone` records Cheiro's original register** (favourable / mixed / cautionary) on every row, so the distance between his framing and ours is auditable rather than quietly erased. Sanitising in secret would be the dishonest version of this.
- A test asserts all three tones are still present — the guardrail must not flatten every number into bland positivity.

One substantive correction to popular usage: **13 is graded `MIXED`, not cautionary.** Cheiro reads it as upheaval and reinvention — "power that destroys if misused" — not as misfortune. The "unlucky 13" reading is a Western folk import, not his.

**Sources:** [Classical Cheiro compound descriptions](https://bostjanlovrat.com/2024/08/21/classical-cheiros-descriptions-of-compound-numbers/) · [Cheiro system overview](https://livingincycles.blog/2020/01/21/investigating-correspondences-between-numerology-and-astrology-part-2-introducing-cheiros-numerology-system-chaldean/) · [Astroccult compound numbers](https://www.astroccult.net/compoundnumbers.html)

---

## D4 — What makes two *numbers* compatible (NUM-34) — **ruled 2026-07-27**

**Ruling: the number-pair relation follows Cheiro's own series doctrine, not Parashari naisargika maitri. Flag `numerology_compatibility_basis`, default `"cheiro_series"`.**

### The mistake this corrects

NUM-34 was first built reading the number pair off the repo's existing natural-friendship table: number → graha → naisargika maitri. That is *internally* tidy — it reuses the table `shadbala`, `compatibility_intelligence`, `daily_guidance` and the Graha Maitri kuta already share, and it invents nothing.

**It is also the wrong instrument, and I had the reasoning backwards.**

Naisargika maitri is a **dignity rule**. Parashara's permanent-friendship table governs how a graha behaves *when placed in a sign owned by another graha* — it decides strength, not sympathy between people. Neither Parashara nor Cheiro ever applied it to "do these two get along". Transferring it to person-to-person compatibility is a category move nobody in either tradition made; it merely *looks* rigorous because the table is old.

Cheiro, by contrast, states a compatibility doctrine **explicitly and in exactly these terms** — which numbers a person "gets on well with". That is the question NUM-34 asks. Chaldean numerology reached Tamil practice through Cheiro (already ruled at NU-05), so his answer is the one this system inherits.

### What the primary text supports

Quoted from Cheiro, *Book of Numbers* (chapter per birth number):

| Number | Cheiro's own words |
|---|---|
| 1 | "get on well with persons born under the **2, 4, and 7**" |
| 2 | "vibrate together" with **1**, and "in a lesser degree with number **7** people" |
| 3 | "get on with persons whose birth date is one of the series of **3, 6, or 9**" |
| 4 | "more attracted to persons born under the **1, 2, 7 and 8** numbers"; interchangeable number is **8** |
| 5 | "get on with persons born under **almost any other number**, but their best friends are those born under their **own number**" |
| 6 | "make more friends than any other class", especially under "the **3**, the **6**, the **9**" |
| 7 | "get on well and make friends easily with all those born under the **Moon numbers**" (2) |
| 8 | "their interchangeable number, which is **4**" |
| 9 | *chapter not captured in the scanned text; **3** and **6** both name the 3-6-9 series from their side* |

**Two sympathetic groups, one universal number, one pair bond:**

- **Group A = {1, 2, 4, 7}** — every member names other members. Cheiro's "1-4" (Sun/Uranus) and "2-7" (Moon/Neptune) series, which he says are sympathetic *to each other*.
- **Group B = {3, 6, 9}** — the Jupiter/Venus/Mars series, named from three sides.
- **5 (Mercury)** — gets on with almost anyone; best with another 5.
- **4 ↔ 8** — interchangeable, mutually named. 4 therefore sits in two series, which is Cheiro rather than an encoding accident: he names it attracted to 1, 2 and 7 *and* gives 8 as its interchangeable number.

Cheiro maps 4 to **Uranus** and 7 to **Neptune**; Tamil practice re-maps these to **Rahu** and **Ketu**, which is what `NUMBER_TO_GRAHA` already does. The group structure is unaffected by the re-mapping.

### The finding that decides the shape of the whole layer

**Cheiro names sympathies. He does not name enmities.** He says who you get on with and is silent about the rest — and *silence is not enmity*. Building an "enemy" tier out of what he declined to say would be invention wearing a source's name.

So under this basis there are exactly three grades: **harmonious** (same group, or 5 with 5), **supportive** (5 with anyone else), **neutral** (everything Cheiro does not speak to). No pairing is condemned.

The consequence is deliberate and is the best property this feature has: **the numerology layer can raise a compatibility score and can never lower one.** Every negative verdict comes from the poruthams. That is standing ruling 1 — *a number never overrides a graha* — carried to its conclusion, rather than asserted and then quietly undercut by a table that grades half of all couples as adversaries.

### Cheiro's 4-8 fatalism is refused, per standing ruling 3

Cheiro is emphatic elsewhere about "the terrible combination of the 8 and the 4", calls it fatalistic in love and marriage, and advises changing a name to escape it. **We do not encode that.** Standing ruling 3 bans the 8-and-4 fear trade and `BANNED_FEAR_TERMS` lints the corpus for exactly this.

This is the same editorial ruling already made at NU-05: **keep his structure, re-render his fatalism.** The structural fact — 4 and 8 are interchangeable and drawn to one another — is kept and grades as harmonious. The doom is dropped.

And the substantive point is not merely editorial: whether Sani (8) or Rahu (4) is heavy *for these two people* is a question their **charts** answer, through the per-side Fortune Alignment and through the porutham. A 4-and-8 couple whose charts carry Sani as yogakaraka are fine, and telling them otherwise on the strength of a number's reputation is the exact malpractice `should_advise_name_change` exists to refuse.

### Why the graha table still ships

`graha_maitri` remains available as the second basis (flag-selectable, both branches built and tested — the `nadi_parihara_mode` precedent), and the naisargika regard is **reported on every pair regardless of the active basis**. Two reasons:

1. This is a Thirukanitham product. An astrologer reading the screen wants the graha view, and when the two doctrines disagree that disagreement is information.
2. It preserves the one genuinely valuable thing the first build found: **permanent friendship is asymmetric.** Rahu counts Venus a friend; Venus counts Rahu an enemy. That was real — I had merely filed it in the wrong drawer, as a property of the *number* pair when it is a property of the *graha* pair. It is now reported as `grahaRegardAToB` / `grahaRegardBToA` and cannot be collapsed.

Measured under the graha basis across the 45 unordered pairs: harmonious 15, supportive 6, neutral 5, one-sided 3 (exactly 2×5, 4×6, 6×7), strained 7, difficult 9. Under the Cheiro basis: harmonious 19, supportive 8, neutral 18, and nothing negative.

### Still open for the astrologer

- **Number 9's own chapter** was not in the scanned text. Its membership in the 3-6-9 group rests on numbers 3 and 6 naming it from their side, which is good but is not 9's own statement. A printed copy closes this.
- **Whether Tamil practice follows Cheiro here at all.** Popular Tamil and Indian numerology sites publish friendship tables that contradict Cheiro *and each other* — one gives 7 no enemies and friends {1,2,4,5}; another gives 7 friends {6,9} and enemies {1,2,8}. None is a printed authority, and the disagreement is why none was adopted. If a named Tamil printed source carries a different table, it outranks this ruling.

**Sources:** [Cheiro, *Book of Numbers*, full text](https://archive.org/stream/cheirosbookofnumbers/Cheiro's%20Book%20of%20Numbers_djvu.txt) · [Cheiro system overview / 1-4 and 2-7 series](https://livingincycles.blog/2020/01/21/investigating-correspondences-between-numerology-and-astrology-part-2-introducing-cheiros-numerology-system-chaldean/) · [The 4 and 8 combination](https://www.astroyogi.com/blog/the-4-and-8-combination.aspx) · contradicting popular tables: [Chaldean friend/enemy numbers](https://harvestedspiritualmind.blogspot.com/2021/10/numerology-of-my-name-chaldean-system.html), [numerology compatibility chart](https://astrologyexperts.in/blog/numerology-compatibility-chart/)

---

## D5 — The Tamil lineage, and what this instrument is actually called — **ruled 2026-07-27**

**Ruling: the numerology half of NUM-34 is *Peyar Porutham* (பெயர் பொருத்தம்), it sits explicitly beneath *Jathagam Porutham*, and Sethuraman's name↔date harmony is carried per partner.**

### What Tamil Nadu actually practises

The lineage is not merely "Chaldean". It is **Chaldean via Cheiro, adapted to Tamil use by Pandit Sethuraman**, whose *Adhista Vingyanam* (அதிர்ஷ்ட விஞ்ஞானம், "Science of Fortune", Tamil, 1954, thirteen editions to 1997; English edition by his son V. S. Guruswami) is the text that made this the default system across the state. Three consequences the engine must respect:

1. **The Navagraha mapping is the reason the system took hold here.** 1→Sun, 2→Moon, 3→Jupiter, 8→Saturn and so on match Tamil astrological belief directly. Note Cheiro himself wrote 4 = **Uranus** and 7 = **Neptune**; the re-mapping to **Rahu** and **Ketu** *is* the Tamil adaptation, and `NUMBER_TO_GRAHA` already encodes it.
2. **Sethuraman's core teaching is name↔date harmony** — "how a person should have his or her name spelt based on dates of birth". That is *intra*-person, not between two people, and it is the doctrine Tamil families actually act on when they add or drop a letter.
3. **Two instruments, ranked.** *Jathagam Porutham* — the ten poruthams over two full charts — decides a marriage. *Peyar Porutham* — names plus dates of birth — is the numerology-side instrument, valued chiefly because **it needs no birth time**. It is a complement, never a rival.

### What this changes in the build

**The response names the instrument in Tamil.** The numerology block is `peyarPorutham`, carrying `peyar_porutham` / `பெயர் பொருத்தம்`, and the astrology block is labelled Jathagam Porutham. A Tamil user must be able to see at a glance which instrument produced which number and which one outranks the other. (Follows the standing display convention: Tamil almanac naming over Sanskrit or invented English.)

**Sethuraman's harmony ships per partner.** Each partner's *own* name against their *own* date of birth and chart — the Fortune Alignment that Phase 3 already computes — is reported as `nameHarmony`, one per side. This is the sourced, load-bearing part of Tamil practice, and until now NUM-34 did not carry it: the build compared her numbers with his and never asked whether either person's name suited them. It is **reported, not folded into the pair score** — it is a fact about one person, and averaging it into a couple's number would make a two-person score partly a one-person score.

**The ordering is stated, not implied.** `POST /numerology/compatibility` leads with `astrology` (Jathagam Porutham) and `overallLabel` is that engine's, enforced by a validator. Peyar Porutham may add at most eight points and, under the default basis, cannot subtract at all.

### The gap this opens — and it is the biggest one in the feature

**No copy of *Adhista Vingyanam* was available to me, and nothing in the repo cites it.** Every ruling in this document is sourced to Cheiro's English original, to Parashari tables, or to online material — and Sethuraman is the Tamil adaptation those readers actually follow. Where he differs from Cheiro, **he outranks Cheiro for this product.**

Specifically he could overturn or close:

| Item | What Sethuraman would settle |
|---|---|
| **D4** | Whether Tamil practice carries a number friendship/enmity table at all, and if so, whose |
| **NU-05** | The compound 10–52 readings, in Tamil, from the Tamil source — replacing my re-rendering of a 1935 English occultist |
| **NU-04** | Possibly the 108 pada aksharam table, the hard blocker on baby naming |
| **NUM-53/54** | The canonical correction operations, against the seven I reconstructed |

Online Tamil "Peyar Porutham" calculators were checked and are **not** usable as sources: they are black boxes, they disagree with one another, and at least one applies **A=1, B=2, C=3 — Pythagorean values**, which is simply the wrong system for this tradition. That is the NU-8a protocol vindicated rather than an inconvenience.

**Until a copy is in hand, the Cheiro-sourced basis stands as the default and says so on every response.**

**Sources:** [Adhista Vingyanam, Tamil ed.](https://giri.in/products/adhista-vingyanam) · [Science of Fortune, English ed. (Google Books)](https://books.google.com/books/about/SCIENCE_OF_FORTUNE.html?id=98xEBQAAQBAJ) · [Sethuraman lineage / publication history](https://scienceoffortune.com/) · [Peyar Porutham vs Jathagam Porutham](https://www.tamilsonline.com/numerology/numerology-matching-for-marriage.aspx) · [Jathagam Porutham, ten poruthams](https://www.tamilsonline.com/horoscope-compatibility/jathaka-porutham-marriage-matching-in-tamil.aspx)

---

## NU-04 — The 108 pada table — **cross-checked, NOT promoted**

**Ruling: record the corroboration, leave `verified = False`.**

Your NU-8a protocol says: *"Obtain one named printed source. Prefer a Tamil Panchangam or jataka text in current use over an online table — online tables are copies of copies."* I used an online table. That is explicitly the lower tier, so promoting the rows to canon would violate the protocol I was handed.

What I did instead: added a `cross_check_ref` field, distinct from `source_ref`, recording Drik Panchang's Swar Siddhanta table. `cross_checked_row_count()` is 108; `verified_row_count()` is still 0; `is_production_ready()` is still `False`. Confidence rises, canon does not.

### What the cross-check confirmed

- **Purva Ashadha P2/P4** — धा (dhā) vs ढ (ḍha) **confirmed as genuinely different aksharas**, exactly as the NU-8a analysis predicted. The apparent "duplicate Dha" is real data, not a typo.
- **Uttara Bhadrapada P4** — my reconstruction of the draft's ambiguous "Da/Gya" as **ञ (ña)** is confirmed.
- **Hasta** (ष/ण/ठ), **Ardra** (घ/ङ/छ), **Krittika**, **Revati** — all match the draft.

### What it changed — Shravana

The draft carries the **Ja-series** (Ju/Je/Jo/Gha). Drik Panchang carries the **Kha-series** (Khi/Khu/Khe/Kho). A targeted search confirms **both are live traditions with current adherents** — this is a genuine whole-series split, not an error in either.

**Ruling: carry both.** `_ALTERNATES` holds the Kha-series; the matcher accepts either for nakshatra 22, and a name matching only the alternate scores `AMBIGUOUS` with a warning naming the split. Picking one silently would reject correct names under the other tradition.

One observation recorded but **deliberately not used as an argument**: Tamil has no distinct *kha*, so the Kha-series renders கீ/கூ/கே/கோ and collides with the Ga-series at Dhanishta and Shatabhisha, while the Ja-series renders ஜு/ஜே/ஜோ and stays distinct. That makes the Ja-series more *usable* in a Tamil product. Usability is not a doctrinal argument and must not be mistaken for one.

**Note:** the single unresolved joint-key collision (Ardra P2 ≡ Shravana P4, both घा) exists *only* under the Ja-series reading. Under the Kha-series the full 108 rows are uniquely keyed.

**Still owed:** one named Tamil printed source. That is the only thing standing between this table and canon.

**Sources:** [Drik Panchang Swar Siddhanta](https://www.drikpanchang.com/swar-siddhanta/nakshatra/nakshatra-pada-swar-siddhanta.html) · [Popular Vedic Science, Shravana](https://popularvedicscience.com/astrology/nakshatra/shravana-nakshatra-a-complete-guide/)

---

## Standing rulings (restated, unchanged)

1. **A number never overrides a graha.** The alignment engine reads the chart first.
2. **"No change needed" must be reachable and tested.** An engine that can never say no is a slot machine.
3. **The 8-and-4 fear trade is banned**, enforced by a corpus lint, not by review discipline.
4. **Name correction ships with the legal-consequence warning** (Aadhaar / KYC / certificates) or does not ship.
5. **The tradition is declared in the UI** — *"Chaldean numerology, as practised in Tamil Nadu."* Now on every API response as `traditionEn` / `traditionTa`.

---

## What remains genuinely open

| Item | Why it cannot be closed by research | Who |
|---|---|---|
| Pada table → canon | Needs a **printed** Tamil source; online tables are copies of copies (your protocol, and it is right) | Astrologer |
| Shravana series | Both traditions attested; a Tamil printed source decides which leads | Astrologer |
| Tamil-collapse substitution rule | 59/108 rows (55%) affected. **This is the real blocker on baby naming** | Practitioner |
| Root 1–9 + compound Tamil copy | Written by me; needs a native Tamil pass | Tamil reviewer |
| Tamil baby-name dataset | Licensing, not doctrine | Product |
