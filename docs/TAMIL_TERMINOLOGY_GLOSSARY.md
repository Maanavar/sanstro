# Tamil terminology glossary

The spellings and phrasings Vinaadi has **locked** for Tamil text. Use these
in every surface: backend, web, mobile, PDF and marketing. A new Tamil string
that names one of these concepts must use the form below.

Each entry names the ruling that locked it. Change an entry only by a new
ruling, and record that ruling here.

## Porutham

Locked by the native review of 2026-10-12
(`docs/TAMIL_REVIEW_SHEET_2026-10-12.md`, C-01 and C-02).

| Concept | Use | Not | Why |
|---|---|---|---|
| Rajju | **ரஜ்ஜு** | ராஜ்ஜு | The common Tamil-astrology form. The other spelling exists but is the minority. |
| Rajju porutham | ரஜ்ஜு பொருத்தம் | | |
| Rajju dosham | ரஜ்ஜு தோஷம் | | |
| Rajju failed / passed | ரஜ்ஜு பொருத்தம் இல்லை / உள்ளது | ரஜ்ஜு பொருந்தவில்லை | "பொருத்தம் இல்லை" is clearer |
| Vedhai | **வேதை** | வேதம் | வேதம் means the Veda, the scripture |
| Vedhai porutham | வேதைப் பொருத்தம் | | Doubled ப் in the compound |
| Vedhai dosham | வேதை தோஷம் | வேத தோஷம் | |
| Vedhai failed / passed | வேதை பொருத்தம் இல்லை / உள்ளது | | |

**Do not change:** ஆயுர்வேதம், கர்ணவேதம், ரிக் வேதம், or the name meaning
"வேதம்" in `app/data/tamil_name_corpus.py`. These mean the Veda, not the
porutham.

Two tests guard these forms:

- `tests/test_porutham.py::test_locked_tamil_terms_rajju_and_vedhai` covers the
  engine's kuta names and every porutham summary.
- `web/lib/tamil-terminology-lock.test.ts` covers web, mobile and shared
  source. It fails on ராஜ்ஜு, a standalone வேதம், வேத தோஷம், and the retired badge
  in either language.

Backend copy outside the porutham engine (for example the PDF and synastry
services) has no guard; grep it after edits.

## Voice for a dosham or a failed porutham

From the same review (D-01 and the closing recommendation):

- **State the finding and advise. Never decide for the family.** Write
  "ரஜ்ஜு பொருத்தம் இல்லை … ஆராய்வது நல்லது", not "இந்தத் திருமணத்தைத்
  தவிர்க்கவும்".
- **Verdict badge:** **தோஷம்: கவனம் தேவை** (English: "Dosham: needs care"). It
  replaced "தோஷம் — தவிர்க்கவும்".
- **No outcome claims,** such as a spouse's death or a failed marriage.
  EC-RULING-06 excises these, and `tests/test_tone_compliance.py` enforces it.
- **No "முடிவு:" label** in porutham summaries.
- **The one closing line,** shared by every surface: "திருமணம் குறித்து
  முடிவெடுப்பதற்கு முன், நட்சத்திரப் பொருத்தங்களுடன் இருவரின் முழு
  ஜாதகங்களையும் அனுபவமுள்ள ஜோதிடரிடம் ஆராய்வது நல்லது."

## Product voice for limits and openings

From the same review (A-01 and A-09):

- Use **கேட்கலாம்** ("you may ask"), which offers an opening, rather than the
  instruction கேளுங்கள்.
- Say **கேள்விகளையும் கேட்டுவிட்டீர்கள்** ("you have asked"), not the
  translated "பயன்படுத்திவிட்டீர்கள்" ("you have used").

## Time of day

The app-wide rule is the 2026-09-17 ruling, implemented in
`packages/shared/src/utils/format.ts` `tamilDayPeriod`. The period word comes
before the number, and the Latin "am"/"pm" is never used:

| Hours | Word |
|---|---|
| 05:00–11:59 | காலை |
| 12:00–15:59 | மதியம் |
| 16:00–18:59 | மாலை |
| 19:00 onward | இரவு |

**Small hours (2026-10-12 review, A-04 to A-06):**

- 00:00 is **நள்ளிரவு 12:00**.
- 00:01–05:59 is **அதிகாலை**.
- "நாளை நள்ளிரவு 12:30" and "நாளை இரவு 2:30" are ambiguous: they can be read as
  tomorrow night.
- **Applied so far only in the Ask Vinaadi reset message**
  (`packages/shared/src/askAllowance.ts`).

**Open for the owner:** the review's table also places நண்பகல் at 12:00–12:59
and stretches மாலை to 17:59. Adopting it app-wide would override the
2026-09-17 ruling for every time label, so it has not been done.

## Earlier rulings, recorded elsewhere

- **Panchangam names** follow Tamil almanac forms, not Sanskrit respelled. For
  example, karanam பத்திரை, not விஷ்டி. Source of truth:
  `packages/shared/src/i18n/panchangam-names.ts` (owner, 2026-07-20).
- **Transit** is கோச்சாரம்.
- **Active language only:** no bilingual title echo.
