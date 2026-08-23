# Handoff prompt — Vinaadi UX blindspot remediation (round 2)

Supersedes `docs/UX_BLINDSPOT_HANDOFF_PROMPT.md`. Same programme, state re-verified
against the tree on 2026-08-23: nothing new landed since that prompt was written,
so T1 onward are all still open. Paste everything below the line into the agent.

---

You are continuing a UX remediation programme on the **Vinaadi AI** repo (Tamil
Thirukanitham astrology app: FastAPI backend + Next.js web + React Native mobile).
A previous agent closed the first tranche; your job is everything after it.

## 0. Environment rules — read before running anything

- Repo root is exactly `D:\sanstro`. Start every command from there.
- **Use PowerShell**, not Bash. Chain with `;` — PowerShell 5.1 has no `&&`.
  No `head` (use `Select-Object -First N`). Don't `2>&1` native executables.
- **Never round-trip source files through PowerShell `Get-Content`/`Set-Content`.**
  It adds a UTF-8 BOM *and* mojibakes Tamil, and half the strings you'll touch are
  Tamil. Use the Read/Edit/Write tools, or `python -c` with explicit
  `io.open(..., encoding='utf-8', newline='')`. `web/lib/text-encoding-guard.test.ts`
  will catch you.
- New **dashboard** strings go in `web/lib/dashboard-i18n.ts` via `s(en, ta)` and
  render through `dt(entry, lang)`. Do **not** add new inline
  `lang === "ta" ? … : …` ternaries — that file's header states the go-forward
  policy. Marketing strings go in `web/lib/marketing-i18n/`.
- Any **new Tamil** string gets a `// New Tamil, pending native review` comment.
  Don't re-spell existing Tamil terms; display naming follows **Tamil almanac
  usage**, not Sanskrit.
- Never hardcode real personal data (real birth details, names, coordinates) in
  tests, fixtures or docs — use clearly synthetic identities.
- New backend endpoint ⇒ typed wrapper in `packages/shared/src/api/`, and re-read
  the FastAPI route decorator to confirm path-vs-query and HTTP verb. Two wrappers
  have silently drifted before.
- Owner has already ruled on these — don't relitigate:
  - **No coloured left-border stripes on cards.** Reads as an AI-UI tell.
  - Never render a bilingual "title echo" (active language only, no faint
    other-language duplicate).
  - There is a **permanent axe accessibility gate**; don't regress contrast.

## 1. Context

Two independent persona audits of the same brief. Read both:

- `docs/UX_BLINDSPOT_AUDIT_2026-08-22.md` — 61 findings, severity S0–S4, per-finding
  IDs (`A-###` Karthik, `B-###` Jake), file citations. **Primary work list.**
- `docs/VINAADI_UX_BLINDSPOT_AUDIT_2026-08-22.md` — independent second audit, same
  brief. Substantially agrees; adds a first-result comprehension layer, findability
  without Vedic vocabulary, and a 360/390px mobile pass.

Personas: **Karthik** (28, Chennai, reads Tamil, knows the words but has never
practised — his failure mode is *false fluency*) and **Jake** (31, Portland OR,
zero Indian-astrology context, reads no Tamil — his failure modes are functional
blocks and false familiarity: "yoga", "house", "transit"). Judge every screen with
*only* that persona's knowledge.

## 2. Verified state of the tree (2026-08-23) — do NOT redo

Branch `harden/production-readiness`. **All of the following is in the working tree
but UNCOMMITTED** — check `git status` before you start and decide with the owner
whether to commit it first; don't destroy it.

⚠️ On 2026-08-23 another session was editing this same working tree live (T1–T3
landed mid-audit). Re-run `git status` and `git diff --stat` yourself before
believing any table in this document, and confirm with the owner that no one else
is working the list before you start.

