# Pending native-Tamil review — every string, listed

**Date:** 2026-11-05 · **For:** the owner, who signs off Tamil copy directly
(precedent: `docs/FIVE_MINUTE_READING_SPEC_2026-08-11.md` §8.8 — 34 strings read
and approved in chat, no third party, no review doc) · **Generated from source**,
not hand-copied: `ast` walk over each module, Tamil-script constants paired with
their English sibling where the table carries one.

**Superseded 2026-11-07:** the strings below are the old copy, kept as the before-state. The rewrite and what to sign off are in `docs/TAMIL_EVERYDAY_VOICE_2026-11-07.md`.

## Scope and what is excluded

Listed below is every Tamil copy string in the modules whose review is open, **less**
the five tables that already carry a dated `NATIVE-TAMIL REVIEW PASSED 2026-08-12`
marker: `_BHUKTI_FLAVOR` (9), `_GOCHARA_SANI` (12), `_SANI_PHASE_NAME` (5),
`_LORD_STRENGTH_NOTE` (3) and `_AREA_NOUN` (5).

**Known imprecision, stated rather than hidden:** the eighteen `action` entries
inside `_VOICE` / `_CHILD_VOICE` also passed on 2026-08-12, but they are exempted
*in place* inside tables that are otherwise pending, so this generator cannot
separate them. They are included here and may be skipped on sight. Likewise the
pure vocabulary tables (`_MONTH_TA`, `GRAHA_NAME`, `_RASI_TA`, `_NAKSHATRA_CODE_NAMES`,
`DIRECTION_NAME`, `GRAHA_COLOUR`) are settled display vocabulary under the
display-name rulings, not prose — they are listed for completeness, and are the
cheapest rows to clear.

Two distinct states are collapsed into one list here, deliberately:
a **`PENDING NATIVE-TAMIL REVIEW` marker in code** (`one_minute_reading_service`,
`nakshatra_content`, `emotional_weather`, `email_service`, `_SHADOW_ESSENCE_THEM`,
`planet_conditions`, `personal_palan` as `OWNER_COMMISSIONED_DRAFT`), and
**no marker but never read by a native speaker** (the `_THEM` twins,
`_CHILD_PERIOD_TEXTURE`, the beat-level strings in `five_minute_reading_service`).
Both need the same sitting.

## How to sign off

Per the 2026-08-12 precedent, mark a table passed by **replacing its
`PENDING NATIVE-TAMIL REVIEW` comment in place** with a dated
`NATIVE-TAMIL REVIEW PASSED <date>` marker that names the entry count, so the
marker still says what was checked. Do not delete the comment. A table whose
entries must end in a finite verb (the `_BHUKTI_FLAVOR` discipline) records the
predicate rule in its marker, not bare approval.

**What the reviewer is looking for** — from the one pass that has run: the defects
were not mistranslations but **calques**, English idiom wearing Tamil words
("this period runs on your steadiness" → "இந்தக் காலம் … மீது நடக்கிறது"). The
check is to read the Tamil *alone*, English column covered, and ask whether anyone
would say it that way. No coverage test can ask that question.

## Totals

| File | Status | Rows below |
|---|---|---|
| `app/services/one_minute_reading_service.py` | module marker open | ~430 |
| `app/services/five_minute_reading_service.py` | `_THEM` twins + beats, no marker | ~150 |
| `app/services/personal_palan.py` | `OWNER_COMMISSIONED_DRAFT` | ~290 |
| `app/services/nakshatra_content.py` | marker on `NAKSHATRA_LENS`; `_CARDS` never reviewed | ~300 |
| `app/services/emotional_weather.py` | marker open (RP-02 rewrite) | 24 |
| `app/calculations/planet_conditions.py` | whole module first-draft | 27 |
| `app/services/email_service.py` | verification-email marker | ~30 |
| **Total** | | **1,158** |

---

## `app/services/one_minute_reading_service.py`


### `_MONTH_TA` — line 323 · 12 strings

| # | line | Tamil | English |
|---|---|---|---|
| 1 | 324 | ஏப்ரல் | — |
| 2 | 324 | ஜனவரி | — |
| 3 | 324 | ஜூன் | — |
| 4 | 324 | பிப்ரவரி | — |
| 5 | 324 | மார்ச் | — |
| 6 | 324 | மே | — |
| 7 | 325 | அக்டோபர் | — |
| 8 | 325 | ஆகஸ்ட் | — |
| 9 | 325 | செப்டம்பர் | — |
| 10 | 325 | ஜூலை | — |
| 11 | 325 | டிசம்பர் | — |
| 12 | 325 | நவம்பர் | — |

### `_CONTRAST` — line 479 · 1 strings

| # | line | Tamil | English |
|---|---|---|---|
| 13 | 479 | மறுபுறம்: | And yet: |

### `_CONTINUATION` — line 480 · 1 strings

| # | line | Tamil | English |
|---|---|---|---|
| 14 | 480 | அதே நேரத்தில்: | At the same time, |

### `_VOICE` — line 661 · 99 strings

| # | line | Tamil | English |
|---|---|---|---|
| 15 | 664 | நீங்கள் பொறுப்பேற்கும் இயல்பு கொண்டவர்; அதை மற்றவர்கள் உடனே உணர்கிறார்கள் — ஆனால் கருத்து வேறுபாட்டை வெளியே காட்டுவதை விட உள்ளுக்குள் அதிகம் உணர்கிறீர்கள். | You carry yourself as someone in charge and people read that quickly — though you take disagreement more personally than you let on. |
| 16 | 672 | கேட்காமலேயே மற்றவர்கள் உங்களிடம் ஒப்படைக்கும் பொறுப்பு | the authority people hand you without being asked |
| 17 | 676 | தவறு என்று வெளிப்பட நேரும் தருணம் — நீங்கள் நம்பாத நிலைப்பாட்டையும் தொடர்ந்து காப்பாற்றுகிறீர்கள் | being seen to be wrong; you defend a position past the point you believe it |
| 18 | 686 | ஏனெனில் அந்தப் பொறுப்பு உங்கள் உறுதியின் மீதுதான் வந்தது; அதனால் நீங்கள் காட்டும் எந்தச் சந்தேகமும் அந்தப் பொறுப்பு நழுவுவது போலப் படுகிறது | because that authority arrived on the strength of your certainty, so any doubt you show feels like the authority itself slipping |
| 19 | 696 | கூட்டத்தில் எடுத்த முடிவை, எல்லோரும் அதைக் கடந்து சென்ற பிறகும் பிடித்துக்கொள்வது — பின்வாங்குவது தோல்வியாகத் தெரியும் என்பதால் | holding onto a decision in a meeting long after the room has moved past it, because backing down there would look like losing |
| 20 | 702 | நீங்கள்தான் தவறு செய்தீர்கள் என்று தெரிந்த பிறகும், முதலில் மன்னிப்புக் கேட்க மறுப்பது | refusing to say sorry first, even once you know you were the one who was wrong |
| 21 | 707 | தன்னை நிரூபிப்பதும் தானாக மாறுவதும் ஒன்றல்ல என்பதை வாழ்க்கை உங்களுக்குத் திரும்பத் திரும்பச் சொல்கிறது. | Life keeps reminding you that proving yourself and becoming yourself are not the same thing. |
| 22 | 713 | அது உங்களை மற்றவர்கள் முன்னால் நிறுத்தியது — நீங்கள் விரும்பினாலும் விரும்பாவிட்டாலும் | it put you in front of people, whether or not you wanted to be there |
| 23 | 717 | இது நீங்கள் தெரியும் காலம்; பாதுகாப்பான பங்கை விட வெளிப்படையான பொறுப்பை எடுத்துக்கொள்ளுங்கள் | this is the stretch where you are seen; take the visible role rather than the safe one |
| 24 | 721 | நீங்கள் செய்யும் வேலைக்கு உங்கள் பெயர் இருக்கட்டும் — இந்தக் காலத்தில் உழைப்பை விட அது தெரிவதுதான் பலன் தரும் | put your name on your work — this period converts visibility, not effort alone |
| 25 | 726 | மற்றவர்கள் முன் நிலைத்திருக்கும் நம்பிக்கை, முடிவு உறுதி செய்யப்படுவதற்கு முன்பே | steady confidence in front of people, even before the outcome is certain |
| 26 | 732 | யாரும் பேசுவதற்கு முன்பே சூழலை நீங்கள் புரிந்துகொள்கிறீர்கள்; அதனால் மற்றவர்கள் தங்கள் கவலைகளை உங்களிடம் கொண்டு வருகிறார்கள் — ஆனால் பிறரின் மனநிலை தேவைக்கும் அதிக நேரம் உங்களுடன் தங்கிவிடுகிறது. | You read a room before anyone speaks, and people bring you their troubles — though other people's moods stay with you longer than they should. |
| 27 | 741 | மற்றவர்களுக்கு என்ன தேவை என்பதை அவர்கள் சொல்வதற்கு முன்பே அறிதல் | reading what people need before they say it |
| 28 | 745 | அழுத்தத்தில் நிலைத்திருத்தல் — உங்கள் மனநிலை சூழலின் மனநிலையைப் பின்தொடர்கிறது | steadiness under pressure; your mood follows the room's more than you would like |
| 29 | 749 | ஏனெனில் ஒரு சூழலை உங்களால் படிக்க முடியும் அதே திறந்த தன்மைதான், அதன் மனநிலையை உங்களுக்குள் இறங்க விடுகிறது | because the same openness that lets you read a room is what lets its mood settle into you |
| 30 | 757 | பதற்றமான கூட்டத்தின் மனநிலையை, அது முடிந்த நீண்ட நேரத்திற்குப் பிறகும் வீட்டிற்குக் கொண்டு செல்வது | carrying a tense meeting's mood home with you long after the meeting itself is over |
| 31 | 761 | துணையின் மோசமான நாளை, யாரும் அதை முடிவு செய்யாமலேயே உங்கள் சொந்த நாளாக ஏற்றுக்கொள்வது | taking on a partner's bad day as if it were your own, without either of you deciding that |
| 32 | 766 | எல்லாவற்றையும் சுமக்காமலேயே அக்கறை காட்ட முடியும் என்பதை வாழ்க்கை உங்களுக்குத் திரும்பத் திரும்பக் கற்பிக்கிறது. | Life keeps asking you to care without carrying all of it. |
| 33 | 771 | அது அடிக்கடி நகர்ந்தது — இடம், மனநிலை, மனிதர்கள் — அதற்குள் நிலையாக இருக்கும்படி கேட்டது | it moved often — homes, moods, people — and asked you to stay steady inside all of it |
| 34 | 775 | இந்தக் காலம் மனிதர்கள் மற்றும் மனநிலையின் மீது நடக்கிறது; உங்கள் சொந்த தாளத்தைக் காத்தால் நன்றாக நடக்கும் | this stretch runs on people and mood; keep your own rhythm and it goes well |
| 35 | 787 | தூக்கத்தையும் தினசரி நேரங்களையும் சீராக வைத்துக்கொள்ளுங்கள் — இந்தக் காலத்தில் உங்கள் நிலைத்தன்மையே எல்லாவற்றுக்கும் அடிப்படை | protect your sleep and the rhythm of your days; this period runs on your steadiness |
| 36 | 800 | சூழல் அமைதியாகும் வரை காத்திராத ஒரு நிலைத்தன்மை | a steadiness that doesn't wait for the room to settle first |
| 37 | 806 | முதலில் செயல்படுபவர், விரைவாக முடிவெடுப்பவர் — உங்களைச் சுற்றி வேலைகள் நடப்பதற்குக் காரணமே அதுதான். ஆனால் கடைசித் தகவல் வருவதற்கு முன்பே முடிவெடுத்துவிடுகிறீர்கள். | You move first and decide fast, which is why things around you actually get done — though you commit before the last fact is in. |
| 38 | 813 | மற்றவர்கள் இன்னும் விவாதித்துக்கொண்டிருக்கும்போது செயல்படுதல் | acting while other people are still discussing |
| 39 | 817 | பொறுமை — தானாகவே வந்திருக்கக்கூடிய முடிவை நீங்கள் வலுக்கட்டாயமாக வரவழைக்கிறீர்கள் | patience; you force a decision that would have come to you on its own |
| 40 | 821 | ஏனெனில் மற்றவர்களுக்கு முன்பே உங்களை நகர்த்தும் அதே உந்துதல்தான், ஒரு முடிவு தானாக வர அனுமதிக்காமல் தடுக்கிறது | because the same push that gets you moving before anyone else decides is what won't let a decision arrive on its own |
| 41 | 829 | எண்கள் முழுமையாக வருவதற்கு முன்பே ஒரு திட்டத்தை முடிவுக்குத் தள்ளுவது — காத்திருப்பது இடத்தை இழப்பது போலத் தோன்றும் | pushing a project to a decision before the numbers are actually in, because waiting feels like losing ground |
| 42 | 835 | மறுபக்கத்தினர் தன் எண்ணத்தை முடிவு செய்வதற்கு முன்பே, உரையாடலை ஒரு முடிவுக்குக் கொண்டுவர வலியுறுத்துவது | forcing a conversation to a conclusion before the other person has finished working out what they think |
| 43 | 841 | ஒவ்வொரு போரும் உங்கள் பலத்திற்குத் தகுதியானது அல்ல என்பதை வாழ்க்கை உங்களுக்குத் திரும்பத் திரும்பக் கற்பிக்கிறது. | Life keeps teaching you that not every battle deserves your strength. |
| 44 | 846 | அது செயலுக்குப் பலன் தந்தது, தயக்கத்திற்குத் தண்டனை தந்தது — உங்களைக் களைப்படையவும் வைத்தது | it rewarded action and punished hesitation, and it left you tired |
| 45 | 850 | இந்தக் காலம் முதலில் நகர்பவருக்குப் பலன் தரும்; ஆபத்து என்பது தவறான இலக்கில் சக்தியைச் செலவிடுவது | this stretch rewards moving first; the risk is spending the energy on the wrong target |
| 46 | 854 | ஒன்றை மட்டும் தேர்ந்தெடுத்து முன்னெடுங்கள்; மற்ற மூன்றைத் தள்ளுவதை நிறுத்துங்கள் | pick one thing to push, and stop pushing the other three |
| 47 | 858 | நகர்வதற்கு முன்பே தேர்ந்தெடுக்கப்பட்ட ஒரு இலக்கு, நகர்ந்தபடி தேடும் ஒன்றல்ல | a target chosen before you move, not one found while you're already moving |
| 48 | 864 | வார்த்தைகளில் சிந்திப்பவர்; எந்தச் சூழலையும் பேச்சால் கடந்துவிடுவீர்கள் — ஆனால் ஏற்கனவே சரியாக எடுத்த முடிவை மீண்டும் யோசித்து மாற்றிக்கொள்கிறீர்கள். | You think in words and can talk your way through most rooms — though you often reason yourself out of a decision you had already got right. |
| 49 | 872 | சிக்கலான ஒன்றை எளிமையாக விளக்குதல் | explaining a complicated thing simply |
| 50 | 876 | முடிவெடுத்தல் — இரு பக்கத்தையும் நன்றாக வாதிடுவதால் எதுவும் வெல்வதில்லை | deciding; you can argue both sides so well that neither one wins |
| 51 | 880 | ஏனெனில் ஒன்றை விளக்கும் அளவுக்குத் தெளிவாகப் புரிந்துகொள்வது, அதன் ஒவ்வொரு பக்கத்தையும் அதே தெளிவுடன் காண வைக்கிறது | because seeing a thing clearly enough to explain it means seeing every side of it just as clearly |
| 52 | 888 | ஒரு முடிவைச் சுற்றிச் சுற்றிப் பேசி, கூட்டமே எந்த முடிவும் இல்லாமல் முடிந்துவிடுவது | talking a decision in circles until the meeting ends with no decision at all |
| 53 | 892 | ஒரு கருத்து வேறுபாட்டில் துணையின் பக்கத்தை மிக நன்றாக வாதிட்டு, உங்கள் சொந்தக் கருத்தையே மறந்துவிடுவது | arguing your partner's side of a disagreement so well that you lose track of your own |
| 54 | 901 | எல்லாவற்றையும் இன்னும் நன்றாக விளக்குவதன் மூலம் தீர்த்துவிட முடியாது என்பதை வாழ்க்கை உங்களுக்குத் திரும்பத் திரும்பக் காட்டுகிறது. | Life keeps showing you that not everything is settled by explaining it better. |
| 55 | 906 | அது பேச்சு, கற்றல், ஆவணங்கள் நிறைந்த காலம் — நுணுக்கங்களைச் சரியாகச் செய்ததில் வெற்றி வந்தது | it was a stretch of talking, learning and paperwork, where the wins came from getting the details right |
| 56 | 911 | இந்தக் காலம் வார்த்தை, கற்றல், தெளிவான ஆவணங்களுக்குப் பலன் தரும் — உழைப்புக்கு மட்டும் அல்ல | this stretch pays for words, learning and clear paperwork more than for effort alone |
| 57 | 915 | ஒப்புக்கொள்வதற்கு முன் எழுதி வையுங்கள் — இந்தக் காலத்தில் சிறிய விவரங்கள்தான் முக்கியமாகின்றன | write it down before you agree to it; in this period the small details are what matter |
| 58 | 919 | இரு பக்கமும் வாதிட்ட பிறகும் மாறாமல் நிற்கும் ஒரு முடிவு | a decision that stays decided, even after you've argued both sides of it |
| 59 | 925 | தீர்ப்புக்காக மக்கள் உங்களிடம் வருகிறார்கள்; நீங்கள் தாராளமாகக் கொடுக்கிறீர்கள் — ஆனால் ஒருவரால் தாங்கக்கூடியதை விட அதிகமாக வாக்குறுதி அளிக்கிறீர்கள். | People come to you for judgment and you give it generously — though you promise more than one person can reasonably carry. |
| 60 | 933 | மற்றவர்கள் நம்பிச் செயல்படும் அளவுக்கான தீர்ப்பு | judgment people trust enough to act on |
| 61 | 937 | மறுத்துச் சொல்வது — அதனால் உங்கள் சம்மதம் பல இடங்களில் மெலிந்துவிடுகிறது | saying no, so your yes gets spread thin |
| 62 | 948 | ஏனெனில் மற்றவர்கள் தேடி வரும் அதே தீர்ப்புதான், ஒவ்வொரு முறையும் பதில் சம்மதமாக இருக்க வேண்டிய ஒரு காரணத்தையும் கண்டுபிடித்துவிடுகிறது | because the judgment people come to you for is the same judgment that keeps finding a reason the answer should be yes |
| 63 | 958 | ஏற்கனவே இருக்கும் திட்டங்களே பாதிக்கப்படும் நிலையிலும், இன்னும் ஒரு திட்டத்தை ஏற்றுக்கொள்வது | agreeing to take on one more project when the ones you already have are the ones suffering |
| 64 | 963 | உங்களைச் சுற்றி இருப்பவர்களின் தேவைகளுக்கெல்லாம் சம்மதித்து, உங்களுக்கு மிக நெருக்கமானவருக்கு எதுவும் மிச்சம் வைக்காதது | saying yes to what everyone around you needs, until there is nothing left over for the person closest to you |
| 65 | 970 | வரம்பின்றி அல்ல, விவேகத்துடன் கொடுக்கும்படி வாழ்க்கை உங்களைத் திரும்பத் திரும்பக் கேட்கிறது. | Life keeps asking you to give wisely rather than endlessly. |
| 66 | 975 | அது கதவுகளைத் திறந்தது, உங்கள் வட்டத்தை விரிவாக்கியது — நீங்கள் உள்ளே நுழைந்த அளவுக்கு | it opened doors and widened your circle, to the extent that you walked through them |
| 67 | 979 | இந்தக் காலம் விரிவடைகிறது — கற்பித்தல், பிள்ளைகள், உங்களை விட மூத்தவர்களின் உதவி கிடைக்கும் | this stretch widens things — teaching, children, and people senior to you tend to help |
| 68 | 983 | யாருக்காவது ஒன்றைக் கற்றுக் கொடுங்கள் — அது எடுக்கும் நேரத்தை விட அதிகமாகவே திரும்பக் கிடைக்கும் | say yes to teaching someone; here it returns more than it costs |
| 69 | 988 | மிச்சமிருக்கும் சம்மதம் அர்த்தமுள்ளதாக இருக்க, ஒரு தெளிவான மறுப்பு | one clear no, so the rest of your yes still means something |
| 70 | 994 | சூழலையும் மனிதர்களையும் இதமாக வைத்திருப்பவர்; திறமை மட்டும் திறக்காத கதவுகளை அது திறக்கும் — ஆனால் தெளிவைக் கொடுக்கும் அந்த ஒரு உரையாடலைத் தவிர்க்கிறீர்கள். | You make things pleasant and people comfortable, and that opens doors ability alone would not — though you avoid the one conversation that would clear the air. |
| 71 | 1004 | மனிதர்களிடம் காட்டும் பொறுமையும், அது ஈட்டித் தரும் நல்லெண்ணமும் | patience with people, and the goodwill it earns |
| 72 | 1008 | நேரடி மோதல் — எதிர்த்துச் சொல்வதை விட உள்ளுக்குள் தாங்கிக்கொள்கிறீர்கள், அது சேர்ந்துகொண்டே வரும் | confrontation; you tend to absorb rather than object, and it accumulates |
| 73 | 1012 | ஏனெனில் மற்றவர்களின் நல்லெண்ணத்தை ஈட்டித்தரும் அதே பொறுமைதான், நீங்கள் சொல்ல வேண்டிய எதிர்ப்பையும் விழுங்கிவிடுகிறது | because the patience that earns people's goodwill is the same instinct that swallows the objection you should have raised |
| 74 | 1020 | உண்மையில் உடன்படாத ஒரு முடிவுக்குக் கூட்டத்தில் தலையசைத்து, பிறகு அதை யாரிடமும் எடுத்துச் சொல்லாதது | agreeing with a decision in the room that you actually disagree with, and raising it with no one afterwards |
| 75 | 1025 | ஒரு சிறிய வருத்தத்தைச் சொல்லாமல் விட்டுவிட்டு, அது அமைதியாகப் பலவாகச் சேர்ந்துவிடுவது | letting a small hurt go unsaid until it has quietly become several |
| 76 | 1030 | மௌனத்தால் வாங்கிய அமைதி நீடிப்பதில்லை என்பதை வாழ்க்கை உங்களுக்குத் திரும்பத் திரும்ப நினைவூட்டுகிறது. | Life keeps reminding you that peace bought with silence does not hold. |
| 77 | 1035 | அது பொறுமைக்கு வசதியைத் திருப்பித் தந்தது, அதை மிகைப்படுத்தாமல் அனுபவிக்கும்படி கேட்டது | it repaid patience with comfort, and asked you to enjoy it without over-spending it |
| 78 | 1039 | இது தாராளமான காலம் — உறவுகள், வசதி, பணம் இப்போது எளிதாக நகர்கின்றன | this is a generous stretch — relationships, comfort and money move more easily now |
| 79 | 1051 | முக்கியமானதை நிதானமாகத் தொடங்குங்கள்; நீங்கள் தவிர்த்துவரும் அந்த உரையாடலை முடியுங்கள் | start what matters gently, and finish the conversation you have been avoiding |
| 80 | 1055 | மென்மையாக்குவதை விட, நடத்த வேண்டிய அந்த ஒரு உரையாடல் | the conversation you'd rather smooth over than actually have |
| 81 | 1061 | தொடங்கியதை முடிப்பவர்; முதலில் இருப்பதை விட உறுதியாக இருப்பதையே விரும்புவீர்கள் — ஆனால் ஒரு வழிமுறையை ஏற்ற பிறகு, அது பலன் தராத நிலையிலும் விட்டு விலகுவது கடினம். | You finish what you start and would rather be sure than first — though once committed to a way of working, you find it hard to let go. |
| 82 | 1070 | வேகமானவர்களைத் தோற்கடிக்கும் பிரச்சினைகளை விடத் தாக்குப்பிடித்தல் | outlasting problems that defeat faster people |
| 83 | 1074 | தொடங்குவது — வராத ஒரு உறுதிக்காகக் காத்திருக்கிறீர்கள் | starting; you wait for a certainty that does not arrive |
| 84 | 1078 | ஏனெனில் உறுதியாகும் வரை நகராத அதே குணம்தான், மற்றவர்களை விட உங்களைத் தாக்குப்பிடிக்க வைக்கிறது, அது பயனற்றுப் போன பிறகும் உங்களை நிறுத்தி வைக்கிறது | because the same refusal to move before you're sure is what lets you outlast everyone else, and what keeps you standing still after it stops helping |
| 85 | 1086 | ஒரு திட்டமுன்மொழிவை முழுமையாகும் வரை தாமதப்படுத்துவது — கவனம் குறைவானவர் தன்னுடையதை முன்பே சமர்ப்பித்துவிடுவார் | sitting on a proposal until it is airtight, while someone less careful ships theirs first |
| 86 | 1092 | முக்கியமானதைச் சொல்ல சரியான தருணத்திற்காகக் காத்திருந்து, அந்தத் தருணமே அமைதியாகக் கடந்துவிடுவது | waiting for the right moment to say what matters, until the moment has quietly passed |
| 87 | 1104 | உறுதி வரும்வரை காத்திருப்பதன் விலை, உறுதியின்றித் தொடங்குவதை விட அதிகம் என்பதை வாழ்க்கை உங்களுக்குக் கற்பிக்கிறது. | Life keeps teaching you that waiting for certainty costs more than starting without it. |
| 88 | 1117 | அது பலனை விடப் பொறுமையையே அதிகம் கேட்டது; அங்கே எதுவும் அவசரத்திற்கு இணங்கவில்லை | it asked for endurance more than it offered reward, and nothing in it yielded to haste |
| 89 | 1121 | இந்தக் காலம் தாமதமாகத் தரும், ஆனால் தரும் — அவசரப்பட்டு செய்வதை விட இப்போது கட்டுவது நீடிக்கும் | this stretch pays late, but it does pay; what you build now outlasts what you rush |
| 90 | 1131 | ஒரு சிறிய உறுதிமொழியை தினமும் காப்பாற்றுங்கள் — இந்தக் காலத்தில் தொடர்ந்து செய்யக்கூடிய செயல்களுக்கே அதிக மதிப்பு கிடைக்கும் | keep one small commitment every day; this period rewards what you sustain |
| 91 | 1136 | தயாராக உணரும் முன்பே எடுக்கப்படும் ஒரு தொடக்கம் | a start made before you feel ready for it, not after |
| 92 | 1142 | உங்களுக்குக் கொடுக்கப்பட்ட இடத்தை விட அதிகம் வேண்டும் என்பவர்; மற்றவர் காணாத வழிகளைக் கண்டுபிடிப்பீர்கள் — ஆனால் சென்றடைந்ததை அனுபவிக்க நிற்பதே இல்லை. | You want more than the room you were given and you find routes other people do not see — though you rarely stop long enough to enjoy arriving. |
| 93 | 1149 | மற்றவர்கள் சுவரைக் காணும் இடத்தில் ஒரு வழியைக் காணுதல் | seeing an opening where other people see a wall |
| 94 | 1153 | முடிப்பது — நடப்பதை விட அடுத்தது எப்போதும் சுவாரஸ்யமாக இருக்கிறது | finishing; the next thing is always more interesting than the current one |
| 95 | 1157 | ஏனெனில் மற்றவர்கள் காணாத வழியை உங்களுக்குக் காட்டும் அதே பசி, நீங்கள் ஏற்கனவே இருக்கும் வழியை முடிந்துவிட்டதாக உணர வைக்கிறது | because the same hunger that shows you the opening no one else sees is what makes the one you're already in feel finished before it is |
| 96 | 1165 | தற்போதைய திட்டம் முழுமையாக முடிவதற்கு முன்பே அடுத்த திட்டத்தைத் தொடங்கிவிடுவது | starting the next project before the current one is actually closed out |
| 97 | 1169 | ஏற்கனவே இருக்கும் உறவில் முழுமையாக நிலைபெறுவதற்கு முன்பே, புதிதாக ஒன்றின் ஈர்ப்பை உணர்வது | feeling the pull of what's new before you have finished settling into what you already have |
| 98 | 1175 | அடுத்ததாக நீங்கள் தேடுவது உண்மையில் நீங்கள் விரும்பியதுதானா என்று வாழ்க்கை திரும்பத் திரும்பக் கேட்கிறது. | Life keeps asking whether the next thing is the one you actually wanted. |
| 99 | 1180 | அது வழக்கத்திற்கு மாறான திருப்பங்கள் நிறைந்தது — நீங்கள் சென்ற பாதை திட்டமிட்டது அல்ல | it was a stretch of unusual turns — the route you took was not the one you planned |
| 100 | 1184 | இந்தக் காலம் வழக்கத்திற்கு மாறான வழிகளைத் தருகிறது; தோன்றியதால் அல்ல, தேர்ந்தெடுத்து எடுங்கள் | this stretch offers unconventional routes; take them deliberately, not because they appeared |
| 101 | 1188 | எந்த வழி என்பதைத் தெரிந்தே தேர்ந்தெடுங்கள் — கண்முன் வந்தது என்பதற்காக மட்டும் அல்ல | choose the route deliberately; do not take one just because it appeared |
| 102 | 1192 | சென்றடைய முடியும் அளவுக்கு நீண்ட நேரம் பிடித்திருக்கப்படும் ஒரு இலக்கு | one destination held onto long enough to actually arrive |
| 103 | 1198 | எதையும் விரைவில் ஊடுருவிப் பார்ப்பவர்; எளிதில் வியப்படைவதில்லை — ஆனால் கேட்டே தெரிந்துகொள்ளக்கூடிய ஒன்றிலிருந்தும் விலகிவிடுகிறீர்கள். | You see through things quickly and are not easily impressed — though you withdraw from what you could simply have asked about. |
| 104 | 1205 | உண்மையில் முக்கியமானது எது என்பதை நேராக அடைதல் | cutting straight to what actually matters |
| 105 | 1209 | தங்கியிருப்பது — சூழலுக்குத் தேவை அதுவாக இருக்கும்போதும் விலகிவிடுகிறீர்கள் | staying — you withdraw at the times when staying is what the situation needs |
| 106 | 1220 | ஏனெனில் முக்கியமற்றதைத் தாண்டிச் செல்லும் அதே உள்ளுணர்வுதான், ஒரு விஷயத்திற்கு உங்களை இன்னும் தேவைப்படும்போதே உங்களை விலக்கிச் செல்கிறது | because the same instinct that cuts past what doesn't matter is what pulls you away before a thing is finished needing you |
| 107 | 1228 | ஒரு திட்டத்திற்கு உங்கள் இருப்பு மிகவும் தேவைப்படும் தருணத்திலேயே, அமைதியாக விலகிவிடுவது | going quiet on a project right when it most needs you to stay in the room |
| 108 | 1232 | ஒரு உரையாடல் கடினமாக மாறும் தருணத்திலேயே, அதில் தொடர்வதற்குப் பதிலாகப் பின்வாங்குவது | pulling back from a conversation the moment it turns difficult, instead of staying in it |
| 109 | 1238 | இன்னும் உங்கள் கவனத்திற்குத் தகுதியானதை விட்டு விலகாதீர்கள் என்பதை வாழ்க்கை உங்களுக்குத் திரும்பத் திரும்ப நினைவூட்டுகிறது. | Life keeps reminding you not to leave what still deserves your attention. |
| 110 | 1243 | அது அமைதியாகப் பலவற்றை முடித்து வைத்தது; சேர்ப்பதை விட விட்டுவிடும்படி கேட்டது | it quietly closed things off, and asked you to let go more than to acquire |
| 111 | 1247 | இந்தக் காலம் திறப்பதை விட முடிக்கிறது — அது இழப்பு அல்ல; தொடங்குவதை விட முடியுங்கள் | this stretch closes more than it opens, which is not a loss; finish things rather than start them |
| 112 | 1252 | நீண்ட நாட்களாக இழுத்துக்கொண்டிருக்கும் ஒன்றை முடியுங்கள்; புதிதாக ஒன்றைத் தொடங்க வேண்டாம் | close one long-open thing rather than starting a new one |
| 113 | 1256 | உங்கள் சொந்த ஆர்வமே அமைதியானதற்குப் பிறகும், அந்த இடத்தில் நீங்கள் இருப்பது | staying present in something after your own interest in it has already gone quiet |

