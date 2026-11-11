# Response to the astrologer review, 2026-11-09

**Answers to:** `ASTROLOGER_REVIEW_SHEET_2026-11-09.md`.
**Status:** built on `feat/tamil-voice-v4`, uncommitted. **This is not an astrologer sign-off.**

## Who answered, and what that means

The answers came from an AI review. It says so itself: "I cannot honestly claim to be a human
astrologer". The owner passed them on with the instruction to check doubtful points against
reliable sources rather than follow them blindly. So:

- Every chart fact the review stated was recomputed with our own engine before anything was
  built on it (see the table below). All of them held.
- Doctrine was adopted only where it is standard Parashari practice and the engine already
  encodes it. The best example is functional nature by lagna, which `functional_nature.py`
  has had all along; the readings simply never consulted it.
- Anything that is a lineage choice, or a new interpretive build, is listed under
  **Open for the owner** and was not built.
- The sheet's "astrology not approved" status stands. A human astrologer still has to answer
  it.

## Chart facts, checked

Recomputed in `vinaadi-dev-api`: Lahiri, Swiss Ephemeris, IST.

| Claim in the review | Our engine |
|---|---|
| Chart 1: Meena lagna; Venus exalted in the 1st, retrograde; rules the 3rd and 8th | Lagna 12 (3.6°); Venus Meena 26.1° R, house 1 ✓ |
| Chart 1: Jupiter in Kanni, 7th house, retrograde; 11th from the Moon | Kanni 18.1° R, house 7; Moon in Viruchigam ✓ |
| Chart 1: Rahu with the Moon in Viruchigam (9th); dispositor Mars in the 4th; star lord Mercury in the 12th | Rahu Viruchigam 22.8° (Kettai), house 9; Mars Mithunam, house 4; Mercury Kumbam, house 12 ✓ |
| Chart 1: Venus dasa from Dec 2017 | 2017-12-24 ✓ |
| Chart 1: Saturn in Meena in Nov 2026, so 5th from the Moon and 1st from the lagna | ✓ |
| Chart 3: Kadaga lagna; Venus in the 5th (Viruchigam), Mars in the 4th (Thulam), so a 4th–5th parivartana | Lagna 4; Venus Viruchigam 8.8°, house 5; Mars Thulam 2.3°, house 4 ✓ |
| Chart 3: Venus combust | 8.8° from the Sun; `is_combust` true ✓ |
| Chart 3: Jupiter in the 4th; Rahu in the lagna; Moon exalted in Rishabam | ✓ |
| Chart 3: Mars dasa Nov 2021 to Nov 2028 | 2021-11-27 to 2028-11-27 ✓ |
| Chart 2: Mars dasa begins April 2026 at the 06:30 placeholder | 2026-04-20 ✓ |
| Chart 2: across the unknown birth day, Mars dasa begins anywhere in roughly 2021–2028 | 00:00 gives 2028-03; 21:00 gives 2022-01 ✓ |
| Chart 2: Moon in Moolam for "almost the entire" day | At 00:00 the Moon is at 239.97°, still **Kettai**, and enters Moolam about a minute later ✓ |

The web check (functional nature and star symbols) used small astrology sites and Wikipedia's
list of nakshatras. These are good enough to confirm standard practice, not to settle a
lineage dispute.

## Answers taken, and what changed

| Q | Review said | Decision | Change |
|---|---|---|---|
| 1 | The Venus dasa promise must depend on Venus's condition | **Adopted (narrowed)** | The promise prints only when Venus is lagna lord, yogakaraka or trikona lord, and is neither combust nor debilitated. Otherwise a sentence names the houses Venus rules in this chart. With the lagna withheld, the reading says it cannot call the period favourable. `one_minute_reading_service.PROMISSORY_LORDS`, `LordStanding` |
| 2 | Interpret dasa and bhukti together, not "dasa leads, bhukti adds" | **Open** | Not built. See below |
| 3 | Same as Q1, for Jupiter | **Adopted** | Same gate. On Chart 1, Jupiter is the lagna lord, so its promise stays |
| 4 | The Venus bhukti phrase must depend on Venus | **Adopted** | `five_minute_reading_service.bhukti_flavor` uses the same gate. On Chart 3, Venus rules the 4th and 11th (KENDRA), so the reading names those houses |
| 5 | "Patience in learning" is wrong for a yogakaraka Mars | **Adopted** | The supportive/slow verdict (`_outlook`) now needs the lagna to agree. Supportive needs a functionally benefic lord; slow needs a non-benefic one. Otherwise it stays silent, as it already did for mixed scores. Chart 3's Mars (yogakaraka for Kadaga) no longer gets the slow verdict |
| 6 | Remove the study-direction prediction | **Adopted, and extended** | Removed. The no-handover twin ("the school years run with a single, consistent character") made the same inference from the other side and was removed too |
| 7 | Saturn 5th from the Moon: add the lagna-based position too | **Open** | No change. The current text already says "extra care", not harm. Counting transits from the lagna as well is a lineage choice |
| 8 | Ardha-ashtama set is right | **Approved, no change** | The review's extra items (mother, relocation) are not added. The sentence already stays at "responsibility or pressure", which is what the review asked for |
| 9 | Read the 4th and 5th for a child; mention the exchange | **Adopted (facts only)** | When the child topic reads the 4th, the beat also names the 5th lord and its house, and states a 4th–5th exchange when one exists. Nothing is predicted from it. `_child_learning_house_clause` |
| 10 | Widen the 12th-house line | **Adopted, one word dropped** | Now "செலவு, தூக்கம், வெளியூர் அல்லது வெளிநாட்டு வாசம், தானம், மோட்சம்". The review's படுக்கைச் சுகம் was left out: classically it is sayana sukha, which has a sexual sense not suited to a plain-reader line |
| 11 | One canonical list, primary plus alternatives | **Adopted for these 8 stars** | Same values in `app/services/nakshatra_content.py` and `web/lib/natchathiram-data.ts`. Details below |
| 12 | Unknown birth time must not silently become a confirmed one for dasa dates | **Adopted; the most important fix** | See below |

