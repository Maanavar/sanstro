# Kalaprakasika Ch. VI, VIII, X, XI & XII — the student's arc — extraction worksheet

**Source.** N. P. Subramania Iyer, *Kalaprakasika* (Asian Educational Services
1982 reprint of the 1917 first edition). Extracted 2026-08-15 from the
page-by-page transcription of the 150-page scan. Page numbers are **printed book
pages**; PDF page = printed page + 32.

**Code.** `app/data/kalaprakasika_learning_rules.py`.

| Rite | Chapter | Pages | Activity key |
|---|---|---|---|
| Learning the alphabet (Vidyarambham) | VI | 41–42 | `VIDYARAMBHAM` |
| Commencing education | VIII | 53–57 | `EDUCATION_START` |
| Initiation in a mantra | X | 61–64 | `MANTRA_INITIATION` |
| Beginning Veda study | XI | 65–67 | `VEDA_STUDY` |
| Samavarthanam bath (Snaana) | XII | 67–68 | `SNAANA` |

---

## Update 2026-08-15: Ch. X and Ch. XII, and what Ch. X does to the headline finding

Ch. X and Ch. XII were added in the same pass that extracted Ch. XIX and XXII.
They complete the student's arc — the mantra a pupil is given, and the bath that
closes studentship before marriage — and Ch. X carries **two reversals**.

### Ch. X inverts the sign doctrine the other three share

| | Ch. VI | Ch. VIII | Ch. XI | **Ch. X (p.61)** |
|---|---|---|---|---|
| best | common | common | common | **movable** |
| middling | movable | movable | movable | **common** |
| rejected | fixed | fixed | fixed | fixed |

Ch. X sits **between** Ch. VIII and Ch. XI in the same book and swaps the top two
tiers. Encoded as printed. The agreement of VI/VIII/XI is evidence of a
subject-level doctrine precisely *because* it is not universal across the book;
extending it silently over Ch. X would destroy the thing that made it evidence.
The headline finding below therefore stands as "three of four", not "all".

### Ch. X reverses the book's most-repeated personal rule

> The "asterism of the individual at birth" (Jenma-Nakshathra) and the 10th and
> 19th asterisms therefrom, the Sankaranthi day … are **beneficial**, as also
> Wednesday. — p.62

Six chapters prohibit exactly this triad. The ordinals decode the same way they
do everywhere else in this scan (from Ch. XVI p.92's spelled-out Anu-Jenma /
Thri-Jenma); what is new is the **polarity**, and *"beneficial"* is not ambiguous
in the transcription.

**Not scored, in either direction.** The engine's janma-tara field is a
prohibition set, and adding a "favourable count" field to score one inverted
passage would build machinery around the least corroborated reading in the
chapter. Held in `MANTRA_INITIATION_JANMA_TARA_FAVOURABLE` and **raised for the
astrologer**.

It is not alone: **Ch. III p.32** offers the 10th tara as the fallback good day
for the first milk feeding
(`kalaprakasika_samskara_rules.MILK_FEEDING_FALLBACK_JANMA_TARA`). Two chapters
thirty printed pages apart reversing the same rule is much harder to dismiss as a
transcription slip than either would be alone.

### Ch. X's other oddities

* **17 stars and no closing clause** — the only open star list of the five; the
  other four are all closed by *"The remaining asterisms should be avoided"*.
* **Jyeshta and Mula are on it**, and on no other favourable list in this module.
  Elsewhere the book fears both (Ch. V p.38: Jyeshta *"loss of landed property"*,
  Mula *"ruin of family"*). A mantra initiation is not a worldly undertaking,
  which may be the reason; the text does not say so and nothing here assumes it.
* **One good weekday and one bad one** — Wednesday and Tuesday. The narrowest
  weekday rule in the sourced doctrine.
* The **Siddha Chakra** (pp.62–64) tests the devotee's *name* against the
  mantra's first letter. It selects a mantra, not a moment, and is out of scope
  for a day scorer.

### Ch. XII is the one place in this doctrine that calls Sunday good

> Sunday, Monday, Wednesday, Thursday and Friday are auspicious for the Snaana;
> Saturday and Tuesday are unfavourable. — p.68

Five good days is also the widest weekday permission in the book. Both tiers are
stated explicitly, so this is the chapter's position and not an omission.
Elsewhere Sunday is either avoided (Ch. III, IV, V, XVII, XX) or called middling
(Ch. VI, VIII, XI). Preserved, on the same principle as Ch. XX's Saturday and Ch.
XIX's Tuesday.

Two Ch. XII qualifications are recorded and **not** applied:

* *"Asterism Swathi is commended by some astrologers"* — a sharper case than the
  other attributed dissents in this repo, because the list it would join is
  **closed**: applying it would contradict the closing clause in the same breath.
