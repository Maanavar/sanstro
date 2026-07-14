# Age-Phase & Older Service Strings — Native-Tamil Review

_Vinaadi · C-4 native-Tamil pass · 2026-07-14 · `age_phase_service.py` · 86 lines_

**STATUS: ✅ RESOLVED 2026-07-14.** Native-Tamil review completed in the live
astrologer session (C-3/C-4). Reviewer returned 21 corrections (11 critical —
wrong meaning; 10 significant — machine-translated/stilted) against the 86
extracted lines below. All 21 applied to `app/services/age_phase_service.py`
in the same change, with a golden regression lock
(`tests/test_age_phase_tamil_review.py`, banned-old-wording +
required-new-wording assertions; 42 tests green incl. the existing
`test_age_phase_gender.py`). Highlights: கட்டுப்பாடுகள்(restrictions)→
உறுதிமொழிகள்/முடிவுகள்(commitments/decisions) across 3 sites; குடியேற்றம்
(immigration) → வாழ்க்கை நிலைப்பாடு (life settlement) — the word literally means
colonization, wrong sense entirely; மூங்கில் மவுல் (non-word) → பவளக் கல் (coral
gemstone) for the Mars remedy; தசை (muscle) → தசா (dasha) — a homophone-adjacent
mistranslation that changed the sentence's subject; பிரிவு (parting/separation)
→ பற்றின்மை (detachment) for Ketu; பகுத்தறிவு (rationalist-movement connotation)
→ விவேகம் (discernment) for Rahu. This clears the **last gate** before flipping
`daily_briefing_synth` ON (propensity 40-card review was already done).

This file is kept as the review record; the checkboxes below were superseded
by the reviewer's line-referenced list rather than ticked item-by-item.

(The audit already flagged the Saturn `தொழிலாளர்→சேவை` fix — applied earlier in
this session. This file covers the broader sweep.)

---

## Age-band labels · `get_age_phase_label`

_Short header shown per life stage._

- [ ] **L1**
  - **TA:** மூத்த பருவம்
  - EN: _Elder years_

- [ ] **L2**
  - **TA:** குழந்தை பருவம்
  - EN: _Childhood_

- [ ] **L3**
  - **TA:** இளைமை பருவம்
  - EN: _Youth_

- [ ] **L4**
  - **TA:** இளம் பருவம்
  - EN: _Early adulthood_

- [ ] **L5**
  - **TA:** வளர்ச்சி பருவம்
  - EN: _Building years_

- [ ] **L6**
  - **TA:** நடு வயது பருவம்
  - EN: _Middle years_

- [ ] **L7**
  - **TA:** முதிர்ச்சி பருவம்
  - EN: _Mature years_


## Practical guidance by age band · `get_age_based_practical_guidance`

_Core advice paragraphs, one set per age branch (childhood → elder)._

- [ ] **L8**
  - **TA:** ஆரம்பத்திலேயே ஆரோக்கிய பழக்கங்களையும் கல்வி அடிப்படையையும் உருவாக்கவும்.
  - EN: _Focus on building health routines and educational habits early._

- [ ] **L9**
  - **TA:** குடும்ப சூழல் இந்த பருவத்தை வடிவமைக்கிறது — வீட்டில் நிலையான சூழல் முக்கியம்.
  - EN: _Family environment strongly shapes this phase — stability at home is key._

- [ ] **L10**
  - **TA:** கல்வி மற்றும் திறன் அடிப்படை இப்போது முதன்மை கவனம்.
  - EN: _Education and skill foundation are the primary focus now._

- [ ] **L11**
  - **TA:** இப்போது செய்யும் உடல் ஆரோக்கிய முயற்சிகள் அடுத்த இரண்டு தசாப்தங்களில் பலன் தரும்.
  - EN: _Physical health investments made now pay off across the next two decades._

- [ ] **L12**
  - **TA:** நீண்ட கால கட்டுப்பாடுகளை இப்போது தவிர்க்கவும் — இது ஆராய்ச்சி காலம்.
  - EN: _Avoid making binding long-term commitments — this is an exploratory phase._

