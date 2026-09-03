# Tamil + English Review Sheet — 2026-07-18

> ## Round 1 review APPLIED — 2026-07-18
>
> A native-Tamil reviewer returned corrections for 14 IDs. All are applied.
> Gates re-run green: web tsc clean, 176 vitest, eslint clean, 41 Python
> explanation/bilingual tests.
>
> **Two were terminology decisions, applied globally rather than only in the
> flagged rows:**
> - `இடப்பலம்` / `இட பலம்` → **`கிரக பலம்`** — affected T-05, T-06, T-07, T-08,
>   T-12, T-13. Verified zero occurrences of the old term remain anywhere in
>   `app/`, `web/` or `packages/`.
> - `அஸ்தங்கதம்` → **`அஸ்தங்கம்`** — flagged on T-09, but the same word also
>   appeared inside T-13's body, so it was corrected there too. Zero occurrences
>   of the old spelling remain.
>
> `இது ராசி அதிபதி அல்ல;` → `இது எந்த ராசிக்கும் அதிபதி இல்லாத சாயா கிரகம்;`
> applied across all seven of T-14…T-20. Re-scanned for Devanagari
> contamination: clean.
>
> **One open question for round 2 — see "Open after round 1" at the end.**

Every user-facing string **added or changed** in the astrologer-review pass
(`docs/ASTROLOGER_REVIEW_RESPONSE_2026-07-18.md`). Nothing here has been seen by
a native Tamil reader or rendered in a browser.

**How to use:** work down the ID column. For each row mark `OK`, or write the
correction in the Verdict column. Both languages need checking — the English is
new copy too, not just a translation target.

**Known risk:** while authoring these, Devanagari characters leaked into one
Tamil string (`நைसर்கிக` → corrected to `நைசர்கிக`). Please watch for mixed
script, and for Sanskrit-via-Devanagari spellings of technical terms.

Placeholders: `{planet}`, `{rasi}`, `{n}`, `{house}`, `{bindus}` are substituted
at runtime.

---

## A. Yoga cancellation status (new tri-state)

Files: `packages/shared/src/yogaDisplay.ts`, `web/components/dashboard-explore-yogam-nova.tsx`

| ID | Where | Tamil | English | Note for reviewer | Verdict |
|---|---|---|---|---|---|
| T-01 | Yoga status chip | உள்ளது | Present | unchanged, listed for context | |
| T-02 | Yoga status chip | இல்லை | Absent | unchanged, listed for context | |
| T-03 | Yoga status chip | **நிவர்த்தி** | **Cancelled** | NEW. Yoga formed but annulled by bhanga. Is நிவர்த்தி right for a *yoga* being cancelled, or is it too dosham-flavoured? | |
| T-04 | Yoga detail hero badge | **அமைந்தது — ஆனால் நிவர்த்தியால் ரத்து** | **Formed, but cancelled by bhanga** | NEW. Longer form of T-03. "ரத்து" may be too legal/administrative — alternative wanted | |

---

## B. Planet strength & score semantics

File: `app/services/chart_explanation_service.py`, `web/components/dashboard-chart-explanation.tsx`