| Finding | Fix | Files |
|---|---|---|
| B-016 (S0) | Chart grid printed Tamil script in English mode. `occupantAbbr` resolves against `GRAHA_ABBR_EN` when `lang === "en"`. Fixed at the render funnel, **not** in `buildD1CellDetail` (cell builders are pure data and asserted as such). | `web/components/dashboard-charts.tsx` |
| B-017 (S0) | `ChartLegend` under D1 and D9: graha letters → full names, the R/C/✦/V marks, lunar-nodes explainer. Built from the chart's own occupants; D9 legend suppresses combustion. | `dashboard-charts.tsx`, `web/lib/dashboard-i18n.ts` (`CHART_LEGEND`) |
| B-008 (S0) | Guest modal defaulted `birthTimezone: "Asia/Kolkata"` for everyone → silently wrong charts outside India. Now `Intl.DateTimeFormat().resolvedOptions().timeZone`. **Second half closed 2026-08-23:** the birth-time field no longer pre-fills `"12:00"`; a blank submission still computes (the backend requires a time — `_birth_datetime_utc` raises without one) but against a named `ASSUMED_BIRTH_TIME`, the assumed clock time is not printed beside the name as though stated, and the result carries an "Approximate — birth time not provided" notice above the grid. | `dashboard-guest-chart-modal.tsx`, `dashboard-i18n.ts` (`GUEST_CHART`), new `dashboard-guest-chart-modal.test.tsx` (4 tests) |
| A-005 / B-009 (S2) | `field_time_optional` names the consequence ("Even 15 minutes changes your Lagna and every house in the chart…"). Also applied to the guest modal's birth-time field. | `web/lib/i18n.ts`, `dashboard-guest-chart-modal.tsx` |
| A-006 (S4) | `/learn/why-birth-time-matters` opens as `DashboardLearnArticleModal` from the setup birth-time field — modal, not navigation, so signup state survives. | `dashboard-setup-tab.tsx` |
| A-029 / A-031 / B-024 (S2) | Porutham: "Most families proceed at 5–8 out of 10" against the score ring; named-blocker de-escalation beside the Rajju/Vedha chip. Verdict wording unchanged. | `dashboard-tools-porutham-nova.tsx` |
| A-012 | Dead App Store link (`id0000000000`) null-guarded behind `APP_STORE_URL`. | `dashboard-setup-tab.tsx` |
| A-041 **partial** | `GLOSSARY` 20 → **42** entries. Keys now available: `panchangam, tithi, karana, vara, yogam, paksham, rahuKalam, yamagandam, kuligai, nallaNeram, abhijit, hora, chandrashtama, karinaal, soolam, parigaram, amirdhadhi, muhurtham, lagnam, pada, peyarchi, sadeSati` (plus the original 20: `dasha, bhukti, rasi, nakshatra, gochar, shadbala, sthanaBala, digBala, kalaBala, chestaBala, naisargikaBala, drikBala, varga, navamsa, atmakaraka, karakamsa, yoginiDasha, ashtottariDasha, kalachakraDasha, charaDasha`). **The index page does not exist** — that's T9. | `web/lib/glossary.ts` |
| **Enabler** | `GlossaryTerm` rewritten to **portal its tooltip to `<body>`** with viewport positioning, flip-below-when-no-room, Escape, scroll/resize reposition. It used to render as an absolutely-positioned child and was clipped by any `overflow:hidden` ancestor. **Gloss anywhere freely now.** | `web/components/glossary-term.tsx` |
| A-033 **partial** | Calendar day panel: 7 spec rows + the "Panchangam" heading glossed. `data-spec-row` hook added so tests anchor on the row, not label nesting. | `dashboard-calendar-tab-nova.tsx` |
| A-014 | Today ribbon: the day's star was labelled "Nakshatram" while the natal star is "Birth Star". Renamed "Today's star" and glossed; tithi glossed. | `dashboard-today-ribbon-nova.tsx` |
| **T1 / A-013 part** | Today ribbon kala glossing re-landed on the portalled tooltip: `Segment` gained `glossary?: GlossaryKey`, all four kalas (`rahuKalam`, `yamagandam`, `kuligai`, `nallaNeram`) tagged and wrapped at the legend render site, obsolete "deliberately not glossed" comment removed. | `dashboard-today-ribbon-nova.tsx` |
| **T2 + T3 / A-022, A-023 (S2)** | Sade Sati card rebuilt: prevalence, scope, current phase, **phase end date, cycle end date**, and a "what helps" action, with the Moon reckoning labelled *Primary reckoning* and the Lagna one *Cross-check*. Backend now returns `role`, `phaseEndsOn`, `cycleEndsOn` — cycle end walks Saturn forward through the remaining Ezharai rasis via the existing final-egress finder (which already handles the retrograde triple-crossing). | `dashboard-family-charts-hybrid.tsx`, new `web/lib/sani-cycle-card.ts`, `dashboard-i18n.ts` (`SANI_CYCLE_CARD`), `app/schemas/transits.py`, `app/services/transit_service.py`, `packages/shared/src/types/index.ts`, `tests/test_transits_api.py` |
| Guards | `dashboard-charts.test.tsx` (9 tests, pins **rendered** script — the data-builder tests passed either way, which is why the bug survived), `web/lib/glossary.test.ts` (5 integrity tests), `dashboard-today-ribbon-nova.test.tsx` (1), `dashboard-family-charts-hybrid.test.ts` (2). | new files |