- [ ] **L13**
  - **TA:** தொழில் அடிப்படையும் கல்வி முடிப்பும் மையக் கவனம்.
  - EN: _Career foundation and educational completion are the central priority._

- [ ] **L14**
  - **TA:** நீண்ட கால உறவுகளை கவனமாக மதிப்பிடவும் — அவசர கட்டுப்பாடுகளை தவிர்க்கவும்.
  - EN: _Evaluate long-term relationship possibilities carefully — avoid rushed commitments._

- [ ] **L15**
  - **TA:** இப்போதே நிதி பழக்கங்களை உருவாக்கவும்: சிறிய, தொடர்ந்த சேமிப்பு வளரும்.
  - EN: _Build financial habits now: small, consistent savings compound over a career._

- [ ] **L16**
  - **TA:** இது தொழில் தொடக்கத்திற்கான முக்கியமான காலம் — திறன் மேம்பாடு மற்றும் புலப்படுவதை முன்னுரிமை கொடுங்கள்.
  - EN: _This is the critical phase for career launch — prioritise skill development and visibility._

- [ ] **L17**
  - **TA:** திருமண வாய்ப்புகளை பகிர்ந்த மதிப்புகள் மற்றும் வாழ்க்கை இலக்குகள் உட்பட முழுமையாக மதிப்பிடவும்.
  - EN: _Marriage prospects should be evaluated holistically including shared values and life goals._

- [ ] **L18**
  - **TA:** திட்டமிட்ட நிதி திட்டமிடலை தொடங்கவும்; இந்த காலத்தில் ஊகமான முதலீடுகளை தவிர்க்கவும்.
  - EN: _Begin systematic financial planning; avoid speculative investments in this phase._

- [ ] **L19**
  - **TA:** தொழில் வளர்ச்சியும் குடும்ப நிலைத்தன்மையும் இரட்டை முன்னுரிமைகள் — இரண்டையும் வேண்டுமென சமப்படுத்தவும்.
  - EN: _Career growth and family stability are the twin priorities — balance both deliberately._

- [ ] **L20**
  - **TA:** சொத்து முதலீட்டு முடிவுகளை நீண்ட கால நிலைத்தன்மையை கருத்தில் கொண்டு எடுக்கவும்.
  - EN: _Property investment decisions should be made with long-term stability in mind._

- [ ] **L21**
  - **TA:** குழந்தைகளின் ஆரோக்கியம் மற்றும் கல்வி அடிப்படை இப்போது செயலில் உள்ள பொறுப்பு.
  - EN: _Children's health and educational foundation are an active responsibility now._

- [ ] **L22**
  - **TA:** தற்போதைய மகாதசை வலுவாக ஆதரிக்காத வரை பெரிய தொழில் அபாயங்களை தவிர்க்கவும்.
  - EN: _Avoid major career risks unless the current Mahadasha strongly supports it._

- [ ] **L23**
  - **TA:** உச்ச தொழில் காலம் — இப்போது மூலோபாய முடிவுகள் நீண்ட கால தொழில் மரபை தீர்மானிக்கின்றன.
  - EN: _Peak career phase — strategic decisions now define long-term professional legacy._

- [ ] **L24**
  - **TA:** இந்த காலத்தில் ஊக வளர்ச்சியை விட செல்வம் ஒருங்கிணைப்பு அதிக முக்கியம்.
  - EN: _Wealth consolidation is more important than aggressive growth in this phase._

- [ ] **L25**
  - **TA:** குழந்தைகளின் உயர்கல்வியும் குடியேற்றமும் செயலில் உள்ள முன்னுரிமை.
  - EN: _Children's higher education and settlement is an active priority._

- [ ] **L26**
  - **TA:** தடுப்பு உடல்நல பரிசோதனைகள் அவசியமாகின்றன — அவற்றை தள்ளி வைக்காதீர்கள்.
  - EN: _Preventive health checks become essential — do not defer them._