| ID | Where | Tamil | English | Note for reviewer | Verdict |
|---|---|---|---|---|---|
| T-05 | Summary row label | **இடப்பலத்தில் முதலிடம்** | **Strongest by position** | NEW. Was "மிக வலுவான கிரகம் / Strongest planet". Does இடப்பலம் read correctly for *positional* (Shadbala) strength as opposed to benefic capacity? | |
| T-06 | Summary row label | **இடப்பலத்தில் கடைசி** | **Lowest by position** | NEW. Was "ஆதரவு தேவைப்படும் கிரகம் / Planet needing support" | |
| T-07 | Summary positive | **{planet} இடம்/பலம் அடிப்படையில் அதிக மதிப்பெண் பெற்ற கிரகம்; அதன் வீட்டு துறை ஆதரவாக இயங்கும்.** | **{planet} scores highest on positional strength; its house themes can act as a support channel.** | REWORDED | |
| T-08 | Summary caution | **{planet} இடப்பலத்தில் மிகக் குறைந்த மதிப்பெண் பெற்றுள்ளது; அந்த துறையில் மெதுவான திட்டம் நல்லது.** | **{planet} scores lowest on positional strength; a slower plan helps that area.** | REWORDED | |
| T-09 | Caveat, combust | **அஸ்தங்கதம் (சூரியனுடன் சேர்ந்து எரிந்த நிலை)** | **combust (astangata), burnt by closeness to the Sun** | NEW fragment | |
| T-10 | Caveat, debilitated | **நீச ராசி** | **debilitated by sign** | NEW fragment | |
| T-11 | Caveat, enemy sign | **பகை ராசி** | **placed in an enemy sign** | NEW fragment | |
| T-12 | Strongest-planet caveat | **ஆனால் {planet} {reasons} நிலையில் உள்ளது. இடப்பலம் என்பது வேறு; பலனைத் தரும் திறன் என்பது வேறு. இந்த கிரகத்தின் நல்ல பலன்கள் தாமதமாகவோ, முழுமையின்றியோ வெளிப்படலாம்.** | **Note, however, that {planet} is {reasons}. Positional strength and the capacity to deliver benefic results are different axes — this planet holds the position but may deliver its good results late or incompletely.** | NEW. The whole point of the fix — this is the sentence that stops a combust planet reading as "strongest" without qualification | |
| T-13 | Score scale note | **மதிப்பெண் விளக்கம்: 0-100 என்பது ஷட்பல முறையை ஒட்டிய *இட பலம்* — ஸ்தான, திக், கால, சேஷ்ட, நைசர்கிக, திருக் ஆகிய ஆறு கூறுகளின் கூட்டு. இது கிரகம் எவ்வளவு உறுதியாக நிற்கிறது என்பதை சொல்கிறது; அது தரும் பலன் நல்லதா கெட்டதா என்பதை அல்ல. அதற்கு ராசி நிலை, அஸ்தங்கதம், செயல்பாட்டு தன்மை ஆகியவற்றையும் சேர்த்துப் பார்க்க வேண்டும். தோராயமாக: 70+ வலிமை, 45-69 மிதமானது, 45க்கு கீழ் ஆதரவு தேவை.** | **About this score: 0-100 measures *positional strength* on a Shadbala-style composite of six components (sthana, dik, kala, chesta, naisargika, drik). It says how firmly a planet stands, not whether its results will be good — dignity, combustion, and functional nature decide that, and are read alongside it. As a guide: 70+ strong, 45-69 moderate, below 45 needs support.** | NEW, longest string in the set. **This is where the Devanagari leak was.** Please check all six component names: ஸ்தான / திக் / கால / சேஷ்ட / நைசர்கிக / திருக் | |

---

## C. Rahu / Ketu functional nature (lordship wording)

File: `app/services/chart_explanation_service.py`. All NEW — shown only for Rahu/Ketu.
Each renders after "It is …" in English.

| ID | Nature | Tamil | English | Verdict |
|---|---|---|---|---|
| T-14 | YOGAKARAKA | இது ராசி அதிபதி அல்ல; ஆனால் யோககாரக பலம் உள்ள இடத்தில் அமர்ந்து அந்த பலனை வலுப்படுத்துகிறது | a shadow graha that owns no sign; it sits with Yogakaraka strength and amplifies that result rather than ruling it | |
| T-15 | LAGNA_LORD | இது ராசி அதிபதி அல்ல; லக்ன அதிபதியின் வழியாக செயல்பட்டு வாழ்க்கை திசையைத் தொடுகிறது | a shadow graha that owns no sign; it acts through the Lagna lord and colours life direction | |
| T-16 | TRIKONA | இது ராசி அதிபதி அல்ல; திரிகோண ஸ்தானத்தில் அமர்ந்து புண்ணிய, வளர்ச்சி துறைகளைத் தொடுகிறது | a shadow graha that owns no sign; it occupies a Trikona house, touching grace, talent, and growth | |
| T-17 | KENDRA | இது ராசி அதிபதி அல்ல; கேந்திர ஸ்தானத்தில் அமர்ந்து வெளிப்படையான செயல்பாட்டைத் தொடுகிறது | a shadow graha that owns no sign; it occupies a Kendra house, touching visible action and responsibility | |
| T-18 | DUSTHANA | இது ராசி அதிபதி அல்ல; துஷ்டான ஸ்தானத்தில் அமர்ந்திருப்பதால் அந்த துறையில் ஒழுங்கும் கவனமும் தேவை | a shadow graha that owns no sign; it occupies a Dusthana house, so those matters ask for care and discipline | |
| T-19 | MARAKA | இது ராசி அதிபதி அல்ல; மாரக ஸ்தானத்தில் அமர்ந்திருப்பதால் கட்டுப்பாட்டுடன் அணுகுவது நல்லது | a shadow graha that owns no sign; it occupies a Maraka house, best handled with restraint and proportion | |
| T-20 | NEUTRAL | இது ராசி அதிபதி அல்ல; சாயா கிரகமாக அது அமர்ந்த வீடு மற்றும் அதிபதியின் வழியே பலன் தருகிறது | a shadow graha that owns no sign; it delivers through the house it occupies and that house's lord | |

