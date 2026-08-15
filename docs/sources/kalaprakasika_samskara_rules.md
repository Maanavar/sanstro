# Kalaprakasika Ch. III & IV — Namakarana, Annaprasana, Karnavedha — extraction worksheet

**Source.** N. P. Subramania Iyer, *Kalaprakasika* (Asian Educational Services
reprint 1982 of the 1917 first edition):

* **Ch. III "ORNAMENTATION"**, printed pp. **29–35** — contains three separate
  rites, each with its own muhurta: *Namakaranam* (naming, pp.30–31),
  *To feed on milk* (p.32), and *To feed on rice* = **Annaprasana** (pp.33–35).
* **Ch. IV "EAR-BORING"** = **Karnavedha**, printed pp. **35–36**.

Extracted 2026-08-15 from the page-by-page transcription of the 150-page scan
supplied by the repository owner. PDF page = printed page + 32.

**Encoded in.** `app/data/kalaprakasika_samskara_rules.py`.

| Rite | Chapter | Pages | Activity key |
|---|---|---|---|
| Namakaranam (naming) | III | 30–31 | `NAMING_CEREMONY` |
| To feed on milk | III | 32 | `MILK_FEEDING` |
| Annaprasana (to feed on rice) | III | 33–35 | `ANNAPRASANA` |
| Karnavedha (ear-boring) | IV | 35–36 | `EAR_BORING` |

---

## Update 2026-08-15: the milk-feeding rite is now a full activity

`MILK_FEEDING` began life in this module as **two constants and no activity** —
recorded solely to prove which karana clause did *not* belong to Annaprasana (see
scope decision below). Re-reading p.32 for the Ch. XIX–XXII pass showed it states
a complete rule set of its own, so it is now extracted in full and exposed:

| Dimension | p.32 |
|---|---|
| stars | 17, not closed |
| tithi | avoid 4, 6, 8, 9, 14 and Amavasya — *"Avoid the following Thithis"*, graded a **veto** alongside Namakarana's identical form |
| karana | Sthira four + Vishti (the clause that was misattributed) |
| weekday | Mon/Wed/Thu/Fri; no adverse day named |
| lagna | **avoid** Aries, Scorpio, Pisces — plus "the sign occupied by the Sun" |

**The two feeding rites stay strictly separate.** Ardhra is the proof: it is
*forbidden* for the rice-feeding (p.34, with a stated consequence) and simply
absent here, while eleven of the seventeen milk stars are shared. Neither list is
derivable from the other.

**Two things on p.32 are recorded and not scored.**

1. *"the day of the 10th asterism from the Jenma-Nakshatra of the child will be
   good"* — the **10th tara**, Anu-Jenma, which six other chapters prohibit. This
   is the second of two independent passages in the book that reverse the
   janma-tara polarity; Ch. X p.62 calls the whole janma / Anu-Jenma / Thri-Jenma
   triad *"beneficial"*. Two chapters thirty printed pages apart agreeing on the
   reversal is much harder to read as a transcription slip than either would be
   alone. **Raised for the astrologer, not encoded.**
2. *"the sign occupied by the Sun (Atho-Mugha Rasi)"* is a fourth prohibited sign
   that moves through the year. Because of it, the nine signs the sentence calls
   favourable are **not** credited — crediting them would certify, for one month
   in twelve, a sign the sentence itself excludes.

---

## Scope decisions taken before extracting

1. **Three rites, three activities — never merged.** Naming, first-rice and
   ear-boring share a chapter neighbourhood and a life stage, and share nothing
   else. Their star lists differ (14 / 16 / 9 stars), their tithi rules differ
   (exclusion list / exclusion list / exhaustive inclusion list), and their
   lagna preferences are close to opposite (naming wants **fixed** signs;
   ear-boring says **avoid Leo, Scorpio and Aquarius**, three of the four fixed
   signs). A single "baby samskara" activity would have to pick one and discard
   two.

