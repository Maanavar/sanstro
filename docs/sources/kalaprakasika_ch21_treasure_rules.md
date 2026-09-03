# Kalaprakasika Ch. XXI — "To Lay Up Treasure" — extraction worksheet

**Source.** N. P. Subramania Iyer, *Kalaprakasika* (Asian Educational Services
reprint 1982 of the 1917 first edition), Chapter XXI "TO LAY UP TREASURE",
printed pages **109–113**. Extracted 2026-08-15 from the page-by-page
transcription of the 150-page scan supplied by the repository owner.

**Page numbering.** The `Page` column is the **printed book page**, matching the
convention already used by `app/data/marriage_muhurta_rules.py` (Ch. XIV, pp.
68–87). For verification against the scan, PDF page = printed page + 32
(printed 109 → PDF 141, printed 113 → PDF 145).

**Encoded in.** `app/data/kalaprakasika_treasure_rules.py`. Every row below has
a matching `RuleSource` record in that module's `RULE_SOURCES`, keyed by the
same Rule ID.

---

## Scope decisions taken before extracting

These are recorded because each one was a place where a plausible-looking
generalisation would have invented doctrine.

1. **The chapter's opening tithi + nakshatra lists govern the chapter.** The
   chapter opens (p.109) with an unqualified "To lay up treasure, all Thithis
   except Rikthai, Full-Moon and New-Moon are auspicious" and an 11-star "best"
   list. p.111 then says explicitly, of gold/silver/copper/brass/iron/pearl/
   coral/emerald/diamond, "choose favourable asterisms **from the list given
   above in this chapter**" — the text itself points the sub-topics back at the
   chapter list. That back-reference is what licenses applying the chapter list
   to gold and gems. It is **not** repeated for grain, so grain's use of the
   chapter list is recorded as `PARTIAL` (chapter-scope inheritance), not as an
   exact per-activity statement.

2. **Land-possession and land-purchase are different rules and stay apart.**
   "To take possession of land" (pp.111–112) gives a Cancer lagna + specific
   pada rule, a Sun+Ketu rule, and its own 14-star list. "To Buy Land and
   Cattle" (p.112) gives an entirely different device — a weekday list with the
   day-lord required in the rising sign. Nothing in the chapter says the
   possession star list also governs buying. They are encoded as two activities
   (`LAND_POSSESSION`, `LAND_PURCHASE`) and the star list is **not** promoted to
   the purchase scope.

3. **Grain's real chapter is XX, not XXI.** Ch. XX ("Harvest", pp.105–109)
   carries the substantive grain rules — in-gathering star lists, the
   Dhanya-Parvatha / Dhanya-Meru / Dhanyarnava yogas, and "Expenditure of Corn".
   Ch. XXI mentions grain only inside the combined "gold, grain and gems"
   Saturn-in-lagna sentence (p.110). Ch. XX was **not** extracted in this pass
   and grain is therefore deliberately thin here. See "Deliberately not
   implemented" below.

4. **Selling is not buying.** p.112 says six stars are good "**only** for buying
   cattle; not for selling which will end in loss", and p.113 gives a separate
   buy-**or**-sell list for cows. The direction of the transaction is
   load-bearing in the text and is preserved.

5. **"Chara/Sthira/Mrudhu/…" are a nakshatra classification table, not rules.**
   pp.112–113 define seven nature-classes (Sadharana, Vajra, Theekshana, Laghu,
   Mrudhu, Sthira, Chara). Only three of them are *used* by a rule in this
   chapter (the loan-on-pledge prohibition). The full table is transcribed
   because the loan rule is unreadable without it, but the unused classes carry
   no rule of their own here.

---

## Rule table

