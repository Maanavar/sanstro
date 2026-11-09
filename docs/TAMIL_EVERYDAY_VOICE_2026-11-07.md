# Everyday Tamil rewrite: what changed and what is left

**Date:** 2026-11-07. **For:** the owner, who asked for Vinaadi to read like a real
person speaking everyday Tamil, and gave full ownership of the copy.

**Status: rewritten, not native-reviewed.** Claude wrote this copy and is not a native
speaker. No `NATIVE-TAMIL REVIEW PASSED` marker was added, and every existing
`PENDING` marker stays until the owner signs a table off.

## The voice

An educated Tamil person explaining something to one person. Not a textbook, and not
WhatsApp slang. These rules were applied throughout:

1. **One thought per sentence.** Long English-shaped sentences were split.
2. **Everyday words first.** படிப்பு over கற்றல் where studies are meant. கடினமானது over
   விலை. கொஞ்சம் over சற்று. ரகம் over வகை. சின்ன over சிறிய, where the tone allows.
3. **No `X — verb.` em dash** (ruling of 2026-09-17). A semicolon or a new sentence.
4. **Advise, do not order** (rulings of 2026-09-17 and 2026-10-12). தவிர்ப்பது நல்லது,
   not தவிர்க்கவும்.
5. **No "because" tacked on the end.** "ஏனெனில்" after a clause is a calque (rulings §11).
   The sentence now starts காரணம்,.
6. **A jothidar's word for a reading:** பலன், not வாசிப்பு.
7. **Astrology terms stay exact.** தசை, புக்தி, லக்னம், நீசம், நிவர்த்தி, and the locked
   terms in `TAMIL_TERMINOLOGY_GLOSSARY.md` were not simplified.

## What changed

| Surface | Change |
|---|---|
| Personal readings (one and five minute, self and family) | Rewritten, tables and sentence frames |
| Star lens and star cards | Rewritten; "நட்சத்திரத்தினர்" became "நட்சத்திரத்தில் பிறந்தவர்கள்" |
| Emotional tone, planet meanings, peyarchi and verification email | Rewritten |
| Daily palan | **Almost untouched.** It already read naturally; 5 lines and 3 frames changed |

**Left exactly as approved on 2026-08-12:** `_BHUKTI_FLAVOR`, `_GOCHARA_SANI`,
`_SANI_PHASE_NAME`, `_LORD_STRENGTH_NOTE`, and the 18 `action` lines.

**One approved string was changed, please confirm it.** `_AREA_NOUN["FAMILY_HARMONY"]`
went from "வீடும் குடும்பமும்" to "வீடு, குடும்பம்". "வீடும் குடும்பமும் பற்றி" does not
read correctly, and the same word feeds three sentence frames.

### Wrong meanings found and fixed

These were errors, not style. Each said something other than its own English.

| Was | It said | Meant | Now |
|---|---|---|---|
| சனி கோணல் நிலையில் | Saturn is crooked | Saturn is angular | சனி கேந்திரத்தில் இருக்கிறார் |
| பெரிய கட்டுப்பாடுகளை தவிர்க்கவும் | avoid restrictions | avoid commitments | பெரிய பொறுப்புகளை ஏற்காமல் |
| அடக்கமின்மையை கட்டுப்படுத்தவும் | curb immodesty | manage stubbornness | பிடிவாதத்தைக் குறைத்துக்கொள்வது நல்லது |
| அதிகமாக செலவழிக்கும் போக்கை | overspending | over-giving | அளவுக்கு மீறிக் கொடுப்பதை |
| சுயமரியாதை விஷயங்களில் கவனம் | self-respect | self-care | உங்களையும் கவனித்துக்கொள்வது நல்லது |
| நமனீயத்தன்மை, கடக்கமான | not Tamil words | flexibility, secretive | rewritten |

Raw codes also reached Tamil readers in the "show the astrology" lines and are gone:
`BIRTH_CERTIFICATE`, `FAMILY_HARMONY`, and rasi numbers such as `லக்னம் ராசி 12`.

Limit messages on web and mobile reports still said பயன்படுத்திவிட்டீர்கள், which the
2026-10-12 review ruled out. A Tamil line still printed "11:53 am". Both fixed.

## For you to check

**1. Star symbols (you are the astrologer).** The Tamil contradicted its own English, so
it now follows the English. Traditions differ, and the English table is not a ruling.

| Star | Was | Now |
|---|---|---|
| ரேவதி | மீன் / டம்ளர் | இரட்டை மீன்கள் / மேளம் |
| உத்திரம் | கட்டில் / சுண்டெலி | கட்டில் / கட்டிலின் பின்கால்கள் |
| சுவாதி | மூங்கில் துளி / மதிமயக்கம் | காற்றில் அசையும் இளந்தளிர் |
| மூலம் | வேர்களின் கட்டு / அரியாசனம் | வேர்க்கட்டு / சிங்கத்தின் வால் |
| கேட்டை | வளையல் / குடை | காதணி / குடை |
| பூசம் | கன்றுக்குட்டி / மடல் | பசுவின் மடி / அம்பு |
| அவிட்டம் | யானை தந்தம் / யானை தலை | யானைத் தந்தம் / மேளம் |

Also lightly corrected: திருவாதிரை, புனர்பூசம், மகம், பூரம், சித்திரை, விசாகம், பூராடம்,
உத்திராடம், திருவோணம், பூரட்டாதி, உத்திரட்டாதி.

**2. Word choices to overrule if they feel wrong.**

- இரண்டாவது **ரகம்** (was வகை). Warmer, but less formal.
- உங்களுக்குக் **கடினமானது** (was விலை என்பது), for "where it costs you".
- **ஜென்ம** நட்சத்திரம் (was ஜன்ம). ஜன்ம சனி was left alone, because that display name is
  shared across the product. The split already existed; pick one if you want it gone.

**3. How to read it.** Read the Tamil alone and ask whether anyone would say it that way.
Then sign off a table with a dated `NATIVE-TAMIL REVIEW PASSED` marker.

## Not done yet

About 20,000 Tamil lines exist outside `artifacts/`. This pass covered the 1,158-string
sheet plus the product-wide trap sweep. Suggested order:

| # | Surface | Why |
|---|---|---|
| 1 | `narrative_engine.py`, `life_areas_service.py`, `chart_explanation_service.py` | Read daily, longest prose |
| 2 | `web/lib/guide-detail-content.ts`, `web/lib/marketing-i18n/` | Public pages, including live SEO pages |
| 3 | `web/lib/i18n.ts`, `dashboard-i18n.ts`, `packages/shared/src/i18n/strings.ts`, mobile | Buttons and labels; short, mostly fine |
| 4 | Muhurta, porutham explanations, `age_phase_service.py` | Partly reviewed before |
| 5 | The 27 star pages and `natchathiram-data.ts` | The weakest Tamil in the product, hidden from Google |

Item 5 still holds the defects the rulings name: அல்ல ஆனால் (18), ஒத்தொலிப்பு (5),
தசகம் forms (41). Those pages need rewriting, not patching.

`மற்றும்` appears 1,186 times. Most should become -உம் or a comma, by hand, as each
surface is rewritten. A mechanical replace would break grammar.

## Blind spots

`tests/test_tamil_everyday_voice.py` proves the listed phrases stay gone and that no
family-member line addresses the reader as "you". It failed on the old code. It cannot
tell whether a sentence sounds natural; only a Tamil reader can.
