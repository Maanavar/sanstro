# Condition 3: life-stage words in the dasa prose, per pada (23 Oct 2026)

**For the content reviewer.** Condition 3 of each nakshatra page's release (`OWNER_RULINGS_FSA_2026-10-21.md`
§8.2) asks: is every school / college / marriage / retirement word true for every pada, and if not, does
the sentence say so? This list turns that into a finite read. Tick each box when the sentence is right,
or write the fix beside it.

## How the list was made

`scripts/audit/condition3_life_stage_checklist.mts` reads every sentence of the 27 visual pages' dasa prose
(expect / navigate / focus, English and Tamil, the live source) and finds the four word families:

| Family | English | Tamil |
|---|---|---|
| school | school… | பள்ளி |
| college | college, university | கல்லூரி, பல்கலை… |
| marriage | marriage, married, marry, wedding | திருமண…, விவாக… |
| retirement | retire… | பணி ஓய்வு, ஓய்வு பெற…, ஓய்வூதிய…, ஓய்வுக் காலம் |

For each hit it takes that dasa's age span for the shortest and longest birth balance **in each pada**
(from the engine table, the same numbers the page shows) and asks whether the stage overlaps it.
`P1 all` means the stage falls in this dasa for every birth in pada 1; `part`, for some births;
`none`, for none.

**The stage ages are working assumptions, not doctrine. Correct them if they are wrong:** school 5–17,
college 17–22, marriage 21–35, retirement 58–62.

| Verdict | Meaning | What to do |
|---|---|---|
| **FLAG** | True for some padas only, and the sentence states it for everyone | Make it conditional (for some padas / சில பாதங்களுக்கு), name the padas, or cut it |
| **CHECK**, conditional | True for some padas; the sentence already says "where…", "in the first pada…", "if the balance…" | Confirm the condition names the right padas |
| **CHECK**, whose stage | The sentence names children or grandchildren, so the stage may be theirs, not the native's | Decide whose stage it is; if the children's, judge the native's age when that happens |
| OK | True for every pada | Not listed; counted at the end of each page |

## What this list cannot see

- **Stage words outside the four families**: adolescence, young adulthood, mid-life, first child,
  grandchildren as the native's stage. The packet's wider word list still applies to the rest of the page.
- **Bare ஓய்வு** ("rest") is not counted, because on these pages it almost always means rest. A Tamil
  sentence that uses bare ஓய்வு for retirement is caught only through its English twin.
- **Conditional detection is a word match.** A CHECK says a condition is present, not that it is correct.
- **Sentences are paired by dasa, not one to one.** Where English and Tamil disagree on a verdict, read both.
- Nothing here is about the quality of the Tamil (conditions 1 and 4).

## Summary

| Page | Hits | FLAG | CHECK | OK |
|---|---|---|---|---|
| Anusham | 4 | 0 | 4 | 0 |
| Thiruvathirai | 8 | 0 | 8 | 0 |
| Ayilyam | 4 | 0 | 2 | 2 |
| Aswini | 14 | 0 | 4 | 10 |
| Bharani | 8 | 0 | 8 | 0 |
| Chithirai | 6 | 0 | 0 | 6 |
| Avittam | 10 | 0 | 0 | 10 |
| Hastham | 10 | 2 | 2 | 6 |
| Kettai | 6 | 0 | 4 | 2 |
| Karthigai | 12 | 1 | 2 | 9 |
| Magam | 12 | 0 | 2 | 10 |
| Mirugaseeridam | 14 | 0 | 2 | 12 |
| Moolam | 10 | 2 | 0 | 8 |
| Punarpoosam | 10 | 1 | 5 | 4 |
| Pooradam | 10 | 0 | 10 | 0 |
| Poorattathi | 6 | 0 | 2 | 4 |
| Pooram | 10 | 1 | 9 | 0 |
| Poosam | 8 | 0 | 8 | 0 |
| Revathi | 6 | 0 | 4 | 2 |
| Rohini | 5 | 0 | 1 | 4 |
| Sadayam | 4 | 0 | 4 | 0 |
| Thiruvonam | 13 | 2 | 0 | 11 |
| Swathi | 8 | 0 | 8 | 0 |
| Uthiradam | 11 | 0 | 2 | 9 |
| Uthirattathi | 6 | 2 | 4 | 0 |
| Uthiram | 12 | 0 | 2 | 10 |
| Visakam | 10 | 0 | 6 | 4 |
| **Total** | **237** | **11** | **103** | **123** |

## By page (alphabetical by URL slug)

### Anusham (`anuradha`)

- [ ] **CHECK** · SATURN dasa · EN expect · school · P1 all, P2 all, P3 part, P4 none
  may be the stage of the native's children or grandchildren, not the native's: judge whose it is, then the age.
  > Where the balance runs through the school years, the result is a student of unusual depth of friendship — the person who remembers birthdays, who checks on the quiet child, who maintains relationships across years when others lose touch.

- [ ] **CHECK** · SATURN dasa · TA expect · school · P1 all, P2 all, P3 part, P4 none
  may be the stage of the native's children or grandchildren, not the native's: judge whose it is, then the age.
  > இருப்பு பள்ளிக் காலம் முழுவதும் நீளுமானால் அசாதாரண நட்பு ஆழம் கொண்ட மாணவர் உருவாகிறார் — பிறந்தநாள்களை நினைவில் வைப்பவர், அமைதியான குழந்தையை விசாரிப்பவர், மற்றவர்கள் தொடர்பிழக்கும்போதும் ஆண்டுகள் கடந்து உறவுகளைப் பேணுபவர்.

- [ ] **CHECK** · MERCURY dasa · EN expect · marriage · P1 all, P2 all, P3 all, P4 part
  true for some padas; sentence is conditional: confirm it names the right ones.
  > Where marriage falls within this dasa, it is read from the seventh house and its lord, with Venus and Jupiter as the natural significators, and judged from the individual horoscope as a tendency rather than a fixed time.

- [ ] **CHECK** · MERCURY dasa · TA expect · marriage · P1 all, P2 all, P3 all, P4 part
  true for some padas; sentence is conditional: confirm it names the right ones.
  > இந்தத் தசைக்குள் திருமணம் அமைந்தால், அது ஜாதகத்தின் ஏழாம் வீட்டையும் அதன் அதிபதியையும் கொண்டு பார்க்கப்படுகிறது; சுக்கிரனும் குருவும் அதன் இயல்பான காரகர்கள்.

### Thiruvathirai (`ardra`)

- [ ] **CHECK** · RAHU dasa · EN expect · school · P1 all, P2 all, P3 part, P4 none
  true for some padas; sentence is conditional: confirm it names the right ones.
  > Where the balance reaches the school years, Ardra's analytical intelligence begins to distinguish itself — mathematics, science, and language all attract, but the tendency to question rather than accept is already visible.

- [ ] **CHECK** · RAHU dasa · TA expect · school · P1 all, P2 all, P3 part, P4 none
  true for some padas; sentence is conditional: confirm it names the right ones.
  > இருப்பு பள்ளிக் காலத்தை எட்டினால் திருவாதிரையின் பகுப்பாய்வு நுண்ணறிவு கணிதம், அறிவியல், மொழியில் தன்னை வேறுபடுத்திக்கொள்ளத் தொடங்கும்; ஏற்றுக்கொள்வதற்குப் பதிலாகக் கேள்வி கேட்கும் போக்கு ஏற்கனவே தெரியும்.