| Rule ID | Activity | Rule Dimension | Condition | Effect | Source Chapter | Page | Source Text | Normalized Rule | Confidence / Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `KP_CH21_TREASURE_TITHI_001` | Treasure (lay up) — governs gold, gems, grain by chapter scope | Tithi | Any tithi other than Rikta (4, 9, 14), Purnima, Amavasya | **Preferred** (all others auspicious); Rikta / Purnima / Amavasya **prohibited** | XXI | 109 | "To lay up treasure, all Thithis except Rikthai, Full-Moon and New-Moon are auspicious." | Avoid in-paksha 4, 9, 14; avoid Purnima (shukla 15) and Amavasya (tithi 30). Every other tithi is auspicious. | CONFIRMED_EXACT. Framed as an exclusion list, so the excluded set is exhaustive and the *rest* are positively auspicious — the inverse shape of the marriage tithi tiers. |
| `KP_CH21_TREASURE_NAKSHATRA_001` | Treasure (lay up) | Nakshatra | Moon in one of 11 named stars | **Preferred** ("the best") | XXI | 109 | "The following asterisms are the best:—Mrigasirsha, Ardhra, Pushya, Utharapalguni, Hastha, Anuradha, Utharashada, Sravana, Sravishta, Sathabis and Utharabadhrapadha." | Best: Mrigashira(5), Ardra(6), Pushya(8), U.Phalguni(12), Hasta(13), Anuradha(17), U.Ashadha(21), Shravana(22), Dhanishta(23), Shatabhisha(24), U.Bhadrapada(26). | CONFIRMED_EXACT. **Not** exhaustive — no "the remaining should be avoided" clause, unlike Ch. VIII/XI. Preferential only. |
| `KP_CH21_TREASURE_KARANA_001` | Treasure (lay up) | Karana | Sthira karana (Sakuna, Chatushpada, Naga, Kimstughna) or Vishti | **Prohibited** | XXI | 110 | "Sthira Karanas (Sakunam, Chathushpadham, Nagam and Kimsthughnam) and Vishti Karanas should be avoided." | Veto-class karana exclusion. | CONFIRMED_EXACT. Implemented from `PanchangamSnapshot` karana fields; daily-transition scope is documented in the activity registry. |
| `KP_CH21_TREASURE_VARA_001` | Treasure (lay up) | Vara / weekday | Monday, Wednesday, Thursday, Friday | **Preferred** | XXI | 110 | "Nitya Yoga, Monday, Wednesday, Thursday and Friday, and the Amsas and signs of the Moon, Mercury, Jupiter and Venus are favourable." | Favourable weekdays = Mon, Wed, Thu, Fri (lords Moon, Mercury, Jupiter, Venus). Also favours the amsas/signs of those four grahas. | CONFIRMED_EXACT for the weekday half. The sentence states no adverse weekdays, so the other three days are **unstated**, not prohibited — they score neutral, never a penalty. |
| `KP_CH21_TREASURE_LAGNA_001` | Treasure (lay up) | Lagna sign | Fixed signs rising | **Preferred**; common signs middling | XXI | 110 | "Fixed signs have beneficial influence; Common signs have middling influence." | Best: Taurus(2), Leo(5), Scorpio(8), Aquarius(11). Middling: Gemini(3), Virgo(6), Sagittarius(9), Pisces(12). | CONFIRMED_EXACT. Movable signs (Aries, Cancer, Libra, Capricorn) are **not mentioned here**. Ch. XX's parallel corn passage (p.109) *does* say "Movable signs should be left out of consideration", but that is a different activity and is **not** imported. Movable scores neutral-unstated. |
| `KP_CH21_TREASURE_HOUSE_8_001` | Treasure (lay up) | Planetary / house occupancy | Any planet in the 8th from the rising sign | **Prohibited** | XXI | 110 | "There should be no planet in the 8th house." | 8th-house vacancy required. | CONFIRMED_EXACT. Same device the text uses for Namakarana (Ch. III) and ear-boring (Ch. IV) — and which Ch. XIV explicitly *denies* for marriage. **Not implemented** — the engine has no muhurta-moment house-occupancy input. |
| `KP_CH21_TREASURE_BENEFIC_PLACEMENT_001` | Treasure (lay up) | Planetary | Malefics in 3rd/6th/11th, benefics in kendra/trikona | **Preferred** (bonus) | XXI | 110 | "Malefics in the 3rd, 6th and 11th houses, benefics in quadrants or trines bestow all prosperity." | Upachaya malefics + angular/trinal benefics = strong bonus. | CONFIRMED_EXACT. **Not implemented** — no muhurta-moment graha placement input. |
| `KP_CH21_GOLD_NAKSHATRA_001` | Gold & precious metals (acquire / store) | Nakshatra | Moon in one of the 11 chapter stars | **Preferred** | XXI | 111 | "To treasure gold, silver, copper, brass, iron, pearl, coral, emerald and diamond choose favourable asterisms from the list given above in this chapter." | Gold inherits `KP_CH21_TREASURE_NAKSHATRA_001` **by explicit textual back-reference**, not by our inference. | CONFIRMED_EXACT. This sentence is the licence for the chapter-scope inheritance; without it gold would have no star list of its own. |
| `KP_CH21_GOLD_YOGA_001` | Gold | Combination / yoga | Jupiter in Vargottama, Mercury and Venus in kendras | **Ranking bonus** (strong) | XXI | 110 | "Jupiter in Virgothama position with Mercury and Venus in quadrants is an extremely lucky planetary position for collecting and depositing gold. The store will then increase a millionfold." | Named auspicious yoga for gold. | CONFIRMED_EXACT. **Not implemented** — needs muhurta-moment vargas + house placement. Recorded verbatim for a later L6. |
| `KP_CH21_GOLD_YOGA_002` | Gold | Combination / yoga | Moon in her degree of main exaltation in the rising navamsa, Jupiter in the 7th | **Ranking bonus** (strong) | XXI | 110 | "Equally felicitous is the time when the rising Navamsa is occupied by the Moon in her main exaltation with Jupiter in the 7th house." | Second gold yoga, stated equal in force to `_001`. | CONFIRMED_EXACT. Not implemented (as above). Moon's main-exaltation degree is given elsewhere in the book as Taurus 3°. |
| `KP_CH21_GOLD_YOGA_003` | Gold, grain and gems (jointly) | Combination / yoga | Saturn occupying the rising sign | **Ranking bonus** | XXI | 110 | "A very fortunate planetary condition under which gold, grain and gems may be gathered and deposited is when the rising sign is occupied by Saturn. Jupiter located in the rising sign gives prosperity." | Saturn in lagna favours gathering+depositing gold, grain **and** gems jointly; Jupiter in lagna separately gives prosperity. | CONFIRMED_EXACT. This is the **only** sentence in Ch. XXI that names grain. Not implemented (no lagna-moment graha input). |
| `KP_CH21_GOLD_YOGA_004` | Treasure store (durability) | Combination / yoga | Jupiter in lagna, Venus in 2nd, Mercury in 11th, Moon in 10th | **Ranking bonus** (strong) | XXI | 110 | "Jupiter, in the rising sign, Venus in the 2nd, Mercury in the 11th and the Moon in the 10th house—this is the best planetary position which renders the store firm against failure." | Named "best" configuration for durability of the store. | CONFIRMED_EXACT. Not implemented. |
| `KP_CH21_SILVER_YOGA_001` | Silver (make / store silver ware) | Combination / yoga | Venus in the rising sign, on a Saturday, Moon in Rohini, Jupiter aspecting Aquarius | **Ranking bonus** | XXI | 111 | "For making and storing silver wares, the most felicitous time is that when the rising sign is occupied by Venus on a Saturday, when the Moon is in asterism Rohini (in her exaltation in Taurus), Jupiter aspecting Aquarius." | Silver-specific yoga. Editor's own footnote: "Evidently, the rising sign required by this rule is Aquarius." | CONFIRMED_WITH_CONDITION. The rising sign is **not stated in the rule itself** — the translator supplies "Aquarius" in a footnote as an inference. Recorded, flagged, and **not** implemented as a certainty. |
| `KP_CH21_SILVER_YOGA_002` | Silver | Combination / yoga | Venus in the rising sign in exaltation, Jupiter in 7th, Sun in 5th | **Ranking bonus** | XXI | 111 | "The silver wares will increase in quantity a hundredfold if, at the time of collecting them, the rising sign be governed by Venus, in exaltation, with Jupiter in the 7th and the Sun in the 5th house." | Second silver yoga. | CONFIRMED_EXACT. Not implemented. |
| `KP_CH21_METALS_YOGA_001` | Base metals (lead, bronze, iron) | Combination / yoga | Venus in the rising sign, Moon and Jupiter in the 10th | **Ranking bonus** | XXI | 111 | "To store lead, bronze and iron, Venus located in the rising sign, with the Moon, Jupiter in the 10th house, is a prosperous planetary position." | Base-metal storage yoga. | CONFIRMED_EXACT. Not implemented. |
| `KP_CH21_GEMS_NAKSHATRA_001` | Gems / jewels (treasure) | Nakshatra | Moon in one of the 11 chapter stars | **Preferred** | XXI | 111 | "To treasure gold, silver, copper, brass, iron, **pearl, coral, emerald and diamond** choose favourable asterisms from the list given above in this chapter." | Gems inherit the chapter star list by the same explicit back-reference as gold. | CONFIRMED_EXACT. Gems and gold share **one** sentence; they are kept as separate activities because their *yoga* rules differ (gold has three of its own, gems none). |
| `KP_CH21_GRAIN_NAKSHATRA_001` | Grain (store) | Nakshatra | Moon in one of the 11 chapter stars | **Preferred** | XXI | 109, 110 | Chapter-level list (p.109) + "gold, **grain** and gems may be gathered and deposited" (p.110). | Grain inherits the chapter star list by chapter scope. | **PARTIAL.** Unlike gold and gems, grain is never pointed back at the list by an explicit sentence. Inherited from the chapter heading + the p.110 co-mention only. Flagged in code; the substantive grain tables live in **Ch. XX, which was not extracted**. |
| `KP_CH21_LAND_NAKSHATRA_001` | Land — taking possession | Nakshatra | Moon in one of 14 named stars | **Preferred** ("the best") | XXI | 112 | "The best asterisms are:—Aswini, Rohini, Mrigasirsha, Punarvasu, Pushya, Utharapalguni, Hastha, Swathi, Anuradha, Utharashada, Sravana, Sravishta, Sathabis, and Utharabadhrapadha." | Best: Ashwini(1), Rohini(4), Mrigashira(5), Punarvasu(7), Pushya(8), U.Phalguni(12), Hasta(13), Swati(15), Anuradha(17), U.Ashadha(21), Shravana(22), Dhanishta(23), Shatabhisha(24), U.Bhadrapada(26). | CONFIRMED_EXACT, **scoped to taking possession**. Sits under the "TO TAKE POSSESSION OF LAND" heading and before the "To Buy Land and Cattle" sub-heading. Do **not** promote to land *purchase*. |
| `KP_CH21_LAND_TITHI_001` | Land — taking possession | Tithi | Rikta tithi | **Prohibited** | XXI | 112 | "Avoid Rikthai and Vishti Karana." | Avoid in-paksha 4, 9, 14. | CONFIRMED_EXACT. Note this repeats the chapter-opening Rikta ban but **does not** repeat the Purnima/Amavasya ban — so land-possession carries only the Rikta exclusion as its own stated rule. |
| `KP_CH21_LAND_KARANA_001` | Land — taking possession | Karana | Vishti karana | **Prohibited** | XXI | 112 | "Avoid Rikthai and Vishti Karana." | Vishti veto. | CONFIRMED_EXACT. Implemented from `PanchangamSnapshot` karana fields; daily-transition scope is documented in the activity registry. |
| `KP_CH21_LAND_LAGNA_001` | Land — taking possession of *contested* land | Lagna + Nakshatra pada | Cancer rising, and the **4th pada** of Bharani, Ardra, Vishakha or Hasta ruling | **Conditional** (specific rite) | XXI | 111 | "To gain possession of any land your right to which is contested, scoop out and carry away a handful of earth from that land, at a time when the rising sign is Cancer, when the fourth quarter of any of the asterisms, Bharani, Ardhra, Visakha, or Hastha rules." | Cancer lagna(4) + pada 4 of Bharani(2), Ardra(6), Vishakha(16), Hasta(13). | CONFIRMED_EXACT. **Narrowly scoped**: this is the rule for a *contested-title* earth-taking rite, not for land acquisition generally. Its four stars are **not** the same as `KP_CH21_LAND_NAKSHATRA_001` and must not be merged into it. Not implemented (needs pada + moment-lagna). |
| `KP_CH21_LAND_YOGA_001` | Land — taking possession | Combination / yoga | Sun and Ketu together in the rising sign **and** in its navamsa | **Ranking bonus** (strong) | XXI | 112 | "A very auspicious time for taking possession of a land is that when the rising sign and the Navamsa thereof are occupied by the Sun and Kethu—these two planets must be together in the rising sign as well as in the Navamsa Chakra, for the time. The land so obtained will permanently remain yours." | Sun+Ketu conjunct in both rasi and navamsa lagna. | CONFIRMED_EXACT. Not implemented. |
| `KP_CH21_LAND_VARA_001` | Land — **buying** | Vara / weekday | Monday, Tuesday, Wednesday or Saturday, **and** that day's lord occupying the rising sign at the moment of the transaction | **Preferred, conditional** | XXI | 112 | "To Buy Land and Cattle—Monday, Tuesday, Wednesday and Saturday are good. The lords of these days are the Moon, Mars, Mercury and Saturn respectively. The lord of the day, in question, should occupy the rising sign at the moment of the transaction." | Good weekdays = Mon, Tue, Wed, Sat. The day-lord-in-lagna clause is a *condition on* the weekday rule, not a separate rule. | CONFIRMED_WITH_CONDITION. Weekday half is implemented; the day-lord-in-lagna condition is **not** (no moment-lagna graha input) and the engine says so rather than crediting a half-met rule as met. Note this weekday set **differs** from the treasure weekday set (Tue and Sat here; Thu and Fri there) — a real per-activity divergence, preserved. |
| `KP_CH21_CATTLE_VARA_001` | Cattle — buying | Vara / weekday | Monday, Tuesday, Wednesday or Saturday, day-lord in the rising sign | **Preferred, conditional** | XXI | 112 | "To Buy Land and Cattle—Monday, Tuesday, Wednesday and Saturday are good…" | Same sentence as `KP_CH21_LAND_VARA_001`; the text pairs land and cattle for this rule only. | CONFIRMED_WITH_CONDITION. Encoded as a separate rule id under the cattle activity because the two activities diverge on every *other* dimension — sharing one sentence is not sharing a rule set. |
| `KP_CH21_CATTLE_NAKSHATRA_001` | Cattle — **buying only** | Nakshatra | Moon in Krittika, Ardra, Magha, Ashlesha, Swati or Anuradha | **Preferred for buying; prohibited for selling** | XXI | 112 | "Krithika, Ardhra, Magha, Aslesha, Swathi and Anuradha are good, only for buying cattle; not for selling which will end in loss." | Buy-good stars: Krittika(3), Ardra(6), Magha(10), Ashlesha(9), Swati(15), Anuradha(17). Selling under these = loss. | CONFIRMED_EXACT. The buy/sell asymmetry is explicit and is the reason `CATTLE_PURCHASE` is the encoded activity rather than a bidirectional "cattle" one. |
| `KP_CH21_CATTLE_NAKSHATRA_002` | Cow — buying **or** selling | Nakshatra | Moon in one of 9 named stars | **Preferred** | XXI | 113 | "To buy or sell cows, the proper asterisms are:—Aswini, Punarvasu, Pushya, Hastha, Swathi, Visakha, Jyeshta, Sravishta and Revathi. One's property in cows will increase by the transaction started under these asterisms." | Ashwini(1), Punarvasu(7), Pushya(8), Hasta(13), Swati(15), Vishakha(16), Jyeshtha(18), Dhanishta(23), Revati(27). | CONFIRMED_EXACT. Explicitly **bidirectional** ("buy or sell"), unlike `_001`. Overlaps `_001` only on Swati; the two lists are genuinely different and neither is a superset. |
| `KP_CH21_CATTLE_LORD_001` | Cattle / sheep / useful animals | Planetary (activity lord) | — | **Attribution** | XXI | 113 (footnote) | "Jupiter governs the sheep, the cow and all those animals that are useful to man." | Jupiter is the karaka for cattle. | CONFIRMED_EXACT. This is the **only** activity-lord attribution Ch. XXI supplies, and it is what lets `CATTLE_PURCHASE` carry a sourced dasha/hora lord instead of a guessed one. |
| `KP_CH21_SHEEP_YOGA_001` | Sheep — buying | Combination (vara + nakshatra + lagna) | Thursday, Pushya nakshatra, Aries rising | **Ranking bonus** (strong) | XXI | 112 | "The most prosperous time is that on a Thursday ruled by asterism Pushya when the rising sign is Aries. Sheep purchased at this time multiply a thousandfold." | Thursday ∧ Pushya(8) ∧ Aries(1). | CONFIRMED_EXACT. A three-way conjunction, all three parts checkable from a day snapshot except the lagna precision. Recorded; not exposed as its own activity. |
| `KP_CH21_GOLD_LOAN_NAKSHATRA_001` | Gold — **parting with** (loan or gift) | Nakshatra | Moon in Krittika, Magha, Mula, Shatabhisha, U.Phalguni, Punarvasu, **or the giver's own janma nakshatra** | **Prohibited** (for the giver) | XXI | 112 | "He who parts with his gold, at a time when the ruling asterism is Krithika, Magha, Mula, Sathabis, Utharapalguni, Punarvasu, or Jenma-Nakshathra will be reduced to destitution. The one that receives the metal will flourish." | Giver-prohibited: Krittika(3), Magha(10), Mula(19), Shatabhisha(24), U.Phalguni(12), Punarvasu(7), plus janma nakshatra. | CONFIRMED_EXACT. **Direction-sensitive and party-sensitive**: bad for the giver, explicitly *good* for the receiver. Note U.Phalguni(12) and Shatabhisha(24) are simultaneously on the chapter's "best for laying up treasure" list — a real intra-chapter tension, resolved by direction (acquiring vs parting with), not by us picking one. |
| `KP_CH21_PLEDGE_NAKSHATRA_001` | Loan on pledge / money lent at interest | Nakshatra | Moon in a Sadharana, Vajra or Theekshana class star | **Prohibited** | XXI | 112 | "Things given or pledged and money lent for interest, under asterisms Sadharana, Vajra and Theekshana do not return." | Sadharana ∪ Vajra ∪ Theekshana = Vishakha(16), Krittika(3), Bharani(2), Magha(10), P.Phalguni(11), P.Ashadha(20), P.Bhadrapada(25), Ardra(6), Ashlesha(9), Jyeshtha(18), Mula(19). | CONFIRMED_EXACT, with the class definitions on pp.112–113 as its key. |
| `KP_CH21_NAKSHATRA_CLASSES_001` | (reference table) | Nakshatra classification | — | **Reference** | XXI | 112–113 | "The 'Sadharana' asterisms are:—Visakha and Krithika. The 'Vajra':—Bharani, Magha, Purvapalguni, Purvashada and Purvabadhrapadha. The 'Theekshana':—Ardhra, Aslesha, Jyeshta and Mula. The 'Laghu':—Aswini, Pushya and Hastha. The 'Mrudhu':—Mrigasirsha, Chithra, Anuradha, and Revathi. The 'Sthira':—Rohini, Utharapalguni, Utharashada and Utharabadhrapadha. The 'Chara':—Punarvasu, Swathi, Sravana, Sravishta and Sathabis." | Seven nature classes: Sadharana 2, Vajra 5, Theekshana 4, Laghu 3, Mrudhu 4, Sthira 4, Chara 5. | CONFIRMED_EXACT. Verified to be a **clean partition**: the seven groups contain 27 entries, all distinct, covering nakshatras 1–27 exactly with no overlap and no gap. That completeness is itself evidence the OCR of this passage is sound. Pinned by a test. |
| `KP_CH21_TRANSACTION_NAKSHATRA_001` | Buying / selling generally | Nakshatra | Moon in one of 17 named stars | **Preferred** | XXI | 113 | "The following asterisms cause good results in all transactions, buying, selling etc:—Aswini, Rohini, Mrigasirsha, Ardhra, Punarvasu, Pushya, Magha, Purvapalguni, Utharapalguni, Hastha, Visakha, Jyeshta, Mula, Utharashada, Sathabis and Utharabadhrapadha and Revathi." | 17 stars. | CONFIRMED_EXACT. |
| `KP_CH21_TRANSACTION_LAGNA_001` | Buying / selling generally | Lagna sign | Taurus, Gemini, Leo, Libra, Scorpio rising | **Preferred** | XXI | 113 | "The following signs produce the same effect:—Taurus, Gemini, Leo, Libra and Scerpio." | Best: Taurus(2), Gemini(3), Leo(5), Libra(7), Scorpio(8). | CONFIRMED_EXACT. Note this **conflicts in shape** with `KP_CH21_TREASURE_LAGNA_001` (fixed best / common middling): Gemini and Libra are not fixed. Different activities, not a contradiction — see "Conflicts" below. |
| `KP_CH21_TRANSACTION_TITHI_001` | Buying / selling generally | Tithi | Any tithi except 4, 6, 8, 9, 12, 14 | **Preferred**; those six **prohibited** | XXI | 113 | "Of Thithis, all have the same effect except Chathurthi, Shashti, Ashtami, Navami, Dhwadhasi and Chathurdhasi." | Avoid in-paksha 4, 6, 8, 9, 12, 14. | CONFIRMED_EXACT. Identical six-tithi set to the **Namakarana** exclusion (Ch. III p.30) — but Namakarana additionally bans Purnima and Amavasya, and this one does not. |