> **Doctrinal question for the astrologer, not just the translator:** is
> "ராசி அதிபதி அல்ல" (owns no sign) the clearest way to say this, or would
> "வீட்டு அதிபத்தியம் இல்லை" be more precise? The repeated opening clause on all
> seven may also read as heavy — a shorter shared prefix is an option.

---

## D. Navamsa (D9) facet — NEW, always shown

File: `app/services/chart_explanation_service.py`

| ID | Case | Tamil | English | Verdict |
|---|---|---|---|---|
| T-21 | Facet label | நவாம்ச நிலை | In the Navamsa (D9) | |
| T-22 | Vargottama | நவாம்சத்திலும் அதே {rasi} ராசி — வர்கோத்தமம். ராசியில் தெரியும் பலன் நவாம்சத்திலும் உறுதிப்படுகிறது; இது நிலைத்தன்மையைக் குறிக்கும். | Same sign ({rasi}) in the Navamsa — vargottama. What the Rasi chart promises is confirmed in the D9, which points to stability and follow-through. | |
| T-23 | D9 dignified | நவாம்சத்தில் {rasi} — வலுவான நிலை. ராசியில் உள்ள வாக்குறுதி நவாம்சத்தில் ஆதரவு பெறுகிறது; பலன் முழுமையாக வெளிப்பட வாய்ப்பு உண்டு. | In the Navamsa it occupies {rasi}, a dignified position. The Rasi promise is supported in the D9, so its results have a better chance of arriving in full. | |
| T-24 | D9 debilitated | நவாம்சத்தில் {rasi} — நீச நிலை. ராசியில் வலுவாகத் தெரிந்தாலும் நவாம்சம் அதை ஆதரிக்கவில்லை; பலன் தாமதமாகவோ குறைவாகவோ வரலாம். இதுதான் **'பெயரில் பலம், பலனில் பலவீனம்'** எனும் நிலை. | In the Navamsa it falls in {rasi}, a debilitated position. Even where the Rasi chart looks strong, the D9 does not back it — results can arrive late or partially. This is the classical **'strong in name, weak in effect'** case. | |
| T-25 | D9 neutral | நவாம்சத்தில் {rasi} — நடுநிலை. ராசி நிலையை நவாம்சம் கூட்டவும் இல்லை, குறைக்கவும் இல்லை. | In the Navamsa it occupies {rasi}, a neutral placement — the D9 neither strengthens nor undercuts what the Rasi chart shows. | |

> **T-24 needs an astrologer, not only a translator.** I coined
> "பெயரில் பலம், பலனில் பலவீனம்" as a rendering of the classical idea. If a
> standard Tamil phrasing exists for this, use that instead.

---

## E. Bhava (per-house) section — NEW

File: `app/services/chart_explanation_service.py`

| ID | Where | Tamil | English | Verdict |
|---|---|---|---|---|
| T-26 | House w/ occupants | {planets} இந்த வீட்டில் அமர்ந்துள்ளது. | {planets} occupies it. | |
| T-27 | Empty house | இந்த வீட்டில் எந்த கிரகமும் இல்லை — அதிபதியின் நிலையும் விழும் பார்வைகளும் இதை தீர்மானிக்கின்றன. | No planet sits here, so this house is judged by its lord's condition and by the aspects falling on it. | |
| T-28 | Aspects present | {planets} இதைப் பார்க்கிறது. | {planets} aspect(s) it. | |
| T-29 | No aspects | எந்த கிரகப் பார்வையும் இதன் மேல் விழவில்லை. | No planetary aspect falls on it. | |
| T-30 | House line | {house}-ஆம் வீடு ({rasi}) — {theme}. இதன் அதிபதி {planet}, {n}-ஆம் வீட்டில் உள்ளார். | House {house} ({rasi}) — {theme}. Its lord is {planet}, placed in house {n}. | |
| T-31 | Section intro | ஒவ்வொரு வீடும் ஒரு வாழ்க்கைத் துறை. அந்த வீட்டில் கிரகம் இல்லாவிட்டாலும், அதன் அதிபதி எங்கே இருக்கிறார், யார் அதைப் பார்க்கிறார்கள் என்பதைக் கொண்டு பலன் சொல்லப்படுகிறது. | Each house is one life area. Even with no planet in it, a house is read through where its lord sits and which planets aspect it. | |