- [ ] **CHECK** · JUPITER dasa · EN expect · school · P1 part, P2 all, P3 all, P4 all
  true for some padas; sentence is conditional: confirm it names the right ones.
  > For the later padas it begins in childhood and carries Ardra through schooling and higher education into the first working years; for the first pada it begins as school closes, and covers higher education, the launch of a career, and the first stable home.

- [ ] **CHECK** · JUPITER dasa · EN expect · marriage · P1 all, P2 all, P3 part, P4 none
  true for some padas; sentence is conditional: confirm it names the right ones.
  > Where marriage falls within this dasa, it is read from the seventh house and its lord, with Venus and Jupiter as the natural significators, and judged from the individual horoscope as a tendency rather than a fixed time.

- [ ] **CHECK** · JUPITER dasa · TA expect · school · P1 part, P2 all, P3 all, P4 all
  may be the stage of the native's children or grandchildren, not the native's: judge whose it is, then the age.
  > பிந்தைய பாதங்களில் இது குழந்தைப் பருவத்தில் தொடங்கி பள்ளிக்கல்வி, உயர்கல்வி வழியாக முதல் பணி ஆண்டுகள் வரை செல்கிறது; முதல் பாதத்தில் பள்ளி முடியும் தருணத்தில் தொடங்கி உயர்கல்வி, தொழில் தொடக்கம், முதல் நிலையான வீடு ஆகியவற்றை உள்ளடக்குகிறது.

- [ ] **CHECK** · JUPITER dasa · TA expect · marriage · P1 all, P2 all, P3 part, P4 none
  true for some padas; sentence is conditional: confirm it names the right ones.
  > இந்தத் தசைக்குள் திருமணம் அமைந்தால், அது ஜாதகத்தின் ஏழாம் வீட்டையும் அதன் அதிபதியையும் கொண்டு பார்க்கப்படுகிறது; சுக்கிரனும் குருவும் அதன் இயல்பான காரகர்கள்.

- [ ] **CHECK** · SATURN dasa · EN expect · school · P1 none, P2 none, P3 none, P4 part
  may be the stage of the native's children or grandchildren, not the native's: judge whose it is, then the age.
  > Family life stabilises fully; children enter school and adolescence.

- [ ] **CHECK** · SATURN dasa · TA expect · school · P1 none, P2 none, P3 none, P4 part
  may be the stage of the native's children or grandchildren, not the native's: judge whose it is, then the age.
  > குடும்ப வாழ்க்கை முழுமையாக நிலைபெறுகிறது; குழந்தைகள் பள்ளி, வளரிளம் பருவத்தில் நுழைகிறார்கள்.

### Ayilyam (`ashlesha`)

- [ ] **CHECK** · MERCURY dasa · EN expect · school · P1 all, P2 all, P3 part, P4 none
  true for some padas; sentence is conditional: confirm it names the right ones.
  > Where the balance runs through the school years, this develops into a formidable intellectual range.

- [ ] **CHECK** · MERCURY dasa · TA expect · school · P1 all, P2 all, P3 part, P4 none
  true for some padas; sentence is conditional: confirm it names the right ones.
  > இருப்பு பள்ளிக் காலம் முழுவதும் நீளுமானால் இது வலிமையான அறிவுப் பரப்பாக வளர்கிறது.

OK, not listed: VENUS EN marriage; VENUS TA marriage.

### Aswini (`ashwini`)

- [ ] **CHECK** · KETU dasa · EN expect · school · P1 all, P2 part, P3 none, P4 none
  may be the stage of the native's children or grandchildren, not the native's: judge whose it is, then the age.
  > Where the opening balance is long enough to reach school entry, learning starts slowly — not from lack of ability, but because Ketu's children learn through inner absorption, not repetition.

- [ ] **CHECK** · KETU dasa · TA expect · school · P1 all, P2 part, P3 none, P4 none
  may be the stage of the native's children or grandchildren, not the native's: judge whose it is, then the age.
  > பிறக்கும்போது தசா இருப்பு நீண்டதாக இருந்து பள்ளிப் படிப்பின் தொடக்கம் வரை நீடித்தால், படிப்பு மெதுவாகத் தொடங்கும் — திறமை குறைவால் அல்ல, கேதுவின் பிள்ளைகள் உள் ஞானத்தால் கற்பதால்.

- [ ] **CHECK** · VENUS dasa · EN expect · marriage · P1 all, P2 all, P3 all, P4 part
  true for some padas; sentence is conditional: confirm it names the right ones.
  > Where marriage falls within this dasa, it is read from the seventh house and its lord, with Venus and Jupiter as the natural significators, and judged from the individual horoscope as a tendency rather than a fixed time.

- [ ] **CHECK** · VENUS dasa · TA expect · marriage · P1 all, P2 all, P3 all, P4 part
  true for some padas; sentence is conditional: confirm it names the right ones.
  > இந்தத் தசைக்குள் திருமணம் அமைந்தால், அது ஜாதகத்தின் ஏழாம் வீட்டையும் அதன் அதிபதியையும் கொண்டு பார்க்கப்படுகிறது; சுக்கிரனும் குருவும் அதன் இயல்பான காரகர்கள்.

OK, not listed: VENUS EN school; VENUS EN college; VENUS EN school; VENUS EN college; VENUS EN school; VENUS TA school; VENUS TA college; VENUS TA school; VENUS TA college; VENUS TA school.

### Bharani (`bharani`)

- [ ] **CHECK** · VENUS dasa · EN expect · school · P1 all, P2 all, P3 part, P4 none
  may be the stage of the native's children or grandchildren, not the native's: judge whose it is, then the age.
  > Where the balance reaches the school years, creative gifts emerge early — arts, dance, literature, or dramatic performance surface naturally — and the social circle is warm and wide, because Bharani children draw people effortlessly.

- [ ] **CHECK** · VENUS dasa · TA expect · school · P1 all, P2 all, P3 part, P4 none
  may be the stage of the native's children or grandchildren, not the native's: judge whose it is, then the age.
  > இருப்பு பள்ளிக் காலத்தை எட்டும்போது கலை, நடனம், இலக்கியம் அல்லது நாடகத்தில் திறமை இயல்பாக வெளிப்படும்; பரணிக் குழந்தைகள் மக்களை எளிதில் ஈர்ப்பதால் நட்பு வட்டமும் அரவணைப்பாகவும் அகலமாகவும் இருக்கும்.

- [ ] **CHECK** · SUN dasa · EN expect · school · P1 part, P2 all, P3 all, P4 all
  may be the stage of the native's children or grandchildren, not the native's: judge whose it is, then the age.
  > For the later padas, where Venus's balance is short, it begins in childhood and runs through the school years: a child who stands out for confidence, takes the lead among peers, and has an early, charged relationship with authority — father, teacher, institution.

- [ ] **CHECK** · SUN dasa · EN expect · school · P1 part, P2 all, P3 all, P4 all
  true for some padas; sentence is conditional: confirm it names the right ones.
  > For the first pada, where Venus's balance is longest, it comes as school gives way to adulthood: education completing or turning into professional identity, a first job of consequence, a mentor figure in authority, institutional recognition.

- [ ] **CHECK** · SUN dasa · TA expect · school · P1 part, P2 all, P3 all, P4 all
  may be the stage of the native's children or grandchildren, not the native's: judge whose it is, then the age.
  > சுக்கிர இருப்பு குறைவான பிந்தைய பாதங்களில் இது குழந்தைப் பருவத்தில் தொடங்கி பள்ளிக் காலம் முழுவதும் நீடிக்கும்: நம்பிக்கையால் தனித்து நிற்கும், தோழர்களிடையே முன்னிற்கும், அதிகாரத்துடன் — தந்தை, ஆசிரியர், நிறுவனம் — ஆரம்பத்திலேயே உணர்வுப்பூர்வமான உறவு கொள்ளும் குழந்தை.