* *"Shashti is considered favourable to kings"* — a rank-limited permission, the
  same shape as Ch. V p.38's caste exception. The picker does not know who the
  subject is, so a permission granted to kings is not granted to everyone.

**Ch. XII's other half is deliberately not an activity.** p.68 says *"The rules
for the selection of an auspicious time for Vrutham are the same as those for
Tonsure"* — a cross-reference, not a rule set. Cloning `TONSURE`'s tables under a
second name would present one rule set as two independent confirmations.

---

## The headline finding: three chapters, one doctrine

Every other activity pair in this repo's sourced doctrine **diverges** — Namakarana
calls the fixed signs best and ear-boring avoids three of them; Ch. XX puts
Saturday among the best days where every samskara chapter avoids it. These three
instead agree, twice over and across seventy printed pages:

| | Ch. VI (p.42) | Ch. VIII (p.55) | Ch. XI (p.65) |
|---|---|---|---|
| **Signs** | common fruitful, movable neutral, fixed **totally avoided** | common best, movable middling, fixed **bad** | common auspicious, movable neutral, fixed **not to be considered** |
| **Weekdays** | Wed/Thu/Fri good, Sun/Mon pretty favourable, Tue/Sat bad | avoid Sat/Tue; effect table grades all seven | Wed/Thu/Fri good, Sun/Mon neutral, Sat/Tue avoid |
| **Star tiers** | 9 favourable, remainder avoided | 10 fruitful, 6 neutral, remainder avoided | 11 favourable, 6 neutral, remainder avoided |

Two chapters agreeing would be a coincidence worth noting; three agreeing is a
subject-level doctrine. **Kept as three activities, not merged into one**, so the
agreement stays visible as evidence rather than being flattened into an
assumption. Pinned by `test_the_three_learning_chapters_state_one_sign_doctrine`.

A second cross-check falls out of it: Ch. VIII and Ch. XI name the **identical**
six-star neutral tier, and Ch. XI's favourable list is Ch. VIII's ten plus
Anuradha, exactly. Two transcriptions twelve pages apart corroborating each
other. Pinned by `test_ch8_and_ch11_agree_on_their_neutral_star_tier`.

Note the sign doctrine here is the **inverse** of Namakarana (Ch. III p.31),
which calls the fixed signs best. Per-activity, never global.

---

## Scope decisions

