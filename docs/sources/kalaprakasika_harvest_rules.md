# Kalaprakasika Ch. XX — harvest, in-gathering, expenditure of corn — extraction worksheet

**Source.** N. P. Subramania Iyer, *Kalaprakasika* (Asian Educational Services
1982 reprint of the 1917 first edition), printed pages **105–109**. Extracted
2026-08-15 from the page-by-page transcription of the 150-page scan. PDF page =
printed page + 32.

**Code.** `app/data/kalaprakasika_harvest_rules.py`.

| Activity | Pages | Activity key |
|---|---|---|
| Starting to reap | 105–106 | `HARVEST` |
| The in-gathering of crops | 106–108 | `HARVEST_INGATHERING` |
| Expenditure of corn | 108–109 | `GRAIN_EXPENDITURE` |

---

## This is the chapter `GRAIN` was missing

`kalaprakasika_treasure_rules` records that Ch. XXI names grain in exactly one
sentence (p.110) and that the substantive doctrine lives in Ch. XX. It does:
three distinct activities with their own tables, plus the Dhanya-Parvatha,
Dhanya-Meru and Dhanyarnava yogas that record pointed at by name.

**Ch. XXI's `GRAIN` is deliberately left scored as it was.** It is a *storing*
rule; these are *reaping*, *gathering* and *spending* rules. Its gap note now
cross-references this module instead of claiming the chapter was never read.

---

## Three weekday findings that break the book's own pattern

Mon/Wed/Thu/Fri good and Sun/Tue/Sat bad is near-universal in this text. Here it
is not:

| Where | Finding |
|---|---|
| In-gathering, p.106 | **Saturday is among the four best**, and Wednesday is demoted to *neutral*. The sentence names Saturn as one of the four good day lords, so it does not merely list Saturday — it justifies it. |
| Expenditure, p.109 | **Friday is avoided** — the only such reading in the sourced doctrine — and the next sentence disputes it. |
| Expenditure, p.109 | **Saturday is expressly auspicious**, stated independently at the top of the page rather than resting on an "other days are good" residue. |

None is harmonised toward the pattern. A chapter that disagrees with its
neighbours is evidence about the doctrine, not evidence of a transcription slip.
Pinned by `test_ingathering_calls_saturday_best_and_wednesday_neutral` and
`test_grain_expenditure_avoids_friday_and_records_the_dispute`.

---

## The arithmetic that does not close, and is not patched

Ch. XX p.108, expenditure of corn: 12 best stars, 9 prohibited stars, and then
*"The influence of the remaining asterisms (Aslesha and Magha) is middling."*

12 + 9 = 21 named, leaving **six** unlisted: Aslesha, Magha, Hastha, Visakha,
Anuradha and Purvashada. The parenthetical names only the first two.

Either the scan dropped four names or the translator's list is incomplete, and
this module cannot tell which. So:

* the middling tier holds **only** the two the page prints;
* the list is **not** marked exhaustive;
* the other four take the ordinary unlisted penalty — the least destructive
  reading of an incomplete sentence;
* they are held in `GRAIN_EXPENDITURE_UNACCOUNTED_STARS` pending a clean page
  image, and declared in the activity's `unscored_dimensions`.

Inventing the four missing names is the exact failure this module exists to
prevent — the same call that left `ANNAPRASANA_FAVOURABLE_TARA_COUNTS` empty.
Pinned by `test_grain_expenditure_leaves_four_stars_unaccounted_and_says_so`.

---

## Rule tables

### Starting to reap (p.105–106)

| rule_id | Factor | Encoded | Grade |
|---|---|---|---|
| `KP_CH20_HARVEST_NAKSHATRA_001` | Nakshatra | 14 most favourable; list open | Bonus |
| `KP_CH20_HARVEST_TITHI_001` | Tithi | Avoid 4,8,9,11,12,14 + NM; remainder good | Penalty |
| `KP_CH20_HARVEST_KARANA_001` | Karana | Sthira four + Vishti, enumerated in place | Veto-class at the moment |
| `KP_CH20_HARVEST_VARA_001` | Vara | Good Mon/Wed/Thu/Fri; no adverse day named | Penalty |
| `KP_CH20_HARVEST_JANMA_TARA_001` | Janma tara | janma, 10th, 19th, with a stated consequence | **Veto** (personal) |

**One derivation refused.** p.105 says "Signs belonging to benefics ... are
felicitous". The *weekday* half is unambiguous — this book names the Moon,
Mercury, Jupiter and Venus as the benefics in a dozen chapters. The *sign* half
would need us to supply ownerships the sentence does not print, so the derived
set is held in `HARVEST_BENEFIC_OWNED_SIGNS` and **not scored**. Every other
lagna rule in this repo is a list the text printed.

### The in-gathering of crops (p.106–108)