2. **"To feed on milk" (p.32) is a fourth rite and is NOT Annaprasana.**
   `docs/MUHURTA_ENGINE_AUTHORITATIVE_INPUTS_v2_2026-08-14.md` §karana states
   "Annaprasana avoids Sthira karana and Vishti". The primary text puts that
   karana clause in the **milk-feeding** paragraph (p.32: *"Avoid the following
   Thithis… as also Sthirakarana and Vishtikarana"*), not in the rice-feeding
   paragraphs (pp.33–35), which state **no karana rule at all**. This is the
   same class of error as the marriage 8th-vacancy finding — a rule real in one
   rite, imported into its neighbour. The karana rule is recorded here under
   `MILK_FEEDING` scope and is **not** applied to Annaprasana. Flagged for the
   astrologer.

3. **The `_SOURCED_NAKSHATRA_ACTIVITIES` lists were taken from the primary text,
   not re-typed from the existing doc.** The pre-existing summaries in
   `MUHURTA_ENGINE_AUTHORITATIVE_INPUTS_v2` §nakshatra were checked against the
   transcription afterwards and all three star lists matched exactly; the tithi
   claims matched too. Where the doc and the text differ (item 2 above), the
   text wins and the divergence is reported rather than silently corrected.

---

## Rule table — Namakarana (naming), Ch. III pp. 30–31

| Rule ID | Activity | Rule Dimension | Condition | Effect | Page | Source Text | Normalized Rule | Confidence / Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `KP_CH3_NAMING_NAKSHATRA_001` | Namakarana | Nakshatra | Moon in one of 14 named stars | **Preferred** ("are good") | 30 | "The following asterisms are good:—Aswini, Rohini, Mrigasirsha, Ardhra, Punarvasu, Pushya, Utharapalguni, Hastha, Swathi, Anuradha, Sravana, Sravishta, Sathabis and Revathi." | Ashwini(1), Rohini(4), Mrigashira(5), Ardra(6), Punarvasu(7), Pushya(8), U.Phalguni(12), Hasta(13), Swati(15), Anuradha(17), Shravana(22), Dhanishta(23), Shatabhisha(24), Revati(27). | CONFIRMED_EXACT. **Not exhaustive** — no "the remaining should be avoided" clause. Preferential. Note **Ardra is included** despite being a Tikshna star: a nature-class rejection rule would wrongly drop it. |
| `KP_CH3_NAMING_TITHI_001` | Namakarana | Tithi | 4th, 6th, 8th, 9th, 12th or 14th of **either** paksha, or Purnima, or Amavasya | **Prohibited** | 30 | "The Thithis to be avoided are:—The 4th, 6th, 8th, 9th, 12th, and 14th of the bright and dark halves of the lunar month, the Full-Moon and the New-Moon days." | Avoid in-paksha 4, 6, 8, 9, 12, 14 in both pakshas; avoid Purnima (shukla 15) and Amavasya (tithi 30). | CONFIRMED_EXACT. Paksha-explicit ("of the bright **and** dark halves"), so unlike marriage there is no paksha ambiguity to preserve. |
| `KP_CH3_NAMING_VARA_001` | Namakarana | Vara / weekday | Monday, Wednesday, Thursday, Friday | **Preferred**; **all other days prohibited** | 30 | "Monday, Wednesday, Thursday and Friday are good, as also the Amsa, the Lagna (rising sign), the Dhrekkana and Hora of Mercury, Jupiter, Venus and the Moon. **Other days should be avoided.**" | Good: Mon, Wed, Thu, Fri. Avoid: Sun, Tue, Sat. | CONFIRMED_EXACT. The "Other days should be avoided" clause makes this list **exhaustive** — unlike the Ch. XXI treasure weekday rule, which names no adverse day. That difference is preserved in the encoding. |
| `KP_CH3_NAMING_LAGNA_001` | Namakarana | Lagna sign | Fixed signs rising | **Preferred** ("the best"); common signs acceptable **conditionally** | 31 | "Fixed signs (Taurus, Leo, Scorpio and Aquarius) are considered the best. Common signs (Gemini, Virgo, Sagittari and Pisces) are also approved, when occupied by a benefic." | Best: Taurus(2), Leo(5), Scorpio(8), Aquarius(11). Conditional: Gemini(3), Virgo(6), Sagittarius(9), Pisces(12) — **only when a benefic occupies them**. | CONFIRMED_WITH_CONDITION. Movable signs (Aries, Cancer, Libra, Capricorn) are **unstated**, not prohibited — they score neutral. The benefic-occupancy condition on common signs is **not evaluable** from a day snapshot, so common signs score neutral with the condition named, never credited as met. |
| `KP_CH3_NAMING_HOUSE_8_001` | Namakarana | Planetary / house occupancy | Any planet in the 8th from the rising sign | **Prohibited** | 30 | "The 8th house, from the rising sign, at the time, should be unoccupied." | 8th-house vacancy required. | CONFIRMED_EXACT. This is the rule Ch. XIV explicitly refuses for marriage — its genuine home is here, in ear-boring, and in the pre-marriage Snaana rite. Not implemented (no moment-chart input). |
| `KP_CH3_NAMING_KARANA_001` | Namakarana | Karana | Sakuna or Vishti | **Prohibited** | 30 | "Sakunam and Vishti Karanas should be avoided." | Sakuna, Vishti veto. The same page enumerates the eight tithi-halves that constitute Vishti. | CONFIRMED_EXACT. Implemented from `PanchangamSnapshot` karana fields; daily-transition scope is documented in the activity registry. |
| `KP_CH3_NAMING_DAYPART_001` | Namakarana | Time of day | Forenoon | **Required** | 31 | "The ceremony should be performed during the fore-noon of the day and not at any other time." | Forenoon only. | CONFIRMED_EXACT. Stated as a requirement, not a preference. Not implemented — the picker's window selection is driven by hora ∩ Gowri kala; constraining it to the forenoon is a window-layer change, deliberately out of this pass. |
| `KP_CH3_NAMING_DAY_COUNT_001` | Namakarana | Calendar (days from birth) | 10th, 12th or 16th day from birth; else any auspicious day after the 16th | **Preferred / conditional** | 30 | "The appropriate day for this function is the 10th, 12th or 16th day of the child's birth. Failing to perform it on any of these days, an auspicious day, say the Vedas, should be chosen for the purpose—after the 16th day of the child's birth." | Day 10, 12 or 16 from birth preferred; otherwise any auspicious day after day 16. | CONFIRMED_EXACT. Not implemented — the picker takes no birth date for the child. |
| `KP_CH3_NAMING_YOGA_001` | Namakarana | Combination / yoga | Jupiter in a kendra or trikona, a malefic in the 11th, Mercury in a kendra in a benefic navamsa | **Ranking bonus** (strong) | 31 | "Jupiter must occupy quadrant (Kendra) or Trine (Thrikona) from the rising sign, at the time of christening; a malefic must occupy the 11th house, with Mercury in a quadrant occupying a benefic Navamsa—this is considered a very fortunate time for celebrating the christening festival." | Named auspicious configuration. | CONFIRMED_EXACT. Not implemented (moment chart). |
| `KP_CH3_NAMING_YOGA_002` | Namakarana | Combination / yoga | Shukla paksha, 11th occupied by Venus or a malefic, Jupiter or Moon in kendras | **Ranking bonus** | 31 | "Another auspicious time is during the bright fortnight (Sukla Paksha) when the 11th house from the rising sign, at the time, is occupied by either Venus or a malefic, Jupiter or Moon occupying the quadrants (Kendras). This will produce wealth, contentment and prosperity." | Second named yoga. | CONFIRMED_EXACT. Not implemented. |
| `KP_CH3_NAMING_YOGA_003` | Namakarana | Combination / yoga | Lagna is a benefic's own sign, malefic in 3rd, Venus in 12th, Moon dignified | **Ranking bonus** | 31 | "Yet another auspicious time is that when the rising sign, at the time, is the house of a benefic with a malefic in the 3rd and Venus in the 12th house, the Moon being dignified." | Third named yoga. | CONFIRMED_EXACT. Not implemented. |

---

## Rule table — Annaprasana (first feeding on rice), Ch. III pp. 33–35

| Rule ID | Activity | Rule Dimension | Condition | Effect | Page | Source Text | Normalized Rule | Confidence / Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `KP_CH3_ANNAPRASANA_NAKSHATRA_001` | Annaprasana | Nakshatra | Moon in one of 16 named stars | **Preferred** ("the most favourable") | 34 | "The following are the most favourable asterisms—Aswini, Rohini, Mrigasirsha, Punarvasu, Pushya, Utharapalguni, Hastha, Chithra, Swathi, Anuradha, Utharashada, Sravana, Sravishta, Sathabis, Utharabadhrapada and Revathi." | Ashwini(1), Rohini(4), Mrigashira(5), Punarvasu(7), Pushya(8), U.Phalguni(12), Hasta(13), Chitra(14), Swati(15), Anuradha(17), U.Ashadha(21), Shravana(22), Dhanishta(23), Shatabhisha(24), U.Bhadrapada(26), Revati(27). | CONFIRMED_EXACT. **Ardra is absent here but present in the naming list** — the two rites disagree about Ardra, which is exactly why they are not merged. |
| `KP_CH3_ANNAPRASANA_NAKSHATRA_002` | Annaprasana | Nakshatra | Moon in Ardra, Krittika, Jyeshtha, Bharani, Ashlesha, P.Phalguni, P.Ashadha or P.Bhadrapada | **Prohibited** | 34 | "The asterisms Ardhra, Krithika, Jyeshta, Barani, Aslesha, Purvapalguni, Purvashada, Purvabadrapada will cause misery, thoughtlessness and fear and so one should not start any function of feeding on those days." | Prohibited: Ardra(6), Krittika(3), Jyeshtha(18), Bharani(2), Ashlesha(9), P.Phalguni(11), P.Ashadha(20), P.Bhadrapada(25). | CONFIRMED_EXACT. An **explicit prohibition**, not a mere absence from the good list — "one should **not** start any function of feeding on those days". This is the only samskara here with a named forbidden star set, and it is the strongest-graded nakshatra rule in this worksheet. |
| `KP_CH3_ANNAPRASANA_TITHI_001` | Annaprasana | Tithi | Shashthi, Ashtami, Navami, Chaturthi or Chaturdashi | **Prohibited** ("totally avoided") | 34 | "Shashti, Ashtami, Navami, Chathurthi, Chathurdasi—these Thithis should be totally avoided for this function." | Avoid in-paksha 4, 6, 8, 9, 14. | CONFIRMED_EXACT. Note this is the naming list **minus Dwadashi (12)** and **without** the Purnima/Amavasya ban. Two adjacent rites, two different tithi sets — preserved. |
| `KP_CH3_ANNAPRASANA_VARA_001` | Annaprasana | Vara / weekday | Monday, Wednesday, Thursday, Friday good; Sunday, Tuesday, Saturday unfavourable | **Preferred / prohibited** | 34 | "Monday, Wednesday, Thursday and Friday are good, as also the time when the rising Navamsa is that of the Moon, Mercury, Jupiter and Venus. Sunday, Tuesday and Saturday and the time when the rising Navamsa is that of the Sun, Mars or Saturn are unfavourable." | Good: Mon, Wed, Thu, Fri. Unfavourable: Sun, Tue, Sat. | CONFIRMED_EXACT. Both halves stated explicitly here (unlike naming, which reaches the same partition via "other days should be avoided"). |
| `KP_CH3_ANNAPRASANA_LAGNA_001` | Annaprasana | Lagna sign | Taurus, Aquarius, Libra, Virgo, Leo, Cancer, Capricorn, Gemini, Sagittarius rising | **Preferred** ("beneficent") | 34 | "Taurus, Aquarius, Libra, Virgo, Leo, Cancer, Capricorn, Gemini and Sagittari are beneficent signs." | Beneficent: Taurus(2), Gemini(3), Cancer(4), Leo(5), Virgo(6), Libra(7), Sagittarius(9), Capricorn(10), Aquarius(11). Unstated: Aries(1), Scorpio(8), Pisces(12). | CONFIRMED_EXACT. Nine signs are named beneficent; the remaining three are **not called adverse** — they score neutral, not a penalty. |
| `KP_CH3_ANNAPRASANA_JANMA_NAKSHATRA_001` | Annaprasana | Nakshatra (personal) | The day is ruled by the **child's own** janma nakshatra | **Prohibited** | 34 | "The child should not be fed (for the first time) on a day ruled by its asterism at birth, for this will shorten its life." | Veto the child's own birth star. | CONFIRMED_EXACT. **Personal-layer rule**: only evaluable when a subject is supplied. Implemented as a personal factor, and absent from general mode by design. |
| `KP_CH3_ANNAPRASANA_TARA_001` | Annaprasana | Nakshatra count from janma | 2nd, 4th, 6th, 8th, 10th, 11th, 13th, 15th, 17th, 19th from the birth star | **Preferred** | 34 | "The 2nd, 4th, 6th, 8th, 10th, 11th, 13th, 15th, 17th and 19th asterisms from the asterism, at birth, are favourable." | Favourable counts from janma nakshatra. | **TRANSLATION_AMBIGUOUS / OCR-uncertain.** The scan renders four of the ten ordinals as OCR noise ("and", "roth", "rth", "roth"). The reading above is the most plausible reconstruction but is **not** confidently legible. **Deliberately NOT implemented** — an invented tara list is exactly the failure mode this worksheet exists to prevent. Needs re-verification against a clean page image. |
| `KP_CH3_ANNAPRASANA_COMBUSTION_WAIVER_001` | Annaprasana | Planetary visibility | Jupiter or Venus combust (Asthangata) | **Explicit exception** — combustion waived | 35 | "The most important element in the matter of starting to feed a child is the month; and so it does not matter if Jupiter and Venus be 'Asthangatha' at the time." | Combustion does **not** disqualify Annaprasana; the month outranks it. | CONFIRMED_EXACT. This is the text's own proof that combustion rules are per-activity: marriage (Ch. XIV p.80) enforces combustion with specific day buffers, Annaprasana waives it outright. Not implemented as a scored factor (the engine has no combustion input), but recorded so nobody adds a global combustion veto. |
| `KP_CH3_ANNAPRASANA_HOUSE_001` | Annaprasana | Planetary / house occupancy | Mars in the 8th, Venus in the 7th, or Mercury in the 9th; 10th house occupied; any planet in the 6th | **Prohibited / adverse** | 34 | "The function should not be performed at a time when the 8th house from the rising sign is occupied by Mars, or the 7th house by Venus, or the 9th by Mercury. The 10th house from the rising sign at the time of feeding must be unoccupied. Planets in the 6th house, benefic or malefic, cause ill-feeling among relations." | Graha-specific 7th/8th/9th bans, 10th-house vacancy, 6th-house adverse. | CONFIRMED_EXACT. Note this rite requires the **10th** vacant, where naming and ear-boring require the **8th** — do not generalise "the Nth house must be empty" across rites. Not implemented (moment chart). |
| `KP_CH3_ANNAPRASANA_MONTH_001` | Annaprasana | Calendar (month from birth) | Son: 6th, else 8th/10th/12th solar month. Daughter: 7th, 9th or 11th (odd months) | **Preferred** | 33 | "Start feeding the son in the 6th month, failing which in the 8th, 10th or 12th solar month. In the case of a daughter, the function should take place in the 7th, 9th or 11th month—in odd months." | Sex-dependent month-from-birth preference. | CONFIRMED_EXACT. Not implemented — the picker takes no child birth date or sex. The chapter also calls the month "the most important element" (p.35), so this is the rite's *primary* rule and the engine currently cannot see it. Stated plainly rather than papered over. |
| `KP_CH3_MILK_FEEDING_KARANA_001` | **To feed on milk** (a different rite) | Karana + Tithi | Sthira karana or Vishti; tithis 4, 6, 8, 9, 14, Amavasya | **Prohibited** | 32 | "Avoid the following Thithis.—Chathurthi, Navami, Shasti, Ashtami, Chathurdhasi and New Moon as also Sthirakarana and Vishtikarana." | Milk-feeding rite's own tithi + karana bans. | CONFIRMED_EXACT **for the milk rite**. Recorded here specifically to document that the existing `MUHURTA_ENGINE_AUTHORITATIVE_INPUTS_v2` claim "*Annaprasana* avoids Sthira karana and Vishti" attributes this sentence to the wrong rite. `source_scope=MILK_FEEDING`; **must not** be promoted to Annaprasana. |

---

## Rule table — Karnavedha (ear-boring), Ch. IV pp. 35–36

| Rule ID | Activity | Rule Dimension | Condition | Effect | Page | Source Text | Normalized Rule | Confidence / Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `KP_CH4_EAR_BORING_NAKSHATRA_001` | Karnavedha | Nakshatra | Moon in one of 9 named stars | **Preferred** ("auspicious") | 36 | "The auspicious asterisms are:—Mrigasirsha, Ardhra, Punarvasu, Pushya, Hasta, Chithra, Sravana, Sravishta and Revathi." | Mrigashira(5), Ardra(6), Punarvasu(7), Pushya(8), Hasta(13), Chitra(14), Shravana(22), Dhanishta(23), Revati(27). | CONFIRMED_EXACT. The tightest of the three lists — nine stars. Not stated exhaustive. |
| `KP_CH4_EAR_BORING_TITHI_001` | Karnavedha | Tithi | 2, 3, 5, 6, 7, 10, 11, 12, 13 | **Preferred, and the list is exhaustive** | 36 | "Dwithiyai, Thrithiyai, Panchami, Shashti, Sapthami, Dhasami, Ekadesi, Dwadesi and Thrayodasi are favourable. **Other Thithis are not to be considered.**" | Favourable in-paksha: 2, 3, 5, 6, 7, 10, 11, 12, 13. All others excluded. | CONFIRMED_EXACT. **The only exhaustive tithi rule in this worksheet** — "other Thithis are not to be considered" closes the set, so a tithi off this list is a genuine prohibition, not a mere absence. Contrast marriage, where Shashthi(6) is only *middling* and Dwadashi(12) likewise; here both are outright favourable. |
| `KP_CH4_EAR_BORING_VARA_001` | Karnavedha | Vara / weekday | Monday, Wednesday, Thursday, Friday good; Sunday, Tuesday, Saturday avoided | **Preferred / prohibited** | 36 | "Monday, Wednesday, Thursday and Friday and the time when the rising Navamsa is that of the Moon, Mercury, Jupiter or Venus are good. Avoid Sunday, Tuesday and Saturday and the Virgas of the Sun, Mars and Saturn." | Good: Mon, Wed, Thu, Fri. Avoid: Sun, Tue, Sat. | CONFIRMED_EXACT. |
| `KP_CH4_EAR_BORING_LAGNA_001` | Karnavedha | Lagna sign | Taurus, Gemini, Cancer, Virgo, Libra, Sagittarius, Pisces best; Aries and Capricorn middling; Leo, Scorpio, Aquarius avoided | **Preferred / middling / prohibited** — all twelve signs graded | 36 | "Taurus Gemini, Cancer, Virgo, Libra, Sagittari and Pisces are considered the best signs. Aries and Capricorn are of middling quality. Leo, Scorpio and Aquarius should be avoided." | Best: Taurus(2), Gemini(3), Cancer(4), Virgo(6), Libra(7), Sagittarius(9), Pisces(12). Middling: Aries(1), Capricorn(10). Avoid: Leo(5), Scorpio(8), Aquarius(11). | CONFIRMED_EXACT. A **complete partition of all twelve signs**, like the marriage lagna rule. Note it avoids three of the four fixed signs, where Namakarana calls the fixed signs *best* — the clearest single reason these two rites cannot share an activity. |
| `KP_CH4_EAR_BORING_HOUSE_8_001` | Karnavedha | Planetary / house occupancy | Any planet in the 8th; Venus in the 6th or 8th; Mercury in the 8th | **Prohibited** | 36 | "The 8th house from the rising sign, at the time, should be unoccupied. Venus must not occupy the 6th house or the 8th. Mercury should not be in the 8th house." | 8th vacancy + explicit Venus/Mercury bans. | CONFIRMED_EXACT. Not implemented (moment chart). |
| `KP_CH4_EAR_BORING_SANDHI_001` | Karnavedha | Nakshatra junction | Nakshatra-sandhi (the junction between one star ending and the next beginning) | **Prohibited** | 35 | "'Nakshatra-Sandhi'—the time between the ending moments of one asterism and the beginning of its next—is inauspicious." | Avoid the star-junction moment. | CONFIRMED_EXACT. Not implemented — needs sub-day nakshatra transition timing at the candidate minute, which the day-level scorer does not model. |
| `KP_CH4_EAR_BORING_DUAL_RULER_001` | Karnavedha | Nakshatra / Tithi | A day ruled by **two** asterisms or **two** tithis | **Prohibited** | 36 | "A day ruled by two asterisms or by two Thithis is bad. If this rule be not observed, the subject will be exposed to the risk of having his ears hurt." | Avoid days carrying a star change or a tithi change. | CONFIRMED_EXACT. Not implemented — same sub-day transition modelling gap as `_SANDHI_001`. |
| `KP_CH4_EAR_BORING_DAYPART_001` | Karnavedha | Time of day | Forenoon best, noon fairly favourable; afternoon, evening, twilight inauspicious | **Preferred / prohibited** | 36 | "The forenoon is the best time; noon is pretty favourable; afternoon, evening and the twilight time are inauspicious." | Forenoon > noon > (afternoon/evening/twilight prohibited). | CONFIRMED_EXACT. Not implemented (window-layer change, out of this pass). |
| `KP_CH4_EAR_BORING_DAY_COUNT_001` | Karnavedha | Calendar (from birth) | 12th or 16th day from birth, or the 6th, 7th, 8th or 10th month | **Preferred** | 35 | "This function should be performed on the 12th or the 16th day of the birth of the child or in the 6th, 7th, 8th or the 10th month." | Day 12 or 16, or month 6/7/8/10. | CONFIRMED_EXACT. Not implemented (no child birth date). |

---

## Cross-rite comparison (the reason these stay three activities)

| Dimension | Namakarana (Ch. III) | Annaprasana (Ch. III) | Karnavedha (Ch. IV) |
| --- | --- | --- | --- |
| Best nakshatras | 14 | 16 | 9 |
| Ardra | **included** | **explicitly prohibited** | **included** |
| Chitra | absent | included | included |
| Forbidden nakshatras | none stated | **8 named** | none stated |
| Tithi rule shape | exclusion list (6 + Purnima + Amavasya) | exclusion list (5) | **exhaustive inclusion list (9)** |
| Dwadashi (12) | prohibited | permitted | **favourable** |
| Fixed signs | **best** | Leo/Aquarius good, Taurus good, Scorpio absent | **Leo/Scorpio/Aquarius avoided** |
| House vacancy required | 8th | **10th** | 8th |
| Combustion | not addressed | **explicitly waived** | not addressed |

Nine of those ten rows differ. Merging them would be a doctrine change, not a
simplification.

---

## Deliberately **not** implemented

| Rule ID | Reason |
| --- | --- |
| `KP_CH3_ANNAPRASANA_TARA_001` | **Source legibility.** Four of ten ordinals are OCR noise. Reconstructing them would be inventing a tara list. |
| `KP_CH3_NAMING_HOUSE_8_001`, `KP_CH4_EAR_BORING_HOUSE_8_001`, `KP_CH3_ANNAPRASANA_HOUSE_001` | No muhurta-moment house-occupancy input |
| `KP_CH3_MILK_FEEDING_JANMA_TARA_001` | p.32 offers the **10th tara** from the child's birth star as the fallback good day — a count six other chapters prohibit. Recorded, not scored, and raised for the astrologer; Ch. X p.62 states the same reversal independently |
| `KP_CH3_MILK_FEEDING_LAGNA_001` (partly) | The three prohibited signs **are** scored. The nine the sentence calls favourable are not, because the same sentence disqualifies whichever sign the Sun occupies, and a sunrise lagna cannot say which |
| `KP_CH3_NAMING_YOGA_001/002/003` | Moment-chart graha placement |
| `KP_CH4_EAR_BORING_SANDHI_001`, `KP_CH4_EAR_BORING_DUAL_RULER_001` | Sub-day nakshatra/tithi transition modelling |
| `KP_CH3_NAMING_DAYPART_001`, `KP_CH4_EAR_BORING_DAYPART_001` | The recommended window comes from the hora ∩ Gowri-kala layer; adding a day-part constraint is a window-layer change |
| `KP_CH3_NAMING_DAY_COUNT_001`, `KP_CH3_ANNAPRASANA_MONTH_001`, `KP_CH4_EAR_BORING_DAY_COUNT_001` | The picker takes no child birth date or sex |
| `KP_CH3_ANNAPRASANA_COMBUSTION_WAIVER_001` | No combustion input; recorded so no global combustion veto is ever added over it |