**1. `EXAM` was left alone.** The picker already offers `EXAM` ("Exam / Course
start") on the generic almanac layer. Ch. VIII governs *commencing education*,
which is not the same act as sitting an exam, so `EDUCATION_START` was added as
its own activity rather than silently re-scoring an existing one on doctrine
that does not quite fit it.

**2. Per-subject star lists are recorded, not wired.** Ch. VIII p.54 gives five
separate lists — grammar, logic, astrology/Vedangas, all Sastras, and
Ayur-Veda/Dhanur-Veda. The picker asks for a day, not a subject. Merging five
lists into one would erase the distinction the chapter drew; they are held in
`EDUCATION_SUBJECT_NAKSHATRA` for a future "what are you studying?" input.

**3. The weekday effect table is recorded, not scored.** Ch. VIII p.54 says
"Monday makes the student dull" and "Sunday prolongs life", but its own
instruction sentence names only Saturday and Tuesday to avoid. Scoring off the
effect table would be our inference, not the chapter's rule. Held in
`EDUCATION_VARA_EFFECTS`. p.55 then carries a dissent against its own Sunday
reading, which is a further reason not to score it.

**4. Attributed dissents are never applied.** Ch. VIII p.53 and Ch. XI p.65 both
promote Aswini out of the neutral tier on "some writers"; Ch. VI p.42 rejects
Sunday on "some astrologers". Each is recorded in a constant and left out of the
scored sets. Letting a dissent outrank the sentence it dissents from would
invert the chapter's own ranking.

---

## Rule tables

### Vidyarambham (Ch. VI, pp.41–42)

| rule_id | Factor | Encoded | Page | Grade |
|---|---|---|---|---|
| `KP_CH6_VIDYARAMBHAM_NAKSHATRA_001` | Nakshatra | 9 favourable; **list closed** | 41 | Bonus / exclusion penalty |
| `KP_CH6_VIDYARAMBHAM_TITHI_001` | Tithi | Avoid 1,4,6,8,9,14 + FM + NM; remainder good | 41 | Penalty |
| `KP_CH6_VIDYARAMBHAM_VARA_001` | Vara | Good Wed/Thu/Fri; avoid Tue/Sat; Sun/Mon middling | 42 | Penalty |
| `KP_CH6_VIDYARAMBHAM_LAGNA_001` | Lagna | Common best, movable middling, fixed avoided | 42 | Penalty |
| `KP_CH6_VIDYARAMBHAM_KARANA_001` | Karana | Sthira four + Vishti | 42 | Veto-class at the moment |
| `KP_CH6_VIDYARAMBHAM_TIMING_001` | Year / ayana | 5th year, Utharayana less Aquarius, before Upanayanam | 41 | **Not implemented** |

**Internal tension, recorded not reconciled.** p.41's first sentence calls the
dark fortnight's opening five good — Prathamai among them — and its second bans
Prathamai outright. The tithi ban is the more specific statement and wins, so the
encoded paksha exemption runs **2–5** and omits Prathamai, leaving the two rules
unable to contradict each other on any real day. Pinned by
`test_vidyarambham_paksha_exemption_cannot_contradict_its_tithi_ban`.

### Starting education (Ch. VIII, pp.53–57)

| rule_id | Factor | Encoded | Page | Grade |
|---|---|---|---|---|
| `KP_CH8_EDUCATION_NAKSHATRA_001` | Nakshatra | 10 fruitful, 6 neutral, remaining 11 excluded | 53 | Bonus / neutral / exclusion penalty |
| `KP_CH8_EDUCATION_TITHI_001` | Tithi | Best 1,2,3,5,6,10,11; avoid 4,8,9,14 + FM + NM | 54 | Penalty |
| `KP_CH8_EDUCATION_VARA_001` | Vara | Good Wed/Thu/Fri; avoid Sat/Tue | 54 | Penalty |
| `KP_CH8_EDUCATION_LAGNA_001` | Lagna | Common best, movable middling, fixed bad | 55 | Penalty |
| `KP_CH8_EDUCATION_SUBJECT_001` | Nakshatra | 5 per-subject lists | 54 | **Not wired** — scope decision 2 |
| `KP_CH8_EDUCATION_YOGA_001` | Yoga | Saaraswatha (10 forms), Vidhya-Yoga (4) | 55–57 | **Not implemented** |

**Known narrowing.** p.54 qualifies Prathamai as "of the dark half of the lunar
month". The registry's tithi shape is paksha-agnostic, so a bright-fortnight
Prathamai is currently credited slightly wider than the text allows. Recorded in
`EDUCATION_TITHI_PRATHAMAI_IS_KRISHNA_ONLY` and declared in the activity's
`unscored_dimensions`.

### Beginning Veda study (Ch. XI, pp.65–67)

| rule_id | Factor | Encoded | Page | Grade |
|---|---|---|---|---|
| `KP_CH11_VEDA_STUDY_NAKSHATRA_001` | Nakshatra | 11 favourable, 6 neutral, remaining 10 excluded | 65 | Bonus / neutral / exclusion penalty |
| `KP_CH11_VEDA_STUDY_TITHI_001` | Tithi | Avoid 1,4,8,9,12 + FM + NM; 7 and 13 neutral; rest excellent | 65 | Penalty |
| `KP_CH11_VEDA_STUDY_VARA_001` | Vara | Good Wed/Thu/Fri; avoid Sat/Tue; Sun/Mon neutral | 65 | Penalty |
| `KP_CH11_VEDA_STUDY_LAGNA_001` | Lagna | Common auspicious, movable neutral, fixed rejected | 65 | Penalty |
| `KP_CH11_VEDA_STUDY_PRADHOSHAM_001` | Tithi transition | 4th/7th/13th running past a point of the night | 66 | **Not implemented** |

**Pradhosham is the one reachable sub-day rule.** Unlike nakshatra-sandhi, the
snapshot already carries `tithi_ends_at`; what is missing is a ghatika-to-clock
conversion against local nightfall. That is a window-layer change and out of this
pass, but it does not need a new input.

---

## Deliberately not implemented

| Rules | Why |
|---|---|
| Year-from-birth and Utharayana requirements (Ch. VI p.41) | No birth date, ayana or solar-month field |
| `KP_CH8_EDUCATION_SUBJECT_001` | The picker asks for a day, not a subject |
| `EDUCATION_VARA_EFFECTS`, `NEW_CLOTHES`-style effect tables | Display copy; scoring them would double-count the sentence that already set the rule |
| `KP_CH8_EDUCATION_YOGA_001` | Every form needs moment vargas, houses or exact degrees |
| `KP_CH11_VEDA_STUDY_PRADHOSHAM_001` | Needs ghatika-to-clock against nightfall (window layer) |
| Ch. XI p.67 Munvadhi / Yugadhi / Sankramana days | Calendar layer, not the day scorer |
| Ch. XI p.66 omen rules (a hare or a Chandala passing between teacher and pupil) | Not answerable from any chart |
| The middling **weekday** tier (Sun/Mon) in all three chapters | The engine has no middling weekday rung; they score neutral, which is the same outcome |
| The middling **tithi** tier (Ch. XI's 7th and 13th) | Same — no rung; they fall through to unnamed-neutral |
