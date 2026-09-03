# Handoff prompt — Vinaadi UX blindspot remediation (continue)

Paste everything below the line into the next coding agent.

---

You are continuing a UX remediation programme on the **Vinaadi AI** repo (Tamil
Thirukanitham astrology app: FastAPI backend + Next.js web + React Native mobile).

## 0. Environment rules — read before running anything

- Repo root is exactly `D:\sanstro`. Start every command from there.
- **Use PowerShell**, not Bash. Chain with `;` — PowerShell 5.1 has no `&&`.
  No `head` (use `Select-Object -First N`). Don't `2>&1` native executables.
- **Never round-trip source files through PowerShell `Get-Content`/`Set-Content`.**
  It adds a UTF-8 BOM *and* mojibakes Tamil. Half the strings you'll touch are
  Tamil. Use the Read/Edit/Write tools, or `python -c` with explicit
  `io.open(..., encoding='utf-8', newline='')`.
  There is a `web/lib/text-encoding-guard.test.ts` that will catch you.
- New **dashboard** strings go in `web/lib/dashboard-i18n.ts` via `s(en, ta)` and
  render through `dt(entry, lang)` — do **not** add new inline
  `lang === "ta" ? … : …` ternaries (go-forward policy in that file's header).
  Marketing strings go in `web/lib/marketing-i18n/`.
- Any **new Tamil** string gets a `// New Tamil, pending native review` comment
  (CLAUDE.md rule). Don't re-spell existing Tamil terms.
- Never hardcode real personal data (real birth details, names, coordinates) in
  tests or fixtures — use clearly synthetic identities.
- If you add a backend endpoint, add a typed wrapper in
  `packages/shared/src/api/` and re-read the FastAPI route decorator to confirm
  path-vs-query and HTTP verb. Two wrappers have silently drifted before.
- Design constraints the owner has already ruled on:
  - **No coloured left-border stripes on cards.** It reads as an AI-UI tell.
  - Display naming follows **Tamil almanac usage**, not Sanskrit.
  - Never render a bilingual "title echo" (active language only, no faint
    other-language duplicate).
  - There is a **permanent axe accessibility gate**; don't regress contrast.

## 1. Context

Two independent persona audits of the same brief exist. Read both:

- `docs/UX_BLINDSPOT_AUDIT_2026-08-22.md` — Claude Code, 61 findings with
  severity (S0–S4) and per-finding IDs (`A-###` Karthik, `B-###` Jake) and file
  citations. **This is the primary work list.**
- `docs/VINAADI_UX_BLINDSPOT_AUDIT_2026-08-22.md` — Codex, same brief,
  independent. Substantially agrees. Carries two items the other lacks
  (a first-result comprehension layer; findability without Vedic vocabulary)
  plus a 360/390px mobile pass.

The two personas: **Karthik** (28, Chennai, reads Tamil, knows the words but has
never practised) and **Jake** (31, Portland OR, zero Indian-astrology context,
reads no Tamil). Judge every screen with *only* that persona's knowledge.

## 2. Already done — do NOT redo

All of the following is committed to the working tree, typechecks, lints clean,
and passes the suite (472 existing + 14 new tests).

| Finding | Fix | Files |
|---|---|---|
| B-016 (S0) | Chart grid printed Tamil script in English mode. `occupantAbbr` now resolves against `GRAHA_ABBR_EN` when `lang === "en"`. Fixed at the render funnel, **not** in `buildD1CellDetail` (cell builders are pure data and asserted as such). | `web/components/dashboard-charts.tsx` |
| B-017 (S0) | New `ChartLegend` under D1 and D9 grids: graha letters → full names, the R/C/✦/V marks, and a lunar-nodes explainer. Built from the chart's own occupants. D9 legend suppresses combustion (D9 cells can't carry it). | `web/components/dashboard-charts.tsx`, `web/lib/dashboard-i18n.ts` (`CHART_LEGEND`) |
| B-008 (S0) | Guest modal defaulted `birthTimezone: "Asia/Kolkata"` for everyone → silently wrong charts outside India. Now `Intl.DateTimeFormat().resolvedOptions().timeZone`. | `web/components/dashboard-guest-chart-modal.tsx` |
| A-005 / B-009 (S2) | `field_time_optional` rewritten to name the consequence ("Even 15 minutes changes your Lagna and every house in the chart…"). Also applied to the guest modal's birth-time field, which had no helper. | `web/lib/i18n.ts`, `dashboard-guest-chart-modal.tsx` |
| A-006 (S4) | `/learn/why-birth-time-matters` (shipped but unlinked) now opens as `DashboardLearnArticleModal` from the setup birth-time field — modal, not navigation, so signup state survives. | `web/components/dashboard-setup-tab.tsx` |
| A-029 / A-031 / B-024 (S2) | Porutham: "Most families proceed at 5–8 out of 10" against the score ring; a named-blocker de-escalation paragraph beside the Rajju/Vedha chip. Verdict itself unchanged. | `web/components/dashboard-tools-porutham-nova.tsx` |
| A-012 | Dead App Store link (`id0000000000`) null-guarded behind `APP_STORE_URL`, matching `home-content.tsx`. | `web/components/dashboard-setup-tab.tsx` |
| A-041 partial | `GLOSSARY` expanded 20 → 42 entries, adding the daily vocabulary (panchangam, tithi, karana, vara, yogam, paksham, rahuKalam, yamagandam, kuligai, nallaNeram, abhijit, hora, chandrashtama, karinaal, soolam, parigaram, amirdhadhi, muhurtham, lagnam, pada, peyarchi, sadeSati). | `web/lib/glossary.ts` |
| **Enabler** | `GlossaryTerm` rewritten to **portal its tooltip to `<body>`** with viewport positioning, flip-below-when-no-room, Escape, and scroll/resize reposition. It previously rendered as an absolutely-positioned child and was clipped by any `overflow:hidden`/scrolling ancestor. **This unblocks glossing anywhere — use it freely now.** | `web/components/glossary-term.tsx` |
| A-033 partial | Calendar day panel: 7 spec rows + the "Panchangam" section heading now glossed. Added a `data-spec-row` hook so tests anchor on the row, not on label nesting. | `web/components/dashboard-calendar-tab-nova.tsx` |
| A-014 | Today ribbon: the day's star was labelled "Nakshatram" while the natal star is "Birth Star" — readers took the day's star for their own. Renamed "Today's star" and glossed; tithi glossed. | `web/components/dashboard-today-ribbon-nova.tsx` |
| Guards | `web/components/dashboard-charts.test.tsx` (9 tests, pins **rendered** script — the data-builder tests passed either way, which is why the bug survived), `web/lib/glossary.test.ts` (5 integrity tests). | new files |