- [ ] **L27**
  - **TA:** திரட்டப்பட்ட செல்வத்தை பாதுகாப்பது மற்றும் ஒழுங்கமைப்பது மையமான நிதி பணி.
  - EN: _Protecting and organising accumulated wealth is the central financial task._

- [ ] **L28**
  - **TA:** ஆரோக்கியத்திற்கு முன்னோக்கிய கவனம் தேவை — வழக்கமான பரிசோதனைகளும் வாழ்க்கை முறை ஒழுக்கமும்.
  - EN: _Health requires proactive attention — regular checkups and lifestyle discipline._

- [ ] **L29**
  - **TA:** ஆன்மீக மற்றும் தர்ம நடைமுறைகள் இயற்கையாகவே ஆழமடைகின்றன — அவற்றில் முதலீடு செய்ய இது நல்ல நேரம்.
  - EN: _Spiritual and dharmic practices deepen naturally — this is a good time to invest in them._

- [ ] **L30**
  - **TA:** குழந்தைகளின் வாழ்க்கை மாற்றங்களை (திருமணம், தொழில்) ஆதரிப்பது செயலில் உள்ள கவனம்.
  - EN: _Supporting children's life transitions (marriage, career) is an active focus._

- [ ] **L31**
  - **TA:** ஆரோக்கிய பாதுகாப்பும் தினசரி வழக்கமான நிலைத்தன்மையும் முதன்மை கவனம்.
  - EN: _Health preservation and daily routine stability are the primary focus._

- [ ] **L32**
  - **TA:** ஆன்மீக நடைமுறையும் குடும்ப மரபுடன் தொடர்பும் இப்போது ஆழமான திருப்தியை தருகின்றன.
  - EN: _Spiritual practice and connection with family legacy are deeply fulfilling now._

- [ ] **L33**
  - **TA:** நிதி மேலாண்மை பொறுப்புகளை அடுத்த தலைமுறைக்கு ஒப்படைப்பது புத்திசாலித்தனம்.
  - EN: _Delegating financial management responsibilities to the next generation is wise._

- [ ] **L34**
  - **TA:** சமூக தொடர்பு மற்றும் நோக்கத்தை பராமரிப்பது தனிமைப்படுத்தலை தடுக்கிறது மற்றும் நலன்புரிவை ஆதரிக்கிறது.
  - EN: _Maintaining social connection and purpose prevents isolation and supports wellbeing._


## Mahadasha overlay (per planet) · `_add_dasha_guidance`

_Added when that planet runs the Mahadasha._

- [ ] **L35**
  - **TA:** சூரிய மகாதசை அதிகாரம், அரசு விவகாரங்கள் மற்றும் பொது அங்கீகாரத்திற்கு சாதகம்.
  - EN: _Sun Mahadasha favours authority, government dealings, and public recognition._

- [ ] **L36**
  - **TA:** சந்திர மகாதசை உணர்வு உணர்திறனை கொண்டுவருகிறது — பயணம், திரவங்கள் மற்றும் தாய்வழி தொடர்புகள் முன்னிலைப்படுத்தப்படுகின்றன.
  - EN: _Moon Mahadasha brings emotional sensitivity — travel, liquids, and maternal connections are highlighted._

- [ ] **L37**
  - **TA:** செவ்வாய் மகாதசை செயல், தைரியம் மற்றும் சொத்து/நில விவகாரங்களை ஊக்குவிக்கிறது — சக்தியை ஆக்கப்பூர்வமாக வழிப்படுத்தவும்.
  - EN: _Mars Mahadasha drives action, courage, and property/land matters — channel the energy constructively._

- [ ] **L38**
  - **TA:** புத மகாதசை தொடர்பு, வணிகம், கல்வி மற்றும் அறிவுசார் நடவடிக்கைகளை ஆதரிக்கிறது.
  - EN: _Mercury Mahadasha supports communication, business, education, and intellectual pursuits._

