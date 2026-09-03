# Natchathiram Visual Page — Dasha Writing Guide

This document captures every rule, pattern, and principle established while writing the **Ashwini** nakshathiram visual page dasha content. Use this as the complete reference when writing dasha content for any of the remaining 26 nakshatrams. Follow every rule here without deviation.

---

## 1. The File You Are Editing

Each nakshathiram visual page lives at:
```
web/app/natchathiram/[slug]/visual/page.tsx
```

The component that renders it is:
```
web/components/natchathiram-visual.tsx
```

You only ever need to edit the `page.tsx` for the specific nakshathiram. The component file handles rendering.

---

## 2. The Data Structure — `dashaTimeline`

The `dashaTimeline` array in the `NatchathiramVisualData` object is what you are filling. Each entry has this shape:

```typescript
{
  planet: string;       // "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"
  period: string;       // Duration string — e.g., "7 yrs", "20 yrs"
  ageRange: string;     // Age window — e.g., "Age 0–7", "Age 7–27"
  theme: string;        // Short evocative title — e.g., "The Soul's First Print"
  detail: {
    expect: string;     // "At This Age" panel — what actually happens in life
    navigate: string;   // "Be Alert" panel — warnings, health, risks
    focus: string;      // "Remedy & Opportunity" panel — remedies, antardasha notes, what to leverage
  };
}
```

Always include `ageRange`. Never omit `detail`. All three detail fields are required.

---

## 3. Always Use 8 Dashas

Show 8 dashas per page, covering life up to approximately age 100. The 9th dasha (the one after Saturn or Mercury depending on start) is excluded — very few live to 103+.

The partial-dasha note is already in the component — you do not need to add it. But always use theoretical full-balance ages in `ageRange` (the component note explains the first dasha may be shorter).

---

## 4. Section Labels

The panels inside the detail popup use these labels (already set in the component — do not change):

| Field | English Label | Tamil Label |
|---|---|---|
| `expect` | **At This Age** | இந்த வயதில் |
| `navigate` | **Be Alert** | கவனம் தேவை |
| `focus` | **Remedy & Opportunity** | நிவாரணம் & வாய்ப்பு |

---

## 5. Writing Voice — Tamil Astrologer Standard

You are a **50+ year experienced Tamil astrologer specialising in Thirukanitham and Vimshottari dasha**. Write as that person.

**Rules:**
- No hedging ("might", "may sometimes", "could possibly"). State what happens.
- Predict concrete life events — not abstract qualities. Say "marriage is most likely in Venus–Moon antardasha, typically ages 21–26" not "relationships are favored."
- Name specific temples, specific remedies (day, flower, mantra), specific health organs at risk.
- Specific antardasha sub-periods should be named and timed — e.g., "Mars–Rahu antardasha (approximately ages 44–45)."
- Age ranges ground every statement. Always say "at this age" or "by age X" or "between ages X and Y."
- Never write "this dasha brings challenges." Write *what* the challenge is and *when*.
- `expect`: richest field — 4–6 sentences describing real life events
- `navigate`: 3–5 sentences — health warnings, family dynamics, what to avoid
- `focus`: 3–5 sentences — specific remedies first, then the antardasha notes (see Rule 7)

---

## 6. Age-Content Matching — What Belongs Where

Match content to the actual life stage. This is the core quality principle.

| Age Range | Life Stage | What to Write About |
|---|---|---|
| 0–10 | Infancy / early childhood | Health scares, family disruptions, grandparent bond, school entry, spiritual sensitivity |
| 7–27 | School / college / early career | Academic performance, friendship, romance, marriage (specific antardasha window), first job |
| 20–35 | Early career / marriage | Career establishment, first promotion, property gesture, children |
| 33–50 | Mid-life | Family management, business growth, relocation, second child, property ownership |
| 43–60 | Mature professional | Peak authority, property acquisition, sibling dynamics, health monitoring (BP, cardiac) |
| 50–70 | Late career | Foreign connections, technology, reputation pressures, spiritual questioning |
| 65–85 | Senior / elder | Grandchildren, teaching, pilgrimage, legacy, health maintenance |
| 80+ | Very old age | Routine as medicine, dependence with grace, final obligations, karmic completion |

---

## 7. The Rasi Lord Rule — CRITICAL