- [ ] **CHECK** · SUN dasa · TA expect · school · P1 part, P2 all, P3 all, P4 all
  true for some padas; sentence is conditional: confirm it names the right ones.
  > சுக்கிர இருப்பு மிக நீண்ட முதல் பாதத்தில், பள்ளி வாழ்க்கை வயது வந்த வாழ்க்கையாக மாறும் தருணத்தில் இது வருகிறது: கல்வி முடிவடைவது அல்லது தொழில் அடையாளமாக மாறுவது, ஒரு முக்கியமான முதல் வேலை, அதிகாரத்தில் ஒரு வழிகாட்டி, நிறுவன அங்கீகாரம்.

- [ ] **CHECK** · MOON dasa · EN expect · marriage · P1 all, P2 all, P3 part, P4 none
  true for some padas; sentence is conditional: confirm it names the right ones.
  > Where marriage falls within this dasa, it is read from the seventh house and its lord, with Venus and Jupiter as the natural significators, and judged from the individual horoscope as a tendency rather than a fixed time.

- [ ] **CHECK** · MOON dasa · TA expect · marriage · P1 all, P2 all, P3 part, P4 none
  true for some padas; sentence is conditional: confirm it names the right ones.
  > இந்தத் தசைக்குள் திருமணம் அமைந்தால், அது ஜாதகத்தின் ஏழாம் வீட்டையும் அதன் அதிபதியையும் கொண்டு பார்க்கப்படுகிறது; சுக்கிரனும் குருவும் அதன் இயல்பான காரகர்கள்.

### Chithirai (`chitra`)

Nothing to review: every hit is true for every pada.

### Avittam (`dhanishtha`)

Nothing to review: every hit is true for every pada.

### Hastham (`hasta`)

- [ ] **CHECK** · MOON dasa · EN expect · school · P1 all, P2 part, P3 none, P4 none
  may be the stage of the native's children or grandchildren, not the native's: judge whose it is, then the age.
  > Where the dasa reaches the school years, Hasta's social ease and natural wit emerge — the child who makes the class laugh while also finishing the task first.

- [ ] **CHECK** · MOON dasa · TA expect · school · P1 all, P2 part, P3 none, P4 none
  may be the stage of the native's children or grandchildren, not the native's: judge whose it is, then the age.
  > தசை பள்ளிக் காலத்தை எட்டினால் ஹஸ்தத்தின் சமூக இலகுத்தன்மையும் இயல்பான நகைச்சுவையும் வெளிப்படுகின்றன — வகுப்பைச் சிரிக்க வைத்தபடியே முதலில் வேலையை முடிக்கும் குழந்தை.

- [ ] **FLAG** · RAHU dasa · EN expect · school · P1 part, P2 all, P3 all, P4 all
  true for some padas only; sentence is unconditional.
  > Rahu dasa is when Hasta's hands meet the world at scale; it carries Hasta from school and adolescence into the first working years of adult life.

- [ ] **FLAG** · RAHU dasa · TA expect · school · P1 part, P2 all, P3 all, P4 all
  true for some padas only; sentence is unconditional.
  > ராகு தசையில்தான் ஹஸ்தத்தின் கைகள் உலகை பெரிய அளவில் சந்திக்கின்றன; பள்ளி, வளரிளம் பருவத்திலிருந்து வயது வந்த வாழ்வின் முதல் பணி ஆண்டுகளுக்கு அழைத்துச் செல்கிறது.

OK, not listed: RAHU EN marriage; RAHU EN marriage; SATURN EN retirement; RAHU TA marriage; RAHU TA marriage; RAHU TA marriage.

### Kettai (`jyeshtha`)

- [ ] **CHECK** · MERCURY dasa · EN expect · school · P1 all, P2 all, P3 part, P4 none
  true for some padas; sentence is conditional: confirm it names the right ones.
  > Where the balance runs through the school years, the result is a student of depth and precision: not necessarily the fastest or the most spontaneous, but consistently the most penetrating.

- [ ] **CHECK** · MERCURY dasa · TA expect · school · P1 all, P2 all, P3 part, P4 none
  true for some padas; sentence is conditional: confirm it names the right ones.
  > இருப்பு பள்ளிக் காலம் முழுவதும் நீண்டால் ஆழமும் துல்லியமும் கொண்ட மாணவர் உருவாகிறார்: வேகமானவர் அல்லது தன்னிச்சையானவர் என்று அவசியமில்லை, ஆனால் தொடர்ந்து மிகவும் ஊடுருவுபவர்.

- [ ] **CHECK** · KETU dasa · EN expect · school · P1 part, P2 all, P3 all, P4 all
  true for some padas; sentence is conditional: confirm it names the right ones.
  > For the first pada it falls at the turn from school to adult life: higher secondary education, the first career steps, and the initial encounters with adult authority — professional, institutional, and familial.

- [ ] **CHECK** · KETU dasa · TA expect · school · P1 part, P2 all, P3 all, P4 all
  true for some padas; sentence is conditional: confirm it names the right ones.
  > முதல் பாதத்தில் இது பள்ளியிலிருந்து வயது வந்த வாழ்வுக்குத் திரும்பும் தருணத்தில் வருகிறது: மேல்நிலைக் கல்வி, முதல் தொழில் அடிகள், வயது வந்தோர் அதிகாரத்துடன் — தொழில்முறை, நிறுவனம், குடும்பம் — முதல் சந்திப்புகள்.

OK, not listed: VENUS EN marriage; VENUS TA marriage.

### Karthigai (`krittika`)

- [ ] **CHECK** · SUN dasa · EN expect · school · P1 part, P2 none, P3 none, P4 none
  may be the stage of the native's children or grandchildren, not the native's: judge whose it is, then the age.
  > Where the balance at birth is long enough to reach school entry, academic life begins easily; Krittika children are sharp and structured learners.

- [ ] **CHECK** · SUN dasa · TA expect · school · P1 part, P2 none, P3 none, P4 none
  may be the stage of the native's children or grandchildren, not the native's: judge whose it is, then the age.
  > பிறக்கும்போது இருப்பு பள்ளி தொடக்கம் வரை நீளுமானால் கல்வி எளிதாகத் தொடங்கும்; கார்த்திகைக் குழந்தைகள் கூர்மையான, கட்டமைப்புடன் கற்பவர்கள்.

- [ ] **FLAG** · MARS dasa · TA expect · college · P1 all, P2 all, P3 all, P4 part
  true for some padas only; sentence is unconditional.
  > கல்லூரி தலைமை, ராணுவ லட்சியம், விளையாட்டுச் சாதனை வலுவாகச் சாதகம்.

OK, not listed: MOON EN school; MOON EN school; RAHU EN marriage; RAHU EN marriage; MOON TA school; MOON TA school; RAHU TA marriage; RAHU TA marriage; RAHU TA marriage.

### Magam (`magha`)

- [ ] **CHECK** · VENUS dasa · EN expect · marriage · P1 all, P2 all, P3 all, P4 part
  true for some padas; sentence is conditional: confirm it names the right ones.
  > Where marriage falls within this dasa, it is read from the seventh house and its lord, with Venus and Jupiter as the natural significators, and judged from the individual horoscope as a tendency rather than a fixed time.

- [ ] **CHECK** · VENUS dasa · TA expect · marriage · P1 all, P2 all, P3 all, P4 part
  true for some padas; sentence is conditional: confirm it names the right ones.
  > இந்தத் தசைக்குள் திருமணம் அமைந்தால், அது ஜாதகத்தின் ஏழாம் வீட்டையும் அதன் அதிபதியையும் கொண்டு பார்க்கப்படுகிறது; சுக்கிரனும் குருவும் அதன் இயல்பான காரகர்கள்.