> **T-26/T-28 grammar risk:** these take a comma-joined list of graha names, so
> the verb agreement can be wrong for multiple planets
> ("சூரியன், சந்திரன் … அமர்ந்துள்ளது"). Please give the correct plural form —
> English handles it via `aspect{'s'}` but Tamil currently does not inflect.

---

## F. Ashtakavarga in the peyarchi card — NEW

File: `web/components/dashboard-chart-explanation.tsx`

| ID | Where | Tamil | English | Verdict |
|---|---|---|---|---|
| T-32 | Bindu line | அஷ்டகவர்க்கம்: இந்த ராசியில் {planet}வுக்கு {bindus}/8 விந்துகள் — {reading}. விந்துகள் அதிகம் இருந்தால் இந்தப் பெயர்ச்சியின் பலன் எளிதாக வெளிப்படும்; குறைவாக இருந்தால் அதே பெயர்ச்சி மெதுவாகவே பலன் தரும். | Ashtakavarga: {planet} holds {bindus}/8 bindus in this rasi — {reading}. More bindus let a peyarchi deliver its results more easily; fewer bindus mean the same transit works slowly. | |
| T-33 | Reading, 6-8 | மிகுந்த ஆதரவு | strongly supported | |
| T-34 | Reading, 5 | ஆதரவு | supported | |
| T-35 | Reading, 4 | நடுநிலை | neutral | |
| T-36 | Reading, 2-3 | பலவீனம் | thin | |
| T-37 | Reading, 0-1 | மிகவும் பலவீனம் | very thin | |

> **T-32:** is **விந்து** the right Tamil term for an Ashtakavarga bindu, or is
> **பரல்** / **புள்ளி** more standard in Tamil almanacs? Also check the dative
> `{planet}வுக்கு` — it is appended to a graha name that may already end in a
> vowel (e.g. "குருவுக்கு" vs "சனிக்கு"), so the suffix may be wrong for some.
> **This one is a real correctness risk, please look closely.**

---

## G. Gochara / peyarchi reckoning — REWORDED

File: `web/components/dashboard-chart-explanation.tsx`

| ID | Where | Tamil | English | Verdict |
|---|---|---|---|---|
| T-38 | Transit seat (Moon known) | உங்கள் ஜென்ம ராசியிலிருந்து (சந்திரன்) {n}-ஆம் வீடு வழியாக — லக்னத்திலிருந்து {m}-ஆம் வீடு | {n} from your Janma Rasi (Moon) — and {m} from your Lagna | |
| T-39 | Transit seat (fallback) | உங்கள் லக்னத்திலிருந்து {m}-ஆம் வீடு வழியாக | {m} from your Lagna | |
| T-40 | Guru transit | குரு இப்போது {seat} சஞ்சரிக்கிறார் — இது இன்றைய வானநிலை, உங்கள் பிறப்பு நிலை அல்ல. அவரது பார்வை {houses} வீடுகளை ஆதரவாகத் தொடுகிறது ({themes}). இந்தத் துறைகளில் வளர்ச்சி, வாய்ப்பு, நம்பிக்கை பெருகும் காலம். | Guru (Jupiter) is transiting {seat} right now — this is today's sky, not your birth position. Its aspect falls supportively on {houses} ({themes}). Growth, opportunity, and confidence tend to build in those areas while this lasts. | |
| T-41 | Sani transit | சனி இப்போது {seat} சஞ்சரிக்கிறார் — இது இன்றைய வானநிலை, உங்கள் பிறப்பு நிலை அல்ல. அவரது பார்வை {houses} வீடுகளைத் தொடுகிறது ({themes}). இந்தத் துறைகளில் பொறுப்பு, பொறுமை, மெதுவான வேகம் தேவை; ஒழுங்கு உதவும். | Sani (Saturn) is transiting {seat} right now — today's sky, not your birth position. Its aspect falls on {houses} ({themes}). Those areas ask for responsibility, patience, and a slower pace; steady, disciplined effort pays off. | |

