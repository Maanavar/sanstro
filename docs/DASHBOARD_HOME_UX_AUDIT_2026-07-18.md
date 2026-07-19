# Dashboard Home — UX/UI Audit (2026-07-18)

Scope: the **Today tab / dashboard home** only — `web/components/dashboard-hero.tsx`
(topbar + identity subbar), `dashboard-today-tab-nova.tsx` (hero card, deep-dive
bridge), `dashboard-today-glance-nova.tsx` (Life Areas / Dasa Chapter / Family
Today / Remedy For You / Coming Up), `dashboard-today-activity-board-nova.tsx`
("Is today okay for…?"), `dashboard-today-ribbon-nova.tsx` ("Your day" timeline),
and the workspace footer in `dashboard-workspace.tsx`. Not the rest of the app —
see `docs/DASHBOARD_VISUAL_GRAPHICS_AUDIT_2026-07-18.md` for a whole-dashboard
graphics/animation pass done the same day, and `docs/DASHBOARD_AUDIT_FIXES.md`
for the 2026-07-13 five-stakeholder pass (DASH-01..17, all closed).

Triggered by four things flagged directly against the live page: the footer,
duplicated bilingual section titles, a Family Today labelling bug, and a
request to verify nothing on this surface is hardcoded. All four are fixed
below (`DHOME-01..04`); `DHOME-05` is a small related fix found while in the
Family Today code; `DHOME-06..08` are additional findings from the audit pass,
left open for a decision.

Status legend: `[x]` fixed this session · `[ ]` open, not fixed.

---

## Fixed this session

### DHOME-01 `[x]` Section titles showed in both languages at once, in English mode

**Problem:** `GlanceHeader` (used by Life Areas, Dasa Chapter, and Family
Today) and the activity board's own `<h3>` both rendered the title in the
active language, then — only when `lang !== "ta"` — appended a second, faint
Tamil copy of the same title right next to it. So in English mode, four
section headings on the page read as `Life Areas வாழ்க்கைத் துறைகள்`,
`Family Today குடும்பம்`, `Is today okay for…? இன்று நல்ல நாளா?`, etc. In
Tamil mode there was no echo at all — asymmetric, and reads as broken
language switching rather than a deliberate glossary.

This is a **different** pattern from the Tamil-name gloss on nakshatra cards
in `dashboard-explore-nakshatram-nova.tsx` / `dashboard-explore-tab-nova.tsx`
(showing a proper noun's Sanskrit/Tamil name next to its English name, e.g.
"Ashwini அஸ்வினி") — that one is intentional reference information and is
out of scope here. Don't conflate the two if this pattern is revisited later.

- **Files:** `dashboard-today-glance-nova.tsx` (`GlanceHeader`, 3 call sites:
  Life Areas, Dasa Chapter, Family Today), `dashboard-today-activity-board-nova.tsx`
  (`"Is today okay for…?"` header).
- **Fix:** removed the `{lang !== "ta" && <span aria-hidden>{titleTa}</span>}`
  echo block in both places. Titles now render in the active language only,
  same as every other heading on the page.

### DHOME-02 `[x]` Family Today: no score ring, and the same word for visibly different scores

**Problem, two parts of the same root cause:**

1. Each member tile printed `m.label` — the **raw backend enum token**
   (`"BALANCED"`, `"GOOD"`, `"STRONG_SUPPORT"`, …, i.e.
   `snapshot.daily_guidance.data.label` straight off `app/services/family_vault_service.py`)
   — directly into the DOM with no `t()`/language lookup and no formatting.
   It happened to already read as title-ish case in practice, but it was
   never localized (Tamil mode showed the English enum) and was one raw
   string, not a phrase.
2. `BALANCED` (like every other label) spans a wide score band — wide enough
   that a member at 45 and a member at 63 both land in it. Those two scores
   render visibly different star counts via `NovaStarRow value={score/20}`
   (2.5★ vs 3.2★), so the tile showed **two different star ratings captioned
   with the identical word**, which reads as a labelling bug even though each
   half was individually "correct" — this is exactly what was reported
   ("balanced comment for 2 star people, balance for 3 star people also").

   For comparison, the Family **tab** (`dashboard-family-tab-nova.tsx` →
   `ScoreRing` from `dashboard-family-shared.tsx`) never had this problem: it
   shows the exact score in a ring and a real localized insight sentence
   (`highlightTa`/`highlightEn`), never the raw label. The Today-tab glance
   card had drifted from that pattern during the 2026-07-18 redesign.

- **File:** `dashboard-today-glance-nova.tsx`,
  `DashboardTodayFamilyRemedyRowNova`.
- **Fix:** replaced the avatar-initial-circle + `NovaStarRow` + raw
  `{m.label}` with the same `ScoreRing` component the Family tab uses (exact
  score + color, so two members in the same coarse band still read as
  visibly different), and the verdict word now goes through
  `getScoreVerdictFromGuidance(m.label, m.individualScore, lang)` — the same
  function the hero's own score dial and the Life Areas tiles already use —
  so it's a real localized phrase, not a raw token, and is consistent with
  the rest of the page.
- Also added `role="group"` + `aria-label` on each tile (name, verdict, and
  score together) — the original had only a `title` tooltip, which doesn't
  reach screen readers or touch devices.

### DHOME-03 `[x]` Footer redesigned

