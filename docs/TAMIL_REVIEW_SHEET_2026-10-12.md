# Tamil Review Sheet — 2026-10-12

> ## Review APPLIED — 2026-10-12/13
>
> The owner returned final rulings for A–D. They were applied as an owner
> ruling. The review's citations carry chatgpt.com referral tags, so it may be
> AI-assisted; a human native read has not been recorded. The locked terms and
> voice rules are now in `docs/TAMIL_TERMINOLOGY_GLOSSARY.md`.
>
> **A (limit message):**
> - "இந்த மாதத்திற்கான {n} கேள்விகளையும் கேட்டுவிட்டீர்கள்."
> - "{when} மீண்டும் கேட்கலாம்."
> - Times read "… மணிக்குப் பிறகு".
> - 00:00 is நள்ளிரவு 12:00; 00:01–05:59 is அதிகாலை. So Dhaka now reads
>   "நாளை அதிகாலை 12:30 மணிக்குப் பிறகு".
> - Kolkata reads "நாளை மீண்டும் கேட்கலாம்."
>
> **B (porutham):** B-01 to B-03 are used verbatim, with the common closing
> line. B-02 is used for both-failed at any count from 4.5 up, and closes on its
> own advice. The English twins were rewritten to say the same thing ("needs
> extra care", no "verdict").
>
> **C:** ரஜ்ஜு and வேதை are applied across the engine, synastry, PDF,
> methodology page, calculator FAQ and copy, and the dashboard, synastry,
> compatibility and mobile learn screens. A repo-wide grep finds only the
> protected Veda words.
>
> **D:**
> - The badge "தோஷம்: கவனம் தேவை" ("Dosham: needs care") is used in all three
>   places.
> - The dashboard reason chip reads "ரஜ்ஜு / வேதை பொருத்தம் இல்லை", following
>   the review's badge table.
> - The dashboard blocker note says "பொருத்தம் இல்லை", not "பொருந்தவில்லை".
>
> **Judgment calls made while applying, for the owner to confirm:**
> 1. A-01's "கேட்டுவிட்டீர்கள்" was also applied to the daily line
>    ("இன்றைக்கான {n} கேள்விகளையும் கேட்டுவிட்டீர்கள்."), and A-09's "கேட்கலாம்"
>    to the upgrade clause ("மேம்படுத்தலாம்"). The review's reasons cover both,
>    but it did not name them.
> 2. The review's full time-of-day table (நண்பகல் 12:00–12:59, மாலை to 17:59)
>    was **not** applied app-wide. It would override the 2026-09-17 ruling for
>    every time label. Only the small-hours rule is applied, and only in this
>    message.
> 3. The review suggested separate badges per reason. The dashboard already
>    pairs the verdict badge with a reason chip, which now names the failed
>    check. When both fail, it names both: "ரஜ்ஜு, வேதை பொருத்தம் இல்லை". The
>    blocker note then explains both checks rather than only Rajju. The
>    calculator's grid chips keep "ரஜ்ஜு தோஷம் / வேதை தோஷம்", which are approved
>    terms.
> 4. **"கூடுதல் ஆய்வு தேவை" (additional review required) was not built.** The
>    engine has no state that would trigger it, and choosing one is a doctrine
>    call: it decides when star matching alone is inconclusive. Two candidates
>    are recorded for the owner or astrologer:
>    - (a) a Nadi dosham only partly cancelled under the strict rule;
>    - (b) a birth star split across two rasis, with the reader's quarter
>      unknown, so the rasi is assumed.
>
>    Until then, every vetoed result already ends with the "experienced
>    astrologer" review line.
>
> **Guard:** `web/lib/tamil-terminology-lock.test.ts` fails if a retired
> spelling or the old badge returns anywhere in web, mobile or shared source.
> With the old badge restored in `PoruthamTool.tsx`, it named that file for
> both the Tamil and the English form.

Every Tamil string **added or changed** on 2026-10-12, plus two spelling splits
and one wording decision found while making those changes. No native Tamil
reader has seen any of it.

**How to use:** work down the ID column. For each row, mark `OK` or write the
correction in the Verdict column. Placeholders such as `{n}` and `{time}` are
filled in at runtime.

Sections:

- **A** — Ask Vinaadi limit message (new)
- **B** — Porutham summary when Rajju/Vedha fails (new, KI-01)
- **C** — Two terms each spelled two ways (decide one spelling per term)
- **D** — For the owner: the "Dosham" badge

---

## A. Ask Vinaadi: "you have used your questions"

The daily question limit resets at midnight India time, so outside India it is
not "tomorrow". The message now gives the reset time in the reader's own clock.
Source: `packages/shared/src/askAllowance.ts`, shown on web and mobile.

The time words (காலை / மதியம் / மாலை / இரவு, placed before the number) follow
the 2026-09-17 ruling. **A-05 and A-06 are new:** that ruling did not cover
midnight to 5 am.

| ID | Tamil | English meaning | When shown | Verdict |
|---|---|---|---|---|
| A-01 | இந்த மாதத்தின் {n} கேள்விகளையும் பயன்படுத்திவிட்டீர்கள். | You've used this month's {n} questions. | Premium (monthly allowance) | |
| A-02 | {used} {when} மீண்டும் கேளுங்கள். | {used} Ask again {when}. | Sentence frame. `{used}` is A-01, or the existing daily line "இன்றைய {n} கேள்விகளையும் பயன்படுத்திவிட்டீர்கள்." | |
| A-03 | இன்று {time} முதல் | from {time} today | Reset later today. Example: "இன்று மதியம் 2:30 முதல் மீண்டும் கேளுங்கள்." (New York) | |
| A-04 | நாளை {time} முதல் | from {time} tomorrow | Reset tomorrow, at 5 am or later | |
| A-05 | நாளை அதிகாலை {h:mm} முதல் | from {h:mm} am tomorrow | Reset tomorrow, 1:00–4:59 am. Example: "நாளை அதிகாலை 2:30 முதல்" (Singapore). **"நாளை இரவு 2:30" was avoided because it reads as tomorrow night.** | |
| A-06 | நாளை நள்ளிரவு 12:{mm} முதல் | from 12:{mm} am tomorrow | Reset tomorrow, 12:01–12:59 am (for example, Bangladesh) | |
| A-07 | {month} {day} முதல் | from {day} {month} | Monthly allowance renews. Example: "நவம்பர் 1 முதல் மீண்டும் கேளுங்கள்." | |
| A-08 | ஜனவரி, பிப்ரவரி, மார்ச், ஏப்ரல், மே, ஜூன், ஜூலை, ஆகஸ்ட், செப்டம்பர், அக்டோபர், நவம்பர், டிசம்பர் | January … December | Month names used in A-07 | |
| A-09 | இப்போது | now | Fallback only; should rarely be seen | |
| A-10 | சரி | Got it | Button that closes the limit box (web). It replaced "நாளை முயற்சிக்கவும்", which was wrong outside India. | |

India and Sri Lanka still see the original sentence, unchanged:
"இன்றைய 7 கேள்விகளையும் பயன்படுத்திவிட்டீர்கள். நாளை மீண்டும் கேளுங்கள்."

Removed, nothing to review: "நாளை மீண்டும் முயற்சிக்கவும்." was dropped from
the general "daily limit reached" error message.

---

## B. Porutham summary when Rajju or Vedha fails (KI-01)

**The defect.** A match with a good count but a failed Rajju was labelled
CAUTION and badged "Dosham - Avoid". Its summary still opened with
"பாரம்பரியமாக ஏற்புடைய திருமணமாக கருதப்படுகிறது" ("traditionally considered a
suitable match").

**The new summaries.** Source: `app/calculations/porutham.py`, shown in the
public calculator, the dashboard tool and mobile. Each is followed by the
existing ⚠ Rajju/Vedha warning, which is unchanged.

| ID | Tamil | English meaning | When shown | Verdict |
|---|---|---|---|---|
| B-01 | தமிழ் 10 பொருத்தம்: {n}/10 — பெரும்பாலான பொருத்தங்கள் அமைகின்றன; ஆனால் ராஜ்ஜு பொருந்தவில்லை. நல்ல எண்ணிக்கை இதை ஈடுசெய்யாது என்பது மரபு; எனவே முடிவு: கவனம் தேவை. ஜோதிடர் இரு ஜாதகங்களையும் முழுமையாகப் பார்த்தே முடிவு சொல்வார். | Most poruthams agree, but Rajju does not. Tradition does not let a good count offset it, so the verdict is caution. An astrologer would read both full charts before concluding anything. | Count 6.5–10, Rajju failed | |
| B-02 | … ஆனால் ராஜ்ஜு, வேதம் இரண்டும் பொருந்தவில்லை. நல்ல எண்ணிக்கை இவற்றை ஈடுசெய்யாது … | … but both Rajju and Vedha do not match. A good count does not offset them … | Count 6.5–10, both failed. Otherwise identical to B-01. | |
| B-03 | தமிழ் 10 பொருத்தம்: {n}/10 — ராஜ்ஜு பொருந்தவில்லை; மொத்த எண்ணிக்கையும் நடுத்தரமே. எனவே பாரம்பரிய முடிவு: கவனம் தேவை. ஜோதிடர் இரு ஜாதகங்களையும் முழுமையாகப் பார்த்தே முடிவு சொல்வார். | Rajju does not match, and the count alone is moderate, so the traditional verdict is caution. An astrologer would read both full charts before concluding anything. | Count 4.5–6, Rajju failed. With both failed it reads "ராஜ்ஜு, வேதம் இரண்டும் பொருந்தவில்லை". | |

**Please check specifically:**

1. **முடிவு appears twice:** "முடிவு: கவனம் தேவை" and then "முடிவு
   சொல்வார்". Does the repetition read badly?
2. **B-01 says "முடிவு" and B-03 says "பாரம்பரிய முடிவு".** Should they match?
3. **"ராஜ்ஜு, வேதம் இரண்டும்" (B-02).** Is this natural for "both Rajju and
   Vedha"?
4. **The last sentence in B-01 and B-03 is not new.** It already appeared on the
   dashboard, where it was itself marked pending review, and now appears in
   all three places. It is listed here so the reviewer approves it once.

The spellings ராஜ்ஜு and வேதம் in B-01 to B-03 follow the engine's current
names. They change automatically with whatever Section C decides.

Low counts (below 4.5) keep their existing summary, so there is nothing to
review there.

Removed from the dashboard, nothing to review: the sentence "ஜோதிடர் இரு
ஜாதகங்களையும் முழுமையாகப் பார்த்தே முடிவு சொல்வார்." moved from the
dashboard's blocker note (`web/lib/dashboard-i18n.ts`) into B-01 to B-03, so
the dashboard no longer says it twice.

---

## C. Two terms, each spelled two ways

On one porutham result a reader can see both spellings: for example, the kuta
table says one and the badge says the other. **Pick one spelling for each
term.** A follow-up change will then apply it everywhere.

### C-01 Vedha porutham: வேதம் or வேதை?

வேதம் is also the word for *Veda*, the scripture. வேதை is the usual almanac
term ("வேதைப் பொருத்தம்").

| Spelling | Where | Verdict |
|---|---|---|
| **வேதம்** / **வேத தோஷம்** / **வேத ஜோடி** (porutham sense) | Engine kuta name and ⚠ warning (`app/calculations/porutham.py` :722, :879, :1056); PDF export (`app/services/pdf_export_service.py:87`); synastry descriptions (`app/services/synastry_service.py:567, :575`); synastry panel (`web/components/dashboard-synastry-panel.tsx:89, :748`); compatibility panel badge (`web/components/compatibility-intelligence-panel.tsx:487`); dashboard porutham chip (`web/components/dashboard-tools-porutham-nova.tsx:515`); methodology page (`web/app/(marketing)/trust/methodology/page.tsx:148`); calculator FAQ (`PoruthamPageContent.tsx:21`); porutham tool copy (`web/lib/marketing-i18n/tool-porutham.ts:38`) | |
| **வேதை** / **வேதை தோஷம்** | Calculator chips and legend (`PoruthamTool.tsx:508, :611, :641`); calculator page (`PoruthamPageContent.tsx:105`); dashboard blocker note (`web/lib/dashboard-i18n.ts:375`); tools tab (`dashboard-tools-tab-nova.tsx:373`); marketing copy (`marketing-i18n/home.ts:155, :222`; `tool-porutham.ts:10`; `marketing-seo-ta.ts:29`); mobile learn page (`mobile/app/learn/[slug].tsx:218`) | |

Not affected: ஆயுர்வேதம் (nakshatra pages), கர்ணவேதம் (muhurta ear-boring)
and the name meaning "வேதம்" in the name corpus all mean Veda, and stay as they
are.

### C-02 Rajju: ராஜ்ஜு or ரஜ்ஜு?

| Spelling | Count | Where | Verdict |
|---|---|---|---|
| **ராஜ்ஜு** | 10 | Engine summary and warning (`porutham.py`); synastry service; synastry panel (one of three); dashboard porutham chip; mobile learn page | |
| **ரஜ்ஜு** | 28 | Calculator (`PoruthamTool.tsx`, `PoruthamPageContent.tsx`); dashboard blocker note; methodology page; marketing and learn copy; PDF export; compatibility panel; nakshatra content | |

The engine uses the minority spelling, and its warning appears right under the
calculator's "ரஜ்ஜு தோஷம்" chip.

---

## D. For the owner: the "Dosham" badge

Shown in red at the top of a result when Rajju or Vedha fails, in the public
calculator and the dashboard porutham tool:

| Tamil | English | Where |
|---|---|---|
| தோஷம் — தவிர்க்கவும் | Dosham - Avoid | `PoruthamTool.tsx:112` and `:576` (legend, with ⚠); `dashboard-tools-porutham-nova.tsx:495` |

**Why it is flagged.** The 2026-09-17 Tamil ruling says:

- advice is advisory (…ப்பது நல்லது), not imperative (…க்கவும்);
- no "X — verb" dash construction in Tamil.

This badge uses both. It also says "avoid" while the engine's label and the new
summary say "caution" (கவனம் தேவை).

**Why it was left alone.** The August 2026 UX pass (A-029 / B-024) deliberately
kept the verdict wording and added a softening note beside it. A Rajju or Vedha
failure is also traditionally a rejection, so "avoid" is defensible as doctrine.

**Options:**

| Option | Tamil | Note |
|---|---|---|
| 1. Keep | தோஷம் — தவிர்க்கவும் | Strongest; conflicts with the ruling |
| 2. Advisory | தோஷம்: தவிர்ப்பது நல்லது | Same meaning, ruling-compliant voice |
| 3. Match the label | தோஷம்: கவனம் தேவை | Agrees with the CAUTION label and the summary; softer than tradition |

My recommendation is **option 2**. It keeps the doctrinal strength and fixes the
voice. English "Dosham - Avoid" could stay, or become "Dosham — best avoided".

Decision: ______