## 3. Gotchas already discovered — these will cost you time otherwise

1. **`PrintRasiChart` in `web/components/chart-generate-inline-panel.tsx:187` is
   deliberately Tamil-only** (hardcoded `நவாம்சம்`/`லக்னம்`, `genderTA`, no `lang`
   prop). It's a traditional printed jathagam sheet. **Do not "fix" it.**
2. **Today ribbon kala legend is still unglossed on purpose.** Rahu Kalam /
   Yamagandam / Kuligai / Nalla Neram in
   `dashboard-today-ribbon-nova.tsx` sit inside two `overflow: hidden`
   containers (legend cell ellipsis + grid rounded corners). Glossing was backed
   out and a comment left in the `Segment` type. **The portal rewrite has now
   removed that blocker — re-landing this is task T1 below.**
3. `web/components/dashboard-calendar-day-drawer-nova.test.tsx:222` has a
   **pre-existing** typecheck error (`Property 'mock' does not exist on type
   '((delta: number) => void) | Mock<Procedure>'`). It is untracked in-flight
   work by someone else and was failing before this programme started. Don't
   attribute it to your changes; coordinate before rewriting it.
4. `plainLang()` and `plainLangBiText()` in `web/lib/plainlang.ts` have **zero
   callers tree-wide**. A complete plain-language table for planets, rasis,
   Chandrashtama, retrograde, combust and Vargottama is written and switched
   off. Several tasks below are "wire the thing that already exists".
5. There is **no glossary page, no help page, no FAQ route** in `web/app`.
   Verified absent.
6. `web/lib/tn-cities.ts` is a hand-listed 145-city array (Tamil Nadu + Tamil
   diaspora). Portland, Boston, Denver, Philadelphia and Minneapolis are absent.

## 4. Remaining work, in priority order

### TIER 1 — before launch

**T1. Re-land the Today-ribbon kala glossing** *(now unblocked; start here — it's
the smallest task with the largest daily reach)*
Add `glossary?: GlossaryKey` back to the `Segment` type in
`dashboard-today-ribbon-nova.tsx`, tag the four segments
(`rahuKalam`/`yamagandam`/`kuligai`/`nallaNeram`), and wrap `s.legendName` at the
legend render site. Verify in a real browser that the portalled tooltip is not
clipped and is readable at 390px. Remove the explanatory comment in the type.
*Acceptance:* all four terms tappable and fully visible on the Today tab.

