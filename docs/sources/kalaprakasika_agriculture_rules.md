# Kalaprakasika Ch. XIX & XXII — working the land, and eating its first crop — extraction worksheet

**Source.** N. P. Subramania Iyer, *Kalaprakasika* (Asian Educational Services
1982 reprint of the 1917 first edition), printed pages **100–105** and
**114–115**. Extracted 2026-08-15 from the page-by-page transcription of the
150-page scan. PDF page = printed page + 32.

**Code.** `app/data/kalaprakasika_agriculture_rules.py`.

| Activity | Chapter | Pages | Activity key |
|---|---|---|---|
| Entering the land to begin the season's work | XIX | 100 | `AGRICULTURE_START` |
| Tillage / first ploughing | XIX | 100–102 | `TILLAGE` |
| Sowing | XIX | 102–105 | `SOWING` |
| The first meal of new grain | XXII | 114–115 | `NEW_GRAIN_MEAL` |

---

## Why four activities and not one

Ch. XIX names its own stages: *"The first step in this matter is to select an
auspicious day on which the owner may set his foot on his land for the purpose.
Then follow ploughing and other operations."* Each stage then gets its own
tables, and they do not agree.

| | Entering | Tillage | Sowing | New-grain meal |
|---|---|---|---|---|
| best stars | 10 | 9 | 14 + 4 middling | 19 |
| star list closed? | no | no | **yes** | **yes** |
| tithi shape | odd-favourable / even-avoided | exclusion list | exclusion list | exclusion list |
| Purnima / Amavasya | **neither ranked** | both banned | **neither named** | both banned |
| weekday | **Mon/Tue/Wed/Thu** | none stated | Mon/Wed/Thu/Fri | **Wed/Thu/Fri** |
| Leo rising | not stated | **avoided** | **best** | best |
| karana | none stated | none stated | **four, no Sakunam** | **Vishti alone** |
| paksha | not stated | **Shukla required** | not stated | not stated |

The star lists for entering and ploughing overlap on three of ten. A single
"agriculture" activity would have to choose one column and discard three.

---

## The chapter contradicts itself on the rising sign

Under the **same** `TILLAGE` heading:

* p.100 opens *"Taurus, Virgo and Scorpio produce good."*
* p.101 gives a full partition: *"The fortunate signs are:- Taurus, Gemini,
  Cancer Capricorn and Pisces. Avoid Aries, Leo, Scorpio and Aquarius. The
  remaining signs are of middling quality."*

Scorpio is good in one and avoided in the other; Virgo is good in one and
middling in the other.

**The partition is what scores, and the tie-breaker is the chapter's own
voice.** p.101's per-sign gloss says Scorpio *"threatens to cause damage to the
crops by fire"* and Virgo merely *"favours a proper yield"* — it agrees with the
partition and against the opening sentence. The opening sentence is preserved in
`TILLAGE_LAGNA_OPENING_SENTENCE`; neither reading is deleted.

p.100 also says *"Sign Leo or any other, held by the Sun ... is favourable"*,
which p.101 contradicts by avoiding Leo. That clause is conditional on the Sun's
position as well, so it is recorded and not scored.

---

## Three weekday findings that break the book's near-universal pattern

Mon/Wed/Thu/Fri good, Sun/Tue/Sat bad holds across almost every chapter in this
repo's sourced doctrine. Ch. XIX does not follow it.

| Where | Finding |
|---|---|
| Entering the land, p.100 | **Tuesday is among the four auspicious days**, and **Friday is absent entirely**. |
| Entering the land, p.100 | Saturday is *"recommended by some"* — an attributed dissent, recorded and not applied. |
| Sowing, p.104 | Sunday, Tuesday and Saturday are *"favourable only to a particular kind of agricultural work"* — a **qualified permission**, not a prohibition, so all three stay out of the avoid set and score as unnamed days. |
| New-grain meal, p.114 | **Three good days, not four**: Wednesday, Thursday and Friday. Monday is absent, and the three lords the sentence names are exactly Mercury, Jupiter and Venus — so the omission is the sentence's own arithmetic, not a dropped word. |

Preserved rather than harmonised, on the same principle as Ch. XX's Saturday.

---

## The karana list that is missing Sakunam

Every other karana passage in this repo's sourced doctrine names the Sthira four
— Sakunam, Chathushpadham, Nagam, Kimsthughnam — and adds Vishti, making five.
Ch. XIX p.103 says:

> all Karanas except Vishti, Chathushpadham, Nagam, Kimsthughnam are auspicious.

Four, and **Sakunam is not one of them**. Encoded as printed. Completing the list
from the neighbouring chapters would be harmonising a sentence that states its
list in full, in a book already shown to differ deliberately between chapters on
weekdays and on signs.

---

## The tithi rule where three of six carry a consequence

Ch. XIX p.101, tillage:

> All Thithis except Chathurthi, Shashti, Ashtami, Navami, Dhwadhasi,
> Chathurdhasi Full-Moon and New-Moon days are good. To start ploughing on
> Navami causes damage to crops; Chathurthi leads to their destruction by
> insects; Chathurdhasi tends to cause danger to the life of the owner.