**Problem:** the footer was a single flex-wrap row cramming brand +
tagline, two link columns, and the morning-guidance toggle into one line;
on medium viewports the toggle would wrap onto its own orphaned line below
the links. It also still depended on `globals.css`'s Classic-era `.cd-footer*`
rules (literal cream/tan hex), patched piecemeal per-theme in
`dashboard-nova.css` rather than being token-driven from the start.

- **Files:** `dashboard-workspace.tsx` (footer JSX), `dashboard-nova.css`
  (new `.nova-footer__*` rules, see the "Footer redesign" block near the end
  of the file).
- **Fix:** rebuilt the top of the footer as a proper 3-column grid — brand
  identity · site navigation (still real `<button onClick={goToTab}>`
  navigation, not link-styled spans, per DASH-13) · one clearly-labelled
  "Quick setting" cell holding the morning-guidance toggle — instead of it
  floating unlabeled at the end of a flex row. Collapses to 2 columns at
  860px and 1 column at 560px. Fully token-driven (`var(--color-*)`), so it
  needs no per-theme patch. Kept the outer `.cd-footer`/`.cd-footer__inner`/
  `.cd-footer__wordmark`/`.cd-footer__copy`/`.cd-footer__divider`/
  `.cd-footer__bottom` classes in place — those carry the sticky-footer
  flex mechanics (`margin-top: auto`, see `dashboard.css`) and the Tamil
  font-family hooks, and didn't need to change.

### DHOME-04 `[x]` Verified: no hardcoded data on this surface

Walked every file in scope (hero, hero score dial, Life Areas tiles, Dasa
Chapter, Family Today, Remedy For You, Coming Up, the activity board, the
day-timeline ribbon, the footer, plus `useStreak`/`useEveningPreview`) for
`Math.random`, mock/stub/demo/sample markers, and fixed numeric literals
standing in for real data. Found none — every number and string traces back
to a prop, an API response, or `localStorage` (the streak counter, which is
itself server-reconciled via `pingStreak`).

One thing worth being precise about, since it looks similar to a hardcode at
a glance: `dashboard-today-activity-board-nova.tsx`'s `ActivityCardNova` sets
`NovaStarRow value={good ? 4 : 2}` — a **fixed 2-value mapping**, not
invented data. It's a documented, deliberate re-encoding of the engine's
real three-way SUPPORTS/CAUTION verdict onto a 5-star scale, because no finer
precision exists in the underlying data (see the component's own doctrine
comment). This is different in kind from DHOME-02's bug, where a real
continuous score (0–100) was being thrown away in favor of a coarser signal
that then visibly disagreed with itself.

### DHOME-05 `[x]` Family Today silently dropped members past the third

Found while fixing DHOME-02: the card always does
`familyAggregate.members.slice(0, 3)` with no indication when the family has
more than 3 members — the row just stopped, which reads as "that's everyone"
rather than "there are more, one click away." Added a `+N more →` link
(localized) under the tile grid when `members.length > 3`, routing to the
same `onGoToFamily` handler the section header's link already uses.

---

## Open findings (not fixed this session)

### DHOME-06 `[ ]` P2 — Avatar-menu strings are English-only in Tamil mode

`dashboard-hero.tsx:485-495` — "Signed in as", "Settings", "Sign out" in the
account dropdown are literal English strings with no `lang` branch, unlike
every other string on this surface. Small surface area (one dropdown), but
visible on every session for a Tamil-mode user who opens it.

**Suggested fix:** three `t()`/inline-ternary lookups, same pattern as the
rest of the file. Low effort, no architecture change.

### DHOME-07 `[ ]` P3 — Hero score dial pairs an exact number with a coarse star row for the same figure

`dashboard-today-tab-nova.tsx:569-570` — `NovaScoreDial` (exact 0–100 arc +
number) is immediately followed by `NovaStarRow value={dialScore / 20}` for
the identical score. Unlike DHOME-02, this isn't a bug (nothing disagrees —
it's one score shown two ways for one person), but it is visual redundancy
in the single most-viewed element on the page. Whether to keep both, drop
the stars, or keep the stars and drop the ring is a design call, not
something to change unprompted — flagging for a decision rather than fixing.

### DHOME-08 `[ ]` P3 — "Quick setting" cell in the new footer only holds one control

The redesigned footer (DHOME-03) gives the morning-guidance toggle its own
labelled column so it stops looking orphaned, but that leaves a slightly
underfilled column on wide viewports (one toggle, a lot of white space). If
another lightweight, page-level setting shows up later (e.g. a footer-level
language shortcut, distinct from the topbar's), it has a natural home
already built. Not a defect — noted so the empty space isn't "fixed" by
stretching the existing toggle instead of adding a second real control.

---

## Verification

- `web`: `npx tsc --noEmit` — clean.
- `web`: `npx vitest run` — 31 files / 179 tests passed (includes
  `dashboard-today-glance-nova.test.tsx`, `dashboard-today-activity-board-nova.test.tsx`).
- `web`: `npx eslint` on the three touched files — clean.
- **Not done:** live browser pass (visual check of the new footer grid at the
  860px/560px breakpoints, and the Family Today ring tiles with a real
  multi-member family vault). Recommended before this branch ships, per the
  same "browser pass owed" pattern flagged on several other recent items in
  memory.