OK, not listed: VENUS EN school; VENUS EN college; VENUS EN school; VENUS EN school; VENUS EN college; VENUS TA school; VENUS TA college; VENUS TA school; VENUS TA school; VENUS TA college.

### Mirugaseeridam (`mrigashira`)

- [ ] **CHECK** · MARS dasa · EN expect · school · P1 all, P2 part, P3 none, P4 none
  may be the stage of the native's children or grandchildren, not the native's: judge whose it is, then the age.
  > Where the balance at birth is long enough to reach school entry, school comes easily for some Mrigashira children and with resistance for others — this depends heavily on whether the school environment rewards curiosity over conformity.

- [ ] **CHECK** · MARS dasa · TA expect · school · P1 all, P2 part, P3 none, P4 none
  may be the stage of the native's children or grandchildren, not the native's: judge whose it is, then the age.
  > பிறக்கும்போது இருப்பு பள்ளி தொடக்கம் வரை நீளுமானால், பள்ளி சில மிருகசீரிடக் குழந்தைகளுக்கு எளிதாகவும் மற்றவர்களுக்கு எதிர்ப்புடனும் வரும் — இது பள்ளிச் சூழல் ஒத்துப்போகும் தன்மையை விட ஆர்வத்தை மதிக்கிறதா என்பதைப் பொறுத்தது.

OK, not listed: RAHU EN school; RAHU EN school; RAHU EN college; RAHU EN college; RAHU EN school; JUPITER EN marriage; RAHU TA school; RAHU TA school; RAHU TA college; RAHU TA college; RAHU TA school; JUPITER TA marriage.

### Moolam (`mula`)

- [ ] **FLAG** · SUN dasa · EN expect · college · P1 none, P2 none, P3 part, P4 all
  true for some padas only; sentence is unconditional.
  > In the years after university or early career exploration, the philosophical depth and root-level intelligence Mula carries begin to be recognised professionally and socially.

- [ ] **FLAG** · SUN dasa · TA expect · college · P1 none, P2 none, P3 part, P4 all
  true for some padas only; sentence is unconditional.
  > பல்கலைக்கழகத்துக்கும் ஆரம்பத் தொழில் ஆராய்ச்சிக்கும் பிறகான ஆண்டுகளில், மூலம் சுமக்கும் தத்துவ ஆழமும் வேர்-நிலை நுண்ணறிவும் தொழில்முறையிலும் சமூகத்திலும் அங்கீகரிக்கப்படத் தொடங்குகின்றன.

OK, not listed: VENUS EN school; VENUS EN college; VENUS EN school; MOON EN marriage; VENUS TA school; VENUS TA college; VENUS TA school; MOON TA marriage.

### Punarpoosam (`punarvasu`)

- [ ] **CHECK** · JUPITER dasa · EN expect · school · P1 all, P2 all, P3 part, P4 none
  true for some padas; sentence is conditional: confirm it names the right ones.
  > Where the balance runs through the school years, they produce a love of learning that distinguishes itself not through raw competitive drive but through genuine delight in understanding.

- [ ] **FLAG** · JUPITER dasa · EN navigate · school · P1 all, P2 all, P3 part, P4 none
  true for some padas only; sentence is unconditional.
  > The Jupiter–Rahu bhukti, which closes this dasa (the table below gives when it begins and how long it lasts), can introduce the first disruption to the otherwise smooth childhood — a school change, a family transition, or an early philosophical crisis that the young Punarvasu must navigate.

- [ ] **CHECK** · JUPITER dasa · TA expect · school · P1 all, P2 all, P3 part, P4 none
  true for some padas; sentence is conditional: confirm it names the right ones.
  > இருப்பு பள்ளிக் காலத்தை எட்டினால், கற்றலின் மீது ஒரு காதல் உருவாகிறது; அது கடுமையான போட்டி உந்துதலால் அல்ல, புரிந்துகொள்வதில் உண்மையான மகிழ்ச்சியால் தனித்து நிற்கிறது.

- [ ] **CHECK** · JUPITER dasa · TA navigate · school · P1 all, P2 all, P3 part, P4 none
  may be the stage of the native's children or grandchildren, not the native's: judge whose it is, then the age.
  > இந்த தசையை நிறைவு செய்யும் குரு–ராகு புக்தி (எப்போது தொடங்கி எவ்வளவு நீடிக்கும் என்பது கீழே உள்ள புக்தி அட்டவணையில்) மற்றபடி சீரான குழந்தைப் பருவத்தில் முதல் இடையூறைக் கொண்டுவரலாம் — பள்ளி மாற்றம், குடும்ப மாற்றம், அல்லது இளம் புனர்பூசம் கடக்க வேண்டிய ஆரம்பகால தத்துவ நெருக்கடி.

- [ ] **CHECK** · SATURN dasa · EN expect · marriage · P1 all, P2 all, P3 all, P4 part
  true for some padas; sentence is conditional: confirm it names the right ones.
  > Where marriage falls within this dasa, it is read from the seventh house and its lord, with Venus and Jupiter as the natural significators, and judged from the individual horoscope as a tendency rather than a fixed time.

- [ ] **CHECK** · SATURN dasa · TA expect · marriage · P1 all, P2 all, P3 all, P4 part
  true for some padas; sentence is conditional: confirm it names the right ones.
  > இந்தத் தசைக்குள் திருமணம் அமைந்தால், அது ஜாதகத்தின் ஏழாம் வீட்டையும் அதன் அதிபதியையும் கொண்டு பார்க்கப்படுகிறது; சுக்கிரனும் குருவும் அதன் இயல்பான காரகர்கள்.

OK, not listed: SATURN EN school; SATURN EN college; SATURN TA school; SATURN TA college.

### Pooradam (`purva-ashadha`)

- [ ] **CHECK** · VENUS dasa · EN expect · school · P1 all, P2 all, P3 part, P4 none
  true for some padas; sentence is conditional: confirm it names the right ones.
  > Where the balance reaches the school years, they produce a student of genuine breadth — not necessarily the most disciplined but consistently the most inspired, the one who makes others feel that learning is an adventure rather than a requirement.

- [ ] **CHECK** · VENUS dasa · TA expect · school · P1 all, P2 all, P3 part, P4 none
  true for some padas; sentence is conditional: confirm it names the right ones.
  > இருப்பு பள்ளிக் காலத்தை எட்டினால், உண்மையான பரந்த அறிவு கொண்ட மாணவர் உருவாகிறார் — மிகுந்த ஒழுக்கமுள்ளவர் என்று அவசியமில்லை, எனினும் தொடர்ந்து மிகவும் ஊக்கமளிப்பவர்; கற்றல் கட்டாயமல்ல ஒரு சாகசம் என்று பிறருக்கு உணர்த்துபவர்.

- [ ] **CHECK** · SUN dasa · EN expect · school · P1 part, P2 all, P3 all, P4 all
  true for some padas; sentence is conditional: confirm it names the right ones.
  > For the later padas it begins in childhood and runs through the school years, bringing a first concentrated sense of self to Venus's expansive opening.

- [ ] **CHECK** · SUN dasa · EN expect · school · P1 part, P2 all, P3 all, P4 all
  true for some padas; sentence is conditional: confirm it names the right ones.
  > For the first pada, it comes as school gives way to adulthood: university completion, first career steps, and the consolidation of identity are its central dramas.

