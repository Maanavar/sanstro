# Kalaprakasika Ch. XXIII & XXIV — new clothes, new ornament — extraction worksheet

**Source.** N. P. Subramania Iyer, *Kalaprakasika* (Asian Educational Services
1982 reprint of the 1917 first edition), printed pages **115–118**. Extracted
2026-08-15 from the page-by-page transcription of the 150-page scan. PDF page =
printed page + 32.

**Code.** `app/data/kalaprakasika_adornment_rules.py`.

| Activity | Chapter | Pages | Activity key |
|---|---|---|---|
| Putting on new clothes | XXIII | 115–117 | `NEW_CLOTHES` |
| Wearing a new gold ornament | XXIV | 117–118 | `NEW_ORNAMENT` |

---

## Why these two earn their place

Unlike a naming ceremony or a thread-marriage, these are elections an ordinary
user makes several times a year and already asks about — new clothes at
Puthandu, Deepavali and Pongal; gold at Akshaya Tritiya. They are also the only
two activities in the extracted doctrine that come with a **per-nakshatra effect
for all 27 stars**, which is copy a UI can show for *any* day of the year rather
than only for the days that score well.

---

## The sharpest tithi reversal in the doctrine

**Ch. XXIV p.117 makes the Full Moon a *best* tithi.**

Purnima is banned by Namakarana (Ch. III p.30), tonsure (Ch. V p.39), Upanayanam
(Ch. VII p.45), Vidyarambham (Ch. VI p.41) and Veda study (Ch. XI p.65), and
excluded from the Ch. XXI treasure rule (p.109). This chapter puts it among the
six best **and then closes the list** — "The other Thithis should be avoided" —
so the reversal cannot be read as an oversight. The chapter had to consider what
it was including.

Encoded as printed. Pinned by
`test_the_new_ornament_tithi_rule_reverses_the_purnima_ban`, which also asserts
the five chapters that ban it still do, so a "fix" toward consistency fails
loudly.

This is also only the **second exhaustive tithi list** in the sourced doctrine,
after ear-boring (Ch. IV p.36). That set is asserted exactly by
`test_only_two_chapters_close_their_tithi_list` — a third activity acquiring
`tithi_exhaustive` silently would turn unlisted tithis into prohibited ones
across a whole chapter.

---

## Rule tables

### New clothes (Ch. XXIII, pp.115–117)

| rule_id | Factor | Encoded | Page | Grade |
|---|---|---|---|---|
| `KP_CH23_NEW_CLOTHES_NAKSHATRA_001` | Nakshatra | 14 best; **list closed** | 115 | Bonus / exclusion penalty |
| `KP_CH23_NEW_CLOTHES_STAR_EFFECTS_001` | Nakshatra effect | All 27 stars | 115–116 | **Display copy, not scored** |
| `KP_CH23_NEW_CLOTHES_TITHI_001` | Tithi | Best 2,3,5,7,10,11,13; avoid 4,9,14 + NM; rest medium | 116 | Penalty |
| `KP_CH23_NEW_CLOTHES_VARA_001` | Vara | Good Wed/Thu/Fri; avoid Tue/Sat; Sun/Mon middling | 116 | Penalty |
| `KP_CH23_NEW_CLOTHES_LAGNA_001` | Lagna | Avoid Ar,Le,Sc,Sg,Aq,Pi; other six felicitous | 116 | Penalty |

**Two internal consistency checks that pass.**

1. The per-star effect table corroborates the 14-star split: every star the
   chapter grades adverse is off the list, and none of the 14 is given an
   adverse effect.
2. "The remaining two days should be avoided" resolves to Tuesday and Saturday
   by arithmetic the sentence itself supplies — and the per-day effect table on
   the same page names exactly those two as adverse.

**Why the effect table is not scored.** It is the same sentence that already
decided the star list; scoring it too would double-count one passage. Held in
`NEW_CLOTHES_STAR_EFFECTS_EN` so a UI can answer "what does today bring?" for
the thirteen days the list rejects as well as the fourteen it accepts.

**One softening recorded.** pp.116–117 call Capricorn "but common influence" in
the per-sign gloss while the rule sentence lists it among the felicitous. The
rule is scored; the gloss is held in
`NEW_CLOTHES_LAGNA_CAPRICORN_IS_COMMON_ONLY`.

### New ornament (Ch. XXIV, pp.117–118)

| rule_id | Factor | Encoded | Page | Grade |
|---|---|---|---|---|
| `KP_CH24_NEW_ORNAMENT_NAKSHATRA_001` | Nakshatra | 15 fruitful; list open | 117 | Bonus |
| `KP_CH24_NEW_ORNAMENT_TITHI_001` | Tithi | Best 1,5,6,10,11 + **Full Moon**; **list closed** | 117 | Penalty |
| `KP_CH24_NEW_ORNAMENT_VARA_001` | Vara | Good Mon/Wed/Thu/Fri; avoid Sun/Tue/Sat | 117 | Penalty |
| `KP_CH24_NEW_ORNAMENT_LAGNA_001` | Lagna | Best Ta,Ge,Vi,Sg,Pi; none stated adverse | 117 | Bonus only |
| `KP_CH24_NEW_ORNAMENT_YOGA_001` | Yoga | Several named configurations | 118 | **Not implemented** |
| `KP_CH24_NEW_ORNAMENT_NITYA_YOGA_001` | Nitya yoga | Siddha, Amritha called good | 117 | **Not implemented** |

**A third gold direction.** Ch. XXI already separates *acquiring/storing* gold
(pp.109–111) from *parting with* it (p.112). Wearing is a third transaction and
gets its own star list here. The same direction-sensitivity, one chapter apart.

**Weekday divergence with its own neighbour.** Ch. XXIII (p.116) drops Monday to
middling and keeps only Wed/Thu/Fri; Ch. XXIV (p.117) restores the standard
benefic four. Two adjacent chapters on adjacent subjects, two weekday sets —
preserved, not harmonised.

---

## Deliberately not implemented

| Rules | Why |
|---|---|
| `KP_CH23_NEW_CLOTHES_STAR_EFFECTS_001` | Display copy; scoring it double-counts the sentence that already set the star list |
| `KP_CH24_NEW_ORNAMENT_YOGA_001` | Moment chart, navamsa, and the Amirthaghatika interval |
| `KP_CH24_NEW_ORNAMENT_NITYA_YOGA_001` | The engine reports the day's nitya yoga as an explicitly ungraded neutral for every activity; crediting it for one would be a generic-layer change |
| Sun/Mon middling tier (Ch. XXIII) | No middling weekday rung; they score neutral, the same outcome |
| Capricorn's softer gloss (Ch. XXIII) | The rule sentence puts it in the felicitous set; the gloss is recorded |
| 8th-house vacancy, upachaya malefics, angular benefics (Ch. XXIV p.117) | No muhurta-moment house occupancy |
| The Saturday-plus-Rohini pairing tying making the jewel to wearing it (p.118) | Needs the Amirthaghatika interval and a recurring-slot search |