---

## H. Aspect type labels — NEW (replacing raw enums)

File: `web/components/dashboard-chart-explanation.tsx`

| ID | Where | Tamil | English | Note | Verdict |
|---|---|---|---|---|---|
| T-42 | Standard aspect | 7-ஆம் பார்வை | 7th aspect | was `STANDARD_7TH` | |
| T-43 | Special aspect | சிறப்பு {n}-ஆம் பார்வை | special {ordinal} aspect | was `MARS_SPECIAL_4TH` etc. Renders "special 3rd / 4th / 5th / 8th / 9th / 10th aspect". **Bug found and fixed while building this sheet:** the suffix was hardcoded `th`, so Saturn's 3rd aspect read "special 3th aspect". Now uses `ordinalSuffix()`, covered by a 1-12 test | |

---

## I. Nodal aspect school disclosure — NEW

File: `web/components/dashboard-chart-explanation.tsx`. Shown only when a Rahu/Ketu aspect is in the list.

| ID | Tamil | English | Verdict |
|---|---|---|---|
| T-44 | குறிப்பு: ராகு/கேதுவுக்கு 5, 7, 9 பார்வை தரும் மரபை இங்கு பின்பற்றுகிறோம். இது ஒரு பள்ளியின் கொள்கை — சில ஆசிரியர்கள் நிழல் கிரகங்களுக்கு 7-ஆம் பார்வை மட்டுமே தருகிறார்கள், சிலர் தனிப் பார்வையே இல்லை என்கிறார்கள். | Note: we follow the tradition that gives Rahu/Ketu 5th, 7th and 9th aspects. This is one school's doctrine — some authorities give the shadow grahas the 7th aspect only, and others hold that they aspect solely through their dispositor. | |

> "பள்ளி" for *school of thought* may read as "school (building)". Alternatives:
> "மரபு", "சம்பிரதாயம்". Reviewer's call.

---

## J. Dosham severity bands — NEW (replacing the fake "12/100")

File: `web/components/dashboard-yoga-dosham-panel.tsx`

| ID | Band | Tamil | English | Verdict |
|---|---|---|---|---|
| T-45 | score ≥ 70 | தீவிரம்: அதிகம் | High intensity | |
| T-46 | score 40-69 | தீவிரம்: மிதமானது | Moderate intensity | |
| T-47 | score < 40 | தீவிரம்: குறைவு | Low intensity | |

---

## K. Dasha activation line — REWORDED (chain removed)

File: `app/services/chart_explanation_service.py`

| ID | Case | Tamil | English | Verdict |
|---|---|---|---|---|
| T-48 | Is an active lord | இந்த கிரகம் இப்போது நடப்பு {level} அதிபதி — அதனால் அதன் வீடு மற்றும் துறை விளைவுகள் இப்போது நேரடியாக இயங்குகின்றன. | This planet is currently your running {level} lord, so its house and life-area results are directly active right now. | |
| T-49 | Not an active lord | இந்த கிரகம் இப்போது நேரடி தசை/புக்தி/அந்தர அதிபதி அல்ல; அது தசை அல்லது புக்தியாக வரும்போதும், கோசாரத்தில் குரு/சனி இதைத் தொடும்போதும் அதன் முழு பலன் வெளிப்படும். | This planet is not one of the active period lords right now; its full results surface when it becomes a dasha or bhukti lord, or when transiting Guru/Sani contact it. | |

> Both previously repeated the full dasha chain; that clause was removed because
> it printed identically on up to eight planet cards. Confirm the sentences still
> stand on their own without it.

---

## Summary

| Group | Rows | Kind |
|---|---|---|
| A. Yoga cancellation | 4 | 2 new, 2 context |
| B. Strength & score semantics | 9 | 7 new, 2 reworded |
| C. Rahu/Ketu functional nature | 7 | all new |
| D. Navamsa facet | 5 | all new |
| E. Bhava section | 6 | all new |
| F. Ashtakavarga | 6 | all new |
| G. Gochara/peyarchi | 4 | all reworded |
| H. Aspect labels | 2 | all new |
| I. Nodal disclosure | 1 | new |
| J. Dosham bands | 3 | all new |
| K. Dasha activation | 2 | reworded |
| **Total** | **49** | |