- [ ] **CHECK** · SUN dasa · EN expect · college · P1 all, P2 part, P3 none, P4 none
  true for some padas; sentence is conditional: confirm it names the right ones.
  > For the first pada, it comes as school gives way to adulthood: university completion, first career steps, and the consolidation of identity are its central dramas.

- [ ] **CHECK** · SUN dasa · TA expect · school · P1 part, P2 all, P3 all, P4 all
  may be the stage of the native's children or grandchildren, not the native's: judge whose it is, then the age.
  > பிந்தைய பாதங்களில் இது குழந்தைப் பருவத்தில் தொடங்கி பள்ளிக் காலம் முழுவதும் நீண்டு, சுக்கிரனின் விரிந்த தொடக்கத்துக்கு தன்னைப் பற்றிய முதல் குவிந்த உணர்வைக் கொண்டுவருகிறது.

- [ ] **CHECK** · SUN dasa · TA expect · school · P1 part, P2 all, P3 all, P4 all
  true for some padas; sentence is conditional: confirm it names the right ones.
  > முதல் பாதத்தில், பள்ளி வாழ்வு வயது வந்த வாழ்வாக மாறும் தருணத்தில் வருகிறது: பல்கலைக்கழகம் முடிவது, முதல் தொழில் அடிகள், அடையாள ஒருங்கிணைப்பு ஆகியவை அதன் மைய நாடகங்கள்.

- [ ] **CHECK** · SUN dasa · TA expect · college · P1 all, P2 part, P3 none, P4 none
  true for some padas; sentence is conditional: confirm it names the right ones.
  > முதல் பாதத்தில், பள்ளி வாழ்வு வயது வந்த வாழ்வாக மாறும் தருணத்தில் வருகிறது: பல்கலைக்கழகம் முடிவது, முதல் தொழில் அடிகள், அடையாள ஒருங்கிணைப்பு ஆகியவை அதன் மைய நாடகங்கள்.

- [ ] **CHECK** · MOON dasa · EN expect · marriage · P1 all, P2 all, P3 part, P4 none
  true for some padas; sentence is conditional: confirm it names the right ones.
  > Where marriage falls within this dasa, it is read from the seventh house and its lord, with Venus and Jupiter as the natural significators, and judged from the individual horoscope as a tendency rather than a fixed time.

- [ ] **CHECK** · MOON dasa · TA expect · marriage · P1 all, P2 all, P3 part, P4 none
  true for some padas; sentence is conditional: confirm it names the right ones.
  > இந்தத் தசைக்குள் திருமணம் அமைந்தால், அது ஜாதகத்தின் ஏழாம் வீட்டையும் அதன் அதிபதியையும் கொண்டு பார்க்கப்படுகிறது; சுக்கிரனும் குருவும் அதன் இயல்பான காரகர்கள்.

### Poorattathi (`purva-bhadra`)

- [ ] **CHECK** · SATURN dasa · EN expect · marriage · P1 all, P2 all, P3 all, P4 part
  true for some padas; sentence is conditional: confirm it names the right ones.
  > Where marriage falls within this dasa, it is read from the seventh house and its lord, with Venus and Jupiter as the natural significators, and judged from the individual horoscope as a tendency rather than a fixed time.

- [ ] **CHECK** · SATURN dasa · TA expect · marriage · P1 all, P2 all, P3 all, P4 part
  true for some padas; sentence is conditional: confirm it names the right ones.
  > இந்தத் தசைக்குள் திருமணம் அமைந்தால், அது ஜாதகத்தின் ஏழாம் வீட்டையும் அதன் அதிபதியையும் கொண்டு பார்க்கப்படுகிறது; சுக்கிரனும் குருவும் அதன் இயல்பான காரகர்கள்.

OK, not listed: SATURN EN school; SATURN EN college; SATURN TA school; SATURN TA college.

### Pooram (`purva-phalguni`)

- [ ] **CHECK** · VENUS dasa · EN expect · school · P1 all, P2 all, P3 part, P4 none
  true for some padas; sentence is conditional: confirm it names the right ones.
  > Where the balance reaches the school years, these gifts develop into recognisable talents: creative subjects attract; performance arts draw; the social world of school is navigated with natural ease.

- [ ] **CHECK** · VENUS dasa · TA expect · school · P1 all, P2 all, P3 part, P4 none
  true for some padas; sentence is conditional: confirm it names the right ones.
  > இருப்பு பள்ளிக் காலத்தை எட்டினால் இந்தக் கொடைகள் அடையாளம் காணத்தக்க திறமைகளாக வளர்கின்றன: படைப்புப் பாடங்கள் ஈர்க்கின்றன, நிகழ்த்துகலைகள் இழுக்கின்றன, பள்ளியின் சமூக உலகம் இயல்பான எளிமையுடன் கடக்கப்படுகிறது.

- [ ] **CHECK** · SUN dasa · EN expect · school · P1 part, P2 all, P3 all, P4 all
  true for some padas; sentence is conditional: confirm it names the right ones.
  > For the later padas it begins in childhood and runs through the school years, bringing an early solar confidence and a love of the stage to Venus's pleasure-rich opening.

- [ ] **CHECK** · SUN dasa · EN expect · school · P1 part, P2 all, P3 all, P4 all
  true for some padas; sentence is conditional: confirm it names the right ones.
  > For the first pada it comes as school gives way to adulthood, and brings the first solar illumination of the creative gifts Venus dasa developed.

- [ ] **CHECK** · SUN dasa · TA expect · school · P1 part, P2 all, P3 all, P4 all
  may be the stage of the native's children or grandchildren, not the native's: judge whose it is, then the age.
  > பிந்தைய பாதங்களில் இது குழந்தைப் பருவத்தில் தொடங்கி பள்ளிக் காலம் முழுவதும் நீண்டு, சுக்கிரனின் இன்பம் நிறைந்த தொடக்கத்துக்கு ஆரம்பகால சூரிய நம்பிக்கையையும் மேடையின் மீதான காதலையும் தருகிறது.

- [ ] **CHECK** · SUN dasa · TA expect · school · P1 part, P2 all, P3 all, P4 all
  true for some padas; sentence is conditional: confirm it names the right ones.
  > முதல் பாதத்தில் பள்ளி வாழ்வு வயது வந்த வாழ்வாக மாறும் தருணத்தில் வருகிறது; சுக்கிர தசை வளர்த்த படைப்புக் கொடைகளின் முதல் சூரிய ஒளிப்படலத்தைக் கொண்டுவருகிறது.

- [ ] **CHECK** · MOON dasa · EN expect · marriage · P1 all, P2 all, P3 part, P4 none
  true for some padas; sentence is conditional: confirm it names the right ones.
  > Where marriage falls within this dasa, it is read from the seventh house and its lord, with Venus and Jupiter as the natural significators, and judged from the individual horoscope as a tendency rather than a fixed time.

- [ ] **CHECK** · MOON dasa · TA expect · marriage · P1 all, P2 all, P3 part, P4 none
  true for some padas; sentence is conditional: confirm it names the right ones.
  > இந்தத் தசைக்குள் திருமணம் அமைந்தால், அது ஜாதகத்தின் ஏழாம் வீட்டையும் அதன் அதிபதியையும் கொண்டு பார்க்கப்படுகிறது; சுக்கிரனும் குருவும் அதன் இயல்பான காரகர்கள்.

- [ ] **CHECK** · MOON dasa · TA expect · marriage · P1 all, P2 all, P3 part, P4 none
  true for some padas; sentence is conditional: confirm it names the right ones.
  > பகாவின் தெய்வம் திருமண மகிழ்ச்சியை ஆள்கிறது; இந்த தசை வயது வந்த வாழ்வில் வருமானால், வாழ்வின் மையமான உறவு இதில் நிறுவப்படலாம் அல்லது ஆழமடையலாம்.