This is the most important content rule. Every nakshathiram sits in a rasi (zodiac sign). That rasi has a lord (planet). **The rasi lord's dasha carries a natural amplification for that nakshathiram.** Always reflect this.

### 7a. In the Rasi Lord's Own Dasha

In the `expect` field of the rasi lord's dasha, add a clear declaration near the opening:

> *"[Planet] is the lord of your rasi, [Rasi name] — this makes [his/her] dasha doubly charged for [Nakshathiram] natives. Where other nakshathirams experience [Planet] dasha as one planetary period among nine, for [Nakshathiram] it is the rasi lord taking the wheel."*

Then continue with the age-specific predictions. The rasi lord note should be sentence 2–3, not the entire paragraph.

### 7b. Rasi Lord Antardasha in Earlier Dashas

When the rasi lord's main dasha falls late in life (after age 50), identify the **1–2 earlier dashas** that contain the rasi lord's antardasha and add a note in the `focus` field of those dashas.

Format:
> *"Also watch the [Dasha]–[Rasi Lord] antardasha within this period (the Nth sub-period, lasting approximately X months, arriving roughly Y months/years into this dasha) — [Rasi Lord] as your rasi lord makes this [brief description of what it brings]."*

**When the rasi lord dasha comes early (before age 50):** Still add the rasi lord declaration in that dasha's `expect`, but antardasha flagging in earlier dashas is optional (less critical since the main dasha itself is accessible).

### 7c. Lagna Caveat

The rasi lord affinity is a floor, not a ceiling. The lagna chart determines the final quality. You do NOT need to add a lagna caveat in every dasha — but if writing a concluding guidance note, you may mention: "the lagna chart modifies these timings — consult a jyotishi for your specific chart."

---

## 8. Antardasha Sub-Period Timing Reference

Within any mahadasha, the antardasha sequence follows the same Vimshottari order starting from the mahadasha lord itself. Approximate durations:

| Antardasha | Duration |
|---|---|
| Ketu | 4 months 27 days |
| Venus | 20 months |
| Sun | 6 months |
| Moon | 10 months |
| Mars | 7 months |
| Rahu | 1 yr 18 days |
| Jupiter | 11 months 6 days |
| Saturn | 1 yr 1 month 9 days |
| Mercury | 11 months 27 days |

Within a 20-year Venus mahadasha, the 4th antardasha (Venus–Mars) starts after Venus–Venus (3y 4m) + Venus–Sun (1y) + Venus–Moon (1y 8m) ≈ **6y into Venus dasha**, lasting about 14 months.

Within a 10-year Moon mahadasha, Moon–Mars is the 2nd antardasha, starting after Moon–Moon (10 months) ≈ **10 months into Moon dasha**, lasting 7 months.

---

## 9. Tamil Content Rules

Every `dashaDetail` entry must have a Tamil equivalent in `ta.dashaDetails[]`. The Tamil arrays must match the English arrays in count and order.

**Tamil writing rules:**
- Mirror the same structure: age-specific event → warning → remedy + antardasha note
- Do not translate literally — write in natural Tamil astrology register
- Use Tamil temple names (கீழப்பெரும்பள்ளம், மதுரை, ஸ்ரீரங்கம் etc.) where applicable
- Tamil antardasha notes follow the same rule as English — placed at the end of the `focus` field
- `ta.dashaThemes` array must have 8 entries matching the 8 English themes

---

## 10. Reference Table — All 27 Nakshatrams

### Dasha sequences by starting lord (theoretical full-balance ages)