**T2. Sade Sati / Ashtama Sani emotional safety (A-022, S2)**
`dashboard-family-charts-hybrid.tsx:375` (`HySaniCard`). An active cycle renders
a red card naming a 7½-year Saturn period with **no end date, no prevalence, no
action**. First check whether `SaniCycleData` already carries phase dates
(`web/lib/types.ts`, and the backend `sani_cycle` service); if not, that's a
small backend addition. Render: prevalence ("reaches almost everyone about three
times in a lifetime"), current phase, **end date**, and the remedy the app
already computes. The `sadeSati` glossary entry already carries the calibrated
wording — reuse its framing.
*Acceptance:* no active-cycle card renders without duration + normalcy.

**T3. Two Sani cycles read as two verdicts (A-023, S2)**
Same card shows "Sani · from Moon" and "Sani · from Lagna" as equals. When they
disagree the reader takes the worse one. Name one primary (the traditional
reckoning) and mark the other a cross-check.

**T4. Ask detail level at signup (A-039, S4)**
`BEGINNER`/`BALANCED`/`TRADITIONAL` exists, defaults to `BALANCED`
(`app/schemas/auth.py:59`), and is buried in
`dashboard-settings-session-tab.tsx:641`. Ask it once during onboarding in plain
terms — *"How much astrology do you already know?"* → "I've heard the words but
never studied it" maps to `BEGINNER`. Consumers already exist
(`advanced-astrology-gate.tsx`, `dashboard-dasha.tsx`, journal, plan-decisions).

**T5. Promote the two/five-minute reading to the first post-calculation screen**
`app/services/one_minute_reading_service.py` produces the best plain-language
prose in the product (jargon quarantined in a "what this rests on" line). It
renders inside Family & Charts behind a member selector
(`dashboard-family-charts-hybrid.tsx:1017`). Both personas would have a
different first session if this were what they saw after their chart calculated.
Also add it as a third onboarding checklist step — currently the checklist is
two data-entry steps (`web/lib/i18n.ts:1093-1096`).

**T6. Write `/learn/vedic-vs-western` (B-001, S0)**
Highest-leverage missing artefact for Jake. Four claims: different zodiac
calculation from Western; rising sign (lagnam) over sun sign; 27 lunar stars as
well as 12 signs; life runs in multi-year planetary periods. Link from the hero,
the nav, and first dashboard load. Add to `LEARN_ARTICLES_CONTENT`
(`web/components/dashboard-learn-content.ts`) so it's readable in-app too.
Note: today's nearest article, `/learn/what-is-thirukanitham`, opens on "Drik vs
Vakya" — an intra-tradition question only an insider has.

**T7. Collapse the four parallel timing systems (A-013, S2)**
Today shows Nalla Neram, Gowri, Abhijit and Horai side by side with Rahu Kalam /
Yamagandam / Kuligai. A reader who knows only Rahu Kalam cannot tell which to
obey and may act on the wrong one. Promote **one** recommended window (the app
already computes `title_recommended_nalla_neram`); demote the rest behind "Other
traditional timings", each with a one-line "what this system is".

**T8. First-result comprehension layer** *(from the Codex audit, Tier 1 #1)*
On first Today load: what the score means, what "avoid" actually scopes to
(new beginnings — ongoing work is unaffected), one action, and a Why trail.
Pairs with T5.

### TIER 2 — first month

- **T9.** Ship `/dashboard/glossary` as an index over `GLOSSARY`, linked from nav
  and from a "see all" in `GlossaryTerm`. (A-041)
- **T10.** Wire `plainLangBiText` as the universal tooltip source in `BALANCED`
  mode — that is literally what `mode_balanced_desc` ("Some terms, with
  tooltips") already promises. (A-042, B-021)
- **T11.** Decouple language from expertise: an English-language reader should
  get English planet names regardless of detail level. Today `tPlanetLord`
  Tamil-transliterates and the plain gloss is `BEGINNER`-only. (B-031)
- **T12.** Disambiguate the three false-familiarity terms in English mode on
  first use per screen: **Yoga** (reads as exercise), **House**, **Transit**.
  Glossary entries exist for two. (B-012/13/14)
- **T13.** Calendar: add a plain-English day summary line ("A generally
  favourable day. Avoid 10:30–12:00.") so the screen has value without the
  vocabulary. Then make interpretation first, facts progressive. (B-026)
- **T14.** Gloss the remaining Today terms: "Dasa layer / Panchangam / Transit"
  score components (A-016), "Horai now" → "Planetary hour" (A-017),
  Chandrashtama chip (A-015 — reuse the definition already in
  `chandrashtama_warning`).
- **T15.** Planet table: "House (L)" → "House (from Lagna)" (A-020); tooltip the
  dignity chips Combust/Vargottama/Cazimi (A-021); give Pada a plain rendering
  (B-020).
- **T16.** "Activated by current Dasha" → "Active right now (your current
  planetary period is triggering it)" (A-036).
- **T17.** Cultural framing paragraphs above porutham, muhurta and remedies —
  reuse the shipped Learn articles. Surface the existing secular-remedy mode
  (`remedies_mode_secular`) as a first-class choice, not a hidden mode. Change
  "Prescribed — wear these" to descriptive register. (B-022, B-035, B-037, A-038)
- **T18.** Defer Family Vault setup until after a first result; rename "vault" →
  "your family"; auto-create on first member. (A-007, A-010, Codex T2 #4)

### TIER 3

A-024 (retitle chart-explanation sections by outcome), A-025 (make "Tap to
explain" a visible chip), A-026/A-027 (deep-link terms into Explore; rename the
tab "Understand"; index interface vocabulary into its search), A-028 (four new
Learn articles: what a dasa/house/lagnam is, what the daily score means),
A-037 (lead yoga rows with the effect, Sanskrit name as subtitle), A-008
(collapse lat/lng behind a disclosure), A-040 (hide raw IDs in Settings),
A-004 (bilingualise + de-jargon the login left panel), B-004 (populate `desc` on
every nav item; lead English labels with function), A-032 (Person 1/2 outside
MARRIAGE context), B-027/B-028 (Tamil month Gregorian range; reuse the existing
Waxing/Waning rendering in Calendar).

Plus from Codex: a **360px/390px mobile pass** ensuring safety/action text
precedes dense tables, and an Advanced mode with prerequisites for Vargas /
Shadbala / alternate dasas.

## 5. Needs a human decision — do NOT act unilaterally

- **B-006, the birth-place dataset.** `web/lib/tn-cities.ts` is 145 hand-listed
  cities; any non-diaspora user is asked to hand-enter latitude and longitude on
  the first form. This is the single remaining hard functional blocker. Fixing it
  means picking a geocoder (vendor, API key, cost, privacy) or bundling a
  world-cities dataset. **Ask the owner which, and whether birth-place lookup may
  make a third-party network call, before implementing.** An interim
  non-blocking improvement you *may* do: a map picker or a "paste a Google Maps
  link" fallback, and clearer timezone confirmation (B-007, B-010).

## 6. Verification (run all before reporting done)

```powershell
Set-Location 'D:\sanstro\web'
npx tsc --noEmit -p tsconfig.json          # expect ONLY the known pre-existing
                                           # dashboard-calendar-day-drawer-nova.test.tsx:222 error
npx vitest run                             # expect all green (486+ tests)
npx next lint --file <each file you changed>
```

Then confirm no BOM / valid UTF-8 on every file you touched:

```powershell
python -c "import io,sys
for f in sys.argv[1:]:
    b=io.open(f,'rb').read()
    print(('BOM!' if b[:3]==b'\xef\xbb\xbf' else 'no-bom'), f)
    b.decode('utf-8')" path\to\file1 path\to\file2
```

**Do a real browser pass** for anything involving tooltips, the chart legend, or
Today/Calendar layout. The weakest part of the source-level audit is mobile
density and information hierarchy; those findings need eyes, not grep. Both
audits were static — neither ran the app.

## 7. Working agreement

- Work in priority order; T1 first. Land tasks in small reviewable commits.
- Add a regression test for anything user-visible you fix. Prefer tests that pin
  **rendered output** over tests that pin data structures — the chart bug
  survived precisely because the data-layer tests passed either way.
- If a fix would dilute doctrinal accuracy, don't. The rule this codebase works
  to is: **Layer 1** plain-language meaning always visible, **Layer 2** the named
  traditional concept one tap away, **Layer 3** the calculation and doctrine one
  more tap away — never hidden, never first.
- Report honestly what you did and didn't finish, and flag anything you changed
  that you could not verify in a browser.