Also in the tree, from separate density work — leave alone unless it collides:
a `collapsible`/`summary` disclosure on `dashboard-today-deepdive-extras-nova.tsx`,
used to collapse the guidance card on `dashboard-life-areas-tab-nova.tsx`, plus
colour/contrast changes in `dashboard-globals.css`, `dashboard-ui.tsx`,
`drawer-panel.tsx`, `e2e/theme-contrast.spec.ts`.

**Score: 3 of 7 S0 findings fully closed; ~16 of 61 findings closed or part-closed.**

Verified 2026-08-23 on this tree: `npx tsc --noEmit` clean apart from the one known
pre-existing error below; `npx vitest run` → **59 files, 484 tests, all green**;
`pytest tests/test_transits_api.py` → 7 passed; `ruff check` clean on the touched
service; no BOM and valid UTF-8 on every touched file.

Also landed 2026-08-23, tidying the work above rather than closing new findings:
`GlossaryTerm` now sets `aria-describedby` (portalling had cut the panel loose from
its trigger for screen readers) and paints at `zIndex: 10000` so a gloss inside a
9999 modal is not hidden behind it; the porutham verdict strings and the Sani card's
labels moved out of inline ternaries into `dashboard-i18n.ts` with the required
new-Tamil review markers; `CHART_LEGEND.flagsHeading` — written but never rendered —
now labels the marks row; and the Saturn egress search runs **once per request**
instead of three times, with a failure degrading to omitted end dates rather than a
500 on the Sade Sati card.

## 3. Gotchas — these will cost you time otherwise

1. **`PrintRasiChart` in `web/components/chart-generate-inline-panel.tsx:187` is
   deliberately Tamil-only** (hardcoded `நவாம்சம்`/`லக்னம்`, `genderTA`, no `lang`
   prop). It is a traditional printed jathagam sheet. **Do not "fix" it.**
2. `web/components/dashboard-calendar-day-drawer-nova.test.tsx:226` has a
   **pre-existing** typecheck error (`Property 'mock' does not exist on type
   '((delta: number) => void) | Mock<Procedure>'`). Untracked in-flight work by
   someone else, failing before this programme started. Don't attribute it to your
   changes; coordinate before rewriting it.
3. `plainLang()` and `plainLangBiText()` in `web/lib/plainlang.ts` still have
   **zero callers tree-wide** (re-verified 2026-08-23). A complete plain-language
   table for planets, rasis, Chandrashtama, retrograde, combust and Vargottama is
   written and switched off. Several tasks below are "wire the thing that exists".
4. There is still **no glossary page, no help page, no FAQ route** in `web/app`
   (`find web/app -ipath "*gloss*"` → empty).
5. `web/lib/tn-cities.ts` is a hand-listed 145-city array (Tamil Nadu + Tamil
   diaspora). Portland, Boston, Denver, Philadelphia and Minneapolis are absent.
6. `web/components/dashboard-today-tab-nova.tsx` does **not** import `GlossaryTerm`.
   The Today *tab* is still the untouched jargon wall; only the ribbon and the
   deep-dive extras were glossed.