- [ ] **FLAG** · RAHU dasa · TA focus · marriage · P1 none, P2 part, P3 all, P4 all
  true for some padas only; sentence is unconditional.
  > ராகு சன்னதி வழிபாடு, தேங்காய் அர்ப்பணம், வழக்கமான பகா வழிபாடு — பகிரப்பட்ட இன்பம், திருமண மகிழ்ச்சியின் தெய்வம் இந்த நட்சத்திரத்தை ஆள்கிறது; ராகு தசையே பகாவின் முழு ஆசீர்வாதம் கிடைக்கும் காலம்.

### Poosam (`pushya`)

- [ ] **CHECK** · SATURN dasa · EN expect · school · P1 all, P2 all, P3 part, P4 none
  may be the stage of the native's children or grandchildren, not the native's: judge whose it is, then the age.
  > Childhood often involves early responsibility: a household that requires the child's maturity, a family circumstance that cultivates patience before its time, or an environment where spiritual observance is taught as seriously as schoolwork.

- [ ] **CHECK** · SATURN dasa · EN expect · school · P1 all, P2 all, P3 part, P4 none
  true for some padas; sentence is conditional: confirm it names the right ones.
  > Where the balance runs through the school years, they produce a diligent student who may not be the most spontaneous but is consistently reliable, well-liked by teachers, and trusted by peers.

- [ ] **CHECK** · SATURN dasa · TA expect · school · P1 all, P2 all, P3 part, P4 none
  may be the stage of the native's children or grandchildren, not the native's: judge whose it is, then the age.
  > குழந்தைப் பருவம் அடிக்கடி ஆரம்பகாலப் பொறுப்பை உள்ளடக்குகிறது: குழந்தையின் முதிர்ச்சியைக் கோரும் வீடு, காலத்துக்கு முன்பே பொறுமையை வளர்க்கும் குடும்பச் சூழல், அல்லது ஆன்மீக அனுஷ்டானம் பள்ளிப் படிப்பைப் போலவே தீவிரமாகக் கற்பிக்கப்படும் சூழல்.

- [ ] **CHECK** · SATURN dasa · TA expect · school · P1 all, P2 all, P3 part, P4 none
  true for some padas; sentence is conditional: confirm it names the right ones.
  > இருப்பு பள்ளிக் காலம் முழுவதும் நீளுமானால், மிகவும் தன்னிச்சையானவர் இல்லையென்றாலும் தொடர்ந்து நம்பகமான, ஆசிரியர்களால் விரும்பப்படும், சகாக்களால் நம்பப்படும் உழைக்கும் மாணவர் உருவாகிறார்.

- [ ] **CHECK** · MERCURY dasa · EN expect · marriage · P1 all, P2 all, P3 all, P4 part
  true for some padas; sentence is conditional: confirm it names the right ones.
  > Where marriage falls within this dasa, it is read from the seventh house and its lord, with Venus and Jupiter as the natural significators, and judged from the individual horoscope as a tendency rather than a fixed time.

- [ ] **CHECK** · MERCURY dasa · EN expect · school · P1 part, P2 all, P3 all, P4 all
  may be the stage of the native's children or grandchildren, not the native's: judge whose it is, then the age.
  > Community roles and responsibilities beyond the household begin to accumulate — neighbourhood association, temple committee, school parent council.

- [ ] **CHECK** · MERCURY dasa · TA expect · marriage · P1 all, P2 all, P3 all, P4 part
  true for some padas; sentence is conditional: confirm it names the right ones.
  > இந்தத் தசைக்குள் திருமணம் அமைந்தால், அது ஜாதகத்தின் ஏழாம் வீட்டையும் அதன் அதிபதியையும் கொண்டு பார்க்கப்படுகிறது; சுக்கிரனும் குருவும் அதன் இயல்பான காரகர்கள்.

- [ ] **CHECK** · MERCURY dasa · TA expect · school · P1 part, P2 all, P3 all, P4 all
  may be the stage of the native's children or grandchildren, not the native's: judge whose it is, then the age.
  > வீட்டுக்கு அப்பாற்பட்ட சமூகப் பங்குகளும் பொறுப்புகளும் குவியத் தொடங்குகின்றன — தெரு சங்கம், கோவில் குழு, பள்ளிப் பெற்றோர் குழு.

### Revathi (`revati`)

- [ ] **CHECK** · MERCURY dasa · EN expect · school · P1 all, P2 all, P3 part, P4 none
  true for some padas; sentence is conditional: confirm it names the right ones.
  > Where the balance runs through the school years, the result is a student whose intelligence is characteristically inclusive — not the student who excels by outperforming others but the one who ensures that the learning is shared and that no one is left behind.

- [ ] **CHECK** · MERCURY dasa · TA expect · school · P1 all, P2 all, P3 part, P4 none
  true for some padas; sentence is conditional: confirm it names the right ones.
  > இருப்பு பள்ளிக் காலம் முழுவதும் நீளுமானால், அறிவு இயல்பாகவே அனைவரையும் உள்ளடக்கும் மாணவர் உருவாகிறார் — பிறரை விஞ்சுவதால் சிறப்பவர் அல்ல, கற்றல் பகிரப்படுவதையும் யாரும் பின்தங்காததையும் உறுதிசெய்பவர்.

- [ ] **CHECK** · KETU dasa · EN expect · college · P1 all, P2 part, P3 none, P4 none
  true for some padas; sentence is conditional: confirm it names the right ones.
  > For the first pada, university years and the first independent adult experiences run through it; the separation from the family of origin, the first encounters with loss, and the discovery of the limits of what the communicative empathy alone can provide are the formative experiences of Ketu dasa.

- [ ] **CHECK** · KETU dasa · TA expect · college · P1 all, P2 part, P3 none, P4 none
  true for some padas; sentence is conditional: confirm it names the right ones.
  > முதல் பாதத்தில் பல்கலைக்கழக ஆண்டுகளும் முதல் சுதந்திரமான வயது வந்த அனுபவங்களும் இதன் வழியாகச் செல்கின்றன; பிறந்த குடும்பத்திலிருந்து பிரிவு, இழப்புடன் முதல் சந்திப்புகள், தொடர்பு பச்சாதாபம் மட்டும் தர முடியாதவற்றின் எல்லைகளைக் கண்டுபிடித்தல் ஆகியவை கேது தசையின் உருவாக்கும் அனுபவங்கள்.

OK, not listed: VENUS EN marriage; VENUS TA marriage.

### Rohini (`rohini`)

- [ ] **CHECK** · MOON dasa · EN expect · school · P1 all, P2 part, P3 none, P4 none
  true for some padas; sentence is conditional: confirm it names the right ones.
  > Where Moon dasa runs into the school years, academic entry is gentle; Rohini learns by absorption and environment, not by force.

OK, not listed: RAHU EN marriage; RAHU EN marriage; RAHU TA marriage; RAHU TA marriage.

### Sadayam (`shatabhisha`)

- [ ] **CHECK** · RAHU dasa · EN expect · school · P1 all, P2 all, P3 part, P4 none
  may be the stage of the native's children or grandchildren, not the native's: judge whose it is, then the age.
  > Where the balance runs through the school years, the child engages the educational system with a mixture of genuine intellectual brilliance and difficulty with conventional frameworks — the Shatabhisha mind is too wide and too deep for most curricula.