### `_VOICE_THEM` — line 1291 · 99 strings

| # | line | Tamil | English |
|---|---|---|---|
| 114 | 1294 | {name} பொறுப்பேற்கும் இயல்பு கொண்டவர்; அதை மற்றவர்கள் உடனே உணர்கிறார்கள் — ஆனால் கருத்து வேறுபாட்டை வெளியே காட்டுவதை விட உள்ளுக்குள் அதிகம் உணர்கிறார். | {name} comes across as someone in charge, and people read that quickly — though they take disagreement more personally than they let on. |
| 115 | 1301 | கேட்காமலேயே மற்றவர்கள் அவரிடம் ஒப்படைக்கும் பொறுப்பு | the authority people hand them without being asked |
| 116 | 1305 | தவறு என்று வெளிப்பட நேரும் தருணம் — தான் நம்பாத நிலைப்பாட்டையும் தொடர்ந்து காப்பாற்றுகிறார் | being seen to be wrong; they defend a position past the point they believe it |
| 117 | 1309 | ஏனெனில் அந்தப் பொறுப்பு அவரது உறுதியின் மீதுதான் வந்தது; அதனால் அவர் காட்டும் எந்தச் சந்தேகமும் அந்தப் பொறுப்பு நழுவுவது போலப் படுகிறது | because that authority arrived on the strength of their certainty, so any doubt they show feels like the authority itself slipping |
| 118 | 1316 | கூட்டத்தில் எடுத்த முடிவை, எல்லோரும் அதைக் கடந்து சென்ற பிறகும் பிடித்துக்கொள்வது — பின்வாங்குவது தோல்வியாகத் தெரியும் என்பதால் | holding onto a decision in a meeting long after the room has moved past it, because backing down there would look like losing |
| 119 | 1322 | தான்தான் தவறு செய்தவர் என்று தெரிந்த பிறகும், முதலில் மன்னிப்புக் கேட்க மறுப்பது | refusing to say sorry first, even once they know they were the one who was wrong |
| 120 | 1327 | தன்னை நிரூபிப்பதும் தானாக மாறுவதும் ஒன்றல்ல என்பதை வாழ்க்கை அவருக்குத் திரும்பத் திரும்பச் சொல்கிறது. | Life keeps reminding them that proving themselves and becoming themselves are not the same thing. |
| 121 | 1333 | அது அவரை மற்றவர்கள் முன்னால் நிறுத்தியது — அவர் விரும்பினாலும் விரும்பாவிட்டாலும் | it put them in front of people, whether or not they wanted to be there |
| 122 | 1337 | இது அவர் கவனிக்கப்படும் காலம்; பாதுகாப்பான பங்கை விட வெளிப்படையான பொறுப்பே அவருக்குப் பலன் தரும் | this is the stretch where they are seen; the visible role serves them better than the safe one |
| 123 | 1341 | தான் செய்யும் வேலைக்குத் தன் பெயர் இருக்கச் செய்வது — இந்தக் காலத்தில் உழைப்பை விட அது தெரிவதுதான் பலன் தரும் | putting their name on their work — this period converts visibility, not effort alone |
| 124 | 1346 | மற்றவர்கள் முன் நிலைத்திருக்கும் நம்பிக்கை, முடிவு உறுதி செய்யப்படுவதற்கு முன்பே | steady confidence in front of people, even before the outcome is certain |
| 125 | 1352 | யாரும் பேசுவதற்கு முன்பே {name} சூழலைப் புரிந்துகொள்கிறார்; அதனால் மற்றவர்கள் தங்கள் கவலைகளை அவரிடம் கொண்டு வருகிறார்கள் — ஆனால் பிறரின் மனநிலை தேவைக்கும் அதிக நேரம் அவருடன் தங்கிவிடுகிறது. | {name} reads a room before anyone speaks, and people bring them their troubles — though other people's moods stay with them longer than they should. |
| 126 | 1360 | மற்றவர்களுக்கு என்ன தேவை என்பதை அவர்கள் சொல்வதற்கு முன்பே அறிதல் | reading what people need before they say it |
| 127 | 1364 | அழுத்தத்தில் நிலைத்திருத்தல் — அவரது மனநிலை சூழலின் மனநிலையைப் பின்தொடர்கிறது | steadiness under pressure; their mood follows the room's more than they would like |
| 128 | 1368 | ஏனெனில் ஒரு சூழலை அவரால் படிக்க முடியும் அதே திறந்த தன்மைதான், அதன் மனநிலையை அவருக்குள் இறங்க விடுகிறது | because the same openness that lets them read a room is what lets its mood settle into them |
| 129 | 1373 | பதற்றமான கூட்டத்தின் மனநிலையை, அது முடிந்த நீண்ட நேரத்திற்குப் பிறகும் வீட்டிற்குக் கொண்டு செல்வது | carrying a tense meeting's mood home long after the meeting itself is over |
| 130 | 1377 | துணையின் மோசமான நாளை, யாரும் அதை முடிவு செய்யாமலேயே தன் சொந்த நாளாக ஏற்றுக்கொள்வது | taking on a partner's bad day as if it were their own, without either of them deciding that |
| 131 | 1382 | எல்லாவற்றையும் சுமக்காமலேயே அக்கறை காட்ட முடியும் என்பதை வாழ்க்கை அவருக்குத் திரும்பத் திரும்பக் கற்பிக்கிறது. | Life keeps asking them to care without carrying all of it. |
| 132 | 1387 | அது அடிக்கடி நகர்ந்தது — இடம், மனநிலை, மனிதர்கள் — அதற்குள் நிலையாக இருக்கும்படி அவரைக் கேட்டது | it moved often — homes, moods, people — and asked them to stay steady inside all of it |
| 133 | 1391 | இந்தக் காலம் மனிதர்களையும் மனநிலையையும் சுற்றியே நகர்கிறது; தன் சொந்தத் தாளத்தை அவர் காத்துக்கொண்டால் நன்றாக நடக்கும் | this stretch runs on people and mood; if they keep their own rhythm it goes well |
| 134 | 1396 | தூக்கத்தையும் தினசரி நேரங்களையும் சீராக வைத்துக்கொள்வது — இந்தக் காலத்தில் அவரது நிலைத்தன்மையே எல்லாவற்றுக்கும் அடிப்படை | protecting their sleep and the rhythm of their days; this period runs on their steadiness |
| 135 | 1401 | சூழல் அமைதியாகும் வரை காத்திராத ஒரு நிலைத்தன்மை | a steadiness that doesn't wait for the room to settle first |
| 136 | 1407 | {name} முதலில் செயல்படுபவர், விரைவாக முடிவெடுப்பவர் — அவரைச் சுற்றி வேலைகள் நடப்பதற்குக் காரணமே அதுதான். ஆனால் கடைசித் தகவல் வருவதற்கு முன்பே முடிவெடுத்துவிடுகிறார். | {name} moves first and decides fast, which is why things around them actually get done — though they commit before the last fact is in. |
| 137 | 1414 | மற்றவர்கள் இன்னும் விவாதித்துக்கொண்டிருக்கும்போது செயல்படுதல் | acting while other people are still discussing |
| 138 | 1418 | பொறுமை — தானாகவே வந்திருக்கக்கூடிய முடிவை அவர் வலுக்கட்டாயமாக வரவழைக்கிறார் | patience; they force a decision that would have come to them on its own |
| 139 | 1422 | ஏனெனில் மற்றவர்களுக்கு முன்பே அவரை நகர்த்தும் அதே உந்துதல்தான், ஒரு முடிவு தானாக வர அனுமதிக்காமல் தடுக்கிறது | because the same push that gets them moving before anyone else decides is what won't let a decision arrive on its own |
| 140 | 1428 | எண்கள் முழுமையாக வருவதற்கு முன்பே ஒரு திட்டத்தை முடிவுக்குத் தள்ளுவது — காத்திருப்பது இடத்தை இழப்பது போலத் தோன்றும் | pushing a project to a decision before the numbers are actually in, because waiting feels like losing ground |
| 141 | 1434 | மறுபக்கத்தினர் தன் எண்ணத்தை முடிவு செய்வதற்கு முன்பே, உரையாடலை ஒரு முடிவுக்குக் கொண்டுவர வலியுறுத்துவது | forcing a conversation to a conclusion before the other person has finished working out what they think |
| 142 | 1440 | ஒவ்வொரு போரும் தன் பலத்திற்குத் தகுதியானது அல்ல என்பதை வாழ்க்கை அவருக்குத் திரும்பத் திரும்பக் கற்பிக்கிறது. | Life keeps teaching them that not every battle deserves their strength. |
| 143 | 1445 | அது செயலுக்குப் பலன் தந்தது, தயக்கத்திற்குத் தண்டனை தந்தது — அவரைக் களைப்படையவும் வைத்தது | it rewarded action and punished hesitation, and it left them tired |
| 144 | 1449 | இந்தக் காலம் முதலில் நகர்பவருக்குப் பலன் தரும்; ஆபத்து என்பது தவறான இலக்கில் சக்தியைச் செலவிடுவது | this stretch rewards moving first; the risk is spending the energy on the wrong target |
| 145 | 1453 | ஒன்றை மட்டும் தேர்ந்தெடுத்து முன்னெடுப்பது; மற்ற மூன்றையும் தள்ளுவதை நிறுத்துவது | picking one thing to push, and letting the other three go |
| 146 | 1457 | நகர்வதற்கு முன்பே தேர்ந்தெடுக்கப்பட்ட ஒரு இலக்கு, நகர்ந்தபடி தேடும் ஒன்றல்ல | a target chosen before they move, not one found while they're already moving |
| 147 | 1463 | {name} வார்த்தைகளில் சிந்திப்பவர்; எந்தச் சூழலையும் பேச்சால் கடந்துவிடுவார் — ஆனால் ஏற்கனவே சரியாக எடுத்த முடிவை மீண்டும் யோசித்து மாற்றிக்கொள்கிறார். | {name} thinks in words and can talk their way through most rooms — though they often reason themselves out of a decision they had already got right. |
| 148 | 1470 | சிக்கலான ஒன்றை எளிமையாக விளக்குதல் | explaining a complicated thing simply |
| 149 | 1474 | முடிவெடுத்தல் — இரு பக்கத்தையும் அவர் நன்றாக வாதிடுவதால் எதுவும் வெல்வதில்லை | deciding; they can argue both sides so well that neither one wins |
| 150 | 1478 | ஏனெனில் ஒன்றை விளக்கும் அளவுக்குத் தெளிவாகப் புரிந்துகொள்வது, அதன் ஒவ்வொரு பக்கத்தையும் அதே தெளிவுடன் காண வைக்கிறது | because seeing a thing clearly enough to explain it means seeing every side of it just as clearly |
| 151 | 1483 | ஒரு முடிவைச் சுற்றிச் சுற்றிப் பேசி, கூட்டமே எந்த முடிவும் இல்லாமல் முடிந்துவிடுவது | talking a decision in circles until the meeting ends with no decision at all |
| 152 | 1487 | ஒரு கருத்து வேறுபாட்டில் துணையின் பக்கத்தை மிக நன்றாக வாதிட்டு, தன் சொந்தக் கருத்தையே மறந்துவிடுவது | arguing a partner's side of a disagreement so well that they lose track of their own |
| 153 | 1492 | எல்லாவற்றையும் இன்னும் நன்றாக விளக்குவதன் மூலம் தீர்த்துவிட முடியாது என்பதை வாழ்க்கை அவருக்குத் திரும்பத் திரும்பக் காட்டுகிறது. | Life keeps showing them that not everything is settled by explaining it better. |
| 154 | 1497 | அது பேச்சு, கற்றல், ஆவணங்கள் நிறைந்த காலம் — நுணுக்கங்களைச் சரியாகச் செய்ததில் வெற்றி வந்தது | it was a stretch of talking, learning and paperwork, where the wins came from getting the details right |
| 155 | 1502 | இந்தக் காலம் வார்த்தை, கற்றல், தெளிவான ஆவணங்களுக்குப் பலன் தரும் — உழைப்புக்கு மட்டும் அல்ல | this stretch pays for words, learning and clear paperwork more than for effort alone |
| 156 | 1506 | எதற்கும் ஒப்புக்கொள்வதற்கு முன் எழுதி வைப்பது — இந்தக் காலத்தில் சிறிய விவரங்கள்தான் முக்கியமாகின்றன | writing it down before agreeing to it; in this period the small details are what matter |
| 157 | 1510 | இரு பக்கமும் வாதிட்ட பிறகும் மாறாமல் நிற்கும் ஒரு முடிவு | a decision that stays decided, even after they've argued both sides of it |
| 158 | 1516 | {name} மக்கள் தீர்ப்புக்காகத் தேடி வரும் ஒருவர்; அவர் தாராளமாகக் கொடுக்கிறார் — ஆனால் ஒருவரால் தாங்கக்கூடியதை விட அதிகமாக வாக்குறுதி அளிக்கிறார். | People come to {name} for judgment, and it is given generously — though {name} promises more than one person can reasonably carry. |
| 159 | 1525 | மற்றவர்கள் நம்பிச் செயல்படும் அளவுக்கான தீர்ப்பு | judgment people trust enough to act on |
| 160 | 1529 | மறுத்துச் சொல்வது — அதனால் அவரது சம்மதம் பல இடங்களில் மெலிந்துவிடுகிறது | saying no, so their yes gets spread thin |
| 161 | 1533 | ஏனெனில் மற்றவர்கள் தேடி வரும் அதே தீர்ப்புதான், ஒவ்வொரு முறையும் பதில் சம்மதமாக இருக்க வேண்டிய ஒரு காரணத்தையும் கண்டுபிடித்துவிடுகிறது | because the judgment people come to them for is the same judgment that keeps finding a reason the answer should be yes |
| 162 | 1540 | ஏற்கனவே இருக்கும் திட்டங்களே பாதிக்கப்படும் நிலையிலும், இன்னும் ஒரு திட்டத்தை ஏற்றுக்கொள்வது | agreeing to take on one more project when the ones they already have are the ones suffering |
| 163 | 1545 | தன்னைச் சுற்றி இருப்பவர்களின் தேவைகளுக்கெல்லாம் சம்மதித்து, தனக்கு மிக நெருக்கமானவருக்கு எதுவும் மிச்சம் வைக்காதது | saying yes to what everyone around them needs, until there is nothing left over for the person closest to them |
| 164 | 1552 | வரம்பின்றி அல்ல, விவேகத்துடன் கொடுக்கும்படி வாழ்க்கை அவரைத் திரும்பத் திரும்பக் கேட்கிறது. | Life keeps asking them to give wisely rather than endlessly. |
| 165 | 1557 | அது கதவுகளைத் திறந்தது, அவரது வட்டத்தை விரிவாக்கியது — அவர் உள்ளே நுழைந்த அளவுக்கு | it opened doors and widened their circle, to the extent that they walked through them |
| 166 | 1561 | இந்தக் காலம் விரிவடைகிறது — கற்பித்தல், பிள்ளைகள், அவரை விட மூத்தவர்களின் உதவி கிடைக்கும் | this stretch widens things — teaching, children, and people senior to them tend to help |
| 167 | 1565 | யாருக்காவது ஒன்றைக் கற்றுக் கொடுப்பது — அது எடுக்கும் நேரத்தை விட அதிகமாகவே திரும்பக் கிடைக்கும் | saying yes to teaching someone; here it returns more than it costs |
| 168 | 1570 | மிச்சமிருக்கும் சம்மதம் அர்த்தமுள்ளதாக இருக்க, ஒரு தெளிவான மறுப்பு | one clear no, so the rest of their yes still means something |
| 169 | 1576 | {name} சூழலையும் மனிதர்களையும் இதமாக வைத்திருப்பவர்; திறமை மட்டும் திறக்காத கதவுகளை அது திறக்கும் — ஆனால் தெளிவைக் கொடுக்கும் அந்த ஒரு உரையாடலைத் தவிர்க்கிறார். | {name} makes things pleasant and people comfortable, and that opens doors ability alone would not — though they avoid the one conversation that would clear the air. |
| 170 | 1583 | மனிதர்களிடம் காட்டும் பொறுமையும், அது ஈட்டித் தரும் நல்லெண்ணமும் | patience with people, and the goodwill it earns |
| 171 | 1587 | நேரடி மோதல் — எதிர்த்துச் சொல்வதை விட உள்ளுக்குள் தாங்கிக்கொள்கிறார், அது சேர்ந்துகொண்டே வரும் | confrontation; they tend to absorb rather than object, and it accumulates |
| 172 | 1591 | ஏனெனில் மற்றவர்களின் நல்லெண்ணத்தை ஈட்டித்தரும் அதே பொறுமைதான், அவர் சொல்ல வேண்டிய எதிர்ப்பையும் விழுங்கிவிடுகிறது | because the patience that earns people's goodwill is the same instinct that swallows the objection they should have raised |
| 173 | 1597 | உண்மையில் உடன்படாத ஒரு முடிவுக்குக் கூட்டத்தில் தலையசைத்து, பிறகு அதை யாரிடமும் எடுத்துச் சொல்லாதது | agreeing with a decision in the room that they actually disagree with, and raising it with no one afterwards |
| 174 | 1602 | ஒரு சிறிய வருத்தத்தைச் சொல்லாமல் விட்டுவிட்டு, அது அமைதியாகப் பலவாகச் சேர்ந்துவிடுவது | letting a small hurt go unsaid until it has quietly become several |
| 175 | 1607 | மௌனத்தால் வாங்கிய அமைதி நீடிப்பதில்லை என்பதை வாழ்க்கை அவருக்குத் திரும்பத் திரும்ப நினைவூட்டுகிறது. | Life keeps reminding them that peace bought with silence does not hold. |
| 176 | 1612 | அது பொறுமைக்கு வசதியைத் திருப்பித் தந்தது, அதை மிகைப்படுத்தாமல் அனுபவிக்கும்படி அவரைக் கேட்டது | it repaid patience with comfort, and asked them to enjoy it without over-spending it |
| 177 | 1616 | இது தாராளமான காலம் — உறவுகள், வசதி, பணம் இப்போது எளிதாக நகர்கின்றன | this is a generous stretch — relationships, comfort and money move more easily now |
| 178 | 1620 | முக்கியமானதை நிதானமாகத் தொடங்குவது; தவிர்த்துவரும் அந்த உரையாடலை முடிப்பது | starting what matters gently, and finishing the conversation they have been avoiding |
| 179 | 1624 | மென்மையாக்குவதை விட, நடத்த வேண்டிய அந்த ஒரு உரையாடல் | the conversation they'd rather smooth over than actually have |
| 180 | 1630 | {name} தொடங்கியதை முடிப்பவர்; முதலில் இருப்பதை விட உறுதியாக இருப்பதையே விரும்புவார் — ஆனால் ஒரு வழிமுறையை ஏற்ற பிறகு, அது பலன் தராத நிலையிலும் அதை விட்டு விலகுவது அவருக்குக் கடினம். | {name} finishes what they start and would rather be sure than first — though once committed to a way of working, they find it hard to let go. |
| 181 | 1637 | வேகமானவர்களைத் தோற்கடிக்கும் பிரச்சினைகளை விடத் தாக்குப்பிடித்தல் | outlasting problems that defeat faster people |
| 182 | 1641 | தொடங்குவது — வராத ஒரு உறுதிக்காக அவர் காத்திருக்கிறார் | starting; they wait for a certainty that does not arrive |
| 183 | 1645 | ஏனெனில் உறுதியாகும் வரை நகராத அதே குணம்தான், மற்றவர்களை விட அவரைத் தாக்குப்பிடிக்க வைக்கிறது, அது பயனற்றுப் போன பிறகும் அவரை நிறுத்தி வைக்கிறது | because the same refusal to move before they're sure is what lets them outlast everyone else, and what keeps them standing still after it stops helping |
| 184 | 1652 | ஒரு திட்டமுன்மொழிவை முழுமையாகும் வரை தாமதப்படுத்துவது — கவனம் குறைவானவர் தன்னுடையதை முன்பே சமர்ப்பித்துவிடுவார் | sitting on a proposal until it is airtight, while someone less careful ships theirs first |
| 185 | 1658 | முக்கியமானதைச் சொல்ல சரியான தருணத்திற்காகக் காத்திருந்து, அந்தத் தருணமே அமைதியாகக் கடந்துவிடுவது | waiting for the right moment to say what matters, until the moment has quietly passed |
| 186 | 1663 | உறுதி வரும்வரை காத்திருப்பதன் விலை, உறுதியின்றித் தொடங்குவதை விட அதிகம் என்பதை வாழ்க்கை அவருக்குக் கற்பிக்கிறது. | Life keeps teaching them that waiting for certainty costs more than starting without it. |
| 187 | 1669 | அது பலனை விடப் பொறுமையையே அதிகம் கேட்டது; அங்கே எதுவும் அவசரத்திற்கு இணங்கவில்லை | it asked for endurance more than it offered reward, and nothing in it yielded to haste |
| 188 | 1673 | இந்தக் காலம் தாமதமாகத் தரும், ஆனால் தரும் — அவசரப்பட்டுச் செய்வதை விட இப்போது அவர் கட்டுவது நீடிக்கும் | this stretch pays late, but it does pay; what they build now outlasts what they rush |
| 189 | 1677 | ஒரு சிறிய உறுதிமொழியை தினமும் காப்பாற்றுவது — இந்தக் காலத்தில் தொடர்ந்து செய்யக்கூடிய செயல்களுக்கே அதிக மதிப்பு கிடைக்கும் | keeping one small commitment every day; this period rewards what they sustain |
| 190 | 1682 | தயாராக உணரும் முன்பே எடுக்கப்படும் ஒரு தொடக்கம் | a start made before they feel ready for it, not after |
| 191 | 1688 | {name} தனக்குக் கொடுக்கப்பட்ட இடத்தை விட அதிகம் வேண்டும் என்பவர்; மற்றவர் காணாத வழிகளைக் கண்டுபிடிப்பார் — ஆனால் சென்றடைந்ததை அனுபவிக்க நிற்பதே இல்லை. | {name} wants more than the room they were given and finds routes other people do not see — though they rarely stop long enough to enjoy arriving. |
| 192 | 1695 | மற்றவர்கள் சுவரைக் காணும் இடத்தில் ஒரு வழியைக் காணுதல் | seeing an opening where other people see a wall |
| 193 | 1699 | முடிப்பது — நடப்பதை விட அடுத்தது எப்போதும் சுவாரஸ்யமாக இருக்கிறது | finishing; the next thing is always more interesting than the current one |
| 194 | 1703 | ஏனெனில் மற்றவர்கள் காணாத வழியை அவருக்குக் காட்டும் அதே பசி, அவர் ஏற்கனவே இருக்கும் வழியை முடிந்துவிட்டதாக உணர வைக்கிறது | because the same hunger that shows them the opening no one else sees is what makes the one they're already in feel finished before it is |
| 195 | 1710 | தற்போதைய திட்டம் முழுமையாக முடிவதற்கு முன்பே அடுத்த திட்டத்தைத் தொடங்கிவிடுவது | starting the next project before the current one is actually closed out |
| 196 | 1714 | ஏற்கனவே இருக்கும் உறவில் முழுமையாக நிலைபெறுவதற்கு முன்பே, புதிதாக ஒன்றின் ஈர்ப்பை உணர்வது | feeling the pull of what's new before they have finished settling into what they already have |
| 197 | 1720 | அடுத்ததாக அவர் தேடுவது உண்மையில் அவர் விரும்பியதுதானா என்று வாழ்க்கை திரும்பத் திரும்பக் கேட்கிறது. | Life keeps asking whether the next thing is the one they actually wanted. |
| 198 | 1725 | அது வழக்கத்திற்கு மாறான திருப்பங்கள் நிறைந்தது — அவர் சென்ற பாதை திட்டமிட்டது அல்ல | it was a stretch of unusual turns — the route they took was not the one they planned |
| 199 | 1729 | இந்தக் காலம் வழக்கத்திற்கு மாறான வழிகளைத் தருகிறது; தோன்றியதால் அல்ல, தேர்ந்தெடுத்தே அவற்றை எடுப்பது நல்லது | this stretch offers unconventional routes; they are worth taking deliberately, not because they appeared |
| 200 | 1735 | எந்த வழி என்பதைத் தெரிந்தே தேர்ந்தெடுப்பது — கண்முன் வந்தது என்பதற்காக மட்டும் அல்ல | choosing the route deliberately, not taking one just because it appeared |
| 201 | 1739 | சென்றடைய முடியும் அளவுக்கு நீண்ட நேரம் பிடித்திருக்கப்படும் ஒரு இலக்கு | one destination held onto long enough to actually arrive |
| 202 | 1745 | {name} எதையும் விரைவில் ஊடுருவிப் பார்ப்பவர்; எளிதில் வியப்படைவதில்லை — ஆனால் கேட்டே தெரிந்துகொள்ளக்கூடிய ஒன்றிலிருந்தும் விலகிவிடுகிறார். | {name} sees through things quickly and is not easily impressed — though they withdraw from what they could simply have asked about. |
| 203 | 1752 | உண்மையில் முக்கியமானது எது என்பதை நேராக அடைதல் | cutting straight to what actually matters |
| 204 | 1756 | தங்கியிருப்பது — சூழலுக்குத் தேவை அதுவாக இருக்கும்போதும் விலகிவிடுகிறார் | staying — they withdraw at the times when staying is what the situation needs |
| 205 | 1760 | ஏனெனில் முக்கியமற்றதைத் தாண்டிச் செல்லும் அதே உள்ளுணர்வுதான், ஒரு விஷயத்திற்கு அவர் இன்னும் தேவைப்படும்போதே அவரை விலக்கிச் செல்கிறது | because the same instinct that cuts past what doesn't matter is what pulls them away before a thing is finished needing them |
| 206 | 1767 | ஒரு திட்டத்திற்கு அவரது இருப்பு மிகவும் தேவைப்படும் தருணத்திலேயே, அமைதியாக விலகிவிடுவது | going quiet on a project right when it most needs them to stay in the room |
| 207 | 1771 | ஒரு உரையாடல் கடினமாக மாறும் தருணத்திலேயே, அதில் தொடர்வதற்குப் பதிலாகப் பின்வாங்குவது | pulling back from a conversation the moment it turns difficult, instead of staying in it |
| 208 | 1777 | இன்னும் கவனத்திற்குத் தகுதியானதை விட்டு விலகக் கூடாது என்பதை வாழ்க்கை அவருக்குத் திரும்பத் திரும்ப நினைவூட்டுகிறது. | Life keeps reminding them not to leave what still deserves their attention. |
| 209 | 1782 | அது அமைதியாகப் பலவற்றை முடித்து வைத்தது; சேர்ப்பதை விட விட்டுவிடும்படி அவரைக் கேட்டது | it quietly closed things off, and asked them to let go more than to acquire |
| 210 | 1786 | இந்தக் காலம் திறப்பதை விட முடிக்கிறது — அது இழப்பு அல்ல; தொடங்குவதை விட முடிப்பதே அவருக்கு நல்லது | this stretch closes more than it opens, which is not a loss; finishing things serves them better than starting them |
| 211 | 1791 | நீண்ட நாட்களாக இழுத்துக்கொண்டிருக்கும் ஒன்றை முடிப்பது; புதிதாக ஒன்றைத் தொடங்காமல் இருப்பது | closing one long-open thing rather than starting a new one |
| 212 | 1795 | தன் சொந்த ஆர்வமே அமைதியானதற்குப் பிறகும், அந்த இடத்தில் அவர் இருப்பது | staying present in something after their own interest in it has already gone quiet |

