# Open items: everything still waiting (2026-10-22)

One list of everything not finished, grouped by **who has to act**. Each item says what it is, why it
matters, and exactly what to do. Status key: `[ ]` open · `[~]` partly done · `[x]` done (23 Oct).

Built from: `REVIEW_REQUESTS_2026-10-22.md`, `REVIEW_REQUESTS_2026-10-21.md`,
`OWNER_RULINGS_FSA_2026-10-21.md`, `FULL_CODEBASE_AUDIT_2026-10-22.md`, `DOCTRINE_DECISIONS_V1.md` §8,
`DOCTRINE_DECISIONS_V1.2.md` §16/§18, `ASTROLOGER_RULINGS_2026-10-13.md`,
`GROUND_TRUTH_AUDIT_IMPLEMENTATION_2026-10-13.md`, `MUHURTA_TITHI_AT_WINDOW_D4_2026-10-13.md`,
`DATA_PROTECTION.md`, `LAUNCH_RUNBOOK_2026-09-26.md`, `product/Vinaadi_BRD_v2.1.md`,
`IMAGERY_AUDIT_AND_ART_DIRECTION_2026-10-14.md`. Where a doc is older than a week, the item says so.

| Part | Who acts | Count |
|---|---|---|
| 1 | The astrologer | 21 |
| 2 | The Tamil reviewer (and content reviewer) | 9 |
| 3 | You, by hand, against a printed almanac | 9 |
| 4 | You, as owner: decisions and actions | 15 |
| 5 | Engineering, no outside input needed | 24 |

**Second opinion, 22 Oct.** An outside AI review of this list was pasted in and checked against the
rulings on file. It is advice, not a ruling: it signs nothing, and where it disagrees with the native
reviewer (`OWNER_RULINGS_FSA_2026-10-21.md` §10–§11) or a native review already applied, the reviewer
stands. Where it sharpened a question or settles something the owner can decide, the item says
**2nd opinion**. Its claim about 1A-D was tested against the ephemeris and turned out the other way
round (see D).

---

## 1. For the astrologer

**Ready to send (23 Oct): `ASTROLOGER_MESSAGE_2026-10-23.md`.** One message, Q1–Q22, covering 1A–1D
with the sharper questions, plus two new ones: the kshaya Ekadashi (Q9, with 2026/2027 data; both
printed almanacs give the day it falls in) and debilitated Mars as "worse" in some texts (Q12).
Q2/Q3 and Q17/Q18 are split on purpose.

### 1A. Festival rules, round two: seven conflicts (send as is)

All seven are written up, ready to forward, in `REVIEW_REQUESTS_2026-10-22.md` under
**"Held: the rule and its vectors disagree"** (items A–G). In each one, the rule the astrologer gave
and the example dates the astrologer gave do not agree, so we did not build it. The calendar keeps
its current behaviour until answered.

- [ ] **A. Krishna Jayanthi: which civil date is printed (OPEN-1).** The night is now chosen as ruled.
  But printing the date of the midnight moment matches only 3 of the astrologer's 11 example years.
  Printing the evening before matches 8. The day Ashtami holds at sunrise matches 7.
  **Today:** the evening date (2026 = 4 Sep, the government holiday).
  **Ask:** "Which single rule gives all eleven of your dates (2023–2033)?" Also the 2031 case: Rohini
  is at neither midnight.
  **2nd opinion:** no candidate gives 11, so the dates may not come from one rule. Tamil Nadu splits
  here (Rohini-led Sri Jayanthi in Sri Vaishnava homes, Ashtami-at-midnight in smarta homes), and the
  two agree in most years. Ask instead: "Are the eleven dates from one panchangam, or from memory
  across years? For 2031, what is printed, and why? Does Rohini decide the day at all, or only
  Ashtami?" The 2031 answer shows which family the astrologer follows. It also suggests printing the
  civil date and showing the midnight window as a separate line (Part 5).
- [ ] **B. Aadi Krithigai: sunset or sunrise (OPEN-2).** Sunset (pradosham) matches 4 of 11 examples;
  sunrise matches 10. **Today:** sunset. **Ask:** "Is Aadi Krithigai a sunrise observance, unlike the
  monthly Karthigai vratam? Is 2025 = 20 Jul an exception to the duplicate rule (§3)?"
  **2nd opinion:** sunrise for the printed date, worship that evening. Send the two questions as two
  separate messages, so one answer is not read as covering both.
- [ ] **C. Thai Poosam, Maasi Magam, Panguni Uthiram, Vaigasi Visakam (OPEN-3).** Applying the §3
  duplicate rule to these moves six dates (2033 ×3; Vaigasi Visakam 2022, 2030, 2041). **Today:** the
  old full-moon test, used only as a tie-break. **Ask:** "Delete the full-moon test and accept the six
  moves?"
  **2nd opinion:** delete the test and accept the moves. **Not adopted:** the astrologer's own 2032
  Deepam date (D) is the day the star and the full moon meet. That suggests they may use the full-moon
  test. Leave this question with the astrologer.