7. **The audit's file citations are mostly exact but not all** — it was written
   statically. A-036's is wrong (see T17). Grep for the *string* before trusting a
   `file.tsx:line` pair, and re-check line numbers, which have drifted as this
   programme edits the same files.
8. **Your terminal may render Tamil source as `ச…` escapes. The files do not
   contain escapes.** `git diff` and grep output in a Windows PowerShell console
   showed `HySaniCard`'s labels that way; a byte-level check found **zero**
   `\u0b` sequences anywhere under `web/components`, `web/lib` or `app/services`.
   Do not "fix" an escape you see in tool output — verify with
   `python -c "print(b'\\u0b' in open(f,'rb').read())"` first, and never rewrite a
   Tamil literal on the strength of how it was displayed.
9. **`GlossaryTerm`'s portalled tooltip sits at `zIndex: 500`.** That clears the
   drawer (200) and the rectification overlay (500, and the portal wins on DOM
   order), but the share-card and learn-article modals render at **9999** — gloss a
   term inside one of those and the definition paints behind it. Raise the tooltip's
   z-index at the same time you add the first such call site.
10. **`GlossaryTerm` has no `aria-describedby`.** The button carries `aria-expanded`
    and the panel `role="tooltip"`, but portalling moved the panel out of the
    button's DOM neighbourhood, so nothing associates the two for a screen reader.
    Give the panel an `id` and point `aria-describedby` at it while open — small fix,
    and this repo has a permanent axe gate.

## 4. Work, in priority order

### TIER 1 — before launch

**T1. ✅ DONE (2026-08-23)** — Today-ribbon kala glossing landed; see §2.
Still owed: the **browser check at 390px** that the portalled tooltip is not clipped
inside the ribbon's two `overflow: hidden` ancestors. The test that guards it is a
jsdom render, which cannot see clipping.

**T2. ✅ DONE (2026-08-23)** — Sade Sati prevalence / scope / phase / end dates /
action landed, backend included; see §2. The duplicate-egress and 500-risk
follow-ups were closed the same day: the search runs once per request and a
`ValueError` from `find_saturn_egress_jd` now omits the dates (logged) instead of
failing the response. **Still owed:** a test with Saturn parked within
`_EGRESS_HOP_DAYS` of a rasi boundary, which is the case the hop constant exists
for and nothing currently exercises.

**T3. ✅ DONE (2026-08-23)** — Moon reckoning is now labelled *Primary reckoning*,
Lagna *Cross-check*, both in the UI and as a `role` field on the API.

**T4. Ask detail level at signup (A-039, S4)** *(start here)*
`BEGINNER`/`BALANCED`/`TRADITIONAL` exists, defaults to `BALANCED`
(`app/schemas/auth.py:59`), and is buried in `dashboard-settings-session-tab.tsx:641`.
Note the audit missed a second picker at `dashboard-setup-tab.tsx:864` — it is a
three-way toggle labelled Beginner/Balanced/Traditional, i.e. still a settings
control, not a question. Ask it once during onboarding in plain terms — *"How much astrology do you already
know?"* → "I've heard the words but never studied it" maps to `BEGINNER`. Consumers
already exist (`advanced-astrology-gate.tsx`, `dashboard-dasha.tsx`, journal,
plan-decisions).

**T5. Promote the two/five-minute reading to the first post-calculation screen**
`app/services/one_minute_reading_service.py` produces the best plain-language prose
in the product (jargon quarantined in a "what this rests on" line). It renders
inside Family & Charts behind a member selector
(`dashboard-family-charts-hybrid.tsx:1017`). Both personas would have a different
first session if this were what they saw after their chart calculated. Also add it
as a third onboarding checklist step — the checklist is currently two data-entry
steps (`web/lib/i18n.ts:1093-1096`) and no outcome.

**T6. Write `/learn/vedic-vs-western` (B-001, S0)**
Highest-leverage missing artefact for Jake. Four claims: different zodiac
calculation from Western; rising sign (lagnam) over sun sign; 27 lunar stars as well
as 12 signs; life runs in multi-year planetary periods. Link from the hero, the nav,
and first dashboard load. Add to `LEARN_ARTICLES_CONTENT`
(`web/components/dashboard-learn-content.ts`) so it's readable in-app too. Today's
nearest article, `/learn/what-is-thirukanitham`, opens on "Drik vs Vakya" — an
intra-tradition question only an insider has.