### Rows most likely to be wrong — check these first

1. **T-32** — `{planet}வுக்கு` dative suffix will be wrong for some graha names
   ("குருவுக்கு" vs "சனிக்கு"). Needs a per-graha form or a rephrase that avoids
   the suffix entirely.
2. **T-26 / T-28** — no plural inflection for multi-planet lists
   ("சூரியன், சந்திரன் … அமர்ந்துள்ளது").
3. **T-32** — விந்து vs பரல் vs புள்ளி as the standard Tamil term for a bindu.
4. **T-13** — longest string; check all six Shadbala component names; this is
   where Devanagari characters leaked in during authoring.
5. **T-24** — "பெயரில் பலம், பலனில் பலவீனம்" is a phrase I coined; replace with the
   classical Tamil equivalent if one exists.
6. **T-14…T-20** — the repeated "இது ராசி அதிபதி அல்ல;" opening across all seven
   may read as heavy; also a doctrinal wording call, not just translation.

> **Already found and fixed from this exercise:** T-43 was producing
> "special 3th aspect" for Saturn's 3rd drishti. Building the sheet is what
> surfaced it — worth noting that the review pass itself has value beyond the
> Tamil.

---

## Round 2 — RESOLVED under translator ownership, 2026-07-18

The open items below were decided directly rather than returned as questions.
All applied; gates green (web tsc, 176 vitest, eslint, 137 Python).

### R-1 — `விந்து` → **`பரல்`** (term change, and the most important one here)

`விந்து` is a transliteration of Sanskrit *bindu*, but in modern Tamil it reads
overwhelmingly as **semen**. It cannot go in consumer copy. The native Tamil
almanac term for an Ashtakavarga dot is **பரல்** ("grain/pebble"), which is what
Tamil jyotisha texts use. `புள்ளி` ("dot") was the neutral fallback but is less
traditional; **பரல்** chosen.

### R-2 — T-32 dative bug fixed by rephrasing, not by a suffix table

`{planet}வுக்கு` only inflects correctly for u-final names: "குருவுக்கு" is right,
"சனிவுக்கு" is wrong (must be "சனிக்கு"). Since Tamil dative attachment depends on
the final phoneme, a lookup table would be fragile. The sentence was rebuilt in
the **nominative + verb**, which is correct for every graha name:

> அஷ்டகவர்க்கம்: **{graha} இந்த ராசியில் {n}/8 பரல்கள் பெற்றுள்ளார்** — {reading}.

Verified rendering for both grahas that reach this line:
`குரு … பெற்றுள்ளார்` and `சனி … பெற்றுள்ளார்`.

### R-3 — O-1 resolved with the correlative, none of the three options

The three options offered were all workarounds. The correct Tamil is the
correlative **-உம் … -உம்**, which puts both frames in the locative under a
single verb and removes the dash entirely:

> குரு இப்போது உங்கள் ஜென்ம ராசியிலிருந்து (சந்திரன்) **4-ஆம் இடத்திலும்,**
> லக்னத்திலிருந்து **10-ஆம் இடத்திலும்** சஞ்சரிக்கிறார் — இது இன்றைய வானநிலை,
> உங்கள் பிறப்பு நிலை அல்ல.

Moon still leads, as Tamil peyarchi practice requires. Fallback (no Moon house)
stays simple locative: `உங்கள் லக்னத்திலிருந்து 10-ஆம் இடத்தில் சஞ்சரிக்கிறார்`.

### R-4 — T-26 / T-28 honorific and count agreement

Grahas take the honorific in this copy (`சஞ்சரிக்கிறார்` was already doing so), and
Tamil inflects for count. The neuter singular was wrong on both axes:

| Case | Was | Now |
|---|---|---|
| 1 occupant | அமர்ந்துள்ளது | **அமர்ந்துள்ளார்** |
| 2+ occupants | அமர்ந்துள்ளது | **அமர்ந்துள்ளனர்** |
| 1 aspecting | பார்க்கிறது | **பார்க்கிறார்** |
| 2+ aspecting | பார்க்கிறது | **பார்க்கின்றனர்** |

English had the mirror bug — "Mars, Sun **occupies** it" — now agrees too.