### `_SIGNATURE_OPENING` — line 1832 · 9 strings

| # | line | Tamil | English |
|---|---|---|---|
| 213 | 1834 | சிலர் கவனிக்கப்படாத இடத்தில் சிறப்பாகச் செயல்படுவார்கள். சிலர் பார்க்கப்படும்போதுதான் முழுமையாகத் தங்களாக இருப்பார்கள். நீங்கள் இரண்டாவது வகை. | Some people do their best work out of sight. Others are only fully themselves when they are being watched. You are the second kind. |
| 214 | 1842 | சிலர் திட்டங்களை வைத்து வாழ்க்கையைக் கடப்பார்கள். சிலர் சூழலை உணர்ந்து கடப்பார்கள் — சொல்லப்படுவதற்கு முன்பே மாற்றத்தை உணர்பவர்கள். நீங்கள் இரண்டாவது வகை. | Some people move through life on plans. Others move on atmosphere — reading a room, feeling a shift before it is announced. You are the second kind. |
| 215 | 1850 | சிலர் சரியான தருணத்திற்குக் காத்திருப்பார்கள். சிலர் அதை உருவாக்கிவிட்டு விளைவுகளைச் சமாளிப்பார்கள். நீங்கள் இரண்டாவது வகை. | Some people wait for the right moment. Others create it and deal with the consequences afterwards. You are the second kind. |
| 216 | 1857 | சிலர் தங்கள் இருப்பால் மற்றவர்களை நம்பவைப்பார்கள். சிலர் விளக்கத்தால் நம்பவைப்பார்கள். நீங்கள் இரண்டாவது வகை. | Some people convince others by sheer presence. Others convince by explaining. You are the second kind. |
| 217 | 1865 | சிலர் ஒவ்வொரு கதவையும் தள்ளித் திறக்க வேண்டியிருக்கும். சிலருக்குக் கதவுகள் திறக்கும் — எளிதாக வந்ததை மதிக்காமல் விடுவதுதான் அவர்களின் ஆபத்து. நீங்கள் இரண்டாவது வகை. | Some people force every door. Others find doors tend to open — and their real risk is not valuing what came easily. You are the second kind. |
| 218 | 1877 | சிலர் தாங்கள் விரும்புவதை அழுத்தத்தால் அடைவார்கள். சிலர், மற்றவர்கள் கொடுக்க விரும்புவதால் அடைவார்கள். நீங்கள் இரண்டாவது வகை. | Some people get what they want by pushing for it. Others get it because people want to give it to them. You are the second kind. |
| 219 | 1884 | சிலருக்கு வாய்ப்புகள் தானாக வந்து சேரும். சிலர் ஒவ்வொரு வாய்ப்பையும் போராடி வெல்ல வேண்டியிருக்கும். நீங்கள் இரண்டாவது வகை. | Some people find that opportunities arrive on their own. Others have to win each one. You are the second kind. |
| 220 | 1892 | சிலர் தங்களுக்குக் கிடைத்த வாழ்க்கைக்குள் நிறைவாக இருப்பார்கள். சிலர் அதன் எல்லையைத் தாண்டியே கை நீட்டிக்கொண்டிருப்பார்கள். நீங்கள் இரண்டாவது வகை. | Some people are content inside the life they were handed. Others spend it reaching past the edge of it. You are the second kind. |
| 221 | 1899 | சிலருக்கு அறைக்குள் இருப்பது அவசியம். சிலருக்கு சற்று வெளியே நின்றால்தான் அது தெளிவாகத் தெரியும். நீங்கள் இரண்டாவது வகை. | Some people need to be in the room. Others see it more clearly from just outside it. You are the second kind. |

### `_SECOND_KIND` — line 1915 · 1 strings

| # | line | Tamil | English |
|---|---|---|---|
| 222 | 1915 | நீங்கள் இரண்டாவது வகை. | You are the second kind. |

### `_SECOND_KIND_THEM` — line 1916 · 1 strings

| # | line | Tamil | English |
|---|---|---|---|
| 223 | 1916 | {name} இரண்டாவது வகை. | {name} is the second kind. |

### `_MOON_MIND` — line 1962 · 12 strings

| # | line | Tamil | English |
|---|---|---|---|
| 224 | 1963 | முடிவெடுத்து முடிக்கும் முன்பே தொடங்கிவிடும் | a mind that starts before it has finished deciding |
| 225 | 1965 | மெதுவாக நிலைபெறும்; பிறகு அசையாது | a mind slow to settle and then immovable |
| 226 | 1967 | சூழ்நிலையை விட வேகமாக ஓடும் | a mind that runs ahead of your circumstances |
| 227 | 1969 | உணர்ந்த அனைத்தையும் வைத்திருக்கும் | a mind that keeps everything it has felt |
| 228 | 1971 | நடைமுறையாகப் பார்ப்பதற்கு முன் தன்னைச் சார்ந்ததாகப் பார்க்கும் | a mind that takes things personally first, practically second |
| 229 | 1973 | முழுமையைக் காண்பதற்கு முன் குறையைக் காணும் | a mind that sees the flaw before the whole |
| 230 | 1975 | பதில் தெரிந்த பிறகும் நிறுத்தி நிறுத்திப் பார்க்கும் | a mind still weighing after the answer is obvious |
| 231 | 1979 | விடாமல் பிடிக்கும்; நினைத்ததை விட ஆழமாகச் செல்லும் | a mind that grips, and goes deeper than intended |
| 232 | 1981 | பதிலை மட்டுமல்ல, அதன் பின்னுள்ள நெறியையும் தேடும் | a mind that wants the principle behind the answer |
| 233 | 1983 | லாபத்தைக் கணக்கிடும் முன் விலையைக் கணக்கிடும் | a mind that counts the cost before the gain |
| 234 | 1985 | சற்று விலகி நின்று கவனிக்கும் | a mind that stands a little apart and watches |
| 235 | 1987 | இருக்கும் இடத்தின் உணர்வை உள்வாங்கும் | a mind that absorbs whatever room it is in |

### `_LAGNA_FACE` — line 2000 · 12 strings

| # | line | Tamil | English |
|---|---|---|---|
| 236 | 2001 | ஏற்கனவே நகர்ந்துகொண்டிருப்பவராகத் தெரிகிறீர்கள் | already in motion |
| 237 | 2003 | அவசரமற்றவராகத் தெரிகிறீர்கள்; அதை உறுதி என்று படிக்கிறார்கள் | unhurried, and they read that as certainty |
| 238 | 2005 | விரைவானவராகவும் பேச எளியவராகவும் தெரிகிறீர்கள் | quick, and easy to talk to |
| 239 | 2007 | யாரை அருகில் விடுவது என்பதில் கவனமானவராகத் தெரிகிறீர்கள் | careful about who gets close |
| 240 | 2009 | கேட்காமலேயே பொறுப்பில் இருப்பவராகத் தெரிகிறீர்கள் | as someone in charge, asked or not |
| 241 | 2011 | நுணுக்கமானவராக — சில நேரம் திருத்துபவராக — தெரிகிறீர்கள் | exact, and sometimes correcting |
| 242 | 2013 | உங்கள் கருத்து தெரிவதற்கு முன்பே இணக்கமானவராகத் தெரிகிறீர்கள் | agreeable long before they meet your opinion |
| 243 | 2015 | படிக்க முடியாதவராகத் தெரிகிறீர்கள்; ஆழம் இருக்கும் என்று எண்ணுகிறார்கள் | hard to read, and they assume depth |
| 244 | 2017 | வெளிப்படையானவராகத் தெரிகிறீர்கள்; நேரடித்தன்மை நம்பிக்கையாகப் படுகிறது | open, and they read directness as confidence |
| 245 | 2019 | உங்கள் வயதை விட மூத்தவராகத் தெரிகிறீர்கள் | serious, and older than you are |
| 246 | 2021 | கூட்டத்திற்குள் இருந்தாலும் சற்று தனித்தவராகத் தெரிகிறீர்கள் | slightly apart, even from inside the group |
| 247 | 2023 | நீங்கள் இருப்பதை விட மென்மையானவராகத் தெரிகிறீர்கள் | softer than you are |

### `_GRIEVANCE` — line 2033 · 9 strings

| # | line | Tamil | English |
|---|---|---|---|
| 248 | 2034 | இதை நான் ஏன் திரும்பத் திரும்ப நிரூபிக்க வேண்டியிருக்கிறது | why do I have to keep proving this |
| 249 | 2036 | மற்றவர்களின் மனநிலை ஏன் என் சுமையாகிறது | why does everyone else's mood end up being mine to carry |
| 250 | 2038 | ஒவ்வொரு முறையும் நான்தான் ஏன் தொடங்க வேண்டியிருக்கிறது | why am I always the one who has to start it |
| 251 | 2040 | ஏற்கனவே புரிந்திருக்க வேண்டியதை ஏன் நான் விளக்கிக்கொண்டே இருக்கிறேன் | why am I still explaining things people should already understand |
| 252 | 2042 | எல்லோரும் என்னிடம் வருகிறார்கள் — எனக்காக யார் வருகிறார்கள் | everyone comes to me, so who comes for me |
| 253 | 2044 | சமாதானம் காப்பது நான் — காயப்படுவதும் ஏன் நான் | why do I keep the peace and still end up the one who is hurt |
| 254 | 2046 | இவ்வளவு முயற்சி செய்கிறேனே — ஏன் இன்னும் தாமதமாகிறது | I am putting in this much, so why is it still taking so long |
| 255 | 2048 | எதுவும் ஏன் போதுமானதாக இருப்பதே இல்லை | why does none of it ever feel like enough |
| 256 | 2050 | நான் வாழும் வாழ்க்கைக்கு வெளியே நிற்பது போல் ஏன் தோன்றுகிறது | why do I feel like I am standing outside a life I am supposedly living |

### `_VALIDATION` — line 2056 · 1 strings

| # | line | Tamil | English |
|---|---|---|---|
| 257 | 2057 | அந்த உணர்வு வீணானது அல்ல. | That feeling is not misplaced. |

### `_FALSIFIABILITY` — line 2104 · 5 strings

| # | line | Tamil | English |
|---|---|---|---|
| 258 | 2106 | இது உங்களைப் பற்றியதாக இல்லை என்று தோன்றினால் — சிறிதளவும் அல்ல, உண்மையிலேயே இல்லை என்றால் — தொடர்வதற்கு முன் பிறந்த தேதியையும் நேரத்தையும் சரிபாருங்கள். இருபது நிமிடங்கள் லக்னத்தை மாற்றிவிடும். | If that does not sound like you — not partly, genuinely not — check the birth date and time before reading on. Twenty minutes can move the rising sign. |
| 259 | 2123 | பிறந்த நேரம் உறுதிப்படுத்தப்படவில்லை; அதனால் இந்த வாசிப்பு லக்னத்தை விட்டுவிடுகிறது — இருபது நிமிடங்கள் அதை மாற்றிவிடும். உங்கள் நட்சத்திரமும் இங்குள்ள காலக் கணக்குகளும் அதைச் சாராமல் நிற்கின்றன. | The birth time is not confirmed, so this reading leaves the rising sign out — twenty minutes can move it. Your star and every date here stand without it. |
| 260 | 2130 | இது {name}-ஐப் பற்றியதாக இல்லை என்று தோன்றினால் — சிறிதளவும் அல்ல, உண்மையிலேயே இல்லை என்றால் — தொடர்வதற்கு முன் பிறந்த தேதியையும் நேரத்தையும் சரிபாருங்கள். இருபது நிமிடங்கள் லக்னத்தை மாற்றிவிடும். | If that does not sound like {name} — not partly, genuinely not — check the birth date and time before reading on. Twenty minutes can move the rising sign. |
| 261 | 2144 | {name}-இன் பிறந்த நேரம் உறுதிப்படுத்தப்படவில்லை; அதனால் இந்த வாசிப்பு லக்னத்தை விட்டுவிடுகிறது — இருபது நிமிடங்கள் அதை மாற்றிவிடும். அவரின் நட்சத்திரத்தை அது மாற்றுவதில்லை; மீதி அதன் மீதுதான் நிற்கிறது. | {name}'s birth time is not confirmed, so this reading leaves the rising sign out — twenty minutes can move it. It does not move their star, which the rest is built on. |
| 262 | 2156 | {name}-இன் பிறந்த நேரம் உறுதிப்படுத்தப்படவில்லை; அதனால் இந்த வாசிப்பு லக்னத்தை விட்டுவிடுகிறது — இருபது நிமிடங்கள் அதை மாற்றிவிடும். அவரது நட்சத்திரமும் இங்குள்ள காலக் கணக்குகளும் அதைச் சாராமல் நிற்கின்றன. | {name}'s birth time is not confirmed, so this reading leaves the rising sign out — twenty minutes can move it. Their star and every date here stand without it. |

### `_LAGNA_STRENGTH_CAVEAT` — line 2183 · 1 strings

| # | line | Tamil | English |
|---|---|---|---|
| 263 | 2184 | அடுத்து வரும் பலமும் அதன் விலையும் லக்னத்தைச் சார்ந்தவை; அவற்றை மட்டும் சற்று தளர்வாக எடுத்துக்கொள்ளுங்கள். | The strength and the cost named next do rest on it, so hold those more lightly. |

### `_PAST_INVITATION` — line 2244 · 1 strings

| # | line | Tamil | English |
|---|---|---|---|
| 264 | 2245 | அது உங்களுக்கு எங்கே, எப்படித் தெரிந்தது? | Where did that show up for you? |

### `_PAST_INVITATION_THEM` — line 2251 · 1 strings

| # | line | Tamil | English |
|---|---|---|---|
| 265 | 2252 | அது {name}-இடம் எங்கே, எப்படித் தெரிந்தது? | Where did that show up for {name}? |

### `_MINOR_NOW_TEXTURE` — line 2280 · 2 strings

| # | line | Tamil | English |
|---|---|---|---|
| 266 | 2282 | இந்தக் காலம் விரிவடைகிறது — கற்றல், ஆசிரியர்கள், உங்களை விட மூத்தவர்களின் உதவி கிடைக்கும் | this stretch widens things — learning, teachers, and people older than you tend to help |
| 267 | 2286 | இது எளிதான காலம் — நட்பு, கலை, ரசனை சார்ந்தவை இப்போது எளிதாக நகர்கின்றன | this is an easier stretch — friendships, art and anything with taste in it move more easily now |

### `_CHILD_VOICE` — line 2437 · 18 strings

| # | line | Tamil | English |
|---|---|---|---|
| 268 | 2440 | {name} சீக்கிரமே தன்னை மற்றவர்கள் மதிக்க வேண்டும் என்று விரும்புவார்; பொறுப்பு கொடுத்தால் சிறப்பாகச் செய்வார் — ஆனால் மற்றவர்கள் முன்னிலையில் திருத்தப்படுவது எதிர்பார்ப்பதை விட ஆழமாகப் பாதிக்கும். | {name} will want to be taken seriously early and does better with responsibility than without it — though being corrected in front of others lands harder than you would expect. |
| 269 | 2447 | அவருக்கே சொந்தமான ஒரு பொறுப்பைக் கொடுங்கள்; திருத்த வேண்டியதைத் தனியாகச் சொல்லுங்கள் | give them one real responsibility that is theirs alone, and correct them privately |
| 270 | 2453 | யாரும் விளக்குவதற்கு முன்பே {name} வீட்டின் மனநிலையை உணர்ந்துகொள்வார் — அது ஒரு வரம்; அதனாலேயே ஒரு கலக்கமான வாரம் மற்ற எல்லோரையும் விட முதலில் அவரிடம் தெரியும். | {name} picks up the mood of a room before anyone explains it — a real gift, and the reason an unsettled week shows up in them before it shows in anyone else. |
| 271 | 2459 | தூக்கமும் உணவு நேரமும் சலிப்பூட்டும் அளவுக்கு ஒரே சீராக இருக்கட்டும் — இந்தக் காலத்தில் அவரின் நிலைத்தன்மையே எல்லாவற்றுக்கும் அடிப்படை | keep sleep and mealtimes boringly regular; this period runs on their steadiness |
| 272 | 2466 | {name} முதலில் செயல்பட்டு பிறகு கேட்பார்; அந்தச் சக்தியை அடக்குவதை விட வழிநடத்துவதே சரி — ஒரு அறிவுரைக்காகக் காத்திருக்கும் பொறுமைதான் பயிற்சி தேவைப்படும் இடம். | {name} moves first and asks later, which is energy worth steering rather than damping — the patience to wait for an instruction is what will need practice. |
| 273 | 2483 | அந்தச் சக்திக்குத் தினமும் உடல் உழைப்பில் ஒரு வடிகால் கொடுங்கள் — எது என்பதை விட தினமும் என்பதே முக்கியம் | give the energy a physical outlet every day — the daily part matters more than which one |
| 274 | 2491 | {name} பேசிப் பேசியே கற்பார், வாதிடுவதிலேயே ஒரு சுவை காண்பார் — ஒரு சிந்தனையை முடிப்பது, மூன்றைத் தொடங்குவதல்ல, வளர்க்க வேண்டிய திறன். | {name} learns by talking and will argue for the pleasure of it — the skill to build is finishing one thought rather than starting three. |
| 275 | 2497 | கற்றதை வாய்விட்டுச் சொல்லச் சொல்லுங்கள்; மீண்டும் படிப்பதை விட அது நன்றாக நிற்கும் | let them explain what they learned out loud; it settles far better than re-reading |
| 276 | 2503 | {name} நியாயத்தை முக்கியமாக எடுத்துக்கொள்வார்; ஒரு விதி சமமாகப் பயன்படுத்தப்படாதபோது உடனே கவனிப்பார் — கொடுப்பது எளிது, நண்பரிடம் மறுத்துச் சொல்வது அல்ல. | {name} takes fairness seriously and notices when a rule is applied unevenly — generosity comes easily; saying no to a friend does not. |
| 277 | 2509 | நியாயம் பற்றிய கேள்விகளைத் தட்டிக்கழிக்காமல் முறையாகப் பதில் சொல்லுங்கள் | answer the fairness questions properly rather than deflecting them |
| 278 | 2515 | தன்னைச் சுற்றியுள்ளவர்கள் நிம்மதியாக இருக்க வேண்டும் என்பதற்காக {name} சிக்கல்களை மென்மையாக மறைத்துவிடுவார் — அதனால் ஒரு வருத்தம் நன்றாக மறைந்திருக்கக்கூடும். | {name} wants the people around them at ease and will smooth trouble over to get it — which means an upset can stay well hidden. |
| 279 | 2521 | என்ன பிரச்சினை என்று இரண்டு முறை கேளுங்கள்; முதல் பதில் வசதியானதாகவே இருக்கும் | ask what is wrong twice; the first answer will be the comfortable one |
| 280 | 2527 | {name} தொடங்குவதில் மெதுவாக இருப்பார், தொடங்கிய பிறகு நிலையாக இருப்பார்; ஆரம்ப ஆண்டுகள் அவசரமில்லாமல் தெரிந்து பின்னர் உறுதிப்படும். வேகத்திற்காக அழுத்துவது காத்திருப்பதை விட விலை அதிகம். | {name} is slower to start and steadier once started; the early years can look unhurried and then hold. Pushing for speed costs more here than waiting does. |
| 281 | 2534 | மெதுவாக இருக்க அனுமதியுங்கள்; வேகத்தை அல்ல, முடித்ததைப் பாராட்டுங்கள் | let them be slow, and praise finishing rather than speed |
| 282 | 2540 | எட்டாத தூரத்தில் இருப்பதன் மீதே {name}க்கு ஈர்ப்பு; அதை அடைய வழக்கத்திற்கு மாறான வழியைக் கண்டுபிடிப்பார் — ஆர்வம் சூடாக இருக்கும், அதை ஒன்றிலேயே நிலைநிறுத்துவதே வேலை. | {name} is drawn to whatever is just out of reach and will find an unusual route to it — the interest runs hot, and holding it to one thing is the work. |
| 283 | 2552 | புதிது ஒன்று தோன்றினாலும், ஏற்கனவே தொடங்கிய ஆர்வத்தைத் தொடரச் செய்யுங்கள் | keep one interest going even when a newer one appears |
| 284 | 2558 | {name} தன்னிறைவானவர்; கலந்துகொள்வதை விடக் கவனிப்பது அதிகம் — தனியாக இருப்பதில் சங்கடமில்லை, ஆனால் தேவைப்படும்போதும் உதவி கேட்பது தாமதமாகும். | {name} is self-contained and observes more than they join in — comfortable alone, and slower to ask for help than they need to be. |
| 285 | 2564 | அவரே கேட்கும் வரை காத்திருக்காமல், நீங்களே அழைத்துச் சேர்த்துக்கொள்ளுங்கள் | invite them in rather than waiting for them to ask |