**T7. Plain-English line on the marketing hero sample card (B-002, S0)**
`web/components/home-content.tsx:118-122` — the one concrete demonstration of the
product is five untranslated proper nouns ("Ekadasi · Kettai · Vishkambha", "Moon
Dasa · Moon Bhukti"). Add a plain second line: "A steady day. Best hour:
11:53–12:41." The card already computes both.

**T8. Collapse the four parallel timing systems (A-013, S2)**
Today shows Nalla Neram, Gowri, Abhijit and Horai side by side with Rahu Kalam /
Yamagandam / Kuligai. A reader who knows only Rahu Kalam cannot tell which to obey
and may act on the wrong one. Promote **one** recommended window (the app already
computes `title_recommended_nalla_neram`); demote the rest behind "Other traditional
timings", each with a one-line "what this system is".

**T9. First-result comprehension layer** *(second audit, Tier 1 #1)*
On first Today load: what the score means, what "avoid" actually scopes to (new
beginnings — ongoing work is unaffected), one action, and a Why trail. Pairs with T5.

### TIER 2 — first month

- **T10.** Ship `/dashboard/glossary` as an index over `GLOSSARY`, linked from nav
  and from a "see all" in `GlossaryTerm`. (A-041)
- **T11.** Gloss the Today **tab** itself (B-011, S0 — still fully open). Import
  `GlossaryTerm` into `dashboard-today-tab-nova.tsx` and wrap: the "Dasa layer /
  Panchangam / Transit" score components (A-016), "Horai now" → "Planetary hour"
  with the Tamil name secondary (A-017), and the Chandrashtama chip (A-015 — reuse
  the definition already in `chandrashtama_warning`; the
  `DashboardLearnArticleModal` for this topic is already wired in
  `dashboard-personal-shared.tsx:106`).
- **T12.** Wire `plainLangBiText` as the universal tooltip source in `BALANCED`
  mode — literally what `mode_balanced_desc` ("Some terms, with tooltips") already
  promises the user. (A-042, B-021)
- **T13.** Decouple language from expertise: an English-language reader should get
  English planet names regardless of detail level. Today `tPlanetLord`
  Tamil-transliterates and the plain gloss is `BEGINNER`-only. (B-031)
- **T14.** Disambiguate the three false-familiarity terms in English mode on first
  use per screen: **Yoga** (reads as exercise), **House**, **Transit**. Glossary
  entries exist for two. (B-012/13/14)
- **T15.** Calendar: finish A-033 (the remaining terms outside the day panel) and
  add a plain-English day summary line ("A generally favourable day. Avoid
  10:30–12:00.") so the screen has value without the vocabulary. Then make
  interpretation first, facts progressive. (B-026)
- **T16.** Planet table: `col_house` "House (L)" → "House (from Lagna)"
  (`web/lib/i18n.ts:289`, A-020); tooltip the dignity chips
  Combust/Vargottama/Cazimi (A-021); give Pada a plain rendering, "quarter of the
  star, 1–4" (B-020).
- **T17.** "Activated by current Dasha" → "Active right now (your current planetary
  period is triggering it)" (A-036). **The audit's file citation is wrong** — the
  string is not in `dashboard-life-areas-yogas-doshams-nova.tsx`; it lives in
  `dashboard-explore-dosham-nova.tsx:423` **and** `dashboard-explore-yogam-nova.tsx:373`,
  as an inline ternary in each. Change both.
- **T18.** Cultural framing paragraphs above porutham, muhurta and remedies — reuse
  the shipped Learn articles. Surface the existing secular-remedy mode
  (`remedies_mode_secular`) as a first-class choice, not a hidden mode. Change
  "Prescribed — wear these" to descriptive register. (B-022, B-035, B-037, A-038)
- **T19.** Defer Family Vault setup until after a first result; rename "vault" →
  "your family"; auto-create on first member. (A-007, A-010)
- **T20.** Dasha panel titles: "Dasa · Bhukti · Antaram" → "Life periods — major,
  sub, and minor"; "Vimshottari Dasa timeline" → "Your life periods (Vimshottari
  system)". Wire the existing `dasha`/`bhukti` glossary entries, which this panel
  does not use. (B-029, B-030)

### TIER 3

A-024 (retitle chart-explanation sections by outcome, traditional term as subtitle),
A-025 (make "Tap to explain" a visible chip, not a `title` attribute),
A-026/A-027 (deep-link terms into Explore; rename the tab "Understand"; index
interface vocabulary into its search), A-028 (four new Learn articles: what a
dasa/house/lagnam is, what the daily score means), A-037 (lead yoga rows with the
effect, Sanskrit name as subtitle), A-008 (collapse lat/lng behind a disclosure),
A-040 (hide raw IDs in Settings), A-004 (bilingualise + de-jargon the login left
panel), B-004 (populate `desc` on every nav item; lead English labels with
function), A-032 (Person 1/2 outside MARRIAGE context), B-027/B-028 (Tamil month
Gregorian range; reuse the existing Waxing/Waning rendering in Calendar), B-032/B-033
("Chart patterns (yogas)", "Difficult placements (doshams)"), B-038 (frame Name Lab
as a traditional practice, why before suggestion).

Plus from the second audit: a **360px/390px mobile pass** ensuring safety/action
text precedes dense tables, and an Advanced mode with prerequisites for Vargas /
Shadbala / alternate dasas.

## 5. Needs a human decision — do NOT act unilaterally

**B-006, the birth-place dataset.** `web/lib/tn-cities.ts` is 145 hand-listed cities;
any non-diaspora user is asked to hand-enter latitude and longitude on the first
form. This is the single remaining hard functional blocker. Fixing it means picking
a geocoder (vendor, API key, cost, privacy) or bundling a world-cities dataset.
**Ask the owner which, and whether birth-place lookup may make a third-party network
call, before implementing.** Interim non-blocking improvements you *may* do: a map
picker or a "paste a Google Maps link" fallback, and clearer timezone confirmation
(B-007, B-010).

## 6. Verification (run all before reporting done)

```powershell
Set-Location 'D:\sanstro\web'
npx tsc --noEmit -p tsconfig.json          # expect ONLY the known pre-existing
                                           # dashboard-calendar-day-drawer-nova.test.tsx:226 error
npx vitest run                             # baseline 2026-08-23: 58 files, 480 tests, green
npx next lint --file <each file you changed>
```

If you touch anything under `app/`, the backend suite needs the **Postgres** test DB —
`tests/conftest.py` refuses any database not literally named `vinaadi_test`, so the
SQLite offline URL in CLAUDE.md will not run these:

```powershell
Set-Location 'D:\sanstro'
$env:PYTHONUTF8 = "1"
$env:JOTHIDAM_DATABASE_URL = "postgresql://slw_admin:slw_dev_password@localhost:5433/vinaadi_test"
$env:JOTHIDAM_TEST_DB_RESET_ACK = "I_UNDERSTAND_THIS_WIPES_TEST_DB"
$env:JOTHIDAM_RUN_SCHEDULER_IN_WEB = "false"
.\.venv\Scripts\python.exe -m pytest tests/test_transits_api.py -q --no-cov
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
Today/Calendar layout. Both audits were static — neither ran the app, so mobile
density and information hierarchy need eyes, not grep.

## 7. Working agreement

- Work in priority order; **T1 first**. Land tasks in small reviewable commits.
- Add a regression test for anything user-visible you fix. Prefer tests that pin
  **rendered output** over tests that pin data structures — the chart bug survived
  precisely because the data-layer tests passed either way.
- If a fix would dilute doctrinal accuracy, don't. The rule this codebase works to:
  **Layer 1** plain-language meaning always visible, **Layer 2** the named
  traditional concept one tap away, **Layer 3** the calculation and doctrine one
  more tap away — never hidden, never first.
- No negative finding renders without prevalence, scope, duration and agency in the
  same viewport.
- Report honestly what you did and didn't finish, and flag anything you changed that
  you could not verify in a browser.