- [ ] **L39**
  - **TA:** குரு மகாதசை பொதுவாக விரிவடையும் — ஞானம், கற்பித்தல், குழந்தைகள் மற்றும் தர்ம செயல்பாடு ஆதரிக்கப்படுகின்றன.
  - EN: _Jupiter Mahadasha is generally expansive — wisdom, teaching, children, and dharmic activity are supported._

- [ ] **L40**
  - **TA:** சுக்கிர மகாதசை உறவுகள், ஆடம்பரம், கலை மற்றும் பொருள் ஆறுதல்களுக்கு சாதகம்.
  - EN: _Venus Mahadasha favours relationships, luxury, arts, and material comforts._

- [ ] **L41**
  - **TA:** சனி மகாதசை ஒழுக்கம், பொறுமை மற்றும் நீண்ட கால திட்டமிட்ட முயற்சியை கோருகிறது — குறுக்குவழிகள் தவறுகின்றன.
  - EN: _Saturn Mahadasha demands discipline, patience, and long-term structured effort — shortcuts backfire._

- [ ] **L42**
  - **TA:** ராகு மகாதசை ஆர்வமிக்க இயக்கங்களையும் வழக்கத்திற்கு மாறான பாதைகளையும் கொண்டுவருகிறது — கவனம் மற்றும் நுண்ணறிவு முக்கியம்.
  - EN: _Rahu Mahadasha brings ambitious drives and unconventional paths — focus and discernment are crucial._

- [ ] **L43**
  - **TA:** கேது மகாதசை பிரிவு, ஆன்மீக நுண்ணறிவு மற்றும் கடந்த கால கர்மத்தின் நிறைவை வளர்க்கிறது.
  - EN: _Ketu Mahadasha fosters detachment, spiritual insight, and completion of past karma._


## Gender-conditioned overlay · `_add_gender_guidance`

_Added for the two bands where tradition weights ordering by gender._

- [ ] **L44**
  - **TA:** இந்த பருவத்தில் திருமண காலம் தொடர்பான கேள்விகள் முதன்மையாகும் — சுக்கிரன் மற்றும் 7ஆம் இடத்தை தொழில் திட்டங்களுடன் சேர்த்தே மதிப்பிடவும், தொழிலுக்கு பதிலாக அல்ல.
  - EN: _Marriage-timing questions typically weigh heaviest in this phase — evaluate Venus and the 7th house alongside career plans, not instead of them._

- [ ] **L45**
  - **TA:** இப்போது எடுக்கப்படும் தொழில் நிலைநாட்டல் முடிவுகள் பின்னர் சனி ஒழுக்கத்திற்காக சோதிக்கும் அமைப்பை நிர்ணயிக்கின்றன — குறுக்குவழிகளை தேடாமல் நிலையாக கட்டியெழுப்பவும்.
  - EN: _Career-establishment decisions made now set the pattern Saturn later tests for discipline — build steadily rather than chasing shortcuts._

- [ ] **L46**
  - **TA:** இந்த பருவத்தில் தொழில் உச்ச பொறுப்புகளுடன் குழந்தைகளின் கல்வியும் குடியேற்றமும் முன்னுரிமையில் முன்னேறுவது வழக்கம்.
  - EN: _Children's education and settlement often move up in priority alongside career-peak responsibilities during this phase._

- [ ] **L47**
  - **TA:** இது பொதுவாக முதன்மை பொறுப்பாளர் மற்றும் மரபு கட்டியெழுப்பும் பருவமாக கருதப்படுகிறது — செல்வம் மற்றும் சொத்து முடிவுகள் நீண்ட கால முக்கியத்துவம் கொண்டவை.
  - EN: _This is typically framed as the primary provider-and-legacy building phase — wealth and property decisions carry long-term weight._


## Planet-strength overlay · `_add_planet_strength_guidance`

_Added when a planet is notably strong or weak._