- [ ] **D. Karthigai Deepam 2032.** §3 gives 14 Dec; the astrologer's example says 17 Nov. The other
  ten years match. **Today:** 14 Dec. **Ask:** "Is 2032 an exception, or is 17 Nov from another rule?"
  **Checked 22 Oct** (Lahiri, Chennai, approximate sunrise/sunset; not the production code path):
  17 Nov 2032 has **Krittika and Pournami together at sunrise**, on the first day or two of Karthigai
  (the Sun enters Vrischika on the evening of 16 Nov). 14 Dec has Krittika on **Trayodasi**, not
  Pournami. So 17 Nov is not an error. It is the Krittika–Pournami union, and §3's "later occurrence"
  overrides it. **Better ask:** "In 2032 Krittika meets Pournami on 17 Nov, at the very start of
  Karthigai. On 14 Dec Krittika falls on Trayodasi. Which wins: the Pournami union, or §3's later
  Krittika?" This also bears on C.
- [ ] **E. Maasi Magam 2026.** Magam holds only the 3 Mar sunrise. 2 Mar is possible only if Maasi
  Magam is a sunset observance. **Today:** 3 Mar only (the stored 2 Mar row moved to 3 Mar by 4E).
  **Ask:** "Is Maasi Magam a sunrise observance?"
- [ ] **F. Ayudha Pooja / Vijayadasami 2045.** "Take the first of two aparahnas" gives 18 Oct and
  20 Oct, a day apart, which breaks "they are always consecutive". **Today:** 18 and 20 Oct.
  **Ask:** "In 2045, which gives way: the tie-break or Vijayadasami's own aparahna?"
  **2nd opinion:** "always consecutive" is an observation (Navami and Dasami are consecutive tithis),
  not a rule, so 18 and 20 Oct stand. Better ask: "Is 'always consecutive' a rule you hold, or an
  observation? If it is a rule, which tithi definition do you override to keep it?"
- [ ] **G. Varalakshmi when the Pournami is a Friday.** The "or the Pournami itself" branch moves
  2022, 2026 and 2029 a week later (2026: 21 Aug → 28 Aug). **Today:** follows the ruling (28 Aug).
  **Ask:** "Is the second branch right?" (See also 3D below: check 2022 in print.)

### 1B. Sevvai dosham: two small confirmations

- [ ] **Guru conjunct Mars now only reduces.** Before the round-two ruling the engine treated it as a
  full cancellation. It is not one of the astrologer's two cancellation conditions, so it now reduces.
  **Ask:** "Confirm Guru conjunct Mars reduces and does not cancel."
- [ ] **Mars debilitated in a single chart.** The ruling says a single chart never reads "Cancelled",
  and also lists Mars debilitated in Katakam as a cancellation. We read that as: it *reduces* in a
  single chart and *cancels* only in marriage matching. **Ask:** "Is that reading right?"
  (`DOCTRINE_DECISIONS_V1.2.md` §16, O-33 closed.)

**2nd opinion:** both readings are right. Cancellation is a statement about two charts, so a single
chart cannot read "Cancelled". It also suggests a hedge in the copy: some texts read debilitated Mars
in the 7th or 8th as *worse*, not better. Still ask the astrologer, and add the hedge only if they
agree.

### 1C. Source tables the astrologer held back (from 13 Oct)

The astrologer approved the mechanism for each of these but did not give the table. We must not fill
these from memory or a website. Detail: `ASTROLOGER_RULINGS_2026-10-13.md` §3–4.

- [ ] **Eka-nakshatra (same-star couples).** Need the star + pada table, from a named source. Sources
  disagree on Anusham and Uthirattathi. Until then same-star couples get a hard caution.
- [ ] **Gana porutham, three grades.** Three of the nine cells are still unresolved: Manushya ♂ /
  Rakshasa ♀, Deva ♂ / Rakshasa ♀, Rakshasa ♂ / Deva ♀. Also, which gana pairs the ">14 stars"
  exception applies to.
- [ ] **Vasya (Vasiya) porutham.** The full 12-rasi table from a named Tamil text, not just the one
  disputed cell (Thulam → Kanni).
- [ ] **"PN-4 / p. 243".** The page that the Sani Nara-Chakra citation points to. Still not produced;
  p. 243 is ambiguous.
- [ ] **Papa samyam convention.** Our reading: a malefic in a papa house from two references
  (Lagna/Moon/Venus) counts **twice**, and only the five grahas count (Mandhi excluded). No printed
  worked example confirmed it. **Ask:** "Is that right?"

**2nd opinion on 1C (how to ask, not answers):** for every table, ask for a photo of the page *and* of
the title page (publisher, edition). Gana: ask which text grades the pairs into three at all, since
many give only pass/fail; the three open cells are the asymmetric ones. Papa samyam: send the Mandhi
question **separately** from the double-counting one. Many Tamil texts count Mandhi/Gulika, and it
changes scores a lot.

### 1D. Things blocked on a named text (from 21 Oct)

