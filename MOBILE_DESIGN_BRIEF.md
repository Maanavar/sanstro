# Vinaadi AI — Mobile App Design Brief
**For:** Claude Design / Figma screen generation
**Version:** 1.0 — 2026-06-18
**Covers:** All three tiers × all phases (A, B, C) — every screen the app will ever have
**Authority:** This doc + `MOBILE_DECISIONS.md` override all other design references.

---

## 0. One-paragraph product brief (read this first)

Vinaadi AI is a **Tamil-first daily astrology companion** built on Thirukanitham —
the precise, computation-based school of Tamil astrology (not guesswork, not generic
sun-sign horoscopes). The app opens every morning to give Tamil users their panchangam,
rasi palan, and eventually their own birth-chart guidance. It is warm, respectful,
culturally authentic, and never fear-mongering. The visual goal: feel like a trusted
elder astrologer in your pocket — calm authority, not a flashy astrology entertainment app.

Target audience: Tamil Nadu residents + Tamil diaspora (Singapore, Malaysia, Sri Lanka,
Gulf, US, UK). Ages 22–55. Both Tamil-literate and English-preferring users.

---

## 1. Brand Identity

### 1.1 Color Palette

| Role | Name | Hex | Usage |
|---|---|---|---|
| Primary | Temple Saffron | `#D4611A` | CTAs, active tab, key highlights |
| Primary Dark | Deep Ochre | `#A8430E` | Pressed states, headers |
| Primary Light | Warm Amber | `#F5A855` | Backgrounds, soft highlights |
| Secondary | Sacred Maroon | `#8B1A3C` | Badges, alert chips, premium accents |
| Gold | Auspicious Gold | `#C9971C` | Score rings, premium tier, "good day" markers |
| Background | Parchment | `#FAF7F2` | App background — warm off-white, never pure white |
| Surface | Warm White | `#FFFFFF` | Cards, sheets, bottom nav |
| Surface Alt | Warm Mist | `#F5F0EA` | Secondary cards, input fields |
| Text Primary | Deep Warm Black | `#1C1008` | Body text, headings |
| Text Secondary | Warm Taupe | `#6B5744` | Labels, captions, secondary info |
| Text Tertiary | Muted Sand | `#A89080` | Placeholders, disabled |
| Auspicious Green | Temple Leaf | `#2D7A3A` | Good time markers, success states |
| Caution Amber | Rahu Warning | `#C0600A` | Rahu kalam, caution windows |
| Caution Red | Alert | `#B91C3C` | Chandrashtama, hard avoid states |
| Sky Blue | Planetary | `#1A5EA8` | Planet name chips, nakshatra markers |
| Divider | Warm Divider | `#E8DDD0` | List separators, card borders |

**Dark mode:** use deep warm navy `#0F1520` as background, `#1E2A3A` as surface. Keep
saffron primary unchanged — it pops beautifully on dark.

### 1.2 Typography

| Use | Font | Weight | Size (sp) |
|---|---|---|---|
| Tamil display / key auspicious content | Noto Sans Tamil | 700 Bold | 22–28 |
| Tamil body | Noto Sans Tamil | 400 Regular | 15–17 |
| Tamil caption | Noto Sans Tamil | 400 Regular | 12–13 |
| English heading / CTA | Inter | 700 Bold | 18–24 |
| English body | Inter | 400 Regular | 15–16 |
| English caption | Inter | 400 Regular | 12–13 |
| Score / number display | Inter | 800 ExtraBold | 32–48 |
| Time display (nalla neram etc.) | Inter | 600 SemiBold | 16–20 |

**Rule:** every string that exists in Tamil MUST show Tamil text by default. English is the
fallback, not the default. Tamil script must be visually prominent — never smaller than the
English equivalent on the same screen.

### 1.3 Shape & Spacing

- **Corner radius:** Cards = 16px. Buttons = 12px. Chips = 20px (pill). Bottom sheet = 20px top corners.
- **Card elevation:** Soft shadow — `0px 2px 12px rgba(28,16,8,0.08)`. Never harsh drop shadows.
- **Spacing unit:** 4px base. Common: 8, 12, 16, 20, 24, 32.
- **Screen horizontal padding:** 16px on all content screens.
- **Bottom nav height:** 60px + safe area.

### 1.4 Iconography

- Style: **outlined with 2px stroke**, slightly rounded line caps. NOT filled, not flat.
- Culture icons: kolam dot-grid motif for loading states; lotus for premium; Om symbol used
  sparingly and respectfully (never decorative filler).
- Astrological symbols: use Tamil astrological notation for planets and rasis where possible;
  fall back to Western glyphs only if Tamil variant unavailable.
- AI badge: a small stylised "V" monogram for Vinaadi AI suggestions — subtle, not dominant.

### 1.5 Decorative Language

- **Kolam micro-patterns:** Use a minimal single-colour kolam dot-grid as a subtle
  background texture on hero cards and splash. Opacity 4–6% over saffron or maroon — barely
  visible, culturally resonant.
- **Lotus divider:** a single-line stylised lotus motif as section dividers on key screens
  (Today, Premium upgrade). Used at most once per screen.
- **NO:** aggressive gradients, neon colours, Western zodiac imagery (Scorpio scorpion etc.),
  or anything resembling a generic pan-Indian horoscope app.

---

## 2. Navigation Architecture

```
Bottom Tab Bar (4 tabs):
┌──────────┬─────────────┬──────────┬───────────┐
│  இன்று   │  பஞ்சாங்கம் │  கருவிகள் │   நான்  │
│  Today   │  Panchangam │   Tools  │    Me    │
└──────────┴─────────────┴──────────┴───────────┘
```

- Active tab: saffron icon + saffron label, saffron underline indicator dot.
- Inactive tab: warm taupe icon + warm taupe label.
- Tab bar background: warm white `#FFFFFF` with top border `#E8DDD0`.
- No badge count on tabs except "Me" for unread notification inbox (registered users).

**Top area per screen:** no global top nav bar. Each screen has its own contextual header
(max height 56px) with title in Tamil (bold) + English (regular, smaller) below it, and
optional right-side action icon.

---

## 3. Screen Inventory & Specifications

---

### SCREEN 01 — App Icon & Splash

**App icon:** Deep saffron `#D4611A` background. White stylised "V" monogram in Inter
ExtraBold, with a small gold dot above the V like a bindu/tilak. Clean, memorable,
temple-warm. No photos, no planets, no zodiac wheel.

**Splash screen:** Parchment `#FAF7F2` background. Centered: the Vinaadi "V" logo in
saffron (120×120px). Below: "விநாடி AI" in Noto Sans Tamil Bold, saffron, 22sp.
Below that: "Thirukanitham Precision" in Inter Regular, warm taupe, 13sp.
No animation beyond a gentle fade-in. Target: visible for < 1.5 seconds.