### Q12 in detail

The disclosure on an unconfirmed time used to end: "உங்கள் நட்சத்திரமும் தசை, புக்திக்
கணக்குகளும் லக்னத்தைச் சார்ந்தவை அல்ல" ("your star and every date here stand without it").
That is true of the lagna, but the reader takes it to mean the dates are firm, and they are
not. The dasa balance is the Moon's remaining arc in its star, and the Moon crosses about one
star a day.

The app cannot store "time unknown". A chart needs a time, and the form's தெரியாது option
means the **source** is unknown while the reader still typed a time. So instead of guessing a
window, the closing now states a **rate**: each hour of error moves the dasa dates by about N
months, computed from this chart's Moon speed and opening dasa. For Chart 2 that is about
4 months an hour.

If a star boundary falls inside the stated ± window (±60 min when none is given), the
disclosure says the star itself may differ. Code: `dasa_date_spread`, `_dates_closing`.

### Q11 symbols

The website and the readings now agree on these eight stars. The other 19 still differ
between the two lists and were not part of this review.

| Star | Now (primary / alternative) | Note |
|---|---|---|
| ரேவதி | இரட்டை மீன்கள் / மத்தளம் | Website's தம்புரு removed. Fish and drum are both standard |
| உத்திரம் | கட்டிலின் பின்கால்கள் | Bare "கட்டில்" and the website's "மஞ்சம், இரண்டு கால்கள்" removed |
| சுவாதி | காற்றில் அசையும் இளந்தளிர் / பவளம் | Website's பெண் எருமை removed: that is the yoni animal, not the symbol. The review's "sword" was not adopted; standard lists give coral |
| மூலம் | வேர்கள் சேர்ந்த கொத்து / அங்குசம் | Lion's tail removed. The elephant goad is the standard alternative |
| கேட்டை | காதணி (குண்டலம்) / குடை | |
| பூசம் | பசுவின் மடி / அம்பு | Website's duplicate "காமதேனுவின் மடி" removed. Arrow is a listed alternative |
| பூராடம் | யானைத் தந்தம் / விசிறி | Peacock feather removed |
| அவிட்டம் | மத்தளம் / புல்லாங்குழல் | The review's உடுக்கை was not adopted: not in the standard lists |

## Open for the owner

1. **Full dasa–bhukti synthesis (Q2).** The review asks the reading to combine both lords'
   ownership, placement, mutual relationship, dispositor and star lord. That is a new
   interpretive engine with doctrine choices in it: weightings, and which factor wins when
   they disagree. It needs a ruling, ideally from a human astrologer, before anyone builds it.
   The Rahu bhukti sentence on Chart 1 is still the generic one.
2. **Transit from the lagna as well as the Moon (Q7).** Tamil almanac gochara palan counts
   from the janma rasi. Adding a lagna count is a lineage choice, and it is unavailable
   whenever the time is unconfirmed.
3. **A real "birth time unknown" state.** The app has no way to store it, which is the root of
   Q12. Adding one is an API change across all four surfaces (`app/api/`,
   `packages/shared/src/api/`, `mobile/src/api/`, `web/`), and it would let the reading show a
   date range instead of a per-hour rate.
4. **The full child education reading (Q9).** The review lists the 2nd, 4th, 5th and 9th houses,
   plus Mercury and the Moon. Only the 4th–5th facts were built.
5. **The other 19 star symbols (Q11)** still disagree between the website and the readings.
6. **New Tamil lines need the owner's voice review.** The v6.1 approval does not cover them:
   - the conditioned dasa and bhukti clauses in `conditioned_period_texture` and
     `conditioned_bhukti_flavor`;
   - the date-rate closings in `_dates_closing`;
   - the child's 5th-lord and parivartana sentences;
   - the new 12th-house line.
7. **A human astrologer** should still countersign Q1–Q12. This response does not replace that.

## Gates

`tests/test_astrologer_review_2026_11_09.py`. Each gate also carries a counter-case, so that it
fails if the fix is reverted, not just if the text changes:

- Jupiter keeps its promise for its own lagna.
- Mars still gets the slow verdict where it is a functional malefic (Mithuna).
- The disclosure's anchor sentence is pinned for every unconfirmed form.

**Blind spot:** the gates use reduced synthetic charts, not the full reading assembler. The
existing reading suites cover the assembled readings.