---

## Conflicts and tensions surfaced (not resolved)

1. **U.Phalguni and Shatabhisha are both "best for laying up treasure"
   (p.109) and "destitution if you part with gold" (p.112).** Not a
   contradiction: the first is about *acquiring/storing*, the second about
   *giving away*. Recorded on both records so a future consumer that ever merges
   "gold" into one bidirectional activity is forced to confront it.

2. **Lagna preference differs between laying-up (fixed best, p.110) and general
   transactions (Taurus/Gemini/Leo/Libra/Scorpio, p.113).** Two different
   activities in the same chapter. Neither is promoted over the other; each
   stays on its own activity.

3. **Weekday preference differs between laying-up (Mon/Wed/Thu/Fri, p.110) and
   buying land or cattle (Mon/Tue/Wed/Sat, p.112).** Tuesday and Saturday are
   good for the second and unstated for the first; Thursday and Friday the
   reverse. Preserved as two rules.

4. **The nakshatra class table (pp.112–113) is a clean partition — no tension.**
   Checked rather than assumed: the seven printed groups hold 27 entries, all
   distinct, covering stars 1–27 with no overlap and no gap. It is stored
   verbatim and the loan-on-pledge rule reads only the three classes it names.
   A test pins the partition so an OCR "correction" to any group fails loudly.

