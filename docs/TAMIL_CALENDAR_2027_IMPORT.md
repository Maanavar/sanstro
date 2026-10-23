# Tamil calendar 2027: import of the owner-supplied almanac

**Date:** 2026-10-22 · **Closes:** FCA-02 (the 2027 cliff) · **Feeds:** FCA-01, FCA-04, FCA-06, FCA-07
**Source:** "Tamil Dates 2027" from [tamildailycalendar.com](https://www.tamildailycalendar.com/), a 24-page PDF
supplied by the owner on 2026-10-22. It contains a muhurtham table, a festival list, and monthly
observance lists. The same site is the source of the 2026 SEO event rows (`app/data/panchangam_events_2026.py`).

## 1. Month starts read from the PDF

The PDF does not print month starts directly, so each one was read two independent ways:

- **Muhurtham table.** Each row gives a civil date with its Tamil day, e.g. "14 June · வைகாசி 31"
  and "23 June · ஆனி 09".
- **Karinaal list.** Karinaal fall on fixed Tamil days (Aani 1, Aadi 2/10/20, …), so a Karinaal
  civil date fixes its month's start.

| Month | 1st day | Read from | Sunset rule (engine) |
|---|---|---|---|
| Thai | 15 Jan 2027 | muhurtham + Karinaal; **equals Gnanananda 2026-27** | 15 Jan |
| Maasi | 13 Feb 2027 | muhurtham + Karinaal; **equals Gnanananda** | 13 Feb |
| Panguni | 15 Mar 2027 | muhurtham + Karinaal; **equals Gnanananda** | 15 Mar |
| Chithirai | 14 Apr 2027 | muhurtham + Karinaal + festival list (Puthandu) | 14 Apr |
| Vaikasi | 15 May 2027 | muhurtham + Karinaal | 15 May |
| **Aani** | **15 Jun 2027** | Vaikasi 31 = 14 Jun; Aani 9 = 23 Jun; Karinaal Aani 1 = 15 Jun | **16 Jun** |
| Aadi | 17 Jul 2027 | Aani 32 = 16 Jul; Karinaal; Aadi Perukku (Aadi 18) = 3 Aug | 17 Jul |
| Aavani | 17 Aug 2027 | muhurtham + Karinaal | 17 Aug |
| Purattasi | 17 Sep 2027 | Karinaal only (Purattasi 16/29 = 2/15 Oct) | 17 Sep |
| Aippasi | 18 Oct 2027 | muhurtham + Karinaal | 18 Oct |
| Karthigai | 17 Nov 2027 | muhurtham + Karinaal | 17 Nov |
| Margazhi | 16 Dec 2027 | Karinaal only (Margazhi 6/9 = 21/24 Dec) | 16 Dec |

The sunset rule agrees on 11 of 12. **Aani** is the exception: the sankranti is at 18:55 IST on
15 Jun, after Chennai sunset, yet the almanac opens Aani that day. This is the first published start
*earlier* than the rule, and it exposed a bug: `tamil_solar_date` would have printed "Vaikasi 32" on
15 Jun. That is fixed, with a regression test.

Imported as `OWNER_ALMANAC_2027` in `app/data/tamil_calendar_authority.py`. Published coverage now
runs **14 Apr 2026 → 12 Jan 2028**. `tests/test_tamil_calendar.py` fails once today + 120 days passes
that date (about mid-September 2027), so the 2028 edition has to be imported before then.

## 2. Observances: which rule each almanac row follows

Script: `scripts/audit/almanac_2027_vs_engine.py`. Each candidate rule is scored against the PDF's
monthly lists for 2027, Chennai.

| Observance | Rule the engine now uses | Engine vs almanac | Before |
|---|---|---|---|
| Pradosham | tithi at sunset | 25/25 | 25/25 |
| Navami / Ashtami | tithi at sunrise | 25/25 · 24/24 | same |
| **Karthigai vratam** | **star at sunset** | **13/13** | 7/13 (sunrise) |
| Thiruvonam vratam | star at sunrise, first of two | 13/13 | 13/13 + 2 repeats |
| **Sankatahara Chaturthi** | **Krishna Chaturthi at moonrise** + tie-breaks | **12/12** | 5/12 (sunrise) |
| **Masa Sivarathiri** | Krishna Chaturdashi at midnight, first of two | **13/13** | not computed |
| Ekadasi | sunrise (Smarta, first of two) | 23/25 | same |
| Shasti / Chathurthi | sunrise (Chathurthi: first of two; kshaya: the day it falls in, §5, 23 Oct) | 11/12 · 10/12 | same |
| **Amavasai / Pournami day** | **tithi at sunrise, first of two** (ruling Q6; kshaya: the day it falls in) | **13/13 · 12/12** | 10/13 · 10/12 (most of the civil day) |
| **Karinaal** | fixed Tamil days, **Thai 10/16** (ruling Q7) | **33/33** + Karthigai 7, Margazhi 11 (kept) | 31/33 |

Sankatahara tie-breaks: when Chaturthi holds two moonrises (23 and 24 May 2027), the almanac takes the
later day. When it holds neither (23–24 Feb), it takes the day Chaturthi rules at sunrise. Both are
derived from those two rows.

The yearly observances (FCA-01, FCA-07) match the PDF's festival list for every 2027 date it gives.
That covers Sivarathiri 6 Mar, Gokulashtami 25 Aug, Vinayagar Chaturthi 4 Sep, Mahalaya 29 Sep,
Deepavali 28 Oct, Soorasamharam 4 Nov, Bhogi/Pongal/Mattu/Kaanum 14–17 Jan, Thai Amavasai 6 Feb,
Aadi Krithigai 28 Jul, Aadi Amavasai 2 Aug, Aadi Pooram 5 Aug, Varalakshmi 13 Aug, Ayudha Pooja 8 Oct
and Vijayadasami 9 Oct. Karthigai Deepam (12 Dec) stays on its own rule, a day after that month's
Karthigai vratam (11 Dec), exactly as the PDF prints the two.

**After the astrologer's answers (22 Oct 2026), two of those no longer match, by ruling:**
Gokulashtami is now **24 Aug** (Ashtami at true midnight, night of 24→25 Aug; the PDF's 25 Aug is its
sunrise-Ashtami day). Karthigai Deepam is now **11 Dec** (Krittika at pradosham; by the 12th's sunset
it is Rohini). Both are follow-ups F1 and F2 in `docs/REVIEW_REQUESTS_2026-10-22.md`.

## 3. Where the PDF disagrees with itself or with the engine

These were put to the astrologer as Q2, Q6 and Q7 in `docs/REVIEW_REQUESTS_2026-10-22.md`, and
answered on 22 Oct 2026: items 2, 3 and 5 are settled and applied; item 4 is kept against the PDF.

1. **Weekdays in the festival list are unreliable.** For example, "06 Mar 2027 – Monday" is a Saturday,
   and "20 Dec 2027 – Saturday" is a Monday. The dates agree with the PDF's own monthly lists, so the
   dates were used and the weekdays ignored.
2. **Mahalaya Amavasai 29 Sep** in the festival list, but **Amavasai 30 Sep** in the monthly list. The
   engine gives 29 Sep for Mahalaya, and its monthly Amavasai day is also 29 Sep. The PDF's monthly
   Amavasai/Pournami day runs a day later than the engine's "dominant day" five times in 2027. Which
   instant names the Amavasai *day*?
3. **Karinaal in Thai.** The PDF lists 15, 16, 17, **24, 30** Jan. With Thai 1 = 15 Jan (which the
   PDF's own muhurtham rows confirm), the standard Thai 11/17 fall on 25 and 31 Jan. Either the PDF
   uses Thai 10/16, or it counted those two from 14 Jan.
4. **Karinaal omissions.** The PDF has no Karthigai 7 (23 Nov; the 2026-10-13 ruling restored this
   disputed cell) and no Margazhi 11 (26 Dec).
5. **Thiruvonam: two almanacs, two conventions.** This PDF matches the star at sunrise 13/13. The 2026
   curated rows (`app/data/panchangam_events_2026.py`) are a day *earlier* than sunrise 5 times in 13.
   The engine stays on sunrise.
