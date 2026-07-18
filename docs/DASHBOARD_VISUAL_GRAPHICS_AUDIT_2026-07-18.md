# Dashboard Visual/Graphics Audit — 2026-07-18

Scope: `web/app/dashboard/**` and the ~83 `dashboard-*` components it renders (Today, Calendar, Family & Charts, Transit & Dashas, Goals/Plan, Life Area, Explore, Tools, Settings). Question asked: where can graphics, animation, and imagery be introduced or improved, and in what order.

## 1. What's already there

| Layer | State |
|---|---|
| Animation library | `framer-motion` is installed and used, but only in **6 of 83** dashboard components (`dashboard-ui-nova`, `dashboard-workspace`, `dashboard-today-ribbon-nova`, `dashboard-learn-article-modal`, `dashboard-hero`, `dashboard-edit-profile-modal`), and lightly even there (2–7 call sites each). Motion is concentrated in navbar chrome and modals, not in the data panels users spend the most time on. |
| Icon system | `lucide-react` was adopted for the top navbar (bell/settings/logout — see SHD-02 in memory) but most tab content still falls back to raw emoji as icon stand-ins (`✦`, `🌙`, `🪷`, `🦚`, `🐘`) instead of a drawn icon/glyph set. |
| Celestial system | `celestial-ambient-nova.tsx` (phase-accurate sky backdrop) and `celestial-glyph-nova.tsx` (sun/moon hero glyph) are real, committed, and live — but only wired into the Today tab, login, and the outer workspace shell. Not extended to Transits, Plan, or Life Area tabs, which look visually flat by comparison. |
| Birth chart rendering | `RasiChart` / `NavamsaChart` / `JathagamKattam` in [dashboard-charts.tsx](web/components/dashboard-charts.tsx) are plain CSS-grid boxes with 2-letter planet abbreviations (`Su`, `Ma`, `Ke`) as text. No planet glyphs, no rasi iconography, no diagonal/traditional South-Indian chart styling, no combustion/retrograde visual treatment beyond a superscript "R". This is the single most iconic visual in any astrology product and it currently reads as a spreadsheet. |
| Annual Wrapped | [dashboard-annual-wrapped.tsx](web/components/dashboard-annual-wrapped.tsx) — the one screen structurally built to be screenshotted/shared (Spotify-Wrapped-style year review) — has **zero** gradient, SVG, motion, or image usage. Pure DOM text on a card. |
| Shareable image export | `dashboard-share-card.tsx` and `panchangam-share-card.tsx` already do canvas-based image generation for sharing — a proven, working pattern that hasn't been extended to other shareable moments (Wrapped, a good muhurta pick, a life-event log entry). |
| Illustration assets | `web/public/deities/` is wired end-to-end (share-card code loads `/deities/<key>.png`, falls back to a gradient + ॐ glyph) but the directory contains **only a README** — zero actual art has ever been dropped in, so every surface has been silently running on the fallback since this was built. `web/public/calendar/*.png/.jpg` exist but are 1–3.6 KB placeholder-grade files, not finished art. |
| Dead code | `day-strip.tsx` (an animated "glide bar" week-score strip, framer-motion + reduced-motion-safe) is fully built and exported but has **zero import sites** anywhere in the app — it was built (see Nova Motion Pass memory: "day-strip glide") and never wired in, or was wired in and later orphaned. |

## 2. Gaps, ranked by leverage

**P0 — highest visibility, most-viewed surfaces**

1. **Birth chart visual upgrade** — replace text abbreviations with a proper planet-glyph/rasi-icon treatment on `RasiChart`/`NavamsaChart`/`JathagamKattam`. This is the highest-traffic visual in the product (Family & Charts tab, every guide page, every share card) and currently has the least design investment relative to its importance.
2. **Annual Wrapped visual pass** — gradients, staged motion reveals per card, and a canvas export using the existing share-card pattern. This is the one feature designed to be shared outside the app; right now it would screenshot as plain text.

**P1 — system consistency**

3. **Extend the celestial ambient/glyph system** beyond Today into Transits, Plan, and Life Area tabs, so the "sky" visual language reads as one system rather than a one-off on the landing tab.
4. **Finish the icon migration** — replace remaining emoji stand-ins (`✦`, `🌙`, `🪷`, `🦚`, `🐘`) with drawn icons: lucide for generic UI, a small custom Vedic glyph set (planets, rasis, deities-as-line-icons) for domain-specific spots where lucide has no equivalent.
5. **Source real deity/calendar art** — the deity medallion and calendar event-image pipeline are fully wired and waiting; this is asset production, not engineering, and can land independently of any code change.

**P2 — polish, once P0/P1 land**

6. **Motion pass for data-dense panels** — dasha timelines, transit panels, life-areas cards currently render statically; entrance/stagger animation exists elsewhere (per memory, Nova Motion Pass Tiers 0–2) but was never extended to these panels.
7. **Wire up or delete `day-strip.tsx`** — five-minute decision, but it's dead code either sitting on a shippable feature (a week-at-a-glance score strip with a nice glide animation) or cluttering the tree.

**P3 — larger bets, do after the above**

8. North/South Indian chart style toggle (personalization).
9. Animated Gantt-style dasha timeline visualization.
10. Zodiac wheel visualization for transit tracking (replacing/augmenting the current list-based transit display).

## 3. Sequencing recommendation

Do **P0 items first and in isolation** — they're the two places where the payoff-per-line-of-code is highest and neither depends on new art assets, only code + the existing design tokens. P1.5 (asset sourcing) can run in parallel since it's not an engineering task. P1.3/P1.4 (system extension, icon migration) should follow once the chart/Wrapped work establishes the visual pattern to extend. P2/P3 come after.

One thing worth flagging before adding more: per memory, several previous visual/motion efforts on this branch (Nova Motion Pass Tier 2–3, Login Welcome animation, Contrast+Depth pass) are still marked "not committed" or "browser pass pending." Worth a quick live-browser check on those first so we're not stacking a third layer of unverified visual work on top of two already waiting for verification.

## 4. Suggested first checkpoint

Start with **item 1 (birth chart visual upgrade)** — scope it to `RasiChart` first (most-used of the three), get sign-off on the visual direction (planet glyph set, color treatment, whether to keep the current tap-to-explain interaction), then apply the same treatment to `NavamsaChart` and `JathagamKattam`.