| rule_id | Factor | Encoded | Grade |
|---|---|---|---|
| `KP_CH20_INGATHERING_NAKSHATRA_001` | Nakshatra | 17 best — the widest list in the chapter | Bonus |
| `KP_CH20_INGATHERING_TITHI_001` | Tithi | Avoid 4,6,8,9,12,14 + NM; remainder good | Penalty |
| `KP_CH20_INGATHERING_KARANA_001` | Karana | Sthira four + Vishti | Veto-class at the moment |
| `KP_CH20_INGATHERING_VARA_001` | Vara | Good Mon/Thu/Fri/**Sat**; avoid Tue/Sun; Wed neutral | Penalty |
| `KP_CH20_INGATHERING_LAGNA_001` | Lagna | Fixed best, common middling, movable rejected | Penalty |
| `KP_CH20_INGATHERING_YOGA_001` | Yoga | 7 named configurations | **Not implemented** |
| `KP_CH20_OORDHWA_MUKHA_001` | Reference table | 9 Oordhwa-Mukha asterisms | **Recorded, not wired** |

**The Oordhwa-Mukha table matters beyond this chapter.** Ch. XIV p.79 rules on
this class *for marriage* — "Oordhva-Mukha asterisms are the most fruitful,
Atho-Mukha asterisms cause harm and Thiryag Mukha asterisms breed fever" — and
never defines it. The p.107 footnote here is the definition that passage depends
on.

It is **deliberately not wired to marriage**: marriage scoring is unchanged in
this pass, and the other two classes Ch. XIV names are not defined anywhere in
the pages transcribed. Wiring one third of a three-way classification would
score some marriage days on a rule the others cannot be judged by. Recorded so a
future pass has the table without a second trip to the page.

### Expenditure of corn (p.108–109)

| rule_id | Factor | Encoded | Grade |
|---|---|---|---|
| `KP_CH20_GRAIN_EXPENDITURE_NAKSHATRA_001` | Nakshatra | 12 best, with a stated positive consequence | Bonus |
| `KP_CH20_GRAIN_EXPENDITURE_NAKSHATRA_002` | Nakshatra | 9 prohibited — "under no circumstances" | **Veto** |
| `KP_CH20_GRAIN_EXPENDITURE_TITHI_001` | Tithi | Avoid 4,8,9,14 + NM; remainder good | Penalty |
| `KP_CH20_GRAIN_EXPENDITURE_KARANA_001` | Karana | Sthira four + Vishti | Veto-class at the moment |
| `KP_CH20_GRAIN_EXPENDITURE_VARA_001` | Vara | Good Mon/Wed/Thu/**Sat**; avoid Sun/Tue/**Fri** | Penalty |
| `KP_CH20_GRAIN_EXPENDITURE_LAGNA_001` | Lagna | Fixed best, common middling, movable rejected | Penalty |

**The second star veto in the doctrine.** "Under no circumstances can grain be
interfered with on these days" is categorical — one of only two star-level
vetoes, beside Annaprasana's forbidden eight (Ch. III p.34).

**A restraint retrospectively confirmed.** `GRAIN_EXPENDITURE_LAGNA_001` is the
sentence `kalaprakasika_treasure_rules` refused to import into Ch. XXI p.110's
laying-up rule, on the grounds that it belongs to a different activity. It does
belong here — and Ch. XXI's own sentence names only fixed and common, staying
silent on movable, exactly as that module claimed.

**Self-contradicting page.** p.109 bans Rikthai (in-paksha 4, 9, 14 — two of
which the same sentence has just banned) and then commends it, attributed to
"some astrologers". The ban is applied; the dissent is recorded in
`GRAIN_EXPENDITURE_RIKTA_DISPUTED`.

---

## Deliberately not implemented

| Rules | Why |
|---|---|
| The seven named yogas incl. Dhanya-Parvatha, Dhanya-Meru, Dhanyarnava | Moment chart; two also need the lunar month |
| `HARVEST_BENEFIC_OWNED_SIGNS` | Requires an ownership derivation the sentence does not print |
| Lunar months Sravana and Badhrapadha barred for in-gathering (p.106) | No lunar-month field on the day snapshot |
| The three lagna-plus-star commencement pairings (p.105) | A yoga, not a factor — needs both to coincide |
| Wednesday's neutral tier (in-gathering) | No middling weekday rung; scores as an unnamed day would |
| `KP_CH20_OORDHWA_MUKHA_001` | Only one of the three classes Ch. XIV names is defined |
| Four unaccounted stars in `GRAIN_EXPENDITURE` | The page's own parenthetical is incomplete — see above |
| 8th-house vacancy, upachaya malefics, angular benefics (pp.106, 109) | No muhurta-moment house occupancy |
| Saturn in the 4th as a benefic for in-gathering (p.106) | Moment chart |