- [ ] **L48**
  - **TA:** வலுவான குரு இந்த காலத்தில் ஞானம், வளர்ச்சி மற்றும் நற்பலன்களை ஆதரிக்கிறது.
  - EN: _Strong Jupiter supports wisdom, growth, and benefic outcomes this period._

- [ ] **L49**
  - **TA:** வலுவான சுக்கிரன் உறவு நல்லிணக்கம் மற்றும் பொருள் நலனை அதிகரிக்கிறது.
  - EN: _Strong Venus augments relationship harmony and material wellbeing._

- [ ] **L50**
  - **TA:** பலவீனமான சனி கடமைகள் மற்றும் நீண்ட கால திட்டமிடலில் கூடுதல் ஒழுக்கம் தேவை என்பதை குறிக்கிறது.
  - EN: _Weak Saturn indicates the need for extra discipline in commitments and long-term planning._

- [ ] **L51**
  - **TA:** பலவீனமான செவ்வாய் கண்ணளவிய செயல்பாட்டை கோருகிறது — தன்னிச்சையான முடிவுகள் மற்றும் உடல் அதிக உழைப்பை தவிர்க்கவும்.
  - EN: _Weak Mars calls for measured action — avoid impulsive decisions and physical overexertion._


## Remedies (by age / dasha lord / weak planet) · `get_age_based_remedies`

_Optional remedial suggestions._

- [ ] **L52**
  - **TA:** ஞாயிற்றுக்கிழமைகளில் உதய சூரியனுக்கு அர்க்கியம் செலுத்தவும்.
  - EN: _Offer water (arghya) to the rising Sun on Sundays._

- [ ] **L53**
  - **TA:** திங்கட்கிழமைகளில் விரதம் (உடல்நலம் இடம் தந்தால்) அல்லது சாத்வீக உணவு மற்றும் சிவன்/தேவிக்கு பால் படைத்தல்.
  - EN: _Fasting (only if your health permits) or simple sattvic food on Mondays and offering milk to Shiva/Goddess._

- [ ] **L54**
  - **TA:** செவ்வாய்க்கிழமைகளில் ஆஞ்சநேய பூஜை மற்றும் அஞ்சநேய ஸ்தோத்திரம் செவ்வாயை ஆதரிக்கும்.
  - EN: _Hanuman puja on Tuesdays and reciting Anjaneya stotra supports Mars._

- [ ] **L55**
  - **TA:** புதன்கிழமைகளில் விஷ்ணு சஹஸ்ரநாமம் புதனை ஆதரிக்கும்.
  - EN: _Reciting Vishnu sahasranamam on Wednesdays supports Mercury._

- [ ] **L56**
  - **TA:** வியாழக்கிழமைகளில் குரு பூஜை மற்றும் தேவி பாகவதம் அல்லது குரு ஸ்தோத்திரம் படிக்கவும்.
  - EN: _Guru puja on Thursdays and reading Devi Bhagavatam or Guru stotram._

- [ ] **L57**
  - **TA:** வெள்ளிக்கிழமைகளில் லட்சுமி பூஜை மற்றும் தேவிக்கு வெள்ளை பூக்கள் படைத்தல்.
  - EN: _Lakshmi puja on Fridays and offering white flowers to the Goddess._

- [ ] **L58**
  - **TA:** சனிக்கிழமைகளில் நல்லெண்ணெய் விளக்கு ஏற்றி சனி ஸ்தோத்திரம் சொல்லவும்.
  - EN: _Light sesame-oil lamp on Saturdays and recite Shani stotra for Saturn strength._

- [ ] **L59**
  - **TA:** செவ்வாய்க்கிழமைகளில் துர்கா/காளி பூஜை மற்றும் நீல/கருமையான பூக்கள் படைத்தல் ராகுவை தணிக்கலாம்.
  - EN: _Durga/Kali puja on Tuesdays and offering blue/dark flowers may mitigate Rahu._

