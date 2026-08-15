# Kalaprakasika Ch. V, VII, XVII & XVIII — Choulam, Upanayanam, Seemantham, the birth chamber — extraction worksheet

**Source.** N. P. Subramania Iyer, *Kalaprakasika* (Asian Educational Services
1982 reprint of the 1917 first edition). Extracted 2026-08-15 from the
page-by-page transcription of the 150-page scan supplied by the repository
owner. Page numbers are **printed book pages**; PDF page = printed page + 32.

**Code.** `app/data/kalaprakasika_lifecycle_rules.py`, bound to activities in
`app/data/muhurta_activity_registry.py`.

| Rite | Chapter | Pages | Activity key |
|---|---|---|---|
| Choulam / Tonsure (Mottai) | V | 37–41 | `TONSURE` |
| Upanayanam (Poonal) | VII | 42–52 | `UPANAYANAM` |
| Seemantham (Valaikappu) | XVII | 96–98 | `SEEMANTHAM` |
| The lying-in apartment (Soothika-Griham) | XVIII | 99 | `LYING_IN_CHAMBER` |

---

## Update 2026-08-15: Ch. XVIII, the lying-in apartment

**What is elected is the *arranging* of the birth chamber, never the birth.**
That distinction is what makes this an election rule at all: Ch. II treats the
moment of birth as natal material to be *read*, and this repo does not offer a
rite it cannot honestly schedule. p.99 says the room *"should be arranged at the
approach of the month of parturition"* — that month is the rite's own framing and
is not something the picker can see, so it is declared as a gap.

One page, and unusually complete: 12 stars, a tithi rule, a karana rule, both
weekday tiers and a full three-way sign partition. It states **no** house rule,
**no** day-part and **no** personal rule, which is why this activity's gap list is
the shortest in the module.

**Two things this page settles for the rest of the repo.**

1. **It defines Rikthai in place** — *"All Thithis except Rikthai (Chathurthi,
   Navami and Chathurdhasi) …"*. That is the clearest statement of the class in
   the transcribed pages, and it corroborates the 4/9/14 reading already applied
   at Ch. XXI p.110 and Ch. XII p.68, neither of which enumerates it.
2. **It is the third corroboration of the Sthira karana membership**, and the
   only one that also pins each member to a tithi half: *"Sakhunam occurs in the
   latter half of Chathurdhasi; Chathushpadham and Nagam occur in the two halves
   of the New-Moon respectively; Kimsthughnam occurs in the first half of
   Prathamai of the bright fortnight."* Ch. XX p.105 and Ch. XXI p.110 are the
   other two, and all three agree exactly.

Its sign partition — fixed best, common middling, movable rejected — matches Ch.
XX p.106's in-gathering rule and is the exact inverse of the learning chapters'.
Recorded as an agreement, **not** promoted to a book-wide default: Ch. X states
the opposite.

---

## Scope decisions

**1. Ch. V's janma/10th/19th ban belongs to the *first shaving*, not the tonsure.**
The sentence sits inside the p.40 paragraph "After tonsure, the first shaving
should be on the 2nd, 6th, 8th or 9th day. Avoid the 3rd, 5th, 7th and the 22nd
day (after tonsure) as also Chandrashtama. The day ruled by your asterism at
birth is also bad, as also the 10th and the 19th asterisms therefrom." The whole
paragraph counts days *after* the ceremony and is about the follow-up haircut.
Recorded under `FIRST_SHAVING` scope and **not** wired to `TONSURE`. This is the
same class of error the spec doc made in giving Annaprasana the milk-feeding
rite's karana clause.

**2. Upanayanam carries two janma-tara bans, and both apply.** p.51 gives a
general set (janma, 5th, 7th, 10th, 19th, 22nd, 27th); p.50 gives a *named* set
(10th Karmam, 16th Sanghatham, 18th Saamudhayam, 23rd Vinasanam, 25th Manasam).
Neither is said to supersede the other, so the engine reads the union — 11 of 27
counts, the widest personal ban in the doctrine. Flagged rather than narrowed.