---

### SCREEN 02 — First Open: Location Permission

**When shown:** only on first launch, before rasi picker.
**Layout:** full screen, parchment background.
- Top 40%: illustrated card showing a soft watercolour-style map of Tamil Nadu with a
  location pin in saffron. Kolam dot texture overlay at 5%.
- Heading (Tamil): "உங்கள் இடம் எங்கே?" — Inter/Noto Bold, 22sp, deep warm black.
- Body (Tamil + English): "இன்றைய நல்ல நேரம் உங்கள் நகரில் கணக்கிட அனுமதிக்கவும்."
  / "Allow location to calculate today's nalla neram for your city." — 15sp, warm taupe.
- Primary CTA button: "அனுமதிக்க" / "Allow Location" — full-width, saffron, 52px height.
- Secondary text link: "பின்னர்" / "Enter city manually" — warm taupe, below button.
- **No dark patterns.** The "skip" option must be equally visible.

---

### SCREEN 03 — First Open: Rasi Picker

**When shown:** after location, before Today tab loads for first time.
**Purpose:** single personalisation step that makes every future daily reading feel relevant.
**Layout:**
- Header: "உங்கள் ராசி எது?" / "What is your Rasi?" — Bold, 22sp.
- Sub: "ஒரு முறை தேர்ந்தெடுங்கள். எந்த நேரத்திலும் மாற்றலாம்." / "Pick once. Change anytime." — 13sp taupe.
- Grid: 12 rasi cards in 3×4 grid. Each card (80×88px): rasi symbol (large, 32px),
  Tamil name (bold, 14sp), English name (12sp taupe). Card background: warm white.
  Selected state: saffron border (2px), soft saffron tint background, checkmark.
  Rasis in Tamil order: மேஷம், ரிஷபம், மிதுனம், கடகம், சிம்மம், கன்னி,
  துலாம், விருச்சிகம், தனுசு, மகரம், கும்பம், மீனம்.
- Below grid: "உங்கள் நட்சத்திரம்?" / "Your Nakshatra?" — optional secondary picker
  (collapsed by default, expandable). 27 nakshatras in a scrollable chip row.
- Primary CTA: "தொடரவும்" / "Continue" — enabled only when rasi selected.

---

### SCREEN 04 — Today Tab (Guest)

**This is the most important screen in the entire app. Design it like a morning newspaper
front page — scannable in 10 seconds, beautiful, trustworthy.**

**Layout (scrollable, top to bottom):**

**A. Header strip (56px):**
Left: "விநாடி AI" logo mark (24px). Centre: today's date in Tamil calendar format —
"ஆனி 5, சித்திரபானு" in Tamil (16sp bold) + "18 June 2026" English below (12sp taupe).
Right: city name chip "Chennai ▾" in taupe (tappable to change city).

**B. Today Hero Card (full-width, 200px tall):**
Background: deep saffron gradient `#D4611A → #A8430E` with kolam dot texture at 5%.
Top-left: "இன்று" / "Today" label in white, 13sp.
Centre-left: Rasi name "மேஷம்" in white Noto Tamil Bold, 28sp.
Below: nakshatra + thithi in white, 14sp — "அஸ்வினி · சதுர்த்தி"
Right side: a soft illustrated rasi symbol (watercolour-style, white, 80px).
Bottom strip inside card: auspicious day indicator (if applicable) — gold pill "திருவிழா: ஆடி" or empty.

**C. Nalla Neram & Rahu Kalam strip (horizontal scroll, 2 cards visible):**
Card 1 — நல்ல நேரம்: green chip header. Time range "06:00 – 07:30" in bold 20sp.
"நல்ல நேரம்" in Tamil below, 13sp. Small auspicious sun icon.
Card 2 — ராகு காலம்: caution amber chip header. Time range "09:00 – 10:30" in bold 20sp.
"ராகு காலம்" in Tamil, 13sp. Small caution icon (triangle).
Card 3 — யமகண்டம்: same pattern, caution amber.
Card 4 — குளிகை: same pattern.
Each card: 120×80px, white background, 16px radius, soft shadow.

**D. Rasi Palan Section:**
Section title: "இன்றைய ராசி பலன்" / "Today's Rasi Palan" — 16sp bold, left-aligned.
Full-width card: white, 16px radius.
Inside: rasi name header in saffron (14sp). Palan text in Tamil, 15sp, warm black,
3–4 lines. Below text: 3 small category chips — "தொழில்" (career), "உடல்நலம்" (health),
"பண விஷயம்" (money) — each with a star rating (1–5 saffron dots).
Bottom of card: "மேலும் படிக்க" / "Read full palan →" link in saffron.
**Ad unit (native in-feed):** immediately below rasi palan card. Clearly labelled
"விளம்பரம்" / "Sponsored" in taupe 11sp. Native card style matching the app's card design.

**E. Today's Key Timings (collapsible section):**
"பஞ்சாங்க விவரம்" / "Panchangam Details" — section header with expand icon.
When expanded: 2-column grid of datum cards:
Thithi, Nakshatra, Yogam, Karanam, Sunrise, Sunset — each as a small datum card
(label in Tamil 12sp taupe, value in Tamil 15sp bold warm black).