### R-5 — graha lists no longer bare comma-joins (both languages)

Rendering the sentences in full showed "செவ்வாய், சூரியன்" / "Mars, Sun", which is
exactly the machine-dump feel the original astrologer review objected to.

- Tamil closes a list of honorific subjects with **ஆகியோர்**:
  `செவ்வாய், சூரியன் ஆகியோர் இந்த வீட்டில் அமர்ந்துள்ளனர்.`
  (Chosen over `செவ்வாயும் சூரியனும்`, which needs per-name euphonic changes a
  generic join cannot do.)
- English: `Mars and Sun` / `Mars, Saturn and Sun`.

### R-6 — T-04 `ரத்து` → `பலனற்றது`

`ரத்து` is administrative/legal register ("revoked"). For a yoga annulled by
bhanga the astrological sense is *rendered fruitless*:
**அமைந்தது; நிவர்த்தியால் பலனற்றது.**

### R-7 — O-2 closed: `உள்ளது` stays in clause form

The round-1 reviewer changed only the standalone chip to `உண்டு` and left
`உங்கள் ஜாதகத்தில் உள்ளது` alone. That distinction is correct Tamil, not an
oversight: `உண்டு` suits a bare label, `உள்ளது` is the natural verbal form inside
a clause. Kept as-is.

### Regression guards added

`tests/test_chart_explanation_bhavas.py` now asserts the honorific/count
agreement in both languages, and reads the web component to assert that neither
`வுக்கு` (the dative bug) nor `விந்து` can return to the Ashtakavarga line.

---

## Open after round 1

### O-1 — T-38 composition with the sentence verb (needs a Tamil decision)

T-38 was approved as a **fragment**. In context it is interpolated into T-40 /
T-41 before `சஞ்சரிக்கிறார்`, and the approved form drops the old `வழியாக`, so
the full rendered sentence now reads:

> குரு இப்போது உங்கள் ஜென்ம ராசியிலிருந்து (சந்திரன்) **4-ஆம் இடத்தில் —
> லக்னத்திலிருந்து 10-ஆம் இடம்** சஞ்சரிக்கிறார் — இது இன்றைய வானநிலை, உங்கள்
> பிறப்பு நிலை அல்ல.

The trailing `…10-ஆம் இடம் சஞ்சரிக்கிறார்` may not read correctly, since the verb
ends up attached to the nominative aside rather than to the locative clause.
Applied exactly as specified rather than silently "corrected", because this is a
Tamil grammar judgement.

Three options for the reviewer to pick from:

| Option | Rendered Tamil |
|---|---|
| **a** — close the aside with a second dash | …(சந்திரன்) 4-ஆம் இடத்தில் — லக்னத்திலிருந்து 10-ஆம் இடம் — சஞ்சரிக்கிறார். |
| **b** — split into two sentences | …(சந்திரன்) 4-ஆம் இடத்தில் சஞ்சரிக்கிறார். லக்னத்திலிருந்து இது 10-ஆம் இடம். |
| **c** — keep as applied | …4-ஆம் இடத்தில் — லக்னத்திலிருந்து 10-ஆம் இடம் சஞ்சரிக்கிறார். |

Also worth confirming: the sentence now contains **two** em-dashes (one from the
seat fragment, one before "இது இன்றைய வானநிலை"), which may read as cluttered.

### O-2 — "உள்ளது" elsewhere, for consistency with T-01

T-01 changed the standalone status chip to **உண்டு**. Two nearby strings still
use `உள்ளது` in sentence form and were **not** flagged, so they were left alone:

| Where | Tamil |
|---|---|
| Yoga detail hero badge | உங்கள் ஜாதகத்தில் **உள்ளது** |
| Yoga "not present" badge | உங்கள் ஜாதகத்தில் இல்லை |

Confirm these should stay as `உள்ளது` in the longer clause, or move to `உண்டு`
for consistency with the chip.

### O-3 — CLOSED

All three were resolved under translator ownership — see R-1, R-2, R-4 above.

---

## Status

**No open Tamil questions.** Every ID on this sheet is either reviewer-approved
or resolved and guarded.

Still owed before ship (not Tamil): a live browser pass, and the astrologer
decisions listed in `ASTROLOGER_REVIEW_RESPONSE_2026-07-18.md` §1.4 and §2.4
(Moolatrikona-vs-avastha weighting, nodal-drishti school).