**3. The scan's garbled ordinals are decoded from Ch. XVI, not guessed.** In
Ch. V and Ch. VII the two middle ordinals both print as "roth". Ch. XVI p.92
spells the same pair out: "the 10th asterism (**Anu-Jenma**), and also the 19th
asterism (**Thri-Jenma**) therefrom". Four further chapters' surviving ordinals
agree. This is a decode from a parallel passage, unlike
`ANNAPRASANA_FAVOURABLE_TARA_COUNTS`, which stays empty because no parallel
passage exists.

**4. Pumsavanam is recorded and not exposed.** p.97: "As a rule, it is blended
with Seemantham in which case the delineations for the latter should be
followed." The text subordinates its own rules; we follow it.

**5. Caste-conditional rules are never encoded.** Ch. V p.38 makes Sunday good
for Brahmanas, Tuesday for Kshathriyas, Saturday for Vaisyas; Ch. VII p.43 sets
caste age limits. The picker holds no caste and must not ask for one.

---

## Rule table — Choulam / Tonsure (Ch. V, pp.37–41)

| rule_id | Factor | Encoded | Page | Grade |
|---|---|---|---|---|
| `KP_CH5_TONSURE_NAKSHATRA_001` | Nakshatra | 9 favourable, 6 "pretty good", remaining 12 excluded | 38 | Bonus / neutral / penalty, list **closed** |
| `KP_CH5_TONSURE_TITHI_001` | Tithi | Best 2,3,5,7,10,11,13; avoid 1,4,6,8,9,14 + FM + NM | 39 | Penalty |
| `KP_CH5_TONSURE_PAKSHA_001` | Paksha | Shukla preferred; Krishna 1–5 exempt | 37–38 | Bonus / penalty |
| `KP_CH5_TONSURE_VARA_001` | Vara | Good Mon/Wed/Thu/Fri; avoid Sun/Tue/Sat | 38 | Penalty |
| `KP_CH5_TONSURE_LAGNA_001` | Lagna | Best Ta,Ge,Cn,Vi,Li,Cp,Pi; avoid Ar,Le,Sc,Sg,Aq | 39 | Penalty |
| `KP_CH5_TONSURE_YEAR_001` | Years from birth | 3rd, 5th or 7th; 3rd best | 37 | **Not implemented** |
| `KP_CH5_TONSURE_AYANA_001` | Ayana | Utharayana required | 37 | **Not implemented** |
| `KP_CH5_TONSURE_PREGNANCY_001` | Household state | Barred while the mother is pregnant | 37 | **Not implementable** |
| `KP_CH5_FIRST_SHAVING_001` | Janma tara | janma, 10th, 19th | 40 | **Different rite** — see scope decision 1 |

*Self-check that passes:* 9 + 6 = 15 named, 27 − 15 = **12**, exactly the
"remaining twelve" the page claims. Evidence both lists survived transcription
whole. Pinned by `test_tonsure_lists_account_for_exactly_the_remaining_twelve`.

## Rule table — Upanayanam (Ch. VII, pp.42–52)

| rule_id | Factor | Encoded | Page | Grade |
|---|---|---|---|---|
| `KP_CH7_UPANAYANAM_NAKSHATRA_001` | Nakshatra | 16 excellent; list open | 44 | Bonus |
| `KP_CH7_UPANAYANAM_TITHI_001` | Tithi | Best (Shukla) 2,3,5,6,7,10,13; avoid 4,8,9,14 + FM + NM | 45 | Penalty |
| `KP_CH7_UPANAYANAM_PAKSHA_001` | Paksha | Shukla preferred; Krishna 1–5 exempt | 44 | Bonus / penalty |
| `KP_CH7_UPANAYANAM_VARA_001` | Vara | Good Wed/Thu/Fri; avoid Sat/Tue; Sun/Mon middling | 45 | Penalty |
| `KP_CH7_UPANAYANAM_LAGNA_001` | Lagna | Best Ta,Ge,Cn,Le,Vi,Li,Sg,Pi; avoid Ar,Sc,Cp,Aq | 45 | Penalty |
| `KP_CH7_UPANAYANAM_KARANA_001` | Karana | Vishti only (no Sthira group here) | 52 | Veto-class at the moment |
| `KP_CH7_UPANAYANAM_JANMA_TARA_001` | Janma tara | janma, 5, 7, 10, 19, 22, 27 | 51 | **Veto** (personal) |
| `KP_CH7_UPANAYANAM_JANMA_TARA_002` | Janma tara | 10, 16, 18, 23, 25 — named counts | 50 | **Veto** (personal) |
| `KP_CH7_UPANAYANAM_YOGA_001` | Yoga | 5 adverse quadrant yogas | 50–51 | **Not implemented** |
| `KP_CH7_UPANAYANAM_YEAR_001` | Years from birth | 5th or 8th; 5th preferred | 42 | **Not implemented** |