### `_marital_status_pending_question()` — line 2633 · 8 strings

| # | line | Tamil | English |
|---|---|---|---|
| 286 | 2654 | இதற்குப் பதில் கிடைக்கும் வரை இந்த வாசிப்பின் ஒரு பகுதி நிறுத்தி வைக்கப்பட்டுள்ளது — இவற்றில் எது இப்போது  | — |
| 287 | 2655 | -க்குப் பொருந்தும்? | — |
| 288 | 2665 | இதற்குப் பதில் கிடைக்கும் வரை இந்த வாசிப்பின் ஒரு பகுதி நிறுத்தி வைக்கப்பட்டுள்ளது — இவற்றில் எது இப்போது உங்களுக்குப் பொருந்தும்? | One part of this reading is held back until this is answered — which of these fits you now? |
| 289 | 2680 | திருமணமானவர் | Married |
| 290 | 2684 | திருமணமாகவில்லை | Not married |
| 291 | 2688 | விவாகரத்து ஆனவர் | Divorced |
| 292 | 2698 | வாழ்க்கைத் துணையை இழந்தவர் | Widowed |
| 293 | 2702 | சொல்ல விரும்பவில்லை | Prefer not to say |

### `_LONGEVITY_REFUSAL` — line 2727 · 1 strings

| # | line | Tamil | English |
|---|---|---|---|
| 294 | 2728 | இந்த வாசிப்பு ஆயுளைக் கணிப்பதில்லை. ஜாதகம் அதைப் பற்றி மௌனமாக இருப்பதால் அல்ல — அந்தப் பதில், மிச்சமிருக்கும் காலத்தை ஒருவர் எப்படிக் கழிக்கிறார் என்பதையே மாற்றிவிடும். | This reading does not read length of life. Not because the chart is silent on it — because that answer changes how a person spends the years they have. |

### `_OUTLOOK_SUPPORTIVE` — line 2776 · 1 strings

| # | line | Tamil | English |
|---|---|---|---|
| 295 | 2777 | {area} — நடப்பு {planet} காலம் இதற்கு ஆதரவாக இருக்கிறது. | On {area}, the {planet} period running now is supportive. |

### `_OUTLOOK_SLOW` — line 2784 · 1 strings

| # | line | Tamil | English |
|---|---|---|---|
| 296 | 2785 | {area} — நடப்புக் காலம் இங்கே பொறுமையைக் கேட்கிறது; {date} க்குப் பிறகு நிலை தளர்கிறது. | On {area}, the current period asks for patience; conditions ease after {date}. |

### `_beat_who_you_are()` — line 2926 · 12 strings

