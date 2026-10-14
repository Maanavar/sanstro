# Glyph commission brief — astrology marks for the Nova dashboard (2026-09-21)

**For:** the owner, to decide OD-1 and to hand to an illustrator.
**Source item:** DXA-24 / DXA-09 (`no emoji / text glyphs as icons`), audit
`docs/DASHBOARD_EXPERIENCE_AUDIT_2026-09-17.md`; work order OD-1.
**What this is not:** a design. No icon was drawn or chosen here. Every row says
what is on screen today and where; the drawing is the commission.

---

## 1. Why a commission, not a library

The dashboard's generic UI icons are Lucide (1.75 px stroke, 24 px grid). The
astrology marks are not: they are Unicode astronomical symbols (☉ ♂ ♈) and
colour emoji (🪔 🐘 🌕), which render in the operating system's emoji font — a
different colour, weight and baseline on every platform, and a cartoon register
next to Lucide's line set. Lucide has no graha, rasi, nakshatra or deity marks,
so these cannot be swapped for a library icon; they have to be drawn.

**Style target.** Match Lucide so the two sets read as one system:

- 24 × 24 grid, 2 px padding, **1.75 px stroke**, round caps and joins, no fill
  by default (a filled variant only where the tradition's mark is a solid
  disc, e.g. the full/new moon);
- single colour via `currentColor` (the surfaces tint them with
  `--color-accent-strong`, `--color-accent-secondary` or a tone colour);
- legible at 13, 15 and 26 px (the sizes used today);
- delivered as SVG, one file per mark, named by the engine's key
  (`SUN.svg`, `MESHAM.svg`, `ASWINI.svg`, …).

**Tradition.** Tamil almanac usage over Sanskrit (owner ruling): the mark
should be the one a Tamil panchangam reader recognises, and its name is the
Tamil almanac name. Where a nakshatra's classical emblem is contested between
lineages, the brief asks the illustrator to follow the astrologer's reference
table rather than pick one (see §6).

---

## 2. Nine grahas

Today: Unicode astronomical symbols, `GRAHA_GLYPH` in
`web/components/dashboard-hybrid-parts.tsx:63` (and a copy in
`dashboard-today-glance-nova.tsx:554`).

| Key | Today | Surfaces |
|---|---|---|
| SUN | ☉ | Family & Charts planet table (row badge), orbs; Today glance member focus |
| MOON | ☾ | same |
| MARS | ♂ | same; Porutham tool (`dashboard-tools-porutham-nova.tsx:405`); nakshatra visual |
| MERCURY | ☿ | same |
| JUPITER | ♃ | same |
| VENUS | ♀ | same; Porutham tool (`:408`); nakshatra visual |
| SATURN | ♄ | same |
| RAHU | ☊ | same |
| KETU | ☋ | same |

## 3. Twelve rasis

Today: western zodiac Unicode (♈ … ♓) in two places —
`web/lib/astro-symbols.ts:8` (`RASI_GLYPHS`, 1-based) and
`web/components/astro-symbols.tsx:9` (keyed by western name). Raster artwork
also exists under `web/public/zodiac-signs/`.

| # | Tamil name (key) | Today | Surfaces |
|---|---|---|---|
| 1 | Mesham | ♈ | Calendar (lagnam/rasi rows), marketing topic panels, login welcome (`login-welcome-nova.tsx:27`) |
| 2 | Rishabam | ♉ | same — gated on Calendar in the latest DXA-09 run |
| 3 | Mithunam | ♊ | same |
| 4 | Kadagam | ♋ | same |
| 5 | Simmam | ♌ | same |
| 6 | Kanni | ♍ | same |
| 7 | Thulam | ♎ | same |
| 8 | Viruchigam | ♏ | same |
| 9 | Dhanusu | ♐ | same |
| 10 | Magaram | ♑ | same |
| 11 | Kumbam | ♒ | same |
| 12 | Meenam | ♓ | same |

**Owner question:** the twelve western Unicode signs are the zodiac's own
iconography, not an emoji substitute. Commission them for weight consistency,
or keep them? The DXA-09 gate currently flags them (♉ on Calendar).

