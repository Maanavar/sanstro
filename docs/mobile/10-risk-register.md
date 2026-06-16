# 10 — Risk Register

**Author hat:** PM + Business Analyst
**Purpose:** Named risks, impact, likelihood, mitigation, owner-action. Review each phase.

Scale: Impact/Likelihood = Low / Med / High.

| # | Risk | Impact | Likelihood | Mitigation |
|---|------|--------|-----------|------------|
| R1 | **Tamil rendering breaks on Android** (shaping, missing glyphs) | High | High | Bundle Noto Sans Tamil; verify clusters on API 29/31/33 in Week 1; separate Tamil line-height tokens |
| R2 | **Cookie-style auth shipped to mobile** | High | Med | Build T1/T2 (bearer+refresh) before any auth screen; don't reuse `web/lib/api.ts` transport |
| R3 | **No refresh token → users silently logged out** | High | High (if skipped) | T1 refresh + rotation + silent refresh on launch; reuse-revoke |
| R4 | **Single push token → multi-device users miss notifications** | Med | High | T3 device-token table + dispatcher fan-out before first push release |
| R5 | **Ads hurt retention / store rejection** | High | Med | Sacred ad-free zones; capped interstitials; guardrail metrics; ATT/UMP/Data-Safety compliance |
| R6 | **Low Indian ad eCPM → weak ad revenue** | Med | High | Treat ads as floor; prioritize reports/sub/commerce; target diaspora ARPU |
| R7 | **Rasi-palan API missing** (web-only today) | Med | High (known) | T4 build `/public/rasi-palan`; blocks Today/widget/push |
| R8 | **Solo team underestimates scope** (push, widget, store) | High | High | Guest-first sequencing; widget/push budgeted as real workstreams; realistic 8/14-wk split |
| R9 | **Loose MVP scope creep** | Med | Med | PRD §1 non-goals enforced; Phase C explicitly deferred |
| R10 | **Porting web UI/`usePersonalData`** slows build & adds complexity | Med | Med | Per-domain React Query; native components; reuse contracts not components |
| R11 | **Store review (astrology + ads + payments)** delays launch | Med | Med | Non-fear-based content; clear value for IAP; privacy labels; review buffer in timeline |
| R12 | **Timezone errors** (birth tz vs device tz) | Med | Med | Explicit tz capture/storage; QA matrix; reuse backend tz handling |
| R13 | **Cultural insensitivity / fear-based framing** harms trust/brand | High | Low | Reassuring tone guidelines; remedies-with-doshams; review by Tamil cultural lens |
| R14 | **Privacy/data-safety misconfig** (anonymous push, location) | Med | Med | Minimal data, clear consent, deletable; document in Play Data Safety + App Privacy |
| R15 | **Competitor (well-funded) fast-follows** | Med | Med | Move fast on daily-habit white space; build commerce moat (own temple/pariharam content) |
| R16 | **Backend migrations risk dev data** | High | Low | Follow CLAUDE.md DB rules; test up+down on `vinaadi_test`; never touch `vinaadi_dev` |

## Top 5 to act on now
1. **R1** Tamil render spike (Week 1).
2. **R2/R3** Mobile auth contract (T1/T2) — critical path.
3. **R7** Rasi-palan API (T4) — blocks the core guest screen.
4. **R4** Device-token table (T3) — before first push.
5. **R8** Honest sequencing & scope (guest-first, widget/push as real work).
