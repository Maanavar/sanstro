# Answers to the master sheet, 2026-11-10

**Answers to:** `ASTROLOGER_MASTER_SHEET_2026-11-10.md`. **Received:** 2026-11-10, pasted by the owner.
**Status:** the owner ruled on 2026-11-10 to build from these answers (DOCTRINE_DECISIONS_V1 §19).
Code tag `ai_review_2026_11_10`. **Built:** E3, E5, E7, B1, B2, B3, B4, B5 (periods), B6, B7, B9,
C2, C3, C4, D1, D3, D10, D11, A1, A2 (two factors), A3 (strength part), A6, A7, A8, A9 (exchange
meaning), F5 (ayana), F6. Already as answered: E1, E4, E6, A4, A5, A10, A11. Not changed: E2.
**Held:** D2, B5/B10 (needs the owner and a four-surface API change), F1. The full table, with
each switch, what it replaces and why each held item is held, is DOCTRINE_DECISIONS_V1 §19.

## Who answered

**Fable 5.2, an AI model** (owner, 2026-11-10). The text reads like an AI review, as the 11-09 answers did. It says
"as I recall", "from memory", "I cannot give the page; please verify", "my ephemeris gives" and
"I can write out the 108 syllables from memory". If an AI wrote it, it is **not a practitioner's
sign-off**, and the rule from 11-09 applies again: verify every claim, adopt only standard practice,
and hold every lineage choice for the owner. The owner should say who wrote it.

## Checked

| Claim | How checked | Result |
|---|---|---|
| A1: Chart 1's exalted Venus is retrograde | Engine, 11-09 recompute: Venus Meena 26.1° R | ✓ |
| A11: the rate is not a constant; compute it per chart | `dasa_date_spread` already does this. The sheet quoted Chart 2's value (code comment: about 3½ months an hour, printed rounded) | Already so. No change |
| A12: dates match the answerer's software | Their claim only | Not checked |
| E1: one rule fits all eleven examples | `vinaadi-dev-api`, Chennai, 2-minute steps from sunset to nisheetha midpoint + 24 min: Ashtami and Rohini together on that evening → that date; else the evening whose nisheetha holds Ashtami | **11 of 11** (our best rule managed 8). 2029: together from 18:19 on 1 Sep. 2032: from 23:41 on 27 Aug |
| E1: Tamil sources gave 16 Aug in 2025 | Not checked | The rule gives 15 Aug, which matches the example date |
| E4: Deepam 2013 was 17 Nov, the first Krittika | Web: Deccan Chronicle, 18 Nov 2013, reports the hill lamp lit at 6 pm Sunday 17 Nov. Drik Panchang lists 14 Dec 2013 | ✓ for Tiruvannamalai |
| E5: Maasi Magam 2026 was 2 Mar | Web: most Tamil calendar sites and a Chakrapani temple write-up give 2 Mar. Hindupad and one travel blog give 3 Mar | ✓ (majority) |
| E7: Tamil panchangs placed Varalakshmi 2026 on 21 Aug | Web: Tamil, Telugu and Kannada calendars give 21 Aug (Friday before Pournami). Drik Panchang (New Delhi) gives 28 Aug | ✓ |
| C1: the Sevvai verse is quoted in B.V. Raman's *Muhurtha* | No page given | Not checked. Needs the book |
| D2: yoga ghatika table, "as I recall Muhurta Chintamani" | Not checked | Needs the verse |
| F2: Santhanam's BPHS (Ranjan Publications) | Not checked | |