## 4. Panchangam limbs

Today the Today-hero masthead already uses Lucide for the star and tithi rows
(`Star`, `Sparkles`) and a drawn, phase-accurate moon (`MiniMoonGlyph`) for
paksha — those need nothing. The remaining limb marks are emoji:

| Mark | Today | Where | Note |
|---|---|---|---|
| Full moon (Pournami) | 🌕 | `lib/astro-symbols.ts:103`, festival rules | could reuse `MiniMoonGlyph` (full) — **no commission** if the owner agrees |
| New moon (Amavasai) | 🌑 | same | as above |
| Panchangam heading | 📅 | `lib/i18n.ts:440` (`cal_panchangam`, both languages) | a string, not an icon slot: move the mark out of the i18n string; Lucide `CalendarDays` fits |
| Weekday deity (7) | ॐ fallback medallion | share card, `web/public/deities/README.md` | see §5 — the seven deity illustrations |
| Nakshatra emblems (27) | emoji per star | `lib/astro-symbols.ts:42` `NAKSHATRA_SYMBOLS` | **commission all 27** — table below |

Nakshatra emblems (today's emoji is an approximation, per the source comment):

| Key | Today | Classical emblem (as annotated in source) |
|---|---|---|
| ASWINI | 🐎 | horse's head |
| BHARANI | 🌺 | yoni |
| KARTHIGAI | 🔪 | knife / flame |
| ROHINI | 🛺 | cart |
| MIRUGASEERIDAM | 🦌 | deer's head |
| THIRUVATHIRAI | 💧 | teardrop |
| PUNARPOOSAM | 🏹 | bow |
| POOSAM | 🏵️ | flower / udder |
| AYILYAM | 🐍 | serpent |
| MAGAM | 👑 | throne |
| POORAM | 🛏️ | front legs of a cot |
| UTHIRAM | 🛏️ | back legs of a cot — **same emoji as Pooram today** |
| HASTHAM | ✋ | hand |
| CHITHIRAI | 💎 | pearl / gem |
| SWATHI | 🌬️ | shoot of a plant / wind |
| VISAKAM | 🏛️ | triumphal arch |
| ANUSHAM | 🪷 | lotus |
| KETTAI | ☂️ | umbrella / earring |
| MOOLAM | 🌿 | bunch of roots |
| POORADAM | 🪭 | fan / tusk |
| UTHIRADAM | 🐘 | elephant tusk |
| THIRUVONAM | 👣 | three footprints |
| AVITTAM | 🥁 | drum |
| SADAYAM | ⭕ | circle |
| POORATTATHI | 🗡️ | sword / front of a cot |
| UTHIRATTATHI | 🐉 | back of a cot / serpent |
| REVATHI | 🐟 | fish / drum |

Fallback today for an unknown star: ✦.

## 5. Festival and deity marks

**Festival marks** — two rule tables that overlap:
`web/components/dashboard-calendar-shared.tsx:579` (`FESTIVAL_ICON_RULES`,
checked first) and `web/lib/astro-symbols.ts:79` (the shared fallback).
Surfaces: Calendar day chips and rows (`festivalIcon()`), month grid
(`dashboard-calendar-monthly-nova.tsx:66`), Family & Charts.

| Occasion (name pattern) | Today | Note |
|---|---|---|
| Pradosham | 🪔 | lamp |
| Sivarathiri | 🔱 | trident |
| Sankatahara / Vinayaka Chathurthi | 🐘 | raster art also exists: `/calendar/chathurthi.png` |
| Sashti | 🦚 | peacock (Murugan); raster: `/calendar/shasti.png` |
| Pournami | 🌕 | see §4 |
| Amavasai | 🌑 | see §4 |
| Ekadasi | 🪷 | lotus; raster: `/calendar/ekadashi.png` |
| Ashtami | 🗡️ | shared table only |
| Karthigai (Deepam) | 🪔 | same lamp as Pradosham today — distinguish? |
| Pongal / Sankranti | 🌾 | |
| Deepavali | 🪔 | same lamp again |
| Star festivals (Visakam, Magam, Uthiram) | ⭐ | |
| Anything else | ✨ | the generic fallback, also shown for world observances |

**Owner questions:** (a) one lamp for Pradosham, Karthigai and Deepavali, or
three marks? (b) should world observances (24 days, e.g. World Health Day)
carry any mark at all, or none — they currently get ✨.

**Deity medallions (7)** — `web/public/deities/` holds only its README; the
share card falls back to a gradient medallion with ॐ. These are
**illustrations**, not line icons (512 × 512 PNG, circular-safe), so they are a
separate commission from §2–§4:

| Key | Day | File expected |
|---|---|---|
| surya | Sunday | `surya.png` |
| shiva | Monday | `shiva.png` |
| murugan | Tuesday | `murugan.png` |
| vishnu | Wednesday | `vishnu.png` |
| dakshinamurthy | Thursday | `dakshinamurthy.png` |
| lakshmi | Friday | `lakshmi.png` |
| shani | Saturday | `shani.png` |

## 6. Not for the commission — Lucide equivalents exist (agent work, DXA-24)

These are generic UI marks the DXA-09 gate lists in the same breath. They do
not need drawing; the agent part of DXA-24 can swap them for Lucide once
approved:

| Today | Where | Lucide |
|---|---|---|
| 📅 / 🗓 | `lib/i18n.ts:440`; `dashboard-propensities-panel-nova.tsx:257` | `CalendarDays` |
| 📍 | `dashboard-calendar-tab-nova.tsx:1452`; `place-coordinates-field.tsx:59` | `MapPin` |
| ▾ | Calendar, Family member, top-bar menus (`dashboard-hero.tsx:477`, …) | `ChevronDown` |
| ↻ | `dashboard-family-charts-hybrid.tsx:911` | `RefreshCw` |
| ◇ | `dashboard-family-charts-hybrid.tsx:914, 1540` | `Diamond` (already used on Today) |
| ✎ | `dashboard-family-charts-hybrid.tsx:919` | `Pencil` |
| ⤓ | Download PDF (`dashboard-today-tab-nova.tsx:1761`, Family, Porutham) | `Download` |
| ★ | `dashboard-hybrid-parts.tsx:221`, feedback modal, `dashboard-ui-nova.tsx:420` | `Star` |
| ✳ | `dashboard-hybrid-parts.tsx:1301` | `Asterisk` |
| ✓ / → | Family, Settings | `Check` / `ArrowRight` |
| 👋 | Family greeting (`dashboard-family-charts-hybrid.tsx:1052`) | none needed — drop the emoji (a greeting, not an icon) |
| 🕊 | Journal (`dashboard-journal-tab-nova.tsx:355`) | `Feather` or `Bird`; owner's call on tone |
| ☀ | Calendar and Family (`dashboard-calendar-tab-nova.tsx:550`, `dashboard-family-charts-hybrid.tsx:482, 955, 1122`) | `Sun` where it means daytime/sunrise; the **graha** Sun is §2 |

Also on DXA-24's agent list: one shared 36 px icon well for Quick Links, Tools
and Understand.

## 7. Deliverables and acceptance

1. §2 (9) + §3 (12, if the owner commissions them) + §4 nakshatras (27) +
   §5 festival marks (≈11) as 24 × 24 SVG, 1.75 px stroke, `currentColor`.
2. §5 deity medallions (7) as 512 × 512 PNG — a separate illustration brief.
3. Wiring (agent): replace `GRAHA_GLYPH`, `RASI_GLYPHS` (both copies),
   `NAKSHATRA_SYMBOLS` and both `FESTIVAL_ICON_RULES` tables with one SVG
   component per family, keyed by the engine key; delete the duplicate table.
4. Gate: `DXA-09 no emoji / text glyphs as icons` PASS on every tab, **and** a
   Tamil-mode pass (the harness runs English only unless the `ta` phase is
   used — W-8).

**Decisions this brief needs from the owner:** commission the rasis (§3);
lamp marks (§5a); observance mark (§5b); deity illustration scope (§5);
Journal's 🕊 replacement tone (§6).
