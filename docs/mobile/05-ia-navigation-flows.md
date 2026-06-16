# 05 — Information Architecture, Navigation & Flows

**Author hat:** UX Architect
**Purpose:** The app's skeleton — how screens relate and how users move.

---

## 1. Navigation model
Bottom tab bar (Expo Router). Same shell for guest & registered; content adapts to tier.
No top nav bar, no footer, no SEO pages in-app.

```
┌──────────────────────────────────────────────┐
│                                              │
│                  SCREEN AREA                  │
│                                              │
├──────────────────────────────────────────────┤
│  ☀ Today  │ 📅 Panchangam │ 🧮 Tools │ 👤 Me │
└──────────────────────────────────────────────┘
```

| Tab | Guest content | Registered content |
|-----|---------------|--------------------|
| **Today** | Rasi palan + key panchangam + festival | Personal guidance + score + windows + alerts (rasi palan demoted to card) |
| **Panchangam** | Full daily detail, swipe days, calendar | + personal chandrashtama/peyarchi flags |
| **Tools** | Porutham, friendship, muhurta | + saved results, personalized muhurta |
| **Me** | Rasi picker, language, "Create account", settings, about | Profile, notification inbox, settings, sign out |

## 2. Route map (Expo Router file tree)
```
app/
  _layout.tsx                 # providers (RQ, theme, session, ads)
  (tabs)/_layout.tsx          # bottom tabs
  (tabs)/index.tsx            # Today
  (tabs)/panchangam/index.tsx # Panchangam day
  (tabs)/panchangam/calendar.tsx
  (tabs)/tools/index.tsx
  (tabs)/tools/porutham.tsx
  (tabs)/tools/porutham-result.tsx
  (tabs)/tools/friendship.tsx
  (tabs)/tools/muhurta.tsx
  (tabs)/me/index.tsx
  onboarding/rasi-picker.tsx  # guest first-run
  onboarding/location.tsx
  auth/login.tsx              # Phase B
  auth/signup.tsx
  auth/forgot.tsx
  onboarding/birth-profile.tsx# Phase B (account)
  modal/upgrade-prompt.tsx    # contextual signup
  modal/report-unlock.tsx     # rewarded/paid
```

## 3. App-open decision flow
```
Launch
 → has cached session token?
     yes → silent refresh → authenticated shell (registered Today)
     no  → has local rasi+location?
              yes → guest shell (Today)
              no  → first-run rasi-picker → location → guest Today
 (always render cached content first; refresh in background)
```

## 4. Key flows (diagrams)

### Guest first-run
```
rasi-picker (pick rasi/nakshatra) → location (detect/confirm) → Today
   [no login, stored locally, optional push opt-in card on Today]
```

### Push opt-in (guest)
```
Today (after 1st or 2nd session) → soft card "Daily rasi palan at your time?"
   → system permission → choose time → register anonymous device token
```

### Guest → account (contextual)
```
intent moment (3rd rasi view / porutham open / tap personal feature)
   → upgrade modal → signup → birth-profile (prefill rasi/location) → registered Today
```

### Porutham (free → paid)
```
Tools → Porutham → enter A + B → free summary
   → "Unlock full report" → [rewarded ad] or [buy IAP] → full report → share/save(acct)
```

## 5. State & deep-link surfaces
- Deep links: `vinaadi://today`, `vinaadi://panchangam/{date}`, `vinaadi://tools/porutham`,
  `vinaadi://report/{id}`. Push taps route here.
- Universal/App links mirror web URLs where sensible (panchangam date) for web→app handoff.

## 6. Empty / loading / error (global rules)
Every data screen defines all three; see per-screen specs in `06`. Defaults: skeletons on
load, cached-then-refresh, friendly Tamil error with retry, never a blank screen.