- [ ] **Per-purpose star lists.** Marriage is sourced. New beginnings (AARAMBAM), house-warming
  (GRIHA_PRAVESAM) and travel (PRAYANAM) have no table. Until named, the app will say "no sourced
  ruling for this purpose". **Ask:** the three tables and their source.
- [ ] **Gandanta for new beginnings.** Whole star, or only the junction pada (last pada of Revati /
  Ashlesha / Jyeshta, first of Ashwini / Magha / Moola), or a narrower interval? From which text?
  **2nd opinion:** muhurta practice tends to the narrowest interval, jataka practice to the widest.
  Ask the astrologer to say whether they are answering as a muhurta or a jataka practitioner.
- [ ] **Varuda Palan year lord.** Blocked until the astrologer names the text and edition (probably
  Tajika Neelakanthi). Four questions: (1) do inimical aspects (1/7, 4/10) count, or only friendly
  (3/11, 5/9)? (2) whole-sign or degree-based with orbs? (3) which hadda table? (4) the rule when no
  candidate aspects the year's lagna. Until then the paid page says "approximate".
  **2nd opinion adds a fifth:** (5) where does the year start: the exact solar return to the natal
  Sun's longitude, the sidereal ingress, or the birthday? The choice can change the year lord.

### 1E. Nakshatra pages: claims to check (release condition 2)

- [ ] **Ardra, Ketu dasa:** the page calls the Tirukkural a Shaiva scripture. Keep?
- [ ] **Mrigashira, Ketu dasa (very old age):** "awareness of subtle presences may intensify", which a
  family could read as explaining away confusion. Keep or reword?
- [ ] **Five health sentences changed** (Ashwini and Bharani Moon, Punarvasu and Pushya Ketu, Krittika
  Ketu, Ardra Ketu) now say "treat them as health concerns" / "as much as medical care". The English
  changed, so this needs confirming. (`REVIEW_REQUESTS_2026-10-21.md` R2 item 5.)

**2nd opinion. All three are content calls the owner can make without the astrologer:**
- Ardra: **change it.** The Tirukkural names no sect, and Jains, Shaivites and others all claim it.
  Use "Tamil ethical classic" / தமிழ் அறநூல்.
- Mrigashira: **cut it**, don't reword. In very old age it can make delirium or dementia sound
  spiritual and delay a doctor's visit. Replace it with a line that makes no claim about perception.
- Health: "as much as medical care" puts remedy and medicine on a par. Use "alongside, not instead of,
  medical care" / மருத்துவ சிகிச்சைக்கு மாற்றாக அல்ல, அதனுடன் சேர்த்து. This fits the standing
  rule: never tell a family a symptom is "not illness".

**Done 23 Oct (owner delegated the call), English and Tamil together:**
- [x] Ardra Ketu focus: Thirumantiram as the Shaiva text, the Tirukkural beside it as "the Tamil
  ethical classic" / தமிழ் அறநூல்.
- [x] Mrigashira Ketu navigate: the "subtle presences" sentence is cut. So is "if the restlessness does
  not quiet, deepen spiritual practice", the same shape. New: confusion, agitation, or a change in
  sleep or memory is a health concern; see a doctor, alongside the period's practice.