5. **No contradiction with the existing marriage doctrine was found.** Ch. XXI
   makes no claim about marriage, and the 8th-house-vacancy rule it *does* state
   (p.110) is scoped to treasure — it is the same device Ch. XIV explicitly
   denies for marriage, which reinforces rather than challenges the existing
   `MARRIAGE_EIGHTH_HOUSE_VACANCY` record.

---

## Deliberately **not** implemented (provenance sufficient, engine input missing)

These are fully sourced but cannot be evaluated by the current engine, which
scores from a **daily** panchangam snapshot with a sunrise lagna and no
muhurta-moment chart. Encoding them as scored rules would mean fabricating the
inputs. Each is stored in `RULE_SOURCES` with the passage so it can be wired the
day an L6 moment-chart layer exists.

| Rule ID | Missing engine input |
| --- | --- |
| *(none)* | Karana rules are implemented from the snapshot; house occupancy remains unscored because no muhurta-moment chart exists |
| `KP_CH21_TREASURE_HOUSE_8_001` | Muhurta-moment house occupancy |
| `KP_CH21_TREASURE_BENEFIC_PLACEMENT_001` | Muhurta-moment graha placement |
| `KP_CH21_GOLD_YOGA_001/002/003/004`, `KP_CH21_SILVER_YOGA_001/002`, `KP_CH21_METALS_YOGA_001`, `KP_CH21_LAND_YOGA_001` | Muhurta-moment graha + varga placement |
| `KP_CH21_LAND_LAGNA_001` | Nakshatra **pada** at the moment + moment lagna |
| Day-lord-in-lagna half of `KP_CH21_LAND_VARA_001` / `KP_CH21_CATTLE_VARA_001` | Moment lagna occupancy |
| `KP_CH21_SHEEP_YOGA_001` | Exposed as no activity of its own (sheep is not a picker activity) |
| `KP_CH21_GOLD_LOAN_NAKSHATRA_001`, `KP_CH21_PLEDGE_NAKSHATRA_001` | No "parting with gold" / "lending on pledge" activity exists in the picker; the rules are direction- and party-sensitive and must not be folded into the acquiring-gold activity |

## Deliberately **not** extracted

* **Ch. XX (Harvest / In-gathering / Expenditure of Corn), pp. 105–109** — the
  substantive grain doctrine, including the Dhanya-Parvatha, Dhanya-Meru and
  Dhanyarnava yogas. Out of the Ch. XXI scope of this pass. Until it is read,
  `GRAIN` rides the chapter-XXI-scope star list and says so.
* **Ch. XXIII / XXIV (new clothes, new ornament), pp. 115–118** — Ch. XXIV
  carries a gold-**jewel-wearing** star list distinct from the treasure list.
  Wearing a jewel is not acquiring one; not merged.
