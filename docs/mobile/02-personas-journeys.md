# 02 — Personas, Jobs-to-be-Done & Journeys

**Author hat:** Product Designer + PM
**Purpose:** Who we serve and the jobs they hire the app for.

---

## 1. Primary personas

### P1 — "Daily Devotee" Lakshmi (38, Chennai, homemaker)
Checks rahu kalam / nalla neram before anything important; follows festivals; reads her rasi
palan each morning. Mid-range Android, data-conscious, Tamil-first.
- **JTBD:** *"Tell me if today is good for what I'm about to do, in Tamil, instantly."*
- **Needs:** fast panchangam, rasi palan, festival alerts, share to family WhatsApp.
- **Monetization:** ads; later devotional commerce (pooja, pariharam).

### P2 — "Diaspora Seeker" Karthik (34, Singapore, engineer)
Away from home traditions, wants to stay connected; willing to pay; bilingual.
- **JTBD:** *"Help me make life decisions with my chart, the way my family astrologer would —
  but private and on my schedule."*
- **Needs:** personalized daily guidance, muhurta, porutham for marriage, quality reports.
- **Monetization:** **subscription + paid reports** (high ARPU).

### P3 — "Marriage Decision-Maker" Revathi (52, Madurai, parent)
Evaluating matches for her child; porutham is the job.
- **JTBD:** *"Is this match compatible, and what are the doshams/remedies?"*
- **Needs:** porutham (free hook → detailed paid report), remedies, second opinions.
- **Monetization:** **paid porutham report** (high intent), rewarded-ad unlock.

### P4 — "Curious Newcomer" Arjun (26, Coimbatore)
Casual, tries porutham/rasi palan for fun, low commitment.
- **JTBD:** *"Quick fun + maybe something useful."*
- **Needs:** zero-friction guest tools, shareable results.
- **Monetization:** ads; soft funnel to account.

## 2. JTBD summary (forces)

| Job | Trigger | Today's alternative | Our advantage |
|-----|---------|---------------------|---------------|
| Know if now is auspicious | About to start a task/travel/purchase | Paper calendar, calendar app | Personalized + precise + instant |
| Daily outlook | Morning routine | Newspaper rasi palan, TV | In-app + push + personalized upgrade |
| Marriage compatibility | Match proposed | Family astrologer (₹, time) | Free instant porutham + paid depth |
| Pick an auspicious time | Event planning | Astrologer visit | Muhurta tool, free → personalized |
| Remedy for a problem | Worry/dosham | Temple visit, astrologer | Guidance + devotional commerce |

## 3. Core journeys

### J1 — Guest daily habit (P1/P4) — the retention engine
```
Morning push "இன்றைய ராசி பலன் & நல்ல நேரம்"
  → tap → app opens to TODAY (cached, <1s)
  → see rasi palan + nalla neram + rahu kalam + festival
  → (scroll; 1 native ad below the fold)
  → maybe open Tools (porutham) or share card to WhatsApp
  → close. Repeat daily.
```
Success = returns ≥4 days/week. No account required ever.

### J2 — Guest → Registered conversion (P2/P3)
```
Guest uses rasi palan / porutham several times
  → contextual prompt at intent moment ("get guidance from YOUR chart")
  → onboarding (birth date/time/place; rasi/location pre-filled from guest)
  → personalized Today (score, windows, alerts)
  → push opt-in for personal alerts
```
Success = ≥8–12% of active guests create accounts.

### J3 — Marriage porutham (P3) — high-value
```
Tools → Porutham → enter two birth details
  → free summary score + headline
  → "Unlock full 10-kuta report + doshams + remedies"
       → rewarded ad (free tier) OR paid report (IAP)
  → share / save (save requires account)
```

### J4 — Decision/muhurta (P2)
```
Tools → Muhurta → pick event + date range + place
  → top-3 auspicious slots (free, panchangam-based)
  → "Personalized muhurta uses your chart + dasha" → signup upgrade
```

## 4. Emotional design notes
- Tone: reassuring, respectful, never fear-based. Doshams framed with remedies, not dread.
- Tamil cultural cues: festival warmth, devotional imagery used tastefully.
- Trust: always show "Thirukanitham-precise" + transparent "why" for guidance.