- [x] Krittika Ketu ("as much as medical care") and Ardra Ketu ("more important than most other
  support") now say "alongside medical care, not instead of it" / மருத்துவ சிகிச்சைக்கு மாற்றாக
  அல்ல, அதனுடன் சேர்த்து.
- Ashwini, Bharani (Moon), Punarvasu, Pushya (Ketu) already said "treat them as health concerns" and
  are unchanged. All new Tamil is unread by a native speaker (Part 2).

### 1F. The long-standing doctrine sign-off

- [~] **Practitioner sign-off on O-1 to O-24.** You ruled several on 3 Oct; a practitioner has not
  confirmed them. Also the printed-edition verse checks (BPHS, Phaladeepika, Saravali, Brihat Jataka,
  Raman, Laghu Parashari). Full list: `DOCTRINE_DECISIONS_V1.2.md` §18. This blocks "freezing" the
  doctrine constants, not any feature.

---

## 2. For the Tamil reviewer (and the content reviewer)

Nothing below has been read by a native Tamil speaker. Passing tests is not approval (your §8 ruling).
The 22 Oct second opinion is not a native reading either. Where it agrees with the reviewer, it adds
weight. Where it disagrees, the reviewer's §10–§11 ruling stands:

| Word | 2nd opinion | On file | Result |
|---|---|---|---|
| நடைமுறை (practice) | பயிற்சி **or சாதனை** | §11: பயிற்சி / அனுஷ்டானம்; **avoid சாதனை** (reads "achievement" on the same pages) | Reviewer stands. The 2nd opinion contradicts its own FCA-13 point |
| வரை எங்கும் | முழுவதும் | §11: name the two ends with -ஓ | Reviewer stands |
| தரிசனம் | judge each use; பார்வை / நோக்கு when it means "outlook" | §11: நோக்கு / கண்ணோட்டம்; keep only தத்துவ தரிசனம் | Agree |
| தசகம் (40 inflected) | பத்தாண்டு காலம் for a decade of life | §10: reviewer said பத்தாண்டு; held only because it sits near the timing detector's number-word rule | Agree. Now an engineering item (Part 5) |
| அல்ல ஆனால் (27) | "X அல்ல, Y" or "X அல்ல; மாறாக Y" | §11: English calque | Agree. Scope is 4A |
| ஒத்தொலிப்பு (8) | ஒத்திசைவு, or recast (…உடன் ஒத்துப்போகிறது) | §11: English calque | Agree |
| மனக்காட்சி, வருடப்பலன், தோராயம் | keep (predicate: தோராயமானது) | — | Agree |
| மறைக்கப்பட்டுள்ளது | right for "withheld"; for premium, say what unlocks it | — | New point for the reviewer |

- [ ] **R2: re-read after the sixth round.** 26 pages. What to read and in what order is written out in
  `REVIEW_REQUESTS_2026-10-21.md` section R2 (the carve-out sentence, the Ganapati/Hanuman folding,
  நடைமுறை replacements, Purva Bhadra, மனக்காட்சி and வரை எங்கும், 44 parity rows, the Mula Ketu
  substitution). The packet is `DASA_PROSE_REVIEW_PACKET_2026-10-21.md`.
- [ ] **Sign conditions 1 and 4 per page.** The reviewer said Dhanishtha and Shravana first, then
  Punarvasu, Pushya, Uttara Bhadra, Vishakha. Rohini is the least ready.
- [ ] **Content reviewer, condition 3 (life-stage words), every page.** For each "school / college /
  marriage / retirement" word: is it true for every pada according to the age table in the packet? If
  not, does the sentence say "for some padas"? Seven were fixed; the rest are open.
  **2nd opinion:** make it mechanical. Grep the four word families, check each hit's pada age span
  against the packet's table, and prefix சில பாதங்களுக்கு where the span crosses the stage. We can
  produce that list (Part 5); the reviewer then checks a finite list.
- [~] **Personification pass: applied 23 Oct, awaiting the reviewer's read.** Rule used: the
  reviewer's own (rulings line 919), *neuter where the star is the subject, `<stem> ஜாதகர்` where the
  person is*. That overrides the 2nd opinion's "always ஜாதகர்". Stem per §9.3 (-ம் dropped:
  ஹஸ்த, அனுஷ, பூச …). A detector (star name + honorific verb, no ஜாதகர்/பிறந்தவர், Tamil block of
  each visual page) found **85** sentences on 20 pages; 81 lines changed, ஜாதகர்கள் where the verb is
  plural. Six were left on purpose, as not personification: rohini:169 (Krishna is the subject),
  revati:233/238/239 and swati:233 (already attributive), uttara-bhadra:239 (Guru is the subject).
  Also fixed: six broken forms where -ம் had not been dropped (ஹஸ்தம் ஜாதகர்கள், மூலம் ஜாதகர் …);
  magha:168 and purva-phalguni:179, which had neuter verbs on the person (purva-phalguni also
  mistranslated "what people will love" as "people will like **me**"); Rohini's two நேயர்களுக்கு
  (§11.8) → ஜாதகர்களுக்கு. The seven pages with no hits use the star only in oblique forms.
  **Reviewer:** read the 84 changed lines (`git diff` on `web/app/(marketing)/natchathiram`).
- [ ] **தசகம் in inflected forms.** 40 uses (தசகங்களுக்கு …) remain. Keep or replace?
- [ ] **Other Tamil from 21 Oct (§8.6 groups):** Varuda Palan page copy; Chandrashtama strings; the
  dasa timing table labels and footnote; the 81 base-page edits; Rohini edits; the mobile "which half
  of the star" prompt; the Tamil-script Sanskrit names in brackets (க்ருத்திகா, ம்ருகசிரா, ஆஷ்லேஷா …);
  the Shatabhisha paragraph. The reviewer's own notes on specific words (வருடப்பலன், தோராயம்,
  மறைக்கப்பட்டுள்ளது …) are in `OWNER_RULINGS_FSA_2026-10-21.md` §8.6.
  **2nd opinion on the bracketed names:** drop the Sanskritised Tamil spellings (க்ருத்திகா …); lead
  with the almanac name (கார்த்திகை, மிருகசீரிடம், ஆயில்யம்). Its fallback, a Roman-script bracket
  inside Tamil text, is **not available**: it would break the standing rule against showing both
  languages for one name. So the choice is to keep the bracket or drop it.
- [ ] **Tara bala word (FCA-13).** Sadhana tara is printed as சாதனை ("achievement"); almanacs print
  சாதக. Confirm, and we change it. **2nd opinion:** change it. The sixth tara is Sādhaka, and
  almanacs print சாதக / சாதக தாரை. With the printed almanac, that makes two signals. Still one native
  "yes" short under §8.