**F. Festival / Auspicious Day Card (if applicable today):**
Saffron-tinted card. Gold star icon left. Festival name in Tamil bold 16sp.
Short description 13sp taupe. "மேலும் அறிய" link.
If no festival: hide this section entirely (don't show an empty state).

**G. Soft Signup Prompt (contextual, shown after day 3+ of use):**
Card with maroon-tinted background (very light, 8% opacity).
"உங்கள் ஜாதகத்தில் இன்றைய நாள் எப்படி?" / "How does today look for YOUR birth chart?"
Sub: "உங்கள் பிறந்த நேரம் கொடுத்து தனிப்பட்ட வழிகாட்டுதல் பெறுங்கள்."
CTA: "இலவசமாக அறிந்துகொள்" / "Find out free →" in saffron text, no button background.
Dismiss X top-right (small, visible).

**Floating bottom:** daily push reminder chip — "🔔 நாளைக்கும் நினைவூட்டல் வேண்டுமா?"
shown only if push not yet opted in. Tap → permission sheet.

---

### SCREEN 05 — Panchangam Tab: Day View

**Header:** "பஞ்சாங்கம்" / "Panchangam" title. Right: date forward/back arrows.
Below header: day strip — 7 visible days, horizontal scroll, today highlighted in saffron pill.
Each day chip: day name (Tamil abbreviated, 13sp), date number (18sp bold), dot indicator
(green = auspicious, red = avoid, grey = neutral).

**Content (scrollable):**

**A. Date Hero:**
Full-width muted card. Tamil date: "சித்திரபானு வருடம், ஆனி மாதம், 5ஆம் நாள்" in Tamil
bold 16sp. Weekday: "வியாழக்கிழமை" 14sp taupe. Sunrise/sunset: small icons with times.

**B. Primary Timings (grid 2×3):**
Nalla Neram, Rahu Kalam, Yamagandam, Kuligai, Emagandam, Abhijit Muhurta.
Each cell: coloured header chip (green for auspicious, amber for caution), Tamil name,
time range in bold. Grid cards: white, 12px radius, warm shadow.

**C. Panchangam Five Elements:**
Full-width card, white. Title "பஞ்சாங்க அம்சங்கள்" / "Five Elements" 14sp bold.
Horizontal divider. 5 rows:
- திதி (Thithi): name in Tamil + its meaning/nature
- நட்சத்திரம் (Nakshatra): name + pada + deity
- யோகம் (Yogam): name + quality
- கரணம் (Karanam): name
- வாரம் (Vaaram): weekday deity

**D. Planet Positions (horizontal scroll chips):**
"கிரகங்கள்" header. 9 planet chips in a scrollable row.
Each chip: planet Tamil name + rasi it's currently in. Chip background: sky blue tint.

**E. Auspicious/Inauspicious Periods (visual timeline):**
24-hour horizontal bar. Colour-coded segments: green (auspicious), amber (neutral), red
(avoid). Tick marks every 2 hours. Current time indicator line in saffron.

**F. Share button (floating FAB):**
Bottom-right: saffron circle FAB with WhatsApp icon. Tap → share today's panchangam card.

---

### SCREEN 06 — Panchangam Tab: Month Calendar View

**Toggle:** top of Panchangam tab — "நாள்" (Day) | "மாதம்" (Month) toggle, pill style.

**Calendar grid:**
- Tamil month name header: "ஆனி 2026" bold 18sp. Left/right month navigation.
- Weekday headers in Tamil abbreviated: ஞா · தி · செ · பு · வி · வெ · ச
- Each date cell (square): date number (Tamil numeral option + Arabic numeral).
  Below number: 1–2 dot indicators. Green dot = has nalla neram early. Gold star = festival.
  Maroon dot = chandrashtama (for registered users). Red circle = avoid day.
- Today: saffron background. Selected: saffron border.
- Tap date → Day View for that date.

**Below calendar:**
Upcoming festivals list — next 5 festivals as simple rows:
Festival name (Tamil, bold) | Tamil date | English date | coloured category chip
(festival type: விழா, விரதம், மங்களம்).

---

### SCREEN 07 — Tools Tab

**Header:** "கருவிகள்" / "Tools"
**Layout:** scrollable, section-based.

**Section A — Matching & Compatibility:**
2-column card grid.
- Card 1: "பொருத்தம்" / Porutham — icon: two interlocked rings. Saffron accent.
- Card 2: "நட்பு பொருத்தம்" / Friendship Compatibility — icon: two stars. Saffron accent.

**Section B — Auspicious Timing:**
- Card 3: "முகூர்த்தம்" / Muhurta — icon: calendar with star.
- Card 4: "திதி தேர்வு" / Thithi Selector — icon: moon phase.

**Section C — Birth Chart:**
- Card 5: "ஜாதகம் உருவாக்கு" / Generate Jadhagam — icon: 12-house square chart symbol.
  **For guest:** small lock overlay badge on this card. Tapping shows signup gate.
  **For registered:** open, shows chart count chip "இன்று: 2/3 இலவசம்".

**Each tool card:** white background, 16px radius, icon (40px, saffron), Tamil name (15sp bold),
English name (12sp taupe), right arrow. Soft shadow.

**Bottom banner (guest only):**
Muted maroon-tinted strip: "உங்கள் ஜாதகம் 60 வினாடியில் பெறுங்கள் →" / "Get your birth chart in 60 seconds →"
Tapping opens signup gate.

---

### SCREEN 08 — Porutham Tool: Input Screen

**Header:** "திருமண பொருத்தம்" / "Marriage Matching" — back arrow left.
**Sub:** "திருக்கணிதம் முறையில் 10 பொருத்தங்கள் கணக்கீடு" / "10-point match by Thirukanitham"

**Form layout (2 columns: Boy | Girl):**
Column headers: "மாப்பிள்ளை" / "Boy" (left, sky blue chip) | "மணமகள்" / "Girl" (right, maroon chip)

Per column:
- Name field (optional, stored only locally)
- Rasi picker — dropdown, Tamil names listed
- Nakshatra picker — dropdown, 27 options, Tamil names
- Pada picker — 1 / 2 / 3 / 4

Input fields: warm mist background `#F5F0EA`, 12px radius, 48px height, Tamil label above.

**CTA:** Full-width saffron button — "பொருத்தம் கணக்கிட" / "Check Compatibility" 52px.
Below CTA: "இது எப்படி கணக்கிடப்படுகிறது?" / "How is this calculated?" text link → opens
methodology bottom sheet with brief Thirukanitham explanation.

---

### SCREEN 09 — Porutham Tool: Result Screen

**Header:** same as input, with "மீண்டும் சோதிக்க" / "Check again" right action.

**A. Overall Score Hero Card:**
Full-width. Background: score-based gradient — ≥8: saffron; 5–7: amber; <5: maroon-muted.
Centre: score "8 / 10" in white Inter ExtraBold 48sp. Below: "நல்ல பொருத்தம்" / "Good Match"
in white Noto Tamil Bold 18sp. Names shown below: "அர்ஜுன் — பிரியா".

**B. 10-Point Breakdown:**
Scrollable list. Each porutham as a row:
- Porutham Tamil name (bold 15sp) | English name (12sp taupe) | result chip (✓ பொருந்தும் / ✗ பொருந்தாது / ~ நடுத்தரம்) | brief reason (13sp)
Colour coded: green row tint for match, red tint for mismatch, amber for partial.
Porutham names: தினம், கணம், மகேந்திரம், ஸ்த்ரீதீர்க்கம், யோனி, ராசி, ராசியதிபதி, வஸ்யம், ரஜ்ஜு, வேதை

**C. Detailed Report Upsell Card:**
White card, gold border (1px). Gold star icon top-right.
"விரிவான அறிக்கை" / "Detailed Compatibility Report" in bold 16sp.
"- 5-page full analysis | - Remedies for mismatches | - Auspicious wedding dates" — bulleted.
Two options:
Option 1: "விளம்பர வீடியோ பாருங்கள் — இலவசம்" / "Watch a short ad — Free" (rewarded ad)
Option 2: "₹99 — உடனே பெறுங்கள்" / "₹99 — Get instantly" (IAP)

**D. Share button:** "WhatsApp-ல் பகிர்" / "Share on WhatsApp" — white button, saffron border,
WhatsApp green icon left.

---

### SCREEN 10 — Muhurta Lookup: Input Screen

**Header:** "முகூர்த்த நேரம்" / "Auspicious Timing"
**Purpose selector (chip row):** திருமணம் · வீடு · வாகனம் · புதிய தொழில் · குழந்தை பேர் · பயணம்
(Marriage · House · Vehicle · New Business · Baby naming · Travel)
Selected chip: saffron fill, white text.

**Date range selector:**
"தேதி தேர்வு" — from/to date picker (native date picker, warm styled).

**Optional rasi input** (for personalised filter):
"உங்கள் ராசி (விரும்பினால்)" — rasi dropdown.

**CTA:** "முகூர்த்தம் தேடு" / "Find Muhurta" — full-width saffron.

---

### SCREEN 11 — Muhurta Lookup: Result Screen

**Header:** "முகூர்த்த நேரங்கள்" + selected purpose chip.
**Result count:** "5 நல்ல நேரங்கள்" / "5 auspicious times found" — taupe 13sp.

**List of results (cards):**
Each card: white, 16px radius.
Left: date in Tamil bold (20sp) + English below (12sp taupe).
Centre: time range in bold 18sp. Nakshatra + thithi chips below (sky blue, small).
Right: quality score — 3-star or 5-star saffron dots. Best = gold "சிறந்தது" badge.

Tap card → expands inline showing: why this is auspicious (nakshatra quality, yogam,
thithi nature), which planets are favourable. "பகிர்" share icon top-right of expanded card.

---

### SCREEN 12 — More / Me Tab (Guest)

**Header:** "நான்" / "Me"

**Top section — Rasi identity card:**
Full-width saffron-tinted card. Rasi symbol (48px). "உங்கள் ராசி: மேஷம்" Tamil bold 18sp.
Nakshatra if set. "மாற்ற" / "Change" link right.

**Menu list (large tap targets, 56px rows):**
- 🔔 "அறிவிப்புகள்" / Notifications — toggle + time picker
- 🌐 "மொழி" / Language — Tamil / English chip
- 📍 "நகரம்" / City — current city name, tappable
- 🌙 "இரவு பயன்முறை" / Dark Mode — toggle
- 📖 "Thirukanitham பற்றி" / About Thirukanitham — info link
- 🔒 "தனியுரிமை" / Privacy Policy — opens web browser
- 📋 "பயன்பாட்டு விதிகள்" / Terms — opens web browser
- ⭐ "ஆப்-ஐ மதிப்பிடுங்கள்" / Rate the App
- 📤 "பகிருங்கள்" / Share App

**Bottom section — Account CTA (prominent, not aggressive):**
Saffron-bordered card. Icon: person with chart. "உங்கள் ஜாதகம் இலவசமாக உருவாக்குங்கள்"
/ "Create your birth chart — free". Sub: "தனிப்பட்ட வழிகாட்டுதல் பெறுங்கள்." 
Button: "கணக்கு உருவாக்கு" / "Create Account" — saffron full-width.

---

### SCREEN 13 — Jadhagam Signup Gate

**Triggered when:** guest taps "Generate Jadhagam" in Tools tab.
**Presentation:** bottom sheet (slides up, 70% screen height). Not a full-screen interrupt.

**Inside the sheet:**
Top: small handle bar (draggable).
Illustration: stylised 12-house jadhagam square chart in saffron/gold line art, 120px.
Heading: "உங்கள் ஜாதகம் இலவசமாக" / "Your Jadhagam — Free" in Tamil bold 22sp.
Body: "பிறந்த நேரம் கொடுத்தால், ஒரு-பக்க ஜாதகம் உடனே தயார். மேலும் பக்கங்கள் தேவையா? விலையில் கிடைக்கும்."
/ "Give your birth time and get a 1-page jadhagam instantly — free. Need more? Paid formats available."
Tamil 15sp, warm black.

3 bullet points with green checkmarks:
✓ "திருக்கணித முறையில் கணக்கிடப்பட்டது" / Calculated by Thirukanitham method
✓ "உங்கள் தரவு பாதுகாப்பானது" / Your data stays private
✓ "கணக்கு இலவசம்" / Account is free

Primary CTA: "கணக்கு உருவாக்கு & ஜாதகம் பெறு" / "Create Account & Get Jadhagam" — full-width saffron 52px.
Secondary: "பின்னர்" / "Maybe later" — text link, taupe. Must be visible.
Dismiss: swipe down or tap outside.

---

### SCREEN 14 — WhatsApp Share Card (1080×1080px)

**Generated as an image for native share sheet.**

Layout: square card, saffron gradient background `#D4611A → #8B1A3C`.
Kolam dot texture at 8% white overlay.

Top: "விநாடி AI" wordmark in white, small. Top-right: Thirukanitham badge (small gold pill).
Centre: date in Tamil large (Tamil calendar date, bold 28sp white).
Content block: today's Nalla Neram + Rahu Kalam in large white text.
Rasi palan teaser: 1 line in Tamil, white 16sp.
Bottom: "vinaadi.app" + App Store / Play Store icons (white).
Bottom-right: rasi symbol watermark (30% opacity white).

Variants: panchangam card | rasi palan card | porutham result card | muhurta card.

---

### SCREEN 15 — Home Screen Widget (Small & Medium)

**Small (2×2):** Parchment background. Top: "விநாடி AI" in saffron 10sp.
Large: today's Nalla Neram time "06:00–07:30" in saffron bold 18sp.
Below: "நல்ல நேரம்" Tamil 11sp taupe. Divider. Rahu: "09:00" red small 12sp.
Bottom: rasi name in Tamil 12sp. Tap → opens Today tab.

**Medium (4×2):** Same left column as small. Right column: today's rasi palan first line
in Tamil 12sp. Festival if any. "மேலும்" link in saffron.

---

### SCREEN 16 — Daily Push Notification (Visual)

**iOS / Android lockscreen preview:**
App icon (saffron V). App name: "விநாடி AI"
Title: "இன்றைய நல்ல நேரம் 🌅" / "Today's Nalla Neram"
Body: "06:00 – 07:30 | ராகு காலம்: 09:00 | மேஷம்: உற்சாகமான நாள்"
/ "06:00 – 07:30 | Rahu Kalam: 09:00 | Mesham: An energetic day"
Tap → opens Today tab to current date.

---

### SCREEN 17 — Signup Flow: Step 1 — Auth Method

**Full screen.** Back arrow top-left (returns to wherever triggered from).
Progress dots: ○●○○ (step 1 of 4).

Top illustration: simple warm line-art of a person with a chart/star, 140px, saffron.
Heading: "உங்கள் கணக்கை உருவாக்குங்கள்" / "Create Your Account" — Tamil bold 22sp.
Sub: "இலவசம் · விரைவானது · உங்கள் பிறந்த விவரங்கள் பாதுகாப்பானவை" / "Free · Fast · Your birth data stays private"

Auth options (full-width, 52px each, 12px gap):
- "Google-ல் உள்நுழைய" / Continue with Google — white button, Google icon, dark text border
- "Apple-ல் உள்நுழைய" / Continue with Apple — black button, Apple icon, white text (iOS only)
- Divider: "அல்லது" / or
- Email field (label: "மின்னஞ்சல்" / Email), then "தொடரவும்" / Continue saffron button

Bottom: "கணக்கு ஏற்கனவே இருக்கிறதா? உள்நுழைய" / "Already have an account? Sign in" — saffron text link.

Privacy note: "உங்கள் தனியுரிமை கொள்கை" / "Privacy Policy" link — 12sp taupe.

---

### SCREEN 18 — Signup Flow: Step 2 — Name + Birth Date

Progress: ○○●○ (step 2 of 4).
Heading: "உங்கள் விவரங்கள்" / "Your Details" — Tamil bold 20sp.

Fields:
- "பெயர்" / Name — text input, 48px, warm mist bg
- "பிறந்த தேதி" / Date of Birth — native date picker (styled: day/month/year), warm mist
- "பாலினம்" / Gender — 3 pill chips: ஆண் / பெண் / மற்றவை (Male/Female/Other)

Below fields: "ஏன் இந்த விவரங்கள்?" / "Why do we need this?" expandable info strip:
When expanded: "உங்கள் பெயர் ஜாதகத்தில் தெரிய. பிறந்த தேதி கிரக நிலை கணக்கிட. நாங்கள் விற்பனை செய்வதில்லை." / "Your name appears on the chart. Date is needed to compute planetary positions. We never sell your data."

CTA: "அடுத்தது" / "Next" — saffron full-width.

---

### SCREEN 19 — Signup Flow: Step 3 — Birth Time + Place

Progress: ○○○● (step 3 of 4).
Heading: "பிறந்த நேரமும் இடமும்" / "Birth Time & Place" — Tamil bold 20sp.
Sub: "திருக்கணித ஜாதகத்திற்கு இவை அவசியம்" / "Required for Thirukanitham precision"

Fields:
- "பிறந்த நேரம்" / Birth Time — time picker (HH:MM AM/PM), warm mist bg.
  Below: grey chip "தெரியவில்லை?" / "Don't know?" — opens birth time help sheet.
- "பிறந்த இடம்" / Birth Place — city search autocomplete. Shows Tamil Nadu cities first,
  then India, then global. Selected city shows in saffron chip with ✓.

**Birth time help bottom sheet:**
Heading: "பிறந்த நேரம் எங்கே கிடைக்கும்?" / "How to find your birth time?"
List with icons: 📄 "பிறப்பு சான்றிதழ்" (Birth certificate) | 🏥 "மருத்துவமனை பதிவு"
(Hospital record) | 👨‍👩‍👦 "பெற்றோரிடம் கேளுங்கள்" (Ask parents)
"தெரியவில்லை என்றால் ஒரு தோராய நேரம் கொடுங்கள். பின்னர் திருத்தலாம்." / "If unknown, give an approximate time. You can refine later." — 13sp taupe.

CTA: "ஜாதகம் உருவாக்கு" / "Create My Jadhagam" — saffron full-width.

---

### SCREEN 20 — Signup Flow: Step 4 — Success + 1-Page Jadhagam Reveal

**This is the payoff screen. Make it feel like a gift being unwrapped.**

**Animation:** brief (1.5s) — a saffron glow pulses out from centre, revealing the jadhagam chart.

Layout:
Top: green checkmark in saffron circle with pulse ring — "ஜாதகம் தயார்!" / "Jadhagam Ready!" Tamil bold 22sp.
Below: name + date + time + place summary in taupe 13sp.

**1-page jadhagam preview card (full-width, 220px tall):**
White card, gold border (1px). Shows actual jadhagam content — 12-house square chart
(rasi chart) with planet placements in Tamil notation. Below chart: key info summary —
Lagna, Rasi, Nakshatra, Pada in a 2×2 grid. "திருக்கணிதம்" precision badge top-right
(gold pill, small).
"சேமிக்கப்பட்டது" / "Saved to your account" — green chip below card.

**Upsell section (immediately below, without being aggressive):**
"மேலும் விரிவான அறிக்கை வேண்டுமா?" / "Want a more detailed report?"
Two option cards side by side:
- Left: "5 பக்கம்" / 5-page — ₹99 — bullet: "Dasha, Planet analysis, Predictions"
- Right: "10 பக்கம்" / 10-page — ₹249 — bullet: "+ Remedies, Career, Marriage timing". Gold "சிறந்தது" badge.

Primary CTA: "இப்போது ₹99 / ₹249 பெறுங்கள்" — saffron.
Secondary: "பின்னர்" / "Maybe later" — taupe text link. Goes to personalized Today tab.

---

### SCREEN 21 — Today Tab (Registered / Personalized)

**This replaces SCREEN 04 for logged-in users. Layout is richer but same morning-scan feel.**

**A. Header strip:** same as guest but shows user's name "வணக்கம், அர்ஜுன் 🙏" left side.
Right: notification bell (with dot if unread).

**B. Personal Daily Score Hero Card (full-width, 220px):**
Background: dark warm navy `#1A2540` with subtle kolam pattern at 6%.
Left side: score ring (circular progress, saffron fill, gold trail) — score number inside in
white ExtraBold 42sp. "/ 10" in white 18sp. Below ring: "இன்றைய நிலை" / "Today's Score" white 12sp.
Right side: 3 mini-indicators stacked:
  - "தொழில்" Career: mini bar, filled saffron
  - "உடல்நலம்" Health: mini bar
  - "உறவு" Relationship: mini bar
  Bottom-right: "Thirukanitham" gold badge 11sp.
Tap card → Daily Score Detail screen (SCREEN 22).

**C. Best Window chip strip (horizontal scroll):**
Section: "சிறந்த நேரங்கள்" / "Best Windows Today"
Time-window chips: "06:00–08:30 தொழிலுக்கு" (green chip) | "14:00–15:30 முடிவுகளுக்கு" (saffron chip).
Caution chip: "10:30 சந்திராஷ்டமம் ⚠️" (amber chip, if applicable).

**D. Personal Rasi Palan Card:**
Header: "மேஷம் — இன்றைய பலன்" in saffron 14sp bold.
Full palan text in Tamil 15sp. More depth than guest rasi palan — birth chart contextualised.
Below: 3 category chips with scores.

**E. Panchangam strip:** same as guest SCREEN 04 section C.

**F. Alert card (if chandrashtama or peyarchi):**
Amber-tinted card. ⚠️ icon. "சந்திராஷ்டமம்: இன்று முதல் 2 நாட்கள்" — Tamil bold 15sp.
"முக்கியமான முடிவுகளை தவிர்க்கவும்." — Tamil 13sp. "விரிவாக" / "Details" link.
*This is a personalised alert — only registered users see it.*

**G. No ads above fold. Tasteful native ad unit below fold, clearly labelled.**

---

### SCREEN 22 — Daily Score Detail Screen

**Header:** "இன்றைய விரிவான நிலை" / "Today's Detailed Guidance" — back arrow.

**A. Score summary card:** same ring + number as hero, full-width.

**B. Life Area breakdown (expandable cards, one per area):**
Each card: area name (Tamil bold 16sp) | score bar | 2–3 lines of guidance in Tamil 15sp.
Areas: தொழில் (Career) · பண விஷயம் (Finance) · உடல்நலம் (Health) · உறவு (Relationships) · படிப்பு (Education)
Expanded view shows: why this score, what helps today, what to avoid — all in Tamil.

**C. Timing guidance:**
"சிறந்த நேரங்கள்" — time windows with activity suggestions.
"தவிர்க்க வேண்டிய நேரங்கள்" — caution windows.

**D. Thirukanitham factors panel (collapsible):**
Shows the astrological inputs: current dasha/bhukti, transit planets affecting lagna,
today's nakshatra interaction with natal nakshatra. In Tamil with English terms for
technical words. Gold "Thirukanitham" section header.

---

### SCREEN 23 — Chandrashtama Alert Screen

**Triggered from:** personal alert card on Today tab, or notification tap.
**Header:** "சந்திராஷ்டமம்" / "Chandrashtama Alert" — back arrow. Amber header tint.

Content:
Amber hero card: "இன்று முதல் 2½ நாட்கள்" / "For the next 2½ days" — dates shown.
"என்ன தவிர்க்க வேண்டும்?" / "What to avoid?" — bullet list in Tamil.
"என்ன செய்யலாம்?" / "What you CAN do" — positive framing list.
Pariharam suggestion (linked to devotional content): "ஏதாவது பரிகாரம் உதவுமா?" text link.

**Tone:** never fear-mongering. Framing is "awareness + precaution", not "danger! bad day!"

---

### SCREEN 24 — Jadhagam: 1-Page Result (Free)

**Header:** person's name + "ஜாதகம்" / "Jadhagam" — back arrow + share icon right.
"திருக்கணிதம்" gold badge in header row.

**Page content (scrollable, renders actual chart):**

**Section A — Rasi Chart (12-house square):**
Traditional South Indian square chart layout (3×3 grid with corners).
Each house: house number (Tamil numeral), planet abbreviations in Tamil.
Lagna house: marked with "லக்னம்" in saffron bold.
Chart border: thin gold line. Background: white. Planet text: deep warm black.

**Section B — Key Chart Data (2-column grid):**
லக்னம் (Lagna) · ராசி (Rasi) · நட்சத்திரம் (Nakshatra) · பாதம் (Pada)
கட்டம் (Dasha) · புக்தி (Bhukti) · ஆண்டு (Year)

**Section C — Navamsa Chart (mini, 50% width):**
Same square layout, smaller. "நவாம்சம்" header.

**Bottom: Upsell to 5-page / 10-page:**
"இன்னும் விரிவான விளக்கம் வேண்டுமா?" card — same as SCREEN 20 upsell section.

**Share FAB:** bottom-right saffron circle — "PDF பகிர்" / Share PDF.

---

### SCREEN 25 — Jadhagam: Daily Limit Reached

**Triggered when:** registered user tries 4th chart generation in a day.
**Presentation:** bottom sheet (non-blocking).

Illustration: simple hourglass or moon/night motif in saffron line-art.
Heading: "இன்று 3 ஜாதகங்கள் உருவாக்கினீர்கள்!" / "You've created 3 charts today!" — Tamil bold 20sp.
Body: "நாளை நள்ளிரவுக்குப் பிறகு மீண்டும் இலவசமாக கிடைக்கும்." / "Free charts reset after midnight. Come back tomorrow."

Options:
- "ஒரு ஜாதகம் இப்போது வாங்க — ₹49" / "Buy 1 more now — ₹49" — saffron button (pay-per-extra)
- "Premium-ல் வரம்பற்று" / "Go unlimited with Premium" — maroon button
- "சரி, நாளை வருகிறேன்" / "OK, I'll return tomorrow" — taupe text link (dismisses)

---

### SCREEN 26 — Jadhagam: 5-Page & 10-Page Upsell / IAP

**Header:** "விரிவான ஜாதக அறிக்கை" / "Detailed Jadhagam Report"

**Format selector (large toggle cards):**
Card 1 — "5 பக்க அறிக்கை" / 5-Page Report:
Price: ₹99 in saffron bold 24sp. Includes:
✓ ரோஜா சக்கரம் / Rasi + Navamsa charts
✓ கிரக விளக்கம் / Planet-by-planet analysis
✓ தசா பட்டியல் / Dasha period list
✓ முக்கிய யோகங்கள் / Key yogas

Card 2 — "10 பக்க அறிக்கை" / 10-Page Report:
Price: ₹249 in saffron bold 24sp. Gold "சிறந்தது" badge.
Includes everything in 5-page PLUS:
✓ தொழில் / Career guidance
✓ திருமண பொருத்தம் / Marriage timing
✓ ஆரோக்கியம் / Health analysis
✓ பரிகாரங்கள் / Remedy suggestions

Selected card: gold border (2px), saffron tint background.

**Thirukanitham trust strip:** "திருக்கணித முறையில் கணக்கிடப்பட்டது. எந்த அனுமானமும் இல்லை."
/ "Computed by Thirukanitham method. Zero guesswork." — gold strip, lotus icon.

**CTA:** "இப்போது வாங்கு — ₹99 / ₹249" — full-width saffron IAP button.
Below: "Google Pay / Apple Pay / UPI / Card" — payment method icons in a row (grey, small).
Below: "10 நிமிடத்தில் PDF ready. Email-ல் வரும்." / "PDF ready in 10 minutes. Sent to your email." — 12sp taupe.

---

### SCREEN 27 — Profile / Me Tab (Registered)

**Header:** "நான்" / "Me"

**Top card — User identity:**
White card, full-width. Left: avatar circle (saffron initial letter, 52px).
Right: Name (bold 17sp) | Email (13sp taupe) | "மேஷம் · அஸ்வினி" rasi + nakshatra (13sp saffron).

**Jadhagam stats row:**
3 mini stat chips: "3 ஜாதகங்கள்" | "இன்று: 2/3" | "அறிக்கைகள்: 1"

**Menu sections:**

Section "வழிகாட்டுதல்" / Guidance:
- "என் ஜாதகங்கள்" / My Charts — arrow
- "அறிவிப்பு inbox" / Notification Inbox — unread badge
- "அறிவிப்பு அமைப்புகள்" / Notification Settings

Section "கணக்கு" / Account:
- "பிறந்த விவரங்கள் திருத்து" / Edit Birth Details
- "மொழி" / Language
- "நகரம்" / City
- "Dark Mode" toggle

Section "ஆதரவு" / Support:
- "தனியுரிமை" / Privacy
- "பயன்பாட்டு விதிகள்" / Terms
- "ஆப்-ஐ மதிப்பிடுங்கள்" / Rate App
- "வெளியேறு" / Sign Out (in caution red, bottom of list)

**Premium upgrade strip (free users only):**
Gold-tinted strip at bottom of list before sign out.
"Premium-ல் சேருங்கள் — ₹149/மாதம்" — gold star icon. Arrow.

---

### SCREEN 28 — Notification Inbox (Registered)

**Header:** "அறிவிப்புகள்" / "Notifications" — back arrow + "எல்லாம் படித்தேன்" / "Mark all read" right action.

**Filter chips (horizontal scroll):** எல்லாம் · தனிப்பட்டவை · பஞ்சாங்கம் · எச்சரிக்கைகள்
(All · Personal · Panchangam · Alerts)

**Notification rows:**
Each row: icon left (saffron for personal, amber for alert, blue for panchangam) | 
Title in Tamil bold 15sp | body in Tamil 13sp taupe | time ago right 12sp taupe.
Unread rows: very light saffron tint background. Read: white.
Swipe left → delete action (red bin icon).

---

### SCREEN 29 — Notification Settings

**Header:** "அறிவிப்பு அமைப்புகள்" / "Notification Settings" — back arrow.

**Morning daily push:**
Large toggle card. Left: 🌅 icon. "காலை பஞ்சாங்கம்" / "Morning Panchangam".
Toggle right (on by default). Below toggle: time picker "06:30 AM" — tappable.

**Personal alerts (registered only):**
Toggle list:
- "சந்திராஷ்டமம் எச்சரிக்கை" / Chandrashtama Warning
- "கிரக பெயர்ச்சி" / Planet Peyarchi
- "விழாக்கள்" / Festival reminders
- "ஜாதக ஞாபகூட்டல்" / Report ready reminder

Each toggle: label Tamil bold 15sp | description Tamil 12sp taupe | iOS-style toggle right.

---

### SCREEN 30 — Premium Upgrade Screen (Phase C)

**Full-screen presentation (modal).**
Close X top-right (must be visible — store requirement).

**Hero:**
Deep navy background `#0F1520` with gold kolam texture 8%.
Gold lotus illustration top, 80px.
"விநாடி AI Premium" in white + gold gradient text, Inter ExtraBold 28sp.
Sub: "வரம்பற்ற வழிகாட்டுதல். விளம்பரங்கள் இல்லை." / "Unlimited guidance. No ads." — white 15sp.

**Features list (white card on navy):**
✓ வரம்பற்ற ஜாதகங்கள் / Unlimited charts (vs 3/day free)
✓ விளம்பரங்கள் இல்லை / No ads
✓ குடும்ப Vault / Family vault (5 profiles)
✓ Ask Vinaadi AI / Ask Vinaadi AI chat
✓ மாதம் 3 விரிவான அறிக்கைகள் / 3 detailed reports/month
✓ தசா / Dasha timeline
✓ பரிகார பரிந்துரைகள் / Remedy suggestions

**Plan selector:**
Monthly pill: "₹149 / மாதம்" | Annual pill: "₹999 / ஆண்டு" — "48% சேமிப்பு!" gold badge.
Annual selected by default.

**CTA:** "Premium தொடங்கு" / "Start Premium" — full-width gold gradient button, dark text.
Below: "7 நாட்கள் இலவச சோதனை. எந்த நேரத்திலும் ரத்து செய்யலாம்." / "7-day free trial. Cancel anytime." — white 12sp.

---

### SCREEN 31 — Family Vault (Phase C)

**Header:** "குடும்ப Vault" / "Family Vault" — back arrow + "சேர்க்க +" right.

**Profile cards (horizontal scroll):**
Each card (100×120px): avatar circle (saffron initial), name Tamil bold 14sp,
rasi + nakshatra 12sp taupe, relationship chip (தந்தை/அம்மா/மனைவி etc.).
Active/selected: saffron border. "+" card at end = add new profile.

**Selected profile content (same as registered Today tab):**
Shows daily score, key timings, alerts — all computed for selected family member's chart.

---

### SCREEN 32 — Ask Vinaadi (Phase C)

**Header:** "Ask Vinaadi" — back arrow. Sub: "உங்கள் ஜாதகத்தில் இருந்து பதில்கள்" / "Answers from your birth chart"

**Chat interface:**
Background: parchment `#FAF7F2`.
User bubbles: right-aligned, saffron tint background, warm black text.
Vinaadi bubbles: left-aligned, white background, warm black text, small "V" avatar left.
Vinaadi answers always include: source citation in small taupe ("Dasha: Shani-Shukra,
Transit: Guru on natal Moon") — the Thirukanitham transparency principle.

**Input bar:**
Text field "கேளுங்கள்..." / "Ask something..." + send button (saffron arrow).
Above input: suggested question chips: "திருமணம் எப்போது?" · "தொழில் மாற்றம் சரியா?" · "இந்த ஆண்டு எப்படி?"

**Disclaimer strip (above input):** "இது ஜாதக-அடிப்படையிலான வழிகாட்டுதல். இறுதி முடிவு உங்களுடையது."
/ "This is chart-based guidance. Final decisions are yours." — 11sp taupe, light amber bg.

---

## 4. Component Library

### 4.1 Ad Units

**Native in-feed ad (blend with content):**
Card matching content card style. Left border: 3px taupe. Top-left: "விளம்பரம்" / "Sponsored"
in taupe 10sp italic. Otherwise matches surrounding content card size. Never saffron border
(reserved for Vinaadi content).

**Rewarded ad prompt card:**
Saffron-bordered card. Right: play button circle. "இலவசமாக பெற — வீடியோ பாருங்கள்" / "Get free — watch a video"
Bold 14sp. Clearly optional. Alternative paid option always shown alongside.

**Banner ad (tool result screens only):**
Standard adaptive banner, below content, above bottom nav. White background. "விளம்பரம்" label.
Never on Today tab hero area, never in onboarding, never in Premium tier.

**Interstitial (1 per session max):**
Only shown at natural break: after viewing a full porutham result. Never on app open.
Always has clearly visible X close button (not hidden, not delayed beyond 5 seconds).

### 4.2 Thirukanitham Trust Badge

Gold pill badge. Text: "திருக்கணிதம்" in Tamil + a small circle-dot symbol.
Size: small (on cards) and medium (on report covers). Never use it on user-generated content.
Appears on: jadhagam chart header, report covers, daily score card, methodology sections.

### 4.3 Loading / Skeleton States

Skeleton: warm mist `#F5F0EA` blocks with a shimmer animation (left-to-right, saffron shimmer
at 15% opacity). Match exact layout of the content being loaded — not generic grey bars.

### 4.4 Error States

Card with gentle amber border. ⚠️ icon in amber. Tamil heading "தகவல் கிடைக்கவில்லை" /
"Couldn't load" + English below. "மீண்டும் முயற்சி" / "Try again" saffron text link.
Never red backgrounds for errors — this is a calm, trustworthy app.

### 4.5 Empty States

Soft line-art illustration (saffron outline) relevant to the section. Tamil heading
"இன்னும் எதுவும் இல்லை" / "Nothing here yet" — taupe body text explaining what will appear.
Helpful CTA if applicable (e.g., "ஜாதகம் உருவாக்கு" / "Create a chart").

---

## 5. Design Do's and Don'ts

### Do
- Default to Tamil text; English is always present but secondary.
- Use Noto Sans Tamil — validate rendering on Android before finalising.
- Keep the morning-scan experience fast and clean — max 3 hierarchy levels per screen.
- Show the "Thirukanitham" trust badge prominently on computed content.
- Make every soft signup prompt dismissable and non-blocking.
- Show daily chart limit counter "இன்று: X/3" proactively — never surprise the user.
- Use warm, auspicious colours for positive states; amber (not red) for caution; reserve
  red strictly for hard-avoid / chandrashtama.
- Frame all astrological guidance as awareness + suggestion, never as fate or prediction.
- Make "Later" / "Skip" equally visible to "Sign Up" / "Buy Now" — do not dark-pattern.

### Don't
- No fear language: "ஆபத்து" (danger), "கெட்ட நாள்" (bad day), "கவலைப்படுங்கள்" (worry). Use
  "கவனம்" (caution), "சற்று எச்சரிக்கை" (slight care).
- No Western zodiac imagery (ram/bull/scorpion character art).
- No aggressive pop-up interstitials on app open.
- No ads on: Today tab hero, onboarding, Premium tier screens, auth flows.
- No generic pan-Indian astrology aesthetic — no dark purple/neon, no sparkle stock icons.
- No pure white backgrounds — always warm off-white `#FAF7F2` or warm white `#FFFFFF` on cards.
- Don't gate the daily panchangam behind any login or paywall — ever.
- Don't show Western-style zodiac months for Tamil calendar content — always use Tamil month names (ஆனி, ஆடி, etc.).

---

## 6. Key Tamil Strings Reference

Design tools should use these exact strings (not translated equivalents):

| Element | Tamil | English |
|---|---|---|
| App name | விநாடி AI | Vinaadi AI |
| Today tab | இன்று | Today |
| Panchangam tab | பஞ்சாங்கம் | Panchangam |
| Tools tab | கருவிகள் | Tools |
| Me tab | நான் | Me |
| Daily score | இன்றைய நிலை | Today's Score |
| Good time | நல்ல நேரம் | Nalla Neram |
| Rahu period | ராகு காலம் | Rahu Kalam |
| Birth chart | ஜாதகம் | Jadhagam |
| Marriage matching | திருமண பொருத்தம் | Porutham |
| Auspicious timing | முகூர்த்தம் | Muhurta |
| Planet transit | கிரக பெயர்ச்சி | Peyarchi |
| Chandrashtama | சந்திராஷ்டமம் | Chandrashtama |
| Nakshatra | நட்சத்திரம் | Star/Nakshatra |
| Lagna | லக்னம் | Ascendant |
| Dasha | தசா | Dasha period |
| Precision method | திருக்கணிதம் | Thirukanitham |
| Free | இலவசம் | Free |
| Subscribe | Premium சேர்க | Join Premium |
| Sign out | வெளியேறு | Sign Out |
| Privacy | தனியுரிமை | Privacy |

---

## 7. Screens Summary Checklist

**Phase A — Guest (build first):**
- [ ] 01 App Icon + Splash
- [ ] 02 Location Permission
- [ ] 03 Rasi Picker
- [ ] 04 Today Tab (Guest)
- [ ] 05 Panchangam Day View
- [ ] 06 Panchangam Month Calendar
- [ ] 07 Tools Tab
- [ ] 08 Porutham Input
- [ ] 09 Porutham Result
- [ ] 10 Muhurta Input
- [ ] 11 Muhurta Result
- [ ] 12 Me Tab (Guest)
- [ ] 13 Jadhagam Signup Gate (bottom sheet)
- [ ] 14 WhatsApp Share Card
- [ ] 15 Home Screen Widget (small + medium)
- [ ] 16 Push Notification Visual

**Phase B — Registered (build second):**
- [ ] 17 Signup Step 1 — Auth Method
- [ ] 18 Signup Step 2 — Name + Date
- [ ] 19 Signup Step 3 — Birth Time + Place
- [ ] 20 Signup Step 4 — Jadhagam Reveal (payoff)
- [ ] 21 Today Tab (Registered)
- [ ] 22 Daily Score Detail
- [ ] 23 Chandrashtama Alert
- [ ] 24 Jadhagam 1-Page Result (free)
- [ ] 25 Daily Limit Reached
- [ ] 26 Jadhagam 5-Page / 10-Page Upsell + IAP
- [ ] 27 Profile / Me Tab (Registered)
- [ ] 28 Notification Inbox
- [ ] 29 Notification Settings

**Phase C — Premium:**
- [ ] 30 Premium Upgrade Screen
- [ ] 31 Family Vault
- [ ] 32 Ask Vinaadi Chat

**Shared components:**
- [ ] Skeleton loading states (per screen type)
- [ ] Error state card
- [ ] Empty state (per section)
- [ ] Ad unit examples (native, rewarded, banner, interstitial)
- [ ] Thirukanitham trust badge (small + medium)
- [ ] Bottom sheet template

---

## 8. Prompt for Design Generation

When generating screens, apply this priority order:
1. **Tamil cultural warmth first** — saffron, gold, temple warmth, kolam texture.
2. **Thirukanitham precision** — clean typography, trust badges, no visual noise.
3. **Morning utility** — scannable cards, fast visual hierarchy, not decorative.
4. **Modern premium feel** — soft shadows, rounded corners, smooth gradients — NOT garish.
5. **Tamil text prominent** — always larger or equal to English equivalents on same screen.

Reference visual comparisons:
- Closer to: Headspace (calm, trustworthy) + Swiggy (fast utility) + Tamil temple architecture (warm, gold, structured)
- Further from: AstroTalk (busy, fear-forward) + purple neon generic horoscope apps

Generate each screen at iPhone 15 Pro size (393×852pt) at 3x. Also provide Android Pixel 8 (412×915dp) where layout differs meaningfully.