- [ ] **L60**
  - **TA:** செவ்வாய்க்கிழமைகளில் கணேஷ் பூஜை மற்றும் கணேஷ் ஸ்தோத்திரம் கேதுவை ஆதரிக்கும்.
  - EN: _Ganesh puja on Tuesdays and reciting Ganesh stotra supports Ketu._

- [ ] **L61**
  - **TA:** ஜாதகத்தில் சூரிய சக்தியை வலுப்படுத்த சூரிய உதயத்தில் நீர் அர்ப்பணிக்கவும்.
  - EN: _Offer water to the Sun at sunrise to strengthen solar energy in the chart._

- [ ] **L62**
  - **TA:** வெள்ளை அல்லது வெள்ளி பொருட்கள், திங்கட்கிழமைகளில் பால் படைத்தல் சந்திரனை ஆதரிக்கும்.
  - EN: _White or silver objects, milk offerings on Mondays support Moon._

- [ ] **L63**
  - **TA:** மூங்கில் மவுல் (சரியான முகூர்த்தத்திற்கு பின் வெள்ளி/தங்கத்தில்) செவ்வாயை வலுப்படுத்தலாம்.
  - EN: _Coral gemstone (in silver/gold, after proper muhurtha) may strengthen Mars._

- [ ] **L64**
  - **TA:** புதன்கிழமைகளில் பச்சை பாசிப்பருப்பு படைத்தல் புதனை ஆதரிக்கும்.
  - EN: _Green moong dal offering on Wednesdays supports Mercury._

- [ ] **L65**
  - **TA:** மஞ்சள் நீலம் அல்லது மஞ்சள் புஷ்பராகம் (ஆலோசனையின் பின்) குருவை ஆதரிக்கும்.
  - EN: _Yellow sapphire or yellow topaz (after consultation) supports Jupiter._

- [ ] **L66**
  - **TA:** வெள்ளை நீலம் அல்லது வைரம் (சரியான ஆலோசனையின் பின்) சுக்கிரனை வலுப்படுத்தும்.
  - EN: _White sapphire or diamond (after proper consultation) strengthens Venus._

- [ ] **L67**
  - **TA:** இரும்பு அல்லது ஈயம் படைத்தல், சனிக்கிழமைகளில் எள்ளு விளக்கு சனியை சமப்படுத்தும்.
  - EN: _Iron or lead offerings, sesame lamps on Saturdays balance Saturn._

- [ ] **L68**
  - **TA:** மங்கலமான நாட்களில் குல தெய்வ கோயிலில் வழிபாடு செய்யவும்.
  - EN: _Offer prayers at the family kula deivam temple on auspicious days._

- [ ] **L69**
  - **TA:** சனிக்கிழமைகளில் நவகிரக பூஜை மற்றும் வெள்ளிக்கிழமைகளில் விளக்கேற்றுவது நிலைத்தன்மையை ஆதரிக்கிறது.
  - EN: _Navagraha puja on Saturdays and lighting a lamp on Fridays supports stability._

- [ ] **L70**
  - **TA:** உங்கள் ஜன்ம நட்சத்திர நாளில் வழக்கமான கோயில் வருகை சரியான தாளத்தை பராமரிக்கிறது.
  - EN: _Regular temple visits on the nakshatra of your birth star maintains alignment._

- [ ] **L71**
  - **TA:** அமாவாசையில் பித்ரு தர்ப்பணம் குடும்ப கர்ம சமநிலையை பராமரிக்கிறது.
  - EN: _Ancestral puja (pitru tharpanam) on Amavasai maintains family karmic balance._


## Current-year guidance · `build_year_guidance`

_Per-dasha-lord year outlook + an age-phase suffix._

- [ ] **L72**
  - **TA:** இந்த ஆண்டு சூரியனின் ஆதிக்கம் அதிகாரம், புலப்பாடு மற்றும் தொழில் அடையாளத்தை முன்னிலைப்படுத்துகிறது. இப்போது எடுக்கப்படும் தொழில் மற்றும் பெருமை தொடர்பான முடிவுகள் தாக்கத்தை கொண்டிருக்கின்றன.
  - EN: _This year the Sun's influence highlights authority, visibility, and professional identity. Decisions about career and reputation made now carry weight._