- [ ] **CHECK** · RAHU dasa · TA expect · school · P1 all, P2 all, P3 part, P4 none
  may be the stage of the native's children or grandchildren, not the native's: judge whose it is, then the age.
  > இருப்பு பள்ளிக் காலம் முழுவதும் நீளுமானால், உண்மையான அறிவுப் பிரகாசமும் வழக்கமான சட்டகங்களுடன் சிரமமும் கலந்து குழந்தை கல்வி முறையுடன் ஈடுபடுகிறது — சதய மனம் பெரும்பாலான பாடத்திட்டங்களுக்கு மிக அகலமானது, மிக ஆழமானது.

- [ ] **CHECK** · JUPITER dasa · EN expect · school · P1 part, P2 all, P3 all, P4 all
  true for some padas; sentence is conditional: confirm it names the right ones.
  > For the later padas it begins in childhood and carries through schooling and higher education; for the first pada it begins as school closes and runs on through the first working years.

- [ ] **CHECK** · JUPITER dasa · TA expect · school · P1 part, P2 all, P3 all, P4 all
  may be the stage of the native's children or grandchildren, not the native's: judge whose it is, then the age.
  > பிந்தைய பாதங்களில் இது குழந்தைப் பருவத்தில் தொடங்கி பள்ளி, உயர்கல்வி வழியாகச் செல்கிறது; முதல் பாதத்தில் பள்ளி முடியும் தருணத்தில் தொடங்கி முதல் பணி ஆண்டுகள் வரை நீள்கிறது.

### Thiruvonam (`shravana`)

- [ ] **FLAG** · RAHU dasa · EN expect · school · P1 part, P2 all, P3 all, P4 all
  true for some padas only; sentence is unconditional.
  > Rahu dasa expands Shravana's listening and wisdom-retention capacities into the broadest possible field; it carries Shravana from school and adolescence into the first decades of adult life.

- [ ] **FLAG** · RAHU dasa · TA expect · school · P1 part, P2 all, P3 all, P4 all
  true for some padas only; sentence is unconditional.
  > ராகு தசை திருவோணத்தின் கேட்கும், ஞானம் தக்கவைக்கும் ஆற்றல்களை மிகப் பரந்த சாத்தியமான களத்துக்கு விரிவாக்குகிறது; பள்ளி, வளரிளம் பருவத்திலிருந்து வயது வந்த வாழ்வின் முதல் தசகங்களுக்கு அழைத்துச் செல்கிறது.

OK, not listed: MARS EN school; MARS EN school; RAHU EN college; RAHU EN marriage; RAHU EN marriage; MARS TA school; MARS TA school; RAHU TA college; RAHU TA marriage; RAHU TA marriage; RAHU TA marriage.

### Swathi (`swati`)

- [ ] **CHECK** · RAHU dasa · EN expect · school · P1 all, P2 all, P3 part, P4 none
  may be the stage of the native's children or grandchildren, not the native's: judge whose it is, then the age.
  > Where the balance runs through the school years, they produce a socially intelligent and diplomatically gifted child — the one who mediates playground conflicts, who navigates different social groups with ease, who reads adults' dynamics before the adults themselves notice.

- [ ] **CHECK** · RAHU dasa · TA expect · school · P1 all, P2 all, P3 part, P4 none
  may be the stage of the native's children or grandchildren, not the native's: judge whose it is, then the age.
  > இருப்பு பள்ளிக் காலம் முழுவதும் நீளுமானால், சமூக நுண்ணறிவும் இராஜதந்திரத் திறனும் கொண்ட குழந்தை உருவாகிறது — விளையாட்டுத் திடலின் மோதல்களுக்கு நடுவராகும், வெவ்வேறு சமூகக் குழுக்களை எளிதாகக் கடக்கும், பெரியவர்கள் கவனிக்கும் முன்பே அவர்களின் இயக்கவியலைப் படிக்கும் குழந்தை.

- [ ] **CHECK** · JUPITER dasa · EN expect · school · P1 part, P2 all, P3 all, P4 all
  true for some padas; sentence is conditional: confirm it names the right ones.
  > Jupiter dasa brings the philosophical and ethical grounding that Rahu's expansion lacked; for the later padas it begins in childhood and carries through school and college, for the first pada it begins as school closes and covers the first working years.

- [ ] **CHECK** · JUPITER dasa · EN expect · college · P1 all, P2 all, P3 all, P4 part
  true for some padas; sentence is conditional: confirm it names the right ones.
  > Jupiter dasa brings the philosophical and ethical grounding that Rahu's expansion lacked; for the later padas it begins in childhood and carries through school and college, for the first pada it begins as school closes and covers the first working years.

- [ ] **CHECK** · JUPITER dasa · EN expect · marriage · P1 all, P2 all, P3 part, P4 none
  true for some padas; sentence is conditional: confirm it names the right ones.
  > Where marriage falls within this dasa, it is read from the seventh house and its lord, with Venus and Jupiter as the natural significators, and judged from the individual horoscope as a tendency rather than a fixed time.

- [ ] **CHECK** · JUPITER dasa · TA expect · school · P1 part, P2 all, P3 all, P4 all
  may be the stage of the native's children or grandchildren, not the native's: judge whose it is, then the age.
  > குரு தசை ராகுவின் விரிவாக்கத்தில் இல்லாத தத்துவ, நெறி அடித்தளத்தைக் கொண்டுவருகிறது; பிந்தைய பாதங்களில் குழந்தைப் பருவத்தில் தொடங்கி பள்ளி, கல்லூரி வழியாகச் செல்கிறது; முதல் பாதத்தில் பள்ளி முடியும் தருணத்தில் தொடங்கி முதல் பணி ஆண்டுகளை உள்ளடக்குகிறது.

- [ ] **CHECK** · JUPITER dasa · TA expect · college · P1 all, P2 all, P3 all, P4 part
  may be the stage of the native's children or grandchildren, not the native's: judge whose it is, then the age.
  > குரு தசை ராகுவின் விரிவாக்கத்தில் இல்லாத தத்துவ, நெறி அடித்தளத்தைக் கொண்டுவருகிறது; பிந்தைய பாதங்களில் குழந்தைப் பருவத்தில் தொடங்கி பள்ளி, கல்லூரி வழியாகச் செல்கிறது; முதல் பாதத்தில் பள்ளி முடியும் தருணத்தில் தொடங்கி முதல் பணி ஆண்டுகளை உள்ளடக்குகிறது.

- [ ] **CHECK** · JUPITER dasa · TA expect · marriage · P1 all, P2 all, P3 part, P4 none
  true for some padas; sentence is conditional: confirm it names the right ones.
  > இந்தத் தசைக்குள் திருமணம் அமைந்தால், அது ஜாதகத்தின் ஏழாம் வீட்டையும் அதன் அதிபதியையும் கொண்டு பார்க்கப்படுகிறது; சுக்கிரனும் குருவும் அதன் இயல்பான காரகர்கள்.

### Uthiradam (`uttara-ashadha`)

- [ ] **CHECK** · MARS dasa · EN expect · college · P1 all, P2 all, P3 all, P4 part
  true for some padas; sentence is conditional: confirm it names the right ones.
  > Mars dasa brings the directed fire of competitive action to Uttara Ashadha's purposeful and structured character; it runs from adolescence toward early adulthood, and for the longer balances carries the university years and the first professional steps.

