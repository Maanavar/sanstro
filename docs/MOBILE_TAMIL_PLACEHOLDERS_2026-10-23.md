# Mobile strings that show English in Tamil mode: drafts (23 Oct 2026)

**For the Tamil reviewer, then the developer.** These 30 mobile strings are coded as
`isTamil ? "English" : "English"`, so a Tamil reader sees English. The open items list said 26; a scan
of `mobile/app` found 30 (18 in `today.tsx`). **Nothing here is in the app yet.** The developer applies a
row only after it is ticked or corrected.

**How the drafts were made.** Where the app already shows Tamil for the same English, on web or
elsewhere on mobile, that Tamil is the draft (marked *existing*), so the two apps say the same thing.
Where no Tamil exists, the draft is new (marked **new**) and follows the standing rules: almanac
names, advise rather than instruct (-லாம், not -ங்கள்), and "கவனம் தேவை" in place of "alert".

Kinds: *visible* is on screen; *screen reader* is an `accessibilityLabel`, which counts as rendering
(CLAUDE.md); *placeholder* is the hint inside an empty input.

## Today tab (`mobile/app/(tabs)/today.tsx`)

| ☐ | Line | Kind | English | Draft | Source |
|---|---|---|---|---|---|
| ☐ | 125 | visible | active now | இப்போது நடப்பில் | **new** (web says இப்போது இயங்குகிறது for a planet; this is Chandrashtama) |
| ☐ | 126 | visible | tomorrow | நாளை | existing |
| ☐ | 127 | visible | `${days}` days | `${days}` நாட்களில் | **new**; a countdown ("in N days"), so -இல் |
| ☐ | 146 | visible | Chandrashtama alert | சந்திராஷ்டமம்: கவனம் தேவை | **new**, on the pattern of the dosham badge |
| ☐ | 155 | visible | Move slowly today. | இன்று நிதானமாகச் செயல்படலாம். | **new** |
| ☐ | 170 | visible | Timing caution | நேரம்: கவனம் தேவை | **new** |
| ☐ | 586 | visible | Cosmic alert | இன்று கவனிக்க வேண்டியது | **new**; "cosmic" not carried over |
| ☐ | 764 | visible | Next significant window | அடுத்த முக்கிய நேரம் | **new** |
| ☐ | 783 | visible | Log moment | தருணம் பதிவு | existing, web Today tab |
| ☐ | 790 | visible | Ask Vinaadi | விநாடியிடம் கேட்கலாம் | **new**; see the note below |
| ☐ | 898 | screen reader | Panchangam Details | பஞ்சாங்க விவரம் | existing: the visible heading four lines below says this |
| ☐ | 973 | visible | Done | முடிந்தது | existing, `packages/shared` strings |
| ☐ | 990 | visible | Log a moment | தருணம் பதிவு செய் | existing, mobile Journal |
| ☐ | 991 | visible | What happened? | என்ன நடந்தது? | existing, mobile Journal |
| ☐ | 999 | visible | Which area? | எந்த துறை? | existing, mobile Journal |
| ☐ | 1012 | placeholder | Optional note | விரும்பினால் குறிப்பு | existing, web settings |
| ☐ | 1017 | visible | Save | சேமி | existing, web |
| ☐ | 1102 | visible | Gowri (fallback when the slot has no name) | கௌரி | existing term (கௌரி நல்ல நேரம்) |

## Other screens

| ☐ | File:line | Kind | English | Draft | Source |
|---|---|---|---|---|---|
| ☐ | `(onboarding)/jadhagam-teaser.tsx:185` | screen reader | Moon rasi preview chart, `${rasiNames.en}` highlighted | சந்திர ராசிக் கட்டம், `${rasiNames.ta}` குறிக்கப்பட்டுள்ளது | **new**. The Tamil branch must also take the Tamil rasi name: today it reads `rasiNames.en` in both |
| ☐ | `(tabs)/insights/index.tsx:276` | visible | P0 | keep P0? or முதன்மை | owner's call: a priority code |
| ☐ | `(tabs)/insights/index.tsx:299` | visible | D1 · D9 · D10 | ராசி · நவாம்சம் · தசாம்சம் | **new**; or keep the codes |
| ☐ | `(tabs)/me.tsx:280` | visible | Premium | பிரீமியம் | existing, web pricing |
| ☐ | `(tabs)/me.tsx:333` | visible | Annual Wrapped | வருடாந்திர சுருக்கம் | existing, web i18n (one web component says ஆண்டு சுருக்கம்; pick one) |
| ☐ | `ask-vinaadi.tsx:388` | visible | Premium → | பிரீமியம் → | existing |
| ☐ | `family-vault.tsx:192` | visible | Compatibility Radar | பொருத்த வரைபடம் | **new** |
| ☐ | `goals/index.tsx:127` | visible | About goals | இலக்குகள் பற்றி | **new** |
| ☐ | `jadhagam/[id].tsx:166` | screen reader | Back | பின் | existing, `packages/shared` strings |
| ☐ | `jadhagam/[id].tsx:295` | visible | Birth Time Rectification | பிறந்த நேர திருத்தம் | existing, web i18n |
| ☐ | `premium.tsx:142` | visible | Premium subscription coming soon | பிரீமியம் சந்தா விரைவில் கிடைக்கும் | existing (line 111 of the same file has it with "Premium" in Roman letters; this uses பிரீமியம்) |
| ☐ | `premium.tsx:178` | screen reader | Close premium screen | பிரீமியம் திரையை மூடு | **new** |

## Found on the way (for the reviewer)

- **"Ask Vinaadi" has three Tamil forms on web:** விநாடி கேளு (`web/lib/i18n.ts`), வினாடி கேளுங்கள், and
  கேள் வினாடி (both in `dashboard-ask-vinaadi-widget.tsx`). The draft above, விநாடியிடம் கேட்கலாம், follows
  the openings rule (கேட்கலாம், not கேளுங்கள்). Whatever you choose should replace all four.
- **The brand is spelled two ways.** விநாடி: 105 uses on web, 17 on mobile. வினாடி: 10 on web, 1 on mobile,
  2 in `packages/shared`. If விநாடி is right, the 13 others are a defect.
- **"Back" has four Tamil forms** across the apps (பின், பின்னால், பின் செல், திரும்பு), and **"Done"** has
  two (முடிந்தது, and மூடு, which means "close"). One each would be cleaner.

## After the review (developer)

Apply the ticked rows, then re-run the scan, which should find no `isTamil ? "X" : "X"` left:
`node scripts/audit/mobile_same_branch_tamil.mjs mobile` (it lists any ternary whose two branches are the
same string; today it lists these 30).