**Group 1 — Start: Ketu** → Ashwini (#1), Magha (#10), Moolam (#19)
```
Ketu 0–7 · Venus 7–27 · Sun 27–33 · Moon 33–43 · Mars 43–50 · Rahu 50–68 · Jupiter 68–84 · Saturn 84–103
```

**Group 2 — Start: Venus** → Bharani (#2), Purva Phalguni (#11), Purvashadha (#20)
```
Venus 0–20 · Sun 20–26 · Moon 26–36 · Mars 36–43 · Rahu 43–61 · Jupiter 61–77 · Saturn 77–96 · Mercury 96–113
```

**Group 3 — Start: Sun** → Krittika (#3), Uttara Phalguni (#12), Uttarashada (#21)
```
Sun 0–6 · Moon 6–16 · Mars 16–23 · Rahu 23–41 · Jupiter 41–57 · Saturn 57–76 · Mercury 76–93 · Ketu 93–100
```

**Group 4 — Start: Moon** → Rohini (#4), Hasta (#13), Thiruvonam/Shravana (#22)
```
Moon 0–10 · Mars 10–17 · Rahu 17–35 · Jupiter 35–51 · Saturn 51–70 · Mercury 70–87 · Ketu 87–94 · Venus 94–114
```

**Group 5 — Start: Mars** → Mrigashirsha (#5), Chitra (#14), Dhanishta (#23)
```
Mars 0–7 · Rahu 7–25 · Jupiter 25–41 · Saturn 41–60 · Mercury 60–77 · Ketu 77–84 · Venus 84–104
```

**Group 6 — Start: Rahu** → Ardra (#6), Swati (#15), Shatabhisha (#24)
```
Rahu 0–18 · Jupiter 18–34 · Saturn 34–53 · Mercury 53–70 · Ketu 70–77 · Venus 77–97 · Sun 97–103
```

**Group 7 — Start: Jupiter** → Punarvasu (#7), Vishakha (#16), Purva Bhadrapada (#25)
```
Jupiter 0–16 · Saturn 16–35 · Mercury 35–52 · Ketu 52–59 · Venus 59–79 · Sun 79–85 · Moon 85–95 · Mars 95–102
```

**Group 8 — Start: Saturn** → Pushya (#8), Anuradha (#17), Uttara Bhadrapada (#26)
```
Saturn 0–19 · Mercury 19–36 · Ketu 36–43 · Venus 43–63 · Sun 63–69 · Moon 69–79 · Mars 79–86 · Rahu 86–104
```

**Group 9 — Start: Mercury** → Ashlesha (#9), Jyeshtha (#18), Revati (#27)
```
Mercury 0–17 · Ketu 17–24 · Venus 24–44 · Sun 44–50 · Moon 50–60 · Mars 60–67 · Rahu 67–85 · Jupiter 85–101
```

---

### Full per-nakshathiram rasi lord data

| # | Nakshathiram | Lord | Rasi | Rasi Lord | Rasi Lord Dasha Age | Antardasha Flag? |
|---|---|---|---|---|---|---|
| 1 | Ashwini | Ketu | Mesha | **Mars** | 43–50 | Venus–Mars (~yr 7 of Venus), Moon–Mars (~mo 10 of Moon) |
| 2 | Bharani | Venus | Mesha | **Mars** | 36–43 | Venus–Mars (~yr 7 of Venus — comes before Mars dasha) |
| 3 | Krittika | Sun | Mesha/Rishabam | **Mars/Venus** | Mars: 16–23, Venus: — (already born in Sun) | Moon–Mars (~mo 10), Rahu–Venus (~yr 1) |
| 4 | Rohini | Moon | Rishabam | **Venus** | 94–114 (very late) | Mars–Venus (~mo 5 of Mars), Rahu–Venus (~yr 9 of Rahu), Jupiter–Venus (~yr 9 of Jupiter), Saturn–Venus (~yr 10 of Saturn), Mercury–Venus (~mo 5 of Mercury) |
| 5 | Mrigashirsha | Mars | Rishabam/Mithuna | **Venus/Mercury** | Venus 84–104, Mercury 60–77 | Rahu–Mercury (~yr 2), Jupiter–Mercury (~yr 10), Saturn–Mercury (~yr 10) |
| 6 | Ardra | Rahu | Mithuna | **Mercury** | 53–70 | Rahu–Mercury (~yr 13 of Rahu), Jupiter–Mercury (~yr 12) |
| 7 | Punarvasu | Jupiter | Mithuna/Kadagam | **Mercury/Moon** | Mercury 35–52, Moon 85–95 | Saturn–Mercury (~yr 14), Saturn–Moon (~yr 17) |
| 8 | Pushya | Saturn | Kadagam | **Moon** | 69–79 | Mercury–Moon (~yr 11), Venus–Moon (~yr 6 of Venus) |
| 9 | Ashlesha | Mercury | Kadagam | **Moon** | 50–60 | Mercury–Moon (~yr 11 of Mercury, before Moon dasha) |
| 10 | Magha | Ketu | Simha | **Sun** | 27–33 | Venus–Sun (~yr 4 of Venus) |
| 11 | Purva Phalguni | Venus | Simha | **Sun** | 20–26 | Venus–Sun (~yr 4 of Venus — within same dasha!) |
| 12 | Uttara Phalguni | Sun | Simha/Kanni | **Sun/Mercury** | Sun IS the first dasha (0–6); Mercury 76–93 | Moon–Mercury (~yr 7 of Moon) |
| 13 | Hasta | Moon | Kanni | **Mercury** | 70–87 | Mars–Mercury (~yr 5), Rahu–Mercury (~yr 14), Jupiter–Mercury (~yr 12), Saturn–Mercury (~yr 10) |
| 14 | Chitra | Mars | Kanni/Thula | **Mercury/Venus** | Mercury 60–77, Venus 84–104 | Rahu–Mercury (~yr 2), Jupiter–Mercury (~yr 10) |
| 15 | Swati | Rahu | Thula | **Venus** | 77–97 | Jupiter–Venus (~yr 9), Saturn–Venus (~yr 10), Mercury–Venus (~mo 5) |
| 16 | Vishakha | Jupiter | Thula/Vrischika | **Venus/Mars** | Venus 59–79, Mars 95–102 | Saturn–Venus (~yr 10), Mercury–Venus (~mo 5), Moon–Mars (near end) |
| 17 | Anuradha | Saturn | Vrischika | **Mars** | 79–86 | Mercury–Mars (~yr 13), Ketu–Mars (brief), Venus–Mars (~yr 7) |
| 18 | Jyeshtha | Mercury | Vrischika | **Mars** | 60–67 | Mercury–Mars (~yr 13 of Mercury — within same mahadasha!) |
| 19 | Moolam | Ketu | Dhanusu | **Jupiter** | 68–84 | Venus–Jupiter (~yr 10), Sun–Jupiter (brief, ~mo 5), Moon–Jupiter (~yr 6), Mars–Jupiter (~yr 4), Rahu–Jupiter (~yr 8) |
| 20 | Purvashadha | Venus | Dhanusu | **Jupiter** | 61–77 | Venus–Jupiter (~yr 10 — within same dasha!), Moon–Jupiter (~yr 8), Mars–Jupiter (~yr 4) |
| 21 | Uttarashada | Sun | Dhanusu/Makara | **Jupiter/Saturn** | Jupiter 41–57, Saturn 57–76 | Moon–Jupiter (~yr 8), Mars–Jupiter (~yr 4), Rahu–Jupiter (~yr 14) |
| 22 | Thiruvonam | Moon | Makara | **Saturn** | 51–70 | Mars–Saturn (~yr 5), Rahu–Saturn (~yr 10), Jupiter–Saturn (~yr 10), Mercury–Saturn (~yr 10) |
| 23 | Dhanishta | Mars | Makara/Kumbha | **Saturn** | 41–60 | Rahu–Saturn (~yr 8), Jupiter–Saturn (~yr 12) |
| 24 | Shatabhisha | Rahu | Kumbha | **Saturn** | 34–53 | Rahu–Saturn (~yr 8 — within same dasha!), Jupiter–Saturn (~yr 12) |
| 25 | Purva Bhadrapada | Jupiter | Kumbha/Meenam | **Saturn/Jupiter** | Saturn 16–35 (early!), Jupiter IS first dasha | Saturn–Jupiter (~yr 8 — within Saturn dasha) |
| 26 | Uttara Bhadrapada | Saturn | Meenam | **Jupiter** | 43–63 | Mercury–Jupiter (~yr 11), Ketu–Jupiter (brief) |
| 27 | Revati | Mercury | Meenam | **Jupiter** | 85–101 | Mercury–Jupiter (~yr 11 of Mercury — within same dasha!), Ketu–Jupiter (brief), Venus–Jupiter (~yr 10), Sun–Jupiter (~mo 5), Moon–Jupiter (~yr 6), Mars–Jupiter (~yr 4), Rahu–Jupiter (~yr 8) |

**Note on "within same dasha":** When the rasi lord antardasha falls *within* the nakshathiram's own starting dasha (e.g., Purva Phalguni starts in Venus dasha and Venus–Jupiter antardasha falls within that same Venus period), this sub-period is **especially significant** and should be prominently called out in the `focus` field.

---

## 11. Special Notes by Nakshathiram Group

### Nakshatrams where rasi lord dasha comes very early (before age 25)
These are high-priority: the rasi lord blessing is available in youth. Write the expect field with emphasis on how the native's foundational life decisions are shaped by the rasi lord's direct influence.
- Purva Phalguni: Venus–Jupiter antardasha within Venus dasha (born in Venus)
- Uttara Phalguni: Sun IS the first dasha; Sun rules the rasi
- Purva Bhadrapada: Jupiter IS the first dasha; Saturn (rasi lord for Kumbha) comes early at age 16

### Nakshatrams where rasi lord dasha comes very late (after age 70)
These require the most antardasha flagging — name every significant antardasha of the rasi lord across the middle dashas, because the native needs those sub-windows.
- Rohini: Venus dasha at 94–114 — flag Venus antardasha in every dasha from Mars through Mercury
- Hasta, Thiruvonam: similar late arrival of rasi lord

### Nakshathirams with Mars as rasi lord (Mesha: Ashwini, Bharani, Krittika)
Mars dasha brings a direct rasi-lord return. The "buy your land" dasha interpretation is strongest here.

### Nakshatrams with Jupiter as rasi lord (Dhanusu: Moolam, Purvashadha; Meenam: Uttara Bhadrapada, Revati)
Jupiter as rasi lord elevates not just wealth but spiritual depth and wisdom. These nakshatrams' Jupiter dashas carry an aadhyatmika (spiritual) amplification beyond material gain.

### Thiruvonam special note
Saturn as rasi lord (Makara) means Saturn dasha (51–70) is significantly less fearful for Thiruvonam than for nakshatrams where Saturn is neutral. Write Saturn dasha for Thiruvonam with this trust-building message explicitly.

---

## 12. Completed Reference — Ashwini

Ashwini is the completed template. The file is at:
```
web/app/natchathiram/ashwini/visual/page.tsx
```

Key decisions made for Ashwini that apply to all:
- **Mars dasha (43–50):** Rasi lord declaration in `expect`, 2 antardasha notes (Venus–Mars, Moon–Mars) in `focus` of Venus and Moon dashas
- **Venus–Mars antardasha:** Flagged in Venus dasha `focus` as "first assertion of Mesha identity" (arrives ~year 7 of Venus dasha, ~age 13 for those entering Venus at 7)
- **Moon–Mars antardasha:** Flagged in Moon dasha `focus` as "disproportionately high-energy window" (10 months into Moon dasha, lasts 7 months)
- **8 dashas:** Ketu, Venus, Sun, Moon, Mars, Rahu, Jupiter, Saturn
- **Saturn dasha note:** Explicitly anchored by Saturn's house rulership from Aries (10th and 11th lord) to explain what makes it karmic-completion rather than just decline

---

## 13. Writing Checklist (per nakshathiram)

Before considering a nakshathiram's dasha section complete, verify:

- [ ] 8 dasha entries, all with `planet`, `period`, `ageRange`, `theme`, `detail`
- [ ] All ages match the correct group sequence from Section 10
- [ ] `theme` is evocative and age-appropriate (not generic)
- [ ] `expect` describes actual life events at that age — not planetary qualities
- [ ] `navigate` names specific health organs, specific sub-periods to watch
- [ ] `focus` includes specific temple, specific day/mantra, and antardasha notes
- [ ] Rasi lord's own dasha has the rasi lord declaration in `expect`
- [ ] Antardasha notes added in the 1–2 most relevant earlier dashas
- [ ] If rasi lord dasha is after age 60: antardasha notes in every middle dasha
- [ ] `ta.dashaThemes` has 8 entries
- [ ] `ta.dashaDetails` has 8 entries, all three fields (`expect`, `navigate`, `focus`)
- [ ] Tamil antardasha notes are included in the same `focus` fields as English
- [ ] TypeScript compiles: `npx tsc --noEmit` passes with no errors

---

## 14. What NOT to Do

- Do not write "this period may bring challenges" — name the challenge
- Do not use generic planetary keywords ("Mercury brings communication") — write age-specific events
- Do not add a 9th dasha (Mercury/Ketu after Saturn) — keep at 8
- Do not write antardasha notes in every single dasha — only in 1–2 relevant ones
- Do not omit the rasi lord declaration — it is mandatory
- Do not translate the English literally into Tamil — write naturally in Tamil astrology register
- Do not change the section labels (`expect`/`navigate`/`focus`) — they map to the component's "At This Age"/"Be Alert"/"Remedy & Opportunity"