- [ ] **Ask Vinaadi limit message** (12 Oct): the Tamil for a reset time between midnight and 5 am uses
  அதிகாலை / நள்ளிரவு. Not read by a native speaker.
  **2nd opinion conflicts with an earlier native review.** It proposes 12:00–12:59 → நள்ளிரவு. Native
  review A-04 chose **அதிகாலை 12:30** because "நாளை நள்ளிரவு 12:30" can be read as the next night
  (`packages/shared/src/askAllowance.ts`, tested in `dashboard-ask-vinaadi.limit.test.ts`). A-04
  stands. Both agree: never a bare "இரவு 12 மணி".
- [ ] **Smaller, older items:** `web/lib/marketing-seo-ta.ts` (Tamil SEO titles, GRW-06); the Tamil
  wording of the 3 Oct doctrine packet section D as it appears on the cards; 26 mobile strings coded as
  `isTamil ? "English" : "English"` (17 in `today.tsx`) that need Tamil written.
  **2nd opinion:** the SEO titles should pair the Tamil with the Roman term people type ("jathagam",
  "rasi palan"). That is a `<title>`, not screen text, but it is your call (bilingual rule). The 26
  strings are a placeholder bug. Their English goes in a list (Part 5); any Tamil drafted from it still
  needs the reviewer.

---

## 3. Calendar: what you check by hand against a printed almanac

The scripts compare our engine to the 2027 PDF you supplied. They cannot tell us which printed
tradition is right, and nobody has compared the app *screen* to a printed almanac. These need you and
a paper or PDF panchangam.

- [ ] **3A. Get the 2028 almanac before ~15 Sep 2027 (deadline).** Our published month starts cover
  14 Apr 2026 → 12 Jan 2028. A test starts failing about 15 Sep 2027 (120 days before the end), and
  after 12 Jan 2028 every Tamil date falls back to a rule that we know disagrees with the books.
  **Do:** get the 2028 edition of the same publisher (tamildailycalendar.com) or the Gnanananda
  2027-28 edition, and send it. Import takes the same steps as `TAMIL_CALENDAR_2027_IMPORT.md`.
- [ ] **3B. Karinaal from one printed panchangam (OPEN-4).** The current list is one website's 2027
  list plus two days the astrologer restored (Karthigai 7, Margazhi 11). It is labelled PROVISIONAL.
  Before launch it is to be replaced **whole** by one printed Thirukkanitha panchangam's list.
  **Do:** pick one printed panchangam, write down the Karinaal days for all 12 Tamil months, and
  send them with the panchangam's name and year. Note especially Thai (10/16 or 11/17), Karthigai 7
  and Margazhi 11. Do not mix two sources.
