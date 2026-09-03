# Vinaadi Mobile — Product Design Strategy (remaining work)

**Last updated:** 2026-07-05 (trimmed to open items only — see note below)
**Role:** Product Design + UX Strategy

> **2026-07-05 audit note:** This doc originally proposed a 5-tab nav restructure (adding "Insights") plus ~13 feature adaptations, with a phased build order. A code audit confirmed the **5-tab nav shipped in full** — `mobile/app/(tabs)/_layout.tsx` has `today`, `panchangam`, `insights`, `tools`, `me`, and `mobile/app/(tabs)/insights/index.tsx` is a fully-built, data-wired screen. Most of the individual feature proposals also shipped, several exceeding the original spec. Sections describing what's already built were removed; what remains below is the real backlog plus two open product decisions this doc's original recommendations got overruled on.
>
> **Note:** `docs/mobile/MOBILE_DESIGN_BRIEF.md` still describes the old 4-tab nav in its "Authority" section — that's now factually wrong and has been flagged there. Trust this doc's nav description (5-tab, shipped) over that one until it's corrected.

---

## Open product decisions (not build tasks — need an owner call)

### Retrospective — dedicated screen built despite "no separate screen" recommendation

This doc originally said retrospective correlation should live only inside journal entries and a "Patterns" card in Insights, explicitly "not a separate screen." A dedicated `/retrospective` screen (event-type chips, description, correlation) was built anyway, reachable from Insights, in addition to the in-context journal-entry cards and Insights' `JournalPanel` pattern line. The underlying job is served either way — this just needs someone to decide whether the extra screen is worth keeping (more discoverable) or should be folded back into the contextual pattern (less nav surface), and update this doc to match whichever way it's decided.

### Goals — dedicated screen built despite "eliminates need for a goals screen" recommendation

The Muhurta "Quick Muhurta" / "Life Decision" segmented-control mode from this doc's original recommendation was built exactly as spec'd — that part is confirmed working. But a full dedicated `/goals` screen (create/list persisted goals) was *also* built, which the original doc argued wouldn't be necessary. Same call needed as Retrospective above: keep both entry points, or consolidate.

---

## Remaining build items

### Life Events — verify the push notification touchpoint

**Status:** The Today-screen countdown panel and the Insights-tab `RiverTimeline` component are both built and working. Not confirmed: whether a life-event-specific "60 days before a significant window opens" push notification exists (`app/scheduler.py`/`ambient_alerts_service.py` have generic alert infrastructure, but a life-event-specific trigger wasn't confirmed present or absent). Check before assuming either way.

### Birth Time Rectification — confirm swipe-per-question mechanic

**Status:** `/rectification/index.tsx` has a real `events → results → applied` flow that produces a corrected time range and an apply CTA — the feature works. Not confirmed (based on a partial file read): whether the events step is the originally-specified "one question per screen, swipeable" interaction, or a single multi-field form. If it's the latter, the swipeable step-wizard treatment below is still worth doing — mobile is genuinely better suited to it than a single form (one question per screen = zero cognitive overload; swipe forward/back as a natural progress/undo gesture).

### Annual Wrapped — full-screen story presentation + push triggers

**Status:** `/wrapped/index.tsx` has real content matching most of the originally-specified slide types (Overview / Dasha Era / Peak / Stats / Reflection / Life Area / Closing) in a horizontal paginated `StoryRail`, with share-by-long-press already working via `ShareCaptureView`. Two gaps remain:

1. **Presentation:** it's a conventional in-app screen with its own header, back button, and year-chip nav — not a full-screen, no-tab-bar, tap-to-pause Instagram/Spotify-Wrapped-style story as originally specified.
2. **Push triggers:** no evidence found of a solar-return-date or Dec 26–31 push notification that surfaces Wrapped as an event rather than something a user has to navigate to and find.

**Fix (if still wanted):** Convert the screen presentation to a modal, full-screen, `presentation: 'fullScreenModal'` route with tap-to-pause/swipe navigation (no persistent header/tab bar). Add scheduled-notification triggers on solar return and Dec 26–31, following the existing queued-notification pattern already used elsewhere in the notification system (see `JADHAGAM_D1_NUDGE` in the notification dispatch service for the pattern to copy).

### Share cards — Today's score ring still shares as plain text

**Status:** `ShareCaptureView` (long-press → `react-native-view-shot` → `react-native-share`) is real and already used in Insights' `AreaStoryCard` and Wrapped's `SlideCard` — matches the original spec closely for those two. The one gap: Today's score ring — the doc's original flagship example — still shares as plain text via `Share.share()`/a WhatsApp deep link, not an image capture of the ring.

**Fix:** Wrap the Today score ring in `ShareCaptureView` the same way `AreaStoryCard` does it.

**Cleanup:** The older `ShareCard.tsx` component (also `react-native-view-shot`-based) is now orphaned dead code, fully superseded by `ShareCaptureView`. Safe to delete once confirmed it has zero remaining imports.

---

## Spot-check only (exceeded spec, no action needed unless auditing)

- **Divisional chart chips, Synastry radar, Gowri/Peyarchi contextual cards, Activity timing chips, Life Area mini-bars/swipeable cards, Journal quick-capture** — all confirmed built, several with extra redundant entry points beyond what was originally specified (e.g., Synastry has both the spec'd Family Vault "Compare" bottom sheet *and* a standalone `/synastry` screen). Not a problem, just belt-and-suspenders — no cleanup needed unless someone wants to reduce nav surface.