**Weekday divergence.** Only three good days, and Monday — good in Ch. III, IV,
V and XXI — is merely middling here, and adverse outright in the dark fortnight.
Sunday and Monday are left out of both scored sets, which scores them neutral.

## Rule table — Seemantham (Ch. XVII, pp.96–98)

| rule_id | Factor | Encoded | Page | Grade |
|---|---|---|---|---|
| `KP_CH17_SEEMANTHAM_NAKSHATRA_001` | Nakshatra | 10 excellent | 97 | Bonus |
| `KP_CH17_SEEMANTHAM_NAKSHATRA_002` | Nakshatra | 3 fallback (Aswini, Anuradha, Mula) | 98 | Neutral — doubly hedged |
| `KP_CH17_SEEMANTHAM_TITHI_001` | Tithi | Avoid 4,6,8,9,14 + NM | 98 | Penalty |
| `KP_CH17_SEEMANTHAM_VARA_001` | Vara | Good Mon/Wed/Thu/Fri; avoid Sun/Tue/Sat | 98 | Penalty |
| `KP_CH17_SEEMANTHAM_LAGNA_001` | Lagna | Avoid Leo, Scorpio; other ten beneficent | 98 | Penalty |
| `KP_CH17_SEEMANTHAM_JANMA_TARA_001` | Janma tara | 3, 5, 7, 10, 19, 22, 27 — **not** janma itself | 98 | **Veto** (personal) |
| `KP_CH17_SEEMANTHAM_COMBUSTION_WAIVER_001` | Combustion | Expressly waived | 98 | **Not scored either way** |
| `KP_CH17_SEEMANTHAM_HOUSE_8_001` | House 8 | Vacancy, with a kendra exception | 98 | **Not implemented** |
| `KP_CH17_SEEMANTHAM_MONTH_001` | Month of pregnancy | 4th, 6th or 8th; 5th/7th per Bhodhayana | 97 | **Not implemented** |
| `KP_CH17_PUMSAVANAM_001` | (whole rite) | 2 stars, own tithi and sign rules | 96 | **Not exposed** — scope decision 4 |

**Intra-page conflict.** p.98 bans Chathurthi and Chathurdhasi and then commends
them two sentences later, attributed to "some" and conditional on a
well-dignified Moon. The ban is applied; the tension is surfaced in
`SEEMANTHAM_TITHI_DISPUTED`. Same shape as the marriage tithi finding.

**Second combustion waiver in the doctrine.** Annaprasana (Ch. III p.35) is the
other, and both waive it for the same reason — the month outranks it. Together
they settle that combustion is per-activity and must never be applied globally.

---

## Deliberately not implemented

| Rules | Why |
|---|---|
| `KP_CH5_TONSURE_YEAR_001`, `KP_CH7_UPANAYANAM_YEAR_001`, `KP_CH17_SEEMANTHAM_MONTH_001` | The picker takes no child birth date or conception date |
| `KP_CH5_TONSURE_AYANA_001`, Ch. VI/VII Utharayana requirements | No ayana or solar-month field on the day snapshot |
| `KP_CH5_TONSURE_PREGNANCY_001` | Not answerable from any chart |
| `KP_CH7_UPANAYANAM_YOGA_001`, `KP_CH17_SEEMANTHAM_HOUSE_8_001` | No muhurta-moment house occupancy |
| Ch. VII p.52 nitya yogas and sandhi periods | Yoga handling is a generic-layer change, out of this pass |
| Caste-conditional weekdays and age limits | The product holds no caste |
| `KP_CH5_FIRST_SHAVING_001` | A different rite; no first-shaving activity exists |
| `KP_CH17_PUMSAVANAM_001` | The text subordinates it to Seemantham when blended |
| Ch. V's per-star effect table for all 27 asterisms (p.38) | Recorded as existing; not transcribed into code this pass |