- [ ] **L73**
  - **TA:** இந்த ஆண்டு சந்திரனின் சக்தி உணர்வு புதுப்பிப்பு, பயணம் மற்றும் தாய்வழி உறவுகளுக்கு சாதகம். மன அமைதியை பராமரிக்கவும் மற்றும் பெரிய குழப்பங்களை தவிர்க்கவும்.
  - EN: _Moon's energy this year favours emotional renewal, travel, and maternal relationships. Maintain mental calm and avoid major upheavals._

- [ ] **L74**
  - **TA:** செவ்வாய் இந்த ஆண்டு செயல் மற்றும் முன்முயற்சியை ஊக்குவிக்கிறது — புதிய முயற்சிகள், சொத்து முடிவுகள் மற்றும் உடல் ஆரோக்கிய இலக்குகளுக்கு சிறந்தது. ஆக்கிரமிப்பு இல்லாமல் சக்தியை வழிப்படுத்தவும்.
  - EN: _Mars drives action and initiative this year — ideal for new ventures, property decisions, and physical health goals. Channel energy without aggression._

- [ ] **L75**
  - **TA:** புத ஆண்டு தொடர்பு, வணிக ஒப்பந்தங்கள், எழுத்து மற்றும் அறிவுசார் வேலைக்கு சாதகம். ஒப்பந்தங்களில் தெளிவை கூர்மைப்படுத்தவும் மற்றும் வாய்மொழி தவறான புரிதல்களை தவிர்க்கவும்.
  - EN: _Mercury year favours communication, business deals, writing, and intellectual work. Sharpen clarity in agreements and avoid verbal misunderstandings._

- [ ] **L76**
  - **TA:** இந்த ஆண்டு குருவின் வரம் கல்வி, ஞானம், தர்ம வேலை மற்றும் குடும்பத்தில் வாய்ப்புகளை விரிவாக்குகிறது. நன்றி மற்றும் தாராள மனதுடன் செயல்படவும்.
  - EN: _Jupiter's benediction this year expands opportunities in education, wisdom, dharmic work, and family. Act with gratitude and generosity._

- [ ] **L77**
  - **TA:** சுக்கிர ஆண்டு உறவு நல்லிணக்கம், படைப்பாற்றல் நடவடிக்கைகள், அழகு மற்றும் பொருள் ஆறுதலை ஆதரிக்கிறது. நிதி அனுபவங்களில் நுண்ணறிவுடன் இருக்கவும்.
  - EN: _Venus year supports relationship harmony, creative pursuits, beauty, and material comfort. Be discerning in financial indulgences._

- [ ] **L78**
  - **TA:** சனி இந்த ஆண்டு ஒழுக்கமான, பொறுமையான, தொடர்ந்த முயற்சியை கோருகிறது. குறுக்குவழிகள் மற்றும் கவலையற்ற முடிவுகள் நீண்ட காலமாக உள்ள சிக்கல்களை உருவாக்கும். கவனமாக உருவாக்கவும்.
  - EN: _Saturn demands disciplined, patient, sustained effort this year. Shortcuts and careless decisions will create long-lasting complications. Build carefully._

- [ ] **L79**
  - **TA:** ராகு ஆண்டு சம அளவில் ஆர்வமும் குழப்பமும் கொண்டுவருகிறது. வழக்கத்திற்கு மாறான வாய்ப்புகள் எழுகின்றன ஆனால் கவனமான பகுத்தறிவு தேவை. உங்கள் நோக்கத்தை துல்லியமாக கவனமாக வைக்கவும்.
  - EN: _Rahu year brings ambition and disruption in equal measure. Unconventional opportunities arise but require careful discrimination. Focus your intent precisely._