A stated consequence is exactly what the registry uses to separate a **veto**
from a **penalty** — and here three of the six excluded tithis have one and three
do not.

`tithi_avoid_is_veto` is one boolean for the whole set, so:

* vetoing it would condemn Shashti, Ashtami and Dhwadhasi on a sentence that says
  nothing about them;
* the containing rule is the weaker *"all Thithis except X are good"* form.

Graded **PENALTY**, with the three that carry consequences held in
`TILLAGE_TITHI_AVOID_WITH_STATED_CONSEQUENCE` rather than silently averaged away.
This is a decision for the astrologer to confirm, not a settled reading.

---

## Ch. XXII disputes its own sign rule in the same paragraph

> Avoid Aries, Scorpio, and Pisces. The last sign is however the most felicitous
> for a meal of the first crops, according to Devaratha.

Attributed dissent: recorded in `NEW_GRAIN_MEAL_PISCES_DISPUTED_BY_DEVARATHA`,
never applied, and the avoidance stands — the same treatment Ch. XX p.109's
Rikthai dissent gets.

Separately, the three avoided signs are **exactly** the three the chapter's
sub-rites require: Aries for the season's first flowers, Pisces for its first
fruits, Scorpio for its first leaves (pp.114–115). That is why those sub-rites
are kept as distinct records and not folded into `NEW_GRAIN_MEAL`.

---

## What is recorded and deliberately not scored

### Graha-relative star counts (the largest gap)

Ch. XIX selects days by counting from the star a **planet** occupies, twice:

| Rule | Page | Shape |
|---|---|---|
| Tillage stars from the **Sun**'s star | 101 | 15 favourable counts, "All other asterisms produce evil" |
| Which of those still afflict the bullocks or the landlord | 102 | counts 1–6 and 13–18 from the Sun |
| Sowing bands from **Venus**'s star | 104–105 | 3 blight / 3 barren / 12 luxuriant / 6 empty / 3 perish |

Both are real rules and both are recorded in full. Neither is wired: the engine's
only star-counting factor counts from a **subject's birth star**, and pointing it
at a graha is a new factor rather than a use of an existing one. This is the
single largest piece of Ch. XIX the engine cannot see.

### Per-crop tables

p.103 gives a root-seed list, a flower-and-fruit list and ten single-crop stellar
yogas. Recorded, not scored — the picker asks for a day, not for a crop, exactly
as Ch. VIII p.54's per-subject lists are recorded and not scored.

**They would also contradict the chapter's own general rule.** Bharani and
Krithika head the root-seed list and neither is on the fruitful-for-sowing list,
which p.102 closes with *"The other asterisms should be avoided"*. Wiring the
crop tables would make the engine approve, for anyone sowing roots, two stars the
chapter has just excluded.

### Everything else

| Rule | Page | Why not scored |
|---|---|---|
| The four first-ploughing yogas | 102 | need a muhurta-moment chart |
| Plough east or north; one, three or five furrows | 102 | not a timing rule |
| Furrow omens (serpent, tortoise, ash, bone) | 102 | not a timing rule |
| Quadruped colour and horn condition | 102 | not a timing rule |
| No malefic in the rising sign | 101 | house occupancy |
| Seeds-and-days table | 104 | pairs each seed with a weekday **and** that day's lord rising |
| Malefics in 3/6/11; Moon in 2/3/4/5/7/10/11; 8th empty; Venus not in 7th | 104 | house occupancy |
| 9th and 10th unoccupied; Moon not in 8th or 12th | 115 | house occupancy |
| Months of Ashada, Margasira and Magha barred | 115 | lunar month |

---

## Grading decisions

| Rule | Grade | Why |
|---|---|---|
| `AGRICULTURE_START` tithi | PENALTY | *"should be avoided"* with no consequence |
| `TILLAGE` tithi | PENALTY | see the section above — the split is declared, not averaged |
| `SOWING` tithi | PENALTY | *"all Thithis except X ... are auspicious"* |
| `NEW_GRAIN_MEAL` tithi | PENALTY | *"All Thithis, except X ... produce good"* |
| all four star lists | PENALTY | no chapter here states a forbidden-star set |
| all weekday and lagna rules | PENALTY | the registry's standing rule; none states a consequence |
| `SOWING` and `NEW_GRAIN_MEAL` karana | VETO-class at the moment | per the registry docstring, with the usual two-karana limit |

---

## Open questions for the astrologer

1. **Tillage tithi grading.** Should Navami, Chathurthi and Chathurdhasi be a
   veto for ploughing, given the stated consequences, while the other three
   excluded tithis stay a penalty? The current flat PENALTY is the conservative
   reading, not a confident one.
2. **The p.100 vs p.101 sign contradiction for tillage.** The partition is
   scored. Confirm, or name the other reading.
3. **Sakunam's absence from the sowing karana list** — printed as-is, or a scan
   omission?
4. **Tuesday as an auspicious day for entering the land** — real, or the
   translator's slip for Friday?