| # | line | Tamil | English |
|---|---|---|---|
| 297 | 2968 |  நட்சத்திரத்தில் பிறந்தவர். | — |
| 298 | 2968 | நீங்கள்  | — |
| 299 | 2977 |  லக்னத்தில் | — |
| 300 | 2999 |  அவர்  | — |
| 301 | 2999 |  நட்சத்திரத்தில் பிறந்தவர்.  | — |
| 302 | 3007 |  நட்சத்திரத்தில்,  | — |
| 303 | 3007 |  பிறந்தவர்.  | — |
| 304 | 3007 |  ராசியில் | — |
| 305 | 3083 |  நட்சத்திரம் (அதிபதி  | — |
| 306 | 3087 | ; ஜாதகத்தின் மைய கிரகம்  | — |
| 307 | 3097 |  லக்னம் | — |
| 308 | 3100 | ; பிறந்த நேரம் உறுதிப்படுத்தப்படாததால் லக்னம் இங்கே பயன்படுத்தப்படவில்லை | — |

### `_beat_what_this_rests_on()` — line 3110 · 1 strings

| # | line | Tamil | English |
|---|---|---|---|
| 309 | 3157 | பிறந்த நேரத்தின் ஆதாரம்:  | — |

### `_beat_strength_and_cost()` — line 3163 · 6 strings

| # | line | Tamil | English |
|---|---|---|---|
| 310 | 3224 | -இன் உண்மையான பலம்  | — |
| 311 | 3224 | . விலை என்பது  | — |
| 312 | 3227 | . விலை என்பது  | — |
| 313 | 3227 | உங்கள் உண்மையான பலம்  | — |
| 314 | 3234 |  — பலமும் விலையும் இதிலிருந்தே | — |
| 315 | 3234 | வலிமையான கிரகம்  | — |

### `_beat_what_life_keeps_teaching()` — line 3240 · 2 strings

| # | line | Tamil | English |
|---|---|---|---|
| 316 | 3300 |  — அதன் விலை கற்பிப்பது | — |
| 317 | 3300 | வலிமையான கிரகம்  | — |

### `_beat_last_ten_years()` — line 3306 · 18 strings

| # | line | Tamil | English |
|---|---|---|---|
| 318 | 3422 | -க்கு | — |
| 319 | 3422 | உங்களுக்கு | — |
| 320 | 3425 |  காலம் நடந்தது.  | — |
| 321 | 3425 |  முதல்  | — |
| 322 | 3425 |  வரை  | — |
| 323 | 3439 |  மகாதசை  | — |
| 324 | 3475 |  காலத்திற்குள்ளேயே இருக்கிறார் | — |
| 325 | 3477 |  காலத்திற்குள்ளேயே இருக்கிறீர்கள் | — |
| 326 | 3477 | நீங்கள்  | — |
| 327 | 3481 |  முதல் இதுவரை  | — |
| 328 | 3482 |  அதற்குள்  | — |
| 329 | 3483 | -ல் ஒரு திருப்பம் வந்தது. | — |
| 330 | 3496 |  மகாதசை  | — |
| 331 | 3497 |  புத்தி  | — |
| 332 | 3510 | -க்கு  | — |
| 333 | 3512 |  காலமே தொடர்ந்திருக்கிறது.  | — |
| 334 | 3512 |  முதல் இதுவரை  | — |
| 335 | 3525 |  மகாதசை  | — |

### `_beat_right_now()` — line 3534 · 22 strings

| # | line | Tamil | English |
|---|---|---|---|
| 336 | 3585 |  காலம்,  | — |
| 337 | 3585 |  வரை. | — |
| 338 | 3585 | இப்போது உங்களுக்கு  | — |
| 339 | 3591 |  காலம். | — |
| 340 | 3591 | இப்போது உங்களுக்கு  | — |
| 341 | 3594 | -ல் அது மாறியது.  | — |
| 342 | 3596 |  காலம். | — |
| 343 | 3596 | இப்போது உங்களுக்கு  | — |
| 344 | 3599 |  முதல் அதன் தன்மை மாறியிருக்கிறது.  | — |
| 345 | 3601 |  காலம் தொடர்கிறது. | — |
| 346 | 3610 |  காலம்,  | — |
| 347 | 3610 |  வரை. | — |
| 348 | 3610 | -க்கு  | — |
| 349 | 3610 | இப்போது  | — |
| 350 | 3612 |  காலம். | — |
| 351 | 3612 | -க்கு  | — |
| 352 | 3612 | இப்போது  | — |
| 353 | 3621 |  காலம். | — |
| 354 | 3621 | -க்கு  | — |
| 355 | 3621 | இப்போது  | — |
| 356 | 3634 |  புத்தி ( | — |
| 357 | 3634 |  மகாதசை /  | — |

### `_beat_age_question()` — line 3735 · 22 strings

| # | line | Tamil | English |
|---|---|---|---|
| 358 | 3765 |  எப்படிக் கற்கிறார், எது அவரை நிலைப்படுத்துகிறது, சுற்றியுள்ள வீடு எவ்வளவு அமைதியாக இருக்கிறது என்பதைத்தான். பிற்காலத்தில் வருவதை எல்லாம் வடிவமைப்பவை இவைதான்.  | — |
| 359 | 3765 | இந்த வயதில் ஜாதகம் சொல்வது  | — |
| 360 | 3780 |  வயதில், ஜாதகத்தின் கவனம் நீங்கள் கற்பதன் மீதும், உங்களை நிலைப்படுத்துவதன் மீதும் இருக்கிறது — அடுத்து வருவதை இவை இரண்டுமே தீர்மானிக்கின்றன.  | — |
| 361 | 3789 |  படித்துக்கொண்டிருப்பதால், அவரது ஜாதகத்தில் இப்போது முக்கியமான பகுதி கற்றல்தான் — இந்தக் காலத்தில் அவர் முடிப்பதே அடுத்து எதை நோக்கிச் செல்ல முடியும் என்பதை நிர்ணயிக்கும்.  | — |
| 362 | 3799 | நீங்கள் படித்துக்கொண்டிருப்பதால், ஜாதகத்தில் இப்போது முக்கியமான பகுதி கற்றல்தான் — இந்தக் காலத்தில் நீங்கள் முடிப்பதே அடுத்து எதை நோக்கிச் செல்ல முடியும் என்பதை நிர்ணயிக்கும்.  | — |
| 363 | 3808 |  வயதில்,  | — |
| 364 | 3808 | -இன் ஜாதகத்திடம் உண்மையில் கேட்கப்படும் கேள்வி திருமணம்தான் — நேரம் மட்டும் அல்ல, யாருடன் என்பதும் சேர்த்து.  | — |
| 365 | 3817 |  வயதில், திருமணம்தான் ஜாதகத்திடம் உண்மையில் கேட்கப்படும் கேள்வி — நேரம் மட்டும் அல்ல, யாருடன் என்பதும் சேர்த்து.  | — |
| 366 | 3847 |  வயதில் இருப்பவர் என்பதால், ஜாதகத்தின் கவனம் இப்போது வீடு மற்றும் குடும்பத்தின் மீதே இருக்கிறது.  | — |
| 367 | 3847 | திருமணமானவர்,  | — |
| 368 | 3857 |  வயதில்,  | — |
| 369 | 3857 | -ஐ நிலைப்படுத்துவதன் மீதே ஜாதகத்தின் கவனம் இருக்கிறது — வீடு, உடல்நலம், அருகில் இருப்பவர்கள்.  | — |
| 370 | 3871 |  வயதில், உங்களை நிலைப்படுத்துவதன் மீதே ஜாதகத்தின் கவனம் இருக்கிறது — வீடு, உடல்நலம், அருகில் இருப்பவர்கள்.  | — |
| 371 | 3880 |  வயதில், ஜாதகத்தின் கவனம் வேலை மற்றும் வருமானத்தின் மீது இருக்கிறது — இப்போது  | — |
| 372 | 3881 |  உறுதிப்படுத்துவதே அடுத்த காலம் பெருக்கிக் கொடுப்பது.  | — |
| 373 | 3881 | நீங்கள் | — |
| 374 | 3905 | இந்தக் காலத்தில் ஜாதகத்தின் கவனம் உடல்நலத்தின் மீதும்,  | — |
| 375 | 3906 |  ஒப்படைப்பதன் மீதும் நகர்கிறது. | — |
| 376 | 3906 | நீங்கள் | — |
| 377 | 3929 | ; கவனப் பகுதி  | — |
| 378 | 3929 | வயது  | — |
| 379 | 3930 |  தசை-பகுதி ஒத்திசைவு | — |

### `_beat_next_ten_years()` — line 3980 · 15 strings

| # | line | Tamil | English |
|---|---|---|---|
| 380 | 3983 | -க்கு | — |
| 381 | 3983 | உங்களுக்கு | — |
| 382 | 4011 |  காலம்  | — |
| 383 | 4011 |  வரை தொடர்கிறது; அதன் பிறகு அது  | — |
| 384 | 4012 |  காலத்திற்கு மாறுகிறது —  | — |
| 385 | 4022 |  காலம் தொடங்குகிறது.  | — |
| 386 | 4022 |  முதல்  | — |
| 387 | 4029 |  மகாதசை  | — |
| 388 | 4029 |  முதல் | — |
| 389 | 4052 |  காலமே தொடர்கிறது;  | — |
| 390 | 4052 | இந்தப் பத்தாண்டு முழுவதும்  | — |
| 391 | 4053 |  பகுதி வர,  | — |
| 392 | 4053 |  முதல் அதற்குள்  | — |
| 393 | 4061 |  புத்தி  | — |
| 394 | 4061 |  முதல் | — |

### `_beat_years_ahead_for_a_child()` — line 4071 · 12 strings

| # | line | Tamil | English |
|---|---|---|---|
| 395 | 4089 |  காலம்;  | — |
| 396 | 4089 |  வரை  | — |
| 397 | 4089 | க்கு  | — |
| 398 | 4090 |  காலம் தொடங்கும். பள்ளிப் படிப்பின் திசை பெரும்பாலும் அந்த மாற்றத்தைச் சுற்றியே தெளிவாகும். | — |
| 399 | 4090 |  முதல்  | — |
| 400 | 4098 |  மகாதசை  | — |
| 401 | 4098 |  முதல் | — |
| 402 | 4102 |  காலமே தொடர்கிறது — பள்ளிப் பருவம் முழுவதும் ஒரே தன்மையுடன் நகரும் என்பது இதன் பொருள். | — |
| 403 | 4102 |  வரை  | — |
| 404 | 4102 | க்கு  | — |
| 405 | 4110 |  மகாதசை  | — |
| 406 | 4110 |  வரை | — |

### `_beat_one_thing()` — line 4120 · 5 strings

| # | line | Tamil | English |
|---|---|---|---|
| 407 | 4128 | -க்கு ஒரு செயல்:  | — |
| 408 | 4134 | பெற்றோர் செய்யக்கூடிய ஒன்று:  | — |
| 409 | 4146 | ஒரு செயல்:  | — |
| 410 | 4152 |  மகாதசையை அடிப்படையாகக் கொண்டது | — |
| 411 | 4152 | நடப்பு  | — |

### `build_one_minute_reading()` — line 4380 · 1 strings

| # | line | Tamil | English |
|---|---|---|---|
| 412 | 4600 | முழு ஜாதகத்தைப் படிக்க | Read the full chart |

## `app/services/five_minute_reading_service.py`


### `_PERIOD_THEME` — line 434 · 9 strings

| # | line | Tamil | English |
|---|---|---|---|
| 413 | 435 | பொறுப்பு | responsibility |
| 414 | 436 | மாற்றம் | change |
| 415 | 437 | வேகம் | momentum |
| 416 | 438 | கற்றல் | learning |
| 417 | 439 | விரிவாக்கம் | expansion |
| 418 | 440 | சமநிலை | balance |
| 419 | 441 | சகிப்புத்தன்மை | endurance |
| 420 | 442 | தேடல் | reaching |
| 421 | 443 | விடுதல் | letting go |

### `_TOPIC_LENS` — line 530 · 8 strings

| # | line | Tamil | English |
|---|---|---|---|
| 422 | 531 | வளர்ச்சியில், | In how they're growing, |
| 423 | 532 | உங்களை நிலைப்படுத்துவதில், | In how you're finding your footing, |
| 424 | 533 | நீங்கள் கற்கும் விதத்தில், | In how you learn, |
| 425 | 534 | நீங்கள் தேர்ந்தெடுக்கும் விதத்தில், | In who and how you choose, |
| 426 | 535 | வீடு மற்றும் குடும்பத்தில், | In home and family, |
| 427 | 536 | வேலையில், | At work, |
| 428 | 537 | உடல்நலம் மற்றும் நீங்கள் ஒப்படைப்பதில், | In health and what you hand on, |
| 429 | 538 | இப்போது உங்களை நிலைநிறுத்துவதில், | In what steadies you now, |

### `_SHADOW_ESSENCE` — line 547 · 9 strings

| # | line | Tamil | English |
|---|---|---|---|
| 430 | 548 | நம்பாத நிலைப்பாட்டைத் தொடர்ந்து காப்பாற்றுதல் | defending a position you no longer believe |
| 431 | 549 | சூழலின் மனநிலையை உங்களுக்குள் விட்டுவிடுதல் | letting the room's mood become yours |
| 432 | 550 | தயாராகும் முன்பே ஒரு முடிவை வலுக்கட்டாயமாக வரவழைத்தல் | forcing a decision before it's ready |
| 433 | 551 | இரு பக்கமும் வாதிட்டு எதுவும் வெல்லாமல் போகச் செய்தல் | arguing both sides until neither wins |
| 434 | 552 | மறுக்கத் தெரியாமை | not knowing how to say no |
| 435 | 553 | எதிர்ப்பைச் சொல்லாமல் உள்ளுக்குள் விழுங்குதல் | swallowing an objection instead of raising it |
| 436 | 554 | வராத ஒரு உறுதிக்காகக் காத்திருத்தல் | waiting for a certainty that never comes |
| 437 | 555 | அடுத்ததற்காக முடிக்காமல் விட்டுவிடுதல் | leaving things unfinished for what's next |
| 438 | 556 | தேவைப்படும் தருணத்திலேயே விலகிவிடுதல் | withdrawing right when staying was needed |

### `_FRICTION_CONNECTIVE` — line 740 · 1 strings

| # | line | Tamil | English |
|---|---|---|---|
| 439 | 740 | இது சிக்கலாக மாறும் இடம்: | Where it runs into friction: |

### `_GUIDANCE_CONNECTIVE` — line 741 · 1 strings

| # | line | Tamil | English |
|---|---|---|---|
| 440 | 741 | உதவக்கூடியது: | One thing that might help: |

### `_GUIDANCE_FALLBACK` — line 763 · 1 strings

| # | line | Tamil | English |
|---|---|---|---|
| 441 | 764 | {area} பற்றி ஒரு திறந்த கேள்வியை, நீங்கள் உண்மையில் நம்பும் ஒருவரிடம் கொண்டு செல்லுங்கள். | take one open question about {area} to the next person whose judgment you actually trust. |

### `_SHADOW_ESSENCE_THEM` — line 781 · 2 strings

| # | line | Tamil | English |
|---|---|---|---|
| 442 | 783 | தான் நம்பாத நிலைப்பாட்டைத் தொடர்ந்து காப்பாற்றுதல் | defending a position they no longer believe |
| 443 | 784 | சூழலின் மனநிலையைத் தனக்குள் விட்டுவிடுதல் | letting the room's mood become theirs |

### `_BHUKTI_FLAVOR_THEM` — line 787 · 1 strings

| # | line | Tamil | English |
|---|---|---|---|
| 444 | 790 | இந்தக் காலம் மற்றபடி கேட்பதை விட வேகமாக நகரும்படி அவரைத் தூண்டுகிறது | pushes them to move faster than the rest of this stretch asks for |

### `_GOCHARA_SANI_THEM` — line 795 · 7 strings

| # | line | Tamil | English |
|---|---|---|---|
| 445 | 798 | இந்தக் காலம் அவரது உடலையும் மனநிலையையும் நேரடியாகச் சோதிக்கிறது; முன்பு எளிதாக இருந்தவை இப்போது கூடுதல் முயற்சி கேட்கின்றன | this stretch presses directly on their body and their mood; things that used to take little effort now ask for more |
| 446 | 804 | இது பணத்தையும் குடும்பத்தில் அவர் பேசும் விதத்தையும் சோதிக்கிறது; இந்தக் காலத்தில் செலவும் சொல்லும் கவனமாக இருக்க வேண்டும் | it presses on money and on how they speak inside the family; spending and wording both repay care in this stretch |
| 447 | 810 | இது வீட்டையும் உள்ளுக்குள்ளான நிம்மதியையும் சோதிக்கிறது; அவர் நிற்கும் தளமே பரிசோதிக்கப்படுகிறது | it presses on home and on their inner quiet; the ground they stand on is what is being tested |
| 448 | 816 | இது அவரது தீர்ப்பையும், அவர் உருவாக்குவதையும், பிள்ளைகள் சார்ந்ததையும் சோதிக்கிறது; இந்தக் காலத்தில் சூதாட்டம் பொருந்தாது | it presses on their judgment, on what they make, and on anything to do with children; this is not a stretch that rewards a gamble |
| 449 | 822 | இது அதிர்ஷ்டத்தையும் தந்தை சார்ந்ததையும் சோதிக்கிறது; முயற்சிக்குரிய பலன் வர நேரம் எடுக்கிறது | it presses on fortune and on anything to do with their father; effort takes longer than it should to return |
| 450 | 827 | இது சனி மிகச் சிறப்பாக நிற்கும் இடம் — வருமானமும், அவரைச் சுற்றியுள்ள வட்டமும் விரிவடைகின்றன | this is the strongest place Saturn stands — income and the circle around them both widen |
| 451 | 832 | செலவும், தூரமும், கலைந்த தூக்கமும் வழக்கத்தை விட அதிக எடையாகின்றன; குறைவாகச் செலவழித்து அதிகமாக ஓய்வெடுக்கும்படி இந்தக் காலம் அவரைக் கேட்கிறது | expense, distance and broken sleep all weigh more than they used to; this is the stretch that asks them to spend less and rest more |

### `_LORD_STRENGTH_NOTE_THEM` — line 839 · 3 strings

| # | line | Tamil | English |
|---|---|---|---|
| 452 | 841 | அது அங்கே வலுவாக இருக்கிறது — அதனால் அவரது வாழ்க்கையின் இந்தப் பகுதி அழுத்தத்தில் தானாகவே தாங்கிக்கொள்கிறது | it is strong there, so this side of their life tends to hold under pressure without being rescued |
| 453 | 847 | அது அங்கே நடுத்தரமாக இருக்கிறது — அவரது வாழ்க்கையின் இந்தப் பகுதி முயற்சிக்குப் பதில் தருகிறது, ஆனால் தானாக நடப்பதில்லை | it is moderate there — this side of their life answers to effort, but it does not run itself |
| 454 | 853 | அது அங்கே பலவீனமாக இருக்கிறது — அதனால்தான் அவரது வாழ்க்கையின் இந்தப் பகுதிக்கு எப்போதும் கூடுதல் கவனம் தேவைப்பட்டிருக்கிறது | it is not strong there, which is why this side of their life has always needed more deliberate attention than it looks like it should |

### `_TOPIC_LENS_THEM` — line 860 · 5 strings

| # | line | Tamil | English |
|---|---|---|---|
| 455 | 862 | தன்னை நிலைப்படுத்துவதில், | In how they're finding their footing, |
| 456 | 863 | அவர் கற்கும் விதத்தில், | In how they learn, |
| 457 | 864 | அவர் தேர்ந்தெடுக்கும் விதத்தில், | In who and how they choose, |
| 458 | 865 | உடல்நலம் மற்றும் அவர் ஒப்படைப்பதில், | In health and what they hand on, |
| 459 | 866 | இப்போது அவரை நிலைநிறுத்துவதில், | In what steadies them now, |

### `_LAGNA_FACE_THEM` — line 873 · 12 strings

| # | line | Tamil | English |
|---|---|---|---|
| 460 | 874 | ஏற்கனவே நகர்ந்துகொண்டிருப்பவராகத் தெரிகிறார் | already in motion |
| 461 | 875 | அவசரமற்றவராகத் தெரிகிறார்; அதை உறுதி என்று படிக்கிறார்கள் | unhurried, and people read that as certainty |
| 462 | 877 | விரைவானவராகவும் பேச எளியவராகவும் தெரிகிறார் | quick, and easy to talk to |
| 463 | 878 | யாரை அருகில் விடுவது என்பதில் கவனமானவராகத் தெரிகிறார் | careful about who gets close |
| 464 | 879 | கேட்காமலேயே பொறுப்பில் இருப்பவராகத் தெரிகிறார் | as someone in charge, asked or not |
| 465 | 880 | நுணுக்கமானவராக — சில நேரம் திருத்துபவராக — தெரிகிறார் | exact, and sometimes correcting |
| 466 | 881 | அவரது கருத்து தெரிவதற்கு முன்பே இணக்கமானவராகத் தெரிகிறார் | agreeable long before anyone meets their opinion |
| 467 | 883 | படிக்க முடியாதவராகத் தெரிகிறார்; ஆழம் இருக்கும் என்று எண்ணுகிறார்கள் | hard to read, and people assume depth |
| 468 | 885 | வெளிப்படையானவராகத் தெரிகிறார்; நேரடித்தன்மை நம்பிக்கையாகப் படுகிறது | open, and people read directness as confidence |
| 469 | 887 | தன் வயதை விட மூத்தவராகத் தெரிகிறார் | serious, and older than they are |
| 470 | 888 | கூட்டத்திற்குள் இருந்தாலும் சற்று தனித்தவராகத் தெரிகிறார் | slightly apart, even from inside the group |
| 471 | 890 | உண்மையில் இருப்பதை விட மென்மையானவராகத் தெரிகிறார் | softer than they are |

### `_MOON_MIND_THEM` — line 893 · 1 strings

| # | line | Tamil | English |
|---|---|---|---|
| 472 | 895 | சூழ்நிலையை விட வேகமாக ஓடும் | a mind that runs ahead of their circumstances |

### `_TENSION_FRAME_THEM` — line 901 · 1 strings

| # | line | Tamil | English |
|---|---|---|---|
| 473 | 902 | லக்னத்தால் {name} {face}. உள்ளே இயங்குவதோ — {mind}. | {name} comes across {face}. What is actually running underneath is {mind}. |

### `_TENSION_CLOSE_THEM` — line 905 · 1 strings

| # | line | Tamil | English |
|---|---|---|---|
| 474 | 906 | மற்றவர்கள் அவரைப் படிக்கும் விதத்திற்கும், அவர் உண்மையில் முடிவெடுக்கும் விதத்திற்கும் இடையிலான இந்த இடைவெளிதான், அவருக்குத் தன்னுடனேயே ஏற்படும் உராய்வின் பெரும்பகுதி. | That gap — between how they are read and how they actually decide — is where most of the friction they have with themselves comes from. |

### `_ASKS_CONNECTIVE_THEM` — line 911 · 1 strings

| # | line | Tamil | English |
|---|---|---|---|
| 475 | 911 | இந்தக் காலம் அவரிடம் கேட்பது: | What this period asks of them: |

### `_GUIDANCE_FALLBACK_THEM` — line 912 · 1 strings

| # | line | Tamil | English |
|---|---|---|---|
| 476 | 913 | {area} பற்றி ஒரு திறந்த கேள்வியை, அவர் உண்மையில் நம்பும் ஒருவரிடம் கொண்டு செல்வது. | taking one open question about {area} to the next person whose judgment they actually trust. |

### `_CHILD_PERIOD_TEXTURE` — line 923 · 9 strings

| # | line | Tamil | English |
|---|---|---|---|
| 477 | 925 | இந்தக் காலத்தில் அவர் கவனிக்கப்பட விரும்புவார் — பொறுப்பும் பாராட்டும் அவரை வளர்க்கும் | this is a stretch where they want to be seen, and responsibility and recognition help them grow |
| 478 | 930 | இந்தக் காலத்தில் மனநிலையும் வீட்டின் சூழலும் அதிகம் தெரியும்; சீரான நாட்கள் அவரை நிலைப்படுத்தும் | in this stretch mood and the feel of home count for more, and regular days steady them |
| 479 | 934 | இந்தக் காலம் சக்தியும் வேகமும் நிறைந்தது; அந்தச் சக்திக்குச் செல்லும் இடம் இருந்தால் நன்றாக நடக்கும் | this stretch runs on energy and speed, and it goes well when that energy has somewhere to go |
| 480 | 938 | இந்தக் காலம் பேச்சு, கேள்விகள், கற்றலுக்குப் பலன் தரும் | this stretch rewards talking, questions and learning |
| 481 | 942 | இந்தக் காலம் விரிவடைகிறது — கற்றலும், ஆசிரியர்களும், மூத்தவர்களின் வழிகாட்டலும் உதவும் | this stretch widens things — learning, teachers and the guidance of older people tend to help |
| 482 | 946 | இந்தக் காலம் இதமானது — நட்பும், கலையும், அழகானவற்றின் மீதான ரசனையும் எளிதாக வளரும் | this is a gentle stretch, where friendships, art and a feel for beautiful things come easily |
| 483 | 950 | இந்தக் காலம் மெதுவாக நகரும்; பொறுமையாகக் கட்டியெழுப்புவது நீடிக்கும் | this stretch moves slowly, and what is built patiently in it lasts |
| 484 | 954 | இந்தக் காலம் புதியதன் மீதும் வழக்கத்திற்கு மாறானதன் மீதும் அவரது ஆர்வத்தைத் தூண்டும் | this stretch pulls their interest toward whatever is new and unusual |
| 485 | 958 | இந்தக் காலம் உள்முகமானது; தனியாக இருக்கும் நேரத்திலும் அவர் வளர்கிறார் | this stretch turns inward, and they grow in their quiet time too |

### `_beat_core_nature_extended()` — line 964 · 9 strings

| # | line | Tamil | English |
|---|---|---|---|
| 486 | 1000 | உங்கள் உண்மையான பலம்  | — |
| 487 | 1002 |  — பலம் இதிலிருந்தே | — |
| 488 | 1002 | வலிமையான கிரகம்  | — |
| 489 | 1007 | -இன் | — |
| 490 | 1009 | உங்கள் | — |
| 491 | 1011 |  உண்மையான பலம்  | — |
| 492 | 1011 | . விலை என்பது  | — |
| 493 | 1018 |  — பலமும், விலையும், அதன் வழிமுறையும் இதிலிருந்தே | — |
| 494 | 1018 | வலிமையான கிரகம்  | — |

### `_WORK_CONNECTIVE` — line 1035 · 1 strings

| # | line | Tamil | English |
|---|---|---|---|
| 495 | 1035 | வேலையில், இது இப்படித் தெரியலாம்: | At work, that can look like |

### `_RELATIONSHIPS_CONNECTIVE` — line 1036 · 1 strings

| # | line | Tamil | English |
|---|---|---|---|
| 496 | 1037 | உறவுகளில், இது இப்படித் தெரியலாம்: | In relationships, it can look like |

### `_beat_repeating_pattern()` — line 1042 · 1 strings

| # | line | Tamil | English |
|---|---|---|---|
| 497 | 1077 |  — ஒரே இயல்பு, வேலையிலும் உறவிலும் மீண்டும் தெரிகிறது | — |

### `_TENSION_FRAME` — line 1088 · 1 strings

| # | line | Tamil | English |
|---|---|---|---|
| 498 | 1089 | லக்னத்தால் {face}. உள்ளே இயங்குவதோ — {mind}. | People meet you {face}. What is actually running underneath is {mind}. |

### `_TENSION_CLOSE` — line 1102 · 1 strings

| # | line | Tamil | English |
|---|---|---|---|
| 499 | 1103 | மற்றவர்கள் உங்களைப் படிக்கும் விதத்திற்கும், நீங்கள் உண்மையில் முடிவெடுக்கும் விதத்திற்கும் இடையிலான இந்த இடைவெளிதான், உங்களுக்கு உங்களுடனேயே ஏற்படும் உராய்வின் பெரும்பகுதி. | That gap — between how you are read and how you actually decide — is where most of the friction you have with yourself comes from. |

### `_beat_the_tension()` — line 1110 · 3 strings

| # | line | Tamil | English |
|---|---|---|---|
| 500 | 1155 |  (மனம்) | — |
| 501 | 1155 |  (வெளித்தோற்றம்); சந்திரன் ராசி  | — |
| 502 | 1155 | லக்னம் ராசி  | — |

### `_ASKS_CONNECTIVE` — line 1197 · 1 strings

| # | line | Tamil | English |
|---|---|---|---|
| 503 | 1197 | இந்தக் காலம் கேட்பது: | What this period asks of you: |

### `_beat_this_period_extended()` — line 1200 · 3 strings

| # | line | Tamil | English |
|---|---|---|---|
| 504 | 1289 |  இப்போதைய  | — |
| 505 | 1289 |  பகுதி —  | — |
| 506 | 1289 |  வரை —  | — |

### `_beat_window_ahead()` — line 1307 · 9 strings

| # | line | Tamil | English |
|---|---|---|---|
| 507 | 1346 | -இன் ராசியிலிருந்து | — |
| 508 | 1346 | உங்கள் ராசியிலிருந்து | — |
| 509 | 1361 | ஆம் இடத்தில் நகர்கிறார் | — |
| 510 | 1361 | இப்போது சனி  | — |
| 511 | 1362 |  அளவில் அது இடம் மாறுகிறது. | — |
| 512 | 1374 | ; ஜென்ம ராசி  | — |
| 513 | 1374 | ; ராசியிலிருந்து  | — |
| 514 | 1374 | கோச்சார சனி ராசி  | — |
| 515 | 1375 | ஆம் இடம்; இடம் மாறுவது  | — |

### `_beat_topic_in_full()` — line 1421 · 9 strings

| # | line | Tamil | English |
|---|---|---|---|
| 516 | 1506 | -இன் | — |
| 517 | 1506 | உங்கள் | — |
| 518 | 1509 | , அவர்  | — |
| 519 | 1509 | ஆம் வீட்டில் அமர்ந்திருக்கிறார் —  | — |
| 520 | 1517 | ஆம் வீடு (இந்தத் தலைப்பின் இடம்), அதிபதி  | — |
| 521 | 1518 | -ல், வலிமை  | — |
| 522 | 1569 | -லிருந்து | — |
| 523 | 1569 | ; உராய்வுக் குறிப்பு வலிமையான  | — |
| 524 | 1613 | கவனப் பகுதி  | — |

### `_beat_one_thing_keyed()` — line 1619 · 6 strings

| # | line | Tamil | English |
|---|---|---|---|
| 525 | 1653 | -க்கு ஒரு செயல் — இது இன்றைய நாளை ஒட்டியது அல்ல, அவர் இருக்கும்  | — |
| 526 | 1654 |  காலத்தை ஒட்டியது:  | — |
| 527 | 1662 | ஒரு செயல் — இது இன்றைய நாளை ஒட்டியது அல்ல, நீங்கள் இருக்கும்  | — |
| 528 | 1663 |  காலத்தை ஒட்டியது:  | — |
| 529 | 1673 |  மகாதசையை அடிப்படையாகக் கொண்டது | — |
| 530 | 1673 | நடப்பு  | — |

### `_beat_child_period()` — line 1692 · 8 strings

| # | line | Tamil | English |
|---|---|---|---|
| 531 | 1712 |  வரை | — |
| 532 | 1715 |  இப்போது  | — |
| 533 | 1715 |  காலத்தில் இருக்கிறார் | — |
| 534 | 1722 |  இப்போதைய  | — |
| 535 | 1722 |  பகுதி —  | — |
| 536 | 1722 |  வரை —  | — |
| 537 | 1734 |  புத்தி ( | — |
| 538 | 1734 |  மகாதசை /  | — |

### `_beat_topic_house_for_a_child()` — line 1745 · 6 strings

| # | line | Tamil | English |
|---|---|---|---|
| 539 | 1778 | , அவர்  | — |
| 540 | 1778 | -இன்  | — |
| 541 | 1779 | ஆம் வீட்டில் அமர்ந்திருக்கிறார்.  | — |
| 542 | 1788 | ஆம் வீடு, அதிபதி  | — |
| 543 | 1788 | கவனப் பகுதி  | — |
| 544 | 1789 | -ல், வலிமை  | — |

### `build_five_minute_reading()` — line 1842 · 1 strings

| # | line | Tamil | English |
|---|---|---|---|
| 545 | 2074 | முழு ஜாதகத்தைப் படிக்க | Read the full chart |

## `app/services/personal_palan.py`


### `_HOUSE_THEME` — line 102 · 12 strings

| # | line | Tamil | English |
|---|---|---|---|
| 546 | 103 | சந்திரன் உங்கள் ராசியிலேயே இருப்பதால் உடல் சுகமும் நல்ல உணவும் அமையும்; ஆனால் மனம் சற்று அலைபாயலாம். | With the Moon in your own rasi, comfort and good food come easily, though the mind can wander. |
| 547 | 105 | சந்திரன் இரண்டாம் இடத்தில் இருப்பதால் செலவுகள் தலைதூக்கும்; வார்த்தைகளை அளந்து பேசுவது நல்லது. | With the Moon in your 2nd, spending rises and words need measuring. |
| 548 | 107 | சந்திரன் மூன்றாம் இடத்தில் இருப்பதால் தைரியமும் முயற்சிக்கேற்ற வெற்றியும் கிடைக்கும். | With the Moon in your 3rd, courage is high and effort converts into results. |
| 549 | 109 | சந்திரன் நான்காம் இடத்தில் இருப்பதால் மனதில் சிறு சஞ்சலமும் வீட்டில் சிறு அமைதியின்மையும் இருக்கலாம். | With the Moon in your 4th, the mind is uneasy and home can feel unsettled. |
| 550 | 111 | சந்திரன் ஐந்தாம் இடத்தில் இருப்பதால் எதிர்பார்த்தது தாமதமாகலாம்; மனச்சோர்வுக்கு இடம் கொடுக்க வேண்டாம். | With the Moon in your 5th, expected things may lag; don't let it turn into low spirits. |
| 551 | 113 | சந்திரன் ஆறாம் இடத்தில் இருப்பதால் போட்டிகளில் வெற்றியும் உடல்நலத்தில் முன்னேற்றமும் கிடைக்கும். | With the Moon in your 6th, you get the better of competition and health improves. |
| 552 | 115 | சந்திரன் ஏழாம் இடத்தில் இருப்பதால் துணையின் அன்பும் பிறரின் ஒத்துழைப்பும் கிடைக்கும். | With the Moon in your 7th, companionship and other people's cooperation come readily. |
| 553 | 117 | சந்திரன் எட்டாம் இடத்தில் இருப்பதால் மனதில் பதற்றம் இருக்கலாம்; பெரிய முடிவுகளை ஒத்திவைப்பது நல்லது. | With the Moon in your 8th, the mind runs anxious; big decisions are better deferred. |
| 554 | 119 | சந்திரன் ஒன்பதாம் இடத்தில் இருப்பதால் காரியங்களில் சிறு தடையும் உடல் அசதியும் இருக்கலாம். | With the Moon in your 9th, tasks meet small obstructions and the body tires sooner. |
| 555 | 121 | சந்திரன் பத்தாம் இடத்தில் இருப்பதால் தொடங்கிய வேலைகள் நிறைவேறும்; உழைப்புக்கு மதிப்பு கிடைக்கும். | With the Moon in your 10th, work in hand gets finished and effort is recognised. |
| 556 | 123 | சந்திரன் பதினொன்றாம் இடத்தில் இருப்பதால் லாபமும் மகிழ்ச்சியும் நண்பர்களின் ஆதரவும் கிடைக்கும். | With the Moon in your 11th, gains, cheer and friends' support arrive. |
| 557 | 125 | சந்திரன் பன்னிரண்டாம் இடத்தில் இருப்பதால் விரயச் செலவும் தூக்கக் குறைவும் இருக்கலாம். | With the Moon in your 12th, money leaks out and sleep runs short. |

### `_TARA_NOTE_TRIAD` — line 145 · 1 strings

| # | line | Tamil | English |
|---|---|---|---|
| 558 | 146 | இன்றைய நட்சத்திரம் உங்கள் ஜென்ம நட்சத்திரத்தின் திரிகோண நட்சத்திரம் (ஜென்ம தாரை); உடலும் மனமும் சற்று உணர்வுப்பூர்வமாக இருக்கும். | Today's star is a trine of your birth star (Janma tara), so body and mind are more sensitive than usual. |

### `_TARA_NOTE` — line 149 · 9 strings

| # | line | Tamil | English |
|---|---|---|---|
| 559 | 150 | இன்று உங்கள் ஜென்ம நட்சத்திர நாள்; உடலும் மனமும் சற்று உணர்வுப்பூர்வமாக இருக்கும். | It is your janma star today, so body and mind are more sensitive than usual. |
| 560 | 152 | இன்றைய நட்சத்திரம் உங்களுக்கு சம்பத் தாரை; பண விஷயங்களுக்குத் துணை நிற்கும். | Today's star is Sampat tara for you, which backs money matters. |
| 561 | 154 | இன்றைய நட்சத்திரம் உங்களுக்கு விபத் தாரை; புதிய முயற்சிகளைக் கவனமாகத் தொடங்குங்கள். | Today's star is Vipat tara for you, so begin new things carefully. |
| 562 | 156 | இன்றைய நட்சத்திரம் உங்களுக்கு க்ஷேம தாரை; நலனும் குடும்ப அமைதியும் கூடும். | Today's star is Kshema tara for you, favouring wellbeing and a calm home. |
| 563 | 158 | இன்றைய நட்சத்திரம் உங்களுக்கு பிரத்யரி தாரை; காரியங்களில் சிறு தடைகள் வரலாம். | Today's star is Pratyari tara for you, so expect small hold-ups. |
| 564 | 160 | இன்றைய நட்சத்திரம் உங்களுக்கு சாதக தாரை; முயற்சி செய்த காரியம் கைகூடும். | Today's star is Sadhana tara for you, so focused effort pays off. |
| 565 | 162 | இன்றைய நட்சத்திரம் உங்களுக்கு நைதன தாரை; பயணத்திலும் உடல்நலத்திலும் கூடுதல் கவனம் தேவை. | Today's star is Naidhana tara for you, so take extra care with travel and health. |
| 566 | 164 | இன்றைய நட்சத்திரம் உங்களுக்கு மித்ர தாரை; நண்பர்களும் அன்புக்குரியவர்களும் உதவுவார்கள். | Today's star is Mitra tara for you; friends and loved ones help. |
| 567 | 166 | இன்றைய நட்சத்திரம் உங்களுக்கு பரம மித்ர தாரை; பிறர் ஆதரவு தாராளமாகக் கிடைக்கும். | Today's star is Parama Mitra tara for you; support from others comes generously. |

### `_AREA_TEXT` — line 171 · 33 strings

| # | line | Tamil | English |
|---|---|---|---|
| 568 | 173 | வேலையில் உங்கள் உழைப்பு கவனிக்கப்படும்; மேலதிகாரியின் ஆதரவும் புதிய பொறுப்பும் கிடைக்க வாய்ப்பு உண்டு. | Your work gets noticed; support from above and a new responsibility are likely. |
| 569 | 175 | வேலைச்சுமை கூடலாம்; கையில் உள்ளதை முடிப்பதில் கவனம் செலுத்துங்கள், சக ஊழியர்களுடன் பொறுமை தேவை. | The workload may grow; finish what is in hand and stay patient with colleagues. |
| 570 | 177 | வேலையில் அவசர வாக்குறுதிகள் வேண்டாம்; மேலதிகாரியிடம் பேசும்போது நிதானம் தேவை. | Make no hasty promises at work, and speak to superiors with restraint. |
| 571 | 181 | தொழிலில் வாடிக்கையாளர்களிடமிருந்து நல்ல பதில் கிடைக்கும்; பேச்சுவார்த்தை சாதகமாக முடியும். | In business, customers respond well and negotiations close in your favour. |
| 572 | 183 | தொழிலில் ஆர்டர்கள் வந்தாலும் பணம் வந்துசேர தாமதமாகலாம்; ஒப்பந்தங்களைத் தெளிவாகப் பேசுங்கள். | Orders may come but payment can lag; spell out terms clearly. |
| 573 | 185 | புதிய ஒப்பந்தம் அல்லது பெரிய முதலீட்டை இன்று ஒத்திவையுங்கள்; கூட்டாளிகளிடம் கருத்து வேறுபாடு வரலாம். | Hold off on new contracts or big investment today; partners may disagree. |
| 574 | 189 | பணவரவு திருப்திகரமாக இருக்கும்; நிலுவையில் இருந்த தொகை வந்துசேர வாய்ப்பு உண்டு. | Money flows in well, and a pending amount may be recovered. |
| 575 | 191 | வரவு இருந்தாலும் குடும்பத் தேவைகளுக்காக செலவும் கூடும்; திட்டமிட்டுச் செலவிடுங்கள். | Income comes, but household needs raise spending; spend to a plan. |
| 576 | 193 | எதிர்பாராத செலவுகள் வரலாம்; கடன் கொடுப்பதையும் பெரிய வாங்குதலையும் தவிர்ப்பது நல்லது. | Unexpected expenses may crop up; avoid lending and big purchases. |
| 577 | 197 | குடும்பத்தில் மகிழ்ச்சியான சூழல் நிலவும்; பெற்றோர், குழந்தைகளுடன் நல்ல நேரம் செலவிடுவீர்கள். | Home is cheerful, with good time spent with parents and children. |
| 578 | 199 | குடும்பத்தில் சிறு கருத்து வேறுபாடுகள் வரலாம்; பொறுமையாகக் கையாண்டால் விரைவில் சரியாகும். | Small disagreements may arise at home; handled patiently, they pass quickly. |
| 579 | 201 | வீட்டில் வார்த்தை மோதல்களைத் தவிர்க்கவும்; பெரியவர்களின் உடல்நலத்தில் கவனம் செலுத்துங்கள். | Avoid sharp words at home, and keep an eye on elders' wellbeing. |
| 580 | 205 | துணையுடன் நெருக்கம் கூடும்; திருமணப் பேச்சு நடப்பவர்களுக்கு சாதகமான தகவல் வரலாம். | Closeness with your partner grows; marriage talks may bring good news. |
| 581 | 207 | அன்புக்குரியவருடன் மனம்விட்டுப் பேசுங்கள்; சிறு தவறான புரிதல்களை உடனே தீர்த்துக்கொள்ளுங்கள். | Talk openly with the one you love and clear small misunderstandings at once. |
| 582 | 209 | துணையுடன் சிறு மனக்கசப்பு வரலாம்; முக்கியமான உறவுப் பேச்சுகளை இன்னொரு நாளுக்கு வையுங்கள். | Some friction with your partner is possible; keep important relationship talks for another day. |
| 583 | 213 | உடல் சுறுசுறுப்பாக இருக்கும்; நல்ல உணவும் ஓய்வும் இதைத் தொடரச் செய்யும். | You feel energetic; good food and rest keep it that way. |
| 584 | 215 | சோர்வு அல்லது லேசான தலைவலி வரலாம்; நேரத்துக்கு உணவும் போதுமான தண்ணீரும் அவசியம். | Tiredness or a mild headache may come; eat on time and drink enough water. |
| 585 | 217 | தூக்கக் குறைவும் செரிமானக் கோளாறும் வரலாம்; அதிக வேலைச்சுமையைக் குறைத்து ஓய்வெடுங்கள். | Sleep and digestion may suffer; ease the load and rest. |
| 586 | 221 | மாணவர்களுக்கு கவனமும் நினைவாற்றலும் கூடும்; விண்ணப்பங்களையும் தேர்வுத் தயாரிப்பையும் முன்னெடுக்கலாம். | Students find focus and memory sharp; push applications and exam preparation forward. |
| 587 | 223 | படிப்பில் கவனச் சிதறல் இருக்கலாம்; குறுகிய இடைவெளிகளுடன் படிப்பது பலன் தரும். | Attention may drift from study; short sessions with breaks work best. |
| 588 | 225 | முக்கியமான தேர்வு அல்லது விண்ணப்பம் இருந்தால் முன்கூட்டியே சரிபார்த்துக் கொள்ளுங்கள்; அவசரம் வேண்டாம். | If an exam or application is due, check everything in advance and don't rush. |
| 589 | 229 | பயணங்கள் சாதகமாக அமையும்; திட்டமிட்ட பயணம் நல்ல பலன் தரும். | Travel goes well, and a planned trip pays off. |
| 590 | 231 | பயணத்தில் சிறு தாமதங்கள் இருக்கலாம்; கூடுதல் நேரம் ஒதுக்கிப் புறப்படுங்கள். | Journeys may see small delays; leave with time to spare. |
| 591 | 233 | வாகனம் ஓட்டும்போது அவசரம் வேண்டாம்; தேவையற்ற பயணங்களைத் தவிர்ப்பது நல்லது. | Don't hurry at the wheel, and skip journeys that aren't needed. |
| 592 | 237 | அரசு சார்ந்த வேலைகள், விண்ணப்பங்கள், பதிவுகள் சுமுகமாக நடக்கும். | Government work, applications and registrations move smoothly. |
| 593 | 239 | ஆவணப் பணிகள் நடந்தாலும் ஒப்புதலுக்கு சற்று நேரம் ஆகலாம்; ஆவணங்களை முழுமையாக வைத்திருங்கள். | Paperwork progresses but approvals take time; keep your documents complete. |
| 594 | 241 | கையெழுத்திடும் முன் ஆவணங்களை இருமுறை படியுங்கள்; சட்ட விஷயங்களில் அவசர முடிவு வேண்டாம். | Read documents twice before signing, and take no hasty legal step. |
| 595 | 245 | நண்பர்களின் உதவி தக்க நேரத்தில் கிடைக்கும்; புதிய தொடர்புகள் பயன் தரும். | Friends help at the right moment, and new contacts prove useful. |
| 596 | 247 | நண்பர்களுடன் பழகும்போது எல்லை தெரிந்து நடந்துகொள்ளுங்கள்; வாக்குறுதிகளை அளவோடு கொடுங்கள். | Keep sensible limits with friends and promise only what you can give. |
| 597 | 249 | பிறர் விஷயங்களில் தலையிடுவதைத் தவிர்க்கவும்; நம்பிக்கைக்குரியவர்களிடம் மட்டும் மனம் திறங்கள். | Stay out of others' affairs, and confide only in people you trust. |
| 598 | 253 | உங்கள் பேச்சுக்கு மதிப்பு கிடைக்கும்; முக்கியமான செய்திகளையும் அழைப்புகளையும் இன்று செய்யலாம். | Your words carry weight; important messages and calls can go out today. |
| 599 | 255 | சொல்ல வந்ததைத் தெளிவாகச் சொல்லுங்கள்; தவறான புரிதல்களுக்கு இடம் கொடுக்க வேண்டாம். | Say plainly what you mean and leave no room for misreading. |
| 600 | 257 | பேச்சில் நிதானம் தேவை; கோபத்தில் பதில் சொல்லாமல் சற்று நேரம் கழித்துப் பேசுங்கள். | Speak with restraint; don't answer in anger, reply after a pause. |

### `_CHANDRASHTAMA_LEAD` — line 263 · 1 strings

| # | line | Tamil | English |
|---|---|---|---|
| 601 | 264 | இன்று உங்களுக்கு சந்திராஷ்டமம்; புதிய தொடக்கங்களையும் பெரிய முடிவுகளையும் தவிர்த்து, நிதானமாகச் செயல்படுங்கள். | Today is your Chandrashtama: skip new beginnings and big decisions, and go steadily. |

### `_MIND_CHANDRASHTAMA` — line 267 · 1 strings

| # | line | Tamil | English |
|---|---|---|---|
| 602 | 268 | மனதில் குழப்பமும் பதற்றமும் தோன்றலாம்; அமைதியாக இருந்து, முக்கிய முடிவுகளை நாளைக்கு வையுங்கள். | Confusion and unease may surface; stay calm and keep key decisions for tomorrow. |

### `_OVERALL_LEAD` — line 271 · 3 strings

| # | line | Tamil | English |
|---|---|---|---|
| 603 | 272 | இன்று உங்களுக்கு சாதகமான நாள்; முயற்சிகளில் வேகமும் முடிவுகளில் தெளிவும் இருக்கும். | A favourable day for you: effort moves quickly and decisions come clearly. |
| 604 | 274 | இன்று கலவையான நாள்; திட்டமிட்டுச் செயல்பட்டால் நல்ல பலன் கிடைக்கும். | A mixed day: work to a plan and it turns out well. |
| 605 | 276 | இன்று கவனமாகச் செயல்பட வேண்டிய நாள்; அவசரத்தைத் தவிர்த்தால் சிக்கல்கள் விலகும். | A day for care: avoid haste and the snags stay small. |

### `_ADVICE_CAUTION` — line 286 · 12 strings

| # | line | Tamil | English |
|---|---|---|---|
| 606 | 287 | வேலையில் சொன்னதைச் செய்து முடியுங்கள்; புதிய வாக்குறுதிகளை நாளைக்கு வையுங்கள். | Deliver what you have promised at work; save new commitments for tomorrow. |
| 607 | 289 | புதிய ஒப்பந்தங்களில் கையெழுத்திடும் முன் ஒருநாள் யோசியுங்கள். | Sleep on any new contract before signing it. |
| 608 | 291 | பண விஷயத்தில் அவசரம் வேண்டாம்; கடன் கொடுக்கல் வாங்கலை ஒத்திவையுங்கள். | Don't rush money matters; put off lending and borrowing. |
| 609 | 293 | வீட்டில் கேட்பதற்கு அதிக நேரம் கொடுங்கள்; வாதத்தை வளர்க்க வேண்டாம். | At home, listen more than you argue. |
| 610 | 295 | துணையின் பார்வையையும் பொறுமையாகக் கேளுங்கள்; பழைய விஷயங்களைக் கிளற வேண்டாம். | Hear your partner out patiently and leave old issues alone. |
| 611 | 297 | இன்று உடலுக்கு ஓய்வு கொடுங்கள்; இரவு சீக்கிரம் உறங்கச் செல்லுங்கள். | Give your body rest today and turn in early. |
| 612 | 299 | படிப்பதற்கு அமைதியான நேரத்தைத் தேர்ந்தெடுங்கள்; கைப்பேசியைத் தள்ளி வையுங்கள். | Pick a quiet hour to study and keep the phone away. |
| 613 | 301 | பயணத்துக்கு முன்கூட்டியே புறப்படுங்கள்; வாகனத்தில் வேகம் வேண்டாம். | Set out early and keep your speed down. |
| 614 | 303 | ஆவணங்களை இருமுறை சரிபார்த்த பிறகே சமர்ப்பியுங்கள். | Submit documents only after checking them twice. |
| 615 | 305 | பிறர் சண்டையில் நடுவராகச் செல்ல வேண்டாம். | Don't step in as referee in other people's quarrels. |
| 616 | 307 | பேச்சில் நிதானம்; கோபத்தில் எதையும் எழுதவோ அனுப்பவோ வேண்டாம். | Measured words; send nothing written in anger. |
| 617 | 309 | அவசர முடிவுகளைத் தவிர்க்கவும்; மனம் அமைதியான பிறகு தீர்மானியுங்கள். | Avoid snap decisions; decide once the mind has settled. |

### `_ADVICE_OPPORTUNITY` — line 312 · 12 strings

| # | line | Tamil | English |
|---|---|---|---|
| 618 | 313 | தள்ளிப்போட்டிருந்த வேலையை இன்று தொடங்குங்கள். | Start the task you have been putting off. |
| 619 | 314 | வாடிக்கையாளர்களை நேரில் சந்தித்துப் பேச நல்ல நாள். | A good day to meet customers in person. |
| 620 | 315 | நிலுவைத் தொகைகளை இன்று நினைவூட்டுங்கள். | Follow up on money owed to you today. |
| 621 | 316 | குடும்பத்தினருடன் சேர்ந்து ஒரு வேளை உணவருந்துங்கள். | Share a meal with the family. |
| 622 | 317 | அன்புக்குரியவருக்கு நேரம் ஒதுக்குங்கள். | Make time for the one you love. |
| 623 | 318 | புதிய உடற்பயிற்சிப் பழக்கத்தைத் தொடங்க நல்ல நாள். | A good day to start a new exercise habit. |
| 624 | 319 | கடினமான பாடத்தை இன்று எடுத்துப் படியுங்கள். | Take up the hardest subject today. |
| 625 | 320 | திட்டமிட்ட பயணத்தை இன்று மேற்கொள்ளலாம். | The trip you planned can go ahead today. |
| 626 | 321 | நிலுவையில் உள்ள விண்ணப்பத்தை இன்று சமர்ப்பியுங்கள். | Submit the pending application today. |
| 627 | 322 | நீண்ட நாள் பேசாத நண்பரை அழைத்துப் பேசுங்கள். | Call a friend you have not spoken to in a while. |
| 628 | 323 | முக்கியமான பேச்சுகளையும் கோரிக்கைகளையும் இன்று முன்வையுங்கள். | Raise the important conversation or request today. |
| 629 | 324 | மனத்தெளிவைப் பயன்படுத்தி முக்கிய முடிவுகளை எடுங்கள். | Use today's clear head for the decisions that matter. |

### `_WORSHIP` — line 329 · 7 strings

| # | line | Tamil | English |
|---|---|---|---|
| 630 | 330 | காலையில் சூரியனை வணங்கி நாளைத் தொடங்குங்கள். | Begin the day with a greeting to the Sun. |
| 631 | 331 | சிவபெருமானை நினைத்து ‘ஓம் நமசிவாய’ சொல்லுங்கள். | Remember Lord Shiva and say ‘Om Namah Shivaya’. |
| 632 | 332 | முருகப்பெருமானை வணங்குங்கள்; கந்த சஷ்டி கவசம் கேட்பது மனதுக்கு உறுதி தரும். | Pray to Lord Murugan; listening to Kanda Sashti Kavasam steadies the mind. |
| 633 | 334 | பெருமாளை வணங்குங்கள்; துளசி அர்ச்சனை மனதுக்கு நிறைவு தரும். | Pray to Perumal; a tulasi offering brings contentment. |
| 634 | 336 | குருவை நினைத்து வணங்குங்கள்; பெரியவர்களிடம் ஆசி பெறுங்கள். | Honour Guru, and seek an elder's blessing. |
| 635 | 338 | மகாலட்சுமியை நினைத்து மாலையில் விளக்கேற்றுங்கள். | Light a lamp for Mahalakshmi in the evening. |
| 636 | 339 | ஆஞ்சநேயரை வணங்குங்கள்; இயன்றால் ஒருவருக்கு உணவளியுங்கள். | Pray to Anjaneya, and if you can, feed someone. |

### `_WORSHIP_CHANDRASHTAMA` — line 342 · 1 strings

| # | line | Tamil | English |
|---|---|---|---|
| 637 | 343 | மனம் அமைதி பெற அம்பாளை நினைத்து ஒரு விளக்கேற்றுங்கள். | Light a lamp to Amman for a settled mind. |

### `_STRENGTH` — line 347 · 12 strings

| # | line | Tamil | English |
|---|---|---|---|
| 638 | 348 | பொறுப்புணர்வு | your sense of responsibility |
| 639 | 349 | பேச்சுவார்த்தைத் திறன் | your negotiating skill |
| 640 | 350 | திட்டமிடல் | your planning |
| 641 | 351 | குடும்ப அன்பு | your family's affection |
| 642 | 352 | புரிதல் | understanding |
| 643 | 353 | உடல் வலிமை | physical energy |
| 644 | 354 | கவனம் | focus |
| 645 | 355 | சுறுசுறுப்பு | your drive |
| 646 | 356 | ஒழுங்கு | orderliness |
| 647 | 357 | நட்பு வட்டம் | your circle of friends |
| 648 | 358 | பேச்சுத் திறன் | your way with words |
| 649 | 359 | மன உறுதி | a steady mind |

### `_WATCH` — line 361 · 12 strings

| # | line | Tamil | English |
|---|---|---|---|
| 650 | 362 | வேலையில் அவசர வாக்குறுதிகள் | hasty promises at work |
| 651 | 363 | புதிய ஒப்பந்தங்கள் | new contracts |
| 652 | 364 | திடீர் செலவுகள் | sudden spending |
| 653 | 365 | வீட்டில் வார்த்தை மோதல் | sharp words at home |
| 654 | 366 | துணையுடன் சிறு மனக்கசப்பு | small frictions with your partner |
| 655 | 367 | தூக்கமும் ஓய்வும் | sleep and rest |
| 656 | 368 | கவனச் சிதறல் | distraction |
| 657 | 369 | வாகனத்தில் அவசரம் | hurry on the road |
| 658 | 370 | ஆவணங்களில் சிறு பிழைகள் | small errors in paperwork |
| 659 | 371 | பிறர் விஷயத்தில் தலையீடு | getting drawn into others' affairs |
| 660 | 372 | கடுஞ்சொல் | harsh words |
| 661 | 373 | அவசர முடிவுகள் | snap decisions |

### `_CLOSING` — line 376 · 9 strings

| # | line | Tamil | English |
|---|---|---|---|
| 662 | 378 | முயற்சி வெற்றி தரும் நாள். | A day when effort wins. |
| 663 | 379 | நம்பிக்கையுடன் முன்னேறுங்கள்; நாள் உங்கள் பக்கம். | Go ahead with confidence; the day is on your side. |
| 664 | 380 | தொடங்கியதை முடித்து மகிழும் நாள். | A day to finish what you began, and enjoy it. |
| 665 | 383 | திட்டமிட்டால் நாள் நல்லபடியாக அமையும். | Plan it, and the day turns out well. |
| 666 | 384 | பொறுமையே இன்றைய பலம். | Patience is today's strength. |
| 667 | 385 | செலவைக் கட்டுப்படுத்தினால் நாள் நல்லபடியாக அமையும். | Keep spending in check and the day goes well. |
| 668 | 388 | நிதானமே இன்றைய வெற்றி. | Today, steadiness is the win. |
| 669 | 389 | பேச்சில் நிதானம் தேவை; நாளை புதிய தொடக்கம். | Measured words today; tomorrow is a fresh start. |
| 670 | 390 | அவசரம் தவிர்த்தால் நாள் அமைதியாகக் கழியும். | Skip the hurry and the day passes calmly. |

### `GRAHA_NAME` — line 455 · 9 strings

| # | line | Tamil | English |
|---|---|---|---|
| 671 | 456 | சந்திரன் | Moon |
| 672 | 456 | சூரியன் | Sun |
| 673 | 456 | செவ்வாய் | Mars |
| 674 | 457 | குரு | Jupiter |
| 675 | 457 | சுக்கிரன் | Venus |
| 676 | 457 | புதன் | Mercury |
| 677 | 458 | கேது | Ketu |
| 678 | 458 | சனி | Saturn |
| 679 | 458 | ராகு | Rahu |

### `_SANI_LAYER` — line 462 · 5 strings

| # | line | Tamil | English |
|---|---|---|---|
| 680 | 465 | ஏழரை சனியின் தொடக்கக் காலம் என்பதால் செலவும் அலைச்சலும் கூடும்; இதில் நிதானம் தேவை. | Ezharai Sani's opening phase brings extra spending and running about, so go steadily here. |
| 681 | 470 | ஜன்ம சனி காலம் என்பதால் இதில் உழைப்பு அதிகம், பலன் மெதுவாக வரும்; அவசரம் வேண்டாம். | This is your Janma Sani season: more effort and slower results here, so don't hurry. |
| 682 | 475 | ஏழரை சனியின் நிறைவுக் காலம் என்பதால் பணத்திலும் பேச்சிலும் கவனம் தேவை. | Ezharai Sani's closing phase asks for care with money and with words. |
| 683 | 480 | அர்த்தாஷ்டம சனி காலம் என்பதால் வீடு, வாகனம், மன அமைதியில் கூடுதல் கவனம் தேவை. | In this Ardhashtama Sani season, give home, vehicle and peace of mind extra care. |
| 684 | 485 | அஷ்டம சனி காலம் என்பதால் பெரிய மாற்றங்களையும் புதிய பொறுப்புகளையும் நிதானமாக எடுங்கள். | In this Ashtama Sani season, take big changes and new responsibilities slowly. |

### `_KANDAKA_LAYER` — line 493 · 2 strings

| # | line | Tamil | English |
|---|---|---|---|
| 685 | 496 | கண்டக சனி (7-ஆம் இடம்) காலம் என்பதால் துணையுடனும் கூட்டாளிகளுடனும் பொறுமை தேவை. | With Kantaka Sani in your 7th, be patient with your partner and business partners. |
| 686 | 501 | கண்டக சனி (10-ஆம் இடம்) காலம் என்பதால் வேலைச்சுமை கூடும்; பொறுப்புகளை அளவோடு ஏற்றுக்கொள்ளுங்கள். | With Kantaka Sani in your 10th, work weighs heavier; take on responsibility in measure. |

### `_guru_note()` — line 540 · 4 strings

| # | line | Tamil | English |
|---|---|---|---|
| 687 | 542 | -ஆம் இடத்தில் இருப்பதால், இப்பகுதிக்கு இக்காலம் பொதுவாக ஆதரவானது. | — |
| 688 | 542 | குரு உங்கள் ராசிக்கு  | — |
| 689 | 544 | -ஆம் இடத்தில் இருப்பதால், இப்பகுதியில் இக்காலம் கூடுதல் கவனம் கேட்கிறது. | — |
| 690 | 544 | குரு உங்கள் ராசிக்கு  | — |

### `_rahu_note()` — line 548 · 4 strings

| # | line | Tamil | English |
|---|---|---|---|
| 691 | 550 | -ஆம் இடத்தில் இருப்பதால், இப்பகுதியில் முயற்சிக்கு இக்காலம் கைகொடுக்கும். | — |
| 692 | 550 | ராகு உங்கள் ராசிக்கு  | — |
| 693 | 552 | -ஆம் இடத்தில் இருப்பதால், இப்பகுதியில் இது மாற்றங்களின் காலம்; வேகத்தை விட நிலைத்தன்மை முக்கியம். | — |
| 694 | 552 | ராகு உங்கள் ராசிக்கு  | — |

### `_houses_phrase()` — line 637 · 2 strings

| # | line | Tamil | English |
|---|---|---|---|
| 695 | 640 | -ஆம் இடத்தை | — |
| 696 | 641 | -ஆம் இடங்களை | — |

### `_period()` — line 644 · 11 strings

| # | line | Tamil | English |
|---|---|---|---|
| 697 | 651 |  உங்கள் லக்னத்திலிருந்து  | — |
| 698 | 651 | -ஆம் இடத்தில் அமர்ந்திருப்பதால், | — |
| 699 | 655 |  ஆள்வதால், | — |
| 700 | 655 |  உங்கள் லக்னத்திலிருந்து  | — |
| 701 | 657 | இவற்றுக்கு ஆதரவானது. | which backs them. |
| 702 | 659 | இவற்றில் சற்று பொறுமை கேட்கிறது. | which asks for some patience with them. |
| 703 | 662 |  அந்த இடம் சார்ந்த விஷயங்கள் இக்காலத்தில் முன்னிலை பெறும். இன்று  | — |
| 704 | 662 |  தசையில்  | — |
| 705 | 662 |  புக்தி நடக்கிறது.  | — |
| 706 | 663 |  உங்கள் ராசியிலிருந்து  | — |
| 707 | 663 | -ஆம் இடத்தில் சஞ்சரிப்பது  | — |

### `GRAHA_COLOUR` — line 703 · 7 strings

| # | line | Tamil | English |
|---|---|---|---|
| 708 | 704 | செம்பு சிவப்பு | copper red |
| 709 | 705 | வெள்ளை | white |
| 710 | 706 | சிவப்பு | red |
| 711 | 707 | பச்சை | green |
| 712 | 708 | மஞ்சள் | yellow |
| 713 | 709 | வெண்மை அல்லது பல வண்ணம் | white or many-coloured |
| 714 | 710 | கருப்பு அல்லது கருநீலம் | black or dark blue |

### `DIRECTION_NAME` — line 716 · 8 strings

| # | line | Tamil | English |
|---|---|---|---|
| 715 | 717 | கிழக்கு | east |
| 716 | 717 | தென்கிழக்கு | south-east |
| 717 | 718 | தென்மேற்கு | south-west |
| 718 | 718 | தெற்கு | south |
| 719 | 719 | மேற்கு | west |
| 720 | 719 | வடமேற்கு | north-west |
| 721 | 720 | வடகிழக்கு | north-east |
| 722 | 720 | வடக்கு | north |

### `_SOOLAM_KEY` — line 724 · 4 strings

| # | line | Tamil | English |
|---|---|---|---|
| 723 | 724 | கிழக்கு | — |
| 724 | 724 | தெற்கு | — |
| 725 | 724 | மேற்கு | — |
| 726 | 724 | வடக்கு | — |

### `_lucky()` — line 738 · 7 strings

| # | line | Tamil | English |
|---|---|---|---|
| 727 | 746 | இன்று உங்கள் சிறந்த நேரத்தின் ஹோரை அதிபதி | the lord of the hora your best time falls in today |
| 728 | 748 | இன்றைய கிழமையின் அதிபதி | the lord of today's weekday |
| 729 | 751 |  கிரகத்தினுடையவை;  | — |
| 730 | 751 | . நிறமும் திசையும் பிருஹத் பராசர ஹோரா சாஸ்திரம் (அத்தியாயம் 3) கூறும் கிரக நிறம், கிரகத் திசை; எண், Vinaadi எண் கணிதப் பகுதி பயன்படுத்தும் கிரக–எண் அட்டவணைப்படி ( | — |
| 731 | 751 | நிறம், எண், திசை மூன்றும்  | — |
| 732 | 762 |  திசை  | — |
| 733 | 762 | ; இன்று அதுவே சூலம் என்பதால் அதிர்ஷ்ட திசை சொல்லப்படவில்லை. | — |

### `_lucky_spoken()` — line 767 · 5 strings

| # | line | Tamil | English |
|---|---|---|---|
| 734 | 768 | , அதிர்ஷ்ட எண்  | — |
| 735 | 768 | இன்று உங்களுக்கு அதிர்ஷ்ட நிறம்  | — |
| 736 | 771 | , அதிர்ஷ்ட திசை  | — |
| 737 | 776 |  இன்று சூலம்  | — |
| 738 | 776 | ; அத்திசைப் பயணத்தைத் தவிர்ப்பது நல்லது. | — |

### `_SANI_SPOKEN` — line 789 · 6 strings

| # | line | Tamil | English |
|---|---|---|---|
| 739 | 790 | ஏழரை சனியின் தொடக்கக் கட்டம் | the opening phase of Ezharai Sani |
| 740 | 791 | ஜன்ம சனி | Janma Sani |
| 741 | 792 | ஜன்ம சனி | Janma Sani |
| 742 | 793 | ஏழரை சனியின் நிறைவுக் கட்டம் | the closing phase of Ezharai Sani |
| 743 | 794 | அர்த்தாஷ்டம சனி | Ardhashtama Sani |
| 744 | 795 | அஷ்டம சனி | Ashtama Sani |

### `_KANDAKA_SPOKEN` — line 797 · 1 strings

| # | line | Tamil | English |
|---|---|---|---|
| 745 | 797 | கண்டக சனி | Kantaka Sani |

### `_AREA_SPOKEN` — line 801 · 12 strings

| # | line | Tamil | English |
|---|---|---|---|
| 746 | 802 | தொழில் | business |
| 747 | 802 | பணம் | money |
| 748 | 802 | வேலை | work |
| 749 | 803 | உடல்நலம் | wellbeing |
| 750 | 803 | உறவு | relationships |
| 751 | 803 | குடும்பம் | family |
| 752 | 804 | ஆவணங்கள் | paperwork |
| 753 | 804 | கல்வி | studies |
| 754 | 804 | பயணம் | travel |
| 755 | 805 | நட்பு | friendships |
| 756 | 805 | பேச்சு | communication |
| 757 | 805 | மனம் | state of mind |

### `_period_spoken()` — line 820 · 9 strings

| # | line | Tamil | English |
|---|---|---|---|
| 758 | 827 |  தசையில்  | — |
| 759 | 827 |  புக்தி நடக்கிறது | — |
| 760 | 827 | தற்போது உங்களுக்கு  | — |
| 761 | 830 |  நடைபெறுகிறது | — |
| 762 | 830 | ; கூடவே  | — |
| 763 | 830 | மற்றும் | — |
| 764 | 835 |  இக்காலத்தில்  | — |
| 765 | 835 |  சார்ந்த விஷயங்கள் முன்னிலை பெறும். | — |
| 766 | 835 | மற்றும் | — |

### `_transcript()` — line 840 · 8 strings

| # | line | Tamil | English |
|---|---|---|---|
| 767 | 871 |  முதல்  | — |
| 768 | 871 |  வரை உங்களுக்குச் சிறந்த நேரம். | — |
| 769 | 871 | இன்று  | — |
| 770 | 876 | ; கவனிக்க வேண்டியது:  | — |
| 771 | 876 | இன்று உங்கள் பலம்:  | — |
| 772 | 880 | இன்று உங்கள் பலம்:  | — |
| 773 | 882 | இன்று கவனிக்க வேண்டியது:  | — |
| 774 | 883 | இன்றைய சிறப்பு அறிவுரை:  | — |

### `build_personal_palan()` — line 930 · 2 strings

| # | line | Tamil | English |
|---|---|---|---|
| 775 | 1027 | -ஆம் இடத்தில் உள்ளார்; இது சுமார் இரண்டே கால் நாள் நீடிக்கும். | — |
| 776 | 1027 | சந்திரன் உங்கள் ஜென்ம ராசியிலிருந்து  | — |

## `app/services/nakshatra_content.py`


### `NAKSHATRA_LENS` — line 20 · 27 strings

| # | line | Tamil | English |
|---|---|---|---|
| 777 | 22 | உங்கள் ஜன்ம நட்சத்திரம் அசுவினி — இயல்பான வேகம் இருக்கட்டும்; ஆனால் முடிவுகளை நிதானமாக எடுங்கள். | Aswini lens: keep your natural speed, but make decisions with calm pacing. |
| 778 | 26 | உங்கள் ஜன்ம நட்சத்திரம் பரணி — பொறுப்பு உங்கள் பலம்; தேவைக்கு மேல் சுமையை ஏற்காதீர்கள். | Bharani lens: responsibility is your strength; avoid carrying more than needed. |
| 779 | 30 | உங்கள் ஜன்ம நட்சத்திரம் கார்த்திகை — தெளிவு முக்கியம்; தேவையில்லாத மோதலைத் தவிர்க்கவும். | Karthigai lens: clarity is key; avoid unnecessary conflict. |
| 780 | 34 | உங்கள் ஜன்ம நட்சத்திரம் ரோகிணி — நிதானமான, உறுதியான முயற்சி இன்று நல்ல பலன் தரும். | Rohini lens: steady and grounded effort can bring good outcomes today. |
| 781 | 38 | உங்கள் ஜன்ம நட்சத்திரம் மிருகசீரிடம் — தேடும் ஆர்வம் உங்கள் வரம்; ஒரு நேரத்தில் ஒரு வேலையில் கவனம் வையுங்கள். | Mirugaseeridam lens: curiosity is your gift; focus on one clear task at a time. |
| 782 | 42 | உங்கள் ஜன்ம நட்சத்திரம் திருவாதிரை — ஆழ்ந்த சிந்தனையைப் பயன்படுத்துங்கள்; அளவுக்கு மீறி யோசிப்பதைத் தவிர்க்கவும். | Thiruvathirai lens: use depth of thought well, while reducing overthinking. |
| 783 | 46 | உங்கள் ஜன்ம நட்சத்திரம் புனர்பூசம் — மீண்டு எழும் சக்தி உங்களிடம் உண்டு; நம்பிக்கையை காத்துக்கொள்ளுங்கள். | Punarpoosam lens: you recover and rebuild well; protect your optimism. |
| 784 | 50 | உங்கள் ஜன்ம நட்சத்திரம் பூசம் — பிறரை பராமரிப்பது உங்கள் பலம்; உங்களுக்கான ஓய்வு நேரத்தையும் காத்துக்கொள்ளுங்கள். | Poosam lens: nurturing is your strength; also preserve your own recovery time. |
| 785 | 54 | உங்கள் ஜன்ம நட்சத்திரம் ஆயில்யம் — உணர்வுகளில் தெளிவு முக்கியம்; ஊகிப்பதற்கு முன் கேட்டுத் தெளியுங்கள். | Ayilyam lens: emotional clarity matters; ask before assuming intent. |
| 786 | 58 | உங்கள் ஜன்ம நட்சத்திரம் மகம் — கண்ணியத்துடன் பணிவும் சேர்ந்தால் இன்று நல்ல பலன். | Magam lens: dignity with humility is especially effective today. |
| 787 | 62 | உங்கள் ஜன்ம நட்சத்திரம் பூரம் — உறவுகளில் மகிழ்ச்சி இருக்கட்டும்; அதே நேரம் எல்லைகள் தெளிவாக இருக்கட்டும். | Pooram lens: enjoy connection, while keeping boundaries clear. |
| 788 | 66 | உங்கள் ஜன்ம நட்சத்திரம் உத்திரம் — ஒப்பந்தங்களிலும் முடிவுகளிலும் நியாயத்தை உறுதியாகப் பிடித்துக்கொள்ளுங்கள். | Uthiram lens: in commitments and decisions, hold firm to fairness. |
| 789 | 70 | உங்கள் ஜன்ம நட்சத்திரம் அஸ்தம் — கையில் இருப்பதை முழுமையாக முடியுங்கள்; பல வேலைகளை ஒரே நேரத்தில் இழுக்காதீர்கள். | Hastham lens: finish what is in your hands well; avoid excessive multitasking. |
| 790 | 74 | உங்கள் ஜன்ம நட்சத்திரம் சித்திரை — தரம் முக்கியம்தான்; ஆனால் முழுமை வேட்கையை அளவுக்குள் வையுங்கள். | Chithirai lens: quality matters; keep perfectionism within healthy limits. |
| 791 | 78 | உங்கள் ஜன்ம நட்சத்திரம் சுவாதி — சுதந்திரத்தை காத்துக்கொண்டே உறவுகளில் இணக்கத்தையும் பேணுங்கள். | Swathi lens: preserve independence while maintaining harmony in relationships. |
| 792 | 82 | உங்கள் ஜன்ம நட்சத்திரம் விசாகம் — இலக்கில் உங்கள் கவனம் வலுவானது; அவசரத்தை விட நிலையான முன்னேற்றத்தைத் தேர்வு செய்யுங்கள். | Visakam lens: your goal focus is strong; choose steady progress over haste. |
| 793 | 86 | உங்கள் ஜன்ம நட்சத்திரம் அனுசம் — நட்பு, அன்பு, ஒழுக்கம் மூன்றும் சமநிலையில் இருந்தால் இன்று நல்ல ஆதரவு. | Anusham lens: friendship, warmth, and discipline in balance can support today. |
| 794 | 90 | உங்கள் ஜன்ம நட்சத்திரம் கேட்டை — உறுதியாகப் பேசுங்கள்; ஆனால் உறுதியோடு கருணையும் சேர்ந்திருக்கட்டும். | Kettai lens: speak with strength, but pair firmness with compassion. |
| 795 | 94 | உங்கள் ஜன்ம நட்சத்திரம் மூலம் — அடிப்படைக் காரணத்தைப் புரிந்து திருத்தும் அணுகுமுறை இன்று மிகவும் பயனுள்ளது. | Moolam lens: root-cause understanding and correction are highly useful today. |
| 796 | 98 | உங்கள் ஜன்ம நட்சத்திரம் பூராடம் — உறுதியான நம்பிக்கை உங்கள் பலம்; சொல்லும் செயலும் ஒன்றாக இருக்கட்டும். | Pooradam lens: conviction is your strength; keep words and actions aligned. |
| 797 | 102 | உங்கள் ஜன்ம நட்சத்திரம் உத்திராடம் — பலன் தாமதமானாலும் நிலைத்து நிற்கும்; பொறுமையையும் ஒழுக்கத்தையும் கைவிடாதீர்கள். | Uthiradam lens: results may be delayed but durable; stay with discipline and patience. |
| 798 | 106 | உங்கள் ஜன்ம நட்சத்திரம் திருவோணம் — செயல்படும் முன் கவனமாகக் கேட்பது இன்று உங்களுக்கு வலுவான ஆதரவு. | Thiruvonam lens: listening carefully before acting gives you strong support today. |
| 799 | 110 | உங்கள் ஜன்ம நட்சத்திரம் அவிட்டம் — குழு வேலைகளில் தாளம் தவறாதீர்கள்; அளவுக்கு மேல் பொறுப்புகளை ஏற்பதைத் தவிர்க்கவும். | Avittam lens: keep rhythm in team efforts; reduce over-commitment. |
| 800 | 114 | உங்கள் ஜன்ம நட்சத்திரம் சதயம் — புதிய யோசனைகளை வரவேற்கலாம்; ஆனால் சரிபார்த்த பின் முன்னேறுங்கள். | Sadayam lens: welcome new ideas, and move forward with verification. |
| 801 | 118 | உங்கள் ஜன்ம நட்சத்திரம் பூரட்டாதி — ஆழமான பார்வை உங்கள் பலம்; மனதுக்கு ஓய்வு நேரமும் கொடுங்கள். | Poorattathi lens: deep insight is your strength; give the mind recovery space. |
| 802 | 122 | உங்கள் ஜன்ம நட்சத்திரம் உத்திரட்டாதி — நிதானம், நீண்ட பார்வை, பொறுப்பு — இவை மூன்றும் இன்று நல்ல வழி காட்டும். | Uthirattathi lens: patience, long view, and responsibility can carry the day. |
| 803 | 126 | உங்கள் ஜன்ம நட்சத்திரம் ரேவதி — கருணையும் வழிகாட்டுதலும் உங்கள் பலம்; உங்கள் எல்லைகளையும் உறுதியாக காத்துக்கொள்ளுங்கள். | Revathi lens: compassion and guidance are your strengths; keep boundaries firm. |

### `DEFAULT_LENS` — line 131 · 1 strings

| # | line | Tamil | English |
|---|---|---|---|
| 804 | 132 | இன்று அமைதியான, நிலையான அணுகுமுறை நாளை மேம்படுத்த உதவும். | Janma nakshatra lens: a calm, steady approach can improve today. |

### `build_nakshatra_perspective()` — line 137 · 2 strings

| # | line | Tamil | English |
|---|---|---|---|
| 805 | 142 |  இன்று பெரிய புதிய முடிவுகளை விட சிறிய, உறுதியான அடிகளே நல்லது. | — |
| 806 | 148 |  இன்று சாதகமான நேரங்களை முதலில் உங்கள் மிக முக்கியமான வேலைகளுக்குப் பயன்படுத்துங்கள். | — |

### `_GANA_LABELS` — line 176 · 3 strings

| # | line | Tamil | English |
|---|---|---|---|
| 807 | 177 | தேவ கணம் | Deva Gana |
| 808 | 178 | மனுஷ கணம் | Manushya Gana |
| 809 | 179 | ராட்சத கணம் | Rakshasa Gana |

### `_YONI_LABELS` — line 182 · 14 strings

| # | line | Tamil | English |
|---|---|---|---|
| 810 | 183 | ஆடு | Sheep |
| 811 | 183 | குதிரை | Horse |
| 812 | 183 | யானை | Elephant |
| 813 | 184 | நாய் | Dog |
| 814 | 184 | பாம்பு | Serpent |
| 815 | 184 | பூனை | Cat |
| 816 | 185 | எருமை | Buffalo |
| 817 | 185 | எலி | Rat |
| 818 | 185 | பசு | Cow |
| 819 | 186 | குரங்கு | Monkey |
| 820 | 186 | புலி | Tiger |
| 821 | 186 | மான் | Deer |
| 822 | 187 | கீரி | Mongoose |
| 823 | 187 | சிங்கம் | Lion |

### `_NAKSHATRA_CODE_NAMES` — line 232 · 31 strings

| # | line | Tamil | English |
|---|---|---|---|
| 824 | 233 | அசுவினி | Aswini |
| 825 | 234 | பரணி | Bharani |
| 826 | 235 | கார்த்திகை | Karthigai |
| 827 | 236 | ரோகிணி | Rohini |
| 828 | 237 | மிருகசீரிடம் | Mirugaseeridam |
| 829 | 238 | திருவாதிரை | Thiruvathirai |
| 830 | 239 | புனர்பூசம் | Punarpoosam |
| 831 | 240 | பூசம் | Poosam |
| 832 | 241 | ஆயில்யம் | Ayilyam |
| 833 | 242 | மகம் | Magam |
| 834 | 243 | பூரம் | Pooram |
| 835 | 244 | உத்திரம் | Uthiram |
| 836 | 245 | ஹஸ்தம் | Hastham |
| 837 | 246 | ஹஸ்தம் | Hastham |
| 838 | 247 | சித்திரை | Chithirai |
| 839 | 248 | சுவாதி | Swathi |
| 840 | 249 | விசாகம் | Visakam |
| 841 | 250 | அனுசம் | Anusham |
| 842 | 251 | கேட்டை | Kettai |
| 843 | 252 | மூலம் | Moolam |
| 844 | 253 | பூராடம் | Pooradam |
| 845 | 254 | உத்திராடம் | Uthiradam |
| 846 | 255 | திருவோணம் | Thiruvonam |
| 847 | 256 | அவிட்டம் | Avittam |
| 848 | 257 | சதயம் | Sadayam |
| 849 | 258 | சதயம் | Sadayam |
| 850 | 259 | பூரட்டாதி | Poorattathi |
| 851 | 260 | பூரட்டாதி | Poorattathi |
| 852 | 261 | உத்திரட்டாதி | Uthirattathi |
| 853 | 262 | உத்திரட்டாதி | Uthirattathi |
| 854 | 263 | ரேவதி | Revathi |

### `_PORUTHAM_BASIS_BY_POSITION` — line 266 · 3 strings

| # | line | Tamil | English |
|---|---|---|---|
| 855 | 267 | யோனி, கண ஒற்றுமை | — |
| 856 | 268 | தின, மகேந்திர ஒற்றுமை | — |
| 857 | 269 | ராசி, ரஜ்ஜு சமநிலை | — |

### `_CARDS` — line 283 · 218 strings

| # | line | Tamil | English |
|---|---|---|---|
| 858 | 285 | அசுவினி | — |
| 859 | 286 | அசுவினி குமாரர்கள் | — |
| 860 | 287 | குதிரை தலை | — |
| 861 | 290 | அசுவினி நட்சத்திரத்தினர் துடிப்பான, முன்னோக்கிய சிந்தனையுடன் செயல்படுவர். இவர்கள் விரைவான முடிவு எடுப்பவர்களாகவும், தொடக்கங்களில் சிறந்தவர்களாகவும் இருப்பர். | Aswini natives are energetic and forward-thinking with a talent for quick action. They excel at initiating new endeavours and bringing fresh energy to any situation. |
| 862 | 294 | துடிப்பான செயல்திறன் | Dynamic initiative |
| 863 | 295 | குணமாக்கும் ஆற்றல் | Healing ability |
| 864 | 296 | விரைவான முடிவெடுக்கும் திறன் | Quick decision-making |
| 865 | 299 | அவசரமான செயல்களை தவிர்க்கவும் | Avoid impulsive actions |
| 866 | 300 | பொறுமையை வளர்க்கவும் | Cultivate patience |
| 867 | 305 | பரணி | — |
| 868 | 306 | யமன் | — |
| 869 | 307 | யோனி (கர்ப்பம்) | — |
| 870 | 310 | பரணி நட்சத்திரத்தினர் மிகவும் உழைப்பாளிகளும், பொறுப்பான முடிவெடுப்பவர்களும் ஆவர். இவர்கள் படைப்பு ஆற்றலிலும், மாற்றத்தை கையாள்வதிலும் சிறந்தவர்கள். | Bharani natives are hardworking and take responsibility seriously. They have strong creative energy and the capacity to handle transformation. |
| 871 | 314 | மிகுந்த உழைப்பு | Extraordinary diligence |
| 872 | 315 | படைப்பு சக்தி | Creative force |
| 873 | 316 | மாற்றங்களை சமாளிக்கும் திறன் | Capacity for transformation |
| 874 | 319 | அளவுக்கதிகமான சுமை ஏற்காதீர் | Avoid taking on excessive burdens |
| 875 | 324 | கார்த்திகை | — |
| 876 | 325 | அக்னி / முருகன் | — |
| 877 | 326 | சுடர் / கத்தி | — |
| 878 | 329 | கார்த்திகை நட்சத்திரத்தினர் தெளிவான நோக்கமும், உயர்ந்த நோக்கங்களும் கொண்டவர்கள். இவர்கள் தலைமை குணமும், ஆழமான சுய-அறிவும் உடையவர்கள். | Karthigai natives possess clarity of purpose and high aspirations. They carry natural leadership quality and deep self-awareness. |
| 879 | 333 | தலைமை குணம் | Natural leadership |
| 880 | 334 | தெளிவு மற்றும் நேர்மை | Clarity and integrity |
| 881 | 335 | ஆழமான சிந்தனை | Deep thinking |
| 882 | 338 | கோபத்தை கட்டுப்படுத்தவும் | Manage temper |
| 883 | 339 | நெகிழ்வுத்தன்மையை வளர்க்கவும் | Cultivate flexibility |
| 884 | 344 | ரோகிணி | — |
| 885 | 345 | பிரம்மா | — |
| 886 | 346 | சகடம் / தாமரை | — |
| 887 | 349 | ரோகிணி நட்சத்திரத்தினர் மிகவும் கவர்ச்சியானவர்களும், படைப்பு ஆற்றல் மிக்கவர்களும் ஆவர். இவர்கள் நல்ல சொல்வன்மையாளர்களாகவும், வளம் நல்குவோராகவும் இருப்பர். | Rohini natives are charming and highly creative. They are gifted communicators and have a natural capacity to attract prosperity. |
| 888 | 353 | வசீகரமான ஆளுமை | Charming personality |
| 889 | 354 | படைப்பாற்றல் | Creative talent |
| 890 | 355 | வளமை நல்கும் குணம் | Prosperity-attracting nature |
| 891 | 358 | அழகு சார்ந்த ஆசைகளில் நடுநிலை வேண்டும் | Balance desire for beauty and comfort |
| 892 | 363 | மிருகசீரிடம் | — |
| 893 | 364 | சோமா (சந்திரன்) | — |
| 894 | 365 | மான் தலை | — |
| 895 | 368 | மிருகசீரிடம் நட்சத்திரத்தினர் அறிவு தாகம் கொண்டவர்கள், எப்போதும் ஏதாவது தேடிக்கொண்டே இருப்பர். இவர்கள் மென்மையான இதயம் மற்றும் கூர்மையான புத்தி கொண்டவர்கள். | Mirugaseeridam natives are intellectually curious and always seeking. They combine a gentle heart with a sharp, investigative mind. |
| 896 | 372 | அறிவுத் தேடல் | Intellectual curiosity |
| 897 | 373 | ஆய்வு திறன் | Investigative ability |
| 898 | 374 | மென்மையான இதயம் | Gentle nature |
| 899 | 377 | ஒரே விஷயத்தில் நிலைத்திருக்க கற்கவும் | Develop ability to stay focused |
| 900 | 382 | திருவாதிரை | — |
| 901 | 383 | ருத்ரன் / சிவன் | — |
| 902 | 384 | ஒரே நட்சத்திரம் (ஆர்த்ரா) | — |
| 903 | 387 | திருவாதிரை நட்சத்திரத்தினர் மாற்றத்தின் சக்தி கொண்டவர்கள். இவர்கள் ஆழமான சிந்தனையாளர்கள், மற்றவர்களை தாண்டி யோசிக்கும் திறன் கொண்டவர்கள். | Thiruvathirai natives carry transformative energy. They are deep thinkers who see beyond conventional boundaries. |
| 904 | 391 | மாற்றும் சக்தி | Transformative power |
| 905 | 392 | ஆழமான சிந்தனை | Deep thinking |
| 906 | 393 | அறிவியல் ஆர்வம் | Scientific curiosity |
| 907 | 396 | கோபத்தை குணமாக்கலாக மாற்றவும் | Channel anger constructively |
| 908 | 401 | புனர்பூசம் | — |
| 909 | 402 | அதிதி | — |
| 910 | 403 | அம்புறாத்தூணி / வீடு மீட்சி | — |
| 911 | 406 | புனர்பூசம் நட்சத்திரத்தினர் தொன்றும் புதுமையும் இணைந்தவர்கள். இவர்கள் மீண்டும் எழுவதில் தனித்தமான ஆற்றல் கொண்டவர்கள், மற்றவர்களுக்கு நம்பிக்கை தருவர். | Punarpoosam natives blend tradition with renewal. They have a unique ability to recover and rise again, offering hope and wisdom to others. |
| 912 | 410 | மீண்டெழும் சக்தி | Resilience |
| 913 | 411 | ஞானம் | Wisdom |
| 914 | 412 | பாதுகாப்பான இயல்பு | Nurturing nature |
| 915 | 415 | பழைய முறைகளில் தேங்கிவிடாதீர் | Avoid getting stuck in old patterns |
| 916 | 420 | பூசம் | — |
| 917 | 421 | பிரஹஸ்பதி (குரு) | — |
| 918 | 422 | கன்றுக்குட்டி / மடல் | — |
| 919 | 425 | பூசம் நட்சத்திரத்தினர் மிகவும் சக்திவாய்ந்தவர்களும், பரிவுள்ளவர்களும் ஆவர். இவர்கள் அற்புதமான சேவை மனப்பான்மையும், பிறரை பாதுகாக்கும் இயல்பும் கொண்டவர்கள். | Poosam natives are powerful yet compassionate. They have an extraordinary service orientation and a natural instinct to protect and nourish others. |
| 920 | 429 | சேவை மனப்பான்மை | Service orientation |
| 921 | 430 | பாதுகாப்பு இயல்பு | Protective instinct |
| 922 | 431 | மன உறுதி | Inner strength |
| 923 | 434 | அதிகமாக செலவழிக்கும் போக்கை கட்டுப்படுத்தவும் | Manage tendency to over-give |
| 924 | 439 | ஆயில்யம் | — |
| 925 | 440 | சர்ப்பம் (நாக தேவதை) | — |
| 926 | 441 | சர்ப்பம் | — |
| 927 | 444 | ஆயில்யம் நட்சத்திரத்தினர் ஆழமான உள்ளுணர்வும், மர்ம சக்தியும் கொண்டவர்கள். இவர்கள் குண்டலினி சக்தியை புரிந்துகொள்ளும் திறன் மற்றும் மறைவான விஷயங்களை அறியும் ஞானம் கொண்டவர்கள். | Ayilyam natives possess deep intuition and mystical energy. They have an inherent understanding of hidden forces and a natural connection to transformative wisdom. |
| 928 | 448 | ஆழமான உள்ளுணர்வு | Deep intuition |
| 929 | 449 | மர்ம ஞானம் | Mystical wisdom |
| 930 | 450 | குணமாக்கும் ஆற்றல் | Healing ability |
| 931 | 453 | நம்பிக்கை விஷயங்களில் கவனமாக இருக்கவும் | Exercise care in matters of trust |
| 932 | 458 | மகம் | — |
| 933 | 459 | பித்ரு (முன்னோர்கள்) | — |
| 934 | 460 | அரசன் அரியாசனம் | — |
| 935 | 463 | மகம் நட்சத்திரத்தினர் உயர்ந்த அந்தஸ்து மற்றும் வழிமரபை மதிப்பவர்கள். இவர்கள் இயல்பான அதிகார குணமும், முன்னோர் பக்தியும் கொண்டவர்கள். | Magam natives value high status and lineage. They carry natural authority and a deep reverence for ancestry and tradition. |
| 936 | 467 | இயல்பான தலைமை | Natural authority |
| 937 | 468 | வழிமரபு மதிப்பு | Respect for tradition |
| 938 | 469 | உயர்ந்த தரம் | High standards |
| 939 | 472 | அகங்காரத்தை தவிர்க்கவும் | Avoid arrogance |
| 940 | 477 | பூரம் | — |
| 941 | 478 | பகன் | — |
| 942 | 479 | நட்சத்திரங்களின் ஜோடி / அத்திக்கனி | — |
| 943 | 482 | பூரம் நட்சத்திரத்தினர் முடிவு செய்யும் திறன் மற்றும் துணிச்சல் கொண்டவர்கள். இவர்கள் மனதில் நிரந்தரமான மாற்றங்களை உருவாக்கும் சக்தி கொண்டவர்கள். | Pooram natives are decisive and bold. They have the capacity to create lasting changes and are often drawn to powerful ambitions. |
| 944 | 486 | துணிச்சல் | Boldness |
| 945 | 487 | முடிவு திறன் | Decisiveness |
| 946 | 488 | வலிமை | Inner strength |
| 947 | 491 | அடக்கமின்மையை கட்டுப்படுத்தவும் | Manage stubbornness |
| 948 | 496 | உத்திரம் | — |
| 949 | 497 | ஆர்யமன் | — |
| 950 | 498 | கட்டில் / சுண்டெலி | — |
| 951 | 501 | உத்திரம் நட்சத்திரத்தினர் கடமை உணர்வும், நியாய உணர்வும் கொண்டவர்கள். இவர்கள் நம்பகமானவர்களாகவும், உறுதியான தத்துவக் கொள்கைகள் கொண்டவர்களாகவும் இருப்பர். | Uthiram natives have a strong sense of duty and justice. They are reliable individuals with firm ethical principles. |
| 952 | 505 | நம்பகத்தன்மை | Reliability |
| 953 | 506 | நீதி உணர்வு | Sense of justice |
| 954 | 507 | உறுதியான கொள்கை | Firm principles |
| 955 | 510 | கடினமான தன்மையை கட்டுப்படுத்தவும் | Soften rigid tendencies |
| 956 | 515 | அஸ்தம் | — |
| 957 | 516 | சவிதர் (சூரியன்) | — |
| 958 | 517 | கை / பனை இலை விசிறி | — |
| 959 | 520 | அஸ்தம் நட்சத்திரத்தினர் திறமையும், நடைமுறை அறிவும் கொண்டவர்கள். இவர்கள் கைத்திறமை மிக்கவர்களாகவும், நேரடியாக பேசுவோராகவும் இருப்பர். | Hastham natives are skilled and practically intelligent. They are dexterous individuals who communicate directly and accomplish things effectively. |
| 960 | 524 | கைத்திறமை | Manual dexterity |
| 961 | 525 | நடைமுறை அறிவு | Practical intelligence |
| 962 | 526 | திறமையான தொடர்பு | Effective communication |
| 963 | 529 | சுயமரியாதை விஷயங்களில் கவனம் | Attend to self-care |
| 964 | 534 | சித்திரை | — |
| 965 | 535 | த்வஷ்டர் / விஸ்வகர்மா | — |
| 966 | 536 | பிரகாசமான ஒளி / முத்து | — |
| 967 | 539 | சித்திரை நட்சத்திரத்தினர் அழகியல் உணர்வும், கலைத்திறனும் கொண்டவர்கள். இவர்கள் வடிவமைப்பிலும், படைப்பு ஆற்றலிலும் சிறந்தவர்கள். | Chithirai natives possess refined aesthetic sense and artistic talent. They excel in design, creation, and bringing beauty into the world. |
| 968 | 543 | கலைத்திறன் | Artistic ability |
| 969 | 544 | அழகியல் உணர்வு | Aesthetic sensibility |
| 970 | 545 | வடிவமைப்பு திறன் | Design skill |
| 971 | 548 | தீர்ப்பளிக்கும் போக்கை கட்டுப்படுத்தவும் | Temper judgmental tendencies |
| 972 | 553 | சுவாதி | — |
| 973 | 554 | வாயு | — |
| 974 | 555 | மூங்கில் துளி / மதிமயக்கம் | — |
| 975 | 558 | சுவாதி நட்சத்திரத்தினர் சுதந்திரமான சிந்தனையும், நடுநிலை மனப்பான்மையும் கொண்டவர்கள். இவர்கள் இடர்களை நெகிழ்வுடன் கடக்கும் ஆற்றல் கொண்டவர்கள். | Swathi natives value independence and are known for their balanced, neutral perspective. They have remarkable flexibility in navigating challenges. |
| 976 | 562 | சுதந்திர சிந்தனை | Independent thinking |
| 977 | 563 | நெகிழ்வுத்தன்மை | Flexibility |
| 978 | 564 | வியாபார திறன் | Business acumen |
| 979 | 567 | திட்டவட்டமான இலக்கை நிலைநிறுத்தவும் | Maintain clear direction |
| 980 | 572 | விசாகம் | — |
| 981 | 573 | இந்திரன் மற்றும் அக்னி | — |
| 982 | 574 | வளைந்த கிளை / வாயில் கட்டமைப்பு | — |
| 983 | 577 | விசாகம் நட்சத்திரத்தினர் இலக்கை நோக்கிய சக்தியும், விடாமுயற்சியும் கொண்டவர்கள். இவர்கள் சாதனை நோக்கி பயணிப்பதில் சிறந்தவர்கள். | Visakam natives have goal-oriented energy and persistence. They are driven achievers who relentlessly pursue their aims. |
| 984 | 581 | விடாமுயற்சி | Persistence |
| 985 | 582 | இலக்கு நோக்கிய சக்தி | Goal-directed drive |
| 986 | 583 | ஆற்றல் திரட்சி | Ability to focus energy |
| 987 | 586 | பிறரின் முன்னேற்றத்தை ஏற்கவும் | Accept others' success graciously |
| 988 | 591 | அனுசம் | — |
| 989 | 592 | மித்ரன் | — |
| 990 | 593 | தாமரை | — |
| 991 | 596 | அனுசம் நட்சத்திரத்தினர் நட்பு உணர்வும், நேர்மையும் கொண்டவர்கள். இவர்கள் அமைப்புகளை கட்டமைக்கும் திறனும், மற்றவர்களுடன் நல்லுறவு பேணும் ஆற்றலும் கொண்டவர்கள். | Anusham natives are devoted friends and honest individuals. They have the ability to build organisations and maintain harmonious relationships. |
| 992 | 600 | நட்பு திறன் | Friendship capacity |
| 993 | 601 | நேர்மை | Integrity |
| 994 | 602 | கட்டமைப்பு திறன் | Organisational ability |
| 995 | 605 | ஒழுங்கில் நமனீயத்தன்மையை வளர்க்கவும் | Add flexibility to discipline |
| 996 | 610 | கேட்டை | — |
| 997 | 611 | இந்திரன் | — |
| 998 | 612 | வளையல் / குடை | — |
| 999 | 615 | கேட்டை நட்சத்திரத்தினர் தலைமை ஆற்றலும், ஆழமான பொறுப்பு உணர்வும் கொண்டவர்கள். இவர்கள் மிகவும் உழைப்பாளிகளாகவும், உயர் அந்தஸ்து நாடுவோராகவும் இருப்பர். | Kettai natives possess leadership ability and a deep sense of responsibility. They are industrious people who seek high achievement. |
| 1000 | 619 | தலைமை திறன் | Leadership |
| 1001 | 620 | உழைப்பு | Industry |
| 1002 | 621 | பொறுப்பு உணர்வு | Sense of responsibility |
| 1003 | 624 | கடக்கமான தன்மையை கட்டுப்படுத்தவும் | Manage secretive tendencies |
| 1004 | 629 | மூலம் | — |
| 1005 | 630 | நிர்ருதி | — |
| 1006 | 631 | வேர்களின் கட்டு / அரியாசனம் | — |
| 1007 | 634 | மூலம் நட்சத்திரத்தினர் ஆராய்ச்சி திறனும், தத்துவ சிந்தனையும் கொண்டவர்கள். இவர்கள் வேர்களுக்கு திரும்பும் குணமும், ஆழமான உண்மையை தேடும் இயல்பும் கொண்டவர்கள். | Moolam natives have investigative minds and philosophical inclinations. They are drawn to finding root causes and seeking deep truth. |
| 1008 | 638 | ஆராய்ச்சி திறன் | Research ability |
| 1009 | 639 | தத்துவ சிந்தனை | Philosophical depth |
| 1010 | 640 | வேரை தேடும் குணம் | Root-finding nature |
| 1011 | 643 | அதிக அலைச்சலை தவிர்க்கவும் | Avoid excessive wandering |
| 1012 | 648 | பூராடம் | — |
| 1013 | 649 | ஜலம் (வருணன்) | — |
| 1014 | 650 | யானை தந்தம் / மயில் தோகை | — |
| 1015 | 653 | பூராடம் நட்சத்திரத்தினர் வற்றாத ஊக்கமும், வெற்றியின் மீது ஆழமான நம்பிக்கையும் கொண்டவர்கள். இவர்கள் நியாயமான போராளிகளாக இருப்பர். | Pooradam natives have inexhaustible enthusiasm and a deep belief in victory. They are spirited individuals who fight for what they believe is just. |
| 1016 | 657 | ஊக்கம் | Enthusiasm |
| 1017 | 658 | வெற்றி நம்பிக்கை | Belief in success |
| 1018 | 659 | நியாய உணர்வு | Sense of fairness |
| 1019 | 662 | வீம்பினை கட்டுப்படுத்தவும் | Manage pride |
| 1020 | 667 | உத்திராடம் | — |
| 1021 | 668 | விஸ்வேதேவா | — |
| 1022 | 669 | யானை தந்தம் (முன்) / கட்டில் கால் | — |
| 1023 | 672 | உத்திராடம் நட்சத்திரத்தினர் நிலைத்த வெற்றியை நோக்கி செயல்படுவர். இவர்கள் நேர்மையான, நற்குணம் மிக்க, உலகுக்கு நன்மை செய்ய விரும்பும் தன்மையுடையவர்கள். | Uthiradam natives work toward lasting victory. They are honest, virtuous individuals who wish to contribute to the greater good. |
| 1024 | 676 | நிலைத்த உழைப்பு | Sustained effort |
| 1025 | 677 | நேர்மை | Honesty |
| 1026 | 678 | உதவும் குணம் | Altruistic nature |
| 1027 | 681 | சுயத்தையும் கவனிக்கவும் | Attend to your own needs too |
| 1028 | 686 | திருவோணம் | — |
| 1029 | 687 | விஷ்ணு | — |
| 1030 | 688 | மூன்று அடிகள் / யானை | — |
| 1031 | 691 | திருவோணம் நட்சத்திரத்தினர் கற்கும் ஆர்வம் மற்றும் மற்றவர்களை கற்பிக்கும் ஆற்றல் கொண்டவர்கள். இவர்கள் அறிவை பரப்பும் இயல்பும், மற்றவர்களை இணைக்கும் திறனும் கொண்டவர்கள். | Thiruvonam natives have a love of learning and the ability to teach others. They are natural connectors who spread knowledge. |
| 1032 | 695 | கல்வி திறன் | Educational ability |
| 1033 | 696 | இணைக்கும் ஆற்றல் | Connecting ability |
| 1034 | 697 | அறிவு பரப்பல் | Knowledge spreading |
| 1035 | 700 | கடுமையான விமர்சனத்தை தவிர்க்கவும் | Avoid harsh criticism |
| 1036 | 705 | அவிட்டம் | — |
| 1037 | 706 | அஷ்ட வசுக்கள் | — |
| 1038 | 707 | யானை தந்தம் / யானை தலை | — |
| 1039 | 710 | அவிட்டம் நட்சத்திரத்தினர் நட்பு மனப்பான்மையும், ஆற்றல் மிகுந்த சக்தியும் கொண்டவர்கள். இவர்கள் இலக்கை அடைவதில் சமரசமற்ற உறுதி கொண்டவர்கள். | Avittam natives are sociable and energetic. They possess uncompromising determination in pursuing their goals. |
| 1040 | 714 | நட்பு குணம் | Friendly nature |
| 1041 | 715 | உறுதி | Determination |
| 1042 | 716 | சக்தி | Energy |
| 1043 | 719 | அவசர முடிவுகளை தவிர்க்கவும் | Avoid hasty decisions |
| 1044 | 724 | சதயம் | — |
| 1045 | 725 | வருணன் | — |
| 1046 | 726 | வட்டம் / தாமரை | — |
| 1047 | 729 | சதயம் நட்சத்திரத்தினர் சுயாதீன சிந்தனையும், மனிதநேய உணர்வும் கொண்டவர்கள். இவர்கள் குணமாக்கும் திறனும், மனித நலனில் ஆர்வமும் கொண்டவர்கள். | Sadayam natives are independent thinkers with humanitarian ideals. They have healing instincts and a natural interest in human welfare. |
| 1048 | 733 | சுயாதீன சிந்தனை | Independent thinking |
| 1049 | 734 | மனிதநேயம் | Humanitarianism |
| 1050 | 735 | குணமாக்கும் ஆற்றல் | Healing ability |
| 1051 | 738 | தனிமையை தவிர்க்கவும் | Avoid excessive isolation |
| 1052 | 743 | பூரட்டாதி | — |
| 1053 | 744 | அஜ ஏகபாத் | — |
| 1054 | 745 | இரண்டு அழகான முகங்கள் / கட்டில் | — |
| 1055 | 748 | பூரட்டாதி நட்சத்திரத்தினர் ஆழமான ஞானமும், தத்துவ சிந்தனையும் கொண்டவர்கள். இவர்கள் உள்ளார்ந்த மாற்றத்தை நாடுவோராக இருப்பர். | Poorattathi natives possess deep wisdom and philosophical thinking. They seek inner transformation and are drawn to profound questions. |
| 1056 | 752 | தத்துவ ஞானம் | Philosophical wisdom |
| 1057 | 753 | உள் மாற்றம் | Inner transformation |
| 1058 | 754 | ஆழமான சிந்தனை | Deep thinking |
| 1059 | 757 | நடைமுறை விஷயங்களில் கவனம் செலுத்தவும் | Balance spiritual focus with practical matters |
| 1060 | 762 | உத்திரட்டாதி | — |
| 1061 | 763 | அஹிர்புத்னியன் | — |
| 1062 | 764 | கட்டில் / இரண்டு பின் கால்கள் | — |
| 1063 | 767 | உத்திரட்டாதி நட்சத்திரத்தினர் ஆன்மீக சக்தியும், சேவை மனமும் கொண்டவர்கள். இவர்கள் சமூகத்திற்கு பங்களிக்கும் ஆர்வமும், ஆழமான ஆன்மீக உணர்வும் கொண்டவர்கள். | Uthirattathi natives have spiritual energy and a service-oriented heart. They contribute to community and are guided by a deep spiritual sense. |
| 1064 | 771 | ஆன்மீக சக்தி | Spiritual strength |
| 1065 | 772 | சேவை மனம் | Service orientation |
| 1066 | 773 | சமூக பங்களிப்பு | Community contribution |
| 1067 | 776 | சுய கவனிப்பை புறக்கணிக்காதீர் | Do not neglect self-care |
| 1068 | 781 | ரேவதி | — |
| 1069 | 782 | பூஷன் | — |
| 1070 | 783 | மீன் / டம்ளர் | — |
| 1071 | 786 | ரேவதி நட்சத்திரத்தினர் கனிவும், அன்பும், கலை ஆர்வமும் கொண்டவர்கள். இவர்கள் மற்றவர்களை வழிநடத்தும் திறனும், இழந்தவர்களை மீட்கும் இயல்பும் கொண்டவர்கள். | Revathi natives are nurturing, loving, and artistically inclined. They have the ability to guide others and bring home those who are lost. |
| 1072 | 790 | அன்பு | Loving nature |
| 1073 | 791 | வழிகாட்டும் ஆற்றல் | Guiding ability |
| 1074 | 792 | கலை ஆர்வம் | Artistic interest |
| 1075 | 795 | மற்றவர்களை நம்பும் போக்கில் கவனம் | Exercise care in whom you trust |

## `app/services/emotional_weather.py`


### `_TONE_MAP` — line 34 · 21 strings

| # | line | Tamil | English |
|---|---|---|---|
| 1076 | 40 | இன்று தன்னம்பிக்கை கூடுதலாக இருக்கலாம்; தெளிவான முடிவுகளுக்கு நல்ல நாள். | Confidence and clarity may be higher today — good for clear, decisive action. |
| 1077 | 41 | உடலில் உற்சாகமும் முன்முயற்சியும் கூடுதலாக இருக்கலாம். | Physical drive and initiative may feel elevated. |
| 1078 | 43 | தலைமை ஏற்பது, கருத்து சொல்வது, மேடையில் நிற்பது — இவற்றுக்கு இன்று நல்ல ஆதரவு. | Supportive for leadership, public presence, and speaking your mind. |
| 1079 | 52 | உணர்வுபூர்வமான முக்கிய பேச்சுகளை முடிந்தால் மாலை வரை தள்ளி வைக்கலாம். | Delay emotionally heavy conversations until the evening if possible. |
| 1080 | 55 | இன்று மனநிலை சற்று கனமாக இருக்க வாய்ப்பு. | Emotional tone may feel heavier today. |
| 1081 | 56 | உடல் சக்தி சற்று மந்தமாக உணரப்படலாம். | Energy may feel slower or lower. |
| 1082 | 58 | ஆழமான, அமைதியான, கவனம் தேவைப்படும் வேலைகளுக்கு இன்று நல்ல நாள். | Best used for focused, deep, low-noise work. |
| 1083 | 67 | இன்று மனம் திறந்ததாகவும் நம்பிக்கையுடனும் இருக்கலாம். | Tone is likely more open and expansive today. |
| 1084 | 68 | உடலும் மனமும் ஒரு நோக்கத்துடன் ஒன்றிணைந்து இயங்கும். | Body and mind can stay purposeful and focused. |
| 1085 | 70 | கூட்டு முயற்சி, கலந்துரையாடல், வழிகாட்டியுடன் உரையாடல் — இவற்றை இன்று முன்னெடுக்கலாம். | Good day for collaboration, guidance, and people-facing work. |
| 1086 | 79 | அவசர உரையாடல்களையும் வேகமான முடிவுகளையும் குறைக்கவும். | Reduce rushed discussions and impulsive calls. |
| 1087 | 82 | இன்று உள் உந்துதல் அதிகமாக, மனம் சற்று அமைதியிழந்து இருக்கலாம். | Emotional tone may feel restless with high internal drive. |
| 1088 | 83 | உடலில் அதிக வேகம் அல்லது இறுக்கம் உணரப்படலாம். | Physical tendency may be overactive or tense. |
| 1089 | 85 | சிறு சிறு வேலைகளை வேகமாக முடிக்கவும், நிலுவையில் உள்ளவற்றை முடித்து வைக்கவும் இன்று சரியான நாள். | Use for short execution sprints and pending task closure. |
| 1090 | 94 | இன்று மனநிலை சமமாக, அமைதியுடன் இருக்கலாம். | Tone is likely calm and balanced today. |
| 1091 | 95 | உடலும் மனமும் இணக்கமாக இயங்கும் சாத்தியம். | Body-mind rhythm can feel more balanced. |
| 1092 | 97 | படைப்பு வேலைகள், உறவுகளில் இணக்கம், நல்ல முன்வைப்பு — இவற்றுக்கு இன்று நல்ல ஆதரவு. | Supportive for creative tasks, harmonising relationships, and presentation work. |
| 1093 | 106 | பெரிய புதிய பொறுப்புகளை இன்று சற்று தள்ளி வைத்து யோசித்து முடிவெடுங்கள். | Pause before making major new commitments today. |
| 1094 | 109 | இன்று மனம் சற்று சிதறலாக மாறலாம். | Tone may become scattered or mentally noisy today. |
| 1095 | 110 | நேரடியான காரணம் இல்லாமல் சிறு பதற்றம் வரலாம். | Mild anxiety or over-alertness can appear. |
| 1096 | 112 | ஒரு நேரத்தில் ஒரு வேலை; பட்டியல் போட்டு ஒவ்வொன்றாக முடிப்பது இன்று நலம் தரும். | Best with one-task-at-a-time routine and checklist discipline. |

### `_DEFAULT_RESULT` — line 118 · 3 strings

| # | line | Tamil | English |
|---|---|---|---|
| 1097 | 123 | இன்று மனநிலை பொதுவாக அமைதியாக இருக்கலாம். | Emotional tone is likely steady and calm. |
| 1098 | 124 | உடல் நிலை வழக்கமான நடையில் இருக்கும். | Physical tendency should remain fairly steady. |
| 1099 | 126 | நிதானமான வழக்கமான வேலைகள், சிறு முடிவுகள், படிப்படியான முன்னேற்றம் — இவற்றுக்கு இன்று நல்ல நாள். | Well suited for routine progress and practical step-by-step decisions. |

## `app/calculations/planet_conditions.py`


### `COMBUST_MEANING` — line 31 · 6 strings

| # | line | Tamil | English |
|---|---|---|---|
| 1100 | 33 | மனநிலை வெளியே தெரியாமல் உள்ளுக்குள் இருக்கும்; உணர்வுகளை வார்த்தையாக்க கூடுதல் நேரம் தேவைப்படலாம். | Feelings tend to stay inward rather than show; you may need longer than others to put what you feel into words. |
| 1101 | 39 | நீங்கள் சொல்ல நினைத்ததற்கும் மற்றவர் புரிந்துகொள்வதற்கும் இடையே இடைவெளி வரலாம்; முக்கியமான செய்திகளை ஒருமுறை மீண்டும் படித்து அனுப்புவது நல்லது. | What you mean and what the other person hears can drift apart; it pays to re-read an important message before sending it, and to confirm you were understood. |
| 1102 | 45 | உறவுகளிலும் வசதிகளிலும் உங்கள் விருப்பம் வெளிப்படையாகச் சொல்லப்படாமல் போகலாம்; தேவையை நேரடியாகச் சொல்வது உதவும். | What you want from relationships and comfort can go unspoken; saying the need directly tends to work better than expecting it to be noticed. |
| 1103 | 51 | முனைப்பு வெளியே தெரியாமல் உள்ளே அழுத்தமாகத் தேங்கலாம்; உடல் உழைப்பு அல்லது தெளிவான இலக்கு அதற்கு வடிகால் தரும். | Drive can bank up inside instead of showing as action; physical exertion or a clearly defined target gives it somewhere to go. |
| 1104 | 57 | சொந்த நம்பிக்கையையும் தீர்ப்பையும் வெளிப்படையாக நிலைநாட்ட தயக்கம் இருக்கலாம்; நம்பகமான ஒருவரிடம் பேசி தெளிவு பெறுவது உதவும். | You may hold back from asserting your own judgement even when it is sound; talking it through with someone you trust helps it firm up. |
| 1105 | 63 | கட்டமைப்பும் ஒழுங்கும் வெளியில் தெரியாமல் மெதுவாக உருவாகும்; விளைவுகள் தாமதமாக வந்தாலும் நிலைக்கும். | Structure and discipline build quietly rather than visibly; results arrive later than you would like and tend to hold once they do. |

### `RETROGRADE_MEANING` — line 73 · 5 strings

| # | line | Tamil | English |
|---|---|---|---|
| 1106 | 75 | சிந்தனை உள்நோக்கிச் செல்லும்; முடிவெடுக்கும் முன் மீண்டும் ஆராயும் இயல்பு. திட்டங்களை மறுபரிசீலனை செய்வது இங்கே பலவீனம் அல்ல, பலம். | Thinking turns inward and doubles back before settling. Revisiting a plan is a strength in this placement rather than indecision. |
| 1107 | 81 | உறவுகளிலும் ரசனையிலும் பழையவை மீண்டும் வரும்; மதிப்புகளை மறுபரிசீலனை செய்யும் காலகட்டங்கள் இயல்பு. | Old connections and old tastes tend to resurface; periods of re-examining what you actually value are part of how this placement works. |
| 1108 | 87 | செயல்படும் முன் யோசிக்கும் இயல்பு; வெளிப்படையான மோதலைத் தவிர்த்து மறைமுகமாக முயற்சி தொடரும். | Action comes after deliberation rather than before it; effort tends to continue indirectly instead of through open confrontation. |
| 1109 | 93 | நம்பிக்கைகளையும் வழிகாட்டுதலையும் சொந்தமாக ஆராய்ந்து ஏற்கும் இயல்பு; பாரம்பரியத்தை கேள்வியின்றி ஏற்காத மனம். | Belief and guidance get examined before they are accepted; inherited tradition is not taken on trust here. |
| 1110 | 99 | பொறுப்புகளை உள்ளுக்குள் எடைபோடும் இயல்பு; வெளியில் தெரியாத ஒழுக்கம் நீண்ட காலத்தில் பலன் தரும். | Responsibility is weighed internally; a discipline others do not see is what pays off over the long run. |

### `CAZIMI_MEANING` — line 107 · 1 strings

| # | line | Tamil | English |
|---|---|---|---|
| 1111 | 108 | இந்தக் கிரகம் சூரியனின் இதயத்தில் (கசிமி) உள்ளது — அஸ்தங்க தோஷம் நீங்கி, மாறாக பலம் பெற்றதாகக் கணிக்கப்படுகிறது. | This planet sits in the heart of the Sun (cazimi): the usual combustion penalty is lifted and it is read as strengthened, not weakened. |

### `VARGOTTAMA_MEANING` — line 114 · 1 strings

| # | line | Tamil | English |
|---|---|---|---|
| 1112 | 115 | ராசியிலும் நவாம்சத்திலும் ஒரே ராசி (வர்கோத்தமம்) — இந்தக் கிரகத்தின் பலன் நிலையானது, சூழ்நிலைக்கேற்ப அதிகம் மாறாது. | The same sign in both the Rasi and the Navamsa (vargottama) — this planet's results are steady, and shift less with circumstance than the rest of the chart. |

### `D9_DEBILITATED_MEANING` — line 121 · 1 strings

| # | line | Tamil | English |
|---|---|---|---|
| 1113 | 122 | ராசியில் நன்றாக அமைந்திருந்தாலும் நவாம்சத்தில் நீசம் — வெளியில் தெரியும் வாக்குறுதிக்கும் உண்மையான பலனுக்கும் இடையே இடைவெளி இருக்கலாம்; இந்தத் துறையில் தொடர்ச்சியான முயற்சி தேவை. | Placed well in the Rasi but debilitated in the Navamsa — the outward promise of this planet can outrun what it actually delivers, so its area rewards sustained effort over assumption. |

### `VARGOTTAMA_NEECHA_MEANING` — line 133 · 1 strings

| # | line | Tamil | English |
|---|---|---|---|
| 1114 | 134 | ஆனால் அந்த ராசி இதன் நீச ராசி; வர்கோத்தமம் நிலைத்தன்மை தரும், நீசத்தை நீக்காது. நவாம்ச நீசம் தனியாகவே கணக்கில் கொள்ளப்படுகிறது. | But that sign is its debilitation sign, so it is debilitated in both charts. Vargottama makes the placement consistent; it does not lift the debility, which is counted on its own. |

### `D9_DIGNIFIED_MEANING` — line 140 · 1 strings

| # | line | Tamil | English |
|---|---|---|---|
| 1115 | 141 | நவாம்சத்தில் வலுவாக உள்ளது — ராசியில் தெரியும் பலனை நவாம்சம் உறுதிப்படுத்துகிறது. | Strong in the Navamsa — the D9 chart backs up what the Rasi chart promises here, which is the more reliable of the two signals. |

### `COMBUST_MEANING_MINOR` — line 160 · 6 strings

| # | line | Tamil | English |
|---|---|---|---|
| 1116 | 162 | உணர்வுகளை வெளிக்காட்டாமல் உள்ளுக்குள் வைத்திருக்கும் இயல்பு; என்ன உணர்கிறார் என்பதைச் சொல்ல அமைதியான நேரமும் பொறுமையும் உதவும். | Feelings tend to stay inside rather than show. Unhurried, quiet attention helps this child put what they feel into words. |
| 1117 | 168 | சொல்ல நினைப்பதற்கும் வெளிப்படுத்துவதற்கும் இடையே இடைவெளி இருக்கலாம்; பேச்சு அல்லது கற்றல் சற்று தாமதமாகத் தெளிவடையலாம் — அவசரப்படுத்தாமல் இருப்பது நல்லது. | There can be a gap between what this child means and what comes out. Speech or learning may take its own time to settle — steady practice serves better than pressure. |
| 1118 | 174 | தனக்கு என்ன பிடிக்கும் என்பதை வெளிப்படையாகக் கேட்காத இயல்பு; விருப்பங்களைக் கேட்டறிவது அவரது ரசனை வளர உதவும். | This child may not readily say what they like or want. Asking, rather than waiting to be told, helps their own taste and preferences develop. |
| 1119 | 180 | ஆற்றல் வெளியே தெரியாமல் உள்ளே தேங்கலாம்; விளையாட்டு அல்லது உடல் இயக்கம் அதற்கு நல்ல வடிகால். | Energy can bank up inside instead of coming out as activity. Play and physical movement give it somewhere useful to go. |
| 1120 | 186 | தன் கருத்தை முன்வைக்கத் தயங்கும் இயல்பு; அவரது கேள்விகளை மதிப்பது தன்னம்பிக்கையை வளர்க்கும். | This child may hold back their own view even when it is sound. Taking their questions seriously is what builds the confidence to voice it. |
| 1121 | 192 | ஒழுங்கும் திறனும் மெதுவாக, வெளியில் தெரியாமல் உருவாகும்; பிற குழந்தைகளுடன் ஒப்பிடாமல் அவரவர் வேகத்தை மதிப்பது நல்லது. | Structure and capability build slowly and quietly here. Comparison with other children misreads it — this pace is the placement working normally, not a delay. |

### `RETROGRADE_MEANING_MINOR` — line 199 · 5 strings

| # | line | Tamil | English |
|---|---|---|---|
| 1122 | 201 | யோசித்து, மீண்டும் ஆராய்ந்து முடிவெடுக்கும் இயல்பு; உடனடி பதில் வராதது புரியாமை அல்ல — அது இந்த அமைப்பின் இயல்பு. | Thinking doubles back before it settles. A slow answer here is not a gap in understanding; it is how this placement processes. |
| 1123 | 207 | பழகிய பொருட்கள், பழகிய நபர்களிடம் திரும்பத் திரும்பச் செல்லும் இயல்பு; மாற்றங்களுக்கு சற்று நேரம் தேவைப்படும். | A pull back towards familiar things and familiar people. Changes of setting or routine need a little more time here than usual. |
| 1124 | 213 | செயல்படும் முன் யோசிக்கும் இயல்பு; வெளிப்படையான மோதலைத் தவிர்க்கும் குழந்தை. | Action comes after thinking rather than before it. This child tends to avoid open confrontation rather than meet it. |
| 1125 | 218 | சொல்லப்படுவதை அப்படியே ஏற்காமல் கேள்வி கேட்கும் இயல்பு; இது மரியாதைக் குறைவு அல்ல, சொந்தமாக ஆராயும் மனம். | What they are told gets questioned before it is accepted. This is not defiance — it is a mind that needs to work things out for itself. |
| 1126 | 224 | பொறுப்பை உள்ளுக்குள் எடைபோடும் இயல்பு; வெளியில் தெரியாத ஒழுக்கம் நாளடைவில் பலன் தரும். | Responsibility gets weighed internally. A discipline that others do not see is what pays off here over time. |

## `app/services/email_service.py`


### `send_verification_email()` — line 75 · 2 strings

| # | line | Tamil | English |
|---|---|---|---|
| 1127 | 80 | உங்கள் Vinaadi கணக்கின் மின்னஞ்சல் முகவரியை உறுதிசெய்ய இந்த இணைப்பைத் திறக்கவும். இந்த இணைப்பு 48 மணி நேரத்தில் காலாவதியாகும். இந்தக் கணக்கை நீங்கள் உருவாக்கவில்லை என்றால், இந்த மின்னஞ்சலைப் புறக்கணிக்கலாம். | — |
| 1128 | 90 | Vinaadi: மின்னஞ்சலை உறுதிசெய்யுங்கள் / Confirm your email | — |

### `_PLANET_TA` — line 198 · 4 strings

| # | line | Tamil | English |
|---|---|---|---|
| 1129 | 199 | சனி (Sani) | — |
| 1130 | 200 | குரு (Guru) | — |
| 1131 | 201 | ராகு (Rahu) | — |
| 1132 | 202 | கேது (Ketu) | — |

### `_RASI_TA` — line 205 · 12 strings

| # | line | Tamil | English |
|---|---|---|---|
| 1133 | 206 | மேஷம் | — |
| 1134 | 207 | ரிஷபம் | — |
| 1135 | 208 | மிதுனம் | — |
| 1136 | 209 | கடகம் | — |
| 1137 | 210 | சிம்மம் | — |
| 1138 | 211 | கன்னி | — |
| 1139 | 212 | துலாம் | — |
| 1140 | 213 | விருச்சிகம் | — |
| 1141 | 214 | தனுசு | — |
| 1142 | 215 | மகரம் | — |
| 1143 | 216 | கும்பம் | — |
| 1144 | 217 | மீனம் | — |

### `_SANI_REMEDY` — line 221 · 7 strings

| # | line | Tamil | English |
|---|---|---|---|
| 1145 | 224 | தினசரி ஒழுக்கம் மற்றும் உடல்நலத்தை பலப்படுத்துங்கள். ஹனுமான் அல்லது சனி ஸ்தோத்திரம் உதவும். | Strengthen daily routines and physical health. Hanuman or Sani stotra recitation supports resilience. |
| 1146 | 228 | உங்களுக்கு உதவாதவற்றை விட்டுவிட கவனம் செலுத்துங்கள். சனி மறுகட்டமைப்பை கொண்டுவருகிறார். | Focus on letting go of what no longer serves you. Saturn brings restructuring — trust the process. |
| 1147 | 232 | தினசரி ஒழுக்கம் மற்றும் உடல்நலத்தை பலப்படுத்துங்கள். ஹனுமான் அல்லது சனி ஸ்தோத்திரம் உதவும். | Strengthen daily routines and physical health. Hanuman or Sani stotra recitation supports resilience. |
| 1148 | 236 | குடும்ப மற்றும் நிதி விஷயங்களில் பொறுமை தேவை. பெரிய கட்டுப்பாடுகளை தவிர்க்கவும். | Family and financial matters need patience. Avoid major commitments; focus on consolidation. |
| 1149 | 240 | உள் வேலை மற்றும் உடல்நல பராமரிப்புக்கான காலம். சனி ஒழுக்கத்தை கேட்கிறார், பயத்தை அல்ல. | A period for inner work and health care. Saturn asks for discipline, not fear. |
| 1150 | 244 | சனி கோணல் நிலையில் — தொழில் மற்றும் உறவுகளில் வலுவான அடித்தளம் அமைக்கும் நேரம். | Saturn in angular position — time to build strong foundations in career and relationships. |
| 1151 | 248 | சனி சுழற்சியின் நடுப்புள்ளி — நடந்துகொண்டிருக்கும் கடமைகளை மதிப்பாய்வு செய்யுங்கள். | Mid-point of the Saturn cycle — review and course-correct any ongoing commitments. |

### `_DEFAULT_REMEDY_TA` — line 253 · 1 strings

| # | line | Tamil | English |
|---|---|---|---|
| 1152 | 253 | சிந்திக்கவும் தயாரிக்கவும் நேரம் எடுங்கள். சனியின் ஆற்றல் பொறுமையுடன் செயல்படுவோரை ஆதரிக்கிறது. | — |

### `_body_html()` — line 282 · 6 strings

| # | line | Tamil | English |
|---|---|---|---|
| 1153 | 293 |  பெயர்ச்சி நாள். | — |
| 1154 | 293 | , உங்கள் ஜாதகத்திற்கு  | — |
| 1155 | 293 | இன்று,  | — |
| 1156 | 296 |  அன்று. | — |
| 1157 | 296 |  நாட்களில் —  | — |
| 1158 | 296 |  பெயர்ச்சி  | — |

---

## Client-side (TypeScript) strings, listed separately

These are not in the Python extract above.

### `packages/shared/src/askAllowance.ts` — the only unreviewed part of a reviewed file

The file passed a native review on 2026-10-12 (A-01 கேட்டுவிட்டீர்கள் over
பயன்படுத்திவிட்டீர்கள், A-02 மணிக்குப் பிறகு, A-09 கேட்கலாம் over கேளுங்கள்). What was added
*after* that pass, as a local choice outside the 2026-09-17 clock ruling, is the
00:00–04:59 wording in `taClock`:

| # | line | Tamil | Case |
|---|---|---|---|
| T1 | 70 | நள்ளிரவு 12:00 | exactly midnight |
| T2 | 71 | அதிகாலை {h}:{mm} | 00:01–05:59 |

The question to settle: the shared `formatClockLabel` buckets call 00:00–04:59
**இரவு**, which makes "நாளை இரவு 2:30" read as tomorrow *night*. `taClock` diverges
on purpose. Confirm the divergence, or make the buckets match.

### `web/components/dashboard-family-charts-hybrid.tsx` — family reading switcher

| # | line | Tamil | English |
|---|---|---|---|
| T3 | 551 | ✓ படிக்கிறது / படி | ✓ Reading / Read |
| T4 | 1102 | மேலோட்டம் | Overview |
| T5 | 1300 | படிக்கிறது · {name} | Reading · {name} |
| T6 | 1453 | D1, D9 & பாவ மேலோட்டம் | D1, D9 & bhava overview |

### Not listed here, still unreviewed

Large client corpora that need their own sheet when you want them:
`web/lib/guide-detail-content.ts` dosham prose and remedies (three of these are
live public SEO pages), `web/lib/nakshatra-display-name.ts` spellings (the gate
checks script, not spelling), the `ta` `FACTOR_LABELS` in `life-area-card.tsx`,
the numerology corpora (dark behind their own `unreviewed` gates), muhurta
(~56 strings), and the propensity signatures (flag OFF).