Web sources: [Deccan Chronicle, 18 Nov 2013](https://deccanchronicle.com/amp/131118/news-current-affairs/article/maha-deepam-lights-night-sky-tiruv­annamalai);
[dailycalendartamil.com, Masi Magam 2026](https://www.dailycalendartamil.com/masi-magam-2026/);
[dharma-renaissance.org, Chakrapani Masi Magam 2026](https://blog.dharma-renaissance.org/?p=16065);
[hindupad.com, Masi Magam 2026](https://hindupad.com/masi-magam-2012-masi-makam-or-masi-maham-in-2012);
[boldsky.com, Varalakshmi 2026](https://www.boldsky.com/yoga-spirituality/when-is-varalakshmi-vratham-2026-21st-or-28th-august-date-timings-rituals-significance-and-more-171657.html);
[mysilklove.com, Varalakshmi 2026](https://mysilklove.com/blogs/all-for-silk-love/varalakshmi-vratam-2026-saree-guide-21-or-28-august-and-what-to-wear).
These are aggregators and blogs: leads, never citations (DOCTRINE §18 Q18).

## Where an answer overturns an earlier ruling

The owner must rule on each of these. None can be taken from an unconfirmed source.

| Q | Answer | Overturns |
|---|---|---|
| B1 | A node alone in the 5th is கவனம், not a dosham, with no parihara | §18 Q11: alone = mild dosham |
| C2 | Add Mars in சிம்மம் or கும்பம் as exempt | §18 Q6: "no floating Simmam and Kumbam general exemption" |
| C4 | A strong Guru joining or aspecting Mars is நிவர்த்தி (the answer calls it a lineage choice) | 22 Oct §8: cancel only by samyam or Mars debilitated in கடகம்; O-18 |
| D3 | Rahu 3/6/11 like Ketu; Rahu in the 10th mixed | AAU-09 and §18 Q2: Rahu 3/6/10/11 |
| E4 | Deepam is exempt from the two-in-a-month rule | Round-two §3/§4 |
| E5 | Drop "never most of the day" for Maasi Magam (a daytime rite) | 22 Oct §0.3 / Q3 principle |
| E2 | Aadi Krithigai is a daytime rite; 2025 = 16 Aug | The 22 Oct example date of 20 Jul (it agrees with the §3 rule) |
| E3 | Take the later star day in all six | Keeps the full-moon test only as a tie-break (round-two Task 3a/3b) |

## Confirmations (no change)

A4, A5, A6 (remove both), A10, D4, D5, D6, D7 (keep the civil date), D8, D9, D11, D12, B3 (the owner's
"D7 never declares" ruling stands), B8, F4 (Tamil letter first), F6 (all eight symbols right).

## New builds the answers ask for

Each needs the owner's go-ahead. Items marked **API** change a contract shared by `app/api/`,
`packages/shared/src/api/`, `mobile/src/api/` and `web/`.

**Readings**
1. **A1/A3:** two tests. Lordship by lagna says *which* matters; strength (dignity, kendra or trikona,
   not combust, navamsa) says *how well*. Benefic and strong: the promise. Malefic and weak: houses
   only. Otherwise: mixed. Chart 1: mixed, with Malavya yoga named. The answer also says உச்ச வக்ரம்
   is much weaker, which is a doctrine claim that needs a source. A3 adds: name the 7th house and
   soften the line.
2. **A2:** read the bhukti lord by its houses, then its place from the dasa lord (6/8/12 friction,
   kendra or trikona smooth), then natural friendship, then strength. Rahu and Ketu: occupied house,
   then conjunctions, then sign lord, then star lord.
3. **A6:** a neutral line at the குஜ–ராகு தசா சந்தி: a transition, extra care for some months.
4. **A7:** with a certain birth time, one line for Saturn on the lagna (health, added
   responsibility), not scored twice.
5. **A8:** add தாய் உடல்நலம், இடமாற்றம்.
6. **A9:** the child's education reading: 2nd (speech, early learning), 4th (schooling), 5th (grasp),
   9th (higher study); Mercury and Jupiter as karakas, the Moon for attention. Wording for the
   Chart 3 exchange. A4 also asks to word the 4th as home, mother and schooling.
7. **D10:** no marriage window below the legal age.
8. **D11:** print the Sanskrit ruthu names beside the Tamil.

**Children's doshams**
9. **B1:** "dosham" only from confirmed upward (see the conflicts above).
10. **B2:** add Thirukarukavur (Garbharakshambigai) and Sashti viratham on the hope side;
    Thirunageswaram or Kalahasti on the sarpa side.
11. **B3:** the D7 table as answered: it lowers or blocks a lowering, never raises; the D7 lagna
    lord and vargottama change confidence only. Example: lighter by one when the time is firm.
    The answer says the D9 and the spouse's chart matter more than the D7.
12. **B4:** a 5-minute line, not 2.
13. **B5:** periods: the node in the 5th, planets joined to it, the 5th lord, Saturn for thadai;
    Jupiter's transit over or aspecting the 5th opens the supportive windows. Bhukti is enough. The
    dasa times; it never grades. Say so when the dasa has passed.
14. **B5/B10 (API):** ask "do you have children?" before showing the card; suppress it when the
    answer is yes or the person is past that stage; **never on a minor's chart**; read both
    spouses' charts. Drop "first reading" only with a confirmed time and both charts. Anything
    costly goes to an astrologer, and the card also points to a doctor.
15. **B6:** a strong 5th lord: kendra or trikona; own, exalted or friendly sign; not combust; not in
    6/8/12; not debilitated in navamsa. Joined by the dosham's planet: no lowering.
16. **B7:** a protecting Jupiter needs a link to the 5th **and** freedom from affliction; strength
    adds to that. A kendra Jupiter with no link does not protect. Jupiter in the 5th itself (காரகோ
    பாவ நாசாய) protects only in its own or exalted sign.
17. **B9:** "beside" = same sign; within about 10° full weight, beyond that half. The answer says
    this is working convention, not a verse.

**Sevvai**
18. **C3:** word mild as common (5 of 12 houses is about 42% of charts).
19. **C5:** no fixture review. Both Ruchaka and Sevvai stand; with the C2 exemptions, the remaining
    cases show both, with Sevvai at mild.

**Calendar**
20. **D1:** add மரண யோகம் (weekday with star), அஷ்டமி, நவமி and கரிநாள் to the நல்ல நாள் badge.
21. **D2:** avoid only the first ghatikas of some yogas (table to verify against the verse).
22. **E1:** the verified rule above (11 of 11).
23. **E6:** take the second aparahna in 2045: Ayudha Pooja 19 Oct, Vijayadasami 20 Oct.
24. **E7:** Varalakshmi is always the Friday before the Pournami (2022 = 5 Aug, 2026 = 21 Aug,
    2029 = 17 Aug).
25. **F1:** Vasan for conventions, plus a yearly Vakya-panchangam temple override table for the big
    festivals, showing the temple date when it differs.
26. **F3:** keep the traditional sankranti alert off. Other printings give 20 ghati for மகரம் and 10
    for the Vishuva pair.
27. **F5:** tonsure: prefer Uttarayanam, allow Dakshinayanam at a lower score; odd years; many
    families do it in the first year; the kula deivam custom overrides.

## Still open after these answers

- The Sevvai text's page (C1), the D2 verse, the 108 syllables from print (F4: the answerer offers a
  from-memory list, which cannot be a citation), and the Vasan photos (F1).
- The answer's E1 note that Tamil sources gave 16 Aug in 2025, against the example's 15 Aug.