- [ ] **L80**
  - **TA:** கேது ஆண்டு ஆன்மீக ஆழம், விட்டுக்கொடுத்தல் மற்றும் நீண்ட காலமாக உள்ள விஷயங்களை முடிப்பதை வளர்க்கிறது. பல புதிய முயற்சிகளை தொடங்குவதை தவிர்க்கவும் — இது நிறைவு ஆண்டு.
  - EN: _Ketu year fosters spiritual depth, letting go, and completion of long-standing matters. Avoid starting many new initiatives — this is a year of completion._

- [ ] **L81**
  - **TA:** இந்த ஆண்டு உங்கள் தற்போதைய வாழ்க்கை நிலையுடன் ஒத்திசைந்த ஒழுக்கமான முயற்சியும் கவனமான திட்டமிடலும் தேவை.
  - EN: _This year calls for steady effort and careful planning aligned with your current life phase._

- [ ] **L82**
  - **TA:**  இந்த வாழ்க்கை நிலையில், கற்றலை முன்னுரிமை கொடுங்கள் மற்றும் திரும்ப முடியாத கடமைகளை தவிர்க்கவும்.
  - EN: _ At this life stage, prioritise learning and avoid locking in irreversible commitments._

- [ ] **L83**
  - **TA:**  இந்த கட்டுமான காலத்தில், தொழில் மற்றும் குடும்ப அடித்தளங்களை ஒருங்கிணைக்க தசை சக்தியை பயன்படுத்தவும்.
  - EN: _ In this building phase, use the dasha energy to consolidate career and family foundations._

- [ ] **L84**
  - **TA:**  இந்த முதிர்ச்சி காலத்தில், அனைத்து முடிவுகளிலும் அளவை விட தரத்தை முன்னுரிமை கொடுங்கள்.
  - EN: _ In this mature phase, prioritise quality over quantity in all decisions._


## Chart-gist summary (template) · `build_chart_gist`

_One-paragraph gist; {…} are runtime values — review only the Tamil wording around them._

- [ ] **L85**
  - **TA:** {lagna_rasi} லக்னம் மற்றும் {moon_rasi} சந்திர ராசியில் (நட்சத்திரம்: {nakshatra}) பிறந்தவர், தற்போது {phase_label['ta']} நிலையில், {mahadasha_ta} மகாதசை — {antardasha_ta} அந்தரதசை நடக்கிறது.
  - EN: _Born with {lagna_rasi} lagna and {moon_rasi} moon rasi (nakshatra: {nakshatra}), currently in the {phase_label['en'].lower()} stage of life, running {mahadasha_en} mahadasha — {antardasha_en} antardasha._


## Executive summary (template) · `build_executive_summary`

_Full summary paragraph; {…} are runtime values._

- [ ] **L86**
  - **TA:** இந்த ஜாதகம் {current_age} வயதான {phase_label['ta']} நிலையில் உள்ள ஒருவருக்கு சொந்தமானது, {lagna_rasi} லக்னம் மற்றும் {moon_rasi} சந்திர ராசியில் (நட்சத்திரம்: {nakshatra}) பிறந்தவர். தற்போது {mahadasha_ta} மகாதசை — {antardasha_ta} அந்தரதசை நடக்கிறது. வலுவான கிரகங்கள்: {strong_str_ta}. ஆதரவு தேவைப்படும் கிரகங்கள்: {weak_str_ta}. நடப்பு யோகங்கள்: {yoga_str_ta}.{dosham_str_ta} வழிகாட்டல் மற்றும் கணிப்புகள் {phase_label['ta']} வாழ்க்கை நிலைக்கு குறிப்பிட்டவை.
  - EN: _This chart belongs to a {phase_label['en'].lower()} person aged {current_age}, born with {lagna_rasi} lagna and {moon_rasi} moon rasi (nakshatra: {nakshatra}). Currently running {mahadasha_en} mahadasha — {antardasha_en} antardasha. Strongest planets: {strong_str_en}. Planets needing support: {weak_str_en}. Active yogas: {yoga_str_en}.{dosham_str_en} Guidance and predictions presented are specific to the {phase_label['en'].lower()} stage of life._