- [ ] **3C. Krishna Jayanthi in print, 2023–2033.** Helps the astrologer answer 1A-A. **Do:** from the
  same printed panchangam (or past years' editions), write the printed date for each year. Our two
  candidates per year:

  | Year | Evening date (app today) | Sunrise-Ashtami day | Astrologer's example |
  |---|---|---|---|
  | 2023 | 6 Sep | 7 Sep | 6 Sep |
  | 2025 | 15 Aug | 16 Aug | 15 Aug |
  | 2027 | 24 Aug | 25 Aug | 25 Aug |
  | 2029 | 31 Aug | 1 Sep | 1 Sep |
  | 2030 | 20 Aug | 21 Aug | 21 Aug |
  | 2031 | 9 Aug | 10 Aug | 9 Aug |
  | 2032 | 27 Aug | 28 Aug | 27 Aug |

  (2024, 2026, 2028 and 2033 give the same date either way.)
- [ ] **3D. Varalakshmi 2022 and 2026.** Our doc says 2022 was "5 Aug" from memory only. **Do:** check a
  printed 2022 calendar: 5 Aug or 12 Aug? And for 2026: 21 Aug or 28 Aug? (The app now says 28 Aug.)
- [ ] **3E. Maasi Magam 2026.** **Do:** check your printed 2026 almanac: 2 Mar or 3 Mar? Since 4E the
  app shows 3 Mar only (the engine's day); the stored 2 Mar row is gone.
- [ ] **3F. Aadi Krithigai 2025.** **Do:** printed 2025: 20 Jul or 16 Aug? (The app now says 16 Aug;
  the astrologer's example says 20 Jul.)
- [ ] **3G. Karthigai Deepam 2027.** The app says 11 Dec; the PDF's monthly list says 12 Dec, its own
  festival list 11 Dec. The astrologer said hold the rule (11 Dec). **Do:** nothing unless a second
  printed almanac also says 12 Dec. If one does, tell us.
- [ ] **3H. Look at the screen, one month.** Open the signed-in calendar and the public
  `/tamil-calendar` pages for **one month of 2027** (say Jan 2027: Pongal week, Thai Amavasai, Karinaal,
  Thai Poosam) and compare every row to the printed almanac: Tamil date, Amavasai, Pournami, Ekadasi,
  Pradosham, Sankatahara, Karthigai, festivals, in **both English and Tamil**. Write down any
  difference. The scripts check the engine, not what is shown.
- [x] **3I. Resolved by 4E (23 Oct):** the event pages now read the engine. Was: **The 2026 public
  event pages disagree with the app's own panchangam (FCA-06).**
  `/tamil-calendar` pages for 2026 come from a stored list; the daily panchangam is computed. They
  differ on about 18 observance dates and 71 Tamil dates (e.g. 27 Aug 2026 is "Aavani 11" on one page
  and "Aavani 10" on the other). This needs your decision in 4E; nothing to check by hand.

---

## 4. For you, as owner: decisions and actions

### 4A–4G. Decisions only you can make

- [ ] **4A. Tamil outside the dasa sections (O1).** The release conditions cover only *edited* Tamil.
  The untouched sections still have the reviewer's faults (அல்ல ஆனால் 27×, practice-sense நடைமுறை
  33×, ஒத்தொலிப்பு 8×, தரிசனம் 6×) on 20 pages. **Decide:** extend review to the whole page's Tamil
  (more work before any release), or release with those sections as they are.
  **2nd opinion:** அல்ல ஆனால் is "the most visible defect of the set" and reads as machine
  translation to any native speaker. That argues for at least fixing the four calque classes
  everywhere, even if the rest of the untouched Tamil is not re-read.
- [ ] **4B. Release the 27 nakshatra visual pages, one by one.** All are hidden from Google. A page can
  go out when its five conditions are signed (Tamil reviewer, content reviewer, developer). Nothing is
  signed yet. **Do:** when a page is signed, tell us "release <star>". Suggested order: Dhanishtha,
  Shravana, then Punarvasu, Pushya, Uttara Bhadra, Vishakha. English and Tamil go out together.
- [ ] **4C. Five star names without a bracket.** Aswini, Bharani, Rohini, Swathi, Revathi show no
  "(Sanskrit)" bracket because it would repeat the same name. **Confirm** or say which to change.
  **2nd opinion:** confirm as is. The names are the same in both traditions.
- [ ] **4D. Retire the old Sevvai admin setting.** O-18's `full_cancellation` value no longer does
  anything after the round-two ruling. **Decide:** remove it from the admin options?
- [x] **4E. One source of truth for the public calendar pages (FCA-06). Built 23 Oct.**
  - The 13 event hubs (Pournami … Chandra Darisanam) are read off the same per-day engine as the
    signed-in calendar (`panchangam_events_service._engine_rows`, Chennai sunrise), for any year
    2020–2045. Karinaal keeps its own rule. The stored 2026 table is no longer served; it stays as
    the audit's reference. 2027 is served.
  - **Bigger than FCA-06 recorded.** Since the Q6 ruling (Pournami/Amavasai = sunrise tithi), the
    stored list was wrong on 4 Pournamis and 4 Amavasais in 2026 (e.g. 27 Aug → 28 Aug), plus
    Thiruvonam ×5 and Chandra Darisanam ×6, each a day early.
  - Ashtami/Navami take Q6's "first of two" (an extension: Q6 names only 15 and 30); without it a
    tithi holding two sunrises was listed twice.
  - Maasi Magam (3 Mar) and Varalakshmi (28 Aug): the two curated Hindu rows that disagreed with the
    engine now carry the engine's date, so each shows once. A gate test makes every curated row the
    engine also names follow the engine.
  - Gates: `test_pages_name_the_days_the_monthly_calendar_names` and
    `test_curated_rows_agree_with_the_engine`. Both fail with the fix removed (checked). **Blind
    spot:** both compare the engine with itself through two paths. Neither can say the engine is
    right; that is Part 3's job.
- [ ] **4F. How to show a Tamil date we computed rather than copied from the almanac.** The API already
  says which is which (`tamilDateSource`); no screen shows it. **Decide:** show a small "computed" note,
  or nothing?
- [ ] **4G. Business decisions in BRD §15 (D-1 to D-11).** Price points (₹149/₹999 vs ₹499/₹899), Family
  plan, **Swiss Ephemeris licence (D-3, stop-ship: AGPL or a paid licence, decide with legal before
  launch)**, account age policy, data retention, refunds, astrologer referrals, other languages,
  remedies free or premium, 403 vs 404 for other users' records, visit-streak timezone. Each has a
  recommendation in the BRD.

### 4H–4O. Actions only you can take

- [x] **4H. Pushed 22 Oct; PR #5 CI ran.** Full backend suite **passed**. One job failed: mypy, a
  missing annotation in `panchangam_service._solar_month_observances` (fixed locally, not yet pushed).
  Was: **Push the three local commits.** `cedc602f`, `47f3ccce` and `eed6e5ff` (the calendar audit
  fixes and round-two rulings, the dasa prose rounds five and six, the slim CLAUDE.md) are on your
  machine only. CI has not seen them, and the full backend test suite has never run on the calendar
  changes. **Do:** say "push", and we push and watch CI.
- [x] **4I. Deleted 23 Oct**, on your instruction; the 10 Oct dump was checked complete first.
  Was: **Delete the three old plaintext database dumps.** They hold real birth details unencrypted,
  and everything else in them is test data (`DATA_PROTECTION.md` §3). The tool refused to delete them,
  so it has to be you:
  - `backups/vinaadi_dev_20260630_003648.sql`
  - `db_backups/backup_20260728_1112_pre_e2e_cleanup.sql`
  - `db_backups/backup_20260728_1120_pre_example_domain_cleanup.sql`

  Keep `backups/vinaadi_dev_20261010_0726.sql`: it is the newer encrypted one, already proven to
  restore.
- [ ] **4J. Four numbers for production (Phase 4).** Peak concurrent users, how much data you can afford
  to lose (RPO), how long you can be down (RTO), and the acceptable page/API latency. Also a deployed
  URL. Phase 4 hardening is blocked on these (status as of 10 Oct).
- [ ] **4K. Go-live steps** (`LAUNCH_RUNBOOK_2026-09-26.md` §2; DNS not re-checked today): register
  `vinaadi.com`; create `support@` and `privacy@` mailboxes; PostHog and Firebase keys; Google OAuth
  redirect URI; run migrations; Search Console + sitemap; Bing; test a WhatsApp share preview; for
  mobile, fix the API host in `mobile/eas.json` and set `PLAY_STORE_URL` once the Play listing exists.
- [ ] **4L. Beta test checklist** (runbook §3), after the site is live: sign-up from a tool page,
  acquisition report, 4th profile, Ask limit at 8, referral count, `/pricing` beta note.
- [ ] **4M. Artwork.** Imagery sets B1–B7 are open and waiting for your ChatGPT art. **B6 (deity
  medallions) needs your decision** on whether to show deities at all.
- [ ] **4N. When you want payments** (runbook §4): pick Razorpay and/or Play billing first, then decide
  the features the server cannot enforce yet (vargas, remedies, dasha depth, rasi-palan window), give
  users the notice `/beta` promises, then flip both beta switches together.
- [ ] **4O. Find the reviewers.** Parts 1 and 2 need a named astrologer and a named native Tamil
  reader to sign. Without names, no page can be released (4B).

---

## 5. Engineering still incomplete (no outside input needed)

The developer can do these. Several are blocked only on part 4.

**Run first**
- [x] **Full backend suite on the current tree.** Passed in CI on PR #5 (22 Oct, run 39820758838)
  for the three pushed commits.
- [ ] **CI on the 23 Oct commits.** Pushed (`ea24661c`, `3b0e55e5`), but PR #5 is merged and CI runs
  only on pull requests and on `main`, so nothing ran. Needs a new PR from
  `harden/production-readiness` to `main`. Locally: 304 calendar/festival tests and the web
  tests pass; mypy was not run (not in the test image; blocked on the host).
- [ ] **Regenerate the `daily_guidance` and `life_areas` goldens** for the Mercury bindu fix (F-ASV-01)
  if not already done. Flagged on 13 Oct; not re-checked today.

**Marriage and porutham**
- [ ] **Eka-nakshatra as a separate assessment** (F-POR-03), shown beside Rajju, with **no exception
  applied** until the table arrives (1C). Rajju itself must not be changed.
- [~] **Gana in three grades** (F-POR-01): the six resolved cells can be built; three wait for 1C.
- [ ] **Guru as husband significator in female-chart mode** (F-KAR-01), with male / female / neutral
  modes made explicit. Never swap Venus for Jupiter in a timing formula.
- [ ] **Property in three readings** (land: Mars; home: Moon; acquisition: 2/4/11), keeping the current
  land number unchanged.
- [ ] **Sevvai reduction factors never computed:** strong Sukra, Chandra–Guru in kendra, Guru's aspect
  on the 7th *house*. Leaving them out only makes a chart read harsher, never lighter.
- [ ] **Web porutham tool** does not *require* the "which half of the star" answer for the nine split
  stars, so it may assume the wrong rasi. Mobile requires it but has no render test.

**Calendar and panchangam**
- [ ] **Per-purpose star verdict function** (FSA-02): one function for calendar badge, muhurta, PDF and
  push; purposes without a table say "no sourced ruling". Tradition profile needs a DB column and a
  change on all four API surfaces.
- [x] **Public event pages for 2027. Done 23 Oct.** Event pages read their year from the slug
  (`pournami-2027`). This year and next are prebuilt and in the sitemap; last year still renders;
  any other year is a 404. The hub shows this year (India time) and turns over on 1 January within
  the hour, with a row of links to next year's pages. One helper: `web/lib/tamil-calendar-years.ts`
  (test fails with the IST rule replaced by UTC, checked). **Not year-aware:** the four festival /
  holiday category pages, whose data is curated for 2026 only (FCA-07). On 1 Jan 2027 they drop
  off the hub but stay reachable at their 2026 URLs. **Blind spot:** no render test reads the
  year off a built page; the offline metadata branch is covered by `seo-metadata.test.ts`.
- [~] **Kshaya tithis named on no day** (found by 4E). **Chathurthi done 23 Oct:** Shukla
  Chathurthi now takes §5 (first of two sunrises; none, the day it falls in), on the calendar and
  the event pages. 2026 is back to 12, matching the almanac on 11 (both missing days, 20 Apr and
  17 Jul, now match; 14/15 Sep is the known Vinayagar split). The 2027 audit is unchanged at 10/12
  (11 Jan and 9 May: the almanac prints the day before, a separate convention). Vinayagar
  Chaturthi keeps its own rule. Gate: `test_a_kshaya_chathurthi_names_the_day_it_falls_in`, which
  fails on the old engine (checked). 304 calendar/festival tests pass locally (not authoritative).
  **Blind spot:** it reads the event pages. The signed-in calendar uses the same festival
  function, but no test compares the two for Chathurthi. **Ekadashi still open:** 23 against 24 in 2026; whether a kshaya
  Ekadashi is observed on any day is doctrine. Ask the astrologer.
- [ ] **The other curated categories** (temple days, Agni Nakshatram … 24 of 53 Hindu rows) are 2026
  only and checked against nothing; they vanish on 1 Jan 2027 (FCA-07, unchanged by 4E).
- [ ] **Mobile shows festival names in English in Tamil mode.** Move the Tamil map from
  `web/lib/festival-names.ts` to `packages/shared` and use it on mobile.
- [ ] **Show the computed-date flag** (after 4F).
- [ ] **Krishna Jayanthi: show the midnight window as its own line** beside the printed civil date
  (2nd opinion on 1A-A). The printed date and the hour of worship are two answers. Today one rule
  decides both. Separate them whatever the astrologer rules on the date.
- [ ] **FCA-10:** a birth in polar day/night gets no chart at all, although planets and lagna can be
  computed. **FCA-11:** Sivarathiri reads the tithi at civil midnight, not true midnight (10–20 min off
  in Chennai; matters only on edge days). **FCA-12:** dasa dates are cut in UTC, so a change between
  00:00 and 05:30 IST shows a day early. `personal_palan.py` keeps its own copy of the gochara table.
- [ ] **Muhurta for tonsure (the family that asked, 13 Oct):** the ayana rule (Sun in the northern
  course) is not implemented, and the "3rd, 5th or 7th year" rule cannot work because the picker takes
  no child birth date.

**Checks owed**
- [ ] **Mercury bindus against an independent chart** (F-ASV-01 step 4): all 12 rasi distributions
  against a second engine, not against our own transcription.
- [ ] **Nakshatra page tidy-up:** the 27 unused `entry.meta.title` strings in `natchathiram-data.ts`.

**Tamil prep (makes Part 2 a finite read; drafts only, nothing ships unread)**
- [x] **Condition-3 checklist. Done 23 Oct:** `CONDITION3_LIFE_STAGE_CHECKLIST_2026-10-23.md`. 237
  hits on 27 pages, checked per pada against the engine's ages: 11 FLAG (unconditional, true for
  some padas only), 103 CHECK (67 conditional, 36 whose-stage: the native's children), 123 OK and
  not listed. Generator: `scripts/audit/condition3_life_stage_checklist.mts`. Stage ages are
  working assumptions stated in the doc. **Blind spots:** in the doc (other stage words, bare
  ஓய்வு, conditional detection is a word match).
- [x] **தசகம் → பத்தாண்டு. Drafted 23 Oct:** `TAMIL_DASAKAM_DRAFTS_2026-10-23.md`, 44 sentences
  (45 uses) on 18 pages, each with its English twin. Detector decision: பத்தாண்டு passes like the
  English "decades"; பத்து ஆண்டுகள் is still flagged; both pinned in
  `natchathiram-dasa-prose.test.ts`. Not applied to any page: waits for the reviewer.
- [x] **Mobile placeholders. Drafted 23 Oct:** `MOBILE_TAMIL_PLACEHOLDERS_2026-10-23.md`, 30 (not
  26; 18 in `today.tsx`). 16 reuse Tamil the app already shows, 14 are new. Also found: the brand
  spelled வினாடி 13 times against விநாடி 122; three forms of "Ask Vinaadi"; the teaser chart's
  Tamil label reads the English rasi name. Not applied: waits for the reviewer.

**Growth and launch (from 26 Sep, not re-checked)**
- [ ] GRW-09 per-result share images, GRW-11 daily 6 am push, GRW-12 carry birth details into sign-up,
  GRW-16 welcome email/newsletter, GRW-17 static marketing pages.
- [ ] **Before payments:** web needs an upgrade screen for `PREMIUM_REQUIRED` on Varshaphala, Synastry,
  Retrospective, life-event log and rectification; today it would show a generic error.
- [ ] **Re-check `MASTER_FIX_LIST.md`.** Its September items (SEC-1 to SEC-12, RES-1, AST-1 to AST-6)
  still show `[ ]`, but several were likely fixed in later phases without the marker being updated. A
  sweep is needed before trusting it.

**Low priority, known**
- [ ] Sade Sati rounds (Pongu / Mangu / Marana) not modelled; "marana" must never reach user copy if
  added. Tuesday-night Durmuhurtham not shown.