- [ ] **CHECK** · MARS dasa · TA expect · college · P1 all, P2 all, P3 all, P4 part
  true for some padas; sentence is conditional: confirm it names the right ones.
  > செவ்வாய் தசை உத்திராடத்தின் நோக்கமுள்ள, கட்டமைக்கப்பட்ட குணத்துக்கு போட்டிச் செயலின் திசைப்பட்ட நெருப்பைக் கொண்டுவருகிறது; இது வளரிளம் பருவத்திலிருந்து இளம் வயது வந்த காலம் நோக்கிச் செல்கிறது; நீண்ட இருப்பில் பல்கலைக்கழக ஆண்டுகளையும் முதல் தொழில் அடிகளையும் உள்ளடக்குகிறது.

OK, not listed: MOON EN school; MOON EN school; RAHU EN marriage; RAHU EN marriage; MOON TA school; MOON TA school; RAHU TA marriage; RAHU TA marriage; RAHU TA marriage.

### Uthirattathi (`uttara-bhadra`)

- [ ] **CHECK** · SATURN dasa · EN expect · school · P1 all, P2 all, P3 part, P4 none
  true for some padas; sentence is conditional: confirm it names the right ones.
  > Where it runs through childhood and the school years, the formative period is structured by Saturn's long-game governance, and the educational path is typically marked by the depth of engagement rather than the breadth — the Uttara Bhadra student who studies one thing until it is fully understood, rather than moving quickly across many things.

- [ ] **CHECK** · SATURN dasa · TA expect · school · P1 all, P2 all, P3 part, P4 none
  may be the stage of the native's children or grandchildren, not the native's: judge whose it is, then the age.
  > அது குழந்தைப் பருவம், பள்ளிக் காலம் வழியாக நீளுமானால், உருவாக்கும் காலம் சனியின் நீண்டகால ஆட்சியால் கட்டமைக்கப்படுகிறது; கல்விப் பாதை பொதுவாக அகலத்தை விட ஈடுபாட்டின் ஆழத்தால் குறிக்கப்படுகிறது — பலவற்றை விரைவாகக் கடப்பதற்குப் பதிலாக, ஒன்றை முழுமையாகப் புரியும் வரை பயிலும் உத்திரட்டாதி மாணவர்.

- [ ] **FLAG** · MERCURY dasa · EN expect · college · P1 all, P2 all, P3 all, P4 part
  true for some padas only; sentence is unconditional.
  > University education and the first professional steps are taken in Mercury's field; the academic or philosophical career begins to take shape.

- [ ] **FLAG** · MERCURY dasa · TA expect · college · P1 all, P2 all, P3 all, P4 part
  true for some padas only; sentence is unconditional.
  > பல்கலைக்கழகக் கல்வியும் முதல் தொழில் அடிகளும் புதனின் களத்தில் எடுக்கப்படுகின்றன; கல்வி அல்லது தத்துவத் தொழில் வடிவம் பெறத் தொடங்குகிறது.

- [ ] **CHECK** · VENUS dasa · EN expect · marriage · P1 none, P2 part, P3 all, P4 all
  may be the stage of the native's children or grandchildren, not the native's: judge whose it is, then the age.
  > Professional recognition reaches its widest scope; teaching and transmission of the Uttara Bhadra wisdom becomes the primary professional expression; where the dasa runs late, grandchildren may arrive for those who have married.

- [ ] **CHECK** · VENUS dasa · TA expect · marriage · P1 none, P2 part, P3 all, P4 all
  may be the stage of the native's children or grandchildren, not the native's: judge whose it is, then the age.
  > தொழில்முறை அங்கீகாரம் தன் மிக அகன்ற எல்லையை அடைகிறது; உத்திரட்டாதி ஞானத்தைக் கற்பித்தலும் கடத்தலும் முதன்மைத் தொழில் வெளிப்பாடாகிறது; தசை பிற்பகுதிக்கு நீளுமானால், திருமணமானவர்களுக்குப் பேரக்குழந்தைகள் வரலாம்.

### Uthiram (`uttara-phalguni`)

- [ ] **CHECK** · SUN dasa · EN expect · school · P1 part, P2 none, P3 none, P4 none
  may be the stage of the native's children or grandchildren, not the native's: judge whose it is, then the age.
  > The Simha pada child feels the Sun's confidence from the first; the Kanya pada child already shows Mercury's discerning thoughtfulness before school age.

- [ ] **CHECK** · SUN dasa · TA expect · school · P1 part, P2 none, P3 none, P4 none
  may be the stage of the native's children or grandchildren, not the native's: judge whose it is, then the age.
  > சிம்ம பாதக் குழந்தை சூரியனின் நம்பிக்கையை முதலிலிருந்தே உணர்கிறது; கன்னி பாதக் குழந்தை பள்ளி வயதுக்கு முன்பே புதனின் பகுத்தறியும் சிந்தனைத் தன்மையைக் காட்டுகிறது.

OK, not listed: MOON EN school; MOON EN school; RAHU EN marriage; RAHU EN marriage; SATURN EN retirement; MOON TA school; MOON TA school; RAHU TA marriage; RAHU TA marriage; RAHU TA marriage.

### Visakam (`vishakha`)

- [ ] **CHECK** · JUPITER dasa · EN expect · school · P1 all, P2 all, P3 part, P4 none
  true for some padas; sentence is conditional: confirm it names the right ones.
  > Where the balance runs through the school years, they produce the student who has already decided what they want and is using education as the instrument for getting there.

- [ ] **CHECK** · JUPITER dasa · TA expect · school · P1 all, P2 all, P3 part, P4 none
  true for some padas; sentence is conditional: confirm it names the right ones.
  > இருப்பு பள்ளிக் காலம் முழுவதும் நீளுமானால், தாம் எதை விரும்புகிறோம் என்று ஏற்கனவே முடிவு செய்து, கல்வியை அங்கு செல்லும் கருவியாகப் பயன்படுத்தும் மாணவர் உருவாகிறார்.

- [ ] **CHECK** · SATURN dasa · EN expect · marriage · P1 all, P2 all, P3 all, P4 part
  true for some padas; sentence is conditional: confirm it names the right ones.
  > Higher education or professional training; the first career steps; marriage and family formation, where they fall in this dasa; the first significant achievement that validates the direction — all run through Saturn's long span.

- [ ] **CHECK** · SATURN dasa · EN expect · marriage · P1 all, P2 all, P3 all, P4 part
  true for some padas; sentence is conditional: confirm it names the right ones.
  > Where marriage falls within this dasa, it is read from the seventh house and its lord, with Venus and Jupiter as the natural significators, and judged from the individual horoscope as a tendency rather than a fixed time.

- [ ] **CHECK** · SATURN dasa · TA expect · marriage · P1 all, P2 all, P3 all, P4 part
  true for some padas; sentence is conditional: confirm it names the right ones.
  > உயர் கல்வி அல்லது தொழில்முறைப் பயிற்சி; முதல் தொழில் அடிகள்; இந்த தசைக்குள் வருமானால் திருமணமும் குடும்ப அமைவும்; திசையை உறுதிப்படுத்தும் முதல் குறிப்பிடத்தக்க சாதனை — அனைத்தும் சனியின் நீண்ட காலம் வழியாகச் செல்கின்றன.

- [ ] **CHECK** · SATURN dasa · TA expect · marriage · P1 all, P2 all, P3 all, P4 part
  true for some padas; sentence is conditional: confirm it names the right ones.
  > இந்தத் தசைக்குள் திருமணம் அமைந்தால், அது ஜாதகத்தின் ஏழாம் வீட்டையும் அதன் அதிபதியையும் கொண்டு பார்க்கப்படுகிறது; சுக்கிரனும் குருவும் அதன் இயல்பான காரகர்கள்.

OK, not listed: SATURN EN school; SATURN EN college; SATURN TA school; SATURN TA college.
